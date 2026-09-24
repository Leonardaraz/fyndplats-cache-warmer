# Runda N29 — åtta produkter, 1 699–1 739 kr

Åtta Aosom-utkast polerade och publicerade: en elmotorcykel för barn, en
förvaringsmöbel med nio lådor, en cykelkärra för last, en sats skumklossar, en
gungställning med glidgunga, ett tunneltält för fyra, en inversionsbänk och en
väggmonterad tv-bänk.

☠️ **Prisplatån 1 699 kr bröts, och det var inte ett val.** N28 låg helt på
1 699. Vid det här urvalet fanns **tjugo** tyska utkast kvar på exakt det
priset, och nitton av dem var redan avvisade av N27/N28 eller är flaggade och
orörda. Kvar var EN — `ad46f9cc`, som N28 uttryckligen lämnade som "första
kandidat till N29". Rundan går därför 1 699 → 1 739 och tar det billigaste som
var rent i varje steg. **Cheapest-first är regeln, platån är en tillfällighet.**

| id | produkt | SKU | pris |
|---|---|---|---:|
| ad46f9cc | Elmotorcykel för barn 12 V – stödhjul, musik och 2,4–5 km/h | FP-elmotorcykel-barn-12v | 1 699 kr |
| 93b9d4da | Förvaringsmöbel för barn med 9 lådor – 113 cm i tre blå nyanser | FP-forvaringsmobel-9-lador | 1 719 kr |
| 681e5c63 | Cykelkärra för last 40 kg – 20-tumshjul och universalkoppling | FP-cykelkarra-last-40-kg | 1 719 kr |
| 5d2a44cf | Skumklossar 7 delar för 12–36 månader – tunnel, ramp och trappa | FP-skumklossar-7-delar | 1 719 kr |
| 16a26891 | Gungställning 280 cm med två gungor och glidgunga för två | FP-gungstallning-tva-gungor | 1 729 kr |
| c9c98333 | Tunneltält för 4 personer 555 cm – två sovrum och vardagsrum | FP-tunneltalt-4-personer | 1 729 kr |
| 346b40f7 | Inversionsbänk hopfällbar 0–90° – 21 lägen och 120 kg bärkraft | FP-inversionsbank-hopfallbar | 1 739 kr |
| b373ce2d | TV-bänk 180 cm väggmonterad – tre nedfällbara luckor, vit | FP-tv-bank-vaggmonterad-180 | 1 739 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (åtta körningar, åtta loggar lästa).
Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta,
ingen slutsåld, ingen låst. `aosomFreightShare` 0,217–0,375 — ingen i närheten
av 0,5-tröskeln. Saldon 13–126.

## ☠️ LAGERGRINDEN FÄLLDE PÅ RIKTIGT, OCH DET SYNS INTE I KATALOGEN

N28 dokumenterade att ett Aosom-saldo på 1, 2 eller 3 renderas som **0** i
butiken, eftersom `synligtSaldo()` drar av `LAGER_BUFFERT = 3`. Grinden är
skärpt sedan dess (`gate-lager.py` FÄLLER numera på `<= LAGER_BUFFERT`,
den varnar inte). Den här rundan mötte den hårdare varianten av samma fråga:
**två av tolv kandidater stod på exakt 0.**

| id | produkt | pris | `aosomSyncedQty` |
|---|---|---:|---:|
| `8acfd813` | Kleintierstall för dvärgkaniner och marsvin | 1 729 kr | **0** |
| `6df0ce88` | Aktenschrank / plåtskåp med justerbar hylla | 1 739 kr | **0** |

⚠️ **Ingenting i katalogen avslöjar det.** Båda ligger som synbart normala
utkast med rätt pris och `stämmer: true`, och BÅDA fick `las`-körningen att gå
grön — rutten varnar men fäller inte på ett korrekt pris med saldo 0. Det är
mappningsradens `aosomSyncedQty` som är facit, och det talet måste LÄSAS, inte
härledas ur `stämmer` eller ur jobbets exit-kod.

⚠️ **`aosomSyncedAt` är fortfarande ingen genväg.** `6df0ce88` bär en stämpel
från 2026-09-02 och har saldo 0; `c9c98333` bär 2026-09-06 och har 70. Samma
observation som N27 gjorde, en runda till.

Efter den här mätningen ligger rundans lägsta saldo på **13** (`16a26891`),
alltså tio över bufferten.

