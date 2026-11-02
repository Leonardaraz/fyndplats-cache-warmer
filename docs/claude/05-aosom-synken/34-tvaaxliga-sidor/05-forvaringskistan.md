#### Förvaringskistan: samma recept utan kort (`farg-forst.js`, 2026-10-23)

Leonards andra ja (2026-10-23, strax före 00:50 UTC) gällde förvaringskistan `b129d5ae`. Den har två färger (Mörk Khaki och Vit) × två storlekar (M och L), färgfotona länkade till färgen och ett måttkort per
storlek (`531e6d` för M och `2a5942` för L) länkat till storleken. Vyerna var rena, men optionerna och varje variants val stod Storlek före Färg, så Wix räknade variantens bild ur storlekens första länkade
bild: varukorgens, kassans och orderns bild var storlekens måttkort på alla fyra varianter. Galleriet, länkarna och korten behövde inte röras, bara ordningen.

`farg-forst.js` (byggt av `bygg-farg-forst.py` ur `farg-forst-plan.json`, planens FNV-summa räknas om i skriptet) är den avskalade delen av `skriv-storlekskort.js`: steg A lägger Färg före Storlek i optionerna
(id-skrivning med `options`, `variantsInfo` ordagrant ur GET:en och `visible`), steg B skriver varianterna om med valen bara med namn och Färg först (`products-with-inventory`, så att Wix räknar om variantens
bild) och steg C läser tillbaka allt: galleri och alt-texter, optionernas ordning, varje vals länkar, varianternas id, SKU, pris, kostnad, synlighet och namn, produktens namn, adress och synlighet och lagret.
Varje variants bild ska vara färgens första länkade foto och valen ska stå Färg först. `TORR` skriver ingenting och visar variantbilderna före och efter samt butikens vy per kombination.

Tre egenskaper som inte ska tas bort:

1. ☠️ **En färg utan länkade bilder avvisas.** Då finns ingen första bild att räkna fram, och Wix hade valt storlekens kort eller huvudbilden.
2. ☠️ **Varje steg hoppas över när det redan är gjort.** Steg A när optionerna redan står Färg först, steg B när varje variants bild redan är färgens första foto, så en omkörning efter ett fall halvvägs
   gör bara resten.
3. ☠️ **Ingenting utom ordningen ändras, och återläsningen jämför allt.** Galleriet, alla länkar, varianternas id, SKU, pris, kostnad, synlighet och lager ska vara oförändrade, och skriptet stoppar vid första avvikelse.

Torrkörningen 00:56 UTC visade variantbilderna före och efter och en vy per kombination (samma som butiken sedan visade). **Skrivet 00:56:55 UTC:** `ok: true`, 0 avvikelser, revision 9 → 11, optionerna
`Färg > Storlek`, variantbilderna Mörk Khaki → `b5e78a` och Vit → `6bfbb0` i båda storlekarna, och galleri, länkar, priser, SKU, synlighet och lager orörda. **Live 01:0x UTC** (butikens cache renderad 01:00:52,
efter skrivningen): sidans `variantTable` ger Mörk Khaki → `b5e78a` och Vit → `6bfbb0` för M och L (förut storlekens kort), `variantAxes` står Färg före Storlek, och vyerna är Mörk Khaki × M
`b5e78a,42c0b0,68cd08,531e6d` (1 459 kr), Mörk Khaki × L `b5e78a,42c0b0,68cd08,2a5942` (1 559 kr), Vit × M `6bfbb0,4b7331,531e6d` (1 459 kr) och Vit × L `6bfbb0,4b7331,2a5942` (1 559 kr). Varje färg visar
sina egna foton och varje storlek sitt kort, och priserna är oförändrade. ⚠️ **Vit visar tre bilder i båda storlekarna**, under minimimåttet på fyra. Det var så före skrivningen också. Sidan finns inte i
`aosom-ordning.tsv`, så ingen färgbildsomgång har tagit den, och fler bilder till Vit är ett eget beslut.
