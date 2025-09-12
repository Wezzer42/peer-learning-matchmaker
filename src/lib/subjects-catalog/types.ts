export type PublicSubject = {
    id: string;
    label: string;
    level?: number;
    createdAt: string;
    createdBy?: string;
};

export interface SubjectsCatalogStore {
    list(params?: { q?: string }): Promise<PublicSubject[]>;
    add(data: Omit<PublicSubject, "id" | "createdAt">): Promise<PublicSubject>;
    update(id: string, patch: Partial<Omit<PublicSubject, "id" | "createdAt">>): Promise<PublicSubject | null>;
    remove(id: string): Promise<boolean>;
    setAll(items: Array<{ label: string; level?: number }>, createdBy?: string): Promise<PublicSubject[]>;
}
