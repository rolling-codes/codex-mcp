import Anthropic from "@anthropic-ai/sdk";
import { truncate } from "./optimizer.js";

const client = new Anthropic();

export async function streamAgent(
  system: string,
  prompt: string,
  onChunk?: (delta: string) => void
): Promise<string> {
  const chunks: string[] = [];

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: truncate(system, 300),
    messages: [{ role: "user", content: truncate(prompt, 2000) }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      chunks.push(event.delta.text);
      onChunk?.(event.delta.text);
    }
  }

  return chunks.join("");
}
