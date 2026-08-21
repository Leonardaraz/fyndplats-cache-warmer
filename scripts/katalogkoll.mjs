// Katalogkoll: två tysta fel som båda gör en färdig sida osynlig för kunden.
//
//   1. SYNLIGHET  – färdiga sidor som ligger dolda (visible:false).
//   2. KATEGORI   – synliga sidor utan riktig kategori, eller med ett löv men
//                   utan sin förälder (då syns de inte när kunden browsar).
//
// Kör (dry-run, listar bara):
//   node --env-file=.env.local scripts/katalogkoll.mjs
// Kör skarpt (rättar båda):
//   node --env-file=.env.local scripts/katalogkoll.mjs --apply
//
// Varför skriptet finns
// ---------------------
// 2026-08-15 låg 77 färdigpolerade sidor plötsligt dolda. Ingen hade rört dem
// medvetet: en PATCH som innehåller `variantsInfo` kan tyst flippa `visible` på
// en publicerad produkt (runbooken Steg 6, historik 2026-07-09, 2026-08-04,
// 2026-08-05). Flippen ger 200 OK och syns ingenstans — produkten försvinner
// bara ur butiken. Leonard upptäckte det för att han råkade bläddra i Wix-appen.
//
// Poleringskön (/admin/queue) fångar det INTE: den läser `draftStatus` på
// mappningsraden, inte `visible` i Wix. En sida kan alltså vara "publicerad"
// enligt kön och samtidigt osynlig i butiken. Det här skriptet läser Wix.
//
// Vad som räknas som en FÄRDIG sida
// ---------------------------------
// Rå-importer skapas medvetet som draft och ska förbli dolda tills de poleras.
// Skillnaden mot en färdig sida är mätbar: en polerad sida har SEO-taggar, en
// huvudbild och en riktig svensk beskrivning. Tröskeln nedan är avsiktligt
// konservativ — hellre missa en färdig sida än publicera ett halvfärdigt utkast.
//
// Att publicera om produkten räcker: `visible:true` på produktnivå kaskaderar
// ned till variantens `visible` (verifierat 2026-08-15 på automatmataren), så
// följdbuggen "syns men går inte att lägga i varukorgen" åtgärdas samtidigt.

const WIX_BASE = "https://www.wixapis.com";
const APPLY = process.argv.includes("--apply");

// En färdig sida har alla tre. Se resonemanget ovan.
const MIN_SEO_TAGGAR = 3;
const MIN_BESKRIVNING = 800;

function token() {
  const t = process.env.WIX_API_TOKEN;
  if (!t) throw new Error("WIX_API_TOKEN saknas (kör med --env-file=.env.local).");
  return t;
}

function siteId() {
  return process.env.HEADLESS_WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
}

function headers() {
  return { Authorization: token(), "wix-site-id": siteId(), "Content-Type": "application/json" };
}

