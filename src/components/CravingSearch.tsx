"use client";

import { useMemo, useState } from "react";
import { allRecipes } from "@/data/recipes";
import { findCravings } from "@/lib/craving";
import { useApp } from "./AppState";
import { RecipeRow } from "./RecipeRow";
import { SourceLinks } from "./SourceLinks";
import { Button } from "./ui";

const SUGGESTIONS = ["Pasta", "Iets met zalm", "Curry", "Snel en licht", "Salade", "Iets Aziatisch met kip", "Stoofpot"];

/** Invoerveld "Ik heb zin in": zoekt direct passende recepten en laat je er een kiezen voor vanavond */
export function CravingSearch() {
  const app = useApp();
  const [query, setQuery] = useState("");
  const q = query.trim();
  const results = useMemo(
    () => (q.length >= 2 ? findCravings(q, { recipes: allRecipes(), profile: app.data.profile, feedback: app.data.feedback }) : []),
    [q, app.data.profile, app.data.feedback, app.data.importedRecipes],
  );
  const chosenId = app.today?.chosenId;

  return (
    <section aria-label="Ik heb zin in" className="flex flex-col gap-3 rounded-3xl bg-saffron-soft p-4">
      <form
        role="search"
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label htmlFor="craving" className="font-display text-[19px] font-bold">
          Ik heb zin in
        </label>
        <div className="relative">
          <input
            id="craving"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="pasta, iets met zalm, snel en licht"
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4 pr-11 text-[16px] outline-none placeholder:text-muted focus:border-herb"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Zoekveld leegmaken"
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-lg text-muted hover:bg-surface-2 hover:text-ink"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {q.length < 2 ? (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-[13.5px] font-semibold text-ink/80 transition hover:border-herb hover:text-herb"
            >
              {s}
            </button>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-[14px]">
          Niets gevonden voor &ldquo;{q}&rdquo;. Probeer een ingrediënt, een keuken of iets als snel, licht of romig.
        </p>
      ) : (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-[13px] font-semibold text-muted">
            {results.length === 1 ? "1 gerecht past" : `${results.length} gerechten passen`} bij &ldquo;{q}&rdquo;
          </p>
          {results.map(({ recipe }) => {
            const isChosen = chosenId === recipe.id;
            return (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                highlight={isChosen}
                action={
                  <Button
                    variant={isChosen ? "active" : "secondary"}
                    className="min-h-10 shrink-0 px-3 text-[14px]"
                    aria-pressed={isChosen}
                    aria-label={isChosen ? `${recipe.name} staat op het menu voor vanavond` : `Kies ${recipe.name} voor vanavond`}
                    onClick={() => app.chooseForToday(recipe.id)}
                  >
                    {isChosen ? "Gekozen" : "Kies"}
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
      {q.length >= 2 && <SourceLinks query={q} />}
    </section>
  );
}
