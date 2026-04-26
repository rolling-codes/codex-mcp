import { streamAgent } from "../core/executor.js";

const SYS =
  "Write and simulate unit tests for the code. First line MUST be PASS or FAIL. Then brief summary. No implementation changes.";

export async function test(impl: string): Promise<{ pass: boolean; summary: string }> {
  const out = await streamAgent(SYS, `Code:\n${impl}`);
  const pass = out.trimStart().startsWith("PASS");
  return { pass, summary: out.slice(0, 400) };
}
