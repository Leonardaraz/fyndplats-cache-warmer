# Runda N26 — åtta produkter, 1 629 kr

Åtta Aosom-utkast polerade och publicerade: leksaksbutik med kassa och
varuautomat, hamsterbur i tre plan, trimbord för hund, träningsbänk,
batteridriven lövblås, trädgårdsstolar i 2-pack, förvaringslåda med spaljé
och ett bistroset i gjuten aluminium. Alla åtta på EXAKT samma pris —
1 629 kr — alltså samma prisplatå som N25 slutade på, precis som N24 höll
kvar N23:s.

| id | produkt | SKU | pris |
|---|---|---|---:|
| e392b9d6 | Leksaksbutik för barn med kassa och varuautomat, rosa och beige | FP-leksaksbutik-kassa-varuautomat | 1 629 kr |
| bd8af49c | Hamsterbur i trä med tre plan, utdragbar botten, grå | FP-hamsterbur-tra-3-plan-gra | 1 629 kr |
| 1f3077a4 | Trimbord för hund, hopfällbart med galge, blått | FP-trimbord-hund-hopfallbart-blatt | 1 629 kr |
| 583622e8 | Träningsbänk med justerbar rygg och sits, vadfäste, svart | FP-traningsbank-justerbar-svart | 1 629 kr |
| a23ea344 | Batteridriven lövblås 20 V med två batterier och laddare | FP-lovblas-batteri-20v | 1 629 kr |
| 53550f18 | Trädgårdsstolar 2-pack i stål och eukalyptus, stapelbara | FP-tradgardsstolar-2-pack-eukalyptus | 1 629 kr |
| 651939aa | Förvaringslåda med spaljé och 4 hyllor, massiv gran | FP-forvaringslada-spalje-4-hyllor | 1 629 kr |
| 66d781f8 | Bistroset för 2 personer i gjuten aluminium, bord och 2 stolar | FP-bistroset-2-aluminium-svart | 1 629 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (åtta körningar, åtta loggar lästa).
Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta,
ingen slutsåld, ingen låst. `aosomFreightShare` 0,221–0,366 — ingen i
närheten av 0,5-tröskeln. Saldon 5–197; träningsbänken (`583622e8`) ligger
på exakt 5, alltså precis på `gate-lager.py`:s TUNT-gräns och köpbar men
tunn.

## Tre sakfel hittade och rättade — och det första kom av att bilderna lästes FÖRST

Husregeln från runda J1 (*"titta på bilderna före texten"*) betalade sig
direkt: det dyraste fyndet i rundan står i pixlarna och i inget tal.

- ☠️ **`1f3077a4` (trimbordet): källans tyska prosa säger att bordet är
  SVART. Det är BLÅTT.** Både brödtexten (*"dieser schwarze -Pflegetisch"*)
  och `Technische Daten: Farbe: Schwarz` påstår svart, medan produktens
  egen färgkolumn i feeden — den som byggde importens spec-rad `Färg: Blau`
  och alla fem alt-texterna — säger blå. Varenda bild visar en blå
  gummiskiva med präglat punktmönster på ett stativ i rostfritt stål.

  Vad som gjorde det avgjort i stället för sannolikt: dubblettskärmen mot
  utkastbeståndet (nedan) hittade `ba0fbcb4`, som har IDENTISKT tyskt namn
  och identisk `Technische Daten` rad för rad — och vars bilder visar
  exakt samma bord med SVART skiva. Den tyska prosan är alltså kopierad
  från det svarta syskonet. Den svenska texten skriver `Färg: Blå`.

