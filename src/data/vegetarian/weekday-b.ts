import type { VegetarianOption } from "@/lib/types";

export const vegetarianWeekdayB: Record<string, VegetarianOption> = {
  "courgetti-garnalen-tomaat": {
    substitute: "Burrata en witte bonen",
    meat: ["garnalen"],
    protein: [
      { name: "burrata", amount: 250, unit: "g", category: "zuivel" },
      { name: "witte bonen", amount: 1, unit: "blik", category: "overig", note: "uitgelekt" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Laat de garnalen in de grote pan weg en schep de witte bonen samen met de kerstomaten erbij, zodat ze in de tomatensappen warm worden. Scheur de burrata vlak voor het serveren in stukken over de courgetti en maak het af met basilicum en citroen. Bak de garnalen in een aparte koekenpan met een eetlepel olijfolie en wat knoflook twee minuten per kant op middelhoog vuur, en leg ze alleen op de borden van de vleeseters.",
  },
  "spaanse-kip-paprika-olijven": {
    substitute: "Krokante kikkererwten",
    meat: ["kippendijen"],
    protein: [
      { name: "kikkererwten", amount: 2, unit: "blik", category: "overig", note: "uitgelekt en drooggedept" },
    ],
    baseReplaces: ["kippenbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 150, unit: "ml", category: "kruiden" }],
    howTo:
      "Bak de kikkererwten in de tweede pan acht minuten in twee eetlepels olijfolie met de helft van het paprikapoeder tot ze knapperig worden, en bak daarna de ui, paprika en knoflook in diezelfde pan met groentebouillon in plaats van kippenbouillon. Bestrooi de kip met zout, peper en een snuf paprikapoeder en bak hem in een aparte koekenpan in tien tot twaalf minuten op middelhoog vuur rondom bruin en gaar. Schep de kip alleen op de borden van de vleeseters, naast de groenten en de aardappeltjes.",
  },
  "chinese-gestoomde-kabeljauw": {
    substitute: "Gestoomde eiercustard",
    meat: ["kabeljauwfilet"],
    protein: [
      { name: "eieren", amount: 6, unit: "st", category: "zuivel", note: "losgeklopt met 300 ml lauw water" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Klop de eieren los met driehonderd milliliter lauw water en een snufje zout, giet het door een zeef in een ondiepe schaal en zet die in de hapjespan naast de paksoi. Stoom de custard met het deksel op een kier twaalf minuten op laag vuur tot hij net gestold is, en giet daarna de sojasaus, de gember, de lente-ui en de hete olie erover. Stoom de kabeljauw in een aparte pan met deksel op een paar stukken paksoi en een centimeter water acht tot tien minuten, en geef hem alleen aan de vleeseters met hun eigen schepje hete olie.",
  },
  "chinese-kip-zwarte-bonen": {
    substitute: "Tempeh",
    meat: ["kipfilet"],
    protein: [
      { name: "tempeh", amount: 350, unit: "g", category: "overig", note: "in dunne reepjes" },
      { name: "sojasaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Bak de tempehreepjes in de wok in een eetlepel olie zes minuten op middelhoog vuur tot ze goudbruin zijn, blus ze af met de sojasaus en schep ze eruit. Doe de tempeh aan het eind terug in plaats van de kip, zodat hij de zwarte bonensaus opneemt. Marineer de kip zoals in het recept, roerbak hem in een aparte koekenpan drie tot vier minuten op hoog vuur gaar en schep hem met een lepel saus uit de wok over de borden van de vleeseters.",
  },
  "thaise-rode-curry-zalm": {
    substitute: "Gebakken tofu",
    meat: ["zalmfilet"],
    protein: [
      { name: "stevige tofu", amount: 400, unit: "g", category: "overig", note: "in blokjes" },
      { name: "maizena", amount: 1, unit: "el", category: "overig" },
    ],
    baseReplaces: ["vissaus"],
    baseExtras: [{ name: "sojasaus", amount: 1, unit: "el", category: "kruiden" }],
    howTo:
      "Dep de tofublokjes droog, wentel ze door de maizena en bak ze in een koekenpan met een scheut olie in acht minuten rondom krokant. Schep de tofu op het moment dat de zalm erin zou gaan door de curry en breng alles op smaak met sojasaus en wat extra limoensap in plaats van vissaus. Gaar de zalm in een klein pannetje met een paar scheppen curry uit de grote pan vijf minuten zachtjes onder een deksel, en schep die alleen op de borden van de vleeseters.",
  },
  "zalm-romesco-broccoli": {
    substitute: "Halloumi",
    meat: ["zalmfilet"],
    protein: [
      { name: "halloumi", amount: 400, unit: "g", category: "zuivel", note: "in plakken van een centimeter" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Leg de plakken halloumi met een kwast olijfolie tussen de broccoli op het moment dat de zalm erbij zou gaan en rooster ze twaalf minuten mee tot de randen goudbruin zijn. De romesco smaakt bij de zoute halloumi net zo goed als bij vis, dus verander verder niets aan de saus. Rooster de zalm op een apart stuk bakpapier of in een kleine ovenschaal twaalf minuten op 210 graden mee in dezelfde oven, en leg hem alleen op de borden van de vleeseters.",
  },
  "kung-pao-garnalen": {
    substitute: "Krokante oesterzwammen",
    meat: ["garnalen"],
    protein: [
      { name: "oesterzwammen", amount: 450, unit: "g", category: "groente", note: "in grove stukken gescheurd" },
      { name: "maizena", amount: 2, unit: "el", category: "overig" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Hussel de oesterzwammen met de maizena en een snufje zout en bak ze in de wok in twee porties in ruim olie vijf minuten op hoog vuur tot de randjes knapperig zijn. Doe de zwammen aan het eind terug in de wok in plaats van de garnalen, zodat ze net met de glanzende saus bedekt raken. Bak de garnalen in een aparte koekenpan met een eetlepel olie twee minuten op hoog vuur tot ze roze zijn, en schep ze bovenop de borden van de vleeseters.",
  },
  "thaise-larb-kip": {
    substitute: "Verkruimelde tofu",
    meat: ["kipgehakt"],
    protein: [
      { name: "stevige tofu", amount: 450, unit: "g", category: "overig", note: "goed uitgeperst en verkruimeld" },
      { name: "sojasaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    baseReplaces: ["vissaus"],
    baseExtras: [{ name: "sojasaus", amount: 2, unit: "el", category: "kruiden" }],
    howTo:
      "Bak de verkruimelde tofu in de koekenpan acht minuten op middelhoog vuur tot hij droog en licht goudbruin is, en blus af met een eetlepel sojasaus. Maak de larb verder zoals in het recept, maar gebruik twee eetlepels sojasaus en wat extra limoensap in plaats van de vissaus. Bak het kipgehakt in een aparte pan zes minuten los en gaar, maak het af met wat limoensap en een deel van de kruiden en zet het apart op tafel voor de vleeseters.",
  },
  "spaanse-gehakt-spitskool": {
    substitute: "Linzen",
    meat: ["rundergehakt"],
    protein: [
      { name: "linzen", amount: 2, unit: "blik", category: "overig", note: "uitgelekt en afgespoeld" },
    ],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Begin de schotel direct met de ui, knoflook en paprika in de olijfolie en roer de linzen samen met de tomatenblokjes erdoor, zodat ze de rokerige smaak goed opnemen. Bak het rundergehakt in een aparte koekenpan zonder extra olie vijf minuten rul en bruin op hoog vuur, met een snuf zout en gerookt paprikapoeder. Schep het gehakt alleen over de borden van de vleeseters en maak alles af met peterselie en Griekse yoghurt.",
  },
};
