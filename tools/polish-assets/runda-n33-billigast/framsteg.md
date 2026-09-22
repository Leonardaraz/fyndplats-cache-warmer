# Runda N33 — framsteg

Uppdateras efter varje skrivsteg. Om rundan avbryts: läs den här filen först.

☠️ **RUNDAN ÄR FÖRBEREDD MEN INTE SKRIVEN.** Ingenting i den här rundan har
skrivits till Wix och ingen mappningsrad har stämplats. En separat granskning
läser rundans filer innan steg 1 körs.

| kort | steg 1 text/SEO | steg 2 media | steg 3 kategori | steg 4 SKU | steg 5 slutläsning | steg 6 stämpel | steg 7 live |
|---|---|---|---|---|---|---|---|
| 82000c6b | – | – | – | – | – | – | – |
| 2f251ce3 | – | – | – | – | – | – | – |
| 5c566983 | – | – | – | – | – | – | – |
| 07565140 | – | – | – | – | – | – | – |
| 30f2151f | – | – | – | – | – | – | – |
| dbedaf4c | – | – | – | – | – | – | – |
| b2b731c7 | – | – | – | – | – | – | – |
| b3efdd39 | – | – | – | – | – | – | – |

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
- `steg1.js` byggs om med `python3 ../../polish-gates/bygg-skrivning.py > steg1.js`
  (inte incheckad — den bär samma text som `<kort>.html`).
- `steg4.js` och `steg5.js` finns inte ännu; de ska genereras av ett skript
  ur rundans filer, som i N32 — aldrig skrivas för hand.
