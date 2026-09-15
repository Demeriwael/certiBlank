# Accounts and authentication

CertiBlank uses Better Auth with its Prisma adapter. Password hashing, signed
HttpOnly session cookies, OAuth state checks, CSRF protection, and session
revocation are handled by the library. Sessions live in PostgreSQL, expire after
seven days, and refresh after one day. Cookie caching is not enabled. HTTPS
production cookies are Secure; local HTTP development is supported.

## Local setup

1. Run `npm ci` and `npx prisma generate`.
2. Set `DATABASE_URL` and `DIRECT_URL` to a **development** PostgreSQL database.
3. Generate a secret using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Put that value in `.env` as `BETTER_AUTH_SECRET`. Set `BETTER_AUTH_URL` to
   `http://localhost:3000` (use this same host in the browser).
5. Apply migrations as described below, then run `npm run dev`.

Do not commit secrets. Production needs its own secret and exact HTTPS origin in
the hosting environment, followed by a rebuild. Restrict preview origins; do not
use a wildcard trusted origin or a production database for public preview builds.

## Database migrations — read before running

The project previously used `prisma db push`, with no tracked migration history.
`20260912000000_baseline` describes that pre-auth schema. The second migration
adds auth tables and a nullable `ExamAttempt.userId`; it does not replace attempts
or question banks. It enables RLS on auth tables to prevent public Supabase Data
API access. Prisma requires the trusted table-owner/BYPASSRLS database role.

### A new, empty development database

```powershell
npx prisma migrate deploy
npx prisma db seed
```

### An existing database with the previous schema

Back it up first. Confirm it has no existing Prisma migration history, and compare
its schema with the baseline before marking anything applied:

```powershell
npx prisma migrate status
npx prisma migrate diff --from-url "$env:DIRECT_URL" --to-migrations prisma/migrations --shadow-database-url "$env:SHADOW_DATABASE_URL" --script
```

For that comparison, PowerShell must have `DIRECT_URL` set to the database and
`SHADOW_DATABASE_URL` set to a **separate disposable empty database**. Prisma's
`.env` loader does not populate PowerShell variables. The diff should contain only
the new auth tables, their indexes/foreign keys, and `ExamAttempt.userId`; stop if
it proposes dropping data or changing existing question fields. The shadow
database must never be your live database. Alternatively have your database
administrator compare the checked-in baseline SQL against the current schema.

Once the pre-auth schema is confirmed to match, mark only the baseline applied:

```powershell
npx prisma migrate resolve --applied 20260912000000_baseline
npx prisma migrate deploy
npx prisma generate
```

Do not mark the auth migration applied without executing it. Do not run reset or
`db push` as a substitute. If your database differs or has migration history,
reconcile that history first. No live migration was run during implementation.

## Google OAuth (optional)

In Google Cloud Console, configure an OAuth consent screen and a Web application
OAuth client. Add `http://localhost:3000/api/auth/callback/google` as an authorized
redirect URI for development. Add `https://YOUR_DOMAIN/api/auth/callback/google`
for production. Configure test users while the Google app is in testing mode.
Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the server and restart/rebuild.
The Google button is hidden until both are set. Do not request extra Google scopes.

Automatic linking between Google and password accounts is disabled deliberately.
An existing email user should use their original login method; a future explicit,
authenticated linking flow can add another method safely.

## Anonymous progress and accounts

The header uses a cosmetic `certi-account-hint` localStorage value to keep its
buttons stable across full reloads and background session checks. It contains
only `member` or `guest`, never tokens or personal data. Server-side session
checks remain authoritative. A confirmed logout/401 clears the hint; temporary
network errors retain the last label. The root layout owns one session subscriber.
Theme preference is stored separately in `certi-theme`, defaults to light, and
is applied before paint. Both preferences are optional when storage is blocked.

- Anonymous practice still uses the existing random, HttpOnly `certi-owner` cookie.
- Logged-in attempts have a `userId`. A guest cookie cannot access a claimed attempt,
  even after logout or from a different account. Account deletion cascades attempts
  instead of restoring anonymous access.
- After either email login/signup or Google return, `/auth/complete` sends a
  same-origin POST to `/api/account/claim`. It verifies the session and atomically
  claims only unowned attempts matching that browser's owner cookie, including
  finished attempts. No attempt IDs or user IDs from a request body are trusted.
- The cookie rotates only after successful claiming. A failed claim shows a retry
  screen; retries are idempotent and cannot reassign another account's attempt.
- The exam Account button flushes queued changes before leaving. It preserves the
  current URL/attempt and sessionStorage draft. Returning to the same tab resumes
  that attempt. Account history can also resume it on a different device. Timers
  continue during login; expired mocks finalize normally when reopened.
- History shows the latest 50 sessions. Log out revokes the server session and
  clears this tab's draft pointers. Other tabs can retain local draft text, but the
  server denies account access after logout; close tabs on shared devices.
- Browser progress is claimed by the account that signs in on that browser. Avoid
  signing into someone else's account on a shared unfinished anonymous session.

## Verification and current limits

Run `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, and
`node --import tsx --test tests/*.test.ts`. Auth tests use the real Better Auth
handlers with an isolated memory adapter; claim tests use a mocked Prisma update.
They never touch Supabase. Test Google end to end using your OAuth client.

Email verification and password-reset delivery are **not configured**: no email
provider was supplied. Password accounts can register without verification; the
email is not treated as proof of identity. This is why automatic OAuth linking is
disabled. Configure transactional email before advertising password recovery.

Rate limits use the database so they persist across serverless instances. The
current deployment targets Netlify: `advanced.ipAddress.ipAddressHeaders` reads
only `x-nf-client-connection-ip`, which Netlify supplies for the connecting client.
It deliberately ignores `x-forwarded-for` and `x-real-ip`. Keep the application
behind Netlify's ingress; another host or a direct origin needs its own verified
proxy configuration before deployment. Never trust a header that visitors can
set unchanged, and do not disable rate limiting or origin/CSRF checks.

Better Auth retains IPv6 subnet grouping. In development/test, a missing valid
IP uses its localhost fallback; in production, it retains the restrictive shared
bucket and warning rather than bypassing limits. After deploying, exercise login
and confirm the missing-client-IP warning is gone from the Netlify function logs.
No database migration or additional environment variable is required for this
header configuration. See [Netlify's client-IP header guidance](https://answers.netlify.com/t/upcoming-change-stripping-exposed-netlify-headers-from-function-and-proxy-requests/52665)
and [Better Auth rate limiting](https://better-auth.com/docs/concepts/rate-limit).
