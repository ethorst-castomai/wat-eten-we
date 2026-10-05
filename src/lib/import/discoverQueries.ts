import type { Profile } from "../types";

const PROTEIN_WORDS: Record<string, string[]> = {
  kip: ["kip", "kipfilet", "kippendij"],
  rund: ["rundvlees", "biefstuk", "gehakt", "stoofvlees"],
  vis: ["zalm", "kabeljauw", "garnalen", "vis"],
  vegetarisch: ["vegetarisch", "vega"],
};

const CUISINE_WORDS: Record<string, string[]> = {
  italiaans: ["italiaanse", "pasta", "risotto"],
  spaans: ["spaanse", "tapas", "paella"],
  chinees: ["chinese", "wok", "roerbak"],
  thais: ["thaise", "curry"],
  japans: ["japanse", "teriyaki"],
  indiaas: ["indiase", "curry"],
  grieks: ["griekse", "souvlaki"],
  mexicaans: ["mexicaanse", "taco", "fajita"],
  internationaal: ["ovenschotel", "salade"],
};

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    return ((h ^= h >>> 12) >>> 0) / 4294967296;
  };
}

/**
 * Zoekwoorden voor het automatisch ontdekken van recepten, afgeleid van het profiel.
 * Iedere dag (en bij "Andere recepten") een andere mix, zodat het aanbod wisselt.
 */
export function discoverQueries(profile: Profile, seed: string, count = 8): string[] {
  const pool = new Set<string>();
  for (const [p, on] of Object.entries(profile.proteins)) if (on) PROTEIN_WORDS[p]?.forEach((w) => pool.add(w));
  for (const [c, on] of Object.entries(profile.cuisines)) if (on) CUISINE_WORDS[c]?.forEach((w) => pool.add(w));
  for (const c of profile.customProteins ?? []) if (c.enabled) pool.add(c.name);
  profile.favoriteIngredients.forEach((f) => pool.add(f));
  if (profile.salads) pool.add("salade");
  const list = [...pool];
  const rand = seeded(seed);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}
