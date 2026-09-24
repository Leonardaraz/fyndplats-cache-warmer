# Runda N2 — körlogg

Åtta produkter, 599–829 kr. Leonards regel för den här rundan: fortfarande
bara produkter där vi är billigare än dealproffsen, men sorterat på **vårt
pris stigande** i stället för på gapets storlek.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 4533ca25 | 599 | 629 | +30 | Hundryggsäck 42 cm med utfällbar sida |
| c8376256 | 669 | 679 | +10 | Konstgjord häck på rulle 300 × 100 cm |
| d5d1ff3c | 699 | 829 | +130 | Brödrost för fyra skivor, sju lägen |
| 31d6d517 | 779 | 1 049 | +270 | Förvaringspall 40 cm med vändbart lock |
| 67ba375c | 799 | 899 | +100 | Konstgjord monstera 110 cm |
| 6e73f024 | 799 | 829 | +30 | Tvättkorg i vide 57 cm |
| d5919be6 | 819 | 899 | +80 | Sittbänk 100 cm i mörkgrön sammetslook |
| 5240178f | 829 | 949 | +120 | Pall i turkos sammetslook 44,5 cm |

## Steg för steg, med kvitton

| steg | utfall |
| :-- | :-- |
| Källor hämtade ordagrant, summa räknad i anropet | 8/8 |
| Källor bevisade mot filerna på disk | **8/8 LIKA** |
| Artikelnummer i källtexterna | **0 av 8** |
| Lagergrind i urvalet | 8/8 spårat saldo, 7–197 |
| Dubblettskärm mot 2 782 publicerade sidor | 5 kandidater fällda |
| Kontaktark byggt FÖRE brödtexten | 8 ark, 40 bilder, 40 unika md5 |
| Grindar (siffer/axel/superlativ/länk/alt/seo/sku/lager) | **rena** |
| Prisgrind via `las` | **8/8 utan fall** |
| Transkriberingsspärr FÖRE varje skrivning | **8/8 stämde**, noll avbrott |
| Bilder skrivna | 39 (en tysk banner borttagen) |
| Alt-texter skrivna | 39, noll tyska, noll tomma |
| SEO skriven | 8 × två taggar, keywords rensade |
| Variant-SKU skriven | 8/8 svenska, i ett eget sista anrop |
| Kategorier | **14/14 kopplade**, bekräftade i bulk-svaret |
| Separat Wix-återläsning mot facit | **8/8 byte-exakta** |
| Mappningsraderna stämplade | 8/8 |

## ☠️ Urvalet: fem av de tjugofyra billigaste var dubbletter

Dubblettskärmen kördes på typord mot namnen på alla 2 782 publicerade sidor,
och därefter på MÅTTEN för de kandidater där namnet inte räckte.

| fälld | skäl |
| :-- | :-- |
| `b50a2c94` skärmtak 110 cm | publicerad "Skärmtak 110 × 60 cm i polykarbonat" |
| `65d3d373` hundsäng 76 × 61 × 71 | publicerad "Upphöjd hundbädd 76 cm" är 76,2 × 61 — samma fotavtryck, vår är takversionen |
| `70c17966` buxbomsklot | nio publicerade i samma familj |
| `dd8902e8` kattlåda | nitton publicerade |
| `9a66c056` soptunna 30 L grå | publicerad "Soptunna 30 liter pedal – grå" |

Säsongen tog fem till (utomhussittdynor, växthus, odlingslådor), saldo 0 tog
en (`7f2daa1e`), och två syskonpar fick lämna sin ena halva.

⚠️ **Och den viktigaste träffen kom av en BREDARE fråga.** Häckrullen
`c8376256` gav **noll** träffar på sitt eget typord (`växtvägg`). Frågan
ställdes om med grönt-ord × ytform, och då föll publicerade *"Konstgjord häck
på rulle 300 × 150 cm"* ut. Samma bladmått 7 × 6 cm, samma material, samma
färg — det är samma rulle i två höjder.

Den är med i rundan som ett medvetet **storleksval**, inte som en upptäckt:
namn, SEO-titel och brödtext säger 100 cm i första meningen. En nolla från
ett för smalt typord mäter typordet, inte katalogen.

## ☠️ Två fynd i grindarna, båda i FACIT och inte i texten

### 1. Axelfacit: en totalhöjd räcker, två tal utan H gör det inte

Generatorn avbröt på konstväxten (`Gesamthöhe: 110 cm`, inget totalmått) och
gav häckrullen ett facit som hade **fällt en korrekt mening**: `L300 x B100`
lades ut positionellt som bredd + djup, men Aosoms egen måttritning sätter
100 som HÖJD.

Båda lagade i `bygg-axelfacit.py`, med sex tester. M1–M4 och N1 regenererar
byte-identiskt.

### 2. Återläsningen sa SKILJER på åtta felfria skrivningar

Avvikelsen var exakt 7 tecken per `<li>`. `hasha.py` hämtade sin
normalisering ur `gatelib`, som kände två av Wix fem åtgärder. Tre kopior
fanns samtidigt:

```
gatelib.normalisera   2 regler
kvitto.py             4 regler
wixnorm.normalisera   5 regler   uppmätt mot skarpa V3
```

Mot wixnorm stämmer den lagrade texten på alla åtta. De två kopiorna är
borta, och tre tester fäller om en tvilling kommer tillbaka.

## Vad fotona ändrade

Se `FOTOFYND.md`. Kort: brödrosten är stål med svarta gavlar (källan säger
svart), häckens svenska spec-rad har fel färg, tvättkorgen är vide och inte
rotting, och förvaringspallens lock är vändbart — vilket bara syns när
källans `furnierter Oberfläche` läses ihop med bild 3 och 4.

## Kvar efter rundan

- `4533ca25` har fyra bilder och ingen måttritning kvar. **Kandidat för ett
  eget måttkort** — måtten finns i klartext i texten.
- `c8376256` och publicerade 300 × 150-rullen är ett storlekspar. Ingen av
  dem säger i dag att den andra finns.
- ⚠️ Importens spec-bygge satte FEL färg på häcken. Hur många andra utkast
  som bär en färg som inte är produktens är **omätt**.
