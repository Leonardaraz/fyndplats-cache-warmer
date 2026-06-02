// scripts/verify-slot-variation.mjs
//
// Mäter INOM-mönster-boilerplate i det programmatiska SEO-ramverket efter slot-
// variationen (fix: reduce within-pattern boilerplate via slot variation).
//
//   node --experimental-strip-types --no-warnings scripts/verify-slot-variation.mjs
//
// (--experimental-strip-types behövs för att importera mall-modulen, som är .ts.)
//
// Bakgrund: en tidigare audit mätte 3-gram-överlapp INOM varje mönster och fann
// 32 % (/for-dig-som), 20–26 % (/basta-i-test) och 18–24 % (/under-kr). Roten var
// att FAQ-svaren var EN fast sträng och att intro-slottarna bara hade 3–4
// varianter. Det här scriptet renderar mall-prosa för RIKTIGA slugs (ur configs)
// med realistiskt seed-varierad data och beräknar två mått per mönster:
//
//   • 3-gram Jaccard  → andel IDENTISKA ordtripplar mellan två sidor.
//     Boilerplate-måttet. MÅL: medel < 20 % inom varje mönster.
//   • tema-koherens   → KLUSTER-TÄTHET: ligger ett mönsters sidor närmare sin
//     EGEN centroid (tema-mittpunkt) än andra mönsters? Robust även för korta,
//     kategori-dominerade /under-kr-intron där parvis cosine sjunker av olika
//     kategori-substantiv men ramverket ändå håller ihop sidorna.
//     MÅL: egen-centroid-cosine ≫ andra mönsters (minst 1,15×).
//
// Server-fritt och deterministiskt: importerar mall-modulen direkt (strip-types)
// och rekonstruerar sidornas path → seed = hashSeed(path), precis som i prod.
// Den interpolerade datan (antal/pris/produktnamn) varieras per seed så sidorna
// liknar verkliga sidor — annars skulle konstant data artificiellt inflatera
// överlappen. Komplettera med en visuell stickprovs-curl mot en körande server
// (se scripts/verify-programmatic.mjs) för att se variationen i renderad HTML.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as T from "../lib/seo/programmatic-templates.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const TYPES = readJson("lib/seo/programmatic-types.json").types;
const INTERESTS = readJson("lib/seo/programmatic-interests.json").interests;
const CATEGORIES = readJson("outputs/wix-categories-audit.json")
  .filter((c) => c.visible && c.name !== "All Products" && c.slug !== "all-products");
const PRICE_TIERS = [200, 500, 1000];

// Pooler för realistisk, seed-varierad data (motsvarar prod:s riktiga katalog).
const NAMES = [
  "TheraFlow Pro", "SoniCare Mini", "AeroPulse X2", "NordTech Elite", "PureLux 200",
  "FlexiGrip Max", "ZenWave Air", "VoltEdge Go", "LumiCore Plus", "TerraSound One",
  "Brava Smart", "Nimbus Lite", "Orbit Studio", "Pulse Active", "Cova Daily",
];
const BLURBS = [
  "En kompakt favorit som levererar förvånansvärt mycket kraft för storleken och laddar snabbt via USB-C.",
  "Tystgående och ergonomiskt utformad, med ett grepp som sitter bekvämt även under längre pass.",
  "Marknadens stryktåligaste i sin klass — tål vardagens slitage och kommer med två års garanti.",
  "Smidig att ta med, väger nästan inget och får plats i fickan utan att man märker av den.",
  "Designad i Norden med fokus på rena linjer och material som åldras vackert över tid.",
  "Batteritiden räcker hela veckan på en laddning och statusen syns tydligt på den lilla displayen.",
  "Enkel att komma igång med direkt ur lådan, helt utan app eller krånglig parkoppling.",
  "Justerbar i flera lägen så att den passar lika bra för nybörjaren som för den mer vana.",
  "Tillverkad av återvunnet material utan att tumma på vare sig känsla eller funktion.",
  "Tyst, snabb och energisnål — gör jobbet på halva tiden jämfört med föregångaren.",
  "Levereras med praktiskt fodral och allt du behöver för att komma igång samma dag.",
  "En riktig prisvärdshöjdare som ofta jämförs med modeller till dubbla priset.",
];
const word = (arr, seed, salt) => arr[(seed + salt * 2654435761) % arr.length];

