# SEO-granskning 2026-09-24: vad finns kvar att vinna?

Leonards fråga: *"finns det inget mer du kan se där vi kan vinna mer seo?"*

Rundorna S1–S14 har arbetat med sidorna: titlar, texter och smala
sökordskategorier. Den här granskningen tittar på det som ligger runt
sidorna: tekniken, adresserna som rankar och länkarna in till domänen.

**Svaret:** tekniken är frisk och läckorna var små och är lagade. Det som
bromsar är att domänen i praktiken saknar riktiga länkar. Den enda stora
hävstången kvar är länkar, och den kräver Leonard.

## 1. Tekniken: frisk

Mätt på startsidan, två kategorisidor och en produktsida i produktion:

| | resultat |
|---|---|
| Lighthouse SEO | **100** på alla fyra |
| Produktens JSON-LD | `brand` Fyndplats, `offers` med `shippingDetails` och `hasMerchantReturnPolicy`, brödsmula, FAQ |
| title, metabeskrivning, canonical, `lang`, H1 | på plats |
| sitemap | 3 688 adresser, varav 3 453 produkter och 120 kategorier, plus en egen bildsitemap |
| kategorisidornas produkter | alla länkade i server-HTML:en, ingen sidnumrering som göms bakom JS |

**Laddtiden är inget problem, trots att Lighthouse sa det.** Lighthouse på
mobil gav en LCP på 8,8 s för produktsidan, och filmremsan var vit i 2,6 s.
Men nätverksloggen visar att HTML, CSS och huvudbilden var nere efter 0,6 s,
med huvudtråden nästan stilla. Samma sidor i en vanlig Chromium via
Playwright, mobilvy, tre laddningar per sida:

| sida | FCP | LCP |
|---|--:|--:|
| produkt | 0,74–0,83 s | 0,83–1,07 s |
| start | 0,46–0,48 s | 0,46–0,48 s |
| kategori | 0,44–0,56 s | 0,44–0,56 s |

Den vita perioden kom från sessionens proxy och Lighthouse-körningen, inte
från butiken. En laddning som tog 10,4 s visade sig vara proxyn: anslutningen
bröts med `SSL_ERROR_SYSCALL`, och de fem andra svaren kom från Vercels cache
på 0,2–0,4 s.

⚠️ PageSpeed Insights API:t utan nyckel svarade 429: den delade kvoten var
slut. Fältdata från CrUX går inte att se härifrån.

## 2. Rankande adresser som läckte

Alla 118 adresser som rankar på ett sökord över 200 sökningar i månaden
(Semrush-exporten från i morse) kontrollerades mot produktion:
**107 svarar 200, 8 skickas vidare och 3 ger 404.** Hela listan står i
`rankande-adresser.tsv`. Lagat i #647 (`f3c55cca`, `02f123f9`):

| adress | sökord (sök/mån, plats) | före | efter |
|---|---|---|---|
| `/basta-i-test/massagepistoler` | massagepistol bäst i test (1 900, 56), massageapparat bäst i test (880, **18**), bästa massagepistolen (210, 60) | 308 → `/kopguider/massagepistoler` → **307 → `/butik`** | 308 → bloggens massagepistolguide |
| `/kopguider/massagepistoler` | (kedjans mellansteg) | 307 → `/butik` | 308 → samma guide |
| `/konstgjordablommor` | blommor dekoration (260, 55) | Dekoration & prydnad | Konstväxter |
| `/kategori/datormus` | mus till dator (590, 56) | **404** | Dator & Gaming |

Köpguiden för massagepistoler är tunn eftersom butiken inte säljer några.
Koden skickar då vidare till `/butik` med en tillfällig 307, och rankningen
följer med dit. Regeln för massagepistolerna måste stå före den generella
`/basta-i-test/:type`, eftersom Next tar första regeln som matchar. Ett test
i `lib/kopguide.test.ts` fäller om ordningen byts, och det är provat åt båda
hållen.

**Medvetet inte lagade:** `/kategori/halsband` (404), `/produkt/4-pack-glas-ribbad-design`
(→ `/alla-produkter`) och regeln `/smycken` (→ `/butik`). Vi säljer varken
halsband, dricksglas eller smycken. En omdirigering till en sida utan varan
är ingen bättre träff än en ärlig 404.

## 3. Guiderna länkade inte till de nya kategorierna

Bloggens 35 inlägg och fyra köpguider länkade nästan bara till de breda
avdelningarna. *Halloweendekoration – köpguide* länkade inte till
`/kategori/halloweendekoration`, och *Elbil för barn – köpguide* länkade
inte till någon kategori alls.

Nio inlägg länkar nu till den smala kategori de handlar om: Halloweendekoration,
Klösträd, Elbil för barn och Motorcyklar för barn, Solskydd & paviljonger,
Terrassvärmare & infravärmare, Projektordukar, Kontorsstolar, Hantlar &
hantelset och Golvlampor. Hemmakontorsinlägget lovade "flera prisvärda
alternativ" för tangentbord och mus, med en länk till hela Hem & Inredning.
Vi säljer inga, så den meningen är borta.

