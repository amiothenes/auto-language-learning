-- ============================================================================
-- Verbista 0018: lock the Supabase REST API out of app tables (RLS on, no policies)
--
-- WHY: the app reads and writes every table server-side through Drizzle
-- (DATABASE_URL, the `postgres` owner role), which bypasses RLS. It never uses
-- the browser-side REST API (supabase.from(...)) for tables. But Supabase
-- exposes every public table over REST to anyone holding the anon key, which
-- is public by design (it ships in the JS bundle). With RLS off, that key can
-- read every user's rows.
--
-- Enabling RLS with NO policies makes REST return nothing for the anon,
-- authenticated and anonymous-sign-in roles, while the app's owner connection
-- keeps working unchanged. This is the fix the "anonymous users use the
-- authenticated role" warning is pointing at.
--
-- Safe to re-run. Same as lib/db/migrations/0018_enable_rls.sql, plus a
-- catch-all for any public table not in the Drizzle schema.
-- ============================================================================

-- 1) Check first (optional): public tables that currently have RLS OFF.
-- SELECT tablename FROM pg_tables
--  WHERE schemaname = 'public' AND rowsecurity = false
--  ORDER BY tablename;

BEGIN;

-- 2) Enable RLS on every table in the public schema.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    RAISE NOTICE 'RLS enabled on public.%', t.tablename;
  END LOOP;
END $$;

-- 3) Belt and braces: remove direct table privileges from the API roles.
--    The app doesn't need them, since it connects as the owner.
--    (Comment this out if you ever add browser-side supabase.from() reads;
--    then you would also need real RLS policies.)
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;

-- 4) Verify: should return zero rows.
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
--
-- 5) Optional live test from a terminal (should return [] or a permission error,
--    never rows):
--   curl "https://<project>.supabase.co/rest/v1/words?select=lemma&limit=1" \
--     -H "apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>"
