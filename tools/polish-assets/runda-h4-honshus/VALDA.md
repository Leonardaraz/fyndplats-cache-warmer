# Runda H4 — hönshus och hönsgårdar

Åtta Aosom-utkast i prisbandet 3 859–5 699 kr. Texterna skrevs och grindades
2026-09-07; media, kategori, SKU och publicering samma dag.

## ✅ Lagret kollades FÖRE arbetet, som #173 kräver

Den här rundan är den första som gör kollen i urvalssteget i stället för att
upptäcka nollsaldon efteråt. Ett anrop för hela rundan:

| kort | pris | saldo |
|---|--:|--:|
| `3b8ab8da` Hönsgård 300 × 800 cm | 5 699 | 59 |
| `c7763271` Hönshus med rastgård 236,5 cm | 4 919 | 142 |
| `f55f89b3` Hönshus 247 cm, två utegårdar | 4 749 | 32 |
| `2e0a7448` Hönsgård 300 × 600 cm | 4 499 | 83 |
| `ef062897` Hönshus 283 cm för 7–10 höns | 4 399 | 24 |
| `c5f3914e` Hönsgård 168 × 183 cm med ståhöjd | 4 069 | 62 |
| `ac759277` Hönsgård i stål 400 × 346 cm | 4 039 | 67 |
| `ea02080f` Hönshus 264 cm för 3–4 höns | 3 859 | 96 |

Åtta av åtta har lager. Ingen sida publicerades som inte gick att köpa.

## SKU:erna som delades

☠️ **TRE produkter bar `FP-huhnerstall`** — `3b8ab8da`, `f55f89b3` och
`2e0a7448`. Samma mönster som runda I1: importen härleder SKU:n ur den tyska
titelns första ord, och `Hühnerstall` är det ordet i halva sortimentet. Tredje
rundan i rad där krocken är tre produkter, inte två.

| kort | tysk SKU | ny svensk |
|---|---|---|
| `3b8ab8da` | `FP-huhnerstall` | `FP-honsgard-300x800` |
| `f55f89b3` | `FP-huhnerstall` | `FP-honshus-247-tva-gardar` |
| `2e0a7448` | `FP-huhnerstall` | `FP-honsgard-300x600` |
| `c7763271` | `FP-huhnerstall-mit-auslauf` | `FP-honshus-rastgard-236` |
| `ef062897` | `FP-gro-er-huhnerstall-fur-7` | `FP-honshus-283` |
| `c5f3914e` | `FP-huhnergehege-huhnerstall` | `FP-honsgard-168x183` |
| `ac759277` | `FP-huhnergehege-mit` | `FP-honsgard-stal-400x346` |
| `ea02080f` | `FP-huhnerstall-huhnerhaus` | `FP-honshus-264` |

## ☠️ Alla fyrtio alt-texter var tyska — och en var ENGELSK bild

Ingen av de åtta hade rörts av importen efter skapandet, så alt-texten var
feedens tyska titel rakt av (`Hühnerstall, Freilaufgehege für Hühner, mit
UV-beständiger Plane…`). Beskrivningen var redan skriven på svenska och
verifierad; bilderna skrek fortfarande tyska. Ett sidsvep som strippar taggar
ser inte in i `alt=""`.

**Sex bilder togs bort** (`bilder-bort.tsv`) för inbränd text i pixlarna:

| kort | pos | vad |
|---|--:|---|
| `2e0a7448` | 4 | tysk rubrik + brödtext om konstruktionen |
| `c5f3914e` | 4 | tysk rubrik + textade funktionsrutor |
| `c5f3914e` | 5 | tysk rubrik + textad redesbeskrivning |
| `ac759277` | 5 | **ENGELSK** rubrik + namngivna rovdjur |
| `ea02080f` | 4 | tyska detaljrutor |
| `ea02080f` | 5 | tysk rubrik om monteringen |

⚠️ **Den engelska är värd sin egen rad.** Regeln har hittills formulerats som
"tysk text i pixlarna", och en grafik på engelska hade passerat varje sådan
formulering. Kriteriet är inte SPRÅKET utan att texten inte går att visa för
en svensk kund — och att den inte går att polera bort.

`c5f3914e` och `ea02080f` har därför bara tre bilder kvar (render, livsstil,
måttritning). Tunt men ärligt; en bild med främmande marknadsföringstext är
sämre än ingen bild.

## Kategorierna kom ur en mätning, inte ur en gissning

Tio redan publicerade höns-, kanin- och ankprodukter lästes först: nio av tio
bär **`Husdjur` + `Burar, Kläder & Tillbehör`**. Runda H4 fick samma par.

⚠️ **Den tionde var defekt och lagades på köpet.** `faa61f7f` (Kaninhus 144 cm)
är publicerad men bar bara `All Products` — samma defekt som de 41 sidor som
lagades 2026-09-06, alltså en som glidit in igen efter den städningen. Den har
båda kategorierna nu.

## Live-verifierad 2026-09-07 — 8 av 8 REN

```
3b8ab8da  ord=598  diff=0  -> REN
c7763271  ord=598  diff=0  -> REN
f55f89b3  ord=562  diff=0  -> REN
2e0a7448  ord=549  diff=0  -> REN
ef062897  ord=564  diff=0  -> REN
c5f3914e  ord=559  diff=0  -> REN
ac759277  ord=551  diff=0  -> REN
ea02080f  ord=531  diff=0  -> REN

TOTALT: 0 avvikelser i den PUBLICERADE texten
```

Noll avvikelser rakt igenom: orddiff mot källfilerna, homoglyfsvep, sid- och
alt-svep, SEO-jämförelse mot `seo.tsv`, kategori och skötselflik. Första
rundan i sviten som går ren på alla åtta utan en enda anmärkning.
