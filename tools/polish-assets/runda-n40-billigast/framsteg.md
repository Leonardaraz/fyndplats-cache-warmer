# Runda N40 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Första rundan UTAN agenter: Leonard bad 2026-09-23 att poleringen
  fortsätter i huvudsessionen, tio produkter per vända, enligt runbooken.
  Ingen parallellrunda — hela id-rymden (`0`–`f`).
- Arbetskatalog `/home/user/fyndplats-cache-warmer`, grenen
  `claude/seo-polering-runbook-review-uq6fwl` på `6eba0b3` (N38 och N39 klara
  och oberoende granskade).
- Wix-siten verifierad FÖRST mot N39:s publicerade `a9360e2a` ("Balansbom
  236 cm i blått – hopfällbar, halkfri undersida, från 3 år, bär 80 kg"):
  namnet stämde, `visible: true`, revision 5.
- `origin/main` hämtad: senaste "Runda …"-commit är fortfarande Runda 147
  (tolv växthus). Mängden id som serien rör byggdes ur alla filer under
  `main`:s `tools/polish-assets/runda-<siffror>*` och seriens
  commit-meddelanden (1 661 åttateckens-id, en medveten övermängd).

## Urval — utan prisjämförelse (Leonard 2026-09-23)

Körning `35855989306` (`mode: jamfor`, `fran_pris: 619`) startades 11:41 UTC
och **avbröts** på Leonards besked: *"Sluta göra prisjämförelse, kör bara"*.
Urvalsregeln blev i stället **de billigaste opolerade utkasten i hela
katalogen, billigast först** — med alla kontroller som skyddar kunden kvar:
lagersaldo över `LAGER_BUFFERT`, dubblettskärm, bilderna före texten, säsong,
tryckta husmärken, `FLAGGADE.md` och main:s "Runda …"-serie.

Katalogen svepades ofiltrerat (61 sidor, 6 025 rader). Utkast som redan finns i
en rundas `ids.tsv`, i `FLAGGADE.md` (219 id) eller i main-seriens mängd
(1 661 id) sållades bort; kvar blev en lista billigast först från 399 kr
(`n40-billigast.txt` i sessionens scratchpad, inte i repot).

| id | pris | öde |
|---|---:|---|
| `85a18e86` regnskydd till hundvagn | 399 | **bortvald** — ett tillbehör vars källtext anger passformen genom leverantörens artikelnummer (‹REDIGERAT›); utan dem går det inte att säga vad det passar till |
| `27ff1a8e` julgran 60 cm | 459 | **vald** |
| `c2c6a332` väggspegel 40 × 60 | 459 | **vald** |
| `e2cfbd07` mikrovågsugnshylla | 459 | **vald** |
| `a7d072fc` vinställ 16 flaskor | 459 | **vald** |
| `1103d67e` sockervaddsmaskin | 459 | **hålls** — trippelträff mot publicerade `e4211f71` (sockervaddsmaskin, 529 kr); möjlig dubblett, avgörs av en människa |
| `4a4721fa` lekmatta 160 × 100 | 459 | **vald** (bild 4 struken, tysk text) |
| `8ded5e38` gunghäst, lejon | 459 | **vald** |
| `26d6b2ea` gungdjur, åsna | 459 | **hålls** — designsyskon till lejonet, samma pris och samma mått; publiceras inte parallellt |
| `5cdc868a` klädställning på hjul | 459 | **vald** |
| `40d0af10`, `5d9e6795` pallar | 469 | i `FLAGGADE.md` (N36) |
| `b0627017` nattduksbord på hjul | 469 | **vald** (saldo 7) |
| `0b34e594` julgirlang, `e3256412` vikgarage för cykelvagn | 469 | ⚠️ **inte prövade** — gick inte vidare till dubblettsvepet, och skälet antecknades inte vid urvalet. De är inte bortvalda: de står först i kön för nästa runda |
| `0bc12c7d` yoghurtmaskin | 469 | **bortvald** — husmärket TRYCKT på produkten i bilden |
| `9c456097` skobänk i bambu | 479 | **vald** |
| `0c07eb82` kubhylla, sex kuber | 479 | **vald** — svepets träff `1bcd1cfa` (559 kr) delar bara kubmåttet 35 × 35 × 35 cm: det är ett annat kit med NIO kuber, 105 × 35 × 105 cm, ingen dubblett (kontrollerat i källan efter skrivningen; urvalsanteckningen kallade den felaktigt en dyrare tvilling) |
| `fd3d0d6d` käpphäst | 479 | **hoppad** — designsyskon till publicerade `bff32c89` |
| `3d3f90d3` konstbjörk med LED, `6baeb38b` vinställ i bambu | 479 | **reserver** |

Dubblettskärmen körde två gånger i samma form som N38/N39 (ofiltrerat svep,
`fields` på varje sida, trippelmönstrets självtest 9 av 9, `utanText` 0):
publicerade 3 119 (2 497 med trippel), utkast 2 906. Utöver raderna ovan har
ingen av de tio en träff mot en publicerad sida eller ett billigare utkast;
lekmattans namnträff (`1adef24e`, 200 × 150 cm, 669 kr) är en annan storlek.

## Källorna och bilderna

- `kallor.json` transkriberad ur V3 och **verifierad server-side**: längd,
  h·31 och varje block om 250 tecken — **10 av 10 LIKA**. `bilder.tsv` mot
  `media.itemsInfo.items` i ordning — **10 av 10 LIKA**. Alla tio på
  revision 1, `visible: false`.
- `las` (polish-mapping.yml, `ref: main`, körningarna 3871–3880, var och en
  bevisad som min på `wixProductId` i loggen): alla `supplier: aosom`,
  `needsAiPolish: true`, `pending_review`, prisgrind `stämmer: true`, inget
  `LÅST PRIS`, ingen `SLUTSALD`, fraktandel 0,473–0,497. Saldo 7–197.
- Kontaktarken granskades före texten. Rättelser mot källan: lekmattans
  "graue Stadtbild" är grått OCH grönt på bilderna, och skyltarna på husen är
  på engelska (texten säger det); skobänken säger både 130 och 136 kg och både
  sex och fyra par — texten tar det lägre talet båda gångerna; klädställningen
  säger nettovikt 2,2 kg och vikt 2,8 kg — texten tar nettovikten; spegelns
  "2 cm" i måttbilden är källans 20 mm.

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** (efter en rättelse, se nedan) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter |
| `gate-alt.py` | **REN**, 49 alt-texter |
| `gate-seo.py` | **0 fynd** |
| `gate-lager.py` | **0 fynd**, lägsta saldo 7 |
| `gate-sku.py` | **0 fynd** (längsta 37 av 40 tecken) |
| SKU-krock (62 `sku.tsv`, 487 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen + alla rundors `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **1 fynd, ett falsklarm**: `hojd` i klädställningens slug — se rättelsen sist i filen |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`gate.py` fällde "360" på nattduksbordet**, och det var grinden som hade
rätt av fel skäl: källan skriver `4 360°-Rollen`, och tusentalssammanslagningen
läser `4 360` som 4 360. Talet finns alltså inte som 360 i facit. Texten säger
nu "fyra svängbara hjul", vilket är vad källan betyder. Trappformens 3-2-1 på
kubhyllan är fotoräknad och kvitterad i `foto-tal.txt`.

## Korrekturläsning och skeptisk granskning (egna, inga agenter)

Redan under skrivandet ströks fem formuleringar som gick längre än källan:
mikrovågsugnshyllans kaffehörna "utdragen till full bredd", vinställets
"skafferiet", gunghästens "tar inte mycket plats" (och ett dubbelt 44 cm),
"stärker bål" → tränar bålstyrka, och en utfyllnadsmening om lekmattans färger.

Korrekturläsningen gav sedan **tjugo ändringar i nio filer**, varav de
sakliga: julgranens "tunga" fot (källan säger stabil) → stadig, i text och
SEO; lejonets "man" (tvetydigt) → manen; nattduksbordets bärförmåga ("hyllan
bär 10 kg" — vilken?) → varje hylla bär 10 kg, skivan överst också, i text,
lista, skötsel, frågor och SEO; skobänkens "flyttar ofta" (inte i källan)
struket. Resten är språk: upprepningar ("hängas upp" två gånger, "lika gärna
… lika bra", skorna tre gånger i en mening), "fläckar tas bort med
fläckrengöring", och en alt-text som slutade på "36 cm upp".

Den skeptiska granskningen gav **ett fynd, ett ord med fel betydelse**:
källans *Ofenhandschuhe* är **grytvantar**, inte grytlappar. Rättat på alla
tre ställena; ordet finns inte kvar i någon av rundans filer.

## Wix-skrivningen

Rundans filer pushades först (`3427dbc`). Main kontrollerades en gång till
omedelbart före steg 1: senaste "Runda …"-commit fortfarande Runda 147, inget
av de tio id:na i main:s filer.

| steg | vad | resultat |
|---|---|---|
| 1 | namn/slug/plainDescription/visible/seoData, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10 skrivna**, ingen spärr utlöst, revision 1 → 2 |
| 2 | media + alt-texter (måttbilden sist, lekmattans bild 4 struken), spärr över id + alt i samma anrop | **10 av 10**, revision 2 → 3 |
| 3 | kategorier, uppslag på namn i en färsk fråga i samma anrop | **24 av 24** rader `success` i bulk-svaret |
| 4 | variant-SKU sist och ensam, round-trip ur färsk GET med options och visible | **10 av 10**, revision 3 → 4; variant och produkt synliga före, priset orört (459/469/479 kr), variant-id = `variant.tsv` |
| 5 | separat återläsning (`steg5.js`) mot facit ur filerna | **10 av 10 helt verifierade**: text-hash, namn, slug, `visible`, SEO (två taggar, tomma keywords), bilder + alt, kategorier, SKU, variantens synlighet och id; priset orört, alla `IN_STOCK` |

Stämpeln (`polish-mapping.yml` `stampla`, `ref: main`, körningarna 3881–3890,
`variant_skus` byggda med `bygg-steg.py --stampla`) — **10 av 10 gröna**, och
varje stämpel bevisad med en EGEN `las` efteråt (körningarna 3891–3900, var och
en bevisad som min på `wixProductId`): `needsAiPolish: false`,
`draftStatus: published`, den nya SKU:n på mappningsraden och prisgrinden
`stämmer: true` på alla tio. Stämpeln kördes 28 minuter efter urvalets `las`.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: alla tio `HTTP 200` med `age` 143–144 — den rendering
omträffen utlöste. `livegrind.py`: **10 av 10 REN, orddiff 0**. Ur samma
sidor: JSON-LD `InStock` och oförändrat pris (459/469/479 kr) på alla tio,
kategori i brödsmulan (`Hem & Inredning` resp. `Barn & Familj`), rätt namn i
JSON-LD, `<title>` och metabeskrivning exakt som `seo.tsv`, och alla 49
alt-texter på sidorna.

Den andra korrekturläsningen gjordes på den PUBLICERADE texten, plockad
mekaniskt ur de hämtade sidorna (drygt 330 rader). **Ett fynd, språkligt:**
gunghästens första mening "ett glatt lejon – orange kropp och manen randig i
rött och orange" blandar obestämd och bestämd form i en fragmentsats →
"ett glatt lejon: kroppen är orange och manen randig i rött och orange".
Rättat i filen, alla filgrindar omkörda (gröna), och BARA `plainDescription`
omskriven med `bygg-steg.py --rattelse 8ded5e38`, kontrollsumman i samma
anrop: **1 av 1**, revision 4 → 5.

Efter rättelsen:

- **Separat återläsning** (`steg5.js`, facit omräknat ur den rättade filen):
  **10 av 10 helt verifierade**; gunghästen på revision 5, 2 323 tecken,
  text-hash lika.
- **Nytt live-svep** (`hamta-live.sh 130`, alla tio `HTTP 200`, `age` 142–143):
  `livegrind.py` **10 av 10 REN, orddiff 0** mot den rättade filen. Den nya
  meningen står på sidan, den gamla finns inte kvar. JSON-LD `InStock` och
  oförändrat pris (459/469/479 kr) på alla tio.

Rundan är klar utom faktakorten (medvetet uppskjutna, som i N15–N39).

⚠️ **Rättelse av grindtabellen:** läcksvepet antecknades som "0 fynd", men
utfallet var **1 fynd i 15 filer** både före skrivningen och vid avslutet:
stavningsregelns `hojd` i klädställningens slug. Sluggar är ASCII med flit,
så det är ett falsklarm. Namnet och brödtexten säger "höjd". Fyndet
kvitterades men skrevs aldrig ned. Tabellen ovan är rättad.
