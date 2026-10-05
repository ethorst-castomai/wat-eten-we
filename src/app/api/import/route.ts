import { NextResponse } from "next/server";
import { parseRecipeFromHtml } from "@/lib/import/parse";

/**
 * GET /api/import?url=https://...
 * Haalt een receptpagina op en leest de schema.org Recipe-gegevens uit.
 * Alleen publieke http(s)-adressen, maximaal 3 MB, 10 seconden time-out.
 */
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i;

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url") ?? "";
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return NextResponse.json({ error: "Dit is geen geldig webadres." }, { status: 400 });
  }
  const allowPrivate = process.env.IMPORT_ALLOW_PRIVATE === "1"; // alleen voor lokaal testen
  if (!/^https?:$/.test(url.protocol) || (!allowPrivate && PRIVATE_HOST.test(url.hostname))) {
    return NextResponse.json({ error: "Alleen openbare websites kunnen worden geïmporteerd." }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WatEtenWe/0.1; persoonlijke receptenimport)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return NextResponse.json({ error: `De website gaf foutcode ${res.status}.` }, { status: 502 });
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > 3_000_000) return NextResponse.json({ error: "Deze pagina is te groot om te importeren." }, { status: 413 });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "De website kon niet worden bereikt." }, { status: 502 });
  }

  const draft = parseRecipeFromHtml(html.slice(0, 3_000_000), url.toString());
  if (!draft || draft.ingredients.length === 0) {
    return NextResponse.json(
      { error: "Op deze pagina staan geen receptgegevens die de app kan lezen. Kopieer het recept en plak het als tekst." },
      { status: 422 },
    );
  }
  return NextResponse.json({ draft });
}
