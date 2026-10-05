"use client";

import type { Recipe } from "@/lib/types";
import { cuisineLabel } from "@/lib/labels";
import { kcalLabel } from "@/lib/ingredients";
import { AppLink } from "@/lib/nav";
import { DishArt } from "./DishArt";
import { DietChip, ProteinChip } from "./ui";
import { IconCheck, IconClock, IconHeart, IconUsers } from "./Icons";
import { useApp } from "./AppState";
import { IconLeaf } from "./Icons";

export function RecipeCard({ recipe, persons, chosen, index = 0, compact = false }: { recipe: Recipe; persons: number; chosen?: boolean; index?: number; compact?: boolean }) {
  const { isFavorite, toggleFavorite, substitutesFor } = useApp();
  const veg = recipe.vegetarian ? Math.min(substitutesFor(recipe), persons) : 0;
  const fav = isFavorite(recipe.id);
  const href = `/recept/${recipe.id}`;

  return (
    <article
      className={`rise flex flex-col overflow-hidden rounded-[28px] bg-surface shadow-card ${chosen ? "ring-2 ring-herb" : ""}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[16/11] max-w-full overflow-hidden bg-surface-2">
        <AppLink href={href} aria-label={`Bekijk recept ${recipe.name}`} className="block h-full">
          <DishArt recipe={recipe} />
        </AppLink>
        <button
          type="button"
          onClick={() => toggleFavorite(recipe.id)}
          aria-pressed={fav}
          aria-label={fav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          className={`absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-surface/90 backdrop-blur transition hover:scale-105 ${fav ? "text-chili" : "text-ink"}`}
        >
          <IconHeart filled={fav} />
        </button>
        {chosen && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-herb px-3 py-1.5 text-[13px] font-semibold text-herb-ink">
            <IconCheck width={16} height={16} /> Vanavond
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-muted">
          <span className="uppercase tracking-[0.08em]">{cuisineLabel(recipe.cuisine)}</span>
          <span className="tabular inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <IconClock width={16} height={16} /> {recipe.prepTime} min
            </span>
            {kcalLabel(recipe) && <span>{kcalLabel(recipe)}</span>}
          </span>
        </div>
        <h2 className={`${compact ? "text-lg" : "text-[22px]"} font-bold leading-tight`}>
          <AppLink href={href} className="hover:underline decoration-2 underline-offset-4">
            {recipe.name}
          </AppLink>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <DietChip recipe={recipe} />
          <ProteinChip recipe={recipe} />
          {veg > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2.5 py-1 text-[12px] font-semibold leading-none text-ink">
              <IconLeaf width={13} height={13} /> Vegetarisch met {recipe.vegetarian!.substitute.toLowerCase()}
            </span>
          )}
          {recipe.carbAlternative && recipe.diet === "normaal" && <span className="inline-flex items-center rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold leading-none text-muted">Koolhydraatarm mogelijk</span>}
        </div>
        {!compact && <p className="text-[15px] leading-relaxed text-muted">{recipe.description}</p>}
        <div className="mt-auto flex flex-col gap-3 pt-1">
          <span className="tabular inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <IconUsers width={16} height={16} /> {persons} {persons === 1 ? "persoon" : "personen"}{veg > 0 && recipe.vegetarian ? `, ${veg} met ${recipe.vegetarian.substitute.toLowerCase()}` : ""}
          </span>
          <AppLink
            href={href}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-herb px-4 text-[15px] font-semibold text-herb-ink transition hover:brightness-110 active:scale-[0.98]"
          >
            Bekijk recept
          </AppLink>
        </div>
      </div>
    </article>
  );
}
