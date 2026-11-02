## VEVOR: steg 4, importen som osynliga utkast (2026-10-29)

Leonards beslut 2026-10-28: alla VEVOR-produkter importeras på en gång, så fort
Wix tar emot dem, som osynliga utkast. Läsarens avläsningar i lager blir utkast
genom samma pipeline som Aosom: rått läge, noll AI-anrop, `visible:false`,
leverantören `vevor` och id:t `vevor:<artikelnummer>`. Publiceringen väntar på
steg 7.

`lib/vevor/to-product.ts` (adaptern) → `bilder.ts` (sex bilder) →
`granskning.ts` (GPSR, medicinteknik, bilder) → `pris.ts` (landad kostnad) →
`import.ts` (körningen) → `import-lager.ts` (Wix). Cron
`/api/cron/vevor-import` var femte minut när importen är påslagen, läget i
`/api/admin/vevor-import`, workflowen **"VEVOR — importen"** (`status` ·
`prov` · `pa` · `av`).

**Priset:** landad kostnad = sidans pris i SEK inkl. moms ÷ 1,24 × (1 −
PRO-rabatten) × 1,25, och sedan husets regel. Mätt mot en riktig faktura
2026-10-29: sidans pris delat med 1,24 gav fakturans pris utan moms på öret,
momsen var 0 % och frakten 0. ⚠️ Frakten är mätt på EN order; JSON-LD:ns 5 EUR
gäller varje land och varje vara och är ingen riktig frakt. Leonard
2026-10-30: frakten kontrolleras inte före publiceringen ("nej" på frågan om
en provbeställning av en billig vara först).

☠️ **Rabattnivån står bara i `FyndplatsAppConfig` (`vevorProRabatt`, procent
som text).** Aldrig i kod, tester, loggar eller ett svar: statusen säger bara
`satt`, `saknas` eller `ogiltig`, och testerna använder påhittade nivåer.
Saknas den importeras ingenting, och `pa` vägras. Ändra den när kontot når en
ny nivå och när medlemskapet förnyas, med en fältvis PATCH som inte läser
tillbaka raden (den bär Aosoms hemliga flödesadress).

**Bilderna (Leonards regel, 50 produkter 2026-10-28; 34 av 34 sparade sidor
2026-10-29):** bara bilder ur produktens egen mapp, originalet. Vanliga
mönstret (12 bilder, f1–f6 i mitten) ger VEVOR:s 9, 8, 1, 10, 11 och 12, och
13 bilder räknas från slutet. Äldre mönstret (utan f-bilder) ger 1, 8–12 och
bildgranskning. Allt annat ger de sex första och bildgranskning. Mönstret
kräver namnen, inte bara antalet.

Sju egenskaper som inte ska tas bort:

1. ☠️ **En omkörning skapar 0 nya.** Dubblettspärren frågar mappningarna efter
   tuggans id (`supplierProductId` och `importSparr`,
   `Store.mappningarForLeverantorsId`), och en produkt som skapades utan
   mappningsrad står i `foraldralosa` och spärrar artikeln.
2. ☠️ **Wix tak, 50 000 produkter per butik**, prövas före första produkten och
   räknas ned under körningen, med 1 000 platser kvar åt allt annat.
3. ☠️ **Står läsaren fryst efter en spärr står importen också still.**
4. ☠️ **Fem fel i följd stoppar körningen, och markören står kvar före felen.**
   Ett avbrott hos Wix får inte hoppa över artiklar i ett helt varv. Ett
   enstaka fel flyttar markören, och artikeln prövas igen i nästa varv. Tre
   stopp i följd larmar.
5. **Ett varv som gick igenom avläsningar utan att importera något vilar 20
   timmar.** Ett varv som importerade något börjar om direkt, så att artiklar
   läsaren hittat under tiden kommer med, och ett varv som inte hittade någon
   avläsning alls vilar inte: läsaren har då inte hunnit läsa än.
6. ☠️ **Importen frågar aldrig AliExpress.** Pipelinens kompletteringar av
   färgbilder och beskrivning frågade DS-API:t om varje produkt utan
   färgbilder, även Aosoms, med leverantörens artikelnummer som produkt-id
   (`arAliExpressListningsId`, lib/aliexpress/product-id.ts).
7. ☠️ **Svaret, loggraden och larmet bär bara antal och Wix-id.** Markören och
   de föräldralösa raderna bär artikelnummer och bor bara i Wix.

**Granskningen på raden** (`vevorGranskning`): GPSR-status (manualen inte
läst, eller ingen manual), möjlig medicinteknik och bildmönstret. Fältet bär
inga identifierare, och poleringens läsning skriver ut det. Medicinteknik
avgörs på VEVOR:s kategori-id (patientlyftar, rullstolar, rollatorer med
flera, ur menyn 2026-10-29) och på vårdord i kategori- och produktnamnet.
Kön (/admin/queue) visar flaggorna, filtrerar på leverantör och visar högst
300 kort åt gången (`?alla=1` visar alla).

**Utkasten saknar "EU-lager"-märkningen.** Sidan säger bara att lagret är
VEVOR:s EU-lager, inte vilket land. Mappningen bär `hasEuWarehouse: true`
och en tom landlista. Märkningen avgörs vid publiceringen.

**Vad det kostar:** en produkt tar 5–10 sekunder (sex bilder i följd och
skapandet), så hela katalogen är ungefär ett och ett halvt dygn funktionstid.
⚠️ Mappningarna blir ungefär 3,5 gånger fler. Varje jobb som läser alla
(kön, flödena) läser då längre. Synkerna och läsarens prioritering läser bara
sin egen leverantörs rader sedan steg 5, men butikens prislista läses hel; följ
Aosom-synkens `stoppade på` efter importen. Fem svep över hela katalogen hade
tak vid 20 000 eller 30 000 produkter, se *Katalogtaken* i steg 5.

**Inte gjort, med flit:** ommappningen av VEVOR-varor som kom in via
AliExpress (de bär ett AliExpress-id, och en automatisk matchning hade
gissat; poleringen avgör, som för Aosom), spärren mot publicering utan GPSR
(steg 7) och läsning av manualerna. Syskonen slås ihop sedan steg 8. Synken kom i
steg 5, se nästa avsnitt.
Artikelnumret stod inte i titel, beskrivning eller specifikation på någon av
34 sidor. `gatelib.ARTNR` fäller ändå formen sedan 2026-10-30, se
*VEVOR-poleringen*.

**Efter mergen,** i den ordningen, när läsaren har läst katalogen: `status`
(rabatten `satt`, läsaren inte fryst, platser kvar under taket), `prov` torrt
med `max` 5, `prov` skarpt med `max` 5, titta på utkasten i Wix (bilder, pris,
text), sedan `pa`. Klart när `status` visar ett varv som vilar och
leverantörsräkningen visar lika många VEVOR-rader som avläsningar i lager.
