# Anmärkningar grupp-4

## Text i bilden

- Ingen bild har mycket inbränd text på annat språk än svenska. Fyndplats-korten (alt-texter som börjar med "Kort med") är på svenska, och måttbilderna bär bara cm-, kg- och tumvärden.
- Enstaka engelska texter på rekvisita i miljöbilder, inte återgivna i alt-texterna: 8563fe5a bild 2 och 4 (tavla med engelsk textrad, förpackningar och boktitlar), 85916987 bild 2 och 4 (bokomslag med engelska titlar), 905f6cd8 bild 5 (liten skylt).

## Fel vara eller färg

- 8cda502c bild 3: ansiktet är blekblått, medan sidan och bild 1 och 2 visar grönt. Bilden är i övrigt samma scen som bild 2. Alt-texten säger "blekblått ansikte".
- 92e6ceae bild 3: överdrag med vit botten och bladmönster i marinblått, gult och ljusblått. Bild 1, 2, 4 och 5 visar ett beige överdrag med vitt stjärnmönster. Sidan nämner ett försilvrat och ett bomullsöverdrag men inget mönster, och inget försilvrat överdrag syns i bilderna. Alt-texterna beskriver det som syns.
- 92ac9101: sidan och den befintliga alt-texten på bild 2 säger "sisallindad stege", men stegarna på bild 1, 4 och 7 är klädda i plysch (sisalen sitter på stammarna). Mina alt-texter säger "plyschstege".

## Osäkert

- 81d059f0: antalet och placeringen av öppningar går inte att läsa ut ur bilderna. Bild 1 visar två (mittdelen och nederdelen), bild 2 och 5 en vardera, bild 4 en i den övre delen, medan sidan säger att de två nedre våningarna är slutna hålor. Varje alt-text nämner bara det som syns i just den bilden.
- 78f22e96: dynans ton varierar mellan bilderna (kräm i bild 1, gråbeige i bild 5, svagt grönaktig i bild 6), troligen på grund av ljus och rendering. Bild 1 säger "ljus beige", övriga säger "dyna" utan färg.
- 8211fa8f: sidan säger RGB-LED, men alla bilder visar bara varmvitt ljus. Inga ljusfärger påstås i alt-texterna.
- 861ec8c1 bild 5: jag antog att utsnittet visar den större lådan (flaskorna är höga). Bild 4 antogs visa den övre, mindre lådan.
- Måttbilder som är renderingar med måttlinjer (inte tekniska ritningar) heter "Ritning av ..." i alt-texten, till exempel 773595bc bild 5, 78f22e96 bild 4, 7f4ae6d7 bild 7 och 8211fa8f bild 4. På foton med påritade mått (75eaa774 bild 6, 8563fe5a bild 5, 85916987 bild 5, 8ce9d02c bild 6, 8cda502c bild 6) står "måttlinjer" mitt i meningen, aldrig först.
- Mått som syns på måttbilderna men inte står i listan över tillåtna tal är utelämnade: 773595bc bild 5 (72), 837334f8 bild 6 (8), 8cc4326d bild 6 (27, 32, 158, 180), 81d059f0 bild 6 och 92ac9101 bild 5 (180, människosiluett), 968f6b8f bild 5 (10, 180), 8211fa8f bild 4 (42 och 55 tum), 98b85a6e bild 4 (22,5, 43 tum, 67).
- Räkneord (två, tre, fyra) förekommer bara där sidans titel eller inledning använder dem. Inga egna räkningar ur bilderna.

## Fynd i befintliga alt-texter

- Varken gate-alt.py eller kontroll.py fäller något på de nio befintliga raderna (75eaa774 bild 2, 773595bc bild 2, 7f4ae6d7 bild 2, 8563fe5a bild 2, 85916987 bild 2, 8bf8dedd bild 2, 92ac9101 bild 2, 968f6b8f bild 2, 9a2f6417 bild 3). Jag har inte ändrat någon av dem.
- Notering utan grindfynd: åtta av de nio består av sidans titel plus "i en miljöbild", med tankstreck mitt i meningen, "350°", "G9-lampa" och "boho". Instruktionen avråder från sådant, men grindarna släpper igenom det. De åtta ligger på just den bild som har en tvilling i galleriet (se nästa avsnitt).

## Bilder som borde bytas

- Exakta dubbletter i galleriet (samma foto två gånger, den ena med befintlig alt-text): 75eaa774 bild 2 och 3, 773595bc bild 2 och 4, 7f4ae6d7 bild 2 och 3, 8563fe5a bild 2 och 4, 85916987 bild 2 och 4, 8bf8dedd bild 2 och 4, 92ac9101 bild 2 och 4, 968f6b8f bild 2 och 4. Nästan dubblett: 8cda502c bild 2 och 3 (samma scen, olika ansiktsfärg). De nya alt-texterna skiljer kopiorna åt på detaljer, men en ny bild i stället för kopian vore bättre för kunden.
- 837334f8 bild 1, 3 och 6: en liten gul etikett på nedersta hyllans framkant, för liten för att läsa, kan vara en logotyp.
- Liten tillverkarlogotyp på tv-apparaten (rekvisita): 98b85a6e bild 5 och 6, 8211fa8f bild 5. Nämns inte i alt-texterna.
- 92e6ceae: bilderna visar två olika överdrag, men sidan beskriver ett försilvrat och ett i bomull. Ägaren bör se över vilka överdrag som faktiskt medföljer.

## Sammanfattning

22 sidor, 140 bilder: 131 nya alt-texter skrivna, 9 befintliga rader orörda. `alt.tsv` har en rad per bild, sorterad efter kort och bildnummer. gate-alt.py: REN (0 fynd). kontroll.py: REN (0 fynd).
