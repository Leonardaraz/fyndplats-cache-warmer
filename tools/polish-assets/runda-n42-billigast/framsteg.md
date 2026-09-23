# Runda N42 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Tredje rundan utan agenter, i huvudsessionen, tio produkter per vända
  (Leonards besked 2026-09-23). Urvalsregeln är densamma som i N40–N41: de
  billigaste opolerade utkasten i hela katalogen, billigast först, **utan
  prisjämförelse**. Kontrollerna som skyddar kunden gäller fortfarande.
- Grenen `claude/seo-polering-runbook-review-uq6fwl` på `a940379` (N41 klar och
  live-verifierad).
- `origin/main` hämtad: senaste "Runda …"-commit är fortfarande Runda 147, och
  senaste commit på main är `3516f83`. Mängden id som serien rör (1 661 id) är
  alltså oförändrad sedan N40.

## Urval — billigast först, utan prisjämförelse

Urvalet fortsätter där N41 slutade, i N41:s svep (61 sidor, 6 025 rader). Allt
under 499 kr är antingen publicerat, i `FLAGGADE.md` eller bortvalt av N41
(julgirlangen `0b34e594`, saldo 2). Kvar är 499-kronorsnivån, i id-ordning,
med N41:s fem reserver först. Varje kandidat prövades mot alla rundors
`ids.tsv` (327 id), `FLAGGADE.md` och main-serien (1 661 id). Ingen fanns i
main-serien.

| id | öde |
|---|---|
| `2cfd222e` konstväxt 95 cm | **vald** (N41-reserv) — trippelträffen `cf92c3bd` är en ANNAN växt, se nedan |
| `3e2c7389` skobänk i bambu, 70 cm | **vald** (N41-reserv) — storlekssyskon till N40:s publicerade `9c456097` (50 cm); tvillingen `a087ae3b` är samma bänk i VITT, ett utkast |
| `3ec9a0f5` utomhusmatta | hoppad över för säsongen, som i N41 |
| `520cc521` grön julgran 180 cm | **hålls** — färgsyskon till N41:s publicerade vita `1f887213` (rättelseraden i `FLAGGADE.md`) |
| `5c5aedca` vit julgran 150 cm med pynt | **vald** (N41-reserv) — se jämförelsen mot den publicerade `0f3e0839` nedan |
| `7f21945e` tre förvaringskorgar | **vald** (N41-reserv) |
| `7febe06d` skobänk med sittyta | **hålls** (N41) |
| `88a0ab0b` vattenkokare, beige | **hålls** — samma mått 24,2 × 19,5 × 23,4 som den PUBLICERADE `d8c2dec6` (grå/koppar), alltså färgsyskon |
| `985ff6d3` brödrost för två skivor | **vald** — trippelträffarna är frukostset; den svarta `1121b59a` har brödrost 27,4 × 17,8 × 19,2 cm, alltså en annan |
| `988ac121` brasskärm i tre delar | **vald** — namntvillingarna `6d0e2d27` (med dubbeldörrar) och `cbc31873` är utkast utan trippelträff, alltså andra skärmar |
| `9dd510a8`, `ab47e35d`, `fd85cf0b` | i `FLAGGADE.md` (N36/N37), orörda |
| `b138effc` trimningsarm för hund | **vald** |
| `cfb722e4` smal rullvagn | **vald** (saldo 24) |
| `d9276e3d` barnbil | **hålls** — AIYAPLAY tryckt på ryggstödet och en MINI-lik "S"-logga i grillen, se nedan |
| `dcf149d1` pall för barn | **vald** (saldo 39) |
| `e0cead19` lekmatta 176,5 × 148 | **hålls** — hopvikt samma mått, 74,5 × 36 × 10, som den PUBLICERADE `7ca63a31` (150 × 180, 599 kr) och samma upplägg; utfälld skiljer måtten, så om det är samma matta är Leonards fråga |
| `f981fbc0` miniugn 9 l, gräddvit | **hålls** — samma mått 35 × 24,6 × 20 som den PUBLICERADE silverfärgade `691ffc27`, färgsyskon |
| `fd940665` sidobord med skåp | **vald** — reserven, tog barnbilens plats |

