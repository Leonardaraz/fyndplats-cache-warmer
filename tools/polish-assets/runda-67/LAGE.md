# Runda 67 — åtta fåtöljer i FYRA syskonpar

Fåtöljfamiljen (`Relaxsessel`) fortsätter från runda 64–66. Den här rundan tar
fyra modeller × två färger, alltså inga föräldralösa syskon kvar efteråt.

| id8 | familj | färg (VÅR) | källans `Farbe` | pris |
|---|---|---|---|--:|
| `04feb176` | B reclinerfåtölj + lös fotpall | svart | Schwarz | 4 299 |
| `6a4e92c4` | B | gräddvit | Cremeweiß | 3 729 |
| `ceae31c1` | C tv-fåtölj, chenille, inbyggt fotstöd | **grå** | ☠️ Hellgrau | 4 719 |
| `1b39b14e` | C | **beige** | ☠️ Cremeweiß | 4 699 |
| `7f437bac` | D vilfåtölj + fotpall med förvaring | mörkgrå | Dunkelgrau | 2 449 |
| `87262869` | D | gräddvit | Cremeweiß | 2 299 |
| `9794b6df` | E relaxfåtölj, 160 kg | svart | Schwarz | 4 259 |
| `9946e1eb` | E | gräddvit | Cremeweiß | 3 859 |

Alla åtta: `visible:false`, ribbon `EU-lager`, fem bilder, en variant.

---

## Steg 1 — urvalet

Fyra par, bekräftade som par på IDENTISKA mått och identisk brödtext, inte på
namnlikhet. Namnen skiljer sig knappt åt mellan familjerna (alla heter
"Relaxsessel mit …"), så namnet duger inte som familjenyckel — måtten gör det.

## Steg 4 — bilderna

Kontaktark (5 × 8) och hörnstrip (övre vänstra fjärdedelen av alla 40) byggda
och granskade med ögon.

- **Noll tysk text inbränd i pixlarna.** Måttritningarna bär bara siffror,
  `cm`, `145°` och `150 kg` — språkneutralt. Ingen bild plockas bort.
- **Noll leverantörslogotyper.** Hörnstripen finns just för runda 64:s fynd
  (`HOMCOM by Aosom` inbränt uppe till vänster); här bär ingen av de 40 en.
- Bildordningen blir: 1 produktbild, 2 miljöbild, **3 eget Fyndplats-kort**,
  4–5 detalj/miljö, **måttritningen sist**.

## Steg 5 — det som mätningen ändrade

### ☠️ Två färgnamn stämmer inte med fotot

`farg.py` maskar bort vit bakgrund och skugga och rapporterar den BÄST BELYSTA
delen av klädseln. `farg.png` lägger originalrutan bredvid den uppmätta färgen
så ögat kan döma mätningen.

| id8 | källan | uppmätt (bäst belyst) | L | vår text |
|---|---|---|--:|---|
| `ceae31c1` | Hellgrau | (112, 111, 108) | **43 %** | **grå** |
| `1b39b14e` | Cremeweiß | (200, 191, 174) | **73 %** | **beige** |
| `04feb176` | Schwarz | (109, 109, 109) | 43 % | svart |
| `7f437bac` | Dunkelgrau | (114, 118, 117) | 45 % | mörkgrå |
| `9794b6df` | Schwarz | (89, 93, 97) | 36 % | svart |
| `6a4e92c4` | Cremeweiß | (244, 229, 215) | 90 % | gräddvit |
| `87262869` | Cremeweiß | (252, 245, 227) | 94 % | gräddvit |
| `9946e1eb` | Cremeweiß | (231, 216, 204) | 85 % | gräddvit |

⚠️ **Talet ensamt räcker INTE — materialet avgör hur det ska läsas.** `04feb176`
mäter L 43 %, exakt som `ceae31c1`, men är på fotot omisskännligt SVART: glansigt
konstläder ger en spegling i den bäst belysta zonen, alltså mäter man reflexen
och inte färgen. `ceae31c1` är MATT chenille utan spegling, så där ÄR 43 % färgen.
Runda 66 skrev om `74f261ea` från "svart" till stålgrå på samma sorts mätning —
skillnaden är att den fåtöljen också SÅG grå ut på kortet. Mätningen pekar ut var
man ska titta; ögat dömer.

Följden: `ceae31c1` är en vanlig mellangrå, inte ljusgrå. Texten skriver `grå`,
aldrig `ljusgrå`. Och `1b39b14e` är samma chenille i en varm beige, tydligt
mörkare än syskonfamiljernas konstlädercreme — den skrivs `beige`.

### ☠️ E:s fotpall bär 20 kg. Fåtöljen bär 160

Källan säger det två gånger: `Belastbarkeit Sessel: 160 kg, Hocker: 20 kg`.
Åtta gångers skillnad, och pallen ser ut precis som D:s, som bär 100 kg. En
kund som köper "fåtöljen som bär 160 kg" kommer att sätta sig på pallen.

Talet står därför i metan, i egenskaperna, i spec-tabellen, **på kortet** och
i ett eget rubrikblock (*"Fotpallen är gjord för fötter"*) — och det är en
`MASTE_STA`-post som grinden fäller på om det försvinner.

### Vad som INTE följde med från källan

1. **C:s hälsopåstående.** Källans ingress: *"Starres Sitzen verhindert
   Entspannung nach einem stressigen Tag. Der Relaxsessel … löst Verspannungen."*
   Ett medicinskt löfte om en fåtölj. Grinden fäller på `spänningar`, `värk`,
   `lindrar` med flera.
2. **E:s ryggmått `66B x 68T x 15T cm`.** TVÅ av tre tal bär bokstaven `T`.
   Vilket som är djup och vilket som är tjocklek går inte att veta, så bara
   bredden (66 cm) publiceras.
