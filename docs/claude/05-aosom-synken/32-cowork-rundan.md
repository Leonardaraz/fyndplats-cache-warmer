### Cowork-rundan: bilder ur aosom.de:s galleri, plats 11 och uppåt (2026-10-22)

Leonard 2026-10-22 (efter att aosom.de visat 13 bilder där feeden har tio, lärdom 162): Claude Cowork-chatten surfar i hans Chrome och listar varje sidas
galleribilder, och jag laddar ner, granskar, laddar upp och kopplar dem. *"Och sen koppla dom som du gör, går det?"* (18:03 UTC) är beslutet att jag skriver de rena.
Två uppdragsfiler har skickats till honom. ☠️ **Båda bär Aosoms artikelnummer i länkarna** och ligger bara i scratchpad: de går bara till Leonard, aldrig
till repot eller en publik logg. Svaret från chatten (bildadresser på `img.aosomcdn.com`) bär inget artikelnummer.

| fil | rader | innehåll | skickad |
| :-- | :-- | :-- | :-- |
| 1, färger | 1–256 | 151 Aosom-sidor med färgvyer på fyra bilder eller färre: rad 1–54 tre eller färre, sedan 200 på exakt fyra, hamsterburen `13fe619f` sist | 18:21 UTC |
| 2, storlekar | 301–399 | 99 storlekar på 67 Aosom-sidor: 301–330 tre eller färre, 331–399 exakt fyra (svaret heter `val_pa_sidan`) | 19:25 UTC |

Uppdraget byggs ur `katalogkontroll-farg-antal.js` respektive `katalogkontroll-val-antal.js` (vilka vyer som är svaga) och `leverantorslankar.yml` (krypterat, ny
engångsnyckel per körning, `varianter[].val` ger länk per färg eller storlek). Chatten ändrar ingenting: den öppnar länken, läser galleriets räknare och adresser
(den stora versionen) och svarar med JSON, högst femton rader per block.

**Provomgången, rad 1–5 (svar 19:3x UTC).** Rätt färg på 5 av 5, 65 bilder i full storlek (1 600–2 000 px, noll byte-lika), och chatten lade själv bort Aosoms
infobanner och en dubblett. ☠️ **Därför är `antal` 1–2 högre än antalet adresser**, och förklaringen står i `anmarkning`: det är rätt, inget fel. Granskat mot
sidornas egna bilder (färgmedveten dHash, högst 12 = samma foto), OCR och kontaktark:

1. ☠️ **Galleriets första tio bilder är feedens, och de är redan körda.** På alla fem rader låg plats 1 och 2 (på flera också plats 10 eller 11) redan på sidan med
   avstånd 0. De rena nya bilderna ligger på **plats 11 och uppåt**, efter feedens tak.
2. **13 av 65 bilder (20 %) höll, på tre av fem vyer:** hundkärran Svart och Vit (`571e37bf`, 22 bilder) fick åtta rena detaljfoton på plats 15–22, hundkärran Gul
   (`1004b036`) fyra produktfoton på plats 11–14, och bänkdynan Mörkgrå (`a7aa9370`) dynans produktfoto på vit botten (plats 11, som den färgen saknade). Resten på
   de två kärrorna är tyska och engelska säljgrafiker (plats 3–9 och 11–14 på Svart och Vit). Bänkdynorna Ljusgrå och Mörkgrå (`c519b4fe`) gav inget nytt rent:
   de rena bilderna fanns redan, och resten är säljgrafiker eller foton med *Nur Kissen* eller *Cushions Only* över bilden (tre möjliga utsnitt, ingen gjord).
3. Skrivet 19:50–19:52 UTC: Svart och Vit 3 → 11, Gul 3 → 7, Mörkgrå 3 → 4. Återläst utan avvikelser, `variantbild.yml` 3 av 3 rättade, live 19:56 UTC rätt antal
   och de nya bilderna syns bara under sin egen färg.

Så tas ett svar emot, med verktyg i `tools/polish-gates/` (privata data i scratchpad, aldrig repot):

- `cowork-granska.py <svar> --rader <rader.json> --ut <katalog> --hamta --live <dir> --ocr <python>`: formkontroll mot raderna (antal mot adresser, värd, dubbletter,
  färgen sidan sa mot raden), nedladdning från den öppna bildservern (byte, pixlar, miniatyrer, byte-lika), jämförelse mot ALLA bilder på sidan (`live-bilder.mjs` eller
  `live-farg-vy.mjs` ger `<id8>.json`, `live-par.sh` gör många sidor) med NY eller FINNS, OCR (REN, SIFFROR, TEXT) och kontaktark. Den skriver aldrig länkar.
