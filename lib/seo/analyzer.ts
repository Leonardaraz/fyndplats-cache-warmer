// SEO/teknik-kontroller (statiska, beroendefria) — körs på samma HTML som
// tillgänglighetsgradern. En gratis värde-höjare i lead-magneten; det betalda
// erbjudandet är fortfarande EAA-auditen.

import { buildCategory, type CategoryResult, type Finding } from "../scan/types";
import { stripNonContent } from "../accessibility/scanner";

function getMeta(html: string, nameOrProp: string): string | null {
  const re = new RegExp(
    `<meta\\b[^>]*\\b(?:name|property)\\s*=\\s*["']${nameOrProp}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  const content = tag.match(/\bcontent\s*=\s*("([^"]*)"|'([^']*)')/i);
  return content ? (content[2] ?? content[3] ?? "") : "";
}

type Rule = (html: string, url: string) => Finding | null;

const RULES: Rule[] = [
  // HTTPS
  (_html, url) => {
    if (url.startsWith("https://")) return null;
    return {
      id: "no-https",
      title: "Sidan körs inte över HTTPS",
      severity: "serious",
      ref: "Säkerhet/SEO",
      count: 1,
      examples: [url],
    };
  },

  // Meta description
  (html) => {
    const desc = getMeta(html, "description");
    if (desc && desc.trim().length >= 30) return null;
    return {
      id: "meta-description",
      title: desc == null ? "Saknar meta-description" : "Meta-description är för kort",
      severity: "serious",
      ref: "SEO",
      count: 1,
      examples: desc ? [desc] : [],
    };
  },

  // Titel-längd
  (html) => {
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
    if (title.length >= 10 && title.length <= 60) return null;
    if (title.length === 0) return null; // saknad titel fångas av a11y
    return {
      id: "title-length",
      title: title.length > 60 ? "Sidtiteln är för lång (>60 tecken)" : "Sidtiteln är väldigt kort",
      severity: "minor",
      ref: "SEO",
      count: 1,
      examples: [title],
    };
  },

  // Canonical
  (html) => {
    if (/<link\b[^>]*\brel\s*=\s*["']canonical["']/i.test(html)) return null;
    return {
      id: "no-canonical",
      title: "Saknar canonical-länk (risk för duplicerat innehåll)",
      severity: "moderate",
      ref: "SEO",
      count: 1,
      examples: [],
    };
  },

  // Open Graph
  (html) => {
    const hasOgTitle = getMeta(html, "og:title") != null;
    const hasOgImage = getMeta(html, "og:image") != null;
    if (hasOgTitle && hasOgImage) return null;
    return {
      id: "no-opengraph",
      title: "Saknar Open Graph-taggar (ful förhandsvisning vid delning)",
      severity: "moderate",
      ref: "SEO/social",
      count: 1,
      examples: [],
    };
  },

  // noindex på sidan
  (html) => {
    const robots = getMeta(html, "robots") ?? "";
    if (!/noindex/i.test(robots)) return null;
    return {
      id: "robots-noindex",
      title: "Sidan är satt till noindex – syns inte i Google",
      severity: "critical",
      ref: "SEO",
      count: 1,
      examples: [robots],
    };
  },

  // Favicon
  (html) => {
    if (/<link\b[^>]*\brel\s*=\s*["'][^"']*icon[^"']*["']/i.test(html)) return null;
    return {
      id: "no-favicon",
      title: "Saknar favicon",
      severity: "minor",
      ref: "SEO/varumärke",
      count: 1,
      examples: [],
    };
  },
];

export function analyzeSeo(rawHtml: string, url: string): CategoryResult {
  const html = stripNonContent(rawHtml);
  const findings: Finding[] = [];
  for (const rule of RULES) {
    const f = rule(html, url);
    if (f) findings.push(f);
  }
  return buildCategory("seo", "SEO & teknik", findings, RULES.length);
}
