// src/app/(dashboard)/matches/page.tsx
import { Suspense } from "react";
import { MatchesList } from "./matches-list";
import { headers } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import { TopicFilter } from "./topic-filter";
import { SavedToast } from "./saved-toast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Match = {
  id: string;
  aUserId: string;
  bUserId: string;
  topic: string;
  score: number;
  status?: "pending" | "accepted" | "rejected";
  aDecision?: "pending" | "accepted" | "rejected";
  bDecision?: "pending" | "accepted" | "rejected";
  aName?: string;
  bName?: string;
  aEmail?: string;
  bEmail?: string;
  createdAt: string;
};

// Build absolute base URL inside a request scope
async function getBaseUrl(): Promise<string> {
    try {
      const h = await headers(); // ← await обязательно
      const host = h.get("x-forwarded-host") ?? h.get("host");
      const proto = h.get("x-forwarded-proto") ?? "http";
      if (host) return `${proto}://${host}`;
    } catch {
      // no request scope, fall back
    }
    return (
      process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000"
    );
  }
  
  async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
        const res = await fetch(url, { ...(init ?? {}) });
         if (!res.ok) throw new Error(`Failed GET ${url}`);
         return res.json() as Promise<T>;
  }
  
type SessionUser = NonNullable<import("next-auth").Session["user"]> & { id?: string };
export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
    const session = await getServerAuthSession();
    const currentUserId = String((session?.user as SessionUser)?.id ?? "");
    const base = await getBaseUrl();
    const h = await headers();
    const cookie = h.get("cookie") ?? undefined;
    const init = cookie ? { headers: { cookie } } : undefined;
  const sp = await searchParams;
  const topic = sp?.topic;
  const path = topic ? `/api/matches?topic=${encodeURIComponent(topic)}` : `/api/matches`;
  const allResp = await fetchJSON<{ ok: boolean; data: Match[] }>(new URL(path, base).toString(), init);
    const all = allResp.data ?? [];
    const mine = all.filter(m => (m.aDecision ?? "pending") === "pending" && (m.bDecision ?? "pending") === "pending");
    const suggestions = all.filter(m => (m.aDecision ?? "pending") !== "pending" || (m.bDecision ?? "pending") !== "pending");

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Matches</h1>
      <SavedToast />
      <TopicFilter />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Your matches</h2>
        <Suspense fallback={<div>Loading…</div>}>
          <MatchesList items={mine} currentUserId={currentUserId} />
        </Suspense>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Suggestions (accepted/rejected)</h2>
        <Suspense fallback={<div>Loading…</div>}>
          <MatchesList items={suggestions} currentUserId={currentUserId} />
        </Suspense>
      </div>

    </section>
  );
}
