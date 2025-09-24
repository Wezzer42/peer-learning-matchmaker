// src/app/(dashboard)/match/[id]/page.tsx
import { getStore } from "@/lib/datastore";
import { makeMatchService } from "@/domain/match/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params; // Next 15: params is a Promise
  const svc = makeMatchService(getStore());

  // Server-to-store direct call, no fetch("/api/...") on the server
  const matches = await svc.list({ userId: id });

  return (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Match #{id}</h1>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches yet.</p>
      ) : (
        <ul className="space-y-2">
          {matches.map(m => (
            <li key={m.id} className="rounded-xl border p-3">
              <div className="text-sm">
                <span className="font-medium">{m.topic}</span>{" "}
                <span>score {m.score}</span>{" "}
                <span className="opacity-70">[{m.status}]</span>
              </div>
              <div className="text-xs opacity-70">
                {m.aUserId} ↔ {m.bUserId}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
