// app/api/admin/detect-image-crops/route.ts
// Server-side endpoint som kor Sharp-baserad tight-crop-detection mot Wix CDN
// och returnerar fardig JSON som kan paste:as in i `data/image-crops.json`.
//
// Anvandning:
//   GET  /api/admin/detect-image-crops?token=<ADMIN_SECRET>
//   POST /api/admin/detect-image-crops?token=<ADMIN_SECRET>  (body: { urls: [...] })
//
// Parametrar:
//   token       - kravs. Matchas mot env ADMIN_SECRET (samma som proxy.ts).
//   limit       - valfri. Begransa antal URLer (for debug / shard-tid).
//   only        - valfri. Kommaseparerad lista substrings - bilder vars URL matchar.
//   urls        - valfri. Kommaseparerad lista konkreta URLer (eller media-keys).
//                 Bypassar produkts-katalogen - anvandbart for auto-trigger efter
//                 import (cache-warmer skickar nyimporterade bilder direkt).
//   skipCached  - valfri (1). Hoppa over media-keys som redan finns i
//                 `data/image-crops.json` - drastiskt snabbare vid re-scan.
//
// Svaret ar samma form som `data/image-crops.json` ({ version, generatedAt,
// entries, skipped, failed }). Spara svaret som filen och deploya igen.

import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 300; // sek; detection kan ta tid.

const WHITE_THRESHOLD = 248;
const PADDING_PCT = 6;
const SKIP_MARGIN_PCT = 45;
const MIN_MARGIN_PCT = 3;
const FETCH_TIMEOUT_MS = 20000;
const MAX_PARALLEL = 6;

function wixMediaKey(url: string): string | null {
  const m = (url || "").match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? m[1] : null;
}

function originalWixUrl(url: string): string | null {
  const k = wixMediaKey(url);
  return k ? `https://static.wixstatic.com/media/${k}` : null;
}

function findBoundingBox(
  rgba: Buffer,
  w: number,
  h: number,
  channels: number,
): { top: number; left: number; right: number; bottom: number } {
  const isContent = (off: number) => {
    if (channels === 4 && rgba[off + 3] < 16) return false;
    return rgba[off] < WHITE_THRESHOLD || rgba[off + 1] < WHITE_THRESHOLD || rgba[off + 2] < WHITE_THRESHOLD;
  };
  let top = 0, left = 0, right = w - 1, bottom = h - 1;
  outerTop:
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isContent((y * w + x) * channels)) { top = y; break outerTop; }
    }
  }
  outerBottom:
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      if (isContent((y * w + x) * channels)) { bottom = y; break outerBottom; }
    }
  }
  outerLeft:
  for (let x = 0; x < w; x++) {
    for (let y = top; y <= bottom; y++) {
      if (isContent((y * w + x) * channels)) { left = x; break outerLeft; }
    }
  }
  outerRight:
  for (let x = w - 1; x >= 0; x--) {
    for (let y = top; y <= bottom; y++) {
      if (isContent((y * w + x) * channels)) { right = x; break outerRight; }
    }
  }
  return { top, left, right, bottom };
}

function bboxToCrop(
  bbox: { top: number; left: number; right: number; bottom: number },
  ow: number,
  oh: number,
) {
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
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  // baseSize: vi behåller `min(contentW, contentH)` så cropet fyller hela rutan
  // även när innehållet är högt-och-smalt eller brett-och-lågt (t.ex. Gua Sha-
  // bilder där content är ~5×8 cm i ett 800×800-foto med vit padding).
  // Tidigare `max` gjorde att den 1:1-snappade siden = långsidan av content,
  // vilket inkluderar all vit padding på kortsidan → bilden ser liten ut i
  // .gmain-containern. `min` skär in i den långa dimensionen (t.ex. klipper
  // bort mätpilarna ovan/under stenen) men ger en bild som fyller frame:n.
  // Bug 2026-06-03: Leonards observation att Gua Sha-bilden inte fyllde rutan.
  const baseSize = Math.min(contentW, contentH);
  const padFactor = 1 + 2 * (PADDING_PCT / 100);
  let side = Math.round(baseSize * padFactor);
  side = Math.min(side, ow, oh);
  let x = Math.round(cx - side / 2);
  let y = Math.round(cy - side / 2);
  x = Math.max(0, Math.min(x, ow - side));
  y = Math.max(0, Math.min(y, oh - side));
  return { x, y, w: side, h: side, margins, maxMargin, minMargin };
}

