import { NextResponse } from "next/server";
import { matchRecipeUrls, recipeUrlsForSource } from "@/lib/import/server";

/**
 * POST /api/source-search  body: { query: "pasta zalm", sources: [{ name, url }] }
 * Zoekt per receptbron in de sitemaps naar recepten waarvan de naam bij de zoekvraag past.
 * De eerste zoekopdracht per bron duurt langer, daarna staan de URL's 12 uur in de cache.
 */
export const maxDuration = 30;

interface Body {
  query?: string;
  sources?: { name: string; url: string }[];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const query = (body.query ?? "").trim().slice(0, 100);
  const sources = (body.sources ?? []).slice(0, 6);
  if (query.length < 2 || sources.length === 0) return NextResponse.json({ results: [] });

  const results = await Promise.all(
    sources.map(async (s) => {
      try {
        const urls = await Promise.race([
          recipeUrlsForSource(s.url),
          new Promise<string[]>((_, rej) => setTimeout(() => rej(new Error("time-out")), 20_000)),
        ]);
        return { source: s, hits: matchRecipeUrls(urls, query), indexed: urls.length };
      } catch (e) {
        return { source: s, hits: [], indexed: 0, error: (e as Error).message };
      }
    }),
  );
  return NextResponse.json({ results });
}
