# Wat eten we vandaag?

Persoonlijke maaltijdapp voor één huishouden. Iedere dag drie recepten die passen bij het eetprofiel, de dag van de week en de gewenste kooktijd.

## Starten

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run build && npm start` draait de productieversie. `npm run preview:build` maakt een losse HTML-versie in `preview/dist` die zonder server werkt.

## Structuur

```
src/
  app/                     Next.js routes: /, /week, /recept/[id], /boodschappen, /favorieten, /profiel
  app/api/whatsapp/        daily (GET) en webhook (POST), voorbereid voor de WhatsApp-koppeling
  components/              AppState (centrale state), AppShell (tabbalk), RecipeCard, DishArt, ui
  components/screens/      De vijf schermen
  data/recipes/            55 mockrecepten, waarvan 16 in extra-a.ts en extra-b.ts (Japans, Indiaas, Grieks, Mexicaans)
  data/vegetarian/         Vegetarische varianten met vlees of vis apart
  lib/types.ts             Datamodel, tevens basis voor Supabase-tabellen
  lib/selection.ts         Dagelijkse selectie met afwisseling en feedbackregels
  lib/ingredients.ts       Schalen naar 2 of 3 personen, boodschappenlijst samenvoegen
  lib/storage/             DataStore-interface met LocalStorageStore
  lib/whatsapp/            sendDailyWhatsAppRecipes(), handleWhatsAppReply(), provider-interface
