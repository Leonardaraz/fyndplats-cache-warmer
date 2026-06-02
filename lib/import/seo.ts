import { completeJson } from "../ai/claude";
import { makeCacheKey } from "../llm/cache";
import { isThinProductInput, looksLikeStoreCopy } from "./guard";
import type { AliExpressProduct } from "./types";

export interface SeoResult {
  /** Svensk produkttitel, optimerad men <= 70 tecken. */
  title: string;
  /** Meta-beskrivning <= 160 tecken. */
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

const SYSTEM = `Du är en svensk e-handelscopywriter och SEO-expert.
Du får rådata om EN SPECIFIK produkt (ofta dålig engelska/kinesiska från AliExpress)
och ska skapa säljande, korrekt och SEO-optimerat svenskt innehåll FÖR JUST DEN PRODUKTEN.

ABSOLUTA REGLER:
- Skriv ALDRIG om butiken, sajten eller varumärket "Fyndplats". Nämn aldrig "Fyndplats",
  "Välkommen till ...", "bästa deals", "din destination" eller liknande butiks-/startsidescopy.
- Innehållet ska handla om produkten - aldrig om webshopen.
- Hitta aldrig på tekniska specifikationer som inte framgår av källan.
- Om råtiteln är tom eller intetsägande: hitta INTE på en produkt. Använd råtiteln som den är.
Svara ENDAST med giltig JSON enligt schemat.`;

/**
 * Bygger ett SEO-resultat direkt ur rådatan, utan LLM-anrop. Används som
 * fail-open (när Claude+Gemini failar eller datan är tunn) OCH när användaren
 * stängt av SEO/översättning via feature-flaggor.
 */
export function buildFallbackSeo(product: AliExpressProduct): SeoResult {
  // Bug 2026-06-02: rå-läge gav bara meta-description-boilerplate i Wix.
  // Föredra full HTML-beskrivning (descriptionHtml) -> råtext (rawDescription)
  // -> titel-fallback. Det första giltiga blir Wix:s description.
  const descHtml = (product.descriptionHtml || "").trim();
  const rawDesc = (product.rawDescription || "").trim();
  const html = descHtml
    ? descHtml.slice(0, 8000)
    : rawDesc
      ? `<p>${rawDesc.slice(0, 1000)}</p>`
      : `<p>${product.rawTitle.slice(0, 500)}</p>`;
  return clampSeo(
    {
      title: product.rawTitle.slice(0, 70),
      metaDescription: (rawDesc || product.rawTitle).slice(0, 160),
      descriptionHtml: html,
      slug: product.rawTitle ? "" : "produkt",
      suggestedCategory: "",
      imageAltTexts: product.imageUrls.map(() => product.rawTitle),
    },
    product.imageUrls.length,
  );
}

export async function generateSeo(product: AliExpressProduct): Promise<SeoResult> {
  const user = `Skapa svenskt SEO-innehåll för denna produkt. Svara med JSON:
{
  "title": "<=70 tecken, säljande svensk titel",
  "metaDescription": "<=160 tecken",
  "descriptionHtml": "<p>...</p> säljande svensk beskrivning i enkel HTML",
  "slug": "url-slug-med-bindestreck",
  "suggestedCategory": "förslag på kategori",
  "imageAltTexts": ["alt för bild 1", "alt för bild 2", ...]
}

Antal bilder: ${product.imageUrls.length}
Råtitel: ${product.rawTitle}
Råbeskrivning: ${product.rawDescription.slice(0, 4000)}`;

  // Cache-key på produkt-id + rå-titel + första 500 tecken av rå-beskrivning.
  // supplierProductId ingår så att TVÅ OLIKA produkter aldrig kan kollidera på
  // samma nyckel (tidigare kollapsade tomma skrapningar till EN konstant nyckel
  // -> en dålig generering cachades och spelades upp för alla - bug 2026-05-31).
  // Samma AliExpress-produkt re-importad -> fortfarande cache-träff.
  const cacheKey = makeCacheKey({
    op: "generateSeo",
    name: product.rawTitle,
    description: product.rawDescription,
    dependencyFingerprint: `pid=${product.supplierProductId}|imgCount=${product.imageUrls.length}`,
  });

  // Fail-open: om både Claude (credit balance) och Gemini failar, falla
  // tillbaka till rå-titeln så importen inte kraschar - Leonard kan redigera
  // SEO i Wix efteråt. max_tokens sänkt från 3000 -> 2000 (beskrivningen behöver
  // sällan mer än ~6kB svensk HTML).
  const failOpen: SeoResult = {
    title: product.rawTitle.slice(0, 70),
    metaDescription: product.rawTitle.slice(0, 160),
    descriptionHtml: `<p>${product.rawDescription.slice(0, 1000)}</p>`,
    slug: "produkt",
    suggestedCategory: "",
    imageAltTexts: product.imageUrls.map(() => product.rawTitle),
  };

  // Skydd 1: om produktdatan är för tunn (misslyckad skrapning) - anropa INTE
  // LLM:en. Utan produktkontext genererar modellen butikscopy om Fyndplats
  // istället för produktinnehåll. Returnera fail-open direkt.
  if (isThinProductInput(product.rawTitle)) {
    console.warn(
      `[seo] Tunn produktdata (pid=${product.supplierProductId}, titel="${product.rawTitle}") - hoppar över SEO-generering.`,
    );
    return clampSeo(failOpen, product.imageUrls.length);
  }

  const result = await completeJson<SeoResult>({
    system: SYSTEM,
    user,
    maxTokens: 2000,
    op: "generateSeo",
    cacheKey,
    failOpen,
  });

  // Skydd 2: avvisa output som ser ut som butiks-/startsidescopy istället för
  // produktinnehåll. Detta fångar kontaminationen oavsett orsak (tunn input,
  // poisoned cache, modell-hallucination) innan den når Wix.
  if (looksLikeStoreCopy(result.title) || looksLikeStoreCopy(result.descriptionHtml)) {
    console.warn(
      `[seo] LLM-output ser ut som butikscopy (pid=${product.supplierProductId}, titel="${result.title}") - använder fail-open.`,
    );
    return clampSeo(failOpen, product.imageUrls.length);
  }

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
