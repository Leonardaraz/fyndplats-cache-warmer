# Runda N36 — åtta produkter, 499–599 kr

Åtta Aosom-utkast polerade och publicerade: ett sidobord i C-form på hjul,
en mopphink på 20 liter med press, en mörkgrå matta 170 × 120 cm, ett
staffli för barn med krittavla och whiteboard, en brödrost för fyra skivor,
en modulgarderob i plast, en förvaringshurts för barn med tre lådor och en
brevlåda för vägg med tidningshållare.

Rundan gjordes i ett sammanhängande pass (urval, källor, bilder, texter,
grindar, granskning, skrivning, stämpling, live-verifiering och andra
korrekturläsningen), pushat i flera commits på grenen
`claude/seo-polering-runbook-review-uq6fwl`. Den detaljerade loggen står i
`framsteg.md`.

| id | produkt | SKU | vårt pris | dealproffsen | saldo |
|---|---|---|---:|---:|---:|
| 46c0fe07 | Sidobord i C-form på hjul – skiva i valnötslook och svart stålram | FP-sidobord-c-form-hjul-valnot | 499 kr | 529 kr | 26 |
| 3bfee58b | Mopphink 20 liter på hjul – avtagbar press och skiljevägg, svart | FP-mopphink-20-l-press-svart | 549 kr | 559 kr | 136 |
| 265b0f61 | Matta 170 × 120 cm i mörkgrått – geometriskt randmönster, tål maskintvätt | FP-matta-170x120-morkgra | 569 kr | 699 kr | 33 |
| 69ba5b8b | Staffli för barn i trä – krittavla och whiteboard, höjd 70–97 cm | FP-staffli-barn-kritt-whiteboard | 579 kr | 629 kr | 76 |
| 2b27c2a4 | Brödrost för fyra skivor – grå med vågmönster, sju lägen och högt lyft | FP-brodrost-4-skivor-gra-vag | 599 kr | 619 kr | 106 |
| 37804a40 | Modulgarderob i plast 111 × 183 cm – två hängfack och nio fack, svart och vit | FP-modulgarderob-111x183-cm | 599 kr | 749 kr | 23 |
| 6707c9dd | Förvaringshurts för barn med tre lådor – blå, rundade kanter | FP-forvaringshurts-barn-3-lador | 599 kr | 629 kr | 171 |
| 676e567f | Brevlåda för vägg med tidningshållare – mörkgrå, lås och två nycklar | FP-brevlada-vagg-tidningshallare | 599 kr | 619 kr | 104 |

