// Engångs-cleanup (bug 2026-05-31): RADERAR de trasiga test-importerna av
// AliExpress-produkt 1005010654499020 (Smart USB Body Fat Scale) — importerade
// med 0 bilder + OUT_OF_STOCK innan import-buggarna (bild-analys/bild-extraktion/
// lagerstatus) fixades.
//
// Säkerhet: skriptet itererar en EXPLICIT id-lista och GET:ar varje produkt för
// att VERIFIERA att den fortfarande matchar förväntat SKU-prefix innan den raderas.
// Matchar inte SKU:n hoppas produkten över (skyddar mot stala id:n).
//
// Kör (dry-run):   node --env-file=.env.local scripts/delete-broken-imports.mjs
// Kör skarpt:      node --env-file=.env.local scripts/delete-broken-imports.mjs --apply

const WIX_BASE = "https://www.wixapis.com";
const APPLY = process.argv.includes("--apply");
const SKU_PREFIX = "AE-1005010654499020";

// De två trasiga test-importerna (verifierade 2026-05-31: 0 bilder, OUT_OF_STOCK,
// sku AE-1005010654499020-default).
const CANDIDATE_IDS = [
  "147c3ffd-4c24-4f59-80a5-159674ead2c6",
  "b8f12013-5b96-4adc-aeee-e74aedd03ba6",
];

function token() {
  const t = process.env.WIX_API_TOKEN;
  if (!t) throw new Error("WIX_API_TOKEN saknas (kör med --env-file=.env.local).");
  return t;
}

function siteId() {
  return process.env.WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
}

function headers() {
  return { Authorization: token(), "wix-site-id": siteId(), "Content-Type": "application/json" };
}

async function getProduct(id) {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${id}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get ${id} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).product;
}

async function deleteProduct(id) {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${id}`, { method: "DELETE", headers: headers() });
  if (!res.ok && res.status !== 404) {
    throw new Error(`delete ${id} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function main() {
  console.log(`[del] Läge: ${APPLY ? "SKARPT (RADERAR)" : "DRY-RUN"} — site ${siteId()}`);
  let deleted = 0;
  for (const id of CANDIDATE_IDS) {
    const p = await getProduct(id);
    if (!p) {
      console.log(`[del] id=${id} hittades inte (redan raderad?) — hoppar över.`);
      continue;
    }
    const skus = (p.variantsInfo?.variants ?? []).map((v) => v.sku).filter(Boolean);
    const imgCount = (p.media?.itemsInfo?.items ?? []).length;
    const match = skus.some((s) => s.startsWith(SKU_PREFIX));
    console.log(
      `[del] id=${id} namn="${p.name}" sku=${skus[0]} bilder=${imgCount} ` +
        `lager=${p.inventory?.availabilityStatus} matchar=${match}`,
    );
    if (!match) {
      console.warn(`[del] ! SKU matchar inte "${SKU_PREFIX}" — RADERAR INTE (säkerhetsspärr).`);
      continue;
    }
    if (!APPLY) continue;
    await deleteProduct(id);
    deleted++;
    console.log(`[del] → raderad id=${id}`);
  }
  console.log(`\n[del] Klar. ${APPLY ? `${deleted} raderade.` : "dry-run, inget ändrat. Kör om med --apply."}`);
}

main().catch((err) => {
  console.error(`[del] FEL: ${err.message}`);
  process.exit(1);
});
