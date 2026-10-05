import { LocalStorageStore } from "./localStorageStore";
import type { DataStore } from "./types";

export type { DataStore };

/** Wissel hier later naar new SupabaseStore(client, householdId). */
export function createStore(): DataStore {
  return new LocalStorageStore();
}
