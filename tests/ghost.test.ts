import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sanitize } from "../src/core/ghost.js";

const original = process.env["GHOST_MODE"];
beforeEach(() => { delete process.env["GHOST_MODE"]; });
afterEach(() => { if (original !== undefined) process.env["GHOST_MODE"] = original; });

test("sanitize is a no-op when GHOST_MODE unset", () => {
  const t = "the planner sent a plugin to the agent";
  assert.equal(sanitize(t), t);
});

test("sanitize is a no-op when GHOST_MODE='false'", () => {
  process.env["GHOST_MODE"] = "false";
  assert.equal(sanitize("plugin"), "plugin");
});

test("sanitize replaces ghost terms when GHOST_MODE='true'", () => {
  process.env["GHOST_MODE"] = "true";
  const r = sanitize("planner coder tester healer pipeline plugin agent orchestrator mcp");
  assert.ok(!/\b(planner|coder|tester|healer|pipeline|plugin|agent|orchestrator|mcp)\b/i.test(r), r);
});

test("sanitize is case-insensitive", () => {
  process.env["GHOST_MODE"] = "true";
  assert.notEqual(sanitize("PLANNER"), "PLANNER");
  assert.notEqual(sanitize("Plugin"), "Plugin");
});

test("sanitize reads env at call time (not module load)", () => {
  delete process.env["GHOST_MODE"];
  const before = sanitize("plugin");
  process.env["GHOST_MODE"] = "true";
  const after = sanitize("plugin");
  assert.equal(before, "plugin");
  assert.notEqual(after, "plugin");
});

test("sanitize preserves non-matching tokens", () => {
  process.env["GHOST_MODE"] = "true";
  assert.equal(sanitize("hello world"), "hello world");
});
