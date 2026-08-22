# Trådlöst hemlarm PGST — ombyggnad 2026-08-19

Produkt `5352bb04-ae5e-4452-8d3f-3bb4b120d530`,
slug `tradlost-hemlarm-pgst-smart-larmsystem-wifi-4g`.

## Vad som var fel

- Hjältebilden var en beskuren 990×818-variant där kittet låg utanför kanten.
- Varianterna hette `A-4G` … `F-4G`. Bokstäverna säger ingenting om vad som ingår,
  och fyra av sex hade **0 i lager**. Leonard godkände att de togs bort.
- Beskrivningen sålde in "modellerna A–F" på tre ställen — texten hade överlevt
  varianterna den beskrev.

## Vad som gjordes

| | Före | Efter |
|---|---|---|
| Axel | `Modell` | `Paket` |
| Val | A-4G … F-4G (6 st) | `3 rörelse- + 6 dörrsensorer`, `4 rörelse- + 8 dörrsensorer` |
| Galleri | 9 bilder, 4 av dem utgångna paket | 7 bilder |
| Hjälte | `be433c…` 990×818, beskuren | `8cda9c20…` 1600², vit botten, hela kittet |

Innehållet lästes av ur leverantörens egna paketfoton, ett per variant:

- **3 + 6** (SKU `…-d-4g`, 9 i lager): 1 centralenhet, 1 siren, 1 SOS-knapp,
  3 rörelsesensorer, 6 dörrsensorer, 2 RFID-brickor, 2 fjärrkontroller.
- **4 + 8** (SKU `…-e-4g`, 56 i lager): samma bas, men 4 rörelsesensorer,
  8 dörrsensorer, 3 RFID-brickor, 3 fjärrkontroller.

Två Fyndplats-kort byggdes, ett per paket, och kopplades som `linkedMedia` på
respektive val — kunden ser en uppräkning av exakt vad som ingår när hen väljer.

## Fällan som slog till (igen)

Omdöpningen gav **båda** varianterna nya id, eftersom `choice.key` speglar `name`.
Lagerposterna följde inte med: produkten stod live med `inventoryItems: []`, alltså
slutsåld för kunden, tills de återskapades med
`POST /stores/v3/bulk/inventory-items/create` (9 resp 56) och
`FyndplatsMappings.variants[].wixVariantId` + `.choices` pekades om.

Mappningens fyra rader för A/B/C/F lämnades orörda. Deras varianter finns inte
längre, men raderna bär leverantörskoppling och shippability-historik, och en död
`wixVariantId` gör ingen skada.

## Att ta ställning till

**Båda paketen kostar 1 929 kr** trots att 4+8 innehåller mer av allt — en
rörelsevakt, två dörrsensorer, en RFID-bricka och en fjärrkontroll extra. Det finns
inget skäl för en kund att välja det mindre. Inköpet är detsamma (1 464,15 kr landat,
24,1 % marginal), så prislappen följer leverantören. Antingen sänks 3+6 eller så tas
det bort helt.
