# Runda N37 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Arbetskatalog `/home/user/wt-n37`, lokal gren `n37-lokal` från `b84a305`.
  Körs PARALLELLT med Runda N36 (huvudkatalogen), uppdelat på wix-id:ts
  första tecken: N37 tar bara id som börjar på `8`–`9` eller `a`–`f`.
- Wix-siten verifierad FÖRST mot N35:s publicerade `8a076c08` ("Barstolar
  2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm"): namnet stämde,
  `visible: true`, revision 5.
- `origin/main` hämtad: senaste "Runda …"-commit är Runda 147 (tolv växthus).
  Mängden åttateckens-id som serien rör byggdes ur ALLA textfiler under
  `main`:s `tools/polish-assets/runda-<siffror>*`, filnamnen där och seriens
  commit-meddelanden — 1 806 unika id, en medveten övermängd.

## Urval — Leonards regel

Jämförelsen mot dealproffsen lästes ur N36:s redan körda
`dealproffsen.yml`-körning 35804614752 (`mode: jamfor`, `fran_pris: 0`,
`ref: claude/seo-polering-runbook-review-uq6fwl`) i stället för att starta en
egen. Fullständig: varv 2 slutade på `0 prefix kvar`, och loggen har inga
`FEL <prefix>`-rader.

| | |
|---|---:|
| granskade | 4 950 |
| vi billigare | **3 767** |
| varav opolerade | **2 121** |
| listans topp 40 (opolerade, billigast uppåt från 0 kr) | 469–619 kr |
| …i min halva (`8`–`f`) | **25** |

### Förfiltrering av de 25

| skäl | antal | id |
|---|---:|---|
| rörd av main:s "Runda …"-serie (Runda 125/126, Fußballtor) | 1 | `d16f677e` |
| exakt trippel mot en PUBLICERAD sida (`3f6a99f7` Miniugn 10 liter, "svart och silver", 699 kr) | 2 | `d9f30244` (cremevit), `ff145fb1` (silver) |
| identisk tvilling som BILLIGARE utkast (samma namn, trippel och "Mehrfarbig") | 1 | `e88f5d9c` (mot `9dd510a8`, 499 kr) |
| färgsyskon till N36:s mopphink `3bfee58b` (svart, billigast, publiceras i N36) | 2 | `d60bb2f2` (röd), `9ac669e4` (blå) |
| växthusfamiljen som main:s Runda 144–147 arbetar igenom (krockrisk) | 2 | `99d105f8`, `b46705f9` |
| slutsåld i Wix (`OUT_OF_STOCK`) | 1 | `b6cdf76b` |
| husmärke TRYCKT på produkten — för få bilder kvar efter strykning | 2 | `fd85cf0b` (SPORTNOW, alla fem), `b2175a65` (AIYAPLAY, fyra av fem + tysk text i den femte) |
| i FLAGGADE.md eller bortvald av tidigare N-runda | 0 | — |

Färgerna lästes ur källtexternas `Farbe:` i ett eget anrop. Den publicerade
miniugnen säger "svart och silver", så åtminstone det silverfärgade utkastet
är sannolikt samma vara; den cremevita kan vara en ny kulör. Alla tre hålls
tillbaka oavsett — samma familj som FARGSYSKONEN.md:s "färgsyskon till
publicerade sidor".

Kvar: 14 kandidater, 539–599 kr. Dubblettsvepet: ofiltrerat, 60 sidor,
5 984 rader, `utanText` 0, självtest 9 av 9 former (de sju husformerna +
`35,2Hcm` + `(L x B x H)`-suffix) i samma anrop. Publicerade 3 087 (2 455
med trippel), utkast 2 897 (alla med trippel).

Färgsyskon (inte dubbletter, ingen publicerad sida i familjen): `a9360e2a`
(blå, billigast av fem kulörer), `c8e3c2d6` (röd, billigast av fyra),
`a7bddc08` (svart, mot krämvita `1a851435` 639 kr).

### `las` (polish-mapping.yml, `ref: main`) — tio körningar, alla bevisat mina

| run | id | saldo | variant-id | SKU i dag | pris | frakt |
|---:|---|---:|---|---|---:|---:|
| 3776 | 81a3065e | 55 | `3f8ed257-bbd3-43b1-9c4e-b085ff877d03` | FP-pflanzgefa-e-fur-die | 539 | 0,446 |
| 3777 | ff10ccf5 | 144 | `cd1bf6df-ef70-47bb-8758-568777508f7b` | FP-beistelltisch-mit-3 | 539 | 0,497 |
| 3778 | e118ae32 | 69 | `ee454aa1-48df-4d35-85a1-3ac32e8f579f` | FP-nestschaukel-wetterfest | 559 | 0,409 |
| 3779 | ae2ac5e5 | 101 | `375bb01d-c8eb-466f-b82c-1e98e1055896` | FP-funkenschutz-fur-kamine | 569 | 0,4 |
| 3780 | f1e0a996 | 180 | `957b3e0c-073b-4d42-a5c5-fb51d47ff89e` | FP-schaukelpferd-kinder | 569 | 0,396 |
| 3781 | af4409b8 | 17 | `7dd20d84-7c43-4c0b-83f5-2d37e7f5ec9b` | FP-beistelltisch-nachttisch | 579 | 0,407 |
| 3782 | 9e16bd7c | 101 | `378ac23f-bdda-4260-863e-9e9016216e07` | FP-kinder-basketballkorb-5 | 599 | 0,467 |
| 3783 | a7bddc08 | 74 | `e09dedb0-2bbb-480a-a1a7-08d04f348f55` | FP-salonhocker-mit | 599 | 0,382 |
| 3784 | a9360e2a (reserv) | 70 | `534af958-db77-42db-8d2b-e4e58d606164` | FP-schwebebalken-2-4-m | 599 | 0,426 |
| 3785 | c694dcaa (reserv) | 8 | `02b45cb0-2567-4cf4-bc10-6d812a20f0a7` | FP-stehlampe-mit | 599 | 0,496 |

Alla tio: `supplier: aosom`, `needsAiPolish: true`, `draftStatus:
pending_review`, prisgrind `stämmer: true` (x1,2, charm99), ingen `LAST PRIS`,
ingen `SLUTSALD`. Varje logg lästes och bar exakt det id körningen startades
för.

## Slutgiltigt urval (8, 539–599 kr)

`81a3065e`, `ff10ccf5`, `e118ae32`, `ae2ac5e5`, `f1e0a996`, `af4409b8`,
`9e16bd7c`, `a7bddc08`. Lika pris (599) avgjordes i listans egen ordning.
Reserver: `a9360e2a`, `c694dcaa`.

N36:s `ids.tsv` lästes efter urvalet: åtta id, alla i N36:s halva (`0`–`7`),
inget överlapp. N36:s `slugs.txt` och `sku.tsv` krockar inte med rundans.

## Källor och bildlistor mot skarpa V3

`kallor.json` byggd i `bygg-kallor.py` (avskrift) och verifierad SERVER-SIDE
med h·31-summa och längd i ett anrop utan skrivning: **8 av 8 LIKA** på första
körningen. Ingen av de åtta källtexterna bär ett artikelnummer, alltså ingen
redigering. `bilder.tsv` (fil-id i ordning) verifierad på samma sätt: **8 av 8
LIKA**, fem bilder per produkt.

## Bilder — granskade FÖRE texten

Kontaktark för alla 16 kandidater byggdes med `polish-gates/bygg-ark.py` i
scratchpad (hämtad data, inte källmaterial) innan en rad text skrevs.

- **`f1e0a996`**: bild 3 bär tysk text ("Empfohlenes Alter: 18-36 Monate",
  "Gewichtsgrenze: 30 kg") — struken. Fyra bilder kvar.
- **`f1e0a996`**: källan säger "klassische Ponyform" och "Pony-Design" —
  bilderna visar en häst med ZEBRARÄNDER i svart och vitt. Texten beskriver
  det bilderna visar.
- **`ae2ac5e5`**: källan säger "Fischgrätmuster" (fiskbensmönster) två
  gånger — bilderna visar ett nät i ROMBMÖNSTER, inga fiskben. Texten säger
  rombmönster; fiskbenspåståendet är inte med.
- **`e118ae32`**: källan skriver "HINWEIS: Befestigungsgurte und Karabiner
  sind nicht enthalten". Bild 1 visar två åttformade ringar, inga
  karbinhakar. Texten säger uttryckligen att spännband och karbinhakar INTE
  ingår, och listar de ringar som gör det.
- **`81a3065e`**: "durchsichtige Abdeckung" stämmer med bilderna —
  krukdelen har en genomskinlig front i akryl, övre halvan av ringen är öppen.
- Inga husmärken eller tredjepartslogotyper på någon bild bland de åtta.
  (De två som föll på tryckta märken står i förfiltreringen ovan.)

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| Trippelmönstrets självtest i samma anrop som svepet | **9 av 9** (första svepet), **7 av 7** (omkörningen) |
| `kallor.json` mot skarpa V3 (server-side h·31) | **8 av 8 LIKA**, inget artikelnummer att redigera |
| `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA** |
| `gate.py` | **0 fynd, 0 varningar** (efter 1 kvittens i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter — se `e118ae32` nedan |
| `gate-alt.py` | **REN**, 8 produkter, 39 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader (efter 2 rättningar) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 17 |
| `gate-sku.py` | **0 fynd** (längsta 31 av 40 tecken) |
| SKU-krock mot alla tidigare rundors `sku.tsv` inkl. N36 (59 filer, 463 SKU:er) | **0 krockar, 0 prefixöverlapp** |
| Slug-krock mot hela katalogen (5 984 unika slugs) och N36:s `slugs.txt` | **0 krockar** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd**, inga korslänkar |
| Läck- och teckensvep över 13 kundvända filer | **0 fynd** |
| `npx vitest run lib/polish` | **99 av 99 gröna** |

⚠️ **`bygg-axelfacit.py` avbryter på `e118ae32` — med rätta.** Gungans enda
totalmått är `Gesamtgröße: Ø110 cm`: en diameter utan axelbokstav, och den
svenska spec-raden (`Ø110 x 170H cm`) bär ett ANNAT tal (repet), så
fallbacken vägrar också. Filen skrivs ändå före avbrottet, och de sju andra
har fullt facit. Att skriva ett facit för hand är förbjudet (#225), och att
ändra det delade skriptet mitt i en parallellrunda är fel ställe. I stället
bevisades mekaniskt att gungans text inte binder NÅGOT tal till
bred/djup/hög (regex över texten: tom lista) — texten säger "110 cm i
diameter" och "rep på 170 cm".

### Rättningar under bygget

1. **`ae2ac5e5`**: "de två sidopanelerna" gav en ordtalsvarning — källan
   har "Drei Paneele" men ingen tvåa. Kvitterat i `foto-tal.txt` (en välvd
   mittpanel och två sidopaneler, räknade på bild 1 och måttbild 3).
2. **`81a3065e`** och **`9e16bd7c`**: SEO-titlarnas "3-pack" och "5-i-1"
   fanns inte som siffror i den egna brödtexten, som `gate-seo.py` grindar
   mot. Källan täcker båda (`3er-Set`, `5-in-1`), så siffrorna skrevs in i
   texten ("Säljs som 3-pack", "Ett basketställ 5-i-1 …").

## Steg 3 — korrekturläsning av den egna svenskan (före grind-pushen)

Alla åtta texterna lästes med taggarna strippade, mening för mening, med
genus, kongruens, syftning och inre motsägelser som enda fråga. **Elva
ändringar i sju filer**, ingen fälld av någon grind:

| id | stod | blev | varför |
|---|---|---|---|
| ff10ccf5 | i **rustikt** brun trälook (3 ställen) | i **rustik** brun trälook | adjektiv till "trälook", inte adverb |
| ff10ccf5 | … melaminyta i rustikt brun trälook, **som är slät** och lätt att torka av | … med en **slät** melaminyta … som är lätt att torka av | "som" syftade tvetydigt |
| e118ae32 | med en diameter på 110 cm, **med** gott om plats | , 110 cm i diameter, med gott om plats | dubbelt "med" |
| e118ae32 | gör den lika mycket **till en plats** … **som att gunga** | är den lika mycket en plats … som en gunga | ojämförbara led |
| ae2ac5e5 | står stadigt **runt** eldstaden | står stadigt **framför** eldstaden | skyddet står framför, inte runt |
| ae2ac5e5 | viks **det** ihop | viks **skyddet** ihop | "det" efter "De tre panelerna" |
| f1e0a996 | Torka av **ytan** … låt **den** inte stå i väta | Torka av **gunghästen** … | "den" syftade på ytan |
| af4409b8 | Ett sängbord i spånskiva **med** melaminyta … **med** en låda … **med** en liten hylla | … i naturfärgad trälook med en låda … och en hög ryggskiva som bär en liten hylla | tre "med" i rad; materialet flyttat till eget stycke |
| af4409b8 | Bordet … Bordet … Bordet bär 28 kg | … Det bär 28 kg | upprepning |
| a7bddc08 | innan **den** används | innan **pallen** används | otydlig syftning |
| 81a3065e | inget att skruva ihop – **bara att** sätta upp dem | – **det är bara att** sätta upp dem | ofullständig sats |

Alla grindar omkörda efter rättningarna — oförändrat gröna.

Pushat som `901e441` ("källor, svenska texter och grindar — före
skrivningen"), ovanpå N36:s `6d83236`.

## Steg 5 — oberoende, skeptisk granskning FÖRE skrivningen

Alla åtta lästa en gång till som en utomstående granskare, med kontaktarket
och källtexten bredvid: varje påstående om konstruktion, antal delar och vad
som ingår prövat mot bilderna, varje tal mot källan, och varje adjektiv som
lovar något om kvalitet prövat mot om källan säger det.

**Ett fynd:** `9e16bd7c` sa "gjort av **slitstark** plast (HDPE och PP)".
Källan anger materialet men lovar ingenting om slitstyrka — adjektivet var
mitt. Struket. De tre andra kvalitetsorden i rundan är belagda:
`af4409b8` "slitstark melaminyta" (*für Langlebigkeit*), `e118ae32`
"slitstark Oxfordväv" (*strapazierfähigem 600D*), `ff10ccf5` "slät
melaminyta" (*glatte … Oberfläche*).

Inga motsägande tal (gnistskyddets 50 + 2 × 23 = 96 cm går ihop; sidobordets
26 + 21 cm ryms under 62,5 cm), inga tyska eller engelska rester utöver
etablerade lånord (trälook, PU, MDF, HDPE), inget namn eller SEO-fält över
taket. Grindarna och `npx vitest run lib/polish` (99/99) omkörda efter
rättningen — gröna. Pushat som `53b0687`.

## Steg 6 — Wix-skrivningen

N36:s `ids.tsv`, `slugs.txt` och `sku.tsv` lästes en gång till omedelbart
före steg 1: inget överlapp i id, slug eller SKU.

| steg | vad | resultat |
|---|---|---|
| 1 | namn/slug/plainDescription/visible/seoData, spärr över text OCH namn/slug/SEO i samma anrop | **8 av 8 skrivna**, ingen spärr utlöst |
| 2 | media (fil-id + alt-text, måttbilden sist), spärr över id+alt i samma anrop | **8 av 8 skrivna**, 39 bilder |
| 3 | kategorier, bulk add-items, id uppslagna färskt på namn (54 kategorier) | **17 av 17 rader success**, `totalFailures: 0` i alla sju bulkanrop |
| 4 | variant-SKU sist och ensam, round-trip ur färsk GET med `options` och `visible` | **8 av 8 skrivna** |

N36:s `sku.tsv` lästes en gång till omedelbart före steg 4: ingen krock.

Steg 4:s svar bekräftade `visible: true` på både produkt OCH variant för alla
åtta före skrivningen, oförändrade priser (539, 539, 559, 569, 569, 579, 599,
599 kr — samma som i urvalet) och att de gamla tyska SKU:erna verkligen
byttes (t.ex. `FP-pflanzgefa-e-fur-die` → `FP-vaggkrukor-3-pack-svart`,
`FP-salonhocker-mit` → `FP-sadelpall-hjul-svart`). Variant-id:na i svaret är
exakt de i `variant.tsv`.

### Steg 7 — separat återläsning, en stund efter steg 4

En egen `GET` per produkt med
`?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES`,
jämförd mot facit räknat ur filerna (`vantat-hash.tsv`, `media-hash.tsv`,
`namn.tsv`, `slugs.txt`, `seo.tsv`, `kategori.tsv`, `sku.tsv`):

| kontroll | utfall |
|---|---|
| brödtext (wixnorm + FNV-1a mot `vantat-hash.tsv`) | **8 av 8 LIKA** |
| namn, slug | 8 av 8 |
| `visible: true` på produkt OCH variant | 8 av 8 |
| SEO: två taggar (title + description), tomma keywords | 8 av 8 |
| bilder: id och alt-text i ordning, måttbilden sist | 8 av 8 (39 bilder) |
| kategorier: avsedda + `All Products` (antalet = avsedda + 1) | 8 av 8 |
| variant-SKU och variant-id | 8 av 8 |
| `IN_STOCK`, priset orört | 8 av 8 (539, 539, 559, 569, 569, 579, 599, 599 kr) |

Revisioner efter steg 4: `81a3065e` 6, `ff10ccf5` 6, `e118ae32` 4,
`ae2ac5e5` 4, `f1e0a996` 4, `af4409b8` 4, `9e16bd7c` 7, `a7bddc08` 4.

### Steg 9 — stämpeln (polish-mapping.yml, `stampla`, `ref: main`)

Åtta körningar startades 01:47–01:48 UTC. N36 körde åtta egna `las` i samma
fönster (3798, 3800, 3801, 3803, 3805, 3807, 3808, 3809) — de lästes bara så
långt att de kunde uteslutas, och inget utfall ur dem används här. Mina, var
och en bevisad på `OK: <id> uppdaterad`-raden i loggen:

| körning | produkt | loggraden |
|---|---|---|
| 3794 | `81a3065e` | `OK: 81a3065e-… uppdaterad — needsAiPolish, draftStatus, variantSkus` |
| 3795 | `ff10ccf5` | `OK: ff10ccf5-… uppdaterad — …` |
| 3796 | `e118ae32` | `OK: e118ae32-… uppdaterad — …` |
| 3797 | `ae2ac5e5` | `OK: ae2ac5e5-… uppdaterad — …` |
| 3799 | `f1e0a996` | `OK: f1e0a996-… uppdaterad — …` |
| 3802 | `af4409b8` | `OK: af4409b8-… uppdaterad — …` |
| 3804 | `9e16bd7c` | `OK: 9e16bd7c-… uppdaterad — …` |
| 3806 | `a7bddc08` | `OK: a7bddc08-… uppdaterad — …` |

Patchen i varje logg bär rätt variant-id och rätt SKU ur `sku.tsv`.

**Varje stämpel verifierad med en EGEN `las`-körning** (3810–3817, startade
01:52:46–01:52:56; ingen främmande körning i det intervallet), var och en
bevisad på `wixProductId` i mappningsraden:

| körning | produkt | needsAiPolish | draftStatus | SKU på raden | pris | prisgrind | saldo |
|---|---|---|---|---|--:|---|--:|
| 3810 | `81a3065e` | false | published | `FP-vaggkrukor-3-pack-svart` | 539 | stämmer | 55 |
| 3811 | `ff10ccf5` | false | published | `FP-sidobord-smalt-tre-plan` | 539 | stämmer | 144 |
| 3812 | `e118ae32` | false | published | `FP-fagelbogunga-110-bla` | 559 | stämmer | 69 |
| 3813 | `ae2ac5e5` | false | published | `FP-gnistskydd-96-cm-tre-paneler` | 569 | stämmer | 101 |
| 3814 | `f1e0a996` | false | published | `FP-gunghast-tra-zebra` | 569 | stämmer | 180 |
| 3815 | `af4409b8` | false | published | `FP-sangbord-lada-hylla-natur` | 579 | stämmer | 17 |
| 3816 | `9e16bd7c` | false | published | `FP-basketstall-barn-5-i-1` | 599 | stämmer | 101 |
| 3817 | `a7bddc08` | false | published | `FP-sadelpall-hjul-svart` | 599 | stämmer | 74 |

Ingen `LÅST PRIS`, ingen `SLUTSALD`. Variant-id på raden = `variant.tsv` på
alla åtta. Priserna är desamma som före rundan — inget pris är rört.

(fortsätter)
