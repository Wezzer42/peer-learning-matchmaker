"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

// Simple gate shown when there's no session
export function SignInGate() {
    return (
        <div className="p-6">
            <p className="mb-3 text-sm text-muted-foreground">
                Please sign in with Google to view your matches.
            </p>
            <Button onClick={() => signIn("google")}>Sign in with Google</Button>
        </div>
    );
}