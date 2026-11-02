## Prissättningen är marknadskalibrerad, inte påhittad (`FyndplatsPricingConfig`)

Regeln är **`pris = 1,20 × landedCostSek`**, uppåt till närmaste 9 (`charm9`).
Ingen fast del, ingen trappa, inga kategorimultiplikatorer. Satt 2026-08-27.

```
defaultMultiplier 1.20   fixedSurchargeSek 0   categoryMultipliers {}
tiersEnabled false       rounding charm9
```

Marginalen blir **17 % överallt** — p10, median och p90 är alla 17 % över hela
sortimentet, så ingen vara kan råka hamna på 4 %. Ändringen gäller bara nya
importer; befintliga priser står kvar tills någon räknar om dem.

### `charm99` är PÅSLAGEN sedan 2026-09-03

Leonards önskemål 2026-09-03: 99 är den proffsigaste ändelsen, 89 och 09 ser ut
som räknerester. Strategin `charm99` (i `roundPrice`) höjer 89 → 99 och **sänker
09 → 99**. Ungefär vinstneutral — lika många rader upp som ner, 10 kr åt vardera
hållet.

☠️ **Den är den enda strategin utöver `charm90` som får runda NEDÅT**, och
`charm9`:s kommentar ("aldrig nedåt → marginalen skyddas") var inte en vana:
`applyOverrideBounds` räknar fram Custom-tierns **golv** genom att köra
`roundPrice` på det lägsta acceptabla priset, så en nedrundning kunde lägga
golvet under sin egen minimivinst — tyst, eftersom siffran fortfarande ser ut
som ett giltigt pris. Spärren sitter i `applyOverrideBounds`, inte i
`roundPrice`, och ett test fäller om den tas bort.

**Aktiverad genom `rounding: "charm99"` i `FyndplatsPricingConfig`** — inte via
`PRICE_ROUNDING`, av samma skäl som feed-adressen: en miljövariabel slår inte
igenom förrän projektet byggts om.

☠️ **ORDNINGEN VAR INTE VALFRI, och den gäller vid varje framtida strategibyte.**
Sätts konfigen INNAN koden ligger ute känner produktionens `roundPrice` inte igen
namnet, faller igenom alla grenar och returnerar priset **oavrundat** — och
Aosom-synken skriver örespriser över hela katalogen inom sex timmar. Kod först,
verifiera att deployen är `READY`, sedan konfig. (Valideringen ovan fångar det
numera, men bara när den nya koden faktiskt kör.)

Verifierat i drift direkt efter växlingen på vattenfontänen `dd7052d3`:
`landedCostSek 499.91` → 599,89 → charm9 ger 609 → **charm99 ger 599**, och
raden skrev ut `avrundning charm99`. Att talet är ett HELTAL på 99 är kvittot
att den nya koden kör — den gamla hade svarat `599.89`.
Aosom-synken räknar om priset ur kostnaden var 6:e timme, så ~20 % av
Aosom-halvan flyttar sig 10 kr inom ett dygn. AliExpress-halvan står kvar tills
någon kör prisreparationen.

☠️ **Strateginamnet valideras numera i BÅDA dörrarna, och det var ett verkligt
hål.** Ett okänt namn föll rakt igenom till `roundPrice`, som inte känner igen
det och därför returnerar priset **oavrundat** — alltså `none`. Uppmätt:
`roundPrice(541.85, "charm99 ")` = `541.85`. Ett efterföljande blanksteg i
configraden hade tyst stängt av charm-prissättningen för hela katalogen och
börjat skriva örespriser till kund, utan ett enda fel någonstans. Hålet fanns
i `mergePricingRules` (`stored.rounding ?? base`) OCH i `lib/config.ts`
(`process.env.PRICE_ROUNDING as …`) — och eftersom fallbacken går genom den
andra hade en spärr i bara den första varit meningslös. Listan och typen
härleds nu ur samma array (`ROUNDING_STRATEGIES`), så de kan inte glida isär,
och ett test läser källkoden och fäller om `as`-casten kommer tillbaka.

