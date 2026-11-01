## VEVOR: steg 2, läsaren av produktsidorna (2026-10-29)

Leonards beslut 2026-10-28: vi får läsa och hämta VEVOR:s produkter från de
publika sidorna, alla produkter, utan urval. Läsaren gör det och sparar en
avläsning per artikel i Wix. Steg 4 (importen) och steg 5 (synken) läser
avläsningarna; ingen av dem läser VEVOR själv.

`lib/vevor/sida.ts` (tolkningen) → `hamtning.ts` (takt, spärrar) →
`robots.ts` (VEVOR:s robots.txt) → `sitemap.ts` (produktkartan) →
`lasare.ts` (körningen) → `lager.ts` (Wix) → `rad.ts` (synkens ingång). Cron
`/api/cron/vevor-lasare` var femte minut, strömbrytaren och upptiningen i
`/api/admin/vevor-lasare`, workflowen **"VEVOR — läsaren"** (`status` · `prov`
· `pa` · `av` · `tina`).

**Uppmätt 2026-10-29** på 36 slumpade adresser ur VEVOR:s produktkarta, med
`?lang=sv&currency=SEK`:

| | |
|---|--:|
| produktsidor, alla `lang="sv"`, `"LANG":"sv"` och `priceCurrency` SEK | 34 |
| `"CURRENCY":"SEK"` i sidans egna inställningar | 68 av 68 |
| sidor med exakt ett erbjudande i JSON-LD | 34 av 34 |
| borttagna, med en riktig 404 ("404 Ej Hittad") | 2 |
| slutsålda bland de 22 nya: lager 0 OCH `OutOfStock`, alltid överens | 6 |
| sidor med tillverkare eller EU-representant i texten | 0 |
| tid att tolka en sida | 3–16 ms |

Mätt i Wix samma dag, med testrader som togs bort direkt: alla fem index
`ACTIVE`, kön (`$lte` och sortering på ISO-strängen `nastaLasning`) kommer i
rätt ordning, `$in` och räkningen fungerar, nästlade listor (egenskaperna som
par) kommer tillbaka oförändrade, och en fältvis PATCH tar objekt och `null`.
Kartans ordning klumpar inte ihop produktfamiljer: i värsta fönstret om 100
adresser hade 13 samma två första ord.

Elva egenskaper som inte ska tas bort:

1. ☠️ **Spärrar fryser läsaren.** 403, 429, en captcha eller en tom sida, också
   på robots.txt och kartan: ingenting från körningen skrivs, ett larm går till
   `OPS_ALERT_EMAIL`, och läsaren läser ingenting, inte ens för hand, förrän
   någon kör `tina`. Inget nytt försök av sig själv och ingen kringgång: inga
   proxyer, ingen låtsad webbläsare.
2. ☠️ **Ärlig och långsam.** User-Agent med info@fyndplats.com, en sida i
   taget, minst en sekund mellan anropen (`Takt`), aldrig `/api/*`, och ingen
   omdirigering följs.
3. ☠️ **robots.txt läses varje dygn** (`lib/vevor/robots.ts`, RFC 9309). En
   sida den spärrar hämtas aldrig (`sparrade`). Vår egen grupp gäller före
   `*`, längsta regeln vinner och Allow vinner vid lika längd. En Crawl-delay
   följs. En robots.txt som inte går att läsa betyder att ingenting läses den
   körningen. Spärrarna från 2026-10-29 och `/api/*` ligger dessutom kvar fast
   i `tillatenSokvag`, och en sådan sökväg kommer aldrig in i kön, varken ur
   kartan eller ur en omdirigering.