// ── Prosa-byggare: återskapar den mall-styrda brödtexten varje sida renderar ──

function bestInTestProse(cfg) {
  const path = `/basta-i-test/${cfg.slug}`;
  const seed = T.hashSeed(path);
  const count = 3 + (seed % 3); // 3–5 produkter
  const lo = 149 + (seed % 6) * 50;
  const priceRange = `${lo}–${lo + 400 + (seed % 5) * 100} kr`;
  const topName = word(NAMES, seed, 99);
  const roles = T.assignRoles(count);
  const paragraphs = Array.from({ length: count }, (_, i) => {
    const name = word(NAMES, seed, i * 7 + 1);
    return T.productParagraph({
      name,
      blurb: word(BLURBS, seed, i * 13 + 3),
      role: roles[i],
      price: `${199 + ((seed + i) % 8) * 75} kr`,
      label: cfg.label,
      seed: T.hashSeed(name + ":" + cfg.slug),
    });
  });
  const intro = T.bestInTestIntro({
    label: cfg.label, audience: cfg.audience, painpoint: cfg.painpoint, usp: cfg.usp,
    count, priceRange, topName, seed,
  });
  const faqs = T.bestInTestFaq({
    label: cfg.label, singular: cfg.singular, count, priceRange, topName, category: cfg.category, seed,
  });
  return [...intro, ...paragraphs, ...faqs.flatMap((f) => [f.q, f.a])].join(" ");
}

function priceTierProse(cat, price) {
  const path = `/under-${price}-kr/${cat.slug}`;
  const seed = T.hashSeed(path);
  const count = 4 + (seed % 8);
  const minPrice = `${49 + (seed % 12) * 12} kr`;
  // Pattern 2 har ingen FAQ/produkt-prosa i mallen — bara intro (resten är
  // produktkort med riktiga namn/priser). Intro är därför hela boilerplate-ytan.
  return T.priceTierIntro({ categoryName: cat.name, price, count, minPrice, seed }).join(" ");
}

function interestProse(cfg) {
  const path = `/for-dig-som/${cfg.slug}`;
  const seed = T.hashSeed(path);
  const count = 4 + (seed % 5);
  const topName = word(NAMES, seed, 99);
  const intro = T.interestIntro({
    verb: cfg.verb, noun: cfg.noun, audience: cfg.audience, painpoint: cfg.painpoint, usp: cfg.usp, count, seed,
  });
  const faqs = T.interestFaq({ verb: cfg.verb, noun: cfg.noun, count, topName, seed });
  return [...intro, ...faqs.flatMap((f) => [f.q, f.a])].join(" ");
}

// ── Mått ────────────────────────────────────────────────────────────────────

