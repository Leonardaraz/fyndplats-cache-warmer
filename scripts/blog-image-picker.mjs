#!/usr/bin/env node
// Picks 3-5 products per blog post topic by matching product names against
// topic keywords. Outputs scripts/blog-image-map.json with hero + body picks.
//
// Source: outputs/products.json (Wix Stores v3 export, 207 products).
// Match strategy: weighted keyword hits on product name (case-insensitive),
// boost for primary keywords, exclude obviously irrelevant categories.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TOPICS = {
  "aktivera-hunden-inomhus": {
    must: ["hund"],
    primary: ["aktivering", "tugg", "leksak", "snuffel", "boll", "kong", "hundleksak"],
    secondary: ["sele", "koppel", "skål", "borste"],
    exclude: ["katt", "hamster", "smådjur"],
    minHits: 1,
  },
  "smarta-forvaringslosningar-sma-lagenheter": {
    must: [],
    primary: ["förvaring", "organis", "hylla", "krok", "väggmonterad", "förvaringshylla", "förvaringslåda", "kryddställ", "sminkförvaring", "knivlist", "knivhållare", "väggkrok"],
    secondary: ["vikbar", "hopfällbar", "utdragbar", "platsbesparande", "vägghängd"],
    exclude: ["hund", "katt"],
    minHits: 1,
  },
  "trana-hemma-utan-utrustning": {
    must: [],
    primary: ["träning", "ab-hjul", "motståndsband", "hopprep", "magtränare", "yoga", "akupressur", "spikmatta", "massagepistol", "hållning"],
    secondary: ["träningsutrustning", "core", "ryggstöd", "fotmassage"],
    exclude: ["hund", "katt", "barn"],
    minHits: 1,
  },
  "hemmakontor-tips": {
    must: [],
    primary: ["mus", "tangentbord", "laptop", "musmatta", "skrivbord", "mobilhållare", "laddningsstation", "fotvärmare", "koppvärmare", "skärmskydd"],
    secondary: ["ergonomisk", "trådlös", "usb", "kabel", "gaming"],
    exclude: ["barn", "hund", "katt"],
    minHits: 1,
  },
  "mysig-hostinredning": {
    must: [],
    primary: ["lampa", "nattlampa", "ljus", "led", "diffuser", "luftfuktare", "filt", "tofflor", "kudde", "rgb", "stjärnprojektor", "solnedgångslampa", "kaffekopp"],
    secondary: ["mysig", "varm", "teddy", "fleece", "keramisk"],
    exclude: ["hund", "katt", "barn", "bil"],
    minHits: 1,
  },
  "skonhetsrutin-torr-hud": {
    must: [],
    primary: ["hudvård", "ansikt", "rengöring", "porrensare", "gua sha", "ansiktsmask", "ögonmask", "fotfil", "tandborste", "tandbleknings", "ansiktsroller", "sminkborste", "infraröd"],
    secondary: ["len", "hud", "massage", "rödljus", "förstoring", "sminkspegel"],
    exclude: ["hund", "katt", "barn", "bebis"],
    minHits: 1,
  },
  "packlista-helgresa": {
    must: [],
    primary: ["resa", "necessär", "bagage", "rese", "bagageorganiserare", "vattenflaska", "klädångare", "solglasögon", "paraply", "nackkudde"],
    secondary: ["bärbar", "portabel", "vikbar", "hopfällbar", "reseflaska"],
    exclude: ["hund", "katt", "barn", "bebis"],
    minHits: 1,
  },
  "hobby-for-vuxna": {
    must: [],
    primary: ["projektor", "spel", "spelkonsol", "samlar", "labubu", "starbeat", "ritplatta", "stickers", "modell", "high tea", "highball", "whiskey", "vin", "kaffe"],
    secondary: ["pop mart", "samlarfigur", "spelkonsol", "bluetooth-högtalare", "jbl"],
    exclude: ["barn", "bebis", "hund", "katt"],
    minHits: 1,
  },
  "verktyg-for-nyborjare": {
    must: [],
    primary: ["verktyg", "skruvdragare", "spärrnyckel", "ficklampa", "skjutmått", "knivslip", "vitlökspress", "mandolinskärare", "tätlist", "griptång", "stektermometer"],
    secondary: ["set", "precision", "taktisk", "rostfritt", "uppladdningsbar"],
    exclude: ["barn", "bebis", "hund", "katt"],
    minHits: 1,
  },
  "presenter-till-hundalskaren": {
    must: ["hund"],
    primary: ["hundleksak", "leksak för hund", "hundsele", "hundkoppel", "tugg", "presenter", "borste", "pälsborste", "klovård", "nagelfil"],
    secondary: ["sele", "koppel", "skål", "matta"],
    exclude: ["katt", "hamster", "smådjur"],
    minHits: 1,
  },
};

