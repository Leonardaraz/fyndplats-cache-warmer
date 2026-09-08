# Runda 102 — Steg 2 (laglighet), Steg 4 (bilder), Steg 5 (påståenden)

## Steg 2 — laglighetsgrind

Samma produkttyp som runda 101, och samma slutsatser gäller. Kontrollerat per
produkt i den egna tyska källan:

| fråga | svar |
|---|---|
| Hälsopåstående? | **Nej.** Källan säger "entspannen", aldrig lindrar/botar. Ingen medicinsk effekt får skrivas. |
| El | 100–240 V in → **12 V ut** via extern adapter. Lågspänning i möbeln. |
| Maxlast | Uttrycklig i källan för alla fem. En hård gräns som är en del av köpet → får stå som positivt villkor. |
| Mikrolåsning | Leverantören flaggar den själv (*"die Rückenlehne kann nicht vollständig verriegelt werden"*). Upplysningen ska med — bortförklaringen inte. |
| Åldersgräns / barnnorm | Ingen. Möbel för vuxna, inga EN 71-anspråk görs. |

Inget hindrar publicering.

## Steg 4 — bilderna

Alla fem bär fem bilder (feedens rena positioner 1, 2, 3, 8, 9).

### ☠️ `3b61e50c` bild 3 är en FRÄMMANDE måttritning — den plockas bort

Ritningen i C-brunns galleri motsäger produktens egen tyska text på två tal:

| | ritningen i `3b61e50c` | tyska texten | `70d0a9ea`:s ritning | min publicerade C |
|---|---|---|---|---|
| bredd × djup | **81 × 81** | 76 B × 81 T | 76 × 81 | 76 × 81 |
| fotpall | **50 × 46 × 43** | 47 × 40 × 43 | 47 × 40 × 43 | 47 × 40 × 43 |

Två oberoende källor (produktens egen text OCH syskonets ritning) säger samma
sak; ritningen står ensam. Den är alltså fel, och en felaktig måttritning i
galleriet är värre än en bild för lite — kunden mäter sin vägg efter den.
**Bild 3 utgår ur `3b61e50c`.** Fyra bilder kvar, och kortet blir den femte.

⚠️ Ritningen är inte "en annan produkt": hjältebilden visar samma stol (rynkad
mittpanel, svart rund tallriksfot, ottoman på egen pelare) som `70d0a9ea` och
som min publicerade cremevita. Det är TALEN som är fel, inte möbeln.

### ✅ Modell B:s ritning är kontrollerad och stämmer

`5a31b710` bild 3: 80 × 86 × 99, fälld 118 × 83, sits 50 × 52, armstöd 56,
fotpall 47 × 42 × 45. Exakt runda 101:s modell B. Ritningen behålls.

### ✅ Och min PUBLICERADE modell C är kontrollerad i efterhand

Runda 101 hämtade `rygg 54 × 71` och `armstöd 58 cm` ur ritningen. Den
ritningen lästes om i dag: den bär **105 / 76 / 81 / 54 / 71 / 50 / 51,5 / 45 /
58 / 47 / 40 / 43** — alltså varenda tal på de publicerade sidorna. Inget är
ohärlett. Det var värt att kontrollera, eftersom de två nya utkastens ritningar
är fattigare respektive felaktiga.

☠️ **Slutsats om de två raderna på de NYA C-sidorna:** `Ryggstöd 54 × 71` och
`Armstödshöjd 58 cm` är egenskaper hos MODELLEN, mätta på modellens egen
ritning, och alla fyra är bevisat samma stol på sju tal. De skrivs därför även
på de två nya — det är samma mätning av samma möbel, inte ett lån av ett
grannvärde. Hade måtten varit färgberoende (klädsel, ton) hade det varit
otillåtet.

### Materialkonflikten på `5a31b710` — avgjord på fotot

| källa | säger |
|---|---|
| alt-texten | **Polyester** Cremeweiß |
| Technische Daten | **Kunstleder**, Schaumstoff, Holz |
| feedens spec-kolumn | **Kunstleder** |
| **fotot** | slät, sömmad, blank PU-yta — **konstläder** |

Tre mot en, och fotot är entydigt. `5a31b710` är **konstläder**. Alt-texten är
leverantörens eget fel och skrivs ändå om.

`2de635c3` är däremot kontrollerat **vävt tyg** — synlig väv i hela klädseln.
Den får tygtexten och tygskötseln, som publicerade `89fead7d`.

### Alt-texter

| id8 | idag | åtgärd |
|---|---|---|
| `5a31b710` | tysk, 5 st, identiska, med fel material | skrivs om, en per bild |
| `071cad5d` | tysk, 5 st, identiska | skrivs om |
| `2de635c3` | **noll** | skrivs |
| `3b61e50c` | **noll** | skrivs |
| `70d0a9ea` | **noll** | skrivs |

Galleriordning enligt runbooken: 1 hjälte, 2 livsstil, 3 vårt eget kort,
sist måttritningen.

## Steg 5 — påståenden per produkt

Varje rad nedan står ordagrant i produktens EGEN tyska källa. Inget är hämtat
från ett syskon utom de två C-raderna som motiveras ovan.

| påstående | B `5a31b710` | B `071cad5d` | B `2de635c3` | C `3b61e50c` | C `70d0a9ea` |
|---|:-:|:-:|:-:|:-:|:-:|
| 10 massagepunkter | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 lägen (puls/tryck/våg/auto/normal) | ✓ | ✓ | ✓ | – | – |
| 2 styrkor | ✓ | ✓ | ✓ | – | – |
| fjärrkontroll ingår | ✓ | ✓ | ✓ | ✓ | ✓ |
| 145° | ✓ | ✓ | ✓ | ✓ | ✓ |
| fotpall med förvaring | ✓ | ✓ | ✓ | – | – |
| 360° vridbar | – | – | – | ✓ | ✓ |
| trästomme | ✓ | ✓ | ✓ | – | – |
| stål i stommen | – | – | – | ✓ | ✓ |
| mikrolåsning | ✓ | ✓ | ✓ | ✓ | ✓ |
| maxlast fåtölj | 120 | 120 | 120 | 160 | 160 |
| maxlast pall | 100 | 100 | 100 | 20 | 20 |

☠️ **Modell C har INTE fem lägen och två styrkor.** Källan säger bara "zehn
Massagepunkte (per Fernbedienung regulierbar)". Modell B:s formulering får
alltså inte kopieras rakt av — det är precis den sortens lån som gör en
spec-tabell till fiktion. Runda 101:s C-text gör redan rätt ("Tio punkter med
fjärrkontroll"), och den återanvänds ordagrant.
