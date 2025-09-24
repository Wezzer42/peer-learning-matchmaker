import { makeMatchService } from "@/domain/match/service";
import { getStore } from "@/lib/datastore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeMatchService(getStore());

const Body = z.object({
    type: z.enum(["accept", "reject", "suggest"]),
    matchId: z.string().min(1).optional(),
    bUserId: z.string().min(1).optional(),
    topic: z.string().optional(),
    score: z.number().min(0).max(1).optional(),
});

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
    const raw = await req.json();
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
        const msg = parsed.error.issues
            .map((i: { path: PropertyKey[]; message: string }) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; ");
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { userId } = await params;
    const { type, matchId, bUserId, topic, score } = parsed.data;

    if (type === "accept") {
        if (!matchId) {
            return NextResponse.json({ ok: false, error: "matchId is required" }, { status: 400 });
        }
        await svc.markAccepted(matchId, userId);
        return NextResponse.json({ ok: true });
    }

    if (type === "reject") {
        if (!matchId) {
            return NextResponse.json({ ok: false, error: "matchId is required" }, { status: 400 });
        }
        await svc.markRejected(matchId, userId);
        return NextResponse.json({ ok: true });
    }

    // suggest
    if (!bUserId || score == null) {
        return NextResponse.json(
            { ok: false, error: "bUserId and score are required" },
            { status: 400 }
        );
    }

    const created = await svc.create({
        aUserId: userId,
        bUserId,
        topic: topic ?? "suggestion",
        score,
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
}


