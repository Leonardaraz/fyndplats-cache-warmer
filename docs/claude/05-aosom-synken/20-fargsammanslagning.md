### Färgsammanslagning: ett utkast blir en FÄRG på en publicerad sida (2026-09-27)

☠️ **Leonards beslut 2026-09-27: alla färger publiceras.** *"har dom olika priser
får dom ha det … är det samma produkt med olika färger ska den finns som olika
alterantiv på samma produkt sida när man sammanslagit dom."* Ett färgsyskon hålls
alltså aldrig tillbaka i väntan på ett beslut, och `FARGSYSKONEN.md` är borttagen.
Varje färg behåller sitt pris. Hur det görs står i runbookens *Dubblettskärmen*.

Leonards fråga: dubblettskärmen hittar utkast som är samma vara som en
publicerad sida i en annan färg — kan de bli ett andra färgval på sidan, med
kopplad bild? Svaret är ja, men bara för att koden först lärt sig att en sida
kan bära **en Aosom-artikel per variant**. Före det läste varje väg radens
artikel för hela sidan, och en sammanslagning hade gett tre dyra fel: synken
hade skrivit den ena färgens saldo på båda (vi säljer en färg Aosom inte har),
beställningsfilen hade beställt fel färg, och importen hade skapat ett nytt
utkast för den andra färgen.

`lib/aosom/artiklar.ts` (`aosomArtikelbild`) är den enda definitionen, med tre
utfall: `en` (radens artikel, **exakt som förut** — varje befintlig rad),
`flera` (en artikel per variant) och `tvetydig` (olika artiklar men inte
entydigt läsbar — då nollas lagret och ordern hålls). Läsarna:

| väg | vad den gör med en sammanslagen sida |
|---|---|
| synken (`lib/aosom/sync.ts`) | saldo och pris PER VARIANT, facit per variant (`getV3VariantPriser`) |
| beställningsfilen (`aosom-order`) | artikeln väljs på orderradens variant-id, sedan SKU, sedan val |
| importens dubblettspärr | ser varianternas artiklar |
| ommappningen | en artikel som sitter som färg är upptagen |
| bildfixen | hoppar över sidan (`sammanslagnaHoppade`) |
| Google-tilläggsfeeden | en rad per färg; grupp och konkurrensläge bara för radens egen artikel |
| poleringens bildsteg | vägrar en lista som tappar en bild ett färgval pekar på |

Sju egenskaper som inte ska tas bort:

1. ☠️ **Orderradens variant-id är NOLLAN för en produkt utan optioner** —
   uppmätt på skarpa ordrar: `catalogReference.options.variantId =
   "00000000-…"`, inte produktens V3-id. Nollan går aldrig att slå upp mot
   mappningen; en order lagd före sammanslagningen matchas därför på SKU.
   Tasken bär `wixVariantId` sedan 2026-09-27.
2. ☠️ **Okända Wix-varianter NOLLAS i synken** (`okandaVarianter`, fäller
   workflow-jobbet även i torrläge). Det är läget efter en halvgjord
   sammanslagning: Wix fick färgen, mappningen gjorde det inte. Den gamla vägen
   hade sålt den nya färgen på den gamla färgens lager. En produkt med EN
   lagerpost skrivs som förut, vad dess id än är.
3. ☠️ **Beställningsfilen håller hela ordern** när en rad inte går att avgöra —
   en halv order är två leveranser och två fraktavgifter.
4. ☠️ **Konkurrentpriset gäller bara radens EGEN artikel.** Det är hämtat för
   den; den andra färgen får husets regel — exakt vad den hade som eget utkast.
5. ☠️ **Sammanslagningen rör inget pris.** Den nya färgen får utkastets pris
   som det står i butiken.
6. ☠️ **Färgen och dess lager skrivs i SAMMA anrop**
   (`products-with-inventory`), så den nya färgen finns aldrig med ett lager vi
   inte satt. Faller skrivningen rullas bilderna tillbaka.
7. **Utkastet pensioneras** (`pensioneraDubblett`) och raderas tidigast fjorton
   dygn senare, se *Pensionerade utkast raderas efter fjorton dygn*. Artikeln
   släpps från dess rad och bor sedan som färg på sidan vi behåller. Bilden som
   blev färgens ligger kvar, för sidan använder samma fil.
