import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { getIP } from "better-auth/api";
import { memoryAdapter } from "better-auth/adapters/memory";
import { authOptions } from "../lib/auth-options";
import { attemptAccess, authReturnPath, claimAttempts, sameOrigin } from "../lib/auth-logic";
import type { PrismaClient } from "@prisma/client";

test("auth return paths allow exam resumes but reject external and malformed URLs", () => {
  for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/api/auth/sign-out", "/platform/aws?next=https://evil.test", "/platform/%2f%2fevil.test", null]) assert.equal(authReturnPath(path), "/account");
  assert.equal(authReturnPath("/platform/cloud-practitioner?attempt=abc-123"), "/platform/cloud-practitioner?attempt=abc-123");
});

test("account access never falls back to anonymous ownership", () => {
  assert.equal(attemptAccess(undefined, undefined), null);
  assert.deepEqual(attemptAccess(undefined, "guest"), { owner: "guest", userId: null });
  assert.deepEqual(attemptAccess("user-a", "guest"), { userId: "user-a" });
  assert.deepEqual(attemptAccess("user-b", "guest"), { userId: "user-b" });
});

test("claim requires same-origin POST authorization", () => {
  assert.ok(sameOrigin(new Request("https://certi.test/api/account/claim", { headers: { origin: "https://certi.test" } })));
  assert.ok(!sameOrigin(new Request("https://certi.test/api/account/claim", { headers: { origin: "https://evil.test" } })));
  assert.ok(!sameOrigin(new Request("https://certi.test/api/account/claim")));
});

test("claim moves in-progress and completed attempts exactly once without altering progress", async () => {
  const owner = "12345678-1234-1234-1234-123456789012";
  const rows = [
    { owner, userId: null as string | null, answers: { q1: ["b"] }, version: 4, submittedAt: null as Date | null, expiresAt: new Date(), flagged: ["q2"] },
    { owner, userId: null, answers: { q1: ["a"] }, version: 8, submittedAt: new Date(), expiresAt: null, flagged: [] },
    { owner, userId: "other-account", answers: {}, version: 1, submittedAt: null, expiresAt: null, flagged: [] },
    { owner: "another-browser", userId: null, answers: {}, version: 2, submittedAt: null, expiresAt: null, flagged: [] },
  ];
  const original = structuredClone(rows);
  let calls = 0;
  const db = { examAttempt: { updateMany: async ({ where, data }: { where: { owner: string; userId: null }; data: { userId: string } }) => {
    calls++; assert.equal(where.userId, null); assert.deepEqual(Object.keys(data), ["userId"]);
    const matching = rows.filter(row => row.owner === where.owner && row.userId === null);
    matching.forEach(row => { row.userId = data.userId; }); return { count: matching.length };
  } } } as unknown as Pick<PrismaClient, "examAttempt">;
  assert.equal(await claimAttempts(db, "new-account", owner), 2);
  assert.equal(await claimAttempts(db, "new-account", owner), 0);
  assert.equal(await claimAttempts(db, "attacker", owner), 0);
  assert.equal(await claimAttempts(db, "new-account"), 0);
  assert.equal(await claimAttempts(db, "new-account", "bad-cookie"), 0);
  assert.equal(calls, 3);
  rows.forEach((row, index) => assert.deepEqual(row, { ...original[index], userId: index < 2 ? "new-account" : original[index].userId }));
});

test("failed claims surface failure so the caller retains the anonymous cookie for retry", async () => {
  const db = { examAttempt: { updateMany: async () => { throw new Error("offline"); } } } as unknown as Pick<PrismaClient, "examAttempt">;
  await assert.rejects(claimAttempts(db, "user", "12345678-1234-1234-1234-123456789012"), /offline/);
});

