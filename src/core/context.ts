import { compress } from "./optimizer.js";

export function buildCtx(_task: string, context?: string, prior?: string | null): string {
  const parts = [context ?? "", prior ? `Prior: ${prior}` : ""].filter(Boolean).join("\n");
  return compress(parts);
}