8. ☠️ **Varukostnaden tas ur MAPPNINGEN, aldrig ur Wix.** `revenueDetails`
   kommer bara med `fields=MERCHANT_DATA`, som kräver behörigheten
   `SCOPE.STORES.PRODUCT_READ_ADMIN` — saknas den svarar Wix 403 och redan
   planen faller. Båda varianterna får `landedCostSek` som kostnad, samma tal
   importen skriver, och lagret följer varianten: `inventoryItem` bär bara
   `quantity` (schemat har inget id där).

**Så körs den:** workflowen **"Dubbletter — lägg ett utkast som färg eller
storlek på en publicerad sida"** (`plan` · `byt`), rutten `/api/admin/aosom-sammanslagning`,
logiken i `lib/aosom/sammanslagning.ts`. Torrt som default, en sida per
körning, ingen kör-allt-flagga. Två hinder att känna till innan: **sidans namn
får inte bära sidans färg** (`namnet_bar_farg` — skriv om namnet först, med
oförändrad slug). **Sedan 2026-09-30 följer alla givarens bilder med**, med
färgbildsverktygets regler (se *Färgbilderna* nedan): givarens kort stannar,
en opolerad givares bilder från position 2 sparas som `granskas` i stället för
att skrivas, och det som inte ryms under Wix tak (50) sparas i tabellen. Med
`bilder` följer exakt de valda med. Befintliga val behåller hela sina
`linkedMedia`-listor; före det skrev återkopplingen om varje val till sin
första bild. Faller en körning halvvägs ser nästa att Wix redan är klart
(`wix_klar`) och gör bara resten.

⚠️ **Efter första deployen: kör synken i torrläge och läs `okandaVarianter`.**
Talet ska vara noll. Är det inte det finns Aosom-sidor i Wix med varianter
mappningen inte känner till — och de nollas vid nästa skarpa körning.

#### Sammanslagning v2: storlek, fler val och en publicerad givare (2026-09-27)

Leonards fråga efter första sammanslagningen: går det att göra bättre? Verktyget
klarade bara två färger och bara ett utkast in på en publicerad sida. Nu klarar
samma workflow fyra lägen, ett per körning:

| läge | när | vad som skrivs |
|---|---|---|
| `ny` | sidan saknar optioner | optionen skapas med två val |
| `utoka` | sidan är redan sammanslagen | ett val till, befintliga varianter orörda |
| `wix_klar` | en körning föll efter Wix | bara återläsning, mappning och resten |
| `klar` | artikeln sitter redan på sidan | bara givarens efterarbete |

- **Axlar:** `Färg`, `Storlek` eller båda — se nästa avsnitt.
- **Fler val:** kör workflowen en gång per syskon. Sidans värde (`farg_behall`,
  `storlek_behall`) behövs bara första gången en axel läggs till; sedan står
  sidans val i Wix och i mappningen.
- **Publicerad givare** kräver `omdirigera=ja`. Då kopieras givarens recensioner
  till sidan, en 301 skrivs från givarens adress, och givaren avpubliceras och
  pensioneras.

Sex egenskaper som inte ska tas bort:

1. ☠️ **`utoka` tar optionen och varianterna ur GET:en.** Ett handbyggt objekt
   hade tappat valens kopplade bilder och varianternas id — samma regel som
   `visible` och `options` i prissynken. Ett test fäller om id eller bild tappas.
2. ☠️ **Omdirigeringen skrivs FÖRE avpubliceringen.** Butiken läser
   `FyndplatsRedirects` först på 404-vägen, så en rad som skrivs medan givaren
   ligger ute gör ingenting — och i omvänd ordning svarar adressen 404 i
   mellanrummet. Omdirigeringar som redan pekade PÅ givaren pekas om, så ingen
   kedja uppstår.
3. ☠️ **Recensionerna KOPIERAS, originalen rörs inte.** Dolda rader följer inte
   med, och inte heller en recension sidan redan har (samma id eller samma text
   — Aosom visar ibland samma recension på syskonartiklar).
4. ☠️ **En givare med obehandlade ordrar vägras** (`givaren_har_oppna_ordrar`).
   Beställningsfilen läser artikeln ur givarens mappning, och pensioneringen
   släpper den.
5. ☠️ **Priset rörs inte av sammanslagningen — men synken tar över det.** Det
   nya valet följer husets regel från nästa körning. För ett utkast är det vad
   det hade; för en givare med konkurrentpris eller prislås är det inte, och
   planen varnar.
6. **Omdirigeringslistan läses med ett tak** (`MAX_OMDIRIGERINGAR`), eftersom
   `listRedirects` inte sidar. Når listan taket vägrar verktyget hellre än
   missar en kedja.