⚠️ **Sekvensera aktiveringen.** Poleringens prisgrind fäller bara på
Aosom-rader (`regelGäller: supplier === "aosom"`), och den räknar ur samma
`roundPrice`. I fönstret mellan att configen ändras och att synken hunnit
skriva om priserna förväntar grinden 599 medan Wix säger 609 — så var femte
Aosom-produkt ger `PRISGRINDEN FALLER — RÖR INTE PRISET` i upp till ett dygn.
Det är inget fel i grinden; den gör precis sitt jobb. Men polera inte
Aosom-produkter i det fönstret — vänta tills synken konvergerat, annars lär
man sig att ignorera larmet. AE-rader berörs inte (de blir `EJ AVGÖRBAR`).

### Var talet kommer ifrån

*Historik: en engångsmätning 2026-08-27. Priset sätts av regeln ovan, och ingen ny
jämförelse görs (Leonard 2026-10-21, se avsnittet "Dealproffsen: vi jämför inte med dem").*

Inte från en marginalambition — från mätning. **dealproffsen.se publicerar
Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD**, så exakt matchning är
mekanisk. Slagning på 70 spridda artiklar gav **55 exakta träffar**
(`https://www.dealproffsen.se/sok?controller=search&s=<SKU>` — WebFetch får 403,
curl med vanlig browser-UA fungerar).

| multiplikator | billigast på | marginal | vinst där vi vinner |
|---|---:|---:|---:|
| 1,18 | 39/55 | 15 % | 9 903 kr |
| **1,20** | **39/55** | **17 %** | **10 943 kr** |
| 1,25 | 30/55 | 20 % | 11 337 kr |
| 1,28 + 60 *(gammalt)* | 18/55 | 25 % | 9 962 kr |

1,25 tjänar mest på pappret men tappar en tredjedel av försprånget så fort
marknaden ligger 5 % under mätningen — och den gör den, eftersom underlaget
oftast är EN återförsäljare. 1,20 håller (30/55 vid −5 %, mot 1,25:s 21/55).

### Tre fällor som redan kostat

1. **Den fasta delen drog åt fel håll.** "Lite mer på billiga saker" känns rätt
   och är fel: konkurrentens påslag på vår kostnad är **1,12× på den billigaste
   tredjedelen** mot 1,33× på resten. Det finns minst utrymme just där `+60`
   lade mest. Varje rad i sveptestet med fast del är sämre än samma
   multiplikator utan.
2. **Varje fallande trappa inverterar priset vid gränsen** (799 kr kostnad →
   1 139 kr pris, 801 kr → 1 089 kr). Bygg ingen trappa. `tiers` ligger kvar i
   konfigen men avstängd.
3. **Kategorimultiplikatorer upphäver regeln tyst.** `Husdjur: 2,5` hade satt
   60 % marginal på PawHut-sortimentet — en stor del av Aosom. Rensade.

### Referenspriser är fiktion — båda hållen

Aosoms egen `Normal Price` är uppblåst: RRP 443,90 € på en bod där idealo
listar samma artikel för 189,50 € (2,3×). Ett marknadsankare byggt på den
siffran prissätter efter fantasi — avblåst.

Dealproffsens listpris likaså: **55 av 55 produkter står som "Kampanj"** med
median 24 % rabatt. En kampanj som alltid pågår är inget pris. Kampanjpriset ÄR
priset, och det är det som ska jämföras mot.

### Varför vi förlorar på billiga varor — och vad som faktiskt löser det

Konkurrenten är inte billig. Deras påslag på **själva varan** är 1,96× i median
— ett vanligt butikspåslag. Skillnaden är **vår frakt**: Aosom fakturerar per
paket och viktstyrt, vilket blir en platt tull på 240–290 kr per vara i spannet
2–10 kg. På en vara som kostar 400 kr är det +65 %; på en som kostar 3 000 kr
är det +9 %.

| vår fraktandel av inköpet | deras pris ÷ vår kostnad | deras pris ÷ bara varan |
|---|---:|---:|
| under 25 % | 1,32 | 1,75 |
| 25–40 % | 1,28 | 1,92 |
| över 40 % | **1,13** | **2,07** |