## Urvalet: fyra av tolv verifierade kandidater föll

Tjugosju kandidater i prisordning granskades i dubblettskärmen; tolv togs till
en FÄRSK `las`-körning. Fyra av dem föll.

### Två föll på saldo 0

Se tabellen ovan.

### En föll på DJURSKYDDSMÅTT — och den var inte avgörbar

`a2bf8b4d` (Schildkrötenbox, 1 719 kr, saldo 197) är ren i saldo, prisgrind och
dubblettskärm. Det som stoppar den är L 80 (SJVFS 2019:15), och problemet är
att frågan inte GÅR att avgöra på det källan ger:

| | |
|---|---:|
| Hela lådans yttermått | 120 × 55 cm |
| Invändig yta, huvudhus + soldel | 0,23 + 0,43 = **0,66 m²** |
| Höjd, fram/bak | 20/50 cm |

Källan anger **ingen art och ingen djurstorlek**, och L 80:s minimimått för
landsköldpaddor är en funktion av just ryggsköldens längd. För en vuxen
grekisk landsköldpadda hamnar kravet över 0,66 m²; för en mindre individ under.
Källan säger dessutom uttryckligen att lådan är AVSEDD att kombineras med ett
separat rastgärde ("kann mit einem Freilaufgehege kombiniert werden"), vilket
gör den till ett skydd i en större hage snarare än en komplett bostad.

☠️ **Samma hållning som N27 tog på kaninstallet `512a4396`: en L 80-fråga som
inte går att avgöra säkert på de uppgifter källan ger publiceras inte.** Raden
är **orörd** — varken polerad eller pensionerad — och flaggad nedan. Det är
inte ett konstaterat brott mot föreskriften, det är ett konstaterat
kunskapsglapp, och de två ska inte skrivas som om de vore samma sak.

⚠️ `8acfd813` (kaninstallet) bär samma fråga — rastgårdsdelen har bara **44,5
cm** fri höjd över 0,33 m² av golvet — men föll redan på saldo 0, så den
behövde aldrig avgöras.

### En föll på en PUBLICERAD dubblett som var exakt

`6db99b9b` (Hollywoodschaukel, 1 749 kr). Måtttrippeln 171 × 108 × 154 gav
träff mot publicerade `2de2c549` *Hammock med tak, 3-sits*, och närläsningen av
den publicerade sidan bekräftade det ordagrant: samma mått, samma 240 kg
maxlast, samma justerbara sufflett och ryggstöd. Samma vara.

### Åtta kandidater sållades bort FÖRE `las`

| id | produkt | varför |
|---|---|---|
| `6582af2b` | Gartenbank i metall 127 × 63 × 83 | trippelträff mot publicerade `42afe013` *Trädgårdsbänk med blommönster 127 cm* (samma mått, samma 240 kg) + två tyska utkastsyskon |
| `ce12af1c` | Schuhschrank 72 × 31,5 × 95 | trippelträff mot publicerade `c4497ca9` *Skoskåp 72 cm i svart högglans*; närläsningen ger samma fem fack varav tre flyttbara. 25 publicerade skoskåpssidor |
| `cae106e7` | Hundetrolley 112 × 65 × 100 | trippelträff mot publicerade `41fddd87` *Hundvagn för 30 kg som fälls ihop i ett steg*; samma 30 kg, samma ett-stegs-fällning |
| `5e3b71a7` | Barhocker 2-pack 50 × 55 × 93 | trippelträff mot publicerade `856d1d1d`; 22 publicerade barstolssidor och N28 publicerade nyss en till |
| `d4118d39` | Rumsavdelare 6 paneler | **redan svensk titel** och FEM publicerade rumsavdelare med samma mått — en färgsyskonsfamilj som redan är ute |
| `ce820686` · `3d945c3d` | Gaming-Sessel med kattöron | fyra utkastsyskon med IDENTISKT namn; dessutom går måttraden (`116-124H`) inte att tolka till en trippel |
| `b805ee4d` · `7ed73bad` · `9429fdc7` | Hundeanhänger / Lastenanhänger | egna utkastkluster, och rundan bär redan EN cykelkärra i `681e5c63`. 24 publicerade hundvagnssidor |
| `31bb560b` · `fd9c5f30` | Bodensessel / Hocker mit Stauraum | mättade familjer: 45 publicerade golvfåtöljer respektive 29 förvaringsbänkar — samma familjer N27 och N28 redan avvisade |

