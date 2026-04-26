import { test } from "node:test";
import assert from "node:assert/strict";
import { remember, recall } from "../src/memory/store.js";

test("recall returns null on empty store", () => {
  assert.equal(recall("never-stored-zzzzz-" + Date.now()), null);
});

test("remember + recall roundtrip", () => {
  remember("fix auth bug " + Date.now(), "patched middleware");
  assert.equal(recall("fix auth bug"), "patched middleware");
});

test("recall does substring match (case-insensitive)", () => {
  remember("REFACTOR DATABASE LAYER", "extracted repo pattern");
  assert.equal(recall("refactor database"), "extracted repo pattern");
});

test("recall returns most recent matching entry", () => {
  remember("dedupe target", "first");
  remember("dedupe target", "second");
  assert.equal(recall("dedupe target"), "second");
});

test("remember enforces LRU cap of 20", () => {
  for (let i = 0; i < 30; i++) remember(`bulk-task-${i}`, `summary-${i}`);
  assert.equal(recall("bulk-task-0"), null, "oldest should evict");
  assert.equal(recall("bulk-task-29"), "summary-29");
});

test("remember truncates long task and summary", () => {
  const longTask = "x".repeat(500);
  const longSummary = "y".repeat(500);
  remember(longTask, longSummary);
  const r = recall(longTask.slice(0, 80));
  assert.ok(r);
  assert.ok(r!.length <= 300);
});