Wix-siten verifierades FÖRST mot N35:s publicerade `8a076c08` ("Barstolar
2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm") — namn och
`visible: true` stämde.

## Urvalet — Leonards regel, återställd

**Bara produkter där vi är billigare än dealproffsen, sorterade på vårt pris
stigande.** Workflowen "Pris — jamfor mot dealproffsen" (`dealproffsen.yml`,
`mode: jamfor`) kördes från grenen, aldrig från `main` (jämförelsen finns
bara på grenen). Två körningar, båda FULLSTÄNDIGA — sista `varv`-raden
`0 prefix kvar`, inga `FEL`-rader:

| körning | `fran_pris` | utfall |
|---|---:|---|
| run 31 | 0 | varv 1: 3 246 granskade · varv 2: 1 704, **0 prefix kvar** |
| run 32 | 619 | varv 1: 3 451 · varv 2: 1 499, **0 prefix kvar** (reserver, ingen behövdes) |

- **3 767 produkter där vi är billigare**, varav **2 121 opolerade utkast**.
- Topp-40-listan från 0 kr spänner **469–619 kr**.

### ⚠️ Uppdelningen med N37

Mitt i urvalet startade Runda N37 parallellt, i en egen worktree, mot samma
lista. För att två rundor inte skulle polera samma vara delades id-rymden:
**N36 tar bara wix-id som börjar på `0`–`7`, N37 `8`–`f`.** 15 av de 40
raderna låg i N36:s halva. `ids.tsv` pushades direkt efter låsningen
(`838b2ef`) så att N37 kunde släppa varje överlapp, och den bär
färgsyskonen i beskrivningen — mopphinkens röda och blå kulör ligger i
N37:s halva och fick inte publiceras parallellt.

Två följder som gäller varje framtida parallellkörning:

- En workflow-körning räknades som min först när produkt-id:t i loggen
  (`las`: mappningsradens `wixProductId`; `stampla`: `OK: <id> …`) var det
  jag startat den för. Vid verifieringen efter stämplingen startade sexton
  körningar i samma fönster: åtta var mina (bevisade på id:t), sex bar
  N37:s id och två startade före min första körning — de åtta lästes inte
  vidare.
- Slugs och SKU:er jämfördes mot N37:s `slugs.txt` och `sku.tsv`
  omedelbart före Wix-steg 1 och steg 4: **0 krockar, 0 prefixöverlapp**.

### Förfiltrering av de 15 i N36:s halva

| skäl | antal | id |
|---|---:|---|
| `FLAGGADE.md` | 0 | — |
| dubblett enligt tidigare rundas LÄS-MIG/framsteg | 2 | `65d3d373` (N2), `1a3ac422` (H3) |
| rörd av "Runda …"-serien på `main` | 2 | `1a3ac422` (Runda 115), `6f9fee21` (Runda 63/135) |

Tre unika id förfiltrerade (`1a3ac422` föll på båda skälen). Mängden
`main`-id byggdes ur alla filer under `main`:s `runda-<siffror>*` plus
seriens commit-meddelanden — 1 621 id, en medveten övermängd.

### Screening av de återstående 12

Dubblettskärm som i `DUBBLETTMATNING.md`: ofiltrerat svep, `fields`
omskickat på varje sida, **5 984 rader, `utanText` 0**, självtest 7 av 7,
trippel ±1/±1/±2 (permuterad från 60 cm, paket mot paket), mot publicerade
OCH utkast. Plus namnskärm per varutyp mot publicerade sidor, och `las` på
alla tio som gick vidare.

| id | pris | utfall |
|---|---:|---|
| `5d9e6795` pall | 469 | **saldo 3 = `LAGER_BUFFERT`** — hade visats som slutsåld |
| `7819dd4f` sittdynor | 559 | **fel säsong** (utomhusdynor i slutet av september) |
| `7d1fb82b` buxbomsklot | 599 | **identisk tvilling** till `70c17966` — N31-läget, lämnas orörd |
| `02f935c8` balansbom | 619 | behövdes inte (åtta fyllda under 619 kr); fyrvägskluster, billigast i N37:s halva |
| de åtta ovan | 499–599 | rena |

Tre av de åtta har färgsyskon som utkast men **ingen kulör publicerad**, och
den valda är billigast i sin familj (N28/N33-läget): mopphinken (tre
kulörer till), hurtsen (två till) och brödrosten (en till). Syskonen står i
`FLAGGADE.md` så att nästa runda inte publicerar en andra kulör utan
beslutet i `FARGSYSKONEN.md`.

Modulgarderoben delar kubmåtten med den publicerade `4cd5d6d1` (111 × 145,
åtta fack) — samma system i en ANNAN storlek, alltså ett medvetet
storleksval och ingen dubblett. Den publicerade "Rittavla för barn"
(`d5f6bab3`) är en annan vara än staffliet (magnetisk, vridbar, annan
modell).

## Bilder — kontaktark FÖRE texten

- Tysk text inbränd, strukna: `3bfee58b` bild 4, `265b0f61` bild 4,
  `69ba5b8b` bild 4 och 5 (`69ba5b8b` är en trebildsprodukt).
- Tre ställen där bild och källa var oense, och därför INTE står i texten:
  staffliets hyllmått, sidobordets frigång mot golvet (bilden 8 cm, källan
  6 cm) och mattans namn (källan säger 150, text och måttbild 170 × 120 —
  texten följer måttbilden och tekniska data).
- `3bfee58b` bild 1 bär en flerspråkig varningstext ("CAUTION WET FLOOR",
  "ACHTUNG" …) TRYCKT PÅ SJÄLVA HINKEN. Det är varan, inte en påklistrad
  grafik — bilden är behållen.
- Husmärke på själva varan: se frågorna till Leonard nedan.

## Granskningar och korrekturläsningar

| steg | sakfel | språkfel |
|---|---:|---:|
| Första korrekturläsningen (egen svenska, eget steg) | 0 | **10** |
| Oberoende granskning FÖRE skrivningen (`6d83236`) | 0 | **1** (en alt-text) |
| Andra korrekturläsningen, på den PUBLICERADE texten | 0 | 0 |

Den andra korrekturläsningen plockade varje mening MEKANISKT ur de hämtade
live-sidorna — h1, `<title>`, meta description, alla 36 alt-texter och
brödtexten mening för mening, 402 rader — och ställde varje påstående som
inte är en siffra mot källtexten. De två påståendena som bara kommer från
fotot (mopphinkens varningssymbol och pressens handtag) kontrollerades mot
bilden. Ingen omskrivning behövdes; två stilobservationer (mattans
meta description, brödrostens upprepade "högt lyft") är medvetet orörda
och motiverade i `framsteg.md`.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| dealproffsen-jämförelsen | **fullständig** i båda körningarna (0 prefix kvar, inga `FEL`) |
| Trippelmönstrets självtest (7 former) | **7 av 7** |
| `kallor.json` + `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA**, 0 artikelnummer i källorna |
| `gate.py` | **0 fynd, 0 varningar** (två ordtal kvitterade i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** |
| `gate-alt.py` | **REN**, 8 produkter, 36 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` | **0 fynd**, lägsta saldo 23 |
| `gate-sku.py` | **0 fynd** (längsta 32 av 40 tecken) |
| SKU-krock mot alla rundors `sku.tsv` (grenen + `main`, 462 SKU:er) och N37 | **0 krockar** |
| Slug-krock mot hela katalogen (5 984) och N37 | **0 krockar** |
| `gate-superlativ.py` / `gate-lankar.py` | **REN** / **0 fynd** |
| Läcksvep + teckensvep | **0 fynd** / **0 oväntade tecken** |
| Steg 1 (namn/slug/brödtext/`visible`/SEO) | **8 av 8 skrivna** |
| Steg 2 (media, fil-id + alt) | **8 av 8 skrivna**, 36 bilder |
| Steg 3 (kategorier, bulk add-items) | **13 av 13 rader success**, `totalFailures: 0` |
| Steg 4 (variant-SKU sist och ensam) | **8 av 8 skrivna** |
| Separat, senare återläsning (`steg5.js`) | **8 av 8 helt verifierade** |
| Stämpling + egen `las` per produkt | **8 av 8** |
| `livegrind.py` (efter `hamta-live.sh 130`, `age: 140`) | **8/8 REN, 0 avvikelser** |
| JSON-LD `availability` | **InStock** på alla åtta, priserna oförändrade |
| `npx vitest run lib/polish` | **99 av 99 gröna** |

## Skrivstegen i praktiken

Alla fyra Wix-steg kördes med kontrollsummespärren i SAMMA anrop som
skrivningen; ingen spärr utlöstes. Revisionerna före steg 1 var exakt
källkontrollens — ingen annan hade rört produkterna. Kategori-id slogs upp
på NAMN i samma anrop (54 kategorier, alla nio namnen träffade). Steg 4
läste varianten färskt och ändrade bara `sku`: `visible` var `true` på
produkt och variant före skrivningen, priset var urvalets, och de tyska
SKU:erna byttes verkligen ut — skrivningen gjorde verkligt arbete.

Urvalets `las` kördes 01:15 och stämplingen 01:44, alltså inom en timme —
ingen extra `las` behövdes före stämplingen. Priset rördes aldrig.

## Frågor till Leonard

1. **Husmärke på själva varan — `2b27c2a4` (brödrosten).** En logotypskylt
   sitter mellan vreden och syns på alla fem bilderna. Enligt runbooken är
   bilderna behållna och märket nämns aldrig i texten. Säg till om sidan
   ska få andra bilder eller dras tillbaka.
2. **Färgsyskonen.** Tre familjer har nu EN kulör publicerad (mopphink,
   hurts, brödrost) och resten som utkast på listan "vi billigare". Om de
   ska bli fler sidor, en sida med färgval eller stå kvar är samma öppna
   fråga som i `FARGSYSKONEN.md`.

Inga licensierade figurer eller licensierade varumärken (`FLAGGADE.md`:s
första kategori) i någon av de åtta.

## Uppskjutet med flit

**Faktakorten är medvetet uppskjutna** i den här rundan: ingen `kort.tsv`,
inga kort renderade eller uppladdade. Sidorna är kompletta utan dem.

## Övrigt i rundan

- **Ett delvis artikelnummer i N35:s `framsteg.md`** (numrets inledning,
  använd som `grep`-mönster) hittades under förberedelsen. `ARTNR` fäller
  bara hela nummer, så `artikelnummer-lackage.test.ts` kunde inte se det.
  Struket i en egen commit (`9546cd3`); meningen säger nu ‹REDIGERAT›.
- Nya rader i `FLAGGADE.md` (bara tillägg): två dubblettkluster
  (`7d1fb82b`; balansbomsklustret kring `02f935c8`) och tre bortval
  (`5d9e6795`, `7819dd4f`, färgsyskonen till de tre publicerade sidorna).

## Filer i katalogen

Genererade ur rundans filer, inte skrivna för hand: `kallor.json` (ur
`bygg-kallor.py`), `axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`,
`nyttolast-media.json`, `medieskrivning.json`, `media-hash.tsv`,
`steg1-bas.js` → `steg1.js` (gitignorad), `steg2.js`–`steg5.js` (ur
rundans `bygg-steg.py`, kopierad från N35 med bara referenserna ändrade).
`live/` (gitignorad) är de hämtade sidorna som `livegrind.py` läste.
