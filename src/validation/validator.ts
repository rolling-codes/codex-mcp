import { InputSchema, type TaskInput } from "./inputSchema.js";
import { OutputSchema, type TaskOutput } from "./outputSchema.js";

export function parseInput(raw: unknown): TaskInput {
  return InputSchema.parse(raw);
}

export function parseOutput(raw: unknown): TaskOutput {
  return OutputSchema.parse(raw);
}

export { type TaskInput, type TaskOutput };
