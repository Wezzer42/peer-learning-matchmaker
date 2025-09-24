// src/lib/subjectstore/mapper.ts
import type { UserSubject } from "@prisma/client";
import type { Subject } from "@/domain/subject/types";

export function toSubjectDTO(row: UserSubject): Subject {
  return {
    id: row.id,
    userId: row.userId,                         // ← добавили
    label: row.label,
    level: row.level ?? undefined,              // null -> undefined
    createdAt: row.createdAt.toISOString(),     // Date -> string
  };
}

export const toSubjectDTOs = (rows: UserSubject[]): Subject[] =>
  rows.map(toSubjectDTO);
