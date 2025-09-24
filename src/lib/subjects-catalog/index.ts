import { PrismaSubjectsCatalog } from "./prisma";
import { MemorySubjectsCatalog } from "./memory";
import type { SubjectsCatalogStore } from "./types";

let _cat: SubjectsCatalogStore | null = null;
export function getSubjectsCatalog(): SubjectsCatalogStore {
  if (_cat) return _cat;
  const useMemory = process.env.NODE_ENV === "test" || process.env.USE_MEMORY_STORE === "1";
  _cat = useMemory ? new MemorySubjectsCatalog() : new PrismaSubjectsCatalog();
  return _cat;
}