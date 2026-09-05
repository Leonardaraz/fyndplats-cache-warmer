# Runda 61 — sju frukostset, läge efter Steg 8

De sju vattenkokar/brödrost-set som inte fick plats i runda 60.

## Steg 1 — dubblettgrinden, med artikelnumret som facit

Fullt svep (55 sidor, `cursor === null`): alla sju är osynliga utkast,
revision 1–3, och **noll** av dem är dubbletter av en publicerad sida.

| id8 | artikelnummer | färg | pris | prisgrind |
|---|---|---|--:|---|
| f523b18d | 800-288V90GY | grå | 1 059 | ✔ |
| 83d2db1a | 800-287V90CW | gräddvit | 1 049 | ✔ |
| e7f69e8a | 800-287V90BK | svart | 1 039 | ✔ |
| 375bb3c8 | 800-286V90CW | grädde | 1 029 | ✔ |
| 7805b8bc | 800-286V90BK | svart | 959 | ✔ |
| 2f2c1c88 | 800-267V90CW | grädde | 1 069 | ✔ |
| 0ab3483a | 800-181V90PK | rosa | 999 | ✔ |

☠️ **Basnumret är modellen, suffixet är färgen.** Tre syskonpar faller ut
mekaniskt, utan att jämföra text eller bild:

- `800-287V90` **CW ↔ BK** — 83d2db1a och e7f69e8a, båda nya
- `800-286V90` **CW ↔ BK** — 375bb3c8 och 7805b8bc, båda nya
- `800-181V90` **BK ↔ PK** — den PUBLICERADE b330de9c och utkastet 0ab3483a

Suffixet matchar tyskans `Farbe` i sju fall av sju (GY, CW, BK, PK). Runda 59
bevisade syskonskap genom att jämföra tysk brödtext och bilder; basnumret gör
samma sak gratis och starkare.

⚠️ Två utkast bär IDENTISKT tyskt namn (f523b18d och 0ab3483a — Wix la på
`-2` i sluggen) och är ändå olika produkter: 5,3 kg fyrskivsrost mot 3 kg
tvåskivsrost. **En namnkrock bevisar ingenting.**

## Steg 2/5 — vad som ströks

☠️ **Summerad effekt på ett uttag.** Varje sida är två apparater:

| id8 | vattenkokare | brödrost | summa | ström |
|---|--:|--:|--:|--:|
| f523b18d | 2200 W | 1860 W | **4060 W** | **17,7 A** |
| 2f2c1c88 | 2200 W | 1860 W | **4060 W** | **17,7 A** |
| 83d2db1a · e7f69e8a · 0ab3483a | 2200 W | 930 W | 3130 W | 13,6 A |
| 375bb3c8 · 7805b8bc | 2200 W | 900 W | 3100 W | 13,5 A |

Två av sju ligger över 16 A. Alla sju sidor bär summan; `lint.py` fäller om
den försvinner.

☠️ **"Kokar på fyra minuter" ströks** (83d2db1a, e7f69e8a). 1,7 liter från
20 °C kräver ~569 kJ; vid 2200 W är det 259 s i teorin och ~4,8 min med
verklig verkningsgrad.

☠️ **"3 Min. 15 Sek. bis zum Sieden" ströks** — talet står på en
marknadsföringsbild som återanvänds på minst tre olika artikelnummer
(800-287, 800-286 och en av runda 60:s). Ett tal som är identiskt över flera
modeller mäter ingen av dem.

☠️ **Syskonens påståenden blandas inte.** 375bb3c8 anger 40–100 °C; syskonet
7805b8bc gör det INTE i sitt eget underlag och får därför inte spannet.
Samma basartikel är inte samma påstående.

☠️ **Varumärket i termostaten namnges inte.**

## Steg 4 — 22 av 35 bilder är rena

| id8 | rena positioner |
|---|---|
| f523b18d | 1, 2 |
| 83d2db1a | 1, 2 |
| e7f69e8a | 1, 2, 4, 5 |
| 375bb3c8 | 1, 2, 3, 4, 5 |
| 7805b8bc | 1, 2, 5 |
| 2f2c1c88 | 1, 2, 5 |
| 0ab3483a | 1, 2, 3 |

☠️ **Skräpet är ENGELSKT lika ofta som tyskt** i den här familjen:
"Family-size", "3.5CM WIDE SLOT", "Crumb Tray", "7 Cups", "Limescale Filter".
Regeln är UTLÄNDSK text, inte tysk text — en grind som bara letade tyska hade
släppt igenom fem bilder.

⚠️ Måttritningar utan ORD behålls (375bb3c8 pos 3, 0ab3483a pos 3); samma
ritning med "Family-size" eller "7 Cups" på släpps inte in.

⚠️ Engelsk text som sitter FYSISKT på varan (CANCEL/REHEAT/DEFROST på
brödrostens knappar) är varan, inte pålagd grafik — den bilden behålls.

## Steg 7–8 — texterna och SKU:erna

`lint.py` 7/7 rena · `mutationstest.py` 26/26 grindar fäller ·
`skugrind.py` sju distinkta SKU:er.

☠️ **Katalogsvep på SKU:erna** (`search-variants`, 7 sidor, 6 441 varianter,
4 915 distinkta SKU:er): **noll krockar** och noll prefixkrockar. Den interna
grinden kan inte se katalogen — uppgift #272 mätte upp elva SKU:er som delas
av 24 publicerade produkter.

| id8 | slug | SKU |
|---|---|---|
| f523b18d | frukostset-gratt-fyrskivig | FP-frukostset-gratt |
| 83d2db1a | frukostset-graddvitt-termometer | FP-frukostset-graddvitt |
| e7f69e8a | frukostset-termometer-svart | FP-frukostset-termometer |
| 375bb3c8 | frukostset-led-display-gradde | FP-frukostset-led-display |
| 7805b8bc | frukostset-varmhallning-svart | FP-frukostset-varmhallning |
| 2f2c1c88 | frukostset-rostfritt-fyra-skivor | FP-frukostset-rostfritt |
| 0ab3483a | frukostset-rosa-bikakemonster | FP-frukostset-rosa |

## ☠️ Ordlistan fällde fyra korrekta svenska texter

`Kalkfilter` lades in som "tyskt ord" och är också ett fullkomligt vanligt
svenskt ord. Exakt den fällan som kommentaren överst i `lint.py` varnar för
(Grill, Timer, Filter, Dörr) — och listan VÄXER varje runda, så varje nytt
ord måste prövas mot svenskan innan det läggs in.

## Kvar

Steg 9 (kort, galleri, alt-texter) · Steg 10 (kategorier) · Steg 11–13
(publicering + stämpling) · Steg 14 (live-kontroll).
