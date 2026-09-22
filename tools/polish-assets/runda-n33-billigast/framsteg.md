# Runda N33 — framsteg

Uppdateras efter varje skrivsteg. Om rundan avbryts: läs den här filen först.

Granskningens åtta fynd (fem unika ändringar) är införda i filerna före
skrivningen, commit `bfe4437`. Skrivningen pågår — tabellen nedan är facit för
vad som är gjort.

| kort | steg 1 text/SEO | steg 2 media | steg 3 kategori | steg 4 SKU | steg 5 slutläsning | steg 6 stämpel | steg 7 live |
|---|---|---|---|---|---|---|---|
| 82000c6b | ✓ skriven | ✓ skriven | – | – | – | – | – |
| 2f251ce3 | ✓ skriven | ✓ skriven | – | – | – | – | – |
| 5c566983 | ✓ skriven | ✓ skriven | – | – | – | – | – |
| 07565140 | ✓ skriven | ✓ skriven | – | – | – | – | – |
| 30f2151f | ✓ skriven | ✓ skriven | – | – | – | – | – |
| dbedaf4c | ✓ skriven | ✓ skriven | – | – | – | – | – |
| b2b731c7 | ✓ skriven | ✓ skriven | – | – | – | – | – |
| b3efdd39 | ✓ skriven | ✓ skriven | – | – | – | – | – |

## Läge

- `las` för alla tio (åtta + reserverna `e74feea1`, `13a52237`), run 3663–3672,
  `ref: main`, 20:35 UTC den 2026-09-22 — efter att "Aosom — synka lager och
  priser" run 33 och 34 blivit klara. Alla `aosom`, `needsAiPolish: true`,
  `pending_review`, prisgrinden `stämmer: true`.
- Källor verifierade mot skarpa V3: 8/8 text LIKA, 8/8 bildlista LIKA
  (`b3efdd39`:s artikelnummer redigerat på båda sidor).
- Alla filgrindar rena, `npx vitest run lib/polish` 99/99 (se LÄS-MIG).
- Bilder strukna: `82000c6b` 2 och 4, `07565140` 4.
- ⚠️ Priserna rör sig under dagen (se LÄS-MIG). Läs `aosomSyncedAt` och
  Actions-listan innan en prisavvikelse tolkas, och gör en färsk `las` före
  steg 6.
- Steg 1 skrivet 2026-09-22 ~21:15 UTC: 8 av 8, båda spärrarna (brödtext
  per produkt + namn/slug/SEO över hela batchen) 0 avvikelser, revision +1 på
  alla. Ej återläst ännu. Nuläget lästes först: revisioner, pris och SKU
  oförändrade sedan förberedelsen.
- Steg 2 skrivet: 8 av 8 (37 bilder med alt-text, fil-id + alt-summan i samma
  anrop 0 avvikelser), revision +1 på alla. Ej återläst ännu.
- `steg1.js` byggs om med `python3 ../../polish-gates/bygg-skrivning.py > steg1-bas.js`
  och `python3 bygg-steg.py steg1-bas.js > steg1.js` (inte incheckad — den bär
  samma text som `<kort>.html`).
- `steg3.js`, `steg4.js` och `steg5.js` genereras av `bygg-steg.py` ur rundans
  filer (samma skript lägger till namn/slug/SEO-spärren i steg 1).
