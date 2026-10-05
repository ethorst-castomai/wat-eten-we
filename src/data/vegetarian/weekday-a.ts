import type { VegetarianOption } from "@/lib/types";

export const vegetarianWeekdayA: Record<string, VegetarianOption> = {
  "thaise-groene-kipcurry": {
    substitute: "Stevige tofu",
    meat: ["kipfilet"],
    protein: [
      { name: "stevige tofu", amount: 400, unit: "g", category: "overig", note: "in blokjes" },
      { name: "maizena", amount: 1, unit: "el", category: "overig" },
    ],
    baseReplaces: ["kippenbouillon", "vissaus"],
    baseExtras: [
      { name: "groentebouillon", amount: 150, unit: "ml", category: "kruiden" },
      { name: "sojasaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Dep de tofublokjes droog, wentel ze door de maizena en bak ze in een koekenpan met een scheut olie in zes minuten rondom krokant. Laat de kip in de curry weg en schep de tofu er pas vlak voor het serveren door, zodat hij knapperig blijft. Roerbak de kipreepjes in een aparte pan met een beetje olie vijf minuten op hoog vuur tot ze gaar zijn en leg ze op de borden van de vleeseters.",
  },
  "thaise-beef-salad": {
    substitute: "Koningsoesterzwammen",
    meat: ["biefstuk"],
    protein: [
      { name: "koningsoesterzwammen", amount: 400, unit: "g", category: "groente", note: "in de lengte in plakken" },
      { name: "sojasaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    baseReplaces: ["vissaus"],
    baseExtras: [{ name: "sojasaus", amount: 2, unit: "el", category: "kruiden" }],
    howTo:
      "Bak de plakken koningsoesterzwam in een hete droge pan vier minuten per kant tot ze goudbruin zijn en blus ze af met de sojasaus. Maak de dressing met sojasaus in plaats van vissaus en wat extra limoensap, en schep de warme zwammen door de salade. Bak de biefstuk in een aparte koekenpan op hoog vuur twee tot drie minuten per kant, laat hem vijf minuten rusten en leg de plakken alleen op de borden van de vleeseters.",
  },
  "chinese-kip-cashew": {
    substitute: "Oesterzwammen",
    meat: ["kipfilet"],
    protein: [
      { name: "oesterzwammen", amount: 400, unit: "g", category: "groente", note: "in grove stukken gescheurd" },
      { name: "stevige tofu", amount: 200, unit: "g", category: "overig", note: "in blokjes" },
    ],
    baseReplaces: ["oestersaus"],
    baseExtras: [{ name: "vegetarische oestersaus", amount: 2, unit: "el", category: "kruiden" }],
    howTo:
      "Roerbak de oesterzwammen en tofublokjes in de hete wok in vijf minuten bruin en krokant op de plek waar normaal de kip in gaat, en maak de saus met vegetarische oestersaus. Meng de kipblokjes in een kom met een scheut sojasaus en wat maizena en roerbak ze in een aparte koekenpan met olie vier minuten op hoog vuur tot ze gaar zijn. Schep de kip op de borden van de vleeseters, bovenop de gedeelde wok met cashewnoten.",
  },
  "chinese-beef-broccoli": {
    substitute: "Tempeh",
    meat: ["biefstuk"],
    protein: [
      { name: "tempeh", amount: 350, unit: "g", category: "overig", note: "in dunne plakjes" },
      { name: "maizena", amount: 1, unit: "tl", category: "overig" },
    ],
    baseReplaces: ["oestersaus"],
    baseExtras: [{ name: "vegetarische oestersaus", amount: 3, unit: "el", category: "kruiden" }],
    howTo:
      "Meng de tempehplakjes met de maizena en een scheutje sojasaus en bak ze in de hete wok in vier minuten goudbruin, op het moment dat normaal het vlees erin gaat. Maak de saus met vegetarische oestersaus en schep de tempeh aan het eind terug in de wok. Bak de biefstukreepjes in een aparte koekenpan met olie op hoog vuur anderhalve minuut en leg ze alleen op de borden van de vleeseters.",
  },
  "italiaanse-zalm-citroen-spinazie": {
    substitute: "Halloumi",
    meat: ["zalmfilet"],
    protein: [{ name: "halloumi", amount: 375, unit: "g", category: "zuivel", note: "in plakken van een centimeter" }],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Bak de plakken halloumi in een droge koekenpan op middelhoog vuur twee minuten per kant tot ze goudbruin zijn en knijp er wat citroen over. Leg de halloumi op de spinazie met tomaatjes, waar normaal de zalm komt. Bak de zalm in een aparte pan met een eetlepel olijfolie vijf minuten op het vel en daarna twee minuten op de andere kant, en leg hem alleen op de borden van de vleeseters.",
  },
  "kip-pesto-gegrilde-groenten": {
    substitute: "Burrata en witte bonen",
    meat: ["kipfilet"],
    protein: [
      { name: "burrata", amount: 2, unit: "st", category: "zuivel" },
      { name: "witte bonen", amount: 1, unit: "blik", category: "overig", note: "uitgelekt" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Verwarm de uitgelekte witte bonen drie minuten in een pannetje met een eetlepel pesto en een scheutje olijfolie. Schep de bonen tussen de gegrilde groenten en leg de burrata er pas bij het serveren heel bovenop, zodat iedereen hem openbreekt. Gril de met pesto ingesmeerde kip apart in de grillpan vier tot vijf minuten per kant tot hij gaar is en leg hem alleen op de borden van de vleeseters.",
  },
  "spaanse-knoflookgarnalen": {
    substitute: "Kikkererwten en halloumi",
    meat: ["garnalen"],
    protein: [
      { name: "kikkererwten", amount: 1, unit: "blik", category: "overig", note: "uitgelekt en drooggedept" },
      { name: "halloumi", amount: 225, unit: "g", category: "zuivel", note: "in blokjes" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Bak de kikkererwten en halloumiblokjes vijf minuten in de knoflookolie met het gerookte paprikapoeder tot ze krokant en goudbruin zijn, en maak ze af met peterselie en citroen. Verdeel de knoflookolie vooraf over twee pannen, zodat de vegetarische portie nooit met de garnalen in aanraking komt. Bak de garnalen in de tweede pan twee tot drie minuten op hoog vuur tot ze roze zijn en schep ze alleen op de borden van de vleeseters.",
  },
  "kip-teriyaki-wokgroenten": {
    substitute: "Stevige tofu",
    meat: ["kippendijen"],
    protein: [
      { name: "stevige tofu", amount: 400, unit: "g", category: "overig", note: "in blokjes" },
      { name: "maizena", amount: 1, unit: "el", category: "overig" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Wentel de drooggedepte tofublokjes door de maizena en bak ze in de wok zes minuten tot ze rondom krokant zijn. Schenk twee derde van de teriyakisaus erbij en laat hem twee minuten inkoken tot de tofu glanst. Bak de kippendijen intussen in een aparte koekenpan zes minuten gaar, glazuur ze met de rest van de saus en leg ze alleen op de borden van de vleeseters.",
  },
  "thaise-kip-krapow": {
    substitute: "Oesterzwammen en tofu",
    meat: ["kippendijen"],
    protein: [
      { name: "oesterzwammen", amount: 300, unit: "g", category: "groente", note: "fijngehakt" },
      { name: "stevige tofu", amount: 200, unit: "g", category: "overig", note: "verkruimeld" },
    ],
    baseReplaces: ["oestersaus", "vissaus"],
    baseExtras: [
      { name: "vegetarische oestersaus", amount: 2, unit: "el", category: "kruiden" },
      { name: "sojasaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Roerbak de fijngehakte oesterzwammen en verkruimelde tofu vijf minuten op hoog vuur tot ze rul en goudbruin zijn, precies waar normaal de kip in gaat. Gebruik vegetarische oestersaus en extra sojasaus met een kneepje limoen in plaats van oestersaus en vissaus, en serveer met het gebakken ei. Bak de gehakte kip in een aparte koekenpan met olie en knoflook vijf minuten op hoog vuur tot hij gaar is en schep hem alleen op de borden van de vleeseters.",
  },
  "tom-kha-garnalen": {
    substitute: "Tofu en oesterzwammen",
    meat: ["garnalen"],
    protein: [
      { name: "zijden tofu", amount: 300, unit: "g", category: "overig", note: "in blokjes" },
      { name: "oesterzwammen", amount: 200, unit: "g", category: "groente", note: "in stukken gescheurd" },
    ],
    baseReplaces: ["kippenbouillon", "vissaus"],
    baseExtras: [
      { name: "groentebouillon", amount: 500, unit: "ml", category: "kruiden" },
      { name: "sojasaus", amount: 2, unit: "el", category: "kruiden" },
      { name: "witte miso", amount: 1, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Trek de soep met groentebouillon en breng hem aan het eind op smaak met sojasaus, witte miso en extra limoensap in plaats van vissaus. Laat de oesterzwammen vijf minuten meegaren met de champignons en schuif de tofublokjes er in de laatste twee minuten voorzichtig bij. Schep een paar scheppen soep in een apart pannetje, pocheer de garnalen daarin drie minuten tot ze roze zijn en verdeel ze alleen over de kommen van de vleeseters.",
  },
  "kip-piccata": {
    substitute: "Halloumi",
    meat: ["kipfilet"],
    protein: [{ name: "halloumi", amount: 375, unit: "g", category: "zuivel", note: "in plakken van een centimeter" }],
    baseReplaces: ["kippenbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 150, unit: "ml", category: "kruiden" }],
    howTo:
      "Bak de halloumi in een droge koekenpan twee minuten per kant goudbruin en maak de citroen-kappertjessaus met groentebouillon in plaats van kippenbouillon. Leg de halloumi pas vlak voor het serveren in de saus, zodat hij stevig blijft. Bak de geplette kipfilets in een aparte pan met olijfolie twee tot drie minuten per kant, schep er een paar lepels saus over en leg ze alleen op de borden van de vleeseters.",
  },
  "tagliata-di-manzo": {
    substitute: "Koningsoesterzwammen",
    meat: ["entrecote"],
    protein: [
      { name: "koningsoesterzwammen", amount: 450, unit: "g", category: "groente", note: "in de lengte gehalveerd" },
      { name: "burrata", amount: 1, unit: "st", category: "zuivel" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Kerf de gehalveerde koningsoesterzwammen ruitvormig in, bestrijk ze met olie, rozemarijn en knoflook en gril ze vier minuten per kant tot ze mooie strepen hebben. Snijd ze schuin in plakken over de rucola en leg de burrata in het midden van de schaal. Gril de entrecote in een aparte grillpan drie tot vier minuten per kant, laat hem zes minuten rusten en leg de plakken alleen op de borden van de vleeseters.",
  },
};
