## ☠️ Orderpipelinen hade EN väg in, och inget nät under (2026-08-31)

`/admin` läser **bara `store.listTasks()`** — den tittar aldrig på Wix-ordrar.
Enda vägen dit är webhooken `/api/wix-order`. Går den skrivningen fel är ordern
borta för oss medan kunden har betalat, och Wix ger upp efter ett fåtal retries.

Det inträffade. Order 10024, betald 09:27, syntes aldrig i admin. Webhooken kom
fram tre gånger och svarade 500 varje gång:

```
WDE0195: Items limit exceeded. Delete some items and try again.
```

Wix Datas **radtak** var nått. Tre saker gjorde det värre än en tappad order:

1. **Taket stoppar bara NYA rader.** Uppmätt: en `save` mot en befintlig rad
   svarar `"action":"UPDATED"` och går igenom; en ny rad avvisas. Lagersynken
   uppdaterar befintliga mappningar och såg därför fullt frisk ut hela tiden.
2. **Det hade pågått i ett dygn.** Nyaste audit-raden var 2026-08-30 12:25 —
   `aliexpress-sync` hade fällts på `WDE0195` vid varje körning sedan dess (11
   gånger på ett dygn, mätt i Vercel-loggen). Ingen märkte det, eftersom felet
   bara syns som en 500 i en cron ingen läser.
3. **Vakten SÅG det men gjorde ingenting.** `buildGuardFindings.missingTasks`
   räknar precis "betald order utan task" — men rapporterade dem bara i
   morgonmejlet, en gång per dygn. Ordern hade nått Leonard 19 timmar senare.

### `/api/cron/order-backfill` är nätet (`lib/orders/backfill.ts`)

Kör varje timme. Läser Wix-ordrar, jämför mot tasks, skapar det som saknas via
**samma `deriveTasks` som webhooken** — ingen egen tolkning av orderformen, av
samma skäl som `SHIP_AXIS_RE` och `EU_TULL_CODES` ska ha en enda definition.
Urvalet importerar `ACTIONABLE_PAYMENT` och `TASK_GRACE_MS` från vakten, så
återhämtningen och larmet aldrig kan bli oense om vad "tappad order" betyder.

Fyra egenskaper som inte ska tas bort:

1. **Skarp som default**, tvärtemot husets övriga cron-rutter. De andra SKRIVER
   något nytt till kunden och ska be om lov; den här ÅTERSTÄLLER en order kunden
   redan betalat för, och att avstå är det farliga utfallet.
2. ☠️ **Ordens FAKTISKA ålder bärs vidare.** `deriveTasks` stämplar `createdAt`
   med NU — rätt i webhooken, fel här: en order från i förrgår hade fått åldern
   noll och vaktens påminnelser hade börjat om från början. Ett test låser det,
   verifierat genom att återinföra buggen.
3. **Respiten gäller.** En order yngre än `TASK_GRACE_MS` rörs inte — vi ska
   inte tävla med webhooken om en färsk order.
4. **Ett fel fäller inte resten.** Nästa order kan vara den som går att rädda.

Rutten är idempotent (`createTaskIfAbsent` skriver aldrig över) så den är gratis
att köra ofta och ofarlig att köra om.

### Larmet går via mejl, för det är den enda kanal som fungerar

Nätet ovan gick i väggen på exakt samma sak som webhooken: `createTaskIfAbsent`
kastade `WDE0195`, felet fångades per order, lades i `errors` — och rutten
svarade 200. Ett nät som kan misslyckas tyst är inget nät.

☠️ **När task-skrivningen faller är varje annan kanal blockerad av samma vägg.**
Audit-raden är också en ny rad. Vaktens fynd hamnar i morgonmejlet först nästa
dygn (19 timmar för 10024). Admin-listan läser bara tasks, och det är tasken som
saknas. Nästa körnings andra försök faller likadant. Resend rör inte Wix, och är
därför enda vägen ut ur en full databas.

