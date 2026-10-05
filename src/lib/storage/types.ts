import type { AppData } from "../types";

/**
 * Opslaginterface. De app praat alleen met deze interface.
 * Nu: LocalStorageStore. Later: SupabaseStore met dezelfde methodes
 * (bijvoorbeeld tabellen profiles, favorites, feedback, selections, shopping_items).
 */
export interface DataStore {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}
