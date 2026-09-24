# Runda S3 — Semrush: plats 21–40, sökordsgap och de huvudord vi saknar sida för

Andra Semrush-varvet (2026-09-24). Tre frågor: vad håller sidorna på plats
21–40 kvar där, vilka sökord tar konkurrenten som vi inte syns på alls, och
varför.

## 1. Plats 21–40: titeln är INTE bromsen

`semrush-plats-21-40.csv`: 50 sökord med minst 100 sökningar i månaden där
fyndplats.se ligger på plats 21–40. De 30 produktsidorna lästes ur Wix, och
nästan alla har redan sökordet FÖRST i titeln:

| sökord | vol/mån | plats | titel i dag |
|---|--:|--:|---|
| uppblåsbart tält | 3 600 | 28 | *Uppblåsbart tält 2–3 personer – 2 rum & pump* |
| kattlåda med tak | 2 400 | 25 | *Kattlåda med tak – sluten med luktfilter* |
| radiostyrd grävmaskin | 1 300 | 24 | *Radiostyrd grävmaskin 1:20 med ljud & lampor* |
| marsvinsbur | 1 300 | 27 | *Marsvinsbur inomhus 90 × 53 × 59 cm – ramp och hjul* |
| badrumsskåp smalt | 880 | 24 | *Högskåp badrum smalt – badrumsskåp 148 cm vit* |

En omskriven titel flyttar dem inte. Det som lyfter en sida från sid 3 är
länkar in till den och en sida som samlar sökordet — se punkt 3.

Två småsaker i underlaget: marsvinsburen (`f3fdcd4a`) och gåbandet (`474a1b93`)
saknar ` | Fyndplats` i titeln.

**Slutsålda sidor drar mest volym:** *barncykel 16 tum* (2 900, plats 32) och
*cykel med stödhjul* (1 300, plats 30) går till den slutsålda `15cdea6c`;
*trummor barn* och *barn trummor* (880 var) till det slutsålda trumsetet.
Båda har en närliggande vara i lager i sidans "Liknande produkter"
(`barncykel-stodhjul-2-i-1`, `trumset-barn-3-delar-pall-cymbal`). *Löpband
hopfällbart* (880 × 4 varianter) går till det slutsålda gåbandet, och där
finns inget alternativ — katalogen har noll löpband i lager.

## 2. En gammal adress rankade — och slutade i 404

`/product-page/baby-toys-silicone-teether-…` (Wix-tidens adress) ligger 22:a
på *bitleksak bebis* (720/mån). Mätt: `308` → `/produkt/<samma slug>` →
**`404`**. Rankningen var på väg att försvinna.

Butiken säljer ingen bitleksak, så raden i `FyndplatsRedirects` pekar på
närmaste hylla, `/kategori/baby-smabarn`. Sluggen står INTE i butikens
`data/retired-china-slugs.json`, så raden läses på 404-vägen och biter —
till skillnad från handdammsugaren i runda S1.

**Verifierat live:** `/product-page/…` → 308 → `/produkt/…` → 308 →
`/kategori/baby-smabarn`, **200**.

⚠️ **Två cacher står i vägen, och båda måste vänta ut.** Workflowen gick grön
och skrev raden (`written: [...]`), men sidan svarade 404 i sju minuter till:
uppslaget cachas fem minuter per slug (`lib/redirects.ts`, `revalidate: 300`),
och min egen kontroll före skrivningen hade fyllt just den cachen med "ingen
redirect". Därefter serverade ISR den cachade 404-sidan en gång till. Först
hämtningen EFTER den som triggade omrenderingen gav 308 (`age: 10`,
`x-vercel-cache: HIT`). Ett grönt jobb är inget kvitto, och det är inte den
första hämtningen efter fönstret heller.

## 3. Huvudorden: vi syns inte alls, för att det inte finns en sida att visa

Sökordsgap mot costway.se (närmaste konkurrent i Semrushs data, 27 gemensamma
sökord) och volymerna för de svenska huvudorden. "I lager" är publicerade
produkter i vår katalog med ordet i namnet, räknat i Wix samma natt:

| huvudord | vol/mån | KD | vi i dag | i lager hos oss |
|---|--:|--:|---|--:|
| **julgran** | **22 200** | 25 | syns inte | **56** |
| plastgran · julgran med belysning | 5 400 · 5 400 | 25 · 18 | syns inte | (samma) |
| **badrumsskåp** | **27 100** | 20 | syns inte | 33 |
| **skoskåp** · skohylla · skoställ | 18 100 · 18 100 · 8 100 | 25–28 | syns inte | 28 |
| katträd · klösträd | 8 100 · 5 400 | 23–27 | syns inte | **62** |
| **elbil barn** | 8 100 | **14** | syns inte | 16 (+ 87 utkast) |
| kattlåda | 8 100 | 23 | syns inte | 13 |
| vinställ | 9 900 | 29 | syns inte | 13 |
| hundbur | 5 400 | 21 | syns inte | 31 (inkl. grindar) |
| redskapsbod | 4 400 | 18 | syns inte | 18 |
| hundkoja | 2 400 | **10** | syns inte | 10 |
| skrivbord | 33 100 | 26 | syns inte | 42 |

Runt **200 000 sökningar i månaden** på ord där vi har sortimentet — och
svårighet 10–29, alltså inte Clas Ohlsons ord.

☠️ **Orsaken är strukturell.** Butiken har 41 kategorier och alla är breda
(*Hem & Inredning*, *Förvaring & Organisering*, *Utelek & Spel*). Huvudord
vinns av listningssidor, och ingen av våra listningssidor handlar om en
julgran, ett skoskåp eller ett badrumsskåp. Produktsidorna kan inte ta de
orden: sökaren vill jämföra, inte landa på en enskild vara.

`lib/category-seo.ts` på `headless-site` säger själv principen: *"Nischat före
brett … en ung domän rankar inte där, men på den smalare frasen finns en
verklig chans."* Orden ovan ÄR de smalare fraserna — det som saknas är sidorna.

### Förslaget: sökordskategorier, julgranar först

Per sida krävs två saker, och ingen ny kod:

1. **Wix:** en ny underkategori (t.ex. *Julgranar*, slug `julgranar`) och
   produkterna kopplade till den. Kopplingen är ADDITIV — ingen produkt
   lämnar en befintlig listning, vilket `tools/kategorifix/README.md` visar
   är risken åt andra hållet.
2. **Butiken:** en post i `CATEGORY_SEO` (titel ≤ 48 tecken + beskrivning) och
   i `CATEGORY_CONTENT` (intro + tre frågor), nycklade på sluggen. Utan posten
   fungerar sidan ändå, bara med mallens titel.

⚠️ **Menyn byggs ur Wix-trädet** (`buildCategoryTree`, parentId), så en ny
underkategori syns i navigationen direkt. Det är en synlig ändring av butiken
och därmed Leonards beslut — liksom att butiksändringen bygger en deploy (den
ska samåka med nästa).

⚠️ **Julgranarna först, och nu.** Sökningarna toppar i november–december
(Semrushs trend: 0,82 → 1,00 → 0,07), och en ny sida behöver veckor för att
indexeras och klättra. 56 granar i lager är redan en fullständig
listningssida. Utkastet ligger i `julgranar-forslag.md`.

## Semrush-kostnad

~2 900 API-enheter: konkurrenter 600, plats 21–40 500, sökordsgapet 1 600 (20
rader — rapporten kostar 80 enheter per rad, använd sparsamt), volymer 200.
