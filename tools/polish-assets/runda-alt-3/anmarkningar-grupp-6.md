# Anmärkningar, grupp-6

## Text i bilden

Alla bilder nedan har text på engelska. Ingen text är återgiven eller översatt i alt-texterna, som beskriver bilderna i allmänna ordalag.

- `ce8f60ff` bild 2, 3 och 4: miljöscener med skyltar och tavlor på engelska i bakgrunden (bild 2: karnevalsskylt, halloweenfestival och popcornvagn, bild 3: skyltar vid ett cirkustält, bild 4: griffeltavla med godis- och spökrubrik samt en varningsskylt).
- `ce8f60ff` bild 5: kortet innehåller miljöbilden från bild 2, alltså samma engelska skyltar i miniatyr.
- `ce8f60ff` bild 1: ordet popcorn på brickan som clownen bär (engelska, på rekvisitan).
- `cfab9c4e` bild 7: två korta etiketter på engelska, bärförmåga i pund och kilo samt antal datorer.
- `d49a557a` bild 6: etikett på engelska med belastning i pund och kilo.
- `d6e4c7fc` bild 10 (befintlig alt-text): etikett på engelska med belastning i pund och kilo.
- Småtext på engelska i bakgrund eller rekvisita, inte nämnd i alt-texterna: `c329ea34` bild 2 och 3 (affisch), `d2ff1b03` bild 2 (inramad tavla), `d6e4c7fc` bild 2, 6, 8 och 9 (etiketter på flaskor och tuber), `cb73d06f` bild 5 (bokryggar, en av dem med ett märkesnamn).

## Osäkert

- `c329ea34` bild 1 till 4: sidtexten och kortet i bild 3 säger tre lådor och två skåp. På bilderna syns två dörrar och två lådor i mitten. Jag har inte skrivit något antal i alt-texterna, bara "dörrar, lådor och guldfärgade handtag".
- `c5f52a22` bild 1 och 5 (och troligen 6): häxan bär två små flaskor i bältet, medan sidtexten talar om en lysande trolldrycksflaska. Alt-texterna säger "trolldrycksflaskor" utan antal.
- `c79e5a3e` alla bilder: sidtexten säger varmgul mässingslook, men metallen ser mörkare och mer antikt mässingsfärgad ut, nästan olivgrön i bild 8. Jag skrev "mässingslook" och "mörk mässingslook" i närbilden på leden.
- `d3fea27c` bild 1 och 3: sidan säger ramlös spegeldörr, men bilderna visar en tunn mörk eller grå kant runt dörren. Jag skrev varken "ramlös" eller "ram".
- `c6a489bf` bild 2, 3 och 4: spegelytan visar en delad bild i trä och grått som ser ut som en återgiven reflektion. Jag skrev bara "spegeln".
- `ddda4610` bild 2: överdraget återges halvgenomskinligt med möblerna synliga under, och med vita linjer vid ena sidan. Jag tolkade linjerna som luftflöde ("vita linjer som visar luftflöde"), men det är en tolkning.
- `cfab9c4e` bild 1: den mörkgrå tygdelen på bordets ena ben har jag kallat "förvaringsficka i tyg". Sidtexten jag fick visar inte vad den kallas.
- `d2ff1b03` bild 1: bänken är "ljusgrå" efter vad som syns, sidtexten jag fick nämner ingen färg.
- Måttbilder med fler mått än listan över tillåtna tal: jag har bara skrivit de mått som står i listan och i övrigt "måttlinjer". Utelämnade mått finns i `c30b626a` bild 5 (51,7 och 94,5 cm), `c329ea34` bild 4 (bl.a. 20, 54 och 65), `c4497ca9` bild 6 (80 cm), `c5b4cef2` bild 6 (9 och 17,7 cm), `c6ea520e` bild 6 (65 cm), `cb73d06f` bild 6 (13, 26,5 och 56,5 cm), `cfab9c4e` bild 7 (75 cm och bärförmågan i pund) och `d49a557a` bild 6 (bärförmågan i pund och kilo).

## Fynd i befintliga alt-texter

- `d6e4c7fc` bild 10 (status FINNS, rör inte): texten "Måttbild: skåpets mått, fackens höjder och skåpet med öppen dörr" börjar på Måttbild. `kontroll.py` fäller den, eftersom en text som börjar så flyttar bilden sist i galleriet. Jag får inte ändra raden. Förslag på ersättning: "Ritning av skåpet med mått, fackens höjder och skåpet med öppen dörr".
- `gate-alt.py` har inga fynd, varken på nya eller befintliga rader.
- Inte fynd men värt att se över: `c30b626a` bild 2, `c79e5a3e` bild 2 och `ca09bab9` bild 2 är bara produktnamnet plus "i en miljöbild" och säger alltså inte vad som syns. De är orörda.

## Bilder som borde bytas

- Samma bild två gånger på samma sida: `c30b626a` bild 2 och 3 (byte för byte identiska filer), `c79e5a3e` bild 2 och 4, `ca09bab9` bild 2 och 3, `d6e4c7fc` bild 5 och 7. Den ena i varje par tillför ingenting i galleriet. Jag har skrivit olika alt-texter genom att beskriva olika detaljer i scenen.
- Kort med leverantörsord i sidfoten: `c4497ca9` bild 5, `cfab9c4e` bild 5, `d3fea27c` bild 5 och `d49a557a` bild 5 har texten "Fyndplats · mått enligt leverantörens ritning" längst ned. Ordet leverantör ska inte nå kunden, och här står det inbränt i bilden.
- Märkeslogotyp i bild: `ddda4610` bild 1, 2 och 3 visar ordmärket VEVOR på själva överdraget, i bild 2 stort mitt i scenen. Alt-texterna nämner det inte.
- `ce8f60ff` bild 2, 3, 4 och 6: bakgrundsscenerna ser ut som genererade eller ihopmonterade bilder, och i bild 2 till 4 har de skyltar på engelska. Värt att titta på om de ska vara kvar.
- `cb73d06f` bild 5: ett märkesnamn står tryckt på en bokrygg i facket. Liten detalj, men det är ett annat märke i bild.

## Sammanfattning

22 sidor, 134 bilder, 123 nya alt-texter (de 11 befintliga raderna är orörda). `gate-alt.py` är ren (0 fynd). `kontroll.py` har 1 fynd, och det ligger på den befintliga raden `d6e4c7fc` bild 10 som jag inte får ändra. Alla nya rader är rena i båda kontrollerna.
