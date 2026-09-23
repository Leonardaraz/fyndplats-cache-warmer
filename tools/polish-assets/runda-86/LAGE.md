# Runda 86 — sju trädgårdsskåp, KLAR. Alla sju publicerade och live-verifierade.

| id8 | slug | pris | mått B × D × H | SKU |
|---|---|--:|---|---|
| `c9a24404` | `tradgardsskap-tra-115-cm-naturtra` | 1 809 | 75 × 56 × 115 | `FP-tradgardsskap-115-natur` |
| `bb112e08` | `tradgardsskap-tra-115-cm-gratt` | 1 839 | 75 × 56 × 115 | `FP-tradgardsskap-115-gra` |
| `1e11480e` | `tradgardsskap-77-cm-fonster-hornhyllor` | 2 499 | 77 × 54,2 × 179 | `FP-tradgardsskap-77-fonster` |
| `d6666869` | `tradgardsskap-191-cm-sadeltak-tva-dorrar` | 2 549 | 79 × 49 × 191,5 | `FP-tradgardsskap-191-sadeltak` |
| `43e312b7` | `tradgardsskap-gratt-182-cm-fallbart-bord` | 2 899 | 78 × 52,5 × 182 | `FP-tradgardsskap-182-bord` |
| `364bc564` | `tradgardsskap-160-cm-lamelldorrar` | 2 999 | 87 × 46,5 × 160 | `FP-tradgardsskap-160-lamell` |
| `8b00022f` | `tradgardsskap-139-cm-brett-dubbeldorr` | 4 569 | 139 × 75 × 160 | `FP-tradgardsskap-139-dubbel` |

Priserna är orörda.

## ✅ Kvitto: stämplade, publicerade, live

GitHub-åtkomsten kom tillbaka och de två kvarvarande stegen kördes.

**Stämplingen** — sju körningar av `polish-mapping.yml`, läge `stampla`, alla
`conclusion: success`, och loggarna bär utfallet per produkt i stället för bara
exitkoden:

```
OK: c9a24404-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: bb112e08-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 1e11480e-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: d6666869-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 43e312b7-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 364bc564-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 8b00022f-… uppdaterad — needsAiPolish, draftStatus, variantSkus
```

⚠️ **Det gröna jobbet är inte kvittot, `ändrat`-listan är det.** Ett grönt
workflow-jobb säger bara att curl fick 2xx; att raden FAKTISKT bär de tre
fälten vet man för att rutten läser tillbaka efter skrivningen och svarar 500
om den inte gör det. Nionde gången samma husregel: ett svar utan fel är inget
kvitto. (Och `ändrat`-raden hade sett likadan ut i tolv timmar när
`jq`-syntaxfelet fällde varenda stämpling EFTER att skrivningen gått igenom —
därför läses just den raden, inte jobbets färg.)

**Publiceringen** — en PATCH per produkt med `visible: true` på BÅDE produkten
och varianten, med facit-grinden inne i anropet. Alla sju `PUBLICERAD`,
`produktSynlig: true`, `variantSynlig: [true]`, priser och SKU:er oförändrade:

| id8 | revision efter | pris | SKU |
|---|--:|--:|---|
| `c9a24404` | 7 | 1 809 | `FP-tradgardsskap-115-natur` |
| `bb112e08` | 6 | 1 839 | `FP-tradgardsskap-115-gra` |
| `1e11480e` | 8 | 2 499 | `FP-tradgardsskap-77-fonster` |
| `d6666869` | 6 | 2 549 | `FP-tradgardsskap-191-sadeltak` |
| `43e312b7` | 7 | 2 899 | `FP-tradgardsskap-182-bord` |
| `364bc564` | 7 | 2 999 | `FP-tradgardsskap-160-lamell` |
| `8b00022f` | 6 | 4 569 | `FP-tradgardsskap-139-dubbel` |

**Steg 14 — live-grinden, `live.py`:** alla sju svarar `200` med
`x-vercel-cache: MISS`, alltså en FÄRSK rendering och inte ett cachat svar
från utkastet (runda 60:s lärdom). Texten stämmer mot facit på **både längd
och hash** på alla sju — 2 988 / 2 810 / 3 392 / 3 200 / 3 291 / 3 165 / 3 119
tecken — så kundens sida är byte för byte den text linten godkände, och varje
lint-regel gäller på live-sidan per konstruktion.

