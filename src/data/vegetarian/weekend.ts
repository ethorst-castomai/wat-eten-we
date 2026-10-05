import type { VegetarianOption } from "@/lib/types";

export const vegetarianWeekend: Record<string, VegetarianOption> = {
  "massaman-curry-rund": {
    substitute: "Kikkererwten",
    meat: ["runderlappen"],
    protein: [{ name: "kikkererwten", amount: 2, unit: "blik", category: "overig" }],
    baseReplaces: ["runderbouillon", "vissaus"],
    baseExtras: [
      { name: "groentebouillon", amount: 250, unit: "ml", category: "kruiden" },
      { name: "sojasaus", amount: 2, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Schroei het rundvlees in een aparte braadpan aan en stoof het daarin 75 minuten met een derde van de kokosmelk, een schep kruidenpasta en wat water tot het mals is. Laat de curry in de grote pan zonder vlees pruttelen en voeg de uitgelekte kikkererwten toe samen met de aardappelen, zodat ze de saus goed opnemen. Schep de curry op alle borden en leg het stoofvlees alleen bij de vleeseters erbovenop.",
  },
  "ribeye-champignonroomsaus": {
    substitute: "Koningsoesterzwammen",
    meat: ["ribeye"],
    protein: [{ name: "koningsoesterzwammen", amount: 500, unit: "g", category: "groente" }],
    baseReplaces: ["runderbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 100, unit: "ml", category: "kruiden" }],
    howTo:
      "Halveer de koningsoesterzwammen in de lengte, kerf de snijkant ruitvormig in en bak ze zes tot acht minuten met de snijkant naar beneden in een hete pan met olie tot ze diep goudbruin zijn. Keer ze om en arroseer ze de laatste minuut met boter, knoflook en tijm, net zoals je met het vlees zou doen. Gril de ribeye in een tweede gietijzeren pan drie tot vier minuten per kant, laat hem vijf minuten rusten en leg de plakken alleen op de borden van de vleeseters.",
  },
  "entrecote-chimichurri": {
    substitute: "Gegrilde halloumi",
    meat: ["entrecote"],
    protein: [{ name: "halloumi", amount: 450, unit: "g", category: "zuivel" }],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Snijd de halloumi in plakken van een centimeter en gril ze twee minuten per kant op de hete grillpan nadat de paprika eraf is. Schep er direct een flinke lepel chimichurri over zodat de kaas de kruiden opneemt. Marineer en gril de entrecote apart in een eigen pan drie minuten per kant, laat hem rusten en verdeel de plakken alleen over de borden van de vleeseters.",
  },
  "courgette-lasagne-rundvlees": {
    substitute: "Vegetarisch gehakt",
    meat: ["rundergehakt"],
    protein: [{ name: "vegetarisch gehakt", amount: 400, unit: "g", category: "overig" }],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Bak het vegetarisch gehakt in de grote pan rul na de groenten en maak daar de ragu mee af met wijn, passata en oregano. Bak het rundergehakt in een aparte koekenpan bruin en kruimelig en roer het door een deel van de ragu, ongeveer een derde van de saus. Bouw een kleine ovenschaal met de vleesragu voor de vleeseters en een grote schaal met de vegetarische ragu, en bak beide even lang in de oven.",
  },
  "spaanse-zeebaars-oven": {
    substitute: "Gebakken feta",
    meat: ["zeebaars"],
    protein: [{ name: "feta", amount: 300, unit: "g", category: "zuivel" }],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Leg de feta in dikke plakken tussen de tomaten en olijven op het deel van de schaal voor de vegetariërs, besprenkel met olijfolie en paprikapoeder en bak hem de laatste twintig minuten mee tot hij zacht en licht gekleurd is. Bak de zeebaarzen in een aparte kleinere ovenschaal met een paar schijfjes aardappel en een scheut wijn, 18 tot 22 minuten op 200 graden. Leg de vis alleen op de borden van de vleeseters en schep bij iedereen de aardappelen en de peterselieolie op.",
  },
  "visstoof-kabeljauw-garnalen": {
    substitute: "Gepocheerde eieren",
    meat: ["kabeljauwfilet", "garnalen"],
    protein: [{ name: "eieren", amount: 6, unit: "st", category: "zuivel" }],
    baseReplaces: ["visbouillon"],
    baseExtras: [
      { name: "groentebouillon", amount: 400, unit: "ml", category: "kruiden" },
      { name: "witte miso", amount: 1, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Los de miso op in de warme groentebouillon en maak daarmee de saus zoals in het recept beschreven. Schep een derde van de saus over in een aparte pan voor de vleeseters en gaar daarin de kabeljauw vijf minuten en de garnalen nog twee minuten mee. Maak in de grote pan zes kuiltjes, breek daar de eieren in en laat ze met het deksel erop zes tot acht minuten pocheren tot het wit gestold en de dooier nog zacht is.",
  },
  "paella-kip-garnalen": {
    substitute: "Witte bonen",
    meat: ["kippendijen", "garnalen"],
    protein: [{ name: "witte bonen", amount: 2, unit: "blik", category: "overig" }],
    baseReplaces: ["kippenbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 900, unit: "ml", category: "kruiden" }],
    howTo:
      "Laat de kip weg uit de paellapan en roer de uitgelekte witte bonen door de sofrito vlak voordat je de rijst erover strooit, zoals de garrofó in een echte Valenciaanse paella. Bak de kip apart in een koekenpan in acht tot tien minuten goudbruin en gaar, en bak de garnalen de laatste twee minuten mee. Leg de kip en garnalen alleen op de borden van de vleeseters, bovenop hun portie paella.",
  },
  "italiaanse-runderstoof": {
    substitute: "Portobello's",
    meat: ["runderlappen"],
    protein: [{ name: "portobello's", amount: 500, unit: "g", category: "groente" }],
    baseReplaces: ["runderbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 300, unit: "ml", category: "kruiden" }],
    howTo:
      "Schroei het vlees in een aparte kleine braadpan aan, blus af met een derde van de wijn en bouillon en stoof het daar 75 minuten met een takje rozemarijn. Maak in de grote pan de stoofsaus zonder vlees en voeg na het afblussen de portobello's in dikke repen toe, die na dertig minuten zachtjes stoven vol van smaak zijn. Schep de paddenstoelenstoof over de puree voor iedereen en geef het stoofvlees met zijn saus alleen aan de vleeseters.",
  },
  "chinese-gestoofd-rundvlees": {
    substitute: "Stevige tofu",
    meat: ["runderlappen"],
    protein: [
      { name: "stevige tofu", amount: 450, unit: "g", category: "overig" },
      { name: "maizena", amount: 1, unit: "el", category: "overig" },
    ],
    baseReplaces: ["runderbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 600, unit: "ml", category: "kruiden" }],
    howTo:
      "Dep de tofu goed droog, snijd in blokken, bestuif met maizena en bak ze in olie rondom goudbruin, waarna je ze pas bij de wortel in de saus legt zodat ze twintig minuten meestoven. Blancheer en karamelliseer het rundvlees in een aparte braadpan en stoof het daarin 80 minuten met een derde van de sojasaus, rijstwijn, kruiden en bouillon. Schep de tofu en saus voor iedereen op en leg het rundvlees alleen bij de vleeseters op de rijst.",
  },
  "thaise-gegrilde-kip-som-tam": {
    substitute: "Gemarineerde tempeh",
    meat: ["kippendijen"],
    protein: [{ name: "tempeh", amount: 400, unit: "g", category: "overig" }],
    baseReplaces: ["vissaus", "oestersaus"],
    baseExtras: [
      { name: "sojasaus", amount: 4, unit: "el", category: "kruiden" },
      { name: "vegetarische oestersaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Maak de marinade met sojasaus en vegetarische oestersaus, verdeel hem over twee kommen en leg de tempeh in plakken van een centimeter in de ene en de kip in de andere. Gril de tempeh vier minuten per kant op middelhoog vuur tot hij mooi gekarameliseerd is, en gebruik voor de som tam sojasaus met een extra kneep limoen. Gril de kip apart 14 tot 18 minuten tot een kerntemperatuur van 75 graden en leg hem alleen op de borden van de vleeseters.",
  },
  "thaise-gestoomde-zeebaars-limoen": {
    substitute: "Zijden tofu",
    meat: ["zeebaarsfilet"],
    protein: [{ name: "zijden tofu", amount: 600, unit: "g", category: "overig" }],
    baseReplaces: ["vissaus", "kippenbouillon", "oestersaus"],
    baseExtras: [
      { name: "sojasaus", amount: 3, unit: "el", category: "kruiden" },
      { name: "groentebouillon", amount: 100, unit: "ml", category: "kruiden" },
      { name: "vegetarische oestersaus", amount: 1, unit: "el", category: "kruiden" },
    ],
    howTo:
      "Leg de zijden tofu in dikke plakken op het citroengras en de gember, schenk de groentebouillon erbij en stoom hem afgedekt tien minuten in de oven tot hij goed warm is. Gaar de zeebaarsfilets in een aparte kleine ovenschaal met een paar limoenschijfjes en een scheut bouillon, 12 tot 15 minuten op 200 graden. Maak de limoen knoflooksaus met sojasaus in plaats van vissaus, schep hem over de tofu en de vis, en leg de vis alleen bij de vleeseters.",
  },
  "kip-cacciatore": {
    substitute: "Witte bonen met burrata",
    meat: ["kippendijen"],
    protein: [
      { name: "cannellini bonen", amount: 1, unit: "blik", category: "overig" },
      { name: "burrata", amount: 2, unit: "st", category: "zuivel" },
    ],
    baseReplaces: ["kippenbouillon"],
    baseExtras: [{ name: "groentebouillon", amount: 150, unit: "ml", category: "kruiden" }],
    howTo:
      "Bak de paprika en champignons in olijfolie in de braadpan, maak de saus af met groentebouillon en laat de uitgelekte cannellini bonen twintig minuten meestoven. Bak de kippendijen apart in een ovenvaste pan op de velkant krokant, schep er wat saus bij en gaar ze 25 minuten in de oven tot het vocht bij het bot helder is. Leg de gescheurde burrata vlak voor het opdienen op de borden van de vegetariërs en de kip alleen bij de vleeseters.",
  },
  "chinese-zoutpeper-garnalen": {
    substitute: "Zout en peper tofu",
    meat: ["garnalen"],
    protein: [
      { name: "stevige tofu", amount: 450, unit: "g", category: "overig" },
      { name: "maizena", amount: 3, unit: "el", category: "overig" },
    ],
    baseReplaces: ["oestersaus"],
    baseExtras: [{ name: "vegetarische oestersaus", amount: 2, unit: "el", category: "kruiden" }],
    howTo:
      "Pers de tofu tien minuten onder een gewicht, snijd in blokjes van twee centimeter, wentel ze door de maizena en frituur ze eerst in drie minuten goudbruin en knapperig. Frituur daarna in dezelfde olie de garnalen in twee porties en laat ze apart uitlekken, zodat ze niet tussen de tofu terechtkomen. Schep de tofu en de garnalen in twee aparte kommen door de knoflook, lente-ui en peperzout, en geef de garnalen alleen aan de vleeseters.",
  },
  "spaanse-ovenkip-saffraan": {
    substitute: "Halloumi",
    meat: ["kippendijen"],
    protein: [{ name: "halloumi", amount: 450, unit: "g", category: "zuivel" }],
    baseReplaces: [],
    baseExtras: [],
    howTo:
      "Snijd de halloumi in dikke plakken, schep ze door een deel van de saffraanmarinade en leg ze de laatste vijftien minuten bovenop de groenten zodat ze goudbruin kleuren. Rooster de kippendijen apart op een kleine bakplaat met de rest van de marinade, 40 tot 45 minuten op 210 graden tot het vocht bij het bot helder is. Verdeel de groenten en olijven over iedereen en leg de kip alleen op de borden van de vleeseters.",
  },
};
