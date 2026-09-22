# Runda N33 — åtta produkter, 1 649–1 899 kr — UTKAST (före skrivningen)

> ☠️ **UTKAST. INGENTING ÄR SKRIVET TILL WIX.** Rundans filer är skrivna,
> grindade, committade och pushade. Varje Wix-anrop i den här rundan har varit
> en LÄSNING (`hasMutations: false`), och de enda körningarna av
> "Polering — läs och stämpla mappningsraden" var läget `las`. Ingen
> stämpling, ingen skrivning, ingen publicering. En separat granskning läser
> filerna innan något skrivs. Avsnitten om steg 1–7 saknas med flit.

Åtta Aosom-utkast: en basketkorg för vägg med genomskinlig skiva, ett 2-pack
matstolar i sammetslook, en matsalsbänk, två sideboards, en varmluftsfritös
med miniugn, en massageapparat för fötter och vader och ett matbord med dolda
fack.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 82000c6b | Basketkorg för vägg 110 × 70 cm – genomskinlig skiva och fjädrande ring Ø45 cm | FP-basketkorg-genomskinlig-110x70 | 1 649 kr | 69 |
| 2f251ce3 | Matstolar 2-pack i grå sammetslook – skalformad rygg och ben i gummiträ | FP-matstolar-sammet-gra-2-pack | 1 719 kr | 149 |
| 5c566983 | Matsalsbänk 120 cm med ryggstöd – gräddvit linnelook, bär 240 kg | FP-matsalsbank-120-ryggstod | 1 869 kr | 182 |
| 07565140 | Sideboard 100 cm i lantstil – vit, skiva i träton, låda och kryddhylla i dörren | FP-sideboard-lantstil-100-cm | 1 869 kr | 86 |
| 30f2151f | Varmluftsfritös och miniugn 36 liter – grillspett, 1800 W och 230 °C | FP-varmluftsfritos-miniugn-36-l | 1 899 kr | 101 |
| dbedaf4c | Sideboard 105 cm med fyra lådor och skåp – vit med svarta handtag | FP-sideboard-vit-105-fyra-lador | 1 899 kr | 27 |
| b2b731c7 | Fot- och vadmassage med luftkompression och värme – fälls ihop till pall | FP-massage-fotter-vader-luft | 1 899 kr | 94 |
| b3efdd39 | Matbord 120 × 60 cm med två dolda fack under skivan – vitt, för fyra | FP-matbord-120x60-dolda-fack | 1 899 kr | 197 |

Alla tio `las`-körningar (de åtta plus två reserver) svarade `supplier:
"aosom"`, `needsAiPolish: true`, `draftStatus: "pending_review"` och
prisgrinden `stämmer: true` (`1,20 × landedCostSek`, charm99). Ingen slutsåld,
ingen låst, ingen visade `prisgrupp`. `aosomFreightShare` 0,195–0,436 — ingen
över 0,5. Saldon 27–197. Körda med `ref: main`, alltså mot den mergade
workflowen med allowlisten, run 3663–3672 (tio loggar lästa, produkt-id
kontrollerat i varje logg):

| run | id | variant-id (för steg 4) | SKU i dag | frakt |
|---:|---|---|---|---:|
| 3663 | 82000c6b | `97e5a974-f4cd-40f2-99ac-64bb7603cab7` | FP-basketballkorb-fur | 0,429 |
| 3664 | 2f251ce3 | `0cfd6500-955b-4180-a6db-ea43b6d741f3` | FP-2er-set-stuhle | 0,297 |
| 3665 | 5c566983 | `8c823377-d418-4998-8b4c-c28d3baf1558` | FP-esszimmerstuhl-ohne | 0,346 |
| 3666 | 07565140 | `4e629477-c598-4624-ac49-143c4fcf1e0f` | FP-sideboard-landhausstil | 0,428 |
| 3667 | 30f2151f | `c0e5b31b-a4d1-40cd-95b9-a0efada21a5d` | FP-hei-luftfritteusen | 0,297 |
| 3668 | dbedaf4c | `8a11c8aa-fcae-462a-9e7f-a25f70d50729` | FP-sideboard-kommode | 0,436 |
| 3669 | b2b731c7 | `1614e3bb-93cd-442e-b9a2-76d26418d1a6` | FP-2-in-1-beinmassagegerat | 0,195 |
| 3670 | b3efdd39 | `656fbb4c-286b-4044-b68d-69f3fd080f25` | FP-esstisch-mit-verstecktem | 0,331 |
| 3671 | e74feea1 (reserv) | — | — | 0,268 |
| 3672 | 13a52237 (reserv) | — | — | 0,325 |

