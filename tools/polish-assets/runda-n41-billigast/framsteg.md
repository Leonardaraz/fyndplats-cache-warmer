# Runda N41 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Andra rundan utan agenter, i huvudsessionen, tio produkter per vända
  (Leonards besked 2026-09-23). Urvalsregeln är densamma som i N40: de
  billigaste opolerade utkasten i hela katalogen, billigast först, **utan
  prisjämförelse**. Kontrollerna som skyddar kunden gäller fortfarande.
- Grenen `claude/seo-polering-runbook-review-uq6fwl` på `87e0f61` (N40 klar och
  live-verifierad).
- `origin/main` hämtad: senaste "Runda …"-commit är fortfarande Runda 147, och
  senaste commit på main är `3516f83` (2026-09-19). Mängden id som serien rör
  (1 661 id) är alltså oförändrad sedan N40.

## Urval — billigast först, utan prisjämförelse

Katalogen svepades ofiltrerat (61 sidor, 6 025 rader; 3 129 publicerade,
2 896 utkast). Varje utkast upp till 549 kr prövades mot tre mängder: alla
rundors `ids.tsv` (317 id), `FLAGGADE.md` i dess nuvarande form (229 id) och
main-serien (1 661 id). Ingen kandidat fanns i main-serien.

Fyra av träffarna i `FLAGGADE.md` är INTE bortval: N40 skrev där att
`0b34e594` och `e3256412` inte prövades och står först i kön, och att
`3d3f90d3` och `6baeb38b` var reserver. De prövades därför först.

| id | pris | öde |
|---|---:|---|
| `85a18e86`, `1103d67e`, `26d6b2ea`, `0bc12c7d`, `40d0af10`, `5d9e6795`, `fd3d0d6d` | 399–479 | i `FLAGGADE.md` (N36/N40), orörda |
| `0b34e594` julgirlang 1,8 m | 469 | **bortvald** — saldo **2**, alltså på eller under `LAGER_BUFFERT` (3); butiken visar den som slutsåld |
| `e3256412` regnskydd för cykelvagn | 469 | **vald** — Aosoms namn säger "Faltgarage", men källtexten och bilderna visar ett genomskinligt regnskydd |
| `3d3f90d3` LED-björk 120 cm | 479 | **vald** — namntvillingarna `2cb5b77e` (559 kr) och `0f627521` (639 kr) har andra mått: ingen trippelträff |
| `6baeb38b` vinställ i bambu | 479 | **vald** |
| `8fc578fc` babygunga 3-i-1 | 479 | **vald** — trippelträffarna (två publicerade husdjurstrappor) är en annan vara med samma tal |
| `acc9ab97` vattenkokare 1,7 l | 479 | **vald** — trippelträffarna är frukostset med kokare och brödrost; ingen publicerad sida säljer en ensam kokare med samma mått |
| `7febe06d` skobänk i bambu med sittyta | 499 | **hålls** — trippelträff mot den PUBLICERADE `8f0a4df1` (skobänk i bambu med sittdyna, 629 kr) och mot utkastet `a7186f2b` (529 kr, samma namn) |
| `42949f67` tre lysande spöken | 499 | **vald** — halloween, i säsong |
| `5e126c2f` krypande zombie | 499 | **vald** — halloween, i säsong; trippelträffarna är andra varor med samma tal |
| `050db4d8` väggdekor i metall, två tavlor | 499 | **vald** |
| `1c92e587` balanscykel med tre hjul | 499 | **vald** (saldo 5) |
| `1f887213` vit julgran 180 cm | 499 | **vald** — namntvillingarna `a794b9e7` (snöpudrad) och `4311dbed` (3 026 toppar) är andra granar |
| `2cfd222e`, `3e2c7389`, `520cc521`, `5c5aedca`, `7f21945e` | 499 | **reserver**, dubblettskärmen körd men inte `las`-prövade |

Inom samma pris (499 kr) gick halloween först, eftersom det är den enda
säsongen som tar slut inom sex veckor. Därefter togs produkterna i id-ordning.
`3ec9a0f5` (utomhusmatta, 499 kr) hoppades över för säsongen, trädgård i
slutet av september.

Dubblettskärmen körde i N38–N40:s form (ofiltrerat svep, `fields` på varje
sida, trippelmönstrets självtest 9 av 9, `utanText` 0): publicerade 3 129
(2 507 med trippel), utkast 2 896. Saldot lästes i samma anrop.

## Källorna och bilderna

