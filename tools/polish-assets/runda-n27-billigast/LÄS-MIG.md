# Runda N27 — åtta produkter, 1 629–1 699 kr

Åtta Aosom-utkast polerade och publicerade: ett skumklosspaket i fyra delar,
en åkhäst på hjul, en gnagarbur i fyra plan, ett barnskrivbord med sittbänk,
en mediahylla för skivsamlingen, en cykelkärra som blir dragvagn, en
klätterställning i trä och ett reptilterrarium på träben.

☠️ **Prisplatån 1 629 kr bröts, och det var inte ett val.** N24–N26 höll sig på
en platå; N27 kunde inte. Vid urvalet fanns bara **två** tyska utkast kvar på
exakt 1 629 kr, och av de tolv på 1 639 kr föll tio bort i skärmen nedan.
Rundan går därför 1 629 → 1 699 och tar det billigaste som var rent i varje
steg — cheapest-first är regeln, inte platån.

| id | produkt | SKU | pris |
|---|---|---|---:|
| bf4298b2 | Skumklossar 4 delar – ramp, trappa, tunnel och halvcylinder | FP-skumklossar-4-delar | 1 629 kr |
| e903f29c | Åkhäst i plysch på hjul – för barn 3–5 år, bär 25 kg | FP-akhast-plysch-hjul | 1 629 kr |
| a93e2e5a | Gnagarbur 128 cm med fyra plan, hängmatta och hjul | FP-gnagarbur-128-cm-fyra-plan | 1 639 kr |
| 37f968fe | Barnskrivbord med sittbänk och bokhylla, 3–8 år | FP-barnskrivbord-sittbank | 1 649 kr |
| d7e75081 | Mediahylla 175 cm med 18 fack för cd, dvd och blu-ray | FP-mediahylla-175-cm-18-fack | 1 669 kr |
| 4b48e10f | Cykelkärra 2-i-1 för varor – blir dragvagn, 55 liter | FP-cykelkarra-2-i-1-varor | 1 669 kr |
| 590b1f2d | Klätterställning i trä med klätterbåge, ramp och griffeltavla | FP-klatterstallning-tra-ramp | 1 699 kr |
| e5049d65 | Reptilterrarium 140 liter på träben med glaslucka | FP-reptilterrarium-140-liter | 1 699 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (åtta körningar, åtta loggar lästa).
Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta,
ingen slutsåld, ingen låst. `aosomFreightShare` 0,240–0,384 — ingen i närheten
av 0,5-tröskeln. Saldon 45–197.

## ☠️ Urvalet: tio av arton kandidater föll, och fyra av dem på SALDO

Arton utkast granskades. Bara åtta gick igenom, och skälen är värda att spara
eftersom de fördelar sig över fyra helt olika spärrar.

### Fyra föll på `aosomSyncedQty: 0` — och bara `las` kunde se det

| id | produkt | pris |
|---|---|---:|
| `378cd212` | Hochbeet / odlingslåda 120 × 60 × 74 | 1 639 kr |
| `730e0746` | Rollstuhlrampe / rullstolsramp i aluminium | 1 659 kr |
| `3a42c047` | Hollywood-sminkspegel med 18 lampor | 1 679 kr |
| `5108bef9` | Spegelteleskop 114 mm | 1 699 kr |

⚠️ **Ingenting i katalogen avslöjar det.** Produkterna ligger kvar som
synbart normala utkast med rätt pris och `stämmer: true`; det är bara
mappningsradens saldo som säger att varan inte går att köpa. Det är exakt
skälet till att CLAUDE.md kräver en FÄRSK `las` per kandidat i stället för
en cachad lista.

⚠️ **Och `aosomSyncedAt` är INTE en genväg till samma svar.** De fyra
slutsålda bar gamla stämplar (2026-08-28 till 2026-09-08), vilket ser ut som
en användbar proxy — men `a93e2e5a` och `37f968fe` bär lika gamla stämplar
(2026-09-02, 2026-08-31) och har 197 i saldo. Skälet står i CLAUDE.md: en rad
vars saldo inte ÄNDRATS får ingen ny stämpel. Korrelationen är en tillfällighet,
inte en regel.

### ☠️ En föll på LICENSFIGUR — och bara bilden visade det

