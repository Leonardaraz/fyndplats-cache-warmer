# Runda 108 — rumsavdelare (Raumtrenner / Paravent)

## Steg 1 — svepet

| | |
|---|---:|
| Produkter lästa | 5 580 |
| Sidor | 56 |
| `avhuggen` | `false` |
| Unika | 5 580 |
| Publicerade | 2 417 |
| Utkast | 3 163 |
| **Rumsavdelarutkast** | **19** |
| **Publicerade konkurrenter** | **3** |

Kontrollmätningen är det som gör siffrorna värda något: svepet ombads hitta
`smadjursstall-230-natur` (runda 107, publicerad för en timme sedan) och gjorde
det. Ett "noll krockar" från ett tomt svep hade sett likadant ut.

⚠️ Den första grupperingen på de två FÖRSTA orden i det tyska namnet var
värdelös — `2er Set`, `3 teiliges` och `2 in 1` är kvantitetsprefix som spänner
över ett dussin produkttyper. Med prefixen bortkastade föll familjerna ut.

⚠️ Och filtret på `Trennwand` drog in skoskåp, voljär, odlingslåda och
kattlådeskåp: ordet står i deras namn för en INRE avdelare. Familjen är 19, inte
24.

## ☠️ Steg 1-grinden: två utkast är BEVISADE dubbletter av en publicerad sida

Leverantören säljer EN konstruktion i tre panelantal och fyra färger — 40 cm
per panel, 170 cm hög, 1,6 cm tjock, polypropenväv på tallram:

| paneler | utfälld | hopfälld | vikt | gångjärn | färger (pris) |
|---:|---|---|---:|---:|---|
| 4 | 160 × 1,6 × 170 | 40 × 6,4 × 170 | 6 kg | 9 | vit `5f14c112` 1 069 · brun `957b042d` 1 139 |
| 6 | 240 × 1,6 × 170 | 40 × 12,5 × 170 | 7,9 kg | 15 | vit `ffb5239f` 1 329 · natur `6649471e` 1 329 · brun `854371fe` 1 179 · svart `7bd4f691` 1 239 |
| 8 | 320 × 1,6 × 170 | 40 × 16 × 170 | 9,6 kg | 21 | vit `da1a8a75` 1 499 · natur `64c0809d` 1 429 |

Den publicerade `d4118d39` — *"Hopfällbar rumsavdelare 6 paneler 240 × 170 cm –
tallram och polypropenväv"*, 1 529 kr — bär exakt samma tal:

| | `d4118d39` (LIVE) | `ffb5239f` (utkast) |
|---|---|---|
| utfälld | 240 × 1,6 × 170 cm | 240 × 1,6 × 170 cm |
| hopfälld | 40 × 12,5 × 170 cm | 40 × 12,5 × 170 cm |
| panel | 40 × 1,6 × 170 cm | 40 × 1,6 × 170 cm |
| gångjärn | 15 | 15 |
| material | polypropenväv, ram i tall | Polypropylen, Kiefernholz |

Runbookens fyra tal räcker inte här — det stämmer på **varenda** tal. Det är
samma vara.

☠️ **Och den publicerade sidans färgfält säger `vit eller svart`.** Den täcker
alltså BÅDA de färger som `ffb5239f` (Weiß) och `7bd4f691` (Schwarz) är. De två
utkasten poleras därför INTE — de skulle bli den interna dubblett Google
straffar, och det på en sida som redan ligger live.

⚠️ **Att den publicerade sidan säger "vit eller svart" är ett eget fynd.** Det
är samma klass som `bd3bdc1b` (runda 90): en sida som inte pinnar färgen kan
inte skicka den kund som väljer. Vilken av de två `d4118d39` faktiskt är avgörs
mot mappningens `supplierProductId`, inte mot texten.

## Rundans batch: sex produkter, tre storlekar × två färger

| id | paneler | färg | pris | utfälld |
|---|---:|---|---:|---|
| `5f14c112` | 4 | vit | 1 069 | 160 × 170 cm |
| `957b042d` | 4 | brun | 1 139 | 160 × 170 cm |
| `6649471e` | 6 | natur | 1 329 | 240 × 170 cm |
| `854371fe` | 6 | brun | 1 179 | 240 × 170 cm |
| `da1a8a75` | 8 | vit | 1 499 | 320 × 170 cm |
| `64c0809d` | 8 | natur | 1 429 | 320 × 170 cm |

Panelantalet står i BÅDE namn, slug och titel — det är kvalificeraren som
skiljer dem från varandra och från den publicerade sexpanelssidan.

## Familjens övriga utkast — inte den här rundan

Elva utkast är andra konstruktioner (bambu/metall, Boho-vävt papper, med
hyllor, med hjul, utomhus med blomlådor, metallram). De hör till kommande
rundor och behöver var sin egen Steg 2.

⚠️ Den andra publicerade sidan, `d0078ef3` *"Rumsavdelare vikbar 6 paneler
240×170 cm – vit skärmvägg i vävt pappersrep"* (1 049 kr), är INTE samma
modell: 240 × **1,5** × 170, hopfälld 39,5 × 12 × 170, och materialet är vävt
pappersrep på furu och bambu. Nära, men mätbart en annan vara.
