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
