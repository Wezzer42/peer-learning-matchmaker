// src/domain/subject/types.ts
export type Subject = {
  id: string;
  userId: string;        // keep required
  label: string;
  level?: number;        // undefined, не null
  createdAt: string;     // ISO-строка
};