☠️ **"1–2 dagars leverans" VAR FEL, och raden stod kvar i tre veckor
(rättat 2026-09-15).** Leonards invändning: *"dom dropshippar också … Alla dom
som har 3-5 dagar dropshippar dom precis som vi."* Mätt på 42 av deras
produktsidor, tio ur vardera gapgrupp: **39 av 39 läsbara säger "Leverera inom
3–5 arbetsdagar". Noll säger 1–2.** Talet var avläst ur deras
marknadsföringstext ("Snabb Leverans"), inte ur en produktsida — ett påstående
om oss själva togs för en mätning.

⚠️ **Och leveranstiden SKILJER INTE mellan grupperna** — 3–5 dagar där vi är
mycket billigare, där vi är lite billigare OCH där vi är dyrare. Den förklarar
alltså ingenting om gapet, åt något håll. Det var den hypotesen mätningen
byggdes för att pröva.

De listar dessutom **minst 4 078 Aosom-artikelnummer** (bara överlappet med vår
katalog; deras verkliga tal är högre). Ingen svensk handlare lagerhåller fyra
tusen skrymmande möbelartiklar — så "lager i Sverige" är med all sannolikhet
en marknadsföringsrad ovanpå samma dropship-upplägg som vårt, inte en
kostnadspost som förklarar deras pris.

☠️ **Följden för prisresonemanget nedan är stor.** Om deras kostnad ≈ vår
kostnad är skillnaden i pris **ren marginal**, inte täckning för lager,
returer och bundet kapital. Då finns det mer utrymme att höja än raden nedan
antyder — och de kan samtidigt matcha oss när de vill.

⚠️ **Vad som INTE är mätt:** var paketen faktiskt skickas ifrån. 3–5
arbetsdagar är förenligt både med dropship från Aosom DE och med svenskt
lager plus långsam möbelfrakt. Deras sidor säger "Lagervara" på 35 av 42.
Det som avgör är fraktvillkoren, och dem ser vi inte.

Gränsen går vid ungefär **900 kr i inköp**: under den är vi billigast i 29–50 %
av fallen, över den i 92–100 %.

**Räknat med frakten satt till 30 kr per vara i stället för per paket blir vi
billigast på 55 av 55.** Det största draget i hela Aosom-affären är alltså inte
prisregeln utan att förhandla samlad frakt. Tills dess är urvalet skyddet:
`?skipFreightHeavy=1` på svepet.

### B2B-kontot är en rabatt på varan och ett straff på frakten (mätt 2026-08-27)

Leonard lade samma bod i kassan på aosom.de två gånger, utloggad och
inloggad på B2B-kontot. Utloggad: 207,80 €. Inloggad: 210,39 €. **Kontot gjorde
varan dyrare.**

Feed-raden förklarar varför, och fraktsiffran står ordagrant i kassan:

```
Wholesale Price          123.01 EUR
SE Ship Fee               84.02 EUR   ← exakt talet i B2B-kassan
Shipping Cost Germany     39.38 EUR
Weight (incl. Package)    50.00 kg
Package                        2
```

Det avgörande talet är inte 84 utan **39,38**. Samma order, samma konto, till en
TYSK adress kostar frakten 39,38 € — medan en utloggad konsument betalar 7,90 €
på exakt den rutten. **B2B-frakten är 5× konsumentfrakten inom Tyskland.** Det
handlar alltså inte om avståndet till Sverige: Aosom subventionerar konsument-
frakten (den ligger inbakad i 199,90 €) och fakturerar B2B den råa fraktsedeln.

Netto mot netto — B2B-fakturan är netto, konsumentpriset innehåller 19 % MwSt:

| | vara | frakt | **netto** |
|---|---:|---:|---:|
| Konsument → DE | 167,98 | 6,64 | **174,62 €** |
| B2B → DE | 126,37 | 39,38 | **165,75 €** |
| B2B → SE | 126,37 | 84,02 | **210,39 €** |

