# Fyndplats – SEO-polera en produkt

> **Körbar instruktion.** Följ stegen i ordning; alla API-anrop är bekräftade och ifyllda, så
> du behöver inte slå upp något schema.
>
> **Den är skriven för Aosom-utkast** — det är de ~5 500 tyska drafts som ligger i
> poleringskön och alltså allt dagligt arbete. AliExpress-rader poleras med samma fjorton
> steg; det som skiljer står under [AliExpress-rader](#aliexpress-rader-vad-som-skiljer).
> Kolla leverantören först: mappningsradens `supplier`, eller prefixet `aosom:` i
> `supplierProductId`.

## Fasta fakta

- Butik **Fyndplats**, site ID `e6d27e90-4749-4720-9afe-0bbe91c1b3d3`, **Catalog V3**.
  (V1-siten `8c62127f-…` ska INTE användas.)
- Allt innehåll skrivs på **svenska**.
- **Rör inte priset.** Importen sätter det och prissättningen är Leonards beslut, inte
  poleringens. Räkna ingen marginal, höj inget pris. Priser slutar på **9**, hela kronor,
  avrundat uppåt — aldrig `,90`.
- Frontend är headless Next.js/Vercel och uppdateras via **ISR — ingen redeploy**.
- Frontend läser `seoData`-taggarna `title` + `meta description` → sidans `<title>` och meta.
  `Product`-JSON-LD och OpenGraph **genereras automatiskt** ur produktfälten; du behöver inte
  sätta `og:`-taggar.

### ☠️ Katalogen nås BARA via Wix-kopplingen — det finns ingen nyckel i miljön (2026-09-05)

Anropen går genom kopplingens `wix.request`. Det finns **ingen `WIX_API_TOKEN` i
sessionens skal** — nycklarna bor i Vercel-produktionen. Ett rakt anrop mot
`www.wixapis.com` svarar därför `403` med kroppen `{"message":"","details":{}}`, och
**exakt samma svar kommer utan `Authorization`-huvud**. Felet avslöjar alltså inte att
nyckeln SAKNAS snarare än är fel — det ser ut som ett behörighetsproblem hos Wix.

☠️ **Och `ListConnectors` kan ljuga i den riktning som kostar mest tid.** Uppmätt
samma dag: kopplingen svarade `connected: true, enabledInChat: true` medan **inga
`wix`-verktyg alls fanns laddade** i sessionen. Kontrollen som faktiskt biter är att
söka efter verktygen, inte att fråga om kopplingens status.

⚠️ **Är verktygen borta går INGET steg att köra.** Steg 1, 3, 5, 6, 7, 8, 9, 10, 11,
12 och 13 rör alla katalogen. Någon nyckel-lös omväg finns inte: `CRON_SECRET` är märkt
Sensitive och `EXTENSION_API_TOKEN` bor bara i Vercel, så workflow-vägen når enbart de
rutter som redan är byggda (mappningsraden, prisreparationen) — aldrig produkt-API:t.
Rätt åtgärd är att be Leonard slå på Wix-kopplingen för chatten igen, inte att leta
efter en nyckel att klistra in. Poleringen väntar; en halvfärdig runda skadar ingen.

### Märken: strippa husmärken, behåll etablerade

*(Leonards beslut 2026-06-21.)* Råimporten lägger märkesnamnet först i titeln.

- **Dropship-husmärken** — HOMCOM, Outsunny, PawHut, Aiyaplay, SucceBuy, VEVOR, Giantex,
  Costway, Tobbi, Aosom … (strip-listan i `lib/import/sku.ts`): ta bort **helt** ur
  produktnamn, SEO-titel, meta, slug, sökord och alla alt-texter. Det generiska sökordet
  står först.
- **Etablerade märken med eget sökvärde** (Pagani Design, LAIKOU): **behåll** i
  namn/titel/slug/sökord/SKU och lägg det generiska ordet bredvid. De ligger medvetet inte i
  strip-listan.
- Sätt inga separata märkesfält. Strippas märket och `brand` är ifyllt: rensa det
  (`"brand": null`) i samma Steg 7-PATCH.
- Osäker på om ett märke är husmärke eller etablerat? **Behåll det och flagga till Leonard.**

🔒 **Bildpolering rör bakgrunden, aldrig varan** *(Leonards regel 2026-08-06)*. Vi tvättar bort
det som är **pålagt i bildfilen** — overlay-text, banderoller, vattenstämplar. Varan ska synas
exakt som kunden får den, inklusive **loggor som sitter fysiskt på den** (tryckta, graverade,
gjutna). Ett husmärke på godset är inget problem och ska inte flaggas: *"om märket sitter
fysiskt på varan så gör vi inget åt det, det är så produkten ser ut."* **Avgörande-test:**
skulle det synas om du fotade varan själv efter uppackning? → rör den inte.

### 🔒 Skriv aldrig ut avsändarland eller lagerland

*(Leonards regel 2026-08-15.)* Inte i beskrivningen, inte i spec-tabellen, inte i meta.
Mappningsraden bär `shipsFromCountries`, `warehouseClass` och `variants[].shipFrom` — de
styr EU-lager-ribbonen och failover-logiken, och **ribbonen är den enda plats där
avsändarlandet får synas**.

⚠️ Raden överlever en omskriven beskrivning om du bygger spec-tabellen ur den råa: nio
publicerade produkter bar `Skickas från · Spanien/Polen` som sista rad 2026-08-27, för att
den råa spec-listan användes som mall. **Sök på `Skickas från` i slutkollen.**

### API-fällor som kostar tid

- Skriv `fields` i request-**body** vid query/PATCH. **Läs om `revision` precis före varje PATCH.**
- ⚠️ **`fields`-fällan:** på GET fungerar `?fields=X` och repeterade `?fields=A&fields=B`. En
  **kommaseparerad** lista 400:ar med det missvisande `Failed to parse JSON or deserialize
  protobuf message` — felet ser ut att gälla bodyn men sitter i URL:en.
- ☠️ **`wix.request` tar kroppen i `body` — `data` SLUKAS TYST** *(uppmätt 2026-09-10)*.
  Med `data` lyckas anropet, Wix svarar 200 med standardprojektionen, och allt du
  skickade — markör, filter, `limit` — fanns aldrig i förfrågan. Uppmätt på `limit: 5`:

  | kroppsfält | rader tillbaka |
  |---|--:|
  | `data` · `json` · `payload` | 100 |
  | **`body`** | **5** |
  | `body` som JSON-STRÄNG | `400 Expected an object` |

  Det förklarar uppgift #404:s "svepet läste samma sida 30 gånger": markören låg i
  en kropp som aldrig skickades, inte på fel nivå i den. Och det gjorde felet omöjligt
  att felsöka — `search.cursorPaging`, toppnivå och `search.paging` gav alla 100 rader,
  eftersom ingen av dem nådde fram.

  🔒 **Pröva att kroppen biter innan du mäter något med den.** `limit: 5` mot ett API
  som svarar 100 är den billigaste kontrollen som finns. Samma familj som en läsare
  som blir TOM: ett fel fältnamn ger ett friskt svar, inte ett fel.
- ✅ **`fields: ["PLAIN_DESCRIPTION"]` ligger på KROPPENS TOPPNIVÅ i `products/search`**,
  bredvid `search`, inte inuti den. Uppmätt samma dag: 5 623 av 5 623 produkter kom
  tillbaka med `plainDescription` ifylld. (`VARIANTS_INFO` finns däremot inte som enum
  — en enskild GET ger `variantsInfo` i standardprojektionen ändå.)
- ☠️ **Wix SKRIVER OM beskrivningens markup vid sparning** *(uppmätt 2026-09-07)*. Det du
  skickar är inte det som lagras:

  | skickat | lagrat |
  |---|---|
  | `<strong>X</strong>` | `<span style="font-weight: 700">X</span>` |
  | `<li>text</li>` | `<li><p>text</p></li>` |
  | `<a href="…">` | `<a href="…" target="_self">` |
  | 4 605 tecken | 5 328 tecken |

  Den SYNLIGA texten är oförändrad, så transkriptionshashen stämmer exakt — och det är
  precis därför omskrivningen är osynlig i den vanliga verifieringen. Hashen är alltså
  blind för **markup** på samma sätt som den är blind för **länkar**.

  🔒 **Härled aldrig en syskonsidas text ur det Wix lagrat.** Ett substrängsbyte mot
  `<strong>Färg:</strong> vit` matchar noll gånger i den lagrade texten. Härled ur den
  LOKALA källan, där formen är den man själv skrev, och låt hashen grinda före skrivningen.
- ☠️ **En `variantsInfo`-PATCH ERSÄTTER varianten** *(uppmätt 2026-09-07)*. `price` är
  obligatoriskt — utan det svarar API:t `400 … price must not be empty` — och varje fält du
  inte skickar med FÖRSVINNER.

  🔒 **Läs varianten omedelbart före skrivningen och eka tillbaka `price` oförändrat**,
  precis som `updateV3VariantPrices` måste eka tillbaka `visible`. Priset är Leonards
  beslut, inte poleringens; jämför beloppet efteråt mot det du läste.

  ☠️ **Variantens `media` FALLER BORT VID VARJE SÅDAN PATCH — även när du ekar tillbaka
  den ordagrant** *(skärpt 2026-09-07, runda 99)*. Runda 98 mätte att den inte gick att
  REPARERA i efterhand; runda 99 skickade med hela mediaobjektet — `id`, `altText`,
  `mediaType` och `image` — på sju produkter som ALLA hade media kvar, och fick
  `media: null` på alla sju. Det är alltså inte en reparationsbegränsning utan fältets
  beteende: `variantsInfo` skriver aldrig `media`.

  Sluta försöka. På en envariantsprodukt utan val är kundeffekten noll — sidan renderar
  galleriet och `media.main`, och alla sju live-sidorna visar rätt bilder. Vill du ha
  svensk alt-text på variantminiatyren är `variantsInfo` fel väg.

  ☠️ **OCH DEN PUBLICERAR UTKASTET — även en ren SKU-skrivning** *(uppmätt 2026-09-07)*.
  Sju utkast gick från `visible:false` till `visible:true` av en PATCH vars enda avsikt var
  att byta SKU. Fällan är känd för prisreparationen (`CLAUDE.md`), men Steg 8 gör exakt
  samma anrop och hade ingen vakt. Sidorna låg publicerade med rätt text men FEL galleri
  (leverantörens tyska bildset) tills de sattes tillbaka.

  🔒 **Skicka därför alltid `visible` uttryckligen i Steg 8:s PATCH** — produktens `false`
  om du inte är klar, `true` om du är det. Och eftersom `visible` i masken KASKADERAR ner
  till varianten (se avsnittet i Steg 4) måste variantens `visible: true` med i samma
  anrop. Verifierat båda vägarna: mask `["visible","variantsInfo"]` med produkt `false` +
  variant `true` ger en osynlig produkt med en köpbar variant.
- **`VARIANTS_INFO` finns inte i enum:et** (varianterna kommer med ändå — bekräftat 2026-09-07:
  en naken `GET /products/{id}` bär hela `variantsInfo` med `id`, `sku`, `price`, `media`,
  `choices` och `inventoryStatus`, medan `?fields=VARIANTS_INFO` svarar
  `400 Failed to parse JSON or deserialize protobuf message`). Giltiga värden:
  `PLAIN_DESCRIPTION` · `DESCRIPTION` · `MEDIA_ITEMS_INFO` · `DIRECT_CATEGORIES_INFO` ·
  `VARIANT_OPTION_CHOICE_NAMES` · `URL` · `INFO_SECTION` · `BREADCRUMBS_INFO` ·
  `INFO_SECTION_PLAIN_DESCRIPTION` · `CURRENCY` · `MERCHANT_DATA` ·
  `SUBSCRIPTION_PRICES_INFO` · `WEIGHT_MEASUREMENT_UNIT_INFO`.
  ⚠️ **`INFO_SECTION` ensamt ger bara rubrikerna** — id, uniqueName och title, med tomt
  innehåll. Vill du läsa spec-flikarnas TEXT måste `INFO_SECTION_PLAIN_DESCRIPTION` med
  också. *(Uppmätt 2026-08-30.)*
- ⚠️ **Ett `filter` får INTE följa med på en cursor-sida.** Skickar du samma
  `{filter, cursorPaging}` på sida 2 svarar V3 **400 `INVALID_CURSOR`: "Sort or filter can
  not be specified together with cursor"**. Sida 1 går igenom, sida 2 fäller — så ett svep
  som testats på en liten katalog går sönder först när den vuxit förbi 100 rader. Skicka
  filtret bara på första sidan och filtrera resten i koden, eller hämta allt och sålla
  lokalt. *(Uppmätt 2026-08-29 på ett sökordskrock-svep över 5 397 produkter.)*
- ☠️ **`/products/search` sväljer `filter` och `cursorPaging` som ligger på toppnivån.**
  Hela frågan ska ligga inne i ett `search`-objekt:
  `{ search: { filter, sort, cursorPaging } }`. Skickas de utanför svarar V3 **200 OK** och
  kastar dem **utan ett ord** — inget fel, ingen varning. Följden är att `visible:false`
  aldrig appliceras OCH att markören står stilla: varje sida returnerar samma första 100
  produkter, så en loop kan snurra 49 varv, rapportera 4 900 lästa rader och i själva verket
  ha läst de första hundra 49 gånger. Totalerna ser rimliga ut eftersom de är
  sidor × 100 — det är dubbletter, inte täckning.
  *(Uppmätt 2026-08-30: en sökning efter tyska julutkast svarade "0 träffar" över 49 sidor.
  Rätt kroppsform gav 4 282 utkast och 29 julprodukter i ETT svep.)*
  **Kontrollen som avslöjar det:** samla `id` i ett `Set` och jämför `set.size` mot antalet
  lästa rader, och jämför den returnerade markören mot den du skickade in — är de identiska
  snurrar du på stället. Samma lärdom som `Promise.allSettled` i `media.ts` och den tysta
  prisskrivningen: **ett svar utan fel är inget kvitto.**
- ⚠️ **`fields` måste med på VARJE cursor-sida.** Utelämnas det på sida 2+ kommer fältet
  tillbaka **tomt i stället för att fela** — ett svep rapporterade 650 produkter med noll
  bilder, inklusive sådana som just patchats till fem.
- ☠️ **`DESCRIPTION` och `PLAIN_DESCRIPTION` är två OLIKA fält, och fel val läser tomt.**
  `?fields=DESCRIPTION` returnerar rich content-objektet `description` och lämnar
  `plainDescription` **tom sträng** — inget fel, bara en annan projektion. Klart-kriteriet
  i runda 38 rapporterade därför `len: 0` på alla åtta, medan bilder, kategorier och
  SKU:er lästes tillbaka korrekt i samma anrop. Mätt på `cdb043b4` 2026-09-02:
  `DESCRIPTION` → `plainDescription` 0 tecken, `PLAIN_DESCRIPTION` → 3 077, exakt det
  väntade talet. **Begär `PLAIN_DESCRIPTION` när du räknar tecken.** Samma familj som
  `MEDIA_ITEMS_INFO`: ett fält som saknas i begäran syns som ett tomt värde, inte som ett
  fel — och ett tomt värde ser i ett svar precis ut som en förlorad skrivning.

  ☠️ **Och en sen TEXTRÄTTELSE är där fällan blir dyr.** Ett rättelseskript som ankrar
  mot `product.description` läser `undefined` på en vanlig GET — fältet kommer inte med
  utan projektion — och `(p.description || "")` gör då en tom sträng av det. Utan assert
  hade PATCH:en skrivit **en tom beskrivning till tre publicerade sidor**, och svaret
  hade sagt OK. Uppmätt 2026-09-04 på tre medicinskåp: `typeof description === "undefined"`,
  `längd 0`, medan `plainDescription` var 2 644 tecken i samma produkt.
  **Ankra rättelser mot `plainDescription`, hämta det med `fields=PLAIN_DESCRIPTION`,
  och låt varje ankare ASSERTA att det finns exakt en gång innan något skrivs.**
  Asserten är det som gör skillnad mellan ett avbrutet skript och tre tömda sidor.
- ☠️ **Mappningsraden nås inte via Wix Data längre.** Den bor i Postgres sedan
  2026-09-01 och `FyndplatsMappings` är tömd. Läs och skriv den med workflowen
  **Polering — läs och stämpla mappningsraden** (Steg 3 och 13). De gamla
  fallgroparna här — eventually consistency och "typade" värden
  (`setFieldOptions.value = {boolValue:false}`) — gäller inte den vägen: rutten
  läser tillbaka och verifierar att skrivningen faktiskt tog.
- En PATCH är partiell **på fältnivå i produkten** — men skicka alltid `visible` explicit
  (Steg 13), och rör aldrig `options`/`variantsInfo` om du inte menar att ändra varianterna.
- ☠️ **`wix.request` skickar request-bodyn under `body` — `data` slukas TYST (2026-09-05).**
  Fällan är att SVARET läses som `r.data`, så `data:` ser ut att vara nyckeln åt båda
  hållen. Det är den inte: bodyn under `data` når aldrig API:t, och V3 svarar då med
  sin DEFAULTSIDA — inget fel, ingen varning. Uppmätt samma anrop, tre nycklar:

  | nyckel | rader | träffar på filtret |
  |---|--:|--:|
  | `data` | 100 | 2 |
  | **`body`** | **5** | **5** |
  | `json` | 100 | 2 |

  Symtomen är exakt de två som redan står ovan, och det är därför de är lätta att
  feldiagnosticera: **filtret verkar ignoreras** (98 av 100 namn matchade inte
  `$startsWith`, och 38 av 100 var `visible:true` trots `visible:false`) OCH
  **markören står stilla** (`cursors.next` kom tillbaka IDENTISK med den som
  skickades in, i alla fyra kroppsformer). En hel förmiddag kan gå åt till att
  prova om paginering som aldrig var problemet. **Kontrollen är densamma: räkna
  unika id och jämför den returnerade markören mot den du skickade — men leta
  efter `data:` i anropet innan du felsöker paginering.**

  ⚠️ `$contains` finns inte på `name` i `/products/search` (`400 … non allowed
  operator`). `$startsWith` fungerar. Är operatorn fel svarar API:t alltså
  ordentligt — det är bara den tysta bodyn som inte gör det.

- ☠️ **`products/query` svarar 200 med SAMMA 50 rader i all evighet om bodyn inte är
  `query`-wrappad.** Rätt form är `{query: {filter, sort, cursorPaging}}`. Skickar du
  fälten på toppnivå — vilket ser rimligt ut och är vad varje annan V3-rutt tar — så
  **ignoreras filter, sort OCH cursor tyst**: inget fel, ingen varning, bara defaultsidan
  om och om igen. Uppmätt 2026-09-01: 20 sidor gav 1 000 rader varav **50 unika**, och
  `limit: 100` respekterades inte heller (50 kom tillbaka).

  Det farliga är inte att svepet blir kort — det är att det blir **falskt negativt**. Ett
  sökordskrock-svep över katalogen rapporterade *noll* hundvagnar i en butik som hade nio
  publicerade, och hade den siffran fått stå kvar hade den här omgången publicerat en
  dubblett av en levande sida. Samma dag ignorerades ett `filter: {slug: "..."}` på samma
  sätt och returnerade en helt orelaterad produkt nio gånger i rad.

  **Kontrollen är en rad:** räkna unika id, inte rader. Är `unika < rader` paginerar du inte.
  Och när ett svep säger "noll träffar" i en kategori du vet finns — misstro svepet först.
- ☠️ **`list-categories-for-items` svarar med `directCategoryIds` — INTE `categoryIds`.**
  Läser du fel fältnamn får du `undefined`, `|| []` gör en tom lista av det, och
  verifieringen rapporterar **"noll kategorier" på åtta produkter som alla har tre**.
  Uppmätt 2026-09-08 i runda 105: skrivningen svarade `totalSuccesses: 2` per produkt,
  och kontrollen sa ändå FEL på alla åtta. Det rätta svaret är
  `{categoriesForItems: [{item: {catalogItemId, appId}, directCategoryIds: [...],
  indirectCategoryIds: [...]}]}` — och `item`, inte `itemReference`.

  ⚠️ Kroppen är dessutom `{treeReference, items: [...]}` med **`items`**, och
  `bulk/categories/add-item` tar `{treeReference, item, categoryIds}` — alltså EN vara
  till FLERA kategorier, inte tvärtom. Båda felformerna 400:ar tydligt, så de kostar en
  runda men inget tyst.

  ☠️ **OCH ADRESSERNA ÄR OSYMMETRISKA — läsningen har INGET `bulk/`.** Rätt par:

  | | adress |
  |---|---|
  | skriva | `POST /categories/v1/**bulk**/categories/add-item` |
  | läsa | `POST /categories/v1/categories/list-categories-for-items` |

  Runda 106 antog att läsningen låg under `bulk/` som skrivningen och fick **404** två
  gånger i rad. En 404 säger "either the URL did not match an API route, or … a resource
  referenced in your request does not exist" — alltså precis det som gör den lätt att
  feldiagnosticera som ett felaktigt produkt-id. Det var adressen. Facit står i
  API-spec:en (`SearchWixAPISpec` på Stores Categories listar alla 22 metoderna med
  publika adresser); gissa inte utifrån syskonmetodens form.

  **Regeln, samma familj som `MEDIA_ITEMS_INFO` och `PLAIN_DESCRIPTION`: ett fältnamn
  som inte finns läses som TOMT, inte som fel** — och en tom lista ser i en grind exakt
  ut som en misslyckad skrivning. Skriv ut det RÅA svaret innan du felsöker skrivningen.

- ☠️ **Ett media-item tar `id` ELLER `url` — och `url` betyder EXTERN adress.** Skickar
  du `{image: {url: "https://static.wixstatic.com/..."}}` svarar V3 **400 `id or url must
  not be empty`**: fältet ligger på item-nivå, inte inuti `image`. Och hade det gått
  igenom med en wixstatic-adress hade Wix **omimporterat varenda bild** till en ny fil
  (se `CLAUDE.md`). Bilder som redan ligger i Media Manager skickas som
  `{id: "b379ce_…~mv2.jpg", altText: "…"}`. 400:an är alltså skyddet, inte problemet.
- ☠️ **Wix normaliserar `<strong>` till `<span style="font-weight: 700">` vid lagring.**
  Det är där `+21 tecken per fetstilspar` kommer ifrån: `<strong></strong>` är 17 tecken,
  `<span style="font-weight: 700"></span>` är 38. Följden: **textkirurgi på en redan
  skriven produkt måste matcha den LAGRADE formen, inte källformen.** Ett utbyte skrivet
  mot `<p><strong>Fråga?</strong></p>` matchar aldrig, och felet ser ut som att texten
  saknas. Uppmätt 2026-09-02: sex av sju rättelser tog, den sjunde var en FAQ-fråga.
- ☠️ **Alt-texten skrivs på ITEM-nivå, inte inuti `image`.** Fältet heter
  `media.itemsInfo.items[].altText` (typen `ProductMedia`). Skickar du den som
  `items[].image.altText` — där du LÄSER den på en oputsad produkt — **släpps den tyst**:
  PATCH:en går igenom, `image.url` kommer tillbaka korrekt, och alt-texten är borta. Både
  din nya och den importen hade satt. Uppmätt 2026-09-01 på åtta produkter: 42 av 43 bilder
  utan alt efter en PATCH som rapporterade full framgång.

  Verifiera med en separat re-GET och räkna **tomma** alt-texter, inte bilder.

**Input:** Wix-produkt-ID.

-----

## Aosom-rader: de fyra skillnaderna

### 1. Bilderna: bara tre av fem behöver granskas

Importen tar hem exakt fem bilder, från feedens positioner **1, 2, 3, 8 och 9**
(`RENA_BILDPOSITIONER` i `to-product.ts`). Urvalet finns för att **46 % av feedens bilder har
TYSK TEXT INBRÄND i pixlarna**, och mätningen bakom det (30 produkter, 269 handgranskade
bilder) säger var texten sitter:

| galleriplats | feedposition | mätning |
|---|---|---|
| 1 | 1 | **30/30 rena** — huvudbild på vit botten. Granska inte. |
| 2 | 2 | **30/30 rena** — livsstilsbild. Granska inte. |
| 3 | 3 | 23/30 — måttritning, ofta bara siffror, ibland en tysk rubrik i ett band |
| 4 | 8 | 24/30 — detaljfoto, ibland en tysk marknadsgrafik |
| 5 | 9 | 27/29 — detaljfoto |

**Kontaktkartan i Steg 4 behöver alltså bara avgöra tre bilder.** Utfallet varierar kraftigt:
tunneltältet `e4b000fa` hade tysk text på tre av fem, de två infravärmarna på noll. Siffrorna
i ritningarna är dessutom redan skrivna med **decimalkomma** (`5,3 m`, `104,6 cm`), så en ren
måttritning går rakt in i galleriet.

### 2. `Lieferumfang` är kontraktet — titeln är marknadsföring

Den tyska beskrivningen har tre block, och de är inte lika mycket värda:

- **`Lieferumfang:`** — vad som faktiskt ligger i kartongen. Auktoritativt.
- **`Technische Daten:`** — måtten. Auktoritativt, och **enda källan**: feedens
  `Specification`-kolumn är tom i 5 550 av 5 566 rader.
- **Titel, `Beschreibung:` och alt-texterna** — marknadsföring, och de motsäger de andra två.
  Infravärmaren `9c7c6e95` hade `Schutzhülle` i både titel och alt-text; dess `Lieferumfang`
  listar bara värmare och bruksanvisning. Det är syskonet `96a45e2b` som har höljet. Hade
  titeln fått bestämma hade vi lovat en kund ett tillbehör som inte kommer.

☠️ **Och det behöver inte vara en hel kategori — det kan vara ETT ord i ett
sammansatt tyskt substantiv.** Tre av åtta "Gasgrill" i runda 44 var **planchor**:
släta stekhällar utan galler. Tecknet fanns i texten hela tiden —
`Antihaft-Grill**platte**`, inte `Grill**rost**` — men det syns först när man vet att
man ska leta. Bild 1 avgjorde på en sekund: en hel svart plåt, inga stavar. Sökordet
blev `plancha gasol` i stället för `gasolgrill`, och det ordet var dessutom helt
obesatt i katalogen medan `gasolgrill` fick fem andra sidor.

☠️ **Och titelns KATEGORIORD kan vara falskt, inte bara tillbehören.** Aosom
sökordsstoppar titlarna: av 22 utkast som bär "Gaming Stuhl" eller "Gamingstuhl" var
**sex inte gamingstolar alls** (2026-09-02). Fyra är mesh- eller chefsstolar vars
brödtext bara handlar om `Arbeitstag`, `Büro` och `Homeoffice`, och vars miljöbilder
visar ett vanligt kontorsskrivbord med en iMac. En sjätte har `1 x Relaxsessel` i
`Lieferumfang` och en ingress om massage efter en lång dag.

Ordet i titeln säger alltså ingenting om vad varan ÄR. Det som avgör är `Lieferumfang`
plus bild 1 och 2 — och de två bilderna är gratis att titta på, till skillnad från en
halvskriven text som måste kastas. **Läs titelns kategoriord som en hypotes, inte som
ett faktum.**

☠️ **Färgtvillingar av en publicerad sida avgörs på VARJE siffra, inte på titeln.** Samma
runda: fem utkast var färgvarianter av tre levande sidor. Bevis var inte namnlikhet utan
att 65 × 65 × 121–129, sits 50 × 49, sitthöjd 45,5–53,5, rygg 80 × 53,5 × 5, nackstöd
28 × 19 × 10, svank 30 × 19 × 8, fotpall 34 × 21 × 6, armstöd 23 cm och 120 kg stämde
*alla* mot den publicerade. Den publicerade sidan listade dessutom själv "vit, svart,
rosa eller himmelsblå" — de fyra utkasten ÄR de färgerna.

⚠️ Den listan är i sig ett fel att flagga: sidan lovar fyra färger men har EN variant mot
ETT artikelnummer. Att lova ett val kunden inte kan göra är ett sortimentsbeslut, inte
en poleringsfråga.

☠️ **Och ett falskt kategoriord kan peka rakt in i en publicerad sida.** Av åtta
odlingslådor 2026-09-02 hade **tre** ordet `Frühbeet` (drivbänk) i titeln medan
`Lieferumfang` bara listade lådan och en anvisning — inget lock, ingen duk, ingen
båge. Bild 3–5 bekräftade: en öppen låda. Att tro på titeln hade gjort två fel på
en gång: fel produkttyp till kunden, OCH sökordet `drivbänk`, som redan bärs av den
publicerade `drivbank-120x60-cm`. Testet är detsamma som för `Gaming Stuhl` —
`Lieferumfang` plus bild 1 och 2 — men konsekvensen är dubbel när det falska ordet
råkar vara ett vi redan rankar på.

Kapacitetspåståenden ska **mätas, inte kopieras**: tältet hette "4 Personen" medan
tillverkarens egen skiss sa "Schlafplätze 2–4". Sovrummet är 295 cm brett — fyra liggunderlag
à 60 cm med 55 cm över. Skriv måttet, inte marknadssiffran.

### 3. Tre steg är no-ops — och ett kräver extra kontroll

| Steg | För en Aosom-rad |
|---|---|
| 6 och 11 (varianter) | En enda variant utan optioner. Inget att sanera, inget `linkedMedia`. |
| 14 (recensioner) | Finns inte att hämta — Akamai spärrar. Se steget. |
| 7 (spec-tabellen) | ⚠️ **Extra kontroll:** `Färg`-VÄRDET står kvar på tyska i den svenska tabellen (`Färg: Orange+Blau`). Etiketterna översätts vid import, värdena inte, och färg-grinden ser bara variantaxlar — ingen spärr fångar det. Översätt för hand. |

### 4. Stäm av priset mot mappningen innan du börjar

Grinden räknas nu **åt dig** av workflowen ovan (läge `las`), ur samma
`roundPrice`-funktion som prissättningen själv använder — så den kan inte drifta
från regeln. Läs `prisgrind` i svaret:

```
  landedCostSek 2869.76
  forvantat     3449        <- charm9(2869,76 x 1,20)
  faktiskt      3449
  stammer       true
```

**`stammer: false` → jobbet stannar där.** Kostnaden har ändrats sedan importen
och priset i Wix är gammalt. **Rör inte priset** — välj en annan produkt och
flagga raden till Leonard. Workflowen avslutar med `exit 1` så det inte går att
missa.

☠️ **`EJ AVGORBAR` är också ett stopp, inte ett OK.** Saknas underlaget (ingen
variant, eller noll i kostnad/pris) svarar grinden `null` i stället för att
gissa. En grind som svarar "stämmer" på tomma tal är värre än ingen grind.

☠️ **Grinden gäller bara Aosom-rader.** Prisregeln sattes 2026-08-27 och gäller
bara nya importer — en AliExpress-rad från före dess följer den GAMLA regeln
(1,28 × kostnad + 60) och kan aldrig matcha den nya. Uppmätt 2026-09-01 på två
verkliga produkter:

| rad | kostnad | regeln säger | Wix har | vad det betyder |
|---|---:|---:|---:|---|
| Aosom `2861bf83` | 2 843,40 | 3 419 | 3 699 | **verklig drift** → blockera |
| AE `61d84189` | 860,37 | 1 039 | 1 119 | äldre prisregel → **inget driftbevis** |

Workflowen skiljer dem åt: en Aosom-rad som faller ger `::error::` och verklig
drift, en icke-Aosom-rad ger `::warning:: EJ AVGORBAR`. **Rådet är detsamma i
båda fallen — rör inte priset** — men skälet är olika, och en grind som skyller
drift på en produkt vars pris bara är äldre än regeln lär man sig att ignorera.

`aosomFreightShare` säger hur mycket av inköpet som är frakt. Över **0,5** kostar frakten mer
än varan — de produkterna poleras sist.

-----

## Arbetsordning

Kör i denna ordning. **Publicering ligger sist** — allt annat verifierat först.

| # | Steg | Vad |
|---|---|---|
| 1 | Sökord | Preliminärt; låses i Steg 7 efter bildkollen |
| 2 | **Laglighetsgrind** | Får produkten alls säljas? Före allt arbete |
| 3 | Läs produkten | `revision`, `name`, `slug`, `seoData`, `visible`, `media` |
| 4 | Bildgenomgång | Kontaktkarta av hela galleriet — styr sökord, copy, alt-texter |
| 5 | **Verifiera påståenden** | Text mot bilder och mot tillverkarens egen uppgift |
| 6 | Variantsanering | *Aosom: no-op* |
| 7 | Text | namn, slug, `seoData`, beskrivning |
| 8 | SKU | Re-synka till den nya sluggen |
| 9 | Bilder | Ordning, alt-texter, egna kort |
| 10 | Kategori | Förälder **+** löv |
| 11 | Varianter | *Aosom: no-op* |
| 12 | **Läs sidan som kund** | Inte som kontrollant |
| 13 | Publicera | `visible:true` — sista handlingen |
| 14 | Recensioner | *Aosom: finns inte* |
| — | Klart-kriterium | Körs före Steg 13 |

**Fördjupning i egna filer:** [`polish/bildmetoder.md`](polish/bildmetoder.md) (hjälte-,
tvätt- och kortmetoder) och [`polish/varianter.md`](polish/varianter.md) (variantmekanik).
Reglerna står här — mekaniken där. [Katalogsvepen](#katalogsvep--återkommande-underhåll-inte-per-produkt)
sist i dokumentet är periodiska kontroller över hela katalogen, inte moment i en polering.

### ☠️ Räkna en kategori på HUVUDORDET, aldrig på förekomst (2026-09-02)

Att välja batchens kategori börjar med en mätning: hur många tyska utkast finns det, och hur
många publicerade sidor täcker dem redan? Den mätningen är trivial att göra fel.

Vid urvalet till batch 51 gav ett `Regal`-uttryck **75 hyllutkast** och knappt en publicerad
hylla — en tom kategori, alltså. Av de 40 dyraste träffarna var **inte en enda en hylla**:
`Küchenschrank mit Regalen`, `Stehlampe mit Regalen`, `Geräteschuppen mit Regalböden`,
`Werkzeugwagen`, `Katzentoilette mit 3-Ebenen-Regal`, `Roll-Schreibtisch mit Regalen`,
`Aktenschrank`, `Hochbeet`. `Regal` stod som EGENSKAP, inte som produkttyp.

Samma fälla i två varianter till, i samma mätning: `Schreibtisch` gav fjorton träffar varav
åtta var `Schreibtischstuhl` — en helt annan möbel — och `Konsolentisch` gav åtta träffar som
faktiskt var åtta konsolbord.

**Regeln:** kräv att produkttypen är HUVUDORD, alltså att namnet BÖRJAR med den
(`/^Konsolentisch/`), och filtrera bort sammansättningar som byter produkttyp
(`Schreibtisch` men inte `…stuhl`). Aosoms titlar sätter alltid produkttypen först och
räknar upp egenskaperna efter — den ordningen är det som gör huvudordskravet pålitligt.

**Och läs alltid ut kandidaterna innan du bestämmer dig.** Felet syntes inte i siffran; det
syntes när de 40 dyraste skrevs ut med namn. En kategorimätning utan namnlista är en gissning.

### ☠️ …men huvudordsregeln har en blind fläck: ett LEDANDE ADJEKTIV (2026-09-05)

Regeln ovan skyddar mot att `Regal` räknas när ordet står som egenskap. Den skyddar
inte åt andra hållet, och det felet är dyrare: **ett adjektiv före produkttypen gör
familjen osynlig för mätningen.**

Uppmätt vid urvalet till runda 62:

| mätning | träffar |
|---|--:|
| `^Kniestuhl` (huvudord) | **7** |
| `/Kniestuhl\|Kniehocker/` var som helst i namnet | **17** |

De tio som föll bort heter `Ergonomischer Kniestuhl…`, `Ergonomischer, schaukelnder
Kniehocker…`. Familjen är alltså mer än dubbelt så stor som huvudordsräkningen sa —
och hade den fått avgöra hade knästolarna sorterats bort som en småfamilj.

⚠️ **Ledande adjektiv är sällsynta i katalogen men KONCENTRERADE till vissa
familjer.** Mätt över 1 029 utkast: 3,7 % börjar med ett adjektiv ur listan
`Ergonomischer · Klappbarer · Runder · Moderner · Drehbarer · Künstlicher ·
Verstellbarer · Faltbarer · Elektrischer · Kleiner`. I knästolsfamiljen var andelen
**59 %**. Det är ingen slump: adjektivet står först just när det ÄR säljargumentet —
ergonomisk, hopfällbar, roterande — och då är hela familjen drabbad samtidigt.

**Regeln: mät med BÅDA.** Huvudordet avgör vad som får RÄKNAS (det stänger ute
`Regal` som egenskap), delsträngen avgör vad som får HITTAS. Kör delsträngen först,
skriv ut namnen, och stryk de träffar där ordet står som egenskap i stället för som
produkttyp. Ordningen spelar roll: en familj som aldrig hittades kan ingen namnlista
rädda.

⚠️ **Räkna med att en dryg fjärdedel av utkasten redan finns publicerade.** Matstolarna i
batch 53 gav den hittills högsta uppmätta andelen: **4 av 14** var identiska på alla tre
axlar med sidor som redan låg ute (`matstol-i-bojtra-75-cm`, `matstol-i-manchester-armstod`,
`matstolar-2-pack-konstlader-svart`, plus en intern). Det är precis den dubblettklass
CLAUDE.md beskriver — 595 av 1 004 mappningsrader är Aosom-varor köpta via AliExpress — och
den syns bara om måtten jämförs. Ett utkast som ser nytt ut i feeden kan vara en sida vi
säljer sedan månader.

> 🗂️ **Poleringskön ljuger — verifiera mot Wix innan du väljer produkt.** `needsAiPolish`
> nollställs inte alltid, så kön blandar råa utkast med sedan länge färdiga produkter
> (2026-08-11: 49 poster, 13 verkligt opolerade). Filtrera på `visible === false` **och** att
> namnet saknar å/ä/ö. Läs dessutom om produkten precis innan du börjar — en annan session
> kan ha hunnit före.

-----

## Steg 1 – Välj fokussökord (avgör allt annat)

Välj det svenska sökord folk faktiskt söker på, sammansatt av **huvudord + kvalificerare**, t.ex. `starthjälp bil`. **Lås inte valet förrän du sett bilderna (Steg 4)** — bilderna avgör ofta vad produkten *faktiskt* är.
**Ringa in den exakta produkttypen, inte den breda kategorin.** Använd ordet för vad produkten *faktiskt är* (formen/typen), inte en generisk grupp – t.ex. `sadelstol` (inte "arbetsstol"), `hopfällbar massagebänk` (inte "möbel"). Det specifika ordet har oftast högre köpintention och mindre konkurrens, och matchar vad köparen söker.
**Validera ordet mot verklig sökdata — men bara när det behövs.** `web_search` på 2–4 svenska kandidatord kostar mer än det ger på självklara produkter (`golvlampa`, `trehjuling`, `dammsugare`). **Kör den bara vid (a) tveksam produkttyp** — flera rimliga svenska ord, eller du är osäker på vad varan egentligen är — **eller (b) sökordskrock** (se nedan). Då: se vilket ord **etablerade svenska återförsäljare använder som kategori-/produktnamn** (Biltema, Jula, Clas Ohlson, Mekonomen, Thule, Amazon.se, branschspecialister) samt Googles autocomplete/relaterade sökningar. Kategoriordet de stora aktörerna använder i sina titlar har oftast högst sökvolym → välj det som huvudord (`isMain`), lägg de näst bästa som relaterade sökord. Exempel: `taklastkorg` är en giltig sammansättning, men återförsäljarna kategoriserar produkten som **takkorg / lastkorg** → huvudord blir `takkorg bil`, med `lastkorg`/`taklastkorg` som relaterade.

> ⚠️ **Kolla ALLTID sökordskrock mot katalogen innan du låser ordet — detta steget hoppas aldrig över.** Två produkter som slåss om samma sökord kannibaliserar varandras ranking, och det upptäcks inte förrän båda ligger live. Fyra krockar på en session (2026-08-10/11): två snurrstolar, två julgranar, två växthus, **tre** barnmotorcyklar.
>
> ```
> POST /stores/v3/products/query   { "query": { "filter": { "slug": { "$in": ["<kandidat-slug>", …] } } } }
> ```
> ☠️ **Kvittot på svepet är `cursor === null`, inte radantalet.** Ett svep med en
> loopgräns ser exakt likadant ut som ett svep som tog slut: båda returnerar rader
> och inget fel. 2026-09-02 gav en loop på 28 sidor **2 800 produkter** och
> `noll krockar` för odlingslådor — 28 × 100 är precis taket, så läsningen var
> AVHUGGEN. Hela katalogen är **5 467** (1 597 publicerade, 3 870 utkast), och när
> svepet kördes klart fanns **åtta** publicerade konkurrenter, bland dem
> `odlingslada-metall`, `odlingslada-med-spalje-3-plan-grantra` och
> `drivbank-120x60-cm`. Åtta nya sidor hade kannibaliserat sex levande.
>
> Returnera därför alltid `avhuggen: !!cursor` ur svepet och kräv `false`, och
> kör i etapper om ≤30 sidor (ExecuteWixAPI har 60 s) genom att skicka markören
> vidare. Samma klass som `queryAll` som tyst kapade — **en halv katalog som ser
> komplett ut.**

> ☠️ **`slug` har OLIKA FORM på query och på GET — och fel form läser tomt, inte fel.**
> `POST /products/query` returnerar `slug` som en **naken sträng**; `GET /products/{id}`
> returnerar den som ett **objekt** `{ name: "…" }`. Ett svep som gör `p.slug.name` på
> query-svaret får därför `undefined` på varje rad, `|| ""` gör det till tomma strängar,
> och kollisionskontrollen rapporterar **noll krockar över hela katalogen** utan ett enda
> fel. Uppmätt 2026-09-03: ett svep över alla 5 467 produkter gav noll publicerade
> trädgårdsbord; med `typeof p.slug === "string" ? p.slug : p.slug.name` gav samma svep
> **nio** — `runt-tradgardsbord`, `tradgardsbord-aluminium`,
> `utdragbart-tradgardsbord-80-160-cm`, `tradgardsbord-tra-vagnshjul-110-cm` med flera.
> Åtta nya sidor hade kannibaliserat nio levande, och rundan blåstes av på grund av det.
>
> Läs alltid `typeof p.slug === "string" ? p.slug : ((p.slug && p.slug.name) || "")`, och
> **kräv att svepet hittar minst en känd publicerad sida** innan du litar på ett "noll
> krockar". Samma familj som markören ovan och som `queryAll` som tyst kapade: felet är
> inte att svaret är fel, utan att det är TOMT — och ett tomt svar från rätt API mot rätt
> katalog ser i koden exakt likadant ut som ett friskt.
>
> ⚠️ **`slug` tar bara LIKHET — `$startsWith` avvisas.** Fältet är en
> `HashedString` i V3, så `{slug: {$startsWith: "hundebox"}}` ger
> `400 INVALID_FILTER: Operator is not compatible with type in field path`
> (uppmätt 2026-09-03). Bara `$eq` och `$in` fungerar, alltså bara slugs du
> redan känner. Ska du hitta alla utkast i en produktgrupp finns ingen genväg:
> svep katalogen och filtrera i koden.
>
> Sluggen är filtrerbar (`name` är det INTE). Träff, eller en produkt du vet ligger nära → **separera med en kvalificerare som står i BÅDE namn, slug och titel**, inte bara i texten. Fungerande exempel: `arbetsstol med hjul` vs `sadelstol med ryggstöd` · `konstgjord julgran` vs `konstgjord julgran med pynt` · `litet växthus` vs `växthusduk` · `elmotorcykel barn` vs `elmotorcykel 6v barn` vs `eldriven trehjuling barn`. Är produkterna i praktiken samma vara → det är en dubblett, inte ett sökordsproblem: flagga till Leonard.
>
> ☠️ **Och avgör det på MÅTTEN, inte på namnet.** Den farliga dubbletten är intern: 595 av
> katalogens mappningar är Aosom-varor inköpta via AliExpress, och de bär ett AE-listnings-id
> som dubblettspärren omöjligt kan matcha mot ett Aosom-artikelnummer. De två raderna ser ut
> som olika produkter i varje id-baserad kontroll som finns. Det enda som avslöjar dem är
> spec-tabellen.
>
> Jämför **fyra tal** mot den publicerade sidan: yttermått, hopfällt mått, en invändig
> dimension och vikten. Stämmer alla fyra på decimalen är det samma vara — då finns det
> ingen kvalificerare i världen som gör två sidor rätt, för de har samma foton och samma
> siffror, och det är precis den dubbletten Google straffar.
>
> ☠️ **Och tvillingarna sitter ofta i UTKASTSHÖGEN, inte mot en publicerad
> sida.** Av sjutton hundburar 2026-09-03 var fem dubbletter av varandra: tre
> med identiska 98 × 58 × 61, innermått 94 × 50 × 58, stavavstånd 5,8 cm och
> vikt 27,6 kg (Weiß, Grau, Nussbaum), och ett par på 94 × 60 × 71,5 där bara
> vikten skilde (29 mot 27 kg — sannolikt ett skrivfel). Ingen id-baserad
> kontroll kan se det: de har olika artikelnummer och är olika varor för
> leverantören. **Jämför fyra tal mellan utkasten INNAN du väljer batch**, inte
> bara mot katalogen — annars publicerar man tre sidor med samma foton samma
> dag. En poleras, resten flaggas som ett sortimentsbeslut: ska de vara tre
> sidor eller en produkt med tre färgval?
>
> Uppmätt 2026-09-01: dragvagnen `ca84c48b` var på väg att publiceras när den visade sig
> vara `7b344636` (*Hundvagn för liten hund*, live sedan tidigare) — identisk på 53 × 45 × 28,
> hopfälld 55 × 45,5 × 21, sele 20–35 cm, dyna 49,5 × 32, handtag 75 cm och 5-tumshjul.
> Sökordssvepet hade dessutom sagt "noll krockar" på grund av `query`-fällan ovan. Utkastet
> lämnades opublicerat och gick till Leonard som ett sortimentsbeslut: den publicerade sidan
> är slutsåld i båda färgerna och 100 kr billigare.

> ☠️ **I en tät kategori räcker inte sökordskrocken — mät MÅTTEN.** Sökordskollen hittar
> produkter med samma namn. Den hittar inte samma produkt under ett annat namn, och i en
> kategori med hundratals utkast är det det vanliga fallet. Metoden är mekanisk: plocka
> `Gesamtabmessungen` ur varje utkast och `Mått:`-raden ur varje publicerad produkt i samma
> kategori, och jämför B/D/H maskinellt. Kontorsstolarna 2026-09-02: av de sju första
> kandidaterna var **tre** dimensionella tvillingar till redan publicerade sidor — `e1a46c56`
> matchade `kontorsstol-med-fotstod` på alla fem tal inklusive vilomåtten, och `0945e4dd`
> matchade `kontorsstol-fotstod-sammet` på 80 × 80 × 106–114. Av 193 utkast var merparten
> färg- och storlekssyskon, inte 193 produkter.
>
> ⚠️ **Men en måttmatchning är ett SÅLL, inte en dom.** Vid standardmått ger ±2 cm på tre axlar
> falska träffar: samma stol "matchade" två helt olika publicerade produkter. Avgör alltid med
> BILDERNA — måttritningarna sida vid sida är det som verkligen skiljer. Så föll `127b4726`:
> ritningarna visade samma chassi, samma uppfällbara armstöd och samma fotstöd som den
> publicerade nätstolen. Det var grå version av en svart vi redan säljer, och det syntes inte
> i något tal.

**Regel:** båda orden MÅSTE hamna i **titel, produktnamn (H1) och slug** – annars flaggar Wix SEO-assistenten dem som röda. Ordet finns redan grönt i beskrivning/meta om det står i texten.
Specs får bara komma från känd importdata eller `web_search` (AliExpress-sidor är JS-blockerade). **Hitta inte på siffror.**

-----

> 🔗 **Kolla samtidigt om produkten har syskon i katalogen.** Samma svep som letar
> sökordskrock visar om vi säljer närbesläktade varor. Har den det: ge varje sida sin
> egen vinkel (`kapselmaskin 3-i-1` · `kapselmaskin rostfri` · `kapselmaskin med
> touchpanel` · `kapselmaskin 5-i-1`) **och lägg en korshänvisning i löptexten** som
> skickar kunden rätt när den här modellen inte passar. Åtta kaffemaskiner fick åtta
> distinkta vinklar 2026-08-22/23 — men bara för att de polerades samma dag. Poleras
> syskon veckor isär sker det inte av sig självt.


-----

### ☠️ Dubblettgrind mot det som REDAN är publicerat — mät på bilden, inte på namnet

Runda 47 (hundvagnar, 2026-09-03). Familjen valdes för att den var stor i utkastshögen:
42 tyska `Hundewagen`-utkast. Ett svep över de PUBLICERADE sidorna visade sedan
**arton hundvagnar som redan ligger live** — polerade i en tidigare runda, från
AliExpress-sidan av katalogen.

Det är CLAUDE.md:s kända hål, i praktiken: `~586 produkter vi redan säljer är
Aosom-varor inköpta via AliExpress`. Dubblettspärren vid import nycklar på
`supplierProductId` och kan inte se dem — de bär ett AE-listnings-id. **Poleringen är
det enda stället där den dubbletten kan fångas**, och Steg 1 hade ingen sådan kontroll.

⚠️ **Namnlikhet är INTE bevis — och den ljuger åt båda hållen.** Fyra av åtta utkast
hade en publicerad sida med nästan samma svenska namn:

| utkast | publicerad sida med liknande namn | lägsta bildskillnad | dom |
|---|---|---:|---|
| `ca84c48b` | `hundvagn-liten-hund` | **0,10** | DUBBLETT |
| `56dc1ed5` | `hundvagn-blir-barvaska-2-i-1` | 8,72 | annan produkt |
| `2038f2aa` | `hundvagn-75-cm-liggyta-20-kg` | 41,07 | annan produkt |
| `f9fb33f0` | `cykelvagn-hund-2-i-1-20-kg` | 28,98 | annan produkt |

Namnen sa fyra dubbletter. Bilderna sa **en**. Två produkter kan dela koncept,
viktgräns och till och med mått utan att vara samma vara — och en enda byte-identisk
bild avgör frågan på en sekund.

**Grinden, som ska köras i Steg 1 innan något skrivs:**

1. Svep de PUBLICERADE sidorna och plocka ut familjen (namn + slug).
2. Ligger det redan tio-tjugo sidor där är familjen i praktiken klar — välj en annan.
   Mät var luckan finns i stället för att anta den (runda 47: `trädgårdsskåp`
   hade 18 utkast mot **1** publicerad sida, `hundvagn` 42 mot 18).
3. För varje kandidat: jämför dess bilder mot de publicerade sidornas.
   `abs(gray(a)-gray(b)).mean()` på 320 × 320 — **under 1,0 är samma bild**, och då
   är det samma fysiska produkt. Polera den inte; två egna URL:er med samma foton är
   den dubblett Google faktiskt straffar.

### ☠️ Pixelgrinden BEVISAR en dubblett — den utesluter ingen. Måtten gör det (2026-09-03)

Grinden ovan skrevs efter hundvagnarna, där bilden avgjorde rätt fyra gånger av fyra.
Nästa runda visade andra halvan av samma mynt. `c9a24404` (utkast, 1 809 kr) är samma
fysiska vara som den publicerade `redskapsskap-grantra-115-cm` (2 109 kr): 75 × 56 × 115 cm,
invändigt 68 × 50 × 112, två hyllplan 34 × 46,5 cm, 6 kg per hylla, lutande asfalttak, hasp.
**Lägsta bildavstånd mellan de två: 15,65** — femton gånger över tröskeln 1,0.

Skälet är strukturellt, inte otur: de två inköpsvägarna har **olika fotouppsättningar av
samma vara**. AliExpress-listningen och Aosom-feeden fotograferar var för sig. Ett avstånd
under 1,0 bevisar därför fortfarande en dubblett — men ett avstånd över 1,0 bevisar
ingenting alls.

**Kör därför båda grindarna, i den här ordningen:**

1. **Bredda familjesvepet först.** En grep på `redskapsbod` gav 12 publicerade sidor;
   `redskap|tradgardsskap|forrad|forvaringsbox|utomhusskap|verktygsskap|skjul|bod-|-bod`
   gav **30** — och den saknade sidan var just dubbletten. Familjen heter olika saker:
   `plastbod`, `platbod`, `vedbod`, `redskapsbod`, `redskapsskap`, `tradgardsskap`,
   `plastskjul`, `forvaringsbox`. **Ett stamord räcker aldrig.**
2. **Måttgrinden** — den som faktiskt fäller. Skrapa varje publicerad familjesidas
   `Yttermått` och jämför kandidatens tre yttermått mot varje sidas cm-tal:

   ```python
   tal = {float(m.group(1).replace(",", "."))
          for m in re.finditer(r"(\d{1,3}(?:[,.]\d)?)(?=\s*(?:cm|[x×]))", sidtext)}
   traff = sum(1 for v in (b, d, h) if any(abs(v - x) <= 1.0 for x in tal))
   # 3/3 = dubblettmisstanke · 2/3 = nära · annars unik
   ```

   Runda 47: de åtta som blev kvar fick **max 2/3**, den kända dubbletten **3/3**.
3. **Pixelgrinden** som snabb bekräftelse när måtten träffar, och som fångst av det som
   delar foton utan att dela spec.

☠️ **Kör måttgrinden med den kända dubbletten som KONTROLL** (`--kontroll`-läge). En grind
som inte fäller på ett fall du vet är sant är inte mätt, bara skriven — samma regel som
mutationstestet i Steg 12.

⚠️ **Det som faktiskt hittade dubbletten var karusellen "Liknande produkter" på en
syskonsida.** Namnet stod där, och specifikationstabellen bekräftade det. Läs den
karusellen när du sveper familjen; den känner till syskon som en slug-grep missar.

☠️ **En dubblett ska INTE raderas härifrån.** Den publicerade sidan kan vara billigare
(runda 47: den live-lagda kostade 629 kr, utkastet 729 kr), ha fler varianter eller
mer historik. Vilken av de två som ska bort är ett affärsbeslut med ett inköpspris i
sig — flagga den för Leonard och gå vidare.

### ☠️ Räkna familjen på DISTINKTA produkter — färgtvillingarna är inte lucka (2026-09-03)

Runda 48. Ett svep gav **37 agility-utkast mot 1 publicerad sida**, vilket ser ut som den
största luckan i katalogen. Den var det inte. Av de 37 var:

| kluster | antal | vad som skilde |
|---|---:|---|
| Hopphinder 4-pack, `L99 × B65 × H94` | **5** | bara färgen (vit, gul, ljusblå, grön, blå) |
| Hundvippa `180 × 30 × 30`, 30 kg | **4** | bara färgen |
| Bilramp `41,5 × 15 × 80,5` paket | **3** | bara färgen — och redan täckt av två publicerade sidor |
| Bågset `82 × 19 × 19`, 4,5 kg | 2 | bara färgen |
| Hinderset `104 × 27 × 21`, 4,5 kg | 2 | **identiska**, 799 mot 829 kr |
| Balansbom `335 × 55 × 60`, 14 kg | 2 | bara färgen |
| A-hinder `113 × 65 × 12,5` paket | 2 | bara färgen |

Kvar: **~15 distinkta produkter.** Att polera "familjen" hade betytt sju sidor med samma
foton och samma spec — den interna dubbletten Google straffar, skapad av oss.

**Måttgrinden ska alltså köras i BÅDA riktningarna**: mot de publicerade sidorna *och*
mellan utkasten inbördes, före batchvalet. Paketmåttet duger som nyckel — det är samma
kartong för hela färgfamiljen.

☠️ **Ta med MATERIALSTRÄNGEN i jämförelsen — den kostar ingenting och den fäller.**
`cc7ab001` matchade den publicerade `agilityset-hund-3-delar` på hopphinder
`128 × 23 × 9–100 cm`, hoppring `9–75 cm` **och** material (`ABS, PE, polyester`) — ordagrant
samma sträng i båda spec-tabellerna. Tre tal plus materialet är ett starkare bevis än tre tal,
och materialraden står redan i båda tabellerna. Utkastet lämnades opolerat och gick till
Leonard: den publicerade sidan kostar 689 kr, utkastet 789 kr.

### ☠️ En krock i den EGNA batchen löses med ett bättre ord, inte med en kvalificerare

Två av runda 48:s produkter ville båda ha huvudordet `hundvippa`: en agilityvippa på 180 cm
och en 80 cm lång vaggande bräda som också är en hundtrappa. Runbookens vanliga recept är en
kvalificerare i namn, slug och titel — `hundvippa-agility-180-cm` mot
`hundvippa-trappa-2-i-1-80-cm`. Det hade fungerat, men det är två sidor som slåss om samma
ord i all evighet.

Den bättre lösningen var att **leta upp det exakta ordet för den andra varan**. Den vaggande
underdelen ÄR en balansbräda — ett etablerat svenskt ord inom hundträning — så den fick
`balansbräda hund` som eget huvudord och `hundvippa` blev fritt. Noll krock, två sidor som
rankar på var sitt ord, och den mer specifika sidan fick ett ord med högre köpintention.

**Leta efter det exakta ordet innan du delar ett generiskt.** En kvalificerare är
andrahandsvalet, inte förstahandsvalet.

### Tre fynd ur hundvagnarna som gäller oavsett vem som polerar dem

- ☠️ **En tillkopplad cykelkärra har ett svenskt utrustningskrav.** Transportstyrelsen,
  ordagrant: *"En tillkopplad cykelkärra ska ha en röd reflex bakåt eller en baklykta
  som kan visa rött ljus bakåt om reflex saknas."* Säljs en hundvagn som cykelvagn ska
  det stå — som ett positivt villkor med egen rubrik, inte som en varningsruta.
- ☠️ **Leverantören varnar själv för dörrbredden på ett syskon.** `f9fb33f0`:s
  måttbild bär texten *"Die Gesamtbreite des Produkts beträgt 68 cm … Mindestens 71cm"*.
  En annan modell i samma runda (`3bc2f3f7`, 70 cm bred) påstår i stället
  *"passt bequem durch Standardtüren"* — sant om tyska dörrar, inte om ett svenskt
  M7-karmhål. **Skriv bredden, aldrig påståendet.**
- **En liten "framdörr" kan vara en matlucka.** `d3006426` anger framdörr 27 × 20 cm
  för en hund på 20 kg, vilket ser ut som ett fel i specen. Leverantörens egen bild
  visar vad det är: en lucka att mata och klappa genom. Utan bildgranskningen hade
  måttet antingen kopierats som "dörr" eller strukits som orimligt — båda fel.

## Steg 2 – Laglighetsgrind (före allt annat arbete)

**Kör den FÖRE bild- och textarbete.** Tre produkter raderades halvpolerade 2026-08-10/11 —
grinden hade sparat hela det arbetet. Gäller bara klasserna nedan; känner du inte igen någon,
gå vidare till Steg 3.

### Djurbostäder — Jordbruksverkets SJVFS 2019:15 (L80)

Aktuellt för Aosom: PawHut-sortimentet är fullt av burar, hus och inhägnader. Minimimåtten är
**bindande i Sverige** och många burar är för små.

| Djur | Krav |
|---|---|
| Fågel ≤20 cm | 0,31 m² golvyta · längsta sida ≥0,7 m · höjd ≥0,6 m |
| Guldhamster | 0,12 m² · kortaste sida ≥25 cm · höjd ≥20 cm · hjul ≥28 cm (dvärg ≥20) |
| Kanin ≤2 kg | 0,5 m² ensam / 0,3 m² per djur i grupp |
| Kanin 2–3,5 kg | **0,7 m²** / 0,35 m² |
| Kanin 3,5–4,5 kg | 0,8 m² / 0,40 m² |
| Kanin 4,5–6 kg | 0,9 m² / 0,45 m² |
| Kanin >6 kg | 1,0 m² / 0,5 m² |

Kaninens minsta höjd är 0,5 m (liten) till 0,9 m (stor). **Utgå från 0,7 m²** när
leverantören inte anger vikt — det är normalstor sällskapskanin, och "marknadsförd för
1–2 kaniner" ger ändå 0,7 (2 × 0,35). Kaninen ska dessutom ha en **hylla** att sitta på och
under (8 kap. 21 §), men hyllan räknas inte in i ytan.

⚠️ **Hyllplan och våningar räknas INTE in i golvytan** — bara bottenytan, och höjden mäts per
delyta. En yta under ett upphöjt hus som bara är 32 cm hög uppfyller inte höjdkravet.

### Hundburar — SJVFS 2020:8 (L 102) formar TEXTEN, inte försäljningen

Aktuellt för Aosom: `hundebox` är 17 utkast, och möbelhundburen är en av de
största produktgrupperna i sortimentet. Huvudregeln i svensk djurskyddsföreskrift
är att **en hund inte får hållas i stängd bur inomhus**. Ska buren stå framme som
hundens plats ska dörren **tas bort eller förankras permanent i öppet läge** — det
räcker inte att lämna den olåst. Stängd dörr gäller de undantag föreskriften
räknar upp: transport, utställning, prov, tävling, träning och jakt.
*(Jordbruksverket SJVFS 2020:8, i kraft 2020-06-15; Länsstyrelsens faktablad
"Hund och katt i bur"; SKK "Hund i bur".)*

☠️ **Det är ingen stoppklass.** Burarna säljs lagligen i Sverige (Jula, Arken
Zoo), och grinden fäller ingenting. Det är en **hård gräns som är en del av
köpet** och skrivs enligt Steg 7 som ett positivt villkor med egen rubrik —
`<h2>Så används den hemma</h2>` — på varje sida i gruppen. Kärnmeningen hålls
ORDAGRANT identisk på alla sidor: det är en rättslig upplysning, inte copy, och
en omskrivning per sida är åtta chanser att införa ett fel.

⚠️ Leverantören säger delvis samma sak själv, på tyska, i fyra av sjutton
utkast (*"Hunde sollten niemals über einen längeren Zeitraum in einem
geschlossenen Käfig untergebracht werden"*). De tretton andra säger ingenting.
**Att regeln bara står i vissa källrader betyder inte att den bara gäller dem.**

**Hobbyhöns:** ingen verifierad siffra ännu. Leverantörernas antal är ofta orimliga — ett
hönshus med 0,656 m² hushållsdel marknadsfördes för "10–15 höns". Publicera aldrig
leverantörens antal utan att kontrollera SJVFS 2019:15 respektive 2019:23.

**Under gränsen → importera/polera inte.** Radera produkten, märk mappningsraden `rejected`
med den rättsliga orsaken, och berätta för Leonard varför.

### Övriga stoppklasser

- **Leksaker** → **EN71**-märkning och åldersgräns ska stå i produkttexten. Saknas
  certifieringen i leverantörsdatan: flagga hellre än att skriva ut en gissad märkning.
- ☠️ **Skyddsgrindar för BARN → EN 1930.** Aosom har 58+ grindutkast, och de ser alla
  likadana ut: ett vitt metallgrind i en dörröppning. Skillnaden mellan en **hundgrind** och
  en **barngrind** finns inte i produkten utan i provningen, och den kan inte läsas ur ett
  foto. Marknadsförs grinden mot barn måste EN 1930 vara belagd — annars är det ett
  overifierat säkerhetslöfte på en produkt vars felläge är ett barn i en trappa.

  Uppmätt 2026-09-03 på `49069c2c`: tyskan säger ordagrant *"Zertifiziertes
  Treppenschutzgitter"*, *"schützt Babys und Haustiere"* och *"Geeignet für Babys von 6–24
  Monaten"* — och **namnger ingen standard någonstans**. "Certifierad" utan norm är inte en
  certifiering; det ordet ensamt får aldrig bära en åldersangivelse vidare till svensk text.

  | Läge | Vad som gäller |
  |---|---|
  | Leverantören namnger **EN 1930** | Skriv barnanvändningen, med standarden utskriven |
  | Leverantören säger "certifierad" utan norm | **Skriv om den som husdjursgrind**, utelämna barn |
  | Texten säger uttryckligen barn men inget mer | Sätt undan och flagga till Leonard |

  ⚠️ **Klämmontage hör inte hemma överst i en trappa.** En tryckmonterad grind hålls på
  plats av friktion mot karmen och är avsedd för dörröppningar och nederkanten av en trappa;
  överst i trappan ska grinden vara skruvad. Säljer vi en klämgrind ska monteringssättet
  därför stå i spec-tabellen (`Montage: klämmontage` / `skruvmontage`) — det är den uppgift
  som avgör var grinden får sitta, och den saknas i leverantörens svenska spec-rad.

  🔒 **Begränsningen skrivs positivt, med egen rubrik** — samma regel som `Maxlast 120 kg`.
  *"En grind för hunden"* med vad den ÄR provad för, aldrig *"inte testad för barn"*.
- **El till kroppen / medicintekniskt / kosttillskott** → flagga till Leonard, polera inte.
- **Vapen och vapenrepliker** → stopp och flagga. *(Gäller i praktiken bara AliExpress.)*
- **Licensfigurer och skyddade kännetecken** → stopp och radera. Disney, Marvel, Pokémon,
  Sanrio, Star Wars, Bluey på kalasartiklar och textil är olicensierad vara: varumärkes- och
  upphovsrättsintrång, tullbeslag, och risk för avstängning hos Stripe och Google Merchant
  Center. **Det finns ingen version utan märket — märket ÄR produkten.** Samma sak för
  **rödakorsmärket** (lag 1953:771): rött kors på vit botten går inte att licensiera, så
  sitter det tryckt på varan går varan inte att sälja. *(Gäller i praktiken bara AliExpress.)*

> Grinden är en **stopp**-kontroll, inte en textkontroll. Passerar produkten men har en
> säkerhetsrelevant begränsning (maxlast, åldersgräns) → siffran hör hemma i spec-tabellen,
> och avgör den användningen skrivs den som ett **positivt villkor med egen rubrik** i Steg 7
> — *"Från 14 år"*, *"Maxlast 120 kg"* — aldrig som ett varningsblock.

-----

## Steg 3 – Läs produkten (1 anrop, read-only)

```
GET .../stores/v3/products/{PRODUCT_ID}?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=URL
```

Spara `revision`, `name`, `slug`, `seoData`, **`visible`** och **hela `media`** — du behöver
`media.itemsInfo.items` med deras `id` till Steg 9.

Läs samtidigt mappningsraden, som bär facit för pris, lager och EU-ribbon.

☠️ **Mappningen ligger i Postgres sedan 2026-09-01, inte i Wix Data.**
`FyndplatsMappings` är TÖMD (POSTGRES-MIGRATION.md, steg 6) — en `GET` dit
returnerar ingenting, och en `save` dit SKAPAR en föräldralös rad som ingenting
läser. Använd workflowen i stället:

> **Polering — läs och stämpla mappningsraden** → läge `las`, `wix_product_id`
> = produktens id.

Den svarar med hela raden **och en färdigräknad prisgrind** (nästa avsnitt), så
Steg 4 inte behöver göra aritmetiken för hand. Ingen hemlighet passerar chatten
— produktionen har nycklarna, Actions har `CRON_SECRET`.

-----

### ☠️ EN LÄSNING AV EN LEVERANTÖRSRAD ÄR ETT ANTAGANDE — läs TRE gånger

Runda 120 hittade **tre tal som såg fullkomligt rimliga ut och kom från fel
fält**. Inget av dem var uppenbart; alla tre hade nått kund utan grinden.

| produkt | fältet | vad som stod | var det kom ifrån |
|---|---|---|---|
| `c3bda64a` | vikt | 29,4 kg | vikten på ett set **utanför batchen** |
| `3b38e191` | stolens djup | 45 cm | **bordets** djup på samma produkt |
| `f4ed1264` | sitsens diameter | Ø30 cm | ingen källa alls |

Rundans `matt.py` har därför **tre källor**, och de fångar olika fel:

1. **Steg 1:s katalogsvep** — den råa raden som den lästes när familjen
   grupperades.
2. **Steg 3:s spec-block** — den läsning som normalt fyller `matt.py`.
3. **MÅTTRITNINGEN** (bild 3), inlagd som `RITNING` i `matt.py`.

**Regel 7:** stämmer inte (1) och (2) om ett fält är fältet `None` tills det
gått att läsa om — aldrig det tal som råkade skrivas sist. Sju av åtta rader
stämde exakt; den åttonde bar ett tal som hörde till någon annan.

☠️ **Regel 7 räckte inte.** `3b38e191`s stolsdjup stod fel i BÅDA
textläsningarna, för båda kom ur samma rad. Det som skiljer måttritningen är
att den inte är text: den är ortografisk, och regel 9 nedan är entydig — *står
etiketten mot ritningen, mät ritningen.*

**Regel 8:** varje bord- och sitsmått i `matt.py` måste stämma med `RITNING`.

⚠️ **Bara geometri.** En LASTSIFFRA i en ritning är text som råkat ritas och
vinner ingenting över spec-raden. Det är samma gräns regel 9 redan drar.

⚠️ **Ett `None`-fält får aldrig nå ett kort eller en text.** `format()`
renderar `None` som strängen `"None"`, som på ett spec-kort ser ut som en
produktuppgift bland andra. `kort.kontroll()` fäller på det.

**Fingeravtrycket att leta efter: ett tal som är IDENTISKT med grannfältets.**
En stols djup som råkar vara exakt bordets, en vikt som råkar vara exakt
syskonets. Det är sällan ett sammanträffande.

-----

## Steg 4 – Titta på bilderna FÖRST (innan du skriver något)

Den visuella förståelsen styr **allt nedströms** — sökordet (bilderna avslöjar produktens
exakta typ), beskrivningen (skriv det som syns, gissa inte från rå-titeln), alt-texterna, och
vilka bilder som behöver åtgärdas i Steg 9.

Hämta en liten preview av varje galleribild och **montera dem till EN kontaktkarta**:

```
curl -s -o img-01.jpg "https://static.wixstatic.com/media/{FILE_ID}/v1/fit/w_320,h_320,q_70/preview.jpg"
```

```python
from PIL import Image, ImageDraw
import glob, math
f = sorted(glob.glob("img-*.jpg")); k = math.ceil(len(f) ** .5); s = 340
ark = Image.new("RGB", (k * s, math.ceil(len(f) / k) * s), (255, 255, 255))
d = ImageDraw.Draw(ark)
for i, p in enumerate(f):
    im = Image.open(p).convert("RGB"); im.thumbnail((s - 20, s - 20))
    x, y = (i % k) * s, (i // k) * s
    ark.paste(im, (x + 10, y + 26)); d.text((x + 10, y + 6), f"{i+1:02d}", fill=(200, 60, 0))
ark.save("kontaktkarta.jpg", quality=88)
```

💰 **Ett galleri på tio bilder blir EN `Read` i stället för tio** — den enskilt största
tokenbesparingen i flödet. Numreringen följer `media.itemsInfo.items`, så du kan hänvisa till
"bild 04" rakt igenom poleringen. Hämta full upplösning **bara** för de bilder du faktiskt ska
beskära eller bygga kort av.

**För en Aosom-rad räcker det att bedöma bild 3, 4 och 5** — plats 1 och 2 är mätt rena i
30 av 30 fall. Se [Aosom-rader](#aosom-rader-de-fyra-skillnaderna).

Notera per bild: inbränd text (och **var** — i ett band eller över varan), fel motiv,
dubbletter, och om bild 1 inte är den renaste produktbilden.

-----

### ☠️ Titta i bildernas ÖVRE VÄNSTRA HÖRN — leverantörens logotyp bor där

Runda 64: `e76002c1` bild 2 bar **`HOMCOM by Aosom`** inbränt i hörnet. Både
husmärket och leverantören, i samma logotyp, på en bild som var på väg till en
kundsida.

☠️ **Husets kontroll kan inte se det.** `CLAUDE.md` slår fast att vi inte
läcker leverantörsspår, mätt som noll träffar på `aosom` eller ett husmärke i
HTML:en. Den mätningen är korrekt och verkningslös mot en logotyp: text i en
bild finns inte i källkoden. Ingen `grep`, ingen live-grind och ingen
alt-textkontroll fångar den — bara ögon.

**Så här görs det billigt:** klipp ut övre vänstra 45 × 17 % ur bild 1 och 2 för
alla åtta, klistra ihop till en remsa och titta en gång. Sexton hörn på ett
uppslag. Det tog en minut i runda 64 och hittade en.

⚠️ Position 1 och 2 räcker inte alltid — men de är de enda som blir huvudbild
och delningsbild, alltså de som följer med till Google och sociala medier.
Måttritningen (position 3) och detaljfotona granskas ändå för tysk text.

-----

### ☠️ EN FÄRG SKRIVS ALDRIG UR KONTAKTKARTAN — bara ur en ZOOM

Kontaktkartan ovan är rätt verktyg för att förstå VAD bilderna visar. Den är
fel verktyg för att avgöra vilken FÄRG en detalj har, och det har kostat två
rundor i rad:

| runda | skrivet | uppmätt i zoom |
|---|---|---|
| 89 | "röd fälg" på `479e9c2e` | fälgen är SILVER, bara gaffeln är röd |
| 90 | "silverfärgade fälgar" på `5129f6b0` | fälgbandet är **VITT**, ekrarna silver |
| 90 | "svarta fälgar" på `50b28808` | fälgen är **VIT** — det svarta är DÄCKET |

Alla tre skrevs efter att ha tittat på en 320- eller 420-pixels miniatyr, och
alla tre var fel om en liten men synlig del av varan. På den storleken är en
fälg tjugo pixlar bred: däckets svarta ring dominerar, och fälgbandets färg
finns knappt.

**Regeln: varje färgpåstående om en DEL av varan — fälg, gaffel, beslag,
sömmar, handtag — kräver en beskärning i minst 2× förstoring av just den
delen.** Färgen på HELA varan går att läsa ur kontaktkartan; en detalj gör det
inte.

⚠️ Och gör grinden mekanisk, inte till en vana. Runda 90 la in `FALG_OK` —
en lista per produkt med de färgord som är UPPMÄTTA, och ett fel om texten
använder något annat framför ordet "fälg". Ett mutationstest som återinför
båda felen fäller på rätt regel. En regel man ska komma ihåg glöms bort.

#### ☠️ EN GRIND TÄCKER BARA DEN DETALJ DEN NÄMNER — runda 91 fällde på nästa

`FALG_OK` vaktade fälgen. `RAM_OK` (runda 91) vaktade ramen. **Ingen av dem
tittade på RANDNINGEN**, och det var där felet satt: fyra sparkcyklar fick
"guld- och svartrandning" om ett band som i 6× zoom är **guld, vitt OCH svart**.

Tredje rundan i rad, samma familj, ny detalj varje gång. Slutsatsen är inte
"lägg till en regel till" utan **räkna upp varje färgad DEL i produkten och ge
var och en sin egen uppmätta lista** innan texten skrivs — fälg, ram, rand,
gaffel, styre, beslag.

☠️ **Och kravet ska vara LIKHET, inte delmängd, och gälla PER FRAS.** Båda de
svagare varianterna provades mot mutationstestet och båda missade:

| krav | vad som slapp igenom |
|---|---|
| delmängd (allt som nämns finns) | att UTELÄMNA vitbandet ur en tregfärgad rand |
| union över hela sidan | en HALV rättning — ingressen ändrad, spec-raden inte |

Ett utelämnande är inte en lögn, men det gör syskonen mer olika än de är: tre
av fyra hade beskrivits som om de bar olika randband när alla fyra bär samma.

⚠️ **Priset för per-fras-kravet:** texten får inte referera tillbaka till en
enskild rand ("de svarta ränderna löper …") utan att räkna upp hela bandet.
Det är billigare än en tyst halv sanning.

#### ☠️ KORTETS RUBRIK ÄR OGRANSKAD om den bor i `kort.py`

Runda 90 lintade bara produkttexten. Kortrubriken låg i kortbyggets egen
`KORTPLAN` — och det är **exakt den plats där både runda 90 och 91 skrev fel
färg**, eftersom rubriken är vald för att peka ut vad som skiljer syskonen åt.

Lägg rubriken i `texter.py` (t.ex. som `KORT`), låt `kort.py` importera den, och
kör den genom `brister()` som ett eget litet dokument. Ett kort är lika mycket
ett påstående mot kunden som ett stycke brödtext.

⚠️ **Och ge varje ny grind ett eget prov i självtestet.** Runda 91:s randgrind
hade samma loopvariabel i den yttre loopen och den inre generatorn — kontrollen
jämförde orden mot sig själva och svarade **grönt på allt**. Självtestet fällde
den på en sekund; utan prov hade grinden legat där och tigit i rundor.

-----

### ☠️ När `ExecuteWixAPI` svarar 403 — runda 93 körde hela vägen på reservvägen

Verktyget som alla rundor byggt på slutade svara mitt i en session: `403
forbidden` på varje anrop, även en läsning av två rader. `GetSiteContext`
fungerade, alltså inte site-bindningen. **`CallWixSiteAPI` fungerade hela
tiden.** Fyra omförsök över ~15 minuter gav samma svar.

Skillnaden är inte kosmetisk — den tar bort tre saker rundan lutar sig mot:

| | `ExecuteWixAPI` | `CallWixSiteAPI` |
|---|---|---|
| Loopa 56 katalogsidor i ETT anrop | ja | **nej**, ett HTTP-anrop per verktygsanrop |
| Bygga kroppen i kod | ja | **nej**, kroppen klistras in för hand |
| Facit-grind FÖRE PATCHen | ja | **nej**, grinden flyttar till återläsningen |

☠️ **Klistrad kropp är precis den risk hashen finns för.** Skriv i fil, linta
filen, klistra, läs tillbaka, jämför. Ingen produkt räknas som skriven förrän
återläsningen stämmer.

✅ **De publicerade sidorna behöver inte API:t alls.** `https://www.fyndplats.se/sitemap.xml`
gav 2 197 produktsidor gratis, och dubblettgrinden mot publicerade sidor kunde
köras utan ett enda Wix-anrop. Använd den vägen även när API:t är friskt — den
är billigare än ett katalogsvep.

☠️ **En markör får inte skickas med sitt eget filter.** `cursor` tillsammans med
`filter` eller `sort` ger `SE-1141: Search, filter and aggregations cannot be
specified together with cursor` — filtret ligger inbakat i markören. Tidigare
rundors svep såg aldrig det, för de svepte utan filter.

☠️ **Det finns ingen fältmask.** `?fields=products.id,products.name` ger
`400 Failed to parse JSON or deserialize protobuf message`. `fields` är en
enum för TILLÄGG (`PLAIN_DESCRIPTION`, `MEDIA_ITEMS_INFO`), inte en trimning.
Räkna med ~1,4 k tokens per produkt i varje svar och filtrera serversidan.

### ☠️ `visible` i fieldMask KASKADERAR ner till varianten (2026-09-07)

Spegelbilden av den kända fällan att en `variantsInfo`-PATCH publicerar ett
utkast. Uppmätt på två produkter i samma runda, med och utan:

| skickat | produktens `visible` | variantens `visible` |
|---|---|---|
| `fieldMask: [… , "visible"]`, `visible:false` | false (avsett) | **true → false** ☠️ |
| samma PATCH UTAN `visible` i masken | false (oförändrad) | true (oförändrad) |

En produkt vars enda variant är osynlig går inte att köpa ens efter
publicering, och ingenting i svaret ser fel ut. **Utelämna `visible` ur masken
när du bara skriver text** — och när du MÅSTE ha med den (en
`variantsInfo`-PATCH, som publicerar utan den), skicka variantens `visible`
uttryckligen i samma anrop.

### ☠️ `product.name` TAR HÖGST 80 TECKEN (2026-09-07)

Uppmätt i runda 94. Ett namn som bar båda färgerna på ett tvåfärgat tak blev
91 tecken och avvisades:

```
400  product is invalid:
     `-- name has size 91, expected 80 or less
     violatedRule: MAX_LENGTH, threshold: 80
```

Gränsen står inte i produktdokumentationen; den syns bara i felmeddelandet —
samma sort som `ignoreCommand`-radens 256 tecken i `CLAUDE.md`.

**Det är en riktig avvägning, inte en formalitet.** Ett reservtak vill bära fyra
saker i namnet: produkttyp, storlek, färg och `utan stomme`. Något måste bort.
Runda 94 flyttade den andra färgen (toppens) till seo-titeln och kortet och
behöll `utan stomme` — den dyraste missuppfattningen kunden kan göra väger
tyngre än en färgnyans.

**Räkna namnet i grinden, inte i API-svaret.** En rad räcker:

```python
if len(namn) > 80:
    f.append("namnet är %d tecken — Wix tar högst 80" % len(namn))
```

### ☠️ FIL-REGELN SKYDDAR FÖRFATTANDET — INTE TRANSKRIBERINGEN (2026-09-07)

`CLAUDE.md` mätte batch 64: text skriven inline i API-anropet gav nio fel, text
skriven i en fil och grep-grindad gav noll. Runda 94 följde regeln — och fick
ändå in ett stavfel i två av fyra produkter:

| var | vad |
|---|---|
| `html-d52c6d1d.html` (filen) | `samma yttermått` ✓ |
| PATCH-kroppen (mitt anrop) | `samma yttterm\u00e5tt` ✗ |

Anledningen är mekanisk och gäller varje runda: `ExecuteWixAPI` svarar 403, så
kroppen kan inte byggas i kod ur filen — den skrivs **för hand** in i
`CallWixSiteAPI`. Filen är alltså grindad, men det som faktiskt skickas är en
KOPIA av filen, och kopieringen är oskyddad. API-svaret ekar dessutom tillbaka
exakt det man skrev, så det ser rätt ut.

☠️ **Det enda som fångar det är en ÅTERLÄSNING.** Läs tillbaka
`plainDescription` i ett SEPARAT anrop efter skrivningen och leta efter de ord
du själv skrev in för hand. Runda 94:s fel hittades så, och rättades innan
sidan publicerades.

⚠️ Bäst är den MEKANISKA varianten i Steg 14: hämta den publicerade sidan med
`curl` och hasha den synliga texten mot `facit.json`. Den kan inte missa ett
tecken, till skillnad från ögon. Men den går bara att köra efter publicering —
och en felstavning som redan nått kund är dyrare än en som stoppas. Gör båda.

### ☠️ Wix SKRIVER OM din HTML — hasha synlig text, aldrig råmarkup

Uppmätt vid återläsning: det som sparas är inte det som skickades.

| skickat | lagrat |
|---|---|
| `<strong>Mått:</strong>` | `<span style="font-weight: 700">Mått:</span>` |
| `<li>Passar …</li>` | `<li><p>Passar …</p></li>` |
| `<a href="…">` | `<a href="…" target="_self">` |

En hash över råmarkup kan alltså ALDRIG stämma, hur rätt texten än är. Facit
räknas därför över **taggbefriad, mellanslagsnormaliserad synlig text** — vilket
är precis vad `facitgen.py` alltid gjort, och skälet till att grinden hållit.
Skriv inte om den till att hasha HTML:en.

### ☠️ Ett färgsyskons bildset kan innehålla EN ANNAN färgvariant

Runda 93, den bruna pergoladuken: bild 4 och 5 var **rena** från text och
logotyp och hade passerat varje befintlig grind — men de visar en **khaki**
duk, medan varan är varmbrun (mätt 146,122,99 i huvudbilden).

Det är ett färgpåstående som ligger i PIXLARNA, alltså osynligt för både
lint och muteringstest. Kontrollen är densamma som för randfärgerna i runda
89–91, fast en nivå upp: **jämför varje behållen bilds dukfärg mot
huvudbildens** innan galleriet skrivs. En median-RGB räcker inte när
belysningen skiljer — titta i hög upplösning, sida vid sida.

## Steg 5 – Verifiera leverantörens påståenden

**Det mest värdefulla steget i hela flödet.** Under en session 2026-08-22/23 bar **fem av
åtta** produkter minst ett påstående som inte höll. Det är normalläget, inte undantaget.

För Aosom är källordningen given: **`Lieferumfang` och `Technische Daten` gäller, titeln
inte** (se [Aosom-rader](#aosom-rader-de-fyra-skillnaderna)). Exempel på vad som fälls:
en espressomaskin med "20 bar" i titeln och 15 bar hos tillverkaren; en häcksax med
"battery included" i texten och `Battery Included: no` i spec-raden; ett parasoll med
"protección solar total" och ingen UPF-siffra någonstans.

**Arbetsgång:**

1. **Läs specen mot bilderna.** Leverantörens egna bilder motsäger ofta deras text, och
   bilderna vinner nästan alltid — de är fotograferade på den riktiga varan. **Packbilden är
   den mest pålitliga källan till vad som ingår i lådan.**
2. **Slå upp tillverkarens egen sida** när det finns ett modellnummer.
3. **Två källor som säger olika → ta den konservativa siffran** och skriv ut varifrån den kommer.
4. **Oförenliga uppgifter → utelämna helt.** Hitta inte på ett mellanting.
5. **Superlativ utan siffra bakom sig upprepas aldrig.** "Waterproof", "total sun protection" —
   antingen finns ett mätvärde, eller så skriver vi inte påståendet.
6. **Marknadsföringsnamnet är inte produkttypen.** Kolla vad varan *är* innan du döper den.
7. ☠️ **Skriv inte in hårdvarudetaljer som varken text eller bild stöder.** Regel 1–6 handlar
   om att leverantören ljuger; den här handlar om oss. En trovärdig liten detalj är lätt att
   skriva och nästan omöjlig att upptäcka i korrekturet, för den *låter* som något man läst i
   specen. Hurtsen `f0e0ee14` fick "kullagrade skenor" i ingress, h2, spec-tabell OCH meta —
   det stod ingenstans; bilden visade vitlackerade rullskenor. **Varje mätvärde och varje
   mekanikord ska gå att peka på i en källa.** Kan du inte peka: skriv det generiska ordet
   ("metallskenor").
8. ☠️ **Skriv aldrig ut en NEGATION** ("saknar ram", "utan ventil") för att leverantören inte
   nämnde den. Ett kort visar det säljaren valde att visa. Ryggsäcken `311c8c4e`: jag skrev
   "ingen aluminiumram" i brödtext, spec OCH FAQ — tillverkarens egen sida hade ett kort med
   rubriken *"ALUMINIUM FRAME STRUCTURE"*. Ramen fanns, insydd. En negation kräver samma
   verifiering som ett positivt påstående.
9. **Står etiketten mot ritningen — mät ritningen.** Måttbilder är ortografiska:
   proportionerna stämmer även när textetiketterna inte gör det. Har du ETT mått du litar på
   i samma bild kan du räkna ut resten. Hundgrinden `2ad9b84b`: höjdpilen var märkt "25 cm",
   titeln sa 45; grindsektionen bredvid var måttsatt 61 cm och mätte 863 px → 14,15 px/cm,
   höjdpilen 614 px = **43,4 cm**. Etiketten var fel, inte specen — och skillnaden är inte
   kosmetisk: 25 cm är ett trappsteg, 45 cm är en grind. Mät på originalbilden och tröskla
   bort strökorn (`rad >= 8 px`), annars drar JPEG-bruset ut bounding-boxen.
10. ☠️ **Precisera inte en verklig egenskap längre än källan gör.** Svårare att fånga än
    regel 7, för egenskapen FINNS — det är omfånget eller metoden som är påhittad, och den
    hakar i den sanna delen som om den stått i samma mening. Två från skoförvaringen
    2026-09-02, båda skrivna av mig och båda stoppade i sista kontrollen mot den tyska
    källan: *"Soft-Close-Scharniere"* blev **"soft-close på alla luckor"** (källan räknar
    inte upp luckorna — skåpet har tre), och *"mattem schwarzen Stahl"* blev
    **"pulverlackerat stål"** (pulverlack är den vanliga metoden, men står ingenstans).
    Testet är mekaniskt: **stryk under varje adjektiv och varje kvantifierare i din mening
    och peka på det i källtexten.** Kan du inte peka — behåll leverantörens egna ord
    ("soft-close-gångjärn", "matt svart stål"). De är kortare ändå.
11. ☠️ **Leverantörens TITEL kan lova en egenskap som spec-tabellen inte har — och måtten
    avgör vilken av dem som är sann.** Besläktad med regeln om falska kategoriord, men
    värre att upptäcka: här är produkttypen rätt och det är en enskild FUNKTION som bara
    finns i rubriken. Barstolen `fcdc1c8f` 2026-09-02 heter *"Barstuhl mit **Armlehnen**
    und Rückenlehne"* — men Technische Daten listar bara `Rückengröße: 50B x 5T x 26H cm`,
    och inget armstödsmått. Måtten löser upp motsägelsen: totalbredden 53,5 cm är RYGGENS
    50 cm, inte armstöd utanpå en 39 cm sits. Jag hade byggt hela sidan, kortet, namnet och
    sluggen på armstöden innan kontrollen mot källan fälldes.
    **Testet:** varje funktion rubriken lovar ska ha ett eget MÅTT i spec-tabellen. Saknas
    måttet — leta upp vad totalmåttet faktiskt består av innan du skriver en rad.
    Här slutade det med både och: ryggens framåtsvängda ändar ÄR något man vilar armarna
    på, så texten säger det — men den bär 50-mot-39-måttet, inte rubrikens ord.

12. ☠️ **Ritningens BÄRIGHET kan säga en sak och den skrivna specen en annan — och det är
    inte sällsynt.** Två batchar i rad: bäddsoffan `1f2de1bb` (batch 50) hade **100 kg** i
    ritningen mot **40 kg** i `Technische Daten` — som dessutom upprepade 40 två gånger.
    Konsolbordet `9b027508` (batch 51) hade **30 kg** i ritningen mot **20 kg** i texten.
    Regel 9 säger "mät ritningen" och gäller fortfarande — men bara för MÅTT. Ritningen är
    ortografisk och därför pålitlig på geometri; en lastsiffra i ritningen är text som
    någon skrivit, precis som specen, och den har ingen sådan företrädesrätt.

    **Gör så här:** skriv den LÄGSTA siffran (överlova aldrig last — en kund som lastar 30
    kg på ett bord byggt för 20 får en olycka, inte en besvikelse), och ta bort **den källa
    som bär talet du INTE skriver**. Oftast är det ritningen, och då ska bilden ur galleriet:
    den ligger kvar på produktsidan långt efter att texten rättats. Flytta ritningens övriga
    mått till spec-listan och till ditt eget Fyndplats-kort, så tappar kunden ingenting.

    ⚠️ Men kolla åt vilket håll det lutar innan du raderar. Tv-vagnarna i batch 53 hade
    **40 kg i ritningen mot 70 i den skrivna specen** — där var ritningen den försiktiga,
    alltså den som stämmer med sidan, och den fick sitta kvar. Det är texten vi inte
    publicerar ändå. Regeln är inte "ritningar ljuger" utan **ta bort den källa vars siffra
    inte står på sidan**.

13. ☠️ **Titeln kan ange fel PRODUKTTYP, inte bara en egenskap som saknas.** Regel 11 handlar
    om en funktion spec-tabellen inte har; den här om att varan är något helt annat än vad
    den heter. Två fall i samma parti (batch 53): `5c566983` heter *Esszimmerstuhl* men har
    `Lieferumfang: 1 x Esszimmer**bank**`, är 120 cm bred och tål 240 kg — det är en BÄNK.
    `cee5437b` heter *Esszimmerstuhl* men har `Lieferumfang: 4 x **Hocker**`, saknar ryggmått
    och är 46 cm hög totalt — det är fyra PALLAR.

    **Testet är `Lieferumfang`, och det tar två sekunder.** Läs den raden innan du tror på
    titeln, och kontrollera att totalmåtten är fysiskt möjliga för den produkttyp namnet
    påstår: en stol som är 46 cm hög har ingen rygg, och en 120 cm bred sits är ingen stol.
    En felnamngiven produkt ska inte poleras som fel typ — lägg den åt sidan och ta den i
    rätt kategori, med rätt sökord.


14. ☠️ **Räkna efter dina EGNA tal, och mät superlativ mot hela katalogen.** Regel 1–13
    handlar om leverantörens påståenden. Den här handlar om de meningar poleringen hittar
    på själv, och de är farligare, för ingen källa motsäger dem.

    Två sorter, båda uppmätta i batch 54 innan publicering:

    - **Aritmetik i löptext.** "Ett bord på 160 centimeter tar fyra stolar på 42 centimeter"
      — fyra gånger 42 är 168. Samma fel en gång till med 54-centimetersstolar på samma
      bordssida (tre stycken är 162). Varje gång du skriver *hur många som får plats*, *hur
      mycket som ryms* eller *hur mycket marginal det finns*, gör multiplikationen på
      papper och skriv ut den i texten — då syns felet både för dig och för kunden.
    - **Superlativ mot fel jämförelsemängd.** "42 cm — det smalaste måttet i vårt
      matstolssortiment" var falskt: `matstolar-i-furu-2-pack` är 41,5. Felet var att
      jämföra mot BATCHEN i stället för mot katalogen. Ett "smalast", "störst", "tåligast"
      kräver en sökning bland de publicerade sidorna, inte bara bland de sju du håller på
      med. Håller det inte: byt ut superlativet mot konsekvensen ("bland de smalaste vi
      säljer" plus vad bredden faktiskt ger).

    Regel 5 säger att leverantörens superlativ aldrig upprepas utan siffra. Den här säger
    att våra egna inte heller får det.

15. ☠️ **En BÄRIGHET är ett säkerhetspåstående — översätt den aldrig till "hur många som
    får plats".** Regel 14 gäller aritmetik i allmänhet; den här gäller den enda siffra där
    ett räknefel kan sluta med en trasig möbel och en skadad kund.

    Uppmätt 2026-09-02: jag skrev *"Bärigheten är 120 kilo, alltså två vuxna med marginal om
    de sitter samtidigt"* på tre bänkar samtidigt. Två vuxna är omkring 160 kilo. Meningen
    var alltså inte bara fel — den bjöd uttryckligen in till den belastning bänken inte
    tål, och den gick igenom hela min textgranskning för att inget mönster letar efter
    *osann* text.

    Formeln, om den ska skrivas alls: **en vuxen ≈ 80 kg.** Under 160 kg får en bänk
    aldrig beskrivas som en tvåsits i belastningshänseende, hur bred den än är. På en
    120-kilos bänk som är 125 cm bred är den bredden i sig ett skäl att skriva ut
    begränsningen — kunden ser en tvåsits och antar en tvåsits. Samma batch hade en bänk
    på 220 kg, där "två vuxna samtidigt" är sant och står kvar.

    Gäller lika för hyllplan, klädstänger, takfästen och allt annat med ett kilotal.

16. ☠️ **Bilden vinner över texten om en SYNLIG egenskap — inte bara om måtten.** Regel 12
    och 13 handlar om ritning mot spec och om fel produkttyp. Den här gäller det tredje
    fallet: leverantörens löptext beskriver något man kan SE, och beskriver det fel.

    `d197d3e5` (2026-09-02): tyskan säger *"goldfarbenen, spitz zulaufenden Beine"*.
    Produktfotot visar **svarta ben med en mässingsfärgad doppsko i tåändan** — guld finns
    på möbeln, men på tre centimeter av benet, inte på benet. Skrivet efter texten hade
    sidan lovat en möbel kunden inte får.

    Färg, material, form, antal luckor, riktning på en dörr: allt sådant står i bild 1 och
    2, som poleringen annars kan hoppa över. **Läs dem ändå när texten påstår något om
    utseendet.**

17. ☠️ **Ett DÖRRMÅTT i spec-tabellen är EN dörrhalva — bara fotot säger hur många det finns.**
    Regel 16 gäller utseende; det här gäller ett tal som ser oskyldigt ut och ändå ändrar vad
    kunden kan använda varan till. Aosom listar `Tür: 35 x 171 cm` utan att skriva "per halva",
    och en enkeldörr och en dubbeldörr ger identiska spec-rader.

    Batch 62, redskapsboden `2b6d2766`: jag skrev "enkeldörr, 35 × 171 cm" och byggde två
    FAQ-svar på det — *"det är en smal dörr … inte för något brett som en skottkärra"*.
    Fotot visar två dörrhalvor, och tillverkarens egen måttritning sätter **70 cm** vid
    golvet. Vi hade alltså halverat produktens öppning i marknadsföringen. Samma fel på
    trädgårdsskåpet `c85c49af`: "ett akrylfönster" där det finns två, ett i varje dörrhalva.

    **Testet:** varje gång du skriver ordet *dörr*, titta på bild 1 och räkna gångjärnen.
    Två uppsättningar → dubbeldörr, och spec-raden ska stå som `2 × B × H` med den fria
    öppningen uträknad. Felet går bara åt ett håll — man underskattar aldrig en enkeldörr.

10. ☠️ **Läs HELA källtexten innan du skriver — den bär också det du annars utelämnar.**
    Regel 7–9 handlar om påståenden man lägger TILL. Det här är felet åt andra hållet, och
    det upptäcks aldrig i korrekturet: texten är sann, välskriven och saknar halva varan.
    Sidobordet `cc4aad40` skrevs som ett inomhusbord "utan ben" på en läsning av bilderna.
    Källan sa ordagrant *"Geeignet für den Innen- und Außenbereich"* och *"Mit vier
    verstellbaren Fußstützen"* — vi hade alltså tagit bort en säljpunkt och skrivit en
    felaktig produktbeskrivning samtidigt. Samma runda: soffbordet `4009d67f` tappade
    22,8 cm golvfrigång, infällda grepp (ett klämskydd) och melaminytan; `f757393c`
    tappade justerbara fötter och lackens fukttålighet. **Sju verkliga egenskaper föll
    bort på fyra produkter** — fler fel än grinden mot uppfunna påståenden hittade.
11. **Bilden avgör vad varan ÄR, källtexten vad den KAN.** Det är delningen bakom regel 10.
    Form, färg, antal och proportion läser du ur fotot (Steg 4). Väderklassning,
    justerbarhet, bärighet, ytbehandling och vad som ingår står bara i texten och syns
    aldrig på ett foto. Skriver du enbart från bilderna får du en beskrivning som stämmer
    på varje rad och ändå säljer fel produkt.

> 🔎 **Oifyllda mall-platshållare är en varningsflagga för hela bildserien.** Samma produkt
> hade rubriken *"aberturas de: **-XX-XXcm**"* rakt ut i produktion. Ser du en sådan: sluta
> lita på siffrorna i den serien och verifiera var och en.

> 🔒 **Rättelsen går in i löptexten, aldrig som brasklapp.** Skriv den sanna uppgiften i
> stycket och i spec-tabellen — inte *"leverantören påstår X men…"*.

**Rapportera fyndet till Leonard.** Samma leverantör och samma modellserie bär oftast samma fel.

-----

### Fyra fällor i en Aosom-spec som alla kostade en rättelse (runda 47)

1. ☠️ **Feedens `Vikt` är FRAKTVIKT, inte varans vikt.** Kolumnen heter
   `Weight (incl. Package)`, och den hamnar i det svenska spec-blocket som bara "Vikt".
   `275e9b8a` hade **23 kg** i den tyska `Technische Daten` och **28,7 kg** i det svenska
   blocket — det ser ut som en motsägelse och är två olika mått. Har du bara feed-talet:
   skriv **`Fraktvikt`**. Har du båda: `Vikt 23 kg (fraktvikt 28,7 kg)`.
2. ☠️ **Färgnamnet i specen kan vara fel — skriv efter bilden.** `bd3fe8da` står som
   `Farbe: Gelb`; alla fem bilder visar honungsbetsat barrträ med grön takpapp. "Gult trä"
   hade varit en kund som packar upp en annan möbel än den hen köpte.
3. ☠️ **`begehbar` är marknadsföring — kontrollera det INVÄNDIGA djupet.** `25ed0c55`
   säljs som `begehbares Design` med ett invändigt djup på **58 cm** och en dörröppning på
   2 × 35 cm. Man står utanför och når in. Översätt inte ordet; beskriv förhållandet.
4. **`Fenster` behöver inte vara ett fönster.** `275e9b8a`:s "Fenster für gute Belüftung"
   är en gångjärnsförsedd trälucka i gaveln — en ventil, inte en ruta. Det syns bara på
   bilden. `25ed0c55` har däremot fyra riktiga fönster, i akryl.

☠️ **Och prosan kan säga tvärtemot leverantörens egna måttetiketter.** `bd3fe8da`:s text
säger hyllor till höger och öppet fack till vänster; både måttritningen och specens egen
rad `Größe des linken Regals` säger motsatsen. **Ritningen är mätt på varan — den vinner
över prosan.** Samma produkt gav dessutom två olika uppsättningar fria höjder (40/35/35 på
ritningen, 37/48/42,5 i specen); ritningens summerar rimligt mot innerhöjden, specens inte.

⚠️ **Träslaget motsäger sig självt i ungefär varannan Aosom-rad.** `Fichtenholz` i prosan
mot `Tannenholz` i specen (`7d28f235`), eller `Kiefern- und Zedernholz` mot `Tannenholz`
(`275e9b8a`). Huset skriver **`massivt barrträ`** när källan är oense och `gran` när den är
entydig — den formuleringen står redan på publicerade syskonsidor, så den är inte ett nytt
undantag utan husets linje.

-----

### ☠️ Två mått som motsäger varandra — MÅTTRITNINGEN är facit (2026-09-03)

Katthuset `7d264875` hade två höjder i samma rad data: den tyska spec-kolumnen sa
`87L x 52B x 44H`, den svenska variantraden `52T x 87B x 48H`. Fyra centimeter, och
ingen av källorna är märkt som mer tillförlitlig än den andra.

**Bild 3 avgjorde det.** Feedens position 3 är nästan alltid en måttritning med
siffror inbrända i pixlarna (`RENA_BILDPOSITIONER` behåller den just därför), och där
löper måttlinjen från marken till takets överkant med **44 cm**. Alt-texten, som
importen byggde ur den tyska titeln, sa också 44. Tre källor mot en.

**Regeln: när två sifferkällor säger olika, zooma in måttritningen.** Den är den enda
källan som är GRAFISK — den kan inte ha råkat bli fel i en transkribering mellan två
kolumner, och den visar dessutom VAR måttet är taget (här: inklusive taket, vilket är
det kunden behöver veta). Gissa aldrig på den ena kolumnen, och skriv aldrig ut båda
talen med en brasklapp — det är precis det Steg 7 förbjuder.

### ☠️ Ett färgfält kan vara SCRAMBLAT i en färgfamilj — då är färgen inte publicerbar

Runda 47 lärde att färgnamnet kan vara fel mot bilden. Runda 48 visade det värre fallet:
**två färgfält på SAMMA produkt som motsäger varandra.**

Hundvippan `2b7853e9` anger `Farbe: Gelb` i den tyska specen, medan produktens egna renderingar
visar obehandlat barrträ med svart halkskydd — ingen gul yta någonstans. Färgtvillingen
`9a1432fc`, med identiska mått och vikt, anger `Farbe: Naturholz` i den tyska texten och
`Färg: Blau, Rot, Orange` i sin svenska spec-rad. Samma fält, samma produkt, två svar.

I ett sådant läge finns inget att verifiera mot: bilden kan vara en delad rendering för hela
färgfamiljen, och texten är bevisat opålitlig i minst en riktning. **Utelämna färgen helt** —
ur brödtexten och ur spec-tabellen — och flagga klustret. Det är samma regel som
*"vet vi inte — utelämna"*, bara med två felaktiga källor i stället för noll källor.

Att gissa åt något håll är sämre än att tiga: en kund som beställer "gul" och får naturträ
returnerar varan, och en kund som ser fotot får ändå veta hur den ser ut.

### ☠️ Spec-tabellen är feedens KOLUMNER — inte den tyska texten. De kan säga emot varandra (2026-09-05)

De två reglerna ovan säger vad man gör när två källor är oense. Den här säger varför
de kan bli det, och den gör en del av fallen AVGÖRBARA i stället för utelämnade.

`buildSpecifications` i `lib/aosom/to-product.ts` gör bokstavligen:

```ts
add("Mått",  row.size);    // feedens size-kolumn, ordagrant
add("Färg",  row.color);   // feedens color-kolumn, ordagrant
```

Spec-tabellen är alltså **inte** härledd ur den tyska beskrivningen. De två är
OBEROENDE källor ur samma feedrad, och Aosom fyller dem var för sig. Den svenska
tabellen — det kunden faktiskt ser — är den som bär kolumnvärdet.

Två fall uppmätta i samma familj (runda 62, knästolarna):

| | spec-tabellen (`row.color`/`row.size`) | tyska Technische Daten | alt-texten |
|---|---|---|---|
| `9d626528` färg | `Grau` | **`Dunkelgrau`** | **`Dunkelgrau`** |
| modell D mått | `55L x 85B x 55H` | **`55B x 85T x 55H`** | — |

Måttfallet är det farligaste av de två, för det ser inte ut som ett fel: kolumnen
säger att stolen är **85 cm bred** när den är 85 cm DJUP och 55 cm bred. En kund som
mäter en nisch får fel svar av en tabell som är helt korrekt formaterad. Och ett av de
fem syskonen (`c3e0af3f`) bär dessutom talen i en annan ordning än de fyra andra —
samma produkt, transponerad.

☠️ **Färgfallet hade blivit ett DUBBLETTBESLUT.** Två av fem syskon stod som `Grau` i
spec-tabellen med samma mått och samma paketmått — alltså exakt signaturen för en
intern dubblett, och regeln säger att en av dem ska pensioneras. Den tyska texten och
alt-texten sa `Dunkelgrau` på den ena. **Ett fel i ett strukturerat fält kan dölja en
verklig skillnad, inte bara hitta på en.**

**Regeln, som skiljer sig från de två ovan:** när spec-tabellen och den tyska texten
är oense är det inte automatiskt "utelämna". Räkna källorna först — den tyska
brödtexten och alt-texten (som importen byggde ur den tyska titeln) är TVÅ oberoende
vittnen mot kolumnens ett — och läs syskonuppsättningen: **en färg som skulle
DUBBLERA ett syskons färg är i sig ett bevis att fältet är fel.** Håller inte den
prövningen, då gäller utelämnanderegeln.

## Steg 6 – Variantsanering (bara flervariantprodukter)

**Aosom-rader har en enda variant utan optioner — hoppa över.** Kontrollera ändå att
mappningens `variants[0].supplierVariantId` finns och att varianten är `inStock`.

För en flervariantprodukt: avgör vad som faktiskt ska säljas **innan** Steg 7, annars skriver
du copy och bygger kort för en variant som ändå ska bort. **Facit är mappningen, inte
marknadsbilderna** — läs den med workflowen **Polering — läs och stämpla
mappningsraden** (läge `las`, samma anrop som Steg 3) och jämför varje
`variants[].supplierVariantId` mot produktens `inventoryStatus.inStock`. Regler och mekanik i
[Steg 11C](#11c--sanering-uttagsaxlar-dubblettfärger) och
[`polish/varianter.md`](polish/varianter.md).

💰 **Billigaste varianten ska ligga FÖRST i valen** *(Leonards regel 2026-08-26)*. Wix visar
det första valet förvalt, så det är dess pris kunden möter — ett förvalt dyrt val får
produkten att se dyrare ut än den är. Sortera `options[].choicesSettings.choices[]` stigande
efter variantens pris och skicka `options` + `variantsInfo` verbatim. Ordningen påverkar bara
presentationen: `choiceId` är oförändrat, så `linkedMedia`, lagerposter och mappningens
`wixVariantId` följer med av sig själva.

> *Katalogsvep 2026-08-26: 29 av 226 flervariantprodukter hade ett dyrare val först — värst en
> solpanel som visade 1 439 kr i stället för sina 459.*

-----

## Steg 7 – Text: namn, slug, seoData och beskrivning

Bygg innehållet:

- **name (H1):** svenskt, sökordsrikt, börjar med fokussökordet (huvud + kvalificerare). **≤ 80 tecken** (hård Wix-gräns — längre ger 400-fel).
- **slug:** **ASCII** (inte å/ä/ö), gemener, bindestreck, innehåller fokussökordet inkl. kvalificeraren. (ASCII undviker kodningskrångel på headless-frontenden; Google klarar ändå båda.)
  - ⚠️ **Slug-varning (headless):** byt slug **bara på produkter som inte gått live än** (nyimporterade draft-produkter). Wix auto-redirect (`preventAutoRedirect:false`) gäller **bara Wix-hostade sajter, inte din headless** – så att byta slug på en redan indexerad produkt gör att den gamla URL:en **404:ar** och ranking tappas. För en redan publicerad produkt: **behåll befintlig slug**.
  - 🔁 **Byter du ändå slug — eller raderar produkten — skriv en redirect-rad.**
    Storefronten slår upp `FyndplatsRedirects` på 404-vägen och svarar 308 mot
    `toPath`. Utan raden dör den gamla URL:en med all Google-historik den samlat.
    Mätt 2026-08-24: elva av katalogens omdöpta produkter låg som döda URL:er i
    Search Console med sammanlagt ~1 400 exponeringar, och symaskinsbordet,
    massagebänken och salongsstolen var alla sidor **den här runbooken själv**
    hade döpt om. Skriv raden i samma stund som du byter — inte "sen".
    Kör GitHub-workflowen **"Lägg till 301-redirect"**:
    `from_slug` = gamla sluggen, `to_path` = `/produkt/<nya sluggen>`. Flera på en
    gång går via `batch` (JSON-array). Rutten vägrar skriva om källan fortfarande
    är en synlig produkt eller om målet är dött, så en felskriven rad kapar inget.
    Finns ingen ersättare: peka mot **kategorin**, aldrig mot startsidan eller
    `/alla-produkter` — Google räknar en redirect till en irrelevant sida som
    *soft 404*, alltså sämre än en ärlig 404.
- **title-tagg:** ≤ ~60 tecken, fokussökord först, ev. `| Fyndplats`.
  - ☠️ **Titeln får ALDRIG vara identisk med `name`.** Är de exakt lika behandlar
    storefronten titeln som osatt och renderar mallen `{name} | Fyndplats` i stället —
    alltså namnet plus tolv tecken. En titel du räknat till 52 blir 64 live, och du ser
    det inte i API-svaret, bara i den renderade HTML:en. Uppmätt 2026-08-30 på sju
    granar publicerade i samma körning: de fyra där titel = namn fick suffixet, de tre
    där de skilde sig fick sin titel ordagrant. **Räkna därför på `namnets` längd + 12
    som värsta fall**, eller — enklare — låt titeln vara en verkligt kortare variant av
    namnet. Det är den den ska vara ändå: namnet är H1 (≤ 80), titeln är SERP-raden (≤ 60).
  - ⚠️ **Rättningen syns inte direkt.** Storefronten cachar den renderade sidan, och
    varken `?cb=`-parameter eller `Cache-Control: no-cache` går förbi den — de slår
    bara mot CDN:en, inte mot sidbygget. Kontrollera att `seoData` blivit rätt genom
    att läsa tillbaka via API:t; den renderade titeln följer efter vid nästa ombyggnad.
  - ☠️ **Och den FÖRSTA hämtningen kan visa den gamla sidan — den bara beställer den
    nya.** ISR svarar *stale-while-revalidate*: `x-vercel-cache: HIT` på ett utgånget
    svar betyder att du fick det GAMLA innehållet och att ombyggnaden startade i
    bakgrunden. Uppmätt 2026-09-03 under katalogsvepet: en sida vars kodrad var
    borttagen i Wix renderade fortfarande koden vid första anropet, och var ren vid
    nästa (`age: 63`). Ett svep som mäter en gång per sida rapporterar alltså falska
    kvarvarande fel.

    **Hämta därför två gånger, och lita på den andra** — eller läs Wix, som är facit:

    ```bash
    curl -s -o /dev/null "$adress"          # bestaller ombyggnaden
    curl -s "$adress" | grep -c '<sokstrang>'   # detta ar matningen
    ```

    Samma familj som husets vanligaste regel, speglad: här är det inte ett svar utan
    fel som saknar bevisvärde, utan ett svar MED fel som inte är ett bevis.
- **meta description:** ≤ ~155 tecken, nytta + sökord, **inga overifierade påståenden** (ingen "fri frakt" om det inte stämmer).

> 🟠 **Rättar du ett sakfel i efterhand — rätta `seoData` i SAMMA veva.**
> Meta-beskrivningen är ett **eget fält**, inte en spegling av brödtexten. Skriver du
> om beskrivningen på en publicerad produkt lever den gamla formuleringen kvar i
> `seoData` — och därifrån går den ut i `<meta name="description">`, `og:description`,
> `twitter:description` **och** `Product`-JSON-LD:ns `description`, eftersom frontend
> genererar allt det ur samma fält. Ett felaktigt påstående kan alltså vara borta ur
> hela produktsidans synliga text och ändå vara det enda Google och Facebook citerar.
> Sök på det borttagna ordet i den **renderade HTML:en**, inte bara i `plainDescription`:
> hittar du det i en `<meta>`-tagg är det `seoData` som ska patchas.
> Fällan slog till 2026-08-26 på `f0e0ee14` (smal hurts 40 cm): "kullagrade skenor"
> var borta ur beskrivning, h2 och spec-tabell men stod kvar i meta description.

> ☠️ **SKICKA INTE `visible: false` I STEG 7 — DET SLÅR NER VARIANTEN (2026-09-10).**
> Att skriva ut `visible: false` i textpatchen ser ut som det försiktiga valet:
> produkten SKA ju förbli utkast. Det är tvärtom. Produktens `false` speglas ned
> på varianten, och en variant med `visible: false` betyder att sidan saknar
> köpbar variant den dag den publiceras.
>
> Uppmätt i runda 120, samma åtta produkter, samma runda, samma kropp så när som
> på det ena fältet:
>
> | Steg 7-kroppen | produkter | `variantsInfo.variants[].visible` efteråt |
> |---|--:|---|
> | med `"visible": false` | 2 | **`false` på båda** |
> | utan fältet | 6 | `true` på alla sex |
>
> Utelämnat fält rör inte synligheten alls — produkten låg redan på `false` och
> stannade där. Steg 7 ska alltså skicka `id`, `revision`, `name`, `slug`,
> `plainDescription` och `seoData` och **inget mer**.
>
> ⚠️ Steg 8:s `variantsInfo`-PATCH är undantaget och kräver båda leden
> (`visible: false` på produkten, `visible: true` på varianten) — där publicerar
> ett utelämnat produktfält i stället utkastet. Reglerna är alltså MOTSATTA i de
> två stegen, och det är därför de mäts var för sig.
>
> ⚠️ **Vad som gör det farligt är att ingenting klagar.** PATCH-svaret ekar
> `visible: false` på produkten — precis vad man ville — och variantens rad
> ligger längre ned i samma svar. Kontrollen som biter är att läsa
> `variantsInfo.variants[].visible` i kvittot, inte produktens.

> **Viktigt:** en PATCH av `seoData` **ersätter hela objektet** – skicka därför ALLTID med samtliga taggar nedan, inte bara den du ändrar.

```
GET .../products/{PRODUCT_ID}        // hämta färsk revision precis innan
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "id": "{PRODUCT_ID}",
  "revision": "{FÄRSK_REVISION}",
  "name": "<Produktnamn med fokussökord>",
  "slug": "<slug-med-fokussokord>",
  "seoData": {
    "tags": [
      { "type": "title", "children": "<SEO-titel ≤60 tecken>", "custom": false, "disabled": false },
      { "type": "meta", "props": { "name": "description", "content": "<meta ≤155 tecken>" }, "children": "", "custom": true, "disabled": false }
    ],
    "settings": {
      "preventAutoRedirect": false,
      "keywords": [
        { "term": "<fokussökord, t.ex. starthjälp bil>", "isMain": true, "origin": "USER" },
        { "term": "<relaterat sökord>", "isMain": false, "origin": "USER" },
        { "term": "<relaterat sökord>", "isMain": false, "origin": "USER" }
      ]
    }
  }
} }
```

> Frontend bygger OpenGraph + `Product`-JSON-LD själv från produktfälten, så `og:`-taggar i `seoData` behövs inte. Vill du ändå ha dem skadar de inte.
### Beskrivningen

**Rekommenderat: skicka beskrivningen som `plainDescription` (ren HTML)** i samma Steg 7-PATCH. Wix **auto-genererar Ricos-`description`** för storefronten (samma väg som importen själv använder — `lib/import/pipeline.ts` skickar `plainDescription`, och V1→V3-migreringen i `lib/wix/v3-products.ts`), och `splitFlikar` läser HTML:ens `<h2>`. Lägre risk än att handbygga Ricos-noder och mycket svårare att göra fel. Lägg fokussökordet naturligt i texten.

PATCH-body: `{ product: { id, revision, name, slug, seoData, plainDescription: "<html…>" } }`.

- **Bra struktur:** ingress → **Egenskaper** (`<p><strong>Egenskaper</strong></p>` + `<ul><li>…</li></ul>`, inline) → *(vid behov: en kort passar-det-dig-rad, se nedan)* → `<h2>Tekniska specifikationer</h2>` → `<h2>Användning och skötsel</h2>` → `<h2>Vanliga frågor</h2>` (FAQ-frågor som feta `<p>`-stycken **i beskrivningen** — INTE egna info-sektioner, taket är 400).

> 🛑 **Skriv INTE ett "Det du bör veta innan du köper"-block.** *(Leonards beslut 2026-08-14, omtaget 2026-08-22 efter att blocket smugit tillbaka på 23 sidor — Klart-kriteriet krävde det som regeln förbjöd. Båda ställena är nu rättade.)* Ordagrant: **"Vi ska ju försöka sälja produkter, inte försöka få dom att skita i att köpa."** Ett varningsblock högt upp på sidan läser kunden som en lista över skäl att avstå. De flesta produkter ska inte ha något sådant alls. **Samma sak gäller ett "Bra att veta"-block** — förbudet sitter på formen, inte på rubriken: byt inte ut namnet och behåll listan.
>
> **Fel att ta itu med — men på rätt ställe.** Leverantörens felaktiga påståenden ska fortfarande aldrig gå vidare till kunden. Skillnaden är att du **rättar påståendet** i stycket och i spec-tabellen i stället för att lägga till en brasklapp: skriv *"tre 4-megapixelsensorer"* i texten, inte *"leverantören kallar det 6K men…"*. Är varan bara duken utan stomme → titeln och ingressen säger "reservduk", inte "växthus". Är den MDF → skriv MDF. Ingen varnande sidoruta behövs när själva texten är sann från början.
>
> **Undvik särskilt:**
> - **Att skriva att vi inte vet.** *"Leverantören uppger inte …"* · *"vi har inga uppgifter om …"*. Mot kunden är **vi** leverantören. Vet vi inte — utelämna, eller ta reda på det.
> - **Att upprepa ett mått som redan står i spec-tabellen** och hänga en tveksamhet på det. Leonards exempel: *"Öppningen till hålan är 15 cm hög. En stor eller kraftig katt kommer inte in bekvämt. Mät din katt om du är osäker."* Måttet finns i tabellen; resten är bara tvivel.
> - **Att be kunden mäta, väga eller kontrollera** för att avgöra om varan duger.
>
> **När en rad ändå är befogad** — och bara då: om varan **inte fungerar alls** utan något kunden måste ha (fabriksmonterad CarPlay, eluttag, batterier, borrmaskin, egen stomme), eller om det finns en **hård gräns som är en del av köpet** (maxlast, måste förankras i vägg). Skriv den då som ett **positivt villkor med egen rubrik** — *"Passar bilar med fabriksmonterad CarPlay"*, *"Batterier: 3 × AA, ingår inte"* — inte som en varning under en generisk rubrik.

> ⚖️ **Allt som låter defensivt är inte självsabotage.** Marsvinshyddan säger *"Vi säljer den inte som det, för den uppfyller inte det svenska kravet"* och hänvisar till Jordbruksverkets SJVFS 2019:15 (L80). Det är en **laglig upplysning enligt Steg 2**, inte en ursäkt — den ska stå kvar. Skilj på *"vi vet inte"* (bort) och *"så här får varan lagligen säljas"* (kvar).

> ✍️ **Svensk sifferstil.** **Decimalkomma**, aldrig punkt: `4,5 Ah` · `1,8 m` · `0,31 m²`. Skriv **aldrig** en kommalista av tal med enheten sist — `"10, 20, 30 och 40 cm"` läses som fyra olika mått med oklar enhet. Använd snedstreck: **`10/20/30/40 cm`**. Samma sak för gradlägen: `0/45/60°`, inte `"0, 45 och 60 grader"`. Mått multipliceras med `×` och mellanslag: `72 × 57 × 56 cm`. Intervall får tankstreck: `18–36 månader`, `8–10 timmar`. *(Regeln fällde min egen copy tre gånger på en session — kontrollera den i slutkollen, inte bara när du skriver.)*

> ☠️ **Wix STRIPPAR `<br>` — skriv FAQ-fråga och svar som TVÅ `<p>` (2026-08-21).** Mönstret
> `<p><strong>Fråga?</strong><br>Svar</p>` ser rätt ut i bodyn, men Wix serialiserar om HTML:en
> (`<strong>` → `<span style="font-weight: 700">`) och **kastar `<br>`-taggen**. Kvar blir
> `…Fråga?</span>Svar</p>` — frågan sitter ihop med svaret utan radbrytning, på varje fråga.
> Skriv i stället, precis som de redan publicerade sidorna gör:
>
> ```html
> <p><strong>Fråga?</strong></p><p>Svar.</p>
> ```
>
> Kontrollera efter PATCH:en med en re-GET: `plainDescription.match(/<span style="font-weight: 700">[^<]*\?<\/span>(?!<\/p>)/g)` ska ge **noll** träffar.
> *(Upptäckt på campingbordet `85996bde`; sex frågor fick rättas i efterhand.)*

> ☠️ **Korshänvisningen MÅSTE vara en absolut adress.** Skickar du
> `href="/produkt/x"` skriver Wix om den till `href="https:/produkt/x"` — med
> **ETT** snedstreck. Det är ingen relativ länk längre utan en absolut mot
> värden `produkt`, alltså död. Skriv
> `href="https://www.fyndplats.se/produkt/x"` så finns det inget för Wix att
> lägga till.
>
> Uppmätt 2026-09-02 på tio fåtöljer: längddeltat blev **+21 per länk** i
> stället för väntade +15, och de sex extra tecknen var exakt `https:`. Runda 39
> klarade sig utan att någon visste om det — den råkade skriva absoluta
> adresser. **Det var deltat som avslöjade tio trasiga länkar, inget annat.**
> Grinden nedan är alltså inte bokföring: den är det enda som ser skillnad på en
> länk som fungerar och en som inte gör det.

> ☠️ **Formeln nedan är OFULLSTÄNDIG — den saknar `<li>`-termen. Räkna inte, NORMALISERA.**
> *(Uppmätt 2026-09-03: åtta av åtta produkter föll på formeln med +105 till +140 tecken.
> Orsaken är att Wix slår in varje `<li>`-innehåll i ett `<p>`, alltså **+7 per `<li>`** —
> och att radbrytningarna mellan block strippas, alltså **−1 per `\n`**. En formel som är
> fel är sämre än ingen formel: den lär dig att avfärda ett äkta larm som brus.)*
>
> Gör i stället om KÄLLAN till det Wix skulle ha lagrat och kräv **exakt strängmatchning**:
>
> ```python
> def normalisera(h):
>     h = re.sub(r">\s*\n\s*<", "><", h)                                  # radbrytningar
>     h = h.replace("<strong>", '<span style="font-weight: 700">')          # +21 per par
>     h = h.replace("</strong>", "</span>")
>     h = re.sub(r'(<a href="[^"]+")>', r'\1 target="_self">', h)           # +15 per länk
>     h = re.sub(r"<li>(?!<p>)(.*?)</li>", r"<li><p>\1</p></li>", h, flags=re.S)  # +7 per li
>     return h
> ```
>
> `normalisera(källa) == lagrad plainDescription` — byte för byte, på alla åtta i runda 47.
> Det är ett starkare kvitto än ett längdtal: en formel kan stämma medan tecknen är fel.
>
> ☠️ **Vill du ha kvittot som en HASH — räkna den med aritmetik som är exakt i BÅDA
> språken.** Att läsa tillbaka åtta beskrivningar à 3–4 kB kostar kontext; ett längdtal plus
> en hash gör samma jobb för en rad. Men den första hashen (FNV-1a) gav **åtta avvikelser av
> åtta** medan varenda längd stämde på tecknet — och felet låg i hashen, inte i datan:
> `h * 16777619` överstiger 2^53 i JavaScripts float64, så JS-sidan tappade precision och
> Python-sidan inte. Två korrekta implementationer av samma formel gav olika svar.
>
> ```js
> const hasha = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000000007; return String(h); };
> ```
>
> `h * 31` med `h < 1e9` ger 3,1e10 — långt under 2^53, alltså exakt i både JS och Python.
> Med den stämde alla åtta. **Ett kvitto vars två sidor räknas olika mäter
> implementationerna, inte datan** — och det ser ut precis som åtta trasiga skrivningar en
> minut före publicering.

> Den gamla formeln, för sammanhangets skull:
>
> 📏 **Längddeltat är ett kvitto — men det har TVÅ termer.**
> Wix serialiserar om `<strong>…</strong>` (17 tecken) till
> `<span style="font-weight: 700">…</span>` (38), alltså exakt **+21 per par**, och lägger
> till ` target="_self"` i varje `<a href>`, alltså **+15 per länk**. Formeln är därmed
>
> ```
> väntat = källa + 21 × antal <strong>-par + 15 × antal <a href>-länkar
> ```
>
> Jämför mot `plainDescription.length` i en **separat** re-GET med `fields=PLAIN_DESCRIPTION`.
> Stämmer det på tecknet gick inget förlorat; avviker det har Wix rört något du inte bad om.
> *(En produkt med tre `<strong>`-par gav +63 och såg fel ut mot en tumregel som sa "+21
> per produkt" — deltat var rätt hela tiden, regeln var fel. Rättat 2026-09-01.
> Länktermen mättes 2026-09-02 på åtta sängramar som alla låg exakt +15 över det väntade:
> varje sida bar en korshänvisning, och den lagrade taggen är
> `<a href="…" target="_self">` där den skickade var `<a href="…">`.)*
>
> ⚠️ **Ett oförklarat delta är inte automatiskt en förlust — men det får inte lämnas
> oförklarat.** Båda gångerna såg avvikelsen ut som en trasig skrivning och var en
> deterministisk normalisering. Leta reda på vad som växte innan du skriver om texten:
> ett delta man börjar ignorera slutar vara ett kvitto.

> ⚠️ **Flik-rubriker MÅSTE vara rena `<h2>Titel</h2>` — ingen fetstil, inget `<span>`.** Headless-storefronten (`components/productview.tsx` → `splitFlikar`/`FLIK_TITLE_PATTERNS`) och `lib/import/tabs.ts` bygger PDP-flikarna genom att splitta beskrivningen på **bara** `<h2>Titel</h2>`. Blir HTML:en `<h2><span style="font-weight:700">Titel</span></h2>` (BOLD på rubriken) faller matchningen och "Tekniska specifikationer"/"Vanliga frågor" hamnar **inline** i stället för som flikar. Skriv fliktitlarna ordagrant — **Tekniska specifikationer**, **Vanliga frågor**, **Användning och skötsel** ("Kontakta oss" lägger frontenden till själv). Fet text är OK i **stycken** (t.ex. FAQ-frågor), aldrig på `<h2>`-raden. Skickar du ren `<h2>Titel</h2>` i HTML wrappar Wix den inte — då uppstår problemet inte.

> **Alternativ (Ricos direkt):** vill du hellre skicka `"description": { "nodes": [...] }` — stycke `{"type":"PARAGRAPH","id":"p1","nodes":[{"type":"TEXT","id":"","nodes":[],"textData":{"text":"…","decorations":[]}}],"paragraphData":{}}`, rubrik `{"type":"HEADING","id":"h1","nodes":[<TEXT utan decorations>],"headingData":{"level":2}}` (TEXT-noden **helt ren**), punktlista `{"type":"BULLETED_LIST","id":"ul1","nodes":[{"type":"LIST_ITEM","id":"li1","nodes":[{"type":"PARAGRAPH","id":"","nodes":[<TEXT>],"paragraphData":{}}]}]}`, fet `"decorations":[{"type":"BOLD","fontWeightValue":700}]` (bara i stycken, **aldrig** på HEADING). Samma flik-regel gäller.

-----

> 📐 **Husstilen — så ser en polerad beskrivning ut i verkligheten.** Mallen ovan sa
> tidigare "Egenskaper + `<ul>`"; de publicerade sidorna använder i stället egna
> `<h2>`-avsnitt och en riktig tabell. Bygg nya sidor efter detta:
>
> ```
> <p>ingress — vad varan är, i två till tre meningar med fokussökordet</p>
> <h2>Egen rubrik per försäljningsargument</h2>   ← tre till fem stycken
> <p>…</p>
> <h2>Tekniska specifikationer</h2><table>…</table>
> <h2>Användning och skötsel</h2>                 ← fyra till sex stycken
> <h2>Vanliga frågor</h2>                         ← sex till åtta frågor
> ```
>
> Rubrikerna ska säga något (*"44 mm är gränsen"*, *"Foten ingår inte"*), inte vara
> generiska etiketter. Spec-tabellen byggs så här — första raden är alltid
> `Egenskap / Uppgift`:
>
> ```js
> const R = (a, b) => '<tr><td><p>' + a + '</p></td><td><p>' + b + '</p></td></tr>';
> const F = (q, s) => '<p><span style="font-weight: 700">' + q + '</span></p><p>' + s + '</p>';
>
> '<h2>Tekniska specifikationer</h2><table>' + R('Egenskap','Uppgift') + R('Effekt','1400 W') + … + '</table>'
> '<h2>Vanliga frågor</h2>' + F('Vilka kapslar passar?','Nespresso Original, …')
> ```
>
> `F()` ger två separata `<p>` — det är formen som överlever Wix serialisering
> (se `<br>`-noten ovan).

-----

> 📊 **Mätt mot katalogen 2026-08-30 — så ser de 1 154 publicerade sidorna faktiskt ut.**
> Runbooken föreskrev `<table>`; verkligheten är en annan, och verkligheten vinner
> eftersom sidorna ska likna varandra:
>
> | | |
> |---|---:|
> | Spec-block som `<ul>` | **850** |
> | Spec-block som `<table>` | 297 |
> | Med raden `Egenskap / Uppgift` | 286 |
> | Med `<h2>Användning och skötsel</h2>` | **992** |
> | Utan skötselavsnitt | 162 |
> | FAQ-frågor, median | **8** |
>
> **`<ul>` är husstilen.** En `<table>` är inte fel, men en ny sida ska inte välja den
> utan skäl. Skriv spec-blocket som `<ul><li><p>Etikett: värde</p></li>…</ul>`.
>
> ☠️ **Alla tre avsnitten är obligatoriska, i den här ordningen** *(Leonards
> påminnelse 2026-08-30, efter att 21 sidor publicerats utan skötselavsnitt)*:
>
> ```
> <h2>Tekniska specifikationer</h2><ul>…</ul>
> <h2>Användning och skötsel</h2><p>…</p>
> <h2>Vanliga frågor</h2>…
> ```
>
> **Sikta på 6–8 FAQ-frågor**, inte fyra. Medianen i katalogen är åtta, och en sida
> med fyra frågor bredvid en med åtta ser halvfärdig ut i jämförelsen. Frågorna ska
> vara verkliga köpfrågor — mått, vad som ingår, vad som krävs för att varan ska
> fungera — inte utfyllnad.
>
> Skötselavsnittet ska vara **konkret och härlett ur produkten**: fritt djup framför
> en fällbar fåtölj, luggriktning på manchester, bryt strömmen vid proppskåpet före
> lampbyte. Generiska rader som "torka av vid behov" bär ingenting.

### ☠️ Läs ALDRIG tillbaka i samma loop som skrivningen — GET:en kan svara med tillståndet FÖRE (2026-09-05)

Facit-kontrollen kördes inne i skrivloopen: `GET revision → PATCH → GET
återläsning`, per produkt. Två av tre produkter kom tillbaka gröna. Den tredje
(`c3e0af3f`) rapporterades som **misslyckad** — och läste tillbaka exakt den
längd och den hash som den FÖREGÅENDE skrivningen hade lagt där, alltså inte
skräp utan ett äldre giltigt tillstånd.

En separat läsning en minut senare gav `revision 3`, rätt längd, rätt hash och
rätt text. **Skrivningen hade tagit hela tiden.** Det var läsningen som var för
tidig.

☠️ **Och den farliga riktningen är den motsatta.** Här gjorde det stale svaret
en LYCKAD skrivning till ett falsklarm, vilket är ofarligt — man kör om. Men om
man kör om samma text efter en skrivning som INTE tog, returnerar en stale
läsning det gamla innehållet — som är identiskt med det man just skickade — och
grinden går grön på en skrivning som aldrig hände. Facit skulle då bekräfta
exakt ingenting.

**Regeln: skrivning och verifiering är TVÅ pass.** Skriv alla produkter, gör
sedan återläsningen i ett eget anrop. Samma familj som ISR-cachen i Steg 14:
det första svaret efter en ändring beställer den, det visar den inte.

### ☠️ ETT LÄNKAT TAL FÅR BARA STÅ I LÄNKENS EGET STYCKE

Korslänken till ett syskon förklarar oftast SKILLNADEN, och då måste den bära
syskonets mått: *"143 cm-versionen — den är åtta centimeter längre och väger
10,6 kg"*. De talen tillhör inte den här produkten.

En talgrind som listar dem som "tillåtna" släpper dem därmed lösa på HELA
sidan — och den vanligaste förväxlingen i en färgfamilj är just att skriva
syskonets mått i sin egen spec-tabell.

Runda 91 byggde listan så och kom undan: den länkade modellens styrhöjd
(75–80 cm) kunde aldrig rimligen skrivas som den egna. Runda 92 kunde det, och
**båda** mutationerna gick rakt igenom en grind som annars fällde nitton av
tjugoen:

| mutation | grinden såg |
|---|---|
| `Mått: 135 × …` → `Mått: 143 × …` | inget — 143 stod i "tillåtna" |
| `Väger 9,8 kg` → `Väger 10,6 kg` | inget — 10,6 stod i "tillåtna" |

**Regeln: zonindela talgrinden.** Dela texten i stycken, och tillåt ett länkat
tal bara i ett stycke som faktiskt innehåller `<a href`. Utanför det gäller
produktens egen uppsättning ensam.

```python
for stycke in re.findall(r"<(?:p|li)\b[^>]*>.*?</(?:p|li)>", html, re.S):
    tillatna = tal | tal_lank if "<a href" in stycke else tal
```

Samma tanke som randgrindens per-fras-krav i Steg 4: **en tillåtelse ska gälla
där den är motiverad, inte på hela sidan.**

### ☠️ En relativ länk i beskrivningen blir `https:/produkt/…` och går sönder

Färgsyskon korslänkas i ingressen. Skriver du länken **rotrelativt** skriver Wix om
den vid sparandet:

| du skickar | Wix lagrar | resultat |
|---|---|---|
| `href="/produkt/x"` | `href="https:/produkt/x"` | **trasig** — värden blir `produkt` |
| `href="https://www.fyndplats.se/produkt/x"` | oförändrad | fungerar |

Uppmätt 2026-09-03 med en sond på ett osynligt utkast: båda formerna skickades i
samma PATCH, och bara den absoluta kom tillbaka hel. Wix normaliserar HTML:en (samma
mekanism som slår in varje `<li>` i ett `<p>` och strippar radbrytningar) och sätter
`https:` framför en path som saknar värdnamn — vilket ger **en** snedstreck, inte två.
Enligt URL-standarden parsas `https:/produkt/x` som värden `produkt`.

**Skriv alltid ut hela adressen.** Felet syns inte i Wix-svaret, inte i en läsning av
`plainDescription` mot Wix, och inte i en ögonkontroll av sidan — bara i ett klick
eller i ett svep efter strängen `https:/produkt`.

`kolla.sh`-raden som fångar det:

```bash
grep -c 'https:/produkt' sidan.html      # ska vara 0
```

#### ☠️ Och skriv butikens sökväg, inte Wix-editorns

Svepet 2026-09-03 hittade 64 trasiga länkar på 31 sidor. Sextio pekade på `/produkt/`,
men fyra bar de sökvägar Wix-editorn visar — och de två sorterna är olika allvarliga.
Uppmätt mot skarpa `www.fyndplats.se` samma dag:

| sökväg | svar |
|---|---|
| `/produkt/<slug>` | **200** |
| `/product-page/<slug>` | 308 → `/produkt/<slug>` — fungerar, men via ett hopp |
| `/kategori/<slug>` | **200** |
| `/category/<slug>` | **404** — ingen omdirigering finns |

Kategorilänken är den farliga. Hade lagningen bara satt tillbaka värdnamnet vore
resultatet `https://www.fyndplats.se/category/…`, alltså en **intern 404** — sämre än
före, eftersom en död länk på egen domän också blir crawlad.

`SOKVAGSRATTNINGAR` i `lib/seo/relativa-lankar.ts` bär de två uppmätta paren, och de
tillämpas **bara** på hrefs som ändå ska skrivas om för att de saknar värdnamn. En
länk som redan är absolut och hel rörs inte — blast-radien ska vara exakt defekten,
samma regel som prisreparationens *"oförändrat inköpspris → varianten rörs inte alls"*.

⚠️ **Lägg aldrig till ett par utan att mäta båda sidorna först.** En gissad sökväg
byter en död länk mot en intern 404. Kvittot efter lagningen är att varje resulterande
adress svarar 200 **utan** omdirigering:

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$adress"    # ska vara 200, inte 308
```


-----

### ☠️ SKU:n avgörs när du väljer SLUGGEN — räkna den i Steg 1, inte här (2026-09-05)

`buildSku` fogar ihop slugens tokens upp till **`PRODUCT_PART_MAX = 24`** tecken
och bryter på hel-ordsgräns. En slug som är ETT tecken för lång tappar därför
hela sista token — tyst, och utan att något fel visas någonstans.

Uppmätt i runda 62:

| slug | tecken | SKU |
|---|--:|---|
| `gungande-knastol-ljusgra` | 24 | `FP-gungande-knastol-ljusgra` |
| `gungande-knastol-gra` | 20 | `FP-gungande-knastol-gra` |
| **`gungande-knastol-graddvit`** | **25** | **`FP-gungande-knastol`** ☠️ |

Den sista är en av TRE färgsyskon, och dess SKU är den enda utan färg. Två
konsekvenser: etiketten slutar skilja syskonen åt i flöden och på kvitton, och
nästa produkt vars slug trunkeras likadant får samma SKU. **Det är precis så
katalogen fick elva SKU:er delade av tjugofyra publicerade produkter.**

**Regeln: räkna fram SKU:n i samma stund du låser sluggen (Steg 1).** Blir
färgen — eller vilken kvalificerare som helst — borta, korta sluggen i stället
för att acceptera SKU:n. I runda 62 löstes det genom att byta `gräddvit` mot
`kräm`, som dessutom är katalogens egen term för färgen: den publicerade
knästolssidans `Färg`-val heter `Kräm`. Sluggen gick från 25 till 21 tecken och
alla åtta SKU:er behöll sin färg.

⚠️ **Att korta sluggen är gratis bara på ett utkast.** På en publicerad sida
gäller redirect-regeln nedan. Ännu ett skäl att räkna SKU:n före publicering.

## Steg 8 – Re-synka SKU till den nya sluggen (1 anrop, mutation)

> ☠️ **STEGET HAR TVÅ HALVOR, OCH BARA DEN ENA GÅR VIA WORKFLOWEN.** Uppmätt i
> runda 108. `polish-mapping.yml` (läge `stampla`, `variant_skus`) skriver
> **mappningsradens** `variants[].sku`. Wix EGEN variant-SKU rörs inte av den,
> och den är den kunden och feeden ser.
>
> Alla sex sidorna i rundan gick igenom mappningsstämplingen med grönt och bar
> ändå kvar leverantörens tyska sträng i Wix — dessutom identisk inom varje
> storlekspar, alltså en krock:
>
> | Wix-SKU efter mappningsstämplingen | satt på |
> |---|---|
> | `FP-4-teiliger-raumtrenner` | två produkter |
> | `FP-6-teiliger-raumtrenner` | två produkter |
> | `FP-8-teiliger-raumtrenner` | två produkter |
>
> Wix-halvan är en **`variantsInfo`-PATCH**: läs varianterna, byt bara `sku`,
> skicka tillbaka dem verbatim. ☠️ Matcha på `wixVariantId`, aldrig på position
> — två fält heter `sku` och betyder olika saker, och positionsmatchning
> återinför precis den förväxling som gjorde att prissynken skrev till
> ingenting i en månad. ☠️ Och skicka `visible` explicit i BÅDA leden: en
> `variantsInfo`-PATCH publicerar annars ett utkast, och produktens `false`
> speglas ned på varianten.
>
> ⚠️ **Det som hittade felet var KVITTOT, inte en grind.** Publiceringens egen
> GET jämför SKU:n mot den förväntade strängen. Hade den bara räknat "finns en
> SKU" hade sex sidor gått live med tyska, krockande artikelnummer. Kontrollera
> alltså strängen, inte förekomsten.

Importen byggde SKU:n ur den **råa** (engelska, märkesledda) sluggen, t.ex. `FP-2-4g-remote-control-1-st`. När du bytt slug i Steg 7 stämmer den inte längre — re-synka den så den matchar den **polerade svenska** sluggen, t.ex. `FP-radiostyrd-gravmaskin-1-st`. Ofarligt: synk/fulfillment nycklar på `wixVariantId`, inte på SKU-strängen (se SKU-noten i *Fasta fakta*).

**SKU-format** (= `lib/import/sku.ts`): `FP-<produkt>-<variant>` ur den **polerade sluggen** + variantens optionsvärde. ASCII (å/ä→a, ö→o), ledande **dropship-märke strippat** (etablerade märken som Pagani Design/LAIKOU behålls), produkt-delen **≤24 tecken** (kapa på bindestreck), variant-delen **≤12 tecken**, hela **≤40 tecken**, **unikt inom produkten**. Saknar produkten optionsvärden → bara `FP-<produkt>`.

```

> ☠️ **En FÄRGFAMILJ spränger regeln — den kan inte ge distinkta SKU:er.** Uppmätt
> 2026-09-03 på hundvagnarna (batch 58). Husets andra regel säger att färgvarianter
> får EGNA korslänkade sidor, så färgen ligger i sluggens svans — och det är precis
> den svansen `PRODUCT_PART_MAX = 24` klipper bort:
>
> | | |
> |---|---|
> | `hundvagn-mellanstor-hund-25-kg-ljusgra` | → `FP-hundvagn-mellanstor-hund` |
> | `hundvagn-mellanstor-hund-25-kg-morkgron` | → `FP-hundvagn-mellanstor-hund` |
> | …och tre till | **samma sträng, fem gånger** |
>
> Kört genom den riktiga `buildVariantSkus`, inte uppskattat. Att i stället ta HELA
> sluggen hjälper inte: `FP-` + slug blir 41–43 tecken på fyra av de fem, och Wix
> tak är 40. **Ingen läsning av regeln som den står ger fem distinkta SKU:er.**
>
> Det strider mot `sku.ts`:s egen motivering — *"snygga, icke-krockande artikel-
> nummer i flöden/feed"*. Regeln skrevs för `FP-<produkt>-<variant>`, där färgen är
> ett OPTIONSVÄRDE på en produkt; 24-teckensgränsen finns bara för att reservera
> plats åt just den variant-delen. När familjen är fem separata produkter finns
> ingen variant-del att reservera för, och reservationen äter i stället det enda
> som skiljer produkterna åt.
>
> **Tills regeln ändras: behåll den SÄRSKILJANDE svansen och kapa mitten i stället.**
> Batch 58 fick `FP-hundvagn-25-kg-ljusgra`, `…-morkgron`, `…-gra`, `…-senapsgul`,
> `…-svart-rod` — svenska, distinkta, ≤40. Samma princip på 30 kg-vagnen, där
> svansen (`hopfallning`) INTE särskiljer något: `FP-hundvagn-30-kg-ett-stegs`.
>
> ⚠️ **Vad som INTE är fixat:** `lib/import/sku.ts` bygger fortfarande krockande
> SKU:er för varje framtida färgfamilj som importeras. Skadan är begränsad —
> JSON-LD:ns `sku` är Wix eget UUID, så kollisionen når varken kund eller Google,
> och `bySku` i `lib/wix/orders.ts` (som HADE slagit ihop fem produkters försäljning
> till en rad) läses i dag bara av tester. Men den är latent, och den växer med
> varje färgfamilj.
GET .../products/{PRODUCT_ID}?fields=VARIANT_OPTION_CHOICE_NAMES   // slug, options, variants (sku + optionsnamn) + färsk revision
PATCH .../products/{PRODUCT_ID}
```

Bygg nya SKU:er ur GET-svaret och PATCHa **bara** `sku` (allt annat verbatim):

```js
// efter GET: const p = res.product; const slug = p.slug, vinfo = p.variantsInfo||{}, variants = vinfo.variants||[], options = p.options||[];
const BRANDS = new Set(["succebuy","vevor","homcom","pawhut","outsunny","giantex","costway","tobbi","aosom"]); // full lista: lib/import/sku.ts
const slugify = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const stripBrand = s => { const p = slugify(s).split("-").filter(Boolean); while (p.length>1 && BRANDS.has(p[0])) p.shift(); return p.join("-"); };
const cut = (s,max) => { if (s.length<=max) return s; let o=""; for (const w of s.split("-")){ if(!w) continue; if(!o){ o = w.length<=max?w:w.slice(0,max); if(w.length>max) break; } else if((o+"-"+w).length<=max){ o+="-"+w; } else break; } return o||s.slice(0,max); };
const prod = cut(stripBrand(slug), 24) || "produkt";
const used = new Set();
const newVariants = variants.map(v => {
  const val = (v.choices||[]).map(c => c.optionChoiceNames && c.optionChoiceNames.choiceName).filter(Boolean).join(" ");
  let base = (val ? `FP-${prod}-${cut(slugify(val),12)}` : `FP-${prod}`).slice(0,40).replace(/-+$/g,"");
  let sku = base; for (let n=2; used.has(sku); n++){ const suf=`-${n}`; sku = base.slice(0,40-suf.length).replace(/-+$/g,"")+suf; }
  used.add(sku); return { ...v, sku };
});
// PATCH body: { product: { id, revision, visible, options, variantsInfo: { ...vinfo, variants: newVariants } } }
```

☠️ **`visible` MÅSTE med i bodyn — annars PUBLICERAS utkastet av SKU-patchen.** En PATCH
som bär `variantsInfo` utan ett uttryckligt `visible` tar produkten från `visible:false`
till `visible:true`: Wix behandlar en variantskrivning som en publicering, och fältmasken
skyddar inte synligheten (uppmätt mot skarpa V3 2026-08-28, dokumenterat i `CLAUDE.md`
under Aosom-synken).

⚠️ **Regeln fanns redan i runbooken — men under Steg 11B, som handlar om `linkedMedia`.**
Den som polerade en produkt UTAN optioner läste aldrig det stycket, och receptet här sa
inget om `visible`. Så publicerades tunneltältet `e4b000fa` 2026-08-29 av sin egen
SKU-patch, med tyska alt-texter och utan kategori, i sexton sekunder innan det upptäcktes.
**En regel som bara står i det steg där den råkade upptäckas är en regel som glöms bort** —
därför står den nu här, i Steg 13, och i Fasta fakta.

Samma regel gäller varje PATCH i HELA kedjan — inte bara Steg 8–11: **skicka alltid produktens
`visible` explicit**,
också när du inte tänker röra den. Läs tillbaka `visible` i svaret — det är det enda kvittot.

⚠️ Skicka `options` **+** `variantsInfo` verbatim — annars **428 `MISSING_OPTIONS_ON_UPDATE_VARIANTS`** (en produkt helt utan optioner behöver inte `options`).

> ☠️ **Produktens `visible:false` smittar av sig på varje variant — skicka alltid variantens
> egen `visible` med.** Det är inte SKU-koden som gör det: sminkbordet `e8f7eaed` hade
> `variants[0].visible: true` som råimport och stod på `false` direkt efter **bild**-PATCH:en
> i Steg 9, innan SKU:n var rörd. Varje PATCH som bär `visible:false` på produkten speglar
> ner värdet på varianterna. Undantaget är den PATCH där du skickar `variantsInfo` med ett
> **uttryckligt** `visible` per variant — då vinner ditt värde (verifierat i samma körning:
> `{...v, sku, visible:true}` med produktens `visible:false` gav en synlig variant på en
> osynlig produkt).
>
> ☠️ **Och den slår till på Steg 9 — varje gång.** Bild-PATCH:en bär
> `visible: false` (produkten ska ju förbli utkast), och Wix speglar då ned
> `false` på varenda variant som Steg 8 nyss satt till `true`. Uppmätt på åtta
> av åtta produkter i runda 45. Det är inte ett fel att undvika utan ett
> normalförlopp att räkna med: låt den avslutande Steg 13-PATCH:en sätta båda
> till `true`, och lita på att Klart-kriteriet läser om varianten före
> publiceringen. Grinden fångade det på alla åtta.
>
> ☠️ **Och det gäller ÄVEN en sen texträttelse.** Steg 12 ligger utanför intervallet ovan, och det
> är just där fällan slog till 2026-09-02: fyra av åtta köksskåp fick en rättelse-PATCH som bar
> `plainDescription` + `visible:false` men INGET `variantsInfo` — och Wix speglade då ner
> `false` på varenda variant som Steg 8 nyss satt till `true`. Skrivningen rapporterade full
> framgång. Det syntes bara för att Klart-kriteriet läser om `variantsInfo.variants[].visible`
> precis före publiceringen. **Rör du en publicerad-eller-snart-publicerad produkt EFTER Steg 8,
> skicka `variantsInfo` med ett uttryckligt `visible: true` per variant i samma PATCH** — eller
> låt den avslutande Steg 13-PATCH:en sätta båda, vilket är enklast.
>
> Konsekvensen om det missas: produkten publiceras, syns i butiken och **går inte att lägga
> i varukorgen**. Det syns inte i produktvyn. Klart-kriteriet kräver redan `visible:true` på
> varje variant — det här är orsaken det kravet fångar. Lägg därför `visible: true` i
> variantobjektet i Steg 8, och läs om värdet i slutkollen.
>
> Samma PATCH nollar variantens `media`-pekare, och Wix tar **inte** emot den igen — känt
> sedan sidobordet `c9a0f88d`. Harmlöst på en produkt utan optioner (galleriet ligger i
> `media.itemsInfo`), men på en produkt med färgval är swatchen borta: gör SKU-resynken
> FÖRE variantbildkopplingen i Steg 11, aldrig efter.

> **Spara ett anrop — men BARA om inget mer återstår:** har produkten inga bilder att fixa (Steg 9), ingen kategori (Steg 10) och ingen variantkoppling (Steg 11) kvar → lägg `visible: true` i **samma** PATCH så görs SKU-resynken + publiceringen i ett. Återstår något av dessa: **publicera SIST** (Steg 13), aldrig här — annars går produkten live innan bilder/kategori/varianter är klara.
>
> **Undantag:** börjar SKU:n med `FYND-XXX-NNN` (kurerat artikelnummer) eller `AE-<hash>` (äldre schema) — **rör den inte**, flagga till Leonard.

☠️ **I en syskonbatch kollapsar den mekaniska kapningen till EN SKU — och den kan redan
vara upptagen.** Regeln säger "unikt inom produkten", och det räcker inte när sju sidor i
samma kategori delar de ledande orden. Barstolarna 2026-09-02: alla sju sluggarna börjar
`barstolar-2-pack-…`, och 24-teckenskapningen på hel-ords-gräns ger `barstolar-2-pack` för
varenda en → **sju identiska `FP-barstolar-2-pack`**. Värre: den strängen bar redan den
publicerade `barstolar-2-pack`. Dedup-suffixet `-2/-3` hjälper inte — det räknas bara mot
andra VARIANTER i samma produkt, aldrig mot katalogen.

Det är samma defekt som två kontorsstolar med `FP-burostuhl-mit` (batch 47–48), och den
syns inte i något API-svar: Wix tar emot dubbletten, synken bryr sig inte (den matchar på
`wixVariantId`), och först i ett produktflöde blir två varor samma artikelnummer.

**Gör så här:** behåll sluggen — den ska leda med sökordet — men välj de SKILJANDE tokens
inom produkt-delens 24 tecken i stället för de första: `FP-barstolar-knappstoppad`,
`FP-barstolar-skalrygg-59`, `FP-barstolar-chenille-48`, `FP-barstolar-furu-korsrygg`.
**Kontrollera alltid mot syskonen som redan är publicerade i kategorin**, inte bara mot
batchen — det var den kontrollen som hittade krocken med den levande sidan.

### ☠️ Hela katalogen granskad: 171 publicerade sidor bar en oöversatt SKU (2026-09-02)

Den raden ovan slutade med "leta efter fler med samma mönster". Det gjordes, och svaret
var inte "några till". **1 518 publicerade produkter granskade, en GET per produkt** — det
finns ingen billigare väg, se API-noterna nedan:

| SKU-språk | varianter |
|---|---:|
| svenska (ok) | 2 254 |
| **engelska** | **118** |
| **tyska** | **36** |
| **spanska** | **10** |
| **husmärke i SKU:n** | **5** |
| `AE-<hash>` (äldre schema) | 8 |

Husmärkena är den allvarligaste: `FP-camping-tent-outsunny`, `FP-outdoor-canopy-outsunny`,
`FP-small-outsunny-vit`/`-gron` och `FP-durhand-carretilla`. `stripBrandPrefix` finns
uttryckligen för att det aldrig ska hända, och grinden gäller bara vid import — hoppas
Steg 8 över står märket kvar.

☠️ **Och defekten föder dubbletter.** Sju SKU-strängar satt på fler än en LEVANDE produkt:
`FP-l-formiger-schreibtisch` på **fyra** hörnskrivbord, `FP-badezimmerspiegel` på fyra
speglar, `FP-badezimmerspiegel-mit` och `FP-led-badezimmerspiegel` på tre var,
`FP-badezimmerschrank` på tre skåp, `FP-kommode-sideboard-4` på två byrår och
`FP-inflatable-santa-claus` på två helt olika tomtar. **21 produkter delade 7 artikelnummer.**
Orsaken är densamma som i barstolsbatchen: syskon vars RÅA slugg börjar likadant kapas till
samma 24 tecken, och dedup-suffixet räknas bara inom en produkt.

**Åtgärdat samma dag: 43 produkter, båda sidorna.** All tyska är borta ur katalogen, alla
sju dubblettgrupperna upplösta (omkontrollerat: noll dubbletter kvar i den delen), och
märkesläckagen är omdöpta. Wix-sidan via `variantsInfo`-PATCH med `visible` explicit,
mappningssidan via 43 `stampla`-körningar med TOMMA `needs_ai_polish`/`draft_status` så
poleringsflaggan inte rördes. Kvar som medvetet orört: **118 engelska + 10 spanska** SKU:er
på den äldre AliExpress-katalogen (språkfel, inga dubbletter), och de **8 `AE-<hash>`** som
regeln ovan säger att man inte ska röra.

⚠️ **Mappningen bar samma tyska sträng.** Kontrollerat med `las` på `b9c3c384` innan
rättningen: `"sku": "FP-schreibtisch-in-l-form"`. Steg 8 hoppas alltså över på BÅDA sidorna
samtidigt — den som lagar bara Wix lämnar kvar exakt den tysta drift stycket ovan varnar för.

☠️ **Heuristiken "SKU:ns första token saknas i sluggen" MISSAR fall.** Den hittade 36 av
träffarna men gick förbi `FP-led-badezimmerspiegel` på `sminkspegel-led-80x60-antiimma` —
`led` finns ju i sluggen. **Klassificera på SPRÅK, inte på likhet med sluggen.**

**Tre API-fakta som kostade tid att lära sig:**

- `visible` är **inte filtrerbart** på `POST /products/search`. Den svarar 200 och returnerar
  hela katalogen ändå — tysta utkast först. Samma familj som "ett svar utan fel är inget
  kvitto": filtret ignorerades, inte avvisades.
- **Markörpaging kan inte kombineras med filter** (`INVALID_CURSOR`). Vill man ha hela
  katalogen: paginera utan filter och sålla i koden.
- `$in` tar **max 10 operander**. Fler ger `INVALID_FILTER` — dela upp i tioklumpar.
- `fields=VARIANTS_INFO` finns **inte**; `MEDIA_ITEMS_INFO` ger både media OCH varianter.
  Och `products/query`/`search` fyller ALDRIG `variantsInfo` — därav en GET per produkt.

☠️ **RÄKNA SKU:n ur husregeln — skriv den inte för hand.** Runda 51 hade tre fel-SKU:er
och runda 53 två (`FP-matgrupp-smalt-bord-90x47` där regeln ger `FP-matgrupp-smalt-bord`,
`FP-matgrupp-klaffbord-110-cm` där den ger `FP-matgrupp-klaffbord-110`). Båda gångerna
var felet att 24-teckensgränsen kapades ur minnet i stället för ur koden — och båda
gångerna såg strängen fullt rimlig ut. Implementera `skuSlugify` +
`stripBrandPrefix` + `dropConnectors` + `joinWithinLimit` i grinden och jämför:

```python
vantad = sku_ur_husregeln(p["slug"])
if p["sku"] != vantad: fel("SKU %r men husregeln ger %r" % (p["sku"], vantad))
```

⚠️ Grindens variabelnamn får inte krocka med lintets övriga. Runda 53:s första utkast
döpte märkeslistan till `MARKEN` — samma namn som prosagrindens lista över husmärken —
och sköt tyst ner den. Mutationstestet fällde på `husmärke ☠️ SLAPP IGENOM` i samma varv.

**Verifiera:** nya SKU:n innehåller varken engelska råord eller **dropship-märke** och matchar sluggen. (Etablerade märken som Pagani Design/LAIKOU **behålls** i SKU:n – se märkesregeln i *Fasta fakta*.)

-----

-----

## Steg 9 – Bilder: ordning, alt-texter och egna kort

Rå-importen ger fem bilder med leverantörens egen titel som alt-text på allihop. Byt alla
till svenska som beskriver **det som faktiskt syns** — motiv, färg, vinkel, miljö — med
fokussökordet naturligt invävt. Inte samma mall × 5.

### ☠️ Alt-texten passerar INGEN grind — den är kundtext utan skydd

Steg-grinden läser `html`, `namn`, `titel` och `meta` ur rundans `texter.py`. Alt-texterna
skrivs här, rakt in i Wix media, och finns aldrig i den filen. **Varje regel grinden vaktar
är alltså oskyddad i alt-texten** — och det är det sämsta stället att ha ett hål, för
alt-texten är vad Google och skärmläsaren läser.

Uppmätt i runda 106: sex sidor vars brödtext säger ordagrant att hagen *"säljs inte som
kaninbostad"*. Grinden var grön på alla sex. **Fem av dem hade "kaniner" i en alt-text** —
*"…i en trädgård med två kaniner inuti"* — alltså precis det löfte rundans egen KANINLÖFTE-
regel fanns för att stoppa, en nivå under där regeln letade.

Två sätt att stänga det, och gör båda:

1. **Kör rundans förbjudna-ord-lista mot alt-texterna innan du skriver dem** — samma lista,
   samma mönster, inte en omskriven variant.
2. **Låt live-grinden i Steg 14 läsa hela HTML:en**, inte bara brödtexten. Det var den som
   hittade fallet ovan: alt-texten står i `<img alt="…">` i den renderade sidan, så en grind
   som söker i hela svaret ser den. En som klipper ut beskrivningen först gör det inte.

Regeln bakom är runbokens egen, från sifferstilen i Steg 13: **en grind skriven mot PLATSEN
där felet hittades täcker inte REGELN.** Säger regeln "aldrig", är ytan all kundtext — och
alt-texten är kundtext.

⚠️ **Beskriv VARAN, inte stajlingen.** Leverantörens miljöbild är iscensatt, och djuret,
barnet eller kaffekoppen i bilden är inte produktinformation. Tas de med blir alt-texten ett
påstående om användningen; utelämnas de är den fortfarande sann och fullständig för sitt
syfte. Runda 106:s rättning behöll varje verifierad detalj om varan (*"locken nedfällda"*,
*"husets lucka öppen"*) och tog bort djuret.

### Galleriets ordning är fast

| plats | vad |
|---|---|
| 1 | **Hjältebild** — renaste produktbilden. Blir `media.main` och produktkortet i butiken. |
| 2 | **Verklighetsbild** — varan i ett rum, i bruk, med något att skala mot. |
| 3+ | **Egna Fyndplats-kort.** |
| sist | **Måttritning.** |

Kunden bläddrar sällan förbi de första bilderna, och där ska hen ha sett vad varan är och
hur den ser ut hemma — inte två spec-tabeller i rad *(Leonards regel 2026-08-22)*. Saknar
leverantören miljöbild helt: sätt näst renaste produktbilden på plats 2 och notera
avsaknaden — bygg inte ett kort som ersättning.

🟠 **Varje polerad produkt ska ha MINST ett eget kort — normalt spec-kortet** *(Leonards
regel 2026-08-26)*. Kortet är det enda i galleriet som är **vårt**: de verifierade måtten
på ett ställe, i husets typografi, med källan i foten. Utan det är produktsidan en
vidarebefordran av leverantörens marknadsföring. Minimum är `card_spec` med de mått Steg 5
bekräftat, placerat efter verklighetsbilden — aldrig plats 1.

⚠️ **Rubriken måste bäras av FOTOT under den, inte av specen.** Kortet är ett bildlöfte:
läsaren ser rubriken och fotot i samma ögonkast, och stämmer de inte överens är kortet en
liten lögn på en sida vi själva har skrivit. Fällde tre kort i batch 60 (rubrik utan täckning
på två, italiensk rekvisitatext synlig på ett) och ett i batch 61: skrivbordet `cb403b5c`
heter "med skärmhylla" och sidan argumenterar korrekt för hyllan som skärmhållare — men
BÅDA kandidatbilderna visar en växt på hyllan och laptopen på skivan, så rubriken
"Skärmen 12,5 cm högre" pekade på en skärm som inte fanns i bilden. Blev "En hylla över
skivan". Sidans text stod kvar; det var kortets löfte som inte höll, inte påståendet.
**Granska alltid de färdiga korten i ett kontaktark innan uppladdningen** — felet syns på
en sekund där och aldrig i ett API-svar. Två av de fyra ändrade alt-texter som var
felskrivna av leverantören föll ut i samma granskning.

> ☠️ **STEGET GLÖMDES ÅTTA RUNDOR I RAD — och nu finns en grind.** Runda 110–120
> bär 6–9 spårade kort var; runda 121–128 bar **noll**, alltså ~65 publicerade
> sidor utan det enda i galleriet som är vårt. Leonard hittade det
> (*"du har kört flera batcher utan att göra fyndplats kort varför?"*), ingen
> grind gjorde det: kravet stod i runbooken men i INGEN KOD.
>
> `grindar.kortfel(html)` fäller nu en live sida som saknar `Faktakort`, bär
> kortet på plats 1, eller använder fel alt-form. Den körs i Steg 14, på RÅ
> html före `butikstvatt` — tvätten stryker bildattributen, och alt-texten ÄR
> det grinden granskar. `grindar.kortfiler()` fäller dessutom ett kort som inte
> är SPÅRAT i grenen, vilket är runda 106:s fel (sex kort laddades upp från
> adresser som svarade 404, och Wix svarade `success: true` på varenda en).
>
> Grinden är mutationstestad mot verkligheten: den fäller på runda 121, 123,
> 125 och 127:s live-sidor och är tyst på runda 128:s.
>
> ⚠️ **Och rubrikregeln kostade 7 av 65 kort en omskrivning** — alla samma fel,
> alla fångade PÅ ARKET och omöjliga att fånga i en textgrind:
>
> | kort | stod | varför det föll |
> |---|---|---|
> | `2bf00891` | "18,5 cm hopfälld" | vagnen är fotad UTFÄLLD |
> | `7b544155` | "Fem fack i tre plan" | lådan är fotad STÄNGD |
> | `bdd01b5f` | "Arbetsytan dras ut" | vagnen är fotad HOPSKJUTEN |
> | `1b534b0e`, `5447468e` | "Fem lådor med EVA-matta" | mattan ligger i stängda lådor |
> | `941867cb` | "Hålplank med trettio krokar" | planket är fotat TOMT |
> | `4d5b3bb5` | "Smal med löstagbart pennfack" | facket är INVÄNDIGT — pennkoppen i bilden är rekvisita |
>
> Mönstret är ett och detsamma: **rubriken tog ett tal ur spec-tabellen i
> stället för ett intryck ur fotot.** Talen är sanna och hör hemma i RADERNA;
> rubriken ska säga det läsaren ser i samma ögonkast. Ett åttonde kort,
> `887d388d`, ändrades av motsatt skäl — rubriken var sann men pekade inte på
> det som skiljer sidan från syskonet en rad ner i kategorilistan.
>
> Det rundageneriska i bygget bor i `tools/polish-assets/kortrunda.py`; en
> runda skriver bara `KORT` (kicker + rubrik) och `RADER` (spec-etiketter).
> `kortkvitto.py` kvitterar uppladdningen FÖRE media-PATCHen, och bevisar
> kopplingen bild→produkt på md5 i stället för på ordningen i anropet.

⚠️ **Alt-texten på kortet börjar med `Faktakort: ` och beskriver FAKTA, inte kortet.**
`Faktakort: fyra säckar på 27 liter, en per tvättsort. 86 × 38 × 82 cm` — inte
"Fyndplats-kort: …", som bara lägger vårt eget varumärke i ett fält som ska beskriva
innehåll. Batch 61 drev iväg till den formen på åtta produkter och fick skrivas om; det är
samma tvillingar-glider-isär-problem som `SHIP_AXIS_RE` och `EU_TULL_CODES`, fast i text.

☠️ **Polerar du syskon: fördela leverantörens miljöscener mellan dem.** Aosom återanvänder
samma scener med olika produkt inklistrad — de två infravärmarna (2026-08-29) delade tre
scener rakt av, samma mormor i samma rottingsoffa. Två av våra egna URL:er med identiska
foton är just den dubblett Google straffar, och den uppstår av oss, inte av leverantören.

### Skrivningen

`media.itemsInfo.items` **ersätts i sin helhet** vid varje PATCH. Därav reglerna:

- ☠️ **Varje item måste bära `altText`** — även de du inte rör. Ett item utan `altText` blir
  ett item UTAN alt-text, även om det hade en. Läs items med `?fields=MEDIA_ITEMS_INFO`
  först och skicka tillbaka de befintliga texterna. *(Svep 2026-08-26: 80 bilder på 10
  publicerade produkter stod utan alt-text — ett swatch-byte hade skrivit tillbaka
  fil-id-listan utan dem.)*
- **Sätt `items[i].altText`, inte `items[i].image.altText`.** `image` är readOnly; patchar du
  bara den svarar Wix `200 OK`, revisionen ökar och texten skrivs aldrig. Item-nivån speglas
  ned över `image` av sig själv — verifierat 2026-08-29 på tre produkter, där `{id, altText}`
  gav rätt text i båda fälten. *(Runbooken sa tidigare "sätt båda"; det behövs inte.)*
- ☠️ **Skicka `id` för filer som redan ligger i Media Manager, aldrig `url`.** `url` betyder
  "extern adress" för V3, så en wixstatic-adress importeras om till en NY fil. Det var så
  halva medialagringen blev kopior (se `CLAUDE.md`).
- ⚠️ **Skicka INTE `media.main`.** Den är readOnly och sätts till första item:et. Inkluderar
  du den ignorerar Wix **tyst hela `media`-objektet** — 200 OK, oförändrad revision, inget
  skrivet.
- ⚠️ **Fältet heter `media.itemsInfo.items`.** Skickar du `media.items` svarar PATCH:en 200
  med `"media":{}` och **galleriet töms** *(2026-08-19: en publicerad produkt stod bildlös)*.

☠️ **PATCH-svaret innehåller inte `media.itemsInfo`** — det fältet kommer bara när du begär
`fields=MEDIA_ITEMS_INFO`, vilket PATCH inte tar. Svaret kan alltså inte skilja "sparat"
från "raderat". **Verifiera alltid med en separat GET** och räkna bilderna.

✅ **LADDA UPP VIA GRENEN, INTE VIA BASE64** *(runda 99)*. `UploadImageToWixSite` tar
`imageUrls` med publika adresser, och repot ÄR publikt — så committa filerna till
poleringsgrenen och skicka
`https://raw.githubusercontent.com/<ägare>/<repo>/<gren>/<sökväg>`. Tolv filer gick i ETT
anrop, och ingen bild passerade chatten som base64. Det är samma väg `CLAUDE.md` redan
beskriver för korten ("måste ligga i grenen innan Wix hämtar dem"), och den är billigare i
både tokens och risk: base64 kan kapas tyst, en URL kan det inte.

⚠️ Pushen måste ligga FÖRE anropet — GitHub serverar bara det som finns i grenen.

☠️ **`UploadImageToWixSite` svarar `success: true` även när uppladdningen sedan
MISSLYCKAS.** Svaret bär `operationStatus: "PENDING"` — Wix har tagit emot uppdraget, inte
utfört det. Patchar du in ett `fileId` som hamnat i `FAILED` svarar V3 200 och **utelämnar
item:et** tyst; du märker det när galleriet gått från 6 bilder till 5. Kontrollera före
PATCH:en med ett `curl` mot `…/v1/fill/w_400,h_400,al_c,q_80/f.jpg`: **200 = klar,
403 = inte klar.** Håll filerna små — 1600² på ~200 kB går igenom där 2000² på 380 kB föll.

⚠️ **Ett tillräckligt detaljtätt foto går inte att komprimera ner under taket — byt
källbild i stället för att sänka kvaliteten.** Runda 52: två kort landade på 380–430 kB
vid q=80 och låg kvar över 230 kB även vid **q=40**, alltså långt under det som ser bra
ut. Orsaken satt i källan, inte i renderingen: bägge produkternas bild 2 är en tät
trädgårdsscen på 1 400–1 800 kB som 2000², medan samma produkters övriga bilder ligger
på 450–600 kB. Mät källfilernas storlek (`du -k`) innan du felsöker exporten.

Tre utvägar, i ordning: **byt till produktens studiobild** (lättast, och ofta ett tydligare
underlag för ett måttkort), beskär tätare, eller mjuka upp FOTOT — aldrig kortet, där
texten bor. ☠️ **`card_spec` bakar in fotot som data-URI i HTML:en, så en ren `render()`
återanvänder det GAMLA fotot.** Ändrar du beskärningen måste kortet BYGGAS om, inte bara
renderas om — annars mäter du samma fil en gång till och tror att åtgärden inte biter.

> ☠️ **OSKÄRPA ÄR DEN STARKASTE KNAPPEN AV DE TRE — och den var avskriven.**
> Uppmätt i runda 108 på en väv (polypropenband över tallspjälor), där fem av
> sex kort sprängde taket. På det värsta, 397 197 byte:
>
> | knapp | bästa utfall |
> |---|---|
> | krympa varan | 213 440 vid 42 % fyllnad av 79 % geometriskt möjliga |
> | nedsampla panelfotot | 269 710 vid 4× — **räckte inte** |
> | **gaussisk oskärpa** | **197 470 vid r=3 och varan i FULL storlek** |
>
> ⚠️ Runda 104 mätte r=1,3 till ~9 % och drog slutsatsen "oskärpa är fel
> medicin på nät". Slutsatsen är sann om RADIEN och falsk om METODEN: r=1 ger
> 14–23 %, r=2 ger 27–41 %, r=3 ger 43–50 %. **Kurvan är brant strax förbi
> r=1** — alltså precis där runda 104 slutade mäta. Mät hela kurvan innan du
> avskriver en metod.
>
> ☠️ **Lägg oskärpan på den BESKURNA varan, inte på den färdiga panelen.**
> Läggs den efter inklistringen suddas produktens kant mot det vita fältet
> till en grå gloria.
>
> ⚠️ **Och fyllnadsknappen kan vara helt overksam utan att se ut så.** När
> varan är HÖGRE än panelens 1,83 styr höjden, och `fyll` ignoreras. Runda 108
> fick byte för byte identiskt utfall vid 0,85 och 0,60 på ett sådant kort —
> en sökning över fyllnadsvärden ser ut som en skala och är det inte. Räkna
> först ut varans geometriska maxfyllnad (`bredd ÷ höjd ÷ 1,83`); ligger
> sökningens svar nära det talet har knappen aldrig bitit.

### Bilden måste vara kvadratisk

☠️ **OCH DET GÄLLER MÅTTRITNINGEN HÅRDAST — DÄR RYKER SIFFRORNA** *(uppmätt 2026-09-07)*.
En ritning som kapats på sin tyska textruta blir liggande (900 × 632–669), och det PDP:n
då beskär bort är vänster- och högerkanten — alltså exakt där måttetiketterna sitter.
Mätt på runda 98:s publicerade `9cfc2f50-3` (900 × 642), hämtad i båda formerna:

| hämtning | utfall |
|---|---|
| `fit/w_900,h_900` | hela ritningen: skål `24 cm` / `7 cm` / `≈2L`, djup `30 cm`, höjd `35,5 cm` |
| `fill/w_600,h_600,al_c` | skålens `24 cm` och `≈2L` HALVA, **höjdmåttet `35,5 cm` helt borta** |

Det är samma centrumbeskärning som gav runda 98:s falska "FEL PLATS"-larm — men här är
den inte ett mätfel, den är det kunden ser.

🔒 **Fyll ut till kvadrat med vitt i stället för att ladda upp den liggande.** Ritningarna
ligger på vit botten, så utfyllnaden är osynlig, och den kostar ingenting:

```python
kv = Image.new("RGB", (w, w), (255, 255, 255))
kv.paste(im, (0, (w - h) // 2))
```

⚠️ **Runda 98:s fem kapade ritningar ligger publicerade i liggande format** och tappar
alltså sina sidoetiketter. Hur många fler rundor som gjort samma sak är inte mätt.


PDP:n hämtar galleriet med `fill/w_N,h_N,al_c` och **centrumbeskär varje bild till kvadrat**.
En liggande eller stående studiobild kapas därför i kanterna och kunden ser produkten
avskuren — felet syns inte i katalogen, bara på sidan. Åtgärden är ren omramning: beskär
till produktens bbox och centrera på kvadratisk vit duk (~95 % fyllnad).

```python
sida = min(ut.size); vx = (ut.width-sida)//2; vy = (ut.height-sida)//2
assert kontroll[vy:vy+sida, vx:vx+sida].sum() == kontroll.sum(), 'kvadratbeskärningen kapar produkten'
```

**Miljöbilder är undantagna** — att en livsstilsbild beskärs är normalt. Regeln gäller
studiobilder på vit botten, där produkten ÄR motivet.

☠️ **En MÅTTRITNING måste paddas, inte beskäras.** Etiketterna sitter per
definition i kanterna, och centrumbeskärningen tar dem först. En ritning som är
1568 × 1392 tappar 6 % i vardera sidan — i runda 45 hade det ätit `60cm` och
`51,6cm` ur två av åtta. Padda till kvadrat i stället:

```python
s = int(max(im.size) * 1.02)
duk = Image.new("RGB", (s, s), (255, 255, 255))
duk.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
```

⚠️ **Att padda en studiobild till KORTPANELENS format är något annat, och där är rak
padding fel.** Panelen är 1,825:1; en kvadratisk 2000 × 2000-bild paddad till den bredden
blir 3650 px bred med varan som ett frimärke mitt i vitt. Beskär i stället till varans
bbox (`(a < 238).any(axis=2)`) och centrera på panelformatet med ~94 % fyllnad — varan
beskärs aldrig, bara luften runt den. Felet syns på en sekund i kontaktarket och aldrig i
ett API-svar; det var precis vad kontaktarks-regeln fångade i runda 52.

⚠️ **Padda på VITT, inte på en uppmätt kantfärg.** Ett första försök tog
medianen av kantpixlarna; på en ritning med en krukväxt i hörnet blev duken
gråbrun, och på en bild vars gula ram nyss beskurits blev den orange. Kantfärgen
mäter det du just tog bort.

### ☠️ Kapa aldrig bort delar av produkten

Regeln bryts nästan alltid av misstag, inte med flit: en för snäv beskärning kapar hjul och
ben, `rembg` äter tunna delar (kablar, smala ben, genomskinliga partier), och en
bandbeskärning som ska ta bort text skär in i varan. Resultatet är detsamma — kunden ser en
annan produkt än den som kommer.

- **Vitmåla ALDRIG en rektangel över produkt-silhuetten.** Text som ligger ovanpå varan tas
  bort med inpainting (`cv2.inpaint(bild, textmask, 6, INPAINT_TELEA)`), aldrig med
  `arr[y0:y1,x0:x1]=255`.
- **Beskär ur en fler-objekt-bild bara i det vita gapet mellan objekten**, hittat med
  kolumntäthet (`nz.mean(axis=0)` → leta lågtäthetsdalen), med marginal. Aldrig en gissad
  gräns. *(Stegen beskars vid x≈840 fast den öppna stegen nådde x≈1050 — främre benet och
  halva stegplanen kapades.)*
- **Obligatorisk grind före uppladdning:** bygg `faith_sheet(original, polerad)` och `Read`
  den. Jämför **sida vid sida i samma skala** — aldrig kontur mot original. Frågan är
  "saknas det yta?", inte "följer kanten?". En konturlinje följer varje kant perfekt även
  när maskens insida fallit bort. *(Lasertag-hjälten 2026-08-17: `rembg` tappade pistolens
  svarta kropp mot svart bakgrund, konturen såg korrekt ut, Leonard såg hålet direkt.)*
- **Undvik grundorsaken:** välj en källa där varan har kontrast mot underlaget. Svart plast
  mot svart botten är den klassiska fällan, och det är billigare att leta upp den ljusaste
  bakgrunden i bildsetet än att rädda ett dåligt urklipp.

### Vilken metod?

| Bilden är… | Gör |
|---|---|
| Text i ett **band** upptill eller nedtill | Beskär bort bandet (`ck.crop`) — bilden är oftast räddningsbar |
| Foto med text/logga inbränd **över varan** | Tvätta ([T](polish/bildmetoder.md#textborttagning-t--tvätta-loggor-och-inbränd-text)) |
| Ren produkt på ful/mörk/rörig bakgrund | Vit studio-hjälte ([H](polish/bildmetoder.md#hjältebild-h--ren-vit-produktbild)) |
| Marknadsgrafik med användbara delfoton | Klipp ut fotona, bygg eget svenskt kort ([K](polish/bildmetoder.md#kortbygge-k--egna-svenska-feature--och-spec-kort)) |
| **Måttritning med tysk textruta i ett hörn** | Beskär bort rutan — ritningen i sig är bara siffror |
| Ren textinfografik utan foto | Ta bort — informationen hör hemma i spec-tabellen |

**Behåll så många ANVÄNDBARA bilder som möjligt** *(Leonard 2026-07-10)* — en rik produktsida
säljer mer än en med tre bilder. Släng bara exakta dubbletter och bilder utan visuellt värde.
Leverantörens feature-collage **byggs om** till svenska kort, kastas inte.

⚠️ **Aosoms måttritning för bodar bär en tysk ruta nere till höger** — *"Hinweis: Messen Sie
das Fundament…"* plus en färglegend. Den ligger under en vit remsa som är lätt att hitta
programmatiskt: skanna nedre halvan efter första raden där en bred strimma är enhetligt
ljusgrå (232–248, kanalerna inom 4 av varandra) och kapa 12 px ovanför. Mätt på fem ritningar
i batch 62 låg gränsen på 0,72–0,74 av höjden. **Kasta inte hela bilden** — måttritningen är
den nyttigaste bilden på en bod, och utan textrutan är den helt språkneutral.

**Aldrig ett rent text-kort.** Varje kort ska ha ett riktigt foto med texten som bildtext
*(Leonard 2026-07-10)*. **Och fotot ska vara stort:** `fit=True` (`contain`) för produktbilder
så hela varan syns, `fit=False` (`cover`) bara för kontextfoton.

☠️ **`H-A` (Wix generate-image) får aldrig hamna på position 0** — den bäddar in
C2PA-märkning, och Google flaggar då produkten som AI-genererad och slår ut den ur de
kostnadsfria listningarna.

**Radera aldrig originalfilen** ur Media Manager. Borttagen ur galleriet blir den
föräldralös och städas av orphan-svepet, utan risk att döda en fil en annan produkt använder.

### ☠️ Kortets fotremsa är TEXT SOM INGEN GREP HITTAR (2026-09-02)

Trettiotre kort på trettiotvå **publicerade** produkter bar leverantörens namn och
artikelnummer — `Aosom 838-172BG` — inbränt i fotremsan. De hade legat live sedan
2026-08-30.

Det bryter mot husets hårdaste regel om leverantörsspår, och just artikelnumret är det
farligaste av allt att läcka: **dealproffsen.se publicerar samma artikelnummer som `sku`
och `mpn` i sin JSON-LD**, så numret är en direkt nyckel till vad vi betalar — hos den
återförsäljare vi konkurrerar med om exakt samma vara.

Det som gör fyndet värt en egen regel är inte felet utan **varför ingen kontroll fångade
det.** Mätningen "vi läcker inga leverantörsspår" gjordes på HTML: noll träffar på
`aliexpress`, `alicdn`, `aosom` eller något husmärke. Den mätningen var korrekt — och
blind. Ett `grep` över sidan kan aldrig se text som är pixlar.

| kontroll | ser fotremsan? |
|---|---|
| `grep` i `plainDescription` | nej |
| `grep` i renderad HTML | nej |
| `<title>` / meta-kontrollen (Steg 13) | nej |
| bildgranskningen i Steg 4 | nej — den granskar LEVERANTÖRENS foton, inte våra kort |

Det sista är poängen: vi granskar noga de bilder vi tar EMOT och inte alls de vi SKAPAR.

**Regeln: `note`-raden får bara innehålla en produktegenskap kunden har nytta av.**
Aldrig ett artikelnummer, aldrig ett leverantörsnamn, aldrig ett internt id. Behövs
ingen not — lämna den tom; en tom högersida finns redan i kortfamiljen.

**Så granskas hela beståndet igen** (tar minuter, ingen OCR behövs):

1. Beskär nedersta ~8,5 % av varje kort och stapla remsorna till kontaktkartor med
   filnamnet i marginalen. Tjugo rader per ark är läsbart.
2. Läs arken. Hittas EN träff: klipp ut det läckta ordet som mall och **mallmatcha**
   (normaliserad korskorrelation) över alla remsor. Utfallet 2026-09-02 var 33 träffar
   över 0,94 och sedan ett hopp till 0,78 — ingen gråzon att tolka.
3. Titta på träffarna innan du rör något. Trettiotre av trettiotre var äkta.

⚠️ **Fotremsans not kommer inte alltid från `cardkit.py` i det här repot.** Korten i
`tools/polish-assets/<wixProductId>/k<N>.jpg` byggdes av en annan session. Wix
`sourceUrl` på filen pekar tillbaka på den grenen och sökvägen — det är så man
kopplar en publicerad bild till det kort som skapade den, och det enda sättet att
veta VILKEN av produktens sex bilder som är kortet.

**Lagningen är att måla över noten, inte att bygga om kortet.** Fotremsans bakgrund är
en plan färg, så en täckande rektangel är exakt. Ordmärket står kvar till vänster och
kortet är i övrigt orört — inget behöver typsättas om, ingen font behöver matchas, och
inget faktainnehåll kan råka ändras. Skriv sedan med `fieldMask: { paths: ["media"] }`
så synlighet, varianter och priser inte kan röras.

☠️ **PATCH-svaret innehåller INTE `media` om du inte bad om fältet** — min egen
verifiering i skrivsteget sa därför `ok: false` på alla sexton första produkterna trots
att varenda skrivning gick igenom. Läs tillbaka med en EGEN
`GET …?fields=MEDIA_ITEMS_INFO` och kontrollera två saker: att den nya bilden finns och
att den gamla är BORTA. Ett svar utan fel är inget kvitto — och ett kvitto som läser fel
fält är inte heller ett.

⚠️ **De gamla filerna ligger kvar i Media Manager** när de bytts bort ur galleriet.
Ingen sida länkar till dem, men adressen svarar fortfarande. Att radera dem permanent
är ett beslut för en människa — lista dem, radera inte.


## Steg 10 – Koppla rätt kategori

### 10A – Läs ALLTID hela trädet först (read-only, 1 anrop)

> ☠️ **SVARSNYCKELN HETER `categoriesForItems` — och fel nyckel ger NOLL RADER
> UTAN FEL.** Uppmätt i runda 108: ett anrop mot
> `POST /categories/v1/categories/list-categories-for-items` som letade efter
> `itemsWithCategories` returnerade en tom lista och såg ut att bevisa att
> ingen produkt låg i någon kategori — inklusive en publicerad sida som
> faktiskt gjorde det. Samma familj som `/api/tracking-events` 2026-09-01:
> **en läsare som blir TOM ser i koden likadan ut som en frisk.** Det som
> avslöjade den var att skriva ut RÅSVARET i stället för att tolka ett tomt
> resultat.
>
> ⚠️ Båda kategori-anropen — läsningen och `bulk/categories/add-item` — kräver
> `treeReference: {"appNamespace": "@wix/stores"}` i kroppen. Utan den svarar
> API:t 400 och namnger fältet, vilket är det snälla felet; det tysta är det
> ovan.

⚠️ **Gissa aldrig på en kategori ur minnet, och nöj dig aldrig med en toppkategori.** Trädet har **53 kategorier i två nivåer** — 12 toppkategorier och 41 löv (uppmätt 2026-08-23; siffran stod tidigare som "46 i tre nivåer") — och de flesta produkter hör hemma i ett *löv*, inte i roten. Detta gick fel 2026-08-09: hamsterburen hamnade i "Hem & Inredning" och torkhuven i "Elektronik & Tillbehör" trots att **Husdjur → Burar, Kläder & Tillbehör** och **Skönhet & Hälsa → Hår & Rakning** fanns hela tiden — en kortlista från tidigare i sessionen användes i stället för trädet.

```
POST https://www.wixapis.com/categories/v1/categories/query
{ "treeReference": { "appNamespace": "@wix/stores" }, "query": { "paging": { "limit": 100 } } }
```

Svaret ger `id`, `name` och `parentCategory.id` per kategori. Toppnivåerna är **Hem & Inredning · Kök & Husgeråd · Elektronik & Tillbehör · Sport & Fritid · Barn & Familj · Mode & Accessoarer · Skönhet & Hälsa · Husdjur · Trädgård & Utemöbler · Populära · REA · All Products** — under dem ligger löven (t.ex. Hushållsapparater, Badrum & Hemtextil, Förvaring & Organisering, Belysning, Dekoration & Prydnad, Hår & Rakning, Kropp & Välbefinnande, Burar Kläder & Tillbehör, Mat & Vattenskålar, Bil & Cykel, Träning & Gym, Mobiltillbehör, Leksaker & Spel, Baby & Småbarn).

**Regel:** koppla **förälder + löv** (t.ex. `Husdjur` + `Burar, Kläder & Tillbehör`). Finns inget löv som passar räcker toppkategorin.

### 10B – Koppla (mutation)

```
POST https://www.wixapis.com/categories/v1/bulk/categories/add-item
```

```json
{ "item": { "catalogItemId": "{PRODUCT_ID}", "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
  "categoryIds": ["{FÖRÄLDER_ID}", "{LÖV_ID}"],
  "treeReference": { "appNamespace": "@wix/stores" } }
```

Ligger produkten redan i en **för bred eller fel** kategori — ta bort den, samma body:

```
POST https://www.wixapis.com/categories/v1/bulk/categories/remove-item
```

> ⚠️ **`directCategoriesInfo` släpar efter.** En GET direkt efter add/remove visar ofta det gamla värdet. Läs i stället `bulkActionMetadata` i svaret: `totalSuccesses` räknar det som gick igenom, och `ALREADY_EXISTS` / `ITEM_NOT_IN_CATEGORY` bland `results[].itemMetadata.error` betyder att målläget redan gäller — alltså inget fel. Vill du verifiera med en GET: vänta några sekunder först.
>
> ☠️ **Bygg därför ALDRIG klart-kriteriets kategorigrind på `directCategoriesInfo`.** Grinden
> läser då ett gammalt värde, säger "inte klar" och stoppar en publicering som var korrekt.
> Hände 2026-08-29 på reclinerfåtöljen: `totalSuccesses: 3` i skrivningens svar,
> `kategorier: 1` i GET:en mikrosekunder senare. Grinda på `totalSuccesses`, eller läs om i
> ett SENARE anrop.
>
> ☠️ **`All Products` går INTE att skriva till.** Uppmätt i runda 67: kategorin
> `05e96cd6-e4bc-4f55-b31c-6062ede453ff` svarar
> `MANAGED_CATEGORY_OPERATION_NOT_ALLOWED` — *"externally managed by app"*. Stores-appen
> äger den och produkter hamnar där av sig själva. Ta aldrig med den i `categoryIds`.
>
> ⚠️ **Och `totalSuccesses` ensamt räcker inte som kvitto när du skickar FLERA kategorier.**
> Svaret räknar hur många som lyckades men säger inte VILKA: `[true, false]` per produkt ser
> likadant ut vare sig det var lövet eller föräldern som föll. Runda 67 skickade två
> kategorier till åtta produkter och fick `lyckade: 1, misslyckade: 1` på var och en — utan
> namn hade det kunnat rapporteras som "kategorier satta". Läs `results[].itemMetadata.error`
> och matcha mot `originalIndex`, eller kör om mot BARA den kategori du tror är satt och
> kräv `ALREADY_EXISTS` — ett omvänt bevis som inte går att missförstå.
>
> ⚠️ **Endpointen tar ETT `item` och FLERA `categoryIds`**, aldrig en lista med `items`.
> En items-lista ger `400 categoryIds has size 0, expected 1 or more`.
>
> ⚠️ **Och det gäller inte bara kategorierna — hela produkten kan läsas inaktuell.** En
> `plainDescription`-PATCH följd av en verifierings-GET i samma anrop gav oförändrad text
> och oförändrad revision, fast skrivningen hade gått fram: nästa anrop visade rätt text och
> revision **fyra**, alltså två steg fram. Slutsatsen "det tog inte" är därför inte säker
> förrän du läst om i ett eget anrop — annars skriver du samma rättelse en gång till.

-----

> 💡 **Mappningsraden har redan ett förslag.** `FyndplatsMappings.categorySuggestion`
> fylls i vid import. Läs det — men behandla det som **en kandidat, inte facit**: det
> kommer från importens AI-kategorisering och kan ha fel. Läs trädet ändå och jämför.
> Stämmer förslaget sparar du ett övervägande; stämmer det inte har du fångat ett fel
> som annars hade legat kvar.


-----

## Steg 11 – Varianter (bara flervariantprodukter)

**En Aosom-rad har en enda variant utan optioner — hela steget är då en no-op.** Gäller
AliExpress-listningar, som buntar modeller, färger och uttagstyper på samma sida.

### 11A – Variantvärden får inte döpas om

I V3 är `choices[].name` låst till `choices[].key`: ändrar du bara `name` fastnar det inte,
och rör du `key` riskerar du leverantörs-SKU-mappningen och fulfillment. Importen översätter
redan kända enheter, färger och storlekar (`inch`→`tum`, `Color`→`Färg`, `Red`→`Röd`), så
värdet är rätt från start. Ser ett värde ändå fel ut: **flagga till Leonard** så utökas
importens tabell — forcera inte ett key-byte.

### 11B – `linkedMedia`: bildbyte per färgval

Är kopplat automatiskt vid import i de flesta fall. **Rör det inte när det fungerar.** Saknas
det: sätt `linkedMedia: [{ id: "<media-item-id>" }]` på rätt `choices[]`, och skicka **hela**
`options` + `variantsInfo` verbatim + färsk `revision`. Wix ingest:ar asynkront (~5 s) —
verifiera med re-GET att kopplingen sitter kvar.

☠️ **En PATCH av `media.itemsInfo` NOLLSTÄLLER `linkedMedia` på alla val.** Wix svarar
`200 OK`, behåller bilderna, och skriver `linkedMedia: []` på varje choice — alla färgval
visar då första galleribilden, och kunden som väljer "Blå" ser den gröna produkten. Lägg
`options` + `variantsInfo` i **samma** PATCH som `media`, eller kör en andra PATCH direkt
efter. *(Hollywoodgungan `39a5c0bf`, 2026-08-13.)*

⚠️ **`linkedMedia` valideras mot galleriet FÖRE uppdateringen** — bilden måste alltså redan
ligga där. Byter du både galleri och kopplingar krävs tre PATCH:ar i ordning: options utan
`linkedMedia` → `media.itemsInfo.items` → options med `linkedMedia`.

🚫 **`linkedMedia` ska vara en PRODUKTBILD av just den varianten — aldrig ett Fyndplats-kort**
*(Leonards regel 2026-08-22)*. Swatchen är det kunden klickar på för att se varan i den
färgen; ett spec-kort där ser ut som en platshållare. **Undantaget är `card_swatch`** — varan
ensam, stor på vitt, med en smal etikettrad under — när leverantörens variantbild är en ren
render men bär engelsk overlay-text. Hittas ingen ärlig bild alls: ge varianten ingen
`linkedMedia` hellre än en bild på fel exemplar, men lämna då **inget** val kopplat. Alla
eller inga.

### 11C – Sanering, uttagsaxlar, dubblettfärger

Fyra regler, med mekaniken i [`polish/varianter.md`](polish/varianter.md):

- **Slut eller omappad variant → bort**, både valet och dess bilder. Blir en kvar: kollapsa
  till enkelvariant genom att skicka den överlevandes BEFINTLIGA `id` — då behålls lagerposten.
- ☠️ **Uttags-/spänningsaxlar** (`EU/US/UK/AU/KR`, `110 V`) — behåll EU-värdet och radera axeln.
  Priset följer med; EU-varianten är ofta billigare. En svensk kund ska inte kunna beställa
  110 V med US-stickpropp.
- **"Dubblettfärger" är oftast två MODELLER.** Titta på exemplaren innan du slår ihop, och kräv
  att minst två mått (packmått + vikt) stämmer innan något tas bort som dubblett. Ett borttaget
  säljbart exemplar syns aldrig i någon logg — det bara slutar finnas.
- **Prestandasiffror hör inte i variantetiketten.** Bärförmåga, effekt och kapacitet flyttas till
  spec-tabellen med källan utskriven.

-----

## Steg 12 – Läs sidan som kund

**Checklistan kontrollerar fält. Det här steget läser text.** De två fångar olika fel,
och det andra är det som syns för kunden.

Bevis: audit-2 hittade **35 tonproblem på 18 sidor** som samtliga mekaniska grindar
hade släppt igenom — sidor som var korrekta i varje fält och ändå läste illa.

Läs hela sidan uppifrån och ned som någon som funderar på att köpa, inte som någon
som kontrollerar. Leta efter:

- **Låter något defensivt?** *"Leverantören anger…"*, *"vi har inga uppgifter om…"*,
  *"var ärlig med vad ett möbellås är"*. Mot kunden är **vi** leverantören.
- **Upprepas ett mått som redan står i tabellen, med ett tvivel hängt på?**
- **Ber vi kunden mäta, väga eller kontrollera** för att avgöra om varan duger?
- **Läser sidan som en kopia av syskonproduktens?** Två sängbord fick samma text i
  praktiken 2026-08-22 — lösningen var ett eget avsnitt om det som faktiskt skiljde.
- **Finns en mening som inte hjälper någon att bestämma sig?** Stryk den.
- **Skulle du själv köpa efter att ha läst det här?** Om svaret är "kanske, men…" —
  hitta vad "men" är och åtgärda det i texten.

> 🔒 **Leonards ordagranna krav (2026-08-21):** *"Du ska inte skrämma kunderna från att
> köpa, allt behöver man inte veta, o andra saker som man måste veta kan stå med på ett
> snyggt sätt."* Det som måste stå med står med — men som ett positivt villkor på rätt
> plats, inte som en varning.

### Två fynd som bara det här steget hittar, och en grind som ljuger tvärtom

Byrå-rundan 2026-09-02. Alla mekaniska grindar var gröna på åtta produkter; läsningen
hittade två fel i texten och ett i grinden själv.

1. ☠️ **Osynliga tecken passerar VARENDA mekanisk grind.** Ett mjukt bindestreck
   (U+00AD) satt inuti ordet `gluggar` i en FAQ-rad. Lintet såg ett giltigt ord,
   längdkontrollen såg ett giltigt tecken (det är ett — så `källa + 168` stämde exakt),
   och Wix normaliserade det inte bort. Det enda som avslöjade det var att ordet såg
   fel ut när det lästes. **Sök efter U+00AD, U+00A0, U+200B och U+FEFF i texten innan
   du skriver den** — det är fyra tecken och en regex, och de går inte att se i efterhand.

2. ⚠️ **Ett jämförande påstående är ett påstående, och måste beläggas som ett.**
   En produkt hade rubriken *"50 kg är den högsta bärförmågan bland våra smala byråer"*
   och i brödtexten *"dubbelt mot flera bredare modeller i sortimentet"*. Superlativet
   gällde hela katalogen, som inte var mätt; och `flera` var i själva verket **en** modell.
   Båda ersattes av det som gick att belägga ur produktens egna tal: 50 kg på en möbel
   som väger 16,8 kg. **"Aldrig hitta på siffror" gäller även jämförelser** — de ser ut
   som beskrivningar men är mätningar, och en mätning som inte gjorts är en gissning.

3. ☠️ **`\b` i JavaScript är ASCII-bunden och läser svenska ord som tyska.** Tyskgrinden
   `/\b(und|der|die|das|mit)\b/` rapporterade träffar på tre produkter. Ingen var tysk:
   `ä` är inget ordtecken i JS utan `u`-flaggan, så **kläder** och **underkläder** slutar
   på ett fristående `der`. Samma regex i Python (vars `\b` är unicode-medveten) ger noll.
   Kör språkkontrollen i Python, eller använd `(?<![A-Za-zÅÄÖåäö])…(?![A-Za-zÅÄÖåäö])` i
   JS. Ett falsklarm i grinden kostar dubbelt: det stjäl tiden från de fel som är äkta,
   och lär läsaren att avfärda utslagen.

4. ☠️ **En LIVE-grind mot en ordlista mäter sajten, inte din text — mät mot en
   KONTROLLSIDA.** Runda 90:s första live-svep fällde **7 av 7** korrekta sidor på
   tre fynd som alla fanns ordagrant på en publicerad sida rundan aldrig rört:

   | fynd | vad det var |
   |---|---|
   | `Skickas från` | sajtens **EU-lager-ribbon** — enligt husets egen regel den ENDA plats där avsändarlandet får synas |
   | `688-5623` (och fyra tal till i formen `\d{3}-\d{3}\w`) | sajtens `Organization`-JSON-LD, en Maps-URL — inte ett artikelnummer |
   | tom kropp på en sida | EN misslyckad huvud/kropp-delning; omhämtning gav 200 och 145 kB |

   Produktsidan är inte bara din text: den bär header, ribbon, JSON-LD, footer och
   skript. Varje förbudsord du söker efter finns med god sannolikhet någonstans i det.

   **Grinden ska därför hämta en KONTROLLSIDA först** — en publicerad produkt i samma
   familj som rundan inte rört — samla dess träffar, och bara rapportera det som finns
   på din sida men INTE på kontrollens. Tre rader kod, och skillnaden mellan
   "7 av 7 sidor med problem" och sanningen, som var noll.

   ⚠️ Samma familj som fyndet ovan, och som husets regel mot att varna vid 48 h på
   token-förnyelsen: **ett larm som fyrar på varje korrekt sida är lika illa som
   inget larm alls** — mottagaren lär sig att sluta läsa, och då är även det äkta
   larmet borta.

**Regeln: en grön grind betyder att grinden är nöjd, inte att texten är rätt.** Två av de
tre fynden ovan var osynliga för varje fält-kontroll, och det tredje låg i kontrollen själv.

#### ✅ Kontrollsidan är MEKANIK sedan runda 134 — inte längre en instruktion

Regeln ovan skrevs efter runda 90 och stod i runbooken i fyrtiofyra rundor utan
att finnas i någon kod. Runda 134 betalade för det: butikens bloggrubrik
*"Klösträd & kattträd – så väljer du rätt"* bär tre t i rad och fälldes av
rundans trekonsonantsgrind på två korrekta sidor. Grinden hade rätt om ORDET
och fel om VEMS det var — och att avgöra det för hand är precis vad en grind
finns till för att slippa.

`liverunda.kontrollfynd` hämtar numera kontrollsidan själv och drar dess
träffar från varje sida i rundan. Rundan behöver inte veta om den; den pekar
bara ut vilken sida som är kontroll (`liverunda.KONTROLL`).

☠️ **Kontrollsidan måste bära SAMMA BLOCK som din.** Första försöket valde en
klöstunna, fick **noll** träffar och såg ut som en trasig mekanik. Butiken
renderar blogglänken *"Klösträd & kattträd"* bara på **klösträd**-sidor — en
kontroll ur fel undergrupp mäter alltså inte det chrome som fäller dig. Välj
en publicerad sida i samma familj och samma produkttyp.

☠️ **Två hål som båda hade gjort subtraktionen FARLIGARE ÄN INGEN ALLS**, och
båda satt i den första versionen:

1. **Rundans egna fält följer med in i kontrollen.** `granska(pid, …,
   live=True)` provar `egna + NAMN + TITEL + META + SOKORD` — alltså rundans
   egna fält, oavsett vems HTML den får. Ett stavfel i VÅR titel hade därför
   fyrat på kontrollsidan också, hamnat i `butikens` och dragits bort från vår
   sida: grinden hade tvättat bort vårt eget fel och kallat det butikens.
   Grinden körs därför en gång till på TOM HTML, och det som fyrar då ingår
   aldrig i subtraktionen.
2. **Kortgrinden hör inte hemma i subtraktionen.** `kortfel` frågar om VÅR sida
   bär ett eget Fyndplats-kort, och runda 121-128 publicerade ~62 sidor utan
   ett — en kontrollsida ur den perioden hade fällt `SAKNAR EGET KORT`,
   subtraherat det, och tystat exakt den grind som byggdes för att steget
   glömdes åtta rundor i rad. Kortgrinden körs bara på våra sidor.

⚠️ **Subtraktionen är på EXAKT STRÄNG, aldrig en heuristik.** Butikens chrome
är byte-identisk mellan sidor; det som skiljer är vår text. En "liknar"-regel
hade svalt våra egna fel.

✅ **Och det som subtraheras SKRIVS UT.** En kontrollsida är en POLERAD sida
från en tidigare runda, så dess egna defekter dras också bort — utskriften gör
dem till uppgifter i stället för till tystnad. Den gjorde det direkt:
`klostrad-200-cm-sex-nivaer` bär `Hoppplattform: 24 × 40 cm` i sin spec-tabell,
alltså exakt det fel runda 134 fångade med ögon, redan publicerat.

Utfall: runda 134:s sex sidor gick från 2 fel till 0, utan att en enda regel
mildrades.

### ☠️ Ett jämförande påstående inom EGEN batch går att grinda mekaniskt — gör det

Runda 42 (trädgårdsbänkar, 2026-09-03). Texten sa *"den lättaste av våra åtta"* om
furubänken på 10,9 kg. Rottingbänken i samma batch väger **10,3**. Felet stod på tre
ställen — en h2, ett FAQ-svar och en korshänvisning som dessutom pekade åt fel håll
(*"ett kilo lättare"* om en bänk som var 0,6 kg TYNGRE).

Skillnaden mot Steg 12-fyndet ovan är att det här påståendet gällde **batchen**, inte
katalogen — och en batch är åtta rader i en dict, alltså mätbar på tre kodrader:

```python
vikt = {k: v["vikt"] for k, v in P.items()}
lattast, tyngst = min(vikt, key=vikt.get), max(vikt, key=vikt.get)
for k, v in P.items():
    if "lättast" in v["html"].lower() and k != lattast: fel(k, f"{lattast} väger mindre")
    if "tyngst"  in v["html"].lower() and k != tyngst:  fel(k, f"{tyngst} väger mer")
```

Samma grind går att skriva för *djupast*, *högst*, *längst* och *minst* — varje superlativ
du använder om den egna batchen har ett tal i spec-tabellen bakom sig. **Skriv grinden i
samma stund du skriver superlativet**, för korrekturet hittar det inte: meningen är
välformulerad, siffran i den är rätt, och det enda som är fel är rangordningen mot sju
andra sidor du inte läser samtidigt.

Samma runda visade också vad ordvalslistor kostar när de blir slarviga: en tyskgrind som
listade `metall` och `natur` fällde tre korrekta svenska meningar. **Orden som stavas lika
på svenska och tyska hör inte hemma i en tyskgrind** — och en grind som fyrar på rätt text
lär läsaren att bläddra förbi.

### ☠️ En grind mot osynliga tecken får inte SKRIVAS med osynliga tecken

Runda 46 (hundburar, 2026-09-03). Linten porterades från förra rundan och fällde
`osynligt tecken U+00A0` på **alla åtta** texterna. Ingen av dem innehöll ett hårt
mellanslag. Felet satt i grinden:

```python
OSYNLIGT = {"\xad": "U+00AD", " ": "U+00A0", …}   # ← nyckeln ar ett VANLIGT mellanslag
```

Filen hade skrivits genom ett verktyg som normaliserade blanksteg, och U+00A0-nyckeln
blev U+0020. Grinden frågade därmed *"innehåller texten ett mellanslag?"* — sant för
varenda text som finns. Åt andra hållet är samma fel dödligt tyst: hade nyckeln i
stället fallit bort helt hade grinden svarat OK på en text full av hårda mellanslag.

Bygg den ur **kodpunkter**, och låt den påstå något om sig själv:

```python
OSYNLIGT = {chr(c): "U+%04X" % c
            for c in (0x00AD, 0x00A0, 0x200B, 0xFEFF, 0x200E, 0x200F)}
assert all(ord(t) > 0x20 for t in OSYNLIGT), "grinden ar avvapnad"
```

Regeln generaliserar: **en grind vars villkor är ett osynligt tecken kan inte
granskas genom att läsas.** Den måste antingen härledas ur något synligt (en
kodpunkt) eller bevisas med ett test som återinför defekten.

### ☠️ Och en ordgräns räcker inte heller — `\b` är ASCII-bara i JavaScript (2026-09-03)

Regeln ovan säger "ordgräns på varje markör". Den räcker inte, och det upptäcktes en
runda senare: klart-kriteriet fällde kattstugan `b4f4d991` på `tyskt ord: /\bdas\b/i`
ett steg före publicering. Sidan var ren. Ordet var **stä|das**.

I JavaScript är `\b` definierad mot `[A-Za-z0-9_]`. `ä` räknas alltså som ett
ICKE-ordtecken, och därför finns det en ordgräns mitt inne i varje svenskt ord där
`å/ä/ö` står precis före markören:

| | `/\bdas\b/i` mot "städas" |
|---|---|
| JavaScript | **träff** — `ä` bryter ordet |
| Python (`str`-mönster) | ingen träff — `\b` är unicode-medveten |

Det gäller inte bara `das`. Uppmätt över de åtta vanligaste tyska markörerna mot
femton svenska ord — bara tre föll, och alla tre av samma skäl:

| svenskt ord | JS-`\b` fäller på | unicode-gräns |
|---|---|---|
| stä**das** | `das` | — |
| vä**der** | `der` | — |
| rä**der** | `der` | — |

Mönstret är exakt: en svensk vokal FÖRE markören och ordslut EFTER den. `vädret`
klarar sig (`der` följs av `e`, som är ordtecken i båda), men **"väder" gör det inte —
och det ordet står i varannan text om utomhusprodukter.**

**Skriv gränsen explicit i stället, med de svenska bokstäverna i lookaround:**

```js
const G = (k) => new RegExp("(?<![A-Za-zÅÄÖåäö0-9])(?:" + k + ")(?![A-Za-zÅÄÖåäö0-9])", "i");
const TYSKA = ["und", "mit", "das", "der", "wetterfest\\w*", …].map(G);
```

☠️ **Och den djupare regeln, tredje gången i det här projektet: två korrekta
implementationer av samma regel gav olika svar.** Python-linten som byggde texten och
JS-grinden som läste tillbaka den har samma ordlista och samma avsikt — men olika
`\b`. Samma familj som FNV-1a-hashen, där `h * 16777619` var exakt i Python och lossy
i JavaScript. **En grind vars två sidor räknar olika mäter implementationerna, inte
datan** — och ett falsklarm en minut före publicering ser ut precis som ett äkta fel.

### ☠️ En tysk-detektor byggd av ORDSTAMMAR fäller svenska böjningar (2026-09-03)

Grinden som ska hitta oöversatt tyska är den som oftast ljuger, och den ljuger alltid åt
samma håll: **falskt larm på en text som är helt svensk.** Tre träffar på en runda:

| grinden innehöll | matchade | i ordet |
|---|---|---|
| `[üöä]` | `ö`, `ä` | *för*, *gräsmattan*, *höjd* — halva svenskan |
| `Steg`, `Panel` | hela ordet | *steg*, *panel* — svenska ord, inte tyska |
| `Rampe` (utan `\b`) | ordstammen | **Rampe**rnas lutning |

Den sista fällde Klart-kriteriet på `4fdd8d3c` **ett steg före publiceringen**, på en
spec-rad som lyder `Rampernas lutning: 28°`. Hade larmet trotts hade en färdig sida hållits
tillbaka; hade det avfärdats hade nästa — äkta — larm avfärdats med.

**Två regler:**

1. **Ordboundade markörer.** `\bRampe\b` matchar inte *Rampernas*. `\bfür\b`, `\bHunde\b`,
   `\bWippe\b`, `\bHolz\b`. Aldrig en naken ordstam.
2. **Aldrig ett tecken som finns i svenskan i teckenklassen.** `ü` och `ß` är säkra; `ö` och
   `ä` är det inte. `för` är svenska, `für` är tyska — och skillnaden är en enda prick.

☠️ **Och prova detektorn mot en känd SVENSK text innan du litar på en träff.** Samma regel
som mutationstestet nedan, speglad: där bevisar man att grinden fäller på ett fel, här att
den *inte* fäller på det som är rätt. En grind som bara provats åt ena hållet är halvmätt.

### ☠️ Ett mutationstest som bara kräver "någon brist" provar inte grinden du tror

Runda 47 lade till ett fjärde krav utöver returkod, landad mutation och icke-tom stdout:
**vilken grind som föll måste stämma**. Varje mutation bär den textsnutt lint ska svara med,
och testet fäller om någon ANNAN grind fångade felet.

Det behövdes direkt. Mutationerna "sluggkrock i batchen" och "slug redan publicerad" gav
båda `sökordet saknas i sluggen` — sökordsgrinden råkade ligga före krockgrinden och
maskerade den. Testet såg en brist och godkände; kollisionskontrollen var i praktiken
oprövad. Med kravet på rätt meddelande föll den rätta grinden på båda.

Samma körning hittade två riktiga defekter i grindarna:

- ☠️ **Ett `inte` någonstans i meningen friade ett förbjudet påstående.** Regeln
  "vattentät får bara stå i en fråga eller ett nekande svar" var skriven som *"meningen
  innehåller `?`, `nej` eller `inte`"* — och därmed passerade mutationen *"Boxen är
  vattentät och lutar så att vattnet rinner av, men falsen är **inte** packad."*
  **Nekandet måste stå omedelbart före ordet**, inte var som helst i meningen.
- **Lint kraschade i stället för att rapportera** när en mutation bröt korshänvisningen:
  uppslaget `P[[x for x in P if …][0]]` gav `IndexError` på en slug som inte längre fanns.
  En grind som kraschar ger tom stdout, och utan returkods-kontrollen hade det räknats som
  godkänt. **En grind ska alltid rapportera, aldrig kasta.**

### ☠️ Ett mutationstest som bara läser stdout rapporterar en krasch som "godkänt"

Samma runda, samma timme. Selen som bevisar att linten faktiskt fäller kördes som
en barnprocess, och utfallet lästes ur `stdout`:

```python
r = subprocess.run([sys.executable, "-c", kod], capture_output=True, text=True)
brister = [l for l in r.stdout.splitlines() if …]     # returkoden lastes ALDRIG
print("SLAPPER IGENOM" if not brister else "FALLER")
```

En egen bugg i selen (`KOD.replace("MUT", …)` träffade även token `MUTKOLL` och gav
barnet ett syntaxfel) fick fyra grindar att rapporteras som **släpper igenom** —
grindar som var friska. Tio minuter gick åt till att felsöka rätt kod.

Det är husets vanligaste lärdom i ny förklädnad: *ett svar utan innehåll är inget
kvitto.* **Fäll på returkod ≠ 0**, och låt varje mutation dessutom påstå att den
LANDADE (`assert 'x' in texter.T[...]`) — annars kan en mutation som inte tog
rapporteras som en grind som inte fyrar.

Nitton mutationer låser runda 46:s lint: osynliga tecken (tre varianter), uppdiktat
tal, vilset tal utanför den ordagranna regeltexten, sökord ur sluggen, död länk,
omskriven regeltext, omskriven mätmetod, tyskt ord, husmärke, land, defensiv röst,
decimalpunkt, `x` i stället för `×`, `<br>`, omdöpt flikrubrik, för lång meta, och
slugg som krockar med en publicerad sida. Alla nitton fångas.

### Syskonlikhet går att MÄTA — och färgtvillingar ligger strukturellt högre

Runda 46 var tre par tvillingar (två färger av 98 cm-burens modell, två av 94 cm,
två storlekar mjuk bur). Frågan "är de här sidorna för lika?" besvarades med
5-gram Jaccard på synlig text, i två mått:

| | HELA texten | med de DELADE styckena bortlyfta |
|---|---:|---:|
| Runda 45 (åtta olika modeller) | 0,078 | 0,026 |
| Runda 46, första utkastet | 0,216 | 0,129 |
| Runda 46, efter åtgärd | **0,205** | **0,116** |

Talen är höga för att rundan ÄR tvillingar: samma spec-vokabulär, samma
rättsliga stycke, samma mätmetod. En dubblettsida ligger på 0,7–0,9, så 0,2 är
inte duplicerat innehåll — men skillnaden mot runda 45 är verklig och ska
redovisas, inte trimmas bort genom att byta mått.

**Vad mätningen faktiskt hittade var inte prosa utan RUBRIKER.** Sju av åtta sidor
bar samma egna `<h2>` (*"Så vet du att hunden får plats"*). Ordagrant delade
stycken var bara 3–4 per par och alla spec-celler (material, bärförmåga,
rekommenderad hund). Åtgärden var därför att ge varje sida en rubrik som bär dess
EGET avgörande tal — *"71 centimeter att sitta upp under"*, *"58 centimeter för en
liten hund"* — och att lägga det produktspecifika FÖRE det delade stycket i
avsnittet. Unika egna rubriker gick från 19 av 32 till 26 av 32.

☠️ **Ett medvetet delat stycke ska förbli ordagrant delat.** Regeltexten (SJVFS
2020:8) och tillverkarens mätmetod står identiska på alla sidor med flit — den
konsekvensen är en säkerhetsfunktion, inte lättja, och linten låser båda
ordagrant. Rubriken över dem får däremot variera.

### ☠️ Leverantörens två grafiker kan motsäga VARANDRA — välj den konservativa

Aosoms hundburar levereras med två bilder som båda definierar `Körperlänge`:

| bild | vad den visar |
|---|---|
| måttritningens hundsiluett | en pil längs kroppen, ungefär bog till svansrot |
| mätguiden (*"Wie messen Sie Ihren Hund"*) | ordagrant *"von der Nasenspitze bis zur Rutenspitze"* |

De ger olika tal för samma hund, och skillnaden är stor: en golden retriever mäter
runt 60 cm på det första sättet och över 110 cm på det andra.

**Använd nosspets → svansspets.** Inte för att den ena källan är finare, utan för
att den ger det STÖRRE talet: en kund som följer den köper en för stor bur i värsta
fall, en som följer den andra köper en för liten. Fel åt det ena hållet kostar
plats, fel åt det andra är en hund som inte får plats att ligga.

☠️ **Och därför ska rasgrafiken ALDRIG återanvändas.** Bilden *"GEEIGNET FÜR GROSSE
HUNDE"* listar sibirisk husky, dalmatiner, golden retriever och labrador mot
gränsen `Körperlänge <60cm` — vilket är omöjligt under leverantörens egen
mätmetod. Kortet som ersätter den bär de mätbara talen (innermått, dörrmått,
maskstorlek) plus mätmetoden, och nämner inga raser.

### Ett påstående om en färgtvilling måste kontrolleras mot TVILLINGENS foto

Samma runda: texten om valnötsburen påstod att *"baksidan och de nedre partierna är
slutna paneler, gallret sitter i ögonhöjd för hunden"*. En uppförstoring av
produktbilden visade något annat — baksidan ÄR en sluten panel, men stavarna löper
i **full höjd** framför den, och några "nedre partier" finns inte utöver en sockel.
Påståendet var härlett ur hur en tvilling såg ut i miniatyr, inte läst ur bilden.

Rättat både i brödtexten och i FAQ-svaret som upprepade det. **Zooma in på
huvudbilden innan du beskriver konstruktion** — en kontaktkarta i 400 px räcker för
att se om något är tyskt, men inte för att säga hur det är byggt.

### ☠️ `products/query` returnerar INTE `variantsInfo` — en grind på den passerar tom

Runda 44 (gasolgrillar, 2026-09-03). Klart-kriteriet kördes som ett enda
`POST /stores/v3/products/query` med `fields: ["PLAIN_DESCRIPTION","MEDIA_ITEMS_INFO",
"DIRECT_CATEGORIES_INFO","URL"]` och rapporterade **"brister: inga" på alla åtta**.
Två av kontrollerna var värdelösa:

```js
if (varianter.some(x => x.visible !== true)) brister.push("variant osynlig");
if (varianter.some(x => !/^FP-/.test(x.sku || ""))) brister.push("SKU fel");
```

`varianter` var `[]` på varje produkt, och `[].some(...)` är `false`. Båda grindarna
sa alltså OK utan att ha tittat på någonting. Det syntes bara för att svaret också
skrev ut `sku: ""` — hade jag inte råkat logga fältet hade rundan publicerats med
en oprövad SKU- och synlighetskontroll.

`variantsInfo` finns bara på **`GET /products/{id}`**. Det gäller alltså tre rutter
med samma symtom: `products/search` (dokumenterat sedan 2026-08-26), `products/query`
(mätt nu) och `?fields=`-projektionen i sig. Samma familj som `MEDIA_ITEMS_INFO` och
`PLAIN_DESCRIPTION`: **ett fält som inte begärts syns som ett tomt värde, inte som ett
fel** — men här är det värre, för en tom array får ett `some()`-villkor att svara
"allt är bra".

**Regeln: en grind över en LISTA måste först kräva att listan finns.** Skriv
`if (!varianter.length) brister.push("variantsInfo saknas i svaret")` före varje
`some()`/`every()` — eller läs varianterna med en egen `GET` per produkt, vilket är
vad Steg 13 gör ändå.

### ☠️ En live-grind som mäter HELA sidan fäller på butikens EGET chrome (2026-09-08)

Runda 100:s Steg 14-grind läste den renderade HTML:en och fällde **alla sex**
sidorna på två träffar. Att de var IDENTISKA på varenda sida var i sig
beviset att de inte kom från texten:

| träff | vad det faktiskt var |
|---|---|
| `46-736` mot artikelnummermönstret `\d{2,3}-\d{3,4}` | butikens kundtjänstnummer **+46-736-630-990** i JSON-LD:ns `ContactPoint` |
| `fri frakt` mot leveranslöftesmönstret | butikens EGEN utfästelse **"🚚 Fri frakt över 499 kr"** i banner och köpblock |

Båda är Leonards egna beslut och står på varenda sida i butiken — kontrollmätt
samma dag på startsidan och på två sidor från tidigare rundor: 1 träff var,
överallt. Ingendera kommer från poleringen.

⚠️ **Att snäva in till "produkttextens yta" räcker INTE.** Nästa försök klippte
från ingressens början till sista korslänkens namn — och fick 58 000 tecken,
för sidan bär texten TVÅ gånger: en gång renderad och en gång i Next.js
flight-payloaden. `rfind` landade i den andra kopian och svepte in hela chromet
igen.

✅ **Det som avgör frågan är ett KONTROLLPROV, inte en bättre slice.** Hämta en
sida grinden aldrig rört — startsidan, eller en sida från en tidigare runda —
och sök samma sträng. Finns den där är den chrome, och grinden ska sluta leta
efter den i den renderade sidan. Textens egen renhet är redan bevisad av
`lint.py` på filen, före skrivningen; live-grindens jobb är att bevisa att
texten NÅDDE fram och att inget nytt tillkommit.

**Regeln: en grind byggd för produkttexten får inte köras mot sidans ram.**
Samma familj som runda 99:s lärdom att regel 4 och 6 måste mätas på PROSAN och
inte på listorna de själva genererar — en grind som mäter fel yta ger ett
svar som ser ut som ett fynd.

### ☠️ En grind som STRYKER innan den söker beskriver SIG SJÄLV i felmeddelandet (2026-09-09)

Runda 107:s live-grind måste släppa igenom ordet "kanin" på två sanktionerade
ställen — den rättsliga upplysningen och nej-svaret i FAQ — och gjorde det genom
att stryka dem ur en arbetskopia före sökningen. Första körningen rapporterade:

```
KANINLÖFTE: …"name":"Går det att hålla kanin i stallet?",
             "acceptedAnswer":{"@type":"Answer","text":""}…
```

Det ser ut som ett riktigt fynd, och ett allvarligt: ett FAQPage-JSON-LD där
frågan står men **svaret är tomt**, på just den fråga sidan finns för att
besvara. Det hade blivit en felanmälan mot butiksrepots strukturerade data.

**Svaret var inte tomt.** `"text":""` är vad som blev kvar EFTER grindens egen
strykning — den skrev ut sammanhanget ur den STRUKNA kopian. Kontrollmätt mot
skarpa sidan samma minut: alla sju FAQ-svaren är ifyllda ordagrant.

**Regeln: skriv ut sammanhanget ur ORÖRD text, aldrig ur arbetskopian.** Sök i
den strukna, citera ur den hela — annars beskriver felmeddelandet grinden i
stället för sidan. Samma familj som runda 61:s *"orsaken var live-grindens EGEN
förhandskörning"*, och den är dyrare än den ser ut: ett artefakt som bokförs som
fynd skickar nästa session att felsöka något som aldrig gick sönder.

⚠️ **Och en sanktionerad FAQ-fråga måste strykas TILLSAMMANS med sitt svar.**
Källtextgrinden (`grind.py`) strök hela nej-svarsparet; live-grinden strök bara
svaret, och föll på frågans rubrik i JSON-LD:n. Härled frågan ur texten — den
`<strong>…?</strong>` som står närmast före svaret — i stället för att skriva om
den i grinden.

### ☠️ Butikens "liknande produkter"-rad finns i TVÅ serialiseringar (2026-09-09)

Samma runda, samma grind, nästa lager. Efter att de sanktionerade meningarna
strukits föll två sidor fortfarande — på butikens rekommendationsrad, som
länkade till `kaninhus-utomhus-122-cm-rastgard` och `kaninbur-inomhus-…`.
Det är ANDRA produkters namn, alt-texter och länkar, alltså inget påstående om
varan sidan säljer.

☠️ **Första strykningen tog `<a class="prod">…</a>` och SÅG UT ATT BITA.** Den
gjorde det inte: raden ligger också i Next.js **Flight-nyttolast**, som inte är
HTML alls —

```
["$","$L40","kaninhus-utomhus-122-cm-rastgard",{"className":"prod","href":"/produkt/…
```

— och en strykning som bara känner den ena formen tar bort hälften av
förekomsterna och lämnar resten. Det är runda 100:s lärdom om att sidan bär
texten två gånger, fast åt andra hållet: där svepte en slice in för mycket, här
tog en regex bort för lite.

✅ **Stryk IDENTITETER, inte markup.** Andra produkters slug och namn är samma
literal i båda serialiseringarna:

```python
andras  = set(re.findall(r"/produkt/([a-z0-9-]+)", norm)) - {egen_slug}
andras |= set(re.findall(r'"pname">([^<]+)<', norm))
```

☠️ **Och varje strykning behöver en KONTROLLMÄTNING på sig själv:** sidans EGNA
alt-texter måste finnas kvar efteråt. Hela poängen med att live-grinden läser
hela HTML:en är att den ser alt-texterna (Steg 9), och en strykning som råkat
svälja galleriet hade gjort "noll fel" precis lika meningslöst som en tom
hämtning. Samma form som hjältebildens kontrollmätning, fast riktad mot grindens
eget filter i stället för mot nätverket.

### ☠️ Ett köpavgörande tal kan finnas BARA i pixlarna

Samma runda. Leverantörens egen infografik för planchan `f02917da` hade en panel med
rubriken *"Included Regulator & Hose"* och ett foto på regulatorn. Zoomat på 900 px
går etiketten att läsa: **50 mbar**, alltså den TYSKA standarden. Svenska P-tuber
(P6, P11) ansluts med **30 mbar** och POL-koppling — kontrollerat mot gasoltuben.se,
Linde Gas och KitchenLab.

Talet står **ingenstans** i feeden. Inte i `Technische Daten`, inte i `Lieferumfang`,
inte i titeln. Utan bilden hade alla åtta sidorna sagt "regulator och slang ingår"
som en ren säljpunkt, och kunden hade fått hem en grill som inte går att koppla till
sin tub. Det är precis en sådan **hård gräns som är en del av köpet** som Steg 7 säger
ska skrivas som ett positivt villkor med egen rubrik — här `<h2>Så ansluts den till
svensk gasol</h2>` på alla åtta.

Två saker följer:

1. **Läs siffrorna i bilderna, inte bara i texten.** Måttritningen granskas redan
   (Steg 4). Etiketter på produkten, på förpackningen och i leverantörens
   feature-collage är samma sorts källa — och den enda källan när feeden tiger.
2. **En engelsk eller tysk infografik kastas inte, den byggs om.** Panelen blev ett
   svenskt `card_grid` med de tre delfotona och rätt text. Fyndet hade gått förlorat
   om bilden bara plockats bort som "utländsk text".

✅ **Regeln bekräftades direkt i runda 45.** Kortet *"GEEIGNET FÜR MITTLERE &
GROSSE HUNDE"* på hundburen `d3b47c8b` anger **`Körperlänge < 55 cm`**. Feedens
text nämner bara 25 kg — längdmåttet står ingenstans utanför bilden, och på en
hundbur är det längden som avgör om varan går att använda. Två rundor i rad, två
olika produktgrupper: **titta på siffrorna i leverantörens collage innan du
kastar det.**

☠️ Och gränsen för vad som får påstås: bilden bevisar vad som ligger i **den här**
produktens kartong. De sju andra sidorna säger därför bara vad `Lieferumfang` säger
plus den svenska anslutningen — inte att deras regulator är 50 mbar, för det är inte
mätt.

### ☠️ "Leverantören anger…" — mot kunden är VI leverantören, och det GÅR att grinda

Runda 53 (matgrupper, 2026-09-04). Varje mekanisk grind var grön på åtta produkter;
Steg 12-läsningen hittade **fem defensiva formuleringar på tre av dem**:

| produkt | i texten |
|---|---|
| `0058ad50` | *"Leverantören anger att gruppen behöver minst 2,5 m² golvyta"* — och en gång till i FAQ:n |
| `b07189d2` | *"Leverantören anger att gruppen behöver 180 × 170 cm"*, *"180 × 170 cm enligt tillverkaren"* |
| `b07189d2` | *"Leverantören anger materialet som glas … så vi anger inte mer än så"* |

Talen är hämtade ur samma importdata som resten av spec-tabellen, där de står som våra
egna. Att i brödtexten skjuta just dem ifrån sig läser som att vi själva tvivlar på det
vi säljer — och kunden köper av oss, inte av den vi köpt av. Rättningen är att stryka
attributionen och behålla talet: *"Gruppen behöver minst 2,5 m² golvyta med utdragna
stolar."*

Härdnings-svaret behöll sin substans (Steg 2-grinden säger att härdning inte får påstås)
men äger den nu: *"Vi anger skivan som glas, inte som härdat glas. Behandla den därefter."*

**Och till skillnad från tonfel i allmänhet är den här klassen mekaniskt fångbar** — det
är en handfull ordvändningar, inte en bedömning:

```python
DEFENSIV = [r"[Ll]everantören (anger|uppger|skriver|säger)", r"[Tt]illverkaren (anger|uppger)",
            r"[Ee]nligt (leverantören|tillverkaren)", r"vi har inga uppgifter",
            r"[Kk]ontrollera själv", r"[Mm]ät själv", r"[Vv]i vet inte", r"kan inte garantera",
            r"[Dd]et normala\b", r"[Dd]et vanliga\b"]
```

De två sista fångar en annan sak: *"trettioen centimeter … vilket är det normala
benutrymmet för en matplats"* är ett påstående om möbler i allmänhet som ingen mätt.
Samma familj som superlativen — **det ser ut som en beskrivning men är en mätning.**

### ✅ Katalogsvepet: 408 sidor → 0, och grinden var orsaken (2026-09-08)

Leonard bad om det uttryckligen: *"vi ska va leverantören ingen annan."* Mätt
över hela katalogen, 5 553 produkter:

| | före | efter |
|---|--:|--:|
| Publicerade sidor med aktörsord i brödtexten | **408** | **0** |
| Förekomster | **~754** | **0** |

☠️ **Regel 8 i `lint.py` var orsaken, inte poleringen.** Den fångade
`leverantör*` men INTE `tillverkaren anger`, inte `tillverkarens ritning`, inte
`enligt tillverkaren`, inte `producenten`. Fyra av fem verkliga former passerade
— varje runda rapporterade grön grind medan 17 % av sortimentet bar
formuleringen. Regeln delar sedan dess aktörslista med
`tools/leverantorssvep/grind.py`, och självtestet har en mutering per aktörsord
som svepet faktiskt hittade på en publicerad sida.

☠️ **En sök-och-ersätt hade gått sönder på svenskan.** Svansen var 213 olika
formuleringar på 228 förekomster. `Leverantören anger att X` går inte att
stryka mekaniskt: bisatsen har adverbet före verbet och huvudsatsen efter, så
*"…att uppsättningen dessutom går att anpassa"* blir *"Uppsättningen dessutom
går att anpassa."* Bara det rena ADVERBIALET (`enligt leverantören`) är
mekaniskt säkert — resten skrevs om för hand i 470 grindade par.

⚠️ **Ärlighetsmeningar stryks inte, de skrivs om.** *"Leverantörens egen sida
uppger 1,76 kg på ett ställe och 1,9 kg på ett annat"* är information kunden
har nytta av. Motsägelsen står kvar, aktören försvinner: *"Uppgifterna går
isär: 1,76 kg på ett ställe och 1,9 kg på ett annat."*

Hela mätningen och de fem lärdomarna står i `tools/leverantorssvep/MATNING.md`.


### ☠️ En påstående-grind måste kunna skilja ett påstående från ett FÖRNEKANDE

Samma runda, direkt efter rättningen ovan: grinden fällde den nya, korrekta meningen
*"Vi anger skivan som glas, inte som härdat glas"* — för `CERT` innehåller `härdat glas`
som blank spärr. Det är exakt samma fel som den blanka `massivt trä`-spärren hade
(*"Det är inte massivt trä"* är rätt text), och en grind som fyrar på rätt text lär
läsaren att bläddra förbi.

Den generella formen, och den ska ersätta varje blank ordspärr som får negeras:

```python
NEKAD = re.compile(r"\b(inte|aldrig|utan|varken)\b[^.<]{0,30}$")
...
if NEKAD.search(h[max(0, t.start() - 40):t.start()]): continue
```

`[^.<]` gör att blicken bakåt stannar vid meningsgränsen och vid närmaste tagg — annars
hade *"Skivan är glas. Härdat glas ingår."* blivit avväpnad av ett `inte` i föregående
mening. Verifierat med fyra fall: påstående fäller, förnekande släpper, påstående efter
ett förnekande i FÖREGÅENDE mening fäller.

☠️ **Ordspärrarna måste dessutom vara versal-tåliga.** `r"härdat glas"` missade
`"Härdat glas ingår"` — ett påstående som inleder en mening. Mutationstestet hittade det;
läsning av regexen hade inte gjort det.

### ☠️ En grind skriven i en icke-rå Python-sträng blir tyst avväpnad

Samma runda, tredje gången i samma block. Grinden ovan skrevs in i `lint.py` av ett
patch-skript med en vanlig trippelcitat-sträng — och där är `\b` inte ordgränsen utan
**tecknet BACKSPACE (U+0008)**. Fyra sådana hamnade i filen. `re.compile` klagar inte:
den bygger ett mönster som matchar ett backspace-tecken, alltså aldrig något.

Symtomet är det farligaste som finns: grinden kör, svarar grönt, och testar ingenting.
Den hittades bara för att mutationstestet fortsatte visa `SLAPP IGENOM` efter att
"fixen" var på plats.

```python
s.count(chr(8))   # → 4. Skriv grindar i r"..." — eller räkna backspace efteråt.
```

Samma familj som *"en grind mot osynliga tecken får inte SKRIVAS med osynliga tecken"*
(runda 46) — och nu med ett tecken som inte ens går att se i en diff.

### ☠️ En mutation måste ta bort VARJE bärare av faktumet (2026-09-05)

Besläktad med regeln nedan, men den slår tidigare och tystare. En grind läser
oftast **fyra** bärare: `name`, `title`, `meta` och brödtexten. En mutation som
bara rör HTML:en lämnar faktumet kvar i de tre andra — grinden tiger med rätta,
och testet rapporterar en miss som ser ut som ett hål i grinden.

Fyra av runda 62:s tjugonio mutationer föll på just det: `120 kg` stod kvar i
namnet, `björk` i titeln, `15–30 minuter` i FAQ-svaret. Alla fyra grindarna var
korrekta hela tiden.

☠️ **Och en färgmutation får aldrig gå via produktens eget färgfält.**
Spec-tabellen BYGGS ur det fältet, så en ändring där följer med in i texten och
grinden jämför fältet med sig självt — den kan inte fälla. Defekten den vaktar
är att TEXTEN säger en annan färg än produkten, alltså ska texten muteras och
fältet lämnas orört. Samma form som varje annan självuppfyllande kontroll:
**om mutationen ändrar både facit och det som mäts, mäter testet ingenting.**

### ⚠️ En mutation som pekar på en mening du skrivit om testar ingenting

Steg 12 skrev om öppningsmeningen i `b4b1c099a`. Mutationen för *"mellanslag före
skiljetecken"* ersatte `"armbågarna möts."` — som inte längre fanns — så den muterade
texten var identisk med originalet, och mutationen rapporterades som SLAPP IGENOM. Den
grinden fungerade hela tiden; det var testet som slutat träffa.

**Kör mutationstestet efter varje textändring, inte bara efter varje grindändring**, och
låt varje mutation `assert` att dess ankare finns i texten.

### ☠️ Ett feltypat produkt-id ska INTE kunna skriva någonting

Samma runda: ett av åtta id var transkriberat med två omkastade tecken
(`…-45e3-…` mot `…-43e5-…`). Skrivningen gjorde ingen skada — men bara för att
PATCH-slingan börjar med en `GET` på samma id och hoppar över produkten när den 404:ar.
Rätt id gick inte att gissa (båda formerna är giltiga UUID:er) utan lästes tillbaka ur
katalogsvepet.

Två grindar, båda billiga, och de fångar olika fel:

1. **`GET` före `PATCH`, och `startsWith(nyckeln)` på svaret.** Ett id som inte finns
   404:ar; ett id som finns men är FEL produkt fastnar på prefixet.
2. **Checksumma på nyttolasten.** Räkna `sum(ord(c) for c in html)` i Python, bädda in
   talet, och låt JS:en räkna om det innan den skriver. Längddeltat fångar en text som
   TAPPAT tecken; checksumman fångar en text där ett tecken bytts mot ett annat — och det
   är just vad en transkribering gör.

**Regeln: en skrivning som bygger på en sträng du skrivit av för hand behöver en grind som
inte gör det.**


### ☠️ Live-kontrollen måste använda HUSETS mönster, inte ett hemmaskrivet

Runda 54:s första svep på de åtta renderade sidorna rapporterade **artikelnummer på alla
åtta** och tyska på en. Båda var falsklarm, och båda av exakt samma sort som `omgång`
inuti *genomgång*:

| kontroll | vad som faktiskt matchade |
|---|---|
| `[0-9]{3}-[0-9]{3}[A-Z0-9]{2,}` | segmentet `401-07593171` **inuti ett UUID** i sidans JSON |
| `Hunde` | svenskans **`hunden`** i metabeskrivningen |

Lintet har redan de rätta formerna — artikelnumret med lookarounds åt båda hållen
(`(?<![0-9a-fA-F-])…(?![0-9a-fA-F-])`) och tyska ord med ordgräns. De skrevs en gång
just för att UUID:er och svensk böjning finns. **Importera dem i live-kontrollen i
stället för att skriva om dem ur minnet**; en kontroll som fyrar på varenda sida lär
läsaren att ignorera den, och då är även det äkta fyndet borta.

⚠️ Och kör kontrollen i **Python med en retry**, inte som en `curl`-rad per fält. Två av
åtta sidor svarade `000` på det ANDRA anropet (två anrop per sida: ett för kroppen, ett
för statuskoden) fast första anropet gav full HTML — en transient nätmiss som såg ut som
en 404. Ett anrop per sida, upp till tre försök, och båda talen ur samma svar.

### ☠️ Ett kortvärde ska citera den rad tabellen FAKTISKT har

Kortgrinden fällde fem rader i runda 54, och den hade rätt varje gång. Korten sade
`Bredd: 74–147,5 cm` medan spec-tabellen bara bär den SAMMANSATTA raden
`Mått: 74–147,5 × 2 × 76,2 cm` — det fristående måttet med sin enhet står ingenstans.

Två utvägar, och valet är inte godtyckligt: **byt kortets rad** (rör bara Steg 9) eller
**lägg till en egen rad i tabellen** (kräver ny `plainDescription`, ny byte-exakt
verifiering och en omskrivning av åtta redan skrivna produkter). Ta den första om inte
tabellen verkligen saknar något kunden behöver.

### ☠️ Kortets RUBRIK beskriver fotot, inte produkten

Två hagar fick ett andra kort som ersättning för leverantörens tyska grafiker. Fotot är
bild 1:s nedre halva: fem renderingar av hagen ställd rak, i rektangel, i åttkant — och
längst till höger en hopfälld bunt. Rubriken sade **"Åtta paneler i en bunt"**.

Varenda mekanisk grind var grön: alla tal stod ordagrant i spec-tabellen, alt-texten
klarade språkgrinden, kortet låg på plats 4. Felet syns bara när man tittar på det
renderade kortet bredvid sin egen rubrik. Rättat till *"Åtta paneler i valfri form"*,
som är vad bilden visar.

**Ett kort är en bild med text på — och texten måste stämma med bilden, inte bara med
databasen.**

### Exporten behöver ett kvalitetsGOLV, inte bara ett storlekstak

Runbokens första utväg för ett kort som inte ryms — byt till produktens studiobild —
mättes upp igen och håller med marginal:

| kort | livsstilsfoto | studiobild |
|---|---|---|
| trappgrind (nätfyllning) | 228 kB vid **q=72** | 204 kB vid **q=88** |
| utdragbar grind (stålnät) | 214 kB vid **q=72** | 206 kB vid **q=90** |
| rasthage (trädgårdsscen) | **324 kB** vid q=72 | 203 kB vid **q=90** |

Rasthagen gick inte under taket ens med 1,5 px oskärpa på fotot (251 kB vid q=72) —
lövverket är dyrare än nätet. Poängen är att **"det ryms" alltid går att uppnå genom att
komprimera sönder kortet**, och den utvägen ser ut precis som den rätta i en filstorlek.
Lägg därför golvet i exportskriptet: ett kort som inte ryms med **q ≥ 80 fäller** i
stället för att komprimeras vidare, och då tvingas man byta källbild.

### ⚠️ Ett filter på ett icke-filtrerbart fält returnerar TYST fel rader

En fråga till `products/search` med `filter: {"directCategoriesInfo.categories.id":
{"$hasSome": [...]}}` svarade 200 med 50 produkter — bokhyllor, julgranar och klösträd,
alltså hela katalogen ofiltrerad. Fältet finns i svaret; det gör det inte filtrerbart.
Varje query-metod har en STÄNGD lista över vilka fält som får filtreras och med vilka
operatorer, och allt utanför den ignoreras eller ger fel rader utan att något felar.

Samma familj som resten av kapitlet: **hämta en avgränsad sida och filtrera i egen kod**
när fältet inte står i metodens lista.


-----

## Steg 13 – Publicera (sista handlingen)

Kör den när Steg 6–12 är klara och **verifierade**. Hämta färsk `revision` först.

```json
PATCH .../products/{PRODUCT_ID}
{ "product": { "id": "…", "revision": "…", "visible": true } }
```

☠️ **Sätt `visible` explicit i VARJE PATCH under hela kedjan, inte bara här.** En PATCH som
bär `variantsInfo` utan `visible` tar produkten från `false` till `true` — Wix behandlar en
variantskrivning som en publicering, och fältmasken skyddar inte synligheten. Så
publicerades tunneltältet `e4b000fa` oavsiktligt 2026-08-29, med tyska alt-texter och utan
kategori. **Och åt andra hållet:** produktens `visible:false` speglas NED på varianterna, så
den avslutande PATCH:en måste bära `visible: true` på både produkt och variant — annars går
sidan live och varan går inte att lägga i varukorgen. Det syns inte i produktvyn.

### ☠️ FLIKRUBRIKEN ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR — mätt i butikens källkod

Checklistan ovan sa redan att strängen måste stämma ordagrant. Runda 120 skrev
ändå **`Montering och skötsel`**, och det gick igenom varenda grind: textgrinden
hittade rubriken, live-grinden hittade ORDET på sidan, och åtta sidor gick live.

Butikens `splitFlikar` (butiksrepot `headless-site`, `components/productview.tsx`)
känner **exakt fyra** mönster och inget annat:

```js
const FLIK_TITLE_PATTERNS = [
  /Tekniska\s+[Ss]pecifikationer/,
  /Anv[äa]ndning\s+och\s+sk[öo]tsel/,
  /(Vanliga\s+fr[åa]gor|Ofta\s+st[äa]llda\s+fr[åa]gor)/,
  /Kontakta\s+oss/,
]
```

Uppmätt live 2026-09-10 på `barbord-tva-pallar-80-cm-gra`:

| | |
|---|---|
| `<summary>` på sidan | `Tekniska specifikationer` · `Vanliga frågor` · `Kontakta oss` |
| `<h2>` i brödtexten | … `Montering och skötsel` · `Passar inte det här?` … |

☠️ **Och skadan är större än en saknad flik.** `splitFlikar` lägger allt EFTER
en matchande rubrik i den fliken, ända fram till nästa match. Skötseltexten OCH
korslänkarna hamnade alltså **inne i spec-tabellen** — mellan `Tekniska
specifikationer` och `Vanliga frågor`. Spec-fliken bar tre avsnitt.

⚠️ **Ordningen i HTML:en är därför inte fri.** Allt som ska ligga i brödtexten
måste stå **före den första flikrubriken**; ett block mellan två flikrubriker
hamnar i den föregående fliken. Rundans korslänkar (`Passar inte det här?`) är
flyttade dit.

☠️ **Grinden måste läsa `<summary>`, inte texten.** En kontroll som frågar
"står ordet på sidan?" svarar GRÖNT på alla åtta — ordet står ju där, som `<h2>`.
Runda 119:s live-grind gjorde precis det. Kontrollen är sedan runda 120:

```python
SUMMARY = re.compile(r"<summary[^>]*>\s*(.*?)\s*</summary>", re.S)
flikar = [m.strip() for m in SUMMARY.findall(html)]
for flik in ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]:
    if flik not in flikar: …
```

Tre självtestfall låser den: bytt skötselrubrik, `Specifikationer` i stället för
`Tekniska specifikationer`, och en flikrubrik nedgraderad till `<h2>`.

⚠️ **Blast-radien är mätt, inte gissad.** En grep över `tools/polish-assets/`
ger tre rundor som skrivit `Montering och skötsel`: **118, 119 och 120**.

✅ **Alla tre är rättade 2026-09-10.** 17 live-sidor omskrivna och verifierade
(8 i runda 118 + 9 i runda 119; runda 118:s nionde är fortfarande utkast och
rättades i samma svep). Kvitto: `3 sidor, 0 fel` × flera pass — varje sida bär
`Tekniska specifikationer`, `Användning och skötsel`, `Vanliga frågor` och
butikens egen `Kontakta oss`.

✅ **Regeln bor sedan dess i `grindar.flikfel`, inte i rundans egen fil**, och
körs med `python3 flikkoll.py <pid>=<slug> …`. Fyra självtestfall i
`grindar._sjalvtest()`.

☠️ **Och den räknar FÖREKOMSTER, inte närvaro — det är dubblettkontrollen.**
En beskrivning som råkat bli skriven två gånger ger **två**
`<summary>Tekniska specifikationer</summary>`, för delaren öppnar en ny flik
vid varje träff. Den kontrollen behövdes: runda 119:s `5d1696db` fick sin text
dubblerad när PATCH-kroppen skrevs av för hand. Filen var rätt, avskriften
fel — samma lärdom som husets *"skriv texten i en FIL först"*, ett steg senare
i kedjan.

⚠️ **Ett rött utfall ska verifieras mot Wix innan det tros om sidan.**
`hamta_isr`:s 20-sekunderspaus räcker inte alltid direkt efter en skrivning.
Uppmätt på `ad390a36`: grinden sa SAKNAS medan Wix bar rätt text
(revision 8), och samma URL svarade korrekt 25 sekunder senare —
`age 130 → 0 träffar`, `age 155 → 1 träff`. Datan var rätt; mätningen var för
otålig. Kusin till runda 60:s cachegåta.

**Regeln: en grind som mäter NÄRVARO svarar inte på en fråga om STRUKTUR.**

### ☠️ En grind skriven mot PLATSEN där felet hittades täcker inte REGELN

Runbokens sifferstil säger *"skriv **aldrig** en kommalista av tal med enheten sist"*.
Regeln stod utan grind, jag hittade brottet i mina egna spec-tabeller, och byggde grinden
där: `SPEC_LISTA` lästes bara ur `<li><p>Etikett: värde</p></li>`. Sju rader rättades, alla
grindar blev gröna, och åtta sidor gick live.

Sex förekomster stod kvar — i **brödtexten** och i **meta-beskrivningen**:

| var | vad som stod |
|---|---|
| meta-beskrivning | `tre fack på 22, 22 och 16 cm` |
| brödtext | `Innanför den finns tre fack, 22, 22 och 16 centimeter höga.` |
| brödtext (FAQ) | `de tre planen är fasta med höjderna 14, 14 och 16 centimeter` |
| brödtext | `Stommens fack är 13,5, 13,5 och 28,5 centimeter` |

Den sista är den som visar varför regeln finns: **decimalkomma och listkomma bredvid
varandra**. Meta-beskrivningen är dessutom det Google visar i träfflistan, alltså exakt
den yta där felet kostar mest.

Grinden granskar nu `name`, `title`, `meta` och hela HTML:en, inte bara spec-tabellen.
**Regeln säger "aldrig" — då är ytan all text, och en grind som täcker mindre är ett
påstående om att resten är ren.**

☠️ **Skiljetecknet är mellanslaget, inte kommat.** `\d+(?:,\d+)?, \d` — listkommat har
alltid ett mellanslag efter sig, decimalkommat aldrig. Tappas mellanslaget fäller mönstret
varje decimaltal i katalogen. En mutation som INTE får fällas (`Skåpet väger 13,5 kg`)
låser den riktningen.

### ☠️ En mutation som BYTER UT ett uppmätt värde bevisar fel grind

`m_kommalista` bytte `14 / 14 / 16 cm` mot `14, 14 och 16 cm` — och rapporterades som
FÅNGAD. Meddelandet avslöjade att det inte var sifferstils-grinden som fällde:

```
kommalista av tal    FANGAD: saknar uppmätt värde '14 / 14 / 16 cm uppifrån och ner'
```

Utbytet tog bort ett uppmätt värde, så måtthämtnings-grinden fällde först, och
sifferstils-grinden hade kunnat vara helt avväpnad utan att testet märkte något.
**Mutera genom att LÄGGA TILL, inte byta ut** — då står det ursprungliga värdet kvar och
bara den grind du testar kan fälla. Samma familj som "ett mutationstest som bara kräver
någon brist provar inte grinden du tror": **läs meddelandet, inte bara utfallet.**

### ☠️ Den tyska ordlistan måste väljas per FAMILJ — ord som är svenska får inte stå i den

Live-kontrollens ordlista ärvs från förra rundan och ska skrivas om varje gång.
`Metall`, `Glas` och `Magnet` stavas **exakt likadant** på svenska och tyska — och i
medicinskåps-familjen är de tre av de vanligaste orden i korrekt svensk copy. Hade de
följt med hade grinden fällt varenda rätt sida.

Skillnaden mot runda 54:s `Hunde`/`hunden` är att där fanns en ordgräns att sätta. Här
finns ingen: ordet ÄR svenskt. Enda försvaret är att välja listan efter familjens ordförråd
— tyska ord som saknar svensk tvilling (`Schrank`, `Schlüssel`, `Fächer`, `Weiß`,
`abschließbar`, `Lieferumfang`).

### ☠️ Ordlistan behöver en ORDGRÄNS, inte bara ett bättre urval

Runda 55 lärde att välja orden per familj. Runda 56 visar nästa lager, och det
går inte att välja sig ur: **`Gelb` är entydigt tyskt och saknar svensk tvilling
— och fällde ändå en korrekt sida**, för att det står inuti svenskans **re·gelb·undet**.

| | |
|---|---|
| Träff | `…Dammsug regelbundet och borsta upp luggen…` — ordet är **re·gelb·undet** |
| Sidan | `b09e94ca`, vars text var helt riktig |
| Falsklarm | 1 av 8 sidor |

Skillnaden mot `Metall`/`Glas`/`Magnet` är att där var ORDET svenskt; här är
ordet tyskt och bara **delsträngen** svensk. Kurering hjälper alltså inte —
mönstret måste bära gränsen: `re.search(r"\b" + re.escape(ord), text)`. Gränsen
sitter i BÖRJAN, inte i slutet, så böjda tyska former (`Sitzbänke`) fortfarande
fastnar.

☠️ **Och regeln bakom: ett falsklarm på en riktig sida kostar lika mycket som
ett missat fel.** Körningen gav åtta röda rader medan alla åtta sidor var rätt
— en på ordlistan, sju på proxy-detaljen längre ner. Det är precis den sortens
utfall som lär läsaren att kvittera bort listan i stället för att läsa den.

### ☠️ Rubrikräkningen var ÄRVD från förra rundan och beskrev inte den här sidan

Checklistan ovan säger `<h2>`-räkning 7. Runda 56:s sidor har **3**, och alla
tre är butikens egen krom (`Beskrivning`, `Liknande produkter`, `Utforska fler
avdelningar`). Poleringens egna rubriker finns — men butiken gör om dem:

```
min HTML:      <h2>Tekniska specifikationer</h2>
renderad sida: <details class="pdp-flik"><summary>Tekniska specifikationer</summary>
```

Ett `<h2>`-tal svarar alltså på en fråga om butikens mall, inte om poleringen.
Kontrollen ska i stället slå upp de tre flikarna **vid namn**
(`<summary>Tekniska specifikationer`, `Användning och skötsel`, `Vanliga
frågor`) — då mäter den det den påstår sig mäta, och den överlever nästa
malländring genom att fälla i stället för att tystna.

Samma familj som ordlistan ovan, och det är poängen: **en grind som ärvs från
förra rundan bär ett påstående om DEN rundan.** Mät om talet, eller byt ut det
mot något som beskriver innehållet.

⚠️ **Miljödetalj som fick åtta sidor att se ocachade ut.** Utgående HTTPS går
via en proxy, så `curl -D -` skriver FÖRST proxyns `HTTP/1.1 200 Connection
Established` och en tom rad. Ett skript som delar på första tomraden får
proxyns huvud som "huvud" och sidans huvud som "kropp" — `x-vercel-cache` och
`age` blir tomma, och statusraden läser `Established`. Skriv huvud och kropp
till **var sin fil** (`-D fil.h -o fil.html`) och ta den SISTA `HTTP/`-raden.

### ☠️ Två grindar med var sin KOPIA av samma regel glider isär

Runda 57:s live-grind fällde **åtta av åtta korrekta sidor** på ordet `rostfri`.
Sidorna hade rätt: texterna säger med flit *"Ramen är lackerat stål, inte
rostfritt"* — precis vad Steg 2-grinden krävde. Lintet hade undantaget:

```python
ROSTFRI    = re.compile(r"rostfri", re.I)
ROSTFRI_OK = re.compile(r"inte rostfri", re.I)
```

Live-grinden hade en egen kopia av regeln, i en enkel lista över förbjudna ord,
och den kopian saknade negationen. Två grindar om samma sak, skrivna två gånger.

Fixen är husets vanligaste: **importera regeln, kopiera den inte.** Live-grinden
gör nu `from lint import ROSTFRI, ROSTFRI_OK`. Samma familj som `SHIP_AXIS_RE`,
`EU_TULL_CODES` och `mapWithConcurrency` — och den dyraste varianten, för en
grind som fäller allt lär läsaren att kvittera bort den.

#### ☠️ …och en kopia kan ligga FEL I TRE RUNDOR utan att någon märker det

Runda 120 mätte samma sak igen, med datum. Jargonggrinden — husets ord för ett
poleringspass, som läckt till publicerad kundtext tre gånger (uppgift #318) —
kopierades in i varje rundas `grind.py`:

| runda | mönster | |
|---|---|---|
| 115, 116 | `\brundans?\b\|\brunda\s+\d` | rätt |
| **117–119** | `\brundan?\b` | ☠️ **matchar ADJEKTIVET** |
| 120 | `\brundan\b\|\brunda\s+\d+` | rätt igen |

Den breda formen fäller *"två **runda** pallar"*. Att den kunde ligga fel i tre
rundor beror på att **ingen produkt i 117, 118 eller 119 var RUND** — runda 120
sålde runda pallar och blev det första underlag som nådde grinden. Sju
förekomster, två fällda korrekta sidor.

☠️ **En trasig grind som aldrig får ett indata som utlöser den ser korrekt ut i
källkoden hur länge som helst.** Samma runda hittade ett andra fall i samma
familj: mönstret mot höjdjustering var `höj\w*\s*(och\|-)?\s*sänkbar\w*` —
det tillåter bindestreck ELLER "och", medan den vanligaste svenska formen
(`höj- och sänkbara`) bär BÅDA. Grinden var stum mot precis det den fanns för,
och självtestet var det enda som kunde säga det.

**Reglerna bor i `tools/polish-assets/grindar.py` sedan runda 120** — `JARGONG`,
`TILLATNA_TECKEN` + `homoglyfer()`, `DELORD` + `fargfel()`, `flikfel()` (runda
121) och `butikstvatt()` med `EU_RIBBON`/`BILDADRESS`/`SVG_GEOMETRI` (runda 121)
— och `tvillingsvep()` i samma fil är källkodstestet som fäller om en runda från
120 och framåt definierar om dem i stället för att importera. Samma mekanism som
`store-access-audit.test.ts`.

#### ☠️ LIVE-GRINDENS TVÄTT ÄR DEN FARLIGASTE TVILLINGEN — den ser ut som ett produktfel

`egna_meningar` tar tvätten som ARGUMENT, så den har skrivits om i varje runda.
Runda 121 mätte vad det kostar: **12 fel på 8 KORREKTA sidor**, i två klasser
som båda läste som defekter på sidan.

| klass | träffar | vad som faktiskt hände |
|---|--:|---|
| `LEVERANSLAND` | 8 | chromets ANDRA `EU-lager`-rad var otäckt |
| `FÄRGORD` | 4 | tvätten dödade `href` → korslänken lästes som egen text |

☠️ **Ett brett `https?://\S+` DÖDAR KORSLÄNKARNA.** Tvätten körs FÖRE
`dela_pa_ankare`, och ankarmönstret kräver ett intakt `href="…"`. Utan adress
är ankaret inget ankare, och länktexten — som NAMNGER grannens färg, med flit —
faller ned bland sidans egna meningar. Grinden fyrar då på precis det
korslänkarna finns för att säga. Mönstret ska vara wixstatic-SPECIFIKT, och
attributstrykningen får bara röra `src`/`srcset`. Aldrig `href`.

☠️ **`EU-lager & tull` har TRE former, och mönstret kände två.** `&` i DOM-texten
och `\u0026` i payloadens JSON var täckta; `&amp;` — den form den renderade
HTML:en faktiskt serverar — var det inte. Ett mönster som täcker två av tre ser
fullständigt ut i källkoden.

☠️ **Och SVG-heuristiken åt VÅR EGEN TEXT.** Runda 117–119 bar
`\b[Mm]\s*[\d.]+[,\s][\d.]+` för att fånga rå banadata. Uppmätt på vanlig
svenska:

| mening | efter tvätten |
|---|---|
| `Bredd 0,9 m 1,2 m djup.` | `Bredd 0,9 «» m djup.` |
| `…tar 1,8 m 20 30 skaft.` | `…tar 1,8 «» skaft.` |

Ett metermått skrivet på det vanligaste sättet försvinner alltså UR grinden,
och då kan ingen kontroll längre se det — uppgift #384:s klass åt andra hållet:
en strykning som DÖLJER ett fynd i stället för att skapa ett. Heuristiken är
borttagen; kvar står bara de två entydiga attributformerna. *(Kontrollmätt på
runda 117–121:s texter: noll träffar, alltså maskerades ingenting.)*

✅ **Tvätten prövas mot STRÄNGAR, inte mot en sida.** Den går inte att felsöka
mot live-HTML — dess fel ser ut som produktfel — så den har åtta egna fall i
`grindar._sjalvtest()`, inklusive ett som kräver att `href` ÖVERLEVER och ett
som kräver att vår egen text om EU-lagret INTE stryks. Live-grinden kör
`G._sjalvtest()` + `G.tvillingsvep()` FÖRE sidorna: en grind som prövar sig
själv först är skillnaden mellan "sidan är trasig" och "grinden är trasig".

⚠️ **Svepets EGET första utkast släppte igenom noll och fällde varje alias.**
Mönstret var `^NAMN\s*=\s*(?!G\.)`, och `\s*` backtrackar till noll tecken —
lookaheaden hamnade på MELLANSLAGET i stället för på `G`, så `NAMN = G.NAMN`
lästes som en egen definition. Negationen måste sitta EFTER likhetstecknet och
själv äta blanktecknen: `=(?!\s*G\.)`. Grinden mot trasiga grindar var alltså
själv ett exempel på det den vaktar.

#### ☠️ En NEGATION i en korslänk är inte ett påstående om grannen

Brödtexten har gått genom `loftestraff` sedan runda 117 — den ursäktar en träff
som är negerad i sin egen mening. **Länkmeningarna gick genom en naken
`search`** ända till runda 120, som fälldes på sina egna korrekta länktexter:

| länktext | grindens dom |
|---|---|
| "samma bredd **utan hylla**, i grått" | KORSLÄNK påstår FÖRVARING |
| "pallar **utan rygg**" | KORSLÄNK påstår RYGGSTÖD |

Samma familj som runda 114:s falska godkännande, fast åt andra hållet: där
ursäktade en negation ett löfte som borde fällts, här fällde en negation ett
korrekt nekande. Kör `G.loftestraff(monster, mening)` också på länkmeningarna.

#### ⚠️ Ett FÄRGORD i en alt-text beskriver ofta SCENEN, inte varan

Färggrinden byggdes i runda 89–91 efter tre rundor med fel färg, och letade
färgord var som helst. Runda 120 mätte priset: den fällde *"Fristående mot vit
bakgrund"* — husets vanligaste alt-textformulering, och en beskrivning av
fotostudion. `G.fargfel()` tittar därför bara på färg som sitter på en DEL av
varan, i båda svenska ordföljderna (`röd skiva`, `skivan är röd`). En bakgrund,
en vägg eller en matta är ingen del.

### ☠️ En borttagningsmutation som tar FÖRSTA förekomsten bevisar ingenting

`m_borttaget_bandantal` tog bort `30 elastiska band` och rapporterades som
grön — inget fel hittades. Värdet stod på **två** ställen (spec-raden och
brödtexten), och `replace(värde, "", 1)` lämnade det andra kvar. Grinden såg
värdet, sa inget, och mutationen bevisade ingenting om måttgrinden.

Borttagningsmutationer ska ta ALLA förekomster, och hävda det:

```python
p[fält] = p[fält].replace(värde, "")
assert värde not in p[fält], "värdet står kvar efter borttagning"
```

Systerregeln till runda 55:s *"mutera genom att lägga till, inte byta ut"*: en
mutation måste faktiskt åstadkomma det den påstår, annars provar den ingenting.

### ☠️ Körningsordningen i Actions är INTE den ordning du utlöste i

Åtta `las`-körningar utlöstes i känd ordning. Den första — `run_number` lägst,
tidigast `created_at` — rapporterade priset för en HELT ANNAN av de åtta.
Körningsnumret tilldelas vid skapandet, och dispatcharna blandas: en annan
session körde samma workflow samtidigt, och två av de åtta "mina" körningarna
var deras `stampla` på en hundkoja och en kaninbur.

**Enda facit är `PRODUCT_ID` i loggens env-block**, och för en stämpling raden
`OK: <uuid> uppdaterad`. Samma lärdom som runda 56:s bulk-attribution: **lita på
id:t i svaret, aldrig på ordningen.** Och följdsatsen: Steg 1:s krocksvep gäller
bara i det ögonblick det kördes — en parallell session publicerar sidor medan du
skriver.

### ☠️ SKU-regeln kapar vid 24 tecken — färgsyskon kan få SAMMA SKU

`PRODUCT_PART_MAX = 24` i `lib/import/sku.ts`, och `joinWithinLimit` kapar på
hel ordgräns. Färgen står sist i en naturlig slug, alltså är det färgen som
faller bort:

| slug | SKU-del (≤24) |
|---|---|
| `studsmatta-barn-163-cm-bla` | `studsmatta-barn-163-cm` |
| `studsmatta-barn-163-cm-rod` | `studsmatta-barn-163-cm` |
| `studsmatta-barn-163-cm-svart` | `studsmatta-barn-163-cm` |

Tre olika produkter, ett artikelnummer. I ett Google-Merchant-flöde är det tre
erbjudanden med samma `sku`. Kodens kommentar kräver bara unikhet INOM en
produkt, så regeln är inte bruten — men utfallet är ändå fel.

**Räkna SKU:n INNAN du låser sluggen på en färgfamilj.** Här räckte det att
stryka `cm`: `studsmatta-barn-163-bla` ger `FP-studsmatta-barn-163-bla`, och
alla åtta blev unika. Ett `kvitto.py`-assert på `len(set(sku)) == len(sku)`
fångar det, men bara om sluggen redan är rätt — talet 24 måste räknas för hand.

### ⚠️ En kategori kan se TOM ut för att det svenska ordet är ett annat

Mätningen sa **8 trampolinutkast, 0 publicerade** — en orörd kategori. Fel:
slug-mönstret var `/trampolin/`, och det svenska kategoriordet är **studsmatta**.
Två låg ute. Samma lucka som runda 56:s `/bank/`, som missade bänkar sålda som
*puff* och *kista*.

Skillnaden är att här hade ingen översättning hjälpt — ordet fanns inte i det
tyska namnet. Det som gav rätt ord var **`web_search` mot återförsäljarna**:
Jula, Clas Ohlson, JYSK, Rusta, Jollyroom och Bauhaus kategoriserar alla under
*studsmatta*. **Täckningsmönstret ska bära det SVENSKA kategoriordet, och det
hittar man hos handeln — inte i ordboken.**

⚠️ Och kategorin var ändå öppen, av ett annat skäl: de två publicerade är
TRÄNINGSmattor Ø102 med handtag och 100 kg maxlast, våra åtta är barnmodeller
med skyddsnät och 50 kg. Fyra tal skiljer — samma produkttyp i ordet, olika
produkt i verkligheten.

### ⚠️ Tal som mäter olika saker ser ut som en motsägelse

Ø163-modellernas måttritning anger **150 cm** vid fötterna medan spec-tabellen
säger **Ø163**. Det såg ut som runda 54:s motsägande breddmått — men den
sexkantiga systermodellens ritning visar BÅDA talen: `122 cm` vid ramen och
`163,5 cm` vid fotändarna. Det nedersta talet är alltså fotspannet, inte ramen.

Det löser inte Ø163 helt (150 mot 163 går inte att förena ur underlaget), och då
gäller regeln: **ange det tal som skyddar kunden.** Rensar någon 163 cm golv och
möbeln är 150 händer inget; rensar de 150 och den är 163 får den inte plats. Vi
skriver 163 och flaggar avvikelsen — vi gissar inte fram en förening.

### ⚠️ "Ett grönt jobb är inget kvitto" har ETT undantag, och det ska läsas fram

`polish-mapping.yml` i läget `las` gör `exit 1` både på `EJ AVGORBAR` och när
`stämmer` är falskt på en Aosom-rad. För DE raderna är ett grönt jobb därför ett
äkta kvitto på att prisgrinden höll.

Undantaget gäller bara för att jag **läste workflow-filen** och såg grenen. Det
tredje fallet — en icke-Aosom-rad — ger `::warning::` och `exit 0`, alltså grönt
utan att något bevisats. Regeln blir: *ett grönt jobb är ett kvitto när jobbet
är byggt att fela på exakt det du kontrollerar, och du har verifierat att det
är byggt så.* I alla andra lägen står husets regel oförändrad.

### ☠️ En landgrind är TVÅ regler — den samlade fällde åtta korrekta sidor (2026-09-05)

Live-kontrollen i runda 58 rapporterade **avsändarland på 8 av 8** minugnssidor.
Ingen av texterna nämner något land. Träffen var butikens EGEN stående rad, som
ligger på varenda produktsida:

> Skickas från EU-lager – ingen importtull eller förtullningsavgift.

Den är husets godkända formulering och namnger ingenting. Grinden var skriven
mot **min källtext**, där `skickas från` är ett varningstecken, och sedan
applicerad på **den renderade sidan**, där samma ord tillhör någon annan.

Regeln bor nu i två mönster i stället för ett:

| | gäller | var |
|---|---|---|
| `LAND_NAMN` | Tyskland, tysk, Kina, Polen, Spanien … | HELA sidan — ett landsnamn är fel var som helst |
| `LAND_FRAS` | EU-lager, skickas från, fraktas från | bara i text VI äger |

**Regeln bakom:** en grind ärver inte automatiskt sin giltighet när ytan byts.
Samma familj som runda 57:s kopierade rostfri-regel, men spegelvänd — där gled
två kopior isär, här flyttades EN regel till en yta den inte var skriven för.

### ☠️ Att avgränsa "vår text" med bara en STARTmarkör räcker inte

Första fixen ovan tog `sidan.split("Beskrivning")[-1]` som "vår region". Den
fällde fortfarande 8 av 8 — butikens **sidfot** har navlänken *"EU-lager & tull"*,
och sidfoten ligger efter beskrivningen.

Regionen bindes nu i BÅDA ändar av vår egen text: första 70 tecknen och sista 70
tecknen av det vi skrev, hämtade ur `texter.py`. Det är dessutom ett **starkare
kvitto än grinden var tänkt att vara**: står både första och sista meningen på
sidan har kunden fått exakt det lintet godkände, inte bara "något som inte
innehåller fel ord".

### ☠️ SKU:n RENDERAS INTE — en live-grind på den fäller varje korrekt sida

Samma körning rapporterade *"SKU:n syns inte i sidkällan"* på alla åtta. Mätt på
en sida som polerats i en TIDIGARE runda (`miniugn-32-liter`): **noll träffar på
`FP-`** i hela HTML:en. Butiken publicerar alltså inte artikelnumret alls.

Kvittot på SKU:n är API-återläsningen (`skuOk`), inte den renderade sidan. Det
som DÄREMOT går att mäta live är att **vårt eget faktakort ligger i galleriet** —
filens id ska stå i sidkällan. Den grinden ersatte SKU-grinden.

⚠️ Följdsatsen är värd att notera för de kvarvarande oöversatta SKU:erna: de är
osynliga för kunden. Det gör dem mindre brådskande, inte mindre fel — de går ut
i flöden och kvitton.

### ☠️ `fit_pane` beskär bort precis det kortets RUBRIK lovar

Tre av nio kort i runda 58 fick fel rubrik, och alla tre av samma orsak.
Källbilderna är **kvadratiska** (420 × 420); spec-panelen är 1416 × 776, alltså
1,8:1. `fit_pane` beskär källan till panelens proportion — och tar därmed bort
**45 % av höjden**. Det som låg i den bortskurna delen var kokplattorna på
topplattan och frityrkorgen bakom luckan, alltså exakt vad rubrikerna
*"36 liter, två plattor och grillspett"* och *"24 liter med frityrkorg"* pekade på.

Runbokens regel fanns hela tiden och lyder *"`fit=True` (`contain`) för
produktbilder så hela varan syns, `fit=False` (`cover`) bara för kontextfoton"*.
Felet var att köra `fit_pane` FÖRE den: en förbeskärning gör `contain`
meningslös, eftersom det som ska rymmas redan är bortkapat.

**Skicka kvadraten rakt in i `card_spec(..., fit=True)`.** Panelen brevlådar då
bilden i stället för att zooma in i den. `fit_pane` hör hemma på kontextfoton
som ska täcka panelen.

Ögongranskningen av kortarket är det enda som hittar det här — talen var gröna
i alla tre fallen.

### ⚠️ Två produkter i katalogen BAR redan samma SKU

Runda 57 härledde ur `lib/import/sku.ts` att färgsyskon kan få samma SKU. Runda
58 mätte det i drift: `2be44ec2` och `fc9c6885` — en 24-liters och en 10-liters
varmluftsfritös, olika produkter i olika prisklass — bar båda
`FP-minibackofen-mit-umluft`. Produktdelen kapas vid 24 tecken på hel ordgräns,
och de tyska sluggarna var identiska ända dit.

Grinden är `skugrind.py`: en Python-port av `buildVariantSkus` som räknar varje
planerad slug FÖRE den låses, och jämför mot både batchens övriga och de redan
publicerade syskonens SKU:er.

### ⚠️ En jämförelse mot en produktkategori vi inte MÄTER är ett påhittat tal

Två av åtta texter påstod *"36 liter är samma volym som en liten
inbyggnadsugn"* respektive samma sak om 32 liter. En liten inbyggnadsugn är
45–65 liter; påståendet var alltså fel, och det var fel i den riktning som
smickrar varan. Ingen mekanisk grind kunde se det — talet stod i spec-tabellen,
ordet var svenskt, meningen var välformad.

Grinden `JAMFOR_OMATT` fäller nu *"samma volym som"*, *"lika stor som"*,
*"samma storlek som"* och *"motsvarar en"*. Skriv i stället ut måttet:
*"Ugnsrymden är 38 × 31,5 × 31 centimeter"* säger mer och är sant.

Samma runda gav två grindar till av samma familj:

- `SORTIMENT` — *"den minsta varmluftsfritösen i sortimentet"* var sann när den
  skrevs och upphör att vara det nästa gång något mindre poleras.
- `MATTETIKETT` — se nästa avsnitt.

### ⚠️ Tyskans L/B/H är inkonsekvent i SAMMA dokument — etikettera inte ett ensamt mått

Pizzaugnens underlag skriver måtten två gånger, med olika bokstäver på samma tal:

```
✔ Kompakte Maße von 46B x 49,7T x 28H cm     (säljpunkten)
✔ Gesamtabmessungen: 46L x 49,7B x 28H cm     (Technische Daten)
```

Vilket tal som är BREDDEN går alltså inte att veta ur underlaget. Fyra texter
skrev ändå *"44 centimeter bred"*, *"35 centimeter bred"* och liknande.

`MATTETIKETT` fäller nu `<tal> cm bred|brett|djup|hög`. Skriv hela trippeln —
*"kåpan mäter 35 × 24,6 × 20 centimeter"* — som varken gissar eller döljer.
Undantaget är **diameter**, som bara har ett mått och därför inte kan förväxlas.

### ⚠️ Leverantörens ingress kan beskriva en ANNAN produkt

Niolitersugnens tyska ingress inleds *"Der Elektro-Minibackofen **mit
Kochplatten** ist die Antwort…"*. Ugnen har inga kokplattor: `Lieferumfang` är
ugn, grillgaller, bakplåt och anvisning, och effekten anges som ett enda tal
(750 W) utan plattornas watt. Meningen är klippt från ett syskon i samma serie.

Det är samma klass som `Lieferumfang` är kontraktet: **ingressen är
marknadsföring och kan vara någon annans.** Kontrollera varje funktionspåstående
i ingressen mot spec-blocket och paketinnehållet innan det översätts.

Sidan har nu en FAQ som förnekar plattorna rakt ut, och `lint.py` har en
negationsmedveten grind: ordet *kokplattor* får stå på den sidan bara i
förnekandet, aldrig i ett påstående.

### ⚠️ `bulk/categories/add-item` tar ETT item och MÅNGA kategorier

Inte tvärtom. En kropp med `categoryId` + `items[]` avvisas med 400 och en
felrad som namnger de riktiga fälten:

```
categoryIds has size 0, expected 1 or more · item must not be empty
```

Rätt form är `{ treeReference, item: { catalogItemId, appId }, categoryIds: [...] }`,
alltså en loop över PRODUKTER med båda kategorierna i varje anrop.

### ☠️ Ett ankare som korsar en radbrytning i en Python-sträng matchas inte

Korrekturskriptet i runda 58 dog tre rättelser in, på ett ankare som i
`texter.py` står som

```python
    "Torka av utsidan med fuktad trasa. Silverkåpan är lackerad metall och tar "
    "märken av skursvamp."
```

— alltså med `" \n    "` mitt i meningen. Ett rakt `s.count(ankare) == 1` ser
noll träffar, och assertionen sköt ner skriptet innan något skrevs. (Att den
sköt ner det är rätt; att den behövde göra det är slöseri.)

Fixen är generell och hör hemma i varje rättelseskript: bygg ankaret till ett
mönster där varje mellanslag också får matcha en strängbrytning.

```python
GRANS = r'(?:\s|"\s*\n\s*")+'
rx = re.compile(GRANS.join(re.escape(w) for w in ankare.split(" ")))
```

Samma runda gav också om den gamla lärdomen gratis: **ett `\n` i en vanlig
konkatenerad Python-sträng är ett syntaxfel**, inte en radbrytning. Skriptet föll
på `"…" \n "…"` och skrev ingenting alls — vilket är rätt utfall, men bara för
att skrivningen låg sist i filen.

### ☠️ Kategorikopplingens kvitto är EVENTUELLT KONSISTENT — läs inte tillbaka direkt (2026-09-05)

`bulk/categories/add-item` svarade utan fel på alla åtta produkterna, och
återläsningen i nästa anrop visade **en enda kategori** — `05e96cd6`
("All Products"), alltså den som importen själv satt. De två kökskategorier som
just skrivits fanns inte där.

Det ser exakt ut som en misslyckad koppling, och den frestande åtgärden är att
skriva om — vilket hade blivit en loop som aldrig blir klar, eftersom
skrivningen hela tiden fungerade.

Facit blev en produkt från FÖRRA rundan, kopplad på samma sätt och sedan länge
publicerad. Den bar alla tre. Alltså var det inte formen på anropet.

Isolerat efteråt, och det är hela poängen med att mäta i stället för att gissa:

| läsning | tidpunkt | kategorier |
|---|---|---|
| `GET /products/{id}?fields=DIRECT_CATEGORIES_INFO` | direkt efter skrivningen | **1** |
| `POST /products/query` med samma projektion | någon minut senare | **3** |
| `GET /products/{id}` med samma projektion | långt efteråt | **3** |

Tredje raden är den som avgör saken: **skillnaden var TIDEN, inte endpointen.**
Utan den hade lärdomen blivit "använd query i stället för GET" — en regel som
är fel och som hade gömt den riktiga.

Kvittot ska alltså tas efter propageringen, och en enda kategori i svaret
strax efter en skrivning är inget bevis på något. Referenspunkten som gör det
avgörbart på sekunder är en produkt från en tidigare runda: bär den sina
kategorier är formen på anropet rätt.

### ☠️ `MEDIA_ITEMS_INFO` gäller ÅTERLÄSNINGEN — en nolla där ser ut som raderade bilder

Runbokens projektionsfälla är gammal, men den bet på ett nytt ställe: i
**verifieringen**, inte i läsningen.

Publiceringens återläsning frågade efter `PLAIN_DESCRIPTION` och
`VARIANT_OPTION_CHOICE_NAMES` — och rapporterade `antalBilder: 0` på alla åtta
produkterna, minuter efter att galleriet skrivits och lästs tillbaka som
komplett.

Läst rakt av betyder den nollan "publiceringens `variantsInfo`-PATCH tömde
galleriet", och den naturliga reaktionen är att skriva om bilderna. Det hade
varit en riktig, förstörande skrivning mot ett korrekt tillstånd — utlöst av en
projektion som utelämnade fältet.

Mätt med `fields=MEDIA_ITEMS_INFO` i stället: 39 bilder, noll utan alt-text,
exakt de tal galleriskrivningen lämnade. Ingenting hade hänt.

**Regeln: en verifiering måste be om precis de fält den tänker döma på.** Ett
utelämnat fält och ett tömt fält ser likadana ut i ett svar — och det är i en
KONTROLL den förväxlingen kostar mest, för där leder den till en åtgärd.

### ⚠️ Färgsyskonens kort går inte att kvittera med ögat — bara med filnamnet

Sex av rundans åtta var färgsyskon till två modeller, fyra av dem samma
21-litersugn i gräddvit, svart, silver och grå. Två av källbilderna är
bevisligen **samma render omfärgad**.

Ögongranskningen av kortarket gäller fortfarande och är obligatorisk — den
fångar en rubrik som lovar något beskärningen tagit bort. Men den kan inte
avgöra det här: fyra kort med rubrikerna "Gräddvit", "Svart", "Silver" och
"Grå" ser rimliga ut i vilken ordning som helst, och ett förväxlat par är
osynligt.

Kvittot är mekaniskt i stället: varje korts foto är produktens EGEN huvudbild,
kontrollerat i kod mot bild→produkt-listan (01/06/11/16/21/26/31/36 i
`bilder.txt`). Samma grind fäller också om en bild hamnar i två gallerier.

**De två kontrollerna svarar på olika frågor.** Ögat: *visar fotot det
rubriken lovar?* Koden: *är det den här produktens foto?* Ingen av dem
ersätter den andra, och på färgsyskon är den andra den som räddar dig.

### ⚠️ Dubblett INOM ett galleri är inte dubblett MELLAN syskon

Bildplanen ville först stryka den grå ugnens närbild på den tända luckan, med
motiveringen att den är en omfärgad kopia av silverugnens.

Det är fel jämförelse. En kund ser **en** sida i taget, och den grå ugnens
interiörbild är en korrekt bild av den grå ugnen. Att stryka den hade gjort
sidan magrare än sitt syskon utan att göra den sannare.

Det som däremot ska strykas är en bild som dubblerar en ANNAN bild i SAMMA
galleri — här en miljöbild i samma kök, samma vinkel, som en annan redan
visade. Den ger kunden ingenting nytt att titta på.

Regeln: **avdubblera inom galleriet, inte mellan syskonen.** Syskonen ska se
lika kompletta ut, och de gör det just genom att var och en visa sin egen färg.

### ☠️ En kategorimätning på TYSKA huvudord kan inte se de publicerade sidorna (2026-09-05)

Urvalet till runda 60 räknade utkast per produkttyp med husets huvudordsregel
och fick fram en till synes tom kategori:

```
Wasserkocher: {utkast: 13, publicerade: 0}
```

Tretton utkast och noll publicerade — alltså fri bana. Det var fel, och felet
satt i mätningen, inte i katalogen.

**Regexen letade tyska huvudord. Publicerade sidor bär SVENSKA namn.** En
publicerad vattenkokare heter `Brödrost och vattenkokare i set – 4 skivor,
1,7 liter, grön` och kan per definition aldrig matcha `/^Wasserkocher/`.
Nollan mätte alltså ingenting: den var en garanterad nolla, inte ett fynd.

En andra sökning på det SVENSKA ordet hittade sidan direkt. Tolv av de tretton
utkasten visade sig dessutom vara samma produkttyp som den — brödrost- och
vattenkokarset, inte fristående kokare.

**Regeln: en kategorimätning är TVÅ sökningar, inte en.** Utkasten räknas på
det tyska huvudordet, de publicerade på det svenska. Ett tal som bara kan bli
noll är inget mått.

⚠️ Utfallet blev ändå att alla tretton fick poleras: den publicerade sidan är
en feed-import (`aosom:800-162V90GN`), och dubblettspärren nycklar på
artikelnumret — alltså kan ingen av de tretton vara samma artikel. Den är ett
FÄRGSYSKON, vilket är en länkmöjlighet och inte ett hinder. Men det visste jag
först efter att ha letat, och hade nollan fått stå oemotsagd hade tolv sidor
skrivits utan att någon jämfört dem med det som redan låg ute.

### ☠️ En grind kan uppfyllas av ett ord som betyder MOTSATSEN

Rundans farligaste påstående är koktiden. Leverantören skriver att kokaren
"bringt Wasser in nur 42 Sekunden zum Kochen" — utan att säga att det gäller
en kopp. 1,7 liter från 20 °C kräver ~569 kJ; vid 2200 W är det 259 sekunder.
42 sekunder kan alltså bara gälla en kopp, och utan det ordet är talet en lögn.

Grinden skrevs därefter:

```python
if "kopp" not in omkring.lower():
    fel.append("… '42 sekunder' utan att säga EN KOPP")
```

Den fällde aldrig. Mutationstestet visade varför: när "en enskild kopp" byttes
mot "vattnet" stod meningen **"sex till åtta koppar"** kvar i fönstret — och
`"kopp" in "koppar"` är sant. Grinden godkändes alltså av precis den mening som
säger raka motsatsen: att talet gäller hela kannan.

Lagningen är en ordgräns, `\bkopp\b`, som inte matchar "koppar". Testet gick
från 14/16 till 16/16.

**Regeln, i sin skarpaste form hittills: en delsträngsmatchning är ingen grind.**
Huset har lärt sig den två gånger förut — `Gelb` inne i "regelbundet" (runda 56),
ordet "fem" som stod tre gånger till (runda 59) — men det här är värre än båda,
för här var ordet som räddade grinden inte bara ovidkommande utan direkt
motsägande.

☠️ Och den hittades av mutationstestet, inte av att läsa koden. Grinden såg
riktig ut. **En grind som aldrig fällt är obevisad**, och det enda som skiljer
en obevisad grind från en trasig är att man kört mutationen.

### ⚠️ Ett kortvärde som FÖRKORTAR tabellen är en andra sanning

Kortgrinden fällde `3 min 15 s` mot spec-radens `3 minuter 15 sekunder`.
Ingen av dem är fel, och det är hela poängen: kortet hade blivit en andra
formulering av samma tal, som ingen grind jämför framåt. Nästa gång någon
rättar tabellen följer kortet inte med.

Regeln stod redan — *ett kortvärde ska citera den rad tabellen FAKTISKT har* —
men den var skriven mot PÅHITTADE värden. Det här är den tystare formen:
värdet är sant, bara omskrivet. RUBRIKEN får förkorta; VÄRDET ska citera.

### ⚠️ En SKU som är unik idag kan vara en framtida krock

SKU-regeln kapar produktdelen vid 24 tecken på hel ordsgräns. Sluggen
`vattenkokare-temperaturval-…` gav därför

```
FP-vattenkokare
```

— unik i katalogen just nu, och exakt den sträng vilken framtida runda som
helst med en vattenkokare återskapar. Runda 58 mätte upp två redan publicerade
produkter som bar samma SKU; det här är hur en tredje uppstår.

Sluggen lades om så att särskiljaren ryms inom 24 tecken
(`frukostset-temperaturval-…` → `FP-frukostset-temperaturval`). Det kostade
ingenting att göra före publicering och går inte att göra efteråt utan en
redirect.

**Regeln: läs SKU:n som en framtida granne skulle göra.** En SKU som beskriver
en produktKATEGORI i stället för en produkt är inte färdig, hur unik den än är
i dag.

### ☠️ Live-grinden fällde åtta korrekta sidor — cachen svarade som utkastet

Runda 60, Steg 14. Alla åtta nyss publicerade sidor gav **404**. Wix sa
samtidigt `visible: true` på exakt de slugarna, med rätt revision.

Svaret stod i huvudena, och det gick att läsa direkt:

```
HTTP/2 404
x-vercel-cache: STALE
age: 1410
```

Slugen svarade 404 medan produkten var **utkast** — det är rätt svar då — och
det svaret ligger kvar i ISR-cachen efter publiceringen. `STALE` betyder per
definition *det gamla svaret, medan omvalideringen pågår i bakgrunden*, och det
gamla svaret var alltså den 404 sidan hade i tjugotre minuter.

☠️ **Grindens gamla mönster kunde inte se det.** Den hämtade en gång "för att
beställa ombyggnaden" och mätte på den andra hämtningen. Omvalideringen är
ASYNKRON: den var inte klar mellan två curl-anrop i följd, så andra hämtningen
gav samma STALE-404 som den första. Mönstret hade fungerat i tidigare rundor
bara för att sidan då redan var byggd.

⚠️ **Och `?cb=` löser det INTE på produktsidan.** Det var den självklara fixen
och den fel. Uppmätt samma minut: en unik cb-parameter svarade `HIT age: 44` —
samma cache-rad, alltså ingår frågesträngen inte i nyckeln. Det som hjälpte var
att omvalideringen hunnit klart under tiden. Cache-bust-regeln i `CLAUDE.md`
gäller butikens API-rutter (`x-vercel-cache: MISS`), inte produktsidan, och att
läsa den som generell hade gett ett falskt kvitto: en 200:a som man tror kommer
förbi cachen men som kommer UR den.

`hamta()` väntar nu ut en STALE-rad (0/10/20/30/60/60/120 s) i stället för att
rapportera den. Tre grenar, och alla tre behövs:

| fall | vad som händer |
|---|---|
| STALE | hämtas om tills raden är färsk |
| färsk sida | exakt **en** hämtning, ingen väntan |
| ÄKTA 404 | fälls direkt, väntas inte ut i fem minuter per produkt |

`vantetest.py` bevisar dem med en stubbad hämtare — grinden kunde annars ha
"lagats" till att bara sova längre, vilket hade gjort en riktig 404 till fem
minuters tystnad per produkt.

**Regeln: en 404 direkt efter publiceringen är ett påstående om CACHEN, inte om
sidan.** Facit är butiken — `visible` och slugen i Wix — och grinden ska mäta
mot en FÄRSK rad. Det är samma familj som `jamforelsePris`: läs det kunden
faktiskt får, men läs det när det faktiskt är byggt.

☠️ **Och ORSAKEN mättes upp i runda 61: det var live-grindens EGEN förhandskörning
som la 404:an i cachen.** Runda 60 körde `live.py` mot utkasten INNAN publiceringen
för att bekräfta att de svarade 404 — en rimlig kontroll, och det var just den
hämtningen som cachade svaret i en timme. Runda 61 hoppade över förhandskörningen
och fick `200`, `x-vercel-cache: MISS`, `age: 0` på **alla sju sidor i första
försöket**. Två rundor, två utfall, en enda skillnad.

**Hämta alltså aldrig en produkt-URL medan produkten är utkast.** Att slugen
svarar 404 som utkast är redan bevisat av `visible:false` i Wix — kontrollen
tillför ingenting och kostar en timmes felaktig cache. Väntemekaniken ovan står
kvar som skyddsnät för de fall där någon annan hunnit begära adressen först.

### ☠️ En ISR-sida måste hämtas TVÅ gånger — den första är väckningen (2026-09-08)

Runda 102 rättade en text på alla tretton sidorna i massagefamiljen och körde
familjegrinden direkt efteråt. Den fällde **åtta av tretton**. Trettio sekunder
senare gav samma skript, mot samma sidor, utan en enda skrivning emellan,
**noll**.

De åtta var exakt de **redan publicerade**. Deras cache-post fanns kvar sedan
före textändringen; de fem nya hade fått sin post skapad efteråt och var färska
från start. Next.js svarar *stale-while-revalidate*: den första hämtningen får
den GAMLA sidan och startar omvalideringen i bakgrunden, den andra får den nya.

| hämtning | vad grinden såg |
|---|--:|
| första | 8 av 13 sidor "saknar" den nya texten |
| andra, 30 s senare | **0 av 13** |

**Regeln: läs aldrig utfallet av den första hämtningen efter en skrivning.**
Hämta, kasta svaret, hämta igen — eller läs `age` och `x-vercel-cache` och
förkasta allt som inte är färskt. En grind som dömer på första svaret gör
precis runda 60:s misstag: den fäller korrekta sidor, och ett larm som fyrar
på varje korrekt sida lär mottagaren att sluta läsa.

⚠️ **Och cache-bust i query-strängen hjälper INTE.** `?cb=<tidsstämpel>` gav
samma cachade svar: Next.js ISR nycklar på RUTTEN, inte på okända parametrar.
Uppmätt samma dag på fem nypublicerade sidor — `x-vercel-cache: HIT` med
cache-bust, och 404 i femton minuter tills posten gick ut av sig själv
(12:19 → 0/5, 12:25 → 3/5, 12:27 → 5/5).

### ☠️ …och TVÅ räcker inte heller — andra hämtningen kan vara STALE (2026-09-11)

Kortsvepet över runda 121–127 (53 publicerade sidor genom `grindar.kortfel`)
gav **två fel**. Båda var falska, och båda bar samma sak i samma rad:

| sida | svepets dom | cache-rad | omhämtning en minut senare |
|---|---|---|---|
| `verktygslada-49-cm-fyra-ladar-orange` | SAKNAR EGET KORT | **`STALE`** | `HIT age=179`, **0 fel** |
| `verktygsvagn-83-cm-tre-plan-verktygshal` | SAKNAR EGET KORT | **`STALE`** | `HIT age=24`, **0 fel** |

☠️ **Noll av 53 fel var på sidan.** Korten satt där hela tiden; det var
`hamta_isr` som dömde på ett svar den själv redovisade som inaktuellt.
Funktionen gjorde två hämtningar med paus emellan — vilket är runda 102:s
regel, ordagrant — men den **läste aldrig `x-vercel-cache` på den andra**.
Är ombyggnaden inte klar då är det gamla svaret fortfarande det som kommer.

Runda 60 skrev redan ned väntemekaniken (`0/10/20/30/60/60/120 s`), men den
bodde i den rundans egen `live.py`. Den delade modulen ärvde bara
tvåhämtningsregeln. Husets vanligaste bugg, en gång till: **en regel som
flyttas till en delad modul måste flytta HEL.**

✅ `hamta_isr` väntar sedan dess ut en STALE-rad (`stale_forsok`, växande
paus) i stället för att rapportera den. De tre grenarna är oförändrade — en
färsk rad kostar ingen extra hämtning, en äkta 404 kastar direkt.

☠️ **Och självtestet som skulle bevisa det kunde inte fälla.** De tre nya
fallen skrevs som VÄRDEjämförelser (`lambda: h["x-vercel-cache"], "HIT"`) —
och `_sjalvtest` `bool()`:ar båda sidor, med flit, så att en grind får svara
med en Match, en lista eller `None`. `bool("HIT") == bool("STALE")`, alltså
var alla tre fallen sanna oavsett vad koden gjorde. Mutationstestet
(borttagen STALE-väntan) gav **grönt på alla tre**.

Två lagningar, och den andra är den som håller framåt:

1. Jämförelsen flyttad IN i lambdan, så `bool()` blir harmlös.
2. `_sjalvtest` **vägrar ett fall vars väntade värde inte är en riktig bool**
   och säger varför. Det skiljer "fyrade grinden?" (väntat värde ÄR en bool,
   svaret får vara vad som helst) från "är värdet X?" (meningslöst under
   `bool()`). Mätt: 20 befintliga fall svarar med Match/lista/None mot ett
   bool-väntat värde — de är i sin ordning och berörs inte.

Tre mutationer, tre rätt fällda fall och inget annat:

| mutation | vilket fall som föll |
|---|---|
| STALE-väntan borttagen | `STALE väntas ut tills raden är färsk` |
| väntan utan brytvillkor (sover alltid) | `färsk rad kostar INGEN extra hämtning` |
| ett fall skrivet som värdejämförelse igen | harnessets egen vägran |

**Regeln: ett självtestfall som jämför ett VÄRDE måste bära jämförelsen själv
— annars är det en grind som aldrig kan fälla.** Samma familj som
delsträngsmatchningen som godkändes av ordet den motsades av.

### ✅ Live-grinden kan kontrollera VARJE MENING ordagrant — och den bet (2026-09-07)

Tidigare rundor jämförde live-sidan påstående för påstående med ögon. Runda 94
gjorde det mekaniskt i stället, och det är den kontroll som stänger hålet i
avsnittet om transkriberingen ovan:

```python
kalla = synlig(T.beskrivning(pid))              # vår egen fil
var   = var_del(synlig(live_html))              # sidans beskrivningsdel
for mening in re.split(r"(?<=[.!?]) ", kalla):
    if len(mening) >= 45 and mening not in var:
        brister.append("saknas ordagrant: %r" % mening[:70])
```

Wix skriver om markupen men rör inte den synliga texten, så en jämförelse på
tagg­strippad text stämmer exakt. Tröskeln 45 tecken hoppar över rubriker och
korta etiketter, som återkommer i sidans chrome.

☠️ **Grinden är MÄTT, inte skriven.** Den kördes mot samma sida två gånger: en
gång mot källfilen (0 brister) och en gång mot källfilen med rundans faktiska
felstavning återinförd. Den senare föll på rätt mening:

```
ratt text (som den ar nu)        0 brister
med felstavningen ateriniford    FALLER: 'Duken är 298 × 298 cm och den
                                          snedställda kanten 218 cm — mät båda…'
```

### ☠️ …men grinden fällde först alla fyra KORREKTA sidor

Första versionen läste hela sidan och gav två brister per produkt. Båda var
butikens egna:

| grinden sa | vad det var |
|---|---|
| `avsandarland: 'skickas från'` | EU-lager-ribbonen: *"Skickas från EU-lager – ingen importtull eller förtullningsavgift"* — den enda sanktionerade platsen |
| `dubblerade alt-texter (13/19)` | Klarna ×3, Mastercard ×2, Amex ×2, Apple Pay ×2, plus hjältebilden som står både som huvudbild och som galleripost |

**Två avgränsningar räckte, och båda är principiella:**

1. **Landgrinden läser bara BESKRIVNINGSDELEN** — från rubriken `Beskrivning`
   till syskonkarusellen. Utanför den ägs texten av butiken, inte av poleringen.
2. **Alt-grinden kräver att VÅRA FEM alt-texter finns och är inbördes olika** —
   inte att sidans samtliga `alt`-attribut är unika. Betalningslogotyperna
   kommer alltid att upprepas.

Samma lärdom som runda 60 och som token-förnyelsens 48-timmarsvarning: **en
grind som fyrar på varje korrekt sida lär mottagaren att sluta läsa.**

### ✅ Live-grindens grind: FACIT PÅ LIVE-SIDAN, inte en längre ordlista

Runda 62, Steg 14. Live-grinden hade vuxit till fjorton ordlistor och regex —
tyska ord, medicinska påståenden, superlativ, husmärken, landsnamn, artikel-
nummer. Var och en fångar ett fel någon en gång kom på. Ingen av dem svarar på
den fråga steget faktiskt ställer: **är texten kunden ser den text som passerade
lint?**

Det går att svara exakt, och det kostar ingenting. `facit.json` bär redan längd
och hash av den synliga texten. Skär ut samma region ur den hämtade sidan —
bunden i BÅDA ändar av beskrivningens första och sista sjuttio tecken — och
jämför. Stämmer båda talen håller **varje** regel lint körde, per konstruktion
i stället för per uppräkning.

Mätt först, grind sedan. Alla åtta gav `lika`:

| id8 | slug | kod | cache | bilder | text | mot facit |
|---|---|--:|---|--:|--:|---|
| 67bd3628 | gungande-knastol-ljusgra | 200 | MISS | 5/5 | 2466 | lika |
| b97ac1d8 | gungande-knastol-gra | 200 | MISS | 5/5 | 2436 | lika |
| b5d8eb9c | gungande-knastol-kram | 200 | MISS | 5/5 | 2392 | lika |
| 6d64de9b | knastol-bjork-kram | 200 | MISS | 5/5 | 2153 | lika |
| 9d626528 | knastol-bjork-morkgra | 200 | MISS | 5/5 | 2208 | lika |
| c3e0af3f | knastol-bjork-bla | 200 | MISS | 5/5 | 2130 | lika |
| 05cc1f9c | knastol-bjork-svart | 200 | MISS | 5/5 | 2107 | lika |
| 9e656e81 | knastol-bjork-ljusgra | 200 | MISS | 5/5 | 2137 | lika |

Butiken renderar alltså beskrivningen ordagrant: ingen "Läs mer"-avkortning,
ingen omskrivning utöver den blankteckenkollaps facit redan gör.

☠️ **Längden ensam duger inte — hashen är det som biter.** Verifierat genom att
mutera den HÄMTADE sidkällan: `120 kg` → `130 kg` är **samma antal tecken**, och
en längdjämförelse släpper igenom den. Hashen fäller. Det är precis den sorts
fel poleringen producerar (en siffra som glidit), inte den sort som ändrar
textmassan.

⚠️ **Ordlistorna tas ändå INTE bort.** De läser det som ligger UTANFÖR regionen
— produktnamnet, avsnittsrubrikerna, artikelnumret var som helst på sidan — och
där finns inget facit att jämföra mot. Facit bevisar beskrivningen; listorna
bevakar resten.

☠️ **Och landgrinden måste delas, annars fäller butikens egen chrome.** `LANDER`
i lint innehåller både landsnamn och lagerfraser. Butikens sidhuvud säger
"Skickas från EU-lager" — butikens text, inte vår. Delningen härleds ur listan i
stället för att skrivas om (`"lager" in l.lower()`), så ett land som läggs till i
lint hamnar automatiskt i rätt hink. Att kopiera regeln i stället är runda 57:s
fel: en live-grind med en egen kopia av en regel utan dess undantag fällde åtta
korrekta sidor.

✅ **Kvitto på cache-regeln, andra gången.** Alla åtta gav `MISS`, `age: 0`,
ingen väntan alls — därför att ingen av slugarna hämtades medan produkten var
utkast. Runda 60 (som förhandskörde grinden mot utkasten) fick `404 STALE` på
alla åtta; runda 61 och 62 (som inte gjorde det) fick rent på första försöket.
**Regeln är alltså inte "vänta ut cachen" utan "förgifta den aldrig"** — väntan
är reparationen, inte skyddet.


### ✅ ExecuteWixAPI svarar igen — och grinden mot handtranskriberingen finns nu (2026-09-07)

Verktyget gav **403 på varje anrop** i flera rundor. Runda 95 provade om det, och
det fungerar. Det är inte en bekvämlighet: 403:an VAR mekanismen bakom runda 94:s
`yttterm ått`. Bara `CallWixSiteAPI` gick att använda, alltså skrevs JSON-kroppen
för hand ur filen, och den kopieringen var ogrindad.

Med kod tillbaka går hela skrivningen att grinda i **samma anrop**:

```js
const skickadHash = hasha(synlig(d.html));
if (skickadHash !== d.facit) { avbryt(); }        // ← FÖRE skrivningen
await wix.request({ method: "PATCH", ... });
const r = await wix.request({ method: "GET", url: ".../products/" + id + "?fields=PLAIN_DESCRIPTION" });
return { lastHash: hasha(synlig(r.product.plainDescription)), facit: d.facit };
```

☠️ **Grinden måste ligga FÖRE skrivningen, inte bara efter.** Bara en återläsning
hade också fångat felet — men efter att sidan redan burit det. Före-hashen gör
produkten till en no-op i stället: skiljer transkriberingen sig från filen skrivs
ingenting alls för just den produkten, och de andra i samma anrop går igenom.

Hashen är husets vanliga: taggbefriad, blanksteg-normaliserad synlig text, sedan
`h = (h*31 + kodpunkt) % 1000000007`. Den fungerar identiskt i Python och JS för
BMP-tecken (`×`, `²`, `—`, `å ä ö`) — och regel 18 i lintet garanterar att ingen
emoji smiter in, vilket är det enda som hade fått `codePointAt` och Pythons
`ord()` att glida isär.

Runda 95: **fyra av fyra `stammer: true` på båda sidor om skrivningen.**

### ☠️ `list-categories-for-item` har INGEN `categories`-array

Svaret bär `directCategoryIds` och `allCategoryIds` — inget annat. En läsning av
`r.categories` ger `[]`, och det ser ut som en produkt utan kategorier.

Uppmätt 2026-09-07 på `df5a7190`, en sida som bevisligen ligger i två löv:

| läst fält | svar |
|---|---|
| `r.categories` | `[]` |
| `r.directCategoryIds` | `["5d75e733…", "05e96cd6…", "653ab052…"]` |

Nionde gången samma familj som `MEDIA_ITEMS_INFO` och `PLAIN_DESCRIPTION`: **ett
fält som inte finns syns som ett tomt värde, inte som ett fel.** Här hade det
gjort Steg 10 blind — "noll kategorier" på en produkt som redan ligger rätt.

⚠️ Och asymmetrin fortsätter: `?fields=VARIANTS_INFO` är INTE en giltig
projektion. V3 svarar `400 Failed to parse JSON or deserialize protobuf message`.
`variantsInfo` kommer i standardprojektionen och ska inte efterfrågas — tvärtemot
`MEDIA_ITEMS_INFO`, som MÅSTE efterfrågas. Mät varje fält, härled inget.

### ☠️ Leverantörens egen URL är en TREDJE källa om färgen

Runda 95 hade två produkter där källan säger fel färg, och pixlarna sa emot:

| id8 | tyska fältet | mätt RGB | HSL | `sourceUrl` säger |
|---|---|---|---|---|
| `b6ebc5ba` | **Kohlegrau** | 24, 72, 36 | H 135°, L 19 % | `…partyzelt-**grun**` |
| `ef0a812d` | namnet **Kaffee** | 180, 36, 0 | H 12°, L 35 % | `…3x4m-**terra**` |

Pixelmätningen ensam är ett omdöme ("är L 19 % mörkgrönt?"). URL:en är
leverantörens EGEN klassificering, den ligger i mappningsraden, och den kommer
gratis med `las`-läget i prisgrinden. **Läs `sourceUrl` i Steg 3, inte bara
priset** — den avgör en färgtvist på en sekund, och den fällde två av fyra
etiketter den här rundan.

### ☠️ Två "färgsyskon" som inte delar EN enda mått-rad

`b6ebc5ba` och `271327e1` är samma produkttyp, samma storleksklass, samma
leverantör, importerade en minut isär. De ser ut som ett färgpar. De är det inte:

| vad | `b6ebc5ba` | `271327e1` |
|---|---|---|
| lilla taket | **88 × 88 cm** | **86 × 86 cm** |
| snedställd kant | 174 cm | — |
| öppning | — | 68 × 68 cm |

En talvitlista per GRUPP hade släppt igenom grannens mått i den egna
spec-tabellen utan ett ljud — talet står ju på "sidan". **Vitlistan ska vara per
PRODUKT**, och korslänken ska säga att måtten skiljer sig, inte att duken är
densamma. Mutationstestet fick sex egna fall för just det bytet.

### ☠️ Runbookens EGEN notation läckte in i en säljande mening

Utkastet till syskonlänken bar `⚠️ Måtten på det lilla taket skiljer sig…` —
varningstecknet kopierat rakt ur den här filen in i kundtexten. Ingen befintlig
regel såg det: tecknet är varken tyskt, ett tal, en färg eller ett husmärke.

Regel 18 i lintet fäller `[⚠☠✅❌✓✗️]` och `TODO` i namn, SEO, kort och HTML.
Samma runda fick en tvilling: **"det säger tillverkaren själv i klartext"** —
`leverantören` var grindat sedan länge, `tillverkaren` inte. Båda skjuter
påståendet på en part kunden inte kan fråga. Grinden tar nu
`leverantör|tillverkar|fabrikant|importör`.

### ⚠️ Tysk text i bilden sitter inte alltid ÖVERST

Runda 94 toppkapade måttritningen. Runda 95 hade fyra ritningar av samma slag och
**en av dem var tvärtom**: ren ritning med cm-mått överst, tysk `HINWEIS`-ruta
under. Den bottenkapades till 55 % i stället.

| bild | vad | kapning |
|--:|---|---|
| 2 | banderoll över himlen/väggen | topp 15–25 %, hela paviljongen kvar |
| 3 (tre av fyra) | tysk rubrik + tre rader, ritning under | topp 34–35 % |
| 3 (`271327e1`) | ren ritning, tysk ruta under | **botten till 55 %** |

**Titta på bilden innan du väljer riktning.** Ett toppkap på den fjärde hade
kastat bort exakt de mått sidan bygger på och behållit den tyska rutan.



### ☠️ Artikelnumrets BAS är modellen, suffixet är färgen

Runda 61, sju frukostset. Att avgöra vilka som är färgsyskon tog i runda 59 en
jämförelse av tysk brödtext, mått och bilder — och bilderna ljuger, för
syskonbilderna är samma render omfärgad.

Aosoms artikelnummer avgör det gratis:

| bas | suffix | produkt |
|---|---|---|
| `800-287V90` | **CW** / **BK** | gräddvitt och svart set, båda nya |
| `800-286V90` | **CW** / **BK** | grädde och svart set, båda nya |
| `800-181V90` | **BK** / **PK** | den PUBLICERADE svarta och det rosa utkastet |

Suffixet matchade tyskans `Farbe`-fält i **sju fall av sju** (GY = Grau,
CW = Cremeweiß, BK = Schwarz, PK = Rosa) — mätt, inte antaget. Måtten och
effekterna bekräftade varje par oberoende.

**Regeln: läs basnumret först.** Det svarar på syskonfrågan innan en enda bild
öppnas, och det är den enda källan som inte kan omfärgas.

⚠️ **En NAMNKROCK bevisar däremot ingenting.** Två av utkasten bar identiskt
tyskt namn — Wix la på `-2` i den andra sluggen — och var ändå helt olika
produkter: 5,3 kg fyrskivsrost mot 3 kg tvåskivsrost.

### ☠️ Importen skapar SKU-krockarna själv — sju utkast bar EN SKU

Före publiceringen bar alla sju utkasten samma SKU:

```
FP-wasserkocher-und-toaster
```

Det är inte ett poleringsfel. Alla sju hette `Wasserkocher- und Toaster-Set …`
på tyska, och SKU-regeln kapar produktdelen vid 24 tecken på hel ordsgräns —
alltså blir varje set i familjen samma sträng. Uppgift #272 mätte elva SKU:er
delade av 24 PUBLICERADE produkter och läste det som något poleringen orsakar.
Det stämmer bara till hälften: **poleringen ÄRVER en krock som importen redan
skapat**, och rättar den bara om den nya sluggen är tillräckligt särskiljande
inom de 24 tecknen.

**Följden: en opolerad familj är per definition en SKU-krock.** Katalogsvepet
(`search-variants`, 7 sidor, 6 441 varianter, 4 915 distinkta SKU:er) är därför
inte en lyx utan det enda som skiljer "unik" från "unik just idag".

### ☠️ Skräpet i bilderna är ENGELSKT lika ofta som tyskt

`CLAUDE.md` mätte 46 % tysk text inbränd i Aosom-bilderna, och grinden har sedan
dess letat efter tyska ord. I runda 61 var fem av tretton spärrade bilder
**engelska**: `Family-size`, `3.5CM WIDE SLOT`, `Crumb Tray`, `7 Cups`,
`Limescale Filter`. En grind som bara känner tyska hade släppt igenom dem alla.

**Regeln är UTLÄNDSK text, inte tysk text.**

⚠️ Två gränsdragningar som håller:

- En **måttritning utan ord** behålls (bara siffror). Samma ritning med
  `Family-size` eller `7 Cups` på gör den obrukbar.
- **Text som sitter FYSISKT på varan** — knapparna `CANCEL` / `REHEAT` /
  `DEFROST` på brödrosten — är varan, inte pålagd grafik. Den bilden behålls;
  det är bakgrunden bildpoleringen rör, aldrig varan.

### ☠️ Ordlistan fällde fyra korrekta texter — på ett svenskt ord

`Kalkfilter` lades in bland de tyska orden. Det är också ett fullkomligt vanligt
svenskt ord, så linten fällde fyra egna, korrekta texter.

Kommentaren överst i `lint.py` varnar uttryckligen för precis det (Grill, Timer,
Metall, Glas, Rost, Filter, Tablett, Dörr) — och listan ÄRVS och VÄXER varje
runda. **Varje nytt ord måste prövas mot svenskan innan det läggs in**, annars
blir grinden en falsklarmsmaskin och nästa runda lär sig att stryka rader ur
den i stället för att läsa dem.

### ☠️ En antalsgrind behöver BÅDA halvorna

Rostlägena hade två regler — rätt tal måste stå där, fel tal får inte stå där.
Fackantalet hade bara den första. Mutationstestet bytte `fyra separata fack` mot
`två separata fack` och grinden **fällde inte**: ingressen sa fortfarande
"fyra fack", så kravet var uppfyllt medan texten motsade sig själv.

En text som säger fyra på ett ställe och två på ett annat är värre än en som
säger fel överallt — den ser granskad ut. **Kräv rätt tal OCH förbjud fel tal.**
Testet gick från 24/25 till 26/26 när den negativa halvan kom på plats.

⚠️ Och mutationen var för svag från början. **En mutation som inte tar bort
påståendet prövar ingenting** — samma fälla som runda 59:s "fem" som stod tre
gånger till.

### ⚠️ Ett tal som är identiskt över flera artikelnummer mäter ingen av dem

`3 Min. 15 Sek. bis zum Sieden` står på en marknadsföringsbild som dök upp på
`800-287V90CW` och `800-286V90BK` — två olika modeller med olika kokare — och
som runda 60 mötte på en tredje. Samma bild, samma tal, olika produkter.

Det är alltså en mall, inte en mätning, och får inte lyftas in i någon text.
Grinden fäller på den.

### ⚠️ Ett bulk-anrop som "lyckas" kan ha misslyckats med allt

Kategorikopplingen kördes först med UUID:n som gissats ur åttateckensprefix.
Anropet **kastade inte** — det svarade 200 med

```
bulkActionMetadata: { totalSuccesses: 0, totalFailures: 2 }
```

sju gånger i rad. Utan att läsa räknarna hade sju produkter publicerats
okategoriserade med grönt kvitto. Slå upp kategori-id:na med
`categories/query` och **läs alltid `totalSuccesses`**.

### ☠️ Kortgrinden läser tal, inte pixlar — så FOTOT måste läsas av ögon

Två faktakort i runda 55 bar **läsbar kyrillisk läkemedelsförpackning** ("Ферталь") mitt i
bild, i skarp fokus. Varje mekanisk grind var grön: talen stämde mot spec-tabellen, filerna
låg under taket, rubrikerna beskrev fotona.

Det är samma klass som leverantörens tyska band — text i pixlarna som inte kan visas för en
svensk kund — men den upptäcks bara av att **titta på kortet**. Utvägen är runbokens
vanliga: byt till produktens studiobild (157–159 kB vid q=94 mot 207 kB vid q=88), och låt
inte de bilderna följa med i galleriet heller.

### Verifiera på den renderade sidan — men läs cache-huvudena

☠️ **Läs `<title>` och `<meta name="description">`, inte bara brödtexten.** Sidans huvud och
sidans kropp kommer från **två skilda fält** — `seoData` respektive `plainDescription` — och
kan mycket väl vara på olika språk. Fyra bänkar i batch 55 (2026-09-02) gick igenom hela min
kontrollistan och låg ändå ute med tysk titel:

| Kontroll | Utfall |
|---|---|
| HTTP-status | 200 |
| `<h2>`-räkning | 7 — *ärvt tal, se ovan* |
| Priset oförändrat | ja |
| Fyndplats-kortet på plats 3 | ja |
| Leverantörsspår i brödtexten | noll |
| **`<title>` / `og:title` / meta-beskrivning** | **`Polsterbank, Vintage-Design, 2 Kissen…` + `Entdecken Sie die…`** |

`<title>` är dessutom det ENDA av de sex Google visar i träfflistan. En sida som klarar allt
utom det är alltså rätt i precis den del ingen ser först.

Orsaken var att PATCH-kroppen saknade `seoData` (Steg 7 föreskriver den — se PATCH-formen
där). Färgtrion i samma batch fick den och renderade svenskt direkt; de fyra som saknade den
ärvde leverantörens tyska namn. **Grinden är att kontrollen läser huvudet, inte att man
kommer ihåg fältet** — en kontroll som bara läser kroppen kan aldrig fälla det här felet,
hur många gånger den än körs.

Minimikommandot:

```bash
curl -s "https://www.fyndplats.se/produkt/<slug>" \
  | grep -oE '<title>[^<]*</title>|<meta name="description" content="[^"]{0,80}'
```

⚠️ **Rättar du `seoData` i efterhand ligger den gamla titeln kvar i butikens ISR-cache**
(`revalidate=3600`). En frågesträng bustar den inte. Kontrollera mot Wix att fältet är rätt,
och läs om sidan senare — se cache-avsnittet nedan.

☠️ **HUVUDET och KROPPEN cachas var för sig — och de kan drifta isär i SAMMA svar.**
Uppmätt 2026-09-04, tolv minuter efter en rättelse som rörde både `plainDescription` och
`seoData` på samma produkt:

| | vad sidan visade |
|---|---|
| `<meta name="description">` | `tre fack på 22, 22 och 16 cm` — **gammal** |
| brödtexten | `tre fack med höjderna 22 / 22 / 16 cm` — **ny** |
| `age` / `x-vercel-cache` | 23 s / `HIT` |

Wix bar rätt text i BÅDA fälten vid samma tidpunkt (`seoData.tags[meta].content` och
`seoDescription`, båda lästa direkt). Sidan var alltså inte "gammal" — den var till hälften
gammal, och `age: 23` sa ingenting om vilken halva.

Konsekvensen: **att brödtexten är rättad är inget bevis för att huvudet är det.** En
kontroll som ser den nya kroppen och drar slutsatsen "rättelsen gick igenom" missar precis
det fält Google visar i träfflistan. Verifiera huvudet mot **Wix**, inte mot sidan, och läs
om sidan senare.

🔍 **Svepa hela katalogen efter tyska rester:** läs `seoData`-taggarna `title` +
`meta description` för varje `visible`-produkt via `products/search` (markörsidor om 100) och
testa mot en lista tyska ord. Mätt 2026-09-02 efter rättningen: **1 597 publicerade produkter,
noll tyska titlar, noll utan titel.**


⏱️ **ISR-fönstret är 300 s.** En re-GET mot Wix bevisar inte att butiken hunnit med.

☠️ **Hämta ALDRIG sidan i samma andetag som publiceringen.** Wix slug-index ligger några
sekunder efter skrivningen; hinner butiken före indexet renderar den sin fallback, och just
det svaret sparas i fem minuter. Sidan ser trasig ut fast produkten är korrekt.
*(Sängbänken `8da26d68` 2026-08-26: publicering och `curl` låg under en sekund isär.)*

⚠️ **Hämta sidan från `www.fyndplats.se`, inte från apex.** `fyndplats.se/produkt/<slug>` svarar
**308** mot www-värden, så ett `curl` utan `-L` ger en tom kropp och varje grep säger noll —
vilket läser som att sidan är trasig. Använd `https://www.fyndplats.se/produkt/<slug>`.

**Läs `date`, `age` och `x-vercel-cache` innan du drar en slutsats:**

- `date` äldre än din skrivning → svaret är per definition inaktuellt.
- Varje edge-nod har sin egen cache, så en `HIT` med gammalt innehåll kan vara en nod som
  släpar efter medan en annan redan är rätt.
- Är `age` STÖRRE än `x-nextjs-stale-time` och svaret ändå oförändrat är det **inte** cachen
  som är förklaringen — sluta vänta och leta någon annanstans.
- En frågesträng (`?x=1`) bustar inte cachen.

Vill du veta om datan är rätt utan att röra butiken, fråga Wix samma fråga som butiken:

```
POST /stores/v3/products/query
{ "query": { "filter": { "slug": {"$eq":"<slug>"}, "visible": {"$eq":true} } } }
```

Kommer produkten tillbaka är allt rätt och det enda som återstår är att vänta.

⚠️ **En NYSKAPAD KATEGORI serveras inte alls av butiken** — och felet ser ut som en 307 mot
`/butik`, inte en 404. Kategorin `Terrassvärmare & Infravärmare` var korrekt i Wix
(`visible: true`, `itemCounter: 2`) men fungerade inte på sajten, och syntes inte heller i
navigationen på `/butik`. Butikens kategorilista uppdateras alltså inte av sig själv; varför
går inte att avgöra härifrån, eftersom rutten ligger i `fyndplats-headless`. **Lova aldrig
att en ny kategori fungerar förrän du sett en 200.** Produkterna påverkas inte — de bär
förälderkategorin, som fungerar.

### Sist: nollställ poleringsflaggan

`needsAiPolish: false` och `draftStatus: "published"` på mappningsraden, annars kommer
produkten tillbaka i kön. Passa på att skriva mappningens `variants[].sku` till den nya
svenska SKU:n — Steg 8 rör bara Wix-sidan, och en kvarlämnad engelsk SKU i mappningen är en
tyst drift som senare svep går bet på.

Använd workflowen **Polering — läs och stämpla mappningsraden**, läge `stampla`:

| fält | värde |
|---|---|
| `wix_product_id` | produktens id |
| `needs_ai_polish` | `false` |
| `draft_status` | `published` |
| `variant_skus` | `{"<wixVariantId>":"<ny-sku>"}` — tomt om SKU:n inte ändrats |

☠️ **Ett tomt fält betyder numera "rör inte", och det gör det på riktigt.**
Fram till 2026-09-02 hade `needs_ai_polish` och `draft_status` defaultvärdena
`false` och `published` — och GitHub ersätter ett tomt värde med defaulten, så
en stämpling som bara ville skriva SKU:er **publicerade produkten på köpet**.
Defaulterna är tomma nu; vill du publicera måste du skriva `published` själv.

☠️ **`wixVariantId`, inte variantens SKU eller position.** Ett id som inte
finns på raden avvisas med `422` och **ingenting skrivs** — inte heller de
andra fälten i samma patch. Hämta id:t ur `las`-utskriftens `mappning`. Ett
felstavat id hade annars gett en variant utan SKU, och Aosom-prissynken matchar
Wix-varianten på just det fältet.

☠️ **Skriv INTE hela raden längre.** Den gamla mekaniken (`items/save` med allt
du inte ändrat) hade två fel som båda blev värre efter migreringen: ett glömt
fält var en tyst radering, och kollektionen är numera tömd så anropet skulle
SKAPA en föräldralös rad och rapportera framgång.

Rutten tar därför bara de tre fält poleringen äger. Kostnads-, pris- och
leverantörsfält går inte att röra härifrån — de avvisas med `400` och en rad som
säger vilket fält som inte var skrivbart. Den **skapar heller aldrig** en rad:
saknas mappningen svarar den `404`, för då är produkten föräldralös och ska
tittas på av en människa, inte poleras.

-----

## Steg 14 – Recensioner

**För en Aosom-produkt finns inga att hämta.** Hämtaren är byggd, testad och ligger på main
(`lib/aosom/reviews.ts`, `lib/aosom/review-run.ts`, `/api/cron/aosom-reviews`) — men den ger
ingenting. Aosoms produktsidor ligger bakom Akamai Bot Manager, som fingeravtrycker klientens
TLS/HTTP2: med **identiska headers** får `curl` `200` och Node:s `fetch` `403`. Rutten
behandlar därför `403` som terminalt (`BOT_BLOCKED`, räknas skilt från `failed`) och stannar
själv efter tre i rad — spärren gäller klienten, inte varan.

Vägen framåt är en källa Aosom tillåter; deras B2B-guide erbjuder API-integration *"after a
few months of successful collaboration"*. Att kringgå spärren skulle kräva att vi förfalskar
en webbläsares TLS-fingeravtryck, och den signalen går vi inte runt. **Hoppa över steget.**

För en **AliExpress**-produkt, kört direkt efter publiceringen:

```
POST https://fyndplats-cache-warmer.vercel.app/api/reviews/import
x-fyndplats-token: {EXTENSION_API_TOKEN}
{ "wixProductId": "{PRODUCT_ID}" }
```

Utelämnas `reviews` hämtar rutten själv. Anropet är **gratis**. Utan token svarar den
`401 {"error":"Otillåten"}` — lätt att läsa som "produkten saknar recensioner".

> **Produkten är INTE klar när svaret säger `imported: 12`.** Raderna sparas som
> `status: "pending"` och är **osynliga för kund** tills någon skrivit om dem på svenska.
> Det är avsiktligt: alternativet vore engelska omdömen på en svensk produktsida. Säg till
> Leonard att det ligger nya rader i kön.
>
> `imported: 0` är ett giltigt utfall — ~40 % av katalogen saknar recensioner. Hämtningen
> görs om automatiskt efter 30 dagar. Är `bildmissar` > 0 kunde vi inte flytta hem alla
> kundbilder just då; de lagas av en senare `repairImages`-körning.

### Skriva om dem till svenska

Statusarna: `pending` (importerad, osynlig) → `edited` (**publikt synlig**) · `approved`
(äldre, redan svenska) · `rejected` (avvisad med skäl i `rejectReason`).

1. **Skriv om varje `pending` till naturlig svenska** och sätt `status: "edited"`. Originalet
   ligger kvar i `textOriginal`; din text i `textSwedish`.
2. **Kritik översätts ordagrant.** En sida med bara femmor läser som förfalskad.
3. 🔒 **Filtret är produkt kontra transaktion, inte positivt kontra negativt.** Beröm för
   säljarens snabba leverans stryks — den beskriver AE-affären, inte vår. Då måste kritik av
   samma sak strykas på samma grund.
4. **Anonyma konton får inget namn vidare** — annars heter varje rad "A.S." och sidan ser
   påhittad ut.
5. ☠️ **Kontrollera bilddomänen.** `imageUrl`/`imageUrls` ska peka på `static.wixstatic.com`.
   Pekar de på `aliexpress-media.com` hotlinkar vi, och bilderna försvinner när AE roterar
   sitt CDN. Ladda ner, granska (inga ansikten eller personuppgifter), ladda upp, skriv om.

Skrivningen sker med **otypat** värde — samma fälla som i *Fasta fakta*:

```
PATCH /wix-data/v2/items/{id}
{ dataCollectionId: "FyndplatsImportedReviews",
  patch: { dataItemId: "<id>", fieldModifications: [
    { fieldPath: "textSwedish", action: "SET_FIELD", setFieldOptions: { value: "<svensk text>" } },
    { fieldPath: "status",      action: "SET_FIELD", setFieldOptions: { value: "edited" } } ] } }
```

> Betygen skickas **inte** till Google. `PRODUCT_REVIEW_SCHEMA` i butiksrepot är default av
> så länge omdömena är andras köpares — se `CLAUDE.md`.

-----

## Klart-kriterium (checklista före publicering)

Gå igenom listan **innan** Steg 13. Faller något: fixa först, publicera sedan. Steg 12
(kundläsningen) ersätts inte av den här listan — de fångar olika fel.

**Text**

- Namn, slug, SEO-titel och meta är på **svenska** och innehåller fokussökordet inklusive
  kvalificeraren. Inget dropship-märke kvar.
- Sökordet **krockar inte** med en annan produkt i katalogen (Steg 1), och skillnaden mot
  syskonet står i **namn, slug OCH titel** — inte bara i brödtexten.
- Ingen tysk text kvar: sök på `zelt`, `wohn`, `schwarz`, `abmess`, `lieferumfang` — och på
  **`Färg:`-värdet**, som importen lämnar oöversatt.
- ☠️ **Och på `seoData.settings.keywords`.** Importen lägger leverantörens tyska rubrik
  där som fokusord (*"sandkasten 2-teilig 150x90cm holz"*), och den överlever hela
  poleringen: Steg 7 skriver `seoData.tags` men rör inte `settings`. Mätt i runda 52 på
  **8 av 8** produkter, och på 2 av 4 kvarhållna från runda 51. Fältet renderas inte —
  butiken sätter en fast `keywords`-meta för hela sajten — men det är leverantörstext kvar
  på produkten, det syns i Wix SEO-panel, och det är gratis att rätta: skicka `seoData`
  med `settings.keywords` satt till det svenska fokusordet i den avslutande Steg 13-PATCH:en.
  **Grinden måste läsa hela `seoData`, inte bara titeln och beskrivningen** — annars är det
  här ett fält ingen kontroll någonsin tittar på.
- Inget **`Skickas från`** någonstans i beskrivningen.
- Beskrivningen har **inget** "Det du bör veta innan du köper"- eller "Bra att veta"-block.
  Leverantörsfelen är rättade direkt i löptexten och spec-tabellen; det som avgör ett köp står
  som vanlig mening där det hör hemma, inte som en varningslista.
- **Svensk sifferstil** genomgående: decimalkomma, `10/20/30 cm` (aldrig kommalista),
  `72 × 57 × 56 cm`, tankstreck i intervall.
- Flik-rubrikerna ligger som **rena `<h2>`** — inte feta eller `<span>`-lindade.
  ☠️ **Strängen måste stämma ORDAGRANT:** `Tekniska specifikationer` · `Användning och
  skötsel` · `Vanliga frågor`. Skriver du `Specifikationer` — den naturligare svenskan, och
  därför den man glider ner i — matchar splittern inte och spec-tabellen renderas **inline
  mitt i brödtexten**. Det ser inte trasigt ut, bara som en rubrik till, och därför upptäcks
  det inte. Fyra produkter i rad gick live så 2026-08-26/27. **Kontrollera i den RENDERADE
  sidan** att `<summary>Tekniska specifikationer</summary>` finns — inte att ordet står
  någonstans i HTML:en.
- ☠️ **`Användning och skötsel` är OBLIGATORISK — den ska ligga i flikraden på varje
  polerad produkt** *(Leonards instruktion 2026-08-30: "glöm inte användning och skötsel …
  framåt")*. Flikraden är alltså alltid **Tekniska specifikationer · Användning och skötsel ·
  Vanliga frågor** (frontenden lägger till "Kontakta oss" själv). Den var tidigare skriven som
  "valfri när varan har skötsel"; den formuleringen är borta. Varje vara har skötsel — trä ska
  efterdras, textil tvättas, metall torkas, elektronik dammas av och lagras frostfritt. Hittar
  du ingenting att skriva har du inte läst varan tillräckligt noga. **Kontrollera i den
  RENDERADE sidan** att `<summary>Användning och skötsel</summary>` finns, av exakt samma skäl
  som spec-fliken ovan.
- Bytte du slug på en **redan publicerad** produkt: en redirect-rad finns från den gamla
  sluggen. Utan den är URL:en död och rankingen borta. *(Gäller inte nyimporterade utkast.)*

**Bilder**

- Plats 1 **visar hela varan tydligt** och är aldrig ett kort. Plats 2 är en verklighetsbild.
- **Minst ett eget Fyndplats-kort** finns i galleriet.
- Alla items har kvar `image.url` efter media-PATCH:en (verifierat med **separat re-GET**,
  inte på PATCH-svaret), och **varje** alt-text är svensk, unik och beskriver det som syns.
- Ingen bild bär kvarlämnad utländsk text, och ingen bild har en **retuscherad vara** —
  kapade kanter, vita hack, borttagna delar.
- Polerades ett syskon samtidigt: sidorna delar **ingen** miljöscen.

**Data**

- SKU:n matchar den **polerade sluggen** (`FP-<svensk-slug>`), och mappningens
  `variants[].sku` är uppdaterad till samma sträng.
- Priset är **orört** och stämmer mot `charm9(landedCostSek × 1,20)`.
- Kategori kopplad som **förälder + löv** (Steg 10) — inte bara lövet, inte bara toppen.
- ☠️ **`visible: true` på produkten OCH på varje `variantsInfo.variants[].visible`** — annars
  syns produkten men går inte att lägga i varukorgen, och det syns inte i produktvyn.
- `needsAiPolish: false` och `draftStatus: "published"` på mappningsraden.

**"EU-lager"-ribbonen**

Kravet är `variants[].shipFrom` i **mappningen**, inte produktens `shipsFromCountries` — den
listan är en mängd över listningens lager och säger inget om vilket lager den variant vi
faktiskt beställer ligger i. Aosom-rader har alltid `DE` och är därmed täckta.

⚠️ `GB`, `RU` och `US` räknas som EU av `isEuCountry` (som mäter *snabb leverans*, inte
tullunion). Mot en svensk kund är de inte EU-leverans, så en produkt vars enda "EU"-lager är
brittiskt eller ryskt ska inte bära ribbonen. **Inköpssidan är löst i kod sedan 2026-08-21**
(PR #486) — leta inte efter den buggen, det är bara ribbonen som är kvar åt dig.

**Leverantörens uppgifter**

- Varje siffra på sidan är **verifierad eller utelämnad** (Steg 5). Inget superlativ utan
  mätvärde, ingen uppgift som leverantörens egna bilder motsäger.
- Produkttypen i namnet är vad varan **är**, inte vad leverantören kallar den.
- ☠️ **Ingen jämförelse som syftar på poleringsomgången.** *"de åtta bokhyllorna i den här
  omgången"*, *"den lättaste lampan i den här gruppen"* — omgången är ett internt begrepp och
  betyder ingenting för en kund som landar på EN sida. Den är dessutom ett superlativ utan
  mätvärde i förklädnad: den är sann om just de åtta, medan kunden läser den som "i hela
  sortimentet", och den blir tyst falsk när nästa omgång publiceras. Städat 2026-09-01 på
  sex publicerade sidor (fem bokhyllor + en taklampa), funna med ett katalogsvep över alla
  1 414 publicerade produkter.

  Jämför i stället mot **namngivna** syskon (*"vår trädformade bokhylla tål 3 kg per gren"*)
  eller släpp jämförelsen och behåll siffran. Samma regel som korshänvisningen i Steg 1:
  peka på en produkt kunden kan klicka på, inte på ett parti bara vi ser.

**Bara flervariantprodukter (AliExpress)**

- Ingen uttags-/spänningsaxel kvar med US/UK/AU/KR eller 110 V, och varje kvarvarande variant
  har både lagerpost och mappningsrad.
- Ser två val på samma axel ut som samma färg: exemplaren är **jämförda i bild**.
- Variantetiketterna innehåller ingen obekräftad prestandasiffra.
- Varje färg-/modellvals `linkedMedia` är en **produktbild av den varianten**, inte ett kort.

**Bara AliExpress-produkter**

- Recensioner hämtade (Steg 14), eller bekräftat `imported: 0`.
- `pending`-recensioner är omskrivna till `edited`, eller `rejected` med skäl.
- Ingen recensionsbild pekar på `aliexpress-media.com`.

-----

## AliExpress-rader: vad som skiljer

Katalogens ~950 publicerade produkter kom in den här vägen, och tillägget importerar
fortfarande enstaka. Samma fjorton steg gäller — fyra saker skiljer.

1. **Flera varianter är normalfallet.** Modeller, färger och uttagstyper buntas på samma
   listning. Steg 6 och 11 är därmed riktigt arbete, inte no-ops, och mekaniken ligger i
   [`polish/varianter.md`](polish/varianter.md). ☠️ Den dyraste enskilda regeln:
   **uttags-/spänningsaxlar ska bort** — en svensk kund ska inte kunna beställa 110 V med
   US-stickpropp.
2. **Bilderna varierar i antal och kvalitet.** Ingen fast positionsregel som Aosoms
   [1, 2, 3, 8, 9] — granska hela galleriet i Steg 4. Räkna med mörka feature-collage,
   vattenstämplar och inbränd text på engelska, spanska eller kinesiska, och med
   **pixelidentiska men byte-olika dubbletter** som fil-id och checksumma missar:
   ```python
   a=np.array(Image.open(f1).convert("L").resize((320,320))).astype(int)
   b=np.array(Image.open(f2).convert("L").resize((320,320))).astype(int)
   abs(a-b).mean()   # 0.0 = samma motiv, oavsett filstorlek
   ```
   Mönstret är regel, inte undantag — tre produkter i rad 2026-08-26 hade 12/10, 9/8 och 9/8
   unika bilder. Pekar en `linkedMedia` på en kopia du tar bort: koppla om valet först.
3. **Recensioner finns att hämta** (Steg 14) — till skillnad från Aosom.
4. **Laglighetsgrinden är bredare.** Vapenrepliker och licensfigurer (Disney, Pokémon,
   rödakorsmärket) förekommer bara här. Se Steg 2.

-----

## Katalogsvep – återkommande underhåll (inte per produkt)

### Sidbrytningen är den dolda kostnaden

⚠️ **Katalogsvep bränner Wix-kvoten.** Ett anrop som bläddrar igenom hela katalogen
(100 per sida) är **tio** REST-anrop, inte ett, och två–tre svep i följd ger
`Rate limit exceeded` i ungefär en kvart. Svep **en gång**, spara träffarna, och hämta sedan
bara de produkter du ska röra med ett id-filter i ETT anrop:

```js
body = { query: { filter: { id: { $in: [ ...ids ] } }, cursorPaging: { limit: 100 } },
         fields: ["PLAIN_DESCRIPTION"] }
```

Planera svepet så att det returnerar allt du behöver första gången — id, revision OCH
textutdraget — annars får du betala hela sidbrytningen igen för det du glömde.

Två tysta driftfel som ingen produktpolering upptäcker, för de syns bara över hela
katalogen. Kör dem med några veckors mellanrum — båda är read-only tills du väljer att
åtgärda, och båda ryms i **ett** `ExecuteWixAPI`-anrop.

> ⚠️ **Marginalsvep: mät inte lägsta pris mot högsta kostnad (2026-08-17).** Ett svep som ställde produktens `actualPriceRange.minValue` mot mappningens HÖGSTA `landedCostSek` rapporterade 55 produkter "under inköp" — nästan alla falska: solpanelens 100 W-pris jämfördes med 260 W-variantens kostnad. Det enda som håller för flervariantprodukter är **lägsta pris mot LÄGSTA kostnad** (är det billigaste priset under den billigaste kostnaden måste någon variant gå med förlust) plus exakt jämförelse när produkten har en enda variant. Det gav 2 äkta träffar av 801.
>
> **Husets prisformel:** `charm9(landedCostSek × 1,30)` → 23,1 % marginal på säljpriset (`roundPrice`/`charm9` i `lib/import/pricing.ts` avrundar UPPÅT till närmaste tal som slutar på 9). Använd den när ett pris ska sättas om — mappningens `grossSek` kan vara äldre än `landedCostSek` och ligga fel. **Matcha alltid mot SKU:t via `wixVariantId`, inte via SKU-strängen**: SKU:erna försvenskades vid polering (`FP-electric-motorcycle-rod` → `FP-elmotorcykel-barn-rod`) medan mappningen behöll de gamla, så en SKU-koppling ger tyst noll träffar.
>

> **Katalogsvep — tomma alt-texter.** Rå-importer som aldrig polerats lämnar `altText: ""`
> på hela galleriet, vilket inte syns någonstans i admin. Kör svepet regelbundet:
> `POST /stores/v3/products/search` med `fields:["MEDIA_ITEMS_INFO"]`, paginera på
> `cursorPaging`, och lista produkter där `items.some(m => !m.altText)`. 2026-08-06 gav det
> **13 publicerade produkter / 82 bilder** helt utan alt-text.
>
> ✅ **Svept och lagat 2026-09-03: 94 av 1 658 publicerade produkter.** Alla
> saknade exakt en förälder, tyngdpunkt Hem & Inredning (19 i andra halvan) och
> ett stort kluster kontors-/massagestolar. `add-item` med förälderns id på var
> och en, `totalSuccesses > 0` på alla 94, noll fel — och verifierat med ett
> SENARE svep som gav **noll kvar**. Skrivningens svar duger inte som kvitto
> här: `directCategoriesInfo` släpar, så räkna om i ett eget anrop.
>
> ☠️ **Katalogsvep — tomma alt-texter: 210 publicerade produkter, 1 222 bilder
> (2026-09-03).** Det är 12 % av bilderna på 13 % av de publicerade sidorna, och
> orsaken är känd: alt-texten skrevs till `items[].image.altText` i stället för
> `items[].altText` och SLÄPPTES TYST av Wix (se fältnoten i Fasta fakta,
> uppmätt 2026-09-01). Allt som polerades före den dagen är drabbat; allt efter
> är rent — runda 43, 44 och 45 mätte noll tomma.
>
> ⚠️ **Det går inte att laga med en mall.** Alt-texten ska beskriva det som
> FAKTISKT syns, och plats 2 och framåt är inte förutsägbar ens när galleriet
> följer husordningen. Reparationen kräver ögon på bilderna — alltså egna
> rundor med kontaktkartor, inte ett svep. Räkna 210 produkter i grupper om
> åtta: ~26 rundor, eller färre om man bara tar de bilder som är tomma.
>
> **Katalogsvep — löv utan förälder.** Samma sorts tysta drift i kategoriträdet: en produkt
> kopplad till bara lövet syns inte när kunden browsar från toppnivån. Kör bredvid alt-text-svepet:
> hämta trädet (`/categories/v1/categories/query`) → `parent[löv] = förälder`, paginera katalogen
> med `fields:["DIRECT_CATEGORIES_INFO"]`, och flagga varje produkt där `parent[c]` saknas bland
> dess egna kategorier. Åtgärda med `add-item` per förälder (bodyn tar **`item` singular** — plural
> `items` avvisas, så det blir ett anrop per produkt, men alla ryms i **ett** `ExecuteWixAPI`-anrop).
> 2026-08-11 gav svepet **359 av 631 produkter / 366 saknade kopplingar**, med tyngdpunkt i
> Hem & Inredning (124), Sport & Fritid (110) och Barn & Familj (85).
>
> ☠️ **Katalogsvep — slutsålt: `query-variants` ser inte enkelvariantprodukter (2026-08-26).**
> Ett svep som räknade slutsålda varianter via `POST /stores/v3/products/query-variants` svarade
> `heltSlutsalda: []`. Ren friskförklaring — och falsk. Rutten returnerar bara produkter som HAR
> en variantaxel; allt som importerats som en enda variant (majoriteten av katalogen) finns inte
> i svaret över huvud taget. Noll träffar betydde alltså "ingen FLERVARIANTprodukt är helt
> slutsåld", inte "inget är slutsålt". Den auktoritativa källan är lagerposterna:
> `POST /stores/v3/inventory-items/query` ger exakt en post per köpbar variant, oavsett om
> produkten har en axel eller inte. Samma svep om, mot lagerposterna: **79 publicerade produkter
> helt slutsålda**. (Besläktad blindfläck i samma familj: `POST /stores/v3/products/search`
> returnerar aldrig `variantsInfo`, hur man än sätter `fields` — behöver du lagerstatus per
> variant måste du läsa produkten enskilt eller gå via lagerposterna.)
>
> **Regeln bakom felet:** ett tomt svepsvar är ett påstående som ska bevisas, inte ett kvitto.
> Kontrollräkna alltid mot en känd nämnare — svepte det 930 produkter eller 63? Stämmer inte
> nämnaren är täljaren ointressant.

### ☠️ Katalogsvep — leverantörskoder i publicerad text (verktyg finns)

dealproffsen.se publicerar Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD. Står
samma sträng i vår text går våra sidor att joina mot deras — och därmed mot vad vi
betalar för varje vara.

**Läckan har hittats fyra gånger av svep och noll gånger av en spärr:**

| datum | var | antal |
|---|---|---:|
| 2026-09-02 | inbränt i produktkortens fotremsa | 33 |
| 2026-09-02 | som spec-rad i texten | 4 |
| 2026-09-03 | som spec-rad i texten, efter att svepets regex rättats | **51** |
| 2026-09-03 | som **bockad** spec-rad, efter att svepet sagt "0 träffar" | se nedan |

De 51 hittades först när svepets egen regex lagades: mönstret `</span>?` kräver den
LITERALA strängen `</span` med ett valfritt `>` — det gör inte taggen valfri. Bara den
ena av två former kunde alltså träffa, och 488 sidor svepta med det mönstret bevisade
ingenting. **Validera alltid ett svepmönster mot minst en känd smutsig sida av varje
form innan du litar på ett tomt resultat.**

**Läckan har nu hittats FEM gånger, och fem gånger av ett svep.** De två senaste
(2026-09-03, båda i samma timme) satt i spärren själv, inte i texten:

| felet i detektorn | vad som gick fri |
|---|---:|
| prefixet var `[0-9A-Z]` och regexen saknade `i` | **19** publicerade sidor med GEMEN kod |
| `Artikelreferens` saknades i etikettlistan | **4** publicerade sidor |

Den första är den obehagliga. Filens egen kommentar sa *"FORMEN ÄR MÄTT, INTE
GISSAD"* — och det var sant, formen var mätt över 51 sidor. Men varenda kod i det
urvalet råkade vara versal, så mätningen bevisade en form och antog en teckenrymd.
Svepet läste 5 485 produkter och rapporterade `medKod: 0` medan `Referens:
d30-670v00yl` låg live på en publicerad sida.

☠️ **En spärr som är blind för halva teckenrymden är värre än ingen spärr:** den
ger ett grönt kvitto på en läcka som pågår, och den gröna rapporten är skälet att
ingen tittar efter.

**Tre regler ur det:**

1. **Ett mätt urval bevisar formen, inte rymden.** Har du mätt `Z00-111V00XX` vet
   du hur raden ser ut — inte att koden alltid är versal, alltid har det prefixet,
   alltid saknar parentes. Skriv mönstret så vitt som datan tillåter och strama
   åt med ett *innehållskrav* i stället: koden här kräver nu **minst en siffra
   någonstans i koden**, vilket träffar varje äkta kod och utesluter varje
   bokstavsord (`Referens: bruks-anvisning` hade annars klippts bort när gemener
   släpptes in).

   ☠️ **Kravet satt först per HALVA, och det var för hårt.** Den formen avvisade
   `bruks-anvisning` korrekt men också `SP-CAG-203018` — en uppmätt äkta kod där
   båda de första segmenten är rena bokstäver. Två korrekta fixar från två
   parallella sessioner drog alltså åt olika håll, och det syntes bara för att
   båda sidornas tester kördes mot samma fil vid sammanslagningen. **Ett
   innehållskrav ska ställas på det minsta som räcker.**
2. **Alternationen tar det FÖRSTA alternativet som matchar — sortera längst först.**
   `Referens` före `Artikelreferens` matchar de nio sista tecknen, och då står
   `<li><p>` inte längre omedelbart före etiketten: raden går fri i saxen men syns
   i löptext-rapporten. Ett fel som ser ut som två olika buggar är en
   sorteringsfråga. Sätt dessutom en ordgräns före etiketten — **en etikett som
   ska klippas ska stå i listan, inte hittas av misstag.**
3. ☠️ **Kontrollera svepets `avhuggen` INNAN du tolkar noll träffar.** Första
   mätningen här läste 2 800 av 5 485 och gav noll — jag drog slutsatsen att
   regexen var oskyldig. Den kända smutsiga sidan låg i den olästa halvan. Samma
   fälla som `cursor === null` i Steg 1, en våning ner.

**Kvittot som gör mätningen värd något:** lägg en **känd smutsig rad av varje form**
som positiv kontroll i själva svepet och avbryt om den inte träffas. Två rader kod,
och det är skillnaden mellan "noll träffar" och "noll träffar, och regexen fungerar".
☠️ **Och samma dag igen, på nästa grannform — den här gången efter ett grönt svep.**
Jag rapporterade "5 485 produkter lästa, 0 träffar" och kallade katalogen ren. Den var
det inte: `<li><p>✔ Artikelnummer: …</p></li>` gav **noll** träffar, samma rad utan
bocken gav **en**. Bocken är RÅIMPORTENS form — Aosoms specrader kommer in som
`<li><p>✔ Farbe: Mehrfarbig</p></li>` — alltså exakt den form ett **opolerat utkast**
bär, och därmed den enda form som finns kvar när svepet redan städat de publicerade
sidorna. Detektorn var blind för precis det den bäst behövde se.

**Två regler ur det, och den andra är den som biter:**

1. **En detektor ska valideras mot RÅDATANS form, inte bara mot de träffar den redan
   hittat.** Båda mina regexfel var samma misstag: jag härledde mönstret ur de sidor
   detektorn *lyckats* hitta, vilket per definition inte kan avslöja en form den
   missar.
2. ☠️ **Ett svep får inte ställa samma fråga som saxen.** Frågade det "hittade saxen
   något?" var svaret "nej" både när katalogen var ren och när saxen var blind — och
   de två utfallen såg identiska ut. Svaret bär sedan 2026-09-03 fältet **`kodIText`**:
   sidor vars text bär en kod EFTER att saxen fått göra sitt, mätt med `barKod`, som
   läser hela fältet och inte delar antagande med saxen. Är den listan icke-tom är det
   saxen som ska lagas, inte katalogen. **Ett falskt friskintyg är värre än ingen
   mätning alls** — efter det slutar man mäta.

Kör inte det här för hand längre. Verktyget är
**`lib/seo/leverantorskod.ts`** (saxen) + **`lib/seo/text-repair.ts`** (körningen) +
`/api/cron/seo-text-repair` + workflowen **"SEO — städa publicerad produkttext"**
med lägena `scan` och `apply`. Samma körning lagar också de trasiga
syskonlänkarna (`lib/seo/relativa-lankar.ts`, se fällan i Steg 7).

Tre egenskaper som inte ska tas bort:

1. ☠️ **Värdet måste se ut som en kod, inte bara etiketten stämma.** `Referens: se
   bruksanvisningen` och `Standard: EN 1930` är legitim text. En sax som klipper på
   etiketten ensam tar bort dem också — och en sax som tar för mycket är farligare än
   läckan den lagar. Tjugosex tester låser båda hållen.

   Dekorationsledet (bock, punkt, streck, `&nbsp;`) är därför MEDVETET smalt: bara
   skiljetecken och blanksteg, aldrig bokstäver. Ett `.{0,4}` hade svalt
   `Se Artikelnummer:` och gjort saxen till en gissning. Ett test låser den
   riktningen också.

   ☠️ **Och `FP-` är undantaget från kodmönstret.** Husets SKU:er börjar alltid så,
   och `Artikelnummer: FP-julgran-210-pynt` är en LEGITIM rad — kundens referens
   vid en reklamation. Ingen leverantörskod ser ut så. Utan undantaget felade
   mönstret åt BÅDA hållen: en kort SKU som `FP-sideboard` matchade rakt av och
   hade klippts bort (bara svansens längd räddade de flesta — tur, inte
   konstruktion), och `kodIText` flaggade 20 sidor vars enda "kod" var deras egen
   FP-SKU. **Ett larm där tre av fyra är falska slutar läsas**, och då är även det
   äkta borta.
2. ☠️ **Massfel-spärren står FÖRE första skrivningen.** Hela sidan (100 produkter)
   läses, andelen träffar kontrolleras mot `MAX_ANDEL_TRAFFAR = 0,25`, och först
   därefter skrivs något. Körs kontrollen inne i skrivslingan hinner en trasig regex
   rensa halva sidan innan andelen ens går att räkna — det syntes i testet första
   gången: 49 skrivningar innan spärren fällde. Mätt normalläge är 3 % (51 av 1 627).
3. ☠️ **Varje skrivning läses tillbaka.** `lagade` stiger först när koden faktiskt är
   borta ur den återlästa texten. Ett svar utan fel är inget kvitto — och just här
   finns en konkret fälla: `updateProductDescription` respekterar globala
   `SYNC_DRY_RUN`, som är default `"true"`. Utan återläsningen hade en skarp körning
   rapporterat "51 lagade" utan att ha skrivit ett tecken.

**Koden i RUBRIKEN lagas inte automatiskt** — den kräver att någon skriver om
rubriken, och rapporteras i `kodINamn`. **Koden som saxen inte NÅR** (i brödtext, i en
form saxen inte känner) lagas inte heller automatiskt och rapporteras i `kodIText`.

⚠️ **Flersegmentskoder ligger med flit utanför saxen.** Uppmätt på en publicerad sida
2026-09-03: `Modellnummer: SP-CAG-203018 / SP-CAG-253515 / …`. Värdemönstret är ETT
segment, så saxen når den inte — och ska inte nå den: raden står på en polerad sida
där ett modellnummer kan vara det kunden söker på. `barKod` ser den, den hamnar i
`kodIText`, och en människa avgör. Det är exakt vad listan finns för.

⚠️ **Svep utkasten också.** Default är `onlyPublished=true`, alltså bara publicerade
sidor — men det är i utkasten den opolerade råtexten står, och ett utkast publiceras
förr eller senare. Kör `?onlyPublished=false` när du vill veta vad som väntar.

☠️ **Massfel-taket gäller bara kodsaxen.** Länkfixen tar inte bort någonting: den
sätter tillbaka ett värdnamn och är idempotent. En hög andel där betyder att felet
är utbrett — vilket är ett skäl att köra, inte att stoppa.

-----


### Textstädning över hela katalogen (inte per produkt)

De tre blocken nedan låg tidigare i Steg 7. De beskriver **svep**, inte polering av en
enskild produkt, och flyttades hit 2026-08-29.

> 🔍 **Städar du regeln i efterhand över hela katalogen: gör sökmönstret SNÄVT.** Ett brett mönster flaggar allt utom det som är fel. Mitt första svep gav 134 träffar av 777 — nästan alla falska: vanliga monteringsanvisningar (*"kontrollera att låssprintarna sitter i innan du lastar bänken"*), passformskrav som ÄR köpbeslutet (*"kontrollera att bilen har upphöjda takrails"*) och lagstadgad åldersmärkning (*"inte lämplig för barn under 3 år"*). Ett omedvetet delsträngsfel gjorde dessutom att `står inte` matchade mitt inne i **ro**`star inte`. Snävt omskrivet gav samma katalog **7** träffar — den riktiga svansen. Leta efter de tre faktiska brotten:
>
> | Sort | Mönster som faktiskt bär |
> |---|---|
> | Vi som inte vet | `anges inte`, `uppges inte`, `framgår inte`, `specificeras inte`, `saknas uppgift` |
> | Vi som gardar oss | `vi har inte fått`, `vi lovar ingenting`, `vi kan inte lova`, `vi hellre säger` |
> | Trasig korsreferens | `läs stycket … under <borttagen rubrik>` |
>
> Ordgränser räcker inte alltid: `\bleverantören\b` missar genitivformen *leverantörens* — använd `leverantör[a-zé]*`. Och radera aldrig en träff blint; hämta HTML-kontexten runt den och skriv om för hand. **Monterings- och säkerhetsinstruktioner är nödvändiga och ska stå kvar** — regeln är "bara det nödvändiga", inte "ingenting".
>
> ☠️ **`\b` i JavaScript är ASCII — den ser å, ä och ö som ordgränser.** Det gör varje
> ordgränsbaserat svep över svensk text opålitligt, och felet ser ut som ett äkta fynd i
> stället för som en bugg. Uppmätt 2026-09-02 när jag letade tyska SEO-titlar: `\bder\b`
> träffade **inne i `konstläder` och `gasfjäder`** (`ä` är inget `\w`, alltså finns en gräns
> mellan `ä` och `d`), och svepet rapporterade nio svenska sidor som tyska. Två omgångar gick
> åt till att jaga ett fel som aldrig fanns i datan.
>
> Använd Unicode-lookarounds med `u`-flaggan i stället:
>
> ```js
> const TYSK = new RegExp("ß|(?<!\\p{L})(" + ORD.join("|") + ")(?!\\p{L})", "iu");
> ```
>
> Och när ett svep ger träffar som ser fel ut: **instrumentera mönstret så att det säger
> vilket ord som matchade**, i stället för att gissa. Det tog ett anrop och avslutade frågan.
> Samma familj som `står inte` inne i **ro**`star inte` ovan — men den varianten går inte att
> laga med `\b`, för det ÄR `\b` som är trasig.


> 🩹 **Varje massborttagning lämnar ärr — städa typografin efteråt, annars syns operationen för kunden.** Att stryka en mening ur löptext lämnar tre spår som inget stavningsprogram fångar, och alla tre låg ute live efter mina svep:
>
> | Ärr | Exempel som gick i produktion |
> |---|---|
> | Mellanslag före skiljetecken | *"17,6 kvadratmeter odlingsyta ."* · *"0,72 m² golvyta ."* |
> | Punkt utan mellanslag efter | *"…undan regnet.Vi säljer den inte som…"* |
> | Hängande halvmening | *"Upprullbar dörr i gaveln för att komma in. **Vi skriver därför bara att den är upprullbar och lämnar bredden osagd.**"* |
>
> De två första lagas mekaniskt och riskfritt — men **bara inuti textnoder**, aldrig över hela HTML-strängen (`style="font-weight: 700"` innehåller kolon och mellanslag som inte får röras):
>
> ```js
> // OBS: kolon och semikolon undantas när en smilis följer — se noten nedan.
> const SMILIS = /(?!-?[()D|\/\\pP3])/.source;
> const stada = h => h.replace(/>([^<]+)</g, (_, t) => ">" + t
>   .replace(new RegExp("\\s+([.,!?]|[;:]" + SMILIS + ")", "g"), "$1")  // mellanslag före skiljetecken
>   .replace(/([a-zåäö,])([.!?])([A-ZÅÄÖ])/g, "$1$2 $3")                 // saknat mellanslag efter punkt
>   .replace(/ {2,}/g, " ") + "<");
> ```
>
> ☠️ **Undanta smilisar, annars klistrar städningen ihop dem med föregående mening.**
> `\s+([.,;:!?])` läser kolon som skiljetecken, så `"ett bra pris! :)"` blir
> `"ett bra pris!:)"` — ett nytt fel infört av den kod som skulle laga fel. Det slog till
> på två publicerade recensioner 2026-08-26 i samma körning som lagade tio andra. Samma
> gäller `;)` och `:D`. Kontrollera efter varje städning: `/[.!?,][:;=]-?[()D|\/\\pP3]/`
> ska ge noll träffar.
>
> Den tredje går inte att laga mekaniskt: den borttagna meningen bar en syftning som nästa mening hänger på (*"därför"*, *"det"*, *"den"*). Sök efter kvarvarande syftningar — `vi skriver`, `därför bara att`, `lämnar … osagd` — och skriv om för hand. **Kör städningen som ett eget steg efter varje svep, inte som en del av det** — annars städar du bara de produkter svepet råkade träffa.
>
> ⚠️ **Mät inte typografi på taggstrippad text — du mäter din egen strippning.** `h.replace(/<[^>]+>/g, " ")` sätter ett mellanslag där taggen stod, så korrekt HTML som `<span>odlingsyta</span>.` blir `"odlingsyta ."` och ser ut som en defekt. Min slutkontroll rapporterade 32 träffar på det viset; **alla var falska**. Testa mot textnoderna i stället, samma avgränsning som städningen använder:
>
> ```js
> const re = />([^<]+)</g; let m;
> while ((m = re.exec(h)) !== null) if (/\S\s+[.,;:!?]/.test(m[1])) { /* äkta defekt */ }
> ```


> **Äldre sidor bär den gamla en-styckesformen — kontrollera mellanslaget där.** Innan regeln
> ovan skrevs FAQ som `<p><span style="font-weight: 700">Fråga?</span> Svar</p>`, allt i samma
> stycke. Saknas mellanslaget efter `</span>` renderas det som **"Hur djup är den?29 cm"** — HTML
> kollapsar inte blanksteg som inte finns. Felet syns inte i JSON-LD (`lib/seo/faq-jsonld.ts` kör
> `avkoda` → `.replace(/\s+/g," ").trim()`), bara för kunden i fliken, så det överlever varje
> strukturkontroll. Svep 2026-08-19: **138 av 826 produkter, 715 förekomster** — ingen kod orsakar
> det (`lib/import/tabs.ts` genererar korrekt), det är handskriven poleringstext.
>
> ```js
> const RE = /(<span style="font-weight: 700">[^<]*\?<\/span>)(?=[^\s<])/g;
> const lagat = h.replace(RE, "$1 ");
> ```
>
> **Typografistädningen ovan fångar inte det här.** Den arbetar inuti textnoder (`>([^<]+)<`)
> och ser därför aldrig taggränsen `</span>` där mellanslaget saknas; dessutom kräver dess
> regex en **versal** efter punkten, medan FAQ-svaret oftast börjar med en **siffra**
> (*"…?29 cm"*). De två reglerna överlappar alltså inte — kör båda.
>
> **Avgränsa på `?`, inte på `:`.** Ett kolon-slut träffar spec-etiketterna (`<b>Skärm:</b> 4,3 tum`)
> som redan är korrekta — i svepet slutade **alla 715** träffarna på `?` och **noll** på `:`.
> Verifiera att bara mellanslag tillkommer innan du skriver: `ny.length === gammal.length +
> antalTräffar` och `ny.split(" ").join("") === gammal.split(" ").join("")`. Massrättning går via
> `POST /stores/v3/bulk/products/update` (max **100** produkter per anrop, varje post

### ☠️ UTKASTLISTAN ÄR INTE FAMILJEN — en publicerad färg räknas aldrig (runda 96)

Steg 1 svepte poleringskön, hittade två färgsyskon till en nyss publicerad duk
och skrev **"tre färger"** på båda de nya sidorna. Sanningen var **fyra**:
`paviljongtak-3x3-dubbeltak-creme` var redan publicerad och är SAMMA duk —
identisk på stordukens 300 × 300 cm, det lilla takets 86 × 86 cm, kanthöjdens
18 cm, 180 g/m², åtta dräneringshål och kardborrefästet. Bara `Farbe` skiljer.

Fem publicerade sidor räknade fel samtidigt, och ingen grind kunde se det:
lint läser rundans EGNA texter, och där stämde "tre" mot rundans egen världsbild.

☠️ **Frågan Steg 1 ställer är "vilka UTKAST hör ihop?" — inte "vilka SIDOR
säljer den här varan?".** Ett färgsyskon som redan är publicerat ligger inte i
kön och dyker aldrig upp. Sedan runda 96 gäller därför: när en runda påstår
"finns i N färger", **fråga katalogen, inte kön**:

```js
POST /stores/v3/products/search
{ "search": { "filter": { "slug": { "$in": [ ...alla tänkbara färgsluggar ] } } } }
```

⚠️ Och `$startsWith` på `name` är INTE en filtrerbar kombination här — den
returnerade hela katalogen (3 000 rader) i stället för att fälla. Ett filter
som inte stöds ger fel svar TYST. Filtrera på `slug` med `$in`, eller hämta en
avgränsad mängd och filtrera i egen kod.

☠️ **En korslänk under fel rubrik är SÄMRE än ingen korslänk.** Creme-sidan var
inte osynlig — den stod i den föregående rundans egen källfil, under rubriken
**"Har du en annan storlek?"**, med texten *"ett dubbeltak i creme **i samma
storlek**"*. Rubriken motsäger sin egen mening, och den som läser källan ser en
sida som redan är avfärdad som "annan storlek". En länk placerad fel svarar
"redan kollat" på en fråga den aldrig ställde.

### ☠️ Söksträngen får stavas fel — ersättningen får inte

När en runda rättar REDAN PUBLICERAD text är kirurgi rätt verktyg: sidorna
kommer ofta från olika rundors generatorer, och att bygga om dem ur en
generator ändrar mer än defekten. Formen som håller:

```python
def byt(html, gammalt, nytt, vad):
    n = html.count(gammalt)
    if n != 1:
        raise SystemExit("FÄLLER: %s gav %d träffar, förväntade 1" % (vad, n))
    return html.replace(gammalt, nytt)
```

Asymmetrin är hela poängen och den är gratis:

| | felstavad | vad som händer |
|---|---|---|
| **SÖKsträngen** | ja | **0 träffar → skriptet dör innan något skickas** |
| **ERSÄTTNINGEN** | ja | **når kunden, och API-svaret ekar tillbaka felet som "sparat"** |

Söksträngarna behöver därför ingen grind. Ersättningarna behöver en, och den
ska vara den som redan finns: **skriv meningarna i en FIL, linta dem där, och
hasha varje färdig mening.** Bär skrivningen sedan samma mening (t.ex.
handkopierad in i ett API-anrop), assertar anropet hashen innan det rör något.

Uppmätt i runda 96: den fjärde sidans gamla stycke räknade upp färgerna i en
annan ordning än den jag härledde ur datan. `byt()` gav **0 träffar** och
avbröt — tre sidor var redan korrekt skrivna, den fjärde rördes inte, och
felet var en minuts rättning i stället för fel text hos kunden.

### ☠️ Två läsformer som ser lika ut svarar på olika frågor

Poleringen har numera TVÅ sätt att göra HTML till text, och de är inte
utbytbara:

| | taggen blir | svarar på |
|---|---|---|
| `synlig()` — hashen | **ett blanksteg** | "är detta samma text som jag skickade?" |
| `lasform()` — linten | inline-taggen **ingenting**, blocktaggen ett blanksteg | "läser detta rätt för en människa?" |

Blandas de går det åt båda hållen:

- Linten körd med hashens regel gör `</a>, <a` till `" , "` och rapporterar
  **hängande komman som inte finns på sidan** — fem falska brister på fem
  korrekta stycken.
- Verifieringen efter skrivningen körd med de två blandade sa **"förekommer
  0 ggr"** om alla fem sidor — inklusive två som i samma svar just bevisats
  korrekta med hash. Verifieringen var fel, inte datan.

**Regeln: jämför alltid samma läsform på båda sidor**, och när en grind säger
att en sida är trasig medan en hash säger att den är rätt — **misstro grinden
först.** Hashen mäter det Wix lagrade; grinden mäter det jag skrev om grinden.

### ⚠️ En PATCH syns inte direkt — och `?cb=` hjälper inte mot det

Runda 60 lärde att ISR-cachen kan servera UTKASTET efter en publicering.
Runda 96 mätte samma sak åt andra hållet: efter en PATCH svarade sidan **200
med den FÖRRA versionen på en helt färsk cache-bust**, och med den nya
trettio sekunder senare. Syskonsidan, skriven i samma anropskedja, var färsk
direkt.

Cache-busten kringgår cachen; den påskyndar inte propageringen. Live-grinden
gör därför om **hela** kontrollen när bristerna är av färskhetstyp
(`saknas ordagrant`, `saknar korslänk`, `HTTP`) och dömer först när de står
kvar efter fyra försök med paus emellan.

⚠️ **Butiken svarar dessutom ibland 403 på en giltig begäran.** Samma slug gav
403 i ett svep och 200 sekunder senare, utan att något ändrats. Ett 403 är
inget verdikt förrän det upprepats — annars fäller grinden korrekta sidor, och
en grind som fyrar på korrekta sidor slutar bli läst.

### ⚠️ Självlänkskontrollen går inte att göra mot den renderade sidan

En grind som letar "länkar sidan till sig själv?" i hela HTML:en svarar **JA
för varje korrekt sida**: canonical, `og:url` och JSON-LD bär alltid sidans
egen adress. Uppmätt i runda 96 på två sidor som i samma timme bevisats
självlänksfria mot API:t.

Kontrollen hör hemma **mot API:t**, där beskrivningens egen HTML går att läsa
isolerad från sidans chrome. Samma familj som runda 95:s EU-lager-ribbon och
betalikonernas alt-texter: en textgrind mot en renderad sida måste avgränsa
sig till VÅR text, annars mäter den butiken.

### ☠️ EN PRODUKTKATEGORIS STANDARDPÅSTÅENDE KAN VARA FEL ÅT ANDRA HÅLLET (runda 97)

Foderstationsfamiljen säljs på ETT argument, och fem av sex utkast skriver ut
det: den upphöjda skålen sägs skona nacke och rygg och ge bättre matsmältning.
Det är inte bara ogrundat — det är **motsagt av den största studien som
finns**.

Glickman m.fl. (JAVMA 2000, Purdue) följde drygt 1 600 stora och jättestora
hundar: att äta ur en upphöjd skål var förknippat med **förhöjd** risk för
magomvridning (GDV). Ungefär **20 % av fallen hos stora raser och 52 % hos
jätteraser** tillskrevs den upphöjda skålen. En senare studie (Pipan m.fl.
2012) fann ingen signifikant effekt. Läget är alltså i bästa fall
**motstridigt**, och ett motstridigt läge är aldrig ett säljargument.

☠️ **Steg 2 ska därför fråga en fråga till på varje ny familj: vad SÄLJS den
här produkttypen på, och håller det?** Ett påstående som står i nästan varje
utkast i en familj känns som en produktegenskap. Det är precis då det är en
kategoriklyscha, och kategoriklyschor är oftast obevisade — ibland motbevisade.

⚠️ **Grinden ska vara en ORDLISTA, inte en bedömning.** En bedömning glider:
nästa runda skriver "många väljer en upphöjd skål för att den är skonsammare"
och en bedömande grind resonerar sig fram till att det ju bara är ett
konstaterande om vad många gör. Ordlistan gör det inte. Runda 97:s lista:
`magomvridn` · `uppblåsthet` · `matsmältn` · `nacke` · `rygg` · `leder` ·
`artros` · `hållning` · `skonsam` · `skonar` · `avlastar` · `belastning` ·
`veterinär` · `hälsosam` · `nyttigare` · `bättre för` · `ergonomisk`.

✅ Det som är sant och räcker: skålarna står stadigt, maten hamnar inte på
golvet, rostfritt går i diskmaskin, förvaringen tar ingen extra golvyta, och
höjden går att välja efter hunden. Beskriv MEKANIKEN och låt kunden dra
slutsatsen.

### ☠️ PAKETMÅTTET ÄR FEL ÅT BÅDA HÅLLEN — inte bara otillräckligt

#266 säger att vikt och paketmått inte BEVISAR två produkter. Runda 97 mätte
upp att det är värre än så: paketmåttet ger både falska positiva och falska
negativa.

Regexen tog första `NN × NN × NN cm` i den tyska texten. Produktmåttet skrivs
`60L x 30B x 35,5H cm` — med bokstäver emellan — så det matchade aldrig, och
det som fastnade var `Paketmått`.

| id | produktmått | paketmått |
|---|---|---|
| `79ccfef4` | **60 × 30 × 35,5** | 70 × 36 × 17 |
| `9cfc2f50` | **60 × 30 × 35,5** | 70,5 × 38 × 15,5 |

Två identiska produkter, två olika kartonger. `79ccfef4` låg i rundans första
urval just för att paketet skilde. Åt andra hållet grupperade paketmåttet ihop
produkter som bara råkar dela kartong.

☠️ **Läs `Gesamtabmessungen` / `Gesamtmaße`, och räkna med att formen varierar:**

```python
m = re.search(r"Gesamt(?:abmessungen|maße|abmessung)\s*:?\s*([^✔]{0,48})", t, re.I)
tal = m and re.search(r"(\d+(?:[,.]\d+)?)\s*[LlBbHhTt]?\s*[x×X]\s*"
                      r"(\d+(?:[,.]\d+)?)\s*[LlBbHhTt]?\s*[x×X]\s*"
                      r"(\d+(?:[,.]\d+)?)", m.group(1))
```

⚠️ Och i en familj med ett gemensamt fotavtryck räcker inte två tal.
Foderstationerna delar 60 × 30 på fjorton av 26 utkast; det som skiljer
modellerna är HÖJDEN, skåpsvolymen och skålarna. En måttjämförelse måste läsa
alla tre talen.

### ☠️ EN REGEL SOM MÄTER SIN EGEN NORMALISERING FÄLLER ALDRIG

Runda 96 lärde att två läsformer som ser lika ut svarar på olika frågor.
Runda 97 hittade nästa steg i samma familj, och det är farligare.

Regeln "inga dubbla blanksteg" låg bland de förbjudna mönstren, och de körs på
den taggstrippade texten — som normaliserar `\s+` till ETT blanksteg först.
Regeln letade alltså efter något som borttagits en rad tidigare. Den kunde
aldrig fälla, och självtestet visade det bara för att självtestet fanns.

☠️ **Skillnaden mot runda 96:s fall:** där gav blandade läsformer FALSKA
TRÄFFAR, som syns direkt. Här gav den TYSTA MISSAR, som inte syns alls.

**Regeln: en kontroll som handlar om blanksteg, radbrytningar eller
taggstruktur ska köras på den RÅA html:en.** Bara innehållsregler får läsa
den normaliserade texten.

### ⚠️ EN MUTATION SOM INTE MUTERAR RAPPORTERAS SOM ETT HÅL I GRINDEN

Mutationstestet bytte `förvaring` mot `Stauraum` för att bevisa att
tyska-regeln biter. Två av sex texter innehåller inte ordet — mutationen blev
en no-op, texten var oförändrad och korrekt, och testet skrev ut
`SLAPP IGENOM` om en grind som var helt frisk.

Tio minuter gick åt att leta efter felet i regeln. Felet fanns i mutationen.

**Regeln: en mutation ska bytas mot något som står i ALLA texter den körs på,
och ett `SLAPP IGENOM` ska först misstänkas vara en trasig mutation.** Ett
billigt skydd är att låta mutationen kräva att den ändrade något:
`assert ny != h0`.

### ✅ VÄLJ FAMILJ PÅ FÖRHÅLLANDET UTKAST/PUBLICERADE, inte på antal utkast

Katalogen svept 2026-09-07: 5 527 produkter, 3 299 utkast, 2 228 publicerade.

| familj | utkast | publicerade | vad talet betyder |
|---|--:|--:|---|
| växthus | 103 | 27 | mycket kvar, men tät |
| sittbänk | 68 | 100 | fler publicerade än utkast — högsta krockrisk |
| badrumsskåp | 68 | 51 | ser ut som en annan sessions område |
| **foderstation** | **26** | **0** | orörd |

Den största familjen är sällan den bästa. En familj med **noll publicerade
sidor** ger noll sökordskrockar, noll måttvillingar mot katalogen — och,
sedan runda 96, ingen möjlighet att ett redan publicerat färgsyskon räknas
fel. Det är den billigaste rundan som finns.

⚠️ Nio publicerade `badrumsspegel-led-*` och sju `spegelskap-*` är ett mönster,
inte en slump: det är någon annans pågående arbete. #302 kostade en halv runda
när den andra sessionen publicerade sex sidor mitt i.


### ☠️ `products/query`:s MARKÖR FLYTTAR SIG INTE — svep måste gå via `search` (2026-09-08)

Runda 104 skulle hitta tre utkast på deras id-prefix och lät ett svep paginera
`POST /stores/v3/products/query`. Svepet rapporterade **"2 000 rader lästa på
40 sidor, noll träffar"**. Talen var påhittade av API:t: varje sida var samma
50 rader.

Kontrollmätningen, tre anropsformer mot samma första sida:

| form | första id | sista id | ny markör |
|---|---|---|---|
| sida 1 (filter + limit) | `ca3d32d0` | `b8d21670` | = markören |
| markör **+** filter + limit | `ca3d32d0` | `b8d21670` | = markören |
| **BARA** markören | `ca3d32d0` | `b8d21670` | = markören |

Ingen form flyttar den. ☠️ **`query` kapar dessutom `limit: 100` till 50** utan
att säga något.

✅ **`products/search` gör rätt — och den ERRAR HÖGT när anropet är fel:**

```
400 SE-1141  Invalid usage of cursor paging:
             Search, filter and aggregations cannot be specified together with cursor
```

Alltså: skicka `filter` bara på FÖRSTA sidan, därefter **enbart**
`cursorPaging.cursor`. Så gjort läste svepet **3 158 unika utkast på 32 sidor**
— och `unika == lästa` är kontrollmätningen som skiljer ett svep från fyrtio
kopior av sida ett. `search` respekterar också `limit: 100`.

**Regeln, en variant på husets vanligaste: ett svar utan fel är inget kvitto —
och ett svar med PLAUSIBLA TAL är det inte heller.** Ett svep måste räkna
UNIKA rader, aldrig summan av sidornas längder.

### ☠️ `bulk/categories/add-item` kräver `treeReference` (2026-09-08)

Utan fältet svarar Wix `400 treeReference must not be empty`. Formen är
`{ "appNamespace": "@wix/stores" }` och går att läsa ur vilken kategori som
helst i `POST /categories/v1/categories/query`. Hela kroppen:

```json
{ "treeReference": { "appNamespace": "@wix/stores" },
  "item": { "catalogItemId": "<produkt-id>",
            "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
  "categoryIds": ["<kategori>", "<kategori>"] }
```

⚠️ Och `directCategoriesInfo` SLÄPAR: två av tre produkter visade bara
`All Products` i en återläsning i SAMMA anrop som skrivningen, trots
`totalSuccesses: 2`. En egen läsning en halv minut senare visade alla tre
kompletta. Det är samma fälla som redan står som "en återläsning direkt efter
en KATEGORI-skrivning kan ljuga NEGATIVT" — mätt igen, och den gäller.

### ⚠️ Ritningen ska läsas av i FÖRSTORING, aldrig på ett kontaktark (2026-09-08)

Runda 104:s Aprilia-ritning bär sitsens mått som en orange etikett. På ett
kontaktark i 300 px gick den att läsa som **`36cm`**; en förstoring av samma
ruta visar **`35cm`** — samma tal som spec-blocket. Talet hade annars stått
fel på både sidan och spec-kortet, och kortets värde härleds ur sidans
spec-tabell, så FELET HADE SETT KONSEKVENT UT.

Kontaktarket duger för att se VAD en bild föreställer och om den bär tysk
text. Det duger inte för att läsa en siffra.

### ✅ Saknas ritningen: fotot duger som andra källa — för PROPORTIONER (2026-09-08)

Runda 104:s fyrhjuling hade ingen måttritning alls, alltså exakt det läge där
runda 103 hittade ett spec-block **kopierat från en annan modell**. Utan andra
källa går det ändå att pröva blockets inre logik mot studiobilden:

| | |
|---|--:|
| hjulets andel av produktens höjd i bilden | ~47 % |
| specens 36 / 73 cm | 49 % |

Talen hör ihop inom perspektivfelet, så blocket hör till den här modellen.
⚠️ **Metoden ger bara ett FÖRHÅLLANDE.** Den kan avslöja ett block som gäller
en annan modell; den kan aldrig bekräfta ett absolut mått.





-----

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.