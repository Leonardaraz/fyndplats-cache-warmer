# Runda 78, Steg 2, 4 och 5 — rullpallar

## Steg 2, laglighetsgrinden

☠️ **Ingen av de åtta får säljas som kontorsstol för arbete.** En rullpall utan
rygg — och en med 10 cm ryggplatta — uppfyller inte kraven på en arbetsstol för
stillasittande heldagsarbete. Sex av åtta saknar helt ryggstöd eller har bara ett
litet stödplan. Texten säger vad pallen ÄR (rullpall, arbetspall, salongspall)
och var den passar (salong, verkstad, ateljé, som extrasits), aldrig att den är
en kontorsstol. Samma grind som #123.

☠️ **`ergonomisk` är förbjudet ordagrant.** Källan använder ordet på tre av de
åtta. Det är ett hälsopåstående utan underlag; ordet finns inte i någon av
rundans texter, och linten fäller på `ergonomisk\w*`.

☠️ **Två hälsopåståenden om `f18dfc3b` stryks helt:**

> *"fördert eine gesunde Körperhaltung und verbessert Konzentration"*
> *"unterstützt eine natürliche, gerade Ausrichtung der Wirbelsäule"*

Det första är ett kognitivt påstående, det andra ett medicinskt om ryggraden.
Ingetdera är underbyggt. Kvar står den MEKANISKA sanningen, som går att mäta:
sitsen vippar upp till 5° åt alla håll och pallen saknar ryggstöd. Vad det gör
med kroppen får kunden avgöra själv.

⚠️ **Ingen certifiering nämns.** Källan anger varken EN 1335, GS eller BIFMA.
Ingen text påstår något om standarder.

⚠️ **Maxlasten gäller EN person i taget** — skrivs ut på alla åtta, och särskilt
på 2-packet där två pallar × 120 kg annars kan läsas som 240 kg.

⚠️ **Montering krävs** på alla åtta. Källan säger det på sju; `f18dfc3b` säger
"Werkzeugfreie Montage" — verktygsfri, men fortfarande montering.

## Steg 4, bilderna

| id8 | rena bilder | tysk text |
|---|--:|---|
| 5646a8ff | 5/5 | — |
| f18dfc3b | 5/5 | — |
| 239e68b8 | 5/5 | — |
| **15ff0d64** | **3/5** | ☠️ pos 3 *"Größe des Produkts"*, pos 4 *"Malerei · Schminke · Salon Laden · Hausbar · Büro"* |
| d348bf64 | 4/4 | — (produkten har bara fyra bilder) |
| fa078e03 | 5/5 | — |
| 87de04ad | 5/5 | — |
| 28532aab | 5/5 | — |

`15ff0d64` tappar alltså sin måttritning. Måtten står ändå i spec-tabellen —
de är LÄSTA ur den bilden innan den plockades bort.

⚠️ **En bild gick inte att hämta via `/v1/fill/`.** `87de04ad` pos 3 svarade
63 byte med kroppen `bad file: media/b379ce_d1c5…~mv2.jpg`. Samma fil hämtad på
sin RAKA wixstatic-adress gav 297 kB. Skalningsvägen kan alltså fela på en fil
som finns — och 63 byte är en giltig HTTP-200. Grinden är en storlekskontroll
efter nedladdning, inte returkoden.

## Färgen är MÄTT, inte översatt

| id8 | källan säger | rgb | H/S/L | skrivs |
|---|---|---|---|---|
| fa078e03 | `Hellbraun` | 185,161,133 | 32° / 27 % / 62 % | **beige** |
| 87de04ad | `Schwarz` | 57,59,64 | 227° / 5 % / 23 % | svart |
| 5646a8ff | `Grau` | 142,140,137 | 35° / 2 % / 54 % | grå sits (röda fack) |

☠️ **`Hellbraun` är inte ljusbrun.** Vid 27 % mättnad och 62 % ljushet är tonen
en varm **beige**; ljusbrun hade legat kring 40 % ljushet. Fjärde rundan i rad
där leverantörens färgord inte håller mot pixlarna.

⚠️ `f18dfc3b` mättes inte — rutan träffade den vita pelaren, inte sitsen.
Bilden är entydig utan mätning: **vitt stativ och rund vit fot, mörkgrå
nätsits**. Ingen färg påstås i texten utöver det.

## ☠️ Steg 5: `Gesamtabmessungen` är SITSEN, inte pallens fotavtryck

Två av åtta anger sitsens mått i fältet för produktens totalmått. Ritningarna
avslöjar det:

| id8 | källan `Gesamtabmessungen` | ritningens fotkryss | fel |
|---|---|---|--:|
| 239e68b8 | 39 × 34,5 cm | **44 cm** | 5 cm |
| 28532aab | Ø35,5 cm | **48,5 cm** | 13 cm |

En kund som mäter sin plats efter källans tal får plats med en pall som inte
får plats. Spec-tabellen bär därför **fotkryssets** mått som `Mått`, och sitsen
separat.

## ☠️ `d348bf64` anger TRE sitthöjder för samma pall

| var | tal |
|---|---|
| ingressen | 45–57 cm |
| säljpunkten | 43–55 cm |
| spec-raden | 43–55 cm |
| **måttritningen** | **43–55 cm** |

Ritningen och specen är överens; ingressen är ensam. **43–55 cm** skrivs.

⚠️ Och färgsyskonet `fa078e03` säger `135 kg` i texten medan dess EGEN ritning
säger `136 kg` — samma tal som `d348bf64`. Samma modell, samma gaslyft:
**136 kg** på båda.

## Verifierade tal per produkt

| id8 | mått (fotavtryck × höjd) | sits | sitthöjd | maxlast |
|---|---|---|---|--:|
| 5646a8ff | 64,5 × 33 × 35 cm, fast | 44 × 25, dyna 3 cm | 35 cm fast | 135 kg |
| f18dfc3b | Ø38,5 × 56,5–71,5 cm | 41 × 35, dyna 4,5 cm | — | 120 kg |
| 239e68b8 | 44 cm × 52–67,5 cm | 39 × 34,5, skum 9 cm | 52–67,5 cm | 120 kg |
| 15ff0d64 | 43 × 43 × 59–75 cm | 37 × 33, dyna 5 cm | 49–65 cm | 120 kg |
| d348bf64 | Ø35 sits, 72–84 cm | Ø35, rygg 32 × 23 | 43–55 cm | 136 kg |
| fa078e03 | Ø48 fot, 72–84 cm | Ø35, rygg 32 × 23 | 43–55 cm | 136 kg |
| 87de04ad | 50 × 54 × 66–78 cm | ringrygg | 45–57 cm | 136 kg |
| 28532aab | 48,5 cm × 48–63 cm | Ø35,5 | 48–63 cm | 120 kg |

⚠️ **Två utelämnade mått.** `d348bf64`s ritning saknar fotkryssets diameter
(syskonets säger Ø48) — den skrivs inte ut på svarta pallen, eftersom talet
inte är mätt PÅ den. Och `15ff0d64`s ritning angav basen Ø44 medan specen säger
43 × 43; skillnaden är en centimeter mellan två sätt att mäta samma fot, så
bara specens tal står i tabellen och ingen basdiameter påstås.
