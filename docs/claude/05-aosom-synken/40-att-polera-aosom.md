### Att polera en Aosom-produkt

☠️ **Inga Fyndplats-kort (Leonard 2026-10-27).** Poleringen bygger inga egna spec-, feature-,
färg- eller storlekskort, inte heller som undantag. Ett galleri består av leverantörens egna
bilder: de används som de är, beskärs enligt runbookens undantag (sidor med färre än fem
bilder) eller stryks, och finns inget användbart flaggas det till Leonard. Den gamla
kortmetoden ligger i `docs/arkiv/fyndplats-kort.md`.

Allt utom siffrorna är **tyskt**: titel, beskrivning, säljpunkter och varje
spec-VÄRDE. Etiketterna är svenska från start — `buildSpecifications` i
`to-product.ts` sätter **exakt fem**: `Mått`, `Färg`, `Material`, `Vikt`,
`Paketmått` — eftersom feedens `Specification`-fält är tomt i 5 550 av 5 566
rader och underlaget kommer från de strukturerade kolumnerna i stället.

☠️ **`Artikelnummer` är INTE en av dem, och får aldrig läggas till.** Den här
raden räknade tidigare upp en sjätte etikett som koden aldrig har skrivit, och
det stod kvar i månader. Uppmätt 2026-09-03 på live-sajten: **fyra publicerade
produktsidor bär Aosoms artikelnummer i spec-tabellen** — två som `Artikelnummer: …` och en som döpt om etiketten till
`Modellreferens: …`. Importen kan inte ha skrivit dem: `to-product.ts`
sätter fem etiketter och `to-product.test.ts` fäller om numret dyker upp. De är
alltså skrivna vid **poleringen**, av någon som läste den här listan.

Numret är det farligaste vi har att läcka. Det står i Aosoms egen produkt-URL,
och dealproffsen.se publicerar samma sträng som `sku` och `mpn` i sin JSON-LD —
en googling ställer vår sida bredvid deras med vårt inköpspris härlett intill.
Det hör hemma på `supplierProductId` i mappningen och ingen annanstans. Byt inte
heller namn på det: `Modellreferens`, `Artikelnr` och `Referens` läcker exakt
lika mycket.

Platshållaren `[BRAND NAME]`, som står kvar i 4 975 rader, stryks redan vid
importen; den är ett mekaniskt fel med ett mekaniskt svar och får inte lämnas
åt poleringen.

`aosomFreightShare` på mappningen (0–1) säger hur mycket av inköpet som är
frakt. Över 0,5 betyder att frakten kostar mer än varan — polera dem sist, eller
kör svepet med `?skipFreightHeavy=1` och ta dem för sig.

#### ☠️ TITTA PÅ BILDERNA FÖRE TEXTEN, inte efter (2026-09-07)

Arbetsgången har varit: läs den tyska källtexten, skriv den svenska, och ta
sedan fram kontaktarket för att skriva alt-texter. Det är fel ordning, och
runda J1 visade varför.

Källan för golvlampan `13a53d52` säger *"Doppellagiger Lampenschirm"* och
listar **två skärmmått** — `Lampenschirmgröße: Ø24 x 13H cm` och
`Papierseil-Lampenschirm: Ø33 x 16H cm`. Det läses rimligen som två skärmar,
och texten beskrev följaktligen "en liten läsarm på Ø24 cm" och "en stor
skärm på Ø33 cm".

Produktbilden visar **en enda skärm**: en dubbellagrad drumskärm i pappersrep
som hänger från en böjd stång. Det finns ingen arm och ingen andra skärm.
Ø24-måttet är det INRE lagret, osynligt utifrån.

⚠️ **Ingen grind kunde ha fångat det.** Båda talen står i källan, så
siffergrinden var ren. Svenskan var korrekt, så mönstergrindarna var rena.
Felet var en riktig utsaga om en produkt som inte finns — den sortens fel som
bara ett öga på fotot ser.

**Regeln: kontaktarket byggs FÖRE brödtexten.** Det kostar ingenting extra —
bilderna ska ändå hämtas för alt-texterna — och det flyttar granskningen till
innan felet är skrivet i stället för efter att det står i Wix. Titta särskilt
på det källan beskriver med ord i stället för mått: konstruktion, antal delar,
hur något sitter fast.

Samma runda gav ett andra, mildare exempel: `d2dfd1fa` beskrevs som "tre
hyllplan runt stången" när lampan i själva verket är en öppen fyrkantsstomme
utan stång. Även det syns direkt i bilden och i ingen siffra.

#### ☠️ Skriv texten i en FIL först — mätt 9 fel mot 0 (2026-09-04)

Batch 64 skrev åtta produkttexter på två sätt, och skillnaden är inte en
smaksak utan ett tal:

| hur texten skrevs | produkter | fel som nådde Wix |
|---|---:|---:|
| Inline i API-anropet | 5 | **9** |
| Fil först, sedan grep-grind, sedan anrop | 3 | **0** |

Felen var svenska stavfel (`dögnsvarv`, `engangsjobb`, `ihopsattningen`,
`för hard underlag`) plus ETT husregelbrott: *"Leverantören anger 25–35
minuter"* — mot kunden är **vi** leverantören. Alla nio skrevs av samma modell
i samma session; det som skilde var om texten passerade en fil.

Skälet är mekaniskt. En sträng som skrivs direkt i ett JSON-anrop kan inte
läsas av en grind innan den lämnar chatten, och API-svaret ekar tillbaka exakt
det man skrev — det ser rätt ut för att det ÄR det man skrev. En fil går att
`grep`:a, och grinden tog noll sekunder.

☠️ **Och rätta per ORD, inte per förekomst.** `dögnsvarv` hittades tre gånger i
tre separata rundor — i namnet, sedan i en produkts brödtext, sedan i syskonets
— för att varje fynd lagades där det syntes i stället för att sökas i hela
batchen. Tre skrivningar och två extra läsningar för ett ord. Hittar du ett
stavfel: sök det i ALLA batchens texter innan du skriver något.

⚠️ Poleringstexten går inte att verifiera ur PATCH-svaret. `plainDescription`
ekas tillbaka ordagrant, så en felstavning bekräftas som "sparad". Det som
faktiskt fångar den är en grind före skrivningen — eller ögon efter, på en
återläsning. Nionde gången samma familj: **ett svar utan fel är inget kvitto.**

