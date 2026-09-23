# Runda N42 — tio produkter för 499 kr

Tio Aosom-utkast polerade och publicerade: en konstgjord växt på 95 cm, en
skobänk i bambu på 70 cm, en vit julgran på 150 cm med pynt, tre
förvaringskorgar med lock, en brödrost för två skivor, en brasskärm i tre
delar, en trimningsarm för hund, en smal rullvagn med fem plan, en pall för
barn och ett sidobord med skåp.

**Tredje rundan utan agenter**, i huvudsessionen, tio produkter per vända
(Leonards besked 2026-09-23). Urvalet är billigast först utan prisjämförelse,
som i N40–N41. Allt är pushat på grenen `claude/seo-polering-runbook-review-uq6fwl`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 2cfd222e | Konstgjord växt 95 cm med 33 blad – kruka med cementbotten, inne och ute | FP-konstvaxt-95-33-blad | 499 kr | 127 |
| 3e2c7389 | Skobänk i bambu med två hyllplan – 70 cm bred, sittyta som bär 130 kg | FP-skobank-bambu-70-tva-plan | 499 kr | 97 |
| 5c5aedca | Vit julgran 150 cm med pynt – kulor, klockor, trummor, klappar och kottar | FP-julgran-vit-150-med-pynt | 499 kr | 197 |
| 7f21945e | Förvaringskorgar med lock, tre storlekar – grå flätad plast, 18, 12 och 7 liter | FP-forvaringskorgar-lock-3-gra | 499 kr | 109 |
| 985ff6d3 | Brödrost för två skivor med sju rostlägen – värmegaller och upptining, svart | FP-brodrost-2-skivor-7-lagen | 499 kr | 98 |
| 988ac121 | Brasskärm i tre delar – svart metall med rutmönster, 100 × 51 cm, fällbar | FP-brasskarm-3-delar-svart | 499 kr | 137 |
| b138effc | Trimningsarm för hund med bordsklämma – höjdjusterbar, för hundar upp till 20 kg | FP-trimningsarm-hund-klamma | 499 kr | 197 |
| cfb722e4 | Smal rullvagn med fem plan – 47 × 13 × 96,5 cm, nätkorgar och skiva i trälook | FP-rullvagn-smal-5-plan | 499 kr | 24 |
| dcf149d1 | Pall för barn med tre steg och handtag – ställs om till två steg, 2–5 år | FP-pall-barn-3-steg-handtag | 499 kr | 39 |
| fd940665 | Sidobord med skåp i industristil – trälook och svart stål, 40 × 30 × 76 cm | FP-sidobord-skap-industri | 499 kr | 101 |

**Inget pris är rört.** Prisgrinden stämde (`x1,2`, `charm99`) både i
urvalets `las` och i verifieringen efter stämpeln.

## Urvalet — billigast först, utan prisjämförelse

Urvalet fortsatte där N41 slutade. Allt under 499 kr var redan publicerat,
fanns i `FLAGGADE.md` eller var bortvalt av N41 (julgirlangen `0b34e594`,
saldo 2). Kvar var 499-kronorsnivån. Den togs i id-ordning, med N41:s fem
reserver först. Varje kandidat prövades mot alla rundors `ids.tsv` (327 id),
`FLAGGADE.md` och main:s "Runda …"-serie (oförändrad, senast Runda 147). Ingen
fanns i main-serien.

Dubblettskärmen körde i N38–N41:s form (ofiltrerat svep, `fields` på varje
sida, trippelmönstrets självtest 9 av 9, `utanText` 0) över 61 sidor och
6 025 rader: 3 139 publicerade sidor, varav 2 517 med trippel, och 2 886
utkast. Saldot lästes i samma anrop.

☠️ **Diametermåtten fick en egen kontroll.** Trippelskärmen kan inte läsa
`Ø55 x H180`, och det var så den gröna granen `520cc521` slapp igenom i N41.
Samma svep listade därför varje PUBLICERAD sida som nämner en julgran och 150,
och varje publicerad konstväxt på 95 cm:

- **Julgranar på 150 cm:** tretton publicerade. Närmast ligger `0f3e0839`
  (899 kr), som har pynt av samma slag och lika många delar, 48 stycken. Men
  den granen är **grön**, 75 cm bred och väger 2,45 kg. `5c5aedca` är **vit**,
  Ø85 cm och väger 3,2 kg. Det är alltså en annan gran med samma pyntpaket,
  inte ett färgsyskon.
- **Konstväxter på 95 cm:** ingen publicerad.

Sex kandidater hölls eller hoppades över:

