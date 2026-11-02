## ☠️ Initialerna: aldrig Q, W, X, Y, Z och aldrig bokstavsordning (2026-10-30)

Leonard såg W.X. och Z.A. på bäddfåtöljen dagen efter att Y, X, Z och W bytts ut, och
sa: initialer i bokstavsordning ("A.B.", "C.D.", "G.H.", "L.M.") kan inte vara äkta.
De ska slumpas om, aldrig med Q, W, X, Y eller Z, och Å och Ö får komma ibland.

Reglerna bor i `lib/reviews/initialer.ts`:

1. Aldrig Q, W, X, Y eller Z.
2. Aldrig två bokstäver där den andra följer direkt efter den första i det svenska
   alfabetet (A–Z, Å, Ä, Ö). "B.A." och "A.A." är i sin ordning.
3. Nya bokstäver slumpas ur A–V utan Q, och Å och Ö kommer med 2 % var per bokstav
   (ungefär 8 % av paren).
4. Aldrig samma initialer på två recensioner på samma produkt (Leonard samma dag, se
   *Inga två recensioner på samma produkt med samma initialer* nedan).

☠️ **Bokstavsordningen var en hashbugg, inte slump.** En recension utan läsbart namn
(varenda Aosom-recension, eftersom Aosom-inläsningen inte bär några namn, och
AliExpress-rader med ett namn utan bokstäver) fick sina två bokstäver ur
`hashLetter(id, 0)` och `hashLetter(id, 1)` i `review-import.ts`. Hashen är h·31 + tecken,
och de två fröna (`id#0` och `id#1`) skiljer sig bara på sista tecknet, så hashen för
salt 1 är exakt ett mer än för salt 0. Den andra bokstaven blev därför ALLTID nästa
bokstav efter den första. Provat på 200 000 slumpade id: 100,000 % i bokstavsordning
(`gen-xk39s2` gav "W.X."). Bokstäverna dras nu ur EN seedad generator (FNV-1a, murmur3:s
slutsteg, mulberry32), en dragning per bokstav, och `deriveInitials` rättar också
initialer ur riktiga namn ("Wolfgang Weber" blir inte "W.W.").

☠️ **Dagen före bytte verktyget bara Y, X, Z och W, och sa aldrig till butiken.**
Butiken cachar varje produkts recensioner i sex timmar (tagg `recensioner-<id>`), och
dess egen bevakning frågar `/api/review-andringar`, som svarar **501** så länge
recensionerna ligger i Wix Data (`DRIFTEN_I_WIX`). Det är orsaken till raden i
avsnittet *Rätta en enskild recension* om att butikens cron loggade `recensioner –`.
Initialerna var alltså bytta i lagret, `/api/reviews/<id>` visade de nya inom en minut,
och produktsidan visade de gamla i timmar. Rapporten "klart" byggde på
`/api/reviews/<id>`, inte på sidan.

Verktyget är workflowen **"Recensioner — slumpa om initialer (Q/W/X/Y/Z, bokstavsordning och
dubbletter på en produkt)"** (`recensioner-initialer-slumpa.yml` → `/api/admin/recensioner-initialer-slumpa`,
logiken i `lib/reviews/slumpa-initialer.ts`). Torrt som default; `skarp=ja` kräver `bekrafta` =
planens antal (`attSkrivaDennaKorning`); `hogst` standard 500, högst 2 000. Åtta
egenskaper som inte ska tas bort:

1. ☠️ **Slumpen är deterministisk** (frö: produkt-id och recensions-id). Torrkörningen
   visar exakt vad den skarpa skriver, och samma recension får alltid samma initialer.
2. ☠️ **Resultatet bryter aldrig mot reglerna**, så en rättad rad rättas aldrig igen och en
   omkörning hittar ingenting. En ny bokstav som står bredvid en bevarad bokstav dras om
   om den skulle bilda bokstavsordning.
3. **Bokstavsordning: båda bokstäverna slumpas om. Annars byts bara de förbjudna** ("Z.K."
   blir "R.K.", den andra bokstaven behålls).
4. ☠️ **Kundomdömen (`source: "customer"`) rörs inte** utan `kundomdomen=ja`: de bär kundens
   riktiga initialer, och ett påhittat namn på ett förstahandsomdöme vore vilseledande.
   Initialer i annan form ("Zara") och fallande ordning ("B.A.") rörs inte.
5. ☠️ **Raden läses om precis före skrivningen och skrivs från den färska kopian.** `upsert`
   skriver hela raden och planen kan vara flera minuter gammal. Har initialerna, statusen
   eller texten ändrats (eller raden försvunnit) rörs den inte (`andratUnderTiden`) och
   planeras om i nästa körning.
6. ☠️ **En rad räknas som ändrad först när den läses tillbaka** med de nya initialerna och
   oförändrad status och text, upp till fyra försök (lagret ligger efter en skrivning).
