# Runda 138 — Steg 1: familjen, batchen och dubblettgrinden

## Familjen mätt över HELA katalogen

Svep över alla 5 688 produkter (57 sidor, 5 688 unika id — markören flyttade sig,
kontrollerat mot `set.size`). Familjen räknad på både tyska och svenska huvudord:

| | |
|---|--:|
| Katalogen | 5 688 |
| Klösmöbelutkast (tyska) | **27** |
| Publicerade klösmöbelsidor (svenska) | **82** |

Av de 27: en är den pensionerade hundtrappan `59d83c24` (uppgift #493), och fyra
är bevisade dubbletter som väntar på ommappning (#518, #519, #524, #525 — se
#528 om varför de är blockerade). **22 poleringsbara kvar.**

## Batchen: sju träd som når taket

| id | tyskt namn | mått | färg |
|---|---|---|---|
| `1366a476` | 2 Meter hoher Kratzbaum, 2–3 Katzen | 59 × 59 × 200 | Beige + Cremevit |
| `839a2ef5` | Höhenverstellbar 230–275, Spielzentrum | 55 × 34 × 230–275 | Grön |
| `68bc6c0c` | Deckenhoch, verstellbar 225–255 | 60 × 44 × 225–255 | Vit + Grå |
| `e5b31270` | Mit Deckenspanner, Hängematte, Haus | Ø60 × 225–255 | Grå |
| `fecadb3e` | Deckenhoch, Katzenhaus, zwei Plattformen | 40 × 40 × 240–260 | Ljusbrun + Beige |
| `505a0dde` | Höhenverstellbar, Anti-Rutsch, sisal | 47 × 34 × 220–260 | Gul + Vit + Blå |
| `7bdc47b8` | 240–260 Deckenhoch, groß | 60 × 45 × 240–260 | **Ljusgrå** |

⚠️ **`1366a476` är INTE takspänt.** Leverantören skriver `Kippschutz-Set` —
en väggrem, inte en spännstång. Den står fritt på en 59 × 59 cm bas. Skriv
aldrig "spänns mot taket" på den; det är den enda i batchen där konstruktionen
skiljer, och det är just sådant en gemensam batchtext slätar över.

## Dubblettgrinden: två flaggade, båda avgjorda

Grinden räknar delade tal mot VARJE publicerad sida i familjen (alla 82, inte
bara batchen — uppgift #361).

| utkast | närmaste publicerade | delade tal | utfall |
|---|---|--:|---|
| `7bdc47b8` | `klostrad-takspant-240-260-cm` | **13/14 (93 %)** | **FÄRGSYSKON** |
| `e5b31270` | `klostrad-golv-till-tak-225-255-cm` | 6/10 (60 %) | friad |
| `fecadb3e` | `klostrad-53-cm-tradstamsform` | 6/8 (75 %) | friad |
| `68bc6c0c` | `klostunna-61-cm-hopplattform` | 6/10 (60 %) | friad |
| `839a2ef5` | `kattrappa-3-steg-boucle` | 4/6 (67 %) | friad |
| `505a0dde` | `takhogt-katttrad` | 6/12 (50 %) | friad |
| `1366a476` | `klostunna-100-cm-tva-grottor-gra` | 6/13 (46 %) | friad |

⚠️ **Andelen ensam ljuger på sidor med FÅ tal.** `fecadb3e` fick 75 % mot en
sida med bara åtta tal — det är ett litet-tal-artefakt, inte en likhet. Talen
som räknas ska vara många nog att betyda något; annars är det bilden som avgör.

### ☠️ `7bdc47b8` är ett FÄRGSYSKON — avgjort på bilden, inte på texten

Varje mått delas med den publicerade `klostrad-takspant-240-260-cm`: 60 × 45 ×
240–260, två sovhålor 45 × 35 × 25, öppning 18 × 18, två hängmattor, två
bollar, maxlast ~10 kg, stammar med sisal och plysch. Text mot text är de
oskiljbara.

Hjältebilderna avgör: **samma konstruktion i varje detalj** — takspännestången,
den övre hålan med runt fönster, de två hängmattorna, stegen i samma vinkel,
mellanplanet, den nedre hålan, tunneln nertill höger, tassavtrycket på
fotplattan. Det enda som skiljer är kulören: utkastet är **ljusgrått**, den
publicerade sidan **mörkgrå**.

Uppgift #420:s regel håller därmed: identiska mått + identisk vikt = FÄRGSYSKON,
och färgen SKILLER. Den ska poleras som ljusgrå syskonsida, med korslänk åt
**båda håll** (uppgift #480) — alltså också en rad tillagd på den publicerade
mörkgrå sidan.

### ☠️ Och `fecadb3e` friades mot runda 137, inte mot måttgrindens förslag

Basmåttet 40 × 40 cm delas med runda 137:s `klostrad-takspant-ek` och
`-gratt` (40 × 40 × 230–250). Måttgrinden pekade aldrig dit — den valde en sida
med åtta tal i stället. Jämförelsen gjordes därför för hand, och på bilden:

| | runda 137:s ek | `fecadb3e` |
|---|---|---|
| hus | **nej** | **ja**, kvadratiskt med rund öppning |
| stege | nej | **ja** |
| plan | fyra runda | två |
| höjd | 230–250 | 240–260 |

Olika produkter. **Regeln: en måttgrind som rankar på ANDEL hittar inte den
granne som delar ett enda men avgörande mått.** Basmåttet i en familj där allt
annat varierar är värt en egen kontroll.

## Bilderna fanns hela tiden

Första läsningen rapporterade `bilder: 0` på alla sju. Det var inte tomma
gallerier utan **projektionen**: `?fields=MEDIA_ITEMS_INFO` saknades. Med
fältet: **fem bilder på var och en**. Runbookens fälla, ordagrant, och den
ser i svaret exakt ut som en produkt utan bilder.
