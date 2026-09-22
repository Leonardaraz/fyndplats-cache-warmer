# Runda N32 — framsteg

Uppdateras efter varje skrivsteg. Om rundan avbryts: läs den här filen först.

| kort | steg 1 text/SEO | steg 2 media | steg 3 kategori | steg 4 SKU | steg 5 slutläsning | steg 6 stämpel | steg 7 live |
|---|---|---|---|---|---|---|---|
| 40fb1b24 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| c6f8a0f1 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| 8f95113c | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| 41b2bc81 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| 6ab7b3b0 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| b42b4802 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| 2808fff3 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |
| db1d494f | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | – |

## Läge

- Källor verifierade mot skarpa V3: 8/8 text LIKA, 8/8 bildlista LIKA.
- Alla filgrindar rena (se LÄS-MIG).
- Steg 1 skrivet 2026-09-22: 8 av 8, spärren 0 avvikelser (revision +1 på alla). Ej återläst ännu.
- Steg 2 skrivet: 8 av 8, spärren 0 avvikelser.
- Steg 3: 11 anrop, 17 av 17 rader `success: true`, `totalFailures: 0`.
- ⚠️ Under rundan körde någon annan "Aosom — synka lager och priser" (run 30 19:19–19:29, run 31 från 19:32) och "Pris — konkurrentregeln" (19:18). `41b2bc81` gick 1 839 → 1 469 kr och `2808fff3` 1 859 → 1 499 kr mellan `las` och steg 4. Rundan rör inte priset.
- Steg 4 skrivet: 8 av 8 (round-trip från färsk GET, spärren 202425706/274 ur sku.tsv). Variantens `visible` var `true` före på alla.
- Steg 5 (separat läsning): 8 av 8 helt verifierade.
- Steg 6: 8 stämplingar (run 3647–3654) + 8 separata `las` (run 3655–3662): alla `needsAiPolish: false`, `published`, rätt SKU, prisgrinden `stämmer: true`.
- Steg 7: `hamta-live.sh 130` startad 19:53.
- `steg1.js` byggs om med `python3 ../../polish-gates/bygg-skrivning.py > steg1.js`
  (inte incheckad — den bär samma text som `<kort>.html`).
