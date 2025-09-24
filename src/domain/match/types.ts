// Domain types for Match

export type MatchStatus = "pending" | "accepted" | "rejected";

export type Match = {
  id: string;
  aUserId: string;
  bUserId: string;
  topic: string;
  score: number;
  status: MatchStatus;
  createdAt: string; // ISO string for client friendliness
};

export type MatchCreate = {
  aUserId: string;
  bUserId: string;
  topic: string;
  score: number;
  status?: MatchStatus;
};

export type MatchPatch = {
  topic?: string;
  score?: number;
  status?: MatchStatus;
};

export type MatchQuery = {
  userId?: string;
  topic?: string;
};

// DataStore contract all stores must implement
export interface DataStore {
  listMatches(q?: MatchQuery): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  createMatch(input: MatchCreate): Promise<Match>;
  updateMatch(id: string, patch: MatchPatch): Promise<Match>;
  setMatchStatus(id: string, status: MatchStatus): Promise<Match>;
  removeMatch(id: string): Promise<void>;
}
