# Runda N35 — åtta produkter, 1 619–1 739 kr

Åtta Aosom-utkast polerade och publicerade: två barstolar i konstläder, en
jordgubbsformad barnsoffa, en hopfällbar 5-i-1-klätterställning, en
trädgårdsgungbänk för tre, en tvåsitssoffa i linnelook, en konsolelkamin med
nio lågfärger, ett köksskåp i lantstil och ett 2-pack spiralformade
konstcypresser.

Rundan gjordes i ETT sammanhängande pass på en session (källor, bilder,
texter, grindar, skrivning, stämpling, live-verifiering och två oberoende
granskningar), pushat i flera commits på grenen
`claude/seo-polering-runbook-review-uq6fwl`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 8a076c08 | Barstolar 2-pack i konstläder – svarta, snurrbara, sitthöjd 68 cm | FP-barstolar-konstlader-2-pack | 1 619 kr | 23 |
| b28e1cbe | Barnsoffa i jordgubbsdesign – rosa, med två kuddar, 90 cm | FP-barnsoffa-jordgubbe | 1 639 kr | 49 |
| 1bc0c04e | Klätterställning 5-i-1 för barn – gunga, rutschkana och klätternät | FP-klatterstallning-5-i-1 | 1 649 kr | 51 |
| 69513a61 | Gungbänk 3-sits för trädgården | FP-gungbank-3-sits-tradgard | 1 669 kr | 197 |
| 3847b7ba | Tvåsitssoffa 115 cm i linnelook – grå, ram i gummiträ | FP-tvasitssoffa-115-cm-gra | 1 699 kr | 53 |
| 965ba956 | Elkamin i konsolmodell, 9 färger | FP-elkamin-konsol-9-farger | 1 699 kr | 95 |
| c4d8cb93 | Köksskåp 170 cm i lantstil | FP-koksskap-lantstil-170-cm | 1 729 kr | 41 |
| 093aedd2 | Konstväxt cypress 2-pack, 120 cm | FP-konstvaxt-cypress-2-pack | 1 739 kr | 87 |

