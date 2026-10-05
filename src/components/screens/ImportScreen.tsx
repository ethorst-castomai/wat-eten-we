"use client";

import { useMemo, useState } from "react";
import { cuisineLabel, CUISINE_LABEL, PROTEIN_LABEL } from "@/lib/labels";
import { formatQuantity } from "@/lib/ingredients";
import { draftToRecipe, guessCuisine, guessProtein, parseIngredientLine, parseRecipeFromText, takePendingDraft, type ImportDraft } from "@/lib/import/parse";
import { fetchRecipeDraft, ImportError } from "@/lib/import/client";
import { violatesAvoidList } from "@/lib/selection";
import { AppLink, useGoBack, useNavigate } from "@/lib/nav";
import type { Protein, Recipe } from "@/lib/types";
import { useApp } from "../AppState";
import { IconBack } from "../Icons";
import { Button, Panel } from "../ui";
import { SourceSearch } from "../SourceSearch";

const field = "min-h-11 w-full rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb";
const label = "text-[13px] font-semibold uppercase tracking-[0.06em] text-muted";

/** Bestaand geïmporteerd recept terug naar een bewerkbaar concept */
function recipeToDraft(r: Recipe): ImportDraft {
  return {
    title: r.name,
    description: r.description,
    sourceName: r.source?.name,
    sourceUrl: r.source?.url,
    image: r.image,
    servings: r.baseServings,
    totalMinutes: r.prepTime,
    ingredients: r.ingredients.map((i) => [formatQuantity(i.amount, i.unit), i.name].filter(Boolean).join(" ") + (i.note ? `, ${i.note}` : "")),
    steps: r.steps,
    kcal: r.kcalPerPortion,
    carbs: r.carbsPerPortion >= 0 ? r.carbsPerPortion : undefined,
    cuisine: r.cuisine,
  };
}

export function ImportScreen({ editId }: { editId?: string }) {
  const app = useApp();
  const goBack = useGoBack();
  const existing = editId ? app.data.importedRecipes.find((r) => r.id === editId) : undefined;
  const [draft, setDraft] = useState<ImportDraft | null>(() => (existing ? recipeToDraft(existing) : takePendingDraft()));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <button type="button" onClick={goBack} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-2xl px-2 font-semibold text-muted hover:text-ink">
          <IconBack /> Terug
        </button>
      </div>
      <header className="flex flex-col gap-2">
        <h1 className="text-[36px] font-extrabold leading-tight">{existing ? "Recept bewerken" : "Recept importeren"}</h1>
        {!existing && (
          <p className="text-muted">
            Haal een recept op van een website of plak de tekst. Daarna controleer je het en staat het tussen je recepten, klaar om te kiezen.
          </p>
        )}
      </header>
      {draft ? (
        <ReviewForm key={existing?.id ?? draft.title} draft={draft} existing={existing} onReset={existing ? undefined : () => setDraft(null)} />
      ) : (
        <SourceStep onDraft={setDraft} />
      )}
    </div>
  );
}

