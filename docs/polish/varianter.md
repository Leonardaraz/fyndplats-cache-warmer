# Varianter – mekanik

> **Gäller produkter med flera varianter, i praktiken AliExpress-sidor.** AliExpress
> importeras inte längre (2026-09-27), och [`seo-polish-runbook.md`](../seo-polish-runbook.md)
> täcker bara Aosom-utkast, som har en enda variant. Därför står reglerna här:
>
> - Ta bort varianter som inte finns eller är slutsålda, både valet och dess bilder.
> - Uttags- och spänningsaxeln får bara ha EU-värdet.
> - Varje variant som ser olika ut har en egen bild.
> - Variantetiketten bär aldrig en obekräftad prestandasiffra.
> - Den billigaste varianten ligger först i valen *(Leonard 2026-08-26)*.
> - En PATCH av `media.itemsInfo` nollställer `linkedMedia` på alla val, så
>   `options` och `variantsInfo` skickas med i samma PATCH.
>
> Stegnummer längre ned (Steg 4, 8, 9, 11B, 11C) syftar på runbookens äldre version.
>
> Den här filen är **hur** man genomför det i Wix V3 — PATCH-kroppar, låsningar och
> följdsteg som inte sker av sig själva.

-----

## Döpa om variantalternativ i efterhand (Wix V3)

Rå AliExpress-varianter kan bära namn som är obegripliga eller direkt vilseledande. Mediahyllan `1dd82a63` hade en option som hette **"Färg"** men innehöll fem möbeltyper, och suffixen **TypeA/TypeB betydde motsatta saker beroende på färg**: `24 rader Svart TypeB` var en bred hylla för 1 899 kr, `24 rader Brun TypeB` ett skåp med dörrar för 3 939 kr. **Priset följer möbeln, bokstaven gör det inte** — använd priset som facit när du avkodar leverantörens etiketter, och titta på varje variantbild innan du döper om.

**Omdöpning på plats går INTE.** `choice.name` speglar den låsta `choice.key`. Ett försök att PATCH:a nya namn med bevarade `choiceId` ger `428 MISSING_VARIANT_OPTION_CHOICE` med `optionsMissingChoice: ["färg","modell"]` — Wix tolkar det som "ta bort optionen, skapa en ny" och hittar då varken gamla eller nya val. PATCH:en faller atomiskt, så inget går sönder av försöket.

**Rätt väg — ersätt optionen och laga följdskadorna i ordning:**

1. **Säkerhetskopiera först** till scratchpad: per variant `sku`, `wixVariantId`, pris, synlighet, lagersaldo och lagerpostens id. Utan den kan du inte återställa.
2. **PATCH `options` + `variantsInfo`** (`fieldMask: ["options","variantsInfo"]`). Skicka optionen HELT utan id:n — nytt `name`, nya `choices` med bara `name` + `choiceType` — och identifiera varje variant med `optionChoiceNames` (`optionName` + `choiceName` + `renderType`, alla tre krävs). **Behåll varje `sku` och pris exakt.** `linkedMedia: [{id}]` kan skickas inline med de nya valen och överlever — variantbilderna behöver alltså inte länkas om separat.
   - ☠️ **`choice.name` får vara högst 50 tecken.** Över det svarar Wix `400 MAX_LENGTH` och namnger varje för långt val med sin faktiska längd. Gränsen är lätt att spränga när etiketten ska bära mått + utförande + färg (`128–191 × 144–187 cm – dubbelstång, krom, utdragbar` = 51). Räkna före PATCH:en och korta det minst särskiljande ledet — hela PATCH:en faller annars, och produkten står kvar i det kollapsade mellanläget.
   - ⚠️ **Kollapsen flippar `visible` till `true`.** Punkt 2 ovan körs i två PATCH:ar (först `options: []` + EN variant utan choices, sedan den nya optionen), och den första sätter tyst tillbaka produkten till synlig. På ett utkast betyder det att en halvfärdig produkt utan varianter ligger publicerad tills nästa PATCH går igenom. **Skicka därför alltid `visible` explicit i PATCH nummer två** — och läs av `visible` i svaret på båda, aldrig bara på den sista.
