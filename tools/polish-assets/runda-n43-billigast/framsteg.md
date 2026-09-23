# Runda N43 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Fjärde rundan utan agenter, i huvudsessionen, tio produkter per vända
  (Leonards besked 2026-09-23). Urvalsregeln är densamma som i N40–N42: de
  billigaste opolerade utkasten i hela katalogen, billigast först, **utan
  prisjämförelse**. Kontrollerna som skyddar kunden gäller fortfarande.
- Grenen `claude/seo-polering-runbook-review-uq6fwl` på `530d953` (N42
  live-verifierad; brasskärmens kategori `988ac121` är fortfarande öppen).
- `origin/main` hämtad: senaste "Runda …"-commit är fortfarande Runda 147, och
  senaste commit på main är `3516f83`. Mängden id som serien rör är alltså
  oförändrad sedan N40.

## Urval — billigast först, utan prisjämförelse

Urvalet fortsätter där N42 slutade, i ett nytt svep (61 sidor, 6 025 rader).
499-kronorsnivån är tömd: allt där är publicerat eller står i `FLAGGADE.md`,
utom utomhusmattan `3ec9a0f5`, som hoppas över för säsongen. Nästa nivå var
519–539 kr, i id-ordning. Varje kandidat prövades mot alla rundors `ids.tsv`
(583 id, varav 337 i N1–N42), `FLAGGADE.md` (250 id) och main-serien. Ingen
fanns i main-serien.

| id | öde |
|---|---|
| `5a825b3f` medicinskåp i rostfritt stål, 20 × 12 × 58 cm | **vald** (saldo 38) — de publicerade medicinskåpen är andra skåp, se nedan |
| `87a6c654` kupoltält för två | hoppad över för säsongen |
| `923236e5` väggdekor i metall, monsterablad | **vald** (saldo 32) |
| `9696bb71` överdrag för utemöbler | **hålls** — saldo 3, alltså inte över `LAGER_BUFFERT` |
| `b0766f63` julgran 92 cm med 50 LED | **vald** (saldo 88) |
| `c61ced0e` hylla i bambu med tre plan | **vald** (saldo 28) |
| `e01513c6` sidobord i C-form på hjul | **vald** |
| `4a96df14` konstgjord häck som insynsskydd | hoppad över för säsongen |
| `5bd95c2c` väggspegel 50 × 70 cm | **vald** |
| `60f84a27` balansstenar, sex stycken | **vald** |
| `a794b9e7` smal julgran 180 cm med snö | **vald** |
| `b3e5b7d1` pall i teddytyg | **hålls** — en HOMCOM-etikett är fastsydd vid dynkanten, se nedan |
| `b7465ef9` yoghurtmaskin | **hålls** — tvilling till den PUBLICERADE `af7bf20d`, se nedan |
| `c4af8541` julgirlang 1,8 m | **vald** |
| `e891b752` växthus i folie med tre rullfönster | hoppad över — växthus är main-seriens familj just nu (Runda 147 polerade tolv), och trädgård är fel säsong |
| `5be87e2b` LED-björk 150 cm, vit | **hålls** — färgsyskon till den PUBLICERADE `68911c57`, se nedan |
| `75a38b7b` fiberoptisk julgran 120 cm | **vald** — reserven, tog pallens plats |
| `a7e88a1b` sittdyna, `b5b3b852` darttavla, `e90dcc5a` balansstenar | **reserver** — dubblettskärmade, men inte `las`-prövade |

**Dubblettskärmen** kördes i N42:s form över hela katalogen (61 sidor, 6 025
rader, `fields` på varje sida, självtest 9 av 9, `utanText` 0): 3 149
publicerade (2 527 med trippel), 2 876 utkast. Saldot lästes i samma anrop.

**Och egna listor för det trippelskärmen inte kan läsa**, en per produkttyp:
julgranar (med diameter, vit och smal markerade), väggdekor, balansstenar,
medicinskåp, speglar, LED-björkar, yoghurtmaskiner, girlanger, darttavlor och
teddytyg. En jämförelse hämtade sedan specifikationerna för alla 16 kandidater
och deras 21 närmaste motsvarigheter server-side (37 av 37 hittade), med
artikelnummer redigerade innan något lämnade anropet. Svaret kapades vid
6 000 tokens, så de sju som fattades hämtades i ett andra, kompakt anrop.

- **Medicinskåpen:** femton publicerade. Närmast ligger `6d653305` (rostfritt,
  30 × 60 cm, fyra fack, trycköppning) och `c72c97c3` (46 × 48 cm,
  glasdörrar, sex fack). `5a825b3f` är 20 × 12 × 58 cm med en dörr och tre
  fack. **Andra skåp.** Namntvillingen `0dfaa38b` är ett utkast.
