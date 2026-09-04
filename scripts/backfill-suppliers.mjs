// Backfill av säljar-koppling (Feature 6) för redan importerade produkter.
//
//   node --experimental-strip-types scripts/backfill-suppliers.mjs   # DRY-RUN
//   BACKFILL_DRY_RUN=false node --experimental-strip-types scripts/backfill-suppliers.mjs
//
// ☠️ MAPPNINGARNA LÄSES OCH SKRIVS GENOM STOREN (rättat 2026-09-03). Skriptet
// frågade FyndplatsMappings direkt i Wix Data. Kollektionen är TOM sedan
// raderingen 2026-09-01 — och läsningen gick inte sönder, den blev tom: noll
// kandidater, "inget att backfilla", noll fel. Att det kunde ligga i tre dygn
// berodde på att källkodsgrinden undantog scripts/; undantaget är borta.
// FyndplatsSuppliers har INTE flyttat och skrivs fortfarande direkt.
//
// Går igenom mappningarna. För varje produkt UTAN supplierId men MED en
// sparad sourceUrl hämtas AliExpress-sidan och vi försöker plocka säljarens
// store-id + namn ur HTML:en (inbäddad storeNum/sellerAdminSeq, /store/{id}-länk
// eller "storeName":"…"-fragment).
//
// ÄRLIG BEGRÄNSNING: AliExpress nya PC-sida renderas klient-sida (runParams=null,
// se extension/content.js). Säljar-id ligger ofta bara i React-state som inte
// finns i den råa HTML:en. De produkter där vi inte kan rekonstruera säljaren
// SKIPPAS (rapporteras) — de får supplierId vid nästa manuella om-import istället.
//
// Skrivningar (när ej dry-run):
//   1. Sätter supplierId/supplierName på mappnings-raden.
//   2. Upsertar en FyndplatsSuppliers-rad med productsImported = antal backfillade
//      produkter för säljaren (status "good"; ingen order-/klagomålshistorik än).

import { readFileSync } from "node:fs";
import { getStore } from "../lib/store/factory.ts";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const TOKEN = env.WIX_API_TOKEN;
const SITE = env.WIX_SITE_ID;
if (!TOKEN) { console.error("WIX_API_TOKEN saknas i .env.local"); process.exit(1); }

const DRY_RUN = (process.env.BACKFILL_DRY_RUN ?? "true").toLowerCase() !== "false";
const COL_SUPPLIERS = env.WIX_DATA_COL_SUPPLIERS || "FyndplatsSuppliers";

const headers = {
  Authorization: TOKEN,
  "Content-Type": "application/json",
  ...(SITE ? { "wix-site-id": SITE } : {}),
};

const WIX = "https://www.wixapis.com";

