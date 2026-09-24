# Runda N37 — åtta produkter, 539–599 kr

Åtta Aosom-utkast polerade och publicerade: väggkrukor i svart stål
(3-pack), ett smalt sidobord med tre plan, en fågelbogunga Ø110 cm, ett
gnistskydd för öppen spis, en gunghäst i trä med zebraränder, ett sängbord
med låda och hylla, ett basketställ 5-i-1 för barn och en sadelpall på hjul.

Rundan kördes PARALLELLT med Runda N36, i en egen git-worktree på en lokal
gren, och delade urvalet med N36 på wix-id:ts första tecken: **N37 tog bara
id som börjar på `8`, `9` eller `a`–`f`**, N36 `0`–`7`. N36:s `ids.tsv`,
`slugs.txt` och `sku.tsv` lästes efter urvalet och en gång till omedelbart
före Wix-steg 1, och `sku.tsv` en tredje gång omedelbart före steg 4:
**noll överlapp** i id, slug och SKU vid alla tillfällena. När N36 var klar
tog Runda N38 över samma halva; rundans enda skrivning därefter (rättelsen i
steg 11) rörde varken slug eller SKU, och N38 hade då inga filer att krocka
med. Allt pushat på grenen `claude/seo-polering-runbook-review-uq6fwl` med
rebase ovanpå N36:s commits.

| id | produkt | SKU | pris | dealproffsen | saldo |
|---|---|---|---:|---:|---:|
| 81a3065e | Väggkrukor 3-pack i svart stål – runda, akrylfront, Ø30,5, Ø20,5 och Ø15,5 cm | FP-vaggkrukor-3-pack-svart | 539 kr | 549 kr | 55 |
| ff10ccf5 | Smalt sidobord med tre plan – 43 × 18 × 62,5 cm, svart metall och brun trälook | FP-sidobord-smalt-tre-plan | 539 kr | 589 kr | 144 |
| e118ae32 | Fågelbogunga Ø110 cm – blå, två justerbara rep, bär 100 kg | FP-fagelbogunga-110-bla | 559 kr | 629 kr | 69 |
| ae2ac5e5 | Gnistskydd för öppen spis 96 cm – tre paneler, hopfällbart, svart metall | FP-gnistskydd-96-cm-tre-paneler | 569 kr | 579 kr | 101 |
| f1e0a996 | Gunghäst i trä med zebraränder – handtag och ryggstöd, 1–3 år | FP-gunghast-tra-zebra | 569 kr | 579 kr | 180 |
| af4409b8 | Sängbord med låda och öppet fack – hylla på ryggskivan, naturfärgad trälook | FP-sangbord-lada-hylla-natur | 579 kr | 629 kr | 17 |
| 9e16bd7c | Basketställ för barn 5-i-1 – fiskformad platta, höjd 134–152 cm | FP-basketstall-barn-5-i-1 | 599 kr | 679 kr | 101 |
| a7bddc08 | Sadelpall på hjul i svart konstläder – sitthöjd 55–71 cm, bär 120 kg | FP-sadelpall-hjul-svart | 599 kr | 629 kr | 74 |

Vi är billigast på alla åtta, 10–80 kr under dealproffsen. **Inget pris är
rört** — prisgrinden stämde (`x1,2`, `charm99`) både i urvalets `las` och i
verifieringen efter stämpeln, och JSON-LD på de publicerade sidorna bär
samma åtta belopp.

