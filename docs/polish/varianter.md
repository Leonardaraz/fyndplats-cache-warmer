# Varianter – mekanik

> **Reglerna** för varianter står i [`seo-polish-runbook.md`](../seo-polish-runbook.md)
> Steg 6 och 11: vilka varianter som ska bort, att varje variant som ser olika ut
> behöver en egen bild, att uttags-/spänningsaxeln bara får ha EU-värdet, och att
> variantetiketten aldrig bär en obekräftad prestandasiffra.
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

**Kontrollera till sist** att `FyndplatsAuctions` inte har state med gamla variant-ID (tomt = inget att så om), och att synken inte skriver tillbaka de gamla namnen — `lib/sync/aliexpress-sync.ts` rör varken `options` eller `variantsInfo`, så omdöpningen är beständig.

**Sajten visar gamla namn i upp till 5 minuter** efteråt: headless-PDP:n är ISR med `x-nextjs-stale-time: 300`. Verifiera mot Wix-API:t direkt, och kontrollera sidan igen efter cachefönstret innan du rapporterar klart.
>
> **Gäller även engelska spec-blad:** samma metod bygger om leverantörens spec-blad (Item Model Number / Working Area / Input Voltage …) till rena **svenska spec-kort** (kicker "MODELL X", stor storleksrubrik + effekt-pill, 6-radigt spec-rutnät). Passa på att **rätta felaktig/vilseledande inbränd data**: t.ex. hade CNC-fräsens S4040-blad fel måttcallouts (kopierade från S3020) och båda bladen visade "110V 60Hz" (USA) fast produktens verkliga data är **AC 110/220 V, 50/60 Hz** (EU). Metriska enheter, inga tum/lbs.

**Pipeline (helt lokalt + gratis, ingen Wix-AI):**
1. **Klipp tillgångar** ur bilder som redan har **vit/ren bakgrund** (oftast hjältebilden): maskin, kontroller, spindel osv. Rektangulär beskärning räcker — vit bakgrund smälter sömlöst in i ett vitt kort (ingen urklippning behövs). Beskär SNÄVT så inga tillbehör/skuggor följer med. Foton från mörka källor (t.ex. en i-bruk-bild) presenteras som **rundad foto-banner** (rundade hörn + mjuk skugga) i stället för full-bleed — då krockar de inte med de ljusa korten. Sitter produkten på en **grå/färgad bakgrund med callouts** (typiskt spec-blad) → klipp ut den med **rembg** (`from rembg import remove`) och lägg på vit + mjuk skugga (samma kompositering som i H-metoderna). **Gotcha:** u2net väljer det MEST framträdande objektet — på ett spec-blad kan det bli den vita spec-boxen, inte maskinen. **Beskär först till maskin-regionen** (klipp bort spec-boxen) INNAN `remove()`, och behåll bara största alpha-komponenten (`scipy.ndimage.label`) så lösa callout-text-öar försvinner. Granska alltid med `Read`.
2. **Skriv korten som HTML/CSS** (1600×1600), bädda in fotona som base64 data-URI (self-contained). **Låst premium-mall (from 2026-07-09, `cardkit`-motorn):** typsnitt **Inter** (bädda in `@font-face` som base64-woff2 — Chromium saknar bra default-sans), **varm radial-gradient-bakgrund** i stället för platt vit (`radial-gradient(130% 105% at 50% 20%, #FFF 0%, #FAF7F2 50%, #ECE6DC 100%)` — platt vit såg "billig" ut, Leonard 2026-07-09), centrerad poster-layout, och orange **enhets-accent** (talet i svart ink, enheten i orange: `280–435&nbsp;<span class=u>mm</span>`). Håll typografi + marginaler identiska mellan kort-typerna; footer-lockupen se nedan. **Skriv inte HTML:en för hand — importera `scripts/cardkit.py`**, där mallen redan är låst, så hela katalogen blir pixel-konsekvent:

   ```python
   import sys; sys.path.insert(0, "scripts")
   import cardkit as ck
   U = lambda s: f'<span class=u>{s}</span>'                       # orange enhets-accent

   ck.hero_white("orig/o01.jpg", "out/hjalte.jpg")                  # plats 0 (metod H-0)
   ck.grid_overlay("orig/o05.jpg", "g/o05.jpg", 0.05)               # läs av crop-gränser
   ck.crop("orig/o05.jpg", "crops/detalj.jpg", .15, .34, .24, .43)  # relativa koordinater

   ck.card_photo("k1", "crops/detalj.jpg", "KICKER", "Rubrik",
                 "En rad brödtext.", note="fotnot", fit=True)
   ck.card_grid("k2", ["crops/a.jpg", "crops/b.jpg"], ["Vänster", "Höger"],
                "KICKER", "Rubrik", "En rad brödtext.", note="fotnot", rows=1)
   ck.card_spec("k3", "out/hjalte.jpg", "Specifikation", "Produktnamn",
                [("Höjd", f"156&nbsp;{U('cm')}"), ("Sockel", "E27")], note="fotnot")
   ck.render(["k1", "k2", "k3"])                                    # → cards/*.png, 3200²
   ```

   `card_grid` tar 2–4 foton (`rows=2` ger 2×2). `card_spec` lägger raderna i två
   kolumner — 6–10 rader ser bäst ut. `fit=True` = hela produkten syns (contain);
   `fit=False` = fyller panelen men beskär (bara kontextfoton).
   > **Footer-märke (obligatoriskt from 2026-07-09):** använd **kub-loggan + "Fyndplats"** (lockup), **inte** den gamla grå gles-versalen "FYNDPLATS". Hämta kuben en gång från `https://www.fyndplats.se/icon.png` (orange 3D-kub, transparent PNG), bädda in som data-URI. CSS: `.brandlock{display:flex;align-items:center;gap:15px}` · `img{width:47px;height:47px}` · `b{font-size:37px;font-weight:700;letter-spacing:-.5px;color:#1B1B1A}`. Leonards beslut: nya loggan gäller alla NYA produkter framåt (äldre kort retrofittas bara på begäran).
