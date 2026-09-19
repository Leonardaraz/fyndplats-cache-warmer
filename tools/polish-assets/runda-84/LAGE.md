# Runda 84 — sju sensorsoptunnor, KLAR och live

Publicerad 2026-09-06. Live-grinden grön på första passet: sju sidor,
nio länkmål, text byte-identisk med facit.

| id8 | slug | pris | volym | batteri |
|---|---|--:|--:|---|
| `466e799a` | `soptunna-sensor-20-liter-innerhink` | 859 | 20 L | 4 × AA |
| `7846d05f` | `soptunna-sensor-42-liter-rund` | 859 | 42 L | 4 × AA |
| `0cc5c634` | `soptunna-sensor-48-liter-oval` | 919 | 48 L | **4 × D** |
| `4ef74d40` | `soptunna-sensor-55-liter-fjarilslock` | 1039 | 55 L | 4 × AA |
| `dcd756bd` | `soptunna-sensor-58-liter-oval` | 1059 | 58 L | **4 × D** |
| `aabcd677` | `soptunna-sensor-45-liter-innerhink` | 1099 | 45 L | *anges inte* |
| `96beca79` | `soptunna-sensor-60-liter-kolfilter` | 1219 | 60 L | 4 × AA |

## Kvitton

| steg | vad | utfall |
|---|---|---|
| 3 | prisgrind, sju `las`-körningar | alla gröna, ×1,2 charm99 |
| 6 | text, facit-grind inne i anropet | 7/7 skrivna, noll `GRIND: FALLER` |
| 8 | SKU re-synk | 7 distinkta, 27 tecken, `visible:false` bevarat |
| 9 | kort importerade | 7/7, byte för byte mot filen |
| 9 | galleri + alt-texter | 7/7 rätt antal, kortet på plats 3, noll tomma alt |
| 10 | kategori | 14/14 kopplingar (löv + förälder) |
| 13 | publicering | produkt OCH variant `visible: true` |
| 13 | stämpling, sju körningar | alla gröna |
| 14 | live-grind | 7 sidor + 9 länkmål rena |

## Fyra fynd

☠️ **Ordet "rundan" gick ut i kundtext.** Sju formuleringar i brödtext och
en meta-beskrivning, alla gröna genom varenda annan grind. Rättat före
publicering och grindat som `lint.py` 5c med tre mutationer. **Samma ord
står kvar i publicerad text från runda 68, 77 och 83** — eget jobb, egen
uppgift.

☠️ **Leverantörens EGEN URL bär föråldrade mått.** Sluggen i `sourceUrl`
säger `h64-3` respektive `h75` på de två ovala tunnorna; spec-blocket och
jämförelsetabellen på samma sida säger 57 och 68 cm. Vår text var rätt hela
tiden — jag var nära att "rätta" den efter adressen. **En URL-slug är ett
filnamn, inte ett facit.**

☠️ **PATCH-svaret på en medieskrivning rapporterar NOLL bilder.** Svaret
använder standardprojektionen, som utelämnar `media.itemsInfo.items` — samma
asymmetri som `getProductMedia`. Ett kvitto byggt på det svaret läser en
perfekt skrivning som totalt haveri. Läs tillbaka med
`?fields=MEDIA_ITEMS_INFO`.

⚠️ **`4ef74d40` publicerades med noll i lager.** Raden har tillfälligt
lämnat feeden — enligt Aosoms egen guide ett lagerbesked, inte ett utgånget
sortiment. Nästa synk där raden är tillbaka återställer saldot.

## Bilder

Fyra av 35 ströks: `466e799a`-5, `4ef74d40`-4, `96beca79`-4 och -5, alla med
inbränd tysk text. `96beca79` har därmed tre leverantörsbilder plus kortet —
tunt, men de två som ströks bar rundans två viktigaste fynd, och de flyttade
in i texten där de går att läsa på svenska.

## Kategori

Alla sju i **Köksredskap & Tillbehör** under **Kök & Husgeråd**, samma plats
som de publicerade sensorsoptunnorna. `All Products` utelämnas med flit.
