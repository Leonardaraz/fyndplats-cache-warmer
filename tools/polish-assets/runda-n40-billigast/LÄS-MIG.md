# Runda N40 — tio produkter, 459–479 kr

Tio Aosom-utkast polerade och publicerade: en julgran på 60 cm med 50 LED och
timer, en väggspegel 40 × 60 cm med svart ram, en utdragbar
mikrovågsugnshylla, ett vinställ för 16 flaskor, en lekmatta 160 × 100 cm
med stadsmotiv, en gunghäst formad som ett lejon, en klädställning på hjul,
ett nattduksbord på hjul med tre hyllor, en skobänk i bambu och en kubhylla
i svart metalltråd med sex kuber.

**Första rundan utan agenter.** Leonard bad 2026-09-23 att poleringen
fortsätter i huvudsessionen, tio produkter per vända, enligt runbooken. Ingen
parallellrunda — hela id-rymden (`0`–`f`). Allt pushat på grenen
`claude/seo-polering-runbook-review-uq6fwl`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 27ff1a8e | Julgran 60 cm med 50 LED och timer – kottar, röda bär och snötoppar | FP-julgran-60-led-kottar-bar | 459 kr | 197 |
| c2c6a332 | Väggspegel 40 × 60 cm med svart ram – hängs stående eller liggande | FP-vaggspegel-40x60-svart-ram | 459 kr | 197 |
| e2cfbd07 | Mikrovågsugnshylla i svart metall – utdragbar 39,5–64 cm, tre krokar, bär 15 kg | FP-mikrovagsugnshylla-utdragbar-svart | 459 kr | 119 |
| a7d072fc | Vinställ i svart metall för 16 flaskor – fyra stapelbara plan, bär 32 kg | FP-vinstall-16-flaskor-svart | 459 kr | 197 |
| 4a4721fa | Lekmatta 160 × 100 cm med stadsmotiv – vägar, rondeller och hus, halkskyddad | FP-lekmatta-stadsmotiv-160x100 | 459 kr | 102 |
| 8ded5e38 | Gunghäst med lejondesign i trä – handtag och ryggstöd, 2–5 år, bär 25 kg | FP-gunghast-lejon-tra | 459 kr | 68 |
| 5cdc868a | Klädställning på hjul – justerbar höjd 95–170 cm och bredd 86–160 cm, bär 25 kg | FP-kladstallning-hjul-justerbar | 459 kr | 197 |
| b0627017 | Nattduksbord på hjul, tre hyllor – vitt med grå betonglook, 35 × 29,5 × 65,5 cm | FP-nattduksbord-hjul-tre-hyllor | 469 kr | 7 |
| 9c456097 | Skobänk i bambu med två hyllplan – sittyta som bär 130 kg, 50 × 28 × 45 cm | FP-skobank-bambu-tva-hyllplan | 479 kr | 92 |
| 0c07eb82 | Kubhylla i svart metalltråd med sex kuber – trappform, 109 × 37 × 109 cm | FP-kubhylla-metalltrad-sex-kuber | 479 kr | 65 |

**Inget pris är rört** — prisgrinden stämde (`x1,2`, `charm99`) både i
urvalets `las` och i verifieringen efter stämpeln.

