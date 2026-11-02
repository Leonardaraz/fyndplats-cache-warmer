### Städningen av det som blev kvar

#### ☠️ Bildstädningen är avstängd helt (Leonard 2026-10-23 och 2026-10-30)

Leonard 2026-10-23: *"Jag vill att du stänger av den automatiska bildstäden vi
har, jag misstänker att den tar bort bilder vi använder ibland"*. Cronen
`/api/cron/aosom-media-cleanup?dryRun=false&limit=2000` (`50 3 * * *`) togs
bort ur `vercel.json`.

Leonard 2026-10-30: *"Vi behöver inte bildstädningen längre då vi har oändligt
med minne så den kan sluta helt"*. Sedan dess raderar rutten ingenting: en
skarp körning (`dryRun=false`) svarar 410 innan något läses. Läget `radera` i
`bildstadning.yml` och läget `bildstadning` i import-workflowen är borttagna.
Torrkörningen finns kvar och raderar ingenting.

Samma dag som avstängningen 2026-10-23 svarade 334 kundfoton på 268
recensioner 403. Städningen raderade dem i september, när skyddslistan
stannade vid 5 000 recensionsrader (#685), och de vars originalfoton saknades
i rådatan har aldrig återställts.

Vad avstängningen betyder:

- Ingenting raderas ur Media Manager, varken av sig självt eller för hand.
  Bildkandidater som ingen valde, gamla filer efter en bildfix, utsnitt som
  inte användes och bilderna från raderade utkast (pensionerade, VEVOR) blir
  kvar. Lagringen räcker.
- Avsnitten nedan och om bildkandidater, miljöbilden, färgtilläggen och
  pensionerade utkast säger att det ingen väljer städas bort efter tre dygns
  karens, eller att filerna tas av bildstädningen. Det gäller inte längre:
  karenstiden är ingen tidsgräns, och filerna ligger kvar.
- Koden för städningen, läsarna och karenstabellen ligger kvar som den är.
  Att slå på den igen kräver att spärren i rutten tas bort, och Leonards ja.

#### Bildfixen lämnade dessutom sina egna kopior

Fjärde bildfix-körningen dog mitt i: **Wix-lagringen tog slut.**

Orsaken står i `image-repair.ts` egen designkommentar. Den laddar upp ALLA fem
bilderna på nytt för varje produkt den lagar och ersätter medialistan — och de
gamla filerna blir kvar. Kommentaren sa att det "kostar några hundra extra
uppladdningar totalt"; den skrevs när katalogen var 744 produkter och EN körning
var planerad. Verkligheten blev fyra körningar mot en katalog som växte till
2 712 produkter, och varje lagad produkt lämnar fem filer à drygt en megabyte.

`/api/cron/aosom-media-cleanup` (`lib/aosom/media-cleanup.ts`) raderar
Aosom-bilder som ingen produkt använder. Den gick varje natt kl. 03:50 UTC fram
till 2026-10-23 och är nu avstängd, se avsnittet ovan. Tre egenskaper som inte
ska tas bort:

1. ☠️ **Massfel-spärren kastar.** Är referenslistan mindre än en halv bild per
   läst produkt är det ett LÄSFEL, inte en tom katalog — och en körning hade
   raderat hela butikens bildbank permanent. Samma tanke som `MIN_FEED_RADER`.
2. **Bara filer VÅR kod skapat**, avgjort på `sourceUrl` — inte på namnet.
   `addedBy` duger inte: vår API-nyckel agerar som sajtägaren, så en bild Leonard
   dragit in i editorn ser identisk ut. Men en importerad fil bär adressen den
   hämtades från (leverantörernas CDN), och Wix egna kopior bär en
   wixstatic-adress som pekar tillbaka på en av våra. **En handuppladdad bild har
   ingen `sourceUrl` alls** och kan därför aldrig komma i fråga — det är skyddet
   för logotyper, banners och kategoribilder, som inte syns i något API vi kan
   lista och därför måste undantas på egenskap i stället för på uppräkning.
   Referenslistan byggs ur HELA katalogen, inte bara Aosom-delen.
3. **`permanent: true`.** Papperskorgen räknas fortfarande mot lagringen, så en
   vanlig radering frigör ingenting alls.

Städningen är avsiktligt en SEPARAT körning och inte inbakad i reparationen: en
radering inne i reparationen hade skett innan skrivningen verifierats, och en
produkt vars nya bilder inte fastnade hade då förlorat även de gamla.

#### Bara det som saknas laddas om (byggt 2026-08-28)

Reparationen laddade tidigare om alla fem bilderna per produkt, eftersom en
wixstatic-adress inte avslöjar vilken källbild den kom från. Det var orsaken
till hela incidenten ovan. Kopplingen finns nu i stället för att gissas, från
två håll:

- **`aosomBildFiler` på mappningen** — källbild → Wix-fil-id, sparat efter varje
  VERIFIERAD skrivning. Sparas det före, eller efter en skrivning som inte tog,
  pekar det på filer som inte sitter på produkten.
- **Wix egen `sourceUrl`** (`getMediaSourceUrls`, `POST /files/get-files`) för
  allt som importerades innan fältet fanns. Ett anrop per produkt, och bara en
  gång. ☠️ Den följer ETT hopp extra: en fil Wix omimporterat bär vår fils
  wixstatic-adress, inte leverantörens — och de produkter som ska lagas
  importerades medan omimport-buggen levde, så många pekar just på kopior.

Med kopplingen känd behålls det som redan sitter rätt **vid sitt id** och bara
luckorna fylls. Då uppstår inga föräldralösa alls.

☠️ **Går kopplingen inte att härleda laddas allt om, som förr.** Det är med
flit: vet vi inte vad produkten har kan en påfyllning ge samma bild två gånger
på en kundsida, och en dubblett är värre än en extra uppladdning. `fullOmladdning`
i svaret räknar dem, och talet ska sjunka mot noll.

#### ☠️ Städningen raderade kundernas recensionsbilder (2026-09-04)

Leonards rapport: *"mina produkt recensioner hade bilder förut men inte längre"*.
Uppmätt direkt: **68 av 68 recensionsbilder över fyra produkter svarar 403** —
alla raderade. Datan är intakt, adresserna står kvar i recensionsraderna; det är
filerna som är borta.

Mekanismen är städningens egen referenslista. `listaAnvanda` går igenom
`stores/v3/products/search` och samlar **bara produktmedia** — men en
recensionsbild sitter inte på en produkt, den sitter på en RECENSIONSRAD. Och
eftersom vår kod importerade den från `aliexpress-media.com` bär den en
`sourceUrl` och passerar därmed "vår kod skapade den"-filtret. Föräldralös
enligt planen, `permanent: true`, varje natt sedan cronen schemalades.

Samma dygn, samma orsak, annan skada: fyra **bloggomslag** dog likadant. De
plockas ur produktbilder (`blog-image-picker.mjs`) och bor i markdown i
butiksrepot — ännu mer osynliga för listan. De är självhostade i `/public` nu.

**Fixen är att referenslistan bär recensionsbilderna** (`listaRecensionsbilder`
i deps, både `imageUrl` och `imageUrls`). Två saker att inte röra:

1. ☠️ **Depen är OBLIGATORISK, inte valfri.** En valfri dep kan glömmas av
   nästa anropare, och då börjar raderingen om. Testhjälparen fick följa med
   i stället för att typen mjukades upp.
2. ☠️ **Ett LÄSFEL mot recensionslagret FÄLLER körningen.** Fortsätter den med
   tom lista ser varenda recensionsbild föräldralös ut och raderas permanent —
   exakt skadan fixen finns för. Samma form som `MIN_FEED_RADER`: när ett
   läsfel och ett tomt svar ser likadana ut, och det ena utfallet är
   oåterkalleligt, är avbrott enda säkra svaret. En katalog som HAR noll
   recensionsbilder går däremot igenom — det är felet vi vägrar tolka, inte
   tomheten.

**Regeln, tredje gången huset skriver ned den:** en referenslista är klar först
när ALLA läsare finns med i den. Migreringen lärde sig det om läsare som blev
TOMMA (`/api/tracking-events`) och om en SKRIVARE i ett annat repo
(`/api/omdome`). Det här är samma sak en tredje gång, och den dyraste: en
läsare som bor i en annan tabell syns inte i koden intill, och priset var
kundernas egna foton.

⚠️ **Två läsare till fattades, och de hittades 2026-09-28 inför raderingen av
pensionerade utkast.** Kategoribilderna stod inte i listan, och inte heller valens
kopplade bilder (`linkedMedia`). En kategoribild som är en produkts fil skyddades
bara av produkten, och raderas produkten hade städningen tagit den. Kategoribilderna
är nu en obligatorisk dep (`listaKategoribilder`, ett läsfel fäller körningen), och
vilka filer en produkt använder avgörs på ett ställe, `lib/wix/produkt-media.ts`,
som både städningen och raderingen läser.

⚠️ **Bilderna är inte återställda av fixen.** Den stoppar blödningen. Källan
finns hos AliExpress — recensionerna går att hämta om (`fetchAeReviews`, $0) —
men `repairImages` letar bara efter rader som FORTFARANDE bär en
leverantörs-URL, och de här bär en död wixstatic-adress. Återställning är ett
eget jobb.

#### ☠️ 260 recensioner hade döda foton igen (2026-10-06)

Leonards rapport: hörnskrivbordets recension hade en bild som inte syntes.
Uppmätt på alla publicerade rader via `/api/reviews/<id>`: **2 418 recensioner
med foto, 315 av 3 592 adresser svarade 403**, fördelade på 260 recensioner och
165 produkter (127 AliExpress, 133 Aosom). Butiken döljer en trasig bild
(`onError` i `ProductReviews.tsx`), så kunden såg ingen tom ruta, bara inget foto.

Två orsaker i AliExpress-återställningen (`/api/cron/review-image-restore`):

1. ☠️ **Ommappningen tar bort AE-id:t.** `tillämpaOmmappning` byter
   `supplierProductId` till Aosom, och återställningen räknade produktens
   AE-recensioner som `utanAEMappning`. Hörnskrivbordet `c342826f` var ett av
   dem. AE-synkens tillstånd sparas per Wix-produkt och överlever bytet, så
   id:t läses nu därifrån (`aeIdUrSynken`, räknaren `viaSynkensMinne`).
2. ☠️ **Import File skrev adressen innan Wix hämtat filen.** Slutade hämtningen
   FAILED stod en död adress kvar. Återställningen går nu samma väg som
   Aosom-återställningen: hämta bytena, ladda upp med rätt typ, skriv adressen
   först vid READY (`lib/wix/bekraftad-bild.ts`, delad mellan båda rutterna).

⚠️ Den vanliga publiceringsvägen (`withOwnImage` → `importImageToOwnMedia`)
använder fortfarande Import File utan att vänta. Nya AE-foton kan alltså dö på
samma sätt; en körning av `review-image-restore.yml` fångar dem.

Aosom-raderna kräver källfotona från Aosoms recensionsdata, som bara går att
hämta i Leonards webbläsare (se *Omgång 5*), och körs med
`aosom-review-image-restore.yml`.

#### ☠️ Bloggen, reservkatalogen och ordrarna stod inte i listan (2026-10-14)

Leonards fråga: radera alla bilder som inte används till något, varken
produkter, blogginlägg, recensioner eller annat. Biblioteket hade **44 082
filer** (alla bilder utom en svg), papperskorgen var tom. En torrkörning av
den befintliga städningen gav **2 657 oanvända filer, 2,6 GB**.

Den torrkörningen gick inte att lita på, för referenslistan saknade två läsare
till:

| läsare | id | källor, uppmätt i biblioteket |
|---|--:|---|
| butikens blogg (`content/blog/*.md`) | 215 | 61 Aosom-importer, 122 med Wix-källa, 9 kort |
| reservkatalogen (`products.json`) | 2 399 | stickprov 40: 11 med Wix-källa |
| variantbilderna (`data/variant-images.json`) | 749 | stickprov 30: alla AE-importer |
| ordrarnas varubilder (90 ordrar) | 83 | 25 Aosom-importer, 41 med Wix-källa, 6 kort |

Ingen av dem behöver sitta på en produkt. En bloggbild vars produkt fått nya
bilder, eller en vara vars order kunden fortfarande läser, hade raderats.

Två nya obligatoriska deps i `lib/aosom/media-cleanup.ts`, med samma hållning
som recensionerna: ett läsfel fäller körningen.

1. ☠️ **`listaButikensBilder`** läser butikens `/api/media-referenser`
   (`lib/wix/butikens-media.ts`). Butiken bygger listan vid varje deploy ur
   sina källfiler (`lib/media-referenser.ts` på headless-site), så en bild som
   läggs i ett nytt blogginlägg står i listan utan att någon behöver komma
   ihåg den. Golv per källa på båda sidor (blogg 100, reservkatalog 1 000,
   data 300, kod 1, totalt 1 000), annars 503 från butiken och ett avbrott
   här. Per källa, för att reservkatalogen ensam bär totalen.
2. **`listaOrderbilder`**: alla ordrar, varje Wix-id i orderns JSON
   (`lineItems[].image` är ett objekt med `id` och `url`). Search Orders
   lämnar ute PENDING och REJECTED om de inte efterfrågas, så de läses i ett
   eget anrop (`statusar` i `fetchOrders`).

☠️ **Läsare som kan svara tomt utan att kasta har golv i produktion:**
recensionerna minst 1 000 bildadresser (3 592 uppmätta 2026-10-06; fel
`REVIEWS_BACKEND` hade gett den tömda Wix-kollektionen och `[]`) och ordrarna
minst 40 (83 uppmätta 2026-10-14). Golven ligger i `liveDeps`, inte i
planeringen, så testerna kan fortfarande pröva en tom läsare.

☠️ **Butiken måste deployas FÖRE motorn.** Utan butikens lista avbryts även
nattens städning, vilket är rätt håll att fela åt men ger ett rött jobb.

**Läget `omfang=allt`** (rutten, och workflowen **"Bilder — radera oanvända
bilder i hela mediabiblioteket"**, `bildstadning.yml`, `torr` · `radera`) tar
också poleringens utsnitt och kort. Fyra egenskaper som inte ska tas bort:

1. ☠️ **Bara filer som varken skapats eller ändrats på `minAlderDagar`**
   (standard 14, minst 7, och spärren ligger i `runMediaCleanup`, inte bara i
   rutten). Andra sessioner laddar upp kandidater, utsnitt och kort som sätts
   på produkten först efter granskning; tre sådana uppladdningar kom medan
   mätningen pågick.
2. ☠️ **Aldrig en fil utan källadress eller med okänd källa** (`ingen-kalla`,
   `wix-annan`, `annan-kalla` i `Filklass`). Wix kan inte svara på var en fil
   används, och logotypen, delningsbilden och kundernas egna
   recensionsbilder ligger i de klasserna. De räknas i svaret men rörs inte.
3. **Bara id på den vanliga formen** (`raderbartId` i `lib/wix/media-idn.ts`).
   Butikens mönster är bredare och fångar varje sådant id, så ett id som
   butikens lista kan missa raderas aldrig. Kort räknas bara som våra när de
   kommer ur vårt eget repo; en bloggbild var AI-genererad via Wix
   (`wixmp…/GoogleAiProxy/Gemini`) och ligger i `annan-kalla`.
4. ☠️ **`radera` kräver `hogst`, och golven kontrolleras i motorn FÖRE
   raderingen.** Workflowen börjar med ett torrt förflygningsanrop. Svarar
   rutten utan `omfang: "allt"` är den nya koden inte i produktion, och då
   raderas ingenting. Annars skickas 95 % av varje läsares antal som `golv`
   i varje anrop, och `runMediaCleanup` avbryter efter läsningen men innan
   listningen. En kontroll i workflowen efter anropet hade kommit för sent:
   då var fönstret redan raderat (granskningen 2026-10-14). Taket räknar
   också misslyckade skopor, och raderingen gör inga nya försök efter ett
   nätverksfel, eftersom skopan kan vara raderad fast svaret aldrig kom fram.

☠️ **Ett fönster som aldrig hann börja är ett fel.** Läsarna kan äta upp
listningens tidsbudget, och då kommer inga filer och samma markör tillbaka.
Utan spärren hade det sett ut som ett genomgånget bibliotek utan något att
radera.

Nattens läge (`aosom`) raderar samma filer som förut, men med de nya läsarna.

#### ☠️ Granskningen före första körningen: varianterna och en karenstid (2026-10-14)

Tre oberoende granskningar samma kväll, innan något raderats. De hittade ingen
väg där en fil som någon av läsarna ser raderas, men fem hål runt läsarna:

1. ☠️ **Varianternas egna bilder.** Varukorgen, Wix-kassan och ordern visar
   `variantsInfo.variants[].media` (se *Variantens bild följer bara valet*),
   och den kan peka på en fil som inte längre står i galleriet. Produktsökningen
   bär inga varianter. **`listaVariantbilder`** läser dem ur Read-Only Variants
   API (`POST /stores/v3/products/query-variants`, 1 000 per sida, med markör
   och utan filter; uppmätt 2026-10-14 att `media.id` följer med, även för
   dolda produkter). Obligatorisk, golv 1 000.
2. ☠️ **Karenstid, tre dygn** (`lib/store/bildstadning-karens.ts`, tabellen
   `bildstadning_karens`). En fil raderas först när den varit oanvänd i tre
   dygn, sett av två körningar. Googles flöde serveras upp till ett dygn
   gammalt, kategorisidorna cachas en timme och påminnelsemejlen om en
   övergiven varukorg bär bilden från när varan lades i korgen, upp till 72
   timmar senare. Utan karensen hade en fil som togs bort ur ett galleri i dag
   kunnat raderas i natt och synts som död bild i alla tre. Den stänger också
   glappet i nattens läge, där en import laddar upp bilderna sekunder innan
   produkten skapas. Varje körning antecknar, även torrkörningen; en fil som
   ses i bruk glöms, och klockan börjar om när den blir oanvänd igen. Faller
   bokföringen raderas ingenting. Svaret bär `mogna` (raderbara nu) och
   `iKarens`, och workflowens `hogst` ska vara torrkörningens `mogna`.
3. **Läsarna som kunde svara halvt utan att kasta.** Produktsvepet stäms av mot
   katalogens räknare (`countProducts`, högst fem färre, samma regel som
   raderingen av pensionerade utkast) och kastar vid sidtaket. Kategoriläsaren
   kräver minst 50 lästa KATEGORIER, inte bilder: bara All Products bar en bild
   2026-10-14. Färgbildstabellen har golv 100. Workflowens golv är 95 % men
   minst 1 för en läsare som gav något.
4. **Smalare klasser.** En Wix-kopia måste ha källa i vårt eget bibliotek
   (ägarprefixet `b379ce_` före understrecket); Wix gratisbilder (`11062b_`)
   och mallens bilder (`22e53e_`) bär samma namnsignatur men kan sitta på Wix
   egna sidor. `wix-utsnitt` är bara `/v1/crop/`: butiken visar sina bilder
   som fill- och fit-adresser, och en fil hämtad från en sådan kan vara
   hämtad för hand.
5. **Workflowen** pausar tio sekunder mellan anropen (varje anrop läser ~65
   produktsidor och upp till 60 filsidor mot samma värd), redigerar felraderna
   som import-workflowen gör, och räknar klasstabellen per pass i stället för
   summerat över passen. Rutten avvisar ett `limit` som inte är ett positivt
   heltal: `limit=0.5` blev förr 0, alltså obegränsat.

6. **Den egna dubbelkollen samma kväll** hittade två saker till. Karenstabellen
   jämförs i varje körning i SIN HELHET med det läsarna använder, inte bara med
   fönstrets filer: gamla filer ligger utanför nattens fönster och ses annars
   bara vid en full genomgång, så en fil som tagits i bruk och släppts igen
   däremellan hade behållit sin gamla tid. Tabellen nycklas på samma nyckel som
   jämförelsen (`karensNyckel`: adressens id-del, gemener). Och liveDeps vägrar
   köra när `WIX_SITE_ID` och butikens sajt pekar isär
   (`kontrolleraSammaSajt`), för då läser ordrarna en annan butik än filerna.
   Fönstret är 40 sidor (4 000 filer), inte 60, och produktsvepet pausar 250 ms
   mellan sidorna: läsarna kostar nu ~80–100 anrop mot samma värd innan
   listningen börjar, och 40 håller ett anrop kring de ~125 sidor i rad som
   torrkörningen 2026-10-14 klarade.
7. **En fjärde granskning av rättningen** gav fem saker till, alla lagade:
   - Ett svar från katalogens räknare utan antal blir 0 i `countProducts`. Det
     fäller nu körningen (minst 500), i stället för att stänga av avstämningen
     (`kontrolleraProduktsvep`).
   - Variantläsaren fäller `hasNext` utan markör. Den kräver också varianter
     från minst hälften av katalogens produkter: en enda sida täcker långt
     färre, och utan behörighet för dolda produkter saknas utkasten (~40 %).
   - Ett crop-utsnitt måste också komma ur vårt eget bibliotek.
   - Kategorierna ingår inte i workflowens golv. Bara en kategori bar en bild,
     och tas den bort mitt i körningen hade varje anrop fallit.
   - Felraderna skrivs ut även när ingen skopa föll. En fallen bokföring efter
     raderingen syns bara där. `limit=0` är "inget tak" i en torrkörning, som
     import-workflowens `bildstadning-torr` skickar, men 400 i en skarp körning.

Kvar och känt, medvetet:

- Läser en körning gammal kod (en återställd deploy mitt i workflowen) märks
  det först efter anropet, högst `hogst` filer.
- **Inlägg i Wix Blog** som saknar en lokal markdown-fil visas av butiken
  (`lib/blog.ts` på headless-site) med sitt omslag, och ingen läsare ser dem.
  Inga sådana visas 2026-10-14 (alla sju har lokala ersättare). Ett omslag som
  laddats upp i Wix-editorn saknar källadress och raderas aldrig; bara en
  importerad produktbild vald som omslag kan träffas. En läsare för Wix Blog
  kräver blogg-behörighet på motorns nyckel, som inte är verifierad.
- **Bilder inuti produktbeskrivningar** läses inte (beskrivningen är 3–4 kB per
  produkt). Ingen av de 406 sparade produktsidorna hade någon 2026-10-14.
- Mejl som redan skickats (påminnelser om varukorg efter 72 timmar,
  bevakningsmejl) kan visa en bild som raderats efter karenstiden.
- Karenstiden betyder "oanvänd vid varje körning som tittade under minst tre
  dygn", inte tre dygn i sträck i realtid. En fil som tas i bruk och släpps
  igen mellan två nattkörningar syns inte som i bruk, och dess gamla tid står
  kvar.

#### ☠️ Två skilda 429:or — och den ena går inte att vänta ut

Städningen föll två gånger på rad innan den fungerade, på två olika strypningar
som ser likadana ut i ett felmeddelande men inte är samma sak:

| | svarar | vad som hjälper |
|---|---|---|
| **API-strypningen** | JSON-fel efter ~40–50 sidor i rad | backoff (2 s, 10 s, 30 s), `Retry-After` |
| **Edge-strypningen** | en **HTML-sida** efter ~150 sidor | ingenting inom ruttens 300 s |

Den andra är strukturell: **58 160 filer går inte att lista i ETT anrop**, hur
tålmodigt det än görs. Listningen är därför FÖNSTRAD — 50 sidor per körning (60 före 2026-10-14),
markör i svaret (`cursor` → `?after=`). Samma mönster som svepet och bildfixen,
och av samma skäl.

☠️ **`paging.limit` takas på 100, vad än dokumentationen påstår.** Både Search
Files och Query File Descriptors står som "up to 200 files" i dev.wix.com.
Uppmätt mot skarpa API:t 2026-08-28 svarar BÅDA `400 INVALID_ARGUMENT:
'paging.limit' must be less than or equal to 100`. En körning med 200 föll
direkt på första sidan.

Två designval bakom det som inte ska tas bort:

1. **Referenslistan läses om för VARJE fönster.** Den är ~37 sidor mot en annan
   API-familj och alltså billig. Att bära den mellan körningar hade betytt att
   en produkt som fått nya bilder sedan förra varvet såg ut att sakna dem — och
   fel åt det hållet raderar bilder som ANVÄNDS.
2. **Nattcronen kör medvetet utan markör.** Listningen sorteras nyast först, så
   ett fönster från början är exakt det som hunnit bli föräldralöst sedan i går.
   Den historiska ryggsäcken tas med workflow-läget `bildstadning`, som loopar
   markören genom hela beståndet.

⚠️ **`limit` byter täckning mot djup, och det är inte uppenbart.** Markören är
en OFFSET. Raderar ett fönster N filer krymper listan med N, men markören pekar
fortfarande på "offset 6 000" — så nästa fönster hoppar över exakt N filer:

| `limit` | hoppas över per pass | täckning |
|---:|---:|---|
| 4 000 | ~40 000 | liten del av listan |
| 1 000 | ~10 000 | nästan hela |
| 0 (torrläge) | 0 | hela |

Det förklarar både varför torrpassen träffar exakt 58 160 och varför skarpa pass
gav avtagande utfall (20 625 → 6 200 → 3 949 → 2 342 den 2026-08-28). **Kör ett
stort tak först för att få undan massan, sedan ett litet för att sopa svansen.**

Raderingen är också tidsbudgeterad (listningen får 70 %, raderingen resten).
Utan det kunde en stor `limit` dra förbi `maxDuration` och dödas mitt i skopan:
filerna ÄR raderade men inget svar kommer tillbaka, och nästa körning vet inte
vad som hände.

⚠️ Mät inte beståndet genom en MCP-loop — den slår i taket långt innan den är
klar. Det var så de första 429:orna upptäcktes.

#### ☠️ Ett fel som slukas av en kommandosubstitution finns inte

Den första torrkörningen föll med `exit 1` och **noll rader om varför**, medan
rutten hela tiden svarade 500 med ett tydligt meddelande. `anropa` i workflowen
skrev sina `::error::`-rader till **stdout**, och anroparen gör
`svar=$(anropa ...)` — kommandosubstitutionen slukade dem.

Felen går till stderr nu. Fjärde gången huset lär sig samma sak: recensions-
bilderna (2026-08-22), `Promise.allSettled` i `media.ts` (2026-08-27), en
skrivning som svarade OK utan att göra något (2026-08-27), och nu det här.
**Ett misslyckande som ingen kan se är värre än ett som skriker.**