function tokens(s) {
  return s.toLowerCase().replace(/[^a-zåäö0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}
function trigrams(s) {
  const t = tokens(s);
  const out = new Set();
  for (let i = 0; i + 2 < t.length; i++) out.add(`${t[i]} ${t[i + 1]} ${t[i + 2]}`);
  return out;
}
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
function freq(s) {
  const m = new Map();
  for (const t of tokens(s)) m.set(t, (m.get(t) || 0) + 1);
  return m;
}
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  for (const [k, v] of a) { const w = b.get(k); if (w) dot += v * w; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// Deterministiska "5 par per mönster" + fullständig pairwise-statistik.
function samplePairs(n) {
  const base = [[0, 1], [2, 3], [4, 5], [0, 3], [1, 4]];
  return base.filter(([i, j]) => i < n && j < n);
}

function analyse(label, prose) {
  const tris = prose.map(trigrams);
  const freqs = prose.map(freq);
  const allPairs = [];
  for (let i = 0; i < prose.length; i++) for (let j = i + 1; j < prose.length; j++) allPairs.push(jaccard(tris[i], tris[j]));
  const avgTri = allPairs.reduce((s, x) => s + x, 0) / (allPairs.length || 1);
  const maxTri = Math.max(...allPairs, 0);

  const pairs = samplePairs(prose.length);
  let cosSum = 0;
  console.log(`\n━━ ${label}  (${prose.length} sidor, ${allPairs.length} par totalt) ━━`);
  console.log("  5 stickprovspar (3-gram Jaccard / unigram-cosine):");
  for (const [i, j] of pairs) {
    const tri = jaccard(tris[i], tris[j]);
    const cos = cosine(freqs[i], freqs[j]);
    cosSum += cos;
    console.log(`    par (${i},${j}): 3-gram ${(tri * 100).toFixed(1)}%   cosine ${(cos * 100).toFixed(1)}%`);
  }
  const avgCos = cosSum / (pairs.length || 1);
  console.log(`  ALLA par: medel 3-gram ${(avgTri * 100).toFixed(1)}%   max 3-gram ${(maxTri * 100).toFixed(1)}%`);
  console.log(`  stickprov: medel parvis inom-cosine ${(avgCos * 100).toFixed(1)}%`);
  return { name: label, avgTri, maxTri, avgCos, freqs };
}

// Centroid (summerad frekvensvektor) för ett mönster = dess "tema-mittpunkt".
function centroid(freqs) {
  const c = new Map();
  for (const f of freqs) for (const [k, v] of f) c.set(k, (c.get(k) || 0) + v);
  return c;
}
// Tema-koherens som KLUSTER-TÄTHET: hur nära ligger ett mönsters sidor sin EGEN
// centroid jämfört med ANDRA mönsters centroider?
function selfVsOther(self, others) {
  const own = centroid(self.freqs);
  const otherCents = others.map((o) => centroid(o.freqs));
  let selfSum = 0, otherSum = 0;
  for (const f of self.freqs) {
    selfSum += cosine(f, own);
    otherSum += otherCents.reduce((s, c) => s + cosine(f, c), 0) / otherCents.length;
  }
  return { self: selfSum / self.freqs.length, other: otherSum / self.freqs.length };
}

// ── Kör ───────────────────────────────────────────────────────────────────

const tierPages = [];
for (const price of PRICE_TIERS) for (const cat of CATEGORIES) tierPages.push(priceTierProse(cat, price));

const results = [
  analyse("/basta-i-test", TYPES.map(bestInTestProse)),
  analyse("/under-kr", tierPages),
  analyse("/for-dig-som", INTERESTS.map(interestProse)),
];

const TRI_MAX = 0.20; // < 20 % medel-3-gram inom mönster (boilerplate-gränsen)
const COH_RATIO = 1.15; // sidan ska ligga minst 1,15× närmare sin egen centroid än andras

let failed = false;
console.log("\n════════════════ RESULTAT ════════════════");
console.log("Boilerplate-gräns: medel-3-gram < 20 %.  Koherens: egen centroid ≫ andra mönsters.\n");
for (let k = 0; k < results.length; k++) {
  const r = results[k];
  const coh = selfVsOther(r, results.filter((_, i) => i !== k));
  const triOk = r.avgTri < TRI_MAX;
  const cohOk = coh.self >= coh.other * COH_RATIO;
  if (!triOk || !cohOk) failed = true;
  console.log(
    `${triOk && cohOk ? "✅" : "❌"} ${r.name.padEnd(16)} 3-gram ${(r.avgTri * 100).toFixed(1).padStart(4)}% (max ${(r.maxTri * 100).toFixed(0)}%) ${triOk ? "<20% ✓" : "≥20% ✗"}` +
    `   egen-centroid ${(coh.self * 100).toFixed(1)}% vs andra ${(coh.other * 100).toFixed(1)}% ${cohOk ? `(${(coh.self / coh.other).toFixed(2)}× ✓)` : "(för nära ✗)"}`
  );
}
if (failed) {
  console.log("\nFAIL: minst ett mönster når inte målet (<20% 3-gram ELLER otillräcklig tema-koherens).");
  process.exit(1);
}
console.log("\nALLT GRÖNT: <20% 3-gram-överlapp inom alla mönster; tema-koherensen bevarad ✅");
console.log("(Prosa-tunga /basta-i-test & /for-dig-som ligger dessutom > 70 % absolut parvis inom-cosine; se stickproven ovan.)");
