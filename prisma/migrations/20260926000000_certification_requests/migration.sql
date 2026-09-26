CREATE TABLE "CertificationRequest" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "certification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CertificationRequest_createdAt_idx" ON "CertificationRequest"("createdAt");

-- Match the server-only policy on the existing application tables.
ALTER TABLE public."CertificationRequest" ENABLE ROW LEVEL SECURITY;
CREATE POLICY certiblank_server_only ON public."CertificationRequest"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
REVOKE ALL PRIVILEGES ON TABLE public."CertificationRequest" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL PRIVILEGES ON TABLE public."CertificationRequest" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL PRIVILEGES ON TABLE public."CertificationRequest" FROM authenticated;
  END IF;
END $$;