⚠️ Steg 4 ska ändå läsa variant-id och revision ur en FÄRSK `GET` i samma
anrop som skrivningen, som i N32. Tabellen är en daterad anteckning, inget
facit. Revisionerna vid rundans slutläsning: `82000c6b` 2, `2f251ce3` 4,
`5c566983` 2, `07565140` 4, `30f2151f` 2, `dbedaf4c` 2, `b2b731c7` 5,
`b3efdd39` 1 — alla `visible: false`, alla `IN_STOCK`.

## ☠️ Priserna flyttade sig INNAN rundan — och golvet med dem

N32 slutade på 1 859 kr och lämnade `82000c6b` och `5c566983` på 1 869 kr och
reserverna `30f2151f` och `2f251ce3` på 1 899 kr. När N33 läste katalogen var
två av de fyra billigare än golvet:

| id | vid N32 | vid N33 | `aosomSyncedAt` |
|---|---:|---:|---|
| `82000c6b` | 1 869 kr | **1 649 kr** | 2026-09-22 20:13:54 — synken |
| `2f251ce3` | 1 899 kr | **1 719 kr** | 2026-09-21 12:20 — stämpeln rördes INTE |
| `5c566983` | 1 869 kr | 1 869 kr | 2026-09-15 |
| `30f2151f` | 1 899 kr | 1 899 kr | 2026-09-22 00:20 |

Under rundan körde någon annan **"Aosom — synka lager och priser"** från `main`
tre gånger (run 32 19:58–20:02 `failure` — inte undersökt, inte rundans jobb;
run 33 20:08–20:30 och run 34 20:31–20:33, båda gröna). `066a7f98` gick från
1 949 till 1 779 kr MELLAN två av rundans egna svep. Rundans `las` kördes
20:35, efter run 34, och prisgrinden sa `stämmer: true` på alla tio — alltså
följde priset kostnaden.

⚠️ **`2f251ce3` är samma mönster som N32 såg på `41b2bc81` och `2808fff3`:**
pris och kostnad har ändrats utan att `aosomSyncedAt` flyttats. Vilket jobb som
skrev är inte fastställt. Det är värt en egen titt för den som äger prisjobben.

☠️ **Följden för urvalet:** de fyra som N32 namngav togs med även om två nu
ligger under 1 859 kr — de var rundans uttryckliga överlämning. Men samma
sänkningar har flyttat andra utkast under golvet: **141 utkast i lager ligger
nu mellan 1 600 och 1 858 kr** (räknat vid rundans slutläsning). De flesta är
redan avvisade familjer, men en runda som bara går uppåt från "där förra
slutade" ser aldrig de som föll under. Det är inte prövat här.

## Urvalet: 5 984 rader svepta, 115 utkast i spannet 1 859–1 999 kr

### Dubblettskärmen: full täckning, tre pass

| | pass 1 (kandidatlista 1 859–1 999 kr, två svep) | pass 2 (kortlistan, permutationsokänslig) |
|---|---:|---:|
| Lästa rader | **5 984** | **5 984** |
| Sidor | 60 | 60 |
| Utan `plainDescription` | **0** | **0** |
| Publicerade | 3 063 | 3 063 |
| …med tolkbar trippel | **2 431 (79 %)** | 2 431 |
| Utkast | 2 921 | 2 921 |
| …med tolkbar trippel | **2 921 (100 %)** | 2 921 |

Samma metod som `DUBBLETTMATNING.md`: svepet går OFILTRERAT, `fields` skickas
om på varje sida och `utanText` räknas — **0** i alla tre svepen. Mönstret
självtestades på alla sju former (bokstav efter, bokstav före, utan bokstav,
`cm` efter varje tal, decimal sist, B T H, bokstav före med decimal) i SAMMA
anrop som varje svep — **7 av 7** varje gång; svepet hade avbrutit annars.

