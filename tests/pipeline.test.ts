import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { startPipeline, finalizePipeline } from "../src/orchestrator/pipeline.js";

const original = process.env["GHOST_MODE"];
beforeEach(() => { delete process.env["GHOST_MODE"]; });
afterEach(() => { if (original !== undefined) process.env["GHOST_MODE"] = original; });

test("startPipeline returns pipeline prompt for given task", () => {
  const p = startPipeline({ task: "build feature X" });
  assert.ok(p.includes("CODEX PIPELINE TASK"));
  assert.ok(p.includes("build feature X"));
});

test("startPipeline does NOT sanitize the prompt (phase keywords preserved)", () => {
  process.env["GHOST_MODE"] = "true";
  const p = startPipeline({ task: "x" });
  assert.ok(p.includes("PLAN"), "PLAN keyword stripped");
  assert.ok(p.includes("CODE"));
  assert.ok(p.includes("TEST"));
  assert.ok(p.includes("HEAL"));
});

test("startPipeline includes context when provided", () => {
  const p = startPipeline({ task: "x", context: "use Python" });
  assert.ok(p.includes("use Python"));
});

test("finalizePipeline returns sanitized output object", () => {
  const r = finalizePipeline({
    task: "task A",
    result: "function f() {}",
    tests: "PASS basic",
    summary: "implemented f",
  });
  assert.equal(r.result, "function f() {}");
  assert.equal(r.summary, "implemented f");
});

test("finalizePipeline rejects invalid submission (no PASS/FAIL)", () => {
  assert.throws(() =>
    finalizePipeline({ task: "x", result: "code", tests: "ran ok", summary: "s" })
  );
});

test("finalizePipeline rejects empty result", () => {
  assert.throws(() =>
    finalizePipeline({ task: "x", result: "", tests: "PASS x", summary: "s" })
  );
});

test("finalizePipeline applies sanitize when GHOST_MODE='true'", () => {
  process.env["GHOST_MODE"] = "true";
  const r = finalizePipeline({
    task: "x",
    result: "the planner ran",
    tests: "PASS suite",
    summary: "plugin done",
  });
  assert.ok(!/planner/i.test(r.result), `not sanitized: ${r.result}`);
  assert.ok(!/plugin/i.test(r.summary), `not sanitized: ${r.summary}`);
});

test("finalizePipeline output flows into recall on next startPipeline", () => {
  finalizePipeline({
    task: "unique-task-pipeline-flow",
    result: "code",
    tests: "PASS x",
    summary: "remembered-summary-marker",
  });
  const next = startPipeline({ task: "unique-task-pipeline-flow" });
  assert.ok(next.includes("remembered-summary-marker"), "prior summary not injected");
});
