# Runda 102 — Steg 1: familjen mätt, och runda 101 var INTE klar

## Katalogsvepet

☠️ Kvittot är `cursor === null`, inte radantalet. Svepet gick i två etapper om
28–30 sidor (ExecuteWixAPI har 60 s) och slutade med `avhuggen: false`.

| | |
|---|--:|
| Produkter totalt | **5 553** |
| Utkast | **3 204** |
| Publicerade | **2 349** |

Kontrollen mot tom-svar-fällan: svepet ser publicerade sidor (10 `massagestol-*`
i andra etappen), alltså läser filtret verkligen katalogen.

## Massagefamiljen är 105 utkast mot 52 publicerade sidor

Betydligt tätare än runda 101 kartlade. Uppdelad på produkttyp:

| grupp | utkast | publicerade syskon |
|---|--:|---|
| massage-**kontorsstolar** (Bürostuhl/Schreibtischstuhl/Drehstuhl) | ~40 | 17 `massagestol-*` + 2 `kontorsstol-*` |
| **uppresningsfåtöljer** (Aufstehsessel/Fernsehsessel mit Aufstehhilfe) | ~15 | 8 `uppresningsfatolj-*` |
| **Relaxsessel/Massagesessel med fotpall** | ~25 | runda 101:s 8 + `reclinerfatolj-*` |
| massageapparater (ben/rygg) | 3 | `muskelmassageapparat-16-huvuden` |
| massagepall / sadelstol | 2 | rullpallsfamiljen |
| gamingfåtölj med massage | 3 | gamingstolarna |

## ☠️ Måttgrinden: fem utkast är FÄRGSYSKON till det jag publicerade i går

Runbookens regel för en tät kategori är att mäta MÅTTEN, inte namnen. Gjort på
de 17 utkasten i samma produktrum som runda 101, mot mina åtta publicerade:

| kluster | mått | maxlast | utkast | mot mina |
|---|---|---|---|---|
| **modell B** | `80 × 86 × 99` · pkt `81 × 61 × 47` | 120/100 kg | `2de635c3` `5a31b710` `071cad5d` | ☠️ = mina TVÅ |
| **modell C** | `76 × 81 × 105` · pkt `81 × 37,5 × 56,5` | 160/20 kg | `3b61e50c` `70d0a9ea` | ☠️ = mina TVÅ |
| E | `79 × 82 × 101` | 160/20 kg | `aa8dc201` `d8deb38b` `78308d21` | eget kluster |
| F | `76 × 80 × 102` | 150/25 kg | `6a1b490a` `668d097b` `5a6ea7f3` | eget kluster |
| F? | `76 × 80 × 102` | **120** kg | `e140f9ab` | samma mått, ANNAN last |
| G | `56 × 168 × 84` | 17 kg | `b38dc41c` `680d586a` | eget |
| H | `92 × 92 × 102` | 135 kg | `7b1a4f0e` | eget |
| I | `89 × 99 × 106` | 150 kg | `d3d7b291` | eget |
| J | `78 × 93 × 99` | 120 kg | `a6c80fe7` | eget (Bürostuhl) |

**Runda 101 var alltså inte fel — den var ofullständig.** Modell B är en familj
på FEM, inte två, och modell C på FYRA, inte två. Sökordsgrinden i runda 101
kunde inte se det: de tyska namnen är helt olika (`Relaxsessel mit Fußhocker,
Stauraum…` mot `Massagesessel mit Fußhocker…`), och bara måtten avslöjar det.

## FÄRGSYSKON, inte dubbletter — avgjort på färg, material och pris

| modell | publicerad | i kön |
|---|---|---|
| **B** | svart konstläder 2 359 · svart tyg 2 449 | Cremeweiß kl **2 449** · Braun kl **2 479** · Dunkelgrau **polyester** 2 599 |
| **C** | cremevit 2 449 · mörkgrå 2 569 | Braun **2 329** · Schwarz **2 549** |

Fem skilda färger, fem skilda priser, identiska paketmått inom modellen. Ingen
färg krockar med en publicerad. Leonards ommappningsregel gäller alltså inte —
det här är sortiment, inte dubblett.

## Källkontroll: den tyska texten är ORDAGRANT densamma

Alla fem lästes i sin helhet. Varje påstående runda 101 skrev för modell B och C
står ordagrant i syskonens egen tyska källa:

- **B**: 10-Punkte-Massage, 5 Modi (Puls/Druck/Welle/Auto/normal), 2 Intensitäts-
  stufen, 145°, Fußhocker mit **Stauraum**, Holzrahmen, Mikroverriegelung,
  80×86×99 / 80×118×83, Sitz 50×52, Sitzhöhe 43, Armlehne 56, Hocker 47×42×45,
  100–240 V → 12 V, 120/100 kg, Lieferumfang med **Fernbedienung**.
- **C**: zehn Massagepunkte per Fernbedienung, 145°, **360° drehbar**, 160 kg,
  76×81×105 / 81×112×91, Sitz 50×51,5, Sitzhöhe 45, Hocker 47×40×43, 160/20 kg,
  Kunstleder/Stahl/Schaumstoff, Mikroverriegelung.

⚠️ **En sak saknas i syskonens källa och måste hämtas ur RITNINGEN, inte lånas.**
Modell C:s `Ryggstöd 54 × 71 cm` och `Armstödshöjd 58 cm` står inte i de två nya
utkastens tyska text. I runda 101 kom de ur **måttritningen i galleriet**
(`STEG2-4-5.md` rad 123–124: "rygg 54 cm bred × 71 cm hög | ritning"), vilket är
en giltig källa. Steg 4 måste därför kontrollera att samma ritning ligger i de
två nya utkastens galleri — gör den inte det ska raderna utelämnas, inte lånas
från syskonet.

## Rundans omfattning

**Fem produkter**, och de STÄNGER två modeller:

| id8 | modell | färg | klädsel | pris |
|---|---|---|---|--:|
| `5a31b710` | B | cremevit | konstläder | 2 449 |
| `071cad5d` | B | brun | konstläder | 2 479 |
| `2de635c3` | B | mörkgrå | tyg (polyester) | 2 599 |
| `3b61e50c` | C | brun | konstläder | 2 329 |
| `70d0a9ea` | C | svart | konstläder | 2 549 |

☠️ **Och runda 101:s ÅTTA publicerade sidor måste skrivas om i samma veva.**
Deras syskonlista säger "Vi säljer åtta massagefåtöljer i fyra modeller" och
räknar upp sju. Rätt tal är **tretton**. Därför utökas `runda-101/texter.py` till
tretton produkter i stället för att en ny `runda-102/texter.py` skapas: listan
måste vara IDENTISK på alla tretton sidor, och två filer som båda definierar den
är precis den tvilling huset lärt sig att inte bygga (`SHIP_AXIS_RE`,
`EU_TULL_CODES`, `mapWithConcurrency`).
