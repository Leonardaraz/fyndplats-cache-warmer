# Runda 104 — modell B LIVE

Leonards besked 2026-09-08 på Steg 2-frågan: *"Dom ska va ce märkta allt ska va
de, de säljs ju från aosom stora miljardföretag från tyskland"* och *"Allt är
licencerad o grönt"*. Rundan kördes därmed fullt ut.

| id8 | färg | pris | slug |
|---|---|--:|---|
| `f15febb2` | rosa | 2 229 | `elbil-barn-12v-utv-fjarrkontroll-rosa` |
| `3d9dff8a` | orange | 2 069 | `elbil-barn-12v-utv-fjarrkontroll-orange` |
| `2f6ff71c` | blå | 2 159 | `elbil-barn-12v-utv-fjarrkontroll-bla` |

Alla tre är samma modell: 96 × 61 × 56 cm, 3–7 km/h, 12 V 4,5 Ah, 2 × 12 V 25 W,
maxlast 30 kg, ålder 3–5 år. Varje tal bekräftat på måttritningen.

## Vad som togs med ur den juridiska genomgången ändå

Leonards besked avgjorde OM vi publicerar. Det avgjorde inte hur texten skrivs,
och tre saker ur genomgången är ren textdisciplin som kostar noll:

1. ☠️ **Inga obelagda överensstämmelsepåståenden.** `CE-godkänd`, `certifierad`,
   `uppfyller EN 71`, `giftfri` står ingenstans. Produkterna ÄR CE-märkta — men
   vi har inte certifikatet att citera, och ett påstående vi inte kan lägga fram
   underlag för är ett eget fel oavsett om det råkar vara sant. Grinden fäller
   på dem.
2. ✅ **Åldern och maxvikten står FÖRE köp**, fetstilt, i eget stycke — inte
   nedgrävda i spec-tabellen. Art. 11.2 kräver att varningar som avgör
   köpbeslutet syns före köpet.
3. ✅ **"Avsedd för lek på privat mark"** och uttryckligen INTE för allmän väg,
   cykelbana eller trottoar. Det är dessutom sant och nyttigt för kunden.

## ☠️ Åldern: titeln ljög, ritningen hade rätt

Bildernas alt-text (feedens ursprungstitel) sa `3-8 Jahren`. Spec-blocket OCH
måttritningen säger båda `3-5 Jahre`. Sidorna skriver **3–5 år**, och grinden
fäller på `3–8 år` i både käll- och live-läge.

Samma familj som runda 103, men åt andra hållet: där ljög spec-blocket och
ritningen hade rätt, här ljuger TITELN. Regeln står sig — ritningen är facit.

## Grindfynd

Källgrinden fällde ett äkta fel: **färgen saknades i ingressen** på alla tre.
Det är runda 102:s fynd (#361) och det fångades innan något skrevs.

Två andra utslag var grindparametrar från förra rundan, inte textfel:
förväntat antal syskonlänkar var hårdkodat till 3 (här finns 3 produkter, alltså
2 länkar) och skötselrubriken hette "Användning och skötsel" (här heter den
"Innan barnet kör", vilket passar produkten bättre). Grinden prövar nu STRUKTUR
i stället för förra rundans siffror.

⚠️ **Live-grinden fällde "Rosa" som tyskt ord.** Det är svenska lika mycket som
tyska och står korrekt i Färg-raden — ett falsklarm, borttaget. Husets regel
gäller grinden själv.

## Steg 14

100 meningar prövade ordagrant över tre sidor, **noll saknade**. Noll
aktörsord, artikelnummer, husmärken, landnamn, trafikpåståenden eller obelagda
certifieringar. Kontrollsida: den publicerade `elbil-barn-polisbil-12v-fjarrkontroll`.

⚠️ ISR: sidorna var uppe redan vid andra varvet.

## Kvar i familjen

| grupp | utkast | vad som återstår |
|---|---|---|
| **A** terrängfordon (Kawasaki) | `ed84746c` `60ab2042` `3b992525` | ☠️ `3b992525` står som "Gelb" men är **beige/sand** — pixelmätt. Färgen måste läsas ur bilden. `60ab2042` är dessutom OUT_OF_STOCK. |
| **C** motorcykel (Aprilia) | `5e9cc2d2` `1e27f7e0` | ☠️ `1e27f7e0` står som "Gelb" men är en **svart** motorcykel med gula dekaler. |
| **D** polisbil | `9308a7dc` | motoreffekten motsäger sig själv (25 W singular mot "zwei Motoren") |
| **E** sportbil (Maserati) | `c0abfddd` | ⚠️ möjlig dubblett mot publicerade `maserati-elbil-barn-tvasitsig` |
| **F** quad | `883db249` | ⚠️ **ingen måttritning alls** — måtten går inte att verifiera |

⚠️ **Importens tyska färgvärden** (`Färg: Grau`, `Färg: Blau`, `Färg: Gelb`,
`Material: Kunststoff`) finns kvar i sju av elva. Det är ett importfel som når
kunden om ingen rättar det — rättas i respektive produkts polering.
