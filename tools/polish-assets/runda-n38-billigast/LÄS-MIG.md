# Runda N38 — åtta produkter, 619–639 kr

Åtta Aosom-utkast polerade och publicerade: ett konstgjort buxbomsträd med
tre klot, ett paraplyställ med droppskål, ett skärmtak för dörr och fönster,
ett sidobord med skåp och öppet fack, en elektronisk darttavla med dörrar,
en pedalhink på 30 liter, ett staffli för barn med två tygboxar och en
fågelmatarstation på 208 cm.

Rundan gjordes i ett sammanhängande pass (urval, källor, bilder, texter,
grindar, granskning, skrivning, stämpling, live-verifiering och andra
korrekturläsningen), parallellt med Runda N37 och sedan N39 i en egen
worktree, pushat i flera commits på grenen
`claude/seo-polering-runbook-review-uq6fwl`. Den detaljerade loggen står i
`framsteg.md`.

| id | produkt | SKU | vårt pris | dealproffsen | saldo |
|---|---|---|---:|---:|---:|
| 0fda8bfe | Konstgjort buxbomsträd 90 cm – tre klot på tvinnade stammar, cementfylld kruka | FP-buxbomstrad-90-cm-tre-klot | 619 kr | 659 kr | 162 |
| 33c51730 | Paraplyställ med droppskål – 21 fack och 24 krokar, svart stål | FP-paraplystall-droppskal-svart | 619 kr | 659 kr | 83 |
| 1a1487a8 | Skärmtak 103 cm för dörr och fönster – välvd polykarbonat, svarta konsoler | FP-skarmtak-103-cm-polykarbonat | 629 kr | 659 kr | 39 |
| 084b987b | Sidobord med skåp och öppet fack – rustikt brunt med svart stålram, 80 cm | FP-sidobord-skap-oppet-fack-brun | 639 kr | 699 kr | 83 |
| 12e66c66 | Elektronisk darttavla med dörrar – 26 spel, upp till 8 spelare, sex pilar | FP-darttavla-elektronisk-dorrar | 639 kr | 659 kr | 178 |
| 285d9ab7 | Pedalhink 30 liter i krämvitt – mjukstängande lock och löstagbar innerhink | FP-pedalhink-30-l-kramvit | 639 kr | 699 kr | 89 |
| 2af7ec2d | Staffli för barn 2-i-1 i rosa – krittavla, whiteboard och två tygboxar | FP-staffli-barn-2-i-1-rosa | 639 kr | 659 kr | 103 |
| 3bd54459 | Fågelmatarstation 208 cm – fyra krokar, tre matare och två skålar | FP-fagelmatarstation-208-cm | 639 kr | 669 kr | 8 |

