# Privacy Policy and Terms of Service

The public routes are `/privacy` and `/terms`. Shared presentation lives in `components/legal-document.tsx`. Footer links and collection notices expose them from the catalog, account forms, and certification request form. The footer is hidden during an exam to avoid competing with fixed exam controls.

Operator-confirmed facts: Wael Demeri, Jordan; public contact `waeldemeri@gmail.com`; intended audience 13+; currently free; no additional advertising or analytics. Pages describe the current AWS/Supabase deployment, Better Auth records, guest attempts, functional storage, and manual privacy requests. They do not claim automated deletion or verified parental consent. Last-updated date: September 29, 2026; adjust when content actually changes.

## Review before publication

These are implementation-grounded drafts, not a legal opinion or certification of compliance. Obtain qualified Jordanian legal review, especially for:

- The lawful basis for each processing purpose and any explicit, recorded consent required. The current application does not record acceptance of a specific terms/privacy version or provide a separate data-processing consent workflow. A notice is not that workflow.
- Users aged 13–17 and anyone lacking legal capacity: the age statement does not implement age assurance or verifiable parental permission. Review the eligibility and consent flow before relying on it for those users.
- International transfers, provider contracts, actual hosting/backups/support locations, and any notification, registration, or data-protection officer duties that apply. Do not assume EU hosting alone satisfies Jordanian transfer requirements.
- A concrete retention/deletion schedule, including anonymous attempts, expired auth/verification records, IP-based rate-limit records, certification requests, logs, and backups. No automatic database cleanup schedule is currently implemented; expiry fields are not deletion jobs.
- How requests are verified proportionately, tracked, fulfilled within applicable deadlines, and removed from active systems/backups. Avoid asking for passwords or tokens. Deletion must cover relevant linked and provider records, not only the User row.
- Final liability, governing-law, notice, and terms acceptance wording for the intended audience. Future paid features, tracking, or email campaigns require revisiting the documents and related controls first.

No new cookie banner is added: current storage supports authentication, progress, and preferences. Reassess consent requirements if the storage purposes or audience change. No age or consent enforcement was added in this documentation/UI change.

## Reference material

- [Jordan Personal Data Protection Law, official English translation](https://www.modee.gov.jo/EBV4.0/Root_Storage/EN/1/PDP_Law_-_English_Version-_officail_translation.pdf): consent and legal capacity, rights, international transfers.
- [Jordan Ministry privacy FAQs](https://modee.gov.jo/EN/Pages/FAQs) and [current regulations and guidance](https://modee.gov.jo/EN/List/The_law_regulations_and_instructions).
- [ICO transparency guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/): a useful transparency checklist, not a determination that UK GDPR applies.

## Release checks

Review both themes and a narrow mobile viewport; keyboard through policy links and the table of contents. Confirm account/provider notices appear before sign-up actions. Keep the same public email monitored for privacy, deletion, and support requests. Deploy through the existing manual Docker release process; no Prisma migration or new environment variable is required.
