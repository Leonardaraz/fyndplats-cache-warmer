// scripts/score-images.mjs
//
// Bildkvalitets-scoring för butikens produktbilder. Kör offline (eller via
// cache-warmer-cron) — INTE i request-pathen. Flödet:
//
//   1. Lista alla synliga produkter via Wix Headless OAuth (samma klient som
//      lib/products.ts — ingen admin-token behövs för att läsa katalogen).
//   2. Poängsätt varje produkts HUVUDBILD 0–100 med Claude Haiku 4.5 vision,
//      5 bilder per anrop (token-budget). Returnerar flaggor + kort motivering.
//   3. Skriv resultatet till:
//        a) data/image-scores.json  (committad snapshot — DET storefronten läser)
//        b) Wix Data-collection FyndplatsImageScores (källa/persistens, best-effort)
//   4. Respektera ANTHROPIC_DAILY_BUDGET_USD — avbryt innan capen överskrids.
//
// Flaggor (kontrollerad vokabulär, mappas till svenska i /admin/image-issues):
//   watermark, badge, chinese_text, baked_text, typo, collage,
//   busy_background, blurry, amateur
//
// Användning:
//   node scripts/score-images.mjs              # full körning (207 produkter)
//   node scripts/score-images.mjs --limit 10   # bara första 10 (test)
//   node scripts/score-images.mjs --no-wix     # hoppa över Wix Data-skrivning
//   node scripts/score-images.mjs --probe      # 2 produkter, dry, full loggning

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts } from "@wix/stores";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// --- minimal .env.local loader (ingen dotenv-dep) ---------------------------
function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      // .env.local vinner över tomma shell-exports (harness sätter ANTHROPIC_API_KEY="").
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* prod: env kommer från Vercel */ }
}
loadEnv();

const args = process.argv.slice(2);
const PROBE = args.includes("--probe");
const NO_WIX = args.includes("--no-wix") || PROBE;
const LIMIT = PROBE ? 2 : (() => {
  const i = args.indexOf("--limit");
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity;
})();

const CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153"; // headless OAuth (publik, ej hemlig)
const VISION_MODEL = process.env.CLAUDE_VISION_MODEL || "claude-haiku-4-5-20251001";
const BUDGET = parseFloat(process.env.ANTHROPIC_DAILY_BUDGET_USD || "2");
const BATCH = 5;
const COL = "FyndplatsImageScores";
const WIX_BASE = "https://www.wixapis.com";

// Haiku 4.5 prissättning (USD per 1M tokens). Säkerhetsnät — capen stoppar
// körningen långt innan detta blir dyrt.
const PRICE_IN = 1.0;
const PRICE_OUT = 5.0;

// --- bildoptimering ---------------------------------------------------------
// wixstatic-URL:er bär en transform-token (/v1/fit/w_800,h_800,...). Krymp till
// 384px → ~4x färre bild-tokens utan att tappa det vi bedömer (text/badge/skärpa).
function smallImage(url) {
  if (!url) return url;
  return url.replace(/\/v1\/(fit|fill|crop)\/[^/]+\//, "/v1/fit/w_384,h_384,al_c,q_80,enc_auto/");
}

// --- Wix Data REST (best-effort persistens) ---------------------------------
function wixHeaders() {
  const token = process.env.WIX_API_KEY || process.env.WIX_API_TOKEN;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

async function ensureCollection(h) {
  // Skapa collectionen om den saknas. Wix auto-skapar INTE vid insert.
  const body = {
    collection: {
      id: COL,
      displayName: "Fyndplats Image Scores",
      fields: [
        { key: "productId", displayName: "Product ID", type: "TEXT" },
        { key: "slug", displayName: "Slug", type: "TEXT" },
        { key: "name", displayName: "Name", type: "TEXT" },
        { key: "mainImageScore", displayName: "Main Image Score", type: "NUMBER" },
        { key: "allImageScores", displayName: "All Image Scores", type: "ARRAY" },
        { key: "flags", displayName: "Flags", type: "ARRAY" },
        { key: "reason", displayName: "Reason", type: "TEXT" },
        { key: "hidden", displayName: "Hidden From Featured", type: "BOOLEAN" },
        { key: "analyzedAt", displayName: "Analyzed At", type: "TEXT" },
      ],
      permissions: { insert: "ADMIN", update: "ADMIN", remove: "ADMIN", read: "ANYONE" },
    },
  };
  const res = await fetch(`${WIX_BASE}/wix-data/v2/collections`, {
    method: "POST", headers: h, body: JSON.stringify(body),
  });
  if (res.ok) return { created: true };
  const text = await res.text();
  if (res.status === 409 || /already exists|WDE0074|DUPLICATE/i.test(text)) return { created: false, existed: true };
  return { created: false, error: `${res.status}: ${text.slice(0, 200)}` };
}

async function upsertScore(h, rec) {
  // Bevara ett ev. redan satt hidden-värde (merchant kan ha togglat i admin).
  let hidden = false;
  try {
    const g = await fetch(
      `${WIX_BASE}/data/v2/items/${encodeURIComponent(rec.productId)}?dataCollectionId=${COL}`,
      { method: "GET", headers: h },
    );
    if (g.ok) { const b = await g.json(); hidden = Boolean(b?.dataItem?.data?.hidden); }
  } catch { /* ny rad */ }
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST", headers: h,
    body: JSON.stringify({
      dataCollectionId: COL,
      dataItem: { id: rec.productId, dataCollectionId: COL, data: { _id: rec.productId, ...rec, hidden } },
    }),
  });
  if (!res.ok) throw new Error(`save ${rec.productId}: ${res.status} ${(await res.text()).slice(0, 160)}`);
}