`buildStuckOrdersEmail` bär därför allt som behövs för att expediera ordern för
hand — ordernummer, kund, artikel med SKU och antal, orsaken ordagrant. Mejlet
upprepas varje timme så länge ordern sitter fast; en betald order som inte kan
expedieras SKA tjata, och tjatet upphör av sig självt när skrivningen går
igenom. **Bara raderna som inte hann skrivas listas** — annars beställer man om
en rad som redan ligger i `/admin` och kunden får två paket.

### En manuellt lagd AliExpress-order är osynlig tills numret kopplas (2026-09-01)

Order 10025: lagd för hand i AliExpress konsumentkassa (kampanj/kupong
billigare än DS-API:t), skickad från Polen kl 15:53 — och tasken stod kvar på
`pending` i sexton timmar medan kunden väntade på sitt mejl. Motorn kan inte
hämta spårning för en order den inte vet finns, och vakten säger inget om
`pending` förrän efter 24 timmar. Mätt:

```
poll-tracking:  {"checked":0,"shipped":0,"stillWaiting":0,"heldForReview":0,"errors":[]}
order-guard:    missingTasks:0  placeOrderReminders:0
Wix 10025:      NOT_FULFILLED
```

Tasken fanns, ingen task var `ordered`. Kopplingen fanns bara som knapp bakom
admin-inloggningen. Logiken bor nu i `lib/orders/link-ae-order.ts` och nås från
två håll: samma knapp i `/admin`, och `POST /api/admin/link-ae-order` med
`CRON_SECRET` → workflowen **"Order — koppla manuell AliExpress-order"** tar
butikens ordernummer + AE:s "Ref. Number" (inte spårningsnumret) och går att
köra från en telefon. Efter kopplingen är ordern exakt lika automatisk som en
API-order: kopplingen 21:55 → poll-tracking 21:58 `shipped:1` → Wix-fulfillment
→ butikens "Ditt paket är skickat!" med Resend-id 21:58:07.

Två egenskaper som inte ska tas bort:

1. **Flera kopplingsbara rader på samma order → vägra och lista dem.** Att
   gissa hade kopplat fel AE-order till fel rad, och poll-tracking hade sedan
   skeppat fel artikel med rätt spårningsnummer.
2. ☠️ **Skrivningen läses tillbaka.** `updateTask` är en tyst no-op på en saknad
   rad i alla tre backends. Ett test simulerar en backend vars `updateTask` inte
   gör något: rutten svarar fel, och ingen audit-rad skrivs.

### Faktura och kvitto: våra egna, inte Wix (2026-10-09)

Leonard: *"när vi godkänner skickas vår egen mall ut och inget från wix"* och
*"allt ska vårt eget"*. Första fallet var order 10079, en företagsorder som lades
upp för hand i Wix och betalas mot faktura.

Wix automationer **"Send invoice to customer"** och **"Send a receipt email"**
är avstängda (INACTIVE, kontrollerat med en fråga efteråt). Wix egen
orderbekräftelse till köparen var redan avstängd, och butikens egen
bekräftelse gick ut för 10079. Skicka alltså aldrig en faktura från Wix
fakturaverktyg: kunden får ingenting.

Motorn skickar i stället (`lib/orders/faktura.ts`, `faktura-pdf.ts`,
`faktura-kor.ts`):

| när | vad |
|---|---|
| en handlagd order (`BACKOFFICE_MERCHANT`) godkänns obetald | fakturan, mejl i kundomslaget med PDF |
| ordern markeras betald i Wix | kvittot, mejl med PDF, inom en timme |

Webhooken skickar fakturan direkt. Timcronen `/api/cron/faktura` (`10 * * * *`)
tar det webhooken missade och kvittot, eftersom Wix inte skickar någon
betalningshändelse till motorn. Workflowen **"Faktura — skicka, prova och
ställ in"**: `plan` · `skicka` · `prov` (till den interna larmadressen, med
[Prov]) · `installningar`.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Ingen faktura utan betalningsuppgift.** Vart pengarna ska står i
   `FyndplatsAppConfig` (`fakturaBetalaTill`, `fakturaFSkatt`, `fakturaDagar`),
   satt med `installningar`. Saknas den väntar ordern
   (`vantarPaBetalningsuppgifter`) och nästa körning skickar.