function scoreProduct(product, topic) {
  const name = (product.name || "").toLowerCase();
  if (topic.exclude.some((w) => name.includes(w))) return 0;
  if (topic.must.length && !topic.must.some((w) => name.includes(w))) return 0;

  let score = 0;
  for (const w of topic.primary) if (name.includes(w)) score += 5;
  for (const w of topic.secondary) if (name.includes(w)) score += 2;
  for (const w of topic.must) if (name.includes(w)) score += 3;
  return score >= (topic.minHits || 1) * 3 ? score : 0;
}

// Wix CDN URL transformer: add ?w=&q=&fm=webp params for optimisation.
function optimisedUrl(url, w = 1200, q = 80) {
  if (!url) return "";
  // The exported URL is the base file URL (no transforms). Use Wix's URL
  // transform syntax: insert /v1/fit/w_N,h_N,q_Q/file.ext.
  // BUT — the URLs in our export end at .jpg/.png. The /v1/fit/... segments
  // we see elsewhere are added on the storefront. We'll let next/image handle
  // resizing via the width/height props; just return the base URL.
  return url;
}

function pickHero(scored) {
  // Hero = highest-scoring product with a high-quality main image (width >= 800).
  for (const { product } of scored) {
    const img = product.media?.main?.image;
    if (img?.url && (img.width || 800) >= 800) return product;
  }
  return scored[0]?.product || null;
}

async function main() {
  const productsRaw = await readFile(join(ROOT, "outputs/products.json"), "utf8");
  const products = JSON.parse(productsRaw);
  console.log(`loaded ${products.length} products`);

  const out = {};
  for (const [slug, topic] of Object.entries(TOPICS)) {
    const scored = products
      .map((p) => ({ score: scoreProduct(p, topic), product: p }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const hero = pickHero(scored);
    // Body picks: next 3 distinct from hero, prefer high-score, varied keywords.
    const body = [];
    const seen = new Set(hero ? [hero.id] : []);
    for (const { product } of scored) {
      if (seen.has(product.id)) continue;
      body.push(product);
      seen.add(product.id);
      if (body.length >= 3) break;
    }

    out[slug] = {
      topicMatches: scored.length,
      hero: hero
        ? {
            name: hero.name,
            slug: hero.slug,
            url: `/produkt/${hero.slug}`,
            image: optimisedUrl(hero.media?.main?.image?.url),
            alt: hero.media?.main?.altText || hero.name,
            width: hero.media?.main?.image?.width || 800,
            height: hero.media?.main?.image?.height || 800,
          }
        : null,
      body: body.map((p) => ({
        name: p.name,
        slug: p.slug,
        url: `/produkt/${p.slug}`,
        image: optimisedUrl(p.media?.main?.image?.url),
        alt: p.media?.main?.altText || p.name,
        width: p.media?.main?.image?.width || 800,
        height: p.media?.main?.image?.height || 800,
      })),
    };

    console.log(`${slug}: ${scored.length} matches, hero=${hero?.name?.slice(0, 50) || "NONE"}`);
    for (const b of body) console.log(`  - ${b.name.slice(0, 60)}`);
  }

  await writeFile(
    join(ROOT, "scripts/blog-image-map.json"),
    JSON.stringify(out, null, 2)
  );
  console.log(`\nwrote scripts/blog-image-map.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