Rabatten på själva varan är verklig (−25 %) och räcker så länge paketet stannar i
Tyskland. Till Sverige blir kontot **20 % dyrare än att vara privatperson**. De
207,80 € såg jämna ut bara för att konsumentpriset bär tysk moms vi aldrig får
tillbaka — kassan underdriver problemet.

Och det gäller sortimentet, inte bara den boden. Över feedens 6 056 rader med
både SE- och DE-frakt:

| | SE | DE |
|---|---:|---:|
| Medianfrakt | 26,40 € | 8,59 € |
| Frakt ÷ inköp (median) | **40 %** | **18 %** |
| Rader där frakten kostar mer än varan | **1 283** | **9** |

SE-frakten är **3,07× DE-frakten** (median per rad). "Frakten kostar mer än
varan" är i praktiken uteslutande ett Sverigeleverans-problem.

Vad det är värt, kört mot de 55 dealproffsen-matchningarna vid oförändrad
prisregel och oförändrad 17 % marginal:

| frakt | billigast på |
|---|---:|
| SE-frakt (som idag) | 39/55 |
| **DE-frakt** | **54/55** |
| 30 kr/vara | 55/55 |

De 30 kronorna ovan är ett räkneexempel. **39,38 € är ett pris Aosom redan tar**,
och det ensamt tar oss från 39 till 54 av 55 utan att röra marginalen. Draget är
samlad frakt eller en tysk leveranspunkt vi vidarebefordrar från — inte en ny
prisregel.

☠️ **Köp inte som privatperson som kringgång.** Ingen B2B-faktura, tysk moms som
inte är avdragsgill i Sverige (bara sökbar via Skatteverket, långsamt), ingen
omvänd skattskyldighet — och det skalar inte till 5 566 artiklar.

### Fler länder: feeden har frakten till 40 (2026-10-21)

Leonards fråga: vilka länder kan vi sälja Aosom-varorna i? Feeden har en
fraktavgift per land, `<landskod> Ship Fee` för 39 länder och
`Shipping Cost Germany` för Tyskland (uppmätt 2026-09-15). Det är EU:s 27
länder och 13 utanför EU: Albanien, Andorra, Bosnien och Hercegovina, Färöarna,
Gibraltar, Kosovo, Monaco, Montenegro, Nordmakedonien, San Marino, Serbien,
Turkiet och Vatikanstaten. Norge, Storbritannien och Island saknas. Schweiz
saknades 2026-09-15 men har en kolumn sedan dess (41 länder 2026-10-22).
Motorn läste bara Sveriges.

Workflowen **"Aosom — frakt och skeppbarhet per land"** →
`/api/admin/aosom-lander` → `lib/aosom/frakt-per-land.ts` räknar per land, för
hela feeden, för våra mappade artiklar och för de publicerade:

- hur många varor som går att skicka dit,
- frakten och den landade kostnaden (inköp plus frakt) jämfört med Sverige, som
  medianer per rad.

Momsen ingår inte. Landets momssats läggs på kundpriset för sig.

**Uppmätt 2026-10-22** på de 5 499 publicerade Aosom-artiklarna i feeden, som
medianer av inköp plus frakt jämfört med Sverige: Danmark 0,95, Litauen 0,97,
Lettland 0,99, Estland 1,01 och Finland 1,09. Frakten till Danmark är lägre än
till Sverige på 99,9 % av varorna. Den femdubbla frakten till Baltikum gäller
bara privatpersoner på aosom.de. För oss ligger den nära Sverige.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Svaret bär bara antal, andelar och kvoter.** Avgifterna är inköpsled,
   precis som SE-frakten. Ett test serialiserar svaret och letar efter
   artikelnummer och belopp.
2. ☠️ **Ett annat fel än våra egna spärrar svarar utan sin text** (`felSvar`).
   Ett nätverksfel kan bära feedens adress. Texten står i Vercels logg, med
   adresserna bortbytta.
3. **Samma spärrar som synken.** Färre än `MIN_FEED_RADER` rader i feeden,
   färre än `MIN_WIX_PRODUKTER` synliga produkter eller ingen svensk kolumn ger
   503.