⚠️ **Utkast som bara har varandra slås ihop EFTER poleringen, inte före.**
Poleringens skrivsteg (`skrivplan.ts`) skriver SKU:n på en sida med en variant.
Polera därför ett av syskonen, publicera det, och lägg sedan de andra som val med
den här workflowen — samma väg som balansbommen.

☠️ **Värdens egna foton länkas efter alt-texten, och en alt-text som nämner givarens färg
tappar fotot (2026-10-25).** Sammanslagningen länkar värdens foton till värdens färg med
butikens ägarregler (`olankadeAgare`): en olänkad bild som nämner exakt en av sidans två
färger hör till den färgen. Klöstunnan `56cb4143` (Beige, givare Grå) hade en beige soffbild
med `en grå och vit katt` i alt-texten. Fotot tolkades som Grås, länkades inte till Beige,
och butiken visade det bara under Grå. Skrivningen gick som planerad och ingen kontroll
fällde, så det syntes först i värdens galleri efter sammanslagningen. Lagat 07:22 UTC med
`bygg-lank.py` (bild 5 länkad till Beige, Beige 4 → 5 länkade bilder), och rättningen
upprepas inte av sig själv. Två skydd: `tools/polish-gates/gate-vardalt-farg.py` fäller en
sådan alt-text före pushen (mot `merge_<prefix>.json`, portad ur `fargbilder.ts` och
självprovad), och `tools/polish-kedja/mkgalleri.py` läser värdens galleri, valens länkar och
vyn per val i ett anrop efter varje sammanslagning. Skriv hellre `en katt` än `en grå katt`
i en värdbilds alt-text. Kort och måttbilder är gemensamma med flit och berörs inte.

#### Givarens 301 landar på givarens färg (2026-10-06)

Leonard 2026-10-06: en gammal färgsida ska landa på sin färg på den
sammanslagna sidan, inte på sidans förval. Steg 5b läser sidan efter
Wix-skrivningen och skriver `/produkt/<sida>?variant=<givarens variant>`;
butiken förväljer varianten ur `?variant=`, samma väg som Shopping-flödets
länkar. Äldre rader som pekade på givaren pekas om till samma mål. Planen
visar adressen utan fråga, eftersom variant-id:t finns först efter
skrivningen, och krockkontrollen jämför sökvägen utan fråga (`malUtanFraga`).

De 325 rader som fanns före ändringen rättas med `POST
/api/admin/omdirigeringar-variant` (workflow `omdirigeringar-variant.yml`,
torrt som default). Givarens artikel på den pensionerade mappningen
(`variants[0].supplierVariantId`) matchas mot sidans mappningsvariant och
dess `wixVariantId`, som måste finnas i Wix. ☠️ Allt som inte går att avgöra
exakt lämnas orört och räknas per skäl: raden pekar redan på rätt sida.
Logiken: `lib/aosom/omdirigering-variant.ts`.

#### En sammanslagen sida får ny text med `varianter` i planen (2026-09-30)

Leonards fråga: varför läggs lyftfåtöljens grå färg inte på? Sidan var redan
sammanslagen och texten räknade upp två färger. En tredje färg kräver ny text,
och skrivworkflowen vägrade allt utom en variant, eftersom SKU-steget skriver en
SKU på alla varianter och återläsningen jämför en. Den enda andra vägen var en
PATCH för hand, och all skrivning går via workflowerna.

En produkt i skrivplanen kan nu bära `varianter` (två eller fler) i stället för
`sku` och `variantId`. Rundan anger den i `sammanslagna.tsv`. Tre egenskaper som
inte ska tas bort:

1. ☠️ **SKU-steget rör inte sidan.** Varje färg bär sin egen SKU från
   sammanslagningen. Steget lägger en SKU på alla varianter, så på en
   sammanslagen sida hade alla färger fått samma SKU. Planen vägrar en sådan
   produkt med sku eller variantId.
2. ☠️ **Återläsningen kräver att alla varianter finns kvar och syns.**
   Antalet ska stämma med planen och varenda variant ska vara `visible`. En
   osynlig variant visar färgen som slutsåld (2026-09-06).
3. **Stämpeln skriver inga variantSkus**, bara `needsAiPolish` och
   `draftStatus`.

Bildsteget var redan byggt för det här: det vägrar en lista som tappar en bild
ett färgval pekar på.

#### Färg och storlek på samma sida (2026-09-27)

Leonards fråga: går det att ha färg och storlek på samma sida på en gång? Ja.
Svepet räknade **12 familjer** som skiljer sig på båda (av 679), och butiken
klarade det redan: väljaren för AliExpress-sidorna (headless-site,
`lib/variant-multi.ts`) har två axlar, dämpar en kombination som saknas och byter
till en som finns. Synken, beställningsfilen och feeden läser per variant. Det
som saknades var verktyget.

