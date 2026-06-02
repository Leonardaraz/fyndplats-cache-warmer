// Premium-beskrivning: Opus multi-pass self-critique (komponent 1 + 2).
//
// Flöde (3 Opus-anrop, ~3× tokens mot ett vanligt anrop):
//   1. draftDescription   — Opus skriver första utkastet med utförlig prompt +
//                           brand voice (system = brandVoiceSystemPrefix, cachad).
//   2. critiqueDescription — en ANNAN Opus-call kritiserar utkastet hårt: vad är
//                            generiskt? var fattas USP? finns en säljig hook? känsla?
//   3. rewriteDescription  — Opus skriver om baserat på kritiken.
//
// Allt går via completeJsonRouted (Opus-modellen) → ärver persistent cache, daglig
// budgetcap och cost-stats (op-namnen syns per-rad i /admin/llm-usage). Fail-open:
// vid fel på något steg faller vi tillbaka på det bästa vi har (draft, annars
// buildFallbackSeo) så premium-import aldrig kraschar.

import { completeJsonRouted, PREMIUM_TEXT_MODEL } from "../claude/client";
import { brandVoiceSystemPrefix } from "../claude/brand-voice";
import { makeCacheKey } from "../llm/cache";
import { buildFallbackSeo, clampSeo, type SeoResult } from "./seo";
import { looksLikeStoreCopy } from "./guard";
import type { AliExpressProduct } from "./types";

/** Premium-modell — Opus som default, override CLAUDE_PREMIUM_MODEL. */
export function premiumModel(): string {
  return PREMIUM_TEXT_MODEL;
}

export interface PremiumDescription {
  seo: SeoResult;
  /** Kritiken från steg 2 (sparas i audit för spårbarhet/felsökning). */
  critique: string;
}

