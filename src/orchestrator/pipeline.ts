import { plan } from "../agents/planner.js";
import { code } from "../agents/coder.js";
import { test } from "../agents/tester.js";
import { heal } from "../agents/healer.js";
import { buildContext } from "../core/context.js";
import { remember, recall } from "../memory/store.js";
import { compress } from "../core/optimizer.js";
import { parseOutput, type TaskOutput } from "../validation/validator.js";
import { sanitize } from "../core/ghost.js";

export async function run(
  task: string,
  context: string | undefined,
  onProgress: (msg: string) => void
): Promise<TaskOutput> {
  const rc = buildContext(task, context);
  const prior = recall(task);
  const ctx = compress((prior ? `Prior: ${prior}\n` : "") + rc.ctx);

  onProgress("planning");
  rc.plan = await plan(rc.task, ctx);

  onProgress("coding");
  rc.code = await code(rc.plan, rc.task, (d) => onProgress(`code:${d}`));

  onProgress("testing");
  let { pass, summary: testSummary } = await test(rc.code);

  if (!pass) {
    rc.attempts++;
    onProgress("healing");
    const fixed = await heal(rc.code, testSummary);
    rc.code = await code(rc.plan, `${rc.task}\n\nHealed structure:\n${fixed}`, (d) =>
      onProgress(`code:${d}`)
    );
    onProgress("retesting");
    ({ pass, summary: testSummary } = await test(rc.code));
  }

  if (!pass) {
    throw new Error(`Tests failed: ${testSummary.slice(0, 200)}`);
  }

  const summary = compress(`${rc.plan.slice(0, 120)} | ${testSummary.slice(0, 120)}`);
  remember(task, summary);

  return parseOutput({
    result: sanitize(rc.code),
    tests: sanitize(testSummary),
    summary: sanitize(summary),
  });
}
