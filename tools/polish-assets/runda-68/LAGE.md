# Runda 68 — åtta fåtöljer i FYRA syskonpar, och en som inte lutar alls

Fortsättning på fåtöljfamiljen (`^Relaxsessel` utan el- och massagevarianterna).
Efter runda 67 fanns **53 utkast kvar** i familjen; elva namn bar två eller fler.

| id8 | familj | färg (VÅR) | källans `Farbe` | pris |
|---|---|---|---|--:|
| `8ca7b3c3` | F loungefåtölj + fotpall, **LUTAR INTE** | **ljusgrå** | ☠️ Cremeweiß | 3 229 |
| `79797c9a` | F | blå | Blau | 3 279 |
| `9a2f6417` | G läsfåtölj 160°, inbyggt fotstöd | **grå** | ☠️ Dunkelgrau | 4 139 |
| `dfb7fcbe` | G | **ljusbeige** | ☠️ Beige | 3 999 |
| `fbba0de8` | H gungfåtölj 135° + fotpall | gräddvit | Cremeweiß | 2 449 |
| `99e2d675` | H | svart | Schwarz | 2 549 |
| `07d52f21` | I biofåtölj 130° + fotpall, 80 cm vägg | svart | Black | 3 119 |
| `ed930c42` | I | **gråbrun** | ☠️ Braun | 3 499 |

