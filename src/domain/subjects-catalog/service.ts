import type { SubjectsCatalogStore } from "@/lib/subjects-catalog/types";
import { z } from "zod";
import { BulkPublicSubjectsInput, PublicSubjectInput, UpdatePublicSubjectInput } from "./schemas";

function zodMsg(error: z.ZodError) {
    return error.issues.map((issue) => {
        const path = issue.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number");
        return `${path.join(".") || "(root)"}: ${issue.message}`;
    }).join("; ");
}

export function makeSubjectsCatalogService(store: SubjectsCatalogStore) {
    return {
        async list(q?: string) {
            return store.list({ q });
        },
        async add(payload: unknown, createdBy?: string) {
            const parsed = PublicSubjectInput.safeParse(payload);
            if (!parsed.success) throw new Error(zodMsg(parsed.error));
            return store.add({ ...parsed.data, createdBy });
        },
        async setAll(payload: unknown, createdBy?: string) {
            const parsed = BulkPublicSubjectsInput.safeParse(payload);
            if (!parsed.success) throw new Error(zodMsg(parsed.error));
            return store.setAll(parsed.data, createdBy);
        },
        async update(id: string, payload: unknown) {
            const parsed = UpdatePublicSubjectInput.safeParse(payload);
            if (!parsed.success) throw new Error(zodMsg(parsed.error));
            const updated = await store.update(id, parsed.data);
            if (!updated) throw new Error("Subject not found");
            return updated;
        },
        async remove(id: string) {
            const ok = await store.remove(id);
            if (!ok) throw new Error("Subject not found");
            return true;
        },
    };
}