**Dubblettskärmen** kördes i N41:s form över hela katalogen (61 sidor, 6 025
rader, `fields` på varje sida, självtest 9 av 9, `utanText` 0): 3 139
publicerade (2 517 med trippel), 2 886 utkast. Saldot lästes i samma anrop.

☠️ **Och en egen kontroll för DIAMETERMÅTTEN, som trippelskärmen inte kan
läsa.** Det var så `520cc521` slapp igenom i N41. Samma svep listade varje
PUBLICERAD sida som nämner en julgran och 150, och varje publicerad konstväxt
på 95 cm:

- **Julgranar på 150 cm:** tretton publicerade. Närmast ligger `0f3e0839`
  "Konstgjord julgran med pynt 150 cm – 48 kulor, klockor och kottar" (899 kr).
  Pyntet är av samma slag och lika många delar (48; här 18 + 6 + 6 + 6 + 12),
  men granen är en annan:
  `0f3e0839` är **grön**, 75 cm bred och väger 2,45 kg, medan `5c5aedca` är
  **vit**, Ø85 cm och 3,2 kg. Alltså en annan gran med samma pyntpaket, inte
  ett färgsyskon.
- **Konstväxter på 95 cm:** ingen publicerad.

**Tvillingutkasten från N41:s reservrad, avgjorda:**

- `cf92c3bd` (519 kr) är en konstgjord dieffenbachia på 95 cm, men krukan är
  Ø17 × 14,5 cm och vikten 4,7 kg. `2cfd222e` har kruka Ø15 × 13 cm och väger
  3 kg. **Olika växter.** Trippelträffen kom från paketmåtten (100 × 20 × 20
  mot 100 × 19 × 19 cm).
- `a087ae3b` (549 kr) har samma källtext som `3e2c7389` men `Farbe: Weiß`.
  **Samma bänk i vitt** — ett färgsyskon, båda utkast.

## Källorna och bilderna

- `kallor.json` transkriberad ur V3 och **verifierad server-side**: längd,
  h·31 och varje block om 250 tecken — **10 av 10 LIKA**. `bilder.tsv` mot
  `media.itemsInfo.items` i ordning — **10 av 10 LIKA**. Alla tio `visible:
  false`, revision 1–3.
- ☠️ **En källtext bär leverantörens artikelnummer** (`988ac121`). Den är
  ersatt med `‹REDIGERAT›` i facit, och kontrollen gjorde samma ersättning
  server-side före summan: **exakt en träff** på den, **noll** på de andra nio.
  Hämtningen redigerade numret redan på servern, så det har aldrig passerat
  chatten.
- `las` (polish-mapping.yml, `ref: main`, körningarna 3931–3940, var och en
  bevisad som min på `wixProductId` i loggen): alla `supplier: aosom`,
  `needsAiPolish: true`, `pending_review`, prisgrind `stämmer: true`, inget
  `LÅST PRIS`, ingen `SLUTSALD`, fraktandel 0,442–0,492. Saldo 24–197.
- Kontaktarken granskades före texten. Strukna bilder (`bilder-bort.tsv`):
  - `7f21945e` bild 5 — en bit av ett husmärke i vit text syns på vagnen i
    bakgrunden (bara "…y" syns, men tidigare rundor stryker loggor).
  - `988ac121` bild 3 — engelsk text inbränd i måttbilden (Expanded, Folded).
    Precedens: tidigare rundor stryker engelsk text i bilderna, även i
    måttbilder.
  - `b138effc` bild 3 och 4 — tysk text inbränd (en anvisning om att mäta
    hunden, och en banner med tyska rasnamn).
