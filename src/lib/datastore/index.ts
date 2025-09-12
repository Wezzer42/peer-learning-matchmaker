import { MemoryStore } from "./memory";
import type { DataStore } from "./types";

let store: DataStore;

export function getStore(): DataStore {
    if (!store) store = new MemoryStore();
    return store;
}