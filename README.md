This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
