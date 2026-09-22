# Runda N34 — åtta produkter, 1 619–1 699 kr

Åtta Aosom-utkast polerade och publicerade: ett tvättskåp med två tippbara
korgar, en elektrisk väggkamin, en tv-bänk, ett högskåp, ett skoskåp, ett
sminkbord med LED-spegel, matstolar 2-pack i linnelook och en matgrupp i fem
delar.

Rundan gjordes i ETT sammanhängande pass på en session (källor, bilder,
texter, grindar, skrivning, stämpling, live-verifiering och två oberoende
granskningar), pushat i flera commits på grenen
`claude/seo-polering-runbook-review-uq6fwl`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 5022e9e5 | Tvättskåp 70 × 38 cm med två tippbara korgar – vitt, lackerad MDF | FP-tvattskap-tva-korgar | 1 619 kr | 43 |
| 32140f01 | Elektrisk väggkamin 65 × 52 cm – LED-lågor i sju färger | FP-vaggkamin-led-lagor | 1 619 kr | 84 |
| 4f9ef409 | TV-bänk 140 cm med skåp och öppet fack – vit, för tv upp till 60 tum | FP-tv-bank-skap-oppet-fack | 1 669 kr | 185 |
| 8085d0b6 | Högskåp 180 cm med tre hyllor och tre lådor – vitt | FP-hogskap-hyllor-lador | 1 679 kr | 33 |
| bd2c7da3 | Skoskåp 70 cm i sju nivåer – vitt, för upp till 21 par skor | FP-skoskap-sju-nivaer | 1 699 kr | 40 |
| 6b91821a | Sminkbord 90 × 144,7 cm med LED-spegel och dold förvaring – vitt | FP-sminkbord-led-spegel | 1 699 kr | 83 |
| 3739257b | Matstolar 2-pack i linnelook – tunnformad rygg, ben i gummiträ | FP-matstolar-tunnform-2-pack | 1 699 kr | 83 |
| 3bf5bd08 | Matgrupp 5 delar – bord 100 × 63 cm och fyra stolar i trämönster | FP-matgrupp-5-delar | 1 699 kr | 40 |

Wix-siten verifierades FÖRST mot N33:s publicerade `82000c6b`
("Basketkorg för vägg 110 × 70 cm …") innan urvalet startade — namn och
publiceringsstatus stämde.

## ☠️ Gapet 1 600–1 858 kr — mekaniskt omprövat, INTE stängt

Uppgiften var uttrycklig: fortsätt INTE bara uppåt från N33:s stoppunkt på
1 899 kr. En full, ofiltrerad svepning av hela katalogen (5 984 rader, 60
sidor) gav:

| | N33:s mätning | N34:s mätning |
|---|---:|---:|
| Utkast totalt | ej räknat samlat | **2 913** |
| I gapet 1 600–1 858 kr | 141 | **164** (139 i lager) |

Gapet är alltså **inte uttömt** — det har snarare VUXIT sedan N33 (fler
priser har drivit under 1 858 kr av samma skäl som N33 dokumenterade:
oberoende pris-synkjobb som kör var sjätte timme och inte känner till var
poleringsfronten står). Efter screening mot `FLAGGADE.md`, kända avvisade
familjer och full trippeldedup hittades **åtta rena kandidater helt inom
1 619–1 699 kr** — långt under N33:s 1 899 kr-stopp, alltså bevisligen ur
den nedre halvan av gapet. **156 utkast återstår i gapet** efter den här
rundan.

### ☠️ En ny, tidigare okänd nedre nivå: 2 007 utkast under 1 600 kr

Samma svep, oskuret: **2 007 av 2 913 utkast (69 %) ligger UNDER 1 600 kr.**
Det är en helt annan storleksordning än en enda rundas urval kan täcka, och
det ligger utanför uppgiftens två uttryckliga alternativ (stäng gapet ELLER
fortsätt från 1 899 kr). Ingen tidigare N-runda eller den separata numeriska
"Runda 103–147"-serien (som arbetar en annan, till synes möbelnära men
skild produktmix, senast växthus) verkar ha nått ner hit — deras
prisfönster har legat ≥ ~1 600 kr under en lång tid.

**Flaggas härmed uttryckligen för Leonard och framtida rundor:** det finns
en stor opolerad svans under 1 600 kr som ingen aktiv runda är riktad mot.
Mät, anta inte — den här rundan gjorde en mätning av storleken men valde
medvetet att INTE selektera därifrån, eftersom det hade varit en
skopförändring uppgiften inte bad om.

