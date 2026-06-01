// Sammanslaget Claude-anrop för import-pipelinen (kostnadsoptimering 2026-06-01).
//
// Bakgrund: importen gjorde tidigare TRE separata text-Claude-anrop per produkt —
// generateSeo (Sonnet 4.6), suggestCategory (Haiku) och generateTabs (Haiku).
// Det är 3× request-overhead och Sonnet-output dominerade kostnaden. Den här
// modulen slår ihop dem till ETT strukturerat JSON-anrop (#1) som returnerar
// SEO + kategori + flikar i en sväng, via en billigare modell (Haiku som default,
// override CLAUDE_BATCH_MODEL).
//
// Allt går genom completeJsonRouted så vi ärver persistent cache (#3), prompt-
// caching (#2), daglig budgetcap och Gemini-fallback. Vision (analyzeImages) är
// AVSIKTLIGT kvar som ett separat anrop (Sonnet) — det rör vi inte här.
//
// Robusthet (#4): vid trunkering (max_tokens) eller ogiltig JSON faller vi
// tillbaka på de befintliga, testade enskilda anropen (generateSeo/
// suggestCategory/generateTabs). Det sammanslagna flödet blir därmed aldrig
// SÄMRE på motståndskraft än det gamla — bara billigare i normalfallet.

import { completeJsonRouted, suggestCategory, TEXT_MODEL } from "../claude/client";
import { makeCacheKey } from "../llm/cache";
import { looksLikeStoreCopy, isThinProductInput } from "./guard";
import { buildFallbackSeo, clampSeo, generateSeo, type SeoResult } from "./seo";
import { generateTabs, isCareRelevant, type GeneratedTabs } from "./tabs";
import type { CategorySuggestion, CollectionOption } from "../claude/types";
import type { AliExpressProduct, FeatureFlags } from "./types";

export interface ProductContent {
  seo: SeoResult;
  category: CategorySuggestion;
  tabs: GeneratedTabs;
}

/** Sammanslagen modell — overrideas via CLAUDE_BATCH_MODEL. Default = Haiku 4.5. */
export function batchModel(): string {
  return process.env.CLAUDE_BATCH_MODEL || TEXT_MODEL;
}

// Trunkering-skydd: ett produkt-svar (svensk beskrivning + 3–5 FAQ + specs +
// alt-texter) ligger normalt långt under 4000 tokens. 4000 ger marginal även
// för produkter med många varianter/specs utan att betala för oanvänd output.
const BATCH_MAX_TOKENS = 4000;

const SYSTEM = `Du är en svensk e-handelscopywriter, SEO-expert och kategoriserare för en webshop
som säljer prylar och heminredning (källprodukter från AliExpress, ofta dålig engelska/kinesiska).
Du får rådata om EN SPECIFIK produkt och ska i ETT svar producera ALLT säljande svenskt innehåll
för JUST DEN produkten: SEO-text, kategorival och de strukturerade PDP-flikarna.

ABSOLUTA REGLER:
- Skriv ALDRIG om butiken, sajten eller varumärket "Fyndplats". Inga "Välkommen till …",
  "bästa deals", "din destination" eller liknande butiks-/startsidescopy. Innehållet ska handla
  om PRODUKTEN, aldrig om webshopen.
- Hitta ALDRIG på tekniska specifikationer, mått eller material som inte framgår av källan.
- Om råtiteln är tom/intetsägande: hitta INTE på en produkt — använd råtiteln som den är.
- Översätt specifikationer och paketinnehåll till naturlig svenska (både etikett och värde).
- descriptionHtml ska vara FYLLIG och säljande (minst ~120 ord): 2–3 inledande <p>-stycken som
  målar upp produkten och dess nytta, följt av en <ul> med 5–8 <li> som lyfter konkreta fördelar/
  egenskaper, och ett avslutande <p> med användningsområden. Enkel HTML (<p>, <strong>, <ul>, <li>).
  Skriv lika rikt och utförligt som en duktig copywriter — komprimera INTE till en enda mening.
- FAQ ska vara konkreta frågor en svensk kund faktiskt ställer, med korta ärliga svar grundade i
  rådatan. Spekulera inte utan underlag. Krav: 3–5 FAQ.
- Kategori: välj den BÄST matchande slug:en ur listan, eller null om osäker. Var konservativ med
  confidence (>0.85 uppenbart, 0.6–0.85 tydligt, 0.4–0.6 gissning, <0.4 → null).
- careHtml (Användning och skötsel): fyll i ENDAST om produkten hör hemma i Kök, Skönhet eller
  Elektronik — annars null.
Svara ENDAST med giltig JSON enligt schemat.`;

