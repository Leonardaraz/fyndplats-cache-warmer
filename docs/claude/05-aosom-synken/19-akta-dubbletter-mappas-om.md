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

**Leonards beslut 2026-11-04: AliExpress-sidor vars vara finns hos Aosom mappas om, och blir
regelpriset efter ommappningen mer än 40 % lägre än butikspriset sänks priset så att
prissynken tar raden.** Annars stoppar `MAX_PRISANDRING_PCT = 40` (`lib/aosom/sync.ts`) den,
och den ligger i `varningar` varje varv utan att något skrivs. Sänk priset för hand, eller
godkänn hoppet med `godkann_pris` (Wix-id) i en riktad `aosom-sync` utanför synkfönstret.
Ta regelpriset ur `roundPrice(1,2 × landad kostnad, "charm99")` i en privat läsning av
mappningsraden och skriv aldrig kostnaden i en logg. Mätt samma dag på Mercedes-sidan
`973743f8`, som ommappades till Aosom: regelpriset 1 369 kr mot butikens 1 399 kr (−2 %),
alltså inget hopp, och nästa pris-varv tar den av sig själv. `polish-mapping.yml` (`las`)
säger ändå *PRISGRINDEN FALLER* efter en ommappning, eftersom priset i Wix ännu inte följer
regeln: det är ingen varning om att något är fel, bara att synken inte hunnit.

☠️ **En AliExpress-sida vars Aosom-artikel redan sitter som färg på en sammanslagen sida går
inte att mappa om** (`skun_upptagen`). Bekräftat 2026-11-04 på AliExpress-sidan
`e6134e61`, som motorn nekade mot både den röda och den svarta Mercedes-artikeln. Sidan är
en dubblett av en färg som värden redan säljer, ofta dyrare (AliExpress-eltraktorn
`e6615ddd` kostar 3 099 kr mot 2 299 kr för värdens gröna), och löses genom att den
pensioneras med 301 till värdens färg, inte genom ommappning. Leonard sa ja till det samma dag
(2026-11-04), och de tre sidorna `e6615ddd`, `065eb3e8` och `e6134e61` pensionerades så här:
`redirect-add.yml` med `batch` och `force=true` FÖRST (källan är fortfarande synlig, och en rad
som skrivs efter avpubliceringen ger en lucka med 404), med målet `/produkt/<värdens slug>?variant=<
värdens variant-id för färgen>` så att den som kommer via en gammal länk ser rätt färg; sedan
`PATCH /stores/v3/products/<id>` med `{ product: { revision, visible: false }, fieldMask: { paths:
["visible"] } }` och återläsning. Före det: läs hela omdirigeringslistan (`redirect-add.yml` utan
indata) och sök efter sidans adress, så att ingen äldre 301 pekar på den, och sök igenom
ordrarna efter produkt-id:t. Mappningsraden rörs inte och sidan märks inte `rejected`, för
`pensionerade-radera` raderar bara Aosom-rader och en AliExpress-rad ska inte hamna i den kön.
☠️ **Recensionerna följer INTE med.** Motorns sammanslagning är det enda som kopierar
omdömen, och den vägrar en AliExpress-givare (`utkast_ej_aosom`). De tre sidorna hade 13, 4 och
cirka 4 omdömen, som nu ligger kvar oanvända på de dolda sidorna (inget raderades). Ett verktyg
som kopierar dem till värden saknas och kräver en kodändring i motorn. Butikens cache svarar
fortfarande 200 på de gamla adresserna i upp till en timme, så mät 308 efteråt.
Två rader i feeden med identisk titel (eltraktorernas 12 V-rader)
går inte att skilja med `feed_sok`, och artikelnumret får inte in som workflow-input.
En vara som Aosom inte har i den färgen, som den svarta trehjuliga Hondan `816e745c`
(feeden har bara grön och röd), går inte att mappa om alls och ligger kvar som AliExpress-sida.
