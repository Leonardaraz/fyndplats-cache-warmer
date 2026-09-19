# Runda 112 — nio projektordukar i fem konstruktioner

| | |
|---|---:|
| Produkter | **9** |
| Konstruktioner | **5** |
| Publicerade syskon i familjen före rundan | **0** |
| Bilder i galleriet efter Steg 9 | 48 |
| Bilder strukna för text i pixlarna | 6 |
| Bilder beskurna för text i pixlarna | 1 |

| nyckel | grupp | konstruktion | duk | bildyta | slug |
|---|---|---|---|---|---|
| 1b87909f | A | ram på två stativ, 120 tum | 263 × 148 | 263 × 148 | projektorduk-120-tum-stativ |
| 422ab1bd | B | motoriserad kassett, 92 tum | 165 × 165 | 162 × 162 | projektorduk-92-tum-motor |
| a8c82049 | B | motoriserad kassett, 85 tum | 152 × 152 | 149 × 149 | projektorduk-85-tum-motor |
| ddca577d | C | manuell med autolås, 84 tum | 171 × 128 | 165 × 124 | projektorduk-84-tum-manuell |
| 77d2b35c | C | manuell med autolås, 99 tum | 178 × 178 | 172 × 172 | projektorduk-99-tum-manuell |
| 0370673c | D | trebent golvstativ, svart | 171 × 131 | 165 × 125 | projektorduk-84-tum-stativ-svart |
| fe11166f | D | trebent golvstativ, vit | 171 × 131 | 165 × 125 | projektorduk-84-tum-stativ-vit |
| 623b6504 | E | motoriserad, svart | 171 × 130 | 171 × 130 | projektorduk-84-tum-motor-svart |
| 77e4a558 | E | motoriserad, vit | 171 × 130 | 171 × 130 | projektorduk-84-tum-motor-vit |

## Familjen valdes på en MÄTNING, inte på storlek

Katalogens största orörda block är barnens elfordon, ~100 utkast. Det har
**96 publicerade syskon** som ligger direkt ovanpå de kvarvarande utkasten —
att polera dem hade tillverkat precis de interna dubbletter Google straffar.
`projektorduk` har nio utkast och **noll** publicerade sidor.

Dubblettgrinden inom rundan klarade sig: tre produkter påstår 84 tum vid
~171 × 130, men de skiljer sig på alla fyra talen OCH i konstruktion
(vägg med autolås · trebent golvstativ · motoriserad).

## Två mätningar som avgjorde vad sidorna får säga

☠️ **`1b87909f` är 120 tum, inte 100.** Leverantörens namn sa 100. Tre
oberoende röster sa 120: brödtexten (tre gånger), geometrin (263 × 148 cm ger
118,8 tum) och ritningens egen `120"`. Namnet rättades i Steg 7.

☠️ **Tumtalet räknas på DUKEN, inte på den synliga bilden.** Sju av nio har en
bildyta 3–6 cm mindre per sida, eftersom en svart maskeringskant ligger
innanför dukkanten. Båda talen står därför på varje sida, med etiketter — det
är rundans signaturstycke och sidans enda skydd mot att kunden köper 84 tum och
mäter 165 cm på väggen. De tre där talen är lika säger i stället uttryckligen
att hela duken är bild.

## ☠️ En SJUNDE bild bar tysk text — granskad med FEL FRÅGA

Steg 4 svepte alla 45 bilder med frågan *"bär den text i pixlarna?"* och hittade
sex. Måttritningarna lästes SAMMA DAG i ett eget zoomark, men med frågan
*"vilket tumtal står det?"* — och `1b87909f-3`:s tyska packlista
(`2 x Stative / 8 x Bodenpfähle / 2 x 5 m Seile`) låg i ett mörkt band ovanför
duken och lästes som en del av ritningen. Båda genomgångarna gick vidare.

**En bild som granskats för en fråga är inte granskad för den andra.**

