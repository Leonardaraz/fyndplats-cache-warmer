## Aosom-recensioner: hämtas i webbläsaren, läses in via rutt (2026-09-16)

Svepet `/api/cron/aosom-reviews` (2026-08-29) fick 403 på varje sida — Akamai
släpper bara igenom riktiga webbläsare, och 2026-09-16 mättes samma 403 för
`curl` med fulla webbläsarrubriker. Samma dag gav Aosom skriftligt tillstånd
att hämta och översätta recensionerna, så vägen blev:

1. **Hämtning i Leonards Chrome** (Claude in Chrome, en egen flik på aosom.de).
   Deras sök-API `/rest/v1/searchApi/product?keyword=<artikelnummer>` ger
   `sin`, `skuid`, `urlkey`, `score`, `commentCount` och `stockQty`. Deras
   recensions-API `/block/template/detailComment?pageNum&pageSize=50&sin&skuid&_lang=de&_siteId=210&_version=test3&sort=default`
   — samma anrop som deras produktsida gör — ger ALLA recensioner
   (`list[]`: `qualityScore`, `title`, `content`, `ct` = datum, `imgurls` =
   semikolonseparerade foton på img.aosomcdn.com, `sourceName`) och
   `globalRateCount`/`globalReviewCount`. Produktsidans JSON-LD (högst fem
   texter, utan datum och foton) var första vägen och är passerad: gymstationen
   hade tolv recensioner i API:t, fyra i JSON-LD. ~2,4 s per produkt.
   Aosom sa ja till texter OCH foton (2026-09-16).
2. **Inläsning** via `POST /api/admin/aosom-reviews-ingest`
   (`lib/aosom/review-ingest.ts`, tio tester), workflow
   `aosom-reviews-ingest.yml` med `payload_file` i grenen — samma mönster som
   review-translate. Nyttolasten är nycklad på **wixProductId**, bär tyska
   texter, valfria svenska översättningar (`sv`), datum, kundfoton (bara
   img.aosomcdn.com släpps igenom, hemflytt sker i importen), Aosoms betyg och
   antal — aldrig artikelnummer (workflowen vägrar filer som matchar
   artikelnummermönstret) och aldrig recensentens namn.

Fyra egenskaper som inte ska tas bort:

1. Samma lagring som svepet: `importReviewsForProduct(..., { source: "aosom" })`
   med husets filter oförändrat (betyg ≥ 3, längd, spam, utlandsleverans,
   dubbletter), och aggregatet på mappningen (`aosomRating`,
   `aosomReviewCount`) — ☠️ aldrig uträknat ur texterna.
2. ☠️ En översättning skrivs bara på en rad som ligger som `pending` och bara
   om `validateTranslation` godkänner den — samma grind som /admin/reviews.
   Underkända räknas per skäl (`underkandaSkal`) och ligger kvar i kön.
3. Högst 60 rader per anrop och tidsbudget 240 s; svaret bär `kvarFran` så
   workflowen fortsätter från rätt rad. Torrt som default (`dryRun: false`
   krävs för att skriva).
4. Loggen bär bara räknare — rutten anropas från en publik Actions-logg.

Butikssidan räknar i dag snitt och antal ur de SYNLIGA raderna
(headless-site `lib/reviews.ts`), inte ur `aosomRating`/`aosomReviewCount`.
Med filtret betyg ≥ 3 lutar det synliga snittet uppåt mot Aosoms — att visa
Aosoms eget aggregat är nästa steg, inte gjort. Observera att Aosoms API bara
lämnar ut 4- och 5-stjärniga recensioner (8 329 hämtade, ingen under 4), så
snittet är högt oavsett vad vi räknar på.

**Första inläsningen gjordes 2026-09-16** (skarpt, 0 skrivfel): 972 produkter
(alla Aosom-produkter i annonsurvalet), 8 329 texter hämtade, 4 383 kvar efter
husets filter (863 med kundfoton), 2 510 översatta till svenska och synliga —
upp till fem per kampanjprodukt, tre per övrig. Resterande 1 873 ligger som
`pending` (osynliga) och tas i en andra omgång via `review-translate.yml`, som
redan tar en `payload_file` med översättningar. Nyttolasten låg på den
tillfälliga grenen `claude/aosom-recensioner-2026-09-16` (raderad efter
inläsningen — repon är publik). Rådata, filtrerad mängd och alla
översättningar finns lokalt hos Leonard i `_claude_tmp/recensioner/`
(git-exkluderat, bär artikelnummer). Översättningsreglerna som gällde:
leverantörsnamn, budfirmor, recensentens namn, rabatter, sajt/säljare och
utlovade leveranstider bort; kritik kvar; recensioner som bara handlar om
leverans/retur/kundtjänst hoppas över; längd 0,45–2,2 × källan; ordet "fast"
undviks (engelsk-markör i `validateTranslation`). Butikssidorna cachar
recensionerna en timme (`revalidate: 3600`, tagg `reviews`) — omedelbar
uppdatering kräver headless-sitens `/api/admin/revalidate?tag=reviews` med
`ADMIN_SECRET`, som Claude inte läser.