#### ☠️ Och filen är inte det som skickas — `fontagen-weight` (2026-09-06)

Regeln ovan säger *skriv i en fil först*. Den räcker inte, för filen skickas
inte: den TRANSKRIBERAS in i API-anropets kropp, och det är i den kopieringen
felet uppstår. Uppmätt samma dag, på en rättelse av tre klösträd där källfilen
var invändningsfri:

```
i filen:   <span style="font-weight: 700">Finns det något att klösa på?</span>
i anropet: <span style="fontagen-weight: 700">Finns det något att klösa på?</span>
```

☠️ **Wix STRÖP spannet tyst i stället för att avvisa det.** Ett okänt
CSS-egenskapsnamn ger inget fel — `bulkActionMetadata` svarade
`3 totalSuccesses, 0 totalFailures`, och den lagrade texten blev
`<p>Finns det något att klösa på? Ja, …</p>` med fetstilen borta. Ett ogiltigt
attribut är alltså inte ett fel utan en tomt bortstädad tagg.

Det som fångade det var **återläsningen diffad mot filen** — inte skrivsvaret,
inte ögonen. Och det gäller starkare sedan kodvägen föll: med `ExecuteWixAPI`
kunde texten läsas ur en fil server-side, med `CallWixSiteAPI` går varje byte
genom chatten en gång till.

**Regeln: filen är källan, men bara en diff mot den lagrade texten bevisar att
källan kom fram.** Tionde gången samma familj.

✅ **Och sedan 2026-09-13 fångas felet FÖRE skrivningen i stället för efter.**
Regeln ovan upptäcker transkriberingsfelet i återläsningen — alltså efter att
texten redan ligger hos kunden. Det går att stoppa tidigare, och det kostar en
rad: räkna kontrollsumman på den sträng som ligger i API-anropet, **i anropet
självt**, mot filens, och avbryt HELA skrivningen vid avvikelse.

```js
const avvik = plan.filter(p => SUMMA(p.html) !== p.raa);
if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik };
```

☠️ **Spärren måste ligga i SAMMA anrop som skrivningen.** En kontroll i ett
eget, tidigare anrop bevisar bara att just DEN kopieringen var rätt — nästa
anrop transkriberar om texten, och det är där felet uppstår. Den ska heller
inte bara varna: `fontagen-weight` visar att en delvis skriven batch är det
dyra utfallet, för Wix strök spannet tyst och rapporterade framgång.

Uppmätt i runda M3: åtta texter, åtta träffar, noll avbrott — och
återläsningen mot facit gav LIKA på alla åtta. Återläsningen behövs
fortfarande (den är det som fångar Wix EGNA omskrivningar); den här spärren
tar bort den andra halvan, den som är mitt eget fel.

☠️ **Och i runda M4 FÄLLDE den — på facit, inte på texten (2026-09-13).**
Första skrivningen av `3523deaa` avbröts på **ett tecken av 3 515**:

```
{"AVBRUTET":"transkriberingsfel — ingenting skrivet",
 "fick":833814621,"vantat":848253086,"tecken":3514}
```

Orsaken är filens **avslutande radbrytning**. Facit räknades på filen, men
det som skickas är filen UTAN den: en template-literal som slutar med `</p>`
bär ingen sista `\n`.

⚠️ Det är SAMMA byte som `wixnorm.py` punkt 5 redan dokumenterar — men på
LÄSNINGENS sida (Wix strippar den vid sparandet). Den gällde alltså åt båda
hållen hela tiden, och bara den ena halvan var nedskriven. **Räkna facit på
strängen SOM DEN SKICKAS** (`rstrip("\n")`), inte på filen.

☠️ Och avvikelsen är just därför den farligaste sorten: en byte ser ut som en
struntsak, är omöjlig att skilja från ett äkta transkriberingsfel på ett
tecken, och den som sett den tillräckligt många gånger slutar titta efter
vilket det var. Spärren gjorde rätt som fällde — det som saknades var ett
facit som mätte samma sträng.

✅ **Sedan 2026-09-24 transkriberas ingenting alls** (Leonards beslut). Rundans
filer blir `skrivplan.json` (`tools/polish-gates/bygg-skrivplan.py`), och
workflowen **"Polering — skriv en runda till Wix"** läser planen ur grenen,
kontrollerar dess sha256 och skickar den till `/api/admin/polish-write`
(`lib/polish/skrivplan.ts`). Den skriver text, media, kategorier och SKU i den
ordningen, verifierar i en separat läsning och stämplar varje verifierad
produkt. Spärren ovan behövs inte längre, eftersom det inte finns någon avskrift
kvar som kan bli fel. Arbetsgången står i runbooken under *Rundan steg för steg*.

☠️ **Kör workflowen med `ref` satt till poleringsgrenen.** Default är `main`,
och där finns inte planen. Kontrollen av sha256 fäller en sådan körning innan
något skrivs.

##### ☠️ Och `seoData` glömdes bort av regeln — fem av åtta drev isär (2026-09-07)

Regeln ovan säger *skriv i en fil först*, och runda H3 följde den för
BRÖDTEXTEN. SEO-taggarna skrevs i stället av för hand in i API-anropet, från
minnet av `seo.tsv` i stället för ur filen. Utfallet:

| hur SEO-värdena kom in i anropet | produkter | drev isär |
|---|---:|---:|
| Lästa ur `seo.tsv` med ett skript | 3 | **0** |
| Avskrivna för hand i anropet | 5 | **5** |

Fem av fem. Det är inte slarv i enstaka fall — en avskrift ÄR mekanismen.
Ingen av de fem hade heller passerat `gate-seo.py`, som grindar FILEN: en
titel som aldrig stod i filen kan inte grindas av den. De var som tur var
korrekta när de mättes i efterhand, men det var tur och inte en spärr.

`livegrind.py`:s SEO-svep fångade alla tio avvikelserna. **Orddiffen på
brödtexten var 0 på alla åtta** — alltså exakt den asymmetri regeln förutsäger:
det som gick via fil kom fram, det som skrevs av gjorde det inte.

