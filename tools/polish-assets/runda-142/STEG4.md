# Runda 142 — Steg 4: bildgenomgången

55 bilder, elva produkter, två kontaktark och två zoomark.

⚠️ **En Aosom-rad behöver bara bild 3, 4 och 5 bedömas** — plats 1 och 2 är
mätt rena i 30 av 30 fall. Hela galleriet monterades ändå: kartan är ETT `Read`
i stället för fem, och plats 1–2 avgör vad varan ÄR.

## ☠️ En tysk marknadsgrafik — `56cca82a` bild 04

```
STABILER SOCKEL
Mehr Stabilität für sicheres Boxen
   15kg Wasser
   20kg Sand
```

Inbränt i pixlarna, och den enda tyska bilden i hela rundan. Den **kastas inte,
den byggs om**: talen 15 kg vatten och 20 kg sand är exakt det kunden behöver
veta för att foten ska stå stadigt, och de flyttar till spec-tabellen och till
rundans eget faktakort.

## ☠️ Fyra fynd som INTE gick att se på ett kontaktark

Alla fyra krävde 2× förstoring. Det är runda 89–91:s regel och runda 104:s:
kontaktarket duger för att se VAD en bild är, aldrig för att läsa en siffra
eller avgöra en nyans.

| fynd | vad zoomen visade |
|---|---|
| `136a4671` bollens färg | **vit, röd OCH blå** — specen säger `Rot+Schwarz` på båda språken |
| `95f6280b` text på säcken | `SPO…` och `YOUR SAFETY…` **tryckt på varan** |
| `a8daef42` märke | **`HOMCOM` + hussymbolen tryckt på säcken**, stort och läsbart i måttritningen |
| `93073695` viktsäcken | finns, och bär texten **`15KG SAND`** — en röd ring med bärhandtag runt foten |

☠️ **Bollens färg är det farligaste av de fyra.** Specen säger `Rot+Schwarz` i
den tyska texten OCH `Rot, Schwarz` i den svenska kolumnen — två källor, samma
fel. Bilden är entydig: bollen har ett vitt, ett rött och ett blått fält. Regel
16 gäller: **bilden vinner över texten om en SYNLIG egenskap.** Texten skriver
de tre färgerna, inte de två specen påstår.

🔒 **Märket och texten på varan RÖRS INTE.** Leonards regel är ordagrann: *"om
märket sitter fysiskt på varan så gör vi inget åt det, det är så produkten ser
ut."* `HOMCOM` är tryckt på säcken, `SPO…`/`YOUR SAFETY` likaså, och den gula
varningsdekalen på `f0430bc5`:s stång är en säkerhetsetikett på godset.
Avgörande-testet: skulle det synas om du fotade varan själv efter uppackning?
Ja → rör den inte.

**Men ordet får aldrig följa med till texten.** HOMCOM stryks ur namn, titel,
meta, slug, sökord, SKU och varenda alt-text. Bilden stannar; ordet gör det inte.

## ⚠️ Livsstilsbilden på `56cca82a` visar ett BARN — leverantören säger ungdom

Bild 02 är ett foto på ett barn i sjuårsåldern med vuxna boxhandskar och armarna
i vädret. Leverantörens egen text säger `Geeignet für Jugendliche`.

Bilden marknadsför alltså varan mot en yngre användare än leverantörens egen
rekommendation — och den riktningen är den som kostar.

**Rundans svar är att inte påstå någon ålder alls.** Höjden är 125/131/138/145 cm
och det är den uppgift som avgör om varan passar; ett åldersintervall är
leverantörens gissning om en kropp. Bilden ligger kvar (den visar skala, och den
är den enda kontextbilden), men alt-texten beskriver VARAN — inte barnet. Det är
Steg 9:s regel ordagrant: *beskriv varan, inte stajlingen.*

⚠️ **Lämnat till Leonard**, samma klass som kaninerna i runda 106 (#382): ska ett
barnfoto ligga kvar på en sida vars underlag säger ungdom?

## ✅ Tre källor eniga på `95f6280b`

| källa | säcken | totalt | foten |
|---|---|---|---|
| tyska `Technische Daten` | Ø24 × 103 | Ø38 × 135 | Ø38 × 3 |
| svenska spec-kolumnen | — | Ø38 × 135 | — |
| **måttritningen (bild 03, zoomad)** | **24 / 103 cm** | **135 cm** | **38 cm** |

Tre oberoende källor på samma tal. Det är Steg 3:s regel om tre källor, och den
gav grönt den här gången — vilket också är ett mätvärde.

## Galleriet: inget kastas utom den tyska grafiken

Tio av elva behåller alla fem bilderna. `56cca82a` går till fyra plus rundans
eget kort.

⚠️ **Fyra produkter har tre livsstilsbilder av fem** (`4fe5959f`, `93073695`,
`c8f6b93f`, `a8daef42`) — tunt på produktdetaljer. Det är just där rundans eget
faktakort gör mest nytta: det är den enda bilden som är VÅR.

☠️ **Syskonen får inte dela miljöscen.** `c8f6b93f` (röd) och `a8daef42` (svart)
är samma modell i två färger och leverantören har fotat dem i OLIKA rum — röd i
ett vardagsrum med grå fåtölj, svart i ett gym och ett vitt rum. Ingen scen
delas, kontrollerat bild för bild. Inget behöver fördelas om.
