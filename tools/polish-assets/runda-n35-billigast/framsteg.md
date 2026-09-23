# Runda N35 — framsteg

Uppdateras efter varje skrivsteg. Om rundan avbryts: läs den här filen först.

## Urval

Wix-siten verifierad FÖRST mot N34:s publicerade `5022e9e5` (tvättskåp) —
namn och `visible: true` stämde.

Full katalogsvep (60 sidor, 5 984 rader, `POST /stores/v3/products/query`
UTAN synlighetsvillkor): **2 905 utkast totalt**, **156 i gapfönstret
1 600–1 858 kr** (131 i lager), **2 007 utkast under 1 600 kr** (oförändrat
sedan N34 — ingen selektering gjord där, per uppdraget).

Screenade 16 kandidater i spannet 1 619–1 739 kr. Full trippeldedup (7/7
självtest på alla kända mönsterformer, körd i samma anrop som svepet,
`medTrippel: 4680/5984`) mot HELA katalogen (publicerat + utkast) körd två
gånger (första på 16, andra på de 9 slutkandidaterna).

**Fem kandidater uteslutna på trippeldedup**, alla med skäl noterat i
FLAGGADE.md:

- `5e91a8a2` (Fahrradanhänger) — exakt trippelträff mot en PUBLICERAD
  cykelkärra (`566f41df`, 1 869 kr) och mot ett billigare utkast
  (`fbfdba44`, 1 329 kr) med nästan identiskt namn.
- `526052d2` / `8729625c` / `9f3f78c4` (tre olika "massage-kontorsstol"-
  kandidater) — alla kolliderar mot flera publicerade OCH opublicerade
  kontorsstolar med nästan identiska mått; för hög risk att särskilja utan
  omfattande materialjämförelse på en hel produktfamilj.
- `00bbd350` (Sitzbank Stauraum) — kolliderar mot flera andra
  "förvaringsbänk/pall"-produkter i samma kluster som redan är flaggat.
- `a8f70d31` (Armlehnstuhl) — EXAKT trippel- OCH namnträff mot ett BILLIGARE
  opublicerat utkast (`c2888f7e`, 1 499 kr, samma inledande namn). Nytt
  dubblettkluster, tillagt i FLAGGADE.md.
- `5dce837b` (Ganzkörperspiegel LED) — kolliderar mot `3c992c78`, som REDAN
  stod i FLAGGADE.md som del av ett N31-kluster; för nära en känd
  dubblettfamilj för att våga utan att hitta hela klustret.
- `ef2cbde0` (Elektro Motorrad Kinder 6V) — EXAKT trippel- OCH namnträff mot
  ETT BILLIGARE utkast (`f6c56546`, 1 459 kr) OCH ett tredje ännu billigare
  (`ba477284`, 1 099 kr, hittat via `8a076c08`s egen dedup-sida). Trevägs
  internt dubblettkluster, tillagt i FLAGGADE.md.