4. ☠️ **Okänt rör aldrig lagret.** En sida som inte klarar varje kontroll
   (svenska, kronor på sidan och i erbjudandet, pris, lager, artikelnummer,
   inga motsägelser) ger ett tolkningsfel och ingen avläsning. Ett
   artikelnummer är bokstäver och siffror, med bindestreck och punkt inuti
   (`SKU_RE`, 2,1 % av sidorna sedan 2026-10-30). ☠️ Ett plus släpps inte
   in: avläsningen nycklas på numret, och Wix läser `+` i adressen som ett
   mellanslag också kodat som `%2B` (uppmätt: läsning och borttagning per id
   svarade 404). Loggspärren i workflowerna tar formen med skiljetecken. `vevorRad` gör
   artikeln okänd när avläsningen är äldre än 12 timmar, när läsaren är fryst,
   och direkt när senaste försöket misslyckades (`misslyckadAt`: tidsgräns,
   tolkningsfel, en första 404, en spärr i robots.txt). En giltig läsning
   nollar det.
5. ☠️ **Fem spärrar skriver ingen avläsning från körningen:** en kontrollsida
   (tio kända produkter, varje körning) saknar pris, lager eller
   artikelnummer; tre kontrollsidor är slutsålda; fler än 10 % otolkbara;
   fler än 40 % slutsålda bland varor som var i lager vid förra avläsningen
   (minst 20 sådana); fler än 20 % saknade.