3. **Skapa lagerposterna på nytt.** `/stores/v3/products` skapar dem INTE (bara `/products-with-inventory` gör det vid create). Efter steg 2 har produkten noll lagerposter medan den ligger publicerad. Kör `POST /stores/v3/bulk/inventory-items/create` med `{productId, variantId, trackQuantity:true, quantity}` och verifiera saldo mot säkerhetskopian.
4. **Peka om mappningen.** Allt nedströms nycklar på `wixVariantId`: lagersynken (`lib/sync/inventory.ts:27`), `lib/sync/shippability.ts:151` och auktionsmotorn (`lib/auction/seed.ts:96`). Missar du det slutar lagret tyst att uppdateras — varianterna hamnar i `unmatched`, ingen krasch.
5. **Skriv om mappningens `choices` också.** `lib/orders/place-order.ts:66` matchar order → AliExpress-SKU på `v.choices[optionNamn] === valt värde`. Byter optionen namn från "Färg" till "Modell" matchar inget. **Räddningen är att SKU testas först** (rad 62) — därför är regeln: byt aldrig SKU i samma operation.

**Kontrollera till sist** att auktionsraden inte har state med gamla variant-ID (tomt = inget att så om). Raderna bor i Postgres sedan 2026-09-29 (`AUCTIONS_BACKEND`), inte i Wix Data — läs dem via motorn, inte ur kollektionen `FyndplatsAuctions`, och att synken inte skriver tillbaka de gamla namnen — `lib/sync/aliexpress-sync.ts` rör varken `options` eller `variantsInfo`, så omdöpningen är beständig.

**Sajten visar gamla namn i upp till 5 minuter** efteråt: headless-PDP:n är ISR med `x-nextjs-stale-time: 300`. Verifiera mot Wix-API:t direkt, och kontrollera sidan igen efter cachefönstret innan du rapporterar klart.

> ☠️ **Inga Fyndplats-kort (Leonard 2026-10-27).** Kortpipelinen som stod här (engelska
> spec-blad till svenska spec-kort, `cardkit`-mallen, renderingsfällorna och grundningsregeln)
> är flyttad ordagrant till [`../arkiv/fyndplats-kort.md`](../arkiv/fyndplats-kort.md). Vi bygger
> inga kort längre, och en variant utan egen användbar bild flaggas eller tas bort enligt
> runbooken.

> ☠️ **Efter ett galleribyte måste `linkedMedia` återställas** — samma fälla, beskriven en gång i runbookens Steg 9. Återställningen kräver `variantsInfo` verbatim i samma PATCH, annars 428 `MISSING_VARIANT_OPTION_CHOICE`.

-----

-----

# Sanera varianter (AliExpress-listningar)

> Aosom-rader har en enda variant utan optioner — hela det här avsnittet är då en
> no-op. Det gäller AliExpress-listningar, som buntar modeller, färger och
> uttagstyper på samma sida. Reglerna flyttades hit från runbookens Steg 11
> 2026-08-29 för att hålla polerings-flödet läsbart; de gäller oförändrat.

## Ta bort bilder för varianter som inte finns eller är slutsålda

Rå-importer buntar ibland flera modeller/storlekar under EN listning och släpar med leverantörens **spec-ark för varianter som inte säljs**. Regel: när du SEO-polerar och en variant/modell **inte finns eller är slut hos leverantören**, ta bort **både** valet (om det finns som option) **och dess bilder** — spec-ark, variantfoton och ev. `linkedMedia` — och skriv SEO/specar efter bara det som är kvar.

