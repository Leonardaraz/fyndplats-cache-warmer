### Färger utan egna bilder på en AliExpress-sida (2026-10-21)

Leonards rapport 2026-10-21: sex sidor hade fortfarande en färg utan egna bilder
(hamsterburen, tältet, tunnelväxthuset, skoskåpet, dieselvärmaren och plåtboden).
Tre av dem hade stått flaggade i runbooken sedan 27 september. Fotot letas upp med
workflowen **"AliExpress — färgbilder per SKU (krypterat)"** (`ae-skubilder.yml`), som
anropar den gamla read-only-rutten `/api/admin/freight-check?raw=1` och svarar
krypterat, som `leverantorslankar.yml`. Den startas av en push som ändrar
`tools/ae-skubilder/kor.json` (`produkter`: högst tio Wix-id, `kuvert`: en publik
RSA-nyckel i base64), och sedan mergen av PR #749 (2026-10-21) också med `workflow_dispatch` från `main`.

Tre egenskaper som inte ska tas bort:

1. ☠️ **Kuvertet är obligatoriskt och loggen bär bara räknare.** Svaret bär
   leverantörens bildadresser, och en bildsökning på dem leder till listningen.
   jq plockar bara ut bilder, egenskapsnamn och -värden, SKU-id, SKU-attribut och
   saldo, aldrig priser, säljare eller fraktuppgifter. Ett fel skrivs som
   statuskod, aldrig som kropp.
2. ☠️ **Hela råsvaret går till en fil och läses bara av jq.** Det passerar aldrig
   en variabel som något kan råka skriva ut, och faller krypteringen faller jobbet
   utan klartext.
3. **Mätt 2026-10-21: bara tältet hade en SKU-bild per färg.** De andra fyra
   listningarna bär färgen som ett egenskapsvärde utan foto, sex galleribilder och
   8–18 beskrivningsbilder, och ingen visar den saknade färgen. Vad man gör med en
   färg utan foto på en publicerad sida står i runbookens avsnitt *Varje färg har
   sin egen bild*: ta bort färgen med bevarat id, inte koppla en annan färgs bild.
