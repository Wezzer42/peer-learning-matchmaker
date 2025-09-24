// In-memory implementation of DataStore (for tests/dev)
import type { DataStore, Match, MatchCreate, MatchPatch, MatchQuery, MatchStatus } from "@/domain/match/types";

type Row = {
  id: string;
  aUserId: string;
  bUserId: string;
  topic: string;
  score: number;
  status: MatchStatus;
  createdAt: Date;
  aDecision?: "pending" | "accepted" | "rejected";
  bDecision?: "pending" | "accepted" | "rejected";
};

function toDomain(r: Row): Match {
  return {
    id: r.id,
    aUserId: r.aUserId,
    bUserId: r.bUserId,
    topic: r.topic,
    score: r.score,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

function cuid(): string {
  // tiny cuid-ish for tests; replace if you want real randomness
  return "m_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class MemoryMatchStore implements DataStore {
  private rows: Row[] = [];

  async listMatches(q: MatchQuery = {}): Promise<Match[]> {
    const { userId, topic } = q;
    const out = this.rows
      .filter(r => (userId ? r.aUserId === userId || r.bUserId === userId : true))
      .filter(r => (topic ? r.topic === topic : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 200)
      .map(toDomain);
    return out;
  }

  async getMatch(id: string): Promise<Match | null> {
    const r = this.rows.find(x => x.id === id);
    return r ? toDomain(r) : null;
  }

  async createMatch(input: MatchCreate): Promise<Match> {
    if (input.aUserId === input.bUserId) throw new Error("aUserId and bUserId must differ");
    const row: Row = {
      id: cuid(),
      aUserId: input.aUserId,
      bUserId: input.bUserId,
      topic: input.topic,
      score: input.score,
      status: input.status ?? "pending",
      createdAt: new Date(),
      aDecision: "pending",
      bDecision: "pending",
    };
    this.rows.unshift(row);
    return toDomain(row);
  }

  async updateMatch(id: string, patch: MatchPatch): Promise<Match> {
    const idx = this.rows.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Match not found");
    const r = this.rows[idx];
    const next: Row = {
      ...r,
      ...(patch.topic !== undefined ? { topic: patch.topic } : {}),
      ...(patch.score !== undefined ? { score: patch.score } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    };
    this.rows[idx] = next;
    return toDomain(next);
  }

  async setMatchStatus(id: string, status: MatchStatus): Promise<Match> {
    return this.updateMatch(id, { status });
  }

  async setDecision(id: string, byUserId: string, decision: "accepted" | "rejected"): Promise<Match> {
    const idx = this.rows.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Match not found");
    const r = this.rows[idx];
    const isA = r.aUserId === byUserId;
    if (!isA && r.bUserId !== byUserId) throw new Error("User not in match");
    const next: Row = {
      ...r,
      ...(isA ? { aDecision: decision } : { bDecision: decision }),
    };
    // derive status
    const a = next.aDecision ?? "pending";
    const b = next.bDecision ?? "pending";
    next.status = a === "rejected" || b === "rejected" ? "rejected" : (a === "accepted" && b === "accepted" ? "accepted" : "pending");
    this.rows[idx] = next;
    return toDomain(next);
  }

  async removeMatch(id: string): Promise<void> {
    this.rows = this.rows.filter(x => x.id !== id);
  }
}
