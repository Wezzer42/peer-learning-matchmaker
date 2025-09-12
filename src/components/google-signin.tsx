"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function GoogleSignin() {
    return (
        <button
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            type="button"
        >
            <FcGoogle className="text-lg" />
            Continue with Google
        </button>
    );
}