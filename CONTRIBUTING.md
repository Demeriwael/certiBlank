# Contributing to CertiBlank

Use the [README setup guide](README.md#local-installation) to install Node.js 24,
locked npm dependencies, and your own development PostgreSQL database. Copy
`.env.example` to `.env`, generate Prisma Client, initialize the development
schema, and seed the question banks before running the app.

## Branches and pull requests

External contributors should fork the repository on GitHub and clone their fork.
Create a focused branch from an up-to-date `main`; never work directly on `main`.
For an existing clean checkout:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/describe-your-change
```

If you use a fork, sync its `main` with the upstream repository before starting.
If you have uncommitted work, finish or preserve it before switching branches.
Discuss large changes in an issue before implementing them.

Keep changes focused and match existing TypeScript, React, and Tailwind patterns.
Use SVG icons, preserve keyboard navigation and visible focus, and check mobile
layouts and reduced-motion behavior when changing the interface.

## Checks before submitting

Run these from the repository root. Prisma generation must precede type checking.
The validation command does not write to the database; unit and API tests below
use mocks. GitHub CI runs these checks with placeholder database URLs.

```bash
npx prisma generate
npx prisma db seed -- --validate-only
npm run lint
npx next typegen
npx tsc --noEmit
node --import tsx --test tests/*.test.ts
npm run build
```

On Windows, if Prisma generation reports a locked DLL, stop your local dev server
and other processes using this project's Prisma Client, then retry.

For changes to exam behavior, also exercise both modes, multiple response answers,
flags, refresh recovery, submission, and results. UI changes should include a
keyboard-only check, drawer focus restoration, and a narrow mobile viewport.

The optional live test requires the local server on `127.0.0.1:3000` and the same
dedicated development database used by the test process:

```bash
node --import tsx tests/exam-live.ts
```

It creates and removes its own exam attempts and expects the current seeded AWS
bank (including 274 available questions). It is not part of CI and must not run
against production. An interrupted test may leave test attempts behind.

## Submit your work

Review `git status` and `git diff`, then stage specific intended files with
`git add -- <paths>`. Review `git diff --cached` before committing. Never commit
`.env`, credentials, database exports, or generated build output.

```bash
git commit -m "Describe the change"
git push -u origin feat/describe-your-change
```

Open a pull request to the upstream `main` branch. Explain the problem, behavior
change, and validation performed; include screenshots for visual changes and
mention schema changes explicitly. Wait for **CI checks** to pass and resolve
review feedback before merging. This workflow performs CI only.

## Question banks and licensing

Keep question IDs, option IDs, and certification slugs stable. Validate all bank
changes with `--validate-only`. Schema pushes and seeding are explicit local
database operations; they are not performed by CI.

Only submit content you have permission to contribute. Include the source and
redistribution terms for question data or artwork; do not submit restricted exam
material. Existing question banks and vendor artwork are outside the application
code's MIT license, as described in [README licensing](README.md#license).
Application code contributions are made under the project's [MIT license](LICENSE).

Report vulnerabilities using [SECURITY.md](SECURITY.md), not public issues.
