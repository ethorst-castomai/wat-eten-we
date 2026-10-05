"use client";

import { useState } from "react";
import { allRecipes, getRecipe, recipeCountByCuisine } from "@/data/recipes";
import { CUISINE_SUGGESTIONS, cuisineId, cuisineLabel, FEEDBACK_LABEL, PROTEIN_LABEL } from "@/lib/labels";
import { recipeMatchesTerm } from "@/lib/selection";
import { EATS_LABEL, memberEats } from "@/lib/defaults";
import { SOURCE_SUGGESTIONS, nameFromUrl, normalizeUrl, sourceDomain } from "@/lib/sources";
import type { AppData, EatingStyle, Member, Protein } from "@/lib/types";
import { handleWhatsAppReply, sendDailyWhatsAppRecipes } from "@/lib/whatsapp";
import { AppLink } from "@/lib/nav";
import { useApp } from "../AppState";
import { IconChat } from "../Icons";
import { Button, Panel, Toggle } from "../ui";

export function ProfileScreen() {
  const { data, updateProfile } = useApp();
  const p = data.profile;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[36px] font-extrabold leading-tight">Profiel</h1>
        <p className="text-muted">Deze voorkeuren bepalen welke drie recepten je iedere dag krijgt. Wijzigingen gelden meteen.</p>
      </header>

      <HouseholdPanel />

      <ProteinPanel />
      <CuisinePanel />

      <Panel>
        <h2 className="text-xl font-bold">Voedingsstijl</h2>
        <div className="mt-1 divide-y divide-line">
          <Toggle id="diet-keto" label="Keto" hint="Keto-gerechten krijgen voorrang" checked={p.diet.keto} onChange={(v) => updateProfile({ diet: { ...p.diet, keto: v } })} />
          <Toggle
            id="diet-lowcarb"
            label="Koolhydraatarm"
            hint="Ook gerechten met een koolhydraatarm alternatief"
            checked={p.diet.koolhydraatarm}
            onChange={(v) => updateProfile({ diet: { ...p.diet, koolhydraatarm: v } })}
          />
          <Toggle id="veggie" label="Veel groenten" checked={p.veggieRich} onChange={(v) => updateProfile({ veggieRich: v })} />
          <Toggle id="salad" label="Salade" checked={p.salads} onChange={(v) => updateProfile({ salads: v })} />
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold">Ingrediënten</h2>
        <TagField
          id="avoid"
          label="Ingrediënten die we niet eten"
          hint="Recepten met deze ingrediënten worden nooit voorgesteld."
          values={p.avoidIngredients}
          tone="chili"
          onChange={(v) => updateProfile({ avoidIngredients: v })}
        />
        <TagField
          id="favorite"
          label="Favoriete ingrediënten"
          hint="Recepten met deze ingrediënten krijgen voorrang."
          values={p.favoriteIngredients}
          tone="herb"
          onChange={(v) => updateProfile({ favoriteIngredients: v })}
        />
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold">Kooktijd</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField id="max-weekday" label="Maximaal doordeweeks" value={p.maxTimeWeekday} min={15} max={90} onChange={(v) => updateProfile({ maxTimeWeekday: v })} />
          <NumberField id="max-weekend" label="Maximaal in het weekend" value={p.maxTimeWeekend} min={20} max={180} onChange={(v) => updateProfile({ maxTimeWeekend: v })} />
        </div>
      </Panel>

      <SourcesPanel />
      <FeedbackOverview />
      <WhatsAppPreview />
      <ResetPanel />
    </div>
  );
}