- **Julgranarna:** `b0766f63` (Ø47 × 92 cm, 133 grenspetsar, 50 LED) mot den
  publicerade `28aa840d` (90 cm i vit kruka, 296 spetsar, ingen belysning):
  en annan gran. `a794b9e7` (Ø60 × 180 cm, 492 spetsar) mot de publicerade
  smala 180-centimetersgranarna: `eb5af7a1` är 46 cm bred, `309ef675` Ø80 cm,
  `4e713ee7` Ø74 cm och `1f887213` Ø55 cm med 390 toppar. **Ingen är samma
  gran.** Namntvillingen `4311dbed` (3 026 spetsar) är ett utkast.
  `75a38b7b` (fiberoptik, 120 cm) har ingen publicerad motsvarighet.
  ⚠️ Utkastet `1204b022` (599 kr, "1,2m, LEDs, inkl. Stern") är INTE prövat
  mot `75a38b7b`. Den runda som når 599 kr måste göra det, för då är
  `75a38b7b` publicerad.
- **Spegeln:** `5bd95c2c` (MDF, 2 mm glas, 5 kg) mot `2ad2fafd` (bågformad
  överkant, aluminium, 4 mm glas, 6 kg) och de spröjsade `f23252d9`/`c438d4ba`.
  **Andra speglar.**
  ⚠️ Specialsvepet letade bara efter 50 och 70 cm, så det såg inte N40:s
  publicerade `c2c6a332` (väggspegel 40 × 60 cm med svart ram). Den hittades
  av en slump: när stämplingens indataform hämtades ur en tidigare runda var
  exemplet just den spegelns stämpel. Samma ram och samma upphängning
  i en annan storlek är ett **storlekssyskon**, inte en dubblett. Precedens:
  N42:s skobänk `3e2c7389` (70 cm) bredvid N40:s `9c456097` (50 cm).
- **Balansstenarna:** de publicerade `3783b551` (sex sköldpaddor i PP, med
  spelkort) och `1668a747` (fem grodor) är andra set. Trippelträffarna
  `3e450479`, `43c151c1` och `7c3d438a` (nio och elva stenar) är utkast.
- **Väggdekoren:** den enda publicerade, `050db4d8`, är två tavlor med blad i
  svart och natur, 40 × 46 cm. En annan dekor.
- **Girlangen:** trippelträffen `0b34e594` är N41:s bortvalda girlang (saldo
  2), ett utkast. Den enda publicerade julgirlangen, `9663b8ce`, är 2 m lång
  mot `c4af8541`:s 1,8 m, alltså en annan.

**De tre som hålls, avgjorda:**

- `b7465ef9` (529 kr) mot den publicerade `af7bf20d` (799 kr): samma mått
  36 × 18,8 × 14 cm, samma åtta burkar à 180 ml (1,44 l), samma 25 W och
  0,8 m sladd, båda silver. Enda skillnaden i texten är temperaturområdet
  (20–50 °C mot 20–55 °C). **Samma maskin**, och utkastet är billigare än den
  publicerade sidan — vilken av dem som ska stå kvar är Leonards fråga.
- `5be87e2b` mot den publicerade `68911c57`: båda 150 cm med 96 LED och 5 m
  kabel. `5be87e2b` är en VIT björk, `68911c57` har brun stam. **Färgsyskon.**
- `b3e5b7d1`: etiketten vid dynkanten bär HOMCOM-loggan (utsnittet i
  kontaktarket). Samma skäl som N37:s och N39:s husmärken på produkten.

## Källorna och bilderna

- ☠️ **`kallor.json` är inte transkriberad för hand.** Källtexterna hämtades
  server-side med artikelnumren redigerade, och filen skrevs mekaniskt ur
  verktygssvaren i sessionsloggen. Kontrollen server-side räknade längd, h·31
  och varje block om 250 tecken — **10 av 10 LIKA** — och `bilder.tsv` mot
  `media.itemsInfo.items` i ordning — **10 av 10 LIKA**. **Noll redigeringar**
  behövdes: ingen av de tio källtexterna bär ett artikelnummer. Alla tio
  `visible: false`, revision 1–3.
- `las` (polish-mapping.yml, `ref: main`, utan kostnadsvisning): körningarna
  3961–3970 för de tio första (pallen inräknad) och 3971 för reserven, var och
  en bevisad som min på `PRODUCT_ID` i loggen. Alla `supplier: aosom`,
  `needsAiPolish: true`, `pending_review`, prisgrind `stämmer: true`, inget
  `LÅST PRIS`, ingen `SLUTSALD`, fraktandel 0,421–0,487. Saldo 28–197.
