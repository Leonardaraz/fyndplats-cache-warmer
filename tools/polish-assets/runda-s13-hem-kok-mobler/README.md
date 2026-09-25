# Runda S13: soptunnor, miniugnar, barbord, matgrupper och sex till (2026-09-24)

Samma grepp som i S7–S12: sökord med volym och låg svårighet, där vi har
produkterna men ingen egen sida. Urvalet kommer från en räkning av
produkttyper över **hela katalogen** (3 393 synliga produkter), inte från en
lista med gissade ord. Allt följer med i samma butiksdeploy som S6–S12 (#647).

## 1. Data

### Varför just de här tio

Första ordet i varje synlig produkts namn räknades på servern. Familjer med
många produkter och utan egen sida jämfördes sedan mot Semrush (Sverige),
volym per månad och svårighet:

| sida | sökord (volym/svårighet) | produkter |
|---|---|--:|
| soptunnor | soptunna 8 100/30, soptunnor 8 100/30, sopsorteringskärl 2 400/18, sopkärl 2 400/16 | 40 |
| miniugnar-airfryers | airfryer 49 500/29, miniugn 1 300/19, varmluftsfritös 590/28, airfryer ugn 320/16 | 20 |
| matgrupper | matgrupp 8 100/18, matbord med stolar 6 600/24, matgrupp 4 stolar 2 900/17 | 10 |
| barbord | barbord 6 600/20, bardisk 1 000/18, höj och sänkbart barbord 1 000/22, barbord med stolar 880/17 | 15 |
| elementskydd | elementskydd 14 800/24, radiatorskydd 170/16 | 5 |
| hornskrivbord | hörnskrivbord 4 400/17 | 8 |
| skarmtak-entretak | entrétak 4 400/20, skärmtak 2 400/18 | 8 |
| snurrfatoljer | snurrfåtölj 2 900/13 | 18 |
| oronlappsfatoljer | öronlappsfåtölj 1 900/13 | 12 |
| gnistskydd | gnistskydd 1 300/13, gnistskydd öppen spis 590/10 | 9 |

**Vi rankar inte topp 100 på något av orden.** Semrush visar 42 sökord över
800 i månaden där fyndplats.se rankar, och inget av dem hör till de här
familjerna.

⚠️ **Airfryer har svårighet 29**, och toppen består av stora elektronikkedjor.
Titeln börjar därför med *miniugn* (svårighet 19), där sidan har tolv produkter
som heter just det. Airfryer står med eftersom sju av ugnarna har frityrkorg
och varmluft. Det är vad en airfryer är, fast i ugnsform.

### Medvetet INTE med

| ord (volym/svårighet) | varför |
|---|---|
| sängram 6 600/16, hörnsoffa 9 900/21, rumsavdelare 8 100/16, sängbänk 1 300/18 | orden står redan i titlarna för Sängar & sovrum, Soffor & bäddsoffor och Rumsavdelare |
| matskåp 140/11, skafferiskåp 480/14, trädgårdsskåp 320/10 | för liten volym |
| sopsortering 3 600/31 | över rundans gräns; *sopsorteringskärl* står i titeln i stället |
| klätterställning 1 300/13 | fem produkter, och ordet står i Leksaker & Spels titel |
| väggvärmare 10/0 | ingen volym |

⚠️ **Sängram, hörnsoffa och rumsavdelare rankar inte heller.** Orden kom
in i titlarna när Möbler blev en egen avdelning (`bec08498`, 2026-09-23),
alltså dagen före. Det säger ingenting ännu, och det är inget skäl att bygga
fler sidor för samma ord. Baslinjen för alla kategoriord står i
`sokord-kategorier/` (se avsnitt 8).

## 2. Urvalet

Kandidaterna hämtades som **publicerade produktsidor** (sitemapen, 159 sidor)
och tolkades lokalt. Varje fakta i texterna har därför en källa som går att
läsa igen, och ingenting passerade chatten som avskrift.

- **Soptunnor (40):** sensortunnor, pedaltunnor, sopsorteringskärl med två
  eller tre fack och utdragbara sopsorterare. Soptunneskyddet för kärl
  utomhus är inte med.
- **Miniugnar & airfryers (20):** miniugnar, bänkugnar med kokplattor och
  miniugnar med frityrkorg. Den enda airfryern med utdragbar korg är slutsåld.
- **Barbord (15):** set med pallar eller stolar, två höj- och sänkbara barbord,
  ett vridbart barbord och en bardisk. Barbordet med vinställ ligger också i
  Vinställ & vinkylar.
- **Snurrfåtöljer (18):** allt som heter snurrfåtölj, fåtöljerna med lös
  fotpall på rund stålfot (sitsen vrids, och sluggen säger snurrfåtölj) och
  två reclinerfåtöljer med 360° snurrfot. **Inte med:** fyra snurrstolar som
  är skrivbordsstolar, en av dem på hjul, och snurrstolen för barn.
- **Öronlappsfåtöljer (12):** allt med öronlapp i namnet, alltså också två
  gungstolar och en uppresningsfåtölj med öronlappsrygg.
- **Matgrupper (10):** matgrupperna för inomhus. De två för utomhus ligger i
  Utemöbler och är fel säsong.
- **Hörnskrivbord (8):** också skrivbordet som vrids mellan hörnläge och rakt
  läge.
- **Skärmtak & entrétak (8):** sandlådan med skärmtak är inte med.
- **Gnistskydd (9):** för öppen spis. Eldkorgarna med gnistskydd hör till
  Eldkorgar & eldstäder.
- **Elementskydd (5).**

Ingen produkt ligger i två av de nya kategorierna: 145 kopplingar på 145
produkter.

## 3. Wix

Tio kategorier skapade 2026-09-24:

- under Kök & Husgeråd: Soptunnor och Miniugnar & airfryers
- under Möbler: Barbord, Snurrfåtöljer, Öronlappsfåtöljer, Matgrupper och
  Hörnskrivbord
- under Hem & Inredning: Gnistskydd och Elementskydd
- under Trädgård & Utemöbler: Skärmtak & entrétak

- **Planen** står i `koppling.json`, med kontrollsumman **541968547**
  (FNV-1a över `slug:id,…|…`). Den räknades om i skrivanropet.
- **Vakterna i samma anrop, före första skrivningen:**
  - varken sluggen eller namnets slug fanns
  - namnet ger exakt den slug butiken räknar fram, med en avskrift av
    butikens funktion som hade två extra regler. Den missade därför é, se
    avsnitt 6.
  - föräldern fanns och var synlig
  - varje produkt var synlig och bar familjens ord i namnet

  De tog 4,0 sekunder och föll inte på något.
- **Resultat:** 145 av 145 kopplade, 0 fel. En separat återläsning gav
  **10 av 10 lika planen**, med antal och kontrollsumma över de sorterade
  medlemmarna.
- **Wix har nu 128 kategorier, varav 127 synliga.**
- **Kopplingarna är additiva.** Produkterna ligger kvar i sina gamla
  kategorier.

## 4. Texterna

Tio filer med `seo`, `content` och `facit`, alla RENT genom
`gate-kategori.py`. Kontrollen mot produkterna ändrade följande innan något
skrevs till butiken, och inget av det hade grinden fångat:

| utkast | vad produkterna säger | nu |
|---|---|---|
| "varje fack har en egen pedal" | sju av tolv sopsorteringskärl säger det | "på flera" |
| "alla grupperna levereras med monteringsanvisning" | fyra matgrupper anger ingen anvisning | meningen är borta |
| "på de andra sitter klädseln fast" (öronlapp) | bara två sidor säger det | "hur de andra sköts står i beskrivningen", och alla tolv har avsnittet |
| "pallarna har en sitthöjd på 57 till 68 cm" | ett av seten har stolar | "sitthöjden är 57 till 68 cm" |
| "en skärm ryms på varje skiva" (hörnskrivbord) | står ingenstans | frågan handlar om förvaring i stället |
| skärmtakets skiva "släpper igenom ljuset" | två tak anger svart eller brunt | "på de flesta är den genomskinlig" |
| "som en växt … och inget som droppar" (elementskydd) | motsäger sig själv | "några böcker, och torka upp spill, MDF tål inte väta" |
| "förvaring i ena änden" (vridbart skrivbord) | namnet säger bara "med förvaring" | "har också förvaring" |

**Butikstestet fällde två titlar.** Snurrfåtöljer och Öronlappsfåtöljer hade
"med fotpall" i titeln, och testet svarade "/fotpall/i finns i 3 titlar".
Fotpall (8 100/18) är Sittpuffar & fotpallars sökord sedan S11, och en tredje
titel hade delat på det. Titlarna är nu "Snurrfåtölj – vrids 360°, på ben
eller fast fot" och "Öronlappsfåtölj – knappad rygg, sammet & linne".

**Inget påstående vilar på en slutsåld produkt.** Elva av de 145 är
slutsålda, och varje fils `urval` namnger dem.

## 5. Butiken

Commit `de7a74d0` på `claude/sasongskategorier-s6-bz3j9l` (#647).

- `infoga.py`: tio nya poster. `jamfor.mts` gav **10 av 10 lika källan**, och
  S11 (7 av 7) och S12 (3 av 3) är oförändrade.
- **Google-flödet**, kontrollerat mot taxonomifilen på sv-SE och en-US:
  - 637 Trash Cans & Wastebaskets (sv: *Soptunnor och papperskorgar*)
  - 761 Countertop & Toaster Ovens för miniugnarna
  - 4355 Kitchen & Dining Room Tables för barbord: de flesta är set, och
    Google klassar ett set efter huvudprodukten
  - 6347 Kitchen & Dining Furniture Sets för matgrupperna, som har en egen
    setnod
  - 6499 Arm Chairs, Recliners & Sleeper Chairs för båda fåtöljsidorna
  - 4191 Desks, 2365 Fireplace Screens och 7110 Heating Radiator Accessories
  - 499907 Awnings för skärmtaken. Det finns ingen nod för skärmtak, och den
    svenska etiketten *Markiser* är Googles översättning av samma id
- **Testet för unika huvudsökord:** 16 nya ord, bland dem *soptunn*,
  *miniugn*, *airfryer*, *barbord*, *matgrupp*, *hörnskrivbord*, *skärmtak*,
  *entrétak*, *gnistskydd* och *elementskydd*.
- **/butik:** Kök & Husgeråd, Möbler och Hem & Inredning länkar till de nya
  sidorna. Skärmtak ligger under Trädgård, som inte finns i `MAIN_GROUPS`, men
  i menyn.
- **Kontroller:** `npm test` 787 av 787. `tsc` gav samma 76 fel som basen
  (alla i testfiler). `eslint` rent.

Förhandsbygget hittade två fel, och båda är lagade i samma gren (avsnitt 6):

- `faca51b9`: kategorisluggen gör é till e
- `d2488452`: produktsidorna svarade 500 på kalla instanser

Efter dem gav `npm test` **794 av 794**. `tsc` gav 78 fel, alla i testfiler:
basens 76 och samma importfel i de två nya testfilerna. `eslint` är rent på de
nya filerna. Det enda felet i `products.ts` (`any` på rad 133) fanns redan på
basen.

## 6. Förhandsbygget

### Första bygget: 62 av 63

`dpl_BNwDH25ePgXreMm9oBWQwx7FfrQg` (`de7a74d0`) svarade 07:43 UTC. 62 av 63
sidor var lika källan. **Skärmtak & entrétak var det inte:**
`/kategori/skarmtak-entretak` svarade först 500 och sedan 404, och sidan
saknades i sitemapen.

☠️ **Orsaken är butikens slug-funktion.** `asciiSlug` gjorde bara om å, ä och
ö, och alla andra tecken blev bindestreck. "Skärmtak & entrétak" fick därför
adressen `skarmtak-entr-tak`. Sidan låg i sitemapen under den adressen med den
generiska mallen, medan texterna och flödet var nycklade på
`skarmtak-entretak`.

☠️ **Vakten i skrivanropet kunde inte se felet.** "Namnet ger exakt den slug
butiken räknar fram" (avsnitt 3) var en avskrift av `asciiSlug` med två extra
regler, `é→e` och `ü→u`. Avskriften gav `skarmtak-entretak`, butiken något
annat. En vakt som räknar med en egen kopia av funktionen mäter kopian, inte
butiken. Det som fångade felet var förhandsbygget, alltså den kontroll som
läser butikens verkliga svar.

**Lagningen (`faca51b9`)** tar bort accenter med NFD efter å/ä/ö:

- Mätt mot alla 128 kategorinamn i Wix, även den dolda *Örhängen*: bara den
  här kategorins slug ändras, och inga slugar krockar.
- Funktionen bor nu i `lib/category-slug.ts`, som är enda definitionen.
- Fem tester. Utan NFD-raden fäller två av dem, och med en egen kopia i
  `products.ts` fäller ett.

### Den första 500:an var ett eget fel, och det fanns i produktion

Loggen för 500-svaret sa:

```
Page changed from static to dynamic at runtime /kategori/skarmtak-entretak,
reason: revalidate: 0 fetch https://www.wixapis.com/ecom/v1/orders/search
```

`lib/popularity.ts` hämtade ordrar med `cache: "no-store"`. Hämtningen körs
inne i `getProducts`, alltså i varje ISR-sida. När en kall instans renderar en
sida som inte är förgenererad blir sidan dynamisk mitt i renderingen, och Next
svarar 500.

**Samma fel fanns i produktion.** Mätt 2026-09-24 för det senaste dygnet
föll 1 081 renderingar:

| utfall | antal |
|---|--:|
| besökaren fick 500 | 85 |
| besökaren fick den gamla sidan (`200`, `cache=STALE`), och förnyelsen i bakgrunden föll | 996 |

Nästan alla gällde `/produkt/[slug]`. Felet slår till på den första
renderingen på varje ny instans. Timcronen som värmer katalogen startar många
instanser på en gång, så under varje uppvärmning föll förnyelser i klump.

Följderna är två:

- En ny produktsida kan ge 500 första gången den besöks, och varje
  poleringsrunda publicerar nya produktsidor.
- En ändrad sida förnyas inte när förnyelsen körs på en ny instans. Besökaren
  ser den gamla versionen tills nästa försök lyckas.

**Lagningen (`d2488452`)** tar bort cache-valet. Utan det gör Next inte sidan
dynamisk, och svaret lagras inte i Data Cache. Färskheten styrs som förut av
modulens TTL på 30 minuter. Ett test fäller om `no-store` eller `revalidate: 0`
kommer tillbaka, och det är provat med felet återinfört.

### Andra bygget: 63 av 63

`dpl_2BEbjpw6RzCsvmYCocj2SG37JJtu` (`d2488452`) svarade 08:02 UTC.

- **63 av 63 sidor är lika källan** för S6–S13. Jämförelsen gäller `<title>`,
  metabeskrivning, canonical, varje introstycke, varje FAQ och antalet frågor
  i FAQPage-JSON-LD. Ingen sida visar `**`.
- **Kontrollsidorna** (Golvlampor, Skönhet & Hälsa, Hantlar, Köksmaskiner,
  Badrumsskåp, Massagestolar, Hudvård, Sittpuffar, Matbord och Fåtöljer)
  svarar 200 med sina titlar.
- **Sitemapen** har 115 kategori-URL:er, mot 104 i S12:s förhandsbygge.
  `skarmtak-entretak` finns med och `skarmtak-entr-tak` inte. Tio av de elva
  nya är S13-sidorna. Den elfte är Mode & Accessoarer, som har exakt fem
  produkter. Den ligger alltså på gränsen för indexering och kommer och går
  med lagret. S13 har inget med den att göra.
- **Kalla renderingar:** 20 slumpade produktsidor som inte var förgenererade
  gav 20 svar med 200. Två av dem kördes på kalla instanser, där
  `getProducts` hämtade katalogen inne i renderingen. Loggen för bygget har
  **noll** rader om "static to dynamic". Det förra bygget hade en.
- **Antal produkter på sidan mot antal kopplade:**

  | sida | på sidan | kopplade |
  |---|--:|--:|
  | Soptunnor | 35 | 40 |
  | Miniugnar & airfryers | 18 | 20 |
  | Barbord | 14 | 15 |
  | Snurrfåtöljer | 18 | 18 |
  | Öronlappsfåtöljer | 11 | 12 |
  | Matgrupper | 10 | 10 |
  | Hörnskrivbord | 7 | 8 |
  | Skärmtak & entrétak | 7 | 8 |
  | Gnistskydd | 9 | 9 |
  | Elementskydd | 5 | 5 |

  Skillnaden är de elva slutsålda, 134 plus 11 är 145.
- **Google-flödet** jämfört med S12:s förhandsbygge:
  - Alla 145 produkter finns i flödet.
  - 95 byter till sin S13-sidas nod, och varje byte går från en bred nod till
    en smalare:
    - Kitchen & Dining → Trash Cans (21)
    - Kitchen Appliances → Countertop & Toaster Ovens (14)
    - Furniture → Arm Chairs (14), Furniture Sets (7) och Tables (6)
    - Electronics → Desks (5)
    - Hardware → Awnings (4)
    - Decor → Fireplace Screens (3)
    - Home & Garden → den smalare noden (21)
  - De övriga 50 behåller sin nod, eftersom deras första underkategori i Wix
    är en äldre sida.
  - **Ingen produkt får en sämre nod.**

### Tredje bygget: färgfiltret och Google-flödets bilder

Loggen från det andra bygget visade samma rad som produktionen:
`[wix] färgval hämtade: 0 produkter har minst en färg`. Färgfiltret på
listsidorna har alltså aldrig visat en färg. Felet låg i urvalet, och samma
urval fanns på två ställen till.

**Orsaken, mätt mot Wix:** tre hämtningar i butiken läste katalogen nyast
först och slutade efter 12 sidor om 100. Katalogen har 6 067 produkter, och
de 1 200 nyaste är Aosom-varor. De har en variant och inga färgval, och
drygt hälften är dolda utkast.

| hämtning | vad den missade |
|---|---|
| färgerna (`lib/product-colors.ts`) | alla 239 produkter med optioner. Ingen av dem finns bland de 5 100 nyaste |
| Google-flödets gallerier (`fetchFeedGalleries`) | extrabilder till 2 836 av 3 393 produkter |
| Google-flödets varianter (`fetchAllVariantsRaw`) | ingenting än. Taket var 10 000 varianter, katalogen har 7 006, och med ett sextiotal nya produkter per natt hade taket nåtts i mitten av november |

**Lagat i #647** (`17b2f9d6`, `c660ab08`):

- Färgfrågan filtrerar på `options.id` och får alla 239 på tre anrop.
  Filtret skickas bara på första sidan, eftersom filter plus markör svarar
  `400 INVALID_CURSOR` på `products/query`. Ett ofiltrerat svep över hela
  katalogen hittade samma 239. Faller en sida visas ingen facett, i stället
  för en facett med fel antal.
- `google.xml` faller tillbaka på produktens eget galleri, upp till sex
  bilder, som `products.xml` redan gjorde.
- Variantsvepet har taket 30 000 och loggar ett fel om det slår i.

Nio nya tester, alla provade mot sin bugg. Hela sviten ger 803 av 803.

**Utfall** i `dpl_6Ett7YmBBDYxmMFEWPFRT4UKjJpH`, mätt med
`bilder-farg-koll.py`:

| | produktion i morse | förhandsbygget |
|---|--:|--:|
| produkter i Google-flödet | 3 393 | 3 420 |
| med extrabilder | 557 | **3 420** |
| färre extrabilder än förut | | 0 |
| produkter med färg, byggloggen | 0 | **137** av 239 |
| produkter med färg på /alla-produkter | 0 | 122, i 19 färger |

63 av 63 sidor för S6–S13 är fortfarande lika källan, och sitemapen har 115
kategori-URL:er.

## 7. Live

**Vägen till produktion, 2026-09-25**

- **#652 kom först.** #652 (sökningen, julguiderna och bildsvepet, en annan
  session) mergades 01:01 UTC och blev dagens första produktionsbygge. Dess
  huvud `dc256901` var samma som provsammanslagningen 00:46 UTC.
- **headless-site slogs in i #647** som `22de7a2f`, utan konflikter. Båda
  PR:ernas ändringar i `lib/category-groups.ts` (MAIN_GROUPS och
  CATEGORY_HERO_IMAGES) och i `app/globals.css` finns kvar. npm test gav 836
  av 836, och tsc 0 fel utanför testfilerna.
- **Förhandsbygget** `dpl_6ESFohHPoF91HWcRUdziDNvGewL7`:
  - 69 av 69 sidor lika källan, kontrollsidorna 200 och sitemapen 120
    kategoriadresser.
  - Läckkollen utan fel, och menykollen 10 dolda paneler och 114
    underkategorier på varje sida.
  - #652:s delar är intakta: /sok har "Bäst match" förvald, /kategori/mobler
    har den inte, och /kategori/julgranar har `pimg-track-swipe` i
    server-HTML:en.
  - /butik växer från 330 till 515 kB rå HTML mot produktionen. Det beror på 50
    nya kategorirutor med bild för sökordskategorierna i MAIN_GROUPS.
    Produktkorten är identiska, och ingen länk från produktionen försvinner.
- **#647 mergades 01:29:32 UTC** (`cf724a67`).

☠️ **Mergen gav inget bygge.** GitHub skickade ingen push-händelse för
merge-commiten. Händelseloggen har `PullRequestEvent merged` och en
`DeleteEvent` för grenen, men ingen `PushEvent` för headless-site. Vercel
skapade ingen deployment i något av de två projekten på elva minuter. Både
GitHub och Vercel rapporterade full drift. #652:s merge en halvtimme tidigare
fick sin push-händelse efter en sekund.

Produktionsbygget startades därför för hand, via Vercels API mot exakt
`cf724a67` på headless-site: `dpl_3Mb4VcsjhGdcxtR5rpuKuVvDFqbK`, skapat 01:40 UTC
och READY 01:43 UTC. Det är samma bygge som mergen skulle ha gett, och dagens
andra. Ingen dubblett från en sen webhook har dykt upp.

**Kontrollera efter varje merge att merge-commiten fått ett bygge**
(`list_deployments` med `sha`). En merge utan bygge ser annars ut som en
lyckad.

**Hela deployen i produktion**

- `livekoll.py` gav rätt på alla rundor: S4 15, S6 11, S7 12, S8 6, S9 4,
  S10 9, S11 7, S12 3, S13 10 och S14 7. Det är 69 av 69 sidor för S6–S14.
- De 51 nya sidorna (S7 11, S8 6, S9 3, S10 8, S11 7, S12 1, S13 10, S14 5)
  finns alla i sitemapen, som har 120 kategoriadresser, och i menyn på
  startsidan.
- `skarmtak-entretak` svarar 200 med titeln "Skärmtak & entrétak för ytterdörr
  och fönster | Fyndplats". `skarmtak-entr-tak` svarar 404 och saknas i
  sitemapen.
- Golvlampor och Skönhet & Hälsa svarar 200.
- Läckkollen (`../seo-granskning-2026-09-24/lackkoll.py`): 14 av 14 utan fel.
- Wix lästes före mergen, 01:22–01:29 UTC:
  - 132 kategorier synliga, 133 med den dolda Örhängen.
  - Ingen av de 1 230 planerade kopplingarna i S6–S14 saknas.
  - Poleringen 2026-09-24 har lagt till 55 nypolerade produkter (58
    kopplingar) i 25 av kategorierna, alla synliga.
  - I S13: Miniugnar & airfryers har 21 (20 planerade), Barbord 17 (15) och
    Gnistskydd 11 (9).

**Färgfiltret och flödet** (`bilder-farg-koll.py` mot produktionen, med
produktionens flöde 01:30 UTC som referens):

- `/feed/google.xml`: 3 487 produkter, **alla 3 487 med extrabilder**. Före
  mergen hade 632 extrabilder, och ingen produkt fick färre.
- `/alla-produkter`: 122 produkter med färg, i 19 färger.
- Byggloggen: "[wix] färgval hämtade: 137 produkter har minst en färg (av 239
  med optioner)".