2. ☠️ **Beloppen stäms av mot Wix.** Raderna och momsen räknas i öre och
   jämförs med orderns `priceSummary`. Mer än en krona fel ger ingen faktura.
   Bara SEK och priser inklusive moms.
3. ☠️ **Raden i `faktura_utskick` tas FÖRE utskicket** och släpps om det
   faller. Wix skickar `approved` två gånger (10079: en minut isär), och
   webhooken och cronen kan se samma order. Ett utskick utan Resend-id räknas
   som fallet.
4. **Kvittot kräver att fakturan gick härifrån.** Fakturadatumet läses ur
   loggen, så kvittot visar samma datum som fakturan.
5. **`FAKTURA_FRAN` (2026-10-09).** Äldre handlagda ordrar rörs inte.
6. ☠️ **Svaret bär bara ordernummer**, aldrig kundens namn, e-post eller adress.

Fakturanumret är ordernumret. Kundens org.nr och referens läses ur
ordernoteringen ("org.nr 556000-0000. Referens: Anna Andersson"), så skriv dem
där när ordern läggs upp. Referensen läses fram till första punkten, så ett
inköpsordernummer skrivs efter namnet med komma: "Referens: Anna Andersson,
PO-123".

Fakturan och kvittot anger valutakoden SEK (`VALUTA`, sedan 2026-10-14). En
företagskunds inköpsorder krävde valutakod på fakturan, och "kr" räknas inte
som en.

### Den gamla GitHub-värmaren är borttagen (2026-10-31)

Leonard 2026-10-31, efter en audit av butikens uppvärmning: *"Kör båda"*.
`.github/workflows/cache-warm.yml` och `ping_sitemap.py` pingade startsidan,
`/butik`, `/alla-produkter`, kategorisidorna och 20 produkter i bokstavsordning.
Schemat var var 30:e minut, men GitHub körde den var fjärde till sjätte timme.

Butiken värmer allt det själv, och oftare:

| | vad | när |
|---|---|---|
| `/api/cron/varm-katalogen` | hela katalogen i led efter en deploy, och listorna | var 15:e minut |
| `/api/cron/uppdatera-andrade` | varje ändrad, synlig produkt | var 5:e minut |
| `/api/cron/warm-and-ping` | nya produkter, och IndexNow | varje timme |

Startsidan och kategorisidorna byggs vid varje deploy. Mätt samma kväll: 112
slumpade sidor (80 produkter, 20 kategorier, 12 andra) svarade alla 200 ur
cachen, med 0,2–0,3 s till första byte i median och högst 0,58 s. Varje körning
av den gamla värmaren fick dessutom ~150 sidor att byggas om i onödan, och dess
kommentarer beskrev en butik som inte finns längre (Wix-sitemap, Fastly).

Lägg inte tillbaka en värmare i GitHub Actions: schemat går inte att lita på
(tabellen i nästa avsnitt).

### Spårningen hämtas av Vercels cron, inte av GitHub (2026-10-29)

`/api/cron/poll-tracking` går varje timme från `vercel.json`. Fram till
2026-10-29 väcktes den bara av GitHub Actions (`0 */3 * * *`), eftersom
Hobby-planen bara tillät dagliga Vercel-cron. Motorn ligger på Pro nu, och där
går Vercels cron på minuten.

GitHub kör inte schemalagda workflows när de ska. Uppmätt 24–29 oktober, på de
senaste 100 schemalagda körningarna (122 timmar):

| workflow | schema | väntat | kört | mellan körningarna |
|---|---|--:|--:|---|
| Poll AliExpress tracking | var tredje timme | ~41 | 22 | 2,3–8,4 h |
| Fyndauktion tick | var tionde minut | ~735 | 29 | 1,8–7,1 h |
| Cache Warm Fyndplats | var 30:e minut | ~245 | 27 | |
| Refresh AliExpress tokens | var tolfte timme | ~10 | 11 | 9,8–14,5 h |

