import { MemorySubjectsStore } from "./memory";
import type { SubjectsStore } from "./types";

let store: SubjectsStore | null = null;

// Simple singleton accessor. Swap to Prisma-backed store later.
export function getSubjectsStore(): SubjectsStore {
    if (!store) store = new MemorySubjectsStore();
    return store;
}
