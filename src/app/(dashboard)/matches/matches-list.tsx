"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Match = {
    id: string;
    aUserId: string;
    bUserId: string;
    topic: string;
    score: number;
    status?: "pending" | "accepted" | "rejected";
    createdAt: string;
};

// Client list with Accept/Reject buttons calling your existing action route
export function MatchesList({ items, currentUserId }: { items: Match[]; currentUserId: string }) {
    const router = useRouter();
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

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

    return (
        <div className="grid gap-3">
            {items.map(m => (
                <Card key={m.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="text-sm">
                            <div className="font-medium">
                                {m.topic} <span className="opacity-70">[{m.status ?? "pending"}]</span>
                            </div>
                            <div className="text-xs opacity-70">
                                {m.aUserId} ↔ {m.bUserId}
                            </div>
                            <div className="text-xs">score {m.score}</div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={pendingId === m.id}
                                onClick={() => doAction(m.id, "reject")}
                            >
                                Reject
                            </Button>
                            <Button
                                disabled={pendingId === m.id}
                                onClick={() => doAction(m.id, "accept")}
                            >
                                Accept
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}