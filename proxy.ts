import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Prefix-matched public paths (startsWith check)
const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/og', '/auth/callback', '/share', '/api/public'];

export async function proxy(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

  // Authenticated users on the landing page or auth screens go straight to the dashboard
  const AUTH_SCREENS = ['/login', '/signup'];
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
