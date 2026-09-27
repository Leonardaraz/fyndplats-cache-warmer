# runda-stadning-04 — städrunda, våg 1

20 publicerade produkter. Rundan skriver om texter, SEO-rader, alt-texter och SKU:er
som bar något av det här: tyska rester, rundans egna ord ("rundans", "omgången"),
leverantörs- och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken,
rankningar av vårt eget sortiment ("familjens minsta", "i vårt sortiment"), stavfel
och raden "Artikelnummer: FP-…". Allt annat på sidorna är orört.

## Vad som ändrades

Mekaniskt (`rattelser.json`): ✔ före listpunkter × 14, EU-lager i metabeskrivningen × 6, osynliga mjuka bindestreck × 4, rad Artikelnummer (vår SKU) struken × 4.
För hand (`handrattelser.tsv`, före och efter ordagrant): html × 22.

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

- `runda`: `runda-stadning-04`
- `plan_sha256`: `8dc7bec446c19669e8539fed00f23c375be27a2484f25addb1d94fc5373c6e6c`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
