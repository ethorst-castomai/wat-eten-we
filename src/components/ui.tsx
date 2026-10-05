"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Diet, Recipe } from "@/lib/types";
import { DIET_LABEL, PROTEIN_LABEL } from "@/lib/labels";
import { IconCheck, IconLeaf, IconUsers } from "./Icons";
import { useApp } from "./AppState";
import { describeDietNeeds, memberEats } from "@/lib/defaults";

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "herb" | "saffron" | "chili" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink",
    herb: "bg-herb-soft text-herb",
    saffron: "bg-saffron-soft text-ink",
    chili: "bg-chili-soft text-chili",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${tones[tone]}`}>{children}</span>;
}

export function dietTone(d: Diet): "herb" | "saffron" | "neutral" {
  return d === "keto" ? "herb" : d === "koolhydraatarm" ? "saffron" : "neutral";
}

export function DietChip({ recipe }: { recipe: Recipe }) {
  return <Chip tone={dietTone(recipe.diet)}>{DIET_LABEL[recipe.diet]}</Chip>;
}

export function ProteinChip({ recipe }: { recipe: Recipe }) {
  const label = recipe.protein === "vis" && recipe.proteinLabel ? recipe.proteinLabel : PROTEIN_LABEL[recipe.protein];
  return <Chip>{label}</Chip>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "active" };

export function Button({ variant = "primary", className = "", ...rest }: BtnProps) {
  const variants = {
    primary: "bg-herb text-herb-ink hover:brightness-110",
    secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
    ghost: "text-muted hover:text-ink hover:bg-surface-2",
    active: "bg-herb-soft text-herb border border-herb/30",
  };
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Wie eet er mee: gezinsleden aan of uit, plus gasten */
export function DinersPicker() {
  const app = useApp();
  const { diners, profile } = app.data;
  const needs = describeDietNeeds(app.data);
  return (
    <section aria-label="Wie eet er mee" className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Wie eet er mee?</h2>
        <span className="tabular inline-flex items-center gap-1.5 text-[14px] font-semibold">
          <IconUsers width={17} height={17} className="text-muted" />
          <span>
            {app.persons} {app.persons === 1 ? "persoon" : "personen"}
            {needs && <span className="font-medium text-muted">, {needs}</span>}
          </span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {profile.members.map((m) => {
          const on = diners.present.includes(m.name);
          return (
            <button
              key={m.name}
              type="button"
              aria-pressed={on}
              onClick={() => app.toggleDiner(m.name)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-[14.5px] font-semibold transition ${
                on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted line-through decoration-1 hover:text-ink"
              }`}
            >
              {on && <IconCheck width={15} height={15} />}
              {m.name}
              {memberEats(m) === "vegetarisch" && <IconLeaf width={14} height={14} />}
              {memberEats(m) === "vis" && <span className="text-[11px] font-medium opacity-75">geen vlees</span>}
              {memberEats(m) === "vlees" && <span className="text-[11px] font-medium opacity-75">geen vis</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Stepper id="guests" label="Gasten" value={diners.guests} min={0} max={12} onChange={app.setGuests} />
        {diners.guests > 0 && (
          <Stepper id="veg-guests" label="waarvan vegetarisch" value={diners.vegetarianGuests} min={0} max={diners.guests} onChange={app.setVegetarianGuests} />
        )}
      </div>
      {app.persons === 1 && diners.present.length === 0 && diners.guests === 0 && (
        <p className="text-[13px] text-chili">Kies minstens één persoon. Tot die tijd rekenen we met één portie.</p>
      )}
    </section>
  );
}

function Stepper({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange(v: number): void }) {
  const btn = "grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-lg font-semibold leading-none transition hover:bg-surface-2 disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <span id={`${id}-label`} className="text-[14.5px] font-medium">
        {label}
      </span>
      <div role="group" aria-labelledby={`${id}-label`} className="flex items-center gap-1.5">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${label} min één`}>
          −
        </button>
        <output id={id} aria-live="polite" className="tabular w-6 text-center text-[15px] font-bold">
          {value}
        </output>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`${label} plus één`}>
          +
        </button>
      </div>
    </div>
  );
}

export function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-surface-2 ring-1 ring-line transition peer-checked:bg-herb peer-focus-visible:ring-2 peer-focus-visible:ring-herb" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-surface shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-surface p-5 shadow-card ${className}`}>{children}</section>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="max-w-sm text-muted">{text}</p>
      {action}
    </div>
  );
}
