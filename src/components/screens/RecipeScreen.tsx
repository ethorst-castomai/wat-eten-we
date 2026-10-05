"use client";

import { useState, type ReactNode } from "react";
import { getRecipe } from "@/data/recipes";
import { cuisineLabel, DIET_LABEL, DIFFICULTY_LABEL, FEEDBACK_LABEL } from "@/lib/labels";
import { caloriesPerPortion, effectiveVegetarians, formatIngredient, formatQuantity, recipeIngredientGroups, scaleIngredient, type IngredientGroup } from "@/lib/ingredients";
import { AppLink, useGoBack, useNavigate } from "@/lib/nav";
import type { FeedbackValue, Recipe } from "@/lib/types";
import { useApp } from "../AppState";
import { DishArt } from "../DishArt";
import { SourceSearch } from "../SourceSearch";
import { IconBack, IconBasket, IconCheck, IconClock, IconFlame, IconHeart, IconLeaf, IconSwap } from "../Icons";
import { Button, DietChip, DinersPicker, EmptyState, Panel, ProteinChip } from "../ui";

const FEEDBACK_HELP: Record<FeedbackValue, string> = {
  "nog-een-keer": "Komt vaker terug, maar hooguit eens per vier weken.",
  prima: "Blijft in de rotatie zoals altijd.",
  "niet-meer": "Wordt nooit meer voorgesteld.",
};

