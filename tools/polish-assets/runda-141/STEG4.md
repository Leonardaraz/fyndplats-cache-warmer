# Runda 141 — Steg 4: bildgranskningen, och vad den gjorde med Steg 2

Granskat: **25 bilder på fem utkast** (kontaktark per produkt, `steg4/ark-*.jpg`)
plus **samtliga 25 övre vänstra hörn i ETT ark** (`steg4/horn-alla.jpg`) samt de
tre utkasten från dubblettgrinden. Positionerna i listan är feedens 1, 2, 3, 8, 9.

Bilden kullkastade eller rättade **sex** slutsatser. Fem av dem stod i mina egna
Steg 2- och Steg 3-anteckningar, och fyra av de fem hade jag resonerat mig fram
till med två källor som stödde varandra.

---

## ☠️ 1. `83b2cf8b` bild 3 bär leverantörens logotyp INBRÄND i pixlarna

Övre vänstra hörnet på måttritningen bär en vit ruta med husmärket och
**`by Aosom`** under. Det är en **påstämplad vattenstämpel**, inte ett märke på
varan — samma klass som runda 64 (#282), och hela skälet till att hörnsvepet
finns.

**Bilden plockas bort.** Priset är att måttritningen försvinner, och det är
därför måtten flyttas in i spec-tabellen i stället — de finns i `matt.py` och
är lästa ur just den bilden innan den ströks:

```
175 × 139 × 127 cm   ryggdyna 74 cm   sits 30 cm   armbågsdyna 49 × 27 cm
```

⚠️ **Husmärket sitter DESSUTOM tryckt på ryggdynan** på `83b2cf8b`, `a4bbe667`
och `7b818c3b`. Det rörs inte — Leonards regel: *"om märket sitter fysiskt på
varan så gör vi inget åt det, det är så produkten ser ut."* Skillnaden mot
fyndet ovan är hela poängen: **en stämpel i bildlagret är vår, en tryckt logotyp
på varan är produktens.**

De 24 övriga hörnen är rena.

---

## ☠️ 2. `18b94738` är PLYWOOD — och två supplier-källor sa massivt trä

| källa | säger |
|---|---|
| punktlistan | **`Massivholz`** |
| Technische Daten | **`Buche`** |
| spec-blocket | `Naturholz` |
| **bilden, zoomad på kanten** | **staplade fanerskikt** |

Zoomen (`steg4/zoom-18b94738.jpg`) visar gavelns rundade hörn och skivkanten
under dynan. Båda bär den stribbiga laminatkanten som bara skiktlimmat trä har.
Ytan är dessutom blek och rakfibrig — björkfaner, inte bok.

☠️ **Det farliga är att källorna var ENIGA.** `Massivholz` och `Buche` pekade åt
samma håll, och två samstämmiga leverantörskällor känns som bevis. Det är de
inte: de kommer ur samma produktblad och kan vara fel tillsammans. #259 igen
(MDF är inte massivt trä), men den här gången utan någon inbördes motsägelse
som kunde ha varnat.

**"Massivt trä" skrivs inte.** Bok skrivs inte heller. Skivan beskrivs som vad
den mätts som.

---

## ✅ 3. `8de3c3ef` — bilden gav marknadsraden RÄTT, tvärtemot min Steg 2-slutsats

Steg 2 skrev att stålramen var en materiallögn: två tekniska källor sa
trä (`Sperrholz/EPE/PVC`, `Holz/PVC`) mot en marknadsrad som sa `Stahlrahmen`.

**Fel premiss.** Stommen ÄR av lackade stålrör; det syns direkt. Den tekniska
listan beskriver **dynan** — plywoodskiva, EPE-skum, PVC-klädsel — vilket är en
fullständig lista för den delen och en ofullständig för produkten.

☠️ **Jag räknade källor i stället för att läsa vad de handlar om.** "Två mot en"
lät avgjort; i själva verket svarade de på olika frågor. Fraktvikten (10 kg)
drog åt samma håll och stärkte fel slutsats.

Två flaggor till föll samtidigt:

- **`Beinstrecker` finns.** Rullparet sitter på bänkens främre ände. Ordet stod
  bara i namnet (#462), och det är fortfarande inte namnet som är källan —
  det är bilden.
- **`Farbe: Grün` är fel.** Av bildens 1 432 mättade pixlar är **noll** gröna:
  91 % blå, 9 % turkos, och varan i övrigt 95,9 % svart/grå. Mätningen ligger i
  `steg4/`-skripten och är repeterbar.

Sammanfattat i ett par rader — och det är rundans lärdom, för de går åt olika håll:

| | leverantören sa | bilden sa |
|---|---|---|
| `8de3c3ef` stomme | stål (marknadsrad) mot trä (teknisk) | **stål** — marknadsraden hade rätt |
| `18b94738` skiva | massivt trä (två eniga källor) | **plywood** — båda hade fel |

**Varken enighet eller majoritet bland leverantörens egna källor är bevis.
Det enda som avgjorde var att titta.**

---

## ☠️ 4. Tre sidor visar redskap som inte ingår

| pid | bilden visar | Lieferumfang |
|---|---|---|
| `83b2cf8b` | skivstång + vikter på bild 2, viktskivor på 8 och 9 | `1 x Hantelbank, 1 x Gebrauchsanleitung` |
| `a4bbe667` | skivstång med vikter på bild 2 | `1 x Hantelbank, 1 x Anleitung` |
| `18b94738` | hantlar och kettlebell i ställetsfacket på bild 2 | `1 x Kurzhantelbank, 2 x Widerstandsband, 1 x Handbuch` |

Namnet på `83b2cf8b` säger uttryckligen *"ohne Gewichte"* — och tre av dess
fem bilder visar vikter. Det är inte en bild som ska bort (det är så bänken
används), men **"vikter och skivstång ingår inte" måste stå i brödtexten, inte
bara i en specrad.** #468: Lieferumfang är kontraktet.

⚠️ `18b94738` heter *"1 Aufbewahrungskorb"* men **ingen korg syns på någon av de
fem bilderna.** Det som finns är ett öppet fack med urtag för hantlar. Skriv
fack, inte korg — namnet är ingen källa.

---

## ☠️ 5. Måttritningen rättade två tal i min egen transkribering

| pid | `matt.py` bar | ritningen säger |
|---|---|---|
| `7b818c3b` | dyna **100** × 26 cm | **110** × 26 cm |
| `83b2cf8b` | `rygg=(74, 26, 4)` | 74 cm lång; **`26,4` var ETT tal** |

Det andra är en ren parse-bugg: `74 × 26,4 cm` lästes som tre tal för att
kommat blev tupelavskiljare. Talet såg ut som ett giltigt mått hela vägen.

☠️ **Och det första går inte att felsöka i efterhand.** Om `100` kom ur tyskan
eller ur min avskrift går inte att avgöra nu — källtexten finns inte kvar
bredvid talet. Båda är bevarade i `matt.py` med ritningen som facit.
**En transkribering som inte sparas bredvid sin källa kan inte revideras, bara
skrivas om.**

---

## ⚠️ 6. `7b818c3b`: "8 Positionen" är RACKETS lägen, och logotypen är spegelvänd

Steg 3 hade redan noterat det första; bilden bekräftar det. Bänkdynan är **plan
och fast** — den fälls ihop men lutar inte. De åtta lägena är ställningens höjd
(98–122 cm). En kund som läser "8 positioner" på en träningsbänk förväntar sig
åtta ryggvinklar och får noll.

Bild 9 visar dessutom en användning texten kan nämna: **dips mellan
ställningens armar**.

Husmärket på dynan är **spegelvänt** i bild 1, 2 och 3 — leverantören har vänt
renderingen. Ingen åtgärd (märket sitter på varan), men det förklarar varför
logotypen ser fel ut och ska inte tolkas som en annan modell.

---

## Färgmätningen, alla fem hjältebilder

| pid | akromatiskt | kulört | nyans | leverantörens `Farbe` | dom |
|---|--:|--:|---|---|---|
| `18b94738` | 33,8 % | 66,2 % | trä (195,168,121) | `Natur` | ✅ |
| `7b818c3b` | 99,7 % | 0,3 % | — | `Schwarz+Grau` | ✅ |
| `83b2cf8b` | 91,0 % | 9,0 % | röd (226,58,33) | `Schwarz+Rot` | ✅ |
| `8a0e05f4` | 91,1 % | 8,9 % | röd (166,68,54) | `Schwarz+Rot` | ✅ |
| `a4bbe667` | 99,8 % | 0,2 % | — (medel 120 = svart+vitt) | `Schwarz+Weiß` | ✅ |
| `8de3c3ef` | 95,9 % | 4,1 % | **blå (38,107,136)** | **`Grün`** | ☠️ **fel** |

Fem av sex stämmer. Att den sjätte är fel går inte att se utan att mäta — och
går inte att missa när man gör det.

## Engelsk text i pixlarna: en förekomst, ingen åtgärd

`8a0e05f4` bild 8 är en närbild på justerratten, där **`TO ADJUST — LOOSEN THEN
PULL`** är gjutet i plasten. Det är en prägling på varan, inte en pålagd text,
och faller därför under samma regel som husmärket. Noteras för att nästa
granskare inte ska leta efter den en gång till.

---

## ☠️ 7. TVÅ produkter hade aldrig fått ett kontaktark — och båda bar ett måttfel

Tillagt i Steg 9, och det är hela poängen: `8de3c3ef` och `b4961e6f` kom in i
rundan via **dubblettgrinden**, inte via familjesvepet. `bilder.json` hade
därför bara fem produkter, och `steg4.py` läser `bilder.json` — så de två
granskades aldrig med ark, och hörnsvepet såg 25 av 35 hörn.

Med alla sju i filen och arken byggda föll **två mått** direkt:

| pid | texten sa | ritningen säger |
|---|---|---|
| `8de3c3ef` höjd | **43 cm** (en enda siffra) | **41,5–105,5 cm** — ett intervall |
| `b4961e6f` bredd | **130 cm**, etiketterad som totalmått | basen är **55 cm**; 130 är armarnas svep |

Det första är rakt fel: bänkens ryggstöd har sju vinklar, så den HAR ingen
fast höjd. Det andra är inte fel men ofullständigt, och saknar just det tal en
kund behöver för att veta om bänken får plats — båda står i texten nu, var för
sig etiketterade (runbokens *"tal som mäter olika saker ser ut som en
motsägelse"*).

**Regeln: en produkt som kommit in i rundan på en annan väg än familjesvepet
har inte gått igenom stegen bara för att rundan har.** Kontrollera listan mot
`texter.SLUG`, inte mot minnet.

## ☠️ 8. Min egen rättelse i punkt 5 var FEL — `26,4` står inte på ritningen

Punkt 5 ovan skriver att `rygg=(74, 26, 4)` var en parse-bugg och att
ritningen säger `74 × 26,4`. Zoomad läsning av samma ritning
(`steg4/zoom-83b2cf8b-sits.jpg`) säger något annat:

```
27 cm  bicepspulpetens djup      49 cm  bicepspulpetens bredd
74 cm  ryggdynans LÄNGD          25 cm  ryggdynans BREDD
30 cm  sitsens BREDD             (sitsens djup är inte utsatt)
```

**`26,4` finns inte på ritningen alls.** Det är leverantörens spec-tal, och
det stod i texten på TVÅ rader — ryggdynan och sitsen — som om båda dynorna
vore 26,4 cm breda.

☠️ **Och mätningen fanns redan.** `matt.py` bar `rygg_bredd_ritning=25` sedan
Steg 4. Talet lästes av ritningen, skrevs in i posten — och texten skrev
26,4 ändå. Grinden kunde inte se det: `26,4` låg i `rygg=(74, 26.4)` och var
därför ett härlett, tillåtet tal.

**Regeln: ett tal som ritningen överbevisat får inte ligga kvar som ett
vanligt fält i `matt.py`.** Det flyttas till en `_transkriberad`-nyckel, som
`_egna_tal` hoppar över — då blir återfallet ett grindfel i stället för en
tyst möjlighet. En plantering i självtestet låser vägen tillbaka.

⚠️ Sitsens DJUP är inte utsatt på ritningen och står därför inte i texten.
Etiketten är `Sitsens bredd`, inte `Sits`, så raden inte läses som ett
fullständigt mått.