Den gick att beskära bort, tvärtemot `77e4a558-1`: bandet ligger helt ovanför
ramens överkant, alltså på bakgrunden och inte på varan. Uppmätt: tyskan slutar
vid y≈203 av 1400, måttpilen `309 cm` börjar vid y≈259, snittet lades på y=212.

☠️ **Och den beskurna ritningen måste fyllas ut till KVADRAT igen.** En kapad
ritning blir liggande, och PDP:n hämtar galleriet med `fill/…,al_c` —
centrumbeskärningen tar då vänster- och högerkanten, där måttetiketterna
sitter. Beskärningen som tog bort tyskan hade alltså tagit måtten med sig.

## Grindarna fällde MIG fyra gånger, och en gång fällde jag grinden

| var | vad | vems fel |
|---|---|---|
| `grind.py` | `leverantören anger räckvidd…` × 2 | min text |
| `grind.py` | `styvare än en ren plastduk` × 2 | min text |
| `alt.py` | `203 cm` mot sidans `2,03 m` | min alt-text |
| `matt.py`/text | `0370673c-5` visar duken på en gräsmatta medan raden sa `inomhus` | min text |
| `grind.py` | enheten `meter` UTSKRIVEN gick helt ogranskad | grindens hål |

De två tongrindarna ärvdes från runda 111, som byggde dem efter fyra tonfel som
nådde Wix. De fångade fyra nya innan de nådde Wix — en runda senare.

☠️ **Och Steg 12 hittade ett hål, inte ett fel.** Talkontrollen matchade bara
FÖRKORTADE enheter, så `upp till 30 meter` och `kabeln 2,1 meter` gick genom
ogranskade. Båda är sanna (de står i `matt.UNIKT`) — men grinden visste inte
det, och hade släppt igenom vilket tal som helst på de platserna. Verifierat
genom att byta 30 mot 47: grinden fäller, och bara på det.

## ☠️ Två produkter delade SAMMA tyska SKU

Uppmätt före Steg 8: alla nio bar leverantörens tyska sträng, och
`0370673c` och `fe11166f` bar **båda** `FP-projektionsleinwand-im-4`. Exakt den
krock runda 108 mätte upp och som mappningsstämplingen inte ser.

Den mekaniska SKU-regeln hade dessutom gett `FP-projektorduk-84-tum` till FEM
produkter: det som skiljer dem åt (manuell/stativ/motor, svart/vit) ligger i
sluggens svans, och regeln kapar svansen. Behåll svansen, kapa mitten.

## Oskärpan mättes per kort — och mätvägen var fel först

Åtta av nio kort behövde oskärpa, tvärtemot runda 111 där fyra av sju klarade
taket vid r=0. Motivet är skälet: varje duk bär en projicerad fotobild.

```
r=0,0  fe11166f              129 562 byte   ← HELT TOM vit duk
r=1,0  1b87909f 77d2b35c 0370673c
r=1,5  623b6504
r=3,0  ddca577d
r=3,5  422ab1bd a8c82049     ← se nedan
r=5,0  77e4a558              318 062 byte vid r=0  ← fotografi av ett vardagsrum
```

☠️ **Sökskriptet mätte en ANNAN väg än bygget.** Det la oskärpan på det redan
sparade panelfotot (q=94) — en JPEG-vända mer än bygget gör — och underskattade
därför: `422ab1bd` mättes till 214 864 byte och byggde 215 125, `a8c82049`
214 879 mot 215 101. Båda under taket i mätningen, båda över i bygget.
`foto()` går genom `panel()` nu.

## Kategorin

⚠️ Trädet (54 kategorier, två nivåer) har **inget löv** som passar en
projektionsduk — `Dator & Gaming` och `Hörlurar & Ljud` är båda fel. Runbookens
regel gäller: toppkategorin `Elektronik & Tillbehör` räcker. Ett eget löv
(`Bild & Projektor`) hör till kategoriträds-städningen.

## Steg 14 — live-grinden

