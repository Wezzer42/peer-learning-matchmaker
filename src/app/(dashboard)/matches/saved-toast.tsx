"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SavedToast() {
    const sp = useSearchParams();
    const router = useRouter();
    useEffect(() => {
        const saved = sp.get("saved");
        if (saved) {
            toast.success("Saved");
            // clean the query to avoid repeat on back/refresh
            const params = new URLSearchParams(Array.from(sp.entries()));
            params.delete("saved");
            router.replace(`/matches${params.size ? `?${params.toString()}` : ""}`);
        }
    }, [sp, router]);
    return null;
}