- `cowork-ladda.py urls|para|kod`: `urls` ger adresserna i omgångar om 25 för `UploadImageToWixSite`, `para` hämtar varje uppladdad fil från Wix CDN och paras med sin
  kandidat på md5, `kod` bygger ExecuteWixAPI-koden ur `skriv-fargbilder.js` (en fil per körning) ur `picks.json` (`{ "<rad>": [{ "k": plats, "alt": text }] }`).
- `skriv-fargbilder.js` (uppdaterad): READY-kontroll av varje fil, `axel` för andra optioner än Färg, sidor fyra i taget, och andra optioners länkar jämförs vid återläsning.
- Sedan `variantbild.yml` (skarp, `ids`), live per vy efter butikens cache, och dokumentera.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Uppladdningens svar ekar ingen käll-adress.** Ordningen är ingen bevisning: `cowork-ladda.py para` stoppar om en fil saknas eller saknar md5-träff.
2. ☠️ **En fil som inte är READY hamnar aldrig i ett galleri.** UploadImageToWixSite svarar PENDING, och `skriv-fargbilder.js` vägrar tills Media Manager säger READY.
3. ☠️ **Bara granskade bilder skrivs.** TEXT (tysk eller engelsk säljgrafik, logotyp som motiv) stryks, text på varan eller rekvisitan stryks inte (runbooken), och ett
   foto vars färg inte är sidans stryks. `picks.json` är det som är valt efter att ha tittat på kontaktarken, aldrig en lista som OCR gett.
4. **En plan per sida.** Flera rader på samma sida samlas i en skrivning, annars krockar revisionerna.

✅ `axel: "Storlek"` i `skriv-fargbilder.js` är provad torrt på tre riktiga sidor (2026-10-22 ca 20:42 UTC, `TORR = "fake"`, påhittade fil-id, ingenting skrivet), men
ännu inte skriven på någon. På en sida med ett enda val som inte är färg gäller butikens regel ovan: en länkad bild visas bara för det första val som länkar den, så en
ny storleksbild länkas till sin storlek och syns bara där, och en olänkad bild (`"gemensam": true` i picks.json) visas för alla storlekar. **Vymodellen stämmer: 151 av 151
val på de 67 sidorna i fil 2** (live-mätt med `live-par.sh` mot `vyerAv` i skriptet; alla 67 har en enda option och alla 151 val har minst en egen länkad bild).

Tre egenskaper som inte ska tas bort:

1. ☠️ **`TORR` (true, eller "fake" för påhittade fil-id) skriver ingenting** och returnerar planen och butikens vy före och efter per val. Kör `cowork-ladda.py kod --torr`
   (hasMutations false) före varje skarp skrivning av storlekar och läs att målet växer och att inget annat val minskar. En gemensam bild lyfter alla storlekar, en länkad bara sin egen.
2. ☠️ **Ett val utan egen länkad bild får inget tillägg** (planen vägrar: *har ingen bild att placera efter*). En första länk hade fått valet att visa bara den bilden och de
   gemensamma i stället för hela galleriet, alltså färre bilder än förut.
3. ⚠️ **Live-mätningens etiketter är butikens, planens är Wix.** Projektorduken `422ab1bd` heter 92 och 85 tum i Wix men visas som 234 och 216 cm i butiken. Skriptet
   matchar valet på Wix namn, och den privata live-filen får döpas om till dem (`cowork-granska.py` matchar etiketten och säger till när den inte hittar valet).

**Omgång 2, rad 6–54 (fyra block, bifogade som filer).** Chatten svarade på 49 rader. Rad 45 och 46 gav *färgen saknas* (färgväljaren på aosom.de hade inte
färgen, så `a57587a8` Rosa och `9304f8b8` Brun står kvar utan tillägg). De andra 47 raderna gav 551 bilder i full storlek, och infobannern var redan bortlagd (`antal` är
1–2 högre än antalet adresser, som förut). Granskat som provomgången (`cowork-granska.py`, OCR, kontaktark och mina egna ögon på varje ark):

| | bilder |
| :-- | --: |
| kandidater på 47 rader | 551 |
| redan i vyn (avstånd högst 12) | 136 |
| lika en bild i en annan färgs vy (samma pose i en annan färg, alltså ny för den här om ögat inte ser en nästan-dubblett i vyn) | 10 (fem valda, fem strukna) |
| nya | 405 |
| **valda och skrivna** | **72** på 44 rader (28 sidor) |

☠️ **Positionen avgör igen.** Plats 11 och 12 gav 50 av 67 kandidater (35 av 42 respektive 15 av 25), medan plats 1–10 bara gav 19 av 470 (13 av dem på plats 2, 3 och 9:
bilder som varken importen eller poleringen lagt på sidan) och plats 13 och uppåt 3 av 14. Allt på plats 4–8 är som förut tyska och engelska säljgrafiker. Tre rader gav
ingenting: `0926604b` Röd (allt rent låg redan i vyn), `91f5c078` Mörkgrå · 205 cm (k1 och k10 fanns, resten bär *Nur Schaukelabdeckung* eller tysk text) och `c131b430` Grå
(måttbilden fälldes i omgång 7, och k10 är en nästan-dubblett).

