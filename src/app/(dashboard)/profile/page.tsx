import { Suspense } from "react";
import { SignInGate } from "../matches/sign-in-gate";
import { SubjectsEditor } from "./subjects-editor";
import SignOutButton from "@/components/auth/signout-button";
import { getServerAuthSession } from "@/lib/auth";
import { UserHeader } from "./user-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
    const session = await getServerAuthSession();
    if (!session?.user) return <SignInGate />;

    return (
        <section className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Profile</h1>

            <UserHeader />

            <Suspense fallback={<div>Loading…</div>}>
                <SubjectsEditor />
            </Suspense>
            <div className="pt-4 border-t flex justify-end">
                        <SignOutButton redirectTo="/" />
            </div>
        </section>

    );
}


