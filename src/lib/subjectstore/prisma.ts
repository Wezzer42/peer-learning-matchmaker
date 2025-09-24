// src/lib/subjectstore/prisma.ts
import { prisma } from "@/lib/prisma";
import { toSubjectDTO, toSubjectDTOs } from "./mapper";
import type { Subject } from "@/domain/subject/types";

export type SubjectInput = { label: string; level?: number };
const norm = (s: string) => s.trim().toLowerCase();

export class PrismaSubjectsStore {
  
  async list(userId: string): Promise<Subject[]> {
    const rows = await prisma.userSubject.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { label: "asc" }],
    });
    return toSubjectDTOs(rows);
  }

  async add(userId: string, input: SubjectInput): Promise<Subject> {
    const label = norm(input.label);
    const row = await prisma.userSubject.upsert({
      where: { userId_label: { userId, label } },
      create: { userId, label, level: input.level ?? null },
      update: { level: input.level ?? null },
    });
    // sync to catalog
    await prisma.publicSubject.upsert({
      where: { label: row.label },
      create: { label: row.label, level: row.level ?? null, createdById: userId },
      update: { level: row.level ?? null },
    });
    return toSubjectDTO(row);
  }

  async update(userId: string, id: string, patch: Partial<SubjectInput>): Promise<Subject> {
    const found = await prisma.userSubject.findFirst({ where: { id, userId } });
    if (!found) throw new Error("Subject not found");
    const row = await prisma.userSubject.update({
      where: { id },
      data: {
        ...(patch.label !== undefined ? { label: norm(patch.label) } : {}),
        ...(patch.level !== undefined ? { level: patch.level ?? null } : {}),
      },
    });
    return toSubjectDTO(row);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const found = await prisma.userSubject.findFirst({ where: { id, userId } });
    if (!found) {
      throw new Error("Subject not found");
      return false;
    };
    await prisma.userSubject.delete({ where: { id } });
    return true;
  }

  async setAll(userId: string, items: SubjectInput[]): Promise<Subject[]> {
    return prisma.$transaction(async (tx) => {
      const normalized = items.map(i => ({ ...i, label: norm(i.label) }));
      const incoming = new Set(normalized.map(i => i.label));
  
      const existing = await tx.userSubject.findMany({ where: { userId } });
      const toDelete = existing.filter(s => !incoming.has(s.label));
      if (toDelete.length) {
        await tx.userSubject.deleteMany({ where: { id: { in: toDelete.map(s => s.id) } } });
      }
  
      for (const it of normalized) {
        const up = await tx.userSubject.upsert({
          where: { userId_label: { userId, label: it.label } },
          create: { userId, label: it.label, level: it.level ?? null },
          // preserve existing level if not provided
          update: { ...(it.level !== undefined ? { level: it.level ?? null } : {}) },
        });
        // sync to catalog inside same tx
        await tx.publicSubject.upsert({
          where: { label: up.label },
          create: { label: up.label, level: up.level ?? null, createdById: userId },
          update: { level: up.level ?? null },
        });
      }
  
      return (await tx.userSubject.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }, { label: "asc" }],
      })).map(toSubjectDTO);
    });
  }
}
