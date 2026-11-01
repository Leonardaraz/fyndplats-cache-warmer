## Recensionerna poleras med produkten (2026-10-30)

Leonard: *"den som polerar produkterna fixar allt o sen fixar recensionerna till
produkten som ett steg"*, och sedan *"recensionerna inte kmr missas"*. Poleringsrundan har
steg 7, Recensionerna (`docs/seo-polish-runbook.md`). Workflowen **"Polering —
recensionerna till rundans produkter"** (`polish-recensioner.yml`, `las` · `torr` ·
`skriv` · `kvar`) → `/api/admin/polish-recensioner` → `lib/reviews/polering.ts`. `las`
committar `recensioner-kalla.json` till rundans katalog, och rundan beslutar varje
väntande recension i `recensioner.json` (översatt publiceras, dold avvisas).

Mätt 2026-10-30 i `FyndplatsImportedReviews`: 5 504 VEVOR-produkter med 33 306 väntande
recensioner (högst 15 per produkt) och 329 Aosom-produkter med 1 759 (högst 30). Av
Aosom-produkterna var 263 publicerade, med 1 451 väntande recensioner som ingen beslutat
om: ingen hade gått tillbaka till dem efter rundorna.

Tre spärrar mot att recensionerna missas:

1. ☠️ **"Polering — skriv en runda till Wix" prövar recensionerna för varje produkt i
   planen** innan den skriver något, och `skriv` vägrar om en produkt har väntande
   recensioner utan beslut. En saknad `recensioner.json` räknas som inga beslut. Efter
   produkterna skriver den recensionerna (också i läget `stampla`).
2. ☠️ **En VEVOR-recension bär sin artikel** (`vevorArtikel`, satt av importen sedan
   2026-10-30). Utan den läses artikeln ur avläsningarna, som bara bär sidans senaste
   recensioner, och en äldre rad blir okänd när VEVOR fått nya.
3. **Restlistan** (`kvar`): publicerade produkter med väntande recensioner att besluta,
   för en egen recensionsrunda. Den fångar recensioner som blir väntande efter poleringen.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Varje väntande recension på rundans produkter får ett beslut.** Prövningen gäller
   rundans alla produkter (`produkter` i anropet), inte bara dem i `recensioner.json`.
   Annars hade en glömd produkt gått igenom.
2. ☠️ **Allt eller inget.** Faller ett beslut i prövningen skrivs ingenting i hela anropet.
3. ☠️ **Besluten gäller produktens egen rad.** Samma id kan finnas på flera produkter.
4. ☠️ **Butikens egna kunders omdömen rörs inte.** Leonard godkänner dem i `/admin/reviews`.
5. ☠️ **På en VEVOR-produkt beslutas bara recensioner om produktens egna artiklar.**
   En produkt räknas som VEVOR när en av dess recensioner kommer från VEVOR. Artikeln är
   radens egen, annars avläsningarnas (`artikelPerText`), som verktyget för recensioner
   om en annan artikel läser. En rad om en annan artikel, eller vars artikel inte går att
   avgöra, tas inte med och kan inte beslutas här. Skälet: en översättning publicerar
   raden, och det verktyget rör aldrig en publicerad rad.
6. **Svaret och loggen bär bara kort, id, antal och skäl.** Läsningen bär
   originaltexterna, som redan är publika hos leverantören, utan namn och land och med
   artikelnummerformer redigerade.
7. ☠️ **Ett namn i originaltexten redigeras bort före commit** (`utanNamn`: recensentens
   eget namn, eller ett namn efter en hälsning sist i texten), och raden kan bara döljas.
   `recensioner-kalla.json` committas till det publika repot, och husets regel sedan
   2026-09-30 är att en sådan recension stryks.

Granskningen 2026-10-30 lade till två spärrar till: återläsningen fäller en publicerad
recension vars foto ligger kvar hos leverantören (hemflytten föll), och workflowen vägrar en
`ids.tsv` där kolumn 2 inte är produktens Wix-id (29 äldre rundor har priset där, och då
hade läsningen tyst gett noll recensioner).

Grinden för översättningen är `validateTranslation` (samma som `/admin/reviews`) och
husets stil (`stilfel`): inga tankstreck, semikolon, citattecken, tre punkter eller
AI-fraser, och inga marknadsplatser, leverantörer, budfirmor, priser, säljare eller
artikelnummer. Skrivningen läser tillbaka varje rad och säger till butiken
(`meddelaButikenOmRecensioner`), så att produktsidan visar recensionerna direkt.

Restlistan läser de väntande per produkt i ett anrop (`vantandePerProdukt`, Wix
aggregering sorterad på grupperingsfälten) och synligheten bara för de produkterna,
hundra åt gången. ☠️ Den kastar om Wix svarar om en produkt utanför frågan: ett filter
som inte bet hade gett en restlista som är tom av fel skäl.
