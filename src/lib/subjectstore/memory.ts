import type { Subject, SubjectsStore } from "./types";

export class MemorySubjectsStore implements SubjectsStore {
    // Per-user subjects, kept in memory
    private byUser = new Map<string, Subject[]>();

    async list(userId: string): Promise<Subject[]> {
        return this.byUser.get(userId) ?? [];
    }

    async add(userId: string, data: Omit<Subject, "id" | "userId" | "createdAt">): Promise<Subject> {
        const now = new Date().toISOString();
        const subject: Subject = {
            ...data,
            id: crypto.randomUUID(),
            userId,
            createdAt: now,
        };
        const arr = this.byUser.get(userId) ?? [];
        arr.push(subject);
        this.byUser.set(userId, arr);
        return subject;
    }

    async update(userId: string, id: string, patch: Partial<Omit<Subject, "id" | "userId" | "createdAt">>): Promise<Subject | null> {
        const arr = this.byUser.get(userId);
        if (!arr) return null;
        const idx = arr.findIndex(s => s.id === id);
        if (idx < 0) return null;
        const updated = { ...arr[idx], ...patch };
        arr[idx] = updated;
        return updated;
    }

    async remove(userId: string, id: string): Promise<boolean> {
        const arr = this.byUser.get(userId);
        if (!arr) return false;
        const lenBefore = arr.length;
        const filtered = arr.filter(s => s.id !== id);
        this.byUser.set(userId, filtered);
        return filtered.length !== lenBefore;
    }

    async setAll(userId: string, items: Array<{ label: string; level?: number }>): Promise<Subject[]> {
        const now = new Date().toISOString();
        const next: Subject[] = items.map(it => ({
            id: crypto.randomUUID(),
            userId,
            label: it.label,
            level: it.level,
            createdAt: now,
        }));
        this.byUser.set(userId, next);
        return next;
    }
}
