import { KCAL_PER_UNIT } from "@/data/nutrition";
import type { Ingredient, IngredientCategory, Recipe, ShoppingItem, ShoppingRecipe, Unit } from "./types";

/** Schaal een hoeveelheid naar het gewenste aantal personen en rond logisch af. */
export function scaleAmount(amount: number | undefined, unit: Unit, factor: number): number | undefined {
  if (amount === undefined) return undefined;
  const v = amount * factor;
  switch (unit) {
    case "g":
    case "ml":
      if (v >= 100) return Math.round(v / 10) * 10;
      if (v >= 20) return Math.round(v / 5) * 5;
      return Math.max(1, Math.round(v));
    case "st":
    case "teen":
    case "blik":
    case "bos":
      return Math.max(0.5, Math.round(v * 2) / 2);
    default:
      return Math.max(0.25, Math.round(v * 4) / 4);
  }
}

export function scaleIngredient(ing: Ingredient, baseServings: number, persons: number): Ingredient {
  return { ...ing, amount: scaleAmount(ing.amount, ing.unit, persons / baseServings) };
}

function formatNumber(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;
  const fracStr = Math.abs(frac - 0.5) < 0.01 ? "½" : Math.abs(frac - 0.25) < 0.01 ? "¼" : Math.abs(frac - 0.75) < 0.01 ? "¾" : "";
  if (fracStr) return whole === 0 ? fracStr : `${whole}${fracStr}`;
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

const UNIT_LABEL: Record<Unit, [string, string]> = {
  g: ["g", "g"],
  ml: ["ml", "ml"],
  st: ["", ""],
  el: ["el", "el"],
  tl: ["tl", "tl"],
  teen: ["teen", "tenen"],
  bos: ["bos", "bossen"],
  blik: ["blik", "blikken"],
  snuf: ["snuf", "snufjes"],
  "naar smaak": ["", ""],
};

/** "300 g", "2 tenen", "½" of "" bij naar smaak */
export function formatQuantity(amount: number | undefined, unit: Unit): string {
  if (amount === undefined || unit === "naar smaak") return "";
  const [single, plural] = UNIT_LABEL[unit];
  const label = amount > 1 ? plural : single;
  const num = formatNumber(amount);
  if (!label) return num;
  return unit === "g" || unit === "ml" ? `${num} ${label}` : `${num} ${label}`;
}

export function formatIngredient(ing: Ingredient): string {
  const q = formatQuantity(ing.amount, ing.unit);
  const tail = ing.unit === "naar smaak" ? " (naar smaak)" : "";
  return `${q ? q + " " : ""}${ing.name}${tail}`;
}

/** Bevat het recept rijst, aardappel, pasta of noedels? */
export function hasCarbSide(r: Recipe): boolean {
  return Boolean(r.carbAlternative);
}

export interface IngredientOptions {
  persons: number;
  /** Aantal personen dat vegetarisch eet. Vlees of vis wordt dan apart bereid voor de rest. */
  vegetarians?: number;
  lowCarb?: boolean;
  includeSpicy?: boolean;
  /** Afronden op logische hoeveelheden. Uit voor de boodschappenlijst, die rondt na het optellen af. */
  round?: boolean;
}

export type IngredientGroupKind = "basis" | "vlees" | "vegetarisch" | "pittig";

export interface IngredientGroup {
  kind: IngredientGroupKind;
  /** Voor hoeveel personen deze groep is */
  count: number;
  items: Ingredient[];
}

/** Effectief aantal vegetariërs, begrensd op het aantal personen en alleen als het recept een variant heeft */
export function effectiveVegetarians(r: Recipe, persons: number, vegetarians = 0): number {
  if (!r.vegetarian) return 0;
  return Math.max(0, Math.min(persons, vegetarians));
}

/** Voeg dubbele regels (zelfde naam en eenheid) samen, bijvoorbeeld sojasaus uit recept en vervanging */
function mergeDuplicates(list: Ingredient[]): Ingredient[] {
  const out: Ingredient[] = [];
  for (const i of list) {
    const same = out.find((o) => o.name.toLowerCase() === i.name.toLowerCase() && o.unit === i.unit);
    if (same) {
      if (i.amount !== undefined) same.amount = (same.amount ?? 0) + i.amount;
    } else out.push({ ...i });
  }
  return out;
}

function scaleList(list: Ingredient[], baseServings: number, count: number, round: boolean): Ingredient[] {
  const factor = count / baseServings;
  return mergeDuplicates(list).map((i) => ({
    ...i,
    amount: i.amount === undefined ? undefined : round ? scaleAmount(i.amount, i.unit, factor) : i.amount * factor,
  }));
}

/**
 * Ingrediënten van een recept, opgesplitst in groepen:
 * de basis voor iedereen, het vlees of de vis apart voor de vleeseters,
 * de vegetarische eiwitbron en eventueel de pittige extra's.
 */
export function recipeIngredientGroups(r: Recipe, opts: IngredientOptions): IngredientGroup[] {
  const { persons, lowCarb, includeSpicy, round = true } = opts;
  const veg = effectiveVegetarians(r, persons, opts.vegetarians);
  const meatEaters = persons - veg;
  const lower = (names: string[]) => new Set(names.map((n) => n.toLowerCase()));

  let base = [...r.ingredients];
  if (lowCarb && r.carbAlternative) {
    const drop = lower(r.carbAlternative.replaces);
    base = base.filter((i) => !drop.has(i.name.toLowerCase()));
    base.push(...r.carbAlternative.extras);
  }

  const groups: IngredientGroup[] = [];
  if (veg > 0 && r.vegetarian) {
    const v = r.vegetarian;
    const meatNames = lower(v.meat);
    const baseDrop = lower(v.baseReplaces);
    const meat = r.ingredients.filter((i) => meatNames.has(i.name.toLowerCase()));
    base = base.filter((i) => !meatNames.has(i.name.toLowerCase()) && !baseDrop.has(i.name.toLowerCase()));
    base.push(...v.baseExtras);
    groups.push({ kind: "basis", count: persons, items: scaleList(base, r.baseServings, persons, round) });
    if (meatEaters > 0) groups.push({ kind: "vlees", count: meatEaters, items: scaleList(meat, r.baseServings, meatEaters, round) });
    groups.push({ kind: "vegetarisch", count: veg, items: scaleList(v.protein, r.baseServings, veg, round) });
  } else {
    groups.push({ kind: "basis", count: persons, items: scaleList(base, r.baseServings, persons, round) });
  }
  if (includeSpicy && r.spicy.extras.length) {
    groups.push({ kind: "pittig", count: persons, items: scaleList(r.spicy.extras, r.baseServings, persons, round) });
  }
  return groups;
}

/** Alle ingrediënten in één lijst, geschaald */
export function recipeIngredients(r: Recipe, opts: IngredientOptions): Ingredient[] {
  return recipeIngredientGroups(r, opts).flatMap((g) => g.items);
}

export const CATEGORY_ORDER: IngredientCategory[] = ["groente", "vlees", "zuivel", "kruiden", "overig"];

export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  groente: "Groente en fruit",
  vlees: "Vlees en vis",
  zuivel: "Zuivel",
  kruiden: "Kruiden en sauzen",
  overig: "Overig",
};

