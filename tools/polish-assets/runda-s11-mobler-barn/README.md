# Runda S11: pallar, puffar, hall, sideboards, vin, barnmöbler och projektordukar (2026-09-24)

Samma grepp som i S7–S10: sökord med hög volym och låg svårighet, där vi har
produkterna men ingen egen sida. Fyra av sidorna kommer ur S10:s lista över
nästa rundor (hallmöbler, sittpuffar och fotpallar, sideboards, vinställ och
projektordukar). Pallar och Barnmöbler kom till när familjerna räknades. Allt
följer med i samma butiksdeploy som S6–S10 (#647).

## 1. Data

Semrush (Sverige), volym per månad och svårighet:

| sida | sökord (volym/svårighet) | produkter |
|---|---|--:|
| pallar | pall 14 800/25, stegpall 3 600/20, duschpall 2 900/15, träpall 2 900/18, pallar 2 900/18, hopfällbar pall 2 400/17, sittpall 1 900/16, kökspall 1 600/22, pianopall 1 000/13 | 46 |
| sittpuffar-fotpallar | sittpuff 14 800/20, fotpall 8 100/18, puff 5 400/18, puff med förvaring 1 300/18 | 21 |
| kladhangare-hallmobler | klädhängare 18 100/16, hallmöbel 18 100/23, klädställning 9 900/20, klädstång 6 600/18, hallbänk 3 600/18, klädhängare vägg 2 900/17 | 15 |
| sideboards-vitrinskap | vitrinskåp 27 100/28, skänk 18 100/28, sideboard 12 100/21 | 14 |
| vinstall-vinkylar | vinkyl 14 800/23, vinställ 9 900/29, vinställ vägg 3 600/18, vinhylla 2 400/18 | 15 |
| barnmobler | barnfåtölj 4 400/28, barngarderob 2 900/18, barnbord och stolar 2 900/21, barnmöbler 1 900/21, sminkbord barn 1 600/17, barnsoffa 1 000/19, barnpall 1 000/13 | 26 |
| projektordukar | projektorduk 4 400/24 | 9 |

**Vi rankar inte topp 100 på något av huvudorden.** Enda undantaget är
*hopfällbar pall*, där en produktsida ligger på plats 33–38. En ny sida tar
alltså ingenting från en befintlig sida.

### Medvetet INTE med i rundan

- **Garderob:** svårighet 31, över rundans gräns.
- **Hundgrind:** ordet står redan i titeln för Burar, kläder & tillbehör
  ("Hundgård, hundgrind & burar för smådjur"). En egen sida kräver en ny titel
  där, och det är ett eget beslut.
- **Gamingstol:** står redan i titeln för Dator & Gaming ("Gamingstolar &
  datortillbehör").
- **Trädgårdsord** (parasoll, solsäng, pergola med flera): sommarsortiment,
  och det är fel säsong att bygga sidor för dem nu.

## 2. Urvalet

Varje familj söktes fram på namnet och kontrollerades sedan mot beskrivningen.
Påståendena i texterna stämdes av med riktade sökningar i beskrivningarna, och
belägget står i varje fils `facit`.

- **Pallar (46):** stegpallar, duschpallar, pianopallar, rull- och
  arbetspallar, sadelpallar, salongspallar, stoppade pallar, fyrpack med
  stapelbara pallar, verkstadspallar och en trädgårdspall. Fåtöljer, soffor
  och barbord med pall är inte med, och inte heller golvpallar för varor,
  blompallar, sminkbord och instrument med pall.
- **Sittpuffar & fotpallar (21):** fotpallar, förvaringspallar,
  förvaringspuffar och sittpuffar. Vanliga pallar ligger på sidan Pallar.
- **Klädhängare & hallmöbler (15):** klädställ och klädställningar,
  fristående klädhängare, en klädhängare för väggen, hallmöbler och
  hallbänkar. Skobänken i bambu ligger också i Skoskåp & skobänkar.
- **Sideboards & vitrinskåp (14):** nio sideboards och skänkar, köksskåpet
  med glasvitrin, tre vitrinskåp och en samlarvitrin.
- **Vinställ & vinkylar (15):** vinställ och vinhyllor, fyra köksmöbler med
  vinställ i namnet och fyra vinkylar. Barbordet med flaskställ är inte med.
- **Barnmöbler (26):** barnfåtöljer, barnsoffor, barnbord med stolar,
  barnpallar, stegpallar för barn, en barnsäng, barngarderober och sminkbord
  för barn. Ett sminkbord vars pall bär 110 kg och djurpallen i koform är
  vuxenmöbler och är inte med.
- **Projektordukar (9):** fyra motoriserade, två manuella med autolås, två på
  trebent stativ och en 120-tumsduk på stativ.

Två stegpallar för barn ligger både i Pallar och i Barnmöbler, med flit. Det
ger 146 kopplingar på 144 produkter.

## 3. Wix

Sju kategorier skapade 2026-09-24 06:25 UTC:

- under Möbler: Pallar, Sittpuffar & fotpallar, Klädhängare & hallmöbler och
  Sideboards & vitrinskåp
- under Kök & Husgeråd: Vinställ & vinkylar
- under Barn & Familj: Barnmöbler
- under Elektronik & Tillbehör: Projektordukar

- **Planen** står i `koppling.json`, med kontrollsumman **2178130426**
  (FNV-1a över `slug:id,…|…`). Den räknades om i skrivanropet.
- **En läsning före planen:** alla 144 produkter var synliga, de fyra
  föräldrarna fanns, och ingen av de sju sluggarna fanns.
- **Vakterna i samma anrop, före första skrivningen:**
  - varken sluggen eller namnets slug fanns
  - namnet ger exakt den slug butiken räknar fram
  - föräldern fanns och var synlig
  - varje produkt var synlig och bar familjens ord i namnet

  De tog 3,6 sekunder och föll inte på något.
- **Resultat:** 146 av 146 kopplade, 0 fel. En separat återläsning gav 7 av 7
  lika planen, med antal och kontrollsumma över de sorterade medlemmarna.
- **Wix har nu 117 kategorier, varav 116 synliga.** Butiken läser alla sidor
  sedan hotfixen #649, så gränsen på 100 spelar ingen roll längre.
- **Kopplingarna är additiva.** Produkterna ligger kvar i sina gamla
  kategorier.

## 4. Texterna

Sju filer med `seo`, `content` och `facit`, alla RENT genom
`gate-kategori.py`. Kontrollen mot facit ändrade följande innan något skrevs
till butiken:

- **Alla fyra motoriserade projektordukar har fjärrkontroll**, inte två.
  Bara två har ordet i produktnamnet, men beskrivningarna säger det för alla
  fyra, och de två på 84 tum har en trådlös fjärrkontroll. Texten säger
  därför "motoriserade dukar som körs upp och ner med fjärrkontroll".
- **Verkstadspallarna har verktygsfack eller verktygsbricka.** Den ena har
  lådor och fack och den andra en bricka.
- **Gaslyft:** 14 av 18 rull-, arbets-, sadel- och salongspallar anger det
  uttryckligen. Texten säger därför *de flesta*.
- **"Flaskor à 75 cl" blev "flaskor på 75 cl".** Grinden släpper inte igenom
  tecknet `à`.
- **Två vuxenmöbler togs ut ur Barnmöbler:** sminkbordet vars pall bär 110 kg
  och djurpallen i koform, som enligt beskrivningen är en vuxenmöbel.

### Inget påstående vilar på en slutsåld produkt

Förhandsbygget visade färre produkter på fyra sidor än vad som var kopplat.
Sex av de 144 produkterna är slutsålda, och kategorisidan döljer dem i listan
(`forListings`). Fyra texter hade ett påstående som bara gällde en av dem, så
sidan lovade något kunden inte kunde se:

| sida | före | efter |
|---|---|---|
| Pallar | två pianopallar har ett dolt fack | pianopallen med notförvaring har ett dolt fack |
| Sideboards | 80 till 180 cm breda, och på det bredaste får en tv på 75 tum plats | från 80 cm i bredd, och ingen tv |
| Klädhängare | klädhängarna i furu och bambu, den i bambu med bänk | klädhängaren i furu |
| Barnmöbler | klädslar i sammet, tre fåtöljer med pall, garderober 106–113,5 cm | inget sammet, de två med pall nämns vid namn, garderoberna är drygt en meter höga |

Texterna stämmer nu både medan varorna är slut och när de kommer tillbaka.
Fältet `slutsålt` i varje fils facit namnger de sex produkterna. Regeln för
nästa runda: **läs lagret innan texten skrivs, och låt inget påstående vila
enbart på en vara som är slut.**

## 5. Butiken

Tre commits på `claude/sasongskategorier-s6-bz3j9l` (#647): `dfb9ada9`
(sidorna), `20b439f4` (slutsålt, se ovan) och `fe511a7c` (Google-noden för
Vinställ, se nedan).

- `infoga.py`: sju nya poster. `jamfor.mts` gav **7 av 7 lika källan**, och
  S6–S10 är oförändrade.
- **Google-flödet**, kontrollerat mot taxonomifilen på sv-SE och en-US:
  - 443 Chairs för Pallar, eftersom stegpallar, duschpallar och rullpallar
    saknar en gemensam nod
  - 458 Ottomans, som på svenska heter exakt *Fotpallar*
  - 5708 Coat & Hat Racks, 447 Buffets & Sideboards och 395 Projection Screens
  - 638 Kitchen & Dining för Vinställ & vinkylar, se nedan
  - 554 Baby & Toddler Furniture, den närmaste noden för barnmöbler
- **Varför inte 5578 Wine Racks för vinsidan:** `taxonomyFor` tar produktens
  *första* underkategori, och ordningen kommer rakt från Wix. I förhandsbygget
  var Vinställ & vinkylar först för köksön, köksvagnen, köksskåpet och en av
  vinkylarna. Med 5578 hade de klassats som vinställ, och köksön och
  köksvagnen hade tappat 638 Kitchen & Dining, som de har i produktion i dag.
  638 är rätt för allt på sidan.
- **Testet för unika huvudsökord:** 22 nya ord, bland dem *pall* (som eget
  ord), *stegpall*, *sittpuff*, *fotpall*, *klädhängare*, *hallbänk*,
  *sideboard*, *skänk*, *vitrinskåp*, *vinställ*, *vinkyl*, *barnfåtölj*,
  *sminkbord* och *projektorduk*. Med "Hallbänk" i Skoskåps titel fäller det
  med "/hallbänk/i finns i 2 titlar: kladhangare-hallmobler,
  skoskap-skobankar".
- **/butik:** Möbler, Kök & Husgeråd, Barn & Familj och Elektronik & Tillbehör
  länkar till de nya sidorna.
- **Kontroller:** `npm test` 787 av 787. `tsc` gav samma 76 fel som basen
  (alla i testfiler). `eslint` rent.

## 6. Förhandsbygget

Tre förhandsbyggen, ett per butikscommit. Det sista, `dpl_BzMXd4e79p4FjFYMuUHT8AJFqCbE`
(`fe511a7c`), är PR:ens huvud och har alla 116 synliga kategorier.

- **50 av 50 sidor är lika källan** för S6–S11. Jämförelsen gäller `<title>`, metabeskrivning,
  canonical, varje introstycke, varje FAQ och antalet frågor i FAQPage-JSON-LD. Ingen sida visar
  `**`. Det första S11-bygget (`dfb9ada9`, `dpl_7gM2RDJuG7p8AqSrWdG62DCGWcyr`) gav också 50 av 50,
  med texterna före rättelsen för slutsålda produkter.
- **Kontrollsidorna** Golvlampor, Skönhet & Hälsa, Hantlar, Köksmaskiner och Badrumsskåp svarar
  200.
- **Sitemapen** har 103 kategori-URL:er (96 före S11), och alla 50 sidor finns med.
- **Antal produkter på sidan mot antal kopplade:**

  | sida | på sidan | kopplade | slutsålda |
  |---|--:|--:|--:|
  | Pallar | 44 | 46 | 2 |
  | Sittpuffar & fotpallar | 21 | 21 | 0 |
  | Klädhängare & hallmöbler | 14 | 15 | 1 |
  | Sideboards & vitrinskåp | 13 | 14 | 1 |
  | Vinställ & vinkylar | 15 | 15 | 0 |
  | Barnmöbler | 24 | 26 | 2 |
  | Projektordukar | 9 | 9 | 0 |

  Skillnaden är exakt de slutsålda produkterna i läsningen före planen.

- **Google-flödet i slutbygget:** 100 av 146 kopplingar bär sidans taxonomi-id. Projektordukar har
  9 av 9 och Pallar 34 av 46. Resten behåller en äldre underkategoris id, eftersom `taxonomyFor`
  tar produktens första underkategori.
- **Mot produktionens flöde byter 95 av 141 unika produkter Shopping-kategori.** Nästan alla byten
  går från en bred nod till en smalare: 536 Home & Garden eller 436 Furniture blir Chairs, Ottomans,
  Coat & Hat Racks eller Buffets & Sideboards. Nio barnmöbler hade ingen Google-kategori alls och
  får 554.
- **Fyra produkter får en sämre nod, och det går inte att undvika med ett id per kategori:**
  - två duschpallar går från 469 Health & Beauty till 443 Chairs. Den rätta noden, 7243 Shower
    Benches & Seats, ligger under Health & Beauty.
  - en stegpall för barn går från 537 Baby & Toddler till 443 Chairs. Den rätta noden är 635 Step
    Stools.
  - hallbänken med armstöd går från 536 Home & Garden till 5708 Coat & Hat Racks. Den rätta noden
    är 6851 Storage & Entryway Benches.
- **Köksön och köksvagnen behåller 638 Kitchen & Dining**, som de har i produktion. Utan S11 hade
  S7:s mappning gett dem 442 Carts & Islands, men nu är Vinställ & vinkylar deras första
  underkategori. Med 5578 Wine Racks hade de klassats som vinställ, se avsnitt 5.

## 7. Live

#647 mergades 2026-09-25 01:29 UTC och gick live 01:43 UTC med produktionsbygget
`dpl_3Mb4VcsjhGdcxtR5rpuKuVvDFqbK` (hur bygget kom till står i S13:s avsnitt 7).

- `livekoll.py`: **7 av 7** sidor lika källan.
- Alla sju nya sidor finns i sitemapen och i menyn på startsidan.
- Wix lästes före mergen, 01:22–01:29 UTC, med `list-items` per kategori. Ingen av de 146 planerade
  kopplingarna saknas. Poleringen har lagt till tio: Pallar har 50 (46
  planerade), Sittpuffar & fotpallar 22 (21), Klädhängare & hallmöbler 17 (15)
  och Sideboards & vitrinskåp 17 (14).

## Återställning

Kopplingarna är additiva. Butiksposterna tas bort genom att backa `fe511a7c`,
`20b439f4` och `dfb9ada9`.
Kategorierna tas bort i Wix med id:na i `koppling.json`.
