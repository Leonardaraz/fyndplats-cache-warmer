# Runda N28 — åtta produkter, 1 699 kr

Åtta Aosom-utkast polerade och publicerade: en hopfällbar klätterställning,
tolv takplåtar i trälook, en hundvagn, fyra stapelbara sittpallar, en byrå med
fem lådor, en elscooter för barn, ett katthus i två plan och två barstolar.

Rundan ligger på EN prisnivå — 1 699 kr — och det är inget val: N27 slutade
där, och av de tjugosju tyska utkasten på exakt 1 699 kr gick nio igenom hela
skärmen. Åtta valdes; den nionde (`ad46f9cc`) står nedan med skäl.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 01d8e819 | Klätterställning 3-i-1 i trä – hopfällbar med rutschkana och klättervägg | FP-klatterstallning-3-i-1 | 1 699 kr |
| a9c2bfd8 | Takplåt 12-pack i trälook – trapetsprofil 129 × 45 cm | FP-takplat-12-pack | 1 699 kr |
| c804d1b7 | Hundvagn hopfällbar för hundar upp till 20 kg | FP-hundvagn-hopfallbar | 1 699 kr |
| cb31a581 | Sittpallar 4-pack stapelbara i mörkgrönt | FP-sittpallar-4-pack | 1 699 kr |
| e5e8754c | Byrå 70 cm med fem lådor i grå toner | FP-byra-5-lador-70-cm | 1 699 kr |
| 329beada | Elscooter för barn 3–5 år – 6 V, tre hjul | FP-elscooter-barn-6v | 1 699 kr |
| 0000fa76 | Katthus i trä med två plan och uppfällbart tak | FP-katthus-tva-plan | 1 699 kr |
| 8ee517cc | Barstolar 2-pack i sammetslook – snurrbara | FP-barstolar-2-pack-sammet | 1 699 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (åtta körningar, åtta loggar lästa).
Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta,
ingen slutsåld, ingen låst. `aosomFreightShare` 0,234–0,384 — ingen i närheten
av 0,5-tröskeln. Saldon 27–137.

## ☠️ ETT SALDO PÅ 1, 2 ELLER 3 ÄR SLUTSÅLT FÖR KUNDEN — och grinden ser det inte

Två kandidater passerade varje befintlig spärr och föll ändå, och skälet är
värt att skriva ned eftersom ingen grind i huset fångar det:

| id | produkt | `aosomSyncedQty` | vad kunden hade sett |
|---|---|---:|---|
| `eb8ed6ce` | Takfläkt med LED och fjärrkontroll | **1** | Slutsåld |
| `14d6cc9e` | Sideboard med justerbara hyllplan | **1** | Slutsåld |

Aosom-synken visar inte leverantörens tal rakt av. `synligtSaldo()` i
`lib/aosom/sync.ts` drar av `LAGER_BUFFERT = 3` och returnerar **0** för allt
som är tre eller mindre — bufferten finns för att feeden bara uppdateras tre
gånger per dygn, och den är rätt. Följden är att saldot 1 blir lagersaldot 0 i
butiken.

⚠️ **`gate-lager.py` kan inte se det.** Dess `TUNT = 5` ger en VARNING under
fem och FÄLLER bara på `<= 0`. Ett saldo på 1, 2 eller 3 passerar alltså
grinden som "tunt, men köpbart" när det i själva verket renderar en
publicerad sida som säljer ingenting. Samma familj som resten av huset:
tröskeln var rimlig när den skrevs och mäter inte det som avgör.

Båda produkterna är därför INTE polerade. `eb8ed6ce` är ett särskilt surt
tapp — takfläktar är en i praktiken tom kategori (1 publicerad sida).

## Urvalet: nitton av tjugosju kandidater föll

### Två föll på `aosomSyncedQty: 0`

| id | produkt |
|---|---|
| `0418cc67` | Soft-Baustein-Set i nio delar |
| `5108bef9` | Spegelteleskop 114 mm |

`5108bef9` är samma rad som N27 slog ut på saldo, och den är fortfarande 0 med
en stämpel från 2026-08-28. Kontrollen gjordes om ändå — en cachad slutsats om
lagersaldo är ingen slutsats.

