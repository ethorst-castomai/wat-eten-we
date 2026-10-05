import type { CookingMethod, Cuisine, Diet, Ingredient, IngredientCategory, Protein, Recipe, Unit } from "../types";

/**
 * Recepten importeren. Twee ingangen:
 * 1. Een webpagina met schema.org Recipe-gegevens (JSON-LD). Bijna alle grote receptensites hebben die.
 * 2. Geplakte tekst: titel, ingrediënten en bereiding zoals je ze van een site kopieert.
 * Beide leveren een ImportDraft op. Die laat je controleren en zet je daarna om naar een Recipe.
 */
export interface ImportDraft {
  title: string;
  description?: string;
  sourceName?: string;
  sourceUrl?: string;
  image?: string;
  servings?: number;
  totalMinutes?: number;
  ingredients: string[];
  steps: string[];
  kcal?: number;
  carbs?: number;
  cuisine?: string;
}

/* ---------- Kleine hulpfuncties ---------- */

const FRACTIONS: Record<string, string> = { "½": ".5", "¼": ".25", "¾": ".75", "⅓": ".33", "⅔": ".67", "⅛": ".125" };

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function cleanText(s: unknown): string {
  if (typeof s !== "string") return "";
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** ISO 8601-duur zoals PT1H30M naar minuten */
export function isoDurationToMinutes(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const m = v.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return undefined;
  const total = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return total > 0 ? total : undefined;
}

function firstNumber(v: unknown): number | undefined {
  const values = Array.isArray(v) ? v : [v];
  for (const x of values) {
    if (typeof x === "number" && x > 0) return x;
    if (typeof x === "string") {
      const m = x.replace(",", ".").match(/\d+(\.\d+)?/);
      if (m) return Number(m[0]);
    }
  }
  return undefined;
}

/* ---------- JSON-LD ---------- */

function isRecipeNode(n: unknown): n is Record<string, unknown> {
  if (!n || typeof n !== "object") return false;
  const t = (n as Record<string, unknown>)["@type"];
  return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
}

function findRecipeNode(data: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(data)) {
    for (const d of data) {
      const r = findRecipeNode(d);
      if (r) return r;
    }
    return undefined;
  }
  if (!data || typeof data !== "object") return undefined;
  if (isRecipeNode(data)) return data;
  const obj = data as Record<string, unknown>;
  if (obj["@graph"]) return findRecipeNode(obj["@graph"]);
  if (obj.mainEntity) return findRecipeNode(obj.mainEntity);
  return undefined;
}

function instructionsToSteps(v: unknown): string[] {
  if (!v) return [];
  if (typeof v === "string") {
    return v
      .split(/\n+|(?<=\.)\s+(?=\d+\.\s)/)
      .map((s) => cleanText(s).replace(/^\d+[.)]\s*/, ""))
      .filter(Boolean);
  }
  if (Array.isArray(v)) return v.flatMap(instructionsToSteps);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.itemListElement) return instructionsToSteps(o.itemListElement);
    if (o.text) return [cleanText(o.text)].filter(Boolean);
    if (o.name) return [cleanText(o.name)].filter(Boolean);
  }
  return [];
}

function imageUrl(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return imageUrl(v[0]);
  if (typeof v === "object") return imageUrl((v as Record<string, unknown>).url);
  return undefined;
}

/** Zoekt schema.org Recipe-gegevens in de HTML van een receptpagina */
export function parseRecipeFromHtml(html: string, pageUrl?: string): ImportDraft | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  for (const raw of blocks) {
    let json: unknown;
    try {
      json = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const node = findRecipeNode(json);
    if (!node) continue;
    const nutrition = (node.nutrition ?? {}) as Record<string, unknown>;
    const host = pageUrl ? new URL(pageUrl).hostname.replace(/^www\./, "") : undefined;
    const publisher = node.publisher as Record<string, unknown> | undefined;
    const cuisine = Array.isArray(node.recipeCuisine) ? node.recipeCuisine[0] : node.recipeCuisine;
    return {
      title: cleanText(node.name) || "Geïmporteerd recept",
      description: cleanText(node.description) || undefined,
      sourceName: cleanText(publisher?.name) || host,
      sourceUrl: pageUrl,
      image: imageUrl(node.image),
      servings: firstNumber(node.recipeYield),
      totalMinutes:
        isoDurationToMinutes(node.totalTime) ??
        (((isoDurationToMinutes(node.prepTime) ?? 0) + (isoDurationToMinutes(node.cookTime) ?? 0)) || undefined),
      ingredients: (Array.isArray(node.recipeIngredient) ? node.recipeIngredient : []).map(cleanText).filter(Boolean),
      steps: instructionsToSteps(node.recipeInstructions),
      kcal: firstNumber(nutrition.calories),
      carbs: firstNumber(nutrition.carbohydrateContent),
      cuisine: cleanText(cuisine) || undefined,
    };
  }
  return null;
}