### En verifierad kandidat valdes bort med flit

`82d04879` (Freilaufgehege i galvat stål, 200 × 200 × 200 cm, 1 739 kr, saldo
39, `stämmer: true`) är ren i varje spärr. Den föll bara på att rundan tar åtta
och att tre kandidater delade priset 1 739 kr. Den ligger orörd som första
kandidat till N30.

⚠️ **Och den är ett RASTGÄRDE, inte ett hönshus** — källan säger "Passt perfekt
zu einem Holzstall" och produkten saknar både rede och sittpinne. Det är värt
att notera FÖRE nästa runda, för det tyska namnet säger "Hühnerstall" och
redeskravet i L 111 (som fällde N28:s `c5541fef`) gäller huset, inte hagen.
Den svenska texten måste skriva ut vad varan faktiskt är.

## ☠️ FLAGGAT TILL LEONARD: fyra affärsbeslut, inget av dem taget här

1. **`a2bf8b4d` — Schildkrötenbox, L 80-frågan går inte att avgöra.** Se ovan.
   Raden är orörd.
2. **`c5fc0b7b` — Angry Birds-dekaler på en Aosom-vara.** Flaggad av N27,
   fortfarande orörd. Frågan om Aosom har Rovio-licensen är inte besvarad.
3. **`16b8a47c` — papegojburen underskrider SJVFS 2019:15.** Flaggad av N27,
   fortfarande orörd.
4. **`c5541fef` — Zwerghühnerstall underskrider redeskravet.** Flaggad av N28,
   fortfarande orörd.

Ingen av de fyra har rörts av den här rundan: inget `las`, ingen stämpling,
ingen Wix-skrivning.

## Dubblettskärmen: full täckning i båda riktningarna

Skärmen kördes som `DUBBLETTMATNING.md` kräver — måtttrippel ur den TYSKA
källans egen `Technische Daten`, jämförd mot HELA katalogen i båda
riktningarna (publicerade sidor OCH övriga utkast) — och täckningen räknades.

| | omgång 1 (kandidatlista) | omgång 2 (kandidaternas trippel) |
|---|---:|---:|
| Lästa rader | **5 865** | **5 865** |
| Utan `plainDescription` | **0** | **0** |
| Publicerade | 3 031 | 3 031 |
| …med tolkbar trippel | **2 299 (76 %)** | **2 299** |
| Utkast | 2 834 | 2 834 |
| …med tolkbar trippel | **2 743 (97 %)** | **2 743** |

⚠️ `utanText` räknades i varje svep och var **0**. Utan den räknaren hade ett
svep som tappat `fields` på sida två gett noll krockar och sett ut att ha gjort
sitt jobb — det är exakt det felet DUBBLETTMATNING.md mätte upp till två
tiopotenser.

☠️ **Mönstret självtestades på BÅDA axelformerna i SAMMA anrop som svepet**,
och det är N28:s lärdom tillämpad i stället för återupptäckt. Sju former
prövades innan en enda rad lästes, och svepet avbryter om någon faller:

```
150L x 50B x 39H cm    bokstav EFTER talet    -> [150, 50, 39]     ✓
L130 x B73 x H90 cm    bokstav FÖRE talet     -> [130, 73, 90]     ✓
99,5 × 76 × 91 cm      utan bokstav           -> [99.5, 76, 91]    ✓
92cm x 63cm x 95cm     "cm" efter varje tal   -> [92, 63, 95]      ✓
45 x 45 x 47,5 cm      decimal sist           -> [45, 45, 47.5]    ✓
242B x 87T x 87H cm    B T H                  -> [242, 87, 87]     ✓
L99,5 x B76 x H91 cm   FÖRE med decimal       -> [99.5, 76, 91]    ✓
```

⚠️ **Formen `92cm x 63cm x 95cm` fanns inte i N28:s mönster.** Aosoms svenska
spec-flik skriver måttet så på en del rader, och ett mönster som bara tillåter
axelbokstaven (eller inget) mellan talet och `×` missar dem. Den lades till,
och fallet står i självtestet så det inte kan tystna igen.

**Träffarna på de åtta som blev kvar:**

