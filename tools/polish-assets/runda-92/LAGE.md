# Runda 92 — läget

**Sparkcykelfamiljens sista Tretroller-utkast är publicerat.** Familjen har
därmed noll kvarvarande utkast av den här modelltypen.

| id8 | slug | pris | SKU | bilder |
|---|---|--:|---|--:|
| `ea013fde` | `sparkcykel-barn-135-cm-16-tum-svart` | 1 299 | `FP-sparkcykel-135-cm-svart` | 6 |

## Kvitton, mätta

| | |
|---|---|
| Katalogsvep | 56 sidor, 5 527 rader, 5 527 unika, markören uttömd |
| Dubblettgrind | mätt mot tre publicerade 16-tumssidor — ingen dubblett |
| Pixelgrind mot syskonet | lägsta gråskalediff **35,9** (tak 1,0) |
| Lint | 0 brister, självtest **36 regler** |
| Mutationstest | **21/21** |
| JS-hash mot Python-facit före skrivning | **1/1** |
| Återläsning av beskrivningen | 3 445/3 445 tecken, hash exakt |
| Bilder: skickade = tillbaka, utan alt-text | 6/6, **0**, kortet på plats 3 |
| Kategorier (Barn & Familj + Leksaker & Spel) | 2/2 skrivningar, båda verifierade |
| SKU | `stammer: true`, 26 tecken, `visible` orört `false` |
| Prisgrind | `landedCostSek 1089,74 → 1299 = 1299`, charm99 |
| Mappningsstämpel | grön |
| Publicerad | `visible: true` |
| Korslänk tillbaka på rosa syskonsidan | skriven, längd = gammal + tillägg, **1** länk |
| Live-svep mot kontrollsida | **0 av 1 sidor med problem** |
| Kort + alt-texter live | kortet renderat, **12 unika** alt-texter |
| Båda korslänkarna live | 200 · 200, och länken tillbaka syns på rosa sidan |
| Trasiga `https:/produkt`-länkar | **0** |

## Vad rundan lärde huset

☠️ **TALGRINDEN HADE ETT ÄKTA HÅL, ärvt från runda 91.** `TAL_LANK` fanns för
att en korslänk måste få bära syskonets mått ("143 cm-versionen väger 10,6 kg").
Men listan gällde HELA sidan, och den vanligaste förväxlingen i en färgfamilj är
just att skriva syskonets mått i sin egen spec-tabell. Båda mutationerna gick
rakt igenom en grind som annars fällde nitton av tjugoen.

Grinden är nu **zonindelad**: ett länkat tal är tillåtet bara i ett stycke som
faktiskt bär `<a href`. Samma tanke som randgrindens per-fras-krav i runda 91 —
*en tillåtelse ska gälla där den är motiverad, inte på hela sidan.*

☠️ **DUBBLETTGRINDEN VAR INTE ÖVERFLÖDIG.** Katalogen har två publicerade
16-tumssidor och den ena är SVART, precis som utkastet. Det såg ut som en
dubblett tills måtten mättes: 143 cm-sidorna har lika stora hjul fram och bak
och väger 10,6 kg, medan utkastet är 135 cm med 16"/12" och 9,8 kg. Utkastet är
i stället färgsyskonet till den ROSA 135 cm-sidan — varje mått sammanfaller.

⚠️ **En ny slug svarar 404 direkt efter publicering — mätt till ~4,5 minuter.**
Sidan fanns aldrig förut, så ISR måste generera den; den första hämtningen
beställer bygget. Pollning var 15:e sekund gav 200 på nittonde försöket.
Runda 91:s sidor svarade 200 direkt bara för att tio minuters arbete låg mellan
publicering och kontroll. Vänta ut den — ett 404 här är inte ett fel i sidan,
och runbookens "hämta två gånger" räcker inte för en slug som aldrig funnits.

## ⚠️ Kvar att göra på syskonsidan

`4080448d` (rosa) har **noll sökord** i `seoData.settings.keywords`. Korslänken
är lagad i den här rundan; sökorden är en egen liten insats.

## Sparkcykelfamiljen efter runda 92

**Noll Tretroller-utkast kvar.** Tre andra sparkcykelutkast finns fortfarande i
kön, men de är andra produkttyper och hör till egna rundor:

| id8 | vad |
|---|---|
| `ab68ed78` | hopfällbar aluminiumcityroller, 200 mm-hjul |
| `19fc1a9e` | stuntsparkcykel för freestyle |
| `7d4cfd1b` | ☠️ **E-Scooter** — elsparkcykel, annan fordonsklass och andra regler |
