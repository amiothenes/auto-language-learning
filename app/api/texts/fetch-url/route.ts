import { NextRequest, NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import dns from 'dns/promises';
import net from 'net';
import type { FetchUrlRequest, FetchUrlResponse, ApiErrorResponse } from '@/lib/types/api';

// ============================================================================
// POST /api/texts/fetch-url — Fetch a URL and extract readable article text
// ============================================================================

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === '::1' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd')
    );
  }
  return false;
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json<ApiErrorResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: FetchUrlRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { url } = body;

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return NextResponse.json<ApiErrorResponse>({ error: 'url is required' }, { status: 400 });
  }

  if (!/^https?:\/\//i.test(url.trim())) {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Only http:// and https:// URLs are supported' },
      { status: 400 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: 'Invalid URL' }, { status: 400 });
  }

  // SSRF protection: resolve hostname and block private/internal IPs
  try {
    const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
    for (const { address } of addresses) {
      if (isPrivateIp(address)) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'URL resolves to a private network address' },
          { status: 403 }
        );
      }
    }
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Could not resolve hostname' },
      { status: 502 }
    );
  }

  // Fetch the URL server-side (bypasses browser CORS)
  let response: Response;
  try {
    response = await fetch(url.trim(), {
      signal: AbortSignal.timeout(15_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Verbista/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': '*',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json<ApiErrorResponse>(
      { error: `Failed to fetch URL: ${message}` },
      { status: 502 }
    );
  }

  if (response.status >= 400) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `URL returned HTTP ${response.status}` },
      { status: 502 }
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return NextResponse.json<ApiErrorResponse>(
      { error: `URL does not appear to be an HTML page (got: ${contentType.split(';')[0].trim()})` },
      { status: 415 }
    );
  }

  const html = await response.text();
  const resolvedUrl = response.url;

  // Parse with jsdom — must read <html lang=""> BEFORE Readability runs
  // because Readability replaces the document structure and loses the attribute
  const dom = new JSDOM(html, { url: resolvedUrl });
  const detectedLang = dom.window.document.documentElement.lang ?? '';

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent?.trim() || article.textContent.trim().length < 10) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error:
          'Could not extract readable content from this page. It may require JavaScript or be behind a paywall.',
      },
      { status: 422 }
    );
  }

  const title = (article.title ?? new URL(resolvedUrl).hostname).trim().slice(0, 200);
  const content = article.textContent.trim();

  return NextResponse.json<FetchUrlResponse>({
    title,
    content,
    resolvedUrl,
    detectedLang,
  });
}

// ============================================================================
// GET /api/texts/fetch-url — API Documentation
// ============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/texts/fetch-url',
    method: 'POST',
    description:
      'Fetch a URL server-side and extract its readable article text using Mozilla Readability. Returns title, content, and detected language. SSRF-protected.',
    requestBody: {
      url: 'string (required, must be http:// or https://)',
    },
    responses: {
      200: 'Extraction successful — returns title, content, resolvedUrl, detectedLang',
      400: 'Invalid request or unsupported URL scheme',
      401: 'Unauthorized — missing or invalid x-admin-key',
      403: 'URL resolves to a private/internal IP address',
      415: 'URL is not an HTML page',
      422: 'Content could not be extracted (paywall, JS-only, etc.)',
      502: 'Network error or HTTP error from target URL',
    },
  });
}
