import { getServerAuthSession } from "@/lib/auth";
import { Suspense } from "react";
import { SignInGate } from "../matches/sign-in-gate";
import { SubjectsEditor } from "./subjects-editor";

export default async function ProfilePage() {
    const session = await getServerAuthSession();
    if (!session?.user) return <SignInGate />;

    return (
        <section className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Profile</h1>

            <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                    {session.user.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name ?? "User"}
                            className="h-12 w-12 rounded-full border"
                        />
                    ) : null}
                    <div className="text-sm">
                        <div className="font-medium">{session.user.name ?? "Unnamed"}</div>
                        <div className="opacity-70">{session.user.email ?? "No email"}</div>
                        {"id" in session.user && session.user.id ? (
                            <div className="text-xs opacity-60">id: {String(session.user.id)}</div>
                        ) : null}
                    </div>
                </div>
            </div>

            <Suspense fallback={<div>Loading…</div>}>
                <SubjectsEditor />
            </Suspense>
        </section>
    );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