Nio saker som gäller nästa block:

1. ☠️ **Parallella uppladdningar får HTTP 429 av Aosoms bildserver.** Tre `UploadImageToWixSite`-anrop med 25, 25 och 21 adresser samtidigt gav elva `success: false` i det
   sista (*Failed to import image from URL (HTTP 429)*, en post per adress). De elva i ett eget anrop direkt efteråt gick igenom. Läs `success` på varje post, ladda upp ett
   anrop i taget och lägg bara om de adresser som föll. `cowork-ladda.py para` stoppar på en saknad fil, så ingenting skrivs utan att märkas.
2. ☠️ **Aosoms färgfält kan vara fel, och bilderna avgör.** Chatten flaggade rad 26 (frukostsetet `bc2368af`: sidan sa Beige, men titeln, artikelnumrets färgkod och alla bilder
   var det grå setet), rad 40 (hundbädden `01ac2f63`: fältet sa Svart, Vit, Brun, bilderna är den gråa) och rad 43 (Cremeweiß är bara ett annat ord för Krämvit). På rad 26 är det
   bildernas avstånd mot vår gråa vy som bevisar färgen (k1, k2 och k10 låg där med avstånd 0). Stryk aldrig en rad på färgfältet ensamt.
3. ☠️ **`FINNS?` mot en annan färgs vy är samma pose i en annan färg, alltså en ny bild för den här.** dHash är gråskala. Regnscenen på hundvagnen `d27a28ae` låg i Grås vy
   med grå vagn, och chattens bild var samma scen med blå vagn: den är Blås egen och valdes. Tvärtom stryks en bild som är samma färg och nästan samma pose som en bild i vyn
   (nio gånger: hundgrindarnas smala och breda uppställning på `5fa26137` och `6eb13a16`, samma packshot med och utan massagepunkter på kontorsstolen `6e810d9c` (tre färger),
   fotstödet i ett något annat läge på `4439afff` och `db13253d`, och trehjulingen `a76e97f1` med och utan minicykeln i hörnet). Avståndet avgör inte (de låg över gränsen 12), ögat gör det.
   ☠️ **Jag läste själv fel på etiketten en gång.** Cykelkärrans `1004b036` Svart k12 stod som `FINNS g=… (annan vy/gemensam)` och hoppades över som om den redan låg i
   vyn, men var ett nytt, rent packshot av den svarta och gråa kärran mot vit botten. Den hittades när jag gick igenom alla tio kandidater med den etiketten (en bild i taget mot
   färgens egen vy), laddades upp och skrevs 22:50 UTC (galleri 19 → 20, Svart 4 → 5, 0 avvikelser, `variantbild.yml` rättade 1 av 1, live ALLT OK 22:54). Det var den enda missen
   av de tio. `(i vyn)` betyder *i den här färgens vy*. `(annan vy/gemensam)` betyder att närmaste träff inte är det, och då ska ögat jämföra med färgens egen vy innan bilden
   hoppas över. `granskning.tsv` skiljer därför `finns i vyn` (136) från `liknar annan färgs vy` (10).
4. ☠️ **Måttbilder och tillbehör kontrolleras mot sidtexten innan de skrivs** (`kolla-tal-mot-text.js`, ren läsning). Gamingfåtöljens `6575766f` alla tal står i texten (maxbelastning 120 kg),
   och kontorsstolens `6e810d9c` Grå och Ljusbruna anger fler mått än texten (höjd 107–116 cm) men inget som säger emot. **Krämvit anger sitthöjd 45–55 cm mot sidans 46–56 och stryks.**
   Hundbädden `01ac2f63` har ett foto på en bärväska, men texten nämner ingen väska (noll träffar på väska, påse och ryggsäck), så bilden lovar mer än sidan säljer och stryks.
5. **Säsongsmotiv stryks som höstpumporna:** studsmattans julgran och present i bakgrunden (`39319e6c`, plats 10) kom inte med.
6. ⚠️ **Ett gränsfall är taget med och flaggat:** cykelkärran `1004b036` Svart fick två nya foton, kvinnan på elcykeln vid sjön och ett packshot (punkt 3). I det första säger en skylt *Radweg* och
   *Gemeinsam mehr erleben* (tysk text på en rekvisita, ungefär 3 % av bilden). Autostrykningen på textyta hade tagit bort den. Jag tog med den eftersom den är en skylt i ett foto och
   runbooken släpper text på rekvisita, men Leonard avgör (se FLAGGADE, öppna frågor). Märken som sitter tryckta på varan (*Vinsetto*, *PawHut*, *Outsunny*) stryks inte, men en
   bild där loggan är motivet gör det (närbilderna på nackkudden hos gamingfåtöljen `6575766f` och på lumbarkudden hos gamingstolen `4439afff`).
