// scripts/verify-programmatic.mjs
// Verifierar det programmatiska SEO-ramverket mot en körande server.
//   node scripts/verify-programmatic.mjs [baseUrl]
// Kollar: sitemap innehåller programmatiska URL:er, ett urval sidor svarar 200
// med UNIK h1 + meta-description, >= 250 synliga ord i <main>, och giltig JSON-LD
// (ItemList/FAQPage/BreadcrumbList där det förväntas).
const BASE = process.argv[2] || "http://localhost:3210";
// Matchar generatorns MIN_BODY_WORDS (lib/seo/programmatic.ts) — den räknar
// main-innehåll (intro + FAQ + produkttext), så verifieraren måste använda samma
// tröskel mot <main>, annars underkänns generator-giltiga sidor felaktigt.
const MIN_WORDS = 250;

function tag(html, re) {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}
function visibleWords(html) {
  // Bara <main> — nav/footer ska inte räknas mot thin-content-tröskeln.
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body = (mainMatch ? mainMatch[1] : html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ");
  return body.trim().split(/\s+/).filter(Boolean).length;
}
function jsonLdTypes(html) {
  const types = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) if (o && o["@type"]) types.push(o["@type"]);
    } catch {
      types.push("INVALID_JSON");
    }
  }
  return types;
}

async function main() {
  // 1. Sitemap
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // Sitemap-loc är absoluta prod-URL:er; mappa om till den server vi testar.
  const toLocal = (u) => u.replace(/^https?:\/\/[^/]+/, BASE);
  const prog = locs.filter((u) => /\/basta-i-test\/|\/under-\d+-kr\/|\/for-dig-som\//.test(u)).map(toLocal);
  console.log(`Sitemap: ${locs.length} URL totalt, varav ${prog.length} programmatiska`);
  if (prog.length < 50) throw new Error(`FAIL: < 50 programmatiska URL i sitemap (${prog.length})`);

  // 2. Urval: 2 per mönster + några fler = stickprov
  const byPattern = {
    "basta-i-test": prog.filter((u) => u.includes("/basta-i-test/")),
    "under-kr": prog.filter((u) => /\/under-\d+-kr\//.test(u)),
    "for-dig-som": prog.filter((u) => u.includes("/for-dig-som/")),
  };
  const sample = [
    ...byPattern["basta-i-test"].slice(0, 3),
    ...byPattern["under-kr"].slice(0, 3),
    ...byPattern["for-dig-som"].slice(0, 3),
  ];

  const h1s = new Set();
  const titles = new Set();
  const descs = new Set();
  let pass = 0;
  for (const url of sample) {
    const res = await fetch(url);
    const html = await res.text();
    const h1 = tag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const desc = tag(html, /<meta name="description" content="([^"]*)"/i);
    const words = visibleWords(html);
    const types = jsonLdTypes(html);
    const dupH1 = h1s.has(h1);
    const dupTitle = titles.has(title);
    const dupDesc = descs.has(desc);
    h1s.add(h1);
    titles.add(title);
    descs.add(desc);
    const ok =
      res.status === 200 && h1 && title && desc && words >= MIN_WORDS && !dupH1 && !dupTitle && !dupDesc &&
      types.includes("BreadcrumbList") && types.includes("ItemList") && !types.includes("INVALID_JSON");
    if (ok) pass++;
    console.log(
      `${ok ? "✅" : "❌"} ${res.status} ${url.replace(BASE, "")}\n   h1="${h1.slice(0, 70)}"\n   ord=${words} schema=[${types.join(", ")}]${dupH1 || dupTitle || dupDesc ? " DUPLICATE!" : ""}`
    );
  }
  console.log(`\n${pass}/${sample.length} stickprov OK. Unika h1: ${h1s.size}, titlar: ${titles.size}, descs: ${descs.size}`);
  if (pass !== sample.length) throw new Error("FAIL: minst ett stickprov underkänt");
  console.log("ALLA KONTROLLER GODKÄNDA ✅");
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
