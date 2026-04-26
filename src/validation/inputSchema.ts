import { z } from "zod";

export const InputSchema = z.object({
  task: z.string().min(1).max(2000),
  context: z.string().max(4000).optional(),
});

export const SubmitSchema = z.object({
  task: z.string().min(1),
  result: z.string().min(1),
  tests: z.string().min(1),
  summary: z.string().max(1000),
});

export type TaskInput = z.infer<typeof InputSchema>;
export type SubmitInput = z.infer<typeof SubmitSchema>;
