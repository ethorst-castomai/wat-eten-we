"use client";

import { useState } from "react";
import { getRecipe } from "@/data/recipes";
import { buildShoppingList, formatQuantity, groupByCategory } from "@/lib/ingredients";
import { AppLink } from "@/lib/nav";
import { useApp } from "../AppState";
import { IconCheck, IconTrash } from "../Icons";
import { Button, EmptyState } from "../ui";

export function ShoppingScreen() {
  const { data, toggleChecked, clearChecked, clearShopping, removeFromShopping } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const items = buildShoppingList(data.shopping.recipes, getRecipe);
  const groups = groupByCategory(items);
  const checkedCount = items.filter((i) => data.shopping.checked[i.key]).length;

  if (data.shopping.recipes.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-[36px] font-extrabold leading-tight">Boodschappen</h1>
        <EmptyState
          title="Je lijst is nog leeg"
          text="Open een recept en tik op Voeg toe aan boodschappenlijst. Voeg je meerdere recepten toe, dan tellen we dezelfde ingrediënten bij elkaar op."
          action={
            <AppLink href="/" className="font-semibold text-herb underline underline-offset-4">
              Naar de recepten van vandaag
            </AppLink>
          }
        />
      </div>
    );
  }

  const copy = async () => {
    const text = groups
      .map((g) => [g.label, ...g.items.filter((i) => !data.shopping.checked[i.key]).map((i) => `- ${[formatQuantity(i.amount, i.unit), i.name].filter(Boolean).join(" ")}`)].join("\n"))
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[36px] font-extrabold leading-tight">Boodschappen</h1>
        <p className="tabular text-muted">
          {items.length} producten voor {data.shopping.recipes.length} {data.shopping.recipes.length === 1 ? "recept" : "recepten"}
          {checkedCount > 0 ? `, ${checkedCount} al in je mandje` : ""}.
        </p>
      </header>

      <ul className="flex flex-wrap gap-2" aria-label="Recepten op de lijst">
        {data.shopping.recipes.map((entry) => {
          const r = getRecipe(entry.recipeId);
          if (!r) return null;
          return (
            <li key={entry.recipeId} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-1 pl-3.5 pr-1 text-[13.5px]">
              <AppLink href={`/recept/${r.id}`} className="font-semibold hover:underline">
                {r.name}
              </AppLink>
              <span className="tabular text-muted">voor {entry.persons}{entry.vegetarians ? `, ${entry.vegetarians} vegetarisch` : ""}</span>
              <button
                type="button"
                onClick={() => removeFromShopping(entry.recipeId)}
                aria-label={`Verwijder ${r.name} van de lijst`}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-chili"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.category} className="rounded-3xl bg-surface p-5 shadow-card">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-muted">{g.label}</h2>
            <ul className="mt-2 divide-y divide-line">
              {g.items.map((item) => {
                const checked = Boolean(data.shopping.checked[item.key]);
                const q = formatQuantity(item.amount, item.unit);
                const inputId = `item-${item.key.replace(/[^a-z0-9]/gi, "-")}`;
                return (
                  <li key={item.key}>
                    <label htmlFor={inputId} className="flex cursor-pointer items-center gap-3 py-3">
                      <input id={inputId} type="checkbox" checked={checked} onChange={() => toggleChecked(item.key)} className="peer sr-only" />
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-herb ${checked ? "border-herb bg-herb text-herb-ink" : "border-line"}`}
                      >
                        {checked && <IconCheck width={16} height={16} />}
                      </span>
                      <span className={`min-w-0 flex-1 text-[15.5px] ${checked ? "text-muted line-through" : ""}`}>
                        {item.name}
                        {item.recipeIds.length > 1 && <span className="ml-2 text-[12px] font-semibold text-herb no-underline">{item.recipeIds.length} recepten</span>}
                      </span>
                      <span className={`tabular shrink-0 text-[14.5px] font-semibold ${checked ? "text-muted" : ""}`}>{q || "naar smaak"}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={copy}>{copied === "ok" ? "Gekopieerd" : copied === "fail" ? "Kopiëren lukte niet" : "Kopieer lijst"}</Button>
        <Button variant="secondary" onClick={clearChecked} disabled={checkedCount === 0}>
          Vinkjes wissen
        </Button>
        {confirmClear ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-chili-soft px-3 py-1.5">
            <span className="text-[14px] font-medium">Hele lijst leegmaken?</span>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Annuleren
            </Button>
            <Button
              className="bg-chili text-white"
              onClick={() => {
                clearShopping();
                setConfirmClear(false);
              }}
            >
              Leegmaken
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmClear(true)}>
            <IconTrash width={18} height={18} /> Lijst leegmaken
          </Button>
        )}
      </div>
    </div>
  );
}
