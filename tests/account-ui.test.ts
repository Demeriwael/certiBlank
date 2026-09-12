import assert from "node:assert/strict";
import { test } from "node:test";
import { certificationLabel, practiceStatus } from "../lib/account-ui";

test("practice status separates resumable sessions, expired mocks, and completed work", () => {
  const now = Date.parse("2026-09-12T12:00:00Z");
  assert.equal(practiceStatus({ submittedAt: null, expiresAt: null }, now), "active");
  assert.equal(practiceStatus({ submittedAt: null, expiresAt: "2026-09-12T12:01:00Z" }, now), "active");
  assert.equal(practiceStatus({ submittedAt: null, expiresAt: "2026-09-12T12:00:00Z" }, now), "expired");
  assert.equal(practiceStatus({ submittedAt: "2026-09-12T11:00:00Z", expiresAt: "2026-09-12T12:00:00Z" }, now), "completed");
});

test("history displays catalog names and exam codes with a readable fallback", () => {
  assert.deepEqual(certificationLabel("az-900-fundamentals"), { title: "Azure Fundamentals", provider: "Azure", code: "AZ-900" });
  assert.equal(certificationLabel("cloud-practitioner").code, "CLF-C02");
  assert.equal(certificationLabel("new-certification").title, "New Certification");
});
