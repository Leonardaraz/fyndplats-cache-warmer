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
   Wix-id.** Motorns fel och varningar bär artikelnumret. Rutten tar bort det
   (`utanArtikelnummer`) och förseglar markören.

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
