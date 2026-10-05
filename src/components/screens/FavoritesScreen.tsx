"use client";

import { getRecipe } from "@/data/recipes";
import { AppLink } from "@/lib/nav";
import type { Recipe } from "@/lib/types";
import { useApp } from "../AppState";
import { RecipeCard } from "../RecipeCard";
import { RecipeRow } from "../RecipeRow";
import { Button, EmptyState } from "../ui";
import { IconPlus } from "../Icons";

export function FavoritesScreen() {
  const app = useApp();
  const { data, persons } = app;
  const favorites = data.favorites.map((id) => getRecipe(id)).filter((r): r is Recipe => Boolean(r));
  const own = [...data.importedRecipes].reverse();
  const todayChosen = app.today?.chosenId;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[36px] font-extrabold leading-tight">Favorieten</h1>
        {favorites.length > 0 && (
          <p className="tabular text-muted">
            {favorites.length} {favorites.length === 1 ? "gerecht" : "gerechten"} die jullie graag eten.
          </p>
        )}
      </header>
      {favorites.length === 0 ? (
        <EmptyState
          title="Nog geen favorieten"
          text="Tik op het hartje bij een recept om het hier te bewaren. Zo vind je jullie lievelingsgerechten snel terug."
          action={
            <AppLink href="/" className="font-semibold text-herb underline underline-offset-4">
              Bekijk de recepten van vandaag
            </AppLink>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} persons={persons} index={i} compact />
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="eigen-recepten">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="eigen-recepten" className="text-[26px] font-extrabold leading-tight">
              Eigen recepten
            </h2>
            <p className="text-[14px] text-muted">
              {own.length === 0
                ? "Recepten die je van een website importeert of zelf invult."
                : `${own.length} ${own.length === 1 ? "recept" : "recepten"}. Ze doen mee in de dagelijkse suggesties.`}
            </p>
          </div>
          <AppLink
            href="/importeren"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-herb px-4 text-[15px] font-semibold text-herb-ink transition hover:brightness-110"
          >
            <IconPlus width={18} height={18} /> Recept importeren
          </AppLink>
        </div>
        {own.length > 0 && (
          <div className="flex flex-col gap-2">
            {own.map((r) => {
              const chosen = todayChosen === r.id;
              return (
                <RecipeRow
                  key={r.id}
                  recipe={r}
                  highlight={chosen}
                  action={
                    <Button variant={chosen ? "active" : "secondary"} className="min-h-10 shrink-0 px-3 text-[14px]" aria-pressed={chosen} onClick={() => app.chooseForToday(r.id)}>
                      {chosen ? "Vanavond" : "Kies"}
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
