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

## Lärdomar

- **VEVOR-källan bär mått utan axelbokstäver.** `Artikelmått`/`Produktmått` är tre tal i mm (och tum) utan B, T eller H, så `bygg-axelfacit.py` avbryter på alla åtta (runda-vevor-1) och facit kvitteras i `grind-undantag.txt` med det skälet. Skriv då bara de axlar källan själv namnger: längd på en girlang (`Girlanglängd`), höjd på en lykta. Lägg inte på ett `(längd × bredd × höjd)` som källan inte säger.
- **Mått i mm skrivs i cm, och varje omräknat tal behöver en rad i `foto-tal.txt`** (`kort tal skäl`), annars faller siffergrinden på 275 när källan säger 2750 mm. Avrundade tal (2011 mm till 201, 1828 mm till 183, 1524 mm till 152) står med sitt skäl.
- **VEVOR-syskon har samma importerade SKU.** Tre girlanger delade `FP-julgirlang-2750-mm` och båda lyktorna `FP-12-st-dekorativa`, så `sku.tsv` behövs även på enkla sidor och SKU:n bär det som skiljer dem åt (längd, LED-antal, färg).
- **Batterier avläses ur fotot.** Källan sade `AAA-batteridesignen` och `LR44-batteridesignen`; antalet (tre per lykta) räknades i batterifacket på bild 4. Båda talen står i `foto-tal.txt`.
- **Källan motsäger sig om inomhus och utomhus på lyktorna** (både `inomhuslyktor` och `utomhuslyktor`). Texten påstår ingetdera. LED-girlangerna får inte heller `vattentät` eller utomhusbruk, bara trion utan LED, där källan säger det om materialet.
- **`gh workflow run` fungerar i molnsessionen** trots att `gh auth status` säger att GH_TOKEN är ogiltig. Verifiera med `gh run view` att körningen blev `success`; en andra chatt kan ha en egen körning i kön.