Spårningen var den enda av dem utan en annan klocka: auktionen har en timcron i
`vercel.json`, butiken värmer sina sidor med egna cron, och tokenförnyelsen har
ett fönster på 24 timmar. Ett paket som AliExpress skickat kunde alltså vänta
upp till åtta timmar på kundens "paketet är skickat".

Två egenskaper som inte ska tas bort:

1. ☠️ **GitHub-schemat är borttaget, inte kvar som reserv.** Rutten har ingen
   spärr mot två samtidiga körningar. Båda hade läst samma `ordered`-task och
   försökt skapa en fulfillment, och det enda som stoppar den andra är att Wix
   vägrar skicka samma rad två gånger. Workflowen finns kvar för en körning för
   hand (`workflow_dispatch`).
2. **Ett jobb som en kund väntar på schemaläggs i `vercel.json`.**
   `app/api/cron/poll-tracking/schema.test.ts` fäller om spårningen försvinner
   därifrån, går mer sällan än var tredje timme eller får tillbaka GitHub-schemat.

### Aosom-ordern har ingen automatik alls — den läggs OCH skeppas för hand

AliExpress sköter sig självt: `place-order` lägger ordern, `poll-tracking` hämtar
spårningen varje timme, Wix-fulfillment skapas, kunden får sitt mejl. Aosom har
inget API — `place-order.ts` **vägrar** en Aosom-mappning med flit
(`isAliExpressMapping`) och ordern läggs på `aosom.de/bulkordering` eller i deras
kassa.

Det lämnade en tyst lucka i motorn: ingenting kunde få veta att ordern var lagd, och
när Aosom skickar paketet fanns ingen väg alls att få ut spårningen till kunden.
Uppmätt på order 10026 (2026-09-02, Vinsetto-kontorsstolen): betald
14:57, lagd för hand samma kväll, och tasken hade blivit liggande som `pending`
medan vakten påminde om en order som redan var gjord.

`lib/orders/manual-fulfillment.ts` stänger båda halvorna, nåbar via
`/api/admin/manual-fulfillment` och workflowen **"Order — beställd eller skickad
för hand"**:

| läge | vad som händer |
|---|---|
| `bestalld` | tasken blir `ordered` — vakten slutar påminna, 5-dygnsklockan mot "beställd men inget spår" startar |
| `skickad` | Wix-fulfillment med spårningsnumret → butikens "Ditt paket är skickat!" + 17TRACK, tasken blir `shipped` |

Fem egenskaper som inte ska tas bort:

1. ☠️ **Referensen sparas i `supplierOrderRef`, ALDRIG i `aliexpressOrderId`.** Samma
   fel som `AliExpressProductId`-typen infördes för att göra omöjligt: AE-fältet läses
   som ett AE-id av poll-tracking, av cancel-task (som larmar om manuell
   AE-avbeställning) och av claim/cancel-CAS:en i alla tre backends.
2. ☠️ **F19-backstoppen gäller även den manuella vägen.** `poll-tracking` vägrar
   auto-skeppa en task flaggad `cancelMidOrder`/`refundFlagged`/`orderUncertain`; en
   manuell rutt som hoppar över samma grind vore hålet i nätet. Skeppningen är den
   oåterkalleliga handlingen — kundmejlet går inte att ta tillbaka.
3. ☠️ **En redan skeppad rad skeppas aldrig om.** En andra fulfillment är ett andra
   "ditt paket är skickat" till samma kund.
4. **Wix skrivs före tasken**, samma ordning och samma skäl som `price-repair`. Går
   bara den ena igenom har kunden fått sitt mejl medan böckerna släpar — det billiga
   felet. Omvänt hade tasken stått som `shipped` utan att någon fulfillment fanns.
5. **Flera rader på ordern → vägra och lista dem.** Regeln bor i
   `lib/orders/valj-task.ts` och delas med AE-kopplingen; att gissa hade skeppat fel
   artikel med rätt spårningsnummer.

`pending → shipped` går i ETT steg, men via statusmaskinen: har vi ett spårningsnummer
ÄR ordern lagd, och att vägra på en bokföringsteknikalitet medan paketet är i transit
är fel sorts fel.

