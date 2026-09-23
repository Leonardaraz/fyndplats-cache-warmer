# Runda 135 — Steg 1: familj, krock och måttgrind

## Katalogen, svept KLART

☠️ Första svepet stannade på 30 varv och rapporterade `avhuggen: true` —
3 000 av 5 688 produkter. Det är runbokens egen fälla: ett avhugget svep ser
ut precis som ett färdigt, för båda returnerar rader och inget fel. Kvittot är
`cursor === null`.

| | |
|---|--:|
| Produkter totalt | **5 688** |
| Publicerade | **2 615** |
| Utkast | 3 073 |
| Varv till `cursor === null` | 57 |

Talet 2 615 stämmer exakt mot sitemapens 2 615 `/produkt/`-rader, mätt samma
dag av ett helt annat verktyg. Två oberoende mätningar, samma tal.

## Familjen

Klösmöbler för katt: **56 utkast mot 68 publicerade sidor**. Det är en TÄT
kategori, och där räcker inte sökordskrocken — måtten måste mätas.

## ☠️ Måttgrinden mot UTKASTEN: fem tvillingpar av trettio

Runbokens regel: tvillingarna sitter oftast i utkastshögen, inte mot en
publicerad sida. Ingen id-baserad kontroll kan se dem — de har olika
artikelnummer och är olika varor för leverantören. Mätt på paketmått + vikt:

| par | paketmått | vikt | dom |
|---|---|--:|---|
| `97b5e7e9` · `b92a9b5f` | 42 × 42 × 69 | 11,45 kg | **tvillingar** |
| `f489937f` · `5616c567` | 48 × 23 × 52 | 7 kg | **tvillingar** — namnen skiljer bara i ordföljd |
| `1ae60dbc` · `819bf51c` | 61 × 12 × 41 | 7,9 kg | **tvillingar** |
| `f5f71f5d` · `dd3b541b` | 50 × 50 × 16 | 9,2 kg | **tvillingar** — men namnen säger 48 × 48 respektive 90 cm |
| `40690da1` · `b1dd61b1` | 54 × 46 × 59 | 5 / 5,2 kg | nära — trolig FÄRGSYSKON |

⚠️ `6f9fee21` och `f8069f60` bär samma namn ordagrant men är INTE tvillingar:
42 × 42 × 36 / 4,2 kg mot 51 × 51 × 43 / 5,4 kg. Två storlekar av samma korg.
**Namnet avgör alltså ingenting åt något håll** — varken likhet eller skillnad.

⚠️ Och en måttmatchning är ett SÅLL, inte en dom. Paren ovan ska avgöras med
BILDERNA i Steg 4 innan någon av dem poleras eller pensioneras.

## Batchen

Åtta utkast, alla med skild höjd OCH skild konstruktion, ingen med en tvilling
i listan:

| id8 | vad | paketmått | vikt |
|---|---|---|--:|
| `0696efce` | 3-i-1 med bollbana, golvmodell | 47 × 36 × 26,5 | 8,8 kg |
| `bdc7e768` | fårdesign med tunnel | 52 × 37,5 × 30,5 | 5 kg |
| `5d64f423` | 61,5 cm med bädd och hoppyta | 53 × 22 × 49 | 5 kg |
| `82efeeaf` | två plan, klösstammar och klösklot | 56 × 14 × 58 | 7 kg |
| `7564dcfb` | 87 cm, tjock klöspelare | 47,5 × 33 × 47,5 | 6 kg |
| `e2c8b0f3` | 98 cm, bladdesign | 39,5 × 18 × 32,5 | 4,85 kg |
| `cc5da788` | 100 cm med håla | 50 × 41 × 41 | 6,8 kg |
| `741c5723` | 132 cm med koja | 56,5 × 21 × 46 | 12 kg |

Måtten ovan är PAKETETS, inte varans — spec-tabellens `Vikt` är fraktvikten
(uppgift #488). Varans mått läses i Steg 3 och verifieras i Steg 5.
