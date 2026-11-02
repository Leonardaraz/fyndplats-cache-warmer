## Recensioner: hämtas server-side från AliExpress, översätts i chatten

Recensionskedjan (filtrering → `FyndplatsImportedReviews` → moderering i
`/admin/reviews` → produktsidans "Kundrecensioner") har funnits sedan 2026-07-08 men stod **tom på
876 produkter** fram till 2026-08-16. Orsaken var inmatningen, inte kedjan:

- Enda vägen in var tilläggets DOM-skrapa (`extension/content.js → scrapeReviews`),
  och AE **lazy-laddar** recensionssektionen — klickar man importera högst upp på
  sidan har den oftast inte renderats, så skrapan returnerade `[]`.
- **Bulk-/CSV-importen rör aldrig recensioner** (`lib/bulk-import/worker.ts` har
  ingen webbläsare). Katalogens senaste ~800 produkter kom in den vägen.

`lib/aliexpress/reviews.ts` hämtar dem nu i stället från AE:s feedback-endpoint
(ren JSON, inget tillägg, $0). Två äkthetsspärrar sitter i mappningen och ska inte
tas bort: recensioner som AE själv markerar som **AI-genererade** (`aigc`) och
sådana som inte är publicerade hos AE (`status !== "1"`) släpps aldrig igenom.
Anonyma konton ("AliExpress Shopper") får inget namn vidare — annars blir varenda
rad "A.S." och sidan ser förfalskad ut.

### Vad som faktiskt gallrar — mätt 2026-08-25

Den vanliga gissningen är att stjärnfiltret stryper hämtningen. Det gör det inte.
Mätt över nio verkliga AE-listningar (204 råa recensioner):

| Regel | Kvar | Kostnad |
|---|---|---|
| `minRating: 3` | 199/204 | **2 %** — nästan allt hos AE är redan 3+ |
| `minLength: 50` | 126/204 | **38 %** |
| spam + dubblett + utlandsleverans | 116/204 | 5 % |
| `DEFAULT_MAX_PER_PRODUCT: 8` | 55/116 | **53 % av det godkända** |

Samtidigt visade **432 av 908 publicerade produktsidor noll recensioner**. Bristen
är alltså BREDD (produkter utan någon recension), inte DJUP (fler per produkt) —
att höja taket från 8 hjälper bara de ~40 produkter som redan har flest.

Två ändringar följde, båda riktade mot bredden:

- **`AE_REVIEW_DEFAULT_PAGES` 2 → 4.** Två sidor är 40 råa; loopen tog slut mitt i
  högen på listningar med fler. Självbegränsande: `fetchAeReviews` bryter på
  `hasNext`, så en tunn listning kostar fortfarande ett anrop.
- **Räddningssvepet (`REVIEW_RESCUE_MIN_LENGTH = 25`).** Gav 50-teckengolvet
  INGENTING görs urvalet om med 25. Golvet sänks aldrig när något klarade 50 — en
  kort äkta recension slår ingen recension, men bara när alternativet verkligen är
  ingen. Ett `minLength` som anroparen satt själv rivs inte (det är ett beslut, och
  överdraget finns för att svepa upp det ett gammalt filter slängde).

Räddningssvepet går INTE förbi någon annan spärr: betyg, spam, dubbletter och
utlandsleverans gäller oförändrat i båda svepen.

Kvar som medvetet orört: taket på 8 i backfillen. Fler hämtade recensioner blir
inte fler synliga — de blir en längre `pending`-kö att skriva om för hand.

### Så körs den

| Vad | Anrop |
|---|---|
| En produkt | `POST /api/reviews/import` med `{ wixProductId }` — utan `reviews` hämtar rutten själv |
| Hela katalogen | `GET /api/cron/review-backfill` |

`review-backfill` är **torrkörning som default** — utan `?dryRun=false` skrivs
ingenting, du får bara siffrorna. Parametrar: `limit` (produkter per körning,
default 25), `maxPerProduct` (default 8), `includeExisting`, `onlyPublished`,
`ignoreCheckedAt`.

Rutten är **inte schemalagd**. Den var det en kort stund 2026-08-16, men Leonard
valde bort maskinöversättning helt ("skit i deep l") — texterna skrivs i stället
om av Claude i chatten, gratis, och sparas via `/admin/reviews`. En
översättnings-cron i bakgrunden hade motverkat det beslutet. Vill du tillbaka
till schemalagd hämtning: lägg in cron-raden igen — hämtningen i sig är gratis.

