# Anmärkningar, grupp-5

## Text i bilden

- Ingen bild i gruppen har mycket inbränd text på annat språk än svenska. Alla Fyndplats-kort (till exempel 9b027508 bild 3, a212833b bild 2–5, c0abfddd bild 4) har svensk text och är beskrivna utan att texten återges.
- Småtext på engelska inne i miljön, inte på varan: a9908d30 bild 2 och 6 (engelsk text på en affisch bakom lampan), c0910da2 bild 5 (engelsk text på tidningar och snacksförpackningar överst på vagnen). Inget av det är återgivet i alt-texterna.

## Fel vara eller färg

- 9b027508 bild 4: visar två likadana konsolbord bredvid varandra som en bred möbel. Sidan säljer ett smalt bord. Beskrivet i plural utan antal ("Konsolborden uppställda bredvid varandra …").
- b5f9a520 bild 5: två bokhyllor står sida vid sida (fyra luckor), sidan säljer en. Beskriven i plural utan antal. b5f9a520 bild 4 är en delad bild som visar samma bokhylla i ett kök (vänster halva) och i ett vardagsrum (höger halva).
- a9908d30 bild 3 och 6: lampfoten ser ljusare och mer gråbeige ut med mörka korn än "sandfärgad". Jag skrev "sandfärgad" som på sidan bara på bild 1 (frilagd, där färgen är lättast att bedöma). De andra bilderna beskriver foten som keramik med synliga korn.
- ada506ab bild 5: stolen ser varmare ut, mer kamel eller sand, än det beige som syns på bild 1–4 och 6 (kan vara ljussättningen). Skrev "beige" som på sidan.

## Osäkert

- 9cf9a28d bild 3 är en exakt kopia av bild 2 (FINNS). Jag skilde dem åt genom att beskriva andra detaljer i scenen (dator, lampa, fönster, skrivbord). På samma sätt är a2748770 bild 8 identisk med bild 1. Där skilde jag dem på betoning och vy: bild 1 ringar och skivor på en vit list, bild 8 vita insidor i ringarna.
- a2748770 bild 4, b964138a bild 4, bd476b1e bild 4 och be8cb6e3 bild 4 visar samma rum som respektive bild 2 (FINNS), i ett annat utsnitt. Jag beskrev det som syns i utsnittet.
- Räkneord skrivna med bokstäver utelämnade där antalet inte står i talen för sidan: a9477c1f (bilden visar en stor ring och en rund skiva med spår, sidan säger "två ringar", så jag skrev "ring" och "skiva" utan antal), b964138a (antalet ljusrör), b8e81a24 (antalet skåp), be8cb6e3 (antalet kojor), c1ed35a7 (antalet fack).
- Siffror i måttbilder som inte står i listan är inte återgivna. be8cb6e3 bild 5 och bd476b1e bild 5 har en personsiluett med längdangivelse som inte finns i listan; den nämns som siluett utan tal. 9e9d94d4 bild 4 har en vikt-etikett utan förklaring och nämns inte.
- bbe221e6 bild 2 (kort): på fotot i kortet går det inte att avgöra om spegeldörren är stängd eller på glänt, så texten säger bara att skåpet sitter på väggen över en träkommod.
- c0abfddd: elbilen är beskriven utan märkesnamn, enligt instruktionen. Bild 1 och 3 är skilda på åt vilket håll fronten pekar.
- a2748770 bild 7: samma lampa sedd mer från sidan, med tunna fästen mellan skivorna och listen. Vyn är min tolkning.
- 9cf9a28d och ada506ab: jag skrev bara "mjukt tyg" respektive "beige tyg" och valde inget ord för tygtypen, eftersom sidans text inte anger den.

## Fynd i befintliga alt-texter

- `kontroll.py` fäller 9b027508 bild 9 ("Måttbild: bordet är 55 cm brett, 30 cm djupt och 85 cm högt och tål 30 kg"): raden börjar på "Måttbild", som flyttar bilden sist i galleriet. Bild 9 ligger redan sist, så det kan vara avsiktligt. Raden har status FINNS och är inte ändrad.
- `gate-alt.py` har inga fynd på befintliga rader.
- Observation som ingen grind fäller på: de fem befintliga raderna för bild 2 (9cf9a28d, a2748770, b964138a, bd476b1e, be8cb6e3) är sidans namn plus "i en miljöbild" och beskriver inte vad som syns. De är orörda.

## Bilder som borde bytas

- 9cf9a28d bild 3: exakt kopia av bild 2.
- a2748770 bild 8: exakt kopia av bild 1.
- Samma foto i annat utsnitt (nästan dubbletter): a2748770 bild 2 och 4, b964138a bild 2 och 4, bd476b1e bild 2 och 4, be8cb6e3 bild 2 och 4.
- 9b027508 bild 4 och b5f9a520 bild 5: visar fler enheter än sidan säljer, vilket kan läsas som antal eller bredd.
- c0abfddd bild 1–4: bilmärkets emblem (en treudd) syns tydligt i grillen på varje bild, och rubriken på kortet (bild 4) hänvisar till det. Sidnamnet innehåller också bilmärket.
- b9c3c384 bild 5 och bbe221e6 bild 6: sidfoten i kortet lyder "… mått enligt leverantörens ritning". Ordet leverantör är inte tillåtet i kundtext.
- c0910da2 bild 5: snacksförpackningar med läsbara varumärken överst på vagnen.

## Sammanfattning

22 sidor, 145 bilder. 135 nya alt-texter skrivna, 10 befintliga rader orörda. `gate-alt.py` är ren (0 fynd). `kontroll.py` har ett fynd, på den befintliga raden 9b027508 bild 9 som inte får ändras, och är i övrigt ren.
