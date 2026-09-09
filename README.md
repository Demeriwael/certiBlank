# CertiBlank

CertiBlank is an IT certification practice application with timed mock exams,
domain practice, multiple-response questions, explanations, and domain analytics.
It uses Next.js App Router, TypeScript, Tailwind CSS, Prisma 6, and PostgreSQL.

## Local installation

Install Node.js **24** (the version used by CI), npm, and Git. You also need your
own PostgreSQL development database: local PostgreSQL or a separate Supabase
project. You do not need to install Supabase to use its hosted database.

1. Clone the repository. Contributors without write access should fork it first
   and use their fork's clone URL instead.

```bash
git clone https://github.com/Demeriwael/certiBlank.git
cd certiBlank
npm ci
```

The repository root contains `package.json`; there is no additional `certi`
subdirectory after cloning. Run the remaining commands from this root.

2. Copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

3. Edit `.env` with credentials for your development database. `DATABASE_URL` is
   used by the app; `DIRECT_URL` is used for schema management. For local
   PostgreSQL, both can point to the same database. Create that database and user
   first; the template does not provision PostgreSQL.

For Supabase, copy PostgreSQL connection strings from the project's **Connect**
dialog and replace the password placeholder with your URL-encoded database
password. Use a transaction pooler URL with `pgbouncer=true` for `DATABASE_URL`
when pooling; use a direct URL or session pooler for `DIRECT_URL`. A session
pooler is an option when your network cannot reach the direct IPv6 endpoint.
These are database URLs, not Supabase API keys. Prisma connects to PostgreSQL and
does not require the Supabase Data API. See the
[Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma).

Keep `.env` private. Never use the hosted application's production database for
local setup or tests.

4. Generate the client and validate the question banks, then initialize and seed
   your development database:

```bash
npx prisma generate
npx prisma db seed -- --validate-only
npx prisma db push
npx prisma db seed
```

`--validate-only` reads files without database writes. `db push` changes the schema,
and seeding imports question data. Review any schema-change warning before
proceeding; do not add `--accept-data-loss` to bypass it.

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To check a production build
locally, stop the development server, run `npm run build`, then `npm start`.

If question availability fails, check that your development database is reachable,
both URLs are correct, and schema setup and seeding completed. On Windows, stop
the dev server before regenerating Prisma if its DLL is locked.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for tests, branches, and pull requests.
Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## License

The original application source code, scripts, configuration, and project
documentation are licensed under the [MIT License](LICENSE).

Question-bank JSON files under `prisma/Data` (also referred to as `prisma/data`)
and vendor logos/certification artwork are **excluded** from this MIT grant.
Their redistribution terms have not yet been established here; their presence
does not grant permission to redistribute them. Third-party dependencies retain
their own licenses. Vendor names and trademarks remain the property of their
respective owners; this project does not claim vendor endorsement.

## Exam modes and question imports

Question banks live under `prisma/Data/<Platform>/<Certification>/*.json`. The importer recursively validates all version 2 files before writing. Each certification uses one envelope containing `schemaVersion: 2`, `platform`, `certification` (including `mockExam` and `domains`), and `questions`. Use the supplied AWS file as the complete example.

Keep certification slugs and question IDs stable between imports. Options have stable IDs; `correctOptionIds` must match `selectionCount`. Every incorrect option requires a `distractorExplanations` entry. Domain weights total 100. References use HTTPS. Legacy array files are skipped with a progress message until upgraded; their database records remain intact.

```bash
npx prisma db seed -- --validate-only
npx prisma db push
npx prisma db seed
npm run dev
```

The importer upserts questions and marks removed version 2 questions as legacy rather than deleting them. Only version 2 records count toward availability or appear in new attempts. Existing attempt snapshots stay unchanged when a bank is reimported.

- Domain practice: selected domains, configurable session length, explicit answer checking, locked checked answers, immediate structured explanations.
- Mock exam: largest-remainder domain quotas, configured question count and duration, server-enforced deadline, final review before submission. Insufficient domain coverage prevents starting a shortened mock.
- Multiple response: exact set matching without partial credit. Unanswered and incomplete answers count as incorrect.
- Score: `round(minimumScore + correct / total * (maximumScore - minimumScore))`. This is a practice estimate, not a vendor-equivalent psychometric score. Domain accuracy is raw accuracy; domains not sampled have no accuracy value.