/** Eenheden die bij elkaar opgeteld kunnen worden onder dezelfde naam */
function itemKey(name: string, unit: Unit): string {
  return `${name.toLowerCase().trim()}|${unit}`;
}

/**
 * Bouw de boodschappenlijst uit de toegevoegde recepten.
 * Dezelfde ingrediënten met dezelfde eenheid worden samengevoegd en opgeteld.
 */
export function buildShoppingList(entries: ShoppingRecipe[], getRecipe: (id: string) => Recipe | undefined): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  for (const entry of entries) {
    const r = getRecipe(entry.recipeId);
    if (!r) continue;
    const list = recipeIngredients(r, {
      persons: entry.persons,
      vegetarians: entry.vegetarians,
      lowCarb: entry.lowCarb,
      includeSpicy: entry.includeSpicy,
      round: false,
    });
    for (const ing of list) {
      const key = itemKey(ing.name, ing.unit);
      const existing = map.get(key);
      if (existing) {
        if (ing.amount !== undefined) existing.amount = (existing.amount ?? 0) + ing.amount;
        if (!existing.recipeIds.includes(r.id)) existing.recipeIds.push(r.id);
      } else {
        map.set(key, { key, name: ing.name, amount: ing.amount, unit: ing.unit, category: ing.category, recipeIds: [r.id] });
      }
    }
  }
  return [...map.values()]
    .map((i) => ({ ...i, amount: scaleAmount(i.amount, i.unit, 1) }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function groupByCategory(items: ShoppingItem[]): { category: IngredientCategory; label: string; items: ShoppingItem[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);
}

/* ---------- Calorieën ---------- */


/** Bij frituren neemt het gerecht maar een klein deel van de olie op (ongeveer 15 procent) */
const FRYING_ABSORPTION = 0.15;

function kcalOf(list: Ingredient[]): number {
  return list.reduce((sum, i) => {
    if (i.amount === undefined) return sum;
    const factor = /frituren/i.test(i.note ?? "") ? FRYING_ABSORPTION : 1;
    return sum + (KCAL_PER_UNIT[`${i.name}|${i.unit}`] ?? 0) * i.amount * factor;
  }, 0);
}

export interface CalorieInfo {
  /** kcal per persoon voor wie vlees of vis eet, of null als dat niet te schatten is */
  standard: number | null;
  /** kcal per persoon voor de vegetarische versie, als het recept die heeft */
  vegetarian?: number;
}

/** Afronden op tientallen, want het is een schatting */
const round10 = (n: number) => Math.round(n / 10) * 10;

/** Aandeel van de ingrediënten met hoeveelheid waarvan de calorieën bekend zijn */
function kcalCoverage(list: Ingredient[]): number {
  const counted = list.filter((i) => i.amount !== undefined);
  if (counted.length === 0) return 0;
  return counted.filter((i) => KCAL_PER_UNIT[`${i.name}|${i.unit}`] !== undefined).length / counted.length;
}

/**
 * Schatting van de energie per persoon op basis van de ingrediënten (NEVO/USDA-waarden).
 * Pittige extra's en "naar smaak" tellen niet mee. Geïmporteerde recepten gebruiken
 * de voedingswaarde van de bronsite, of een schatting als genoeg ingrediënten bekend zijn.
 */
export function caloriesPerPortion(r: Recipe, opts: { lowCarb?: boolean } = {}): CalorieInfo {
  if (r.kcalPerPortion) return { standard: round10(r.kcalPerPortion) };
  if (r.imported && kcalCoverage(r.ingredients) < 0.75) return { standard: null };
  let base = [...r.ingredients];
  if (opts.lowCarb && r.carbAlternative) {
    const drop = new Set(r.carbAlternative.replaces.map((n) => n.toLowerCase()));
    base = base.filter((i) => !drop.has(i.name.toLowerCase()));
    base.push(...r.carbAlternative.extras);
  }
  const total = kcalOf(base);
  const info: CalorieInfo = { standard: round10(total / r.baseServings) };
  if (r.vegetarian) {
    const meatNames = new Set(r.vegetarian.meat.map((n) => n.toLowerCase()));
    const baseDrop = new Set(r.vegetarian.baseReplaces.map((n) => n.toLowerCase()));
    const meat = kcalOf(base.filter((i) => meatNames.has(i.name.toLowerCase())));
    const dropped = kcalOf(base.filter((i) => baseDrop.has(i.name.toLowerCase())));
    const vegTotal = total - meat - dropped + kcalOf(r.vegetarian.baseExtras) + kcalOf(r.vegetarian.protein);
    info.vegetarian = round10(vegTotal / r.baseServings);
  }
  return info;
}

/** "± 540 kcal" of "" als onbekend */
export function kcalLabel(r: Recipe): string {
  const k = caloriesPerPortion(r).standard;
  return k === null ? "" : `± ${k} kcal`;
}