Wix-siten verifierades FÖRST mot N36:s publicerade `46c0fe07` ("Sidobord i
C-form på hjul – skiva i valnötslook och svart stålram") — namn och
`visible: true` stämde.

## Urvalet — Leonards regel, golv 599 kr

**Bara opolerade utkast där vi är billigare än dealproffsen, sorterade på vårt
pris stigande.** N36 tömde id-halvan `0`–`7` upp till 599 kr, och N36:s
topp-40 från 0 kr slutade på 619 kr — allt under 619 kr i den halvan var
alltså redan prövat.

Enligt promptens steg 0 återanvändes en färsk körning i stället för att
starta en ny: **run 32** av "Pris — jamfor mot dealproffsen"
(`dealproffsen.yml`, `mode: jamfor`, `fran_pris: 619`, `ref:` grenen),
startad 01:09, knappt en timme före urvalet. Den är FULLSTÄNDIG — `varv 1:
3451 granskade … 59 prefix kvar` · `varv 2: 1499 granskade … 0 prefix kvar`,
inga `FEL`-rader — och Aosom-synken hade inte kört sedan dess, alltså var
priserna oförändrade. En ny körning från 599 kr hade fyllt topp-40 med N37:s
halvas rader mellan 599 och 618 kr och gett färre rader i min halva.

- **3 767 produkter där vi är billigare**, varav **2 121 opolerade utkast**.
- Topp-40-listan från 619 kr spänner **619–639 kr**; **23 av raderna** ligger
  i N38:s halva.

### ⚠️ Parallellt med N37 och N39

**N38 tog bara wix-id som börjar på `0`–`7`**; N37 och därefter N39 tog
`8`–`f` i en egen worktree. `ids.tsv` pushades direkt efter låsningen
(`26562d9`) och bär färgsyskonen i beskrivningen — paraplyställets vita och
pedalhinkens svarta kulör fick inte publiceras parallellt (den vita ligger i
N39:s halva).

- En workflow-körning räknades som min först när produkt-id:t i loggen
  (`las`: mappningsradens `wixProductId`; `stampla`: `OK: <id> …`) var det
  jag startat den för. Alla 27 körningar (elva `las` i urvalet, åtta
  `stampla`, åtta `las` efteråt) är bevisade så; ingen främmande körning låg
  i mina intervall.
- Slugs och SKU:er jämfördes mot N37:s OCH N39:s `slugs.txt`/`sku.tsv`
  omedelbart före Wix-steg 1 och steg 4 (N39:s filer fanns vid steg 4):
  **0 krockar, 0 prefixöverlapp**.

### Förfiltrering av de 23 i N38:s halva

| skäl | antal | id |
|---|---:|---|
| `FLAGGADE.md` | 4 | `02f935c8` (balansbomsklustret), `13204f68` (brödrost, färgsyskon), `2fb43729` (hurts, färgsyskon), `70c17966` (buxbomsklot, tvilling) |
| dubblett enligt tidigare rundas LÄS-MIG/framsteg | 0 | — (de fyra ovan står där med samma skäl, som fortfarande gäller) |
| rörd av "Runda …"-serien på `main` | 2 | `2b890006` (Runda 115), `1a851435` (Runda 83; dessutom N37:s färgsyskon) |

Mängden `main`-id byggdes ur alla filer under `main`:s `runda-<siffror>*`
plus seriens commit-meddelanden — 4 720 id, en medveten övermängd.

### Screening av de återstående 17

Dubblettskärm som i `DUBBLETTMATNING.md`: ofiltrerat svep, `fields`
omskickat på varje sida, **5 984 rader, `utanText` 0**, självtest **9 av 9**
(de sju husformerna plus `35,2Hcm` och ett `(L x B x H)`-suffix), trippel
±1/±1/±2 (permuterad från 60 cm, paket mot paket), mot publicerade OCH
utkast. Plus namnskärm, och en RIKTAD textkontroll på varje kandidats tal
som inte bildar en trippel (Ø-mått, spann) — den behövdes, se salongspallen.
`las` kördes på alla elva som gick vidare (3818–3828), alla rena.

| id | pris | utfall |
|---|---:|---|
| `783318c1` kattlåda | 619 | **samma familj som publicerade `adb8c31b`** (599 kr) — tråget 52 × 40 × 14, höjd 42 mot 39,8 |
| `516f7c81` salongspall | 629 | **riktad kontroll: samma rullpall som publicerade `d348bf64`/`fa078e03`** (Ø35, 72–84 cm); trippelskärmen såg ingenting |
| `04b9206a`, `7bc96b8f` hundbäddar med tak | 629 | **fel säsong** (utomhusbädd med solskydd i slutet av september) |
| `05a110dc` trampolinkant | 629 | **fel säsong** |
| `2c62b8b5` trädgårdsbord, `4d8bf36f` hundbädd med tak | 639 | **fel säsong** |
| `59b75ffa` skrivbord, `7c3d438a` balansstenar | 639 | rena — **reserver** (se nedan) |
| de åtta ovan | 619–639 | rena |

Sju kandidater klarade allt på 639 kr, och fem platser återstod där efter de
tre billigare. **Oavgjort pris bröts mekaniskt i jämförelsens egen ordning**
(listan sorterar lika pris på wix-id) — `59b75ffa` och `7c3d438a` blev
reserver. Fågelmatarstationen är ingen säsongsvara åt fel håll: fåglar matas
mest på vintern.

Två av de åtta har ett färgsyskon som utkast men **ingen kulör publicerad**,
och den valda är billigast (eller lika billig) i sin familj: paraplyställets
vita `c4df49ca` (619 kr, lika pris — den svarta togs för att den ligger i
N38:s halva) och pedalhinkens svarta `f39923d1` (649 kr). Syskonen står i
`FLAGGADE.md` så att nästa runda inte publicerar en andra kulör utan beslutet
i `FARGSYSKONEN.md`.

## Bilder — kontaktark FÖRE texten

- Tysk text inbränd, struken: `084b987b` bild 4 ("VERSTELLBARE FUSSPOLSTER").
  Produkten har fyra bilder.
- Tre påståenden i källan prövades mot fotot innan en mening skrevs:
  paraplyställets 21 fack och 24 krokar (stämmer); staffliets rityta, som
  måttbilden visar som både krittavla och whiteboard på 47 × 32 cm —
  bilderna talar för en panel per sida, men det går inte att avgöra säkert,
  så texten säger aldrig "en på varje sida"; och darttavlans mått — källans
  `Gesamtmaße` är en väggtavla lagd ned; bilden ger 44 brett, 50 högt och
  4,4 djupt.
- Tal som bara finns i bilderna står INTE i texterna (pedalhinkens 92 cm med
  öppet lock, innerhinkens mått, sidobordets hyllmått).
- Inga husmärken eller tredjepartslogotyper på de åtta. Reserven `7c3d438a`
  bär en Outsunny-etikett på själva stenen — se frågorna nedan.

### ⚠️ Axlarna: tre produkter där källans ordning inte är bildens

`bygg-axelfacit.py` lägger källans tal positionellt (första = bredd). På
`12e66c66`, `285d9ab7` och `2af7ec2d` säger måttbilden något annat. Facit
skrivs aldrig för hand, så grinden fick stå kvar som den är; texterna följer
i stället bilden. Heltal binds till "bred/djup/hög" bara där bilden och facit
är överens (`113 cm högt`). De bindningar som följer bilden men inte facit är
decimaltal (`53,5 cm brett`, `4,4 cm djup`, `90,5 cm bred`), som grindens
mönster inte läser — för dem är alltså BILDEN kvittot, inte grinden.
Spec-raden skriver bredd först enligt bilden (`53,5 × 49 × 113 cm`,
`44 × 4,4 × 50 cm`, `30 × 36 × 63,5 cm`).

## Granskningar och korrekturläsningar

| steg | sakfel | språkfel |
|---|---:|---:|
| Första korrekturläsningen (egen svenska, eget steg) | 0 | **6** (fem i brödtexten, en alt-text) |
| Oberoende granskning FÖRE skrivningen (`6ffe5bb`) | **2** | 0 |
| Andra korrekturläsningen, på den PUBLICERADE texten | 0 | 0 |

Under skrivningen ströks dessutom två påståenden som källan inte bär
("behandlad" metallyta, "stadig" A-ram), och `gate.py` fällde `Pedalen` i
meningsstart (ordet står i `TYSKA_ORD`) — meningen skrevs om i stället för
att ordlistan rördes. Granskningens två sakfel: pedalhinkens spec-rad läste
36 cm BRED när bilden visar 30 (nu `30 × 36`), och darttavlans "CE-certifikat
enligt EMC-direktivet" påstod mer än källans `CE-EMC Zertifikat`.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| dealproffsen-jämförelsen (run 32) | **fullständig** (0 prefix kvar, inga `FEL`) |
| Trippelmönstrets självtest (9 former, i samma anrop som varje svep) | **9 av 9** i alla fyra svepen |
| `kallor.json` + `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA**, 0 artikelnummer i källorna |
| `gate.py` | **0 fynd, 0 varningar** (tre ordtal kvitterade i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** (se axelavsnittet) |
| `gate-alt.py` | **REN**, 8 produkter, 39 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` | **0 fynd**, lägsta saldo 8 |
| `gate-sku.py` | **0 fynd** (längsta 32 av 40 tecken) |
| SKU-krock mot alla rundors `sku.tsv` (grenen + `main`, 478 SKU:er), N37 och N39 | **0 krockar** |
| Slug-krock mot hela katalogen (5 984), N37 och N39 | **0 krockar** |
| `gate-superlativ.py` / `gate-lankar.py` | **REN** / **0 fynd** |
| Läcksvep + teckensvep | **0 fynd** / **0 oväntade tecken** |
| Steg 1 (namn/slug/brödtext/`visible`/SEO) | **8 av 8 skrivna** |
| Steg 2 (media, fil-id + alt) | **8 av 8 skrivna**, 39 bilder |
| Steg 3 (kategorier, bulk add-items) | **14 av 14 rader success**, `totalFailures: 0` |
| Steg 4 (variant-SKU sist och ensam) | **8 av 8 skrivna** |
| Separat, senare återläsning (`steg5.js`) | **8 av 8 helt verifierade** |
| Stämpling + egen `las` per produkt | **8 av 8** (3839–3846, 3847–3854) |
| `livegrind.py` (efter `hamta-live.sh 130`, `age: 140`) | **8/8 REN, 0 avvikelser** |
| JSON-LD `availability` | **InStock** på alla åtta, priserna oförändrade |
| `npx vitest run lib/polish` | **99 av 99 gröna** |

## Skrivstegen i praktiken

Alla fyra Wix-steg kördes med kontrollsummespärren i SAMMA anrop som
skrivningen; ingen spärr utlöstes. Revisionerna före steg 1 var exakt
källkontrollens (1, 2, 2, 4, 2, 2, 5, 3) — ingen annan hade rört
produkterna — och efter steg 4 källkontrollens +3 på alla åtta.
Kategori-id slogs upp på NAMN i samma anrop (54 kategorier, alla tio namnen
träffade). Steg 4 läste varianten färskt och ändrade bara `sku`: `visible`
var `true` på produkt och variant före skrivningen, priset var urvalets, och
de tyska SKU:erna byttes verkligen ut — skrivningen gjorde verkligt arbete.

Urvalets `las` kördes 02:17 och stämplingen 02:49, alltså inom en timme —
ingen extra `las` behövdes före stämplingen. Priset rördes aldrig.

## Frågor till Leonard

1. **Färgsyskonen.** Två familjer har nu EN kulör publicerad (paraplyställ
   svart, pedalhink krämvit) och resten som utkast på listan "vi billigare".
   Om de ska bli fler sidor, en sida med färgval eller stå kvar är samma
   öppna fråga som i `FARGSYSKONEN.md`.
2. **Billigare utkast bakom publicerade sidor.** Salongspallarna `516f7c81`
   och `ae880fa2` (629 kr) är samma rullpall som de publicerade `d348bf64`
   (639 kr) och `fa078e03` (659 kr), och kattlådan `783318c1` (619 kr) hör
   till samma familj som den publicerade `adb8c31b` (599 kr). Fler kulörer,
   pensionering eller orört — samma fråga som N37:s miniugn.
3. **Husmärke på själva varan — reserven `7c3d438a`** (balansstenar). En
   Outsunny-etikett sitter på stenen i bild 3, och bild 4 bär tysk text. Den
   är inte publicerad; frågan gäller om den ska bli det.

Inga licensierade figurer eller licensierade varumärken (`FLAGGADE.md`:s
första kategori) i någon av de åtta, och inget husmärke på dem.

## Uppskjutet med flit

**Faktakorten är medvetet uppskjutna** i den här rundan, som i N15–N37:
ingen `kort.tsv`, inga kort renderade eller uppladdade. Sidorna är kompletta
utan dem.

## Övrigt i rundan

- **Ett felskrivet konkurrentpris i `framsteg.md`**: pedalhinkens
  dealproffsen-pris stod som 669 kr; run 32:s logg säger **699 kr** (60 kr
  under). Rättat; ingenting annat byggde på talet.
- **En läsning i fel worktree.** Under förberedelsen kördes ett
  skrivskyddat `git log` i `/home/user/wt-n37`, där rundan bara fick LÄSA
  filer och aldrig köra git-kommandon. Ingenting skrevs och ingenting
  ändrades där; övriga läsningar i den katalogen var vanliga filläsningar
  av N37:s och N39:s `ids.tsv`, `slugs.txt` och `sku.tsv`.
- Nya rader i `FLAGGADE.md` (bara tillägg): färgsyskonen `c4df49ca` och
  `f39923d1`; salongspallarna `516f7c81`/`ae880fa2`; kattlådan `783318c1`;
  säsongsvarorna med sina namnkluster (hundbäddar med tak, trampolinkanter,
  trädgårdsbordet); reserverna `59b75ffa` och `7c3d438a`.

## Filer i katalogen

Genererade ur rundans filer, inte skrivna för hand: `kallor.json` (ur
`bygg-kallor.py`), `axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`,
`nyttolast-media.json`, `medieskrivning.json`, `media-hash.tsv`,
`steg1-bas.js` → `steg1.js` (gitignorad), `steg2.js`–`steg5.js` (ur
rundans `bygg-steg.py`, kopierad från N36 med bara referenserna ändrade).
`live/` (gitignorad) är de hämtade sidorna som `livegrind.py` läste.
