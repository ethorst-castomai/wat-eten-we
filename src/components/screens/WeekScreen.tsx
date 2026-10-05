"use client";

import { useEffect, useState } from "react";
import { getRecipe } from "@/data/recipes";
import { addDays, dayName, isWeekend, isoDate, shortDate, startOfWeek } from "@/lib/dates";
import { cuisineLabel } from "@/lib/labels";
import { AppLink } from "@/lib/nav";
import type { Recipe } from "@/lib/types";
import { useApp } from "../AppState";
import { RecipeRow } from "../RecipeRow";
import { IconBasket, IconCheck, IconClock, IconRefresh } from "../Icons";
import { Button, DietChip } from "../ui";

export function WeekScreen() {
  const app = useApp();
  const [offset, setOffset] = useState<0 | 1>(0);
  const now = new Date();
  const todayIso = isoDate(now);
  const monday = addDays(startOfWeek(now), offset * 7);
  const mondayIso = isoDate(monday);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const { ensureWeek } = app;

  // Suggesties voor de rest van de week aanmaken (alleen ontbrekende dagen)
  useEffect(() => {
    ensureWeek(mondayIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mondayIso]);

  const planned = days
    .map((d) => app.selectionFor(isoDate(d)))
    .filter((s) => s?.chosenId && s.date >= todayIso)
    .map((s) => s!.chosenId!);
  const plannedCount = days.filter((d) => app.selectionFor(isoDate(d))?.chosenId).length;
  const allOnList = planned.length > 0 && planned.every((id) => app.isInShopping(id));
  const range = `${shortDate(days[0])} tot en met ${shortDate(days[6])}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Welke week" className="grid grid-cols-2 gap-1 self-start rounded-full border border-line bg-surface p-1">
          {([0, 1] as const).map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={offset === o}
              onClick={() => setOffset(o)}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold transition ${offset === o ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
            >
              {o === 0 ? "Deze week" : "Volgende week"}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[36px] font-extrabold leading-tight">Weekmenu</h1>
          <p className="tabular text-muted">
            {range}. {plannedCount} van de 7 avonden gepland.
          </p>
        </div>
        <ol className="grid grid-cols-7 gap-1.5" aria-label="Planning per dag">
          {days.map((d) => {
            const iso = isoDate(d);
            const sel = app.selectionFor(iso);
            const done = Boolean(sel?.chosenId);
            const isToday = iso === todayIso;
            return (
              <li key={iso} className="flex flex-col items-center gap-1">
                <span className={`text-[11px] font-semibold uppercase ${isToday ? "text-herb" : "text-muted"}`}>{dayName(d).slice(0, 2)}</span>
                <a
                  href={`#dag-${iso}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`dag-${iso}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  aria-label={`${dayName(d)} ${shortDate(d)}${done ? ", gepland" : ""}`}
                  className={`tabular grid h-10 w-10 place-items-center rounded-full text-[14px] font-bold transition ${
                    done ? "bg-herb text-herb-ink" : isToday ? "ring-2 ring-herb text-ink" : "bg-surface-2 text-muted"
                  }`}
                >
                  {done ? <IconCheck width={16} height={16} /> : d.getDate()}
                </a>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="flex flex-col gap-4">
        {days.map((d) => (
          <DayCard key={isoDate(d)} date={d} todayIso={todayIso} />
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-3xl bg-herb-soft p-5">
        <h2 className="text-xl font-bold">Boodschappen voor de week</h2>
        <p className="text-[15px]">
          {planned.length === 0
            ? "Kies per dag een gerecht. Daarna zet je alle geplande gerechten in een keer op de boodschappenlijst."
            : `${planned.length} ${planned.length === 1 ? "gerecht staat" : "gerechten staan"} vanaf vandaag gepland. Dezelfde ingrediënten worden op de lijst bij elkaar opgeteld.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => app.addManyToShopping(planned)} disabled={planned.length === 0 || allOnList}>
            <IconBasket width={18} height={18} /> {allOnList ? "Alles staat op je lijst" : "Zet op de boodschappenlijst"}
          </Button>
          {allOnList && (
            <AppLink href="/boodschappen" className="inline-flex min-h-11 items-center px-2 font-semibold text-herb underline underline-offset-4">
              Bekijk lijst
            </AppLink>
          )}
        </div>
      </section>
    </div>
  );
}

function DayCard({ date, todayIso }: { date: Date; todayIso: string }) {
  const app = useApp();
  const iso = isoDate(date);
  const sel = app.selectionFor(iso);
  const past = iso < todayIso;
  const isToday = iso === todayIso;
  const weekend = isWeekend(date);
  const chosen = sel?.chosenId ? getRecipe(sel.chosenId) : undefined;
  const suggested = (sel?.recipeIds ?? []).map((id) => getRecipe(id)).filter((r): r is Recipe => Boolean(r));
  // Alle drie de opties blijven zichtbaar. Een gekozen gerecht van buiten de suggesties komt er bovenaan bij.
  const options = chosen && !suggested.some((r) => r.id === chosen.id) ? [chosen, ...suggested] : suggested;

  return (
    <section id={`dag-${iso}`} className={`scroll-mt-6 rounded-3xl bg-surface p-4 shadow-card ${past ? "opacity-70" : ""}`} aria-label={`${dayName(date)} ${shortDate(date)}`}>
      <header className="flex items-center justify-between gap-3 px-1">
        <h2 className="flex items-baseline gap-2 text-lg font-bold capitalize">
          {dayName(date)}
          <span className="tabular font-sans text-[14px] font-medium normal-case text-muted">{shortDate(date)}</span>
        </h2>
        <span className="flex items-center gap-1.5">
          {isToday && <span className="rounded-full bg-herb px-2.5 py-1 text-[12px] font-semibold text-herb-ink">Vandaag</span>}
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold text-muted">{weekend ? "Weekend" : "Doordeweeks"}</span>
        </span>
      </header>

      {past && !chosen && <p className="mt-2 px-1 text-[14px] text-muted">Geen gerecht gekozen.</p>}

      {(!past || chosen) && (
        <div className="mt-3 flex flex-col gap-2">
          {options.length === 0 && <div className="h-20 animate-pulse rounded-2xl bg-surface-2" />}
          {options
            .filter((r) => !past || r.id === chosen?.id)
            .map((r) => {
              const isChosen = chosen?.id === r.id;
              return (
                <RecipeRow
                  key={r.id}
                  recipe={r}
                  highlight={isChosen}
                  action={
                    past ? undefined : (
                      <Button
                        variant={isChosen ? "active" : "secondary"}
                        className="min-h-10 shrink-0 px-3 text-[14px]"
                        aria-pressed={isChosen}
                        aria-label={isChosen ? `${r.name} is gekozen, tik om de keuze weg te halen` : `Kies ${r.name}`}
                        onClick={() => app.chooseForDate(iso, r.id)}
                      >
                        {isChosen ? "Gekozen" : "Kies"}
                      </Button>
                    )
                  }
                />
              );
            })}
          {!past && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
              {chosen ? (
                <p className="min-h-10 py-2.5 text-[13px] text-muted">Tik op een ander gerecht om te wisselen, of op Gekozen om de keuze weg te halen.</p>
              ) : (
                options.length > 0 && (
                  <button
                    type="button"
                    onClick={() => app.refreshDate(iso)}
                    className="inline-flex min-h-10 items-center gap-1 text-[14px] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    <IconRefresh width={16} height={16} /> Andere suggesties
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
