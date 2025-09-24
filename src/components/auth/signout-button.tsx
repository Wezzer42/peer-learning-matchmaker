"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Props = { redirectTo?: string; className?: string };

export default function SignOutButton({ redirectTo = "/", className }: Props) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    try {
      setLoading(true);
      // next-auth handles redirect for you
      await signOut({ callbackUrl: redirectTo });
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button type="button" onClick={onClick} disabled={loading} className={className} aria-label="Sign out">
      {loading ? "Signing out…" : "Logout"}
    </Button>
  );
}