# Fyndplats – SEO-optimera en produkt (runbook, inga uppslag behövs)

> Detta är en **körbar** instruktion. Följ stegen i ordning med de färdiga API-anropen nedan. Du behöver **inte** slå upp något schema (`SearchWixAPISpec`) – allt format är redan bekräftat och ifyllt.

## Fasta fakta (gäller alltid)

- Butik: **Fyndplats**, site ID `e6d27e90-4749-4720-9afe-0bbe91c1b3d3`, **Catalog V3** (default). (V1-siten `8c62127f-…` ska INTE användas.)
- Allt innehåll skrivs på **svenska**.
- **Märken – strippa dropship-husmärken, BEHÅLL etablerade märken** (Leonards beslut 2026-06-21). Råimporten lägger märkesnamnet först i `name`/titeln.
  - **Dropship-husmärken** (SucceBuy, Pawhut, HOMCOM, VEVOR, Outsunny, Giantex, Costway, Tobbi, Aosom … = strip-listan i `lib/import/sku.ts`): ta bort **helt** – ur produktnamn (H1), SEO-titel, meta description, slug, sökord och alla bild-alt-texter – och låt det generiska sökordet stå först.
  - **Etablerade tredjepartsmärken med eget sökvärde** (t.ex. **Pagani Design**, **LAIKOU**): **behåll** märket i name/titel/slug/sökord/SKU – det har eget sökvärde. Lägg det generiska sökordet bredvid (t.ex. `Pagani Design 007 – automatklocka herr`). Dessa märken ligger medvetet **inte** i strip-listan, så SKU-algoritmen behåller dem automatiskt.
  - Sätt **inga** separata märkesfält. Behålls märket: lämna ev. `brand`-fält. Strippas märket och ett gammalt `brand`-fält finns ifyllt: rensa det i samma Steg 7-PATCH (`"brand": null`).
  - Osäker på om ett märke är husmärke eller etablerat? **Behåll det och flagga till Leonard.**
- 🔒 **Bildpolering rör bakgrunden, aldrig varan** (Leonards regel 2026-08-06). Vi tvättar bort det som är **pålagt i bildfilen** — overlay-text, banderoller, vattenstämplar, callouts, rörig bakgrund. Varan själv ska synas exakt som kunden får den: form, färg, ytfinish, alla delar, och **loggor som sitter fysiskt på produkten** (tryckta/graverade/gjutna — både Pagani Design på urtavlan och VEVOR på en paviljongduk).
  - **Ett husmärke på varan är inget problem och ska inte flaggas** (Leonards beslut 2026-08-06): *"om märket sitter fysiskt på varan så gör vi inget åt det, det är så produkten ser ut."* Märket strippas ur texten enligt märkesregeln ovan, men på godset får det sitta kvar. Ingen retusch, ingen flagga, ingen sortimentsåtgärd — gå vidare.
  - **Avgörande-test:** skulle det synas om du fotade varan själv efter uppackning? → rör den inte. Syns det bara för att någon lagt på det i efterhand? → tvätta bort. Osäker → utgå från att det sitter på varan och flagga.
  - ⚠️ **Regeln bryts nästan alltid av misstag, inte med flit.** Ingen retuscherar bort en logga med vilje — men **för snäv beskärning kapar produktens kanter** (barncykelns hjul, 2026-07-09), **`rembg` äter tunna delar** (kablar, smala ben, genomskinliga partier), och en bandbeskärning som ska ta bort text kan skära in i varan. Resultatet är detsamma: kunden ser en annan produkt än den som kommer. Granska därför ALLTID med `Read` — helhet **och** inzoomat på varje kant — innan bilden går upp. Detta är det verkliga skälet till granskningskravet i Steg 9.
- Frontend är headless Next.js/Vercel och uppdateras automatiskt via ISR – **ingen redeploy**.
- **Verifierat (2026-06-05):** frontend läser `seoData`-taggarna `title` + `meta description` → de blir sidans `<title>` och meta. `Product`-JSON-LD (namn, pris, lager, betyg) och OpenGraph **genereras automatiskt** av frontend från produktfälten – du behöver alltså INTE sätta `og:`-taggar i `seoData`.
- `ExecuteWixAPI` kräver godkännande. Skriv `fields` i request-**body** vid query/PATCH. **Läs om `revision` precis före varje PATCH.** API-svar är plain strings (skriv ändå `v?.value ?? v`).
  - ⚠️ **`fields`-fällan.** På **GET** fungerar ett enkelt `?fields=X` och repeterade params `?fields=A&fields=B`. En **kommaseparerad lista** (`?fields=A,B,C`) 400:ar med det missvisande `Failed to parse JSON or deserialize protobuf message` — felet ser ut att handla om bodyn, men det är URL:en. På **query**-endpointen ligger `fields:["A","B"]` i bodyn.
  - **`VARIANTS_INFO` finns INTE i enum:et** (varianterna kommer med ändå, utan att begäras). Giltiga värden du oftast vill ha: `PLAIN_DESCRIPTION` · `DESCRIPTION` · `MEDIA_ITEMS_INFO` · `DIRECT_CATEGORIES_INFO` · `VARIANT_OPTION_CHOICE_NAMES` · `URL` · `INFO_SECTION` · `BREADCRUMBS_INFO`. Skickar du ett ogiltigt värde listar felsvaret hela enum:et — läs det i stället för att gissa vidare.
  - ⚠️ **`fields` måste med på VARJE cursor-sida.** `cursor` får inte samsas med `filter`/`sort` (→ `400 INVALID_CURSOR`), men `fields` är tillåtet och **måste** upprepas. Utelämnar du det på sida 2+ kommer fältet tillbaka **tomt i stället för att fela** — ett katalogsvep över 8 sidor rapporterade då 650 produkter med noll bilder, inklusive produkter som just patchats till 5. Tyst fel, trovärdig siffra: verifiera alltid mot en produkt du vet svaret för innan du litar på ett svep.
- **Rör inte priset.** Importen sätter priset (se avrundningsregeln nedan) och prissättningen är Leonards beslut, inte poleringens. Räkna ingen marginal och höj inget pris på eget bevåg. *(Marginalgrinden togs bort 2026-08-12 på Leonards begäran.)*
- **Mappningsraden i `FyndplatsMappings`** (samma `_id` som produktens Wix-id, hämtas med `POST /wix-data/v2/items/query`) bär `shipsFromCountries`, `warehouseClass`, `supplierName` och `variants[].shipFrom`. De styr **EU-lager-ribbonen** och failover-logiken — de ska **aldrig skrivas ut i produkttexten**.
  - ⚠️ **Raden överlever en omskriven beskrivning om du bygger spec-tabellen ur den råa.**
    Nio publicerade produkter bar `Skickas från · Spanien/Polen` som sista rad i spec-tabellen
    2026-08-27 — inte för att någon skrev in den, utan för att den råa spec-listan användes som
    mall och sista raden aldrig ströks. Sök på `Skickas från` i `plainDescription` i slutkollen;
    ribbonen är den enda plats där avsändarlandet får synas.
  - 🔒 **Skriv ALDRIG ut avsändarland eller lagerland** (Leonards regel 2026-08-15) — inte i beskrivningen, inte i spec-tabellen, inte i meta. Råimporten lägger ofta in en rad *"Skickas från: Polen"* i spec-listan; den **stryks** när du skriver om beskrivningen. Kunden köper av Fyndplats, och ribbonen säger redan det som betyder något: att leveransen går från EU. *(Raden här sa tidigare motsatsen — att lagerlandet skulle stå i spec-tabellen — och stod kvar i strid med regeln till 2026-08-22.)*
  - ⚠️ **Raden är eventually consistent.** En `query` direkt efter en skrivning kan ge de GAMLA värdena — skrivningen gick ändå fram. Läs om efter ett annat anrop innan du drar slutsatsen att PATCH:en inte bet, och **skriv aldrig om den med ett "typat" värde** (`setFieldOptions.value = {boolValue:false}`): docs-artikelns HTTP-exempel visar den formen, men gatewayen sparar då wrapper-objektet ordagrant och fältet blir `{boolValue:false}` i stället för `false`. Otypat värde (`value: false`) är rätt. *(Korrumperade `needsAiPolish` 2026-08-22; rättades med en full `PUT /wix-data/v2/items/{id}`.)*
- En PATCH är partiell: **bara fält du skickar ändras**. Skicka aldrig `options`/`variantsInfo` om du inte avser röra varianterna.
- **Priser slutar på 9, inga decimaler.** Importen sätter redan priset till hela kronor som avrundas **uppåt** till närmaste tal som slutar på 9 (t.ex. 499, 489, 579) — **ingen `.90`**. Ändrar du ett pris: avrunda alltid **uppåt** till närmaste 9-slut och skriv hela kronor (aldrig `,90`).
- **SKU sätts automatiskt vid import** (`FP-<produkt>-<variant>`, t.ex. `FP-temperingsmaskin-choklad-17-l`) och syns i kassan/Google/feed. Importen **strippar märkesordet** (HOMCOM/SucceBuy/VEVOR …) men bygger SKU:n ur den **råa** sluggen — så när du byter slug i Steg 7 ska du **re-synka SKU:n** till den nya svenska sluggen, se **Steg 8**.
  - **SKU:n är en ren etikett — den parsas aldrig tillbaka.** Synk och fulfillment nycklar på **`wixVariantId` → `supplierVariantId`** (lagrad mapping i `lib/sync/aliexpress-sync.ts` + `lib/orders/tasks.ts`), **inte** på SKU-strängen. Att döpa om en SKU bryter alltså INTE leverantörskopplingen — formatet är fritt (krav: ≤40 tecken, unik inom produkten).
  - **Måste du ändå byta en variants SKU live:** skicka `options` **+** `variantsInfo` **verbatim** (som de kom från GET, ändra bara `sku`) + färsk `revision`. Skickar du `variantsInfo` utan `options` på en produkt med varianter → V3 svarar **428 `MISSING_OPTIONS_ON_UPDATE_VARIANTS`**. (En produkt helt utan optioner behöver inte `options`.)
  - ☠️ **Varje variantobjekt ERSÄTTS i sin helhet — det slås inte ihop (2026-08-14).** PATCH:en är partiell på **fältnivå i produkten**, men inuti `variantsInfo.variants[]` gäller motsatsen: skickar du `{id, price}` för att bara ändra priset svarar Wix `200 OK` och **raderar variantens `sku` och `media`**. SKU:n är etiketten kunden, kassan och feeden ser — och den måste dessutom matcha mappningsraden. **Regel: läs varianten med GET, ändra bara det fält du menar, och skicka tillbaka hela objektet verbatim.** Upptäckt vid omprissättningen av sidobordet `c9a0f88d`; `sku` gick att skriva tillbaka, men variantens `media`-pekare tog Wix inte emot igen (harmlöst där, eftersom produkten saknar optioner — men på en produkt med färgval hade bildbytet varit borta).
  - ⚠️ **Spegelvändningen gäller också: `options` utan `variantsInfo` 428:ar.** *"Variant choice not found in product options"* — Wix jämför de skickade optionerna mot de lagrade varianterna och hittar ingen koppling. **De två fälten reser tillsammans eller inte alls.** Vid en ren bild-PATCH på en produkt med optioner: skicka bara `media` + `revision` + `visible`, aldrig `options` "för säkerhets skull". Kontrollera först att `linkedMedia` är tomt på alla choices — är det det, finns inget att förlora på `linkedMedia`-fällan (2026-08-14, IMILAB-babyvakten).

**Input:** Wix-produkt-ID (+ ev. AliExpress-URL).

-----

## Aosom-produkter: vad som skiljer (läs detta först om raden har `supplier: "aosom"`)

De fjorton stegen gäller oförändrade — ordningen, spärrarna och klart-kriteriet är
leverantörsoberoende. Men **fyra saker skiljer**, och alla fyra sparar tid om du vet dem
innan du börjar i stället för att upptäcka dem i steg 9. Kolla leverantören först:
mappningsradens `supplier`-fält, eller prefixet `aosom:` i `supplierProductId`.

### 1. Bilderna: titta på 3, 8 och 9 — hoppa över 1 och 2

Importen tar hem exakt fem bilder, från feedens positioner **1, 2, 3, 8 och 9**
(`RENA_BILDPOSITIONER` i `to-product.ts`). Urvalet är gjort för att **46 % av feedens
bilder har TYSK TEXT INBRÄND i pixlarna**, och mätningen bakom det (30 produkter,
269 handgranskade bilder) säger var texten sitter:

| galleriplats | feedposition | vad mätningen visade |
|---|---|---|
| 1 | 1 | **30/30 rena** — huvudbild på vit botten. Granska inte. |
| 2 | 2 | **30/30 rena** — livsstilsbild. Granska inte. |
| 3 | 3 | 23/30 — måttritning, ofta bara siffror, ibland tysk rubrik i ett band |
| 4 | 8 | 24/30 — detaljfoto, men ibland en tysk marknadsgrafik |
| 5 | 9 | 27/29 — detaljfoto |

**Kontaktkartan i Steg 4 behöver alltså bara avgöra tre bilder.** Utfallet varierar
kraftigt: tunneltältet `e4b000fa` hade tysk text på tre av fem, de två infravärmarna
(`9c7c6e95`, `96a45e2b`) på noll. Siffrorna i ritningarna är dessutom redan skrivna med
**decimalkomma** (`5,3 m`, `104,6 cm`), så en ren måttritning går rakt in i galleriet.

Sitter texten i ett **band** upptill eller nedtill: beskär bort bandet
(`ck.crop`) i stället för att kasta bilden — det räddade både måttritningen och
uppsättningsbilden på tältet. Är hela bilden en marknadsgrafik: klipp ut delfotona och
bygg ett eget svenskt kort av dem (`ck.card_grid`), så blir en tysk infografik tre
detaljbilder med svenska etiketter.

☠️ **Aosoms livsstilsbilder är SAMMA SCENER med olika produkt inklistrad.** De två
infravärmarna delade tre scener rakt av — samma mormor i samma rottingsoffa, samma
uterum med samma snö. Polerar du syskon: **fördela scenerna** så att våra egna sidor inte
speglar varandra. Två egna URL:er med identiska foton är precis den dubblett Google
straffar, och den uppstår här av oss själva, inte av leverantören.

### 2. `Lieferumfang` är kontraktet — titeln är marknadsföring

Steg 5 gäller som vanligt, men för Aosom vet du var sanningen bor. Den tyska
beskrivningen har tre block, och de är inte lika mycket värda:

- **`Lieferumfang:`** — vad som faktiskt ligger i kartongen. Auktoritativt.
- **`Technische Daten:`** — måtten. Auktoritativt, och **enda källan**: feedens
  `Specification`-kolumn är tom i 5 550 av 5 566 rader.