- Kontaktarken granskades före texten. Strukna bilder (`bilder-bort.tsv`):
  - `b0766f63` bild 5 — husmärkets logga och tysk text inbrända (en
    julhälsning).
  - `75a38b7b` bild 4 — tysk text inbränd (rubriker om grenspetsar, fiberoptik
    och fot).
  - `c4af8541` bild 4 — tysk text inbränd (en anvisning om att forma
    grenarna).
- Iakttagelser ur bilderna som styr texten:
  - **`b0766f63`**: måttbilden anger **90 cm**, källan och rubriken **92 cm**.
    Alt-texten nämner därför bara bredden (47 cm) och inte höjden, och texten
    följer källan. Foten är klädd i säckväv på bilderna, och texten säger just
    "på bilderna".
  - **`c61ced0e`**: bild 4 visar TVÅ hyllor bredvid varandra. En hylla ingår,
    och både alt-texten och en fråga i texten säger det. Ribborna i planen syns
    på bild 1 och 5.
  - **`60f84a27`**: märket på stenarna är präglade fotavtryck med noppor, inte
    ett husmärke (utsnitt av bild 5). Skylten "bee HAPPY" på byrån i bild 2
    (utsnitt) är rekvisita i rummet, inte text inbränd i bilden, så bilden
    står kvar.
  - **`a794b9e7`**: pyntet på närbilden (bild 5) ingår inte, och alt-texten
    säger det.
  - **`75a38b7b`**: "mit Weihnachtsschmuck" i källan är bara stjärnan i
    toppen. Texten nämner inget annat pynt.
  - **`e01513c6`**: källans 60 × 40 cm är bordets totalmått, inte uttryckligen
    skivans. Texten skriver "Bordet mäter 60 × 40 cm".