**Regeln gäller varje fält som når kunden, inte bara brödtexten.** `seo.tsv`
och `namn.tsv` är källor på samma sätt som `<kort>.html` — bygg nyttolasten ur
dem med ett skript.

##### ☠️ `variantsInfo.variants[].sku` ligger på TOPPNIVÅN — en skrivning under `physicalProperties` slukas tyst

Uppmätt 2026-09-07 på alla åtta produkterna i runda H3. Variantobjektet har
BÅDE `sku` och `physicalProperties`, och SKU:n bor i det första:

```
variantNycklar: ["id","visible","sku","choices","price","physicalProperties","inventoryStatus"]
variant:        {"id":"47c9772b…","visible":true,"sku":"FP-laufrad-rutscher",
                 "physicalProperties":{}}
```

En PATCH som lägger `sku` under `physicalProperties` svarar **200 utan fel** och
ändrar ingenting: fältet försvinner, och `physicalProperties` står kvar som
`{}`. Åtta produkter publicerades med sin gamla tyska SKU kvar, och svaret såg
identiskt ut mot en lyckad skrivning.

Tionde gången samma familj — och det som fångade det var återläsningen som
jämför mot det FÖRVÄNTADE värdet. En återläsning som bara kollar att fältet
finns hade sett den gamla SKU:n och sagt ja.

##### ☠️ `variantsInfo` finns ALDRIG i sökprojektionen — SKU-kollen kan passera tomt

Uppmätt 2026-09-07, `stores/v3/products/search` utan `fields`, på fyra
sidstorlekar och två olika filter:

| sidstorlek | träffar | med `variantsInfo` | med `actualPriceRange` |
|---|--:|--:|--:|
| 5 | 5 | **0** | 5 |
| 20 | 20 | **0** | 20 |
| 50 | 20 | **0** | 20 |
| 100 | 20 | **0** | 20 |

Noll av tjugo, vid varje sidstorlek, och samma sak för ett annat filter.
`variantsInfo` saknas HELT ur svaret — inte tomt, utan frånvarande (`nycklar:
28`, `harVariantsInfo: false`). En `GET /stores/v3/products/{id}` bär det.

☠️ **Och det gjorde SKU-kollisionskollen till en no-op.** Mönstret

```js
for (const p of sokträffar) for (const v of p.variantsInfo?.variants || []) …
```

itererar alltid en TOM lista, så `upptagna` blir `{}`, `krock` blir `[]` och
kollen svarar "inga krockar" utan att ha jämfört någonting. Den kördes tre
gånger på en dag och kunde inte falla en enda gång. Elfte gången samma familj:
**ett svar utan fel är inget kvitto** — och en kontroll som inte KAN fälla är
värre än ingen, för den räknas som gjord.

Två regler följer:

1. **Läs priset ur `actualPriceRange.minValue`**, aldrig ur
   `variantsInfo.variants[].price`, när källan är en sökning. Det första
   fältet finns i 100 % av svaren, det andra i 0 %.
2. ☠️ **En koll som bygger på ett fält måste AVBRYTA när fältet saknas**, inte
   rapportera noll fynd. Skillnaden mellan "inga krockar" och "kunde inte
   jämföra" är hela skillnaden mellan en grind och en vana.

⚠️ **Lagerposten bär inte heller SKU.** `inventory-items/query` returnerar
`id, revision, createdDate, updatedDate, variantId, locationId, productId,
quantity, trackQuantity, availabilityStatus, preorderInfo, product` — inget
`sku`. Det finns alltså INGEN bulkväg till variant-SKU:erna, och en
katalogomfattande dubblettrevision är 5 527 GET-anrop. Det är samma slutsats
som redan står som en öppen punkt; nu är den mätt i stället för antagen.

##### ☠️ Och `plainDescription` saknas i PRODUKTENS standardprojektion (2026-09-13)

Raden ovan gäller sökningen. Samma fälla på en enskild `GET`, och den här
gången på det fält hela poleringen handlar om. Uppmätt på en nyss skriven
produkt, samma id i båda anropen:

```
GET /stores/v3/products/{id}                           nycklar: 29, plainDescription SAKNAS
                                                       (typeof undefined — inte tom sträng)
GET /stores/v3/products/{id}?fields=PLAIN_DESCRIPTION   3 434 tecken, rätt svensk text
```

☠️ **Och den vanliga defensiva raden gör det värre.** `p.plainDescription || ""`
förvandlar ett SAKNAT fält till noll tecken — alltså ett svar som i loggen ser
ut som ett bevis på att skrivningen föll. Åtta produkter rapporterades som
oskrivna av en återläsning som aldrig hade bett om fältet.

Det är EN NIVÅ VÄRRE än släpet i avsnittet ovan: släpet är icke-deterministiskt
och går över, det här utfallet är stabilt och reproducerbart, så en omskrivning
på den signalen hade gjorts med full övertygelse — och skrivit över en text som
redan stämde.

**Regeln: en återläsning som rapporterar NOLL måste först bevisa att fältet
fanns i projektionen.** Tre fält krävs på den här rutten och inget är med som
standard:

```
?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO
```

⚠️ Och `directCategoriesInfo` bär bara `id` i den projektionen, inte `name`. En
kontroll som läser `c.name` får `null` på varenda rad och kan alltså aldrig
fälla — samma klass som SKU-kollen som itererade en tom lista.

⚠️ **Kategoriräkningen är dessutom alltid +1.** Wix lägger själv till
`All Products` (`05e96cd6…`) och använder den som `mainCategoryId`. Ett facit
som räknar bara de kopplade kategorierna blir rött vid varje körning.

##### ⚠️ Kategoriläsningen är eventuellt konsistent — bulk-svaret är kvittot

`bulk/categories/{id}/add-items` följt av en omedelbar
`GET …?fields=DIRECT_CATEGORIES_INFO` rapporterade 7 av 8 kopplade. Den
åttonde var redan kopplad: nästa anrop svarade `ALREADY_EXISTS` på båda
kategorierna, och en läsning en stund senare visade alla tre.

Läsprojektionen släpar alltså efter skrivningen. **Facit är bulk-svarets
`itemMetadata`/`bulkActionMetadata` per rad** — samma form som lagersynkens
`tolkaBulkUtfall` redan bygger på. En snabb återläsning kan UNDERrapportera,
och en omkörning på den signalen är ofarlig men vilseledande.