- **Titel, `Beschreibung:` och alt-texterna** — marknadsföring, och de motsäger de andra
  två. Infravärmaren `9c7c6e95` hade `Schutzhülle` i både titel och alt-text; dess
  `Lieferumfang` listar bara värmare och bruksanvisning. Det är syskonet `96a45e2b` som
  har höljet. Hade titeln fått bestämma hade vi lovat en kund ett tillbehör som inte kommer.

Kapacitetspåståenden ska mätas, inte kopieras: tältet hette "4 Personen" medan
tillverkarens egen skiss sa "Schlafplätze 2–4". Sovrummet är 295 cm brett, alltså fyra
liggunderlag à 60 cm med 55 cm över — **skriv måttet, inte marknadssiffran.**

### 3. Tre steg är no-ops — och ett kräver extra kontroll

| Steg | För en Aosom-rad |
|---|---|
| 6 (variantsanering) | Nästan alltid en enda variant utan optioner. Inget att ta bort. |
| 11 (`linkedMedia`) | Inga optioner → inget att koppla. |
| 14 (recensioner) | **Helt AliExpress.** `isAliExpressMapping` är falsk, hämtningen körs aldrig. Hoppa över. |
| 7 (spec-tabellen) | ⚠️ **Extra kontroll:** `Färg`-VÄRDET är kvar på tyska i den svenska tabellen (`Färg: Orange+Blau`). Etiketterna översätts vid import, värdena inte, och färg-grinden ser bara variantaxlar — alltså fångar ingen spärr det här. Översätt värdet för hand. |

### 4. Stäm av priset mot mappningen innan du börjar

`grossSek` ska vara `charm9(landedCostSek × 1,20)`. Räkna efterː 2 869,76 × 1,20 = 3 443,7
→ 3 449. Stämmer det inte är produkten en av dem vars kostnad ändrats sedan importen, och
priset i Wix är gammalt (prissynken skrev aldrig till Wix förrän 2026-08-29 — se
`CLAUDE.md`). **Rör inte priset**; välj en annan produkt och flagga raden till Leonard.

`aosomFreightShare` på mappningen säger hur mycket av inköpet som är frakt. Över 0,5
betyder att frakten kostar mer än varan — de produkterna poleras sist.

-----

-----

## Arbetsordning

Kör i denna ordning. **Publicering ligger sist** — allt annat verifierat först.

| # | Steg | Vad |
|---|---|---|
| 1 | Sökord | Preliminärt; låses i Steg 7 efter bildkollen |
| 2 | **Laglighetsgrind** | Får produkten alls säljas? Före allt arbete |
| 3 | Läs produkten | GET: `revision`, `name`, `slug`, `seoData`, `visible`, `media` |
| 4 | Bildgenomgång | Kontaktkarta av HELA galleriet — styr sökord, copy, alt-texter |
| 5 | **Verifiera leverantörens påståenden** | Stäm av text mot bilder och tillverkarens egen sida |
| 6 | Variantsanering | Ta bort döda/slutsålda innan du skriver copy |
| 7 | Text | namn, slug, `seoData`, beskrivning |
| 8 | SKU | Re-synka till den nya sluggen |
| 9 | Bilder | Alt-texter, tvätt, hjälte, kort |
| 10 | Kategori | Förälder **+** löv |
| 11 | Varianter | `linkedMedia` + slutkoll |
| 12 | **Läs sidan som kund** | Inte som kontrollant |
| 13 | Publicera | `visible:true` — sista handlingen |
| 14 | **Recensioner** | Skriv om till svenska, kontrollera bilddomänen |
| — | Klart-kriterium | Körs före Steg 13 |

**Fördjupning ligger i egna filer:** [`polish/bildmetoder.md`](polish/bildmetoder.md)
(alla hjälte-/tvätt-/kortmetoder) och [`polish/varianter.md`](polish/varianter.md)
(PATCH-mekanik för varianter). Reglerna står här — mekaniken där.

