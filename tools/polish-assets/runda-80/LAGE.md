# Runda 80 — läge

**Klar och live-verifierad 2026-09-06.** Åtta snurrfåtöljer, reclinerfåtölj,
skrivbordsstol och kontorsstolar publicerade.

| id8 | slug | SKU | pris |
|---|---|---|--:|
| b9ab45db | `snurrfatolj-ljusgra-linnelook-fast-fot` | `FP-snurrfatolj-ljusgra` | 1449 |
| 0fe80797 | `snurrfatolj-morkgra-linnelook-fast-fot` | `FP-snurrfatolj-morkgra` | 1419 |
| 57ae1ddf | `snurrfatolj-svart-linnelook-fast-fot` | `FP-snurrfatolj-svart` | 1459 |
| 558eb67a | `reclinerfatolj-fotpall-svart-rund-fot` | `FP-reclinerfatolj-fotpall` | 2579 |
| 7046314f | `skrivbordsstol-rosa-hel-hjartrygg` | `FP-skrivbordsstol-rosa-hel` | 1199 |
| 2cae1147 | `kontorsstol-graddvit-boucle-vippfunktion` | `FP-kontorsstol-graddvit` | 1349 |
| 5302daf2 | `kontorsstol-big-and-tall-150-kg` | `FP-kontorsstol-big-and-tall` | 1849 |
| bd554433 | `kontorsstol-svart-linne-dubbelstoppad` | `FP-kontorsstol-svart-linne` | 1279 |

## Kvitton

| grind | utfall |
|---|---|
| lint | 0 fel i 8 produkter |
| mutationstest | 34/34 fångade, 0 fel på orörd text |
| prisgrind (`las` × 8) | alla `success` |
| facit inne i skrivningen | 8/8 `lika` |
| kort | 8 byggda, alla < 215 kB vid q ≥ 85 |
| kortimport | 8/8 `sizeInBytes` = lokal filstorlek |
| media (återläst separat) | kortet på plats 3, alt-text på alla, tyska bilder borta |
| kategori | `totalSuccesses: 1` × 8 |
| Steg 13 | 8/8 `visible: true` med rätt FP-SKU |
| stämpling (`stampla` × 8) | alla `success` |
| **live** | **8 sidor + 8 länkmål, alla 200, alla `lika`** |

☠️ **Live-grinden var grön på FÖRSTA passet, cache `MISS` på alla åtta.** Det
är ovanligt — runda 60 fällde åtta korrekta sidor för att cachen svarade som
utkastet. Här fanns ingen gammal cache att svara med, eftersom sluggarna var
nya OCH ingen hämtning gjorts före publiceringen.

## Rundans egna fynd

1. ☠️ **Tre bilder med tysk text inbränd**, alla på position 4. Borttagna.
2. ☠️ **Armstödshöjden utelämnad ur trions spec** — leverantörens två egna
   måttritningar ger 65–77 cm och 64–75 cm för samma stol.
3. ☠️ **`plainDescription` kräver `?fields=PLAIN_DESCRIPTION`.**
4. ☠️ **Wix skriver om HTML:en vid sparande** (`<strong>` → `<span style=…>`,
   `<li>` får ett `<p>` inuti). Facit på SYNLIG text höll igenom båda.
5. ☠️ **`variant_skus` i `polish-mapping.yml` är JSON**, inte `id=sku`.
6. **Linten hade två hål till**: sökordsgrinden jämförde ASCII-slug mot text
   med å, och kontorsstolsgrinden sållade varken frågor eller nekningar.