**Pass 1** ställde varje utkast i lager mellan 1 859 och 1 999 kr mot hela
katalogen på trippel (±1/±1/±2) — ordnad, eller permuterad när största måttet är
minst 60 cm; ett paketmått räknades bara över samma golv — mot publicerade
sidor och mot BILLIGARE utkast, plus identiskt namn mot alla utkast. **Pass 2** ställde de
elva på kortlistan (åtta, två reserver och `cd8d8524`) mot hela katalogen igen,
nu permutationsokänsligt och utan golv. Varje träff utanför paket-mot-paket
lästes:

| kandidat | träff | utfall |
|---|---|---|
| `dbedaf4c` | `66eb7361` (utkast, 2 439 kr), 105 × 40 × 76 | **svart färgsyskon** — identisk specifikation, `Farbe: Schwarz`. Den vita är billigast och ingen av dem är publicerad. Poleras den svarta senare blir den ett färgsyskon. |
| `b3efdd39` | `a67f4999` (utkast, 1 299 kr), 120 × 60 × 75,5 | annan vara: ett fällbart bord på hjul (60–120 cm) med låda och skåp |
| `b3efdd39` | `fba6f1f4`, `4164ae56` (publicerade skrivbord 120 × 60) | annan vara: skrivbord med stålram |
| `07565140` | `6f4cd43f` (utkast), lådans innermått | annan vara: högskåp 68 × 38 × 170 cm |
| `07565140` | `05ca8823` (utkast), 100 × 40 × 81 permuterat | annan vara: plåtskåp |
| `2f251ce3` | `271811f3` (utkast, 1 359 kr), 55 × 58 × 82 inom toleransen | annan vara: bistroset i metall |
| `30f2151f`, `b2b731c7`, `e74feea1` | fåtöljer, pallar, fällstolar, ett hantelset | sammanfall på delmått |
| `82000c6b`, `5c566983`, `13a52237`, `cd8d8524` | — | **0** träffar utanför paketmått |

**Pass 3 — på namn**, för det en trippel inte ser: alla publicerade sidor med
*basket*, *bänk*, *sideboard/skänk/byrå*, *varmluft/miniugn/fritös*,
*spelbord/biljard/pingis*, *massage*, *smycke*, *spegel*, *matstol*,
*matbord*, *hundvagn*, *scott/biceps*, *skrivbordsstativ* och *leksakshylla*
listades och jämfördes:

- Tre publicerade väggkorgar: `db1d494f` (svart skiva 110 × 75, 23 cm från
  väggen), `db1118d0` och `8a9b1da9` (båda 113 × 61 × 73, 12 kg). `82000c6b`
  är 110 × 28 × 70 med genomskinlig skiva och 13,5 kg — en egen modell. Men se
  bildavsnittet: bild 2 är samma scen som `db1d494f`:s bild 2.
- Ingen publicerad matsalsbänk. Ingen publicerad sideboard på 100 × 40 × 81
  eller 105 × 40 × 76.
- Den publicerade `c26677bf` *Miniugn 36 liter med varmluft och grillspett* är
  1 500 W och 53,1 × 38 × 35 cm — en annan modell än `30f2151f` (1 800 W,
  54 × 48 × 48,2).
- Ingen publicerad massageapparat för fötter och vader.
- De publicerade matstolarna i grå sammet är 4-pack (`e768ff5c`); ingen har
  `2f251ce3`:s mått.

### Avvisade i spannet

**Publicerade dubbletter:**