/* ---------- Geplakte tekst ---------- */

const INGREDIENT_HEADINGS = /^(ingredi[eë]nten|benodigdheden|wat heb je nodig|boodschappen|je hebt nodig)\b/i;
const STEP_HEADINGS = /^(bereiding(swijze)?|werkwijze|instructies|zo maak je (het|dit)|aan de slag|methode)\b/i;

function stripBullet(line: string): string {
  return line.replace(/^\s*([-•*·▪●]|\d+[.)])\s+/, "").trim();
}

/** Leest een recept uit tekst die je van een website hebt gekopieerd */
export function parseRecipeFromText(text: string): ImportDraft {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const draft: ImportDraft = { title: "", ingredients: [], steps: [] };
  let mode: "head" | "ing" | "step" = "head";
  const loose: string[] = [];

  for (const line of lines) {
    const bare = line.replace(/[:\s]+$/, "");
    if (INGREDIENT_HEADINGS.test(bare)) {
      mode = "ing";
      continue;
    }
    if (STEP_HEADINGS.test(bare)) {
      mode = "step";
      continue;
    }
    const servings = line.match(/(\d+)\s*(personen|persoon|pers\.?|porties?)\b/i);
    if (servings && !draft.servings) draft.servings = Number(servings[1]);
    const time = line.match(/(\d+)\s*(min(uten|\.)?|minuten)\b/i) ?? line.match(/(\d+)\s*uur\b/i);
    if (mode === "head" && time && !draft.totalMinutes) draft.totalMinutes = /uur/i.test(time[0]) ? Number(time[1]) * 60 : Number(time[1]);
    const kcal = line.match(/(\d{2,4})\s*kcal/i);
    if (kcal && !draft.kcal) draft.kcal = Number(kcal[1]);

    if (mode === "ing") draft.ingredients.push(stripBullet(line));
    else if (mode === "step") draft.steps.push(stripBullet(line));
    else if (!draft.title) draft.title = line;
    else loose.push(line);
  }

  // Geen kopjes gevonden: korte regels die met een hoeveelheid beginnen zijn ingrediënten, lange zinnen zijn stappen
  if (draft.ingredients.length === 0 && draft.steps.length === 0) {
    for (const line of loose) {
      const l = stripBullet(line);
      if (/^[\d½¼¾⅓]/.test(l) && l.length < 70) draft.ingredients.push(l);
      else if (l.length >= 40) draft.steps.push(l);
    }
  }
  if (!draft.title) draft.title = "Geïmporteerd recept";
  return draft;
}

/* ---------- Ingrediëntregels ---------- */

const UNIT_MAP: { re: RegExp; unit: Unit; factor: number }[] = [
  { re: /^(kg|kilo|kilogram)$/, unit: "g", factor: 1000 },
  { re: /^(g|gr|gram|grammen)$/, unit: "g", factor: 1 },
  { re: /^(l|liter|ltr)$/, unit: "ml", factor: 1000 },
  { re: /^(dl|deciliter)$/, unit: "ml", factor: 100 },
  { re: /^(cl|centiliter)$/, unit: "ml", factor: 10 },
  { re: /^(ml|milliliter)$/, unit: "ml", factor: 1 },
  { re: /^(el|eetl|eetlepels?|tbsp|tablespoons?)$/, unit: "el", factor: 1 },
  { re: /^(tl|theel|theelepels?|tsp|teaspoons?)$/, unit: "tl", factor: 1 },
  { re: /^(teen|teentjes?|tenen)$/, unit: "teen", factor: 1 },
  { re: /^(blik|blikje|blikken)$/, unit: "blik", factor: 1 },
  { re: /^(bos|bosje|bossen)$/, unit: "bos", factor: 1 },
  { re: /^(snuf|snufje|mespunt|mespuntje)$/, unit: "snuf", factor: 1 },
  { re: /^(stuks?|st)$/, unit: "st", factor: 1 },
];

