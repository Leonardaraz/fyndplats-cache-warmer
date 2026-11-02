### `prisLast`: en rad där synken räknar om men INTE skriver (2026-09-05)

Synken tillämpar husets regel (`1,20 × landedCostSek`, charm99) på varje
Aosom-rad var sjätte timme. Det är rätt för sortimentet i stort — men en rad kan
ha ett pris som satts av något annat än kostnaden.

Fallet som byggde låset: kontorsstolen `f13cd415` såldes som AliExpress-vara på
**1 299 kr**. Leonards regel 2026-09-05 (*"alla ska peka om mot Aosom DE oavsett
om de är billigare eller inte"*) mappade om den till sitt Aosom-artikelnummer, och därmed
gäller Aosom-regeln på raden: nästa synk hade skrivit **1 099 kr**. Sänkningen
kom av att vi bytte LEVERANTÖR, inte av att marknaden rört sig — och kunderna
betalar redan 1 299.

Utan låset finns ingen väg dit. Skriver man priset för hand räknar nästa körning
fram regelpriset igen, ser en skillnad mot butiken och skriver tillbaka. Det ser
ut som om ändringen "inte tog".

`prisLast: true` på mappningsraden. Sätts via `/api/admin/prislas` och
workflowen **"Pris — lås eller lås upp ett pris"** (lägen `las` · `las-upp`) —
samma nyckel-lösa upplägg som resten, alltså körbar från en telefon.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Låset rör BARA priset.** Lagret synkas som vanligt. Att sluta spegla
   saldot hade betytt att vi säljer något vi inte har, och det är ett kundfel
   medan ett oförändrat pris inte är det.
2. ☠️ **Grinden ligger FÖRE uträkningen.** En rad vi ändå inte tänker skriva ska
   inte kunna hamna i `varningar` för ett hopp som aldrig skulle blivit av. Ett
   falsklarm som alltid fyrar lär mottagaren att sluta läsa — samma argument som
   mot att varna vid 48 h på token-förnyelsen.
3. ⚠️ **Låsta rader RÄKNAS, de hoppas inte tyst över.** `prisLasta` står i
   loggraden, audit-raden, svaret och workflow-summeringen. Ett låst pris slutar
   följa kostnaden: stiger Aosoms frakt äts marginalen tyst, så ett lås som
   ingen ser är ett lås som glöms bort. Lås upp när skälet är borta.
4. ☠️ **Rutten skapar ALDRIG en rad** (404 på saknad mappning) och **läser
   tillbaka efter skrivningen** (500 om värdet inte sitter). Nionde gången samma
   lärdom: ett svar utan fel är inget kvitto.
5. ☠️ **`last` har ingen default** — ett utelämnat fält avvisas med 400. Samma
   fälla som GitHubs tomma workflow-input, som publicerade utkast i tolv timmar;
   låset finns just för att någon medvetet sagt att priset ska stå still, och
   att tyst tolka tystnad som "lås upp" är fel riktning att fela åt.

☠️ **Vid låsning stäms böckerna av mot butiken.** Mappningens `grossSek` är vad
vi TROR att kunden ser; Wix är vad kunden faktiskt ser. Synken håller normalt de
två i fas — och i exakt den sekund låset sätts slutar den göra det, så en
skillnad som finns då blir PERMANENT. Samma förväxling som `jamforelsePris`
byggdes för, i ett nytt hörn.

Konkret på kontorsstolen: ommappningen till Aosom rör aldrig priset (Leonards
beslut), så mappningen bar kvar AliExpress-tidens **879 kr** medan butiken tog
**1 299**. Med ett lås ovanpå det hade lönsamhetsöversikten
(`lib/analytics/profit.ts`) och marginalbanden för alltid räknat 879 mot en
landad kostnad på 900,21 — alltså rapporterat en vara som säljs **med förlust**
när den ger 30 % marginal. Det är en BOKFÖRINGSRÄTTELSE: kundens pris rörs inte,
och `landedCostSek`/`costUsd` rörs inte heller.

Fyra egenskaper i avstämningen:

- **Bara vid LÅSNING.** Vid upplåsning tar synken över och rättar raden själv.
- ☠️ **Tvetydigt butikspris skriver ingenting.** `tolkaProduktPris` svarar `null`
  när varianterna har olika pris; att då falla tillbaka på mappningen hade varit
  exakt buggen `utanWixPris` finns för att undvika.
- ☠️ **En fallen Wix-läsning stoppar inte låset — men syns.** Låset är den
  brådskande halvan; skälet går ut i svaret, audit-raden och workflow-loggen, så
  en utebliven avstämning aldrig kan se ut som en gjord.
- **Alla varianter rättas.** Priset är entydigt i butiken, alltså gäller det var
  och en.

⚠️ **Poleringens prisgrind känner till låset.** Utan det hade den fällt varje
låst Aosom-rad med *"PRISGRINDEN FALLER — kostnaden har ändrats och priset i Wix
är gammalt"*. Rätt RÅD (rör inte priset), fel SKÄL: priset är inte gammalt, det
är valt — och ett rött jobb på ett medvetet beslut är samma falsklarm som
`regelGäller` byggdes för att ta bort. `prisgrind` bär därför `prisLast`, och
workflowen svarar `LÅST PRIS` och går grön. Resten av poleringen (text, bilder,
SKU) är opåverkad.

Verifierat i drift 2026-09-05, samma dag: torrkörning över hela katalogen gav
`4 548 granskade, 1 prislåsta`, och kontorsstolen finns varken bland de
planerade prisskrivningarna eller bland varningarna.

Tjugotre tester, verifierade genom att återinföra buggarna en i taget: synk-
grinden borta fäller fyra, defaulten tillbaka fäller två, 404-grinden borta
fäller ett, återläsningen borta ett, en gissande avstämning ett, en tyst fallen
Wix-läsning ett och en avstämning vid upplåsning ett — rätt test för rätt bugg.
