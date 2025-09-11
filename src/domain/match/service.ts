import type { DataStore } from "@/lib/datastore/types";
import { CreateMatchInput } from "./schemas";

export function makeMatchService(ds: DataStore) {
    return {
        async create(payload: unknown) {
            const data = CreateMatchInput.parse(payload);
            return ds.createMatch(data);
        },
        async list(query: { userId?: string; topic?: string }) {
            return ds.listMatches(query);
        },
        async markAccepted(matchId: string, userId: string) {
            const updated = await ds.updateMatch(matchId, { status: "accepted" });
            if (!updated) throw new Error("Match not found");
            // при желании проверяй, что userId имеет право принимать
            return updated;
        },
        async markRejected(matchId: string, userId: string) {
            const updated = await ds.updateMatch(matchId, { status: "rejected" });
            if (!updated) throw new Error("Match not found");
            return updated;
        },
    };
}