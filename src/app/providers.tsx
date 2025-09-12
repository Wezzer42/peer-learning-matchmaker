"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export default function Providers({
    children,
    session,
}: {
    children: React.ReactNode;
    session: Session | null;
}) {
    // You can also pass refetchInterval/refetchOnWindowFocus if you want
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
