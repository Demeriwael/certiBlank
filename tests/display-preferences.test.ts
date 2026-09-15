import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { confirmedAccountState, displayBootstrap, savedTheme } from "../lib/display-preferences";

test("session refreshes and transient failures do not erase confirmed navigation", () => {
  assert.equal(confirmedAccountState(null, true, null), null);
  assert.equal(confirmedAccountState(null, false, { status: 500 }), null);
  assert.equal(confirmedAccountState({ user: { id: "sample" } }, true, null), "member");
  assert.equal(confirmedAccountState(null, false, null), "guest");
  assert.equal(confirmedAccountState(null, false, { status: 401 }), "guest");
});

test("light is the default and only an explicit dark preference overrides it", () => {
  for (const value of [null, "", "system", "LIGHT", "invalid"]) assert.equal(savedTheme(value), "light");
  assert.equal(savedTheme("dark"), "dark");
});

test("pre-paint bootstrap restores cosmetic preferences without needing a session request", () => {
  const dataset: Record<string, string> = {};
  runInNewContext(displayBootstrap, { document: { documentElement: { dataset } }, localStorage: { getItem: (key: string) => key === "certi-theme" ? "dark" : "member" } });
  assert.deepEqual(dataset, { theme: "dark", account: "member" });
});

test("blocked storage still renders usable light, guest navigation", () => {
  const dataset: Record<string, string> = {};
  runInNewContext(displayBootstrap, { document: { documentElement: { dataset } }, localStorage: { getItem: () => { throw new Error("Storage disabled"); } } });
  assert.deepEqual(dataset, { theme: "light", account: "guest" });
});
