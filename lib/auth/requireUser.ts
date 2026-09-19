import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

type RequireUserResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

// Explicit CSRF defense-in-depth: same-origin cookies (SameSite=Lax) already
// stop most cross-site requests, but that's an incidental library default,
// not an app-level control. Only enforced when Origin is present — normal
// same-origin navigations legitimately omit it, but cross-origin fetch/POST
// always sends it, which is exactly what we want to reject here.
async function isCrossOriginRequest(): Promise<boolean> {
  const headerList = await headers();
  const origin = headerList.get('origin');
  if (!origin) return false;

  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  if (!host) return false;

  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function requireUser(): Promise<RequireUserResult> {
  if (await isCrossOriginRequest()) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 }),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, error: null };
}