// --- produktlista via OAuth --------------------------------------------------
async function listProducts() {
  const wix = createClient({
    modules: { products: wixProducts },
    auth: OAuthStrategy({ clientId: CLIENT_ID }),
  });
  const all = [];
  let skip = 0;
  for (let i = 0; i < 10; i++) {
    const res = await wix.products.queryProducts().limit(100).skip(skip).find();
    const items = res.items || [];
    all.push(...items);
    if (items.length < 100) break;
    skip += 100;
  }
  const byId = new Map();
  for (const p of all) {
    if (p.visible === false) continue;
    const img = p?.media?.mainMedia?.image?.url || p?.media?.items?.[0]?.image?.url || "";
    const id = p._id || p.id;
    if (!id || !img || byId.has(id)) continue;
    const gallery = (p?.media?.items || []).map((it) => it?.image?.url).filter(Boolean);
    byId.set(id, { id, name: p.name || "", slug: p.slug || "", img, gallery });
  }
  return [...byId.values()];
}

// --- Claude vision -----------------------------------------------------------
const SYSTEM = `You are a strict e-commerce image QA reviewer for a Swedish webshop.
Score each product HERO image 0-100 for use as prime store placement.

Scoring rubric (start at 100, subtract):
- Background not clean white/transparent (busy/cluttered): -15 to -35
- Any baked-in text, watermark, supplier badge, price/measurement overlay: -20 to -45
- Chinese (or other non-Swedish) text visible in the image: -25 to -45
- Visible typo in on-image text (e.g. "Silent Cack"): -30
- Blurry / pixelated / poor lighting: -15 to -35
- Collage / multiple unrelated products in one frame: -25 to -45
- Amateur snapshot vs professional product photography: -10 to -25

A clean, sharp, single-product photo on white = 90-100.

Use ONLY these flag tokens (omit if none apply):
watermark, badge, chinese_text, baked_text, typo, collage, busy_background, blurry, amateur

Return ONLY a JSON array, one object per image in the order given:
[{"i":0,"score":<0-100 int>,"flags":["..."],"reason":"<=70 chars English"}]
No prose, no markdown fences.`;

