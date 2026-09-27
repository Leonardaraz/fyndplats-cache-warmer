# runda-stadning-01 — städrunda, våg 1

20 publicerade produkter. Rundan skriver om texter, SEO-rader, alt-texter och SKU:er
som bar något av det här: tyska rester, rundans egna ord ("rundans", "omgången"),
leverantörs- och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken,
rankningar av vårt eget sortiment ("familjens minsta", "i vårt sortiment"), stavfel
och raden "Artikelnummer: FP-…". Allt annat på sidorna är orört.

## Vad som ändrades

Mekaniskt (`rattelser.json`): ✔ före listpunkter × 296, EU-lager i metabeskrivningen × 1, ⚠-tecken × 1.
För hand (`handrattelser.tsv`, före och efter ordagrant): alt-text × 92, struken bild × 9, html × 3.

**9 bilder strukna** (`bilder-bort.tsv`, skälet per rad). En bild behålls eller
stryks hel; ingen redigeras. Bilder med inbränd tysk text, husmärkets logotyp eller en
fel måttskiss stryks, och så gör husets egna kort som nämner leverantören eller bär
husmärke och artikelnummer i fotnoten (se `tools/polish-gates/KORTLACKAN.md`).

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar gate.py, gate-seo.py, gate-lager.py, bygg-axelfacit.py med de äldre avvikelserna uppräknade.
  De fanns på sidorna före rundan (flikrubriker, fraktvikt, fungerande korslänkar,
  saknad måttrad, slutsålda varor) och ligger utanför städningen.
- `valideraPlan` (lib/polish/skrivplan.ts) godkänner planen.
- Varje produkt är synlig, har en variant, oförändrad slug och samma revision i Wix
  som i ögonblicksbilden rundan byggdes från.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-01`
- `plan_sha256`: `addbf6d9051e73f278daced02a3085ce5cd86d3f2b20ebed58f1049cab3c55da`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