### Fem föll på en PUBLICERAD dubblett

Måtttrippeln ur den tyska `Technische Daten`, matchad mot hela katalogen:

| kandidat | mått | krockar med publicerad |
|---|---|---|
| `06e3fd94` | 110 × 60 × 65 | `542cbd16` *Trädgårdsbord i massivt trä 110 × 60 cm – vagnshjulsben* |
| `5e91a8a2` | 155 × 71,5 × 77 | `566f41df` *Cykelvagn för last 2 hjul – hopfällbar cykelkärra* |
| `9932d58b` | 70 × 50 × 120 | `25bc6c84` *Odlingsskåp i trä 120 cm med tre uttagbara hyllplan* |
| `b64241c9` | 130 × 73 × 90 | `571e37bf` *Cykelkärra för hund med 20-tumshjul* |
| `faa0af12` | 49,5 × 49,5 × 80 | `8dd5887b` *Matstolar 2-pack i konstläder – böjträ och metallben* |

⚠️ `b64241c9` är samma fysiska vara som N27 avvisade under id:t `99cae2fd`.
Två artikelnummer, två utkast, en produkt — precis den klass CLAUDE.md
beskriver som Aosoms egen feed-dubblett.

### Sex föll på ett internt utkastkluster eller en mättad familj

| id | produkt | varför |
|---|---|---|
| `33cde470` | Bodensofa 102 × 73 × 60 | utkastet `22cfc372` bär **måtten i sitt eget namn**; 19 publicerade golvfåtöljer |
| `14eb4cb4` · `7d89c4e4` · `7dcdc0f6` | Sitzbank mit Stauraum | tre till fyra tyska utkastsyskon var; samma familj N27 avvisade |
| `aa8ce611` | Klappbarer Esstisch | **tre** utkastsyskon med IDENTISKT namn (1 399, 1 359, 1 449 kr) |
| `e93fab42` · `f9e1bd38` | Relaxsessel / bäddfåtölj | 225 publicerade fåtöljsidor |

### En verifierad kandidat valdes bort med flit

`ad46f9cc` (Elektro-Motorrad 12V, saldo 18, `stämmer: true`) är ren i varje
spärr men har **två utkastsyskon med identiskt namn** på 1 649 och 1 679 kr,
och rundan bär redan ett barnfordon i `329beada`. Den ligger orörd som första
kandidat till N29.

## ☠️ FLAGGAT TILL LEONARD: tre affärsbeslut, inget av dem taget här

1. **`c5541fef` — Zwerghühnerstall underskrider Jordbruksverkets redeskrav.**
   Produkten (1 699 kr, saldo 126) passerade saldo, prisgrind, dubblettskärm
   och familjetäthet. Måtten på REDET fäller den:

   | krav (SJVFS 2019:23 / L 111, gemensamt rede) | krav | produkten |
   |---|---:|---:|
   | Redets yta | 0,140 m² | **0,115 m²** (46 × 25 cm) |
   | Redets kortaste sida | 0,35 m | **0,25 m** |
   | Fri höjd i huset | 0,45 m | 0,64 m ✓ |

   Två krav av tre underskrids, och inte marginellt. Jordbruksverket skriver
   dessutom uttryckligen att små besättningar behöver MER plats per fågel, inte
   mindre. Hela stallets golvyta anges av källan till 0,5107 m², vilket vid
   lantbrukets täthet (9 hönor/m² under 2,4 kg) räcker för fyra till fem fåglar
   — men det är redet som är hårt underdimensionerat. **Raden är orörd** —
   varken polerad eller pensionerad.

2. **`c5fc0b7b` — Angry Birds-dekaler på en Aosom-vara.** Flaggad av N27,
   fortfarande orörd. Frågan om Aosom har Rovio-licensen är inte besvarad.

3. **`16b8a47c` — papegojburen underskrider SJVFS 2019:15.** Flaggad av N27,
   fortfarande orörd.

## ☠️ Dubblettskärmen missade den ena halvan av måttformatet — och det syntes i ett tal

Skärmen kördes som `DUBBLETTMATNING.md` kräver, i BÅDA riktningarna och med
täckningsräknare. Den FÖRSTA körningen var ändå blind för halva katalogen.

