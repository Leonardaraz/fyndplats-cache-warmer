# Runda N5 — nio produkter 949–969 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879, N4 899–939,
den här 949–969.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 3b868848 | 949 | 1 039 | +90 | Fällbart skrivbord som blir sidobord |
| 92fc308c | 949 | 979 | +30 | Sensorsoptunna 50 liter med mjukstängning |
| d7b7f77f | 949 | 989 | +40 | Gungren för barn med vaggvisor |
| 281ed0b1 | 959 | 969 | +10 | Barnförvaring med fyra stora lådor |
| 3a334cef | 959 | 969 | +10 | Konstgjord buxbom 115 cm |
| 3ddfd60c | 959 | 1 179 | +220 | Kontorsstol, höjdjusterbar |
| 132a00c5 | 969 | 1 049 | +80 | Växtställ i två plan med dräneringshål |
| 3c8fe7db | 969 | 1 239 | +270 | Kontorsstol i teddyfleece |
| 43b12b37 | 969 | 999 | +30 | Gungelefant med djurljud |

## Urvalet kom ur en FULLSTÄNDIG mätning, inte ett golv

Prisjämförelsen kördes med `fran_pris=940` och slutade på **0 prefix kvar** —
alltså är "de säljer den inte" ett besked och inte ett golv. Det är hela
skillnaden mot en delkörning, där varje produkt vars prefix ligger senare i
markören hade räknats som "de säljer den inte" när sanningen är "vi har inte
frågat än".

☠️ **Och sorteringen är numera ett FACIT, inte en avskrift.** Rapporten
sorterade bara på gapets storlek; den här rundans regel är billigast uppåt.
Tabellen härleddes därför om för hand vid varje runda, ur en summering som
inte går att läsa tillbaka programmatiskt. `dealproffsen.yml` skriver nu
listan sorterad på vårt pris, med prisgolv, till både summeringen och stdout.

## Elva kandidater föll innan en rad text skrevs

**En på lagergrinden:** `137403f6` (solpanel 100 W) står `OUT_OF_STOCK`. En
sida för en vara ingen kan köpa är slöseri i båda ändar.

**Fem på säsong** — mitten av september: campingbord, två odlingslådor,
häcksax och en solsängsdyna. En utegrupp som poleras nu får sin första
besökare om sju månader.

**Fem på måttskärmen mot hela den publicerade katalogen:**

| utkast | krockar med | delade tripplar |
|---|---|---|
| `339a695e` golvfåtölj | `db645ff8` | **3** |
| `b12666e7` väggspegel guld | `719ffb14` väggspegel 110 × 50 svart | 2 |
| `c0dd9d0c` köksset | `0ab3483a` + `b330de9c` frukostset | 2 mot vardera |
| `eb19eca6` köksset | samma två | 2 mot vardera |
| `4ab77ce5` kattlåda rostfritt | `8ef08765` | 2 |

Spegeln är lärorik: den är samma spegel i GULD där vi redan säljer den i
svart. Måtten avslöjar det, namnet gör det inte.

## Bildhashen gav ett ÄKTA negativt

Varje kandidatbild jämfördes på bytestorlek + pixelmått mot huvudbilden på
**2 808 publicerade produkter**: **noll träffar**, och noll interna krockar.
Den byte-identiska klassen finns alltså inte här — och det är precis därför
måttkollen ovan behövdes. De två grindarna fångar olika klasser.

## ☠️ Två utkast är SAMMA vara som två andra utkast

Aosoms egen feed bär mer än en artikelrad för samma fysiska produkt, och
dubblettspärren nycklar på `supplierProductId` — två artikelnummer är två
nycklar, alltså importeras båda. Spärren gör precis vad den ska och ser ändå
ingenting. Tredje gången huset möter klassen.

| par | delade tripplar | beslut |
|---|---|---|
| `3b868848` ≡ `5ae05b43` fällbart skrivbord | **4 av 4**, identiska | behåll den billigare, pensionera `5ae05b43` |
| `c0dd9d0c` ≡ `eb19eca6` köksset | **4 av 4**, identiska | båda faller ändå på skärmen ovan |

Och ett par till, en nivå mildare: `92fc308c` och `e87ab865` delar
PRODUKTmåttet 30,5 × 30,5 × 85 men har olika kartong (33 × 33 × 92 mot
33 × 33 × 86). Samma soptunna i två färger. Den billigare tas; den andra
publiceras inte, för då vore den en färgdubblett av vår egen nya sida.

## ☠️ En kandidat med bara EN mått-trippel kan grinden aldrig fälla

Skärmen kräver **två** delade tripplar — en delad komponent är inte samma
produkt. Följden är att en kandidat vars källa bara ger EN trippel aldrig kan
nå tröskeln: grinden svarar "inga krockar" utan att ha kunnat jämföra.

Fem kandidater är i det läget: `40690da1` (katthus i rotting), `9d2c88bd`,
`dc534033`, `1dc4b1ba` och `4444ab0f`. De räknas därför som OGRANSKADE, inte
som rena — samma skillnad som mellan `utanTraff` och `viBilligare` i
prisjämförelsen, och samma klass som SKU-kollen som itererade en tom lista.

`40690da1` hade annars legat i den här rundan på priset (959 kr). Den väntar.
