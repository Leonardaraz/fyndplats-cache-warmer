// scripts/score-related.mjs
//
// LLM-kurerad "Liknande produkter"-karta. Kör OFFLINE (eller via cache-warmer-cron)
// — INTE i request-pathen. Samma arkitektur som scripts/score-images.mjs:
//   offline-LLM → committad JSON-snapshot → storefronten läser statiskt.
//
// Flödet:
//   1. Lista alla synliga produkter via Wix Headless OAuth (samma publika klient som
//      lib/products.ts) — namn, pris, kategorier, lagerstatus. Hämta kategorinamn.
//   2. För varje produkt: bygg en kandidatmängd (produkter som delar minst en
//      kategori, i lager), förrankad på delade kategorier + prisnärhet. Låt Claude
//      Opus 4.8 välja 4–6 som en BUTIKS-MERCHANDISER: komplement + prispassning +
//      samma användningsområde, inte bara samma-kategori-kopior.
//   3. Skriv data/related-products.json (committad snapshot — DET storefronten läser).
//   4. Respektera budget-cap (RELATED_BUDGET_USD, default $12) — avbryt innan capen.
//
// Storefronten (app/produkt/[slug]/page.tsx) läser kartan via lib/related-products.ts
// och FALLER TILLBAKA på kategori-överlapp när en produkt saknas i kartan (t.ex.
// innan detta skript körts) → blocket blir aldrig tomt, inget kan gå sönder.
//
// Användning:
//   node scripts/score-related.mjs               # full körning (~417 produkter)
//   node scripts/score-related.mjs --limit 20    # bara första 20 (test)
//   node scripts/score-related.mjs --probe       # 15 produkter, dry (skriver inte), full logg
//
// Miljövariabler:
//   ANTHROPIC_API_KEY        (krävs)
//   RELATED_BUDGET_USD       budget-cap i USD (default 12)
//   RELATED_EFFORT           low|medium|high (default medium)
//   CLAUDE_RELATED_MODEL     modell-id (default claude-opus-4-8)
//   RELATED_CONCURRENCY      parallella anrop (default 6)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts } from "@wix/stores";
import { categories as wixCategories } from "@wix/categories";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// --- minimal .env.local loader (ingen dotenv-dep) — samma som score-images ------
function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* prod: env kommer från Vercel */ }
}
loadEnv();

const args = process.argv.slice(2);
const PROBE = args.includes("--probe");
const LIMIT = PROBE ? 15 : (() => {
  const i = args.indexOf("--limit");
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity;
})();

const CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153"; // headless OAuth (publik, ej hemlig)
const MODEL = process.env.CLAUDE_RELATED_MODEL || "claude-opus-4-8";
const EFFORT = process.env.RELATED_EFFORT || "medium";
const BUDGET = parseFloat(process.env.RELATED_BUDGET_USD || "12");
const CONCURRENCY = Math.max(1, parseInt(process.env.RELATED_CONCURRENCY || "6", 10));
const MAX_CANDIDATES = 32; // token-tak per anrop
const MIN_CANDIDATES = 3;  // färre än så → hoppa (kategori-fallback räcker)

// Opus 4.8-prissättning (USD per 1M tokens). Säkerhetsnät — capen stoppar körningen.
const PRICE_IN = 5.0;
const PRICE_OUT = 25.0;

// --- produktlista + kategorinamn via publik OAuth --------------------------------
async function loadCatalog() {
  const wix = createClient({
    modules: { products: wixProducts, categories: wixCategories },
    auth: OAuthStrategy({ clientId: CLIENT_ID }),
  });

  // Produkter (paginerat, samma som lib/products.ts).
  const raw = [];
  let skip = 0;
  for (let i = 0; i < 12; i++) {
    const res = await wix.products.queryProducts().limit(100).skip(skip).find();
    const items = res.items || [];
    raw.push(...items);
    if (items.length < 100) break;
    skip += 100;
  }
  const byId = new Map();
  for (const p of raw) {
    if (p.visible === false) continue;
    const id = p._id || p.id;
    if (!id || byId.has(id)) continue;
    const priceNum = (p.price && (p.price.discountedPrice ?? p.price.price)) || 0;
    byId.set(id, {
      id,
      slug: p.slug || "",
      name: p.name || "",
      priceNum,
      price: (p.price && p.price.formatted && (p.price.formatted.discountedPrice || p.price.formatted.price)) || `${priceNum} kr`,
      collectionIds: p.collectionIds || [],
      inStock: !!(p.stock && p.stock.inStock),
    });
  }
  const products = [...byId.values()].filter((p) => p.slug);

  // Kategorinamn (id → namn) för läsbara kategorier i prompten. Fail-open: {}.
  const catName = {};
  try {
    const cres = await wix.categories
      .queryCategories({ treeReference: { appNamespace: "@wix/stores" } })
      .ne("_id", "00000000-0000-0000-0000-000000000000")
      .limit(100)
      .find();
    for (const c of cres.items || []) {
      const id = c._id || c.id;
      if (id && c.name) catName[id] = c.name;
    }
  } catch (e) {
    console.warn("[related] kunde inte hämta kategorinamn:", e.message);
  }
  return { products, catName };
}

