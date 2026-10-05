"use client";

import { useState, type ReactElement } from "react";
import type { Recipe } from "@/lib/types";

/**
 * Getekende placeholder: een bord van bovenaf, met kleuren die passen bij keuken, eiwit en groenten.
 * Wordt vervangen door recipe.image zodra er echte foto's zijn.
 */

const CUISINE_BG: Record<Recipe["cuisine"], [string, string]> = {
  thais: ["#c9dba0", "#7fa55a"],
  italiaans: ["#f0c9a8", "#c8553d"],
  spaans: ["#f4d58d", "#d9822b"],
  chinees: ["#e7b7a0", "#9e2f24"],
  internationaal: ["#cfc6b8", "#5b4a3e"],
  japans: ["#e9dccb", "#3f4a56"],
  indiaas: ["#f2c879", "#b5562a"],
  grieks: ["#cfe0ea", "#2f6e9b"],
  mexicaans: ["#f3c27a", "#3f7a4a"],
};
const FALLBACK_BG: [string, string] = ["#d9d3c4", "#6b7a5f"];

const PROTEIN_COLORS: Record<Recipe["protein"], string[]> = {
  kip: ["#e8b86b", "#d9a14f", "#f0c886"],
  rund: ["#8a3b2c", "#a14a36", "#6f2d22"],
  vis: ["#f19a7a", "#f6b496", "#efe3d3"],
  vegetarisch: ["#5b3c6e", "#e6c56a", "#f2efe6"],
};

const VEG_COLORS: Record<string, string> = {
  broccoli: "#3f7d3a",
  paksoi: "#6aa84f",
  spinazie: "#2f6b34",
  sperziebonen: "#4f8a3c",
  courgette: "#7fb069",
  spitskool: "#b5d48c",
  paprika: "#d8432f",
  "rode paprika": "#d8432f",
  tomaat: "#e04f39",
  kerstomaat: "#e04f39",
  kerstomaatjes: "#e04f39",
  aubergine: "#5b3c6e",
  komkommer: "#9cc98a",
  rucola: "#4c7f3a",
  champignons: "#c9b39a",
  wortel: "#ee8a2e",
  venkel: "#e3ecc8",
  asperges: "#7aa95c",
  "groene asperges": "#7aa95c",
  knolselderij: "#efe2c6",
  sla: "#8cc06a",
  ui: "#e9d6e8",
  "rode ui": "#9b4a7a",
};

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
}

export function DishArt({ recipe, className = "" }: { recipe: Recipe; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (recipe.image && !imageFailed) {
    // Een foto van de bronsite. Lukt laden niet, dan valt de app terug op de tekening.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={recipe.image} alt={recipe.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className={`h-full w-full object-cover ${className}`} />;
  }
  const r = rng(recipe.id);
  const [bgA, bgB] = CUISINE_BG[recipe.cuisine] ?? FALLBACK_BG;
  const proteinColors = PROTEIN_COLORS[recipe.protein];
  const vegColors = recipe.vegetables.map((v) => VEG_COLORS[v] ?? "#5f9a4a");
  if (vegColors.length === 0) vegColors.push("#5f9a4a");
  const hasRice = /rijst/i.test(recipe.carbAlternative?.original ?? "");
  const hasPotato = /aardappel|kriel/i.test(recipe.carbAlternative?.original ?? "");
  const isBowl = recipe.method === "curry" || recipe.method === "stoof";
  const id = `g-${recipe.id}`;

  const pieces: ReactElement[] = [];
  // Groente en blad
  for (let i = 0; i < 30; i++) {
    const a = r() * Math.PI * 2;
    const d = 14 + r() * 62;
    const x = 200 + Math.cos(a) * d;
    const y = 150 + Math.sin(a) * d * 0.92;
    const c = vegColors[i % vegColors.length];
    const rot = r() * 180;
    pieces.push(
      i % 3 === 0 ? (
        <circle key={`v${i}`} cx={x} cy={y} r={6 + r() * 8} fill={c} opacity={0.95} />
      ) : (
        <ellipse key={`v${i}`} cx={x} cy={y} rx={9 + r() * 12} ry={4 + r() * 6} fill={c} transform={`rotate(${rot} ${x} ${y})`} />
      ),
    );
  }
  // Eiwit
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = 6 + r() * 46;
    const x = 200 + Math.cos(a) * d;
    const y = 150 + Math.sin(a) * d * 0.9;
    const w = 24 + r() * 18;
    const h = 14 + r() * 10;
    pieces.push(
      <rect key={`p${i}`} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2.4} fill={proteinColors[i % proteinColors.length]} transform={`rotate(${r() * 180} ${x} ${y})`} />,
    );
  }
  // Kruiden en zaadjes
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 66;
    pieces.push(<circle key={`s${i}`} cx={200 + Math.cos(a) * d} cy={150 + Math.sin(a) * d} r={1.4 + r() * 1.2} fill={i % 2 ? "#fbf6e9" : "#2e5b2a"} opacity={0.85} />);
  }

  return (
    <svg viewBox="0 0 400 300" className={`h-full w-full ${className}`} role="img" aria-label={`Illustratie van ${recipe.name}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-bg`} cx="30%" cy="20%" r="95%">
          <stop offset="0" stopColor={bgA} />
          <stop offset="1" stopColor={bgB} />
        </radialGradient>
        <radialGradient id={`${id}-plate`} cx="45%" cy="40%" r="60%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ece8df" />
        </radialGradient>
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-bg)`} />
      {/* Linnen servet */}
      <rect x="-30" y="196" width="170" height="130" rx="10" fill="#fbf6ec" opacity="0.35" transform="rotate(-14 50 250)" />
      <g filter={`url(#${id}-sh)`}>
        <circle cx="200" cy="150" r={isBowl ? 104 : 112} fill={`url(#${id}-plate)`} />
      </g>
      <circle cx="200" cy="150" r={isBowl ? 84 : 92} fill="none" stroke="#d9d3c6" strokeWidth="1.5" />
      {isBowl && <circle cx="200" cy="150" r="80" fill={recipe.cuisine === "thais" ? "#e9c879" : "#b4532f"} opacity="0.9" />}
      {hasRice && <ellipse cx="236" cy="128" rx="34" ry="28" fill="#fbf9f2" stroke="#ece6d6" />}
      {hasPotato &&
        [0, 1, 2, 3].map((i) => <circle key={`k${i}`} cx={232 + (i % 2) * 20} cy={118 + Math.floor(i / 2) * 20} r="11" fill="#e3b45e" stroke="#c7953f" />)}
      {pieces}
      {/* Vork */}
      <g opacity="0.55" transform="translate(340 60) rotate(12)">
        <rect x="-3" y="20" width="6" height="150" rx="3" fill="#fbf6ec" />
        <rect x="-11" y="0" width="22" height="26" rx="5" fill="#fbf6ec" />
      </g>
    </svg>
  );
}