**Kundfotona flyttas hem.** Publicerade recensionsbilder får aldrig peka på
leverantörens CDN (adressen syns vid högerklick). `withOwnImage` i
`lib/store/reviews.ts` gör flytten vid publicering, men listan över
leverantörsvärdar i `lib/wix/media-import.ts` kände bara AliExpress —
`img.aosomcdn.com` lades till 2026-09-16 efter att 709 synliga Aosom-rader
(1 130 foton) publicerats med Aosom-adresser. Redan publicerade rader lagas
med workflowen `review-image-repair.yml` (loopar `repairImages` i
`/api/cron/review-translate`, 40 rader per anrop, stannar när inget minskar).
Pending-rader behåller källadressen med flit — flytten sker när raden blir
synlig. Wix Media hade 12 GB ledigt 2026-09-16 (Leonard). ☠️ Nya Aosom-foton
skickas inte längre med i inläsningen — se omgång 5 nedan.

**Nästa omgång: vilka produkter, och deras artikelnummer (2026-09-23).**
Workflowen `aosom-reviews-kandidater.yml` svarar med SYNLIGA Aosom-produkter
som aldrig fått `reviewsCheckedAt`, och deras artikelnummer — krypterade mot
anroparens engångsnyckel (`kuvert`, obligatoriskt; inget klartextläge). Rutten
är `GET /api/admin/aosom-reviews-kandidater` (`?fore=<ISO>` tar även med
produkter kontrollerade före ett datum), logiken `lib/aosom/review-kandidater.ts`
med elva tester. Stämpeln sätts av inläsningen och av det gamla svepet bara vid
svar, aldrig vid fel, så urvalet är exakt. Förra vägen — jämförelsefilen —
täckte bara annonsurvalet, och `/admin/mappings` laddade inte vid ~5 500
produkter (se nedan).

**Leverantörslänkar för en hel lista (2026-10-07).** Leonard ville ha
Aosom-länken bredvid varje produkt i två listor, 505 produkter. Workflowen
**"Leverantörslänkar — Aosom- och AliExpress-länk för en lista produkter
(krypterat)"** tar Wix-produkt-id, slugs eller butiksadresser och svarar med
samma länk som "Öppna hos Aosom" i `/admin/source-lookup`
(`leverantorskallaFor`). En AliExpress-rad får sin AliExpress-länk, och en
sammanslagen sida får en länk per färg ur flödet. Rutten är
`POST /api/admin/leverantorslankar`, logiken `lib/import/leverantorslankar.ts`.
Tre egenskaper som inte ska tas bort:

1. ☠️ **Kuvertet är obligatoriskt**, som för kandidaterna. Länken bär
   artikelnumret.
2. ☠️ **Svaret bär inga kostnader**, och ett fel från flödet blir en flagga
   (`flodetFel`) utan meddelande, eftersom flödets adress är hemlig.
3. **Slugs slås upp hundra åt gången** med `$in` på slug
   (`getV3ProductIdsBySlugs`, mätt mot skarpa V3 samma dag). Okända slugs,
   produkter utan mappning och ordernummer listas i svaret i stället för att
   tystas.

**`/admin/mappings` laddade inte (2026-09-23).** Sidan skickade hela
`WixV3ProductSummary` för varje produkt till webbläsaren — beskrivning och
JSON-LD-taggar gånger ~5 500 — och ritade ett kort med bild per produkt. Nu går
bara id, namn, slug, bild och varianträkning till klienten, beskrivningen hämtas
inte alls (`listAllV3Products({ beskrivning: false })`), och listan ritas 60 kort
i taget. `listAllV3Products` hade dessutom kvar det tysta 50-sidorstaket som
`listVisibleV3ProductIds` fick bort 2026-09-14: /admin/seo, lönsamhetsrapporten
och mappningssidan räknade på de första 5 000 produkterna. Taket är nu samma som
den andras och KASTAR.

