import assert from "node:assert/strict";
import { test } from "node:test";
import { certificationLabel, filterAccountAttempts, practiceStatus, type AccountAttempt } from "../lib/account-ui";

test("practice status separates resumable sessions, expired mocks, and completed work", () => {
  const now = Date.parse("2026-09-12T12:00:00Z");
  assert.equal(practiceStatus({ submittedAt: null, expiresAt: null }, now), "active");
  assert.equal(practiceStatus({ submittedAt: null, expiresAt: "2026-09-12T12:01:00Z" }, now), "active");
  assert.equal(practiceStatus({ submittedAt: null, expiresAt: "2026-09-12T12:00:00Z" }, now), "expired");
  assert.equal(practiceStatus({ submittedAt: "2026-09-12T11:00:00Z", expiresAt: "2026-09-12T12:00:00Z" }, now), "completed");
});

test("history search combines provider, exam code, and mode with status filters", () => {
  const now = Date.parse("2026-09-29T12:00:00Z");
  const base = { createdAt: "2026-09-29T10:00:00Z", submittedAt: null, expiresAt: null };
  const attempts: AccountAttempt[] = [
    { ...base, id: "active", certSlug: "az-900-fundamentals", mode: "domain" },
    { ...base, id: "completed", certSlug: "cloud-practitioner", mode: "mock", submittedAt: "2026-09-29T11:00:00Z" },
    { ...base, id: "expired", certSlug: "az-900-fundamentals", mode: "mock", expiresAt: "2026-09-29T11:00:00Z" },
  ];
  assert.deepEqual(filterAccountAttempts(attempts, "all", "  AZ-900   DOMAIN ", now).map(item => item.id), ["active"]);
  assert.deepEqual(filterAccountAttempts(attempts, "completed", "aws", now).map(item => item.id), ["completed"]);
  assert.deepEqual(filterAccountAttempts(attempts, "expired", "azure", now).map(item => item.id), ["expired"]);
  assert.deepEqual(filterAccountAttempts(attempts, "active", "mock", now), []);
  assert.deepEqual(filterAccountAttempts(attempts, "all", "  ", now), attempts);
  assert.deepEqual(filterAccountAttempts([], "all", "", now), []);
});

test("history displays catalog names and exam codes with a readable fallback", () => {
  assert.deepEqual(certificationLabel("az-900-fundamentals"), { title: "Azure Fundamentals", provider: "Azure", code: "AZ-900" });
  assert.equal(certificationLabel("cloud-practitioner").code, "CLF-C02");
  assert.equal(certificationLabel("new-certification").title, "New Certification");
});