| id | produkt | pris | krockar med |
|---|---|---:|---|
| `d42c5b69` | Curlbank & Trizeps-Extension | 1 949 kr | `9521d113` *Scottbänk 2-i-1 för biceps och triceps* — 105 × 95 × 80, 25 vinklar, 120 kg |
| `d66937fb` | Ausziehbarer Esstisch 160 × 75 × 77 | 1 919 kr | `12889c63` *Utdragbart matbord 120–160 cm* |
| `da0e9379` | Mini-Gefrierschrank 35 L | 1 999 kr | fyra publicerade minifrysar 35 liter, 47 × 44,2 × 48,8 |
| `b1dc7de9` | Kinder-Traktor elektrisch | 1 999 kr | `91d28d6f` *Eltraktor för barn* (136,5 × 50 × 52,5) |
| `4530be32` | Kinder-Elektroauto 103 × 58 × 41 | 1 999 kr | `4d989256` *Elbil för barn – Audi RS e-tron GT* |
| `b84f79ea` | Kinder-Baufahrzeug 100 × 63 × 56 | 1 969 kr | `3b992525` / `ed84746c` *Kawasaki Teryx KRX elbil* — dessutom ett märke |
| `3c41342e` | 4-in-1 Boxsack-Ständer 160–230 cm | 1 999 kr | `f0430bc5` *Boxningsstation 160–230 cm* — samma höjdspann och paketmått; bara paketet är trippeljämfört |
| `eb8bdf09` | Hühnerauslauf 300 × 170 × 190 | 1 999 kr | `9158341c` *Hönsgård med tak 300 cm* (också djurboende) |
| `a32b547e`, `0625d9a7` | Katzenhaus, Agility Steg | 1 859 kr | redan avvisade av N32 |

**Färgsyskon till publicerade sidor:** `e9ecc251` (elektriskt
skrivbordsstativ i svart — samma 70–118 cm, 100–156 cm, 28 mm/s, 100 kg och
22,5 kg som publicerade `7ab49b8a` i vitt) och `a7e5b918` (leksakshylla
140 × 30 × 90 i vitt — samma boxar och samma 27,4 kg som publicerade
`8832b73a`). Se `FARGSYSKONEN.md`.

**Licens, djurboenden och kluster** — alla skrivna i `FLAGGADE.md`
(N33-raderna) och orörda: inget `las`, ingen stämpling, ingen skrivning.

- Märken i namnet: `03c25ad3` (Honda), `b8e23817` (Audi), `ca96df76` (Audi Q8),
  plus N32:s redan flaggade Mercedes-, Audi-, Bentley- och Vespa-rader.
- Djurboenden: `6c5b322f` (valplåda), `0b927ed9` (sköldpaddshus), `a40a86bb`
  (hamsterbur), `eb8bdf09` (hönsgård). SJVFS-frågan är INTE prövad —
  källorna lästes inte.
- Billigare tvilling som utkast: Sofa Retrodesign (`77f94d6c`, `4f21c7c1`,
  `d0191013`), `6a65351e`, `22cfc372`.
- Två sidor för en vara utan billigare tvilling (samma hållning som N31 på
  `b6e44df4`): `30439125`, `8e98930c`/`2190df84`, `52d5749b`, `2c72e2b0`,
  `066a7f98`, samt `542963a7` (samma stol som 2-packet `6a5c33ce`).

**Familjer som N27–N32 redan avvisat:** kontorsstolar (`8285f0a3`,
`9276f63e`, `28298786`, `802b25fe`, `ceb363a0`, `534f1b1d`, `94650788`,
`0583e8e8`, `1a1c8f5d`), barhocker (`63f10b6f`), fåtöljer (`e36a7927`,
`485a3bca`, `3bad9c45`), skumklossar (`2443094a`), gokart (`8b04789b`,
`589058f1`, `fdae2809`, `2c7c7f76`), turnräck (`1ea30bf4`).

**Fel säsong i slutet av september**, och rundan gick att fylla med annat:
växthus (`740c7d47`, `bfeda955`), trädgårdsmöbler (`05c01fd1`, `19c880ca`,
`102c080c`, `fb8766b6`, `f7d01c7c`, `5eefde96`, `e88de43e`), paviljong och
pergola (`3c3d37b6`, `99befa9f`), tält (`237667bb`), solsängar (`c5fd959b`),
grillar (`cb63dd30`, `fbef9f5f`, `28f1a13e`, `9c55f641`) och dynboxar
(`12ed7827`, `0e5f0951`).

**OUT_OF_STOCK i spannet** (lästa vid rundans slutläsning, inte antagna):
`46d43f2f`, `01d9c85f`, `b47f2372`, `d9f4c334`, `54f2ba88`, `035ebe97`,
`e7cd9732`, `13d9a960`, `d288fee7`, `60ab2042`.

