export type Subject = {
    id: string;
    userId: string;
    label: string;
    level?: number;
    createdAt: string;
};

export interface SubjectsStore {
    list(userId: string): Promise<Subject[]>;
    add(userId: string, data: Omit<Subject, "id" | "userId" | "createdAt">): Promise<Subject>;
    update(userId: string, id: string, patch: Partial<Omit<Subject, "id" | "userId" | "createdAt">>): Promise<Subject | null>;
    remove(userId: string, id: string): Promise<boolean>;
    setAll(userId: string, items: Array<{ label: string; level?: number }>): Promise<Subject[]>;
}