7. **Tvåaxliga sidor skrivs med färglänken ensam** (`91f5c078`, `6eb13a16`, `01ac2f63`, `8bc0dd26`). Hammocköverdragets nya bilder (rad 31, 177 cm) är miljöfoton utan tal, och
   177 cm-artikelns packshots lades inte till eftersom vyn redan har 205 cm-artikelns.
8. **Samma pose i två färgers svar är normalt** (frukostsetet, gamingfåtöljen, trampolinen, elbilarna). Varje fil länkas till sin egen färg (`skriv-fargbilder.js`), och
   dubblettkontrollen (`live-dubbletter.py`) jämför bara inom en färgvy.
9. ☠️ **Skyddskollens standardkörning kraschade på det nya katalognamnet.** `bygg-skyddskoll.py` sorterade `tillagg.json` på `fargtillagg-<siffror>` och föll på
   `fargtillagg-cowork-1` (`AttributeError`), vilket hade fällt den schemalagda kollen 2026-10-24 utan att något sagt det i förväg. Den hittades när jag körde
   standardanropet för att se att de nya filerna kom med. Sorteringen känner nu `fargtillagg-<N>` och `fargtillagg-cowork-<N>`, och ett okänt katalognamn avbryter
   i stället för att hoppas över (en hoppad plan lämnar filer utan skyddskoll). Standardkörningen ger 426 sidor och 1 101 filer i fyra anrop. Kör standardanropet
   efter varje ny katalog i `tools/polish-assets/`.

**Skrivet 22:33–22:36 UTC** (efter Aosoms prisfönster 21:12–21:29, före lagerfönstret 00:12): `skriv-fargbilder.js`, åtta sidor per körning i fyra körningar, 28 av 28 sidor
återlästa utan avvikelse (galleri, länkar, variant-id, SKU, pris, synlighet, andra optioners länkar), revision +2 per sida. `variantbild.yml` (skarp, `ids`, 22:37 UTC): **28 kontrollerade,
28 rättade**, 0 avvikelser (varukorgens bild per färg var fel på alla 28, som efter varje skrivning som rör galleriet). **Live 22:39–22:41 UTC** (`live-par.sh`, `kolla-live-farg.py`): **ALLT OK på 28 av 28 sidor**, varje tillagd fil syns i sin egen färgs vy och i ingen annans. De 44 färgvyerna gick från 130 till 202 bilder (tre på två, 40 på tre och en på fyra före; efteråt två på tre, 25 på fyra, 13 på fem, en på sex, två på åtta och en på nio), så 42 av 44 når fyra eller fler. Den 72:a bilden (kärran `1004b036` Svart, se punkt 3) skrevs 22:50 UTC, `variantbild.yml` rättade 1 av 1, och live 22:54 visade fem bilder i Svarts vy utan dubblett; mätningen 22:39–22:41 gjordes före den. De som står kvar på tre är växthusduken `a706542f` Vit och stolsdynorna `e76a4098` Ljusgrå, där chattens svar bara hade en ren ny bild. `live-dubbletter.py` fann ingen dubblett i en vy vi rört (ett par *likt men olika* i Svart på kontorsstolen `db13253d`, som vi inte rörde). ⚠️ **Butikens cache hade fyra av 28 sidor på gamla vyer fyra minuter efter skrivningen** (de som skrevs sist, 22:36): `kolla-live-farg.py` sa *saknas* på de fyra, och en omätning ett par minuter senare var rätt. Mät om bara de sidor som saknar filer innan du kallar dem trasiga.

**OCR över alla färgvyer** (`ocr-live.py`, 22:43–22:51 UTC, 367 unika bilder i de 44 vyerna, bara läsning, körd före den 72:a bilden): 171 REN, 38 SIFFROR och 158 TEXT. Jag tittade på
de 22 träffar som kunde vara främmande text, på kontaktark. **Ingen tysk eller engelsk säljgrafik ligger på någon av de 44 vyerna.** Träffarna är märken och dekaler tryckta på varan
(*HOMCOM*, *Outsunny*, *Vinsetto*, *PawHut*, *DEFENDER*, *DISCOVERY LAND ROVER*, *RS e-tron GT*, *TRICYCLE*, *Kart TOP DRIVER*), knappar och display på apparater (*CANCEL/DEFROST*,
*HIGH SPEED/LOW SPEED*, *Intensity* på en fjärrkontroll), text på rekvisita (bokryggar, en affisch med *Street Food*, figurinaskar, ett bildspel på en projektorduk) och våra egna
svenska kort (studsmattan `39319e6c`, elbilen `2f6ff71c`). Det enda engelska som sitter som en etikett är papperslappen på den hopvikta växthusduken hos `faa2bdb4` Vit och Grön
(*REPLACEMENT WALK-IN GREENHOUSE HEAVY DUTY COVER*), men den sitter på varan i fotot och låg på sidan före omgången. Den tyska skylten i kärrans foto (`1004b036`) är den enda
tyska text den här omgången själv lagt till (punkt 6).

