import { streamAgent } from "../core/executor.js";

const SYS = "Implement only. Return working code. No tests. No explanations. Code block only.";

export async function code(
  plan: string,
  task: string,
  onChunk?: (d: string) => void
): Promise<string> {
  return streamAgent(SYS, `Plan:\n${plan}\n\nTask: ${task}`, onChunk);
}
