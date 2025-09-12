import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getSubjectsCatalog } from "@/lib/subjects-catalog";
import { makeSubjectsCatalogService } from "@/domain/subjects-catalog/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeSubjectsCatalogService(getSubjectsCatalog());

// PATCH /api/subjects/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json();
  try {
    const updated = await svc.update(id, raw);
    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    const code = msg.includes("not found") ? 404 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}

// DELETE /api/subjects/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await svc.remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    const code = msg.includes("not found") ? 404 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
