import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getStore } from "@/lib/datastore";
import { makeMatchService } from "@/domain/match/service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeMatchService(getStore());

async function ensureSuggestions(userId: string) {
  try {
    const mine = await prisma.userSubject.findMany({ where: { userId } });
    if (mine.length === 0) return;
    const labels = Array.from(new Set(mine.map((s: { label: string; level: number | null }) => s.label)));
    const others = await prisma.userSubject.findMany({
      where: { label: { in: labels }, userId: { not: userId } },
      select: { userId: true, label: true, level: true },
    });
    const myLevel = new Map(mine.map((s: { label: string; level: number | null }) => [s.label, s.level ?? undefined] as const));
    // build candidates for ALL shared labels (not only best)
    const candMap = new Map<string, { otherId: string; label: string; score: number }>();
    const keyOf = (label: string, u1: string, u2: string) => `${label}|${[u1, u2].sort().join("|")}`;
    for (const o of others) {
      const a = typeof myLevel.get(o.label) === "number" ? (myLevel.get(o.label) as number) : 3;
      const b = typeof o.level === "number" ? o.level : 3;
      const diff = Math.abs(a - b);
      const score = Math.min(1, Math.max(0, diff / 4));
      const k = keyOf(o.label, userId, o.userId);
      // keep highest score per (label, pair)
      const prev = candMap.get(k);
      if (!prev || score > prev.score) candMap.set(k, { otherId: o.userId, label: o.label, score });
    }
    const candidates = Array.from(candMap.values());
    if (candidates.length === 0) return;
    const otherIds = Array.from(new Set(candidates.map(c => c.otherId)));
    const candLabels = Array.from(new Set(candidates.map(c => c.label)));
    const existing = await prisma.match.findMany({
      where: {
        topic: { in: candLabels },
        OR: [
          { aUserId: userId, bUserId: { in: otherIds } },
          { bUserId: userId, aUserId: { in: otherIds } },
        ],
      },
      select: { id: true, aUserId: true, bUserId: true, topic: true, score: true },
    });
    const hasKey = new Set(existing.map(r => keyOf(r.topic, r.aUserId, r.bUserId)));
    const toCreate = candidates.filter(c => !hasKey.has(keyOf(c.label, userId, c.otherId)));
    if (toCreate.length) {
      await prisma.match.createMany({
        data: toCreate.map(c => ({ aUserId: userId, bUserId: c.otherId, topic: c.label, score: c.score, status: "pending" })),
      });
    }
    // Recalculate score for existing pairs if changed
    if (existing.length) {
      const candByKey = new Map(candidates.map(c => [keyOf(c.label, userId, c.otherId), c]));
      const toUpdate = existing.filter(r => {
        const cand = candByKey.get(keyOf(r.topic, r.aUserId, r.bUserId));
        return cand && Math.abs((cand.score ?? 0) - (r.score ?? 0)) > 1e-6;
      });
      for (const r of toUpdate) {
        const cand = candByKey.get(keyOf(r.topic, r.aUserId, r.bUserId));
        if (cand) {
          await prisma.match.update({ where: { id: r.id }, data: { score: cand.score } });
        }
      }
    }
  } catch {}
}

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const userId = String(session.user.id);
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") ?? undefined;
  // Generate suggestions only once when fetching the full list
  if (!topic) {
    await ensureSuggestions(userId);
  }
  let list = await svc.list({ userId, topic: topic || undefined });
  // Filter by selected subjects when no specific topic requested
  if (!topic) {
    const myLabels = await prisma.userSubject.findMany({ where: { userId }, select: { label: true } });
    const allow = new Set<string>(myLabels.map(x => x.label));
    list = list.filter(m => allow.has(m.topic));
  }
  const userIds = Array.from(new Set(list.flatMap(m => [m.aUserId, m.bUserId])));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const nameById = new Map<string, string>(users.map((u: { id: string; name: string | null; email: string | null }) => [u.id, u.name ?? u.id]));
  const emailById = new Map<string, string>(users.map((u: { id: string; name: string | null; email: string | null }) => [u.id, u.email ?? ""]));
  const ids = list.map(m => m.id);
  const metaRaw = await prisma.match.findMany({ where: { id: { in: ids } } });
  type DecisionVal = "pending" | "accepted" | "rejected";
  type Decisions = { aDecision?: DecisionVal; bDecision?: DecisionVal };
  const byId = new Map<string, Decisions>(metaRaw.map((r: { id: string; [key: string]: unknown }) => {
    const rec = r as unknown as { id: string; aDecision: DecisionVal | null; bDecision: DecisionVal | null };
    return [rec.id, { aDecision: rec.aDecision ?? "pending", bDecision: rec.bDecision ?? "pending" }];
  }));
  const data = list.map(m => {
    const metaRow = byId.get(m.id);
    const aDec: DecisionVal | undefined = metaRow?.aDecision;
    const bDec: DecisionVal | undefined = metaRow?.bDecision;
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