`c5fc0b7b` (Kinder-Autoscooter, 1 699 kr, saldo 8) passerade saldot,
prisgrinden, dubblettskärmen och familjetätheten. Den tyska texten inleds
med *"Entdecken Sie den ultimativen Spielspaß mit dem **Angry Bird** Kinder
Elektroauto!"* — och bild 1 visar tre runda dekaler med Angry
Birds-figurer på skalet, plus en fjärde på fronten.

Det är runbookens stoppklass ordagrant: *"Licensfigurer och skyddade
kännetecken → stopp och radera … **Det finns ingen version utan märket —
märket ÄR produkten.**"* Klassen står som "gäller i praktiken bara
AliExpress"; här satt den på en Aosom-rad.

⚠️ **Produkten är INTE pensionerad härifrån.** Om Aosom har en Rovio-licens
är upplägget lagligt, och det vet vi inte. Raden är flaggad till Leonard
nedan och lämnad orörd — en radering går inte att ångra.

### Sex föll på DUBBLETT eller mättad familj

| id | produkt | varför |
|---|---|---|
| `635c990e` | Absperrgitter för hund 432 × 36 × 70 | trippelträff mot **publicerade** `hundgrind-432-cm-furu-och-stal`, plus tre tyska utkastsyskon med identiska mått |
| `99cae2fd` | Husdjurs-cykelvagn 130 × 73 × 90 | trippelträff mot publicerade `cykelkarra-hund-20-tum-universalkoppling`; elva publicerade hundvagnar i familjen |
| `8b9778bd` | Polytunnelväxthus 300 × 200 × 200 | publicerade `tunnelvaxthus-rullbar-dorr-fonster-200x300-cm` OCH `polytunnelvaxthus-forzinkat-stal-300x200x197-cm` |
| `05fc296e` | Folieväxthus 595 × 300 × 200 | trippelträff mot utkastet `e4599299` (samma mått i namnet) + publicerade `polytunnelvaxthus-…-600x300x197` |
| `98b6d1d5` | Växthus 500 × 200 × 205 | familjen mättad: **25 publicerade växthussidor** |
| `48a2effb` m.fl. | Sitzbank mit Stauraum 100 × 40 × 44 | trippelträff mot **publicerade** `46843188` + sex tyska utkastsyskon; 15 publicerade förvaringsbänkar |

`141a4624` (bartisch-set) och `512a4396` (kaninstall) föll på samma grund:
nio publicerade barbord respektive ett utkastsyskon (`beb5d127`) med identiska
mått, och för kaninstallet dessutom en L80-fråga som inte gick att avgöra
säkert på de uppgifter källan ger.

### ☠️ En föll på DJURSKYDDSMÅTT, och den var inte marginell

`16b8a47c` (Vogelkäfig/papegojbur, 1 659 kr) såg ut som rundans bästa fynd:
**noll publicerade fågelburar i hela katalogen**, alltså en helt tom
kategori. Måtten fäller den:

| SJVFS 2019:15, fågel ≤20 cm | krav | buren |
|---|---:|---:|
| Golvyta | 0,31 m² | **0,2025 m²** (45 × 45 cm) |
| Längsta sida | ≥0,7 m | **0,45 m** |
| Höjd | ≥0,6 m | 0,68 m ✓ |

Två krav av tre underskrids, och inte nätt och jämnt. Runbookens gräns är
hård: *"Under gränsen → importera/polera inte."* Raden är flaggad till
Leonard, inte pensionerad härifrån.

## Dubblettskärmen: full täckning, noll äkta dubbletter bland de åtta

Skärmen kördes som `DUBBLETTMATNING.md` kräver — måtttrippel ur den TYSKA
källans egen `Technische Daten`, jämförd mot hela katalogen i BÅDA
riktningarna (publicerade sidor och övriga utkast) — och täckningen räknades.

| svep | lästa rader | med `plainDescription` | utan |
|---|---:|---:|---:|
| Hela katalogen, omgång 1 (12 kandidater) | **5 865** | **5 865** | **0** |
| Hela katalogen, omgång 2 (4 kandidater) | **5 865** | **5 865** | **0** |

