# Runda 75 — kontorsstolar (Bürostuhl), tre modeller i sju kulörer

Alla fjorton steg klara. Sju sidor publicerade och live-verifierade.

| id8 | slug | SKU | pris | färg: källan → skrivs |
|---|---|---|--:|---|
| 75f6c433 | `kontorsstol-benvit-boucle` | `FP-kontorsstol-benvit` | 2 379 | Hellgrau → **benvit** |
| 7ab2f8aa | `kontorsstol-ljusgra-boucle` | `FP-kontorsstol-ljusgra` | 2 029 | Dunkelgrau → **ljusgrå** |
| 60c803f0 | `kontorsstol-ljusbrun-boucle` | `FP-kontorsstol-ljusbrun` | 1 999 | Braun → **ljusbrun** |
| cc81673d | `kontorsstol-graddvit-fotstod` | `FP-kontorsstol-graddvit` | 2 239 | Cremeweiß → gräddvit |
| 0945e4dd | `kontorsstol-brun-fotstod` | `FP-kontorsstol-brun-fotstod` | 2 449 | Braun → brun |
| 348ee535 | `snurrstol-gra-fast-fot` | `FP-snurrstol-gra-fast-fot` | 2 099 | Grau → grå |
| 4d83eca6 | `snurrstol-benvit-fast-fot` | `FP-snurrstol-benvit-fast` | 2 099 | Cremeweiß → **benvit** |

Tre modeller: **A** bouclé med nackstöd (3 st) · **B** snöflanell med utdragbart
fotstöd (2 st) · **C** väv på fast fyrstjärnig fot, **utan hjul** (2 st).

## Kvitton

| steg | kvitto |
|---|---|
| lint | 0 fel i 7 produkter |
| mutationstest | **51/51 fångade**, orörd text 0 fel |
| kort (Steg 9) | 7/7 byte-identiska i Wix, `sourceUrl` mot `runda-75/kort/` |
| bilder (Steg 9) | 7/7 antal + alt-texthash STÄMMER, kortet på position 3, 0 tomma alt |
| kategori (Steg 10) | `totalSuccesses: 1` × 7 |
| prisgrind (Steg 11) | 7/7 gröna `las` (1422–1428), `stammer true`, alla priser oförändrade |
| SKU (Steg 8) | 7/7 skrivna, alla distinkta, återlästa i eget anrop |
| publicering (Steg 12) | 7/7 `visible=true` + `variant.visible=true`, priser och bilder orörda |
| stämpling (Steg 13) | 7/7 gröna `stampla` (1429–1435) + oberoende `las` på en per modellgrupp (1436–1438) |
| **live (Steg 14)** | **7/7 `200`, text byte-identisk med facit**, eget kort i sidkällan |

## ☠️ Steg 8 var inte gjort när Steg 12 stod på tur — och butiken sa det

Publiceringens föranrop läste variantens SKU och fick **importens tyska**, inte
rundans svenska. Steg 8 (re-synka SKU till den nya sluggen) hade helt enkelt
inte körts; ordningen i den här rundan blev publicering → SKU, inte tvärtom.

Det syntes bara för att föranropet läser tillbaka i stället för att lita på
planen. Hade jag stämplat mappningen ur `skrivning.json` — mina PLANERADE
SKU:er — hade mappningen burit sju namn butiken inte hade, exakt den lögn som
lät prissynken skriva till ingenting i en månad. **Läs butiken, stämpla det
butiken svarar.**

Fem av sju bar dessutom en KROCKANDE import-SKU:

| import-SKU | bars av |
|---|--:|
| `FP-burostuhl-mit` | 3 produkter |
| `FP-burostuhl-mit-stoffbezug` | 2 produkter |
| `FP-burostuhl` | 1 |
| `FP-ergonomischer-burostuhl` | 1 |

Det är #272 en gång till: krocken skapas av IMPORTEN. Efter Steg 8 är alla sju
distinkta — färgordet ligger tidigt nog i sluggen för att rymmas inom
`sku_bas`-kapningen på 24 tecken.