function buildUser(
  product: AliExpressProduct,
  collections: CollectionOption[],
): string {
  const colsText = collections.length
    ? collections
        .map(
          (c) =>
            `- slug: "${c.slug}" | namn: "${c.name}"${c.description ? ` | beskrivning: ${c.description}` : ""}`,
        )
        .join("\n")
    : "(inga kategorier tillgängliga — sätt collection_slug=null)";

  const specsText = Object.entries(product.specifications || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
    .slice(0, 3000);
  const featuresText = (product.features || []).join("\n").slice(0, 1500);
  const pkgText = (product.packageContents || []).join("\n").slice(0, 800);

  return `Tillgängliga kategorier:
${colsText}

Produktdata:
Antal bilder: ${product.imageUrls.length}
Råtitel: ${product.rawTitle}
Råbeskrivning: ${product.rawDescription.slice(0, 4000)}

Specifikationer (råa):
${specsText || "(inga)"}

Säljpunkter (råa):
${featuresText || "(inga)"}

Paketinnehåll (råt):
${pkgText || "(okänt)"}

Svara med JSON enligt EXAKT detta schema:
{
  "seo": {
    "title": "≤70 tecken, säljande svensk titel",
    "metaDescription": "≤160 tecken",
    "descriptionHtml": "<p>stycke 1</p><p>stycke 2</p><ul><li>fördel</li>…(5–8)</ul><p>användningsområden</p> — minst ~120 ord, fyllig svensk HTML",
    "slug": "url-slug-med-bindestreck",
    "imageAltTexts": ["alt för bild 1", "..."]
  },
  "category": { "collection_slug": "<en av slugs ovan eller null>", "confidence": 0.0-1.0, "reason": "kort svensk motivering" },
  "tabs": {
    "specs": [{"label": "svensk etikett", "value": "svenskt värde"}],
    "packageContents": ["svensk rad", "..."],
    "faq": [{"q": "Fråga på svenska?", "a": "Kort svar."}],
    "careHtml": "<p>2–3 stycken om användning och skötsel</p> eller null"
  }
}
Antal imageAltTexts MÅSTE vara ${product.imageUrls.length}. 3–5 FAQ. Översätt alla specs/paketrader.`;
}

export interface RawBatch {
  seo?: {
    title?: string;
    metaDescription?: string;
    descriptionHtml?: string;
    slug?: string;
    imageAltTexts?: string[];
  };
  category?: { collection_slug?: string | null; confidence?: number; reason?: string };
  tabs?: {
    specs?: { label?: string; value?: string }[];
    packageContents?: string[];
    faq?: { q?: string; a?: string }[];
    careHtml?: string | null;
  };
}

/**
 * Genererar ALLT produkter-innehåll i ett enda Claude-anrop. Faller tillbaka på
 * de tre separata anropen vid trunkering/parsfel eller om datan är för tunn.
 */
export async function generateProductContent(
  product: AliExpressProduct,
  collections: CollectionOption[],
  flags?: FeatureFlags,
): Promise<ProductContent> {
  const imageCount = product.imageUrls.length;

  // Skydd 1: tunn produktdata → ingen LLM (skulle generera butikscopy). Bygg
  // allt från fallbacks precis som det gamla flödet.
  if (isThinProductInput(product.rawTitle)) {
    console.warn(
      `[generate] Tunn produktdata (pid=${product.supplierProductId}) — hoppar över sammanslaget anrop.`,
    );
    return legacyFallback(product, collections, flags, /*skipSeoLlm*/ true);
  }

  const cacheKey = makeCacheKey({
    op: "generateProductContent",
    name: product.rawTitle,
    description: product.rawDescription,
    dependencyFingerprint:
      `pid=${product.supplierProductId}|img=${imageCount}|model=${batchModel()}` +
      `|cols=${collections.map((c) => c.slug).sort().join(",")}` +
      `|specs=${JSON.stringify(product.specifications || {}).slice(0, 1200)}` +
      `|feat=${(product.features || []).join("|").slice(0, 500)}`,
  });

  void imageCount;
  let raw: RawBatch | null = null;
  try {
    // INGEN failOpen: vid total provider-/parsfel kastar routern → vi fångar och
    // faller tillbaka på det gamla 3-anrops-flödet (bättre än rå failOpen-text).
    const req = buildBatchRequest(product, collections);
    raw = await completeJsonRouted<RawBatch>({
      op: "generateProductContent",
      cacheKey,
      system: req.system,
      user: req.user,
      maxTokens: req.maxTokens,
      model: req.model,
    });
  } catch (err) {
    console.warn(
      `[generate] Sammanslaget anrop failade (pid=${product.supplierProductId}): ` +
        `${err instanceof Error ? err.message : String(err)} — faller tillbaka på separata anrop.`,
    );
    return legacyFallback(product, collections, flags, /*skipSeoLlm*/ false);
  }

  // Skydd 2: ofullständigt/trunkerat svar (saknar kärnfält) → 3-anrops-fallback.
  if (!isComplete(raw)) {
    console.warn(
      `[generate] Sammanslaget svar ofullständigt (pid=${product.supplierProductId}) — faller tillbaka på separata anrop.`,
    );
    return legacyFallback(product, collections, flags, /*skipSeoLlm*/ false);
  }

  return normalizeProductContent(raw, product, collections);
}

/**
 * Bygger Claude-anropets system/user/modell/max_tokens för en produkt. Delas av
 * det direkta flödet (completeJsonRouted) OCH Batch API-flödet (lib/claude/batch.ts)
 * så att prompten är IDENTISK oavsett transport (#8).
 */
export function buildBatchRequest(
  product: AliExpressProduct,
  collections: CollectionOption[],
): { system: string; user: string; model: string; maxTokens: number } {
  return {
    system: SYSTEM,
    user: buildUser(product, collections),
    model: batchModel(),
    maxTokens: BATCH_MAX_TOKENS,
  };
}

/**
 * Normaliserar ett (komplett) råsvar till ProductContent — inkl. butikscopy-skyddet.
 * Delas av direkt- och Batch-flödet. Anroparen ska ha kört isComplete() först;
 * ofullständiga svar bör falla tillbaka på de separata anropen.
 */
export function normalizeProductContent(
  raw: RawBatch,
  product: AliExpressProduct,
  collections: CollectionOption[],
): ProductContent {
  const imageCount = product.imageUrls.length;
  const seo = normalizeSeo(raw, product, imageCount);

  // Skydd: avvisa butiks-/startsidescopy (samma som seo.ts gör) → fail-open SEO.
  if (looksLikeStoreCopy(seo.title) || looksLikeStoreCopy(seo.descriptionHtml)) {
    console.warn(
      `[generate] Sammanslagen output ser ut som butikscopy (pid=${product.supplierProductId}) — använder fallback-SEO.`,
    );
    return {
      seo: clampSeo(buildFallbackSeo(product), imageCount),
      category: normalizeCategory(raw, collections),
      tabs: normalizeTabs(raw, collections, product),
    };
  }

  return {
    seo,
    category: normalizeCategory(raw, collections),
    tabs: normalizeTabs(raw, collections, product),
  };
}

/** Kärnfält måste finnas — annars behandlas svaret som trunkerat. */
export function isComplete(raw: RawBatch): boolean {
  return Boolean(
    raw?.seo &&
      typeof raw.seo.title === "string" &&
      typeof raw.seo.descriptionHtml === "string" &&
      raw.tabs &&
      Array.isArray(raw.tabs.faq),
  );
}

function normalizeSeo(raw: RawBatch, product: AliExpressProduct, imageCount: number): SeoResult {
  const s = raw.seo ?? {};
  return clampSeo(
    {
      title: s.title ?? product.rawTitle,
      metaDescription: s.metaDescription ?? "",
      descriptionHtml: s.descriptionHtml ?? `<p>${product.rawDescription.slice(0, 1000)}</p>`,
      slug: s.slug ?? "",
      suggestedCategory: "",
      imageAltTexts: Array.isArray(s.imageAltTexts) ? s.imageAltTexts.map((a) => String(a)) : [],
    },
    imageCount,
  );
}

function normalizeCategory(raw: RawBatch, collections: CollectionOption[]): CategorySuggestion {
  const c = raw.category ?? {};
  const validSlugs = new Set(collections.map((col) => col.slug));
  const slug = c.collection_slug && validSlugs.has(c.collection_slug) ? c.collection_slug : null;
  const confidence = clamp01(Number(c.confidence ?? 0));
  return {
    collectionSlug: slug,
    confidence: slug ? confidence : 0,
    reason: (c.reason ?? "").slice(0, 240),
  };
}

function normalizeTabs(
  raw: RawBatch,
  collections: CollectionOption[],
  product: AliExpressProduct,
): GeneratedTabs {
  const t = raw.tabs ?? {};
  const fallbackSpecs = Object.entries(product.specifications || {}).map(([label, value]) => ({
    label,
    value,
  }));

  const specs = Array.isArray(t.specs)
    ? t.specs
        .filter((s) => s && typeof s.label === "string" && typeof s.value === "string")
        .map((s) => ({ label: s.label!.trim(), value: s.value!.trim() }))
        .filter((s) => s.label && s.value)
    : fallbackSpecs;

  const packageContents = Array.isArray(t.packageContents)
    ? t.packageContents
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim())
    : product.packageContents || [];

  const faq = Array.isArray(t.faq)
    ? t.faq
        .filter((f) => f && typeof f.q === "string" && typeof f.a === "string")
        .map((f) => ({ q: f.q!.trim(), a: f.a!.trim() }))
        .filter((f) => f.q && f.a)
        .slice(0, 5)
    : [];

  // careHtml bara för relevant kategori — annars null (samma regel som tabs.ts).
  const slug = normalizeCategory(raw, collections).collectionSlug;
  const categoryName = collections.find((c) => c.slug === slug)?.name ?? null;
  const careHtml =
    isCareRelevant(categoryName) && typeof t.careHtml === "string" && t.careHtml.trim()
      ? t.careHtml.trim()
      : null;

  return {
    specs: specs.length ? specs : fallbackSpecs,
    packageContents,
    faq,
    careHtml,
  };
}

