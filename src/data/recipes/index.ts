import type { Recipe } from "@/lib/types";
import { recipesWeekdayA } from "./weekday-a";
import { recipesWeekdayB } from "./weekday-b";
import { recipesWeekend } from "./weekend";
import { recipesExtraA } from "./extra-a";
import { recipesExtraB } from "./extra-b";
import { vegetarianOptions } from "../vegetarian";

/** Alle mockrecepten. Later te vervangen door een Supabase-query. */
export const recipes: Recipe[] = [...recipesWeekdayA, ...recipesWeekdayB, ...recipesWeekend, ...recipesExtraA, ...recipesExtraB].map((r) =>
  r.protein !== "vegetarisch" && vegetarianOptions[r.id] ? { ...r, vegetarian: vegetarianOptions[r.id] } : r,
);

const byId = new Map(recipes.map((r) => [r.id, r]));

/** Geïmporteerde recepten van de gebruiker. AppState houdt deze lijst bij. */
let imported: Recipe[] = [];
let importedById = new Map<string, Recipe>();

export function setImportedRecipes(list: Recipe[]): void {
  if (list === imported) return;
  imported = list;
  importedById = new Map(list.map((r) => [r.id, r]));
}

/** Vaste recepten plus geïmporteerde recepten */
export function allRecipes(): Recipe[] {
  return imported.length ? [...recipes, ...imported] : recipes;
}

export function getRecipe(id: string): Recipe | undefined {
  return byId.get(id) ?? importedById.get(id);
}

/** Aantal recepten per keuken */
export function recipeCountByCuisine(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of allRecipes()) out[r.cuisine] = (out[r.cuisine] ?? 0) + 1;
  return out;
}