test("password auth hashes credentials, authenticates, rejects bad credentials and revokes logout sessions", async () => {
  const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [], rateLimit: [] };
  const auth = betterAuth({ ...authOptions, baseURL: "http://localhost:3000", secret: "test-only-secret-not-for-deployment-123456789", database: memoryAdapter(db), rateLimit: { enabled: false } });
  const request = (path: string, body?: unknown, cookie?: string) => auth.handler(new Request(`http://localhost:3000/api/auth/${path}`, {
    method: body ? "POST" : "GET", headers: { origin: "http://localhost:3000", "content-type": "application/json", ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  const credentials = { email: "test@example.com", password: "a-long-test-password", name: "Tester" };
  const short = await request("sign-up/email", { ...credentials, password: "short" });
  assert.equal(short.status, 400);
  const signup = await request("sign-up/email", credentials);
  assert.equal(signup.status, 200, await signup.clone().text());
  assert.notEqual(db.account[0].password, credentials.password);
  assert.equal(typeof db.account[0].password, "string");
  const login = await request("sign-in/email", credentials);
  assert.equal(login.status, 200);
  const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.match(login.headers.get("set-cookie")!, /HttpOnly/i);
  const session = await request("get-session", undefined, cookie);
  assert.equal((await session.json()).user.email, credentials.email);
  assert.equal((await request("sign-in/email", { ...credentials, password: "incorrect-password" })).status, 401);
  assert.equal((await request("sign-out", {}, cookie)).status, 200);
  assert.equal(await (await request("get-session", undefined, cookie)).json(), null);
  const csrf = await auth.handler(new Request("http://localhost:3000/api/auth/sign-in/email", { method: "POST", headers: { origin: "https://evil.test", "content-type": "application/json" }, body: JSON.stringify(credentials) }));
  assert.equal(csrf.status, 403);
});

test("production auth policy uses persistent rate limits and disables implicit account linking", () => {
  assert.equal(authOptions.rateLimit.storage, "database");
  assert.equal(authOptions.rateLimit.customRules["/sign-in/email"].max, 5);
  assert.equal(authOptions.account.accountLinking.enabled, false);
  assert.equal(authOptions.session.expiresIn, 604800);
});

test("auth resolves Netlify IPv4 and IPv6 without trusting alternate forwarding headers", () => {
  const headers = new Headers({ "x-nf-client-connection-ip": "203.0.113.10", "x-forwarded-for": "198.51.100.99", "x-real-ip": "198.51.100.98" });
  assert.equal(getIP(headers, authOptions), "203.0.113.10");
  headers.set("x-nf-client-connection-ip", "2001:db8:1234:5600::1");
  const ipv6 = getIP(headers, authOptions);
  assert.ok(ipv6?.includes(":"));
  // Better Auth groups IPv6 clients by subnet to prevent address-rotation bypasses.
  headers.set("x-nf-client-connection-ip", "2001:db8:1234:5600::2");
  assert.equal(getIP(headers, authOptions), ipv6);
  const fallback = getIP(new Headers(), authOptions);
  for (const value of ["invalid", "203.0.113.10, 198.51.100.99", ""]) {
    headers.set("x-nf-client-connection-ip", value);
    assert.equal(getIP(headers, authOptions), fallback);
  }
  headers.delete("x-nf-client-connection-ip");
  assert.equal(getIP(headers, authOptions), fallback);
});

test("database auth rate limits isolate Netlify clients and cannot be bypassed with X-Forwarded-For", async () => {
  const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [], rateLimit: [] };
  const auth = betterAuth({ ...authOptions, baseURL: "http://localhost:3000", secret: "test-only-secret-not-for-deployment-123456789", database: memoryAdapter(db),
    rateLimit: { ...authOptions.rateLimit, customRules: { "/get-session": { window: 60, max: 2 } } },
  });
  const request = (ip: string, forwarded: string) => auth.handler(new Request("http://localhost:3000/api/auth/get-session", {
    headers: { "x-nf-client-connection-ip": ip, "x-forwarded-for": forwarded },
  }));
  assert.equal((await request("203.0.113.10", "198.51.100.1")).status, 200);
  assert.equal((await request("203.0.113.10", "198.51.100.2")).status, 200);
  const blocked = await request("203.0.113.10", "198.51.100.3");
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("x-retry-after")) > 0);
  assert.equal((await request("203.0.113.11", "198.51.100.3")).status, 200);
  assert.equal(db.rateLimit.length, 2);
});

test("Google initiation uses state and rejects an external completion URL", async () => {
  const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({ ...authOptions, baseURL: "http://localhost:3000", secret: "test-only-secret-not-for-deployment-123456789", database: memoryAdapter(db), rateLimit: { enabled: false }, socialProviders: { google: { clientId: "test-client", clientSecret: "test-secret" } } });
  const start = (callbackURL: string) => auth.handler(new Request("http://localhost:3000/api/auth/sign-in/social", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify({ provider: "google", callbackURL }) }));
  const valid = await start("/auth/complete");
  assert.equal(valid.status, 200);
  const target = new URL((await valid.json()).url);
  assert.equal(target.hostname, "accounts.google.com");
  assert.ok(target.searchParams.get("state"));
  assert.equal(target.searchParams.get("redirect_uri"), "http://localhost:3000/api/auth/callback/google");
  assert.equal((await start("https://evil.test/steal")).status, 403);
  assert.equal(db.session.length, 0);
});
