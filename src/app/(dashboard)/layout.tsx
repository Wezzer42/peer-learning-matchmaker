import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import Link from "next/link";
import UserChip from "@/components/user/user-chip";
import SignOutButton from "@/components/auth/signout-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerAuthSession();
    if (!session?.user) redirect("/");

    return (
        <div className="min-h-screen bg-gray-50">
          <header className="mx-auto max-w-5xl px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-lg font-semibold">StudyMatch</Link>
      
              {/* Right side: profile chip + logout */}
              <div className="flex items-center gap-3">
                <UserChip user={session.user ?? {}} />
                <SignOutButton redirectTo="/" />
              </div>
            </div>
          </header>
      
          <main className="mx-auto max-w-5xl px-6 pb-16">{children}</main>
          <Toaster richColors position="top-right" />
        </div>
      );
    }