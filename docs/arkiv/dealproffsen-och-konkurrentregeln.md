# Arkiv: prisjämförelse mot dealproffsen och konkurrentregeln

Arkiverad 2026-10-21 på Leonards besked: *"vi ska inte jämföra med dom"*. Texterna är
flyttade ordagrant ur `CLAUDE.md` och är historik, inte instruktion. Jämförelsen körs inte,
ingen rad får `prisgrupp` och ingen kandidat väljs efter dealproffsens pris. Koden som
beskrivs finns kvar tills Leonard beslutar om borttagning (listan står i `CLAUDE.md`,
avsnittet *Dealproffsen: vi jämför inte med dem*).

---

## Prisjämförelse mot dealproffsen (`lib/pricing/dealproffsen.ts`)

Leonards strategi 2026-09-14: *"vi ska jämföra alla våra priser mot
dealproffsen.se … Alla produkter som vi är billigast på ska vi först ändra
priset så vi ligger endast 1-2 procent under dom och inte flera 100kr som vi
gör nu på vissa produkter och sen ska vi göra reklam på just dessa produkter i
google shopping."* Och: *"Vi skiter i aliexpress produkterna helt."*

Jämförelsen gör två jobb i samma körning. Det andra är inte en bieffekt utan
ett uttryckligt krav — *"vi måste jämföra alla våra produkter sen även de som
inte är polerade … dom som inte är polerade proioriterar vi next"*:

1. **Var är vi billigare**, och med hur mycket — underlaget för både
   prisjusteringen och annonsurvalet.
2. **Vilka OPOLERADE utkast vi vore billigast på** — poleringskön sorterad
   efter var pengarna ligger i stället för efter vad som råkar ligga överst.

☠️ **RUTTEN SKRIVER INGENTING, och kan inte.** Den mäter. Samma hållning som
prisreparationens "det finns ingen kör-allt-flagga": ett pris som når kund ska
ha passerat ögon.

### Matchningen är mekanisk, inte en gissning

De publicerar Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD. Vårt
`supplierProductId` mot deras `reference` matchar exakt eller inte alls.

☠️ **Därför finns ingen namn- eller måttmatchning, med flit.** Huset har redan
mätt att måttjämförelse är otillräcklig som ensam grund (hörnsoffan `69c5e15c`),
och en felmatchning här sätter fel pris på fel vara.

### Vägen in mättes fram — fyra alternativ föll

| väg | varför den inte duger |
|---|---|
| `sitemap.xml` | finns inte |
| `/api/products` | `401` |
| Google-feed-modulens sökvägar | `404` |
| Kategorisidornas HTML | **4 av 48 kort** bär artikelnumret |

Det som fungerar är deras egen, odokumenterade sök-JSON:
`?controller=search&ajax=1&resultsPerPage=100&s=<prefix>&page=<n>`. Uppmätt:
**200 av 200 rader bar `reference`**, pagineringen överlappar inte, och
prefixen härleds ur VÅR katalog — alltså ~120 anrop i stället för 4 754.

☠️ **PRISET ÄR `price_amount`, ALDRIG `regular_price_amount`.** Det andra är
det överstrukna. Uppmätt på redskapsboden: **4 289 mot 6 049**. Alla deras
rader ligger på "Kampanj", så fel fält hade gjort HELA katalogen 41 % dyrare än
den är — och vi hade höjt våra priser på ett underlag som lutar åt exakt det
dyra hållet.

### Sju egenskaper som inte ska tas bort

1. ☠️ **Svaret bär ALDRIG artikelnumret.** Rapporten hamnar i en PUBLIK
   Actions-logg, och artikelnumret är exakt den sträng dealproffsen publicerar
   — läcker vi den joinar vem som helst vår sida mot deras och därmed mot vårt
   inköpsled. Raderna nycklas på `wixProductId`, som redan står i produktsidans
   JSON-LD. Ett test fäller om ett artikelnummer kryper in i rapporten.
2. ☠️ **Ett uteblivet fynd är ingen jämförelse.** En vara de inte säljer hamnar
   i `utanTraff`, aldrig i `viBilligare`. Skillnaden är hela skillnaden mellan
   "vi vet att vi är billigast" och "vi vet ingenting" — och det andra hade
   blivit en prishöjning på lösan sand. Samma hållning som `utanWixPris` och
   som `unknown` i hyllstatusen.