4. **Synken och importen läser feeden som förut.** Landskolumnerna läses bara
   med `parseAosomFeed(text, { fraktPerLand: true })`, och en verklig avgift har
   en definition för alla länder (`arVerkligFrakt`).

⚠️ Där Aosom själva säljer till konsument konkurrerar vi mot deras
subventionerade konsumentfrakt (avsnittet ovan). Den 2026-10-21 svarade
aosom-domänerna för Tyskland, Österrike, Belgien, Nederländerna, Frankrike,
Italien, Spanien, Portugal, Irland, Polen och Rumänien som aosom.de. aosom.dk
och aosom.si är domäner till salu.

### Danskt sortiment och pris per sida (2026-10-22)

Leonard valde 2026-10-22 en egen kassa med Stripe för Danmark, och en start med
Aosom-varor utan el och batterier. Workflowen **"Danmark — sortiment och pris
per sida (krypterat)"** → `/api/admin/landsortiment?land=DK` →
`lib/aosom/landsortiment.ts` svarar sida för sida: om den kan säljas i
Danmark, och vad den kostar där i danska kronor.

En publicerad Aosom-sida kan säljas när varje artikel på den finns i feeden, har
ett inköpspris och en verklig fraktavgift dit, inte har en frakt som kostar mer
än varan och inte har el eller batterier. Priset räknas som synkens regelpris
(inköp plus frakten dit, 25 % dansk moms, husets multiplikator och avrundning),
men i danska kronor med kursen `EUR_TO_DKK` (7,46 som standard). Konkurrentregeln
gäller inte, eftersom den jämför med en svensk butik.

Klassningen av el och batterier (`lib/aosom/el-och-batteri.ts`) läser Aosoms
tyska text och vårt svenska namn, i två nivåer. Starka signaler stoppar sidan.
Breda ord (den första versionens lista, ordagrant) stoppar inget, men en träff
står i listan med ett utdrag ur texten, så att en människa kan se varför en
sida släpptes. Varje träff har en fast etikett, så att loggen kan räkna
etiketter utan att skriva ut text.

**Första körningen (2026-10-22, en enda nivå med de breda orden):** 2 712 av
4 241 Aosom-sidor kunde säljas, 1 340 stoppades av el eller batterier och 224
saknades i feeden. Priset i Danmark var i median 0,96 av det svenska
regelpriset (kvartiler 0,92 och 0,98) och lägre än i Sverige på 99,7 % av
artiklarna. Bland sidorna som kunde säljas hittades ingen vara med el. Men
ungefär 400 av de 1 301 sidor som bara stoppades av el saknade el: soffor med
"Seitentaschen für Fernbedienungen", köksskåp med "Mikrowellenfach", textilier
som tål "Waschmaschine", klätterleksaker för "motorische Fähigkeiten",
skärmtak som dämpar "Geräusche" och kolgrillar som ska "aufheizen". Därav de
två nivåerna.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Klassningen lutar åt att stoppa.** En vara med el eller batterier som
   släpps igenom säljs i Danmark utan registrering för el och batterier. En
   vara som stoppas i onödan säljs bara inte där än. En stark signal räcker,
   och varje mönster som undviker en känd falsk träff har ett test (de från
   första körningen står under "kända falska träffar").
2. ☠️ **Listan bär priser, vårt urval och utdrag ur Aosoms text, och lämnas
   bara ut krypterad.** Workflowen skriver räknarna, etiketterna och kvoten mot
   Sverige, och krypterar listan (gzip, AES och RSA, som
   `leverantorslankar.yml`). Listan bär varken artikelnummer, inköpspris eller
   frakt, inte ens krypterad: utdragen går genom `redigera`. Ett test
   serialiserar svaret och letar.
3. ☠️ **JavaScripts `\b` räknar inte å, ä, ö, ü och ß som bokstäver.** För den
   var W:et i "5 Würfel" ett helt ord, så ett pokerset fick 5 watt. Mönstren
   använder ordgränser med `\p{L}` (`‹` och `›` i `el-och-batteri.ts`).
