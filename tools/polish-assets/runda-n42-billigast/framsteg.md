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