/** Gemensam produkt-fakta-text som alla premium-prompter delar (samma underlag). */
export function productFactsText(product: AliExpressProduct): string {
  const specsText = Object.entries(product.specifications || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
    .slice(0, 3000);
  const featuresText = (product.features || []).join("\n").slice(0, 1500);
  const pkgText = (product.packageContents || []).join("\n").slice(0, 800);

  return `Antal bilder: ${product.imageUrls.length}
Råtitel: ${product.rawTitle}
Råbeskrivning: ${product.rawDescription.slice(0, 4000)}

Specifikationer (råa):
${specsText || "(inga)"}

Säljpunkter (råa):
${featuresText || "(inga)"}

Paketinnehåll (råt):
${pkgText || "(okänt)"}`;
}

const DRAFT_INSTRUCTIONS = `Skriv förstklassigt svenskt produktinnehåll för EN produkt utifrån rådatan nedan.
Svara ENDAST med JSON enligt schemat:
{
  "title": "≤70 tecken, säljande och konkret svensk titel",
  "metaDescription": "≤155 tecken, lockande – preliminär (förfinas senare)",
  "descriptionHtml": "<p>…</p><p>…</p><ul><li>…</li>…</ul><p>…</p>",
  "slug": "url-slug-med-bindestreck",
  "imageAltTexts": ["alt för bild 1", "..."]
}

KRAV PÅ descriptionHtml:
- Minst ~150 ord, rik och varm men aldrig svamlig.
- 2–3 inledande <p> som målar upp ögonblicket produkten används i.
- En <ul> med 5–8 <li> som lyfter KONKRETA fördelar (varje <strong>rubrik</strong>: förklaring),
  alla grundade i rådatan.
- Ett avslutande <p> med användningsområden / vem den passar.
- Enkel HTML: <p>, <strong>, <ul>, <li>. Inga rubriker (<h*>), inga inline-stilar.

Antal imageAltTexts MÅSTE vara exakt ${"${imageCount}"}.`;

/** Steg 1 — Opus skriver första utkastet. */
export async function draftDescription(product: AliExpressProduct): Promise<SeoResult> {
  const imageCount = product.imageUrls.length;
  const user = `${DRAFT_INSTRUCTIONS.replace("${imageCount}", String(imageCount))}

PRODUKTDATA:
${productFactsText(product)}`;

  const cacheKey = makeCacheKey({
    op: "premiumDraft",
    name: product.rawTitle,
    description: product.rawDescription,
    dependencyFingerprint: `pid=${product.supplierProductId}|img=${imageCount}|m=${premiumModel()}`,
  });

  const raw = await completeJsonRouted<RawSeo>({
    op: "premiumDraft",
    cacheKey,
    system: brandVoiceSystemPrefix(),
    user,
    maxTokens: 2500,
    model: premiumModel(),
    failOpen: buildFallbackSeo(product),
  });
  return toSeoResult(raw, product);
}

const CRITIQUE_INSTRUCTIONS = `Du är en stenhård men konstruktiv svensk copy-redaktör för Fyndplats. Du får ett
UTKAST till produkttext och ska SÅGA det där det förtjänar — målet är 9,5/10, inte "okej".

Bedöm utkastet specifikt på:
- GENERISKT: vilka meningar är intetsägande AI-platta och skulle passa vilken produkt som helst?
- USP: vad gör just DEN här produkten värd att köpa – och fångas det? Vad fattas?
- HOOK: finns en säljande inledning som får kunden att vilja läsa vidare?
- KÄNSLA: målas ögonblicket/nyttan upp så kunden känner igen sig, eller är det en torr lista?
- TROVÄRDIGHET: påstås något utan täckning i rådatan? Klyschor utan substans?
- SPRÅK: stela/maskinöversatta formuleringar, upprepningar, fel ton mot brand voice?

Svara ENDAST med JSON:
{ "issues": ["konkret problem 1", "konkret problem 2", "..."],
  "fixes": ["konkret instruktion för omskrivningen 1", "..."] }
Var specifik och citera gärna den svaga formuleringen. 3–8 punkter i varje lista.`;

/** Steg 2 — en annan Opus-call kritiserar utkastet. Returnerar kritik-text. */
export async function critiqueDescription(
  product: AliExpressProduct,
  draft: SeoResult,
): Promise<string> {
  const user = `${CRITIQUE_INSTRUCTIONS}

PRODUKTDATA (sanningskälla):
${productFactsText(product)}

UTKAST ATT KRITISERA:
Titel: ${draft.title}
Beskrivning: ${draft.descriptionHtml}`;

  const cacheKey = makeCacheKey({
    op: "premiumCritique",
    name: draft.title,
    description: draft.descriptionHtml,
    dependencyFingerprint: `pid=${product.supplierProductId}|m=${premiumModel()}`,
  });

  const raw = await completeJsonRouted<{ issues?: string[]; fixes?: string[] }>({
    op: "premiumCritique",
    cacheKey,
    system: brandVoiceSystemPrefix(),
    user,
    maxTokens: 1200,
    model: premiumModel(),
    failOpen: {},
  });
  return formatCritique(raw);
}

const REWRITE_INSTRUCTIONS = `Skriv om produkttexten så att VARJE punkt i kritiken åtgärdas. Behåll allt som var bra,
fixa allt som sågades. Resultatet ska kännas skrivet av en människa som bryr sig — 9,5/10.
Samma JSON-schema och samma HTML-krav som tidigare (minst ~150 ord, 5–8 <li>, ärligt grundat
i rådatan). Antal imageAltTexts MÅSTE vara exakt ${"${imageCount}"}.
Svara ENDAST med JSON.`;

/** Steg 3 — Opus skriver om utifrån kritiken. */
export async function rewriteDescription(
  product: AliExpressProduct,
  draft: SeoResult,
  critique: string,
): Promise<SeoResult> {
  const imageCount = product.imageUrls.length;
  const user = `${REWRITE_INSTRUCTIONS.replace("${imageCount}", String(imageCount))}

PRODUKTDATA (sanningskälla):
${productFactsText(product)}

NUVARANDE UTKAST:
Titel: ${draft.title}
Meta: ${draft.metaDescription}
Beskrivning: ${draft.descriptionHtml}
Slug: ${draft.slug}

KRITIK ATT ÅTGÄRDA:
${critique}`;

  const cacheKey = makeCacheKey({
    op: "premiumRewrite",
    name: draft.title,
    description: `${draft.descriptionHtml}::${critique}`,
    dependencyFingerprint: `pid=${product.supplierProductId}|img=${imageCount}|m=${premiumModel()}`,
  });

  const raw = await completeJsonRouted<RawSeo>({
    op: "premiumRewrite",
    cacheKey,
    system: brandVoiceSystemPrefix(),
    user,
    maxTokens: 2500,
    model: premiumModel(),
    failOpen: draft as unknown as RawSeo,
  });
  const rewritten = toSeoResult(raw, product);
  // Butikscopy-skydd (samma som seo.ts/generate.ts): avvisa start-/butikstext.
  if (looksLikeStoreCopy(rewritten.title) || looksLikeStoreCopy(rewritten.descriptionHtml)) {
    return draft;
  }
  return rewritten;
}

/**
 * Hela multi-pass-flödet: draft → critique → rewrite. Vid fel på senare steg
 * returneras det bästa vi hunnit få fram (draft). Anroparen får critique-texten
 * för audit + ev. extra critique-runda (kvalitets-judgen, komponent 6).
 */
export async function generatePremiumDescription(
  product: AliExpressProduct,
): Promise<PremiumDescription> {
  const draft = await draftDescription(product);
  let critique = "";
  try {
    critique = await critiqueDescription(product, draft);
  } catch {
    return { seo: draft, critique: "" };
  }
  if (!critique.trim()) return { seo: draft, critique };
  const final = await rewriteDescription(product, draft, critique);
  return { seo: final, critique };
}

/**
 * Extra förfiningsrunda när kvalitets-judgen (komponent 6) underkänner: kör en ny
 * critique-omskrivning med judgens feedback inbakad. Används av premium-pipeline.
 */
export async function refinePremiumDescription(
  product: AliExpressProduct,
  current: SeoResult,
  judgeFeedback: string,
): Promise<SeoResult> {
  const critique = `${judgeFeedback}\n\n(Detta är en andra förfiningsrunda — höj texten ytterligare, fokusera på de svagaste punkterna ovan.)`;
  return rewriteDescription(product, current, critique);
}

// --- Helpers ---------------------------------------------------------------

interface RawSeo {
  title?: string;
  metaDescription?: string;
  descriptionHtml?: string;
  slug?: string;
  imageAltTexts?: string[];
}

function toSeoResult(raw: RawSeo, product: AliExpressProduct): SeoResult {
  return clampSeo(
    {
      title: raw.title ?? product.rawTitle,
      metaDescription: raw.metaDescription ?? "",
      descriptionHtml: raw.descriptionHtml ?? `<p>${product.rawDescription.slice(0, 1000)}</p>`,
      slug: raw.slug ?? "",
      suggestedCategory: "",
      imageAltTexts: Array.isArray(raw.imageAltTexts) ? raw.imageAltTexts.map((a) => String(a)) : [],
    },
    product.imageUrls.length,
  );
}

function formatCritique(raw: { issues?: string[]; fixes?: string[] }): string {
  const issues = (raw.issues ?? []).filter((s) => typeof s === "string" && s.trim());
  const fixes = (raw.fixes ?? []).filter((s) => typeof s === "string" && s.trim());
  const parts: string[] = [];
  if (issues.length) parts.push("Problem:\n" + issues.map((i) => `- ${i}`).join("\n"));
  if (fixes.length) parts.push("Åtgärder:\n" + fixes.map((f) => `- ${f}`).join("\n"));
  return parts.join("\n\n");
}
