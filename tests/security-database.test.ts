import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL in memory: never loads .env or connects to Supabase.
const db = new PGlite();
let limit: typeof import("../lib/exam-rate-limit").limitExam;
const tables = ["Platform", "Certification", "Question", "ExamAttempt", "User", "Session", "Account", "Verification", "RateLimit"];
before(async () => {
  for (const name of ["20260912000000_baseline", "20260912010000_user_authentication"]) {
    await db.exec(await readFile(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), "utf8"));
  }
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; GRANT USAGE ON SCHEMA public TO anon, authenticated; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
  // Even a previously permissive policy must not make Data API roles usable.
  await db.exec('CREATE POLICY legacy_access ON "ExamAttempt" FOR ALL TO PUBLIC USING (true) WITH CHECK (true);');
  await db.exec('GRANT SELECT ("id") ON "ExamAttempt" TO anon;');
  await db.exec(`INSERT INTO "ExamAttempt" ("id", "owner", "certSlug", "mode", "snapshot", "answers") VALUES ('private-attempt', 'private-owner', 'aws', 'domain', '{}', '{}')`);
  await db.exec(await readFile(new URL("../prisma/migrations/20260916000000_restrict_data_api/migration.sql", import.meta.url), "utf8"));
  Object.assign(globalThis, { prisma: { $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.reduce((result, part, index) => result + (index ? `$${index}` : "") + part, "");
    return (await db.query(sql, values.map(value => typeof value === "bigint" ? value.toString() : value))).rows;
  } } });
  ({ limitExam: limit } = await import("../lib/exam-rate-limit"));
});
after(async () => { await db.close(); });

test("migration blocks Data API roles, enables RLS, and retains owner access", async () => {
  for (const table of tables) {
    const state = await db.query<{ relrowsecurity: boolean }>("SELECT relrowsecurity FROM pg_class WHERE oid = $1::regclass", [`public."${table}"`]);
    assert.equal(state.rows[0].relrowsecurity, true);
    // The Prisma owner still reads normally.
    await db.query(`SELECT count(*) FROM "${table}"`);
    for (const role of ["anon", "authenticated"]) {
      for (const operation of ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE"]) {
        const result = await db.query<{ allowed: boolean }>("SELECT has_table_privilege($1, $2, $3) AS allowed", [role, `public."${table}"`, operation]);
        assert.equal(result.rows[0].allowed, false, `${role} ${operation} ${table}`);
      }
    }
  }
  // Simulate a later accidental column grant: the restrictive policy still wins.
  await db.exec('GRANT SELECT ("id") ON "ExamAttempt" TO anon;');
  await db.exec("SET ROLE anon");
  try {
    await assert.rejects(db.query('SELECT * FROM "ExamAttempt"'), /permission denied/);
    assert.equal((await db.query('SELECT "id" FROM "ExamAttempt"')).rows.length, 0);
  }
  finally { await db.exec("RESET ROLE"); }
});

test("concurrent creation budgets cannot exceed the limit and recover after expiry", async () => {
  const request = (ip: string, forwarded = "198.51.100.99") => new Request("https://certi.test/api/exams", { headers: { "x-nf-client-connection-ip": ip, "x-forwarded-for": forwarded } });
  const responses = await Promise.all(Array.from({ length: 20 }, (_, index) => limit(request("203.0.113.1", `198.51.100.${index}`), "create")));
  assert.equal(responses.filter(response => response === null).length, 10);
  assert.equal(responses.filter(response => response?.status === 429).length, 10);
  assert.ok(Number(responses.find(Boolean)!.headers.get("retry-after")) > 0);
  assert.equal(await limit(request("203.0.113.2"), "create"), null);
  assert.equal(await limit(request("203.0.113.1"), "save"), null);
  const keys = await db.query<{ key: string }>('SELECT "key" FROM "RateLimit"');
  assert.ok(keys.rows.every(row => !row.key.includes("203.0.113")));
  await db.exec('UPDATE "RateLimit" SET "lastRequest" = 0');
  assert.equal(await limit(request("203.0.113.1"), "create"), null);
});

test("security migration also works on vanilla PostgreSQL without Supabase roles", async () => {
  const plain = new PGlite();
  try {
    for (const name of ["20260912000000_baseline", "20260912010000_user_authentication", "20260916000000_restrict_data_api"]) {
      await plain.exec(await readFile(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), "utf8"));
    }
  } finally { await plain.close(); }
});
