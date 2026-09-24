# Runda N43 — tio produkter för 519–539 kr

Tio Aosom-utkast polerade och publicerade: ett medicinskåp i rostfritt stål,
en väggdekor med monsterablad, tre julgranar (92 cm med LED, smal 180 cm med
snö, fiberoptisk 120 cm), en hylla i bambu, ett sidobord på hjul, en
väggspegel, sex balansstenar för barn och en julgirlang.

**Fjärde rundan utan agenter**, i huvudsessionen, tio produkter per vända
(Leonards besked 2026-09-23). Urvalet är billigast först utan prisjämförelse,
som i N40–N42. Allt är pushat på grenen `claude/seo-polering-runbook-review-uq6fwl`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 5a825b3f | Medicinskåp i rostfritt stål med glasdörr – låsbart, tre fack, 20 × 12 × 58 cm | FP-medicinskap-rostfritt-glasdorr | 519 kr | 38 |
| 923236e5 | Väggdekor i metall med monsterablad – guldfärgad, 83 × 39 cm | FP-vaggdekor-metall-monstera-guld | 519 kr | 32 |
| b0766f63 | Julgran 92 cm med 50 varmvita LED – snöade grenar, kottar och batteridrift | FP-julgran-92-led-batteri | 519 kr | 88 |
| c61ced0e | Hylla i bambu med tre plan – 62 × 33 × 80 cm, för badrum och kök | FP-hylla-bambu-tre-plan-62 | 519 kr | 28 |
| e01513c6 | Sidobord på hjul med C-form – höjd 68–78 cm, lönnlook och vit stomme | FP-sidobord-hjul-c-form-hojdjust | 519 kr | 197 |
| 5bd95c2c | Väggspegel 50 × 70 cm med svart ram – hängs stående eller liggande | FP-vaggspegel-50x70-svart-ram | 529 kr | 197 |
| 60f84a27 | Balansstenar för barn, sex stycken – tre storlekar, halkskydd, stapelbara | FP-balansstenar-sex-tre-storlekar | 529 kr | 197 |
| a794b9e7 | Smal julgran 180 cm med snö – Ø60 cm, 492 grenspetsar och fällbar fot | FP-julgran-smal-180-sno-492 | 529 kr | 197 |
| 75a38b7b | Fiberoptisk julgran 120 cm med stjärna – ljus i flera färger, Ø60 cm | FP-julgran-fiberoptik-120-stjarna | 539 kr | 197 |
| c4af8541 | Julgirlang 1,8 m med 50 varmvita LED – kottar, röda bär och snöade toppar | FP-julgirlang-1-8m-led-bar | 529 kr | 197 |

**Inget pris är rört.** Prisgrinden stämde (`x1,2`, `charm99`) både i
urvalets `las` och i verifieringen efter stämpeln.

## Urvalet — billigast först, utan prisjämförelse

499-kronorsnivån var tömd: allt där var publicerat eller stod i
`FLAGGADE.md`, utom utomhusmattan `3ec9a0f5`, som hoppas över för säsongen.
Urvalet tog därför 519–539 kr i id-ordning. Varje kandidat prövades mot alla
rundors `ids.tsv` (583 id, varav 337 i N1–N42), `FLAGGADE.md` (250 id) och
main:s "Runda …"-serie (oförändrad, senast Runda 147). Ingen fanns i
main-serien.

Dubblettskärmen körde i N38–N42:s form (ofiltrerat svep, `fields` på varje
sida, trippelmönstrets självtest 9 av 9, `utanText` 0) över 61 sidor och
6 025 rader: 3 149 publicerade sidor, varav 2 527 med trippel, och 2 876
utkast. Saldot lästes i samma anrop.

☠️ **Egna listor för det trippelskärmen inte kan läsa**, en per produkttyp:
julgranar (med diameter, vit och smal markerade), väggdekor, balansstenar,
medicinskåp, speglar, LED-björkar, yoghurtmaskiner, girlanger, darttavlor och
teddytyg. Specifikationerna för alla 16 kandidater och deras 21 närmaste
motsvarigheter hämtades sedan server-side, med artikelnumren redigerade innan
något lämnade anropet. Ingen av de valda har en publicerad tvilling:

- **Medicinskåpet** (20 × 12 × 58 cm, en dörr, tre fack) mot femton
  publicerade skåp. Närmast ligger `6d653305` (30 × 60 cm, fyra fack) och
  `c72c97c3` (46 × 48 cm, sex fack).
- **Julgranarna:** `b0766f63` (Ø47 × 92 cm, 133 spetsar, 50 LED) mot den
  publicerade 90-centimetersgranen `28aa840d` (vit kruka, 296 spetsar, ingen
  belysning). `a794b9e7` (Ø60 × 180 cm, 492 spetsar) mot de smala publicerade
  granarna på 46, 55, 74 och 80 cm bredd. `75a38b7b` (fiberoptik) har ingen
  publicerad motsvarighet.
- **Spegeln** (MDF, 2 mm glas) mot `2ad2fafd` (bågformad, aluminium, 4 mm).
  N40:s publicerade `c2c6a332` är samma svarta ram i 40 × 60 cm, alltså ett
  storlekssyskon och ingen dubblett. Specialsvepet letade bara efter 50 och
  70 cm och såg den inte; den hittades av en slump när stämplingens
  indataform hämtades ur en tidigare runda.
- **Balansstenarna** mot de publicerade sköldpaddorna `3783b551` och grodorna
  `1668a747`: andra set.

Sju kandidater hölls eller hoppades över:

| skäl | id |
|---|---|
| samma maskin som en publicerad sida, och billigare | `b7465ef9` yoghurtmaskin (publicerad `af7bf20d`, 799 kr) |
| färgsyskon till en publicerad sida | `5be87e2b` LED-björk, vit (`68911c57`, brun stam) |
| husmärket på produkten: en HOMCOM-etikett vid dynkanten | `b3e5b7d1` pall i teddytyg |
| saldo 3, alltså inte över `LAGER_BUFFERT` | `9696bb71` överdrag för utemöbler |
| säsong: tält och trädgård i slutet av september | `87a6c654` kupoltält · `4a96df14` konstgjord häck |
| växthus är main-seriens familj just nu, och fel säsong | `e891b752` växthus i folie |

Pallens plats gick till reserven `75a38b7b`. Tre reserver står i
`FLAGGADE.md` för nästa runda.

Varje jämförelse står genomläst i `framsteg.md`.

## Källan och bilderna — granskade före texten

☠️ **`kallor.json` är inte avskriven för hand.** Källtexterna hämtades
server-side med artikelnumren redigerade, och filen skrevs mekaniskt ur
verktygssvaren i sessionsloggen. Kontrollen server-side räknade längd, h·31
och varje block om 250 tecken: **10 av 10 LIKA**, med **noll redigeringar**
(ingen av källtexterna bär ett artikelnummer). `bilder.tsv` mot
`media.itemsInfo.items` i ordning gav också **10 av 10 LIKA**.

`las` (körningarna 3961–3971, `ref: main`, utan kostnadsvisning) var grön på
alla: `aosom`, `needsAiPolish: true`, `pending_review`, prisgrind `stämmer:
true`, inget `LÅST PRIS` och ingen `SLUTSALD`. Fraktandelen låg på
0,421–0,487 och saldot på 28–197.

Kontaktarken byggdes innan en rad text skrevs. Tre bilder ströks, alla för
inbränd text: husmärkets logga och en tysk julhälsning (`b0766f63` bild 5),
tyska rubriker (`75a38b7b` bild 4) och en tysk anvisning (`c4af8541` bild 4).

Iakttagelser ur bilderna som styr texten:

- **`b0766f63`**: måttbilden säger 90 cm, källan 92 cm. Alt-texten nämner
  bara bredden, och texten följer källan. Foten är klädd i säckväv på
  bilderna, och texten säger just "på bilderna".
- **`c61ced0e`**: bild 4 visar två hyllor. Både alt-texten och en fråga säger
  att en ingår.
- **`60f84a27`**: märket på stenarna är präglade fotavtryck, inte ett
  husmärke. Skylten "bee HAPPY" i bild 2 är rekvisita i rummet, inte inbränd
  text, så bilden står kvar.
