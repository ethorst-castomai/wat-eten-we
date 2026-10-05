import type { Cuisine, Diet, Difficulty, FeedbackValue, Protein } from "./types";

export const CUISINE_LABEL: Record<string, string> = {
  italiaans: "Italiaans",
  spaans: "Spaans",
  chinees: "Chinees",
  thais: "Thais",
  internationaal: "Internationaal",
  japans: "Japans",
  indiaas: "Indiaas",
  grieks: "Grieks",
  mexicaans: "Mexicaans",
  frans: "Frans",
  koreaans: "Koreaans",
  vietnamees: "Vietnamees",
  indonesisch: "Indonesisch",
  "midden-oosters": "Midden-Oosters",
  marokkaans: "Marokkaans",
};

/** Keukens die je in het profiel kunt toevoegen, in deze volgorde getoond */
export const CUISINE_SUGGESTIONS = ["japans", "indiaas", "grieks", "mexicaans", "frans", "koreaans", "vietnamees", "indonesisch", "midden-oosters", "marokkaans"];

/** Leesbare naam voor een keuken, ook voor zelf toegevoegde keukens */
export function cuisineLabel(id: string): string {
  return CUISINE_LABEL[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/** Id voor een zelf getypte keuken: "Midden Oosters" wordt "midden-oosters" */
export function cuisineId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export const PROTEIN_LABEL: Record<Protein, string> = {
  kip: "Kip",
  rund: "Rund",
  vis: "Vis",
  vegetarisch: "Vegetarisch",
};

export const DIET_LABEL: Record<Diet, string> = {
  keto: "Keto",
  koolhydraatarm: "Koolhydraatarm",
  normaal: "Normaal",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  makkelijk: "Makkelijk",
  gemiddeld: "Gemiddeld",
  uitdagend: "Uitdagend",
};

export const FEEDBACK_LABEL: Record<FeedbackValue, string> = {
  "nog-een-keer": "Nog een keer",
  prima: "Was prima",
  "niet-meer": "Niet meer",
};
