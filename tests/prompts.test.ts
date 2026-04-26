import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPipelinePrompt, PLANNER, CODER, TESTER, HEALER } from "../src/agents/prompts.js";

test("buildPipelinePrompt embeds task verbatim", () => {
  const p = buildPipelinePrompt("add login", "");
  assert.ok(p.includes("**Task:** add login"), p);
});

test("buildPipelinePrompt omits Context block when ctx empty", () => {
  const p = buildPipelinePrompt("x", "");
  assert.ok(!p.includes("**Context:**"));
});

test("buildPipelinePrompt includes Context block when ctx present", () => {
  const p = buildPipelinePrompt("x", "use TS");
  assert.ok(p.includes("**Context:** use TS"));
});

test("buildPipelinePrompt includes all four phases", () => {
  const p = buildPipelinePrompt("x", "");
  assert.ok(p.includes("PHASE 1 — PLAN"));
  assert.ok(p.includes("PHASE 2 — CODE"));
  assert.ok(p.includes("PHASE 3 — TEST"));
  assert.ok(p.includes("PHASE 4 — HEAL"));
});

test("buildPipelinePrompt includes phase rules", () => {
  const p = buildPipelinePrompt("x", "");
  assert.ok(p.includes(PLANNER));
  assert.ok(p.includes(CODER));
  assert.ok(p.includes(TESTER));
  assert.ok(p.includes(HEALER));
});

test("buildPipelinePrompt instructs submit_codex_result call", () => {
  const p = buildPipelinePrompt("x", "");
  assert.ok(p.includes("submit_codex_result"));
});

test("phase strings exist and are non-empty", () => {
  for (const s of [PLANNER, CODER, TESTER, HEALER]) {
    assert.ok(typeof s === "string" && s.length > 0);
  }
});