- **`66d781f8` (bistrosetet): importens `Mått`-rad beskriver bara BORDET.**
  Källan har ingen `Gesamtmaße` alls — bara `Tischabmessungen: 60L x 60B x
  65H cm` och `Sitzabmessungen: 40B x 45T x 86H cm`. Spec-tabellen satte
  bordets mått som produktens, trots att varan är ett set i tre delar. Den
  svenska spec-raden skriver därför båda: `Bord 60 × 60 × 65 cm, stol
  40 × 45 × 86 cm`.

  ⚠️ `bygg-axelfacit.py` märkte samma sak mekaniskt och gav `{}` för just
  den produkten — den strukturella delmåttsdetektorn såg `Tischabmessungen:`
  och skrev ett FÖRKLARAT `axellos` i stället för att avbryta. Rätt
  beteende, och det är också kvittot på att generatorn inte hittade på ett
  totalmått som inte finns.

- **`e392b9d6` (leksaksbutiken): importens `Färg: Rosa` är halva sanningen.**
  Källans `Technische Daten` säger `Farben: Beige+Rosa`, och bilderna visar
  båda kulörerna i ungefär lika delar. Spec-raden skriver `Rosa och beige`.

## Inga egna terminologifel den här gången

`gate.py` gick REN på FÖRSTA körningen — 0 fynd i 8 filer, 0 varningar, med
siffergrind mot `kallor.json`. Till skillnad från N25 (`robust`,
"kippskydd") fanns alltså inget eget ordval att rätta innan skrivningen.

☠️ **Och facit är bevisat, inte avskrivet.** `kallor.json` och `bilder.tsv`
skrevs av från Wix-svaret, alltså genom exakt den transkribering huset har
mätt upp som felkällan. Båda kontrollerades därför mekaniskt mot skarpa V3
innan en enda grind kördes: FNV-1a över `plainDescription` per produkt och
över bildlistan, jämfört på servern. **8 av 8 text LIKA, 8 av 8 bildlista
LIKA.** Ett facit som inte är mätt mäter avskriften, inte källan.

## Dubblettskärmen: två färgsyskon, noll äkta dubbletter

Skärmen kördes i BÅDA riktningarna som `DUBBLETTMATNING.md` kräver — mot
den publicerade katalogen OCH mot resten av utkasten — och täckningen
räknades, eftersom en nolla utan täckning inte går att läsa.

| svep | lästa | med måtttrippel | träffar |
|---|---:|---:|---:|
| Publicerade sidor | 3 007 av 5 865 | 2 375 (79 %) | 2, båda falska |
| Utkast | 2 850 | 2 850 (100 %) | 4, varav 2 äkta syskon |