Aosoms tyska block skriver axelbokstaven på **båda** sidor om talet:

```
Gesamtabmessungen: 150L x 50B x 39H cm      <- bokstav EFTER talet
Gesamtmaße:        L130 x B73 x H90 cm      <- bokstav FÖRE talet
```

Mitt första mönster kunde bara det första. Det syns inte i antalet lästa rader,
inte i felräknaren och inte i svaret — bara i EN siffra:

| | fel mönster | rättat mönster |
|---|---:|---:|
| Publicerade sidor med tolkbar måtttrippel | 2 005 | **2 282** |
| Äkta publicerade dubbletter funna bland kandidaterna | 0 | **5** |

☠️ **Noll krockar såg ut som ett friskintyg.** `b64241c9` — samma hundvagn
N27 redan avvisat — rapporterades som REN av den första körningen. Det är
CLAUDE.md:s egen regel i ny skepnad: *en nolla från en klassificerare mäter
klassificeraren*. Mönstret prövas därför nu åt båda hållen innan det används,
med ett självtest på sex kända måttformer i samma anrop som svepet.

| svep | lästa rader | utan `plainDescription` |
|---|---:|---:|
| Omgång 1 (kandidatlista) | **5 865** | **0** |
| Omgång 2 (rättad trippel, båda riktningar) | **5 865** | **0** |

⚠️ `utanText` räknades i varje svep och var **0**. Utan den räknaren hade ett
svep som tappat `fields` på sida två gett noll krockar och sett ut att ha gjort
sitt jobb.

**Träffarna på de åtta som blev kvar:**

| kandidat | träff | dom |
|---|---|---|
| `0000fa76` 99,5 × 76 × 91 | `2d47b7e7` (utkast, 1 539 kr) | tyskt syskon, INTE publicerat |
| `cb31a581` 45 × 45 × 47,5 | fyra publicerade, alla med generiskt fotavtryck | falsklarm (diskmaskiner, barnfåtölj) |
| `01d8e819` · `a9c2bfd8` · `c804d1b7` · `e5e8754c` · `329beada` · `8ee517cc` | ingen | — |

☠️ **Att `2d47b7e7` är ett UTKAST är hela skälet att publicera `0000fa76`
ändå** — samma resonemang som N26:s färgsyskon och N27:s tyska syskon. Det
finns ingen publicerad sida för modellen, så en ny sida skapar ingen levande
dubblett. Presentationsfrågan (en sida eller två) står kvar som Leonards.

## Sju sakfel hittade och rättade — sex av dem bara i bilderna

Husregeln från runda J1 (*"titta på bilderna FÖRE texten"*) betalade sig igen.

- ☠️ **`8ee517cc`: källan säger `Diamanttufting`, stolen har KANALSÖM.**
  Bilderna visar en snäckformad rygg sydd i lodräta kanaler som viker sig runt
  sidorna. Diamantstoppning finns inte på produkten. Ingen siffergrind kan se
  det — talen stämmer, svenskan är korrekt, och påståendet är helt enkelt
  osant om varan.

- ☠️ **`8ee517cc`: spec-tabellen och den tyska källan är OENSE om måtten, och
  bilden avgör.** Importens rad säger `51B x 53T x 92-112H`, tyska
  `Technische Daten` säger `54B x 56T x 91-111H`. Måttbilden ger 54, 56 och
  91–111 — alltså tyskan. Samma bild ger dessutom två spann som INGEN av
  texterna har: sitthöjd **62–82 cm** och fotstöd **21–41 cm över golvet**.
  Det är de talen kunden faktiskt handlar på.

- ☠️ **`e5e8754c`: färgen är fel i båda källorna.** Tyskan säger
  `Weiß+Dunkelbraun`, importen bara `Weiß`. Bilderna visar en vit stomme med
  lådfronter i FYRA toner uppifrån och ned: vit, ljusgrå, grå och nästan
  svart. Det är produktens hela formspråk, och ingen av källorna beskriver det.

- ☠️ **`a9c2bfd8`: `Färg: Naturholz (naturbelassenes Holz)` på en STÅLPLÅT.**
  Raden är både otolkad tyska och sakligt vilseledande — varan är galvaniserat
  stål. Bilderna visar varför förvirringen uppstod: färgskiktet bär ett tryckt
  trämönster. Sidan säger nu "trämönster på färgbelagd plåt", vilket är både
  sant och det kunden vill veta.