**Omgång 3, rad 55–159 (2026-10-23).** Leonard klistrade in chattens svar för 105 rader (färgfilens rad 55–159) och jag tog emot det som omgång 2: `cowork-granska.py` (formkontroll, nedladdning ur den öppna bildservern, jämförelse mot ALLA bilder i vyn, OCR och kontaktark), granskning med ögonen rad för rad, `cowork-ladda.py` (uppladdning, md5-parning, skrivkod), `variantbild.yml`, live och skyddskoll. Svaret bär inget artikelnummer. Underlaget och besluten per bild ligger i `tools/polish-assets/fargtillagg-cowork-3/` (`tillagg.json` med fil-id, färg och alt-text per skriven bild, och `granskning.tsv` med beslut och skäl för alla 1 234 kandidater).

| | bilder |
| :-- | --: |
| kandidater på 105 rader | 1 234 |
| redan i vyn (avstånd högst 12) | 405 |
| liknar en bild i en annan färgs vy eller en gemensam bild | 26 (11 valda) |
| nya | 791 (678 med tysk eller engelsk text i bilden) |
| inte jämförda (rad 137, se punkt 4) | 12 |
| **valda och skrivna** | **123** på 78 rader, alltså 50 sidor |

☠️ **Positionen avgör igen.** Plats 11 och uppåt gav 104 av 188 kandidater (55 %), plats 1–10 bara 19 av 1 046 (2 %): sex på plats 2 (miljöbilder som varken importen eller poleringen lagt dit), åtta på plats 10 och fem på plats 6–9. Plats 11 gav 62 av 98 och plats 12 gav 32 av 56. 26 rader gav ingenting (det som var rent låg redan i vyn, eller så var bilderna säljgrafik eller lagerfoton) och rad 137 väntar.

Fem saker att ta med:

1. ☠️ **Parallella uppladdningar får HTTP 429 av Aosoms bildserver, igen.** Tre anrop om 25 adresser i rad gav 15 `success: false` i det tredje. De 15 gick igenom i ett eget anrop, och de sista 48 laddades i fyra anrop om 11–13 adresser: noll fel. Uppladdningens svar ekar ingen adress, så varje fil hämtades hem från Wix CDN och paras med sin kandidat på md5: 123 av 123 (`cowork-ladda.py para`).
2. **Aosoms färgfält sa något annat än raden på sex rader** (Khaki för Beige på rad 59 och 150, Hellblau för Turkos på rad 86, Cremeweiß för Beige på rad 118, en lista med grönt, beige och vitt för Svart och Röd på rad 68, och Gelb för Natur på rad 156). Bilderna avgjorde, aldrig fältet (lärdom 166). Tre av raderna (86, 118 och 150) fick bilder.
3. ☠️ **`FINNS?` och `liknar annan färgs vy` räcker inte för att kalla en bild ny eller gammal.** Av de 26 kandidater som `dHash` klassade så valdes 11: samma pose i en annan färg är en ny bild för den här färgen. Fyra av de 127 förvalda föll när de lades bredvid vyn i full storlek med `tools/polish-gates/cowork-jfr.py` (samma bild i en annan beskärning, eller en scen som färgen redan visade). Lägg alltid kandidaten bredvid färgens egna bilder innan den skrivs.
4. **De två tvåaxliga sidorna.** Rad 137 (`c3d1fa41`, hundbädden) väntade: butikens regel ändrades när PR #770 mergades, och sidan länkades om i natt, så de 12 kandidaterna jämfördes inte mot någon vy (de togs i omgång 4, punkt 5). Rad 144 (`6eb13a16`, hundgrinden) skrevs med färglänken ensam, som i omgång 2 (punkt 7).
5. **OCR sa TEXT på 47 av de 123 valda bilderna (69 REN och 7 SIFFROR), och ingen av dem är säljgrafik.** Texten sitter på varan eller rekvisitan (märken på en bilfront, en bokrygg, en etikett på en förpackning). Lagerfoton (amatörfoton på kartong eller golv), leverantörens logga som motiv och bilder med en tysk eller engelsk rubrik ströks som förut. Skälet per bild står i `granskning.tsv`.