Attempts are stored in PostgreSQL with an immutable question snapshot. An HttpOnly owner cookie scopes access, and session storage keeps the current attempt ID for refresh recovery in that browser tab. This is anonymous session continuity, not an account or cross-device history. Correct answers are returned only for checked domain questions or submitted attempts. Expired mocks finalize saved answers on the next server request, including the timer's automatic request; closing the browser does not pause the deadline.

Validation:

```bash
npm run lint
node --import tsx --test tests/*.test.ts
npm run build
# Requires the local server and configured test database; cleans up its own attempts:
node --import tsx tests/exam-live.ts
```

Before committing: review `git status` and `git diff`, keep `.env` untracked, stage only intended files, and make a focused commit on the feature branch. Database changes are independent of Git commits.

### Responsive exam progress

Answer selection, flags, and navigation update immediately in the browser. A serialized queue batches changes within 250 ms and persists them without disabling controls or showing a routine save indicator. Server responses cannot rewind newer edits. Pending drafts are kept in session storage for recovery after refreshing the same tab; no answer keys are stored in those drafts. Connection failures retain the draft and retry with backoff. Invalid or conflicting state pauses syncing and asks for a reload to reconcile with the server.

Check answer and final submission remain server-graded. They use the latest draft and wait for any in-flight save; navigation remains available while a domain answer is checked. Mock expiry remains server-authoritative: only changes received before the deadline are accepted, including when the connection is interrupted. Compact save responses omit the unchanged question bank, and conditional writes return the updated row without an extra database read.

### Exam interface and accessibility

The exam workspace includes a sticky progress header, fixed touch-friendly navigation, radio/checkbox answer cards, and a modal question navigator. Explanations reference the displayed option letters, including after answer shuffling. Results include domain accuracy and a question-by-question review. Icons are inline SVGs.

Keyboard shortcuts: 1–4 or A–D choose an option, F toggles a flag, Left/Right move between questions, and Enter advances. Native controls retain their normal keyboard actions. Turn shortcuts off in the navigator or desktop sidebar; the preference persists on this device. Escape closes the navigator and returns focus to its trigger. Tab stays inside the open dialog.

The timer turns amber at ten minutes and red at two minutes. Screen readers receive threshold announcements rather than every tick. Reduced-motion preferences disable the warning pulse and drawer animation. Correctness is communicated through text and icons as well as color.

Manual checks before release: test both practice modes, multiple-response selection limits, keyboard-only use, drawer focus restoration, 320px mobile reflow, final submission, and screen-reader announcements. These provisions are not a substitute for a full WCAG audit with assistive technologies.

### GitHub Actions: CI only

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual dispatch. Its single required-check candidate is **CI checks**. On Ubuntu with Node.js 24 it installs locked dependencies, generates Prisma Client, validates question banks with `--validate-only`, runs ESLint and TypeScript checks, executes unit/mocked API tests, and builds Next.js for production.

The job uses localhost placeholder database URLs, read-only repository permissions, and no Supabase or hosting secrets. It never deploys, applies migrations, pushes schemas, or imports data. `tests/exam-live.ts` is excluded because it writes test attempts to a real database. A green result does not verify production database connectivity or browser behavior. Existing Netlify deployments are managed independently of this workflow.

To enable CI:

1. Push the CI feature branch and open a pull request into `main`.
2. Open the pull request's Checks tab and wait for **CI checks** to pass. Failed steps link to their logs.
3. After the first run, open repository Settings > Rules > Rulesets and create an active branch ruleset targeting `main`. Require a pull request and require the **CI checks** status check before merging. Select the check emitted by GitHub Actions. Availability of rulesets depends on repository visibility and your GitHub plan; branch protection rules can provide equivalent checks where available.
4. Merge the pull request after it passes. The same workflow also checks the resulting `main` commit.

No deployment workflow or database secrets need to be configured for CI.
