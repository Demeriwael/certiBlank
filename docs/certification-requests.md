# Certification requests

Visitors can request a platform and certification from the catalog without creating an account. The form is linked from coming-soon rows, empty search results, and the catalog footer. Requests are private: there is no public list or vote count, and submitting one does not promise a release date.

The POST endpoint at `/api/certification-requests` accepts JSON only, requires the configured application origin, validates lengths, and applies a five-per-day budget per trusted client IP before writing to PostgreSQL. The database table stores only platform, certification name, and submission time. The migration enables RLS and revokes access from Supabase Data API roles; the Next.js server connects as the trusted table owner.

## Deploying

This is an additive migration. It is **not** applied by the Docker image or CI. Before deploying the new application release, back up the database and run the migration manually with the intended production `DATABASE_URL` and `DIRECT_URL` in the local environment:

```powershell
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

Do not run `migrate reset`, `db push`, or a production seed for this feature. Then deploy the image as described in [AWS EC2 deployment](aws-ec2.md). Image rollback does not remove the new table, which is safe for the previous application version.

To review recent suggestions, use Supabase's SQL editor as a trusted project administrator:

```sql
SELECT "platform", "certification", count(*) AS requests, max("createdAt") AS latest
FROM public."CertificationRequest"
GROUP BY "platform", "certification"
ORDER BY requests DESC, latest DESC;
```

Suggestions are free text, so combine spelling variants when reviewing. Do not expose this administrative query through a public API. Set a retention policy before the table grows substantially.
