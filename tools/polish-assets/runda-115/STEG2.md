# Runda 115 Steg 2 — leverantörens påståenden, grindade

Sju sparkfordon i arbetsfordonsform. Åtta fynd, varav ett med direkt
kundkonsekvens och ett som rättar min egen Steg 1-mätning.

## ☠️ 1. Leverantören säljer samma vara som BÅDE sparkbil och TRAMPBIL

Den tyska texten på traktorerna säger i samma stycke:

> *"Sicheres **Rutschauto** im Traktor-Design"* … *"**Ohne Elektromotor**"*
> … *"ein zauberhaftes **Tretauto**"* … *"Lieferumfang: 1 x **Tretauto**"*

Och på frontlastaren `0c05c1a0`: *"Mit diesem **Trettraktor**…"*, *"1 x
Trettraktor"* — under rubriken **Sitzbagger**.

`Rutschauto` = sparkbil, barnet skjuter ifrån med fötterna mot marken.
`Tretauto` = trampbil, barnet trampar pedaler. Det är två olika produkter för
två olika åldrar.

**Bilden avgör, och den är entydig.** Zoom på underredena (`zoom-pedaler.jpg`):
släta golv, ingen vev, **inga pedaler** på någon av dem.

Konsekvensen om vi hade följt texten är dubbel:

1. **Kunden.** En förälder som köper "trampbil" till en ettåring får en vara
   barnet inte kan trampa — och en ettåring når inte pedaler oavsett.
2. **Sökordet.** Butiken har redan TRE publicerade trampbilssidor —
   `trampbil-barn-gokart`, `trampgokart-104-cm-handbroms-vaxelspak`,
   `trampgokart-barn-pedaler-eva-hjul`. Ordet hade kannibaliserat dem.

`trampbil` ligger därför i `UTELAMNAS`, och `PEDALER` är `False` för alla sju —
mätt i bilden, inte läst i texten.

## ☠️ 2. Min EGEN Steg 1-mätning jämförde PAKETMÅTT, inte yttermått

Steg 1:s batchtabell angav `cc6b56f9` som 54 × 38 × 30. Det är kartongen.
Yttermåttet är **85 × 27,5 × 47,5**.

Orsaken är mekanisk: regexen krävde `tal × tal × tal`, och leverantören skriver
yttermåttet som **`85L x 27,5B x 47,5H`** — med bokstäverna mellan talen. Den
raden matchade alltså aldrig. Kvar blev den svenska `Paketmått: 54 × 38 × 30`.

⚠️ **Och extraktionen blev därmed INKONSEKVENT mellan produkter**, inte bara
fel: där leverantören råkar skriva `63 x 28.5 x 38` matchade yttermåttet, där
hen skriver `85L x …` gjorde det inte. Somliga rader bidrog med yttermått,
andra bara med paketmått — utan att någonting såg fel ut.

Slutsatsen i Steg 1 höll ändå, av två skäl som båda är tur snarare än metod:
jämförelsen råkade vara paket-mot-paket där den fällde, och **pixelgrinden var
domaren**. Precis runbokens formulering: måttmatchning är ett SÅLL, inte en dom.

Rätt tal står nu i `matt.py`, och `YTTRE`/`PAKET` är två skilda tabeller så de
inte kan förväxlas igen.

## ☠️ 3. `23ba27a5` motsäger sig själv om åldern

| var | tal |
|---|---|
| Beschreibung | *"Geeignet für Kinder im Alter von **18-36 Monaten**"* |
| Technische Daten | *"Empfohlenes Alter: **12-36 Monate**"* |

En NEDRE åldersgräns är ett säkerhetstal. Vi anger **från 18 månader**, den
försiktiga. Samma riktning som L80-grinden i runda 105 och maxlasterna i
runda 66: när leverantören ger två tal för samma sak väljer vi det som gör
minst skada om det är fel.

## ☠️ 4. Förvaringsfacket beskrivs som NÖDTOALETT

Ordagrant på tre av sju: *"Stauraum unter dem Sitz zum Ablegen von Spielzeug
oder als **Notfall-WC**"*, *"die Wasser, Sand, kleine Spielzeuge oder
**Kindertoiletten** enthalten kann"*.

Facket är verkligt och användbart — måtten står i `FORVARING`. Användningen
skrivs inte ut.

## ☠️ 5. "Lauflernhilfe" är en REGLERAD produktkategori

Tre av sju säljs på gångträning: *"Kombinieren Sie die **Lauflernhilfe** für
Kleinkinder…"*, *"ideal als **Stütze beim Laufenlernen**"*, *"Kinder können…
**laufen lernen**"*.

En gåstol lyder under EN 1273 med egna stabilitets- och bromskrav, och är i
flera länder starkt avrådd. De här är åkleksaker. Vi beskriver vad de gör —
barnet skjuter ifrån med fötterna — utan gåstols- eller utvecklingspåstående.

## ⚠️ 6. Batterier är INTE uniformt, och det är en köpfråga

| produkt | tutan |
|---|---|
| `cc6b56f9`, `fb142c5c` | **2 × AAA krävs, ingår inte** |
| `738ca991`, `0c05c1a0` | kräver **inget** batteri |
| `23ba27a5` | har tuta, musik OCH ljus — och leverantören säger **ingenting** |

☠️ På den sista skriver vi varken "ingår" eller "ingår inte". Ett ljud- och
ljusfordon utan batteriinformation är ett okänt, inte ett nej.

## ⚠️ 7. Varumärket nämns bara där licensen är UTTALAD

`23ba27a5` säger ordagrant *"mit **Caterpillar-Lizenz**"* och *"Caterpillar-
lizenzierter … Traktor"*. Där är namnet en produktegenskap, och huset namnger
redan licensierade fordon (`elscooter-barn-vespa-vit`,
`elbil-barn-lamborghini-aventador-svj-12v`, `kawasaki-teryx-krx-elbil-barn-12v`).

De fyra andra säger bara *"mit echter Baumaschinen-Marke"* — **utan att namnge
den**. Logotypen syns i bilden, men att skriva ut märket där vore ett påhittat
påstående om en licens leverantören inte har uppgett. `LICENS` bär därför bara
`23ba27a5`.

⚠️ Det rättar min egen anteckning i uppgift #419, som sa att märket aldrig får
skrivas ut. Leonards linje står fast om PIXLARNA — sitter märket på varan gör
vi ingenting åt det.

## 8. `cc6b56f9` och `fb142c5c` är två produkter, inte en

Olika kaross (85 × 27,5 × 47,5 mot 78 × 29,5 × 54), men **identisk sits**
(18,5 × 27 × 24,5), identiskt ryggstöd (16 × 7,5), identiskt hjul (Ø13),
identisk maxlast (25 kg) och identisk vikt (3,6 kg). Samma plattform, olika
överdel — grävmaskin med arm respektive hjullastare med skopa fram.

Bildavståndet är 72,22, alltså längst isär av alla par i familjen.
