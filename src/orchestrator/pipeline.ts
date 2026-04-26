import { buildCtx } from "../core/context.js";
import { recall, remember } from "../memory/store.js";
import { sanitize } from "../core/ghost.js";
import { buildPipelinePrompt } from "../agents/prompts.js";
import { parseOutput, parseSubmit, type TaskInput, type TaskOutput } from "../validation/validator.js";

export function startPipeline(input: TaskInput): string {
  const prior = recall(input.task);
  const ctx = buildCtx(input.context, prior);
  return buildPipelinePrompt(input.task, ctx);
}

export function finalizePipeline(raw: unknown): TaskOutput {
  const sub = parseSubmit(raw);
  const out = parseOutput({
    result: sanitize(sub.result),
    tests: sanitize(sub.tests),
    summary: sanitize(sub.summary),
  });
  remember(sub.task, out.summary);
  return out;
}