function SourceStep({ onDraft }: { onDraft(d: ImportDraft): void }) {
  const app = useApp();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const sources = (app.data.profile.recipeSources ?? []).filter((s) => s.enabled);

  const fetchUrl = async () => {
    setError("");
    const clean = url.trim();
    if (!clean) return;
    setBusy(true);
    try {
      onDraft(await fetchRecipeDraft(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`));
    } catch (e) {
      const err = e instanceof ImportError ? e : new ImportError("Importeren is niet gelukt.");
      setUnavailable(err.unavailable);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const readText = () => {
    const d = parseRecipeFromText(text);
    if (d.ingredients.length === 0 && d.steps.length === 0) {
      setError("In deze tekst vond ik geen ingrediënten of bereiding. Zet de kopjes Ingrediënten en Bereiding erbij, of zet elk ingrediënt op een eigen regel.");
      return;
    }
    setError("");
    onDraft({ ...d, sourceUrl: url.trim() || undefined, sourceName: url.trim() ? new URL(/^https?:/.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "") : undefined });
  };

  return (
    <>
      <Panel>
        <h2 className="text-xl font-bold">Van een website</h2>
        <p className="mt-1 text-[14px] text-muted">Plak de link van een receptpagina. De meeste receptensites zetten hun recepten in een vorm die de app kan lezen.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void fetchUrl();
          }}
        >
          <label htmlFor="import-url" className="sr-only">
            Link naar het recept
          </label>
          <input
            id="import-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.ah.nl/allerhande/recept/..."
            className={`${field} min-w-0 flex-1`}
          />
          <Button type="submit" disabled={busy || !url.trim()}>
            {busy ? "Ophalen..." : "Ophalen"}
          </Button>
        </form>
        {error && !unavailable && <p className="mt-2 text-[14px] text-chili">{error}</p>}
        {unavailable && (
          <p className="mt-3 rounded-2xl bg-saffron-soft p-3 text-[14px]">
            In deze preview kan de app zelf geen websites ophalen. In de volledige app werkt dat wel. Open het recept, kopieer de titel, ingrediënten en
            bereiding, en plak die hieronder. De link blijft bewaard als bron.
          </p>
        )}
        {sources.length > 0 && <InAppSourceSearch />}
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold">Tekst plakken</h2>
        <p className="mt-1 text-[14px] text-muted">
          Kopieer het recept van de website en plak het hier. Het werkt het best met de kopjes Ingrediënten en Bereiding, en elk ingrediënt op een eigen regel.
        </p>
        <label htmlFor="import-text" className="sr-only">
          Recepttekst
        </label>
        <textarea
          id="import-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          placeholder={"Kip met citroen en tijm\n4 personen, 30 minuten\n\nIngrediënten\n600 g kippendijen\n2 citroenen\n...\n\nBereiding\nVerwarm de oven voor op 200 °C.\n..."}
          className="mt-3 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-herb"
        />
        {error && unavailable === false && text && <p className="mt-2 text-[14px] text-chili">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={readText} disabled={!text.trim()}>
            Lees recept
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDraft({ title: "", ingredients: [], steps: [], sourceName: "Eigen invoer" })}
          >
            Zelf invullen
          </Button>
        </div>
      </Panel>
    </>
  );
}

function ReviewForm({ draft, existing, onReset }: { draft: ImportDraft; existing?: Recipe; onReset?: () => void }) {
  const app = useApp();
  const navigate = useNavigate();
  const profile = app.data.profile;
  const [title, setTitle] = useState(draft.title);
  const [servings, setServings] = useState(String(draft.servings ?? 4));
  const [minutes, setMinutes] = useState(String(draft.totalMinutes ?? 30));
  const [cuisine, setCuisine] = useState(existing?.cuisine ?? guessCuisine(draft));
  const [protein, setProtein] = useState<Protein>(existing?.protein ?? guessProtein(draft.ingredients.map(parseIngredientLine)));
  const [kcal, setKcal] = useState(draft.kcal ? String(Math.round(draft.kcal)) : "");
  const [carbs, setCarbs] = useState(draft.carbs !== undefined ? String(Math.round(draft.carbs)) : "");
  const [ingText, setIngText] = useState(draft.ingredients.join("\n"));
  const [stepText, setStepText] = useState(draft.steps.join("\n"));
  const [description, setDescription] = useState(draft.description ?? "");

  const ingredients = useMemo(() => ingText.split("\n").map((l) => l.trim()).filter(Boolean), [ingText]);
  const steps = useMemo(() => stepText.split("\n").map((l) => l.trim()).filter(Boolean), [stepText]);
  const parsed = useMemo(() => ingredients.map(parseIngredientLine), [ingredients]);
  const cuisineOptions = useMemo(() => [...new Set([...Object.keys(profile.cuisines), ...Object.keys(CUISINE_LABEL), cuisine])], [profile.cuisines, cuisine]);

  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));
  const recipe = draftToRecipe(draft, {
    id: existing?.id,
    title,
    cuisine,
    protein,
    prepTime: num(minutes) ?? 30,
    servings: num(servings) ?? 4,
    ingredients,
    steps,
    kcal: num(kcal),
    carbs: num(carbs),
    description,
  });
  const avoidHit = violatesAvoidList(recipe, profile.avoidIngredients);
  const cuisineOff = !profile.cuisines[cuisine];
  const canSave = title.trim().length > 0 && ingredients.length > 0 && steps.length > 0;

  const save = (chooseTonight: boolean) => {
    if (!canSave) return;
    if (cuisineOff && !(cuisine in profile.cuisines)) app.updateProfile({ cuisines: { ...profile.cuisines, [cuisine]: true } });
    app.saveImportedRecipe(recipe);
    if (chooseTonight) app.chooseForToday(recipe.id);
    navigate(`/recept/${recipe.id}`);
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
    >
      <Panel>
        <div className="flex flex-col gap-4">
          {draft.sourceUrl && (
            <p className="text-[14px] text-muted">
              Bron:{" "}
              <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-herb underline underline-offset-2">
                {draft.sourceName ?? draft.sourceUrl} ↗
              </a>
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="imp-title" className={label}>
              Naam van het gerecht
            </label>
            <input id="imp-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Bijvoorbeeld kip met citroen en tijm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="imp-desc" className={label}>
              Korte omschrijving (optioneel)
            </label>
            <input id="imp-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="imp-servings" className={label}>
                Personen
              </label>
              <input id="imp-servings" type="number" inputMode="numeric" min={1} max={20} value={servings} onChange={(e) => setServings(e.target.value)} className={`${field} tabular`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="imp-minutes" className={label}>
                Minuten
              </label>
              <input id="imp-minutes" type="number" inputMode="numeric" min={5} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${field} tabular`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="imp-cuisine" className={label}>
                Keuken
              </label>
              <select id="imp-cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={field}>
                {cuisineOptions.map((c) => (
                  <option key={c} value={c}>
                    {cuisineLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="imp-protein" className={label}>
                Vlees, vis of vega
              </label>
              <select id="imp-protein" value={protein} onChange={(e) => setProtein(e.target.value as Protein)} className={field}>
                {(Object.keys(PROTEIN_LABEL) as Protein[]).map((p) => (
                  <option key={p} value={p}>
                    {PROTEIN_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="imp-kcal" className={label}>
                Kcal per persoon
              </label>
              <input id="imp-kcal" type="number" inputMode="numeric" min={0} value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="Onbekend" className={`${field} tabular`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="imp-carbs" className={label}>
                Koolhydraten (g)
              </label>
              <input id="imp-carbs" type="number" inputMode="numeric" min={0} value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Onbekend" className={`${field} tabular`} />
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <label htmlFor="imp-ingredients" className="text-xl font-bold">
          Ingrediënten
        </label>
        <p className="mt-1 text-[13px] text-muted">Eén ingrediënt per regel, zoals &ldquo;300 g kipfilet, in reepjes&rdquo;. Zo kan de app hoeveelheden omrekenen en de boodschappenlijst maken.</p>
        <textarea
          id="imp-ingredients"
          value={ingText}
          onChange={(e) => setIngText(e.target.value)}
          rows={Math.min(14, Math.max(5, ingredients.length + 1))}
          className="mt-3 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-herb"
        />
        {parsed.length > 0 && (
          <div className="mt-3">
            <p className={label}>Zo leest de app het</p>
            <ul className="mt-1 divide-y divide-line">
              {parsed.map((p, i) => (
                <li key={i} className="tabular flex items-baseline gap-3 py-2 text-[14px]">
                  <span className="w-20 shrink-0 font-semibold">{formatQuantity(p.amount, p.unit) || "naar smaak"}</span>
                  <span className="min-w-0 flex-1">
                    {p.name}
                    {p.note && <span className="text-muted">, {p.note}</span>}
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold text-muted">
                    {{ groente: "groente", vlees: "vlees/vis", zuivel: "zuivel", kruiden: "kruiden", overig: "overig" }[p.category]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel>
        <label htmlFor="imp-steps" className="text-xl font-bold">
          Bereiding
        </label>
        <p className="mt-1 text-[13px] text-muted">Eén stap per regel.</p>
        <textarea
          id="imp-steps"
          value={stepText}
          onChange={(e) => setStepText(e.target.value)}
          rows={Math.min(14, Math.max(5, steps.length + 1))}
          className="mt-3 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-herb"
        />
      </Panel>

      {(avoidHit || cuisineOff) && (
        <div className="flex flex-col gap-2 rounded-3xl bg-chili-soft p-4 text-[14px]">
          {avoidHit && <p>Dit recept bevat iets van je vermijdlijst. Je kunt het opslaan en zelf kiezen, maar het wordt niet automatisch voorgesteld.</p>}
          {cuisineOff && (
            <p>
              De keuken {cuisineLabel(cuisine)} staat {cuisine in profile.cuisines ? "uit" : "nog niet"} in je profiel.{" "}
              {cuisine in profile.cuisines ? "Het recept wordt pas voorgesteld als je die keuken aanzet." : "Bij opslaan wordt deze keuken toegevoegd."}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSave}>
          {existing ? "Wijzigingen opslaan" : "Opslaan bij mijn recepten"}
        </Button>
        {!existing && (
          <Button variant="secondary" disabled={!canSave} onClick={() => save(true)}>
            Opslaan en vanavond eten
          </Button>
        )}
        {onReset && (
          <Button variant="ghost" onClick={onReset}>
            Opnieuw beginnen
          </Button>
        )}
        {existing && (
          <AppLink href={`/recept/${existing.id}`} className="inline-flex min-h-11 items-center px-3 font-semibold text-muted hover:text-ink">
            Annuleren
          </AppLink>
        )}
      </div>
      {!canSave && <p className="-mt-2 text-[13px] text-muted">Vul een naam, minstens één ingrediënt en minstens één stap in om op te slaan.</p>}
    </form>
  );
}

/** Zoeken op je bronnen zonder de app te verlaten */
function InAppSourceSearch() {
  const [q, setQ] = useState("");
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
      <label htmlFor="import-search" className="text-[14px] font-semibold">
        Of zoek op je receptbronnen
      </label>
      <input id="import-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bijvoorbeeld kip curry" className={field} />
      <SourceSearch query={q.trim()} />
    </div>
  );
}
