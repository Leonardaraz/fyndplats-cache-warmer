# Runda 105 — sköldpaddshus (Aosom)

## Steg 1 — familjen

Svep över hela katalogen via `products/search` (`unika == lästa`, `avhuggen: false`):

| | |
|---|--:|
| Utkast med `Schildkröt*` i namnet | **13** |
| Publicerade sköldpaddshus | **0** |
| Publicerade sidor totalt (lästa i svepet) | 2 398 |
| Utkast totalt (lästa i svepet) | 3 155 |

De nio publicerade träffarna på `sköldpadd|terrari|reptil` är **glasterrarier**
(runda 26/52), en reptilinkubator och en barnleksak — en annan produkttyp, inget
sökordskrock mot `sköldpaddshus`.

**Måttsvep mot hela den publicerade katalogen**: alla sju modellers trippler
matchade mot varje publicerad sidas spec-text. **Noll träffar** på 2 398 sidor —
och kontrollmätningen visar att mönstret läser en trippel på **1 806** av dem, så
nollan är mätt och inte tom.

## De sju modellerna — avgjorda på leverantörens EGNA innermått

| | yttermått | utkast | färger |
|---|---|--:|---|
| A | 91 × 60,5 × 32 | 4 | gråbrun / blå / grå / natur |
| B | 116 × 70,5 × 69,5 | 2 | orange / grå |
| C | 104 × 53 × 82 | 2 | orange / grå |
| D | 120 × 55 × 20/50 | 2 | vit / natur |
| E | 128 × 63 × 96 | 1 | natur |
| F | 120 × 50 × 40 | 1 | grå |
| G | 81 × 48 × 31,5 | 1 | grå |

Alla fyra kluster är **färgsyskon**, inte dubbletter: varje mått, varje innermått
och vikten är identiska inom klustret.

## Steg 2 — L80-grinden

SJVFS 2019:15 bilaga 1:7 tabell 1 kräver BÅDE yta och höjd, och kravet växer med
skallängden. `l80-grind.py` mäter höjden **per delyta** — en delyta som inte själv
når höjdkravet får inte bära ytan.

| | inneryta | godkänd yta | fri höjd | räcker t.o.m. |
|---|--:|--:|--:|--:|
| **F** `1f6de209` | 0,53 | 0,53 | 31 | **20 cm** |
| A ×4 | 0,48 | 0,48 | 28 | 15 cm |
| C ×2 | 0,46 | 0,46 | 33 | 15 cm |
| G `609bec0f` | 0,33 | 0,33 | 28 | 15 cm |
| D ×2 | 0,58 | 0,58 | 20–50 | 15 cm |
| B ×2 | 0,87 | 0,87 | 24 | 10 cm |
| ☠️ **E** `acbb7bad` | 0,89 | **0,26** | **16,5** | 10 cm |

☠️ **E poleras inte.** Bottenplanet är 0,64 m² av 0,89 och har **16,5 cm fri
höjd** — under L80:s absoluta golv på 20 cm. Bara de två husen (0,26 m²) når över.
Det är en smådjursbur såld som sköldpaddshus, 2 059 kr. Måttet är läst ur
leverantörens egen måttritning i zoom, inte ur brödtexten.

☠️ **B ×2 parkeras.** Det glasade bottenplanet har 24 cm fri höjd — en centimeter
under 11–15-facket. 1 949 och 2 199 kr.

⚠️ **Ingen modell i familjen är laglig för en sköldpadda över 20 cm skallängd.**
Det kräver 1,1 m²; störst här är 0,53 m². Vanliga arter (Testudo hermanni,
T. horsfieldii) blir 15–25 cm som vuxna, så det här är ungdjursbostäder — och det
står nu ordagrant på varje sida under egen rubrik.

## Steg 5 — vad leverantörens text påstår som inte stämmer

1. ☠️ **"Gelb" är obehandlad furu.** Uppmätt på hjältebilden: nyans 34°, mättnad
   0,43–0,75, ljushet 0,66–0,79 — naturträ, inte gult. Samma ord används på E.
   Svensk text säger **natur / obehandlad furu**.
2. ☠️ **Djurlistorna är olagliga i Sverige.** Källan säljer A, C och E också för
   *"Hühner, Kaninchen, Meerschweinchen"*. En kanin kräver 0,5–1,0 m² enligt L80;
   ingen modell i familjen når dit. Listan bärs inte vidare, och de två bilder som
   har den inbränd i pixlarna plockas bort.
3. **Trädslaget motsäger sig självt** — brödtexten säger `Fichtenholz` (gran),
   spec-raden `Tannenholz` (ädelgran), i samma produkt. Svensk text: **massivt
   barrträ**.
4. **Leverantörens egna m²-tal stämmer inte med leverantörens egna cm-mått**:
   D:s huvuddel anges 0,23 m² men 37,5 × 51 cm är 0,19; F:s spelyta anges 0,35 m²
   men 116 × 46 cm är 0,53. Sidorna räknar ur cm-måtten, aldrig ur m²-talet.
