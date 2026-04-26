import { streamAgent } from "../core/executor.js";

const SYS = "Decompose task into ≤5 numbered steps. No code. No explanations. Steps only.";

export async function plan(task: string, ctx: string): Promise<string> {
  return streamAgent(SYS, `Task: ${task}\nContext: ${ctx}`);
}
