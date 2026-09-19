# Runda G2 — åtta gungstolar, 1 699–3 359 kr

Publicerade, stämplade, kortförsedda och live-verifierade 2026-09-06.

| kort | pris | stomme | vad som skiljer den |
|---|--:|:--:|---|
| `30069c15` | 1 699 | D | beige chenille, 53 cm sits, bokmedar |
| `081f82f1` | 2 099 | D | brun chenille, samma stomme |
| `ceb8d80c` | 2 599 | F | teddytyg, sidofickor, 21 cm tjock sits |
| `93144f85` | 2 819 | G | mörkgrått fleece, fotpall, öronlappsrygg |
| `2c0f466e` | 3 359 | G | beige fleece, samma modell |
| `bbcb8f31` | 2 559 | H | armlös, 72 cm sits, löstagbart överdrag |
| `f642ba45` | 2 839 | I | vitt fleece, fotpall, gungar till 130° |
| `3fb45f4f` | 3 079 | J | linnelook, pall, bär 150 kg |

| kvitto | |
|---|--:|
| Lagrad text mot källfil (normaliserad hash) | **8 / 8 identiska** |
| Bilder i galleriet mot facit | **48 / 48 identiska** |
| Kortet på plats 3, måttskissen sist | **8 / 8** |
| SEO mot `seo.tsv` (titel, metabeskrivning, slug, två taggar) | **8 / 8** |
| Live-grinden (orddiff, alt, SEO, kategori, skötselflik) | **8 / 8 REN, 0 avvikelser** |
| JSON-LD `InStock` / `OutOfStock` | **8 / 0** |
| Prisgrind före rundan · mappningsrader efter | **8 / 8 · 8 / 8 gröna** |
| Pris orört efter varje skrivning | **8 / 8** |

## ☠️ Urvalet gjordes på MÅTT, och det halverade familjen

Familjen har 29 kvarvarande `^Schaukelstuhl`-utkast. Namnen säger ingenting
om vad som är nytt — måtten gör. Grupperat på `Gesamtmaße` + `Sitzgröße`:

| stomme | mått | utkast | redan publicerad som |
|---|---|--:|---|
| **A** | 98 × 71 × 101, sits 49 × 54 | 8 | G1:s fyra + `bc32d396` |
| **B** | 67 × 106 × 92, sits 55 × 48 | 4 | `8bd5cc30` 1 769 **och** `67a84f9e` 1 759 |
| **C** | fotpall, 130 kg, paket 66 × 65 × 34,5 | 5 | `6c50fee9` 1 459 |
| **E** | 65 × 90 × 98, sits 60 × 57 | 2 | `944c3385` 2 449 |
| D, F, G, H, I, J | — | 8 | **inga — det är den här rundan** |

**19 av 29 utkast är färgsyskon till sidor vi redan säljer.** Att polera dem
hade gett katalogen en trettonde färg av samma stol i stället för en stol den
inte har. G2 tar därför en per NY stomme, plus andra färgen på de två stommar
som har ett äkta färgval.

⚠️ Fyra av de publicerade jämförelsesidorna gick INTE att läsa maskinellt:
deras spec-listor använder andra etiketter (`Mått (B × D × H)`, `Stol`,
`Sits`) än de senaste rundornas. Etikettdriften är alltså inte en teoretisk
olägenhet — den gjorde halva dubblettkollen till handarbete.

## ☠️ Revisionsvakten hade fel invariant

Första textskrivningen krävde `revision === "1"` och avbröts: `30069c15` stod
på 3 och `ceb8d80c` på 2. Ingen hade polerat dem — **Aosom-synken skriver
saldo och pris på utkast var sjätte timme** och bumpar revisionen.

Rätt invariant för en FÖRSTA skrivning är TILLSTÅNDET: fortfarande osynlig,
fortfarande tyskt namn. Revisionslikhet gäller mellan mina egna sekventiella
steg, där den bevisar att ingen skrivit emellan — den säger ingenting om hur
gammalt ett utkast är.

## Grindarna fällde fyra saker, och alla fyra var äkta

- **Härledd aritmetik.** *"150 kg är 30 kg mer än de flesta"* — 30 finns
  ingenstans i källan, det är 150 − 120 uträknat. Omformulerat.
- **Tre av syskonens tal** i en jämförelse som inte länkade dit de står.
  Jämförelsen är bra innehåll; fixen var att lägga länkarna, inte att stryka
  talen. Grindens `syskontal` godtar dem så snart läsaren kan gå dit.
- **Kortgrinden dog med `AttributeError`** i stället för att gata: den delade
  byggarens källkod på en kommentar som G2 inte har. En grind som kraschar är
  en grind som inte gatar — delningen hänger nu på `RUBRIK = {`, inte på en
  kommentar.

## Två saker att veta om `wix.request`

1. Den läser **`body`**, inte `data`. En `data`-nyttolast går iväg som TOM
   kropp och API:t svarar *"products has size 0"* — ett fel som pekar på
   innehållet medan felet är fältnamnet.
2. Produktgalleriet går bara att läsa via `products/search` med
   `fields: ["MEDIA_ITEMS_INFO"]`. En GET ger tom `itemsInfo.items` både
   naken och med `params` — och en tom lista ser ut som en produkt utan bilder.

## Verifieringen går via hash, inte genom chatten

Texterna är ~4 kB styck och galleriet 48 rader. I stället för att dra allt
genom sessionen räknas en **FNV-hash över den normaliserade texten** på båda
sidor — lokalt i Python, i sandlådan i JS — och bara hasharna jämförs. Wix
normaliserar två saker som måste bort först: blanksteg mellan blockelement,
och `target="_self"` som läggs på varje `<a href>`.