Wix-siten verifierades FÖRST mot N39:s publicerade `a9360e2a` ("Balansbom
236 cm i blått – hopfällbar, halkfri undersida, från 3 år, bär 80 kg") —
namn, `visible: true` och revision 5 stämde.

## Urvalet — utan prisjämförelse, på Leonards besked

Rundan startade en jämförelse mot dealproffsen (körning `35855989306`,
`fran_pris: 619`) som **avbröts** när Leonard skrev *"Sluta göra
prisjämförelse, kör bara"*. Urvalsregeln blev i stället **de billigaste
opolerade utkasten i hela katalogen, billigast först**. Alla kontroller som
skyddar kunden står kvar: lagersaldo över `LAGER_BUFFERT`, dubblettskärm,
bilderna före texten, säsong, tryckta husmärken, `FLAGGADE.md` och main:s
"Runda …"-serie (1 661 id, senast Runda 147 med tolv växthus).

Katalogen svepades ofiltrerat (61 sidor, 6 025 rader). Listan billigast först
började på 399 kr; tio valdes mellan 459 och 479 kr. Hela genomgången av de
tjugo billigaste står i `framsteg.md`. I korthet:

| skäl | id |
|---|---|
| tillbehör vars passform anges med leverantörens artikelnummer | `85a18e86` (399 kr) |
| möjlig dubblett av en publicerad sida (trippelträff) | `1103d67e` sockervaddsmaskin mot `e4211f71` |
| designsyskon till en vald produkt, samma pris och mått | `26d6b2ea` gungåsna (till lejonet `8ded5e38`) |
| designsyskon till en publicerad sida | `fd3d0d6d` käpphäst (till `bff32c89`) |
| husmärket tryckt på produkten | `0bc12c7d` yoghurtmaskin |
| i `FLAGGADE.md` sedan N36 | `40d0af10`, `5d9e6795` (pallar) |
| **inte prövade** — skälet antecknades inte | `0b34e594` julgirlang, `e3256412` vikgarage (469 kr) |
| reserver | `3d3f90d3` konstbjörk med LED, `6baeb38b` vinställ i bambu |

⚠️ **De två oprövade är rundans enda lucka i urvalet.** De är billigare än
skobänken och kubhyllan men gick aldrig vidare till dubblettsvepet, och
anteckningen säger inte varför. De står först i kön för nästa runda, i
`FLAGGADE.md` under "Bortvalda av andra skäl".

⚠️ **Urvalsanteckningen kallade `1bcd1cfa` en dyrare tvilling till kubhyllan.
Det var fel.** Kontrollerat i källan efter skrivningen: `1bcd1cfa` (559 kr)
är ett kit med NIO kuber, 105 × 35 × 105 cm, och svepets träff var bara det
gemensamma kubmåttet 35 × 35 × 35 cm. Ingen dubblett, ingen rad i
`FLAGGADE.md`.

Dubblettskärmen körde i N38/N39:s form (ofiltrerat svep, `fields` på varje
sida, trippelmönstrets självtest 9 av 9, `utanText` 0): publicerade 3 119
(2 497 med trippel), utkast 2 906. Klädställningens mått är intervall som
mönstret inte läser; den jämfördes på paketmåttet 86 × 8,5 × 17,5 cm — noll
träffar.

## Källan och bilderna — granskade före texten

`kallor.json` transkriberades ur V3 och verifierades server-side med längd,
h·31 och varje block om 250 tecken: **10 av 10 LIKA**. `bilder.tsv` mot
`media.itemsInfo.items` i ordning: **10 av 10 LIKA**. `las` (körningarna
3871–3880, `ref: main`) grön på alla tio: `aosom`, `needsAiPolish: true`,
`pending_review`, prisgrind `stämmer: true`, inget `LÅST PRIS`, ingen
`SLUTSALD`.

Kontaktarken byggdes innan en rad text skrevs. Rättelser mot källan:

- **`4a4721fa`**: bild 4 bär tysk text inbränd ("WEICH & LANGANHALTEND") —
  struken, tre bilder plus måttbilden kvar. Källans "graue Stadtbild" är grått
  OCH grönt på bilderna, och skyltarna på husen är på engelska (skola,
  sjukhus, brandstation, bibliotek) — texten säger det rakt ut i stället för
  att låta kunden upptäcka det.
- **`9c456097`**: källan säger både 130 och 136 kg på sittytan och både sex
  och fyra par skor. Texten tar det lägre talet båda gångerna.
- **`5cdc868a`**: källan säger nettovikt 2,2 kg och vikt 2,8 kg. Texten tar
  nettovikten. Kopplingarna är mörkblå på alla fem bilderna.
- **`c2c6a332`**: måttbildens "2 cm" är källans spegeldjup 20 mm.
- **`e2cfbd07`**: måttbilden visar "5 cm" som källan inte nämner, och fyra
  fötter som källan inte räknar. Texten säger "ställbara fötter" utan antal.
- **`27ff1a8e`**: bild 2 och 4 visar en adventskalender i trä bredvid granen.
  Den ingår inte, och ingen alt-text nämner den.

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
| Läck- och teckensvep, 15 kundvända filer | **1 fynd, ett falsklarm**: `hojd` i klädställningens slug (se nedan) |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`gate.py` fällde "360" på nattduksbordet, med rätt utfall av fel skäl.**
Källan skriver `4 360°-Rollen`, och tusentalssammanslagningen i `gatelib.tal`
läser `4 360` som 4 360 — alltså finns 360 inte i facit. Texten säger nu
"fyra svängbara hjul", vilket är vad källan betyder. Grinden är inte ändrad.
Kubhyllans trappform 3-2-1 är fotoräknad och kvitterad i `foto-tal.txt`.

⚠️ **Läcksvepet antecknades först som "0 fynd". Det stämde inte.** Svepet gav
samma utfall båda gångerna det kördes, före skrivningen och vid avslutet:
**1 fynd i 15 filer**. Fyndet är stavningsregelns `hojd` i klädställningens
slug `kladstallning-hjul-justerbar-hojd-bredd`. En slug är ASCII med flit
(ö → o), så det är ett falsklarm på en adress och inget fel i kundtexten.
Namnet och brödtexten säger "höjd". Felet låg i anteckningen, där fyndet
kvitterades i huvudet men aldrig skrevs ned. Tidigare rundors sluggar
träffades inte, eftersom `hojd` där sitter inuti ett längre ord
(`hojdjusterbar`), och regeln kräver ordgräns.

## Två granskningar före skrivningen — båda egna

**Korrekturläsningen:** fem formuleringar som gick längre än källan ströks
redan under skrivandet, och själva korrekturläsningen gav tjugo ändringar i
nio filer. De sakliga: julgranens "tunga" fot (källan säger stabil) →
stadig; lejonets "man" (tvetydigt på svenska) → manen; nattduksbordets "hyllan
bär 10 kg" (vilken?) → varje hylla bär 10 kg, skivan överst också; skobänkens
"flyttar ofta" (inte i källan) struket. Resten var språk. Hela listan står i
`framsteg.md`.

**Den skeptiska granskningen:** ett fynd, ett ord med fel betydelse. Källans
*Ofenhandschuhe* är **grytvantar**, inte grytlappar. Rättat på alla tre
ställena i mikrovågsugnshyllans text; ordet finns inte kvar i någon fil.

## Skrivningen, stämpeln och verifieringen

Rundans filer pushades före Wix (`3427dbc`), och main kontrollerades en gång
till omedelbart före steg 1.

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10**, ingen spärr utlöst, revision 1 → 2 |
| 2 media (fil-id + alt, måttbilden sist) | **10 av 10**, 49 bilder, revision 2 → 3 |
| 3 kategorier (bulk add-items, uppslag på namn i samma anrop) | **24 av 24 rader success**, `totalFailures: 0` |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **10 av 10**, revision 3 → 4; variant och produkt synliga före, pris orört |
| 5 separat återläsning | **10 av 10 helt verifierade** |
| stämpel (`stampla`, körningarna 3881–3890) | **10 av 10** gröna |
| stämpeln verifierad med en EGEN `las` per produkt (3891–3900) | **10 av 10** `needsAiPolish: false`, `published`, rätt SKU, pris orört |

Stämpeln gick 28 minuter efter urvalets `las`. Varje workflow-körning
bevisades som min på produktens id i loggen innan dess utfall lästes.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130`: alla tio `HTTP 200` med `age` 143–144. `livegrind.py`:
**10 av 10 REN, orddiff 0**. Ur samma sidor: JSON-LD `InStock` och
oförändrat pris (459/469/479 kr) på alla tio, kategori i brödsmulan, rätt
namn, `<title>` och metabeskrivning exakt som `seo.tsv`, och alla 49
alt-texter.

**Den andra korrekturläsningen** gjordes på den PUBLICERADE texten, plockad
mekaniskt ur sidorna. Den gav ett språkfynd: gunghästens första mening
"ett glatt lejon – orange kropp och manen randig i rött och orange" blandade
obestämd och bestämd form. Nu lyder den "ett glatt lejon: kroppen är orange
och manen randig i rött och orange". Rättat i filen och alla filgrindar
omkörda. Därefter skrevs BARA `plainDescription` om med
`bygg-steg.py --rattelse 8ded5e38` (`rattelse-8ded5e38.js`), med
kontrollsumman i samma anrop: **1 av 1**, revision 4 → 5.

Efter rättelsen gjordes tre kontroller:

- En separat återläsning (`steg5.js` mot nytt facit) gav **10 av 10 helt
  verifierade**. Gunghästen har revision 5, 2 323 tecken och en text-hash som
  stämmer.
- Ett nytt live-svep (`age` 142–143) gav **10 av 10 REN, orddiff 0** mot den
  rättade filen. Den nya meningen står på sidan och den gamla finns inte kvar.
- Alla tio sidor har fortsatt `InStock` och samma pris.

## `FLAGGADE.md` — nya rader

Inga befintliga rader rörda (32 rader tillagda, 0 borttagna). Alla under
"Bortvalda av andra skäl":

- `26d6b2ea` gungåsnan — designsyskon till den nu publicerade lejongunghästen.
- `1103d67e` sockervaddsmaskinen — trippelträff mot publicerade `e4211f71`.
- `0bc12c7d` yoghurtmaskinen — husmärket tryckt på produkten.
- `85a18e86` regnskyddet till hundvagn — passformen anges med leverantörens
  artikelnummer (‹REDIGERAT›).
- `fd3d0d6d` käpphästen — designsyskon till publicerade `bff32c89`.
- Reserverna `3d3f90d3` och `6baeb38b`, och de två oprövade `0b34e594` och
  `e3256412`.

`FARGSYSKONEN.md`: inga nya rader.

## Frågor till Leonard

1. **Designsyskon med samma pris och mått** — gungåsnan bredvid den nu
   publicerade lejongunghästen, och käpphästen bredvid den publicerade
   enhörningen. Samma fråga som färgsyskonen i `FARGSYSKONEN.md`, fast för
   motivet i stället för kulören.
2. **Sockervaddsmaskinen** — ett billigare utkast (459 kr) som trippelmatchar
   en publicerad sida (529 kr), men med en annan effekt i namnet.
3. **Husmärke tryckt på produkten** — yoghurtmaskinen. Samma fråga som N37
   och N39.

## Faktakort

Faktakorten är medvetet uppskjutna, som i N15–N39. Rundan räknas som klar
utom dem.

## Filer i katalogen

Skrivna för rundan: `bygg-kallor.py` (som bygger `kallor.json`), de tio
`<id>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `alt.tsv`,
`bilder.tsv`, `bilder-bort.tsv`, `kategori.tsv`, `lager.tsv`, `variant.tsv`,
`foto-tal.txt`, `ids.tsv`, `framsteg.md`. Genererade av `polish-gates` ur dem:
`axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`, `nyttolast-media.json`,
`medieskrivning.json`, `media-hash.tsv`, `steg1-bas.js`, `steg2.js`.
Genererade av rundans `bygg-steg.py` (kopierad från N39 med rundnamnet
ändrat): `steg1.js` (gitignorad), `steg3.js`, `steg4.js`, `steg5.js` och
rättelsen `rattelse-8ded5e38.js` (`--rattelse`). De
hämtade live-sidorna (`live/`) är gitignorerade, och kontaktarken och
originalbilderna ligger utanför repot, som i tidigare rundor.
