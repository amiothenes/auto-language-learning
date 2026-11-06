-- ============================================================================
-- Verbista 0019: daily cleanup of stale guest (anonymous) accounts
--
-- "Start reading" signs visitors in as Supabase anonymous users. Most never
-- save their library, so their accounts and app data pile up. This deletes
-- guests with NO activity for 30 days: their app rows first (the app tables
-- are not foreign-keyed to auth.users, so nothing would cascade), then the
-- auth user.
--
-- A guest counts as active if any of these moved within the window: sign-in,
-- an auth session refresh, or an update to their words or texts. A guest who
-- saved their library (is_anonymous = false) is never touched.
--
-- BEFORE RUNNING: enable pg_cron in Supabase:
--   Dashboard → Integrations → Cron → Enable (or Database → Extensions → pg_cron).
-- Then paste this whole file into the SQL Editor and run it.
-- ============================================================================

-- The function lives in a private schema. Supabase's REST API exposes
-- functions in `public` (callable as /rest/v1/rpc/...), and this one must not
-- be callable by anyone from outside.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.cleanup_stale_guests(
  inactive_days integer DEFAULT 30,
  max_users     integer DEFAULT 500,   -- per run, keeps each run short
  dry_run       boolean DEFAULT false  -- true = only report what would be deleted
)
RETURNS TABLE (deleted_users integer, guest_ids text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  cutoff timestamptz := now() - make_interval(days => inactive_days);
  ids    text[];
BEGIN
  SELECT coalesce(array_agg(g.id), '{}') INTO ids
  FROM (
    SELECT u.id::text AS id
    FROM auth.users u
    WHERE u.is_anonymous = true
      AND u.created_at < cutoff
      AND coalesce(u.last_sign_in_at, u.created_at) < cutoff
      AND NOT EXISTS (SELECT 1 FROM auth.sessions s WHERE s.user_id = u.id AND coalesce(s.updated_at, s.created_at) >= cutoff)
      AND NOT EXISTS (SELECT 1 FROM public.words w WHERE w.user_id = u.id::text AND w.updated_at >= cutoff)
      AND NOT EXISTS (SELECT 1 FROM public.texts t WHERE t.user_id = u.id::text AND t.updated_at >= cutoff)
    ORDER BY u.created_at
    LIMIT max_users
  ) g;

  IF dry_run OR cardinality(ids) = 0 THEN
    RETURN QUERY SELECT cardinality(ids), ids;
    RETURN;
  END IF;

  -- Children first. Each delete cascades as noted (see the FKs in lib/db/schema):
  DELETE FROM public.texts                WHERE user_id = ANY(ids);  -- → sentences, word_instances, text_tags
  DELETE FROM public.words                WHERE user_id = ANY(ids);  -- → word_reviews, word_translations, pos_tags
  DELETE FROM public.series               WHERE user_id = ANY(ids);
  DELETE FROM public.tags                 WHERE user_id = ANY(ids);
  DELETE FROM public.word_reviews         WHERE user_id = ANY(ids);  -- (already cascaded; harmless safety net)
  DELETE FROM public.srs_daily_stats      WHERE user_id = ANY(ids);
  DELETE FROM public.srs_settings         WHERE user_id = ANY(ids);
  DELETE FROM public.reader_sync_settings WHERE user_id = ANY(ids);
  DELETE FROM public.languages            WHERE user_id = ANY(ids);
  -- audit_log rows are deliberately kept (security trail).

  -- Finally the auth users (cascades their identities, sessions, refresh tokens).
  DELETE FROM auth.users WHERE id::text = ANY(ids) AND is_anonymous = true;

  RAISE LOG 'cleanup_stale_guests: deleted % guest account(s)', cardinality(ids);
  RETURN QUERY SELECT cardinality(ids), ids;
END;
$$;

REVOKE ALL ON FUNCTION private.cleanup_stale_guests(integer, integer, boolean) FROM PUBLIC, anon, authenticated;

-- ─── Schedule: every day at 03:17 UTC ───────────────────────────────────────
-- (Re-running this file replaces the job rather than adding a second one.)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-stale-guests';
SELECT cron.schedule(
  'cleanup-stale-guests',
  '17 3 * * *',
  $cron$ SELECT private.cleanup_stale_guests(30, 500, false); $cron$
);

-- ─── Try it (optional) ──────────────────────────────────────────────────────
-- Dry run, which deletes nothing and lists who WOULD be removed:
--   SELECT * FROM private.cleanup_stale_guests(30, 500, true);
-- See the job and its recent runs:
--   SELECT jobid, jobname, schedule, active FROM cron.job;
--   SELECT status, return_message, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- Stop it:
--   SELECT cron.unschedule('cleanup-stale-guests');
