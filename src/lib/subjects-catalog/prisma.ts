import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { PublicSubject, SubjectsCatalogStore } from "./types";

export type CatalogInput = { label: string; level?: number };

export class PrismaSubjectsCatalog implements SubjectsCatalogStore {
  async list(params?: { q?: string }): Promise<PublicSubject[]> {
    const query = params?.q?.trim();
    const where: Prisma.PublicSubjectWhereInput | undefined =
      query && query.length > 0
        ? { label: { contains: query.toLowerCase() } }
        : undefined;

    const rows = await prisma.publicSubject.findMany({
      where,
      orderBy: { label: "asc" },
      take: 200,
    });

    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      level: r.level ?? undefined,
      createdAt: r.createdAt.toISOString(),
      createdBy: r.createdById ?? undefined,
    }));
  }
 

  async add(data: Omit<PublicSubject, "id" | "createdAt">): Promise<PublicSubject> {
    const created = await prisma.publicSubject.create({
      data: {
        label: data.label,
        level: data.level,
        createdById: data.createdBy ?? null,
      },
    });
    return {
      id: created.id,
      label: created.label,
      level: created.level ?? undefined,
      createdAt: created.createdAt.toISOString(),
      createdBy: created.createdById ?? undefined,
    };
  }

  async update(id: string, patch: Partial<Omit<PublicSubject, "id" | "createdAt">>): Promise<PublicSubject | null> {
    const exists = await prisma.publicSubject.findUnique({ where: { id } });
    if (!exists) return null;
    const updated = await prisma.publicSubject.update({
      where: { id },
      data: {
        ...("label" in patch ? { label: patch.label! } : {}),
        ...("level" in patch ? { level: patch.level ?? null } : {}),
        ...("createdBy" in patch ? { createdById: patch.createdBy ?? null } : {}),
      },
    });
    return {
      id: updated.id,
      label: updated.label,
      level: updated.level ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      createdBy: updated.createdById ?? undefined,
    };
  }

  async remove(id: string): Promise<boolean> {
    const exists = await prisma.publicSubject.findUnique({ where: { id } });
    if (!exists) return false;
    await prisma.publicSubject.delete({ where: { id } });
    return true;
  }

  // Optional: bulk replace (used by admin tooling)
  async setAll(items: Array<{ label: string; level?: number }>, createdBy?: string): Promise<PublicSubject[]> {
    const rows = await prisma.$transaction(async (tx) => {
      for (const it of items) {
        await tx.publicSubject.upsert({
          where: { label: it.label },
          create: { label: it.label, level: it.level, createdById: createdBy ?? null },
          update: { level: it.level ?? null },
        });
      }
      return tx.publicSubject.findMany({ orderBy: { label: "asc" } });
    });
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      level: r.level ?? undefined,
      createdAt: r.createdAt.toISOString(),
      createdBy: r.createdById ?? undefined,
    }));
  }
}
