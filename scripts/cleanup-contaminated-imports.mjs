// Cleanup för bug 2026-05-31: döljer Wix-produkter som skapades med Fyndplats
// startsidescopy istället för riktig AliExpress-data (titel "Fyndplats – Bästa
// Deals & Fynd Online" m.fl.).
//
// Kör (dry-run, visar bara vad som skulle döljas):
//   node --env-file=.env.local scripts/cleanup-contaminated-imports.mjs
// Kör skarpt (sätter visible=false):
//   node --env-file=.env.local scripts/cleanup-contaminated-imports.mjs --apply
//
// Produkterna RADERAS inte — de döljs (visible=false), helt reversibelt. Varje
// träff loggas med produkt-id så Leonard kan granska/återställa.

const WIX_BASE = "https://www.wixapis.com";
const APPLY = process.argv.includes("--apply");

// Samma markörer som lib/import/guard.ts looksLikeStoreCopy.
const STORE_COPY_MARKERS = [
  /\bfyndplats\b/i,
  /välkommen till/i,
  /bästa\s+deals/i,
  /bästa\s+fynd/i,
  /din destination för/i,
  /de bästa fynden/i,
  /fynd online/i,
];

function looksLikeStoreCopy(text) {
  if (!text) return false;
  return STORE_COPY_MARKERS.some((re) => re.test(text));
}

function token() {
  const t = process.env.WIX_API_TOKEN;
  if (!t) throw new Error("WIX_API_TOKEN saknas (kör med --env-file=.env.local).");
  return t;
}

// Sajter att söka igenom. createProduct skriver mot WIX_SITE_ID; admin-listan
// läser headless-sajten. I prod är de ofta samma — vi söker båda och dedupar.
function siteIds() {
  const ids = new Set();
  if (process.env.WIX_SITE_ID) ids.add(process.env.WIX_SITE_ID);
  ids.add(process.env.HEADLESS_WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3");
  return [...ids];
}

function headers(siteId) {
  return { Authorization: token(), "wix-site-id": siteId, "Content-Type": "application/json" };
}

async function queryAllProducts(siteId) {
  const all = [];
  let cursor;
  for (let page = 0; page < 50; page++) {
    const cursorPaging = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/stores/v3/products/query`, {
      method: "POST",
      headers: headers(siteId),
      body: JSON.stringify({ query: { cursorPaging } }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`query (${siteId}) ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    for (const p of data.products ?? []) {
      all.push({ id: p.id, name: p.name, slug: p.slug, revision: p.revision, visible: p.visible });
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor || data.pagingMetadata?.hasNext === false || (data.products?.length ?? 0) === 0) break;
  }
  return all;
}

async function hideProduct(siteId, id, revision) {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${id}`, {
    method: "PATCH",
    headers: headers(siteId),
    body: JSON.stringify({ product: { revision, visible: false }, fieldMask: { paths: ["visible"] } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`hide ${id} ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function main() {
  console.log(`[cleanup] Läge: ${APPLY ? "SKARPT (visible=false)" : "DRY-RUN (visar bara träffar)"}`);
  const seen = new Set();
  let total = 0;
  let hidden = 0;

  for (const siteId of siteIds()) {
    let products;
    try {
      products = await queryAllProducts(siteId);
    } catch (err) {
      console.warn(`[cleanup] Hoppar över site ${siteId}: ${err.message}`);
      continue;
    }
    console.log(`[cleanup] Site ${siteId}: ${products.length} produkter genomsökta.`);

    for (const p of products) {
      // Endast namn som faktiskt ser ut som Fyndplats butiks-/startsidescopy.
      // (Vi matchar AVSIKTLIGT inte enbart på "kort namn" — det skulle kunna
      // dölja legitima produkter med korta namn.)
      if (!looksLikeStoreCopy(p.name)) continue;
      const key = `${siteId}:${p.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      total++;
      console.log(
        `[cleanup] TRÄFF id=${p.id} slug=${p.slug} visible=${p.visible} namn="${p.name}"`,
      );
      if (APPLY) {
        if (p.visible === false) {
          console.log(`           (redan dold — hoppar över)`);
          continue;
        }
        try {
          await hideProduct(siteId, p.id, p.revision);
          hidden++;
          console.log(`           → dold (visible=false)`);
        } catch (err) {
          console.warn(`           ! kunde inte dölja: ${err.message}`);
        }
      }
    }
  }

  console.log(`\n[cleanup] Klar. ${total} kontaminerad(e) produkt(er) hittade${APPLY ? `, ${hidden} dolda` : " (dry-run, inget ändrat)"}.`);
  if (!APPLY && total > 0) console.log(`[cleanup] Kör om med --apply för att dölja dem.`);
}

main().catch((err) => {
  console.error(`[cleanup] FEL: ${err.message}`);
  process.exit(1);
});
