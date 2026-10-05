import { NextResponse } from "next/server";
import { parseRecipeFromHtml } from "@/lib/import/parse";
import { assertPublicUrl, fetchText } from "@/lib/import/server";

/**
 * GET /api/import?url=https://...
 * Haalt een receptpagina op en leest de schema.org Recipe-gegevens uit.
 * Alleen publieke http(s)-adressen, maximaal 3 MB, 10 seconden time-out.
 */
export async function GET(req: Request) {
  let url: URL;
  try {
    url = assertPublicUrl(new URL(req.url).searchParams.get("url") ?? "");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  let html: string;
  try {
    html = await fetchText(url.toString(), { timeoutMs: 10_000, maxBytes: 3_000_000 });
  } catch {
    return NextResponse.json({ error: "De website kon niet worden bereikt." }, { status: 502 });
  }

  const draft = parseRecipeFromHtml(html, url.toString());
  if (!draft || draft.ingredients.length === 0) {
    return NextResponse.json(
      { error: "Op deze pagina staan geen receptgegevens die de app kan lezen. Kopieer het recept en plak het als tekst." },
      { status: 422 },
    );
  }
  return NextResponse.json({ draft });
}
