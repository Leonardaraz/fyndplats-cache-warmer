@AGENTS.md

# Så här jobbar vi: bunta ihop deploys

**Högst en deploy till produktion per dag** (Leonards beslut 2026-09-30; förut
"en eller två"). Samla dagens ändringar på grenen och merga när de hänger
ihop — merga inte varje fix för sig så fort den är grön. **Pusha också sällan:**
varje push bygger en testversion, i båda Vercel-projekten. `[skip ci]` fungerar
inte här.

## Mätt 2026-09-30: vad som kostade, och vad som ändrades

Fakturan låg 2,4 dygn in i cykeln i en takt nästan tre gånger förra periodens.
Fyra rader stod för det mesta:

| Rad | Mängd | Orsak (mätt) |
| :-- | --: | :-- |
| Build CPU | 17 h 36 min | "On-Demand Concurrent Builds" stod på *Run all builds immediately* i båda projekten, så varje bygge debiterades per påbörjad minut — även de som avbryts efter en halv minut. **Avstängt 2026-09-30** (Leonards ja): på Standard-maskinen är byggen i den inkluderade platsen gratis. Byggen köar nu; produktion går först. |
| Fluid CPU + minne | 12 h 30 min, 130 GB-h | Produktsidor som byggdes om (nedan) och de 40 förbyggda sidorna: de körs som egna funktioner som kallstartar, och varje kallstart hämtade hela Wix-katalogen (~60 anrop i rad, ~1 min). Loggen `[wix] live products loaded` kom på 40 sökvägar på tre timmar, nästan bara de förbyggda. |
| ISR Writes | 692K enheter | `/produkt/[slug]` stod för 126K av 163K skrivenheter på 12 h: ~12 000 ombyggnader, och varje gav en skrivning eftersom menysiffror, datum och varukorgsförslag ändrats. |
| Observability Plus | 1,58 M händelser | Tillägget var på. **Avstängt 2026-10-02** av Leonard. Loggar och fel syns fortfarande i Vercels vanliga vy. |

**Varför produktsidorna byggdes om hela tiden:** sidan sade `revalidate = 3600`,
men V3-hämtningen i `lib/products.ts` hade `revalidate: 300`, och Next sänker hela
rutten till den lägsta fetch-tiden. Sidorna byggdes alltså om var femte minut så
fort någon tittade (kund, sökmotor, länkförladdning).

**Så fungerar det nu** (`lib/produkt-cache.ts` har detaljerna):

- Produktsidan och varje hämtning på dess väg lever **sex timmar** — ett
  säkerhetsnät, inte färskheten. `lib/produkt-cache.test.ts` fäller en ny modul
  i `lib/` eller `components/` med kortare `revalidate` som inte står på den
  granskade listan.
- **En ändring tömmer bara sin egen produkt.** `/api/cron/uppdatera-andrade`
  (var femte minut, fönster elva minuter) läser Wix `updatedDate`, nya ordrar
  och motorns `/api/review-andringar`, tömmer `produkt-<id>` eller
  `recensioner-<id>` och sidan, och värmer sidan. Motorn säger dessutom till
  direkt vid fyndauktionens prissteg via `/api/admin/uppdatera-produkter`
  (nyckeln som kakan `fp_admin` eller Bearer — aldrig i adressen).
- ☠️ **Varje synlig sida som töms värms också** (sedan 2026-10-29,
  `varmningsplan` i `lib/produkt-cache.ts`). Förut värmdes bara de 120 nyaste
  per körning, och kl. 12:46 UTC den dagen ändrades 998 produkter på en gång:
  878 sidor låg tömda tills en kund öppnade dem (8 av 80 slumpade produktsidor
  svarade `REVALIDATED` på 1,0–1,3 s samma kväll, mot 0,3 s ur cachen). En
  ändring töms av två eller tre körningar, så alla värms först sista gången den
  syns (äldre än sex minuter), och de 120 nyaste direkt. Det som inte hinns
  inom körningen tar uppvärmningens led (`POST /api/cron/varm-katalogen`). En
  dold produkt töms men värms inte: sidan svarar 404, och VEVOR-importens
  utkast gav förut "värmde 0 av 74 (fel 74)" i varje körning.
- ☠️ **Cronen kräver `CRON_SECRET`.** Saknas den svarar
  `/api/cron/uppdatera-andrade` 503 och ingenting töms — då gäller bara
  säkerhetsnätet på sex timmar.
- ☠️ **Töm aldrig med en global tagg** (`reviews`, `gpsr`): den sitter på varje
  produktsida och tömmer alla ~3 700 på en gång.
- ☠️ **Aldrig `cache: "no-store"` i en sidrendering** — det gör ISR-sidan
  dynamisk och Next svarar 500 (se `lib/popularity.ts`).
- En sida byggd på reservdata (Wix eller motorn svarade inte, en kapad katalog,
  tomma kategorier) lever fem minuter, inte sex timmar: `kortLivslangd()` i
  `lib/kort-livslangd.ts`.
- En produkt som raderas i Wix utan att döljas först syns inte i `updatedDate`
  och töms inte — dess sida ligger kvar tills säkerhetsnätet går ut. Dölj först.
- **Inga produktsidor förbyggs.** Efter en deploy värmer
  `/api/cron/varm-katalogen` katalogen.
- ☠️ **Ett pass hinner inte hela katalogen, så värmningen går i led
  (2026-10-23).** Efter deployen 01:02 UTC värmde körningen 01:15 1 824 av
  5 092 produktsidor och slutade. Nästa körning såg ett varmt prov, för provets
  egen hämtning hade värmt de tolv provsidorna. Kl. 13:19 var 5 av 40
  stickprovssidor fortfarande kalla (1,1 s mot 0,4). Ett pass som stoppas på
  sin deadline lämnar nu resten till ett led: ett POST till samma rutt med
  listan i kroppen och `CRON_SECRET`, som svarar 202 och värmer efter svaret.
  Högst tre led (`MAX_LED` i `lib/warm-urval.ts`), och listorna värms av det
  led som gör katalogen klar. Läs `[varm-katalogen] led N`-raderna i loggen
  efter en deploy: den sista ska säga `katalogen klar`.
- ☠️ **Led 4 nekades, och kedjan sa ändå "katalogen klar" (2026-11-06).**
  Efter båda nattens deployer värmde led 1–3 som vanligt (248–704 sidor
  vardera på 200 s), men led 4 fick nej på varje sida direkt: "värmde 0/3736
  (fel 3736) — katalogen klar. Listor: 0/139", tusentals hämtningar på tolv
  sekunder. Varje led startas inifrån det förra, och fem anrop djupt nekas
  anropen (troligen Vercels skydd mot anrop i slinga). 2 300–3 700
  produktsidor och alla listor förblev kalla, och provet (de tolv fasta
  sidorna) såg varmt ut, så ingen körning tog vid. Leonard bad om manuell
  uppvärmning samma morgon. Nu: högst tre led, 700 s per körning
  (`maxDuration` 800), felens statuskoder i loggraden (`fel 2328: 508×2328`),
  och ett pass där varje hämtning nekades (`allaNekade`) kallas aldrig klart
  och startar ingen kedja.
- Menyns siffror hämtas från `/api/meny-antal` och varukorgens förslag från
  `/api/kundvagn-forslag`, i webbläsaren. Länkarna ligger kvar i HTML:en.
- `validFrom` är första dagen i månaden och `priceValidUntil` sista dagen i
  nästa månad (`lib/pris-giltig.ts`), inte i dag + 30 dagar.

**En deploy kostar fortfarande två gånger:** den tömmer ISR-cachen, så alla
~5 100 produktsidor byggs om (2026-10-23). Därav en deploy per dag, och den
läggs på natten: de fem deployerna 2026-10-18–23 gick ut kring kl. 03 svensk
tid.

## Varför — mätt, inte antaget (2026-09-04)

Vercel-fakturan 2026-09-04, sju dagar in i cykeln, 11,84 av 20 dollars
inkluderad kredit förbrukad:

| Rad | Belopp | Andel |
| :-- | --: | --: |
| **Build CPU Minutes** | **$5,80** | **49 %** |
| Observability Events | $1,88 | 16 % |
| ISR Writes | $1,80 | 15 % |
| Fluid Provisioned Memory | $0,78 | 7 % |
| Fluid Active CPU | $0,51 | 4 % |

Byggen är alltså halva notan. Den veckan innehöll en dag med **fem merges**
(#607, #610, #611, #612 plus mellanpushar) — fem byggen för arbete som hade
rymts i ett eller två.

**Och en deploy kostar två gånger.** Den tömmer ISR-cachen, så ~1 580 av
1 622 produktsidor (då) blev kalla; första besökaren på varje sida betalade en
rendering på 0,86–1,52 s i stället för 0,15. `/api/cron/varm-katalogen` värmer
upp dem igen, men det är ytterligare en rendering per produkt och deploy. Färre
deploys är alltså både billigare OCH snabbare för kunden.

## Undantaget

En bugg som skadar kunder just nu får sin egen deploy direkt. Det är
kostnaden värd. Allt annat — refaktoreringar, prestandaarbete, innehåll,
SEO — väntar in sina syskon.

## Det praktiska

- Flera relaterade ändringar → samma gren, samma PR, en merge.
- Är de orelaterade men klara samma dag → merga dem i följd med kort
  mellanrum hellre än utspritt över dagen; Vercel hinner då slå ihop
  köandet, och katalogen behöver bara värmas en gång.
- Skriv PR-texten så den bär flera ändringar. Det gör inte historiken
  sämre — varje commit är fortfarande sin egen berättelse.

## Särskilt för SEO- och produktpolering

Den som polerar produkttexter, bilder, titlar eller metadata rör ofta
dussintals produkter under en session. **Det ska bli EN PR, och den ska
mergas sällan.**

- Öppna en gren för hela poleringspasset och lägg alla produkter där.
  Öppna inte en PR per produkt.
- Merga när passet är klart — inte efter varje produkt som blivit bra.
  En halvfärdig gren skadar ingen; den ligger bara och väntar.
- Går arbetet över flera dagar: låt grenen leva och merga när den är klar,
  hellre än att merga varje dags skörd.
- Poleringen är dessutom sällan brådskande. Ingen kund väntar på en
  omskriven produkttitel — det är precis den sortens arbete som ska samlas
  ihop.

Ett polerpass som blir tjugo PR:ar kostar tjugo byggen och tjugo
katalogvärmningar för arbete som ingen kund märker snabbare.

## Wix-hämtningar: ett sidtak räknat nyast först ser inte katalogen

Katalogen har över 6 000 produkter, och de nyaste tusentalen är Aosom-varor:
en variant, inga optioner och till hälften dolda utkast. En hämtning som går
nyast först och slutar efter N sidor läser alltså bara dem. Uppmätt
2026-09-24 på tre sidovagnar med tak på 12 sidor (1 200 produkter):

- **Färgfiltret** hittade 0 färger. Alla 239 produkter med optioner låg bakom
  taket. Nu filtrerar frågan på `options.id` (`lib/product-colors-paging.ts`).
- **Google-flödets gallerier** gav extrabilder till 557 av 3 393 produkter.
  Svepet har kvar sitt tak, men flödet faller nu tillbaka på produktens eget
  galleri.
- **Variantsvepet** till flödet hade kapat tyst vid 10 000 varianter runt
  mitten av november. Nu är taket 30 000, och slår det i loggas ett fel.

Tre regler:

1. **Filtrera i frågan** på det du behöver, i stället för att svepa och
   hoppas att det ligger tidigt.
2. **Filtret går bara med på första sidan.** Filter plus markör svarar
   400 INVALID_CURSOR på products/query, inventory-items/query och
   categories/query. Markören bär frågan själv.
3. **Ett tak ska kasta eller logga ett fel, aldrig kapa tyst.** En avkortad
   lista ser frisk ut.

## Kallstart: katalogen hämtas sex sidor åt gången (2026-10-21)

Varje ny serverinstans hämtar hela katalogen innan den kan bygga en sida
(`getProducts`, en gång per instans). Hämtningen gick en sida om 100 i taget,
och katalogen är 51 sidor. Loggen `[wix] live products loaded` kom 61–75 s
efter begäran, många gånger i timmen, och lika länge före deployen samma dag.
Det fick tre följder:

- **Morgonmejlet gick inte iväg 2026-10-21.** Det hämtar katalogen och hade
  `maxDuration` 60 s, så det stoppades 08:01.
- **Auktionsvarornas sidor** byggdes om i 66–73 s efter prisbytet kl 08, 10
  och 11.
- **Uppvärmningen** (`varm-katalogen`) hann 11 av 5 029 sidor kl 07:04.

Nu hämtas sidorna sex åt gången (`lib/katalog-sidor.ts`), och försäljningen och
färgvalen hämtas medan sidorna hämtas. Uppmätt mot skarpa Wix med butikens fråga:
65,7 s en i taget, 10–13 s sex åt gången, och samma produkter i samma ordning.
Morgonmejlet och `/api/admin/run-job` har 300 s.

Uppmätt på förhandsversionen samma dag, med åtta första besök samtidigt (sju
nya instanser): hela hämtningen tog 17,2–18,9 s och sidan 19,9–21,6 s, utan ett
enda omförsök. Färgvalen var klara sist varje gång. **Färgfrågan är nu den
långsammaste delen**: ett tiotal V3-sidor i rad med API-nyckeln
(`lib/product-colors-paging.ts`), och markören gör att de inte kan hämtas
samtidigt.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **En kort sida hämtas om**, och är den fortfarande kort blir raderna färre
   än totalantalet, så att katalogen inte cachas. Sidorna hämtas på fasta
   offset, så en kort sida mitt i betyder att produkter saknas.
2. ☠️ **Bara fel som går över försöks igen** (429, 408, 5xx, nätverksfel och en
   sida som inte svarat på 20 s), efter 1, 3 och 8 s. Wix SDK lägger statusen i
   felets `status`. Andra 4xx kastas direkt.
3. **Totalantalet är det största någon sida svarade.** Krymper katalogen under
   hämtningen cachas den inte, hellre än att en produkt saknas.
4. **Försäljningen och färgvalen startar först när en sida har svarat.**
   Färgvalen cachar ett misslyckat svar som tomt i 30 minuter, och katalogen
   räknas inte som degraderad när de saknas, så sidorna instansen bygger
   cachas utan färgfilter och färgbilder. Därför försöks en sida i färgfrågan
   om efter 0,5 och 2 s vid 429, 5xx och nätfel (2026-10-29: åtta 503:or på
   sex timmar, på sida 11–13 av 13, mot ungefär 100 lyckade hämtningar). En
   annan 4xx kastar direkt, och ett fel som står kvar efter tre försök kastar
   som förut. Loggraden `[wix] färgval hämtade` slutar på `, N omförsök` när
   ett omförsök behövdes.

Loggraden visar numera två tider, `— 51 sidor på … s, allt på … s`, där "allt"
är sidorna plus försäljningen och färgvalen. Varje ny instans hämtar
fortfarande hela katalogen, så den raden kommer lika ofta som förut, bara
snabbare.

## Sidhuvudet väntar inte in katalogen: den färdiga menyn (2026-11-07)

Sidhuvudets meny och REA-knapp byggs ur hela katalogen (`getCategoryTree`,
`getProducts`). En ny instans hämtar den först, 21–34 s, och varje sida som
byggs vid besöket väntade därför så länge: kassan efter en omladdning, Klarnas
retur, påminnelselänken, medlemmarnas väg till kassan, `/tack` efter
betalningen och Mina sidor (21,5 s, mätt 2026-11-06). Kassans sidor döljer
dessutom sidhuvudet med CSS. Vercel visade cirka 690 sådana katalogladdningar
på ett dygn.

Nu (`lib/sidhuvud-val.ts`, `lib/sidhuvud-data.ts`):

- **En varm instans bygger som förut** ur katalogen den redan har
  (`katalogenLaddad()` i `lib/products.ts`).
- **En kall instans läser den färdiga menyn** ur
  `FyndplatsButikInstallningar/sidhuvud-meny-<miljö>`. Läsningen tar högst
  2,5 s, och svaret hålls en minut per instans.
- **`/api/cron/meny`** bygger menyn med samma kod fyra gånger i timmen och
  sparar den. Loggen säger bara till när menyn ändrats eller inte sparades.
- **Reserven är den gamla vägen.** Saknas raden, är den äldre än sex timmar,
  har den fel form eller svarar Wix inte i tid, bygger sidhuvudet ur katalogen
  som förut. Aldrig ett sidhuvud utan meny.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Läsningen görs med `fetch` utan cache-val**, som `lib/popularity.ts`.
   `lib/wix-lager.ts` använder `cache: "no-store"`, och det gör en ISR-sida
   dynamisk mitt i renderingen så att Next svarar 500. Provet fäller den
   ändringen.
2. ☠️ **En degraderad katalog sparas aldrig**, och inte heller en meny med
   färre än tre huvudkategorier eller över 400 kB. En trasig meny i Wix hade
   annars visats på varje kall instans.
3. **En rad per miljö.** En förhandsversion skriver `sidhuvud-meny-preview`,
   aldrig produktionens rad.
4. **Raden bär versionen (`v`).** Ändras menyns form ska `MENY_VERSION` höjas,
   så att en gammal rad aldrig tolkas som en ny.
5. ☠️ **404-sidan läser också `sidhuvudsdata()`, aldrig katalogen.** Next bygger
   `app/not-found.tsx` med varje sida, också när ingen 404 visas, eftersom den
   är gränsen för `notFound()` runt hela layouten. När den läste
   `getCollections()` syntes /konto på en ny instans efter 2 s men blev klar
   först efter 26 s: strömmen stod öppen tills katalogen var hämtad (mätt på
   förhandsbygget 2026-11-07, spårat lokalt till `NotFound`). Dess sex
   kategorier ordnas med `MAIN_ORDER` som förut (`populara()`). Provet fäller
   en katalogläsning i filen.

En cachad produktsida bär redan i dag ett sidhuvud som kan vara sex timmar
gammalt, så den färdiga menyns högst 15 minuter ändrar ingenting kunden ser.

## Morgonmejlets ⚠️-ruta: bara avvikelser (2026-10-29)

Rutan larmade varje morgon för produkter slut i lager och med lågt lager. Med
omkring 5 000 dropship-varor är båda alltid fler än noll (2026-10-29: 529 och
133), så mejlet sa "⚠️ 2 sak(er) att kolla" varje dag. Leonard samma dag: bara
avvikelser i rutan. Regeln bor i `lib/morgon-varningar.ts` och gäller både
mejlet och `/admin/dashboard`. I dag larmar bara ej återhämtade kundvagnar.
Lagersiffrorna står kvar i statusraden. Lägg inte tillbaka en varning som är
sann varje dag: ett larm som alltid fyrar lär mottagaren att sluta läsa.

## Länkar som bara renderas vid hovring finns inte för Google (2026-09-24)

Mega-menyn renderade bara den hovrade panelen. Googlebot hovrar och klickar
aldrig, så de 105 underkategorierna saknade länkar från nästan hela sajten.
Uppmätt i produktion, både i server-HTML och renderat i Chromium utan
interaktion:

| sida | länkar till underkategorier |
|---|--:|
| startsidan | 0 |
| en produktsida | 1 (bläddringsraden) |
| /butik | 48 |
| en avdelningssida | bara efter JS (Förfina-chipsen ligger bakom en Suspense-gräns) |

En PageRank-modell över sajtens egna länkar gav underkategorierna ungefär
samma interna värde som en medianprodukt. Med panelerna i HTML
(`components/meganav.tsx`) blir det 43–80 gånger mer.

Regeln: **en länk som ska räknas ska finnas i HTML:en från början.** Dölj den
med `hidden` eller CSS, men rendera den inte villkorligt vid hovring, klick
eller först efter mount. Mobilmenyn (portal efter mount) och
kategori-dropdownen (`{open && …}`) är bekvämligheter för kunden, inte länkar
för Google. `lib/meganav-ssr.test.ts` fäller om desktopmenyns paneler blir
villkorliga igen.

## Listsidor: HTML:en ska vara det kunden ser (2026-09-27)

Kategorisidorna skickade sina kort i katalogordning, och ShopBrowser sorterade
om dem i webbläsaren. När sidan laddat klart stod 0 av 24 kort kvar på
/kategori/husdjur. Sökmotorn läste alltså andra produkter än kunden såg, och
rutnätet blinkade om. Samtidigt låg hela produktlistan i sidan: 1,3 MB av
/alla-produkters 2,8 MB. Bing flaggade tre sidor som över 1 MB.

Tre regler (`lib/list-pages.ts`, vaktas av `lib/listsidor.test.ts`):

1. **Ordna listan på servern** med `ordnaLista` och skicka samma `dayMs` till
   ShopBrowser.
2. **Skicka bara början av listan.** `listaForSidan` ger de första 48 korten
   plus en sammanfattning för filtren. Resten hämtar ShopBrowser från
   `/api/lista`, som räknar samma lista med samma funktion.
3. **A–Ö-listorna stannar på kategorisidorna.** Enligt en PageRank-modell över
   sajtens egna 4 015 sidor halveras produkternas interna värde utan dem
   (median 0,320 → 0,170), och sidnumrering var sämre (0,175). De skickas som
   färdig HTML-sträng, eftersom en JSX-lista ligger en gång till, dubbelt så
   stor, i React-datan.

## ☠️ Kortets andra bild står aldrig i HTML:en (2026-11-14)

Google Bilder visade massagestolens foto under gamingstolens adress.
Gamingstolens sida har "Liknande produkter" med massagestolens kort, och
kortets andra bild (hover-bilden, `.pimg-alt`) låg i sidans HTML. Google
tillskrev bilden den sidan. Andra bilden läggs därför in först när en människa
rört sidan (`components/kort-andra-bild.tsx`, `lib/forsta-rorelse.ts`, vaktas
av `lib/kort-andra-bild.test.ts`):

- Bara pointermove, pointerdown, touchstart, keydown och wheel räknas, aldrig
  scroll: sidan kan rulla utan att någon rört den.
- Servern och hydreringen säger alltid nej, så bilden står aldrig i HTML:en.
- Hover-bytet tonar bort huvudbilden först när andra bilden är laddad
  (`data-klar`). Kortet blir aldrig tomt.
- Produktkortet och auktionskortet går båda genom `KortAndraBild`. Ett nytt
  kort med en andra bild gör likadant.

## ☠️ En listsida byggs aldrig på reservkatalogen (2026-11-11)

**Mätt 2026-11-11.** Kl 12:09:40 UTC svarade Wix 504 på kataloghämtningen för
en ny instans, också efter de tre omförsöken. Sex kategorisidor byggdes just då
om i bakgrunden, på reservkatalogen (`products.json`: 413 gamla produkter utan
en enda kategori). Sidorna blev tomma, fick `noindex` av tröskeln i
`lib/category-threshold.ts` och ersatte de hela sidorna i cachen. Fem av dem,
bland annat Elbilar för barn och Skrivbord, låg kvar så i två timmar och tio
minuter, tills nästa besök råkade komma. Körloggen hade felet som en enda rad:
`[wix] live fetch failed, using local fallback`.

`kortLivslangd()` räckte inte. Den sänker sidans livslängd till fem minuter,
men en sida byggs bara om när någon besöker den. En sällan besökt kategori står
kvar tom tills dess, och nästa besökare kan vara Googlebot.

**Regeln.** En sida vars innehåll ÄR katalogen läser `getHelaKatalogen()` och
aldrig `getProducts()`. Är katalogen reservlistan eller en kapad hämtning
kastar den `KatalogenEjHel`. När en ombyggnad i bakgrunden kastar behåller Next
den förra, hela sidan och försöker igen vid nästa besök.

- Listan över sidorna står i `LISTSIDOR` i `lib/hel-katalog.ts`: startsidan,
  `/butik`, `/alla-produkter`, `/rea`, kategorisidan (sidan OCH
  `generateMetadata`, där `noindex` räknas), de programmatiska sidorna
  (`lib/seo/programmatic.ts`) och de två äldre flödesrutterna under `/api/feed`.
  `lib/hel-katalog.test.ts` läser källtexten för var och en.
- `getProductsFarska()` har samma krav. Sitemapen och sökindexet behåller då
  sin förra version. Flödena fångar felet, bygger utan varor och svarar 503
  som inte sparas (`tomtFlodeSvar`), så läsaren behåller sin förra inläsning.
  Ett flöde byggt på reservkatalogen hade fått Google att ta bort resten av
  sortimentet.
- **Kategorisidan läser också kategorilistan genom en spärr,
  `getHelaKategorier()`.** Faller kategorihämtningen kommer listan hem tom.
  Kategorin "finns" då inte, och sidan svarade förr med en 307 till `/butik`
  som sparades i den hela sidans ställe. Butiken har alltid kategorier, så en
  tom lista är ett fel och aldrig ett svar. En okänd adress ger 404 och en känd
  men tom kategori 307 som förut: de fallen har en kategorilista att fråga.
  `generateStaticParams` läser `getCollections()`, så ett bygge utan
  kategorilista ger inga förbyggda kategorisidor men faller inte.
- **Produktsidan, sidhuvudet, varukorgen och kontot läser `getProducts()` som
  förut.** Produktsidan läser sin vara direkt ur Wix och ska gå att köpa från
  också när katalogen i minnet är reservlistan. Där gäller `kortLivslangd()`.
  Startsidan, `/butik` och `/alla-produkter` läser `getCollections()` som
  förut: utan kategorier tappar de sina kategorirutor i fem minuter, men
  varorna står kvar och sidan går att indexera.

**Följden vid ett bygge.** Faller kataloghämtningen medan sidorna
förgenereras, faller bygget med `KatalogenEjHel` i loggen. Det är avsikten:
förr gick ett sådant bygge igenom och lade ut tomma kategorisidor utan att
någon såg det. Den förra produktionen står kvar. Starta om bygget.

**Så syns det i drift.** `[katalog] … byggs inte på reservkatalogen` i
körloggen betyder att en ombyggnad avstod och att den gamla sidan visas. En
sådan rad då och då är Wix som hickar. Många i rad betyder att Wix är nere, och
då är sidorna så gamla som den senaste lyckade ombyggnaden.

**Provat lokalt 2026-11-11** med `next start`, kategorisidans livslängd sänkt
till 20 sekunder bara i provet, och Wix blockerat på tre sätt. Sidan hämtades
fyra gånger per fall, med 30–45 sekunder emellan.

| Wix-anrop som faller | Utan spärren | Med spärren |
|---|---|---|
| Bara produkterna (som kl 12:09) | tom lista med `noindex` från andra hämtningen | den hela sidan alla fyra gångerna |
| Bara kategorierna | sparad 307 till `/butik` från andra hämtningen | den hela sidan alla fyra gångerna |
| Alla | sparad 307 till `/butik` från andra hämtningen | den hela sidan alla fyra gångerna |

Ett riktigt Wix-avbrott i produktionen är inte provat.

☠️ **Provet ljög två gånger innan det höll.** En gammal `next start` stod kvar
på porten, den nya servern dog på `EADDRINUSE`, och hämtningarna träffade den
gamla. Varken `ss` (finns inte) eller `lsof` (ser ingenting) hittar lyssnaren i
molnbehållaren. Läs porten ur `/proc/net/tcp`, och lita aldrig på ett prov vars
serverlogg säger `EADDRINUSE`.

## Grannlänkar och korta stycken: Semrush-kategorin AI Search (2026-11-11)

Semrush kategori "AI Search" har bara notiser. Två av dem hade fynd, och båda
räknas också i andra kategorier.

**"Pages with only one incoming internal link" (6 001).** 5 754 var
`/kontaktaoss?produkt=…` (lösta när länken fick `#` i stället för `?`). Resten:

- 50 prissidor (`/under-…-kr/<kategori>`) hade en enda länk, den från sin egen
  kategorisida.
- Två intressesidor och två blogginlägg hade en enda länk.
- Orsaken på alla tre ställena: listan "fler sidor" togs med `.slice(0, 3)` från
  början, eller fanns inte. De första sidorna fick alla länkar, de sista inga.

☠️ **En lista med "fler sidor" är en RING, aldrig de N första.**
`ringEfter(lista, index, antal)` i `lib/seo/grannlankar.ts` ger de närmast
följande, runt hörnet. Då får varje sida lika många länkar in som den har ut.

- Prissidan: `prisgrannar()` länkar till avdelningens prissida, till
  underkategoriernas (högst `MAX_BARN`) och till de fyra följande syskonens
  (`MAX_SYSKON`). Bara kategorier med en giltig prissida, och alltid den högsta
  nivån.
- Intressesidan: de tre följande i `INTERESTS`, bland dem som har en giltig sida.
- Blogginlägget: "Fler inlägg" med de två följande i bloggens ordning.
- ☠️ Prissidans länkrad är EN RAD I SIDLED på mobilen när länkarna är sju eller
  fler (`svepRad()`, `.prog-links-svep`, samma mönster som `.subchips`). Mätt på
  förhandsbygget i 390 px: avdelningen Möbler fick 19 länkar, och som rader blev
  de 18 rader och 1 014 px (förut 102). Ingen länk är kort nog för att två ska
  rymmas i bredd. Bara prissidan ber om det (`svepbar`); produkt-, kategori-,
  intresse- och guidesidorna radbryter som förut, och det gör datorn också.

**"Content not optimized" (23).** 22 produktsidor och `/kopvillkor`. Mätt orsak:
ETT stycke på 158–219 ord. Sidor utan fynd hade högst 84 ord i ett stycke.
Rubrikordningen och läsbarheten var inte orsaken.

- På 13 av de 22 produktsidorna var stycket en lång kundrecension.
  `delaIStycken()` i `lib/stycken.ts` delar texten vid meningsgränserna i stycken
  om högst 70 ord, ungefär lika långa. Samma ord i samma ordning, bara fler `<p>`.
- ☠️ På de 9 andra satt stycket i PRODUKTTEXTEN, i fliken "Användning och
  skötsel": 164–185 ord i ett enda `<p>`. Det syntes först när förhandsbygget
  mättes sida för sida; kartläggningen hade bara sett recensionerna.
  `delaLangaStyckenIHtml()` delar varje rent textstycke över 84 ord när sidan
  ritas (`app/produkt/[slug]/page.tsx`). Texten i Wix rörs inte, och JSON-LD,
  FAQ och säkerhetsraderna läser den råa texten. Ett stycke med en tagg i sig
  (länk, fetstil) delas aldrig, och inte heller ett stycke med ett `id`
  (delarna ärver attributen). Mätt på 240 produktsidor ur sitemapen: 12 har
  ett sådant stycke i produkttexten (5 %), alltså runt 300 i hela katalogen.
- ☠️ `lib/stycken.ts` GÅR TILL WEBBLÄSAREN, för recensionerna är en
  klientkomponent. Första versionen delade meningarna med ett bakåtblickande
  reguljärt uttryck (lookbehind). Safari före 16.4 kan inte läsa ett sådant,
  och då faller HELA skriptfilen, inte bara delningen. Butiken lovar iOS 14 och
  uppåt (browserslist). Det hittades i granskningen före mergen, inte av något
  prov: Chromium är den enda webbläsaren som går att köra i molnet. Nu delas
  meningarna utan bakåtblick, och provet fäller en sådan i modulen eller i
  recensionskomponenten.
- Tre ställen är aldrig en meningsgräns: efter en förkortning som följs av mer
  text ("max. 135 kg", `EJ_MENINGSSLUT`), efter ett ensamt tal med punkt
  ("2. Skruva fast") och vid ett hårt mellanslag. En utebliven delning gör bara
  stycket längre, en felaktig syns. Mätt på 84 riktiga texter över 70 ord från
  262 produktsidor: delningen blev densamma som förut i alla.
- ☠️ Styckena ritas I FÖLJD (`.rev-text p{display:inline}`), och klampen sitter
  på behållaren. Annars räknar klampen på fem rader per stycke, och "Visa mer"
  mäter fel. Mätt i Chromium 320–1280 px: samma höjd, samma radbrytningar och
  samma "…" som med ett enda `<p>`. Safari är inte mätt.
- Köpvillkoren: fyra långa stycken delade i kortare, samma meningar. Den
  lagstadgade kostnadsupplysningen för skrymmande returer (98 ord) ritas med
  `delaIStycken(SKRYMMANDE_RETURKOSTNAD)` som två stycken, ord för ord. Provet
  fäller ett stycke över 84 ord.

☠️ **Samma fälla fanns i listsidornas filter, och den är rättad på ett annat
sätt.** `lib/spec-facets.ts` bygger sina uttryck med bakåtblick (`sv()` gör om
`\b` så att å, ä och ö räknas som bokstäver) och går till webbläsaren med
`components/shopbrowser.tsx`. Varje `sv(...)` körs när modulen laddas, så i
Safari före 16.4 kastade modulen redan där.

- Uttrycken KÖRS bara på servern (`lasSpec()`). Webbläsaren använder
  `FACETTER` och funktionerna för intervall, val och adresser.
- Därför frågar modulen motorn en gång (`KAN_BAKATBLICK`). Med bakåtblick
  byggs uttrycken precis som förut. Utan får `\b` stå som det står: uttrycket
  blir giltigt, modulen laddas, och ingen kör det.
- Att skriva om uttrycken utan bakåtblick hade ändrat vad filtren läser ur
  produkttexterna. Det här sättet ändrar ingenting på servern. Mätt: alla 47
  exporterade uttryck är tecken för tecken desamma, och `lasSpec()` ger samma
  svar som förut på 262 riktiga produktsidor (1 561 fält).
- ☠️ Bakåtblicken får bara stå i en STRÄNG som byggs med `new RegExp`, aldrig
  som ett uttryck direkt i koden. Ett sådant läses när skriptfilen tolkas, och
  då hjälper ingen kontroll. Provet fäller det, och det kör modulen i en
  process där `RegExp` vägrar bakåtblick, som den gamla Safarin.
- `lib/variant-bilder.ts` har också ett bakåtblickande uttryck och importeras
  av `components/productview.tsx`, men bara funktioner som inte rör det. Mätt i
  bygget: det följer inte med till webbläsaren. Den som börjar använda
  `nammdaFarger()` i en klientkomponent tar med det dit.

Inte gjort, med flit:

- Produktsidor som bara nås med `?variant=` i adressen: Leonard lägger `variant`
  bland parametrarna som Semrush ska bortse från.
- Poleringen har ingen spärr mot ett stycke över 84 ord. Sidan delar det vid
  visningen, så felet syns inte, men texten i Wix är fortfarande ett stycke.
- Produkter som bara ligger i en synlig kategori har en länk för att de har en
  plats. Det är inget fel.

## Måttfilter på kategorisidorna (2026-09-27)

Kategorisidorna filtrerar på bredd, djup, höjd, sitthöjd, maxlast, vikt,
effekt, volym, ålder och material, utöver pris, färg och rea. Värdena läses ur
produktbeskrivningens spec-rader (`lib/spec-facets.ts`). Wix har inga fält för
dem. Uppmätt på 3 783 produkter: bredd 80 %, höjd 78 %, djup 75 %, material
84 %, vikt 62 %, maxlast 43 %. 112 av 114 kategorier får minst ett filter.

Fyra regler:

1. **Hellre tomt än fel.** Kartongens mått läses aldrig. Två mått utan
   förklaring ger bara bredden. Ett ensamt mått i namnet ("bred sits på
   79 cm") räknas inte. Justerbar höjd sparas som ett intervall. En produkt
   utan värde försvinner bara när just det filtret används, och det skrivs
   inte ut hur många det gäller (Leonard).
2. **Kategorin föreslår, datan avgör.** `lib/spec-config.ts` säger vilka
   filter kategorin erbjuder och vad de heter, och underkategorier ärver.
   Nycklarna är butikens slugar (`asciiSlug` av namnet, t.ex.
   `koksmaskiner-apparater`), inte Wix (`köksmaskiner-apparater`); med Wix
   slugar gick 16 kategorier utan filter första kvällen.
   Ett filter visas bara när minst 60 % av listan har värdet
   (`specOversikt`).
3. **Hela sortimentet får inga måttfilter.** Det gäller /alla-produkter, /rea,
   /populara och /sok. En bredd som gäller både soffor och vattenkokare säger
   ingenting.
4. **Måtten följer bara med där de filtreras.** Bara kategorins nycklar
   skickas (`specFor`), och bara med `/api/lista` eller korta listor, aldrig
   med sidans första kort. `/api/lista` växte 6–10 % komprimerat.

Beskrivningarnas format styr täckningen: "Mått: 82 × 35 × 76 cm (B × D × H)",
"Maxlast: 120 kg" och "Material: stål och MDF" läses alltid.

### Knappgrupperna: klädsel, djur, form, antal, egenskaper (2026-09-27)

Utöver reglagen finns knappar för klädsel, djur, bränsle, form, placering,
antal (lådor, sittplatser, våningar, sängbredd) och egenskaper (hjul, höj- och
sänkbar, vattenavvisande, UV-skydd, LED, batteri, solcell, fjärrkontroll,
timer). De läses ur produktens EGEN text: namnet, spec-raderna, ingressen,
punktlistorna och rubrikerna. Brödtexten, "Vanliga frågor", "Passar inte den
här?" och länkar räknas inte, för där jämförs det med andra varor ("motpolen
till våra höj- och sänkbara bord"). Stickprov per kategori hittade och
låste (`lib/spec-facets.test.ts`):

- **JavaScripts `\b` räknar inte å, ä, ö som bokstäver.** `/\bträ\b/` hittade
  aldrig "Material: trä", `/\båtta/` aldrig "åtta lådor". Alla mönster med
  svenska ord går genom `sv()`.
- **Nekat räknas inte**: "inte hjul", "utan batteri", "Batteri: tutan kräver
  inget batteri". Batterierna till fjärrkontrollen gör inte lampan
  batteridriven.
- **Delar är inte varan**: "höjdjusterbart styre", "löphjul", "rullbar dörr",
  "två fotpallar" (inga sittplatser), tippskyddet i väggen (inte vägghängd),
  ett vedställ (inget bränsle), stolar (ingen form).

### Panelens utseende (jämfört med IKEA, Chilli, Mio, JYSK m.fl., 2026-09-27)

- **Mobil:** filtren i ett lager över sidan med fast fot, "Rensa alla" och
  "Visa N produkter". Inline sköt panelen ner produkterna nästan 3 000 px.
- **Valda filter** står som chips med kryss ovanför rutnätet, plus "Rensa
  alla". Det är den enda rensa-knappen på dator.
- **Antal** står på varje knapp och färg, räknat på de ANDRA filtren; noll
  tonas ned. Det är något annat än "12 st saknar uppgift", som inte visas.
- **Färg** är rutor med namn, flera kan väljas (`?farg=svart,gra`). Skenan
  valde bara en.
- **Reglagen** har Min/Max-rutor att skriva i; en inskriven gräns står kvar
  exakt (1 499 kr), den rundas inte till reglagets steg.

Knapparna visas vid 40 % täckning och minst två val, egenskaperna när minst
tre produkter har dem men inte nästan alla (90 %). Kategorin kan begränsa
egenskaperna ("eg:hj" i `lib/spec-config.ts`). Rumsstorlek för värmare
byggdes inte: texterna anger medvetet inte tillverkarnas m²-siffror.

## Kategoriträdet: tio avdelningar, rubriker i menyn (2026-09-30)

Granskningen hittade 519 felplaceringar. Den största: Elektronik & Tillbehör
bestod till mer än hälften av kontorsstolar och skrivbord. Dator & Gaming var
deras första underkategori, så 20 av dem gick ut i Google Shopping som 222
Electronics. Andra fel:
- Hem & Inredning bar 759 möbler som också låg under Möbler.
- Julgranar och kaminer låg under Dekoration.
- Kalas & Fest var till 70 % jul och halloween.

Trädet jämfördes med 25 butiker, bland dem IKEA, JYSK, vidaXL, Aosom, Rusta,
Jula och Zooplus, och byggdes om efter det:

- **Avdelningar:** Möbler, Hem & Inredning, Kök & Husgeråd, Trädgård &
  Utemöbler, Jul & Högtider, Barn & Familj, Husdjur, Sport & Fritid, Skönhet &
  Hälsa, Verktyg & Fordon (sedan 2026-10-31 Verktyg & Maskiner, se nästa
  avsnitt). Elektronik och Mode är dolda i Wix och har 301-omdirigeringar i
  `next.config.ts`.
- **Jul & Högtider** står i menyn och på /butik bara september–januari
  (`avdelningIHuvudmenyn` i `lib/meny-grupper.ts`). Sidan finns kvar året runt.
- **Rubrikerna i menyn** (Vardagsrum, Hund, Kontor & gaming …) ligger i
  `MENY_GRUPPER` i `lib/meny-grupper.ts`, inte i Wix. Wix har kvar två nivåer,
  så ingen adress flyttas. En ny kategori som saknas där hamnar under "Mer".
- **En produkt hör hemma i en avdelning.** Möbler ligger inte också direkt i
  Hem & Inredning. Förvaring får innehålla byråer och garderober, som hos alla
  möbelkedjor, men inte redskapsbodar eller sängramar.
- **Döljs en kategori i Wix** (hellre än att den raderas), då försvinner den
  för butiken och för importens kategoriförslag. Sidan svarar då 404 tills
  den har en omdirigering. Lägg därför omdirigeringen i samma deploy.

Flytten gjordes med namnregler över alla synliga produkter, med torrkörning
först: 330 tillägg och 1 261 borttag. Ingen produkt blev utan underkategori.

## VEVOR-trädet: tretton avdelningar i fast ordning (2026-10-31)

Leonard godkände ett kategoriträd för VEVOR:s cirka 12 000 varor: tre nya
avdelningar (Bygg & Renovering, Bil & Garage, Företag & Proffs) och 51 nya
underkategorier. Verktyg & Fordon bytte namn till Verktyg & Maskiner, och Bil &
släp och Elbilsladdning & solenergi flyttade till Bil & Garage med oförändrade
namn och adresser. Hur motorn sorterar in varorna står i motorns
`lib/vevor/kategorier.ts` (grenen `main`).

- **Menyns ordning är fast:** `AVDELNINGSORDNING` i `lib/meny-grupper.ts`.
  Menyn, mobilmenyn, kategorilistan på kategorisidorna och Om oss sorterade
  förut avdelningarna efter antal produkter, och då hade VEVOR:s verktyg
  hamnat först så fort de publicerades. `MAIN_GROUPS` (korten på /butik och
  startsidan) följer samma ordning, och `lib/meny-grupper.test.ts` håller ihop
  dem. `MAIN_ORDER` i `lib/products.ts` är något annat: den styr 404-sidans
  sex kategorier och `mixByCategory`, och står kvar i storleksordning.
- **Dolda kategorier syns inte, och det är meningen.** Wix-frågan tar inte med
  dolda kategorier, och tomma sållas bort. En rubrik i `MENY_GRUPPER` utan en
  enda synlig underkategori visas inte, och en avdelning utan produkter står
  inte i menyn. De nya rubrikerna och namnen i `MAIN_GROUPS` ligger därför
  redan i koden, och en underkategori dyker upp under sin rubrik när den visas
  i Wix, utan en ny deploy.
- **Texterna** finns bara för Verktyg & Maskiner och Bil & Garage, och de
  beskriver de underkategorier som var synliga 2026-10-31. Skriv om dem, och
  skriv texter, SEO och en tagline i `MAIN_GROUPS` för Bygg & Renovering och
  Företag & Proffs, när underkategorierna får produkter.
- **`/kategori/verktyg-fordon`** omdirigeras permanent till
  `/kategori/verktyg-maskiner`. `lib/omdirigeringar.test.ts` fäller om den
  gamla nyckeln dyker upp någon annanstans i koden.
- **Google-flödet** har en kategori för varje ny slug, kontrollerad mot
  taxonomifilen (`lib/google-kategori.test.ts`).
- ☠️ **Menyn ligger på en egen rad i sidhuvudet** (`.hnav`, från 901 px).
  Mätt i produktion 2026-10-31: loggan, tio avdelningar, hjärtat och
  kundvagnen var 1 131 px i en rad med 1 128 px, så kundvagnen och hjärtat låg
  utanför skärmen mellan 901 och 1 180 px (iPad på tvären är 1 080–1 194). Nu
  står loggan, sökrutan, hjärtat och kundvagnen på första raden och menyn på
  den andra, med `justify-content: space-between`. Simulerat på den levande
  sidan med alla tretton avdelningar: en menyrad från 901 till 1 440 px och
  kundvagnen inom skärmen på varje bredd. Mellanrummen krymper under 1 180,
  1 100, 1 000 och 960 px, och räcker de inte bryter menyn till en andra rad
  (`flex-wrap`) i stället för att hamna utanför skärmen. Sidhuvudet blev
  lägre (102 px mot 130). Under 900 px är allt som förut. Lägg aldrig tillbaka
  menyn i första raden.


- **Vercel Web Analytics** (`@vercel/analytics/next`) and **Speed Insights**
  (`@vercel/speed-insights/next`) are mounted in `app/layout.tsx`. Both are
  cookie-free / privacy-friendly, so they render unconditionally (outside the
  `CookieConsent` gate) and require no GDPR consent. Beacons hit
  `/_vercel/insights/view` and `/_vercel/speed-insights/vitals`.
- **GA4** (`G-W6NZ87CX2Q`) körs också, oberoende av Vercels mätning.
  ☠️ **gtag.js hämtas först när besökaren rör sidan** (`taggLaddare` i
  `lib/consent.ts`, Leonard 2026-11-12; förut `lazyOnload` via `next/script`).
  Biblioteket är 202 kB packat och 629 kB uppackat och körde förut i sidans
  första sekunder. Mätt på ett produktionsbygge med processorn strypt fyra
  gånger, 5 + 5 laddningar utan interaktion: blockeringen fram till 9,5 s efter
  load 545 → 365 ms i median, långa uppgifter 8 → 4. Det är samma arbete,
  flyttat till efter första trycket. Fem egenskaper som inte ska tas bort:
  1. **Kön och laddaren i samma inline-skript** (`consentBootstrapScript` +
     `taggLaddare` i `app/layout.tsx`). Kön tar emot samtycket, config,
     sidvisningen och händelserna tills biblioteket kommer. Skriv aldrig ut
     gtag.js en gång till med `next/script`; `lib/consent.test.ts` vaktar.
  2. **Den första sidvisningen köas med adressen från landningen**
     (`send_page_view:false` och en egen `page_view` med `page_location`,
     `page_referrer` och `page_title`). Ett tryck på en länk före taggen hade
     annars gett den nya adressen och tappat utm från ChatGPT och srsltid.
     Byttes adressen innan taggen kom skickar laddaren en sidvisning för den
     nya sidan med landningssidan som hänvisare. Sidbyten efter det räknar
     Googles historiklyssnare som förut: `send_page_view:false` stänger inte av
     den (mätt med dagens och det nya skriptet, lika i båda; GA4 skickar
     sidbytena i klump 5–6 s senare, så vänta minst 8 s innan du räknar).
  3. ☠️ **Taggen begärs när trycket är slut.** Lyssnarna är `pointerup`,
     `keydown`, `touchend`, `wheel`, `scroll` och `mousemove`, i fångstfasen och
     passiva, och biblioteket begärs efter nästa bildruta
     (`requestAnimationFrame` + `setTimeout`). Aldrig `pointerdown` eller
     `touchstart`: ligger biblioteket i cachen (Google sparar det i 15
     minuter) kör det millisekunder efter att det begärts, och då före
     tryckets klick.
  4. **Tacksidan hämtar direkt** (`TAGG_DIREKT`), för köpet skickas när sidan
     öppnas. Utan interaktion hämtas taggen 10 s efter load
     (`TAGG_RESERV_MS`). Den som lämnar inom 10 s utan att röra sidan räknas
     inte längre.
  5. **Händelserna bär sin egen adress** (`page_location` i `send()` i
     `lib/analytics.ts`). En view_item i kön hade annars räknats på nästa sida.
  Provat med riktiga gtag.js där varje träff fångades lokalt: landningsadress
  med utm och srsltid, hänvisare, sidbyte före och efter taggen, tacksidan,
  srsltid-städningen utan extra sidvisning, och samtycke som första tryck ger
  `gcs=G111` på sidvisningen (utan val `G100`).
  ☠️ **Taggen mäter bara på `www.fyndplats.se`** (`MATVARD` i `lib/consent.ts`,
  2026-11-08). Varje produktionsbygge har också en egen `*.vercel.app`-adress
  med `VERCEL_ENV=production`, så taggen körde där, och Googles tagg föreslog
  fem sådana adresser under "Konfigurera dina domäner". På alla andra värdar
  blir `gtag` en tom funktion och ingenting köas (mätt med Playwright med
  alla insamlingsanrop stoppade: 0 anrop, mot 8 när värden stämde). Sedan
  2026-11-12 hämtas gtag.js inte heller där, för laddaren slutar direkt.
  Godkänn aldrig ett `vercel.app`-förslag i Googles tagg.

# Meta Pixel + Conversions API (CAPI)

Facebook/Instagram-annonsspårning med **dubbel signal**: webbläsarens Pixel
(`fbq`) + server-side **Conversions API**. CAPI når fram även när iOS/Safari/
adblock blockerar Pixeln (~30–40 % av trafiken), och de två deduplicerar mot
varandra via en delad `event_id`.

### Filer
- `components/metapixel.tsx` — Pixel base-snippet (`fbq('init')` + `PageView`).
  Renderas från `app/layout.tsx` med `pixelId` ur `process.env.META_PIXEL_ID`.
  **Consent-gated**: laddas bara efter "Godkänn alla" (se nedan). Fyrar även
  `PageView` på SPA-navigeringar.
- `lib/meta.ts` — klientens `metaTrack()`: fyrar Pixel + POSTar `/api/meta/capi`
  med samma `event_id`. `keepalive` så InitiateCheckout överlever kassa-redirect.
- `lib/meta-capi.ts` — server-sändaren (delad). Hashar e-post/telefon med
  SHA-256, berikar med IP/UA, POSTar till Graph API.
- `app/api/meta/capi/route.ts` — POST-endpoint klienten anropar. `GET` =
  health-check (`{ configured: bool }`).
- `lib/analytics.ts` — fyrar Meta-event jämsides med GA4 (en enda källa).
- `app/api/wix-webhook/route.ts` — server-autoritativt **Purchase** vid
  `order_created` (med hashad kund-e-post/telefon), dedupat mot klientens
  `/tack`-Purchase via `event_id = purchase_<orderId>`.

### Event-mappning (Pixel + CAPI, delad event_id)
| Meta-event | Trigger | GA4-motsvarighet |
|---|---|---|
| `PageView` | varje sida (snippet + SPA-route) | — |
| `ViewContent` | PDP laddas | `view_item` |
| `AddToCart` | "Lägg i kundvagn" | `add_to_cart` |
| `InitiateCheckout` | "Till kassan" | `begin_checkout` |
| `Purchase` | `/tack` **+** Wix `order_created`-webhook | `purchase` |

**`AddPaymentInfo` saknas avsiktligt:** Klarna-steget körs inne i den
Wix-hostade kassan (`checkout.fyndplats.se`), som inte är denna kodbas. Det går
inte att instrumentera därifrån. Vill man ha eventet får det läggas via Wix egen
Pixel-/Custom-code-integration i kassan.

### Samtycke (GDPR)
Pixeln + CAPI fyrar **bara** när `localStorage.fp_cookie_consent === "all"`
(`lib/consent.ts`). Detta är striktare än GA4 (som körs ogated) — medvetet, då
annons-pixeln matchar besökaren mot ett Facebook-konto. `CookieConsent`
dispatchar `fp-consent-change` så Pixeln startar direkt vid "Godkänn alla", utan
sidladdning. Vill du köra ogated som GA4: ta bort `hasMarketingConsent()`-grinden
i `lib/meta.ts` + `lib/use-marketing-consent.ts` (hooken som `metapixel.tsx`
använder sedan 2026-08-19, när Google-modulen behövde samma lyssnare).

Samma val speglas dessutom i en **cookie** med samma namn. Skälet är att
`/tack` måste veta valet *server-side*: Google Customer Reviews-modulen
(`components/google-customer-reviews-optin.tsx`) får kundens e-postadress som
prop, och en prop till en klientkomponent hamnar i sidans RSC-payload oavsett
vad komponenten renderar. Utan cookien låg adressen alltså i HTML:en även för
den som valt "bara nödvändiga". `CookieConsent` speglar om cookien vid **varje**
besök — annars hade ingen som samtyckt före den deployen fått någon, och Safari
kapar `document.cookie`-satta cookies till 7 dagar.

### Google Customer Reviews (`GOOGLE_MERCHANT_ID`)

Opt-in-modulen på `/tack` (`lib/gcr.ts` + `components/google-customer-reviews-optin.tsx`)
visar Googles egen enkät-dialog efter köp. Den är gatad på samma marknadssamtycke
som Meta Pixel, både server-side (cookien) och i komponenten.

`GOOGLE_MERCHANT_ID` överstyr Merchant Center-ID:t; utan env används
`MERCHANT_ID_DEFAULT` i `lib/gcr.ts`. **Sätt env om kontot roteras** — Google
avvisar ett felaktigt ID *tyst*, så symptomet blir "modulen fungerar inte".

Övriga tysta felkällor att känna till vid felsökning: saknad e-post eller
leveransland i Wix-ordern, och att modulen bara visas de första `FRESH_HOURS`
(48 h) efter köpet. Alla vägar loggar med prefixen `[tack]` och `[gcr]`.

Tröskeln för att "Butikens betyg" ska synas i annonser är ~100 **färdiga**
recensioner per land på 12 månader — inte 100 opt-ins.

### Så här aktiverar du den (Leonard) — steg för steg
1. **Skapa Pixel/Dataset** i Meta Events Manager:
   <https://business.facebook.com/events_manager2/> → *Connect data sources* →
   *Web* → skapa en Pixel. Kopiera **Pixel-ID:t** (numerisk sträng).
2. **Generera CAPI-token**: i Events Manager → din Pixel → **Settings** →
   *Conversions API* → **Generate access token**. Kopiera token (visas en gång).
3. **Lägg in i Vercel** → projektet `fyndplats-headless` →
   *Settings → Environment Variables* (alla tre Environments: Production,
   Preview, Development):
   - `META_PIXEL_ID` = ditt Pixel-ID
   - `META_CAPI_ACCESS_TOKEN` = din CAPI-token
   - `META_TEST_EVENT_CODE` = (valfri) koden från Events Manager → *Test Events*
     — attacheras bara när `VERCEL_ENV !== "production"` (preview-deploys + lokalt).
   Redeploy:a efter att värdena sparats (env-ändringar slår igenom först vid ny
   deploy). Tills variablerna är ifyllda renderar Pixeln inget och CAPI svarar
   `{ skipped: "not_configured" }` — sajten fungerar oförändrat.
4. **Test Events**: Events Manager → din Pixel → **Test Events**. Sätt
   `META_TEST_EVENT_CODE` (+ Pixel-ID + CAPI-token) i **Preview** och surfa på en
   preview-deploy — events dyker upp i panelen i realtid (gaten är `VERCEL_ENV`,
   så preview funkar men prod rör aldrig test-koden). Verifiera att Pixel- och
   CAPI-raden för samma sidladdning **deduplicerar** (visas som *ett* event med
   "Deduplicated"). Se den detaljerade testplanen nedan.
5. Health-check när som helst: `GET https://www.fyndplats.se/api/meta/capi`
   → `{ "configured": true }` när env är satt.

### Testplan: verifiera Purchase-dedup (kör detta när Pixel-ID fylls i)

Purchase fyras från **två** håll med samma `event_id` (`purchase_<order-GUID>`):
klienten på `/tack` (Pixel + CAPI) och webhooken vid `order_created` (CAPI). De
ska deduplicera till **ETT** event i Meta. Det vilar på att båda använder Wix
order-**GUID** (`order._id`) — webhooken tar `_id` först, och klienten fyrar
*bara* om `/tack`-redirectens id är ett GUID (annars hoppar den över och låter
webhooken vara enda källan; den loggar `[meta] Klient-Purchase hoppades över …`).

Gör så här innan du går till produktion:

1. Fyll i `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` på **Preview** (och valfritt
   Production senare). Sätt även `META_TEST_EVENT_CODE` (Events Manager → din
   Pixel → *Test Events* → koden visas överst) på **Preview** —
   `lib/meta-capi.ts` attacherar `test_event_code` bara när `VERCEL_ENV !==
   "production"` (dvs på preview-deploys + lokalt, ALDRIG i prod), så skarp data
   smutsas aldrig ner. (NODE_ENV duger inte — Vercel bygger preview som
   production.)
2. Redeploy:a Preview. Öppna Events Manager → din Pixel → **Test Events** och
   håll den öppen.
3. På preview-URL:en: acceptera cookies med **"Godkänn alla"** (Purchase är
   consent-gated på `fp_cookie_consent === "all"`), lägg en produkt i kundvagnen
   och slutför ett **testköp** hela vägen till `/tack`.
4. I Test Events ska du se **ett** `Purchase`-event märkt **"Deduplicated"** —
   det betyder att klientens Pixel/CAPI och webhookens CAPI slogs ihop på samma
   `event_id`. Ser du **två** separata Purchase → dedup brister.
5. Om dedup brister, kolla loggarna (Vercel → Preview-deployen → *Functions*):
   - `/tack` (browser-konsol): `[meta] Klient-Purchase hoppades över: orderId=… `
     → `/tack`-redirecten gav inget GUID. Kolla vilken query-param Wix faktiskt
     skickar (DevTools → Network → redirecten till `/tack`) och utöka
     `params.get(...)`-listan i `components/thankyou.tsx` så GUID:t plockas upp.
   - `[wix-webhook] Meta Purchase event_id=purchase_… (guid=…)` → bekräftar vilket
     id webhooken använde. `guid=false` = ordern saknade `_id` (ska inte hända)
     → matchar inte klienten.
   Jämför de två event_id:na: de **måste** vara identiska (`purchase_<samma-GUID>`).
6. Verifiera att webhook-Purchase fungerar **utan** `/tack` (iOS/adblock-fallet):
   gör ett köp, blockera/stäng fliken före `/tack` laddar — Test Events ska ändå
   visa ett `Purchase` (bara CAPI-raden, från webhooken).
7. När allt deduplicerar korrekt: lägg `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`
   på **Production**, men sätt **INTE** `META_TEST_EVENT_CODE` där. Redeploy.

# Package manager

This repo has **both** `pnpm-lock.yaml` (v9) and `package-lock.json` committed.
The canonical manager is **pnpm** (Vercel detects `pnpm-lock.yaml` first, and
local `node_modules` carries pnpm's `.modules.yaml`). When adding deps: run
`pnpm add <pkg>`, then `npm install --package-lock-only` to keep
`package-lock.json` in sync. Don't `npm install` packages directly — it leaves
`pnpm-lock.yaml` stale and the dep won't install on deploy.

## Butikens tabeller bor i Wix CMS (flyttade 2026-10-29, Postgres borta 2026-11-05)

Leonard köpte Wix Elite 2026-10-28 (10 miljoner rader) och bad om att allt i
Neon flyttar tillbaka till Wix. Butiken hade en **egen** Neon-databas, så
den flyttade för sig: motorns flytt står i motorns
`docs/claude/40-flytten-tillbaka-till-wix.md` (grenen `main`).

Femton tabeller: kundvagnarna och deras mejl, använda adresser, spårningen
(`tracking_mapping`), sms-loggarna, leveransnotiserna, webhook-mejlen,
nyhetsbrevet, orderspegeln, Trustpilot-inbjudningarna, prishistoriken,
orderbekräftelserna, ångerärendena och fraktmejlskön.

`lib/wix-lager.ts` är Wix-lagret: klienten och en del per tabell med samma
läsningar och skrivningar som SQL-satserna hade. Rubrikerna i filen bär
Postgres-tabellens namn, och loggraderna använder dem fortfarande.

**Flytten 2026-10-29** (motorns workflow, läget `butik`). Växeln var en rad i
Wix (`FyndplatsButikInstallningar/datalager`), så omslaget krävde inget bygge:

| steg | när (UTC) | utfall |
|---|---|---|
| kopiera | 03:05–03:21 | 181 174 rader i 15 tabeller, varav prishistoriken 180 309, noll fel |
| verifiera | 03:24–03:32 | alla 15 tabeller lika rad för rad, inget extra i Wix |
| index | 03:24 | 18 egna index på 10 kollektioner, alla ACTIVE |
| växeln till `wix` | 03:33:27 | raden läst tillbaka |
| `delta` två gånger | 03:36–03:45, 03:55–04:03 | alla tabeller lika, ingenting att skriva eller ta bort |
| driften | 03:37–04:01 | ett GLS-paket spårades ur Wix, ordersynken hittade 54 av 54 ordrar, inga körfel |

**Steg 6, 2026-11-05.** Neon låg kvar en vecka som reserv (Leonards ja
2026-10-29). Sista `delta` kördes med `vaxling` 2026-10-29T03:33:27Z och
`kopierad_sedan` 2026-10-29T03:05:38Z. Utfall 09:32–09:37 UTC: alla 15
tabeller 0 saknas, 0 olika, 0 skrivna. Ingen instans skrev alltså till Neon
efter växlingen. Det som skilde var driften i Wix: 56 spårningsrader ändrade
efter växlingen, nya rader i nio tabeller och 17 262 prisrader som
gallringen tagit bort.

☠️ **SMS-rutten hade en Postgres-väg kvar efter växlingen.**
`updateMappingStatus` i `app/api/sms-inbound/route.ts` frågade aldrig
växeln: flytten (#793) gjorde om läsningarna och loggarna i filen men
missade statusskrivningen. Grinden såg det inte, för den krävde bara att
FILEN frågade växeln någonstans. Vägen hann aldrig användas: senaste SMS:et i
`FyndplatsSmsLogg` kom 2026-06-27, och deltan skrev ingenting. Med Neon
uppsagt hade nästa SMS-status försvunnit utan ett fel.

Borttaget samma dag:

- växeln (`datalager`, `anvanderWix`) och varje `sql`-gren i 22 filer.
  Raden `FyndplatsButikInstallningar/datalager` står kvar i Wix men läses
  inte längre;
- `lib/db.ts`, `migrations/` och beroendet `@vercel/postgres` (med
  `@neondatabase/serverless`, `pg-*` och `ws`);
- kopian: `/api/admin/neon-till-wix`, `lib/neon-till-wix.ts`, `TABELLER` och
  varje `franPostgres`;
- migreringarna: jobbet `migrate` i `/api/admin/run-job`, `?action=migrate`
  i de två dev-rutterna och `runMigration()` före prisögonblicksbilden.

När både den här ändringen och motorns är ute kan Neon sägas upp. I butikens
Vercel-projekt kan då `POSTGRES_URL` och det Neon-integrationen lade in med
den (`POSTGRES_*`, `PG*`, `DATABASE_URL*`, `NEON_*`) tas bort.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Ett `_id` i Wix är högst 128 tecken, ASCII och skiljetecken**
   (uppmätt 2026-10-29, `WDE0075`). E-post, händelsenycklar och
   spårningsnummer går genom `wixNyckel`, som hashar det som inte får plats.
   De kopierade raderna fick samma id som lagret skriver.
2. ☠️ **`$exists: false` matchar inte null** (uppmätt samma dag). Inget fält
   skrivs som null (`utanTomma`), och "släpp" i fraktmejlskön är
   `REMOVE_FIELD`. En väntande rad med `sentAt: null` hade aldrig gått att ta.
3. ☠️ **Anspråken är inserts som vägrar ett id som finns** (WDE0074), som
   Postgres `ON CONFLICT DO NOTHING RETURNING`. Efter ett nätverksfel avgör
   radens token vem som äger raden.
4. ☠️ **Fraktmejlskön tas under ett lås per order** (`taLas`). Postgres tog
   alla orderns nummer i en sats; utan låset hade två samtidiga webhooks kunnat
   ta ett nummer var, och kunden fått två mejl. Ett lås äldre än en minut tas
   över, villkorat.
5. **Spårningen bär numret i versaler** (`trackingNumberUpper`), för
   GLS-källan jämför skiftlägesokänsligt (`UPPER(tracking_number)`).
6. **Leveranssvepet räknas i `svepKandidater`** (`lib/delivery-status.ts`,
   ren och testad), med samma regler som SQL-frågan hade.

`lib/wix-lager-grind.test.ts` fäller på varje spår av Postgres i `app/`,
`lib/` och `components/`: en import av `@vercel/postgres` eller `lib/db`, en
`sql`-tagg, `sql.query` och `anvanderWix(`. Den fäller också om `lib/db.ts`
eller beroendet kommer tillbaka. Neon sägs upp, så en Postgres-väg som kommer
tillbaka skriver mot en databas som inte finns.

⚠️ **Spårningen rör Leonards regel om "Ditt paket är framme".** Ingen logik
ändrades 2026-11-05, men SMS-vägens statusskrivning hamnar i Wix igen, som
före växlingen: ett paket som SMS:et sagt är framme lämnar AliExpress-pollens
och FIFO-gissningens urval.

## Trustpilot: bara gratisdelen är på (2026-10-22)

Leonard ville ha Trustpilot på omdömessidan. Kontot är på gratisplanen, och
Trustpilots villkor tillåter att omdömena visas bara med deras egna widgetar.
Widgetarna som visar betyget kräver Starter (från 899 kr i månaden) och de som
visar omdömena Premium (från 4 999 kr). Gratis är:

- en länk till profilen på `/omdomen`,
- Trustpilots knapp för att lämna ett omdöme (Review Collector) på samma sida,
- profilen i organisationens `sameAs` (`app/layout.tsx`).

ID:t och adresserna bor i `lib/trustpilot-profil.ts`. Fyra egenskaper som inte
ska tas bort:

1. ☠️ **Gratisdelen läser aldrig `TRUSTPILOT_BUSINESS_UNIT_ID`.** Variabeln döljer
   våra egna omdömen på produktsidorna och korten (`ownReviewsHidden`) och slår
   på widgetar som gratiskontot inte får visa. Mätt mot Trustpilots widgetserver:
   knappen svarar 200, sidfotens Mini 400.
2. ☠️ **Knappen visas bara med samtycke till alla cookies**, som Klarnas och
   Googles moduler. Utan samtycke är den en vanlig länk, och ingenting hämtas
   från Trustpilot. Sekretesspolicyn säger samma sak.
3. ☠️ **`components/trustpilot.tsx` exporterar bara komponenten.** En
   serverkomponent som läser en konstant ur en klientmodul får en
   klientreferens i stället för värdet. Sidfoten läste mall-ID:t så och hade
   fått fel ID så snart variabeln satts.
4. **Knappens yta är 52 px hög** även som länk, så att sidan inte hoppar när
   widgeten laddas. Där rutan får mindre än 310 px bryter Trustpilot texten på
   två rader, och då är den 72 px (`components/trustpilot-insamling.tsx`).

Testerna står i `lib/trustpilot-profil.test.ts`. Vad som måste göras innan en
betald widget slås på står i `docs/trustpilot-setup.md`.

## Fyndauktionen läses och avslutas via motorn (2026-09-29)

Wix CMS hade ett globalt tak på 4 000 rader, och auktionskön (`FyndplatsAuctions`)
var 3 561 av dem. Raderna bodde i motorns Postgres 2026-09-30 till 2026-10-29
och bor i Wix igen sedan Elite; motorns `AUCTIONS_BACKEND` togs bort
2026-11-05. Butiken läser ändå inte Wix Data för auktionerna, för motorn äger
prisstegen, återställningen och avslutet:

- `/fyndauktion` och startsidans banner läser `GET /api/auctions/rader` hos motorn.
- Webhookens direktavslut (`order_created`) postar till `POST /api/auctions/avsluta`.
  Motorn återställer priset först och sparar sedan sold.

Båda går genom `lib/auction-motor.ts`, med `REVIEW_INGEST_SECRET` som
hemlighet (samma värde i båda projekten).

☠️ **Läs aldrig auktionerna ur Wix Data direkt.** Under Postgres-månaden var
kollektionen tom, och en läsning därifrån gav en tom `/fyndauktion` utan ett
enda fel. Lagret kan byta igen utan att butiken märker det, så länge vägen går
via motorn.
`lib/auction-store-access.test.ts` fäller om en fil nämner kollektionen
tillsammans med ett Wix Data-anrop.

## Fyndauktionen: nya timmens pris inom en halv minut (2026-10-21)

Leonards rapport: vid timslaget, och ibland vid första besöket, stod korten på
"Priset uppdateras…" länge. Uppmätt 2026-10-20: motorns timcron har satt de nya
priserna i Wix och ropar på `/api/admin/uppdatera-produkter` (orsak `auktion`)
kl HH:00:25–00:27. Butiken tömde då bara produktsidorna. `/fyndauktion` väntade
i två cachar, sidan (30 s) och dess hämtning av raderna (15 s). Båda serverar
det gamla en gång till innan de byggs om, så med klientens försök efter 5, 20,
50, 95 och 155 s kom det nya priset först efter ~2,5 minuter.

Nu:

1. Med orsaken `auktion` tömmer rutten auktionssidan och dess egen hämtning
   (`AUKTIONSSIDANS_TAGG`, `{ expire: 0 }`), och nästa hämtning bygger om med de
   nya priserna.
2. ☠️ **Auktionssidan har en egen nyckel för raderna** (`&sida=fyndauktion` i
   adressen, som motorn inte läser). Taggarna ingår inte i cachens nyckel, så
   utan egen adress delar sidan post med startsidan. Att tömma `auctions` varje
   timme hade tömt startsidan också, och nästa besökare där hade fått vänta på
   en hel ombyggnad. Webhooken tömmer `auctions` vid en försäljning, som förut.
3. Klienten frågar efter 5, 15, 30, 50 och 75 s (`REFRESH_BACKOFF_MS`), och ett
   test låser att ett försök kommer strax efter HH:00:25.

⚠️ Kvar och omätt: Wix läsning kan släpa efter en skrivning. Byggs sidan om
med ett gammalt pris visar den det högre priset med nedräkning. Nya besökare
får rätt pris inom 30 s, men en öppen flik frågar först efter fem minuter.

## Fyndauktionen: en klocka för hela sidan (Black Week, 2026-11-04)

Med 50 och 100 fynd om dagen (Black Week 23–29/11) fick `/fyndauktion` en timer per kort:
mätt lokalt med 100 kort var det 52 timers i sekundtakt och 50 i 20-sekunderstakt. Nu delar
alla kort `lib/delad-klocka.ts` via `useClientNow` (`useSyncExternalStore`). Samma mätning
gav en timer per takt och en omritning i sekunden.

- ☠️ **Tiden är gemensam för alla takter.** Ett kort byter takt vid fasbytet (1 s → 20 s).
  Med en egen tid per takt kunde den nya takten ligga efter, kortet såg den gamla fasen och
  pendlade.
- Klockan stannar aldrig medan fliken syns, och vid återkomst läses tiden om direkt.
- Utan lyssnare är tiden `null`, så ett kort som monteras senare börjar med serverns tid.
- Kort, luntan och "Sista timmen" får ingen egen `setInterval`
  (`lib/delad-klocka.test.ts`).

## Fyndauktionen: texten nämner det antal fynd som visas (Leonard 2026-11-21)

Sidans beskrivning (den Google visar under länken) sa "Fem fynd varje dag" medan sidan hade
tio, och motorn kör 50 om dagen och 100 på fredagen under Black Week. Blogginlägget
`content/blog/fyndauktionen-sa-funkar-det.md` sa "fem" på sju ställen. Leonard: "gör så det
matchar antalet som erbjuds hela tiden".

- ☠️ **Ett antal fynd skrivs aldrig in i en text.** Antalet bestämmer motorn
  (`lib/auction/antal.ts` på `main`), 30-dagarsspärren kan ge färre, och under dagen säljs
  fynd bort. `fyndlage` (`lib/auction-day.ts`) räknar samma rader som korten ritas av, med
  samma fasmaskin: `pagar` (går att köpa nu), `fore` (nästa omgång ligger ute med
  nedräkning) eller `tomt` (inga fynd, eller dagen är slut och korten säger "Stängt").
- **Beskrivningen** byggs i `generateMetadata` av `auktionsbeskrivning`
  (`lib/auction-beskrivning.ts`): "10 fynd just nu – nya varje dag kl 07–19. …",
  "50 fynd startar kl 07 – …", och utan antal när inget erbjuds.
- ☠️ **Talet står aldrig ihop med "varje dag", och texten säger aldrig "i morgon".** Google
  sparar sin kopia och visar den i dagar. "Just nu" och "startar kl 07" tål det. Av samma
  skäl har delningstexten (Open Graph) inget antal: chattappar sparar den i veckor.
- ☠️ **`visadeFynd` (React `cache`) delar hämtningen mellan beskrivningen och sidan.** Utan
  den frågas Wix två gånger per fynd vid varje ombyggnad (`getFreshPrices` ställer en fråga
  per fynd). Mätt i ett lokalt bygge mot en låtsasmotor: nio fynd gav nio prisfrågor per
  ombyggnad, och 10, 50, 100, 7 och 0 fynd gav rätt text.
- Blogginlägget nämner inget antal, och meningen om "över 60 % under ordinarie pris" är
  borta: motorn sänker högst 15 % (`MAX_DISCOUNT`).
- `lib/auction-beskrivning.test.ts` låser talet i varje läge, längden (högst 155 tecken,
  också med tre siffror) och att inget fast antal står i sidan, korten eller blogginlägget.
  Elva inlagda fel fälldes alla.

## Googles ?srsltid= tas bort ur adressfältet (2026-09-30)

Merchant Centers automatiska taggning lägger `?srsltid=…` på varje länk från
Googles sökresultat. Leonard ville ha bort den ("det ser fult ut"), utan att
något annat påverkas. `components/rensa-srsltid.tsx` tar bort den ur
adressfältet, logiken bor i `lib/srsltid.ts` och är testad där.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Koden står kvar tills Googles tagg är klar med den.** Städningen väntar
   på att gtag.js laddats (den hämtas när besökaren rör sidan, se GA4) OCH att besökaren valt
   i cookiebannern, och sedan tre sekunder till. Uppmätt mot den skarpa sidan:
   när besökaren klickar "Godkänn alla" skickar Ads-taggen sin
   `consent_update` med koden i adressen. Städas den före valet går den
   kopplingen förlorad. Väljer besökaren aldrig står koden kvar, som förut.
2. ☠️ **`History.prototype.replaceState`, inte `window.history.replaceState`.**
   Både Next och Googles tagg lägger sig runt metoden på `window.history`.
   Uppmätt: via `window.history` skickade Ads-taggen två extra `page_view`
   för varje städning, via prototypen ingen. Next:s `state` följer med, så
   bakåtknappen fungerar (provat: nästa produkt och tillbaka gav rätt sida med
   ren adress).
3. **Next vet inte om bytet**, så en `router.refresh()` (auktionsklockan) skriver
   tillbaka den gamla adressen. Loopen tar då bort koden igen inom en sekund.
4. **Andra parametrar lämnas tecken för tecken** (`?variant=` och filtren).
   Strängen delas för hand, eftersom `URLSearchParams` kodar om `,` och `+`.

Sidans canonical pekar redan på den rena adressen, så för Google är inget nytt.

## Prisjakt-flödet, och varför flödena måste vara under 10 MB (2026-10-19)

`https://www.fyndplats.se/feed/prisjakt.xml` läggs in i Prisjakts Business
Center (Feedhantering → Lägg till feed, typ Produktfeed, format Prisjakt XML).
Flödet byggs ur Google-flödet som PriceRunner-flödet, och skillnaderna ligger i
`lib/feed/prisjakt.ts`, skrivna mot Prisjakts spec (developer.prisjakt.nu, läst
2026-10-13):

- Bara varor i lager, och `g:price` är priset kunden betalar.
- Varje rad bär `g:shipping` med kassans fraktregel och alla fyra tiderna:
  hantering 1–2 och transport 2–4 arbetsdagar, alltså sajtens 3–6
  (`prisjaktTider`). ☠️ Saknas en av de fyra stryker Prisjakt alla. Med tiderna
  i flödet behövs inga leveranstjänster i Business Center.
- Googles kampanjetiketter, `g:identifier_exists`, `g:size` (som kräver
  `g:size_system`) och extrabilderna tas bort. Ingen mpn i det öppna flödet, och
  GTIN bara på varorna i kartan nedan (CDON-listan och dealproffsens). Märke och
  artikelnummer finns bara på den hemliga adressen (se nästa avsnitt).
- `g:color` har högst tre färger, skilda med `/` (`begransaFarger`). Fyra varor
  hade fler och fick varningen "Ogiltlig" i Business Center (2026-10-28).
- **Testet med koder (2026-10-23).** 902 varor får en `g:gtin` ur
  `lib/feed/prisjakt-gtin.ts` (variantens id → EAN-13), bara i Prisjakt-flödet:
  `PRISJAKT_GTIN_URVAL` (50 varor, genomgångna för hand en och en) och
  `PRISJAKT_GTIN_UTOKNING` (853, samma maskinella kontroller men en snabbare
  genomläsning). Prisjakt matchar annars inget av våra erbjudanden mot en
  produktsida. Koderna är dealproffsens, parade på leverantörens artikelnummer
  och lästa live på deras sidor: kontrollsiffran stämmer, men de är en annan
  säljares och går inte att stämma av mot GS1. Bara varor med EN variant och bara
  de vars sida har en EAN ingår, så varor med flera färger och nyare artiklar
  saknar kod. `tillPrisjakt` använder en kod bara när den är giltig, inte står på
  två varor och produkten har exakt en variant i Google-flödet (slutsålda
  medräknade). Rutten loggar `[prisjakt] g:gtin på X av 902 varor i kartan`, och
  färre betyder slutsålda varor eller varor som fått en andra variant. Utvärdera
  i Business Center (kopplas erbjudandet till rätt produktsida?) och ta bort
  felkopplade varor ur kartan. Uppmätt 2026-10-28: 9 matchade erbjudanden, alla
  med `g:gtin`, och ett av dem fel. Kontorsstolen `3921d391-…` låg på Prisjakts
  sida för en sammetsstol av ett annat märke och är borttagen ur kartan. Backa genom att tömma `PRISJAKT_GTIN_UTOKNING` till
  `{}` (tillbaka till de 50), eller båda: flödet blir då byte för byte som förut.
  Artikelnummer, inköpspriser och adresser får aldrig stå i kartan (repot är
  publikt); `prisjakt-gtin.test.ts` vaktar formen på varje rad.
- **CDON-listans koder (2026-11-15, Leonards "kör dina förslag noggrant").**
  `lib/feed/gtin-cdon.ts` har 3 476 varianter (variant-id → GTIN-13), genererad
  ur Leonards konfidentiella lista från 2026-11-14. Listan ligger aldrig i repot.
  - Med är Aosoms egen CDON-butik (2 877) och VEVOR-varor hos Bonideco (599, UPC-12
    skrivna som GTIN-13 med en inledande nolla). Varje rad är parad på
    leverantörens artikelnummer, med "Ja: samma nr" och statusen "Hittad".
  - Utanför är Bancros (53 företagsprefix, ser köpta ut), Kaufland, "Osäker" och
    kontorsstolen.
  - `lib/feed/gtin.ts` (`byggFlodeGtin`) slår ihop källorna, och
    `lib/feed/flode-gtin.ts` är kartan som byggarna använder:
    `pricerunnerXml` (`lib/feed/harledda.ts`), `prisjaktHemligXml`
    (`lib/feed/prisjakt-hemlig.ts`) och det öppna Prisjakt-flödets rutt.
    - Listans kod vinner för samma variant. 492 av de 534 varianter som båda
      källorna har skilde sig.
    - Dealproffsens kod står kvar där listan saknar varianten (368).
    - En dealproffsen-kod som listan har på en annan variant tas bort.
  - `gtinUrval` (prisjakt.ts) väljer koderna per vara. En CDON-kod hör till sin
    variant och gäller också produkter med flera varianter. För dealproffsens
    gäller regeln om exakt en variant.
  - Samma urval går till Prisjakt (öppet och hemligt flöde) och till PriceRunner.
    Där ersätter `g:gtin` raden `g:identifier_exists=no`.
  - Mätt på produktionens Google-flöde 2026-11-15: 3 776 varor i lager med
    `g:gtin` i båda flödena, förut 834 i Prisjakt och 0 i PriceRunner.
  - ☠️ **Aldrig i Google-flödet.** Aosom levererar white label, och Google stämmer
    av GTIN mot märket (Fyndplats). `gtin.test.ts` fäller om
    `app/feed/google.xml` läser en GTIN-karta.
  - Följ upp i Business Center, och ta bort koder som kopplas till fel
    produktsida, som kontorsstolen.

☠️ **Vercels CDN cachar inga icke-strömmade svar över 10 MB.** Dokumentationen
säger 10 MB för icke-strömmade svar och 20 MB för strömmade
(vercel.com/docs/caching/cdn-cache, "Cacheable response criteria"). Uppmätt på
förhandsbygget 2026-10-19: Prisjakt-flödet på 15,4 MB gav MISS tre gånger i rad
och byggdes om varje gång (35–105 s), bildsitemapen på 7,6 MB gav HIT andra
gången. Prisjakt-flödet körs därför vid anrop och hålls litet: en vara per rad
utan indrag (−1,4 MB) och inga extrabilder (−5 MB) gav 9,30 MB med 6 818 varor
(2026-10-28). **Sedan 2026-10-28 strömmas båda Prisjakt-rutternas svar**
(`lib/feed/prisjakt-svar.ts`, bitar om 64 kB utan Content-Length), så gränsen är
20 MB. Över 19 MB loggar rutterna en varning.

## Flödena och sitemapen hålls färska, och Semrush-rättelserna (Leonard 2026-11-11)

Leonard bad om att Semrush Site Audit skulle rättas (68 fel, 11 754 varningar)
och att auditens punkter utan beslut skulle göras. Det här avsnittet säger vad
som gjordes i koden och vad som med flit inte gjordes.

☠️ **Katalogen i minnet lever så länge instansen lever.** `getProducts()` hämtar
katalogen en gång per instans, och en instans med jämn trafik lever i många
timmar. Sitemapen byggdes om varje timme men ur samma lista: 2026-11-10 saknade
den dagens 15 nya varor och bar en adress som bytts ett dygn tidigare.
`getProductsFarska()` (`lib/products.ts`, regeln i `lib/katalog-alder.ts`)
hämtar om katalogen när den är äldre än en timme och behåller den gamla om den
nya inte är hel. Den **väntar** på hämtningen (10–25 s) och används därför bara
där ingen kund väntar: `getSiteUrls()` (sitemapen, IndexNow, SEO-kollen),
flödena, `/api/search-index` och `/api/cron/warm-and-ping`. Aldrig på en sidas
väg; `lib/katalog-alder.test.ts` listar de fyra filerna som får anropa den.

☠️ **Route-ISR bygger aldrig om ett stort flöde.** `/feed/google.xml` (18,9 MB),
`/feed/pricerunner.xml` (18,4 MB) och `/feed/products.xml` (10,3 MB) hade
`revalidate = 3600` och byggdes bara vid deployen: ett dygn efter bygget hade
151 varor gårdagens pris, och tre hämtningar efter att kopian gått ut gav alla
samma gamla fil. De körs nu vid anrop (`force-dynamic`, `maxDuration` 300).

☠️ **CDN:en behåller inget svar över 10 MB, inte heller ett strömmat.** Mätt i
produktion 2026-11-11: `/feed/prisjakt.xml` (11,4 MB, strömmat sedan
2026-10-28) gav MISS tre gånger i rad och byggdes om på 48–70 s varje gång,
medan bildsitemapen gav MISS och sedan HIT. Dokumentationens 20 MB för
strömmade svar håller alltså inte. De tre flödena skickas därför
gzip-komprimerade: 19,1 MB blir 2,5 MB, och det ryms.

☠️ **CDN:en håller en kopia per Accept-Encoding-sträng.** Mätt på förhandsbygget
samma natt med `Vary: Accept-Encoding`: "gzip" gav MISS och sedan HIT, men
"gzip, deflate, br", "gzip, deflate" och "br, gzip" gav alla MISS. Varje läsare
hade fått sin egen kopia, och den vi värmer hade inte hjälpt Google. Därför har
varje flöde två adresser (`lib/feed/prisjakt-svar.ts`):

- **`/feed/<fil>`** är adressen läsarna har. `next.config.ts` skriver om den
  till `/feed/gz/<fil>` för den som tar emot gzip (`beforeFiles`, före CDN:en).
  Den som inte gör det får XML:en okomprimerad och strömmad som förut; det
  svaret behålls inte av CDN:en och byggs vid varje hämtning.
- **`/feed/gz/<fil>`** (`app/feed/gz/[fil]/route.ts`) svarar alltid med gzip
  och **utan `Vary`**. Det är den enda kopian i CDN:en, lika för alla. Lägg
  aldrig `Vary: Accept-Encoding` där: då är uppdelningen tillbaka.

Listan över flöden står på tre ställen (omskrivningen, rutten och jobbet), och
`lib/feed/prisjakt-svar.test.ts` fäller om de går isär. Över 8 MB komprimerat
loggas en varning; dit är det ungefär tre gånger dagens katalog.

☠️ **`stale-while-revalidate` är två timmar, inte ett dygn** (`FLODE_CACHE`).
CDN:en ger det gamla svaret medan nästa byggs, och med ett dygn fick den som
hämtar en gång om dygnet (Google Merchant Center) alltid förra dygnets fil.
Nu är ett svar aldrig äldre än tre timmar: ett äldre är borta, och hämtningen
bygger ett nytt (10–75 s uppmätt, långsamt men rätt).
**`/api/cron/farska-floden`** (varannan timme, `lib/flodesvarmning.ts`) hämtar
sitemapen och de tre flödena en gång, så att det ska hända sällan. Prisjakts
hemliga adress står inte i listan och får aldrig göra det.
☠️ Mätt 2026-11-15: det räcker inte för ett flöde som hämtas en gång om
dygnet. CDN:en hade tappat kopian före varje körning (MISS fyra gånger av
fyra på Pinterest-, Google- och PriceRunner-flödet). De flödena och det
hemliga Prisjakt-flödet sparas därför i Runtime Cache, och alla flödesrutter
har en HEAD som inte bygger (se "Flödena svarar direkt").

☠️ **Ett flöde utan en enda vara skickas aldrig** (`arTomtFlode`). Det betyder
att katalogen eller varianterna inte gick att läsa, och den som läser in ett
tomt flöde tar bort varenda vara hos sig. Läsaren får 503 med `no-store` och
behåller sin förra inläsning, CDN:en behåller sin förra kopia, och felet står
i loggen som `[flode] … byggdes utan en enda vara`. Sedan flödena byggs vid
anrop kan det hända vilken timme som helst, inte bara vid deployen.

**Det öppna Prisjakt-flödet är orört** (utom HEAD): det strömmas och byggs om
vid varje hämtning. **Det hemliga sparas sedan 2026-11-15** som de andra, och
jobbet bygger det utan att känna till adressen (se "Flödena svarar direkt").

**Länkarna i produkttexterna.** Poleringen skriver länkar i Wix adressform,
`/product-page/<slug>`, som butiken omdirigerar med 308. Semrush räknade 600
sådana länkar. `rattaProduktlankar` (`lib/interna-lankar.ts`) skriver om dem
till `/produkt/<slug>` där texten läses ur Wix (`produktGrund`). De gamla
Wix-produkterna i `data/legacy-wix-redirects.json` lämnas, eftersom deras
`/produkt/`-adress är en 404. Länkar till en sida som senare slagits ihop med
en annan (`/produkt/<gammal slug>`, ett femtiotal) rättas inte här: de kräver
ett uppslag i omdirigeringstabellen per sida och hör hemma i poleringen.

**`/llms.txt`** (`lib/llms-txt.ts`): en kort karta över butiken för
språkmodeller, byggd ur menyn, köpguiderna och samma villkorskonstanter som
sidorna använder. Inga priser på varor och inga löften utöver konstanterna.

**Tillgänglighet (mätt med axe 2026-11-11).** Sidfotens Google-betyg och
startsidans kategorirutor har inget `aria-label` längre: det upplästa namnet
ska innehålla texten som syns (WCAG 2.5.3), och det gjorde det inte. Namnet
kommer nu ur innehållet, med dolda ord (`.sr-only`) där det behövs.
Kategorisidans länkar till köpguiderna står i `--brand` (5,2:1, förut 2,7:1),
bläddringsradens etiketter har ingen genomskinlighet (5,9:1, förut 3,5:1), och
toppremsan är ett `<aside>` med namn, så att den ligger i ett landmärke.

**Varukorgens knappar** är 44 px (plus och minus var 25 px, "Ta bort"
38 × 16 px). **En sökning utan träff** visar samma knappar och kategorirad som
404-sidan och fyra varor som säljer just nu (`lib/sok-tom.ts`).

De nya stilreglerna står sist i `app/globals.css`: reglerna de ersätter står
kvar på sin plats, eftersom en gren som väntar på deploy ändrar raderna runt dem.

**Inte gjort i koden, med flit:**

- **62 dubbla titlar och 4 dubbla metabeskrivningar.** Det är syskonprodukter
  med samma `seoTitle` ("Kontorsstol med massage och värme" på två stolar).
  Titeln är produkttext och ändras i poleringen, inte i butiken: motorns grind
  läser den publicerade `<title>`.
- **464 sidor i sitemapen utan intern länk** är slutsålda varor. De döljs ur
  listorna med flit och står kvar i sitemapen. Vad som ska hända med dem är ett
  beslut (auditens punkt om slutsålda landningar).
- **Låg andel text i HTML:en på 11 753 sidor.** En produktsida är 210 kB och
  4 % text (stickprov på 300 sidor), eftersom produkttexten och produktdatan
  står två gånger: en gång i HTML:en och en gång i React-datan till
  klientkomponenten. Det påverkar inte rankingen och går inte att rätta med en
  liten ändring.
- **En tillfällig omdirigering** från halloweenguiden till
  `/kategori/halloweendekoration`: kategorin är tom efter säsongen och kommer
  tillbaka, så 307 är rätt svar.

## Prisjakt: märke och artikelnummer på en hemlig adress (Leonard 2026-10-28)

Prisjakt matchade 9 av 6 818 erbjudanden, alla nio med `g:gtin`. Prisjakts
produktsidor för Aosom-varor heter märke plus Aosoms artikelnummer, och Business
Center ber den som har många erbjudanden att skicka EAN och tillverkarens
artikelnummer.

☠️ **Leonards beslut 2026-10-28: i Prisjakt-flödet, och bara där, är `g:brand`
varans riktiga märke (HOMCOM, Outsunny, PawHut …) och `g:mpn` Aosoms
artikelnummer.** Det är ett medvetet undantag från två husregler: att märket är
Fyndplats och att artikelnumret aldrig når kunden. Flödet med uppgifterna finns
bara på en hemlig adress. Överallt annars gäller reglerna som förut, och
Google-, PriceRunner- och det öppna Prisjakt-flödet byggs utan numren.

- **Adressen** är `/feed/prisjakt-<kod>.xml` (`app/feed/[fil]/route.ts`). Koden
  är miljövariabeln `PRISJAKT_FLODE_KOD` i Vercel, minst 32 bokstäver och
  siffror. ☠️ Koden står aldrig i repot, i en PR, i den här filen eller i en
  loggrad. Saknas variabeln, eller är koden för kort, finns ingen hemlig adress:
  varje filnamn svarar 404. Ett fel filnamn ger 404. Svaren bär `X-Robots-Tag:
  noindex`. `lib/feed/prisjakt-adress.test.ts` fäller om något som ser ut som
  adressen checkas in, och om någon annan fil än den hemliga rutten och
  `/api/cron/farska-floden` hämtar numren eller bygger flödet. Jobbet sparar
  flödet under ett namn, aldrig adressen (se "Flödena svarar direkt").
- **Numren och märkena** hämtas från motorns `/api/prisjakt-artiklar` (grenen
  main) när flödet byggs, med `REVIEW_INGEST_SECRET`. Mappningarna bor i
  motorns Wix-lager och aldrig i en fil här (repot är publikt).
  `lib/feed/prisjakt-motor.ts` hämtar dem utan cache och kastar på fel status,
  fel form eller färre än 1 000 poster. Då svarar adressen 503 och CDN:en
  serverar förra flödet (`stale-if-error`), i stället för ett flöde där numren
  saknas.
- **Per variant.** En sammanslagen sida har en artikel per färg, och motorn
  nycklar på Wix-variant-id (flödets `g:id`). En sida med en artikel där
  mappningen saknar variant-id nycklas på produkten, och den nyckeln används bara
  när produkten har exakt en variant i Google-flödet, samma regel som GTIN.
- **Märket gissas aldrig.** Motorn tar det ur adressen till Aosoms egen
  produktsida (samma härledning som GPSR-fliken): Aosom-flödet först,
  mappningens adress bara när den slutar på samma artikel, sist GPSR-datan.
  Utan säker källa står Fyndplats kvar, och ett märke skrivs bara på en vara som
  fått ett nummer.
- **Den öppna adressen `/feed/prisjakt.xml`** byggs som förut, utan märke och
  artikelnummer, men med färgtaket och utan kontorsstolens kod. ☠️ Den ska tas
  bort i deployen efter att Leonard bytt till den hemliga adressen i Business
  Center.

☠️ **Google- och PriceRunner-flödet förnyas inte, och är inte lagat.** De är
route-ISR (`revalidate = 3600`) och ~15 MB. Uppmätt 2026-10-19: `/feed/google.xml`
svarade STALE med age ~77 000 s och bar produkter som dolts kvällen innan, och
`/feed/pricerunner.xml` serverades ur bygget. `/feed/products.xml` (8 MB, samma
ISR) förnyades. Flödena är alltså så gamla som senaste produktionsbygget. Att köra
dem vid anrop hjälper inte: då byggs de om vid varje hämtning. De går inte under
10 MB utan att Google-flödet tappar extrabilderna (5,5 MB), och det är ett beslut
för Leonard.

## Pinterest: flödet och kontot (Leonard 2026-11-15)

`https://www.fyndplats.se/feed/pinterest.xml` är datakällan "Fyndplats
produktflöde" i katalogen "Fyndplats" i Pinterest Business (Kataloger →
Fyndplats → Datakälla; Sverige, svenska, SEK, hämtas var 24:e timme). Flödet
byggs ur Google-flödet i `lib/feed/pinterest.ts`, som PriceRunner- och
Prisjakt-flödena, och skickas komprimerat via `/feed/gz/pinterest.xml`. Det står
näst sist i listorna (omskrivningen, gz-rutten och `/api/cron/farska-floden`),
före GoWish-flödet (2026-11-25).

Skillnaderna mot Google-flödet, alla mätta i Pinterests "Testa din datakälla"
2026-11-15:

- **Lagerstatus med mellanslag** (`in stock`, `out of stock`). Med understreck
  gav varje vara varning 163.
- **Extrabilderna är Wix originaladress** (`.../media/<fil>`). Pinterest delar
  `g:additional_image_link` på kommatecken, och adresserna med storlek
  (`w_2000,h_2000,q_90`) föll bort (varning 137). Högst tio per vara.
- **`g:gtin`** ur `lib/feed/pinterest-gtin.ts`: 3 283 varianter, 898 VEVOR och
  2 385 Aosom. ☠️ Leonard 2026-11-15: "aosom koderna får också läggas in". Det
  gäller Pinterest. Google-flödet bär fortfarande ingen kod. Koderna kommer från
  CDON-annonser där säljarens artikelnummer är exakt vårt. 492 Aosom-varianter där
  Prisjakt-kartan har en annan kod är utelämnade tills det är utrett: oftast
  ligger koderna ett eller två steg ifrån varandra (en syskonfärg), så en av
  källorna har fel.
- `g:identifier_exists` tas bort. Fältet finns inte i Pinterests spec.

**Djupare kategorier** (Leonard 2026-11-15, varning 126 och 157). Kartan
`GOOGLE_CATEGORY_BY_SLUG` ger varje underkategori en enda nod, och där varorna
är blandade blev noden grund ("Furniture", "Toys & Games"). Pinterest varnade
för det på 7 046 varor. `lib/feed/djupare-kategori.ts` väljer en djupare nod ur
varans namn innan kartan frågas (`taxonomyFor` i Google-flödet), så rättningen
följer med till alla flöden som byggs ovanpå: PriceRunner, Prisjakt och
Pinterest. Mätt på Pinterest-flödet 2026-11-15: varor med noll till två nivåer
7 322 → 2 325 av 10 061, 5 205 varor bytte nod.

- Reglerna prövas mot namnets huvud (det före första tankstrecket), sedan mot
  hela namnet, sist mot underkategorins standardnod. Första träffen vinner, så
  ordningen i listan är en del av regeln: "hoppborg med rutschkana" är en
  hoppborg bara om hoppborgen står först.
- ☠️ Ord som ofta står i namnet på något annat är förankrade i början
  (`^(\S+ )?madrass`, `^\S*parasoll`, `TANGER`): "extrasäng med madrass",
  "matbord med parasollhål", "fåtölj med fotpall", "mätstång". Ett nytt ord:
  sök det i hela flödet först och se vad mer det träffar.
- ☠️ Standardnoden (regeln utan ord) tar allt annat i underkategorin, och i
  Wix ligger tillbehör bland huvudvarorna: skärmstöd i Skrivbord, pianopallar i
  Pallar, kattsängar i Hundbäddar. Läs vad som faller till standardnoden innan
  en ny läggs till.
- ☠️ Inga noder under Apparel & Accessories. Kläder kräver kön, ålder och
  storlek i Merchant Center, och en vara som flyttas dit utan dem avvisas.
- Ett nytt id läses ur taxonomifilen (taxonomy-with-ids.en-US.txt), inte ur
  minnet. Provet fäller samma id med två olika namn, och noder grundare än tre
  nivåer utom de få löv som saknar djupare noder.

**Kontot**, gjort i webbläsaren 2026-11-15 efter Leonards ja:

- fyndplats.se är bekräftad med en TXT-post `pinterest-site-verification=…` på
  roten i Wix DNS. ☠️ Ta inte bort den: då försvinner bekräftelsen, och med den
  katalogen.
- Säljargranskningen startade av sig själv när katalogen laddades upp.
- Inget annonskonto och ingen Pinterest-tagg. Leonard valde bort dem 2026-11-15.
- 13 produktgrupper i katalogen, en per avdelning, gjorda 2026-11-15 efter
  Leonards val. Filtret är Produkttyp, och Pinterest har bara "är" och "är
  inte", så varje grupp räknar upp sina underkategorier ("Avdelning >
  Underkategori"). ☠️ En ny underkategori i Wix hamnar inte i någon grupp förrän
  den läggs till för hand. Butik-fliken på profilen finns inte längre hos
  Pinterest, så grupperna syns inte där.

## Flödena svarar direkt: HEAD och sparade kopior (Leonard 2026-11-15)

Leonard bad om att Pinterest-flödet skulle optimeras, och sedan om Google,
PriceRunner och Prisjakt: "borde vi inte fixa dom med?". Mätt samma förmiddag:

- **En HEAD byggde hela flödet.** Pinterest gör en HEAD före inläsningen
  (09:12 UTC). CDN:ens nyckel innehåller metoden (vercel.com/docs/caching/
  cdn-cache/purge, "Cache keys"), så en HEAD läser aldrig GET:s kopia, och
  utan en egen HEAD kör Next GET. Mätt: 52 s för ett svar utan kropp, fyra
  minuter efter att GET-kopian lagts i samma region.
- **CDN:en behåller inte ett flöde som hämtas en gång om dygnet.** Varje
  körning av `/api/cron/farska-floden` 02:40–08:39 UTC fick MISS på Pinterest-,
  Google- och PriceRunner-flödet (50–78 s), fast förra körningen byggt kopian
  två timmar tidigare och den skulle ha gällt i tre. `/feed/products.xml`, som
  hämtas oftare, gav HIT och STALE. Vercel skriver att sällan hämtade svar kan
  försvinna ur regionens cache (cdn-cache, Limits). Värmningen höll alltså inte
  kopiorna vid liv.
- **Prisjakt hämtar den hemliga adressen tre gånger om dygnet** (16:20, 00:21
  och 08:21 svensk tid) och väntade på ett bygge av 13 MB varje gång.

Nu:

- ☠️ **Varje flödesrutt har en egen HEAD som aldrig bygger** (`huvudsvar` i
  `lib/feed/prisjakt-svar.ts`): de fyra under `/feed/`, `/feed/gz/[fil]`, det
  öppna Prisjakt-flödet och den hemliga adressen, där ett fel filnamn ger 404
  också på HEAD. Svaret har samma rubriker som GET och `Cache-Control:
  no-store`, och längd och tid när det finns en sparad kopia. Provet fäller en
  rutt utan HEAD och en HEAD som bygger.
- **Google-, PriceRunner-, Pinterest- och det hemliga Prisjakt-flödet sparas i
  Vercels Runtime Cache** (`lib/feed/flodeslager.ts`: `LAGRADE_FLODEN` och
  `PRISJAKT_HEMLIG_KOPIA`). Läsaren får kopian när den är yngre än tre timmar;
  den okomprimerade adressen packar upp den. Saknas kopian byggs flödet som
  förut, och det som byggdes sparas efter svaret (`lib/feed/kopiesvar.ts`).
  Anropad utan anrop bygger en rutt alltid.
- ☠️ **Jobbet bygger Google-flödet EN gång** och gör PriceRunner-, Pinterest-
  och det hemliga Prisjakt-flödet ur det, med samma byggare som rutterna
  (`lib/feed/harledda.ts`, `lib/feed/prisjakt-hemlig.ts`). Förut byggdes
  Google-flödet tre gånger per körning, en gång per flöde. Provet fäller ett
  andra bygge.
- ☠️ **Byggarna bär EAN-kartan FLODE_GTIN** (se Prisjakt-avsnittet). #919 skrevs
  mot koden före #917 och hade tappat koderna i PriceRunner- och det hemliga
  Prisjakt-flödet utan ett enda fel i tsc eller proven: kartan är valfri, och
  typen tar också dealproffsens gamla. Löst vid mergen 2026-11-16, och
  `lib/feed/flode-gtin-anvandning.test.ts` fäller nu en byggare utan kartan.
- ☠️ **Jobbet känner inte till Prisjakts hemliga adress.** Det hämtar motorns
  nummer, bygger flödet och sparar det under namnet `prisjakt-hemlig`, och bara
  rutten på adressen läser kopian. Loggen bär namnet, aldrig adressen.
  `lib/feed/prisjakt-adress.test.ts` fäller om någon annan fil än rutten och
  jobbet hämtar numren eller bygger flödet. Faller motorn gäller förra kopian.
- Den hemliga adressen svarar nu 503 också på ett flöde utan en enda vara
  (`arTomtFlode`), som de andra flödena. Förut hade ett sådant flöde gått ut.
- ☠️ **En post i Runtime Cache är högst 2 MB**, och Pinterest-flödet är 2,9 MB
  som gzip. Filen sparas i bitar om 512 kB under en egen generation och pekas
  ut sist, med längd och kontrollsumma. En kopia som inte stämmer används inte:
  lagret kan göra ett flöde snabbare, aldrig fel.
- ☠️ **Paketets `set` sväljer sina fel** (loggar och ger upp efter 500 ms).
  Varje bit läses tillbaka och skrivs om en gång innan pekaren skrivs, och
  jobbets rad säger `SPARADES INTE` när det ändå inte gick. Raden säger också
  `BARA PROCESSENS MINNE` om Runtime Cache inte nås (då hjälper kopian bara
  samma instans).
- **Nyckeln bär driftsättningen** (`VERCEL_DEPLOYMENT_ID`): efter en deploy
  finns ingen kopia förrän jobbet körts eller någon hämtat flödet, och ingen
  deploy läser en kopia som äldre kod byggde.
- **Loggen säger vem som hämtar**: `[flode] /feed/gz/pinterest.xml ur kopian,
  14 min gammal (gzip, deflate; Pinterestbot/1.0)`. Bara Accept-Encoding och
  robotens namn ur User-Agent (`lasare`). ☠️ Bara de första 512 tecknen av
  User-Agent läses: regexen tar kvadratisk tid mot längden, och en User-Agent
  på 32 kB kostade 2,3 s CPU per anrop (mätt 2026-11-15).
- Mätt på förhandsbygget (Pinterest-flödet, 2026-11-15): HEAD 0,5–0,9 s (förut
  52 s), GET ur kopian 0,9 s med gzip och 2,0 s utan (förut 50–80 s), samma
  byte. Vercel skickar `Accept-Encoding: gzip` till rutten också när läsaren
  inte skickat någon, och packar själv upp svaret åt en sådan läsare.
- Kostnad: runt 1 600 skrivenheter per körning för de fyra (en enhet är 8 kB,
  och filerna är 2–3 MB som gzip och en tredjedel större som base64), tolv
  gånger om dygnet, och lika många läsenheter för kontrollen. Ungefär tre
  dollar i månaden.

Produktflödet har bara fått HEAD: det hämtas ofta nog för att CDN:en ska
behålla det. Det öppna `/feed/prisjakt.xml` har också bara fått HEAD; det ska
bort (se Prisjakt-avsnittet) och hämtades en gång natten mot 2026-11-15.

## Strukturerad data för Google Shopping (2026-10-22)

Search Console (Säljaruppgifter) varnade på alla 657 objekt. Fyra rättningar,
låsta av `lib/produkt-jsonld.test.ts`:

- **Leveranstiden är delad** i hanteringstid (1–2 dagar) och transporttid
  (2–4 dagar). Summan är löftet på 3–6 arbetsdagar i `lib/shipping.ts`, och
  transporttiden räknas fram ur det.
- ☠️ **Kunden betalar returfrakten själv** (`ReturnFeesCustomerResponsibility`),
  som köpvillkoren säger. `ReturnShippingFees` betyder att vi tar ut en avgift,
  och då kräver Google ett belopp.
- **`validFrom`** är första dagen i månaden och `priceValidUntil` sista dagen i
  nästa (`lib/pris-giltig.ts`). Båda byts en gång i månaden, så sidan byggs inte
  om oftare än förut.
- ☠️ **Listsidorna märker inte upp produkter som varor.** Köpguiderna,
  `/under-…-kr/` och `/for-dig-som/` har en ItemList med bara länk och namn
  (`lib/seo/item-list.ts`), som kategorisidan. Med ett Product-objekt per rad
  blev varje rad ett eget objekt utan beskrivning, frakt, returvillkor och märke
  (185 objekt).

Betygen (`aggregateRating`, `review`) skickas bara för omdömen från våra egna
kunder (`lib/review-schema.ts`). Att Search Console saknar dem på nästan alla
objekt är rätt: de flesta produkter har inga egna omdömen än.

### Varje variant bär en egen beskrivning (Leonard 2026-11-20)

Leonards skärmbild ur Search Console (Säljaruppgifter): "Fältet description
saknas", 1 434 objekt, och valideringen misslyckad. "den där disciption är
det något vi kan fixa?"

Sedan 2026-10-30 är en vara med val en `ProductGroup` med en `Product` per
variant (`lib/variant-jsonld.ts`), och beskrivningen stod bara på gruppen.
Search Console räknar varje variant som ett eget objekt, och varianterna hade
ingen. Mätt på 60 produktsidor på www samma dag: 48 varor utan val, alla med
beskrivning, och 12 varor med val vars 32 varianter alla saknade den.

Varje variant får nu gruppens beskrivning med sina egna val sist: "…
Färg: Grå, Storlek: 120 cm." (`variantBeskrivning`, fjärde parametern).
Valen står sist för att texten ska vara variantens egen och inte samma
mening på varje variant. En vara utan val är oförändrad. Låst av
`lib/variant-jsonld.test.ts` och `lib/produkt-jsonld.test.ts`. På det lokala
bygget bär alla 80 objekt på samma 60 sidor varje fält rapporten nämner.

De andra raderna i samma rapport (returavgiftens belopp, `validFrom`,
returvillkor, fraktuppgifter och global identifierare, 414–416 objekt var,
"Har inte startats") **går inte att återskapa på dagens sidor**: i
stickprovet på www bar alla 80 objekt, varianterna med, varje sådant fält,
med hänvisningarna (`@id`) följda inom sidan. Exporten har inga adresser, så
vilka sidor raderna gäller är inte kontrollerat. Troligast är det objekt som
Google läste före rättningarna 2026-10-22 och inte har läst om: raden om
returavgiften var 472 objekt då och är 416 nu. Rapporten hade samma dag
3 933 giltiga objekt och inget ogiltigt, och alla raderna är varningar, inga
fel.

☠️ **"Global identifierare" rättas inte med en GTIN.** Varorna har ingen egen
(motorrepots `docs/claude/17-dealproffsen.md`), och en lånad kopplar varan
till fel produkt. Märket räcker för Google, och det står på varje vara.

## Det överstrukna priset bär alltid Konsumentverkets ord (2026-11-01)

Leonards fråga: måste produktsidan visa lägsta pris de senaste 30 dagarna? Ja,
när priset är sänkt. 7 a § prisinformationslagen kräver att det tidigare priset
anges vid varje tillkännagivande av en prissänkning, och att det är det lägsta
pris vi tagit de 30 dagarna före sänkningen. Konsumentverket kräver att det står
i omedelbar närhet till priset, så en flik längst ned i beskrivningen räcker inte.

| yta | vad som står |
| :-- | :-- |
| produktsidan, under priset | Lägsta pris de senaste 30 dagarna: ~~1 299 kr~~ |
| produktkort, startsidans brickor, auktionens kort och hjältekort | 30-dagarspris ~~1 299 kr~~ |
| auktionens fältrad (mobil) | 30-dagarspris ~~1 299 kr~~, under priset |

Orden kommer ur Konsumentverkets förslag till föreskrifter om prisinformation
(remiss 2026-06-09, dnr 2026/816, 11 §). Det räknar upp fem uttryck, och ett
överstruket pris får bara visas med ett av dem i direkt anslutning. Listan är
sluten: "Ordinarie pris" eller "Lägsta pris 30 dagar" duger inte. Om förslaget
är beslutat är inte kontrollerat. Orden uppfyller både lagen och förslaget.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Varje överstruket pris går genom `components/tidigare-pris.tsx`.**
   `lib/tidigare-pris.test.ts` fäller `<s>`, `<del>`, `<strike>` och
   `line-through` utanför komponenten, en gammal prisklass (`pdp-price-old`,
   `pprice-old`, `htag-old`, `auction-old`, `a-hc-old`, `a-lb-old`) på ett eget
   element, och ett uttryck som inte står i Konsumentverkets lista.
2. ☠️ **Bara beloppet stryks, aldrig orden.**
3. **Talet är Wix jämförpris** (`compareAtPrice`, i V1 `price.price` mot
   `discountedPrice`). Butiken räknar det inte. Motorns rea-jobb
   (`lib/pricing/rea.ts` på main) håller det till 30-dagarspriset och tar bort
   ett jämförpris som inte följer av prishistoriken, när jobbet är påslaget.
4. ⚠️ **Auktionens överstrukna pris är auktionens listpris**, det pris
   auktionen räknar ned från. Det är 30-dagarspriset bara när varans pris inte
   varit lägre de 30 dagarna före. Den 1 november gällde det inte tre av fem
   levande auktioner, eftersom priserna höjdes den 14 oktober. Leonards beslut
   samma dag: varorna som höjdes i oktober är ett undantag och får vara som de
   är, och motorn har ingen spärr. Från omkring den 14 november ligger höjningen
   utanför 30-dagarsfönstret.
5. **Fältraden visar 30-dagarspriset under priset.** På samma rad kapades
   nedräkningen till "falle…" i 390 px. Under 381 px döljs det helt, som förut,
   och då visas inget överstruket pris alls.

## Recensionerna säger vilken variant kunden köpte (2026-11-01)

På en sida med flera varianter skickar motorn med vilken variant en recension
gäller (fältet `kopt` i `/api/reviews/<id>`, samma namn som sidans val). Listan
visar det som "Köpt: Svart / 50 liter" under namnet (`lib/review-kopt.ts`,
`components/ProductReviews.tsx`). Fältet saknas på sidor med en variant, och då
visas ingenting. Raden säger vad som köptes, aldrig vem som skrev, så regeln om
att ingen rad märks (`lib/review-radmarkning.test.ts`) gäller som förut.

## Säsongstema: Halloween (Leonard 2026-10-28)

*"ge hemsidan halloween look nu under halloween som ändå ser proffsigt ut o
premium"*, och *"temat börjar direkt efter mergen inatt och ändras tillbaka
måndag kl 03:00"*. Temat gäller till måndag 2 november 03:00 svensk tid och
syns på fyra ställen: toppremsan (en skära, och "Glad halloween" på dator), en
glödande linje under sidhuvudet, startsidans hjälte (natthimmel, en skördemåne
med fladdermöss och ett spindelnät i hörnet) och löftesremsan under hjälten.
Månen står bakom produktbilderna på dator och i rubrikens höjd på surfplatta
och mobil, så att den aldrig hamnar bakom text; varje bredd från 360 till 1440
px är granskad. Produktsidor, kort och kassan ser ut som vanligt.
Inga texter, priser eller länkar ändras.

`lib/sasongstema.ts` håller datumen och bygger ett skript som sätter
`data-tema="halloween"` på `<html>`. All stil står i `app/sasongstema.css`,
bilderna i `public/tema/`.

**Datumet läses i webbläsaren, inte på servern.** Sidorna cachas (startsidan en
timme, produktsidorna sex), och ett tema som renderats på servern hade legat
kvar efter sista dagen eller krävt en deploy till för att tas bort. Nu
försvinner det av sig självt måndag 03:00, utan deploy.

Fyra egenskaper som inte ska tas bort, låsta av `lib/sasongstema.test.ts`:

1. ☠️ **Varje regel i `app/sasongstema.css` står under
   `:root[data-tema="…"]`.** En regel utan prefixet, eller en `@import`, hade
   ändrat butiken året runt.
2. ☠️ **`@keyframes` har egna namn.** De gäller i hela dokumentet, temat eller
   ej, så ett namn som `heroFloat` hade skrivit över butikens animation.
3. **Skriptet står först i `<body>`, och `<html>` har
   `suppressHydrationWarning`.** Attributet finns då innan sidhuvudet ritas
   (ingen blinkning, ingen layoutförskjutning), och React varnar inte för ett
   attribut som saknas i serverns HTML.
4. **Varje klass som temat riktar sig mot finns i koden.** Byter en klass namn
   fäller testet, i stället för att temat tyst slutar fungera där.

Lastbilen i toppremsan ligger i `<span class="promo-ikon">` så att temat kan
byta den mot skäran. Den är `aria-hidden` även utan tema.

För att se temat utanför datumen: Playwrights `page.clock.setFixedTime` med ett
datum inom temat. Nästa år byts datumen i `SASONGSTEMAN` och i testet, som
räknar om dem till svensk tid. Sverige går över till vintertid sista söndagen
i oktober, så 03:00 den 2 november är 02:00 UTC.

### Singles Day och Singles Week (Leonard 2026-11-11)

*"single day tema då single day är idag och sen single week tema för resten av
dagarna denna vecka. Sen 00:00 på måndag så går den tillbaka till vanliga"*.
Två teman i samma mekanism, `singlesday` och `singlesweek`:

- **Singles Day** gäller onsdag 11 november hela dygnet i svensk tid: natt i
  plommon med hallonrosa.
- **Singles Week** tar vid torsdag 00:00 och slutar måndag 16 november 00:00:
  natt i vinrött med korall.

Formen är densamma och färgerna står i variabler per tema (`--sd-…`). Båda
syns på Halloweens fyra ställen: toppremsan (fyra ettor i stället för
lastbilen, och temats namn på dator), linjen under sidhuvudet, startsidans
hjälte (temats namn på en rad över märket och ett stort "11.11" bakom
rubriken) och löftesremsan. Raden över märket finns för att namnet ska stå
utskrivet också på mobil, där toppremsan bara rymmer ettorna.

- ☠️ **Temat lovar ingen rabatt och nämner inga priser.** Det är bara stil. En
  kampanj med riktiga priser är Leonards beslut och en egen ändring; provet
  fäller ord som "rabatt", "rea", "%" och "kr" i temats texter.
- **Inga två teman får gälla samtidigt.** Det ena slutar i samma ögonblick som
  det andra börjar, och provet fäller en överlappning.
- **Knappen i hjälten håller 4,5:1 mot vit text** (#E11D63 → #D9381E, och
  #D9381E → #C2410C under veckan). Ljusare rosa hade sett bättre ut och fallit
  på kontrasten.
- **Siffrornas ruta har luft åt höger.** Utan den klipps den lutande sista
  ettan av `background-clip:text`.
- Granskat på 320, 360, 390, 768, 1024, 1280 och 1440 px genom att lägga in
  stilen på den riktiga startsidan i webbläsaren: ingen sidledsscroll och
  inga sidfel.

## Medlemskapet, etapp E1: konto, orderliggare och Mina sidor (2026-11-04)

Leonards uppdrag 2026-11-04: en medlemsportal för privatpersoner och företag,
efter specifikationen "Fyndplats medlemskap – audit och specifikation".
Portalen är vår egen; Wix behåller katalog, kassa, betalning och ordrar. E0
(provordern i E0) visade att Wix-kassan bär ett pris som vår server satt, så
kassan står kvar. Fynden står i motorns `docs/claude/46-medlemskap.md`.

E1 ändrar inga priser. Kunden kan skapa konto, se sin nivå, sina köp och sina
ordrar, och få mejl om ny nivå och om en kommande sänkning.

**Leonards beslut 2026-11-04:** Wix CMS i stället för Postgres (A4).
Inloggning med länk eller sexsiffrig kod, utan lösenord, och kunden förblir
inloggad i 90 dagar (A2). Ett köp räknas från betalningen (P1), fönstret
rullar 365 dagar med mejl 14 dagar före en sänkning (P2), och köp på samma
e-post ett år bakåt räknas vid första inloggningen (P3). Admin finns i motorn
(A3).

| var | vad |
|---|---|
| `lib/medlem/niva.ts` | K, nivån, när den sänks, mejlbesluten (ren, prövad) |
| `lib/medlem/orderliggare.ts` | Wix-order → liggarrad (ren, prövad) |
| `lib/medlem/inloggning.ts`, `session.ts` | kod, länk, spärrar och kakan (rena, prövade) |
| `lib/medlem/lager.ts` | de sju kollektionerna, växeln och reglerna |
| `lib/medlem/liggare.ts` | webhooken, avstämningen och bakåtläsningen |
| `lib/medlem/nattjobb.ts` | `/api/cron/medlemsnivaer`, 04:40 UTC; gallrar inloggningsförsök efter 30 dagar |
| `app/konto/`, `app/api/konto/*` | inloggningen och Mina sidor |

**Växeln är en rad i Wix:** `FyndplatsButikInstallningar/medlemskap`, fältet
`lage`. `av` (eller ingen rad): ingen kan logga in, men orderliggaren fylls.
`tyst`: /konto fungerar för den som har adressen, ingen länk dit. `pa`:
tacksidan erbjuder dessutom konto, och sidhuvudet får knappen
(`components/konto-lank.tsx`, #886): en mörk "Bli medlem" med personikon (ljus
"Mitt konto" för den inloggade) före hjärtat på datorn, ikonen först i
mobilens sidhuvud, ett kort överst i mobilmenyn och en länk i sidfoten.
Knappen frågar `/api/konto/lage`, som kanten cachar i fem minuter, så växeln
syns utan ett bygge. Utan `MEDLEM_JWT_SECRET` (minst 32 tecken) i miljön är
inloggningen stängd oavsett läge, och ingen länk visas.

☠️ **Sidhuvudets knapp håller sin plats från första ritningen** (2026-11-08).
Medan frågan pågår (`synlig: null`, också i serverns HTML) står knappen kvar
osynlig: `data-vantar` ger `visibility:hidden`, plus `aria-hidden` och
`tabIndex=-1`. Bara ett nej tar bort den. Förut monterades den först när
svaret kom, och i mobilen hoppade hjärtat 89 px och kundvagnen 8 px
(`.hrow:has(.konto-btn)` byter mellanrum). Det var hela sidans CLS i
Lighthouse, 0,002. Vänta aldrig med `display:none`: då gäller inte
`:has(.konto-btn)` förrän svaret kommit. I lägena `tyst` och `av` försvinner
platsen när svaret kommer, och det är priset för att `pa` står still. Provet
står i `lib/medlem/kontolank.test.ts`.

Samma regel gäller allt i sidhuvudet som tänds först i webbläsaren. Auktionspricken
vid "Fyndauktionen" (`components/auction-dot.tsx`, 07–19) renderas alltid och
släcks med `data-av`. Förut monterades den efter hydreringen, länken blev 13 px
bredare och menyraden (space-between) flyttade alla länkar på datorn, CLS
0,0002. Provet står i `lib/auktionsprick.test.ts`.

☠️ **Rubriktypsnittet är Newsreader och har två egna reservtypsnitt**
("Newsreader Reserv" och "Newsreader Reserv N" i `app/globals.css`, `fallback` i
`app/layout.tsx`). Fram till 2026-11-16 var det Fraunces; Leonard: "folk tycker
vårt f ser lite konstigt ut, och j:et" (Fraunces f har en kort krok och j:et går
knappt under raden, och det går inte att ställa in bort).
- **Filerna är bantade och ligger i `app/typsnitt`** (`next/font/local`). Hela
  Newsreader med båda axlarna väger 271 kB; de två filerna väger 75 kB (Fraunces
  vägde 79). Optisk storlek är låst vid 40, vikterna är 500–700 (rak) och 500–600
  (kursiv), och bara latinska tecken finns med. `app/typsnitt/LICENS.md` säger
  exakt hur de är gjorda. Ett tecken eller en vikt utanför det ritas med reserven.
- **Typsnittet ritas 6 % större än sin teckenstorlek** (`size-adjust: 106%` i
  `declarations`). Newsreaders små bokstäver är lägre än Fraunces, och med 106 %
  blir raderna lika breda som förut, så butikens mått (radbrytningar, kortens
  höjder) står kvar utan att varje regel ändras.
- **Reserverna har typsnittets mått**, så textens ruta är lika före och efter
  bytet. Nexts egen reserv bygger på Arial och är avstängd
  (`adjustFontFallback: false`). Bredden mot Times är uppmätt på butikens egna
  rubriker (1,1069 i vikt 600), och `lib/typsnitt-reserv.test.ts` räknar om
  resten. Times New Roman saknas på Linux (där Lighthouse mäter) och Android,
  därför står Liberation Serif, Tinos och Noto Serif också i listan.
- Namnen i `fallback` står med enkla citattecken: Turbopack skriver listan rakt
  in i en JS-sträng, och ett dubbelt citattecken fällde bygget. Byts
  rubriktypsnittet igen ska
måtten räknas om, och `lib/typsnitt-reserv.test.ts` fäller tills de är det.

☠️ **Geist ska inte ha en egen reserv på samma sätt** (provat och backat
2026-11-08). Med Arials mått bröts texter med vikt 500 och 700 på färre rader än
med Geist: kampanjremsan på en rad i stället för två, knapparna smalare. Med
typsnitten fördröjda gav bytet CLS 0,010 på mobilens startsida, 0,024 på
produktsidan och upp till 0,13 på kategorisidan. Nexts reserv, och Liberation
Sans rakt av på Linux, bryter texten som Geist gör.

**Kollektionerna** skapades 2026-11-04 med behörigheten ADMIN och 13 index:
`FyndplatsMedlemmar`, `FyndplatsMedlemsprofiler`, `FyndplatsInloggningar`,
`FyndplatsOrderliggare`, `FyndplatsMedlemsnivaer`, `FyndplatsMedlemsregler` och
`FyndplatsMedlemslogg` (bara tillägg). Saknas en regelrad gäller specens tabell
i koden (`REGLER_V1`).

Tio egenskaper som inte ska tas bort:

1. ☠️ **Orderliggaren bär alla köp, inte bara medlemmarnas.** Ett nytt
   konto ser då sina köp direkt [P3], utan ett eget uppslag i Wix. Den fylls
   från tre håll: webhooken (godkänd, avbruten, återbetald; efter svaret med
   `after`), avstämningen varje natt (ordrar ändrade senaste 48 timmarna) och
   bakåtläsningen 400 dagar bakåt, en gång.
   ☠️ **Bara köp (`arKop`, `lib/order-raknas.ts`)**, sedan 2026-11-06. Vår
   kassa skapar ordern före betalningen, och ett övergivet försök blir en
   obetald, avbruten order med nummer 0 som webhooken aldrig hör om. Natten mot
   2026-11-06 kallade avstämningen därför tolv provordrar ur kassan för
   avvikelser, och Mina sidor visade dem som avbrutna ordrar. Nu hoppar
   liggaren över dem, och `liggarraderForEpost` filtrerar bort de rader som
   redan skrevs (`liggarradArKop`).
2. ☠️ **Raden räknas alltid om ur den aktuella ordern**, aldrig ur händelsens
   payload. Betaltiden är orderns första `ORDER_PAID`-händelse, så en
   fakturaorder räknas från betalningen. Varuvärdet är radernas
   `totalPriceAfterTax`: `priceSummary.subtotal` och `.shipping` är UTAN moms
   (uppmätt på provordern).
3. ☠️ **Återbetalningar läses ur Order Transactions**, en per återbetalning med
   sitt datum: `summary.breakdown.lineItems` ger varuvärdet per rad, och frakt
   räknas aldrig (E1-6). En order med återbetalning utan transaktioner skrivs
   inte alls, hellre än som hel.
4. ☠️ **K räknas i svensk tid:** ett köp betalt dag D räknas till och med dag
   D + 364. Testet låser specens tal (E1-4 till E1-7).
5. ☠️ **Nattjobbet räknar inga nivåer förrän bakåtläsningen är klar.** En halv
   liggare hade sänkt nivåer som inte ska sänkas och skickat varningar i
   onödan.
6. ☠️ **Länken i mejlet loggar inte in.** `/api/konto/lank` lägger token i en
   kort httpOnly-kaka och skickar till `/konto/logga-in`, där kunden trycker
   på knappen. Mejlfilter som öppnar länkar (Safe Links) gör bara GET, och en
   token i sidans adress hade följt med till analysskripten.
7. ☠️ **Varken token eller kod sparas i klartext.** Inloggningsradens id är
   tokenens sha256, koden en HMAC med en delnyckel ur `MEDLEM_JWT_SECRET`.
   Fem koder i timmen per e-post, tjugo per adress, fem försök per kod och tio
   felaktiga försök per e-post och dygn.
8. **Ett konto per e-post:** medlemmens id är en hash av adressen
   (`medlemsId`), och kontot skapas med en insert som vägrar ett id som finns.
   Välkomstmejlet går bara till den som skapade raden.
9. **Mina sidor räknas direkt ur liggaren vid varje besök**, så en
   återbetalning syns samma dag och ett köp som faller ur syns på dagen.
   Sidan är dynamisk och privat, aldrig ISR.
10. ☠️ **Loggar och svar bär aldrig e-post, belopp eller ordernummer**, bara
    antal och typ. Repot och Vercels loggar läses av fler än Leonard.

**Premiumutseendet (Leonard 2026-11-04).** Mina sidor visar ett medlemskort i
nivåns egen färg, stapeln mot nästa nivå, nyckeltal, nivåstegen och ordrarna
med varor och produktbilder ur katalogen. Inloggningen visar korten i solfjäder
och förmånerna, och den loggar in av sig själv vid sex siffror. Två saker att
veta:

- ☠️ **Nivåfärgerna står på två ställen**: `app/konto/konto.module.css` för
  sidan och `emails/_medlemskort.tsx` för mejlen, som inte kan läsa en
  CSS-modul. Ändras en nivå eller en färg, ändra båda.
- **Ordrarnas bilder väntar högst 1,5 s på katalogen** (`BILDER_VANTAR_MS` i
  `app/konto/page.tsx`). En kall instans laddar hela katalogen; då visas
  ordrarna med en paketikon hellre än sent.

**Granskningen 2026-11-04 (kväll).** Fyra säkerhets- och räknefel rättade, med
prov som fäller dem:

- ☠️ **Ett kodförsök tas i anspråk INNAN koden prövas** (`taForsok` i
  `lib/medlem/inloggning.ts`, `taForsokPaInloggning` i `lager.ts`). Räknaren
  steg förut efter prövningen, och hundra samtidiga gissningar prövades alla.
  Nu flyttar en villkorad skrivning räknaren ett steg i taget, så högst fem
  koder prövas per inloggning.
- ☠️ **Ett mejl per adress och halvminut**, med en strypningsrad som skapas med
  en insert (`strypId`, `taStrypning`). Räknarna i `/api/konto/kod` läses före
  skrivningen och släppte igenom en skur samtidiga anrop.
- ☠️ **Målet efter inloggningen är strikt** (`sakertMal`): snedstreck följt av
  synliga ASCII-tecken. Webbläsaren tar bort tabb och radbrytning, så
  "/\t/ond.se" blev "//ond.se".
- **Saknade transaktioner är ett fel, inte "inga återbetalningar"**
  (`hamtaTransaktioner` ger null vid 404). En återbetald order fäller då raden
  i stället för att räknas hel; avstämningen försöker igen.
- **Texterna** har egna regler i `lib/medlem/visning.ts`: "högsta nivån" bara
  på VIP, "äldre än ett år" bara efter ett år, "spårning kommer" bara de
  första 30 dagarna och "Handla för X före Y" bara de sista 60 dagarna.
  Rubriken är "Välkommen" den dag kontot skapas och "Välkommen tillbaka"
  sedan (`halsning`, auditen 2026-11-06).
- **Kortens nedre rad har ett mörkt skrim** (`--kort-skrim`). Utan det hade
  den lilla texten kontrasten 1,3–2,3 på brons, guld, platina och diamant.
- ☠️ **Kontrasten mäts i webbläsaren, inte i en räkning** (samma kväll).
  Räkningen ovan såg bara nedre raden och utan skenet; mätt fick "Medlem" på
  guldkortet 1,9. Mätningen: dölj texten och loggan, fotografera sidan och
  jämför varje textrads färg med varje pixel bakom den. Nu är guld, silver och
  platina ljusa metaller med mörk text, brons, diamant och VIP mörka med ljus,
  och skenet (`--kort-sken`) är svagare på de mörka. Lägst 4,7 på korten och
  5,0 i mejlen. Platina är jade, som den gröna nivån i spelens ranking
  (Leonard). Ändras en färg, mät om.

**Mejlen om nivån går att stänga av** (2026-11-04, före läget `pa`).
Mejlen "ny nivå" och "nivån sjunker" uppmanar till köp och har därför en länk
för att avregistrera sig och rubrikerna List-Unsubscribe med ett klick (RFC
8058). Inloggningskoden och välkomstmejlet hör till kontot och har ingen.

- ☠️ **Ett GET avregistrerar aldrig.** Länken leder till
  `/konto/avregistrera`, där kunden trycker på en knapp; mejlfilter som
  öppnar länkar ändrar därför ingenting. Mejlklientens ett-klick är ett POST
  till `/api/konto/avregistrera` med kroppen `List-Unsubscribe=One-Click`.
- Token är en HMAC av medlemmens id med en egen delnyckel
  (`avregistreringsToken` i `lib/medlem/inloggning.ts`), så länken i ett
  gammalt mejl fungerar och öppnar inget annat.
- Avregistrerad är `nivamejl: false` på medlemmen; på igen tar bort fältet.
  Mina sidor har knappen åt båda hållen. Nattjobbet räknar ett beslut som
  meddelat även när mejlet inte går, så att inget gammalt mejl skickas om
  medlemmen slår på mejlen igen.
- **En inloggad men spärrad medlem** ser beskedet direkt på `/konto`, inte
  inloggningen.

Integritetstexten (J4) är godkänd av Leonard 2026-11-05 och står i
`/sekretesspolicy` under rubriken Medlemskonto (`#medlemskonto`). Den beskriver
bara E1; medlemspriser (E2) och företag (E3) kräver ett tillägg innan de slås
på. Ändras vad kontot sparar, hur länge eller vilka mejl och kakor det har,
ändras texten i samma PR. E1-grinden är
specens E1-1 till E1-11 och en vecka med avstämning utan avvikelser; svaret
från `/api/cron/medlemsnivaer` och `FyndplatsMedlemslogg` (område
`avstamning`) visar dem.

## Vår egen kassa: formuläret hos oss, betalningen på Wix betalsida (2026-11-06)

Leonards val 2026-11-05, efter att Wix mobilkassa lämnade tomrum under
"Leveransinformation" på iPhone och hoppade när kunden skrev. Formuläret och
summeringen ligger på `/kassa`; Wix räknar, skapar ordern och tar betalt på sin
betalsida (`checkout.fyndplats.se/__ecom/payment-request-page/<id>`) med samma
betalsätt och samma Wix Payments-konto. Koden: `lib/kassa/` (flödet och skälen
i `flode.ts`), `app/kassa/`, `app/api/kassa/*` och städjobbet
`/api/cron/kassa-stadning`.

- **Växeln** är raden `FyndplatsButikInstallningar/kassa`, fältet `lage`: `av`
  (saknas raden: Wix kassa som förut), `prov` (bara den som öppnat
  `/kassa?prova=1`, kakan `fp_kassa_prov`) eller `pa`. Varukorgen frågar
  `/api/kassa/lage` när lådan öppnas.
- ☠️ **Priset kommer bara från Wix.** Kunden skickar formuläret och korgens id.
  Beloppet på betalningsbegäran är Wix total för ordern som just skapades.
- **Ordern skapas med Checkout V1 `create-order` på korgens id** (i Cart V2 är
  korgens id kassans id). Den blir som Wix kassas egna: checkoutId, cartId,
  purchaseFlowId, moms och leveranstid. Uppmätt med två avbrutna testordrar
  2026-11-05/06. ⚠️ Rättat 2026-11-06: Cart V2 `place-order` GÅR på en förberedd
  korg utan betalning (obetald order, ingen debitering), och det är
  Stripe-kassans väg; se nästa avsnitt. Checkout V1 `create-order` tas bort
  2027-02-01, så Wix-betalsidans väg måste bort före dess.
- ☠️ **Ordern reserverar lagret från det att den skapas.** En kund som lämnar
  betalsidan håller varan. Nästa försök från samma korg släpper den förra
  ordern (betalningen makuleras först, sedan avbryts ordern med återlagring),
  och städjobbet varje timme släpper ordrar vars betalningslänk löpt ut
  (`BETALNING_MINUTER`, 120). Bara betalningar med markören `fp-kassa:` rörs.
  Faller avbrottet efter makuleringen står ordern kvar med en makulerad
  betalning: städjobbet prövar därför makulerade betalningar ett dygn
  (`MAKULERAD_PROVAS_TIMMAR`), efter de obetalda.
- **Servern hittar själv korgens förra försök** (`fp-kassa:<korg>:<försök>` i
  betalningens `source.externalId`), så att en kund som bytt flik eller enhet
  inte lämnar en reserverad order efter sig. En **betald** betalning från samma
  korg stoppar ett nytt försök (webhooken kan ligga efter och korgen se obeställd
  ut: ett nytt försök vore ett dubbelköp). Fler än `MAX_FORSOK_PER_TIMME` (8)
  försök från samma korg på en timme stoppas, eftersom varje försök reserverar
  lager.
- ☠️ **En order från vår kassa finns innan den är betald.** Den står som
  `INITIALIZED` tills betalningen kommer, och en övergiven blir `CANCELED` utan
  att ha betalats. `lib/order-raknas.ts` (`arKop`) avgör vad som är ett köp:
  morgonrapporten, populariteten och orderspegeln (`order-sync`) räknar bara
  köp. Motorns ordernät rör bara betalda (`ACTIONABLE_PAYMENT`), och Trustpilot
  bara skickade. En ny läsare av Wix-ordrar ska fråga `arKop` först.
- **Wix räknar korgen med motorns kassavalidering**, så postnummerspärren för
  Aosom-varor (`spiViolations`) stoppar också vår kassa, med motorns text.
- **Korgen markeras som beställd i webhooken** när ordern godkänts (betald):
  Wix gör det inte själv för en order som skapats före betalningen, och annars
  står varorna kvar i kundens varukorg.
- ⚠️ **Betalsidan har ingen väg tillbaka till oss**, och dess logga leder till
  Wix tomma startsida (`checkout.fyndplats.se/__ecom`). `/kassa/klar` är
  vägen tillbaka: betald → `/tack`, väntande → `/kassa`, annars startsidan.
  Wix startsida pekas dit med en egen kod i Wix: Custom Embed
  `d8adeb6d-9666-4967-b0f6-628050399a82` (2026-11-06, ESSENTIAL, i `<head>`,
  på varje sida). Den skickar `/__ecom` och roten till `/kassa/klar` och fångar
  klick på länkar dit (betalsidans logga) på alla Wix-sidor på
  checkout.fyndplats.se; Wix kassa och betalsidan rörs inte (provat med en
  vanlig kund och en makulerad betalsida). ⚠️ Wix cachar startsidans HTML i
  timmar: ett direkt besök på `/__ecom` kan visa den tomma sidan tills cachen
  byts, men klicket på loggan fungerar direkt. Tas bort i Wix (Inställningar →
  Anpassad kod) eller med DELETE på embeden. Den väntande ordern ligger i sessionStorage; kommer kunden
  tillbaka till `/kassa` frågar sidan `/api/kassa/status` och går till `/tack`
  om ordern är betald. Vad betalsidan visar efter betalningen är inte uppmätt
  (kräver en riktig betalning).
- ☠️ **En makulerad länk** visar Wix text "Den här länken är längre
  tillgänglig" (stavfel hos Wix: "inte" saknas). Kunden får därför aldrig en
  sparad länk: rutan "Din betalning väntar" visas bara när `/api/kassa/status`
  säger `betalbar` (betalningen hör till ordern, bär `fp-kassa:`, är obetald och
  har minst två minuter kvar), med en länk som servern just hämtat från Wix (Get
  URL). Leonards iPhone 2026-11-06: bakåt från betalsidan och "Till
  betalningen" gav den döda sidan.
- ☠️ **Samma köp får samma betalsida** (Leonards prov 2026-11-06). Tidigare
  släppte varje tryck den förra ordern och skapade en ny; när Wix sedan nekade
  ordern (429) stod kunden utan betalning. Nu bär betalningen ett avtryck av
  korgen, kunden och rabattkoden (`korgAvtryck`, fjärde ledet i
  `source.externalId`). Är avtrycket och Wix total oförändrade och länken har
  minst `ATERBRUK_MIN_KVAR_MINUTER` (15) kvar, återanvänds ordern och
  betalningen: ingen ny order, inget nytt lager reserveras och taket räknas
  inte. Ändrad adress, e-post, antal, rabattkod eller pris (en fyndauktion som
  sjunkit) ger en ny order som förut.
- ☠️ **Wix 429 på ordern gäller e-postadressen, inte sajten**: ungefär fem
  ordrar på en halvtimme per e-post, sedan nekas nya (429 RATE_LIMITED).
  Mätt 2026-11-06 på alla nattens ordrar: varje nekad order var den sjätte på
  en halvtimme för samma adress, nekade anrop räknas inte, och andra adresser
  gick igenom samtidigt. Ett nekat anrop har inte gjort något och görs om två
  gånger (`medOmforsok`, 0,7 s och 1,5 s), vilket bara hjälper mot korta toppar.
  Andra fel görs aldrig om: en order som kanske skapades ska inte skapas två
  gånger. Når 429 kunden säger kassan att Wix inte tar emot fler beställningar
  med adressen på en stund och att försöka igen om en halvtimme.
  ☠️ **Prov använder aldrig info@fyndplats.com**, som Leonard själv provar med:
  2026-11-06 06:54 svensk tid nekades Leonards order för att mina fem prov
  05:30–05:51 UTC hade tagit adressens halvtimme. Ett prov använder en egen
  adress (`info+prov-<tid>@fyndplats.com`).
- **Betalsidan visar första varans bild** (`betalBild`: mediets id ur korgens
  `attributes.image`, alt-text eller varans namn). Nekar Wix bilden (400)
  skapas betalningen utan, eftersom bilden bara är utseende.
- ⚠️ **Klarna på Wix betalsida frågar efter adressen igen** (Leonards iPhone
  2026-11-06, mätt samma natt): väljer kunden Klarna visar Wix betalsida ett
  eget tomt formulär (e-post, förnamn, efternamn, adress, ort, land) innan
  Klarna, fast ordern bär leverans- och fakturaadress. Betalningsbegäran har
  inget fält för köparen, så det går inte att fylla i från oss. Kassan säger
  det före betalningen; kort och Apple Pay frågar inte.
- **Kundens egen väntande order håller varorna**, så Wix räknar dem som slut för
  samma korg. Räkningen på `/kassa` visar därför ingen lagerbrist när korgen har
  en obetald betalning (`stoppandeOvertradelser(..., { utanLager: true })`).
  Betalningen gör den vanliga kontrollen efter att den förra ordern släppts.

## Stripe-kassan: Klarna, kort, Apple Pay och Google Pay på /kassa (2026-11-06)

Leonards val 2026-11-06 ("Ja, börja nu"), efter auditen: Klarna är två av tre
köp (113 av 171 betalda ordrar 2026-06–11), och Wix betalsida tvingade
Klarna-kunden att skriva e-post, namn och adress en gång till. Nu står
betalfältet (Stripe Payment Element) i steg 3 på `/kassa`, och kundens
uppgifter ur formuläret följer med till Klarna. Wix räknar korgen och äger
ordern som förut; Stripe tar betalt.

**Påslag:** `/kassa` använder Stripe när BÅDA nycklarna finns när sidan byggs
(`app/kassa/page.tsx`): `STRIPE_SECRET_KEY` och
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`/`pk_live_…`). Saknas någon
gäller Wix betalsida som i avsnittet ovan. Växeln (`FyndplatsButikInstallningar/kassa`)
avgör som förut vem som kommer till `/kassa` alls. Webhooken kräver
`STRIPE_WEBHOOK_SECRET`.

**Flödet** (`lib/kassa/flode.ts` `forberedStripe`/`slutforStripe`, sidan i
`lib/kassa/stripe-klient.ts` och `app/kassa/use-stripe-betalning.ts`):
1. Betalfältet visas direkt, utan PaymentIntent (Elements i `mode: "payment"`,
   beloppet = summeringen, så att Apple Pay visar rätt belopp).
2. "Betala": `elements.submit()` FÖRST, i själva trycket (Stripe prövar fälten
   innan betalningen skapas, och ett plånboksblad öppnas bara i ett tryck),
   sedan `/api/kassa/stripe/forbered`:
   formuläret till Wix-korgen, Wix räknar, en PaymentIntent på Wix total med
   `capture_method: manual` (pengarna reserveras, dras inte).
3. `stripe.confirmPayment` med `redirect: "if_required"`. Kort, Apple Pay och
   Google Pay stannar på sidan; Klarna går till Klarna.
4. `/api/kassa/stripe/klar` (och webhooken `/api/stripe/webhook`, samma steg):
   Wix räknar igen och totalen måste vara den reserverade → Cart V2
   `place-order` med Wix prisbevis → dra beloppet → Add Payments (godkänd
   betalning med Stripes laddnings-id och betalsättet på kundens språk) →
   `/tack?orderId=…`. Går ordern inte att skapa släpps reservationen (eller
   betalas en redan dragen betalning tillbaka): ingen kund betalar utan order.

Det som inte får ändras:
- ☠️ **Ett lås per betalning** (Wix CMS `FyndplatsKassaBetalningar`, ADMIN,
  raden = betalningens id). Kundens retur och webhooken kommer ofta samtidigt;
  bara den som tar låset skapar ordern, den andra svarar `pagar` (202) och
  sidan frågar igen. Låset bär steget (`pagar` → `order` → `registrera` →
  `klar`/`fel`), så ett avbrott efter ordern fortsätter med dragningen i stället
  för att skapa en order till. Ett lås äldre än 120 s tas över, ☠️ **med en
  villkorad skrivning** (`taOverLas` i `stripe-las.ts`: Wix compare-and-set på
  steget och `at`). Webhookens omförsök och nätet kan se samma övergivna lås
  samtidigt; med en vanlig skrivning tog båda över, lade ordern på samma korg
  eller släppte varandras reservation (auditen 2026-11-06, provet i
  `stripe-flode.test.ts` kör två samtidiga omtag).
- ☠️ **Create Order (`ecom/v1/orders`) används inte:** Wix tillåter fem anrop i
  timmen för opublicerade appar. `place-order` är vägen.
- ☠️ **Faktureringsuppgifterna kommer från servern** (`faktureringAv` i
  `flode.ts`, i svaret från `forbered`) och skickas med i bekräftelsen.
  Betalfältet frågar aldrig efter dem (`fields.billingDetails: "never"`), och
  då kräver Stripe VARJE fält, också `state` och `line2` som tomma strängar:
  ett saknat fält stoppar betalningen. Adressen formas på ett ställe
  (`stripeAdress`). Provat lokalt 2026-11-06 mot riktiga Stripe.js.
- ☠️ **Servern sätter ALDRIG `shipping` på betalningen** (`avsiktParametrar`,
  varken när den skapas eller uppdateras). Adressfältet (läget "shipping")
  ligger i samma Elements som betalfältet, och `stripe.confirmPayment` skickar
  dess adress som leverans. Har servern satt `shipping` med den hemliga
  nyckeln nekar Stripe bekräftelsen: 400 `payment_intent_invalid_parameter`,
  "The shipping information on this PaymentIntent was last set with a secret
  key and therefore cannot be changed with a publishable key". Mätt på
  förhandslänken 2026-11-06 16:06 UTC: sedan adressfältet kom in (2b241635)
  stoppades varje betalning så, och kunden fick "Betalningen kunde inte
  genomföras just nu". Provet i `stripe-klient.test.ts` låser regeln.
- ☠️ **Kort först, Klarna sist och aldrig förvalt** (`BETALFALT`), fast två av
  tre köp är Klarna. Lagen (2010:751) om betaltjänster (prop. 2019/20:79,
  sedan 2020-07-01): finns ett betalsätt utan kredit ska det visas först, och
  ett med kredit får inte vara förvalt. "Kredit" ska förstås brett, och
  Klarnas val rymmer "betala om 30 dagar" och delbetalning. Brott räknas som
  otillbörlig marknadsföring (KO). Fältet fäller ut det första valet, kortet;
  Klarna väljs aktivt. Provet låser regeln, inte bara ordningen. Den nya
  konsumentkreditlagen (CCD2, i kraft 2026-11-20) räknar också räntefri
  faktura som kredit; en butik som får ersättning från kreditgivaren kan bli
  kreditförmedlare (Fyndplats får ingen).
- ☠️ **Betalfältet och PaymentIntenten måste ha samma valuta och dragning**
  (`sek`, `manual`), annars nekar Stripe bekräftelsen. Provet i
  `stripe-klient.test.ts` jämför med `avsiktParametrar`.
- ☠️ **Ingen idempotensnyckel ur korgens innehåll:** Stripe svarar på en känd
  nyckel med det sparade svaret i ett dygn, också när betalningen sedan
  släppts. Ett nytt försök efter "kunde inte skapas" hade fått den släppta
  betalningen tillbaka. En ny betalning får en unik nyckel; kundens försök
  återanvänds via `avsiktId` (localStorage `fp_kassa_stripe`, 24 h, bara samma
  korg), och dubbeltrycket stoppas i sidan (`pagar`-refen).
- ☠️ **Klarnas retur går via `/api/kassa/stripe/retur`**, som lägger
  betalningens id i kakan `fp_kassa_avsikt` (sökväg `/kassa/klar`, 15
  minuter, ingen annan sida ser den) och skickar till `/kassa/klar` utan
  något i adressen. Stripe lägger `client_secret` i return_url, och sidorna
  laddar GA4 och Meta, som sparar hela adressen; inte ens betalningens id ska
  stå där. `/kassa/klar` läser och tar bort kakan. Blev det ingen order går
  kunden till `/kassa?stripe=<kod>` (`avbruten`, `pris_andrat`, `slut`, `fel`),
  som säger varför och tar bort koden ur adressen.
- **Ändrad total stoppar före betalningen:** räknar Wix fram en annan total än
  den kunden ser (fältets belopp) visas den nya, och kunden trycker igen.
- **"Betalningen är godkänd" efter en minut:** en väntan för båda sidorna
  (`vantaPaOrder` i `stripe-klient.ts`: frågar `klar` med växande vila, högst
  3 s, också genom nätfel och 5xx; ett nej är ett nej direkt). Svarar servern
  fortfarande `pagar` efter 60 s säger sidan att orderbekräftelsen kommer via
  e-post, och knappen låses (webhooken slutför). Kunden ska aldrig uppmanas
  att betala igen när pengarna kan vara reserverade.
- **Inga typsnitt från Google i Stripes ram:** butiken lägger sina typsnitt på
  egen server. Stripes ramar får Geist därifrån (`TYPSNITT_FIL`,
  `public/fonts/geist-latin-v1.woff2`, samma latinska fil som next/font lägger
  ut, med CORS och ett års cache i `next.config.ts`), bara över https: Stripe
  nekar andra adresser, och då ritas fälten med systemets typsnitt. Förut stod
  adressen och kortet i systemets typsnitt bredvid e-post, mobil och län i
  Geist (auditen 2026-11-06). Byts filen får den ett nytt namn.
- **Loggraderna:** inga kunduppgifter. Rader med ☠️ (pengar som inte står där
  de ska) går till `console.error` och syns bland Vercels körfel; resten är
  varningar (`lib/kassa/stripe-kassa.ts`).
- **Apple Pay kräver domänen:** filen
  `public/.well-known/apple-developer-merchantid-domain-association` (Stripes,
  samma för alla Stripe-konton) och domänen `www.fyndplats.se` registrerad i
  Stripe (Inställningar → Betalmetodsdomäner). `Permissions-Policy` får aldrig
  stänga `payment` (`next.config.ts`).
- **Klarna visas bara för köpare i Sverige:** Stripe läser köparens land ur
  IP-adressen ("Supported countries: SE" för `sek`). En provwebbläsare i molnet
  (USA) ser bara kort; skälet står i Stripes svar på `elements/sessions` under
  `developer_tool_context.payment_method_filtering` (mätt på förhandsbygget med
  Leonards testnycklar 2026-11-06: kort, Apple Pay och Google Pay giltiga, Link
  av). Klarna prövas därför från en svensk uppkoppling, till exempel en telefon.
- **Stripe Tax används inte:** Wix räknar momsen på ordern (priserna är
  inklusive 25 %), och den står på kvitton och fakturor. Stripe tar bara betalt
  för Wix total. Stripe Tax skulle räkna momsen en gång till och kostar per köp.
- Stripe-anropen görs med `fetch` och formulärkodning (`lib/kassa/stripe.ts`,
  API-version `2025-03-31.basil`), utan Stripes Node-SDK. Webhooken prövar
  `Stripe-Signature` (HMAC-SHA256 över `t.kropp`, 300 s) på den RÅA kroppen.
  Webbläsaren använder `@stripe/stripe-js` 7.x, samma release (basil).
- **"Betala med Klarna", aldrig "Fortsätt till Klarna":** ordern skapas utan
  fler klick hos oss efter Klarna, så vår knapp är beställningsknappen och ska
  säga att det kostar (distansavtalslagen 2 kap. 9 §).

### Självläkningen (auditen 2026-11-06)

Kunden får alltid ett svar på sekunder, men allt som inte blev klart tas om
tills det är klart, och Leonard får ett mejl om det inte går:
- ☠️ **Webhookens svar styr omförsöken** (`webhookStatus`, `arKlart`): 200 bara
  när inget finns kvar att göra. `ofullstandig` (pengarna dragna, men
  betalningen står inte på ordern) och `ostadad` (ingen order, men
  reservationen släpptes inte eller betalningen gick inte tillbaka) svarar 500,
  `pagar` och `behandlas` 503: Stripe försöker igen i upp till tre dygn. Förut
  svarade allt 200 och en misslyckad registrering togs aldrig om.
- ☠️ **Nätet `/api/cron/kassa-stripe`** (kvart 7, 22, 37, 52): kassans
  betalningar de senaste tre dygnen (List, inte Search) som är godkända eller
  dragna men saknar `wixOrderId` och är äldre än fem minuter, äldst först,
  högst åtta per körning, samma steg som klar och webhooken. Är en betalning
  inte klar 30 minuter efter att den skapades mejlas `OPS_ALERT_EMAIL` (annars
  info@fyndplats.com), en gång per betalning, med bara betalningarnas id.
- ☠️ **En dragning vars svar försvann läses om** innan ordern avbryts: drog
  Stripe ändå behålls ordern och betalningen registreras. Går läget inte att
  läsa avbryts och släpps ingenting; låset står kvar och nästa försök avgör
  (dragningen har en idempotensnyckel).
- ☠️ **Place Order utan svar:** ett 4xx (också 429 efter omförsöken) betyder att
  ingen order skapades. Annars läses korgen: Cart V2 sätter `orderPlaced` och
  `orderId`, och den ordern används i stället för att reservationen släpps (då
  hade kunden fått en låst korg och en order utan betalning). Samma sak vid
  omtag av ett lås som stod på `pagar`. En order som redan har en betalning
  (korgen betaldes i Wix kassa i en annan flik) tas inte: vår reservation släpps.
- **Omtag läser orderns betalningar** (List Transactions) före Add Payments:
  Wix nekar en dubblett av `providerTransactionId` och hela anropet felar.
- **Ett klart lås märker betalningen** med `wixOrderId` om markeringen föll,
  annars tar nätet den om var femtonde minut och larmar i onödan. **Ett
  fel-lås städar igen:** står pengarna kvar släpps de (eller betalas
  tillbaka); kunden fick höra att inget drogs. `charge_already_refunded` och
  en redan släppt reservation är inga fel.

### Återbetalningar och tvister (2026-11-06)

☠️ **Återbetala bara i Wix, aldrig i Stripes panel.** Leonard återbetalar som
för alla ordrar: raderna och frakten väljs i Wix, och medlemskapets
orderliggare läser uppdelningen per rad. Kassans betalning står på ordern som
en **offlinebetalning** med Stripes id (`offlinePayment: true`,
`registreraBetalning`), så Wix bokför återbetalningen som manuell (Wix kan
inte själv nå Stripe), och butiken gör den i Stripe (`speglaAterbetalningar` i
`flode.ts`): summan av Wix lyckade återbetalningar på betalningen mot Stripes
summa på laddningen, och skillnaden tillbaka. Wix-webhooken (`refund`) speglar
efter svaret; nätet tar det som faller.
- ☠️ **Bara auktoritativ data:** webhooken bidrar bara med order-id:t (den kan
  vara lookup-verifierad); beloppen läses ur orderns transaktioner (List
  Transactions) och laddningen i Stripe. Betalningen ska bära kassans
  `kalla`, och `wixOrderId` (när den finns) ska vara ordern; beloppen ska vara
  lika och i SEK. Annars larm, inga pengar.
- ☠️ **Idempotensnyckeln är laddningen och STRIPES summa före återbetalningen**
  (`fp-ater-<laddning>-<öre>`), aldrig Wix summa: två speglingar som läst
  olika Wix-summor men samma Stripe-summa hade annars båda gått igenom (två
  delåterbetalningar tätt efter varandra). Nu får de samma nyckel; Stripe gör
  den ena, nekar den andra (samma nyckel, annat belopp), och den nekade läser
  om och försöker igen, högst tre rundor. Proven kör en slumpad simulering
  med samtidiga speglingar mot en låtsas-Stripe med Stripes idempotens.
- **Stripe före Wix larmar, rättas inte:** följer Leonard Wix råd för manuella
  betalningar och betalar tillbaka i Stripe först, blir det lika när han sedan
  bokför i Wix, och inget görs dubbelt. Står Stripe över Wix i 30 minuter
  mejlas det. Inget svar från Stripe (nätet) är inget larm: nästa spegling
  läser Stripes summa och ser vad som hände.
- **Nätet** (`/api/cron/kassa-stripe`, tre delar som felar var för sig):
  Wix-ordrar med en återbetalning ändrad de senaste två dygnen (Search Orders
  på `paymentStatus` och `updatedDate`, uppmätt 2026-11-06), plus ordrarna
  bakom Stripes återbetalningar de senaste tre dygnen; avvikelser mejlas en
  gång per läge (`larmnyckel`, anspråk i `FyndplatsWebhookMejl`). Tvister som
  väntar på svar mejlas en gång per tvist, med sista svarsdag.
- Wix egna betalningar (Wix Payments, Klarna via Wix) bär Wix och
  leverantörens id och rörs aldrig; ett Stripe-likt id som inte finns i vårt
  konto (404) hoppas över tyst.
- Används en begränsad nyckel i Stripe behöver den: PaymentIntents (skriva),
  Charges (läsa), Refunds (skriva) och Disputes (läsa).

### ☠️ Klarnas kredit nämns bara med Klarnas egna ord (CCD2, 2026-11-20)

Stripe mejlade 2026-11-14: från 2026-11-20 gäller det nya
konsumentkreditdirektivet, och egen marknadsföring av Klarnas kredit ska
använda Klarnas förgodkända text med alla upplysningar. Klarnas riktlinjer för
Sverige (docs.klarna.com/acquirer/klarna/resources/marketing-tools/partner-marketing-legal-guidelines/sweden/,
länkade från Stripes Klarna-sida):

- Text om att betala senare, om 30 dagar eller med delbetalning är
  kreditreklam. Den får bara stå i Klarnas exakta ordalydelse och kräver
  riskvarningen "Att låna kostar pengar!" med röd triangel, lika framträdande
  och direkt intill, och ett exempel med effektiv ränta.
- "Räntefritt", en ränta eller ett månadsbelopp får aldrig läggas till.
- "Betala med Klarna" och "Klarna tillgänglig" nämner bara Klarna som
  betalsätt och behöver ingenting. Det gör inte heller en uppräkning som "kort,
  Apple Pay, Google Pay eller Klarna".

Butikens egna texter nämner därför ingen kredit: produktsidans rad och
toppremsan säger "Betala med Klarna", och vanliga frågor, köpvillkoren, om
oss, kundtjänst och bloggen räknar upp Klarna bland betalsätten. Klarnas egen
ruta (OSM) och Stripes betalfält uppdateras av Klarna och Stripe.
`lib/betalningstext.test.ts` fäller kredittext i app/, components/, lib/ och
blogginläggen (kommentarer räknas inte). Mejlen är besked om ett köp och läses
inte. Vill Leonard ändå visa "Handla nu. Betala senare med Klarna." krävs
varningen och exemplet på samma ställe, och det är ett eget beslut.

### Klarna-rutan på produktsidan (2026-11-06)

Klarnas egen ruta (OSM, `components/klarna-osm.tsx`) visar villkoren i
Leonards Klarna-avtal, som gäller i Wix kassa: "Betala inom 30 eller 60 dagar"
och delbetalning i 3–24 månader. I Stripe-kassan gäller Stripes Klarna (30
dagar och Stripes delbetalning). När Stripe-kassan är på för alla (växeln
`pa` och Stripes hemliga nyckel) visar sidan därför vår egen rad ("Betala
med Klarna", sann i båda), och Klarnas skript (0,8 MB) laddas inte (`klarnaRuta`, `/api/kassa/klarna`, `lib/use-klarna-ruta.ts`).
Svaret är detsamma för alla och cachas fem minuter i kanten; utan Stripes
publika nyckel i bygget frågar sidan ingenting och allt är som förut. Vill
Leonard visa Stripes egen Klarna-ruta (Payment Method Messaging, villkoren och
räntan i en ruta från Stripe) kan den läggas in när kontot finns och kan
provas; den kräver samtycke för kakor, som Klarnas.

### Premiumkassan (Leonard 2026-11-06: "gör allt visuellt premium, och funktioner premium")

- **Egen ram:** `/kassa` och `/kassa/klar` har eget sidhuvud (loggan, stegen
  Varukorg › Uppgifter och betalning › Bekräftelse, "Säker kassa") och en tunn
  sidfot (`app/kassa/kassa-ram.tsx`). Butikens kampanjremsa, meny med sökruta,
  sidfot och tillbaka-upp-knapp döljs med `body:has([data-kassa-sida])` i
  `app/globals.css`, utan skript och utan att något blinkar fram. Sidhuvudet är
  inte fast mot skärmen (iPhones tangentbord flyttar fasta rader). Villkor och
  hjälp öppnas i ny flik: det kunden skrivit sparas inte förrän hen betalar.
- **Fälten:** flytande etiketter, 56 px, som Stripes fält (`labels: "floating"`
  och utfyllnaden i `UTSEENDE`; mätt i webbläsaren: båda 56 px). En bock när ett
  lämnat fält är rätt (`faltGiltigt`, samma regler som `provaKassa`), svenska
  mobilnummer skrivs "070 123 45 67" (`snyggtTelefon`), c/o bakom en länk, och
  `autocomplete` med `shipping`. Ett rättat fel lämnar sin rad kvar (tom) till
  nästa tryck, så att inget flyttar medan kunden skriver.
- **"Menade du …@gmail.com?"** (`lib/kassa/epost-forslag.ts`): stavfel i namnet
  på en känd tjänst, felskriven toppdomän, saknad punkt och domäner som inte
  finns (gmail.se). En riktig adress hos en annan tjänst (hotmail.dk, ett
  företag) får aldrig förslag, och två lika troliga ger inget. Förslaget står på
  hjälptextens rad.
- **Spara mina uppgifter:** kundens eget val, aldrig förvalt. Utan det sparas
  ingenting i webbläsaren, och det som sparats förut tas bort vid nästa köp.
  Förut sparades adressen alltid (ingen kaka, men lagring på kundens enhet utan
  val).
- **Summeringen:** varianten per rad ("Färg: Natur"), antal varor, "Ändra"
  (öppnar varukorgen), fri frakt-mätaren, och under den öppet köp, leveransen,
  och betalningen. Google-betyget står inte i kassan sedan 2026-11-15 (se nedan).
- **Rabattkoden:** Enter i fältet lägger till koden (förut skickade Enter hela
  formuläret, alltså betalningen); en kod som gått in blir en bricka med
  "Ta bort" (en tom kod till `/api/kassa/rakna`); en ogiltig kod syns vid koden
  (förut syntes `fel.kupong` ingenstans).
- **Rättat i granskningen:** fokus går till det första felet uppifrån
  (`forstaFel`; förut hoppade det förbi ett tomt mobilnummer), ingen `<main>` i
  `<main>` (layouten har redan en), stegen i sidhuvudet heter `data-steg` (inte
  `data-lage`, som är betalfältets läge), och tacksidan visar aldrig GUID:t
  eller "0" som ordernummer.
- **Visuell audit 2026-11-06** (320, 390 och 1280 px, scratchpad
  `audit/j-kassa.cjs`):
  - Ett tryck på "Betala" visar alla fel på en gång: när kassans egna fält
    stoppar trycket får Stripes fält (adressen och kortet) också visa sina,
    med `elements.submit()`. Ingen betalning skapas, och fokus går till
    kassans första fel. Förut kom Stripes fel först i nästa tryck.
  - Stripes felrader har kassans stil (`.Error` i `UTSEENDE`: 12 px och
    halvfet, som `.felText`).
  - Länkarna i steg 3 ("Betala med Apple Pay …" och "Har du en rabattkod?")
    står på var sin rad med samma stil (`.tillSnabb`, `.kupongLank`). På
    datorn stod de förut ihop på en rad.
  - Summeringsraden bryts aldrig. I 320 px bröts "Visa beställningen
    (1 vara)" i fyra bitar. Antalet visas bara när raden är minst 400 px
    (containerfråga på `.mobilSummering`), beloppet krymper aldrig och
    etiketten kortas med "…" bara som sista utväg.
- **Andra auditen 2026-11-06 (kväll)**, i produktion utan betalning och på
  förhandslänken (320, 390 och 1280 px):
  - Stripes fält ser ut som kassans egna: etiketten grå och normal i ett tomt
    fält, halvfet när den flyttat upp och röd när fältet är fel
    (`.Label--resting`, `--floating`, `--invalid`), och texten 14 px in från
    kanten (`.Input` `paddingLeft`). Förut stod Stripes etiketter svarta och
    halvfeta, blev aldrig röda och låg 2 px till vänster. Provet jämför med
    `.etikett`, `--soft`, `--sale-fill` och `.input` i CSS:en.
  - Ingen grön bock bredvid "Menade du …?": en felstavad adress (gmial.com)
    fick förut bocken som säger att fältet är rätt, på samma rad som förslaget.
- **Snabbkassan** (Apple Pay och Google Pay överst) är byggd: se avsnittet
  nedan.

### Slutprovet (Leonards ja, 2026-11-06 12:30–12:37 UTC)

På förhandslänken med Leonards testnycklar (nya kontot Fyndplats, SE/SEK),
växeln på `prov` och den dolda testvaran synlig i 2 min 37 s. En provorder
med en provadress som köpare, avbruten efteråt.
- **Tre kort:** 4000 0000 0000 0002 gav "Ditt kort nekades." på 3,5 s och
  ingen order. 3D Secure-kortet 4000 0027 6000 3184 med misslyckad
  verifiering gav den allmänna texten "försök igen om en stund" (rättat:
  `TEXT_VERIFIERING` för `payment_intent_authentication_failure`). Samma kort
  med godkänd verifiering: verifieringssidan efter 4,5 s, `/tack` med
  ordernumret efter 14 s; `klar` tog 4,4 s på servern och `forbered`
  1,5–1,8 s. 0 sidfel.
- **Ordern i Wix:** APPROVED och PAID, kanal WEB, `purchaseFlowId`, varan och
  frakten rätt, saldo 0. Vårt bekräftelsemejl gick 7 s efter ordern (Resend), Wix
  `order.approved` nådde butiken och motorn (motorn: inga fel, ingen
  leverantörsuppgift för testvaran).
- ☠️ **Återbetalningen nekades:** som onlinebetalning (`offlinePayment:
  false`, som förut) svarade Get Order Refundability `nonRefundable
  TRANSACTION_NOT_FOUND` och Refund Payments 428 `PAYMENT_NOT_REFUNDABLE`,
  också med `externalRefund: true`. Leonard hade inte kunnat återbetala en
  enda Stripe-order i Wix. Prov på samma order med en offlinebetalning på
  0,01 kr: `manuallyRefundable OFFLINE`, den manuella återbetalningen gick
  igenom (SCHEDULED, SUCCEEDED inom en minut, `refund_completed` till
  webhooken), och Wix behöll `providerTransactionId` på offlinebetalningen.
  Därför registreras kassans betalning nu som offline; ett källprov låser det
  (`aterbetalning.test.ts`).
- **Place Order lägger en egen väntande betalning** på hela beloppet (Wix
  Payments-order, inget leverantörs-id). Ordern blir ändå betald av vår, men
  panelen visar en väntande betalning. Den markeras nu avbruten efter vår
  registrering (`platshallarbetalningar`, `avbrytPlatshallare`, Update
  Payment Status CANCELED, provat på provordern). Faller det står den kvar, och
  inget annat påverkas.
- **Speglingen till Stripe är inte provad mot Stripe** än: provorderns
  betalning var registrerad online och gick inte att återbetala i Wix. Nätet
  på förhandslänken gick utan larm (`aterbetalningar: ordrar 2, 0 larm`).
  Den provas i nästa provköp med offlinebetalningen.
- Stripes testbetalning står kvar som dragen i testläget (inga riktiga
  pengar).

### Andra provköpet: Klarna från Leonards telefon (2026-11-06 13:15–13:30 UTC)

På samma förhandslänk, växeln på `prov` och testvaran synlig cirka 35
minuter. Klarna syntes i telefonen (svensk IP-adress) och Klarnas testmiljö
öppnades (playground: "Prefill NIN" och ett låtsat BankID; inget riktigt
BankID ska användas).
- **Ordern:** APPROVED och PAID, saldo 0, länet satt (Wix fyllde i
  `subdivision` själv ur adressen). Place Orders platshållare CANCELED, vår
  betalning APPROVED som offlinebetalning med Stripes id och betalsättet
  "Klarna".
- **Återbetalningen:** manuell återbetalning i Wix (`externalRefund`, utan
  kundmejl): `manuallyRefundable OFFLINE`, SCHEDULED och SUCCEEDED inom en
  minut, ordern FULLY_REFUNDED. Nätet på förhandslänken speglade den till
  Stripe (`aterbetalda: 1`; Klarnas återbetalning står först som `pending`).
  Andra körningen gav `aterbetalda: 0` och inga larm: ingenting
  återbetalades två gånger. Ordern avbröts sedan utan mejl och med
  återlagring.
- Stripe-kopplingen i Claude är inloggad på en annan sandlåda
  ("Fyndplats-sandlåda") än kontot vars testnycklar ligger i Vercel, så
  betalningarna syns inte där. Kontrollen gick via nätet.

### Adressfältet och länet (Leonard 2026-11-06: "kommer automatiskt adresser upp som det gjorde i Wix kassa", "stad och län")

- **Stripes adressfält** (Address Element, `adressfaltInstallningar` i
  `lib/kassa/stripe-klient.ts`) står i steg 2 när Stripe är på, i samma
  Elements som betalfältet (`use-stripe-betalning.ts`). Då är Googles
  adressförslag gratis (Stripes egen nyckel); Wix har inget öppet API för
  sina förslag. Fältet sätter betalningens leveransadress vid bekräftelsen,
  och därför gör servern det aldrig (se ☠️ under betalningen ovan). Fältet börjar ihopfällt (förnamn, efternamn, adress) och
  fäller ut sig när kunden väljer ett förslag eller "Ange adress manuellt".
  Uppmätt lokalt: förslaget fyller gata, postnummer och postort, och lägger
  länet i `state` ("Hallands län") fast det svenska formuläret inte visar
  något länsfält. Etiketterna är Stripes ("Postort"). Värdena går in i
  kassans fält vid varje ändring (`adressFranStripe` i `formular.ts`), så att
  servern prövar och skickar samma sak som förut. Adressrad 2 skickas som
  kunden skrev den (`rad2`, "lgh 1201"); kassans egna fält har kvar c/o.
- **Länet** är ett eget val under adressen med de 21 länen (ISO 3166-2,
  `LAN`). Det fylls i av sig självt ur Googles förslag, annars ur postnumret
  (`lanFranPostnr`, motorns tabell med blandzonerna, t.ex. Kungsbacka 434 i
  Halland), och kunden kan ändra det tills postnumret byts. Servern tar
  kundens giltiga val och annars postnumrets (`provaKassa`), och Wix-korgen
  får det som `subdivision` (`wixAdress` i `flode.ts`). Motorn gör om det
  till leverantörens provinsfält (`deriveProvince`; Aosoms klumporder har
  kolumnen "Province"), så Aosom och VEVOR får stad och län som förut, nu
  från kunden i stället för Wix gissning.
- **Platshållaren har fältets höjd** (uppmätt per bredd 2026-11-06): tre
  rader (193 px) under 442 px ytbredd, två rader (125 px, förnamn och
  efternamn bredvid varandra) från 442 px. Containerfrågan på `.adressYta`
  gör samma byte.
- ☠️ **Stripes ram börjar i mobilhöjd** (201 px) och glider efter `ready` till
  fältets höjd på ungefär 300 ms. Kassan sätter `adressLage` till `redo`
  först när ramen står still (`ramenStilla` i `stripe-klient.ts`,
  `narRamenStilla` i kroken, högst `RAM_VANTA_MS`), och tills dess ligger
  ramen utanför flödet under platshållaren (`data-adress="laddar"`). Förut
  hoppade formuläret 68 px på datorn när fältet ritades.
- **Utan Stripe** (Wix betalsida) står kassans egna fält kvar; "Ort" heter
  "Stad", och länsvalet finns där också.
- **Tom korg efter köpet** (`visaTomKorg`, `lib/kassa/vy.ts`): Wix ger
  besökaren en ny, tom korg med eget id efter köpet. Kassan ritade då hela
  formuläret med "Fri frakt" (en tom korg har ingen frakt; Leonards
  skärmbild 14:21). Nu visas "Varukorgen är tom" när korgen saknar varor,
  utom medan korgen hämtas eller en betalning pågår.
- **Leveranskortet** har mörk ram som stegens siffror i stället för orange;
  orange är knapparnas och länkarnas färg.
- ☠️ **Prov i webbläsaren: rulla fram före klick.** Chromium ritar inte
  Stripes ramar utanför bilden, och när de rullas in ändrar de höjd. Ett
  Playwright-klick direkt på en knapp under betalfältet kan då landa i ramen
  (provet `prov-premium2` rullar och väntar 0,9 s). En helsidesbild visar
  betalfältet tomt av samma skäl, fast det är ritat.

### Snabbkassan: Apple Pay och Google Pay överst (Leonard 2026-11-06: "Jag vill att vi har apple pay o google pay överst")

- **Överst på `/kassa`**, före steg 1: Stripes Express Checkout Element
  (`snabbknappar` i `lib/kassa/snabbkassa.ts`), sedan "eller fyll i dina
  uppgifter". Plånboken ger namn, e-post, telefon och leveransadress, så
  kunden fyller inte i något. Betalfältet i steg 3 visar då bara kort och
  Klarna (`BETALFALT`), och en länk där leder upp till knapparna.
- **En egen Elements-grupp** med samma belopp som betalfältet
  (`use-stripe-betalning.ts`): `elements.submit()` prövar varje fält i sin
  grupp, och adressfältet och betalfältet är tomma när kunden betalar med
  plånboken. Beloppet följer summeringen i båda grupperna.
- **Trycket** (`klickSvar`) svarar inom en sekund med raderna och fraktvalet,
  utan nätverksanrop. ☠️ **Beloppet i bladet är Elements-beloppet** (Wix total
  med frakt); raderna och fraktvalet är bara visning men summerar alltid till
  totalen (`snabbRader`: varje vara för sig när de går jämnt upp med Wix
  delsumma, annars en rad; rabatten negativ). Provat med 20 000 slumpade korgar.
- **Godkännandet** (`snabbBekrafta`): plånbokens uppgifter blir kassans
  formulär (`kundFranPlanbok` i `formular.ts`: efternamnet är sista ordet,
  länet ur regionen eller postnumret, medlemmens e-post går före plånbokens)
  och prövas med `provaKassa`. Sedan samma `/api/kassa/stripe/forbered` och
  samma slutförande som betalfältet. Fel före bekräftelsen går till bladet med
  `paymentFailed` (`invalid_shipping_address` för namn och adress,
  `address_unserviceable` för ett postnummer utan leverans), så att kunden
  rättar där. Betalningens id sparas före bekräftelsen, och en ny total från
  Wix stoppar betalningen som i betalfältet. `confirmPayment` får ingen
  fakturering från oss: plånboken har den.
- **Bara Apple Pay och Google Pay** i knapparna: Link, PayPal, Amazon Pay och
  Klarna `never`. ☠️ Klarna står aldrig överst (betaltjänstlagen, se
  `BETALFALT`).
- **Google Pay står på `always` utanför Apples webbläsare** (Leonard
  2026-11-14, `snabbknappar(s, planbok)`). Med `auto` visar Stripe knappen bara
  för den som redan har ett kort sparat hos Google: kassan på www visade ingen
  knapp alls i Chrome, och svaret kom efter 12–13 s. Med `always` kom knappen
  på 3–4 s i samma webbläsare; den som saknar kort lägger in det i Googles
  eget blad. ☠️ I Apples webbläsare (`ApplePaySession` finns: Safari, och alla
  webbläsare på iPhone) står Google Pay kvar på `auto`: Stripe visar Google
  Pay där bara med `always`, och då hade det stått två knappar i en plats som
  rymmer en.
- **Apple Pay står på `always` i Apples webbläsare** (Leonard 2026-11-15). Med
  `auto` visar Stripe knappen bara när plånboken har ett kort: på Leonards
  iPhone utan kort syntes platshållaren en halv sekund och försvann sedan,
  medan ett privat fönster visade knappen (där berättar Safari inte om
  korten). Med `always` syns knappen på varje enhet som klarar Apple Pay, och
  den som saknar kort lägger in det i Apples eget blad. En iPhone utan kort
  ger därför inget svar utan plånbok längre; det gör bara en enhet där Apple
  Pay inte går att använda. ☠️ Utanför Apples webbläsare står Apple Pay kvar
  på `auto`: med `always` visar Stripe Apple Pay också i Chrome på Mac,
  bredvid Google Pay. Aldrig båda plånböckerna på `always` i samma webbläsare
  (provet fäller det).
- ☠️ **`layout.overflow: "never"` bara med `maxRows: 0`.** Annars kastar Stripe
  IntegrationError och inga knappar ritas (lokalt prov 2026-11-06). Knapparna
  monteras därför i `try`: ett fel i snabbkassan får aldrig stoppa
  formuläret och betalfältet.
- **Knapparna skapas FÖRST, Stripe.js förladdas med sidan** (Leonard
  2026-11-07: knappen syntes först efter flera sekunder). `page.tsx` lägger
  `preload(STRIPE_JS, { as: "script" })` när det finns en varukorg (kakan
  `fp_cart` eller medlemskorgens), så filen hämtas med sidan, eller redan när
  lådan förhämtar kassan, i stället för i effekten efter hydreringen.
  ☠️ `STRIPE_JS` måste vara exakt den adress `loadStripe` lägger in, annars
  hämtas filen två gånger (provet i `stripe-klient.test.ts` kör paketets egen
  `loadStripe`). Knapparnas grupp skapas före adressfältets och betalfältets,
  så att deras uppslag hos Stripe går först i telefonens kö.
- **Platshållaren är Apples egen knapp i Safari** (`.snabbSkelett` med
  `-webkit-appearance: -apple-pay-button`, typ buy, svart, 10 px hörn och
  50 px hög som Stripes Apple Pay-knapp): kunden ser Apple Pay från första
  ritningen. Den tar inga tryck. Stripes Apple Pay-knapp är 50 px hög
  (inline-stil i ramen) fast `buttonHeight` är 52, uppmätt 2026-11-08.
- **Platshållaren för Google Pay är svart** (`html[data-planbok="google"]
  .snabbSkelett`), så att bara knappens text tonar fram. Den grå skimmern finns
  kvar som grundval, när skriptet inte har satt något.
- ☠️ **Googles knapp har en grå kant som inte är helt tät** (Leonard
  2026-11-14: "Se till att google pay inte har visuella buggar som apple pay
  hade"). Mätt i en skärmfilm, ruta för ruta, och i fyrdubbel förstoring:
  - Kanten är en punkt bred runt hela knappen. Låg platshållaren under den
    syntes den igenom: kanten var mörkgrå i två sekunder och ljusnade när
    platshållaren togs bort (595 av 9 216 bildpunkter i ett hörn, upp till 165
    nivåer av 255). Det är samma slags fel som Apple Pays två punkter.
  - Platshållaren ligger därför en punkt innanför platsen (`inset: 1px`), med
    11 px hörn. Med 9 px följde bågen kantens insida och syntes igenom i 28
    bildpunkter. Med 11 px ändras ingen bildpunkt mer än 2 nivåer.
  - **Skimmern ligger i `::after` och tonar ut på 0,15 s när Stripe svarar.**
    På själva platshållaren byttes rörelsen mot borttagningens i samma
    ögonblick, och det ljusa bandet hoppade till höger kant och stod stilla
    där under knappen.
  - ☠️ Regeln för läget `redo` (tre klasser) ska väga tyngre än Google-regeln:
    annars stänger `animation: none` av borttagningen.
  - Filmen: `film.cjs` (CDP screencast, varje ritad ruta, mörkt och ljust i
    knappens inre, kanten för sig). Hörnen: `horn.cjs` (tre lägen i fyrdubbel
    skala). ☠️ Pausa aldrig platshållarens rörelse i ett prov utan att
    begränsa pausen till läget `laddar`: borttagningen är en rörelse på samma
    element, och provet visade då aldrig knappen ensam.
  - Mätt efter rättelsen, i Chromium på dator och i Android-läge: platsen
    svart från kassans första ritade ruta, ingen ljus blinkning, varje ruta
    lika från 0,8 s efter svaret, platsen och formuläret stilla.
  - Inte mätt: en riktig Android-telefon, Firefox, och knappen i mörkt läge.
- ☠️ **Stripes knapp tonar in EFTER `ready`** (Leonard 2026-11-08: "flimrar
  det till ett ögonblick"). Uppmätt inne i Stripes ram: vyn
  `.p-ExpressCheckoutView` läggs in runt svaret (upp till 150 ms efter) och
  tonar från 0 till 1 med `transition: opacity 400ms ease 160ms`. Förut togs
  platshållaren bort vid svaret, och knappens plats var vit en halv sekund.
  Nu ligger den UNDER Stripes ram (`.snabbKnappar` är positionerad och står
  efter den i flödet; ramen är genomskinlig tills knappen syns), står kvar i
  läget `redo` och tonar bort först 2 s efter svaret
  (`.snabb[data-snabb="redo"] .snabbSkelett`). Skärmfilm av knappens yta med
  riktiga Stripe i produktionen: förut svart till vitt i rutan efter svaret,
  med rättelsen svart hela vägen till 2 s.
- **Gissningen före Stripes svar** (`planbokGissning`, 2026-11-14) styr
  platsen, platshållaren, texten och Google Pays läge:
  - `apple`: webbläsaren har `ApplePaySession`. Allt som förut.
  - `google`: alla andra webbläsare. Platsen hålls, platshållaren är svart och
    texten säger Google Pay.
  - `ingen`: en inbyggd webbläsare i en app på Android (märket `; wv)` i
    webbläsarens namn), som den som trycker på en annons i Instagram, Facebook
    eller TikTok hamnar i. ☠️ Där svarade Stripe utan plånbok efter cirka 3 s,
    både med `always` och med `auto`, också när `PaymentRequest` fanns kvar
    (mätt 2026-11-14 med apparnas namn på webbläsaren, inte i en riktig app).
    Ingen plats hålls: annars försvann rutan och formuläret hoppade upp.
  `PaymentRequest` säger ingenting om Stripes svar: med `always` kom knappen
  också när den togs bort ur webbläsaren.
- **Texten nämner rätt plånbok från första ritningen**: medan Stripe svarar
  står båda namnen i sidan (`.planbokApple`, `.planbokGoogle`), och CSS:en visar
  det ena efter `data-planbok`. React vet inte webbläsaren förrän efter
  hydreringen, och ett namn som byttes då hade synts. När Stripe har svarat
  står plånbokens namn ur svaret (`planbokNamn`).
- **Platsen hålls från första renderingen** (också på servern) med en
  platshållare i knappens höjd, utom i läget `ingen`. Rutan som dök upp
  efter hydreringen knuffade ner formuläret 256 px. Saknas plånbok tas platsen
  bort när Stripe svarar, eller efter 12 s. Utan plånbok står rutan utanför
  sidan (`data-visas="nej"`), eftersom knapparna måste vara monterade för att
  Stripe ska kunna svara. Mätt 2026-11-14 med grenens bygge under
  www.fyndplats.se (Chromium, dator och Android, hel sidladdning och mjukt
  sidbyte från varukorgen): rutan syns från första ritningen, knappen kommer
  efter 3,3–4,0 s, och kontaktrutan står på samma plats hela vägen.
  ☠️ Stoppas Googles skript (`pay.google.com`, till exempel av ett filter)
  svarar Stripe utan plånbok efter cirka 3,6 s: platsen släpps och formuläret
  flyttas upp 236 px en gång. Förut hölls platsen bara där Apple Pay finns:
  med `auto` tog Stripes kontroll av Google Pay 12–13 s och slutade nästan
  alltid utan knapp.
- **Före hydreringen avgör `PLANBOK_SKRIPT`** (`lib/kassa/snabbkassa.ts`, körs
  först i `app/layout.tsx`): det sätter `data-planbok="apple"|"google"|"ingen"`
  på `<html>`, och CSS:en flyttar ut rutan medan Stripe svarar
  (`data-snabb="laddar"`) i läget `ingen`. Annars stod platsen kvar tills
  React tagit över och försvann sedan. Skriptet ligger i layouten och inte på
  kassasidan, eftersom kunden oftast kommer till `/kassa` med ett mjukt
  sidbyte från varukorgen, och då körs inga skript i sidans HTML. Kassan och
  knapparna läser webbläsaren med `webblasarensPlanbok()`, och proven kör
  skriptet mot `planbokGissning`, så att de aldrig svarar olika. ☠️ Attributet
  hette förut `data-applepay`: en regel på det gamla namnet träffar aldrig.
- **Minnet** (`PLANBOK_MINNE`, `fp_planbok_tom`, 2026-11-15): svarar Stripe
  uttryckligen utan plånbok (en blockerare stoppar Googles betalskript, eller
  Apple Pay saknar kort) sparar webbläsaren det i 30 dygn, och nästa besök
  hålls ingen plats. Förut hölls platsen varje gång och släpptes efter 3–4 s,
  och formuläret hoppade upp 236 px. Skriptet och kassan läser minnet
  (`webblasarensPlanbokPlats()`); knapparna läser bara webbläsaren
  (`webblasarensPlanbok()`). ☠️ Får knapparna minnet blir en Safari utan kort
  `ingen`, Google Pay hamnar på `always` och två knappar står där platsen
  rymmer en. Bara `ready` utan plånbok sparas, aldrig tidsgränsen eller
  `loaderror`, och en knapp en senare gång glömmer minnet direkt.
- ☠️ **Stripes ram har −4 px marginal** (plats för fokusringen). Utan egen
  formateringskontext kollapsade den genom ytan runt fältet, och allt under
  flyttade 4 px när Stripe monterade. `.snabbYta` och `.betalfalt` har därför
  `display: flow-root`.
- **Mätt med webbläsarens egen CLS** (`PerformanceObserver` för
  `layout-shift`, scratchpad `snabb/g-cls.cjs`, 2026-11-06): formuläret
  flyttar inte alls när Stripes fält kommer, varken i 390 eller 1280 px. Det
  som är kvar på datorn (0,013) är summeringen när korgens rader kommer.
- **Kräver domänen:** Apple Pay och Google Pay syns bara när
  `www.fyndplats.se` är registrerad i Stripe (Inställningar →
  Betalmetodsdomäner), i testläget och i live var för sig, och bara över
  HTTPS. Lokalt och på en skyddad förhandslänk syns inga knappar (Stripe
  varnar i konsolen); flödet provades därför lokalt med en spelad Stripe.js
  (scratchpad `snabb/b-spelad.cjs`): tryck, nej i bladet, ny total, `/tack`.

**Kvar före riktiga kunder:** live-nycklarna i Production (en begränsad
nyckel med PaymentIntents skriva, Charges läsa, Refunds skriva och Disputes
läsa); webhooken (`payment_intent.amount_capturable_updated` och
`payment_intent.succeeded` till `https://www.fyndplats.se/api/stripe/webhook`,
hemligheten i `STRIPE_WEBHOOK_SECRET`); domänen för Apple Pay och Google Pay
(snabbkassan syns först då); egna påminnelser om övergivna kassor;
Stripe-inställningarna (kortutdragets text "FYNDPLATS", Stripes egna kvitton
av, Radar-regler); ett köp med Apple Pay från Leonards telefon.

**Live för alla sedan 2026-11-06 21:33:57 UTC** (Leonards "Nu"). Före påslaget:
live-nycklarna, webhooken och domänen var inlagda; Leonards köp med Apple Pay
blev betalt och godkänt; återbetalningen i Wix speglades till
Stripe på tre sekunder. Korgar som betalats i kassan fick ingen övergiven kassa
i Wix (två provköp mätta efter 5 och 8 timmar), så den som handlar får inget
påminnelsemejl.

### Påminnelsen om en övergiven varukorg (Leonard 2026-11-06: "Ska du inte fixa övergiven kundvagn mail för vår nya kassa?")

Mejlen (mejl 1–3, `lib/abandoned-cart.ts`) köas ur Wix övergivna kassor
(`lib/abandoned-checkout-poll.ts`, var femtonde minut). Två saker fungerade inte
med vår kassa (`lib/kassa/aterta.ts`):

1. **Wix skapar en övergiven kassa bara när korgen har köparens e-post.** Wix
   egen kassa fick den när kunden gick vidare från kontaktsteget; vår kassa satte
   den först vid Betala (`forbered`). Den som skrev sin e-post och gick fick inget
   mejl. Nu skickar kassan e-posten (och numret, om det är giltigt) till korgen
   när kunden lämnar fältet, väljer e-postförslaget eller har sparade uppgifter:
   `POST /api/kassa/kontakt` → `sattKontakt` (bara `customerInfo`). En gång per
   korg och uppgifter. Medlemskorgen hoppas över: den har kontots e-post och får
   inga påminnelser (`lib/medlem/overgiven.ts`).
2. **Mejlets knapp ledde till Wix kassa** (`checkoutUrl`). När `kassa.lage` är
   `pa` får mejlet i stället `/kassa/aterta?k=<korgens id>.<HMAC>`
   (`valjAterLank`). Sidan frågar `/api/kassa/aterta`, som läser korgen och prövar
   varorna mot katalogen som "Köp igen". Det som saknas i besökarens varukorg
   läggs i (`attLaggaI`, så att en andra öppning inte ger dubbletter), och kunden
   går till `/kassa`. Rabattkoden i mejl 3 följer med som `?kod=` (`medKod`) och
   läggs på i kassans första räkning. Är kassan avstängd öppnas varukorgen i
   stället; är en vara slut eller borta står det på sidan, med en knapp vidare.

3. **Mejlet gick ut efter köpet när köpet gjordes med en annan e-post.**
   Kö-raden bär den övergivna kassans id, inte korgens, så konverteringen
   (`onOrderConverted`) hittar den bara på e-post. Wix markerar däremot den
   övergivna kassan RECOVERED när korgen blir en order, också i vår kassa (mätt
   2026-11-06: fyra sekunder efter ordern; köpet hade en annan e-post och ett
   mejl stod på tur en kvart senare). Nu frågar `processDueCart` Wix före varje
   steg (`aterVunnenIWix`): RECOVERED → vagnen blir `converted`, en utdelad kod
   återkallas och inget mejl går. 404 → mejlet går som förut; andra fel → vagnen
   prövas nästa kvart.
4. **Mejlet gick ut efter köpet när köpet gjordes i en annan korg.** Kunden
   lämnar en korg med sin e-post (till exempel när Klarna öppnar en annan
   webbläsare) och köper i en ny korg. Den första korgen blir övergiven en timme
   senare, alltså efter köpet: konverteringen vid ordern hittade ingen vagn, och
   Wix markerar den inte RECOVERED, eftersom just den korgen aldrig blev en order
   (första riktiga Klarna-köpet i nya kassan, 2026-11-06). Nu läser
   `processDueCart` före varje steg orderspegeln (`ordrar.kopSedan`): en order
   med samma e-post från tre timmar före den övergivna kassans tid
   (`kopSparrSedan`) → vagnen blir `converted`, en utdelad kod återkallas och
   inget mejl går (`skipped_bought`).

☠️ Länkens HMAC använder `NEWSLETTER_SECRET` eller `CRON_SECRET` (minst 16
tecken) med eget prefix. Saknas båda får mejlen Wix länk, och pollaren varnar i
loggen. Utan HMAC hade ett id som läckt räckt för att se en annan kunds varor.

☠️ Mejl som köades före ändringen har kvar Wix länk; de fungerar, men leder till
Wix kassa.

Integritetstexten säger att vi kan påminna om en varukorg du inte slutförde
(berättigat intresse, högst tre mejl på tre dagar och en påminnelse per 30
dagar, avregistrering i mejlet).

## Medlemskapet, etapp E2: medlemspriset och kassan med låsta priser (2026-11-04)

Byggt men avstängt. Växeln är fältet `pris` i raden
`FyndplatsButikInstallningar/medlemskap`: `av` (eller inget fält), `test` (bara
medlemmar med `testare: true`) eller `pa`. Den är skild från `lage`.

- **Prismotorn** (`lib/medlem/pris.ts`): radpriset är A·(1−d) avrundat till
  öre. Stoppar golvet G det, blir rabatten den högsta HELA procent som golvet
  tillåter, inte golvet självt (Leonards ja 2026-11-04). Annars hade rutan
  sagt "högst 1 %" om 1,4 %, eller "högst 0 %" med ett lägre pris. Tillåter
  golvet inte ens 1 % blir det ingen rabatt, och kunden ser att varan inte
  omfattas. Aldrig under G och aldrig över A. Golvet G = C × 1,10 × 1,25
  kommer från motorns `/api/medlem/golv` (`golv-klient.ts`, hemligheten
  `REVIEW_INGEST_SECRET`).
  ☠️ Kostnaden och golvet lämnar aldrig servern; webbläsaren får radpriset,
  procenten och skälet till en begränsning.
- ☠️ **Styckpriset avrundas till hela ören, och samma pris går till Wix.**
  Rutan på produktsidan visar örena (`lib/medlem/kronor.ts`); avrundat till
  kronor hade den sagt något annat än kassan.
- **Fraktskyddet** räknas mot 500,00 kr (E0-5). Ett företag får den högsta av
  nivån och ordertrappan, aldrig båda.
- **Produktsidan**: `/api/medlem/priser` (privat, ingen cache) och rutan
  `components/medlemspris.tsx` i nivåns metall, samma nyckel som medlemskortet
  (`lib/medlem/niva-nyckel.ts`). Utan tecknet `fp_medlem_inne` görs inget
  anrop.
- **Rutan står där direkt** (Leonard 2026-11-13: företagsrutan kom efter
  nästan en sekund och hoppade in; samma för privata Silver–VIP).
  `lib/medlem/tidig.ts` och `lib/medlem/medlemspris-klient.ts`:
  - Produktsidans HTML bär ett litet skript som startar hämtningen medan sidan
    läses, inte när Reacts skript har startat. Rutan tar över samma löfte
    (`window.__fpMp`). Vid en mjuk navigering har kortet (`PrefetchLink`,
    pekaren vilar 120 ms, eller fingret) redan hämtat; ett svar yngre än 30 s
    hämtas inte om.
  - Platsen hålls från första bilden i nivåns metall, med förra rutans höjd
    (`localStorage` `fp_mp_vy`, `data-mp` på `<html>`), så att inget under
    rutan flyttar sig. En Brons-medlem sparar höjden 0 och får ingen plats.
    Platsen släpps när svaret ritas, senast efter 6 s. Ingen plats på en
    reavara: där står en kortare rad.
  - Rutten läser växeln, medlemmen, reglerna, liggaren och företaget i ETT
    `Promise.all`, och startar produkten, golvet (för sidans variant-id, `v`)
    och prishistoriken innan profilen är klar. Utan session startar ingenting.
    `Server-Timing` visar profil, pris och total.
  - ☠️ Skriptet och `hallPlats` i klienten följer samma regler;
    `lib/medlem/tidig.test.ts` kör skriptet i en sandlåda och jämför dem i
    över tusen fall. Ändra båda eller ingen.
- **Jämförelsen som kedjorna gör den** (Leonard 2026-11-05: "kolla hur andra
  stora sidor gör och härma", i stället för att fråga Konsumentverket).
  Elgiganten visar klubbpriset med priset för den som inte är medlem och
  "Lägsta pris senaste 30 dagar" vid en sänkning. Hos oss
  (`lib/medlem/jamforelse.ts`):
  - Under medlemspriset står det belagda tidigare priset, överstruket och med
    Konsumentverkets uttryck framför, genom `components/tidigare-pris.tsx`
    (samma som rean). Det är `jamforprisFor` ur prishistoriken, alltså det
    lägsta priset de senaste 30 dagarna, och det visas bara när medlemspriset
    ligger under det.
  - ☠️ **Nivåns procent står bara när det tidigare priset är listpriset.** En
    procent ska räknas mot det belagda priset; nivåns procent räknas mot
    listpriset.
  - ☠️ **Prishistoriken är produktens lägsta variantpris** (price-snapshot).
    Har varianterna olika pris visas ingen jämförelse och ingen procent, bara
    "Ditt medlemspris".
  - Prishistoriken sparas i tio minuter per produkt och instans, och
    jämförpriset räknas ur den för varje pris; ett fel ger ingen jämförelse,
    aldrig en gissad.
- ☠️ **Medlemspriset läggs aldrig ovanpå en rea** (Leonard 2026-11-05, 2.1:
  "det ska inte kunna kombineras med rabattkoder eller fyndauktionsrabatterna";
  rean är en rabatt av samma slag). En rad är rea när Wix `fullPrice` ligger
  över priset (varukorgen) eller `compareAtPrice` över priset (V3,
  produktsidan). Undantaget heter `rea` i prismotorn, och rutan säger "Varan är
  redan på rea". Rabattkoderna är låsta i medlemskassan (E0-3), och
  fyndauktionens varor har undantaget `auktion` från motorns golv.
- **Kassan** (`/api/medlem/kassa`, `lib/medlem/medlemspris.ts`) bygger en Cart
  V2 med E0:s regler: `openAccess`, landet SE, kanalen WEB, låst kupong och
  presentkort, och samma pris i `salePrice` och `fullPrice` på varje rad från
  Wix Stores. Den kontrollerar att Wix bär priserna och sparar prisbeslutet i
  `FyndplatsPrisbeslut` (ADMIN, index på `purchaseFlowId` och
  `medlemsId`+`skapad`) innan kunden får adressen. Går något fel används den
  vanliga kassan.
- ☠️ **Låsta korgar äldre än ett dygn tas bort** varje timme kl :41
  (`/api/cron/medlemskorgar`, `lib/medlem/korgstadning.ts`). Varukorgens id är
  kassans id, så den gamla länken slutar fungera och nästa köp räknas om.
  Utfallet står på beslutet: `kopt`, `borttagen` eller `saknades`.
- ☠️ **Mejlen om övergiven kassa hoppar över medlemskorgar** (en korg med
  prisbeslut, `lib/medlem/overgiven.ts`), både i webhooken och i pollaren. Kan
  det inte avgöras väntar kassan till nästa kvart.
- **Medlemskorgen betalas i vår kassa** (Leonard 2026-11-06: medlemmar och
  företag betalar i samma kassa som alla andra). Gäller vår kassa med Stripe
  för besökaren (`egenKassaMedStripe`, läget och provkakan) svarar
  `/api/medlem/kassa` och `/api/medlem/offert/kassa` med `/kassa` och sätter
  kakan `fp_kassa_korg` på den låsta korgen (httpOnly, ett dygn). Annars Wix
  kassa som förut. `lib/kassa/lastkorg.ts` har reglerna, `lib/kassa/medlemskassa.ts`
  serverns del.
  - ☠️ **Korgens id står aldrig i adressen** (GA4 och Meta läser den). Sidans
    server läser kakan och använder korgen bara om prisbeslutet hör till den
    inloggade medlemmen, saknar utfall och korgen inte blivit en order.
  - Snabbkassan (Apple Pay, Google Pay överst) betalar den låsta korgen på
    samma sätt. Medlemmens e-post på korgen går före plånbokens
    (`kundFranPlanbok`, `epost`), så att köpet räknas på kontot, och rutan
    säger "Ditt medlemspris är med i beloppet" i stället för att erbjuda en
    rabattkod.
  - Kassan döljer rabattkoden ("Ditt medlemspris är med …"). "Ändra" släpper
    den låsta korgen (`/api/kassa/lastkorg` `slapp`), och varukorgens "Till
    kassan" räknar en ny. Stämmer varukorgen inte längre med den låsta (andra
    varor eller antal, eller en annan varukorg) släpps den också.
    ☠️ En offert jämförs aldrig: dess rader är offertens, inte varukorgens.
  - ☠️ **Efter köpet tas det köpta bort ur besökarens korg, en gång per
    beslut.** Den låsta korgen var en kopia. Webhooken gör det för varje
    godkänd order, också Wix kassas (förut blev varorna kvar där), och kassans
    sida ber om det direkt efter köpet (`kopt`, med kakan). Bara en betald
    order ur just den låsta korgen, och `taRensning` (compare-and-set på
    `besokarensKorgRensad`) gör att de två aldrig båda tar bort. En offert
    rör inte besökarens korg.
  - ☠️ **Servern läser korgen i Cart V2-formen** (`GET /ecom/v2/carts/{id}`:
    `source.catalogReference`, `quantityInfo.confirmedQuantity`,
    `pricing.unitPrice` och `pricing.breakdown.fullPrice`). `lasWixVarukorg`
    kände bara V1-formen, så varje riktig korg blev "tom": varukorgen visade
    listpriset, "Till kassan" gick till vanliga kassan med fullt pris,
    kontrollen av den skapade korgen (`korgenBarPriserna`,
    `korgenBarRaderna`) godkände aldrig någon, och "Spara varukorgen" sparade
    ingenting. Proven använde V1-formen, och provköpet 10175 byggde den låsta
    korgen för hand. Hittat i den visuella auditen 2026-11-06 på
    förhandsbygget. Rean ligger i `breakdown.fullPrice` (mätt: 1 519 mot
    styckpriset 1 029), så en reavara får fortfarande inget medlemspris.

Före `test`: Leonards medlemsrad med `testare: true` och ett prov på en
förhandslänk fram till Wix-kassan. Leonard lägger ingen provorder (2026-11-05:
"Du får testa så det funkar på annat sätt"); att Wix behåller vårt pris genom
betalningen visade provordern 10167 i E0. Ingen tvåfaktor för admin (Leonard
2026-11-05). J1 skickas inte: jämförelsen följer kedjorna (ovan). Aldrig under
Black Week 23–29/11.

## Medlemskapet, etapp E3: företagskontot (2026-11-04)

Bakom samma växel som E2 (`pris`: `test` bara för testare, `pa` för alla).
Ett företag läggs till på ett befintligt konto, högst ett per konto i E3.

- **Ansökan** på Mina sidor (`app/konto/foretag.tsx`, `/api/konto/foretag`):
  namn, organisationsnummer (Luhn medan kunden skriver, `orgnr.ts`),
  fakturaadress, valfri leveransadress, kryss för näringsverksamhet och
  villkoren. Servern prövar allt igen (`lib/medlem/foretag.ts`). Raden heter
  `<medlemsId>__foretag` i `FyndplatsMedlemsprofiler` (index
  `typ-status-ansokt`) och får status `granskas`; butiken mejlar info@.
  Ett skick som stoppas av fel ger fokus på det första felet, och varje fält
  med fel har `aria-invalid` och sin feltext i `aria-describedby` (`felAttr`).
  Förut stod fokus kvar på knappen och en skärmläsare fick inget besked
  (auditen 2026-11-06).
- **Bolagsverkets uppslag** (`lib/medlem/bolagsverket.ts`, 2026-11-06): API:t
  Värdefulla datamängder v1 (gratis, öppen data). Token med client credentials
  på `portal.api.bolagsverket.se/oauth2/token`, scope
  `vardefulla-datamangder:read`; `POST /organisationer` på
  `gw.api.bolagsverket.se/vardefulla-datamangder/v1` med
  `identitetsbeteckning` (en enskild firma: personnumret med sekel). Nycklarna
  `BOLAGSVERKET_CLIENT_ID` och `BOLAGSVERKET_CLIENT_SECRET` ligger i
  Production och Preview (Leonard 2026-11-06). Beskrivningen (OpenAPI) är
  öppen i utvecklarportalen: `/api/am/devportal/v3/apis/<id>/swagger`.
  - **Leonards regel:** ett företag som Bolagsverket visar som aktivt
    (inte avregistrerat, inget förfarande, inte "ej verksam", alla källor
    svarade) godkänns direkt med det **registrerade** namnet (`beslutAv:
    "bolagsverket"`, kundens namn i `namnAngivet`). Allt annat får `granskas`
    med orsaken i fältet `bolagsverket`, och butiken mejlas orsaken.
  - Formuläret slår upp namnet medan kunden skriver (`steg: "sla-upp"`), bara
    för juridiska personer och högst 15 gånger per konto och tio minuter.
  - ☠️ Saknas nycklarna, eller svarar Bolagsverket fel, går ansökan till kön som
    före uppslaget. Uppslaget kastar aldrig, och numret loggas aldrig.
- **Granskningen** görs i motorns `/admin/medlemmar` (kön överst), som visar
  Bolagsverkets besked. Godkänt företag mejlas av
  timjobbet `/api/cron/medlemskorgar` inom en timme
  (`lib/medlem/foretagsmejl.ts`, märkt exakt en gång).
- ☠️ **En enskild firmas organisationsnummer är ett personnummer** (F4). Kunden
  ser det maskerat (`orgnrVisas`), mejlet till info@ likaså, och det loggas
  aldrig; hela numret syns bara i motorns admin.
- **Profilen "Du handlar som"** bärs i sessionen (`profil: "foretag"`) och i
  tecknet `fp_medlem_inne=f`, satt av `/api/konto/profil`. ☠️ Tecknet ger
  ingen rätt: `medlemsprofil()` läser företagsprofilen vid varje prissättning
  och prissätter som privatperson om företaget inte är godkänt eller dess
  villkor är gamla (E3-12, `VILLKOR_FORETAG_VERSION`).
- ☠️ **Ingen `router.refresh()` i kontots kod** (2026-11-15). I Next 16.2.6
  (React-canaryn 20260317) blir en `router.refresh()` på en sida med Suspense
  ibland aldrig klar: svaret kommer i sin helhet, men vyn står kvar och
  knapparna är spärrade. Mätt på profilbytet: 2–5 av 12 fastnade
  (vercel/next.js#86055, rättat av facebook/react#36134 i Next 16.3). Bytet
  laddar därför inte om: raden "Du handlar som" läser tecknet
  `fp_medlem_inne` på händelsen `fp-konto-andrat` (`app/konto/handlar-som.tsx`),
  och de sparade korgarna uppdateras i webbläsaren (`synligaKorgar`). Mjuka
  `next/link`-byten till en annan adress påverkas inte (30 av 30).
  `lib/konto-fart.test.ts` fäller en `.refresh()` under `app/konto`.
- **Priserna**: produktsidans ruta visar företagspriset exkl. moms, märkt, och
  ordertrappan som tabell med "högst x %" när golvet stoppar trappan (E3-8).
  Varukorgen visar varor och frakt exkl. moms, momsen, totalen inkl. moms,
  "Lägg till x kr exkl. moms för y %" och att kassan visar priserna inkl. moms.
  Beloppen exkl. moms räknas på servern (`exklMoms`, half up).
- **Villkoren** står på `/villkor/foretag` (noindex), samma text som
  `docs/medlemskap-foretagsvillkor-utkast.md`. Ifyllda 2026-11-05 utan jurist
  (Leonards svar 3.2: "Vi får söka upp i lagboken om vi är osäkra"); varje
  lagrum de nämner är läst på riksdagen.se, och listan står sist i
  dokumentet. Versionen är 1, för ingen har godkänt utkastet. ☠️ Ändras
  texten i sak höjs `VILLKOR_FORETAG_VERSION`, och varje företag godkänner den
  nya versionen på Mina sidor innan kontot prissätts som företag igen.

- **Offerten** (`lib/medlem/offert.ts`, `FyndplatsOfferter`, ADMIN):
  "Begär offert" visas i varukorgen för ett godkänt företag när prismotorn
  säger `offert` (6 exemplar av samma vara eller 20 000 kr exkl. moms, F7).
  Förfrågan sparar raderna med listpris (bara Wix Stores), högst tre
  obesvarade per konto, och mejlar info@. Admin sätter styckpriserna i
  motorn: aldrig under golvet, aldrig över listpriset. Offerten gäller i 14
  dygn från prissättningen.
- **`/offert/<id>`** kräver inloggning med kontot som begärde den (annars
  404) och visar raderna exkl. moms. "Till kassan" (`/api/medlem/offert/kassa`)
  bygger en låst korg med offertens priser (`lastKorgKropp`, samma regler som
  medlemskorgen) bara inom giltighetstiden och när kontot handlar som
  företaget, och sparar prisbeslutet med `kalla: "offert"` och `offertId`.
- ☠️ **Timjobbet sköter offerternas läge** (`lib/medlem/offertjobb.ts`):
  betald när en av offertens kassor blev en order (kollas före utgången, så
  att ett köp i sista stund inte märks som utgånget), utgången efter sista
  dagen, och mejlet "Offerten är klar" exakt en gång. Den låsta korgen tas
  bort efter ett dygn som alla medlemskorgar, och övergivna kassor hoppar
  över den.

- **Förskottsfakturan** (villkoren 5.1, Leonards svar 3.3 2026-11-05): ett
  godkänt företag får knappen "Betala mot förskottsfaktura" i varukorgen
  (`components/forskott-knapp.tsx`, `/api/medlem/forskott`). Servern
  prissätter korgen som företag och skapar ordern själv med
  `POST /ecom/v1/orders` (`forskottsorderKropp` i `lib/medlem/varukorg.ts`):
  obetald, handlagd (`BACKOFFICE_MERCHANT`), `Förskottsfaktura.` först i
  noteringen och frakten enligt `lib/shipping.ts`. Beloppen fylls i som Wix
  själv gör (provordern 10167 är facit i provet). Motorn skickar fakturan
  med förfallodag efter högst 10 dagar och beställer varorna först när
  ordern är betald; butikens orderbekräftelse säger detsamma
  (`lib/order-betalning.ts`).
  - ☠️ Beslutet sparas före ordern med en insert på besökarens korg
    (`forskott_<korg>`): två tryck eller två flikar ger aldrig två ordrar.
    Ett tydligt nej från Wix (4xx) släpper spärren; tystnad eller 5xx gör det
    inte, eftersom ordern då ändå kan finnas.
  - ☠️ En order som inte är obetald, handlagd och med våra belopp
    (`kontrolleraForskottsorder`) avbryts direkt, med varorna tillbaka i
    lager och utan mejl.
  - ☠️ En enskild firmas nummer är ett personnummer och skrivs aldrig i
    ordern; fakturan får bara namnet (villkoren 5.2 säger "för ett bolag").
  - Create Order tål 5 anrop i timmen för en opublicerad app. Ett 429 ger
    kunden "försök igen om en stund, eller betala i kassan".

- **Kvittot med företagets namn för kort och Klarna** (villkoren 5.2, byggt
  2026-11-05). Kassan sparar företaget på prisbeslutet när kunden går till
  kassan (`foretagPaBeslut` i `lib/medlem/varukorg.ts`): `foretagNamn`,
  `foretagFaktura` och för ett bolag `foretagOrgnr`. Motorns timkörning
  `/api/cron/faktura` (:10) hittar den betalda ordern på `purchaseFlowId` och
  mejlar sitt kvitto som PDF med företaget som köpare, inom en timme
  (motorns ämnesfil 46). Förskottsorderns faktura och kvitto bär namnet ur
  ordern.
  - ☠️ En enskild firmas nummer är ett personnummer och läggs aldrig på
    beslutet; motorn skriver dessutom bara ut ett bolags nummer (siffra tre
    och fyra minst 20).
  - ☠️ Fälten läses i motorn med samma namn (`foretagUrBeslut`). Byt aldrig
    namn på dem i bara det ena repot.
  - ☠️ Butikens och motorns E3 mergas samma natt. Utan motorns del får ett
    företag som betalar med kort eller Klarna inget kvitto, och villkoren
    lovar ett.

- **"Köp igen"** på varje order på Mina sidor med en fysisk vara (specen:
  "sparade varukorgar och Köp igen"; byggt 2026-11-05). `/api/konto/kop-igen`
  läser ordern ur orderliggaren på kontots e-post, och numret väljer bara
  bland medlemmens egna ordrar. Katalogen avgör vad som går att köpa nu
  (`lib/medlem/kop-igen.ts`): en vara som är slut eller inte längre säljs, eller
  vars variant är borta, läggs inte i, och beskedet under knappen säger hur
  många. Resten läggs i varukorgen i ETT anrop (`addMany` i
  `components/cart.tsx`), med orderns antal (högst 99) och dagens pris.
  Variant-id skickas bara för en produkt med flera varianter, som på
  produktsidan. Gäller alla medlemmar, inte bara företag.

- **Sparade varukorgar** på Mina sidor (byggt 2026-11-05, `lib/medlem/sparade.ts`,
  kollektionen `FyndplatsSparadeKorgar`: ADMIN, indexet `medlem-skapad`).
  Medlemmen sparar varukorgen som den är under ett namn och lägger den i
  varukorgen igen med ett tryck. `POST /api/konto/sparade { cartId, namn }`
  läser besökarens Wix-korg på servern (`lasWixVarukorg`), så det som sparas
  är Wix egna rader och aldrig vad webbläsaren påstår. Bara varor ur Wix
  Stores, samma vara blir en rad, högst 100 rader, antal 1–99, högst 20 korgar
  per konto. Inget pris sparas: `POST /api/konto/sparade/kop { id }` prövar
  korgen mot katalogen som "Köp igen" (`somOrderrader` → `kopIgen`), och resten
  läggs i med `addMany` och dagens pris. Ett tomt namn blir "Varukorg <dag>".
  - ☠️ Att SPARA följer växeln för E2/E3 (`prisOppet`, `sparadeSektion`):
    korgarna är uppgifter om kontot som integritetstexten för E1 inte nämner.
    Korgar som redan finns syns alltid, så att de går att lägga i varukorgen
    och ta bort.
  - ☠️ `DELETE /api/konto/sparade?id=sk_…` tar bara bort kontots egen korg
    (villkoret `medlemsId` i Wix), och köp-rutten svarar 404 på en annans.
  - Motorns borttagning av ett konto tar också dess sparade varukorgar
    (motorns ämnesfil 46).

- **"Kvitto (PDF)"** på varje betald order på Mina sidor (`visaKvitto`, byggt
  2026-11-05): `/api/konto/kvitto/<nummer>` prövar att ordern finns i
  orderliggaren på kontots e-post och hämtar PDF:en från motorns
  `/api/medlem/kvitto` (hemligheten `REVIEW_INGEST_SECRET`, adressen
  `CACHE_WARMER_KVITTO_URL` eller motorns produktion). Motorn ritar kvittot
  med mejlens mall, prövar e-posten på ordern en gång till och svarar bara för
  en betald order: ett köp som företag får företaget ur prisbeslutet, en
  fakturaorder bara kvittot som redan har mejlats. Svaret är privat och
  cachas aldrig; utan PDF visas en kort sida på svenska med länk tillbaka
  (`kvittoFelText`).

## Företagskonto direkt: `/konto/foretag` (Leonard 2026-11-10)

Förut fanns företagskontot bara som rutan "Lägg till ett företag" på Mina
sidor: kunden fick bli medlem först. Nu finns en egen väg i tre steg
(e-post, företaget, klart). Kontot är samma medlemskonto med en
företagsprofil; det är vägen dit som är ny. Rutan på Mina sidor står kvar.

- **Vägarna in:** växeln Privatperson/Företag överst på `/konto` och raden
  "Handlar du till ett företag?" under inloggningen (`app/konto/kontotyp.tsx`),
  plus "Företagskonto" i sidfoten (`ForetagFotLank`). Allt är vanliga länkar i
  serverns HTML utom sidfotens, som följer `/api/konto/lage` (`foretag`).
- **Reglerna står i `lib/medlem/foretagsstart.ts`** (ren modul, prov i
  `foretagsstart.test.ts`): `foretagsvag` avgör vad sidan gör, `visaForetagsvag`
  om vägarna in syns, `efterInloggning` vart steg 1 leder.
- ☠️ **Utloggad syns vägen bara när `pris` står på `pa`.** I läget `test` hade
  vem som helst annars skapat ett konto och mötts av "inte öppnat än" i steg 2.
  En testare loggar in först och går sedan till adressen.
- **Steg 1** är den vanliga inloggningen (`KontoInloggning`) med
  organisationsnumret som extra fält (`fore`, `kontroll`) och `mal` satt till
  `/konto/foretag`, så att länken i mejlet också landar på vägen. Efter koden
  frågar sidan `/api/konto/foretag { steg: "lage" }` och går vidare utan
  omladdning. ☠️ Det steget svarar FÖRE spärren `skal: "stangt"`; flytta det
  inte under den.
- ☠️ **Organisationsnumret bor bara i komponentens tillstånd** fram till
  ansökan: aldrig i adressen, `sessionStorage` eller en kaka. För en enskild
  firma är det ett personnummer. Den som loggar in via mejllänken i en annan
  flik får därför skriva numret igen i steg 2.
- **Steg 2** är samma `Ansokan` som på Mina sidor (exporterad ur
  `app/konto/foretag.tsx`) med numret ifyllt. Ett godkänt bolag växlar profilen
  via `/api/konto/profil` innan steg 3 visas.
- **Ordertrappans bild** ritas ur `ORDERTRAPPA` (`trappsteg`), så den kan inte
  lova något annat än kassan räknar. Under 364 px visas beloppen utan "kr".
- Inloggad med företag (också ett nekat) → `/konto#foretag`. Stängd väg →
  `/konto`. Sidan är `force-dynamic` och noindex som `/konto`.

## Kontaktvägarna bär produkten (Leonard 2026-11-07)

Leonard: "när folk mailar oss om produkter så blir det lätt för dom att visa
vilken dom menar". Kunder mejlade om "ert lasertag-set med projektor för
959 kr", och kundtjänst fick gissa vilken vara de menade.

- **Produktsidans flik "Kontakta oss"**: texten är densamma på varje sida
  (Leonards krav), men länkarna bär produkten. Formuläret öppnas med den
  förvald (`/kontaktaoss#produkt=<slug>&variant=<id>`, se ☠️ nedan), och
  e-postlänken får ämnet "Fråga om: <namn>" och produktens adress i texten
  (`kontaktFlikLankar` i `lib/kontakt/kontakt.ts`). Det valda valet följer
  med när kunden byter färg eller storlek.
- **Formuläret** (`components/contactform.tsx`, `components/kontakt-produkt.tsx`):
  det valfria fältet "Gäller det en produkt?" söker i samma index som
  sidhuvudets sökruta (`lib/sok-index.ts`, utbrutet ur `searchbox.tsx`), och
  den valda produkten visas som ett kort med bild, namn, pris och en väljare
  för varianten. Förvalet läses ur adressen med `useSyncExternalStore`, inte
  med setState i en effekt.
- **Servern bestämmer vad mejlet säger.** Klienten skickar bara slugen och
  variantens id. `/api/contact` slår upp produkten (`hamtaKontaktProdukt`)
  och lägger en ruta överst i mejlet med bild, namn, val, pris och länk.
  Ämnesraden börjar med "Fråga om <produkt>". Svarar Wix inte inom sex
  sekunder går mejlet ändå, med länken byggd ur slugen. Utan produkt är
  mejlet tecken för tecken som förut (prov).
- ☠️ **Aldrig katalogens reserv i kontaktvägarna.** `getProduct` faller
  tillbaka på hela katalogen när Wix inte hittar slugen, och det tar 23–26 s
  på en kall instans. `getKontaktProdukt` (`lib/products.ts`) delar grunden
  med produktsidan (`produktGrund`) men saknar både reserven och bilderna.
- `/api/kontakt/produkt?p=<slug>` (förvalet och valen) ligger i CDN:et en
  timme per adress, en okänd slug tio minuter.
- Leverantörens artikelnummer står aldrig i mejlet eller i länkarna, bara det
  som redan står på produktsidan.
- `lib/kontakt/kontakt.ts` importerar ingenting vid körning, eftersom
  node:test inte kan läsa importer utan filändelse. Formatet för pris och
  valnamn skickas in (`KONTAKT_FORMAT` i `lib/kontakt/produkt.ts`).
- **Ankaret `#meddelande` sitter på formulärkortet**, inte på sektionen
  (Leonard 2026-11-07): länken landar vid Förnamn med "Frågan gäller" synlig i
  telefonen, inte vid rubriken. `scroll-margin-top: var(--ankare)` på kortet.
- ☠️ **Förvalet står efter `#`, aldrig efter `?` (2026-11-11).** Länken hette
  först `/kontaktaoss?produkt=<slug>#meddelande`. Varje produktsida fick då en
  egen adress till samma formulär, och Semrush läste cirka 5 700 av dem som
  egna sidor: 47 % av hela genomsökningen, ungefär hälften av varningarna och
  fyra av fem notiser. Sidorna pekade ut `/kontaktaoss` som original, så
  inget såg fel ut på sidan. Det som står efter `#` skickas aldrig till
  servern och är ingen ny sida.
  - `kontaktHref` bygger `/kontaktaoss#produkt=<slug>&variant=<id>`, och
    `lasKontaktAdress` läser fragmentet först och sedan sökdelen, så länkar
    som kunder sparat före bytet fungerar kvar.
  - Fragmentet är upptaget av förvalet, så webbläsaren rullar inte själv till
    `#meddelande`. `KONTAKT_RULLA_SKRIPT` (sist på sidan, före hydreringen)
    och `rullaTillFormularet` i `components/kontakt-produkt.tsx` gör det, bara
    när fragmentet börjar med `produkt=`.
  - Förvalet läses om vid `hashchange`, så en länk som bara byter fragment
    byter produkt utan omladdning.
- ☠️ **Ingen ny intern adress med `?namn=`.** `lib/interna-lankar-fragestrang.test.ts`
  läser källkoden i `app/` (utom `app/api`), `components/` och `lib/` och
  fäller på varje intern adress med sökdel som inte står i listan `GRANSKADE`
  med ett skäl. En rad som inte längre träffar fäller också. Ett förval till
  en sida som är densamma för alla hör hemma efter `#`. Provet ser strängar,
  inte adresser som sätts ihop av lösa bitar: det är en snubbeltråd, inget
  bevis.

## Bloggens kategorilänkar kontrolleras varje vecka (2026-11-11)

Halloweenguiden länkade till `/kategori/halloweendekoration`, som var tom efter
säsongen och svarade 307 till `/butik`. Två andra guider länkade på tre ställen
till en kategori som bytt namn (308). Produktlänkarna i bloggen hade en
kontroll sedan augusti, kategorilänkarna ingen.

- `dodaKategorilankar` (`lib/blog-product-links.ts`) jämför artiklarnas
  `/kategori/<slug>` med sitemapens kategorier: de som finns och har minst fem
  produkter. Allt utanför är tunt (noindex), tomt (307), omdöpt (308) eller
  borta (404).
- Bara våra egna länkar räknas (relativa, eller hela adresser på
  fyndplats.se). Andra sajters `/kategori/` är källhänvisningar.
- Veckorapporten (`lib/seo-health.ts`) har fältet `blog.dodaKategorilankar` och
  en rad under Åtgärder, som syns både i måndagens mejl och på
  `/admin/seo-health`. Mejlet listar dessutom artikel och mål för varje död
  produkt- och kategorilänk (`dodaLankRader`). Förut stod bara antalet.
- Ett prov i `lib/blog-product-links.test.ts` läser `content/blog/*.md` och
  fäller om någon av de två kända kategorierna länkas igen.
- ☠️ Kontrollen går en gång i veckan, så en kategori som töms på måndagen syns
  först nästa måndag. Att en tom säsongskategori ska svara 200 i stället för
  307 är ett eget beslut som väntar på Leonard.

## Dubbla titlar och metabeskrivningar syns i veckorapporten (2026-11-11)

Semrush fann 63 produktsidor som delade `<title>` med en annan sida (30
grupper) och fyra som delade metabeskrivning. Sökmotorerna läser sådana sidor
som dubbletter. Rubrikerna skilde sig: det var SEO-titeln som var för allmän.

- **Motorn hindrar nya.** Poleringens skrivning vägrar en plan vars titel
  eller metabeskrivning redan står på en annan publicerad sida, och de
  befintliga rättas med motorns workflow för SEO-titlar
  (`docs/claude/47-seo-titlar-egna.md` i motorn).
- **Butiken är nätet under** (`lib/seo-dubbletter.ts`). Veckorapporten jämför
  alla produktsidor i sitemapen och lägger en rad under Åtgärder när två delar
  titel eller beskrivning. Mejlet listar högst trettio grupper per sort, och
  `/admin/seo-health` visar alla, när som helst.
- **Nyckeln är densamma som motorns `seoNyckel`**: utan ` | Fyndplats`,
  gemener, och bara bokstäver och siffror. Ett kommatecken gör inte en ny
  titel. Proven i båda repona bär samma exempel; ändras regeln på ett ställe
  ska den ändras på båda.
- Titeln som jämförs är den sidan visar: den kuraterade SEO-titeln, annars
  namnet med butikens suffix. Beskrivningen jämförs bara när den är kuraterad;
  reserven som byggs ur brödtexten jämförs inte.

## Varukorgens rad står still när en vara läggs i (Leonard 2026-11-07)

- **Den väntande och den bekräftade raden är samma element** (`KorgRad` i
  `components/cart.tsx`). Raden Wix skapar får den väntande radens nyckel
  (`nyRadEfterTillagg` och `vantandeNyckel` i `lib/kundvagn-rad.ts`), så React
  behåller elementet. Förut var den väntande raden 112 px och den bekräftade
  140 px, bilden laddades om, och med fler varor for raderna 132 px (mätt i
  produktionen med `lada-hopp.cjs`).
- **Samma vara igen**: den befintliga raden väntar med det nya antalet
  (`fordelaVantande`), ingen ny rad.
- **Bilden byts först när Wix bild har laddats** (`RadBild`): den väntande
  raden visar galleriets bild ur webbläsarens cache. Ingen lat laddning i
  lådan; den ligger utanför skärmen tills den öppnas.
- **Rulla bara så långt att raden syns**, aldrig till botten: förslagen under
  raderna byttes och klämde rullningen. Förslagen står kvar tills nya kommit.
- Länkarna är alltid `a`-element, med `href` först när adressen är känd.

## Produktvideon i galleriet (Leonard 2026-11-09)

En video som läggs på produkten i Wix (Stores V3, `media.itemsInfo.items`,
`mediaType: "VIDEO"`) visas nu på produktsidan. Galleriet hoppade förut tyst
över videoposter: det byggdes bara av poster med `image.url`. Hjullastaren
(leksaksmotorn) var den första produkten med video.

- `lib/produkt-video.ts` läser posten. Bara mp4 på `video.wixstatic.com` räknas,
  inte HLS, privata filer eller andra värdar. Stillbilden är Wix andra
  (`f001`), eftersom den första ofta är svart eller en titelruta.
- `getProduct` sätter `video` ur samma cache:ade V3-anrop som bilderna. Listsidorna
  bär ingen video.
- Galleriet visar videon som **andra rutan** i bildraden, med play-knapp och längd.
  På mobilen syns två och en halv ruta, och en video sist i raden hittar ingen.
  Ett tryck spelar videon **över** hjältebilden, i samma ruta och med samma kant.
- ☠️ **Videon är aldrig en post i bildlistan.** Variantvalet pekar på index i
  `images`, förladdningen räknar grannar och helskärmen zoomar i den. En video i
  listan hade flyttat varje index efter sig.
- ☠️ **`<video>` ligger utanför hjältens `<button>`** (interaktivt innehåll i en
  knapp är ogiltigt), och knappen är `inert` medan videon visas.
- ☠️ **Ingenting hämtas i förväg:** `preload="none"`, ingen `src` och ingen poster i
  sidan. Adressen sätts och `play()` anropas i SAMMA tryck. iPhone spelar bara
  ljud när `play()` kommer direkt ur kundens handling. Ett `play()` i en effekt
  efter renderingen hade nekats.
- Storleken väljs ur spelarens bredd gånger pixeltätheten, aldrig under 720p och
  högst 480p i sparläge (`valjKalla`). Gränserna räknas på **kortsidan**, så att en
  stående video (en reel i 9:16, 720×1280) räknas som 720p och inte faller till
  1080p. 27 sekunder i 720p är några megabyte och hämtas först när kunden trycker.
- ☠️ **`<video>` har videons eget format och står mitt i rutan**, inte hela
  kvadraten. Safari på iPhone lägger sina knappar (helskärm, ljud) i spelarens
  övre hörn. ✕ ligger då i det svarta fältet ovanför en liggande video, eller
  till höger om en stående, och aldrig över dem. En kvadratisk video (1:1) har
  inget sådant fält; där ligger ✕ över Safaris ljudknapp. ✕ är 36 px men har en
  tryckyta på 44 px (`::before`), Apples minsta.
- En bildruta, en annan variant, ✕ eller Escape stänger och pausar videon.
- En fil som aldrig gick att spela (fel 4, eller inget spelat alls) tar bort rutan
  (`onError`), hellre än en svart ruta. Ett nätfel mitt i filmen stänger bara
  spelaren: rutan står kvar, så att kunden kan trycka igen när täckningen är tillbaka.
- Escape i helskärm lämnar bara helskärmen (webbläsarens eget beteende). Videon
  spelar vidare.
- Fokus går tillbaka till videorutan bara från tangentbordet (Escape, Enter på ✕).
  Ett fingertryck på ✕ flyttar inget fokus, annars ritar Safari en fokusring på rutan.
- ☠️ **Lagret visas (`is-on`, `inert` bort) INNAN `play()` anropas**, i samma tryck.
  En webbläsare får vägra spela ett element i ett dolt eller inert lager.
- Spelaren är dold med `visibility`, inte `display`. Den har då sin storlek, så
  filstorleken kan väljas redan i trycket. Ingen CSP i butiken behöver ändras.

## Köptratten mätt 2026-11-10, och produkten först på mobil

Mätt i GA4 över 28 dygn till 2026-11-09 och stämt av mot Wix ordrar samma dygn:

| Mått | Värde |
| :-- | --: |
| Besök som börjar på en produktsida | 69 % (77 % av den uppmätta omsättningen) |
| Besök på telefon | 84 % |
| Nya besökare | 97 % |
| Källor: Google, ChatGPT, direkt | 37 %, 35 %, 19 % |
| ChatGPT:s del av den uppmätta omsättningen | 45 % |
| Besök med produktvisning som lägger i varukorgen | 6,6 % |
| Påbörjade kassor som blir köp | 53 % |
| Köp som GA4 ser (75 av 106 betalda ordrar) | ungefär sju av tio |
| Slutsålda bland de 75 mest besökta landningsprodukterna | 11 (14 % av deras besök) |

Produktsidan på en telefon är alltså butikens förstasida, och tappet ligger där,
inte i kassan. GA4 mäter bara den som svarat "Godkänn alla": jämför kvoter, inte
antal, och räkna ordrar i Wix.

Källorna och ChatGPT:s del är ommätta på kvällen samma dag, per kanalgrupp. GA4
flyttar köp mellan kanalerna i efterhand: tidigare samma dag stod ChatGPT för
43 % av omsättningen, och två köp gick sedan från "Unassigned" till AI-kanalen. Läs därför av "före" och "efter" med samma avstånd till
periodens slut.

Ändrat samma dag:

- **Produkten först på mobil** (upp till 760 px, `.pdp-sida` och `.crumbs-pdp` i
  `app/globals.css`). Bilden började 435 px ner på en 844 px hög skärm och börjar
  nu 235 px ner. Brödsmulan slutar vid kategorin, och bläddringsraden visas
  mellan köpdelen och beskrivningen.
- ☠️ **Bläddringsraden flyttas bara med CSS** (`order`, produktblocket har
  `display:contents`). Den står kvar i HTML:en ovanför produkten, för länkarna
  ska finnas där från början (avsnittet om länkar för Google ovan). Flytta den
  inte i JSX:en.
- **Slutsåld-rutan länkar till `#liknande`** när sidan har "Liknande produkter"
  (`harLiknande`). Urvalet där är redan bara varor i lager.
- **Raden "4,9 av 5 på Google" vid köpknappen är borttagen** (Leonard
  2026-11-12). Betyget står kvar på startsidan, i sidfoten och på /omdomen,
  och produktsidan hämtar inte längre butiksbetyget.
  `lib/produktsida-fortroende.test.ts` vaktar.
- **Kassans rad "4,9 av 5 på Google" är också borttagen** (Leonard
  2026-11-15: "det ser inte snyggt ut"). På mobil stod den sist i kassan.
  /kassa hämtar inte längre butiksbetyget (`getSocialProof`), så den
  hämtningen ligger inte heller i kassans svarstid. `lib/kassa-fortroende.test.ts`
  vaktar.
- **Märket läses ur varans egen rad** (2026-11-15). Produktsidan tar
  `brand.name` ur V3-raden den redan hämtar (`markeUrV3` i `produktGrund`, sedan
  `p.marke`) och hämtar ingen märkeskarta. Förut hämtade varje produktsida hela
  katalogens märkeskarta, ca 20 anrop mot Wix (1 930 produkter med märke, mest
  VEVOR). I produktion var 4 049 av 4 051 felrader på ett dygn
  `fetchVarumarken failed: HTTP 429`, och ett fel gav en delvis karta, så att
  VEVOR-varor fick märket Fyndplats. Flödena läser kartan ur EN cachepost
  (`unstable_cache`, sex timmar). Svepet (`lib/varumarken-svep.ts`) väntar ut
  429 och kastar hellre än lämnar en delvis karta, så att den förra hela kartan
  står kvar. `lib/varumarken-svep.test.ts` vaktar.
- **Två kort i bredd på mobil** också på startsidan, /butik, "Liknande
  produkter", prissidorna och /for-dig-som (`listgrid` och `tvaKolumner`).
- `/kategori/skarmtak-entr-tak` pekar om till `/kategori/skarmtak-entretak`.
- **Cookierutans knappar står på en rad på mobil** (under 540 px,
  `white-space:nowrap`), så rutan är 185 px hög i stället för 213 vid 390 px.
  ☠️ Under 330 px ryms de inte bredvid varandra med texten på en rad. Då föll
  de i två rader och rutan blev 261 px vid 320 px, högre än förut (235 px).
  Regeln för 340 px och smalare låter raden aldrig brytas: 207 px vid 320 px.
  `lib/kakrad-smal.test.ts` vaktar. Mät en ändring i rutan på 280 till 600 px,
  inte bara på 390.

Så provas en layoutändring utan deploy: bygg lokalt (`pnpm build`, utan
Wix-nyckel renderas reservkatalogen `products.json`), eller lägg den nya CSS:en
på den skarpa sidan i en webbläsare (`page.addStyleTag` i Playwright) och jämför
skärmbilder före och efter i 390 × 844. En molnsession når butiken först när
miljön tillåter `www.fyndplats.se`, `static.wixstatic.com`, `edge.wixapis.com`
och `www.wixapis.com` (varukorgen, se `components/cart.tsx`).

## Sökningen: sammanskrivet, utan prickar och ett fel före två (2026-11-10)

39 provsökningar mot butiken: "fatolj" gav 0 träffar fast 284 varor har fåtölj
i namnet, "sangbord" gav gamingbord, "tv bank" 949 varor med en hantelbänk
överst, "laser tag" en bredgaffel ("laser" stammas till "las", som står i
"glasfiber") och "elkammin" melaminhyllor.

Tre tillägg i `lib/search.ts`, alla som reserv, så att en sökning som redan har
en hel träff svarar som förut:

1. **Sammanskrivet.** Flera sökord hittar ordet som ett ("laser tag" →
   "Lasertag"), och ett sökord hittar namnet med bindestreck ("tvbänk" →
   "TV-bänk", "popup" → "Pop-up"). Träffen måste börja ett ord, och går den över
   ett bindestreck måste den sluta där en del slutar: annars blir "topp" en
   träff i "Hardtop-paviljong".
2. **Utan prickar.** Å, ä och ö jämförs som a och o när inget matchar med
   prickarna kvar. Varvet körs före stavfelsledet.
3. **Ett stavfel före två.** Finns en träff med ett fel i ordet visas inte de
   med två.
4. **Ett sammansatt sökord delat i två** (granskningen samma dag). "barnbil"
   står inte i något namn, för varorna heter "Elbil barn" och "Åkbil för barn".
   Med två stavfel låg ordet lika nära "barnbok" och "barn i": 118 träffar med
   en barnbokhylla överst. Nu söks ordet som "barn bil" (84 bilar för barn) när
   det går att dela i två ord som båda står för sig i katalogen och någon vara
   har båda. "barnmotorcykel" gick från 1 träff (ett motorcykelgarage) till 31,
   "barnelbil" från 0 till 50.
   ☠️ Delningen kommer EFTER ett stavfel, inte före. Ett felstavat ord går
   ofta att dela i två riktiga: "matsolar" är "mat" och "solar", och gav en
   fågelmatare med solpaneler i stället för matstolarna. Med delningen först
   bytte 55 av 1 050 felstavningar ur katalogen lista, de flesta till det
   sämre. Med delningen efter: ingen av 1 050, och en av 749 med två fel.

Mätt mot butikens 6 147 namn: 34 av 3 465 sökningar ur katalogen ändrades, alla
åt det hållet, och tiden per tangent i sökrutan är densamma (4,0–4,3 ms före,
4,3–4,4 ms efter). Ommätt i granskningen samma dag på en annan maskin, fyra
omgångar: snittet 4,9–5,8 ms före och 4,5–5,6 ms efter. Den vanliga tangenten
tar något längre (medianen 1,6–2,0 mot 2,1–2,7 ms), och de långsammaste går
fortare (var tjugonde tangent tog minst 32–37 ms före och 15–23 ms efter).
**Mät en sökändring på samma sätt innan den mergas:**

```
node --experimental-strip-types --no-warnings scripts/sok-jamfor.mjs
```

Skriptet hämtar `/api/search-index`, kör `rankByName` från grenen och från
`origin/headless-site` och skriver de sökningar som ger en annan lista.
Katalogens egna ord har alltid en hel träff, så skriptet prövar inte
reserverna för stavfel och sammansatta ord. Mät dem med felstavningar gjorda
ur katalogens ord (ett tecken borta, två omkastade, ett dubblerat): läs varje
sökning som byter lista.

Kvar: "öppen spis el" ger gnistskydd, för "el" står i "paneler" och "delar".
Det behöver synonymer för hela fraser ("elektrisk öppen spis" är en elkamin),
och sådana finns inte i `SYNONYM_GROUPS`.

## Sökningen 2026-11-19: ordförrådet, två ord, ärligt tomt och en kall katalog

Leonard: "tycker du vår sökfunktion av produkter är 10/10?" Svaret var 6 av 10,
efter 124 provsökningar mot butiken, och han sa: "gör alla 1-6 förutom 5". Det
som INTE är byggt är punkt 5: genvägar till frakt, retur, spårning och kontakt
("frakt" ger fortfarande en fraktvåg).

Stavningen höll redan (avsnittet ovan). Det här gick fel, och är ändrat:

| Sökning på live 2026-11-19 | Svar då | Svar nu |
|---|---|---|
| svart tv-bänk | diskbänkslåda, trädgårdsbänk, picknickset, och en tv-bänk på plats fem | 21 tv-bänkar, med beskedet att en har "svart" i namnet (den är slutsåld och står sist) |
| hundbur xl | en hundbädd i XL och en hundtrappa | 19 hundburar, med beskedet att "xl" ströks |
| länstol | ett barnbord med molnstolar | 294 fåtöljer |
| papperskorg | två barnstafflier | 61 soptunnor och pedalhinkar |
| pallkrage | ingenting | 61 odlingslådor |
| utemöbler | åtta varor, två av de tre första skyddsöverdrag | 89 varor med möblerna först och överdragen efter, och kategorin Utemöbler ovanför |
| trädgårdsmöbler | presenning, högtryckstvätt och plåtbod (ur beskrivningarna) | samma 89, och kategorierna Utemöbler och Trädgård |
| pulka | nio tomtar med polkagris | ingenting, ärligt |
| aosom | nio varor med ordet "som" | ingenting |
| soffa under 2000 | 692 träffar med "förvaring under sitsen" överst | 137 soffor, med beskedet att "2000" ströks |

**Reglerna i `lib/search.ts`** (`lib/sok-2026-11-19.test.ts` bär varje sökning
ovan):

1. **Korta ord och tal står som egna ord** (`helord`, `starSomOrd`). "tv" stod
   i "två", "tvåsitsig" och "viktväst". Det gäller ord på högst två tecken,
   tal, och förkortningarna i `FORKORTNINGAR` ("usb" stod i "husbilstrappa").
   Tre bokstäver räcker annars som delsträng: där står huvudet i "elbil" och
   "hundbur". Hela frasen följer samma regel: "skrivbord 120" står inte i
   "Skrivbord 1200 mm".
2. **Stavfel bara för ord som inte finns i katalogen.** Ett ord som står i
   något namn är rättstavat. "hundbur" blev annars "hundbädd" så fort inget
   namn hade alla sökord.
3. **Ett stavfel ligger i ETT ord, träffar ordets slut och har rätt första
   bokstav** (`fuzzyOrdslut`). Huvudet står sist i en svensk sammansättning.
   "pulka" var början av "polkagris", "aosom" var "a som" över ett mellanslag,
   och "cyckel" låg lika nära "nyckel" som "cykel". ☠️ Priset: ett felstavat
   FÖRLED hittas inte längre ("cyckel" hittar elcyklar och motionscyklar, inte
   cykelpumpen). Mätt på 592 felstavningar av katalogens vanligaste första
   ord: täckningen 96,7 → 94,4 %, renheten 96,9 → 97,6 %. De elva som blev
   klart sämre var alla adjektiv ("justerbar", "utdragbar", "dubbel").
4. **Inget namn har alla sökord: stryk ord, med besked** (`rankaMedInfo`,
   `strukna`). Förut visades allt som träffade NÅGOT ord. Nu stryks i tur och
   ordning ord som inte finns alls, sedan färg, storlek, mått och korta ord
   (`EGENSKAPSORD`), sedan det vanligaste ordet. Sidan säger vilka ord som
   ströks.
5. **Färg och mått står ofta inte i namnet** (`fyllPa`, `utan`, `hela`).
   "svart tv-bänk" hade en enda hel träff, en slutsåld bänk, fast flera
   tv-bänkar är svarta: färgen ligger i varans val. Är de hela träffarna färre
   än en skärm (`FYLL_PA_UNDER`, 24) fylls listan på med varorna som har resten
   av orden, och sidan säger det.
6. **Frågeord räknas inte**: "billig", "under", "över", "köp", "kr" står i
   `STOPWORDS`.
7. **Kundens ord för varor som heter något annat.** 51 nya synonymgrupper, och
   `ENVAGS` för ord åt ett håll ("länstol" → fåtölj, "kommod" → byrå,
   "utemöbler" → trädgårdsbord, loungegrupp, bistroset …). ☠️ Ett envägsord går
   inte genom `canon`: "byrå" hade blivit nålen "byr", som står i "labyrint",
   och "eldfat" hade blivit "eldf", som står i "eldfast". **Pröva varje ny nål
   mot katalogens namn** innan den läggs in: hur många namn den står i, och om
   något av dem är ett annat ord.
8. **Ett envägsord: varan före tillbehöret** (`ENVAGS_I_HUVUDDELEN`, 92).
   "utemöbler" gav ett möblemang och sedan tre skyddsöverdrag "för utemöbler":
   ordet i namnet gav 90 och envägsträffen 51. Står varans typ i namnets
   huvuddel (före "för", "med", "till", komma och tankstreck) går den före
   ett namn som bara nämner ordet. ☠️ Bara `ENVAGS`, inte synonymgrupperna:
   prövat på båda ändrades ordningen i 210 av 4 443 sökningar ("bokhylla",
   "cykel", "barstol"), och där är ordet i namnet oftast rätt vara. Med bara
   envägsorden ändrades 1 ("utemöbler").

**Kategorier i förslagen och på söksidan** (`kategoriPoang`, `matchaKategorier`
i `lib/search.ts`, `lib/sok-kategorier.ts`). Kategorinamnen står i plural, och
delsträngsjämförelsen räcker inte åt det hållet ("soffa" står inte i
"soffor"), så orden jämförs i kanonisk form. ☠️ Förledet jämförs som kunden
skrev det: "soffa" blir kanoniskt "soff", som också inleder "soffbord".
Sökrutan visar högst två kategorier överst, och de tar plats från varorna så
att listan inte blir högre. Trädet kommer ur menyerna, som redan har det
(`registreraKategorier` i `meganav.tsx` och `mobilenav.tsx`): ingen ny hämtning
och inga nya byte i sidan.

**☠️ Söksidan väntar aldrig på en kall katalog** (`app/sok/page.tsx`,
`components/sok-kall.tsx`). En ny instans läser hela katalogen innan
`getProducts` svarar: 7 617 varor, 25–28 sekunder (Vercels logg 2026-11-19,
minst 30 gånger på en och en halv timme, över alla rutter). Kategorisidorna
ligger färdiga i CDN:t, men söksidan räknas per sökning, och 2 av 125
provsökningar tog 14 och 29 sekunder. Nu frågar sidan `katalogenLaddad()`, som
sidhuvudet redan gör:

- **Varm instans:** som förut, träffarna räknas på servern.
- **Kall instans:** sidan svarar direkt, och webbläsaren hämtar hela
  varulistan som listsidorna redan använder (`/api/lista?k=alla`, CDN-cachad)
  och kör samma rankning där. Instansen läser in katalogen i bakgrunden
  (`after`), så nästa sökning får den varma vägen.

De två vägarna ritar samma vy (`components/sok-vy.tsx`). Skillnaden: den kalla
vägen har inte reserven som letar i beskrivningarna, för den texten finns inte
i listan. Reserven används numera bara när varken ett namn eller en kategori
matchar.

☠️ **Varulistan har bara det som går att köpa, och söksidan visar också det
slutsålda** (`lib/sok-kall.ts`). Första bygget sökte bara i varulistan, och
provet i webbläsaren visade skillnaden mot servern: "svart tv-bänk" 18 mot
21, "länstol" 250 mot 294, "utemöbler" 69 mot 89. Den enda tv-bänken med
"svart" i namnet var slutsåld, så den kalla vägen strök dessutom ordet och gav
ett annat besked. Nu läggs de slutsålda till ur sökindexet (`kandidater`,
`kortUrIndex`), som har namn, adress, foto, pris och märket `o`. Faller
indexet, eller dröjer det mer än fem sekunder efter listan, visas det som går
att köpa. **Jämför alltid de två vägarnas antal** när något i dem ändras.

☠️ **Den kalla vägen går inte att prova på en förhandsvisning eller lokalt
utan vidare.** Sidhuvudet läser den färdiga menyn (`sidhuvudsdata`), och den
skrivs av `/api/cron/meny`, som bara går i produktion. Utan färdig meny bygger
sidhuvudet menyn ur katalogen och väntar in den, och då är katalogen redan
laddad när söksidan frågar. Provet 2026-11-19 gjordes mot ett lokalt bygge
där villkoret i `app/sok/page.tsx` var framtvingat (aldrig committat).

Mät en sökändring med `scripts/sok-jamfor.mjs` som förut. Den här gången
ändrades 369 av 4 443 sökningar ur katalogen: synonymerna, påfyllningen efter
färg och mått, och korta ord och förkortningar som inte längre träffar mitt i
andra ord ("a" 7 433 → 29, "tv" 1 179 → 35, "usb" 97 → 47).

Kvar: "öppen spis el" ger gnistskydd för öppen spis (nu med beskedet att "el"
ströks). Att "öppen spis" med "el" är en elkamin behöver synonymer för hela
fraser, och sådana finns inte.

## Sökfältets sista genomgång (2026-11-19)

Leonard samma natt: "gör en sista kill på sökfältet och tänker saknas det något
mer för att göra detta till världens bästa e-handel sökfält, och fixa det."
Det här lades till (`components/searchbox.tsx`, prov i
`lib/sok-2026-11-19.test.ts`):

1. **Priset i sökningen** (`lib/sok-pris.ts`). "soffa under 2000" gav 137
   soffor med beskedet att "2000" ströks. Nu läses priset ur sökningen
   (`tolkaPris`), sökorden rankas utan det, och träffarna gallras på priset:
   36 soffor under 2 000 kr, samma antal i sökrutan och på söksidan. Söksidan
   säger "Du ser 36 varor under 2 000 kr" med knappen "Visa alla 137".
   Finns ingen träff inom priset visas alla, med besked. ☠️ Ett tal efter
   "under" är inte alltid ett pris: det måste stå direkt efter ett prisord,
   får inte följas av en enhet ("under 3 år", "under 120 cm"), och måste utan
   "kr" vara minst 300 ("tv-bänk max 160" är ett mått). Bara ett pris utan
   sökord ("under 500") lämnas som det är.
2. **Senaste sökningar** när rutan är tom (`lib/sok-senaste.ts`), högst fem,
   med "Rensa". ☠️ **Sparas bara med kundens ja till kakor.** Sökhistorik i
   webbläsarens lagring är inte nödvändig för att butiken ska fungera. Listan
   ligger alltid i minnet under sidbesöket, och skrivs till `localStorage`
   bara när kakvalet är "all". De tar plats från de populära varorna (fem i
   stället för sju), så panelen blir inte högre.
3. **Antalet i knappen**: "Visa alla 89 resultat för …" (`rankaForslagMedAntal`
   i `lib/sok-index.ts`). Priset gallrar FÖRE klippet till sju rader.
4. **Krysset** som tömmer rutan med fokus kvar, och `enterKeyHint="search"` så
   att telefonens tangentbord säger Sök.
5. **Varje sökord i fetstil** i namnen. Förut bara hela frasen, så "svart
   tv-bänk" markerade ingenting.
6. **Uppläst rad**: `aria-activedescendant` följer piltangenterna, och raden
   rullas fram när listan är högre än panelen.
7. **Utan träff**: ett tips och länkar till kategorierna och kontaktsidan.

**Sökförslag och exempel** (samma natt, efter Leonards "det känns fortfarande
inte som att det är världens bästa e-handel sökfält"). Det som saknades var
det de bästa rutorna gör först: föreslå SÖKNINGEN, inte bara varorna.

- Medan man skriver står högst tre sökförslag som chips överst: "sof" →
  soffbord, soffa; "soffa" → tvåsitssoffa, bäddsoffa, hörnsoffa; "tv" →
  tv-bänk; "fatol" → fåtölj. Det förslaget lägger till står i fetstil. Ett
  tryck gör sökningen.
- En tom ruta visar "Sök till exempel" med katalogens sex vanligaste varuord
  (kontorsstol, klösträd, golvlampa …). Rubriken säger inte "populära": det
  är vad butiken har mest av, inte vad kunderna söker mest.
- På datorn står en rad med vad piltangenterna, Enter och Esc gör.

Orden kommer ur katalogens egna namn (`byggOrdforrad` och `sokforslag` i
`lib/search.ts`, cachat per hämtat index i `lib/sok-index.ts`): varje förslag
ger träffar, ingen sökstatistik behövs och inget nytt hämtas. Mätt på 7 617
namn: 2 916 ord, 52 ms att bygga en gång, under en millisekund per tangent.
Reglerna, var och en med ett prov:

- **Adjektiv föreslås inte.** De känns igen på böjningen: finns ordet också
  med -t ("manuell", "manuellt"; "konstgjord", "konstgjort") är det inget
  varuord. Utan regeln var "konstgjord", "smalt" och "manuell" bland de
  vanligaste exemplen.
- **Ett kort ord står för sig**, som i sökningen: "tv" är tv-bänk och
  tv-stativ, inte tvåsitssoffa och tvättkorg.
- **Vilken sorts ord är det?** "soffa", "bord" och "stol" är huvudet i många
  sammansättningar, så de smalare formerna går först (bäddsoffa). "barn",
  "hund" och "jul" inleder många, så de går först (barnbord). Avgörs av vilken
  grupp som har flest namn.
- ☠️ **Stammen är inte ordet.** "julgr" har samma stam som "julgran", och
  "matt" samma som "matta", så en regel som hoppade över "samma ord" tog bort
  just det kunden var på väg att skriva. Bara en ren böjning av ett
  färdigskrivet ord hoppas över ("stol" → "stolar").

Chipsen tar plats från varorna (en rad), så panelen är inte högre på mobilen:
561 px mot 573 förut.

☠️ **Listan börjar om när varorna byts** (`key` på `ShopBrowser` i
`components/sok-vy.tsx`). `ShopBrowser` håller prisreglagets läge som
tillstånd, satt efter varorna den först fick. Efter "Visa alla 137" stod
reglaget kvar på de 36 varornas gränser och blev ett filter ingen hade valt:
sidan sa 137 träffar och listan visade 36 med märket "1" på Filter. Felet syntes
bara på en skärmbild, alla prov var gröna. Samma sak gällde två sökningar i
rad, redan före den här ändringen. Nyckeln är sökningen plus läget.

☠️ **En ny `<button>` får webbläsarens grå ram.** Butiken har ingen global
nollställning av knappar, så varje ny knappklass behöver `background:none;
border:0` (och `font-family:inherit`). "Rensa" stod med grå ruta på första
skärmbilden.

Inte byggt: färgen i sökningen läst ur varans färgval ("svart tv-bänk" visar
alla tv-bänkar och säger att färgen ofta står bland valen; `colors` finns i
listkortet men inte i sökindexet), "menade du" vid stavfel, och genvägarna
till frakt, retur och spårning (Leonards punkt 5, som han valde bort).

## Sökrutan: sista kontrollen, sökmotorn vid avsikt och vita bakgrunder (2026-11-19)

Leonard, sista vändan samma natt: "finslipa en sista gång sökfältet nu när du
lagt till mycket, kontrollera att inget buggar och att det är optimerat", och
om Fyndauktionen och filterlådan: "det känns inte som att bakgrundsfärgen
passar in om man jämför med våra andra sidor".

**☠️ Sökmotorn laddas vid avsikt, inte med sidan.** Sökrutan ligger i
sidhuvudet på varje sida, och rankningen (`lib/search.ts`) följde med i varje
sidas JavaScript: 18 kB minifierat, 7,6 kB gzip, och nattens synonymer hade
gjort den större. Nu ligger rankningen av förslagen i `lib/sok-rankning.ts`,
som sökrutan hämtar med `import()` när pekaren eller fingret når rutan,
samtidigt som sökindexet (`laddaMotor` i `components/searchbox.tsx`).
`lib/sok-index.ts` har bara hämtningen kvar. Mätt i bygget: startsidans
JavaScript 846 → 831 kB, 267,4 → 261,0 kB gzip, på varje sida. Mätt i
webbläsare (`bf/sok-kontroll.cjs`): ingen fil med sökmotorn laddas med sidan,
från tryck till första förslagen 0,2 s lokalt, och högst 74 ms per tangent.
**Importera aldrig `lib/search` eller `lib/sok-rankning` överst i sökrutan,
i `lib/sok-index.ts` eller i menyerna**: `lib/sok-2026-11-19.test.ts` fäller.
Ordförrådet för sökförslagen (30–50 ms) byggs i en ledig stund efter avsikten
(`varmUpp`).

**Tre lägen runt rutan som var fel, alla hittade i webbläsaren:**

- ☠️ **Fokus med ett ord i rutan** visade "Inga produkter matchade" om ett ord
  med hundratals träffar, när rutan fått ordet utan att förslagen räknats
  (ur adressen, eller skrivet före hydreringen). Fokus räknar nu om
  förslagen för ordet som står där.
- ☠️ **Det gjorde att krysset slutade fungera.** `focus()` anropas innan React
  har skrivit det tömda värdet, så fokus läste det gamla ordet och skrev
  tillbaka det. Krysset tömmer nu rutan i DOM först. Lärdomen: den som läser
  rutans värde i en händelse måste veta att tillståndet kan ligga ett steg
  efter.
- ☠️ **Ett valt sökförslag** bytte rutans ord men inte listan: nästa gång rutan
  öppnades stod förslagen för det gamla ordet. Valet räknar nu om.

**Sökordet står kvar i rutan på resultatsidan**, också efter en omladdning,
en delad länk och bakåtknappen, och rutan töms när man lämnar sidan. Ordet
läses ur adressen i en effekt (`usePathname` och `popstate`). ☠️ Inte med
`useSearchParams`: i sidhuvudet tvingar den varje statisk sida att vänta på
webbläsaren.

**Bakgrunderna.** Kroppen, kundvagnslådan och mobilmenyn är vita. Filterlådan
på mobilen stod i `--warm` (krämfärgad) på tre ställen och är nu vit, som de
andra lådorna.

Fyndauktionens scen gick i sitt viloläge från kräm till en gulbeige persika
(`#FFF9F3` → `#FCEFE0`) som inte finns någon annanstans i butiken. Nu går den
från vitt till butikens egen kräm (`--warm`, `#FFF6EF`, samma ton som
köpguidernas sektion på startsidan). ☠️ **Helt vitt prövades först och föll**
(Leonard: "Stopp, tycker vit passar för fyndauktionen??"): korten är vita och
tappade kontrasten, och scenen blev platt. Jag hade läst "passar inte in
jämfört med våra andra sidor" som "gör den vit som de andra", utan att fråga.
Frågan var tonen, inte att sidan har en egen värme.

Auktionens första färgsteg står på två ställen som måste vara lika: `.a-stage`
i `app/globals.css` och `LIGHT[0]` i `components/auction-stage.tsx`. Värmen
under dagen (07 till 19, och glöden sista timmen) är kvar: det är auktionens
egen dramaturgi, och den börjar nu från butikens kräm.

## Sökrutan: två bokstäver är början på ett ord (2026-11-19)

Leonards skärmbilder kl 04:45: "få" och "bi" gav "Inga produkter matchade", och
förslagen var fack, fåtölj, fälls och biking, bistroset, bitar.

**Orsaken.** Ett ord på högst två bokstäver ska stå för sig i namnet
(`helord` i `lib/search.ts`, så att "tv" inte är "två"). "få" står inte för sig
i något namn. "st" gör det i 107 ("2 st"), och det är inte heller vad kunden
letar efter. Förslagen rankades på hur många namn ordet står i, och då vinner
egenskaper ("med 3 fack", "7 bitar") över varor.

**Regeln nu** (`visaVarorFor` och `sokforslag` i `lib/search.ts`):

- **Förslagen för två bokstäver är varor.** `byggOrdforrad` räknar `varu` per
  ord: hur ofta ordet inleder ett namn, eller är huvudet i namnets första ord
  ("Matstolar 2-pack" räknas för stolar, "Hörnskrivbord" för skrivbord och
  bord). "få" → fåtölj, fågelbur, fågelmatare. "st" → stolar, ställ, staffli.
  "so" → soffa, soptunna, soffbord. Börjar ingen vara så föreslås ingenting.
- **Två spärrar i `varu`.** Namnets första ord ska självt vara ett varuord
  ("Upphöjd odlingslåda" gjorde annars "höjd" till en vara), och slutet ska stå
  som ett eget ord i något namn ("blandare" gav annars "land").
- **Prickarna gäller när kunden har skrivit dem**, i alla längder: "sä" och
  "sän" är sängram, inte sammet och sand. Utan prickar räknas båda ("fatol" →
  fåtölj), med ordet som börjar precis så först ("bad" → badrumsskåp före bädd).
- **Listan visar varorna för det första förslaget** och säger det: rubriken
  "Visar “fåtölj”", förslaget är markerat, och foten och Enter söker på det
  ordet. Samma sak när ett längre ord inte gav någon träff men har ett förslag.
- **Undantaget är "tv":** är förslaget samma ord med bindestreck (tv-bänk) är
  det korta ordet varan, och dess egna träffar visas som förut.
- **Två bokstäver som inget börjar på ("xq")** visar det tomma lägets exempel
  och populära varor, med raden "Skriv lite till, så visar vi förslag".
- **Efter ett annat ord föreslås inget för två bokstäver** ("soffa gr" är
  oftast en färg på väg).

**☠️ Söksidan hade samma fel, värre.** `/sok?q=få` gav 605 varor och
`/sok?q=so` 3 795: utan namnträff föll sidan till reserven i beskrivningarna,
där två bokstäver står i nästan varje text. Sidan rankar nu med
`rankaMedForslag` (samma regel), säger "Du skrev “få”. Här är träffarna för
“fåtölj”", och letar aldrig i beskrivningarna för två bokstäver. Den kalla
vägen (`components/sok-kall.tsx`) gör likadant.

Mätt på katalogens 7 617 namn och i webbläsare (mobil och dator, lokalt bygge):
"få" 295 fåtöljer, "bi" 15 bistroset, "st" 628 stolar, "so" 137 soffor, "kö"
köksskåp, "tv" 35 som förut, "xl" 4 som förut. Värsta tangent 75 ms.
Ordförrådet tar 60 ms att bygga (30–50 förut).

Två saker till i samma ändring:

- **Auktionens räkneverk** (`.a-odo-stack span`) klipper varje siffra. Siffrorna
  är högre än sin rad, så toppen av nästa siffra i rullen stack fram som ett
  par prickar under priset. Mätt på /fyndauktion med regeln pålagd i
  webbläsaren: 7 respektive 21 färgade bildpunkter under baslinjen före, 0 efter.
- **Panelens fotknapp** (`.sugg-all`) bar webbläsarens egen ram på sidorna och
  i nederkanten. Nu `border:0` före `border-top`.

## Sökmotorns genomgång mot kundernas egna sökningar (Leonard 2026-11-19)

Leonards ord: "gör en djup analys och tester att den är 10/10 funktionellt och
visuellt, som bästa e handel i världen". Underlaget var kundernas 56 sökningar
i butiken (söktermerna i GA4), 163 varufrågor från Google (Search
Console) och en lista på 7 482 frågor byggd ur katalogens 7 724 namn. Allt i
`lib/search.ts`; proven står i `lib/sok-finslip.test.ts`, mätverktygen i
`tools/sok-matning/` (läs README där innan motorn ändras).

**Mätt före och efter** (samma sökindex, 2026-11-19): 520 av 7 482 frågor
bytte antal träffar och 1 422 bytte de fem första. Ingen fråga gick från träff
till noll. Felstavningar (592 st): täckning 90,6 → 98,6 %, renhet 97,6 →
99,1 %, tomma svar 3 → 0. Tiden per tangent i Node, 360 tangenter: medel 12,1
→ 10,7 ms, p95 54 → 36 ms. Inte mätt: tiden på en riktig telefon. Motorns bit
av JavaScripten (hämtas först när någon rör sökrutan) växte från 18 till
27,6 kB minifierat, 7,6 till 10,7 kB gzip.

**☠️ Svenskans böjningar nådde inte fram.** Stammen tar bort EN ändelse, och
då hittade "speglar" 6 av butikens 126 speglar ("spegl" står inte i "spegel"),
"cyklar" 2 av 103, och "möbler" ingen av de 18 varor som heter något på
"-möbel". Åt andra hållet hittade
"bordslampa" inte "Bordslampor 2-pack". `bojdaFormer` lägger till de tre
klasserna stammen inte når: hylla ↔ hyllor, kudde ↔ kuddar, spegel ↔ speglar
och möbel ↔ möbler, plus lådan → låda. Formerna prövas mot katalogen
(`forberedSokning`): "inne" blir annars "innar", som står i "sittPINNAR".

**Ett ensamt sökord är samma ord i alla böjningar** (`ensamtOrdsFormer`).
"stolar" gav matgrupper "… och fyra stolar" före varenda kontorsstol, och
"växter" en spaljé för klätterväxter före de konstgjorda växterna: ordet som
kunden skrev fick frasens 100 eller 90, entalet bara 60. Nu räknas formerna
lika. Entalet tas med när katalogen har det, aldrig en färg eller ett småord
("rosor" är inte "rosa"), och inte för orden i `INTE_BOJT` och `INTE_ENTAL`:
ett filter är ingen filt, en racket inget rack, och "stegar" inte "steg".

**☠️ Stammen är inte alltid ordet** (`sokstam`). "träning" hade stammen "trä"
och gav 910 träffar, "matare" 437 (mat-), "rosor" 351 (rosa och rostfritt),
"krona" 167 (krokar och krom). Tre regler:
- en stam på högst tre tecken gäller bara efter en riktig böjningsändelse, och
  ska då stå som ett ord eller sist i ett ord (`ordStar`): "bilar" hittar
  "Elbil" men inte "Bilbana", "burar" inte "Burk",
- efter en avledning ("-ning", "-are", "-het") stammas ordet inte när stammen
  blir fyra tecken eller kortare: en laddare är ingen laddbar lampa,
- orden i `INTE_BOJT` stammas inte alls ("laser" blev "las" och träffade
  "TSA-lås", "vinter" blev "vint" och träffade "vintage").

**☠️ Slumpträffar inne i andra ord** (`BARARE`, `barAdjektiv`). Mätt i
katalogen: "lås" gav 94 uppBLÅSbara varor, "tyg" 86 VERKTYG, "ring" 250 varor
med förvaRING och monteRING, "ask" 118 MASKiner, "hus" 31 för inomHUSbruk,
"stol" varenda limPISTOL och "bar" 2 206 träffar, de flesta hopfällBARA.
Bärarorden står i `BARARE` (också utan prickar, för varvet utan prickar), och
"-bar" efter andra bokstäver är en ändelse utom för barerna i `BARER`.
☠️ Listan är handgjord ur dagens katalog. En ny slumpträff syns inte förrän
någon letar: `tools/sok-matning/` har ingen automatik för det.

**Ordningen inom samma poäng** (`kant`, sju steg). Huvuddelen av namnet (före
"med", "för", "i", "på", komma och tankstreck) säger vad varan ÄR. Eget ord i
huvuddelen går först ("Bord i ek"), sedan sist i ett ord i huvuddelen
("Matbord"), eget ord efter huvuddelen ("duk för rektangulärt bord"), sist i
ett ord efter huvuddelen, början av en sammansättning vars rest står för sig i
katalogen ("Barstol", "Skohylla"), början av ett annat ord ("Barn", "Skopa")
och sist mitt i ett ord. "sko" visar skoskåp och skohyllor före skopor, "bar"
barstolar före barnbord, "kruka" krukor före "Konstgjord växt i kruka".
- Bara böjningar räknas som ordets slut, inte avledningar eller ett ensamt s:
  en rörbockare är ingen bock och en dörrkrans ingen kran.
- Ett tal före ordet gör det till en enhet ("Högtryckstvätt 135 bar").
- I en sökning på flera ord räknas ordgränsen på varuorden, inte på färg och
  mått.
- ☠️ "Ramväska cykel" går först på "cykel" och "Trollkarlskatt byggsats" på
  "katt": namnet har ordet som huvud utan att vara varan. Motorn kan inte se
  det. Inte rättat.

**Inget namn har alla sökord: de viktigaste blir kvar** (slutet av
`rankaMedInfo`). Förr ströks det vanligaste ordet först, och det ovanligaste
blev kvar hur lite det än sa: "dieselvärmare husvagn" visade stödben för
husvagnar, "ihopfällbar stegpall" en campingtoalett, "laser tag 4 player set"
en bakverksdisplay. Nu väljs den uppsättning ord som något namn har och som
väger mest: varuord efter hur ovanliga de är (sökningens första hälften mer),
färg, mått, tal och beskrivande ord ("hopfällbar", "golvstående") lite, ord
som inget namn har ingenting. Ett ord som bara BÖRJAR ett annat ord i namnet
väger hälften, så en skrivbordsstol som är "55 cm bred" inte går före
skrivborden på "skrivbord 85 cm bred".

**Stavningen rättas mot katalogens ord, och sidan säger det**
(`rattaStavning`, före det gamla stavfelsledet). "Ellamin" (en kunds sökning)
gav 39 träffar med pendellampor och melamin. Ligger ett okänt sökord ett fel
från ett ord som står för sig i katalogen (två fel när båda är minst åtta
tecken, samma första bokstav) söks det ordet, och utfallet bär `rattat`.
Rutan säger "Visar “elkamin”" och söksidan "Du skrev “ellamin”. Här är
träffarna för “elkamin”" (samma väg som ordet för två bokstäver). En tappad
bokstav går före en bytt, en bytt vokal före en bytt konsonant, och bland
ungefär lika nära vinner ordet i flest namn.
- Det gamla stavfelsledet finns kvar för ord katalogen inte har som eget ord.
  Träffen ska nu börja där ett ord kan börja: "örhängen" låg ett fel från
  "r|örgäng|or" och gav en rörutdragare. Nu ger den ingenting, och det är
  rätt: butiken säljer inga örhängen.
- Träffar som bara ligger nära i stavning bär `liknande`. Söksidan säger
  "Ingen vara heter “formanden”. Här är de som ligger närmast i stavning", och
  rutans rubrik blir "Närmast i stavning".

**Sökförslag på flera ord prövas mot namnen** (`sokforslagINamn`).
`sokforslag` fyller i det sista ordet utan att se på de andra, och föreslog
"golvlampa fotbollsmål" och "kattlåda med taklampa". Ett förslag på flera ord
visas bara när något namn har orden tillsammans. Särskrivna ord föreslås
ihopskrivna först: butikens vanligaste egna sökning är "Vägg hylla", som nu
föreslår "vägghylla" (och "tv bänk" → "tv-bänk", "el bil" → "elbil").

**Mått** (`normalize`): "70x70", "150cm" och "12v" skrivs som namnen skriver
dem ("70 × 70", "150 cm", "12 v"). "bred", "djup", "hög" och deras former är
egenskapsord, och "rea" hör till frågan, inte till varan ("barnkök rea" gav
julgirlanger med REAlistiska barrgrenar).

**Sökrutan i webbläsaren** (`components/searchbox.tsx`), granskad på dator
1440 px och mobil 393 px i det lokala bygget:
- **Listboxen bär bara raderna.** Panelen var en `role="listbox"` med knappar,
  rubriker och foten i sig, och ett fast id som tre sökrutor delade. Nu har
  varje ruta sitt eget id, listboxen omsluter bara alternativen (rubrikerna
  är `presentation`), och antalet träffar läses upp ("35 träffar för elkamin").
- **Tabb ut ur rutan stänger panelen.** ☠️ Bara när fokus faktiskt landat
  utanför: på iPhone får ett tryckt förslag inget fokus (`relatedTarget` är
  null), och stängde vi då försvann förslaget före klicket.
- **Panelen slutar ovanför telefonens tangentbord.** `100dvh` krymper inte när
  tangentbordet kommer upp, så foten ("Visa alla 89 resultat") hamnade bakom
  det. Höjden sätts ur `visualViewport` som `--sok-max`. Mätt med skärmen
  krympt till 460 px: panelen slutar vid 452 px med foten synlig. ☠️ Inte
  mätt med ett riktigt tangentbord: det går inte att öppna i provmiljön.
- **Bokstaven ritas före rankningen.** Var indexet redan hämtat körde
  rankningen i samma uppgift som tangenten. Med fyrdubbelt strypt processor
  tog tangentens egen hantering 40–122 ms i snitt och 354 ms som värst (ett
  felstavat ord); nu 11–13 ms i snitt och 25 ms som värst. Rankningen själv
  är inte snabbare: ett felstavat ord ger fortfarande långa uppgifter (upp
  till 390 ms strypt), men de ligger efter att bokstaven ritats, och den som
  skriver fort slipper rankningen för bokstäverna däremellan.
- **Markeringen följer sökningen** (`markeraTraffar`): "speglar" markerar
  "spegel", och "bar" markeras i "bardisk" men inte i "hopfällbar".
- **Träffytor på pekskärm:** krysset 44 px (28 px att se på), raderna 64 px,
  foten 45 px.
- **Kategorierna i panelen** (`kategoriPoang`) hade samma slumpträffar som
  varorna: "bar" gav Baby & Småbarn, "tyg" Verktyg och "ring" Förvaring.
  Huvudet i kategorins ord prövas nu med `ordStar`, och "hus" hittar Växthus.

Genomgången är ett skript som går att köra om (61 kontroller: roller,
tangentbord, tryck, rubriker, söksidans besked). Det ligger inte i grenen:
det startar en webbläsare mot ett bygge, och butiken har inga sådana prov i
sin svit.

**Inte gjort, med flit:**
- Ett sökord på tre bokstäver träffar fortfarande början av längre ord ("bar"
  hittar "barn", men sist). En regel som kräver att resten är ett ord prövades
  mot katalogen och tappade riktiga varor ("köksö", "badkar", "solcellslampa"),
  så den används bara för ordningen.
- Märken (HOMCOM, Grouw) ger noll träffar. Det är husregeln, inte ett fel.
- Motorn vet inte vad som säljer. Ordningen bland likvärdiga träffar är
  katalogens.

## Köpguiderna på startsidan: en rad med alla inlägg (2026-11-19)

Leonard: "kan du göra så det går att bläddra mellan alla blogginlägg där inte
bara 3. Jag vill att det ska vara optimerad hastighet fortfarande super snabb."

Startsidan visade de tre senaste inläggen. Nu är det en rad med alla (44),
nyast först: tre i bredd på datorn med pilar mitt för omslagen, och svep på
mobilen som förut (`components/guide-karusell.tsx`, `lib/guide-kort.ts`,
`.hem2 .guider` i `app/startsida.css`).

**Så hålls sidan lika lätt.** Startsidan bär fyra kort, mot tre förut, och
inget mer. De andra inläggen (rubrik, adress, omslag och ingressen kortad till
130 tecken, kortet visar ändå bara två rader) ligger i EN cachad fil,
`/api/guider`, som hämtas först när någon rör raden: pekaren eller fingret
når den, eller en pil trycks. Sedan ritas korten sex åt gången, en och en halv
radbredd innan de behövs. Ett kort som inte är ritat har inget `<img>`, så
ingen bild hämtas för det.

☠️ **Första bygget lät alla inläggs data följa med i sidan.** Mätt mot live
samma natt: 33,2 → 37,4 kB brotli, alltså 4,2 kB mer för varje besökare, fast
de flesta aldrig bläddrar. ☠️ Och att bara föra pekaren över raden får inte
rita fler kort: då hämtas deras omslag. Filen hämtas vid avsikt, korten ritas
vid bläddring (`rort` i komponenten).

Mätt i webbläsare 2026-11-19 (`bf/blogg-karusell.cjs`): när sidan laddas hämtas
filen inte alls; före bläddring fyra kort ritade och två omslag hämtade på
mobilen, fyra på datorn; efter bläddring 44 av 44 inlägg med filen hämtad en
gång, och ingen sidledsrullning på sidan.

☠️ `lib/startsida.test.ts` räknar raderna som rullar i sidled, en regel per
rad. Radens `overflow-x:auto` står därför bara i grundregeln; mobilens regel
ändrar mått och kant, inte rullningen.

## Natten: butikens mörka ton, hjältens entré och tre rättelser (2026-11-16)

Leonard: "vår design för single week var super snygg men nu är den borta, vårt
original är inte så 10/10". Han valde förslaget "Varm natt" ur tre.

**Färgerna står på ett ställe**, i `:root` i `app/globals.css` ("Natten"):
`--natt`, `--natt-remsa`, `--natt-golv`, `--natt-ljus`, `--natt-dampad`,
`--natt-knapp`, `--glod` med flera. Samma ton bär toppremsan, startsidans hjälte
och löftesremsa (`app/startsida.css`), auktionsremsan, nyhetsbrevet och sidfoten.
- Säsongstemana ligger ovanpå som förut: deras regler börjar med
  `:root[data-tema]` och väger tyngre. `lib/natten.test.ts` fäller en temaregel
  för hjälten utan det prefixet.
- ☠️ Vit text på `--natt-knapp` ska klara 4,5:1 i knappens LJUSA ände. `#D8480F`
  gav 4,3:1; `#D0440E` ger 4,6:1. Provet räknar om kontrasten ur variablerna.
- `app/startsida.css` får fortfarande inga egna färger (`lib/startsida.test.ts`):
  en ny ton läggs som variabel i `:root`.
- Toppremsans och sidfotens Instagram- och Facebook-knappar är enfärgade.
  Mobilmenyns, på vit botten, bär sina märkesfärger.
- Mobilen har en egen glöd (`--glod-stark`, `--glod-lugn`): med datorns styrka låg
  ett brunt dis bakom rubriken. Glöden är samlad nere till höger bakom brickorna.
- Under 390 px står de sociala knapparna inte i toppremsan: texten bröts annars
  på två rader med "Klarna" ensamt. Radens höjd är låst (`min-height`), så inget
  flyttar sig.
- Sista genomgången före mergen (2026-11-16, förhandsbygget): 17 bredder från 320
  till 1920 px utan sidledsscroll och med rubriken på två rader; 13 sidtyper på
  mobil och dator utan sidfel; axe-core utan kontrastfel på startsidan och
  produktsidan; Halloween- och Singles-temana ritas rätt ovanpå; rubriktypsnittet
  har varje tecken som används utom ★, som ritas av systemet som förut.

**Hjältens entré i djupled** (Leonard: "det hackar in. Kan man inte göra det
sådär 3d sexigt"). Rubriken och brickorna börjar lutade bakåt och en bit bort
och fälls upp (`heroRes`, `brickaRes` i `app/globals.css`).
- ☠️ Bara `transform`, aldrig opacitet, på rubriken och brickorna: rubriken är
  sidans största element (LCP), och det som börjar på opacitet 0 räknas inte
  som ritat förrän toningen är klar.
- ☠️ `backwards`, inte `both`: annars ligger animationens slutläge kvar över
  brickans egen hover-rörelse, och varje bricka behåller ett eget ritlager.
- Slutläget är samma funktioner med nollor, inte `none`.

**Favoritlådans knapp har ett eget ritlager** (`.fav-kop{transform:translateZ(0)}`).
Leonards skärmbild visade ett tunt ljust streck tvärs över "Lägg i varukorgen",
i Safari på iPhone med sidan i 75 % zoom och en enda favorit. Strecket låg
256 px under lådans överkant, där knappen korsar gränsen mellan två av lådans
ritrutor. ☠️ Inte återskapat i Chromium: rättelsen är prövad först när Leonard
sett den på sin telefon.

**Kassans adressfält** är Stripes egna och ritas i en ram. Mätt på www med strypt
processor (4×) och 9 Mbit: kassan syns 0,28 s efter trycket på "Till kassan", men
fälten gick att skriva i först efter 2,2 s. Ramen själv tar 1,2–1,3 s första
gången och 0,5–0,65 s när Stripes filer redan är hämtade.
- Platshållaren bär fältens etiketter (Förnamn, Efternamn, Adress) i fältens
  ram, i stället för grå rutor. Ett tryck på den ger fältet fokus när det ritats.
- ☠️ Provat och borttaget samma dag: att köra Stripe.js redan vid trycket på
  "Till kassan". Mätt på förhandsbygget, fyra varv var: fälten gick att skriva i
  efter 2,06 s med förstarten och 2,01 s utan, men kassan visades efter 0,55 s i
  stället för 0,21 s, eftersom Stripe.js då körs mitt i sidbytet.
  `lib/kassa/adressfalt-platshallare.test.ts` fäller om varukorgen startar Stripe.
- Inte gjort: att värma Stripes ramar redan när varukorgen öppnas. Det hade
  sparat 0,6–0,7 s för nya besökare, men då körs Stripe och sätter sina kakor
  före kassan. Det är Leonards beslut.

## Studiobandet på listsidorna, mobilens verktygsrad och speglingen (2026-11-18)

Leonard 2026-11-18, efter förhandsvisningen: "alla kategoriers övre sektion
får också en premium look som startsidans hero", om brickornas spegling: "det
va ju jätte snyggt. Vill ha det", och sedan, efter min genomgång av vad som
skilde sidan från 10/10: "Gör punkt 1 och 2" (samma topp på resten av
listsidorna, och varorna högre upp på mobilen).

**Studiobandet** (`app/globals.css`, "Studiobandet"). Listsidornas övre
sektion har samma natt, korn och ljus som hjälten, ur samma variabler, så
säsongstemana byter färg där också:

| Band | Sidor |
| --- | --- |
| `.kat-hero` | kategorierna, och de programmatiska sidorna (`.prog-hero`) |
| `.butik-hero` | /alla-produkter och /rea |
| `.b2-hjalte` | /butik och prissidorna |
| `.sidtopp` | /sok och /blogg (rubriken flyttad ur `.sec` till ett eget band) |

EN regel bär bakgrunden och EN bär ljuset (ljuspöl, glöd och ljuskägla).
Sidornas egna regler sätter bara mått och ljusets plats (`--band-ljus`), styrka
(`--band-pol`, `--band-glod`) och storlek (`-b`, `-h`). De ljusa bakgrunderna
och de gamla klotens `::after` är borttagna ur grundreglerna, inte överskrivna.

- ☠️ **Procenten i ljusets plats räknas av lagret, inte av rutnätet.** På
  kategorisidan ligger ljuset på `.kat-hero-grid::before`, som är 800 px
  bredare än rutnätet. Med `calc(400px + 74%)` låg ljuset utanför lagret på
  mobilen och syntes inte alls; rätt är `calc(74% - 192px)`.
- ☠️ **Texten får inte stå på pölen.** Med datorns höjd på mobilen föll
  kategorins ingress till 4,5:1 mot pölens ljusaste punkt. På mobilen är
  pölen 24 px hög och ligger i bandets luft nedtill.
- ☠️ **axe-core kan inte avgöra kontrast mot en toning.** Mät i bilden: gör
  texten genomskinlig och jämför textens färg med den ljusaste punkten bakom
  varje textbärande element. Mätt 2026-11-18 på nio sidor, fyra bredder och
  två utseenden: sämst 5,0:1 (etiketten under talen på /butik, 360 px).
- ☠️ **`.crumbs span` träffar mer än avdelaren.** På de programmatiska sidorna
  är varje led ett eget `span`, så regelns halva styrka låg på länkarna: 3,6:1
  mot natten. `.prog-hero .crumbs>span{opacity:1}`.
- ☠️ **En mobilregel längre ner i filen vinner över en tidigare med samma
  vikt.** `.alla-prod-hero` fick aldrig sin mobilluft: `.butik-hero` står
  längre ner och har samma vikt. Skriv `.butik-hero.alla-prod-hero`.

**Mobilens verktygsrad på en rad** (`components/shopbrowser.tsx`, "Mobilens
verktygsrad" i `app/globals.css`). Filter och sortering stod på var sin rad
under kategoriväljaren. Nu: filterknappen med antalet inne i samma ruta
("100 st"), och sorteringen bredvid. Den riktiga väljaren ligger osynlig över
hela sorteringsknappen, så trycket öppnar telefonens egen lista. Samma rad på
/alla-produkter, /rea och /sok.

- Antalet och filterknappen delar rutnätets första cell; antalet tar inga
  tryck. Talet och ordet är var sitt `span` (`produktOrd` i `lib/rating.ts`:
  böjningen får inte skrivas om i en yta, `lib/plural-global.test.ts`).
- Mätt på 393 px: första varan på kategorisidan står 102 px högre (524 px från
  sidans topp i stället för 626), på /alla-produkter 66 px högre.
- Mätt på åtta bredder (320 till 700 px) och fem sidor: en rad, 44 px höga
  knappar, antalet inom knappen och minst 21 px från ordet "Filter", ingen
  sidscroll. Under 350 px göms antalet när ett filter är valt.

**Kolsvart i stället för brunt.** Leonard samma natt: "är verkligen den där
bruna bakgrundsfärgen rätt färg för att ge hemsidan 10/10 design eller vet du
en som passar bättre?" Natten var en brunsvart toning med persikofärgat ljus,
och orange ljus över nästan svart blir brunt: logga, knapp och bakgrund flöt
ihop. Nu är grunden neutral (`--natt` #09090A till #141312, `--natt-golv`
#0A0A0A), ljuset varmvitt (`--studio-ljus` 255,226,200) och glöden svagare
(`--studio-glod`, `--glod`). Bara variablerna är bytta, så toppremsan, hjälten,
studiobanden, auktionsremsan, nyhetsbrevet och sidfoten följer med. Han fick
tre bilder (A brunt, B kolsvart, C midnattsblått). Jag förde in mitt förslag,
kolsvart, medan han tittade, och han svarade "Kör b" före mergen. Vill han ha
en annan grund är det samma handfull variabler.

- Mätt efter bytet: axe-core 0 kontrastfel på startsidan i fyra utseenden;
  textens kontrast i banden mätt i bilden på mobil sämst 5,2:1.
- ☠️ **Det varmvita ljuset är ljusare än det persikofärgade.** Ljuskäglan
  ligger bakom text på mobilen (ingress, etiketter). Höjs käglans styrka måste
  kontrasten mätas om i bilden.

**Sökfältet zoomade in sidan på iPhone** (`lib/ios-fokuszoom.ts`). Alla fält
har 16 px på mobilen, så felet var inte textstorleken. I Leonards skärmbilder
var sidan ritad 524 px bred på en 393 px bred telefon: Safaris sidzoom stod på
75 %, och då är 16 px bara 12 punkter på skärmen, så iOS zoomar in vid fokus
och står kvar inzoomad. Skriptet lägger `maximum-scale=1` i sidans viewport,
bara på iOS, där värdet styr fokuszoomen men inte kundens egen nypzoom. I
Android Chrome hade samma värde stängt av nypzoomen, så där rörs ingenting.

- ☠️ **Värdet sätts vid tryck, inte vid laddning.** Ändras taggen innan React
  väckt sidan lägger React in en egen bredvid, och den sista (utan taket)
  gäller. Skriptet går igenom alla viewport-taggar vid varje `touchstart`.
- Inte provat på en riktig iPhone. Att Safari följer `maximum-scale` vid
  fokus men inte vid nypzoom är läst, inte mätt.

**Speglingen på mobilen.** Speglingen (`-webkit-box-reflect` på varje bricka)
syntes på Leonards iPhone 15 i första versionen, där varje bricka var en egen
yta på grafikkortet (den lutade). När brickorna ställdes upprätt och ritades
som en del av raden försvann den i Safari, fast Chromium ritade den hela tiden.
Nu har varje bricka `transform:translate3d(0,0,0)` och `will-change:transform`:
en egen yta utan lutning, så priset är fortfarande skarpt.

- ☠️ **Chromium är inget kvitto på speglingen.** Den ritas där i båda lägena.
  Bara en riktig iPhone visar om den finns.

## Smådetaljerna (Leonard 2026-11-18: "alla smådetaljer är viktiga")

Granskningen gick igenom varje sidtyp på mobil (393 px) och dator (1440 px):
31 sidor i skivor om fyra bilder, alla 168 kategorisidor maskinellt, mobilens
öppna lägen (meny, varukorg, favoriter, filter, kategoriväljare) och varje
länk och knapp under 40 px. Varje rättning nedan har ett prov i
`lib/smadetaljer-2026-11-18.test.ts`, `lib/lista-antal.test.ts`,
`lib/category-seo.test.ts` eller `lib/butiksidan.test.ts`.

**☠️ Samma tal på två ställen ska räknas på ett ställe.** Tre av fynden var
samma fel:

- Kategoriväljarens knapp sa "Bygg & Renovering 227" med "228 st" i
  verktygsraden strax under. Väljaren räknade varje produkt i avdelningen
  eller en underkategori (`buildCategoryTree`), verktygsraden sidans egen lista,
  som hoppar över dubbletter och det som bara hör hemma i underkategorin
  (`kategoriProdukter` och `dedupeProducts`). Och när ShopBrowser hämtat hela
  listan från `/api/lista` följde verktygsraden den färskare listan medan
  väljaren stod kvar på den cachade sidans tal. Nu skickar sidan sin listas
  längd till väljaren (`activeCount`), och ShopBrowser säger till när hela
  listan kommit (`lib/lista-antal.ts`, händelsen `fp:lista-antal`). Rubrikytan
  på /alla-produkter och /rea visar samma tal och lyssnar på samma händelse
  (`ListaAntalText` i `components/lista-antal.tsx`): i det lokala bygget stod
  den annars kvar på 6 829 medan väljaren och verktygsraden visade 6 834.
- /butik sa "142 kategorier" och /alla-produkter "168 kategorier". Den ena
  räknade länkarna i sitt register, den andra varje samling i Wix med
  avdelningarna och de tomma. Båda läser nu `antalKategorierIRegistret`
  (`lib/category-threshold.ts`; där och inte i `category-groups.ts`, som inte
  går att importera i ett prov).
- Avdelningsrutorna sa "1 500 st" på startsidan och "1 500 produkter" på
  /butik. Båda säger "st". Det längre ordet bröt avdelningsnamnen på två rader
  vid 1024 px, så det var /butik som fick ändra sig.

**Kategorisidan.** På mobilen göms brödsmulornas sista led och strecket före
det (`.kat-hero:not(.prog-hero) .crumbs em`), som på produktsidan: namnet står
som rubrik raden under, och på 40 av 168 sidor bröts spåret på två rader för
det ledets skull. Listan i JSON-LD och i HTML:en är orörd. De 37 kategorier
som visade mallraden "Noga utvalda fynd inom badrumsrenovering." har en egen
ingress i `CATEGORY_INGRESS` (`lib/category-seo.ts`), skriven ur sidans egen
A–Ö-lista. Den bär också metabeskrivningen. Titeln är orörd: en post i
`CATEGORY_SEO` kräver redaktionell text i `lib/category-content.ts` och en
sökordstitel väljs med sökdata. ☠️ Ingressen är sann den dag den skrevs. Byts
sortimentet i en av de 37 ska raden skrivas om, som beskrivningarna i
`CATEGORY_SEO`.

**Sidfoten.** Sista raden står i två led (`.fbar-info`, `.fbar-lankar`). På
mobilen står leden på var sin rad och länkarna skiljs åt med luft: raden bröts
förut mitt i och lämnade en ensam prick sist. Den flytande "till
toppen"-knappen låg ovanpå sidfotens högra länkspalt, och på produktsidan,
där köpraden lyfter den, ovanpå "Cookie-inställningar". På mobilen göms den
när sidfoten når den (`.backtotop.vid-fot`), och sidfoten har en egen "Till
toppen" (`components/till-toppen-lank.tsx`). ☠️ Den göms på dator med
`.fbar .fbar-topp`, två klasser: `.fbar a,.fbar button{display:inline-block}`
väger tyngre än en ensam klass, och länken syntes först också på dator (sett i
datorbilden, inte i något prov). Betalmärkena bryts tre och tre
när sex inte får plats (`@container` på `.fpay`): på dator stod Google Pay
ensamt under de andra fem. Loggan i sidfoten har egna id:n (`fpmk-fot`);
sidhuvudets logga stod med samma tre id:n i samma dokument.

**Samma sak heter samma sak.** Kassans sidfot sa "Integritetspolicy",
"Returer och ångerrätt" och "073-663 09 90"; resten av butiken säger
"Sekretesspolicy" (18 filer), "Returer & ångerrätt" och "+46 73 663 09 90"
(11 ställen). Överrubrikens streck stod före texten på /alla-produkter och
/rea och efter den på /butik, startsidan och samlingssidorna. Rubriken på
/butik slutade med en punkt som ingen annan hjälterubrik har. Den tomma
varukorgen sa "Här samlar du dina favoritfynd", fast favoriterna har en egen
låda sedan 2026-11-14. Varukorgens köpknapp visade bara "…" medan korgen
sparades; nu "Uppdaterar …".

**Radbrytningar.** `h1,h2,h3{text-wrap:balance}` för alla rubriker; den
gamla regeln räknade upp sex ställen, och produkttitlar och mellanrubriker i
köpguider och villkor slutade med ett ensamt ord. Faktaraden på
/alla-produkter och /rea (`.butik-hero-meta`) har ett element per led och
pricken ritad i stilen, före varje led, med radens första prick bortklippt
(`clip-path`). ☠️ Att bara hålla ihop leden med `white-space:nowrap` och ha
pricken kvar som text räckte inte: raden bröts då efter en prick i stället för
mitt i ett led (mätt på det första försöket).

**Tryckytor.** Tio ställen låg under 40 px på mobilen, mätt med
`::after`-ytan inräknad (sidhuvudets knappar har redan sådana och ser bara
små ut för den som mäter elementet): brödsmulorna på /butik, /alla-produkter
och samlingssidorna (26 × 18), avdelningsnamnen i registret (23 px),
köpvillkorens innehållsförteckning (31), "Visa mer" i en recension (18),
länken på ångra-sidan (24), toppremsans Instagram och Facebook (28 × 28),
kassans sidfot och logga (16 till 34), bildtexten under en produktbild i en
köpguide (38), "Tillbaka till bloggen" (21) och länkarna under "Relaterade
sidor" i köpvillkoren (21). ☠️ Mät om efter rättningen: bildtexterna stod
kvar på 38 px första gången, för bildraderna (`.blog-produktrad`) har en egen,
mer specifik regel. Ytan växer utan att något flyttas:
luft in och lika mycket marginal ut, eller en osynlig yta runt länken.

**Sett i den här rundan och gjort i nästa** (avsnittet "Produktkortet är en
bricka, överallt" nedan): rubrikerna i två typsnitt, produktkortens två
utseenden, lådornas olika tomma lägen och orden "Kundservice" och
"Kundtjänst". Kvar: en produktbild i Bygg & Renovering visar leverantörens
märke på verktyget, och det är avgjort sedan 2026-10-28: VEVOR-loggan på
själva varan får stå.

## Produktkortet är en bricka, överallt (Leonard 2026-11-18)

Leonards ord: "visuellt sexig ska det vara", och korten "super sexigt visuellt
o optimerat". Samma dag fick infosidorna rubriktypsnittet, lådorna ett
gemensamt tomt läge och kundtjänsten ett ord. `lib/produktkortet.test.ts`
vaktar alltihop.

**Ett kort, en uppsättning regler.** `ProductCard` var hela tiden en
komponent. De två utseendena kom av att `app/startsida.css` (`.hem2 .prod`) och
`app/butik/butik.css` (`.butik2 .prod`) skrev över grunden med samma femton
rader var. Nu är brickan grunden (`.prod` i `app/globals.css`) och de två
kopiorna är borta: fotot på en platta med 18 px hörn, namnet, betyget och
priset under, ingen ram och ingen knapp. Plattan var varm (`#F4EEE8`, med
`mix-blend-mode:multiply` så att fotonas vita botten tog plattans ton) till
2026-11-25; nu är den vit överallt, se "Vit bakgrund bakom varje bild" sist i
filen. `.pbtn` finns inte längre,
varken i komponenten eller i stilen. Listorna (ShopBrowser, `.shoplista`) kapar
namnet vid tre rader, och vid fyra på mobilen (≤ 540 px). Övriga ytor kapar
vid två, som startsidans brickor alltid har gjort.

☠️ Radgränsen ska mätas, inte väljas på känn. Första versionen hade tre rader
överallt i listorna. På förhandsvisningen kapade det 42–63 % av namnen på en
393 px bred skärm och 63–88 % på en 360 px bred, där den liva sajten visade
hela namnet: måtten och färgen står sist i namnet, och det är dem man jämför
på. Med fyra rader kapas 1 av 96 namn på 393 px, 3 av 96 på 375 px och 10 av
96 på 360 px (fyra listsidor à 24 kort). Från 541 px och uppåt kapas inget.

Mätt på /kategori/mobler, mobil 393 px, före (live) och efter: kortet 383 →
277–296 px högt, radsteget 401 → 302–320 px, hela varor inom två skärmar 4 → 6
(sök 6 → 8). Dator 1440 px: kortet 460 → 365 px, radsteget 480 → 399 px, hela
varor inom två skärmar 0 → 4. Layoutskift och rulltid är oförändrade.

- **Med hovrande pekare** lyfter plattan (inte kortet), namnet tar
  märkesfärgen och en pil tonar in i plattans hörn (`.pimg::after`). Pilen är
  det enda som är kvar av knappen. ☠️ Ingen transform på själva kortet och
  inget av det här utan `@media (hover:hover)`: på iPhone fyrar `:hover` vid
  första beröringen, och en transform mitt i gesten bröt svepet mellan
  bilderna (2026-09-24).
- **☠️ Fyndauktionens kort delar klassen `.prod`** (`components/auction-card.tsx`)
  men är ett kort med ram. Dess grund står under `.prod.auction-card` med de
  värden kortets grund hade förut, och brickans hover-regler gäller
  `.prod:not(.auction-card)`: auktionen använder `.pimg::after` till sin egen
  glöd. Den som ändrar `.prod` ska jämföra auktionskortets beräknade stil före
  och efter.
- **Mobilens rutnät håller sig inom containern** (26 px). Korten med ram gick
  ut till 12 px från kanten; en platta utan ram ska linjera med rubriken och
  verktygsraden ovanför. Plattorna är 164 px breda på en iPhone, som på
  startsidan.
- `lib/kort-andra-bild.test.ts` letade efter bildbytet i filens första
  `@media (hover:hover)`-block. Det finns fler sådana block nu, så provet
  letar upp det som bär `.pimg-alt`.
- **☠️ Bloggens artikelkort delar också klassen `.prod`** (`app/blogg/page.tsx`).
  De följde med när brickan blev grunden, och det syntes först i provet på
  förhandsvisningen: rubriken kapades vid två rader (18 av 44 på 1024 px, 8 av
  44 på 1440 px) och fotona tonades av blandningsläget. Kortet bär nu
  `blogg-kort`: tre rader, då ryms varje rubrik hel på alla bredder, och
  `mix-blend-mode:normal`, för blandningen är gjord för produktfoton på vit
  botten. Den som ändrar `.prod` ska leta upp ALLA som bär klassen
  (`grep -rn '"prod' app components`), inte bara `ProductCard`.

**På datorn står fotona på vitt i listorna (Leonard 2026-11-19: "bakgrunden
blir vit igen … det va finare").** När brickan blev grunden fick också
kategorierna, söket, rean och alla-produkter den varma plattan; före det stod
deras foton på vitt. Från 881 px har `.pimg` i listorna vit botten och en
hårfin ram (`var(--line)`), och bilden ritas utan `mix-blend-mode`, för mot
vitt gör blandningen ingenting. Startsidan (`.hem2`) och /butik med prissidornas
översikt (`.butik2`) behöll den beige brickan till 2026-11-25; sedan dess har
de samma vita platta med ram som listorna ("Vit bakgrund bakom varje bild",
sist i filen). Mobilen (880 px och smalare) har vit platta överallt sedan
2026-11-20, se nedan. Blocket står i `app/globals.css` före "Fyndauktionens
kort", och `lib/produktkortet.test.ts` vaktar det.

Mätt i det lokala bygget, beräknad stil på varje kort: vitt med ram och
`normal` på /kategori/…, /sok, /rea, /alla-produkter, /under-1000-kr/mobler
och i raden med liknande varor på produktsidan (1440 och 1024 px); beige och
`multiply` på /, /butik och /under-500-kr; beige överallt på 880 och 393 px
(vitt där sedan 2026-11-20). Lyftet och pilen vid hovring är oförändrade. ☠️ /under-1000-kr/mobler är en
lista (ShopBrowser) och blev vit, fast översikten /under-500-kr är beige: det
är samma skillnad som mellan /butik och en kategorisida.

☠️ **"Beige på mobilen" är beräknad stil i Chromium. I Safari på iPhone är
brickan vit.** Mätt på riktiga telefoner 2026-11-20, pixlar i skärmbilden:
iPhone 15 med iOS 27 visade (255, 255, 255) i kategorin, och iPhone 17 med
iOS 26 visade vitt på startsidan ("Veckans fynd") och i söket, där samma kort
i Chromium med mobilvy och i Samsung Internet på en Galaxy S24 är beige
(244, 238, 232). På mobilen ligger fotot i den svepbara bildraden
(`.pimg-track-swipe`), och Safari blandar det då inte mot brickans färg: det
vita i fotot täcker brickan. Orsaken är inte bekräftad i kod. I Safari på Mac
(26.4) fungerar blandningen: startsidan beige, listorna vita.

**På mobilen är plattan vit i alla webbläsare (2026-11-20).** Samma kort hade
två utseenden: vitt på iPhone, beige i Chromium och Samsung Internet. Nu har
`.pimg` vit botten och fotot ritas utan `mix-blend-mode` på 880 px och
smalare, på varje sida, också startsidan och /butik. Ingen ram: det är så
iPhone redan visade korten, så den som handlar på iPhone ser ingen skillnad.
Blocket `@media(max-width:880px)` stod direkt efter datorns block till
2026-11-25, då plattan blev vit i grunden och blocket togs bort. Mätt i det
lokala bygget, beräknad stil på varje kort: vitt, 0 px ram och `normal` på nio
sidtyper vid 880 och 393 px (36 av 36 med datorns två bredder), och pixlarna
i plattans övre vänstra hörn är (255, 255, 255) på startsidan, i kategorin och
i söket. ☠️ Leonard fick frågan vitt eller beige och svarade "gör fixarna": vitt
valdes för att det är det han ser på sin egen telefon och det han ville ha på
datorn. Vill han ha beige på mobilen räcker det inte att ta bort blocket:
Safari på iPhone visar ändå vitt tills blandningen i den svepbara raden är
löst.

**Rubriktypsnittet på infosidorna.** Sidans huvudrubrik är serif på varje sida
utom produktsidan och kassan: `.om-hero h1` (tio infosidor) och `.pagehero h1`
(villkorssidorna och köpguiderna) hade sans i 800. Sektionsrubrikerna under en
överrubrik (`.om-sektion h2`, `.om-slut h2`) följer med, annars bytte sidan
röst efter första skärmen. Rubriker inne i löptext (`.prose`) och allt i
köpflödet är kvar i sans.

☠️ Typsnittsfamiljen heter `rubrik` i den beräknade stilen, inte Newsreader
(`--font-display: "rubrik", "Newsreader Reserv", …`). Ett prov som letar efter
"Newsreader" i `font-family` säger "sans" om varje rubrik, också de som är
rätt. Fråga webbläsaren vad den ritar med i stället:
`CSS.getPlatformFontsForNode` över CDP svarar "Newsreader 16pt" eller "Geist"
och säger om det är webbtypsnittet eller reserven.

**Lådornas tomma läge** (`.lada-tom`): varukorgen och favoritlådan har samma
rundel, rubrik, rad och knapp ("Upptäck sortimentet →" i märkesfärgen).
Varukorgens eget kort med ram och serifrubrik är borta (`.cart-empty*`).

**Kundtjänst är ordet.** Sidan, adressen, sidtiteln och mobilmenyn säger
"Kundtjänst", och löptexten "kontakta kundtjänst". Överrubriker och kort sa
"Kundservice" på åtta ställen; de säger nu "Kundtjänst". Sidfotens spalt heter
"Hjälp" (annars hade spalten och dess sista länk samma namn). ☠️ Jag föreslog
först det omvända, efter att ha räknat bara ordet med stor bokstav i
`.tsx`-filerna (8 mot 4). Med löptexten medräknad var det sidans namn som
skulle gälla. Kundernas egna omdömen (`lib/curated-reviews.ts`) är citat och
rörs inte.

**Sett men inte ändrat:** på datorns kategorisidor står alla filter utfällda
ovanför varorna. På /kategori/mobler är verktygsraden med filtren 625 px hög
och första varuraden börjar 1 364 px ner (1440 × 900). /alla-produkter har
samma filter hopfällda bakom en knapp och börjar vid 776 px.

## Studion: hjälten som fotostudio, och Black Week-temana (2026-11-17)

Leonard 2026-11-17: "göra bakgrundsfärgen i hero sektionen en mer premium 3d
look codad och sen tema för black friday", och sedan "finslipa den till max".
Han valde Studio bland fyra förslag och svart och guld bland två.

**Studion** (`app/startsida.css`, blocket "Studion", färgerna i `:root` i
`app/globals.css`). Hjälten är en fotostudio i ren CSS, utan bildfiler:

- Väggen tonar över i ett golv, en ljuskägla faller uppifrån mot varorna och
  en ljuspöl ligger på golvet under dem.
- Varuväggen står vinklad mot texten i riktigt perspektiv på dator och speglas
  i golvet (`-webkit-box-reflect`). På mobilen står brickorna upprätt och var
  och en bär sin egen spegling.
- Brickorna har ljus kant upptill och varmare ton nedtill, siffrorna ligger på
  en glasskiva, knappen har ljus ovankant och mörk underkant, och orden
  "tryggt köp" glöder svagt.
- Rörelse: ett ljussvep över knappen en gång, och varuväggen följer
  muspekaren några grader på dator (`components/hero-lutning.tsx`).

☠️ **Ljuset sitter på `.herogrid`, inte på `.hero`.** Varuväggens mitt står på
en fast andel av rutnätets bredd (76 % + 15 px), men inte av hjältens: på en
bred skärm är rutnätet 1 128 px mitt i hjälten. Första skisserna satte ljuset
i procent av hjälten och stämde bara vid 1 440 px.

☠️ **Entrén väntar tills sidan är lugn ("studion vaknar").** Leonard provade
på en iPhone 15, två gånger (2026-11-18): "den är lite hackig", "det är inte
smooth". Förra entrén började vid första bildrutan. Mätt på kall mobil med
strypt nät och processor byts typsnittet in 86 till 126 ms efter första
bildrutan, två brickbilder landar cirka 320 ms efter, och huvudtråden står
still i 200 till 320 ms i samma ögonblick. En rörelse som går just då hackar,
hur den än är ritad. Nu är den byggd så här:

- Texten står på plats från första bildrutan (rubriken är fortfarande LCP).
- Skriptet först i sidan (`INTRO_EN_GANG` i `components/site.tsx`) sätter
  `data-entre="vantar"` på `<html>`: bara på startsidan, bara första gången i
  fliken och aldrig för den som bett om mindre rörelse.
- I väntläget hålls varorna nästan osynliga (0,01, inte 0) och texten 12 px
  lägre. Det är startrutan i en animation med fördröjning, inte en fast stil,
  så efter 2,4 s visas varorna av sig själva även om inget skript körs.
- `components/hero-entre.tsx` byter till `"gar"` när sidan är väckt,
  typsnittet och brickornas bilder är inne och fyra bildrutor i rad har kommit
  i tid (`lib/hero-entre.ts`). Då tänds ljuskäglan, varorna reser sig i
  djupled, texten lyfter sig och ett ljussvep går över knappen.
- På mobilen reser sig hela raden med brickor som en yta, och brickorna står
  upprätt (de lutade först 5 grader, och priset blev bara "ganska" skarpt).

☠️ **Väntläget och entrén har egna nyckelrutor med samma startruta**
(`vantaLyft`/`textLyft`, `vantaTona`/`framTona`, `vantaLjus`/`ljusTands`). Med
samma namn i båda lägena startar webbläsaren ingen ny animation vid bytet: den
fortsätter den som redan går med de nya tiderna, och den har då redan gått
förbi sitt slut. Texten och toningen hoppade rakt till slutläget. Det syntes
först i mätningen bildruta för bildruta, inte i en skärmbild.

Mätt i Chromium med samma strypning (median av fyra laddningar), i entréns
eget fönster: längsta luckan mellan två bildrutor är cirka 50 ms (förr 230
till 320 ms), och raden med brickor flyttar sig som mest cirka 6 px mellan två
bildrutor (förr 29 px för en bricka och 32 px för rubriken). Kurvan är
`cubic-bezier(.4,0,.1,1)`: 3 % av rörelsen på de första 10 % av tiden.

☠️ **`*{animation:none!important}` når inte `::before` och `::after`.**
Butikens regel för mindre rörelse väljer bara element. Ljussvepet och temats
stoft låg kvar för den som bett om mindre rörelse tills de fick egna regler.

☠️ **Inget filter i hjälten.** Glöden på de kursiva orden är en text-shadow.
Ett filter på text med `background-clip:text` är skört i Safari.

**Black Week** (`lib/sasongstema.ts`, sist i `app/sasongstema.css`). Tre teman
i rad med samma utseende, svart och guld, eftersom varje namn bara får stå en
gång:

| Tema | Svensk tid | Raden över rubriken | Ordet bakom |
|---|---|---|---|
| `blackweek` | mån 23/11 00:00 till fre 27/11 00:00 | Black Week · 23–29 november | Black |
| `blackfriday` | fre 27/11, hela dygnet | Black Friday · i dag | Friday |
| `blackweekend` | lör 28/11 00:00 till mån 30/11 00:00 | Black Week · till söndag | Black |

Temat byter nattens och studions variabler, så toppremsan, sidhuvudets linje,
hjälten, löftesremsan, auktionsremsan, nyhetsbrevet och sidfoten följer med.
Butikens orange står kvar i loggan, menyn och produkternas etiketter.

☠️ **Knappens text är en variabel (`--natt-knapp-text`).** Guldknappen är ljus,
så texten är mörk i temat. Samma knapp står i nyhetsbrevet och auktionsremsan,
som förr hade vit text fastskriven.

☠️ **Guldstoftets ringar står i varuväggens mått, aldrig i procent av
hjälten** (`--studio-stoft`). I procent hamnade de intill text och på
glasskivans kant på smala skärmar och såg ut som fläckar.

**Provläget.** Ett tema som börjar nästa vecka går inte att se i dag, så en
förhandsvisning hos Vercel (`VERCEL_ENV` "preview") lyder adressen:
`?tema=blackweek`, `?tema=blackfriday`, `?tema=blackweekend`, och `?tema=av`
för butiken utan tema. Valet ligger kvar i fliken. I produktionen finns den
koden inte i skriptet; `lib/sasongstema.test.ts` fäller om den gör det.

**Mätt 2026-11-17, lokal build i Chromium:**

- 19 bredder (320 till 1 920 px) i fyra utseenden, 76 lägen: ingen sidscroll,
  ingen rullning på höjden i brickraden, inga sidfel.
- axe-core: 0 kontrastfel i alla fyra utseenden, mobil och dator.
- Hjältens höjd: oförändrad på dator (624 px), +23 px på mobil vid 390 px
  (579 mot 556), för glasskivan och speglingens plats.
- Faktaraden gick in i sig själv på glasskivan på två ställen och är rättad:
  375–390 px (stjärnornas kolumn får mer bredd) och 881–1 099 px (korta
  etiketter och andra andelar).
- Halloween och Singles ser hela ut ovanpå studion.

**Inte provat:** Safari och en riktig telefon (speglingen, perspektivet och
textskärpan på de vinklade brickorna), och Firefox, som inte ritar speglingen.

## Kassan nekar e-postadresser som inte kan finnas (2026-11-18)

En order lades med en adress som slutade på `.con`: bekräftelsen, kvittot
och spårningen kom aldrig fram. Leonard: "vår kassa borde inte acceptera mail
som inte existerar", och "för medlemmar borde mail adressen följa med".

Tre spärrar, som i kassorna hos de stora butikerna:

1. **Formen** (`epostFel` i `lib/kassa/formular.ts`): namn@doman.topp, en hel
   domän, inga led som börjar eller slutar med bindestreck.
2. **Toppdomänen finns.** IANA:s hela lista (1 436 stycken, version
   2026111700) står i samma fil. `.con` finns inte. Felet säger det rakt ut:
   "Adressen slutar på .con, som inte finns. Menade du .com?"
3. **Domänen kan ta emot e-post.** När kunden lämnat fältet frågar kassan
   `/api/kassa/epost-kontroll`, som slår upp domänen i DNS
   (`lib/kassa/epost-dns.ts`). Finns domänen inte, eller har den varken
   e-postservrar eller en adress, visas ett fel och köpet spärras för just den
   adressen.

Spärr 1 och 2 gäller i webbläsaren (bocken, felet under fältet) och på servern
(`provaKassa`, som båda betalvägarna och snabbkassan går igenom). Förslaget
"Menade du namn@gmail.com?" står kvar bredvid felet. Då står frågan bara en
gång (`epostFelUtanForslag` tar bort "Menade du .com?" ur feltexten), och ett
tryck på förslaget släcker felet: det gällde den gamla adressen. Mätt på
förhandsvisningen 2026-11-18: förut stod "Menade du" två gånger, och felet
stod kvar under en rättad adress.

- ☠️ **Bara det som säkert är fel nekas.** DNS-frågan har en tidsgräns på
  1,5 s, och allt osäkert (tidsgräns, trasig namnserver, okänt fel) släpper
  igenom kunden. Rutten nekar aldrig ett köp själv.
- ☠️ **Listan över toppdomäner ska vara hela listan.** En toppdomän som saknas
  stänger ute en riktig kund. `lib/kassa/epost.test.ts` fäller när listan är
  äldre än två år: hämta filen hos IANA, ersätt listan och versionen.
- ☠️ **Reglerna står i `formular.ts`, inte i en egen fil.** Modulen läses av
  `node --test` utan importer, och bygget tillåter inte importer med
  `.ts`-ändelse (bygget föll på typkontrollen när reglerna låg i egna filer).
- ☠️ **Ingen e-postadress i loggen**, bara att uppslaget felade.
- **Medlemmens e-post** läses ur sessionen i `app/kassa/page.tsx` och fyller
  fältet. Den skrivs efter de uppgifter som sparats i webbläsaren, så ett
  inloggat köp räknas på kontot.

Inte provat: DNS-frågan mot riktiga domäner i produktionen (beslutet är prövat
med låtsassvar), och kassan i Safari.

## Prissidorna: Visa fler och miniatyrer (2026-11-18)

Leonard om /under-500-kr och /under-1000-kr: "det borde finnas visa mera knapp
så man kan se alla och kategorierna borde ha minityr bilder som menyn har".

- **Visa fler** (`components/pris-fler.tsx`). Sidan bär de 24 första korten;
  knappen hämtar nästa 48 från `/api/pris-lista?k=<pris>-<sida>` och lägger dem
  sist i samma rutnät. Listan är `prisLista` i `lib/seo/pris-oversikt.ts`:
  urvalet först, i samma ordning som sidan, sedan resten med bästa bilden
  först. Varor som bara får synas i sin underkategori står inte med.
- ☠️ **Högst 48 kort per hämtning.** Listans kort får bara bild för de 48
  första (`FORSTA_MED_BILD` i `lib/list-payload.ts`); provet jämför talen.
- ☠️ **En parameter i adressen**, som `/api/lista`: varje annan parameter hade
  blivit en egen CDN-nyckel. Påhittade sidnummer ger 404.
- **Miniatyrerna** (`components/pris-kategoribild.tsx`) är menyns egna bilder
  och menyns egen hämtning (`use-meny-bilder.tsx`), så sidan hämtar inget nytt.
  Rutan har fast storlek och inget flyttar sig när bilden kommer.

Mätt lokalt 2026-11-18: under 500 kr har 374 varor och under 1 000 kr 2 986.
Två tryck ger 120 kort utan dubbletter, alla med bild, och alla 84 kategorier
under 1 000 kr har en miniatyr.

## Hastigheten mätt 2026-11-10: startsidan byggdes om var 15:e sekund

Lighthouse på mobil (strypt till långsam 4G) gav 81–86 i prestanda, med
simulerad LCP 3,5–3,9 s. Utan strypning låg LCP på 0,46–0,66 s på produkt- och
kategorisidan, CLS var 0 och första byten kom efter 80–110 ms. Sidorna är
alltså snabba i verkligheten, och det som fanns att hämta var tre saker:

- ☠️ **Startsidan byggdes om var femtonde sekund**, fast sidan säger en timme.
  Auktionsbannerns hämtning (`hämtaAuktionsrader`) hade auktionssidans 15
  sekunder, och Next sänker hela rutten till den kortaste fetch-tiden på sidans
  väg. Mätt mot butiken: `age` kom aldrig över 16 s och vartannat svar var
  `STALE`, medan /butik låg kvar. Första byten tog 0,56–0,72 s mot 0,20–0,30 s
  för övriga sidor, och varje ombyggnad frågade Wix om priset på varje fynd.
  Nu läser startsidan raderna med egen nyckel (`sida: "startsidan"`) och en
  timmes cache. `lib/auction-motor.test.ts` fäller om startsidan läser utan
  nyckeln. Samma fälla som produktsidans 300 sekunder (2026-09-30, överst).
  Kvar: `lib/image-scores.ts` har 600 s, så startsidan och /butik byggs om var
  tionde minut, inte en gång i timmen.
- **Bildernas `sizes` följer den bredd bilden visas i** (`lib/bild-sizes.ts`).
  Förut stod hela skärmens bredd, så en iPhone hämtade hjältebilden i 1200w
  och bildrutorna i 640w fast de visas i 338 och 122 px. Nu 1080w och 384w, och
  kortbilden 384w i stället för 640w på telefoner i 2x och breda datorskärmar.
  Mätt i Chromium på åtta skärmar: ingen fil har färre pixlar än sin ruta
  (lägsta kvot 1,02). Wix AVIF är större än webp i samma kvalitet (121 mot
  83 kB i 750 px), så formatet är kvar.
- **De två första korten hämtas med `fetchpriority=high`, resten är lazy**
  (`components/shopbrowser.tsx`, 2026-11-12; förut fyra). `priority` på
  `<Image>` ger förladdning men inte attributet, så listsidornas största bild
  köade efter skripten. Fyra förladdningar tävlade sedan med sidans största
  bild: på /kategori/mobler låg kort tre och fyra under vikningen på telefonen
  och alla fyra under kategorins bild på datorn. ☠️ `loading="eager"` är ingen
  mellanväg: Reacts server lägger själv en förladdning i `<head>` för varje
  `<img>` som inte är lazy (mätt: kort tre och fyra fick var sin). Ett lazy kort
  i första raden (fyra kolumner på /alla-produkter) hämtas så snart layouten
  är klar.

Inte ändrat, med flit: rubriktypsnittet (Newsreader, 75 kB; Fraunces 81 kB när raden skrevs) förladdas på varje
sida fast produktsidan inte visar det ovanför vikningen. Utan förladdningen
blinkar rubriken på startsidan och kategorisidorna när typsnittet byts in.

Så syns om startsidan är rätt cachad efter en deploy:

```
curl -sS -o /dev/null -D - https://www.fyndplats.se/ | grep -i -E "^(age|x-vercel-cache)"
```

`age` ska kunna stå över 16 sekunder utan att svaret blir `STALE`.

## Bloggen: ett inlägg som åldras (2026-11-10)

Tullinlägget (`content/blog/nya-tullreglerna-2026-eu-lager.md`) skrevs 30 juni i
futurum och stod orört i drygt fyra månader. Det länkas från startsidans
EU-märke och från /eu-lager-garanti. Leonards fråga 2026-11-10: "den har
produkter o sånt i sidan, den borde inte ha det".

- ☠️ **Handplockade produkter i ett inlägg åldras.** Tre varor låg som helbreda
  bilder mitt i texten: 2 400 av sidans 6 500 px på dator, utan pris, och en av
  dem var slutsåld. De är borttagna. Ett inlägg som förklarar något länkar till
  sortimentet eller en kategori, inte till enskilda varor. Köpguiderna är en
  annan sak: där är varorna själva innehållet, och de står i en produktrad.
- **`updated_date` i frontmattern** när texten skrivs om. Sidan visar då
  "Uppdaterad …" i stället för publiceringsdagen, och `dateModified` och
  sitemapens `lastmod` följer med. Sätt det bara vid en verklig omskrivning.
- **Omslaget ska ha formen 1200 × 630.** Sidan reserverar den formen, så en
  bild i annan form flyttar texten när den laddats: tullinläggets stående
  lagerbild gav CLS 0,04 på mobil och sköt texten 1 064 px ner (nu 738 px och
  CLS 0). Inlägget har nu ett eget omslag i husstilen (`/blog-eu-tull-2026.jpg`,
  mörk botten, loggan, serifrubrik med ett led i orange). En Wix-bild går att
  beskära i adressen i stället:
  `…~mv2.jpg/v1/fill/w_1200,h_630,al_t,q_85/namn.jpg` (`al_t` = övre delen).
  Kvar: 15 inlägg har kvadratiska omslag, där texten börjar 927 px ner på mobil
  och CLS är 0,01–0,02. Varje bild behöver ses innan den beskärs.
- **En rubrikrad i en citatruta** (`> ### Vårt löfte`) blir fet text. Förr
  skrevs tecknen ut. `lib/local-blog-render.test.ts` fäller om något inlägg
  skriver ut råa rubriktecken.
- **Källraden står före "## Vanliga frågor".** Efter sista svaret hamnar den i
  svaret i FAQPage.
- Fakta om tull hämtas hos Tullverket ("Ny tullavgift från den 1 juli 2026"),
  inte ur minnet: 3 euro per vara sedan 1 juli 2026, 2 euro i hanteringsavgift
  per vara från 1 november 2026, och procenttull i stället från 1 juli 2028.

## Produkttextens länkar till syskon som flyttat, och slutsålda sidors länk (2026-11-11)

Två notiser i Semrush hade en riktig orsak i butiken. Båda är lösta vid visningen,
utan att något ändras i Wix.

- ☠️ **166 länkar mellan produktsidor gick till en omdirigering.** Poleringen
  skriver "Passar inte den här?" med länkar till syskonen ("Samma vagn i svart").
  När syskonen senare slås ihop till en sida med färgval, eller får en ny adress,
  står länken kvar i texten. Tolv av tolv stickprov stod kvar i sidornas HTML.
  - `medLevandeLankar` (`lib/interna-lankar.ts`) byter adressen när sidan ritas,
    mot den som omdirigeringen ändå leder till (`FyndplatsRedirects`). Ankartexten
    stämmer: givarens omdirigering landar på givarens färg (`?variant=`).
  - Bara länkar vars slug INTE är en publicerad produkt slås upp, alla i ett anrop
    (`getProductRedirects`, `$in`). Ett mål som självt har flyttat följs, högst tre
    steg. Ett mål som inte finns skrivs aldrig in: hellre en omdirigering än en död
    länk. Kan tabellen inte läsas ritas texten som den står.
  - ☠️ Uppslaget tar produktsidans egen `revalidate`. Next låter sidans kortaste
    fetch styra hur ofta sidan byggs om, och det vanliga uppslagets 300 sekunder
    hade byggt om varje sådan sida var femte minut.
  - Texten i Wix är fortfarande gammal. Den rättas när produkten poleras om.
- ☠️ **475 sidor i sitemapen hade ingen intern länk.** Alla var slutsålda:
  listorna döljer dem (`forListings`), sitemapen behåller dem, och ingenting
  länkade dit. 208 sidor låg dessutom fler än tre klick från startsidan.
  - Kategorisidan har en andra hopfälld textlista, "Slut i lager just nu", under
    A–Ö-listan (`slutsaldaIKategorin` i `lib/list-pages.ts`, regeln i
    `lib/slutsalda-lankar.ts`). Rutnätet rörs inte: kunden ser bara det som går
    att köpa.
  - Slutsålda som ingen kategorisida kan bära (bara i Övrigt, eller i en kategori
    som saknar sida för att allt i den är slut) listas på `/alla-produkter`.
  - Listan är tom när `SHOW_OOS_IN_LISTINGS=1`, och för rea och populära.
- Inte ändrat, med flit: startsidans adress i sitemapen står utan snedstreck sist
  (`https://www.fyndplats.se`), samma som sidans canonical. Semrush räknar den som
  en sida utan intern länk, men det är samma adress enligt standarden.

## Favoriterna: lådan, hjärtat och kontot (Leonard 2026-11-14)

Leonards skärmbild visade lådan "Mina favoriter" med adressernas ord som namn
och ingenting annat. Nu visar varje rad bild, namn, pris, lager och en knapp,
och en inloggad medlems favoriter följer kontot.

- **Reglerna står i `lib/favoriter.ts`**, en ren modul utan importer (den går
  till webbläsaren). Proven står i `lib/favoriter.test.ts`.
- **Listan är densamma som förut:** `fp_wishlist` i webbläsarens minne, en lista
  av produktadresser med den äldsta först. Lådan visar den nyaste först. Taket
  är 100 (`MAX_FAVORITER`), och de nyaste står kvar.
  - ☠️ Taket får aldrig gå om `MAX_SLUGGAR_PER_UPPSLAG` i `lib/products.ts`:
    hela listan ska rymmas i ETT uppslag.
- **Uppslaget är ett enda anrop:** `GET /api/favoriter?s=<adress>,<adress>` läser
  alla favoriter med `queryProducts().in("slug", …)` (`getProdukterForSluggar`),
  samma uppgifter som produktkortet. Adresserna sorteras i frågan
  (`favoritFraga`), så att kanten kan spara svaret. En adress som inte längre
  finns kommer tillbaka under `saknas`.
- **Det sparade kortet** (`fp_wishlist_info`: namn, bild, pris per favorit)
  skrivs när hjärtat tänds (`kortUrSidan` läser kortet det sitter på) och när
  butiken svarar. Lådan visar det direkt, och butikens svar gäller framför det.
  - ☠️ Namnet byggs aldrig ur adressen med versal på varje ord. Saknas kortet
    visas adressens ord med EN versal (`namnUrSlug`) tills svaret kommit.
  - En vara som är borta visar det sparade namnet dämpat, utan pris och knapp.
- **Radens knapp** (`handling`): "Lägg i varukorgen" bara när varan finns i
  lager och inget val krävs, annars "Välj alternativ" eller "Bevaka varan".
  Borttagning går att ångra i sju sekunder.
- **Hjärtat på produktsidan** är `FavoritKnapp` bredvid köpknappen
  (`.buy-rad`). Kortens hjärta är `WishlistHeart`.

### Kontot

- **Favoriterna bor på medlemsraden** i `FyndplatsMedlemmar`: fälten
  `favoriter`, `favoriterVersion` och `favoriterAndrad`. Ingen ny kollektion.
  Motorn ändrar bara enskilda fält på raden och tar bort hela raden när kontot
  tas bort (läst i motorns `lib/medlem/admin.ts`), så listan skrivs aldrig över
  och försvinner med kontot utan en ändring i motorn.
- **Skrivningen är villkorad på versionen** (`andraFavoriter` i
  `lib/medlem/lager.ts`, `andraILager`): läs, räkna, skriv bara om versionen är
  densamma, annars läs om, högst fyra gånger. Två enheter samtidigt tappar
  inget hjärta. Den första skrivningen villkoras på att fältet saknas.
- **Rutten** `/api/konto/favoriter`: `GET` ger kontots lista, `POST` tar
  `{ lagg, taBort }` och svarar med hela listan. 401 utan session. Loggen bär
  varken e-post eller varor.
- **Avstämningen** (`synkplan`):
  - Första gången inloggad läggs enhetens lista till kontots i ett anrop.
  - Därefter köas varje tryck (`fp_wishlist_ko`) och skickas efter en halv
    sekund. Kön överlever en omladdning och en stund utan nät.
  - Kontot frågas högst var femte minut, och var trettionde sekund när lådan
    eller Mina sidor öppnas. Ett svar tar bort det som skickades ur kön efter
    innehåll, inte efter antal (`utanSkickade`), så att två flikar inte tar
    varandras ändringar.
- ☠️ **Utloggning och en session som gått ut är två olika saker.**
  - Går sessionen ut av sig själv står listan kvar i webbläsaren som en vanlig
    lista (`slapp`). Annars hade favoriterna försvunnit för en kund som inte
    gjort någonting.
  - Loggar kunden ut själv lämnar kontots lista enheten (`vidUtloggning`), och
    bara det som aldrig hann skickas står kvar. Hjärtat känner igen
    utloggningen på formuläret till `UTLOGGNING`. Byter utloggningen form ska
    provet "hjärtats lyssnare känner igen formulären som loggar ut" följa med.
- **Mina sidor** har sektionen `#favoriter` (`app/konto/favoriter.tsx`), med
  samma rader som lådan. Lådans fot länkar dit för en inloggad medlem.
- **Integritetstexten** nämner favoriterna (vad som sparas, var, och att de tas
  bort med kontot).

### Mätt och inte mätt

- Uppslaget mot Wix tog 0,3–0,8 s för tre till fem favoriter (lokalt bygge mot
  den riktiga katalogen, 2026-11-14).
- Webbläsarprovet (Chromium, grenens bygge serverat under butikens adress,
  kontot spelat i minnet): 240 kontroller utan fel i 320, 390, 768 och 1280 px.
  Mutationsprovet fäller 89 av 89 ändringar i reglerna.
- ☠️ **Inte provat före mergen:** en riktig inloggning och den riktiga
  skrivningen till Wix (listfältet med villkoret på versionen). Proven kör mot
  ett lager i minnet. Safari och iPhone är inte heller provade. Prova med ett
  riktigt konto på en förhandslänk innan funktionen räknas som kvitterad.

## Menyn med bilder, och skrollåset (Leonard 2026-11-15)

Datorns meny och mobilmenyn visar en bild per avdelning och underkategori.

- **Bilderna** kommer från `/api/meny-bilder` (CDN-cachad en timme, byggd vid
  bygget) och står aldrig i sidans HTML, så ett nytt bildval gör inte varje
  sida "ny". Urvalet: `lib/meny-bilder.ts` (mest såld först, ingen bild två
  gånger, aldrig collage, inbakad text, vattenmärke eller slutsålt) och 168
  granskade handval i `lib/meny-bild-val.ts` (bara adresser till egna sidor).
- **Hämtningen:** bildlistan (cirka 5 kB) hämtas när sidan har laddat klart
  (`load`) och webbläsaren sedan är ledig, på dator och telefon, eller direkt
  när någon rör menyn. Förut startade den vid första lediga stund, och i
  Lighthouse (som spelar in sidan ostrypt) tävlade listan och mobilens
  miniatyrer då med sidans största bild. Bilderna hämtas först när en panel
  eller ett steg öppnas.
  Mätt på förhandsbygget 2026-11-15: en datorpanel cirka 86 kB (median 612 ms
  tills panelens bilder syns), mobilens första steg 27 kB (13 miniatyrer),
  ett steg två cirka 134 kB (median 764 ms).
- ☠️ **Bara det som syns ritar bildelement.** Datorns panel ritar sina bilder
  först när den är öppen (`panelensBilder`), och mobilmenyns första steg ritar
  sina tretton när menyn ska öppnas: i förväg på en pekskärm utan sparläge
  (lådan har dem när den glider in), annars vid trycket. Förut fick alla
  tretton paneler och den stängda lådan sina cirka 186 bildelement så fort
  bildlistan kom, i en enda lång uppgift på varje sida, och lådans tretton
  bilder hämtades också på datorn där den aldrig syns. Mätt 2026-11-15:
  Lighthouse TBT på mobil cirka 105 → 200 ms mot produktionen; lokalt med
  processorn strypt fyra gånger blockerad tid 421 → 308 ms på startsidan och
  582 → 494 ms på produktsidan efter rättelsen. `lib/meny-bilder.test.ts`
  fäller en panel eller ett första steg som läser bildlistan direkt.
- **Mjuka bindestreck** (`lib/mjukt-bindestreck.ts`) vid ordfogen i långa
  namn, så att "Verkstadsutrustning" bryts som "Verkstads-" / "utrustning" och
  inte mitt i ordet. Bara i synlig text, aldrig i `aria-label` eller adresser.
  Konstanten står som escape-sekvens; provet fäller ett osynligt tecken i
  källkoden.
- ☠️ **Skrollåset sitter på `html`, aldrig på `body`** (`lib/las-sidan.ts`).
  `html` har `overflow-x:clip`, och då förs `body`:s `overflow` aldrig vidare
  till fönstret. Låset på `body` låste därför ingenting: med mobilmenyn öppen
  gick sidan bakom att svepa och skrolla (scrollY 0 → 787 med ett svep, 1 387
  med mushjulet, mätt på www och på förhandsbygget). Det gjorde dessutom
  `body` till en skrollbehållare, och då hämtade Chrome sidans lata bilder:
  tio bilder och 336 kB på startsidan varje gång menyn öppnades. Alla sex
  lager (mobilmenyn, filtren, kategorivalet, bildvisaren och de två
  fotovisarna för omdömen) låser via `lasSidan()`, som räknar samtidiga lås
  och håller rullningslistens plats på datorn. `lib/las-sidan.test.ts` fäller
  `document.body.style.overflow` var som helst i koden.

## Riktiga telefoner: Safari före iOS 16 visade felsidan på varje sida (2026-11-20)

Leonard kopplade BrowserStack 2026-11-20, och butiken provades för första
gången på riktiga telefoner. Allt före det var provat i Chromium.

☠️ **`AbortSignal.timeout` finns först i Safari 16.0. I äldre Safari kastar ett
anrop synkront.** `lib/use-klarna-ruta.ts`, som kom med Stripe-kassan
2026-11-06, anropade den i en effekt som körs på varje sida, och då byttes
hela sidan mot "Något gick fel". Mätt mot www:

| Telefon | iOS | Startsidan och produktsidan |
| :-- | :-- | :-- |
| iPhone 12 | 14.1 | felsidan |
| iPhone 13 | 15.4 | felsidan (bara produktsidan provad) |
| iPhone 14 | 16.5 | butiken |
| iPhone 17 | 26 | butiken |
| iPhone 15 | 27 | butiken |

Servern svarade 200 med hela sidan också för en gammal Safari, så felet syntes
inte i någon logg på vår sida. Återskapat i Chromium genom att köra
`delete AbortSignal.timeout` före sidans skript: startsidan, kategorin,
produktsidan, söket, auktionen och kontot föll alla, med felet i
`useKlarnaRuta`.

- **All kod som kan hamna i webbläsaren använder `tidsgransSignal(ms)`**
  (`lib/tidsgrans-signal.ts`): webbläsarens egen signal när den finns, annars
  `AbortController` med `setTimeout`, och aldrig ett kast.
- `lib/tidsgrans-signal.test.ts` går importerna från varje fil med
  `"use client"` och fäller om en nåbar fil anropar `AbortSignal.timeout(`.
  ☠️ Felet stod redan antecknat i `components/card-gallery.tsx` och kom ändå
  tillbaka i tolv filer: en spärr man måste komma ihåg glöms bort.
- Serverkod (API-rutter och serverbibliotek) får använda `AbortSignal.timeout`.
- ☠️ Inte mätt: hur många besökare som drabbades. Vercels besöksstatistik
  delar inte på iOS-version, och GA4 gick inte att läsa den natten.
- **Mätt på riktiga telefoner efter rättelsen** (www, bygget från #930,
  2026-11-20 02:22–02:27 UTC). iPhone 12 med iOS 14.7: startsidan,
  produktsidan, köpknappen med varukorgens låda, kategorin och sökrutan
  ("speglar", 154 träffar) visas. iPhone 13 med iOS 15.5: produktsidan, lådan,
  kategorin med bilder, sökrutan ("ellamin" visar elkaminer) och kassan med
  Apple Pay-knappen visas. Ingen betalknapp trycktes.
- Förhandsbyggen ligger bakom Vercels skydd, så en riktig telefon når en
  rättelse först på www efter mergen. Före mergen: härma felet i Chromium.

### Safari före 15 kan inte `aspect-ratio`: listorna stod utan bilder

Samma prov på iPhone 12 med iOS 14.7 visade nästa fel. Produktkortens platta
(`.prod .pimg`) hade höjden 0, mätt med `scroll_to_element` (överkant och
nederkant på samma tal) och `is_element_displayed` (falskt). "Veckans fynd" och
kategorin visade namn, betyg och pris utan en enda bild, och produktsidans
miniatyrer var streck. På iOS 15.5 var plattan 163 px hög.

`aspect-ratio` finns först i Safari 15.0. En ruta som får höjden av den och
bara har absolut placerade barn (next/image med `fill`) faller ihop till noll.

- **Reserven** står i `@supports not (aspect-ratio:1/1)`: en `::before` med
  `padding-top` i procent av rutans egen bredd. Ett block sist i
  `app/globals.css` (kortets platta, miniatyrerna, kategorins hjältebild,
  om-sidans bilder, auktionens hjältebild på mobilen och menyernas bildrutor),
  ett i `app/startsida.css` och ett i `app/butik/butik.css`.
- `lib/reservhojd.test.ts` läser de tre stilfilerna och fäller om en väljare
  med `aspect-ratio` varken har en reserv med rätt höjd eller står bland
  undantagen med skälet utskrivet.
- ☠️ Startsidans block står FÖRE nattens avsnitt. `lib/natten.test.ts` letar
  upp filens sista `@media(min-width:881px)`, och ett block sist i filen blev
  det.
- ☠️ Rutan "Hela sortimentet" på /butik (`.b2-alla-yta`) har text i flödet. En
  `::before` med höjd hade lagt texten under bilden, så väljaren undantar den.
- Hjältens bildruta (`.hem2 .hbild`) får bredden av höjden. Reserven låter den
  fylla brickans bredd, och fotot står centrerat (`object-fit:contain`).
- **Så provas det utan en gammal telefon:** skriv om stilfilerna på vägen in i
  Chromium (Playwright `route` på `.css`): ta bort varje `aspect-ratio` och gör
  `@supports not (aspect-ratio:…)` sann. Mot www före rättelsen föll 35 av 45
  mätta ytor ihop, med samma mått som på telefonen (plattan 163 × 0,
  miniatyrerna 122 × 2). Mot det lokala bygget med reserven: 0 av 41, och 37
  av 41 har exakt samma mått som i en webbläsare med `aspect-ratio`. De fyra
  som skiljer är hjältens bildruta (med flit), en avrundning på 1 px och
  kategorins hjältebild (2 px, ramen).
- Mot förhandsbygget, med butikens riktiga data: 0 av 45 mätta ytor faller
  ihop, och auktionens hjältebild på mobilen är 336 × 189 (16:9).
- ☠️ Inte mätt: reserven på en riktig iPhone med iOS 14 (går först på www),
  menyernas bildrutor (`.mm-alla-bild` och `.meganav-feature-bild` fanns inte i
  sidan när menyn öppnades i provet, så där vaktar bara stilprovet),
  produktvideons ruta (`.gvideo`, undantagen i provet), kontots kort
  (`konto.module.css`) och iOS 14.0–14.4, som också saknar `gap` i flexrader.
  BrowserStack hade bara 14.7.

### Så provas butiken på riktiga telefoner

BrowserStack-kopplingens `devicecontrol` öppnar en riktig telefon, eller
Safari på en Mac, och styr sidan: `create_session` (Safari på iPhone heter
`iphone`, Samsung Internet `samsung`), `navigate_to`, `find_element`,
`click_element`, `send_keys`, `scroll_to_element` och `take_screenshot`.
Sessionen drar minuter tills den avslutas: sluta alltid med
`set_session_status` och `delete_session`.

- Bara publika sidor går att öppna. Delningslänken till ett förhandsbygge
  lämnas inte ut till en yttre tjänst.
- Skärmbilden är hela telefonens skärm, med Safaris egen verktygsrad.
- ☠️ Tangentbordet visas inte när text skrivs via kopplingen, och Safaris zoom,
  svep och nyp går inte att styra. Rörelse går inte att bedöma i stillbilder.
- ☠️ `clear_element` tömmer inte ett fält som React styr: texten står kvar och
  nästa text läggs efter den. Tryck på fältets eget kryss.
- Beräknad stil går inte att läsa. Mät pixlar i skärmbilden.
- Webbläsarens fellogg kom tillbaka tom från iPhone, också när sidan föll:
  återskapa felet i Chromium för att se var det kastas.
- Kontot stod på gratisplanen 2026-11-20.
- Måtten går att läsa utan skärmbild: `scroll_to_element` svarar med rutans
  överkant och nederkant, och `is_element_displayed` är falskt för en ruta
  utan höjd. `set_session_status` svarar med telefonens exakta iOS-version.
- Sessionerna 2026-11-20 efter #930: två, ungefär fem minuter.

### Fem rättelser ur samma prov (2026-11-20)

Leonard fick listan och svarade "gör fixarna". `lib/mobil-finslip.test.ts`
vaktar dem.

- **Mobilens fasta köprad glider undan medan sidans egen köpknapp syns.** Förut
  stod två köpknappar i samma skärm. `components/productview.tsx` bevakar
  knappen med `IntersectionObserver` (60 %) och sätter `is-gomd` på raden;
  utan `IntersectionObserver` står raden kvar. Raden täcker skärmens nederkant,
  så en knapp bakom den räknas som synlig och kommer fram när raden glider.
  `visibility` byts efter glidet, så den gömda knappen går inte att fokusera.
  Sidans utrymme för raden (78 px) ändras inte, så inget hoppar. Mätt lokalt
  på 390, 360 och 320 px: överst syns raden, med knappen i skärmen är den
  borta, förbi knappen är den tillbaka.
- **Ett ord för korgen.** Köpknapparna sa "Lägg i kundvagn" medan lådan heter
  Varukorg, favoriterna säger "Lägg i varukorgen" och bekräftelsen "Tillagd i
  varukorgen". Båda knapparna säger nu "Lägg i varukorgen". Radens knapp är
  163 × 47 px och ryms på en rad också vid 320 px.
- **Slutsålda val håller kontrastkravet.** Hela knappen låg på 50 %
  genomskinlighet (kortvalen på 64 %), så texten tonades med: namnet mätte
  3,3:1 och "Slut" 2,4:1 mot kravet 4,5:1 (axe mot www). Nu dämpas bara bilden,
  pricken och radion. Namnet står i `--soft` (6,0:1) och "Slut" i rött på
  ljusrött (5,9:1). ☠️ Streckad ram betyder fortfarande bara att kombinationen
  inte finns (`.na`); ge inte ett slutsålt val streckad ram.
- **Surfplattan på högkant har filtren bakom knappen** (701–880 px). En iPad
  har mobilens sidhuvud men fick datorns utfällda filter före varorna. Nu
  visas filterknappen där, och panelen fälls ut på sin plats, som på
  /alla-produkter. Mätt lokalt på /kategori/soffor-baddsoffor: första kortet
  börjar 632 px ner vid 820 px bredd (1 369 px med panelen utfälld) och 519 px
  ner vid 744 px. Lagret över hela sidan är kvar för 700 px och smalare
  (`matchMedia` i `components/shopbrowser.tsx` är orörd), och datorn från
  881 px är orörd: där står filtren utfällda, som Leonard bestämde 2026-09-25.
- **Omdömesraden på startsidan nås med tangentbordet.** På mobilen, och i en
  inzoomad webbläsare, rullar raden i sidled, och utan `tabIndex` nådde
  tangentbordet aldrig det andra och tredje omdömet (axe:
  `scrollable-region-focusable`). Raden bär `tabIndex={0}`, `role="group"` och
  ett namn. På datorn blir det ett tabbstopp till.

Mot förhandsbygget, med butikens riktiga data: 47 av 47 kontroller av
rättelserna (ett riktigt slutsålt val mätte 6,05:1 och 5,91:1), 36 av 36 för
plattan och sökningens 61. axe efteråt: inga fel på datorns sex sidlägen eller
på mobilens startsida, kategori, sök, produktsida och kassa, där www hade ett
fel på startsidan och två på produktsidan. ☠️ Kvar: kortens svepbara bildrad
(`.pimg-track-swipe`) flaggas medan menyn eller varukorgen är öppen (åtta och
fyra träffar). Då är sidan bakom med flit onåbar, och utan öppen låda flaggas
raderna inte.

**Sett men inte ändrat:** varukorgens låda på en telefon visar rubriken
"Komplettera ditt köp" men förslagen hamnar under lådans fasta fot, och man
måste rulla i den lilla ytan för att se dem (iPhone 12 och 13). Kategorierna
har två kort i bredd upp till 900 px, så en iPad visar två stora kort per
skärm medan /alla-produkter har tre från 761 px; bildernas `sizes` följer
kolumnerna och måste ändras samtidigt.

## Mobilens sökläge: varorna i ett rutnät direkt under fältet (Leonard 2026-11-20)

Leonard sökte "bilar" på sin iPhone och skickade skärmbilden: med
tangentbordet uppe rymde panelen ordförslagen, två kategorirader och rubriken
"Varor", och inte en enda vara. "Dealproffsen visar produkter direkt när man
söker." Panelen hängde under hela sidhuvudet (remsan, loggans rad och
sökraden, 170 px), varje kategori tog en egen rad, och knappen "Visa alla"
satt fäst i nederkanten.

Nu tar sökningen över skärmen på mobilen medan man söker
(`components/searchbox.tsx`, `RUTNAT`; stilen står under "MOBILENS SÖKLÄGE" i
`app/globals.css`). `lib/sok-lage.test.ts` vaktar det.

- **Bara rutan i mobilens sökrad**, den som bär `helskarm` i
  `components/site.tsx`, och bara under 900 px, där sidhuvudet byter till
  mobilens. Datorns lista och mobilmenyns ruta är som förut.
- **Sidhuvudet.** Medan panelen är öppen bär `<html>` `data-sok-lage`: remsan
  och loggans rad göms, sidan täcks av en vit yta och fältet står överst med
  knappen Stäng bredvid. Sidan under låses (`lib/las-sidan.ts`) och får
  `inert` (`lib/bakom-inert.ts`), så att varken fingret, tabben eller en
  skärmläsare når den. ☠️ Attributet sätts i en `useLayoutEffect` som står
  FÖRE den som mäter panelens höjd: annars mäts rutan där den stod i det gamla
  sidhuvudet, och panelen ritas en bildruta på fel plats.
- **Panelen** går kant i kant från sidhuvudet ner till skärmens nederkant,
  också bakom tangentbordet (`--sok-topp`; ändrat samma dag, se "Sökningen
  svarar direkt" nedan: förr slutade den vid tangentbordet). Kategorierna står
  som chips på samma rad som ordförslagen. Rubrikraden bär "Visa alla 147 →".
  Varorna står tolv i taget i ett rutnät: två i bredd under 600 px, tre under
  800 och fyra upp till 900. Fotens knapp är en vanlig knapp sist i listan.
- **Kortet**: kvadratisk bild med tunn ram, priset i en vit bricka på bilden,
  namnet på två rader med sökorden i fetstil, och "Slutsåld" i grått. I källan
  står namn, pris och slutsåld i den ordningen och utan `aria-label`, så att
  det upplästa namnet är den synliga texten; priset läggs på bilden av kortets
  rutnät (`grid-area:1/1`). ☠️ Med en `aria-label` i annan ordning än texten
  fällde axe alla tolv kort (`label-content-name-mismatch`).
- **Bilden** är samma adress som produktkortens (`tightFillUrl(…, 600, 600)`
  genom den globala laddaren), och `RUTNAT_SIZES` säger 128 px på skärmar med
  2,5 pixlar per punkt eller fler: en iPhone hämtar då 384 px-filen (2,2
  pixlar per punkt) i stället för 640. Den väger hälften och är samma fil som
  kortet i listorna hämtar på en dator.
- **Tangentbordet.** Ett drag uppåt eller nedåt i listan fäller tangentbordet
  (fältet tappar fokus), ett drag i sidled på chipsen gör det inte. En skickad
  sökning fäller det också. Bakåt och framåt stänger panelen.
- **Antalet.** Rutnätet ber rankningen om tolv, listan om sju. Båda är
  början på resultatsidans lista: det köpbara läggs först bland alla träffar
  och sedan klipps listan (`lib/sok-ordning.ts`, se "Sökningen svarar direkt"
  nedan). Förr klipptes de mest relevanta först och de slutsålda sänktes
  bland dem, och då visade rutan varor som sidan hade längst ner.
- **Safari före 15** kan inte `aspect-ratio`: kortets bildruta står i
  reservblocket i `app/globals.css` (`lib/reservhojd.test.ts`).

Mätt i Chromium mot det lokala bygget (393 × 852, tre pixlar per punkt, med
`visualViewport` bytt mot en som krymper till 395 px som när tangentbordet är
uppe): "bilar" visar chipsen, rubriken och två hela kort med bild, pris och
två rader namn; utan tangentbord sex hela kort. Fältet står 10 px från
toppen, panelen slutade då vid tangentbordet, sidan under rullar inte och står
kvar på samma plats efter Stäng (provat överst och 1 400 px ner). 320, 430,
600 och 820 px: två, två, tre och fyra kort i bredd, inget sticker ut. Utan
`aspect-ratio`: alla tolv bildrutor 174 × 174. axe: inga fel i sökläget.
Datorn: sex rader som förut. 62 kontroller i sökläget, nio till (utan
`aspect-ratio`, axe i tre lägen, piltangenterna, Esc och kakfrågan) och de
äldre 61, alla gröna.

☠️ **Inte provat på en riktig telefon före mergen.** Tangentbordet finns inte i
Chromium, och BrowserStack visar det inte heller. Det som bara en riktig
iPhone visar: att `visualViewport` krymper när tangentbordet kommer (det gör
den i den gamla panelen, som Leonards skärmbild visade), och att sidan inte
flyttar sig när fältet hoppar upp till toppen i samma ögonblick som det får
fokus.

**Sett men inte ändrat:** sökindexet väger 531 kB över nätet (7 830 varor,
2,1 MB JSON). På ett svagt nät dröjer första förslagen 2–4 s efter att fingret
landat i fältet; under tiden visar sökläget kortens platser. Ett svar från
servern för de första bokstäverna medan indexet hämtas vore nästa steg.

## Produktsidans huvudbild: tre fall där den syntes sent (Leonard 2026-11-20)

"Upplever att huvudbilden laddas och syns långsamt ibland." Mätt mot www på
en strypt mobil (390 × 844, 4 Mbit/s, 100 ms, processor ÷4):

| Väg till sidan | Huvudbilden syns |
|---|---|
| Landning på förvalet | 0,8–1,7 s (bilden är förladdad i sidans huvud) |
| Tryck på ett produktkort | 0–0,45 s EFTER sidbytet: bilden började hämtas först då |
| Landning med `?variant=` på ett annat val än förvalet | 2,4–2,9 s |

Det tredje fallet är varje klick från Google Shopping (flödet länkar varje
färg med sin variant) och varje kort i en färgfiltrerad lista (`?farg=`).
Sidan är ISR-cachad och ritas med förvalet; sidans tidiga skript dolde
bilden, priset och väljaren tills sidan hydrerat, och valets bild började
hämtas först då, 1,8–2,3 s in.

Tre ändringar, alla vaktade av `lib/sok-lage.test.ts` och
`lib/pdp-val-bild.test.ts`:

- **Huvudbilden hämtas i trycket** (`lib/hjaltebild-varm.ts`). Produktkortet
  (`components/prefetch-link.tsx`) och sökförslagen börjar hämta produktsidans
  huvudbild när man trycker: musen vid knapptrycket, fingret först vid
  klicket, för en beröring kan vara början på en rullning. Bilden begärs med
  galleriets egen laddare (`lib/hjalte-loader.ts`), `HERO_SIZES` och samma
  mått, genom `getImageProps`, så att webbläsaren väljer samma fil som
  galleriet sedan begär. ☠️ Listsidorna skickar bilden som en naken nyckel
  utan värddel: adressen byggs om från nyckeln, annars gjorde förhämtningen
  ingenting just på korten i listorna. Mätt lokalt: bilden begärs 113–151 ms
  efter klicket, en gång, och är klar när sidan byts.
- **Kortets bild visas medan den stora hämtas.** Kortet man tryckte på har
  samma foto i webbläsarens minne. Galleriet lägger det som bakgrund i sitt
  första lager (`kortbildFor`), så bildrutan visar varan direkt och blir
  skarp när huvudbilden kommit. Bara samma fil-id, bara en bild som är
  hämtad och minst 300 px bred, och bara 15 s efter trycket. På servern och
  vid en vanlig landning är allt som förut.
- **Rätt bild direkt när länken pekar på ett annat val** (`lib/pdp-val-bild.ts`).
  Sidans tidiga skript hämtar valets bild medan sidan läses och visar den som
  bakgrund i bildrutan (`#pdp-val-bild`) tills väljaren tagit över. Galleriet
  tar bort den när dess eget lager visas, inte vid monteringen: då står
  förvalets bild fortfarande som visad och rutan hade blinkat tom. ☠️ Reglerna
  för vilken bild ett val visar är väljarens egna (`valjId` och `valjFarg` i
  `components/productview.tsx`), och provet läser väljarens rader: ändras
  väljaren ska modulen ändras med den. Ett val utan egen bild får ingen bild
  i förväg; då står rutan dold tills väljaren valt, som förut. Mätt lokalt
  med samma strypning: rätt bild syns i rutan efter 1,0–1,3 s, galleriets
  lager tar över vid 2,0 s med samma bild, och rutan är aldrig tom däremellan.

Dessutom öppnas anslutningen till Wix bildserver utan `crossOrigin`
(`app/layout.tsx`). Bilder hämtas utan CORS, och en anslutning som öppnats
med `crossOrigin="anonymous"` ligger i en annan pott som bilderna inte får
använda.

**Produktsidans utseende** gicks igenom på mobil och dator samtidigt (390 och
1 440 px, tre varor): inget sticker ut i sidled, köpdelens block har samma
vänsterkant, och de enda träffytorna under 44 px är textlänkar i löpande
text. Inget ändrades där utöver köpraden och ordvalet ovan.

## Sökningen svarar direkt: bilderna, ordningen och hoppet till sidfoten (Leonard 2026-11-20)

Leonard provade sökläget på sin iPhone samma morgon som det gick ut: "Det blev
väldigt snyggt men jag behöver att du får det mer responsivt." Fyra saker, och
tre till som proven hittade på vägen.

### 1. Tomt fält när tangentbordet fälls

"När man sökt och klickar på bocken måste bilder visas direkt inte ett tomt
fält i några 100 ms." Panelen slutade vid tangentbordet (`--sok-max`, räknad
ur `visualViewport`), och en iPhone säger till om tangentbordets höjd först
när det har glidit ner. Under tiden var ytan under panelen den vita yta som
täcker sidan. Mätt mot www (`audit/sok-respons.cjs`, som härmar ordningen:
fältet tappar fokus, `visualViewport` ändras 300 ms senare): panelens
nederkant stod kvar på 395 px av 852, och under den låg `<body>`.

- **Panelen följer inte tangentbordet.** Den går från sidhuvudet ner till
  skärmens kant, också bakom tangentbordet: `height:calc(100dvh -
  var(--sok-topp))` i `app/globals.css`. `dvh` ändras inte av tangentbordet.
  Sökrutan mäter bara var panelen börjar (`--sok-topp`). ☠️ Räkna aldrig
  söklägets höjd ur `visualViewport` igen: händelsen kommer för sent på en
  iPhone. Datorns lista gör det fortfarande (`--sok-max`), och där finns
  inget tangentbord som glider.
- **Safari före 15.4** saknar `dvh`. Raden före i samma regel använder
  `--sok-vh`, skärmens höjd mätt när sökläget öppnas (innan tangentbordet
  kommit) och sedan bara när fältet inte har fokus eller telefonen vridits.
  Lightning CSS behåller båda raderna (kontrollerat i den byggda filen).
- **Bilderna.** Kortens bilder var lata, och i en lista som rullar för sig
  själv hämtar Safari en lat bild först när den syns. Nu hämtas de sex första
  direkt och resten när listan stått still 250 ms (`BILDER_DIREKT`,
  `ALLA_BILDER_EFTER_MS`): den som skriver vidare hämtar inte tolv bilder per
  bokstav. Med datasparläge eller 2G är resten lata som förut.

### 2. Bilderna i listorna

"När man trycker visa mer bilder o bläddrar så ska alla bilder dyka upp
direkt, bläddrar man fort ser man vissa som saknas i några 100 ms." Korten
efter de två första är lata. Safari på iPhone börjar hämta en lat bild
ungefär en skärmhöjd i förväg, ett svep går fortare än så, och hämtningen tar
100–300 ms. ☠️ Chromium hämtar 1 250 px i förväg och visar därför inte felet
med sina egna inställningar: `audit/lista-bilder.cjs` ställer avståndet till
850 px (`--blink-settings=lazyImageLoadingDistanceThresholdPx…`), nät 6 Mbit/s
med 80 ms väntan. Mätt så på `/sok?q=cykel`, före och efter:

| | www före | efter |
|---|---|---|
| kortbilder hemma efter 3,5 s utan rullning | 10 av 24 | 24 av 24 |
| kort som sågs utan bild vid snabb bläddring | 14 | 0 |
| nya kort i fönstret med bild direkt efter "Visa fler" | 0 av 6 (6 av 6 först efter 1 s) | 6 av 6 |
| kort utan bild vid bläddring genom den nya omgången | 10 | 0 |

`components/shopbrowser.tsx`, i den ordningen:

- **`bilderDirekt`.** När sidan är färdigladdad och har fått 400 ms på sig,
  eller så snart kunden rullar, får korten `loading="eager"` och hämtar sina
  bilder oavsett var de står. ☠️ Bara som tillstånd i webbläsaren, aldrig på
  servern: React lägger en förladdning i `<head>` för varje `<img>` som inte
  är lat (mätt 2026-11-12, `lib/kortprioritet.test.ts`). Provet räknar
  förladdningarna före och efter: 2 och 2.
- **Nästa omgång förladdas** när knappen "Visa fler" kommer inom 2 400 px
  från fönstret (`NARA_FLER_PX`, en IntersectionObserver på knappens rad):
  de 24 bilderna hämtas med `forladdaKortbild`, samma `srcset` och `sizes`
  som korten, så att trycket ritar kort vars bilder redan ligger i
  webbläsaren. Saknas listan eller fotona hämtas de då, inte först vid
  trycket.
- **Datasparläge och 2G**: inget av det, lata bilder som förut.
- Den som rullar 0,3 s efter att korten ritats och går igenom alla 24 på en
  halv sekund hinner fortfarande före nätet (21 kort utan bild mot 23 förut).
  Det går inte att lösa utan att bilderna ligger i sidan.

**Söksidans bilder** (`lib/list-payload.ts`, `forSokClient`):

- ☠️ **Slutsålda träffar långt ner fick aldrig någon bild.** Bildkartan
  (`/api/kort-bilder`) har bara det som går att köpa, och söksidan visar också
  det slutsålda, sist. Mätt på www: 9 av 16 slutsålda för "bil", 6 av 20 för
  "soffa" och 68 av 80 för "bord" stod kvar med tom fotoruta. Nu bär varje
  slutsåld träff sin bild i sidan.
- **De första 240 träffarna bär sin bild i sidan.** Kartan väger 406 kB över
  nätet (1,0 MB JSON, mätt samma dag) och behövdes förr från tredje omgången
  kort. En sökning har sällan fler än ett par hundra träffar.
- **Den kalla vägen tar fotot ur sökindexet** (`lib/sok-kall.ts`,
  `kandidater`). Varulistan bär bild för 147 av 7 071 rader, så en sökträff
  stod utan foto tills kartan hämtats. Indexet har varje varas bild och är
  redan hämtat. Kortets andra bild (svepet) finns bara i kartan: listan hämtar
  den i bakgrunden (`andraBilderUrKartan`) och fyller i den (`medBild`).

### 3. Samma varor i sökläget och på resultatsidan

"När man söker på saker så hoppar det till o kmr med lite andra produkter än
de som syntes först." Två orsaker, mätta mot det riktiga indexet (7 853
varor): lagerregeln var två (sidan lägger det köpbara först bland alla
träffar, rutan klippte tolv och sänkte sedan de slutsålda bland dem), och den
kalla vägen rankade i varulistans ordning medan indexet och servern står
nyast först. Lika bra träffar står i den ordning de kom in.

`lib/sok-ordning.ts` är nu den enda regeln: katalogen rankas nyast först
(`katalogensSokordning`, i sökindexet och på söksidan; `kandidater` följer
indexets ordning), det köpbara läggs först bland alla träffar (`kopbaraForst`)
och sedan klipps listan. `lib/sok-ordning.test.ts` kör de tre vägarnas steg på
samma katalog och kräver samma lista. Mätt: 40 sökord mot riktiga data, 0
skillnader mellan rutans tolv och sidans tolv första och 0 mellan den kalla
och den varma vägens hela lista; i webbläsaren 17 av 17 lika (förr skilde sig
"bil" från plats 10).

☠️ En slutsåld vara syns i sökrutan bara när de köpbara träffarna är färre än
rutans platser. Det är sidans regel, och den som skriver varans namn får få
träffar. Kontaktformulärets väljare (`rankaForslag`) klipper fortfarande på
relevans först: där letar kunden efter en vara den redan köpt.

### 4. "Kastas längst ner på sidan": fyra vägar till sidfoten

Samma symtom varje gång: listan börjar om med 24 kort medan webbläsaren står
kvar på en plats som låg längre ner än så, och sidan klipps till sin
nederkant. ☠️ En lista som blir kortare under kunden ställer kunden vid
sidfoten. Kontrollera `kvar till botten` i proven, inte bara antalet kort.

1. **Samma sökning en gång till.** Rutan behåller sitt ord på resultatsidan,
   så "Visa alla 178" och Enter leder ofta till sidan man redan står på. Den
   hämtades igen, varorna kom i en ny array, och listan nollställde sitt
   antal. Mätt på www (`audit/sok-samma.cjs`): 72 kort och y 7 236 blev 24
   kort och "kvar till botten 0". Två rättelser: sökrutan hämtar ingenting
   när resultatsidan för ordet redan står framme (`resultatsidanVisar`), den
   stänger sökläget och visar sidan från början; och listan börjar om när
   varorna byts, inte när samma varor kommer i en ny array (`produktNyckel`:
   antalet och första och sista varan).
2. **En sökning strax efter bakåt.** Sökrutan byter sida med `router.push`
   från en knapp eller Enter, och det är inget tryck på en länk. Inom tio
   sekunder efter ett bakåtsteg trodde resultatsidan att kunden kommit dit
   med bakåt och ställde tillbaka ett gammalt sparat läge: 72 kort, 9 564 px
   ner (`audit/sok-hopp.cjs`). Nu noterar sidhuvudets skript varje ny post i
   historiken (`history.pushState` → `window.__fpNy`) och vilken adress ett
   bakåtsteg landade på (`__fpTravTill`), och `komMedHistoriken` kräver båda.
   ☠️ Signalen sitter på `pushState`, inte på varje `router.push`: en spärr
   man måste komma ihåg glöms bort.
3. **Bakåt efter att ha lämnat listan på annat sätt än via ett kort.** Läget
   sparades bara när ett kort trycktes. En vara i sökläget, loggan, menyn
   eller en vanlig länk, och sedan bakåt: 24 kort vid sidfoten, fyra vägar av
   fyra på www (`audit/bakat-annan-vag.cjs`). Nu sparar listan sin plats vid
   varje rullning (en kvarts sekund efter att sidan stannat, med kortet överst
   i fönstret som ankare), när den lämnas och när sidan göms. ☠️ Lyssnaren
   sitter i en `useLayoutEffect`: en passiv effekt städas efter att Next
   rullat den nya sidan till toppen, och hade sparat y = 0 under den nya
   sidans adress. Adressen noteras vid rullningen av samma skäl: när listan
   tas bort är adressen redan den nya sidans. ☠️ Läget hör till besöket det
   sparades under: en lista som ritas utan att kunden kommit med bakåt eller
   en omladdning glömmer det gamla läget (`glomListlage`). Annars hade den som
   var djupt nere för en kvart sedan, kom dit igen med en länk och gick bakåt
   utan att ha rullat hamnat där den stod förra gången.
4. **En omladdad sida.** En flik som legat i bakgrunden på telefonen laddas
   om av sig själv, och webbläsaren ställer tillbaka sin plats på en sida med
   24 kort. Listan ställer nu tillbaka sitt läge också efter en omladdning
   (`laddadesOm` i `lib/sidminne.ts`), men bara på adressen dokumentet
   laddades på och bara tills sidan bytts.

5. **Webbläsaren gled mot sin gamla plats medan listan hoppade dit.** Sidan
   har `scroll-behavior:smooth`, och efter en hel sidladdning med bakåt eller
   en omladdning glider Chromium mjukt från sidans topp mot platsen den minns.
   Listans hopp mitt i glidet hamnade 49–109 px fel
   (`audit/loggan-spar.cjs`). Sidhuvudets skript stänger nu av glidet medan
   platsen ställs tillbaka (`lugn()` i `SIDBYTE_SKRIPT`): 1,2 s efter ett steg
   i historiken, och från att ett dokument laddats med bakåt eller om till
   1,2 s efter att det är färdigladdat. Det gäller varje sida, inte bara
   listorna: bakåt står på sin plats direkt i stället för att glida dit.

☠️ **Proven ska trycka utan att rulla.** Sidan har mjuk rullning
(`scroll-behavior:smooth`), och Playwrights `click()` rullar fram elementet
först. Ett tryck mitt i den rullningen lämnar sidan på en annan plats än den
uppmätta: tre varv gav 0, 19 och 126 px "fel" som var provets. `domKlick` i
`audit/bakat-annan-vag.cjs` trycker i sidan utan att rulla.

**Mätt mot det lokala bygget:** samma sökning igen y 0 med 72 kort kvar (fyra
vägar); sökning efter bakåt y 0 med 24 kort; bakåt via loggan, en vara i
sökläget, en vanlig länk och en omladdning ger samma antal kort med samma
kort på samma pixel (72 kort, y 8 600 → 8 600); ett nytt besök utan rullning,
bort och bakåt står överst med 24 kort; bakåt via ett kort som förut
(kategori, sök och sorterad lista, också framåt och bakåt igen). Söklägets 62
kontroller, de nio extra och de äldre 61, 47 och 36 är gröna, och
produktsidans huvudbild begärs fortfarande en gång, 32–79 ms efter trycket.

☠️ **Inte provat på en riktig telefon.** Tangentbordet finns inte i Chromium
och visas inte på BrowserStack. Att `dvh` inte ändras av tangentbordet är
webbläsarnas dokumenterade beteende, inte något mätt här: det är därför
panelens höjd står i stilmallen och inte räknas i kod. Kvittot är Leonards
telefon.

**Sett men inte ändrat:**

- Lika bra träffar står nyast först. "bilar" börjar därför med ett hundgaller
  för bilen, som råkar vara nyast. Dyrast först gav rimligare listor i ett
  prov mot indexet, men det är ett val om sortimentet och Leonards att göra.
- Bildkartan väger 406 kB och hämtas av listsidorna från tredje omgången
  kort. Varulistan (`/api/lista`) kunde bära bilderna för fler rader.
- Den kalla söksidan hämtar varulistan (781 kB) och indexet (532 kB) innan
  den kan svara.

## Sökningen förstår begrepp, felstavningar och halvskrivna ord (Leonard 2026-11-20)

Leonards skärmbild från telefonen: "trägårdsmöbel" i sökläget, och under
fältet "Inga produkter matchade". "Barnmobel samma, kan du göra sökfältet
ännu smartare". Butiken har 254 trädgårdsmöbler och 140 barnmöbler.

Tre saker var fel, och de hänger ihop:

1. **Hyllans ord står inte i namnen.** En barnmöbel heter "Barnbord", en
   leksak "Dockvagn". Sökningen läste bara namnen, så "barnmöbler" gav två
   varor av kategorins 140 och "leksaker" 73 av 536.
2. **Ett ord som inte finns rättades bara när ingenting träffade.** Och en
   delsträng träffar nästan alltid något: "lapor" stod i "LAPtophållare",
   "vaska" i "guldVASKArsats", "stäl" i "odlingSTÄLt".
3. **Mitt i ett ord tömdes listan.** Sökläget söker vid varje tangent, och
   ett halvskrivet ord som inget namn börjar med gav ingenting, eller en
   gissning med besked om något annat.

Allt ligger i `lib/search.ts`. Proven står i `lib/sok-2026-11-20.test.ts`, 36
stycken mot en påhittad butik med kategorier (och elva till om farten, se
avsnittet om sökfältets fart), och varje ☠️ nedan har ett.
Tolv av reglerna är dessutom prövade baklänges: regeln togs bort i en kopia,
och minst ett prov föll varje gång.

### 1. Kategorierna som begrepp

Sökningen får nu veta vilka kategorier varje vara ligger i (`Kategoridata`),
och ett sökord får träffa en vara genom kategorins namn:

| Slag | När | Exempel |
|---|---|---|
| LIKA | sökordet är ett av kategorins ord, i någon böjning, med eller utan prickar | "barnmobel" är Barnmöbler, "leksak" Leksaker & Spel |
| HUVUD | sökordet är huvudet i kategorins ord, eller en synonym står i namnet | "möbler" i Utemöbler, "lampa" och Belysning |
| FÖRLED | kategorins ord börjar med sökordet | "hund" i Hundburar |

En vara hör också till kategorins föräldrar. Det används på två ställen:

- **Som reserv**, när inget namn har alla sökord (`kategoriVarv`): varje
  sökord får stå i namnet eller träffa genom en kategori.
- **För ett ensamt begreppsord** som också står i några namn (`medBegrepp`).
  Träffarna läggs i tre led: namnträffar i kategorin eller där ordet är varan
  ("Julbelysning …"), sedan namnträffar utanför där ordet bara nämns ("Sängram
  med belysning"), sist kategorins övriga varor.

☠️ **Fällorna, var och en mätt mot katalogen samma dag:**

- **Bara begreppsord får träffa genom kategorin i en sökning på flera ord.**
  Första versionen lät varje ord göra det: "skänk 120 cm bred" gick från fyra
  skänkar till 69 varor ur Sideboards & vitrinskåp, "soffa 260 cm bred" från
  två till 95. Ett begreppsord är kategorins eget ord som färre än 35 % av
  kategorins varor har i namnet (`BEGREPP_UNDER`).
- **En kategori som räknar upp tre sorters varor fyller inte på.** "koppel"
  gav selar och transportburar ur Selar, Koppel & Transport.
- **Underkategorin går före avdelningen.** "utemöbler" står i Trädgård &
  Utemöbler och i Utemöbler. Avdelningen har också växthus och grillar.
- **Syskonen hålls utanför.** "Matbord & stolar": den som söker matbord får
  inte stolarna.
- **Formerna, inte `canon`.** `canon` skalar vad som helst: "kökös" blev
  "kök" och räknades som kategorin Kök. Jämförelsen görs på riktiga böjningar
  (`ordformer`), och ett avskalat s är ingen böjning ("byggs" är början på
  "byggsats", inte avdelningen Bygg).
- **Omljud bara för stång och tång.** Med fler gav "böcker" fåtöljer "med ben
  i bok" och "fötter" dörrbeslag på "8 fot".
- **En vara som bara hör till sin underkategori** (`BARA_I_UNDERKATEGORIN`)
  bär en negativ plats och ärver inte uppåt, varken i reserven eller när
  kategorin fyller på.

**Så når kategorierna sökningen.** `lib/sok-begrepp.ts` gör om butikens
kategorier till en tabell (namn och förälderns plats) och varje varas
kategorier till platser i den, bara den djupaste. Samma modul används av
sökindexet och söksidan, så att de tre vägarna får samma tillhörighet:

| Väg | Var kategorierna kommer ifrån |
|---|---|
| Sökrutan och sökläget | sökindexet: `k` på varje rad, tabellen som sista rad |
| Söksidan, varm (`app/sok/page.tsx`) | `getCollections()` och varans `collectionIds` |
| Söksidan, kall (`components/sok-kall.tsx`) | sökindexet, slaget upp på varans adress |

Tabellen ligger SIST i indexet och saknar namn och adress, så en sida som
laddades före bygget går förbi raden. Utan kategorier söker motorn i namnen
som förut.

### 2. Är sökordet ett ord?

Varje sökord prövas mot katalogens ord innan namnen genomsöks (`ordstatus`).
Ett ord som finns rörs inte. Ett ord som inte finns skrivs om, och ger det
omskrivna inga varor gäller sökningen som den skrevs:

| Omskrivning | Exempel | Besked till kunden |
|---|---|---|
| med prickarna | "vaska" → "väska" | nej |
| färdigskrivet | "stäl" → "ställ" | nej |
| rättstavat, ett fel | "lapor" → "lampor", "xtolar" → "stolar" | ja |
| början på ett ord, med ett fel | "trägå" → "trädgård", "fotöl" → "fåtölj" | ja |

Ordet FINNS när det står för sig i ett namn, är en böjning av ett sådant ord,
slutar eller börjar ett sammansatt ord, eller är ett begreppsord (synonym,
envägsord, kategori). Reglerna är generösa med flit: ett ord som felaktigt
räknas som känt söks som förut, men ett känt ord som räknas som okänt hade
kunnat rättas till något annat.

Rättningen (`narmasteOrd`) väljer bland lika nära ord det troligaste felet:
en tappad eller omkastad bokstav före en granne på tangentbordet, en bytt
vokal och sist en annan bokstav. Ordet som oftast ÄR varan går före ("myckel"
är "nyckel", som inleder 40 namn, inte "mycket"). Fyra bokstäver rättas bara
när en bokstav saknas eller två bytt plats, och butiker och märken rättas
aldrig (`RATTAS_INTE`).

☠️ **Ett halvskrivet ord rättades som om det vore färdigt.** "trägå" blev
"tråg" och visade fodertråg, medan kunden skrev vidare mot trädgårdsmöbler.
`felstavadBorjan` frågar i stället vilka ord som BÖRJAR så med ett fel, och
gäller när de är minst tre gånger vanligare än rättningen. ☠️ "pulka" är
inte början på "polkagris": felet ska vara trovärdigt för så många varor som
börjar så.

### 3. Halvskrivna ord: listan ska inte tömmas mitt i ordet

Mätt per tangent på 493 rättstavade begreppsord och sammansatta ord: med
förmiddagens version (avsnitt 1 och 2) var listan tom vid 14,5 % av
tangenterna, och de tre sista tangenterna före det färdiga ordet visade dess
varor i 70 % av fallen. Reglerna som fyllde luckan:

- **Ett begreppsord väger som en hylla** (`BEGREPP_VIKT`). ☠️ Med den gamla
  vikten gav "trägårdsmö" en tom lista mellan "trägårdsm" och "trägårdsmöb",
  som båda visade trädgårdsmöblerna.
- **Början på ett begreppsord skrivs färdigt.** ☠️ "tradgardsmo" gick vidare
  till rättningen och blev "trädgårdsbro", två broar. Bara när inget namn har
  ett ord som börjar så: "tradgards" är början på 157 varors "trädgårds…".
- **Den som skrivit en bokstav till har inte skrivit fel.** "barnm" är på väg
  mot "barnmöbler", inte ett "barn" med ett m för mycket.
- **Ett halvskrivet sammansatt ord skrivs färdigt** (`ofardigtSammansatt`):
  första delen är ett känt ord, resten är början på ett huvudord. Tre led:
  de allmänna huvudorden från två bokstäver ("kontorsmö" → "kontorsmöbler"),
  kategoriernas ord från tre ("hundkop" → "hundkoppel"), och ord som står i
  samma namn som första delen ("barnbi" → "barnbil"). Svaret är detsamma som
  för det färdiga ordet, utan besked.
- **Ett allmänt huvudord krävs aldrig** ("möbler", "saker", "prylar",
  "tillbehör"). Det säger bara "saker till": förledets egna varor är svaret
  också när ingenting har båda delarna. ☠️ "kattprylar" gav ingenting, fast
  "hundsaker" visade 313 varor.
- **Förledet får bära ett foge-s**, och söks utan det när det med s ger få
  varor. ☠️ "köksprylar" gick inte att dela, "sovrumsmöbler" gav sex varor
  och "kontorsbelysning" ingenting.
- **Två vanliga ord delas före en rättning med flera fel** (`starkDelning`).
  ☠️ "hundförvaring" blev "vedförvaring": tre fel räcker för ord på tolv
  tecken.
- **En rättad delning svarar som det rättstavade ordet.** ☠️
  "trägårdsbelysning" gav två lampor och "trädgårdsbelysning" 110.

☠️ **Det som gick fel under bygget, och spärren som kom av det:**

- **Ett försök är en strikt sökning, och högst tre görs** (`STRIKT`). Varje
  färdigskrivet eller rättat ord som prövas är en sökning till. Första
  versionen körde alla reservled i var och en: "värmefläktra" tog 553 ms på
  en dator, tre försök à 150 ms. Ett försök ska träffa som det står (i
  namnen, genom kategorierna eller delat), utan stavfelsled och fler
  rättningar. Sådana träffar hade ändå förkastats.
- **Ett ord nära ett katalogord skrivs inte färdigt.** Första versionen
  prövade alltid, och "matbrod" blev "mat" + "brödrostar" i stället för
  "matbord", "gungstil" "gungs" + "tillbehör" i stället för "gungstol". En
  sökning som skickas iväg är oftare ett färdigt ord med ett fel än ett halvt
  ord utan, och en gissning mitt i ordet rättar sig vid nästa tangent. Ett
  begreppsord av samma längd spärrar också ("värmefläktra" är
  "värmefläktar"), men inte ett som är längre: "hundkop" ligger ett fel från
  stammen i "hundkojor" och är på väg mot "hundkoppel".
- **Prickarna ska stämma i ett allmänt huvudord.** "boxningssäk" lästes som
  "boxnings" + "sak", ett rättstavat ord som aldrig blev "boxningssäck".
  `arAllmantHuvudord` tar ordet som det står eller helt utan prickar.
- **En stark rättning går före en allmän sammansättning.** "lekssaker" är
  "leksaker" med ett s för mycket, inte "leks" + "saker". "barnsaker" står
  kvar: "barn" står i hundratals namn, "barnsäkert" i få.
- **Kategoriernas ord från tre bokstäver.** Med två blev "kontorsm" till
  "kontor" + "småbord".
- **Inga ord på tre bokstäver i en stark delning.** "julförvaring" blev sex
  förvaringsSKJUL.
- **Ett allmänt huvudord letas inte utan prickar.** "barn" och "saker" står
  båda i "barnsäkert", och ett fönsterhandtag hamnade först.

### 4. Söksidan försöker igen själv

☠️ Första sökningen efter en deploy visade "Sökningen kunde inte läsas in".
Varulistan ligger inte i CDN:t direkt efter ett bygge, och en ny
serverinstans läser katalogen i 25–28 sekunder innan den kan svara. Den kalla
söksidan väntade 20 och gav upp. Den som laddade om fick svar direkt, för
servern läste klart ändå. Nu hämtas listan upp till tre gånger, med en och en
halv sekund emellan (`medForsok` i `lib/sok-kall.ts`), och felrutan visas
först när alla försök har misslyckats. Ett försök som avbryts för att kunden
sökt på något annat följs inte av fler.

### Mätt

Mot det riktiga sökindexet (7 886 varor, 172 kategorier), gamla motorn (det
som låg på www på förmiddagen) mot den nya:

| Prov | Gamla | Nya |
|---|---|---|
| 2 089 felstavningar av de 320 vanligaste varuorden: rätt varor | 79,5 % | 98,6 % |
| samma: ingen träff alls | 262 | 0 |
| 700 felstavningar av kategoriernas ord: rätt varor | 81,7 % | 98,6 % |
| 694 sökningar på kategoriernas ord: kategorins varor överst | 40 % | 85 % |
| samma: ingen träff alls | 52 | 0 |
| medan ett felstavat ord skrivs (1 788 tangenter): rätt varor | 67,0 % | 82,0 % |
| samma: tom lista | 16,3 % | 3,4 % |
| medan ett rättstavat begreppsord eller sammansatt ord skrivs (493 ord, 3 757 tangenter): tom lista | 27,8 % | 1,1 % |
| samma: de tre sista tangenterna visar det färdiga ordets varor | 48,1 % | 96,0 % |
| samma: det färdiga ordet ger ingen träff | 180 | 0 |
| räknetid per sökning på en dator (5 516 felstavade ord och tangenter): median | 16 ms | 9 ms |
| samma: nio av tio under | 47 ms | 20 ms |
| samma: 99 av 100 under | 72 ms | 83 ms |
| samma: den långsammaste | 105 ms | 187 ms |

Gårdagens fyra frågelistor (7 819 sökningar, bland dem kundernas egna ur GA4
och Search Console) mot den gamla motorn: 7 701 oförändrade, 49 med andra
varor överst, 69 med bara ett annat antal, och ingen som gick från träffar
till noll. Skillnaderna är mest fler varor genom kategorierna med samma varor
överst.

Sökindexet växte från 2 104 929 till 2 194 919 byte, över nätet från 536 till
558 kB (brotli, mätt på Vercel: www mot förhandsbygget). Det sökningen bygger
vid första tangenten (ordboken och kategoriernas varor) byggs i förväg när
webbläsaren är ledig, ett steg i taget (`forberedKatalogSteg`, anropad av
`varmUpp` i `lib/sok-rankning.ts`; se avsnittet om sökfältets fart).

**I en riktig webbläsare mot det lokala bygget** (Chromium, mobil 393 × 852
och dator 1280 × 800): sökläget och resultatsidan visar samma tolv varor i
samma ordning för 20 sökningar, bland dem "trägårdsmöbel", "barnmobel",
"kontorsmöbler", "kattprylar", "hundförvaring", "lapor" och "pool och spa",
med samma besked om vilket ord träffarna gäller. Tangent för tangent ger
"trägårdsmöbel", "barnmobel", "kontorsmöbler" och "tradgardsmobler" ingen
tom lista från fjärde bokstaven. Söklägets 62 kontroller, de nio extra,
flödenas 14 och de tio om tangentbordet är gröna.

☠️ **Inte mätt:**

- **Kundernas egna sökord för dagen.** GA4 och Search Console är anslutna men
  ingen egendom är vald i kopplingen, så frågelistorna är gårdagens.
- **Räknetiden på en riktig telefon.** Tiderna i tabellen är från en dator och
  gäller motorn som den var på morgonen. Samma kväll mättes den i Chromium
  med fyrdubbelt strypt processor och gjordes snabbare: se avsnittet om
  sökfältets fart.
- **Den kalla söksidans nya försök i en webbläsare.** Lokalt läser servern
  katalogen innan första svaret, så den kalla vägen nås inte där. Regeln är
  prövad med låtsade fel (`medForsok`) och en kontroll av att sidan använder
  den, inte mot en server som just har byggts.

**Sett men inte ändrat:**

- "kattleksaker" ger en vara, den som heter så. Leksakerna för husdjur ligger
  i Lek & Tillbehör för husdjur, som inte har ordet "leksaker".
- "hallbyrå" medan det skrivs ("hallb") visar hallbänkar: orden börjar lika,
  och det går inte att veta.
- En sökning på flera ord där ett av dem är ett sammansatt ord som inget
  namn har ("svart kontorsmöbler") delas inte. Bara ett ensamt sökord delas.
- Lika bra träffar står fortfarande nyast först (se avsnittet ovan).

## Sökfältets fart: samma svar, en fjärdedel av arbetet (Leonard 2026-11-20)

"jag vill att du kollar hastigheten till sökfältet är så optimerad som
möjligt". Sökläget söker vid varje tangent, och motorn som blev smartare
samma dag (avsnittet ovan) gick igenom katalogen fler gånger per tangent än
den gamla. Allt här ändrar HUR svaret räknas, aldrig svaret:

- 13 933 provsökningar (kundernas egna, felstavningarna och orden skrivna
  tangent för tangent) ger samma varor i samma ordning med samma besked som
  morgonens motor, kontrollerat efter varje steg,
- 7 694 frågor byggda ur katalogen (`tools/sok-matning/utfall.ts`) likaså.

### Mätt

Räknetid per tangent på en dator (`tools/sok-matning/tangenter.ts`, den
riktiga katalogen med 7 886 varor, 182 tangenter i 21 ord, motorns minne tomt
när varje ord börjar):

| | www före | morgonens motor | nu |
|---|---|---|---|
| alla 182 tangenter | 4 245 ms | 3 544 ms | 904 ms |
| en vanlig tangent (median) | 11 ms | 11 ms | 3 ms |
| nio av tio under | 52 ms | 43 ms | 12 ms |
| den tyngsta tangenten | 138 ms | 117 ms | 24 ms |

I Chromium med fyrdubbelt strypt processor (mobil 393 × 852, tio ord skrivna
med 110 ms mellan tangenterna, `tools/sok-matning/fart.cjs`). "www före" är
mätt samma kväll, "morgonens motor" på förmiddagen med samma prov:

| | www före | morgonens motor | nu |
|---|---|---|---|
| blockerad tid för de tio orden | 8 217 ms | 7 533 ms | 979 ms |
| längsta uppgift | 601 ms | 766 ms | 167 ms |
| längsta väntan innan en tangent behandlas | 513 ms | 378 ms | 58 ms |
| längst från tangent till nästa bild | 544 ms | inte mätt | 120 ms |

Öppningen (`tools/sok-matning/oppning.cjs`, åtta varv, median). www hämtar
indexet över nätet och det lokala bygget inte, så tiden till korten är inte
rättvis åt www: det som är blockerat är det.

| | www före | nu |
|---|---|---|
| de populära varorna ritade efter fingret | 702 ms | 511 ms |
| blockerat innan de syns | 243 ms | 102 ms |
| blockerat efteråt (uppvärmningen) | 0 ms | 109 ms |
| längsta uppgift efteråt | ingen | 110 ms (som mest 145) |

www har ingen uppvärmning efteråt för att den gamla motorn bygger sitt
ordförråd INNAN varorna visas och resten vid första tangenten.

### Vad som räknades om i onödan

1. **Stavfelsledet jämförde sökordet med varje namn.** Nu en gång per unikt
   ord i katalogen (`felPerOrd`), och namnen slår upp svaret (`felINamn`).
   Katalogens namn har runt 60 000 ord, och 9 000 olika.
2. **Det som hör till namnet räknades om för varje namn i varje varv:** namnet
   utan prickar och med fogar, huvuddelen, och huvuddelens slut i
   `sammanskrivet` (också när ingen träff fanns). Nu en gång per namnlista
   (`Listdata`), huvuddelen första gången den behövs.
3. ☠️ **Förfiltret: ett namn som inte kan träffa jämförs inte alls.** Varje väg
   till en träff går genom en text som ska stå i namnet (frasen, en böjd
   form, stammen, en synonym). Varje namn och varje sådan text har en mask
   med vilka tecken den har, och saknar namnet ett tecken hoppas hela
   jämförelsen över (`kanTraffa`). Stavfelsledet får sakna så många tecken som
   felen tillåter. Filtret får släppa igenom för mycket men aldrig hålla
   tillbaka en träff: prövat mot den riktiga katalogen på 27,6 miljoner par av
   sökning, namn och läge (662 587 träffar, ingen tillbakahållen), och i
   provet mot den påhittade butiken (`forfilterProv`).
4. ☠️ **Samma sökning räknades om vid varje tangent.** Den som skriver
   "kontorsm", "kontorsmö", "kontorsmöb" får ordet färdigskrivet till
   "kontorsmöbler" vid varje tangent, och varje försök var en hel sökning: 30 %
   av tiden för de tyngsta tangenterna. De senaste 48 svaren sparas per
   namnlista (`rankaInre`). Ett svar beror bara på varorna, namnen,
   kategorierna, sökningen och djupet, och den som anropar får egna listor,
   så att en sortering på plats aldrig ändrar nästa svar.
5. **Rättningen gick igenom ordboken flera gånger per sökning** med samma ord
   (`narmasteOrd`: omskrivningen, spärren för färdigskrivningen, rättningen),
   och slog upp varje ords antal i en tabell vid varje varv. Svaret sparas,
   och antalen ligger på ordens platser (`ordAntal`, `ordInte`).
6. **Kategoriförslagen tolkade om varje kategorinamn och sökningen** för var
   och en av de 172 kategorierna, två gånger per tangent: en sjundedel av
   tiden. Kategorinamnen tolkas en gång (`kategoriformFor`), sökningen en gång
   per anrop.
7. **Uppvärmningen delade upp varje namn i ord tre gånger.** Ordräkningen,
   orden som står för sig och de kända delarna räknas nu ur samma ordlista
   (`listaFor`).

### ☠️ Det byggda paketet är inte källkoden

Webbläsaren kör det minifierade paketet, och där såg den hetaste slingan
annorlunda ut. Bygget (Next:s swc) bakar in en funktion som anropas på ett
enda ställe, som ett funktionsuttryck som anropas direkt. I slingan över
katalogens namn blev det två nya funktionsobjekt per varunamn och varv
(förfiltret och jämförelsen), och ett förvalt parametervärde blev en läsning
ur `arguments`. I webbläsarens profil var de två inbakade funktionerna de
tyngsta posterna, fast mätningarna i Node inte såg dem (där körs källkoden).

Anropen i de heta slingorna bär därför `/*#__NOINLINE__*/`, och `tokenQuality`
och `matchPrepared` har inga förvalda parametervärden.
`lib/sok-minifierat.test.ts` minifierar `lib/search.ts` med byggets verktyg
och ser efter att slingan anropar funktionerna i stället för att skapa dem.
Kontrollerat i det riktiga bygget: markeringarna följs.

### Öppningen

- ☠️ **Sökläget byggde hela ordförrådet innan de populära varorna visades**,
  bara för att kunna skriva "Sök till exempel" över dem: den största
  uppgiften vid öppningen. Orden räknas nu på servern en gång i timmen, med
  samma funktion på samma namn, och följer med i sökindexets sista rad (`ex`,
  `lib/sok-begrepp.ts`). Ett index utan dem läses som förut, och rutan räknar
  då själv. Indexet växte med 164 byte.
- ☠️ **Uppvärmningen var en enda uppgift** på upp till 390 ms (strypt), och en
  tangent som trycktes under tiden fick vänta på den. Den är nu ett dussin
  steg med turen lämnad till webbläsaren emellan (`varmUpp` i
  `lib/sok-rankning.ts`): namnen, ordförrådet i fyra omgångar och en
  avslutning (`byggOrdforradSteg`), och motorns sex steg
  (`forberedKatalogSteg`). Söker kunden innan något är byggt byggs det då,
  som förut.
- ☠️ **Varje steg väntar på nästa bild.** En ledig stund kan komma mellan att
  React har skrivit de populära varorna (eller en nyss tryckt bokstav) till
  sidan och att webbläsaren ritar dem, och ett steg som börjar då håller kvar
  bilden. Stegen begärs i nästa bildruta och körs i den lediga stunden efter
  den, det första efter två.

### Proven

`lib/sok-2026-11-20.test.ts` har elva prov om farten (minnet mot en ny
räkning tangent för tangent och baklänges, reservvarvet, svar som ändras på
plats, andra varor och kategorier på samma namnlista, förfiltret, ordlistan
mot `tokenize`, uppvärmningens steg i vilken ordning som helst,
kategoriförslagen, sökexemplen i indexet och ordförrådet i steg), och
`lib/sok-minifierat.test.ts` ett. 45 felaktiga varianter av genvägarna
prövades i en kopia: 41 fälls av proven. De fyra som inte fälls kan inte ge
ett annat svar: två masker som alltid ryms i en annan, en nyckel där antalet
fel följer av ordets längd, och en spärr mot färger bland begreppsorden, där
inget begreppsord är en färg.

I Chromium mot det lokala bygget: sökläget och resultatsidan visar samma
varor i samma ordning, tangent för tangent ger "trägårdsmöbel", "barnmobel",
"kontorsmöbler" och "tradgardsmobler" ingen tom lista från fjärde bokstaven,
"Sök till exempel" visar indexets ord på mobil och dator, och söklägets 62
kontroller, de nio extra, flödenas 14 och de tio om tangentbordet är gröna.

☠️ **Inte mätt:**

- **En riktig telefon.** Strypningen i Chromium gör processorn fyra gånger
  långsammare men är ingen iPhone: Safari har en annan JavaScript-motor och
  saknar `requestIdleCallback` (stegen går då på en timer, 30 ms efter varje
  bild).
- **www efter deployen.** Allt ovan är mätt mot det lokala bygget.
- **Morgonens motor med kvällens noggrannare mått för öppningen.** Dess
  öppning mättes på förmiddagen med det grövre provet: 720 ms blockerat och
  393 ms som längsta uppgift.

**Sett men inte ändrat:**

- **Reservvarvet används aldrig på riktiga data.** När ett okänt ord söks
  strängt och inget ger söks det en gång till som förut (`rankaMedInfo`).
  Ingen av de 13 933 provsökningarna går den vägen: stavfelsledet hinner
  före. Det är kvar som skyddsnät, och har nu ett prov ("ardsbar").
- **En felstavad färg ger inga träffar.** "tukos" visar ingenting, fast 25
  varor är turkosa: färger föreslås aldrig som rättning ("dlang" är "slang",
  inte "lång"). Regeln är äldre än dagens arbete och gäller ett ensamt
  sökord som bara är en färg.
- **Nästa steg om det behövs:** räkna också de exakta ordträffarna per unikt
  ord (som stavfelsledet), eller flytta rankningen till en egen tråd (Web
  Worker), så att skrivandet aldrig väntar på den. Det första är uppskattat
  till en sjättedel av det som är kvar per tangent, det andra är en större
  ombyggnad av sökrutan.

## Sökningen efter en extern granskning i tolv punkter (Leonard 2026-11-21)

Leonard klistrade in en granskning av sökningen gjord av en annan AI, tolv
punkter med exempel. ☠️ **En granskning är påståenden, inte mätvärden.** Varje
exempel prövades först mot dagens index (7 948 varor, 173 kategorier) i motorn
som låg på www, och mot www. De flesta stämde. Fyra gjorde det inte:
"hängmatta" (de två hängmattorna låg redan först), "gazebo" (40 träffar, inte
noll), "bilbatteri" (8 träffar, inte 280) och "mobilskal" (0, inte 121).
Indexet hämtas inte heller när sidan öppnas, utan när kunden rör sökrutan, och
"senaste sökningar" finns redan. Kundernas egna sökningar (56 i butiken och
163 från Google) innehåller ingen engelska: de engelska orden är en
försäkring, inte ett mätt behov.

### Mätt före och efter

Samma index, motorn på www mot motorn efter genomgången:

| sökning | före | nu |
|---|---|---|
| grill | stekplattan "grill- och stekplatta" först, första kolgrillen på plats 6 | 29 grillar ur Grill & Utekök först |
| led lampa | en bilkretsprovare "med LED-lampa" först | LED-lamporna först |
| soffor / soffan / soffa | 181 / 181 / 140 | 142 / 141 / 140 |
| lampor / lampa | 225 / 216 | 206 / 206 |
| mattor / matta | 190 / 164 | 164 / 164 |
| hyllor / hylla | 616 / 534 | 534 / 534 |
| bokhylla | 616 (63 heter så) | 63 |
| elcykel | 179 | 2 (butiken har två varor till elcyklar) |
| pläd | 62, vattenfilter först | 14: tre filtar, sedan varor med filt i (butiken har ingen pläd) |
| airfryer | 2 | 6 |
| snöflockad julgran | 2 | 32 |
| julren | 1 | 13 |
| greenhouse / bike / desk | 0 / 2 / 4 kattlådeskåp | 105 / 160 / 103 skrivbord |
| christmas tree / fire pit / dog bed | 0 / 0 / 2 skräp | 87 / 33 / 19, med besked |
| julgran utan belysning | 7, alla med belysning | 60 utan |
| kattlåda utan lock | 12 | 25 |
| barstol utan ryggstöd | 12 | 37 |
| har ni dieselvärmare | 50 skräp ("har värme") | 33 dieselvärmare |
| cykelhjälm barn | 562 (allt för barn) | 0 |
| röd cykelhjälm | 89 (allt rött) | 0 |
| katt träd / kattträd | 13 / 96 | 96 / 96 |
| ute möbler / utemöbler | 12 / 254 | 254 / 254 |
| soff bord / soffbord | 54 / 123 | 135 / 123 |
| elbilar för barn / elbil barn | 52 / 126 | 126 / 126 |
| soffa lägsta pris | 3 anslagstavlor, "soffa" struket | 140 soffor |
| `<script>alert(1)</script>` | 35, "script" struket två gånger | 0 |

13 972 provsökningar (kundernas egna, felstavningarna, orden tangent för
tangent och granskningens exempel) mot www-motorn: 12 745 svar är oförändrade,
1 227 ändrade. 508 har en annan ordning bland de tio första, 411 längre ner,
247 har färre träffar, 51 fler, 4 bara ett annat besked, 3 går från noll
till träffar ("christmas tree", "greenhouse", "fire pit") och 3 från träffar
till noll ("cykelhjälm barn", skriptet och "dog crate", som förut gav en
"bulldog-koppling" och en "kamadogrill").

### Motorns regler (`lib/search.ts`)

1. ☠️ **Ett hängande bindestreck gör ordet till ett förled.** "Vändbar grill-
   och stekplatta" är en grillplatta, ingen grill. Förut räknades "grill-" som
   ett eget ord i huvuddelen. Nu är det första ledet i en sammansättning
   (`kant` 2).
2. **Alla sökord som ord i namnets huvuddel ger 92** (`ALLA_I_HUVUDDELEN`),
   mellan frasen (100/95/93) och frasen efter huvuddelen (90). "LED-golvlampa"
   går före "Bilkretsprovare … och LED-lampa".
3. **Ordets egen kategori först** (`harHem` i `medBegrepp`). Heter en kategori
   som sökordet ("Soffor & bäddsoffor", "Grill & Utekök") och ligger de flesta
   varor som heter så där, går de varorna först, sedan de som heter så på
   andra hyllor (hundsoffan, leksaksgrillen), sist de som bara nämner ordet.
   Minst tre varor i kategorin (`HEM_MINST`), och fler där än utanför.
4. ☠️ **En stam som inte är en grundform gäller bara med en böjningsändelse**
   (`stamMedAndelse`, `stamStar`). "soffor" har stammen "soff", som står först
   i varje soffbord: 181 träffar mot 140 för "soffa". Har katalogen ordets
   grundform ("soffa") och är stammen inte den, ska stammen följas av en
   ändelse: "soffa", "soffan", "soffor". "stolar" har stammen "stol", som är
   grundformen, och är som förut.
5. ☠️ **Synonymer jämförs som ord, inte som bokstäver** (`synonymStar`).
   Nålarna låg förut som delsträngar: "pläd" hittade "filt" i varje "filter",
   "julren" hade hittat "renar" i "barrgrenar". Ordet ska stå som ett ord,
   sist i ett ord (med böjning, utom orden i `INTE_BOJT`) eller först i en
   sammansättning vars rest är ett ord i katalogen. Står det efter namnets
   huvuddel ("… med studsmatta") väger träffen mindre (`SYNONYM_NAMND`, 0,75
   mot 0,85).
   - Formerna byggs vid första sökningen (`synonymformer`), inte när modulen
     laddas: `bojdaFormer` läser `OMLJUD`, som står längre ner i filen, och
     modulen föll annars på "Cannot access 'OMLJUD' before initialization".
   - ☠️ **Det smala ordet drar inte in det breda** (`arSorten`). "elcykel"
     hade nålen "cykel" och gav 179 cyklar, "bokhylla" nålen "hylla" och 616
     hyllor. Ett gruppord som innehåller ett annat gruppord på fyra bokstäver
     eller fler får inte det som nål. Åt andra hållet gäller det: "cykel"
     hittar elcykeln.
   - Nya ord i grupperna: bike, greenhouse, desk, bag, airfryer och
     varmluftsfritös, eldstad med eldkorg, eldskål och firepit. Envägsord
     (`ENVAGS`): snöflockad och flockad (snöflock, konstsnö, snötäck, "med
     snö" …), julren (" renar" med mellanslag, "lysande ren", "ren och
     släde"), bookshelf. "eldfat" är kvar som envägsord: som gruppord hade
     det gett nålen "eldf", som står i "eldfast".
6. ☠️ **Ett ord som bara står mitt i andra ord är inget ord** (`baraMitt`).
   "desk" gav fyra "kattlåDESKåp". Börjar eller slutar inget ord i katalogen
   med sökordet söks det bara genom synonymer och stavfel. Ord med en böjd
   form som katalogen har ("motorcyklar" → "motorcykel") är undantagna:
   första versionen strök dem, och "panler" gick från 163 träffar till 0.
7. **"utan", "ej", "inte" väljer bort** (`tolkaUtan`, `rankaUtan`). Resten av
   orden söks, varor som nämner det nekade ordet tas bort, och varor som
   själva heter "… utan armstöd" går först (`heterUtan`). `NEKAS_OCKSA` bär
   orden som betyder samma sak i ett namn: lock = huv, täckt; ryggstöd =
   rygg; belysning = LED, ljusslinga, lampor. Nämner varje träff det nekade
   ordet gäller sökningen som den skrevs. Sidan säger vad som valts bort
   (`inte`).
8. **Frågeord hör inte till varan** (`STOPWORDS`): har, ni, finns, jag,
   söker, letar, vilken, bäst, pris, kostar, lägst, lägsta med flera. Prövade
   mot alla namn: inget av dem står som varuord. "typ" är inte med
   ("elbilsladdare typ 2").
9. ☠️ **Ett ärligt noll** (`okantStruket`, `arVarutyp`). "cykelhjälm barn" gav
   562 träffar: butiken har ingen cykelhjälm, ordet ströks, och kvar blev
   allt för barn. När ett struket ord inte finns i katalogen alls ska det som
   blir kvar vara en vara: ett ord som minst 15 % av de träffade namnen
   börjar med (`VARUTYP_MINST`). "chesterfield soffa" visar fortfarande
   sofforna, med besked.
10. **Engelska fraser** (`FRASER`, `oversattFras`): christmas tree, fire pit,
    dog bed, cat tree, air fryer, bar stool, office chair, coffee table med
    flera byts mot katalogens ord, och sidan säger vilket.
11. ☠️ **En sökning som är en kategoris namn får hela kategorin, också med
    småordet** (`kategoriMedNamnet`). "elbilar för barn" är kategorins namn
    men gav 52 varor, medan "elbil barn" gav 126: "för" räknades som ett ord
    kategorin inte har. Ett småord i sökningen ska stå i kategorins eget
    namn. "matbord med stolar" är fortfarande en matgrupp och inte kategorin
    Matbord & stolar.
12. **Två ord som ihop är ett ord söks som det ordet** (`hopskrivetBegrepp`).
    Ordet ska stå i synonymtabellen, i katalogens namn eller i en kategoris
    namn. Dess varor går först, och efter dem det som bara orden isär gav, så
    att ingen träff försvinner. Gäller inte när det hopskrivna svaret kräver
    en strykning eller en rättning, och ett svar med ett struket ord följer
    inte med ("katt träd" med "träd" struket är varenda kattlåda).

### Söksidan

- **"soffa billigast"** (`villHaBilligast` i `lib/sok-pris.ts`,
  `billigastForst` i `lib/sok-ordning.ts`): varorna som heter som sökningen
  står billigast först, resten efter i sin vanliga ordning, med besked.
  Samma funktioner på servern (`app/sok/page.tsx`), i den kalla vägen
  (`components/sok-kall.tsx`) och i sökrutan (`lib/sok-rankning.ts`), så
  rutans förslag är sidans första. "billig" är ett önskemål och sorterar
  inte.
  - ☠️ **Inte hela listan efter pris.** Överdragen och sidoborden är
    billigast och hade stått före varenda soffa.
  - ☠️ **Ordets egen kategori för sig.** De som heter soffa och är billigast
    är barnsofforna och hundsofforna, och en raclettegrill och en
    leksaksgrill är billigare än kolgrillarna. Motorn säger hur många av de
    första träffarna som ligger i ordets egen kategori (`Sokutfall.hemma`,
    regel 3 ovan): de ordnas efter pris först, sedan de som heter så på
    andra hyllor. "utan"-sökningar behåller indelningen (`rankaUtan`).
  - ☠️ **`varanHeterSa` räknar på ordens plats, inte på poängen.** Första
    versionen krävde 92 poäng för sökningen som den skrevs. Med "billigast"
    kvar i sökningen är "soffa" inte dess enda ord, varje soffa fick 60, och
    ingenting sorterades: sidan visade beskedet om prisordning över en lista
    i den vanliga ordningen. Det syntes först i webbläsaren, för proven
    frågade `varanHeterSa(namn, "soffa")` och sidan frågar med "soffa
    billigast". Nu: varje sökord som ord, eller sist i ett ord, i namnets
    huvuddel (`kant` 5–6), utan frågeorden och utan det kunden nekade.
    Provet går samma väg som sidan.
  - ☠️ **Priset jämförs i hela kronor.** Rutan läser indexets text ("1 599
    kr") och sidan varans tal, och med ören hade två varor som båda visar
    1 599 kr kunnat byta plats.
- **Ett ensamt pristak** ("under 500", "under 300 kr") är ingen sökning på
  ord (`sidaForPristak`). Förut söktes talet: 26 varor med "500" i namnet.
  Gränser med en egen sida går dit (`PRISSIDOR`, samma tal som
  `PRICE_TIERS`), andra tak till `/alla-produkter?pris=under-300`: listans
  prisreglage läser den adressen, och sidan pekar ut sin adress utan sökdel
  som original (granskat undantag i `lib/interna-lankar-fragestrang.test.ts`).
  ☠️ Golv ("över 5000 kr") går inte samma väg: listan ställer reglaget efter
  varorna som följde med sidan, och ett golv över deras dyraste räknas som
  inget filter (mätt i webbläsaren). De söks som förut.
- **"rea" och "fyndauktion" som hel sökning** skickas till sin sida
  (`lib/sok-sidor.ts`). "rea" gav fem julgirlanger med "REAlistiska
  barrgrenar", "fyndauktion" noll träffar. Rean bara när butiken har
  reavaror (`hasSale`, som menyernas länk). ☠️ `redirect` står utanför `try`:
  den kastar. "black friday" och "black week" är inte med: vart de ska leda
  är Leonards beslut.
- **Rubriken följer listans filter**: "Visar 119 av 140 produkter".
  `ShopBrowser` säger hur många den visar (`onAntal`), och svaret gäller
  listan det kom från (`listnyckel`).
- **Besked** för "utan" och för "billigast" (`inte`, `billigast` i `SokData`).

### De stora listorna hämtades om varje gång

☠️ **Vercels CDN skickar `age` och tar bort `s-maxage` ur svaret till
webbläsaren.** Sökindexet (561 kB), varulistan (792 kB) och bildkartan (410
kB) hade `max-age=300, s-maxage=3600`. Mätt på www: indexet kom med `age:
2356` och `max-age=300`, alltså för gammalt redan när det kom fram, utan
ETag. Varje sidladdning där kunden rörde sökrutan hämtade om det. Nu är
`max-age` lika med `s-maxage` (3 600) i de tre rutterna
(`app/api/search-index`, `app/api/lista`, `app/api/kort-bilder`). En kopia är
då som mest en timme äldre än CDN:ts, och slutsålt rättas ändå på
produktsidan. Inte mätt på www än: det syns först efter en deploy.

### Prov

`lib/sok-2026-11-21.test.ts`: 31 prov på en påhittad butik byggd som den
riktiga (namnen ur katalogens mönster, kategorierna ur menyn), ett per fel
ovan med vad www svarade den dagen. 84 avsiktliga fel i reglerna (varje regel
avstängd eller förvrängd, en i taget) fälls alla. Tre överlevde första
gången, och proven skärptes: en gran vars belysning bara heter "LED", en
särskriven sökning där det hopskrivna svaret kräver en strykning, och
`varanHeterSa` för en sökning som bara är ett frågeord.

☠️ **Proven var gröna och sidan fel.** "soffa billigast" hade prov för varje
del (ordet känns igen, listan ordnas, beskedet visas) men inget som gick
hela vägen med sökningen som kunden skriver den. Ett lokalt bygge och en
riktig webbläsare visade det på första försöket. En regel som syns för
kunden provas i ett bygge innan den kallas klar.

I ett lokalt bygge, i Chromium: beskeden för "utan" och "billigast",
hänvisningarna ("under 500", "under 300 kr", "rea", "fyndauktion"), rubriken
efter ett filter ("Visar 119 av 140 produkter"), det tomma läget, och
sökrutans tolv förslag mot sidans tolv första för sex sökningar (alla lika).
Efter "under 300 kr" visar listan bara varor under taket inom en sekund (0,45
till 0,96 s, dator och mobil). Den kalla vägen provades i ett bygge där
villkoret i `app/sok/page.tsx` var framtvingat (aldrig committat): samma
varor, ordning och besked som servern för sex sökningar.

☠️ **`lib/sok-minifierat.test.ts` letar upp slingan över namnen i den
minifierade koden, och minifieraren döper om variablerna.** När listan med
sökord råkade få namnet `$` hittade provet inte slingan (`\w` godtar inte
`$`). Mönstren godtar nu `[\w$]` där ett namn står.

### Farten

Reglerna lägger till jämförelser per namn (synonymerna som ord, stammen med
ändelse), så farten mättes om med gårdagens verktyg (`tools/sok-matning/`).

Räknetid per tangent på en dator (`tangenter.ts`, 182 tangenter i 21 ord, två
körningar var): 850 och 877 ms med motorn på www, 883 och 951 ms nu. En vanlig
tangent 3,0–3,4 ms mot 3,2–3,6 ms, den tyngsta 19–20 ms mot 23–27 ms. Det är
inom spridningen mellan två körningar, eller som mest en tiondel långsammare.

En profil visar var det ligger: jämförelsen per namn (`matchPrepared`,
`tokenQuality`) gör något mer arbete, och ingen enskild funktion sticker ut.
Sex körningar var, den snabbaste: 425 ms för 80 tangenter med motorn på www,
455 ms nu, alltså 7 % mer.

I Chromium med fyrdubbelt strypt processor (`fart.cjs`, tio ord, tre
körningar var, samma dator och samma timme):

| | www (gårdagens motor) | dagens kod, lokalt bygge |
|---|---|---|
| blockerat för de tio orden | 1 063, 1 175, 1 278 ms | 1 106, 1 301, 1 384 ms |
| längsta uppgift | 144–172 ms | 157–199 ms |
| längsta väntan för en tangent | 41–63 ms | 86–99 ms |

Det lokala bygget hade längre väntan per tangent än www i alla tre
körningarna. För att skilja koden från mätmiljön byggdes gårdagens kod
(`1238472f`) lokalt och mättes på samma sätt, rygg mot rygg med dagens:

| | gårdagens kod, lokalt bygge | dagens kod, lokalt bygge |
|---|---|---|
| blockerat för de tio orden | 1 307, 1 794, 1 795 ms | 1 310, 1 522, 1 583 ms |
| längsta uppgift | 172–244 ms | 171–189 ms |
| längsta väntan för en tangent | 69–123 ms | 63–79 ms |

Spridningen mellan två körningar är större än skillnaden mellan motorerna: i
webbläsaren går dagens regler inte att skilja från gårdagens. Skillnaden mot
www kom från mätmiljön. Det lokala bygget får index och sidor från samma
dator, och datorn var långsammare än dagen före, då gårdagens bygge gav 979
ms.

☠️ **Jämför aldrig ett lokalt bygge med www, och aldrig med en mätning från
en annan dag.** Första jämförelsen såg ut som en försämring på 40 ms per
tangent. Bygg båda versionerna och mät dem efter varandra.

### Inte gjort

- **Rankning efter försäljning eller klick** (granskningens punkt 1). Butiken
  samlar inte in vad som söks och klickas. Det är Leonards beslut om det ska
  mätas.
- **Artikelnummer i sökningen** (punkt 12). Leverantörernas artikelnummer får
  aldrig synas, och egna nummer finns inte i indexet.
- **Sökordet markerat i resultatsidans kort.** Korten är gemensamma för hela
  butiken.
- **Servern svarar på de första tangenterna medan indexet laddas** (punkt 11).
  Det är den riktiga lösningen för första sökningen på ett långsamt nät, och
  en större ombyggnad. Cachetiden ovan tar bort omhämtningen, inte den första
  hämtningen.
- **Material som egenskap** (punkt 2). "ek" och "rotting" är fortfarande ord
  som ska stå i namnet. Färg och mått är redan egenskaper som får strykas med
  besked.
- **Sökrutan visar inte hänvisningarna.** För "rea", "fyndauktion" och ett
  ensamt pristak är förslagen i rutan de gamla (julgirlangerna, varor med
  "300" i namnet) tills kunden trycker på sök: då skickar sidan vidare. Mätt
  i webbläsaren med Enter i rutan, dator och mobil.
- ☠️ **Lokalt väntar söksidan in katalogen före en hänvisning till "rea"**
  (menyn finns inte sparad lokalt, se den kalla vägen ovan). Första sökningen
  mot en nystartad lokal server står därför kvar på sidan i tjugo sekunder.
  I produktion läser sidhuvudet den färdiga menyn.
- **Prisgolv utan varuord** ("över 5000 kr") söks fortfarande som ett tal.
  Se "Ett ensamt pristak" ovan.
- **Kvar av olikheterna:** "soffa" 140, "soffan" 141, "soffor" 142 (en
  trädgårdsgrupp med "två tvåsitssoffor" och en klösmöbel "i sofform"),
  "kontors möbler" 126 mot "kontorsmöbler" 228, och "elbilar till barn" 52
  ("till" står inte i kategorins namn).
- **"husdjur" gick från 156 till 116.** Nålen "djur" räknas inte längre
  (regel 5): gungdjuren är borta, men också smådjursburarna. Kategorin
  Husdjur står överst på sidan.

## Jämförelsesajternas produktnamn i sökningen (Leonard 2026-11-22)

PriceRunner visar butiken som säljare av "Homcom Barnelbil Med 2.4 G
Fjärrkontroll" (2 419 kr, "Ingen direktlänk till produkten": vi betalar inte
för länken). Leonard skrev namnet i butikens sökruta och fick "Inga produkter
matchade". Frågan: kan kunden söka på PriceRunners namn här och hitta varan?

PriceRunner känner oss genom det publika flödet (`/feed/pricerunner.xml`) och
parar ihop varorna på GTIN med sina egna produktsidor. Namnet på sidan är
PriceRunners, och det börjar med leverantörens märke. Våra namn är omskrivna:
varan heter "Elbil barn SUV 12V – svart åkbil med fjärrkontroll, MP3 och
bälte, 3–6 år" här.

Tre saker gav noll, mätt i motorn som låg på www:

1. "homcom" står inte i något varunamn och ströks som okänt.
2. "barnelbil" står inte heller i något namn (varorna heter "Elbil barn …"
   och "Elbil för barn"). Ett okänt sammansatt ord delades bara när det var
   sökningens enda ord: "barnelbil" gav 52 elbilar, "barnelbil med
   fjärrkontroll" ingenting.
3. Kvar blev "fjärrkontroll", som inte är en varutyp, och regeln om ärligt
   noll (2026-11-21) svarade noll.

Mätningen av märkesord visade mer än frågan gällde, och det står med här:
märkesord gav rena felträffar, och regeln om ärligt noll hade en miss.

### Två sorters märken

- **Aosoms märken** (HOMCOM, Outsunny, PawHut med flera) säljs som Fyndplats.
  Märket står aldrig i ett varunamn, och produktsidan anger Fyndplats.
- **VEVOR är ett märke butiken visar.** Produktsidornas strukturerade data
  anger VEVOR (mätt på www 2026-11-24: en dieselvärmare och en knappform), och
  fyra varunamn nämner det ("utbytbar form för VEVOR knappmaskin"). Första
  versionen av regeln nedan antog att inget namn bär ett märke. Det stämde
  för 7 972 namn den 22 november och inte för 8 448 två dagar senare.

### Mätt före och efter

Dagens index (2026-11-24, 8 448 varor), motorn på www mot grenen. Bara det
första namnet är hämtat från PriceRunner (Leonards skärmbild). De andra är
byggda på samma mönster: ☠️ **PriceRunner svarar en automatisk läsare med 202
och en tom sida.** Det är deras spärr, och den går vi inte runt.

| sökning | www 2026-11-24 | grenen |
|---|---|---|
| Homcom Barnelbil Med 2.4 G Fjärrkontroll | 0 | 52 elbilar för barn med fjärrkontroll |
| homcom barnelbil | 0 | 52 |
| HOMCOM Barnelbilar med fjärrkontroll | 0 | 52 |
| homcom elbil | 57, med beskedet att "homcom" strukits | 57, utan besked |
| Aiyaplay Elbil för barn 12V | 1: en CarPlay-adapter, med "elbil", "barn" och "12" strukna | 26 elbilar |
| vevor dieselvärmare | 37: en fatpump "med vev", knappformar och markiser, med "dieselvärmare" struket | 42 dieselvärmare |
| VEVOR Dieselvärmare 8 kW | 37, samma varor | 38, de på 8 kW först |
| Vevor Vinsch 12V | 37, samma varor | 17 vinschar |
| vevor knappmaskin | 4 tillbehör, ingen maskin | 7: de tre maskinerna först |
| vevor | 29: de fyra varor som nämner märket, sedan varor "med vev" | 4 |
| Durhand Verktygsvagn | 10: matstolar "med handtag", med "verktygsvagn" struket | 29 verktygsvagnar |
| durhand / aiyaplay / sportnow | 10 / 1 / 3 som "ligger närmast i stavning" | 0 / 0 / 0 |
| Pawhut Kattträd 180 cm | 0 | 96 klösträd, det på 180 cm först |
| Pawhut Hundbur 106 cm | 1 | 19 hundburar, den på 106 cm först |
| Kleankin Badrumsskåp vitt | 16 | 49, "Badrumsskåp vitt …" först |
| Outsunny Paviljong 3x3 m | 41, en paviljong på 390 × 300 cm först | 41, popup-paviljongen på 3 × 3 m först |
| Homcom Barnmotorcykel 6V | 0 | 31 |
| Outsunny Trädgårdssoffa 3-sits | 0 | 7 |
| trixie kattträd | 0 | 96, med beskedet att "trixie" strukits |
| ikea barpall | 0 | 58, med besked |

På www i en webbläsare 2026-11-24: PriceRunner-namnet (0), "vevor
dieselvärmare" och "vevor dieselvärmare 8 kw" (37, fatpumpen först), "vevor
knappmaskin" (4), "vevor" (29), "ikea barpall" och "trixie kattträd" (0) och
"durhand verktygsvagn" (10). Den 22 november dessutom "jysk solstol" och "ikea
köksbord" (0, på grenen 16 och 60), "aiyaplay elbil för barn 12v" (1) och
"ikea soffa" (140 med besked, som det ska vara).

### Reglerna (`lib/search.ts`)

1. **Leverantörens märke hör till frågan, inte till varan**
   (`LEVERANTORSMARKEN`). Märkena är de som `lib/varumarke.ts` gör om till
   butikens eget i flöden och strukturerad data, plus VEVOR och butikens
   namn. Provet håller listorna lika. Fyra saker följer av det:

   - **Märket tas bort ur sökningen innan något räknas** (`utanMarken`, först
     i `rankaMedInfo`). "Homcom Barnelbil" söks som "Barnelbil", och svaret
     är detsamma med och utan märket: samma varor, samma ordning, samma
     besked. Skiljetecknen intill märket följer med ("Homcom:", "HOMCOM®"),
     och ett nekande ord framför det ("soffa utan homcom" är sofforna: ingen
     vara heter så, så det finns inget att välja bort).
   - **Märket är ett småord** (`STOPWORDS`) för allt annat som läser
     sökningen: kategoriförslagen, "billigast"-ordningen och delningen
     nedan.
   - **Märket är aldrig en böjning** (`INTE_BOJT`). "vevor" lästes som
     flertalet av "vev".
   - **Märket ensamt är inget stavfel** (`baraMarken`). Sökningen på bara
     märket ger varorna som nämner det (fyra för "vevor"), annars noll.
     Aldrig varor som "ligger närmast i stavning".

   ☠️ **Att låta märket strykas med besked räckte inte: det ströks inte
   alltid.** "vevor" var "vev" i flertal, "durhand" låg nära "handtag" och
   "aiyaplay" nära "airplay". Då var märket ett känt ord, och det som ströks
   var varuordet: "vevor dieselvärmare" visade en fatpump med vev.

   ☠️ **Att bara göra märket till ett småord räckte inte heller.** Det var
   första versionen. "homcom vit byrå" fick samma varor som "vit byrå" men i
   en annan ordning (frasen i namnet räknas med småorden kvar), rättningen sa
   "träffarna för homcom fåtölj", och "homcom elbilar för barn" var inte
   längre kategorins namn. Av 2 795 provsökningar ändrade märket svaret för
   844. Nu för ingen, mätt mot båda dagarnas index.

   ☠️ **Mönstret är skrivet utan bakåtblick** (`(?<!…)`). Safari före 16.4
   kan inte läsa en sådan, och då laddas inte sökningen alls på äldre
   telefoner.

2. **Ett okänt sammansatt ord delas också i en sökning på flera ord**
   (`medDeladeOrd`, och sista steget i `rankaMedInfo`). "barnelbil med
   fjärrkontroll" söks som "barn elbil med fjärrkontroll". Svaret är detsamma
   som när kunden skriver orden isär: andra ord stryks eller fylls på som
   vanligt, med besked ("barnelbil rosa" är de två rosa elbilarna och sedan
   de andra), och stavningen rättas som vanligt, med besked ("barnelbil med
   fjärkontroll").

   Vilka ord som delas:
   - Bara ord som katalogen inte har: inget namn har ordet (i någon böjning),
     inget ord i katalogen börjar så (kunden kan vara mitt i ordet), och det
     är varken ett ord i synonymtabellen (också böjt: "cykelvagnen"), ett
     kategoriord eller ett småord.
   - Bara en stark delning (`starkDelning`): båda delarna minst fyra
     bokstäver och vanliga i katalogen. Huvudordet får vara böjt när
     katalogen har entalet ("barnelbilar", "barnelbilen"), men inte ord som
     bara ser böjda ut (`INTE_BOJT`: ett filter är ingen filt).
   - Ord för ord, inte blanktecken för blanktecken. ☠️ "Barnelbil, med
     fjärrkontroll" och "barnelbil/fjärrkontroll" gav noll i första
     versionen: kommat satt ihop med ordet.

   När det delade svaret gäller:
   - Bara när sökningen som den skrevs inte räckte: den gav noll, eller ett
     ord fick strykas. Då ska delningen stryka färre ord, annars gäller det
     kunden skrev ("barnelbil dieselvärmare" visar dieselvärmarna).
   - ☠️ **Båda delarna ska stå kvar.** Första versionen krävde bara färre
     strukna ord, och "trädgårdssoffa 3-sits" blev "trädgårds soffa 3-sits"
     med "soffa" struket: gungbänkar och en knäpall. Ordet som delades är
     varutypen. Stryks en del av det är svaret en annan sökning, och då är
     ett ärligt noll bättre.
   - Formen utan foge-s provas också ("trädgårds soffa", sedan "trädgård
     soffa"), högst två former, och den som stryker minst gäller. "trädgård"
     är kategorins ord, "trädgårds" är det inte.

3. ☠️ **Ärligt noll: ett ord ur synonymtabellen är en varutyp** (`arVarutyp`).
   En miss i regeln från 2026-11-21, som låg på www i fyra dygn. Regeln
   frågar om något kvarvarande sökord är vad varor ÄR (ordet står först i
   minst 15 % av namnen som har det), och letade bara efter ordet som det
   skrevs. "trixie kattträd", "ikea barpall", "jysk solstol", "ikea köksbord"
   och "jysk utemöbler" gav noll: de flesta varorna heter Klösträd, Barstol,
   Solsäng, Matbord och Loungeset, så ordet stod först i för få namn (eller
   inget). Ordet träffar dem genom tabellen och är lika mycket en varutyp som
   de, så tabellens former räknas med (synonymerna och envägsorden). "ikea
   soffa" gick hela tiden, för sofforna heter Soffa.

### Mätt brett

- **13 972 provsökningar** (samma som 2026-11-21) mot motorn på www. Ett
  svar ändras, "vevor" ensamt: 23 → 0 med indexet från den 22 november (då
  nämnde inget namn märket, och träffarna var varor "med vev"), 29 → 4 med
  dagens. Mängden har nästan inga märkesord och inga okända sammansatta ord i
  sökningar på flera ord, så den säger bara att inget annat rubbats. Därför
  tre riktade mängder (indexet från den 22 november, slutlig kod):
- **Märket framför var femte provsökning** (2 795 stycken, "homcom " +
  sökningen): svaret är detsamma som utan märket för alla, mätt mot båda
  indexen.
- **6 006 sökningar med okända sammansatta ord**, byggda ur 1 202 ordpar som
  står i samma varunamn ("stål" och "hylla" blir "stålhylla"), vart och ett
  ensamt, med ett tredje ord ur namnen, med märke, med en färg och med ett
  mått. 1 626 svar är oförändrade (de ensamma orden delades redan), 3 469 går
  från noll till träffar, 905 från träffar till andra träffar, 6 får bara ett
  annat besked och ingen går från träffar till noll. De 905 var förut svaret
  utan det sammansatta ordet, eller en felgissning: "stålhylla 120 cm" gav en
  blomsterhylla i trä med "120" struket, nu 58 hyllor i stål. Av de tio
  första träffarna i de nya svaren har 36 085 båda delarna i namnet och 2 525
  inte: där är delen en färg eller ett mått som fylls på efter varorna som
  har den (`hela`), som i andra sökningar.
- **825 sökningar "okänt ord + ord ur synonymtabellen"** (275 ord efter
  "zzqqxx", "trixie" och "cykelhjälm"): 399 gick från noll till sina varor
  med regel 3, inga andra ändrades.

### Prov

`lib/sok-2026-11-22.test.ts`: sjutton prov på en påhittad butik (elbilar som
heter "Elbil … barn", utesoffor som bara kategorin säger hör till
trädgården, en cykelkärra, en knappform som nämner VEVOR och en adapter med
AirPlay i namnet). 37 avsiktliga fel i reglerna fälls alla. Fem överlevde
första gången, och proven skärptes: delningen när sökningen som den skrevs
gav träffar med ett struket ord ("trädgårdssoffa parasoll"), ett känt ord i
en annan böjning ("barnstolar" när katalogen har "barnstol"), ett
kontrollfall som var fel uttänkt, och märket ensamt, där provbutiken inte
hade något varunamn som låg nära märket i stavning. En var likvärdig med
originalet och ströks. Provet "rankByName i tre varv ger samma lista som ett
varv" (`lib/search.test.ts`) fångar också en för svag delning.

I ett lokalt bygge av den slutliga koden, i Chromium (2026-11-24): söksidan
för femton sökningar (namnet från PriceRunner 52 utan besked, också med
komma; "vevor dieselvärmare" 42 och med "8 kw" 38; "vevor knappmaskin" 7;
"vevor" 4; "homcom elbil" 57 utan besked; "homcom barnelbil med fjärkontroll"
med beskedet "Här är träffarna för barn elbil med fjärrkontroll"; "trixie
kattträd" och "ikea barpall" med beskedet om det strukna ordet; "durhand
verktygsvagn" 29; "durhand" och "homcom" noll; "soffa utan homcom" 141).
Namnet skrivet i sökrutan med Enter, dator och mobil, leder till sidan med de
52. Rutans tolv förslag är sidans tolv första för tio sökningar. Den kalla
vägen provades inte: ändringen ligger i motorn, och söksidans kod är orörd.

### Farten

Räknetid per tangent på en dator, dagens index, utlagd och ny motor
varannan gång (`tangenter.ts`, 182 tangenter i 21 ord): 1 341, 1 322 och
1 311 ms med motorn på www, 1 307, 1 271 och 1 263 ms på grenen. Ingen
skillnad utöver spridningen.

För fem av namnen ovan (128 tangenter, två körningar var): 2 887 och 2 648 ms
på www, 2 171 och 2 018 ms på grenen. Märkesorden kostar ingenting när de
tas bort, mot en hel strykning förut ("homcom barnelbil med 2.4 g
fjärrkontroll" 717 ms mot 1 207 ms). Tangenterna EFTER ett delat ord kostar
däremot en sökning till: "barnelbil med fjärrkontroll" tar 608 ms för sina
27 tangenter mot 519 ms, och den tyngsta tangenten 52 ms mot 38 ms. Det
gäller bara sökningar med ett okänt sammansatt ord, och bara där delningen
är stark.

### Varan kommer inte först

Varan från skärmbilden står på plats 46 av 52 för hela namnet (plats 3 för
"homcom barnelbil", plats 1 med "svart" eller "suv" i sökningen). PriceRunners
namn säger ingenting som skiljer den här bilen från de andra elbilarna med
fjärrkontroll, och våra namn är omskrivna.

För att samma vara ska komma först behövs PriceRunners namn per vara, och det
har vi inte: PriceRunner släpper inte in en automatisk läsare, leverantörens
flöde har tyska namn, och Leonards GTIN-lista är konfidentiell och finns inte
i repot. Tre källor som Leonard kan ta fram: en lista över matchade produkter
ur PriceRunner Business, CDON-listan om den har svenska titlar, eller
leverantörens svenska titlar (antaget, inte kontrollerat: PriceRunners namn
ser ut som början på en sådan titel).

Formen när listan finns, inte byggd: en tabell namn → vara som ligger UTANFÖR
det publika repot och utanför det publika sökindexet (som kartan för
Prisjakt-flödet), och söksidan på servern som skickar en sökning på exakt det
namnet direkt till varans sida. Namn som bär artikelnummer får aldrig in i
repot.

### Inte gjort

- **"vevor" ensamt visar bara de fyra varor som nämner märket**, inte alla
  VEVOR-varor. Sökindexet bär inget märke. VEVOR är ett märke butiken visar,
  så det går att lägga till. Det är Leonards beslut.
- **Aosoms märken ensamma ("homcom") ger noll.** Att visa leverantörens varor
  för ordet skulle säga vilka de är.
- **Andra butikers och tillverkares märken som liknar ett katalogord.**
  "biltema dieselvärmare" ger två biltillbehör med "dieselvärmare" struket,
  "rusta julgran" 50 varor "i rustik stil", "outwell tält", "tectake pall" och
  "dewalt verktygsvagn" likaså. Märket läses som ett känt ord, och när inget
  namn har båda stryks det vanligaste ordet, som är varuordet. Det är samma
  fel som regel 1 rättar för våra egna märken, men lösningen för främmande
  märken ligger i valet av vilket ord som stryks, och det rör varje sökning
  där något stryks. Av 25 provade främmande märken gav 5 sådana felträffar
  (2026-11-22). Märken som inte liknar något ("ikea", "weber", "bosch")
  stryks med besked som de ska.
- **Ett okänt ord följt av ett kategoriord som inget namn har**
  ("zzzz barnmöbler", "zzzz kontorsmöbler") ger fortfarande noll. Ordet
  träffar genom kategorin, och strykningen räknar bara namnen.
- ☠️ **"cykelhjälm barn" är inte längre noll.** Katalogen fick en
  hundcykelkärra "för cykelhjul" efter den 22 november, och "cykelhjälm"
  ligger två fel från "cykelhjul": sidan visar kärran med beskedet att "barn"
  strukits, och nämner inte rättningen. Samma svar i motorn på www och på
  grenen. Rättningen med två fel i en sökning på flera ord är inte ändrad.
- **Det riktiga märket per vara i sökindexet för Aosoms varor.** Indexet är
  publikt, och märket står med flit bara i det hemliga Prisjakt-flödet.
- **En text om att leverantörens märken säljs under butikens namn.** Det är
  Leonards beslut.

## Jämförelsesajtens namn på varan: nycklar (Leonard 2026-11-25)

Leonard skickade en fil med PriceRunners namn på våra varor och bad om att
kunderna ska kunna söka på dem: "så du kan göra så kunderna kan söka efter
produkterna i vår butik med deras namn". Avsnittet ovan gjorde att märket och
sammansatta ord inte längre ger noll. Det här gör att **varan som heter så står
först**, fast den heter något annat hos oss.

### Vad filen är

2 631 rader: PriceRunners namn, vår vara, och hur säker parningen är. Paren är
gjorda på sannolikhet (bild, text, tal och pris), **inte på GTIN**: 463 i klass
A (poäng 4,5–9,5), 563 i B och 1 605 i C. I klass A har 332 av 463 samma pris på
båda sidor. Alla 463 varor fanns i sökindexet den 25 november.

☠️ **Filen checkas aldrig in.** Namnen är jämförelsesajtens, och 55 av dem bär
något som liknar ett artikelnummer (8 i klass A). Sökindexet hämtas av varje
webbläsare och är alltså publikt, så namnen kan inte ligga där heller.

### Mätt före och efter

Namnet som sökning, mot sökindexet på www 2026-11-25 (8 541 varor), med motorn
som gick ut samma natt:

| klass A, 463 namn | före | med nycklar |
|---|---:|---:|
| varan först | 94 | 427 |
| plats 2–4 | 35 | 4 |
| plats 5–12 | 15 | 1 |
| längre ner | 6 | 1 |
| träffar, men inte varan | 149 | 6 |
| noll träffar | 164 | 24 |

De 36 som inte står först: 33 namn har färre än tre ord när märket är borta
och får ingen nyckel, och 3 namn delas av flera varor (alla står först, i
katalogens ordning). Av 8 336 vanliga sökningar (`tools/sok-matning/utfall.ts`)
ändrades ingen, varken träffarna, ordningen eller beskeden. Sökindexet växte
med 8 372 byte, 5 623 byte packat (0,9 %).

### Så fungerar det

- **En nyckel är en enkelriktad summa av namnets ord** (`namnnyckel` i
  `lib/search.ts`): märket bort med `utanMarken`, gemener, skiljetecken bort,
  tal och bokstäver var för sig ("2.4 G" och "2,4g" är samma två ord).
- **`lib/namnnycklar-data.ts`** bär vår adress → nycklarna, 421 varor och 427
  nycklar. Filen byggs av `tools/namnnycklar/bygg.ts` ur filen med namnen, som
  ligger utanför repot (`tools/namnnycklar/README.md`).
- **Sökindexet skickar nycklarna med varans rad** (`x`, bara på de rader som
  har några), och söksidan läser samma data på servern. De tre vägarna
  (sökrutan, söksidan och söksidans kalla väg) ger sökningen nycklarna genom
  kategoridatans `nycklar`.
- **`rankaMedInfo` räknar sökningens nyckel** och ställer varorna som har den
  först (`medNamntraff`, `namnetsSvar`). Under dem står sökningens egna träffar,
  i samma ordning.
- **Vyerna säger det.** Vårt namn på varan är ett annat, så utan besked syns
  det inte att första kortet är varan kunden sökte. Sökrutan sätter märket
  "Varan du sökte" på kortet, och söksidan skriver "Den första varan heter så
  hos prisjämförelsesajterna."

Nio regler som inte ska tas bort:

1. ☠️ **Namnen står aldrig i repot, i indexet eller i en logg.** Bara
   nycklarna. Provet läser datafilen rad för rad och fäller på allt som inte är
   en adress och nycklar, och verktyget skriver bara ut antal.
2. ☠️ **Ett ord som liknar ett artikelnummer räknas inte** (`artikelnummerlikt`),
   varken i namnet eller i sökningen. En nyckel som tog med det hade gjort
   sökrutan till ett uppslag från leverantörens artikelnummer till vår vara.
   Med ordet struket på båda sidor ger ett artikelnummer ensamt ingen nyckel.
   Mått och enheter ("120x60cm", "12v", "3-sits") är inga artikelnummer.
3. **En nyckel kräver minst tre ord** (`MINST_ORD`). "Barnelbil" är ingen
   vara, det är femtio.
4. **Sökningens egna träffar står kvar under varan.** Parningen är gjord på
   sannolikhet, och har den fel ska de vanliga träffarna finnas där.
5. ☠️ **Namnets svar bär bara sina egna fält** (`namnetsSvar`): varorna, antalet
   och orden kunden nekade. Beskeden om strukna ord, rättad stavning och
   påfyllda listor beskrev en sökning på ord och följer inte med. Träffar som
   bara låg nära i stavning (`liknande`) står inte kvar under varan: utan sitt
   besked hade gissningarna sett ut som svar.
6. ☠️ **En slutsåld vara står också först** (`namnForst` i `lib/sok-ordning.ts`).
   Den som söker en vara på dess namn ska se den, med märket Slutsåld: annars
   tror kunden att butiken inte har den. Regeln om det köpbara först gäller
   träffarna under. Söksidan lägger därför inte någon ordning på efteråt.
7. **Ett namn som fler än tre varor delar stryks** (`FLEST_VAROR_PER_NYCKEL`),
   och delar två eller tre varor ett namn står alla först.
8. ☠️ **Bara servern läser datafilen** (`app/api/search-index` och `app/sok`).
   Sökrutan får nycklarna med indexet, för de varor som finns.
9. ☠️ **Uppslaget minns vem som läste nycklarna** (`varorForNyckel`). Det sparas
   per varulista, och sparat utan källan gav en andra källa den förstas svar:
   mätningen körde först utan nycklar, och sedan hade ingen vara någon.

### Kontrollerat

- 3 491 prov går igenom, och typkontrollen är ren. 36 avsiktliga fel i
  nycklarna, ordningen, verktyget och vyerna, ett i taget: alla fälls. Första
  rundan överlevde fem, och proven skärptes.
- Slutkoden byggd lokalt och körd i Chromium, 390 × 844 och 1 280 px, med fyra
  namn ur filen: ett där sökningen i dag ger noll, ett där varan inte fanns
  bland 30 träffar, ett som två varor delar och ett på en slutsåld vara. Rätt
  vara stod först i sökläget, i listan under rutan och på söksidan, med märket
  och beskedet. En vanlig sökning fick inget märke. Inga fel på sidan.

### Inte gjort, och inte mätt

- **Klass B och C är inte byggda.** B har 563 par med svagare stöd (ofta bara
  tal och pris, eller bara bild). Verktyget tar klasserna som argument.
- **Om paren i klass A stämmer är inte kontrollerat.** Klassen är filens eget
  mått. Ett fel par ställer fel vara först för just det namnet, med de vanliga
  träffarna under.
- **Bara hela namnet ger en nyckel.** Den som skriver början av namnet får
  sökningens vanliga svar tills hela namnet står där.
- **Prisjakts namn** finns inte i filen. Nycklarna är desamma för varje sajt
  vars namn läggs till.
- **En riktig telefon.** Koden är skriven utan bakåtblick i mönstren (Safari
  före 16.4), och provet håller det, men ingen iPhone har kört den.

## Sökläget: trycket går direkt till varan (Leonard 2026-11-24)

Leonard: "Om jag söker på nått dyker förslag upp direkt sen när jag trycker
Kmr jag inte direkt till produkten utan till bild 2 först i några hundra ms
sen till produkten, det känns inte premium." Bild 2 var sidan som låg UNDER
sökläget, i hans fall "Sökresultat för renar".

**Orsaken.** `goProduct` i `components/searchbox.tsx` stängde sökläget i
trycket (`setOpen(false)`) och bytte sida efteråt. Mobilens sökläge täcker
skärmen, så när det stängdes syntes sidan under tills produktsidan var
hämtad: två sidbyten för ett tryck.

**Mätt** (Chromium i telefonstorlek 390 × 844, sidans läge läst varje
bildruta, 2026-11-24). Sidbytets data hämtades dels som den kom, dels
fördröjd 0,6 s som på ett trögt mobilnät:

| | www (18e25500) | grenen |
| --- | --- | --- |
| Sidan under syntes efter trycket, utan fördröjning | 19 bildrutor (296 ms) | 0 (två körningar) |
| Sidan under syntes efter trycket, 0,6 s fördröjning | 47 och 57 bildrutor (772 och 1 035 ms) | 0 (två körningar) |
| Det tryckta kortet markerat medan sidan hämtas | nej | ja |
| Sökläget kvar efter sidbytet | 0 bildrutor | 0 bildrutor |
| Sökfälten tomma efteråt, sidan olåst | ja | ja |

De 296 ms är de "några hundra ms" Leonard såg: tiden är lika lång som
sidbytet tar.

**Trycket blir inte långsammare av förhämtningen.** Sidans egen hämtning går
iväg 18–35 ms efter trycket, samtidigt med förhämtningen och inte efter den
(mätt på grenen). Med 0,6 s fördröjning var produktsidan framme efter 731 ms
på grenen och 886 ms på www. På en riktig telefon ligger fingret 100–200 ms
på kortet innan det släpper, och då har förhämtningen det försprånget.

**Reglerna:**

1. ☠️ **Trycket stänger ingenting.** `ga(href)` sätter `pavag` och byter sida
   i en övergång (`startaGa(() => router.push(href))`). Sökläget står kvar med
   det tryckta kortet markerat (klassen `pavag`: bilden trycks in en aning och
   får märkesfärgens kant, resten tonas till 45 %).
2. **Sökläget är borta i samma rendering som den nya sidan ritas:**
   `framme = pavag !== null && !gar`, och `visas` är falskt när `framme` är
   sant. En effekt tömmer sedan rutan och säger till mobilmenyn (`onNavigate`).
   Det är samma mönster som sökningen har sedan 2026-08-29 (`skickad`).
3. **Sidan hämtas vid avsikt** (`forhamta`): när fingret landar på kortet, och
   när muspekaren når raden i datorns lista. En gång per vara, som
   `components/prefetch-link.tsx` gör på korten i listorna.
4. **I sökläget fälls tangentbordet i trycket**, så att kortet syns.
5. Varor, kategorirader och kategorichips går alla genom `ga`. Provet fäller
   om någon av dem byter sida på egen hand.

**Prov:** `lib/sok-lage.test.ts` ("trycket på en vara går direkt till varan",
sex prov, plus fyra äldre som låste den gamla koden). Fyra avsiktliga fel i
`ga`, `framme` och `visas` fäller proven. I webbläsaren på den byggda grenen:
musen och tangentbordet (pil ner och Enter) på datorn, kategorirad,
kategorichip i sökläget, en vara som är sidan man redan står på (sökläget
stängs ändå) och bakåtknappen efteråt. Inga sidfel.

**Inte provat:** Safari på en riktig iPhone. Chromium i telefonstorlek är
inte Safari, och övergången bygger på Reacts `useTransition`, som Safari har
samma stöd för. Leonard ser det direkt efter deployen.

## Telefonens sidhuvud följer fingret (Leonard 2026-11-24)

Leonard: "det är effektivare om man låter sök huvudet inte följa med när man
scrollar ner utan den försvinner så man ser mer, men så fort man scrollar upp
så dyker den upp på ett smidigt premium sätt". Och samma kväll, efter första
versionen på sin iPhone: "jag tyckte inte sökfältet dykte upp sådär smooth
utan det kom sådär tillbaka som ett hopp".

Telefonens sidhuvud med sökraden är 133 px av skärmen (16 % av en iPhone 14).

### ☠️ Första versionen: ett läge och en övergång

Den bytte läge vid en gräns (28 px ner, 6 px upp, `data-huvud="gomt"` på
`<html>`) och lät en CSS-övergång göra rörelsen. I Chromium mättes den till
0,29 s och "bromsar in mjukt". På Leonards iPhone var det ett hopp: en
övergång har sin egen fart och den är aldrig fingrets, och kurvan gick 60 %
av vägen på de första 75 ms.

**Läxan: en uppmätt tid i Chromium säger att övergången körs, inte hur den
känns under ett finger.** Mät i stället hur långt det går per bildruta, och
jämför med hur långt sidan gick i samma bildruta.

### Nu gör webbläsarens egen scrollning rörelsen

Sidhuvudet (`position:sticky`) ligger i omslaget `.huvudspar`
(`components/site.tsx`). Ett fäst element kan inte lämna sitt omslag: när
omslagets nederkant når sidhuvudets följer sidhuvudet med sidan, pixel för
pixel, i webbläsarens egen scrolltråd. `components/huvud-gom.tsx` sätter
omslagets höjd, och lika mycket negativ `margin-bottom`, så att sidan under
aldrig flyttar sig. Räkningen står i `lib/huvud-gom.ts` (rena funktioner):

- **`sparSteg`**, när rörelsen vänder: står sidhuvudet helt framme och sidan
  går ner läggs nederkanten vid sidhuvudets nederkant, och är det helt borta
  och sidan går upp läggs den strax ovanför skärmens kant. Däremellan skrivs
  ingenting.
- ☠️ **`sparRast`, när sidan står still** (130 ms utan rörelse): nederkanten
  läggs där sidhuvudet står. Inget syns av det. På iPhone scrollar skärmen i
  en egen tråd, och sidans kod får veta det en eller ett par bildrutor
  senare: en skrivning i vändningen kommer för sent med just de bildrutorna.
  Efter en vila behövs ingen skrivning alls, och sidhuvudet följer med från
  första pixeln. `sparSteg` är kvar för den som vänder utan att stanna.
- ☠️ **Aldrig längre bort än det redan ligger** (`Math.max` i `sparSteg`).
  Utan det sköts ett sidhuvud som vilade strax ovanför kanten undan igen för
  varje bildruta av ett långsamt drag, och kom aldrig in.
- **`sparVila`, när rörelsen stannat med sidhuvudet till hälften framme:** det
  glider den sista biten. Fram efter en rörelse uppåt med minst 16 px framme
  (`VISA_MINST_PX`), undan efter en rörelse nedåt med minst 28 px borta
  (`GOM_MINST_PX`), och alltid fram inom 273 px från sidans topp. Glidet
  väntar tills fingret släppt, och prövas då inom 70 ms.
- ☠️ **Glidet börjar stilla** (`GLIDKURVA`, `cubic-bezier(.4,0,.2,1)`, 190 ms
  plus en ms per px, högst 340: `glidMs`). Sidhuvudet har stått still när det
  börjar. Med en kurva som börjar i full fart gick det 16–21 px i första
  bildrutan: samma hopp som i första versionen.
- **Ett avbrutet glid** (`sparAvbrutet`): rör kunden sidan mitt i glidet står
  sidhuvudet kvar där det syns och följer fingret därifrån.
- **Nära sidans topp** (140 px, `ALLTID_OVAN_PX`) står sidhuvudet på sin plats
  i sidan. Produktsidan landar 88 px ner med bilden under sidhuvudet.
- **Ett gömt sidhuvud ligger 2 px ovanför kanten** (`UR_BILD_PX`): precis i
  kanten kan linjen i dess nederkant synas som en hårfin rand.
- ☠️ **Läget hålls inom sidan.** iOS låter sidan dras förbi toppen och botten
  och studsa tillbaka. Utan det hade studsen i botten räknats som att kunden
  scrollade upp.

Komponenten, utöver räkningen:

- ☠️ **Sidan landar.** Från sidbytet tills kunden själv rör sidan (finger,
  hjul, tangent, rullningslist) står sidhuvudet framme där sidan är, vad som
  än flyttar den: webbläsaren som ställer tillbaka läget efter bakåtknappen,
  eller produktsidan som ställer bilden under sidhuvudet. Utan det avgjorde
  ordningen mellan den flytten och effekten om sidhuvudet var framme.
- ☠️ **Sökläget stängs: sidan landar på nytt.** Remsan och loggans rad kommer
  tillbaka ovanför, Chrome flyttar sidan lika mycket (110 px) för att det
  kunden ser ska stå still, och den flytten räknades som ett svep ner:
  sidhuvudet gled undan i samma stund som sökläget stängdes.
- **I sökläget** är omslaget `display:contents` och sidhuvudet sitter fäst
  överst som förut. Fokus i sidhuvudet (tangentbord, skärmläsare) tar fram det.
- ☠️ **Omslagets överkant mäts med decimaler** (`getBoundingClientRect`, inte
  `offsetTop`). Kampanjremsan ovanför är 46,4 px hög, och med 46 hamnade
  sidhuvudet 0,4 px fel när glidet var klart.
- **Minskad rörelse:** inget glid, sidhuvudet byter läge direkt.
- **Går något fel**, eller körs skriptet inte, är omslaget `display:contents`
  och sidhuvudet sitter fäst överst som före 2026-11-24.

Stilen (`app/globals.css`, "Sidhuvudet följer fingret"):

- ☠️ **Bara telefonen, 760 px**, samma gräns som produktsidans mobilläge.
  Första versionen gällde upp till 900 px. Mellan 761 och 900 px fäster
  produktsidans bildgalleri under sidhuvudet (`--ankare`), och ett sidhuvud
  som försvann lämnade en tom remsa ovanför bilden. Surfplattan och datorn
  är som förut.
- På telefonen är sidhuvudet ogenomskinligt: den suddiga bakgrunden ritades
  om för varje bildruta medan sidhuvudet rörde sig.
- Omslaget tar inga tryck (`pointer-events:none`, sidhuvudet `auto`) och är
  aldrig det webbläsaren håller sidan still mot (`overflow-anchor:none`).
- ☠️ **Kassan** gömmer butikens sidhuvud med `body:has([data-kassa-sida])`.
  Regeln pekade på `body>.sidhuvud`. Med omslaget emellan hade butikens meny
  stått överst i kassan, så regeln gömmer nu omslaget också.

### ☠️ Produktsidans köprad vet när sidhuvudet är borta

Köpraden i nederkant göms medan sidans egen köpknapp syns ("aldrig två
köpknappar i samma skärm", mätt på en riktig iPhone 2026-11-20). Den räknade
skärmens översta 133 px som täckta av sidhuvudet. När sidhuvudet följt med
sidan ur bild syns knappen där, och knappen och köpraden stod i samma skärm i
160 px av rörelsen. Det felet fanns redan i första versionen.

Nu sätter `components/huvud-gom.tsx` `data-huvud-borta` på `<html>` medan
sidhuvudet är helt ur bild, och `components/productview.tsx` har två
mätningar av knappen (under sidhuvudet, och hela skärmen) och väljer efter
märket.

### Mätt

Chromium, 390 × 844, lokalt bygge, riktiga pekhändelser (fingret ner, dras
en bildruta i taget, släpps), 2026-11-24:

- **Ner från sidans topp:** sidhuvudet står fäst till 140 px och följer sedan
  med sidan upp ur bild. Ingenting skrivs på vägen.
- **Upp efter en vila:** fingret drog sidan 55 px, och sidhuvudet var 53 px
  framme när fingret släppte (2 px är marginalen ovanför kanten). Ingenting
  skrevs under draget. Bildruta för bildruta är sidans läge plus det som
  syns av sidhuvudet konstant (1 783 + 12, 1 769 + 26 … 1 669 + 126, alla
  1 795): sidhuvudet rör sig exakt som sidan.
- **Ett mycket långsamt drag** (30 px/s, en halv pixel per bildruta):
  sidhuvudet kom in, 28 px framme efter 30 px, och ingenting skrevs.
- **Vila till hälften framme:** 53 px framme efter ett drag uppåt, glider
  fram. 10 px borta efter ett ryck neråt, glider tillbaka fram. 55 px borta,
  glider undan. 11 px framme efter en darrning uppåt, glider undan igen.
- **Glidet:** 80 px på 267 ms, med stegen 0,7 2,6 5,5 9,5 13 12,6 10 7,5 5,6
  4,1 3,1 2,3 1,6 1 0,7 0,2 px per bildruta. Det börjar 130 ms efter
  sidans sista rörelse, eller 70 ms efter att fingret släppt en sida som
  redan stod still (`SLAPP_MS`).
- **Avbrutet glid:** ett nytt drag 110 ms in i glidet. Sidhuvudet stod kvar
  där det var (52 px framme) och följde fingret ner, 24 px per bildruta,
  lika som sidan.
- **Vändning utan vila** (ett kast neråt och direkt ett drag uppåt):
  sidhuvudet kom in från vändningen. Största steget utöver sidans eget: 2 px.
- **Sidan under:** första kortet på samma plats i sidan (548,4 px) och sidans
  höjd oförändrad (5 532 px) genom hela provet. Inga layoutskift av rörelsen
  eller glidet.
- **Sökläget:** öppnat med sidhuvudet borta står fältet överst. Stängt står
  sidhuvudet framme och sidan på samma plats.
- **Sidbyte:** produktsidan landar 88 px ner med sidhuvudet framme och bilden
  14 px under det. Bakåt: listan på 870 px med sidhuvudet framme, och nästa
  drag ner tar det med sig.
- **Köpraden:** köpknappen 55–111 px från skärmens överkant med sidhuvudet
  borta, köpraden gömd. Sidhuvudet tillbaka över knappen, köpraden visas.
  Knappen ur bild, köpraden visas.
- **Kassan:** butikens sidhuvud och omslag gömda. **820 px och 1 280 px:**
  sidhuvudet fäst överst som förut, med suddig bakgrund.
- **Minskad rörelse:** inget glid, läget byts direkt.
- 21 skrivningar under hela provet, alla i en vändning utan vila, vid en vila
  eller när ett glid var klart. Ingen i takt med fingret.

**Prov:** `lib/huvud-gom.test.ts` (29 prov) och köpradens prov i
`lib/mobil-finslip.test.ts`. 47 avsiktliga fel i räkningen, komponenten,
stilen och produktsidan fäller proven.

### Mekanismen i Safari på riktiga iPhone (2026-11-25)

`tools/sidhuvud-prov/` bygger en fristående sida med samma räkning (läst ur
`lib/huvud-gom.ts`) och ett självprov i nitton delar. Den kördes i Safari på
tre riktiga telefoner hos BrowserStack, före mergen, utan att
förhandsvisningens länk lämnades ut: `tools/sidhuvud-prov/README.md` säger hur.

| | iPhone 15, Safari 27 | iPhone 16, iOS 18.6 | iPhone 14, iOS 16.4 |
|---|---|---|---|
| Delprov | 19 av 19 | 18 av 19 (första provsidan) | 19 av 19 |
| Upp efter en vila: läget plus det synliga, bildruta för bildruta | konstant, inget skrivet | konstant, inget skrivet | konstant, inget skrivet |
| Ner från sidans topp | fäst överst inom 140 px, sedan ur bild, inget skrivet | samma | samma |
| Glidets första steg per bildruta | 0,8 2,6 5,7 9,8 12,1 | 0,7 2,7 5,3 9,6 12,7 | 0,7 2,5 5,4 9,3 12 |
| Vila till hälften framme: fram, tillbaka fram, undan, undan igen | rätt i alla fyra | rätt i alla fyra | rätt i alla fyra |
| Vändning utan vila: största egna steg | 2 px | 2 px | 2 px |
| Avbrutet glid, långsamt drag | följer sidan | följer sidan | följer sidan |
| Sidan under | står still | står still | står still |

☠️ **Provsidan hade själv fel två gånger, och bara telefonerna visade det.**
Den räknade med att sidan hunnit flytta sig så långt som den ombetts: iOS 18.6
låg en bildruta efter, och iOS 16.4 utförde bara två tredjedelar av de små
förflyttningarna (272 px av 400). Ett prov som räknar med ett avstånd ska mäta
avståndet, inte anta det.

☠️ **Safari 27: det fästa sidhuvudets AVLÄSTA läge står en bildruta efter
sidans** medan sidan flyttas med `scrollTo` (125 i stället för 133 vid 8 px per
bildruta, i varje bildruta, och 133 så fort sidan stannar). Inte i iOS 16.4
eller 18.6. Om det också gäller under ett finger är inte fastställt.
Komponenten läste sidhuvudets läge på ett enda ställe, när ett glid avbryts.
Det räknas nu ur det koden själv vet (`sparAvbrutet`: där det stod, plus så
långt glidet hunnit enligt transformen, minus så långt sidan gått), och
`getBoundingClientRect` är bara reserv. Läs aldrig ett fäst elements läge i
farten och lita på det.

### Inte provat

- ☠️ **Ett finger på en riktig iPhone.** Självprovet flyttar sidan med
  `scrollBy`, som går genom sidans egen tråd. Ett finger scrollar i skärmens
  tråd, och sidans kod får veta det en eller ett par bildrutor senare. Provet
  säger alltså att Safaris layout gör det räkningen väntar sig, inte hur det
  känns. Sättet är valt för att inte bero på sidans kod i farten (efter en
  vila skrivs ingenting), men det är ett resonemang: mjukheten, studsen och
  Safaris adressfält måste Leonard se själv.
- Att glidet den sista biten känns rätt (130 ms vila, sedan 0,2–0,34 s) är
  ett val, inte ett mätvärde.
- Chrome på Android och Samsungs webbläsare är inte provade på riktiga
  telefoner, och inte Safari före 16.4 (laddsidan i provet kräver 16.4).

## GoWish: önskelistknappen på produktsidan (Leonard 2026-11-25)

Leonard har skrivit på ett samarbetsavtal med GoWish, en tjänst för
önskelistor. Första steget i deras onboarding är knappen ("Wishbutton") på
produktsidan. Guiden är https://gowish.com/sv/button-installation: ett skript,
en stilmall och en knapp med ett av deras id:n. Uppdraget kom som en färdig
text ur en annan chatt: knappen bara på produktsidor, nära köpknappen, på
svenska; skript och stil bara där, utan att sidan blir långsammare eller
hoppar; rätt vara och en ren länk; besked om kakor; ingen spårning och inget
produktflöde än.

Koden: `lib/gowish.ts` (värdena och adresserna), `components/gowish-knapp.tsx`
(knappen), `app/produkt/[slug]/gowish.css` (stilen) och en rad i
`components/productview.tsx`. Prov: `lib/gowish.test.ts` (24).

### Vad GoWish skript gör (läst 2026-11-25)

`gowish-iframe.js`, 19 811 tecken, ändrat hos dem 2026-11-12 (sha256
`42d3ab66…e7f9`). Det ligger i deras lagring med 60 sekunders cache och ändras
utan förvarning.

- **När det laddas** lägger det lyssnare på dokumentet (klick, meddelanden,
  synlighet, bakåt, Escape) och sätter `window.GoWish`. Det läser ingenting ur
  sidan, gör inga anrop och sätter inga kakor.
- **Vid klick** på en `<button>` med ett av fem id:n (också med en siffra
  efter) läser det `data-region` ur skript-taggen, som det hittar på id:t
  `gowish-iframescript`, och `data-producturl` ur knappen.
- ☠️ **Utan `data-producturl` skickar det hela `window.location.href`**, med
  utm, gclid och `?variant=`. Knappen bär därför alltid varans kanoniska adress
  (`gowishProduktadress`), samma som sidans canonical och og:url.
- ☠️ **Utan `data-region="global"` väljer det Danmark**: onskeskyen.dk och
  appens schema `onskeskyen://`.
- **Det skickar bara adressen.** Namn, bild och pris hämtar GoWish egna
  servrar från sidan på den adressen, och resultatet visas först när kunden
  loggat in hos dem. Skriptet läser varken og-taggar eller JSON-LD.
- **På dator** öppnar det en `<dialog>` med en iframe till
  `gowish.com/quick-add?source=button&crawlerTarget=<adressen>` och lägger en
  egen post i historiken. **På telefon** försöker det först öppna appen
  (`gowish://quick-add…`) och laddar sedan samma ruta om appen inte tog över.

### Två lägen, efter samtycket

Butikens regel för det som hämtas från en tredje part gäller här också, som
för Trustpilots knapp (`components/trustpilot-insamling.tsx`) och Klarnas
modul:

| | Utan samtycke till alla cookies | Med samtycke |
|---|---|---|
| Elementet | en länk, `<a class="gowish-btn">`, till GoWish egen sida i en ny flik | GoWish knapp, `<button id="gowishWhiteButton" class="gowish-btn">` |
| Hämtas från GoWish före klick | ingenting | skriptet, efter att sidan laddat klart (`strategy="lazyOnload"`) |
| Klicket | GoWish sida med varan öppnas i en ny flik | GoWish ruta ovanpå sidan, på telefon först appen |

- **Servern skickar länken till alla.** Samtycket läses i webbläsaren
  (`useMarketingConsent`), så sidan är densamma i ISR-cachen för varje besökare.
  Länken och knappen delar klass och mått: bytet flyttar ingenting.
- **Godkänner kunden alla cookies medan sidan är öppen** blir länken GoWish
  knapp och skriptet hämtas, utan omladdning. Ändras valet tillbaka blir det
  en länk igen, och ingen knapp med GoWish id finns kvar för skriptet.
- ☠️ **Anropa aldrig `window.GoWish.createIframe` när skriptet finns.** Det
  lyssnar själv på klicket; ett eget anrop öppnar rutan och skriptets lyssnare
  stänger den i samma klick. Knappens egen `onClick` gör bara något när
  skriptet saknas (blockerat av ett tillägg, eller klick före laddningen): då
  öppnas samma sida som länken, så att knappen aldrig är död.
- **Sekretesspolicyn** (`app/sekretesspolicy/page.tsx`) har en punkt om GoWish
  med båda lägena, intill Trustpilots.

### Knappen och rutan

- **Under köpraden**, lika bred som köpknappen och hjärtat tillsammans, med
  butikens ram, hörn och typsnitt. Det är den grå varianten i GoWish guide
  (`gowishWhiteButton`) med deras moln, texten "Lägg till i GoWish". Bara när
  varan finns i lager (`inStock`): en önskan om en slutsåld vara skickar den
  som ska köpa presenten till en sida utan köpknapp.
- ☠️ **GoWish stilmall laddas inte.** `gowish-iframe.css` börjar med
  `@import` av typsnittet Geist från en fjärde part (fonts.cdnfonts.com) och
  pekar ut ikoner i deras lagring, på varje sidvisning och i vägen för
  sidans rendering. Knappens stil är butikens egen, och molnet står i
  komponenten.
- **Rutans regler är GoWish egna**, ordagrant ur deras stilmall: på telefon
  sitter rutan i skärmens nederkant. Skriptet lägger dessutom in en egen
  grundstil när rutan öppnas (`#gowish-iframe-style`).
- ☠️ **Två egna rättelser för skärmar som rutan inte ryms på.** Skriptets
  grundstil sätter `min-height:615px`, och då biter inte deras `max-height`:
  i 375 × 600 låg rutans topp, med krysset, 13 px ovanför skärmen. Under
  665 px höjd släpps golvet och rutan får taket skärmens höjd minus 50 px.
  Under 400 px bredd får den högst skärmens bredd minus 16 px (den är annars
  370 px bred också på en skärm som är 360 eller 320). Reglerna har två
  klasser i väljaren, för skriptets stil läggs in efter sidans.

### Mätt i Chromium

Mot det lokala bygget, med GoWish riktiga skript och riktiga ruta:

- **Före klick, utan samtycke:** inget anrop till GoWish och inga kakor.
  **Med samtycke:** ett anrop (skriptet, efter sidans load), inga kakor och
  ingen lagring.
- **Efter klick** (rutan öppen i tolv sekunder, inget tryck i den): GoWish
  sätter tre egna kakor på `.gowish.com` (`referer`, `source`, `session`) och
  anropar sina egna tjänster. Butikens kakor är orörda. ☠️ Mätt från en
  adress i USA: GoWish väljer regler för samtycke efter besökarens land, så
  en svensk besökare kan mötas av deras egen ruta om kakor.
- **Rutan** får varans kanoniska adress från en sida öppnad med
  `?utm_source=…&gclid=…`, och från en vara med ett val gjort (`?variant=`
  i adressfältet). Escape, klick utanför och krysset stänger den; sidans
  adress, rullning och val står kvar.
- **Sidbyte mellan varor utan omladdning:** skriptet hämtas en gång, en
  skript-tagg, en knapp, och knappen bär den nya varans adress.
- **Tio skärmstorlekar** från 320 × 568 till 1 440 × 900: rutans topp syns och
  rutan ryms i alla.
- **Förskjutning vid laddning** (CLS): 0 på datorn i båda lägena, 0,0015 på
  telefonen i båda (kom från en annan del av sidan). Länken och knappen har
  samma mått och samma plats under köpraden.
- axe (WCAG 2.1 A och AA) på knappen i båda lägena: inga fel.

### ☠️ Tre saker i GoWish eget skript, som inte går att rätta härifrån

- **Bakåt stänger inte rutan.** Skriptet lägger en post i historiken för att
  bakåt ska stänga, men GoWish sida i rutan lägger egna poster ovanpå och
  skickar sig själv vidare till inloggningen varje gång. Mätt: sex tryck på
  bakåt, rutan öppen efter alla, och sidan under orörd. Krysset, Escape och
  ett tryck utanför fungerar.
- **På iPhone utan GoWish app** visar Safari en ruta om ogiltig adress innan
  GoWish ruta laddas. Det står i skriptets egna kommentarer; det är följden av
  att appen provas först. Inte sett här: det kräver en riktig iPhone.
- **Rutans iframe har ingen titel**, vilket axe anmärker på när rutan är
  öppen. Den skapas av skriptet.

### Vad GoWish robot får av produktsidan

Bara läst ur sidans HTML, inte sett hos GoWish (deras ruta visar varan först
efter inloggning):

- `og:title`, `og:image`, `og:url` (kanonisk) och `og:description` finns på
  varje vara. ☠️ Ingen pristagg (`product:price:amount`) finns.
- JSON-LD: en vara utan val är `Product` med `offers.price` och
  `priceCurrency` SEK. ☠️ En vara med val är `ProductGroup` med en `Product`
  per variant under `hasVariant`, och gruppen har inget eget pris. Visar
  GoWish inget pris för varor med val är det här skälet, och en pristagg i
  `<head>` är rättelsen.
- Sidan är densamma för roboten vilket val kunden än gjort: valet görs i
  webbläsaren, sidan är ISR-cachad.

### Inte gjort

- **Spårning och produktflöde** stod här. De är byggda sedan samma kväll, se
  "Heylink" och "GoWish-flödet" nedan.
- **Valet följer inte med i länken.** Länken är varans kanoniska, som
  uppdraget säger. Butikens egna länkar bär valet (`?variant=`), så att en
  kopierad länk öppnar samma val; en fråga till GoWish är om önskan ska göra
  det också.
- **Safari**, på iPhone och Mac, och appens väg på en riktig telefon.

### GoWish ruta på svenska (Leonard 2026-11-25: "Allt med go wish … ska stå på svenska")

☠️ **GoWish ruta står på engelska om adressen inte börjar med `/sv/`.**
Skriptet öppnar `gowish.com/quick-add?…` utan språk. Mätt samma kväll mot
GoWish egen sida:

| Webbläsare | Adress som öppnas | Hamnar på | Texten |
|---|---|---|---|
| svensk | `/quick-add` (skriptets) | `/sv/login` | engelska: "Sign in to add the wish" |
| engelsk | `/quick-add` | `/login` | engelska |
| engelsk | `/sv/quick-add` | `/login` | svenska: "Logga in för att lägga till önskningen" |

Texten följer alltså adressen som öppnas först, inte webbläsaren och inte
sidan man hamnar på. Skriptet har inget språkval (bara region: `global`,
`denmark`, `norway`). Därför:

- Länken utan samtycke, och reservvägen, går till `/sv/quick-add`
  (`gowishReservadress`).
- Med samtycke byter knappen ramens adress till `/sv/quick-add` när skriptet
  har satt den (`svenskRuta` i `components/gowish-knapp.tsx`,
  `gowishSvenskRuta` i `lib/gowish.ts`). Bevakningen startar vid klicket och
  lever medan rutan är öppen, högst 20 sekunder: på telefon får appen först upp
  till tio sekunder på sig, sedan sätts adressen.
- ☠️ Byter GoWish id på ramen (`gowish-iframe`) eller rutan
  (`gowish-iframe-dialog`), eller adressens början, händer ingenting: rutan
  öppnas då på engelska igen, och inget går sönder. Provet i webbläsaren
  (nedan) är det som märker det, inte `npm test`.
- Appen på telefonen har sitt eget språk och berörs inte.

## Heylink: GoWish spårning, bara på tacksidan (Leonard 2026-11-25)

GoWish mäter köpen som deras besökare gör hos oss genom Heylink. Deras mejl
bad om två saker ur guiden (docs.heylink.com/inbound/tracking-guide): skriptet
`tag.heylink.com/<kontots id>/script.js` på varje sida, och ordern i
`window.hlconversion` på tacksidan. Leonard: "Fixa det dom bad om".

**Skriptet är läst i sin helhet** (23 181 tecken 2026-11-25, serveras med
`no-store` och byggs per konto, så det kan ändras hos dem när som helst):

- En besökare från GoWish landar med `?hltid=<klick-id>`. Skriptet sparar id:t
  i localStorage (`_hey`). Kontots inställning är utan kakor
  (`disable_cookies`) och med 30 dagars giltighet (`cookie_lifetime`).
- ☠️ Det sparar också `gclid`, `fbclid`, `msclkid`, `utm_source`, `utm_medium`,
  `utm_campaign` och sidan besökaren kom från, för **varje** besökare, och
  lägger en MutationObserver på hela sidan som kör insamlingen vid varje
  ändring i DOM:en.
- ☠️ **När `window.hlconversion` sätts skickas ordern utan att skriptet ser
  efter om besökaren har ett klick-id.** Gör man som guiden säger får Heylink
  varje order i butiken, med belopp och varor.
- ☠️ Sätts objektet **efter** att skriptet startat går det genom en sättare som
  skriptet lagt upp till fem lyssnare på (en per omstart av dess loop), och
  ordern skickas lika många gånger. Sätts det **före** skickas den en gång.
- Anropet går till `heylinkapi.com/connect/v1/callbacks/advertisers` med sidans
  hela adress som `pageUrl`.

**Så är det byggt**, med samma resultat för GoWish (`lib/heylink.ts`):

1. **Klick-id:t fångas av butikens egen kod** (`components/heylink-klick.tsx`,
   i layouten). Med samtycke till alla cookies sparas det i localStorage
   (`fp_heylink`, id och tid) i 30 dagar. Utan samtycke finns det bara i
   minnet så länge fliken lever, och sparas om besökaren samtycker senare
   under besöket. Den som har valt bara nödvändiga får ett sparat klick
   borttaget. Inget hämtas från Heylink här.
2. **Heylinks skript laddas bara på tacksidan**, och bara när servern gett en
   order, besökaren har samtyckt, det finns ett sparat klick som inte gått ut
   och ordern inte redan lämnats (`components/heylink-kop.tsx`). Ordern sätts i
   `window.hlconversion` med klick-id:t före skriptet.
3. **Ordern byggs på servern**, bara med samtycke i kakan och bara i
   produktion (`app/tack/page.tsx`, `heylinkKop`), som Googles enkät: en prop
   till en klientkomponent hamnar i sidans HTML. Ett förhandsbygges kassa går
   mot skarpa betalnycklar, och ett prov där ska inte bli ett köp hos GoWish.
4. **Efter skriptets händelse `heylink:conversion`** glöms klicket och
   ordernumret sparas (`fp_heylink_order`), så att F5 inte skickar igen. Ett
   klick ger ett köp, som i Heylinks eget skript.

Vad Heylink får, mätt i webbläsaren mot det lokala bygget: `hltid`, `orderId`
(det läsbara numret), `orderSubTotal` (varorna utan moms och frakt, efter
rabatt), `orderTotal`, `orderTax`, `orderShippingSubTotal` (frakten utan moms,
när den finns), `orderCurrencyCode`, `orderItems` (namn, antal, styckpris utan
moms, val, bild och Wix variant-id, som är flödenas `g:id`) och skriptets eget
`consentStatus`. Aldrig namn, adress eller e-post.

- ☠️ **Beloppen är tal, inte text.** Skriptet tolkar en text som `"1234.500"`
  som tusentalsavgränsad.
- ☠️ **Tacksidans adress är ren.** Kassan landar alltid på `/tack?orderId=…`
  med en hel sidladdning (`window.location.replace` i `app/kassa/kassa.tsx`),
  och Stripes parametrar stannar i returvägen. Ändras det får skriptet en
  adress med betalningens id i `pageUrl`. Det är också skälet till att skriptet
  inte finns på sidan förrän då: en hel sidladdning, ingen tidigare kopia.
- **Varorna utan moms** räknas som totalen minus momsen minus frakten utan
  moms (`priceSummary.shipping`). Saknar ordern momsen räknas den som 25 %.

☠️ **Det som inte når Heylink** är vilka andra annonsklick kunden gjort
(`gclid`, `utm`). Vill GoWish räkna bort köp där en annan kanal var sista
klicket måste deras skript ligga på varje sida, och det är Leonards beslut.
Ett köp där tacksidan öppnas i en annan webbläsare än den kunden landade i
(Klarnas app som går tillbaka till Safari från en app-webbläsare) rapporteras
inte heller: klicket ligger i den första webbläsarens lagring. Det kräver
Heylinks server-till-server-anrop, och till det en nyckel från dem.

Sekretesspolicyn har en punkt om Heylink, och cookie-stycket nämner dem.
Prov: `lib/heylink.test.ts` (25). I webbläsaren, mot det lokala bygget med en
påhittad order och med anropen till Heylink besvarade lokalt (34 kontroller):
landning utan val, med samtycke och med bara nödvändiga; tacksidan med och
utan klick, med frakt, med gammalt klick, med redan lämnad order och F5.
☠️ Provet får aldrig gå mot Heylinks riktiga adress: det vore ett påhittat köp
hos GoWish. **Inte provat:** ett riktigt köp via en länk från GoWish. Heylinks
kontaktperson gör ett provköp när mejlet är besvarat.

## GoWish-flödet: Google-flödet med EAN (Leonard 2026-11-25)

GoWish bad om butikens Google Shopping-flöde i XML. Leonard: "feeden vi
skickar ska va som pricerunner att den har med alla ean/gtin nummer".
`https://www.fyndplats.se/feed/gowish.xml` byggs ur Google-flödet i
`lib/feed/gowish.ts`, som PriceRunner-, Prisjakt- och Pinterest-flödena, och
skickas komprimerat via `/feed/gz/gowish.xml`. Det står sist i listorna
(omskrivningen i `next.config.ts`, `KOMPRIMERADE_FLODEN`, `LAGRADE_FLODEN`,
`BYGGARE`, värmningen och `/api/cron/farska-floden`).

Skillnaderna mot Google-flödet:

- **`g:gtin`** på de varor som `FLODE_GTIN` pekar ut, samma urval som
  PriceRunner och Prisjakt (`gtinUrval`). Raden `g:identifier_exists=no` tas
  bort på dem. ☠️ Google-flödet får fortfarande aldrig koderna.
- **`g:shipping`** per vara, med kassans regel räknad på priset kunden betalar.
- **Googles kampanjetiketter** (`g:custom_label_*`) tas bort.

Det som **inte** ändras, och som skiljer flödet från PriceRunners:

- `g:price` är ordinarie pris och `g:sale_price` reapriset. En önskelista kan
  då visa att varan är nedsatt.
- Slutsålda varor står kvar med sin `g:availability`. GoWish får betalt per
  köp och inte per klick, så PriceRunners skäl för att ta bort dem gäller inte.

Märket är Fyndplats och ingen `g:mpn` finns, som i alla öppna flöden. Byggt ur
produktionens Google-flöde 2026-11-25: 11 517 varor, 10 280 i lager, 174 med
reapris, `g:gtin` på minst 3 639 (de som PriceRunner-flödet hade samma stund;
slutsålda varor med kod kommer till), 27 MB och 3,5 MB som gzip.
`lib/feed/gowish.test.ts` fäller om byggaren tappar `FLODE_GTIN` eller om
flödet saknas i någon av listorna.

Kopian i Runtime Cache kostar som de andra: 3,5 MB som gzip är omkring 600
skrivenheter per körning av jobbet, tolv gånger om dygnet, ungefär en dollar i
månaden till (se "Flödena svarar direkt"). Jobbet bygger fortfarande
Google-flödet en enda gång per körning.

☠️ **Lokalt går flödet inte att se.** Utan katalog är Google-flödet tomt, och
rutten svarar 503 som de andra flödena ("byggdes utan en enda vara"). Byggaren
är prövad mot produktionens Google-flöde utanför servern, och rutten mot
förhandsbygget, som har katalogen.

## Google-omdömena: fem nya, och namn som stod i startsidans HTML (2026-11-25)

Leonard skickade skärmbilder av profilen (4,9 av 5). Fem nya omdömen med text
står överst i `lib/curated-reviews.ts`, de tre utförligaste först, så att
sidans översta rad på datorn har tre kort av samma tyngd. Texterna är
ordagranna, också stjärnorna och tummen som kunderna själva skrev. Antalet
omdömen visas fortfarande ingenstans (`lib/social-proof.ts`).

☠️ **Startsidans kort hade listans id som React-nyckel**, och id:t är kundens
namn som slug. En nyckel på ett element i en serverkomponent följer med i
sidans React-data, så tre namn stod i startsidans HTML fast korten visar
initialer. Nyckeln är nu ett löpnummer, som på `/omdomen`.
`lib/initialer.test.ts` fäller om id:t eller namnet når startsidans kort, och
om listan får dubbletter, tomma fält eller ett datum i framtiden.

## Klarna på telefonen: kunden kom tillbaka utan godkänd betalning och fick börja om (2026-11-24)

En kund ringde Leonard: han signerade med BankID i Klarna-appen, appen bad
honom gå tillbaka till butikens webbplats, och där "avbröts det bara" så att
han fick börja om. På datorn gick samma köp igenom.

### Mätt i produktionsloggarna (2026-11-24, UTC)

| Tid | Rad | Betyder |
| --- | --- | --- |
| 14:49:28 | förbered ok, `skapaAvsikt` | ny betalning, kunden trycker "Betala med Klarna" |
| 14:50:21 | slutför `ej_betald` | kunden är tillbaka i kassan, betalningen inte godkänd |
| 14:51:32 | slutför `ej_betald` | tillbaka igen, utan nytt tryck emellan |
| 14:52:33 | förbered ok, `uppdateraAvsikt` | nytt tryck, samma betalning återanvänds |
| 14:59:00 | slutför `ej_betald` | tillbaka en tredje gång |
| 14:59:37 | förbered ok, `uppdateraAvsikt` | nytt tryck, sedan inget mer |
| 15:09:01 | förbered ok, `skapaAvsikt` | en annan webbläsare (inget sparat försök) |
| 15:10:02–08 | slutför `pagar` ×3, `ok` | köpet går igenom |

- Varje `ej_betald` kom ENSAM. En retur genom Stripe (`/kassa/klar`) ger två
  frågor inom någon sekund: retursidans, och kassans egen när kunden skickats
  dit. Kunden kom alltså tre gånger till en nyladdad `/kassa`, inte genom
  returen.
- Kassan frågade servern, fick "inte betald" och gjorde ingenting. Formuläret
  stod tomt, för uppgifterna sparas bara om kunden kryssat i "Spara mina
  uppgifter". Det är "avbröts bara" och "börja om".
- **Inte mätt då:** vad Klarna och Stripe såg. Stripe-kopplingen i Claude var
  inte inloggad, retur-rutten loggade ingenting, och Vercels förfrågningslogg
  kräver Observability Plus (avstängt). Stripes sida lästes samma kväll, se
  nästa avsnitt.

### En kund till samma kväll, och Stripes sida (läst 2026-11-24, sent)

Leonard kopplade in Stripe och pekade på en kund till, 22:05 svensk tid.
Loggen visar samma mönster: förbered 21:05:46 UTC (ny betalning), tre
ensamma `ej_betald` 21:07:24, 21:08:39 och 21:09:08, ett nytt tryck 21:10:14
på samma betalning, och sedan inget mer.

Stripe, läst med kopplingen (inga uppgifter om kunderna står här):

- **Tre betalningar står i `requires_action` med Klarna:** en från 23
  november och två från 24 november (den första kunden, som sedan köpte på
  datorn, och kvällens kund). Alla tre har adressen till Klarna i
  `next_action.redirect_to_url.url` (hos `pm-redirects.stripe.com`, som
  `fortsattAdress` släpper igenom), vår retur som `return_url`, och ett
  betalsätt som skapats flera minuter efter betalningen. Kunden har alltså
  tryckt på betalknappen igen, precis som loggen säger.
- ☠️ **Stripe stänger inte en sådan betalning efter tre timmar.** Den från
  23 november stod kvar i `requires_action` ett och ett halvt dygn senare.
  Tre timmar är kundens tid hos Klarna, inte betalningens livslängd hos
  Stripe. Därför regel 11 nedan.
- **Det är ett läckage, inte ett stopp.** Sedan 14 november har 47
  Klarna-köp gått igenom (27 från telefon, 14 från dator, 6 där Stripe inte
  vet), och 6 betalningar utan kortförsök slutade som misslyckade (4 telefon,
  2 dator). Med de tre öppna blir det ungefär fyra av fem telefonköp med
  Klarna som går hela vägen.
- **Fler den här veckan.** Stripes rapport över misslyckade försök som inte
  är kort, per vecka och med varje nytt försök räknat: veckan från 1 november
  1 (kunden avbröt), från 8 november 3 (2 nekade utan angiven orsak, 1 session
  som gick ut), från 15 november 3 (1 avbröt, 2 gick ut), och från 22 november
  7 på tre dagar (6 nekade utan angiven orsak, 1 gick ut). Black Week ger
  fler köp, så antalet säger inte att andelen har stigit.
- **Inte fastställt:** varför Klarnas flöde inte blev klart i telefonen.
  Stripe ser bara att kunden skickades till Klarna och inte kom tillbaka
  genom returen. Webbläsarens sort står i loggraderna först efter den här
  deployen (regel 9).

### Vad Stripe säger (docs.stripe.com/payments/klarna/accept-a-payment, läst 2026-11-24)

- Kunden har tre timmar på sig hos Klarna. Under tiden står betalningen i
  `requires_action`, med adressen dit i `next_action.redirect_to_url.url`.
- Faller den går den till `requires_payment_method`, med orsaken i
  `last_payment_error.code`: `payment_method_customer_decline` (kunden
  avbröt hos Klarna), `payment_method_provider_decline` (Klarna nekade),
  `payment_intent_payment_attempt_expired` (tiden gick ut) och
  `payment_method_not_available`.

### Det som var fel hos oss

1. ☠️ `slutforStripe` svarade `ej_betald` för allt som inte var godkänt,
   också en betalning som stod öppen hos Klarna.
2. ☠️ Kassan gjorde ingenting med ett sparat försök som inte var betalt, och
   prövade det bara när sidan laddades: inte när den kom tillbaka ur
   webbläsarens minne och inte när den blev synlig igen efter en annan app.
3. Loggraden sa `ej_betald` utan Stripes status, och returen loggade inget.

### Reglerna nu

1. **Öppen är inte avbruten.** `slutforStripe` (lib/kassa/flode.ts) svarar
   `vantar_kund` för `requires_action`, med `fortsatt` (Stripes adress, bara
   för en omdirigering), `metod` och `totalOre`. Ingenting låses, släpps
   eller dras. Bankens verifiering av ett kort (`use_stripe_sdk`) får ingen
   adress: den äger Stripe.js.
2. **Kassan säger det och låter kunden fortsätta samma betalning.** Rutan
   överst: "Din Klarna-betalning är inte klar. Inget har dragits. …" med
   knappen "Slutför betalningen hos Klarna" (`oppenText`). ☠️ Aldrig
   "Fortsätt till Klarna" (regeln för beställningsknappen gäller här också).
3. **Knappen finns bara när betalningen gäller summan kunden ser.** Annars
   hade kunden slutfört ett annat belopp, som servern sedan släpper
   (`pris_andrat`). Då står bara beskedet.
4. **Adressen prövas innan kunden skickas dit** (`fortsattAdress`): bara
   https hos stripe.com eller klarna.com, utan användarnamn, högst 2 000
   tecken.
5. **Det sparade försöket prövas** (`kollaSparat` i kassa.tsx,
   `sparatBeslut` i stripe-klient.ts) när korgen blir känd, när sidan kommer
   tillbaka ur webbläsarens minne (`pageshow`) och när den blir synlig igen
   (`visibilitychange`). Står betalningen öppen frågar kassan fyra gånger
   till (efter 3, 5, 8 och 12 s): har kunden godkänt i appen går köpet vidare
   till tacksidan av sig självt.
6. ☠️ **Mitt i en betalning i samma flik** (bankens verifiering, eller på
   väg till Klarna) gör kollen bara en sak: slutför det som redan är
   godkänt. Allt annat äger Stripe.js. Väntar sidan redan på ordern frågar
   ingen annan om samma betalning.
7. **Klarna nekade, eller betalningen gick ut:** kassan säger det en gång
   (`STRIPE_MEDDELANDE.nekad`, `.utgangen`), om försöket är högst 30 minuter
   gammalt, och märker det sparade försöket (`sagt`) så att beskedet inte
   står kvar vid varje omladdning. Ett nekat kort har sitt fel i betalfältet
   och får ingen orsak härifrån.
8. **Retursidan** (`/kassa/klar`) visar samma ruta om betalningen står
   öppen. ☠️ Aldrig "Betalningen är mottagen" för en betalning som inte är
   godkänd: `vantaPaOrder` slutar vänta direkt på `vantar_kund`.
9. **Loggraderna** bär Stripes läge, aldrig ett id:
   `[kassa] stripe slutför vantar_kund (requires_action/redirect_to_url)`,
   `… ej_betald (requires_payment_method/payment_method_provider_decline)`
   och `[kassa] stripe retur: succeeded` eller `failed`. Läget skickas inte
   till webbläsaren. Sist på raderna för förbered, slutför och retur står
   webbläsarens sort inom hakar (`webblasarsort`: `[ios-safari]`,
   `[ios-instagram]`, `[android-webbvy]`, `[dator-chrome]`), aldrig hela
   User-Agent: en betalning som ska fram och tillbaka mellan butiken och
   Klarnas eller bankens app beter sig olika i Safari och i en app med egen
   webbvy, och det gick inte att se i loggen 2026-11-24.
10. `hamtaAvsikt` bygger också ut `payment_method`, så att rutan säger
    "Klarna" bara när det pågående försöket är Klarna.
11. ☠️ **Rutan visas bara för ett försök som är högst tre timmar gammalt**
    (`OPPET_FORSOK_MS` i stripe-klient.ts, prövat i `sparatBeslut`). Stripe
    låter betalningen stå öppen i dagar, och kunden har tre timmar hos
    Klarna. Utan gränsen hade den som kom tillbaka dagen efter mötts av "Din
    Klarna-betalning är inte klar" och en knapp till en session som Klarna
    redan stängt.

### Prov

- `lib/kassa/stripe-flode.test.ts`: öppen betalning, bankens verifiering,
  orsakerna, loggordet. `lib/kassa/stripe-klient.test.ts`: adressen, serverns
  svar, väntan, det sparade försöket, beslutet, rutans texter, returens
  loggord, webbläsarens sort (19 riktiga User-Agent-strängar). 29 avsiktliga
  fel i reglerna fäller proven.
- **I webbläsaren** (lokalt bygge, telefonstorlek, serverns svar utbytt i
  webbläsaren, ingen betalning skapad och ingen betalknapp tryckt): rutan
  med knappen står i första skärmbilden; fem frågor på 35 s och sedan tyst;
  en ny fråga när sidan blir synlig och när den kommer ur minnet; ingen
  knapp vid annat belopp eller okänd adress; tredje svaret "ordern finns"
  tar sidan till tacksidan; "Klarna godkände inte betalningen" en gång och
  inte efter omladdning; retursidan visar rutan och aldrig "mottagen".

### Inte provat, och inte gjort

- ☠️ **Att knappen tar kunden tillbaka till SAMMA Klarna-session med
  inloggningen kvar är inte provat.** Klarnas testmiljö har ett låtsat
  BankID och ingen app, och ingen betalknapp trycks i prov. Leonard provar
  på en riktig telefon efter deployen. Fungerar inte adressen skickar Stripe
  kunden tillbaka med ett fel, och kassan säger då varför: sämst blir det som
  i dag.
- **Formulärets uppgifter** sparas inte över en omladdning utan "Spara mina
  uppgifter" (Leonards regel, "utan det sparas ingenting i webbläsaren"). Med
  knappen behöver kunden inte formuläret.
- **De tre öppna betalningarna** rör ingen kod. De står under Betalningar,
  ofullständiga, i Stripe (23 och 24 november). Två av de tre kunderna har
  inte köpt. Om någon ska höra av sig till dem är det Leonards sak.

## Bakåt landar i sökläget (Leonard 2026-11-25)

Leonard, med skärmbilder från sin iPhone: "Om jag skriver i sökfältet på något
och trycker på produkten och sen backar borde jag komma tillbaka till där jag
var sist i sökfältet inte helt annan plats, fixa det noggrant." Han hade sökt
"dörr", tryckt på en vara och gått bakåt, och stod då på en golvlampa: sidan
som låg UNDER sökläget.

Mobilens sökläge täcker skärmen men är ingen egen sida. Det var ett läge i
sökrutan, och historiken visste ingenting om det.

**Mätt** (Chromium i telefonstorlek 393 × 852, `audit/sok-atervand.cjs`,
2026-11-25): "dörr" i sökläget, listan rullad 420 px, ett tryck på en vara
och bakåt.

| | www (9c9e95b1) | grenen |
| --- | --- | --- |
| Sökläget framme efter bakåt | nej, sidan under med tomt fält | ja, "dörr" och 12 kort |
| Bildrutor efter bakåt utan sökläge (av 40) | 40 | 0 |
| Kortet överst i listan | finns inte | samma kort på samma pixel (222 mot 222) |
| Listan rullad | finns inte | 420 px, från första bildrutan |
| Fältet har fokus (tangentbordet upp) | nej | nej |

### Så fungerar det

`lib/sok-atervand.ts` och `components/searchbox.tsx`.

1. **Märket skrivs i trycket.** `ga(href)` anropar `markUt(href)` före
   sidbytet: ordet i fältet och hur långt listan var rullad läggs i
   historikpostens eget tillstånd (`history.state.__fpSok`), bredvid Nexts
   nycklar. Bara i mobilens sökläge, och inte när varan är sidan man redan
   står på. Varor, kategorirader och kategorichips går alla genom `ga`.
2. ☠️ **`history.state`, inte sessionStorage med adressen.** Märket hör till
   POSTEN: samma adress kan stå flera gånger i historiken, och bara den post
   kunden lämnade genom sökläget ska öppna det. Webbläsaren sparar tillståndet
   med posten, också över en hel sidladdning.
3. ☠️ **Next skriver om postens tillstånd vid ett sidbyte** och tar då bara med
   sina egna nycklar (`HistoryUpdater`). Märket skrivs därför omedelbart före
   `router.push`: Next lägger sedan en NY post och rör inte den gamla. Vid ett
   steg i historiken behåller Next det som står i tillståndet
   (`preserveCustomHistoryState`). Mätt med alla skrivningar loggade: märket
   står kvar i posten efter bakåt.
4. **Ett steg i historiken till en post med märket öppnar sökläget**
   (`aterstall`). Står listan för ordet kvar i rutan (`rankadFor`) visas den
   som den var, i samma rendering. Har rutan använts till ett annat ord, eller
   har sidan laddats om, räknas listan om och kortens platser visas under
   tiden. Platsen i listan sätts i en `useLayoutEffect`, före första
   ritningen.
5. **Fältet får inget fokus.** Kunden lämnade sökläget med ett tryck på en
   vara, och då var tangentbordet fällt.
6. ☠️ **Sökläget stängs på sidan man står på: märket tas bort** (städningen i
   effekten som sätter `data-sok-lage`). Stäng, Esc och allt annat: ett senare
   bakåtsteg hit öppnar inget. Undantaget är märket som skrevs i samma tryck
   som lämnar sidan (`lamnadMed`).
7. **Resultatsidan är sökningen i sin helhet.** "Visa alla" och Enter
   (`goSearch`) skriver inget märke och tar bort ett gammalt: bakåt från
   `/sok` visar sidan under, som förut.
8. **Märket gäller en halvtimme** (`SOKMARKE_MAX_MS`, samma som listans läge),
   bara rutan i mobilens sökrad och bara i telefonbredd. På datorn är
   förslagen en lista under rutan: där skrivs inget märke.
9. **Ett dokument som laddats med bakåt** (fliken hade lämnat minnet) öppnar
   också sökläget: tillståndet följer posten. En omladdning tar bort märket.

### ☠️ Lyssnaren på popstate togs bort innan den hann köras

Första versionen fungerade inte i bygget, och felet fanns redan på www.
Sökrutans `popstate`-lyssnare satt i effekten som följer sidans adress och
byttes ut vid varje sidbyte. Efter första sidbytet stod den därför EFTER Nexts
egen lyssnare. React ritar ett steg i historiken direkt, mellan två lyssnare
(mikrouppgiften körs när den första lyssnaren är klar): sökrutans effekt
städades, lyssnaren togs bort innan den körts, och den nya gäller inte
händelsen som pågår. Mätt i bygget med loggrader: `aterstall` anropades aldrig.

Samma fel gällde regeln "bakåt och framåt stänger panelen". Mätt på www
(`audit/bakat-oppet.cjs`): två sidbyten, sökläget öppet med "stol", bakåt.
Sökläget stod kvar med tolv kort över sidan man kom till, och sidan var låst.
På grenen stängs det.

**Regeln:** lyssnaren läggs en gång (`[helskarm]`) och läser allt ur
referenser (`aterstallRef`, `inputRef`). `lib/sok-atervand.test.ts` fäller om
en `popstate`-lyssnare hänger på `pathname` igen.

☠️ **En lyssnare på `popstate` som läggs om när sidan byts körs inte för steget
som byter sida.** Det gäller varje komponent i sidhuvudet, inte bara sökrutan.

### Prov

- `lib/sok-atervand.test.ts`: märket (8 prov) och sökrutans regler (9 prov).
  `lib/sok-lage.test.ts` och `lib/sok-2026-11-19.test.ts` följer med i de
  rader som ändrats. 20 avsiktliga fel i sökrutan och märket fäller proven.
- **I webbläsaren** (`audit/sok-atervand.cjs` mot det lokala bygget, 32
  kontroller): varan och bakåt; Stäng och sedan en länk bort och bakåt (inget
  sökläge); en andra vara ur det tillbakaställda sökläget (den nya platsen);
  framåt och bakåt igen; kategorichipset; "Visa alla" och bakåt (sidan under);
  det tomma fältets populära produkter; ett annat ord sökt på varans sida
  under tiden (listan räknas om för rätt ord); två steg bakåt; bakåt med
  sökläget öppet; fliken omladdad på varans sida; ett dokument laddat med
  bakåt; omladdning (märket borta); datorn (ingen lista, inget märke). Inga
  sidfel.
- Söklägets äldre 62 och 9 kontroller och de tio i
  `audit/bakat-annan-vag.cjs` är gröna mot samma bygge.

### Inte provat, och inte gjort

- ☠️ **Safari på en riktig iPhone.** Svepet från skärmens kant visar en bild av
  sidan som den såg ut när den lämnades, alltså sökläget med det tryckta
  kortet, och släpper sedan fram sidan. Att sökläget då står där utan hopp är
  rimligt men inte mätt: Chromium har inget sådant svep. Leonard ser det efter
  deployen.
- **En hel sidladdning ur sökläget** (Next faller tillbaka på det efter en ny
  deploy) och bakåt ur webbläsarens minne: sidan kommer tillbaka som den
  lämnades, Next ställer om sig, och sökläget stängs som förut.
- **Bakåt från resultatsidan** öppnar inte sökläget. Det är ett val: sidan
  visar samma träffar och fler. Vill Leonard ha det andra är det en rad i
  `goSearch`.

## Listornas bilder finns bara nära fönstret (Leonard 2026-11-25)

Leonard: "när man scrollar i alla produkter sidan och backar och går in i nya
produkter o backar craschar det tillslut och man hamnar på sidan jag skicka
till dig." Skärmbilden (00:26 natten mot 2026-11-25) var Safaris egen:
"Ett problem inträffade flera gånger på
https://www.fyndplats.se/alla-produkter?sortera=new". Safari visar den när
fliken dött, laddats om och dött igen.

### Vad som mättes

Chromium i telefonstorlek (393 × 852, tre pixlar per punkt) mot www,
2026-11-25. Åtta varv: "Visa fler" två gånger, rulla till listans slut, in på
en vara, bakåt (`audit/lista-minne.cjs`).

| Efter åtta varv, 408 kort | www | grenen |
| --- | --- | --- |
| Bildelement i sidan | 426 | 52 |
| Element i sidan | 11 732 | 6 738 |
| JavaScript-minne | 57 MB | 23 MB |
| DOM-noder i minnet, med skräp som väntar | 47 899 | 11 690 |
| Lyssnare | 15 498 | 2 850 |
| Flikens minne (började på 295 och 272 MB) | 924 MB | 766 MB |
| Flikens minne efter varv fyra till åtta (MB) | 806, 809, 853, 860, 924 | 758, 771, 735, 736, 766 |

Listan växer med 24 kort per "Visa fler" och krymper aldrig, och bakåt från en
vara ritar upp alla korten igen (`lib/sidminne.ts`). Varje kort bar sin bild,
hämtad direkt (`bilderDirekt`), och en egen rad att svepa i
(`.pimg-track-swipe`: en rullande yta per kort), hur långt från skärmen det än
stod. Efter en krasch laddar Safari om sidan, listan ställde tillbaka alla
korten med alla bilder på en gång (`laddadesOm`), och fliken dog igen: därav
"flera gånger".

Samma lista utan besök på varor (16 "Visa fler", `audit/lang-lista.cjs`): 426
bildelement och 408 rullande ytor på www, 70 och 52 på grenen.

☠️ **Det som INTE är mätt: Safaris minne, och själva kraschen.** Chromium dog
aldrig, och dess eget minne skiljer bara 6–17 % mellan www och grenen: de stora
skillnaderna är antalen. Vad en bild och en rullande yta kostar i Safari på en
iPhone går inte att mäta här. Slutsatsen att det var korten långt från skärmen
som fällde fliken bygger på vad som växte med listan, inte på en återskapad
krasch. Kvittot är Leonards telefon.

Ingen läcka hittades: med 24 kort och tio varv in på en vara och bakåt stod
DOM-noderna (4 197) och lyssnarna (1 101) stilla efter skräpsamling.

### Rättelsen

`components/kort-bildfonster.tsx` och `lib/bildfonster.ts`.

1. **Ett kort i en lista som växer bär sina bilder bara inom 4 000 px från
   fönstret** (`BILDFONSTER_PX`, drygt fyra telefonskärmar åt varje håll).
   Längre bort står kortet kvar med namn, betyg och pris, men utan
   `CardGallery`: ingen bild, ingen rullande yta, inga prickar.
2. ☠️ **Bildrutan behåller sin höjd** (`.prod .pimg` har `aspect-ratio`, med
   reserven för Safari före 15). Sidan flyttar sig inte en pixel när bilderna
   kommer och går. Mätt: 38 331 px före och efter, och kort 31 på samma y.
3. **EN bevakare för alla kort** (`IntersectionObserver` med fönstret som
   marginal), ingen lyssnare på rullningen. Ytan den bevakar är `.pimg-vakt`,
   som alltid står kvar i bildrutan. Utan `IntersectionObserver` bär korten
   sina bilder som förut.
4. **Kortet börjar med sina bilder** (`naraForst`) där kunden står: sidans
   första kort och en ny omgång "Visa fler". Mätt: de 24 nya korten ritas med
   bild i samma bildruta som förut.
5. ☠️ **En lång lista som ställs tillbaka** (bakåt eller omladdning) låter bara
   korten runt det sparade kortet börja med bilder: 24 åt varje håll
   (`borjarMedBilder`, `BILDER_RUNT_ANKARET`). Sidans egna 24 kort hinner
   ritas med bild en bildruta innan läget ställs tillbaka. Mätt med 240 kort:
   73 kort med bilder i första bildrutan, 58 därefter, alla sex i fönstret med
   bild; en omladdning hämtade 119 bilder i stället för en per kort.
   Läget gäller bara listan det sparades för (`listNyckel`): efter en ny
   sortering eller ett filter börjar korten med sina bilder.
6. **Listsidorna och prissidornas "Visa fler"** (`components/shopbrowser.tsx`,
   `components/pris-fler.tsx`) använder fönstret. Startsidan, raderna på
   produktsidan och de andra korten bär alltid sina bilder: de listorna växer
   inte.
7. **Servern ritar bilderna som förut**: 24 kort, 24 huvudbilder i sidans HTML.

### Prov

- `lib/bildfonster.test.ts`: regeln för vilka kort som börjar med bilder (8
  prov) och det som inte får glida isär i komponenterna (9 prov).
  `lib/kortprioritet.test.ts` följer med. 16 avsiktliga fel i fönstret och
  listan fäller proven.
- **I webbläsaren** (`audit/lista-fonster.cjs` mot det lokala bygget, 27
  kontroller): serverns HTML; första sidan; "Visa fler"; 240 kort med 28
  bärande bilder vid listans slut; sidan lika hög; hopp till toppen (sex av
  sex kort utan bild i första bildrutan, noll av sex efter 50 ms); bakåt från
  en vara (samma 240 kort, samma kort på samma pixel); "Visa fler" efter
  bakåt; omladdning djupt i listan; `/under-500-kr`; datorn i 1 440 px. Inga
  sidfel.
- `audit/lista-bilder.cjs` (bilderna vid snabb bläddring) och
  `audit/bakat-annan-vag.cjs` (bakåt på tio vägar) ger samma svar som före
  ändringen.

### Inte provat, och inte gjort

- ☠️ **Kraschen på en riktig iPhone**, se ovan.
- **Ett hopp över hela listan** (trycket på telefonens statusrad) visar korten
  utan bild i en till tre bildrutor innan bevakaren svarat. Bilderna ligger i
  webbläsarens cache och är framme inom 50 ms i provet.
- **Ett kort som svepts till sin tredje bild** börjar om på den första när det
  varit långt från fönstret.
- **Korten själva tas inte bort.** Ett kort utan bilder är 11 element med text
  (25 med bilder). Tusen kort är 11 000 element, och det har inte fällt någon
  flik i proven.
  Blir listorna mycket längre är nästa steg att också byta korten långt bort
  mot tomma ytor med samma höjd.
- **Produktsidan** mättes inte för sig. Varje besök hämtar stora bilder, och
  Chromium släpper dem när sidan lämnas.

## Vit bakgrund bakom varje bild, och /butiks register som rader (Leonard 2026-11-25)

Leonard, med tre foton av /butik på datorn och en skärmbild av telefonens meny:
"Det är inte vit bakgrund överallt på produkt och kategori bilder, jag vill att
det ska vara det och startsidan på datorn ser inte alls premium ut och matchar
inte startsidan på telefon, fixa så hela undre delen också är 10/10 design och
optimerad". Fotona visade "Populärt just nu" med beige plattor, registret "Alla
kategorier" som fyra spalter text, och mobilmenyns miniatyrer på beige rutor.
☠️ Sidan på fotona är /butik, fast han säger startsidan. Båda sidorna är
ändrade.

### Vit platta, överallt

Kartlagt på www samma dag, i varje bild frågat vad som står bakom den
(`audit/vita-plattor.cjs`): en varm platta med fotot blandat mot den
(`mix-blend-mode:multiply`) stod kvar på sju slags ytor. Alla är vita nu.

| Yta | Förut | Nu |
|---|---|---|
| Produktkortet på datorns startsida, /butik och prissidornas översikt | `#F4EEE8`, multiply, ingen ram | vit, tunn ram (`var(--line)`), som listorna |
| Avdelningsrutorna på startsidan och /butik (`.kat-bild`, `.b2-avd-bild`) | `#F4EEE8`, multiply | vit, fotot som det är |
| Miniatyrerna i datorns och mobilens meny och i prissidornas register (`.mn-bild`) | `#F4EEE6`, multiply | vit, tunn ram |
| Menyns stora ruta för en avdelning utan stämningsbild (`.meganav-feature-produkt`) | `#F3ECE4`, multiply | vit, tunn ram |
| Favoritlådans rader (`.fav-bild`) | `var(--surface-2)`, multiply | vit, tunn ram |

- **Kortets platta är vit i grunden** (`.prod .pimg` i `app/globals.css`), utan
  blandningsläge. Datorn (från 881 px) lägger bara till ramen. Undantaget
  `:is(.hem2,.butik2)` och mobilens eget block är borta: kortet har en
  uppsättning regler, på varje sida.
- **Stämningsbilderna blev en ton mörkare av blandningen.** De ligger kant i
  kant i rutan, så plattan syntes aldrig, men multiply mot en varm platta
  färgade hela fotot. Nu ritas de som de är.
- **En avdelning utan stämningsbild visar en vara.** Ingen avdelning är utan
  i dag (se "Stämningsfoto på de tre sista avdelningarna" nedan), så regeln
  gäller en ny avdelning tills den har fått sitt foto.
  Rutan bär då `.kat-produkt` eller `.b2-avd-produkt` och får en tunn ram:
  varans vita botten går ihop med den vita sidan, och utan ram syns rutan
  inte. Bilden är densamma som förut, i rutans form. ☠️ Ett första försök
  hämtade varan kvadratisk och visade den hel (`object-fit:contain`): varan
  blev en fjärdedel mindre än grannrutornas foton och rutan såg tom ut.
- ☠️ **Rutan "Hela sortimentet" bär också `.b2-avd-bild`.** Dess mörka botten
  (`.b2-alla-yta`) har samma vikt som rutans vita och vinner för att den står
  sist. I ett första prov med den vita regeln sist blev rutan vit med vit text.
- ☠️ **Hjältens fyra brickor är undantaget, med flit.** De har kvar studions
  ljusa ton (`--studio-bricka`, nästan vit upptill och varmare nedtill) och
  multiply, som Leonard valde 2026-11-17. Vill han ha dem helvita är det en
  rad: `--studio-bricka` i `app/globals.css` och i `app/sasongstema.css`.
- Ytor där bilden täcker sin ruta helt (produktsidans galleri, sökrutans
  förslag, varukorgen, bloggens omslag) har kvar en varmgrå botten som bara
  syns medan bilden laddar.

Mätt i Chromium, 1 440 och 393 px, www mot det lokala produktionsbygget.
Skärmbilden läses av i åtta punkter längs varje plattas kant, och en platta
räknas som varm när minst tre har plattans ton:

| Yta | www | bygget |
|---|---|---|
| Datorn: startsidans kort, /butiks kort, prissidans kort | 8 av 8 varma, på var och en | 0 av 8 |
| Datorn: prissidans miniatyrer | 10 av 10 | 0 av 10 |
| Datorn: menyn Möbler | 7 av 12 | 0 av 12 |
| Datorn: menyns stora ruta (Bil), favoritlådan | 1 av 1, 3 av 3 | 0 |
| Telefonen: menyns avdelningar, menyn Möbler | 8 av 8, 5 av 8 | 0 |

Bilder med blandningsläge: datorns startsida 23 → 4 (hjältens brickor), /butik
19 → 0; telefonen 28 → 4 och 24 → 0.

☠️ **En enstaka varm pixel är varans egen färg.** Första versionen av provet
fällde på en pixel av 96: en gungstols träben (240, 238, 227) och en
rumsavdelare som fyller hela miniatyren. Därför räknas plattor, inte pixlar.

### /butiks register: en rad per avdelning

På datorn var "Alla kategorier" fyra spalter text, 2 006 px högt (www, 1 440
px): Möbler ensamt 30 rader, sista spalten nästan tom. På telefonen var samma
register redan en rad per avdelning med kategorierna som knappar.

Nu har datorn samma form (`.b2-rader`, från 881 px): avdelningens namn och
antal till vänster, kategorierna som knappar till höger, och "Alla N" som
fäller ut resten. Raden visar så många knappar som ryms på en rad.

- **Störst först** (`lib/register-rader.ts`, `storstForst`), på båda skärmarna:
  bara de första syns utan att kunden gör något, och då ska det vara de
  kategorier flest letar efter. Lika stora i svensk bokstavsordning. Menyerna
  har kvar sin egen ordning (`MAIN_GROUPS`).
- **Alla länkarna står kvar i sidans HTML**, lika många som hjälten säger (149
  i provet). Raden klipps i stilen, inte i markupen.
- **Knappen är en kryssruta** (`.b2-vaxla`) med etiketten som synlig yta
  (`.b2-fler`): inget skript, och webbläsaren minns läget. Mätt: Möbler utfälld,
  ett klick på radens sista kategori och bakåt gav samma rad utfälld (357 px)
  på samma plats i sidan.
- **En avdelning med fem kategorier eller färre** har ingen knapp och visas
  hel (`RAD_UTAN_KNAPP`).
- ☠️ **Det klippta går att nå med tangentbordet.** Utan åtgärd rullade
  webbläsaren den klippta rutan för att visa länken i fokus, och första raden
  försvann. Raden fälls därför ut när fokus står i den
  (`:has(a:focus-visible)`), och klipps BARA i en webbläsare som kan `:has`.
  Safari före 15.4 och Firefox före 121 visar alla knappar och ingen "Alla N".
- ☠️ **Listan har 6 px luft och lika mycket marginal ut.** Den klipper, och
  utan luften kapades knapparnas fokusring (2 px ring, 2 px avstånd).
- **Prissidornas register är orört** (få kategorier, en miniatyr per rad). De
  delar `.b2-register` med /butik men bär inte `.b2-rader`.

Mätt i det lokala produktionsbygget: registret 2 006 → 1 082 px vid 1 440 px
(1 039 vid 881, 1 044 vid 1 024), hela /butik 5 323 → 4 381 px. Telefonens
register är 1 257 px, som förut.

### Stämningsfoto på de tre sista avdelningarna

Leonard samma dag, när han fått se att Bil & Garage visade en vara: "ändra så
de har stämingsfoto". Tre avdelningar saknade nyckel i `CATEGORY_HERO_IMAGES`
(`lib/category-groups.ts`): Bil & Garage, Bygg & Renovering och Företag &
Proffs. De visade en vara i menyns stora ruta, ingen banderoll i mobilmenyn och
en produktbild överst på sin kategorisida; Bil & Garage också i rutan på
startsidan och /butik.

| Avdelning | Foto | Id |
|---|---|---|
| Bil & Garage | mutterdragare med hylsa på en hjulmutter, lättmetallfälg i dagsljus | `1593699199342-59b40e08f0ac` |
| Bygg & Renovering | roller som målar en vit vägg blå | `1562259949-e8e7689d7828` |
| Företag & Proffs | kock som lägger upp på vita tallrikar: händer, vit rock, svart förkläde | `1577106263724-2c8e03bfe9cf` |

- **Granskade i bild, ett och ett**, på exakt den adress `UNSPLASH()` bygger
  (1 600 × 1 280): äkta foto, inga läsbara varumärken, inget ansikte.
  Mutterdragarens präglade märke och rollerskaftets etikett är förstorade ur
  originalet i 2 400 px och går inte att läsa.
- **Sedda i butikens fyra utsnitt.** Varje yta klipper mitt ur ORIGINALET,
  inte ur 5:4-bilden: rutan 4:3 (`unsplashIForm`), kategorisidan 5:4,
  datorns meny 4:5 och mobilmenyns banderoll 12:5 (`hjalteAdress`). Ett foto
  med motivet i ett hörn klarar inte alla fyra. De här tre har det i mitten.
- ☠️ **unsplash.com går inte att öppna från byggmiljön** (robotspärr, och den
  ska inte kringgås). Kandidaterna är därför prövade direkt mot
  `images.unsplash.com`: cirka 300 id, sedda som kontaktark. Fotosidorna är
  inte lästa. Adresser som börjar `photo-` på den värden är Unsplashs fria
  bilder; betalbilderna (Unsplash+) heter `premium_photo-` och ligger på
  `plus.unsplash.com`, och går inte att skriva med `UNSPLASH()`.
- ☠️ **Unsplashs licens täcker inte varumärken och igenkännbara personer i
  bilden.** Därför föll de annars bästa kandidaterna: en verkstad med
  märkesskylt på bilen och däckmärket läsbart, en verktygsvägg med
  sprejburkens märke i förgrunden, en kapsåg och en borrmaskin med
  tillverkarens namn, en rörvägg med skylt på polska, ett restaurangkök med
  grossistens namn på kartongerna, och en uppläggning där kockens ansikte
  syntes i menyns stående utsnitt (i 4:3 och 5:4 var det bortklippt).
- **`KATEGORI_HERO_PRODUKT["bil-garage"]` är borttagen.** Kategorisidan tar
  fotot först, så raden lästes aldrig längre.
- `lib/meny-bild-val.ts` har kvar sina val för de tre avdelningarna: de är
  miniatyren på avdelningens rad i mobilmenyn, och menyns reserv om fotot
  skulle saknas.

Provet `lib/stamningsfoto.test.ts` (10 prov) fäller om en avdelning i
`AVDELNINGSORDNING` saknar foto, om två avdelningar delar foto, om ett foto inte
går att klippa till menyns former och om en avdelning med foto får en rad i
`KATEGORI_HERO_PRODUKT`.

### Proven

- `lib/vit-platta.test.ts` (14 prov) och `lib/register-rader.test.ts` (19).
  `lib/produktkortet.test.ts`, `lib/butiksidan.test.ts`,
  `lib/startsida.test.ts`, `lib/mobil-finslip.test.ts` och
  `lib/audit-2026-11-11.test.ts` följer med. 50 avsiktliga fel i stilen,
  markupen och regeln fäller proven, alla 50.
- **I webbläsaren** mot det lokala produktionsbygget:
  `audit/vita-plattor.cjs` (30 kontroller: beräknad stil och pixlar på 15
  ytor) och `audit/register-rader.cjs` (27: raderna, klicket, tangentbordet,
  fokusringen, 881 till 1 920 px utan sidrullning, och telefonen orörd).
- axe (WCAG 2.1 A och AA) på startsidan, /butik med en rad utfälld,
  /under-500-kr, menyerna och favoritlådan i 1 440, 1 024 och 393 px: inga fel
  på de ändrade sidorna. Med mobilmenyn öppen anmärker axe på kortens
  bildrader under menyn (`scrollable-region-focusable`, 8 element); samma
  anmärkning finns på www före ändringen.
- `audit/sok-atervand.cjs` och `audit/lista-fonster.cjs` ger samma svar som
  före ändringen.

### Inte provat, och inte gjort

- **Safari**, på iPhone och Mac. Allt ovan är Chromium. Blandningsläget var
  det som skilde webbläsarna åt (2026-11-20), och det är borta nu.
- **En webbläsare utan `:has`** är inte körd: reserven (alla knappar, ingen
  "Alla N") är läst ur stilen, inte sedd.
- **Startsidans undre del på datorn** fick de vita plattorna och fotona utan
  toning, inget mer: kategorierna, veckans fynd, köpguiderna och omdömena har
  samma form som förut.
