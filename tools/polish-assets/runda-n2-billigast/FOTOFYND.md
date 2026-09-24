# Runda N2 — vad fotona visade innan texten skrevs

Kontaktarket byggdes FÖRE brödtexten, enligt husets J1-regel. Fyra av
fynden nedan hade inte gått att se i källtexten, och tre av dem ändrade
vad texten säger.

## ☠️ Brödrosten är inte svart — den har stålfront

`d5d1ff3c`. Källan säger `Farbe: Schwarz` och `Material: Stahl`. Fotona
visar en borstad stålfront med svarta gavlar och en turkos LED-remsa
längs nederkanten. Källan nämner LED-belysningen i punktlistan men inte
färgen på den.

Texten säger därför "i stål med svarta gavlar" och att panelen lyser
blått, inte att rosten är svart. Spec-raden behåller källans `svart`.

Samma klass som N1:s `b99570fd`, där källan sa `Farbe: Grau` om en
gräddvit soffa.

## ☠️ Häckens spec-rad har FEL färg i importen

`c8376256`. Den svenska spec-fliken importen byggde säger
`Färg: Schwarz, Weiß, Gold`. Den tyska `Technische Daten` säger
`Farbe: Hellgrün`, och fotona visar en ljusgrön häck. Den publicerade
systersidan på 300 × 150 cm säger också ljusgrön.

Tre oberoende källor mot en, och den enda som säger emot är den
maskinbyggda spec-raden. Texten säger ljusgrön.

⚠️ Det är inte ett fel i den här produkten utan i importens spec-bygge.
Hur många andra utkast som bär en färg som inte är produktens är omätt.

## ☠️ En tysk banner i pixlarna — bild 3 på hundryggsäcken

`4533ca25` bild 3 är en tysk grafik: rubriken *FÜR KLEINE HUNDE*, ett
rasdiagram med sex hundraser och två villkorsrutor. Måtten står i samma
bild, så produkten förlorar sin enda måttritning när bilden tas bort.

Fyra bilder kvar. **Kandidat för ett eget måttkort.**

De övriga sju behåller alla fem bilderna, och alla sju har en ren
måttritning på position 3 — bara siffror och cm, inga tyska ord.

## ⚠️ Tvättkorgen är VIDE, inte rotting

`6e73f024`. Produktnamnet i prisjämförelsen säger "Rotting". Källan säger
`Weidengeflecht` och `Material: Weidenrute`, alltså vide, och fotona visar
grova videkvistar. Rotting och vide är olika material och ser olika ut.

Texten säger vide. Namnet i butiken likaså.

Fotona visade dessutom en detalj källan inte nämner alls: innerpåsen är
vit med en hålbroderad bård och ett mörkblått band knutet i en rosett.
Två av fem bilder är närbilder på just den detaljen, alltså är den
tänkt att vara ett säljargument.

## ⚠️ Förvaringspallens lock är vändbart — och det står inte rakt ut

`31d6d517`. Källan säger `Deckelabmessungen: 34L x 34B x 4H cm` och att
stommen har `MDF-Rahmen und furnierter Oberfläche`. Den säger inte att
locket går att vända.

Fotona gör det: bild 3 visar locket losstaget med en ljus fanerad kant,
och bild 4 visar pallen som sidobord med en ljus skiva uppåt och en
kaffekopp på den. Faneret i källan och den ljusa skivan på fotot är
samma sak sedd från två håll.

Texten beskriver därför locket som vändbart. Det är den enda slutsatsen
i rundan som bygger på två källor som var för sig är ofullständiga.

## ⚠️ Bänkens gröna är en mörk petrolgrön

`d5919be6`. Källan säger bara `Farbe: Grün`. Fotona visar en djup
petrolgrön, inte en klar grön. Texten säger mörkgrön, och namnet likaså —
en kund som söker "grön bänk" och får en petrolgrön hem är en retur.

## ⚠️ Källan motsäger sig själv om bänkens sits

`d5919be6` igen. Två rader står bredvid varandra:

```
Gesamtabmessung: 100L x 36B x 45H cm
Sitzgröße:       100B x 36T x 45H cm
```

`Sitzgröße` upprepar hela bänkens mått. Den kan inte stämma: `Sitzdicke`
är 13 cm på samma lista, så sitsen är inte 45 cm tjock. Texten skriver
därför inget sitsmått alls — bara tjockleken 13 cm och totalhöjden 45 cm.

## ⚠️ Pallens stoppning är 31 cm av 41,5

`5240178f`. Källan säger `Dicke des Kissens: 31 cm` och
`Höhe vom Boden bis zum Boden: 10 cm`. 31 + 10 = 41, mot totalhöjden
41,5. Talen hänger alltså ihop: den stoppade kroppen är 31 cm och står
10 cm över golvet.

Fotona bekräftar formen — benen löper upp längs sidorna i stället för
att sitta under, så den stoppade delen är hela pallen utom benen.