**Bortvald med flit: `cd8d8524`** (4-in-1 Partyspieltisch, 1 899 kr, 0 träffar
i båda passen). Källan lovar fyra spel — *"Kicker, Tischhockey, Tischtennis und
Mini-Billard in einem"* — och bild 1 och 4 visar bordshockey med två klubbor
och en puck. Men `Lieferumfang` räknar upp tillbehör för fotboll, pingis och
biljard och INGA för hockeyn. Vad kunden får till det fjärde spelet går inte
att säga härifrån, och en sida som säljer fyra spel men levererar tre är det
dyra felet. Står i `FLAGGADE.md` under *Bortvalda*.

**Inte prövade, rundan var full:** speglar (`9a046532`, `90c30789` — 80 × 60
cm-familjen har redan minst tre publicerade sidor), massagebänk `91691f8a`,
sideboard `477bcd1f`, byrå `7b12a7f5`, sängram `f433cc0f`, köksskåp
`fbcf5899`, ståbord `9b11bec6`.

**Två reserver** klarade `las` och varje spärr men kom inte med för att rundan
var full: `e74feea1` (smyckesskåp med spegel, 1 929 kr, saldo 116 — en ANNAN
modell än den publicerade `ca26c603`: 37 × 120 × 10 mot 37 × 10,5 × 108,
batteri-LED mot USB) och `13a52237` (runt matbord Ø110 cm, 1 939 kr, saldo
13 — ett annat bord än `6246ff12`: höjd 78 mot 75, fot Ø64,5 mot Ø61). Båda
står under *Bortvalda* i `FLAGGADE.md`.