Backfillen stannar dessutom själv efter **240 s** (`timeBudgetMs`, mot ruttens
`maxDuration` 300 s). Varje recension kan dra upp till tre mediaimporter med
retry, så en körning hann annars dödas mitt i en produkt.

Körningen **konvergerar**. Varje produkt AE svarat på stämplas med
`reviewsCheckedAt` i mappningen — även när AE inte hade några recensioner. Utan
den stämpeln skulle de ~40 % recensionslösa produkterna hämtas om vid varje
körning i all evighet. Produkter som redan har recensioner hoppas över helt, och
en **strypt** hämtning stämplas aldrig (då hade rate-limiting dolt produkten i en
månad). Omkontroll efter `REVIEW_RECHECK_DAYS` (30) — nya recensioner dyker upp
hos AE över tid.

### Bilderna flyttas hem — men vid olika tillfällen i de två vägarna

Kundbilder får aldrig ligga kvar på leverantörens domän när de visas för kund.
Hemflytten sker i `lib/wix/media-import.ts`, men **de två inmatningsvägarna gör
det vid olika tillfällen**, och den skillnaden har lurat mer än en läsare:

| Väg | Bilden flyttas hem |
|---|---|
| Kön (`review-queue` → `queueReviewsForProduct`) | **Vid publicering** — raden sparas `pending` med AE-adressen kvar |
| Direktimport (`/api/reviews/import` → `importReviewsForProduct`) | **Direkt vid skrivning** |

En `pending`-rad som pekar på `aliexpress-media.com` är alltså **normalt**, inte
ett fel. Att flytta hem bilder för rader som kanske aldrig godkänns vore slöseri
med både anrop och medialagring. Grinden sitter i `lib/store/reviews.ts`:
`isVisibleStatus(status) ? await withOwnImage(review) : review`.

Mätt 2026-08-22: 203 synliga recensioner med bild, **alla** på vår egen domän;
31 rader med AE-adress, **noll** av dem synliga. Kontrollera alltid `status`
innan du drar slutsatsen att mediaimporten är trasig — annars felsöker du
designen.

**Misslyckas uppladdningen behålls källadressen** (2026-08-22). Direktimporten
slängde tidigare bilden tyst: ingen logg, `hasImage:false`, och källadressen
sparades ingenstans — felet gick varken att upptäcka eller reparera, eftersom
`repairImages` bara letar efter rader som FORTFARANDE bär en leverantörs-URL.
Nu räknas missarna i svarets `bildmissar` och lagas av nästa repairImages-körning.

### Betygen skickas INTE till Google

Butiken (`headless-site`) har `PRODUCT_REVIEW_SCHEMA`, **default av**. Recensions-
texten visas för kunden, men `aggregateRating`/`Review` läggs inte i produktsidans
JSON-LD medan omdömena är AliExpress-köpares. Googles riktlinjer för review
snippets vill ha betyg från sajtens egna användare. Sätt `=on` först när datan är
förstahands (Trustpilot Product Reviews / egna kundrecensioner). Se
`lib/review-schema.ts` i butiksrepot.

### Översättningen görs i chatten — DeepL är borttaget (2026-08-19)

Kedjan har **ingen översättningstjänst** längre. `lib/translate/` finns inte;
`DEEPL_API_KEY` och `DEEPL_MONTHLY_BUDGET` läses inte av någon kod och kan tas
bort ur Vercel. Wix-kollektionen `FyndplatsTranslationUsage` skapas inte längre
av `scripts/ensure-reviews-collection.mjs` och kan raderas i Wix.

Det var redan så det fungerade i praktiken — cronen var avstängd sedan
2026-08-16 — men koden bar kvar API-nyckel, månadsbudget, ett användningslager
och en **tyst fallback som sparade originaltexten** när budgeten tog slut.

Följdändringen är den viktiga: importerade recensioner **auto-godkänns inte
längre**. De sparas som `status: "pending"` med källtexten i både `textOriginal`
och `textSwedish`, och blir svenska när någon skriver om dem i `/admin/reviews`
(`editReviewText` sätter `edited` → först då syns de publikt). Samma regel som
för butikens egna kundomdömen. Alternativet — direktpublicering utan
översättare — är exakt vad den gamla budget-fallbacken gjorde: engelska omdömen
på en svensk produktsida.

