# Runda 94 — Steg 1–5

Fyra reservtak till paviljong, i **två skilda modeller**, ur reservtaksfamiljens
tolv kvarvarande utkast.

| id8 | wixProductId | modell | färg | pris | lager | bilder |
|---|---|---|---|--:|---|--:|
| `df5a7190` | `df5a7190-f583-48dc-b6b9-c27baa2beb22` | C — dubbeltak | grå + mörkgrå topp | 899 | IN_STOCK | 5 |
| `60eaf40e` | `60eaf40e-34b5-4fd4-a02c-908198441db5` | C — dubbeltak | gråbrun + mörkbrun topp | 859 | IN_STOCK | 5 |
| `d52c6d1d` | `d52c6d1d-7eed-463c-9342-caa64dcc5b81` | B — Oxfordväv | beige | 779 | IN_STOCK | 5 |
| `d01a6d2b` | `d01a6d2b-d9d9-4e06-8236-7c94df9e1f20` | B — Oxfordväv | mörkgrå | 749 | IN_STOCK | 5 |

## Steg 1 — familjesvep och dubblettgrind

Sitemapen (2 326 URL:er, **2 197 produktsidor**) gav familjen på noll API-anrop.
Grep på `tak|pavilj|pergola|markis|segel|baldakin` → 68 träffar, varav bara
**två är reservtak till paviljong**:

- `paviljongtak-3x3-dubbeltak-creme` (859 kr)
- `paviljongtak-3x3-m-reservtak-polyester`

Tolv utkast mot två publicerade sidor är en verklig lucka — familjen är rätt vald.

### ☠️ #341 avgjord: grupp C är INTE en dubblett av creme-sidan

Misstanken var stark. Creme-sidans beskrivning säger ordagrant *"180 g/m² PA-belagd
polyester, åtta dräneringshål och kardborrefäste"* — exakt grupp C:s spec, och båda
är dubbeltak på 3 × 3 m. **Fyra mått i samma roller skiljer sig med 1–5 cm:**

| vad | publicerad creme | grupp C | diff |
|---|--:|--:|--:|
| stora duken | 300 × 300 | 300 × 300 | 0 |
| lilla taket | **86 × 86** | **90 × 90** | 4 |
| takfall / snedställd kant | **174 / 160** | **173 / 165** (ritningen) | 1 / 5 |
| snedställd kant | **18** | **20** (ritningen) | 2 |

Runbookens måttgrind kräver 3/3 inom ±1 cm för dubblettmisstanke. Här är det **1/4**.

**Pixelgrinden:** grupp C:s tio bilder mot creme-sidans 24 filer, `abs(gray(a)-gray(b)).mean()`
på 320 × 320. **Lägsta avstånd 23,74** — femton gånger över tröskeln 1,0. Ingen delad bild.

**Inköpsvägen skiljer också:** creme-sidan bär `supplierProductId 1005013005569582`
(ett AliExpress-listnings-id, ES, prisgrinden svarar `EJ AVGÖRBAR`), grupp C är
feed-import `aosom:84C-741V00GY` från DE. Det är precis CLAUDE.md:s kända hål —
samma slags vara köpt två vägar — men **inte samma artikel**, enligt husets egna mått.

Grupp C poleras alltså som egna produkter, och korslänkar creme-sidan med en
uttrycklig uppmaning att jämföra spec-tabellerna.

### ☠️ Grupp B och grupp C är INTE en färgfamilj

Bilderna avgör: grupp C är ett **dubbeltak** (stor duk + liten topp med nätvävd
springa emellan), grupp B ett **enkelt tak** utan topp. Att slå ihop dem hade gett
fyra sidor som lovar samma sak. De får därför skilda huvudord i sluggen —
`tvafargat-dubbeltak` mot `oxfordvav-370` — och korslänkar varandra som alternativ.

Pixelgrinden inom rundan: **noll byte-identiska filer, inget par under 2,0.**
De två grå huvudbilderna hade identisk `sizeInBytes` (125 147) men skilda pixlar.

## Steg 2 — laglighetsgrind

| fråga | utfall |
|---|---|
| Djurbostad, barnprodukt, elsäkerhet | ej tillämpligt |
| UPF 30+ | leverantörens klassning, skrivs som klassning — ingen skyddsutfästelse |
| Vattenavvisande | ☠️ källan säger `wasserabweisend`, aldrig `wasserdicht` — **"vattentät" får inte skrivas som påstående**, bara som förnekande i FAQ:n |
| Snölast | ingen uppgift finns → texten säger att duken är ett sommartak |
| Monteringstid | ☠️ tyskan lovar "5 Minuten" — **inget tidslöfte skrivs**, kardborrefästet beskrivs i stället |

## Steg 4 — bilderna

Fem bilder per produkt, alla 2000 × 2000.

☠️ **Ingen leverantörslogotyp i något övre vänstra hörn** — de tjugo hörnen
granskade i eget kontaktark. Men **tysk text finns inbränd i pixlarna**:

| bild | grupp C | grupp B |
|--:|---|---|
| 1 | ren render på vit botten | ren render på vit botten |
| 2 | "Ersatz-Überdachung für Pavillon, nur Oberteil" / "Ersatzteile Nur Vordach des Pavillons" | "Ersatz-Überzug für Pavillon, nur Oberteil" |
| 3 | "So messen Sie Ihre Gartenlaube" + tre tyska rader | "Wie misst man eine Gartenlaube?" + tre tyska rader |
| 4 | "Ersatzabdeckung (nur für Pavillon)" | **ren** — närbild på kardborrebandet |
| 5 | "Ersatzabdeckung (nur für Pavillon)" | **ren** — undersidan med stommen |