- Iakttagelser ur bilderna som styr texten:
  - **`d9276e3d`** (barnbilen) bär en rund AIYAPLAY-dekal på ryggstödet, och
    fronten är gjord som en MINI Cooper S med "S"-emblem i grillen. Hålls,
    samma skäl som N37:s `b2175a65`.
  - **`fd940665`**: miljöbilden visar också ett bredare konsolbord med låda.
    Det ingår inte, och både alt-texten och en fråga i texten säger det.
  - **`5c5aedca`**: paketen under granen på miljöbilden ingår inte. Frågan
    om pyntet säger det.
  - **`985ff6d3`**: knapparna på brödrosten är märkta CANCEL, REHEAT och
    DEFROST. Texten sitter på själva varan, så bilderna står kvar.
  - **`b138effc`**: trimbordet på bild 2 ingår inte, vilket texten säger.

## Grindar

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter (efter en omskrivning, se nedan; 2 axelkonflikter i källan, ingen i texten) |
| `gate-alt.py` | **REN**, 46 alt-texter |
| `gate-seo.py` | **0 fynd** |
| `gate-lager.py` | **0 fynd**, lägsta saldo 24 |
| `gate-sku.py` | **0 fynd** (längsta 30 av 40 tecken) |
| SKU-krock (64 `sku.tsv`, 509 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen + 670 i rundornas `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **0 fynd** (efter en rättelse, se nedan) |
| Formsvep efter artikelnummer i hela rundkatalogen | **0 träffar** (bara spänning och effekt i källan: `220-240V`, `780-930W`) |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`gate-axel.py` fällde rullvagnens "13 cm bred".** Källan skriver själv
"nur 13 cm breite Rollwagen", men måttraden är `47L x 13B x 96,5H`, och
husets konvention läser den som bredd × djup × höjd sett framifrån. Måttbilden
visar också långsidan som front. Med "13 cm bred" i brödtexten hade texten
alltså sagt emot sin egen spec-rad `47 × 13 × 96,5 cm`. Texten säger nu "13 cm
på den smala sidan", vilket är sant i båda läsningarna och fortfarande är det
kunden behöver veta. Namn och SEO-titel bär inte längre "13 cm bred". Grinden
är inte ändrad.

⚠️ **Läcksvepet fällde "Natur och svart"** i sidobordets spec-rad (ett
versalt "Natur" läses som tyska). Nu "Naturfärgad och svart".

## Korrektur och skeptisk granskning

**Korrekturläsningen** gav tre språkliga ändringar: "smal rullvagn … den smala
sidan" (upprepning), "Växten är gjord av … och hela växten väger" (upprepning)
och "5 kg var" → "5 kg vardera" i korgarnas SEO-beskrivning.

**Den skeptiska granskningen** ställde varje påstående mot källan och
bilderna. Den gav tre ändringar:

- **Julgranen:** frågan "Ingår pyntet på bilderna?" besvarades med ja, men
  miljöbilden visar också inslagna paket under granen, och de ingår inte.
  Frågan heter nu "Vilket pynt ingår?", och svaret säger att paketen inte
  följer med.
- **Konstväxten:** "Bladen är gjorda av PEVA och PE" tillskrev bladen hela
  produktens materiallista. Källan säger inte vilken del som är vad. Nu:
  "Växten är gjord av PEVA och PE."
- **Konstväxtens alt-text 5** sa "murgröna" om grönskan bakom spaljén. Det är
  en gissning; nu "grönska".

## Wix-skrivningen

Rundans filer pushades före Wix (`9b07d26`). Samma kommando kontrollerade
main: fortfarande `3516f83`, och senaste "Runda …"-commit var fortfarande
Runda 147.

| steg | vad | resultat |
|---|---|---|
| 1 | namn/slug/plainDescription/visible/seoData, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10 skrivna**, ingen spärr utlöst. Revision 1→2 på sju; 2→3 på `7f21945e` och `b138effc`, 3→4 på `988ac121` |
| 2 | media + alt-texter (måttbilden sist, fyra bilder strukna), spärr över id + alt i samma anrop | **10 av 10**, 46 bilder |
| 3 | kategorier, uppslag på namn i en färsk fråga i samma anrop | **20 av 20** rader `success` i nio kategorier, `totalFailures: 0` överallt |
| 4 | variant-SKU sist och ensam, round-trip ur färsk GET med options och visible | **10 av 10**; variant och produkt synliga före, variant-id = `variant.tsv`, priset orört (499 kr på alla tio) |
| 5 | separat återläsning (`steg5.js`) mot facit ur filerna | **9 av 10 helt verifierade** vid första läsningen. På `988ac121` stämde allt utom kategorin, se nedan. Alla tio `IN_STOCK` |

⚠️ **`988ac121` läste tillbaka med EN kategori i stället för två.** Facit är
`Hem & Inredning` plus Wix egen `All Products`, men produktens projektion
visade bara `All Products`. Steg 3 hade svarat `success` för raden (bulk
`totalSuccesses: 7, totalFailures: 0` för `Hem & Inredning`). Det är husets
dokumenterade släp i läsprojektionen (avsnittet om kategoriläsningen i
`CLAUDE.md`): facit är bulk-svarets per-rad `success`, inte en snabb
återläsning. Kontrollen gjordes därför en gång till mot kategori-API:t självt
(`list-categories-for-item`), som inte går via produktens projektion. Det
visade `Hem & Inredning` och `All Products` som direkta kategorier. Då
tolkades det som släpet, och ingen omskrivning gjordes.

☠️ **Tolkningen höll inte.** Live-sidan visade att projektionen fortfarande
saknade kategorin åtta minuter senare, och den har inte läkt sedan dess. Se
live-avsnittet nedan.

Stämpeln (`polish-mapping.yml` `stampla`, `ref: main`, körningarna 3941–3950,
`variant_skus` byggda med `bygg-steg.py --stampla`) — **10 av 10** `OK …
uppdaterad`, var och en bevisad som min på `PRODUCT_ID` i loggen. Varje stämpel
verifierad med en EGEN `las` efteråt (körningarna 3951–3960):
`needsAiPolish: false`, `draftStatus: published`, den nya SKU:n på
mappningsraden och prisgrinden `stämmer: true` på alla tio.

`FLAGGADE.md`: 25 rader tillagda sist, 0 borttagna (prefixet byte-identiskt
med kopian före ändringen).

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: alla tio `HTTP 200` med `age` 143–148. En sida gav först
`000` och gick fram på omförsöket. `livegrind.py`: **orddiff 0 på alla tio**
och **9 av 10 REN**. Den tionde, brasskärmen `988ac121`, föll på `KATEGORI
SAKNAS: brödsmulan går Hem / Butik / produkt`, se nedan.

Ur samma sidor kontrollerades resten med ett skript mot rundans filer (JSON-LD,
`<title>`, metabeskrivning, alt-texter och brödsmula). Skriptet är prövat åt
båda hållen: N41:s tio sidor gav 10 av 10, och fyra planterade fel i en kopia
av N41:s filer gav fyra träffar, var och en på rätt produkt. Utfall för N42:

- JSON-LD `InStock` och priset 499 kr på alla tio.
- Namnet i JSON-LD är lika med `namn.tsv`, och `<title>` och
  metabeskrivningen är exakt lika med `seo.tsv`, på alla tio.
- **46 av 46** alt-texter ur `alt.tsv` står på sidorna.
- Brödsmulan visar en av produktens egna kategorier på nio sidor, till exempel
  `Husdjur` för trimningsarmen och `Kök & Husgeråd` för brödrosten.
  Brasskärmen visar `Butik`.

### ☠️ Brasskärmens kategori når inte produkten

Kategori-API:t har kopplingen: `Hem & Inredning` och `All Products` som
direkta kategorier. Produktens egen projektion (`directCategoriesInfo`) visar
bara `All Products`, i både GET och sökindexet. Butiken läser projektionen:
produktsidan tar kategorin ur `collectionIds` från Wix `queryProducts`
(butiksgrenens `app/produkt/[slug]/page.tsx` och `lib/products.ts`, lästa
skrivskyddat). Därför faller brödsmulan tillbaka på `Butik`, och produkten
syns inte på kategorisidan för `Hem & Inredning`. Den är publicerad, köpbar
och syns i `/butik` och i sökningen.

Det är inte ISR-fällan från runda K3. Sidan renderades 14:04, åtta minuter
efter kopplingen, och Wix egen GET saknar kategorin fortfarande.

Tre försök att få projektionen att räknas om, inget med verkan:

| försök | utfall |
|---|---|
| ta bort och lägga tillbaka i samma anrop (`bulk/categories/remove-item` + `add-item`) | båda `success`; kategori-API:t visar kopplingen, projektionen oförändrad |
| en produktskrivning som inte ändrar något: `visible: true` med fältmask bara `visible` | revision 6 → 7; variant synlig, SKU och pris orörda; projektionen oförändrad |
| ta bort, vänta cirka två minuter (kategori-API:t bekräftade borttagningen), lägga tillbaka | båda `success`; projektionen oförändrad |

Produktens `entityEventSequence` stod på 9 efter det första paret.
Produktskrivningen tog den till 10, och det andra paret lämnade den på 10.
Räknaren lästes inte före det första paret. Den enda skillnad mot de nio andra
som går att se: brasskärmen är den enda med en enda kategori. De andra fick
en andra koppling, ett löv, direkt efter `Hem & Inredning`.

⚠️ **Ett fjärde försök gjordes INTE:** Products V3:s
`bulk/products/add-to-categories-by-filter`. Den väljer produkter med ett
filter och kör som ett asynkront jobb. Om filtret inte respekteras läggs hela
katalogen i kategorin, och `CLAUDE.md` har redan mätt ett filter som
`products/search` tyst ignorerar. Den risken är större än en brödsmula.

Punkten är öppen. Den läses om vid nästa kontroll av grenen. Har
projektionen inte läkt då är det en fråga till Leonard eller Wix support.

### Den andra korrekturläsningen

Den gjordes på den PUBLICERADE texten, plockad mekaniskt ur de hämtade sidorna
(662 rader). **Den gav inga fynd.**

Fem ställen prövades mot källan och bilderna i stället för att tas för givna.
Alla fem står sig:

- **Julgranen, "levereras utan ljusslinga".** Källans leveranslista räknar
  upp gran, metallfot och pyntet, men ingen belysning.
- **Korgarna, "grepp på kortsidorna".** Källtexten nämner dem inte, men bild 1
  visar ett urtaget grepp i kortsidan på alla tre korgarna. Metallramen och att
  plasten "släpper igenom luft" står i källan.
- **Brasskärmen, "håller barn och husdjur på längre avstånd",
  "tål värme" och gaskaminen.** Källan: *hält Kinder und Haustiere weiter vom
  Kaminbereich fern*, *hitzebeständige Schutzbarriere*, *passen gut zu
  Gaskaminen*.
- **Konstväxten, "95 cm, räknat med krukan".** Källan säger `Gesamthöhe: 95 cm`.
- **Brödrosten, materialet plast.** Källan säger `Material: Kunststoff`.

Ingen rättelse, alltså inget omskrivningsanrop.

## Uppföljning i N43: brasskärmens kategori har läkt

Läst om direkt efter N43:s steg 5, samma anrop som jämförde tolv tidigare
produkter med bara `Hem & Inredning` (N33–N39, alla med kategorin i
projektionen):

| | vid N42 | vid N43 |
|---|---|---|
| projektionen (`directCategoriesInfo`) | `All Products` | `All Products`, `Hem & Inredning` |
| `entityEventSequence` | 10 | **11** |
| `updatedDate` | — | **14:30:58** |
| revision | 7 | 7 |

Projektionen räknades alltså om av Wix självt, utan ny revision, ungefär en
halvtimme efter det sista försöket. Inget av de tre försöken behövdes.

Live 15:08, hämtad med `hamta-live.sh 130` (varm träff på en inaktuell sida
med `age` 3504, sedan en skarp hämtning med HTTP 200 och `age` 130):
`livegrind.py` **REN**, orddiff 0; `livekoll.py` **OK**, brödsmulan
`Hem & Inredning`, pris 499 kr och alt-texter 4 av 4.

Samma släp kom tillbaka i N43 på sidobordet `e01513c6`, som också var den
enda i sin runda med en ensam toppkategori. Det läkte på ungefär sex minuter
(15:04:40). Se N43:s `framsteg.md`.