⚠️ `publUtanText` och `utkastUtanText` räknades och var **0 i båda svepen** —
alltså kom `fields` fram på varje sida. Utan den räknaren hade ett svep som
tappat fältet gett noll krockar och sett ut att ha gjort sitt jobb (#N9).

**De två falska:** lövblåsens 102 × 22 × 16 cm mot två väggväxthus.
Trippeln ligger inom toleransen men produkterna är inte i närheten av
varandra — samma klass av falsklarm som `DUBBLETTMATNING.md` dokumenterar
(*"kandidatens trippel var inte produktens fotavtryck"*).

**De två äkta träffarna är FÄRGSYSKON, inte dubbletter:**

| kandidat | syskon | vad som skiljer |
|---|---|---|
| `bd8af49c` hamsterbur, grå | `8847f712` (utkast) | `Farbe: Grau` mot `Farbe: Naturholz`, i övrigt identisk spec |
| `1f3077a4` trimbord, blått | `ba0fbcb4` (utkast) | blå skiva mot svart, i övrigt identiskt namn och identisk spec |

☠️ **Bildhashen gav NOLL träffar, och det är ett äkta negativt.** Alla tio
filerna har olika `hash` och tydligt olika filstorlek (huvudbilden 280 892
mot 440 457 byte på trimborden). Aosom levererar byte-identiska filer för
SAMMA artikel — de här är fotograferade var för sig, alltså olika artiklar.
Bildgrinden ser bara den byte-identiska klassen, precis som huset redan
skrivit ned.

**Ingen åtgärd behövs, och det är skälet som är värt att spara:** båda
syskonen är `visible: false` och ingår inte i rundan. Att publicera den grå
buren och det blå bordet skapar alltså ingen levande dubblett — det finns
ingen publicerad sida för någondera modellen. Presentationsfrågan för
färgsyskon (en sida per kulör, en sida med färgval, eller ett urval) står
kvar som Leonards, precis som `FARGSYSKONEN.md` lämnade den.

## Fyra bilder strukna — tysk text inbränd i pixlarna

Fyra av produkterna bär en tysk marknadsföringsgrafik på Wix-position 4
(feedens position 8). Den går inte att polera bort, så den ligger i
`bilder-bort.tsv` med skälet ordagrant:

| id | vad bilden säger |
|---|---|
| `1f3077a4` | PLATZSPAREND + "Bitte richten Sie die Stange … mit Kraft auf" |
| `583622e8` | ULTRASTABILE STRUKTUR · Dickwandiges Stahlrohr · Maximale Zuladung |
| `a23ea344` | LEICHTGEWICHT WENIGER BELASTUNG · NUR 4 KG |
| `53550f18` | VERSTELLBARE FÜSSE · Bleibt auf unebenem Boden stabil |

De fyra produkterna publiceras alltså med fyra bilder, de övriga fyra med
fem. `gate-alt.py` och `bygg-media.py` räknar antalet ur `bilder.tsv` minus
`bilder-bort.tsv` i stället för att anta fem, så ingen av dem klagade.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (FNV-1a, server-side) | 8 av 8 text LIKA, 8 av 8 bildlista LIKA — facit bevisat före första grinden |
| `gate.py` (siffergrind mot `kallor.json`, ordlista, flikar, taggar) | 0 fynd i 8 filer, 0 varningar — REN på första körningen |
| `bygg-axelfacit.py` + `gate-axel.py` | 0 axelfel i 8 texter; `66d781f8` korrekt märkt axellös (källan har bara delmått), 1 axelkonflikt i källan rapporterad (`583622e8`s nackkudde) |
| `gate-alt.py` | 0 fynd, 8 produkter, 36 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader (titlar 46–59 av 60, beskrivningar 136–159 av 160) |
| `gate-lager.py` | 0 fynd i 8 produkter, lägsta saldo 5 |
| `gate-sku.py` | 0 fynd i 8 rader (längsta 36 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` | 8 av 8 unika, noll krockar |
| `gate-superlativ.py` | 0 fynd, inga kvitterade superlativ behövdes |
| `gate-lankar.py` | 0 fynd, inga korslänkar i rundan |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 1 SEPARAT återläsning (`PLAIN_DESCRIPTION`, senare anrop) | 8 av 8 LIKA, alla `visible: true`, exakt 2 SEO-taggar per produkt |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 2 oberoende läsning (`MEDIA_ITEMS_INFO` uttryckligen begärd) | 8 av 8 LIKA — 5/5/4/4/4/4/5/5 bilder, ordning och alt-texter exakta |
| Steg 3 (kategori, bulk add-items) | 7 anrop, `totalFailures: 0`, per-rad `success: true` på alla 8 produkter |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | 8 av 8 skrivna; `visible` medskickat oförändrat, priset orört |
| Samlad separat slutläsning av alla fyra stegen | **8 av 8 helt verifierade** — text-hash, bildantal, produktens OCH variantens `visible: true`, rätt SKU, pris 1629, rätt kategori + Wix egna "All Products" |
| Mappningsstämpling + oberoende `las`-verifiering | 8 av 8 — varje `las`-logg läste tillbaka rätt SKU, `needsAiPolish: false`, `draftStatus: published` och `stämmer: true` |
| `hamta-live.sh` + `livegrind.py` (ISR-medveten live-verifiering) | 8/8 HTTP 200, **8/8 REN, 0 avvikelser** i den publicerade texten (orddiff 0 på alla åtta) |

☠️ **Steg 4 följer husets EGEN skrivare, inte en handbyggd kropp.**
`updateV3VariantPrices` skickar `options` bara när produkten HAR options
(`harOptions`), och alla åtta är enkelvarianta artiklar utan optioner —
anropet lade därför en spärr som HOPPAR ÖVER en produkt som visar sig ha
flera varianter, sakna `visible` i projektionen, eller bära options, i
stället för att gå en oprövad väg. Ingen av de åtta föll på den.

## Kategorier

Första N-rundan där ALLA åtta fick en matchande lövkategori — inget fall
behövde husregelns toppnivå-reserv:

| id | kategori |
|---|---|
| e392b9d6 (leksaksbutik) | Barn & Familj → Leksaker & Spel |
| bd8af49c (hamsterbur) | Husdjur → Burar, Kläder & Tillbehör |
| 1f3077a4 (trimbord) | Husdjur → Pälsvård & Skötsel |
| 583622e8 (träningsbänk) | Sport & Fritid → Träning & Gym |
| a23ea344 (lövblås) | Trädgård & Utemöbler → Trädgårdsskötsel & Bevattning |
| 53550f18 (trädgårdsstolar) | Trädgård & Utemöbler → Utemöbler |
| 651939aa (förvaringslåda) | Trädgård & Utemöbler → Trädgårdsdekor & Belysning |
| 66d781f8 (bistroset) | Trädgård & Utemöbler → Utemöbler |

`651939aa` följer N25:s vedförvaringshylla (`a41af4d0`): en möbel i trä för
uteplatsen vars bärande funktion är spaljé och krukhyllor hör till
`Trädgårdsdekor & Belysning`, inte till `Utemöbler`.

⚠️ Konventionen är EN riktig kategori per produkt plus Wix egna
`All Products` — kontrollerat mot fyra redan publicerade N25-produkter
innan skrivningen, inte antaget. Föräldrakategorin läggs alltså INTE till
bredvid lövet.

## Tre husmärken flaggade till Leonard

Tre av produkterna bär ett fysiskt tredjepartsmärke på själva varan. Det
går inte att redigera bort och skrivs därför ALDRIG in i produkttexten —
det flaggas här, samma hantering som HRC/VINSETTO/PawHut/SPORTNOW/
Outsunny/DURHAND i tidigare rundor:

| id | märke | var |
|---|---|---|
| `583622e8` | SPORTNOW | tryckt på nackkudden, synligt i bild 1, 2 och 3 |
| `a23ea344` | Outsunny | på blåsens hus, synligt i samtliga bilder |
| `651939aa` | Outsunny | oval metallplatta på lådans framkant |

`651939aa`:s platta är liten och sitter i skarven mellan lock och front —
den hittades genom att beskära huvudbilden i två steg ur originalets
2000 × 2000 px, inte genom att titta på miniatyren.

## ☠️ FLAGGAT: sju artikelnummer ligger committade i TIDIGARE rundors facit

Inte den här rundans fel, men hittat av den här rundan och därför
nedskrivet här. `lib/polish/artikelnummer-lackage.test.ts` är **RÖD** på
grenen, och har varit det sedan innan N26 började:

| runda | antal nummer i `kallor.json` |
|---|---:|
| N17 | 1 |
| N20 | 2 |
| N25 | 4 |
| **N26** | **0** |

Numren står i den TYSKA källtexten, på raden `✔ Artikelnummer: …` — alltså
i det facit varje runda sparar för siffergrinden. Repot är PUBLIKT, och
numret är exakt den sträng dealproffsen.se publicerar som `sku`/`mpn`:
den joinar vår produktsida mot deras och därmed mot vårt inköpsled.

⚠️ **N26 bidrar med noll, och det är MÄTT.** Rundans åtta källtexter
råkar sakna `Artikelnummer`-raden helt, och hela katalogen av rundans
28 filer svepdes dessutom med `gatelib.ARTNR` plus en ordlista
(`costUsd`, `landedCostSek`, `sourceUrl`, `supplierProductId`, `aosom.de`)
innan något committades: noll träffar.

**Åtgärden finns redan nedskriven och är INTE gjord här.** Runda L2 löste
samma sak genom att ersätta numret med `‹REDIGERAT›` i `kallor.json` och
bevisa att allt utanför numret är byte-identiskt
(`runda-l2-konstvaxter/kvitto-kalla.json`). Den rättelsen rör tre ANDRA
rundors artefakter och är dessutom redan pushad till ett publikt repo, så
den hör till ett eget, riktat jobb med Leonards ögon på sig — inte till en
poleringsrunda som råkade gå förbi. Det testet säger uttryckligen att det
inte finns någon allowlist och att noll är det ärliga utgångsläget; så
länge det är rött glider regeln.

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N25: inget `kort-filer.tsv` finns i rundans
katalog, så ingen produkt fick ett eget faktakort.
`bygg-medieskrivning.py` skriver då bildlistan exakt som `bygg-media.py`
lämnade den, och rapporterar "inget kort denna runda" per produkt — ett
uttalat val, inte en tyst utelämning.

## Fotoräknat tal, kvitterat

`foto-tal.txt` bär en enda rad: `583622e8` har **två** vadrullar, räknade på
bild 1 och 3. Källan skriver `Knöchelpolstern` i plural men anger aldrig
antalet, och utan kvittensen hade ordtalsvarningen flaggat ett påstående som
faktiskt är avläst ur fotot.

## Live-verifiering: 8/8 REN, 0 avvikelser

`hamta-live.sh` + `livegrind.py` mot de publicerade, ISR-färska sidorna:
**8/8 HTTP 200, 8/8 REN, 0 avvikelser i den PUBLICERADE texten.** Orddiffen
mot källfilen är 0 på alla åtta (366–410 ord per sida), och sid-, alt- och
SEO-svepen är rena — alltså renderas `<title>` och metabeskrivningen exakt
som `seo.tsv`, de tre flikrubrikerna matchar splittern ordagrant,
brödsmulan bär en riktig kategori på alla åtta, och ingen sida renderar
`OutOfStock`.

Sidorna var HELT nya — de svarade 404 som utkast — så den första hämtningen
är också den första renderingen. Skriptet väntade därför ut hela
femminutersfönstret innan den skarpa hämtningen. ⚠️ Att köra grinden före
det hade gett ett svar som ser ut precis som ett fungerande, samma fälla som
recensionsverifieringen gick i.

Två observationer ur hämtningen, båda ofarliga men värda att skriva ned:

- ⚠️ **`1f3077a4` svarade 500 med `age: 28571` på den varma träffen.**
  Slugen är ny, så edgen bar en gammal cachad post för en adress som inte
  fanns när den cachades. Den skarpa hämtningen gav `200` med `age: 0`,
  alltså en helt färsk rendering — och orddiffen på den är 0.
- ⚠️ **`66d781f8` serverades med `age: 431`,** alltså den rendering den
  VARMA träffen själv utlöste, inte den som omträffen skulle ha startat.
  Ofarligt här eftersom den varma träffen låg efter samtliga fyra
  skrivsteg, och grinden är ren — men det är precis den sortens tal man
  ska läsa innan man litar på ett svep. `hamta-live.sh`:s egen kommentar
  säger det rakt ut: en sida i taget är facit, ett svep är ett stickprov
  med tidsberoende.

Rundans fyra Wix-skrivsteg är dessutom redan oberoende verifierade var för
sig (tabellen ovan), så live-grinden är det FEMTE ledet, inte det enda.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i fem
separata led: facit mot skarpa Wix innan grindarna (8/8 LIKA),
textinnehållet efter skrivningen (8/8 LIKA mot fil-hash i en senare,
separat läsning), bild/kategori/SKU i en samlad slutläsning (8/8 helt
verifierade, med både produktens och VARIANTENS `visible: true`),
mappningsstämpeln via åtta oberoende `las`-körningar, och den publicerade
sidan via `livegrind.py`.

Rundan räknas som klar utom faktakorten, som är en medveten uppskjutning av
samma skäl som N15–N25.
