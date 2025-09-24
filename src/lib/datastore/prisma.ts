// Prisma-backed implementation of DataStore (Node runtime only)
import { prisma } from "@/lib/prisma";
import type { Match as DomainMatch, MatchCreate, MatchPatch, MatchQuery, DataStore, MatchStatus } from "@/domain/match/types";
import type { Match as PrismaMatch, MatchStatus as PrismaMatchStatus } from "@prisma/client";

// Map Prisma row to domain DTO (Date -> ISO string)
function toDomain(m: PrismaMatch): DomainMatch {
  return {
    id: m.id,
    aUserId: m.aUserId,
    bUserId: m.bUserId,
    topic: m.topic,
    score: m.score,
    status: m.status as MatchStatus,
    createdAt: m.createdAt.toISOString(),
  };
}

export class PrismaMatchStore implements DataStore {
  async listMatches(q: MatchQuery = {}): Promise<DomainMatch[]> {
    const { userId, topic } = q;
    const rows = await prisma.match.findMany({
      where: {
        ...(userId ? { OR: [{ aUserId: userId }, { bUserId: userId }] } : {}),
        ...(topic ? { topic } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map(toDomain);
  }

  async getMatch(id: string): Promise<DomainMatch | null> {
    const row = await prisma.match.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async createMatch(input: MatchCreate): Promise<DomainMatch> {
    if (input.aUserId === input.bUserId) throw new Error("aUserId and bUserId must differ");
    const row = await prisma.match.create({
      data: {
        aUserId: input.aUserId,
        bUserId: input.bUserId,
        topic: input.topic,
        score: input.score,
        status: (input.status ?? "pending") as PrismaMatchStatus,
      },
    });
    return toDomain(row);
  }

  async updateMatch(id: string, patch: MatchPatch): Promise<DomainMatch> {
    const row = await prisma.match.update({
      where: { id },
      data: {
        ...(patch.topic !== undefined ? { topic: patch.topic } : {}),
        ...(patch.score !== undefined ? { score: patch.score } : {}),
        ...(patch.status !== undefined ? { status: patch.status as PrismaMatchStatus } : {}),
      },
    });
    return toDomain(row);
  }

  async setMatchStatus(id: string, status: MatchStatus): Promise<DomainMatch> {
    const row = await prisma.match.update({ where: { id }, data: { status: status as PrismaMatchStatus } });
    return toDomain(row);
  }

  async setDecision(id: string, byUserId: string, decision: "accepted" | "rejected"): Promise<DomainMatch> {
    const row = await prisma.match.findUnique({ where: { id } });
    if (!row) throw new Error("Match not found");
    const field: "aDecision" | "bDecision" = row.aUserId === byUserId ? "aDecision" : row.bUserId === byUserId ? "bDecision" : (() => { throw new Error("User not in match"); })();
    const full = (await prisma.match.update({
      where: { id },
      data: { [field]: decision },
    })) as PrismaMatch & { aDecision: string | null; bDecision: string | null };
    const a = full.aDecision ?? "pending";
    const b = full.bDecision ?? "pending";
    const derived: PrismaMatchStatus = (a === "rejected" || b === "rejected")
      ? "rejected"
      : (a === "accepted" && b === "accepted" ? "accepted" : "pending");
    if (derived !== full.status) {
      const finalized = await prisma.match.update({ where: { id }, data: { status: derived } });
      return toDomain(finalized);
    }
    return toDomain(full as PrismaMatch);
  }

  async removeMatch(id: string): Promise<void> {
    await prisma.match.delete({ where: { id } });
  }
}
