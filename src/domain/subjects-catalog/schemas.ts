import { z } from "zod";

// Create one public subject
export const PublicSubjectInput = z.object({
    label: z.string().min(1, "Label is required").max(64),
    level: z.number().int().min(1).max(5).optional(),
});
export type PublicSubjectInput = z.infer<typeof PublicSubjectInput>;

// Bulk replace
export const BulkPublicSubjectsInput = z.array(PublicSubjectInput).max(200);

// Update one
export const UpdatePublicSubjectInput = z
    .object({
        label: z.string().min(1).max(64).optional(),
        level: z.number().int().min(1).max(5).optional(),
    })
    .refine(v => Object.keys(v).length > 0, { message: "No fields to update" });
export type UpdatePublicSubjectInput = z.infer<typeof UpdatePublicSubjectInput>;