## ☠️ Två färger som källan namnger fel

`farg.py` mäter mitt på stolen i stället för att tro på leverantörens ord.
Tvåstegsskalan (S under 15 % → neutral, läs L; annars kromatisk, läs H):

| utkast | källan | mätt | skrivs |
|---|---|---|---|
| 7ab2f8aa | **Dunkelgrau** | L 58 %, S 3 % | **ljusgrå** — två steg fel |
| 75f6c433 | **Hellgrau** | L 80 %, S 14 %, H 43° | **benvit** — inte grå alls |

Den andra är den intressanta: S 14 % ligger precis under gränsen, så stolen
läses på ljushet — och 80 % är benvitt, inte ljusgrått. Hade den fått heta
"ljusgrå" hade den varit omöjlig att skilja från 7ab2f8aa i samma lista.

## Tre bilder bortplockade — texten ligger i PIXLARNA

Bild 4 på tre av sju bär tysk text inbränd: `BODENSCHONEND`,
`LEICHTE MOBILITÄT`, `EINFACHE MOBILITÄT`. De tre sidorna har därför fem
bilder i stället för sex. Hellre en bild färre än en tysk mening på en svensk
sida. Måttritningarna bär bara `cm` och en viktikon (`120 KG`) — siffror och
enheter är internationella och stannar.

## Fyra grindar som är nya för den här familjen

1. **`HALSA_RE`** — en kontorsstol får inte lova något om blodcirkulation,
   ryggsmärta eller "rätt hållning". Det är medicinska påståenden om en möbel.
2. **`ARBETSSTOL_RE`** — och den får inte heller säljas som *arbetsstol*:
   ingen av de sju är provad mot EN 1335, och ordet i sig antyder att den är
   godkänd för heltidsarbete. Samma gräns som Steg 2-grinden i runda 22.
3. **`FORBJUDNA_MATT`** — källan anger ryggstödets bredd som **65 cm** på den
   ena modell C och **50 cm** på den andra, samma konstruktion. Båda talen är
   spärrade på båda sidorna, och måttet är utelämnat ur texten. Ett tal vi inte
   vet är sant skrivs inte.
4. **Hjulgrinden pratar FAQ-par.** Första utkastet fällde två korrekta sidor på
   frågan *"Har den hjul?"* — en fråga påstår ingenting. Grinden parar nu ihop
   fråga med svar och godtar en negation som spänner över meningsgränsen
   (`Nej.` → `fast fot`).

## ⚠️ En död sträng som ljög

`media.py`s `RAW` pekade hela rundan på `runda-74/kort/`. Skrivvägen tar
kortets Wix-id ur `kort-ids.json` och rör aldrig adressen, så ingenting gick
sönder — kontrollerat mot Wix: alla sju kort är byte-identiska med rundans
egna filer och bär `sourceUrl` mot `runda-75/`. Rättad ändå. En död sträng är
fortfarande något nästa läsare tror på.

## Kvar efter rundan

- **`501ba88f` uteslöts som dubblett.** Den är samma produkt i samma kulör som
  den publicerade `kontorsstol-fotstod-sammet` (`40988803`, mörkgrå) — bevisat
  på åtta samstämmiga mått, inte på paketmåttet. Paketmåttet är INTE en
  modellsignatur (runda 74:s falska positiva) och ger dessutom en falsk NEGATIV
  mot publicerade sidor, som listar produktmåttet.
- **#295 växer med en sida till.** `kontorsstol-fotstod-sammet` (`40988803`)
  får två nya färgsyskon i den här rundan och listar dem inte själv.
- **Runda 76** har grupp D klar att börja på: `10235819` (Hellgrau) och
  `4fa0ae0a` (Dunkelgrau), 74 × 65 × 120–128 cm, 120 kg. Dubblettgrinden är
  ren på båda.
