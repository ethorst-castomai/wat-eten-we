"use client";

import type { ReactNode } from "react";
import { kcalLabel } from "@/lib/ingredients";
import { cuisineLabel } from "@/lib/labels";
import { AppLink } from "@/lib/nav";
import type { Recipe } from "@/lib/types";
import { DishArt } from "./DishArt";
import { IconClock } from "./Icons";
import { DietChip } from "./ui";

/** Compacte receptregel met kleine foto, gebruikt in het weekmenu en bij "Ik heb zin in" */
export function RecipeRow({ recipe, action, highlight }: { recipe: Recipe; action?: ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-2 ${highlight ? "bg-herb-soft" : "bg-bg"}`}>
      <AppLink href={`/recept/${recipe.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" aria-hidden tabIndex={-1}>
        <DishArt recipe={recipe} />
      </AppLink>
      <div className="min-w-0 flex-1">
        <AppLink href={`/recept/${recipe.id}`} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:underline">
          {recipe.name}
        </AppLink>
        <p className="tabular mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1">
            <IconClock width={14} height={14} /> {recipe.prepTime} min
          </span>
          <span>{cuisineLabel(recipe.cuisine)}</span>
          {kcalLabel(recipe) && <span>{kcalLabel(recipe)}</span>}
          <DietChip recipe={recipe} />
        </p>
      </div>
      {action}
    </div>
  );
}