Grupp B:s bild 4 **bekräftar kardborrefästet i pixlarna** — påståendet är alltså
verifierat, inte bara översatt.

### ☠️ Två köpavgörande tal finns BARA i pixlarna

Måttritningen (bild 3) bär tal den tyska texten saknar:

| tal | grupp | tysk etikett finns? | publiceras? |
|---|---|---|---|
| 2,18 m snedställd kant | B | nej, men tyskans steg 3 namnger just det måttet | **JA** |
| 1,73 m | C | ja — `abgeschrägte Kantenlänge (großes Dach) 173 cm` | JA |
| 1,65 m | C | **nej** | **NEJ** |
| 0,2 m | C | **nej** | **NEJ** |

☠️ `1,65 m` löper från ett ANNAT hörn till samma topp än `1,73 m` gör, och kan
alltså inte vara samma mått. Vad den mäter går inte att avgöra ur ritningen.
`0,2 m` är sannolikt kappans djup, men saknar etikett. **Båda utelämnas** — ett
omärkt mått som får en etikett är ett påhittat mått. Creme-sidan kallar sina
motsvarande tal "Takfall 174 och 160" och "Snedställd kant 18"; den tolkningen
går inte att kontrollera mot vår källa och ärvs därför inte.

### ☠️ Färgerna är mätta, och tyskan har fel åt ljusare håll

Dominerande RGB bland produktpixlarna på bild 1 (vit botten bortfiltrerad):

| id8 | tyskans ord | mätt RGB | HSL | vårt ord |
|---|---|---|---|---|
| `df5a7190` | Hellgrau+Dunkelgrau | 96, 84, 84 | S 7 %, **L 35 %** | grå med mörkgrå topp |
| `60eaf40e` | Khaki+Braun | 144,120,108 | H 20°, **L 49 %** | gråbrun med mörkbrun topp |
| `d52c6d1d` | Beige | 228,204,168 | H 36°, L 78 % | beige |
| `d01a6d2b` | Grau | 72, 72, 72 | S 0 %, **L 28 %** | mörkgrå |

"Hellgrau" ligger på L 35 % och "Grau" på L 28 %. Båda är MÖRKA. Ordet `ljusgrå`
är därför en egen linträgel — den fäller om det dyker upp.

## Steg 5 — verifierade påståenden

**Grupp C** (identisk tysk text på båda, bara `Farbe` skiljer):

| påstående | källa | dom |
|---|---|---|
| 300 × 300 cm | tyska + ritning (3 m) | ✓ |
| lilla taket 90 × 90 | tyska + ritning (0,9 m) | ✓ |
| öppning 59 × 59 | tyska | ✓ (text) |
| snedställd kant 173 / 51 | tyska + ritning (1,73 / 0,51 m) | ✓ |
| åtta öljetter | tyska; prickarna syns i render 1 | ✓ |
| kardborrefäste | tyska | ✓ (text) |
| nätvävd springa i övre steget | tyska | ✓ (text) |
| 180 g/m² polyester, PA, UPF 30+ | tyska | ✓ (text) |
| 2,9 kg, paket 50 × 29 × 8 | feedens kolumner | ✓ |
| **endast överdelen ingår** | tyska: "Ersatzdach NUR für das Oberteil" | ✓ — står i klartext |

**Grupp B** (identisk tysk text på båda):

| påstående | källa | dom |
|---|---|---|
| 298 × 298 cm | tyska + ritning (2,98 m) | ✓ |
| snedställd kant 218 cm | **bara ritningen** — tyskans steg 3 namnger måttet | ✓ publiceras |
| Oxfordväv, PA-belagd polyester | tyska | ✓ |
| 370 g/m² | produktens egen alt-text ur feedens titelkolumn | ✓ |
| UPF 30+ | tyska | ✓ |
| kardborrefäste | tyska **och bild 4** | ✓✓ |
| dräneringshål | tyska — **antalet anges inte, så inget antal skrivs** | ✓ |
| 4,8 kg, paket 42 × 35 × 9 | feedens kolumner | ✓ |
| ingår: tak + bruksanvisning | tyska `Lieferumfang` | ✓ |
| ☠️ passar bara serien `01-0867` | tyska | **numret skrivs ALDRIG** — passformen uttrycks i mått |

⚠️ Namnet säger "3 x 3 m" och specen "298 × 298 cm". Båda är sanna och båda skrivs:
duken mäter 298 × 298 och sitter på en stomme på 3 × 3 m.

## Grindarna

| grind | utfall |
|---|---|
| `lint.py` | **0 brister** på alla fyra |
| `lint.py --sjalvtest` | **21/21 regler faller PÅ SIN EGEN skada** |
| `mutationstest.py` | **23/23 mutationer ger rätt utfall** |

Två verkliga svagheter hittades av mutationstestet och lagades:

1. ☠️ **Ytviktsregeln läste `texter.py`, inte HTML:en** — grinden provade sin egen
   källa, så mutationen `370 → 180` gick rakt igenom. Läser nu ur HTML:en.
2. ☠️ **Kravet på uppmaningen "Mät" uppfylldes av ett gement `mät` mitt i en
   mening.** Imperativen krävs nu med versal. (Mutationen var dessutom
   ofullständig — faktumet bars av TRE ställen, inte två.)

⚠️ Två dokumenterade blinda fläckar står kvar: talgrinden är en vitlista, så
paketmåttets tal går att kasta om (`50 × 29 × 8` → `8 × 29 × 50`) utan att grinden
ser något. Fångas av faktaavstämningen i Steg 12, inte av grinden.