> **Gäller även en RIKTIG (mappad) variant som bara är `inStock:false`** — inte bara phantom-/obundna modeller. Regeln är "slut hos leverantören → bort", så en variant som har en egen `supplierVariantId` men är slut tas ändå bort (den kan re-läggas om den kommer i lager igen). Verifierat på racingstället `40955353` (2026-07-08): "Typ A" var slut → togs bort.
>
> **Blir bara EN variant kvar → kollapsa hela optionen till en enkel-variant-produkt** (inte en option med ett enda val — ful dropdown). PATCH: `options:[]` + `variantsInfo.variants:[{ id:<behållna variantens id>, choices:[], sku, price, inventoryStatus }]` (V3 accepterar det; SKU blir `FP-<produkt>` utan variant-del). Byt **också** ut ev. feature-/hjältebilder som visar den BORTTAGNA variantens exemplar (t.ex. ett urklipp gjort ur den slutsålda modellens bild) mot den kvarvarande variantens — annars visar galleriet en produkt kunden inte kan köpa. Ta bort "två storlekar"/"Typ A/B"-språk ur namn, meta, beskrivning och FAQ.

## Ta bort variantvärden vi inte får sälja till en svensk kund

Elprodukter från
AliExpress listas nästan alltid med en **uttags-/spänningsaxel** — `Kontakttyp: EU/US/UK/AU/KR`,
`Spänning: 110 V / 220-240V`, `Kontakt: 100V-240V UK-kontakt`. Bara EU-värdet är säljbart här:
UK är Type G, US/AU har fel stift, och 110 V-varianten är fel nät. Behåll **EU-värdet och
ingenting annat**, oavsett hur mycket lager syskonen har.