Kostnaden är därmed **noll**, i både credits och tecken. Kvar som mått är
`chars` per produkt i backfill-svaret: hur mycket text som väntar på att skrivas
om, inte vad något kostar. Mätt 2026-08-16 på 40 slumpade publicerade produkter
(692 publicerade mappningar av 876): träffkvot 60 %, ~240 tecken/produkt vid
tak 8 — alltså ~166k tecken för hela butiken. Cirka 40 % av produkterna får inga
recensioner alls, mest nya Aosom-EU-listningar som inte hunnit få några hos AE.

### Recensionerna är UTE ur Wix — hela migreringen klar (2026-09-04)

**Taket är recensionerna.** Efter att drift-datan flyttade 2026-08-31 ligger Wix
på ~3 355 av 4 000 rader, och `FyndplatsImportedReviews` är **2 514 av dem** —
75 % av allt som är kvar. Aosoms egna produktrecensioner är uppmätta till
~9 500 texter (`/api/cron/aosom-reviews`) och får aldrig plats så länge raderna
bor där. Recensionerna är inte offret för taket, de ÄR det.

⚠️ **Översättningen är däremot INTE flaskhalsen**, tvärtemot vad man kunde tro:
2 421 av 2 514 recensioner är redan publikt synliga, och översättningskön är
**7 rader**. Chattflödet via `review-translate.yml` fungerar och är mätt.

| steg | vad | frigör taket? |
|---|---|:---:|
| 1 | `reviews`-tabell + `PostgresReviewStore` + spec i `ATT_KOPIERA` | nej |
| 2 | kopiera 2 514 rader, verifiera kanoniskt | nej |
| 3 | `REVIEWS_BACKEND=postgres` | nej |
| 4 | butiken läser via API, inte Wix Data direkt | nej |
| 5 | radera Wix-raderna | **ja** |

**Alla fem är gjorda.** Steg 5 kördes 2026-09-04: **2 514 granskade, 2 514
raderade, noll fel** — exakt det tal torrkörningen granskat per nyckel minuten
innan.

Kvittot efteråt, mätt och inte uträknat: `/api/review-aggregates` ger
oförändrat **512 produkter / 2 421 synliga omdömen**, den dynamiska
`/api/reviews/<id>` svarar med 42 omdömen på katalogens mest recenserade
produkt, och produktsidan renderar sina tre omdömen med snitt 4,7.
`betyg-diff` svarar **EJ TILLÄMPLIG (`kallanTomd`)** i stället för att bli rött
— tömd-källa-läget byggdes två dygn tidigare för precis den här dagen.

⚠️ **Marginalen mot taket är HÄRLEDD, inte färskmätt.** Wix hade ~3 355 rader
2026-09-01, varav 2 514 recensioner; efter raderingen är ~841 kvar. Bara
recensionsdelen av det talet är mätt idag. Aosoms ~9 500 recensionstexter
belastar dessutom inte längre taket alls — de skrivs till Postgres.

☠️ **Vägen tillbaka är stängd.** Recensionerna finns bara i Postgres, och Neons
point-in-time-återställning är det som gäller.

**Steg 2 är gjort och mätt:** 2 514 lästa, 2 514 skrivna, noll fel, och
verifieringen ger `reviews wix=2514 pg=2514 avvikande=0`.

**Steg 4 är gjort och mätt i drift.** Butiken läser inte längre Wix Data för
recensioner: produktsidan går mot `/api/reviews/<productId>` och listningarnas
kort mot `/api/review-aggregates`. Kvitto på en skarp, OCACHAD rendering
(`?cb=`, `x-vercel-cache: MISS`) samma dag:

| | |
|---|---:|
| produkter med betyg i aggregatet | 512 |
| summa synliga omdömen | **2 421** |
| kort med stjärnor på `/alla-produkter` | 69 |
| produktsidan | 3 omdömen, snitt 4,7 |

Talet 2 421 är exakt det som mättes oberoende mot Wix (2 421 av 2 514 synliga),
alltså räknar de två vägarna samma sak.

⚠️ **Verifiera ALLTID med cache-bust.** ISR-cachen ligger en timme, så en vanlig
hämtning direkt efter deployen serverar den GAMLA sidan — och den ser ut precis
som en fungerande ny. Första mätningen efter merge "visade" att härkomsten inte
renderades; den läste cachad HTML från förra bygget.
`/api/admin/revalidate?tag=reviews` tömmer alla produktsidor på en gång (kräver
`ADMIN_SECRET`), annars löser timmen det av sig själv.

