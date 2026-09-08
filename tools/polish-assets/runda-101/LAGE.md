# Runda 101 — läge

| id8 | modell | namn | slug | SKU | pris |
|---|---|---|---|---|--:|
| cd7e9036 | A | Massagefåtölj brun med vridbar fotpall | massagefatolj-brun-vridbar-fotpall | FP-massagefatolj-brun | 2 149 |
| 7062dc79 | A | Massagefåtölj cremevit med vridbar fotpall | massagefatolj-cremevit-vridbar-fotpall | FP-massagefatolj-cremevit | 2 169 |
| 9c8a7a80 | A | Massagefåtölj svart med vridbar fotpall | massagefatolj-svart-vridbar-fotpall | FP-massagefatolj-svart | 2 299 |
| 1932abe1 | B | Massagefåtölj i konstläder | massagefatolj-konstlader-fotpall-forvaring | FP-massagefatolj-konstlader | 2 359 |
| 89fead7d | B | Massagefåtölj i tyg | massagefatolj-tyg-fotpall-forvaring | FP-massagefatolj-tyg | 2 449 |
| 54d25930 | C | Massagefåtölj för 160 kg, cremevit | massagefatolj-160-kg-cremevit | FP-massagefatolj-160-kg | 2 449 |
| c50fa916 | C | Massagefåtölj mörkgrå för 160 kg | massagefatolj-morkgra-160-kg | FP-massagefatolj-morkgra | 2 569 |
| b8b6fee1 | D | Massagefåtölj i linnelook, svart | massagefatolj-156-cm-utfalld-svart | FP-massagefatolj-156-cm | 2 399 |

## Klart

- **Steg 1–5** — familjemätning, dubblettgrind, laglighetsgrind, bilder, påståenden.
- **Steg 7** — text, namn, slug och seoData skrivna på alla åtta.
  **8/8 byte-identiska** med filen vid återläsning (synlig text hashad i kod,
  inte jämförd med ögon): noll transkriberingsfel, noll `<br>`, noll
  ihopsatta FAQ-frågor, noll trasiga länkar. Alla `visible:false`, alla
  priser orörda.
- **Steg 8** — SKU:erna re-synkade. Kropparna byggdes i KOD ur en färsk
  läsning, så varken revision, pris eller variantens `visible` skrevs för hand.

## ☠️ SKU-krocken var värre än väntat: sex av åtta delade två strängar

| gammal SKU | bars av |
|---|--:|
| `FP-massagesessel-mit-hocker` | **4** (7062dc79, 9c8a7a80, 1932abe1, b8b6fee1) |
| `FP-massagesessel-mit-fu` | **2** (54d25930, c50fa916) |
| `FP-massagesessel` | 1 (cd7e9036) |
| `FP-massagesessel-mit` | 1 (89fead7d) |

Importen bygger SKU:n ur den RÅA tyska sluggen och kapar vid 24 tecken. Varje
produkt vars tyska namn börjar "Massagesessel mit Hocker…" får alltså samma
sträng. Åtta produkter delade fyra SKU:er; nu bär de åtta distinkta.

Det är samma latenta bugg som `lib/import/sku.ts` beskrivs ha i runbooken
(uppgift #272) — den skapas av importen, inte av poleringen, och den växer med
varje tysk familj som importeras.

## Kvar

- Steg 9 bilder: alt-texter på alla åtta (`89fead7d` har NOLL, `1932abe1` har
  tysk), galleriordning, eget Fyndplats-kort, och ☠️ `1932abe1` bild 04 med
  `VERSTECKTER STAURAUM` inbränt.
- Steg 10 kategorier
- Steg 12 läs som kund
- Steg 13 stämpling + publicering
- Steg 14 live-grind (☠️ kör KONTROLLPROV mot startsidan först — runda 100)
