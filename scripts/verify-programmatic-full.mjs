// Bred verifiering: hämtar ALLA programmatiska URL:er, kollar global unikhet på
// h1/title/description, >=250 ord i <main>, och strukturell JSON-LD-validering
// (ItemList / FAQPage / BreadcrumbList har sina obligatoriska fält) — OCH att varje
// rekommenderad produkt faktiskt hör hemma i sidans kategori (relevanskontrollen).
import typesJson from "../lib/seo/programmatic-types.json" with { type: "json" };
import interestsJson from "../lib/seo/programmatic-interests.json" with { type: "json" };

const BASE = process.argv[2] || "http://localhost:3210";
// Matchar generatorns MIN_BODY_WORDS (lib/seo/programmatic.ts), som räknar
// main-innehåll (intro + FAQ + produkttext).
const MIN_WORDS = 250;
const tag = (h, re) => { const m = h.match(re); return m ? m[1].replace(/\s+/g, " ").trim() : ""; };
// Räkna ENBART ord i <main> — nav/footer ska aldrig inflatera ordantalet och
// dölja en tunn sida (det var precis så en 198-ords-sida slank igenom).
const mainHtml = (h) => { const m = h.match(/<main[^>]*>([\s\S]*?)<\/main>/i); return m ? m[1] : h; };
const words = (h) => mainHtml(h).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
function schemas(h) {
  const out = []; const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(h))) { try { const j = JSON.parse(m[1]); (Array.isArray(j) ? j : [j]).forEach((o) => out.push(o)); } catch { out.push({ "@type": "INVALID" }); } }
  return out;
}
function validateSchemas(ss, pattern) {
  const byType = Object.fromEntries(ss.map((s) => [s["@type"], s]));
  const errs = [];
  const bc = byType.BreadcrumbList;
  if (!bc || !Array.isArray(bc.itemListElement) || bc.itemListElement.length < 2) errs.push("BreadcrumbList saknas/för kort");
  const il = byType.ItemList;
  if (!il || !Array.isArray(il.itemListElement) || il.itemListElement.length < 3) errs.push("ItemList saknas/<3");
  else { const f = il.itemListElement[0]; if (!f.position || !f.item || f.item["@type"] !== "Product" || !f.item.offers) errs.push("ItemList-element saknar position/Product/offers"); }
  if (pattern !== "under-kr") { const fq = byType.FAQPage; if ((pattern === "basta-i-test") && (!fq || !Array.isArray(fq.mainEntity) || fq.mainEntity.length < 4 || !fq.mainEntity[0].acceptedAnswer)) errs.push("FAQPage saknas/ogiltig"); }
  // #239 bytte AboutPage → CollectionPage (sidan ÄR en produktlista). Kontrollen
  // hängde inte med och har rödflaggat varje intressesida sedan dess.
  if (pattern === "for-dig-som" && !byType.CollectionPage) errs.push("CollectionPage saknas");
  if (byType.INVALID) errs.push("Ogiltig JSON-LD");
  return errs;
}
const patternOf = (u) => u.includes("/basta-i-test/") ? "basta-i-test" : /\/under-\d+-kr\//.test(u) ? "under-kr" : "for-dig-som";

// ── RELEVANSKONTROLL ────────────────────────────────────────────────────────
// De fyra kontrollerna ovan är tekniska: status, ordantal, unikhet, schema. En
// sida som rekommenderade ett paviljongtak under rubriken "kaffetillbehör"
// passerade samtliga med beröm. Den här kontrollen frågar det ingen annan gör:
// HÖR PRODUKTERNA HEMMA PÅ SIDAN? Varje rekommenderad produkt måste ligga i en
// av sidans konfigurerade kategorier, eller stå i dess productSlugs-plocklista.

const CONFIG = new Map();
for (const t of typesJson.types) CONFIG.set(`/basta-i-test/${t.slug}`, { names: [t.category], allow: t.productSlugs || [] });
for (const i of interestsJson.interests) CONFIG.set(`/for-dig-som/${i.slug}`, { names: i.categories, allow: i.productSlugs || [] });