3. **E:s tillbakalutade BREDD och fotpallens axelnamn.** Källan kastar om `L`
   och `B` mellan sina egna rader: stolens upprätta rad (`80L x 79B`) stämmer
   mot ritningen, men den tillbakalutade (`122B`) skulle betyda att stolen blir
   43 cm BREDARE när ryggen fälls. Ritningen är entydig, och där den inte
   räcker skrivs talen utan axelnamn (*"122 cm från framkant till bakkant"*,
   *"48 × 42 cm, 42,5 cm hög"*).
4. **E:s 360°.** Källan skriver bara *"lässt sich leicht in alle Richtungen
   drehen"* — aldrig en gradsiffra. B, C och D anger 360° uttryckligen. Texten
   skriver därför "snurrar runt" om E, och grinden fäller om en gradsiffra
   dyker upp där.
5. **Ordet "läder".** Allt i rundan är konstläder eller chenille.

### ⚠️ HÄRLETT, inte citerat: att alla fyra kräver montering

Källan säger `Montage erforderlich` för C, D och E men är TYST om B — B:s
`Lieferumfang` listar bara stol, pall och handbok. Härledningen: **B:s paket är
82 × 65 × 57 cm och fåtöljen 86 × 83 × 107 cm.** En 107 cm hög stol ryms inte i
en 57 cm hög kartong. Samma form som runda 66:s väggavstånd — två tal källan
faktiskt ger, inget påhittat. Kontrollräknat: alla fyra modellerna har ett paket
som är för litet för den monterade produkten.

## Steg 6 — SKU:erna

☠️ Importen gav **fyra produkter samma SKU**:

| SKU från importen | antal | produkter |
|---|--:|---|
| `FP-relaxsessel-mit-hocker` | **4** | 87262869, 7f437bac, 9794b6df, 9946e1eb |
| `FP-relaxsessel-mit-fu` | 2 | 04feb176, 6a4e92c4 |
| `FP-relaxsessel` | 2 | ceae31c1, 1b39b14e |

Samma klass som ärende #272 — krocken skapas av IMPORTEN, inte av poleringen.

⚠️ **Sluggen måste designas mot `sku_bas`, inte mot språkkänslan.** `sku_bas`
släpper fogeord och bryter på ett HELT ord vid 24 tecken, så
`reclinerfatolj-med-fotpall-svart` → `reclinerfatolj-fotpall` (22) — och
syskonet får exakt samma. Färgordet måste ligga FÖRE tillbehöret för att rymmas
inom 24 tecken. Och de fyra familjerna måste ha olika basord, annars krockar
B:s och D:s gräddvita:

| id8 | slug | SKU |
|---|---|---|
| `04feb176` | `reclinerfatolj-svart-med-fotpall` | `FP-reclinerfatolj-svart` |
| `6a4e92c4` | `reclinerfatolj-graddvit-med-fotpall` | `FP-reclinerfatolj-graddvit` |
| `ceae31c1` | `tv-fatolj-gra-med-inbyggt-fotstod` | `FP-tv-fatolj-gra-inbyggt` |
| `1b39b14e` | `tv-fatolj-beige-med-inbyggt-fotstod` | `FP-tv-fatolj-beige-inbyggt` |
| `7f437bac` | `vilfatolj-morkgra-med-fotpall` | `FP-vilfatolj-morkgra` |
| `87262869` | `vilfatolj-graddvit-med-fotpall` | `FP-vilfatolj-graddvit` |
| `9794b6df` | `relaxfatolj-svart-med-fotpall` | `FP-relaxfatolj-svart` |
| `9946e1eb` | `relaxfatolj-graddvit-med-fotpall` | `FP-relaxfatolj-graddvit` |

De fyra basorden är inte bara SKU-taktik — de är den skillnad kunden ska se:
B har en **lös fotpall**, C har fotstödet **inbyggt** och ingen pall alls, D har
**förvaring i pallen**, E **bär 160 kg**. Varje namn bär sin skillnad.

## Grindarna

`lint.py` säger 0 fel, och `mutationstest.py` **41/41** — varje grind är visad
att kunna FÄLLA. Två gjordes om under vägen, båda efter att grinden hade rätt:

1. ☠️ **Ett tal om ett SYSKON måste stå i den LÄNKADE meningen.** Texten skrev
   *"Ja, [länk] bär 160 kg. Räkna med att dess fotpall är gjord för 20 kg."* —
   och andra meningen bär ingen länk, så grinden läste den som ett påstående om
   DEN HÄR produkten och fällde. Grinden hade rätt: markeringen är per MENING.
   Rättat till en enda mening med länken i.

2. ☠️ **Utrustningsgrinden måste vara korshänvisningsmedveten**, precis som
   färg- och lastgrinden. Den byggdes först mot hela texten och gav fyra
   falsklarm: *"…och gungar dessutom"* i en länkad mening är ett påstående om
   syskonet. En grind som fyrar på en korrekt text lär mottagaren att sluta
   läsa — samma regel som mot ett rött synk-jobb vid varje svep.

⚠️ Och en tredje, mindre: grinden sökte stammen `sidoficka` och missade
`sidofickor`. Den sa "nämns inte" om en text där de står i varje stycke.
Stammen måste tåla böjning (`sidofick`).

## Korten

Åtta egna Fyndplats-kort, alla under 215 kB vid q ≥ 85.

⚠️ Bara den GRÅ chenillen (`ceae31c1`) sprängde taket (+52,2 kB) och fick sitt
FOTO mjukat 2,0 px. Den gräddvita systerbilden rymdes med marginal — ljusare tyg
ger mindre kontrast per trådkorsning, alltså färre bitar. Mjuka per KORT, inte
per familj.
