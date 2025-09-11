"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
// Using a plain <textarea> to avoid extra deps if Textarea isn't installed

// Simple client-side schema for basic validation
const Schema = z.object({
    displayName: z.string().min(1, "Name is required"),
    interests: z.string().min(1, "Interests are required"),
    goal: z.string().min(1, "Goal is required"),
});

export default function OnboardingPage() {
    const router = useRouter();
    const [form, setForm] = useState({ displayName: "", interests: "", goal: "" });
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit() {
        setError(null);
        const parsed = Schema.safeParse(form);
        if (!parsed.success) {
            // Show a compact error message from Zod issues
            const msg = parsed.error.issues.map(i => i.message).join("; ");
            setError(msg);
            return;
        }
        try {
            // Temporary: stash locally; later replace with POST /api/profile
            localStorage.setItem("plm_onboarding", JSON.stringify(parsed.data));
            setPending(true);
            router.push("/matches");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="mx-auto max-w-xl p-6">
            <div className="rounded-xl border p-5 space-y-4">
                <h1 className="text-2xl font-semibold">Onboarding</h1>

                <div className="space-y-1">
                    <label className="text-sm">Name</label>
                    <Input
                        value={form.displayName}
                        onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                        placeholder="Azat"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Interests (comma separated)</label>
                    <Input
                        value={form.interests}
                        onChange={e => setForm(f => ({ ...f, interests: e.target.value }))}
                        placeholder="react, threejs, ai"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Goal</label>
                    <textarea
                        className="w-full min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none"
                        value={form.goal}
                        onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                        placeholder="Find partners for peer-learning in React"
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button onClick={onSubmit} disabled={pending}>
                    {pending ? "Please wait..." : "Save and continue"}
                </Button>
            </div>
        </div>
    );
}