3. **Rendera → PNG via förinstallerad Chromium** (ingen Wix-AI, ingen hastighetsgräns):
   ```bash
   CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome
   "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
     --force-device-scale-factor=2 --window-size=1600,1690 \
     --screenshot=out.png "file://$PWD/card.html"   # 2× → 3200² retina (skarpare i Wix)
   ```
   > ⚠️ **Två renderingsfällor som båda ser ut som designfel men är Chromium-beteende (2026-08-04, kostade två omrenderingar).**
   > 1. **Viewporten blir ~87,5 CSS px LÄGRE än `--window-size`.** Ligger gradienten på `<body>` med `height:1600px` blir bakgrundens positioneringsyta viewporthöjden → gradienten **tilar**, och kortets nedersta ~90 px blir vita medan foten kapas mitt i "Fyndplats". Lägg gradienten på ett **fast `.card`-element** (1600×1600, `overflow:hidden`), rendera med **högre fönsterhöjd** (t.ex. `--window-size=1600,1780`) och **kapa till exakt kvadrat i PIL** efteråt.
   > 2. **Utan `<meta charset="utf-8">` blir å/ä/ö mojibake** (`Ã¥`/`Ã¤`/`Ã¶`) — och inkonsekvent, så några kort ser rätt ut och lurar ögat. Skriv filen med `encoding="utf-8"` OCH sätt meta-taggen.
   >
   > Båda är låsta i **`scripts/cardkit.py`** — importera den i stället för att bygga om mallen (den föregående sessionens kortmallar låg bara i scratchpad och försvann när containern återskapades).
   >
   > **Samma viewport-fälla i SVART variant (2026-08-06, hittad i efterhand på 9 publicerade kort/7 produkter):** renderas med `--window-size=1600,1600` och beskärs till 3200² fylls de saknade ~174 px längst ner med **svart band** under lockupen (i stället för det vita/tilade fallet ovan — beror på bakgrunden). Verifiera därför ALLTID att slutbilden är exakt 3200×3200 **utan** mörka rader i nederkant:
   > ```python
   > a = np.asarray(Image.open(p).convert("RGB")); n = 0
   > for y in range(a.shape[0] - 1, -1, -1):
   >     if a[y].mean() < 40: n += 1
   >     else: break
   > assert n == 0, f"{p}: {n} svarta rader i nederkant — fel window-size"
   > ```
   > Redan drabbade kort lagades utan ombyggnad: bandet är rent tomrum, så bakgrundsgradienten förlängdes ner över det (global lutning + sidled-utjämnad basrad — per-kolumn-extrapolation ger lodräta strimmor).
4. **Granska ALLTID med `Read`** (helhet + inzoomat). Vanliga fel: text kapas (sätt `.photo{flex:1;min-height:0}` så textblocket aldrig trängs bort), och **små källurklipp (<~500 px) blir suddiga** när de skalas upp 2–3× → använd i stället en högupplöst i-bruk-bild som rundad banner, eller acceptera medelstor "spotlight". `object-fit:contain` skalar INTE upp av sig själv; `max-width/height:100%` visar bilden i sin naturliga storlek (små blir små).
5. **Ladda upp** alla kort i ETT `UploadImageToWixSite`-anrop (GitHub-branch-vägen, se [bildmetoder.md](bildmetoder.md)) och byt in dem i galleriet.

> ⚠️ **Produkten grundas — beskär den ALDRIG (cover-crop). Lärdom 2026-07-09 (barncykeln).** En **produkt** (cykel, stol, maskin) ska alltid ligga `object-fit:contain` på en grundad scen — i `cardkit` betyder det **`fit=True`**, och produktbilden bör vara körd genom `hero_white()` så den redan står på ren vit botten med luft runt om. `fit=False` (`object-fit:cover`, full-bleed) är BARA för **kontext-/livsstilsfoton** (en husvagn, en trädgård), aldrig för själva produkten — cover **kapar kanterna** (barncykelns hjul klipptes fram/bak). Två följdregler Leonard tryckte på samma dag:
> - **Beskär källan med marginal runt HELA produkten.** Ett för snävt käll-crop (`x[175:1410]`) klippte hjulkanterna redan innan kortet byggdes — vidga tills det finns luft runt varenda kant, granska sedan med `Read`.
> - **Hjälten ska FYLLA rutan (~80 %).** En liten produkt mitt i en stor tom ruta försvinner i katalog-gridden — skala den grundade produkten så den täcker ~80 % av 1600²-rutan (behåll ändå luft + skugga runt om). Gäller BÅDE plats-0-hjälten och produkt-hjälten på feature-korten.

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
FAQ, kortet och "Det du bör veta" — förklarade att tillverkarens egen manual anger **140 kg**
och att leverantörens 272 kg är nära dubbelt så mycket. Kunden såg alltså den siffra vi
just motbevisat, på det mest synliga stället av alla.

**Regel:** i etiketten får bara stå det som är egenskaper (mått, antal stänger, färg,
ytbehandling) eller siffror vi kan stå för. Bärförmåga, effekt, räckvidd, kapacitet och
liknande prestandasiffror flyttas till spec-tabellen och kortet, **med källan utskriven**
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