async function queryAll(collection) {
  const out = [];
  let skip = 0;
  for (;;) {
    const res = await fetch(`${WIX}/data/v2/items/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        dataCollectionId: collection,
        query: { filter: {}, paging: { limit: 100, offset: skip } },
      }),
    });
    if (!res.ok) {
      if (res.status === 404) return out;
      throw new Error(`query ${collection} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const body = await res.json();
    const items = (body.dataItems ?? []).map((d) => d.data).filter(Boolean);
    out.push(...items);
    if (items.length < 100) return out;
    skip += 100;
  }
}

async function saveRow(collection, id, data) {
  const res = await fetch(`${WIX}/data/v2/items/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({ dataCollectionId: collection, dataItem: { id, dataCollectionId: collection, data: { _id: id, ...data } } }),
  });
  if (!res.ok) throw new Error(`save ${collection}/${id} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// Försöker plocka säljaren ur den råa AE-HTML:en. Returnerar {supplierId, supplierName, supplierStoreUrl} eller null.
function parseSupplierFromHtml(html) {
  let supplierId = "";
  let supplierName = "";
  let supplierStoreUrl = "";

  const idMatch =
    html.match(/"storeNum"\s*:\s*"?(\d+)"?/) ||
    html.match(/"sellerAdminSeq"\s*:\s*"?(\d+)"?/) ||
    html.match(/\/store\/(\d+)/);
  if (idMatch) supplierId = idMatch[1];

  const nameMatch =
    html.match(/"storeName"\s*:\s*"([^"]{2,80})"/) ||
    html.match(/"shopName"\s*:\s*"([^"]{2,80})"/);
  if (nameMatch) supplierName = nameMatch[1];

  const urlMatch = html.match(/(https?:)?\/\/[^"']*\/store\/\d+[^"']*/);
  if (urlMatch) {
    supplierStoreUrl = urlMatch[0].startsWith("//") ? "https:" + urlMatch[0] : urlMatch[0];
  }

  return supplierId ? { supplierId, supplierName, supplierStoreUrl } : null;
}

async function fetchSupplier(sourceUrl) {
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    return parseSupplierFromHtml(await res.text());
  } catch {
    return null;
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[backfill] DRY_RUN=${DRY_RUN} (sätt BACKFILL_DRY_RUN=false för att skriva)`);
  const mappings = await getStore().listMappings();
  console.log(`[backfill] ${mappings.length} mappningar totalt.`);

  const targets = mappings.filter((m) => !m.supplierId && m.sourceUrl);
  const alreadyHad = mappings.filter((m) => m.supplierId).length;
  const noUrl = mappings.filter((m) => !m.supplierId && !m.sourceUrl).length;
  console.log(`[backfill] ${alreadyHad} har redan supplierId · ${targets.length} att försöka · ${noUrl} saknar sourceUrl (skippas).`);

  const resolved = []; // { mapping, supplier }
  const skipped = [];
  for (let i = 0; i < targets.length; i++) {
    const m = targets[i];
    const sup = await fetchSupplier(m.sourceUrl);
    if (sup) {
      resolved.push({ mapping: m, supplier: sup });
      console.log(`  [${i + 1}/${targets.length}] ✓ ${m.wixProductId} → säljare ${sup.supplierId} ${sup.supplierName || ""}`);
    } else {
      skipped.push(m);
      console.log(`  [${i + 1}/${targets.length}] – ${m.wixProductId} kunde inte rekonstrueras (klient-renderad sida).`);
    }
    await delay(1500); // var snäll mot AliExpress
  }

  // Aggregera per säljare → productsImported.
  const bySupplier = new Map();
  for (const { supplier } of resolved) {
    const cur = bySupplier.get(supplier.supplierId) || { ...supplier, count: 0 };
    cur.count++;
    if (!cur.supplierName && supplier.supplierName) cur.supplierName = supplier.supplierName;
    bySupplier.set(supplier.supplierId, cur);
  }

  if (!DRY_RUN) {
    const now = new Date().toISOString();
    for (const { mapping, supplier } of resolved) {
      await getStore().saveMapping({
        ...mapping,
        supplierId: supplier.supplierId,
        ...(supplier.supplierName ? { supplierName: supplier.supplierName } : {}),
      });
    }
    for (const s of bySupplier.values()) {
      await saveRow(COL_SUPPLIERS, s.supplierId, {
        supplierId: s.supplierId,
        supplierName: s.supplierName || "",
        supplierStoreUrl: s.supplierStoreUrl || "",
        aeRating: null,
        aeFollowers: null,
        productsImported: s.count,
        productsSold: 0,
        avgShipDays: 0,
        shipDaysSamples: 0,
        complaintCount: 0,
        complaintRate: 0,
        firstSeenAt: now,
        lastUpdatedAt: now,
        status: "good",
      });
    }
  }

  console.log("\n[backfill] KLART");
  console.log(`  rekonstruerade : ${resolved.length} produkter → ${bySupplier.size} säljare`);
  console.log(`  skippade       : ${skipped.length} (klient-renderad/ingen säljare i HTML)`);
  console.log(`  redan kopplade : ${alreadyHad}`);
  console.log(`  utan sourceUrl : ${noUrl}`);
  if (DRY_RUN) console.log("  (DRY-RUN — inget skrevs. Kör med BACKFILL_DRY_RUN=false för att spara.)");
}

main().catch((err) => {
  console.error("[backfill] FEL:", err);
  process.exit(1);
});
