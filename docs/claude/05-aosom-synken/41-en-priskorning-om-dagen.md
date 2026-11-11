### En priskörning om dagen, och den hinner hela katalogen (2026-11-11)

Leonards fråga 2026-11-11: "kolla att vår prissynk på aosom produkterna funkar
som det ska", och sedan: "den borde köras 1 gång om dagen och fungera också".

Synken räknade rätt och skrev rätt, men den hann inte med. En torrkörning över
hela katalogen samma förmiddag granskade 5 051 sidor och ville skriva **5 020
priser**. Inga skrivningar hade misslyckats på två veckor. Felet var takten.

#### ☠️ Vad som gjorde den långsam

Tre saker, alla mätta i loggen och i `FyndplatsAudit`:

1. ☠️ **Hela butikens prislista lästes före varje körning.**
   `listV3ProductPrices()` bläddrar alla produkter, 100 per sida i följd, och
   sedan VEVOR-importen är det runt 170 sidor. En körning på EN produkt tog 115
   sekunder (2026-10-30). Av budgetens 240 sekunder gick alltså halva till en
   läsning där nio av tio rader inte hörde till Aosom.
2. **Priserna skrevs ett i taget.** Varje pris är en läsning, en PATCH och en
   uppföljning av variantbilden, med 120 ms paus. En tugga med 60 prisändringar
   tog två minuter.
3. ☠️ **Tidsbudgeten prövades bara FÖRE en tugga.** En tugga som började vid
   239 sekunder fick hålla på tills den var klar. Med många prisändringar blev
   det längre än Vercels 300 sekunder, och då dödas körningen utan loggrad,
   utan sparad markör och utan att tuggans mappningar stämplas. En skarp
   körning för hand 2026-11-11 dog så efter ett varv
   (`FUNCTION_INVOCATION_TIMEOUT`), och den schemalagda körningen 2026-11-09
   09:20 UTC saknar rad i `FyndplatsAudit`, sannolikt av samma skäl (loggarna
   sparas ett dygn, så det går inte att se).

Så länge Aosom ändrade en handfull priser om dagen märktes ingenting: fram till
3 november skrev en priskörning 0–13 priser och katalogen gicks igenom på två
eller tre körningar. Sedan flyttade Aosom nästan alla priser två gånger på en
vecka (ner 3–8 november, upp från 9 november). Då skrev varje körning 37–108
priser och hann 50–100 produkter, och ett varv tog fyra dygn.

#### Vad som ändrades

- **Priserna läses per tugga** (`lasWixPriserFor` i synkens beroenden,
  `listV3ProductPriserFor` i `lib/wix/v3-products.ts`): samma prisfråga som
  förut, med ett `$in` på tuggans produkt-id. Mätt mot butiken 2026-11-11: 50
  id gav 50 produkter på 0,34 sekunder och 100 id gav 100 på 0,63, alla med
  prisfälten, och dolda utkast kommer med. Hela prislistan läses inte längre av
  Aosom-synken. Sammanslagna sidor läser som förut sitt facit per variant.
- **Flera produkters priser skrivs samtidigt** (`PRIS_SAMTIDIGA`, tre åt
  gången, `mapWithConcurrency`). Varianterna på EN sammanslagen sida skrivs
  fortfarande i följd, för de delar produktens revision.
- **En hård tidsgräns inne i tuggan** (`prisSlutMs`, 45 sekunder efter
  budgeten). Priser som inte hinns med skjuts upp och räknas
  (`prisUppskjutna`). Det som skrevs stämplas, markören sparas och loggraden
  kommer.
- **Priskörningen går ett helt varv** (`varv`): efter markören till slutet och
  sedan från början fram till markören. Den dag körningen börjar mitt i
  katalogen granskas ändå allt.
- **Schemat:** `13 3 * * *` med `budget=660` (rutten har `maxDuration` 800), och
  fortsättningarna `13 9,15,21 * * *` med `fortsatt=1`. En fortsättning läser
  markören och svarar direkt när den saknas, alltså när förra körningen hann
  hela varvet. Körningen ligger inne i synkfönstret :12–:30
  (`lib/wix/synkfonster.ts`), där andra skrivare väntar.
- **Stoppade prishopp syns.** Loggen och raden i `FyndplatsAudit` säger nu
  vilka produkter 40 %-taket höll kvar (Wix-id och butikspriset före och
  efter). Förut stod bara antalet, och fem synliga varor i lager stod 40–54 %
  från regelpriset utan att någon såg vilka.

#### ☠️ Wix stryper på tempo: tre skydd

Wix edge-spärr utlöses av tempot och går inte att vänta ut inom en körning (se
`02-lagerskrivningen-och-edge-sparren.md`). Samtidiga skrivningar höjer tempot,
så de har tre skydd:

1. **Ett 429 görs om två gånger** (`medOmforsokVid429`, 1 och 3 sekunder).
   ☠️ BARA 429. En PATCH som fick ett annat fel kan ha gått fram, och att
   skicka den igen hade varit en dubbelskrivning.
2. **Efter ett enda 429 som inte gick över går resten av körningen en produkt i
   taget.**
3. **Fem strypta skrivningar i en tugga avbryter körningen** (`STRYPNING_STOPP`,
   `stoppedBy: "strypt"`). Markören står efter tuggan, och workflowen
   `aosom-sync.yml` blir röd i stället för att köra nästa varv rakt in i
   spärren.

`?samtidiga=` (1–6) på rutten och inputen `samtidiga` i workflowen finns för
att takten ska gå att mäta och sänka utan ett nytt bygge.

#### Sex egenskaper som inte ska tas bort

1. ☠️ **Ett tomt svar på prisfrågan är ett LÄSFEL, inte "produkterna saknas".**
   Tuggan får inga priser skrivna, och felet hamnar i `prislistaFel` så att
   körningen inte ser frisk ut.
2. ☠️ **Fler än 100 id delas på flera frågor** (`PRISFRAGA_MAX_ID`). Svaret är
   en sida, och det som inte ryms hade försvunnit tyst.
3. ☠️ **En uppskjuten prisskrivning är inte "oförändrad".** Den räknas för sig
   och stämplas inte, så nästa körning ser att priset fortfarande ska skrivas.
4. ☠️ **En torrkörning skjuter aldrig upp.** Den ska räkna hela tuggan.
5. **`?budget=` kapas vid 660 sekunder.** Med de 45 sekunderna och sista
   tuggans stämplar ryms körningen i 800.
6. ☠️ **Går markören inte att läsa kör fortsättningen ändå.** Att hoppa över på
   ett läsfel hade kunnat lämna ett halvt varv liggande ett dygn till.

#### Vad som inte är mätt

- **Hur många priser en körning hinner i drift.** Uppskattningen är byggd på
  dagens tal: läsningen av hela katalogen tar omkring sex minuter av budgetens
  elva, och resten räcker till några hundra prisskrivningar. En vanlig natt
  (0–13 ändrade priser före 3 november) blir körningen klar med god marginal. En
  natt då Aosom flyttat tusentals priser blir den inte det, och då tar
  fortsättningarna vid. Första körningarna efter deploy ska läsas i loggen.
- **Var Wix gräns för samtidiga prisskrivningar går.** Tre är ett försiktigt
  val, inte ett uppmätt.
- **Att `budget=660` ryms** beror på att den sista tuggan blir klar på under
  två minuter efter budgeten. Blir den inte det dödar Vercel körningen vid 800
  sekunder, som förut vid 300.
