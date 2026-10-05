import type { DailySelection, FeedbackEntry, Profile, Recipe } from "./types";
import { daysBetween, isWeekend } from "./dates";

export interface SelectionContext {
  recipes: Recipe[];
  profile: Profile;
  feedback: FeedbackEntry[];
  /** Eerdere dagselecties, gebruikt voor de regel "niet in de afgelopen 7 dagen" */
  history: DailySelection[];
  date: Date;
  /** ISO datum van vandaag */
  today: string;
  /** Extra uit te sluiten recepten, bijvoorbeeld bij "Nieuwe suggesties" */
  exclude?: string[];
  /** Variatie in de random seed, zodat "Nieuwe suggesties" iets anders oplevert */
  salt?: number;
}

const RECENT_DAYS = 7;
const REPEAT_DAYS = 28;

/** Kleine deterministische random generator, zodat de selectie de hele dag stabiel blijft. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Woordgrens-match zodat "ham" niet matcht op "champignons" */
function containsTerm(text: string, term: string): boolean {
  const t = normalize(term);
  if (!t) return false;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zà-ÿ])${escaped}([^a-zà-ÿ]|$)`, "i").test(text);
}

export function recipeText(r: Recipe): string {
  return [r.name, ...r.ingredients.map((i) => i.name)].join(" | ").toLowerCase();
}

/** Bevat het recept dit ingrediënt of deze term? */
export function recipeMatchesTerm(r: Recipe, term: string): boolean {
  return containsTerm(recipeText(r), term);
}

export function violatesAvoidList(r: Recipe, avoid: string[]): boolean {
  const text = recipeText(r);
  return avoid.some((term) => containsTerm(text, term));
}

/** Laatste feedback per recept */
export function latestFeedback(feedback: FeedbackEntry[]): Map<string, FeedbackEntry> {
  const map = new Map<string, FeedbackEntry>();
  for (const f of feedback) {
    const prev = map.get(f.recipeId);
    if (!prev || prev.date <= f.date) map.set(f.recipeId, f);
  }
  return map;
}

/** Recepten die getoond zijn in de afgelopen 7 dagen (vandaag niet meegerekend) */
function recentlyShown(history: DailySelection[], today: string): Set<string> {
  const set = new Set<string>();
  for (const s of history) {
    const diff = daysBetween(s.date, today);
    if (diff > 0 && diff <= RECENT_DAYS) s.recipeIds.forEach((id) => set.add(id));
  }
  return set;
}

/** Datum waarop een recept voor het laatst gekozen (gekookt) is */
function lastCooked(history: DailySelection[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of history) {
    if (!s.chosenId) continue;
    const prev = map.get(s.chosenId);
    if (!prev || prev < s.date) map.set(s.chosenId, s.date);
  }
  return map;
}

interface Candidate {
  recipe: Recipe;
  score: number;
}

/**
 * Harde regels: profiel, vermijdlijst, feedback en historie.
 * Geeft een lijst met redenen terug zodat de UI/tests kunnen uitleggen waarom iets afvalt.
 */
export function isEligible(r: Recipe, ctx: SelectionContext, opts: { ignoreTime?: boolean; ignoreRecent?: boolean } = {}): boolean {
  const { profile, today } = ctx;
  const fb = latestFeedback(ctx.feedback).get(r.id);
  if (fb?.value === "niet-meer") return false;

  if (fb?.value === "nog-een-keer" || fb?.value === "prima") {
    // Een gerecht dat terug mag komen, maximaal eens per vier weken
    const cooked = lastCooked(ctx.history).get(r.id) ?? fb.date;
    if (daysBetween(cooked, today) < REPEAT_DAYS) return false;
  }

  if (!profile.proteins[r.protein]) return false;
  if (!profile.cuisines[r.cuisine]) return false;
  // Eigen eiwitopties die uit staan: recepten met dat ingrediënt overslaan
  const text = recipeText(r);
  if ((profile.customProteins ?? []).some((c) => !c.enabled && containsTerm(text, c.name))) return false;
  if (violatesAvoidList(r, profile.avoidIngredients)) return false;
  if (ctx.exclude?.includes(r.id)) return false;
  if (!opts.ignoreRecent && recentlyShown(ctx.history, today).has(r.id)) return false;

  if (!opts.ignoreTime) {
    const weekend = isWeekend(ctx.date);
    const max = weekend ? profile.maxTimeWeekend : profile.maxTimeWeekday;
    if (r.prepTime > max) return false;
  }
  return true;
}

function baseScore(r: Recipe, ctx: SelectionContext): number {
  const { profile } = ctx;
  let score = 1;
  const weekend = isWeekend(ctx.date);

  // Dagindeling: doordeweeks snel, weekend uitgebreider
  if (weekend) {
    if (r.prepTime >= 45) score += 3;
  } else {
    if (r.prepTime >= 20 && r.prepTime <= 35) score += 1.5;
  }

  // Voedingsstijl
  if (profile.diet.keto && r.diet === "keto") score += 1;
  if (profile.diet.koolhydraatarm && r.diet === "koolhydraatarm") score += 1;
  if ((profile.diet.keto || profile.diet.koolhydraatarm) && r.diet === "normaal" && r.carbAlternative) score += 0.5;

  if (profile.veggieRich && r.veggieRich) score += 1;
  if (profile.salads && r.isSalad) score += 0.5;

  // Favoriete ingrediënten
  const text = recipeText(r);
  const favHits = profile.favoriteIngredients.filter((f) => containsTerm(text, f)).length;
  score += Math.min(favHits, 3) * 0.75;

  // Eigen eiwitopties die aan staan krijgen voorrang
  const customHits = (profile.customProteins ?? []).filter((c) => c.enabled && containsTerm(text, c.name)).length;
  score += Math.min(customHits, 2) * 1.25;

  // Feedback
  const fb = latestFeedback(ctx.feedback).get(r.id);
  if (fb?.value === "nog-een-keer") score += 2.5;
  if (fb?.value === "prima") score += 0.5;

  // Vegetarisch is een aanvulling, geen hoofdkeuze
  if (r.protein === "vegetarisch") score -= 0.75;

  return score;
}

/** Hoe veel lijkt een recept op de al gekozen recepten? Hoger is meer overlap. */
function similarityPenalty(r: Recipe, chosen: Recipe[]): number {
  let penalty = 0;
  for (const c of chosen) {
    if (c.cuisine === r.cuisine) penalty += 4;
    if (c.protein === r.protein) penalty += 4;
    if (c.method === r.method) penalty += 1.5;
    if (c.diet === r.diet) penalty += 1;
    const shared = r.vegetables.filter((v) => c.vegetables.includes(v)).length;
    penalty += shared * 0.75;
  }
  return penalty;
}

function pickThree(pool: Candidate[], rand: () => number, chosen: Recipe[] = []): Recipe[] {
  const result = [...chosen];
  const remaining = [...pool];
  while (result.length < 3 && remaining.length > 0) {
    let bestIdx = 0;
    let best = -Infinity;
    remaining.forEach((c, i) => {
      // Ruis zorgt voor afwisseling tussen dagen, de penalty voor afwisseling binnen een dag
      const value = c.score - similarityPenalty(c.recipe, result) + rand() * 3;
      if (value > best) {
        best = value;
        bestIdx = i;
      }
    });
    result.push(remaining[bestIdx].recipe);
    remaining.splice(bestIdx, 1);
  }
  return result;
}

/**
 * Kies drie recepten voor vandaag.
 * Versoepelt stap voor stap als er te weinig kandidaten zijn (eerst kooktijd, dan de 7-dagenregel).
 */
export function selectDailyRecipes(ctx: SelectionContext): Recipe[] {
  const rand = seededRandom(`${ctx.today}:${ctx.salt ?? 0}`);
  const attempts: { ignoreTime?: boolean; ignoreRecent?: boolean }[] = [
    {},
    { ignoreTime: true },
    { ignoreTime: true, ignoreRecent: true },
  ];

  let picked: Recipe[] = [];
  for (const opts of attempts) {
    const taken = new Set(picked.map((p) => p.id));
    const pool: Candidate[] = ctx.recipes
      .filter((r) => !taken.has(r.id) && isEligible(r, ctx, opts))
      .map((r) => ({ recipe: r, score: baseScore(r, ctx) }));
    picked = pickThree(pool, rand, picked);
    if (picked.length >= 3) break;
  }
  return picked.slice(0, 3);
}
