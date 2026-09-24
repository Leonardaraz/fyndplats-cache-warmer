# Runda S9: hantlar, träningsbänkar och motionscyklar (2026-09-24)

Semrush visade att vi rankade på plats **58 för *hantlar* (12 100 sökningar i
månaden)**, och då med den breda sidan Träning & Gym, som haft ordet i titeln
sedan #400 (2026-08-12). Det är samma mönster som *golvlampa* på Belysning i
S7: en bred sida med sökordet i titeln räckte inte. Den här rundan ger
hantlarna, bänkarna och cyklarna egna sidor. Allt följer med i samma
butiksdeploy som S6–S8 (#647).

## 1. Data

Semrush (Sverige), volym per månad och svårighet:

| sida | sökord | volym | svårighet | produkter |
|---|---|--:|--:|--:|
| hantlar-hantelset | hantlar (+ justerbara hantlar 4 400/14, hantelset 2 900/14, hantelställ 880/13) | 12 100 | 20 | 14 |
| motionscyklar | motionscykel (+ spinningcykel 2 900/14, pedaltränare 880/13) | 9 900 | 22 | 12 |
| traningsbankar | träningsbänk (+ gymbänk 720/15) | 5 400 | 18 | 15 |
| traning-gym (omtitel) | hemmagym (+ stepbräda 1 300/15, pilates reformer 1 900/19, chinsstång 1 000/18) | 3 600 | 14 | 123 |

**Omtiteln är nödvändig, inte kosmetisk.** Träning & Gym hade titeln
"Träningsutrustning hemma – hantlar & gym". Med en egen Hantlar-sida hade två
titlar tävlat om samma ord, och butikstestet för unika huvudsökord hade
fällt. Sidan tar nu *hemmagym*, som ingen annan titel bär.

### Medvetet INTE med i rundan

- **Kettlebell (14 800/21), vibrationsplatta (14 800/18) och löpband/gåband
  (14 800/26, 12 100/21):** en, tre och en synlig produkt. Kettlebellen
  ligger på Hantlar-sidan, och vibrationsplattorna nämns i Träning & Gyms
  text. Egna sidor med en till tre produkter blir för tunna.
- **Roddmaskin (8 100/26) och crosstrainer (8 100/15):** en produkt var.
- **Massagebänkar (1 900/24):** tio produkter, men **två** befintliga titlar
  bär redan ordet (Massage & Återhämtning och Kropp & Välbefinnande), och den
  första ligger på plats 28. Det är en kannibalisering som finns i dag. Att
  lösa den kräver två omtitlar på sidor som rankar, och det blir en egen
  runda. *Massagepistol* (12 100) passar inte som ny titel: kategorin har en
  enda massagepistol och i övrigt massagestolar, kontorsstolar med massage
  och uppresningsfåtöljar.
- **Träningskläder dam (14 800/23) och sport bh (6 600/23):** Träning & Gym
  har ett tiotal träningskläder. Det är en möjlig egen sida senare.

## 2. Urvalet

Alla 123 medlemmar i Träning & Gym lästes med beskrivning. Urvalet gick på
namn, och varje produkt kontrollerades mot beskrivningen:

- **Hantlar (14):** hantelset, justerbara hantlar, hexhantlar, enskilda
  hantlar, kettlebell, skivstång och hantelställ. Bänkar med hantelfack eller
  skivstångsställ står på bänksidan.
- **Träningsbänkar (15):** inversionsbänken, gymstationen med bänk och
  multigymmet är inte med. De är inte träningsbänkar.
- **Motionscyklar (12):** sju motionscyklar, en spinningcykel och fyra
  pedaltränare.

## 3. Wix

Tre kategorier skapade 2026-09-24 under Sport & Fritid: Hantlar & hantelset
(14), Träningsbänkar (15) och Motionscyklar (12).

- **Planen** står i `koppling.json`, med kontrollsumman **3013935733** (FNV-1a
  över `slug:id,…|…`). Den räknades om i skrivanropet.
- **Vakterna i samma anrop, före första skrivningen:** att slugarna inte
  fanns, att föräldern fanns, att varje produkt var synlig och att namnet bär
  sidans ord. De tog 1,6 sekunder och föll inte på något.
- **Resultat:** 41 av 41 kopplade, 0 fel. En separat återläsning gav 3 av 3
  lika planen, med antal och kontrollsumma över de sorterade medlemmarna.
- **Kopplingarna är additiva.** Produkterna ligger kvar i Träning & Gym.

## 4. Texterna

Fyra filer med `seo`, `content` och `facit`, alla RENT genom
`gate-kategori.py`. Facit hämtades som utdrag ur beskrivningarna. Det
ändrade följande innan något skrevs till butiken:

- **Ryggstödet ställs i tre till sju lägen *på de flesta*.** En bänk har
  plan, fast dyna ("Bänkdynan lutar inte — den är plan och fast"), så
  dess "8 lägen" kan inte gälla ryggstödet.
- **Pedaltränarna tränar benen, *flera också armarna*.** Den eldrivna håller
  bara benen i rörelse.
- **På *de gummerade* skonar gummit golvet.** Alla hexhantlar är inte
  gummerade.
- **Maxvikten är *oftast* 120 kg**, och uppgiften saknas i två bänkars
  beskrivning. Texten påstår därför inte att den "står i beskrivningen".
- **"Två gymstationer och hemmagymmet med benpress" har viktblock på 45
  eller 65 kg.** Den kompakta gymstationen anger inget viktblock.

Träning & Gym (`traning-gym-text.json`, med fältet `andring`) har helt ny
text. Den gamla handlade om hantlar och motionscyklar, som nu har egna sidor,
och slutraden om EU-lager föll på fraktland i gatelib.

## 5. Butiken

Commit `b02deb27` på `claude/sasongskategorier-s6-bz3j9l` (#647).

- `infoga.py`: tre nya poster, och Träning & Gym ersatt. `jamfor.mts` gav
  **4 av 4 lika källan**, och S6–S8 var oförändrade.
- **Google-flödet:** 3164 Free Weights (Fria vikter), 499795 Exercise Benches
  (Träningsbänkar) och 994 Exercise Bikes (Träningscyklar), kontrollerade på
  sv-SE och en-US. Träning & Gym behåller 990.
- **Testet för unika huvudsökord:** *hantl*, *träningsbänk*, *motionscykel*
  och *hemmagym*. Med *hantlar* tillbaka i Träning & Gyms titel fäller det
  och namnger båda sidorna.
- ⚠️ **Kundspråkstestet låste Träning & Gym till `hantlar|träningsutrustning`**,
  alltså till det sökord rundan flyttar. Det kräver nu *hemmagym*, och
  Hantlar-sidan kräver *hantlar*. Testets syfte, kundspråk i stället för
  hyllskylten "Träning & Gym", gäller oförändrat.
- **/butik:** Sport & Fritid länkar till de tre sidorna.
- **Kontroller:** `npm test` 782 av 782. `tsc` gav samma 75 fel som före
  (alla i testfiler). `eslint` rent.

## 6. Förhandsbygget

(fylls i)

## 7. Live

(fylls i efter merge 2026-09-25)

## Återställning

Kopplingarna är additiva. Butiksposterna tas bort genom att backa `b02deb27`,
och Träning & Gyms gamla text finns i `1914cb2e`.