5. **A och D är BOTTENLÖSA** — det står inte i spec-listan, bara i bilderna.
   På A är det ett säljargument (marken blir golvet); i L80-räkningen är det
   samma yta.

## Steg 9 — bilder med tysk text i pixlarna

| produkt | plats | vad |
|---|--:|---|
| `609bec0f` | 4 | *INNEN- UND AUSSENEINSATZ …* |
| `1f9fe2c2` | 4 | *GEEIGNET FÜR VERSCHIEDENE TIERE …* |
| `1f9fe2c2` | 5 | *MEHR DETAILS · Robustes Netz …* |
| `4b089c02` | 5 | **PawHut**-banderoll + *Natürlicher Komfort …* |

`d4787641` och `1f6de209` bär en **PawHut-skylt fysiskt på varan** — den sitter
kvar (Leonards regel 2026-08-06).

## Batchen

| id8 | modell | pris | lager | slug |
|---|---|--:|---|---|
| `1f6de209` | F | 1 619 | ja | `skoldpaddshus-120-oppet` |
| `609bec0f` | G | 1 099 | ja | `skoldpaddshus-81-cm` |
| `f55d9635` | C orange | 1 459 | ja | `skoldpaddshus-104-orange` |
| `1f9fe2c2` | C grå | 1 629 | **nej** | `skoldpaddshus-104-gra` |
| `a0bb5be8` | A gråbrun | 1 059 | ja | `skoldpaddshus-91-grabrun` |
| `4b089c02` | A blå | 1 059 | ja | `skoldpaddshus-91-bla` |
| `27aa4c23` | A grå | 979 | ja | `skoldpaddshus-91-gra` |
| `d4787641` | A natur | 1 019 | **nej** | `skoldpaddshus-91-natur` |

De två slutsålda poleras men publiceras inte, och ingen publicerad sida
korslänkar till dem — en korslänk till en opublicerad sida är en död intern länk.

-----

## ✅ Utfall — sex sidor live, två färdiga och tillbakahållna

| id8 | slug | pris | läge |
|---|---|--:|---|
| `1f6de209` | `skoldpaddshus-120-oppet` | 1 619 | **LIVE** |
| `609bec0f` | `skoldpaddshus-81-cm` | 1 099 | **LIVE** |
| `f55d9635` | `skoldpaddshus-104-orange` | 1 459 | **LIVE** |
| `a0bb5be8` | `skoldpaddshus-91-grabrun` | 1 059 | **LIVE** |
| `4b089c02` | `skoldpaddshus-91-bla` | 1 059 | **LIVE** |
| `27aa4c23` | `skoldpaddshus-91-gra` | 979 | **LIVE** |
| `1f9fe2c2` | `skoldpaddshus-104-gra` | 1 629 | polerad, slutsåld |
| `d4787641` | `skoldpaddshus-91-natur` | 1 019 | polerad, slutsåld |

Alla åtta: text + slug + seoData + fyra sökord + SKU (Steg 7/8), galleri med eget
kort på plats 3 och måttritningen SIST (Steg 9), `Husdjur` + `Burar, Kläder &
Tillbehör` (Steg 10), mappningsraden stämplad `needsAiPolish:false` (Steg 13).

**Kvitton, alla mätta i EGNA pass efter skrivningen:**

| kontroll | utfall |
|---|---|
| lagrad text mot hash + längd | 8/8 |
| galleri: antal, ordning, alt-text på varje bild | 8/8 |
| kategori (`directCategoryIds`) | 8/8 |
| prisgrind före skrivning (workflow `las`) | 8/8, `stammer true` |
| live-sidan (Steg 14, tvåstegshämtning) | **6/6** |

Live-grinden letar efter tyska ord, husmärken, lagerland, artikelnummer,
`https:/produkt` och leverantörsattribution — och kontrollmäter att hjältebildens
media-id finns i HTML:en, så ett "noll fel" inte kan vara en tom hämtning.

## ☠️ `list-categories-for-items` svarar med `directCategoryIds`

Verifieringen sa **FEL på alla åtta** medan skrivningen svarat `totalSuccesses: 2`
per produkt. Felet låg i läsningen: fältet heter `directCategoryIds`, inte
`categoryIds`, och `(x.categoryIds || [])` gör en tom lista av ett fält som inte
finns. En tom lista ser i grinden exakt ut som en misslyckad skrivning.

Samma familj som `MEDIA_ITEMS_INFO` och `PLAIN_DESCRIPTION`: **ett fältnamn som
inte finns läses som TOMT, inte som fel.** Det som avgjorde var att skriva ut det
RÅA svaret i stället för att felsöka skrivningen. Skrivet till runbooken.

## Kvar i familjen

| | utkast | varför |
|---|--:|---|
| B (116 × 70,5 × 69,5) | 2 | 24 cm fri höjd — Leonards beslut |
| D (120 × 55, bottenlös) | 2 | nästa runda; lutningen ska räknas om innan den blir kundtext |
| E `acbb7bad` | 1 | 16,5 cm fri höjd — under L80:s golv, poleras inte |
