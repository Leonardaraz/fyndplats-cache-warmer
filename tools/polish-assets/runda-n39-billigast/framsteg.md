# Runda N39 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Arbetskatalog `/home/user/wt-n37`, lokal gren `n37-lokal` från `a1703ea`
  (N37 klar). Körs PARALLELLT med Runda N38 (huvudkatalogen), uppdelat på
  wix-id:ts första tecken: N39 tar bara id som börjar på `8`–`9` eller
  `a`–`f`.
- Wix-siten verifierad FÖRST mot N37:s publicerade `81a3065e` ("Väggkrukor
  3-pack i svart stål – runda, akrylfront, Ø30,5, Ø20,5 och Ø15,5 cm"):
  namnet stämde, `visible: true`, revision 7.
- `origin/main` hämtad: senaste "Runda …"-commit är fortfarande Runda 147
  (tolv växthus). Mängden id som serien rör byggdes ur ALLA filer under
  `main`:s `tools/polish-assets/runda-<siffror>*` och seriens
  commit-meddelanden — en medveten övermängd; en träff där läses i sitt
  sammanhang innan den räknas som "rörd".

## Urval — Leonards regel, reserverna först

Ingen körning av `dealproffsen.yml` med `fran_pris` ≤ 599 och full lista
fanns från de senaste två timmarna (den senaste, 35805159807, gick från
619 kr och visade alltså inte reserverna). Rundan startade därför en egen:
körning **35809913730** (`mode: jamfor`, `fran_pris: 599`, `varv: 13`,
`ref: claude/seo-polering-runbook-review-uq6fwl`). Fullständig: varv 2
slutade på `0 prefix kvar`, och loggen har inga `FEL <prefix>`-rader.

| | |
|---|---:|
| granskade | 4 950 |
| vi billigare | **3 767** |
| varav opolerade | **2 105** (N37 hade 2 121; N36:s och N37:s sexton publicerade är borta) |
| listans topp 40 (opolerade, billigast uppåt från 599 kr) | 599–639 kr |
| …i min halva (`8`–`f`) | **24** (599–629 kr) |

Alla sex reserver från N37 står kvar i listan — alltså fortfarande
billigare än dealproffsen och fortfarande opolerade.

### Förfiltrering av de 24

| skäl | antal | id |
|---|---:|---|
| i `FLAGGADE.md` utanför reservraden (miniugnsklustret, växthusen, balansbomssyskonen i N36:s klusterrad) | 5 | `ff145fb1`, `b46705f9`, `8d3d1de1`, `8f351be4`, `a17cf506` |
| rörd av main:s "Runda …"-serie (Runda 125/126, som N37 redan noterade) | 1 | `d16f677e` |
| bortvald av N37 som slutsåld — omprövad: fortfarande `OUT_OF_STOCK` | 1 | `b6cdf76b` |
| fel säsong: utomhusdynor för trädgårdsbänk (samma skäl som N2 och N36) | 3 | `c8e3c2d6` (reserv), `91b18246`, `c519b4fe` |
| fel säsong: trädgårdsbord och trampolintillbehör för utomhusbruk | 2 | `ffc26041`, `e375834f` |
| husmärket TRYCKT på en medföljande del (bärväskan) | 1 | `8ad49cfe` |

Kvar: 11 kandidater, 599–629 kr, varav fem reserver.

`e375834f` (trampolinkant, flerfärgad, 629 kr) har dessutom ett färgsyskon
till samma pris i N38:s halva (`05a110dc`, rosa, 629 kr) och en identisk,
dyrare tvilling (`14ff500d`, 719 kr, slutsåld) — med oavgjort pris mellan
halvorna ger regeln "billigaste tvillingen poleras" inget entydigt svar, och
säsongen avgjorde ändå.

### Dubblettskärmen

Svepet gick OFILTRERAT: 60 sidor, 5 984 rader, `fields` på varje sida,
`utanText` 0, självtest av trippelmönstret **9 av 9 former** (husets sju +
`35,2Hcm` + `(L x B x H)`-suffix) i samma anrop. Publicerade 3 103 (2 480
med trippel), utkast 2 881 (alla med trippel). Färgen lästes ur källans
`Farbe:` i samma svep.

| id | träffar | bedömning |
|---|---|---|
| `a9360e2a` balansbom | 4 syskon (violett+rosa 619, ljusröd 619, rosa 619, flerfärgad 629), alla utkast | färgsyskon, ingen publicerad sida — **billigast, poleras** |
| `c694dcaa` golvlampa | 0 (bara pakettrippel) | ren |
| `d3655c3e` tvättställ | en publicerad kompostkvarn 44 × 34 × 96 | falsklarm, annan vara |
| `e514191b` skohylla | badrumsskåp, barnhyllor, förvaringsskåp ~60 × 30 × 90 | falsklarm, andra varor |
| `f75a8a17` hörnblomställ | katthus och snurrfåtöljer (permutation), ett badrumsskåp (paket) | falsklarm |
| `ba454107` pall | stolar, pallar och bord kring 42 × 42 × 44 — ingen med samma namn | falsklarm; ingen pall i samma tyg |
| `f4bdb64c` pilatesbräda | pianopallar, träningsbänk, paviljongtak kring 50 × 30 × 5 | falsklarm |
| `95b6f5bd` tvättsorterare | 0 | ren |
| `a6657b3d` fikus (reserv) | två konstväxter med samma PAKETmått (olivträd, 95 cm-träd) | andra växter |
| `bd61c238` viktväst (reserv) | ett spegelskåp (permutation) | falsklarm |
| `eb029d50` pedalhink | 0 | ren |

### `las` (polish-mapping.yml, `ref: main`) — tio körningar, alla bevisat mina

Startade 02:31:24–02:31:41 UTC; körningarna 3829–3838 var de enda i
fönstret, och varje logg bar exakt det `PRODUCT_ID` och `wixProductId`
körningen startades för.

| run | id | saldo | variant-id | SKU i dag | pris | frakt |
|---:|---|---:|---|---|---:|---:|
| 3829 | a9360e2a | 70 | `534af958-db77-42db-8d2b-e4e58d606164` | FP-schwebebalken-2-4-m | 599 | 0,426 |
| 3830 | c694dcaa | 8 | `02b45cb0-2567-4cf4-bc10-6d812a20f0a7` | FP-stehlampe-mit | 599 | 0,496 |
| 3831 | d3655c3e | 44 | `9de5f69d-2b41-4b49-bd52-636f7f8cf6ba` | FP-bambus-wascheregal-mit-2 | 599 | 0,493 |
| 3832 | e514191b | 62 | `d946ba7f-1573-4294-9f79-87a9b0a40160` | FP-kleines-schuhregal | 599 | 0,387 |
| 3833 | f75a8a17 | 104 | `5558ee7e-0d77-4ce2-a3e7-0c03708a4e80` | FP-eckpflanzenstander | 599 | 0,493 |
| 3834 | ba454107 | 153 | `5bb76445-c4a7-449b-8c8e-2be33a60077c` | FP-hocker-fu-stutze | 619 | 0,466 |
| 3835 | f4bdb64c | 186 | `b7250801-e6aa-45a3-986a-ee0488c62894` | FP-4-in-1-pilates-board-set | 619 | 0,43 |
| 3836 | 95b6f5bd | 36 | `4ab6ea77-2d70-4a26-ac1e-fb06a8768bfd` | FP-waschekorb-mit | 629 | 0,474 |
| 3837 | a6657b3d (reserv) | 32 | `6caf56e8-f327-475b-bac9-5c11f3e9fd6a` | FP-ficusbaum-kunstpflanze | 629 | 0,368 |
| 3838 | bd61c238 (reserv) | 114 | `9a28ebd5-8a3b-47cb-8f87-06af093145df` | FP-gewichtsweste-10-kg | 629 | 0,467 |

Alla tio: `supplier: aosom`, `needsAiPolish: true`, `draftStatus:
pending_review`, prisgrind `stämmer: true` (x1,2, charm99), ingen `LÅST
PRIS`, ingen `SLUTSALD`, ingen `prisgrupp`. Saldot över `LAGER_BUFFERT` (3)
på alla; lägst är golvlampan med 8.

## Slutgiltigt urval (8, 599–629 kr)

`a9360e2a`, `c694dcaa`, `d3655c3e`, `e514191b`, `f75a8a17` (de fem
reserverna som klarade skärmningen, 599 kr), `ba454107`, `f4bdb64c`
(619 kr) och `95b6f5bd` (629 kr — först i listans egen ordning bland fyra
på 629 kr). Reserver: `a6657b3d`, `bd61c238`.

**De sex reservernas öden:** fem publiceras; `c8e3c2d6` (bänkdyna) föll på
säsongen — en dyna för trädgårdsbänk i slutet av september, samma skäl som
N2 och N36 avvisade utomhusdynor — och dessutom bär bild 2 och 3 tysk text,
så bara tre bilder hade funnits kvar.

N38:s `ids.tsv` lästes efter urvalet: åtta id, alla i N38:s halva
(`0`–`7`), inget överlapp. N38 noterar två egna färgsyskon i min halva
(`c4df49ca`, `f39923d1`) — ingen av dem står i min lista, och rundan rör
dem inte.

## Källor och bildlistor mot skarpa V3

`kallor.json` byggd i `bygg-kallor.py` (avskrift) och verifierad SERVER-SIDE
med h·31-summa och längd i ett anrop utan skrivning: **8 av 8 LIKA** på första
körningen. Artikelnummermönstret (gatelib `ARTNR`) räknades i samma anrop:
**0 träffar** i alla åtta källtexter, alltså ingen redigering. `bilder.tsv`
(fil-id i ordning) verifierad på samma sätt: **8 av 8 LIKA**, fem bilder per
produkt.

## Bilder — granskade FÖRE texten

Kontaktark för alla 13 som prövades (de sex reserverna och sju kandidater på
619–629 kr) byggdes med `polish-gates/bygg-ark.py` i scratchpad (hämtad
data, inte källmaterial) innan en rad text skrevs.

- **`c694dcaa`**: bild 4 och 5 är närbilder på sockeln med en glödlampa som
  bär ett lampmärke och en energimärkningslogotyp — ett TREDJEPARTSMÄRKE, och
  lampan ingår inte ens. Strukna (`bilder-bort.tsv`). Tre bilder kvar: vit
  bakgrund, miljö och måttbild.
- **`c694dcaa`**: källans spec-rad säger färgen "Blau, Orange, Gelb", men
  källans egen tekniska data säger "Schwarz, Weiß" — och det är vad bilderna
  visar. Texten säger svart och vit.
- **`d3655c3e`**: bild 4 bär tysk text inbränd ("ERHÖHTE BASIS …") —
  struken. Fyra bilder kvar.
- **`f4bdb64c`**: källan säger "Hellblau"; brädan på alla fem bilderna är
  lavendelfärgad. Färgen skrivs som lavendelblå. Källan är dessutom oense med
  sig själv om antalet övningar ("4-in-1" i namnet, "4 Trainingsmodi" i
  ingressen, "5-in-1 Formen" i listan) — texten räknar inte, den räknar upp
  de fem övningar källan namnger.
- **`e514191b`**: källans namn säger "Pflanzentreppe" (växttrappa) — bilderna
  visar en rak hylla med fyra lika djupa plan. Texten beskriver en hylla.
- **`ba454107`**: källan säger "Kaschmir-Optik"; bilderna visar ett tyg med
  lockig, noppig yta. Texten beskriver det bilderna visar och påstår ingen
  kashmir.
- **`f75a8a17`**: måttbilden visar hur hyllorna hänger ihop — tre koncentriska
  kvartscirklar med korda 85, 56 och 28 cm och bandbredd 20 cm, på 20, 40 och
  60 cm höjd. Texten säger "från ände till ände", inte "längs framkanten",
  eftersom framkanten är böjd.
- **`8ad49cfe`** (bortvald): husmärket tryckt på den medföljande bärväskan i
  bild 1; måttbilden visar dessutom de fyra bågarna i en konstellation som
  källtexten inte förklarar.
- Inga andra husmärken eller tredjepartslogotyper på de åtta valda.

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| Trippelmönstrets självtest i samma anrop som svepet | **9 av 9** |
| `kallor.json` mot skarpa V3 (server-side h·31) | **8 av 8 LIKA**, 0 artikelnummer |
| `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA** |
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter, alla åtta med måttrad |
| `gate-alt.py` | **REN**, 37 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` | **0 fynd**, lägsta saldo 8 |
| `gate-sku.py` | **0 fynd** (längsta 36 av 40 tecken) |
| SKU-krock mot alla tidigare rundors `sku.tsv` inkl. N38 (61 filer, 479 SKU:er) | **0 krockar, 0 prefixöverlapp** |
| Slug-krock mot hela katalogen (5 984 slugs) och N38:s `slugs.txt` | **0 krockar** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd**, inga korslänkar |
| Läck- och teckensvep över 13 kundvända filer | **0 fynd** |
| `npx vitest run lib/polish` | **99 av 99 gröna** |

⚠️ **Balansbommens bredd skrivs "har en bredd på 10 cm", inte "10 cm bred".**
Källans måttrad är `236L x 10/15B x 6,5H`, och axelfacit läser position 2
(10/15) som djup. För en bom är det ovansidans och undersidans BREDD, och
texten säger det — men i en form som axelgrinden inte binder till bredd.
Grinden ändrades inte mitt i en parallellrunda.

## Steg 3 — korrekturläsning av den egna svenskan (före grind-pushen)

Alla åtta texter lästa med taggarna strippade, mening för mening, med genus,
kongruens, syftning, idiom och inre motsägelser som fråga. **Sexton
ändringar i sju filer** (tolv rader nedan), ingen fälld av någon grind:

| id | stod | blev | varför |
|---|---|---|---|
| a9360e2a | gjord för **precis träning** | gjord för **träning som kräver precision** | "precis träning" är inte idiomatiskt |
| a9360e2a | oxfordpolyester (2 ställen) | oxfordväv av polyester | husets ord, som i N37 |
| d3655c3e | Ett **smalt** tvättställ | Ett tvättställ | "smalt" saknar stöd i källan |
| e514191b | fungerar **lika bra i hallen som i badrummet eller** bland krukväxterna | fungerar i hallen, i badrummet och bland krukväxterna | haltande jämförelse |
| f75a8a17 | hyllplanen … **trappar ner** från hörnet | … **bildar en trappa** ner från hörnet | "trappa" som verb är inte idiomatiskt (samma fälla som N37:s "trappande") |
| f75a8a17 | 85, 56 och 28 cm **längs framkanten** | … **från ände till ände** | framkanten är böjd; måttet är kordan |
| f75a8a17 | **90° vinkeln** gör att (3 ställen) | tack vare **vinkeln på 90°** / Vinkel på 90° / med en vinkel på 90° | särskrivning |
| ba454107 | som en **liten pall** i ett hörn | som en **inredningsdetalj** i ett hörn | "pallen fungerar som en pall" |
| ba454107 | som gör pallen **ombonad att sitta på** | som ger pallen ett **ombonat uttryck** | haltande konstruktion |
| f4bdb64c | knäböj **med stöd av stången och gummibanden** | knäböj **med stöd** | källan säger inte vad stödet är |
| f4bdb64c | halkfria dynor **under** | halkfria dynor **på undersidan** | tydligare |
| alt a9360e2a/95b6f5bd | i ett vardagsrum / i ett tvättrum | i ett ljust rum | bilderna visar inte vilket rum det är |

Alla grindar omkörda efter rättningarna — oförändrat gröna.

Pushat som `6e8ccdf` ("källor, svenska texter och grindar — före
skrivningen"), rebasat ovanpå N38:s `2fc16e0`.

## Steg 5 — oberoende, skeptisk granskning FÖRE skrivningen

Alla åtta lästa en gång till som en utomstående granskare, med kontaktarket
och källtexten bredvid: varje påstående om konstruktion, antal delar och vad
som ingår prövat mot bilderna, varje tal mot källan, varje ord prövat mot hur
en svensk kund läser det.

**Ett fynd, och det var ett ordval med fel betydelse:** `d3655c3e` hette
"tvättställ" — men på svenska är ett tvättställ ett HANDFAT. Varan är en
hylla för tvätt. Ordet stod i namnet, SEO-titeln och metabeskrivningen, fyra
alt-texter, brödtexten, slugen och SKU:n. Allt bytt till **tvätthylla**
(`tvatthylla-bambu-tva-tygkorgar`, `FP-tvatthylla-bambu-tva-korgar`), och
"ställningen" i texten till "hyllan" med "per hylla" → "per hyllplan" så att
hyllan och hyllplanen inte blandas ihop. Ordet söktes i ALLA rundans filer
efter bytet: inga förekomster kvar. Dessutom en stilrättelse i samma fil:
"när de ska göras rena" → "när de ska rengöras".

Allt annat prövat och behållet: balansbommens "samma bredd som en
tävlingsbom" (*10 cm Wettkampfbreite*), golvlampans svart och vit (källans
egen tekniska data och bilderna, mot spec-radens felaktiga "Blau, Orange,
Gelb"), pilatesbrädans "handtagen vid plattorna, 22 cm isär" (*Abstand
zwischen den Griffen* — armhävningshandtagen har egna mått, 16 × 6 cm, och
sitter i hål, så ett fast avstånd hör till handtagen på glidplattorna) och
tvättsorterarens mått, som följer måttbilden (påsen 27 × 32 × 44, varje fack
29 × 31 × 16,5).

Efter bytet: alla filgrindar omkörda (gröna), slug-krock mot hela katalogen
omkörd (5 984 slugs, 0 krockar) och mot N38:s `slugs.txt` (0), SKU-krock
omkörd (0), läck- och teckensvep 0, `raa-hash.tsv`, `vantat-hash.tsv`,
`media-hash.tsv` och alla stegfiler ombyggda ur filerna.

Pushat som `f9af64a`, rebasat ovanpå N38:s `965f1ee`.

## Steg 6 — Wix-skrivningen

N38:s `ids.tsv`, `slugs.txt` och `sku.tsv` lästes en gång till omedelbart
före steg 1 (02:54 UTC): åtta id, åtta slugs, åtta SKU:er, inget överlapp.

| steg | vad | resultat |
|---|---|---|
| 1 | namn/slug/plainDescription/visible/seoData, spärr över text OCH namn/slug/SEO i samma anrop | **8 av 8 skrivna**, ingen spärr utlöst |
| 2 | media (fil-id + alt-text, måttbilden sist, strukna bilder borta), spärr över id+alt i samma anrop | **8 av 8 skrivna**, 37 bilder |
| 3 | kategorier, bulk add-items, id uppslagna färskt på namn (54 kategorier) | **19 av 19 rader success**, `totalFailures: 0` i alla nio bulkanrop |
| 4 | variant-SKU sist och ensam, round-trip ur färsk GET med `options` och `visible` | **8 av 8 skrivna** |

N38:s `sku.tsv` lästes en gång till omedelbart före steg 4: ingen krock.

Steg 4:s svar bekräftade `visible: true` på både produkt OCH variant för alla
åtta före skrivningen, oförändrade priser (599, 599, 599, 599, 599, 619, 619,
629 kr — samma som i urvalet) och att de gamla tyska SKU:erna verkligen
byttes (t.ex. `FP-schwebebalken-2-4-m` → `FP-balansbom-236-bla`,
`FP-4-in-1-pilates-board-set` → `FP-pilatesbrada-hopfallbar`).
Variant-id:na i svaret är exakt de i `variant.tsv`.

### Steg 7 — separat återläsning, en stund efter steg 4

En egen `GET` per produkt med
`?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO&fields=VARIANT_OPTION_CHOICE_NAMES`
(`steg5.js`, byggt ur filerna), i ett eget anrop efter steg 4 (02:57:45 →
02:58:39 UTC), jämförd mot facit räknat ur filerna (`vantat-hash.tsv`,
`media-hash.tsv`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `kategori.tsv`,
`sku.tsv`, `variant.tsv`):

| kontroll | utfall |
|---|---|
| brödtext (wixnorm + FNV-1a mot `vantat-hash.tsv`) | **8 av 8 LIKA** |
| namn, slug | 8 av 8 |
| `visible: true` på produkt OCH variant | 8 av 8 |
| SEO: två taggar (title + description), tomma keywords | 8 av 8 |
| bilder: id och alt-text i ordning, måttbilden sist | 8 av 8 (37 bilder: 5, 3, 4, 5, 5, 5, 5, 5) |
| kategorier: avsedda + `All Products` (antalet = avsedda + 1) | 8 av 8 |
| variant-SKU och variant-id | 8 av 8 |
| `IN_STOCK`, priset orört | 8 av 8 (599, 599, 599, 599, 599, 619, 619, 629 kr) |

Revisioner efter steg 4: `a9360e2a` 5, `c694dcaa` 5, `d3655c3e` 5,
`e514191b` 4, `f75a8a17` 6, `ba454107` 7, `f4bdb64c` 7, `95b6f5bd` 5 —
exakt steg 4:s `revisionEfter`, alltså ingen annan skrivning emellan.

### Steg 8 — `las` före stämpeln

Urvalets `las` gick 02:31, stämpeln 02:58–02:59 — under en timme, så ingen
ny `las` krävdes före stämpeln. Saldot och prisgrinden lästes ändå på nytt i
verifieringskörningarna nedan.

### Steg 9 — stämpeln (polish-mapping.yml, `stampla`, `ref: main`)

Åtta körningar startades 02:58:52–02:59:10 UTC; 3855–3862 var de enda i
fönstret. Mina, var och en bevisad på `PRODUCT_ID` och `OK: <id>`-raden i
loggen:

| körning | produkt | loggraden |
|---|---|---|
| 3855 | `a9360e2a` | `OK: a9360e2a-… uppdaterad — needsAiPolish, draftStatus, variantSkus` |
| 3856 | `c694dcaa` | `OK: c694dcaa-… uppdaterad — …` |
| 3857 | `d3655c3e` | `OK: d3655c3e-… uppdaterad — …` |
| 3858 | `e514191b` | `OK: e514191b-… uppdaterad — …` |
| 3859 | `f75a8a17` | `OK: f75a8a17-… uppdaterad — …` |
| 3860 | `ba454107` | `OK: ba454107-… uppdaterad — …` |
| 3861 | `f4bdb64c` | `OK: f4bdb64c-… uppdaterad — …` |
| 3862 | `95b6f5bd` | `OK: 95b6f5bd-… uppdaterad — …` |

Indata i varje logg: `NEEDS_POLISH: false`, `DRAFT_STATUS: published` och
`VARIANT_SKUS` med rätt variant-id ur `variant.tsv` och rätt SKU ur `sku.tsv`.

**Varje stämpel verifierad med en EGEN `las`-körning** (3863–3866 startade
02:59:50–02:59:55, 3867–3870 startade 03:02:06–03:02:10; inga främmande
körningar i de intervallen), var och en bevisad på `PRODUCT_ID` och
`wixProductId` i mappningsraden:

| körning | produkt | needsAiPolish | draftStatus | SKU på raden | pris | prisgrind | saldo |
|---|---|---|---|---|--:|---|--:|
| 3863 | `a9360e2a` | false | published | `FP-balansbom-236-bla` | 599 | stämmer | 70 |
| 3864 | `c694dcaa` | false | published | `FP-golvlampa-trebensstativ-vit-skarm` | 599 | stämmer | 8 |
| 3865 | `d3655c3e` | false | published | `FP-tvatthylla-bambu-tva-korgar` | 599 | stämmer | 44 |
| 3866 | `e514191b` | false | published | `FP-skohylla-fyra-plan-blomdekor` | 599 | stämmer | 62 |
| 3867 | `f75a8a17` | false | published | `FP-hornblomstall-tre-plan-svart` | 599 | stämmer | 104 |
| 3868 | `ba454107` | false | published | `FP-pall-morkgra-stoppad-sits` | 619 | stämmer | 153 |
| 3869 | `f4bdb64c` | false | published | `FP-pilatesbrada-hopfallbar` | 619 | stämmer | 186 |
| 3870 | `95b6f5bd` | false | published | `FP-tvattsorterare-bambu-vit` | 629 | stämmer | 36 |

Ingen `LÅST PRIS`, ingen `SLUTSALD`. Variant-id på raden = `variant.tsv` på
alla åtta. Priserna är desamma som före rundan — inget pris är rört.