const catsOf = (p, catName) =>
  (p.collectionIds || []).map((c) => catName[c]).filter(Boolean).join(", ") || "okänd";

// "All Products"-liknande kategorier sitter på ~alla produkter och bär ingen
// relevanssignal (audit 2026-07: en kategori täckte alla 420 produkter). Hitta dem
// dynamiskt (≥90 % täckning) och räkna dem INTE som "samma kategori" — annars blir
// kandidatmängden utspädd med orelaterade pris-grannar. Speglar universalCollectionIds
// i lib/related-products.ts (samma logik på båda sidor).
function universalIds(all) {
  const count = new Map();
  for (const p of all) for (const c of p.collectionIds || []) count.set(c, (count.get(c) || 0) + 1);
  const threshold = all.length * 0.9;
  const uni = new Set();
  for (const [c, n] of count) if (n >= threshold) uni.add(c);
  return uni;
}

// Kandidatmängd för en produkt: samma MENINGSFULLA kategori, i lager, förrankad på
// antal delade kategorier och därefter prisnärhet. Kapad till MAX_CANDIDATES.
function candidatesFor(p, all, universal) {
  const own = new Set((p.collectionIds || []).filter((c) => !universal.has(c)));
  if (own.size === 0) return [];
  return all
    .filter((x) => x.slug !== p.slug && x.inStock)
    .map((x) => ({ x, shared: (x.collectionIds || []).filter((c) => !universal.has(c) && own.has(c)).length }))
    .filter((r) => r.shared > 0)
    .sort((a, b) =>
      b.shared - a.shared ||
      Math.abs(a.x.priceNum - p.priceNum) - Math.abs(b.x.priceNum - p.priceNum),
    )
    .slice(0, MAX_CANDIDATES)
    .map((r) => r.x);
}

// --- Claude merchandiser ---------------------------------------------------------
const SYSTEM = `You are an expert merchandiser for a Swedish general-goods webshop (Fyndplats).
For a given product, pick the 4-6 BEST "related products" to show at the bottom of its
product page — the block a shopper sees under the main product.

Think like a shop employee arranging a shelf, not a category filter:
- COMPLEMENTS over near-duplicates. For a bike pump, prefer a saddle bag, a multitool,
  gloves — things bought together — over five other pumps. One or two genuine alternatives
  (a different model of the SAME item) is fine, but the set should help the shopper build a
  solution, not just show the same thing again.
- PRICE FIT. Don't pair a cheap item with something many times its price; keep the set in a
  sensible range around the product's price.
- SAME CONTEXT / USE-CASE. Kids' items pair with kids' items; garden with garden; a specific
  brand/series with the rest of that series.
- VARIETY. Never pick several items that are effectively the same product.
- Pick ONLY from the candidate list (all candidates are in stock).

Return ONLY a JSON object — no prose, no markdown fences:
{"picks":[{"slug":"<candidate-slug>","reason":"<=60 chars, Swedish, why it fits"}]}
Order picks best-first. 4-6 picks. Use only slugs that appear in the candidate list.`;

function buildUserText(p, cands, catName) {
  const lines = cands.map(
    (c, i) => `${i + 1}. slug=${c.slug} | ${c.name} | pris: ${c.price} | kategorier: ${catsOf(c, catName)}`,
  );
  return (
    `PRODUCT: ${p.name} | pris: ${p.price} | kategorier: ${catsOf(p, catName)}\n\n` +
    `CANDIDATES (pick 4-6 by slug):\n${lines.join("\n")}\n\n` +
    `Return the JSON object now.`
  );
}

