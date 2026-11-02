## Varianter får inte dela inköpspris utan täckning

Tilläggets DOM-fallback sätter sidans **synliga** pris på alla varianter när den
inte kommer åt per-SKU-datan. Leonards rapport 2026-08-20: ett 4-pack och ett
6-pack båda 589 kr, två spegelstorlekar båda 1279 kr — den dyra varianten såldes
till den billigas pris. Tre lager täcker det nu, och de gör olika saker:

1. **Spärren** (`lib/import/price-trust.ts`, i pipelinen). Flaggar **precis** när
   båda gäller: fler än en variant delar exakt samma inköpspris **och** vi saknar
   per-SKU-data bakom dem. Produkten hålls som utkast med `priceUnverified` +
   badge i `/admin/queue`. Att alla varianter kostar lika mycket är i sig
   fullkomligt normalt (färgvarianter gör nästan alltid det) — det är *obekräftat*
   delat pris som är defekten. Spärren gissar aldrig fram ett pris.
2. **DS-räddningen i tillägget** (`extension/background.js → dsRescueVariants`,
   0.1.41). Utlöses på `dom-`-varianter i både agent- och bulkvägen. `idx-`
   räknas **medvetet inte** — de bär redan korrekta per-variant-priser, bara
   id:t saknades. Räddningen tömmer `swatchImages`; den bygger dem **inte** om
   (DS:s `imageUrl` är per SKU, inte per värde). Servern äger ombyggnaden.
3. **Efterhands-reparationen** (`lib/import/price-repair.ts` +
   `/api/cron/price-repair`) för produkter som redan ligger felprissatta.

### Så körs reparationen

GitHub Actions-workflowen **"Priser — rätta varianter som delar inköpspris"**,
samma nyckel-lösa upplägg som recensionsöversättningen (produktionen har
Wix-nycklarna, Actions har `CRON_SECRET`).

| Läge | Vad som händer |
|---|---|
| `scan` | Torrkörning. Skriver ingenting. Planen läggs i `tools/price-repair/scan-latest.json` |
| `apply` | Skriver — **bara** för de `wixProductIds` du räknar upp |

Det finns **ingen "kör allt"-flagga** i apply-läget. Listan med id:n är
kvitteringen på att en människa läst planen; ett pris som når kund ska ha
passerat ögon. Kopiera fältet `wixProductIds` ur scan-svaret.

**Tre fält skrivs per rättad variant, aldrig bara det första:** `grossSek` (Wix),
`costUsd` och `landedCostSek` (mappningen). Det sista är lätt att glömma och
värst att missa — lönsamhetsöversikten och **auktionens golvbud**
(`lib/auction/seed.ts → netSupplierCost`) läser båda det fältet, så rättas bara
priset ser marginalen fantastisk ut och auktionen kan sälja under inköp.

Fyra egenskaper som inte ska tas bort:

- **Oförändrat inköpspris → varianten rörs inte alls.** Blast-radien blir exakt
  defekten, och det är också vad som gör en bred kandidatsökning ofarlig: säger
  DS att priserna verkligen är lika blir planen tom.
- **Bara matchning på skuId.** Värdesignatur-matchning (`mapping-repair.ts`) är
  en gissning, och en felgissning här skriver ett pris till kund. Syntetiska id
  rapporteras omatchade — kör mappnings-reparationen i `/admin/mappings` först.
- **Marginalgolv + tak på prisändring** blockerar HELA produkten, aldrig bara en
  variant. Ett halvrättat pris är svårare att upptäcka än ett helt orört.
- **Wix skrivs före mappningen.** Går bara den ena igenom står kunden inför rätt
  pris medan bokföringen är gammal (nästa körning rättar det). Omvänd ordning
  hade gjort mappningen "rättad" medan kunden köper till fel pris — och då
  hittar ingen felet igen.

Rutten varnar också när prisreglerna hunnit ändras sedan importen: de rättade
varianterna får dagens påslag medan de orörda behåller sitt. Vill du ha ett
enhetligt påslag är omimport rätt väg, inte reparationen.