##### ☠️ Och PRODUKTläsningen släpar likadant — fast åt det DYRA hållet (2026-09-13)

Raden ovan gäller kategorier, där en efterläsning som underrapporterar bara
leder till en ofarlig omkörning. Samma sak mätt på PRODUKTEN i runda M2, och
där kostar felriktningen mer.

Åtta produkter skrevs i en loop som gjorde PATCH och sedan en `GET` i samma
anrop. Två av dem — `321bdedf` och `80e1a550` — läste tillbaka som om
INGENTING hade skrivits:

```
efter PATCH, samma anrop   plainDescription 2 530 tecken, summa 834388551
                           (= exakt KÄLLANS kontrollsumma, alltså tyskan)
                           slug: lebkuchenmann-…   visible: false   5 seo-taggar
en stund senare            revision 2 → 4
                           plainDescription 3 962 tecken, summa 881571526
                           slug: uppblasbar-pepparkaksgubbe-…   visible: true
```

Skrivningen hade tagit hela tiden. Det var LÄSNINGEN som ljög, och den ljög
trovärdigt: kontrollsumman stämde exakt mot källan, alltså såg svaret ut som
ett välgrundat "din text kom aldrig fram".

☠️ **Det farliga är vad man lockas göra.** Ett falskt *"ingenting skrevs"*
inbjuder till en omskrivning av något som redan stämmer — med en revision som
hunnit bli inaktuell, eller ovanpå en skrivning man inte visste fanns. Till
skillnad från kategorifallet finns här inget bulk-svar att falla tillbaka på.

**Regeln blir tre led, och det sista är det som gäller:**

1. PATCH-svaret är ingen återläsning — dess projektion utelämnar
   `plainDescription` och `media.itemsInfo`, så en helt lyckad skrivning
   rapporterar `0 tecken, 0 bilder`.
2. En återläsning i SAMMA anrop är inte heller ett kvitto.
3. Det som räknas är en **separat läsning en stund senare**, mot ett facit
   räknat ur filen.

⚠️ Och innan du kallar en skrivning misslyckad: läs om. Fem av åtta produkter
i samma loop läste tillbaka korrekt direkt — släpet är inte deterministiskt,
så ett enstaka rött utfall är en anledning att titta igen, inte att skriva om.

##### ☠️ Variant-SKU:n tappas TYST i en kombinerad PATCH — skriv den SIST och ENSAM

Uppmätt i runda M2 på fyra produkter. En PATCH med `name` + `slug` +
`plainDescription` + `seoData` + `visible` + `variantsInfo`, följd av en
media-PATCH med `fieldMask: ["media"]`, skrev allt UTOM variantens `sku` — på
**tre av fyra**.

```
skickat   variantsInfo.variants[0].sku = "FP-tomte-240-klappsack"
lagrat    variantsInfo.variants[0].sku = "FP-weihnachtsmann-2-40-m"
svar      200, inget fel, inget bulkActionMetadata att läsa
```

Den fjärde fick sin SKU bara för att den råkade skrivas i ett eget, senare
anrop under felsökningen. Skriven ensam EFTER mediaskrivningen tog den på 8/8.

**Ordningen är alltså inte valfri:** text och identitet först, media sedan,
`variantsInfo` i ett EGET sista anrop — och verifierad i en separat läsning
enligt regeln ovan.

Besläktad med `variantsInfo.variants[].media`, som inte går att sätta efter
skapandet och strippas tyst av bulk-skrivningar. Mönstret är detsamma:
**`variantsInfo` tål inte att samåka med andra fält**, och den tiger när den
inte tas emot.

#### ☠️ Filgrinden täcker bara halva vägen — grinda den PUBLICERADE texten

Raden ovan sa "ögon efter". Ögon räcker inte: batch 65:s två fel stod kvar i
tre rundor, och det ena återinförde jag identiskt i mitt eget rättningsförsök.
Grinden är byggd sedan 2026-09-04 och heter **`tools/polish-gates/livegrind.py`**.

Den hämtar de publicerade sidorna och gör tre saker:

1. **Orddiff mot källfilen.** Det är den som biter. Vilket transkriberingsfel
   som helst blir en rad — inte bara de mönster någon råkat tänka på.
2. **Homoglyfsvep** på live-texten (kyrilliskt/grekiskt).
3. **Sid- och alt-svep**: husmärke, artikelnummer, fraktland, tyska rester.

☠️ **ALT-TEXTERNA MÅSTE SVEPAS SEPARAT.** Ett sidsvep som strippar taggar ser
inte in i `alt=""` — och det är precis där de tyska resterna sitter kvar efter
en polering som bara rört beskrivningen. Batch 66 lämnade åtta produkter med
`alt="Kaninchenstall aus Holz Hasenstall mit Rädern Klappdach…"` efter en
felfri textpolering. Beskrivningen var ren; bilderna skrek tyska.

⚠️ **Butiken skriver om markupen med flit** — beskrivningen delas i flikar
(`pdp-flikar` / `details` / `summary`) vid `<h2>Tekniska specifikationer</h2>`.
En exakt sträng­jämförelse mot källfilen faller därför alltid. Jämför BRÖDTEXT.

⚠️ **Vänta ut butikens ISR-cache.** Sidorna är prerenderade
(`x-nextjs-stale-time: 300`). En hämtning direkt efter skrivningen serverar den
GAMLA sidan, och den ser ut precis som en fungerande ny — samma fälla som
recensionsverifieringen gick i. Första träffen efter fönstret triggar en
bakgrundsrendering; NÄSTA hämtning får den färska sidan. `?cb=` hjälper inte.

Verifierad genom att återinföra batch 65:s exakta fel — ett kyrilliskt `т`
(U+0442) i "granträ" — i en av åtta hämtade sidor: grinden fäller på rätt
produkt, och bara den, med både orddiffen och homoglyfsvepet.

**Regeln: en grind på det du SKICKAR är inte en grind på det som LIGGER UTE.**

#### ☠️ Katalogsvepet: fem fel, och fyra av dem var osynliga (2026-09-07)

