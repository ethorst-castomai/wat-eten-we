"use client";

import { useEffect, useRef, useState } from "react";
import { discoverRecipes, ImportError } from "@/lib/import/client";
import { discoverQueries } from "@/lib/import/discoverQueries";
import { guessProtein, parseIngredientLine, quickRecipeFromDraft, type ImportDraft } from "@/lib/import/parse";
import { isoDate, isWeekend } from "@/lib/dates";
import { violatesAvoidList } from "@/lib/selection";
import { AppLink } from "@/lib/nav";
import { useApp } from "./AppState";
import { SourceHit } from "./SourceSearch";
import { Button } from "./ui";
import { IconRefresh } from "./Icons";

/**
 * "Nieuw van je bronnen": de app haalt iedere dag zelf recepten op bij de receptbronnen uit het profiel.
 * Titel, ingrediënten, bereiding, foto en voedingswaarde komen van de bronsite en staan volledig in de app.
 */
export function DiscoverSection() {
  const app = useApp();
  const { profile, importedRecipes, discovered } = app.data;
  const sources = (profile.recipeSources ?? []).filter((s) => s.enabled);
  const today = isoDate();
  const [state, setState] = useState<"idle" | "loading" | "unavailable" | "error">("idle");
  const started = useRef<string>("");
  const sourceKey = sources.map((s) => s.url).join("|");

  const load = async (salt: string, exclude: string[]) => {
    setState("loading");
    try {
      const drafts = await discoverRecipes({
        sources: sources.map((s) => ({ name: s.name, url: s.url })),
        queries: discoverQueries(profile, `${today}:${salt}`),
        exclude,
        limit: 6,
      });
      app.setDiscovered({ date: today, drafts });
      setState("idle");
    } catch (e) {
      setState(e instanceof ImportError && e.unavailable ? "unavailable" : "error");
    }
  };

  // Eén keer per dag automatisch ophalen
  useEffect(() => {
    if (sources.length === 0) return;
    if (discovered?.date === today && discovered.drafts.length > 0) return;
    const key = `${today}|${sourceKey}`;
    if (started.current === key) return;
    started.current = key;
    void load("auto", importedRecipes.map((r) => r.source?.url ?? "").filter(Boolean));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, sourceKey]);

  if (sources.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-3xl border border-dashed border-line p-5">
        <h2 className="text-xl font-bold">Nieuw van je bronnen</h2>
        <p className="text-[14px] text-muted">
          Laat de app iedere dag zelf nieuwe recepten ophalen van sites als Allerhande of Leukerecepten. Ze komen compleet in de app, met ingrediënten, bereiding
          en foto.
        </p>
        <AppLink href="/profiel" className="self-start font-semibold text-herb underline underline-offset-4">
          Receptbronnen toevoegen
        </AppLink>
      </section>
    );
  }
  if (state === "unavailable") return null;

  const weekend = isWeekend(new Date());
  const maxTime = (weekend ? profile.maxTimeWeekend : profile.maxTimeWeekday) + 15;
  const importedUrls = new Set(importedRecipes.map((r) => r.source?.url));
  const fits = (d: ImportDraft) => {
    const r = quickRecipeFromDraft(d);
    if (violatesAvoidList(r, profile.avoidIngredients)) return false;
    if (!profile.proteins[guessProtein(d.ingredients.map(parseIngredientLine))]) return false;
    if (d.totalMinutes && d.totalMinutes > maxTime) return false;
    return true;
  };
  const drafts = (discovered?.date === today ? discovered.drafts : []).filter(fits).slice(0, 4);
  const shownUrls = (discovered?.drafts ?? []).map((d) => d.sourceUrl ?? "");

  return (
    <section className="flex flex-col gap-3" aria-labelledby="ontdekt">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="ontdekt" className="text-[24px] font-extrabold leading-tight">
            Nieuw van je bronnen
          </h2>
          <p className="text-[14px] text-muted">Vandaag opgehaald van {sources.map((s) => s.name).join(", ")}. Alles staat in de app.</p>
        </div>
        <Button
          variant="ghost"
          disabled={state === "loading"}
          onClick={() => load(String(Date.now()), [...shownUrls, ...[...importedUrls].filter((u): u is string => Boolean(u))])}
        >
          <IconRefresh width={18} height={18} /> Andere recepten
        </Button>
      </div>
      {state === "loading" && (
        <div className="flex flex-col gap-2" aria-busy="true">
          <p className="text-[13px] text-muted">Recepten ophalen. De eerste keer per site duurt dat even.</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      )}
      {state === "error" && <p className="text-[14px] text-chili">Ophalen lukte nu niet. Probeer het zo nog eens met Andere recepten.</p>}
      {state === "idle" && drafts.length === 0 && discovered?.date === today && (
        <p className="text-[14px] text-muted">Vandaag vond ik geen recepten die bij je profiel passen. Probeer Andere recepten.</p>
      )}
      {state !== "loading" && drafts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {drafts.map((d) => (
            <SourceHit key={d.sourceUrl} url={d.sourceUrl ?? ""} title={d.title} sourceName={d.sourceName ?? ""} initialDraft={d} />
          ))}
        </ul>
      )}
    </section>
  );
}
