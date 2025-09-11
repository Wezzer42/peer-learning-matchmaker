type Match = {
    id: string;
    aUserId: string;
    bUserId: string;
    topic: string;
    score: number;
    status?: "pending" | "accepted" | "rejected";
    createdAt: string;
};

type Props = { params: { id: string } };

async function getMatches(userId: string): Promise<Match[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/matches/${userId}`, {
        cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch matches");
    const json = await res.json();
    return json.data as Match[];
}

export default async function MatchPage({ params }: Props) {
    const { id } = params;
    const matches = await getMatches(id);

    return (
        <section className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Match #{id}</h1>
            <ul className="space-y-2">
                {matches.map(m => (
                    <li key={m.id} className="rounded-xl border p-3">
                        <div className="text-sm">
                            <span className="font-medium">{m.topic}</span>{" "}
                            <span>score {m.score}</span>{" "}
                            <span className="opacity-70">[{m.status ?? "pending"}]</span>
                        </div>
                        <div className="text-xs opacity-70">
                            {m.aUserId} ↔ {m.bUserId}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;