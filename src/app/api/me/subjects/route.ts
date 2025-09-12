import { makeSubjectsService } from "@/domain/subject/service";
import { getServerAuthSession } from "@/lib/auth";
import { getSubjectsStore } from "@/lib/subjectstore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeSubjectsService(getSubjectsStore());

// GET: list current user's subjects
export async function GET(_req: NextRequest) {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const data = await svc.list(session.user.id);
    return NextResponse.json({ ok: true, data });
}

// POST: add one subject
export async function POST(req: NextRequest) {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const raw = await req.json();
    try {
        const created = await svc.add(session.user.id, raw);
        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid input";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}

// PUT: replace all subjects (bulk upsert-like, but replace)
export async function PUT(req: NextRequest) {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const raw = await req.json();
    try {
        const next = await svc.setAll(session.user.id, raw);
        return NextResponse.json({ ok: true, data: next });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid input";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
