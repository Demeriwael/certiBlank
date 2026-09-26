import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCertificationRequest } from "../lib/certification-request";
import { RequestValidationError } from "../lib/request-security";

test("certification requests accept known or new platforms and normalize whitespace", () => {
  assert.deepEqual(parseCertificationRequest({ platform: "  AWS  ", certification: " Solutions   Architect " }), {
    platform: "AWS", certification: "Solutions Architect",
  });
  assert.deepEqual(parseCertificationRequest({ platform: "New platform", certification: "New exam" }), {
    platform: "New platform", certification: "New exam",
  });
});

test("certification requests reject empty, oversized and control-character fields", () => {
  for (const body of [
    {}, { platform: " ", certification: "CCNA" }, { platform: "Cisco", certification: " " },
    { platform: "a".repeat(81), certification: "Exam" },
    { platform: "AWS", certification: "a".repeat(121) },
    { platform: "AWS", certification: "Exam\u0000hidden" },
  ]) {
    assert.throws(() => parseCertificationRequest(body), RequestValidationError);
  }
});
