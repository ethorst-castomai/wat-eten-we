"use client";

import { useEffect, useRef, useState } from "react";
import { fetchRecipeDraft, ImportError, searchSources, type SourceSearchResult } from "@/lib/import/client";
import { quickRecipeFromDraft, setPendingDraft, type ImportDraft } from "@/lib/import/parse";
import { formatQuantity } from "@/lib/ingredients";
import { parseIngredientLine } from "@/lib/import/parse";
import { AppLink, useNavigate } from "@/lib/nav";
import { useApp } from "./AppState";
import { Button } from "./ui";
import { SourceLinks } from "./SourceLinks";

/**
 * Zoekt binnen de app op de receptbronnen uit het profiel.
 * Een gevonden recept bekijk je direct, en met één tik staat het tussen je recepten of op het menu.
 */
export function SourceSearch({ query }: { query: string }) {
  const { data } = useApp();
  const sources = (data.profile.recipeSources ?? []).filter((s) => s.enabled);
  const [state, setState] = useState<"idle" | "loading" | "done" | "unavailable" | "error">("idle");
  const [results, setResults] = useState<SourceSearchResult[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceKey = sources.map((s) => s.url).join("|");

  useEffect(() => {
    if (query.length < 3 || sources.length === 0) {
      setState("idle");
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    if (timer.current) clearTimeout(timer.current);
    // Even wachten tot je klaar bent met typen
    timer.current = setTimeout(async () => {
      setState("loading");
      try {
        const r = await searchSources(query, sources.map((s) => ({ name: s.name, url: s.url })), ctrl.signal);
        setResults(r);
        setState("done");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setState(e instanceof ImportError && e.unavailable ? "unavailable" : "error");
      }
    }, 700);
    return () => {
      ctrl.abort();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sourceKey]);

  if (sources.length === 0) return <SourceLinks query={query} />;
  if (query.length < 3) return null;

  const hits = results.flatMap((r) => r.hits.map((h) => ({ ...h, sourceName: r.source.name })));

  return (
    <div className="flex flex-col gap-2 border-t border-ink/10 pt-3">
      <p className="text-[13px] font-semibold text-muted">
        {state === "loading" && "Je receptbronnen doorzoeken… De eerste keer per site kan dat even duren."}
        {state === "done" && (hits.length > 0 ? `Van je receptbronnen: ${hits.length} ${hits.length === 1 ? "recept" : "recepten"}` : "Geen recepten gevonden op je bronnen.")}
        {state === "error" && "Zoeken op je bronnen lukte niet. Probeer het zo nog eens."}
      </p>
      {state === "unavailable" && (
        <>
          <p className="text-[13px] text-muted">Zoeken binnen de app op je bronnen werkt in de online versie. Hier kun je wel zelf op de sites zoeken.</p>
          <SourceLinks query={query} title="Zoek op de site" />
        </>
      )}
      {state === "done" && hits.length > 0 && (
        <ul className="flex flex-col gap-2">
          {hits.map((h) => (
            <SourceHit key={h.url} url={h.url} title={h.title} sourceName={h.sourceName} />
          ))}
        </ul>
      )}
      {state === "done" && results.some((r) => r.error || r.indexed === 0) && (
        <p className="text-[12.5px] text-muted">
          Niet doorzocht: {results.filter((r) => r.error || r.indexed === 0).map((r) => r.source.name).join(", ")}. Die site deelt geen receptenlijst. Gebruik daar
          de link en Recept importeren.
        </p>
      )}
    </div>
  );
}

function SourceHit({ url, title, sourceName }: { url: string; title: string; sourceName: string }) {
  const app = useApp();
  const navigate = useNavigate();
  const existing = app.data.importedRecipes.find((r) => r.source?.url === url);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const chosen = existing && app.today?.chosenId === existing.id;

  const load = async () => {
    setOpen((o) => !o);
    if (draft || loading) return;
    setLoading(true);
    try {
      // De naam uit je profiel is herkenbaarder dan de naam die de site zelf opgeeft
      setDraft({ ...(await fetchRecipeDraft(url)), sourceName });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const save = (chooseTonight: boolean) => {
    if (!draft) return;
    const recipe = quickRecipeFromDraft(draft, existing?.id);
    app.saveImportedRecipe(recipe);
    if (chooseTonight) app.chooseForToday(recipe.id);
    return recipe;
  };

  return (
    <li className="overflow-hidden rounded-2xl bg-bg">
      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{draft?.title ?? title}</p>
          <p className="text-[12.5px] text-muted">
            {sourceName}
            {existing ? ", staat bij je recepten" : ""}
          </p>
        </div>
        <Button variant={open ? "active" : "secondary"} className="min-h-10 shrink-0 px-3 text-[14px]" aria-expanded={open} onClick={load}>
          {open ? "Sluiten" : "Bekijken"}
        </Button>
      </div>
      {open && (
        <div className="flex flex-col gap-3 border-t border-line p-3">
          {loading && <p className="text-[14px] text-muted">Recept ophalen…</p>}
          {error && (
            <p className="text-[14px] text-chili">
              {error}{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                Open de pagina ↗
              </a>
            </p>
          )}
          {draft && (
            <>
              {draft.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="" referrerPolicy="no-referrer" className="aspect-[16/10] w-full rounded-xl object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
              <p className="tabular text-[13px] text-muted">
                {[draft.totalMinutes ? `${draft.totalMinutes} min` : "", draft.servings ? `${draft.servings} personen` : "", draft.kcal ? `± ${Math.round(draft.kcal)} kcal p.p.` : ""]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {draft.description && <p className="text-[14px] leading-relaxed">{draft.description}</p>}
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">Ingrediënten</p>
                <ul className="mt-1 divide-y divide-line">
                  {draft.ingredients.map((line, i) => {
                    const p = parseIngredientLine(line);
                    return (
                      <li key={i} className="tabular flex gap-3 py-1.5 text-[14px]">
                        <span className="w-20 shrink-0 font-semibold">{formatQuantity(p.amount, p.unit) || "naar smaak"}</span>
                        <span className="min-w-0">{p.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <details>
                <summary className="cursor-pointer text-[14px] font-semibold">Bereiding ({draft.steps.length} stappen)</summary>
                <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-relaxed">
                  {draft.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </details>
              <div className="flex flex-wrap gap-2">
                <Button variant={chosen ? "active" : "primary"} onClick={() => save(true)} disabled={Boolean(chosen)}>{chosen ? "Staat op het menu" : "Kies voor vanavond"}</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const r = save(false);
                    if (r) navigate(`/recept/${r.id}`);
                  }}
                >
                  Bewaar en open
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPendingDraft(draft);
                    navigate("/importeren");
                  }}
                >
                  Eerst aanpassen
                </Button>
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-2 text-[14px] font-semibold text-muted hover:text-ink">
                  Origineel ↗
                </a>
              </div>
              {existing && (
                <p className="text-[13px] text-muted">
                  Dit recept staat al bij je recepten.{" "}
                  <AppLink href={`/recept/${existing.id}`} className="font-semibold text-herb underline">
                    Open het
                  </AppLink>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
