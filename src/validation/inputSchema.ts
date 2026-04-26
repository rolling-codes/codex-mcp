import { z } from "zod";

export const InputSchema = z.object({
  task: z.string().min(1).max(2000),
  context: z.string().max(4000).optional(),
});

export type TaskInput = z.infer<typeof InputSchema>;
