## VEVOR: steg 5, synken (2026-10-29)

Lager och pris på VEVOR-raderna i butiken, med samma motor som Aosom-synken och
läsarens avläsningar som källa. Motorn är `korSynk` i `lib/aosom/sync.ts`.
`runAosomSync` kör den med Aosoms feed och `lib/vevor/synk.ts` med VEVOR:s
avläsningar (`vevorKalla`). Allt efter källan är gemensamt: avdraget för sålda
enheter, rättelsen mot butikens saldo, prislåset, auktionslåset, taket på 40 %,
att Wix skrivs före mappningen, stämpeln på den färska raden och restock-mejlen.

Cron `/api/cron/vevor-synk` minut 50 varje timme, efter Aosom-synken (minut 20).
Läget i `/api/admin/vevor-synk`, workflowen **"VEVOR — synken"** (`status` ·
`torr` · `skarp` · `pa` · `av`).

**Profilen** (`SYNKPROFILER` i `lib/sync/leverantorsrad.ts`):

| | Aosom | VEVOR |
|---|---|---|
| raden saknas | slut | okänd: ingenting rörs |
| konkurrentregeln | gäller | gäller inte (Leonard 2026-10-21) |
| buffert | 0 | 0 (Leonard 2026-10-28) |
| minsta antal rader | 2 000 | ingen, en saknad rad är redan okänd |
| beställda enheter dras av | 12 timmar | 12 timmar |
| nytt pris | direkt | när två avläsningar i rad ger samma regelpris |

Aosoms tal är desamma som förut. `MIN_FEED_RADER`, `LAGER_BUFFERT` och
`NYSS_BESTALLD_MS` läser Aosoms profil, och Aosom-synkens tester går igenom
oförändrade, utom ett som gällde VEVOR:s buffert.

Sju egenskaper som inte ska tas bort:

1. ☠️ **Okänt rör aldrig lagret.** En avläsning som saknas, är äldre än tolv
   timmar eller vars senaste försök misslyckades är okänd, och en fryst läsare
   gör varje avläsning okänd (`vevorRad`). Planen sorteras bort före avdraget,
   rättelsen mot butiken, skrivningen och stämpeln, och räknas i
   `okantBesked`. Ett test har stämpeln 5, butiken 3 och en gammal avläsning:
   ingenting skrivs, och samma avläsning en minut färskare skriver.
2. ☠️ **Ett nytt pris kräver två avläsningar i rad med samma regelpris.** VEVOR
   räknar om sina priser från euro, så ett pris kan hoppa fram och tillbaka.
   Läsaren sparar föregående avläsnings pris (`forraPrisSek`, `medForraPris` i
   `lib/vevor/lasare.ts`), och `vevorRad` räknar båda med importens prisregel
   och rabatten. Skiljer regelpriserna sig åt väntar priset (`prisVantar`).
   Spärren ligger före taket, så ett pris som väntar hamnar inte i
   `varningar`. Avläsningarna före deployen saknar föregående pris, så inget
   nytt pris skrivs förrän artikeln lästs två gånger efter deployen.
3. ☠️ **Rabatten fäller inte lagret.** Saknas `vevorProRabatt` eller går den
   inte att läsa bär raderna ingen kostnad: inga priser skrivs, skälet går ut i
   `prislistaFel` och workflowen fäller, men lagret synkas. `pa` vägras utan
   rabatt.
4. ☠️ **Raden ska vara VEVOR:s.** En rad med prefixet `vevor:` vars
   leverantörsfält säger något annat rörs inte och räknas i
   `leverantorOense`. Workflowen fäller på den, även i torrläge.
5. ☠️ **Bara skarpa schemalagda körningar flyttar markören** (`vevor` i
   `sync_markor`, samma regel som Aosoms rotationer). En körning för hand bär
   sin markör förseglad i svaret och rör inte schemats. Ett lås (`synklas`,
   fem minuter) hindrar två körningar samtidigt, och en körning för hand som
   möter schemat får `upptagen`.
6. **Schemat gör ingenting förrän synken slagits på** och läser då inte ens
   källan. En avstängd körning loggar ingenting.
7. ☠️ **Svaret, loggraden, tillståndet och audit-raden bär bara antal och
   Wix-id,** och för prishoppen butikspriset före och efter (2026-11-25, se
   sist i filen). Motorns fel och varningar bär artikelnumret. Rutten tar bort
   det (`utanArtikelnummer`) och förseglar markören.

**Fönstret för beställda enheter är lika långt som en avläsning lever.** En
order som markerats beställd dras av i tolv timmar. En avläsning från före
beställningen är okänd tolv timmar efter att den gjordes, alltså innan avdraget
upphör, så varje avläsning som används efter fönstret är gjord efter
beställningen. Det förutsätter att VEVOR:s lager på sidan visar ordern direkt,
och det är inte mätt. Ett test fäller om fönstret blir kortare än avläsningens
livstid. En obeställd order dras alltid av.

