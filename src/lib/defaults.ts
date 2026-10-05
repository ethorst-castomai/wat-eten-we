import type { AppData, Diners, EatingStyle, Member, Profile, Recipe } from "./types";

export const defaultProfile: Profile = {
  householdName: "Ter Horst",
  members: [
    { name: "Erwin", likesSpicy: true, eats: "alles" },
    { name: "Dorien", likesSpicy: true, eats: "alles" },
    { name: "Michelle", likesSpicy: false, eats: "alles" },
  ],
  proteins: { kip: true, rund: true, vis: true, vegetarisch: true },
  cuisines: { italiaans: true, spaans: true, chinees: true, thais: true, internationaal: true },
  customProteins: [],
  recipeSources: [],
  diet: { keto: true, koolhydraatarm: true },
  veggieRich: true,
  salads: true,
  avoidIngredients: ["varkensvlees", "spek", "ham", "chorizo", "lever", "nier", "orgaanvlees", "bloemkoolrijst"],
  favoriteIngredients: ["garnalen", "zalm", "broccoli", "paksoi", "knoflook"],
  maxTimeWeekday: 35,
  maxTimeWeekend: 90,
};

export function createDefaultData(): AppData {
  return {
    profile: defaultProfile,
    diners: defaultDiners(defaultProfile),
    favorites: [],
    feedback: [],
    selections: [],
    shopping: { recipes: [], checked: {} },
    importedRecipes: [],
  };
}

export function defaultDiners(profile: Profile): Diners {
  return { present: profile.members.map((m) => m.name), guests: 0, vegetarianGuests: 0 };
}

/** Aantal personen aan tafel: aanwezige gezinsleden plus gasten (minimaal 1) */
export function countPersons(data: Pick<AppData, "diners" | "profile">): number {
  const present = data.profile.members.filter((m) => data.diners.present.includes(m.name)).length;
  return Math.max(1, present + data.diners.guests);
}

export const EATS_LABEL: Record<EatingStyle, string> = {
  alles: "Vlees en vis",
  vlees: "Alleen vlees",
  vis: "Alleen vis",
  vegetarisch: "Vegetarisch",
};

/** Eetstijl van een gezinslid, met ondersteuning voor het oude veld vegetarian */
export function memberEats(m: Member): EatingStyle {
  return m.eats ?? (m.vegetarian ? "vegetarisch" : "alles");
}

/** Moet iemand met deze eetstijl bij dit recept de vegetarische vervanger krijgen? */
export function needsSubstitute(eats: EatingStyle, recipe: Pick<Recipe, "protein">): boolean {
  if (recipe.protein === "vegetarisch") return false;
  if (eats === "vegetarisch") return true;
  if (eats === "vis") return recipe.protein === "kip" || recipe.protein === "rund";
  if (eats === "vlees") return recipe.protein === "vis";
  return false;
}

export function presentMembers(data: Pick<AppData, "diners" | "profile">): Member[] {
  return data.profile.members.filter((m) => data.diners.present.includes(m.name));
}

/**
 * Aantal personen aan tafel dat bij dit recept de vegetarische vervanger eet:
 * gezinsleden die dit vlees of deze vis niet eten, plus vegetarische gasten.
 */
export function countVegetarians(data: Pick<AppData, "diners" | "profile">, recipe: Pick<Recipe, "protein">): number {
  if (recipe.protein === "vegetarisch") return 0;
  const members = presentMembers(data).filter((m) => needsSubstitute(memberEats(m), recipe)).length;
  return Math.min(countPersons(data), members + Math.min(data.diners.guests, data.diners.vegetarianGuests));
}

/** Korte samenvatting van bijzondere eetwensen aan tafel, bijvoorbeeld "1 vegetarisch, 1 eet geen vis" */
export function describeDietNeeds(data: Pick<AppData, "diners" | "profile">): string {
  const counts = { vegetarisch: 0, vis: 0, vlees: 0 };
  for (const m of presentMembers(data)) {
    const e = memberEats(m);
    if (e !== "alles") counts[e]++;
  }
  counts.vegetarisch += Math.min(data.diners.guests, data.diners.vegetarianGuests);
  const parts: string[] = [];
  if (counts.vegetarisch) parts.push(`${counts.vegetarisch} vegetarisch`);
  if (counts.vis) parts.push(`${counts.vis} eet geen vlees`);
  if (counts.vlees) parts.push(`${counts.vlees} eet geen vis`);
  return parts.join(", ");
}

/** Korte omschrijving, bijvoorbeeld "Erwin, Dorien en 2 gasten" */
export function describeDiners(data: Pick<AppData, "diners" | "profile">): string {
  const names = data.profile.members.filter((m) => data.diners.present.includes(m.name)).map((m) => m.name);
  const parts = [...names];
  if (data.diners.guests > 0) parts.push(`${data.diners.guests} ${data.diners.guests === 1 ? "gast" : "gasten"}`);
  if (parts.length === 0) return "Niemand geselecteerd";
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} en ${parts[parts.length - 1]}`;
}
