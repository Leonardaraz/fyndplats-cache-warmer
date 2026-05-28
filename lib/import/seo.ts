import { completeJson } from "../ai/claude";
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

  const result = await completeJson<SeoResult>({ system: SYSTEM, user, maxTokens: 3000 });
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