## Facit bevisat mot skarpa Wix — 8 av 8 på första körningen

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret och kontrollerades
mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` och över hela bildlistan i ordning (fil-id sammanfogade med
`\n`), jämförd på servern, med `?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO`
och ett avbrott om något av fälten saknades i projektionen.

**8 av 8 text LIKA, 8 av 8 bildlista LIKA.**

☠️ **`b3efdd39` bär leverantörens artikelnummer i källan** (`Artikelnummer: …`
sist i `Technische Daten`). Repot är publikt, så numret är ersatt med
‹REDIGERAT› i `bygg-kallor.py` och `kallor.json`. Kontrollsumman räknades på
servern EFTER samma ersättning (gatelib:s `ARTNR`-mönster speglat i JS), och
anropet rapporterade exakt **1** redigerad träff för `b3efdd39` och **0** för
de andra sju. Annars hade den enda produkt där avskriften medvetet avviker sett
ut som ett transkriberingsfel. `artikelnummer-lackage.test.ts` är grön.

## Sakfel och tveksamheter — hittade i bilderna och i källan

Kontaktarken byggdes FÖRE texten (`bygg-ark.py`, 600 px celler, i
scratchpad — inte incheckade), och de bilder som bär mått eller detaljer
lästes i full upplösning.

- ☠️ **`5c566983` är ingen stol.** Det tyska namnet säger *"Esszimmerstuhl ohne
  Armlehnen"*. `Lieferumfang` säger `1 x Esszimmerbank`, måtten är 120 cm och
  varje bild visar en bänk för två. Texten, namnet och SKU:n säger matsalsbänk.
- ☠️ **`07565140` har inga skjutdörrar.** Namnet säger *"mit Schiebetüren"*.
  Bild 1 och bild 5 i full upplösning visar gångjärn på alla tre dörrarna, och
  den strukna bild 4:s *"Klassische Scheunentüren"* betyder dörrar i ladstil,
  inte skjutdörrar. Texten säger gångjärn, och FAQ:n svarar *"Har den
  skjutdörrar? Nej"*.
- ☠️ **`82000c6b`: höjden går inte att ställa om 50 cm.** Källan säger det två
  gånger (*"lässt sich um 50 cm verstellen"*). Fästet på bild 1 och 3 i full
  upplösning är två väggskenor och två armar — inga hål, inga skenor, ingen
  mekanism. Texten påstår ingen ställbar höjd; den säger att höjden bestäms när
  fästet sätts upp.
- ⚠️ **`82000c6b`: de 28 cm är till SKIVAN.** `Abstand der Halterung zur Wand:
  28 cm`, och måttbilden sätter talet mellan väggen och skivans baksida. Texten
  säger att skivan sitter 28 cm från väggen — inte ringen.
- ⚠️ **`82000c6b`: "Indoor Basketballkorb … im Zimmer … drinnen und draußen".**
  Källan nämner inget garage (det gjorde `db1d494f`:s). Texten säger *"i ett
  rum inomhus eller ute på gården"*.
- ⚠️ **`30f2151f`: två listor över vad som ingår.** `Lieferumfang` räknar ugn,
  korg och galler; `Zubehör` räknar bakplåt i emalj, korg, galler och
  grillspett, och bild 3 visar alla fyra. Texten följer `Zubehör`.
- ⚠️ **`30f2151f`: "85 % weniger Öl für gesündere Mahlzeiten"** återges inte —
  ett hälsopåstående med en siffra som inte går att kontrollera. Texten säger
  *"betydligt mindre olja än i en vanlig fritös"*. Måttbildens 38,6 och 31,3 cm
  (plåt och korg) står inte i källan och används inte. Fotot visar fyra vred,
  men bara TEMP, FUNCTION och TIMER går att läsa; texten räknar dem inte.
- ⚠️ **`b2b731c7`: hälsopåståendena är strukna** — *"verbessert den
  Fußkreislauf"*, *"fördert die Durchblutung"*, *"lindert Müdigkeit"*. Texten
  beskriver vad apparaten gör, inte vad den gör med kroppen, och skötselfliken
  bär husets egen försiktighetsrad (läkare vid graviditet, diabetes, problem
  med blodcirkulationen, pacemaker) utan tal.
- ⚠️ **`b2b731c7`: axlarna.** Källan säger `38L x 37B x 46H`; måttbilden sätter
  37 cm längs fronten och 38 cm längs sidan. Texten skriver trippeln 38 × 37 ×
  46 och binder aldrig 37 eller 38 till bredd eller djup. `Wadenmaß 13B x 25H`
  är läst som mått per vadficka — bild 1 visar två fickor.
- ⚠️ **`b3efdd39`: vilka delar som fälls upp.** Källan säger *"2 Seitenfächer"*
  under *"der aufklappbaren Platte"*. Bild 1 visar skivan i tre delar och bild
  3 den högra delen uppfälld; den vänstra syns aldrig uppfälld. Texten säger
  *"skivans två yttre delar"* — en slutsats ur två sidofack och en tredelad
  skiva, inte en avläsning.
- ⚠️ **`2f251ce3`: "gummierten Holzbeinen"** är en felöversättning av
  gummiträ (`Kautschukbaumholz`, i tekniska data stavat `Kauschukbaumholz`).
  Texten säger gummiträ. Sitsens `39L x 45B` skrivs som 39 × 45 cm utan
  axelord.
- ⚠️ **`dbedaf4c`: färgsyskonet `66eb7361`** (svart, 2 439 kr, utkast) har
  identisk specifikation. Dess tyska SKU är sannolikt samma
  `FP-sideboard-kommode` som `dbedaf4c` bär i dag — INTE kontrollerat, syskonet
  lästes inte med `las`. Den nya SKU:n ger `dbedaf4c` en egen identitet.
- ⚠️ **`07565140`: måttbilden bär `±6,4 cm`** på hyllplanen. `±` står inte i
  `TILLATNA_TECKEN` och används inte.

## Bilder strukna

| id | position | skäl |
|---|---:|---|
| `82000c6b` | 2 | samma scen, samma vägg och samma två spelare som den publicerade `db1d494f`:s bild 2 — bara korgen är utbytt. Två sidor med samma foto är det Google Bilder ser. |
| `82000c6b` | 4 | en affisch i bakgrunden bär ett tredjepartsvarumärke: en spelare med nummer 6 och en kronlogotyp som hör till en känd basketspelare. På en basketprodukt kan det läsas som en koppling som inte finns. |
| `07565140` | 4 | tysk grafik: *Kippsicherung*, *Rustikale Tischplatte*, *Klassische Scheunentüren*, *Runde Knöpfe* |

`82000c6b` blir därmed en trebildsprodukt (produktbild, måttbild och
utomhusbild) och `07565140` en fyrbildsprodukt. `bygg-media.py` räknar antalet
ur `bilder.tsv` minus `bilder-bort.tsv`. Ingen byte-identisk dubblett bland
de 60 hemhämtade filerna (md5, noll kollisioner): rundans åtta produkter,
reserverna `e74feea1` och `13a52237`, `cd8d8524` och den publicerade
`db1d494f`, fem bilder var.

## Husmärken i bilderna

Inga leverantörsmärken hittades på någon produkt. Två iakttagelser, ingen av
dem på varan:

- `07565140` bild 5: tidskriftsryggar på skivan (*KINFOLK* m.fl.) — rekvisita,
  behållen.
- `dbedaf4c` bild 2: en bänkugn i bakgrunden (i ett ANNAT skåp) bär en liten,
  oläsbar logotyp — behållen.

Inget märke står i någon text, alt-text, SEO-tagg eller SKU.

## Korrekturläsningen av den egna svenskan — ett eget steg

Alla åtta texterna lästes med taggarna strippade, mening för mening, med genus,
kongruens och syftning som enda fråga. **Nio rader ändrades, och ingen av dem
hade fällts av någon grind:**

| id | stod | ändrat till | varför |
|---|---|---|---|
| `b2b731c7` | …fälls vaddelen ned, och **den** blir en låg pall | …och **apparaten** blir en låg pall | *den* kunde syfta på vaddelen |
| `b2b731c7` | luftkuddar som fylls och **släpper** | …som fylls och **töms** | passiv och aktiv i samma samordning |
| `b2b731c7` | **Vaddelen** är 13 cm bred | **Varje vadficka** är 13 cm bred | måttet gäller en ficka, inte hela delen |
| `b2b731c7` | värmer fotsulorna, **med värme** i 2 lägen | värmer fotsulorna i 2 lägen | dubblering |
| `b2b731c7` | tills du vet hur **den** känns | …hur **massagen** känns | *den* syftade på *styrkan* |
| `b3efdd39` | **Sitt inte** och luta dig inte tungt **mot** de uppfällbara delarna | Sitt inte **på** de uppfällbara delarna och luta dig inte tungt **mot dem** | *sitta mot* |
| `30f2151f` | **Med följer** en bakplåt… | **I förpackningen ingår** en bakplåt… | ingen svensk konstruktion |
| `07565140` | …bakom de två kryssdörrarna, är 64,4 × 35,5 × 54 cm. | …54 cm **invändigt**. | samma mått som vänster skåp, samma ord |
| `07565140` | Den står 3 cm över golvet på en sockel **med urtagna fötter** | Den står på en sockel **med 3 cm frigång till golvet** | *urtagna fötter* betyder ingenting |

Därtill fyra sakrättelser i samma pass: `2f251ce3` *"både trä, vitt och andra
gråtoner"* (tre led efter *både*), `5c566983` *"ett tätt vävt tyg"* (står inte i
källan), `dbedaf4c` *"en sockel med ett urtag i framkanten"* (syns inte säkert)
och `82000c6b` *"i garaget"* (se sakfelen ovan).

⚠️ **Andra korrekturläsningen (på den PUBLICERADE texten) är inte gjord** —
den hör till steg 7, efter skrivningen. N32 hittade ett sakfel i en
metabeskrivning i just det ledet.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side, artikelnummer redigerat på båda sidor) | **8 av 8 text LIKA, 8 av 8 bildlista LIKA** |
| Trippelmönstrets självtest (sju former, i samma anrop som svepet) | **7 av 7**, i alla tre svepen |
| `gate.py` | **0 fynd i 8 filer, 0 varningar** (tre räkneord kvitterade i `foto-tal.txt`, två råd-tal i `rad-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter (4 axelkonflikter i källan, upplysning; `82000c6b` saknar totalmått i tyskan och är axellös) |
| `gate-alt.py` | **REN**, 8 produkter, 37 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader (titlar 43–58 tecken, beskrivningar 144–160) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 27 |
| `gate-sku.py` | **0 fynd** (längsta 33 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (55 filer, 431 SKU:er) | **8 av 8 unika, noll krockar, noll prefixöverlapp** |
| Slug-krock mot hela katalogen (5 984 slugs) | **0 krockar**, inga slugs med samma början |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | 0 fynd, inga korslänkar |
| Läcksvep över rundans 13 KUNDVÄNDA filer (alla `gatelib.GRINDAR` + 59 extra tyska ord ur rundans källor) | **0 fynd** |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `npx vitest run lib/polish` | **99 av 99 gröna** (8 filer, bland dem `artikelnummer-lackage`, `gate-kopior`, `wixnorm-tvilling`) |

⚠️ Läcksvepets första körning gav ett fynd: det extra ordet *Ring* träffade
rubriken *"Ring som fjädrar vid en dunk"*. *Ring* är samma ord på svenska —
det var listan som var fel, inte texten, och ordet ströks ur det extra
svepet. `gatelib.py` är inte ändrad.

### Axelkonflikterna i källan

`07565140` och `dbedaf4c`: 100/105 är `B` och 40 är `T` i tyskan men `L` och
`B` i den svenska spec-fliken. En upplysning om KÄLLAN; texterna skriver måtten
som tripplar och binder aldrig ett av produktens egna mått till fel axel.

## Kategorier

Valda efter vad publicerade sidor av samma varutyp bär (mätt på deras
`directCategoriesInfo` ur ett FÄRSKT `categories/v1/categories/query`, 54
kategorier). Namnen står i `kategori.tsv`; id:na ska slås upp på NAMN i samma
anrop som skrivningen, som i N32.

| id | kategori | förebild |
|---|---|---|
| 82000c6b (basketkorg) | Trädgård & Utemöbler + Utelek & Spel | `db1d494f` |
| 2f251ce3 (matstolar) | Hem & Inredning | `41b2bc81`, `cae81077` |
| 5c566983 (matsalsbänk) | Hem & Inredning | `41b2bc81` (matmöbler) |
| 07565140 (sideboard) | Hem & Inredning + Förvaring & Organisering | `19f566d8`, `d57048b8` |
| 30f2151f (varmluftsfritös) | Kök & Husgeråd + Köksmaskiner & Apparater | `c26677bf`, `2be44ec2` |
| dbedaf4c (sideboard) | Hem & Inredning + Förvaring & Organisering | `19f566d8` |
| b2b731c7 (massage) | Skönhet & Hälsa + Massage & Återhämtning | `18386a6c` |
| b3efdd39 (matbord) | Hem & Inredning | `90a96877`, `6246ff12`, `4164ae56` |

## Kvitterade tal

`rad-tal.txt`: **305** (standardhöjden för en basketring, samma råd som N32)
och **10** (cm fritt runt varmluftsfritösen — VÅRT råd, inte ett produktmått).

`foto-tal.txt`:

| id | tal | vad |
|---|---:|---|
| `07565140` | 3 | antal dörrar, räknade på bild 1 och 5 |
| `07565140` | 2 | antal skåp: källan anger innermått för `Links` och `Rechts` |
| `5c566983` | 4 | antal metallben, räknade på bild 1 och 3 |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N32: inget `kort-filer.tsv` finns i rundans
katalog, och `bygg-medieskrivning.py` rapporterar "inget kort denna runda" per
produkt — ett uttalat val, inte en tyst utelämning.

## Filer i katalogen

Genererade av `polish-gates` ur rundans filer, inte skrivna för hand:
`axelfacit.json` (`bygg-axelfacit.py`), `raa-hash.tsv` (`raahash.py`),
`vantat-hash.tsv` (`hasha.py`), `nyttolast-media.json` (`bygg-media.py`),
`medieskrivning.json`, `media-hash.tsv` och `steg2.js`
(`bygg-medieskrivning.py`). `steg1.js` byggs med
`python3 ../../polish-gates/bygg-skrivning.py > steg1.js` och är inte
incheckad. `steg4.js` och `steg5.js` finns inte ännu — i N32 genererades de
av ett skript ur `sku.tsv`, `ids.tsv`, `namn.tsv`, `seo.tsv`, `slugs.txt`,
`vantat-hash.tsv` och `media-hash.tsv`, och det är samma krav här.
