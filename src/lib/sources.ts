import type { RecipeSource } from "./types";

/** Bekende gratis receptensites als snelle suggestie in het profiel */
export const SOURCE_SUGGESTIONS: { name: string; url: string }[] = [
  { name: "Allerhande", url: "https://www.ah.nl/allerhande" },
  { name: "Jumbo recepten", url: "https://www.jumbo.com/recepten" },
  { name: "Leukerecepten", url: "https://www.leukerecepten.nl" },
  { name: "24Kitchen", url: "https://www.24kitchen.nl/recepten" },
  { name: "Lekker en Simpel", url: "https://www.lekkerensimpel.com" },
  { name: "Uit Pauline's Keuken", url: "https://www.uitpaulineskeuken.nl" },
  { name: "BBC Good Food", url: "https://www.bbcgoodfood.com" },
];

/** Maakt van "ah.nl/allerhande" een volledige URL, of geeft null als het geen geldige URL is */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Naam voorstellen op basis van het domein: "leukerecepten.nl" wordt "Leukerecepten" */
export function nameFromUrl(url: string): string {
  const base = sourceDomain(url).split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Zoeklink voor een bron. Gebruikt een Google-zoekopdracht binnen die site,
 * zodat het voor iedere receptensite werkt zonder hun eigen zoekpagina te kennen.
 */
export function sourceSearchUrl(source: RecipeSource, query: string): string {
  const u = new URL(source.url);
  const scope = `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`site:${scope} ${query} recept`)}`;
}