**Utanför den här ordningen** ligger [katalogsvepen](#katalogsvep--återkommande-underhåll-inte-per-produkt)
sist i dokumentet: två periodiska kontroller över HELA katalogen, inte moment i en
enskild polering.

-----

> 🗂️ **Poleringskön ljuger — verifiera mot Wix innan du väljer produkt.** `needsAiPolish` nollställs inte alltid när en produkt polerats, så kön blandar riktigt råa utkast med sedan länge färdiga produkter. 2026-08-11 låg 49 poster i kön varav bara **13 var verkligt opolerade**; resten var publicerade produkter med kvarglömd flagga. Filtrera därför på `visible === false` **och** att namnet saknar å/ä/ö innan du tar "nästa". Nollställ flaggan (`needsAiPolish:false`, `draftStatus:"published"`) som sista steg efter publicering, annars kommer produkten tillbaka i kön.
>
> ⚠️ **Läs om produkten precis innan du börjar — någon annan kan ha hunnit före.** Arbetsstolen `7e730857` stod som rå engelsk draft i kölistan och var fullt polerad och publicerad fyrtio minuter senare, utan att den här sessionen rört den. Hämta alltid `name` + `visible` på nytt i Steg 3 i stället för att lita på listan du hämtade tidigare.

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

## Steg 2 – Laglighets- och säkerhetsgrind (före allt annat arbete)

**Kör den här FÖRE bildarbete och copy.** Tre produkter raderades under sessionen 2026-08-10/11 efter att de redan var halvpolerade — grinden hade sparat hela det arbetet. Gäller bara produktklasserna nedan; känner du inte igen någon av dem, gå vidare till Steg 3.

- **Djurbostäder (burar, hus, inhägnader)** → Jordbruksverkets föreskrifter **SJVFS 2019:15 (L80)**. Minimimåtten är bindande i Sverige, och de flesta AliExpress-burar är för små. Verifierade gränser:
  - **Fågelbur**, fåglar ≤20 cm: **0,31 m² golvyta**, **längsta sida ≥0,7 m**, **höjd ≥0,6 m**.
  - **Guldhamster:** **0,12 m² golvyta**, kortaste sida **≥25 cm**, höjd **≥20 cm**. Hjuldiameter **≥28 cm** (dvärghamster ≥20 cm).
  - **Kanin** (sällskap), golvyta per viktklass — ensam / per djur i grupp:
    | Vikt | Ensam | I grupp |
    |---|---|---|
    | ≤ 2 kg | 0,5 m² | 0,3 m² |
    | 2–3,5 kg | **0,7 m²** | 0,35 m² |
    | 3,5–4,5 kg | 0,8 m² | 0,40 m² |
    | 4,5–6 kg | 0,9 m² | 0,45 m² |
    | > 6 kg | 1,0 m² | 0,5 m² |

    Minsta höjd **0,5 m** (liten kanin) till **0,9 m** (stor). Utgå från **0,7 m²** när
    leverantören inte anger vikt — det är normalstor sällskapskanin. Marknadsför
    leverantören buren för "1–2 kaniner" gäller ändå 0,7 m² (2 × 0,35). Kaninen ska
    dessutom ha en **hylla** att sitta på och under (8 kap. 21 §) — men hyllan räknas
    inte in i ytan. *(Källa: Jordbruksverket, "Kaniner som sällskapsdjur"; måtten står i
    bilaga 1:3 till L80, som 8 kap. 10 § hänvisar till.)*
  - ⚠️ **Hyllplan och våningar räknas INTE** in i golvytan — bara bottenytan. Jordbruksverket
    skriver ut det uttryckligen. På en tvåvåningsbur räknas alltså markplanet, inte huset ovanpå.
    Kontrollera också höjden på varje delyta separat: en yta under ett upphöjt hus som bara är
    32 cm hög uppfyller inte höjdkravet och bör inte räknas med.
  - **Hobbyhöns:** ingen verifierad siffra ännu. Leverantörernas antalspåståenden är ofta
    orimliga — ett hönshus vars hushållsdel är 0,656 m² marknadsfördes för "10–15 höns"
    (2026-08-13, `28b359af`, parkerad). Publicera aldrig leverantörens antal utan att först
    kontrollera SJVFS 2019:15 respektive 2019:23.
  - Under gränsen → **importera/polera inte**. Radera produkten, markera mappningsraden `rejected` med den rättsliga orsaken, och berätta för Leonard varför. *(Två fågelburar 2026-08-10: 0,15 m² och 0,26 m², längsta sidor 44,5 cm och 52 cm. Tre kaninburar 2026-08-13: 0,179 m², 0,523 m² och 0,566 m².)*
- **Vapen och vapenrepliker** → stopp och flagga. Airsoft/soft air har 18-årsgräns, och polisen påpekar att repliker förväxlas med skarpa vapen. *(En 1:1-replik av en Glock 17 med `AUSTRIA`/`9x19`-gravyr och utan orange mynning raderades 2026-08-10.)*
- **Leksaker** → **EN71**-märkningen och **åldersgränsen** ska stå i produkttexten. Saknas certifieringen i leverantörsdatan: flagga hellre än att skriva ut en gissad märkning.
- **El till kroppen / medicintekniskt / kosttillskott** → flagga till Leonard i stället för att polera.

> Grinden är en **stopp**-kontroll, inte en textkontroll. Passerar produkten men har en säkerhetsrelevant begränsning (max vikt, åldersgräns, ej för trafikerad väg) → siffran hör hemma i **spec-tabellen**, och avgör den användningen skrivs den som ett **positivt villkor med egen rubrik** i Steg 7 — *"Från 14 år"*, *"Maxlast 120 kg"* — inte som en varning under en generisk rubrik. Inget varningsblock.

-----

- **Licensfigurer och skyddade kännetecken** → stopp och radera. Disney/Pixar, Marvel,
  Pokémon, Sanrio, Star Wars, Bluey och liknande på kalasartiklar, klistermärken och
  textil från anonyma AliExpress-butiker är olicensierad vara: varumärkesintrång
  (VmL 8 kap. 1 §) och upphovsrättsintrång (URL 7 kap. 53 §), plus tullbeslag och risk
  för avstängning hos Stripe och Google Merchant Center. **Det finns ingen version utan
  märket — märket är produkten.** *(Toy Story-kalaskit `7fce18bb` raderat 2026-08-23.)*
  Samma sak för **rödakorsmärket**: rött kors på vit botten skyddas av lag (1953:771)
  och Genèvekonventionerna, och till skillnad från ett varumärke finns ingen licens att
  köpa. Sitter det tryckt på varan går varan inte att sälja. *(Medicinskåp `dddaeac8`
  raderat 2026-08-23; syskonet `c72c97c3` med etsade gråa kors är däremot rent.)*


-----

## Steg 3 – Läs produkten (1 anrop, read-only)

```
GET https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}?fields=DESCRIPTION&fields=PLAIN_DESCRIPTION&fields=URL&fields=MEDIA_ITEMS_INFO
```

Spara: `revision`, nuvarande `name`, `slug`, `seoData`, **`visible`**, samt **hela `media`** (du behöver `media.main` + alla `media.itemsInfo.items` med deras `id`, `uploadId`, `image` till Steg 9).

> ⚠️ **Katalogsvep bränner Wix-kvoten — sidbrytningen är den dolda kostnaden.** Ett `ExecuteWixAPI`-anrop som bläddrar igenom hela katalogen (777 produkter, 100 per sida) är **åtta** REST-anrop, inte ett. Två–tre sådana svep i följd ger `Rate limit exceeded` i ungefär en kvart. Svep **en gång**, spara träffarna, och hämta sedan bara de produkter du ska röra med ett id-filter i **ett** anrop:
>
> ```js
> body = { query: { filter: { id: { $in: [ ...ids ] } }, cursorPaging: { limit: 100 } },
>          fields: ["PLAIN_DESCRIPTION"] }
> ```
>
> Samma sak gäller `/products/search`. Planera svepet så att det returnerar allt du behöver första gången — id, revision OCH textutdraget — annars får du betala hela sidbrytningen igen för att hämta det du glömde.

-----

-----

## Steg 4 – Titta på ALLA bilder FÖRST (innan du skriver något)

Chatten kan se bilder — **analysera galleriet innan du väljer sökord eller skriver copy**. Hämta en liten preview av varje galleribild:

```
curl -s -o <scratchpad>/img-01.jpg "https://static.wixstatic.com/media/{FILE_ID}/v1/fit/w_320,h_320,q_70/preview.jpg"
```

(`{FILE_ID}` = `image.url`:ens filnamn, t.ex. `b379ce_…~mv2.jpg`.)

> 💰 **Montera dem till EN kontaktkarta och `Read` den — inte N separata `Read`.** Ett galleri på 10 bilder blir 1 bild i stället för 10, med samma informationsvärde. Detta är den enskilt största tokenbesparingen i hela flödet. Hämta full upplösning **bara** för de bilder du faktiskt ska beskära eller bygga kort av.
>
> ```python
> from PIL import Image, ImageDraw
> import glob, math
> f = sorted(glob.glob("img-*.jpg")); k = math.ceil(len(f) ** .5); s = 340
> ark = Image.new("RGB", (k * s, math.ceil(len(f) / k) * s), (255, 255, 255))
> d = ImageDraw.Draw(ark)
> for i, p in enumerate(f):
>     im = Image.open(p).convert("RGB"); im.thumbnail((s - 20, s - 20))
>     x, y = (i % k) * s, (i // k) * s
>     ark.paste(im, (x + 10, y + 26)); d.text((x + 10, y + 6), f"{i+1:02d}", fill=(200, 60, 0))
> ark.save("kontaktkarta.jpg", quality=88)
> ```
>
> Numreringen på arket motsvarar ordningen i `media.itemsInfo.items`, så du kan hänvisa till "bild 04" rakt igenom hela poleringen.

Den visuella förståelsen styr **allt nedströms** — det är därför steget ligger först:

- **Fokussökordet (Steg 1):** bilderna avslöjar produktens exakta form/typ (t.ex. `sadelstol`, inte "arbetsstol").
- **Beskrivningen (Steg 7):** skriv utifrån det som faktiskt syns — material, detaljer, användningsmiljö — i stället för att gissa från rå-titeln.
- **Alt-texterna (Steg 9):** formuleras per bild utifrån denna granskning.
- **Huvudbilden:** notera om första bilden (= `media.main`, produktkortet) inte är den renaste produktbilden — byt ordning i Steg 9.
- **Tvätt-behov (Steg 9):** notera dropship-loggor, vattenstämplar, inbränd text (engelska/spanska/kinesiska), fel motiv och dubbletter.
- **Bakgrundsbyte (Steg 9):** notera vilka bilder som är rena produktbilder på ful/mörk/rörig bakgrund (→ vit hjältebild) vs nyttiga kontextbilder (behålls) vs infografik (bort/flagga).

-----

-----

## Steg 5 – Verifiera leverantörens påståenden

**Detta är det mest värdefulla steget i hela flödet.** Under sessionen 2026-08-22/23
bar **fem av åtta** produkter minst ett påstående som inte höll. Det är inte
undantag — det är normalläget för AliExpress-listningar.

| Produkt | Leverantören sa | Verkligheten |
|---|---|---|
| Espressomaskin H5A | 20 bar | 15 bar enligt tillverkarens sida **och** deras egna bilder |
| Kapselmaskin H2C | "Hot/Cold" | Tillverkarens egen genomgång: kall-läget gick aldrig att aktivera |
| Häcksax | "battery included" i texten | Spec-raden sa `Battery Included: no` — packbilden avgjorde |
| Häcksax | 18 V i titeln | **20 V** tryckt på batteriet i fem av åtta bilder |
| Pedaltränare | "Mini Electric Elliptical", "12 resistance levels" | Motordriven pedaltränare med 12 **hastigheter** — man trampar inte själv |
| Trallplattor | "waterproof", "resistente a la decoloración" | Akacia. Grånar i sol och tål inte att stå blött |
| Parasoll | "protección solar total" | Ingen UPF-siffra finns någonstans |
| Kompostkvarn | "106 dB for quieter performance" | 106 dB är motorsågsnivå — tystare än bensin, inte tyst |

> ⚠️ **Att leverantörens kort INTE nämner en egenskap bevisar ingenting.** Ryggsäcken
> `311c8c4e` (2026-08-26): leverantörens ryggpanels-kort visade EVA-skum, länddyna och
> luftkanaler, och nämnde aldrig någon ram. Jag drog slutsatsen "ingen aluminiumram" och skrev
> in den i brödtext, spec-tabell OCH FAQ — som skillnaden mot systerprodukten Rock 2.0.
> Tillverkarens egen sida hade ett kort med rubriken *"HIGH QUALITY FABRIC & ALUMINIUM FRAME
> STRUCTURE"*: ramen finns, den är **insydd** mot ryggpartiet. Den riktiga skillnaden mot
> Rock 2.0 var att dess ram är avtagbar.
>
> **Regel:** skriv aldrig ut en NEGATION ("saknar ram", "utan ventil", "ingen timer") på
> grundval av att leverantören inte nämnde den. Ett kort visar det säljaren valde att visa.
> En negation kräver samma verifiering som ett positivt påstående — helst tillverkarens
> specifikation.

**Arbetsgång:**

1. **Läs specen mot bilderna.** Leverantörens egna bilder motsäger ofta deras egen
   text, och bilderna vinner nästan alltid — de är fotograferade på den riktiga varan.
   Packbilden är den mest pålitliga källan till **vad som ingår i lådan**.
2. **Slå upp tillverkarens egen sida** när det finns ett modellnummer. Inte
   AliExpress-säljaren — tillverkaren. Deras produktguider är ofta förvånansvärt ärliga
   och avslöjar både siffror och funktioner som inte fungerar.
3. **Två källor som säger olika → ta den konservativa siffran** och skriv ut varifrån
   den kommer. *(H11 SR: titeln säger 20 bar, spec-tabellen 19 — vi skrev 19.)*
4. **Oförenliga uppgifter → utelämna helt.** Hitta inte på ett mellanting.
   *(H17: importen sa 4,43 kg, tillverkaren 3,0 kg brutto → vikten står inte på sidan.)*
5. **Superlativ utan siffra bakom sig upprepas aldrig.** "Total sun protection",
   "waterproof", "quieter performance" — antingen finns det ett mätvärde, eller så
   skriver vi inte påståendet.
6. **Marknadsföringsnamnet är inte produkttypen.** Kolla vad varan *är* innan du
   döper den. En 26 cm steglängd och sittande användning gör den inte till en
   crosstrainer, hur mycket leverantören än kallar den det.
7. **Skriv inte in hårdvarudetaljer som varken text eller bild stöder.** De två
   föregående reglerna handlar om att leverantören ljuger. Den här handlar om oss:
   en trovärdig liten detalj är lätt att skriva och nästan omöjlig att upptäcka i
   korrekturet, för den *låter* som något man läst i specen.
   `f0e0ee14` (smal hurts, 2026-08-26) fick "kullagrade skenor" i inledningen, en h2,
   spec-tabellen OCH meta description. Ingenstans i listningen stod det. Zoomar man in
   på leverantörens bild av de öppna lådorna syns tvådelade **vitlackerade
   rullskenor** — inte kullager (som är tredelade, olackerade och har synlig kulbana).
   Samma bild bar däremot belägg för allt annat i texten.
   **Regel:** varje mätvärde och varje mekanikord ska gå att peka på i en källa. Kan du
   inte peka — skriv det generiska ordet ("metallskenor") i stället för det precisa.
8. **Står etiketten mot ritningen — mät ritningen.** Leverantörens måttbilder är
   ortografiska: proportionerna stämmer även när textetiketterna inte gör det. Har du
   ETT mått du litar på i samma bild kan du räkna ut alla andra och avgöra saken
   själv, i stället för att välja mellan två påståenden.
   `2ad9b84b` (låg hundgrind, 2026-08-26): höjdpilen var märkt **"25 cm"**, medan
   titel och spec sa 45 cm. Grindsektionen i samma bild var måttsatt 61 cm och mätte
   863 px → 14,15 px/cm; höjdpilen spände 614 px = **43,4 cm**. Etiketten var alltså
   fel, inte specen. Skillnaden var inte kosmetisk: 25 cm är ett trappsteg, 45 cm är
   en grind.
   Mät på leverantörens ORIGINALBILD, inte på ett omkodat utsnitt, och tröskla bort
   strökorn (`rad >= 8 px`) — annars drar JPEG-bruset ut bounding-boxen till hela
   bilden.

   > 🔎 **Oifyllda mall-platshållare är en varningsflagga för hela bildserien.** Samma
   > produkt hade rubriken *"Diferentes extensiones para aberturas de: **-XX-XXcm**"* —
   > en platshållare som gått rakt ut i produktion. Ser du en sådan: sluta lita på
   > siffrorna i den bildserien och verifiera var och en. Där fanns också ett andra
   > fel — bildens steg-tabell började på 66 cm medan titeln sa 67. Två källor som
   > säger olika om en MINSTA bredd → ta den HÖGRE (regel 3 i konservativ riktning):
   > säger vi 66 och kundens öppning är 66,5 köper hen något som inte passar.

> 🔒 **Rättelsen går in i löptexten, aldrig som brasklapp.** Skriv den sanna uppgiften
> i stycket och i spec-tabellen — inte *"leverantören påstår X men…"*. Se
> textreglerna i Steg 7.

**Rapportera fyndet till Leonard** i sammanfattningen. Det är inte bara en rättelse
på en sida: samma leverantör och samma modellserie bär oftast samma fel.


-----

## Steg 6 – Sanera varianter FÖRST (innan du skriver copy)

Avgör vilka varianter som faktiskt ska säljas **innan** Steg 7 — annars skriver du beskrivning, bygger spec-kort och alt-texter för en variant som ändå ska bort (dyrt dubbeljobb). **Facit = mappningen, inte marknadsbilderna.**

1. **Läs facit ur mappningen** (read-only) — det som verkligen lagerförs är `supplierVariantId`:
   ```
   GET https://www.wixapis.com/data/v2/items/{PRODUCT_ID}?dataCollectionId=FyndplatsMappings
   ```
   Jämför varje `data.variants[].supplierVariantId` (finns den = riktig, mappad variant) med Wix-produktens `variantsInfo.variants[].inventoryStatus.inStock`.

2. **Ta bort döda varianter NU:** en variant som är **phantom** (ingen `supplierVariantId`) ELLER **slut** (`inStock:false`) ska bort — valet, variantraden och (i Steg 9) dess bilder. Full PATCH-mekanik + "delade-marknadsbilder-ljuger"-fällan står i **Steg 11C**.

3. **Blir bara EN variant kvar → kollapsa till enkel-variant-produkt** direkt (inte en option med ett enda val): `options:[]` + `variantsInfo.variants:[{ id:<kvar>, choices:[], sku, price, inventoryStatus }]`.

4. 💰 **Billigaste varianten ska ligga FÖRST i valen** (Leonards regel 2026-08-26). Wix visar det första valet förvalt, så det är dess pris kunden möter — och ett förvalt dyrt val får produkten att se dyrare ut än den är. Sortera `options[].choicesSettings.choices[]` **stigande efter variantens pris** och skicka `options` + `variantsInfo` verbatim (och `visible` explicit — en draft ska förbli draft).

   ```js
   // lagsta pris per choiceId, sedan stabil sortering
   const pris = {};
   for (const v of variantsInfo.variants)
     for (const c of (v.choices || [])) {
       const cid = c.optionChoiceIds.choiceId, kr = Number(v.price.actualPrice.amount);
       if (pris[cid] === undefined || kr < pris[cid]) pris[cid] = kr;
     }
   val.sort((a, b) => (pris[a.choiceId] === pris[b.choiceId] ? 0 : pris[a.choiceId] - pris[b.choiceId]));
   ```

   Ordningen påverkar **bara** presentationen: `choiceId` är oförändrat, så `linkedMedia`, lagerposter och mappningens `wixVariantId` följer med av sig själva. Verifiera ändå att antalet `linkedMedia` är detsamma före och efter.

   > **Katalogsvep 2026-08-26:** 29 av 226 flervariantprodukter hade ett dyrare val först — värst en solpanel som visade **1 439 kr** i stället för sina **459**, ett fräsbord på 1 969 mot 1 079 och en paviljong på 4 949 mot 3 749. Alla rättade. Sveps om med `POST /stores/v3/products/query-variants` (pris per variant, ~1 900 varianter på 19 anrop) plus `search` (valordningen) — **`search` returnerar INTE `variantsInfo`**, så priserna måste hämtas den vägen.

Nu — och först nu — skriver Steg 7 (copy), Steg 8 (SKU) och Steg 9 (bilder/spec-kort) **bara** för det som är kvar. Ingen omskrivning, inga spec-kort som slängs.

-----

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

> 🔍 **Städar du regeln i efterhand över hela katalogen: gör sökmönstret SNÄVT.** Ett brett mönster flaggar allt utom det som är fel. Mitt första svep gav 134 träffar av 777 — nästan alla falska: vanliga monteringsanvisningar (*"kontrollera att låssprintarna sitter i innan du lastar bänken"*), passformskrav som ÄR köpbeslutet (*"kontrollera att bilen har upphöjda takrails"*) och lagstadgad åldersmärkning (*"inte lämplig för barn under 3 år"*). Ett omedvetet delsträngsfel gjorde dessutom att `står inte` matchade mitt inne i **ro**`star inte`. Snävt omskrivet gav samma katalog **7** träffar — den riktiga svansen. Leta efter de tre faktiska brotten:
>
> | Sort | Mönster som faktiskt bär |
> |---|---|
> | Vi som inte vet | `anges inte`, `uppges inte`, `framgår inte`, `specificeras inte`, `saknas uppgift` |
> | Vi som gardar oss | `vi har inte fått`, `vi lovar ingenting`, `vi kan inte lova`, `vi hellre säger` |
> | Trasig korsreferens | `läs stycket … under <borttagen rubrik>` |
>
> Ordgränser räcker inte alltid: `\bleverantören\b` missar genitivformen *leverantörens* — använd `leverantör[a-zé]*`. Och radera aldrig en träff blint; hämta HTML-kontexten runt den och skriv om för hand. **Monterings- och säkerhetsinstruktioner är nödvändiga och ska stå kvar** — regeln är "bara det nödvändiga", inte "ingenting".

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
under Aosom-synken). Bodyn ovan sa tidigare inget om `visible`, och den som följde receptet
ordagrant la ut ett opolerat utkast på sajten — det hände på tunneltältet `e4b000fa`
2026-08-29, med tyska alt-texter och utan kategori, i sexton sekunder innan det upptäcktes.
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

**Verifiera:** nya SKU:n innehåller varken engelska råord eller **dropship-märke** och matchar sluggen. (Etablerade märken som Pagani Design/LAIKOU **behålls** i SKU:n – se märkesregeln i *Fasta fakta*.)

-----

-----

## Steg 9 – Bilder: alt-texter, tvätt, hjälte och kort

Rå-import lämnar engelska alt-texter med "AliExpress" – byt alla till svenska, sökordsrika, varierade. Koppla ev. variantbilder till sina optionsvärden.

> **Utgå från bildgranskningen i Steg 4** (har du hoppat över den: gör den nu). Alt-texten ska beskriva **det som faktiskt syns** — motiv, färg, vinkel, miljö/detalj — med fokussökordet naturligt invävt; inte samma generiska mall × N bilder.
>
> Åtgärda samtidigt det du noterade i Steg 4: fel produkt/motiv, dubbletter, eller att **första bilden** (= `media.main`, produktkortets bild i butiken) inte är den renaste produktbilden — byt huvudbild genom att ordna om `itemsInfo.items` (första item blir automatiskt `main`); skicka **hela** arrayen i ny ordning i samma Steg 9-PATCH, ändra inget annat i items.

> 📌 **Galleriets ordning är fast: hjältebild, verklighetsbild, sedan korten.** Bild 1 är den renaste produktbilden (den blir `media.main` och produktkortet). **Bild 2 ska vara en verklighetsbild** — varan i ett rum, i bruk, med något att skala mot. Egna Fyndplats-kort kommer därefter, och måttritningar sist. Kunden bläddrar sällan förbi de första bilderna, och där ska hen ha sett vad varan är och hur den ser ut hemma — inte två spec-tabeller i rad. Leonards regel 2026-08-22, efter att kubhyllan `d4b87c0a` publicerades med spec-kortet som bild 2. Saknar leverantören en miljöbild helt: sätt näst renaste produktbilden på plats 2 och notera avsaknaden, bygg inte ett kort som ersättning.

> 🟠 **Varje polerad produkt ska ha MINST ett eget Fyndplats-kort — normalt spec-kortet.**
> Leonards regel 2026-08-26, efter att verkstadspallen `a65eefea` publicerades med enbart
> tvättade leverantörsbilder. Ordningsregeln ovan säger *"därefter egna kort"* och lästes som
> att kort är valfria; det är de inte. Kortet är det enda i galleriet som är **vårt** — det
> samlar de verifierade måtten på ett ställe, i husets typografi, med källan utskriven i foten.
> Utan det är produktsidan en vidarebefordran av leverantörens marknadsföring.
>
> Minimum är `card_spec` med de mått Steg 5 faktiskt bekräftat. Placeringen är **efter
> verklighetsbilden**, aldrig plats 1 (plats 1 är alltid varan själv).
>
> **Fyller varan hela källbilden — använd `fit=True`, inte `fit_pane`.** Verkstadspallens
> hjältebild var beskuren till 1965 × 1925 av 2000 × 2000: en beskärning till spec-panelens
> proportion (1,83) hade kapat pallen upptill och nedtill. `fit=True` ger `object-fit: contain`
> mot vit botten och visar hela varan. Mät alltid bbox:en först — och **räkna bort strökorn**
> (`rad >= 8 px`), annars rapporterar JPEG-bruset hela bilden som produkt.