- `kallor.json` transkriberad ur V3 och **verifierad server-side**: längd,
  h·31 och varje block om 250 tecken — **10 av 10 LIKA**. `bilder.tsv` mot
  `media.itemsInfo.items` i ordning — **10 av 10 LIKA**. Alla tio `visible:
  false`, revision 1 eller 2.
- ☠️ **Tre källtexter bär leverantörens artikelnummer** (`acc9ab97`,
  `42949f67`, `5e126c2f`). De är ersatta med `‹REDIGERAT›` i facit, och
  kontrollen gjorde samma ersättning server-side före summan: **exakt en
  träff** på var och en av de tre, **noll** på de andra sju.
- `las` (polish-mapping.yml, `ref: main`, körningarna 3901–3910, var och en
  bevisad som min på `wixProductId` i loggen): alla `supplier: aosom`,
  `needsAiPolish: true`, `pending_review`, prisgrind `stämmer: true`, inget
  `LÅST PRIS`, ingen `SLUTSALD`, fraktandel 0,458–0,498. Saldo 5–197.
- Kontaktarken granskades före texten. Strukna bilder (`bilder-bort.tsv`):
  - `e3256412` bild 2 (husmärkets logga syns på cykelvagnen i bilden) och
    bild 3 (tysk text inbränd). Tre bilder kvar.
  - `8fc578fc` bild 4, `acc9ab97` bild 4 och 5, `1c92e587` bild 4 (tysk text
    inbränd).
- Rättelser och tillägg mot källan, alla ur bilderna:
  - **`e3256412`** är ett regnskydd, inte en vikgarage. Den strukna bild 3
    säger att skyddet passar kupéer mindre än 76 × 61 × 61 cm och att
    skjuthandtaget ska tas av. Texten säger båda, utan att citera bilden.
  - **`42949f67`** står på spett i marken, vilket syns på alla foton men inte
    nämns i källtexten.
  - **`1c92e587`** har ett hjul fram och två bak. Aosoms namn säger "3 Silence
    Wheels", men källtexten nämner inte antalet.
  - **`050db4d8`**: källans leveransinnehåll säger "1 x Wanddekoration", men
    namnet, beskrivningen och bilderna visar ett set om två. Måttbilden visar
    att 40 × 46 cm gäller per tavla.
  - **`1f887213`** är en VIT gran (källans färg "Weiß"). Pyntet på bilderna
    ingår inte, vilket texten säger.

## Grindar

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter (1 axelkonflikt i källan, ingen i texten) |
| `gate-alt.py` | **REN**, 44 alt-texter |
| `gate-seo.py` | **0 fynd** (efter en rättelse, se nedan) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 5 |
| `gate-sku.py` | **0 fynd** (längsta 36 av 40 tecken) |
| SKU-krock (63 `sku.tsv`, 497 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen + 650 i rundornas `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **0 fynd** |
| Formsvep efter artikelnummer i hela rundkatalogen | **0 träffar** |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`gate-seo.py` fällde "3-i-1" i gungans SEO-titel.** Grinden jämför
SEO-talen mot den SVENSKA brödtexten, inte mot den tyska källan. Brödtexten
sa bara "tre sätt att gunga". Inledningen säger nu "En babygunga 3-i-1", vilket
också står i källan ("3-in-1-Design"). Grinden är inte ändrad.

## Korrektur och skeptisk granskning

**Korrekturläsningen** gav elva ändringar i sex filer, alla språkliga:
blandat "ni" och "du" i regnskyddets text, blandat "hon" och "den" om zombien,
upprepningar ("temperaturen … temperaturen", "automatiskt … automatiskt",
"passar … passar", "varandra … varandra", "djup … djup", "Hjulen … Hjulen"),
"för cykelvagn för barn", och en skötselrad för väggtavlorna som både sa "med
de medföljande krokarna" och "välj fästen som passar din vägg".

**Den skeptiska granskningen** ställde varje påstående mot källan och
bilderna. Den gav två ändringar, båda om regnskyddet:

- Skötseltexten sa att skjuthandtaget ska tas av, men inte att det sätts
  tillbaka. Den strukna bildens "und dann eingestellt" och bild 4, där
  handtaget sitter på plats utanpå skyddet, visar att det gör det. Texten säger
  nu båda.
- Alt-texten till bild 4 kallade handtaget "ramen" och "röret". Den säger nu
  vad bilden visar: skjuthandtaget på plats utanpå skyddet, med ett svart band
  runt fästet.
