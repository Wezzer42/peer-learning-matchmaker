// src/lib/subjectstore/index.ts
import type { SubjectsStore } from "./types";
import { MemorySubjectsStore } from "./memory";
import { PrismaSubjectsStore } from "./prisma";

let store: SubjectsStore | null = null;
export function getSubjectsStore(): SubjectsStore {
  if (store) return store;
  const useMemory = process.env.NODE_ENV === "test" || process.env.USE_MEMORY_STORE === "1";
  store = useMemory ? new MemorySubjectsStore() : new PrismaSubjectsStore();
  return store;
}