> ⏱️ **ISR-fönstret är 300 s — en re-GET mot Wix bevisar inte att sidan är uppdaterad.**
> `x-nextjs-stale-time: 300` med `x-vercel-cache: HIT` betyder att kunden får den gamla sidan i
> upp till fem minuter efter din PATCH. Den snabba kontrollen (`curl` efter ~10 s) fungerar bara
> vid en cache-**MISS**, alltså första gången sidan renderas — det är därför den känns pålitlig
> precis efter publicering och sedan slutar fungera. Läs `age` och `x-nextjs-stale-time` innan du
> drar slutsatsen att en bild inte kom med; är Wix-datan verifierad med re-GET är sidan rätt,
> bara inte serverad än.
>
> **Varje edge-nod har dessutom sin EGEN cache.** En `HIT` med gammalt innehåll bevisar
> alltså inte att rättelsen uteblev — du kan ha träffat en POP som ännu inte hämtat om,
> medan en annan redan serverar den nya sidan. Fem `HIT` i rad kan vara fem träffar på
> samma eftersläpande nod. Läs `age` och `date`: är `date` äldre än din PATCH är svaret
> per definition inaktuellt, och just den förfrågan startar omvalideringen — nästa
> träff på den noden är rätt. Slutsatsen "fixen gick inte igenom" kräver ett svar med
> `date` EFTER din PATCH. (2026-08-26, `f0e0ee14`: fyra `HIT` i följd fick mig att leta
> efter en frontend-cache som inte fanns — `age: 302` på nästa svar visade att det bara
> var en nod som låg efter.)

> ☠️ **Hämta ALDRIG produktsidan i samma andetag som publiceringen — då cachas en 404 i
> fem minuter.** Wix slug-index ligger några sekunder efter skrivningen. Är butiken framme
> före indexet renderar den startsidans fallback, och just den 404:an är vad ISR sparar.
> Sidan ser trasig ut fast produkten är helt korrekt. Hände 2026-08-26 på `8da26d68`
> (sängbänk 117 cm): publicering och `curl` låg under en sekund isär, och sidan svarade
> fallback i drygt fem minuter innan den kom till liv av sig själv.
>
> ⚠️ **En NYSKAPAD KATEGORI serveras inte av butiken direkt — och felet ser inte ut
> som en 404 utan som en 307 mot `/butik`.** Uppmätt 2026-08-29 på
> `Terrassvärmare & Infravärmare` (`40848f60`): kategorin är korrekt i Wix — `visible:
> true`, `itemCounter: 2`, rätt förälder — men `/kategori/terrassvarmare-infravarmare`
> svarade 307 mot `/butik` i minst sju minuter. **Det är INTE bara ISR-fönstret.** Jag
> antog först det, och mätningen motsäger det: `age: 412` mot `x-nextjs-stale-time: 300`
> med oförändrat `date` och `x-vercel-cache: HIT`. En cache-buster i frågesträngen
> hjälper inte heller.
>
> **Felet ligger i butikens kategorilista, inte i din URL.** Det avgörande beviset är
> att kategorin inte heller syns i navigationen på `/butik` — en färsk rendering som
> ingen av dina egna hämtningar kan ha cachat. Butiken känner alltså inte till
> kategorin över huvud taget. Vad som därmed är UTESLUTET: att sluggen är fel (en
> påhittad slug ger 404, inte 307 — olika kodvägar) och att det räcker att vänta.
> Varför listan inte uppdateras går inte att avgöra härifrån: kategorirutten ligger i
> `fyndplats-headless`, ett annat repo.
>
> **Praktiskt:** produkterna påverkas inte. De ligger live på sina egna URL:er och bär
> FÖRÄLDER-kategorin, som fungerar. Lövet är extra navigation. Skapar du en ny kategori:
> koppla den, verifiera i Wix att `itemCounter` stämmer, och **lova inte att sidan
> fungerar förrän du sett en 200**. Kvarstår 307:an: fråga Leonard, det kräver butiksrepot.
>
> **Läs alltid `date` och `age` innan du drar en slutsats om cache.** Är `date` äldre än
> din skrivning är svaret per definition inaktuellt; är `age` STÖRRE än `stale-time` och
> svaret ändå oförändrat är det inte cachen som är förklaringen.
>
> **Så skiljer du en cachad 404 från ett verkligt fel — fråga Wix samma fråga som butiken:**
> ```
> POST /stores/v3/products/query
> { "query": { "filter": { "slug": {"$eq":"<slug>"}, "visible": {"$eq":true} } } }
> ```
> Kommer produkten tillbaka är datan rätt och det enda som återstår är att vänta ut
> fönstret. Två saker som INTE hjälper: en frågesträng (`?x=1`) bustar inte cachen på
> produktrutten, och **sitemapen är ingen diagnos** — tre av fyra produkter publicerade
> samma dag saknades i den medan deras sidor fungerade utmärkt.
>
> **Regeln:** lägg publiceringen och live-kontrollen i skilda anrop, med minst
> recensionshämtningen emellan. Får du ändå fallback: verifiera via slug-frågan ovan,
> vänta ut de 300 sekunderna och kontrollera igen — börja inte ändra på produkten.

> **Fälla:** skicka tillbaka **hela** `itemsInfo.items`-arrayen och ändra **bara `altText`**. En ofullständig array kan **radera bilderna**. **Verifiera efteråt** att alla items har kvar `image.url`.
>
> ⚠️ **`altText` ligger på ITEM-nivå — `image.altText` ensamt är en tyst no-op.** Varje item bär
> fältet två gånger (`items[i].altText` och `items[i].image.altText`), och Wix speglar
> item-nivån NEDÅT över `image`. Patchar du bara `image.altText` svarar Wix `200 OK`,
> revisionen ökar — och en re-GET visar den **gamla** engelska texten kvar på de gamla
> bilderna och tom alt-text på de nyuppladdade. Sätt båda fälten till samma sträng.
> (2026-08-27, krittavlan `c4ac3cba`: sex alt-texter såg satta ut och var det inte.)

> ⚠️ **Skicka INTE `media.main`.** I V3 är `media.main` **readOnly** (sätts automatiskt till första item:et). Inkluderar du det svarar Wix `200 OK` men **ignorerar tyst hela `media`-objektet** — revisionen ökar inte och alt-texterna ändras inte (no-op som ser ut att lyckas). Patcha bara `media.itemsInfo.items`; `main` följer med automatiskt.
>
> ⚠️ **PATCH-svaret innehåller INTE `media.itemsInfo`** (det fältet returneras bara när du
> begär `fields=MEDIA_ITEMS_INFO`, vilket PATCH inte tar). Räknar du items i PATCH-svaret får
> du `0` och tror att galleriet raderats. **Verifiera alltid med en separat re-GET** med
> `?fields=MEDIA_ITEMS_INFO`, inte på PATCH-svaret.

> ⚠️ **Galleriet skrivs på `media.itemsInfo.items` — `media.items` TÖMMER det tyst (2026-08-19, en publicerad produkt stod bildlös).** Läsvägen är `media.itemsInfo.items`, och det är också skrivvägen. Skickar du i stället `media: { items: [...] }` svarar PATCH:en **200** med `"media":{}` — och en efterföljande GET visar `itemsInfo.items: []`. Alla bilder borta, på en live produkt. Samma sak händer med `{url}` i stället för `{id}`. **Verifiera ALLTID med en separat GET `?fields=MEDIA_ITEMS_INFO`** — PATCH-svaret utelämnar `itemsInfo` även när skrivningen lyckades, så svaret kan inte skilja "sparat" från "raderat".
>
> ⚠️ **`linkedMedia` valideras mot galleriet FÖRE uppdateringen — därav ett moment 22.** Byter du både galleri och val i samma PATCH får du 404 `PRODUCT_MEDIA_NOT_EXIST`: de nya valen valideras mot det GAMLA galleriet (nya bilderna finns inte där än), och det nya galleriet mot de GAMLA valen (gamla bilderna är borttagna). Att skicka med de gamla bilderna i `items` hjälper inte. Bryt låsningen i tre steg:
>
> 1. **PATCH `options` + `variantsInfo` UTAN `linkedMedia`.** (Namnbyten här ger nya variant-id → återskapa lagret direkt, se avsnittet om omdöpning.)
> 2. **PATCH `media.itemsInfo.items`** med det slutliga galleriet.
> 3. **PATCH `options` + `variantsInfo` igen, nu med `linkedMedia`** och med `choiceId`/variant-`id` ifyllda så inget döps om — då behålls variant-id och lagret rörs inte.
>
> `options` kan aldrig skickas ensamt: utan `variantsInfo` svarar API:et 428 `MISSING_VARIANT_OPTION_CHOICE`. Och identifierar du valen med `optionChoiceNames` krävs **alla tre** fälten `optionName`, `choiceName` och `renderType` — utelämnas `renderType` blir det samma 428. Nya val behöver dessutom `choiceType: "CHOICE_TEXT"`, annars 400 `PRODUCT_OPTION_CHOICE_NAME_AND_TYPE_REQUIRED`.

> ⚠️ **`altText` sitter på ITEM-nivån — `image` är readOnly (2026-08-17, kostade två blinda PATCH:ar).** I `media.itemsInfo.items[]` heter fältet `altText` direkt på itemet (`ProductMedia.altText`); `item.image` är `readOnly: true` och **ignoreras tyst**. Skickar du `{ id, image: { id, altText } }` går PATCH:en igenom med 200, men alt-texten skrivs aldrig — och eftersom du samtidigt ersatt hela `items`-listan **raderas de gamla alt-texterna**. Så tömdes hela galleriet på alt-text för två produkter innan felet syntes. Rätt form är `{ id: "<fileId>", altText: "…" }`. Verifiera ALLTID med re-GET att `items[].altText` är ifylld — ett 200-svar bevisar ingenting här.
>
> ☠️ **Samma sak händer om du bara skickar `{ id }` — och det är den vanligaste vägen dit.** Regeln
> ovan handlar om FEL form på alt-texten; det här handlar om att den saknas helt. `items`-listan
> ersätts i sin helhet vid varje media-PATCH, så ett item utan `altText` blir ett item UTAN
> alt-text — även om det hade en innan. Fällan slår till när du patchar galleriet av något annat
> skäl än texten: byter ordning, byter ut en swatch, eller skriver tillbaka hela fil-id-listan för
> att komma runt att Wix döpt om media-item-id:na. Då tänker man på id:na, inte på texten.
>
> **Regel: varje media-PATCH bär `altText` på VARJE item.** Läs items med
> `?fields=MEDIA_ITEMS_INFO` först och skicka tillbaka den befintliga alt-texten på de bilder du
> inte rör. *(Svep 2026-08-26: **80 bilder på 10 publicerade produkter** stod utan alt-text, åtta
> av dem sidor som polerats färdigt samma dygn — swatch-bytet hade skrivit tillbaka fil-id-listan
> utan texterna. Katalogkollen hittade det; produktsidorna såg felfria ut.)*

> ⚠️ **Galleribilder MÅSTE vara kvadratiska — PDP:n centrumbeskär varje bild till kvadrat.**
> Storefronten hämtar galleriet med Wix-transformen `fill/w_N,h_N,al_c` (verifierat i
> sidans `srcset`: `w_1080,h_1080`, `w_1920,h_1920` …). En **liggande** eller **stående**
> källa kapas därför i kanterna, och kunden ser en inzoomad bild med produkten avskuren.
> Trampbilen (2026-08-21) låg 1500×1088 med fordonet 1408 px brett — kvadratbeskärningen
> tog 206 px i var sida och **båda hjulen försvann**, trots att filen i sig var hel.
> Felet syns inte i katalogen, bara på sidan: `media.itemsInfo` rapporterar bilden som OK.
> **Åtgärden är ren omramning** — beskär till produktens bbox och centrera på kvadratisk
> vit duk (≈95 % fyllnad av längsta sidan). Ingen retusch, ingen ny källa.
> Kontrollen som ska passera före uppladdning:
> ```python
> sida = min(ut.size); vx = (ut.width-sida)//2; vy = (ut.height-sida)//2
> assert kontroll[vy:vy+sida, vx:vx+sida].sum() == kontroll.sum(), 'kvadratbeskärningen kapar produkten'
> ```
> **Miljöbilder är undantagna** — att en livsstilsbild beskärs till kvadrat är normalt.
> Regeln gäller studiobilder på vit botten, där produkten är motivet.
> Svep över 120 produkter 2026-08-21: **11 hade en studiobild där produkten faktiskt kapas**
> (2–22 % av produktens pixlar). 44 hade någon galleribild som kapas, men merparten av dem
> är miljöbilder.
>
> **Omfattningen, mätt 2026-08-24:** **514 av 5 893 galleribilder (8,7 %) är icke-kvadratiska**
> och beskärs därför, fördelat på **294 synliga produkter**. Bara **4 produkter** har en sned
> HJÄLTE-bild — produktkortet i kategorilistorna är alltså nästan alltid helt; skadan sitter
> inne i galleriet. Av ett spritt stickprov på 60 låg **28 % på ren vit studiobotten**, och de
> går att laga mekaniskt med metoden ovan (klipp till innehållets bbox → kvadratisk vit duk,
> 0.90-fyllnad, med assertionen). Resterande **72 % är riktiga foton** med egen bakgrund —
> där måste beskärningsfönstret väljas per bild, för vit passepartout runt en gräsmatta ser
> fel ut. Räkna inte "ramtapp" som "produkttapp" på ett foto: hela rutan är ju motiv, så
> måtten sammanfaller per konstruktion och säger ingenting om varan är kapad.

