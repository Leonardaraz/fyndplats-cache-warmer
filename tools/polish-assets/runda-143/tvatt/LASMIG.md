# `f8d974b3-3.jpg` — måttritningen med leverantörens logotyp borttvättad

Källa: `b379ce_6f68122392694751a2da5c6a8d64e2ed~mv2.jpg` (2000 × 2000), bild 3
på `f8d974b3`. Den bar **`SPORTNOW by Aosom`** inbränt i ÖVRE HÖGRA hörnet —
se `STEG4.md` fynd 1 och uppgift #565.

Logotypen låg på bakgrunden, inte på varan, och är därför tvättbar. Leonards
gräns gäller åt andra hållet: ett märke som sitter FYSISKT på godset rör vi
inte.

## Så gjordes den, och varför varje tal är MÄTT

| | |
|---|---|
| Logotypens spann | y 154–258, x 1588–1960 — **11 578 pixlar** |
| Varans översta pixel i samma kolumner | **y 323** |
| Tvättruta | y 120–300, x 1560–1990 |

Rutan ligger alltså helt i luften mellan bildkanten och varan, med 23 rader
marginal ned till produkten. Tre `assert` vaktar det: ingenting får finnas
ovanför, under eller till vänster om rutan, och logotypen måste räknas till
exakt 11 578 pixlar — annars är det inte den bild koden tror.

Bakgrunden ÅTERSKAPAS rad för rad som en linjär blandning mellan provet till
vänster om rutan och provet till höger, följt av en gaussisk utjämning som
bara rör rutan. Den är en slät gradient, så det är en rekonstruktion och inte
en gissning — och det är mätt:

| kontroll | utfall |
|---|---|
| pixlar ändrade UTANFÖR rutan | **0** |
| logotyppixlar kvar | **0** |
| rekonstruerad rad mot orörd rad ovanför | avvikelse **1,3 / 0,5 / 0,0** av 255 |

☠️ **Ingen rektangel målades vit.** Runbookens regel är att text ovanpå varan
tas bort med inpainting och aldrig med en ifylld ruta; här ligger texten på
bakgrunden, men samma försiktighet gäller — rutan får inte nudda varan, och
`assert`-raderna är det som gör den regeln till kod i stället för till avsikt.

Jämförelsearket granskades med ögon före uppladdningen: måttlinjerna
`182–225 cm`, `90 cm` och `170 cm` står kvar oskadda.

Skalad till 1600 × 1600 vid q=86 (298 kB) — 2000 × 2000 gav 634 kB, och
runbooken har mätt upp att stora filer fastnar i `PENDING`.
