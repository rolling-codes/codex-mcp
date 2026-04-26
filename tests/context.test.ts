import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCtx } from "../src/core/context.js";

test("buildCtx returns empty when both args missing", () => {
  assert.equal(buildCtx(), "");
});

test("buildCtx returns empty for null prior + no context", () => {
  assert.equal(buildCtx(undefined, null), "");
});

test("buildCtx returns context only when no prior", () => {
  assert.equal(buildCtx("use TS"), "use TS");
});

test("buildCtx prepends 'Prior:' label to prior", () => {
  const r = buildCtx(undefined, "fixed login");
  assert.ok(r.includes("Prior: fixed login"), r);
});

test("buildCtx joins context and prior with separator", () => {
  const r = buildCtx("use TS", "fixed login");
  assert.ok(r.includes("use TS"));
  assert.ok(r.includes("Prior: fixed login"));
  assert.ok(r.includes("|"), `missing separator: ${r}`);
});

test("buildCtx applies compress (whitespace collapse)", () => {
  const r = buildCtx("a    b", "c    d");
  assert.ok(!/  /.test(r), `double-spaces survived: ${r}`);
});

test("buildCtx skips empty prior gracefully", () => {
  assert.equal(buildCtx("ctx", ""), "ctx");
});
