// Prestanda & best practices — statiska, ärliga signaler ur HTML.
// Mäter INTE faktisk laddtid (det kräver rendering/Lighthouse) utan vanliga
// fallgropar som påverkar Core Web Vitals och prestanda. Gratis värde-höjare.

import { buildCategory, type CategoryResult, type Finding } from "../scan/types";
import { stripNonContent } from "../accessibility/scanner";

function getHead(html: string): string {
  return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html;
}

interface Ctx {
  raw: string;
  clean: string;
}
type Rule = (ctx: Ctx) => Finding | null;

const RULES: Rule[] = [
  // Bilder utan angivna mått → layoutförskjutning (CLS)
  ({ clean }) => {
    const imgs = clean.match(/<img\b[^>]*>/gi) ?? [];
    const missing = imgs.filter(
      (t) => !/\bwidth\s*=/.test(t) || !/\bheight\s*=/.test(t),
    );
    if (missing.length === 0) return null;
    return {
      id: "img-no-dimensions",
      title: "Bilder saknar width/height – orsakar hoppande layout (CLS)",
      severity: "moderate",
      ref: "Core Web Vitals",
      count: missing.length,
      examples: missing.slice(0, 3).map((t) => t.slice(0, 120)),
    };
  },

  // Många bilder utan lazy-loading
  ({ clean }) => {
    const imgs = clean.match(/<img\b[^>]*>/gi) ?? [];
    if (imgs.length < 3) return null;
    const lazy = imgs.filter((t) => /\bloading\s*=\s*["']?lazy/i.test(t));
    if (lazy.length > 0) return null;
    return {
      id: "img-no-lazy",
      title: "Bilder laddas inte lazy – långsammare första intryck",
      severity: "minor",
      ref: "Prestanda",
      count: imgs.length,
      examples: [],
    };
  },

  // Renderblockerande skript i <head> utan async/defer
  ({ raw }) => {
    const head = getHead(raw);
    const scripts = head.match(/<script\b[^>]*\bsrc\s*=[^>]*>/gi) ?? [];
    const blocking = scripts.filter((t) => !/\b(async|defer)\b/i.test(t));
    if (blocking.length === 0) return null;
    return {
      id: "render-blocking-js",
      title: "Renderblockerande skript i <head> (saknar async/defer)",
      severity: "moderate",
      ref: "Prestanda",
      count: blocking.length,
      examples: blocking.slice(0, 3).map((t) => t.slice(0, 120)),
    };
  },

  // Mycket stor HTML-dokumentstorlek
  ({ raw }) => {
    const kb = Math.round(Buffer.byteLength(raw, "utf8") / 1024);
    if (kb < 150) return null;
    return {
      id: "large-dom",
      title: `Stort HTML-dokument (~${kb} kB) – tyngre att ladda och tolka`,
      severity: "minor",
      ref: "Prestanda",
      count: 1,
      examples: [],
    };
  },

  // Saknad teckenkodning
  ({ raw }) => {
    if (/<meta\b[^>]*charset/i.test(raw)) return null;
    return {
      id: "no-charset",
      title: "Saknar <meta charset> – risk för felaktiga tecken (åäö)",
      severity: "moderate",
      ref: "Best practice",
      count: 1,
      examples: [],
    };
  },
];

export function analyzePerformance(rawHtml: string): CategoryResult {
  const ctx: Ctx = { raw: rawHtml, clean: stripNonContent(rawHtml) };
  const findings: Finding[] = [];
  for (const rule of RULES) {
    const f = rule(ctx);
    if (f) findings.push(f);
  }
  return buildCategory("performance", "Prestanda & best practices", findings, RULES.length);
}