**Korslänkarnas nio mål svarar alla 200**, inklusive de tre som pekar utanför
rundan (`tradgardsforrad-147-cm-sex-hyllor`, `tradgardsskap-tra-179-cm-tva-fack`,
`redskapsbod-gran-0-5-m2-tva-fonster`).

### ✅ Prissynken var aldrig i fara — kontrollerat i koden, inte antaget

Wix-SKU:n skrevs om innan mappningen hann stämplas. Det ser ut som
2026-08-29:s prisskrivningsbugg, men är det inte: `updateV3VariantPrices`
(`lib/wix/v3-products.ts:479`) matchar på **`wixVariantId` FÖRST** och faller
tillbaka på `sku` bara när id saknas — och `setPrice` i `lib/aosom/sync.ts`
skickar med `variant.wixVariantId`. Prissynken adresserar alltså varianten på
id, inte på SKU-strängen. Fönstret mellan skrivningen och stämplingen var
därför ofarligt.

## Klart-kriteriet — grönt på alla sju

Läst tillbaka ur Wix efter alla skrivningar, `brister: []` på var och en:
facit stämmer på **både längd och hash**, alla tre flikrubrikerna finns
ordagrant, ingen tysk text i beskrivningen, ingen kommalista av tal, inget
bygglovspåstående, varje bild har `image.url`, alla alt-texter unika, kortet
på plats 3, SKU skriven — och sedan publiceringen alla sju `visible: true`.

`seoData.settings.keywords` bar leverantörens tyska rubrik på alla sju
(`geräteschuppen mit regalböden wetterbeständig`, `gartenschrank gartenhaus
gerätehaus geräteschuppen` …). Rättat till det svenska fokusordet — fältet
överlever annars hela poleringen, eftersom Steg 7 skriver `seoData.tags` men
aldrig `settings`.

Kategorier: **14 av 14 lyckade** — Trädgård & Utemöbler (förälder) +
Trädgårdsskötsel & Bevattning (löv).

## Rundans fem fynd

Se `STEG1.md` för mätningarna. Kort:

1. ☠️ **Maxlasten spänner en faktor åtta** — 6 / 20 / 40 kg, plus tre olika
   tal på `43e312b7` (5 / 30 / 10). `d6666869` anger inget alls och får
   därför ingen; avsaknaden står som en vanlig fråga, aldrig som rubrik.
2. ☠️ **Förankringen ingår i bara två av sju.** Grinden fäller åt båda håll.
3. ☠️ **Tre importerade färgrader var fel** — och bara bilden avslöjar det.
4. ☠️ **`Vikt` i den maskinsatta fliken är PAKETVIKT.** Syns bara på
   `1e11480e`, som har båda talen (23 mot 28,7 kg). Raden heter nu
   `Vikt med emballage` på alla sju — en mekanisk rättelse som gäller varje
   framtida Aosom-runda.
5. ☠️ **`364bc564` säger två saker om sina hyllor.** Leverantörens egen bild
   säger "zwei eingebaute Regale bieten drei getrennte Ablageflächen", texten
   säger "3 Regalböden", och hyllhöjderna räknas upp som tre fack. Två
   hyllplan plus botten ger tre fack — det är det som går att räkna.

## Två grindhål som mättes upp och stängdes

- **Nekningsfiltret var för grovt.** En punktlista har inga meningsslut, så
  ETT "ingår inte" i en punkt slog ut hela listan ur granskningen: en muterad
  punkt "Stomme i pulverlackerad metall" slapp rakt igenom materialgrinden.
  Blockslut räknas nu som meningsslut.
- **`m²` saknades som enhet, och `/` saknades i kedjemönstret.** En golvyta
  var osynlig för talgrinden, och en spec-rad skriven i husets EGEN sifferstil
  (`42 / 39,5 / 61 cm`) fälldes som ett främmande tal. Båda rättade i lint.py
  OCH i media.py, som hade samma hål.

Lint: **0 fel i 7 produkter.** Mutationstest: **18/18**. Alt-grinden:
**11/11**.

## Kvar ur familjen

60 utkast fanns; sju är polerade. `be2591c7` deferrades med flit (delar
yttermått på millimetern med `364bc564`). Resten är gå-in-bodar i metall och
plast, tältförråd och en handfull tvillingar — nästa runda ur samma familj
har gott om material.
