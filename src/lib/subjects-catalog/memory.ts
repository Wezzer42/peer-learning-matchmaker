import type { PublicSubject, SubjectsCatalogStore } from "./types";

export class MemorySubjectsCatalog implements SubjectsCatalogStore {
    private items: PublicSubject[] = [];

    async list(params?: { q?: string }): Promise<PublicSubject[]> {
        const q = params?.q?.trim().toLowerCase();
        if (!q) return this.items;
        return this.items.filter(s => s.label.toLowerCase().includes(q));
    }

    async add(data: Omit<PublicSubject, "id" | "createdAt">): Promise<PublicSubject> {
        const now = new Date().toISOString();
        const item: PublicSubject = { ...data, id: crypto.randomUUID(), createdAt: now };
        this.items.push(item);
        return item;
    }

    async update(id: string, patch: Partial<Omit<PublicSubject, "id" | "createdAt">>): Promise<PublicSubject | null> {
        const i = this.items.findIndex(s => s.id === id);
        if (i < 0) return null;
        this.items[i] = { ...this.items[i], ...patch };
        return this.items[i];
    }

    async remove(id: string): Promise<boolean> {
        const before = this.items.length;
        this.items = this.items.filter(s => s.id !== id);
        return this.items.length !== before;
    }

    async setAll(items: Array<{ label: string; level?: number }>, createdBy?: string): Promise<PublicSubject[]> {
        const now = new Date().toISOString();
        this.items = items.map(it => ({
            id: crypto.randomUUID(),
            label: it.label,
            level: it.level,
            createdAt: now,
            createdBy,
        }));
        return this.items;
    }
}
