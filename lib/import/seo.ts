import { completeJson } from "../ai/claude";
import { makeCacheKey } from "../llm/cache";
import { isThinProductInput, looksLikeStoreCopy, stripMarketplaceSuffix } from "./guard";
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
  // Marknadsplatsens namn ur titeln FÖRST — i rå-läget blir den här titeln
  // produktens namn i Wix rakt av, och kapningen nedan ska lägga sina 70 tecken
  // på produkten, inte på "- AliExpress 1503".
  //
  // `|| product.rawTitle` är en invariant, inte pynt: en tom titel här blir en
  // produkt UTAN namn i Wix (och kolliderar dessutom på slugen "produkt").
  // Hellre en smutsig titel som går att rätta i efterhand än en namnlös.
  const titel = stripMarketplaceSuffix(product.rawTitle) || product.rawTitle;
  // Bug 2026-06-02: rå-läge gav bara meta-description-boilerplate i Wix.
  // Föredra full HTML-beskrivning (descriptionHtml) -> råtext (rawDescription)
  // -> titel-fallback. Det första giltiga blir Wix:s description.
  const descHtml = (product.descriptionHtml || "").trim();
  const rawDesc = (product.rawDescription || "").trim();
  const html = descHtml
    ? descHtml.slice(0, 8000)
    : rawDesc
      ? `<p>${rawDesc.slice(0, 1000)}</p>`
      : `<p>${titel.slice(0, 500)}</p>`;
  return clampSeo(
    {
      title: truncateAtWord(titel, 70),
      metaDescription: truncateAtWord(rawDesc || titel, 160),
      descriptionHtml: html,
      slug: titel ? "" : "produkt",
      suggestedCategory: "",
      imageAltTexts: product.imageUrls.map(() => titel),
    },
    product.imageUrls.length,
  );
}

export async function generateSeo(product: AliExpressProduct): Promise<SeoResult> {
  // Samma tvätt som i rå-läget: modellen ska inte se marknadsplatsens namn i
  // råtiteln (den har ekat tillbaka det i genererade titlar), och fail-open
  // nedan använder titeln som produktnamn. Aldrig tom — se buildFallbackSeo.
  const titel = stripMarketplaceSuffix(product.rawTitle) || product.rawTitle;
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
Råtitel: ${titel}
Råbeskrivning: ${product.rawDescription.slice(0, 4000)}`;

  // Cache-key på produkt-id + rå-titel + första 500 tecken av rå-beskrivning.
  // `titel` (tvättad), inte råtiteln: prompten innehåller den tvättade titeln,
  // så en nyckel på råtiteln hade spelat upp ett svar som genererats ur en
  // annan indata. Kostar en omgenerering per produkt, en gång.
  // supplierProductId ingår så att TVÅ OLIKA produkter aldrig kan kollidera på
  // samma nyckel (tidigare kollapsade tomma skrapningar till EN konstant nyckel
  // -> en dålig generering cachades och spelades upp för alla - bug 2026-05-31).
  // Samma AliExpress-produkt re-importad -> fortfarande cache-träff.
  const cacheKey = makeCacheKey({
    op: "generateSeo",
    name: titel,
    description: product.rawDescription,
    dependencyFingerprint: `pid=${product.supplierProductId}|imgCount=${product.imageUrls.length}`,
  });

  // Fail-open: om både Claude (credit balance) och Gemini failar, falla
  // tillbaka till rå-titeln så importen inte kraschar - Leonard kan redigera
  // SEO i Wix efteråt. max_tokens sänkt från 3000 -> 2000 (beskrivningen behöver
  // sällan mer än ~6kB svensk HTML).
  const failOpen: SeoResult = {
    title: truncateAtWord(titel, 70),
    metaDescription: truncateAtWord(titel, 160),
    descriptionHtml: `<p>${product.rawDescription.slice(0, 1000)}</p>`,
    slug: "produkt",
    suggestedCategory: "",
    imageAltTexts: product.imageUrls.map(() => titel),
  };

  // Skydd 1: om produktdatan är för tunn (misslyckad skrapning) - anropa INTE
  // LLM:en. Utan produktkontext genererar modellen butikscopy om Fyndplats
  // istället för produktinnehåll. Returnera fail-open direkt.
  // RÅtiteln, inte den tvättade: frågan är "gick skrapningen igenom", inte
  // "blev titeln kort när suffixet försvann". "Lampa - AliExpress 1503" är en
  // fullgod produkt vars tvättade titel är 5 tecken — den ska generera SEO som
  // vanligt. Loggen visar också råtiteln, eftersom det är den kontaminerade
  // indatan en operatör behöver se.
  if (isThinProductInput(product.rawTitle)) {
    console.warn(
      `[seo] Tunn produktdata (pid=${product.supplierProductId}, r\u00e5titel="${product.rawTitle}") - hoppar över SEO-generering.`,
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

/**
 * Kapar vid ORDGRÄNS, inte mitt i ett ord.
 *
 * Måleritältet 2026-08-18: rå-titeln kapades på tecken 70 och produkten hette
 * "SucceBuy Inflatable Paint Booth Inflatable Spray Booth with Powerful B" —
 * i produktnamnet, i seoTitle OCH i og:title. Ett avhugget ord ser trasigt ut
 * på ett sätt en kortare titel aldrig gör.
 *
 * Faller tillbaka på hård kapning när det inte finns något blanksteg att kapa
 * vid (ett enda långt ord) eller när ordgränsen skulle kasta bort mer än
 * hälften av utrymmet — då är en kort avhuggen titel bättre än en tom.
 */
export function truncateAtWord(s: string, max: number): string {
  const t = (s ?? "").trim();
  if (t.length <= max) return t;
  const hard = t.slice(0, max);
  const lastSpace = hard.lastIndexOf(" ");
  const cut = lastSpace > max / 2 ? hard.slice(0, lastSpace) : hard;
  // Skiljetecken som blir hängande efter kapningen ser ut som ett fel.
  return cut.replace(/[\s,;:.\-–—/&]+$/u, "").trimEnd();
}

function truncate(s: string, max: number): string {
  return truncateAtWord(s, max);
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
