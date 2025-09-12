"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
// Replace these with your actual UI components if you have them
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BulkSubjectsSchema = z
    .array(z.object({ label: z.string().min(1, "Label is required"), level: z.number().int().min(1).max(5).optional() }))
    .max(50);

type SubjectItem = z.infer<typeof BulkSubjectsSchema>[number];

type CatalogSubject = { id: string; label: string; level?: number };

// Converts a comma-separated string like "react, nextjs" to a unique list of trimmed labels
function parseLabels(input: string): string[] {
    return Array.from(
        new Set(
            input
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)
        )
    );
}

export default function OnboardingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [suggestions, setSuggestions] = useState<CatalogSubject[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [custom, setCustom] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // If not signed in, show a gate
    useEffect(() => {
        if (status === "unauthenticated") {
            // Optional: you can auto-trigger signIn("google") here
        }
    }, [status]);

    // Load catalog suggestions (public)
    useEffect(() => {
        // No auth required for GET /api/subjects
        fetch("/api/subjects", { cache: "no-store" })
            .then(r => r.json())
            .then((j: { ok: boolean; data: CatalogSubject[] }) => {
                if (j.ok) setSuggestions(j.data);
            })
            .catch(() => {
                /* ignore */
            });
    }, []);

    function toggle(label: string) {
        setSelected(prev => (prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]));
    }

    function addCustom() {
        const labels = parseLabels(custom);
        if (!labels.length) return;
        setSelected(prev => Array.from(new Set([...prev, ...labels])));
        setCustom("");
    }

    const payload: SubjectItem[] = useMemo(
        () => selected.map(label => ({ label })), // default level omitted
        [selected]
    );

    async function onSave() {
        setError(null);
        // Validate client-side before sending
        const parsed = BulkSubjectsSchema.safeParse(payload);
        if (!parsed.success) {
            setError(parsed.error.issues.map(i => i.message).join("; "));
            return;
        }
        try {
            setSaving(true);
            const res = await fetch("/api/me/subjects", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(j?.error ?? "Failed to save subjects");
            }
            router.push("/matches");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    if (status === "unauthenticated") {
        return (
            <div className="p-6">
                <p className="mb-3 text-sm text-muted-foreground">Please sign in to continue onboarding.</p>
                <Button onClick={() => signIn("google")}>Sign in with Google</Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Onboarding</h1>

            <div className="space-y-2">
                <label className="text-sm">Pick subjects you want to learn or teach</label>
                <div className="flex flex-wrap gap-2">
                    {suggestions.length ? (
                        suggestions.slice(0, 30).map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => toggle(s.label)}
                                className={`rounded-full border px-3 py-1 text-sm ${selected.includes(s.label) ? "bg-primary text-primary-foreground" : ""
                                    }`}
                                aria-pressed={selected.includes(s.label)}
                            >
                                {s.label}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No suggestions yet.</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm">Add custom subjects (comma separated)</label>
                <div className="flex gap-2">
                    <Input
                        value={custom}
                        onChange={e => setCustom(e.target.value)}
                        placeholder="react, nextjs, ai"
                    />
                    <Button type="button" onClick={addCustom}>
                        Add
                    </Button>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="space-y-1">
                    <p className="text-sm">Selected:</p>
                    <div className="flex flex-wrap gap-2">
                        {selected.map(label => (
                            <span key={label} className="rounded-full border px-3 py-1 text-sm">
                                {label}{" "}
                                <button
                                    type="button"
                                    className="opacity-70 hover:opacity-100"
                                    onClick={() => toggle(label)}
                                    aria-label={`Remove ${label}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
                <Button onClick={onSave} disabled={saving || !selected.length}>
                    {saving ? "Saving…" : "Save and continue"}
                </Button>
            </div>
        </div>
    );
}