- `e911531e` (Schaukelstuhl Vliesoptik) — EXAKT trippelträff (98×71×101) mot
  TVÅ redan PUBLICERADE svenska gungstolar i annan färg ("Gungstol i gul
  manchester", "Gungstol i ljusgrå manchester") — samma FARGSYSKONEN-mönster
  som tidigare rundor lämnat orört.

**8a076c08** (Barhocker, 1619 kr) fick 13 kollisionsträffar men alla mot
HELT ANDRA produktkategorier (barnens elmotorcyklar) via paketmått-
sammanträff — bedömda falska positiva efter läsning, samma familj som
DUBBLETTMATNING.md:s "9276f63e mot en kontorsstol" (paketmåttskollision).

`las` kördes mot `main` på alla 9 slutliga kandidater (de 8 valda + reserven
093aedd2 som redan var förberedd innan den kom in i det slutgiltiga urvalet).
Alla: `supplier: aosom`, `needsAiPolish: true`, `draftStatus: pending_review`,
prisgrind `stämmer: true`, ingen `prisLast`, ingen `slutsald`,
`aosomFreightShare` 0,26–0,458 (ingen över 0,5).

**`5873ae60`** (Feuerwehrauto, 1649 kr) klarade `las` och dedup men föll på
BILDGRANSKNING: bara 2 av 5 bilder var rena (3 hade tysk text inbränd:
"Gewichtsgrenze"/"Empfohlenes Alter", "ANGENEHMES FAHREN"/"HUPE"/"MUSIK",
"VERSCHIEDENE STRASSENBELÄGE"). Samma situation som `0263494c` i N30–N33:s
FLAGGADE.md ("bara två användbara bilder … inte flaggat, bara uppskjutet").
Ersattes av reserven **`093aedd2`** (Zypresse 2er Set, 1739 kr) — redan
dedupad (0 kollisioner) och alla 5 bilder rena.

## Slutgiltigt urval (8, pris 1 619–1 739 kr)

| kort | produkt | pris | saldo | freightShare |
|---|---|---:|---:|---:|
| 8a076c08 | Barstolar 2-pack i konstläder | 1 619 kr | 23 | 0,323 |
| b28e1cbe | Barnsoffa i jordgubbsdesign | 1 639 kr | 49 | 0,305 |
| 1bc0c04e | Klätterställning 5-i-1 | 1 649 kr | 51 | 0,271 |
| 69513a61 | Gungbänk 3-sits för trädgård | 1 669 kr | 197 | 0,299 |
| 3847b7ba | Tvåsitssoffa 115 cm i linnelook | 1 699 kr | 53 | 0,293 |
| 965ba956 | Elkamin i konsolmodell, 9 färger | 1 699 kr | 95 | 0,266 |
| c4d8cb93 | Köksskåp 170 cm i lantstil | 1 729 kr | 41 | 0,458 |
| 093aedd2 | Konstväxt cypress 2-pack | 1 739 kr | 87 | 0,260 |

Gapet 1 600–1 858 kr: **156 vid urvalets start → 148 kvar efter den här
rundan** (156 − 8). Under-1 600-svansen: oförändrad, **2 007**, inte rörd —
samma medvetna beslut som N34.

## Källor och kontroll mot skarpa V3

`kallor.json` byggd i `bygg-kallor.py` (samma mekaniska mönster som N26–N34)
och verifierad SERVER-SIDE (h·31, samma anrop som ingen skrivning) mot
skarpa V3 på alla åtta: **8 av 8 LIKA**, inklusive artikelnummer-redigeringen
(`965ba956` bär leverantörens artikelnummer i sin `Technische Daten`; ersatt
med `‹REDIGERAT›` i både källa och kontrollsumma, exakt EN träff på den
produkten, noll på de andra sju — samma mönster som N34:s `6b91821a`).

## Bilder — sakfel och strukna

- **`8a076c08`**: bild 4 hade tysk text inbränd ("Verstellbare Fußpads") —
  struken.
- **`1bc0c04e`**: bild 4 hade tysk text inbränd ("PLATZSPARENT", "Nach
  Gebrauch gefaltet, spart es wertvollen Platz") — struken.
- **`69513a61`**: bild 4 hade tysk text inbränd ("ERGONOMISCHER KOMFORT",
  "Schräge Rückenlehne", "Glatte Armlehnen", "Gewölbter Sitz vorne") —
  struken. Källans intro kallar produkten både "Balkon Liegestuhl" och
  "Garten Schaukelstuhl" — bilderna visar entydigt en SITTBÄNK som glider,
  INTE en fällbar solstol/lounger. Skrev texten efter bilderna, inte efter
  det tvetydiga ordvalet "Liegestuhl" i källans intro.
- **`c4d8cb93`**: källans egen beskrivning påstår "4 Einlegeböden mit je 5
  Fächern" (4 hyllplan med 5 fack vardera, 20 fack totalt) — detta stämmer
  INTE med varken bilderna eller de egna tekniska måtten (ett enkelt
  övre/nedre 2-dörrsskåp med en öppen mellanhylla och EN extra hylla i det
  nedre skåpet, synligt på bild 5). Bedömt som boilerplate från en annan,
  större Aosom-produkt i samma familj. **Påståendet är INTE med i den
  publicerade texten** — bara de mått källan faktiskt anger per sektion
  användes (`67×38,5×27`, `67×38,5×35,2`, `67×36,5×57`).
- **`1bc0c04e`**: källans enda totalmått är "Klappgröße" (HOPFÄLLD storlek,
  140×133×43 cm) — `bygg-axelfacit.py` vägrade mekaniskt behandla den som
  produktens allmänna mått (etiketten "Klappgröße" finns inte i den
  igenkända listan över totalmått-synonymer, med flit — den kunde annars ha
  gömt en SEPARAT, större uppfälld storlek). Måttbilden visar en klart
  STÖRRE uppfälld footprint (bl.a. 172,5 cm) som INTE står i källtexten
  någonstans. Skrev därför "Hopfällbar storlek 140 × 133 × 43 cm" i
  Egenskaper i stället för ett oprecist "Mått: …", och påstod aldrig någon
  uppfälld storlek som inte går att belägga i text.
- Inga husmärken eller tredjepartslogotyper hittade på någon bild i något av
  de åtta.

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

### Tre rättningar under bygget (innan Wix-skrivningen)

1. **`3847b7ba`**: skrev "2-sitssoffa" (digit) i både brödtext och alt-text,
   men källan har bara den tyska SAMMANSÄTTNINGEN "Zweisitzer" (`\bzwei\b`
   matchar inte inuti ett sammansatt ord) — ingen fri siffra "2" i källan.
   Döpte om till "Tvåsitssoffa" (sammansatt svenskt ord, samma mönster som
   tyskans eget) i brödtext, alt-text, namn, SEO-titel/beskrivning, SKU och
   slug.
2. **`69513a61`** och **`965ba956`**: SEO-titlarna bar siffrorna "3" (sits)
   respektive "9" (lågfärger), men `gate-seo.py`s facit är MIN EGEN
   publicerade fil (inte `kallor.json`) — och min brödtext hade bara
   spelled-out "tre"/"Nio". Källan har fria siffror/ord som TÄCKER båda
   (`Für 3 Personen`, `neun Flammenfarben` — `neun` mappas till `9` via
   `ORDTAL_DE`), så fixen var att skriva in samma siffror i brödtextens
   Egenskaper-lista i stället för att ändra titlarna.
3. **Egen miss, hittad av läckkontrollen (se nedan) INNAN Wix-skrivningen**:
   `bygg-kallor.py`s docstring skrev av det RIKTIGA artikelnumret i klartext
   som "exempel" på vad som redigerats, i stället för `‹REDIGERAT›` — exakt
   samma fälla som N34/N17 (en förklarande mening om en redigering som
   själv läcker det redigerade). `artikelnummer-lackage.test.ts` fällde,
   rättat, testet grönt igen. Körd EN gång till efter alla texträttningar
   ovan för säkerhets skull — fortsatt grön.
4. **Steg 5 (oberoende skeptisk granskning), hittad EFTER
   OGRINDAD-TILL-WIX-commiten**: `c4d8cb93`s inledande mening påstod att
   ALLA tre delarna — övre skåp, öppen mellanhylla OCH nedre skåp — satt
   "bakom dörrar". Det motsäger både resten av samma text (avsnittet
   "Öppen mellanhylla för mikron", Egenskaper-listan, FAQ:ns "Får en
   mikrovågsugn plats på mellanhyllan?") och bilderna: bara de två skåpen
   har dörrar, mellanhyllan är uttryckligen ÖPPEN och det är själva poängen
   med den (plats för en mikro utan att öppna en lucka). Ingen siffra
   ändrades — bara meningens struktur, så inget nytt tal behövde grundas.
   Alla åtta grindar (`gate.py`, `gate-axel.py`, `gate-alt.py`,
   `gate-seo.py`, `gate-superlativ.py`, `gate-lankar.py`, `gate-lager.py`,
   `gate-sku.py`) och `npx vitest run lib/polish` (99/99) kördes om efter
   rättningen — alla oförändrat gröna, ingen ny miss.

Fem `foto-tal.txt`-rader kvitterar bildräknade tal (ben, fötter,
sidostolpar, skåpsantal) som ordtal-varningen annars hade flaggat.

## Steg 5 — oberoende skeptisk granskning (efter OGRINDAD-TILL-WIX)

Läste om alla åtta texter en gång till som en skeptisk granskare, oberoende
av byggskripten: sakfel mot bilderna, motsägande tal, kvarvarande
tyska/engelska, för lång SEO/namn.

**Ett fynd** (`c4d8cb93`, se punkt 4 ovan) — rättat, grindarna omkörda.

**Sju texter utan anmärkning**: `8a076c08`, `b28e1cbe`, `1bc0c04e`,
`69513a61`, `3847b7ba`, `965ba956`, `093aedd2`. Enda punkten värd att notera
är `1bc0c04e`s spec-tabell, som (som alla andra produkters) skriver bara
"Mått:" utan kvalificeraren "Hopfällbar" — det är husets fasta 5-radiga
schema och ändras aldrig per produkt; nyansen ligger redan i
Egenskaper-listan ("Hopfällbar storlek …") och i brödtexten
("Fälls ihop för att spara plats"), så ingen kund kan läsa spec-tabellen
isolerat och tro att 140×133×43 är den uppfällda storleken. Samma
avvägning som redan gjordes och dokumenterades vid byggtillfället, nu
omprövad och bekräftad hålla.

## Läge

**OGRINDAD-TILL-WIX-commiten är pushad. Steg 5 (oberoende granskning) klar,
ett fynd rättat och omgrindat (se ovan). Nästa steg: pusha den här
rättningen, sedan Wix-skrivning i fyra steg.**
