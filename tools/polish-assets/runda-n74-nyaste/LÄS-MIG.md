# Runda N74 — åtta av de nyaste utkasten

Åtta Aosom-utkast ur importerna 2026-09-01–07 är polerade och publicerade, i
fallande skapandeordning. Rundan följde samma regler som N64–N73, utan
prisjämförelse, och allt skrevs via workflowen "Polering — skriv en runda till
Wix".

| id | produkt | SKU | huvudsökord (sökningar/mån, svårighet) | pris | saldo |
|---|---|---|---|---:|---:|
| `f3555135` | Elektrisk reclinersoffa 2-sits med massage och värme – mörkgrått konstläder | `FP-reclinersoffa-massage-morkgra` | elektrisk reclinersoffa (inget mätvärde) | 8 399 kr | 68 |
| `a21f8df7` | Leksakskök med kaffemaskin, ljud och ljus – mikro och ugn, vitt och ljusblått | `FP-leksakskok-kaffemaskin-ljusbla` | leksakskök med kaffemaskin (inget mätvärde) | 1 239 kr | 85 |
| `27380bf4` | Reclinerfåtölj i brunt konstläder med fotpall – snurrar 360°, lutar 145° | `FP-reclinerfatolj-konstlader-brun` | reclinerfåtölj i konstläder (inget mätvärde) | 1 739 kr | 32 |
| `afc0c368` | Massagefåtölj med värme och fotstöd – fälls till 135°, beige frotté | `FP-massagefatolj-varme-frotte-beige` | massagefåtölj med värme (inget mätvärde) | 3 359 kr | 9 |
| `b37a10e1` | Loungefåtölj med fotpall i krämvit chenille – snurrar 360°, höj- och sänkbar | `FP-loungefatolj-fotpall-kramvit` | loungefåtölj med fotpall i krämvit (inget mätvärde) | 2 999 kr | 84 |
| `40f26fb8` | Badrumsspegel med belysning och glashylla – välvd överkant, 50 × 70 cm | `FP-badrumsspegel-glashylla-valvd` | badrumsspegel med glashylla (inget mätvärde) | 879 kr | 71 |
| `41a257cb` | Leksakskök i trä med telefon och klocka – kylskåp, mikro och ugn, vitt | `FP-leksakskok-tra-telefon-klocka` | leksakskök i trä (inget mätvärde) | 1 199 kr | 77 |
| `2564968e` | Trampbil traktor med frontlastare och släp – grävarm, 3–6 år, röd | `FP-trampbil-traktor-frontlastare` | trampbil traktor (inget mätvärde) | 1 599 kr | 20 |

**Inget pris är rört.**

## Urvalet

N74 tog de 40 nyaste utkasten efter N73. Enligt N64:s regel gäller bara
skyddsreglerna för de nyaste. Tjugo bar redan ett skyddsskäl, och de övriga 20
dubblettskärmades mot 3 675 publicerade sidor (kalibrering 4 av 4 och 2 av 2,
självtest 9 av 9). Åtta publicerades. Trettiotvå föll, vart och ett med exakt
ett skäl i `FLAGGADE.md` (kontrollerat med skript):

- **4 är slutsålda eller har saldo under 4**: en markis, en elfyrhjuling, en
  hundgrind och en köksskänk.
- **4 bär ett licensmärke**: två sparkbilar med Porsche och två
  el-motorcyklar med Honda.
- **3 är djurbostäder.**
- **3 rörs av main:s Runda-serie**: ett medicinskåp, ett trädgårdsskåp och en
  sparkbil.
- **1 är en dubblett** av en publicerad kattlåda.
- **2 bär ett märke på varan**: ett boxningsställ och en roddmaskin.
- **1 är inte billigast i sin grupp och 1 är tvilling inom rundan.**
- **10 är syskon till publicerade sidor** och väntar på Leonards beslut.
- **3 har för få bilder utan läsbar text**: en konsolhylla, en LED-spegel och
  en hundgrind.

## Det som överraskade

- **Två storlekssyskon syntes inte i skärmen.** Skärmen jämför mått, och ett
  syskon i en annan storlek har andra mått. Kantskyddet på Ø366 cm hittades i
  N38:s familjerad bredvid det publicerade på Ø305 cm, och fiberoptikgranen på
  150 cm i den publicerade 120 cm-granens källtext, som räknar upp båda
  storlekarna. Ett namnsvep över hela katalogen prövade sedan de åtta mot
  publicerade sidor av samma slag.
- **Tre produkter föll på bilderna.** Konsolhyllan visar läsbara bokryggar på
  tre av fem bilder, LED-spegeln har tysk text på två och läsbara etiketter på
  en, och hundgrinden har tysk text på tre. Kvar blir två bilder, och regeln
  kräver tre.
- **Leverantörens namn stod på en griffeltavla.** En miljöbild till
  leksaksköket `41a257cb` visar det i färgglada bokstäver på en tavla bakom
  barnet. Bilden ströks.
- **Fotot vann över källan.** Leksaksköket `a21f8df7` är ljusblått, och
  `41a257cb` är vitt och trä med ett kylskåp som källan inte nämner.
  Trampbilens släp bär en grävarm, och spegeln `40f26fb8` har välvd överkant
  och två ljuslister.

## Livekontrollen

Workflowen skrev, verifierade och stämplade alla åtta i samma körning: 8 av 8
helt verifierade i en separat läsning 90 sekunder efter skrivningen,
kategorierna inräknade, och 8 stämplade utan stämpelfel.

Sidorna hämtades efter butikens cachefönster, alla med HTTP 200. Adresserna är
nya, så varje rendering är gjord efter skrivningen, som var klar 04:22. Vid den
skarpa hämtningen var alla åtta sidor 140 sekunder gamla. Orddiffen mot
källfilerna gav **0 på alla åtta**, livegrinden gav inga avvikelser, och alla
åtta har oförändrat pris och sina 33 alt-texter.

Livekollen gav 7 av 8 OK. Trampbilens brödsmula går via Trädgård & Utemöbler,
som är föräldern till Utelek & Spel, och den kategorin stod inte i rundans
lista. Sidan har alltså en riktig kategoriväg, och trampbilen ligger dessutom
under Barn & Familj och Leksaker & Spel.

**Pushen med rundans filer byggde inte.** Den slutade som CANCELED i både
fyndplats-cache-warmer och fyndplats-headless, alltså hoppade filtret över den
som det ska.

## Frågor till Leonard

1. Tio utkast är syskon till publicerade sidor: den grå mini-torktumlaren
   `1acfb720` (2 149 kr) till den svarta `2517c54b` (2 519 kr), golvstolen
   `69f39dad` (849 kr) till `db645ff8` (739 kr), elfyrhjulingarna `96d3f0ed`
   (1 019 kr), `4d6922a9` (1 069 kr) och `2116f56f` (1 059 kr) till
   `9d686a82` (999 kr), uppresningsfåtöljen `1af65e68` (5 099 kr) till
   `ed03b52f` (5 399 kr), roddmaskinen `2967c62c` (1 499 kr) till `7a095db9`
   (2 269 kr), gokarten `bc0f6426` (1 319 kr) till den gröna `60869ff2`
   (2 399 kr), det blå kantskyddet `72d8e656` (Ø366 cm, 629 kr) till det gröna
   `14fb0f98` (Ø305 cm, 569 kr) och fiberoptikgranen `8763f8d0` (150 cm,
   849 kr) till `75a38b7b` (120 cm, 539 kr). Ska de få egna sidor eller bli
   färg- och storleksval på de publicerade?
2. Frågorna från N69–N73 står kvar.
