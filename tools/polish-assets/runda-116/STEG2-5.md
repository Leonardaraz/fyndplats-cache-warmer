# Runda 116 Steg 2 + 4 + 5 — hundvagnar

## Steg 2 — laglighetsgrinden

Ingen stoppklass. Genomgången, med skälen utskrivna så nästa runda slipper
göra om den:

| fråga | svar |
|---|---|
| Djurbostad under SJVFS 2019:15 (L80)? | **Nej.** L80 reglerar hur djur HÅLLS — bur, hydda, utrymme. En vagn är transport, inte förvaring. |
| Hundbur under SJVFS 2020:8 (L 102)? | **Nej.** Samma skäl. Sidan får ändå inte antyda att hunden kan lämnas i vagnen. |
| Tillkopplad cykelkärra? | **Nej — och det är en verklig grind.** Transportstyrelsen kräver röd reflex eller baklykta bakåt på en tillkopplad cykelkärra. Ingen av de sju har cykelfäste; leverantörens text nämner varken `Fahrrad` eller `Anhänger`, och måttritningen visar bara skjuthandtag. Regeln gäller alltså inte, och den får inte heller antydas: en vagn utan fäste får aldrig beskrivas som något att koppla efter en cykel. |
| El, batteri, laddare? | **Nej.** Inget att CE-märka, ingen energimärkning. |
| Maxlast | Leverantörens tal, återges ordagrant: **4 kg** (grupp A) och **10 kg** (grupp B). Aldrig avrundat uppåt. |

⚠️ **Grupp B kräver montering** (`Montage erforderlich`), grupp A gör det inte.
Det står bara i B:s text och måste stå på B:s sidor.

## ☠️ Steg 5 — fem påståenden som INTE går att skriva av

### 1. "Leicht (4 kg)" är fel vikt — och farligt förväxlingsbart

Grupp B:s ingress säger två gånger att vagnen är lätt och **väger 4 kg**.
Spec-kolumnen säger **5,9 kg**.

Det räcker för att stryka talet. Men det är värre än ett felaktigt tal, för
`4 kg` är samtidigt **grupp A:s hundvikt**. Skrevs det av hamnar samma siffra
på båda gruppernas sidor med två helt olika betydelser — den ena en gräns för
hundens vikt, den andra en påstådd egenvikt.

☠️ **`4 kg` får därför inte förekomma någonstans i grupp B:s text**, och
`matt.kontroll()` fäller om talet smyger in i B:s tabell.

### 2. Två materialsträngar för samma tyg

| källa | grupp A |
|---|---|
| tyska brödtexten | `Stahl, Polyester` |
| svenska spec-tabellen | `Stahl, Oxford-Gewebe` |

Motsägelsen är skenbar — oxfordtyg ÄR en polyestervävnad — men bara den ena är
användbar för kunden. Vi skriver **oxfordtyg**, samma ord som den publicerade
syskonsidan redan använder i sitt eget faktakort. Runbokens regel gäller:
spec-tabellen är feedens kolumner, den tyska texten är marknadsföring.

### 3. Hopfälld LÄNGD är större än öppen längd — och det är rätt

Grupp A: yttermått **67** cm långt, hopfällt **86** cm. Grupp B: **77** mot
**87** cm. Ser ut som ett skrivfel, är det inte: handtaget fälls ned och
sticker ut förbi korgen. Båda talen skrivs som de står, utan kommentar.

### 4. ⚠️ Färgfältet och renderingen säger olika saker på `1f311250`

Leverantörens färgfält: `Kaffee+Grau`. Renderingen, mätt på ett rent tygparti:
medel-RGB **144, 125, 118** — en dämpad, varm rosaton.

Kunden köper det hon ser, och fotot ÄR leverantörens egen rendering av just den
artikeln. Färgen skrivs därför ur ZOOMEN, inte ur fältet: **dammrosa**.
Runbokens regel om att en färg aldrig får läsas ur kontaktkartan gäller åt
båda hållen — den får inte läsas ur ett textfält heller.

