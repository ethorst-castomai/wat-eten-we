import type { Recipe } from "../types";
import { buildShoppingList, caloriesPerPortion, effectiveVegetarians, formatIngredient, formatQuantity, groupByCategory, recipeIngredientGroups } from "../ingredients";
import { getRecipe } from "@/data/recipes";

function dietLine(r: Recipe): string {
  if (r.diet === "keto") return "Keto";
  if (r.diet === "koolhydraatarm") return "Koolhydraatarm";
  if (r.carbAlternative) return r.carbAlternative.carbsPerPortion <= 12 ? "Keto alternatief beschikbaar" : "Koolhydraatarm mogelijk";
  return "Normaal";
}

/** Het ochtendbericht in het afgesproken format */
export function buildDailyMessage(name: string, options: Recipe[], vegetariansFor: (r: Recipe) => number = () => 0): string {
  const lines = [`Goedemorgen ${name},`, "Dit zijn de drie opties voor vanavond:", ""];
  options.forEach((r, i) => {
    const k = caloriesPerPortion(r).standard;
    lines.push(`${i + 1}. ${r.name}`, `${r.prepTime} minuten${k !== null ? `, ± ${k} kcal p.p.` : ""}`, dietLine(r));
    if (vegetariansFor(r) > 0 && r.vegetarian) lines.push(`Vegetarisch met ${r.vegetarian.substitute.toLowerCase()}`);
  });
  lines.push("", "Kies 1, 2 of 3.");
  return lines.join("\n");
}

const GROUP_TITLE = {
  basis: "Ingrediënten",
  vlees: "Apart voor de vleeseters",
  vegetarisch: "Vegetarisch",
  pittig: "Maak het pittiger",
} as const;

/** Volledig recept als platte tekst, geschikt voor WhatsApp */
export function buildRecipeMessage(r: Recipe, persons: number, vegetarians = 0): string {
  const veg = effectiveVegetarians(r, persons, vegetarians);
  const groups = recipeIngredientGroups(r, { persons, vegetarians: veg });
  const kcal = caloriesPerPortion(r);
  const parts = [
    `*${r.name}*`,
    `${r.prepTime} minuten, ${persons} personen${veg > 0 ? `, waarvan ${veg} vegetarisch` : ""}`,
    kcal.standard !== null ? `± ${kcal.standard} kcal per persoon${veg > 0 && kcal.vegetarian !== undefined ? `, vegetarisch ± ${kcal.vegetarian} kcal` : ""}` : "",
  ].filter(Boolean);
  if (r.source?.url) parts.push(`Bron: ${r.source.name}, ${r.source.url}`);
  for (const g of groups) {
    const title = g.kind === "basis" ? GROUP_TITLE.basis : `${GROUP_TITLE[g.kind]} (${g.count} ${g.count === 1 ? "persoon" : "personen"})`;
    parts.push("", `*${title}*`, ...g.items.map((i) => `• ${formatIngredient(i)}`));
  }
  parts.push("", "*Bereiding*", ...r.steps.map((s, i) => `${i + 1}. ${s}`));
  if (veg > 0 && r.vegetarian) parts.push("", "*Vegetarische versie*", r.vegetarian.howTo);
  if (r.spicy.tip) parts.push("", "*Maak het pittiger*", r.spicy.tip);
  if (r.carbAlternative) {
    parts.push("", "*Alternatief voor rijst of aardappel*", `${r.carbAlternative.original}: ${r.carbAlternative.alternative}. ${r.carbAlternative.howTo}`);
  }
  return parts.join("\n");
}

export function buildShoppingMessage(r: Recipe, persons: number, vegetarians = 0): string {
  const items = buildShoppingList([{ recipeId: r.id, persons, vegetarians, includeSpicy: true, lowCarb: false }], getRecipe);
  const lines = ["*Boodschappenlijst*"];
  for (const group of groupByCategory(items)) {
    lines.push("", `_${group.label}_`);
    for (const i of group.items) {
      const q = formatQuantity(i.amount, i.unit);
      lines.push(`☐ ${q ? q + " " : ""}${i.name}`);
    }
  }
  return lines.join("\n");
}
