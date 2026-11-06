'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile for Supabase Auth captcha protection.
 *
 * Inert unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set: `enabled` is false and
 * getToken() resolves to undefined, so every auth call works exactly as before.
 * Once Supabase captcha is switched on, every auth call (anonymous sign-in,
 * sign-up, password sign-in, password reset) must pass `options.captchaToken`.
 *
 * Uses appearance "interaction-only": the widget stays invisible unless
 * Cloudflare actually needs the visitor to click. Tokens are single-use, so
 * the widget resets after each getToken().
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load the captcha'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function useTurnstile() {
  const container = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiters = useRef<Array<(t: string | undefined) => void>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          callback: (t: string) => {
            token.current = t;
            waiters.current.splice(0).forEach((w) => w(t));
          },
          'expired-callback': () => (token.current = null),
          'error-callback': () => setError('Captcha check failed. Please refresh and try again.'),
        });
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  /** Resolves with a fresh single-use token (or undefined when captcha is off). */
  const getToken = useCallback((): Promise<string | undefined> => {
    if (!SITE_KEY) return Promise.resolve(undefined);
    const take = (t: string | undefined) => {
      token.current = null;
      // Tokens are single-use: queue a fresh one for the next attempt.
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      return t;
    };
    if (token.current) return Promise.resolve(take(token.current));
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(undefined), 15_000);
      waiters.current.push((t) => {
        clearTimeout(timer);
        resolve(take(t));
      });
    });
  }, []);

  /** Mount this somewhere in the form; it is invisible unless interaction is needed. */
  const widget = SITE_KEY ? <div ref={container} className="flex justify-center empty:hidden" /> : null;

  return { enabled: !!SITE_KEY, getToken, widget, error };
}