Wix-siten verifierades FÖRST mot N35:s publicerade `8a076c08` ("Barstolar
2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm") — namn och
`visible: true` stämde.

## Urvalet — Leonards regel, billigast uppåt

Jämförelsen mot dealproffsen lästes ur N36:s redan körda
`dealproffsen.yml`-körning (`mode: jamfor`, `fran_pris: 0`) i stället för
att starta en egen. Den var fullständig: varv 2 slutade på `0 prefix kvar`
och loggen har inga `FEL <prefix>`-rader.

| | |
|---|---:|
| granskade | 4 950 |
| **vi billigare, totalt** | **3 767** |
| **varav opolerade** | **2 121** |
| listans topp 40 (opolerade, billigast uppåt) | 469–619 kr |
| …i N37:s halva (`8`–`f`) | **25** |
| kvar efter förfiltreringen | 14 (539–599 kr) |
| valda | 8 (539–599 kr) |

### Förfiltreringen av de 25

| skäl | antal | id |
|---|---:|---|
| rörd av main:s "Runda …"-serie (Runda 125/126) | 1 | `d16f677e` |
| exakt trippel mot en PUBLICERAD sida (miniugnen `3f6a99f7`) | 2 | `d9f30244`, `ff145fb1` |
| identisk tvilling som BILLIGARE utkast | 1 | `e88f5d9c` (mot `9dd510a8`, 499 kr) |
| färgsyskon till N36:s mopphink `3bfee58b` | 2 | `d60bb2f2`, `9ac669e4` |
| växthusfamiljen som main:s Runda 144–147 arbetar igenom | 2 | `99d105f8`, `b46705f9` |
| slutsåld i Wix (`OUT_OF_STOCK`) | 1 | `b6cdf76b` |
| husmärket TRYCKT på produkten, för få bilder kvar efter strykning | 2 | `fd85cf0b`, `b2175a65` |
| i `FLAGGADE.md` eller bortvald av en tidigare N-runda | 0 | — |

Dubblettskärmen svepte katalogen OFILTRERAT (60 sidor, 5 984 rader, `fields`
på varje sida, `utanText` 0) med trippelmönstrets självtest i samma anrop:
9 av 9 former. Publicerade 3 087 (2 455 med trippel), utkast 2 897.

Färgsyskon UTAN publicerad sida i familjen hölls isär från dubbletterna och
den billigaste kulören gick först: `a7bddc08` (svart, 599 kr) mot krämvita
`1a851435` (639 kr). `a9360e2a` (balansbom, billigast av fem kulörer) och
`c8e3c2d6` (bänkdyna, billigast av fyra) är reserver.

`las` (polish-mapping.yml, `ref: main`) kördes på de åtta och två reserver:
alla `supplier: aosom`, `needsAiPolish: true`, `pending_review`, prisgrind
`stämmer: true`, ingen `LÅST PRIS`, ingen `SLUTSALD`, fraktandel
0,382–0,497. Varje körning bevisad som min på `wixProductId` i loggen.

## Bilderna — granskade FÖRE texten, och de rättade källan två gånger

Kontaktark för 16 kandidater (de 14 som klarade förfiltreringen och de två
som föll på tryckta märken) byggdes innan en rad text skrevs.

- **`f1e0a996`**: bild 3 bär tysk text inbränd — struken (`bilder-bort.tsv`).
  Fyra bilder kvar.
- **`f1e0a996`**: källan säger "Pony-Design" — bilderna visar en häst med
  ZEBRARÄNDER. Texten beskriver det bilderna visar.
- **`ae2ac5e5`**: källan säger "Fischgrätmuster" två gånger — bilderna visar
  ett nät i ROMBMÖNSTER. Fiskbenet är inte med.
- **`e118ae32`**: källan skriver att spännband och karbinhakar INTE ingår;
  bild 1 visar två åttformade ringar. Texten säger uttryckligen vad som
  ingår och vad som måste köpas till.
- Inga husmärken eller tredjepartslogotyper på de åtta valda produkternas
  bilder. (De två som föll på tryckta märken står i förfiltreringen.)

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| `kallor.json` mot skarpa V3 (server-side h·31) | **8 av 8 LIKA**, inget artikelnummer att redigera |
| `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA** |
| `gate.py` | **0 fynd, 0 varningar** (efter 1 kvittens i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter — se `e118ae32` nedan |
| `gate-alt.py` | **REN**, 39 alt-texter |
| `gate-seo.py` | **0 fynd** (efter 2 rättningar) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 17 |
| `gate-sku.py` | **0 fynd** (längsta 31 av 40 tecken) |
| SKU-krock (59 `sku.tsv`, 463 SKU:er, inkl. N36) | **0** |
| Slug-krock (5 984 slugs + N36:s `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 13 kundvända filer | **0 fynd** |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **`bygg-axelfacit.py` avbryter på `e118ae32` — med rätta.** Gungans enda
totalmått är `Gesamtgröße: Ø110 cm`, en diameter utan axelbokstav, och
fallbacken vägrar också. Facit skrevs INTE för hand och det delade skriptet
ändrades inte mitt i en parallellrunda; i stället bevisades mekaniskt att
gungans text inte binder något tal till bred/djup/hög (tom lista). Texten
säger "110 cm i diameter" och "rep på 170 cm".

## Två granskningar före skrivningen

**Korrekturläsningen (steg 3):** elva ändringar i sju filer — kongruens
("rustikt brun" → "rustik brun"), syftning ("den", "det"), dubbla "med",
ojämförbara led och en sak som inte stämde med bilden (gnistskyddet står
FRAMFÖR eldstaden, inte runt den). Hela tabellen står i `framsteg.md`.

**Den oberoende, skeptiska granskningen (steg 5):** ett fynd.
`9e16bd7c` lovade "slitstark plast" — källan anger materialet men inget om
slitstyrka. Struket. De tre andra kvalitetsorden i rundan är belagda i
källan.

## Skrivningen, stämpeln och verifieringen

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr i samma anrop | **8 av 8**, ingen spärr utlöst |
| 2 media (fil-id + alt, måttbilden sist) | **8 av 8**, 39 bilder |
| 3 kategorier (bulk add-items) | **17 av 17 rader success**, `totalFailures: 0` |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **8 av 8** |
| 7 separat återläsning en stund senare | **8 av 8 helt verifierade** |
| 9 stämpel (`stampla`) | **8 av 8** `OK: <id> uppdaterad` |
| 9 stämpeln verifierad med en EGEN `las` per produkt | **8 av 8** `needsAiPolish: false`, `published`, rätt SKU, pris orört |

N36 körde åtta egna `las` i samma minut som N37:s stämpel — varje körning
bevisades därför som min på produktens id i loggen innan dess utfall lästes,
och N36:s körningar lästes bara så långt att de kunde uteslutas.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130` gav alla åtta `HTTP 200` med `age` 139–140 — den
rendering den varma träffen utlöste. `livegrind.py`: **8 av 8 REN, orddiff
0**, med homoglyf-, sid-, alt- och SEO-svep rena och alla tre flikarna
ordagranna. Ur samma sidor: JSON-LD `InStock` och oförändrat pris på alla
åtta, och en riktig kategori i brödsmulan.

Den andra korrekturläsningen gjordes på den PUBLICERADE texten — brödtexten
plockad mekaniskt ur de hämtade sidorna, 319 meningar och listrader — med
källan och kontaktarket bredvid. **Två fynd:**

- **`81a3065e`** (korrekturfel): "i en trappande grupp" är inte idiomatisk
  svenska → "i en grupp på olika höjd".
- **`f1e0a996`** (sakfel): "breda medar" i ingressen och i Egenskaper. Källan
  säger *verbreiterte Basis*, och bilderna visar vanliga medar i plywood —
  det är basen som är bred. → "medar" respektive "Bred bas som minskar
  risken att tippa".

Båda rättade i filerna, alla filgrindar omkörda (gröna), och BARA
`plainDescription` omskriven på de två produkterna med
`bygg-steg.py --rattelse` och kontrollsummorna i samma anrop: **2 av 2**.
En separat återläsning av alla åtta efteråt: **8 av 8 helt verifierade**.
En ny live-hämtning och `livegrind.py` mot de rättade filerna: **8 av 8 REN,
orddiff 0** — de gamla formuleringarna finns inte kvar på sidorna.

## `FLAGGADE.md` — nya rader

Inga befintliga rader rörda. Nya:

- **Interna dubblettkluster:** `e88f5d9c` (babylekmatta, 549 kr) mot det
  billigare identiska utkastet `9dd510a8` (499 kr); miniugnarna `d9f30244`
  och `ff145fb1` mot den PUBLICERADE `3f6a99f7` (699 kr) — med det svarta
  utkastet `ab47e35d` på 499 kr i samma kluster.
- **Bortvalda av andra skäl:** `fd85cf0b` och `b2175a65` (husmärke tryckt på
  varan), `d60bb2f2`/`9ac669e4` (färgsyskon till N36:s mopphink),
  `1a851435` (färgsyskon till nu publicerade `a7bddc08`), växthusen
  `99d105f8`/`b46705f9`, och sex reserver (`a9360e2a`, `c694dcaa`,
  `c8e3c2d6`, `d3655c3e`, `e514191b`, `f75a8a17`).

## Frågor till Leonard

1. **Husmärke tryckt på själva varan** (SPORTNOW på `fd85cf0b`:s boll,
   AIYAPLAY på `b2175a65`). Rundan valde bort dem; tidigare rundor har
   publicerat sådana och flaggat i efterhand. Vilken regel gäller?
2. **Miniugnen:** den publicerade `3f6a99f7` kostar 699 kr, och ett svart
   utkast med samma mått (`ab47e35d`) ligger på 499 kr. Är det samma vara
   står ett 200 kr billigare utkast bakom en publicerad sida.

Inga licensfigurer i rundan.

## Faktakort

Faktakorten är medvetet uppskjutna, som i N15–N35. Rundan räknas som klar
utom dem.

## Filer i katalogen

Skrivna för rundan: `bygg-kallor.py` (som bygger `kallor.json`), de åtta
`<id>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `alt.tsv`,
`bilder.tsv`, `bilder-bort.tsv`, `kategori.tsv`, `lager.tsv`, `variant.tsv`,
`ids.tsv`, `foto-tal.txt`, `framsteg.md`. Genererade av `polish-gates` ur
dem: `axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`,
`nyttolast-media.json`, `medieskrivning.json`, `media-hash.tsv`,
`steg1-bas.js`, `steg2.js`. Genererade av rundans `bygg-steg.py` (kopierad
från N35, bara rundnamn och docstring ändrade): `steg1.js` (gitignorad),
`steg3.js`, `steg4.js`, `steg5.js`. De hämtade live-sidorna (`live/`) är
gitignorerade, som i tidigare rundor.