| skäl | id |
|---|---|
| färgsyskon till en sida publicerad i N41 | `520cc521` grön julgran 180 cm (vita `1f887213`) |
| färgsyskon till en publicerad sida, samma mått | `88a0ab0b` vattenkokare, beige (`d8c2dec6`) · `f981fbc0` miniugn, gräddvit (`691ffc27`) |
| husmärket tryckt på produkten, och en MINI-lik front | `d9276e3d` barnbil |
| hopvikt samma mått som en publicerad lekmatta, utfälld inte | `e0cead19` lekmatta |
| säsong: trädgård i slutet av september | `3ec9a0f5` utomhusmatta |

`7febe06d` hölls redan i N41, och `9dd510a8`, `ab47e35d` och `fd85cf0b` stod
redan i `FLAGGADE.md`. Barnbilens plats gick till reserven `fd940665`.

Två tvillingutkast från N41:s reservrad är avgjorda:

- **`cf92c3bd`** är en ANNAN växt än `2cfd222e`. Krukan är Ø17 × 14,5 cm och
  växten väger 4,7 kg, mot Ø15 × 13 cm och 3 kg. Trippelträffen kom från
  paketmåtten.
- **`a087ae3b`** har samma källtext som skobänken `3e2c7389`, men `Farbe:
  Weiß`. Det är samma bänk i vitt. Den billigare naturfärgade är publicerad,
  och den vita står i `FLAGGADE.md` som färgsyskon.

Varje trippelträff mot en vald produkt är genomläst i `framsteg.md`.

## Källan och bilderna — granskade före texten

`kallor.json` transkriberades ur V3 och verifierades server-side med längd,
h·31 och varje block om 250 tecken: **10 av 10 LIKA**. `bilder.tsv` mot
`media.itemsInfo.items` i ordning gav också **10 av 10 LIKA**.

☠️ **En källtext bär leverantörens artikelnummer** (`988ac121`). I facit är
numret ersatt med `‹REDIGERAT›`, och kontrollen gjorde samma ersättning
server-side före summan. Det gav **exakt en träff** på den och noll på de
andra nio. Numret redigerades redan vid hämtningen på servern, så det har
aldrig passerat chatten.

`las` (körningarna 3931–3940, `ref: main`) var grön på alla tio: `aosom`,
`needsAiPolish: true`, `pending_review`, prisgrind `stämmer: true`, inget
`LÅST PRIS` och ingen `SLUTSALD`. Fraktandelen låg på 0,442–0,492 och saldot
på 24–197.

Kontaktarken byggdes innan en rad text skrevs. Fyra bilder ströks:

- **`7f21945e`** bild 5. En bit av ett husmärke i vit text syns på vagnen i
  bakgrunden. Bara "…y" syns, men tidigare rundor stryker loggor.
- **`988ac121`** bild 3, som har engelsk text inbränd i måttbilden
  (Expanded, Folded). Tidigare rundor stryker engelsk text i bilderna, även i
  måttbilder.
- **`b138effc`** bild 3 och 4, båda med tysk text inbränd: en anvisning om
  att mäta hunden och en banner med tyska rasnamn.

Iakttagelser ur bilderna som styr texten:

- **`fd940665`**: miljöbilden visar också ett bredare konsolbord med låda.
  Det ingår inte. Både alt-texten och en fråga i texten säger det.
- **`5c5aedca`**: paketen under granen på miljöbilden ingår inte. Frågan om
  pyntet säger det.
- **`985ff6d3`**: knapparna på brödrosten är märkta CANCEL, REHEAT och
  DEFROST. Texten sitter på själva varan, så bilderna står kvar.
