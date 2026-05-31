import { completeJson } from "../ai/claude";
import { makeCacheKey } from "../llm/cache";
import type { AliExpressProduct } from "./types";

export interface SeoResult {
  /** Svensk produkttitel, optimerad men ≤ 70 tecken. */
  title: string;
  /** Meta-beskrivning ≤ 160 tecken. */
  metaDescription: string;
  /** Säljande HTML-beskrivning på svenska. */
  descriptionHtml: string;
  /** URL-slug (gemener, bindestreck). */
  slug: string;
  /** Förslag på Wix-kategori. */
  suggestedCategory: string;
  /** Svenska alt-texter, en per bild i samma ordning som imageUrls. */
  imageAltTexts: string[];
}

const SYSTEM = `Du är en svensk e-handelscopywriter och SEO-expert för en webshop (Fyndplats).
Du får rådata om en produkt (ofta dålig engelska/kinesiska från AliExpress) och ska
skapa säljande, korrekt och SEO-optimerat svenskt innehåll. Hitta aldrig på tekniska
specifikationer som inte framgår av källan. Svara ENDAST med giltig JSON enligt schemat.`;

export async function generateSeo(product: AliExpressProduct): Promise<SeoResult> {
  const user = `Skapa svenskt SEO-innehåll för denna produkt. Svara med JSON:
{
  "title": "≤70 tecken, säljande svensk titel",
  "metaDescription": "≤160 tecken",
  "descriptionHtml": "<p>...</p> säljande svensk beskrivning i enkel HTML",
  "slug": "url-slug-med-bindestreck",
  "suggestedCategory": "förslag på kategori",
  "imageAltTexts": ["alt för bild 1", "alt för bild 2", ...]
}

Antal bilder: ${product.imageUrls.length}
Råtitel: ${product.rawTitle}
Råbeskrivning: ${product.rawDescription.slice(0, 4000)}`;

  // Cache-key på rå-titel + första 500 tecken av rå-beskrivning. Samma
  // AliExpress-produkt re-importad → ingen ny SEO-generering (besparing när
  // Leonard kör om en import för att uppdatera priser/variant-urval).
  const cacheKey = makeCacheKey({
    op: "generateSeo",
    name: product.rawTitle,
    description: product.rawDescription,
    dependencyFingerprint: `imgCount=${product.imageUrls.length}`,
  });

  // Fail-open: om både Claude (credit balance) och Gemini failar, falla
  // tillbaka till rå-titeln så importen inte kraschar — Leonard kan redigera
  // SEO i Wix efteråt. max_tokens sänkt från 3000 → 2000 (beskrivningen behöver
  // sällan mer än ~6kB svensk HTML).
  const failOpen: SeoResult = {
    title: product.rawTitle.slice(0, 70),
    metaDescription: product.rawTitle.slice(0, 160),
    descriptionHtml: `<p>${product.rawDescription.slice(0, 1000)}</p>`,
    slug: "produkt",
    suggestedCategory: "",
    imageAltTexts: product.imageUrls.map(() => product.rawTitle),
  };

  const result = await completeJson<SeoResult>({
    system: SYSTEM,
    user,
    maxTokens: 2000,
    op: "generateSeo",
    cacheKey,
    failOpen,
  });
  return clampSeo(result, product.imageUrls.length);
}

/** Hård validering av längder + antal alt-texter (LLM:en respekterar inte alltid gränser). */
export function clampSeo(seo: SeoResult, imageCount: number): SeoResult {
  const alts = [...(seo.imageAltTexts ?? [])];
  while (alts.length < imageCount) alts.push(seo.title);
  return {
    title: truncate(seo.title, 70),
    metaDescription: truncate(seo.metaDescription, 160),
    descriptionHtml: seo.descriptionHtml,
    slug: slugify(seo.slug || seo.title),
    suggestedCategory: seo.suggestedCategory ?? "",
    imageAltTexts: alts.slice(0, imageCount),
  };
}

function truncate(s: string, max: number): string {
  const t = (s ?? "").trim();
  return t.length <= max ? t : t.slice(0, max).trimEnd();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
