import { makeMatchService } from "@/domain/match/service";
import { getStore } from "@/lib/datastore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeMatchService(getStore());

type Params = { params: { userId: string } };

export async function GET(_req: NextRequest, { params }: Params) {
    const { userId } = params;
    const data = await svc.list({ userId, topic: "suggestion" });
    return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { userId } = params;
        const body = await req.json();
        const created = await svc.create({
            aUserId: userId,
            bUserId: body.bUserId,
            topic: body.topic ?? "suggestion",
            score: body.score,
        });
        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message ?? "Invalid input" },
            { status: 400 }
        );
    }
}
