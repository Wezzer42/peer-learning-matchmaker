import { makeSubjectsService } from "@/domain/subject/service";
import { getServerAuthSession } from "@/lib/auth";
import { getSubjectsStore } from "@/lib/subjectstore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeSubjectsService(getSubjectsStore());


// PATCH: update one subject by id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const raw = await req.json();
    try {
        const updated = await svc.update(session.user.id, id, raw);
        return NextResponse.json({ ok: true, data: updated });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid input";
        const code = msg.includes("not found") ? 404 : 400;
        return NextResponse.json({ ok: false, error: msg }, { status: code });
    }
}

// DELETE: remove one subject by id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    try {
        await svc.remove(session.user.id, id);
        return NextResponse.json({ ok: true });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid input";
        const code = msg.includes("not found") ? 404 : 400;
        return NextResponse.json({ ok: false, error: msg }, { status: code });
    }
}