preview/                   Losse preview-build (Vite, zelfde schermen, router in het geheugen)
```

## Selectieregels

- Filter op profiel: eiwit, keuken, vermijdlijst (op hele woorden) en maximale kooktijd per dagtype.
- Niet meer: nooit meer voorgesteld. Nog een keer of Was prima: pas na 28 dagen opnieuw.
- Suggesties van de afgelopen 7 dagen komen niet terug.
- Score: kooktijd past bij de dag, keto of koolhydraatarm, veel groenten, salade, favoriete ingrediënten, positieve feedback.
- De drie gerechten worden één voor één gekozen met een strafscore voor dezelfde keuken, hetzelfde eiwit, dezelfde bereiding, dezelfde voedingsstijl en gedeelde groenten.
- De random factor is gebaseerd op de datum, dus de selectie blijft de hele dag gelijk.
- Te weinig kandidaten? Dan vervalt eerst de kooktijdgrens en daarna de 7-dagenregel.

## Naar Supabase

1. Maak tabellen op basis van `src/lib/types.ts` (profiles, favorites, feedback, daily_selections, shopping_recipes).
2. Schrijf een `SupabaseStore` die `DataStore` uit `src/lib/storage/types.ts` implementeert.
3. Wissel in `src/lib/storage/index.ts` de `LocalStorageStore` om.
4. Laad in de API-routes de data van het huishouden in plaats van `createDefaultData()`.

## WhatsApp

- `sendDailyWhatsAppRecipes({ data, recipient, provider })` maakt het ochtendbericht en verstuurt het via een `WhatsAppProvider`.
- `handleWhatsAppReply({ text, data })` verwerkt 1, 2 of 3 en geeft het recept plus boodschappenlijst terug.
- Nu actief: `MockWhatsAppProvider`. Voor productie schrijf je een provider voor Twilio of de WhatsApp Cloud API en roep je `/api/whatsapp/daily` iedere ochtend aan met een cron.
- Op de profielpagina zit een simulator om de flow nu al te testen.

## Keukens en eigen eiwitopties

- Keukens zijn een vrije lijst in het profiel. Standaard staan Italiaans, Spaans, Chinees, Thais en Internationaal aan.
- Japans, Indiaas, Grieks en Mexicaans hebben elk vier recepten en voeg je met één tik toe. Andere keukens kun je ook intypen. Bij elke keuken staat hoeveel recepten er zijn.
- Eigen eiwitopties zoeken op ingrediëntnaam. Staat een optie aan, dan krijgen recepten daarmee voorrang. Staat hij uit, dan worden ze overgeslagen.

## Ik heb zin in

- Zoekveld op het scherm Vandaag. Je typt bijvoorbeeld "pasta", "iets snels met zalm", "curry zonder vlees" of "Aziatisch met kip".
- `src/lib/craving.ts` zet woorden om naar trefwoorden (snel, licht, romig, stoof, keukens, eiwit) en zoekt anders in naam, ingrediënten en omschrijving. Met "zonder" of "geen" sluit je iets uit.
- Gerechten met "Niet meer" en ingrediënten van de vermijdlijst vallen af. Met Kies zet je een gerecht direct op het menu voor vanavond.

## Receptbronnen

- In het profiel voeg je websites met gratis recepten toe, via een snelle suggestie (Allerhande, Jumbo, Leukerecepten, 24Kitchen en meer) of een eigen webadres.
- Bij "Ik heb zin in" en onder ieder recept staan dan zoeklinks naar die sites. `src/lib/sources.ts` maakt daarvoor een Google-zoekopdracht binnen de site, zodat het voor iedere receptensite werkt.
- Een bron die uit staat, wordt niet doorzocht. Recepten van die sites worden niet gekopieerd naar de app.

## Recepten importeren

- Via Favorieten, "Recept importeren" (route `/importeren`), of via de link onder de zoeklinks naar je bronnen.
- **Van een website:** `GET /api/import?url=...` haalt de pagina op de server op en leest de schema.org Recipe-gegevens (JSON-LD) uit. Die hebben bijna alle grote receptensites. Alleen openbare adressen, maximaal 3 MB, 10 seconden. Voor lokaal testen met een eigen testpagina: `IMPORT_ALLOW_PRIVATE=1`.
- **Tekst plakken:** `parseRecipeFromText()` herkent titel, personen, tijd en de kopjes Ingrediënten en Bereiding. Zonder kopjes gelden regels met een hoeveelheid als ingrediënt.
- `parseIngredientLine()` zet regels als "2 1/2 dl kookroom" om naar hoeveelheid, eenheid, naam en categorie. Daardoor werken omrekenen en de boodschappenlijst ook voor geïmporteerde recepten.
- Na een controlestap staat het recept bij Eigen recepten. Het doet mee in de dagelijkse suggesties, het weekmenu, "Ik heb zin in", favorieten en de boodschappenlijst. De bron blijft bewaard en gelinkt. Bewerken en verwijderen kan op de receptpagina.
- Calorieën en koolhydraten komen van de bronsite als die ze geeft, anders van de calorietabel als genoeg ingrediënten bekend zijn. Anders staat er "Onbekend".
- In de losse preview werkt ophalen via internet niet, omdat er geen server is. Tekst plakken werkt daar wel.

## Zoeken op je receptbronnen binnen de app

- Typ je bij "Ik heb zin in" minstens drie letters, dan zoekt de app ook op je receptbronnen uit het profiel.
- `POST /api/source-search` leest per bron de sitemaps (via robots.txt, sitemap.xml of sitemap_index.xml, ook .gz) en zoekt in de recept-URL's naar je zoekwoorden. Per site staan de URL's 12 uur in het geheugen, dus de eerste zoekopdracht duurt langer.
- Met Bekijken haalt de app het recept op via `/api/import` en toont het in de app. Kies voor vanavond of Bewaar en open zet het direct tussen je eigen recepten. Met Eerst aanpassen open je het controleformulier.
- Een site zonder sitemap met recepten wordt overgeslagen. Daar werkt Recept importeren met de link nog wel.
- In de losse preview werkt dit niet, omdat er geen server is.

## Calorieën

- `src/data/nutrition.ts` bevat kcal per eenheid voor alle 209 ingrediënten, op basis van NEVO (RIVM) en USDA.
- `caloriesPerPortion()` in `src/lib/ingredients.ts` rekent per persoon, ook voor de koolhydraatarme en vegetarische versie. Van frituurolie telt 15 procent mee.
- Zichtbaar op de receptkaarten, de receptpagina, het weekmenu en in het WhatsApp-bericht. Het zijn schattingen, afgerond op tientallen.

## Huishouden

- In het profiel pas je per persoon de naam, de smaak (pittig of mild) en de eetstijl aan: vlees en vis, alleen vlees, alleen vis of vegetarisch. Je kunt ook mensen toevoegen of verwijderen.
- Per recept wordt bepaald wie de vegetarische vervanger krijgt. Wie geen vlees eet, krijgt die alleen bij vleesgerechten, en wie geen vis eet alleen bij visgerechten.
- Het blok Maak het pittiger toont wie aan tafel pittig en wie mild eet.

## Wie eet er mee

- Op Vandaag en bij ieder recept zet je Erwin, Dorien en Michelle aan of uit en tel je gasten op, eventueel met vegetarische gasten.
- Het aantal personen en vegetariërs volgt daaruit en wordt gebruikt voor hoeveelheden, de boodschappenlijst en WhatsApp.
- Eet alleen wie van pittig houdt mee, dan meldt het recept dat de pittige extra's door het hele gerecht mogen.

## Weekmenu

- Tab Week toont maandag tot en met zondag, voor deze week en volgende week.
- Voor iedere dag vanaf vandaag worden drie suggesties gemaakt, op volgorde, zodat de 7-dagenregel ook binnen de week geldt.
- Per dag kies je een gerecht. Gekozen gerechten vanaf vandaag zet je in een keer op de boodschappenlijst.
- Profielwijzigingen berekenen alle toekomstige dagen zonder keuze opnieuw.

## Vegetarische versies

- Ieder vlees- of visrecept heeft een `vegetarian`-variant (`src/data/vegetarian/`), gekoppeld op recept-id.
- De basis wordt voor iedereen vegetarisch gekookt. Vissaus, oestersaus en vlees- of visbouillon worden daarvoor vervangen.
- Vlees of vis wordt apart bereid voor wie het eet. De vegetarische eiwitbron wordt geschaald op het aantal vegetariërs.
- In het profiel stel je per persoon in wie vegetarisch eet. Dat is de standaard, en per recept pas je het aantal aan.
- Boodschappenlijst en WhatsApp-berichten rekenen met dezelfde verdeling.

## Foto's

Recepten tonen een getekende placeholder. Vul `image` in bij een recept om een echte foto te gebruiken.