- **`329beada`: importens `Färg: Kindermotorrad, Rosa, Weiß` är fel.** Tyskan
  säger `Rosa+Gelb` och bilderna ger rosa med ljusgult/gräddvitt. Den vita
  färgen finns inte på varan.

- **`01d8e819`: importens `Mått`-rad tappade HÖJDEN.** Den skriver
  `175L x 70B cm`; tyskan ger `175L x 70B x 89H cm`. Spec-raden skriver nu både
  det uppställda och det hopfällda måttet.

- **`cb31a581`: 45 × 45 är BENSPRIDNINGEN, inte sitsen.** Måttbilden ger
  sitsens diameter till 40 cm — ett tal som inte står någonstans i källan, och
  det enda som säger något om hur stor pallen känns att sitta på.

## Facit bevisat mot skarpa Wix — 8 av 8 på första körningen

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret, alltså genom exakt
den transkribering huset har mätt upp som felkällan. Båda kontrollerades därför
mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` per produkt och över bildlistan, jämförd på servern.

**8 av 8 text LIKA, 8 av 8 bildlista LIKA.** Teckenantalen stämde också exakt —
men det är inte beviset: N27:s fällda avskrift hade RÄTT teckenantal och fel
summa. Det är summan som avgör.

## Sex bilder strukna — inbränd text i pixlarna

| id | position | vad bilden säger |
|---|---:|---|
| `01d8e819` | 4 | FALTBARES DESIGN · Mehr Platz sparen |
| `01d8e819` | 5 | Empfohlenes Alter 18-48 Monate · EIN TOLLES GESCHENK FÜR KINDER |
| `a9c2bfd8` | 2 | Hinweis: Nur verzinkte Stahlpaneele |
| `a9c2bfd8` | 5 | *Note: Galzanized Steel Panels Only* — engelsk, och felstavad |
| `c804d1b7` | 4 | GEEIGNET FÜR MITTELGROSSE HAUSTIERE · Länge des Körpers · Gewicht |
| `c804d1b7` | 5 | Leichtgängiger Reißverschluss · Aufbewahrungstaschen · Verstellbare Leinen |

⚠️ **Tre produkter blir därmed trebildsprodukter.** `bygg-media.py` och
`gate-alt.py` räknar antalet ur `bilder.tsv` minus `bilder-bort.tsv` i stället
för att anta fem, så ingen av dem klagade.

⚠️ **`a9c2bfd8` position 5 är ENGELSK, inte tysk**, och stavar dessutom
"Galzanized". Den strukna klassen är inte "tyska" utan **inbränd
marknadsföringstext på ett språk kunden inte handlar på**. Det den säger — att
bara plåtarna ingår, inte skjulet — står nu i brödtexten under en egen rubrik,
vilket är där en sådan upplysning hör hemma.

## Ett husmärke flaggat till Leonard

| id | märke | var |
|---|---|---|
| `c804d1b7` | PawHut | logotyp inbränd i måttbildens nedre vänstra hörn (position 3) |

Bilden är BEHÅLLEN. Husets praxis är publicera-och-flagga för tredjepartsmärken
i leverantörens foton, och måttbilden är den enda som visar vagnens mått. Vill
man bort från märket är vägen ett eget faktakort, inte en struken måttbild.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side) | **8 av 8 text LIKA, 8 av 8 bildlista LIKA** — rent på första körningen |
| `gate.py` (siffergrind mot `kallor.json`, ordlista, flikar, taggar) | 0 fynd i 8 filer, 0 varningar |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter, 2 axelkonflikter i källan (se nedan) |
| `gate-alt.py` | REN, 8 produkter, 34 alt-texter, 0 fynd |
| `gate-seo.py` | **2 fynd → rättat → 0 fynd** i 8 rader (titlar 38–56 av 60, beskrivningar 126–151 av 160) |
| `gate-lager.py` | 0 fynd i 8 produkter, lägsta saldo 27 |
| `gate-sku.py` | 0 fynd i 8 rader (längsta 26 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (50 filer, 391 SKU:er) | 8 av 8 unika, noll krockar, noll prefixöverlapp |
| `gate-superlativ.py` | REN, 8 filer, inga kvitterade superlativ behövdes |
| `gate-lankar.py` | 0 fynd, inga korslänkar i rundan |
| Läcksvep över rundans KUNDVÄNDA filer (artikelnummer, husmärke, fraktland, leverantör, homoglyf, stavning, tysk rest) | **0 fynd i 13 filer** |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `lib/polish/artikelnummer-lackage.test.ts` | **grön** (3 tester) |
| `gate-kopior.test.ts` + `wixnorm-tvilling.test.ts` | gröna (6 tester) |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 3 (kategori, bulk add-items) | 6 anrop, `totalFailures: 0`, per-rad `success: true` på alla 8 |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | 8 av 8 skrivna; `visible` medskickat, variantens `visible` oförändrat |
| Samlad SEPARAT slutläsning av alla fyra stegen | **8 av 8 helt verifierade** |
| Mappningsstämpling + oberoende `las`-verifiering | 8 av 8 |
| `hamta-live.sh` + `livegrind.py` (ISR-medveten live-verifiering) | 8/8 HTTP 200, **8/8 REN, 0 avvikelser** i den publicerade texten (orddiff 0 på alla åtta) |

### `gate-seo.py` fällde på rätt sak

Titeln *"Klätterställning 3-i-1 i trä"* bär talen 3 och 1. Båda står i den
TYSKA källan (`3-in-1`), men grinden jämför mot den SVENSKA filen — och den
sa "tre olika lekar" i ord. En SEO-titel får inte påstå något sidan inte säger,
så rättelsen är att sidan säger det: punktlistan inleds nu med
`3-i-1: klätterbåge, rutschkana och klättervägg i samma sats`.

### ☠️ Axelkonflikten i `e5e8754c` — och varför facit fick rätt

Tyskan skriver byråns mått med DJUPET FÖRST:

```
Gesamtmaße: 38T x 70B x 85H cm
```

Den positionella regeln i `bygg-axelfacit.py` (tal 1 = frontvänd horisontal)
hade gett bredd 38 / djup 70. Generatorn läser bokstäverna när de är entydiga
och gav **bredd 70 / djup 38** — och måttbilden bekräftar det: 70 cm är märkt
längs framkanten, 38 cm längs den bortre. `gate-axel.py` rapporterar de två
raderna som `axelkonflikt i källan` (upplysning, inte fynd) och 0 axelfel.

Rundans brödtexter skriver måtten som rena tripplar (`70 × 38 × 85 cm`) i
stället för med axelord, vilket är sant oavsett vilken konvention läsaren bär
med sig. Priset är att grinden varnar för 21 "saknade egna mått" — en varning
den ska ge, och rätt avvägning.

### `gate-fragment.py` gäller INTE den här rundan

Den rapporterar `[SKRIVER OM SPEC-FLIKEN]` på åtta filer och
`[SIFFRA UTAN KÄLLA]` på fem fotoräknade tal. Båda är korrekt beteende för en
grind som är byggd för TILLÄGGSfragment och som inte läser `foto-tal.txt`.
N28 skriver hela `plainDescription`, precis som N26 och N27.

## Kategorier

| id | kategori |
|---|---|
| 01d8e819 (klätterställning) | Barn & Familj → Leksaker & Spel |
| 329beada (elscooter) | Barn & Familj → Leksaker & Spel |
| a9c2bfd8 (takplåt) | Hem & Inredning → Verktyg & Hemmafix |
| c804d1b7 (hundvagn) | Husdjur → Selar, Koppel & Transport |
| e5e8754c (byrå) | Hem & Inredning → Förvaring & Organisering |
| 0000fa76 (katthus) | Husdjur → Burar, Kläder & Tillbehör |
| cb31a581 (sittpallar) | **Hem & Inredning** (toppnivå, inget löv) |
| 8ee517cc (barstolar) | **Hem & Inredning** (toppnivå, inget löv) |

⚠️ **De två sittmöblerna får toppkategorin, och det är precedens, inte bekvämlighet.**
Kategoriträdet lästes ut innan skrivningen (54 kategorier): under
`Hem & Inredning` finns Förvaring, Kalas, Verktyg, Dekoration, Hushållsapparater,
Badrum och Belysning — inget sittmöbel-löv. N27 gjorde samma bedömning för sina
sittmöbler, och runbooken tillåter det uttryckligen.

⚠️ Slutläsningen visar `antalKat: 2` på alla åtta — den kopplade kategorin plus
Wix egna `All Products`, som Wix lägger till själv.

## Fotoräknade tal, kvitterade

`foto-tal.txt` bär tio rader. Alla är avlästa på produktens egen måttbild eller
räknade på ett foto, och ingen står i den tyska källtexten:

| id | tal | vad |
|---|---:|---|
| `c804d1b7` | 3 | antal hjulpositioner (dubbelhjul fram, två hjul bak) |
| `cb31a581` | 40 | sitsens diameter |
| `e5e8754c` | 59,2 | fritt mått mellan benen |
| `e5e8754c` | 4 | antal nyanser på lådfronterna |
| `329beada` | 40 | sitthöjd över marken |
| `329beada` | 2 | antal backspeglar |
| `8ee517cc` | 62 / 82 | lägsta och högsta sitthöjd |
| `8ee517cc` | 21 / 41 | fotstödets höjd över golvet |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N27: inget `kort-filer.tsv` finns i rundans
katalog, så ingen produkt fick ett eget faktakort.
`bygg-medieskrivning.py` skriver då bildlistan exakt som `bygg-media.py`
lämnade den, och rapporterar "inget kort denna runda" per produkt — ett
uttalat val, inte en tyst utelämning.

## Live-verifiering: 8/8 REN, 0 avvikelser

`hamta-live.sh 90` + `livegrind.py` mot de publicerade, ISR-färska sidorna:
**8/8 HTTP 200 (143–154 kB), 8/8 REN, 0 avvikelser i den PUBLICERADE texten**,
och grinden avslutar med `exit 0`.

Orddiffen mot källfilen är **0 på alla åtta** (402–486 ord per sida). `REN`
betyder att samtliga delkontroller gick igenom, inte bara orddiffen:
homoglyfsvepet, sid-, alt- och SEO-svepen, de tre obligatoriska flikrubrikerna
som `<summary>`-element, brödsmulans andra led (alltså en riktig kategori, inte
`Hem / Butik / produkt`) och `OutOfStock`-kollen. SEO-svepet jämför `<title>`,
`description`, `og:title` och `og:description` EXAKT mot `seo.tsv`, och
alt-svepet läser in i `alt=""` — de två ställen där tyska rester annars
överlever en felfri textpolering.

⚠️ **Åldrarna lästes innan svepet togs på allvar**, och de är enhetliga den
här gången: **99–100 sekunder på alla åtta**, alltså precis den paus som låg
mellan omträffen och den skarpa hämtningen. Ingen sida serverades ur en äldre
rendering — till skillnad från N26:s `66d781f8` (`age: 431`) och N27:s
`e5049d65` (`age: 450`). Skälet är att den varma träffen gav `age=0` på
samtliga åtta: sidorna hade aldrig renderats efter skrivningen, så den första
hämtningen renderade dem färska och omträffen 305 sekunder senare startade en
ny rendering på var och en. **Läs `age` innan du litar på ett svep** — talet
är kvittot på vilken rendering du faktiskt grindade.

Rundans fyra Wix-skrivsteg är dessutom redan oberoende verifierade var för sig
i en separat, senare läsning (tabellen ovan), så live-grinden är det FEMTE
ledet, inte det enda.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i flera separata
led: facit mot skarpa Wix innan grindarna (8/8 LIKA på första körningen),
textinnehållet efter skrivningen mot fil-hash i en senare, separat läsning,
bild/kategori/SKU/pris i samma slutläsning (8/8 helt verifierade, med både
produktens och VARIANTENS `visible: true` och priset oförändrat på 1 699 kr),
mappningsstämpeln via åtta oberoende `las`-körningar, och den publicerade sidan
via `livegrind.py` (8/8 REN, orddiff 0).

Rundan räknas som klar utom faktakorten, som är en medveten uppskjutning av
samma skäl som N15–N27.
