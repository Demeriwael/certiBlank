# Security hardening and deployment

## Implemented protections

- Exam POSTs and account claims require the exact `BETTER_AUTH_URL` origin.
  Production fails closed if that configuration is missing. Keep this value set
  to the production HTTPS origin; local browser hostname must match its local value.
- Exam creation accepts at most 4 KiB of JSON, saves 64 KiB, and password login,
  signup and profile updates 16 KiB. Streamed byte counts enforce these limits
  even without Content-Length. JSON mutations reject form/text and encoded bodies.
- Auth names are checked server-side on signup and profile updates. Unexpected
  API errors stay private; exam creation logs only sanitized diagnostic metadata.
- Persistent exam limits: creation 10/minute and 100/day, combined public reads
  120/minute, saves and claims 120/minute. These are per trusted Netlify client IP
  (IPv6 subnet grouping), so shared networks also share limits. Budget failures
  return 429 and Retry-After. Storage failures fail closed. Missing trusted IPs
  share a restrictive fallback. IP keys are HMAC-derived, not plaintext IPs.
- Limits use a PostgreSQL atomic upsert and database time, not serverless memory.
  They reuse one row per IP/budget, rather than a new row every time window.
- Responses deny framing and MIME sniffing and restrict browser permissions,
  referrers, form targets, object embeds, and document base URLs. The partial CSP
  deliberately does not enforce script-src: Next hydration and theme bootstrap
  still need a separate nonce/hash CSP rollout. Netlify supplies HTTPS redirect/HSTS.
- `@prisma/config` has a scoped `deepmerge-ts` 8.0.0 override for
  GHSA-ggr8-5vv4-36mx. Remove the override when a compatible Prisma upgrade fixes
  the dependency upstream. CI audits high/critical advisories on every run.

## Database migration: manual deployment step

The new `20260916000000_restrict_data_api` migration is NOT automatically applied
by the application or CI. It enables RLS on all nine application tables, revokes
PUBLIC/anon/authenticated table grants, and adds a restrictive deny policy.
The policy also blocks legacy permissive policies or column grants for roles
subject to RLS. No application rows are removed. Supabase's browser roles must
not access these tables; browser requests go through the Next.js API instead.

Before applying, confirm the deployed Prisma connection uses the trusted table
owner or a BYPASSRLS role. A non-owner role without BYPASSRLS would be denied by
this migration. Do not set FORCE ROW LEVEL SECURITY. Audit any exposed views,
security-definer functions, or inherited privileged roles separately.

In the Supabase SQL editor, inspect:

```sql
SELECT schemaname, tablename, tableowner, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

SELECT rolname, rolbypassrls, rolsuper
FROM pg_roles
WHERE rolname IN ('postgres', 'anon', 'authenticated');
```

Confirm the actual application connection role too: the SQL editor may connect
with a different role. Take a database backup and verify the migration on a
development database before production. Then, with the intended DATABASE_URL and
DIRECT_URL configured locally, run:

```powershell
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

After applying, verify the Data API roles cannot read/write the tables, and smoke
test guest practice, signup/login, claiming progress, saving, submission and
account history. Redeploy the updated application through the existing PR flow.
Do not run migrate reset, db push, or seed against production for this change.

## Validation and remaining work

`node --import tsx --test tests/*.test.ts` includes in-memory PostgreSQL (PGlite)
tests for migrations, role grants, restrictive RLS, limit expiry and concurrent
requests. These tests never load .env or connect to Supabase. They do not prove
the production project's live permissions or Netlify headers match this code.

Email verification/password-reset delivery still require a configured sender
service and verification UX; automatic OAuth account linking remains disabled.
Signup email enumeration is not eliminated until verified-email signup is rolled
out. Do not silently turn verification on without working email delivery.

Rate limiting limits abuse per IP; a distributed attack still needs hosting-level
controls. Define a retention policy and scheduled cleanup for stale RateLimit rows
and abandoned anonymous attempts before growth; this change does not silently
delete users' practice history. Raw IP storage by Better Auth sessions is separate
from the hashed keys used by the exam limiter.

Full script CSP, live Data API permission inspection, email verification, and
production smoke checks remain separate deployment/follow-up work.