**Skrivet 15:29–15:36 UTC** (efter Aosoms priskörning 15:12–15:29, före lagerfönstret 18:12): `skriv-fargbilder.js`, åtta sidor per körning i sju körningar, **50 av 50 sidor återlästa utan avvikelse** (galleri, länkar, variant-id, SKU, pris, synlighet, andra optioners länkar), revision +2 per sida. Torrkörningen av första filen (8 sidor) gick först och ändrade ingenting. `variantbild.yml` (skarp, `ids`, run 39979846820, 15:37 UTC): **50 kontrollerade, 50 rättade**, 0 avvikelser. **Skyddskollen** (`bygg-skyddskoll.py` med enbart rundans `tillagg.json`): 50 sidor och 123 filer, 123 i galleriet, 123 sedda av städningens egen tolkning och 123 kvar i Media Manager (`OK`, `READY`), alla med källklassen `leverantor` (de skyddas av att de sitter på produkten). Största galleriet blev 47 bilder (cykelkärran `571e37bf`, 33 till 47; Wix tar 50).

**Live 15:45–15:48 UTC** (`live-par.sh` med `TVAAX=6eb13a16`, `kolla-live-farg.py`, 9–17 minuter efter skrivningarna, så butikens cache hade hunnit ikapp): **ALLT OK på 50 av 50 sidor**, varje tillagd fil syns i sin egen färgs vy och i ingen annans. De 78 rörda färgvyerna stod alla på fyra bilder före och gick från 312 till 435 bilder: 47 visar nu fem, 21 sex, 6 sju och 4 åtta, och ingen orörd vy ändrades (jämförelse mot mätningen före skrivningen). Sju färgvyer på de 50 sidorna står kvar på fyra bilder, alla färger som ingen kandidat klarade (`1004b036` Röd, `e25e86d6` Rosa, `2f6ff71c` Orange, `7511fc56` Vit, `7cdc167c` Lila, `2d65601c` Röd och `40f46441` Grön). Alt-texterna i sidornas egen data (`imageAlts`, `tools/polish-gates/kolla-alt.py`) är lika med facit i `tillagg.json` på 123 av 123, och det bevisar också att varje fil-id och varje alt-text kom fram oförvanskad genom avskriften till `ExecuteWixAPI`, som är det enda steg där en bokstav kan gå förlorad. `live-dubbletter.py` över alla färgvyer på de 50 sidorna: 50 sidor, 0 par (inget foto ligger två gånger i en vy, inte ens ett par med dHash-avstånd under elva). `ocr-live.py` över alla 779 unika bilder i de 50 sidornas färgvyer (16:08 UTC, 17 minuter, bara läsning, körd efter skrivningen som i omgång 2): 391 REN, 86 SIFFROR och 302 TEXT. De 123 skrivna gav 69 REN, 7 SIFFROR och 47 TEXT, alltså samma tal som kandidatkontrollen. Av de 656 bilder som låg ute före omgången har 255 text, och 23 av dem har en textyta över 1,5 %: tio är våra egna svenska kort (där OCR tappar å, ä och ö), nio är etiketter och dekaler på varorna (pappersetiketten på de hopvikta växthusdukarna `a55a2ce7` och `7beb7f2b`, *UTV-MX* på fyra leksaksfordon och registreringsskylten på en leksaksbil, `e25e86d6`), tre är text i miljöbilder (en måttangivelse, en bokhylla och en tavla med ett citat) och en är Vinsetto-broderiet på en ländkudde i en närbild av sits och armstöd (`39a21e71`, `5ccfdd7b`, från runda B88). Den sista är det enda gränsfallet och står kvar: loggan sitter på kudden, men motivet är sitsen och armstödet, till skillnad från närbilderna där loggan fyller bilden och som ströks i omgång 2. De 232 träffarna under 1,5 % lästes som lista (märken och dekaler på varorna, knappar på apparater, bokryggar och den tyska skylten i fotot på cykelkärran `1004b036`, som redan väntar på Leonard), och 34 av dem som kunde vara något annat lades på kontaktark. **Ingen tysk eller engelsk säljgrafik ligger på någon av de 50 sidornas färgvyer.**

**Omgång 4, rad 137 och 160–256 (2026-10-24).** Leonard klistrade in chattens svar för 98 rader (färgfilens rad 160–256 och rad 137, hundbädden `c3d1fa41`, som väntat på butiksändringen), och jag tog emot det som omgång 3. Svaret bär inget artikelnummer. Underlaget och besluten per bild ligger i `tools/polish-assets/fargtillagg-cowork-4/` (`tillagg.json` med fil-id, färg och alt-text per skriven bild, och `granskning.tsv` med beslut och skäl för alla 1 127 kandidater).

