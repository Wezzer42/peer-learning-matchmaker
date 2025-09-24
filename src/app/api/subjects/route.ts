import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getSubjectsCatalog } from "@/lib/subjects-catalog";
import { makeSubjectsCatalogService } from "@/domain/subjects-catalog/service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const norm = (s: string) => s.trim().toLowerCase();

const svc = makeSubjectsCatalogService(getSubjectsCatalog());

// GET /api/subjects?q=react
export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("q");
  const q = raw && raw.trim().length > 0 ? norm(raw) : undefined;

  // 1) primary: catalog
  const where = q ? { label: { contains: q } } : undefined; // без mode для sqlite
  const cat = await prisma.publicSubject.findMany({
    where,
    orderBy: { label: "asc" },
    take: 200,
  });
  if (cat.length > 0) {
    return NextResponse.json({ ok: true, data: cat });
  }

  // 2) fallback: distinct labels из userSubject
  const userDistinct = await prisma.userSubject.findMany({
    distinct: ["label"],
    where: q ? { label: { contains: q } } : undefined,
    select: { label: true },
    orderBy: { label: "asc" },
    take: 200,
  });
  const fallback = userDistinct.map((r) => ({ id: r.label, label: r.label, level: null, createdAt: new Date() }));
  return NextResponse.json({ ok: true, data: fallback });
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