| kandidat | trippel | publicerade träffar | utkastträffar | dom |
|---|---|---:|---:|---|
| `ad46f9cc` | 109,5 × 60 × 72,5 | 0 | 2 | två tyska syskon med IDENTISKT namn, inget publicerat |
| `93b9d4da` | 113 × 37 × 56,5 | 0 | 1 | falsklarm (en åkgrävmaskin) |
| `681e5c63` | 140 × 77 × 65 | 0 | 0 | — |
| `5d2a44cf` | 170 × 130 × 40 | 0 | 0 | — |
| `16a26891` | 280 × 140 × 178 | 0 | 0 | — |
| `c9c98333` | 555 × 225 × 190 | 0 | 1 | ett tyskt syskon, inget publicerat |
| `346b40f7` | 122 × 59 × 130 | 0 | 0 | — |
| `b373ce2d` | 180 × 31,5 × 29,8 | 0 | 0 | — |

☠️ **`ad46f9cc`:s två utkastsyskon är skälet den är publicerbar, inte skälet
den inte är det** — samma resonemang som N26:s färgsyskon, N27:s tyska syskon
och N28:s `0000fa76`. Det finns ingen PUBLICERAD sida för modellen, så en ny
sida skapar ingen levande dubblett. Presentationsfrågan (en sida eller tre)
står kvar som Leonards.

⚠️ **Och en trippel som inte går att läsa ur etiketten är inte en ren
produkt.** `6df0ce88`:s etikettrad (`Innenmaße: 80L x 34B x 81H`) är
INNERmåttet; produktens fotavtryck är 80 × 40 × 92,5. Skärmen tog det första.
Det spelade ingen roll här eftersom raden föll på saldo, men en generator som
läser `Maße` utan att se `Innenmaße` mäter fel låda — läs etikettraden, inte
bara talen.