Slutkontrollen av flikreparationen ställde ALLA runbook-krav mot hela den
publicerade katalogen i stället för mot de trettio sidor den gällde. Den
hittade fem fel, och bara ett av dem hade någon märkt av sig självt.

| fel | omfattning | hur det syntes |
| :-- | --: | :-- |
| Spec-tabellen under fel rubrik → renderas INLINE | **128 sidor** | inte alls |
| `Frågor och svar` i stället för `Vanliga frågor` | **56 sidor** | inte alls |
| Leverantörens artikelnummer i kundtexten | 2 sidor | inte alls |
| Tyskt `klappbar` där svenskan är `fällbar` | 4 sidor | inte alls |
| Tyska SEO-titlar | 5 sidor | inte alls |

☠️ **De 128 är den dyraste, och runbooken förutsade den exakt:** "det ser inte
trasigt ut, bara som en rubrik till". Sidorna är välskrivna svenska sidor ur
rundorna 19–33 — felet var behållaren, inte texten. Rubrikerna de använde:
`Måtten` (59), `Mått och material` (54), `Mått och vad som ingår`,
`Mått och utrustning`, `Mått och funktioner`.

⚠️ **`klappbar` är tyska**, och det tog sig ända in i två PRODUKTNAMN. Svenskan
är `fällbar`. Samma familj som `Kippskydd` och den danska `et plant gulv`: ett
ord som ser svenskt ut och därför passerar varje grind som letar efter tyska
meningar. Slugen lämnades orörd — en ändrad slug bryter varje befintlig länk.

⚠️ **Och en femtaggars-SEO gömde det sista.** Två av sidorna bar importens FEM
seoData-taggar, inte husets två, och `klappbar` levde kvar i `og:title` sedan
titeln rättats. Regeln "TVÅ taggar, inte fem" är alltså inte kosmetik: en tredje
tagg är ett gömställe. 598 publicerade produkter bär fortfarande fler än två —
inga med tyska (mätt över alla fem taggtyperna), men formen är avvikande.

**Regeln: en riktad kontroll hittar det den letar efter. Kör den breda ändå.**
De fyra osynliga felen hade ingen anledning att dyka upp i någon av de
mätningar de faktiskt hörde hemma i.

#### ☠️ En backfill som rapporterar NOLL kan ha mätt fel sak (2026-09-07)

SEO-backfillen 2026-09-06 tog 49 tyska titlar till 0 över hela katalogen.
Talet stämde — och fem tyska titlar levde ändå kvar, publicerade, i en månad.

Klassificeraren krävde ett tyskt **funktionsord** (`und`, `mit`, `für`, `der`,
`die`, `das`). De fem har inget:

```
Schlafsessel Relaxsessel Gästebett. abnehmbarer Bezug
Polstersessel, Schaumstoff-Füllung, Kautschukholz
Polstersessel im Skandi-Design, Samtoptik, Massivholz
```

Rent tyska titlar, byggda enbart av substantiv och sammansättningar. Anteckningen
sa själv att talet var ett **GOLV** — och just därför var "0" inte samma sak som
"inga". Ett golv som når noll är fortfarande ett golv.

☠️ **Regeln: en nolla från en klassificerare mäter klassificeraren, inte
verkligheten.** Ett svar utan fynd är inget kvitto, tolfte gången — och den här
gången var det inte ens ett fel i koden, bara ett underlag som var smalare än
frågan. Samma familj som livegrinds sextonordslista (avsnittet ovan): grinden
var påslagen, dokumenterad, och kunde inte se.

Bredare klassificerare (tyska substantiv och sammansättningar, inte bara
funktionsord) över hela den publicerade katalogen 2026-09-07: **2 244 produkter,
0 utan SEO-titel, 5 tyska — samma fem.** Efter lagningen 0.

⚠️ Och de fem hittades inte av en SEO-mätning. De föll ut ur en helt annan
kontroll: slutverifieringen av flikreparationen ställde ALLA runbook-kraven mot
de trettio sidorna, inte bara det den var ute efter. En bred slutkontroll hittar
det en riktad aldrig letar efter.

#### ☠️ Och en fjärde: checklistan som ingen mätte (2026-09-06)

Runbookens Klart-kriterium har punkterna. Det som saknades var en KONTROLL av
att de gjorts. Uppmätt över 57 publicerade sidor ur rundorna A–F1, noll
hämtningsfel:

| krav som stod i Klart-kriteriet | föll på |
|---|--:|
| Kategori kopplad (brödsmulan ≠ *Hem / Butik / produkt*) | **41 av 57** |
| Fliken `Användning och skötsel` (obligatorisk sedan 2026-08-30) | **41 av 57** |

Båda syns i den RENDERADE sidan, och båda är nu maskinellt grindade i
`livegrind.py`. Verifierad åt båda hållen: den fäller på alla åtta F1-sidor och
går REN på referenssidor ur andra rundor, som klarar kraven.

✅ **Alla 41 lagade samma dag: 57 av 57 klarar nu båda kraven.** Kategorin är
`Husdjur` + löv för klösträden och `Hem & Inredning` utan löv för sittmöblerna —
trädet har inget sittmöbel-löv, och runbooken säger att toppkategorin räcker då.
Skötseltexten är skriven per materialgrupp och grindad före varje skrivning
(`gate-skotsel.py`): manchester borstas i luggens riktning, teddyfleece dammsugs
med lågt sug, gummiträ torkas torrt, snurrfoten rensas från hår, och golvsoffan
har inga skruvar att efterdra. En mall hade varit snabbare och sagt fel om åtta
av produkterna.

⚠️ **Och ISR-fällan slog till en gång till, i mätningen av lagningen.** Ett svep
med tre pass — varm träff, 310 s, varm träff, 90 s, mät — rapporterade två sidor
som fortfarande trasiga. Wix hade dem rätt, och en omhämtning gav rätt svar
direkt. Svepet läser 57 sidor sekventiellt, så de som lästes tidigt hann inte få
sin omrendering klar. **En sida i taget är facit; ett svep är ett stickprov med
tidsberoende.** Läs age, och läs om de som faller innan du kallar dem trasiga.

