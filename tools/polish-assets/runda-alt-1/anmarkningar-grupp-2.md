# Anmärkningar, grupp 2

## Text i bilden

- `288381a0` bild 4: grafik med en stor rubrik på engelska och en närbild på väggbeslaget. Alt-texten beskriver bara vad grafiken visar och återger inte rubriken.
- `5352bb04` bild 1, 6 och 7: larmpanelens skärm har menytexter på engelska och ett datum från 2022, och panelen bär texterna RFID och SOS. Alt-texterna återger inte skärmtexten. Bild 6 och 7 har dessutom logotyper överst (se Bilder som borde bytas).
- `2ccf1182` bild 6 och `2ede5bfe` bild 6: måttbilder där maxlasten står i pund (engelsk enhet, "lbs") bredvid kilo. Alt-texten nämner inte vikten.

## Fel vara eller färg

- `49c169d9` bild 1, 2, 3 och 6: sidans inledning beskriver foten som ett brett kryss i svart stål, men bilderna visar en rund fotplatta med ett separat ringformat fotstöd. Alt-texterna beskriver det som syns.
- `32d2e5c3` bild 1, 2 och 5: sidans inledning säger att förstoringsspegeln sitter uppe i högra hörnet. På bilderna sitter den nere till höger på den liggande spegeln (bild 1 och 5) och nere till vänster på den stående (bild 2). Alt-texterna skriver det som syns.
- `5352bb04` bild 1 och 7 visar det större paketet (4 rörelsesensorer, 8 dörrsensorer, 3 RFID-brickor och 3 fjärrkontroller). Bild 4, 5 och 6 visar det mindre paketet (3 rörelsesensorer, 6 dörrsensorer, 2 RFID-brickor och 2 fjärrkontroller). Bara bild 2 och 3 är kopplade till valet Paket, så den som väljer det mindre paketet kan se bild 1 och 7 med fler delar. Alt-texterna för bild 6 och 7 anger antalen så att de går att skilja åt.
- `49a2d0e4` bild 6: bilden anger maxlast 25 kg, medan sidans kort (bild 5) anger 15 kg för toppskivan. Det kan vara total last mot toppskivans last, men jag kunde inte avgöra det. 25 står inte i listan över tillåtna tal, så alt-texten nämner ingen vikt.

## Osäkert

- `27f5b385` bild 4, `3cd34498` bild 4 och `42e8753a` bild 3 är byte för byte lika med bild 2 på samma sida (se Bilder som borde bytas). Bild 2 har redan en alt-text och är orörd. Texten för den andra kopian är skriven med annat fokus (rummet, fönstren, katten), så att texterna skiljer sig åt.
- `288381a0` bild 1 och 2: panelerna är vinklade, men jag kan inte avgöra om det är L-form eller U-form. Alt-texterna säger bara "vinklade paneler" (bild 1: sidopanelerna lätt vinklade bakåt).
- `396ba0e6` bild 4: bilden visar en vev på ett vitt metallhus, medan sidans inledning säger vred. Jag skrev vev, eftersom det är vad som syns.
- `396ba0e6` bild 5: två delar klädda i beige plysch hålls ihop av en gängad stång. Jag kan inte avgöra vilken del av trädet det är, och sidan säger sisal på stammen. Alt-texten beskriver bara det som syns.
- `3b8214b3`: sidans namn anger ingen färg. Stolarna är ljusbeige med en svag grön ton, och jag skrev beige.
- `47bd2db6`: sidans namn anger inget klädselmaterial. Jag skrev grå och läderlook, eftersom det är utseendet. Bild 4 visar även måttet 64 cm, som inte står i listan och därför inte nämns.
- `2ccf1182` bild 6: måtten 20,8 cm och viktuppgiften i pund står inte i listan och nämns inte.
- `2ede5bfe` bild 6: måtten 30,8, 37,7, 26,9, 12,8 och 21,4 cm står inte i listan, så alt-texten säger bara "fackens innermått".
- `3c0f58f1` bild 6: måtten 160 cm (en människas längd) och 52,5 cm står inte i listan och nämns inte.
- `3cd34498` bild 5: måttet 17 cm står inte i listan och nämns inte.
- `53644ed2` bild 4: måttet 50,5 cm sitter vid sitsen, men jag är inte säker på om det är sitthöjd. Alt-texten säger "höjden upp till sitsen" utan tal.
- `2ad2fafd` bild 6: den smala stapeln till vänster är en sidovy med måttet 3 cm. Alt-texten skriver "smal sidovy".
- `52ac6a79` bild 1: samma vy som den befintliga bild 6 fast spegelvänd. Alt-texten skiljer dem åt genom att ange att filterkammaren sitter till vänster.
- `5352bb04`: sidans namn börjar med ett märkesnamn i versaler. Det används inte i någon alt-text, och inte heller de appnamn och uppkopplingsnamn som står på korten. Bild 2 är kopplad till paketet med 3 rörelsesensorer och 6 dörrsensorer och bild 3 till paketet med 4 och 8, enligt uppgift.md.

## Fynd i befintliga alt-texter

- Varken `gate-alt.py` eller `kontroll.py` har några fynd på de 8 befintliga raderna (`27f5b385` bild 2, `288381a0` bild 5, `3cd34498` bild 2, `40016eba` bild 2, `42e8753a` bild 2, `52ac6a79` bild 5, 6 och 7). Raderna är orörda.
- Observation som ingen grind fångar: fyra av dem (`27f5b385` bild 2, `3cd34498` bild 2, `40016eba` bild 2, `42e8753a` bild 2) är sidans produktnamn med tankstreck följt av "i en miljöbild", och säger inget om vad bilden visar.

## Bilder som borde bytas

- Identiska duplikat i galleriet (samma bild två gånger): `27f5b385` bild 2 och 4, `3cd34498` bild 2 och 4, `42e8753a` bild 2 och 3. Filerna är lika byte för byte. En av kopiorna på varje sida kunde bytas mot en annan vy.
- `5352bb04` bild 6 och 7: en märkeslogotyp (blå ruta uppe till vänster) och två uppkopplingslogotyper är inbakade i bilden. Bilderna borde bytas mot versioner utan logotyper.
- `5352bb04` bild 4 och 5 (egna kort): texten på korten nämner en app från en tredje part vid namn. Det kan behöva ses över.
- `288381a0` bild 4: en engelsk rubrik är inbränd i bilden. Den borde bytas mot ett svenskt kort.
- `2ccf1182` bild 3: småtexten längst ned på kortet säger "enligt tillverkaren". `49a2d0e4` bild 5: småtexten säger "enligt leverantörens ritning". Orden är inbrända i bilderna, så ingen textgrind ser dem, och de visar kunden vem som är källa till måtten.
- `2ccf1182` bild 6, `2ede5bfe` bild 6 och `49a2d0e4` bild 6: måttbilder med viktuppgift i pund (de två första) eller en maxlast som avviker från sidans uppgift (den tredje). Bör kontrolleras.

## Sammanfattning

22 sidor och 136 bilder. 128 nya alt-texter skrivna, 8 befintliga lämnade orörda. `gate-alt.py` är ren (0 fynd) och `kontroll.py` är ren (0 fynd).