⚠️ `utanText` räknades och var **0 i varje chunk**. Utan den räknaren hade ett
svep som tappat `fields` på sida 2 gett noll krockar och sett ut att ha gjort
sitt jobb — det är #N9 ordagrant, och den enda skillnaden mellan en grind och
en vana.

**Träffarna på de åtta som blev kvar är alla FALSKA eller draft-syskon:**

| kandidat | träff | dom |
|---|---|---|
| `bf4298b2` 150 × 50 × 39 | `ebb597b4` + `638f2110` (utkast) | tyska syskon, INTE publicerade → ingen levande dubblett |
| `d7e75081` 78,5 × 24 × 175 | `fab903b6` + `7e08f1df` (utkast) | tyska syskon, INTE publicerade |
| `37f968fe` 80 × 29 × 80 | `bae80676` skoställ, `222f59d6` byrå | falsklarm — generiskt fotavtryck |
| `590b1f2d` | ingen | — |
| `a93e2e5a` 80 × 52 × 128 | ingen | — |
| `e903f29c` 70 × 30 × 75 | ingen | — |
| `4b48e10f` 53 × 43 × 110 | ingen | — |
| `e5049d65` 100 × 50 × 60 | ingen | — |

☠️ **Att syskonen är UTKAST är hela skälet att publicera ändå** — samma
resonemang som N26:s färgsyskon. Det finns ingen publicerad sida för någon av
modellerna, så en ny sida skapar ingen levande dubblett. Presentationsfrågan
(en sida per variant eller en med val) står kvar som Leonards.

## Fyra sakfel hittade och rättade — tre av dem i bilderna

Husregeln från runda J1 (*"titta på bilderna FÖRE texten"*) betalade sig igen:
tre av fyra fynd står i pixlarna och i inget tal.

- ☠️ **`4b48e10f`: titeln säger "3-in-1", produkten är 2-i-1.** Den tyska
  `Beschreibung` säger ordagrant *"Zwei ins Eins: kann als Fahrradanhänger
  oder als Einkaufstrolley verwendet werden"*, `Lieferumfang` listar
  *"1 x Lastenanhänger"*, och måttbilden visar exakt TVÅ lägen: upprätt
  dragvagn på 110 cm och tillkopplad cykelkärra på 74 cm. Det tredje läget
  finns inte. Sidan säger 2-i-1. Samma klass som runbookens `Gaming Stuhl`
  och `Frühbeet`: **titelns kategoriord är en hypotes, inte ett faktum.**

- ☠️ **`590b1f2d`: importens `Mått`-rad beskriver EN DEL, inte produkten.**
  Källan anger `Kletterbogen 100 × 52,5 × 48 cm` och den raden blev
  spec-tabellens `Mått`. Måttbilden ger uppställningens verkliga fotavtryck:
  **247 × 80 cm**, alltså två och en halv gånger så långt. Samma fel som
  N26:s bistroset. Spec-raden skriver nu båda.

- **`bf4298b2`: `Farbe: Rot` är fel, och importens `Mehrfarbig` är otolkad
  tyska.** Källans egen `Beschreibung` räknar upp fyra tvåfärgade klossar
  (grön/röd, mörkblå/gul, blå/röd, röd/gul) och bilderna visar precis det.
  Spec-raden skriver `Flerfärgad`.

- **`e903f29c`: källan kallar hästen både `Reitpferd`, `Stehpferd`,
  `Rollpferd` OCH `Schaukelpferd`.** Bilderna avgör: fyra hjul, ett
  trähandtag genom halsen och en trampmekanism under buken — en ÅKHÄST, inte
  en gunghäst. Färgen är också fel i båda källorna (`Dunkelbraun` respektive
  `Kaffee-Braun`); varan är ljusbrun med mörkbrun man. Ordet `gunghäst` hade
  dessutom krockat med tio publicerade sidor.