function parseJsonArray(text) {
  const cleaned = text.replace(/```json?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no JSON array in: " + cleaned.slice(0, 120));
  // Tolerera trailing commas (Haiku producerar ibland `…},]`).
  const body = cleaned.slice(start, end + 1).replace(/,(\s*[\]}])/g, "$1");
  return JSON.parse(body);
}

async function scoreBatch(anthropic, batch) {
  const content = [];
  batch.forEach((p, idx) => {
    content.push({ type: "text", text: `Image ${idx} — product: ${p.name}` });
    content.push({ type: "image", source: { type: "url", url: smallImage(p.img) } });
  });
  content.push({ type: "text", text: `Score all ${batch.length} images. Return the JSON array now.` });

  const msg = await anthropic.messages.create({
    model: VISION_MODEL,
    max_tokens: 500,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  const usage = msg.usage || { input_tokens: 0, output_tokens: 0 };
  const cost = (usage.input_tokens * PRICE_IN + usage.output_tokens * PRICE_OUT) / 1_000_000;
  const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  let parsed;
  try { parsed = parseJsonArray(text); }
  catch (e) {
    if (PROBE) console.error("RAW:", text);
    throw e;
  }
  const byI = new Map(parsed.map((r) => [r.i, r]));
  const results = batch.map((p, idx) => {
    const r = byI.get(idx) || {};
    const score = Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)));
    return {
      productId: p.id, slug: p.slug, name: p.name,
      mainImageScore: score,
      allImageScores: [score],
      flags: Array.isArray(r.flags) ? r.flags : [],
      reason: String(r.reason || "").slice(0, 120),
    };
  });
  return { results, cost, usage };
}

// --- main --------------------------------------------------------------------
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY saknas."); process.exit(1); }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(`[score] model=${VISION_MODEL} budget=$${BUDGET} batch=${BATCH}${PROBE ? " PROBE" : ""}`);
  console.log("[score] listar produkter…");
  let products = await listProducts();
  console.log(`[score] ${products.length} produkter med huvudbild`);
  if (LIMIT !== Infinity) products = products.slice(0, LIMIT);

  let h = NO_WIX ? null : wixHeaders();
  if (h) {
    const c = await ensureCollection(h);
    console.log(`[score] collection ${COL}: ${c.created ? "skapad" : c.existed ? "fanns redan" : "fel — " + c.error}`);
    if (c.error) { console.warn("[score] hoppar över rad-skrivning till Wix Data (collection-fel)"); h = null; }
  } else if (!NO_WIX) {
    console.log("[score] Wix Data-skrivning hoppas över (saknar WIX_API_KEY/WIX_SITE_ID)");
  }

  const out = [];
  let spent = 0, calls = 0, inTok = 0, outTok = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    if (spent >= BUDGET) { console.warn(`[score] BUDGET-CAP $${BUDGET} nådd vid ${i}/${products.length} — avbryter`); break; }
    let res;
    try {
      res = await scoreBatch(anthropic, batch);
    } catch (e) {
      console.error(`[score] batch ${i} fel: ${e.message} — failar open (score 60)`);
      res = { results: batch.map((p) => ({ productId: p.id, slug: p.slug, name: p.name, mainImageScore: 60, allImageScores: [60], flags: [], reason: "scoring-fel" })), cost: 0, usage: { input_tokens: 0, output_tokens: 0 } };
    }
    spent += res.cost; calls++; inTok += res.usage.input_tokens; outTok += res.usage.output_tokens;
    const now = new Date().toISOString();
    for (const r of res.results) {
      r.analyzedAt = now;
      out.push(r);
      if (PROBE) console.log(`  ${r.mainImageScore}  ${r.flags.join(",").padEnd(24)}  ${r.name.slice(0, 40)}  — ${r.reason}`);
      if (h) { try { await upsertScore(h, r); } catch (e) { console.error("  wix save fail:", e.message); } }
    }
    console.log(`[score] ${Math.min(i + BATCH, products.length)}/${products.length}  ($${spent.toFixed(4)})`);
  }

  // Skriv committad snapshot — storefrontens läskälla.
  const file = {
    generatedAt: new Date().toISOString(),
    model: VISION_MODEL,
    count: out.length,
    scores: Object.fromEntries(out.map((r) => [r.productId, {
      slug: r.slug, name: r.name, mainImageScore: r.mainImageScore,
      allImageScores: r.allImageScores, flags: r.flags, reason: r.reason, analyzedAt: r.analyzedAt,
    }])),
  };
  if (!PROBE) {
    writeFileSync(join(ROOT, "data", "image-scores.json"), JSON.stringify(file, null, 2));
    console.log(`[score] skrev data/image-scores.json (${out.length} produkter)`);
  }

  // Distribution
  const hi = out.filter((r) => r.mainImageScore > 75).length;
  const mid = out.filter((r) => r.mainImageScore >= 50 && r.mainImageScore <= 75).length;
  const lo = out.filter((r) => r.mainImageScore < 50).length;
  console.log("\n========== SAMMANFATTNING ==========");
  console.log(`Produkter poängsatta : ${out.length}`);
  console.log(`>75 (topp)           : ${hi}`);
  console.log(`50–75 (ok)           : ${mid}`);
  console.log(`<50 (problem)        : ${lo}`);
  console.log(`Anrop                : ${calls}  (in:${inTok} ut:${outTok} tokens)`);
  console.log(`Kostnad              : $${spent.toFixed(4)}`);
  console.log("\nLägsta 5:");
  [...out].sort((a, b) => a.mainImageScore - b.mainImageScore).slice(0, 5)
    .forEach((r) => console.log(`  ${String(r.mainImageScore).padStart(3)}  ${r.flags.join(",").padEnd(28)}  ${r.name}`));
  console.log("\nHögsta 5:");
  [...out].sort((a, b) => b.mainImageScore - a.mainImageScore).slice(0, 5)
    .forEach((r) => console.log(`  ${String(r.mainImageScore).padStart(3)}  ${r.name}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
