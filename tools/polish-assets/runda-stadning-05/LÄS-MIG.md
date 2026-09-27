# runda-stadning-05 — städrunda, våg 1

20 publicerade produkter. Rundan skriver om texter, SEO-rader, alt-texter och SKU:er
som bar något av det här: tyska rester, rundans egna ord ("rundans", "omgången"),
leverantörs- och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken,
rankningar av vårt eget sortiment ("familjens minsta", "i vårt sortiment"), stavfel
och raden "Artikelnummer: FP-…". Allt annat på sidorna är orört.

## Vad som ändrades

Mekaniskt (`rattelser.json`): EU-lager i metabeskrivningen × 4, osynliga mjuka bindestreck × 2, rad Artikelnummer (vår SKU) struken × 2.
För hand (`handrattelser.tsv`, före och efter ordagrant): html × 42, meta × 3, sku × 3.

**3 SKU:er bytta**, eftersom de gamla var tyska eller såg ut som artikelnummer.
Mappningens `variantSkus` följer med i stämplingen.

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

- `runda`: `runda-stadning-05`
- `plan_sha256`: `a4d95b0b9dd99e3855bc7ed944211c32b4d0f16c0b445d6666648bc2d90f8ce9`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
