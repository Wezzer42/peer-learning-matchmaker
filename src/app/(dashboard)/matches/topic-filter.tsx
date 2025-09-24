"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Subject = { id: string; label: string; level?: number };

export function TopicFilter() {
    const router = useRouter();
    const sp = useSearchParams();
    const current = sp.get("topic") ?? "";
    const [items, setItems] = useState<Subject[]>([]);
    useEffect(() => {
        fetch("/api/me/subjects", { cache: "no-store" })
            .then(r => r.json())
            .then((j: { ok: boolean; data: Subject[] }) => { if (j.ok) setItems(j.data); })
            .catch(() => {});
    }, []);

    return (
        <div className="flex items-center gap-2">
            <label className="text-sm">Topic</label>
            <select
                className="border rounded px-2 py-1 text-sm"
                value={current}
                onChange={e => {
                    const val = e.target.value;
                    const qs = val ? `?topic=${encodeURIComponent(val)}` : "";
                    router.push(`/matches${qs}`);
                }}
            >
                <option value="">All</option>
                {items.map(s => (
                    <option key={s.id} value={s.label}>{s.label}</option>
                ))}
            </select>
        </div>
    );
}


