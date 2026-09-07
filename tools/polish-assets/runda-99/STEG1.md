# Runda 99 — Steg 1: familjens två sista kluster

## Vad som är kvar efter runda 98

Runda 98 avgjorde #348: foderstationsklustren är **färgsyskon, inte
dubbletter**. Fyra modeller sålda i tre till fyra kulörer var. Två av dem är
polerade och publicerade; de två sista är den här rundan.

| modell | artikelnummer | utkast | vad den är |
|---|---|--:|---|
| **C** | `D08-041` | 4 | lådskåp, 60 × 30 × 36 cm, EN stor låda på metallskenor |
| **D** | `D08-021` | 3 | matstation, 60 × 30 × 41 cm, HELA skivan lyfts av |

Sju utkast, två kompletta färgfamiljer, noll rester. Efter den här rundan är
foderstationsfamiljen slut.

## Artikelnumren, och en precisering av #275

#275 fastställde att **BASEN är modellen och SUFFIXET är färgen**. Det håller
här för fjärde gången — men suffixet går inte att AVKODA, och det är nytt:

```
D08-041V80GY   D08-041V80CF   D08-041V01BK   D08-041V00WT      ← fyra färger
D08-021WT      D08-021V00GY   D08-021CF                        ← tre färger
```

Fyra färger av SAMMA modell bär tre olika V-nummer (`V80`, `V01`, `V00`), och
modell D:s vita och bruna saknar V-delen helt. Kulörkoden i slutet (`GY`, `CF`,
`BK`, `WT`) är läsbar; allt mellan basen och den är det inte.

⚠️ **Följden: matcha på BASEN, läs aldrig ut modellen ur suffixet.** Hade
grinden krävt samma V-nummer för att räkna två rader som syskon, hade den
delat modell C i tre familjer och modell D i två — och rundan hade polerat
sju sidor som säger samma sak med olika ord.

## Prisgrinden

Alla sju passerar. `las`-läget i poleringsworkflowen avslutar med `exit 1` på
`stammer: false` för en Aosom-rad, så en lyckad körning ÄR kvittot.

| id8 | artikelnummer | `landedCostSek` | pris |
|---|---|--:|--:|
| `8c1d08c5` | D08-041V80GY | 768,50 | 929 |
| `3710a0c3` | D08-041V80CF | 792,23 | 959 |
| `5eb270ed` | D08-041V01BK | 800,83 | 969 |
| `31d6a3df` | D08-041V00WT | 830,23 | 999 |
| `a8e376e7` | D08-021WT | 666,28 | 799 |
| `5d7aab1b` | D08-021V00GY | 748,02 | 899 |
| `edd89684` | D08-021CF | 747,71 | 899 |

## Sökord och sluggar

Modell C är ett skåp med förvaring under skålarna — samma huvudord som runda
97 och 98: **matskåp hund**. Modell D har inga dörrar och ingen låda alls;
hela skivan lyfts av. Den får **matstation hund**, ett huvudord ingen
publicerad sida i katalogen använder.

| id8 | slug |
|---|---|
| `8c1d08c5` | `matskap-hund-36-cm-lada-21-liter-gratt` |
| `3710a0c3` | `matskap-hund-36-cm-lada-21-liter-brunt` |
| `5eb270ed` | `matskap-hund-36-cm-lada-21-liter-svart` |
| `31d6a3df` | `matskap-hund-36-cm-lada-21-liter-vitt` |
| `a8e376e7` | `matstation-hund-41-cm-lyftbar-skiva-vitt` |
| `5d7aab1b` | `matstation-hund-41-cm-lyftbar-skiva-gratt` |
| `edd89684` | `matstation-hund-41-cm-lyftbar-skiva-brunt` |

☠️ **SKU:erna skrivs för hand, inte ur sluggen.** Husets regel kapar vid 24
tecken, och `matskap-hund-36-cm-lada-21-liter-…` är identisk ända till tecken
34 — fyra färgsyskon hade fått samma SKU (#272). Modell D är värre än så
redan i utgångsläget: fem av rundans sju utkast bär I DAG en av två SKU:er
(`FP-futterstation-erhohte`, `FP-futterstation-2`), alltså krockar importen
redan över modellgränsen.

| id8 | ny SKU | nuvarande |
|---|---|---|
| `8c1d08c5` | `FP-matskap-36-lada-gra` | `FP-futterstation-erhohte` |
| `3710a0c3` | `FP-matskap-36-lada-brun` | `FP-futterstation-erhohte` |
| `5eb270ed` | `FP-matskap-36-lada-svart` | `FP-futterstation-2` |
| `31d6a3df` | `FP-matskap-36-lada-vit` | `FP-futterstation-2` |
| `a8e376e7` | `FP-matstation-41-vit` | `FP-erhohter-hundenapf` |
| `5d7aab1b` | `FP-matstation-41-gra` | `FP-futterstation-erhohte` |
| `edd89684` | `FP-matstation-41-brun` | `FP-futterstation-2` |

## Korslänkarna

Sex syskon i batchen plus tre publicerade, byggda mekaniskt ur `SLUGG` +
`KORTNAMN` — aldrig för hand, eftersom transkriptionshashen är blind för
länkar (runda 97).

- `husdjursskap-82-cm-matplats-i-lada` (runda 97) — närmaste kusinen till modell C
- `matplats-hund-tre-hojder-kaffebrun` (runda 97) — närmaste till modell D
- `matskap-hund-46-cm-skjutdorrar-50-liter` (runda 98)
