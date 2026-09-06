# Runda E2 — sex Polstersessel, fem publicerade

✅ **PUBLICERAD 2026-09-06.** Fem av sex ligger ute. Den sjätte (`1877cf83`)
är stoppad — den är slutsåld och borta ur Aosoms feed, se nedan.

Med den här rundan är `^Polstersessel` genomgången: 8 i E1 + 6 här = 14.

| id | slug | pris | vad det är |
|---|---|---:|---|
| `1877cf83` | ⛔ *ej publicerad* | 2 889 kr | cord, fotpall, 180 kg — **slutsåld, ur feeden** |
| `5d150926` | snurrfatolj-svart-stalfot | 2 159 kr | **fjärde färgen** i publicerad familj |
| `6d327e6b` | loungefatolj-teddyfleece-77-cm | 1 899 kr | 77 × 77 cm, teddyfleece |
| `99b812a6` | fatolj-skandinavisk-stil-gummitra-cremevit | 1 629 kr | **färgsyskon** till publicerad sida |
| `87f2551f` | loungefatolj-gummitra-65-cm-cremevit | 1 499 kr | 65 × 80 cm, S-fjädrar |
| `c3e9b292` | fatolj-furuben-linnelook-cremevit | 1 239 kr | låg, 72 cm, furuben |

## ☠️ Varför `1877cf83` inte publicerades — och varför grindens skäl var fel

Prisgrinden (körning 1360) fällde raden med *"kostnaden har ändrats sedan
importen och priset i Wix är gammalt"*. Talen säger något annat:

```
landedCostSek 2404,4
forvantat     2899      ← 1,20 × 2404,4 = 2885,28 → charm99
faktiskt      2889      ← samma tal      → charm9
```

Båda talen härleds ur SAMMA kostnad. Kostnaden har alltså inte rört sig —
avrundningsstrategin byttes 2026-09-03 och den här raden har inte hunnit med.

**Skälet står i `lib/aosom/sync.ts:365`:**

```ts
// Bara när raden finns: utan rad finns inget nytt pris att räkna på, och ett
// gammalt pris på en slutsåld vara skadar ingen.
if (!row || opts.skipPrices || !variant) return plan;
```

Saknas artikeln i feeden räknas priset **aldrig** om. Och `nyttSaldo` blir
`null` när saldot redan är noll, så ingen skrivning sker och `aosomSyncedAt`
fryser. Mappningsraden bär `aosomSyncedAt: 2026-08-29` och `aosomSyncedQty: 0`
— åtta dygn utan att synken rört den.

**Mätt i Wix samma dag:** saldo `0`, `trackQuantity: true`, ingen förbeställning,
`revision: 1`. Produkten är slutsåld och oköpbar. Att stoppa den är rätt; det
var bara diagnosen som pekade åt fel håll. Se uppgift #142.

## ☠️ Saldot kollades aldrig före poleringen — det borde det

Prisgrinden fångade `1877cf83` av en **bieffekt**. Ingenting i arbetsgången
frågar "går den här varan att köpa?" innan en text skrivs.

Alla sexton förberedda produkter (E2 + E3) saldokollades därför i efterhand:

| runda | saldon |
|---|---|
| E2 | **0**, 69, 99, 74, 3, 66 |
| E3 | 197, 197, 169, 39, 197, 14, 14, 54 |

Bara den ena. Men en sida för en vara ingen kan köpa är slöseri i båda ändar,
och kollen kostar ett anrop för hela rundan.