Wix-siten verifierades FÖRST mot N34:s publicerade `5022e9e5` ("Tvättskåp 70 ×
38 cm med två tippbara korgar") innan urvalet startade — namn och
`visible: true` stämde.

## Gapet 1 600–1 858 kr — mekaniskt omprövat igen

Uppgiften var uttrycklig: fortsätt inte bara uppåt från N34:s stoppunkt.
En full, ofiltrerad svepning av hela katalogen (5 984 rader, 60 sidor, ingen
synlighetsvillkor) gav:

| | N34:s mätning | N35:s mätning |
|---|---:|---:|
| Utkast totalt | 2 913 | **2 905** (2 913 − N34:s 8 publicerade) |
| I gapet 1 600–1 858 kr | 164 → **156 kvar efter N34** | **156** (131 i lager) — bekräftar N34:s slutsiffra oförändrad |
| Under 1 600 kr | 2 007 | **2 007** — oförändrat, inte rört |

**Gapet är efter den här rundan 148** (156 − 8). Svansen under 1 600 kr står
kvar orörd på **2 007**, precis som N34 flaggade och uppdraget uttryckligen
sa åt mig att INTE expandera in i på eget initiativ.

## Urvalet

**Full trippeldedup** (samma metod som `DUBBLETTMATNING.md`): 7/7 självtest på
alla kända mönsterformer, körd i samma anrop som svepet, `medTrippel:
4680/5984` av katalogen. Screenade **16 kandidater** i spannet 1 619–1 739 kr,
körd två gånger (första på de 16, andra på de 9 slutkandidaterna).

### Sju uteslutna på trippeldedup (nio produkter), alla i `FLAGGADE.md`

- **`5e91a8a2`** (Fahrradanhänger) — exakt trippelträff mot en publicerad
  cykelkärra (`566f41df`, 1 869 kr) och ett billigare utkast (`fbfdba44`,
  1 329 kr) med nästan identiskt namn.
- **`526052d2` / `8729625c` / `9f3f78c4`** (tre "massage-kontorsstol"-
  kandidater) — alla kolliderar mot flera publicerade och opublicerade
  kontorsstolar med nästan identiska mått; för hög risk att särskilja utan en
  hel produktfamiljs materialjämförelse.
- **`00bbd350`** (Sitzbank Stauraum) — kolliderar mot ett redan flaggat
  förvaringsbänk/pall-kluster.
- **`a8f70d31`** (Armlehnstuhl) — exakt trippel- och namnträff mot ett
  BILLIGARE opublicerat utkast (`c2888f7e`, 1 499 kr).
- **`5dce837b`** (Ganzkörperspiegel LED) — kolliderar mot `3c992c78`, redan i
  ett N31-kluster i `FLAGGADE.md`.
- **`ef2cbde0`** (Elektro Motorrad Kinder 6V) — trevägs internt kluster: två
  ännu billigare utkast (`f6c56546` 1 459 kr, `ba477284` 1 099 kr).
- **`e911531e`** (Schaukelstuhl Vliesoptik) — exakt trippelträff mot TVÅ
  redan publicerade svenska gungstolar i annan färg — samma
  fargsyskon-mönster tidigare rundor lämnat orört.

`8a076c08` (Barhocker, 1 619 kr) fick 13 kollisionsträffar, men samtliga mot
en helt annan produktkategori (barnens elmotorcyklar) via en
paketmått-sammanträff — bedömda falska positiva efter läsning, samma familj
som `DUBBLETTMATNING.md`s dokumenterade paketmåttskollisioner.

### Bildgranskningen bytte ut en kandidat

`las` kördes mot `main` på alla 9 slutkandidater: alla `supplier: aosom`,
`needsAiPolish: true`, `draftStatus: pending_review`, prisgrind `stämmer:
true`, ingen `prisLast`, ingen `slutsald`, `aosomFreightShare` 0,26–0,458.

**`5873ae60`** (Feuerwehrauto, 1 649 kr) klarade `las` och dedup men bara 2
av 5 bilder var rena — 3 hade tysk text inbränd. Samma situation som
`0263494c` i tidigare rundors `FLAGGADE.md` ("bara två användbara bilder …
inte flaggat, bara uppskjutet"). Ersattes av den redan förberedda reserven
**`093aedd2`** (0 dedupkollisioner, alla 5 bilder rena).

## Oberoende granskning FÖRE skrivningen — ett fynd

Läste alla åtta som en skeptisk utomstående granskare efter
OGRINDAD-TILL-WIX-pushen, med fokus på sakfel mot bilderna, motsägande tal
och kvarvarande tyska/engelska:

- **`c4d8cb93`** (köksskåp): introt påstod att ALLA tre delarna — övre skåp,
  öppen mellanhylla OCH nedre skåp — satt "bakom dörrar". Det motsäger
  bilderna och resten av samma text (avsnittet "Öppen mellanhylla för
  mikron", Egenskaper-listan, FAQ:ns "Får en mikrovågsugn plats på
  mellanhyllan?"): bara de två skåpen har dörrar, mellanhyllan är
  uttryckligen ÖPPEN — det är själva poängen med den. Rättat till
  "… med ett övre skåp och ett nedre skåp bakom dörrar … samt en öppen
  mellanhylla mellan de två skåpen." Ingen siffra ändrades. Alla åtta
  filgrindar och `npx vitest run lib/polish` (99/99) omkörda efteråt —
  oförändrat gröna.

Inga ytterligare sakfel, inga motsägande tal, inga kvarvarande
tyska/engelska ord, ingen SEO över längdgränserna, på de andra sju.

## Bilder — sakfel och strukna

- **`8a076c08`**: bild 4 (tysk text "Verstellbare Fußpads") — struken.
- **`1bc0c04e`**: bild 4 (tysk text "PLATZSPARENT" / "Nach Gebrauch
  gefaltet …") — struken.
- **`69513a61`**: bild 4 (tysk text "ERGONOMISCHER KOMFORT" m.fl.) —
  struken. Källans intro kallar produkten både "Balkon Liegestuhl" och
  "Garten Schaukelstuhl", men bilderna visar entydigt en glidande SITTBÄNK,
  inte en fällbar solstol. Skrev texten efter bilderna, inte efter det
  tvetydiga ordvalet.
- **`c4d8cb93`**: källans egen text påstår "4 Einlegeböden mit je 5 Fächern"
  (20 fack totalt), men det stämmer varken med bilderna eller de egna
  måtten (ett enkelt 2-dörrsskåp med en öppen mellanhylla och en extra
  hylla i det nedre skåpet). Bedömt som boilerplate från en annan, större
  produkt i samma serie — påståendet är INTE med i den publicerade texten,
  bara de mått källan faktiskt anger per sektion användes.
- **`1bc0c04e`**: källans enda totalmått är "Klappgröße" (HOPFÄLLD storlek,
  140×133×43 cm). `bygg-axelfacit.py` vägrade mekaniskt behandla den som
  produktens allmänna mått, eftersom etiketten inte finns i listan över
  totalmått-synonymer — med flit, för att inte gömma en separat, större
  uppfälld storlek. Måttbilden visar en klart större uppfälld footprint
  som INTE står i källtexten. Skrev "Hopfällbar storlek 140 × 133 × 43 cm"
  i Egenskaper i stället för ett oprecist "Mått: …".
- Inga husmärken eller tredjepartslogotyper hittade på någon bild i något
  av de åtta.

## Facit bevisat mot skarpa Wix

`kallor.json` verifierades server-side (h·31, samma anrop som ingen
skrivning) mot skarpa V3:s `plainDescription` på alla åtta: **8 av 8 LIKA**.
`965ba956`s källa bär leverantörens artikelnummer i klartext i sin
`Technische Daten`; ersatt med `‹REDIGERAT›` i både källa och kontrollsumma
— exakt EN redigerad träff på den produkten, noll på de andra sju.

☠️ **Två egna missar, hittade av läckkontrollen — INNAN Wix-skrivningen:**

1. `bygg-kallor.py`s docstring skrev av det RIKTIGA artikelnumret i klartext
   som "exempel" på vad som redigerats, i stället för `‹REDIGERAT›` — exakt
   samma fälla som tidigare rundor (en förklarande mening om en redigering
   som själv läcker det redigerade). `artikelnummer-lackage.test.ts` fällde,
   rättad, testet grönt igen.
2. Samma fälla en andra gång: `framsteg.md`s beskrivning av fix #1 ovan
   skrev av samma riktiga artikelnummer i klartext som "bevis" på vad som
   hänt. Hittad genom en egen, proaktiv `grep` EFTER att testerna redan
   rapporterat rent en gång — testerna var alltså gröna på ett läckande
   dokument tills nästa fil råkade läcka det, vilket är varför läckkontrollen
   måste köras om efter VARJE efterföljande fil som diskuterar redigeringen,
   inte bara en gång. Rättad till en ren beskrivning utan siffror; testet
   omkört och grönt.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| Trippelmönstrets självtest (7 former) | **7 av 7** |
| `kallor.json` mot skarpa V3 (server-side h·31) | **8 av 8 LIKA**, 1 artikelnummer redigerat |
| `gate.py` | **0 fynd, 0 varningar** (efter 1 rättning — se nedan) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter |
| `gate-alt.py` | **REN**, 8 produkter, 37 alt-texter (efter 1 rättning) |
| `gate-seo.py` | **0 fynd** i 8 rader (efter 2 rättningar) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 23 |
| `gate-sku.py` | **0 fynd** (längsta 30 av 40 tecken) |
| SKU-krock mot alla tidigare rundors `sku.tsv` (58 filer, 447 SKU:er) | **0 krockar** |
| Slug-krock mot hela katalogen (5 984 slugs) | **0 krockar** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd**, inga korslänkar |
| `npx vitest run lib/polish` | **99 av 99 gröna** |
| Steg 1 (namn/slug/brödtext/`visible`/SEO) | **8 av 8 skrivna** |
| Steg 2 (media, fil-id + alt) | 0 avvikelser, **8 av 8 skrivna** |
| Steg 3 (kategorier, bulk add-items) | **13 av 13 rader success**, `totalFailures: 0` i alla åtta bulk-anrop |
| Steg 4 (variant-SKU sist och ensam) | 0 avvikelser, **8 av 8 skrivna** |
| Steg 5 (separat slutläsning) | **8 av 8 helt verifierade** |
| Färsk `las` före stämplingen | **8 av 8**, `stämmer: true`, priser/saldo oförändrade |
| Stämpling + oberoende `las`-verifiering per produkt | **8 av 8** |
| `livegrind.py` | **8/8 REN, orddiff 0** |
| Andra oberoende granskningen (på LIVE-texten) | **0 nya fynd** |

### Tre rättningar under bygget (innan Wix-skrivningen)

1. **`3847b7ba`**: skrev "2-sitssoffa" (digit) i brödtext och alt-text, men
   källan har bara den tyska SAMMANSÄTTNINGEN "Zweisitzer" — ingen fri
   siffra "2". Döpte om till "Tvåsitssoffa" (svenskt sammansatt ord, samma
   mönster som tyskans eget) i brödtext, alt-text, namn, SEO, SKU och slug.
2. **`69513a61`** och **`965ba956`**: SEO-titlarna bar siffrorna "3" (sits)
   respektive "9" (lågfärger), men `gate-seo.py`s facit är den EGNA
   publicerade filen — och brödtexten hade bara spelled-out "tre"/"Nio".
   Källan har fria siffror/ord som täcker båda (`Für 3 Personen`, `neun
   Flammenfarben` → `9` via `ORDTAL_DE`), så fixen var att skriva in samma
   siffror i brödtextens Egenskaper-lista.
3. Artikelnummerläckan i `bygg-kallor.py`s docstring (se ovan).

Fem `foto-tal.txt`-rader kvitterar bildräknade tal (ben, fötter,
sidostolpar, skåpsantal) som ordtal-varningen annars hade flaggat.

## Skrivstegen i praktiken

Alla fyra Wix-steg kördes med checksumspärrar i samma anrop som
skrivningen. Ingen spärr utlöstes — alla fyra gick igenom på första
försöket, **8 av 8 / 8 av 8 / 13 av 13 / 8 av 8**.

Steg 4:s svar bekräftade att `visible` var `true` på både produkt OCH
variant för alla åtta INNAN skrivningen, att priset var oförändrat (samma
åtta belopp som i urvalstabellen), och att de gamla tyska SKU:erna (t.ex.
`FP-barhocker-2er-set-68-cm`, `FP-kuchenschrank`) verkligen byttes ut —
bevis på att skrivningen gjorde riktigt arbete, inte en no-op.

Kategorier: 13 av 13 rader `success: true` över åtta kategorinamn (`Hem &
Inredning`, `Barn & Familj`, `Leksaker & Spel`, `Utemöbler`,
`Hushållsapparater`, `Dekoration & Prydnad`, `Förvaring & Organisering`,
`Trädgårdsdekor & Belysning`), id uppslagna färskt i samma anrop (54
kategorier lästa).

## Steg 7 — separat återläsning

`steg5.js` kört som ett EGET, senare anrop. Bevisade att alla fyra
projektionsfälten fanns innan noll tolkades. **8 av 8 helt verifierade**:
text (FNV-hash), namn, slug, `visible: true`, SEO (exakt 2 taggar, tomma
keywords), media (checksumma över id+alt-text), kategori (`antalKat` =
tilltänkt antal + 1, Wix egen `All Products`), SKU, variant-`visible:
true`, variant-id matchar. Priser oförändrade, lager `IN_STOCK` på alla
åtta.

## Steg 8–9 — färsk prisgrind, stämpling, oberoende verifiering

Färsk `las` på alla åtta drygt en timme efter urvalets ursprungliga
kontroller: **ingenting hade ändrats** — samma pris, samma prisgrind
(`stämmer: true`, `avrundning charm99`), samma `aosomFreightShare`, inget
`prisLast`, inget `slutsald`. Priset rördes inte.

Stämplingen (`needsAiPolish: false`, `draftStatus: published`, rätt
`variantSkus`) kördes på alla åtta och svarade `OK` på alla. En HELT
SEPARAT `las`-körning efteråt bekräftade **8 av 8**: `needsAiPolish: false`,
`draftStatus: "published"`, rätt SKU, oförändrat pris — eftersom "ett svar
utan fel är inget kvitto".

## Steg 10–11 — live-verifiering och andra korrekturläsningen

`hamta-live.sh 130`: varm träff (alla åtta `200, age=0`), väntade ut 305 s,
skarp hämtning gav alla åtta `HTTP 200`, 146–154 kB, `age` 140–141 sekunder
— bevisligen den rendering den varma träffen utlöste.

`livegrind.py`: **0 avvikelser i den PUBLICERADE texten**, alla åtta REN
(orddiff 0, homoglyfsvep rent, sid- och alt-svep rent).

Extra kontroller: alla tre obligatoriska flikarna renderas ordagrant på
samtliga åtta sidor; brödsmulans JSON-LD visar en riktig kategori på alla
åtta (aldrig "Hem / Butik / produkt"); `c4d8cb93`s JSON-LD `sku` är Wix
egen produkt-UUID (inget leverantörsspår), `availability: InStock`,
`price: 1729`.

Andra korrekturläsningen läste den faktiska renderade brödtexten (inte
bara diff-rapporten) för de tre ställen som rättats under bygget/steg 5
(`c4d8cb93`, `965ba956`, `3847b7ba`) direkt ur de hämtade live-sidorna.
Alla tre läser naturligt och korrekt i sitt sammanhang. **Inga nya fynd** —
ingen ytterligare rättning eller omkörning av `livegrind.py` behövdes.

## Filer i katalogen

Genererade av `polish-gates` ur rundans filer, inte skrivna för hand:
`axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`, `nyttolast-media.json`,
`medieskrivning.json`, `media-hash.tsv`. Genererade av rundans egen
`bygg-steg.py` (kopierad från N34, bara docstring-referenser ändrade):
`steg1-bas.js` → `steg1.js` (gitignorad, precis som tidigare rundor),
`steg3.js`, `steg4.js`, `steg5.js`.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i separata
led: facit mot skarpa Wix före grindarna (8/8 LIKA), en oberoende skeptisk
granskning FÖRE skrivningen (ett fynd, infört innan något skrevs), fyra
skrivsteg med checksumspärrar i samma anrop som skrivningen (ingen spärr
utlöstes), en separat slutläsning (8/8), mappningsstämpeln verifierad med
en oberoende `las` per produkt, den publicerade sidan via `livegrind.py`
(8/8 REN), och en andra oberoende granskning av den PUBLICERADE texten som
inte hittade något nytt. Gapet 1 600–1 858 kr bekräftar N34:s slutsiffra
(156) och lämnas på **148** efter den här rundan; svansen under 1 600 kr
(2 007 utkast) är fortsatt orörd, per uppdraget. Sju nya dubblettkluster
tillagda i `FLAGGADE.md` (nio produkter). Två egna artikelnummerläckor i
byggartefakter hittades och rättades av läckkontrollen INNAN Wix-
skrivningen. Inget pris rördes, och inget pris ändrades under rundan.
