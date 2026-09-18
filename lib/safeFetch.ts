import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';
import zlib from 'zlib';
import type { IncomingMessage } from 'http';
import type { LookupFunction } from 'net';
import type { Readable } from 'stream';

// ============================================================================
// SSRF-safe HTTP GET for server-side fetching of user-supplied URLs.
//
// Guarantees:
//  - The IP that is validated is the IP that is connected to. Validation happens
//    inside the socket's `lookup` hook, so there is no gap between "check" and
//    "use" for DNS rebinding to exploit.
//  - IP-literal hosts (which skip DNS entirely) are validated up front.
//  - Redirects are followed manually and every hop is fully re-validated.
//  - The response body is capped (after decompression) and the whole exchange
//    shares one deadline.
// ============================================================================

export type SafeFetchErrorCode =
  | 'invalid_url'
  | 'blocked'
  | 'resolve'
  | 'too_many_redirects'
  | 'too_large'
  | 'timeout'
  | 'network';

export class SafeFetchError extends Error {
  constructor(
    public readonly code: SafeFetchErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  /** Overall deadline in ms covering DNS, connect, redirects and body download. */
  timeoutMs?: number;
  /** Max redirect hops to follow. */
  maxRedirects?: number;
  /** Max decompressed body size in bytes. */
  maxBytes?: number;
}

export interface SafeFetchResponse {
  status: number;
  /** Lower-cased header names, as provided by Node. */
  headers: IncomingMessage['headers'];
  /** Final URL after redirects (fragment stripped). */
  url: string;
  /** Reads the body as UTF-8 text, enforcing the size cap. */
  text(): Promise<string>;
  /** Abandons the response without reading the body. */
  destroy(): void;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

// ---------------------------------------------------------------------------
// IP blocklist (non-public ranges). Anything unparseable is treated as blocked.
// ---------------------------------------------------------------------------

const blockList = new net.BlockList();

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8], // "this network" (0.0.0.0 reaches localhost on many systems)
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT / some cloud-internal ranges
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, incl. cloud metadata 169.254.169.254
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.88.99.0', 24], // deprecated 6to4 relay
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + 255.255.255.255 broadcast
];

// IPv4-mapped IPv6 (::ffff:a.b.c.d) needs no rule of its own: BlockList maps it onto the IPv4 rules
// above. Do NOT add ::ffff:0:0/96 here — BlockList also maps plain IPv4 into that range, which
// would block every IPv4 address.
const BLOCKED_V6: Array<[string, number]> = [
  ['::', 96], // unspecified, loopback and deprecated IPv4-compatible (::a.b.c.d)
  ['64:ff9b::', 96], // NAT64, embeds an IPv4 address
  ['64:ff9b:1::', 48], // local-use NAT64
  ['100::', 64], // discard-only
  ['2001::', 32], // Teredo, embeds an IPv4 address
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4, embeds an IPv4 address
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['fec0::', 10], // deprecated site-local
  ['ff00::', 8], // multicast
];

for (const [net4, prefix] of BLOCKED_V4) blockList.addSubnet(net4, prefix, 'ipv4');
for (const [net6, prefix] of BLOCKED_V6) blockList.addSubnet(net6, prefix, 'ipv6');

export function isBlockedIp(ip: string): boolean {
  try {
    if (net.isIPv4(ip)) return blockList.check(ip, 'ipv4');
    if (net.isIPv6(ip)) return blockList.check(ip, 'ipv6');
  } catch {
    // fall through — fail closed
  }
  return true;
}

// ---------------------------------------------------------------------------
// Pinned DNS lookup: validation and connection use the same resolution.
// ---------------------------------------------------------------------------

function createPinnedLookup(onBlocked: () => void): LookupFunction {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, '', 4);
      if (addresses.length === 0 || addresses.some((a) => isBlockedIp(a.address))) {
        onBlocked();
        return callback(new Error('Blocked address'), '', 4);
      }
      if (options.all) {
        return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addresses);
      }
      return callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

// ---------------------------------------------------------------------------
// Single request (no redirect handling)
// ---------------------------------------------------------------------------

