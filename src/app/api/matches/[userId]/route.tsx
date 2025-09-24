import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/datastore";
import { makeMatchService } from "@/domain/match/service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeMatchService(getStore());

async function ensureSuggestions(userId: string, limit = 20) {
  const mine = await prisma.userSubject.findMany({ where: { userId } });
  if (mine.length === 0) return;

  const labels = Array.from(new Set(mine.map(s => s.label)));
  const others = await prisma.userSubject.findMany({
    where: { label: { in: labels }, userId: { not: userId } },
    select: { userId: true, label: true, level: true },
  });
  if (others.length === 0) return;

  const myLevelByLabel = new Map(mine.map(s => [s.label, s.level ?? undefined] as const));

  type Cand = { otherId: string; topic: string; score: number };
  const cands: Cand[] = [];
  for (const o of others) {
    const myLvl = myLevelByLabel.get(o.label);
    const a = typeof myLvl === "number" ? myLvl : 3;
    const b = typeof o.level === "number" ? o.level : 3;
    const dist = Math.abs(a - b);
    const score = Math.max(0, 1 - dist / 5);
    cands.push({ otherId: o.userId, topic: o.label, score });
  }

  const bestByOther = new Map<string, Cand>();
  for (const c of cands) {
    const prev = bestByOther.get(c.otherId);
    if (!prev || c.score > prev.score) bestByOther.set(c.otherId, c);
  }

  const unique = Array.from(bestByOther.values())
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);

  for (const cand of unique) {
    const exists = await prisma.match.findFirst({
      where: {
        topic: cand.topic,
        OR: [
          { aUserId: userId, bUserId: cand.otherId },
          { aUserId: cand.otherId, bUserId: userId },
        ],
      },
      select: { id: true },
    });
    if (!exists) {
      await prisma.match.create({
        data: {
          aUserId: userId,
          bUserId: cand.otherId,
          topic: cand.topic,
          score: cand.score,
          status: "pending",
        },
      });
    }
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const { userId } = await ctx.params;
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") ?? undefined;
  // Generate suggestions only when topic is not provided
  if (!topic) {
    try { await ensureSuggestions(userId); } catch {}
  }
  const list = await svc.list({ userId, topic: topic || undefined });
  // enrich with names and emails & decisions
  const userIds = Array.from(new Set(list.flatMap(m => [m.aUserId, m.bUserId])));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const nameById = new Map<string, string>(users.map(u => [u.id, u.name ?? u.id]));
  const emailById = new Map<string, string>(users.map(u => [u.id, u.email ?? ""]));
  type DecisionVal = "pending" | "accepted" | "rejected";
  type Decisions = { aDecision?: DecisionVal; bDecision?: DecisionVal };
  const rowsRaw = await prisma.match.findMany({ where: { id: { in: list.map(m => m.id) } } });
  const decisions = new Map<string, Decisions>(rowsRaw.map(r => {
    const rec = r as unknown as { id: string; aDecision: DecisionVal | null; bDecision: DecisionVal | null };
    return [rec.id, { aDecision: rec.aDecision ?? "pending", bDecision: rec.bDecision ?? "pending" }];
  }));
  const data = list.map(m => {
    const metaRow = decisions.get(m.id);
    const aDec = metaRow?.aDecision;
    const bDec = metaRow?.bDecision;
    return {
      ...m,
      aName: nameById.get(m.aUserId) ?? m.aUserId,
      bName: nameById.get(m.bUserId) ?? m.bUserId,
      aEmail: emailById.get(m.aUserId) ?? "",
      bEmail: emailById.get(m.bUserId) ?? "",
      aDecision: aDec ?? "pending",
      bDecision: bDec ?? "pending",
    };
  });
  return NextResponse.json({ ok: true, data });
}


