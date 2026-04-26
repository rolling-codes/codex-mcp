import { z } from "zod";

export const OutputSchema = z.object({
  result: z.string().min(1),
  tests: z.string(),
  summary: z.string().max(1000),
});

export type TaskOutput = z.infer<typeof OutputSchema>;