/**
 * Det gamla 3-anrops-flödet (oförändrad kvalitet/kostnad) använt som fallback.
 * skipSeoLlm=true vid tunn data → buildFallbackSeo utan LLM (precis som seo.ts).
 */
async function legacyFallback(
  product: AliExpressProduct,
  collections: CollectionOption[],
  flags: FeatureFlags | undefined,
  skipSeoLlm: boolean,
): Promise<ProductContent> {
  const runSeo = flags?.seo !== false || flags?.translate !== false;
  const seo =
    skipSeoLlm || !runSeo
      ? clampSeo(buildFallbackSeo(product), product.imageUrls.length)
      : await generateSeo(product);

  const runCategory = flags?.autoCategorize !== false;
  const suggestion: CategorySuggestion =
    runCategory && collections.length
      ? await suggestCategory(seo.title, seo.descriptionHtml || product.rawDescription, collections)
      : { collectionSlug: null, confidence: 0, reason: "" };

  const categoryName = collections.find((c) => c.slug === suggestion.collectionSlug)?.name ?? null;

  const tabs = await generateTabs({
    productId: product.supplierProductId,
    name: seo.title || product.rawTitle,
    categoryName,
    specifications: product.specifications,
    features: product.features,
    packageContents: product.packageContents,
  });

  return { seo, category: suggestion, tabs };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