- **`b138effc`**: trimbordet på bild 2 ingår inte, och texten säger det.

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter (efter en omskrivning, se nedan) |
| `gate-alt.py` | **REN**, 46 alt-texter |
| `gate-seo.py` | **0 fynd** |
| `gate-lager.py` | **0 fynd**, lägsta saldo 24 |
| `gate-sku.py` | **0 fynd** (längsta 30 av 40 tecken) |
| SKU-krock (64 `sku.tsv`, 509 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen + 670 i rundornas `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **0 fynd** (efter en rättelse, se nedan) |
| Formsvep efter artikelnummer i hela rundkatalogen | **0 träffar** |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`gate-axel.py` fällde rullvagnens "13 cm bred".** Källan skriver själv
"nur 13 cm breite Rollwagen", men måttraden är `47L x 13B x 96,5H`, och
husets konvention läser den som bredd × djup × höjd sett framifrån. Med "13 cm
bred" i brödtexten hade texten sagt emot sin egen spec-rad. Den säger nu "13 cm
på den smala sidan", vilket är sant i båda läsningarna. Namnet och SEO-titeln
bär inte längre "13 cm bred". Grinden är inte ändrad.

⚠️ **Läcksvepet fällde "Natur och svart"** i sidobordets spec-rad, eftersom
ett versalt "Natur" läses som tyska. Nu står det "Naturfärgad och svart".

## Två granskningar före skrivningen — båda egna

**Korrekturläsningen** gav tre språkliga ändringar. Två var upprepningar:
"smal rullvagn … den smala sidan" och "Växten är gjord av … och hela växten
väger". Den tredje var "5 kg var", som blev "5 kg vardera" i korgarnas
SEO-beskrivning.

**Den skeptiska granskningen** ställde varje påstående mot källan och
bilderna. Den gav tre ändringar:

- **Julgranen:** frågan "Ingår pyntet på bilderna?" besvarades med ja. Men
  miljöbilden visar också inslagna paket under granen, och de ingår inte.
  Frågan heter nu "Vilket pynt ingår?", och svaret säger att paketen inte
  följer med.
- **Konstväxten:** "Bladen är gjorda av PEVA och PE" tillskrev bladen hela
  produktens materiallista, och källan säger inte vilken del som är vad. Nu
  står det "Växten är gjord av PEVA och PE".
- **Konstväxtens alt-text 5** sa "murgröna" om grönskan bakom spaljén. Det
  var en gissning, så nu står det "grönska".

## Skrivningen, stämpeln och verifieringen

Rundans filer pushades före Wix (`9b07d26`). Samma kommando kontrollerade
main: oförändrad på `3516f83`, och senaste "Runda …"-commit var fortfarande
Runda 147.

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10**, ingen spärr utlöst |
| 2 media (fil-id + alt, måttbilden sist) | **10 av 10**, 46 bilder |
| 3 kategorier (bulk add-items, uppslag på namn i samma anrop) | **20 av 20 rader success** i nio kategorier, `totalFailures: 0` |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **10 av 10**; variant och produkt synliga före, pris orört |
| 5 separat återläsning | **9 av 10 helt verifierade**; på `988ac121` stämde allt utom kategorin, se nedan |
| stämpel (`stampla`, körningarna 3941–3950) | **10 av 10** gröna |
| stämpeln verifierad med en EGEN `las` per produkt (3951–3960) | **10 av 10** `needsAiPolish: false`, `published`, rätt SKU, pris orört |

⚠️ **Brasskärmen `988ac121` läste tillbaka med bara Wix egen `All
Products`.** Steg 3 hade svarat `success` för dess rad i `Hem & Inredning`,
och kategori-API:t självt (`list-categories-for-item`) visade kopplingen. Det
tolkades som husets dokumenterade släp i läsprojektionen. Live-sidan visade
att det inte var det, se nästa avsnitt.

Varje workflow-körning bevisades som min på produktens id i loggen innan
utfallet lästes.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: alla tio `HTTP 200` med `age` 143–148. `livegrind.py`:
**orddiff 0 på alla tio**, **9 av 10 REN**. Ur samma sidor, kontrollerat med
ett skript mot rundans filer, prövat åt båda hållen med planterade fel:

- JSON-LD `InStock` och priset 499 kr på alla tio.
- Namnet i JSON-LD är lika med `namn.tsv`, och `<title>` och
  metabeskrivningen är exakt lika med `seo.tsv`, på alla tio.
- **46 av 46** alt-texter ur `alt.tsv` står på sidorna.
- Brödsmulan visar en av produktens egna kategorier på nio sidor.

☠️ **Den tionde: brasskärmens kategori når inte produkten.** Kategori-API:t
har kopplingen till `Hem & Inredning`, men produktens egen projektion
(`directCategoriesInfo`, i både GET och sökindexet) visar bara `All
Products`. Det är projektionen butiken läser: produktsidan tar kategorin ur
`collectionIds` från Wix `queryProducts` (butiksgrenens
`app/produkt/[slug]/page.tsx`, läst skrivskyddat). Brödsmulan faller därför
tillbaka på `Butik`, och produkten syns inte på kategorisidan. Den är
publicerad och köpbar och syns i `/butik` och i sökningen.

Det är inte ISR-fällan från runda K3: sidan renderades åtta minuter efter
kopplingen, och Wix egen GET saknar kategorin fortfarande. Tre försök, inget
med verkan:

1. Ta bort och lägga tillbaka i samma anrop — båda `success`.
2. En produktskrivning som inte ändrar något (`visible: true`, fältmask bara
   `visible`) — revision 6 → 7, variant, SKU och pris orörda.
3. Ta bort, vänta cirka två minuter, lägga tillbaka — båda `success`.

Den enda skillnad mot de nio andra som går att se: brasskärmen är den enda
med en enda kategori. De andra fick en andra koppling direkt efter `Hem &
Inredning`.

Ett fjärde försök gjordes med flit INTE: Products V3:s
`bulk/products/add-to-categories-by-filter` väljer produkter med ett filter i
ett asynkront jobb. Ett filter som inte respekteras hade lagt hela katalogen i
kategorin, och `CLAUDE.md` har redan mätt ett filter som tyst ignoreras.

Punkten är öppen och läses om vid nästa kontroll. Hela förloppet står i
`framsteg.md`.

**Den andra korrekturläsningen** gjordes på den PUBLICERADE texten, plockad
mekaniskt ur sidorna. **Den gav inga fynd.** Fem ställen prövades mot källan
och bilderna och står sig:

- Julgranen levereras utan ljusslinga — källans leveranslista har ingen.
- Korgarnas grepp på kortsidorna — bild 1 visar dem.
- Brasskärmen håller barn och husdjur på avstånd och tål värme — källan
  säger båda.
- Konstväxten är 95 cm med krukan — källan säger `Gesamthöhe: 95 cm`.
- Brödrosten är av plast — källan säger `Material: Kunststoff`.

## `FLAGGADE.md` — nya rader

Inga befintliga rader rörda, bara tillägg (25 rader; prefixet
byte-identiskt med kopian före ändringen):

- `d9276e3d` barnbil — AIYAPLAY tryckt på ryggstödet och en front som en MINI
  Cooper S.
- `88a0ab0b` vattenkokare, beige — färgsyskon till publicerade `d8c2dec6`.
- `f981fbc0` miniugn, gräddvit — färgsyskon till publicerade `691ffc27`, och
  ett billigare utkast bakom en publicerad sida.
- `e0cead19` lekmatta — hopvikt samma mått som publicerade `7ca63a31`.
- `a087ae3b` vit skobänk — färgsyskon till `3e2c7389`, som publicerades i den
  här rundan.
- En rad om utfallet för N41:s reserver: fyra publicerade här, `520cc521`
  hålls, och `cf92c3bd` är en annan växt.

## Frågor till Leonard

1. **Fyra färgsyskon** väntar på beslut enligt `FARGSYSKONEN.md`: den gröna
   granen `520cc521`, den beige vattenkokaren `88a0ab0b`, den gräddvita
   miniugnen `f981fbc0` (billigare än den publicerade silverfärgade) och den
   vita skobänken `a087ae3b`.
2. **Lekmattan `e0cead19`** (499 kr): samma hopvikta mått som den publicerade
   `7ca63a31` (599 kr) men andra mått utfälld. Är det en annan storlek av
   samma matta, eller en annan matta?
3. **Barnbilen `d9276e3d`**: husmärket är tryckt på produkten och fronten är
   formad som en MINI. Samma fråga som `b2175a65` i N37.
4. **Brasskärmen `988ac121`**: kategorikopplingen når inte produkten. Den
   ligger kvar publicerad och köpbar, men utan kategori i brödsmulan och på
   kategorisidan. Inget av de sju löven under `Hem & Inredning` passar en
   brasskärm. Om projektionen inte har läkt vid nästa kontroll är nästa steg
   därför ett ärende till Wix support, om du inte hellre vill något annat.

## Faktakort

Faktakorten är medvetet uppskjutna, som i N15–N41. Rundan räknas som klar
utom dem och brasskärmens kategori.

## Filer i katalogen

Skrivna för rundan: `bygg-kallor.py` (som bygger `kallor.json`), de tio
`<id>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `alt.tsv`,
`bilder.tsv`, `bilder-bort.tsv`, `kategori.tsv`, `lager.tsv`, `variant.tsv`,
`ids.tsv` och `framsteg.md`.

Genererade av `polish-gates` ur dem: `axelfacit.json`, `raa-hash.tsv`,
`vantat-hash.tsv`, `nyttolast-media.json`, `medieskrivning.json`,
`media-hash.tsv`, `steg1-bas.js` och `steg2.js`.

Genererade av rundans `bygg-steg.py` (kopierad från N41 med rundnamnet
ändrat): `steg1.js` (gitignorerad), `steg3.js`, `steg4.js` och `steg5.js`.

De hämtade live-sidorna (`live/`) är gitignorerade. Kontaktarken och
originalbilderna ligger utanför repot, som i tidigare rundor.