Två familjer är medvetet **inte** tagna: `^Relaxsessel, Liegefunktion,
Lederoptik` (trion `d760fffc`/`4b2a7407`/`1a1d04f7`) väntar på Leonards beslut i
ärende #289, och `Relaxsessel im Skandidesign`-kvartetten är en BÄDDFÅTÖLJ
(#288) och hör till den andra sessionens familj D.

## Steg 1 — paren är bevisade på MÅTT

Alla fyra par har **identiska produktmått** och identisk tysk brödtext. Namnet
duger inte som nyckel här: åtta av åtta heter "Relaxsessel …".

⚠️ **Familj I:s syskon skiljer sig i vikt (26 mot 23,5 kg), i paketmått och i
källans MATERIALORD** — `Kunstleder` mot `PVC`. Runda 59:s regel gäller: vikt
och paketmått bevisar inte två produkter, brödtexten gör det, och den är
identisk. PVC-belagd väv ÄR konstläder, så båda skrivs `konstläder`; vikt och
paketmått skrivs per produkt, som källan anger dem.

## Steg 4 — bilderna

Kontaktark (5 × 8) och hörnstrip byggda och granskade med ögon. **Noll tysk
text inbränd, noll leverantörslogotyper.** Måttritningarna bär bara siffror,
`cm`, `°` och `120kg`. Ingen bild plockas bort.

## Steg 5 — det som mätningen ändrade

### ☠️ RUNDANS STÖRSTA FYND: familj F lutar inte

Källan ger `8ca7b3c3`/`79797c9a` **ingen ryggvinkel alls**. Det är en
loungefåtölj med fast rygg, en lös och lutad fotpall, och en 360° stålbas.
De tre andra familjerna i rundan ÄR reclinerfåtöljer — och det är precis
därför felet vore lätt att göra och omöjligt att upptäcka i efterhand.

Texten kallar den `loungefåtölj`, aldrig recliner, och lägger vilan där den
faktiskt finns: i fotpallen, vars **höjd går att ställa mellan 41 och 45 cm**.

### ☠️ Fyra färgnamn stämmer inte med fotot

`farg.py` maskar bort vit bakgrund och skugga och rapporterar den BÄST BELYSTA
delen av klädseln; `farg.png` lägger originalrutan bredvid mätningen.

| id8 | källan | uppmätt | H | L | S | vår text |
|---|---|---|--:|--:|--:|---|
| `8ca7b3c3` | Cremeweiß | (209, 208, 206) | 40 | **81 %** | **3 %** | **ljusgrå** |
| `9a2f6417` | Dunkelgrau | (151, 149, 150) | 330 | **59 %** | 1 % | **grå** |
| `dfb7fcbe` | Beige | (234, 231, 223) | 44 | **90 %** | 21 % | **ljusbeige** |
| `ed930c42` | Braun | (140, 134, 131) | **20** | 53 % | **4 %** | **gråbrun** |
| `79797c9a` | Blau | (92, 116, 136) | 207 | 45 % | 19 % | blå |
| `fbba0de8` | Cremeweiß | (248, 241, 226) | 41 | 93 % | 61 % | gräddvit |
| `99e2d675` | Schwarz | (129, 129, 129) | 0 | 51 % | 0 % | svart |
| `07d52f21` | Black | (130, 131, 136) | 230 | 52 % | 2 % | svart |

⚠️ **Materialet avgör hur talet läses — runda 67:s regel, och den bär igen.**
`99e2d675` och `07d52f21` mäter L 51–52 % och är omisskännligt SVARTA: glansigt
konstläder speglar i den bäst belysta zonen, så man mäter reflexen. `9a2f6417`
är MATT tyg utan spegling, och där ÄR 59 % färgen — alltså en mellangrå, inte
en mörkgrå.

Skillnaden mellan `8ca7b3c3` och `dfb7fcbe` är också mätt, inte tyckt:
(209,208,206) har R=G=B och är neutral; (234,231,223) har R elva steg över B
och är varm. Den ena är grå, den andra en blek varm neutral.

☠️ Källan skriver dessutom `Black` på engelska om `07d52f21` — ett importspår,
inte en färg.

### Fem saker som INTE följde med

1. **"Bomull" om F:s rygg.** Källan skriver `Baumwollrückenlehne` och sedan, i
   sin EGEN materialrad, `Chenille (100% Polyester), Stahl, Schaumstoff`.
2. **"Bomull" och "linne" om G.** Källan skriver `Baumwoll-Leinen-Gewebe` och
   sedan `(60% Polyurethan, 40% Polyester)` — alltså helsyntet. Skrivs
   `linnelook`.
3. **`Kunstleder`/`PVC`-skillnaden i familj I** (se Steg 1 ovan).
4. **360° om G och H.** Källan anger gradsiffran bara för F och I.
5. **Fjäderkärna om F, H och I.** Bara G har den (`Taschenfederkern` + S-fjäder).

### Villkoren som fick egna rubriker

| familj | villkor | rubrik |
|---|---|---|
| F | ryggen är FAST, pallen ställs 41–45 cm | "Ryggen är fast — det är fotpallen som ställs" |
| G | växer från 94 till 167 cm djup | "Så mycket plats den tar" |
| H | 50 cm bakom sig, blir 4 cm bredare fälld | "Ställ den 50 cm från väggen" |
| I | ☠️ **80 cm** bakom sig — rundans största | "Ställ den 80 cm från väggen" |

## Steg 6 — SKU:erna

☠️ Importen gav sex av åtta samma SKU: `FP-relaxsessel-mit-hocker` (fem) och
`FP-relaxsessel` (två). Samma klass som ärende #272 — krocken skapas av
IMPORTEN.

Fyra nya basord, valda så att `sku_bas` (fogeord bort, brytning vid 24 tecken)
ger åtta unika SKU:er — och så att varje ord bär den skillnad kunden ska se:

| id8 | slug | SKU |
|---|---|---|
| `8ca7b3c3` | `loungefatolj-ljusgra-med-fotpall` | `FP-loungefatolj-ljusgra` |
| `79797c9a` | `loungefatolj-bla-med-fotpall` | `FP-loungefatolj-bla-fotpall` |
| `9a2f6417` | `lasfatolj-gra-160-grader` | `FP-lasfatolj-gra-160-grader` |
| `dfb7fcbe` | `lasfatolj-ljusbeige-160-grader` | `FP-lasfatolj-ljusbeige-160` |
| `fbba0de8` | `gungfatolj-graddvit-med-fotpall` | `FP-gungfatolj-graddvit` |
| `99e2d675` | `gungfatolj-svart-med-fotpall` | `FP-gungfatolj-svart-fotpall` |
| `07d52f21` | `biofatolj-svart-med-fotpall` | `FP-biofatolj-svart-fotpall` |
| `ed930c42` | `biofatolj-grabrun-med-fotpall` | `FP-biofatolj-grabrun` |

**loungefåtölj** = lutar inte · **läsfåtölj** = inbyggt fotstöd, ingen lös pall ·
**gungfåtölj** = gungar · **biofåtölj** = bredast sits, mest plats bakom sig.

## Grindarna — och två fel i dem som grinden själv avslöjade

`lint.py` säger 0 fel och `mutationstest.py` **46/46**. Tre saker gjordes om,
och de två första var fel i GRINDEN, inte i texten:

### ☠️ 1. Ett FÖRNEKANDE är inget påstående — utrustningsgrinden visste inte det

Familj G har ingen lös fotpall, och dess FAQ säger just det: *"Ingår det en
fotpall?" / "Nej, och den behövs inte…"*. Grinden fällde den texten. Regeln om
förnekanden fanns hela tiden i `pastaenden` (materialgrinden) — den var bara
inte delad. Den bor nu i `_ar_pastaende` och används av båda, via den nya
`pastar_i_listan`.

### ☠️ 2. En FRÅGA UTAN SITT SVAR lästes som ett påstående

Och det räckte inte. `dela_pa_ankare` lägger en FAQ-fråga i `egna` men dess
SVAR i `kors` när svaret bär länken — så frågan *"Finns det en med lös
fotpall?"* stod ensam SIST i listan, utan nästa mening att läsas mot, och
tolkades som att produkten HAR en fotpall.

⚠️ **Och en nivå upp fanns samma fel igen:** grinden anropades med
`egna + [rubrikfalt]`, så namn/titel/meta blev "nästa mening" efter den
avslutande frågan och gav den ett sammanhang som inte finns. Rubrikfälten
prövas nu för sig.

Påståendet bor alltid i SVARET, och svaret granskas för sig — i `egna` eller
mot länkmålets facit i `kors`. En fråga som inte går att döma ska inte dömas.

### ☠️ 3. Gradtalsgrinden räckte inte — handlingen måste också gatas

Mutationstestet visade att familj F kunde påstå *"fäller ryggen bakåt"* helt
utan siffra, och vara lika falsk. `LUT_RE` tar nu själva handlingen. Mönstret
är avsiktligt snävt (`fäller ryggen`, `ryggen fälls`, `tillbakalutad`,
`ryggvinkel`) så att F:s egna *"går ryggen att fälla?"* och *"vill du ha en
rygg som går att fälla"* inte fastnar — de är fråga och hänvisning, inte
påståenden om den här stolen.

⚠️ **Två av mutationerna var FEL, inte grinden.** Den ena bytte `fjäderkärna`
och missade `Fjäderkärna` med versal — exakt versalfällan som står i filens
egen rubrik, och grinden hade rätt. Den andra påstod något SANT om länkmålet.

⚠️ **`grindar.py` ändrades, alltså kördes runda 66 och 67:s mutationstester om:
35/35 och 41/41, båda oförändrat gröna.** En delad fil som ändras utan att
konsumenterna verifieras är hur tvillingar glider isär.

## Korten

Åtta egna Fyndplats-kort, alla under 215 kB vid q ≥ 85 **utan mjukning** —
till skillnad från runda 67, där den grå chenillen krävde 2,0 px. Här är
chenillen ljusare och väven finare.
