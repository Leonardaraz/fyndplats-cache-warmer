# Runda K1 — åtta kontorsstolar 1 099–1 669 kr

Kontorssäsong. `Bürostuhl` är den största kvarvarande utkastfamiljen: **91 av
3 277** tyska utkast. Katalogen har samtidigt **61 publicerade** kontorsstolar,
gamingstolar, snurrstolar och arbetsstolar, så urvalet gjordes mot dem och inte
bara mot varandra.

| id | pris | vad som skiljer den från de andra sju |
|---|---:|---|
| `f5c3d285` | 1 669 | Lammullslook, 14 cm sits, **135 kg** — rundans enda över 120 |
| `2c905d9d` | 1 669 | Armlös, 18,5 cm skum, **fyrarmad fot utan hjul** |
| `af42baff` | 1 599 | 63 cm bred sits för skräddarställning, **uppfällbara armstöd**, fot utan hjul |
| `3baca238` | 1 549 | Brunt konstläder, kåpformad rygg i ett med armstöden |
| `0ea09b51` | 1 399 | Rosa sammetslook, kristallknappar, hög rygg 104–114 cm |
| `f943140c` | 1 379 | Beige flanellook, skålad rygg med integrerade armstöd |
| `ecd55a50` | 1 349 | Mörkgrå, **71 cm rygg med nackstöd**, låg sitthöjd 42–50 cm |
| `b0ca912b` | 1 099 | Arbetsstol: rund sits Ø35 cm, **fotring**, 50–64 cm |

## Lagergrinden gjorde jobbet direkt

`574cf80d` (bohostol i grönt, 1 419 kr) var med i urvalet till dess `lager.tsv`
skrevs: **saldo 0, OUT_OF_STOCK**. Den byttes mot `0ea09b51` innan en rad text
skrevs. Det är precis vad grinden byggdes för — förut hade den upptäckts av en
slump i prisgrinden, efter att texten redan var skriven.

Lägsta saldo i den publicerade åttan är 13 (`ecd55a50`); högsta 197.

## ☠️ Kontaktarket bar två fakta som källtexten inte har

Runda J1:s regel — bygg kontaktarket FÖRE brödtexten — gav utdelning igen:

**`2c905d9d` och `af42baff` står på fyrarmade fötter UTAN hjul.** Ingen av de
tyska texterna nämner vare sig `Rollen` eller `Räder` för dem (de andra sex
gör det), och bilderna visar en platt korsfot med glidfötter. En text skriven
ur källan ensam hade sagt "fem hjul" av vana och haft fel om produkten.

Det är också gjort till en säljande egenskap i stället för en utelämnad: en
stol som står still är en fördel på hårt golv, och det är den enda skillnaden
mot resten av kategorin en kund ser direkt på bilden.

## Nära syskon som INTE är dubbletter — men är värda att veta om

Två par ligger nära publicerade sidor. Båda är kontrollerade mot spec och
korslänkade i texten så kunden kan välja:

| ny | publicerad | vad som skiljer |
|---|---|---|
| `af42baff` 1 599 | `f5e77397` 1 039 | 76 cm bred **med uppfällbara armstöd** mot 62 cm **utan armstöd** |
| `b0ca912b` 1 099 | `1476d1ea` 1 189 | **fotring**, 50–64 cm, fast rygg mot ingen ring, 51–67 cm, **avtagbar** rygg |
| `b0ca912b` 1 099 | `3f518008` 1 339 | rund stoppad sits Ø35 mot **nätrygg**, 55–76 cm |

`1476d1ea` delar material, sitsdiameter och sitstjocklek med `b0ca912b` — det
är samma familj hos Aosom. Skillnaden är verklig (fotringen syns i bild och i
måttritningen) men liten nog att vara värd en anteckning: går de två att slå
ihop är det ett beslut för Leonard, inte för poleringen.

## Grindar

| grind | utfall |
|---|---|
| `gate.py` (siffror, tyska, husmärken, artikelnummer, flikar, relativa länkar) | 0 fynd i 8 filer |
| `gate-alt.py` | 40 alt-texter, 0 fynd |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, lägsta saldo 13 |
| `livegrind.py` (publicerad text) | **8/8 REN, orddiff 0** |

Prisgrinden i `/api/admin/mapping`: **8 av 8 `stämmer: true`** mot regeln
1,20 × landedCostSek med charm99. `aosomFreightShare` 0,314–0,411, alltså
ingen rad där frakten kostar mer än varan.

## Skrivningarna

Alla åtta skrevs med transkriptionshash som SPÄRR före skrivningen, inte som
kontroll efter: stämmer inte hashen mot `vantat-hash.tsv` hoppas produkten
över. Efter skrivningen lästes varje produkt tillbaka och jämfördes på namn,
slug, hash, `visible`, variantens `visible`, SKU och antalet SEO-taggar.

Kategori: `Hem & Inredning` (trädet har inget möbellöv), 8 av 8 enligt
bulk-svarets `itemMetadata`.
