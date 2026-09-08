# Runda K7 — åtta kontorsstolar 1 279–1 639 kr

Sjunde kontorsstolsrundan, och den där urvalet gav mest.

| kort | pris | saldo | slug | SKU |
| :-- | --: | --: | :-- | :-- |
| `bca22a86` | 1 639 | 42 | `kontorsstol-ljusbla-linnetyg-135-kg` | `FP-kontorsstol-ljusbla-linnetyg` |
| `ac2fb38c` | 1 559 | 182 | `kontorsstol-armlos-knappstoppad-63-cm-sits` | `FP-kontorsstol-armlos-knappstoppad` |
| `c0134bdf` | 1 499 | 60 | `kontorsstol-morkgra-mikrofiber-46-cm-rygg` | `FP-kontorsstol-morkgra-mikrofiber` |
| `ed9f6e73` | 1 449 | 44 | `kontorsstol-ljusgra-mikrofiber-46-cm-rygg` | `FP-kontorsstol-ljusgra-mikrofiber` |
| `d8033343` | 1 399 | 79 | `ritstol-mesh-fotring-68-88-cm` | `FP-ritstol-mesh-68-88-cm` |
| `7ef22229` | 1 329 | 62 | `kontorsstol-gron-vit-svankstod` | `FP-kontorsstol-gron-vit` |
| `0064c439` | 1 299 | 100 | `ritstol-natrygg-99-119-cm-uppfallbara-armstod` | `FP-ritstol-natrygg-99-119-cm` |
| `a4ea1b4d` | 1 279 | 80 | `kontorsstol-gra-linnelook-12-cm-dynor` | `FP-kontorsstol-gra-linnelook` |

## ☠️ Urvalet stoppade TRE produkter — och av tre olika skäl

Det här är rundan där grindarna faktiskt tjänade in sig.

### 1. `c401337d` — byte-identisk dubblett (#193)

Bildgrinden gav **avstånd 0,00** mot publicerade `1d020ddd`. Samma mått
(54 × 62 × 104–114 cm), utkastet 150 kr BILLIGARE än sidan vi redan säljer.
Importen visste dessutom: utkastets slug slutar på `-2`.

### 2. `429aa82d` — färgsyskon till samma publicerade sida

Byttes ut efter att måtten visade sig identiska med `1d020ddd` och `c401337d`
(54 × 62 × 104–114, sits 47 × 46 × 48–58, 13,3 kg) — den svarta versionen av
den vita vi säljer, och 300 kr billigare.

☠️ **Bildgrinden gav den 26,00.** Den KAN inte se färgsyskon, eftersom
gråskalan skiljer sig med färgen. Det är #194: en bildgrind hittar samma FOTO,
en måttjämförelse hittar samma PRODUKT. Kör båda.

### 3. `ae766521` + `39a21e71` — husmärket i pixlarna (#195)

Båda gamingstolarna bär **"Vinsetto" tryckt på ryggstödet**, synligt i alla fem
bilder. Husregeln stryker husmärken ur text och SKU; det här är varken. Lämnade
till Leonard i stället för att avgöras tyst i en runda.

Och `574cf80d` (Boho, 1 419 kr) föll på lagergrinden: saldo 0.

## ⚠️ `bca22a86` är färgsyskon till K6:s `91f0f3f8` — och det står i texten

Identisk tysk text, identiska mått (66 × 75 × 110–120, sits 51 × 53, sitthöjd
45–56, 135 kg, 16,8 kg). Ljusblå mot grå. Publicerad som syskon med korslänk åt
båda håll — samma behandling som K6:s `f3f45d87`/`a3128b31`, och som parets egen
interna motsvarighet här: `c0134bdf` (mörkgrå) och `ed9f6e73` (ljusgrå).

## ☠️ Källans svenska spec-rad motsäger dess egen tyska spec — ritningen avgjorde

`c0134bdf` och `ed9f6e73` har `Gesamtmaße: 67L x 69B x 92-102H` i Technische
Daten men `Mått: 65L x 70B x 96-106H` i den svenska raden längst ned. Två olika
mått på samma produkt, i samma text.

