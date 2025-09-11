// src/app/page.tsx
import GoogleSignin from "@/components/google-signin";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/onboarding");

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-6">
        <header className="flex items-center justify-between py-6">
          <div className="text-xl font-semibold tracking-tight">StudyMatch</div>
          <div className="hidden sm:block">
            <GoogleSignin />
          </div>
        </header>

        <section className="grid gap-8 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Find your <span className="text-blue-600">study partner</span> in minutes
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Pick what you want to learn and what you can teach. We’ll match you by topics and timezones.
            </p>
            <div className="mt-8 sm:hidden">
              <GoogleSignin />
            </div>
            <div className="mt-8 hidden sm:flex">
              <GoogleSignin />
            </div>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li>• Google login, no passwords</li>
              <li>• Learn/Teach subject picker</li>
              <li>• Smart matches with instant contact</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="rounded-xl bg-gray-100 p-4">
              <div className="mb-3 h-4 w-24 rounded bg-gray-300" />
              <div className="mb-2 h-3 w-40 rounded bg-gray-300" />
              <div className="mb-6 h-3 w-32 rounded bg-gray-300" />

              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                    <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
                    <div className="flex gap-2">
                      <span className="h-5 w-12 rounded-full bg-blue-100" />
                      <span className="h-5 w-16 rounded-full bg-emerald-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                Get started
              </button>
            </div>
          </div>
        </section>

        <footer className="py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} StudyMatch. Built for hackathons.
        </footer>
      </div>
    </main>
  );
}