function TagField({ id, label, hint, values, tone, onChange }: { id: string; label: string; hint: string; values: string[]; tone: "herb" | "chili"; onChange(v: string[]): void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && !values.includes(s));
    if (parts.length) onChange([...values, ...parts]);
    setDraft("");
  };
  const chip = tone === "chili" ? "bg-chili-soft text-chili" : "bg-herb-soft text-herb";
  return (
    <div className="mt-4 flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-medium">
        {label}
      </label>
      <p className="-mt-1 text-[13px] text-muted">{hint}</p>
      <ul className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <li key={v} className={`inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-[13px] font-semibold ${chip}`}>
            {v}
            <button type="button" aria-label={`Verwijder ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface/60">
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Bijvoorbeeld champignons"
          className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb"
        />
        <Button type="submit" variant="secondary">
          Toevoegen
        </Button>
      </form>
    </div>
  );
}

function NumberField({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange(v: number): void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={5}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="tabular min-h-11 w-24 rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb"
        />
        <span className="text-muted">minuten</span>
      </div>
    </div>
  );
}

function FeedbackOverview() {
  const { data, setFeedback } = useApp();
  const entries = [...data.feedback].sort((a, b) => b.date.localeCompare(a.date));
  if (entries.length === 0) return null;
  return (
    <Panel>
      <h2 className="text-xl font-bold">Jullie beoordelingen</h2>
      <ul className="mt-3 divide-y divide-line">
        {entries.map((f) => {
          const r = getRecipe(f.recipeId);
          if (!r) return null;
          return (
            <li key={f.recipeId} className="flex items-center justify-between gap-3 py-2.5">
              <AppLink href={`/recept/${r.id}`} className="min-w-0 truncate text-[15px] font-medium hover:underline">
                {r.name}
              </AppLink>
              <span className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${f.value === "niet-meer" ? "bg-chili-soft text-chili" : "bg-herb-soft text-herb"}`}>
                  {FEEDBACK_LABEL[f.value]}
                </span>
                {f.value === "niet-meer" && (
                  <button type="button" onClick={() => setFeedback(r.id, "prima")} className="text-[13px] font-semibold text-muted underline hover:text-ink">
                    Toch weer tonen
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Laat zien wat sendDailyWhatsAppRecipes() en handleWhatsAppReply() doen, zonder echte koppeling. */
function WhatsAppPreview() {
  const app = useApp();
  const [thread, setThread] = useState<{ from: "app" | "jij"; text: string }[]>([]);
  const [reply, setReply] = useState("");

  const sendMorning = async () => {
    const res = await sendDailyWhatsAppRecipes({ data: app.data, recipient: { name: "Erwin", phone: "+31600000000" } });
    app.replaceData(res.data);
    setThread([{ from: "app", text: res.message }]);
  };

  const answer = (text: string) => {
    if (!text.trim()) return;
    const res = handleWhatsAppReply({ text, data: app.data as AppData });
    if (res.chosenId) app.replaceData(res.data);
    setThread((t) => [...t, { from: "jij", text }, { from: "app", text: res.reply }]);
    setReply("");
  };

  return (
    <Panel>
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <IconChat /> WhatsApp voorbeeld
      </h2>
      <p className="mt-1 text-[14px] text-muted">
        De koppeling is voorbereid maar nog niet actief. Hier zie je welk bericht er iedere ochtend verstuurd wordt en wat er gebeurt als je 1, 2 of 3 antwoordt.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={sendMorning}>Maak ochtendbericht</Button>
        {thread.length > 0 && (
          <Button variant="ghost" onClick={() => setThread([])}>
            Wissen
          </Button>
        )}
      </div>
      {thread.length > 0 && (
        <div className="mt-4 flex max-h-[520px] flex-col gap-2 overflow-y-auto rounded-2xl bg-surface-2 p-3">
          {thread.map((m, i) => (
            <p
              key={i}
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug ${m.from === "jij" ? "self-end bg-herb text-herb-ink" : "self-start bg-surface"}`}
            >
              {m.text}
            </p>
          ))}
        </div>
      )}
      {thread.length > 0 && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            answer(reply);
          }}
        >
          <label htmlFor="wa-reply" className="sr-only">
            Antwoord
          </label>
          <input
            id="wa-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Antwoord met 1, 2 of 3"
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb"
          />
          <Button type="submit">Stuur</Button>
        </form>
      )}
    </Panel>
  );
}

function ResetPanel() {
  const { resetAll } = useApp();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      {confirm ? (
        <>
          <span className="text-[14px]">Alle voorkeuren, favorieten en beoordelingen wissen?</span>
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Annuleren
          </Button>
          <Button
            className="bg-chili text-white"
            onClick={() => {
              resetAll();
              setConfirm(false);
            }}
          >
            Alles wissen
          </Button>
        </>
      ) : (
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Alles terugzetten naar standaard
        </Button>
      )}
    </div>
  );
}

const PROTEIN_SUGGESTIONS = ["zalm", "garnalen", "kabeljauw", "tonijn", "kalkoen", "lam", "eend", "mosselen"];

function countText(n: number): string {
  return n === 0 ? "Nog geen recepten" : `${n} ${n === 1 ? "recept" : "recepten"}`;
}

function RemoveButton({ label, onClick }: { label: string; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Verwijder ${label}`}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg text-muted hover:bg-surface-2 hover:text-chili"
    >
      ×
    </button>
  );
}

function AddField({ id, placeholder, onAdd }: { id: string; placeholder: string; onAdd(v: string): void }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) onAdd(draft.trim());
        setDraft("");
      }}
    >
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb"
      />
      <Button type="submit" variant="secondary">
        Toevoegen
      </Button>
    </form>
  );
}

function ProteinPanel() {
  const { data, updateProfile } = useApp();
  const p = data.profile;
  const custom = p.customProteins ?? [];
  const countFor = (term: string) => allRecipes().filter((r) => recipeMatchesTerm(r, term)).length;
  const add = (raw: string) => {
    const name = raw.toLowerCase();
    if (custom.some((c) => c.name === name)) return;
    updateProfile({ customProteins: [...custom, { name, enabled: true }] });
  };
  const suggestions = PROTEIN_SUGGESTIONS.filter((s) => !custom.some((c) => c.name === s));

  return (
    <Panel>
      <h2 className="text-xl font-bold">Vlees, vis of vegetarisch</h2>
      <div className="mt-1 divide-y divide-line">
        {(Object.keys(PROTEIN_LABEL) as Protein[]).map((k) => (
          <Toggle
            key={k}
            id={`protein-${k}`}
            label={PROTEIN_LABEL[k]}
            hint={`${k === "vis" ? "Inclusief garnalen. " : k === "vegetarisch" ? "Van zichzelf vegetarisch. " : ""}${countText(allRecipes().filter((r) => r.protein === k).length)}`}
            checked={p.proteins[k]}
            onChange={(v) => updateProfile({ proteins: { ...p.proteins, [k]: v } })}
          />
        ))}
      </div>

      <h3 className="mt-5 font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Eigen opties</h3>
      <p className="mt-1 text-[13px] text-muted">Aan betekent voorrang voor recepten met dit ingrediënt. Uit betekent dat die recepten worden overgeslagen.</p>
      {custom.length > 0 && (
        <ul className="mt-1 divide-y divide-line">
          {custom.map((c) => (
            <li key={c.name} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Toggle
                  id={`custom-protein-${c.name}`}
                  label={c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                  hint={countText(countFor(c.name))}
                  checked={c.enabled}
                  onChange={(v) => updateProfile({ customProteins: custom.map((x) => (x.name === c.name ? { ...x, enabled: v } : x)) })}
                />
              </div>
              <RemoveButton label={c.name} onClick={() => updateProfile({ customProteins: custom.filter((x) => x.name !== c.name) })} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-line px-3 text-[13px] font-semibold text-muted hover:border-herb hover:text-herb"
              >
                + {s} <span className="tabular font-medium opacity-70">({countFor(s)})</span>
              </button>
            ))}
          </div>
        )}
        <AddField id="add-protein" placeholder="Bijvoorbeeld kalfsvlees" onAdd={add} />
      </div>
    </Panel>
  );
}

function CuisinePanel() {
  const { data, updateProfile } = useApp();
  const p = data.profile;
  const counts = recipeCountByCuisine();
  const added = Object.keys(p.cuisines);
  const add = (raw: string) => {
    const id = cuisineId(raw);
    if (!id) return;
    updateProfile({ cuisines: { ...p.cuisines, [id]: true } });
  };
  const remove = (id: string) => {
    const next = { ...p.cuisines };
    delete next[id];
    updateProfile({ cuisines: next });
  };
  const suggestions = CUISINE_SUGGESTIONS.filter((c) => !(c in p.cuisines));

  return (
    <Panel>
      <h2 className="text-xl font-bold">Keukens</h2>
      <ul className="mt-1 divide-y divide-line">
        {added.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Toggle
                id={`cuisine-${k}`}
                label={cuisineLabel(k)}
                hint={`${k === "internationaal" ? "Steaks en grill. " : ""}${countText(counts[k] ?? 0)}${(counts[k] ?? 0) === 0 ? ". Vraag Claude om recepten voor deze keuken." : ""}`}
                checked={p.cuisines[k]}
                onChange={(v) => updateProfile({ cuisines: { ...p.cuisines, [k]: v } })}
              />
            </div>
            <RemoveButton label={cuisineLabel(k)} onClick={() => remove(k)} />
          </li>
        ))}
      </ul>
      <h3 className="mt-5 font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Keuken toevoegen</h3>
      <div className="mt-2 flex flex-col gap-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => add(c)}
                className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold transition ${
                  (counts[c] ?? 0) > 0 ? "border-herb/40 bg-herb-soft text-herb hover:border-herb" : "border-dashed border-line text-muted hover:text-ink"
                }`}
              >
                + {cuisineLabel(c)} <span className="tabular font-medium opacity-70">({counts[c] ?? 0})</span>
              </button>
            ))}
          </div>
        )}
        <AddField id="add-cuisine" placeholder="Andere keuken, bijvoorbeeld Peruaans" onAdd={add} />
      </div>
    </Panel>
  );
}

function Segmented<T extends string | boolean>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange(v: T): void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1 sm:auto-cols-fr sm:grid-flow-col">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`min-h-10 rounded-xl px-2 text-[14px] font-semibold transition ${value === o.v ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member, canRemove }: { member: Member; canRemove: boolean }) {
  const app = useApp();
  const [name, setName] = useState(member.name);
  const [confirm, setConfirm] = useState(false);
  const id = `member-${member.name.replace(/[^a-z0-9]/gi, "-")}`;
  const commitName = () => {
    const clean = name.trim();
    if (!clean || clean === member.name) return setName(member.name);
    app.updateMember(member.name, { name: clean });
  };
  const eatsOptions = (Object.keys(EATS_LABEL) as EatingStyle[]).map((v) => ({ v, label: EATS_LABEL[v] }));

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-bg p-4">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Naam
        </label>
        <input
          id={id}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 font-display text-lg font-bold outline-none hover:border-line focus:border-herb focus:bg-surface"
        />
        {canRemove &&
          (confirm ? (
            <span className="flex items-center gap-1">
              <Button variant="ghost" className="min-h-9 px-3 text-[13px]" onClick={() => setConfirm(false)}>
                Annuleren
              </Button>
              <Button className="min-h-9 bg-chili px-3 text-[13px] text-white" onClick={() => app.removeMember(member.name)}>
                Verwijderen
              </Button>
            </span>
          ) : (
            <RemoveButton label={member.name} onClick={() => setConfirm(true)} />
          ))}
      </div>
      <Segmented
        label="Smaak"
        value={member.likesSpicy}
        options={[
          { v: true, label: "Pittig" },
          { v: false, label: "Mild" },
        ]}
        onChange={(v) => app.updateMember(member.name, { likesSpicy: v })}
      />
      <Segmented label="Eet" value={memberEats(member)} options={eatsOptions} onChange={(v) => app.updateMember(member.name, { eats: v })} />
    </li>
  );
}

function HouseholdPanel() {
  const app = useApp();
  const members = app.data.profile.members;
  const [error, setError] = useState("");
  return (
    <Panel>
      <h2 className="text-xl font-bold">Huishouden</h2>
      <p className="mt-1 text-[14px] text-muted">Pas per persoon de naam, de smaak en wat diegene eet aan. Tik op een naam om die te wijzigen.</p>
      <ul className="mt-4 flex flex-col gap-3">
        {members.map((m) => (
          <MemberCard key={m.name} member={m} canRemove={members.length > 1} />
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-1.5">
        <AddField
          id="add-member"
          placeholder="Iemand toevoegen aan het huishouden"
          onAdd={(v) => setError(app.addMember(v) ? "" : `${v} staat al in het huishouden.`)}
        />
        {error && <p className="text-[13px] text-chili">{error}</p>}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-[13px] text-muted">
        <p>Recepten zijn mild. Wie pittig eet, vindt de pittige extra&apos;s apart bij Maak het pittiger.</p>
        <p>
          Eet iemand geen vlees of geen vis, dan krijgt diegene bij zo&apos;n recept automatisch de vegetarische versie. Het vlees of de vis bereid je dan apart voor de rest.
        </p>
        <p>Wie er vandaag mee-eet en hoeveel gasten er komen, kies je op het scherm Vandaag of bij een recept.</p>
      </div>
    </Panel>
  );
}

function SourcesPanel() {
  const { data, updateProfile } = useApp();
  const sources = data.profile.recipeSources ?? [];
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const add = (rawUrl: string, rawName?: string) => {
    const clean = normalizeUrl(rawUrl);
    if (!clean) {
      setError("Dit lijkt geen geldig webadres. Probeer bijvoorbeeld leukerecepten.nl.");
      return false;
    }
    if (sources.some((s) => sourceDomain(s.url) === sourceDomain(clean) && s.url === clean)) {
      setError(`${sourceDomain(clean)} staat al in je lijst.`);
      return false;
    }
    const entry = { id: `${Date.now().toString(36)}-${sources.length}`, name: rawName?.trim() || nameFromUrl(clean), url: clean, enabled: true };
    updateProfile({ recipeSources: [...sources, entry] });
    setError("");
    return true;
  };
  const suggestions = SOURCE_SUGGESTIONS.filter((s) => !sources.some((x) => x.url === s.url));

  return (
    <Panel>
      <h2 className="text-xl font-bold">Receptbronnen</h2>
      <p className="mt-1 text-[14px] text-muted">
        Websites met gratis recepten die je graag gebruikt. Bij &ldquo;Ik heb zin in&rdquo; en onder ieder recept kun je daarna ook op deze sites zoeken.
        Een recept dat je vindt, zet je met{" "}
        <AppLink href="/importeren" className="font-semibold text-herb underline underline-offset-2">
          Recept importeren
        </AppLink>{" "}
        tussen je eigen recepten.
      </p>

      {sources.length > 0 && (
        <ul className="mt-3 divide-y divide-line">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Toggle
                  id={`source-${s.id}`}
                  label={s.name}
                  hint={sourceDomain(s.url) + (s.enabled ? "" : ". Wordt niet doorzocht.")}
                  checked={s.enabled}
                  onChange={(v) => updateProfile({ recipeSources: sources.map((x) => (x.id === s.id ? { ...x, enabled: v } : x)) })}
                />
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${s.name} in een nieuw venster`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              >
                ↗
              </a>
              <RemoveButton label={s.name} onClick={() => updateProfile({ recipeSources: sources.filter((x) => x.id !== s.id) })} />
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Snel toevoegen</h3>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.url}
                type="button"
                onClick={() => add(s.url, s.name)}
                className="inline-flex min-h-9 items-center rounded-full border border-dashed border-line px-3 text-[13px] font-semibold text-muted hover:border-herb hover:text-herb"
              >
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (add(url, name)) {
            setUrl("");
            setName("");
          }
        }}
      >
        <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Eigen bron toevoegen</h3>
        <label htmlFor="source-url" className="sr-only">
          Webadres
        </label>
        <input
          id="source-url"
          type="text"
          autoComplete="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Webadres, bijvoorbeeld www.leukerecepten.nl"
          className="min-h-11 w-full rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb"
        />
        <div className="flex gap-2">
          <label htmlFor="source-name" className="sr-only">
            Naam (optioneel)
          </label>
          <input
            id="source-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam (optioneel)"
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-herb"
          />
          <Button type="submit" variant="secondary">
            Toevoegen
          </Button>
        </div>
        {error && <p className="text-[13px] text-chili">{error}</p>}
      </form>
    </Panel>
  );
}
