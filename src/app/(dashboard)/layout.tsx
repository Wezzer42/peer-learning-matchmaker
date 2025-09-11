import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/");

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="mx-auto max-w-5xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">StudyMatch</div>
                    <div className="text-sm text-gray-600">{session.user?.email}</div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-6 pb-16">{children}</main>
            <Toaster richColors position="top-right" />
        </div>
    );
}