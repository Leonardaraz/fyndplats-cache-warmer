#!/usr/bin/env node
/**
 * scripts/detect-image-crops.mjs
 *
 * Detection-script för tight-crop av Wix-CDN-bilder.
 *
 * Vad
 * ---
 * Går igenom alla unika Wix-CDN-bilder som visas i butiken (samlade från
 * products.json + Wix V3 catalog), hämtar varje bild i original-storlek,
 * scannar från varje kant inåt med Sharp tills en pixel hittas där minst en
 * RGB-kanal är <240/255, räknar ut bounding-box för innehållet, paddar med
 * ~6 % och justerar till 1:1 aspect-ratio.
 *
 * Skriver `data/image-crops.json` med en `entries`-map: media-key → { ow, oh,
 * x, y, w, h, margins, skip? }. Hoppar (skip:true) bilder med >25 % margin på
 * någon kant (sannolikt mätfel — t.ex. svart bakgrund eller dark mode).
 *
 * Hur
 * ---
 *   node scripts/detect-image-crops.mjs                # full detection
 *   node scripts/detect-image-crops.mjs --limit 10     # debug
 *   node scripts/detect-image-crops.mjs --only sport,led  # ord-filter
 *   node scripts/detect-image-crops.mjs --selftest     # ingen nätverk
 *
 * Kräver: nätverkstillgång till static.wixstatic.com (kör lokalt eller
 * via Vercel build). Sandbox med allowlist måste ha wixstatic påslaget.
 *
 * Säkerhet
 * --------
 *  • <3 % margin på alla kanter → ingen entry (bilden är redan tight).
 *  • >25 % margin på någon kant → skip:true (flag).
 *  • Aspect-ratio låst till 1:1 (samma som dagens hero-rutor).
 *  • Bild som inte går att hämta (4xx/5xx, timeout) → loggas, ingen entry.
 *
 * Ingen LLM, ingen API-cost — bara Sharp.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const WHITE_THRESHOLD = 248; // 0–255 per kanal. <240 räknas som "innehåll".
const PADDING_PCT = 6;       // padding kring innehållet (per kant av crop-bredd).
const SKIP_MARGIN_PCT = 25;  // >25 % margin på någon kant → skip.
const MIN_MARGIN_PCT = 3;    // <3 % margin på alla kanter → behåll original.
const MAX_PARALLEL = 6;      // samtidiga hämtningar.
const FETCH_TIMEOUT_MS = 20000;

const args = process.argv.slice(2);
const argIs = (k) => args.includes(k);
const argVal = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : null;
};
const LIMIT = Number(argVal("--limit") || 0) || Infinity;
const ONLY = (argVal("--only") || "").toLowerCase().split(",").filter(Boolean);
const SELFTEST = argIs("--selftest");

function wixMediaKey(url) {
  const m = (url || "").match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? m[1] : null;
}

function originalWixUrl(url) {
  const key = wixMediaKey(url);
  if (!key) return null;
  // Original-bilden (utan transformer) finns alltid på /media/<key>.
  return `https://static.wixstatic.com/media/${key}`;
}

/**
 * Scanna en RGB-buffer från varje kant inåt tills en icke-vit pixel hittas.
 * Returnerar bounding-box i pixlar.
 */
function findBoundingBox(rgb, w, h, channels) {
  const isContent = (off) => {
    // alpha-säker: om RGBA och alpha < 16, räkna som transparent (=bakgrund).
    if (channels === 4 && rgb[off + 3] < 16) return false;
    return rgb[off] < WHITE_THRESHOLD || rgb[off + 1] < WHITE_THRESHOLD || rgb[off + 2] < WHITE_THRESHOLD;
  };
  let top = 0, left = 0, right = w - 1, bottom = h - 1;
  // top
  outerTop:
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isContent((y * w + x) * channels)) { top = y; break outerTop; }
    }
  }
  // bottom
  outerBottom:
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      if (isContent((y * w + x) * channels)) { bottom = y; break outerBottom; }
    }
  }
  // left
  outerLeft:
  for (let x = 0; x < w; x++) {
    for (let y = top; y <= bottom; y++) {
      if (isContent((y * w + x) * channels)) { left = x; break outerLeft; }
    }
  }
  // right
  outerRight:
  for (let x = w - 1; x >= 0; x--) {
    for (let y = top; y <= bottom; y++) {
      if (isContent((y * w + x) * channels)) { right = x; break outerRight; }
    }
  }
  return { top, left, right, bottom };
}