const productSlugs = (html) => [...new Set([...mainHtml(html).matchAll(/href="\/produkt\/([a-z0-9-]+)"/g)].map((m) => m[1]))];

// Kategorinamn → slug, läst ur kategorisidornas egna H1. Nav och footer länkar
// till var och varannan kategori, så sidans råa HTML duger inte som källa.
let catIndex = null;
async function categoryIndex() {
  if (catIndex) return catIndex;
  catIndex = new Map();
  const urls = [...sm.matchAll(/<loc>([^<]+\/kategori\/[a-z0-9-]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE));
  for (const u of urls) {
    const html = await (await fetch(u)).text();
    const name = tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/&amp;/g, "&");
    if (name) catIndex.set(name, productSlugs(html));
  }
  return catIndex;
}

async function checkRelevance(u, html) {
  const path = new URL(u).pathname;
  const cfg = CONFIG.get(path);
  if (!cfg || !cfg.names.length) return [];
  const index = await categoryIndex();
  const missingCats = cfg.names.filter((n) => !index.has(n));
  if (missingCats.length === cfg.names.length) return [`ingen av kategorierna finns: ${cfg.names.join(", ")}`];
  // Delvis okänt namn är farligast av allt: sidan byggs ändå, men ur en tystare
  // och smalare pool än konfigurationen säger. Namnet måste matcha EXAKT.
  const errs = missingCats.map((n) => `okänt kategorinamn «${n}» — stavas det exakt som i Wix?`);
  const allowed = new Set(cfg.allow);
  for (const n of cfg.names) for (const s of index.get(n) || []) allowed.add(s);
  const strays = productSlugs(html).filter((s) => !allowed.has(s));
  if (strays.length) errs.push(`utanför kategorin (${cfg.names.join(", ")}): ${strays.join(", ")}`);
  return errs;
}

const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
const all = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE)).filter((u) => /\/basta-i-test\/|\/under-\d+-kr\/|\/for-dig-som\//.test(u));
console.log(`Hämtar ${all.length} programmatiska sidor...`);

const h1s = new Map(), titles = new Map(), descs = new Map();
let ok200 = 0, thin = 0, schemaFail = 0, irrelevant = 0;
const dups = [];
for (const u of all) {
  const res = await fetch(u); const html = await res.text();
  if (res.status === 200) ok200++; else { dups.push(`${res.status} ${u}`); continue; }
  const h1 = tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), title = tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i), desc = tag(html, /<meta name="description" content="([^"]*)"/i);
  const w = words(html); if (w < MIN_WORDS) { thin++; dups.push(`THIN ${w}w ${u}`); }
  for (const [map, val, lbl] of [[h1s, h1, "h1"], [titles, title, "title"], [descs, desc, "desc"]]) {
    if (map.has(val)) dups.push(`DUP ${lbl}: "${val.slice(0, 50)}" @ ${u} & ${map.get(val)}`);
    else map.set(val, u);
  }
  const se = validateSchemas(schemas(html), patternOf(u));
  if (se.length) { schemaFail++; dups.push(`SCHEMA ${u}: ${se.join("; ")}`); }
  const re_ = await checkRelevance(u, html);
  if (re_.length) { irrelevant++; dups.push(`RELEVANS ${u}: ${re_.join("; ")}`); }
}
console.log(`200 OK: ${ok200}/${all.length}`);
console.log(`Unika h1: ${h1s.size}, titlar: ${titles.size}, descriptions: ${descs.size}`);
console.log(`Tunna sidor (<${MIN_WORDS} ord i <main>): ${thin}`);
console.log(`Schema-fel: ${schemaFail}`);
console.log(`Sidor med produkter utanför sin kategori: ${irrelevant}`);
if (dups.length) { console.log(`\nPROBLEM (${dups.length}):`); dups.slice(0, 20).forEach((d) => console.log("  - " + d)); process.exit(1); }
console.log("\nALLT GRÖNT: 200, globalt unika h1/title/desc, inga tunna sidor, alla scheman giltiga,\nvarje rekommenderad produkt hör hemma i sin kategori ✅");