## Urvalet

**Full trippeldedup** (samma metod som `DUBBLETTMATNING.md`): 7/7 självtest
på alla dokumenterade regexformer (bokstav efter, bokstav före, utan
bokstav, `cm` efter varje tal, decimal sist, B/T/H-ordning, bokstav före med
decimal), körd två gånger — den FÖRSTA regexen missade "cm efter varje
tal"-formen, hittades, fixades och hela svepet kördes om. `utanText`: **0**
på 5 984 rader.

Screenade **11 kandidater** i spannet 1 619–1 799 kr (tvättskåp, väggkamin,
tv-bänk, högskåp, skoskåp, sminkbord, matstolar, matgrupp, CD-hylla-reserv,
plus `aa8ce611` och `b3a83f02` — se nedan). `las` kördes på alla elva (run
35788676912–35788697405 + 106952075918/106952085307): **10 av 11**
`supplier: aosom`, `needsAiPolish: true`, `draftStatus: pending_review`,
prisgrind `stämmer: true`. `01f3293a` (Boxsack) var redan
`draftStatus: rejected` och uteslöts direkt.

### Två uteslutna trots godkänd `las` — dubblettkluster

- **`aa8ce611`** (Klappbarer Esstisch, 1 699 kr) — fyrvägs internt
  dubblettkluster: samma bord ligger som utkast på 1 359, 1 399, 1 449 OCH
  1 699 kr under fyra olika id. Min kandidat var den DYRASTE i klustret —
  fel led, huset polerar den billigaste.
- **`b3a83f02`** (Modernes Sideboard, 1 649 kr) — exakt trippelträff
  100 × 40 × 80 cm mot TVÅ publicerade produkter, varav en är N33:s egen
  `07565140`.

Båda är tillagda i `FLAGGADE.md` under *Interna dubblettkluster*, aldrig
bara i en commit-text.

### Tre gränsfall verifierade genom att läsa träffens EGEN text, inte bara mått

Per `DUBBLETTMATNING.md`s egen regel — "en måttmatchning är ett skäl att
titta, aldrig ett beslut":

| kandidat | träff | utfall |
|---|---|---|
| `5022e9e5` (tvättskåp) | `d2b4b403` | annan vara: ett klaffbart rullbord, inte ett skåp |
| `3739257b` (2-pack stoppad matstol) | `53644ed2` | annan vara: en publicerad ENSTAKA fransk karmstol, annat material/stil |
| `8085d0b6` (79 × 39,5 × 180, högt skåp) | `50a808d5` | permutationsträff: en publicerad 180 cm BRED tv-bänk — annan möbeltyp helt |

Alla tre bedömda som äkta olika produkter, inga dubbletter.

### Reserv

`5c53dbfb` (Regal für CD/DVD, 1 799 kr, saldo 70) klarade `las` och alla
spärrar men kom inte med — rundan var full på åtta redan under 1 700 kr.

### En observation, inte en flagga: tre svenskt namngivna men fortfarande opolerade utkast

Sveparbetet stötte på `c11948ac` ("Hundsoffa…"), `1f9fe2c2`
("Sköldpaddshus…") och `d4118d39` ("Hopfällbar rumsavdelare…") — alla tre
har SVENSKA namn men står ändå kvar som opolerade Aosom-utkast
(`needsAiPolish: true`). Det ser ut som rester av ett avbrutet
poleringsförsök (kanske på en annan gren/session), men passar inte in i
någon av `FLAGGADE.md`s tre uttryckliga skälskategorier (licens,
djurboende, dubblettkluster). De är därför INTE tillagda där — bara
uteslutna ur det här urvalet och antecknade som en sak att titta närmare på.

## Oberoende granskning FÖRE skrivningen — ett fynd

Läste alla åtta som en skeptisk utomstående efter första pushen (`8488431`),
med fokus på sakfel mot bilderna, motsägande tal och kvarvarande
tyska/engelska:

- **`6b91821a`** (sminkbord): introt sa *"Spegeln ÄR en dörr"* men
  H2-stycket sa *"Spegeln SITTER PÅ en dörr"* — två olika mekanismer för
  samma spegel i samma text. Rättat till en konsekvent formulering
  (*"Spegeln går att fälla upp som en dörr"*) i båda styckena, INNAN något
  skrevs till Wix (`fee5e10`).

