import type { ImportDraft } from "./parse";

export class ImportError extends Error {
  /** true als de server-route ontbreekt, bijvoorbeeld in de losse preview */
  constructor(message: string, public unavailable = false) {
    super(message);
  }
}

/** Vraagt de server om een receptpagina op te halen en uit te lezen */
export async function fetchRecipeDraft(url: string): Promise<ImportDraft> {
  let res: Response;
  try {
    res = await fetch(`/api/import?url=${encodeURIComponent(url)}`);
  } catch {
    throw new ImportError("Ophalen via internet werkt in deze versie van de app niet.", true);
  }
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new ImportError("Ophalen via internet werkt in deze versie van de app niet.", true);
  }
  const body = (await res.json()) as { draft?: ImportDraft; error?: string };
  if (!res.ok || !body.draft) throw new ImportError(body.error ?? "Importeren is niet gelukt.");
  return body.draft;
}

export interface SourceSearchResult {
  source: { name: string; url: string };
  hits: { url: string; title: string }[];
  indexed: number;
  error?: string;
}

/** Zoekt recepten bij de receptbronnen via de server. Gooit ImportError(unavailable) als er geen server is. */
export async function searchSources(query: string, sources: { name: string; url: string }[], signal?: AbortSignal): Promise<SourceSearchResult[]> {
  let res: Response;
  try {
    res = await fetch("/api/source-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, sources }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ImportError("Zoeken op je bronnen werkt in deze versie van de app niet.", true);
  }
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) {
    throw new ImportError("Zoeken op je bronnen werkt in deze versie van de app niet.", true);
  }
  const body = (await res.json()) as { results?: SourceSearchResult[] };
  return body.results ?? [];
}

/** Laat de server zelf recepten ontdekken bij de bronnen, volledig uitgelezen */
export async function discoverRecipes(params: { sources: { name: string; url: string }[]; queries: string[]; exclude: string[]; limit?: number }): Promise<ImportDraft[]> {
  let res: Response;
  try {
    res = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
  } catch {
    throw new ImportError("Recepten ontdekken werkt in deze versie van de app niet.", true);
  }
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) {
    throw new ImportError("Recepten ontdekken werkt in deze versie van de app niet.", true);
  }
  const body = (await res.json()) as { drafts?: ImportDraft[] };
  return body.drafts ?? [];
}