> ☠️ **`UploadImageToWixSite` svarar `success: true` även när uppladdningen sedan MISSLYCKAS — och en PATCH mot en icke-klar fil släpps TYST.** Svaret innehåller `operationStatus: "PENDING"`: Wix har tagit emot uppdraget, inte utfört det. Hämtar Wix din URL medan raw.githubusercontent strypter (429) eller svarar 500 hamnar filen i `state: "FAILED"` — men du har redan fått ditt `fileId`. Patchar du in det svarar V3 `200 OK`, **utelämnar item:et** och du upptäcker det först när galleriet gått från 6 bilder till 5. Hände 2026-08-17 på lasertag-hjälten: den gamla hjälten hann raderas i samma PATCH, så produkten låg en stund helt utan hjältebild.
   >
   > **Regel: kontrollera filens status före PATCH:en, inte efter.**
   >
   > ```js
   > const f = await wix.request({ scope:"site", siteId, method:"GET",
   >                               url:"/site-media/v1/files/" + fileId });
   > if ((f.file.operationStatus || f.file.state) !== "READY") return { avbrutet:true };
   > ```
   >
   > Ett snabbt `curl` mot `…/v1/fit/w_300,h_300,q_70/preview.jpg` duger som förkontroll: **403 = inte klar**, 200 = klar. Två saker minskar risken att det händer alls: håll filen liten (2000² JPEG på 380 kB föll, 1600² på 198 kB gick igenom) och **byt filnamn vid omförsök** — samma URL kan ligga kvar strypt en stund.

> ☠️ **En PATCH av `media.itemsInfo` NOLLSTÄLLER `linkedMedia` på alla variantval (2026-08-13).** Det räcker inte att låta de låsta bild-id:na följa med i det nya galleriet — Wix svarar `200 OK`, behåller bilderna, men skriver `linkedMedia: []` på varje choice. Resultatet: alla färgval visar första galleribilden, och kunden som väljer "Blå" ser den gröna produkten. Hände på hollywoodgungan `39a5c0bf`. **Åtgärd:** har produkten optioner → lägg `options` (inkl. `linkedMedia`) + `variantsInfo` (inkl. varje variants `choices`) i **samma** PATCH som `media`, eller kör en andra PATCH direkt efter med `visible` explicit satt och färsk `revision`. Re-GET-verifiera att varje choice har rätt id.

> **Dubbletter (identiska bilder):** är två eller fler galleri-items **exakt samma motiv** (vanligt från skrapan/DS-API:t) — behåll **en**, ta bort resten ur `itemsInfo.items` (skicka hela arrayen utan dubbletterna). **Kontrollera `linkedMedia` FÖRST:** pekar ett variantval på en kopia du tar bort → koppla om valet till den kvarvarande bilden (Steg 11B), annars tappar valet sitt bildbyte tyst. **Radera INTE filen direkt** i Media Manager — borttagen ur galleriet blir den föräldralös och **frigörs automatiskt i de återkommande orphan-städsvepen** (minnet återtas helt, utan risk att radera en fil som `linkedMedia`:as eller används av en annan produkt). Vill du bekräfta exakt likhet: jämför fil-id:t i `image.url` (samma id = samma fil) eller previews sida vid sida med `Read`.
>
> ⚠️ **Dubbletterna är oftast PIXELIDENTISKA men BYTE-OLIKA — fil-id och checksumma missar dem.**
> Wix omkodar samma motiv till två filer med olika id, olika storlek och olika md5. Testet ovan
> friskförklarar dem alltså felaktigt. Det som fäller är en nedskalad pixeljämförelse:
> ```python
> a=np.array(Image.open(f1).convert("L").resize((320,320))).astype(int)
> b=np.array(Image.open(f2).convert("L").resize((320,320))).astype(int)
> abs(a-b).mean()   # 0.0 och max 0 = samma motiv, oavsett filstorlek
> ```
> Kör det över alla galleribilder innan du sätter ordningen — annars ligger samma bild två
> gånger i karusellen. **Mönstret är regel, inte undantag:** tre produkter i rad 2026-08-26 —
> hundgrinden 12 platser/10 unika, hundväskan 9/8, cykelvagnen 9/8. På hundgrinden var de två
> kopiorna dessutom `linkedMedia` för färgvalen, så de gick inte att ta bort förrän valen
> pekats om (se stycket ovan).

**Bild-arbete — vilken metod?** Åtgärda det du flaggade i Steg 4. Välj per bild:

