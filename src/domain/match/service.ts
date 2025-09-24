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
      // record per-user decision
      // @ts-expect-error: extended method on our stores
      const updated = await ds.setDecision(matchId, userId, "accepted");
            if (!updated) throw new Error("Match not found");
            return updated;
        },
    async markRejected(matchId: string, userId: string) {
      // @ts-expect-error: extended method on our stores
      const updated = await ds.setDecision(matchId, userId, "rejected");
            if (!updated) throw new Error("Match not found");
            return updated;
        },
    };
}