| | bilder |
| :-- | --: |
| kandidater på 98 rader | 1 127 |
| redan i vyn | 386 |
| liknar en bild i en annan färgs vy eller en gemensam bild | 15 |
| nya | 714 (527 strukna för tysk eller engelsk text i bilden) |
| inte jämförda (rad 137, tvåaxlig sida, se punkt 5) | 12 |
| **valda och skrivna** | **69** på 46 rader, alltså 37 sidor |

☠️ **Positionen avgör igen, men mindre än i omgång 3.** Plats 11 och uppåt gav 46 av 150 kandidater (31 %), plats 1–10 bara 23 av 977 (2 %): plats 10 gav 9 av 96, plats 11 22 av 91, plats 12 16 av 45, plats 13 6 av 8 och plats 14 2 av 6. Omgång 3 gav 55 % på plats 11 och uppåt (104 av 188). Av de 104 strukna på plats 11 och uppåt var 41 en spegelvänd (18) eller omskuren (23) kopia av färgens första bild, se punkt 3. 52 av de 98 raderna gav ingenting: det som var rent låg redan i vyn, eller så var bilderna säljgrafik eller kopior. Tre sidor hoppades över av andra skäl (punkt 4).

Sex saker att ta med:

1. ☠️ **En renderad miljöbild kan visa varan i fel färg, och inget automatiskt steg ser det.** Rad 207 (skjulet `74e737ee`, Antracit): bilden på position 9, ett renderat skjul med en man och två barn, bar ingen text, hade ingen träff mot vyn och inga siffror, och stod på mitt förval. Först när den lades bredvid färgens första bild (`tools/polish-gates/cowork-par.py`) syntes att skjulet i bilden är beige och att inredningen inte är varans. Den ströks. Regel: lägg färgens egen första bild bredvid varje renderad miljöbild och titta på varans färg, inte bara på motivet.
2. ☠️ **Tre av nio måttbilder föll mot sidans text** (`kolla-tal-mot-text.js`, ren läsning). Kontorsstolen `cd3320e8` (Svart): bilden anger höjd 111–127 cm, sidan 113–121 cm. Kontorsstolen `4871d041` (Grå): 102–119 mot 104,5–121,5. Soffan `f1878c34` (Blå): belastning 240 kg mot 100 kg per sits. Samma regel som i omgång 1: ett annat tal för samma sak ströks, och ett tal som saknas i texten är ingen motsägelse. Fem av de sex som höll skrevs (den gröna kontorsfåtöljen, den gräddvita stolen, rumsavdelaren, skumklossarna och hundbädden), och soptunnans hoppades över av ett annat skäl (punkt 4). Texten ändras inte, för vilket tal som stämmer, Aosoms bild eller feedens mått, vet bara Aosom.
3. ☠️ **En spegelvänd eller omskuren kopia av färgens första bild är ingen ny bild.** Aosoms plats 11 och 12 var ofta just det: 41 kandidater på plats 11 och uppåt ströks efter att färgens första bild lagts bredvid dem (`tools/polish-gates/cowork-par.py`, färgens första bild bredvid kandidaten i 520 px, och `cowork-jfr.py` mot hela vyn). `dHash` är gråskala, ser en spegling som en annan bild och släpper en omskuren kopia förbi avståndsgränsen 12, så avståndet räcker inte.
4. ☠️ **Uppdragsfilens `nu` är ett ögonblick, inte vyn.** Rad 222 (soptunnan `c841717c`, Svart × 60 liter) stod på fyra bilder i filen men visar sex live sedan originalen lades tillbaka 2026-10-24, och rad 247 (hundbädden `ffb3f5b0`, Brun) står på sju (korten ingår). Båda hoppades över, eftersom en vy över fem bilder inte får fler. Hamsterburen (rad 255 och 256) visar redan fem bilder per kombination och fick ingenting. Räkna om vyn live före skrivningen, aldrig ur filen.
5. ☠️ **`cowork-granska.py` kan inte jämföra en sida där båda axlarna är kort** (rad 137, `c3d1fa41`): alla 12 kandidater blev `okänd`, och förvalet på sju bilder var större än det som var nytt. Jämförelsen gjordes mot de fyra bilder som Ljusgrå × 75 visar (`live-galleri-kort.mjs`, filerna hämtade ur Wix): position 1, 2, 9 och 10 är pixelidentiska med sidans egna bilder (medelskillnad 0,0 vid 64 × 64), och position 11 är två uppställningar av bädden som liknar position 1 och 12. Skrivna blev position 3 (måttbilden med den hopfällda storleken, siffrorna kontrollerade mot sidans text) och position 12 (hund på bädden mot vit botten), båda länkade till färgen. Ljusgrå × 75 går från fyra till sex bilder.
6. **Skrivningen och bildstädningen.** Bildstädningen är avstängd sedan #773 (Leonard 2026-10-23), så skyddskollen är en kontroll och inget som hindrar en radering. Filerna är ändå skyddade på alla tre sätten nedan.

