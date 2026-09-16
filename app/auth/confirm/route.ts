import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error && data.session) {
      if (next) {
        return NextResponse.redirect(new URL(next, origin));
      }
      const onboarded = data.session.user.user_metadata?.onboardingComplete;
      return NextResponse.redirect(new URL(onboarded ? '/dashboard' : '/onboarding', origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=link_expired', origin));
}
