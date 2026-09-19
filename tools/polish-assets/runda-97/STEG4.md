# Runda 97 — Steg 4: bilderna

Trettio bilder granskade på kontaktark, fyra i förstoring. Bilderna avgjorde
två motsägelser som texten inte kunde lösa, och fällde fyra bilder på tysk
text eller husmärke.

## Färgerna är AVGJORDA på bilden, inte på spec-raden

| id | spec-raden sa | bilden visar | slutsats |
|---|---|---|---|
| `2e2b2366` | `Grön, Braun, Beige` (tre färger!) | mörkbrun/espresso genomgående | **kaffebrun** — spec-raden är fel |
| `1fc55b3d` | `Braun` | brun skiva på **svart** stativ | **svart stativ, brun skiva** |

☠️ `2e2b2366`:s spec-rad listade tre färger på en enproduktssida med EN
variant. En sida kan inte vara grön, brun och beige. Bilden visar en och
samma mörkbruna möbel i alla fem vyerna.

## Tysk text i pixlarna: tre måttritningar

Alla tre bar samma inbrända ruta nedtill — en hundsiluett med
`Schulterhöhe`-pil plus en orange `HINWEIS:`-etikett och två rader tysk text.

| id | kapad till | vad som räddades |
|---|--:|---|
| `868cc038-3` | 71 % | 34 / 55 / 24 / 25,5 cm |
| `7628983b-3` | 73 % | 42 / 60 / 30 cm |
| `75556831-3` | **70,45 %** | 82 / 55,5 / 16 / 35,5 / 61 cm + skålens 7,8 / 17,8 cm |

⚠️ **Den tredje kapningen mättes, den gissades inte — och första försöket
var fel.** 68 % tog bort tyskan men kapade också produktens EGNA
måttetiketter `35,5cm` och `61cm`, som ligger precis ovanför rutan. Panelens
överkant lästes därför maskinellt (första raden där mittfältet är nästan helt
vitt över fyrtio rader i följd): **y = 1417 av 2000 = 0,7085**. Kapningen
lades på 0,7045, alltså strax ovanför.

Regeln: när en kapning ligger nära något som ska BEHÅLLAS, mät kanten —
ögonmåttet räcker till att hitta rutan, inte till att undvika siffran.

## Släppt bild

☠️ **`1fc55b3d-5` är en ren varumärkesbanderoll.** Gul platta, husmärkets
logotyp i mitten, en genomskinlig vattenstämpel över hela ytan och den tyska
raden *"Cleverer Komfort, geschaffen für Begleiter"*. Ingen produkt syns.
Den går inte att beskära — den ÄR reklamen. Sidan får därför fyra bilder i
stället för fem.

## ⚠️ Husmärket sitter FYSISKT på `75556831`

Lådfronten bär en liten logotyp, och den syns även i miljöbilden på den
verkliga möbeln — alltså tryckt på varan, inte pålagd i filen. Leonards
regel gäller: *"om märket sitter fysiskt på varan så gör vi inget åt det"*.
Bilden behålls oförändrad, och märket nämns aldrig i text eller alt-text.

## ☠️ Bilden motsäger texten på `868cc038`

Måttritningens tyska ruta angav **Schulterhöhe 50–60 cm**; brödtexten säger
*"Schulterhöhe von 55 bis 65 cm"*. Två tal från samma leverantör, om samma
produkt, som inte går ihop.

Ingen av dem skrivs. Sidan anger i stället **höjden till skålen (34 cm)**,
som är mätt, entydig och det tal kunden faktiskt behöver för att jämföra med
sin egen hund. Samma hållning som runda 96:s 170 mot 180 g/m²: när
leverantören säger emot sig själv utelämnas talet, det väljs inte.

⚠️ `7628983b` har samma ruta men där stämmer 60–75 cm mot brödtexten. Den
sidan får därför ange spannet.

## Bildplan

| id | bilder | anmärkning |
|---|--:|---|
| `e8102582` | 5 | alla rena |
| `1fc55b3d` | **4** | banderollen släppt |
| `2e2b2366` | 5 | alla rena |
| `868cc038` | 5 | ritningen kapad |
| `7628983b` | 5 | ritningen kapad |
| `75556831` | 5 | ritningen kapad |

Varje sida får dessutom ett eget Fyndplats-kort (Steg 9).