Grinden är byggd och kör mot de nio publicerade sidorna. Facit
(`facit-live.json`) är **läst ur katalogen efter publiceringen**, inte kopierat
ur rundans egna filer — två filer som bär samma tal är den tvilling huset
förlorat tid på fyra gånger.

Den ärver runda 111:s ordningsfix: materialkontrollen, de förbjudna orden och
tongrindarna läser `rensad`, alltså sidan MED grannarnas identiteter strukna,
och strykningen har en kontrollmätning åt båda håll (sidans egen alt-text måste
stå kvar). Självtestet skiljer "ordet i egen text" från "ordet hos grannen".

Utöver runda 111:s kontroller prövar den rundans egen signatur: BÅDA måtten —
duken och den synliga bildytan — plus tumtalet måste stå ordagrant på varje
sida, och skiljer de sig åt ska raden `Synlig bildyta` finnas.

### ☠️ Första körningen: 0 av 9 gröna — och alla nio var FALSKLARM

Träffen var `1080w` i Wix EGEN `srcset`:

```
…/v1/fill/w_1080,h_1080,al_c,q_72/file.webp 1080w, …
```

Alltså bildens bredd i pixlar, inte ett påstående om duken. `UPPLOSNING`s
`\b1080p?\b` skiljer inte på de två. Ett larm som fyrar på varje korrekt sida
lär mottagaren att sluta läsa — samma regel som mot ett rött synk-jobb vid
varje svep.

Bildadresserna stryks därför före löftesgrindarna och den förbjudna ordlistan;
`trasig relativ länk` läser fortfarande hela `rensad`, eftersom `https:/produkt`
med EN snedstreck överlever strykningen. Alt-texterna är attributvärden och
står kvar.

⚠️ Uppmjukningen prövas ÅT BÅDA HÅLLEN — utan det hade fixen kunnat vara
`return []` och sett lika grön ut:

| fall | ska |
|---|---|
| `1080p och 4K` i egen brödtext | **fälla** |
| `1080w` i Wix srcset | släppa igenom |
| materialordet i egen text | **fälla** |
| materialordet hos grannen | släppa igenom |

⚠️ **Öppen fråga för mallen:** varje live-grind som söker rena TAL i hela
HTML:en har samma hål. Bildadresserna bär `w_1080`, `h_2000`, `q_85` och fil-id
fulla av siffror. URL-strykningen hör hemma i mallen, inte bara i den här
rundan.

### ✅ Andra körningen: 9 av 9 gröna

```
självtest: 4 fall, 0 fel

OK  projektorduk-120-tum-stativ         154 748 tecken   cache=HIT age=20
OK  projektorduk-92-tum-motor           157 598
OK  projektorduk-85-tum-motor           157 560
OK  projektorduk-84-tum-manuell         154 714
OK  projektorduk-99-tum-manuell         158 002
OK  projektorduk-84-tum-stativ-svart    159 929
OK  projektorduk-84-tum-stativ-vit      158 460
OK  projektorduk-84-tum-motor-svart     155 197
OK  projektorduk-84-tum-motor-vit       144 288

9 av 9 sidor gröna
```

Varje sida bär hjältebilden, vårt eget kort, alla tre flikarna, sitt eget
materialord, BÅDA måtten och tumtalet — och noll tyska ord, noll husmärken,
noll artikelnummer, noll leverantörsattribution, noll intern jargong.

## Klart

| steg | utfall |
|---|---|
| 7 text | 9/9 — LEN, HASH, namn, slug, titel, meta, pris orört |
| 8 SKU | 9/9 — strängen läst tillbaka, inte förekomsten |
| 9 bilder | 9/9 — 48 alt-texter, nio kort, noll tomma alt |
| 10 kategori | 9/9 — `totalSuccesses: 1` var, en kategori per anrop |
| 13 publicering | 9/9 LIVE, variant synlig, klart-kriteriet kört FÖRE |
| mappningsstämpel | 9/9 workflow-körningar `success` |
| 14 live-grind | **9/9 gröna** |