- **`75a38b7b`**: "mit Weihnachtsschmuck" i källan är bara stjärnan, och
  texten nämner inget annat pynt.

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter |
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

## Två granskningar före skrivningen — båda egna

**Den skeptiska läsningen** under skrivningen fångade två påståenden som
källan inte bär: väggdekoren "ger lite djungelkänsla" (nu: "ett elegant och
konstnärligt intryck"), och sidobordets 60 × 40 cm, som är bordets mått och
inte uttryckligen skivans.

**Korrekturläsningen** av alla tio texter som helhet gav nio ändringar,
mest tautologier och upprepningar ("rostfritt stål som står emot rost", "tar
liten plats" två gånger, samma platser uppräknade två gånger), plus två
alt-texter med fel positionsord. En tionde kom när `framsteg.md` skrevs:
hyllans alt-text 4 beskrev två hyllor utan att säga att bara en ingår.
Alla står i `framsteg.md`.

## Skrivningen, stämpeln och verifieringen

Rundans filer pushades före Wix (`49a4313`). Samma kommando kontrollerade
main: oförändrad på `3516f83`, och senaste "Runda …"-commit var fortfarande
Runda 147.

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10**, ingen spärr utlöst |
| 2 media (fil-id + alt, måttbilden sist) | **10 av 10**, 47 bilder |
| 3 kategorier (bulk add-items, uppslag på namn i samma anrop) | **19 av 19 rader success** i sex kategorier, `totalFailures: 0` |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **10 av 10**; variant och produkt synliga före, pris orört |
| 5 separat återläsning | **9 av 10 helt verifierade** vid första läsningen; sidobordets kategori släpade, se nedan |
| stämpel (`stampla`, körningarna 3972–3981) | **10 av 10** gröna |
| stämpeln verifierad med en EGEN `las` per produkt (3982–3991) | **10 av 10** `needsAiPolish: false`, `published`, rätt SKU, pris orört |

⚠️ **Sidobordet `e01513c6` läste först tillbaka utan sin kategori**, precis
som brasskärmen i N42. Båda var de enda i sin runda med en ensam toppkategori
(`Hem & Inredning`, inget löv passar ett sidobord). Bulk-svaret hade gett
`success` och kategori-API:t visade kopplingen. **Den skrevs inte om.** En
omläsning en stund senare visade kategorin i projektionen
(`entityEventSequence` 7 → 8, 15:04:40, samma revision). Släpet var ungefär
sex minuter.

✅ **Och N42:s brasskärm har läkt av sig själv**, ungefär en halvtimme efter
N42:s sista försök (sekvens 10 → 11, 14:30:58, samma revision). Den är nu
live-verifierad: orddiff 0, brödsmulan `Hem & Inredning`, 4 av 4 alt-texter.
N42:s `LÄS-MIG.md` och `framsteg.md` är uppdaterade. Tolv tidigare produkter
med bara `Hem & Inredning` (N33–N39) har kategorin i projektionen, så en
ensam toppkategori fungerar; den tar bara längre tid att nå projektionen än
en koppling som följs av ett löv. **Läs om efter en stund i stället för att
skriva om.**

Varje workflow-körning bevisades som min på produktens id i loggen innan
utfallet lästes.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: alla tio `HTTP 200` med `age` 143–144. `livegrind.py`:
**orddiff 0 på alla tio, 10 av 10 REN**. `livekoll.py` (JSON-LD-namnet mot
`namn.tsv`, `InStock`, `<title>` och metabeskrivningen mot `seo.tsv`, varje
alt-text och brödsmulan mot produktens egna kategorier): **10 av 10 OK** och
**47 av 47 alt-texter**. Priserna på sidorna är exakt de steg 4 läste före
SKU-skrivningen.

**Den andra korrekturläsningen** gjordes på den PUBLICERADE texten, plockad
mekaniskt ur sidorna, och ställde varje påstående som inte är ett mått mot
källan en gång till. **Den gav ett fynd, och det är rättat:**

☠️ **Girlangen `c4af8541` påstod batteridrift.** Källan anger bara `Eingang:
1,5V`, och bilderna visar varken batterifack eller sladd. N40:s publicerade
gran `27ff1a8e` har exakt samma rad och skrev därför bara "drivs med 1,5 V".
Girlangen säger nu detsamma, och frågan om strömmen är ersatt med en om
antalet lampor. Namn och SEO nämnde aldrig batterier. Julgranen `b0766f63`
står sig: dess källa säger `batteriebetriebenem und kabellosem Design`.

Rättelsen gick samma väg som allt annat: grindarna om, facit om (bara
girlangens rader ändrades), `bygg-steg.py --rattelse` med
transkriberingsspärren i samma anrop (revision 5 → 6), en separat
återläsning av alla tio (**10 av 10 helt verifierade**) och en ny
livehämtning av girlangen (**REN**, pris 529 kr, 4 av 4 alt-texter, inget
"batteri" kvar på sidan).

**Lärdomen:** ett tal i källan är inte ett påstående om vad det betyder.
`Eingang: 1,5V` gör batteridrift sannolik, men det är en slutsats, och
siffergrinden kan inte se skillnaden — talet står ju i källan.

## `FLAGGADE.md` — nya rader

Inga befintliga rader rörda, bara tillägg (34 rader; prefixet
byte-identiskt med kopian före ändringen):

- `9696bb71` överdrag för utemöbler — saldo 3.
- `b3e5b7d1` pall i teddytyg — HOMCOM-etikett på produkten.
- `b7465ef9` yoghurtmaskin — samma maskin som publicerade `af7bf20d`, och
  billigare (529 mot 799 kr).
- `5be87e2b` LED-björk, vit — färgsyskon till publicerade `68911c57`.
- Säsongsraden: kupoltältet `87a6c654`, insynsskyddet `4a96df14`,
  utomhusmattan `3ec9a0f5` och växthuset `e891b752`.
- `1204b022` (julgran 1,2 m med LED och stjärna, 599 kr) — **inte prövad**
  mot N43:s `75a38b7b`. Den runda som når 599 kr måste göra det.
- Reserver för nästa runda: `a7e88a1b` sittdyna, `b5b3b852` darttavla och
  `e90dcc5a` balansstenar (ett annat set än `60f84a27`).

## Frågor till Leonard

1. **Yoghurtmaskinen `b7465ef9`** (529 kr) är samma maskin som den
   publicerade `af7bf20d` (799 kr). Ska den billigare publiceras och den
   dyrare pensioneras, eller tvärtom? Samma fråga som miniugnen `ab47e35d`
   (N37) och `f981fbc0` (N42).
2. **Färgsyskonen**, nu även den vita LED-björken `5be87e2b` bredvid den
   publicerade med brun stam (`FARGSYSKONEN.md`).
3. **Husmärken på produkten**: teddypallen `b3e5b7d1` (HOMCOM-etikett) och
   N42:s barnbil `d9276e3d`.

## Faktakort

Faktakorten är medvetet uppskjutna, som i N15–N42. Rundan räknas som klar
utom dem.

## Filer i katalogen

Skrivna för rundan: de tio `<id>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`,
`sku.tsv`, `alt.tsv`, `bilder.tsv`, `bilder-bort.tsv`, `kategori.tsv`,
`lager.tsv`, `variant.tsv`, `ids.tsv` och `framsteg.md`. `kallor.json` är
skriven mekaniskt ur verktygssvaren och verifierad server-side.

Genererade av `polish-gates` ur dem: `axelfacit.json`, `raa-hash.tsv`,
`vantat-hash.tsv`, `nyttolast-media.json`, `medieskrivning.json`,
`media-hash.tsv`, `steg1-bas.js` och `steg2.js`.

Genererade av rundans `bygg-steg.py` (kopierad från N42 med rundnamnet
ändrat): `steg1.js` (gitignorerad), `steg3.js`, `steg4.js` och `steg5.js`.

De hämtade live-sidorna (`live/`) är gitignorerade. Kontaktarken och
originalbilderna ligger utanför repot, som i tidigare rundor.
