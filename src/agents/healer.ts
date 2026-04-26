import { streamAgent } from "../core/executor.js";

const SYS =
  "Fix structure only: enforce SRP, split large functions, remove duplication. No new features. No requirement changes. Return corrected code.";

export async function heal(impl: string, failure: string): Promise<string> {
  return streamAgent(SYS, `Code:\n${impl}\n\nFailure:\n${failure}`);
}
