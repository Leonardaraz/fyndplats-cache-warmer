# Medlemskapet: portalen för privatpersoner och företag (2026-11-04)

Leonards uppdrag 2026-11-04: en medlemsportal för privatpersoner och företag,
efter specifikationen "Fyndplats medlemskap – audit och specifikation"
(50 sidor). Portalen är vår egen, i butiken (headless-site). Wix behåller
katalog, kassa, betalning och ordrar; vår server sätter priset innan kassan
med prisöverstyrning per rad i Wix Cart V2. Etapperna är E0 till E5, var och
en med en grind. Kreatörsprogrammet (E4) är parkerat sedan 2026-11-04.

**Leonards beslut 2026-11-04:**

- A1: Wix-kassan står kvar så länge E0 håller.
- A2: inloggning med länk eller sexsiffrig kod, utan lösenord. Kunden förblir
  inloggad i 90 dagar, och tiden förlängs vid besök.
- A3: admin i motorns befintliga admin.
- A4: Wix CMS i stället för Postgres (Neon sägs upp, Elite rymmer 10 miljoner
  rader).
- P1: ett köp räknas från betalningen.
- P2: fönstret rullar 365 dagar, med mejl 14 dagar innan nivån sjunker.
- P3: köp på samma e-post ett år bakåt räknas vid första inloggningen.

Byggordningen: E1 nu, Black Week (C2) efteråt men mergad senast 18/11.

## E0: Wix-kassan bär vårt pris (provordern 2026-11-04)

En provorder på en dold testprodukt, betald av Leonard och sedan avbruten och
helt återbetald. Grinden (E0-1, E0-2 och E0-4) är grön.

| Krav | Utfall |
|---|---|
| E0-1 | Grönt. Radpriset i kassan och på ordern blev vårt överstyrda pris, inte katalogens. |
| E0-2 | Grönt. En omräkning ändrar inte priset, och inte heller byte av land, leverans eller betalsätt. |
| E0-3 | Grönt. Med låst kupong saknas fältet för rabattkod. |
| E0-4 | Grönt. Webhooken `order.approved` kom efter 50 sekunder, med varukorgens id och `purchaseFlowId` på ordern. |
| E0-5 | Avvikelse. Fri frakt räknas på vår delsumma, men gränsen är 500,00 kr: 499,01 kr ger frakt. |
| E0-6 | Inte provat; gäller bara kreatörerna. |
| E0-7 | Grönt. Butiken kör redan Cart V2. |
| E0-8 | Ingen dokumenterad gräns. Varje medlemsköp kostar två anrop. |

Regler till E2, som annars hade blivit fel:

1. Varukorgen skapas med `customerInfo.openAccess: true`. Annars ägs den av
   den som skapade den.
