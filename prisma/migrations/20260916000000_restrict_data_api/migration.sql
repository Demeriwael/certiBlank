-- All browser access goes through Next.js authorization, not the Supabase Data API.
-- Do not FORCE RLS: the trusted Prisma table owner must retain access.
BEGIN;
DO $$
DECLARE table_name text; role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['Platform', 'Certification', 'Question', 'ExamAttempt', 'User', 'Session', 'Account', 'Verification', 'RateLimit'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    -- Restrictive policy also closes legacy permissive policies/column grants.
    EXECUTE format('CREATE POLICY certiblank_server_only ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false)', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', table_name);
    -- These roles exist on Supabase, but not necessarily in local PostgreSQL.
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', table_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
