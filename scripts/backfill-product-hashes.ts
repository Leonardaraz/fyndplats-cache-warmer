// Engångs-backfill av FyndplatsProductHashes för ALLA befintliga V3-produkter
// (Feature 1, dubblett-detektor). Hämtar varje produkts huvudbild, beräknar en
// pHash lokalt (sharp, GRATIS — inga AI-anrop) och sparar wixProductId + pHash +
// (om känt) AliExpress-produkt-id i kollektionen.
//
// AliExpress-id:t hämtas genom STOREN (getStore().listMappings()), inte ur Wix
// Data — mappningarna bor i Postgres sedan 2026-08-31.
// Produkter utan mapping (t.ex. migrerade) får aeProductId=undefined — de matchas
// då bara via bild/titel, inte exakt id.
//
// Idempotent: kör om → skriver bara över med färska hashar. Kör efter att
// ensure-import-tools-collections.mjs skapat kollektionen.
//
//   Dry-run (beräknar men skriver inte):
//     node --experimental-strip-types --env-file=.env.local scripts/backfill-product-hashes.ts
//   Skarpt (sparar i Wix Data):
//     node --experimental-strip-types --env-file=.env.local scripts/backfill-product-hashes.ts --apply

import { listAllV3Products } from "../lib/wix/v3-products.ts";
import { pHashFromUrl } from "../lib/import/phash.ts";
import { saveProductHash } from "../lib/store/product-hashes.ts";
import { getStore } from "../lib/store/factory.ts";

const APPLY = process.argv.includes("--apply");

/**
 * Karta wixProductId → supplierProductId.
 *
 * ☠️ LÄSES GENOM STOREN, INTE UR WIX DATA (rättat 2026-09-03).
 *
 * Funktionen frågade tidigare FyndplatsMappings direkt. Kollektionen är TOM
 * sedan raderingen 2026-09-01 — och läsningen gick inte sönder, den blev tom:
 * `0 mappningar med AE-id`, noll fel, och varje produkt hashades utan sitt
 * AliExpress-id. Dubblett-detektorn hade därmed tappat sin exakta matchning och
 * fallit tillbaka på bild och titel, tyst.
 *
 * Att det kunde ligga i tre dygn berodde på att källkodsgrinden undantog
 * scripts/. Undantaget är borta.
 */
async function loadAeIdMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const m of await getStore().listMappings()) {
    if (m.wixProductId && m.supplierProductId) map.set(m.wixProductId, m.supplierProductId);
  }
  return map;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  console.log(`[hashes] Läge: ${APPLY ? "SKARPT (sparar)" : "DRY-RUN (skriver inget)"}`);
  const [products, aeIdMap] = await Promise.all([listAllV3Products(), loadAeIdMap()]);
  console.log(`[hashes] ${products.length} produkter, ${aeIdMap.size} mappningar med AE-id.\n`);

  let hashed = 0;
  let saved = 0;
  let noImage = 0;
  let hashFail = 0;
  const samples: string[] = [];
  const BATCH = 6; // måttlig parallellism — snällt mot bild-CDN.

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (p) => {
        const aeProductId = aeIdMap.get(p.id);
        let phash: string | null = null;
        if (!p.imageUrl) {
          noImage++;
        } else {
          phash = await pHashFromUrl(p.imageUrl);
          if (phash) hashed++;
          else hashFail++;
        }
        if (samples.length < 5 && phash) {
          samples.push(`  • "${p.name.slice(0, 48)}" → ${phash}${aeProductId ? ` (AE ${aeProductId})` : ""}`);
        }
        if (APPLY) {
          try {
            await saveProductHash({
              wixProductId: p.id,
              productName: p.name,
              phash,
              aeProductId,
              imageUrl: p.imageUrl,
              slug: p.slug,
              updatedAt: new Date().toISOString(),
            });
            saved++;
          } catch (err) {
            console.error(`[hashes] ✗ save ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }),
    );
    process.stdout.write(`\r[hashes] ${Math.min(i + BATCH, products.length)}/${products.length} bearbetade…`);
    await sleep(150);
  }
  process.stdout.write("\n\n");

  console.log("[hashes] Exempel:");
  console.log(samples.join("\n") || "  (inga hashar beräknade)");
  console.log(
    `\n[hashes] KLART. ${products.length} produkter | ${hashed} hashade | ${noImage} utan bild | ` +
      `${hashFail} hash-fel | ${APPLY ? `${saved} sparade` : "0 sparade (dry-run)"}.`,
  );
  if (!APPLY) console.log("[hashes] Kör om med --apply för att spara i Wix Data.");
}

main().catch((err) => {
  console.error(`[hashes] FEL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
