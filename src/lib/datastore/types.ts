export type ID = string;

export interface Match {
    id: string;
    aUserId: string;
    bUserId: string;
    topic: string;
    score: number;
    status?: "pending" | "accepted" | "rejected";
    createdAt: string;
}

export interface DataStore {
    createMatch(input: Omit<Match, "id" | "createdAt">): Promise<Match>;
    listMatches(params?: { userId?: string; topic?: string }): Promise<Match[]>;
    updateMatch(id: string, patch: Partial<Match>): Promise<Match | null>;
}