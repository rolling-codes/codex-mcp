import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInput, parseSubmit, parseOutput } from "../src/validation/validator.js";

test("parseInput accepts minimal task", () => {
  const r = parseInput({ task: "build feature" });
  assert.equal(r.task, "build feature");
});

test("parseInput accepts optional context", () => {
  const r = parseInput({ task: "x", context: "use TS" });
  assert.equal(r.context, "use TS");
});

test("parseInput rejects empty task", () => {
  assert.throws(() => parseInput({ task: "" }));
});

test("parseInput rejects missing task", () => {
  assert.throws(() => parseInput({}));
});

test("parseInput rejects task > 2000 chars", () => {
  assert.throws(() => parseInput({ task: "x".repeat(2001) }));
});

test("parseInput rejects context > 4000 chars", () => {
  assert.throws(() => parseInput({ task: "x", context: "y".repeat(4001) }));
});

test("parseSubmit accepts PASS prefix", () => {
  parseSubmit({ task: "x", result: "code", tests: "PASS suite", summary: "s" });
});

test("parseSubmit accepts FAIL prefix", () => {
  parseSubmit({ task: "x", result: "code", tests: "FAIL suite", summary: "s" });
});

test("parseSubmit accepts case-insensitive PASS/FAIL", () => {
  parseSubmit({ task: "x", result: "code", tests: "pass suite", summary: "s" });
  parseSubmit({ task: "x", result: "code", tests: "fail suite", summary: "s" });
});

test("parseSubmit allows leading whitespace before PASS/FAIL", () => {
  parseSubmit({ task: "x", result: "code", tests: "   PASS suite", summary: "s" });
});

test("parseSubmit rejects tests without PASS/FAIL prefix", () => {
  assert.throws(() =>
    parseSubmit({ task: "x", result: "code", tests: "some test ran", summary: "s" })
  );
});

test("parseSubmit rejects empty result", () => {
  assert.throws(() =>
    parseSubmit({ task: "x", result: "", tests: "PASS x", summary: "s" })
  );
});

test("parseSubmit rejects summary > 1000 chars", () => {
  assert.throws(() =>
    parseSubmit({ task: "x", result: "code", tests: "PASS x", summary: "y".repeat(1001) })
  );
});

test("parseOutput accepts valid output", () => {
  const r = parseOutput({ result: "code", tests: "PASS x", summary: "ok" });
  assert.equal(r.result, "code");
});

test("parseOutput rejects empty result", () => {
  assert.throws(() => parseOutput({ result: "", tests: "x", summary: "ok" }));
});