| Bilden är… | Gör |
|---|---|
| Foto med inbränd text/logga/vattenstämpel | **Tvätta** ([T-metoderna](polish/bildmetoder.md#textborttagning-t--tvätta-loggor-och-inbränd-text)) |
| Hjältebild — ren produkt på ful/mörk/rörig bakgrund | **Vit studio-hjälte** ([H-metoderna](polish/bildmetoder.md#hjältebild-h--ren-vit-produktbild)) |
| Mörkt AliExpress feature-collage / engelskt spec-blad (inte enskilt produktfoto) | **Bygg eget svenskt kort** ([K-metoderna](polish/bildmetoder.md#kortbygge-k--egna-svenska-feature--och-spec-kort)) |
| **Rent** text-/mätdiagram UTAN användbart produktfoto (mått, pilar, storleksjämförelse) | **Ta bort** (info → "Tekniska specifikationer"). MEN finns ett användbart foto i bilden → bygg foto-kort (K) i stället, släng inte. |

> **Behåll så många ANVÄNDBARA bilder som möjligt — ju fler bra bilder desto bättre (Leonard 2026-07-10).** En rik produktsida säljer mer än en med 2–3 bilder. Släng BARA exakta dubbletter och bilder utan något användbart visuellt (140px-thumbnails, rena text-/mätdiagram). Leverantörens engelska/tyska feature-collage, i-bruk-foton och spec-blad **byggs om till svenska foto-kort** ([K-metoderna](polish/bildmetoder.md#kortbygge-k--egna-svenska-feature--och-spec-kort)) — kastas inte. Då behåller katalogen bilderna, men snyggt och på svenska. Exempel (2026-07-10): låset 10 råbilder → 6 (2 produktvinklar + i-bruk + 3 foto-kort, bara 3 dubbletter + en 140px-thumb slängd); slangen 11 → 6; stegen 18 → 7.
>
> **Aldrig ett rent text-kort. VARJE kort måste ha ett riktigt foto** (produkt, detalj eller i-bruk) med texten som bildtext — inte en textruta man inte kan titta på (Leonard 2026-07-10). Bygg foto-kort med `card_photo` (ett stort foto + rubrik + en rad) eller `card_grid` (2–4 foton med etiketter), inte enbart ett `card_spec`-textrutnät. Spec/feature-text är OK men alltid **ovanpå eller under en bild** — `card_spec` tar därför också ett foto som första argument. *(Låset fick först fyra rena text-`card_spec`-kort — underkänt; byggdes om till foto-kort med handklovslås, kombinationshjul, väska och i-bruk-scen.)*
>
> **Fotot på kortet ska vara STORT — fyll kortet, inte en liten chip (Leonard 2026-07-10).** Panelen (`.pane`) fyller höjden av sig själv (`flex:1`) — du behöver inte sätta någon maxhöjd. Styr i stället **hur** fotot fyller den med `fit`: `fit=False` (default på `card_photo`/`card_grid`) = `object-fit:cover`, fyller hela panelen men **beskär** — bara för kontext-/livsstilsfoton. `fit=True` = `object-fit:contain`, HELA produkten syns obeskuren — använd alltid för produktbilder. Är källbilden liten (<~500 px) blir den suddig uppskalad: beskär hellre större ur originalet. *(Spec-korten för verktygssats/baklyktor/insynsskydd hade först produkten onödigt liten i ett litet chip med tom yta under — byggdes om med full panel + `contain`.)*

Två regler gäller ALLA metoder: **radera aldrig originalfilen** ur Media Manager (borttagen ur galleriet blir den föräldralös och städas i orphan-svepen), och är en bild `linkedMedia` för ett variantval — **koppla om valet först** (Steg 11B), annars tappar valet sitt bildbyte tyst.

> ⚠️ **KAPA ALDRIG BORT DELAR AV PRODUKTEN. Två fällor som passerade auditen (Leonard fångade båda, 2026-07-10) — härdregler nedan.** Den programmatiska `audit()` fångar BARA kant-kapning + slutna hål; den missar käll-crop-kapning (stegen) och hörn-bett (slang-spolen, ett runt motiv). **Facit är därför ALLTID en visuell `faith_sheet(original, polerad)` som du `Read`-ar före uppladdning** — inte att `audit()` säger OK.
>
> 1. **Vitmåla ALDRIG en rektangel över produkt-silhuetten.** Inbränd text/logga som ligger OVANPÅ produkten tas bort med **inpainting** (`cv2.inpaint(bild, textmask, 6, INPAINT_TELEA)` — fyller med omgivande textur), aldrig med `arr[y0:y1,x0:x1]=255`. Ligger texten på **vit bakgrund bredvid** produkten: ta bort bara text-pixlarna (färg-/röd-tröskel + `cv2.inpaint`), och verifiera att masken inte tangerar produkten. *(Slang-spolen fick ett vitt hack när "50M"-blocket vitmålades in i spolens övre vänstra båge — inpainting av bara textpixlarna löste det utan att röra spolen.)*
> 2. **Beskär en produkt ur en fler-objekt-bild BARA i det vita gapet mellan objekten — med marginal, aldrig en gissad snäv gräns.** Många leverantörsbilder lägger **öppen + ihopfälld** (stege), **flera vinklar** eller **produkt + tillbehör utlagda** i SAMMA bild. Hitta objektets **fulla utbredning** först (kolumn-/rad-densitet: `nz.mean(axis=0)` → leta lågtäthets-*dalen* som skiljer objekten), lägg snittet i dalen + marginal. *(Stegen beskars vid x≈840 fast den öppna stegen nådde x≈1050 → främre benet + halva stegplanen kapades. Rätt snitt låg vid dalen x≈1110, precis före den ihopfällda.)*
> 3. **Obligatorisk faithfulness-grind före uppladdning:** bygg `faith_sheet(original_källcrop, polerad)` och `Read` den. Bekräfta att den polerade silhuetten innehåller **HELA** produkten — inga raka snitt-kanter, inga vita hack/bett, inga borttagna delar/tillbehör. Godkänn först då. Detta är samma grind som redan gäller AI-genererade vita hjältar ([H-metoderna](polish/bildmetoder.md#hjältebild-h--ren-vit-produktbild)) — den gäller **även** manuella crops, vitmålning och kort-urklipp.

> ⚠️ **Att rita maskens kant ovanpå originalet BEVISAR ingenting — den kontrollen missar hål mitt i varan.** Frestelsen när ett urklipp ser konstigt ut är att overlaya konturen och se om den följer produkten. Det gör den — även när maskens *insida* saknas. På lasertag-hjälten (2026-08-17) hade `rembg` tappat pistolens svarta kropp mot svart bakgrund; kvar blev bara de röda listerna, som mot vitt såg ut att sväva. Konturlinjen följde varje röd kant perfekt, på **båda** sidor om det bortfallna partiet, så overlayen såg korrekt ut. Jag godkände den. Leonard såg hålet direkt.
>
> **Jämför alltid urklippet mot originalet SIDA VID SIDA i samma skala** (det är just det `faith_sheet` gör) — aldrig kontur mot original. Frågan är "saknas det yta?", inte "följer kanten?".
>
> **Grundorsaken är värd att undvika helt: välj en källa där varan har kontrast mot underlaget.** Svart plast mot svart/mörkblå botten är den klassiska fällan. Samma lasertag-set fanns i två leverantörsbilder — mot mörkt neongolv (kropparna föll bort) och mot **ljust grått golv** (alla åtta föremål klipptes rena i första försöket). Kolla igenom hela bildsetet efter den ljusaste bakgrunden innan du börjar maska; det är billigare än varje räddningsförsök.

### Klassa bilden innan du väljer metod

Noterade du i Steg 4 **dropship-logga** (SucceBuy/VEVOR/HOMCOM …), **vattenstämpel** eller **inbränd marknadsföringstext** (engelska, spanska, kinesiska …) på en bild — åtgärda det i samma polering i stället för att bara flagga:

1. Hämta **originalupplösningen** (utan transform): `curl -o orig.jpg "https://static.wixstatic.com/media/{FILE_ID}"` och `Read` den.
2. Klassa bilden:
   - **Ren produktbild ELLER nyttig kontextbild** (detalj, i-bruk, skala — bakgrunden må vara slät ELLER rörig/komplex, med personer/miljö) → **tvätta med Metod A** nedan. Skillnaden mot tidigare: detta är **inte längre begränsat till släta studiobakgrunder** — AI:n klarar numera att ta bort text/loggor/banderoller från komplexa foton (person som använder produkten, regn, trä-/stenbakgrund) och lämna resten helt orört.
   - **Ren infografik/spec-diagram** (mätdiagram, storleksjämförelse, mest text och pilar — inget egentligt produktfoto) → **ta bort bilden ur galleriet** i stället för att tvätta; informationen hör hemma som text under "Tekniska specifikationer", inte som bild.

> 🗂️ **Vilken metod?** Hela mekaniken ligger i
> [`polish/bildmetoder.md`](polish/bildmetoder.md). Beslutsregeln är kort:
>
> - **Hjältebild (position 0):** `H-0 hero_white()` **först alltid** → ren
>   leverantörsbild → `H-A` Wix generate-image **sist**. `H-A` får aldrig hamna på
>   position 0: den bäddar in C2PA-märkning och Google flaggar produkten som
>   AI-genererad, vilket slår ut den ur kostnadsfria listningar.
> - **Inbränd text på ett foto:** `T-A` (Wix generate-image, behåller bakgrunden).
> - **Ledarlinje som korsar produkten:** retuschera inte — byt crop eller släng bilden.
> - **Mörkt leverantörscollage:** bygg eget svenskt kort (`K`).
> - **Ren textinfografik utan foto:** ta bort, informationen hör hemma i spec-tabellen.
>
> Språket i overlayen varierar med leverantören — Aosom ES levererar **spanska**, inte
> engelska. Sök efter text, inte efter engelska ord.


-----

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

-----

> 💡 **Mappningsraden har redan ett förslag.** `FyndplatsMappings.categorySuggestion`
> fylls i vid import. Läs det — men behandla det som **en kandidat, inte facit**: det
> kommer från importens AI-kategorisering och kan ha fel. Läs trädet ändå och jämför.
> Stämmer förslaget sparar du ett övervägande; stämmer det inte har du fångat ett fel
> som annars hade legat kvar.


-----

## Steg 11 – Varianter (kontrollera, fixa bara vid behov)


> **Borttagning av döda/slutsålda varianter görs redan i Steg 6** (före copy). Här återstår att koppla variantbilder (`linkedMedia`, **11B**) och slutverifiera. **11C** nedan är den fullständiga mekaniken som Steg 6 hänvisar till.

Importen sköter varianterna automatiskt och deterministiskt (inga AI-anrop) — oftast behöver du inte göra något:

- **Bildbyte per färg/modell är redan kopplat** (`linkedMedia`): huvudbilden byts när kunden väljer t.ex. "Blå". **Rör inte detta när det fungerar** (det gör det i de flesta fall — från skrapans swatch-bilder eller DS-API:ts per-SKU-bilder).
- **Variantnamn översätts till svenska** deterministiskt vid import ("Color"→"Färg", "Red"→"Röd", "100 inch"→"100 tum"). Tabellen täcker inte allt — ovanliga värden kan bli halv-engelska. Men se A): variant-**värden** går inte att döpa om i efterhand i V3.

### 11A – Variantvärden får inte döpas om

Variantvärden (t.ex. "100 inch", "Blå") **döps inte om.** I V3 är `choices[].name` låst till `choices[].key`: att ändra bara `name` **fastnar inte**, och att röra `key` riskerar leverantörs-SKU-mappningen (`FP-…`) och fulfillment. Importen lokaliserar redan kända enheter/färger/storlekar vid import (inch→tum, Color→Färg, Red→Röd) → värdet är rätt från start. Ser ett värde ändå fel ut: **flagga till Leonard** så utökas importens översättningstabell — forcera inte ett key-byte. Det polerade produktnamnet/titeln/beskrivningen styr ändå vad kunden främst läser.

### 11B – Färg-/modellval utan bildbyte: koppla `linkedMedia`

Saknar ett färg-/modellval bildbyte (text-val utan att huvudbilden ändras) — koppla valet till rätt galleribild. Verifierat mot V3:

1. **GET** produkten med `fields=MEDIA_ITEMS_INFO`, hitta rätt bilds `media.itemsInfo.items[].id` — hämta previews och **titta** på bilderna (samma curl-metod som i Steg 4) så att rätt färg/modell kopplas; matcha inte enbart på `altText`. Läs färsk `revision`.
2. **PATCH**: sätt `linkedMedia: [{ "id": "<media-item-id>" }]` på rätt `choices[]`. Skicka **HELA** `options` + `variantsInfo` **verbatim** + färsk `revision`.
3. Wix ingest:ar bilder **asynkront** (~5 s) — verifiera via re-GET att `linkedMedia` sitter kvar; annars PATCHa om med ny `revision`.

> 🚫 **`linkedMedia` ska vara en PRODUKTBILD av just den varianten — aldrig ett Fyndplats-kort.** Kortet är ett sammanfattningslager; swatchen är det kunden klickar på för att se varan i den färgen. Ett spec-kort där ser ut som en platshållare i en mall, inte som en produkt. Leonards regel 2026-08-22, efter att knästolen, vilfåtöljen och gungfåtöljen alla fick sitt färgkort som andrafärgens bild.
>
> **Undantaget är `card_swatch` — och bara det.** Regeln ovan träffar *sammanfattnings*-kort:
> spec-rutnät, feature-collage, allt som visar text i stället för vara. `card_swatch`
> (`scripts/cardkit.py`) är motsatsen: varan ensam, stor på vitt, med en smal etikettrad under
> som säger färg, storlek och vikt. Använd det när leverantörens variantbild är en ren
> produktrender men bär **engelsk overlay-text** — då är alternativen att skeppa engelska till
> kunden eller att kasta bort en korrekt variantbild. Beskär fram varan ur leverantörskortet,
> lägg den i `card_swatch`, och kravet är uppfyllt: kunden ser fortfarande just sin variant.
>
> Två villkor gör undantaget giltigt. **(1) Fotot måste fylla panelen** — `card_swatch` sätter
> `width/height:100%` + `object-fit:contain` just därför; en `<img>` utan mått renderas i sin
> ursprungsstorlek och blev 23 % av kortbredden (Leonards rapport 2026-08-26, skärmdump av en
> swatch där stolen låg som en frimärke mitt på kortet). **(2) Etiketten får bara bära
> verifierade uppgifter** — färg, mått, vikt; ingen bärförmåga eller prestandasiffra, se Steg 11F.
>
> *(Cloud Up Pro-tältet `e98221ed` 2026-08-26: 13 leverantörsswatchar, alla rena renderingar med
> bandet "CLOUD UP PRO 2 · ULTRALIGHT TENT" och en engelsk specblock under. Elva behölls som
> `card_swatch` med etiketten "Sand · 2 personer / 210 × 130 cm · 1,75 kg".)*
>
> **Leverantören fotar oftast bara huvudfärgen på vit botten.** Andrafärgen finns då bara i marknadsföringsbilderna. Lösningen är att **beskära fram varan ur den bilden** — en tight beskärning av den riktiga stolen i ett rum är en produktbild, och duger gott som swatch. Leta efter den bild där andrafärgen står ensam utan overlay-text; finns bara bilder med modell i, är det också helt i sin ordning för en möbel. Försök inte klippa ut varan mot vit botten för att matcha leverantörens hjältebild — **det går inte på en möbel med öppen ram**. Testat 2026-08-22 på knästolen `2326c742` med både `u2net` och `isnet-general-use`: stolens ytterkant blev ren och inga ben åts, men **golvet, mattan och ett skrivbordsben följde med genom ramens öppningar**. Ingen automatisk segmentering kan skilja "bakgrund sedd genom ett hål" från "del av objektet", och båda modellerna misslyckas likadant. Har varan dessutom en modell sittande i sig — vilket den ofta har i just andrafärgens bilder — finns ingen väg alls. **Rumsbilden är rätt svar där**, och vill man ha vita bilder på alla färger är egen fotografering enda lösningen.
>
> Kortet får däremot gärna ligga kvar i galleriet som en egen bild. Är kortet **enda** bilden av den varianten: byt ut det mot beskärningen och låt kortet utgå, annars visas samma innehåll två gånger.
>
> **Undantag: när valet ÄR storleken.** På samlarvitrinen `873854dd` är valen 1/2/3 fack och leverantören har bara fotat den minsta ren. Där är den språkneutrala **måttritningen** per storlek rätt swatch — den visar faktiskt skillnaden mellan valen, vilket en produktbild av fel storlek inte gör.

> **Fastnar `linkedMedia` inte** (re-GET visar `—` trots färsk revision)? Två fällor från 2026-07-09: (1) en **rå GET utan `fields=MEDIA_ITEMS_INFO` returnerar en TOM `items`-array**, så `items[pos]` blir undefined och du kopplar mot intet — GET:a alltid med fältet. (2) Om media-item-`id`:t ändå inte biter, prova **fil-id:t** `items[].image.id` (wixstatic-fileId) i stället för media-item-`id`:t — det var det som fick om-kopplingen av Skobänk/Babybadkar/Katthjul att sitta.

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO        // media-item-id + färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "revision": "{FÄRSK_REVISION}",
  "visible": true,
  "options": [
    { "name": "Färg",
      "choicesSettings": { "choices": [
        { "name": "Blå", "linkedMedia": [ { "id": "{MEDIA_ITEM_ID}" } ] }
      ] } }
  ],
  "variantsInfo": "{VERBATIM_FRÅN_GET}"
} }
```

> Skicka `options` **komplett** (alla optioner och val, inte bara det du ändrar) och `variantsInfo` exakt som det kom från GET — annars svarar V3 428 `MISSING_VARIANT_OPTION_CHOICE`. Bilden måste redan ligga i produktens media-pool (den gör den efter import). **Skicka ALLTID `visible:true` i samma PATCH** — en `variantsInfo`-PATCH på en publicerad produkt kan annars flippa den till draft (`visible:false`) och ta bort den ur butiken (hände bordsskyddet 2026-07-09).
>
> ☠️ **Spegelvändningen är farligare: en `variantsInfo`-PATCH på ett UTKAST PUBLICERAR det.**
> Utelämnar du `visible` sätter V3 den till `true`. Det slog till två gånger 2026-08-26 —
> verkstadspallen `a65eefea` stod publicerad redan när Steg 12 började, och soptunneskyddet
> `af27fffe` gick live i samma sekund som storleksaxeln kollapsades, alltså **innan lagerposten
> hunnit återskapas**: produkten låg ute som "Slutsåld" med halvfärdig text.
>
> Regeln är därför starkare än "skicka alltid `visible:true`": **skicka alltid `visible`
> EXPLICIT — `true` på en publicerad produkt, `false` på ett utkast du inte är klar med.**
> Kollapsar du en axel mitt i en polering: sätt tillbaka `visible:false` direkt efter PATCH:en,
> gör klart lager, mappning, bilder och kategori, och publicera som sista handling enligt Steg 13.
>
> ⚠️ **Flippen slår åt BÅDA hållen (batch-lärdom 2026-08-04, 5 av 11 produkter):** en `variantsInfo`-PATCH (t.ex. Steg 8:s SKU-resynk) på en **draft** kan tyst flippa den till `visible:true` — produkten går live innan poleringen är klar. **Re-GET:a `visible` direkt efter VARJE PATCH som innehåller `variantsInfo`** och återställ omedelbart om den flippat (skicka `visible:false` med färsk revision). Gäller alltså även opublicerade produkter där du "inte rör" synligheten.
>
> ☠️ **FÖLJDBUGGEN — produkten blir OSÄLJBAR (2026-08-05):** när du sätter tillbaka `visible:false` på produkten **kaskaderar det ned till `variantsInfo.variants[].visible:false`**. Att sedan publicera (`visible:true`) återställer INTE varianten — produkten syns i butiken men går inte att lägga i varukorgen. Drabbade 2 produkter i batch 1 (köksön `07a6b8bf`, slangvindan `3995dfd4`) innan det upptäcktes.
>
> **Obligatorisk kontroll före publicering:** GET med `fields=VARIANT_OPTION_CHOICE_NAMES` och verifiera att **varje** `variantsInfo.variants[].visible === true`. Är någon `false`: PATCHa `variantsInfo` med `visible:true` på alla varianter (skicka `options` verbatim om produkten har optioner) och re-GET-verifiera. Gör detta som sista steg efter publiceringen också.

> ⚠️ **Varje variant har sin EGEN bild — slå ALDRIG ihop två varianter på samma bild. Lärdom 2026-07-09 (Leonard fångade det två gånger).** Frestelsen: två storlekar/modeller ser "nästan lika" ut → peka bådas `linkedMedia` på samma hjälte. Fel — kunden ska se exakt den variant hen väljer. Volleybollnätet (**gult** nät 1,25 tum vs **orange** nät 1,75 tum) och hund-cykelvagnen (liten boxig PTS101/30 kg vs stor avlång PTS21-C/40 kg) har genuint olika exemplar. Har du bara EN bild:
> - **Återskapa den saknade varianten ur källan.** Käll-bilderna ligger i CMS: `GET /data/v2/items/{PRODUCT_ID}?dataCollectionId=FyndplatsMappings` → fältet `imageAnalysis` listar AliExpress käll-URL:er (`ae01.alicdn.com`, hämtas **direkt med curl** — till skillnad från produktsidan som är JS-blockerad). Klipp rätt exemplar ur rätt spec-/variantbild, AI-tvätta bort engelsk text (`T-A` — **vänta ut hastighetsgränsen** mellan anrop), grunda på vit, ladda upp, koppla per variant.
> - **Finns ingen egen bild alls** (t.ex. färg utan foto) → ta bort varianten (11C), koppla inte en delad bild.
>
> **Hitta buggen i hela katalogen:** för varje produkt med >1 variantval, GET:a `fields=MEDIA_ITEMS_INFO` och jämför `choices[].linkedMedia[].id` — **samma id på 2+ val = merge-bugg** (åtgärda), **tomma** = omappad storleks-/spec-variant (oftast ofarlig). Den fulla katalog-svepen (417 produkter, 2026-07-09) hittade bara cykelvagnen med den äkta buggen.

> ⚠️ **`variantsInfo.variants[].media` är `readOnly` och är en ÖGONBLICKSBILD — inte samma sak som `linkedMedia` (2026-08-17).** Fältet härleds när optionens val skapas. Kopplas `linkedMedia` på i efterhand (som i 11B ovan) uppdateras det INTE, utan blir kvar på det som gällde då — oftast produktens hjältebild. En PATCH som försöker sätta `media` på en befintlig variant går igenom med 200 men ändrar ingenting; schemat säger `readOnly: true`. Enda vägen är att **bygga om optionen** (nya val utan id:n, `linkedMedia` inline, varianterna identifierade med `optionChoiceNames`) — då räknas den om.
>
> **Men kolla FÖRST om det spelar roll.** Headless-PDP:n läser **valets `linkedMedia`**, inte variantens `media`. Uppmätt på eltraktorn 2026-08-17: rätt bild förekom 23 gånger i HTML:en, den felaktiga variantbilden **0** gånger. Katalogsvepet hittade 86 produkter där en variant bar en ANNAN variants foto — alla osynliga för kunden på fyndplats.se. Bygg alltså inte om 86 live-produkter för ett fält butiken inte läser; åtgärda när du ändå rör optionen.
>
> **Så räknar variant-id:n om vid ombyggnad:** ett val vars `name` är OFÖRÄNDRAT behåller sitt variant-id → lagerposten följer med. Ett val som **döps om** får ett NYTT variant-id → dess lagerpost försvinner och måste återskapas (`POST /stores/v3/bulk/inventory-items/create`), och mappningens `wixVariantId` + `choices` pekas om. Verifierat på rottingsidobordet (`40339592`, "Trä Naturlig"→"Natur": grå behöll id + 59 i lager, natur fick nytt id och 19 återskapades) och elmotorcykeln (`7a611efb`, båda namnen oförändrade → båda id:n och 62/78 i lager intakta).
>
> **Katalogsvep (billigt).** `POST /stores/v3/products/query-variants` (Read-Only Variants) ger `media` + `optionChoices` för upp till 1 000 varianter per anrop — hela katalogen på ~2 anrop i stället för en GET per produkt. Två fällor kostade en falsk nolla:
> 1. Fältet heter `optionChoices[].optionChoiceNames.optionName` — ett steg djupare än man tror. Fel väg → `undefined` → allt hoppas tyst över.
> 2. **Räkna alltid hur många jämförelser som FAKTISKT kördes** och returnera siffran. Första svepet rapporterade "0 fel" när sanningen var "0 jämförda av 1 152".
>
> Skilj dessutom på **allvarligt** (varianten visar en ANNAN variants bild — kunden ser fel färg) och **kosmetiskt** (varianten visar hjälten). Testet: slår `media`-id:t mot något annat vals `linkedMedia` i samma produkt?

#### Leverantörens variantkort kan visa FEL exemplar

Innan ett variantkort byggs: **läs vad som står tryckt på varan i bilden.** Leverantörer
återanvänder renderingar mellan varianter, och etiketten avslöjar det.

> *(Rock-ryggsäcken `311c8c4e`, 2026-08-26: kortet märkt "40L Black" visade en säck med
> **"60 Liter"** tryckt på fronten — 60-litersrenderingen återanvänd. Ett swatch-kort byggt på
> den hade visat kunden fel produkt vid det billigaste valet.)*

Saknas en ärlig bild hos leverantören, leta hos **tillverkaren** innan du ger upp: deras
storleks- och jämförelsekort visar ofta alla varianter bredvid varandra, var och en med rätt
etikett. Det är samma studiorenderingar leverantören själv använder. På Rock låg den äkta
40-litersbilden i tillverkarens *"available in a wide range of sizes"*-kort, och samma kort
gav dessutom maxlasten (11 respektive 14 kg) som leverantören inte angav.

Hittas ingen ärlig bild alls: **ge varianten ingen `linkedMedia`** hellre än en bild på fel
exemplar. Men lämna inte produkten så — alla val utan kopplad bild betyder att swatchen aldrig
ändras, vilket ser trasigt ut. Antingen får alla val en egen bild, eller inget val får någon.

### 11C – Ta bort bilder för varianter som inte finns eller är slutsålda

Rå-importer buntar ibland flera modeller/storlekar under EN listning och släpar med leverantörens **spec-ark för varianter som inte säljs**. Regel: när du SEO-polerar och en variant/modell **inte finns eller är slut hos leverantören**, ta bort **både** valet (om det finns som option) **och dess bilder** — spec-ark, variantfoton och ev. `linkedMedia` — och skriv SEO/specar efter bara det som är kvar.

> **Gäller även en RIKTIG (mappad) variant som bara är `inStock:false`** — inte bara phantom-/obundna modeller. Regeln är "slut hos leverantören → bort", så en variant som har en egen `supplierVariantId` men är slut tas ändå bort (den kan re-läggas om den kommer i lager igen). Verifierat på racingstället `40955353` (2026-07-08): "Typ A" var slut → togs bort.
>
> **Blir bara EN variant kvar → kollapsa hela optionen till en enkel-variant-produkt** (inte en option med ett enda val — ful dropdown). PATCH: `options:[]` + `variantsInfo.variants:[{ id:<behållna variantens id>, choices:[], sku, price, inventoryStatus }]` (V3 accepterar det; SKU blir `FP-<produkt>` utan variant-del). Byt **också** ut ev. feature-/hjältebilder som visar den BORTTAGNA variantens exemplar (t.ex. ett urklipp gjort ur den slutsålda modellens bild) mot den kvarvarande variantens — annars visar galleriet en produkt kunden inte kan köpa. Ta bort "två storlekar"/"Typ A/B"-språk ur namn, meta, beskrivning och FAQ.

### 11D – Ta bort variantvärden vi inte får sälja till en svensk kund

Elprodukter från
AliExpress listas nästan alltid med en **uttags-/spänningsaxel** — `Kontakttyp: EU/US/UK/AU/KR`,
`Spänning: 110 V / 220-240V`, `Kontakt: 100V-240V UK-kontakt`. Bara EU-värdet är säljbart här:
UK är Type G, US/AU har fel stift, och 110 V-varianten är fel nät. Behåll **EU-värdet och
ingenting annat**, oavsett hur mycket lager syskonen har.

> Detta är en **variant**-regel, inte en produktregel — produkten stannar, axeln försvinner.
> Kollapsa enligt regeln ovan: uttagsaxeln har i praktiken alltid exakt ETT EU-värde, så hela
> axeln ska bort, inte reduceras till en dropdown med ett val. Övriga axlar (Färg, Modell,
> Paket) lämnas orörda.
>
> **Priset följer med och det är hela poängen:** EU-varianten är ofta billigare än syskonen
> (köksmaskin 6 L 1889 vs 1989 kr, kaffekvarn CG210 **1239 vs 1719 kr**, köksmaskin 7 L 2199
> vs 2809 kr). Skicka därför den överlevande variantens EGNA `price` i PATCH:en — inte
> produktens gamla intervall.
>
> ✅ **Kollapsa genom att skicka den överlevande variantens BEFINTLIGA `id` — då slipper du
> följdsteg 1 helt (verifierat 2026-08-23).** Skickar du `options: []` +
> `variantsInfo.variants:[{ id:<befintligt variant-id>, choices: [], sku, price, visible:true }]`
> behåller varianten sitt `variantId` **och sin lagerpost**. Kabelskalaren `4f38a11c` gick från
> två färgval till enkelvariant med `variantId` och alla 49 i lager orörda. Följdsteg 1 nedan
> gäller den andra vägen: bygger du om optionen med `optionChoiceNames` i stället för att peka
> på id:t räknas varianterna om, och då ryker både id och lagerpost.
>
> ☠️ **Två följdsteg som INTE sker av sig själva:**
> 1. **Lagerposterna raderas** när optionen byggs om (se ✅-noten ovan — pekar du på det
>    befintliga variant-id:t händer det inte), och den överlevande varianten får ett
>    **nytt** `variantId` utan lagerpost (= slutsåld i butiken). Läs saldona FÖRE PATCH:en och
>    `POST /stores/v3/inventory-items` per ny variant efteråt (`locationId` från en befintlig
>    post). Wix städar själv de föräldralösa posterna — de behöver inte raderas.
>
>    ☠️ **Att posten finns räcker inte — flaggan räknas inte alltid om.** Ryggsäcken `311c8c4e`
>    (2026-08-26): tre nya lagerposter skapades i samma anrop, två av varianterna slog om till
>    `inStock:true`, den tredje stod kvar på `false` trots `quantity:30` och
>    `availabilityStatus:"IN_STOCK"` på sin egen post. Det är inte eftersläpning — den satt kvar
>    över flera läsningar, och en PATCH som skrev tillbaka **samma** saldo ändrade ingenting.
>    Det som löste det var en **riktig** saldoändring: sätt ett annat tal, läs, sätt tillbaka.
>
>    **Verifiera därför alltid per variant efteråt** — `variantsInfo.variants[].inventoryStatus.inStock`
>    på produkten, inte bara `availabilityStatus` på lagerposten. De kan säga olika saker, och det
>    är produktens flagga kunden möter. En variant som står kvar som slutsåld syns inte i någon
>    logg; den går bara inte att lägga i varukorgen.

   ```js
   // knuffa flaggan: ett annat tal, sedan tillbaka
   for (const q of [saldo + 1, saldo]) {
     const post = await lasPost(variantId);
     await wix.request({ scope: "site", method: "PATCH",
       url: `https://www.wixapis.com/stores/v3/inventory-items/${post.id}`,
       body: { inventoryItem: { revision: post.revision, quantity: q } } });
   }
   ```
> 2. **Mappningsraden pekar fel.** `FyndplatsMappings.variants[]` har kvar en rad per borttagen
>    variant, och den överlevandes `wixVariantId` är dött → en order skulle gå på fel eller
>    inget leverantörs-SKU. **Matcha på `wixVariantId`, inte på `sku`.** Raden sa tidigare `sku`
>    "eftersom den överlever PATCH:en" — det stämmer inte när Steg 8 redan har försvenskat
>    SKU:n: då står `FP-kabelskalare-borrmaskin` i Wix mot `FP-hibrew-automatic-burr-eu` i
>    mappningen och en SKU-koppling ger tyst noll träffar (samma drift som katalogsvepen
>    längst ned varnar för). Släng raderna utan träff, sätt `wixVariantId` och stryk den
>    borttagna axeln ur `choices`. `PATCH /wix-data/v2/items/{id}` med
>    `fieldModifications:[{fieldPath:"variants",action:"SET_FIELD",setFieldOptions:{value:[…]}}]`.
> 3. **Skriv samtidigt mappningens `sku` till den nya** — annars ärver nästa polering samma
>    drift. Steg 8 rör bara Wix-sidan.
>
>    ⚠️ **Går PATCH:en inte fram — skriv hela raden med `PUT` i stället.** `PATCH
>    /wix-data/v2/items/{id}` har svarat `fieldModifications has size 0` trots en ifylld lista
>    (gatewayen är kinkig med bodyns form: `fieldModifications` ligger ibland direkt i bodyn,
>    ibland inne i ett `patch`-objekt — se 14B). Det som alltid biter är en full ersättning:
>    `PUT https://www.wixapis.com/wix-data/v2/items/{id}` med
>    `{ dataCollectionId: "FyndplatsMappings", dataItem: { id, data } }`. Priset är att `data`
>    **ersätts i sin helhet** — läs raden först och skicka tillbaka allt du inte ändrar, annars
>    tömmer du `shipsFromCountries`, `imageAnalysis` och resten tyst. Samma väg användes för att
>    reparera det typade `needsAiPolish`-värdet (se Fasta fakta).
>
> *(Svepet 2026-08-21: 22 nyimporterade köksmaskiner, 21 av dem med uttagsaxel — 123 varianter
> ned till 37. Utan regeln hade en svensk kund kunnat beställa en 110 V-juicer med US-stickpropp.)*

### 11E – "Dubblettfärger" är oftast två olika modeller

**TITTA innan du slår ihop.** Ser en
färgaxel ut att lista samma färg två gånger (`Vit` + `Vit (BMF201 White)`, `Svart` +
`Svart (BMF201 Black)`), är den vanligaste förklaringen INTE att säljaren råkat lista samma
vara dubbelt. Det är att listningen buntar **två olika modeller** i samma färger, och att
modellkoden hamnat i värdet. Bygg kontaktkartan över valens `linkedMedia` (Steg 4) och
jämför exemplaren innan du rör något.

> *(Mjölkskummaren `4a84e755`, 2026-08-21: de fyra "färgerna" var en display-/touchmodell och
> en vredmodell, i vit och svart. Att slå ihop dem hade raderat en riktig produktvariant.)*
>
> **Utvidga sedan jämförelsen till katalogen.** Samma svep avslöjade det egentliga felet: BÅDA
> maskinerna fanns redan som egna utkast — vredmodellen som `f207cfde`, displaymodellen som
> `8047b74e` — till **1429 kr från EU-lager**, mot den kombinerade listningens **1639 kr från
> Kina**. Den kombinerade tillförde ingen kombination som saknades och raderades.
>
> **Regel:** när en kombinerad listning täcker samma exemplar som två fristående, behåll de
> fristående. De är nästan alltid billigare (säljaren tar betalt för bekvämligheten), har oftare
> EU-lager, och ger en ren produktsida per maskin i stället för en axel som blandar modell och
> färg. Radera den kombinerade och märk mappningsraden `draftStatus:"rejected"` med tömd
> `variants[]` — behåll `supplierProductId` så dubblett-spärren hindrar en omimport, och
> `sourceUrl` så den går att hämta tillbaka medvetet med `allowDuplicate:true`.
>
> Överlever den kombinerade listningen i stället: **döp om axeln efter den verkliga skillnaden**
> ("Vit med vred" / "Vit med display"), inte efter leverantörens modellkod. Kom ihåg att
> `choice.name` är låst till `key` — namnen kräver att optionen byggs om från grunden, med
> `choiceType:"CHOICE_TEXT"` på varje nytt val och `price` på varje variant.

#### Omvänt fall: modellnamnet räcker inte för att kalla något en dubblett

11E varnar för att slå ihop det som ser likadant ut. Fällan går lika ofta åt andra hållet:
två listningar bär samma modellnamn, och man tar bort varianten ur den dyrare — trots att
det är två olika tält, cyklar eller maskiner.

> *(Naturehike Mongar, 2026-08-26.* `a6128860` *bar `2P -210T BASE- Blå` för 2 189 kr och*
> `3e9796c2` *bar `2P - 210T - Blå` för 2 119 kr. Samma märke, samma tyg, samma storlek,
> samma färg, 70 kr isär — en dubblett, tycktes det. Leverantörens EGNA swatch-kort sa något
> annat: `MONGAR BASE 2 · 43×18cm · 2,74 kg` mot `MONGAR 2 · 50×15cm · 2,4 kg`. Två modeller
> ur samma familj. Tillverkarens sortiment listar dem separat: **Mongar**, **Mongar BASE**,
> **Mongar Pro** och **Mongar UL** — fyra tält, ett gemensamt namn.)*

**Det som avgör är måtten, inte namnet.** Packmått och vikt skiljer sig alltid mellan två
modeller och aldrig mellan två färger av samma modell. Står de på leverantörens kort har du
svaret gratis; gör de inte det, slå upp modellen hos tillverkaren innan du tar bort något.

**Regel:** innan en variant tas bort som dubblett måste minst två mått stämma överens med
den som behålls — packmått och vikt, eller golvyta och vikt. Stämmer bara namnet och priset
är det INTE en dubblett. Ett borttaget säljbart exemplar syns aldrig i någon logg; det bara
slutar finnas.

Överlever ändå inte varianten (den passar inte sidans copy, resten av modellen är slutsåld),
**skriv ut det i rapporten** — vilken modell som försvann, till vilket pris, och vad kunden
kan köpa i stället. Det är ett beslut för en människa, inte en städning.

### 11F – Siffror i variantetiketten måste vara verifierade

Variantetiketten är det första och mest framträdande stället kunden möter en siffra: den
står i köpknappens rullgardin, i varukorgen och på ordern. **Leverantörens obekräftade
siffror hör inte hemma där.**

Klädställningen `f677f645` (2026-08-21) bar etiketten
`128–191 × 144–187 cm – dubbelstång, krom, 272 kg` medan hela beskrivningen — spec-tabell,
FAQ, kortet och "Det du bör veta" — förklarade att tillverkarens egen manual anger **140 kg**
och att leverantörens 272 kg är nära dubbelt så mycket. Kunden såg alltså den siffra vi
just motbevisat, på det mest synliga stället av alla.

**Regel:** i etiketten får bara stå det som är egenskaper (mått, antal stänger, färg,
ytbehandling) eller siffror vi kan stå för. Bärförmåga, effekt, räckvidd, kapacitet och
liknande prestandasiffror flyttas till spec-tabellen och kortet, **med källan utskriven**
(*"enligt tillverkarens manual"* respektive *"enligt leverantören"*).

Hittar du bara EN siffra som går att stämma av mot en manual och den visar sig uppblåst,
behandla resten av leverantörens siffror i samma listning som lika osäkra — skriv ut
källan på dem också i stället för att presentera dem som fakta. Att ta bort varianten är
sällan rätt svar: varan går att sälja, det är påståendet som ska bort.

Omdöpningen kräver ombyggd option (se [*Döpa om variantalternativ*](polish/varianter.md)) — planera
den i samma vända som övriga variantändringar så du bara betalar följdskadorna en gång.

-----

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

## Steg 13 – PUBLICERA produkten (1 anrop, mutation)

Rå-importer skapas som **draft** (`visible:false`) och syns inte i butiken. Detta är **sista steget** — kör det när Steg 6 (variantsanering), Steg 7–11 är klara och **verifierade** (rena `<h2>`-flikar; alla bilder kvar med `image.url`; **SKU re-synkad i Steg 8**; variantbilder kopplade). Hämta färsk `revision` först. *(Genväg bara för en produkt UTAN bild-/kategori-/variantarbete: slå ihop med Steg 8 — se noten där.)*

```
GET .../products/{PRODUCT_ID}        // färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": { "id": "{PRODUCT_ID}", "revision": "{FÄRSK_REVISION}", "visible": true } }
```

> Misslyckas någon verifiering: fixa först, publicera sedan. Hoppa över publiceringen bara om Leonard uttryckligen bett om draft. Frontend uppdateras via ISR (ingen redeploy).
>
> ⚠️ **`visible` kan flippa av sig självt under polerings-kedjan — kontrollera det, lita inte på att draft förblir draft (2026-08-04).** Efter Steg 7 → 8 → 9 på sex nyimporterade drafts stod **fem av sex på `visible:true`** redan innan publiceringen kördes, medan orörda produkter ur samma import fortfarande låg som draft. Den sjätte — den enda med optioner, vars Steg 11-PATCH skickade `options` + `variantsInfo` — stod tvärtom kvar på `false`. Praktisk regel: **läs `visible` i slutkontrollen** och sätt den explicit här i stället för att anta något. Är produkten inte klar än (bilder/kategori/varianter kvar) och har flippat till `true` i förtid: PATCHa tillbaka `visible:false` direkt.
>
> *Historik: #134 införde draft-only ("Leonard granskar och publicerar själv"). 2026-06-09 beslutade Leonard att publicera-efter-polering är standard igen — i linje med polish-knappens prompt (`app/admin/queue/polish-button.tsx`), som hela tiden instruerat publicering.*

-----

-----

## Steg 14 – Recensioner

Körs **efter** publiceringen — recensionerna är oberoende av produktsidan och kan
läggas till när som helst. Men de ska läggas till: en sida utan omdömen säljer sämre
än en med, och kedjan stod tom på 876 produkter innan den togs i bruk.

### 14A – Hämta recensionerna (1 anrop, mutation)

Kör **direkt efter publiceringen**. Steget saknades i runbooken fram till 2026-08-22,
och följden var mätbar: fem produkter i rad polerades klart utan att någon hämtade
recensioner till dem.

```
POST https://fyndplats-cache-warmer.vercel.app/api/reviews/import
x-fyndplats-token: {EXTENSION_API_TOKEN}
{ "wixProductId": "{PRODUCT_ID}" }
```

Utelämnas `reviews` hämtar rutten själv från leverantören. Anropet är **gratis** — det
är ett öppet JSON-anrop, ingen översättningstjänst rörs.

> ⚠️ **Rutten är token-skyddad** (`lib/auth.ts → isAuthorized`, headern
> `x-fyndplats-token` mot `EXTENSION_API_TOKEN`). Utan den svarar den `401 {"error":"Otillåten"}`
> — vilket är lätt att läsa som "produkten saknar recensioner". Har du inte token:
> hämtningen går även att göra för hand mot `feedback.aliexpress.com/pc/searchEvaluation.do`
> (`AE_FEEDBACK_ENDPOINT` i `lib/aliexpress/reviews.ts`, öppet JSON) och raderna skrivas direkt
> till `FyndplatsImportedReviews` via `/wix-data/v2/items`. Radformen är
> `_id: "<productId>__<reviewIdAE>"` plus `productId`, `reviewIdAE`, `rating`, `status`,
> `textOriginal`, `textSwedish`, `initials`, `customerCountry`, `date`, `importedAt`,
> `hasImage`, `imageUrl`, `imageUrls`. Gör du det: **äkthetsspärrarna är ditt ansvar** —
> släpp aldrig igenom `aigc: true` eller `status !== "1"`, och flytta hem bilderna själv
> (14B punkt 5), för då kör ingen `repairImages` åt dig.

> **Produkten är INTE klar när svaret säger `imported: 12`.** Raderna sparas som
> `status: "pending"` och är **osynliga för kund** tills någon skrivit om dem på svenska
> (14B). Det är avsiktligt: alternativet vore engelska omdömen på en svensk produktsida.
> Säg till Leonard att det ligger nya rader i kön — omskrivningen görs i chatten, i omgångar.

> Svaret bär även **`bildmissar`**. Är den > 0 kunde vi inte flytta hem alla kundbilder
> till vår mediahantering just då (Wix strypt eller nere). Raderna sparas ändå, med
> leverantörens adress kvar, och lagas av en `repairImages`-körning senare — se
> `.github/workflows/review-translate.yml`. Ingen åtgärd behövs i stunden, men siffran
> ska inte ignoreras om den är återkommande.

> Har leverantören inga recensioner alls svarar rutten `imported: 0`. Det är ett giltigt
> utfall — cirka 40 % av katalogen saknar dem, mest nya listningar. Notera det och gå
> vidare; hämtningen görs om automatiskt efter 30 dagar.

### 14B – Skriv om dem till svenska

```
POST /wix-data/v2/items/query  { dataCollectionId: "FyndplatsImportedReviews",
                                 query: { filter: { productId: "<produkt-id>" } } }
```

**Statusarna:** `pending` (importerad, osynlig) → `edited` (**publikt synlig**) ·
`approved` (äldre, redan svenska) · `rejected` (avvisad med skäl).

1. **Skriv om varje `pending` till naturlig svenska** och sätt `status: "edited"`.
   Originalet ligger kvar i `textOriginal`; din text går i `textSwedish`. Det är först
   som `edited` den syns för kunden.
2. **Kritik översätts ordagrant.** Att portafiltret känns billigt, att mjölkskummaren
   är seg, att doseringen inte är exakt — det ska stå. En sida med bara femmor
   läser som förfalskad.
3. 🔒 **Filtret är produkt kontra AE-transaktion, inte positivt kontra negativt.**
   Beröm för säljarens snabba leverans stryks — den beskriver AliExpress-affären, inte
   vår. Då måste **kritik** av samma sak strykas på samma grund. Sätt `rejected` med
   skälet i `rejectReason`. *(Grekisk 3★ på H17 avvisad 2026-08-23: klagomålet gällde
   att AE-säljaren skickat vad som såg ut som en retur — ingenting om produkten utöver
   "works ok".)*
4. **Anonyma konton får inget namn vidare.** Annars blir varje rad "A.S." och sidan
   ser påhittad ut.
5. ☠️ **Kontrollera bilddomänen.** `imageUrl` och `imageUrls` ska peka på
   `static.wixstatic.com`. Gör de det på `ae-pic-a1.aliexpress-media.com` hotlinkar vi
   AliExpress: bilderna försvinner när de roterar sitt CDN. Ladda ner, granska
   (kundfoton får inte innehålla ansikten eller personuppgifter), ladda upp med
   `UploadImageToWixSite` och skriv om fälten. *(2026-08-22: 79 av 892 recensionsbilder
   hotlinkade — hela batchen från 2026-08-21, eftersom medieimporten aldrig kört.)*

Skrivningen sker med **otypat** värde — samma fälla som i *Fasta fakta*:

```
PATCH /wix-data/v2/items/{recensions-id}
{ dataCollectionId: "FyndplatsImportedReviews",
  patch: { dataItemId: "<id>", fieldModifications: [
    { fieldPath: "textSwedish", action: "SET_FIELD", setFieldOptions: { value: "<svensk text>" } },
    { fieldPath: "status",      action: "SET_FIELD", setFieldOptions: { value: "edited" } } ] } }
```

> Betygen skickas **inte** till Google. `PRODUCT_REVIEW_SCHEMA` i butiksrepot är
> default av så länge omdömena är AliExpress-köpares — se `CLAUDE.md`.

-----

## Klart-kriterium (checklista före publicering)

Gå igenom listan **innan** Steg 13. Faller något: fixa först, publicera sedan.
Steg 12 (kundläsningen) är gjord — den här listan ersätter den inte.

**Text**
- Namn, slug, SEO-titel och meta är på **svenska** och innehåller fokussökordet inkl. kvalificeraren. Inget dropship-märke kvar (etablerade märken som Pagani Design/LAIKOU behålls).
- Sökordet **krockar inte** med en annan produkt i katalogen (Steg 1).
- Bytte sluggen på en **redan publicerad** produkt? Då finns en redirect-rad från
  gamla sluggen (Steg 7). Utan den är den gamla URL:en död och rankingen borta.
- Elprodukt: **ingen uttags-/spänningsaxel kvar** med US/UK/AU/KR eller 110 V (Steg 11D), och varje kvarvarande variant har både lagerpost och mappningsrad.
- Ser två val på samma axel ut som samma färg: **exemplaren är jämförda i bild** (Steg 11E), och listningen dubblerar ingen billigare fristående produkt i katalogen.
- **"EU-lager"-ribbonen är täckt av den SPARADE SKU:n.** Kravet är `variants[].shipFrom`
  i mappningen, inte produktens `shipsFromCountries` — den listan är en mängd över
  listningens lager och säger inget om vilket lager den variant vi faktiskt beställer
  ligger i. Saknas `shipFrom` (importerad före 2026-08-21) → verifiera mot leverantören
  eller ta bort ribbonen innan publicering. `GB`, `RU` och `US` räknas som EU av
  `isEuCountry` (den mäter *snabb leverans*, inte tullunion) — mot en svensk kund är de
  inte EU-leverans, så en produkt vars enda "EU"-lager är brittiskt eller ryskt ska inte
  bära ribbonen.
  **INKÖPSSIDAN är löst i kod sedan 2026-08-21** (PR #486): importens lagerval,
  mappnings-reparationen och lager-failovern använder numera `isEuCustomsUnion`, så
  ingen NY produkt kan få sitt lager valt utanför tullunionen. Leta inte efter den
  buggen. Kvar för dig är bara RIBBONEN, som fortfarande går på `isEuCountry` —
  den beskriver leveranstid, och där är GB faktiskt snabbt.
- **Beskrivningen har INGET "Det du bör veta innan du köper"- eller "Bra att veta"-block** (Steg 7). De fångade leverantörsfelen är i stället rättade direkt i löptexten och i spec-tabellen. Det som verkligen avgör ett köp — passar-det-mått, vad som ingår, hur den ska fästas — står som vanlig mening i det avsnitt där det hör hemma, inte som en varningslista.
- **Variantetiketterna innehåller ingen obekräftad prestandasiffra** (Steg 11F) — bärförmåga/effekt/kapacitet står i spec-tabellen och på kortet, med källan utskriven.
- **Galleriets ordning:** bild 1 = renaste produktbilden, **bild 2 = verklighetsbild**, därefter egna kort och sist måttritning (Steg 9).
- **Varje färg-/modellvals `linkedMedia` är en produktbild av den varianten**, inte ett Fyndplats-kort (Steg 11B).
- **Svensk sifferstil** genom hela texten: decimalkomma, `10/20/30 cm` (aldrig kommalista), `72 × 57 × 56 cm`, tankstreck i intervall.
- Flik-rubrikerna ligger som **rena `<h2>`** — inte feta/`<span>`-lindade — så de renderas som **flikar** på PDP:n, inte inline.
  ☠️ **Strängen måste stämma ORDAGRANT.** Butiken delar upp beskrivningen på tre exakta rubriker:
  **`Tekniska specifikationer`** · **`Användning och skötsel`** · **`Vanliga frågor`**. Skriver du
  `Specifikationer` — vilket är den naturligare svenskan och därför den man glider ner i — matchar
  splittern inte, och hela spec-tabellen renderas **inline mitt i brödtexten** i stället för som flik.
  Det ser inte trasigt ut, det ser bara ut som en till rubrik, och därför upptäcks det inte i
  slutkollen. Fyra produkter i rad (`2ad9b84b`, `899eabfe`, `ae436a28`, `8da26d68`) gick live så
  2026-08-26/27 innan Leonard såg det i butiken. Kontrollera i den RENDERADE sidan att
  `<summary>Tekniska specifikationer</summary>` finns — inte att ordet står någonstans i HTML:en.
- **`Användning och skötsel` är inte valfri när varan har skötsel.** Textil, sammet, tält, trä
  och allt som ska tvättas, torkas eller efterdras ska ha fliken. Den föll bort i samma glidning
  som rubriken ovan.

**Bilder**
- Plats 0 **visar hela varan tydligt**: vit studio-hjälte när en användbar källa finns, annars den renaste hela bilden. **Aldrig ett kort.** *(Miljöbild eller bild med människor är rätt svar när ingen ren källa finns — se `H-M` och fågelbogungenoten i bildmetoderna.)*
- Alla items har kvar `image.url` efter media-PATCH:en (verifiera med separat re-GET, **inte** på PATCH-svaret), och **varje** alt-text är svensk, unik och beskriver det som faktiskt syns.
- Ingen bild innehåller kvarlämnad utländsk text — och ingen bild har en **retuscherad vara** (kapade kanter, vita hack, borttagna delar).

**Data**
- SKU:n matchar den **polerade sluggen** (`FP-<svensk-slug>-<variant>`) — inga engelska råord; re-synkad i Steg 8.
- Priset är **orört** — importens pris står kvar (hela kronor med 9-slut).
- Kategori kopplad som **förälder + löv** (Steg 10A) — inte bara lövet, inte bara toppen.
- Variantsaneringen (**Steg 6**) och variantbildkopplingen (**Steg 11B**) är gjorda; varje choice som ser olika ut har ett **unikt** `linkedMedia`-id.
- **`visible:true` på produkten OCH på varje `variantsInfo.variants[].visible`** — annars syns produkten men går inte att lägga i varukorgen (se dödskalle-noten i Steg 11).

*(Engångs-bekräftat: frontend renderar `<title>`/`<h1>`/meta från fälten och skickar egen `Product`-JSON-LD. Du behöver inte kontrollera detta per produkt.)*

-----

**Leverantörens uppgifter**
- Varje siffra på sidan är **verifierad eller utelämnad** (Steg 5). Inget superlativ
  utan mätvärde bakom sig, ingen uppgift som leverantörens egna bilder motsäger.
- Produkttypen i namnet är vad varan **är**, inte vad leverantören kallar den.

**Recensioner**
- **Recensioner hämtade för produkten (Steg 14A)** — eller bekräftat att leverantören
  inte har några (`imported: 0`).
- Svarets `bildmissar` var **0**. Var den högre: notera det, raderna lagas av nästa
  `repairImages`-körning.
- `pending`-recensioner är omskrivna och satta till `edited`, eller `rejected` med
  skäl (Steg 14B).
- Ingen recensionsbild pekar på `ae-pic-a1.aliexpress-media.com`. Körs automatiskt av
  `scripts/katalogkoll.mjs` — du behöver inte kontrollera det per produkt.

## Katalogsvep – återkommande underhåll (inte per produkt)

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

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.