# ☠️ Aosoms artikelnummer läcker ur VÅRA EGNA produktkort

Uppmätt 2026-09-06. Nio publicerade produktsidor bär Aosoms artikelnummer
eller husmärket Outsunny **inbränt i en bild som vi själva har gjort**.

☠️ **Tabellen nedan läckte själv numren i tre veckor** (redigerad 2026-09-27).
De stod med gemener, och läcktestet i CI ser bara versaler och bara
`tools/polish-assets/`. Redigera därför på formen, oavsett skiftläge och
oavsett katalog.

## Vad som står där

Korten är husets egna: off-white botten, Fyndplats-logotyp nere till vänster,
en spec-tabell och en fotnot. Fotnoten är problemet — på nio av dem citerar
den källan:

| produkt (slug) | bild | vad fotnoten säger |
|---|---:|---|
| `partytalt-3x3-m-stalstomme-pe-tak` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `partytalt-6x3-m-sex-vaggar-fyra-fonster` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `paviljong-3x3-6-m-dubbeltak-myggnat` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `popup-talt-3-5x3-5-m-dubbeltak-upf50` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `popup-talt-3x3-m-fyra-vaggar-justerbar-hojd` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `hollywoodgunga-3-sits-randig-dyna` | 5 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `parasoll-260-cm-vev-aluminium-lutbart` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
| `parasoll-300-cm-tra-dubbeltak` | 4 | Uppgifter ur Outsunnys datablad, **ref ‹REDIGERAT›** |
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
åtta artikelnummer har samma inledande siffror.

## Strukna 2026-09-27

Korten görs inte om. Leonard frågade 2026-09-27 om de är värda besväret, och bedömningen
blev att de inte är det. Ett läckande kort stryks därför helt, och ingen bild redigeras.
Sju av de nio sidorna är lagade:

| sida | runda | strukna kort (bild) |
|---|---|---|
| `popup-talt-3-5x3-5-m-dubbeltak-upf50` | `runda-stadning-02` | 4 (husmärke och nummer) och 6 (nämner leverantören) |
| de sex tält-, paviljong- och parasollsidorna i tabellen | `runda-stadning-14` | 4 på alla sex, och 6 på `partytalt-3x3-m-stalstomme-pe-tak` |

Bildnumret är platsen i galleriet före städningen, som i tabellen överst. Rundornas
`bilder-bort.tsv` räknar i stället källans positioner, så där står 5 och 7.

⚠️ **Tabellen ovan var inte komplett.** Kontaktarket för `partytalt-3x3-m-stalstomme-pe-tak`
visade ett andra kort (bild 6) med fotnoten *"Outsunny anger ingen vindklass för tältet."*
Det bär husmärket men inget nummer. Granska därför alla kort på sidan, inte bara det som står
i listan. Korten med ren fotnot står kvar.

**Kvar:** `hollywoodgunga-3-sits-randig-dyna` och `popup-talt-6x3-m-sex-vaggar-justerbar-hojd`
har två varianter var, och skrivplanen tar bara produkter med en variant. De väntar på att
skrivvägen klarar varianter; förslaget står i `tools/polish-assets/stadning-2026-09-27/README.md`.

**Grinden finns sedan 2026-09-16.** `gate-kort.py` läser kortets indata (`kort.tsv`) innan
kortet renderas, och `bygg-kort.py` vägrar rendera ett kort som inte klarat den. Nya kort kan
alltså inte få den här fotnoten. Korten ovan är äldre än grinden.

## Bonus: två formuleringar som bryter mot husregeln

Samma svep hittade två kort som skriver *leverantören* till kunden:

- `Mått enligt leverantörens måttritning`
- `Uppgifter från leverantören`

Mot kunden är **vi** leverantören. Jämför de kort som gör rätt:
*"Mått från tillverkarens ritning"*, *"uppgifter från tillverkaren"*.

Strukna 2026-09-27: korten som nämner leverantören på `e478cc02` (bild 4), `58b51373`
(bild 5) och `7db29345` (bild 6). Kortet på `e478cc02` (*"Leverantören anger …"*) stod inte
med här; städrundan hittade det. Uppgifterna står kvar i texten.