☠️ **`REVIEWS_BACKEND` är FRIKOPPLAD från `STORE_BACKEND`, och default är
`wix-data`.** Ett första utkast lät `getReviewStore()` läsa `STORE_BACKEND` —
produktionen står på postgres, så lagret hade bytts i samma sekund koden
deployades, in i en TOM tabell: `/admin/reviews` hade slutat se de 2 514
raderna, nya recensioner skrivits dit ingen läser, och butiken fortsatt läsa
Wix. Ingenting hade kastat. Samma familj som `/api/tracking-events`
2026-09-01 — en läsare som blir TOM syns varken i en kodaudit eller i en
felräknare.

☠️ **Affärslogiken DELAS mellan lagren** (`normaliseraFörSkrivning`):
statusfallbacken (`pending`, aldrig `approved`) och hemflytten av kundbilder är
regler om RECENSIONER, inte om databasen. En tvilling hade betytt att en
publicerad recension pekar på leverantörens CDN i det ena lagret men inte i det
andra, beroende på vilken env-variabel som råkade vara satt.

**Härkomsten BÄRS av varje rad, men VISAS inte** (rättat 2026-09-03). Den
renderades en kort stund: upplysningsstycket ovanför listan och etiketten
"Importerat omdöme" per rad. **Leonard tog bort båda samma dag** (#596 i
butiksrepot) — ingen informationstext om var omdömena kommer ifrån. Det är hans
beslut som butiksägare, och den här raden påstod motsatsen i ett dygn.

Vad som står kvar, och som är den gräns som gäller:

☠️ **"✓ Verifierat köp" får ALDRIG sättas på en importerad rad.** I den här
koden betyder etiketten ett köp i VÅR butik, verifierat med token per order.
Fotnoten under listan ("skrivna av verifierade köpare") står kvar med flit —
den säger verifierade KÖPARE av varan, inte kunder hos oss.

☠️ **Okänt ursprung blir ALDRIG "vår kund".** Alla rader före 2026-08-17 saknar
fältet och är AE-importer; en fallback på `customer` hade varit överträdelsen
själv. Testerna i `lib/review-source.ts` låser den riktningen, och de gäller
oförändrat — det är bara PRESENTATIONEN som togs bort, inte klassificeringen.

⚠️ Bakgrunden till varför etiketterna byggdes står kvar här för den som tar upp
frågan igen: artikel 7.6 UCPD kräver upplysning om huruvida vi säkerställer att
omdömena kommer från konsumenter som faktiskt använt varan, och bilaga I §23b
förbjuder att presentera andras omdömen som egna kunders. Bedömningen av om
fotnoten ensam räcker är Leonards.

### ☠️ Och en SKRIVARE som skulle blivit föräldralös (2026-09-02)

Hittad genom att leta efter kvarvarande Wix-läsare inför steg 3 — och det var
inte en läsare. Butikens **`/api/omdome`**, dit kunden skriver sitt eget omdöme
efter ett verifierat köp, gjorde `POST /data/v2/items/save` RAKT mot
`FyndplatsImportedReviews`.

Det var rätt så länge recensionerna bodde där. Efter växlingen läser allt ur
Postgres — och kundens omdöme hade fortsatt hamna i Wix, där ingenting läser.
Raden hade aldrig synts i `/admin/reviews`, aldrig kunnat godkännas, aldrig
renderats. Wix svarar 200, så varken kunden, loggen eller en felräknare hade
märkt något.

Spegelbilden av `/api/tracking-events`: där blev en LÄSARE tom, här försvinner
en SKRIVNING. Och dyrare, för kundomdömena är de enda **förstahands**omdömena —
de som bär "✓ Verifierat köp" och som ensamma någonsin får bli
`aggregateRating` mot Google.

☠️ **Kodauditen kunde inte se den.** `store-access-audit.test.ts` läser DET HÄR
repot; skrivaren bor i butiksrepot. Grinden finns därför nu på båda sidor
(`lib/review-store-access.test.ts` på `headless-site`), verifierad genom att
återinföra buggen — den fäller och namnger filen.

Butiken postar nu till **`/api/reviews/customer`** med `REVIEW_INGEST_SECRET`
som Bearer-token. Tre egenskaper som inte ska tas bort:

