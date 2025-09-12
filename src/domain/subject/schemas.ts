import { z } from "zod";

export const SubjectInput = z.object({
    label: z.string().min(1, "Label is required").max(64),
    // Optional skill/priority level 1..5 (tweak as you like)
    level: z.number().int().min(1).max(5).optional(),
});
export type SubjectInput = z.infer<typeof SubjectInput>;

export const BulkSubjectsInput = z.array(SubjectInput).max(50);

export const UpdateSubjectInput = z
    .object({
        label: z.string().min(1).max(64).optional(),
        level: z.number().int().min(1).max(5).optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
        message: "No fields to update",
    });
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectInput>;