> Detta är en **variant**-regel, inte en produktregel — produkten stannar, axeln försvinner.
> Kollapsa enligt regeln ovan: uttagsaxeln har i praktiken alltid exakt ETT EU-värde, så hela
> axeln ska bort, inte reduceras till en dropdown med ett val. Övriga axlar (Färg, Modell,
> Paket) lämnas orörda.
>
> **Priset följer med och det är hela poängen:** EU-varianten är ofta billigare än syskonen
> (köksmaskin 6 L 1889 vs 1989 kr, kaffekvarn CG210 **1239 vs 1719 kr**, köksmaskin 7 L 2199
> vs 2809 kr). Skicka därför den överlevande variantens EGNA `price` i PATCH:en — inte
> produktens gamla intervall.
>
> ✅ **Kollapsa genom att skicka den överlevande variantens BEFINTLIGA `id` — då slipper du
> följdsteg 1 helt (verifierat 2026-08-23).** Skickar du `options: []` +
> `variantsInfo.variants:[{ id:<befintligt variant-id>, choices: [], sku, price, visible:true }]`
> behåller varianten sitt `variantId` **och sin lagerpost**. Kabelskalaren `4f38a11c` gick från
> två färgval till enkelvariant med `variantId` och alla 49 i lager orörda. Följdsteg 1 nedan
> gäller den andra vägen: bygger du om optionen med `optionChoiceNames` i stället för att peka
> på id:t räknas varianterna om, och då ryker både id och lagerpost.
>
> ☠️ **Två följdsteg som INTE sker av sig själva:**
> 1. **Lagerposterna raderas** när optionen byggs om (se ✅-noten ovan — pekar du på det
>    befintliga variant-id:t händer det inte), och den överlevande varianten får ett
>    **nytt** `variantId` utan lagerpost (= slutsåld i butiken). Läs saldona FÖRE PATCH:en och
>    `POST /stores/v3/inventory-items` per ny variant efteråt (`locationId` från en befintlig
>    post). Wix städar själv de föräldralösa posterna — de behöver inte raderas.
>
>    ☠️ **Att posten finns räcker inte — flaggan räknas inte alltid om.** Ryggsäcken `311c8c4e`
>    (2026-08-26): tre nya lagerposter skapades i samma anrop, två av varianterna slog om till
>    `inStock:true`, den tredje stod kvar på `false` trots `quantity:30` och
>    `availabilityStatus:"IN_STOCK"` på sin egen post. Det är inte eftersläpning — den satt kvar
>    över flera läsningar, och en PATCH som skrev tillbaka **samma** saldo ändrade ingenting.
>    Det som löste det var en **riktig** saldoändring: sätt ett annat tal, läs, sätt tillbaka.
>
>    **Verifiera därför alltid per variant efteråt** — `variantsInfo.variants[].inventoryStatus.inStock`
>    på produkten, inte bara `availabilityStatus` på lagerposten. De kan säga olika saker, och det
>    är produktens flagga kunden möter. En variant som står kvar som slutsåld syns inte i någon
>    logg; den går bara inte att lägga i varukorgen.

   ```js
   // knuffa flaggan: ett annat tal, sedan tillbaka
   for (const q of [saldo + 1, saldo]) {
     const post = await lasPost(variantId);
     await wix.request({ scope: "site", method: "PATCH",
       url: `https://www.wixapis.com/stores/v3/inventory-items/${post.id}`,
       body: { inventoryItem: { revision: post.revision, quantity: q } } });
   }
   ```
> 2. **Mappningsraden pekar fel.** `FyndplatsMappings.variants[]` har kvar en rad per borttagen
>    variant, och den överlevandes `wixVariantId` är dött → en order skulle gå på fel eller
>    inget leverantörs-SKU. **Matcha på `wixVariantId`, inte på `sku`.** Raden sa tidigare `sku`
>    "eftersom den överlever PATCH:en" — det stämmer inte när Steg 8 redan har försvenskat
>    SKU:n: då står `FP-kabelskalare-borrmaskin` i Wix mot `FP-hibrew-automatic-burr-eu` i
>    mappningen och en SKU-koppling ger tyst noll träffar (samma drift som katalogsvepen
>    längst ned varnar för). Släng raderna utan träff, sätt `wixVariantId` och stryk den
>    borttagna axeln ur `choices`. `PATCH /wix-data/v2/items/{id}` med
>    `fieldModifications:[{fieldPath:"variants",action:"SET_FIELD",setFieldOptions:{value:[…]}}]`.
> 3. **Skriv samtidigt mappningens `sku` till den nya** — annars ärver nästa polering samma
>    drift. Steg 8 rör bara Wix-sidan.
>
>    ⚠️ **Går PATCH:en inte fram — skriv hela raden med `PUT` i stället.** `PATCH
>    /wix-data/v2/items/{id}` har svarat `fieldModifications has size 0` trots en ifylld lista
>    (gatewayen är kinkig med bodyns form: `fieldModifications` ligger ibland direkt i bodyn,
>    ibland inne i ett `patch`-objekt — se 14B). Det som alltid biter är en full ersättning:
>    `PUT https://www.wixapis.com/wix-data/v2/items/{id}` med
>    `{ dataCollectionId: "FyndplatsMappings", dataItem: { id, data } }`. Priset är att `data`
>    **ersätts i sin helhet** — läs raden först och skicka tillbaka allt du inte ändrar, annars
>    tömmer du `shipsFromCountries`, `imageAnalysis` och resten tyst. Samma väg användes för att
>    reparera det typade `needsAiPolish`-värdet (se Fasta fakta).
>
> *(Svepet 2026-08-21: 22 nyimporterade köksmaskiner, 21 av dem med uttagsaxel — 123 varianter
> ned till 37. Utan regeln hade en svensk kund kunnat beställa en 110 V-juicer med US-stickpropp.)*

## "Dubblettfärger" är oftast två olika modeller

**TITTA innan du slår ihop.** Ser en
färgaxel ut att lista samma färg två gånger (`Vit` + `Vit (BMF201 White)`, `Svart` +
`Svart (BMF201 Black)`), är den vanligaste förklaringen INTE att säljaren råkat lista samma
vara dubbelt. Det är att listningen buntar **två olika modeller** i samma färger, och att
modellkoden hamnat i värdet. Bygg kontaktkartan över valens `linkedMedia` (Steg 4) och
jämför exemplaren innan du rör något.