**Mappningarna läses per leverantör** (`listMappingsMedPrefix`: `$startsWith`
på `supplierProductId` i Wix, `starts_with` i Postgres). Aosom-synken,
VEVOR-synken och läsarens prioritering läser bara sitt eget prefix. Uppmätt
2026-10-29: 4 827 av 7 398 rader bar `aosom:`, och filtret höll över
markörsidorna. Efter importen är mappningarna ~22 000. En rad med blanksteg
före prefixet kom med förut, eftersom urvalet trimmar, men inte nu. Ingen kod
skriver ett sådant id (`aosomSupplierProductId`). Avläsningarna läses en gång
per körning med bara synkens fält (`SYNKFALT`), och `fields` skickas på varje
sida (uppmätt samma dag: fältvalet håller på sida två).

**Stämpelfälten heter som förut.** VEVOR-raderna stämplas i `aosomSyncedQty`
och `aosomSyncedAt`. Ett namnbyte hade krävt en migrering av ~4 800 Aosom-rader,
och mellan deployen och migreringen hade synken sett varje stämpel som saknad.
Fälten betyder "synkens stämpel", och namnet är arv. `aosomFreightShare` och
`aosomBildFiler` gäller bara Aosom.

### Katalogtaken

Fem svep över hela katalogen hade egna sidtak på 200 eller 300 sidor, "långt
över nuvarande katalog". VEVOR-importen tar katalogen från ~6 300 till ~22 000
produkter. Prislistan som båda synkerna läser, svepet bakom Prisjakt-flödet
(`listV3ProductsForFeed`) och städningen av val hade kastat vid 20 000.
Ingenting hade skrivits fel, men priserna och flödet hade stannat ungefär ett
dygn efter att importen slagits på.

Taket är nu ett, `KATALOG_SIDTAK` i `lib/wix/limits.ts`: Wix tak på 50 000
produkter per butik och tio sidor till. Ett svep som når det har en markör som
aldrig tar slut, och kastar. `lib/wix/katalogtak.test.ts` låter varje svep läsa
25 000 produkter. Verifierat genom att återinföra varje gammalt tak: rätt test
fäller, och bara det.

⚠️ **Två saker som taket inte löser:**

- **Katalogsvepet för färgbilderna och raderingen av pensionerade utkast**
  (`listCatalogProductMedia`) har 150–170 sekunders tidsbudget. Det tog under en
  minut för ~6 000 produkter (2026-09-28). Med 22 000 kan det ta längre, och då
  vägrar verktygen ett ofullständigt svep, som de ska. Mät efter importen.
- **Butikens variantsvep till Google-flödet** (headless-site,
  `fetchAllVariantsRaw`) har tak vid 30 000 varianter. Efter importen är de
  ungefär 25 000.

### Vad en körning läser

Före första tuggan läser körningen alla VEVOR-avläsningar (sidor om 1 000),
VEVOR:s mappningar (sidor om 500) och butikens hela prislista (sidor om 100,
~220 efter importen). Allt räknas in i tidsbudgeten på 240 sekunder. Följ
`stoppade på` och `kvar` i loggraden. En körning som stannar på tidsbudget med
få granskade är ett fel, inte en lugn timme.

**Inte gjort, med flit:**

- **Prislistan läses hel, inte per tugga.** Det är ~220 anrop i följd varje
  timme efter importen. Att läsa den per tugga hade ändrat Aosom-synkens prisdel
  med hela katalogen som blast-radie. Mät körtiden efter importen först.
- **Restock-mejl** går som för Aosom, men utkasten har inga bevakare.

**Efter mergen,** när importen har skapat utkast och läsaren har läst dem:

1. `status`: rabatten `satt`, läsaren inte fryst.
2. `torr`. Utkasten läses en gång per dygn, så ungefär hälften har okänt besked.
   `leverantorOense` ska vara 0 och `prislistaFel` tomt.
3. Provet att okänt inte rör lagret: välj ett utkast vars avläsning är äldre än
   tolv timmar (`okantBeskedProdukter`), och läs dess lager i Wix före och efter
   nästa steg. Det ska vara oförändrat.
4. `skarp`, och direkt efter `torr`. Den andra ska vilja skriva 0 lager och 0
   priser. Läsaren skriver nya avläsningar var femte minut, så en handfull
   skrivningar kan vara nya avläsningar.
5. `pa`.

Klart när torrkörningen efter den skarpa vill skriva 0 och provet visar orört
lager.

### Stoppade prishopp: syns i raden och godkänns för hand (2026-11-25)

