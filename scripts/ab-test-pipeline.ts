// A/B-kostnadstest (#6) — GAMLA (3 separata anrop) vs NYA (ett sammanslaget)
// text-genereringsflödet. Gör RIKTIGA Claude-anrop, så det körs bara via sin egen
// konfig (aldrig i `pnpm test`):
//
//   node_modules/.bin/vitest run --config vitest.ab.config.ts
//
// Mäter kostnad per import från appens EGEN kostnadsspårning (lib/llm/stats.ts →
// estimateCostUsd, som speglar lib/llm/pricing.ts) — inte Anthropic-konsolen.
// Skriver per-produkt-JSON till outputs/ab-test-2026-06-01/ och en HTML-rapport
// till outputs/ab-test-report.html.
//
// HÅRD GRIND (struktur): om något NYTT fält faller under 80 % av det gamla (>20 %
// tapp), eller FAQ ≠ 3–5, markeras produkten som FAIL → testet failar → DEPLOY:as INTE.
//
// HÅRD GRIND (KVALITET): längd är inte kvalitet. Utöver de strukturella måtten kör vi
// en LLM-as-judge (Claude Haiku) per produkt som jämför GAMMAL (A) mot NY (B)
// beskrivning + FAQ och sätter qualityScoreA/B 0–10. Den NYA versionen failar om
// qualityScoreB < 8 ELLER om B är >2 poäng sämre än A. Domar-anropet går direkt mot
// Anthropic (utanför routern) så det inte smutsar ner kostnadsmätningen av NYA flödet.
// Kostnad ~1 öre/produkt (~10 öre per körning) — försumbart.
//
// Valfritt: --manual-check (eller AB_MANUAL_CHECK=1) skriver 3 slumpade sample-par
// till outputs/ab-manual-check.html och kräver AB_MANUAL_CONFIRMED=1 för att passera
// — så Leonard kan ögna igenom innan deploy.
//
// Inputs: representativa AliExpress-produktfixturer (live-omskrap kräver
// AliExpress-credentials som inte finns lokalt; OLD och NEW körs på IDENTISKA
// inputs vilket är den renaste äpple-mot-äpple-jämförelsen).

import { beforeAll, expect, it } from "vitest";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { generateProductContent } from "../lib/import/generate.ts";
import { generateSeo } from "../lib/import/seo.ts";
import { generateTabs } from "../lib/import/tabs.ts";
import { suggestCategory, getClaude, TEXT_MODEL } from "../lib/claude/client.ts";
import { getDailyStats } from "../lib/llm/stats.ts";
import { __resetLlmMemoryStore } from "../lib/llm/storage.ts";
import { __clearMemCache } from "../lib/llm/cache.ts";
import { getCollections } from "../lib/wix/client.ts";
import type { AliExpressProduct } from "../lib/import/types.ts";
import type { CollectionOption } from "../lib/claude/types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(here, "..", "outputs", "ab-test-2026-06-01");
const REPORT = path.join(here, "..", "outputs", "ab-test-report.html");
const MANUAL = path.join(here, "..", "outputs", "ab-manual-check.html");

function loadEnv() {
  try {
    const raw = readFileSync(path.join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local saknas — förlitar oss på redan satta env-vars */
  }
}

const USD_TO_SEK = Number(process.env.USD_TO_SEK || "10.5");
const ore = (usd: number) => usd * USD_TO_SEK * 100;

async function resetCostMeters() {
  __resetLlmMemoryStore();
  __clearMemCache();
}

async function measuredCostUsd(): Promise<number> {
  const stats = await getDailyStats(1);
  return stats[0]?.totals.costUsd ?? 0;
}

// --- Strukturella mått ------------------------------------------------------
const stripHtml = (s: string) => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const wordCount = (s: string) => (stripHtml(s).match(/\S+/g) || []).length;
const paraCount = (html: string) => (html.match(/<p[ >]/gi) || []).length;
const hasSwedishSignal = (s: string) =>
  /[åäö]/i.test(s) || /\b(och|att|för|med|som|den|det|en|ett|är|på)\b/i.test(s);

interface FieldCheck {
  field: string;
  oldVal: string;
  newVal: string;
  oldWords: number;
  newWords: number;
  ratio: number; // new/old word-ratio
  ok: boolean;
  note: string;
}

// --- LLM-as-judge (kvalitet, inte längd) ------------------------------------
// Domaren jämför GAMMAL (A) mot NY (B) och sätter kvalitetspoäng 0–10. Acceptans:
// B får inte ligga under QUALITY_MIN, och inte vara mer än QUALITY_MAX_INFERIORITY
// poäng under A. Det skyddar mot "längre-men-sämre" OCH "kortare-men-faktiskt-sämre".
const QUALITY_MIN = 8;
const QUALITY_MAX_INFERIORITY = 2;
const JUDGE_MODEL = process.env.AB_JUDGE_MODEL || TEXT_MODEL; // Haiku som default
const JUDGE_MAX_TOKENS = 600;

interface JudgeVerdict {
  winner: "A" | "B" | "tie";
  reasoning: string;
  qualityScoreA: number;
  qualityScoreB: number;
}

interface JudgeInput {
  descriptionHtml: string;
  faq: { q: string; a: string }[];
}

const JUDGE_SYSTEM = `Du är en sträng kvalitets-domare för svensk e-handelscopy. Du får TVÅ produktbeskrivningar
(A och B) för EXAKT SAMMA produkt och ska bedöma vilken som är bättre. Bedömningsgrunder:
- naturlig, korrekt svenska (inte maskinöversatt eller stolpig)
- informativ och konkret (ger kunden verklig produktnytta, inte tom fyllnad)
- säljande utan att ljuga eller hitta på specifikationer
- FAQ som svarar på riktiga kundfrågor
Längd i sig är INTE kvalitet — en kortare men skarpare text kan vara bättre än en längre utfylld.
Straffa utfyllnad, upprepning, påhittade fakta och butiks-/startsidescopy hårt.

Returnera ENDAST giltig JSON, inga kodstaket:
{"winner": "A"|"B"|"tie", "reasoning": "kort svensk motivering (≤300 tecken)", "qualityScoreA": 0-10, "qualityScoreB": 0-10}`;

function faqToText(faq: { q: string; a: string }[]): string {
  if (!faq.length) return "(inga FAQ)";
  return faq.map((f, i) => `${i + 1}. F: ${f.q}\n   S: ${f.a}`).join("\n");
}

function clamp10(n: unknown): number {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(10, x));
}