> *(Mjölkskummaren `4a84e755`, 2026-08-21: de fyra "färgerna" var en display-/touchmodell och
> en vredmodell, i vit och svart. Att slå ihop dem hade raderat en riktig produktvariant.)*
>
> **Utvidga sedan jämförelsen till katalogen.** Samma svep avslöjade det egentliga felet: BÅDA
> maskinerna fanns redan som egna utkast — vredmodellen som `f207cfde`, displaymodellen som
> `8047b74e` — till **1429 kr från EU-lager**, mot den kombinerade listningens **1639 kr från
> Kina**. Den kombinerade tillförde ingen kombination som saknades och raderades.
>
> **Regel:** när en kombinerad listning täcker samma exemplar som två fristående, behåll de
> fristående. De är nästan alltid billigare (säljaren tar betalt för bekvämligheten), har oftare
> EU-lager, och ger en ren produktsida per maskin i stället för en axel som blandar modell och
> färg. Radera den kombinerade och märk mappningsraden `draftStatus:"rejected"` med tömd
> `variants[]` — behåll `supplierProductId` så dubblett-spärren hindrar en omimport, och
> `sourceUrl` så den går att hämta tillbaka medvetet med `allowDuplicate:true`.
>
> Överlever den kombinerade listningen i stället: **döp om axeln efter den verkliga skillnaden**
> ("Vit med vred" / "Vit med display"), inte efter leverantörens modellkod. Kom ihåg att
> `choice.name` är låst till `key` — namnen kräver att optionen byggs om från grunden, med
> `choiceType:"CHOICE_TEXT"` på varje nytt val och `price` på varje variant.

#### Omvänt fall: modellnamnet räcker inte för att kalla något en dubblett

11E varnar för att slå ihop det som ser likadant ut. Fällan går lika ofta åt andra hållet:
två listningar bär samma modellnamn, och man tar bort varianten ur den dyrare — trots att
det är två olika tält, cyklar eller maskiner.

> *(Naturehike Mongar, 2026-08-26.* `a6128860` *bar `2P -210T BASE- Blå` för 2 189 kr och*
> `3e9796c2` *bar `2P - 210T - Blå` för 2 119 kr. Samma märke, samma tyg, samma storlek,
> samma färg, 70 kr isär — en dubblett, tycktes det. Leverantörens EGNA swatch-kort sa något
> annat: `MONGAR BASE 2 · 43×18cm · 2,74 kg` mot `MONGAR 2 · 50×15cm · 2,4 kg`. Två modeller
> ur samma familj. Tillverkarens sortiment listar dem separat: **Mongar**, **Mongar BASE**,
> **Mongar Pro** och **Mongar UL** — fyra tält, ett gemensamt namn.)*

**Det som avgör är måtten, inte namnet.** Packmått och vikt skiljer sig alltid mellan två
modeller och aldrig mellan två färger av samma modell. Står de på leverantörens kort har du
svaret gratis; gör de inte det, slå upp modellen hos tillverkaren innan du tar bort något.

**Regel:** innan en variant tas bort som dubblett måste minst två mått stämma överens med
den som behålls — packmått och vikt, eller golvyta och vikt. Stämmer bara namnet och priset
är det INTE en dubblett. Ett borttaget säljbart exemplar syns aldrig i någon logg; det bara
slutar finnas.

Överlever ändå inte varianten (den passar inte sidans copy, resten av modellen är slutsåld),
**skriv ut det i rapporten** — vilken modell som försvann, till vilket pris, och vad kunden
kan köpa i stället. Det är ett beslut för en människa, inte en städning.

## Siffror i variantetiketten måste vara verifierade

Variantetiketten är det första och mest framträdande stället kunden möter en siffra: den
står i köpknappens rullgardin, i varukorgen och på ordern. **Leverantörens obekräftade
siffror hör inte hemma där.**

