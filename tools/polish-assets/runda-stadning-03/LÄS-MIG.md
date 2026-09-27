# runda-stadning-03 — städrunda, våg 1

20 publicerade produkter. Rundan skriver om texter, SEO-rader, alt-texter och SKU:er
som bar något av det här: tyska rester, rundans egna ord ("rundans", "omgången"),
leverantörs- och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken,
rankningar av vårt eget sortiment ("familjens minsta", "i vårt sortiment"), stavfel
och raden "Artikelnummer: FP-…". Allt annat på sidorna är orört.

## Vad som ändrades

Mekaniskt (`rattelser.json`): ✔ före listpunkter × 23, EU-lager i metabeskrivningen × 9, osynliga mjuka bindestreck × 5, rad Artikelnummer (vår SKU) struken × 5.
För hand (`handrattelser.tsv`, före och efter ordagrant): html × 18, sku × 4, alt-text × 3, struken bild × 2.

**2 bilder strukna** (`bilder-bort.tsv`, skälet per rad). En bild behålls eller
stryks hel; ingen redigeras. Bilder med inbränd tysk text, husmärkets logotyp eller en
fel måttskiss stryks, och så gör husets egna kort som nämner leverantören eller bär
husmärke och artikelnummer i fotnoten (se `tools/polish-gates/KORTLACKAN.md`).

**4 SKU:er bytta**, eftersom de gamla var tyska eller såg ut som artikelnummer.
Mappningens `variantSkus` följer med i stämplingen.

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar gate.py, gate-lager.py, bygg-axelfacit.py med de äldre avvikelserna uppräknade.
  De fanns på sidorna före rundan (flikrubriker, fraktvikt, fungerande korslänkar,
  saknad måttrad, slutsålda varor) och ligger utanför städningen.
- `valideraPlan` (lib/polish/skrivplan.ts) godkänner planen.
- Varje produkt är synlig, har en variant, oförändrad slug och samma revision i Wix
  som i ögonblicksbilden rundan byggdes från.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-03`
- `plan_sha256`: `f7c77747969214a782a74d85a2f52a3b816e1f26aa23bc77db5b50ba041a55ec`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
