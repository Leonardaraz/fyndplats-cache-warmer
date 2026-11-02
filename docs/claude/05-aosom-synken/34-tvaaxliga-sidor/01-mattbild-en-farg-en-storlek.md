#### Det som inte går att rätta med länkar: en måttbild som visar EN färg i EN storlek

Leonards nästa meddelande samma natt: *"specifikationsbilderna är inte helt rätt på den. Om jag väljer storlek 45 liter så finns 60 liter specifikation bild med och om jag väljer 60 finns 45 med."* Det är
fem bilder som var och en visar en färg i en storlek: svart 45 (5), svart 60 (7), silverkortet för 60 (9), ett silverfoto med 60-litersmåtten inritade (10) och silvertunnans måttbild för 45 (14).

Butiken visar för en kombination bilder som **ägs** av färgens eller storlekens val, plus de olänkade. Sidans egen data säger det rakt ut: `imageOwners` är en karta från bild till ETT val (det första som
länkar den), `variantTable[].image` är Wix bild för varje variant och `variantAxes` är väljarna. Hämta sidan med `curl`, byt `\"` mot `"` och läs dem för att se vad butiken kommer att visa utan webbläsare.
Det finns ingen skärning: en bild som ägs av *45 liter* syns under båda färgerna, och en som ägs av *Silver* syns under båda storlekarna. Wix egen dokumentation för V1 säger samma sak (*"media items can only
be set for choices within one option at a time"*). Det som går är bilder som är **färgneutrala och storleksspecifika**, länkade till storleken, och färgfoton som är storleksneutrala, länkade till färgen.