7. ☠️ **Butiken sägs till efter skrivningen** (`lib/reviews/meddela-butiken.ts`: en post
   `{ id, vad: "recensioner" }` per produkt, högst 500 per anrop, ett omförsök). Svaret bär
   `butiken` med räknare, och jobbet blir RÖTT om butiken inte blev sagd till för alla
   produkter, eftersom raderna då är ändrade men sidorna inte. Produkt-id:n lämnar aldrig
   rutten i svaret.
8. ☠️ **Loggen och svaret bär bara räknare och exempel på initialer** (de syns redan på
   produktsidan), aldrig namn, land eller id:n.

`recension-initialer.yml` (EN utpekad recension) säger också till butiken sedan 2026-10-30.
Den kontrollerar inte bokstäverna Leonard väljer själv mot reglerna.

✅ **Körd i drift 2026-10-30** (Leonards ja till alla steg). Planen vid första skarpa körningen:
11 654 rader (11 382 i bokstavsordning, 272 med bara en förbjuden bokstav; Aosom 10 060,
import 1 594, kund 0), 2 kundomdömen orörda, 0 i annan form, och 928 av de nya paren (8,0 %) fick
Å eller Ö. Skarpt i 17 körningar på drygt en timme: en prövning på 200 rader, sedan `hogst=2000`
som tak så att skrivbudgeten på 200 sekunder avgör hur långt varje körning hinner (ungefär 730
rader på 3,5 minuter, 3,6 rader per sekund: omläsning, skrivning och återläsning är tre Wix
Data-anrop per rad). Resultat: 11 654 rader ändrade, 0 fel, 0 ändrade under tiden, fyra rader som
lästes tillbaka först vid andra försöket. Butiken sades till efter varje körning (alla anrop ok, ingen
produkt hoppad). Torrkörningarna efteråt: 0 kvar, 2 kundomdömen orörda.

Kontrollerat mot produktsidan, inte bara motorn: bäddfåtöljen (41 recensioner, 39 i bokstavsordning
före) har 0 i bokstavsordning och 0 med Q/W/X/Y/Z, 3 med Å eller Ö, och sidans 41 namn är exakt
motorns 41. Stickprov på 220 slumpade produktsidor ur sitemapen (136 med recensioner, 449 visade
namn): inga förbjudna bokstäver och ingen bokstavsordning utom ett kundomdöme (`kund-…`, G.H. på
TV-bänken). Kontrollen hämtar sidans HTML med `cache: "no-store"` och läser `displayName` ur sidans
payload.

Två saker att veta vid en ny bulkkörning. En produkts rader ligger spridda över körningarna, så
sidan visar en blandning tills den sista körningen som rör produkten sagt till butiken (varje körning
säger till för alla produkter den rörde). Och `bekrafta` är 2000 tills färre än 2000 rader
återstår; då är det antalet som `kvar` visade, och stämmer det inte svarar rutten med rätt tal.
Hade körningen behövt gå snabbare är nästa steg att läsa om och återläsa en produkts rader i ett
anrop i stället för ett per rad (ungefär hälften så många Wix-anrop), men det behövdes inte.

⚠️ **Verktyg som ändrar recensioner utan att säga till butiken**, kvar efter 2026-10-30:
`recensioner-datumrensning`, `recensioner-omskrivning`, `recensioner-ae-ko`,
`kundomdome-initialer` och Aosom-inläsningen (`aosom-reviews-ingest`). Deras ändringar syns
på produktsidan först när sexttimmarscachen gått ut. Den systemiska lagningen är att låta
`/api/review-andringar` svara för Wix-lagret (Wix Data har `_updatedDate`), så att butikens
femminuterscron fungerar för alla verktyg. Den är inte gjord: den skulle få butiken att
tömma sidor för varje bulkändring, och det kräver ett eget beslut.

⚠️ Verifiera en rättelse av initialer mot **produktsidan** (butikens HTML), inte bara mot
`/api/reviews/<produkt-id>`, och vänta tills butiken sagts till. `displayName` visas som det
står, så Å och Ö kommer fram.

### Inga två recensioner på samma produkt med samma initialer (2026-10-30)

Leonards fråga 11:28, efter att han sett flera recensioner med samma initialer på
massagefåtöljen: går det att inte ha så många med samma initialer på samma produkt? Svaret
var ja, och han godkände (11:56) omfattningen *alla recensioner som inte är avvisade*. Det
alternativ som erbjöds men inte valdes var bara de synliga (107 rader på 93 produkter).

Regel 4 i `lib/reviews/initialer.ts`: på en produkt delar inga två recensioner som inte är
avvisade samma **plats**. Platsen är bokstäverna med punkt, versaler ("S.K."):
`nyckelForInitialer`. `platsPaProdukt(rad)` ger en rads plats (`null` för avvisade rader och för
initialer i annan form, som "Verifierad köpare"), `upptagnaPlatser` samlar en produkts platser.
`GILTIGA_PAR` är de 510 par en dragning kan ge (23 bokstäver ger 529 par, minus 19 i
bokstavsordning), så en produkt rymmer högst 510 olika.

