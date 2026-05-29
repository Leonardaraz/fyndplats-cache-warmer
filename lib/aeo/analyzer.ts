// AI-synlighet (AEO) — statiska signaler för hur väl en sida kan tolkas och
// citeras av AI-svarsmotorer (ChatGPT, Google AI Overviews, Perplexity).
// Inga renderade/externa anrop — proxysignaler ur HTML. Gratis värde-höjare.

import { buildCategory, type CategoryResult, type Finding } from "../scan/types";
import { stripNonContent } from "../accessibility/scanner";

// Schema-signaler läses ur RÅ html (script-innehåll), övriga ur den rensade.
interface Ctx {
  raw: string;
  clean: string;
}
type Rule = (ctx: Ctx) => Finding | null;

const RULES: Rule[] = [
  // Strukturerad data (JSON-LD schema.org) — stark AEO-signal
  ({ raw }) => {
    const hasJsonLd = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["']/i.test(raw);
    if (hasJsonLd) return null;
    return {
      id: "no-structured-data",
      title: "Saknar strukturerad data (schema.org/JSON-LD) – svårare för AI att förstå",
      severity: "serious",
      ref: "schema.org",
      count: 1,
      examples: [],
    };
  },

  // Semantiska landmärken – hjälper AI att tolka sidans delar
  ({ clean }) => {
    const landmarks = ["main", "article", "header", "nav", "footer"];
    const present = landmarks.filter((t) => new RegExp(`<${t}\\b`, "i").test(clean));
    if (present.length >= 2) return null;
    return {
      id: "no-semantic-html",
      title: "Få semantiska element (main/article/nav) – otydlig struktur för AI",
      severity: "moderate",
      ref: "Semantisk HTML",
      count: 1,
      examples: [`hittade: ${present.join(", ") || "inga"}`],
    };
  },

  // Tunt innehåll – AI behöver text att citera
  ({ clean }) => {
    const text = clean
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 600) return null;
    return {
      id: "thin-content",
      title: "Lite textinnehåll – ger AI lite att citera",
      severity: "moderate",
      ref: "Innehåll",
      count: 1,
      examples: [`~${text.length} tecken text`],
    };
  },

  // Rubriker – tydlig H2-struktur hjälper AI att extrahera svar
  ({ clean }) => {
    const h2 = (clean.match(/<h2\b/gi) ?? []).length;
    if (h2 >= 2) return null;
    return {
      id: "weak-headings",
      title: "Få underrubriker (H2) – svårare för AI att hitta svar på frågor",
      severity: "minor",
      ref: "Innehållsstruktur",
      count: 1,
      examples: [`${h2} st H2`],
    };
  },

  // FAQ-struktur – frågor/FAQ-schema citeras ofta av AI
  ({ raw }) => {
    const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(raw);
    if (hasFaqSchema) return null;
    return {
      id: "no-faq",
      title: "Ingen FAQ-struktur (FAQPage-schema) – missar vanliga AI-svarsformat",
      severity: "minor",
      ref: "schema.org/FAQPage",
      count: 1,
      examples: [],
    };
  },
];

export function analyzeAeo(rawHtml: string): CategoryResult {
  const ctx: Ctx = { raw: rawHtml, clean: stripNonContent(rawHtml) };
  const findings: Finding[] = [];
  for (const rule of RULES) {
    const f = rule(ctx);
    if (f) findings.push(f);
  }
  return buildCategory("aeo", "AI-synlighet (AEO)", findings, RULES.length);
}
