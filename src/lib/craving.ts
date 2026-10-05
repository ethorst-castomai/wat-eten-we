import type { FeedbackEntry, Profile, Recipe } from "./types";
import { caloriesPerPortion } from "./ingredients";
import { cuisineLabel } from "./labels";
import { latestFeedback, violatesAvoidList } from "./selection";

/**
 * "Ik heb zin in": vrije tekst omzetten naar passende recepten.
 * Werkt met trefwoorden (pasta, curry, snel, licht, Italiaans) en anders met vrij zoeken
 * in naam, ingrediënten en omschrijving.
 */

const STOPWORDS = new Set(
  "ik heb zin in iets wat een de het met en of voor vandaag vanavond lekker echt graag eens weer maar dan van op die dat is wil we eten".split(" "),
);

type Test = (r: Recipe) => boolean;

/** Zoekt termen aan het begin van een woord, zodat "pasta" niet matcht op "currypasta" */
const anyTerm = (terms: string[]): Test => {
  const re = new RegExp(`(^|[^a-zà-ÿ])(${terms.join("|")})`);
  return (r) => re.test(haystack(r));
};

/** Trefwoorden met een eigen betekenis */
const KEYWORDS: Record<string, Test> = {
  pasta: anyTerm(["pasta", "penne", "orzo", "spaghetti", "tagliatelle", "lasagne"]),
  // "jasmijnrijst" wel, "rijstazijn" niet
  rijst: (r) => r.ingredients.some((i) => /rijst(?![a-zà-ÿ])/.test(i.name)),
  noedels: anyTerm(["noedel", "mie"]),
  aardappel: anyTerm(["aardappel", "krieltjes"]),
  vis: (r) => r.protein === "vis",
  zeevruchten: anyTerm(["garnalen", "mosselen", "inktvis"]),
  vlees: (r) => r.protein === "kip" || r.protein === "rund",
  kip: (r) => r.protein === "kip",
  rund: (r) => r.protein === "rund",
  steak: anyTerm(["biefstuk", "ribeye", "entrecote", "steak"]),
  vegetarisch: (r) => r.protein === "vegetarisch",
  curry: (r) => r.method === "curry" || haystack(r).includes("curry"),
  soep: anyTerm(["soep"]),
  salade: (r) => r.isSalad,
  wok: (r) => r.method === "wok",
  oven: (r) => r.method === "oven",
  bbq: (r) => r.method === "grill",
  stoof: (r) => r.method === "stoof",
  snel: (r) => r.prepTime <= 25,
  makkelijk: (r) => r.difficulty === "makkelijk",
  uitgebreid: (r) => r.prepTime >= 45,
  licht: (r) => (caloriesPerPortion(r).standard ?? 9999) <= 500,
  stevig: (r) => (caloriesPerPortion(r).standard ?? 0) >= 750 || r.method === "stoof",
  keto: (r) => r.diet === "keto",
  koolhydraatarm: (r) => r.diet !== "normaal" || Boolean(r.carbAlternative),
  groenten: (r) => r.veggieRich,
  romig: anyTerm(["room", "kokosmelk", "ricotta", "mozzarella", "slagroom", "kookroom"]),
  aziatisch: (r) => ["thais", "chinees", "japans", "koreaans", "vietnamees", "indonesisch"].includes(r.cuisine),
};

/** Synoniemen en spelvarianten naar een trefwoord of zoekterm */
const SYNONYMS: Record<string, string> = {
  pastaatje: "pasta",
  macaroni: "pasta",
  spaghetti: "pasta",
  noodles: "noedels",
  noedel: "noedels",
  mie: "noedels",
  aardappelen: "aardappel",
  aardappels: "aardappel",
  friet: "aardappel",
  vissen: "vis",
  visje: "vis",
  garnaal: "garnalen",
  gamba: "garnalen",
  gambas: "garnalen",
  scampi: "garnalen",
  kipje: "kip",
  rundvlees: "rund",
  beef: "rund",
  biefstuk: "steak",
  vega: "vegetarisch",
  veggie: "vegetarisch",
  vegetarische: "vegetarisch",
  curries: "curry",
  salades: "salade",
  saladetje: "salade",
  soepje: "soep",
  barbecue: "bbq",
  grill: "bbq",
  gegrild: "bbq",
  stoofpot: "stoof",
  stoofvlees: "stoof",
  ovenschotel: "oven",
  snelle: "snel",
  snels: "snel",
  lichts: "licht",
  romigs: "romig",
  hartigs: "stevig",
  pittigs: "",
  vlug: "snel",
  simpel: "makkelijk",
  simpele: "makkelijk",
  makkelijke: "makkelijk",
  lichte: "licht",
  gezond: "licht",
  gezonde: "licht",
  stevige: "stevig",
  hartig: "stevig",
  comfortfood: "stevig",
  "low-carb": "koolhydraatarm",
  lowcarb: "koolhydraatarm",
  koolhydraatarme: "koolhydraatarm",
  groente: "groenten",
  groentes: "groenten",
  romige: "romig",
  aziatische: "aziatisch",
  oosters: "aziatisch",
  italiaanse: "italiaans",
  spaanse: "spaans",
  chinese: "chinees",
  thaise: "thais",
  japanse: "japans",
  indiase: "indiaas",
  griekse: "grieks",
  mexicaanse: "mexicaans",
};

