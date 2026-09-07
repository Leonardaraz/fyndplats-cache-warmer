# Runda 91 — läget

**Fyra sparkcyklar publicerade och live-verifierade.** EN modell (E) i fyra
lackeringar — 120 × 58 × 85–95 cm, Ø30 cm luftdäck, 100 kg, 8,2 kg.

| id8 | slug | pris | SKU | bilder |
|---|---|--:|---|--:|
| `369b4b2c` | `sparkcykel-barn-120-cm-hogt-styre-svart` | 1 169 | `FP-sparkcykel-120-cm-hog-svart` | 6 |
| `feac1d03` | `sparkcykel-barn-120-cm-hogt-styre-turkos` | 1 199 | `FP-sparkcykel-120-cm-hog-turkos` | 6 |
| `c851d101` | `sparkcykel-barn-120-cm-hogt-styre-vit` | 1 219 | `FP-sparkcykel-120-cm-hog-vit` | 6 |
| `1b1d4842` | `sparkcykel-barn-120-cm-hogt-styre-beige` | 1 249 | `FP-sparkcykel-120-cm-hog-beige` | 6 |

## Kvitton, mätta

| | |
|---|---|
| Lint | 0 brister, självtest 34 regler |
| Mutationstest | **22/22** |
| JS-hash mot Python-facit före skrivning | **4/4** |
| Texter skrivna med facitgrind inne i anropet | 4/4 |
| Återläsning av beskrivningen mot facit | 4/4, hash exakt |
| Bilder: skickade = tillbaka, utan alt-text | 6 var, **0** |
| Kategorier (Barn & Familj + Leksaker & Spel) | 8/8 skrivningar, 4/4 verifierade i båda löven |
| SKU:er | 4/4 `stammer: true`, 28–31 tecken, unika |
| Prisgrind (`las`-läget) | 4/4 gröna, charm99 |
| Mappningsstämplar | 4/4 gröna |
| Publicerade | 4/4, `visible: true` |
| Live-svep mot kontrollsida | **0 av 4 sidor med problem** |
| Kort + alt-texter live | 4/4, 12 unika alt-texter per sida |
| Korslänk till lågstyrda modellen | 200 |

## Vad rundan lärde huset

☠️ **RANDBANDET VAR OGRINDAT, och det var precis där felet satt.** Runda 90
byggde `FALG_OK` (fälgfärg) och den här rundan `RAM_OK` (ramfärg) — men ingen
av dem tittade på RANDNINGEN. Första skrivningen sa "guld- och svartrandning"
om turkos och beige; i 6× zoom är bandet **guld, vitt OCH svart** på båda, och
guld/vitt/guld på den svarta. Den vita randen hade jag läst bort ur ett för
litet ark, tredje rundan i rad med samma familj av fel.

☠️ **Kravet är LIKHET mot mätningen och PER FRAS.** Delmängd hade släppt igenom
utelämnandet; union över sidan hade släppt igenom en HALV rättning (ingressen
ändrad, spec-raden inte). Båda varianterna provades och båda missade
mutationen — det är därför regeln ser ut som den gör.

☠️ **Kortrubriken var ogranskad.** Den bodde i `kort.py` och lintades aldrig,
trots att den är exakt den plats där både runda 90 och 91 skrev fel färg.
`KORTPLAN` är flyttad till `texter.KORT` och går genom samma grind som
brödtexten. Ett kort är lika mycket ett påstående mot kunden som ett stycke.

⚠️ **Grinden hade en bugg som SJÄLVTESTET fångade.** Samma loopvariabel `g` i
den yttre loopen och den inre generatorn: kontrollen jämförde orden mot sig
själva och svarade grönt på allt. En ny grind utan eget prov bevisar ingenting.

☠️ **En PATCH-svar ekar INTE tillbaka `media.itemsInfo`.** Galleriskrivningen
svarade `items: []` på alla fyra — vilket ser ut som ett tömt galleri. Det var
projektionen: en GET med `?fields=MEDIA_ITEMS_INFO` visar sex bilder med
alt-text på varje. Läs alltid tillbaka med fältet begärt.

☠️ **Skrivformen är inte läsformen för media-items.** Vid LÄSNING ligger
`id`/`url` inuti `image`; vid SKRIVNING måste de ligga på ITEM-nivå
(`{id, altText}`). Den lästa formen skickad tillbaka ger
`400 REQUIRED_ONE_OF_FIELD: id or url must not be empty` på varje rad.

✅ **Alla fyra måttritningar är rena** — bara siffror och `cm`, ingen tysk text
i pixlarna. Runda 90 fick plocka bort modell C:s skiss för `Empfohlenes Alter`;
de här behåller sin, alltså sex bilder var i stället för fem.

## Kvar i familjen

**Ett utkast:** `ea013fde` svart, 135 × 58 × 92–100, 16"/12", 100 kg, 9,8 kg.
Poleras mot den publicerade `4080448d` (rosa) som har samma 16/12-hjul.
