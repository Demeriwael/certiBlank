import assert from "node:assert/strict";
import test from "node:test";
import { databaseDiagnostics } from "../lib/database-diagnostics";

test("classifies Prisma codes without disclosing credentials or error metadata", () => {
  const secret = "postgresql://private-user:private-password@private-host/db";
  const result = databaseDiagnostics({ name: "PrismaClientInitializationError", errorCode: "P1000", message: secret, stack: secret, meta: { secret } }, { DATABASE_URL: secret });
  assert.equal(result.reason, "authentication_failed");
  assert.equal(result.databaseUrl, "postgresql_url_present");
  assert.equal(result.directUrl, "missing");
  assert.doesNotMatch(JSON.stringify(result), /private-/);
});

test("recognizes engine failures while excluding untrusted error properties", () => {
  const result = databaseDiagnostics({ name: "secret", code: "secret", message: "Could not locate the Query Engine: secret" }, { DATABASE_URL: "secret" });
  assert.equal(result.reason, "query_engine_loading_error");
  assert.equal(result.databaseUrl, "invalid_url_format");
  assert.doesNotMatch(JSON.stringify(result), /secret/);
});

test("handles missing errors and configuration without leaking other environment values", () => {
  const result = databaseDiagnostics(null, { OTHER_SECRET: "secret", DATABASE_URL: "https://example.com" });
  assert.equal(result.code, null);
  assert.equal(result.databaseUrl, "invalid_url_format");
  assert.doesNotMatch(JSON.stringify(result), /secret|example/);
});
