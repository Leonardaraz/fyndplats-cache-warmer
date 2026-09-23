# Runda N38 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Grenen `claude/seo-polering-runbook-review-uq6fwl` på `2da7655` (N36 klar),
  snabbspolad till `a1703ea` när N37:s två sista commits kom upp (ingen egen
  ändring fanns då, alltså ingen konflikt).
- Wix-siten verifierad FÖRST mot N36:s publicerade `46c0fe07` ("Sidobord i
  C-form på hjul – skiva i valnötslook och svart stålram"): namnet stämde,
  `visible: true`, revision 4.
- `origin/main` hämtad: senaste "Runda …"-commit är fortfarande Runda 147
  (växthus, 2026-09-18). Mängden id som serien rör byggdes ur ALLA filer under
  `main`:s `tools/polish-assets/runda-<siffror>*` plus seriens
  commit-meddelanden — 4 720 åttateckens-id, en medveten övermängd (varje
  fristående åttateckens hex-sträng räknas).
- ⚠️ Parallellt: N37 i `/home/user/wt-n37` (id-halvan `8`–`f`), och efter N37
  **Runda N39** i samma worktree och samma halva. N38 tar BARA id som börjar
  på `0`–`7`. Före Wix-steg 1 och 4 jämförs slugs och SKU:er mot både N37:s
  och N39:s `slugs.txt`/`sku.tsv`. En workflow-körning räknas som min först
  när produkt-id:t i loggen är det jag startade den för.

## Urval — Leonards regel

**Bara opolerade utkast där vi är billigare än dealproffsen, sorterade på vårt
pris stigande, golv 599 kr.** N36 tömde id-halvan `0`–`7` upp till 599 kr, och
N36:s topp-40 från 0 kr slutade på 619 kr — allt under 619 kr i min halva var
alltså redan prövat.

Enligt steg 0 återanvändes en färsk körning i stället för att starta en ny:
run 32 (35805159807) av "Pris — jamfor mot dealproffsen", `fran_pris: 619`,
`ref: claude/seo-polering-runbook-review-uq6fwl`, startad 01:09 (knappt en
timme före urvalet). Den är FULLSTÄNDIG: `varv 1: 3451 granskade … 59 prefix
kvar` · `varv 2: 1499 granskade … 0 prefix kvar`, inga `FEL`-rader. Aosom-
synken (`20 */6`) hade inte kört sedan 00:20, alltså var priserna oförändrade.
En ny körning från 599 kr hade fyllt topp-40 med N37:s halvas rader mellan
599 och 618 kr och gett färre rader i min halva.

- **3 767 produkter där vi är billigare**, varav **2 121 opolerade utkast**
  (68 + 155 + 294 + 817 + 787 i fördelningstabellen).
- Topp-40 från 619 kr spänner **619–639 kr**; **23 av raderna** ligger i min
  halva.

### Förfiltrering av de 23

| skäl | antal | id |
|---|---:|---|
| `FLAGGADE.md` | 4 | `02f935c8` (balansbomsklustret), `13204f68` (brödrost svart, färgsyskon), `2fb43729` (hurts rosa, färgsyskon), `70c17966` (buxbomsklot, tvilling) |
| rörd av "Runda …"-serien på `main` | 2 | `2b890006` (Runda 115: fyrhjuling, "väntar på egen runda"), `1a851435` (Runda 83: sadelpall "i en pallrunda"; dessutom N37:s nya FLAGGADE-rad — färgsyskon till N37:s publicerade `a7bddc08`) |

Alla fyra FLAGGADE-id stod också i N2/N36:s LÄS-MIG eller framsteg med samma
skäl, som fortfarande gäller. Ingen av de 23 står i N37:s `ids.tsv`.

### Dubblettskärm (samma metod som `DUBBLETTMATNING.md`)

Två svep, `POST /stores/v3/products/query`, OFILTRERAT, `fields:
["PLAIN_DESCRIPTION"]` omskickat på varje sida, självtest i SAMMA anrop på nio
former (de sju husformerna + `35,2Hcm` + `(L x B x H)`-suffix): **9 av 9**.
60 sidor, **5 984 rader, `utanText` 0**, publicerade 3 103 (2 423 med
trippel), utkast 2 881 (2 755 med trippel). Trippel ±1/±1/±2, ordnad, eller
permuterad när största måttet är ≥ 60 cm, paketmått bara mot paketmått, mot
publicerade OCH utkast, plus identiskt namn (två första orden) mot alla och
namnord per varutyp mot publicerade.

Sedan en RIKTAD textkontroll i två svep till (samma form, 5 984 rader,
`utanText` 0): varje kandidats särskiljande tal som INTE bildar en trippel
(Ø-mått, spann som 43–55, 90,5, 63,5 + 30 L …) mot hela katalogen. Den behövdes:
salongspallen har bara `Ø35 × 72–84 cm`, och trippelskärmen såg ingenting.

| id | pris | utfall |
|---|---:|---|
| `0fda8bfe` buxbomsträd | 619 | trippel 17 × 17 × 90 mot publicerade `11749e12` (2-pack, två klot) och utkastet `9c3b6e2f` (ROSA konstträd) — olika varor. Riktad kontroll: publicerade `0dd83b50` (2-pack 90 cm, klot Ø18/20/23) och utkastet `207753f5` (110 cm, bambublad) — andra modeller. **Ren** |
| `33c51730` paraplyställ | 619 | `c4df49ca`: samma namn, alla tripplar, 619 kr — men **vit** (min är svart). Färgsyskon, ingen kulör publicerad (publicerade `7ae083dd` är ett smalt 14 cm-ställ). **Ren**, syskonet flaggas |
| `783318c1` kattlåda | 619 | **publicerade `adb8c31b`**: tråg 52 × 40 × 14, paket och doftfack lika, höjd 42 mot 39,8 — samma familj som CLAUDE.md:s trefaldiga kattlåda. **Faller** |
| `04b9206a` hundbädd med tak | 629 | **fel säsong** (utomhusbädd med solskydd i slutet av september); dessutom sex utkast med samma namn, två av dem pensionerade dubbletter av en publicerad sida |
| `05a110dc` trampolinkant | 629 | **fel säsong** |
| `1a1487a8` skärmtak | 629 | inga tripplar mot publicerade; `53982b2b` är 303 cm. **Ren** |
| `516f7c81` salongspall | 629 | **riktad kontroll: publicerade `d348bf64` (svart) och `fa078e03` (beige), "Rullpall … med rygg – sitthöjd 43–55 cm", samma Ø35 och 72–84 cm.** Grå vore en tredje kulör av en publicerad familj (N37-läget för `1a851435`). **Faller**; vita `ae880fa2` samma |
| `7bc96b8f` hundbädd med tak | 629 | **fel säsong** |
| `084b987b` sidobord med skåp | 639 | enda trippelträffen en högtryckstvätt. **Ren** |
| `12e66c66` darttavla | 639 | `e98ef716`, `34dee876`, `f3d0cde9` har samma namnstart men andra mått (49 × 54,6, Ø41,5, 44 × 51,5). **Ren** |
| `285d9ab7` pedalhink 30 L | 639 | `f39923d1`: samma tripplar, **svart**, 649 kr. Färgsyskon, ingen kulör publicerad, min billigast. `c852f39e`/`24a1670b` andra modeller (60,8/60,5 cm). **Ren**, syskonet flaggas |
| `2af7ec2d` staffli | 639 | inga tripplar; sex publicerade stafflier är andra modeller. **Ren** |
| `2c62b8b5` trädgårdsbord | 639 | **fel säsong** |
| `3bd54459` fågelmatarstation | 639 | 0 träffar. **Ren** |
| `4d8bf36f` hundbädd med tak | 639 | **fel säsong** (och färgsyskon till `04b9206a`) |
| `59b75ffa` skrivbord | 639 | bara en publicerad kolgrill. **Ren** |
| `7c3d438a` balansstenar | 639 | `3e450479`/`60f84a27` (Trittsteine i TPE, andra stenmått). **Ren** |

### `las` (polish-mapping.yml, `ref: main`) — elva körningar, alla bevisat mina

Startade 02:17:16–02:17:33; föregående körning i listan var N37:s 3817
(01:52:56), och ingen främmande körning låg i intervallet. Varje körning
bevisad på mappningsradens `wixProductId`.

| run | id | saldo | frakt | utfall |
|---:|---|---:|---:|---|
| 3818 | 0fda8bfe | 162 | 0,383 | OK |
| 3819 | 33c51730 | 83 | 0,485 | OK |
| 3820 | 1a1487a8 | 39 | 0,475 | OK |
| 3821 | 516f7c81 | 24 | 0,376 | OK (föll sedan på dubblettskärmen) |
| 3822 | 084b987b | 83 | 0,499 | OK |
| 3823 | 12e66c66 | 178 | 0,469 | OK |
| 3824 | 285d9ab7 | 89 | 0,475 | OK |
| 3825 | 2af7ec2d | 103 | 0,495 | OK |
| 3826 | 3bd54459 | 8 | 0,494 | OK |
| 3827 | 59b75ffa | 11 | 0,5 | OK |
| 3828 | 7c3d438a | 48 | 0,444 | OK |

Alla: `supplier: aosom`, `needsAiPolish: true`, `draftStatus:
pending_review`, prisgrind `stämmer: true` (charm99), ingen `LÅST PRIS`,
ingen `SLUTSALD`, saldo över `LAGER_BUFFERT`.

### Kontaktark (före texten, `bygg-ark.py`, 600 px) — alla elva

- `084b987b` bild 4: tysk text inbränd ("VERSTELLBARE FUSSPOLSTER") — stryks.
- `7c3d438a` bild 4: tysk text inbränd ("LEICHT ZU SÄUBERN") — och bild 3
  visar husmärket som etikett på själva stenen.
- Övriga nio: rena.

## Slutgiltigt urval (8, 619–639 kr)

Sju kandidater klarade allt på 639 kr och fem platser återstod där efter de
tre billigare. Oavgjort pris bröts MEKANISKT i jämförelsens egen ordning
(listan sorterar lika pris på wix-id): `084b987b`, `12e66c66`, `285d9ab7`,
`2af7ec2d`, `3bd54459` — `59b75ffa` och `7c3d438a` blev reserver.

| kort | produkt | vårt | deras | saldo |
|---|---|---:|---:|---:|
| 0fda8bfe | Konstgjort buxbomsträd 90 cm | 619 | 659 | 162 |
| 33c51730 | Paraplyställ med droppskål, svart | 619 | 659 | 83 |
| 1a1487a8 | Skärmtak 103 cm | 629 | 659 | 39 |
| 084b987b | Sidobord med skåp | 639 | 699 | 83 |
| 12e66c66 | Elektronisk darttavla | 639 | 659 | 178 |
| 285d9ab7 | Pedalhink 30 liter, krämvit | 639 | 669 | 89 |
| 2af7ec2d | Staffli för barn 2-i-1, rosa | 639 | 659 | 103 |
| 3bd54459 | Fågelmatarstation 208 cm | 639 | 669 | 8 |

`ids.tsv` bär färgsyskonen i beskrivningen, så att N39 inte publicerar en
andra kulör parallellt (`c4df49ca` och `f39923d1` ligger i N39:s halva).

Pushat i `26562d9` ("urvalet låst — ids.tsv för N39:s överlappskontroll").

## Källor och kontroll mot skarpa V3

Källtexterna hämtades server-side med artikelnummer räknade och redigerade på
servern (samma tre alternativ som `gatelib.ARTNR`): **0 träffar i alla åtta**.
`kallor.json` byggd i `bygg-kallor.py` (avskrift) och `bilder.tsv` ur samma
hämtning. Kontrollerade i ett eget anrop utan skrivning (h·31 och längd per
produkt): **8 av 8 text LIKA, 8 av 8 bildlista LIKA**. Revisionerna var då 1,
2, 2, 4, 2, 2, 5, 3.

## Bilder — kontaktark FÖRE texten

Kontaktarken (`bygg-ark.py`, i scratchpad) lästes före en enda mening
skrevs, och tre påståenden i källan prövades mot fotot:

- `33c51730`: "24 Haken und 21 Öffnungen" — gallret ovanpå har 7 × 3 = 21
  fack, och krokarna sitter i par under långsidorna (tolv synliga på
  framsidan). Stämmer.
- `2af7ec2d`: källans `49L x 53,5B` är BREDDEN som position 2 — måttbilden
  sätter 53,5 cm längs fronten och 49 cm längs sidan. Texten följer bilden
  (53,5 cm brett), se axelavsnittet nedan. Samma bild visar att krittavlan
  och whiteboarden är EN rityta på 47 × 32 cm; texten säger därför "både
  krittavla och whiteboard" och aldrig "en på varje sida".
- `285d9ab7`: måttbilden visar hinken 30 cm bred och 36 cm djup (lock-gångjärn
  bak, pedal fram) — källans `36L x 30B` lagt positionellt ger det omvända.
  Texten binder inget av talen till bredd eller djup (och skriver sedan
  granskningen bredden först, se nedan).
- `12e66c66`: källans `Gesamtmaße: 50L x 44B x 4.4H` är en VÄGGTAVLA lagd ned;
  måttbilden och källans egen `Ungefaltete Maße: 90,5L x 4,4B x 50H` ger 44
  brett, 50 högt och 4,4 djupt. Källans svenska spec-rad (46,5 × 50,5) står
  mot båda och används inte.
- Tal som bara finns i bilderna och därför INTE står i texterna:
  pedalhinkens 92 cm (öppet lock), innerhinkens 27 och 58,5 cm,
  sidobordets hyllmått "24±6,4", pallens 48 cm-fot (utesluten produkt),
  fågelmatarens 23 cm i måttbilden står däremot i källan (piggarna).
- Tysk text inbränd: `084b987b` bild 4 ("VERSTELLBARE FUSSPOLSTER") —
  struken (`bilder-bort.tsv`), produkten får fyra bilder.
- Inga husmärken eller tredjepartslogotyper på de åtta valda (reserven
  `7c3d438a` bär husmärket som etikett på själva stenen).

## Texter och första korrekturläsningen (egen svenska, eget steg)

Åtta texter i husets form (ingress, två–tre avsnitt, `Egenskaper`, de tre
flikarna ordagrant). Under skrivningen ströks två påståenden som källan inte
bär ("behandlad" metallyta → "motstår fingeravtryck"; "stadig" A-ram). Den
första korrekturläsningen gav **5 rättelser**: en tvetydig syftning
(`0fda8bfe`, "i olika storlek på tvinnade stammar"), en felkopplad
prepositionsfras (`084b987b`, "i rustikt brunt och svart stålram"), en
överlång mening delad (`084b987b`), ett upprepande FAQ-svar (`12e66c66`) och
en oklar bisats (`2af7ec2d`, "ligga framme") — samt en alt-text
(`33c51730`, "krokhyllor" → "krokhängare"). `gate.py` fällde dessutom
`Pedalen` i meningsstart (ordet står i `TYSKA_ORD`); meningen skrevs om
("Med pedalen …") i stället för att ordlistan rördes.

## Grindar (före skrivningen)

| Gate | Resultat |
|---|---|
| Trippelmönstrets självtest (9 former, i samma anrop som varje svep) | **9 av 9** i alla fyra svepen |
| `kallor.json` + `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA**, 0 artikelnummer i källorna |
| `gate.py` | **0 fynd, 0 varningar** (tre ordtal kvitterade i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** (5 axelkonflikter i källan, upplysning; 18 "anger aldrig måttet med ord") |
| `gate-alt.py` | **REN**, 8 produkter, 39 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` | **0 fynd**, lägsta saldo 8 |
| `gate-sku.py` | **0 fynd** (längsta 32 av 40 tecken) |
| SKU-krock mot alla rundors `sku.tsv` (grenen, 24 filer på `main`, N37) | **0 krockar, 0 prefixöverlapp** (478 SKU:er); N39:s fil fanns inte än |
| Slug-krock mot hela katalogen (5 984 slugs) och N37 | **0 krockar, 0 prefixöverlapp** |
| `gate-superlativ.py` / `gate-lankar.py` | **REN** / **0 fynd** |
| Läcksvep (GRINDAR + NORM + 542 tyska källord) | **0 fynd**; `EN 71` två gånger på `2af7ec2d` (källan: `EN71-1-2-3`, grindad i `gate.py`); källorden i texterna är svenska (`Aluminium`, `Material`, `Metall`, `Pedal`, `Rosa`) |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `npx vitest run lib/polish` | **99 av 99 gröna** |

### ⚠️ Axlarna: tre produkter där källans ordning inte är bildens

`bygg-axelfacit.py` lägger källans tal positionellt (första = bredd). På
`12e66c66`, `285d9ab7` och `2af7ec2d` säger måttbilden något annat (se
ovan). Facit skrivs aldrig för hand, så grinden fick stå kvar som den är;
texterna följer i stället bilden. Heltal binds till "bred/djup/hög" bara där
bilden och facit är överens (`113 cm högt`). De bindningar som följer bilden
men inte facit är decimaltal (`53,5 cm brett`, `4,4 cm djup`, `90,5 cm
bred`), som grindens mönster inte läser — för dem är alltså BILDEN kvittot,
inte grinden. Spec-raden skriver bredd först enligt bilden (`53,5 × 49 × 113
cm`, `44 × 4,4 × 50 cm`, och efter granskningen även `30 × 36 × 63,5 cm`).

Pushat OGRINDAT-TILL-WIX i `428f7b9`.

## Oberoende granskning FÖRE skrivningen — två fynd

Alla åtta utkasten lästes en gång till som av en skeptisk utomstående, mot
kontaktarken och `kallor.json`: namn, SEO, alt-texter och brödtext.

1. **`285d9ab7` — spec-raden motsade måttbilden.** `36 × 30 × 63,5 cm`
   (källans ordning) läses som bredd × djup × höjd, alltså 36 cm bred — men
   bilden visar 30 cm bred och 36 cm djup, och alt-texten till måttbilden
   sa redan `30 × 36`. Spec-raden, `Egenskaper` och "golvyta"-meningen skriver
   nu `30 × 36`. Samma princip som staffliet och darttavlan: bilden avgör
   ordningen när källans axlar är fel.
2. **`12e66c66` — "CE-certifikat enligt EMC-direktivet"** påstod mer än
   källans `CE-EMC Zertifikat`; nu "CE-certifikat för elektromagnetisk
   kompatibilitet (EMC)".

Inga andra sakfel, inga motsägande tal, ingen kvarvarande tyska eller
engelska utöver vedertagna lånord (LCD-display, whiteboard). Namn 62–78 av
80 tecken, SEO-titlar 39–53 av 60, beskrivningar 123–144 av 160. Alla
grindar omkörda efter ändringarna: samma utfall som i tabellen ovan.

Pushat i `6ffe5bb`.

## Steg 6.1 — Wix-skrivningen, steg 1 (namn/slug/brödtext/visible/SEO)

Omedelbart före: N37:s `ids.tsv` lästes om (0 gemensamma id), liksom N39:s
nya `ids.tsv` (0 gemensamma, inget av mina färgsyskon); slugs och SKU:er
jämförda mot N37:s `slugs.txt`/`sku.tsv` — 0 krockar, 0 prefixöverlapp
(N39:s filer fanns inte än). `steg1.js` (bygg-skrivning.py + bygg-steg.py:s
metaspärr `833325216 / 2655`) skickat ordagrant: ingen spärr utlöst, **8 av
8 skrivna**. Revisionerna före var exakt källkontrollens (1, 2, 2, 4, 2, 2,
5, 3) — ingen annan hade rört produkterna; efter +1.

## Steg 6.2 — media (fil-id + alt-texter)

`steg2.js` (bygg-medieskrivning.py) ordagrant: spärren över `id|altText` i
samma anrop utlöstes inte, **8 av 8 skrivna**, 39 bilder (5, 5, 5, 4, 5, 5,
5, 5), måttbilden sist, `media.main` inte skickad.

## Steg 6.3 — kategorier

`steg3.js` ordagrant, kategori-id uppslagna på NAMN i en färsk
`categories/query` i samma anrop (54 kategorier, alla tio namnen träffade):
**14 av 14 rader `success: true`**, attribuerade på radens eget
`catalogItemId`, tio bulk-anrop med `totalFailures: 0` och
`undetailedFailures: 0`.

## Steg 6.4 — variant-SKU sist och ensam

Omedelbart före: SKU:erna jämförda mot N37:s OCH N39:s `sku.tsv` (N39:s
hade då kommit, åtta rader) — 0 krockar, 0 prefixöverlapp; N39:s nya
`slugs.txt` likaså 0 krockar mot mina. `steg4.js` ordagrant, spärren
`781405103 / 607` i samma anrop: **8 av 8 skrivna**. Färsk GET med
`?fields=VARIANT_OPTION_CHOICE_NAMES`, varianten kopierad med bara `sku`
ändrad, `visible` (och `options` om de finns) i kropp och fältmask. Alla åtta
hade EN variant; variant och produkt var `visible: true` före; `prisFore`
619, 619, 629, 639 × 5 — urvalets priser; variant-id stämde med
`variant.tsv`. De tyska SKU:erna (`FP-kunstlicher-buchsbaum`,
`FP-schirmstander-mit`, `FP-vordach-fur-haustur`, `FP-beistelltisch-mit`,
`FP-elektronische`, `FP-mulleimer-30l-treteimer`, `FP-2-in-1`,
`FP-vogel-futterstation-208`) är utbytta — skrivningen gjorde verkligt
arbete.

Pushat i `2fc16e0`.

## Steg 6.5 — separat återläsning, i ett eget senare anrop

`steg5.js` (facit ur `ids`, `namn`, `seo`, `slugs`, `sku`, `kategori`,
`vantat-hash` och `media-hash` — aldrig skrivet av), med
`?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES`
och ett AVBROTT om något av fälten saknas i projektionen innan en nolla
tolkas: **8 av 8 helt verifierade.**

| kort | rev | text (wixnorm-hash + tecken) | bilder | kat. (inkl. All Products) | SKU | pris | lager |
|---|--:|---|--:|--:|---|--:|---|
| `0fda8bfe` | 4 | LIKA, 2 506 | 5 | 3 | LIKA | 619 | IN_STOCK |
| `33c51730` | 5 | LIKA, 2 553 | 5 | 3 | LIKA | 619 | IN_STOCK |
| `1a1487a8` | 5 | LIKA, 2 823 | 5 | 3 | LIKA | 629 | IN_STOCK |
| `084b987b` | 7 | LIKA, 2 707 | 4 | 3 | LIKA | 639 | IN_STOCK |
| `12e66c66` | 5 | LIKA, 2 865 | 5 | 2 | LIKA | 639 | IN_STOCK |
| `285d9ab7` | 5 | LIKA, 2 412 | 5 | 2 | LIKA | 639 | IN_STOCK |
| `2af7ec2d` | 8 | LIKA, 2 467 | 5 | 3 | LIKA | 639 | IN_STOCK |
| `3bd54459` | 6 | LIKA, 2 594 | 5 | 3 | LIKA | 639 | IN_STOCK |

Namn, slug, `visible: true`, SEO (exakt två taggar, inga nyckelord), media
(`id|altText`-summan), variantens `visible` och variant-id stämde på alla
åtta. Varje revision är källkontrollens +3 — tre produkt-PATCHar (text,
media, SKU); kategorikopplingen rör inte produktens revision. Priserna är
urvalets, orörda.

## Steg 7 — stämpeln, och en egen `las` per stämpel

`las` hade körts 02:17 och stämplingen startade 02:49 — inom timmen, så ingen
ny förhandsläsning behövdes. Senaste körningen i listan före mina var 3838
(02:31, N39:s). `stampla` (polish-mapping.yml, `ref: main`) med
`needs_ai_polish: "false"`, `draft_status: "published"` och `variant_skus`
ur `bygg-steg.py --stampla` — aldrig skrivna av. Varje körning bevisad på
sin `OK: <wixProductId> uppdaterad`-rad:

| stämpel | `las` efteråt | id | needsAiPolish | draftStatus | SKU (mappning) | pris | prisgrind | saldo |
|---:|---:|---|---|---|---|--:|---|--:|
| 3839 | 3847 | `0fda8bfe` | false | published | LIKA | 619 | stämmer | 162 |
| 3840 | 3848 | `33c51730` | false | published | LIKA | 619 | stämmer | 83 |
| 3841 | 3849 | `1a1487a8` | false | published | LIKA | 629 | stämmer | 39 |
| 3842 | 3850 | `084b987b` | false | published | LIKA | 639 | stämmer | 83 |
| 3843 | 3851 | `12e66c66` | false | published | LIKA | 639 | stämmer | 178 |
| 3844 | 3852 | `285d9ab7` | false | published | LIKA | 639 | stämmer | 89 |
| 3845 | 3853 | `2af7ec2d` | false | published | LIKA | 639 | stämmer | 103 |
| 3846 | 3854 | `3bd54459` | false | published | LIKA | 639 | stämmer | 8 |

Sexton körningar, alla gröna, alla med rätt produkt-id i loggen. Priserna
är desamma som vid urvalet — ingen prisändring, ingen `LÅST PRIS`, ingen
`SLUTSALD`. Mappningens `variants[].wixVariantId` stämmer med `variant.tsv`.

## Läge

Wix klart, återläst och stämplat. Nästa: live (`hamta-live.sh 130`, sedan
`livegrind.py` till slut), JSON-LD, andra korrekturläsningen.