const CATEGORY_WORDS: [IngredientCategory, RegExp][] = [
  ["vlees", /kip|rund|gehakt|biefstuk|steak|ribeye|entrecote|lams?|kalkoen|eend|zalm|vis|kabeljauw|tonijn|garnal|mossel|inktvis|forel|makreel|dorade|zeebaars|spek|ham|worst|filet/],
  ["zuivel", /kaas|melk|room|yoghurt|kwark|boter|eieren|\bei\b|crème fraîche|creme fraiche|mascarpone|ricotta|mozzarella|feta|parmezaan|halloumi/],
  ["kruiden", /saus|olie|azijn|peper|zout|bouillon|kruiden|kerrie|komijn|paprikapoeder|kaneel|oregano|tijm|laurier|curry(pasta)?|ketjap|soja|mosterd|honing|suiker|siroop|specerij|nootmuskaat|sambal|sriracha|wijn/],
  ["groente", /ui|knoflook|tomaat|tomaten|paprika|courgette|aubergine|broccoli|spinazie|sla|komkommer|wortel|prei|champignon|paddenstoel|bonen|erwt|kool|citroen|limoen|appel|peer|avocado|gember|peterselie|koriander|basilicum|munt|dille|bieslook|rucola|venkel|selderij|asperge|pompoen|biet|radijs|mais|maïs|lente-ui|bosui|sjalot|chili|peper/],
];

function guessCategory(name: string): IngredientCategory {
  const n = name.toLowerCase();
  if (n.startsWith("verse ")) return "groente";
  for (const [cat, re] of CATEGORY_WORDS) if (re.test(n)) return cat;
  return "overig";
}

/** "200 gram kipfilet, in reepjes" naar { amount: 200, unit: "g", name: "kipfilet", note: "in reepjes" } */
export function parseIngredientLine(line: string): Ingredient {
  let s = line.trim();
  for (const [f, v] of Object.entries(FRACTIONS)) s = s.replace(new RegExp(`(\\d)?\\s?${f}`, "g"), (_, d) => `${d ?? "0"}${v}`);
  // "2 1/2" eerst, daarna losse breuken als "1/2"
  s = s.replace(/^(\d+)\s+(\d+)\s*\/\s*(\d+)/, (_, w, a, b) => String(Number(w) + Number(a) / Number(b)));
  s = s.replace(/(\d+)\s*\/\s*(\d+)/, (_, a, b) => String(Number(a) / Number(b)));
  s = s.replace(/(\d),(\d)/g, "$1.$2");

  let amount: number | undefined;
  const num = s.match(/^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*/);
  if (num) {
    amount = num[2] ? (Number(num[1]) + Number(num[2])) / 2 : Number(num[1]);
    s = s.slice(num[0].length);
  }

  let unit: Unit = amount === undefined ? "naar smaak" : "st";
  const word = s.match(/^([a-zA-Zëé.]+)\.?\s+/);
  if (word && amount !== undefined) {
    const w = word[1].toLowerCase().replace(/\.$/, "");
    const hit = UNIT_MAP.find((u) => u.re.test(w));
    if (hit) {
      unit = hit.unit;
      amount = Math.round(amount * hit.factor * 100) / 100;
      s = s.slice(word[0].length);
    }
  }

  // Toelichting tussen haakjes of na een komma
  let note: string | undefined;
  const paren = s.match(/\(([^)]*)\)/);
  if (paren) {
    note = paren[1].trim();
    s = s.replace(paren[0], " ");
  }
  const comma = s.indexOf(",");
  if (comma > 0) {
    note = [note, s.slice(comma + 1).trim()].filter(Boolean).join(", ");
    s = s.slice(0, comma);
  }
  const name = s.replace(/\s+/g, " ").trim().toLowerCase() || line.trim().toLowerCase();
  if (/^(zout|peper|zout en peper|peper en zout)$/.test(name)) return { name, unit: "naar smaak", category: "kruiden" };
  return { name, amount: unit === "naar smaak" ? undefined : amount, unit, category: guessCategory(name), note: note || undefined };
}

/* ---------- Van concept naar Recipe ---------- */

export function guessProtein(ingredients: Ingredient[]): Protein {
  const text = ingredients.map((i) => i.name).join(" ");
  if (/zalm|vis|kabeljauw|tonijn|garnal|mossel|inktvis|forel|makreel|dorade|zeebaars|scampi|gamba/.test(text)) return "vis";
  if (/kip|kalkoen/.test(text)) return "kip";
  if (/rund|biefstuk|steak|ribeye|entrecote|gehakt|lams?vlees|lamsrack/.test(text)) return "rund";
  return "vegetarisch";
}

