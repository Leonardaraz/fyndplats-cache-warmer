# Runda 142 — Steg 13: elva sidor LIVE

**11 av 11**, kvitterat i ett eget anrop efter skrivningen.

| | |
|---|--:|
| `visible: true` på produkten | 11 |
| Varianten synlig | 11 |
| SKU intakt efter publiceringen | 11 |
| Bilder kvar i galleriet | 11 (6 × 10, 5 på `56cca82a`) |

## ☠️ `fields=VARIANTS_INFO` FINNS INTE — och 400:an ser ut som ett kroppsfel

Två anrop dog på `Failed to parse JSON or deserialize protobuf message` innan
orsaken var klar. `VARIANTS_INFO` och `VARIANTS` är inte giltiga värden i
`fields`; felet nämner dem inte utan pekar på kroppen, så det ser ut som ett
skrivfel i bodyn.

**`variantsInfo` ligger i STANDARDPROJEKTIONEN.** Uppmätt på sex varianter av
anropet:

| fråga | variantsInfo |
|---|---|
| ingen `fields` alls | **ja** — id, sku, visible |
| `?fields=MEDIA_ITEMS_INFO` | ja |
| `?fields=VARIANT_OPTION_CHOICE_NAMES` | ja |
| `?fields=VARIANTS_INFO` | ☠️ **400** |

Det är motsatsen till `media.itemsInfo`, som MÅSTE begäras, och till
`plainDescription`, som saknas tyst utan `PLAIN_DESCRIPTION` (#425). Tre fält,
tre olika regler — därför mätta i stället för antagna.

## Publiceringen rörde INTE `variantsInfo`, och det var ett val

Runbokens regel är att den avslutande PATCH:en måste bära `visible: true` på
**både** produkt och variant, eftersom produktens `visible:false` speglas ned.
Här var varianterna redan `visible: true` — Steg 8 satte dem så.

☠️ **Att ändå skicka `variantsInfo` hade raderat variantens media (#501)** utan
att vinna någonting. Skrivningen läser därför variantens tillstånd först och
skickar `variantsInfo` bara om någon variant faktiskt är osynlig. Listan
`behoverVariant` var tom på alla elva.

Kvittot räknar bilderna efteråt just för att bevisa att galleriet överlevde.
