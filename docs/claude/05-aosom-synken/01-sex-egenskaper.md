### Sex egenskaper som inte ska tas bort

1. ☠️ **`MIN_FEED_RADER` kastar.** Ger feeden färre än 2 000 rader avbryts
   körningen. En halvhämtad CSV får aldrig tolkas som att lagret tagit slut —
   det är skillnaden mot AE, där ett fel bara kan nolla en produkt.
2. ☠️ **En rad som försvinner är INTE utgången.** Aosoms B2B-guide, ordagrant:
   *"Items with low stock may be temporarily removed to avoid overselling."*
   Raden är ett lagerbesked. Rätt svar är att nolla saldot och låta sidan ligga
   kvar; nästa körning där raden är tillbaka återställer saldot av sig själv.
3. **`LAGER_BUFFERT = 0`** sedan 2026-10-06 (Leonard: *"ta bort den där 1 kvar
   bufferten"*); 1 från 2026-10-01, 3 dessförinnan. Har Aosom 1 kvar visar vi 1.
   ⚠️ Accepterad risk: feeden uppdateras tre gånger per dygn, så Aosom kan ha
   sålt sin sista enhet till någon annan innan nästa synk. Då får ordern
   avbokas. ☠️ **Ta aldrig bort `medSaldaAvdragna`**, som drar av det vi sålt
   tills Aosoms flöde visar det (se *En stämpel som ljuger rättas mot
   butiken*). Det är den, inte bufferten, som hindrar att samma enhet säljs två
   gånger.
4. **`limit` tar av SKRIVNINGAR, inte av granskningar.** En redan synkad
   produkt kostar noll Wix-anrop. ☠️ Att cronen därmed skulle konvergera UTAN
   sparad markör höll inte (2026-10-13): Aosoms saldon rör sig hela tiden, så
   huvudet av katalogen blev aldrig klart och svansen nåddes aldrig. De
   schemalagda körningarna sparar sedan dess var de slutade (`?rotation=`).
5. **`MAX_PRISANDRING_PCT = 40`.** Prissynken är tvåvägs och helautomatisk
   (Leonards beslut 2026-08-28: "synka oavsett om det går upp eller ner"), men
   en frakt som råkat bli 0 eller ett grossistpris med fel decimal får inte nå
   kund. Över taket skrivs ingenting och raden hamnar i `varningar`.

   **Ett känt hopp kan godkännas för en körning** (`godkannPrisandring`, sedan
   2026-09-30). Workflowens input `godkann_pris` tar Wix-produkt-id, och för
   dem släpps bara taket: regelpriset, golvet, prislåset och skrivordningen
   gäller som vanligt. Godkännandet sparas ingenstans, så nästa trasiga
   feed-rad på samma produkt stoppas igen. Hoppen står i `godkandaHopp` med
   wix-id och belopp, aldrig artikelnummer. Byggt för gunghästens rosa, som
   taket stoppade vid varje körning (1 199 → 699 kr, Leonards beslut).
6. ☠️ **Facit för priset är BUTIKEN, inte mappningen** (`jamforelsePris`,
   sedan 2026-09-02). Mappningens `grossSek` är vad vi TROR att kunden ser;
   Wix är vad kunden faktiskt ser, och en trasig skrivning får de två att glida
   isär permanent — se avsnittet nedan. Butikens priser läses i bulk FÖRE
   loopen (`listV3ProductPrices`, 100 produkter per anrop) och samma
   massfel-spärr gäller som för feeden: färre än `MIN_WIX_PRODUKTER` (500)
   produkter är ett LÄSFEL och kastar, för en tom prislista hade sett ut som
   "alla priser har ändrats" och skrivit om hela katalogen.

Wix skrivs före mappningen, samma ordning och samma skäl som `price-repair`.
Alla tre kostnadsfälten skrivs — `grossSek`, `costUsd` och `landedCostSek` —
aldrig bara priset.
