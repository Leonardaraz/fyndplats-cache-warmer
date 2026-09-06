# ☠️ Aosoms artikelnummer läcker ur VÅRA EGNA produktkort

Uppmätt 2026-09-06. Nio publicerade produktsidor bär Aosoms artikelnummer
eller husmärket Outsunny **inbränt i en bild som vi själva har gjort**.

## Vad som står där

Korten är husets egna: off-white botten, Fyndplats-logotyp nere till vänster,
en spec-tabell och en fotnot. Fotnoten är problemet — på nio av dem citerar
den källan:

| produkt (slug) | bild | vad fotnoten säger |
|---|---:|---|
| `partytalt-3x3-m-stalstomme-pe-tak` | 4 | Uppgifter ur Outsunnys datablad, **ref 84c-433v00wt** |
| `partytalt-6x3-m-sex-vaggar-fyra-fonster` | 4 | Uppgifter ur Outsunnys datablad, **ref 84c-197v01wt** |
| `paviljong-3x3-6-m-dubbeltak-myggnat` | 4 | Uppgifter ur Outsunnys datablad, **ref 84c-710v00** |
| `popup-talt-3-5x3-5-m-dubbeltak-upf50` | 4 | Uppgifter ur Outsunnys datablad, **ref 84c-818v00cg** |
| `popup-talt-3x3-m-fyra-vaggar-justerbar-hojd` | 4 | Uppgifter ur Outsunnys datablad, **ref 84c-799v00c** |
| `hollywoodgunga-3-sits-randig-dyna` | 5 | Uppgifter ur Outsunnys datablad, **ref 84a-118v01** |
| `parasoll-260-cm-vev-aluminium-lutbart` | 4 | Uppgifter ur Outsunnys datablad, **ref 84d-032cf** |
| `parasoll-300-cm-tra-dubbeltak` | 4 | Uppgifter ur Outsunnys datablad, **ref 01-0244** |
| `popup-talt-6x3-m-sex-vaggar-justerbar-hojd` | 4 och 5 | *"Uppgifter ur Outsunnys datablad."* och i brödtexten *"Outsunny anger UPF 30+"* |

## ☠️ Varför ingen grind har sett det

`kodIText` (uppgift #100, som tog 133 → 0) läser TEXT. Live-grindens sidsvep
strippar taggar och läser text. Alt-svepet läser `alt`-attribut. **Alla tre
är blinda för en sträng som ligger i pixlar.**

Det är samma klass av lucka som uppgift #124 (tysk leveransklausul) och
#101 (kod saxen inte når), men ett steg värre: läckan finns i en bild som
huset själv har tillverkat, och den tillverkades som BOTEMEDEL mot
leverantörens tyska grafiker. Den som byggde kortet angav sin källa, vilket
är gott hantverk överallt utom just här.

## ⚠️ Skadan är mindre än en textläcka — men den är inte noll

Runbokens beskrivning av varför numret är farligt förutsätter att det är
SÖKBAR TEXT: *"dealproffsen.se publicerar samma sträng som `sku` och `mpn` i
sin JSON-LD — en googling ställer vår sida bredvid deras."* Den kopplingen
kräver att Google kan läsa strängen på vår sida. I en JPEG kan den inte det.

Kvar står en människa som läser bilden. Det är en verklig men långsammare
väg, och den räcker för att det ska lagas — inte för att sidorna ska rivas
ner i natt.

## Så här mättes det

Inget OCR fanns i miljön, så svepet är visuellt. Kortdetektorn är
Fyndplats-logotypens orange i bildens nedre vänstra fjärdedel (mättad orange,
R > 185, 55 < G < 150, B < 95, R − B > 110) — den skiljer kort från foton
tillförlitligt, med enstaka falska träffar på höstlöv och orange tyg.

| svep | produkter | kort granskade | läckor |
|---|---:|---:|---:|
| Jämnt spritt urval ur hela katalogen | 48 | ~20 | 1 |
| Andra jämnt spridda urvalet | 110 | 56 | 1 |
| **Riktat: tält, paviljong, parasoll** | **24** | **41** | **9** |

De två breda urvalen ger ~1,3 % av alla publicerade sidor. Det riktade svepet
visar varför: läckorna är inte utspridda, de sitter i **en produktfamilj**.
Nio av tjugofyra tält-, paviljong- och parasollsidor bär en — **38 %**.

☠️ **Räkna alltså inte med 1,3 % över katalogen.** Rätt fråga är vilka andra
familjer som fick kort ur samma omgång. Alla nio citerar Outsunny, och sju av
åtta artikelnummer börjar på `84`.

## Vad som INTE är fixat

Ingenting är ändrat. Korten är i övrigt bra — svensk text, riktiga mått, egen
grafik — så rätt åtgärd är att göra om fotnoten, inte att radera bilden. Det
kräver kortgeneratorn, som inte finns i det här repot. Listan ovan är
kvitteringen: den som har generatorn kan köra om just de nio.

**Och grinden bör byggas.** En kortgranskning som körs på nya kort innan de
publiceras skulle ha fångat alla nio vid tillverkningen. Utan OCR i miljön
är den enklaste formen att förbjuda mönstret i kortgeneratorns
indata — fotnoten ska aldrig få innehålla leverantörens namn eller ett
artikelnummer.

## Bonus: två formuleringar som bryter mot husregeln

Samma svep hittade två kort som skriver *leverantören* till kunden:

- `Mått enligt leverantörens måttritning`
- `Uppgifter från leverantören`

Mot kunden är **vi** leverantören. Jämför de kort som gör rätt:
*"Mått från tillverkarens ritning"*, *"uppgifter från tillverkaren"*.
