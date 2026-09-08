import assert from "node:assert/strict";
import { test } from "node:test";
import type { AttemptProgress, AttemptView } from "../lib/exam-contract";
import { ExamSync, restoreDraft, type Draft, type SaveRequest } from "../lib/exam-sync";

function view(): AttemptView {
  return { id: "attempt", mode: "domain", title: "Test", domains: [],
    questions: ["q1", "q2"].map(id => ({ id, type: "multiple", questionText: id, options: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], selectionCount: 2, domain: "domain", hint: null })),
    answers: {}, flagged: [], checked: [], currentIndex: 0, expiresAt: null, serverNow: new Date().toISOString(), isSubmitted: false, feedback: {}, results: null, version: 0 };
}
function harness() {
  const calls: { request: SaveRequest; resolve: (value: AttemptProgress) => void; reject: (reason: unknown) => void }[] = [];
  let stored: Draft | null = null;
  let error = "";
  const sync = new ExamSync(view(), {
    send: (_id, request) => new Promise((resolve, reject) => calls.push({ request, resolve, reject })),
    publish: () => {}, persist: draft => { stored = draft; }, onError: message => { error = message; },
  });
  function reply(index: number, patch: Partial<AttemptProgress> = {}) {
    const { request, resolve } = calls[index];
    resolve({ ...view(), answers: request.answers, flagged: request.flagged, currentIndex: request.currentIndex, version: request.version + 1, ...patch });
  }
  return { sync, calls, reply, stored: () => stored, error: () => error };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test("rapid selections and navigation are immediate and batched into one save", async () => {
  const h = harness();
  try {
    h.sync.edit({ answers: { q1: ["a"] } });
    h.sync.edit({ answers: { q1: ["a", "b"] }, currentIndex: 1, flagged: ["q1"] });
    assert.equal(h.calls.length, 0);
    assert.equal(h.sync.view.currentIndex, 1);
    assert.deepEqual(h.stored()?.answers.q1, ["a", "b"]);
    const saving = h.sync.flush(); await tick();
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.calls[0].request.answers.q1, ["a", "b"]);
    h.reply(0); await saving;
    assert.equal(h.stored(), null);
  } finally { h.sync.dispose(); }
});

test("a slow response cannot rewind newer selections or navigation", async () => {
  const h = harness();
  try {
    h.sync.edit({ answers: { q1: ["a"] } });
    const first = h.sync.flush(); await tick();
    h.sync.edit({ answers: { q1: ["a", "b"], q2: ["c"] }, currentIndex: 1 });
    assert.equal(h.sync.view.currentIndex, 1);
    assert.equal(h.sync.flush(), first, "no duplicate request while a save is pending");
    h.reply(0); await first;
    assert.deepEqual(h.sync.view.answers.q2, ["c"]);
    assert.deepEqual(h.sync.view.answers.q1, ["a", "b"]);
    const second = h.sync.flush(); await tick();
    assert.equal(h.calls[1].request.version, 1);
    h.reply(1); await second;
    assert.equal(h.stored(), null);
  } finally { h.sync.dispose(); }
});

test("submission waits for an in-flight save and includes the latest answers", async () => {
  const h = harness();
  try {
    h.sync.edit({ answers: { q1: ["a"] } });
    const saving = h.sync.flush(); await tick();
    h.sync.edit({ answers: { q1: ["b"], q2: ["a", "c"] }, currentIndex: 1 });
    const submitted = h.sync.action("submit");
    assert.equal(h.calls.length, 1);
    h.reply(0); await saving; await tick();
    assert.equal(h.calls[1].request.action, "submit");
    assert.deepEqual(h.calls[1].request.answers.q2, ["a", "c"]);
    h.reply(1, { isSubmitted: true }); await submitted;
    assert.equal(h.sync.view.isSubmitted, true);
    assert.equal(h.stored(), null);
  } finally { h.sync.dispose(); }
});

test("checking targets the original question while navigation stays responsive", async () => {
  const h = harness();
  try {
    h.sync.edit({ answers: { q1: ["a", "b"] } });
    const checked = h.sync.action("check", 0); await tick();
    h.sync.edit({ currentIndex: 1, answers: { q1: ["a", "b"], q2: ["c"] } });
    h.reply(0, { checked: ["q1"] }); await checked;
    assert.equal(h.sync.view.currentIndex, 1);
    assert.deepEqual(h.sync.view.checked, ["q1"]);
    assert.deepEqual(h.sync.view.answers.q2, ["c"]);
  } finally { h.sync.dispose(); }
});

test("failed saves keep the draft and permit retry without rolling back", async () => {
  const h = harness();
  try {
    h.sync.edit({ answers: { q1: ["b"] }, currentIndex: 1 });
    const pending = h.sync.flush(); await tick();
    const rejected = assert.rejects(pending);
    h.calls[0].reject(new Error("offline")); await rejected;
    assert.equal(h.sync.view.currentIndex, 1);
    assert.ok(h.stored()); assert.match(h.error(), /Connection interrupted/);
    const retry = h.sync.flush(); await tick(); h.reply(1); await retry;
    assert.equal(h.error(), ""); assert.equal(h.stored(), null);
  } finally { h.sync.dispose(); }
});

test("expiry overrides unsaved local answers and storage never restores checked answers", async () => {
  const h = harness();
  try {
    h.sync.edit({ answers: { q1: ["a"] } });
    const pending = h.sync.flush(); await tick();
    h.sync.edit({ answers: { q1: ["b"] } });
    h.reply(0, { isSubmitted: true, answers: {} }); await pending;
    assert.deepEqual(h.sync.view.answers, {});
    assert.equal(restoreDraft(h.sync.view, JSON.stringify({ answers: { q1: ["b"] } })), null);
    const checked = { ...view(), checked: ["q1"], answers: { q1: ["a"] } };
    const restored = restoreDraft(checked, JSON.stringify({ answers: { q1: ["b"], q2: ["c"] }, currentIndex: 99, flagged: ["missing"] }));
    assert.deepEqual(restored?.answers, { q1: ["a"], q2: ["c"] });
    assert.equal(restored?.currentIndex, 0);
    assert.deepEqual(restored?.flagged, []);
  } finally { h.sync.dispose(); }
});