Måttritningen (bild 3) säger 67 × 69 × 92–102. **De tyska siffrorna används**,
och den svenska raden är den som är fel. Facit-filen innehåller båda talen
eftersom den byggs mekaniskt ur hela texten — grinden kan alltså inte skilja
dem åt, bara ögat på ritningen kunde.

## ⚠️ `ac2fb38c` har INGA hjul — och källan säger det aldrig

Den tyska texten nämner gaslyft och 360°-rotation men aldrig `Rollen`. Bilderna
visar en kromad kryssfot med fötter. Specen säger därför `Fot: Kromat kryss utan
hjul`, och skötseltexten varnar för att dra stolen i sitsen i stället för att
lyfta den. Ett antagande om hjul hade varit en osann utsaga om en produkt kunden
sedan får hem.

## Tre tyska grafiker borta

| kort | pos | vad |
| :-- | --: | :-- |
| `d8033343` | 4 | Atmungsaktives Gewebe, Hochwertige Gasliftanlage, Stabile Basis |
| `7ef22229` | 4 | FLEXIBEL UND BEQUEM, Multitasking-Komfort |
| `0064c439` | 4 | 05 GEPOLSTERTE KISSEN, Stoff, Schaumstoffpolsterung, Stabile Planke |

Efter städningen 5 · 5 · 5 · 5 · 4 · 4 · 4 · 5 = **37 bilder**, lika många
alt-texter.

## Grindarna före skrivningen

| grind | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd (efter sju rättade tal, se nedan) |
| `gate-alt.py` | 8 produkter, 37 alt-texter, 0 fynd |
| `gate-seo.py` | 0 fynd |
| `gate-lager.py` | 0 fynd, lägsta saldo 42 |
| `gate-lankar.py` | 0 fynd, 1 externt mål hämtat, 7 interna hoppade |
| `las` (prisgrind) | 8/8 gröna, körningar 1971–1978 |

Siffergrinden fällde sju tal: fem korsreferenser till ANDRA produkters mått
(samma mönster som K6), ett osourcat påstående om andra stolar, och ett där
källan skriver **`Klasse drei` med bokstäver** medan jag skrev siffran 3.
Alla lagade i texten, inget i grinden.

⚠️ **En egen miss värd att notera:** `gate-alt.py` fällde först på antalet, och
det var jag som hade fel. Grinden räknar `bilder.tsv` MINUS `bilder-bort.tsv` —
alltså är `bilder.tsv` listan FÖRE borttagningen. Jag hade numrerat om den och
dubbelsubtraherade därmed. Kontraktet står i grindens egen kommentar.

## Skrivningen

Fyra par, var och en med FNV-1a-grinden **före** skrivningen och en hash på det
Wix läste tillbaka:

```
hashLika  8/8      visible  8/8      variantVisible  8/8
namn      8/8      slug     8/8      seoTaggar       2 på alla åtta
```

37 alt-texter, `altStammer: true` på alla åtta. Kategori `Hem & Inredning`,
**8 av 8** enligt bulk-svarets `bulkActionMetadata`.

Mappningsraderna stämplade i åtta `stampla`-körningar (1979–1986), alla med
`ref: claude/seo-polering-runbook-review-uq6fwl` (#181) — **8/8 success**.

## Live-verifieringen: 8/8 REN, orddiff 0

Ett svep, ingen ISR-omhämtning behövdes: alla åtta hämtades med `age: 99–100`.

```
bca22a86  ord=503  diff=0  REN     d8033343  ord=535  diff=0  REN
ac2fb38c  ord=543  diff=0  REN     7ef22229  ord=555  diff=0  REN
c0134bdf  ord=540  diff=0  REN     0064c439  ord=550  diff=0  REN
ed9f6e73  ord=527  diff=0  REN     a4ea1b4d  ord=550  diff=0  REN
```

`REN` är hela problemlistan tom: sidsvep, alt-svep, SEO-svep, de tre flikarna,
kategorin, köpbarheten och korslänkarna — inklusive de sju interna som
`gate-lankar` per konstruktion inte kunde nå före skrivningen.
