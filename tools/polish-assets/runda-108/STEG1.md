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

## ✅ Ommappningsfallet är BEVISAT — `d4118d39` är en AliExpress-import

Mappningsläsningen avgör frågan:

```
supplierProductId:  1005008518824783        ← AE-listnings-id, inte "aosom:…"
bilder:             ae-pic-a1.aliexpress-media.com … ae01.alicdn.com
shipsFromCountries: ["ES"]                  ← "byaosom ES (EU) Store"
prisgrinden:        EJ AVGÖRBAR — raden är inte en Aosom-import
```

Det är ordagrant Leonards fall (regeln 2026-09-03): **samma fysiska vara som
både en AE-inköpt sida och en feed-importerad.** Sidan vi behåller pekas om
till Aosoms artikelnummer, den andra pensioneras.

☠️ **Men det är TVÅ feed-utkast mot EN publicerad sida, och det är inte en
detalj.** AE-listningen buntar vit och svart på samma sida — kontaktarket visar
det: `d4118d39`:s bild 1 är SVART, bild 2 är VIT. Aosom säljer dem som två
artikelnummer. Ommappningen tar ETT artikelnummer per produkt
(`lib/aosom/remap.ts` vägrar en flervariantssida), så en ommappning tvingar
fram ett val av färg.

Det är samtidigt lösningen på "vit eller svart"-defekten: en sida som pekar på
ett artikelnummer kan bara skeppa den färgen, och då blir texten sann.

**Förslaget, för Leonards ja:** mappa om `d4118d39` till EN av färgerna, döp om
sidan efter den, och behåll den ANDRA färgens utkast som en egen sida — då är
det inte längre en dubblett utan ett färgsyskon. Priset rörs inte.

⚠️ Prisgrinden på `d4118d39` säger `landedCostSek 1161,93 → förväntat 1399,
faktiskt 1529`. Den är EJ AVGÖRBAR eftersom raden är AE, inte Aosom — det
bevisar ingen drift. Men den som mappar om raden flyttar den in i Aosom-synkens
räckvidd, och då börjar priset räknas om. Värt att veta innan bytet.

## Steg 4 — kontaktarket

Alla sex har identisk galleristruktur: 1 studiobild, 2 miljöbild, 3 måttritning,
4 närbild på väven, 5 närbild på foten. **Måttritningen ligger på plats 3 på
alla sex** och flyttas sist, som runbooken säger.

| kontroll | utfall |
|---|---|
| Färgen i spec stämmer mot fotot | ✅ alla sex |
| Tysk text i pixlarna | ✅ ingen — ritningarna bär bara `170cm`, `40cm`, `160/240/320cm` |
| Leverantörens logotyp i pixlarna | ✅ ingen |
| Måttritningen språkneutral | ✅ bara siffror |

⚠️ **`6649471e` och `64c0809d` delar miljöscen** — samma svarta lampa, samma
puff, samma pläd över kanten. De är olika foton av olika produkter i samma rum,
inte samma fil, så det är inte den dubblett Google straffar. Noterat, inte
åtgärdat: att slänga en bra miljöbild för att scenen återkommer vore att göra
sidan sämre av en regel som finns för att skydda den.

⚠️ **Detaljbilderna 4 och 5 återkommer inom varje färg** — vit 4-panel och vit
8-panel har samma närbild på väven och på foten. Samma sak för natur och brun.
Väven ÄR identisk mellan storlekarna, så bilden är sann för båda.

## Steg 5 — två fel i importens svenska spec-block, i alla sex

1. ☠️ **`Material: Kiefernholz`** — polypropenet har fallit bort. Tyskan säger
   `Materialien: Polypropylen, Kiefernholz`. Väven är det man ser och det man
   köper; att skriva bara tall beskriver ramen och kallar det varan.
2. ☠️ **`Mått: 320L x 1,6B x 170H`** — importen döpte om tyskans `B`(reite)
   till `L` och `T`(iefe) till `B`. Talet 1,6 cm är DJUPET på en panel, inte en
   bredd. Måttet skrivs `320 × 1,6 × 170 cm (B × D × H)`.

Inget av felen är poleringens; båda kommer från `to-product.ts`. De rättas i
texten, och att de finns i alla sex är skälet att skriva dem här.

## ☠️ En UA-lärdom: samma bildadress ger 200 via curl och 400 via urllib

Bildhämtningen föll på `HTTP Error 400`. Alla 34 adresserna svarade `200` när
de kontrollerades med `curl` — felet var att `urllib` skickar
`User-Agent: Python-urllib/3.11`, och wixstatic avvisar den.

Det ser ut som en trasig bildlänk och är en avvisad klient. `grindar.hamta_isr`
sätter redan en UA av samma skäl; bildhämtaren gjorde det inte. Nu gör den det.
