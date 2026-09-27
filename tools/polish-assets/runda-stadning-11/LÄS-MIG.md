# runda-stadning-11 — städrunda, våg 2

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

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 57, alt-text × 12, meta × 3, sku × 1.

**1 SKU bytt**, eftersom den gamla var tysk eller såg ut som ett artikelnummer.
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

- `runda`: `runda-stadning-11`
- `plan_sha256`: `f932095a35c6bf097ff6882b157f14352a134faad7b46c7c972708f96886cb91`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