async function post(path, body) {
  const res = await fetch(`${WIX_BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} svarade ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

/** Alla dolda produkter, paginerat till slutet. */
async function hamtaDolda() {
  const alla = [];
  let cursor;
  // cursorPaging.limit är max 100 i Stores V3.
  for (let sida = 0; sida < 50; sida++) {
    const cursorPaging = cursor ? { limit: 100, cursor } : { limit: 100 };
    const data = await post("/stores/v3/products/query", {
      query: { filter: { visible: { $eq: false } }, cursorPaging },
      fields: ["PLAIN_DESCRIPTION"],
    });
    alla.push(...(data.products ?? []));
    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor) break;
  }
  return alla;
}

function arFardig(p) {
  const seo = p.seoData?.tags?.length ?? 0;
  const harBild = Boolean(p.media?.main);
  const langd = (p.plainDescription ?? "").length;
  return seo >= MIN_SEO_TAGGAR && harBild && langd > MIN_BESKRIVNING;
}

// --- Kategorier -------------------------------------------------------------
//
// Runbooken Steg 4A: en produkt ska kopplas till BÅDE lövet och dess förälder.
// Bara lövet räcker inte — kunden som browsar från toppnivån ser då ingenting.
// Poleringsflödet missar föräldern med jämna mellanrum (12 sidor på två dygn
// 2026-08-13/14, efter att katalogen städats en gång), så det behöver kollas
// om efter varje batch och inte bara en gång.

const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

async function hamtaTrad() {
  const data = await post("/categories/v1/categories/query", {
    query: { cursorPaging: { limit: 200 } },
    treeReference: { appNamespace: "@wix/stores" },
  });
  return data.categories ?? [];
}

/** Alla synliga produkter med sina direktkopplade kategorier. */
async function hamtaSynliga() {
  const alla = [];
  let cursor;
  for (let sida = 0; sida < 15; sida++) {
    const cursorPaging = cursor ? { limit: 100, cursor } : { limit: 100 };
    const data = await post("/stores/v3/products/query", {
      query: { cursorPaging },
      fields: ["DIRECT_CATEGORIES_INFO"],
    });
    alla.push(...(data.products ?? []).filter((p) => p.visible));
    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor) break;
  }
  return alla;
}

async function kollaKategorier() {
  const cats = await hamtaTrad();
  const byId = new Map(cats.map((c) => [c.id, c]));
  // "All Products" är Wix egen samlingskategori, inte en riktig placering.
  const allProducts = cats.find((c) => c.name === "All Products")?.id;
  const foralderTill = (id) => byId.get(id)?.parentCategory?.id ?? null;

  const brister = [];
  for (const p of await hamtaSynliga()) {
    const ids = (p.directCategoriesInfo?.categories ?? [])
      .map((c) => c.id)
      .filter((id) => id !== allProducts);
    if (ids.length === 0) {
      brister.push({ id: p.id, slug: p.slug, typ: "ingen kategori", saknas: [] });
      continue;
    }
    const har = new Set(ids);
    const saknas = [...new Set(ids.map(foralderTill).filter((id) => id && !har.has(id)))];
    if (saknas.length) {
      brister.push({ id: p.id, slug: p.slug, typ: "löv utan förälder", saknas });
    }
  }

  console.log(`\nSynliga sidor med kategoribrist: ${brister.length}`);
  for (const b of brister) {
    const namn = b.saknas.map((id) => byId.get(id)?.name ?? id).join(" + ");
    console.log(`  ${b.slug} — ${b.typ}${namn ? ` (saknar ${namn})` : ""}`);
  }
  if (brister.length === 0) return;

  // "ingen kategori" kan skriptet inte gissa åt dig — den kräver ett mänskligt
  // val av rätt hylla. Föräldrakopplingen är däremot entydig och rättas här.
  const rattningsbara = brister.filter((b) => b.saknas.length > 0);
  const manuella = brister.filter((b) => b.saknas.length === 0);
  if (manuella.length) {
    console.log(`\n  ${manuella.length} sida(or) saknar kategori helt — välj hylla manuellt, skriptet gissar inte.`);
  }
  if (!APPLY || rattningsbara.length === 0) {
    if (rattningsbara.length) console.log(`\nDry-run. --apply kopplar ${rattningsbara.length} saknad(e) förälder.`);
    return;
  }

  let ok = 0;
  for (const b of rattningsbara) {
    // Additivt: add-item rör inga produktfält och kan inte flippa visible.
    const res = await post("/categories/v1/bulk/categories/add-item", {
      item: { catalogItemId: b.id, appId: STORES_APP_ID },
      categoryIds: b.saknas,
      treeReference: { appNamespace: "@wix/stores" },
    });
    // Läs bulkActionMetadata, inte directCategoriesInfo — det senare släpar.
    if ((res.bulkActionMetadata?.totalFailures ?? 0) === 0) ok++;
    else console.log(`  MISSLYCKADES: ${b.slug}`);
  }
  console.log(`\nKopplade förälder på ${ok}/${rattningsbara.length} sidor.`);
}

async function kollaSynlighet() {
  const dolda = await hamtaDolda();
  const fardiga = dolda.filter(arFardig);
  const utkast = dolda.filter((p) => !arFardig(p));

  console.log(`Dolda produkter totalt: ${dolda.length}`);
  console.log(`  – råutkast (ska förbli dolda): ${utkast.length}`);
  console.log(`  – FÄRDIGA sidor som ligger dolda: ${fardiga.length}`);

  if (fardiga.length === 0) {
    console.log("Inget att åtgärda: ingen färdig sida ligger dold.");
    return;
  }

  for (const p of fardiga) console.log(`  ${p.id}  ${p.name}`);

  if (!APPLY) {
    console.log(`\nDry-run. --apply publicerar de ${fardiga.length} sidorna.`);
    return;
  }

  // Ett filterbaserat bulk-anrop i stället för N PATCHar: update-by-filter är en
  // partiell uppdatering (bara fälten i `product` rörs), så media, seoData,
  // ribbon, pris och SKU lämnas orörda.
  const { jobId } = await post("/stores/v3/bulk/products/update-by-filter", {
    filter: { id: { $in: fardiga.map((p) => p.id) } },
    product: { visible: true },
  });
  console.log(`\nPublicerade ${fardiga.length} sidor. jobId=${jobId}`);

  const { count } = await post("/stores/v3/products/count", { filter: { visible: { $eq: false } } });
  console.log(`Dolda produkter efter körningen: ${count} (förväntat: ${utkast.length} råutkast).`);
}

async function main() {
  await kollaSynlighet();
  // Kategorikollen läser bara SYNLIGA produkter, så den körs efter
  // publiceringen — annars missar den sidor som just blivit synliga.
  await kollaKategorier();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