3. ☠️ **"De säljer den inte" och "vi kunde inte fråga" är skilda tal.** En rad
   utan artikelnummer räknas i `utanArtikelnummer`. Slås de ihop ser en trasig
   mappningsrad ut som ett mätvärde om deras sortiment.
4. ☠️ **Facit är BUTIKEN.** Priset läses ur `listV3ProductPrices`, aldrig ur
   mappningens `grossSek` — samma förväxling som kostade prissynken en månad.
   Har produkten flera varianter med olika pris finns inget entydigt pris, och
   raden räknas i `utanVartPris` i stället för att gissas.
5. ☠️ **Samma artikelnummer två gånger → LÄGSTA priset vinner.** Ett svep
   hämtar hundra rader i taget och samma vara kan ligga i mer än en träfflista;
   låter man den SISTA vinna beror utfallet på sidordningen. Det lägsta priset
   gör oss mindre billiga i rapporten, aldrig mer — fel åt det hållet kostar en
   utebliven annons, fel åt det andra en prishöjning på ett pris kunden aldrig
   behövde betala.
6. ☠️ **En delkörning jämför bara de prefix den FAKTISKT hämtade.** Utan den
   filtreringen hade varje produkt vars prefix ligger senare i markören räknats
   som "de säljer den inte" när sanningen är "vi har inte frågat än" — punkt 2
   fast på körningsnivå. `fullstandig: false` diskvalificerar dessutom
   rapporten som beslutsunderlag, samma roll som i mediainventeringen.
7. ☠️ **En markör som inte rör sig är inget framsteg.** Faller varje prefix i
   ett varv står markören kvar, och utan spärren kör loopen om exakt samma
   anrop tills `varv` tar slut, bokför samma rader en gång till och ser i
   summeringen ut som ett svep som gjorde något. Uppmätt mot en stubbe innan
   rutten nådde produktionen — tillsammans med massfel-grinden och den
   framåtgående markören, alla tre.

⚠️ **Massfel fäller, en enstaka miss varnar** — samma form som
`MASSFEL_ANDEL`/`MASSFEL_GOLV`. Att INGET prefix gick att hämta är däremot inte
en miss: då vet körningen ingenting alls, och det får inte se ut som ett svar.


---

### ☠️ Gap-listan rankar PENGAR, inte vad som är värt att polera (2026-09-15)

Rapporten svarar på "var är vi billigare". Läst som en poleringskö svarar den
på fel fråga, och första gången den användes så pekade den rakt fel.

**1 577 opolerade utkast där vi är billigare, 532 235 kr i samlat gap.**
Rankat på kronor ligger fåtöljer och trädgårdsmöbler i topp. Båda är fel
svar, och skälen är olika:

☠️ **Fåtöljfamiljen är MÄTTAD.** Femton kandidater ur listans topp ställdes
mot de 247 publicerade sittmöblerna på måtttrippeln:

| | |
|---|---:|
| kandidater med minst en krock | **14 av 15** |
| krockar totalt | **63** |
| kandidater med EXAKT samma mått som en publicerad sida | 4 |

En av dem (`1bf87dc9`, 79 × 64 × 52) matchar **fyra** publicerade färgsidor
av samma stol. Pengarna ligger alltså i den familj katalogen redan täcker —
och en nionde sida för samma fåtölj är just den dubblett Google straffar.

⚠️ **Trädgård är fel SÄSONG.** 285 kandidater och 137 770 kr, i mitten av
september. En utegrupp som poleras nu får sin första besökare om sju
månader.

**Urvalsregeln är därför gap PER PUBLICERAD SIDA i samma kategori**, med
säsongen som filter ovanpå. Samma data, annan sortering:

| kategori | kandidater | gap kr | publicerade | gap/sida |
|---|---:|---:|---:|---:|
| trädgård/ute | 256 | 127 330 | 132 | 965 |
| **soffa/bäddsoffa** | **79** | **50 430** | **48** | **1 051** |
| matbord/matgrupp | 45 | 27 290 | 36 | 758 |
| säng/madrass | 63 | 20 010 | 28 | 715 |
| fåtölj/recliner | 114 | 75 530 | 225 | **336** |

Fåtöljer är näst störst i kronor och NÄST SIST per sida. Det är hela
skillnaden mellan de två läsningarna.


---

## Konkurrentregeln: pris mot dealproffsen i synken (`lib/pricing/konkurrentregel.ts`, 2026-09-15)

Marknadsplan v3 (Cowork-sessionen 2026-09-15) gjorde Leonards strategi till
en regel som synken tillämpar var sjätte timme, i stället för 900 handsatta
priser som synken hade skrivit över till kvällen:

```
golv = husets regelpris (1,20 × landad, charmavrundat)   — aldrig under
mål  = (1 − d) × dealproffsens pris                      — d = 2 % (grupp A) / 5 % (grupp B)
tak  = 1,50 × landad kostnad inkl. moms                  — aldrig över
pris = min(max(mål, golv), tak), avrundat NEDÅT till charmpris
```

Grupp A mot B är ett test — "räcker 2 % under för en okänd butik?" — och
efter fyra veckor blir vinnaren regel för hela sortimentet.

Tre delar, två grindar:

| del | var | skriver |
|---|---|---|
| dealproffsens pris per rad (`konkurrent: { pris, hamtad }`) | `/api/admin/konkurrentpris?lage=spara`, workflow **"Pris — konkurrentregeln"** | mappningen, torrt som default |
| A/B-grupp per rad (`prisgrupp`) | samma rutt, `lage=lotta`, kräver `bekrafta` = torrkörningens antal | mappningen, torrt som default |
| kundpriset | Aosom-synken, `planeraProdukt` | Wix, synkens egen torrkörning |

### Sex egenskaper som inte ska tas bort

1. ☠️ **Ingen grupp, ingen regel.** En rad utan `prisgrupp` följer husets regel
   exakt som förut. Att deploya koden ändrade inte ett enda pris — utrullningen
   är per rad, via lottningen, och lottningen tar `bara=<wix-id,…>` så
   annonsurvalet styr vilka som går in först.
2. ☠️ **Ett gammalt konkurrentpris FRYSER raden, det prissätter den inte.**
   Äldre än `KONKURRENT_MAX_ALDER_DAGAR` (7) → inget pris skrivs, och raden
   räknas i `konkurrentFrysta` som står i loggraden, audit-raden och
   workflow-summeringen. Att falla tillbaka på golvet hade sänkt priset 200 kr
   på tusen varor för att jämförelsen stod still. **Går `frysta` upp har
   `spara` slutat köras** — kör den.
3. ☠️ **Deras pris under vårt golv → vi står kvar på golvet.** Vi jagar inte
   nedåt. Utfallet är eget (`konkurrentGolv`) så annonsurvalet kan lyfta ut
   raden i stället för att betala klick vi förlorar.
4. ☠️ **Taket finns för att vi inte vet var Amazon ligger.** Gapet mot
   dealproffsen är över 30 % på 136 av de 972 publicerade där vi är billigare,
   och 2 % under dem hade lyft oss över vad marknaden tål. 1,50 × landad är
   +25 % mot regelpriset, vilket dessutom håller varje ändring under
   `MAX_PRISANDRING_PCT = 40` — spärren rördes inte, och de 34 rader som annars
   fastnat i den gör det inte.
5. ☠️ **Avrundningen går NEDÅT.** charm9/charm99 rundar upp, och 2 % under
   2 495 hade blivit 2 499 — över konkurrenten, på en regel vars enda poäng är
   att ligga under. `rundaNedat` kliver ner i rutnätet tills priset ligger på
   eller under målet; charm99:s 89 → 99-snäpp gör att det ibland är två steg.
6. ☠️ **`spara` raderar aldrig.** En vara de inte säljer i dag behåller sitt
   gamla pris på raden och får åldras in i frysningen (punkt 2). Ett
   oförändrat pris skrivs om först när stämpeln är äldre än
   `UPPFRISKNING_DAGAR` (2), så en full körning inte äter tidsbudgeten med
   4 000 identiska skrivningar.

Lottningen är deterministisk (FNV-1a på wix-id): en omkörning ger samma grupp,
och under `LOTTNING_FRAN_SEK` (2 000 kr) blir alla A, för där finns bara ~6 %
att ta och 5 % under är samma sak som ingen höjning.

Verifierat mot koden samma dag, inte mot briefen: momsbasen är rätt
(`landadKostnadSek` bruttar upp nettot, multiplikatorn ger slutpriset — netto
mot netto blir 16,7 %), frakten ingår redan i landad kostnad och skalar med
vikten (briefens "240–290 kr platt" var fel), och `MAX_PRISANDRING_PCT` hade
fällt 34 rader utan taket. Fyrtioen tester: arton på regeln, tretton på
planerna, tio i synken — bland dem kontrollerna åt andra hållet (samma fixtur
utan grupp skriver inget; samma rad med färskt pris skrivs).

