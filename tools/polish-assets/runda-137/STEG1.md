# Runda 137 — Steg 1: familjen, och den grind som inte mätte något

## Familjen efter runda 136

| | |
|---|--:|
| Tyska klösmöbel-utkast kvar | **29** |
| Publicerade svenska klösmöbelsidor | **76** |

Svepet gick över hela katalogen (5 688 unika produkter, 57 sidor) med
`products/search`. Kroppen provades med `limit: 5` FÖRE mätningen — svarar
API:t 100 på en femma ligger kroppen under fel nyckel och allt man trodde sig
skicka fanns aldrig i förfrågan.

## ☠️ Måttgrinden läste den publicerade halvan som TOM — och rapporterade noll

Första versionen matchade `(\d+)\s*cm`. Den ser rimlig ut och är fel på båda
sidor, för Aosom skriver `Gesamtmaße: 38L x 38B x 80H cm`: bara det SISTA
talet i varje trippel följs av `cm`. Utkasten fick alltså ett mått per mening
i stället för tre, och de publicerade sidorna fick **noll** — de bär inte
`NN cm` alls utan `Mått (B × D × H): 60 × 45 × 240–260 cm`.

**Grinden svarade "1 av 29 misstänkta". Rätt svar var 8.**

☠️ Och det är själva poängen: **en grind som inte läser något rapporterar noll
dubbletter, och det ser exakt ut som en grind som fungerar.** Samma familj som
en läsare som blir TOM (`/api/tracking-events` 2026-09-01) och som
`MEDIA_ITEMS_INFO` — ett svar utan fel är inget kvitto.

### Fem format, inte ett

| form | var |
|---|---|
| `38L x 38B x 80H cm` | de flesta tyska utkast |
| `L40 x B40 x H132 cm` | `05c91630` |
| `49x49x173 cm` | `0908bbf0` |
| `Mått (B × D × H): 60 × 45 × 240–260 cm` | polerade sidor |
| `48 x 48 x 140 cm (L x B x H)` | polerade sidor, bokstäverna i en parentes |

En publicerad sida (`klostrad-takhogt-225-275-cm`) har dessutom ingen `Mått`-rad
alls utan en `<table>` med `Höjd` och `Golvyta` var för sig.

### ✅ Grinden KALIBRERAS mot två redan bevisade dubbletter

Efter ombyggnaden prövas den mot uppgift #518 och #519, som är bevisade med
andra medel. Hittar den inte båda är dess nollor värdelösa.

| par | delade mått | andel |
|---|--:|--:|
| `a4d8feca` → `klostunna-60-cm-ljusgra` (#518) | 7 | **100 %** |
| `fcfe68f1` → `klostrad-140-cm` (#519) | 7 | **78 %** |

Båda kommer tillbaka. Först då används resultatet.

## Vad grinden hittade — sex nya misstänkta, tre av dem äkta

| utkast | mot | utfall |
|---|---|---|
| `ed8f0e56` | `klostrad-naturfiber-grotta-mysbadd-stege` | ☠️ **DUBBLETT** |
| `0908bbf0` | `klostrad-morkgra-173-cm` | ☠️ **DUBBLETT** |
| `7bdc47b8` | `klostrad-takspant-240-260-cm` | **FÄRGSYSKON** (ljusgrå mot mörkgrå) |
| `a73a1a1c` | `takhogt-katttrad` | ✅ friad |
| `c7bd00b9` | `takhogt-katttrad` | ✅ friad |
| `fecadb3e` | `takhogt-katttrad` | ✅ friad |

**De tre friade är friade på ett MÅTT, inte på en känsla.** Utkasten är
40 × 40 cm i botten, den publicerade sidan 40 × **34**. Djupet skiljer sex
centimeter, och toppen 250 mot 260. Grindens 80 % byggde på fyra vanliga tal
(30, 40, 250, 260) som vilket takhögt klösträd som helst bär.

⚠️ **`7bdc47b8` är inte ett fall för poleringen utan för färgsyskonvägen:**
identiska mått (60 × 45 × 240–260) och olika färg är per husregeln (#420)
ett syskon, inte en dubblett. Den ska poleras MOT den publicerade sidans
text, inte fritt.

## Rundans batch: fyra modeller i två färger var

Måtten är identiska inom varje par och färgen skiljer — alltså färgsyskon,
inte dubbletter. Alla åtta är friade mot hela den publicerade familjen.

| par | totalmått | färger |
|---|---|---|
| `c7bd00b9` + `a73a1a1c` | 40 × 40 × 230–250 cm | Eiche+Cremeweiß · Grau+Cremeweiß |
| `f5f71f5d` + `dd3b541b` | 48 × 48 × 90 cm | Creme · Grau |
| `f489937f` + `5616c567` | 45 × 45 × 91 cm | Grau · Hellbraun |
| `1ae60dbc` + `819bf51c` | 60 × 40 × 66 cm | Beige · Grau |

## Två fynd på vägen som inte rör den här rundan

☠️ **`0908bbf0` motsäger sig själv i sin egen import.** Den tyska
`Gesamtmaße` säger `49x49x173 cm`; produktens EGEN svenska spec-rad säger
`Mått: 50x50x170 cm`. Två olika tal för samma vara i samma produkt.

☠️ **`ed8f0e56`:s svenska `Mått`-rad säger `Mittel`.** Det är tyska för
"medel" — ett TYSKT ORD i den svenska spec-tabellen, skrivet av importen.
Raden bär alltså inget mått alls.
