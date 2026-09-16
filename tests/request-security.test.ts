import assert from "node:assert/strict";
import { test } from "node:test";
import { readJson, requireOrigin, requestError, RequestValidationError } from "../lib/request-security";
import config from "../next.config";

const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
function request(body: string, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/exams`, { method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body });
}
test("mutation origin rejects missing, null, external and spoofed forwarding origins", () => {
  assert.doesNotThrow(() => requireOrigin(request("{}")));
  for (const value of ["", "null", "https://evil.test"]) {
    assert.throws(() => requireOrigin(request("{}", { origin: value, "x-forwarded-host": "evil.test" })), (e: unknown) => e instanceof RequestValidationError && e.status === 403);
  }
});
test("JSON reader bounds streamed bytes and does not trust Content-Length", async () => {
  assert.deepEqual(await readJson(request('{"ok":true}'), 20), { ok: true });
  for (const headers of [{}, { "content-length": "1" }] as Record<string, string>[]) {
    await assert.rejects(readJson(request(JSON.stringify({ text: "é".repeat(20) }), headers), 30), (e: unknown) => e instanceof RequestValidationError && e.status === 413);
  }
  let cancelled = false;
  const stream = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(10)); }, cancel() { cancelled = true; } });
  const streaming = new Request(`${origin}/api/exams`, { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
  await assert.rejects(readJson(streaming, 15), /Request too large/);
  assert.equal(cancelled, true);
});
test("JSON reader rejects simple-request content types, malformed bodies and non-objects", async () => {
  await assert.rejects(readJson(request("{}", { "content-type": "text/plain" })), (e: unknown) => e instanceof RequestValidationError && e.status === 415);
  for (const body of ["not-json-private-value", "null", "[]", "true"]) await assert.rejects(readJson(request(body)), RequestValidationError);
});
test("public errors never expose unexpected TypeError or parser details", async () => {
  for (const error of [new TypeError("private details"), new SyntaxError("private input")]) {
    const response = requestError(error, "Request failed");
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "Request failed" });
  }
  assert.equal(requestError(new RequestValidationError("Too large", 413), "failed").status, 413);
});
test("global headers block framing without breaking inline hydration", async () => {
  const rules = await config.headers!();
  const headers = new Headers(rules[0].headers.map(h => [h.key, h.value]));
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.match(headers.get("content-security-policy")!, /frame-ancestors 'none'/);
  assert.equal(config.poweredByHeader, false);
});
