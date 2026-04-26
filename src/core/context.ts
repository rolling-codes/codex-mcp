import { compress } from "./optimizer.js";

export interface RunContext {
  task: string;
  ctx: string;
  plan: string;
  code: string;
  testResult: string;
  attempts: number;
}

export function buildContext(task: string, context?: string): RunContext {
  return {
    task: compress(task),
    ctx: compress(context ?? ""),
    plan: "",
    code: "",
    testResult: "",
    attempts: 0,
  };
}
