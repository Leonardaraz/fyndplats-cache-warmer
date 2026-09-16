# Runda N6 — nio produkter 979–999 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879, N4 899–939,
N5 949–969, den här 979–999.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 03207c35 | 979 | 999 | +20 | Hundgrind i trä, fällbar, med stödfötter |
| c7c74ab2 | 979 | 1 119 | +140 | Köksset: vattenkokare och brödrost, 7 lägen |
| e2932b74 | 979 | 1 089 | +110 | Barnkök i MDF med 15 tillbehör |
| 0783b515 | 999 | 1 019 | +20 | Hundvagn upp till 10 kg, hopfällbar |
| 1c883b87 | 999 | 1 869 | +870 | Hantel i gjutjärn, 20 kg |
| 2d308bc1 | 999 | 1 089 | +90 | Skrivarställ i tre plan med förvaring |
| 8f1b8163 | 999 | 1 069 | +70 | Fotpall i skandinavisk stil, 68 cm |
| 949ffbb1 | 999 | 1 019 | +20 | Klädd bänk med förvaring, sammetslook |
| cb57e1dc | 999 | 1 049 | +50 | Gunghäst med musik, 57 cm |

## Urvalet kom ur en FULLSTÄNDIG mätning

Prisjämförelsen kördes med `fran_pris=970` och slutade på **0 prefix kvar** i
tre varv — alltså är "de säljer den inte" ett besked och inte ett golv. 2 635
produkter i katalogen där vi är billigare.

## ☠️ Måttskärmen fällde SJU av 31 — och tre av dem mot sidor vi nyss skrev

Hela den publicerade katalogen är genomsvept: **2 817 sidor**, markören tömd
(`klar: true`), inte ett stickprov. Tröskeln är två delade måtttripplar — en
delad komponent är inte samma produkt.

| kandidat | krockar med | delade tripplar |
|---|---|---:|
| `980dd9a1` köksset | `6f79738d` brödrost + vattenkokare | **5** |
| `d7fea466` köksset | `6f79738d` | **5** |
| `98e09361` hundvagn | `f0ee6c6a` hundvagn med vändbart handtag | **4** |
| `834cbe61` rutschbil | `f87c0ccb` Mercedes-Benz C-klass gåbil | **3** |
| `eb19eca6` köksset | `0ab3483a` + `b330de9c` frukostset | 2 mot vardera |
| `c47838e6` kontorsstol teddyfleece | `3c8fe7db` — **runda N5, samma dag** | 2 |
| `4ab77ce5` kattlåda rostfritt | `8ef08765` kattlåda med höga kanter | 2 |

☠️ **`980dd9a1` och `d7fea466` är dessutom samma vara som varandra** — sex av
sex identiska tripplar och byte-identiskt namn. Tredje gången huset möter
klassen: Aosoms egen feed bär samma fysiska produkt under två artikelnummer,
och dubblettspärren nycklar på artikelnumret, så den ser ingenting.

⚠️ **`c47838e6` är det dyraste fyndet.** Den hade blivit en andra sida för den
teddyfleece-stol som publicerades i N5 för en timme sedan — exakt den interna
dubblett Google straffar. Skärmen måste alltså köras mot en katalog som
inkluderar det man nyss skrev, inte mot gårdagens.

## Sex föll på säsong

Mitten av september. `316c55d1` häcksax, `6972a328` solsängsdyna, `2a3d2495`
och `cb828049` odlingslådor, `a98acbab` trädgårdsbord, `bd28eeea` blomtrappa.
En utegrupp som poleras nu får sin första besökare om sju månader.

## En föll på lagret

`137403f6` solpanel 100 W är **OUT_OF_STOCK**. Lagergrinden ligger före texten
med flit: en sida för en vara ingen kan köpa är slöseri i båda ändar.

## Fyra kan skärmen inte pröva (#274)

`1dc4b1ba`, `4444ab0f`, `50d8807a` och `6972a328` har bara EN måtttrippel i
källan, och tröskeln är två. Grinden svarar "inga krockar" utan att ha kunnat
jämföra. De räknas som **OGRANSKADE, inte som rena** — samma skillnad som
mellan `utanTraff` och `viBilligare` i prisjämförelsen. Tre av dem är
konstväxter, och rundorna L1–L4 täckte just den familjen tätt.

## ⚠️ En närmiss som inte fälldes men är värd att veta

`15d40f17` är en fristående hundgrind på **185 × 71 cm**. Runda N4 publicerade
`f4136218` *"Hundgrind 183 cm, fristående, fyra paneler"*. Skärmen hittar noll
delade tripplar, alltså är de mätt olika — men två centimeter isär i en
familj vi redan säljer är nära nog att den väntar till nästa runda och tas
med ögon på fotot, inte på ett mönster.

## Lagergrinden

| kort | saldo |
|---|---:|
| 03207c35 | 42 |
| c7c74ab2 | 62 |
| e2932b74 | 19 |
| 0783b515 | 103 |
| 1c883b87 | 92 |
| 2d308bc1 | 124 |
| 8f1b8163 | 129 |
| 949ffbb1 | 67 |
| **cb57e1dc** | **4** |

Nio av nio köpbara, noll utan lagerrader. ⚠️ Gunghästen har bara fyra kvar —
den kan hinna ta slut innan sidan hunnit få sin första besökare.

## ☠️ Och sökningen BÄR plainDescription — 28 anrop i stället för 2 800

Husets anteckning säger att `plainDescription` saknas i produktens
standardprojektion och måste begäras med `?fields=PLAIN_DESCRIPTION`. Det
sade ingenting om SÖK-endpointen, och de två familjerna svarar mätbart olika
på samma kroppsform förr.

Uppmätt på skarpa V3 samma dag, samma filter, tre produkter:

```
POST /stores/v3/products/search  utan fields       -> plainDescription SAKNAS (29 nycklar)
POST /stores/v3/products/search  fields:["PLAIN_DESCRIPTION"] -> 3 544 tecken
```

`fields` ligger på KROPPENS toppnivå, inte inuti `search`. Det gör den
katalogomfattande måttskärmen till ~28 anrop i stället för ett GET per
produkt — alltså körbar i en session i stället för att behöva delas upp.
