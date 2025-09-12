import { MemorySubjectsCatalog } from "./memory";
import type { SubjectsCatalogStore } from "./types";

let store: SubjectsCatalogStore | null = null;

// Swap this to a Prisma-backed store later
export function getSubjectsCatalog(): SubjectsCatalogStore {
    if (!store) store = new MemorySubjectsCatalog();
    return store;
}
