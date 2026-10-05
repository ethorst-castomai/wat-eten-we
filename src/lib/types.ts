// Centrale types voor de app. Deze vormen ook de basis voor een latere Supabase-tabelstructuur.

/** Keuken-id, bijvoorbeeld "italiaans" of "japans". Ook eigen toegevoegde keukens zijn mogelijk. */
export type Cuisine = string;
export type Protein = "kip" | "rund" | "vis" | "vegetarisch";
export type Diet = "keto" | "koolhydraatarm" | "normaal";
export type Difficulty = "makkelijk" | "gemiddeld" | "uitdagend";
export type CookingMethod = "wok" | "oven" | "pan" | "stoof" | "grill" | "curry" | "salade";

export type IngredientCategory = "groente" | "vlees" | "zuivel" | "kruiden" | "overig";

export type Unit =
  | "g"
  | "ml"
  | "st"
  | "el"
  | "tl"
  | "teen"
  | "bos"
  | "blik"
  | "snuf"
  | "naar smaak";

export interface Ingredient {
  name: string;
  /** Hoeveelheid voor recipe.baseServings personen. Leeg bij "naar smaak". */
  amount?: number;
  unit: Unit;
  category: IngredientCategory;
  /** Korte toelichting, bijvoorbeeld "in reepjes" */
  note?: string;
}

export interface SpicyOption {
  /** Uitleg hoe Erwin en Dorien het pittiger maken zonder dat Michelle hetzelfde hoeft te eten */
  tip: string;
  /** Extra pittige ingrediënten, apart geserveerd. Komen ook op de boodschappenlijst. */
  extras: Ingredient[];
}

export interface CarbAlternative {
  /** Bijvoorbeeld "Jasmijnrijst" */
  original: string;
  /** Bijvoorbeeld "Extra paksoi en broccoli" */
  alternative: string;
  /** Korte bereiding van het alternatief */
  howTo: string;
  /** Koolhydraten per portie met het alternatief (gram, indicatie) */
  carbsPerPortion: number;
  /** Namen van ingrediënten (exact zoals in recipe.ingredients) die vervallen bij het alternatief */
  replaces: string[];
  /** Ingrediënten die er bij het alternatief bij komen */
  extras: Ingredient[];
}

/**
 * Vegetarische versie van een vlees- of visgerecht.
 * De basis wordt voor iedereen vegetarisch gekookt. Vlees of vis wordt apart bereid
 * en alleen toegevoegd op de borden van wie vlees eet.
 */
export interface VegetarianOption {
  /** Korte naam van de vervanger, bijvoorbeeld "Stevige tofu" of "Halloumi" */
  substitute: string;
  /** Namen uit recipe.ingredients (exact) die apart bereid worden: het vlees of de vis */
  meat: string[];
  /** Vegetarische eiwitbron, hoeveelheden voor recipe.baseServings vegetariërs */
  protein: Ingredient[];
  /** Niet-vegetarische basisingrediënten (vissaus, kippenbouillon, oestersaus) die voor iedereen vervangen worden */
  baseReplaces: string[];
  /** Vervangers voor baseReplaces, hoeveelheden voor recipe.baseServings personen */
  baseExtras: Ingredient[];
  /** Hoe je de vervanger bereidt en het vlees of de vis apart klaarmaakt en toevoegt */
  howTo: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: Cuisine;
  protein: Protein;
  /** Leesbaar label voor de hoofdcomponent, bijvoorbeeld "Garnalen" of "Kabeljauw" */
  proteinLabel: string;
  diet: Diet;
  method: CookingMethod;
  difficulty: Difficulty;
  /** Totale bereidingstijd in minuten */
  prepTime: number;
  /** Aantal personen waarvoor de hoeveelheden gelden */
  baseServings: number;
  /** Belangrijkste groenten, lowercase, gebruikt voor variatie */
  vegetables: string[];
  /** Gerecht bevat veel groenten (minimaal 250 g per persoon) */
  veggieRich: boolean;
  /** Gerecht is (of bevat) een maaltijdsalade */
  isSalad: boolean;
  ingredients: Ingredient[];
  steps: string[];
  /** Indicatie koolhydraten per portie in gram. -1 betekent onbekend (bijvoorbeeld bij een import). */
  carbsPerPortion: number;
  spicy: SpicyOption;
  /** Alleen invullen als het gerecht rijst, aardappel, pasta of noedels bevat */
  carbAlternative?: CarbAlternative;
  /** Vegetarische versie met vlees of vis apart. Ontbreekt bij gerechten die al vegetarisch zijn. */
  vegetarian?: VegetarianOption;
  /** Herkomst van een geïmporteerd recept */
  source?: { name: string; url?: string };
  /** Door de gebruiker geïmporteerd (niet uit de vaste receptenlijst) */
  imported?: boolean;
  /** Bekende kcal per portie, bijvoorbeeld uit de voedingswaarde van de bronsite */
  kcalPerPortion?: number;
  /** Optionele echte foto. Zonder foto toont de app een placeholder. */
  image?: string;
}

