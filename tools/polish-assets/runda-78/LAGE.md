# Runda 78 — åtta rullpallar och arbetspallar

Alla fjorton steg klara. Åtta sidor publicerade och live-verifierade.

| id8 | slug | SKU | pris | vinkeln |
|---|---|---|--:|---|
| 5646a8ff | `verkstadspall-med-lador-135-kg` | `FP-verkstadspall-lador-135` | 849 | lådor och verktygsfack, fast 35 cm |
| f18dfc3b | `pendelpall-vippande-sits` | `FP-pendelpall-vippande-sits` | 999 | vippar 5°, ingen rygg, ingen hjul |
| 239e68b8 | `salongspall-utan-rygg-9-cm-skum` | `FP-salongspall-utan-rygg` | 729 | 9 cm formgjutet skum |
| 15ff0d64 | `arbetspall-rygg-och-fotring` | `FP-arbetspall-rygg-fotring` | 799 | rygg OCH fotring |
| d348bf64 | `rullpall-svart-rygg-43-55-cm` | `FP-rullpall-svart-rygg-43` | 799 | rygg på böjd stam, svart |
| fa078e03 | `rullpall-beige-rygg-43-55-cm` | `FP-rullpall-beige-rygg-43` | 819 | samma modell, beige |
| 87de04ad | `rullpall-ringrygg-bred-fot` | `FP-rullpall-ringrygg-bred` | 949 | ringrygg, bred fot 50 × 54 |
| 28532aab | `rullpallar-2-pack-48-63-cm` | `FP-rullpallar-2-pack-48-63` | 1 029 | **2-pack** |

## Kvitton

| steg | kvitto |
|---|---|
| lint | 0 fel i 8 produkter |
| mutationstest | **32/32 fångade**, orörd text 0 fel |
| kort (Steg 9) | 8/8 byte-identiska i Wix, `sourceUrl` pinnad till `e80a453` |
| bilder (Steg 9) | 8/8 **`lika: true`** vid återläsning, kortet på position 3, ritningen sist, 0 tomma alt |
| kategori (Steg 10) | `totalSuccesses: 1` × 8 |
| prisgrind (Steg 11) | 8/8 gröna `las` (1475–1482), `stammer true`, alla priser oförändrade |
| SKU (Steg 8) | 8/8 skrivna, alla distinkta, butikens gamla värde läst FÖRE skrivningen |
| publicering (Steg 12) | 8/8 `visible=true` + `variant.visible=true`, priser lästa före och efter — **oförändrade** |
| stämpling (Steg 13) | 8/8 gröna `stampla` (1483–1490) |
| **live (Steg 14)** | **8/8 `200`, cache `MISS`, text byte-identisk med facit**, eget kort i sidkällan, **7/7 länkmål `200`** |

## ☠️ Två skrivformer där LÄSNINGEN visar fel form

Rundan gick på båda, och båda felade högljutt — ingenting skrevs.

| fält | läsformen (GET) | skrivformen (PATCH) | felet |
|---|---|---|---|
| `slug` | `{ name: "…" }` | **naken sträng** | `400 "Unexpected value for StringValue"` |
| bildpost | `{ image: { id } }` | **`{ id, altText }`** | `400 "id or url must not be empty"` (runda 76) |

Sluggen är ny; bildposten var känd sedan runda 76. Mönstret är detsamma och
värt att skriva ned som en regel snarare än två fall: **en skrivning byggd ur
ett läst svar väljer fel gren så fort de två formerna skiljer sig.** Felet
`Unexpected value for StringValue` nämner varken fältet eller formen.

⚠️ **Och kategorianropets fält heter `item`, inte `itemReference`.** Tredje
formfelet i samma runda, samma klass, lika högljutt: `400 "item must not be
empty"` med fältnamnet utskrivet.

## ☠️ Importens SKU-krock mätt en FJÄRDE gång

Steg 8 läser butiken innan den skriver. Vad butiken svarade:

