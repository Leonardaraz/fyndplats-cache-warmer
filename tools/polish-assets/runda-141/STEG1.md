# Runda 141 — Steg 1: familjemätning och val

Familjen är **hantelbänkar / träningsbänkar** — åtta tyska utkast.

## ☠️ Runda 140:s tabell UNDERSKATTADE de publicerade, och åt farligt håll

Den tabellen sa `hantelbank / träningsbank: 13 utkast mot 7 publicerade` och
pekade ut familjen som den glesaste kvar. Ett brett svep mot sitemapen
(2 702 produktsidor, EN hämtning, inget Wix-anrop) ger **11 publicerade**:

```
gymstation-207-cm-vridbara-armar          justerbar-traningsbank
gymstation-traningsbank-65-kg-viktblock   justerbar-traningsbank-hopfallbar
hemmagym-benpress-160-cm-45-kg            kompakt-gymstation-162-cm-latsdrag
hopfallbar-traningsbank-justerbart-...    multigym-250-cm-bank-dipstation
scottbank-2-i-1-biceps-triceps-25-vinklar sissy-squat-bank-3-i-1
traningsbank-med-benrullar-gummiband
```

Fyra av dem heter varken `traningsbank` eller `hantelbank` i sluggen
(`gymstation-…`, `hemmagym-…`, `multigym-…`, `scottbank-…`, `sissy-squat-…`).
Det är #494 ordagrant: **ett stamord räcker aldrig.** Och riktningen spelar
roll — en UNDERskattning av publicerade får en familj att se tommare ut än
den är, alltså väljer man fel familj på ett för lågt tal.

## Hela kandidatlistan, publicerade brett mätta

| familj | tyska utkast | publicerade | kvot |
|---|--:|--:|--:|
| soptunna | 36 | 25 | 1,44 |
| **hantelbänk / gym** | **13** | **11** | **1,18** |
| hönshus | 15 | 17 | 0,88 |
| smådjursstall | 19 | 23 | 0,83 |
| valphage / hundgrind | 17 | 27 | 0,63 |
| campingtält | 11 | 24 | 0,46 |
| gungstol | 10 | 26 | 0,38 |
| golvlampa | 17 | 31 | 0,55 |

Soptunnorna har högst kvot men bedömdes i runda 140 vara *"i praktiken
klara"* — 25 publicerade soptunnor täcker mönstret pedal/sensor/2-fack/3-fack
i alla storlekar, så de 36 utkasten är med stor sannolikhet färgsyskon och
dubbletter. Det är en bedömning värd att mäta i en egen runda, inte att
inteckna här.

## Batchen: de åtta `Hantelbank*`

| pid | pris | tyskt namn |
|---|--:|---|
| `8de3c3ef` | 999 | Hantelbank verstellbar Trainingsbank mit Beinstrecker 7-Fach |
| `562e42fc` | 1 239 | Hantelbank, Klappbar Trainingsbank mit 7-fach verstellbarer |
| `7b818c3b` | 1 379 | Hantelbank, 8 Positionen, klappbar, Stahlbasis, gepolstert |
| `8a0e05f4` | 1 429 | Hantelbank Fitnessbank Schrägbank Multifunktion Bauchtrainer |
| `b4961e6f` | 1 479 | Hantelbank klappbar Trainingsbank mit Beinstrecker 3-Fach |
| `83b2cf8b` | 1 959 | Hantelbank ohne Gewichte, verstellbare Fitnessbank |
| `a4bbe667` | 2 099 | Hantelbank mit Hantelablage, Brustpresse, Beinpresse, Armauflage |
| `18b94738` | 2 329 | Hantelbank mit Hantelablage, 1 Aufbewahrungskorb, 6 Positionen |

Alla åtta: `visible:false`, `IN_STOCK`, `variantCount: 1`, EU-lager-ribbon,
kategori `All Products` och inget löv.

## ⚠️ Två grannfamiljer som INTE är med, och varför

- **`Fitness*` gav sju träffar — sex är TRAMPOLINER.** `Fitness-Trampolin`,
  `Fitnesstrampolin`, i flera färger och storlekar. Samma huvudordsfälla som
  `Regal` i runbokens exempel: ordet är en EGENSKAP här, inte produkttypen.
  De är en egen familj för en senare runda.
- **`3350c5b2` Fitness Latzug Gym** (839 kr) är en latsdragsstation, inte en
  bänk. Den publicerade `kompakt-gymstation-162-cm-latsdrag` täcker
  produkttypen redan — den hör till en gymstationsrunda, inte den här.

## Vad som återstår att mäta innan Steg 2

☠️ **Elva publicerade sidor är en HÖG krockrisk**, tvärtemot runda 140:s
premiss. Dubblettgrinden i Steg 1 måste därför köras mot alla elva, på mått
och bild — inte bara mot batchens egna åtta. Runda 102:s regel: måttgrinden
körs mot HELA familjen, aldrig mot rundans batch.
