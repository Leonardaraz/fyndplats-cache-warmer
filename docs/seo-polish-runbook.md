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
- **`VARIANTS_INFO` finns inte i enum:et** (varianterna kommer med ändå). Giltiga värden:
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
- ☠️ **Mappningsraden nås inte via Wix Data längre.** Den bor i Postgres sedan
  2026-09-01 och `FyndplatsMappings` är tömd. Läs och skriv den med workflowen
  **Polering — läs och stämpla mappningsraden** (Steg 3 och 13). De gamla
  fallgroparna här — eventually consistency och "typade" värden
  (`setFieldOptions.value = {boolValue:false}`) — gäller inte den vägen: rutten
  läser tillbaka och verifierar att skrivningen faktiskt tog.
- En PATCH är partiell **på fältnivå i produkten** — men skicka alltid `visible` explicit
  (Steg 13), och rör aldrig `options`/`variantsInfo` om du inte menar att ändra varianterna.

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
> Sluggen är filtrerbar (`name` är det INTE). Träff, eller en produkt du vet ligger nära → **separera med en kvalificerare som står i BÅDE namn, slug och titel**, inte bara i texten. Fungerande exempel: `arbetsstol med hjul` vs `sadelstol med ryggstöd` · `konstgjord julgran` vs `konstgjord julgran med pynt` · `litet växthus` vs `växthusduk` · `elmotorcykel barn` vs `elmotorcykel 6v barn` vs `eldriven trehjuling barn`. Är produkterna i praktiken samma vara → det är en dubblett, inte ett sökordsproblem: flagga till Leonard.

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

> 🔎 **Oifyllda mall-platshållare är en varningsflagga för hela bildserien.** Samma produkt
> hade rubriken *"aberturas de: **-XX-XXcm**"* rakt ut i produktion. Ser du en sådan: sluta
> lita på siffrorna i den serien och verifiera var och en.

> 🔒 **Rättelsen går in i löptexten, aldrig som brasklapp.** Skriv den sanna uppgiften i
> stycket och i spec-tabellen — inte *"leverantören påstår X men…"*.

**Rapportera fyndet till Leonard.** Samma leverantör och samma modellserie bär oftast samma fel.

-----

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

- **Bra struktur:** ingress → **Egenskaper** (`<p><strong>Egenskaper</strong></p>` + `<ul><li>…</li></ul>`, inline) → *(vid behov: en kort passar-det-dig-rad, se nedan)* → `<h2>Tekniska specifikationer</h2>` → `<h2>Användning och skötsel</h2>` (valfritt) → `<h2>Vanliga frågor</h2>` (FAQ-frågor som feta `<p>`-stycken **i beskrivningen** — INTE egna info-sektioner, taket är 400).

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


-----

## Steg 8 – Re-synka SKU till den nya sluggen (1 anrop, mutation)

Importen byggde SKU:n ur den **råa** (engelska, märkesledda) sluggen, t.ex. `FP-2-4g-remote-control-1-st`. När du bytt slug i Steg 7 stämmer den inte längre — re-synka den så den matchar den **polerade svenska** sluggen, t.ex. `FP-radiostyrd-gravmaskin-1-st`. Ofarligt: synk/fulfillment nycklar på `wixVariantId`, inte på SKU-strängen (se SKU-noten i *Fasta fakta*).

**SKU-format** (= `lib/import/sku.ts`): `FP-<produkt>-<variant>` ur den **polerade sluggen** + variantens optionsvärde. ASCII (å/ä→a, ö→o), ledande **dropship-märke strippat** (etablerade märken som Pagani Design/LAIKOU behålls), produkt-delen **≤24 tecken** (kapa på bindestreck), variant-delen **≤12 tecken**, hela **≤40 tecken**, **unikt inom produkten**. Saknar produkten optionsvärden → bara `FP-<produkt>`.

```
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

Samma regel gäller varje PATCH i Steg 8–11: **skicka alltid produktens `visible` explicit**,
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

**Verifiera:** nya SKU:n innehåller varken engelska råord eller **dropship-märke** och matchar sluggen. (Etablerade märken som Pagani Design/LAIKOU **behålls** i SKU:n – se märkesregeln i *Fasta fakta*.)

-----

-----

## Steg 9 – Bilder: ordning, alt-texter och egna kort

Rå-importen ger fem bilder med leverantörens egen titel som alt-text på allihop. Byt alla
till svenska som beskriver **det som faktiskt syns** — motiv, färg, vinkel, miljö — med
fokussökordet naturligt invävt. Inte samma mall × 5.

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

☠️ **`UploadImageToWixSite` svarar `success: true` även när uppladdningen sedan
MISSLYCKAS.** Svaret bär `operationStatus: "PENDING"` — Wix har tagit emot uppdraget, inte
utfört det. Patchar du in ett `fileId` som hamnat i `FAILED` svarar V3 200 och **utelämnar
item:et** tyst; du märker det när galleriet gått från 6 bilder till 5. Kontrollera före
PATCH:en med ett `curl` mot `…/v1/fill/w_400,h_400,al_c,q_80/f.jpg`: **200 = klar,
403 = inte klar.** Håll filerna små — 1600² på ~200 kB går igenom där 2000² på 380 kB föll.

### Bilden måste vara kvadratisk

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
| Ren textinfografik utan foto | Ta bort — informationen hör hemma i spec-tabellen |

**Behåll så många ANVÄNDBARA bilder som möjligt** *(Leonard 2026-07-10)* — en rik produktsida
säljer mer än en med tre bilder. Släng bara exakta dubbletter och bilder utan visuellt värde.
Leverantörens feature-collage **byggs om** till svenska kort, kastas inte.

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

### Verifiera på den renderade sidan — men läs cache-huvudena

☠️ **Läs `<title>` och `<meta name="description">`, inte bara brödtexten.** Sidans huvud och
sidans kropp kommer från **två skilda fält** — `seoData` respektive `plainDescription` — och
kan mycket väl vara på olika språk. Fyra bänkar i batch 55 (2026-09-02) gick igenom hela min
kontrollistan och låg ändå ute med tysk titel:

| Kontroll | Utfall |
|---|---|
| HTTP-status | 200 |
| `<h2>`-räkning | 7 (rätt) |
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

🔍 **Svepa hela katalogen efter tyska rester:** läs `seoData`-taggarna `title` +
`meta description` för varje `visible`-produkt via `products/search` (markörsidor om 100) och
testa mot en lista tyska ord. Mätt 2026-09-02 efter rättningen: **1 597 publicerade produkter,
noll tyska titlar, noll utan titel.**


⏱️ **ISR-fönstret är 300 s.** En re-GET mot Wix bevisar inte att butiken hunnit med.

☠️ **Hämta ALDRIG sidan i samma andetag som publiceringen.** Wix slug-index ligger några
sekunder efter skrivningen; hinner butiken före indexet renderar den sin fallback, och just
det svaret sparas i fem minuter. Sidan ser trasig ut fast produkten är korrekt.
*(Sängbänken `8da26d68` 2026-08-26: publicering och `curl` låg under en sekund isär.)*

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
- **`Användning och skötsel` är inte valfri när varan har skötsel.** Textil, tält, trä och
  allt som ska tvättas, torkas eller efterdras ska ha fliken.
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


-----

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.