import { compress } from "./optimizer.js";

export function buildCtx(context?: string, prior?: string | null): string {
  const parts = [context, prior ? `Prior: ${prior}` : ""].filter(Boolean) as string[];
  return compress(parts.join(" | "));
}