- ⚠️ Byggloggen visar också att `/feed/google.xml` och `/feed/pricerunner.xml`
  tog mer än 60 sekunder i första försöket. Omförsöket gick igenom. Tre
  misslyckade försök fäller bygget, så tiden är värd att följa.

**Brödsmulan:** tio produktsidor i produktion, en per sökordskategori
(Hörnskrivbord, Snurrfåtöljer, Soptunnor, Matgrupper, Massagebänkar,
Motorcyklar för barn, Valphagar & hundhagar, Odlingslådor, Hantlar & hantelset
och Terrarier).

- **10 av 10** har fyra nivåer, och nivå tre är den smalaste indexerbara
  underkategorin.
- Den synliga brödsmulan har samma länkar.
- Massagebänken i urvalet fick Kropp & Välbefinnande. Se S12:s avsnitt 7.

**Menyn** i produktion står i `../meny-underkategorier/README.md`.

**500-lagningen** mäts i uppföljningen 03:45 UTC, mer än en timme efter att
produktionsbygget blev READY.

## 8. Baslinjen

Innan S6–S13 går live finns en mätpunkt för alla kategoriord i
[`../sokord-kategorier/`](../sokord-kategorier/README.md). Den omfattar 102
huvudsökord på 74 sidor från S4 till S13, med en samlad volym på 906 250
sökningar i månaden.

**I dag rankar domänen topp 100 på tre av dem:**

| sökord | position | sida |
|---|--:|---|
| *massagebänk* | 28 | Massage & Återhämtning |
| *hantlar* | 58 | Träning & Gym |
| *behandlingsbänk* | 60 | Massage & Återhämtning |

Alla tre går till en gammal, bred sida, och ingen till sidan som bygger på
ordet. De orden får sina egna sidor med #647.