### 5. ☠️ Vår EGEN publicerade sida säger 30 cm där leverantören säger 32

Grupp A är samma chassi som den publicerade `hundvagn-hopfallbar-liten-hund-
sufflett-broms`. Talen på den sidans eget faktakort — 45 × 67 × 96, hopfällt
86 × 45 × 24, liggdel 52 × 32, hjul 6 tum, ram stål, klädsel oxfordtyg — är
grupp A:s tal, på decimalen.

Men den sidan skriver **"kroppslängd upp till ca 30 cm"** medan leverantören
anger **32 cm**. Skillnaden är en avrundning nedåt med säkerhetsmarginal, och
den är i sig försvarbar. Att två av VÅRA EGNA sidor säger olika saker om samma
vara är det inte.

De nya sidorna skriver **32 cm**, som är leverantörens tal. Den publicerade
sidan är flaggad för att rättas i samma veva.

## Steg 4 — bilderna, och två saker som måste bort

### ☠️ Leverantörens ORDMÄRKE ligger på måttritningen

Bild 3 i BÅDA grupperna är måttritningen, och den bär husmärket tre gånger:
ordmärket nere till vänster, tasstryck nere till höger, och en blek
vattenstämpel längs högerkanten.

Leonards regel gäller varan: sitter märket fysiskt på produkten rör vi det
inte. Det gör det inte här — det här är en grafisk pålägg på en marknadsbild.

☠️ **Och katalogen har redan svarat på frågan.** Den publicerade syskonsidan
`hundvagn-regnskydd-mugghallare` bär SAMMA ritning, samma sex tal, i samma
polaroidram — **utan ordmärke och utan tasstryck**. Den publicerade
`hundvagn-hopfallbar-liten-hund-sufflett-broms` har ingen leverantörsritning
alls; alla mått står på våra egna faktakort.

Rundan följer den etablerade linjen: **leverantörens måttritning går inte in i
galleriet.** Måtten bärs av vårt eget kort, som de gör på den bästa sidan i
familjen redan idag.

### ☠️ Position 5 är en REKLAMAFFISCH, inte en produktbild

På flera utkast är sista bilden ingen produktbild alls utan PawHuts egen
annons: en golden retriever, husmärket som logotyp OCH som vattenstämpel, och
tysk annonstext inbränd i pixlarna —
*"Pfoten hoch, draußen entspannen"* respektive
*"Cleverer Komfort, geschaffen für Begleiter"*.

⚠️ **Och den finns i FLERA versioner.** En första mätning jämförde mot EN
affisch och rapporterade **fyra** träffar; `1f311250` bär en annan affisch med
annan text och föll utanför. En grind som nyckar på en FIL hittar bara den
filen.

Mätt om på UTSEENDE i stället — andelen starkt gula pixlar, som är affischens
signatur — över familjens 253 bilder:

| gul yta | vad det är | antal |
|---|---|--:|
| 34–38 % | ☠️ **leverantörens affisch** | **5** |
| 8–15 % | våra egna faktakort och soliga utomhusfoton | 27 |
| under 8 % | produktbilder | 221 |

Gapet mellan 15 % och 34 % är rent, så tröskeln behöver inte ställas in.
**Fem affischer, alla på position 5, alla på UTKAST — noll på publicerade
sidor.** Tre av dem ligger i rundans batch (`3b0aca0a`, `1f311250`,
`0fdf9aba`), två på reflexparet som rundan inte tar.

Grafiken kom förbi `RENA_BILDPOSITIONER`, som finns just för att hålla tysk
text ute. Den ligger på en position importen räknar som ren.

**Alla affischer plockas bort ur galleriet.**

### Det som blir kvar

| plats | bild |
|---|---|
| 1 | hjältebild, vit botten |
| 2 | livsstilsbild |
| 3 | **vårt eget Fyndplats-kort** |
| 4 | detaljbild (handtag, mugghållare, hjul, korg) |

Ingen leverantörsritning, ingen affisch, ingen tysk text.
