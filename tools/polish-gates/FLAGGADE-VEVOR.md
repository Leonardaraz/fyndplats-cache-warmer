# Flaggade VEVOR-utkast — rör INTE dessa utan Leonards beslut

VEVOR-chattens egen flaggfil (Leonard 2026-10-31: en chatt för VEVOR och en för
Aosom). Samma regler som `FLAGGADE.md`: läs filen FÖRE urvalet, lämna varje rad
orörd, lägg till en rad när en runda hittar ett skäl att hålla tillbaka ett
utkast, och stryk en rad med ett kort resultat när Leonard har beslutat. Raden
tas aldrig bort.

Filen finns för att de två chattarna arbetar på var sin gren. Skrev båda i
`FLAGGADE.md` hade grenarna krockat i samma fil vid varje merge. En lärdom som
gäller båda leverantörerna skrivs i `FLAGGADE.md`.

☠️ Repot är publikt: inga artikelnummer, modellnummer, adresser eller priser.
Ett utkast anges med sitt Wix-id.

## Flaggade utkast

| Wix-id | skäl | runda | beslut |
|---|---|---|---|
| 48239434-5157-4740-9fd6-672351de4309, 605e12f2-9ad2-44b8-bf90-c1367645ccaf, 1dfe3dd5-3dd5-450a-9449-2e690c4702bc | samma girlang i tre längder, inte sammanslagna: sammanslagningsverktyget är bara byggt för Aosom. Publicerade som egna sidor med längden i namn, adress och titel | runda-vevor-1 | väntar på Leonard: slå ihop till en sida med längd som val, eller behåll tre sidor |
| c4e44d56-363c-422e-babe-cc23b7e4b0a0, 058f99c8-7851-4918-9e5c-5e9f556ddd26 | samma frostiga girlang i två längder (30 respektive 20 LED), inte sammanslagna. Publicerade som egna sidor | runda-vevor-1 | väntar på Leonard |
| c4e44d56-363c-422e-babe-cc23b7e4b0a0, 058f99c8-7851-4918-9e5c-5e9f556ddd26, 196540b1-fad2-4413-9e41-668574af1f0b | LED-girlanger: källan nämner varken batterityp eller om batterier ingår, och fotot visar bara en mörkgrön batterilåda. Texten nämner därför inte strömkällan | runda-vevor-1 | väntar på Leonard: ta reda på vad som ingår och lägg till det |
| ac24128f-23ed-404e-b68a-ad488bc3ea54, 5d70b5ce-773b-4936-b11c-b4a91e475982 | lyktorna: batterityp (3 × AAA respektive 3 × LR44 per lykta) är avläst och styrkt av källan och fotot, men källan säger inte om batterierna ingår. Texten lovar inte det | runda-vevor-1 | väntar på Leonard |
| a7c3435e, f8e218c3, fb3cdc1e (åtta första tecknen i Wix-id) | arecapalmen, dracaenan och betelnötspalmerna har fyra bilder var. Varje sida hade en eller två dubbletter av en annan bild (samma foto från samma vinkel, mätt av `gate-bilddubblett.py`) som ströks efter Leonards besked 2026-11-01, och VEVOR-importen tog sex bilder och inget verktyg hämtar fler. På arecapalmen och dracaenan liknar två av de fyra kvarvarande varandra (0,027 och 0,023, över gränsen 0,02): samma växt med en hängetikett respektive en annan krukbeskärning. De står kvar. Stryker Leonard dem blir det tre bilder | runda-vevor-2 | väntar på Leonard: skaffa en bild till, eller godkänn fyra |
| fb3cdc1e-2d41-4bbe-bd76-818e71453682 | betelnötspalmerna: källan säger Antal 2 men anger Bladmängd 10, mått 800 × 800 × 1219 mm och 1,8 kg utan att säga om det gäller en palm eller setet. Texten tolkar mått och blad som per palm (fotot visar två lika höga palmer med ungefär tio blad var) och nämner ingen vikt | runda-vevor-2 | väntar på Leonard: kontrollera mått och vikt |
| 9d4799fe-80e8-49aa-b0af-3af4873f8468, bdc6b99c-3e74-434a-b473-9f48b636a2a4 | kundrecensioner nämner lukt (fuktlukt på olivträdet, plastlukt på ficusen) medan källan påstår att materialet är luktfritt. Texterna påstår inte luktfritt för något av de åtta träden och palmerna, och de två recensionerna är publicerade som kunderna skrev dem | runda-vevor-2 | väntar på Leonard |
| 8ffe095e, 03144222, 0729090c, 3b0178ac, a04dc1a4, acdd4d0e, fd3aabc0, a73169c4 (åtta första tecknen i Wix-id) | konstväxter i VEVOR-familjen "flera typer och storlekar" som liknar rundans åtta (samma växttyp i annan storlek), ej polerade och ej sammanslagna. Sammanslagningsverktyget är bara byggt för Aosom | runda-vevor-2 | väntar på Leonard: slå ihop till en sida per växttyp med höjd som val, eller polera som egna sidor |
| 795eff11-51b4-48c2-98dd-aa2195849484 | källans rubrik säger Guldsockerpalm medan specen säger Guldrörspalm. Sidan använder specens namn | runda-vevor-2 | väntar på Leonard: bekräfta namnet |

