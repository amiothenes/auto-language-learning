import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Prefix-matched public paths (startsWith check)
// '/auth' covers /auth/callback (dormant OAuth stub) and /auth/confirm (magic
// link, signup confirmation, password recovery token_hash verification) — the
// latter must stay public since verifyOtp() runs inside that route and the
// visitor isn't authenticated yet when the proxy sees the request.
// '/reset-password' is public too even though it's normally only reached with
// a valid recovery session, so a stale/direct-navigated visit without one hits
// the page's own "link invalid or expired" state instead of being silently
// redirected to /login.
const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/og', '/auth', '/share', '/api/public', '/manifest.json'];

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  // Fail-closed: a missing/null Origin is treated as untrusted (GHSA-mq59-m269-xvcx
  // showed a null Origin used to bypass Next.js's own Server Actions CSRF check).
  if (!origin) return false;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Reject cross-origin mutations before touching auth/cookies at all
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/public') &&
    STATE_CHANGING_METHODS.has(request.method) &&
    !isTrustedOrigin(request)
  ) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove, required for Supabase SSR cookie refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated users on the landing page or auth screens go straight to the dashboard.
  // /reset-password is deliberately excluded — a user lands there via a valid
  // recovery session and must be allowed to see the reset form, not bounced away.
  const AUTH_SCREENS = ['/login', '/signup', '/forgot-password'];
  if (user && (pathname === '/' || AUTH_SCREENS.some((p) => pathname.startsWith(p)))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // / is public (landing page); prefix-matched paths are also public
  const isPublic = pathname === '/' || PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    // API routes: return JSON 401 so fetch() clients handle it gracefully
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|woff2?|ttf|otf|ico)$).*)',
  ],
};