## Grindar

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter (1 axelkonflikt i källan, ingen i texten; raderna om saknade egna mått är upplysningar) |
| `gate-alt.py` | **REN**, 47 alt-texter |
| `gate-seo.py` | **0 fynd** |
| `gate-lager.py` | **0 fynd**, lägsta saldo 28 |
| `gate-sku.py` | **0 fynd** (längsta 33 av 40 tecken) |
| SKU-krock (65 `sku.tsv`, 517 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen + 671 i rundornas `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **0 fynd** |
| Formsvep efter artikelnummer i hela rundkatalogen | **0 träffar** (bara spänningen `220-240V` i källan) |
| `npx vitest run lib/polish` | **99 av 99** |
| `bygg-media.py` | **OK**, 47 bilder, måttbilden (källposition 3) sist |

## Korrektur och skeptisk granskning

**Redan under skrivningen** fångade den skeptiska läsningen två påståenden
som källan inte bär:

- **Väggdekoren:** "ger väggen värme och lite djungelkänsla" var påhittat.
  Nu: "ger väggen ett elegant och konstnärligt intryck".
- **Sidobordet:** 60 × 40 cm är bordets mått, inte skivans (se ovan).

**Korrekturläsningen** av alla tio texter som helhet gav nio ändringar:

- **Medicinskåpet:** "mediciner och receptbelagda läkemedel" → "recept och
  mediciner", och "rostfritt stål som står emot rost" (en tautologi, två
  gånger) → "rostfritt stål".
- **Hyllan:** "där du behöver mer förvaring" → "där du behöver förvaring".
- **Sidobordet:** "hamnar skivan nära den som sitter där" → "kommer skivan
  nära till hands"; "bär 20 kg – till exempel …" → "bär 20 kg, så det rymmer
  till exempel …"; "Skivan är av spånskiva" → "Bordsskivan är av spånskiva";
  och listraden "Skiva i lönnlook och mått 60 × 40 cm" delad i två rader.
- **Fiberoptikgranen:** "tar liten plats" stod två gånger. Nu "passar i ett
  hörn eller vid fönstret".
- **Girlangen:** inledningen räknade upp samma platser två gånger. Nu "Den ger
  hemmet en mysig vinterkänsla".
- **Alt-texter:** `b0766f63` 4 "framför en öppen spis" → "bredvid" (granen
  står bredvid spisen), och `60f84a27` 1 "bredvid stenar som staplats" →
  "utspridda och staplade" (det är samma sex stenar).

**Och när den här filen skrevs:** hyllans alt-text 4 beskrev två hyllor utan
att säga att bara en ingår. Nu: "Två bambuhyllor bredvid varandra med
krukväxter, varav en ingår".

Grindarna kördes om efter ändringarna: alla rena.

## Stegfilerna

`bygg-steg.py` är N42:s med bara rundnamnet ändrat (kontrollerat med `diff`).
Byggt från rundans katalog: `raahash.py`, `hasha.py`, `bygg-media.py`,
`bygg-medieskrivning.py` (skriver `steg2.js`), `bygg-skrivning.py >
steg1-bas.js` och `bygg-steg.py steg1-bas.js > steg1.js` (skriver även
`steg3.js`–`steg5.js`). Alla fem stegfiler parsar i Node. `media-hash.tsv` har
tio rader, och `bygg-steg.py --stampla` ger en variant-SKU per produkt ur
`variant.tsv` och `sku.tsv`. Grindarna, läck-, tecken- och formsvepet och
`vitest` (99 av 99) kördes en sista gång efter bygget: alla rena.

## Wix-skrivningen

Rundans filer pushades före Wix (`49a4313`). Samma kommando kontrollerade
main: fortfarande `3516f83`, och senaste "Runda …"-commit var fortfarande
Runda 147.

| steg | vad | resultat |
|---|---|---|
| 1 | namn/slug/plainDescription/visible/seoData, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10 skrivna**, ingen spärr utlöst. Revision 1→2 på sju; 2→3 på `923236e5` och `c4af8541`, 3→4 på `5bd95c2c` |
| 2 | media + alt-texter (måttbilden sist, tre bilder strukna), spärr över id + alt i samma anrop | **10 av 10**, 47 bilder |
| 3 | kategorier, uppslag på namn i en färsk fråga i samma anrop | **19 av 19** rader `success` i sex kategorier, `totalFailures: 0` överallt |
| 4 | variant-SKU sist och ensam, round-trip ur färsk GET med options och visible | **10 av 10**; variant och produkt synliga före, variant-id = `variant.tsv`, priset orört (519–539 kr) |
| 5 | separat återläsning (`steg5.js`) mot facit ur filerna | **9 av 10 helt verifierade** vid första läsningen. På `e01513c6` stämde allt utom kategorin, se nedan. Alla tio `IN_STOCK` |

⚠️ **`e01513c6` läste tillbaka med EN kategori i stället för två**, precis som
brasskärmen `988ac121` i N42. Båda är de enda i sin runda med en ensam
toppkategori (`Hem & Inredning` utan löv). Bulk-svaret gav `success` för raden
(`totalSuccesses: 9, totalFailures: 0`), och kategori-API:t
(`list-categories-for-item`) visar `Hem & Inredning` och `All Products` som
direkta kategorier. Produktens projektion visar bara `All Products`.

✅ **Och brasskärmen från N42 har läkt av sig själv.** Samma läsning, gjord
direkt efter N43:s steg 5, visar `988ac121` med `Hem & Inredning` i
projektionen: `entityEventSequence` 10 → 11 och `updatedDate` 14:30:58, utan
ny revision (7). Projektionen räknades alltså om ungefär en halvtimme efter
N42:s sista kategoriförsök, av Wix självt. Släpet är långt, men inte
permanent. Tolv tidigare produkter med bara `Hem & Inredning` (N33–N39) har
kategorin i projektionen, så den ensamma toppkategorin fungerar — den tar bara
längre tid att nå projektionen än en koppling som följs av ett löv.

**Därför skrivs `e01513c6` inte om.** Den läses om en stund senare, som husets
regel om efterläsningar säger: facit är bulk-svarets per-rad `success`, och en
snabb återläsning kan underrapportera.

✅ **Omläst en stund senare: `e01513c6` har läkt.** Projektionen visar
`All Products` och `Hem & Inredning`, `entityEventSequence` 7 → 8 och
`updatedDate` 15:04:40, med revisionen oförändrad (4). Släpet var ungefär sex
minuter, mot brasskärmens ungefär en halvtimme. Ingen omskrivning gjordes.

Stämpeln (`polish-mapping.yml` `stampla`, `ref: main`, körningarna 3972–3981,
`variant_skus` byggda med `bygg-steg.py --stampla`) — **10 av 10** `OK …
uppdaterad — needsAiPolish, draftStatus, variantSkus`, var och en bevisad som
min på `PRODUCT_ID` i loggen, med `VISA_KOSTNAD: false`. Varje stämpel
verifierad med en EGEN `las` efteråt (körningarna 3982–3991): `needsAiPolish:
false`, `draftStatus: published`, den nya SKU:n på mappningsraden och
prisgrinden `stämmer: true` på alla tio (charm99, x1.2).

`FLAGGADE.md`: 34 rader tillagda sist, 0 borttagna (prefixet byte-identiskt
med kopian före ändringen).

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: sidorna var nya (`age` 0 på den varma träffen), så
skriptet väntade ut fönstret, träffade om och hämtade skarpt: alla tio
`HTTP 200` med `age` 143–144. `livegrind.py`: **orddiff 0 på alla tio, 10 av 10
REN**. `livekoll.py` (JSON-LD-namnet mot `namn.tsv`, `InStock`, `<title>` och
metabeskrivningen mot `seo.tsv`, varje alt-text ur `alt.tsv`, och brödsmulan
mot produktens egna kategorier): **10 av 10 OK**, **47 av 47 alt-texter**.
Brödsmulan är `Hem & Inredning` på nio och `Barn & Familj` på balansstenarna,
och priserna är 519 (fem), 529 (fyra) och 539 kr (fiberoptikgranen), exakt
som steg 4 läste dem före SKU-skrivningen. Sidobordet har alltså sin kategori
även på sidan.

**Den andra korrekturläsningen** gjordes på den PUBLICERADE texten, plockad
mekaniskt ur sidorna (627 rader), och varje påstående som inte är ett mått
ställdes mot källan en gång till. Den gav **ett fynd**:

☠️ **Girlangen `c4af8541` påstod batteridrift, och källan säger det inte.**
Texten sa "en timer på sex timmar gör att batterierna räcker längre", "Sätt i
batterierna …", "Ta ur batterierna …" och i en fråga "Med batterier på 1,5 V.
Batterierna finns inte med i leveransen." Källan anger bara `Eingang: 1,5V`,
och bilderna visar varken batterifack eller sladd (utsnitt av båda ändarna i
bild 1 och 2). Det var en slutsats ur spänningen, inte ett påstående ur
källan — och N40:s publicerade gran `27ff1a8e`, med exakt samma `Eingang:
1,5V`, samma 0,3 m kabel och samma timer, skrev därför bara "drivs med 1,5
V". Julgranen `b0766f63` däremot står sig: dess källa säger ordagrant
`batteriebetriebenem und kabellosem Design`.

Rättelsen följer N40: "Belysningen drivs med 1,5 V och har en timer på sex
timmar som sparar energi" (källan: `Energieeffizienz`), skötseln säger
"Koppla in belysningen enligt anvisningen", och frågan om strömmen är
ersatt med "Hur många lampor har girlangen? 50 varmvita LED-lampor." Namnet
och SEO-texterna nämnde aldrig batterier och är orörda.

Grindarna kördes om på den rättade texten (alla rena), facit byggdes om
(`raa-hash.tsv` och `vantat-hash.tsv` ändrades bara på `c4af8541`), och
rättelsen skrevs med `bygg-steg.py --rattelse c4af8541`, med
transkriberingsspärren i samma anrop: **1 av 1 skriven**, revision 5 → 6.

Resten stod sig mot källan, bland annat: spegelns ram och upphängning av MDF
(`Rahmen und Halterung … aus MDF`) och "skruvas fast eller hängas upp"
(`Wandmontage oder Aufhängung`), hyllan som kan målas (`mit Farbe
individuell gestalten`), sidobordets bromsar (`Bremsen`), granens betongfot
(`Betonfuß`), väggdekorens skruvar och pluggar (`Haken, Schrauben und
Dübel`), fiberoptikgranen som tar liten plats i förrådet (`Platzsparende
Aufbewahrung`) och att dess stjärna också lyser (`Ebenso der zugehörige
Weihnachtsstern`).

**Efter rättelsen**, i den ordning som gör talen meningsfulla:

- Separat återläsning (den ombyggda `steg5.js`, med girlangens nya facit):
  **10 av 10 helt verifierade**. Sidobordet har två kategorier (`Hem &
  Inredning` och Wix egen `All Products`), girlangen revision 6. Alla tio
  `IN_STOCK`, priserna orörda.
- Girlangens livesida hämtad igen (`hamta-live.sh 130`: varm träff på en
  inaktuell sida med `age` 467, sedan HTTP 200 med `age` 130):
  `livegrind.py` **REN**, orddiff 0 mot den rättade filen; `livekoll.py`
  med priset kontrollerat (529 kr) **OK**, 4 av 4 alt-texter; ordet
  "batteri" förekommer inte på sidan.

**Rundan är klar.** Faktakorten är medvetet uppskjutna, som i N15–N42.
