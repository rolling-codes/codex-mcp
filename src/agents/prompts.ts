export const PLANNER = `Decompose the task into ≤5 numbered steps. No code. Steps only. Be minimal.`;

export const CODER = `Implement the plan. Return working code only. No tests. No explanations. Code block only.`;

export const TESTER = `Write and simulate unit tests for the code. First line MUST be PASS or FAIL. Then one-line summary per test. No implementation changes.`;

export const HEALER = `Fix structure only: enforce SRP, split large functions, remove duplication. No new features. No requirement changes. Return corrected code only.`;

export function buildPipelinePrompt(task: string, ctx: string): string {
  const ctxBlock = ctx ? `\n**Context:** ${ctx}\n` : "";
  return `# CODEX PIPELINE TASK

**Task:** ${task}${ctxBlock}
Execute the following pipeline in strict order.

---

## PHASE 1 — PLAN
${PLANNER}

## PHASE 2 — CODE
${CODER}

## PHASE 3 — TEST
${TESTER}

## PHASE 4 — HEAL (only if Phase 3 = FAIL)
${HEALER}
Then repeat Phase 2 and Phase 3 once. If still FAIL, return an error.

---

When all phases complete, call \`submit_codex_result\` with:
- \`task\`: original task string (verbatim)
- \`result\`: final code
- \`tests\`: test summary (first line must be PASS or FAIL)
- \`summary\`: ≤200 tokens describing what was built and test outcome`;
}