**En artikel i flera paket: alla nummer i samma fält** (2026-10-17). Wix tar en
fulfillment per artikelantal, och en fulfillment utan rader nekas ("lineItems must not be
empty"). Order 10095, ett hantelset i två DPD-paket, får därför båda numren i samma
fält, i formen `tracking_number="01234567890123, 01234567890125"` (påhittade nummer). `shipManually` prövar varje nummer
för sig, skriver fältet med komma och mellanslag och vägrar över Wix gräns på 100
tecken. Spårlänken pekar på det första numret (`sparningsLank`). Butiken delar fältet
och skickar ett fraktmejl med alla nummer. ☠️ Delningsregeln står på två ställen,
`lib/tracking-link.ts` här och `lib/fraktmejl-rader.ts` på `headless-site`, och de
måste stämma: komma, semikolon och radbrytning, aldrig mellanslag.

⚠️ **Leveransnotisen ("levererat") bor i butiksrepot, grenen `headless-site`,**
och hade en egen lucka: 17TRACK registrerar bara nummer vars fraktbolag den
känner igen. Både 10023 och 10025 loggade *"carrier odetekterad, inget
format-mönster matchar — ingen push för detta paket"* — ingen push, aldrig ett
"levererat"-mejl. Sedan 2026-09-01 pollar butiken AliExpress-källan (vår
`/api/tracking-events`) varannan timme (`/api/cron/ae-delivery-poll`) och mejlar
genom samma sändare och samma dedup som pushen. Se `SMS-FORWARDING.md` på den
grenen. **Vår rutt är alltså en leveransberoende sedan dess** — går den sönder
uteblir inte bara spårningssidan utan också leveransmejlen för de paket 17TRACK
inte ser.

### ☠️ Ett fullt CMS gör importen till en dubblettfabrik

Ordningen i `lib/aosom/import-run.ts` är påtvingad: mappningen behöver
produktens Wix-id, så produkten skapas först. Faller mappningsskrivningen
däremellan är produkten **föräldralös** — den finns i butiken men syns inte för
lagersynken, prissynken, prisreparationen, bildreparationen eller
lönsamhetsöversikten, som alla itererar mappningar.

Värre: dubblettspärren nycklar på `supplierProductId` i MAPPNINGEN. Utan rad ser
nästa körning artikeln som ny och skapar en **ANDRA** produkt för samma vara —
precis den interna dubbletten som straffas. Och markören flyttas ändå (en trasig
rad får inte stoppa svepet), så ingen körning återkommer till den av sig själv.

Uppmätt 2026-08-31: nattens körning 04:40 skapade `3e6f2d24-e045-44ad-aed9-067030b01f46`
(ett tyskt utkast, `visible:false`) och föll sedan på postgränsen. Noll
mappningsrader pekar på den.

Luckan går inte att stänga genom att byta ordning. Det som går är att vägra
tappa bort den: `summary.orphans` namnger sku + wixProductId, och en
konsolrad skrivs (konsolen kräver ingen databas). `?sku=` kör om riktat när
orsaken är åtgärdad. **En automatisk radering av produkten är medvetet INTE
byggd** — det är en destruktiv åtgärd på något en människa ska titta på först.

⚠️ **Taket löstes senare — och den här radens förklaring var fel.** Den påstod
att "radantalet i Wix Data inte är det som binder", eftersom 18 091 raderade
audit-rader (22 977 → 4 886, verifierat) inte släppte blockeringen. Radantalet
ÄR det som binder. Taket är bara **globalt över alla kollektioner** och ligger på
**4 000**, så de ~18 800 rader som återstod var fortfarande 4,7× över. Städningen
var alltså inte otillräcklig av otur — ingen delmängd kunde räcka. Se nästa
avsnitt.

**Regeln: en pipeline med exakt en väg in behöver ett nät under sig.** Och den
gamla, åttonde gången: ett fel som bara syns som en 500 i en cron ingen läser
är ett fel ingen upptäcker.
