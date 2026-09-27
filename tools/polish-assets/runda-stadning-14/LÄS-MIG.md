# runda-stadning-14 — städrunda, läckande egna kort

6 publicerade tält-, paviljong- och parasollsidor ur `tools/polish-gates/KORTLACKAN.md`.
Husets egna faktakort (off-white botten, Fyndplats-logotyp) har en fotnot som citerar
källan: husmärket och leverantörens artikelnummer, inbränt i bilden. Ingen textgrind kan
se det. Korten är granskade på kontaktark, ett i taget, och de som läcker stryks hela;
ingen bild redigeras. Kort med en ren fotnot står kvar. Text, SEO och SKU är orörda.

Av KORTLACKANs nio sidor rättades en i våg 1 (`runda-stadning-02`), och två har två
varianter var, så skrivvägen hoppar över dem. De redovisas i PR-texten i stället.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): struken bild × 7.

**7 bilder strukna** (`bilder-bort.tsv`, skälet per rad). En bild behålls eller
stryks hel; ingen redigeras. Bilder med inbränd tysk text, husmärkets logotyp eller en
fel måttskiss stryks, och så gör husets egna kort som nämner leverantören eller bär
husmärke och artikelnummer i fotnoten (se `tools/polish-gates/KORTLACKAN.md`).

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar gate-seo.py, gate-lager.py, bygg-axelfacit.py med de äldre avvikelserna uppräknade.
  De fanns på sidorna före rundan (flikrubriker, fraktvikt, fungerande korslänkar,
  saknad måttrad, slutsålda varor) och ligger utanför städningen.
- `valideraPlan` (lib/polish/skrivplan.ts) godkänner planen.
- Varje produkt är synlig, har en variant, oförändrad slug och samma revision i Wix
  som i ögonblicksbilden rundan byggdes från.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-14`
- `plan_sha256`: `8a0e48cbe0c17eb391acbc6ba09db20efd222163966fb461a604216e958001de`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