function parseJsonObject(text) {
  const cleaned = text.replace(/```json?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in: " + cleaned.slice(0, 140));
  const body = cleaned.slice(start, end + 1).replace(/,(\s*[\]}])/g, "$1"); // tolerera trailing commas
  return JSON.parse(body);
}

// Opus 4.8: adaptiv thinking + effort. Skickas som body-fält (fungerar även på äldre
// SDK — den JSON-stringifierar params rakt av). Om API:t/SDK:n mot förmodan inte
// accepterar dem droppas de och körningen fortsätter utan (aldrig ett hårt stopp).
let extraParams = { thinking: { type: "adaptive" }, output_config: { effort: EFFORT } };

async function pickFor(anthropic, p, cands, catName) {
  const call = async () =>
    anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserText(p, cands, catName) }],
      ...extraParams,
    });

  let msg;
  try {
    msg = await call();
  } catch (e) {
    if (Object.keys(extraParams).length && /thinking|output_config|effort|unexpected|unknown|invalid|400/i.test(String(e && e.message))) {
      console.warn("[related] thinking/effort ej accepterat av SDK/API — kör vidare utan.");
      extraParams = {};
      msg = await call();
    } else {
      throw e;
    }
  }

  const usage = msg.usage || { input_tokens: 0, output_tokens: 0 };
  const cost = (usage.input_tokens * PRICE_IN + usage.output_tokens * PRICE_OUT) / 1_000_000;
  const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = parseJsonObject(text);
  const valid = new Set(cands.map((c) => c.slug));
  const seen = new Set();
  const picks = [];
  for (const it of parsed.picks || []) {
    const slug = String(it && it.slug || "");
    if (!slug || !valid.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    picks.push({ slug, reason: String((it && it.reason) || "").slice(0, 80) });
    if (picks.length >= 6) break;
  }
  return { picks, cost, usage };
}

// --- main ------------------------------------------------------------------------
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY saknas."); process.exit(1); }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(`[related] model=${MODEL} effort=${EFFORT} budget=$${BUDGET} concurrency=${CONCURRENCY}${PROBE ? " PROBE" : ""}`);
  console.log("[related] laddar katalog…");
  const { products, catName } = await loadCatalog();
  const universal = universalIds(products);
  console.log(`[related] ${products.length} synliga produkter, ${Object.keys(catName).length} kategorier, ${universal.size} universell(a) kategori(er) exkluderad(e)`);

  let queue = products;
  if (LIMIT !== Infinity) queue = queue.slice(0, LIMIT);

  const out = {};        // slug → [slug,...]
  let spent = 0, calls = 0, skipped = 0, inTok = 0, outTok = 0, done = 0;
  let stop = false;

  // Enkel concurrency-pool i chunkar; budget-cap kontrolleras mellan chunkar.
  for (let i = 0; i < queue.length && !stop; i += CONCURRENCY) {
    if (spent >= BUDGET) { console.warn(`[related] BUDGET-CAP $${BUDGET} nådd vid ${i}/${queue.length} — avbryter`); break; }
    const chunk = queue.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(async (p) => {
      const cands = candidatesFor(p, products, universal);
      if (cands.length < MIN_CANDIDATES) return { p, skip: true };
      try {
        const r = await pickFor(anthropic, p, cands, catName);
        return { p, ...r };
      } catch (e) {
        return { p, error: e.message };
      }
    }));
    for (const r of results) {
      done++;
      if (r.skip) { skipped++; continue; }
      if (r.error) { console.error(`[related] ${r.p.slug}: ${r.error}`); continue; }
      spent += r.cost; calls++; inTok += r.usage.input_tokens; outTok += r.usage.output_tokens;
      if (r.picks.length >= 2) out[r.p.slug] = r.picks.map((x) => x.slug);
      if (PROBE) {
        console.log(`\n▸ ${r.p.name}  (${r.p.price})`);
        for (const x of r.picks) console.log(`    → ${x.slug.padEnd(52)}  ${x.reason}`);
      }
    }
    console.log(`[related] ${Math.min(i + CONCURRENCY, queue.length)}/${queue.length}  kurerade=${Object.keys(out).length} hoppade=${skipped}  ($${spent.toFixed(3)})`);
  }

  const file = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    effort: EFFORT,
    count: Object.keys(out).length,
    related: out,
  };
  if (!PROBE) {
    writeFileSync(join(ROOT, "data", "related-products.json"), JSON.stringify(file, null, 2) + "\n");
    console.log(`\n[related] skrev data/related-products.json (${file.count} produkter)`);
  } else {
    console.log(`\n[related] PROBE — skrev INTE fil. ${file.count} skulle kurerats.`);
  }

  console.log("\n========== SAMMANFATTNING ==========");
  console.log(`Produkter processade : ${done}`);
  console.log(`Kurerade (≥2 picks)  : ${Object.keys(out).length}`);
  console.log(`Hoppade (för få kand): ${skipped}`);
  console.log(`Anrop                : ${calls}  (in:${inTok} ut:${outTok} tokens)`);
  console.log(`Kostnad              : $${spent.toFixed(3)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
