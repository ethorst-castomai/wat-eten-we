import { NextResponse } from "next/server";
import { parseRecipeFromHtml, type ImportDraft } from "@/lib/import/parse";
import { fetchText, matchRecipeUrls, recipeUrlsForSource } from "@/lib/import/server";

/**
 * POST /api/discover  body: { sources: [{name,url}], queries: ["kip", "thaise"], exclude: [url], limit: 6 }
 * Zoekt per zoekwoord recepten bij de bronnen, haalt de beste kandidaten op en geeft ze volledig uitgelezen terug.
 * Zo kan de app iedere dag zelf nieuwe recepten tonen, zonder dat je naar een site hoeft.
 */
export const maxDuration = 60;

interface Body {
  sources?: { name: string; url: string }[];
  queries?: string[];
  exclude?: string[];
  limit?: number;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("time-out")), ms))]);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const sources = (body.sources ?? []).slice(0, 6);
  const queries = (body.queries ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 8);
  const exclude = new Set(body.exclude ?? []);
  const limit = Math.min(Math.max(body.limit ?? 6, 1), 10);
  if (sources.length === 0 || queries.length === 0) return NextResponse.json({ drafts: [] });

  // 1. Recept-URL's per bron (uit de cache als dat kan)
  const indexed = await Promise.all(
    sources.map(async (s) => {
      try {
        return { source: s, urls: await withTimeout(recipeUrlsForSource(s.url), 25_000) };
      } catch {
        return { source: s, urls: [] as string[] };
      }
    }),
  );

  // 2. Per zoekwoord om de beurt een kandidaat, zodat het aanbod gevarieerd is
  const candidates: { url: string; sourceName: string }[] = [];
  const taken = new Set<string>();
  for (let round = 0; round < 4 && candidates.length < limit * 2; round++) {
    for (const q of queries) {
      for (const { source, urls } of indexed) {
        const hits = matchRecipeUrls(urls, q, 12).filter((h) => !exclude.has(h.url) && !taken.has(h.url));
        const pick = hits[round];
        if (pick) {
          taken.add(pick.url);
          candidates.push({ url: pick.url, sourceName: source.name });
        }
      }
    }
  }

  // 3. Kandidaten ophalen en uitlezen tot er genoeg bruikbare recepten zijn
  const drafts: ImportDraft[] = [];
  for (let i = 0; i < candidates.length && drafts.length < limit; i += 4) {
    const batch = candidates.slice(i, i + 4);
    const results = await Promise.all(
      batch.map(async (c) => {
        try {
          const html = await fetchText(c.url, { timeoutMs: 8000, maxBytes: 3_000_000 });
          const d = parseRecipeFromHtml(html, c.url);
          return d && d.ingredients.length > 0 && d.steps.length > 0 ? { ...d, sourceName: c.sourceName } : null;
        } catch {
          return null;
        }
      }),
    );
    for (const d of results) if (d && drafts.length < limit) drafts.push(d);
  }
  return NextResponse.json({ drafts, searched: indexed.map((x) => ({ name: x.source.name, recipes: x.urls.length })) });
}
