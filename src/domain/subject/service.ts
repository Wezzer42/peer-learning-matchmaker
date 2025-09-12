import type { SubjectsStore } from "@/lib/subjectstore/types";
import { BulkSubjectsInput, SubjectInput, UpdateSubjectInput } from "./schemas";

export function makeSubjectsService(store: SubjectsStore) {
    return {
        async list(userId: string) {
            return store.list(userId);
        },
        async add(userId: string, payload: unknown) {
            const data = SubjectInput.safeParse(payload);
            if (!data.success) {
                const msg = data.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
                throw new Error(msg);
            }
            return store.add(userId, data.data);
        },
        async setAll(userId: string, payload: unknown) {
            const data = BulkSubjectsInput.safeParse(payload);
            if (!data.success) {
                const msg = data.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
                throw new Error(msg);
            }
            return store.setAll(userId, data.data);
        },
        async update(userId: string, id: string, payload: unknown) {
            const data = UpdateSubjectInput.safeParse(payload);
            if (!data.success) {
                const msg = data.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
                throw new Error(msg);
            }
            const updated = await store.update(userId, id, data.data);
            if (!updated) throw new Error("Subject not found");
            return updated;
        },
        async remove(userId: string, id: string) {
            const ok = await store.remove(userId, id);
            if (!ok) throw new Error("Subject not found");
            return true;
        },
    };
}