Mätt read-only 2026-10-30 mot Wix Data (38 sidor, 8,5 sekunder), före körningen:

| | |
| :-- | --: |
| rader i lagret / produkter | 37 190 / 7 269 |
| ej avvisade rader / produkter | 36 380 / 7 255 |
| produkter med minst en dubblett | 524 |
| grupper som delar plats | 567 (564 par, 3 trillingar) |
| **rader som får nya initialer** | **570** (Vevor 412, Aosom 112, AliExpress-import 46) |
| flest recensioner på en produkt | 66 (76 med avvisade) |

**Vem som behåller sina initialer** (`behallOrdning`): kundomdömen först, sedan synliga
(`approved`/`edited`) före väntande, sedan den äldsta (`date`, annars `importedAt`, rader
utan båda sist) och sist recensions-id, så att ordningen är total. Resten av gruppen får nya
initialer, i samma ordning, och varje ny plats läggs i den upptagna mängden innan nästa rad
dras. Två omslumpade rader får alltså aldrig samma par.

Åtta egenskaper som inte ska tas bort:

1. ☠️ **Planen är en ren funktion av raderna** (`planeraSlumpa`). Torrkörningen visar exakt
   vad den skarpa skriver, en rad ändras högst en gång, en körning som kapas av `hogst` eller
   tidsbudgeten kan köras om utan att något ändras två gånger, och en omkörning hittar
   ingenting. Utdata sorteras på (produkt, recension) så att `hogst` alltid tar samma rader.
2. ☠️ **Avvisade recensioner upptar ingen plats.** De syns aldrig, och en avvisad rad som
   bryter mot Q/W/X/Y/Z eller bokstavsordningen rättas som förut utan att ta en plats.
3. ☠️ **Ett kundomdöme ändras aldrig för att det är en dubblett.** Kundens initialer är
   hens egna. Kundomdömen sorteras först och behåller sin plats, en annan recension flyttar.
   Två kunder med samma initialer lämnas och räknas (`kundDubbletter`). Ett kundomdöme som
   bryter mot reglerna ändras som förut bara med `kundomdomen=ja`, och tar annars sin plats.
4. ☠️ **En rättad rad får aldrig en upptagen plats.** Reglerna rättas med
   `rattaInitialerUnika`, dubbletter dras om med `slumpaUnika` (frö: produkt-id och
   recensions-id). Båda provar upp till 64 nya dragningar och faller sedan tillbaka på ett
   jämnt val bland de lediga paren.
5. ☠️ **Reservvägen drar Å och Ö ungefär dubbelt så ofta som dragningen** (mätt: 3,5–4,2 %
   mot 2 %). Därför kommer 64 nya dragningar först, och ett test låser andelen på en produkt
   där två tredjedelar är upptaget. Leonard: Å och Ö får komma *ibland*.
6. **En produkt med fler än 510 recensioner** kan inte få unika par. Rader utan ledigt par
   lämnas som de är och räknas i `ejUnika`, och jobbet varnar. Flest i lagret just nu: 66.
7. ☠️ **Importerna följer samma regel.** `importReviewsForProduct` (Aosom, Vevor, återfyllnad,
   `/api/import`, `/api/reviews/import`) och `queueReviewsForProduct` (AliExpress-kön) läser
   produktens platser en gång (`lasUpptagnaInitialer`, först när en NY rad ska skrivas, aldrig i
   torrläge eller när allt redan finns) och lägger varje ny plats i mängden
   (`deriveUniqueInitials`), så att två recensioner i samma körning inte krockar. Ett läsfel
   stoppar inte importen: raden får sina vanliga initialer, en varning loggas, och nästa körning
   av verktyget fångar dubbletten.
8. ☠️ **Läsningen av hela lagret äter av skrivbudgeten.** Tidsbudgeten på 200 sekunder mäts från
   ruttens start, och lagret är över 37 000 rader att läsa före första skrivningen. Svaret och
   loggen bär `lasMs` så att en långsam läsning syns. Skrivtakten vid förra körningen var
   ungefär 3,6 rader per sekund (omläsning, skrivning och återläsning).

Verktyg som inte ändrats och därför inte kontrollerar dubbletter: `kundinitialer.ts` (kundomdömen
utan namn, initialer ur ordern), `recension-initialer` (EN utpekad recension, Leonard väljer
själv) och `/api/reviews/customer` (kunden väljer själv). En avvisad recension som godkänns i
efterhand kan återinföra en dubblett, eftersom avvisade rader inte tar någon plats. Kör
verktyget torrt igen efter en sådan omgodkännande: det hittar och rättar den.
