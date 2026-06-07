// Beskrivnings-backfill för importen.
//
// AliExpress lägger produktbeskrivningen i en lazy-laddad iframe som tilläggets
// skrapa ofta missar → product.descriptionHtml/rawDescription blir tunn och
// Wix-produkten får nästan ingen text. Då hämtar pipelinen DS-produkt-API:ts
// detail (ae_item_base_info_dto.detail) och använder den i stället. Här ligger
// den rena, enhetstestbara logiken: när behövs backfill, och hur renas HTML:en
// för Wix (XSS-säkert + dropship-anonymisering).

import type { AliExpressProduct } from "./types";

/** Default på. Stäng av med IMPORT_DESCRIPTION_BACKFILL=false. */
export function descriptionBackfillEnabled(): boolean {
  return (process.env.IMPORT_DESCRIPTION_BACKFILL ?? "true").toLowerCase() !== "false";
}

// Under så här många synliga tecken anses den skrapade beskrivningen "tunn".
const THIN_DESCRIPTION_CHARS = 200;

/** Ord som avslöjar dropship-ursprunget — tas bort ur den synliga texten. */
const LEAKY = /\b(aliexpress|alibaba|cainiao|china|chinese|shenzhen|guangzhou|shanghai|yiwu|made in prc|prc)\b/gi;

/** Plockar bort HTML-taggar → ren text (för längdmätning + rawDescription). */
export function descriptionToText(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Synlig textlängd i produktens nuvarande beskrivning (taggar borttagna). */
export function visibleDescriptionLength(product: AliExpressProduct): number {
  const src = (product.descriptionHtml || "").trim() || (product.rawDescription || "").trim();
  return descriptionToText(src).length;
}

/** True när skrapans beskrivning är tunn → värt att hämta DS-detail. */
export function needsDescriptionBackfill(product: AliExpressProduct): boolean {
  return visibleDescriptionLength(product) < THIN_DESCRIPTION_CHARS;
}

/**
 * Renar DS-detail-HTML för Wix plainDescription:
 * - tar bort script/style/iframe/noscript + on*-attribut + javascript: (XSS)
 * - tar bort dropship-läckande ord (AliExpress, China, Shenzhen, …)
 * - normaliserar whitespace, kapar till maxLen (utan att vara beroende av exakt
 *   tagg-gräns — Wix tål en kapad svans)
 * Behåller <img>/<p>/<br> m.m. så den bildbaserade beskrivningen följer med.
 * Returnerar "" om inget meningsfullt blir kvar.
 */
export function sanitizeDescriptionHtml(html: string, maxLen = 12000): string {
  if (!html) return "";
  let s = html;
  // Farliga element (inkl. innehåll).
  s = s.replace(/<\s*(script|style|iframe|noscript)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // Självstängande/oavslutade farliga taggar.
  s = s.replace(/<\s*(script|style|iframe|noscript)\b[^>]*\/?>/gi, "");
  // Inline event-handlers (onclick=...) och javascript:-URI:er.
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript:/gi, "");
  // Dropship-läckande ord i den synliga texten.
  s = s.replace(LEAKY, "");
  s = s.replace(/[ \t]{2,}/g, " ").trim();
  // Inget kvar utom whitespace/taggar? → tomt.
  if (!descriptionToText(s)) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}
