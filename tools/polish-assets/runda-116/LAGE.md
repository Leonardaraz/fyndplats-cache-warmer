# Runda 116 — läge

Sju hundvagnar i två färgfamiljer, publicerade och stämplade. Ett åttonde
utkast hålls tillbaka som bevisad dubblett.

| id | slug | färg | pris |
|---|---|---|---:|
| `40f46441` | `hundvagn-4-kg-rod` | röd | 979 |
| `adc81917` | `hundvagn-4-kg-gra` | grå | 939 |
| `cbb38884` | `hundvagn-4-kg-bla` | blå | 999 |
| `eb02039b` | `hundvagn-med-korg-rod` | röd | 1129 |
| `3b0aca0a` | `hundvagn-med-korg-bla` | blå | 899 |
| `1f311250` | `hundvagn-med-korg-dammrosa` | dammrosa | 899 |
| `0fdf9aba` | `hundvagn-med-korg-ljusgra` | ljusgrå | 999 |

## Vad som skrevs, och vad kvittot var

| steg | skrivning | kvitto |
|---|---|---|
| 7 | namn, slug, SEO-titel, meta, brödtext | **7/7 identiska ORD FÖR ORD** mot den grindade källan (FNV-checksumma över ordsekvensen — Wix skriver om markupen, så bytes går inte att jämföra) |
| 9 | galleri + alt-texter | 7/7: kortet på plats 3, ritning och affisch borta, **noll** tyska alt-texter |
| 10 | kategorier | **14/14** skrivningar, per kategori, noll fel |
| 8 | variant-SKU | 7/7 unika, **priset oförändrat på alla sju** |
| — | publicering | 7/7 `visible: true`, variant `visible: true` |
| 13 | mappningsraden | 7/7 workflow-körningar `success` |
| 14 | live-grind | **7/7 gröna** efter att grinden fällt sig själv två gånger |

Korten laddades upp och **verifierades byte för byte** mot de lokala filerna —
`success: true, PENDING` är inget kvitto.

## Fem fel som grindarna fångade — och två som ögat fångade

### Grindarna

1. ☠️ **Pixelgrinden mätte fel sak.** Hjälte mot hjälte gav 6,18 på ett par
   runbooken redan mätt till 0,10 över HELA bilduppsättningen. Se STEG1.md.
2. ☠️ **`LEVERANS`-mönstret saknade ordgränser** — `ing[åa]r` matchade inuti
   *kopplingar*, så "två kopplingar att fästa i hundens sele" lästes som ett
   leveranslöfte om en SELE på alla sju sidor. Syntes bara för att två rundor
   nu delar modulen. En rättning, två rundor.
3. ☠️ **Live-grindens grannstrykning läckte genom SLUGGEN.** Att stryka
   grannens NAMN räcker inte: `hundvagn-regnskydd-mugghallare` innehåller
   ordet `regnskydd`, som är ett grindat löfte här, så en granne i
   rekommendationsraden fällde en korrekt sida. **En fjärde kanal** utöver de
   tre namnserialiseringarna — och det var live-grindens EGET självtest som
   hittade den, inte en körning mot skarp sida.
4. ☠️ **SKU-kontrollens färgjämförelse var ASCII-blind.** `röd` finns aldrig i
   `FP-hundvagn-4-kg-rod`; utan nedvikning av å/ä/ö hade grinden fällt varenda
   rad och blivit bortkommenterad.
5. ⚠️ **`media`-itemets `id` ligger på ITEMET, inte under `image`.** Ett första
   försök nästlade det och fick `400 id or url must not be empty` på varje
   rad — skrivningen avvisades innan något ändrades.

8. ☠️ **Live-grinden RADERADE det den letade efter.** JSON-LD:s FAQ-poster
   använder `"name"` för FRÅGAN, så sidans egen cykelfråga hamnade i
   grannlistan, ströks ur texten — och rapporterades sedan som SAKNAD på alla
   sju korrekta sidor. Uppgift #384:s klass, fast värre: en strykning som
   raderar bevisföremålet. Signaturen prövas nu på sidan FÖRE
   grannstrykningen, och en `"name"` som slutar på `?` är aldrig en granne.
9. ⚠️ **SKU:n renderas inte av butiken.** Noll `FP-`-strängar i 148 kB HTML på
   en korrekt sida — en live-kontroll av SKU:n är ett garanterat falsklarm,
   inte en grind. Den verifieras mot API:t i Steg 8 i stället.

### Ögat

6. ☠️ **"höjden inuti är 52 × 32 × 48 cm."** En höjd är ETT tal, inte en volym,
   och spec-etiketten "Invändig höjd" satt på hela tremåttssträngen. Ingen
   grind kan se det — det är ett predikat på fel subjekt, samma klass som
   runda 115:s strålkastare som gav LJUD. Rättat till en egen `innerhojd`, och
   `matt.kontroll()` fäller nu om ett höjdfält innehåller `×`.
7. ☠️ **"Den dammrosaa hundvagnen."** `FARG[k] + "a"` är inte svensk böjning;
   `dammrosa` är dessutom oböjligt. Bestämd form är en TABELL nu.

Båda hittades för att texten låg i en **fil** och lästes med ögon före
skrivningen — runbookens fil-regel, sjätte gången den betalar sig.

## Vad som INTE gjordes

- **Priserna är orörda.** Alla sju står kvar på importens tal, kontrollmätt före
  och efter SKU-skrivningen.
- **`ca84c48b` publicerades inte.** Bevisad dubblett av publicerade
  `hundvagn-liten-hund`; se STEG1.md och uppgift #429. Beslutet är Leonards.
- **Leverantörens måttritning är borta ur galleriet** på alla sju. Måtten bärs
  av vårt eget kort, samma linje som familjens bäst polerade sida redan följer.
