"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

type SessionUser = NonNullable<import("next-auth").Session["user"]> & { id?: string };

export function UserHeader() {
    const { data } = useSession();
    const user = data?.user as SessionUser | undefined;
    return (
        <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-3">
                {user?.image ? (
                    <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={48}
                        height={48}
                        className="rounded-full border"
                        priority
                    />
                ) : null}
                <div className="text-sm">
                    <div className="font-medium">{user?.name ?? "Unnamed"}</div>
                    <div className="opacity-70">{user?.email ?? "No email"}</div>
                    {user?.id ? (
                        <div className="text-xs opacity-60">id: {String(user.id)}</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}


