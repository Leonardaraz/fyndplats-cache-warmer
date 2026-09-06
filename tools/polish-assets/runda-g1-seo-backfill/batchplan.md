# SEO-backfill: 49 sidor, åtta i taget

De 49 publicerade sidor som bär tysk SEO-titel (#147). Alla är fåtöljer och
madrasser ur rundorna B–E. Grupperade så att en batch är hela familjer —
färgsyskon delar fakta, och då blir metabeskrivningarna konsekventa.

| batch | produkter | familjer |
|--:|--:|---|
| **1** ✅ | 8 | bäddfåtölj med armstöd ×5, gästsäng 180 cm ×3 |
| 2 | 8 | snurrfåtölj 60 cm ×4, reclinerfåtölj ×2, biofåtölj ×2 |
| 3 | 8 | bäddfåtölj 190 cm ×3, bäddfåtölj 190×80 ×2, manchester ×2, 98 cm ×1 |
| 4 | 8 | gungfåtölj linnelook ×2, gungfåtölj konstläder ×2, relaxfåtölj ×2, vilfåtölj ×2 |
| 5 | 8 | loungefåtölj ×3, läsfåtölj ×2, tv-fåtölj ×2, fåtölj furuben ×1 |
| 6 | 9 | hopfällbar fåtölj ×2, snurrfåtölj stålfot ×1, golvsoffa ×1, bäddfåtölj 90/181/186/188 ×4, sidofickor ×1 |

## Arbetsgången per batch

1. Hämta sidorna (`live/`) — de är källan, rundan har inga egna textfiler.
2. Läs ledstycket efter `Beskrivning` — det är redan en faktasammanfattning.
3. Skriv `seo.tsv`: titel ≤ 60 tecken med `| Fyndplats`, beskrivning ≤ 160.
4. `python3 gate-seo.py seo.tsv` — 0 fynd krävs.
5. Skriv `seoData` (TVÅ taggar, `keywords: []`), återläs varje rad.
6. `hamta-live.sh 150` → `livegrind.py` — SEO-svepet jämför live mot `seo.tsv`.

☠️ **Priset, texten och bilderna rörs inte.** Backfillen skriver ENDAST
`seoData`. Variantsynligheten kontrolleras i återläsningen, eftersom en PATCH
med fel form är precis vad som gjorde 31 sidor oköpbara (#148).
