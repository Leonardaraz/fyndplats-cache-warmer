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
- Borttagning tar bort kontot, profilen, nivåbytena och inloggningsförsöken
  (adressen i klartext). Orderliggaren och prisbesluten står kvar, eftersom de
  bär ordrarna och priserna och inget konto, och loggen får bara den maskerade
  adressen. Nivåbytena och inloggningarna tas bort först: faller det står
  kontot kvar, så att ett nytt försök hittar allt (2026-11-04).
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

## Kvar till E2

- Leonards svar på P4–P8 (aktuellt pris, kupong, golv, fri frakt-skydd,
  visning av listpriset).
- J1, frågan till Konsumentverket, och beslut om tvåfaktor för admin.
- Flaggan "ej medlemspris" i admin. Fältet `ejMedlemspris` läses redan av
  golvrutten.
- Integritetstexten (J4) ska vara publicerad innan läget `pa`. Utkastet står i
  butikens `docs/medlemskap-integritetstext-utkast.md`.
