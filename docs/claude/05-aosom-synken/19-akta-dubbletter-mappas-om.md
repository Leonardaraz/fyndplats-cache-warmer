### Äkta dubbletter mappas om till Aosom (Leonards regel 2026-09-03)

Hittas en äkta dubblett under poleringen — samma fysiska vara som både en
AE-inköpt sida och en feed-importerad — ska sidan vi BEHÅLLER peka om till
Aosoms artikelnummer, och den andra pensioneras. `lib/aosom/remap.ts` +
`/api/admin/aosom-remap`, workflowen **"Dubbletter — mappa om en produkt till
Aosom"** (lägen `plan` · `byt`).

☠️ **Lämna `sku` TOMT och ange Aosom-utkastet som dubblett (2026-09-24).** Rutten
läser då artikelnumret ur utkastets mappningsrad (`väljRemapSku`). Tidigare var
numret en obligatorisk workflow-input och skrevs ut två gånger i den PUBLIKA
loggen, alltså publicerade varje ommappning kopplingen mellan vår sida och
Aosoms nummer. Olika nummer i anropet och på dubbletten vägras.

Ommappningen skriver `supplier`, `supplierProductId`, `sourceUrl`,
`aosomFreightShare` och variantens `costUsd`/`landedCostSek` — **aldrig priset**.
Det är Leonards beslut, och en ommappning som tyst räknade om kundpriset hade
dessutom gjort planen omöjlig att granska: nu står den nya marginalen i planen
och prisändringen blir ett eget beslut.

Sex hinder, och de ska inte tas bort:

1. ☠️ **`MIN_REMAP_MARGIN_PCT = 5`.** Aosoms SE-frakt är per kolli och viktstyrd
   — median 40 % av inköpet, och på 1 283 rader kostar frakten mer än varan. En
   vara som gick ihop mot AE:s levererade EU-lagerpris kan alltså gå med förlust
   hos Aosom vid oförändrat kundpris. Samma tal som `MIN_FAILOVER_MARGIN_PCT`
   och av samma skäl, men egen konstant: talet är en delad avvägning, inte en
   delad sanning.
2. ☠️ **En flervariantssida vägras.** En Aosom-rad ÄR en artikel; alla varianter
   hade pekat på samma nummer och kunden som väljer den andra färgen får fel
   vara hem. Sådana sidor kräver en SKU per variant — ett annat jobb.

   Undantaget sedan 2026-09-28 är `behall_variant` (Leonard: *"radera
   aliexpress varianter som inte finns och behåll den som finns hos aosom"*).
   Då kollapsas sidan först till den variant som finns hos Aosom
   (`lib/aosom/remap-kollaps.ts`), och ommappningen gäller den ensam. Wix
   skrivs först, med varianten ur produktens egen GET, och läses tillbaka.
   Mappningen skrivs bara om kollapsen tog, och en omkörning ser att Wix redan
   är klar. En sida med obehandlade ordrar vägras (`oppna_ordrar`): en order
   på en borttagen färg hade annars beställts som den behållna. Bilderna och
   texten rörs inte.
3. ☠️ **Ett artikelnummer som redan sitter på en annan produkt vägras** — annars
   skapar ommappningen exakt den dubblett den finns för att ta bort.
4. **Rader som inte går att skicka till Sverige vägras** (`isShippableToSe`).
5. **Torrkörning är default**, och det finns **ingen kör-allt-flagga**. Paret
   (wix-id, artikelnummer) är en människas bedömning; listan ÄR kvitteringen.
6. ☠️ **Raden slås ihop, ersätts inte** — och allt som beskrev den gamla
   AE-listningen nollas (`shipsFromCountries`, `hasEuWarehouse`, `supplierName`,
   fraktbarhetsverdikten, `reviewsCheckedAt`). En rad byggd från grunden tappar
   `draftStatus` och försvinner ur `/admin/queue` helt.

Rutten **läser tillbaka raden efter skrivningen** och svarar 500 om den inte bär
det nya artikelnumret. Åttonde gången huset lär sig samma sak: ett svar utan fel
är inget kvitto.

AE-synkens tillstånd (`listingStatus`, strike-räknarna) bor i synkens eget state
per Wix-produkt och överlever bytet. Det är ofarligt just för att spärren är en
TYP: `supplier: "aosom"` gör `isAliExpressMapping` falsk, AE-synken hoppar över
raden och läser aldrig tillståndet igen. Aosom-synken äger raden från nästa varv.

Dubbletten **raderas inte vid ommappningen** — den får `draftStatus: "rejected"`
och `needsAiPolish: false`. En radering går inte att ångra om matchningen visar
sig vara fel, så utkastet ligger kvar i minst fjorton dygn. Därefter raderas det
med ett eget verktyg, se *Pensionerade utkast raderas efter fjorton dygn*. Det
osynliga utkastet syns inte för någon kund, men dess bilder tar plats i Wix.