## Facit bevisat mot skarpa Wix — och spärren fällde på riktigt

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret, alltså genom exakt
den transkribering huset har mätt upp som felkällan. Båda kontrollerades
därför mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` per produkt och över bildlistan, jämförd på servern.

☠️ **Första körningen gav `7 av 8 text LIKA`.** `590b1f2d` hade RÄTT
teckenantal (2136) och FEL summa — alltså en substitution, inte en tappad
byte. Två fel tog ut varandra i längd: jag hade skrivit `Klettergsüsts`
(ett tecken för lite) och `Klettterger üst` (ett tecken för mycket).

⚠️ **Det är just därför facit måste MÄTAS och inte läsas.** En avskrift med
rätt längd ser korrekt ut i varje ögonkontroll, och hade den fått stå hade
siffergrinden grindat mot en källa som inte fanns. Efter rättelsen:
**8 av 8 text LIKA, 8 av 8 bildlista LIKA.**

## Fyra bilder strukna — tysk text inbränd i pixlarna

| id | position | vad bilden säger |
|---|---:|---|
| `e903f29c` | 3 | Gewichtsgrenze: 25 kg · Empfohlenes Alter: 3–5 Jahre |
| `e903f29c` | 4 | GEEIGNET FÜR GLATTE UND HARTE STRASSEN |
| `4b48e10f` | 4 | Reißverschluss für leichtes Öffnen · Bequemer Griff · Leichter Aluminiumrahmen · … |
| `590b1f2d` | 4 | EIN TOLLES GESCHENK FÜR KINDER · Grobmotorische Fähigkeiten · 18–48 Monate |

⚠️ **`e903f29c` blir därmed rundans enda treBILDsprodukt**, eftersom BÅDE
måttbilden och detaljbilden bar tysk text. Måttbilden är den dyra förlusten —
den hade burit 70/30/75/48 cm — men talen står i stället i brödtexten och i
spec-tabellen. `bygg-media.py` och `gate-alt.py` räknar antalet ur
`bilder.tsv` minus `bilder-bort.tsv` i stället för att anta fem, så ingen av
dem klagade.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side) | **7/8 → rättat → 8 av 8 text LIKA, 8 av 8 bildlista LIKA** |
| `gate.py` (siffergrind mot `kallor.json`, ordlista, flikar, taggar) | 0 fynd i 8 filer, 0 varningar |
| `bygg-axelfacit.py` + `gate-axel.py` | **1 axelfel fångat och rättat** (se nedan), sedan 0 axelfel i 8 texter, 0 axelkonflikter i källan |
| `gate-alt.py` | 0 fynd, 8 produkter, 36 alt-texter — REN på första körningen |
| `gate-seo.py` | 0 fynd i 8 rader (titlar 41–57 av 60, beskrivningar 143–157 av 160) |
| `gate-lager.py` | **2 fynd → ids.tsv rättad → 0 fynd** i 8 produkter, lägsta saldo 45 |
| `gate-sku.py` | **2 fynd → samma orsak → 0 fynd** i 8 rader (längsta 29 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (49 filer, 385 SKU:er) | 8 av 8 unika, noll krockar, noll prefixöverlapp |
| `gate-superlativ.py` | REN, 8 filer, inga kvitterade superlativ behövdes |
| `gate-lankar.py` | 0 fynd, inga korslänkar i rundan |
| Läcksvep (`gatelib.ARTNR` + ordlista) över rundans alla filer | **0 fynd** |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 3 (kategori, bulk add-item) | 8 anrop, `totalFailures: 0`, per-rad `success: true` |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | 8 av 8 skrivna; `visible` medskickat, variantens `visible` oförändrat |
| Samlad SEPARAT slutläsning av alla fyra stegen | **8 av 8 helt verifierade** |
| Mappningsstämpling + oberoende `las`-verifiering | 8 av 8 |
| `hamta-live.sh` + `livegrind.py` (ISR-medveten live-verifiering) | 8/8 HTTP 200, **8/8 REN, 0 avvikelser** i den publicerade texten (orddiff 0 på alla åtta) |

⚠️ **`gate-lager.py` och `gate-sku.py` fällde på rätt sak.** Båda hittade att
`ids.tsv` fortfarande innehöll `378cd212` och `730e0746` — de två som
`las`-kontrollen precis hade slagit ut på saldo. En fil som inte följer med
när urvalet ändras är exakt vad de två grindarna finns för.

⚠️ **`gate-fragment.py` kördes och gäller INTE den här rundan.** Den rapporterar
`[SKRIVER OM SPEC-FLIKEN]` på fyra filer, vilket är korrekt beteende: grinden
är byggd för TILLÄGGSfragment som bara ska lägga till flikar på en redan
publicerad produkt. N27 skriver hela `plainDescription`, precis som N26, så
spec-fliken SKA finnas i filen.

### ☠️ Axelgrinden fällde `e903f29c` — och hade rätt

Första utkastet skrev *"Hela hästen är 70 cm lång, 30 cm bred och 75 cm hög"*.
Det är naturlig svenska om ett djur, och det är fel mot husets axelkonvention:
positionellt är tal 2 DJUPET, så 30 cm är hästens djup och 70 cm dess bredd.
Meningen skrevs om till en ren trippel — `70 × 30 × 75 cm` — vilket är sant
oavsett vilken konvention läsaren bär med sig.

## Kategorier

| id | kategori |
|---|---|
| bf4298b2 (skumklossar) | Barn & Familj → Baby & Småbarn |
| e903f29c (åkhäst) | Barn & Familj → Leksaker & Spel |
| a93e2e5a (gnagarbur) | Husdjur → Burar, Kläder & Tillbehör |
| 37f968fe (barnskrivbord) | **Barn & Familj** (toppnivå, inget löv) |
| d7e75081 (mediahylla) | Hem & Inredning → Förvaring & Organisering |
| 4b48e10f (cykelkärra) | Sport & Fritid → Bil & Cykel |
| 590b1f2d (klätterställning) | Barn & Familj → Leksaker & Spel |
| e5049d65 (reptilterrarium) | Husdjur → Burar, Kläder & Tillbehör |

⚠️ **`37f968fe` får toppkategorin, och det är kontrollerat mot precedens.**
Trädet har inget löv för barnmöbler: `Leksaker & Spel` är fel (det är en
möbel) och `Baby & Småbarn` är fel (varan är för 3–8 år). Den publicerade
`barnbord-med-stol` — samma produkttyp, 3–6 år — bär exakt `Barn & Familj`
utan löv. Runbooken tillåter det uttryckligen: *"Finns inget löv som passar
räcker toppkategorin."*

⚠️ Konventionen EN riktig kategori plus Wix egna `All Products` kontrollerades
mot tre publicerade N26-produkter innan skrivningen, inte antagen. Slutläsningen
visar `antalKat: 2` på alla åtta.

## Tre husmärken flaggade till Leonard

Tre av produkterna bär ett fysiskt tredjepartsmärke på själva varan. Det går
inte att redigera bort och skrivs därför ALDRIG in i produkttexten — det
flaggas här, samma hantering som HRC/VINSETTO/PawHut/SPORTNOW/Outsunny/DURHAND
i tidigare rundor:

| id | märke | var |
|---|---|---|
| `a93e2e5a` | PawHut | liten skylt på burens övre vänstra ramhörn, synlig i bild 1, 3 och 5 |
| `e5049d65` | PawHut | skylt på terrariets främre vänstra hörn, synlig i bild 1, 2 och 5 |
| `4b48e10f` | HOMCOM | tryckt på packväskans lock, synligt i bild 1, 2 och 3 |

## ☠️ FLAGGAT TILL LEONARD: två affärsbeslut, inget av dem taget här

1. **`c5fc0b7b` — Angry Birds-dekaler på en Aosom-vara.** Produkten (1 699 kr,
   saldo 8) bär Rovio-figurer tryckta på skalet och kallas *"Angry Bird Kinder
   Elektroauto"* i leverantörens egen text. Frågan är om Aosom har licensen.
   Har de det är varan säljbar; har de det inte är det varumärkesintrång med
   tullbeslag och Merchant Center-risk som följd. **Raden är orörd** — varken
   polerad eller pensionerad.

2. **`16b8a47c` — papegojburen underskrider SJVFS 2019:15.** Golvytan är
   0,2025 m² mot kravet 0,31, och längsta sidan 0,45 m mot kravet 0,7. Det är
   en stoppklass enligt runbooken, och kategorin är dessutom den enda HELT
   TOMMA som skärmen hittade (noll publicerade fågelburar). Om sortimentet ska
   ha fågelburar behövs en större modell. **Raden är orörd.**

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N26: inget `kort-filer.tsv` finns i rundans
katalog, så ingen produkt fick ett eget faktakort.
`bygg-medieskrivning.py` skriver då bildlistan exakt som `bygg-media.py`
lämnade den, och rapporterar "inget kort denna runda" per produkt — ett
uttalat val, inte en tyst utelämning.

## Fotoräknade tal, kvitterade

`foto-tal.txt` bär sex rader. Alla är avlästa på produktens egen måttbild eller
räknade på ett foto, och ingen står i den tyska källtexten:

| id | tal | vad |
|---|---:|---|
| `a93e2e5a` | 2,5 | gallrets maskavstånd, utsatt i måttbildens förstoring |
| `4b48e10f` | 120 | handtagets vinkelläge i grader |
| `4b48e10f` | 74 | höjd i cykelvagnsläge |
| `590b1f2d` | 87,5 / 80 / 247 | ställningens bredd och djup samt hela uppställningens längd |
| `e903f29c` | 4 | antal hjul, räknade på bild 1 och 5 |
| `e5049d65` | 5 | ventilationsgaller per gavel (källan anger bara 10 totalt) |

## Live-verifiering: 8/8 REN, 0 avvikelser

`hamta-live.sh 90` + `livegrind.py` mot de publicerade, ISR-färska sidorna:
**8/8 HTTP 200 (142–153 kB), 8/8 REN, 0 avvikelser i den PUBLICERADE texten**,
och grinden avslutar med `exit 0`.

Orddiffen mot källfilen är **0 på alla åtta** (401–497 ord per sida — rundans
längsta text är `590b1f2d`). `REN` betyder att samtliga delkontroller gick
igenom, inte bara orddiffen: homoglyfsvepet, sid-, alt- och SEO-svepen,
de tre obligatoriska flikrubrikerna som `<summary>`-element, brödsmulans
andra led (alltså en riktig kategori, inte `Hem / Butik / produkt`) och
`OutOfStock`-kollen. SEO-svepet jämför `<title>`, `description`, `og:title`
och `og:description` EXAKT mot `seo.tsv`, och alt-svepet läser in i
`alt=""` — de två ställen där tyska rester annars överlever en felfri
textpolering.

⚠️ **Åldrarna lästes innan svepet togs på allvar**, och de är inte
enhetliga:

| sida | `age` vid skarp hämtning | vilken rendering |
|---|---:|---|
| sju av åtta | 133–134 s | den som OMTRÄFFEN startade (~18:23) |
| `e5049d65` | **450 s** | den som den VARMA TRÄFFEN startade (~18:17:45) |

`e5049d65` låg sist i den varma träffens loop, så när omträffen kom var
dess ålder ~308 s — precis över femminutersfönstret, men för nära för att
omrenderingen skulle hinna landa före den skarpa hämtningen. Det är
ofarligt här av exakt ett skäl, och det är värt att skriva ut: **den varma
träffen låg efter samtliga fyra skrivsteg**, så även den äldre renderingen
är en post-skrivning-rendering. Orddiffen bevisar det oberoende — hade
sidan burit utkastets tyska text hade diffen varit hela sidan, inte noll.
Samma observation som N26 gjorde på `66d781f8` (`age: 431`), och samma
slutsats: **en sida i taget är facit, ett svep är ett stickprov med
tidsberoende.** Läs `age` innan du litar på ett svep.

Rundans fyra Wix-skrivsteg är dessutom redan oberoende verifierade var för
sig i en separat, senare läsning (tabellen ovan), så live-grinden är det
FEMTE ledet, inte det enda.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i fem separata
led: facit mot skarpa Wix innan grindarna (8/8 LIKA efter att spärren fällt
ett äkta transkriberingsfel), textinnehållet efter skrivningen (8/8 LIKA mot
fil-hash i en senare, separat läsning), bild/kategori/SKU/pris i en samlad
slutläsning (8/8 helt verifierade, med både produktens och VARIANTENS
`visible: true`), mappningsstämpeln via åtta oberoende `las`-körningar, och
den publicerade sidan via `livegrind.py` (8/8 REN, orddiff 0).

Rundan räknas som klar utom faktakorten, som är en medveten uppskjutning av
samma skäl som N15–N26.
