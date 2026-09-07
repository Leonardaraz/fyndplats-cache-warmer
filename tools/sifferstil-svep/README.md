# Sifferstilssvepet — kommalista av tal med enheten sist

Runbokens sifferstil säger ordagrant: **skriv aldrig en kommalista av tal med
enheten sist.** Skälet är tvetydighet. I `2, 4,5, 7, 9 och 11 kg` går det inte
att se om det första talet är 2 eller 2 kg, och `4,5,` läses lika gärna som två
tal som ett.

Regeln stod utan katalogsvep. Runda 97 hittade fjorton förekomster i sin egen
batch, och den här mätningen svarar på hur det ser ut i det som redan är LIVE.

## Mätningen 2026-09-07

| | |
|---|---:|
| Publicerade produktsidor | **2 244** |
| Bar den förbjudna formen | **53** |
| ☠️ Varav decimalkomma bredvid listkomma | **10** |
| Varav i meta-beskrivningen (det Google visar) | 8 |

De tio **är rättade** och kontrollmätta: `kvarMedDecimalkommaBredvidListkomma: 0`.
De 43 övriga står kvar — se *Vad som INTE är rättat*.

## ☠️ Det blunta mönstret ger 101 träffar, varav nästan hälften är oskyldiga

Runda 97:s lint använder `\d+(?:,\d+)?, \d`. Det räcker inom en batch där man
äger varje mening. Släppt på hela katalogen fyrar det på sådant som inte är en
kommalista alls:

| vad som fälldes | exempel |
|---|---|
| Skala | `1:300, 83,5 cm` |
| Modellbeteckning | `M6, 4 järnbrickor` · `A60, 9 W` · `E27, 170–180 cm` |
| Kapslingsklass | `IP44, 5 m sladd` |
| Bråk | `1/4, 3/8 & 1/2 tum` |
| Packnotation | `4-i-1, 2-pack` |
| Lagrum | `SJVFS 2020:8, 3 kap. 24 §` |

Samma familj som runbokens `Gelb` inuti **re·gelb·undet**: ett mönster som
fyrar inuti något annat. Svepet ankrar därför på listans FORM — tal, komma,
tal, `och`/`eller`, tal, ENHET — och tappar då 101 → 53 utan att tappa ett enda
äkta fall.

## ☠️ Sidorna motsäger SIG SJÄLVA — och det avslöjade en falsk grind

Sex av de tio bar redan snedstrecksformen i spec-tabellen och kommaformen i
brödtexten, om **samma tal**:

```
Fri höjd per fack:  15 / 11,5 / 11,5 / 11,6 / 21,4 cm     ← spec-raden
…är det fria måttet 15, 11,5, 11,5, 11,6 och 21,4 cm      ← brödtexten
```

Första skrivförsöket vaktades av en round-trip: byt fram, byt tillbaka, kräv
identitet. Den föll på just de sex — bakåtbytet rörde även spec-radens
snedstreck. Grinden gjorde alltså rätt (den vägrade skriva något den inte
kunde verifiera) men av fel skäl, och hade den varit tystare hade slutsatsen
blivit "bytet är farligt".

**Lärdomen: en grind ska mäta det den påstår sig mäta.** Round-trip mäter
"är bytet reversibelt", inte "rörde bytet något annat". Den sunda grinden är
längdaritmetik plus antal:

```js
html.length === b0.length + a * (n.length - g.length)
antal(html, g) === 0
antal(html, n) === nyaFore + a
```

Inget falskt fall, och den fäller fortfarande på ett byte som råkar träffa fel.

## Vad som INTE är rättat

De **43** övriga bär formen utan decimalkomma bredvid listkomma —
`830, 1660 och 2490 W`, `sängar på 90, 135 och 150 centimeter`. De är
entydiga för en läsare; det är bara husstilen de bryter mot. Att skriva om 43
publicerade sidor för en stilregel är Leonards beslut, inte mitt: listan finns
i `svep.md` och ändringen är mekanisk när den beslutas.

## Så körs det igen

`svep.js` är koden som kördes, för `ExecuteWixAPI`. Den skriver ingenting.
`fields: ["PLAIN_DESCRIPTION"]` på `POST /stores/v3/products/search` ger
beskrivningen i BULK — 56 anrop för hela katalogen i stället för ett GET per
produkt.