**Omgång 3 (2026-09-23): 1 086 svenska texter på 316 produkter.** Lärdomar
som gäller nästa omgång:

1. **Hämtningen går i en Web Worker.** En dold flik strypte sidans timers till
   ett uppvaknande per minut (Chrome, "intensive wake-up throttling"); samma
   loop i en worker skapad från en blob-URL gick i normal takt (~1,9 s per
   produkt). Fetch från workern kräver absolut URL (`location.origin + väg`).
2. **Aosoms recensionsdata är inte alltid rätt produkt.** Samma text låg på
   upp till fyra olika produkter, och recensioner av en massagefåtölj låg på
   en julgran. Därför: bara recensioner på exakt artikelnummer, INGEN text som
   finns på två olika produkter, och en granskning av varje översättning mot
   produktnamnet innan inläsning.
3. **API:t ger bara 4–5 stjärnor.** Alla 4 545 hämtade texter hade betyg 4
   eller 5.
4. **Den publika recensionsrutten cachas.** Direkt efter inläsning svarade
   `/api/reviews/<id>` tomt för åtta produkter (gammalt CDN-svar); nästa
   anrop var rätt. Produktsidorna cachar i en timme (taggen `reviews`).

**Omgång 5 (2026-09-30): 646 svenska texter på 204 produkter, 334 kundfoton.**
318 produkter importerade sedan omgång 4, upp till fem texter per produkt.
Lärdomar som gäller nästa omgång:

1. ☠️ **Kundfotona följer INTE med i inläsningens nyttolast.** `imageUrls` i
   `aosom-reviews-ingest` går via Wix Import File (`importImageToOwnMedia`),
   som svarar direkt och hämtar senare. Ungefär var sjätte Aosom-bild slutar
   FAILED i efterhand (Aosoms CDN anger fel Content-Type, eller `.heif` på en
   JPEG), och raden pekar då på en död adress. Det var så de 1 358 raderna
   tappade sina foton (återställda 2026-09-28/29, #687/#688). Gör i stället
   så här: läs in texterna UTAN `imageUrls`, lägg fotona i en egen fil
   `{"rader": [{productId, reviewIdAE, sourceImageUrls}]}` i samma tillfälliga
   gren (högst tre foton per recension, `reviewIdAE` = `ensureReviewId` av
   texten), och kör `aosom-review-image-restore.yml` på den efter
   inläsningen, torrt och sedan skarpt. Rutten laddar ner källfotot, bestämmer
   typen ur filens egna byte och skriver adressen först när Wix svarat READY.
   En rad utan foto räknas som återställbar och en rad med fungerande foto rörs
   aldrig, så körningen går att göra om. Utfall: 333 av 334 foton i första
   körningen och det sista i en omkörning. Filerna saknar `sourceUrl`, så
   mediastädningen kan aldrig radera dem.
2. **Artikelnumren lämnar aldrig webbläsaren.** Kandidatlistan dekrypteras i
   Leonards Chrome (WebCrypto med engångsnyckeln) och hämtningen körs där.
   Till molnet går bara en indexnycklad export, i delar om 40 000 tecken via
   sidtexten, och varje del kontrolleras med FNV-1a. JavaScript räknar
   UTF-16-enheter, så jämför hashen och inte längden i Python. Texter som
   innehåller ett kandidat-artikelnummer stryks redan i webbläsaren.
3. **Originaltexten hamnar i en publik gren**, så en recension stryks helt om
   originalet innehåller recensentens namn, en signatur ("Mit freundlichen
   Grüßen" följt av ett namn) eller en kundtjänstpersons namn. Namnet går
   inte att tvätta bort i översättningen. Hämtningen flaggar när recensentens
   förnamn står i texten, och översättare och granskare fångar resten.
4. **Nya strykregler i översättningen:** reklamton (produkttext med varumärke
   och inget eget omdöme), en annan färg än titelns när färgen är poängen, ett
   yngre barn än titelns åldersgräns och påståenden om tillverkningsland.
   Hälsouppgifter ("gör som sjukgymnasten sa", "inte ont i ryggen längre")
   stryks som diagnoser. Texterna kommer från Aosoms alla länder (de, fr, it,
   es, pt, ro, en), och reglerna täcker dem.
5. **Titlar som kunderna säger emot** (antiimma, mått, ram, glas eller
   plexiglas, material, färg) listas för Leonard. Texten stryks, och titeln
   ändras bara efter hans ja.
6. **Tider:** inläsningen tog 59 s för 318 rader, och fotona 23 min för 215
   rader.
