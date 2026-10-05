"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, DailySelection, FeedbackValue, Profile, ShoppingRecipe } from "@/lib/types";
import { createStore } from "@/lib/storage";
import { createDefaultData } from "@/lib/defaults";
import { ensureWeek, getOrCreateSelection, regenerateSelection, upsertSelection } from "@/lib/daily";
import { isoDate, parseIso } from "@/lib/dates";
import { countPersons, countVegetarians } from "@/lib/defaults";
import { getRecipe, setImportedRecipes } from "@/data/recipes";
import type { Member, Recipe } from "@/lib/types";
import { latestFeedback } from "@/lib/selection";

interface AppState {
  ready: boolean;
  data: AppData;
  today: DailySelection | null;
  /** Aantal personen aan tafel (gezinsleden plus gasten) */
  persons: number;
  /** Aantal personen dat bij dit recept de vegetarische vervanger eet */
  substitutesFor(recipe: Pick<Recipe, "protein">): number;
  updateMember(name: string, patch: Partial<Member>): void;
  addMember(name: string): boolean;
  removeMember(name: string): void;
  toggleDiner(name: string): void;
  setGuests(n: number): void;
  setVegetarianGuests(n: number): void;
  toggleFavorite(id: string): void;
  isFavorite(id: string): boolean;
  setFeedback(id: string, value: FeedbackValue): void;
  feedbackFor(id: string): FeedbackValue | undefined;
  chooseForToday(id: string): void;
  refreshToday(): void;
  /** Selectie voor een specifieke datum (YYYY-MM-DD) */
  selectionFor(iso: string): DailySelection | undefined;
  chooseForDate(iso: string, id: string): void;
  refreshDate(iso: string): void;
  /** Maak selecties aan voor de week die op deze maandag begint */
  ensureWeek(weekStartIso: string): void;
  /** Zet meerdere recepten in een keer op de boodschappenlijst */
  addManyToShopping(ids: string[]): void;
  addToShopping(entry: Omit<ShoppingRecipe, "persons"> & { persons?: number }): void;
  removeFromShopping(id: string): void;
  isInShopping(id: string): boolean;
  toggleChecked(key: string): void;
  clearChecked(): void;
  clearShopping(): void;
  updateProfile(patch: Partial<Profile>): void;
  replaceData(data: AppData): void;
  /** Geïmporteerd recept opslaan (nieuw of bijwerken) */
  saveImportedRecipe(recipe: Recipe): void;
  removeImportedRecipe(id: string): void;
  resetAll(): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createStore(), []);
  const [data, setData] = useState<AppData>(() => createDefaultData());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // Laden bij start, en meteen de selectie van vandaag aanmaken
  useEffect(() => {
    let cancelled = false;
    store.load().then((d) => {
      if (cancelled) return;
      setImportedRecipes(d.importedRecipes);
      const { selection, created } = getOrCreateSelection(d);
      const next = created ? { ...d, selections: upsertSelection(d.selections, selection) } : d;
      loaded.current = true;
      setData(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Opslaan bij iedere wijziging
  useEffect(() => {
    if (loaded.current) void store.save(data);
  }, [data, store]);

  // Geïmporteerde recepten beschikbaar maken voor getRecipe en de selectie
  setImportedRecipes(data.importedRecipes);

  const todayIso = isoDate();
  const today = data.selections.find((s) => s.date === todayIso) ?? null;

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const feedbackMap = useMemo(() => latestFeedback(data.feedback), [data.feedback]);

  const value: AppState = {
    ready,
    data,
    today,
    persons: countPersons(data),
    substitutesFor: (recipe) => countVegetarians(data, recipe),
    updateMember: (name, patch) =>
      update((d) => {
        const newName = patch.name?.trim();
        if (newName !== undefined && (!newName || d.profile.members.some((m) => m.name === newName && m.name !== name))) return d;
        const members = d.profile.members.map((m) => (m.name === name ? { ...m, ...patch, vegetarian: undefined } : m));
        const present = newName ? d.diners.present.map((n) => (n === name ? newName : n)) : d.diners.present;
        return { ...d, profile: { ...d.profile, members }, diners: { ...d.diners, present } };
      }),
    addMember: (name) => {
      const clean = name.trim();
      if (!clean || data.profile.members.some((m) => m.name.toLowerCase() === clean.toLowerCase())) return false;
      update((d) => ({
        ...d,
        profile: { ...d.profile, members: [...d.profile.members, { name: clean, likesSpicy: false, eats: "alles" }] },
        diners: { ...d.diners, present: [...d.diners.present, clean] },
      }));
      return true;
    },
    removeMember: (name) =>
      update((d) => ({
        ...d,
        profile: { ...d.profile, members: d.profile.members.filter((m) => m.name !== name) },
        diners: { ...d.diners, present: d.diners.present.filter((n) => n !== name) },
      })),
    toggleDiner: (name) =>
      update((d) => {
        const present = d.diners.present.includes(name) ? d.diners.present.filter((n) => n !== name) : [...d.diners.present, name];
        return { ...d, diners: { ...d.diners, present } };
      }),
    setGuests: (n) =>
      update((d) => {
        const guests = Math.max(0, Math.min(12, n));
        return { ...d, diners: { ...d.diners, guests, vegetarianGuests: Math.min(d.diners.vegetarianGuests, guests) } };
      }),
    setVegetarianGuests: (n) => update((d) => ({ ...d, diners: { ...d.diners, vegetarianGuests: Math.max(0, Math.min(d.diners.guests, n)) } })),
    toggleFavorite: (id) =>
      update((d) => ({
        ...d,
        favorites: d.favorites.includes(id) ? d.favorites.filter((f) => f !== id) : [id, ...d.favorites],
      })),
    isFavorite: (id) => data.favorites.includes(id),
    setFeedback: (id, v) =>
      update((d) => ({
        ...d,
        feedback: [...d.feedback.filter((f) => f.recipeId !== id), { recipeId: id, value: v, date: isoDate() }],
      })),
    feedbackFor: (id) => feedbackMap.get(id)?.value,
    chooseForToday: (id) => value.chooseForDate(isoDate(), id),
    refreshToday: () => value.refreshDate(isoDate()),
    selectionFor: (iso) => data.selections.find((s) => s.date === iso),
    chooseForDate: (iso, id) =>
      update((d) => {
        const { selection } = getOrCreateSelection(d, parseIso(iso));
        const chosenId = selection.chosenId === id ? undefined : id;
        return { ...d, selections: upsertSelection(d.selections, { ...selection, chosenId }) };
      }),
    refreshDate: (iso) =>
      update((d) => {
        const date = parseIso(iso);
        const { selection } = getOrCreateSelection(d, date);
        const next = regenerateSelection(d, selection, date);
        if (next.recipeIds.length < 3) return d;
        return { ...d, selections: upsertSelection(d.selections, next) };
      }),
    ensureWeek: (weekStartIso) =>
      update((d) => {
        const next = ensureWeek(d, parseIso(weekStartIso));
        return next.selections.length === d.selections.length && next.selections.every((s, i) => s === d.selections[i]) ? d : next;
      }),
    addManyToShopping: (ids) =>
      update((d) => {
        const unique = [...new Set(ids)];
        const persons = countPersons(d);
        const others = d.shopping.recipes.filter((r) => !unique.includes(r.recipeId));
        const added = unique.map((recipeId) => {
          const r = getRecipe(recipeId);
          return { recipeId, persons, includeSpicy: true, lowCarb: false, vegetarians: r ? countVegetarians(d, r) : 0 };
        });
        return { ...d, shopping: { ...d.shopping, recipes: [...others, ...added] } };
      }),
    addToShopping: (entry) =>
      update((d) => {
        const r = getRecipe(entry.recipeId);
        const full: ShoppingRecipe = { persons: countPersons(d), vegetarians: r ? countVegetarians(d, r) : 0, ...entry };
        const others = d.shopping.recipes.filter((r) => r.recipeId !== entry.recipeId);
        return { ...d, shopping: { ...d.shopping, recipes: [...others, full] } };
      }),
    removeFromShopping: (id) =>
      update((d) => ({ ...d, shopping: { ...d.shopping, recipes: d.shopping.recipes.filter((r) => r.recipeId !== id) } })),
    isInShopping: (id) => data.shopping.recipes.some((r) => r.recipeId === id),
    toggleChecked: (key) =>
      update((d) => ({ ...d, shopping: { ...d.shopping, checked: { ...d.shopping.checked, [key]: !d.shopping.checked[key] } } })),
    clearChecked: () => update((d) => ({ ...d, shopping: { ...d.shopping, checked: {} } })),
    clearShopping: () => update((d) => ({ ...d, shopping: { recipes: [], checked: {} } })),
    updateProfile: (patch) =>
      update((d) => {
        const profile = { ...d.profile, ...patch };
        // Nog niets gekozen? Dan de suggesties van vandaag opnieuw berekenen met het nieuwe profiel.
        // Vandaag en toekomstige dagen zonder keuze worden opnieuw berekend
        const t = isoDate();
        const kept = d.selections.filter((s) => s.date < t || s.chosenId);
        let next: AppData = { ...d, profile, selections: kept };
        if (!kept.some((s) => s.date === t)) {
          const { selection } = getOrCreateSelection(next);
          next = { ...next, selections: upsertSelection(next.selections, selection) };
        }
        return next;
      }),
    replaceData: (next) => setData(next),
    saveImportedRecipe: (recipe) =>
      update((d) => {
        const list = d.importedRecipes.filter((r) => r.id !== recipe.id);
        const next = [...list, recipe];
        setImportedRecipes(next);
        return { ...d, importedRecipes: next };
      }),
    removeImportedRecipe: (id) =>
      update((d) => {
        const next = d.importedRecipes.filter((r) => r.id !== id);
        setImportedRecipes(next);
        return {
          ...d,
          importedRecipes: next,
          favorites: d.favorites.filter((f) => f !== id),
          shopping: { ...d.shopping, recipes: d.shopping.recipes.filter((r) => r.recipeId !== id) },
          selections: d.selections.map((s) => ({
            ...s,
            recipeIds: s.recipeIds.filter((r) => r !== id),
            chosenId: s.chosenId === id ? undefined : s.chosenId,
          })),
        };
      }),
    resetAll: () => {
      const fresh = createDefaultData();
      const { selection } = getOrCreateSelection(fresh);
      setData({ ...fresh, selections: [selection] });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp moet binnen AppStateProvider gebruikt worden");
  return ctx;
}