☠️ **Lärdomen är inte "läs checklistan noggrannare".** Den lästes — punkterna
citerades till och med i rundornas README-filer. En checklista som bara hjälper
den som redan kommer ihåg punkten är ingen spärr, det är en påminnelse. Samma
klass som `SHIP_AXIS_RE` och `EU_TULL_CODES`: **en regel utan grind glider.**

⚠️ Och en regel till som gäller den som skriver flikarna: strängen måste stämma
ORDAGRANT (`Tekniska specifikationer` · `Användning och skötsel` ·
`Vanliga frågor`). Skriver du `Specifikationer` matchar splittern inte och
spec-tabellen renderas inline mitt i brödtexten — det ser inte trasigt ut, bara
som en rubrik till.

#### ☠️ En grind kan vara PÅSLAGEN och ändå blind — alt-svepet var det (2026-09-07)

Runda J2 publicerade åtta lampor med invändningsfri svensk brödtext
(orddiff **0 på alla åtta**) och **fyrtio tyska alt-texter**. Alt-filen fanns,
`gate-alt.py` gick ren på den — men ingenting skrev den till Wix. Steget
saknades i rundan, och inget svar från något API sa emot: produkten sparades,
bilderna satt kvar, allt rapporterade framgång.

Det som fångade det var live-grindens alt-svep. Det svepet fanns sedan
2026-09-06 — men bar då `livegrind.py`:s EGNA sextonordslista, ett avtryck av
hundkojerundan. Inget av de fyrtio felen stod i den:

```
i alt-texten:  "Deckenlampe mit Acryllampenschirm, Metall, Halogen- und LED-kompatibel"
gamla listan:  hundehütte · kaninchenstall · hasenstall · fressnäpfen · dachterrasse …
gatelibs:      mit · und · für · Weiß · Braun · Stahl · Schwarz …
```

Grinden var alltså **påslagen, dokumenterad och räknad som gjord** — och kunde
inte fälla någonting på en lamprunda. Den hittade felet först samma dag som
ordlistan lades om till gatelibs (se avsnittet ovan), på den allra första
rundan efter ändringen.

☠️ **Regeln: att en grind FINNS säger ingenting om att den kan SE.** Samma
klass som runda G:s döda `(?!)`-mönster, men värre — där var uttrycket trasigt,
här var grinden felfri och underlaget för smalt. En grind vars ordlista är ett
avtryck av en enskild runda mäter bara den rundan.

⚠️ Och lagningen är verifierad åt båda hållen, för det är det enda som skiljer
en levande grind från en död: 24 redan verifierade sidor ger fortsatt 0 fynd
(enda undantaget är butikens egen `EU-lager`-ribbon), och tre planterade fel —
`Gewicht` i `<title>`, `Kunststoff Rückenlehne` i en alt-text och
"Leverantören anger" i brödtexten — ger sex träffar över sid-, alt- och
SEO-svepet.

#### ☠️ Och GRINDARNA själva drev isär — 19 kopior i tre versioner (2026-09-06)

Varje runda kopierade in `gate.py`, `gate-alt.py`, `gate-seo.py` och `hasha.py`
i sin egen katalog. Vad som skilde var inte strukturen utan ORDLISTAN över
tyska rester:

```
runda A/F1   …|Kinder|Sofa|Jahre|Maße|robust|niedlich|gemütlich|…
runda F2     …|Kratzbaum|Katzen|Plüsch|…
runda G1/G2  …|Stuhl|Bezug|Kufen|Polsterung|Schaukel|kuschelig|flauschig|…
```

Varje runda **ersatte** föregående rundas ord med sina egna, så unionen har
aldrig körts. Runda H1 (kattlådor) gatades med gungstolarnas vokabulär —
`Katzen`, `Deckel`, `Schaufel` och `Edelstahl` kontrollerades aldrig.

☠️ **Och runda G:s stavningslista bar ett DÖTT mönster.**
`gungstol(?=en\b)(?!)` — `(?!)` misslyckas alltid, så uttrycket kan aldrig
träffa något. Det hade ersatt runda A:s fungerande `storlek(?!en|ar)`-koll. En
grind som ser komplett ut och inte kontrollerar något är värre än ingen alls,
för den räknas som gjord.

✅ **Skadan är noll, och det är mätt.** Alla fyra tidigare rundor kördes om mot
unionens ordlista: F1, G1, G2 och barstolen ger **0 fynd**. Hålet var latent,
inte utfallet. Det som däremot är utfallet är att **runda F2 saknade
textgrinden helt** — katalogen har varken `gate.py` eller facit-fil för den
rundan, så dess åtta sidor har aldrig siffergrindats.

Grindarna bor sedan dess i `tools/polish-gates/` med ordlistan i `gatelib.py`,
och rundorna anropar dem därifrån — precis som `livegrind.py` redan gjorde:

```
python3 ../../polish-gates/gate.py
```

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Orden får bara LÄGGAS TILL, aldrig bytas ut.** Att stryka ett ord för
   att "det gäller inte den här rundan" är exakt hur listorna drev isär.
2. ☠️ **`lib/polish/gate-kopior.test.ts` fäller om en kopia dyker upp** i en
   rundas katalog, och namnger filen. Verifierad genom att återinföra buggen.
   Rundespecifika grindar (`gate-skotsel.py`, `gate-kort.py`) är undantagna —
   de kodar en enskild rundas materialgrupper och har ingen delad sanning att
   glida ifrån.
3. **Råd-tal ligger i rundans `rad-tal.txt`, inte i koden.** G1 hade `{"20"}`
   hårdkodat i sin kopia; nästa runda ärvde talet utan att veta varför.
4. **Grinden läser BÅDA facit-formaten** (`kallor-tal.json` med tal-listor,
   `kallor.json` med hela källtexten). Annars går en äldre runda inte att
   grinda om — och det är just omgrindningen som avslöjar att listan glidit.

**Regeln, en gång till och nu om grindarna själva: en tvilling glider isär, och
den som glider tystast är den som ser ut att fungera.**

##### ☠️ Och FACIT för återläsningen var en tredje tvilling (2026-09-15)

Runda N2:s återläsning rapporterade `SKILJER` på **alla åtta** produkterna.
Skrivningarna var byte-exakta. Det var facit som var fel, och avvikelsen var
exakt **7 tecken per `<li>`** — 63 till 105 tecken, alla åt samma håll.

