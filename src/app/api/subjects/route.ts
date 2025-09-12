import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getSubjectsCatalog } from "@/lib/subjects-catalog";
import { makeSubjectsCatalogService } from "@/domain/subjects-catalog/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const svc = makeSubjectsCatalogService(getSubjectsCatalog());

// GET /api/subjects?q=react
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  const data = await svc.list(q);
  return NextResponse.json({ ok: true, data });
}

// POST /api/subjects
export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  try {
    const created = await svc.add(raw, session.user.id);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

// PUT /api/subjects (bulk replace)
export async function PUT(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();
  try {
    const next = await svc.setAll(raw, session.user.id);
    return NextResponse.json({ ok: true, data: next });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