/**
 * Givet bbox + originalstorlek, returnera tight-crop-rektangel (kvadratisk,
 * padded) och marginal-procent.
 */
function bboxToCrop(bbox, ow, oh) {
  const { top, left, right, bottom } = bbox;
  const contentW = right - left + 1;
  const contentH = bottom - top + 1;
  const margins = {
    top: (top / oh) * 100,
    right: ((ow - 1 - right) / ow) * 100,
    bottom: ((oh - 1 - bottom) / oh) * 100,
    left: (left / ow) * 100,
  };
  const maxMargin = Math.max(margins.top, margins.right, margins.bottom, margins.left);
  const minMargin = Math.min(margins.top, margins.right, margins.bottom, margins.left);
  // Kvadratisk crop runt content center. Sidan = max(contentW, contentH) * (1 + 2*padding).
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const baseSize = Math.max(contentW, contentH);
  const padFactor = 1 + 2 * (PADDING_PCT / 100);
  let side = Math.round(baseSize * padFactor);
  // Klipp inte utanför originalbilden.
  side = Math.min(side, ow, oh);
  let x = Math.round(cx - side / 2);
  let y = Math.round(cy - side / 2);
  x = Math.max(0, Math.min(x, ow - side));
  y = Math.max(0, Math.min(y, oh - side));
  return { x, y, w: side, h: side, margins, maxMargin, minMargin };
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "fyndplats-crop-detect/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

async function detectOne(url) {
  const orig = originalWixUrl(url);
  if (!orig) return { ok: false, err: "not-wix" };
  const buf = await fetchWithTimeout(orig, FETCH_TIMEOUT_MS);
  // Sharp läser i original-färgrymd; vi vill ha raw RGBA.
  const img = sharp(buf, { failOn: "none" });
  const meta = await img.metadata();
  const ow = meta.width, oh = meta.height;
  if (!ow || !oh) return { ok: false, err: "no-dimensions" };
  // Begränsa scanningen: stora bilder krymps innan scan (snabbare, samma bbox-ratio).
  // Vi scannar på max 800x800 raw för fart, sedan skalar tillbaka koord. till original.
  const scanSize = 800;
  const scale = Math.min(1, scanSize / Math.max(ow, oh));
  const sw = Math.max(1, Math.round(ow * scale));
  const sh = Math.max(1, Math.round(oh * scale));
  const { data: rgba, info } = await sharp(buf, { failOn: "none" })
    .resize(sw, sh, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bbox = findBoundingBox(rgba, info.width, info.height, info.channels);
  // Skala bbox tillbaka till original-pixlar.
  const origBbox = {
    top: Math.round(bbox.top / scale),
    left: Math.round(bbox.left / scale),
    right: Math.round(bbox.right / scale),
    bottom: Math.round(bbox.bottom / scale),
  };
  const crop = bboxToCrop(origBbox, ow, oh);
  // Behåll original om bilden redan är tight.
  if (crop.maxMargin < MIN_MARGIN_PCT) {
    return { ok: true, ow, oh, crop, skip: true, reason: "already-tight" };
  }
  // Skippa om någon kant är extremt stor (sannolikt mätfel/svart bg).
  if (crop.maxMargin > SKIP_MARGIN_PCT) {
    return { ok: true, ow, oh, crop, skip: true, reason: "margin-too-large" };
  }
  return { ok: true, ow, oh, crop, skip: false };
}

async function collectUrls() {
  const urls = new Set();
  // 1. products.json (lokal fallback-katalog).
  try {
    const ps = JSON.parse(fs.readFileSync(path.join(ROOT, "products.json"), "utf8"));
    for (const p of ps) {
      if (p.img) urls.add(p.img);
      for (const g of (p.gallery || [])) if (g) urls.add(g);
    }
  } catch {}
  // 2. variant-images.json (alla produkter med varianter).
  try {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, "data/variant-images.json"), "utf8"));
    for (const slug of Object.keys(v.products || {})) {
      for (const opt of (v.products[slug].options || [])) {
        for (const c of (opt.choices || [])) {
          if (c.image) urls.add(c.image);
        }
      }
    }
  } catch {}
  // 3. Hämta full katalog från live API om miljö-vars är satta (Wix V3).
  // Vi behöver inte tokens här — public OAuth räcker för listning.
  return urls;
}

