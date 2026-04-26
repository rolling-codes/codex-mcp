import { test } from "node:test";
import assert from "node:assert/strict";
import { compress } from "../src/core/optimizer.js";

test("compress collapses whitespace", () => {
  assert.equal(compress("a   b\n\nc\t\td"), "a b c d");
});

test("compress trims edges", () => {
  assert.equal(compress("   hello   "), "hello");
});

test("compress strips line comments", () => {
  assert.equal(compress("code\n// comment\nmore"), "code more");
});

test("compress preserves URLs (no false-positive on //)", () => {
  const r = compress("see https://example.com/path for info");
  assert.ok(r.includes("https://example.com/path"), `URL stripped: ${r}`);
});

test("compress strips comment after whitespace but not mid-token", () => {
  const r = compress("x // gone\ny");
  assert.equal(r, "x y");
});

test("compress caps at 3000 chars", () => {
  const r = compress("a".repeat(5000));
  assert.equal(r.length, 3000);
});

test("compress returns empty for empty input", () => {
  assert.equal(compress(""), "");
});

test("compress returns empty for whitespace-only input", () => {
  assert.equal(compress("   \n\t  "), "");
});