function parseJudgeJson(text: string): JudgeVerdict {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const clean = (fence ? fence[1] : text).trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`domaren returnerade ogiltig JSON: ${clean.slice(0, 200)}`);
    obj = JSON.parse(m[0]);
  }
  const winner = obj.winner === "A" || obj.winner === "B" || obj.winner === "tie" ? obj.winner : "tie";
  return {
    winner,
    reasoning: String(obj.reasoning ?? "").slice(0, 400),
    qualityScoreA: clamp10(obj.qualityScoreA),
    qualityScoreB: clamp10(obj.qualityScoreB),
  };
}

/**
 * LLM-domare: jämför gammal (A) och ny (B) beskrivning + FAQ för samma produkt.
 * Direkt Anthropic-anrop (utanför routern) så det inte räknas in i NYA flödets
 * kostnadsmätning. En retry vid transient fel; kastar annars vidare.
 */
async function judgeQuality(title: string, a: JudgeInput, b: JudgeInput): Promise<JudgeVerdict> {
  const claude = getClaude();
  const user = `Produkt: ${title}

=== VERSION A ===
Beskrivning (HTML):
${a.descriptionHtml || "(tom)"}

FAQ:
${faqToText(a.faq)}

=== VERSION B ===
Beskrivning (HTML):
${b.descriptionHtml || "(tom)"}

FAQ:
${faqToText(b.faq)}

Bedöm A mot B och svara ENDAST med JSON enligt schemat.`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await claude.messages.create({
        model: JUDGE_MODEL,
        max_tokens: JUDGE_MAX_TOKENS,
        system: [{ type: "text", text: JUDGE_SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
      });
      const text = msg.content
        .map((blk) => (blk.type === "text" ? blk.text : ""))
        .join("")
        .trim();
      return parseJudgeJson(text);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Bygg kvalitets-grinden som en FieldCheck (deltar i pass = checks.every(ok)). */
function qualityCheck(v: JudgeVerdict): FieldCheck {
  const ok = v.qualityScoreB >= QUALITY_MIN && v.qualityScoreA - v.qualityScoreB <= QUALITY_MAX_INFERIORITY;
  return {
    field: "kvalitet (LLM-domare)",
    oldVal: `A (gammal): ${v.qualityScoreA.toFixed(1)}/10`,
    newVal: `B (ny): ${v.qualityScoreB.toFixed(1)}/10 · vinnare: ${v.winner}`,
    oldWords: 0,
    newWords: 0,
    ratio: v.qualityScoreA > 0 ? v.qualityScoreB / v.qualityScoreA : 1,
    ok,
    note: `${v.reasoning} | krav: B≥${QUALITY_MIN} OCH B inte >${QUALITY_MAX_INFERIORITY}p under A`,
  };
}

const FIXTURES: AliExpressProduct[] = [
  {
    supplierProductId: "AB-1",
    sourceUrl: "https://www.aliexpress.com/item/1.html",
    rawTitle: "Digital Kitchen Scale 5kg Stainless Steel LCD Food Weighing Scale",
    rawDescription:
      "High precision digital kitchen scale, 5kg/1g capacity, stainless steel platform, LCD backlight, tare function, unit switch g/ml/oz/lb, auto-off, powered by 2xAAA.",
    imageUrls: ["https://x/1a.jpg", "https://x/1b.jpg"],
    specifications: { Material: "Stainless steel", Capacity: "5kg", Accuracy: "1g", Power: "2xAAA battery" },
    features: ["LCD backlight", "Tare function", "Unit conversion", "Auto power off"],
    packageContents: ["1 x Kitchen scale", "1 x Manual"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Silver" }, costUsd: 5.2, included: true }],
  },
  {
    supplierProductId: "AB-2",
    sourceUrl: "https://www.aliexpress.com/item/2.html",
    rawTitle: "LED Strip Light RGB 5M Bluetooth APP Control Music Sync TV Backlight",
    rawDescription:
      "5 meter RGB LED strip with bluetooth app control, music sync mode, 16 million colors, remote control, self-adhesive back, USB powered, cuttable.",
    imageUrls: ["https://x/2a.jpg", "https://x/2b.jpg", "https://x/2c.jpg"],
    specifications: { Length: "5m", LEDs: "300", Voltage: "5V USB", Control: "App + Remote" },
    features: ["Music sync", "16M colors", "App control", "Self-adhesive"],
    packageContents: ["1 x LED strip", "1 x Remote", "1 x USB cable"],
    variants: [{ supplierVariantId: "v1", options: { Length: "5m" }, costUsd: 3.8, included: true }],
  },
  {
    supplierProductId: "AB-3",
    sourceUrl: "https://www.aliexpress.com/item/3.html",
    rawTitle: "Jade Roller Gua Sha Set Natural Stone Facial Massage Skincare Tool",
    rawDescription:
      "Natural jade facial roller and gua sha set for face massage, reduces puffiness, promotes circulation, dual-ended roller, comes in gift box.",
    imageUrls: ["https://x/3a.jpg", "https://x/3b.jpg"],
    specifications: { Material: "Natural jade", Type: "Roller + Gua Sha", Color: "Green" },
    features: ["Reduces puffiness", "Dual-ended", "Gift box included"],
    packageContents: ["1 x Jade roller", "1 x Gua sha", "1 x Gift box"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Green" }, costUsd: 2.5, included: true }],
  },
  {
    supplierProductId: "AB-4",
    sourceUrl: "https://www.aliexpress.com/item/4.html",
    rawTitle: "Adjustable Phone Holder Desk Stand Aluminum Foldable Tablet Mount",
    rawDescription:
      "Aluminum alloy adjustable phone and tablet stand, foldable, angle adjustable, non-slip silicone pads, compatible 4-12.9 inch devices.",
    imageUrls: ["https://x/4a.jpg", "https://x/4b.jpg"],
    specifications: { Material: "Aluminum alloy", Compatibility: "4-12.9 inch", Foldable: "Yes" },
    features: ["Adjustable angle", "Foldable", "Non-slip pads"],
    packageContents: ["1 x Phone stand"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Grey" }, costUsd: 3.1, included: true }],
  },
  {
    supplierProductId: "AB-5",
    sourceUrl: "https://www.aliexpress.com/item/5.html",
    rawTitle: "Pet Dog Cat Hair Remover Brush Self Cleaning Slicker Grooming Comb",
    rawDescription:
      "Self-cleaning slicker brush for dogs and cats, retractable bristles, removes loose fur and tangles, ergonomic handle, suitable for all coat types.",
    imageUrls: ["https://x/5a.jpg", "https://x/5b.jpg"],
    specifications: { Material: "ABS + steel pins", Type: "Slicker brush", "Self cleaning": "Yes" },
    features: ["Self-cleaning button", "Retractable bristles", "Ergonomic handle"],
    packageContents: ["1 x Grooming brush"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Blue" }, costUsd: 2.9, included: true }],
  },
  {
    supplierProductId: "AB-6",
    sourceUrl: "https://www.aliexpress.com/item/6.html",
    rawTitle: "Non-slip Yoga Mat TPE 6mm Thick Exercise Fitness Pad with Carry Strap",
    rawDescription:
      "6mm thick TPE yoga mat, double-sided non-slip texture, eco-friendly, lightweight, includes carrying strap, 183x61cm.",
    imageUrls: ["https://x/6a.jpg", "https://x/6b.jpg"],
    specifications: { Material: "TPE", Thickness: "6mm", Size: "183x61cm" },
    features: ["Double-sided non-slip", "Eco-friendly", "Carry strap included"],
    packageContents: ["1 x Yoga mat", "1 x Carry strap"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Purple" }, costUsd: 6.5, included: true }],
  },
  {
    supplierProductId: "AB-7",
    sourceUrl: "https://www.aliexpress.com/item/7.html",
    rawTitle: "Wooden Montessori Toy Baby Shape Sorter Educational Stacking Blocks",
    rawDescription:
      "Montessori wooden shape sorter and stacking blocks, develops fine motor skills and color recognition, non-toxic paint, suitable age 1-3 years.",
    imageUrls: ["https://x/7a.jpg", "https://x/7b.jpg"],
    specifications: { Material: "Beech wood", "Age range": "1-3 years", Paint: "Non-toxic water-based" },
    features: ["Develops motor skills", "Color recognition", "Non-toxic"],
    packageContents: ["1 x Shape sorter", "12 x Blocks"],
    variants: [{ supplierVariantId: "v1", options: { Type: "Standard" }, costUsd: 7.2, included: true }],
  },
  {
    supplierProductId: "AB-8",
    sourceUrl: "https://www.aliexpress.com/item/8.html",
    rawTitle: "6PCS Kitchen Knife Set Stainless Steel Chef Knives with Acrylic Block",
    rawDescription:
      "6-piece stainless steel kitchen knife set including chef, bread, utility, paring knives and scissors with acrylic stand. Ergonomic handles, sharp blades.",
    imageUrls: ["https://x/8a.jpg", "https://x/8b.jpg"],
    specifications: { Material: "Stainless steel", Pieces: "6", Handle: "ABS ergonomic" },
    features: ["Sharp blades", "Acrylic block included", "Ergonomic handles"],
    packageContents: ["5 x Knives", "1 x Acrylic block"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Black" }, costUsd: 9.9, included: true }],
  },
  {
    supplierProductId: "AB-9",
    sourceUrl: "https://www.aliexpress.com/item/9.html",
    rawTitle: "LED Makeup Mirror with Lights Touch Dimmable Vanity Mirror USB Rechargeable",
    rawDescription:
      "Vanity makeup mirror with LED lights, touch dimmable brightness, USB rechargeable, 180 degree rotation, HD clear reflection, desktop stand.",
    imageUrls: ["https://x/9a.jpg", "https://x/9b.jpg"],
    specifications: { "Light source": "LED", Power: "USB rechargeable", Rotation: "180 degrees" },
    features: ["Touch dimmable", "Rechargeable", "HD reflection"],
    packageContents: ["1 x Mirror", "1 x USB cable"],
    variants: [{ supplierVariantId: "v1", options: { Color: "White" }, costUsd: 8.4, included: true }],
  },
  {
    supplierProductId: "AB-10",
    sourceUrl: "https://www.aliexpress.com/item/10.html",
    rawTitle: "Precision Screwdriver Set 25 in 1 Magnetic Repair Tool Kit Phone Laptop",
    rawDescription:
      "25-in-1 precision screwdriver set with magnetic bits, for repairing phones, laptops, glasses, watches. Includes tweezers and pry tools in storage case.",
    imageUrls: ["https://x/10a.jpg", "https://x/10b.jpg"],
    specifications: { Bits: "24", Material: "CR-V steel", Magnetic: "Yes" },
    features: ["Magnetic bits", "Storage case", "Multi-device repair"],
    packageContents: ["24 x Bits", "1 x Handle", "1 x Tweezers", "1 x Case"],
    variants: [{ supplierVariantId: "v1", options: { Type: "25-in-1" }, costUsd: 4.6, included: true }],
  },
];

interface ProductResult {
  pid: string;
  title: string;
  oldCostUsd: number;
  newCostUsd: number;
  checks: FieldCheck[];
  pass: boolean;
  judge: JudgeVerdict | null;
  old: unknown;
  neu: unknown;
}

let collections: CollectionOption[] = [];
const results: ProductResult[] = [];

beforeAll(async () => {
  loadEnv();
  // Tvinga Claude-only + minne (kall cache → riktig genereringskostnad mäts, inga
  // Wix-cacheskrivningar). Görs FÖRE första anropet (env läses vid call-time).
  process.env.STORE_BACKEND = "memory";
  process.env.LLM_PROVIDER_DEFAULT = "claude";
  delete process.env.GEMINI_API_KEY;
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas (sätt i .env.local).");
  mkdirSync(OUT_DIR, { recursive: true });

  try {
    const cols = await getCollections();
    collections = cols.map((c) => ({ slug: c.slug, name: c.name, description: c.description }));
    console.log(`[ab] Hämtade ${collections.length} Wix-kollektioner.`);
  } catch (err) {
    console.warn(`[ab] getCollections failade (${err}). Använder reservlista.`);
  }
  if (collections.length === 0) {
    collections = [
      { slug: "kok", name: "Kök & Husgeråd" },
      { slug: "skonhet", name: "Skönhet & Hälsa" },
      { slug: "elektronik", name: "Elektronik & Tillbehör" },
      { slug: "hem", name: "Hem & Inredning" },
      { slug: "leksaker", name: "Leksaker" },
      { slug: "husdjur", name: "Husdjur" },
      { slug: "traning", name: "Träning & Fritid" },
      { slug: "verktyg", name: "Verktyg" },
    ];
  }
});

async function runOld(p: AliExpressProduct) {
  const seo = await generateSeo(p);
  const cat = await suggestCategory(seo.title, seo.descriptionHtml || p.rawDescription, collections);
  const categoryName = collections.find((c) => c.slug === cat.collectionSlug)?.name ?? null;
  const tabs = await generateTabs({
    productId: p.supplierProductId,
    name: seo.title || p.rawTitle,
    categoryName,
    specifications: p.specifications,
    features: p.features,
    packageContents: p.packageContents,
  });
  return { seo, category: cat, tabs };
}

function buildChecks(oldR: Awaited<ReturnType<typeof runOld>>, newR: Awaited<ReturnType<typeof generateProductContent>>): FieldCheck[] {
  const checks: FieldCheck[] = [];
  const cmp = (field: string, oldVal: string, newVal: string, extraOk = true, note = ""): FieldCheck => {
    const oldWords = wordCount(oldVal);
    const newWords = wordCount(newVal);
    const ratio = oldWords === 0 ? 1 : newWords / oldWords;
    // Hård grind: nytt fält får inte tappa >20 % innehåll (ratio >= 0.8). Längre är ok.
    const ok = newVal.trim().length > 0 && ratio >= 0.8 && extraOk;
    return { field, oldVal, newVal, oldWords, newWords, ratio, ok, note };
  };

  // title & metaDescription är LÄNGD-BEGRÄNSADE fält (≤70 resp. ≤160 tecken) där
  // kortare ≠ sämre. De bedöms därför på teckengränser + en rimlig absolut botten
  // (inte word-ratio ≥80 %, som vi reserverar för den innehållsbärande beskrivningen).
  const tLen = newR.seo.title.trim().length;
  checks.push({
    field: "title",
    oldVal: oldR.seo.title,
    newVal: newR.seo.title,
    oldWords: wordCount(oldR.seo.title),
    newWords: wordCount(newR.seo.title),
    ratio: wordCount(oldR.seo.title) ? wordCount(newR.seo.title) / wordCount(oldR.seo.title) : 1,
    ok: tLen >= 25 && tLen <= 70,
    note: `tecken=${tLen} (krav 25–70)`,
  });
  const mLen = newR.seo.metaDescription.trim().length;
  checks.push({
    field: "metaDescription",
    oldVal: oldR.seo.metaDescription,
    newVal: newR.seo.metaDescription,
    oldWords: wordCount(oldR.seo.metaDescription),
    newWords: wordCount(newR.seo.metaDescription),
    ratio: wordCount(oldR.seo.metaDescription) ? wordCount(newR.seo.metaDescription) / wordCount(oldR.seo.metaDescription) : 1,
    ok: mLen >= 100 && mLen <= 160,
    note: `tecken=${mLen} (krav 100–160)`,
  });
  checks.push(
    cmp(
      "descriptionHtml",
      oldR.seo.descriptionHtml,
      newR.seo.descriptionHtml,
      paraCount(newR.seo.descriptionHtml) >= 1,
      `stycken: old=${paraCount(oldR.seo.descriptionHtml)} new=${paraCount(newR.seo.descriptionHtml)}`,
    ),
  );

  // FAQ: 3–5, varje med q+a, svensk-signal.
  const faq = newR.tabs.faq;
  const faqOk =
    faq.length >= 3 &&
    faq.length <= 5 &&
    faq.every((f) => f.q.trim() && f.a.trim()) &&
    faq.every((f) => hasSwedishSignal(f.q + " " + f.a));
  checks.push({
    field: "faq",
    oldVal: oldR.tabs.faq.map((f) => `Q:${f.q} A:${f.a}`).join(" | "),
    newVal: faq.map((f) => `Q:${f.q} A:${f.a}`).join(" | "),
    oldWords: oldR.tabs.faq.length,
    newWords: faq.length,
    ratio: faq.length,
    ok: faqOk,
    note: `antal: old=${oldR.tabs.faq.length} new=${faq.length} (krav 3–5, q+a, svenska)`,
  });

  // Specs: behåll minst lika många (>=80%).
  checks.push({
    field: "specs",
    oldVal: oldR.tabs.specs.map((s) => `${s.label}: ${s.value}`).join("; "),
    newVal: newR.tabs.specs.map((s) => `${s.label}: ${s.value}`).join("; "),
    oldWords: oldR.tabs.specs.length,
    newWords: newR.tabs.specs.length,
    ratio: oldR.tabs.specs.length ? newR.tabs.specs.length / oldR.tabs.specs.length : 1,
    ok: newR.tabs.specs.length >= Math.ceil(oldR.tabs.specs.length * 0.8),
    note: `antal: old=${oldR.tabs.specs.length} new=${newR.tabs.specs.length}`,
  });

  // Kategori: bägge gav en slug eller bägge null (band-jämförelse, ej hård grind).
  const bothCat = Boolean(oldR.category.collectionSlug) === Boolean(newR.category.collectionSlug);
  checks.push({
    field: "category",
    oldVal: `${oldR.category.collectionSlug ?? "null"} (${oldR.category.confidence.toFixed(2)})`,
    newVal: `${newR.category.collectionSlug ?? "null"} (${newR.category.confidence.toFixed(2)})`,
    oldWords: 0,
    newWords: 0,
    ratio: 1,
    ok: bothCat,
    note: bothCat ? "samma kategoriserings-utfall (slug/null)" : "OBS: olika kategoriserings-utfall",
  });

  return checks;
}

it("A/B: NYA flödet behåller kvalitet (≥80 % per fält) och sänker kostnaden", async () => {
  for (const p of FIXTURES) {
    try {
      // GAMLA flödet är oförändrat mellan körningar — återanvänd sparad baseline
      // (AB_FRESH_OLD=1 tvingar omkörning) så prompt-iterationer på NYA flödet
      // inte betalar för OLD-anropen varje gång.
      const cachePath = path.join(OUT_DIR, `${p.supplierProductId}.json`);
      let oldR: Awaited<ReturnType<typeof runOld>>;
      let oldCostUsd: number;
      if (process.env.AB_FRESH_OLD !== "1" && existsSync(cachePath)) {
        const prev = JSON.parse(readFileSync(cachePath, "utf8"));
        oldR = prev.old;
        oldCostUsd = prev.oldCostUsd ?? 0;
      } else {
        await resetCostMeters();
        oldR = await runOld(p);
        oldCostUsd = await measuredCostUsd();
      }

      await resetCostMeters();
      const newR = await generateProductContent(p, collections);
      const newCostUsd = await measuredCostUsd();

      const checks = buildChecks(oldR, newR);

      // KVALITETS-GRIND: LLM-domare jämför gammal (A) mot ny (B). Läggs till som en
      // check så den deltar i pass = checks.every(ok) (failar → blockerar deploy).
      let judge: JudgeVerdict | null = null;
      try {
        judge = await judgeQuality(
          p.rawTitle,
          { descriptionHtml: oldR.seo.descriptionHtml, faq: oldR.tabs.faq },
          { descriptionHtml: newR.seo.descriptionHtml, faq: newR.tabs.faq },
        );
        checks.push(qualityCheck(judge));
      } catch (err) {
        // Fail-closed: kan domaren inte köras vägrar vi godkänna blint.
        checks.push({
          field: "kvalitet (LLM-domare)",
          oldVal: "",
          newVal: String(err),
          oldWords: 0,
          newWords: 0,
          ratio: 0,
          ok: false,
          note: "domaren kunde inte köras (efter 1 retry) — granska manuellt",
        });
      }

      const pass = checks.every((c) => c.ok);
      results.push({
        pid: p.supplierProductId,
        title: p.rawTitle,
        oldCostUsd,
        newCostUsd,
        checks,
        pass,
        judge,
        old: oldR,
        neu: newR,
      });
      writeFileSync(
        path.join(OUT_DIR, `${p.supplierProductId}.json`),
        JSON.stringify({ old: oldR, new: newR, oldCostUsd, newCostUsd, checks, judge }, null, 2),
      );
      console.log(
        `[ab] ${p.supplierProductId}: ${pass ? "PASS" : "FAIL"} | old=${ore(oldCostUsd).toFixed(2)} öre new=${ore(newCostUsd).toFixed(2)} öre` +
          (judge ? ` | kvalitet A=${judge.qualityScoreA.toFixed(1)} B=${judge.qualityScoreB.toFixed(1)} (vinnare ${judge.winner})` : " | kvalitet: domare-fel"),
      );
    } catch (err) {
      console.error(`[ab] ${p.supplierProductId} kraschade:`, err);
      results.push({
        pid: p.supplierProductId,
        title: p.rawTitle,
        oldCostUsd: 0,
        newCostUsd: 0,
        checks: [{ field: "ERROR", oldVal: "", newVal: String(err), oldWords: 0, newWords: 0, ratio: 0, ok: false, note: "körfel" }],
        pass: false,
        judge: null,
        old: null,
        neu: null,
      });
    }
  }

  const avgOld = results.reduce((s, r) => s + r.oldCostUsd, 0) / results.length;
  const avgNew = results.reduce((s, r) => s + r.newCostUsd, 0) / results.length;
  const judged = results.filter((r) => r.judge);
  const avgQualA = judged.length ? judged.reduce((s, r) => s + r.judge!.qualityScoreA, 0) / judged.length : 0;
  const avgQualB = judged.length ? judged.reduce((s, r) => s + r.judge!.qualityScoreB, 0) / judged.length : 0;
  const structurePass = results.every((r) => r.pass);

  // Valfri manuell grind: --manual-check / AB_MANUAL_CHECK=1 → skriv 3 slumpade
  // sample-par och kräv AB_MANUAL_CONFIRMED=1 innan deploy godkänns.
  const manualRequested = process.argv.includes("--manual-check") || process.env.AB_MANUAL_CHECK === "1";
  let manualOk = true;
  if (manualRequested) {
    const sample = pickRandom(judged, 3);
    writeFileSync(MANUAL, renderManual(sample));
    const confirmed = process.env.AB_MANUAL_CONFIRMED === "1";
    manualOk = confirmed;
    console.log(`\n[ab] --manual-check: ${sample.length} slumpade par skrivna till ${MANUAL}`);
    if (!confirmed) {
      console.log("[ab] Läs filen och kör om med AB_MANUAL_CONFIRMED=1 för att godkänna deploy.");
    } else {
      console.log("[ab] AB_MANUAL_CONFIRMED=1 — manuell granskning bekräftad.");
    }
  }

  const allPass = structurePass && manualOk;
  writeFileSync(REPORT, renderHtml(results, avgOld, avgNew, allPass, avgQualA, avgQualB));

  console.log("\n========== A/B-SAMMANFATTNING ==========");
  console.log(`Produkter: ${results.length} | PASS: ${results.filter((r) => r.pass).length} | FAIL: ${results.filter((r) => !r.pass).length}`);
  console.log(`Kostnad/import GAMMAL: ${ore(avgOld).toFixed(2)} öre  (~$${avgOld.toFixed(5)})`);
  console.log(`Kostnad/import NY:     ${ore(avgNew).toFixed(2)} öre  (~$${avgNew.toFixed(5)})`);
  console.log(`Besparing: ${avgOld > 0 ? (((avgOld - avgNew) / avgOld) * 100).toFixed(1) : "0"} %`);
  console.log(`Snitt kvalitet (LLM-domare): A=${avgQualA.toFixed(1)}/10  B=${avgQualB.toFixed(1)}/10  (krav B≥${QUALITY_MIN}, B−A≥−${QUALITY_MAX_INFERIORITY})`);
  console.log(`Rapport: ${REPORT}`);
  console.log(`Grind: ${allPass ? "PASS — OK att deploya" : "FAIL — DEPLOYA INTE"}`);
  console.log("========================================\n");

  expect(
    allPass,
    "A/B-grind FAIL: struktur (>20 % tapp / FAQ), kvalitet (B<8 eller B >2p under A) eller obekräftad --manual-check — se rapporten",
  ).toBe(true);
});

/** Slumpa ut upp till n element (utan upprepning) ur en lista. */
function pickRandom<T>(items: T[], n: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (pool.length && out.length < n) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/** Manuell-granskningsrapport: 3 slumpade A/B-par sida vid sida. */
function renderManual(rows: ProductResult[]): string {
  const cards = rows
    .map((r) => {
      const o = r.old as { seo?: { descriptionHtml?: string }; tabs?: { faq?: { q: string; a: string }[] } } | null;
      const n = r.neu as { seo?: { descriptionHtml?: string }; tabs?: { faq?: { q: string; a: string }[] } } | null;
      const faqList = (faq?: { q: string; a: string }[]) =>
        (faq || []).map((f) => `<li><b>${esc(f.q)}</b><br>${esc(f.a)}</li>`).join("") || "<li><i>(inga)</i></li>";
      return `<section class="card">
        <h2>${esc(r.pid)} — ${esc(r.title)}</h2>
        <p>Domarpoäng: A <b>${r.judge ? r.judge.qualityScoreA.toFixed(1) : "?"}</b> · B <b>${r.judge ? r.judge.qualityScoreB.toFixed(1) : "?"}</b> · vinnare <b>${esc(r.judge?.winner ?? "?")}</b><br>
        <small>${esc(r.judge?.reasoning ?? "")}</small></p>
        <div class="cols">
          <div><h3>A (gammal)</h3>${o?.seo?.descriptionHtml ?? "(tom)"}<ul>${faqList(o?.tabs?.faq)}</ul></div>
          <div><h3>B (ny)</h3>${n?.seo?.descriptionHtml ?? "(tom)"}<ul>${faqList(n?.tabs?.faq)}</ul></div>
        </div>
      </section>`;
    })
    .join("");
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8">
<title>A/B — manuell granskning</title>
<style>
 body{font-family:system-ui,Segoe UI,sans-serif;margin:0;background:#0f1117;color:#e7e9ee;padding:24px 32px}
 .card{background:#161922;border:1px solid #262b39;border-radius:12px;padding:18px;margin-bottom:24px}
 .cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
 .cols>div{background:#11141c;border:1px solid #262b39;border-radius:8px;padding:14px}
 h2{margin:0 0 8px} h3{margin:0 0 8px;color:#9aa3b2} small{color:#9aa3b2}
</style></head><body>
<h1>A/B — manuell granskning (3 slumpade par)</h1>
<p class="muted">Läs igenom och kör om med <code>AB_MANUAL_CONFIRMED=1</code> för att godkänna deploy.</p>
${cards}
</body></html>`;
}

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHtml(rows: ProductResult[], avgOld: number, avgNew: number, allPass: boolean, avgQualA: number, avgQualB: number): string {
  const saving = avgOld > 0 ? (((avgOld - avgNew) / avgOld) * 100).toFixed(1) : "0";
  const cards = rows
    .map((r) => {
      const checkRows = r.checks
        .map(
          (c) => `<tr class="${c.ok ? "ok" : "bad"}">
            <td><b>${esc(c.field)}</b><br><small>${esc(c.note)}</small></td>
            <td>${esc(c.oldVal).slice(0, 1200)}</td>
            <td>${esc(c.newVal).slice(0, 1200)}</td>
            <td>${c.ratio.toFixed(2)}</td>
            <td>${c.ok ? "✓" : "✗"}</td>
          </tr>`,
        )
        .join("");
      const qual = r.judge
        ? `kvalitet (LLM-domare): A <b>${r.judge.qualityScoreA.toFixed(1)}/10</b> → B <b>${r.judge.qualityScoreB.toFixed(1)}/10</b> · vinnare <b>${esc(r.judge.winner)}</b>`
        : `kvalitet: <b>domare-fel</b>`;
      return `<section class="card ${r.pass ? "pass" : "fail"}">
        <h2>${esc(r.pid)} — ${r.pass ? "PASS" : "FAIL"}</h2>
        <p class="muted">${esc(r.title)}</p>
        <p>Kostnad: gammal <b>${ore(r.oldCostUsd).toFixed(2)} öre</b> → ny <b>${ore(r.newCostUsd).toFixed(2)} öre</b></p>
        <p>${qual}</p>
        <table><thead><tr><th>Fält</th><th>GAMMAL (3 anrop)</th><th>NY (1 anrop)</th><th>ratio</th><th>ok</th></tr></thead>
        <tbody>${checkRows}</tbody></table>
      </section>`;
    })
    .join("");

  return `<!doctype html><html lang="sv"><head><meta charset="utf-8">
<title>Fyndplats A/B — batchad pipeline</title>
<style>
 body{font-family:system-ui,Segoe UI,sans-serif;margin:0;background:#0f1117;color:#e7e9ee}
 header{padding:24px 32px;background:#161922;border-bottom:1px solid #262b39}
 .summary{font-size:18px;line-height:1.7}
 .verdict{display:inline-block;padding:4px 14px;border-radius:999px;font-weight:700}
 .verdict.pass{background:#0f5132;color:#d1e7dd} .verdict.fail{background:#842029;color:#f8d7da}
 main{padding:24px 32px;display:grid;gap:24px}
 .card{background:#161922;border:1px solid #262b39;border-radius:12px;padding:18px}
 .card.fail{border-color:#842029} .card.pass{border-color:#1c4532}
 h2{margin:0 0 4px} .muted{color:#9aa3b2;margin:0 0 10px}
 table{width:100%;border-collapse:collapse;font-size:13px}
 th,td{border:1px solid #262b39;padding:8px;text-align:left;vertical-align:top}
 th{background:#1c2130} tr.ok td{background:#10261a} tr.bad td{background:#2a1416}
 small{color:#9aa3b2}
</style></head><body>
<header>
 <h1>A/B — batchad Claude-pipeline (2026-06-01)</h1>
 <div class="summary">
   Grind: <span class="verdict ${allPass ? "pass" : "fail"}">${allPass ? "PASS — OK att deploya" : "FAIL — DEPLOYA INTE"}</span><br>
   Kostnad/import: <b>${ore(avgOld).toFixed(2)} öre</b> (gammal) → <b>${ore(avgNew).toFixed(2)} öre</b> (ny) — besparing <b>${saving}%</b><br>
   Kvalitet (LLM-domare, snitt): A <b>${avgQualA.toFixed(1)}/10</b> → B <b>${avgQualB.toFixed(1)}/10</b> — krav: B≥${QUALITY_MIN} och B inte >${QUALITY_MAX_INFERIORITY}p under A<br>
   <small>Produkter: ${rows.length} · PASS ${rows.filter((r) => r.pass).length} · FAIL ${rows.filter((r) => !r.pass).length}.
   Kostnad mätt från appens egen estimateCostUsd (speglar lib/llm/pricing.ts), ej Anthropic-konsolen. USD→SEK=${USD_TO_SEK}.
   Inputs = representativa fixturer (live-omskrap kräver AliExpress-credentials).</small>
 </div>
</header>
<main>${cards}</main>
</body></html>`;
}