function requestOnce(
  url: URL,
  headers: Record<string, string>,
  signal: AbortSignal
): Promise<IncomingMessage> {
  // IP literals skip DNS (and therefore the lookup hook), so validate them here.
  // URL.hostname wraps IPv6 in brackets; decimal/hex/octal IPv4 forms are already
  // normalised to dotted-quad by the URL parser.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && isBlockedIp(host)) {
    return Promise.reject(
      new SafeFetchError('blocked', 'URL resolves to a private network address')
    );
  }

  return new Promise((resolve, reject) => {
    let blocked = false;
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request(
      url,
      {
        method: 'GET',
        headers: { ...headers, Connection: 'close' },
        agent: false, // fresh socket per request; no pooled connection to an earlier resolution
        lookup: createPinnedLookup(() => {
          blocked = true;
        }),
        signal,
      },
      resolve
    );

    req.on('error', (err: NodeJS.ErrnoException) => {
      if (blocked) {
        reject(new SafeFetchError('blocked', 'URL resolves to a private network address'));
      } else if (signal.aborted) {
        reject(new SafeFetchError('timeout', 'Request timed out'));
      } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'ENODATA') {
        reject(new SafeFetchError('resolve', 'Could not resolve hostname'));
      } else {
        reject(new SafeFetchError('network', err.message || 'Network error'));
      }
    });

    req.end();
  });
}

// ---------------------------------------------------------------------------
// Body reading with a size cap
// ---------------------------------------------------------------------------

function decoderFor(encoding: string): zlib.Gunzip | zlib.Inflate | zlib.BrotliDecompress | null {
  switch (encoding) {
    case '':
    case 'identity':
      return null;
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip();
    case 'deflate':
      return zlib.createInflate();
    case 'br':
      return zlib.createBrotliDecompress();
    default:
      throw new SafeFetchError('network', `Unsupported content-encoding: ${encoding}`);
  }
}

async function readCappedText(
  res: IncomingMessage,
  maxBytes: number,
  signal: AbortSignal
): Promise<string> {
  const declared = Number(res.headers['content-length']);
  if (Number.isFinite(declared) && declared > maxBytes) {
    res.destroy();
    throw new SafeFetchError('too_large', 'Page is too large');
  }

  let stream: Readable = res;
  try {
    const decoder = decoderFor(String(res.headers['content-encoding'] ?? '').trim().toLowerCase());
    if (decoder) {
      res.on('error', (err) => decoder.destroy(err));
      stream = res.pipe(decoder);
    }
  } catch (err) {
    res.destroy();
    throw err;
  }

  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of stream) {
      total += (chunk as Buffer).length;
      if (total > maxBytes) {
        throw new SafeFetchError('too_large', 'Page is too large');
      }
      chunks.push(chunk as Buffer);
    }
  } catch (err) {
    stream.destroy();
    res.destroy();
    if (err instanceof SafeFetchError) throw err;
    if (signal.aborted) throw new SafeFetchError('timeout', 'Request timed out');
    throw new SafeFetchError('network', err instanceof Error ? err.message : 'Network error');
  }

  if (signal.aborted) throw new SafeFetchError('timeout', 'Request timed out');
  return Buffer.concat(chunks).toString('utf8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function parseHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeFetchError('invalid_url', 'Invalid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SafeFetchError('invalid_url', 'Only http:// and https:// URLs are supported');
  }
  if (url.username || url.password) {
    throw new SafeFetchError('invalid_url', 'URLs with embedded credentials are not supported');
  }
  url.hash = '';
  return url;
}

export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  const {
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    maxBytes = DEFAULT_MAX_BYTES,
  } = options;

  const signal = AbortSignal.timeout(timeoutMs);
  let url = parseHttpUrl(rawUrl);

  for (let hop = 0; ; hop++) {
    const res = await requestOnce(url, headers, signal);
    const status = res.statusCode ?? 0;
    const location = res.headers.location;

    if (REDIRECT_STATUSES.has(status) && location) {
      res.destroy(); // discard redirect body
      if (hop >= maxRedirects) {
        throw new SafeFetchError('too_many_redirects', 'Too many redirects');
      }
      // Re-parse: the next hop gets the same scheme/credentials checks and, in
      // requestOnce, the same IP validation as the first.
      let next: string;
      try {
        next = new URL(location, url).href;
      } catch {
        throw new SafeFetchError('invalid_url', 'Redirect to an invalid URL');
      }
      url = parseHttpUrl(next);
      continue;
    }

    return {
      status,
      headers: res.headers,
      url: url.href,
      text: () => readCappedText(res, maxBytes, signal),
      destroy: () => res.destroy(),
    };
  }
}