## Lärdomar

- **VEVOR-källan bär mått utan axelbokstäver.** `Artikelmått`/`Produktmått` är tre tal i mm (och tum) utan B, T eller H, så `bygg-axelfacit.py` avbryter på alla åtta (runda-vevor-1) och facit kvitteras i `grind-undantag.txt` med det skälet. Skriv då bara de axlar källan själv namnger: längd på en girlang (`Girlanglängd`), höjd på en lykta. Lägg inte på ett `(längd × bredd × höjd)` som källan inte säger.
- **Mått i mm skrivs i cm, och varje omräknat tal behöver en rad i `foto-tal.txt`** (`kort tal skäl`), annars faller siffergrinden på 275 när källan säger 2750 mm. Avrundade tal (2011 mm till 201, 1828 mm till 183, 1524 mm till 152) står med sitt skäl.
- **VEVOR-syskon har samma importerade SKU.** Tre girlanger delade `FP-julgirlang-2750-mm` och båda lyktorna `FP-12-st-dekorativa`, så `sku.tsv` behövs även på enkla sidor och SKU:n bär det som skiljer dem åt (längd, LED-antal, färg).
- **Batterier avläses ur fotot.** Källan sade `AAA-batteridesignen` och `LR44-batteridesignen`; antalet (tre per lykta) räknades i batterifacket på bild 4. Båda talen står i `foto-tal.txt`.
- **Källan motsäger sig om inomhus och utomhus på lyktorna** (både `inomhuslyktor` och `utomhuslyktor`). Texten påstår ingetdera. LED-girlangerna får inte heller `vattentät` eller utomhusbruk, bara trion utan LED, där källan säger det om materialet.
- **`gh workflow run` fungerar i molnsessionen** trots att `gh auth status` säger att GH_TOKEN är ogiltig. Verifiera med `gh run view` att körningen blev `success`; en andra chatt kan ha en egen körning i kön.
- **Några av växterna delar bilder med en annan sida.** Guldrörspalmens och betelnötspalmens första bild är samma fil, så den ströks på betelnötspalmen. Närbilden på bladen (position 6) är nästan identisk på båda och står kvar, annars hamnade betelnötspalmen på fyra bilder. Miljöbilden i sovrummet delas av fyra sidor, men växten är en annan på varje sida och bilden är alltså inte samma foto.
- **En kruka som inte är den som säljs är en annan konfiguration.** Ficusens miljöbild visade en grå kruka, och arecapalmens och dracaenans sjätte bild en svart plastkruka mot den höga vita som säljs. De två sista ströks. Ficusens miljöbild lades tillbaka efter Leonards besked 2026-11-01: sidan hade annars fyra bilder, och vanliga frågor säger att krukan i miljöbilden inte ingår.
- **Dubbletter ser ögat inte, grinden gör det.** Leonard hittade olivträdets dubblett (position 3 och 4) i butiken. Svepet `gate-bilddubblett.py` (96 × 96 gråskala efter beskärning till varan, medelavvikelse) hittade åtta par, sju sidor, och ströks. Äkta dubbletter låg på 0,003–0,019, och de två närmaste par som står kvar på 0,023 och 0,027. En dubblett fyller inte upp till fem bilder, så tre sidor blev kvar på fyra.
- **Huvudbilden kan ligga på position 3.** På fyra av åtta sidor var position 1 en närbild med händer och den rena helbilden låg på 3. De fick position 0 i `bilder.tsv` och `alt.tsv`, så `bygg-media.py` sorterar helbilden först. Kör inte `bygg-ark.py` efter omnumreringen, eftersom kontaktarken hör till källpositionerna.
- **Ordet "luktfri" i VEVOR-källan stämmer inte alltid.** Två recensioner på två olika sidor nämner lukt. Hela familjen skrevs därför om till "vattentät", som källan också säger och ingen har motsagt.
- **Recensioner kan komma på svenska.** `oöversatt` fäller en text som är identisk med originalet, så en svensk recension skrivs om lätt (samma innehåll, andra ord) i stället för att skickas in oförändrad.
- **`polish-recensioner.yml` har ingen `ref`-input.** Grenen anges med `--ref` på `gh workflow run`; `runda` och `lage` är de enda inputsen.
- **Kategorin finns.** `Hem & Inredning + Konstväxter` gick igenom `torr` utan fel för alla åtta, så båda namnen finns i Wix.
