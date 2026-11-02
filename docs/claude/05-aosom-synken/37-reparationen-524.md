### Reparationen rapporterade 524 av 524 lagade. 214 produkter saknade ändå bilder

Första skarpa bildfixen (2026-08-27, 12 varv) sa **524 trasiga, 524 lagade, noll
missar**. Mätt i Wix efteråt: **214 av 750 Aosom-utkast hade fortfarande färre än
fem bilder**, 207 av dem exakt fyra.

Stickprov visar samma sak varje gång: **fem filer ligger uppladdade och `READY` i
Media Manager, och noll av dem sitter på produkten.** Produkten bär kvar sina
gamla fyra bilder och sin gamla revision. Mönstret är jämnt över hela körningen
(22:01 → 22:38), så det är ingen degradering över tid.

Fyra förklaringar är **uteslutna med mätning**, inte med resonemang:

| hypotes | motbevis |
|---|---|
| Fel kroppsform i `setProductMedia` | Manuell PATCH med exakt samma kropp tog en produkt 4 → 5 |
| Föråldrad revision | Wix svarar **409 `INVALID_REVISION`** och funktionen kastar |
| Dubbletter i källan | De fem källbilderna har fem olika md5 |
| För få bilder i feeden | Feeden ger fem rena positioner på 6 014 av 6 057 rader |

Mekanismen är alltså **fortfarande oförklarad**. Det som däremot är lagat är att
felet var osynligt: `runImageRepair` läser nu tillbaka produkten efter varje
skrivning och räknar `reparerade` först när antalet bilder FAKTISKT steg. Tar
skrivningen inte blir det `misslyckade` + en rad i `errors` med artikelnumret.
Workflowen läste heller aldrig `misslyckade` — den gör det nu, och skriver ut
`errors` per varv.

☠️ **Ett svar utan fel är inget kvitto.** Tredje gången samma klass av bugg biter
här: recensionsbilderna (2026-08-22), `Promise.allSettled` i `media.ts`
(2026-08-27), och nu en skrivning som svarar OK utan att göra något. Regeln är
densamma varje gång — **räkna efter, lita inte på svaret.**
