# Runda N33 — framsteg

Uppdateras efter varje skrivsteg. Om rundan avbryts: läs den här filen först.

Granskningens åtta fynd (fem unika ändringar) är införda i filerna före
skrivningen, commit `bfe4437`. Alla sju stegen är gjorda och verifierade —
tabellen nedan är facit.

| kort | steg 1 text/SEO | steg 2 media | steg 3 kategori | steg 4 SKU | steg 5 slutläsning | steg 6 stämpel | steg 7 live |
|---|---|---|---|---|---|---|---|
| 82000c6b | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| 2f251ce3 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| 5c566983 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| 07565140 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| 30f2151f | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| dbedaf4c | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| b2b731c7 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |
| b3efdd39 | ✓ skriven | ✓ skriven | ✓ success | ✓ skriven | ✓ LIKA | ✓ las | ✓ REN |

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
- Steg 3: 8 anrop (en per kategori, id uppslagna på namn i en färsk fråga med
  54 kategorier), 13 av 13 rader `success: true` attribuerade på radens eget
  `catalogItemId`, `totalFailures: 0` och `undetailedFailures: 0` i alla åtta.
- Steg 4 skrivet: 8 av 8 (round-trip ur färsk GET, spärren 926991554/611 över
  kort|pid|sku räknad av `bygg-steg.py`). Variant-id stämmer med `las`-tabellen
  i LÄS-MIG på alla åtta; variantens och produktens `visible` var `true` före;
  priserna oförändrade (1 649, 1 719, 1 869, 1 869, 1 899 × 4).
- Steg 5 (separat läsning ~21:17, `steg5.js`, alla fyra fält bevisat närvarande
  i projektionen): **8 av 8 helt verifierade** — text (fnv + längd), namn, slug,
  visible, SEO (två taggar, keywords tomt), media (id + alt), kategorier
  (`antalKat` 2–3 inkl. All Products), SKU, variant-id, variantens `visible`.
  Revisionerna = steg 4:s `revisionEfter`, alltså har inget annat jobb skrivit
  emellan. Priserna oförändrade, alla `IN_STOCK`.
- Färsk `las` före stämplingen (run 3673–3680, 21:14 UTC, `ref: main`): alla åtta
  `aosom`, `pending_review`, prisgrinden `stämmer: true`, saldon och priser
  oförändrade mot förberedelsen. Inga "Aosom — synka lager och priser"-körningar
  efter 20:35 i Actions-listan.
- Steg 6: 8 stämplingar (run 3681–3688, alla `success`, rutten svarade `OK …
  uppdaterad — needsAiPolish, draftStatus, variantSkus`) + 8 SEPARATA `las`
  (run 3689–3696): alla `needsAiPolish: false`, `published`, SKU = `sku.tsv`,
  prisgrinden `stämmer: true`. Stämplingens `variant_skus` byggdes av
  `bygg-steg.py --stampla`.
- Steg 7, första cykeln: `hamta-live.sh 130` startad 21:17 UTC — varm träff
  `age=0` på alla åtta (nya slugs, förstagångsrendering), väntan 305 s, omträff,
  paus 130 s. Skarp hämtning 8/8 HTTP 200 (145 775–155 327 B), `age` 140–141 s.
  `livegrind.py`: **8/8 REN, orddiff 0** (361–477 ord per sida), `exit 0`.
- Andra korrekturläsningen (på den publicerade texten, 295 utplockade satser):
  två fynd — `b3efdd39` (melamin/slät, kongruens) och `b2b731c7` (*rengör den*,
  syftning). Rättade i filerna (`7cc7675`), grindar rena, vitest 99/99.
- Rättelsen skriven ~21:27 med `bygg-steg.py --rattelse b3efdd39,b2b731c7`:
  bara `plainDescription` i fältmasken, spärrarna (id + brödtext) i samma
  anrop 0 avvikelser, 2 av 2 skrivna (revision 4 → 5 och 8 → 9).
- Separat läsning efter rättelsen (`steg5.js` omgenererad): **8 av 8 helt
  verifierade**; de sex orörda står kvar på samma revision, och SKU, variantens
  `visible` och priset är oförändrade även på de två rättade.
- Steg 7, andra cykeln (efter rättelsen): `hamta-live.sh 130`, skarp hämtning
  21:33:48–57 UTC, 8/8 HTTP 200, `age` 133–140 s (renderade efter rättelsens
  skrivning). `livegrind.py`: **8/8 REN, orddiff 0**, `exit 0`; ordantalen på
  de två rättade sidorna sjönk med exakt rättelsernas antal ord.

**RUNDAN ÄR KLAR** utom faktakorten, som är medvetet uppskjutna (N15–N32).
- `steg1.js` byggs om med `python3 ../../polish-gates/bygg-skrivning.py > steg1-bas.js`
  och `python3 bygg-steg.py steg1-bas.js > steg1.js` (inte incheckad — den bär
  samma text som `<kort>.html`).
- `steg3.js`, `steg4.js` och `steg5.js` genereras av `bygg-steg.py` ur rundans
  filer (samma skript lägger till namn/slug/SEO-spärren i steg 1).
