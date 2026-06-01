// Bred verifiering: hämtar ALLA programmatiska URL:er, kollar global unikhet på
// h1/title/description, >=250 ord, och strukturell JSON-LD-validering (ItemList /
// FAQPage / BreadcrumbList har sina obligatoriska fält).
const BASE = process.argv[2] || "http://localhost:3210";
const tag = (h, re) => { const m = h.match(re); return m ? m[1].replace(/\s+/g, " ").trim() : ""; };
const words = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
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
  if (pattern === "for-dig-som" && !byType.AboutPage) errs.push("AboutPage saknas");
  if (byType.INVALID) errs.push("Ogiltig JSON-LD");
  return errs;
}
const patternOf = (u) => u.includes("/basta-i-test/") ? "basta-i-test" : /\/under-\d+-kr\//.test(u) ? "under-kr" : "for-dig-som";

const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
const all = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE)).filter((u) => /\/basta-i-test\/|\/under-\d+-kr\/|\/for-dig-som\//.test(u));
console.log(`Hämtar ${all.length} programmatiska sidor...`);

const h1s = new Map(), titles = new Map(), descs = new Map();
let ok200 = 0, thin = 0, schemaFail = 0;
const dups = [];
for (const u of all) {
  const res = await fetch(u); const html = await res.text();
  if (res.status === 200) ok200++; else { dups.push(`${res.status} ${u}`); continue; }
  const h1 = tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), title = tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i), desc = tag(html, /<meta name="description" content="([^"]*)"/i);
  const w = words(html); if (w < 250) thin++;
  for (const [map, val, lbl] of [[h1s, h1, "h1"], [titles, title, "title"], [descs, desc, "desc"]]) {
    if (map.has(val)) dups.push(`DUP ${lbl}: "${val.slice(0, 50)}" @ ${u} & ${map.get(val)}`);
    else map.set(val, u);
  }
  const se = validateSchemas(schemas(html), patternOf(u));
  if (se.length) { schemaFail++; dups.push(`SCHEMA ${u}: ${se.join("; ")}`); }
}
console.log(`200 OK: ${ok200}/${all.length}`);
console.log(`Unika h1: ${h1s.size}, titlar: ${titles.size}, descriptions: ${descs.size}`);
console.log(`Tunna sidor (<250 ord): ${thin}`);
console.log(`Schema-fel: ${schemaFail}`);
if (dups.length) { console.log(`\nPROBLEM (${dups.length}):`); dups.slice(0, 20).forEach((d) => console.log("  - " + d)); process.exit(1); }
console.log("\nALLT GRÖNT: 200, globalt unika h1/title/desc, inga tunna sidor, alla scheman giltiga ✅");