export type FeedbackValue = "nog-een-keer" | "prima" | "niet-meer";

export interface FeedbackEntry {
  recipeId: string;
  value: FeedbackValue;
  /** ISO datum (YYYY-MM-DD) */
  date: string;
}

/** Wat iemand eet: alles, alleen vlees (geen vis), alleen vis (geen vlees) of vegetarisch */
export type EatingStyle = "alles" | "vlees" | "vis" | "vegetarisch";

export interface Member {
  name: string;
  likesSpicy: boolean;
  eats?: EatingStyle;
  /** Verouderd, vervangen door eats */
  vegetarian?: boolean;
}

/** Een website met gratis recepten die je als bron gebruikt */
export interface RecipeSource {
  id: string;
  name: string;
  url: string;
  /** Meenemen bij "Zoek ook op" */
  enabled: boolean;
}

export interface Profile {
  householdName: string;
  members: Member[];
  /** Verouderd: aantal personen wordt nu bepaald door wie er mee-eet */
  defaultPersons?: number;
  proteins: Record<Protein, boolean>;
  /** Toegevoegde keukens: aan (true) of tijdelijk uit (false). Niet toegevoegd betekent niet voorgesteld. */
  cuisines: Record<Cuisine, boolean>;
  /** Eigen eiwitopties, bijvoorbeeld "kalfsvlees" of "tonijn". Uit betekent: recepten met dit ingrediënt overslaan. */
  customProteins: { name: string; enabled: boolean }[];
  /** Eigen receptbronnen, zoals Allerhande of 24Kitchen */
  recipeSources: RecipeSource[];
  diet: {
    keto: boolean;
    koolhydraatarm: boolean;
  };
  veggieRich: boolean;
  salads: boolean;
  avoidIngredients: string[];
  favoriteIngredients: string[];
  maxTimeWeekday: number;
  maxTimeWeekend: number;
}

export interface DailySelection {
  /** ISO datum (YYYY-MM-DD) */
  date: string;
  recipeIds: string[];
  /** Gekozen gerecht voor vanavond */
  chosenId?: string;
}

export interface ShoppingRecipe {
  recipeId: string;
  persons: number;
  /** Pittige extra's meenemen */
  includeSpicy: boolean;
  /** Koolhydraatarm alternatief gebruiken */
  lowCarb: boolean;
  /** Aantal personen dat de vegetarische versie eet (vlees of vis apart voor de rest) */
  vegetarians?: number;
}

export interface ShoppingState {
  recipes: ShoppingRecipe[];
  /** Afgevinkte items, op basis van item key */
  checked: Record<string, boolean>;
}

export interface ShoppingItem {
  key: string;
  name: string;
  amount?: number;
  unit: Unit;
  category: IngredientCategory;
  recipeIds: string[];
}

export interface Diners {
  /** Namen van gezinsleden die mee-eten */
  present: string[];
  /** Aantal gasten */
  guests: number;
  /** Aantal gasten dat vegetarisch eet */
  vegetarianGuests: number;
}

/** Alle opgeslagen gebruikersdata */
export interface AppData {
  profile: Profile;
  /** Wie eet er vandaag mee */
  diners: Diners;
  favorites: string[];
  feedback: FeedbackEntry[];
  selections: DailySelection[];
  shopping: ShoppingState;
  /** Zelf geïmporteerde recepten */
  importedRecipes: Recipe[];
  /** Recepten die de app vandaag zelf op je bronnen heeft ontdekt */
  discovered?: { date: string; drafts: import("./import/parse").ImportDraft[] };
}
