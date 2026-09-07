import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";

// Install a plain test double before loading the routes. Prisma's proxy-backed
// methods cannot be replaced with node:test's descriptor-based mock.method.
const prisma = {
  platform: {
    findMany: async (args: { include?: { certifications?: unknown } }) => {
      void args;
      return [] as unknown[];
    },
  },
  $queryRaw: async (...args: unknown[]) => {
    void args;
    return [] as unknown[];
  },
};
let getPlatforms: typeof import("../app/api/platforms/route").GET;
let getQuestions: typeof import("../app/api/questions/route").GET;

before(async () => {
  Object.assign(globalThis, { prisma });
  ({ GET: getPlatforms } = await import("../app/api/platforms/route"));
  ({ GET: getQuestions } = await import("../app/api/questions/route"));
});

afterEach(() => mock.restoreAll());

const request = (query: string) =>
  new Request(`http://localhost/api/questions${query}`);

test("platforms returns JSON with nested certifications", async () => {
  const data = [{ name: "AWS", certifications: [{ title: "Cloud Practitioner" }] }];
  const query = mock.method(prisma.platform, "findMany", async () => data);
  const response = await getPlatforms();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /application\/json/);
  assert.deepEqual(await response.json(), data);
  assert.ok(query.mock.calls[0].arguments[0]?.include?.certifications);
});

test("invalid question parameters return 400 without querying the database", async () => {
  const query = mock.method(prisma, "$queryRaw", async () => []);
  for (const suffix of [
    "", "?certSlug=", "?certSlug=%20", "?certSlug=a&certSlug=b",
    ...["", "0", "-1", "1.5", "abc", "Infinity", "9007199254740992", "2&limit=3"]
      .map((limit) => `?certSlug=cloud-practitioner&limit=${limit}`),
  ]) {
    const response = await getQuestions(request(suffix));
    assert.equal(response.status, 400, suffix);
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.equal(query.mock.callCount(), 0);
});

test("questions defaults to ten and binds even SQL-like slugs as values", async () => {
  const query = mock.method(prisma, "$queryRaw", async () => []);
  const slug = "x' OR 1=1 --";
  const response = await getQuestions(request(`?certSlug=${encodeURIComponent(slug)}`));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const [sql, boundSlug, boundLimit] = query.mock.calls[0].arguments;
  assert.ok(Array.isArray(sql));
  assert.equal(boundSlug, slug);
  assert.equal(boundLimit, 10);
  assert.match(sql.join("?"), /ORDER BY RANDOM\(\)/);
  assert.ok(!sql.join("").includes(slug));
});

test("questions honors an explicit limit and serializes records", async () => {
  const data = [{ id: "sample", options: ["A", "B", "C", "D"], correctAnswer: "A", createdAt: new Date("2026-01-01") }];
  const query = mock.method(prisma, "$queryRaw", async () => data);
  const response = await getQuestions(request("?certSlug=cloud-practitioner&limit=2"));
  assert.equal(response.status, 200);
  assert.equal(query.mock.calls[0].arguments[2], 2);
  assert.deepEqual(await response.json(), JSON.parse(JSON.stringify(data)));
});

test("database failures return generic JSON errors without leaking details", async () => {
  const fail = async () => { throw new Error("private database details"); };
  mock.method(prisma.platform, "findMany", fail);
  mock.method(prisma, "$queryRaw", fail);
  mock.method(console, "error", () => {});
  for (const response of [await getPlatforms(), await getQuestions(request("?certSlug=aws"))]) {
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(typeof body.error, "string");
    assert.ok(!JSON.stringify(body).includes("private database details"));
  }
});