**Inputs:** givarens värde på varje axel sidan har eller får (`farg_utkast`,
`storlek_utkast`), och sidans värde bara på en axel den får för första gången
(`farg_behall`, `storlek_behall`). `axel` finns inte längre — rutten svarar 400
på den gamla kroppen, eftersom den bar storleken i `fargUtkast`.

| sidan har | givaren anger | resultat |
|---|---|---|
| inga val | färg + storlek (och sidans båda) | två axlar, två varianter |
| färg | färg + storlek (och sidans storlek) | storleksaxeln läggs till, de gamla varianterna får sidans storlek |
| färg + storlek | färg + storlek | en variant till, nya val bara där värdet är nytt |

Sju egenskaper som inte ska tas bort:

1. ☠️ **Alla kombinationer behöver inte finnas.** Wix tillåter färre varianter
   än kombinationer (dokumenterat), och en kombination Aosom inte säljer ska inte
   finnas på sidan. Planen varnar med antalet som saknas (`saknadeKombinationer`).
2. ☠️ **Givarens värde stavas som sidans.** "grå" på en sida med "Grå" är samma
   val. Utan det hade Wix fått ett andra val med samma namn.
3. ☠️ **Färgen bär bilden.** Butiken tar kombinationens bild från färgaxeln när
   den finns (`lib/variant-price.ts`, Leonards regel 2026-08-08). En ny färg får
   givarens huvudbild. En ny storlek i en färg sidan redan har tar ingen bild som
   standard, för den visar samma vara. En storlekssida som får färg behåller
   storlekarnas bilder, och sidans egen färg får ingen, så de gamla varianterna
   fortsätter visa sin storleks bild.
4. ☠️ **Varje befintlig variant kontrolleras på alla axlar** efter skrivningen.
   Bär en variant fel val skrivs ingen mappning, och synken nollar den nya
   varianten tills en omkörning är klar.
5. **Hinder med två axlar:** `saknar_farg_utkast` och `saknar_storlek_utkast`
   (givaren måste ange sitt värde på varje axel sidan har), `saknar_*_behall`
   (en ny axel utan sidans värde), `*_lika` (en ny axel där sidan och givaren
   har samma värde skiljer ingenting åt) och `kombinationen_finns`.
6. **Standard-SKU:n tar storleken före färgen** (`FP-stol-110-cm-gra`).
   Artikelnummerspärren fäller färgen före ett tresiffrigt mått (tre tecken,
   bindestreck, tre siffror), men inte måttet före färgen. Slutar sidans SKU
   på ett ord med tre tecken kan den ändå fällas (`sku_ogiltig`), och då anges
   SKU:n för hand.

   ☠️ **Och Wix tar högst 40 tecken** (`SKU_MAX` i `lib/import/sku.ts`, uppmätt
   i `gate-sku.py`). Sidans SKU plus givarens värden spränger det lätt. Formen
   släppte igenom 93 tecken, så en för lång SKU föll först i `byt`, på en 400
   från Wix, efter att planen sett ren ut. Sedan 2026-09-27 fäller planen den
   (`sku_for_lang`), och SKU:n anges för hand.
7. ☠️ **Sidans namn får inte bära ett värde sidan redan har på en axel, och
   SKU:n får inte få artikelnummerform åt något håll.** Planen fäller
   `namnet_bar_farg` och `namnet_bar_storlek` när namnet innehåller ett av
   axelns värden som helt ord ("grönt" är inte "grön"), och `sku_ogiltig` på
   formen tre tecken, bindestreck, tre eller fler tecken med en siffra, både för
   `vit-170` och `445-vit`. Sätt `-cm-` mellan måttet och färgen. Kör `plan` på
   sammanslagningen FÖRE värdrundan skrivs: T95 (2026-10-24) behövde en extra
   runda (T95b, bara ett nytt namn) för att växthusets namn bar sidans storlek.

