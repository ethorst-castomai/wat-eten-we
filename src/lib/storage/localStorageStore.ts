import type { AppData } from "../types";
import { createDefaultData } from "../defaults";
import type { DataStore } from "./types";

const KEY = "wat-eten-we:v1";

export class LocalStorageStore implements DataStore {
  async load(): Promise<AppData> {
    const fallback = createDefaultData();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        ...fallback,
        ...parsed,
        profile: { ...fallback.profile, ...parsed.profile },
        shopping: { ...fallback.shopping, ...parsed.shopping },
        // Oudere versies bewaarden alleen een aantal personen
        diners: parsed.diners ?? fallback.diners,
        importedRecipes: parsed.importedRecipes ?? [],
      };
    } catch {
      return fallback;
    }
  }

  async save(data: AppData): Promise<void> {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Opslag niet beschikbaar (privévenster). De app blijft in het geheugen werken.
    }
  }
}