export function guessMethod(steps: string[], title: string): CookingMethod {
  const t = `${title} ${steps.join(" ")}`.toLowerCase();
  if (/curry/.test(t)) return "curry";
  if (/salade/.test(title.toLowerCase())) return "salade";
  if (/wok/.test(t)) return "wok";
  if (/stoof|sudder|smoor/.test(t)) return "stoof";
  if (/grill|bbq|barbecue/.test(t)) return "grill";
  if (/oven/.test(t)) return "oven";
  return "pan";
}

const CUISINE_WORDS: [Cuisine, RegExp][] = [
  ["italiaans", /ital|pasta|risotto|pesto|lasagne|parmezaan/],
  ["spaans", /spaan|paella|tapas|chorizo|gambas/],
  ["chinees", /chine|wok|oestersaus|hoisin/],
  ["thais", /thai|thais|currypasta|kokosmelk|citroengras|vissaus/],
  ["japans", /japan|teriyaki|miso|sushi|ramen/],
  ["indiaas", /india|indiaas|garam masala|tikka|dal\b|naan/],
  ["grieks", /griek|tzatziki|feta|souvlaki/],
  ["mexicaans", /mexic|taco|tortilla|burrito|fajita|quesadilla/],
];

export function guessCuisine(draft: ImportDraft): Cuisine {
  const t = `${draft.cuisine ?? ""} ${draft.title} ${draft.ingredients.join(" ")}`.toLowerCase();
  for (const [c, re] of CUISINE_WORDS) if (re.test(t)) return c;
  return "internationaal";
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export interface ImportChoices {
  title: string;
  cuisine: Cuisine;
  protein: Protein;
  prepTime: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  kcal?: number;
  carbs?: number;
  description?: string;
  /** Bestaande id bij bewerken */
  id?: string;
}

export function draftToRecipe(draft: ImportDraft, c: ImportChoices): Recipe {
  const ingredients = c.ingredients.map(parseIngredientLine).filter((i) => i.name);
  const carbs = c.carbs ?? -1;
  const diet: Diet = carbs < 0 ? "normaal" : carbs <= 12 ? "keto" : carbs <= 30 ? "koolhydraatarm" : "normaal";
  return {
    id: c.id ?? `import-${slug(c.title) || "recept"}-${Date.now().toString(36)}`,
    name: c.title.trim() || "Geïmporteerd recept",
    description: c.description?.trim() || (draft.sourceName ? `Recept van ${draft.sourceName}.` : "Zelf toegevoegd recept."),
    cuisine: c.cuisine,
    protein: c.protein,
    proteinLabel: { kip: "Kip", rund: "Vlees", vis: "Vis", vegetarisch: "Vegetarisch" }[c.protein],
    diet,
    method: guessMethod(c.steps, c.title),
    difficulty: "gemiddeld",
    prepTime: Math.max(5, Math.round(c.prepTime)),
    baseServings: Math.max(1, Math.round(c.servings)),
    vegetables: [],
    veggieRich: false,
    isSalad: /salade/i.test(c.title),
    ingredients,
    steps: c.steps.map((s) => s.trim()).filter(Boolean),
    carbsPerPortion: carbs,
    spicy: { tip: "", extras: [] },
    kcalPerPortion: c.kcal,
    image: draft.image,
    source: draft.sourceUrl || draft.sourceName ? { name: draft.sourceName ?? "Website", url: draft.sourceUrl } : { name: "Eigen invoer" },
    imported: true,
  };
}

/** Snel opslaan zonder controleformulier: alles wordt uit het concept afgeleid */
export function quickRecipeFromDraft(draft: ImportDraft, existingId?: string): Recipe {
  return draftToRecipe(draft, {
    id: existingId,
    title: draft.title,
    description: draft.description,
    cuisine: guessCuisine(draft),
    protein: guessProtein(draft.ingredients.map(parseIngredientLine)),
    prepTime: draft.totalMinutes ?? 30,
    servings: draft.servings ?? 4,
    ingredients: draft.ingredients,
    steps: draft.steps,
    kcal: draft.kcal,
    carbs: draft.carbs,
  });
}

/** Concept dat klaarstaat om in het importformulier te openen (bijvoorbeeld via "Aanpassen") */
let pendingDraft: ImportDraft | null = null;
export function setPendingDraft(d: ImportDraft | null): void {
  pendingDraft = d;
}
export function takePendingDraft(): ImportDraft | null {
  const d = pendingDraft;
  // Pas na deze render leegmaken, zodat een dubbele aanroep in de ontwikkelmodus hetzelfde concept krijgt
  if (d) setTimeout(() => (pendingDraft = pendingDraft === d ? null : pendingDraft), 0);
  return d;
}