☠️ **En färg utan kopplad bild stoppar mappningen (2026-09-27).** Återläsningen
försöker koppla valens bilder åtta gånger. Tidigare varnade den sedan
"kör om för att koppla", men skrev ändå mappningen och pensionerade givaren. Då
hamnade omkörningen i `klar`, som bara gör givarens efterarbete och svarade
"redan sammanslagen — ingenting att göra" medan färgen fortfarande visade fel
foto. Nu returnerar körningen fel innan mappningen skrivs, och omkörningen ser
`wix_klar` och kopplar igen. Runbookens regel om en bild per färg (#667) byggde
på att omkörningen fungerar, och ett test låser det: bilden faller i första
körningen och kopplas i den andra.

☠️ **Wix stavar ett nytt val som den delade listan, och bildkartan måste tåla
det (2026-09-30).** Ett val som redan finns i butikens delade lista sparas med
listans stavning: sidans "Svart och röd" blev "Svart och Röd". Allt annat i
sammanslagningen jämför skiftlägesokänsligt (`lika`), men bildkartan slogs upp
exakt. Valet hittades aldrig, körningen föll på "1 val saknar kopplad bild
efter 8 försök", och omkörningen föll likadant (B69, B87). Kartan slås nu upp
med `bildFor`/`satt`, och två tester låser det: ett där Wix stavar om sidans
färg, och ett där omkörningen efter en fallen koppling räknar valet en gång.

☠️ **Omdirigeringsrutten frågar per adress och läser aldrig hela katalogen
(2026-09-30).** `findRedirectConflicts` behöver veta om en eller två slugs är
synliga produkter, men läste hela katalogen för att få veta det. Att stryka
`PLAIN_DESCRIPTION` (`4a0dd284`) räckte inte: katalogen är 6 311 produkter på
64 sidor, ~1 s per sida, alltså ~63 s bara för läsningen mot ruttens tak på 60.
`redirect-add.yml` dog med 504 två gånger samma kväll på EN rad, som fick
kontrolleras för hand och skrivas med `force`.

Nu ställs en exakt slug-fråga per berörd adress (`slugArSynligProdukt`), med en
kontrollfråga före (`katalogenHarSynligProdukt`). Kvällens rad tar 0,18–0,25 s
mot Wix i stället för ~63. Uppmätt mot skarpa V3 samma dag, och det är därför
frågan ser ut som den gör:

| fråga | svar |
| :-- | :-- |
| `filter: { slug }`, levande slug | 1 träff, `visible: true`, ~0,1 s |
| samma, ett utkasts slug | 1 träff, `visible: false` |
| samma, borttagen slug | `{"products":[],"pagingMetadata":{"count":0,…}}` |
| samma slug i VERSALER | **0 träffar** — filtret är skiftlägeskänsligt |
| okänt filterfält | 400 *"not declared as filterable"* — ignoreras INTE tyst |
| `$startsWith` på slug | avvisas (fältet är en HashedString) |

Fyra egenskaper som inte ska tas bort:

1. ☠️ **"Ingen träff" ÄR godkännandet, så ett trasigt svar får aldrig se ut
   som ett.** Ett svar utan `products`-lista kastar, och en träff med en ANNAN
   slug kastar (då bet filtret inte). Allt som kastar blir en konflikt på varje
   rad, och rutten skriver ingenting.
2. ☠️ **Kontrollfrågan ersätter tom-katalog-spärren.** Med en fråga per adress
   hade en tom eller felkopplad katalog (fel site-id) godkänt varje källa. Den
   frågar efter EN synlig produkt: katalogens första produkt utan filter är ett
   utkast, så en ofiltrerad fråga hade inte bevisat någonting.
3. **Slugen gemenas före frågan.** Det är förlustfritt bara för att Wix slugs är
   gemena: 0 av 6 311 bar en versal. Börjar Wix spara versaler måste det mätas om.
4. **Begränsad samtidighet** (`SAMTIDIGA_SLUGFRAGOR = 4`), och varje adress
   frågas en gång. En rad kostar tre frågor, femtio rader ett par sekunder.

Allt-eller-inget och `force=1` bor i rutten och är oförändrade; de låses sedan
samma dag av `app/api/admin/redirects/route.test.ts`. Verifierat genom att
återinföra buggarna en i taget (obegränsad fan-out, borttagen kontrollfråga,
saknat `visible` som dött, ingen slug-kontroll, rutten som skriver trots
konflikt): rätt test fäller, och bara det.

⚠️ **Wix delar valen över hela butiken, och `lib/wix/limits.ts` är inaktuell om
det.** Kommentaren där säger att en delad option ("customization") tar högst 100
val och att Storlek låg på ~97. Uppmätt 2026-09-27: `Färg` (TEXT_CHOICES) har
**293** val och `Storlek` **203**, och importerna fungerar. Taket på 100 per
delad option gäller alltså inte i dag. Nya storleksvärden tar ändå en plats var i
den delade listan, så välj korta, återanvändbara etiketter där det går.
