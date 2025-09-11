import { makeMatchService } from "@/domain/match/service";
import { getStore } from "@/lib/datastore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeMatchService(getStore());

const Body = z.object({
    matchId: z.string().min(1).optional(),
    bUserId: z.string().min(1).optional(),
    topic: z.string().optional(),
    score: z.number().min(0).max(1).optional(),
});

type Params = { params: { userId: string; action: string } };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { userId, action } = params;
        const body = Body.parse(await req.json());

        switch (action) {
            case "accept":
                if (!body.matchId) throw new Error("matchId is required");
                await svc.markAccepted(body.matchId, userId);
                return NextResponse.json({ ok: true });

            case "reject":
                if (!body.matchId) throw new Error("matchId is required");
                await svc.markRejected(body.matchId, userId);
                return NextResponse.json({ ok: true });

            case "suggest":
                if (!body.bUserId || body.score == null)
                    throw new Error("bUserId and score are required");
                const created = await svc.create({
                    aUserId: userId,
                    bUserId: body.bUserId,
                    topic: body.topic ?? "suggestion",
                    score: body.score,
                });
                return NextResponse.json({ ok: true, data: created }, { status: 201 });

            default:
                return NextResponse.json(
                    { ok: false, error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message ?? "Invalid input" },
            { status: 400 }
        );
    }
}