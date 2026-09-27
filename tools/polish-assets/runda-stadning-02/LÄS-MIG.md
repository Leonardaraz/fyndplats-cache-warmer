# runda-stadning-02 — städrunda, våg 1

20 publicerade produkter. Rundan skriver om texter, SEO-rader, alt-texter och SKU:er
som bar något av det här: tyska rester, rundans egna ord ("rundans", "omgången"),
leverantörs- och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken,
rankningar av vårt eget sortiment ("familjens minsta", "i vårt sortiment"), stavfel
och raden "Artikelnummer: FP-…". Allt annat på sidorna är orört.

## Vad som ändrades

Mekaniskt (`rattelser.json`): ✔ före listpunkter × 295.
För hand (`handrattelser.tsv`, före och efter ordagrant): alt-text × 83, struken bild × 12, html × 8, namn × 1, meta × 1.

**12 bilder strukna** (`bilder-bort.tsv`, skälet per rad). En bild behålls eller
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

- `runda`: `runda-stadning-02`
- `plan_sha256`: `3dac3665e05b9614cde6a8dc9f95951e7a43c800567c96a5c1ae3ae8ff332ae8`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
