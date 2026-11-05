# fargtillagg-25 — eltraktorn `91d28d6f`, Svart (2026-11-04)

Leonard: *"Svarta eltraktorn: hämta de andra rena bilderna och koppla dem"*.

## Vad Svart visade

Svart (`f4f0198e`) hade en länkad bild, packshoten (galleriets plats 17). Resten av
leverantörens bilder för den svarta artikeln ströks vid poleringen: position 2 är en
varningsetikett med en sko i bild, position 3 bär inbränd tysk text och position 8 är ett
amatörfoto ur ett lager. Position 10 finns inte. Feeden har åtta bilder.

## Vad som gjordes

1. **Position 4–7 hämtades** (`aosom-fargtillagg`, `kandidater`, skarp, 4 uppladdade, noll
   missar) och granskades med ögat i full upplösning (`granskning.tsv`). Filerna parades med
   bilderna på md5.
   - 4: släpets lastyta i solljus på en gångväg. Ren, vald.
   - 5: instrumentpanelen med USB-uttag, knappar, strömbrytare och reglage. Den flerspråkiga
     etiketten sitter fysiskt på varan, ingen leverantörslogotyp. Vald.
   - 6: närbild på typetiketten med leverantörens logotyp. Struken.
   - 7: amatörfoto ovanifrån på ett lagergolv med en annan vara i bildkanten. Struket.
2. **Skrivningen.** `plan` → `skriv` (planens sha `7af62bfc…`, 16:30 UTC, utanför
   synkfönstret): galleri 22 → 24, två länkar till Svart, återläst, variantbilderna rättade,
   kopplingen sparad.

## Återläst i Wix

- Galleriet 24 bilder. De nya ligger på plats 18 och 19, direkt efter Svarts packshot och före
  den rosa färgens bilder.
- Svart: tre länkade bilder. Blå sex, Grön fem, Röd fem och Rosa fem är oförändrade.
- Priserna (2 419, 2 299, 2 269, 2 599 och 2 599 kr), synligheten och saldona är oförändrade.

## Live

Mätt 16:36 UTC med `tools/polish-gates/live-bilder.mjs`, en färg i taget, efter att butikens
cache räknats om (mätt 16:33 var den gamla vyn kvar): Svart visar tre bilder, de andra färgerna
är oförändrade och sidan har 24 unika bilder.
