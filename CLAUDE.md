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
- **GA4** (`G-W6NZ87CX2Q`) also runs, loaded `lazyOnload` via `next/script`
  with a synchronous inline `gtag` stub. The two analytics stacks are
  independent.

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

## Googles ?srsltid= tas bort ur adressfältet (2026-09-30)

Merchant Centers automatiska taggning lägger `?srsltid=…` på varje länk från
Googles sökresultat. Leonard ville ha bort den ("det ser fult ut"), utan att
något annat påverkas. `components/rensa-srsltid.tsx` tar bort den ur
adressfältet, logiken bor i `lib/srsltid.ts` och är testad där.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Koden står kvar tills Googles tagg är klar med den.** Städningen väntar
   på att gtag.js laddats (den laddas med `lazyOnload`) OCH att besökaren valt
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
  som regel ingen GTIN, utom i testet nedan. Märke och artikelnummer finns bara
  på den hemliga adressen (se nästa avsnitt).
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
  adressen checkas in, och om ett annat flöde än den hemliga rutten hämtar
  numren.
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
tacksidan erbjuder dessutom konto. Utan `MEDLEM_JWT_SECRET` (minst 32 tecken)
i miljön är inloggningen stängd oavsett läge.

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
  för att skapa en order till. Ett lås äldre än 120 s tas över.
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
  egen server, och betalfältet använder systemets typsnitt (`UTSEENDE`).
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

### Klarna-rutan på produktsidan (2026-11-06)

Klarnas egen ruta (OSM, `components/klarna-osm.tsx`) visar villkoren i
Leonards Klarna-avtal, som gäller i Wix kassa: "Betala inom 30 eller 60 dagar"
och delbetalning i 3–24 månader. I Stripe-kassan gäller Stripes Klarna (30
dagar och Stripes delbetalning). När Stripe-kassan är på för alla (växeln
`pa` och Stripes hemliga nyckel) visar sidan därför vår egen rad ("Betala
senare – räntefritt med Klarna", sann i båda), och Klarnas skript (0,8 MB)
laddas inte (`klarnaRuta`, `/api/kassa/klarna`, `lib/use-klarna-ruta.ts`).
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
  betalningen och Google-betyget (`getSocialProof`, samma cache som sidfoten).
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
- ☠️ **`layout.overflow: "never"` bara med `maxRows: 0`.** Annars kastar Stripe
  IntegrationError och inga knappar ritas (lokalt prov 2026-11-06). Knapparna
  monteras därför sist och i `try`: ett fel i snabbkassan får aldrig stoppa
  formuläret och betalfältet.
- **Platsen hålls från första renderingen** (också på servern) med en
  platshållare i knappens höjd, men bara där Apple Pay finns
  (`ApplePaySession`, som Safari på iPhone och Mac har). Rutan som dök upp
  efter hydreringen knuffade ner formuläret 256 px. Där svarar Stripe snabbt
  och visar nästan alltid knappen; saknas plånbok tas platsen bort när Stripe
  svarar, eller efter 12 s. ☠️ **Inte för Google Pay:** Stripes kontroll av
  Google Pay tog 13 s på förhandsbygget (huvudlös Chromium, testnycklarna,
  2026-11-06), och 0 av 171 köp är Google Pay (23 Apple Pay). I Chrome visas
  rutan därför först när Stripe hittat en plånbok. Utan plånbok står rutan
  utanför sidan (`data-visas="nej"`), eftersom knapparna måste vara monterade
  för att Stripe ska kunna svara.
- **Före hydreringen avgör `PLANBOK_SKRIPT`** (`lib/kassa/snabbkassa.ts`, körs
  först i `app/layout.tsx`): det sätter `data-applepay="ja"|"nej"` på `<html>`,
  och CSS:en flyttar ut rutan medan Stripe svarar (`data-snabb="laddar"`) i en
  webbläsare utan Apple Pay. Annars stod platsen kvar tills React tagit över
  och försvann sedan. Skriptet ligger i layouten och inte på kassasidan,
  eftersom kunden oftast kommer till `/kassa` med ett mjukt sidbyte från
  varukorgen, och då körs inga skript i sidans HTML.
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
  - Jämförpriset sparas i tio minuter per produkt och pris och instans; ett fel
    ger ingen jämförelse, aldrig en gissad.
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
