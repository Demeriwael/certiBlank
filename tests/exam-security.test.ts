import assert from "node:assert/strict";
import { before, test } from "node:test";

let calls = 0;
const prisma = { $queryRaw: async () => { calls++; return [{ count: 999, retryAfter: 30 }]; } };
let create: typeof import("../app/api/exams/route").POST;
let update: typeof import("../app/api/exams/[id]/route").POST;
before(async () => {
  Object.assign(globalThis, { prisma });
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET ??= "test-only-secret-never-use-in-production-123456789";
  ({ POST: create } = await import("../app/api/exams/route"));
  ({ POST: update } = await import("../app/api/exams/[id]/route"));
});
function request(body: string, origin = process.env.BETTER_AUTH_URL!, contentType = "application/json") {
  return new Request(`${process.env.BETTER_AUTH_URL}/api/exams`, { method: "POST", headers: { origin, "content-type": contentType }, body });
}
test("exam routes reject cross-origin and oversized mutations before accessing sessions or database", async () => {
  for (const handler of [create, (r: Request) => update(r, { params: Promise.resolve({ id: "unknown" }) })]) {
    const initial = calls;
    assert.equal((await handler(request("{}", "https://evil.test"))).status, 403);
    assert.equal((await handler(request("{}", process.env.BETTER_AUTH_URL, "text/plain"))).status, 415);
    assert.equal((await handler(request(JSON.stringify({ text: "x".repeat(70000) })))).status, 413);
    const malformed = await handler(request("private-bad-json"));
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: "Invalid JSON" });
    assert.equal(calls, initial);
  }
});
test("creation returns Retry-After without reading a bank when its budget is exhausted", async () => {
  const response = await create(request(JSON.stringify({ certSlug: "cloud-practitioner", mode: "mock" })));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "30");
});
