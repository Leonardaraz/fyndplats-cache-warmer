# Runda L2 — åtta konstväxter 749–1 169 kr (2026-09-12)

Åtta DISTINKTA arter, inte fyra par. Familjen är tät av syskon, och urvalet är
gjort för att undvika dem — se `utesluten/LÄS-MIG.md`.

| kort | produkt | pris | saldo |
| :-- | :-- | --: | --: |
| `4bf8e052` | Kaktus 111 cm, tre stammar | 1 169 | 17 |
| `288fcc4d` | Eukalyptusklot 2-pack Ø52 cm | 1 099 | 197 |
| `2c76f251` | Trekulliga träd 2-pack 100 cm | 1 069 | 44 |
| `654d3653` | Olivträd 180 cm | 929 | 10 |
| `4f2d20a0` | Palm 150 cm, 16 blad | 879 | 29 |
| `0136a1b6` | Bambu 150 cm | 839 | 117 |
| `8cccf8e1` | Dracaena 120 cm, 60 blad | 799 | 99 |
| `6dee216f` | Rosenklot 2-pack 55 cm | 749 | 197 |

## Tre grindar FÖRE en rad text

| steg | utfall |
| :-- | :-- |
| Lagergrinden (#173) | **3 av 11 fällda** — `fa7ca5c5`, `20ba8e58`, `227fae7d` alla OUT_OF_STOCK |
| Bildskärmen (md5) | **40 av 40 unika** inom rundan, **0 kollisioner** mot L1:s fyrtio |
| Syskonurval | tio utkast medvetet bortvalda, med skäl |

## ☠️ Källan bar Aosoms artikelnummer — och redigeringen är BEVISAD

`6dee216f`:s egen `Technische Daten` avslutas med
`✔ Artikelkennzeichnung: <artikelnummer>`. Numret är den sträng dealproffsen.se
publicerar som `sku`/`mpn`; det får varken nå kundtexten eller committas i ett
PUBLIKT repo (#222). Facit bär därför `‹REDIGERAT›` i stället.

Att bara påstå redigeringen hade varit värdelöst, så den är mätt:

```
min kopia, redigerad     1976 tecken / fnv 266839732
numret tillbaka i minnet 1977 tecken / fnv 665261505
Wix svarade              1977 tecken / fnv 665261505   ← LIKA
```

Allt utom den enda substitutionen är alltså orört. Övriga sju källor är
byte-identiska mot Wix. Talen ligger i `kvitto-kalla.json`.

## Fotogranskningen fällde sex saker (J1-regeln)

Hela listan står i `FOTOFYND.md`. De två som ingen siffergrind kan se, eftersom
båda talen står i källan:

1. ☠️ **`6dee216f` — källan motsäger SIG SJÄLV om höjden.** Texten säger
   "Jeder 55 cm hohe Stab"; måttritningen säger **55 cm totalt** med ett
   **16 cm** spett. Läser man texten blir produkten 85 cm. Ritningen mäter.
2. ☠️ **`654d3653` — "robuste Stabilität" på en fot ritningen mäter till
   Ø15 cm** under ett 180 cm högt träd. Cementfyllningen är ett sakförhållande
   och skrivs; superlativet skrivs inte. Texten säger i stället var trädet bör
   stå.

Och den tydligaste returrisken:

3. ⚠️ **`288fcc4d` — krukorna på bilderna ingår INTE.** `Lieferumfang` är
   `2 x Topiary-Ball`; tre av fem bilder visar dem nedsatta i krukor. Utskrivet
   i brödtext, spec-rad och FAQ.

Plus: bambuns krukhöjd skiljer mellan källa och ritning (höjden utelämnas), och
`2c76f251` har **största klotet NEDERST** — tvärtom mot L1:s buxbom, som ligger
i samma kategori. Skillnaden står i båda texterna.

☠️ **900 blad och 40 oliver står i produktNAMNET, inte i beskrivningen.**
Siffergrindens facit är beskrivningen, så talen är inte skrivna — de går inte
att belägga ur den källa rundan faktiskt bär.

## Grindarna fällde ett fel i MIN egen text

`gate.py`: `6dee216f: [SIFFRA UTAN KÄLLA] '40'`. Jag hade räknat ut att
"ungefär 40 cm sticker upp" (55 − 16) i stället för att hålla mig till källans
tal. Borttaget. Ett äkta fotoräknat tal (dracaenans tre stammar) kvitteras i
`foto-tal.txt`.

| grind | utfall |
| :-- | :-- |
| `gate.py` | **0 fynd, 0 varningar** i 8 filer |
| `gate-alt.py` | REN — 8 produkter, 38 alt-texter |
| `gate-seo.py` · `gate-sku.py` | 0 fynd (längsta SKU 26 av 40 tecken) |
| `gate-superlativ.py` · `gate-lankar.py` · `gate-lager.py` | REN |

## Skrivningen bevisad, inte antagen

Facit är `normalisera(fil)` — Wix skriver om HTML vid sparandet.

| kort | förväntat | Wix svarade | |
| :-- | --: | --: | :-- |
| `6dee216f` | 2693 / 855226296 | 2693 / 855226296 | ✅ |
| `4f2d20a0` | 2664 / 662679249 | 2664 / 662679249 | ✅ |
| `4bf8e052` | 2582 / 419572738 | 2582 / 419572738 | ✅ |
| `8cccf8e1` | 2476 / 678767048 | 2476 / 678767048 | ✅ |
| `654d3653` | 2802 / 876224009 | 2802 / 876224009 | ✅ |
| `288fcc4d` | 2630 / 741163740 | 2630 / 741163740 | ✅ |
| `0136a1b6` | 2538 / 375444557 | 2538 / 375444557 | ✅ |
| `2c76f251` | 3015 / 428307483 | 3015 / 428307483 | ✅ |

**8 av 8 exakta.** SEO: två taggar och noll nyckelord på alla åtta.

## Bilder och kategorier

38 alt-texter skrivna, bildordningen oförändrad, **huvudbilden orörd på alla
åtta**. De två bilderna med inbränd tysk text är borttagna — verifierat både i
Wix (5 → 4 poster) och på den publicerade sidan (noll förekomster av deras
fil-id, medan de fyra kvarvarande finns kvar).

20 kategorikopplingar, **0 fel och 0 undetailedFailures** på bulk-svarets
`itemMetadata`.

## Live-verifierat 8/8 REN

`hamta-live.sh 90` gav HTTP 200 på alla åtta med `age` 99–101, alltså den
rendering den varma träffen utlöste.

```
TOTALT: 0 avvikelser i den PUBLICERADE texten
orddiff 0 på alla åtta (366–446 ord)
```

Brödsmulan går `Hem / Hem & Inredning / …` på alla åtta — ingen hamnar på
`Hem / Butik / produkt`.

## Kvar för familjen

☠️ **Cypress-klustret är omätt.** Minst sju utkast heter `Zypresse` med 638
eller 831 blad, i 2-pack och enkelpack, 779–1 169 kr. Flera kan vara SAMMA
artikel — det avgörs av bildernas md5, inte av namnet (#243). Gör den
mätningen innan någon av dem poleras.