| importens SKU | bars av |
|---|--:|
| **`FP-rollhocker`** | **3** produkter |
| `FP-werkstatthocker-mit` | 1 |
| `FP-pendelhocker-ergonomisch` | 1 |
| `FP-rollhocker-aus-pu-leder` | 1 |
| `FP-rollhocker-arbeitshocker` | 1 |
| `FP-2er-set-rollhocker` | 1 |

Åtta produkter, **sex** distinkta SKU:er. Efter Steg 8 är de åtta distinkta.
Krocken skapas av importen (`lib/import/sku.ts` bygger ur den råa tyska
sluggen), och den syns bara för att Steg 8 läser butiken innan den skriver.
Runda 75 fann fem av sju, runda 76 åtta av åtta, runda 77 sju av sju.

## ☠️ `sku_bas` inverterade betydelsen igen — andra rundan i rad

`239e68b8` är salongspallen **utan** rygg. `utan` är ett fogeord, så
`salongspall-utan-rygg-9-cm-skum` gav `FP-salongspall-rygg-9-cm` — en SKU som
säger raka motsatsen till vad varan är. Fogeordet är behållet med flit:
`FP-salongspall-utan-rygg`.

Runda 77 gjorde samma avvikelse på ritstolen utan armstöd. Två rundor i rad
betyder att det inte är ett undantag längre utan ett MÖNSTER: varje produkt
vars särskiljare är en NEKNING får fel SKU av regeln.

## ☠️ `Gesamtabmessungen` är sitsen, inte fotavtrycket

| id8 | källans "totalmått" | ritningens fotkryss | fel |
|---|---|---|--:|
| 239e68b8 | 39 × 34,5 cm | **44 cm** | 5 cm |
| 28532aab | Ø35,5 cm | **48,5 cm** | 13 cm |

En kund som mäter sin plats efter källans tal får plats med en pall som inte
får plats. Spec-tabellen bär fotkryssets mått, och båda produkterna har en FAQ
som säger vilket tal man ska mäta mot.

## Fyra grindfynd i lint och mutationstest

Mutationstestet hittade **tre riktiga hål i linten**, inte bara i sig självt:

1. Ett tal i en ankartext fick passera om det stod i VÅR spec i stället för
   den länkade sidans. `"rullpallarna i 2-pack med 9 cm skum"` gled igenom
   för att 9 cm står i vår egen tabell.
2. En slug- eller SKU-krock rapporterades bara på den FÖRSTA parten, så den
   andra sidan fick inget fel alls.
3. Ingen grind krävde att `Montering:`, `Ingår:` och `Maxlast:` fanns kvar i
   spec-tabellen.

Och en fjärde, i grindens FACIT: utrustningsgrinden jämförde prosan mot
`spec + eg`. Med säljpunkterna på den tillåtande sidan kunde en punktlista
ensam "bevisa" en fotring som inte står i tabellen — och en mutation som rörde
`eg` gjorde sig själv sann. Facit är nu **enbart specen**.

⚠️ **Och en gräns linten inte kan passera.** En maxlast som är fel ÖVERALLT —
spec, punkter, namn och villkor — är internt konsekvent, och linten mäter just
intern konsekvens. Det fångas bara av Steg 5:s läsning mot måttritningen.
Mutationen är omskriven för att pröva det fall grinden faktiskt finns för.

## Nästa

Rullpallsfamiljen har **åtta utkast kvar**: färgparet `983fe163` + `98c1b3cb`
(32 × 40 × 70–86, vit och svart), `711f7859` (Ø50 × 63–83), `c328a7c0`
(38 × 38 × 57–72), `12ce97db` (48 × 47 × 45–59), `20782c24` (52 × 53 × 49–61,
rosa), och `b9ab45db` — ☠️ den sista är INGEN rullpall utan en snurrstol med
armstöd och rygg, 60 × 60 × 79–91 och 10,7 kg; källan säljer den som
`Arbeitshocker Drehhocker` och namnet ljuger om produkttypen.

☠️ `df3a97c6` poleras INTE — den är en dubblett av den publicerade
`arbetsstol-hjul-51-67-cm-avtagbar-rygg` på alla tre axlar plus maxlasten.