Klädställningen `f677f645` (2026-08-21) bar etiketten
`128–191 × 144–187 cm – dubbelstång, krom, 272 kg` medan hela beskrivningen — spec-tabell,
FAQ, ett äldre Fyndplats-kort och "Det du bör veta" — förklarade att tillverkarens egen manual anger **140 kg**
och att leverantörens 272 kg är nära dubbelt så mycket. Kunden såg alltså den siffra vi
just motbevisat, på det mest synliga stället av alla.

**Regel:** i etiketten får bara stå det som är egenskaper (mått, antal stänger, färg,
ytbehandling) eller siffror vi kan stå för. Bärförmåga, effekt, räckvidd, kapacitet och
liknande prestandasiffror flyttas till spec-tabellen, **med källan utskriven**
(*"enligt tillverkarens manual"* respektive *"enligt leverantören"*).

Hittar du bara EN siffra som går att stämma av mot en manual och den visar sig uppblåst,
behandla resten av leverantörens siffror i samma listning som lika osäkra — skriv ut
källan på dem också i stället för att presentera dem som fakta. Att ta bort varianten är
sällan rätt svar: varan går att sälja, det är påståendet som ska bort.

Omdöpningen kräver ombyggd option (se [*Döpa om variantalternativ*](polish/varianter.md)) — planera
den i samma vända som övriga variantändringar så du bara betalar följdskadorna en gång.

-----

## Varje variant har sin egen bild

⚠️ **Varje variant har sin EGEN bild — slå ALDRIG ihop två varianter på samma bild. Lärdom 2026-07-09 (Leonard fångade det två gånger).** Frestelsen: två storlekar/modeller ser "nästan lika" ut → peka bådas `linkedMedia` på samma hjälte. Fel — kunden ska se exakt den variant hen väljer. Volleybollnätet (**gult** nät 1,25 tum vs **orange** nät 1,75 tum) och hund-cykelvagnen (liten boxig PTS101/30 kg vs stor avlång PTS21-C/40 kg) har genuint olika exemplar. Har du bara EN bild:
- **Återskapa den saknade varianten ur källan.** Käll-bilderna ligger i CMS: `GET /data/v2/items/{PRODUCT_ID}?dataCollectionId=FyndplatsMappings` → fältet `imageAnalysis` listar AliExpress käll-URL:er (`ae01.alicdn.com`, hämtas **direkt med curl** — till skillnad från produktsidan som är JS-blockerad). Klipp rätt exemplar ur rätt spec-/variantbild, AI-tvätta bort engelsk text (`T-A` — **vänta ut hastighetsgränsen** mellan anrop), grunda på vit, ladda upp, koppla per variant.
- **Finns ingen egen bild alls** (t.ex. färg utan foto) → ta bort varianten (11C), koppla inte en delad bild.

**Hitta buggen i hela katalogen:** för varje produkt med >1 variantval, GET:a `fields=MEDIA_ITEMS_INFO` och jämför `choices[].linkedMedia[].id` — **samma id på 2+ val = merge-bugg** (åtgärda), **tomma** = omappad storleks-/spec-variant (oftast ofarlig). Den fulla katalog-svepen (417 produkter, 2026-07-09) hittade bara cykelvagnen med den äkta buggen.

⚠️ **`variantsInfo.variants[].media` är `readOnly` och är en ÖGONBLICKSBILD — inte samma sak som `linkedMedia` (2026-08-17).** Fältet härleds när optionens val skapas. Kopplas `linkedMedia` på i efterhand (som i 11B ovan) uppdateras det INTE, utan blir kvar på det som gällde då — oftast produktens hjältebild. En PATCH som försöker sätta `media` på en befintlig variant går igenom med 200 men ändrar ingenting; schemat säger `readOnly: true`. Enda vägen är att **bygga om optionen** (nya val utan id:n, `linkedMedia` inline, varianterna identifierade med `optionChoiceNames`) — då räknas den om.