6. ☠️ **En spärr får inte låsa läsaren.** Sidorna som lästes läggs tillbaka i
   kön utspridda över fem minuter till två timmar, så att samma klunga inte
   läses ihop igen. En kontrollsida som inte går att tolka byts ut och väljs
   inte igen på en vecka, och en som blivit borta i en tidigare körning byts ut
   utan att stoppa något. Larmet går först vid tredje stoppet i följd
   (`stoppIFoljd`): ett verkligt fel stoppar varje körning, en slumpvis klunga
   gör det inte. Före rättningen 2026-10-29 hade en enda udda produkt bland
   kontrollsidorna stoppat varje körning för gott.

   ☠️ **Spärren mot slutsålda räknar bara varor som var i lager förut
   (2026-10-30).** Den räknade alla giltiga sidor, och slutet av VEVOR:s
   produktkarta är till största delen slutsålt: ~2 200 sidor som aldrig
   lästs, 77 % slutsålda. Klungan var ingen slump, och utspridningen hjälpte
   inte: varje körning från 06:15 UTC stoppades ("75 av 108 giltiga sidor var
   slutsålda"), och inte heller omläsningarna av redan importerade varor
   skrevs. Kontrollsidorna lästes rätt, 10 av 10, hela tiden. Det spärren finns
   för är att VEVOR plötsligt visar allt som slutsålt, och det syns bara på en
   vara som var i lager förut: på omläsningarna och på kontrollsidorna. En
   sida som aldrig lästs, eller som redan var slut, räknas inte. Går de förra
   avläsningarna inte att läsa räknas alla giltiga sidor, som förut.
   `forutILager` och `slutForutILager` står i körningens summering.
7. ☠️ **Borta kräver två signaler med minst ett dygn emellan.** En 404, en
   flytt bort från produktsidan, eller en sida utan produktdata när adressen
   saknats i kartan i ett dygn. En sida som läses giltig är aldrig borta, vad
   kartan än säger: den går att beställa. Det är min tolkning av promptens
   "404 eller saknas i sitemap", och den är vald åt det håll där en levande
   vara inte döljs.
8. ☠️ **En trasig karta rör ingenting.** Färre än 5 000 adresser, eller färre
   än 80 % av dem vi känner, och ingen sida flyttas. Högst 500 nya rader per
   körning, för Wix skrivkvot delas med hela sajten. En `.gz` som fetch redan
   packat upp läses som den är.
9. ☠️ **Tillståndet skrivs fält för fält** (`uppdateraTillstand`). Körningen
   skrev förut tillbaka hela raden, och ett `av` som kom medan den läste hade
   ångrats tyst.
10. **Upsert per artikel.** Avläsningen nycklas på VEVOR:s artikelnummer, sidan
    på webb-id:t. En omkörning skriver samma rader igen. En tolkning som kastar
    blir ett tolkningsfel (`undantag`), aldrig en körning som faller.
11. ☠️ **Loggen, svaret och larmet bär bara antal.** Kontrollsidornas webb-id
    står i tillståndet men aldrig i ett svar.

**Takten:** aldrig lästa först (katalogen, ~13 timmar med 100 sidor per
körning), sedan publicerade var fjärde timme, lågt lager (≤ 3), obeställda
ordrar och levande auktioner varje timme, och utkasten en gång per dygn. En
sida som inte går att tolka läses om i samma takt, inte oftare: annars hade
den vägt tyngre i spärren för otolkbara sidor. Prioriteringen görs en gång i
timmen (`lib/vevor/prioritet.ts`); innan steg 4 finns inga VEVOR-mappningar,
och då är allt utkast.

**Vad det kostar:** varje sida tar ~1,1 sekund, nästan bara väntan på nätet.
Hela katalogen en gång per dygn är ~16 000 sidor, alltså ungefär fem timmar
funktionstid per dygn, och upp till tretton under den första genomläsningen.
Det syns på raden Fluid Provisioned Memory. Minnet ställs in per projekt i
Vercels panel, inte per funktion, när Fluid compute är på.

**Manualerna läses inte** (Leonard 2026-10-29: "vi behöver inte ladda ner och
läsa alla"). Läsaren sparar om sidan länkar en manual, och länken. GPSR-
uppgifterna hämtas per produkt när de behövs. 2 av 7 sparade manualer hade
tillverkaren som text och 1 en EU-representant, så automatiken hade ändå inte
räckt. Den enklaste vägen är att VEVOR själva anger ett EU-bolag för alla varor,
som Aosom gör med MH Handel GmbH.

**Inte gjort, med flit:** manualerna. Prisregeln och importen kom i steg 4 och
synken i steg 5, se de avsnitten. `vevorRad` räknar den landade kostnaden med
importens prisregel sedan steg 5.

**Efter mergen,** i den ordningen: kollektionerna finns redan (skapade med
ADMIN och index före mergen). Kör workflowen i läget `prov` med `max` 50 och
läs svaret: noll spärrar, noll `fel_sprak` och `fel_valuta`, robots.txt
hämtad och `sparrade` noll. Slå sedan på schemat med `pa`. Klart när hela
katalogen är läst med under 2 % okänt.

### ☠️ VEVOR visar två sidmallar, och läsaren kände bara den ena (2026-10-30)

Upptäckt när staketstolpankarna skulle slås ihop: ett av fyra ankare hade ingen
specifikation, fast sidan hade en. Samma adress hämtad sex gånger i följd gav två
olika sidor:

| mall | specifikation | punktlista |
|---|---|---|
| `detail_product5` (den gamla) | tabell i HTML:en | lista i HTML:en |
| `detail_product7` (den nya) | bara `PRODUCT_DATA.goodsDescAttrList` | bara `PRODUCT_DATA.sellingPoint` |

Läsaren läste bara tabellen och listan. **3 035 av 14 990 avläsningar (20 %,
jämnt över dygnet) saknade båda**, och de utkasten importerades utan
specifikation och punktlista.

`specOchPunkter` (`lib/vevor/sida.ts`) läser tabellen först och datan när den
saknas, och sparar var specifikationen kom ifrån i `specKalla` (`tabell`,
`data` eller null). Provat på riktiga sidor av båda mallarna: samma åtta rader
och fem punkter.

Tre egenskaper som inte ska tas bort:

1. ☠️ **En avläsning utan `specKalla` och utan både specifikation och
   punktlista väntar** (hindret `spec_okant`, `spechinder` i
   `lib/vevor/to-product.ts`). Den gjordes före lagningen, och nästa läsning
   kommer inom ett dygn. Samma mönster som `betyg_okant`.
2. **En sida som verkligen saknar specifikation är inget hinder.** Den lagade
   läsaren sätter `specKalla: null`, och då importeras artikeln.
3. ☠️ **Ett syskon i en familj behöver sin specifikation** (`medlemshinder`,
   sedan 2026-10-30): familjens flik visar varje varians värde (se *Familjens
   specifikation per variant* nedan). Ett syskon med `spec_okant` får familjen
   att vänta (`syskon_vantar`) i stället för att lämnas utanför, där det hade
   spärrats för alltid som `syskon_finns`.

**Utkast som redan importerats utan specifikation rättas med workflowen
"VEVOR — specifikationen på utkast som saknar den"** (`plan` · `skriv`) →
`/api/admin/vevor-spec` → `lib/vevor/spec-ratta.ts`. Den lägger fliken
"Tekniska specifikationer" sist i beskrivningen, med importens egna funktioner
(`specifikation`, `familjensSpec`, `appendTabSections`), och rör bara
`plainDescription`. Mätt 2026-10-30 ~17 UTC: **991 av 5 411** opolerade
VEVOR-utkast saknade fliken, varav 42 familjer. Punktlistan når inte
beskrivningen i rått läge, så den saknas inte.

`skriv` läser planen en gång (`allaIdn`) och skriver sedan dess sidor i tuggor om
150 (`idn`), så att varje varv bara läser sina egna sidor och mappningar. Planen
över hela katalogen tog 87 sekunder (2026-11-01, 10 603 utkast), och när varje
varv läste om den gick mer än en tredjedel av tiden åt till läsningen. Mätt
2026-11-01: en tugga om 150 sidor tog 2 minuter och 40 sekunder med pausen
(1,07 sekunder per sida), och ingen av de första 3 403 sidorna stoppades av en
429. 9 500 sidor är alltså ungefär två timmar och 50 minuter plus synkfönstren.
Jobbet stannar efter 330 minuter och säger hur många som är kvar: kör då planen
igen och skriv med det nya antalet.

Nio egenskaper som inte ska tas bort:

1. ☠️ Bara opolerade, dolda VEVOR-utkast. En polerad eller publicerad sida rörs
   aldrig.
2. ☠️ Avläsningen ska vara gjord med den nya läsaren (`specKalla` satt), annars
   räknas sidan som `ej_omlast`. Kör `skriv` först när `ej_omlast` är nära noll,
   ungefär ett dygn efter mergen av #832 (utkasten läses en gång per dygn).
   Bara sidor ur planen skrivs: en sida utanför planen som blir att rätta under
   körningen (när läsaren läser om) väntar på nästa körning. Planen räknas en gång
   när jobbet startar och får inte ha fler sidor än `bekrafta`.
   ☠️ **Varje varv har sin tuggas storlek som tak, aldrig det som var kvar efter
   förra varvet.** En sida som redan skrivits i tuggan kan vara att rätta igen
   när varvet körs om. Med det som var kvar som tak stoppades jobbet efter 3 403
   sidor (2026-11-01 06:30 UTC): tuggan stannade på tidsbudget med 47 kvar före
   synkfönstret och hade 48 att rätta efter det, för en av de skrivna sidorna
   fälldes fortfarande av modellnummerkontrollen (punkt 9). Taket släpper ändå
   aldrig igenom en sida utanför planen, eftersom varvet bara får tuggans id. En
   sida som skrivs två gånger räknas två gånger i "Klart".
3. ☠️ En enskild artikel som redan har fliken rörs inte. Saknar fliken rader
   räknas den som `flik_utan_rader` och lämnas. En familj vars flik visar fel
   får fliken utbytt (`attByta`, se nästa avsnitt), och bara när sidan har
   exakt en sådan flik.
4. ☠️ Sidan läses färskt före skrivningen och planeras om. En 409 (synken skrev
   samtidigt) ger en ny läsning, högst tre försök.
5. ☠️ Återläsning tills revisionen gått fram: dold, fliken finns och varje rad
   finns. En tillagd flik: den gamla texten står kvar. En utbytt flik: hela
   texten är planens. Första avvikelse stoppar körningen.
6. ☠️ Svaret bär bara Wix-id och antal.
7. ☠️ **Wix stryper takten, och en strypt sida är orörd.** Utan paus stoppade
   Wix edge-spärr (en HTML-429) skrivningen efter 186 och 127 sidor
   (2026-11-01, ungefär 1,3 sidor i sekunden): 313 av 9 808 hann skrivas. Därför
   `SKRIV_PAUS_MS` (500 ms) mellan sidorna. En 429 på läsningen före skrivningen
   eller på skrivningen själv betyder att ingenting skrevs: varvet stannar som
   `strypt`, och workflowen väntar 90 sekunder och fortsätter. En 429 på
   läsningen EFTER skrivningen räknas aldrig som `strypt`, för då är sidan
   skriven: den läses om, och går den inte att läsa stannar körningen som `fel`.
   Ett annat fel på skrivningen (5xx) är också `fel`. Tre varv i rad utan en
   skriven sida stoppar jobbet.
8. ☠️ **Inga skrivningar i Aosoms synkfönster** (`lib/wix/synkfonster.ts`).
   Rutten vägrar skarpt där och strax före (409 `synkfonster`) och kortar
   budgeten så att varvet slutar 30 sekunder före nästa fönster. Workflowen
   väntar ut fönstret. Hela körningen tar timmar och korsar fönstren.
9. ☠️ **Raderna byggs med samma regel som kontrollen** (`radHarModellnummer` i
   `lib/polish/modellnummer.ts`, poleringens `MODELLNR` tecken för tecken).
   Importen och verktyget tog bort raderna efter etikett (`arIdentifierarRad`),
   medan planen letade efter ett modellnummer var som helst i fliken. Rader som
   "Modell: <kod> <ord>", VEVOR:s dubblerade etikett "Artikelmodell
   Artikelmodellnummer: <kod>" och en familjs "Modell: <storlek>: …" stod kvar,
   och sidan planerades och skrevs om vid varje körning. Mätt 2026-11-01: planen
   05:07 UTC hade 9 495 sidor att byta, två körningar skrev 3 403 + 6 102 sidor
   (05:09–08:31 UTC), och planen 08:35 hade 21 kvar av 10 603 utkast, alla
   skrivna och fortfarande fällda. 10 av dem hade skrivits två gånger. Nu tas
   varje rad regeln fäller bort, i importen (`arIdentifierarRad`,
   `familjensSpec`) och i verktyget (`specRader`), och en etikett som VEVOR lagt
   sist i värdet ("Nettovikt: <vikt> Artikelmodellnummer") skärs bort. En ny flik
   som ändå fälls skrivs inte (hindret `modellnummer_kvar`), och återläsningen
   fäller en skriven flik som bär ett modellnummer.

### Familjens specifikation per variant (2026-10-30)

Beskrivningen är densamma för alla varianter, och familjens flik visade
ankarets värde på varje rad. Mätt 2026-10-30: i **107 av 143** familjer där alla
artiklar har specifikation skiljer sig en rad mellan varianterna (produktmått i
44, färg i 13, material i 10, effekt i 8). Den som valde en annan storlek såg
alltså fel mått.

`familjensSpec` (`lib/vevor/familj.ts`) läser alla artiklars tabeller. En rad
med samma värde för alla (oavsett skiftläge) står som förut. En rad som skiljer
visar varje varians värde, med varianten namngiven efter sina värden på de
axlar som skiljer: "24 tum / 4 st, 24 tum / 6 st: 610 mm · 36 tum / 4 st:
914 mm". En rad bara vissa artiklar har visas för dem. Axlarnas egna rader
står inte i fliken.

Befintliga familjeutkast rättas av samma workflow som ovan: planen räknar dem i
`attByta`, och fliken byts ut från rubriken till nästa rubrik. Varje artikel ska
vara läst med den nya läsaren (`ej_omlast` annars).
