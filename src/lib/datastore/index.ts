// Factory that returns a DataStore (Prisma in normal env, Memory in tests)
import type { DataStore } from "@/domain/match/types";
import { PrismaMatchStore } from "./prisma";
import { MemoryMatchStore } from "./memory";

let _store: DataStore | null = null;

export function getStore(): DataStore {
  if (_store) return _store;
  const useMemory = process.env.NODE_ENV === "test" || process.env.USE_MEMORY_STORE === "1";
  _store = useMemory ? new MemoryMatchStore() : new PrismaMatchStore();
  return _store;
}
