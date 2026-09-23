# Runda 90 — Steg 1: dubblettgrinden mot hela den publicerade familjen

Rundan skulle polera modell G mot den publicerade syskonsidan `bd3bdc1b`.
Grinden fällde två av utkasten och rättade dessutom två poster i minnet.

## Familjen, mätt

Katalogsvep: **5 527 produkter**, `avhuggen: false`. 19 publicerade
sparkcykelsidor, 14 utkast kvar i familjen.

## ☠️ Två BEVISADE dubbletter mot en publicerad sida

Pixelgrinden (`abs(gray(a)-gray(b)).mean()` på 320 × 320) gav **0,00** —
byte-identiska bilder — i två fall, och båda är FÄRGBÄRANDE:

| utkast | färg | pris | mot | publ. pris | bevis |
|---|---|--:|---|--:|---|
| `aef9a8d9` | grön | **1 199** | `bd3bdc1b` | **1 079** | `aef9a8d9-2` = `bd3bdc1b-7`, måttskissen på DEN GRÖNA |
| `28d7dfd9` | ljusblå | **1 399** | `bd3bdc1b` | **1 079** | `28d7dfd9-1` = `bd3bdc1b-3`, livsstilsfotot på DEN BLÅA |

Måttgrinden bekräftar: 139 × 58 × 90–96 cm, Ø40 cm, 100 kg, 9,5 kg, paket
99 × 16 × 52 — identiskt med `bd3bdc1b`.

☠️ **Båda utkasten är DYRARE än den publicerade sidan** — 120 respektive
320 kr. Att polera dem hade gett två egna URL:er med samma foton, samma
spec och ett sämre pris. De poleras inte, och de raderas inte: vilken sida
som ska bort är ett affärsbeslut. **Flaggade för Leonard.**

⚠️ `bd3bdc1b` är AE-inköpt (`supplierProductId 1005010112489719`,
`Sold ByAosom ES (EU) Store`, skickas från ES) medan utkasten kommer ur
Aosom-feeden. Det är CLAUDE.md:s kända hål i ren form: dubblettspärren
nycklar på `supplierProductId` och kan inte se att det är samma vara.

☠️ **Ommappningen till Aosom (regeln 2026-09-03) är BLOCKERAD här.**
`lib/aosom/remap.ts` vägrar en flervariantssida med flit — en Aosom-rad ÄR
en artikel — och `bd3bdc1b` har två färgvarianter. Beslutet är alltså
Leonards i en annan form än den vanliga.

## ⚠️ RÄTTAT: `bd3bdc1b` säljer INTE en färg den saknar

Runda 89:s Steg 1 antecknade att sidan lovar "blå eller grön" på en
ENVARIANTSSIDA (uppgift #330). Mappningsraden säger något annat:

```
Färg: Blå  → supplierVariantId 12000051206926785, shippableToSe true
Färg: Grön → supplierVariantId 12000051206926786, shippableToSe true
```

Två Wix-varianter, två skilda AE-SKU:er, båda fraktkontrollerade
2026-09-04. Sidans "Finns i blått och grönt" och FAQ:ns "välj färg innan du
lägger den i varukorgen" är **korrekta**. #330 stängs som felaktig
observation — inget att laga.

## ☠️ Pixelgrinden måste läsa en FÄRGBÄRANDE bild

Rundans metodfynd, och det motsäger runbookens formulering *"under 1,0 är
samma bild, och då är det samma fysiska produkt"*.

Två par gav också 0,00 utan att vara samma produkt:

| par | vad bilden visar | dom |
|---|---|---|
| `68f8f1a7-4` = `41269686-4` | närbild på **styret** med svart SCOOTER-dyna | samma MODELL |
| `85be4535-4` = `9518db1e-4` | närbild på **fotplattan**, svart på båda | samma MODELL |

`68f8f1a7` är **rosa**, `41269686` är **vinröd** — helt olika varor. Den
delade bilden är en detalj av en färgNEUTRAL komponent.

**Regeln som gäller: 0,00 på en färgbärande bild BEVISAR samma produkt.
0,00 på en detalj av en delad komponent bevisar samma MODELL — vilket är
nyttigt (det kartlägger familjen), men det är inte en dubblett.** Titta på
bilden innan du fäller.

## ⚠️ Modell E är INTE modell D — runda 89 publicerade ingen dubblett

Måtten ligger farligt nära: båda 120 cm långa, 58 cm breda, Ø30 cm hjul,
100 kg, 8,2 kg. Bara styrhöjden skiljer (E 85–95, D 75–80), och en tabell
hade kunnat kallas 2/3.

Bilderna avgör det: **E har en genomstegsram med hög böjd överrör** och
lågt hängande fotplatta, **D har en låg dubbel U-ram**. Två olika
konstruktioner. Styrhöjden är alltså inte en slarvig siffra utan följden
av en annan ram.

## Familjekartan efter grinden

| modell | mått | hjul | last | publicerade | utkast kvar |
|---|---|---|--:|---|---|
| **A** | 120 × 52 × 80–88 | 12 tum | 50 kg | blå, vinröd, svart | `68f8f1a7` **rosa** |
| **B** | 118 × 52 | Ø30 cm | 50 kg | röd, blå, grön | — |
| **C** | 115 × 50 × 80–88 | Ø30 cm | 50 kg | *ingen* | `9518db1e` blå · `473084eb` rosa · `85be4535` vit |
| **D** | 120 × 58 × 75–80 | Ø12 tum | 100 kg | svart/röd, turkos | — |
| **E** | 120 × 58 × 85–95 | Ø30 cm | 100 kg | *ingen* | `369b4b2c` svart · `feac1d03` ljusblå · `c851d101` vit · `1b1d4842` beige |
| **F** | 135 × 58 × 88–94 | Ø41/Ø30 | 100 kg | orange, turkos | — |
| **G** | 139 × 58 × 90–96 | Ø40 cm | 100 kg | `bd3bdc1b` blå+grön | `5129f6b0` **vit** · `50b28808` **svart** (+ 2 dubbletter) |
| **H** | 135 × 58 × 92–100 | 16"/12" | 100 kg | `4080448d` rosa | `ea013fde` svart |
| **I** | 139 × 58 × 90–96 | — | 100 kg | blå, rosa (korg) | — |
| **A2** | 143 × 58 × 92–100 | 16 tum | 100 kg | svart, rosa | — |
| — | 94 × 36 × 88–103 | Ø20 cm PU | 100 kg | *ingen* | `eb4418ad` **hopfällbar cityscooter** |

`eb4418ad` är ingen barnsparkcykel av familjens typ: hopfällbar, massiva
PU-hjul, 6–12 år, kroppslängd 110–130 cm. Egen produktklass.

## Rundans batch

Sju utkast som är EGNA produkter eller färger katalogen saknar:

| id8 | modell | färg | pris |
|---|---|---|--:|
| `5129f6b0` | G | vit | 1 269 |
| `50b28808` | G | svart | 1 199 |
| `9518db1e` | C | blå | 1 099 |
| `473084eb` | C | rosa | 1 149 |
| `85be4535` | C | vit | 1 159 |
| `68f8f1a7` | A | rosa | 1 179 |
| `eb4418ad` | — | svart, hopfällbar | 1 019 |

Hållna: modell E:s fyra (egen runda — fyra färger av EN modell räcker till
en egen batch) och `ea013fde`, som ska poleras mot den publicerade `4080448d`
med samma 16/12-hjul.
