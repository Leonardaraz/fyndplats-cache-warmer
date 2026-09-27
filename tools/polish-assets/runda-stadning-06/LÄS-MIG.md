# runda-stadning-06 — städrunda, våg 1

20 publicerade produkter. Rundan skriver om texter, SEO-rader, alt-texter och SKU:er
som bar något av det här: tyska rester, rundans egna ord ("rundans", "omgången"),
leverantörs- och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken,
rankningar av vårt eget sortiment ("familjens minsta", "i vårt sortiment"), stavfel
och raden "Artikelnummer: FP-…". Allt annat på sidorna är orört.

## Vad som ändrades

Mekaniskt (`rattelser.json`): EU-lager i metabeskrivningen × 5, rad Artikelnummer (vår SKU) struken × 1.
För hand (`handrattelser.tsv`, före och efter ordagrant): html × 18, meta × 2.

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar gate.py, gate-seo.py, bygg-axelfacit.py med de äldre avvikelserna uppräknade.
  De fanns på sidorna före rundan (flikrubriker, fraktvikt, fungerande korslänkar,
  saknad måttrad, slutsålda varor) och ligger utanför städningen.
- `valideraPlan` (lib/polish/skrivplan.ts) godkänner planen.
- Varje produkt är synlig, har en variant, oförändrad slug och samma revision i Wix
  som i ögonblicksbilden rundan byggdes från.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-06`
- `plan_sha256`: `7067deaaacb24fbe4d7af2fc31ab1a416e119d3b8b0bb6485e668e5025e50736`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
