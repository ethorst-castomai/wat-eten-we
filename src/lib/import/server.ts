import { gunzipSync } from "node:zlib";

/**
 * Serverhulp voor het zoeken en ophalen van recepten bij receptbronnen.
 * Alleen gebruiken in API-routes (Node.js), niet in de browser.
 */

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i;

export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Dit is geen geldig webadres.");
  }
  const allowPrivate = process.env.IMPORT_ALLOW_PRIVATE === "1"; // alleen voor lokaal testen
  if (!/^https?:$/.test(url.protocol) || (!allowPrivate && PRIVATE_HOST.test(url.hostname))) {
    throw new Error("Alleen openbare websites zijn toegestaan.");
  }
  return url;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; WatEtenWe/0.1; persoonlijke receptenapp)",
  "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
};

/** Haalt een pagina of sitemap op, met time-out en maximale grootte. Pakt .gz-sitemaps uit. */
export async function fetchText(url: string, { timeoutMs = 8000, maxBytes = 15_000_000 } = {}): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error("Te groot");
  const gz = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  return (gz ? gunzipSync(buf) : buf).toString("utf8");
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
}

const RECIPE_HINT = /recep|recip|gerecht|koken/i;

/** Cache van gevonden recept-URL's per bron, zodat we niet bij iedere zoekopdracht alle sitemaps ophalen */
const cache = new Map<string, { urls: string[]; at: number }>();
const CACHE_MS = 12 * 60 * 60 * 1000;

/**
 * Vindt de recept-URL's van een site via de sitemaps (robots.txt, sitemap.xml of sitemap_index.xml).
 * Bijna iedere receptensite publiceert die voor zoekmachines, en de URL bevat meestal de naam van het gerecht.
 */
export async function recipeUrlsForSource(sourceUrl: string): Promise<string[]> {
  const base = assertPublicUrl(sourceUrl);
  const key = base.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.urls;

  const origin = base.origin;
  const prefix = base.pathname.replace(/\/$/, "");
  let roots: string[] = [];
  try {
    const robots = await fetchText(`${origin}/robots.txt`, { timeoutMs: 5000 });
    roots = [...robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  } catch {
    /* geen robots.txt */
  }
  if (roots.length === 0) roots = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/wp-sitemap.xml`];

  const urls = new Set<string>();
  const queue = [...roots];
  const seen = new Set<string>();
  let fetched = 0;
  while (queue.length && fetched < 25 && urls.size < 60_000) {
    const sm = queue.shift()!;
    if (seen.has(sm)) continue;
    seen.add(sm);
    let xml: string;
    try {
      xml = await fetchText(sm);
      fetched++;
    } catch {
      continue;
    }
    const found = locs(xml);
    if (/<sitemapindex/i.test(xml)) {
      // Sitemaps met recepten in de naam eerst
      const children = found.sort((a, b) => Number(RECIPE_HINT.test(b)) - Number(RECIPE_HINT.test(a)));
      const recipeChildren = children.filter((c) => RECIPE_HINT.test(c));
      queue.push(...(recipeChildren.length > 0 ? recipeChildren : children.slice(0, 10)));
      continue;
    }
    const sitemapIsRecipes = RECIPE_HINT.test(sm);
    for (const u of found) {
      try {
        const p = new URL(u);
        if (p.host !== base.host && p.host !== `www.${base.host}` && `www.${p.host}` !== base.host) continue;
        if (prefix && !p.pathname.startsWith(prefix)) continue;
        if (!sitemapIsRecipes && !RECIPE_HINT.test(p.pathname)) continue;
        urls.add(p.toString());
      } catch {
        /* ongeldige url */
      }
    }
  }
  const list = [...urls];
  cache.set(key, { urls: list, at: Date.now() });
  return list;
}

const STOP = new Set("ik heb zin in iets wat een de het met en of voor van op die dat is wil we eten lekker recept recepten".split(" "));

/** Leesbare titel uit een URL: ".../recept/R-R1234/pasta-met-zalm-en-spinazie" wordt "Pasta met zalm en spinazie" */
export function titleFromUrl(u: string): string {
  const parts = new URL(u).pathname.split("/").filter(Boolean);
  const slug = [...parts].reverse().find((p) => /[a-z]{3,}-[a-z]/i.test(p)) ?? parts[parts.length - 1] ?? "";
  const words = decodeURIComponent(slug)
    .replace(/\.(html?|php)$/i, "")
    .split("-")
    .filter((w) => w && !/^\d+$/.test(w) && !/^r\d+$/i.test(w));
  const t = words.join(" ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export interface SourceSearchHit {
  url: string;
  title: string;
}

/** Zoekt in de recept-URL's van een bron naar de woorden uit de zoekvraag */
export function matchRecipeUrls(urls: string[], query: string, limit = 8): SourceSearchHit[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 5 ? t.replace(/(en|s)$/, "") : t));
  if (tokens.length === 0) return [];
  const scored = urls
    .map((u) => {
      const slug = titleFromUrl(u).toLowerCase();
      const matched = tokens.filter((t) => slug.includes(t)).length;
      return { u, slug, matched };
    })
    .filter((x) => x.matched > 0);
  const best = Math.max(0, ...scored.map((s) => s.matched));
  return scored
    .filter((s) => s.matched === best)
    .sort((a, b) => a.slug.length - b.slug.length)
    .slice(0, limit)
    .map((s) => ({ url: s.u, title: titleFromUrl(s.u) }));
}
