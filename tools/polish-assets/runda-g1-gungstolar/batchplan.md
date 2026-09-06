# Runda G1 — åtta gungstolar, 1 599–1 839 kr

Ny familj efter att kattmöblerna tog slut (F1 + F2 = 16 sidor, noll utkast kvar
i svepets skivor 2 och 3). Gungstolar är inomhus och höstsäsong, och familjen
står som oägd i FORDELNING.md medan den andra sessionen kör kontorsstolar och
rullpallar.

## Urvalet

| kort | pris | modell | tyg | färg |
|---|--:|---|---|---|
| `4f98b924` | 1 839 | teddy 69 × 92 × 100 | Teddytyg | Gräddvit |
| `bde44d3c` | 1 739 | teddy 71 × 91 × 97, **sidoficka** | Teddytyg | Grå |
| `dd4e1e06` | 1 729 | teddy 70 × 94 × 100 | Teddytyg | Ljusgrå |
| `3dbd4f08` | 1 649 | vintage 98 × 71 × 101 | Manchester | Beige |
| `25405611` | 1 639 | vintage 98 × 71 × 101 | Manchester | Gul |
| `b4441140` | 1 629 | teddy 70 × 94 × 100 | Teddytyg | Gräddvit |
| `48432e48` | 1 619 | vintage 98 × 71 × 101 | Sammetslook | Mörkgrå |
| `3b5a67d9` | 1 599 | vintage 98 × 71 × 101 | Manchester | Ljusgrå |

## Förkontroller (mätta, inte antagna)

| kontroll | utfall |
|---|---|
| Dubblettkoll på MÅTT mot alla 9 publicerade gungstolar | se `dubblettkoll.md` |
| Prisgrind (`polish-mapping.yml` läge `las`) | **8/8 gröna** |
| Saldo | **8/8 `IN_STOCK`** |
| Alla åtta är utkast | ja, `visible:false` |
| Varianter per produkt | 1 |

## ☠️ Två namngrindar som MÅSTE hållas i den här rundan

1. **Tyget ska stå i namnet, inte bara färgen.** Fyra utkast delar stomme med
   den publicerade `bc32d396` (beige bouclé). `3dbd4f08` är beige manchester —
   samma stomme, samma färg, annat tyg, 110 kr billigare. Utan tyget i namnet
   ser de två ut som samma vara.
2. **Två gräddvita teddystolar är OLIKA modeller.** `4f98b924` (69 × 92 × 100,
   sits 48 × 53) och `b4441140` (70 × 94 × 100, sits 50 × 46, 10 cm rygg).
   Särskilj på sitsen eller ryggen i namnet — färgen räcker inte.

## ☠️ Ordningen är inte valfri (ärvd från F2)

Text medan produkten är utkast; **SKU och publicering SIST och i SAMMA
skrivning**, eftersom en `variantsInfo`-PATCH publicerar ett utkast och en sen
text-PATCH utan `variantsInfo` speglar ner variantens `visible` till false —
det var så 31 sidor blev oköpbara.

⚠️ Och `variantsInfo.variants[].media` går inte att skriva tillbaka
(F2:s mätning, fem former över två endpoints). Skicka den inte "för säkerhets
skull" — den ignoreras ändå.

## ⚠️ Kollisionsförsvar

FORDELNING.md ligger på den andra sessionens gren, så jag kan inte skriva mitt
anspråk där. Jag följer filens egen praktiska regel i stället: **läs
`revision` före varje skrivsteg och jämför mot den jag lämnade.** Revisionerna
vid rundans start:

```
25405611 rev 1   3b5a67d9 rev 1   3dbd4f08 rev 1   48432e48 rev 1
bde44d3c rev 2   4f98b924 rev 2   dd4e1e06 rev 2   b4441140 rev 2
```