2. Redirect-sessionen skapas med butikens publika headless-klient.
   Adminidentiteten nekas ("client Id does not seems to correspond to an
   headless oauth app").
3. Varukorgen får `deliveryInfo.address.country: "SE"`. Annars blir serverns
   land förvalt i kassan; vid provet var det USA.
4. Varukorgen får `source.channelType: "WEB"`. Provordern fick UNSPECIFIED.
5. Fraktskyddet räknas mot 500,00 kr, inte 499.
6. `cart.settings` (kupong och presentkort låsta) går bara att sätta när
   varukorgen skapas.
7. En dold produkt går att lägga i en varukorg men inte att köpa: kassan
   svarar "inte tillgänglig".

Sidofynd: butikens webhook kan inte verifiera Wix JWT-signatur och faller
tillbaka på ett API-uppslag av ordern. Det fungerar men bör ses över för sig.

## E1: konto, orderliggare och Mina sidor (butiken)

Butikens PR (headless-site, `lib/medlem/`, `app/konto/`) och avsnittet
"Medlemskapet" i butikens `CLAUDE.md` beskriver bygget i detalj. Det som
motorn behöver veta:

- **Sju kollektioner** skapades 2026-11-04 med behörigheten ADMIN och 13
  index: `FyndplatsMedlemmar`, `FyndplatsMedlemsprofiler`,
  `FyndplatsInloggningar`, `FyndplatsOrderliggare`, `FyndplatsMedlemsnivaer`,
  `FyndplatsMedlemsregler` (version 1 = specens tabell) och
  `FyndplatsMedlemslogg` (bara tillägg). Butiken äger dem; motorn läser och
  gör bara de manuella ändringarna.
- **Växeln** är raden `FyndplatsButikInstallningar/medlemskap`, fältet `lage`:
  `av` (eller ingen rad), `tyst` eller `pa`. Utan `MEDLEM_JWT_SECRET` i
  butikens miljö är inloggningen stängd oavsett läge.
- **Orderliggaren bär alla ordrar**, inte bara medlemmarnas. Den fylls av
  webhooken, av en avstämning varje natt (ordrar ändrade senaste 48
  timmarna) och av en bakåtläsning 400 dagar bakåt, en gång. Butikens
  nattjobb `/api/cron/medlemsnivaer` går 04:40 UTC, utanför synkfönstren.
- **Medlemmens id** är `m_` + de första 40 tecknen av sha256 på
  `fyndplats-medlem|<e-post>`. Butiken och motorn låser samma testvektor.
- E1-grinden är specens E1-1 till E1-11 och en vecka med avstämning utan
  avvikelser. Avvikelserna står i loggen med område `avstamning`.

## Admin: /admin/medlemmar (motorn)

- Sök på hela e-postadressen eller ett ordernummer.
- Medlemskortet visar status, nivå och K som nattjobbet senast räknade, hela
  orderliggaren för adressen, nivåbytena och loggen.
- Manuell nivå, spärr, borttagning och växeln kräver en orsakskod och en
  text, och skrivs till `FyndplatsMedlemslogg` med före- och efterläge
  (E1-11). En manuell nivå gäller i stället för den räknade, till och med sitt
  slutdatum om ett sådant anges.
- Borttagning tar bort kontot, profilerna, nivåbytena, inloggningsförsöken
  (adressen i klartext), de sparade varukorgarna och offerterna som aldrig
  blev betalda. Orderliggaren, prisbesluten och en betald offert står kvar,
  eftersom de är underlag för ordrar (bokföringslagen), och loggen får bara
  den maskerade adressen. Allt utom kontot och profilerna tas bort först:
  faller det står kontot kvar, så att ett nytt försök hittar allt
  (2026-11-04, korgarna och offerterna 2026-11-05).
- Skyddet är det som gäller för hela `/admin` (Basic Auth och Vercels
  skydd). Tvåfaktor krävs av specen före E2.

## Wix-gränser som styr formen

- Kvoten är sajtens: 3 000 läsningar och 1 500 skrivningar i minuten. Mina
  sidor räknar nivån ur orderliggaren vid varje besök (2–3 läsningar);
  nattjobbet läser alla rader en gång.
- Högst 3 vanliga index per kollektion, med högst 3 fält var.
- Ett `_id` är högst 128 tecken, ASCII och skiljetecken. E-post går aldrig in
  i ett id utan hash.
- `$exists: false` matchar inte null, så inget fält skrivs som null.
- `priceSummary.subtotal` och `.shipping` på en order är UTAN moms;
  varuvärdet tas ur radernas `totalPriceAfterTax`.
- Återbetalningarnas varuvärde per rad finns bara i Order Transactions
  (`summary.breakdown.lineItems`), inte på ordern.

## E2: golvet ur motorn (`/api/medlem/golv`)

Butikens prismotor (headless-site `lib/medlem/pris.ts`) ger aldrig ett radpris
under golvet G = C × 1,10 × 1,25 [P6]. Kostnaden C finns bara i motorns
mappningar, så butiken frågar motorn (`POST /api/medlem/golv`, logiken i
`lib/medlem/golv.ts`).

- ☠️ **Svaret bär kostnaden**, för prisbeslutsloggen. Bara
  `Authorization: Bearer REVIEW_INGEST_SECRET`, `Cache-Control: no-store`, och
  loggraden bär bara antal.
- **G avrundas uppåt till hela kronor**, så att ett medlemspris som stannar på
  golvet inte visar C på öret. Formeln står i ett publikt repo.
- **Inget golv, och därmed inget medlemspris, för:**
  - AliExpress, där kostnaden fryser vid importen;
  - en levande fyndauktion, som äger priset;
  - en produkt med `ejMedlemspris: true` i mappningen;
  - en variant utan känd kostnad.
- **Matchar inte varianten** används den högsta kostnaden bland produktens
  varianter, och bara om alla har en kostnad.
- **Kan auktionerna eller mappningarna inte läsas** svarar rutten 503, och
  butiken visar listpriset.
- Företagen (E3) får det högsta av nivån och ordertrappan, aldrig båda
  (Leonards ja 2026-11-04). Det räknas i butiken; golvet är detsamma.

## E3: företagen i kön (motorn)

- Kön "Företag att granska" står överst på `/admin/medlemmar` (ankaret
  `#foretag`, som butikens mejl till info@ länkar till). Den läser
  `FyndplatsMedlemsprofiler` med `typ: "foretag"` och `status: "granskas"`,
  äldst först (index `typ-status-ansokt`).
- Butiken skriver ansökan (`<medlemsId>__foretag`); motorn skriver bara
  beslutet: `aktiv` (godkänt), `nekad`, eller återkallat (aktiv → nekad). Varje
  beslut kräver orsakskod och text (orsakskoden `bolagsverket` finns för
  godkännandet) och skrivs med villkoret att läget är detsamma som när sidan
  lästes, så att två admins inte skriver över varandra.
- Bolagsverkets uppslag är inte byggt: nycklarna kommer via Bolagsverkets
  kundanmälan, som Leonard gör (svar 3.1). Tills dess kontrolleras numret och
  namnet för hand. En enskild firma finns inte alltid hos Bolagsverket.
- ☠️ En enskild firmas organisationsnummer är ett personnummer. Hela numret
  syns bara på admin-sidan; loggen får namnet och formen, aldrig numret.
- Mejlet "Ditt företagskonto är godkänt" skickas av butikens timjobb
  (`/api/cron/medlemskorgar`, kl :41), inom en timme. Motorn har varken
  butikens mejlnyckel eller någon hemlig rutt i butiken.
- Sök fungerar också på organisationsnummer (tio eller tolv siffror, med
  eller utan bindestreck). Kontots borttagning tar också företagsprofilen.
- **Offerterna** (`#offerter`, `lib/medlem/offert-admin.ts`): butiken skriver
  förfrågan i `FyndplatsOfferter` (ADMIN) från varukorgen när korgen har 6
  exemplar av samma vara eller 20 000 kr exkl. moms (F7). Admin sätter
  styckpriset inkl. moms per rad. ☠️ Golvet räknas om vid sparandet med samma
  räkning som `/api/medlem/golv`: aldrig under golvet, aldrig över
  listpriset, och en vara utan golv får bara listpriset
  (`lib/medlem/offertpriser.ts`). Offerten gäller i 14 dygn. Butikens
  timjobb mejlar kunden, märker den betald när kassan blev en order och
  utgången efter sista dagen. Loggen får antal rader, aldrig priser.

- **Förskottsfakturan** (villkoren 5.1, Leonards svar 3.3 2026-11-05): inget
  Wix-API slår på ett betalsätt, och manuell betalning i panelen syns för alla
  kunder. Butiken skapar därför en obetald handlagd order åt ett godkänt
  företag (`POST /ecom/v1/orders`, `BACKOFFICE_MERCHANT`, `NOT_PAID`) med
  `Förskottsfaktura.` först i ordernoteringen. Motorn känner igen den
  (`arForskottsorder`, `lib/orders/faktura.ts`):
  - fakturan går ut som för andra fakturaordrar, men förfaller efter högst
    10 dagar (`FORSKOTT_DAGAR`), heter Förskottsfaktura och säger att
    varorna skickas när betalningen har kommit in;
  - ☠️ webhooken skapar inga leverantörsuppgifter medan ordern är obetald
    (`vantarPaForskottsbetalning`, samma betalstatusar som vakten);
  - när Leonard markerar ordern betald i Wix skickar timcronen kvittot och
    skapar uppgifterna i samma steg (`efterBetalning` i faktura-kor, samma
    `deriveTasks` som återhämtningen). Ett fel där syns som `typ: "uppgifter"`
    i svaret. Återhämtningens egna 14 dygn är nätet under, och fakturakörningen
    ser 120 dygn bakåt, så en sent markerad betalning hittas ändå.

- **Kvittot med företagets namn för kort och Klarna** (villkoren 5.2: "Kvitto
  och faktura med köparens namn och adress, och för ett bolag
  organisationsnumret, skickas med e-post"; byggt 2026-11-05). Butikens kassa
  sparar företaget på prisbeslutet i `FyndplatsPrisbeslut` när kunden går
  till kassan: `foretagNamn`, `foretagFaktura` (gata, postnr, ort) och för
  ett bolag `foretagOrgnr` (butikens `foretagPaBeslut`). Timcronen
  `/api/cron/faktura` tar varje betald order ur kassan från och med
  `KASSAKVITTO_FRAN` (`arKassakop`), slår upp köpflödena 50 åt gången på
  indexet `purchaseFlowId` och mejlar kvittot för de köp som har ett företag
  (`byggKassakvitto`): samma PDF som fakturaordrarnas kvitto, med ordernumret,
  köpets dag och företaget som köpare. Inom en timme från köpet; webhooken rör
  bara fakturaordrar.
  - ☠️ Organisationsnumret kommer bara ur beslutet, och bara ett bolags
    (`arJuridisktOrgnr`: siffra tre och fyra minst 20). Ett nummer i kundens
    ordernotering läses aldrig för ett köp i kassan, och en enskild firmas
    personnummer skrivs aldrig ut, även om det skulle stå på beslutet.
  - Samma utskickslogg som kvittot (typen `kvitto`), så kvittot går ut en
    gång. Ett läsfel i prisbesluten ger `typ: "kassakvitto"` i svaret och
    stoppar inte fakturorna.
  - ☠️ Fälten heter likadant i båda repona (`foretagUrBeslut` här,
    `foretagPaBeslut` i butiken). Byt aldrig namn på ett av dem i bara det ena.
  - Provet: `{ lage: "prov", order: "<nummer>" }` i `/api/admin/faktura`
    skickar kvittot till den interna larmadressen med [Prov].

- **Kvittot på Mina sidor** (`POST /api/medlem/kvitto { ordernummer, epost }`,
  byggt 2026-11-05): butikens "Kvitto (PDF)" hämtar PDF:en härifrån, med
  butikens hemlighet (`REVIEW_INGEST_SECRET`, samma kontroll som golvet).
  `kvittoForArkiv` avgör:
  - ☠️ bara köparens egen order: e-posten på ordern ska vara den butiken
    skickar, annars 404 `inte-din` utan PDF;
  - bara en betald order som inte är avbruten (409 `obetald` eller
    `avbruten`);
  - ett köp i kassan får kvittot med köpets dag, som företag när prisbeslutet
    säger det (uppslaget görs bara för köparens egen betalda order);
  - en fakturaorder får kvittot bara när det redan har mejlats, med samma
    datum (409 `inget-kvitto` annars).
  Svaret har `Cache-Control: no-store`, och ingen loggrad bär e-post eller
  ordernummer.

- **Sparade varukorgar** (byggt 2026-11-05 i butiken, `lib/medlem/sparade.ts`):
  medlemmen sparar varukorgen under ett namn på Mina sidor och lägger den i
  varukorgen igen med ett tryck. Kollektionen `FyndplatsSparadeKorgar` (ADMIN,
  indexet `medlem-skapad`: `medlemsId` stigande, `skapad` fallande) har
  `medlemsId`, `namn`, `rader` (produkt, variant, antal och namn, aldrig pris)
  och `skapad`. Butiken skriver och läser den; motorn rör den bara när ett
  konto tas bort (`taBortKonto`, `MEDLEM_KOL.sparade`). Att spara följer
  växeln för E2/E3, eftersom integritetstexten för E1 inte nämner korgarna.

## Kvar till E2

- Leonards svar på P4–P8 (aktuellt pris, kupong, golv, fri frakt-skydd,
  visning av listpriset).
- J1, frågan till Konsumentverket, och beslut om tvåfaktor för admin.
- Flaggan "ej medlemspris" i admin. Fältet `ejMedlemspris` läses redan av
  golvrutten.
- Integritetstexten (J4) ska vara publicerad innan läget `pa`. Utkastet står i
  butikens `docs/medlemskap-integritetstext-utkast.md`.