`hasha.py`, som bygger varje rundas `vantat-hash.tsv`, hämtade sin
normalisering ur `gatelib`. Tre kopior fanns samtidigt, med tre olika svar på
samma fråga:

```
gatelib.normalisera   2 regler   vitrymd + target="_self"
kvitto.py             4 regler   saknade den avslutande radbrytningen
wixnorm.normalisera   5 regler   uppmätt mot skarpa V3
```

Mot `wixnorm` stämmer den lagrade texten på 8 av 8. De två andra är borta —
`gatelib.normalisera` hade EN användare och togs bort i stället för att lämnas
kvar som en tredje sanning någon kan råka läsa.

⚠️ **Riktningen är det som gör felet dyrt.** En KORREKT skrivning rapporteras
som misslyckad. En återläsning som lyser rött varje gång lär mottagaren att
sluta läsa — samma argument som mot att varna vid 48 h på token-förnyelsen —
och då är även det äkta larmet borta. En spec-flik är alltid en `<ul>`, så
felet gällde varje runda.

`lib/polish/wixnorm-tvilling.test.ts` fäller på tre olika sätt: källkodsgrinden
på att en andra `def normalisera` finns, längdtestet på att `<li>` inte räknas,
hashtestet på att svaret skiljer sig från wixnorm.

#### ☠️ Och en TREDJE blind fläck: `<title>` och metabeskrivningen (2026-09-06)

Poleringen skriver `name` och beskrivningen. Den rör **aldrig `seoData`** —
och det är `seoData` som blir sidans `<title>` och `<meta name="description">`,
alltså precis det Google VISAR i sökresultatet. Aosom-importen sätter dem från
den tyska feeden, och ingenting har någonsin skrivit över dem.

Uppmätt på runda F1:s åtta klösträd, samtliga med **orddiff 0** mot källfilen:

```
<title>Kratzbaum Deckenhoch, 228-260 cm Höhenverstellbarer Katzenbaum</title>
<meta name="description" content="Verwandeln Sie Ihr Zuhause in ein Paradies…">
```

Brödtexten var alltså invändningsfri svenska medan sökresultatet var tyskt.
Över hela katalogen: **49 av 2 032 publicerade sidor** bär tysk SEO-titel
(1 443 har svensk titel med `| Fyndplats`, 540 en autohärledd utan suffix).
Talet är ett GOLV — klassificeraren kräver ett tyskt funktionsord.

☠️ **Båda de gamla svepen missade det, av olika skäl.** Metabeskrivningen ligger
i ett ATTRIBUT, och sidsvepet strippar taggar — samma blinda fläck som
alt-texterna hade. `<title>` syns visserligen i sidsvepet, men det som fällde
var artikelnummer-mönstret som råkade träffa `228-260`; runda D1:s
*"Schlafsessel, Gästebett, verstellbare Rückenlehne"* hade gått rakt igenom.
**Grinden fångade rätt fel av fel skäl, och bara på tre av åtta sidor.**

Grindarna är därför två nu, och den andra är den som biter:

- `gate-seo.py` i rundans katalog — filgrind på `seo.tsv` med siffergrind mot
  produktens egen källtext, längdtak (60/160) och krav på `| Fyndplats`.
- `livegrind.py` har ett **SEO-svep** som läser `<title>`, `description`,
  `og:title` och `og:description` ur den publicerade sidan och jämför dem
  EXAKT mot `seo.tsv` när filen finns. En mekanisk jämförelse behöver inte veta
  vilket språk felet är på — mönstergrindar gör det.

☠️ **Formen är TVÅ taggar, inte fem.** Uppmätt på runda A och C2: med bara
`title` + `meta description` i `seoData.tags` härleder butiken `og:title`,
`og:description` OCH `twitter:title` ur dem. Importens fem taggar bär tyska
og-värden som ska BORT, inte skrivas om. Rensa även
`seoData.settings.keywords` — importen lägger ett tyskt huvudnyckelord där med
`origin: "USER"`.

#### ☠️ En OMERGAD gren skyddar ingenting — workflowen körs från `main` (2026-09-07)

Allowlisten i `polish-mapping.yml` (som utelämnar `costUsd`, `landedCostSek`,
`supplierProductId`, `sourceUrl` och `aosomFreightShare` ur den PUBLIKA
Actions-loggen) skrevs samma dag och låg på en gren. Åtta `las`-körningar i
runda K1 startades med `ref: main` — alltså mot den GAMLA versionen av
workflowen, som skriver ut hela mappningsraden.

Följden var exakt det par som feed-adressen är hemlig för att skydda:

```
"costUsd": …,  "landedCostSek": …,
"supplierProductId": "aosom:…",
"sourceUrl": "https://www.aosom.de/item/…"
```

Loggarna för de åtta körningarna är raderade (`delete_workflow_run_logs`), och
resten av rundan kördes mot grenen i stället. Skadan är därmed begränsad till
det fönster de låg uppe — men den var **helt onödig**.

☠️ **Regeln: en fix som inte är mergad finns inte för den som kör workflowen.**
`workflow_dispatch` tar en `ref`, och default är `main`. Skriver du en spärr i
en workflow måste du antingen merga den innan du kör, eller uttryckligen ange
din gren som `ref` — varje gång, i varje körning. En halvvägs utrullad spärr är
farligare än ingen, för den känns som ett skydd.

⚠️ Och den gamla lärdomen gäller igen: **Actions-loggar på ett publikt repo går
att läsa utan inloggning.** Det finns ingen "intern" logg här.

#### ☠️ Korten GRINDAS sedan 2026-09-16 — och de byggs ur en fil

☠️ **Avvecklat 2026-10-27:** vi bygger inga Fyndplats-kort längre (Leonard), så grinden och
byggaren används inte. Avsnittet är historik. Verktygen ligger kvar tills Leonard beslutar
om borttagning.

`KORTLACKAN.md` mätte nio publicerade sidor där leverantörens artikelnummer
eller husmärket ligger **inbränt i en bild vi själva tillverkat**, och bad
uttryckligen om en grind. Den finns nu: `tools/polish-gates/gate-kort.py`
läser rundans `kort.tsv`, och `bygg-kort.py` renderar ur SAMMA fil efter att
ha kört grinden. Ett kort som renderats innan det grindats är ett kort någon
kan hinna ladda upp.

