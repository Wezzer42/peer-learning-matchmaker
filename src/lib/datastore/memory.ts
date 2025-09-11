import { DataStore, Match } from "./types";

export class MemoryStore implements DataStore {
    private data: Match[] = [];

    async createMatch(input: Omit<Match, "id" | "createdAt">): Promise<Match> {
        const m: Match = {
            ...input,
            status: input.status ?? "pending",
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        this.data.push(m);
        return m;
    }

    async listMatches(params?: { userId?: string; topic?: string }) {
        return this.data.filter(m =>
            (!params?.userId || m.aUserId === params.userId || m.bUserId === params.userId) &&
            (!params?.topic || m.topic === params.topic)
        );
    }

    async updateMatch(id: string, patch: Partial<Match>): Promise<Match | null> {
        const i = this.data.findIndex(m => m.id === id);
        if (i < 0) return null;
        this.data[i] = { ...this.data[i], ...patch };
        return this.data[i];
    }
}