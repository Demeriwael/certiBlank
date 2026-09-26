<div align="center">

# CertiBlank ✦

### Your next certification starts with a blank.
**Fill it with practice. Back it with understanding.**

**[🌐 Try CertiBlank live](https://certiblank.com)** · [🎬 Product tour](#product-tour) · [🏗️ Architecture](#architecture) · [💻 Code tour](#code-tour)

Next.js · TypeScript · PostgreSQL · Docker · AWS EC2

[![CI](https://github.com/Demeriwael/certiBlank/actions/workflows/ci.yml/badge.svg)](https://github.com/Demeriwael/certiBlank/actions/workflows/ci.yml)

[Get started](#local-installation) · [Contribute](CONTRIBUTING.md) · [Report a bug](https://github.com/Demeriwael/certiBlank/issues) · [Security](SECURITY.md)

</div>

---

## ✨ What you can do

CertiBlank is an IT certification practice platform built around one idea: **understand why an answer is right, not just which answer to pick.** Practice by domain, take a timed mock exam, and use your results to decide what to study next.

| | Domain practice | Timed mock exam |
| --- | --- | --- |
| Best for | Learning and targeting weak areas | Rehearsing a complete exam session |
| Questions | Selected domains and session length | Certification configuration and domain quotas |
| Feedback | After explicitly checking an answer | After final submission |
| Timing | Practice at your own pace | Server-enforced countdown |
| Review | Explanations as you go | Flag, navigate, and review before submitting |

<a id="product-tour"></a>
## 🎬 See it in action

[![CertiBlank landing page with an interactive AWS question](docs/media/landing.jpg)](https://certiblank.com)

**Select → submit → understand.** This short sequence captures the interactive question on the live landing page.

![Animated walkthrough selecting Amazon S3 and revealing its explanation](docs/media/practice-demo.gif)

[View the static feedback screenshot](docs/media/demo-feedback.jpg) if you prefer no animation. The GIF is an edited sequence of real UI captures, not a performance benchmark.

| Focused practice | Learn from every answer |
| --- | --- |
| ![Domain practice with large answer options and persistent navigation](docs/media/exam.jpg) | ![Correct-answer reasoning and distractor explanations](docs/media/explanation.jpg) |

<details>
<summary><strong>📊 Results that tell you what to study next</strong></summary>

![Practice results with score and domain-level accuracy](docs/media/results.jpg)

</details>

Screenshots show a demonstration session, not a real certification result. No personal account data is included.

<a id="local-installation"></a>
## 🚀 Local installation

**Explore without an account:** open the live demo, choose AWS or Azure, and start domain practice. Cisco is listed as coming soon; availability depends on the imported question banks.

### 1. Get the prerequisites

Install **Node.js 24**, npm, and Git. Provision your own **development PostgreSQL database**, either locally or in a separate Supabase project. Hosted Supabase does not require installing Supabase on your computer.

### 2. Clone and install

```bash
git clone https://github.com/Demeriwael/certiBlank.git
cd certiBlank
npm ci
```

Contributing from outside the project? Fork the repository first and clone your fork instead. The cloned repository root contains `package.json`; there is no extra `certi` directory to enter.

### 3. Configure your environment

Copy the example file using the command for your shell:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Edit `.env` with your own development credentials:

```dotenv
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/certi_dev?schema=public"
DIRECT_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/certi_dev?schema=public"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Application queries; may use a connection pooler. |
| `DIRECT_URL` | Prisma schema operations; use a direct connection or session pooler. |
| `BETTER_AUTH_URL` | Exact application origin, including protocol and development port. |
| `BETTER_AUTH_SECRET` | A private random secret, at least 32 characters. |

Generate the secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
See [authentication setup](docs/authentication.md) for optional Google credentials, cookie/session behavior, and current limitations (email verification and password recovery are not configured).

For local PostgreSQL, both URLs can match. Create the database and user first; the template does not provision them. Keep `.env` untracked and use a development database, never the hosted application's production database.

<details>
<summary><strong>Using Supabase?</strong></summary>

Copy PostgreSQL connection strings from your project's **Connect** dialog. Replace the password placeholder with your database password, URL-encoding special characters.

For Prisma 6, a transaction pooler URL can be used for `DATABASE_URL` with `pgbouncer=true`. Use a direct connection or session pooler for `DIRECT_URL`, not the transaction pooler. A session pooler can help when your network cannot reach the direct IPv6 endpoint. Preserve required SSL parameters.

Prisma uses PostgreSQL connections, not Supabase API keys, and does not require the Supabase Data API. See the [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma).

</details>

### 4. Prepare the database

These commands are for a **new empty development database**. For an existing database created with `db push`, follow the [baseline migration instructions](docs/authentication.md#database-migrations--read-before-running) first.

```bash
npx prisma generate
npx prisma db seed -- --validate-only
npx prisma migrate deploy
npx prisma db seed
```

Validation reads question files without database writes. Migrations change the schema, and seeding imports questions into your configured database. Never reset a database or bypass data-loss warnings to make a migration pass.

### 5. Start practicing

```bash
npm run dev
```

Open **[localhost:3000](http://localhost:3000)** in your browser.

For a local production run, stop the development server, then run:

```bash
npm run build
npm start
```

## For reviewers and contributors

## 🔍 Engineering highlights

A full-stack application that takes a learner from a first anonymous practice session to account-linked exam history. Light and dark themes, touch-friendly controls, and detailed explanations keep the attention where it belongs: on learning.

| Challenge | Implementation |
| --- | --- |
| Keep practice responsive while saving | Local state updates immediately; a serialized queue batches writes, retries transient failures, and preserves newer edits when responses arrive. |
| Make exam results trustworthy | Server-side deadlines and grading; mock answers stay hidden until submission. Each attempt retains a fixed question snapshot. |
| Let visitors try before signing up | Anonymous ownership cookies protect guest attempts. Claiming an attempt links it to a user and removes access through the old guest identity. |
| Reduce unnecessary data transfer | Incremental feedback returns explanations when needed; ordinary saves omit the immutable question snapshot. |
| Protect the API boundary | Ownership checks, origin validation, request-size limits, persistent rate limiting, and private error details. |
| Ship a repeatable runtime | A multi-stage Docker build, non-root container, read-only application filesystem, health check, and a dedicated writable cache. |
| Validate changes before release | CI runs dependency auditing, bank validation, lint, type checks, unit/mocked API tests, a production build, and Docker smoke tests. Deployment remains manual. |

The [performance write-up](docs/exam-performance.md) includes a reproducible fixture comparison: routine-save JSON fell from **86,578 to 3,371 bytes**. These are serialized fixture sizes, not measured production latency or a promise of zero delay.

<details>
<summary><strong>Product capabilities</strong></summary>

| Feature | What it brings to your study session |
| --- | --- |
| ⏱️ Timed mock exams | A countdown, domain-weighted question selection, flags, and a review step before submission. |
| 🎯 Domain practice | Focus on selected topics and reveal feedback after checking each answer. |
| 🧩 Single and multiple response | Radio and checkbox questions with explicit selection requirements. |
| 💡 Detailed explanations | Reasoning for correct answers, individual distractor breakdowns, and documentation references. |
| 📊 Results that guide revision | A practice score, question-by-question review, and accuracy by domain. |
| 📱 A responsive exam workspace | Large answer cards, persistent navigation, and a question jump drawer. |
| ⚡ Immediate interactions | Answer selection and navigation update locally while progress saves in the background. |
| ♿ Keyboard-friendly controls | Visible focus, drawer focus management, status announcements, and reduced-motion support. |

</details>

<details>
<summary><strong>How scoring and saved progress work</strong></summary>

Multiple-response questions use exact matching, with no partial credit. Unanswered or incomplete answers count as incorrect. Mock exams require enough questions in each domain to satisfy the configured blueprint.

> **A study aid, not an official exam.** Question banks may contain errors; verify technical claims against official documentation and report corrections.

The practice score uses each certification's configured scale:

```text
round(minimumScore + (correct / total) × (maximumScore - minimumScore))
```

Domain accuracy is a raw percentage. Domains not sampled do not receive an accuracy value.

Attempts are stored in PostgreSQL with a fixed question snapshot. Anonymous practice uses an HttpOnly owner cookie, and session storage remembers the current attempt in that browser tab. Optional accounts provide cross-device history: signing up or logging in links that browser's anonymous attempts without changing answers or timers.

Selections, flags, and navigation update immediately. A serialized save queue batches progress updates and retries connection failures. Pending drafts remain in session storage. Answer checking and final submission still require a server response. Correct answers are returned only for checked domain questions or submitted attempts.

Closing the browser does not pause a mock exam. The server enforces its deadline and finalizes an expired attempt on the next request. Only answers saved before the deadline count.

</details>

<a id="architecture"></a>
## 🏗️ Architecture

```mermaid
flowchart LR
    Browser["Browser · React UI"] -->|HTTPS| Nginx["Nginx · TLS termination"]
    subgraph EC2["AWS EC2 · Ubuntu"]
        Nginx -->|localhost:3000| App["Docker · Next.js App Router"]
        App --> Auth["Better Auth · sessions"]
        App --> Exam["Exam API · ownership and grading"]
        Auth --> Prisma["Prisma ORM"]
        Exam --> Prisma
    end
    Prisma --> DB[("Supabase · PostgreSQL")]
    CI["GitHub Actions · checks and image build"] -. Manual release .-> App
```

The browser handles interaction and temporary drafts. Next.js route handlers authorize requests and own grading, deadlines, and persistence. PostgreSQL stores users, sessions, certification content, and attempt snapshots; the browser never connects directly to the database.

Nginx terminates HTTPS and forwards requests to the container's loopback-only port. Production secrets are supplied at runtime rather than baked into the image. GitHub Actions can export a commit-tagged image for a deliberate, manual release with rollback instructions.

<a id="code-tour"></a>
## 💻 A guided code tour

| Start here | What to look for |
| --- | --- |
| [Exam workspace](components/exam/ExamWorkspace.tsx) | Question flow, navigation, feedback, and review UI. |
| [Background synchronization](lib/exam-sync.ts) · [tests](tests/exam-sync.test.ts) | Batching, response ordering, retry behavior, and draft preservation. |
| [Exam logic](lib/exam-logic.ts) · [tests](tests/exam.test.ts) | Selection, scoring, and domain calculations. |
| [Account ownership](lib/auth-logic.ts) · [tests](tests/auth.test.ts) | Guest-to-account claims and authorization boundaries. |
| [Request protections](lib/request-security.ts) · [tests](tests/request-security.test.ts) | Origin checks and input boundaries. |
| [Database security tests](tests/security-database.test.ts) | In-memory PostgreSQL checks for database protections. |
| [Dockerfile](Dockerfile) · [Compose](deploy/ec2/compose.yaml) · [CI](.github/workflows/ci.yml) | Build isolation, constrained runtime, and release validation. |

### Deliberate tradeoffs

- **Responsive does not mean offline:** selection and navigation are local, but answer reveal and final submission require the server.
- **Practice scores are estimates:** the configurable scale is useful for revision, not a replica of vendor psychometric scoring.
- **One application, one deployment:** a single Next.js service keeps operations approachable; a single EC2 host is not a highly available cluster.
- **Security work is ongoing:** email verification/password recovery and a full script CSP remain follow-up work. See [authentication](docs/authentication.md) and [security notes](docs/security-hardening.md); some hosting notes there describe the earlier Netlify deployment.

## 🛠️ Built with

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 · App Router · React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Data | PostgreSQL · Prisma 6 |
| Authentication | Better Auth · email/password · optional Google OAuth |
| Validation | ESLint · TypeScript · Node.js test runner |
| CI | GitHub Actions · Node.js 24 · Ubuntu |
| Hosting | AWS EC2 · Docker Compose · Nginx · Let's Encrypt |
| Managed database | Supabase PostgreSQL |

## 🧪 Checks and CI

Run these from the repository root before submitting a change:

```bash
npx prisma generate
npx prisma db seed -- --validate-only
npm run lint
npx next typegen
npx tsc --noEmit
node --import tsx --test tests/*.test.ts
npm run build
```

The **CI checks** job runs on pull requests, pushes to `main`, and manual dispatch. It installs locked dependencies, generates Prisma Client, audits dependencies, validates banks, checks lint and types, runs unit/mocked API tests, and builds the application. A subsequent Docker job builds the Linux image and smoke-tests Compose startup, static assets, Prisma engine loading, and runtime filesystem permissions.

**CI only:** the workflow uses placeholder database URLs and read-only repository permissions. It does not deploy, seed a database, or apply schema changes. Hosting-provider deployments are configured separately. Passing CI does not verify production database connectivity or browser behavior.

<details>
<summary><strong>Optional live exam test</strong></summary>

With the development server running at `127.0.0.1:3000` and both processes pointing at the same dedicated development database:

```bash
node --import tsx tests/exam-live.ts
```

This test creates and removes its own attempts and expects the current seeded AWS bank, including 274 available questions. It is excluded from CI and must not run against production. See [CONTRIBUTING.md](CONTRIBUTING.md) for additional manual checks.

</details>

## Hosting on AWS EC2

See the [manual EC2 deployment guide](docs/aws-ec2.md) for Docker Compose,
Nginx/HTTPS, runtime secrets, and rollback. GitHub Actions builds and smoke-tests
the Linux Docker image; it does not deploy or modify the production database.

## 📚 Working with question banks

Banks live under `prisma/Data/<Platform>/<Certification>/*.json`. The importer discovers the data directory case-insensitively; preserve the tracked path casing when contributing.

Each version 2 bank contains:

- `schemaVersion: 2` and platform metadata.
- Certification metadata, including `mockExam` settings and `domains`.
- Questions with stable IDs, option IDs, correct answers, explanations, and documentation references.

Use the included AWS bank as a complete format example. Keep certification slugs and question IDs stable. `correctOptionIds` must match `selectionCount`, every distractor requires an explanation, domain weights must total 100, and references must use HTTPS.

```bash
# Check all banks without changing the database
npx prisma db seed -- --validate-only

# Import validated banks into your development database
npx prisma db seed
```

The importer validates all version 2 files before writing and upserts records. Removed version 2 questions are marked as legacy rather than deleted. Only version 2 questions count toward availability; existing attempt snapshots remain unchanged. Legacy array files are skipped with a progress message.

## ⌨️ Keyboard and accessibility

| Shortcut | Action |
| --- | --- |
| `1–4` or `A–D` | Select an answer option |
| `F` | Toggle the current question's flag |
| `←` / `→` | Previous / next question |
| `Enter` | Advance, unless a focused control has its own action |
| `Escape` | Close the question navigator and restore focus |

Shortcuts can be disabled in the navigator or desktop sidebar. Native controls retain their normal behavior, and Tab remains inside an open navigator dialog.

The timer turns amber at ten minutes and red at two minutes. Threshold announcements avoid reading every tick aloud, and reduced-motion preferences disable warning pulses and drawer animation. Correctness uses text and icons as well as color. These provisions do not replace a full accessibility audit with assistive technologies.

## 🔧 Troubleshooting

| Symptom | What to check |
| --- | --- |
| Question availability cannot load | Database reachability, both environment URLs, and successful schema setup and seeding. |
| Prisma reports a locked DLL on Windows | Stop the development server and other processes using this project's Prisma Client, then regenerate. |
| Mock exam cannot start | The bank must contain enough questions in every configured domain. |
| TypeScript cannot find a Prisma model | Run `npx prisma generate` after pulling schema changes. |

## 🤝 Make CertiBlank better

Question corrections, accessible UI improvements, focused bug fixes, and clearer documentation are welcome.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and create a focused branch from an up-to-date `main`.
2. Make your change and run the relevant checks.
3. Open a pull request explaining the behavior change and how you verified it.
4. Wait for **CI checks** and resolve review feedback before merging.

Only contribute question data or artwork you have permission to share, and include its source and redistribution terms.

**Found a vulnerability?** Follow [SECURITY.md](SECURITY.md) to report it privately. Do not include credentials or exploit details in public issues.

<a id="license"></a>
## 📄 License and attribution

The original application code, scripts, configuration, and project documentation are licensed under the **[MIT License](LICENSE)**.

Question-bank JSON files under `prisma/Data` (also referred to as `prisma/data`) and vendor logos/certification artwork are **excluded from the MIT grant**. Their redistribution terms have not yet been established here; inclusion in this repository does not grant permission to redistribute them. Third-party dependencies retain their own licenses.

Vendor names and trademarks belong to their respective owners. CertiBlank does not claim vendor endorsement.

---

<div align="center">

**Practice with purpose. Understand the answer. Fill the blank.**

If CertiBlank helps you study, consider giving the project a ⭐ or contributing an improvement.

</div>

