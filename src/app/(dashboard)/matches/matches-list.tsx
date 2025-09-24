"use client";

import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Match = {
    id: string;
    aUserId: string;
    bUserId: string;
    aName?: string;
    bName?: string;
    aEmail?: string;
    bEmail?: string;
    topic: string;
    score: number;
    status?: "pending" | "accepted" | "rejected";
    aDecision?: "pending" | "accepted" | "rejected";
    bDecision?: "pending" | "accepted" | "rejected";
    createdAt: string;
};

// Client list with Accept/Reject buttons calling your existing action route
export function MatchesList({ items, currentUserId }: { items: Match[]; currentUserId: string }) {
    const router = useRouter();
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    // Selection state must be declared before any early returns
    const [selectedId, setSelectedId] = useState<string | null>(null);

    async function doAction(matchId: string, type: "accept" | "reject") {
        setPendingId(matchId);
        try {
            const res = await fetch(`/api/matches/${currentUserId}/action`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ type, matchId }),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(j?.error ?? "Action failed");
            }
            // Soft refresh after mutation
            startTransition(() => router.refresh());
        } catch (e) {
            // Replace with a toast in real UI
            console.error(e);
        } finally {
            setPendingId(null);
        }
    }

    if (!items.length) {
        return <p className="text-sm text-muted-foreground">No items yet.</p>;
    }

    function isUserA(m: Match): boolean {
        return m.aUserId === currentUserId;
    }
    function myDecision(m: Match): "pending" | "accepted" | "rejected" {
        const d = isUserA(m) ? m.aDecision : m.bDecision;
        return d ?? "pending";
    }
    function bothAccepted(m: Match): boolean {
        return (m.aDecision === "accepted") && (m.bDecision === "accepted");
    }
    function anyRejected(m: Match): boolean {
        return (m.aDecision === "rejected") || (m.bDecision === "rejected");
    }

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs">
                        <tr>
                            <th className="text-left p-3 font-medium">Topic</th>
                            <th className="text-left p-3 font-medium">User A</th>
                            <th className="text-left p-3 font-medium">User B</th>
                            <th className="text-left p-3 font-medium">Score</th>
                            <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(m => {
                            const mine = myDecision(m);
                            const acceptedBoth = bothAccepted(m);
                            const rejectedAny = anyRejected(m);
                            const canAct = mine === "pending";
                            return (
                                <tr key={m.id} onClick={() => setSelectedId(m.id)} className={(selectedId === m.id ? "bg-accent/40 " : "") + "cursor-pointer hover:bg-accent/30 border-t"}>
                                    <td className="p-3 align-top">
                                        <div className="font-medium">{m.topic}</div>
                                        <div className="text-[11px] opacity-70">
                                            <time dateTime={m.createdAt}>{new Date(m.createdAt).toISOString().replace('T',' ').replace('Z',' UTC')}</time>
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">
                                        <div className="font-medium">{m.aName ?? m.aUserId}</div>
                                        {acceptedBoth && m.aEmail ? (
                                            <div className="text-[12px] opacity-80">{m.aEmail}</div>
                                        ) : null}
                                        <div className="text-[11px] mt-1">
                                            {m.aDecision ?? "pending"}
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">
                                        <div className="font-medium">{m.bName ?? m.bUserId}</div>
                                        {acceptedBoth && m.bEmail ? (
                                            <div className="text-[12px] opacity-80">{m.bEmail}</div>
                                        ) : null}
                                        <div className="text-[11px] mt-1">
                                            {m.bDecision ?? "pending"}
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">{m.score.toFixed(2)}</td>
                                    <td className="p-3 align-top space-y-2">
                                        <span className="text-[12px] px-2 py-1 rounded border">
                                            {rejectedAny ? "rejected" : acceptedBoth ? "accepted" : "pending"}
                                        </span>
                                        {mine !== "pending" && (
                                            <div className="text-[12px] mt-1 opacity-80">Вы {mine === "accepted" ? "приняли" : "отклонили"}</div>
                                        )}
                                        {canAct && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    disabled={pendingId === m.id}
                                                    onClick={(e) => { e.stopPropagation(); doAction(m.id, "reject"); }}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    disabled={pendingId === m.id}
                                                    onClick={(e) => { e.stopPropagation(); doAction(m.id, "accept"); }}
                                                >
                                                    Accept
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom action bar removed as requested */}
        </div>
    );
}