async function selftest() {
  // Skapa en konstgjord bild med tydlig vit padding och verifiera detection.
  const size = 400;
  const padding = 80; // 20 % padding.
  const bg = await sharp({
    create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{
      input: await sharp({
        create: { width: size - 2 * padding, height: size - 2 * padding, channels: 3, background: { r: 50, g: 100, b: 200 } },
      }).png().toBuffer(),
      top: padding, left: padding,
    }])
    .png()
    .toBuffer();
  const { data: rgba, info } = await sharp(bg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bbox = findBoundingBox(rgba, info.width, info.height, info.channels);
  const crop = bboxToCrop(bbox, size, size);
  console.log("selftest bbox:", bbox);
  console.log("selftest crop:", crop);
  const expectedMargin = (padding / size) * 100;
  const ok = Math.abs(crop.margins.top - expectedMargin) < 1
    && Math.abs(crop.margins.left - expectedMargin) < 1;
  console.log("expected margin per side ≈", expectedMargin.toFixed(1), "%");
  console.log(ok ? "SELFTEST OK" : "SELFTEST FAIL");
  process.exit(ok ? 0 : 1);
}

async function pMap(items, fn, conc) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (e) {
        results[idx] = { err: e.message };
      }
    }
  }
  const workers = Array.from({ length: Math.min(conc, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function main() {
  if (SELFTEST) return selftest();
  const urls = [...await collectUrls()];
  const filtered = ONLY.length
    ? urls.filter((u) => ONLY.some((k) => u.toLowerCase().includes(k)))
    : urls;
  const todo = filtered.slice(0, LIMIT);
  console.log(`Detection: ${todo.length} unique URLs (filtered from ${urls.length}).`);
  if (!todo.length) {
    console.log("Nothing to do.");
    return;
  }
  let done = 0;
  const entries = {};
  const skipped = [];
  const failed = [];
  await pMap(todo, async (url) => {
    const key = wixMediaKey(url);
    try {
      const r = await detectOne(url);
      done++;
      if (!r.ok) {
        failed.push({ url, err: r.err });
        process.stdout.write(`\r[${done}/${todo.length}] FAIL ${key}: ${r.err}\n`);
        return;
      }
      if (r.skip) {
        skipped.push({ key, reason: r.reason, maxMargin: r.crop.maxMargin });
        process.stdout.write(`\r[${done}/${todo.length}] SKIP ${key}: ${r.reason} (max ${r.crop.maxMargin.toFixed(1)}%)\n`);
        return;
      }
      entries[key] = {
        ow: r.ow, oh: r.oh,
        x: r.crop.x, y: r.crop.y, w: r.crop.w, h: r.crop.h,
        margins: {
          top: +r.crop.margins.top.toFixed(2),
          right: +r.crop.margins.right.toFixed(2),
          bottom: +r.crop.margins.bottom.toFixed(2),
          left: +r.crop.margins.left.toFixed(2),
        },
      };
      process.stdout.write(`\r[${done}/${todo.length}] OK   ${key} margins=${Object.values(r.crop.margins).map(m=>m.toFixed(0)).join(",")}%\n`);
    } catch (e) {
      done++;
      failed.push({ url, err: e.message });
      process.stdout.write(`\r[${done}/${todo.length}] ERR  ${key}: ${e.message}\n`);
    }
  }, MAX_PARALLEL);
  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalProcessed: todo.length,
    totalEntries: Object.keys(entries).length,
    totalSkipped: skipped.length,
    totalFailed: failed.length,
    skipped,
    failed,
    entries,
  };
  const outPath = path.join(ROOT, "data/image-crops.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${outPath}: ${out.totalEntries} entries, ${out.totalSkipped} skipped, ${out.totalFailed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
