## VEVOR: steg 1 och 3 — leverantören är en uttömmande typ (2026-10-21)

VEVOR kan bli den tredje leverantören. Inga VEVOR-varor finns i butiken. Det
som byggts är grunden, som gör motorn bättre även om VEVOR aldrig blir av.
Steg 2, läsaren av VEVOR:s produktsidor, är byggd sedan Leonards beslut
2026-10-28 — se *VEVOR: steg 2* nedan.

### Steg 1: varje val mellan leverantörer tar ställning till alla

Koden valde väg med två grenar: "är det AliExpress? annars Aosom", eller
tvärtom. En tredje leverantör hade hamnat i fel gren utan att något fel syntes.
Konkurrentpris-planen hade kunnat ge en VEVOR-rad dealproffsens pris, och
ommappningen hade behandlat en VEVOR-sida som en AliExpress-sida.

- `LEVERANTORER = ["aliexpress", "aosom", "vevor"]` i `lib/store/index.ts`.
  `MappingSupplier` härleds ur listan, och `Leverantor` är den plus `"okand"`.
  Prefixen bor i `lib/store/leverantorsprefix.ts`.
- `mappingSupplier()` (`lib/store/supplier.ts`): ett känt sparat fält vinner,
  ett okänt sparat värde blir `"okand"`, och utan fält avgör prefixet (`aosom:`,
  `vevor:`). Annars blir raden `"aliexpress"`, som förut.
- Kod som bara gäller en leverantör använder ett positivt filter
  (`if (!isAosomMapping(m)) continue;`). En verklig skillnad per leverantör är
  ett `switch` med `assertNever`, eller en `Record<Leverantor, …>`. Då stoppar
  `next build` en ny leverantör tills den fått ett svar på varje ställe.
- `frystLeverantor()` skriver klassningen till fältet när `supplierProductId`
  töms (pensionering och radering). Ett okänt sparat värde behålls.

☠️ **Ingen befintlig rad bytte klass.** Den enda väg som fanns är en rad UTAN
fält vars id börjar med `vevor:`: den var AliExpress förut och är VEVOR nu.
Ingen kod har skrivit ett sådant id, och räkningen nedan fäller om det finns ett.

☠️ **Grinden är `lib/store/leverantorsval-grind.test.ts`.** Den läser koden med
TypeScripts egen parser och fäller sex former av tvåvägsval (R1–R6). På main
före ändringen fann den 17 ställen: 15 är omgjorda och 2 är undantagna med skäl
(`UNDANTAG`), och testet fäller om ett undantag inte längre finns i koden.
Verifierad genom att återinföra `if (isAliExpressMapping(m)) {` i
konkurrentpris-planen: exakt den raden fälls, som R3. Ett val som döljs bakom
en funktion ser grinden inte. Tre sådana hittades vid granskningen:
ommappningen, beställningens felmeddelande och poleringens `regelGäller`.

Vad en VEVOR-rad får i dag:

| väg | VEVOR |
|---|---|
| beställningen (`place-order.ts`) | vägras, och felet pekar på VEVOR:s kassa och workflowen "Order — beställd eller skickad för hand" |
| AliExpress-åtgärderna i `/admin` | vägras med eget meddelande (`utanAeIdFel`) |
| ommappningen | hindret `vevor_sida` (`okand_leverantor` för ett okänt värde) |
| konkurrentpris, dealproffsen, Google-tillägget | aldrig med |
| AE-synken och Aosom-synken | aldrig med |
| restock-listan | lagret hos leverantören visas som okänt |
| leverantörslänkarna | namnet VEVOR, och en länk bara ur mappningens `sourceUrl` |

⚠️ **En avsiktlig beteendeändring:** poleringens prisgrind (`regelGäller` i
`lib/polish/mapping-access.ts`) läser klassningen i stället för det råa fältet.
En Aosom-rad som tappat fältet men har prefixet räknas nu som Aosom.

**Räkningen:** workflowen **"Leverantörer — räkna mappningarna per leverantör"**
→ `/api/admin/leverantorsrakning` → `lib/store/leverantorsrakning.ts`. Bara antal:
per leverantör, per sparat fält, id-formen på rader utan fält, rader där fält och
id är oense (`faltOchIdOense`), och AE- och Aosom-synkens urval med synkernas
egna predikat. Jobbet fäller om en rad utan fält bär prefixet `vevor:`. Talen per
id-form är underlaget för om regeln "utan fält är AliExpress" ska skärpas till
"bara siffror är AliExpress". Den är inte skärpt.

### Steg 3: synken tar emot ett besked, inte en Aosom-rad

`lib/sync/leverantorsrad.ts` har radformatet `Leverantorsrad` (artikel, status,
saldo, landad kostnad, avläsningstid), `lagerbesked()` och en profil per
leverantör (`PROFILER`). Profilen säger vad en saknad rad betyder och om
konkurrentregeln gäller. Aosom-synken läser feeden genom en adapter
(`aosomTillRad` i `lib/aosom/sync.ts`), och resten av synken är som förut.

