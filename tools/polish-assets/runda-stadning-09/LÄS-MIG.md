# runda-stadning-09 — städrunda, våg 2

20 publicerade produkter. Våg 2 tar sidorna där texten jämför produkten med
andra varor i vårt sortiment: "den enda i sammet", "fem av våra sex pianopallar",
"högre än de övriga modellerna", "– störst" i en länktext. Grinden ser bara ett
superlativ och ett omfång i samma mening, så de flesta av dem gick förbi den. Ett sådant
påstående gäller andra produkter och blir fel när sortimentet ändras. Korshänvisningar
som inte rankar ("Andra figurer i serien: …" med länkar) står kvar.

Samma klasser som i våg 1 rättas också där de fanns: tyska rester, rundans egna ord,
leverantörs- och garderingsfraser ("enligt variantuppgiften", "Vi skriver inte mer än
så"), osynliga tecken, stavfel och tyska eller tomma alt-texter. Allt annat är orört.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 50, alt-text × 13, sku × 2, meta × 1, struken bild × 1.

**1 bild struken** (`bilder-bort.tsv`, skälet per rad). En bild behålls eller
stryks hel; ingen redigeras. Bilder med inbränd tysk text, husmärkets logotyp eller en
fel måttskiss stryks, och så gör husets egna kort som nämner leverantören eller bär
husmärke och artikelnummer i fotnoten (se `tools/polish-gates/KORTLACKAN.md`).

**2 SKU:er bytta**, eftersom de gamla var tyska eller såg ut som artikelnummer.
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

- `runda`: `runda-stadning-09`
- `plan_sha256`: `912eddb5085fb318ca668a3fdc6c685ebada383c5e573393bac4e2640c944967`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