async function fetchBuf(url: string, ms: number): Promise<Buffer> {
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

async function detectOne(url: string) {
  const orig = originalWixUrl(url);
  if (!orig) return { ok: false as const, err: "not-wix" };
  const buf = await fetchBuf(orig, FETCH_TIMEOUT_MS);
  const meta = await sharp(buf, { failOn: "none" }).metadata();
  const ow = meta.width, oh = meta.height;
  if (!ow || !oh) return { ok: false as const, err: "no-dimensions" };
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
  const origBbox = {
    top: Math.round(bbox.top / scale),
    left: Math.round(bbox.left / scale),
    right: Math.round(bbox.right / scale),
    bottom: Math.round(bbox.bottom / scale),
  };
  const crop = bboxToCrop(origBbox, ow, oh);
  if (crop.maxMargin < MIN_MARGIN_PCT) {
    return { ok: true as const, ow, oh, crop, skip: true as const, reason: "already-tight" };
  }
  if (crop.maxMargin > SKIP_MARGIN_PCT) {
    return { ok: true as const, ow, oh, crop, skip: true as const, reason: "margin-too-large" };
  }
  return { ok: true as const, ow, oh, crop, skip: false as const };
}

function collectUrls(): string[] {
  const urls = new Set<string>();
  const ROOT = process.cwd();
  try {
    const ps = JSON.parse(fs.readFileSync(path.join(ROOT, "products.json"), "utf8"));
    for (const p of ps) {
      if (p.img) urls.add(p.img);
      for (const g of (p.gallery || [])) if (g) urls.add(g);
    }
  } catch {}
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
  return [...urls];
}

function loadCachedKeys(): Set<string> {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data/image-crops.json"), "utf8");
    const j = JSON.parse(raw);
    return new Set(Object.keys(j?.entries || {}));
  } catch {
    return new Set();
  }
}

function normalizeToUrl(s: string): string | null {
  if (!s) return null;
  if (s.startsWith("http")) return s;
  if (/^[a-zA-Z0-9_~.-]+$/.test(s)) return `https://static.wixstatic.com/media/${s}`;
  return null;
}

async function pMap<T, R>(items: T[], fn: (x: T, i: number) => Promise<R>, conc: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await fn(items[idx], idx); }
      catch (e) { results[idx] = { err: (e as Error).message } as R; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, worker));
  return results;
}

async function runDetection(opts: {
  token: string;
  limit: number;
  only: string[];
  explicitUrls: string[];
  skipCached: boolean;
}): Promise<NextResponse> {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || opts.token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let urls: string[];
  if (opts.explicitUrls.length) {
    urls = opts.explicitUrls
      .map((s) => normalizeToUrl(s.trim()))
      .filter((v): v is string => Boolean(v));
  } else {
    urls = collectUrls();
    if (opts.only.length) {
      urls = urls.filter((u) => opts.only.some((k) => u.toLowerCase().includes(k)));
    }
  }

  if (opts.skipCached) {
    const cached = loadCachedKeys();
    urls = urls.filter((u) => {
      const k = wixMediaKey(u);
      return k ? !cached.has(k) : true;
    });
  }

  if (opts.limit > 0) urls = urls.slice(0, opts.limit);

  const entries: Record<string, unknown> = {};
  const skipped: unknown[] = [];
  const failed: unknown[] = [];

  await pMap(urls, async (u) => {
    const key = wixMediaKey(u);
    try {
      const r = await detectOne(u);
      if (!r.ok) { failed.push({ key, err: r.err }); return; }
      if (r.skip) { skipped.push({ key, reason: r.reason, maxMargin: +r.crop.maxMargin.toFixed(2) }); return; }
      entries[key!] = {
        ow: r.ow, oh: r.oh, x: r.crop.x, y: r.crop.y, w: r.crop.w, h: r.crop.h,
        margins: {
          top: +r.crop.margins.top.toFixed(2),
          right: +r.crop.margins.right.toFixed(2),
          bottom: +r.crop.margins.bottom.toFixed(2),
          left: +r.crop.margins.left.toFixed(2),
        },
      };
    } catch (e) {
      failed.push({ key, err: (e as Error).message });
    }
  }, MAX_PARALLEL);

  return NextResponse.json({
    version: 1,
    generatedAt: new Date().toISOString(),
    totalProcessed: urls.length,
    totalEntries: Object.keys(entries).length,
    totalSkipped: skipped.length,
    totalFailed: failed.length,
    skipped,
    failed,
    entries,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || "0") || 0, 1000);
  const only = (url.searchParams.get("only") || "").toLowerCase().split(",").filter(Boolean);
  const explicitUrls = (url.searchParams.get("urls") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const skipCached = ["1", "true", "yes"].includes((url.searchParams.get("skipCached") || "").toLowerCase());
  return runDetection({ token, limit, only, explicitUrls, skipCached });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || "0") || 0, 1000);
  const skipCached = ["1", "true", "yes"].includes((url.searchParams.get("skipCached") || "").toLowerCase());
  let explicitUrls: string[] = [];
  let only: string[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.urls)) explicitUrls = body.urls.filter((s: unknown) => typeof s === "string");
    if (Array.isArray(body?.only)) only = body.only.filter((s: unknown) => typeof s === "string").map((s: string) => s.toLowerCase());
  } catch {}
  if (!explicitUrls.length) {
    explicitUrls = (url.searchParams.get("urls") || "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!only.length) {
    only = (url.searchParams.get("only") || "").toLowerCase().split(",").filter(Boolean);
  }
  return runDetection({ token, limit, only, explicitUrls, skipCached });
}
