import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      return NextResponse.redirect(new URL('/login?error=link_expired', origin));
    }
    const onboarded = data.session.user.user_metadata?.onboardingComplete;
    return NextResponse.redirect(new URL(onboarded ? '/dashboard' : '/onboarding', origin));
  }

  return NextResponse.redirect(new URL('/login', origin));
}
