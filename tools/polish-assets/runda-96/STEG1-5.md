# Runda 96 — familjens fyra sista reservtak

## ☠️ Steg 1 rättade en fil som ljög

Runda 94:s `familj-kvar.json` listar de tre pergoladukarna (`8ea111a2`,
`9304f8b8`, `bef14fba`) som opolerade utkast. De **publicerades i runda 93**.
En runda som litat på filen hade polerat om tre levande sidor.

**Regeln: läs av Wix (`visible:false`), inte en sparad lista.** Frågan gav fyra
utkast, inte sju.

| id8 | wixProductId | vad det är | färg (mätt) | pris | lager |
|---|---|---|---|--:|---|
| `3f9fda98` | `3f9fda98-bb9e-4331-ae60-d8d6525c71f1` | 3 × 3 m dubbeltak | mörkgrå | 729 | i lager |
| `2bfaf6dd` | `2bfaf6dd-40d5-41b1-a9d5-c799dfffc705` | 3 × 3 m dubbeltak | kaffebrun | 779 | i lager |
| `9a3600f8` | `9a3600f8-54f4-4aa3-95c3-8297ad6cf253` | pergolamarkis, veckad | mörkgrå | 639 | i lager |
| `22dbd372` | `22dbd372-2c17-403d-ae2d-adb35c5ac2a3` | pergolatak 298 × 293 | mörkgrå | 729 | **slut** |

## ☠️ Två av dem är färgsyskon till en sida runda 95 publicerade

`3f9fda98` och `2bfaf6dd` bär tysk brödtext som är **ordagrant densamma** som
`271327e1`:s — samma 86 × 86 cm lilla tak, samma 68 × 68 cm öppning, samma
18 cm kanthöjd, samma 2,5 kg, samma 32 × 7 × 42 cm, samma 180 g/m², åtta
dräneringshål, kardborreband. **Bara `Farbe` skiljer.**

Det är alltså EN duk i TRE färger, och den publicerade sidan säger "finns i en
färg till". Den måste rättas — egen uppgift.

⚠️ `b6ebc5ba` (mörkgrön) är **inte** samma duk trots samma familj: 88 × 88 cm,
2,6 kg, 32 × 43 × 7 cm. Runda 95:s beslut att inte låna mått mellan de två står
alltså kvar, och blir tydligare nu.

✅ **Snedställda kanten 174 cm är bekräftad två gånger** för den här duken:
`3f9fda98`:s ritning skriver "(174 cm)" och `2bfaf6dd`:s "1,74 m". Talet saknades
på `271327e1`:s egen ritning och publicerades därför inte då. Nu bär två
syskonritningar det, och de två nya sidorna får skriva det.

## Steg 2 — "wasserdicht" i produktnamnet är falskt, och det går att BEVISA

`3f9fda98` heter *"…wasserdicht Pavillondach mit…"*. Dess **egen** brödtext säger
"Polyester mit PA-Beschichtung" och "8 Kunststofflöcher für Wasserabfluss" —
aldrig vattentät. Den byte-identiska tvillingen `2bfaf6dd` har inget
vattenpåstående alls i namnet, och `271327e1`, publicerad ur samma text, säger
vattenAVVISANDE.

**Namnet är den enda källan som säger vattentät, mot tre som inte gör det.**
Sidorna säger vattenavvisande, och grinden fäller varje påstående om motsatsen.

## ☠️ Steg 4 — min egen färgmätning var fel, och felet var METODEN

Sonden tar dominerande RGB bland icke-vita pixlar i **bild 1** och förutsätter en
render på vit botten. `2bfaf6dd`:s bild 1 är en **miljöbild**: sonden svarade
RGB 144, 180, 72 (H 80° = GRÖNT). Det var **gräset**.

Mätt om på ritningen, som har vit botten:

| id8 | tyskan | mätt på vit botten | dom |
|---|---|---|---|
| `3f9fda98` | Kohlegrau | 72, 72, 72 · S 0 %, L 28 % | mörkgrå ✓ |
| `2bfaf6dd` | Kaffee | 144, 120, 96 · H 30°, L 47 % | kaffebrun ✓ |
| `9a3600f8` | Dunkelgrau | 72, 72, 96 · H 240°, L 32 % | mörkgrå ✓ |
| `22dbd372` | Dunkelgrau | 96, 96, 96 · S 0 %, L 37 % | mörkgrå ✓ |

**Alla fyra tyska färgetiketter stämmer den här gången.** Det var mätningen som
var fel, inte källan — och det är precis motsatsen till runda 95, där två av fyra
etiketter var falska. Regeln: **mät på en bild med vit botten, och kontrollera
att bilden faktiskt har en.**

Grinden bär numera en egen regel mot just den här fällan (ordet "grön" på en
A-duk fäller med texten "MÄTFÄLLAN: bild 1 är en miljöbild, gräset är inte duken").

## Steg 5 — vad som inte publiceras

☠️ **`9a3600f8`:s artikelnummer.** Brödtexten namnger dem **två gånger**:
"Artikelnummer: 84C-175, 84C-175BK" och "Geeignet für Sku: 84C-175, 84C-175BK".

⚠️ **`9a3600f8`:s bredd.** Brödtexten och spec-tabellen säger "286L × 245B cm",
ritningen säger "231 cm × 286 cm". Längden 286 cm är alla överens om; den andra
siffran är de inte. Sidan säger därför 286 cm och beskriver passformen med
stolpavståndet 2,85 × 2 m, som ritningens 285 × 200 cm bekräftar.

⚠️ **`9a3600f8` får ingen ytvikt.** Källan anger ingen — till skillnad från de
tre andra, som alla säger 180 g/m². Grinden fäller om ett tal smyger in.

## Grindarna

| grind | utfall |
|---|---|
| `lint.py` | **0 brister** på alla fyra |
| `lint.py --sjalvtest` | **32/32** regler faller på SIN EGEN skada |
| `mutationstest.py` | **32/32** mutationer rätt utfall |
| dokumenterad blind fläck | 1 (kastad ordning i paketmått) |

☠️ **Mutationstestet hittade ett verkligt hål:** *"sexton dräneringshål" → "åtta"*
gick rakt igenom. Räkneordet är skrivet som ORD, så talgrinden ser det aldrig,
och ingen regel läste antalet. Två rader lagar det: spec-radens `Dränering`
jämförs ordagrant, och det ANDRA räkneordet får inte finnas någonstans på sidan
— att bara kräva att det rätta ordet finns räckte inte, eftersom spec-raden bär
det redan och en felaktig punktlista då passerade.
