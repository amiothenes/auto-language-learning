import { NextRequest, NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type { FetchUrlRequest, FetchUrlResponse, ApiErrorResponse } from '@/lib/types/api';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { safeFetch, SafeFetchError, type SafeFetchResponse } from '@/lib/safeFetch';

// ============================================================================
// POST /api/texts/fetch-url — Fetch a URL and extract readable article text
// ============================================================================

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireUser();
  if (authError) return authError;

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

  const rateLimit = await checkRateLimit('fetchUrl', user.id);
  if (!rateLimit.allowed) {
    return rateLimitResponse('fetchUrl', rateLimit);
  }

  // Fetch the URL server-side (bypasses browser CORS). safeFetch blocks private/internal
  // addresses at connect time (DNS-rebinding safe) and re-validates every redirect hop.
  let response: SafeFetchResponse;
  try {
    response = await safeFetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Verbista/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': '*',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
  } catch (err) {
    if (err instanceof SafeFetchError) {
      switch (err.code) {
        case 'invalid_url':
          return NextResponse.json<ApiErrorResponse>({ error: err.message }, { status: 400 });
        case 'blocked':
          return NextResponse.json<ApiErrorResponse>({ error: err.message }, { status: 403 });
        case 'resolve':
          return NextResponse.json<ApiErrorResponse>({ error: err.message }, { status: 502 });
        default:
          return NextResponse.json<ApiErrorResponse>(
            { error: `Failed to fetch URL: ${err.message}` },
            { status: 502 }
          );
      }
    }
    const message = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json<ApiErrorResponse>(
      { error: `Failed to fetch URL: ${message}` },
      { status: 502 }
    );
  }

  if (response.status >= 400) {
    response.destroy();
    return NextResponse.json<ApiErrorResponse>(
      { error: `URL returned HTTP ${response.status}` },
      { status: 502 }
    );
  }

  const contentType = response.headers['content-type'] ?? '';
  if (!contentType.includes('text/html')) {
    response.destroy();
    return NextResponse.json<ApiErrorResponse>(
      { error: `URL does not appear to be an HTML page (got: ${contentType.split(';')[0].trim()})` },
      { status: 415 }
    );
  }

  let html: string;
  try {
    html = await response.text();
  } catch (err) {
    if (err instanceof SafeFetchError && err.code === 'too_large') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Page is too large to import' },
        { status: 413 }
      );
    }
    const message = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json<ApiErrorResponse>(
      { error: `Failed to fetch URL: ${message}` },
      { status: 502 }
    );
  }
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
      401: 'Unauthorized — not authenticated',
      403: 'URL (or a redirect target) resolves to a private/internal IP address',
      413: 'Page exceeds the 5 MB size limit',
      415: 'URL is not an HTML page',
      422: 'Content could not be extracted (paywall, JS-only, etc.)',
      429: 'Rate limit exceeded — see Retry-After header',
      502: 'Network error or HTTP error from target URL',
    },
  });
}
