# Runda 90 — läget

**Sju sparkcyklar publicerade och live-verifierade.** Fyra modeller, tre av dem
färger katalogen saknade.

| id8 | modell | slug | pris | SKU | bilder |
|---|---|---|--:|---|--:|
| `5129f6b0` | G | `sparkcykel-barn-139-cm-luftdack-vit` | 1 269 | `FP-sparkcykel-139-cm-vit` | 6 |
| `50b28808` | G | `sparkcykel-barn-139-cm-luftdack-svart` | 1 199 | `FP-sparkcykel-139-cm-svart` | 6 |
| `9518db1e` | C | `sparkcykel-barn-115-cm-stodben-bla` | 1 099 | `FP-sparkcykel-115-cm-bla` | 5 |
| `473084eb` | C | `sparkcykel-barn-115-cm-stodben-rosa` | 1 149 | `FP-sparkcykel-115-cm-rosa` | 5 |
| `85be4535` | C | `sparkcykel-barn-115-cm-stodben-vit` | 1 159 | `FP-sparkcykel-115-cm-vit` | 5 |
| `68f8f1a7` | A | `sparkcykel-barn-12-tum-rosa` | 1 179 | `FP-sparkcykel-12-tum-rosa` | 6 |
| `eb4418ad` | — | `sparkcykel-barn-hopfallbar-stotdampning` | 1 019 | `FP-sparkcykel-hopfallbar-svart` | 6 |

## Kvitton, mätta

| | |
|---|---|
| Lint | 0 brister, självtest 22 regler |
| Mutationstest | **24/24** |
| JS-hash mot Python-facit före skrivning | **7/7** |
| Texter skrivna med facitgrind inne i anropet | 7/7 |
| Bilder: skickade = tillbaka, utan alt-text | 7/7, **0** |
| Kategorier (Barn & Familj + Leksaker & Spel) | 14/14 skrivningar, 7/7 verifierade |
| SKU:er | 7/7 `stammer: true`, alla ≤ 40 tecken och unika |
| Mappningsstämplar | 7/7 gröna, prisgrinden passerad på alla |
| Publicerade | 7/7, `visible: true` |
| Live-svep mot kontrollsida | **0 av 7 sidor med problem** |
| Kortet renderat live med alt-text | kontrollerat på 3 av 7 |

## Vad rundan lärde huset

☠️ **En färg skrivs aldrig ur kontaktkartan.** Två av sju färgpåståenden var
fel, båda om fälgen, båda lästa ur en 420-pixels miniatyr där däckets svarta
ring dominerar. Runda 89 gjorde exakt samma fel ("röd fälg" om en silverfälg).
Nu i runbooken som Steg 4-regel, och mekaniskt som `FALG_OK`.

☠️ **En live-grind mot en ordlista mäter SAJTEN, inte din text.** Första
svepet fällde 7 av 7 korrekta sidor på tre saker som alla fanns ordagrant på en
publicerad sida rundan aldrig rört: EU-ribbonen, sajtens Organization-JSON-LD
och en misslyckad huvud/kropp-delning. Grinden jämför nu mot en kontrollsida.
Nu i runbooken som Steg 12-regel.

☠️ **"Punkteringsfri" är per PRODUKT, inte per runda.** Modell A och C har
massiva EVA-hjul; modell G har luftdäck och kan gå platt. Linten tar hjultyp
som argument och fäller åt båda håll.

☠️ **Ordlistan bar "den" och "dem"** — tyska ord som också är svenska ord. De
fällde varenda text. En obrukbar grind stängs av, och det är så ett äkta tyskt
ord slipper igenom nästa gång.

## Kvar i familjen

**Fem utkast**, hållna med avsikt:

- **Modell E** — `369b4b2c` svart, `feac1d03` ljusblå, `c851d101` vit,
  `1b1d4842` beige. 120 × 58 × 85–95, Ø30 cm, 100 kg, 8,2 kg. Fyra färger av
  EN modell räcker till en egen runda.
- **`ea013fde`** svart, 135 × 58 × 92–100, 16"/12", 100 kg, 9,8 kg. Poleras mot
  den publicerade `4080448d` (rosa) som har samma 16/12-hjul.

**Två pensionerade** (`aef9a8d9`, `28d7dfd9`) — bevisade dubbletter av den
publicerade `bd3bdc1b` och dyrare än den. Stämplade `rejected`, ute ur kön.