1. ☠️ **Valideringen ligger kvar i butiken.** Den äger `REVIEW_TOKEN_SECRET`,
   verifierar tokenets signatur, kontrollerar att produkten ingick i ordern och
   att bildadresserna pekar på vår egen Wix Media. Att flytta hit hade betytt
   tvillingar av `verifyReviewToken`, `validateCustomerReview` och
   `buildCustomerReviewRow`. Rutten är tunn: hemligheten är förtroendegränsen.
2. ☠️ **`status` och `source` TVINGAS i rutten**, de läses aldrig ur kroppen.
   En anropare som kunde sätta `approved` hade lagt text direkt på
   produktsidan förbi modereringen, och `source` styr både etiketten och
   UCPD-upplysningen.
3. ☠️ **Fail-closed i båda ändar.** Saknas hemligheten svarar motorn 503 och
   butiken 503 — aldrig 200. Att svara kunden "tack!" på ett omdöme som aldrig
   lagrades är det enda utfall som är sämre än ett fel.

⚠️ **`REVIEW_INGEST_SECRET` måste stå i BÅDA Vercel-projekten med samma värde,
och vara satt innan `REVIEWS_BACKEND` växlas.**

### ☠️ Auditen före raderingen: tre scripts, och grinden var blind för dem

Auditen inför steg 5 hittade **ingen** kvarvarande läsare i `lib/` eller `app/`.
Den hittade tre i `scripts/`, och skälet stod i grinden själv:
`store-access-audit.test.ts` filtrerade bort hela `scripts/`.

- **`katalogkoll.mjs`** läste recensionerna direkt ur Wix. Med kollektionen tömd
  hade **varje** publicerad sida sett ut att sakna recensioner, och `--apply`
  hade köat en AE-hämtning för hela katalogen på ett falskt underlag — ~950 i
  rapporten där sanningen är ~440. Läser nu aggregatet, och **kastar** hellre än
  tolkar ett svar utan `betyg`-fält som noll.
- **`backfill-product-hashes.ts`** och **`backfill-suppliers.mjs`** läste
  `FyndplatsMappings`, tom sedan 2026-09-01. Hash-backfillen rapporterade
  "0 mappningar med AE-id" och hashade varje produkt utan sitt AliExpress-id —
  dubblett-detektorn tappade sin exakta matchning, tyst, i tre dygn.

**Regeln: ett script är inte mindre farligt än en rutt — det är farligare, för
det körs av en människa som tror på siffran den skriver ut.** Undantaget är
borta ur grinden.

### Den spärr som faktiskt skyddade raderingen

Recensionerna har **inget retention-fönster**, så `beslutaSida` kan aldrig
skriva av en saknad rad som "utgången": en enda Wix-rad som inte fanns i
Postgres hade avbrutit hela sidan. Torrkörningen granskade alla 2 514 utan att
avbryta — per-nyckel-bevis, inte en radräkning. Ett test låser riktningen.

### Historik: så såg ordningen ut

