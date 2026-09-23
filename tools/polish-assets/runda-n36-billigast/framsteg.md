# Runda N36 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Grenen `claude/seo-polering-runbook-review-uq6fwl` på `b84a305` (N35 klar).
- Wix-siten verifierad FÖRST mot N35:s publicerade `8a076c08` ("Barstolar
  2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm"): namnet stämde,
  `visible: true`, revision 5.
- `origin/main` hämtad: senaste "Runda …"-commit är Runda 147 (tolv växthus).
  Mängden id som den serien rör byggdes ur ALLA filer under `main`:s
  `tools/polish-assets/runda-<siffror>*` plus seriens commit-meddelanden
  (1 621 unika åttateckens-id, en medveten övermängd) — varje kandidat
  prövades mot den.
- Förberedelsen hittade ett DELVIS artikelnummer (numrets inledning som
  grep-mönster) i N35:s `framsteg.md`, steg 12. `ARTNR` fäller bara hela
  nummer, så testet kunde inte se det. Struket i en egen commit (`9546cd3`),
  meningen säger nu ‹REDIGERAT›.
- ⚠️ Mitt i urvalet startade Runda N37 parallellt (egen worktree). Uppdelning
  på wix-id: N36 tar BARA id som börjar på `0`–`7`, N37 `8`–`f`. Varje
  workflow-körning räknas som min först när produkt-id:t i loggen är det jag
  startade den för (dealproffsen-körningarna bär i stället min `varv`-markör
  och min `fran_pris` i loggens env-rad).

## Urval — Leonards regel återställd

Workflowen "Pris — jamfor mot dealproffsen" (`dealproffsen.yml`), `mode:
jamfor`, `ref: claude/seo-polering-runbook-review-uq6fwl` (tabellen finns bara
på grenen).

| körning | `fran_pris` | varv | utfall |
|---|---:|---|---|
| run 31 (35804614752) | 0 | 12 (default) | varv 1: 3 246 granskade, 68 prefix kvar · varv 2: 1 704 granskade, **0 prefix kvar**, inga `FEL`-rader |
| run 32 (35805159807) | 619 | **13** (min markör) | varv 1: 3 451 · varv 2: 1 499, **0 prefix kvar**, inga `FEL`-rader |

Mätningen är alltså FULLSTÄNDIG i båda körningarna. Totalt **3 767 produkter
där vi är billigare**, varav **2 121 opolerade utkast** (68 + 155 + 294 + 817
+ 787 i fördelningstabellen). Topp-40-listan från 0 kr spänner 469–619 kr;
15 av raderna ligger i min halva (0–7).

### Förfiltrering av de 15 (FLAGGADE.md, tidigare rundor, main-serien)

| id | pris | utfall |
|---|---:|---|
| `65d3d373` | 579 | **dubblett (tidigare runda)** — N2: samma fotavtryck som publicerade "Upphöjd hundbädd 76 cm"; svepet visar dessutom `7e140b40`/`2ed2f82b` med samma namn och trippel. Skälet gäller. |
| `1a3ac422` | 599 | **dubblett (tidigare runda) + main-serien** — H3: dubblett av publicerade `a78da864`; rörd av Runda 115 på `main`. |
| `6f9fee21` | 599 | **main-serien** — rörd av Runda 63/135 på `main`. |

Ingen av de 15 stod i `FLAGGADE.md`.

### Dubblettskärm (samma metod som `DUBBLETTMATNING.md`)

Svepet: `POST /stores/v3/products/query`, OFILTRERAT, `fields:
["PLAIN_DESCRIPTION"]` omskickat på varje sida, trippelmönstrets självtest på
alla sju former i SAMMA anrop (**7 av 7**), 60 sidor, **5 984 rader,
`utanText` 0**, publicerade 3 087 (2 464 med trippel), utkast 2 897 (alla med
trippel). Trippel ±1/±1/±2, ordnad eller permuterad när största måttet är
≥ 60 cm, paketmått bara mot paketmått. Mot publicerade OCH mot utkast.

| id | träffar | dom |
|---|---|---|
| `5d9e6795` pall 469 | `40d0af10` (469, utkast, samma trippel) | färgsyskon (grå mot mörkgrå, 3,7 mot 4,2 kg) — men föll på saldo, se nedan |
| `46c0fe07` sidobord 499 | två publicerade hundvagnar (permutation) | olika varutyp — ren |
| `3bfee58b` mopphink 549 | `d60bb2f2` röd 559, `9ac669e4` blå 569, `5b4aeb72` gul 559 (alla utkast, samma namn och trippel) | **färgsyskon, ingen kulör publicerad, 3bfee58b billigast** (N28/N33-läget) |
| `7819dd4f` sittdynor 559 | ingen relevant | **fel säsong**: källan säger *Outdoor-Sitzauflage* och *auf der Terrasse* — samma skäl som N2 avvisade utomhussittdynor |
| `265b0f61` matta 569 | tre rumsavdelare (permutation) | olika varutyp — ren |
| `69ba5b8b` staffli 579 | 0 | ren |
| `2b27c2a4` brödrost 599 | `13204f68` svart 619 (utkast, samma mått) + sets med samma brödrost | färgsyskon; publicerade `6f79738d` är ett SET med vattenkokare, `d5d1ff3c` en annan brödrost (26,4 × 15,6 × 18,9) — ren |
| `37804a40` modulgarderob 599 | publicerade `4cd5d6d1` (111 × 145, 8 fack) delar kubmåtten | samma system i ANNAN storlek (183 mot 145 cm) — medvetet storleksval, som N2:s häckrulle |
| `6707c9dd` hurts 599 | `2fb43729` rosa 639, `0d9da8b5` gräddvit 659 (utkast); publicerade `281ed0b1` är 4-lådsvarianten 76 cm | **färgsyskon, ingen kulör publicerad, 6707c9dd billigast** |
| `676e567f` brevlåda 599 | `35360ea0` (619, utkast, 37 × 10,5 × 37) | annan modell: galvaniserat stål med lock och lås, mot rostfria paneler, siktfönster och tidningshållare — ren |
| `7d1fb82b` buxbomsklot 599 | `70c17966` 639: samma Ø40, samma 2,2 kg, samma namn | **identisk tvilling** (N31-läget: lämnas orörd, även den billigaste) |

Namnskärm (pass 3) mot publicerade sidor per varutyp: brödrost (13 sidor),
matta, garderob/modul, brevlåda (0 publicerade), sidobord, mopphink,
staffli/rittavla, lådhurts. Enda sidan utan trippel som krävde handläsning var
publicerade `d5f6bab3` "Rittavla för barn – dubbelsidig staffli…": en annan
vara (magnetisk, 360° vridbar, 68–97 cm, annan modell) — `69ba5b8b` är ren.

### `las` (polish-mapping.yml, `ref: main`) — varje körning bevisad min

| run | id | saldo | frakt | utfall |
|---:|---|---:|---:|---|
| 3766 | 5d9e6795 | **3** | 0,482 | **faller: saldo = LAGER_BUFFERT, visas som slutsåld** |
| 3767 | 46c0fe07 | 26 | 0,456 | OK |
| 3768 | 3bfee58b | 136 | 0,426 | OK |
| 3769 | 7819dd4f | 197 | 0,5 | OK men fel säsong |
| 3770 | 265b0f61 | 33 | 0,494 | OK |
| 3771 | 69ba5b8b | 76 | 0,389 | OK |
| 3772 | 2b27c2a4 | 106 | 0,496 | OK |
| 3773 | 37804a40 | 23 | 0,387 | OK |
| 3774 | 6707c9dd | 171 | 0,39 | OK |
| 3775 | 676e567f | 104 | 0,49 | OK |

Alla: `supplier: aosom`, `needsAiPolish: true`, `draftStatus:
pending_review`, prisgrind `stämmer: true` (charm99), ingen `prisLast`,
ingen `slutsald`. Produkt-id i loggens env-rad OCH i mappningsradens
`wixProductId` stämde i alla tio.

## Slutgiltigt urval (8, 499–599 kr) — låst och pushat i `838b2ef`

| kort | produkt | vårt | deras | saldo |
|---|---|---:|---:|---:|
| 46c0fe07 | Sidobord i C-form på hjul | 499 | 529 | 26 |
| 3bfee58b | Mopphink 20 liter med press, svart | 549 | 559 | 136 |
| 265b0f61 | Matta 170 × 120 cm, mörkgrå | 569 | 699 | 33 |
| 69ba5b8b | Staffli för barn | 579 | 629 | 76 |
| 2b27c2a4 | Brödrost för fyra skivor, grå | 599 | 619 | 106 |
| 37804a40 | Modulgarderob i plast 111 × 183 cm | 599 | 749 | 23 |
| 6707c9dd | Förvaringshurts för barn, tre lådor | 599 | 629 | 171 |
| 676e567f | Brevlåda för vägg med tidningshållare | 599 | 619 | 104 |

`ids.tsv` bär färgsyskonen i beskrivningen så att N37 inte publicerar en
andra kulör parallellt (mopphinkens röda och blå ligger i N37:s halva).

Andra körningen (från 619 kr) gav reserver men ingen behövdes.

## Källor och kontroll mot skarpa V3

`kallor.json` byggd i `bygg-kallor.py` (avskrift) och `bilder.tsv` ur samma
hämtning. Kontrollerade server-side (h·31, samma anrop som ingen skrivning,
ARTNR-redigering speglad i JS): **8 av 8 text LIKA, 8 av 8 bildlista LIKA,
0 artikelnummer** i källtexterna.

## Bilder — kontaktark FÖRE texten

Kontaktark (`bygg-ark.py`, 600 px, i scratchpad) för alla nio kandidater.

- `3bfee58b` bild 4, `265b0f61` bild 4, `69ba5b8b` bild 4 och 5: tysk text
  inbränd — strukna (`bilder-bort.tsv`). `69ba5b8b` blir en trebildsprodukt.
- `69ba5b8b`: måttbilden bär tal som inte står i källan (49, 32, 37,5) och
  visar en annan hyllstorlek än källans `Tablett 38L x 39B` — hyllans mått
  står därför INTE i texten.
- `46c0fe07`: måttbilden säger 8 cm där källan säger `Abstand zwischen
  Ablage und Boden: 6 cm` — frigången står inte i texten.
- `265b0f61`: källans namn slutar på "150", men text och måttbild säger
  170 × 120 — texten följer måttbilden och tekniska data.
- Husmärke på själva varan (runbooken: behålls, flaggas): `2b27c2a4` bär en
  logotypskylt mellan vreden, synlig på alla fem bilder.

## Texter och grindar (före skrivningen)

Korrekturläsning av egen svenska som eget steg: tio rättelser (syftning i
första meningen på mopphinken, dubbelt "ur", genus på *polypropylen*
omskrivet till *mattan … slitstark*, *avbrytning* → *stopp*, *uppvärmning* →
*återuppvärmning*, "hyllfack" om fack med dörrar, m.fl.).

| Gate | Resultat |
|---|---|
| Trippelmönstrets självtest (7 former) | **7 av 7** |
| `kallor.json` + `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA** (text och bildlista) |
| `gate.py` | **0 fynd, 0 varningar** (två ordtal kvitterade i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** (1 axelkonflikt i källan, upplysning) |
| `gate-alt.py` | **REN**, 8 produkter, 36 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` | **0 fynd**, lägsta saldo 23 |
| `gate-sku.py` | **0 fynd** (längsta 32 av 40) |
| SKU-krock mot alla tidigare rundors `sku.tsv` (58 filer på grenen + 24 på `main`, 462 SKU:er) | **0 krockar, 0 prefixöverlapp** |
| Slug-krock mot hela katalogen (5 984 slugs) | **0 krockar**; 1 prefixöverlapp (`sidobord-c-form` på `c788becf`), ingen krock |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd**, inga korslänkar |
| Läcksvep (gatelib.GRINDAR + NORM + 538 tyska källord) | **0 fynd** |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `npx vitest run lib/polish` | **99 av 99 gröna** |

## Läge

Förberedelsen klar, INGENTING skrivet till Wix. Nästa: oberoende granskning
av utkasten, sedan de fyra Wix-stegen.

## Steg 6.1 — Wix-skrivningen, steg 1 (namn/slug/brödtext/visible/SEO)

Omedelbart före: slugs och SKU:er jämförda mot N37:s `slugs.txt`/`sku.tsv`
(åtta rader var) — 0 krockar, 0 prefixöverlapp. `steg1.js` (bygg-skrivning.py
+ bygg-steg.py:s metaspärr `724214466 / 2614`) skickat ordagrant: ingen spärr
utlöst, **8 av 8 skrivna**. Revisionerna före var exakt källkontrollens
(1, 1, 3, 1, 3, 1, 1, 2) — ingen annan hade rört produkterna; efter +1.

## Steg 6.2 — media (fil-id + alt-texter)

`steg2.js` (bygg-medieskrivning.py) ordagrant: spärren över `id|altText` i
samma anrop utlöstes inte, **8 av 8 skrivna**, 36 bilder (5, 4, 4, 3, 5, 5,
5, 5), måttbilden sist, `media.main` inte skickad.

## Steg 6.3 — kategorier

`steg3.js` ordagrant, kategori-id uppslagna på NAMN i en färsk
`categories/query` i samma anrop (54 kategorier, alla nio namnen träffade):
**13 av 13 rader `success: true`**, attribuerade på radens eget
`catalogItemId`, sju bulk-anrop med `totalFailures: 0` och
`undetailedFailures: 0`.

## Steg 6.4 — variant-SKU sist och ensam

Omedelbart före: SKU:erna jämförda mot N37:s `sku.tsv` en gång till (åtta
rader) — 0 krockar. `steg4.js` ordagrant, spärren `285341069 / 607` i samma
anrop: **8 av 8 skrivna**. Färsk GET med `?fields=VARIANT_OPTION_CHOICE_NAMES`,
varianten kopierad med bara `sku` ändrad, `visible` (och `options` om de
finns) i kropp och fältmask. Alla åtta hade EN variant; variant och produkt
var `visible: true` före; `prisFore` 499, 549, 569, 579, 599 × 4 — urvalets
priser; variant-id stämde med `variant.tsv`. De tyska SKU:erna
(`FP-teppich`, `FP-kinder-staffelei-aus`, `FP-briefkasten-wandmontage` …) är
utbytta — skrivningen gjorde verkligt arbete.
