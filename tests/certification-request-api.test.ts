import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

const prisma = {
  certificationRequest: { create: async (args: unknown) => { void args; return { id: "sample" }; } },
  $queryRaw: async () => [{ count: 1, retryAfter: 60 }],
};
let post: typeof import("../app/api/certification-requests/route").POST;
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const request = (body: unknown, requestOrigin = origin) => new Request(`${origin}/api/certification-requests`, {
  method: "POST", headers: { origin: requestOrigin, "content-type": "application/json" }, body: JSON.stringify(body),
});

before(async () => {
  Object.assign(globalThis, { prisma });
  ({ POST: post } = await import("../app/api/certification-requests/route"));
});

test("a valid public request is stored and returns only a confirmation", async () => {
  const save = mock.method(prisma.certificationRequest, "create");
  try {
    const response = await post(request({ platform: "  Cisco ", certification: " CCNA " }));
    assert.equal(response.status, 201);
    assert.deepEqual(save.mock.calls[0].arguments[0], { data: { platform: "Cisco", certification: "CCNA" } });
    assert.deepEqual(await response.json(), { message: "Thanks. Your certification request has been received." });
  } finally { save.mock.restore(); }
});

test("invalid inputs and cross-origin requests never create records", async () => {
  const save = mock.method(prisma.certificationRequest, "create");
  try {
    assert.equal((await post(request({ platform: "AWS", certification: "" }))).status, 400);
    assert.equal((await post(request({ platform: "AWS", certification: "Exam" }, "https://other.example"))).status, 403);
    assert.equal(save.mock.callCount(), 0);
  } finally { save.mock.restore(); }
});

test("rate limit stops storage and database errors stay private", async () => {
  const limit = mock.method(prisma, "$queryRaw", async () => [{ count: 6, retryAfter: 30 }]);
  const save = mock.method(prisma.certificationRequest, "create");
  try {
    const limited = await post(request({ platform: "AWS", certification: "Exam" }));
    assert.equal(limited.status, 429);
    assert.equal(save.mock.callCount(), 0);
  } finally { limit.mock.restore(); save.mock.restore(); }
  const fail = mock.method(prisma.certificationRequest, "create", async () => { throw new Error("private database detail"); });
  try {
    const response = await post(request({ platform: "AWS", certification: "Exam" }));
    assert.equal(response.status, 500);
    assert.ok(!JSON.stringify(await response.json()).includes("private database detail"));
  } finally { fail.mock.restore(); }
});
