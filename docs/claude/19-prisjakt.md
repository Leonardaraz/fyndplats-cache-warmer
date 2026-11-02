## Prisjakt: artikelnummer och märke till butikens hemliga flöde (2026-10-28)

Prisjakt matchade 9 av 6 818 erbjudanden. Deras produktsidor för Aosom-varor
heter märke plus Aosoms artikelnummer. ☠️ **Leonards beslut 2026-10-28: i
Prisjakt-flödet, och bara där, är `g:brand` varans riktiga märke och `g:mpn`
Aosoms artikelnummer.** Det är ett medvetet undantag från två husregler (märket
är Fyndplats, artikelnumret når aldrig kunden), och flödet med uppgifterna finns
bara på en hemlig adress i butiken. Adressen och koden står inte här; se
butikens `CLAUDE.md` (grenen `headless-site`).

`GET /api/prisjakt-artiklar` → `lib/feed/prisjakt-artiklar.ts` ger butiken
Wix-variant-id → `{ mpn, marke }` för alla Aosom-rader, när flödet byggs.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Bara `REVIEW_INGEST_SECRET`, inte `CRON_SECRET`.** Svaret bär numren i
   klartext. CRON_SECRET finns i GitHub Actions, vars loggar är publika, och en
   workflow som anropade rutten hade kunnat skriva numren dit. Jämförelsen tar
   lika lång tid oavsett var en fel nyckel skiljer sig.
2. ☠️ **`Cache-Control: no-store`, och loggraden bär bara antal.** Inget nummer,
   ingen adress, och inget felmeddelande från Aosom-flödet, vars adress är hemlig
   (`flodetFel` i svaret i stället).
3. **Per variant, ur `aosomArtikelbild`.** En sida med en artikel nycklas på
   mappningens enda `wixVariantId`, och på produkten när det saknas. En
   sammanslagen sida ger varje färg sin egen artikel. En tvetydig sida, ett
   nummer som inte ser ut som ett och en nyckel som två rader ger olika svar får
   ingenting.
4. ☠️ **Märket gissas aldrig.** Det tas ur adressen till Aosoms egen produktsida
   (`markeUrAosomUrl`, samma som GPSR-fliken): Aosom-flödets adress för
   artikeln först, mappningens `sourceUrl` bara när den slutar på samma artikel
   (`~<artikel>.html`, en ommappad rad kan bära en gammal adress), sist
   `lib/gpsr/aosom-data.json`. Utan träff blir märket `null`, och butiken låter
   Fyndplats stå. ☠️ "Aosom" räknas inte som märke (Leonard 2026-10-28,
   oavsett stora eller små bokstäver): nästa källa prövas, annars `null`, och
   artikelnumret följer med ändå. Regeln bor i `markeFor`, inte i
   `markeUrAosomUrl`, som produktsidornas GPSR-flik också läser.
5. **Ett Aosom-flöde som faller stoppar inte svaret.** Numren kommer ur
   mappningarna, och märket ur de två reservkällorna.

`rakning` i svaret säger hur många rader, märken (per källa), tvetydiga sidor och
krockar körningen gav. Testerna använder bara påhittade nummer (`TEST-…`).
