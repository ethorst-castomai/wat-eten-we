"use client";

import { useApp } from "../AppState";
import { RecipeCard } from "../RecipeCard";
import { CravingSearch } from "../CravingSearch";
import { Button, DinersPicker } from "../ui";
import { IconRefresh } from "../Icons";
import { selectionRecipes } from "@/lib/daily";
import { daysBetween, formatDutchDate, isWeekend, isoDate } from "@/lib/dates";
import { getRecipe } from "@/data/recipes";
import { AppLink } from "@/lib/nav";
import { FEEDBACK_LABEL } from "@/lib/labels";
import type { FeedbackValue } from "@/lib/types";

export function TodayScreen() {
  const { data, today, persons, refreshToday, feedbackFor, setFeedback } = useApp();
  const now = new Date();
  const weekend = isWeekend(now);
  const options = today ? selectionRecipes(today) : [];
  const chosen = today?.chosenId ? getRecipe(today.chosenId) : undefined;
  const maxTime = weekend ? data.profile.maxTimeWeekend : data.profile.maxTimeWeekday;

  // Vraag om feedback op het laatst gekozen gerecht van de afgelopen dagen
  const todayIso = isoDate(now);
  const pending = [...data.selections]
    .reverse()
    .find((s) => s.chosenId && s.date < todayIso && daysBetween(s.date, todayIso) <= 3);
  const pendingRecipe = pending?.chosenId ? getRecipe(pending.chosenId) : undefined;
  const pendingFeedback = pendingRecipe ? feedbackFor(pendingRecipe.id) : undefined;
  const askFeedback = pendingRecipe && !pendingFeedback;

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
          {formatDutchDate(now)}, {weekend ? "weekend" : "doordeweeks"}
        </p>
        <div className="flex flex-col gap-2">
          <h1 className="text-[40px] font-extrabold leading-[1.02] sm:text-[52px]">Wat eten we vandaag?</h1>
          <p className="max-w-xl text-[16px] text-muted">
            {weekend
              ? `Het is weekend, dus er is tijd voor sauzen, marinades en een bijgerecht. Maximaal ${maxTime} minuten.`
              : `Een gewone werkdag, dus snel en eenvoudig. Maximaal ${maxTime} minuten in de keuken.`}
          </p>
        </div>
        <CravingSearch />
        <DinersPicker />
      </header>

      {askFeedback && pendingRecipe && (
        <section className="flex flex-col gap-3 rounded-3xl bg-saffron-soft p-5" aria-label="Beoordeel je laatste gerecht">
          <p className="text-[15px]">
            Hoe was <strong>{pendingRecipe.name}</strong>? Je antwoord bepaalt of het gerecht terugkomt.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["nog-een-keer", "prima", "niet-meer"] as FeedbackValue[]).map((v) => (
              <Button key={v} variant="secondary" onClick={() => setFeedback(pendingRecipe.id, v)}>
                {FEEDBACK_LABEL[v]}
              </Button>
            ))}
          </div>
        </section>
      )}

      {chosen && (
        <AppLink
          href={`/recept/${chosen.id}`}
          className="flex items-center justify-between gap-4 rounded-3xl bg-herb px-5 py-4 text-herb-ink transition hover:brightness-110"
        >
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold uppercase tracking-[0.08em] opacity-80">Vanavond eten we</span>
            <span className="block truncate text-lg font-bold">{chosen.name}</span>
          </span>
          <span className="shrink-0 text-sm font-semibold underline underline-offset-4">Naar recept</span>
        </AppLink>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {options.map((r, i) => (
          <RecipeCard key={r.id} recipe={r} persons={persons} chosen={today?.chosenId === r.id} index={i} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <Button variant="ghost" onClick={refreshToday} disabled={Boolean(today?.chosenId)}>
          <IconRefresh width={18} height={18} /> Andere suggesties
        </Button>
        <p className="max-w-md text-[13px] text-muted">
          {today?.chosenId
            ? "Je hebt al gekozen voor vanavond. Haal je keuze weg op de receptpagina als je toch iets anders wilt."
            : "Suggesties van de afgelopen zeven dagen komen niet terug. Gerechten met “Niet meer” zie je nooit meer."}
        </p>
      </div>
    </div>
  );
}
