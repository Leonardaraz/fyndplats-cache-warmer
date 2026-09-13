# Runda 142 Steg 15 — de två bevisade dubbletterna är OMMAPPADE

Leonards order: *"Mappa om äkta dubletter och fortsätt"*. Steg 1 hade bevisat
paren rad för rad mot den publicerade sidans egen spec-tabell; det här är
skrivningen.

## Artikelnumret hämtades ur FEEDEN, inte ur mappningen

`polish-mapping.yml` undanhåller `supplierProductId` från loggen med flit (repot
är publikt), så vägen till numret går via **`aosom-feed-search.yml`** — #528.
Sökorden togs ur utkastens EGNA tyska leverantörsnamn, lästa ur Wix i samma
session, inte ur minnet:

| utkastets tyska namn | fråga | träffar |
|---|---|--:|
| Boxsack freistehend 156 cm Standboxsack mit 12 Saugnäpfen | `boxsack 156` | **1** |
| 4-in-1 freistehender Boxsack-Ständer, 160-230 cm höhenverstellbar, Rot | `boxsack 160-230` | **1** |

Båda gav EXAKT en rad, och feedradens namn är ordagrant utkastets namn. Det är
kopplingen: en sökning som gett två träffar hade krävt ett bevis till, och en
som gett noll hade betytt att varan inte finns hos Aosom längre.

## Torrkörning först, sedan skrivning

☠️ `aosom-remap.yml` är `plan` som default, och planen lästes innan `byt`.

| behåll | pensionerad | kundpris i planen | hinder | utfall |
|---|---|--:|:--:|---|
| `757dba7c` `fristaende-boxningssack-156-cm` | `01f3293a` | 2 519 kr **ORÖRT** | inga | `byt` OK |
| `7aa1e2f5` `fristaende-boxningssack-160-230-cm` | `3c41342e` | 2 569 kr **ORÖRT** | inga | `byt` OK |

Båda `byt`-körningarna svarade `verifierat vid aterlasning` — rutten läser
tillbaka raden och svarar 500 om den inte bär det nya artikelnumret. Det är
åttonde gången husets regel gäller: **ett svar utan fel är inget kvitto**, och
det är därför rutten mäter i stället för att anta.

**Marginalgolvet höll för båda.** Ett `plan`-svar utan `hinder` betyder att
`MIN_REMAP_MARGIN_PCT = 5` passerades — rutten AVVISAR annars. Talet självt
ligger bakom `visa_kostnad`, som är avstängd: loggen är publik.

⚠️ **Priset rörs aldrig.** Leonards regel, och den gör dessutom planen
granskbar: den nya marginalen står i planen och en prisändring blir ett eget
beslut.

## ☠️ Kostnaden som togs medvetet

`aosom-remap.yml` tar artikelnumret som ett workflow-input, och det hamnar
därmed i den PUBLIKA Actions-loggen (#417). Leonard har accepterat den läckan
uttryckligen — senast *"Kör ändå — läckan är värd det"*. Den är inte en
förbiseende utan ett pris.

## Prisdriften mot STEG1.md är väntad, inte ett fel

Steg 1 noterade behåll-sidornas priser som 2 289 och 2 329 kr. Planen läste
**2 519** och **2 569** ur butiken. Skillnaden är Aosom-synken och
AE-prisrundan som skrivit om priserna sedan dess — facit är butiken
(`jamforelsePris`), och planen läser just den. Ett tal ur ett dokument är inte
ett tal ur butiken.

## ☠️ Prisgrinden FALLER på båda sidorna efter ommappningen — och det är RÄTT

`polish-mapping.yml` lästes i läge `las` direkt efteråt, som en ANDRA och
oberoende mätning av att skrivningen tog (remap-ruttens egen återläsning är den
första). Båda visar `supplier: "aosom"`. Och båda faller på Steg 4:

| sida | supplier | needsAiPolish | draftStatus | variant-SKU | grossSek | prisgrind |
|---|---|:--:|---|---|--:|---|
| `757dba7c` | **aosom** | false | published | `FP-standing-punching-bag` | 2 519 | **FALLER** |
| `7aa1e2f5` | **aosom** | false | **rejected** | `FP-fristaende-boxningssack-rod` | 2 569 | **FALLER** |

Grindens egen text — *"kostnaden har ändrats sedan importen och priset i Wix är
gammalt"* — är ordagrant sann här, bara mycket färskare än den antar:
ommappningen skrev om `landedCostSek` till AOSOMS kostnad för en minut sedan,
medan butiken fortfarande bär det AE-härledda priset. Grinden gör exakt sitt
jobb.

☠️ **Följden är inte kosmetisk: BÅDA sidorna är PUBLICERADE och säljs.**
Aosom-synken (`20 */6 * * *`) räknar om priset ur kostnaden, jämför mot
BUTIKEN (`jamforelsePris`) och skriver inom ≤6 timmar — åt det håll kostnaden
pekar, med `MAX_PRISANDRING_PCT = 40` som spärr. Det är Leonards beslut
2026-08-28 ("synka oavsett om det går upp eller ner"), och det är hela poängen
med en ommappning: kundpriset ska följa den leverantör vi faktiskt köper av.

⚠️ **Det här är första gången i sessionen som en ommappning träffar en LIVE
sida i stället för ett utkast.** Tidigare ommappningar (#492, #493, #524, #549)
gällde sidor som redan var Aosom-prissatta eller opublicerade. Skillnaden är
värd att veta om innan nästa: **en ommappning av en publicerad sida ändrar
kundens pris inom sex timmar.** Den flyttar inte bara bokföringen.

Ingen åtgärd härifrån. ☠️ Priset rörs aldrig av poleringen, och att räkna om
det för hand vore precis det grinden säger nej till.

## ✅ #559 STÄNGD: `7aa1e2f5` stod `rejected` men såldes

Läsningen bekräftade fyndet från Steg 1 exakt: en sida som är `visible: true`,
svarar 200 och ligger i sitemapen bokfördes som **pensionerad**. Ommappningen
rör inte `draftStatus` på behåll-sidan — med flit, den skriver bara
leverantörsfälten — så stämpeln låg kvar efteråt.

`polish-mapping.yml` äger fältet (`draftStatus` är ett av exakt tre i
allowlisten), och `stampla` kör ingen prisgrind, så den går att laga trots att
Steg 4 faller. Skickad patch: **bara** `draftStatus: "published"`.
`needs_ai_polish` och `variant_skus` lämnades TOMMA — och det är inte slarv:
☠️ GitHub ersätter ett tomt input med dess `default`, vilket en gång
PUBLICERADE utkast som bara skulle få SKU:er. Defaulterna är tomma sedan dess,
och "tomt = rör inte" fungerar först därför.

Riktningen är den ofarliga: raden går från att ljuga om en levande sida till
att beskriva den. Ingenting i Wix ändras — `draftStatus` är bokföring, inte
synlighet.