Leonards fråga 2026-11-25: "kolla att vevors prissynk också funkar som det
ska". Synken gick som den ska. Det som inte fungerade var att ingen såg vad
40 %-taket höll kvar.

Mätt samma natt:

- **Vercels logg, 23 timmar:** 23 av 23 timkörningar, 0 misslyckade
  skrivningar, och prisdelen föll aldrig. `FyndplatsAudit` 20–23 november: 24
  rader om dygnet, inga luckor.
- **Varvet:** två timmar så länge få priser ändrades (0–11 prisskrivningar per
  körning). Under 24 november, från omkring 08 UTC i loggen, sänkte VEVOR sina
  priser brett: av 15 531 avläsningar gjorda inom 26 timmar låg 9 070 under 10 %
  lägre än avläsningen före (107 låg 10–28 % lägre, 23 högre). Då skrev varje
  körning 150–300 priser och hann 1 200–1 600 rader, och ett varv tog upp till
  åtta timmar.
  Prisskrivningarna går en i taget, cirka 300 på budgetens 240 sekunder.
- **Torrkörningen 01:06 UTC:** 11 375 granskade, 4 priser och 496 lagersaldon
  att skriva, 3 249 priser som väntar på en andra avläsning och 5 569 med okänt
  besked. Synken var alltså ikapp med allt som gick att skriva.
- **Läsaren:** 2 848 publicerade sidor, 221 av dem heta, och 5 utan avläsning
  på tolv timmar.

☠️ **17 prishopp stod stoppade, alla på publicerade varor i lager.** 14 stod
42–95 % under regelpriset och 3 stod 51–54 % över. 20–23 november stoppades
runt 100 hopp per varv (97–102), dygn efter dygn. Timraden och audit-raden bar
bara antalet
("3 varningar"), bara en körning för hand skrev ut vilka produkter det gällde,
och rutten hade inget godkännande. Aosom-synken fick båda 2026-11-11
(`41-en-priskorning-om-dagen.md`), VEVOR-synken fick dem inte.

**Ändrat:**

- **Raden säger vilka** (`synkloggrad`, alltså både Vercels logg och raden i
  `FyndplatsAudit`): Wix-id och butikspriset före och efter, högst
  `HOPP_I_RADEN` (60). Resten räknas ("… 7 till").
- **En skarp körning som bara stoppade ett hopp skriver sin audit-rad.** Förut
  skrevs raden bara när något skrivits eller fallit.
- **`?godkannPris=<wix-id>,…` på rutten** och inputen `godkann_pris` i
  workflowen, i lägena `torr` och `skarp`. Motorn hade redan valet
  (`godkannPrisandring`, Leonards beslut 2026-09-30), VEVOR-rutten skickade det
  bara inte vidare.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Schemat godkänner aldrig.** `korVevorSynk` släpper bara igenom valet när
   `manuell` är satt, och rutten vägrar `godkannPris` utan `manuell=1`.
2. ☠️ **Bara taket släpps.** Ett pris som väntar på sin andra avläsning skrivs
   inte av ett godkännande, och en produkt med okänt besked rörs inte.
3. ☠️ **Ett godkännande som inte går att följa vägras eller syns.** Ett id som
   inte är ett Wix-id ger 400, `godkann_pris` i läget `status`, `pa` eller `av`
   fäller workflowen, och anges fler produkter än de hopp som godkändes säger
   workflowen det. Ett skrivfel hade annars tyst betytt "ingenting godkänt".
4. **Godkännandet sparas ingenstans.** Nästa hopp på samma produkt fångas av
   taket igen.

**Så körs det:** `torr` med `godkann_pris` (raden "✅ godkänt" visar vad som
skulle skrivas), sedan `skarp` med samma id. En körning för hand går hela
katalogen och skriver också de lagersaldon och priser som väntar.

Verifierat: 48 prov i `lib/vevor/synk.test.ts` och ruttens prov, och tolv
avsiktliga fel, ett i taget, som alla fälls. Workflowens skript är kört mot en
låtsasrutt: godkännandet kommer med i adressen, och fel läge fäller.

**Inte mätt, och inte gjort:**

- **Varför de 17 står så långt från regelpriset.** Antingen har VEVOR ändrat
  priset, eller så gäller avläsningen en annan variant eller förpackning än
  sidan. Taket finns för att en människa ska titta på just det, produkt för
  produkt.
- **De hopp som väntar på en andra avläsning syns inte som stoppade.** Väntan
  prövas före taket. Av de runt 100 som stoppades per varv 20–23 november
  syntes 17 natten mot 25 november. Resten väntas komma tillbaka när deras
  andra avläsning är gjord.
- **Varvet på åtta timmar under en prisvåg** är inte ändrat. Budgeten är 240
  sekunder en gång i timmen, och det räckte: torrkörningen ville skriva 4
  priser.
