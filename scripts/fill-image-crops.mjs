#!/usr/bin/env node
/**
 * scripts/fill-image-crops.mjs
 *
 * Batched orchestrator that fills `data/image-crops.json` by repeatedly calling
 * the deployed detection route on Vercel. The route itself runs the Sharp pixel
 * scan; this script just shards the URL set, merges results, and writes the
 * cache atomically.
 *
 * Varför
 * ------
 * `scripts/detect-image-crops.mjs` kräver att noden som kör scriptet har
 * tillgång till static.wixstatic.com — det fungerar inte alltid lokalt. Den
 * driftsatta routen `/api/admin/detect-image-crops` kör samma logik på Vercels
 * runtime som har öppen nät-access. Detta scriptet ringer routen ist. för att
 * göra detection själv.
 *
 * Sharding
 * --------
 * Routen stöder ingen `offset`-param. För att hålla varje request under 300 s
 * timeout shardar vi via `only=<substring>`. Wix-keys har formatet
 * `b379ce_<hex32>~mv2.<ext>` så första hex-tecknet ger en jämn 16-bucket split
 * (~50 bilder per shard av 800).
 *
 * Anv.
 * ----
 *   ADMIN_SECRET=... node scripts/fill-image-crops.mjs                  # alla shards
 *   ADMIN_SECRET=... node scripts/fill-image-crops.mjs --shards 0,1,2   # explicit
 *   ADMIN_SECRET=... node scripts/fill-image-crops.mjs --base https://www.fyndplats.se
 *   ADMIN_SECRET=... node scripts/fill-image-crops.mjs --limit-per-shard 200
 *   ADMIN_SECRET=... node scripts/fill-image-crops.mjs --dry-run
 *
 * Output
 * ------
 * Uppdaterar `data/image-crops.json` i repo-rooten. Loggar coverage före/efter
 * och en sammanställning av skipped/failed per shard. Exit-code 0 om minst en
 * ny entry skrevs, 1 vid totalt misslyckande.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "..");
const CROPS_FILE = path.join(REPO, "data", "image-crops.json");
const PRODUCTS_FILE = path.join(REPO, "products.json");
const VARIANTS_FILE = path.join(REPO, "data", "variant-images.json");

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return fallback;
  const a = args[i];
  if (a.includes("=")) return a.split("=").slice(1).join("=");
  return args[i + 1];
}
function hasFlag(name) {
  return args.some((a) => a === `--${name}`);
}

const BASE = flag("base", process.env.HEADLESS_BASE_URL || "https://www.fyndplats.se").replace(/\/$/, "");
const TOKEN = process.env.ADMIN_SECRET;
const LIMIT_PER_SHARD = Number(flag("limit-per-shard", 250));
const SHARDS_ARG = flag("shards", "");
const TIMEOUT_MS = Number(flag("timeout", 290_000));
const DRY = hasFlag("dry-run");

if (!TOKEN) {
  console.error("ERROR: ADMIN_SECRET environment variable must be set");
  console.error("Sätt den t.ex. genom att läsa .env.local:");
  console.error('  set /p ADMIN_SECRET=<.env.local-rad> && node scripts/fill-image-crops.mjs');
  process.exit(2);
}

const HEX = "0123456789abcdef".split("");
const allShards = HEX.map((h) => `b379ce_${h}`);
const shards = SHARDS_ARG
  ? SHARDS_ARG.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s.startsWith("b379ce_") ? s : `b379ce_${s}`))
  : allShards;

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

function wixMediaKey(url) {
  const m = (url || "").match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? m[1] : null;
}

function collectAllUrls() {
  const urls = new Set();
  try {
    const ps = readJson(PRODUCTS_FILE, []);
    for (const p of ps) {
      if (p.img) urls.add(p.img);
      for (const g of (p.gallery || [])) if (g) urls.add(g);
    }
  } catch {}
  try {
    const v = readJson(VARIANTS_FILE, { products: {} });
    for (const slug of Object.keys(v.products || {})) {
      for (const opt of (v.products[slug].options || [])) {
        for (const c of (opt.choices || [])) if (c.image) urls.add(c.image);
      }
    }
  } catch {}
  return [...urls];
}

function uniqueKeys(urls) {
  const s = new Set();
  for (const u of urls) {
    const k = wixMediaKey(u);
    if (k) s.add(k);
  }
  return s;
}

async function callShard(shard) {
  // proxy.ts kraver ?key=<ADMIN_SECRET> (sätter cookie + redirectar). Routen
  // sjalv kollar ?token=. Vi skickar bada i samma URL — proxy:n redirectar
  // till URL utan key men med cookien satt; fetch foljer redirect automatiskt
  // och cookien skickas tillbaka pa nasta hop -> route auth slutfor pa token.
  const url = `${BASE}/api/admin/detect-image-crops?key=${encodeURIComponent(TOKEN)}&token=${encodeURIComponent(TOKEN)}&only=${encodeURIComponent(shard)}&limit=${LIMIT_PER_SHARD}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const elapsed = Date.now() - started;
    if (!res.ok) {
      let body = "";
      try { body = await res.text(); } catch {}
      return { ok: false, status: res.status, elapsed, body: body.slice(0, 300) };
    }
    const json = await res.json();
    return { ok: true, status: res.status, elapsed, json };
  } catch (e) {
    return { ok: false, elapsed: Date.now() - started, err: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  console.log(`Base URL : ${BASE}`);
  console.log(`Cache    : ${CROPS_FILE}`);
  console.log(`Shards   : ${shards.length} (${shards.join(", ")})`);
  console.log(`Limit/sh : ${LIMIT_PER_SHARD}`);
  console.log(`Dry run  : ${DRY}`);

  const existing = readJson(CROPS_FILE, { version: 1, entries: {} });
  const beforeKeys = new Set(Object.keys(existing.entries || {}));

  const allUrls = collectAllUrls();
  const allKeys = uniqueKeys(allUrls);
  console.log(`\nTotal unique media keys : ${allKeys.size}`);
  console.log(`Already cached          : ${beforeKeys.size}`);
  console.log(`Uncached                : ${allKeys.size - [...beforeKeys].filter((k) => allKeys.has(k)).length}`);
  console.log("");

  const aggSkipped = [];
  const aggFailed = [];
  const newEntries = {};

  for (let i = 0; i < shards.length; i++) {
    const shard = shards[i];
    process.stdout.write(`[${i + 1}/${shards.length}] ${shard} ... `);
    const r = await callShard(shard);
    if (!r.ok) {
      console.log(`FAIL (${r.status ?? "ERR"}, ${r.elapsed} ms) ${r.err || r.body || ""}`);
      aggFailed.push({ shard, status: r.status, err: r.err, body: r.body });
      continue;
    }
    const j = r.json;
    const entries = j.entries || {};
    const ek = Object.keys(entries);
    let added = 0;
    for (const k of ek) {
      if (!beforeKeys.has(k) && !newEntries[k]) added++;
      newEntries[k] = entries[k];
    }
    if (Array.isArray(j.skipped)) aggSkipped.push(...j.skipped.map((x) => ({ ...x, shard })));
    console.log(
      `ok proc=${j.totalProcessed} entries=${ek.length} new=${added} skip=${j.totalSkipped ?? 0} fail=${j.totalFailed ?? 0} (${r.elapsed} ms)`,
    );
  }

  const mergedEntries = { ...(existing.entries || {}), ...newEntries };
  const afterKeys = new Set(Object.keys(mergedEntries));
  const addedTotal = [...afterKeys].filter((k) => !beforeKeys.has(k)).length;

  console.log("");
  console.log(`New entries     : ${addedTotal}`);
  console.log(`Total entries   : ${afterKeys.size}`);
  console.log(`Skipped (total) : ${aggSkipped.length}`);
  console.log(`Failed shards   : ${aggFailed.length}`);
  if (aggFailed.length) console.log(JSON.stringify(aggFailed, null, 2));

  if (DRY) {
    console.log("\n(--dry-run: ingen fil skriven)");
    return;
  }

  const merged = {
    version: 1,
    generatedAt: new Date().toISOString(),
    comment: existing.comment || "Tight-crop bounding-boxes per Wix media-key. Genererad via /api/admin/detect-image-crops (Sharp pa Vercel runtime).",
    entries: mergedEntries,
  };
  const tmp = CROPS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(merged, null, 2) + "\n");
  fs.renameSync(tmp, CROPS_FILE);

  // Skriv en sammanställning av skipped/failed för granskning.
  const reportPath = path.join(REPO, "outputs", "fill-image-crops-report.json");
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      before: beforeKeys.size,
      after: afterKeys.size,
      added: addedTotal,
      coveragePct: allKeys.size ? +(100 * [...afterKeys].filter((k) => allKeys.has(k)).length / allKeys.size).toFixed(2) : null,
      skipped: aggSkipped,
      failed: aggFailed,
    }, null, 2) + "\n");
    console.log(`\nReport : ${reportPath}`);
  } catch (e) {
    console.warn("Kunde inte skriva report:", e.message);
  }

  console.log(`\nUppdaterad: ${CROPS_FILE}`);
  console.log(`Coverage  : ${afterKeys.size}/${allKeys.size} (${(100*[...afterKeys].filter((k) => allKeys.has(k)).length / allKeys.size).toFixed(1)}%)`);

  process.exit(addedTotal > 0 ? 0 : (aggFailed.length ? 1 : 0));
}

main().catch((e) => { console.error(e); process.exit(1); });