⚠️ Två E3-id fanns bara som åttateckensprefix när frågan ställdes, och jag
fyllde i svansen på dem. Svaret "INGA LAGERRADER" på de två är alltså ett
mätfel av mig, inte ett fynd. De är stoppade av andra skäl (#140).

## ✅ Fem externa korsreferenser — alla verifierade mot facit

Texterna jämför sig mot publicerade syskonsidor. Varje sådant påstående är ett
påstående om en ANNAN sida, och den klassen av fel har den här familjen redan
gjort tre gånger (de falska superlativen nedan). Alla fem lästes därför mot
den publicerade sidan:

| påstående | facit i butiken |
|---|---|
| `5d150926` "våra tre andra" | tre publicerade syskon, identiska ner till paketet 77 × 56 × 39 |
| `6d327e6b` sherpafleece "67 × 67 cm" | *"Fåtöljen mäter 67 × 67 × 71 cm"* |
| `87f2551f` skandinavisk "68 bred, 74 djup" | *"Mått: 68 × 74 × 82 cm"* |
| `99b812a6` "paket 69 × 34 × 61", ljusgrå | varje tal stämmer, `Färg: ljusgrå` |
| `c3e9b292` chenille "sitsen på 50 cm" | *"Sits: 48 × 46 × 50 cm"* |

☠️ **Och namnet var fel.** `5d150926` hette i planen *"Snurrfåtölj med fotpall
på stålfot, svart"* medan de tre publicerade syskonen heter *"Fåtölj med lös
fotpall på rund stålfot, bär 150 kg – ‹färg›"*. Namnet är rättat till
familjens. Sluggen (`snurrfatolj-svart-stalfot`) följde redan familjen.

⚠️ Kvar som inkonsekvens: den publicerade `fatolj-skandinavisk-stil-gummitra`
bär ingen färg i namnet, men är nu ena halvan av ett tvåfärgspar. Att döpa om
en publicerad sida är Leonards beslut, inte poleringens.

## ☠️ Tre av fem delade EN SKU

`5d150926`, `6d327e6b` och `87f2551f` bar alla `FP-polstersessel`. Samma fynd
som batch 66, i en ny familj. Importen härleder SKU:n ur den tyska titelns
första ord, så produkter vars titlar börjar likadant får samma sträng.

Nya, unika SKU:er skrivna på båda sidorna:

| id | SKU |
|---|---|
| `5d150926` | `FP-snurrfatolj-svart-stalfot` |
| `6d327e6b` | `FP-loungefatolj-teddyfleece-77` |
| `87f2551f` | `FP-loungefatolj-gummitra-65` |
| `99b812a6` | `FP-fatolj-skandinavisk-cremevit` |
| `c3e9b292` | `FP-fatolj-furuben-linnelook` |

⚠️ **Omfattningen i hela katalogen går inte att mäta härifrån** — se #143.
Produktsökningen returnerar inte varianter i någon projektion, och
`variantsInfo.variants.sku` går inte att filtrera på. En loop över 5 502
produkter gav `skuerLasta: 0` — ett TOMT svar som såg ut som "noll dubbletter".

## ☠️ Två av sex är färgsyskon till sidor vi redan säljer

Hittade på MÅTT. Ingen namnjämförelse hade sett något av dem.

**`5d150926`** heter *"Polstersessel, Akzentsessel mit Hocker, drehbar,
ergonomisch"* och är fjärde färgen av vår publicerade snurrfåtölj på stålfot.
Varenda tal är identiskt — golvyta 71 × 69, höjd 104, tillbakalutad 93 × 97,
sits 47 × 47 på 45, rygg 48 × 64, armstöd 30 × 12 × 15, fotpall 42 × 43 och
35–40 cm, fot Ø55, 150 och 50 kg — **inklusive vikt 22 kg och paketmått
77 × 56 × 39 cm**.

**`99b812a6`** är färgsyskon till `fatolj-skandinavisk-stil-gummitra`. Även
här stämmer varje tal, paketmåttet 69 × 34 × 61 inräknat.

**Båda är äkta nya färger, inte dubbletter — mätt på pixlar, inte på
etiketter.** `99b812a6` mäter (216,213,204) mot den publicerades (171,166,168)
över tre beskärningar: 45–65 ljusare per kanal och varmare i tonen.
`5d150926` skildes bara med 2 per kanal i en av tre beskärningar, så den
avgjordes med ögon i stället: en bild bredvid de tre publicerade visar samma
stol i fyra tyger, och utkastets är märkbart mörkare och slätare än den
publicerade mörkgrå.

☠️ **Följden för namngivningen:** båda ska slugga in i sin befintliga familj
(`snurrfatolj-…-stalfot`, `fatolj-skandinavisk-stil-gummitra-…`), inte få
ett påhittat eget namn. En femte snurrfåtölj som heter något annat är en
sida kunden inte hittar från de andra fyra.

## ☠️ Tre falska superlativ — som grinden inte kunde se

Första utkastet innehöll tre påståenden om sortimentet:

| jag skrev | verkligheten |
|---|---|
| *"180 kg — den högsta bärigheten bland våra fåtöljer med fotpall"* | omätt; ett dussin publicerade fåtöljer med fotpall är inte kontrollerade |
| *"13 kg — den lättaste fåtöljen med träram vi säljer"* | **fel** — `sammetsfatolj-senapsgul` väger 9 kg, `cocktailfatolj` 10 kg |
| *"10,8 kg — den lättaste i vårt sortiment av fåtöljer med träram"* | **fel**, samma två motexempel |

Alla tre är borta. Två av dem var motbevisade av tal jag hade framme i samma
arbetspass — jag hade läst `sammetsfatolj-senapsgul`s 9 kg en halvtimme
tidigare, i dubblettkollen.

☠️ **Filgrinden kan inte fånga det här.** Varje SIFFRA fanns i källan; det
var påståendet OM SORTIMENTET som var obelagt. Samma klass som D1:s *"den
längsta liggytan bland våra bäddfåtöljer"*. **Regeln: ett superlativ är ett
påstående om alla andra sidor, och det måste mätas mot alla andra sidor —
annars skriv det mätta talet i stället.**

## ☠️ Steg 2 — tre fynd

### 1. Två motstridiga liggmått (`1877cf83`)

Specen ger både `Maximale Liegefläche: 68 × 117 × 56` och
`Liegegröße (Max.): 68 × 108 × 75`. 117 och 108 kan inte båda vara samma
mått, och varken det ena eller det andra går ihop med stolens djup 91,5 plus
fotpallens 48 (= 139,5). **Inget av dem skrivs.**

### 2. Ritningen och specen är oense om en dyna (`c3e9b292`)

Måttritningen skriver 13 cm, specraden 12 cm. Skillnaden går inte att
härleda ur övriga mått. **12 cm skrivs** — det är siffran som står i text,
och att överdriva en dynas tjocklek är fel riktning att fela åt.

### 3. Materiallistan säger metall, bilderna visar trä (`6d327e6b`)

Benen ser ut som trä på varje foto. Materiallistan säger `Metall`, och
källtexten skriver `Beine in Holzoptik` — träoptik. Texten säger därför
*"metall med träfärgad yta"*. En kund som tror sig köpa träben ska inte
behöva upptäcka det vid uppackningen.

## ☠️ En tysk grafik till — tredje rundan i rad

`1877cf83` bild 4 är en monteringsgrafik med tysk text inbränd:
*"Öffnen Sie den Reißverschluss unter dem Sitz, um an die Montageteile zu
gelangen"*. Ska tas bort vid publiceringen; produkten får fyra bilder.

Sammanlagt tre rundor, tre grafiker, alla på **position 4** — samma position
varje gång. `RENA_BILDPOSITIONER = [1,2,3,8,9]` tar redan bort 4–7 ur
importen, så de här har kommit in på annat sätt eller före regeln. Värt en
mätning: hur många publicerade sidor bär en grafik på plats 4?

## Måttritningarna bekräftade allt

Bild 3 är en måttritning på alla sex och stämde överallt. Den avgjorde
dessutom en tolkningsfråga på `1877cf83`, där specens bokstäver är
inkonsekventa (`68L x 91,5B` mot `68B x 117T`): ritningen visar 68 cm som
BREDD och 91,5 cm som DJUP, och 52 + 36 = 88 bekräftar att 52 är sitthöjden.

## Grindarna

| grind | utfall |
|---|---|
| Prisgrind (körning 1360–1365) | **5 gröna, 1 fälld** → `1877cf83` stoppad |
| Saldokoll i Wix | **5 köpbara, 1 slutsåld** |
| Filgrind (mönster + tal) | **0 fynd i 6 filer** |
| Mutationstest av grinden | 4 injicerade fel → 5 fynd, 0 falska |
| Superlativgranskning (ögon, inte grind) | 3 fynd → alla borttagna |
| Externa korsreferenser mot facit | **5 påståenden, 5 sanna** |
| Bildgranskning | 1 tysk grafik hittad, 29 bilder rena |
| Checksumma efter skrivning | **5/5 identiska** — 3726, 3097, 2958, 2927, 2543 tecken |
| Alt-texter | **25 skrivna**, 0 tomma, 0 tyska |
| SKU:er | 3 delade `FP-polstersessel` → 5 unika skrivna, priser orörda |
| Stämpling (körning 1366–1370) | **5 gröna** |

## ⚠️ Fyra nästan identiska cremevita trästolar

`99b812a6` (1 629), `87f2551f` (1 499) och `c3e9b292` (1 239) är alla
cremevita på ljus träram, och den publicerade
`fatolj-skandinavisk-stil-gummitra` (1 699, ljusgrå) är samma modell som
`99b812a6`. Måtten skiljer dem — 68 × 74 × 82, 65 × 80 × 83 och 64 × 70 × 72
— men på ett produktkort ser de nästan likadana ut.

Samma fråga som #122 om öronlappsfåtöljerna. Texterna gör skillnaden tydlig
genom att jämföra dem mot varandra på måtten, men om de ska ligga i samma
kategori är Leonards beslut.

## ✅ Live-grinden: 5/5 REN

Kört mot de publicerade sidorna 2026-09-06, ISR-medvetet (varm träff → 60 s →
skarp hämtning; `age` 62–66 s bekräftar att det var den FÄRSKA renderingen och
inte den cachade gamla sidan).

```
5d150926 snurrfatolj-svart-stalfot:                   ord=452 diff=0 -> REN
6d327e6b loungefatolj-teddyfleece-77-cm:              ord=373 diff=0 -> REN
99b812a6 fatolj-skandinavisk-stil-gummitra-cremevit:  ord=367 diff=0 -> REN
87f2551f loungefatolj-gummitra-65-cm-cremevit:        ord=367 diff=0 -> REN
c3e9b292 fatolj-furuben-linnelook-cremevit:           ord=310 diff=0 -> REN

TOTALT: 0 avvikelser i den PUBLICERADE texten
```

⚠️ **Alt-texterna kontrollerades separat mot live-HTML:en.** Grindens alt-svep
letar efter tyska, husmärken och artikelnummer — en TOM alt hade passerat det.
Räknat på de hämtade sidorna: sex svenska alt-strängar per sida, **noll tomma,
noll tyska**.

Stämplingen verifierad på `c3e9b292` genom att läsa tillbaka mappningsraden:
`sku: "FP-fatolj-furuben-linnelook"`, `draftStatus: "published"`,
`needsAiPolish: false`, prisgrinden `1239 = 1239`.