**Skrivet 13:22–13:27 UTC** (efter Aosoms lagerkörning 12:20–12:29, före priskörningen 15:12–15:29): `skriv-fargbilder.js`, åtta sidor per körning i fem körningar (8 + 8 + 8 + 8 + 5), **37 av 37 sidor återlästa utan avvikelse** (galleri, länkar, variant-id, SKU, pris, synlighet, andra optioners länkar), revision +2 per sida. Torrkörningen av första filen gick först och ändrade ingenting. Uppladdningen gick i sex anrop om högst tolv adresser, ett i taget: 69 av 69 `success: true`, ingen HTTP 429, och 69 av 69 filer paras med sin kandidat på md5 (`cowork-ladda.py para`). `variantbild.yml` (skarp, `ids`, run 40098185452, 13:27–13:28 UTC): **37 kontrollerade, 37 rättade**, 0 avvikelser. **Skyddskollen** (`bygg-skyddskoll.py` med enbart rundans `tillagg.json`): 37 sidor och 69 filer, 69 i galleriet, 69 sedda av städningens egen tolkning och 69 kvar i Media Manager (`OK`, `READY`), alla med källklassen `leverantor`. Största galleriet är 37 bilder (Wix tar 50).

**Live 13:39–13:41 UTC** (`live-par.sh` med `kolla-live-farg.py`, 12–18 minuter efter skrivningarna, så butikens cache hade hunnit ikapp): **ALLT OK på 36 av 36 enaxliga sidor**, varje tillagd fil syns i sin egen färgs vy och i ingen annans. Hundbädden `c3d1fa41`, där båda axlarna är kort, mättes för sig i en riktig webbläsare (`live-galleri-kort.mjs`, före och efter): Ljusgrå och svart × 75 × 51 × 18 cm visar sex bilder (fyra före) med de två nya sist, och de två andra kombinationerna som finns är oförändrade (Brun och svart × 75 × 51 × 18 cm fem bilder, × 107 × 61 × 20 cm tre). De 45 rörda färgvyerna på de enaxliga sidorna stod på fyra bilder (43 vyer) eller fem (2) och gick från 182 till 249 bilder: 31 visar nu fem, sju sex, fem sju, en åtta och en nio. Alla 45 fick fler bilder, ingen fick färre och ingen orörd vy ändrades (jämförelse mot mätningen före skrivningen). Katalogkontrollen (`katalogkontroll-farg-antal.js`, 13:32 UTC, efter skrivningen) ger **412 av 2 589 färgval på fyra bilder eller färre** (1 bild: 80, 2: 85, 3: 73, 4: 174), mot 550 av 2 553 den 22 oktober, före Cowork-rundorna. Alt-texterna i sidornas egen data (`imageAlts`, `tools/polish-gates/kolla-alt.py`, 13:48 UTC) är lika med facit i `tillagg.json` på 69 av 69, och det bevisar också att varje fil-id och varje alt-text kom fram oförvanskad genom avskriften till `ExecuteWixAPI`. `live-dubbletter.py` över de 36 sidornas färgvyer: ett par, `fbd70dae` Sand plats 1 och 5 (avstånd 3, pixelskillnad 35), som redan bedömdes som *likt men olika* i feedomgång 18 (ett belyst foto av lyktan och dess måttritning) och som inte innehåller någon av omgångens 69 filer. `ocr-live.py` över alla 560 unika bilder i de 36 sidornas färgvyer (bara läsning, körd efter skrivningen som i omgång 2 och 3): 391 REN, 86 SIFFROR och 83 TEXT (13:44–13:59 UTC, 15 minuter). De 67 av omgångens 69 filer som ingår (de två på `c3d1fa41` mättes i webbläsare och ingår inte i svepet) gav 55 REN, 9 SIFFROR och 3 TEXT, och de tre är märken och en knapp på varorna (*PawHut* på hundbädden, *HOMCOM* på minikylen och *HEAT* på massagefåtöljens panel), alltså samma tal som kandidatkontrollen. Av de 493 bilder som låg ute före omgången har 80 text, och tolv träffar i hela svepet har en textyta över 1,5 % eller minst två tyska eller engelska funktionsord: nio är våra egna svenska kort (där OCR tappar å, ä och ö), två är brus i renderade miljöbilder utan någon text (matgruppen `5c65d551` och skjulet `834c66fd`) och en är en inramad affisch på väggen i en miljöbild (`f1878c34` Blå, tysk text på rekvisitan), som runbooken släpper och som låg på sidan före omgången. **Ingen tysk eller engelsk säljgrafik ligger på någon av de 36 sidornas färgvyer.**
