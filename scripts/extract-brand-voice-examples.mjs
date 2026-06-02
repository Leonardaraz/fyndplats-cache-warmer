#!/usr/bin/env node
// Extraherar Leonards bäst polerade Wix-produkter och skriver dem som
// few-shot-guldexempel till lib/claude/brand-voice-examples.json (premium-läget).
//
// Kör:  WIX_API_TOKEN=... WIX_SITE_ID=... node scripts/extract-brand-voice-examples.mjs [antal]
//   antal = hur många exempel som ska sparas (default 10).
//
// Heuristik för "polerad": synlig produkt, fyllig HTML-beskrivning (<p> + <ul>),
// gärna en "Vanliga frågor"-flik. De rikaste väljs. Inga AI-anrop — ren extraktion.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const WIX_BASE = "https://www.wixapis.com";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib/claude/brand-voice-examples.json");

const token = process.env.WIX_API_TOKEN;
const siteId = process.env.WIX_SITE_ID;
const want = Math.max(1, Number(process.argv[2]) || 10);

if (!token) {
  console.error("Saknar WIX_API_TOKEN i miljön. Avbryter.");
  process.exit(1);
}

function headers() {
  const h = { Authorization: token, "Content-Type": "application/json" };
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

/** Hämtar alla produkter (id + namn + synlighet) via paginerad query. */
async function listProducts() {
  const out = [];
  let cursor = null;
  for (let page = 0; page < 20; page++) {
    const body = {
      query: {
        cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) },
      },
    };
    const res = await fetch(`${WIX_BASE}/stores/v3/products/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`products/query ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const products = json.products || [];
    out.push(...products);
    cursor = json.pagingMetadata?.cursors?.next || null;
    if (!cursor || products.length === 0) break;
  }
  return out;
}

/** Hämtar en produkts plainDescription + SEO. */
async function getProductDetail(id) {
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(id)}?fields=PLAIN_DESCRIPTION`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.product || null;
}

/** Plockar ut "Vanliga frågor"-blocket ur beskrivnings-HTML → [{q,a}]. */
function parseFaq(html) {
  if (!html) return [];
  const m = html.match(/<h2[^>]*>\s*(?:Vanliga\s+fr[åa]gor|Ofta\s+st[äa]llda\s+fr[åa]gor)\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!m) return [];
  const block = m[1];
  const faqs = [];
  const re = /<p>\s*<strong>(.*?)<\/strong>\s*(?:<br\s*\/?>)?\s*([\s\S]*?)<\/p>/gi;
  let mm;
  while ((mm = re.exec(block)) && faqs.length < 7) {
    const q = strip(mm[1]);
    const a = strip(mm[2]);
    if (q && a) faqs.push({ q, a });
  }
  return faqs;
}

/** Beskrivnings-HTML utan flik-<h2>-blocken (bara huvudbeskrivningen). */
function mainDescription(html) {
  if (!html) return "";
  const idx = html.search(/<h2/i);
  return (idx >= 0 ? html.slice(0, idx) : html).trim();
}

function strip(s) {
  return String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Hur "polerad" en produkt ser ut — högre = bättre guldexempel. */
function richness(html) {
  if (!html) return 0;
  const main = mainDescription(html);
  const liCount = (main.match(/<li>/gi) || []).length;
  const pCount = (main.match(/<p>/gi) || []).length;
  const hasFaq = /Vanliga\s+fr[åa]gor/i.test(html) ? 1 : 0;
  return main.length + liCount * 40 + pCount * 20 + hasFaq * 100;
}

async function main() {
  console.log("Hämtar produktlista från Wix…");
  const products = await listProducts();
  const visible = products.filter((p) => p.visible !== false);
  console.log(`${products.length} produkter (${visible.length} synliga). Hämtar beskrivningar…`);

  const detailed = [];
  for (const p of visible) {
    const d = await getProductDetail(p.id);
    const html = d?.plainDescription || d?.description || "";
    if (!html) continue;
    detailed.push({ product: d, html, score: richness(html) });
    if (detailed.length >= 80) break; // räcker för urval
  }

  detailed.sort((a, b) => b.score - a.score);
  const chosen = detailed.slice(0, want);
  if (chosen.length === 0) {
    console.error("Hittade inga produkter med fyllig beskrivning. Inget skrevs.");
    process.exit(1);
  }

  const examples = chosen.map(({ product, html }) => ({
    productType: product.name,
    category: (product.allCategoriesInfo?.categories?.[0]?.id) ? undefined : undefined, // namn ej alltid med
    title: product.name,
    metaDescription: product.seoData?.tags?.find((t) => t.type === "meta" && t.props?.name === "description")?.props?.content || undefined,
    descriptionHtml: mainDescription(html),
    faq: parseFaq(html),
  }));

  const payload = {
    _note: "Auto-extraherade guldexempel från Leonards bäst polerade Wix-produkter (scripts/extract-brand-voice-examples.mjs). Redigera fritt — premium-läget läser detta som few-shot-exempel.",
    version: 1,
    source: "wix-extracted",
    extractedCount: examples.length,
    examples,
  };
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`✓ Skrev ${examples.length} guldexempel till ${OUT}`);
  console.log("Exempel:", examples.map((e) => e.title).join(" · "));
}

main().catch((err) => {
  console.error("Fel:", err.message);
  process.exit(1);
});
