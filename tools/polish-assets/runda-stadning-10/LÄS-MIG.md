# runda-stadning-10 — städrunda, våg 2

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

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 48, alt-text × 5, meta × 2, sku × 1.

**1 SKU bytt**, eftersom den gamla var tysk eller såg ut som ett artikelnummer.
Mappningens `variantSkus` följer med i stämplingen.

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

- `runda`: `runda-stadning-10`
- `plan_sha256`: `ad6d34c57e15e96ed1332f771a6deef547f46a5d29192c661771dc795f43ddbd`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
