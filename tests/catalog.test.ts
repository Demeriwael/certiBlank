import assert from "node:assert/strict";
import { test } from "node:test";
import { catalog, mergeCatalog, questionCount } from "../lib/catalog";
import type { Platform } from "../lib/types";
const platforms: Platform[] = [{ id: "aws", name: "AWS", slug: "aws", certifications: [
  { id: "cp", title: "Cloud Practitioner", slug: "cloud-practitioner", _count: { questions: 55 } },
  { id: "new", title: "New certification", slug: "new-cert", _count: { questions: 0 } },
] }];
test("database certifications merge without duplicating or mutating the catalog", () => {
  const before = JSON.stringify(catalog);
  const aws = mergeCatalog(platforms).find((item) => item.slug === "aws")!;
  assert.equal(aws.tracks.filter((item) => item.slug === "cloud-practitioner").length, 1);
  assert.equal(aws.tracks.at(-1)?.slug, "new-cert");
  assert.equal(JSON.stringify(catalog), before);
});
test("availability uses actual question counts, not certification presence", () => {
  assert.equal(questionCount(platforms, "aws", "cloud-practitioner"), 55);
  assert.equal(questionCount(platforms, "aws", "new-cert"), 0);
  assert.equal(questionCount(platforms, "cisco", "cisco-ccna"), 0);
});
test("only supported platforms appear even when the database contains OpenAI", () => {
  const added = mergeCatalog([{ id: "old", name: "OpenAI", slug: "openai", certifications: [{ id: "ai", title: "AI Developer", slug: "certified-developer", _count: { questions: 15 } }] }]);
  assert.deepEqual(added.map(platform => platform.slug), ["aws", "azure", "cisco"]);
  assert.equal(added.some(platform => platform.tracks.some(track => track.slug === "certified-developer")), false);
});
