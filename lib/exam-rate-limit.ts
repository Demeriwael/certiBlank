import { createHmac, randomUUID } from "node:crypto";
import { getIP } from "better-auth/api";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";

// Separate budgets leave room for autosaves without allowing unlimited snapshots.
export const examBudgets = {
  create: { max: 10, seconds: 60 },
  createDaily: { max: 100, seconds: 86400 },
  read: { max: 120, seconds: 60 },
  save: { max: 120, seconds: 60 },
} as const;

export function examRateKey(request: Request, operation: keyof typeof examBudgets) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("Missing rate-limit secret");
  const ip = getIP(request, authOptions) ?? "no-trusted-ip";
  const digest = createHmac("sha256", secret ?? "local-development-only").update(ip).digest("hex");
  return `exam:${operation}:${digest}`;
}

export async function limitExam(request: Request, operation: keyof typeof examBudgets) {
  const { max, seconds } = examBudgets[operation];
  const key = examRateKey(request, operation);
  const windowMs = BigInt(seconds * 1000);
  // One atomic statement across serverless instances. DB time avoids host clock skew.
  // Reuse rows per IP/operation; saturate the counter rather than growing it forever.
  const rows = await prisma.$queryRaw<{ count: number; retryAfter: number }[]>`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, floor(extract(epoch FROM statement_timestamp()) * 1000)::bigint)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."lastRequest" <= floor(extract(epoch FROM statement_timestamp()) * 1000)::bigint - ${windowMs}
        THEN 1 ELSE LEAST("RateLimit"."count" + 1, ${max + 1}) END,
      "lastRequest" = CASE WHEN "RateLimit"."lastRequest" <= floor(extract(epoch FROM statement_timestamp()) * 1000)::bigint - ${windowMs}
        THEN floor(extract(epoch FROM statement_timestamp()) * 1000)::bigint ELSE "RateLimit"."lastRequest" END
    RETURNING "count", GREATEST(1, ceil(("lastRequest" + ${windowMs} - extract(epoch FROM statement_timestamp()) * 1000) / 1000))::int AS "retryAfter"
  `;
  if (!rows[0]) throw new Error("Rate limiter returned no result");
  if (rows[0].count <= max) return null;
  return Response.json({ error: "Too many requests. Please wait and try again." }, {
    status: 429, headers: { "Retry-After": String(rows[0].retryAfter), "Cache-Control": "no-store" },
  });
}