Inga ytterligare sakfel, inga motsägande tal, inga kvarvarande
tyska/engelska ord (egen läcksvep + engelsksvep, 0 träffar), ingen SEO över
längdgränserna. Hashar, axelfacit och alla steg-filer omgenererade efter
rättelsen; alla grindar och `npx vitest run lib/polish` (99/99) omkörda och
gröna.

## Bilder — sakfel och strukna

- **`5022e9e5`**: bild 1 zoomad — INGA separata öppna hyllor upptill, bara
  två spjälförsedda korgfronter som fälls fram (en visas mitt i rörelsen,
  vilket ser ut som ett öppet fack utan zoom). Texten skrevs rätt från
  början tack vare zoomningen.
- **`6b91821a`**: bild 1 zoomad — bekräftar att spegeln fälls upp som en
  dörr (gångjärn synliga), med två fack och krokar bakom och tre öppna fack
  per sida. Stämmer med källan.
- **`8085d0b6`**: bild 4 (fyra bildtexter: *"Anti-Kipp-Kits"*,
  *"Silberne Griffe"*, *"Leichtgängige Gleitschienen"*, *"Gebogener
  Sockel"*) har TYSK TEXT INBRÄND — struken. Ingen av dessa detaljer
  (handtagsfärg, glidskenor, sockelform) togs med i texten eftersom de bara
  stod i den strukna bildens bildtexter, inte i källtexten.
- **`bd2c7da3`**: räknat sju rader skor i bild 4 — bekräftar att sex
  justerbara hyllplan ger sju nivåer, ingen motsägelse.
- **`3bf5bd08`**: källans egen svenska AUTO-spec sa *"Färg: Hellgrau"* men
  källans TYSKA `Technische Daten` säger *"Naturholzmaserung + Weiß"*, och
  bilden visar ljust trämönster + vit ram, INTE grått. Skrev
  *"Vit med ljust trämönster"* i egen spec-tabell i stället för att kopiera
  den felaktiga auto-genererade svenska raden — samma familj som tidigare
  rundors axelkonflikt, fast på FÄRG. Motsvarande: auto-spec sa
  *"Material: Metall"*, tyska `Technische Daten` säger *"MDF, Metall"* —
  skrev *"MDF och metall"*.

Inga husmärken hittade på någon produkt i någon bild.

## Facit bevisat mot skarpa Wix

`kallor.json` verifierades server-side (h·31, samma anrop som ingen
skrivning) mot skarpa V3:s `plainDescription` på alla åtta: **8 av 8 LIKA**.
`6b91821a`s källa bär leverantörens artikelnummer i klartext
(`Artikelnummer: ‹REDIGERAT›`); det är ersatt med `‹REDIGERAT›` i
`bygg-kallor.py`/`kallor.json`, kontrollerat med exakt EN redigerad träff på
den produkten och noll på de andra sju.

☠️ **Egen miss, hittad av testet:** ett tidigt utkast av
`bygg-kallor.py`s docstring-kommentar skrev av det RIKTIGA artikelnumret i
klartext i stället för `…`. `artikelnummer-lackage.test.ts` fällde
(`expected [] to deeply equal [Array(1)]`), rättad, testet grönt igen.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| Trippelmönstrets självtest (7 former) | **7 av 7**, båda svepen |
| `kallor.json` mot skarpa V3 (server-side h·31) | **8 av 8 LIKA** |
| `gate.py` | **0 fynd i 8 filer, 0 varningar** (efter tre rättningar under bygget — se nedan) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter |
| `gate-alt.py` | **REN**, 8 produkter, 38 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader (efter en rättning — se nedan) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 33 |
| `gate-sku.py` | **0 fynd** (längsta 28 av 40 tecken), efter en SKU-omdöpning |
| SKU-krock mot alla tidigare rundors `sku.tsv` (56 filer, 439 SKU:er) | **0 krockar** efter omdöpning |
| Slug-krock mot hela katalogen (5 984 slugs) | **0 krockar** efter omdöpning |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd**, inga korslänkar |
| `npx vitest run lib/polish` | **99 av 99 gröna**, inklusive en verklig `artikelnummer-lackage`-träff (se ovan) |
| Steg 1 (namn/slug/brödtext/`visible`/SEO) | Ett transkriberingsfel hittat OCH stoppat av spärren (se nedan) — därefter **8 av 8 skrivna** |
| Steg 2 (media, fil-id + alt) | 0 avvikelser, **8 av 8 skrivna** |
| Steg 3 (kategorier, bulk add-items) | **13 av 13 rader success**, `totalFailures: 0` i alla fyra bulk-anrop |
| Steg 4 (variant-SKU sist och ensam) | 0 avvikelser, **8 av 8 skrivna** |
| Steg 5 (separat slutläsning) | **8 av 8 helt verifierade** |
| Färsk `las` före stämplingen | **8 av 8**, `stämmer: true`, priser/saldo oförändrade |
| Stämpling + oberoende `las`-verifiering per produkt | **8 av 8** |
| `livegrind.py`, första cykeln | **8/8 REN, orddiff 0** |
| Andra oberoende granskningen (på LIVE-texten) | **1 sakfel + 1 följdfel i SEO** (se nedan) |
| Rättelsernas skrivning (egna, ensamma anrop) | 0 avvikelser, **2 av 2 skrivna** |
| `livegrind.py`, andra och tredje cykeln (efter rättelserna) | **8/8 REN, orddiff 0** |

### Tre rättningar under bygget (innan Wix-skrivningen)

1. **`gate.py`-varningar** (mjuka): "två" (ord) otäckt för dörrantal i
   `4f9ef409` och `bd2c7da3`. Fixat med två `foto-tal.txt`-rader
   (bildräknade dörrantal).
2. **`gate-seo.py`-fel**: siffrorna `2` (`3739257b`s "2-pack") och `5`
   (`3bf5bd08`s "5 delar") i `seo.tsv`/`namn.tsv` saknade sifferform i
   brödtexten (bara utskrivet "två"/"fem" fanns). Fixat genom att ändra
   brödtexten till siffror ("2 stolar", "5 delar: …") i båda filerna.
3. **Cross-runda SKU/slug-krock**: `3739257b`s SKU
   `FP-matstolar-linnelook-2-pack` krockade EXAKT med en befintlig SKU från
   runda N32 (`41b2bc81`), och den ursprungliga sluggen
   `matstolar-2-pack-linnelook-tunnform` överlappade prefixmässigt en
   BEFINTLIG publicerad produkts slug (`matstolar-2-pack`, andra produkten).
   Fixat genom omdöpning till `FP-matstolar-tunnform-2-pack` /
   `matstolar-tunnform-linnelook-2-pack`, kontrollerat 0 krockar mot 439
   SKU:er i 56 tidigare rundor och 0 krockar mot alla 5 984 slugs.

## Skrivstegen och transkriberingsspärren i praktiken

Alla fyra Wix-steg (namn/slug/brödtext/visible/SEO → media+alt → kategorier
→ variant-SKU sist och ensam) kördes med checksumspärrar i samma anrop som
skrivningen, exakt N31–N33s mönster.

☠️ **Steg 1 avbröts av sin egen spärr på det FÖRSTA försöket** —
transkriberingsspärren gjorde precis sitt jobb. Vid manuell retypning av
`6b91821a`s brödtext i API-anropet skrevs *"starka rengöringsmedel"* i
stället för källfilens *"starka lösningsmedel"* (en omedveten
återanvändning av en vanligare fras från de andra produkternas
skötselstycken). En isolerad kontrollsummeverifiering (ingen skrivning)
reproducerade felet deterministiskt, och en `difflib.SequenceMatcher`-diff
mot filen på disk pekade ut EXAKT ordet. Rättad, skrivningen kördes om och
lyckades **8 av 8**.

Kategorier: 13 av 13 rader `success: true` över fyra kategorinamn
(`Hem & Inredning`, `Badrum & Hemtextil`, `Hushållsapparater`,
`Dekoration & Prydnad`, `Förvaring & Organisering`), id uppslagna färskt i
samma anrop (54 kategorier lästa).

## Andra oberoende granskningen — på den PUBLICERADE texten

Efter det första `livegrind`-svepet (8/8 REN) lästes alla åtta live-sidornas
brödtext igen, som en ny läsare, med genus/adjektiv/particip-kongruens och
konstruktionslogik som fokus (samma klass av fel som CLAUDE.md:s
golvlampe-exempel). Ett verkligt fynd:

- **`5022e9e5`**: introt och H2-stycket beskrev mekaniken som att en
  **spjälsdörr** fälls fram och en **stillastående korg** sitter bakom den
  — men källan säger uttryckligen och upprepat att det är **korgen SJÄLV**
  som är tippbar (*"nach vorne klappbare Wäschekörbe"*, *"Zwei vordere
  Kippbehälter"*), och det var redan vad produktnamnet och sluggen sa
  (`tva-tippbara-korgar`). En intern motsägelse mellan mitt eget namn/slug
  och min egen brödtext. Rättat i introt, H2-rubriken, H2-stycket, en
  Egenskaper-bullet, skötselraden och en FAQ-fråga+svar — konsekvent
  "korgen fälls fram", ingen "dörr" kvar någonstans (`grep -i dörr` gav 0
  träffar efteråt).

  ☠️ **Ett följdfel ingen bad om att leta efter:** `seo.tsv`s
  metabeskrivning för samma produkt ekade den GAMLA
  "spjälsdörrar…bakom varje"-formuleringen — exakt den blinda fläck
  CLAUDE.md redan dokumenterat under *"och `seoData` glömdes bort av
  regeln"*. Rättad till samma korg-framing (132 tecken, under gränsen).

Rättelserna skrevs till Wix i TVÅ egna, ENSAMMA anrop (aldrig ihop med
andra fält): `plainDescription` via `bygg-steg.py --rattelse 5022e9e5`
(maskinellt genererad nyttolast ur filen — ingen handskriven text i
anropet), sedan `seoData` via ett litet motsvarande skript byggt ur
`seo.tsv`. Båda verifierade med en SEPARAT återläsning direkt efteråt
(revision 4 → 5 → 6; `plainDescription`-hashen och `seoData`-taggarna
matchade facit exakt). `raa-hash.tsv`, `vantat-hash.tsv`, `steg1-bas.js`,
`steg1.js`, `steg5.js` omgenererade; alla filgrindar och
`npx vitest run lib/polish` (99/99) omkörda gröna.

Live-sidan hämtades om två gånger till (en efter varje rättelse, samma
ISR-medvetna varm-träff-och-vänta-procedur) och `livegrind.py` gav till
slut **8 av 8 REN, 0 avvikelser**, inklusive SEO-svepet mot det uppdaterade
`seo.tsv`.

⚠️ **Anmärkning om `age`:** `6b91821a` visade `age: 488` i det första
sveparet — högre än den nominella väntetiden, men förklarat av att hela
skrivfönstret (steg 1–4 + stämpling, plus alla `las`-omgångarna) låg gott
och väl mer än 488 sekunder före `hamta-live`-körningen. `livegrind`
bekräftade ändå `diff=0` på den sidan. Samma lärdom CLAUDE.md redan skrivit
ned: läs om vid tvekan, döm inte på ett enda `age`.

Inga ytterligare sakfel eller kongruensfel hittades på de andra sju
produkterna vid den här genomläsningen.

## Filer i katalogen

Genererade av `polish-gates` ur rundans filer, inte skrivna för hand:
`axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`, `nyttolast-media.json`,
`medieskrivning.json`, `media-hash.tsv`. Genererade av rundans egen
`bygg-steg.py` (kopierad från N33, bara docstring-referenser ändrade):
`steg1-bas.js` → `steg1.js`, `steg3.js`, `steg4.js`, `steg5.js`, samt
rättelseskripten (körda, inte incheckade — samma disciplin som `steg1.js`).

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i separata
led: facit mot skarpa Wix före grindarna (8/8 LIKA), en oberoende
skeptisk granskning FÖRE skrivningen (ett fynd, infört innan något
skrevs), fyra skrivsteg med checksumspärrar i samma anrop som skrivningen
(ett transkriberingsfel FÅNGAT av spärren och rättat innan skrivningen
lyckades), en separat slutläsning (8/8), mappningsstämpeln verifierad med
en oberoende `las` per produkt, den publicerade sidan via `livegrind.py`
(8/8 REN), och en andra oberoende granskning av den PUBLICERADE texten som
hittade en genuin sak-/konsekvensmotsägelse plus ett SEO-följdfel, båda
rättade i egna checksumspärrade anrop och omverifierade ända ut till den
publicerade sidan. Gapet 1 600–1 858 kr är mätt större än vid N33 (164 mot
141) och lämnas medvetet öppet (156 kvar); en ny, betydligt större okänd
svans under 1 600 kr (2 007 utkast) är upptäckt och flaggad men INTE
bearbetad denna runda. Två nya dubblettkluster tillagda i `FLAGGADE.md`.
Inget pris rördes, och inget pris ändrades under rundan.