| | Aosom | VEVOR |
|---|---|---|
| raden saknas | saldo 0, enligt Aosoms B2B-guide | **okänt: ingenting rörs** |
| konkurrentregeln | gäller | gäller inte (Leonard 2026-10-21) |

Statusen `ej_levererbar` finns i formatet för Aosoms fraktsentinel: saldot
nollas och priset rörs inte, men raden räknas inte som slut.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Okänt blir aldrig 0.** En plan med okänt besked (`okand`) sorteras bort
   direkt efter planeringen. Den når varken avdraget för sålda enheter,
   rättelsen mot butiken, skrivningen eller stämpeln. En okänd plan bär
   `onskatSaldo: 0`, så en plan som slank förbi hade fått rättelsen mot butiken
   att skriva 0. Ett test låser det.
2. ☠️ **Raden måste komma från mappningens leverantör.** Annars hade en sida som
   mappningen säger är VEVOR fått Aosoms saldo och pris, bara för att
   artikelnumret råkade finnas i feeden.
3. ☠️ **Aosom-synken planerar bara Aosom-rader.** Urvalet går på prefixet
   `aosom:`. Säger fältet en annan leverantör rörs raden inte, och inte heller
   nollas den som tvetydig sida. Samma regel gäller beställningsfilen
   (`/api/admin/aosom-order`), som håller hela ordern med skälet
   "mappningens leverantörsfält säger inte Aosom", och bildfixen, som hoppar
   över raden. Vägar som bara reserverar eller matchar en artikel, som
   dubblettspärren och syskonsvepet, läser fortfarande prefixet: där är det
   säkrare att en oense rad räknas som upptagen.
4. ☠️ **På en sammanslagen sida gör en okänd färg hela sidan okänd.** Sidans
   saldo är summan av färgernas.
5. **Det räknas:** `okantBesked` och `okantBeskedProdukter` (Wix-id) står i
   svaret, loggraden, audit-raden och workflow-summeringen. För Aosom ska talet
   vara 0. Workflowen fäller även i torrläge om det inte är det, för en sådan
   rad synkas inte alls, och ingen körning lagar den av sig själv.

☠️ **Inte samma sak som `okandaVarianter`.** Den räknaren gäller Wix-varianter
som mappningen inte känner till, och de NOLLAS. Ett okänt besked rör ingenting.

Verifierat lokalt mot den gamla synken från main, på samma slumpade indata:
20 000 körningar gav samma summering och samma anrop till alla beroenden i
samma ordning (läsningar, lager, priser, mappningar och restock-mejl), och
44 171 planer var identiska. Ett planterat fel fälldes vid andra fallet.
Jämförelsen ligger inte i repot, eftersom den kräver en kopia av den gamla
synken.

### Inte gjort, med flit

- **Stämpelfälten har kvar sina namn** (`aosomSyncedQty`, `aosomSyncedAt`). Ett
  namnbyte rör 37 ställen i sju filer, 82 i tester, poleringens workflow och
  `tools/polish-gates/gate-lager.py`, och kräver en migrering av alla
  Aosom-rader. Mellan deployen och migreringen hade den ena halvan läst ett tomt
  fält, och synken hade då sett varje stämpel som saknad. Steg 5 lät namnen
  stå: VEVOR-raderna stämplas i samma fält (se *VEVOR: steg 5*).
- ✅ **Bufferten, `MIN_FEED_RADER` och fönstret för beställda enheter** står i
  profilen sedan steg 5. Konstanterna i `lib/aosom/sync.ts` läser Aosoms profil.
- ✅ **Loggspärren fångar VEVOR:s artikelnummer sedan steg 2** (19 eller 22
  tecken, versaler och siffror i ett). `redigera()` i de sex workflows som har
  den tvättar formen, och `ARTNR` i `artikelnummer-i-logg.test.ts` fäller den i
  en workflows källa. ✅ `gatelib.ARTNR` (poleringens grind på kundtexten, med
  speglar i `gate-form.py` och `lib/polish/skrivplan.ts`) fäller formen sedan
  2026-10-30, när poleringen av VEVOR-utkast började. Se *VEVOR-poleringen*.
- **AE-synken har ingen torrkörning per anrop.** Dess urval är samma uttryck som
  förut, nu som `arIAeSynkensUrval`, och räkningen visar dess storlek.

**Efter mergen:** kör räkningen och Aosom-synken i torrläge, utan att någon
annan körning av synken pågår. Räkningen ska ge `utanFalt.vevorPrefix` 0 och
`perLeverantor.vevor` 0. Synken ska ge `okantBesked` 0, och samma granskade,
lager, priser och fel som en torrkörning direkt före mergen.
