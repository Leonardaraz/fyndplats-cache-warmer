# Runda 141 — Steg 13: publicerad

Sju bänkar live 2026-09-13 kl 15:17. `562e42fc` är pensionerad sedan Steg 1
(bevisad dubblett, ommappad — #549), så rundan är 7 av 8.

| pid | slug | pris | rev före → efter | lager |
|---|---|--:|---|--:|
| `8de3c3ef` | traningsbank-115-cm-benstrackare | 999 | 7 → 8 | 183 |
| `7b818c3b` | traningsbank-med-stallning-98-122-cm | 1 379 | 5 → 6 | 61 |
| `8a0e05f4` | traningsbank-146-cm-tre-lutningar | 1 429 | 5 → 6 | 36 |
| `b4961e6f` | traningsbank-butterfly-svart-hopfallbar | 1 479 | 7 → 8 | 177 |
| `83b2cf8b` | traningsbank-175-cm-med-skivstangsstall | 1 959 | 6 → 7 | 101 |
| `a4bbe667` | traningsbank-180-cm-vit-med-skivstangsstall | 2 099 | 7 → 8 | 51 |
| `18b94738` | traningsbank-i-tra-med-hantelfack | 2 329 | 6 → 7 | 147 |

## Prisgrinden: charm99 har konvergerat på hela batchen

CLAUDE.md:s sekvenseringsvarning gäller Aosom-rader i fönstret mellan att
`charm99` sattes och att synken hunnit skriva om priserna. `polish-mapping.yml`
läge `las` kördes för alla sju först:

```
supplier      aosom      (× 7)
stammer       true       (× 7)
regel         x1.2, avrundning charm99   (× 7)
```

☠️ **Ett grönt jobb är ett kvitto HÄR, och skälet står i workflow-filen.** Läget
`las` gör `exit 1` både på `EJ AVGORBAR` och på `stämmer: false` för en
Aosom-rad. Sju gröna jobb betyder alltså sju gånger `stammer: true`, inte sju
gånger "inget hände". Det tredje fallet — en icke-Aosom-rad — ger `::warning::`
och `exit 0`, alltså grönt utan bevis; det gäller ingen av de här sju, för
loggen visar `supplier: aosom` på var och en. Jag läste filen och läste loggarna,
och det är de två avläsningarna som gör undantaget giltigt.

Bonus ur samma körningar: mappningens `variants[].sku` stämmer redan mot
`texter.SKU` på alla sju. Steg 8:s BÅDA halvor satt (#388), så stämplingen
behövde inget `variant_skus`.

## ☠️ `ExecuteWixAPI` föll till 403 mitt i steget — med EN NY signatur

Runda 93 och 120 mötte `403 PERMISSION_DENIED`. Det här är inte samma svar:

```
status 403
kropp  {"message":"","details":{}}       ← 27 tecken, TOM message
```

Uppmätt på tre olika anrop i samma verktygsanrop — `GET` med `?fields=`, `GET`
utan, och `POST products/search` — alla tre 403 med identisk tom kropp. Ett
omförsök en minut senare gav samma sak, så det är inte övergående.

✅ **`CallWixSiteAPI` fungerade hela tiden**, precis som i runda 93. Hela Steg 13
gick den vägen.

☠️ **Och det kostade rundan sin mekaniska hashgrind.** `CallWixSiteAPI` tar ett
HTTP-anrop per verktygsanrop och kan inte köra kod, så texten kan inte hashas
utan att först handavskrivas — vilket är precis den risk hashen finns för. Vad
som ersatte den, och varför det räcker JUST här:

1. **Steg 13 skriver ingen text.** PATCH-kroppen är tre fält
   (`id`, `revision`, `visible`). Det finns ingen lång sträng att skriva av fel.
2. **Återläsningen är strukturerad, inte fritext.** `visible`, variantens
   `visible`, `sku`, `mainCategoryId`, `ribbon`, `seoTitle`, `seoDescription`
   och sökorden läses som fält ur svaret.
3. Texthashen var grön 7/7 vid Steg 12:s slut, en kvart tidigare.

**Skriv inte "grindat som vanligt" om en runda som gick på reservvägen.** Den
här gick det, och det ska stå vad som mättes i stället.

## ☠️ Variantens `visible` var REDAN `true` — så ingen `variantsInfo`-PATCH

#535 säger att variantens `visible` måste LÄSAS, och det är just läsningen som
avgjorde. Alla sju läste `variantsInfo.variants[0].visible: true` FÖRE
publiceringen. Alltså behövdes ingen `variantsInfo` i kroppen — och det är en
vinst, inte bara en besparing: **varje `variantsInfo`-PATCH raderar variantens
media** (#501), även en som skickar tillbaka mediat ordagrant. Alla sju bär
`variants[0].media` med samma fil-id som `media.main`, och det ligger kvar.

Kaskadregeln (#1126 i runbooken) är mätt för `visible: false`, som slog ner
varianten `true → false`. Åt andra hållet skriver den `true` på något som redan
är `true` — ofarligt, men det är läsningen som bevisar det, inte riktningen.

## Kvittot är en SEPARAT fråga, inte PATCH-svaret

PATCH-svaret är skrivningens eget eko. Återläsningen är runbookens egen fråga,
i ett eget anrop:

```
POST /stores/v3/products/query
{"query": {"filter": {"slug": {"$in": [ …sju sluggar… ]},
                      "visible": {"$eq": true}}}}
→ pagingMetadata.count: 7
```

Sju slugs in, sju produkter ut, ur ett filter som kräver `visible: true`.

## Klart-kriteriet är en GRIND nu, inte en läsning (`klart.py`)

Runbookens checklista före Steg 13 lästes tidigare med ögon. Den offline-halvan
är mekanisk sedan den här rundan: `klart.py` — 7 produkter, 0 fel, 0
självtestbrister, med sex planterade fel som alla fångas.

Den grindar SIDANS FORM, inte rundans påståenden — det är därför den är en egen
fil och inte fler rader i `grind.py`. Sju regler:

| regel | varför den finns |
|---|---|
| `granska_namn` | 80-teckentaket + märkes- och jargonggrindarna |
| flikrubrikerna EFTER den första är exakt de tre | ett block mellan två flikrubriker hamnar i föregående flik — runda 120 |
| tyska rester i **alla** fält | inte bara brödtexten: namn, slug, titel, meta och sökorden |
| sökorden är satta | importen lägger leverantörens tyska rubrik där, och Steg 7 rör inte `settings` |
| inget "Bra att veta"-block | leverantörsfel rättas i löptexten |
| SKU härledd ur sluggen | inte handskriven (#483) |
| `wixVariantId` finns | ett saknat id ger 422 och INGENTING skrivs |

Plus två batchregler: inga delade slugs/SKU/namn/titlar, och varje korslänk
pekar på en slug som finns (#544).

☠️ **Sökordsregeln är den som motiverar filen.** Fältet renderas inte, så ingen
live-grind kan nå det, och ingen textgrind läser det. Ett fält ingen kontroll
tittar på är ett fält som förblir tyskt. Alla sju bär svenska sökord, läst
tillbaka ur Wix efter publiceringen.

## ☠️ `patch/83b2cf8b.json` bar det ÖVERBEVISADE talet i timmar

Filen på disken sa `Ryggdyna: 74 × 26,4 cm` — talet som måttritningen fällde
(#553) — medan Wix bar det rättade `74 × 25 cm`. Ingen motsägelse: `patch.py`
skrevs FÖRE rättelsen och kördes inte om, medan den skarpa skrivningen gick via
den rättade `texter.py`.

Det är ändå en fälla, och av husets farligaste sort: en fil som ser ut att vara
facit men är en ögonblicksbild. Den som öppnat `patch/`-filen för att kontrollera
måttet hade fått fel svar med full auktoritet.

`patch.py` kör `grind.granska` innan den bygger, så en omkörning är alltid säker
— och en omkörning är också det enda som gör katalogen sann. **Kör `patch.py`
innan du läser en `patch/`-fil, aldrig tvärtom.** Efter omkörningen: noll
förekomster av `26,4` i hela `patch/`.

## Steg 11: no-op, och det är mätt

Alla sju är enkelvariantsrader — `variantSummary.variantCount: 1`, `options: []`,
`choices: []` på varianten. Det finns ingen axel att sanera och inget värde att
döpa om. Noterat, inte utfört.

## Kvar

Steg 14:s live-grind körs EFTER kategorierna (#443) och efter att ISR-fönstret
på 300 s passerat — sidan får aldrig hämtas i samma andetag som publiceringen.
