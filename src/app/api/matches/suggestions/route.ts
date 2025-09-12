import { CreateMatchInput } from "@/domain/match/schemas";
import { makeMatchService } from "@/domain/match/service";
import { getStore } from "@/lib/datastore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeMatchService(getStore());

export async function GET(_req: NextRequest) {
    const data = await svc.list({ topic: "suggestion" });
    return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
    const raw = await req.json();
    const parsed = CreateMatchInput.safeParse(raw);

    if (!parsed.success) {
        const msg = parsed.error.issues
            .map(i => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; ");
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const created = await svc.create(parsed.data);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
