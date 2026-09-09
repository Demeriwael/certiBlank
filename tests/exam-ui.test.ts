import assert from "node:assert/strict";
import { test } from "node:test";
import { optionLetter, optionState, shortcut, timerLevel, vendorLabel } from "../lib/exam-ui";

test("timer warnings switch at ten and two minutes and stay quiet when untimed", () => {
  assert.equal(timerLevel(null), "normal");
  assert.equal(timerLevel(601), "normal");
  assert.equal(timerLevel(600), "warning");
  assert.equal(timerLevel(121), "warning");
  assert.equal(timerLevel(120), "critical");
  assert.equal(timerLevel(0), "critical");
});
test("review distinguishes correct, selected wrong, and unselected wrong options", () => {
  assert.equal(optionState("a", ["b"], ["a"]), "correct");
  assert.equal(optionState("b", ["b"], ["a"]), "incorrect");
  assert.equal(optionState("c", ["b"], ["a"]), "muted");
  assert.equal(optionState("b", ["b"]), "selected");
  assert.equal(optionState("a", ["b"]), "idle");
  assert.equal(optionLetter(2), "C");
});
test("shortcuts map displayed option positions and never submit an exam", () => {
  assert.deepEqual(shortcut("1"), { type: "option", index: 0 });
  assert.deepEqual(shortcut("D"), { type: "option", index: 3 });
  assert.deepEqual(shortcut("f"), { type: "flag" });
  assert.deepEqual(shortcut("Enter"), { type: "next" });
  assert.deepEqual(shortcut("ArrowLeft"), { type: "previous" });
  assert.equal(shortcut("Tab"), null);
  assert.equal(shortcut("Escape"), null);
});
test("official documentation labels require the actual vendor hostname", () => {
  assert.equal(vendorLabel("https://docs.aws.amazon.com/iam/"), "View official AWS docs");
  assert.equal(vendorLabel("https://docs.aws.amazon.com.example.com/"), "View reference documentation");
  assert.equal(vendorLabel("https://learn.microsoft.com/azure/"), "View official Microsoft docs");
});