4. **Negationer tas bort före de starka mönstren** ("funktioniert ohne
   Batterien", "ohne Strom", vårt "utan el"), men bara när de säger det om
   varan själv. "Wird ohne Batterien geliefert" betyder att varan behöver
   batterier, och stoppar.
5. **En sammanslagen sida stoppas helt av en färg som inte går**, och varje
   färg får sitt eget pris. Listan namnger färgen med Wix-variant-id. Ett brett
   ord på en färg som är en stark signal på en annan räknas som starkt.
6. **Bara Aosom-sidor räknas, och bara Danmark.** De andra leverantörerna
   räknas per leverantör och stannar i Sverige. Ett land i euro behöver en egen
   avrundning: charm99 snäpper 89 till 99, alltså tio euro på en vara för 139
   euro. Rutten svarar 400 för andra länder.

⚠️ **Granska utdragen efter varje ändring av mönstren:** de starka på sidor som
stoppas, och de breda på sidor som kan säljas (`svaga.sidorSomKanSaljas` i
loggen säger hur många).

### Vad som INTE är fixat

Momsfällan i `computeProfit` är **lagad 2026-08-29** (se avsnittet ovan):
kostnaden momsas nu av på samma sätt som intäkten, och definitionen delas med
auktionens golvbud i stället för att dupliceras.

Kvar är DATA-sidan av samma fälla: **AliExpress-köp på Business Purpose**
faktureras netto men sparas i `landedCostSek`, som läses som brutto. För dem är
det lagrade talet alltså 20 % för lågt, och nu när `computeProfit` dessutom
delar med 1,25 blir felet synligt åt andra hållet — vinsten ser för hög ut.
Aosom-raderna bruttas upp korrekt vid import (`1287a0a`); AE-raderna gör det
inte, och det går inte att laga i kod utan att veta vilka köp som gjordes på
Business Purpose.

### ☠️ Och AE-radernas kostnad FRYSER vid importen (2026-09-06)

Aosom-halvan räknas om var sjätte timme. AE-halvan räknas aldrig om: synken
LARMAR på en prishöjning (`price_increase` i `decideSyncOutcome`, med
`recommendedPriceSek`) men skriver aldrig tillbaka `costUsd` eller
`landedCostSek` på mappningen. Det nya talet bor i synkens eget tillstånd
(`currentCostUsd`), som varken lönsamhetsöversikten, auktionens golvbud eller
poleringens prisgrind läser.

Uppmätt på barstolarna `a260b888` (order 10030), samma fält som pipelinen
själv läser (`offer_sale_price`):

| | |
|---|---:|
| Mappningens `costUsd` (importtillfället) | 48,98 USD |
| AliExpress `offer_sale_price` idag | **80,07 USD** |
| Skillnad | **+63 %** |

Sidan står på 679 kr. Med `USD_TO_SEK` 10,5 är landat pris 840,74 kr, alltså
**−129 kr netto per såld enhet**; med marknadskursen kunden ser (~750 kr på
AE-sidan) −59 kr. Regelpriset på dagens kostnad hade varit 899–999 kr.

Tre saker att inte missförstå:

1. ⚠️ **Larmet är designen, inte skrivningen.** Att synken låter kundpriset
   stå är rätt — ett automatiskt omprissatt sortiment är en beteendeändring
   med hela katalogen som blast-radie. Felet är att det LAGRADE talet blir
   osant under tiden, och att tre läsare tror på det.
2. ☠️ **Ett svar utan fel är inget kvitto, tionde gången.** Prisgrinden i
   `/api/admin/mapping` svarar `EJ AVGÖRBAR` på AE-rader (`regelGäller` är
   bara sann för `supplier === "aosom"`), så en polering av en AE-produkt vars
   inköp sprungit iväg passerar utan invändning.
3. **Kollen är billig.** `freight-check`-workflowen med `raw=true` ger
   `offer_sale_price` per SKU för en produkt. En katalogomfattande jämförelse
   mot mappningens `costUsd` är däremot ett AE-anrop per produkt och lever
   under `maxApiCalls` — den hör hemma i synken, inte i chatten.
