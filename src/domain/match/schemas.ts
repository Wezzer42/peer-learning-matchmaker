import { z } from "zod";

export const CreateMatchInput = z.object({
    aUserId: z.string().min(1),
    bUserId: z.string().min(1),
    topic: z.string().min(1),
    score: z.number().min(0).max(1)
});
export type CreateMatchInput = z.infer<typeof CreateMatchInput>;