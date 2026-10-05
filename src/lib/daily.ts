import type { AppData, DailySelection, Recipe } from "./types";
import { allRecipes, getRecipe } from "@/data/recipes";
import { isoDate } from "./dates";
import { selectDailyRecipes } from "./selection";

/** Bestaande selectie voor vandaag, of een nieuwe op basis van profiel, feedback en historie. */
export function getOrCreateSelection(data: AppData, date: Date = new Date()): { selection: DailySelection; created: boolean } {
  const today = isoDate(date);
  const existing = data.selections.find((s) => s.date === today);
  if (existing && existing.recipeIds.every((id) => getRecipe(id))) return { selection: existing, created: false };
  const picked = selectDailyRecipes({
    recipes: allRecipes(),
    profile: data.profile,
    feedback: data.feedback,
    history: data.selections.filter((s) => s.date !== today),
    date,
    today,
  });
  return { selection: { date: today, recipeIds: picked.map((r) => r.id) }, created: true };
}

/** Nieuwe set van drie, zonder de huidige suggesties. */
export function regenerateSelection(data: AppData, current: DailySelection, date: Date = new Date()): DailySelection {
  const today = isoDate(date);
  const picked = selectDailyRecipes({
    recipes: allRecipes(),
    profile: data.profile,
    feedback: data.feedback,
    history: data.selections.filter((s) => s.date !== today),
    date,
    today,
    exclude: current.recipeIds,
    salt: Date.now(),
  });
  return { date: today, recipeIds: picked.map((r) => r.id) };
}

export function upsertSelection(list: DailySelection[], sel: DailySelection): DailySelection[] {
  // Bewaar maximaal 75 dagen (historie plus de geplande dagen)
  const others = list.filter((s) => s.date !== sel.date);
  return [...others, sel].sort((a, b) => a.date.localeCompare(b.date)).slice(-75);
}

export function selectionRecipes(sel: DailySelection): Recipe[] {
  return sel.recipeIds.map((id) => getRecipe(id)).filter((r): r is Recipe => Boolean(r));
}

/**
 * Zorg dat er voor iedere dag van de week (vanaf vandaag) een selectie bestaat.
 * Dagen worden op volgorde gemaakt, zodat iedere dag rekening houdt met de dagen ervoor.
 */
export function ensureWeek(data: AppData, weekStart: Date, now: Date = new Date()): AppData {
  const todayIso = isoDate(now);
  let next = data;
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const iso = isoDate(day);
    if (iso < todayIso) continue;
    const { selection, created } = getOrCreateSelection(next, day);
    if (created) next = { ...next, selections: upsertSelection(next.selections, selection) };
  }
  return next;
}
