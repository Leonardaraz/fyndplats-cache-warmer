// Premium-FAQ: context-aware med riktiga frågor (komponent 4).
//
// Opus läser den färdiga produktbeskrivningen + kategori + (om de finns) skrapade
// AliExpress-recensioner och genererar 5–7 FAQ baserat på vad SVENSKA kunder
// faktiskt skulle undra. Recensionsdatan används för att hitta vanliga frågor/
// orosmoment kunder redan uttryckt (storlek, kvalitet, leverans, hållbarhet).
//
// Går via completeJsonRouted (Opus) → cache + budgetcap + cost-stats (op="premiumFaq").
// Fail-open: vid fel returneras tom FAQ (premium-pipeline behåller då Haiku-FAQ:n).

import { completeJsonRouted } from "../claude/client";
import { brandVoiceSystemPrefix } from "../claude/brand-voice";
import { premiumModel } from "./generate-premium";
import { makeCacheKey } from "../llm/cache";
import type { AliExpressProduct } from "./types";

export interface FaqItem {
  q: string;
  a: string;
}

/** Minimal recensionsform som faq-gen behöver (delmängd av extension-payloaden). */
export interface FaqReviewHint {
  text: string;
  rating?: number;
}

const SYSTEM_SUFFIX = `

UPPGIFT: Generera FAQ för EN produkt. Frågorna ska vara sådana en svensk kund FAKTISKT ställer
innan köp – grunda dem i beskrivningen, kategorin och (om de finns) recensionerna nedan.

REGLER:
- 5–7 frågor. Konkreta, relevanta, icke-triviala. Ingen fråga vars svar är uppenbart av titeln.
- Svaren: korta (1–3 meningar), ärliga, hjälpsamma, i Fyndplats ton. Hitta ALDRIG på fakta
  som inte framgår av underlaget – är något okänt, säg det rakt (t.ex. "det framgår inte, …").
- Prioritera det kunder oroar sig för: storlek/passform, material/kvalitet, skötsel, leverans,
  kompatibilitet, hållbarhet. Om recensioner finns: lyft frågor de antyder.
- Svara ENDAST med JSON: { "faq": [{ "q": "Fråga?", "a": "Svar." }] }`;

export async function generatePremiumFaq(input: {
  product: AliExpressProduct;
  descriptionHtml: string;
  categoryName?: string | null;
  reviews?: FaqReviewHint[];
}): Promise<FaqItem[]> {
  const { product, descriptionHtml, categoryName } = input;
  const reviews = (input.reviews ?? []).filter((r) => r && typeof r.text === "string" && r.text.trim());

  const reviewsText = reviews.length
    ? reviews
        .slice(0, 15)
        .map((r) => `- (${typeof r.rating === "number" ? r.rating : "?"}/5) ${r.text.slice(0, 240)}`)
        .join("\n")
    : "(inga recensioner tillgängliga)";

  const user = `PRODUKTBESKRIVNING (svensk, färdig):
${descriptionHtml.slice(0, 4000)}

Kategori: ${categoryName || "(okänd)"}

KUNDRECENSIONER (råa, blandade språk — använd för att hitta vanliga frågor/orosmoment):
${reviewsText}

Generera FAQ enligt reglerna.`;

  const cacheKey = makeCacheKey({
    op: "premiumFaq",
    name: product.rawTitle,
    description: descriptionHtml,
    dependencyFingerprint:
      `pid=${product.supplierProductId}|cat=${categoryName || ""}|m=${premiumModel()}` +
      `|rev=${reviews.length}:${reviews.map((r) => r.text.slice(0, 40)).join("|").slice(0, 600)}`,
  });

  const raw = await completeJsonRouted<{ faq?: { q?: string; a?: string }[] }>({
    op: "premiumFaq",
    cacheKey,
    system: brandVoiceSystemPrefix() + SYSTEM_SUFFIX,
    user,
    maxTokens: 1500,
    model: premiumModel(),
    failOpen: { faq: [] },
  });

  return normalizeFaq(raw.faq);
}

export function normalizeFaq(raw: { q?: string; a?: string }[] | undefined): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f) => f && typeof f.q === "string" && typeof f.a === "string")
    .map((f) => ({ q: f.q!.trim(), a: f.a!.trim() }))
    .filter((f) => f.q && f.a)
    .slice(0, 7);
}
