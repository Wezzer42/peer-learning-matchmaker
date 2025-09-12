import { getServerAuthSession } from "@/lib/auth"; // your v4 wrapper
import { Suspense } from "react";
import { MatchesList } from "./matches-list";
import { SignInGate } from "./sign-in-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Minimal shared type for rendering; keep in sync with API output
type Match = {
    id: string;
    aUserId: string;
    bUserId: string;
    topic: string;
    score: number;
    status?: "pending" | "accepted" | "rejected";
    createdAt: string;
};

// Small helper to fetch JSON with no-store cache
async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed GET ${url}`);
    return res.json() as Promise<T>;
}

export default async function MatchesPage() {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
        return <SignInGate />;
    }

    const userId = session.user.id;

    // Fetch user's matches and global suggestions in parallel
    const [mineResp, suggResp] = await Promise.all([
        fetchJSON<{ ok: boolean; data: Match[] }>(`/api/matches/${userId}`),
        fetchJSON<{ ok: boolean; data: Match[] }>(`/api/matches/suggestions`),
    ]);

    const mine = mineResp.data ?? [];
    const suggestions = suggResp.data ?? [];

    return (
        <section className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Matches</h1>

            <div className="space-y-3">
                <h2 className="text-lg font-medium">Your matches</h2>
                <Suspense fallback={<div>Loading…</div>}>
                    <MatchesList items={mine} currentUserId={userId} />
                </Suspense>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-medium">Suggestions</h2>
                <Suspense fallback={<div>Loading…</div>}>
                    <MatchesList items={suggestions} currentUserId={userId} />
                </Suspense>
            </div>
        </section>
    );
}