const cache = new WeakMap<Recipe, string>();
function haystack(r: Recipe): string {
  let h = cache.get(r);
  if (!h) {
    h = [r.name, r.description, r.proteinLabel, cuisineLabel(r.cuisine), r.cuisine, ...r.ingredients.map((i) => i.name), ...r.vegetables].join(" ").toLowerCase();
    cache.set(r, h);
  }
  return h;
}

export interface CravingToken {
  term: string;
  /** "zonder vis" of "geen pasta": dit mag er juist niet in */
  negate: boolean;
}

export function cravingTokens(query: string): CravingToken[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out: CravingToken[] = [];
  let negate = false;
  for (const w of words) {
    if (w === "zonder" || w === "geen") {
      negate = true;
      continue;
    }
    const term = w in SYNONYMS ? SYNONYMS[w] : w;
    if (term.length > 1 && !STOPWORDS.has(term)) {
      out.push({ term, negate });
      negate = false;
    }
  }
  return out;
}

function tokenScore(r: Recipe, token: string): number {
  const kw = KEYWORDS[token];
  if (kw) return kw(r) ? 3 : 0;
  if (r.cuisine === token) return 3;
  const name = r.name.toLowerCase();
  // Simpele stam: "garnalen" vindt ook "garnaal", "tomaten" vindt "tomaat"
  const stem = token.length > 5 ? token.replace(/(en|s)$/, "") : token;
  if (name.includes(token) || name.includes(stem)) return 3;
  if (r.ingredients.some((i) => i.name.toLowerCase().includes(stem))) return 2;
  if (haystack(r).includes(stem)) return 1;
  return 0;
}

export interface CravingResult {
  recipe: Recipe;
  /** Aantal zoekwoorden dat matcht */
  matched: number;
  score: number;
}

/**
 * Zoek recepten bij een zin als "iets snels met zalm" of "Italiaanse pasta".
 * Gerechten met "Niet meer" en ingrediënten van de vermijdlijst vallen af.
 * Recepten die alle woorden raken komen eerst.
 */
export function findCravings(query: string, ctx: { recipes: Recipe[]; profile: Profile; feedback: FeedbackEntry[] }, limit = 6): CravingResult[] {
  const tokens = cravingTokens(query);
  if (tokens.length === 0) return [];
  const fb = latestFeedback(ctx.feedback);
  const results: CravingResult[] = [];
  for (const r of ctx.recipes) {
    if (fb.get(r.id)?.value === "niet-meer") continue;
    if (violatesAvoidList(r, ctx.profile.avoidIngredients)) continue;
    let matched = 0;
    let score = 0;
    let excluded = false;
    for (const t of tokens) {
      const s = tokenScore(r, t.term);
      if (t.negate) {
        if (s > 0) excluded = true;
        continue;
      }
      if (s > 0) matched++;
      score += s;
    }
    const positives = tokens.filter((t) => !t.negate).length;
    if (excluded || (positives > 0 && matched === 0)) continue;
    // Voorkeur voor keukens uit het profiel en positieve feedback
    if (ctx.profile.cuisines[r.cuisine]) score += 0.5;
    if (fb.get(r.id)?.value === "nog-een-keer") score += 1;
    results.push({ recipe: r, matched, score });
  }
  const best = Math.max(...results.map((r) => r.matched), 0);
  return results
    .filter((r) => r.matched === best)
    .sort((a, b) => b.score - a.score || a.recipe.prepTime - b.recipe.prepTime)
    .slice(0, limit);
}