export function RecipeScreen({ id }: { id: string }) {
  const app = useApp();
  const goBack = useGoBack();
  const recipe = getRecipe(id);
  const inList = recipe ? app.data.shopping.recipes.find((r) => r.recipeId === recipe.id) : undefined;
  const [lowCarb, setLowCarb] = useState<boolean>(inList?.lowCarb ?? false);
  const [includeSpicy, setIncludeSpicy] = useState<boolean>(inList?.includeSpicy ?? true);
  const [vegChoice, setVegChoice] = useState<number | null>(inList?.vegetarians ?? null);

  if (!recipe) {
    return (
      <EmptyState
        title="Recept niet gevonden"
        text="Dit recept bestaat niet meer. Ga terug naar de suggesties van vandaag."
        action={
          <AppLink href="/" className="font-semibold text-herb underline">
            Naar vandaag
          </AppLink>
        }
      />
    );
  }

  const persons = app.persons;
  const fav = app.isFavorite(recipe.id);
  const chosenToday = app.today?.chosenId === recipe.id;
  const feedback = app.feedbackFor(recipe.id);
  const alt = recipe.carbAlternative;
  const veg = effectiveVegetarians(recipe, persons, vegChoice ?? app.substitutesFor(recipe));
  const presentMembers = app.data.profile.members.filter((m) => app.data.diners.present.includes(m.name));
  const spicyEaters = presentMembers.filter((m) => m.likesSpicy).map((m) => m.name);
  const mildNames = presentMembers.filter((m) => !m.likesSpicy).map((m) => m.name);
  const allLikeSpicy = presentMembers.length > 0 && app.data.diners.guests === 0 && presentMembers.every((m) => m.likesSpicy);
  const groups = recipeIngredientGroups(recipe, { persons, vegetarians: veg, lowCarb });
  const carbs = lowCarb && alt ? alt.carbsPerPortion : recipe.carbsPerPortion;
  const kcal = caloriesPerPortion(recipe, { lowCarb });
  const spicyNames = recipe.spicy.extras.map((e) => e.name);

  const addToList = () => app.addToShopping({ recipeId: recipe.id, persons, includeSpicy, lowCarb, vegetarians: veg });
  // Staat het recept al op de lijst, dan passen keuzes de lijst direct aan
  const changeLowCarb = (v: boolean) => {
    setLowCarb(v);
    if (inList) app.addToShopping({ ...inList, lowCarb: v });
  };
  const changeVeg = (v: number) => {
    setVegChoice(v);
    if (inList) app.addToShopping({ ...inList, vegetarians: v });
  };
  const changeSpicy = (v: boolean) => {
    setIncludeSpicy(v);
    if (inList) app.addToShopping({ ...inList, includeSpicy: v });
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={goBack} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-2xl px-2 font-semibold text-muted hover:text-ink">
          <IconBack /> Terug
        </button>
      </div>

      <div className="relative aspect-[4/3] max-w-full overflow-hidden rounded-[32px] bg-surface-2 shadow-card sm:aspect-[16/10]">
        <DishArt recipe={recipe} />
        {chosenToday && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-herb px-3 py-1.5 text-[13px] font-semibold text-herb-ink">
            <IconCheck width={16} height={16} /> Vanavond op het menu
          </span>
        )}
      </div>

      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{cuisineLabel(recipe.cuisine)}</p>
        <h1 className="text-[34px] font-extrabold leading-[1.05] sm:text-[42px]">{recipe.name}</h1>
        <p className="text-[16px] leading-relaxed text-muted">{recipe.description}</p>
        <dl className="tabular mt-1 grid grid-cols-2 gap-x-4 gap-y-3 rounded-3xl border border-line p-4 sm:grid-cols-5">
          <Meta label="Bereidingstijd" value={`${recipe.prepTime} minuten`} icon={<IconClock width={16} height={16} />} />
          <Meta label="Moeilijkheid" value={DIFFICULTY_LABEL[recipe.difficulty]} />
          <Meta label="Personen" value={String(persons)} />
          <Meta label="Koolhydraten" value={carbs < 0 ? "Onbekend" : `± ${carbs} g p.p.`} />
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">Calorieën</dt>
            <dd className="mt-0.5 font-semibold">{kcal.standard === null ? "Onbekend" : `± ${kcal.standard} kcal p.p.`}</dd>
            {kcal.vegetarian !== undefined && (veg > 0 || kcal.vegetarian !== kcal.standard) && (
              <dd className="text-[13px] text-muted">vegetarisch ± {kcal.vegetarian} kcal</dd>
            )}
          </div>
        </dl>
        <div className="flex flex-wrap gap-1.5">
          <DietChip recipe={recipe} />
          <ProteinChip recipe={recipe} />
          {recipe.veggieRich && (
            <span className="inline-flex items-center gap-1 rounded-full bg-herb-soft px-2.5 py-1 text-[12px] font-semibold leading-none text-herb">
              <IconLeaf width={14} height={14} /> Veel groenten
            </span>
          )}
        </div>
      </header>

      {/* Acties */}
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant={chosenToday ? "active" : "primary"} onClick={() => app.chooseForToday(recipe.id)} aria-pressed={chosenToday}>
          {chosenToday ? <><IconCheck width={18} height={18} /> Gekozen voor vanavond</> : "Dit eten we vanavond"}
        </Button>
        <Button variant={inList ? "active" : "secondary"} onClick={inList ? () => app.removeFromShopping(recipe.id) : addToList} aria-pressed={Boolean(inList)}>
          <IconBasket width={18} height={18} /> {inList ? "Op je lijst" : "Voeg toe aan boodschappenlijst"}
        </Button>
        <Button variant={fav ? "active" : "secondary"} onClick={() => app.toggleFavorite(recipe.id)} aria-pressed={fav}>
          <IconHeart width={18} height={18} filled={fav} /> {fav ? "In favorieten" : "Favoriet"}
        </Button>
      </div>
      {inList && (
        <p className="-mt-3 text-[13px] text-muted">
          Staat op de lijst voor {inList.persons} personen{inList.lowCarb ? ", koolhydraatarme versie" : ""}{inList.vegetarians ? `, ${inList.vegetarians} vegetarisch` : ""}{inList.includeSpicy ? ", met pittige extra's" : ""}. Tik nogmaals om te verwijderen.{" "}
          <AppLink href="/boodschappen" className="font-semibold text-herb underline underline-offset-2">
            Bekijk lijst
          </AppLink>
        </p>
      )}

      <DinersPicker />

      {recipe.vegetarian && <VegetarianBlock recipe={recipe} persons={persons} value={veg} onChange={changeVeg} />}

      {/* Ingrediënten */}
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold">Ingrediënten</h2>
          {groups.filter((g) => g.kind !== "pittig").length === 1 && <span className="text-[13px] text-muted">voor {persons} personen</span>}
        </div>
        {alt && (
          <div role="radiogroup" aria-label="Versie van het recept" className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
            {[
              { v: false, label: `Met ${alt.original.toLowerCase()}` },
              { v: true, label: "Koolhydraatarm" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={lowCarb === o.v}
                onClick={() => changeLowCarb(o.v)}
                className={`min-h-10 rounded-xl px-3 text-[14px] font-semibold transition ${lowCarb === o.v ? "bg-surface text-ink shadow-card" : "text-muted"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-5">
          {groups
            .filter((g) => g.kind !== "pittig")
            .map((g) => (
              <IngredientList key={g.kind} group={g} showTitle={groups.length > 1} />
            ))}
        </div>
      </Panel>

      {/* Bereiding */}
      <Panel>
        <h2 className="text-2xl font-bold">Bereiding</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-full bg-herb-soft text-sm font-bold text-herb">{i + 1}</span>
              <p className="min-w-0 pt-1 text-[15.5px] leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
        {veg > 0 && recipe.vegetarian && (
          <p className="mt-5 rounded-2xl bg-saffron-soft p-4 text-[15px] text-ink">
            <strong>Vegetarisch:</strong> {recipe.vegetarian.howTo}
          </p>
        )}
        {lowCarb && alt && (
          <p className="mt-5 rounded-2xl bg-herb-soft p-4 text-[15px] text-ink">
            <strong>Koolhydraatarm:</strong> sla de {alt.original.toLowerCase()} over. {alt.howTo}
          </p>
        )}
      </Panel>

      {/* Maak het pittiger */}
      {(recipe.spicy.tip || recipe.spicy.extras.length > 0) && (
      <section className="flex flex-col gap-3 rounded-3xl bg-chili-soft p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-chili">
          <IconFlame /> Maak het pittiger
        </h2>
        {presentMembers.length > 0 && (
          <p className="text-[14px] font-semibold">
            {spicyEaters.length > 0 ? `Pittig: ${joinNl(spicyEaters)}.` : "Niemand aan tafel wil het vandaag pittig."}
            {mildNames.length > 0 ? ` Mild: ${joinNl(mildNames)}.` : ""}
          </p>
        )}
        <p className="text-[15px] leading-relaxed">{recipe.spicy.tip}</p>
        {allLikeSpicy && (
          <p className="rounded-2xl bg-surface px-4 py-3 text-[14px]">
            Vandaag eet iedereen aan tafel graag pittig. Je kunt de pittige extra&apos;s dus ook gewoon door het hele gerecht doen.
          </p>
        )}
        {recipe.spicy.extras.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {recipe.spicy.extras.map((e) => (
              <li key={e.name} className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold">
                {formatIngredient(scaleIngredient(e, recipe.baseServings, persons))}
              </li>
            ))}
          </ul>
        )}
        <label className="flex items-center gap-2 text-[14px] text-muted">
          <input id={`spicy-${recipe.id}`} type="checkbox" checked={includeSpicy} onChange={(e) => changeSpicy(e.target.checked)} className="h-4 w-4 accent-[var(--chili)]" />
          {spicyNames.length > 0 ? "Pittige extra's meenemen op de boodschappenlijst" : "Pittige extra's meenemen"}
        </label>
      </section>
      )}

      {/* Alternatief voor rijst of aardappel */}
      {alt && (
        <section className="flex flex-col gap-3 rounded-3xl bg-herb-soft p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-herb">
            <IconSwap /> Alternatief voor rijst of aardappel
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">In het recept</p>
              <p className="mt-1 font-semibold">{alt.original}</p>
              <p className="tabular text-[13px] text-muted">± {recipe.carbsPerPortion} g koolhydraten p.p.</p>
            </div>
            <div className="rounded-2xl bg-surface p-4 ring-1 ring-herb/30">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-herb">Alternatief</p>
              <p className="mt-1 font-semibold">{alt.alternative}</p>
              <p className="tabular text-[13px] text-muted">± {alt.carbsPerPortion} g koolhydraten p.p.</p>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed">{alt.howTo}</p>
          {!lowCarb && (
            <Button variant="secondary" className="self-start" onClick={() => changeLowCarb(true)}>
              Toon de koolhydraatarme versie
            </Button>
          )}
        </section>
      )}

      {/* Voedingsstijl */}
      <Panel>
        <h2 className="text-xl font-bold">Voedingsstijl</h2>
        {recipe.imported ? (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {recipe.kcalPerPortion
              ? `Volgens de bron levert een portie ongeveer ${recipe.kcalPerPortion} kcal`
              : kcal.standard !== null
                ? `Een portie levert naar schatting ${kcal.standard} kcal`
                : "De calorieën van dit recept zijn onbekend"}
            {recipe.carbsPerPortion >= 0 ? `, met ongeveer ${recipe.carbsPerPortion} gram koolhydraten` : ""}. Je kunt deze waarden aanpassen door het recept te bewerken.
          </p>
        ) : (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {DIET_LABEL[recipe.diet]}, met ongeveer {recipe.carbsPerPortion} gram koolhydraten per portie
            {alt ? ` en ongeveer ${alt.carbsPerPortion} gram met het alternatief` : ""}. Een portie levert ongeveer {caloriesPerPortion(recipe).standard} kcal
            {alt ? `, of ${caloriesPerPortion(recipe, { lowCarb: true }).standard} kcal in de koolhydraatarme versie` : ""}
            {kcal.vegetarian !== undefined ? `. De vegetarische versie komt op ongeveer ${kcal.vegetarian} kcal` : ""}. Dit zijn schattingen op basis van de ingrediënten en voedingswaardetabellen (NEVO), geen exacte berekening.
          </p>
        )}
      </Panel>

      {recipe.imported && <ImportedInfo recipeId={recipe.id} />}

      {/* Feedback */}
      <Panel>
        <h2 className="text-xl font-bold">Hoe was het?</h2>
        <p className="mt-1 text-[14px] text-muted">Je beoordeling bepaalt welke recepten je later krijgt.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["nog-een-keer", "prima", "niet-meer"] as FeedbackValue[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={feedback === v}
              onClick={() => app.setFeedback(recipe.id, v)}
              className={`min-h-12 rounded-2xl border px-2 text-[14px] font-semibold transition ${
                feedback === v ? (v === "niet-meer" ? "border-chili bg-chili-soft text-chili" : "border-herb bg-herb-soft text-herb") : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              {FEEDBACK_LABEL[v]}
            </button>
          ))}
        </div>
        {feedback && <p className="mt-3 text-[13px] text-muted">{FEEDBACK_HELP[feedback]}</p>}
      </Panel>

      {!recipe.imported && (
        <section className="flex flex-col gap-2 px-1">
          <SourceSearch query={recipe.name.replace(/\s*\(.*?\)\s*/g, " ").trim()} auto={false} label="Vergelijkbare recepten van je bronnen" />
        </section>
      )}
    </article>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</dt>
      <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold">
        {icon}
        {value}
      </dd>
    </div>
  );
}

const GROUP_TITLE: Record<IngredientGroup["kind"], string> = {
  basis: "Voor iedereen",
  vlees: "Apart: vlees of vis",
  vegetarisch: "Vegetarisch",
  pittig: "Pittig",
};

function IngredientList({ group, showTitle }: { group: IngredientGroup; showTitle: boolean }) {
  const who = `${group.count} ${group.count === 1 ? "persoon" : "personen"}`;
  return (
    <div>
      {showTitle && (
        <h3 className="flex items-baseline justify-between gap-2 font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
          <span className={group.kind === "vegetarisch" ? "text-herb" : group.kind === "vlees" ? "text-chili" : ""}>{GROUP_TITLE[group.kind]}</span>
          <span className="tabular font-semibold normal-case tracking-normal">voor {who}</span>
        </h3>
      )}
      <ul className="divide-y divide-line">
        {group.items.map((ing, i) => {
          const q = formatQuantity(ing.amount, ing.unit);
          return (
            <li key={`${ing.name}-${i}`} className="tabular flex items-baseline gap-4 py-2.5 text-[15px]">
              <span className="w-24 shrink-0 font-semibold">{q || "naar smaak"}</span>
              <span className="min-w-0">
                {ing.name}
                {ing.note && <span className="text-muted">, {ing.note}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VegetarianBlock({ recipe, persons, value, onChange }: { recipe: Recipe; persons: number; value: number; onChange(v: number): void }) {
  const v = recipe.vegetarian!;
  const options = Array.from({ length: persons + 1 }, (_, i) => i);
  const label = (n: number) => (n === 0 ? "Niemand" : n === persons ? "Iedereen" : `${n}`);
  const swapped = v.baseReplaces.length > 0 ? `${joinNl(v.baseReplaces)} in de basis ${v.baseReplaces.length === 1 ? "wordt" : "worden"} voor iedereen vervangen door ${joinNl(v.baseExtras.map((e) => e.name))}.` : "";
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-saffron-soft p-5" aria-labelledby={`veg-${recipe.id}`}>
      <h2 id={`veg-${recipe.id}`} className="flex items-center gap-2 text-xl font-bold">
        <IconLeaf /> Vegetarische versie
      </h2>
      <p className="text-[15px] leading-relaxed">
        Met {v.substitute.toLowerCase()} in plaats van {recipe.proteinLabel.toLowerCase()}. {recipe.protein === "vis" ? "De vis" : "Het vlees"} bereid je apart en gaat alleen op de borden van wie dat wil.
      </p>
      <div>
        <p id={`veg-count-${recipe.id}`} className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
          Hoeveel personen eten de vegetarische versie?
        </p>
        <div role="radiogroup" aria-labelledby={`veg-count-${recipe.id}`} className="grid gap-1 rounded-2xl bg-surface p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
          {options.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              onClick={() => onChange(n)}
              className={`tabular min-h-10 rounded-xl px-2 text-[14px] font-semibold transition ${value === n ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
            >
              {label(n)}
            </button>
          ))}
        </div>
      </div>
      {value > 0 && (
        <p className="text-[13px] text-muted">
          De ingrediënten hieronder zijn opgesplitst per groep. Bij de bereiding staat wat je anders doet.
          {swapped && ` ${swapped.charAt(0).toUpperCase() + swapped.slice(1)}`}
        </p>
      )}
    </section>
  );
}

/** "a, b en c" */
function joinNl(items: string[]): string {
  const uniq = [...new Set(items)];
  return uniq.length <= 1 ? (uniq[0] ?? "") : `${uniq.slice(0, -1).join(", ")} en ${uniq[uniq.length - 1]}`;
}

/** Herkomst, bewerken en verwijderen van een geïmporteerd recept */
function ImportedInfo({ recipeId }: { recipeId: string }) {
  const app = useApp();
  const navigate = useNavigate();
  const recipe = app.data.importedRecipes.find((r) => r.id === recipeId);
  const [confirm, setConfirm] = useState(false);
  if (!recipe) return null;
  return (
    <Panel>
      <h2 className="text-xl font-bold">Eigen recept</h2>
      <p className="mt-1 text-[15px] text-muted">
        {recipe.source?.url ? (
          <>
            Geïmporteerd van{" "}
            <a href={recipe.source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-herb underline underline-offset-2">
              {recipe.source.name} ↗
            </a>
            . Bekijk daar het originele recept en de foto&apos;s.
          </>
        ) : (
          <>Zelf toegevoegd recept{recipe.source?.name && recipe.source.name !== "Eigen invoer" ? ` van ${recipe.source.name}` : ""}.</>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate(`/importeren/${recipe.id}`)}>
          Bewerken
        </Button>
        {confirm ? (
          <span className="flex flex-wrap items-center gap-2 rounded-2xl bg-chili-soft px-3 py-1.5">
            <span className="text-[14px]">Recept verwijderen?</span>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Annuleren
            </Button>
            <Button
              className="bg-chili text-white"
              onClick={() => {
                app.removeImportedRecipe(recipe.id);
                navigate("/favorieten");
              }}
            >
              Verwijderen
            </Button>
          </span>
        ) : (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            Verwijderen
          </Button>
        )}
      </div>
    </Panel>
  );
}