## Facit bevisat mot skarpa Wix — 8 av 8 på första körningen

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret, alltså genom exakt
den transkribering huset har mätt upp som felkällan. Båda kontrollerades därför
mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` per produkt och hela bildlistan i ordning, jämförd på
servern.

**8 av 8 text LIKA, 8 av 8 bildlista LIKA.** Teckenantalen stämde också exakt —
men det är inte beviset: N27:s fällda avskrift hade RÄTT teckenantal och fel
summa. Det är summan som avgör.

## Sju sakfel hittade och rättade — fem av dem bara i bilderna

Husregeln från runda J1 (*"titta på bilderna FÖRE texten"*) betalade sig igen.

- ☠️ **`16a26891`: källan kallar den fjärde delen `Wippe` (vippa). Den är en
  hängande GLIDGUNGA.** Bilderna visar två sittbrädor mitt emot varandra som
  hänger i egna stänger från tvärröret och går fram och tillbaka — ingen
  vippaxel, ingen mittpunkt. Källan motsäger sig själv i samma text
  (`1 Gleiterset`, `Gleiter: 101L x 20B cm`), och bilden avgör. Det är ingen
  språklig nyans: en vippa och en glidgunga används olika och är olika farliga.

- ☠️ **`16a26891`: källan säger BÅDE "drei Kinder" och "vier Kinder".**
  Inledningen säger plats för tre barn, punktlistan fyra. Bilderna räknar: två
  gungsitsar plus en tvåsitsig glidgunga = **fyra**. Texten skriver fyra.

- ☠️ **`5d2a44cf`: sju delar men bara SEX former — och källan förklarar aldrig
  varför.** Den tyska listan räknar upp sex block och påstår i samma andetag
  "Sieben Schaumstoffbausteine". Bild 2 och 4 visar svaret: den halvrunda
  mattan finns i **två exemplar**, en vid trappan och en vid rampen. Talet 2 är
  kvitterat i `foto-tal.txt` eftersom det inte finns i källan.

- ☠️ **`5d2a44cf`: "Treppe" i produktnamnet är ingen egen del.** Trappan som
  syns på bilderna byggs av det låga blocket framför kubblocket — 15 cm upp och
  sedan 27,5 cm. Det är användbart att veta: trappan går att göra lägre, och de
  två delarna kan flyttas isär.

- ⚠️ **`5d2a44cf`: källan och måttbilden är oense om det låga blocket.**
  Tyskan säger `45L x 30B x 15H`, måttritningen säger **40 × 30 × 15**. Bilden
  gäller, som i N28:s `8ee517cc`. Talet 40 finns redan i källan för fyra andra
  delar, så siffergrinden ser ingen skillnad — det är ögat som gör det.

- ☠️ **`b373ce2d`: produktnamnet säger "3 Schubladen". Det finns inga lådor.**
  Fronterna är tre nedfällbara luckor med gångjärn i underkant, vilket bild 1
  visar med den vänstra öppen som en plan hylla. Källans brödtext har rätt
  (`Drei herunterklappbare Schränke`); det är NAMNET som är fel, och namnet är
  det kunden söker på.

- ⚠️ **`ad46f9cc`: sitsmåttets axlar är omkastade i källan.** Tyskan skriver
  `Sitzgröße: 15L x 36B`, måttbilden märker 36 cm längs sitsens långsida och
  15 cm tvärs över den. Sidan skriver 36 lång och 15 bred.

## Fyra bilder strukna, och en av dem inte för språkets skull

| id | position | vad bilden är |
|---|---:|---|
| `ad46f9cc` | 4 | tysk grafik: HINTERRADAUFHÄNGUNG · Zementstraße · Asphaltstraße · Ziegelstraße |
| `16a26891` | 4 | tysk grafik: rubriken ANGABEN över fyra detaljfoton |
| `b373ce2d` | 4 | tysk grafik: Hochglänzend Weiße Türen · Helle, moderne Oberfläche |
| `b373ce2d` | 5 | tysk grafik: Eine verantwortungsvolle Wahl · Sorge für die Natur |

☠️ **Och en femte: `346b40f7` position 4 är en BYTE-IDENTISK DUBBLETT av
position 2.** Två olika Wix-fil-id (`b379ce_fe0c7ced…` och `b379ce_c25efbf3…`)
med samma md5 — alltså en av Wix egna omimporter som huset redan mätt upp
(2026-08-28, "591 av 595 wixstatic-filer var kopior"). Den syns inte i någon
grind: `bygg-media.py` fäller bara när samma FIL-ID står två gånger, och
`gate-alt.py` räknar bara antalet rader. Det som fångade den var md5 på de
hemhämtade filerna inför kontaktarksgranskningen.

⚠️ **Tre produkter blir därmed fyrbildsprodukter och en trebilds.**
`bygg-media.py` och `gate-alt.py` räknar antalet ur `bilder.tsv` minus
`bilder-bort.tsv` i stället för att anta fem, så ingen av dem klagade.

## Ett husmärke flaggat till Leonard

| id | märke | var |
|---|---|---|
| `346b40f7` | SPORTNOW | tryckt på ryggstödets överkant, synligt i bild 1 och i måttbilden |

Bilderna är BEHÅLLNA. Husets praxis är publicera-och-flagga för
tredjepartsmärken i leverantörens foton, och måttbilden är den enda som visar
bänkens mått. Märket står inte i någon text, alt-text eller SEO-tagg.

⚠️ N11 valde bort en SPORTNOW-produkt av just det här skälet. Den bedömningen
gäller fortfarande som Leonards — det som är skrivet här är att raden är
publicerad enligt husets praxis och att märket är uppmätt, inte att frågan är
avgjord.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side) | **8 av 8 text LIKA, 8 av 8 bildlista LIKA** — rent på första körningen |
| Trippelmönstrets självtest (båda axelformerna, i samma anrop som svepet) | **7 av 7 former matchade** |
| `gate.py` (siffergrind mot `kallor.json`, ordlista, flikar, taggar) | **0 fynd i 8 filer**, 2 varningar (ren prosa, se nedan) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter, 3 axelkonflikter i källan (upplysning) |
| `gate-alt.py` | **REN**, 8 produkter, 35 alt-texter, 0 fynd |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` (skärpt: fäller på `<= LAGER_BUFFERT`) | **0 fynd** i 8 produkter, lägsta saldo 13 |
| `gate-sku.py` | **0 fynd** i 8 rader (längsta 28 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (51 filer, 399 SKU:er) | **8 av 8 unika, noll krockar, noll prefixöverlapp** |
| `gate-superlativ.py` | **REN**, 8 filer, inga kvitterade superlativ behövdes |
| `gate-lankar.py` | 0 fynd, inga korslänkar i rundan |
| Läcksvep över rundans KUNDVÄNDA filer (artikelnummer, husmärke, fraktland, leverantör, stavning, homoglyf, tysk rest) | **0 fynd i 13 filer** |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `lib/polish/artikelnummer-lackage.test.ts` | **grön** (3 tester) |
| `gate-kopior.test.ts` + `wixnorm-tvilling.test.ts` | **gröna** (6 tester) |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 3 (kategori, bulk add-items) | 6 anrop, `totalFailures: 0`, per-rad `success: true` på alla 8 |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | **8 av 8 skrivna**; `options` i både kropp och fältmask, `visible` medskickad |
| Samlad SEPARAT slutläsning av alla fyra stegen | **8 av 8 helt verifierade** |
| Mappningsstämpling + oberoende `las`-verifiering | **8 av 8** |
| Omskrivning av två texter efter språkrättelse (spärr + SEPARAT läsning) | **2 av 2 LIKA**, allt annat orört |
| `hamta-live.sh` + `livegrind.py` (ISR-medveten live-verifiering) | 8/8 HTTP 200, **8/8 REN, 0 avvikelser** (orddiff 0 på alla åtta) |

### De två kvarvarande ordtalsvarningarna är prosa

`gate.py` varnar för `346b40f7` "inte två lägen" och `b373ce2d` "köra runt fyra
ben". Båda är retoriska jämförelser med något produkten INTE är — inga
påståenden om varan — och de lämnas som de är. De två påståenden som VAR
fotoräknade (`93b9d4da` tre moduler, `5d2a44cf` två mattor) är kvitterade i
`foto-tal.txt` i stället, och försvann då ur varningslistan.

### Axelkonflikterna i källan

`gate-axel.py` rapporterar tre rader där tyskan och den svenska spec-fliken
använder olika bokstav för samma tal (`ad46f9cc` sitshöjden, `b373ce2d` bredd
och djup). Det är en upplysning om KÄLLAN, inte ett fynd i texten: facit byggs
positionellt av `bygg-axelfacit.py` och rundan skriver måtten som rena
tripplar. Priset är att grinden varnar för 22 "saknade egna mått" — en varning
den ska ge, och rätt avvägning.

## Kategorier

| id | kategori |
|---|---|
| ad46f9cc (elmotorcykel) | Barn & Familj → Leksaker & Spel |
| 5d2a44cf (skumklossar) | Barn & Familj → Leksaker & Spel |
| 93b9d4da (förvaringsmöbel) | Hem & Inredning → Förvaring & Organisering |
| b373ce2d (tv-bänk) | Hem & Inredning → Förvaring & Organisering |
| 681e5c63 (cykelkärra) | Sport & Fritid → Bil & Cykel |
| 16a26891 (gungställning) | Trädgård & Utemöbler → Utelek & Spel |
| c9c98333 (tunneltält) | Sport & Fritid → Friluftsliv & Resa |
| 346b40f7 (inversionsbänk) | Sport & Fritid → Träning & Gym |

Kategori-id:na lästes ur ett FÄRSKT `categories/v1/categories/query`-svar
(54 kategorier) i samma anrop som skrivningen — aldrig ur minnet, aldrig ur en
tidigare rundas anteckning.

⚠️ Slutläsningen visar `antalKat: 2` på alla åtta — den kopplade kategorin plus
Wix egna `All Products`, som Wix lägger till själv.

## Fotoräknade tal, kvitterade

`foto-tal.txt` bär fyra rader. Alla är avlästa på produktens egen måttbild
eller räknade på ett foto, och ingen står i den tyska källtexten:

| id | tal | vad |
|---|---:|---|
| `93b9d4da` | 3 | antal moduler och antal blånyanser, räknade på bild 1 och 5 |
| `5d2a44cf` | 6 | antal olika former, räknade på måttbilden (bild 3) |
| `5d2a44cf` | 2 | antal likadana halvrunda mattor, räknade på bild 2 och 4 |
| `c9c98333` | 80 | liggplatsens bredd i golvplanen (bild 3) |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N28: inget `kort-filer.tsv` finns i rundans
katalog, så ingen produkt fick ett eget faktakort.
`bygg-medieskrivning.py` skriver då bildlistan exakt som `bygg-media.py`
lämnade den, och rapporterar "inget kort denna runda" per produkt — ett
uttalat val, inte en tyst utelämning.

## ☠️ Två egna språkfel hittade av ÖGON på filen — efter publiceringen

Alla grindar var gröna. Båda felen är böjningsfel som ingen mönstergrind i
huset kan se, och de hittades först när filerna lästes igenom rad för rad
efter att sidorna gått ut:

| id | stod | ska vara |
|---|---|---|
| `5d2a44cf` | Ytan är konstläder, alltså **slätt och tätt** | **slät och tät** (yta är n-genus) |
| `b373ce2d` | varje smäll är **en ryck** i infästningen | **ett ryck** (ryck är t-genus) |

⚠️ **Det här är precis den halva av regeln som inte är mekaniserbar.** Husets
regel säger *skriv i en fil FÖRST* — och skälet är att en fil går att grinda.
Men `gatelib` har ingen genusgrind, och kan inte få en: en/ett-fel går inte att
skilja från korrekt svenska med ett mönster. Det som fångar dem är att någon
LÄSER filen, vilket är den andra halvan av samma regel och den som är lätt att
hoppa över när tolv grindar redan svarat grönt.

☠️ **Rättelsen är gjord enligt samma disciplin som originalskrivningen**, inte
som en snabbfix: filerna ändrades, `raahash.py` och `hasha.py` kördes om, hela
grindkedjan kördes om (0 fynd), steg 1 skrevs om för BARA de två produkterna
med kontrollsumman i samma anrop, och en SEPARAT senare läsning bekräftade
**2 av 2 LIKA** mot det nya facit — med media, kategorier, SKU, båda
synlighetsflaggorna och priset oförändrade.

✅ **Och live-grinden bevisade sig själv på köpet.** Svepet som redan låg hämtat
när rättelsen gjordes grindades mot de NYA filerna, och gav exakt de sex
orddiffar rättelsen består av — inget mer, inget mindre:

```
5d2a44cf   ORDDIFF - slät / + slätt      ORDDIFF - tät. / + tätt.
b373ce2d   ORDDIFF - ett  / + en
övriga 6   diff=0 -> REN
```

Det är `livegrind.py` verifierad åt båda hållen på skarp data: den fäller på en
ändring av **tre bokstäver** i en text på 3 800 tecken, och bara på den. Samma
sorts tvåvägsbevis som huset kräver av varje grind som ska få räknas som
levande.

## Live-verifiering: 8/8 REN, 0 avvikelser

`hamta-live.sh 90` + `livegrind.py` mot de publicerade, ISR-färska sidorna
efter rättelsen: **8/8 HTTP 200 (145–153 kB), 8/8 REN, 0 avvikelser i den
PUBLICERADE texten**, och grinden avslutar med `exit 0`.

Orddiffen mot källfilen är **0 på alla åtta** (430–572 ord per sida). `REN`
betyder att samtliga delkontroller gick igenom, inte bara orddiffen:
homoglyfsvepet, sid-, alt- och SEO-svepen, de tre obligatoriska flikrubrikerna
som `<summary>`-element, brödsmulans andra led (alltså en riktig kategori, inte
`Hem / Butik / produkt`) och `OutOfStock`-kollen. SEO-svepet jämför `<title>`,
`description`, `og:title` och `og:description` EXAKT mot `seo.tsv`, och
alt-svepet läser in i `alt=""` — de två ställen där tyska rester annars
överlever en felfri textpolering.

⚠️ **Åldrarna lästes innan svepet togs på allvar**, och de är enhetliga:
**99–100 sekunder på alla åtta**, alltså precis pausen mellan omträffen och den
skarpa hämtningen. Ingen sida serverades ur en äldre rendering — till skillnad
från N26:s `66d781f8` (`age: 431`) och N27:s `e5049d65` (`age: 450`).
**Läs `age` innan du litar på ett svep.**

Rundans fyra Wix-skrivsteg är dessutom redan oberoende verifierade var för sig
i en separat, senare läsning (tabellen ovan), så live-grinden är det FEMTE
ledet, inte det enda.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i flera separata
led: facit mot skarpa Wix innan grindarna (8/8 LIKA på första körningen),
textinnehållet efter skrivningen mot fil-hash i en senare, separat läsning,
bild/kategori/SKU/pris i samma slutläsning (8/8 helt verifierade, med både
produktens och VARIANTENS `visible: true` och priset oförändrat),
mappningsstämpeln via åtta oberoende `las`-körningar, och den publicerade sidan
via `livegrind.py` (8/8 REN, orddiff 0).

Två av de åtta texterna skrevs om efter publiceringen för två svenska
böjningsfel som ingen grind kan se, och den omskrivningen gick genom hela
kedjan igen: grindar, transkriberingsspärr, separat återläsning och ett nytt
live-svep.

Rundan räknas som klar utom faktakorten, som är en medveten uppskjutning av
samma skäl som N15–N28.
