"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
// Replace these with your components if available
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SubjectSchema = z.object({
    id: z.string(),
    label: z.string(),
    level: z.number().int().min(1).max(5).optional(),
    createdAt: z.string(),
});
type Subject = z.infer<typeof SubjectSchema>;

const CreateSchema = z.object({
    label: z.string().min(1, "Label is required"),
    level: z.number().int().min(1).max(5).optional(),
});
type CreatePayload = z.infer<typeof CreateSchema>;

export function SubjectsEditor() {
    const [items, setItems] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newLabel, setNewLabel] = useState("");
    const [newLevel, setNewLevel] = useState<number | undefined>(undefined);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [savingAll, setSavingAll] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/me/subjects", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load subjects");
            const j = (await res.json()) as { ok: boolean; data: Subject[] };
            setItems(j.data ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Load failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function add() {
        setError(null);
        const parsed = CreateSchema.safeParse({ label: newLabel, level: newLevel });
        if (!parsed.success) {
            setError(parsed.error.issues.map(i => i.message).join("; "));
            return;
        }
        try {
            const res = await fetch("/api/me/subjects", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(j?.error ?? "Create failed");
            }
            setNewLabel("");
            setNewLevel(undefined);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Create failed");
        }
    }

    async function patch(id: string, patch: Partial<Pick<Subject, "label" | "level">>) {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/me/subjects/${id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(j?.error ?? "Update failed");
            }
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Update failed");
        } finally {
            setBusyId(null);
        }
    }

    async function remove(id: string) {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/me/subjects/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const j = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(j?.error ?? "Delete failed");
            }
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setBusyId(null);
        }
    }

    // Optional: bulk replace based on current in-memory items
    const bulkPayload = useMemo(
        () => items.map(({ label, level }) => ({ label, level })),
        [items]
    );

    async function saveAll() {
        setSavingAll(true);
        setError(null);
        try {
            const res = await fetch("/api/me/subjects", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(bulkPayload),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(j?.error ?? "Bulk save failed");
            }
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Bulk save failed");
        } finally {
            setSavingAll(false);
        }
    }

    if (loading) return <div>Loading…</div>;

    return (
        <div className="rounded-xl border p-5 space-y-4">
            <h2 className="text-lg font-medium">Your subjects</h2>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="space-y-2">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {items.map(s => (
                            <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                <div className="text-sm">
                                    <div className="font-medium">{s.label}</div>
                                    <div className="text-xs opacity-70">created {new Date(s.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="rounded-md border bg-background px-2 py-1 text-sm"
                                        value={s.level ?? ""}
                                        onChange={e => {
                                            const v = e.target.value === "" ? undefined : Number(e.target.value);
                                            void patch(s.id, { level: v });
                                        }}
                                        disabled={busyId === s.id}
                                    >
                                        <option value="">level</option>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="outline"
                                        disabled={busyId === s.id}
                                        onClick={() => remove(s.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm">Add subject</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g. react"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                    />
                    <select
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                        value={newLevel ?? ""}
                        onChange={e => setNewLevel(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">level</option>
                        {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <Button onClick={add} disabled={!newLabel.trim()}>
                        Add
                    </Button>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={saveAll} disabled={savingAll}>
                    {savingAll ? "Saving…" : "Save all"}
                </Button>
            </div>
        </div>
    );
}
