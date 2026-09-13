# Runda M3 — åtta konstgjorda julgranar

Granhögen har legat som "31 utkast × 36 publicerade behöver fotobedömning,
kostnaden fastställd". Den bedömningen behövde aldrig göras för hand.

## ☠️ Dubblettskärmen på granhögen: 62 av 62 unika, noll delade

M2:s teknik (#243) körd på hela granfamiljen — huvudbildens `hash` ur Wix
filbeskrivare, **noll nedladdningar**:

| | |
| :-- | --: |
| Tyska gran-UTKAST | 29 |
| Publicerade svenska julgranar | 33 |
| Bilder jämförda | 62 |
| Unika hashar | **62** |
| Delade huvudbilder | **0** |
| Samma bytestorlek, olika hash | **0** |

Den byte-identiska dubblettklassen är därmed **utesluten för hela granhögen**,
och den andra kolumnen är med för att M2 visade att hashen ensam inte räcker:
där fanns en plansch i två byte-varianter, 80 byte isär. Här finns ingen sådan.

⚠️ **Det är en skärm, inte ett frikännande** (#194): hash och måttjämförelse
fångar OLIKA dubbletter. Men för granar är spetsantalet en ovanligt skarp
nyckel, och de tyska utkastens tal (296, 738, 888, 1290, 1942, 2419, 2608,
3026) möter inget av de publicerades (200, 358, 375, 444, 479, 505, 523, 600,
631, 657, 724, 748, 1000, 1036, 1111, 1162, 2380, 4030).

## ☠️ Sex av 29 källtexter bär Aosoms artikelnummer — i själva källan

Hittat när `03658e32` skulle läsas in: dess tyska specblock innehåller en rad
med artikelnumret i klartext. Uppmätt över alla 29:

| | |
| :-- | --: |
| Granutkast granskade | 29 |
| **Med artikelnummer i KÄLLTEXTEN** | **6** |

Det är ett problem för husets egen konvention. Källfilerna sparas ORDAGRANT
med kontrollsumma som bevis (#225) — och repot är PUBLIKT. En ordagrann
källfil för någon av de sex hade alltså committat precis den sträng
dealproffsen.se publicerar som `sku`/`mpn`.

De sex är därför **inte valda till den här rundan**. De går att polera, men
källan får inte lagras ordagrant, och den frågan är en egen.

### ⚠️ Redan committat: noll — och den första mätningen var ett falsklarm

Ett svep över alla rundors `kalla/` och `kallor.json` gav först en träff i
`runda-j2-lampor`. Den var **inte** ett artikelnummer utan spänningsintervallet
`220V-240V`, som matchar det breda mönstret `\d{2,3}[A-Z]-\d{3}[A-Z0-9]*`.

Med voltintervallet undantaget: **0 committade källfiler bär ett äkta
artikelnummer.** Konventionen har alltså inte läckt hittills — granfamiljen är
första gången den skulle ha gjort det.

☠️ Och lärdomen om grinden själv: ett mönster som fyrar på varje elprodukt lär
mottagaren att sluta läsa. Undantaget hör till mönstret, inte till ögat.

## De åtta

| kort | pris | vad det är | lager |
| :-- | --: | :-- | --: |
| `89d967af` | 1 849 | 210 cm, 2 608 grenar, 140 × 140 | 133 |
| `d09b1b4c` | 1 619 | 180 cm snötäckt, 250 LED, 888 spetsar, Ø105 | 197 |
| `5edc1480` | 1 449 | 180 cm, 1 942 grenar, 136 × 136 | 197 |
| `efba03f0` | 1 069 | 150 cm, 1 290 grenar, Ø100 | 90 |
| `bdc71526` | 959 | 120 cm snötäckt, 100 LED i 8 lägen, Ø70 | 197 |
| `9f776653` | 899 | 225 cm pennsmal med snö, 738 spetsar, Ø68 | 83 |
| `28aa840d` | 879 | mini 90 cm i vit kruka, 296 spetsar, Ø66 | 87 |
| `e1d9dfe8` | 599 | 2-pack mini 57 cm, 24 LED, batteri, IP44 | 97 |

⚠️ **Tre av dem har IDENTISKT tyskt namn** — `89d967af`, `5edc1480` och
`efba03f0` heter alla `Weihnachtsbaum, Kunsttanne, realistisches Aussehen,
schneller Aufbau`. Källorna visar att det är samma modell i **210, 180 och 150
cm**, med 2 608 / 1 942 / 1 290 grenar. Samma mönster som M2:s två
polkagristomtar: skillnaden måste stå i namnet och i första meningen, annars
går de inte att skilja åt på ett kort.

Alla åtta har en variant och spårat saldo 83–197.

## Källorna

8/8 hämtade ordagrant ur skarpa Wix med kontrollsumman räknad i anropet, och
bevisade LIKA mot `kvitto-kalla.json` innan någon text skrevs. Noll
artikelnummer i rundans källor.