1. **Steg 3 — `REVIEWS_BACKEND=postgres` i Vercel.** Butiken läser via API:t
   oavsett vilket lager som svarar, så växlingen är osynlig för kunden. Först
   när den är gjord OCH verifierad släpps `FyndplatsImportedReviews` ur
   `ALDRIG_RADERA` och steg 5 blir möjligt. Spärren står kvar tills dess med
   flit: den är det som hindrar en radering av rader som fortfarande är facit.

   ☠️ **Kör `betyg-diff` FÖRE växlingen** (workflowen "Migrering — kopiera
   drift-datan till Postgres", fjärde läget → `/api/admin/review-backend-diff`).
   Det verifierade radantalet räcker INTE som kvitto här: aggregatet filtrerar
   på `status` och `rating` och grupperar per produkt, så en status av fel typ
   eller ett `rating` som blivit sträng i JSONB passerar en radräkning och
   fäller stjärnorna på varenda produktkort. Rutten instantierar BÅDA lagren
   direkt — aldrig via `getReviewStore()`, som bara returnerar det env pekar på
   och därmed hade jämfört ett lager med sig självt.

   **Körd och grön 2026-09-02**, före växlingen: `wix 512 produkter, 2 421
   synliga omdömen` mot `postgres 512 produkter, 2 421 synliga omdömen`, noll
   avvikande. Samma tal som butiken renderar. Växlingen är därmed mätt ofarlig
   i stället för antagen — kör läget en gång till EFTER den, då ska talen vara
   oförändrade.

   ☠️ **Svaret bär `aktivtLager` — vilket lager som FAKTISKT servar.** Efter
   växlingen ger `/api/review-aggregates` exakt samma tal ur båda lagren; det
   är hela poängen med att migrera bakom ett interface, och samtidigt skälet
   till att växlingen annars är omöjlig att verifiera utifrån. Utan fältet vore
   "steg 3 är gjort" ett antagande om att en deploy plockat upp en variabel.
   ⚠️ En env-variabel binds vid DEPLOY, inte när den sparas — en satt variabel
   utan efterföljande deploy ändrar ingenting, och `betyg-diff` såg exakt
   likadan ut i båda lägena innan fältet fanns.

   Två spärrar i den som inte ska tas bort: ett **golv på 100 produkter per
   sida**, för två tomma aggregat är per definition identiska och en fallen
   läsning hade annars rapporterats som "noll avvikelser, växla på"; och ett
   eget **tömd-källa-läge** (`kallanTomd`) för tiden efter steg 5, eftersom en
   jämförelse mot en raderad källa annars hade gjort jobbet rött vid varje
   körning för alltid. Snittet jämförs med 0,1 i tolerans (Postgres avrundar i
   SQL, Wix i JavaScript), antalet exakt.

### Rätta en enskild recension: dölj, ta bort bara fotot, visa igen (2026-10-29)

Tre små verktyg, alla torra som default (`skarp = ja` skriver), alla utan att något
raderas för gott:

- **`recension-dolj.yml`** döljer EN recension (status `rejected`) som letas upp på det
  kunden ser: en bit text, initialer, datum, produkt-id. Återställs i `/admin/reviews`.
- **`recension-foto-bort.yml`** tar bort BARA fotot (eller fotona) från utpekade
  recensioner och lämnar texten, betyget och datumet. Listan bär produkt-id,
  recensions-id och de exakta bildadresserna (hämtas ur `/api/reviews/<produkt-id>`),
  högst 200 rader. Raden kan också ha `"visaIgen": true`, som flyttar en dold
  recension tillbaka till `edited`; en väntande (`pending`) publiceras aldrig. Filen
  ligger kvar i Wix media, men ingen sida pekar på den. Se `lib/reviews/foto-bort.ts`.
  Skarp körning kräver en felfri lista (ett fel i listan = ingenting skrivs).
- Efter varje skarp körning säger båda till butiken att produktens recensioner ändrats
  (`uppdateraProduktsidor(..., { vad: "recensioner" })` mot butikens
  `/api/admin/uppdatera-produkter`).

☠️ **Utan det sista steget ligger en ändrad recension kvar på sidan i sex timmar.**
Mätt 2026-10-29: en dold recension syntes fortfarande 80 minuter efter att den döljts.
Butikens cron `/api/cron/uppdatera-andrade` frågar motorns `/api/review-andringar` var
femte minut, men loggade `recensioner –` på varje rad (det som `andradeRecensioner` ger
när svaret saknas, inte när det är tomt). Orsaken är utredd 2026-10-30: motorns
`/api/review-andringar` svarar 501 så länge recensionerna ligger i Wix Data
(`DRIFTEN_I_WIX`), se *Initialerna: aldrig Q, W, X, Y, Z och aldrig bokstavsordning*.
Därför sker inget förrän säkerhetsnätet (`revalidate = 21600`)
går ut. Wix-vägen hjälper inte: den tömmer produktens post och sida, men inte
recensionshämtningen, som har egen tagg (`recensioner-<id>`). Det som tömmer just den
är `vad: "recensioner"`. Vercels `invalidate_by_tags` hittar inte butikens cache
("CDN Cache Namespace not found") och `revalidateTag("reviews")` gör ~3 700 sidor
inaktuella på en gång, så båda är fel verktyg för en enskild produkt.
⚠️ Ändrar `vad` saknas i en post töms bara produktens egen post. `AndradProdukt.vad` i
`lib/headless/produktsidor.ts` finns just för det här.

⚠️ Verifiera en rättelse mot `/api/reviews/<produkt-id>` (visar ändringen inom en minut,
CDN-cache med stale-while-revalidate), inte mot produktsidan förrän butiken sagts till
eller sex timmar gått. `/api/review-aggregates` ligger också i en CDN-cache (en timme eller
mer) och visar gamla antalet längre.
