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
5. ☠️ **Inget tak på prisändringen sedan 2026-11-25** (Leonard: "ta bort aosoms
   tak också"). Prissynken är tvåvägs och helautomatisk (Leonards beslut
   2026-08-28: "synka oavsett om det går upp eller ner"), och priset följer nu
   regelpriset hur stort hoppet än är. Från 2026-08-28 till 2026-11-25 skrevs
   ett hopp över 40 % inte (`MAX_PRISANDRING_PCT`): raden hamnade i
   `varningar` tills en människa godkänt den (`godkannPrisandring`, byggt
   2026-09-30 för gunghästens rosa, 1 199 → 699 kr). Taket höll kvar priser i
   dagar utan att någon såg det, och Leonard tog bort det.

   Det som är kvar mot en trasig feed-rad, och inget av det får tas bort:

   - ☠️ **En enstaka rad med fel decimal eller en frakt som blivit 0 skrivs vid
     nästa priskörning.** Aosom har ingen andra avläsning.
   - `MIN_FEED_RADER` (2 000): en halvhämtad feed avbryter körningen.
   - `MIN_RIMLIGT_PRIS_SEK` (20 kr): ett lägre pris skrivs aldrig.
   - ☠️ **En rad som inte skickas till Sverige prissätts aldrig**
     (`planeraProdukt`). Sentinelfrakten ger annars ett regelpris på
     tiotusentals kronor, och sedan taket togs bort är det här den enda
     spärren mot det.
   - Prislåset (`prisLast`) och auktionslåset: en låst rad och en produkt i en
     levande auktion skrivs aldrig.
   - **Varje hopp över 40 % står i raden** (`storaHopp`: loggen, kvittoraden i
     `FyndplatsAudit` och workflowens utskrift, märkt ↕️), med Wix-id och
     butikspriset före och efter. Ingen godkänner dem längre, så det ska gå
     att se i efterhand vilka priser som flyttade sig mest.

   Taket står som ett fält i leverantörens profil (`maxPrisandringPct` i
   `lib/sync/leverantorsrad.ts`, null för Aosom och VEVOR). Grenen och
   godkännandet finns kvar i motorn och prövas direkt mot `planeraPris`.
   Workflowens `godkann_pris` gör ingenting förrän profilen får ett tak igen.

   Mätt samma dag (torrkörning 09:32 UTC, före deployen): taket höll ett enda
   pris. Massagefåtöljen `297d8979`, färgen svart, 5 179 → 2 899 kr (−44 %),
   medan de tre andra färgerna står på 4 699–4 879 kr. Taket stoppade den
   första gången 03:24 UTC samma dag (då 5 179 → 2 999), så två körningar sex
   timmar isär gav nästan samma pris. Det skrivs av den första priskörningen
   efter deployen. **Inte mätt:** om Aosom sänkt just den färgen med flit eller
   om raden är fel. Feeden säger bara priset.

   **Första priskörningen utan tak, 2026-11-26 03:13 UTC** (#938, bygget READY
   01:15): hela katalogen på ett varv (5 258 granskade, 612 priser, 0
   misslyckade, "stoppade på klart, 0 kvar"), och ett enda hopp över 40 %:
   massagefåtöljen `297d8979`, 5 179 → 2 899 kr (−44 %). Wix efteråt: prisspannet
   2 899–4 879 kr, de andra tre färgerna orörda.
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