Effekten är måttlig. Menyn länkar redan till varje underkategori från varje
sida (#647), men en länktext med sökordet från en sida om samma ämne är en
relevanssignal som menyn inte ger.

☠️ **Text efter `---` i ett blogginlägg renderas aldrig** (`02f123f9`).
`renderMarkdown` slutar vid första avdelaren i brödtexten, med flit: nio
inlägg har en anteckning med JSON-LD efter den som inte ska synas. Två inlägg
hade i stället text som var menad att synas där:

- Elbilsguidens slutrad med kategorilänkarna. Den nya länken syntes därför
  inte heller, och det var förhandsbygget som visade det.
- Tullinläggets källa och förbehåll, *"allmän information, inte juridisk
  rådgivning"*, som alltså aldrig har visats.

Båda står nu före `## Vanliga frågor`. Direkt före avdelaren hade de blivit
en del av sista FAQ-svaret, eftersom `extractFaq` läser fram till `---`.
**Den som lägger till en rad sist i ett inlägg ska kontrollera att den står
före avdelaren.**

**Kontrollen är `lackkoll.py`** i den här katalogen: de fyra omdirigeringarna
och de tio inläggen. Förhandsbygget `02f123f9` gav 14 av 14, och produktion
före mergen gav 14 fel av 14. FAQPage-JSON-LD i de två inläggen har samma
antal frågor som förut, och ingen av de flyttade raderna hamnade i ett svar.

## 4. Länkarna: den verkliga bromsen

Semrush, samma dag:

| | fyndplats.se | dealproffsen.se |
|---|--:|--:|
| Authority Score | 8 | 14 |
| länkande domäner | 224 | 456 |
| länkar | 576 | 1 493 |

☠️ **Våra 224 domäner är i praktiken skräp.** De 40 starkaste är
automatiska spam- och länkförkortarsajter: `bye.fyi`, `metamagic.top`,
`seo-revealed.club`, `backlinks-checker.com`, `byteshort.xyz` och så vidare.
Ingen av dem är en riktig svensk sajt. Google bortser från sådana länkar, så
de behöver inte disavowas, men de ger heller ingenting.

**dealproffsens riktiga svenska länkar**, lästa ur deras länkprofil:

| typ | källa | länken |
|---|---|---|
| betald annons | Expressen `/growth-performance/shoppingguiden/` (märkt "ANNONS") | följbar |
| betald artikel | Norra Halland `/native/`, Dagens Västervik, Dagens Hultsfred | följbar |
| affiliate | bästatestet.se ("Köp hos Dealproffsen") | följbar |
| rabattkod | Cuponation `/dealproffsen-rabattkod` | följbar |
| omdömen | Reco.se företagsprofil | nofollow |
| forum | ifokus (katter, råttor), Maringuiden | kunder som tipsar |

Fyndplats finns inte på Cuponation (404).

### Planen, i ordning

Allt nedan kräver ett konto eller ett beslut från Leonard. Inget av det
går att göra från den här sessionen.

1. **Gratisprofiler, samma vecka:**
   - Reco.se (dealproffsen har en).
   - Trustpilot.
   - Google Företagsprofil.
   - hitta.se, eniro.se och allabolag med webbadressen ifylld.

   Länkarna är oftast nofollow, men profilerna tar egna sökträffar på
   "fyndplats" och bygger förtroende.
2. **Prisjämförelse:** Prisjakt och PriceRunner, som ägs av Klarna, och
   butiken använder redan Klarna. Villkoren behöver kollas. Det här är den
   kanal där vårt prisläge mot dealproffsen syns direkt för köparen. Det är
   inte SEO i strikt mening, men det ger trafik utan domänstyrka.
3. **Rabattkodssajter:** Cuponation, Rabattkungen, rabattkodswe. En kod
   kostar marginal bara när den används. Många av sajterna hämtar butiker
   från affiliatenätverk, så steg 4 kan ge dem på köpet.
4. **Affiliateprogram**, till exempel Adtraction: det är så bästatestet.se
   och liknande sajter länkar till dealproffsen. Det kostar provision per
   order, och med husets 17 % marginal ryms bara en liten procentsats. Det är
   ett affärsbeslut.
5. **Digital PR med egen data**, den starkaste och helt regelrätta vägen.
   Vi har något ingen journalist har: priset på över tusen identiska varor
   hos olika svenska butiker. En konsumentvinkel som *"samma soffa kostar
   upp till X % mer beroende på butik"* passar kvällstidningarnas
   konsumentsidor och lokalpressen. Konkurrenter behöver inte namnges.

☠️ **Inte rekommenderat:** köpta artiklar med följbara länkar, alltså det
dealproffsen gör på Expressen, Norra Halland och Dagens-sajterna. Googles
spampolicy kräver `rel="sponsored"` på betalda länkar, och då ger de ingen
rankning. Utan märkningen riskerar domänen en manuell åtgärd.

## 5. Mät

- **Länkarna:** omätningen 2026-10-30 (`../sokord-kategorier/`) bör också
  hämta `backlinks_overview` för båda domänerna. Riktiga svenska domäner
  räknas för hand bland de 50 starkaste.
- **Efter mergen av #647:** `python3 lackkoll.py https://www.fyndplats.se`
  ska ge 14 av 14.
- **Massagepistolguiden:** har guiden tagit över platsen på *massageapparat
  bäst i test*? Semrush på `/blogg/massagepistol-kopguide-2026`.

## Semrush-kostnad

- backlinks_overview ×2: 80 enheter
- backlinks_refdomains (50 + 40 rader): 5 200 enheter
- backlinks (30 rader): 1 200 enheter

Totalt cirka 6 500 enheter. Organiska data återanvändes från i morse.
