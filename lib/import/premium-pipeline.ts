// Premium-pipeline-orkestrering: knyter ihop komponent 1, 2, 4, 5 och 6 till ETT
// ProductContent (samma form som det batchade flödet) + en kvalitetsdom.
//
// Flöde (premium-läget, lib/import/quality-mode.ts):
//   1. Opus multi-pass-beskrivning (draft → self-critique → rewrite). [generate-premium]
//   2. Kategori via befintliga suggestCategory (Haiku räcker för "välj ur lista").
//   3. Flikar: Haiku översätter specs/paket (generateTabs) — men FAQ:n ersätts av
//      den context-aware Opus-FAQ:n som läser beskrivning + recensioner. [faq-gen]
//   4. SEO-meta: 3 varianter + judge väljer bästa CTR. [seo-gen]
//   5. Kvalitets-judge 1–10. <tröskel → en extra Opus-förfining + ny judge. [quality-judge]
//
// Bild-rankingen (komponent 3) körs SEPARAT och parallellt i pipeline.ts (den behöver
// bara bild-URL:erna), precis som standard-bildanalysen.
//
// Allt ärver cache/budgetcap/cost-stats via completeJsonRouted. Thin-input-skydd:
// är produktdatan för tunn kör vi INGEN Opus (skulle hitta på copy) utan faller
// tillbaka på fallback-SEO + råa flikar.

import { generatePremiumDescription, refinePremiumDescription } from "./generate-premium";
import { generatePremiumFaq, type FaqReviewHint } from "./faq-gen";
import { generateSeoMeta } from "./seo-gen";
import { judgeQuality, type QualityVerdict } from "./quality-judge";
import { suggestCategory } from "../claude/client";
import { generateTabs, isCareRelevant } from "./tabs";
import { buildFallbackSeo, clampSeo } from "./seo";
import { isThinProductInput } from "./guard";
import type { ProductContent } from "./generate";
import type { AliExpressProduct } from "./types";
import type { CategorySuggestion, CollectionOption } from "../claude/types";

export interface PremiumContentResult {
  content: ProductContent;
  quality: QualityVerdict;
  /** True om en extra förfiningsrunda kördes (judgen underkände första domen). */
  refined: boolean;
  /** Self-critique-texten (audit). */
  critique: string;
  /** SEO-meta-varianterna som A/B:ades (audit). */
  seoMetaVariants: string[];
}

export async function generatePremiumContent(
  product: AliExpressProduct,
  collections: CollectionOption[],
  opts?: { reviews?: FaqReviewHint[] },
): Promise<PremiumContentResult> {
  // Thin-input-skydd: utan riktig produktkontext genererar Opus butikscopy. Falla
  // tillbaka på rå SEO + råa flikar (ingen Opus) — judgen sätts under tröskeln så
  // produkten flaggas för manuell polering istället för att auto-publiceras.
  if (isThinProductInput(product.rawTitle)) {
    return thinFallback(product);
  }

  // 1. Multi-pass-beskrivning (Opus).
  const { seo: draftSeo, critique } = await generatePremiumDescription(product);

  // 2. Kategori (Haiku) — behövs innan flikarna (styr "Användning och skötsel").
  const category: CategorySuggestion = collections.length
    ? await suggestCategory(draftSeo.title, draftSeo.descriptionHtml || product.rawDescription, collections)
    : { collectionSlug: null, confidence: 0, reason: "" };
  const categoryName = collections.find((c) => c.slug === category.collectionSlug)?.name ?? null;

  // 3 + 4 parallellt: Haiku-flikar (specs/paket/skötsel), Opus-FAQ, SEO-meta-A/B.
  const [tabsBase, premiumFaq, seoMeta] = await Promise.all([
    generateTabs({
      productId: product.supplierProductId,
      name: draftSeo.title || product.rawTitle,
      categoryName,
      specifications: product.specifications,
      features: product.features,
      packageContents: product.packageContents,
    }),
    generatePremiumFaq({
      product,
      descriptionHtml: draftSeo.descriptionHtml,
      categoryName,
      reviews: opts?.reviews,
    }),
    generateSeoMeta({ product, title: draftSeo.title, descriptionHtml: draftSeo.descriptionHtml }),
  ]);

  // FAQ: föredra den context-aware Opus-FAQ:n; faller tillbaka på Haiku-FAQ vid tom.
  const faq = premiumFaq.length ? premiumFaq : tabsBase.faq;
  // careHtml bara för relevant kategori (samma regel som tabs.ts/generate.ts).
  const careHtml = isCareRelevant(categoryName) ? tabsBase.careHtml : null;

  let seo = { ...draftSeo, metaDescription: seoMeta.chosen };
  let tabs = { specs: tabsBase.specs, packageContents: tabsBase.packageContents, faq, careHtml };

  // 5. Kvalitets-judge med strikt grind. <tröskel → en extra Opus-förfining + ny judge.
  let quality = await judgeQuality({
    product,
    title: seo.title,
    metaDescription: seo.metaDescription,
    descriptionHtml: seo.descriptionHtml,
    faq,
  });
  let refined = false;
  if (!quality.passed) {
    refined = true;
    const improvedSeo = await refinePremiumDescription(product, seo, quality.feedback);
    seo = { ...improvedSeo, metaDescription: seo.metaDescription };
    quality = await judgeQuality({
      product,
      title: seo.title,
      metaDescription: seo.metaDescription,
      descriptionHtml: seo.descriptionHtml,
      faq,
    });
  }

  return {
    content: { seo, category, tabs },
    quality,
    refined,
    critique,
    seoMetaVariants: seoMeta.variants,
  };
}

/** Rå fallback för tunn produktdata (ingen Opus) — flaggas alltid för manuell polering. */
function thinFallback(product: AliExpressProduct): PremiumContentResult {
  const seo = clampSeo(buildFallbackSeo(product), product.imageUrls.length);
  return {
    content: {
      seo,
      category: { collectionSlug: null, confidence: 0, reason: "" },
      tabs: {
        specs: Object.entries(product.specifications || {}).map(([label, value]) => ({ label, value })),
        packageContents: product.packageContents || [],
        faq: [],
        careHtml: null,
      },
    },
    quality: { score: 0, passed: false, feedback: "Tunn produktdata — premium hoppades över." },
    refined: false,
    critique: "",
    seoMetaVariants: [],
  };
}
