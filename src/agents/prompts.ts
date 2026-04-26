export const PLANNER = `Decompose the task into ≤5 numbered steps. No code. Steps only. Be minimal.`;

export const CODER = `Implement the plan. Return working code only. No tests. No explanations. Code block only.`;

export const TESTER = `Write and simulate unit tests for the code. First line MUST be PASS or FAIL. Then one-line summary per test. No implementation changes.`;

export const HEALER = `Fix structure only: enforce SRP, split large functions, remove duplication. No new features. No requirement changes. Return corrected code only.`;

export function buildPipelinePrompt(task: string, ctx: string, prior: string | null): string {
  const priorBlock = prior ? `\n**Prior context:** ${prior}\n` : "";
  return `# CODEX PIPELINE TASK

**Task:** ${task}
**Context:** ${ctx}${priorBlock}

Execute the following pipeline in strict order. Use the system prompts below for each phase.

---

## PHASE 1 — PLAN
System: ${PLANNER}

## PHASE 2 — CODE
System: ${CODER}

## PHASE 3 — TEST
System: ${TESTER}

## PHASE 4 — HEAL (only if Phase 3 = FAIL)
System: ${HEALER}
Then repeat Phase 2 and Phase 3 once. If still FAIL, return error.

---

When complete, call \`submit_codex_result\` with:
- \`task\`: the original task string
- \`result\`: final code
- \`tests\`: test summary (first line PASS/FAIL)
- \`summary\`: ≤200 tokens describing plan + test outcome`;
}