Utan OCR går den renderade PNG:en inte att läsa mekaniskt. Det som går är att
grinda INDATAN — samma regel som redan gäller brödtexten, `seo.tsv` och
`namn.tsv`: **bygg nyttolasten ur filen med ett skript, skriv den aldrig av.**

Åtta kopior försvann på köpet: tre `gate-kort.py` (F2, G1, G2) som
kontrollerade olika saker och fem `bygg-kort.py`. Varje kopia `exec`:ade
byggarens KÄLLKOD med strängdelning, så definitionen gick bara att grinda
genom att köra byggaren. `gate-kopior.test.ts` hade dessutom `gate-kort.py`
som "rundespecifik" — ett felaktigt undantag, och exakt så en tvilling uppstår.

**Grinden fäller på:** allt `gatelib.GRINDAR` fäller · ett tal utan täckning i
källan · ett tal kortet har men sidans spec-rad inte · två kort med identisk
text · en produkt i `slugs.txt` utan kortrad · en alt-text i `kortalt.tsv`
med samma fel · fel enhetsmarkup · en enhet som inte följer på ett tal.

☠️ **EN GRIND PÅ FILEN ÄR INGEN GRIND PÅ PIXLARNA.** Första omgången N2-kort
gick ut med SVARTA UNDERSTRUKNA enheter i stället för husets orange: ett
konverteringsskript hade bytt `<span class=u>` mot `<u>`, filen såg rimlig ut
och grinden var ren. `cardkit` stylar `.u` och ingenting annat, så varje annan
tagg blir webbläsarens default. Det som fångade det var ögon på ett beskuret
PUBLICERAT kort. Korten är utbytta på plats och grinden kräver numera husets
markup.

⚠️ **Två regler prövades och en förkastades av MÄTNINGEN.** En koll på att
enhetsspannets INNEHÅLL är en känd enhet fällde fyra KORREKTA publicerade
G1-kort (`15 cm tjock` är en medveten formulering) och missade defekten den
byggdes för — `m` ÄR ju en giltig enhet. Regeln som gäller är mätt: över sex
rundors kortfiler finns **342 enhetsspann, och 341 föregås av en SIFFRA**.
Den enda avvikelsen var defekten (`…sku` + `m`, ordet *skum* delat av en
avdelare med `(cm|kg|m)$`). En enhet hör till ett tal.

☠️ **UPPLADDNINGENS SVAR EKAR INGEN KÄLL-URL.** `UploadImageToWixSite` ger en
lista med id i samma ordning som `imageUrls`, men utan att säga vilket id som
kom från vilken adress — alltså samma attribution-på-ordning som huset redan
vägrat lita på i lagersynken. Varje uppladdad fil hämtas därför hem igen och
md5-jämförs mot sin lokala kopia. Uppmätt: 8 + 8 + 4 av 12 filer
byte-identiska, alltså är parningen BEVISAD och inte antagen.

⚠️ **Korten är 1600 × 1600**, inte `render`:s råa 3200. Talet är läst ur en
redan publicerad kortfil, inte valt.

#### ☠️ Tre publicerade/utkastade sidor var EN kattlåda (2026-09-16)

Dubblettskärmen i runda N2 pekade ut åtta kandidater. Bildhashen (#243) gav
**noll** träffar på alla åtta — och det är ett ÄKTA negativt, inte en trasig
metod. Kontrollen som visar det: elva produkter, däribland tre par med
IDENTISKT tyskt namn och nästan samma pris, har alla olika hash OCH olika
filstorlek. Det är genuint olika foton. Bildgrinden ser bara den
byte-identiska klassen, precis som huset redan skrivit ned.

Det som avgjorde var måtten — den VIDA trippelkollen, inte `Mått:`-raden:

| | måtttripplar |
|---|---|
| `adb8c31b` **publicerad**, 729 kr | 39,8×41,3×52,4 · 21×44×54 · 14×40×52 · 3,5×10,5×25,5 · 1,5×8×8 |
| `dd8902e8` utkast, 769 kr | **samma fem** |
| `d499532f` utkast, 799 kr | **samma fem** |

Fem av fem identiska, inklusive skopan på 3,5 × 10,5 × 25,5 cm. Tre sidor,
en produkt. Samma sak för hundbäddarna `65d3d373` (719 kr) och `2ed2f82b`
(759 kr): båda tripplarna identiska, samma tyska namn.

☠️ **Och ommappningen var en no-op, precis som `34341c4f`.** Mappningsraden
för den publicerade sidan säger `supplier: "aosom"` — alltså finns ingen
AE-rad att peka om, och hindret `redan_aosom` hade fällt en körning.
Husregeln *"äkta dubbletter mappas om till Aosom"* antar tyst att sidan vi
behåller är en AE-rad. Andra gången den antagandet inte håller.

Åtgärden är därför pensionering: `dd8902e8`, `d499532f` och `2ed2f82b` bär
`draftStatus: "rejected"`, `needsAiPolish: false`. Ingen raderas — ett
osynligt utkast kostar ingenting, och en radering går inte att ångra.

⚠️ **De fyra andra kandidaterna är FRIKÄNDA, inte obehandlade.** `e397f6b3`
är en annan kattlåda (29,7 × 40,2 × 60,2), `9a66c056` krockar med ingen
publicerad soptunna, `b50a2c94` har ingen publicerad motsvarighet alls (de
fyra "publicerade skärmtaken" i första svepet var hundvagnar med *Vordach* i
namnet), och `70c17966` saknar huvudbild helt — vilket är ett eget fynd.

#### ☠️ Flera produkter kan dela EN SKU — kolla varje batch

Importen härleder variant-SKU:n ur den tyska titelns första ord, så produkter
vars titlar börjar likadant får samma sträng. Batch 66 hittade sex produkter på
två SKU:er: fyra kaninhus på `FP-kaninchenstall-aus-holz` och två hundkojor på
`FP-hundehutte-aus`. Det är inte unikt för den batchen — läs `las`-svaren mot
varandra innan du stämplar, och ge varje produkt en egen svensk SKU på BÅDA
sidorna (Wix-variantens `sku` och mappningsradens).
