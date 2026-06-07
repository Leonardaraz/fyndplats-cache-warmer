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

/** Ord/tecken som avslöjar dropship-ursprunget — tas bort ur texten (även i
 *  alt=/alicdn-URL:er). Täcker latinska + vanliga CJK-varianter. */
const LEAKY =
  /\b(?:aliexpress|ali[-\s]?express|alibaba|cainiao|china|chinese|shenzhen|guangzhou|shanghai|yiwu|hong\s?kong|alicdn|made in prc|prc)\b|中国|中國|深圳|广州|廣州|香港|义乌|義烏/gi;

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
  // Farliga element INKL. innehåll (script/style/iframe + form/object/embed/svg/math).
  s = s.replace(
    /<\s*(script|style|iframe|noscript|form|object|embed|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  // Själv-/oavslutade farliga taggar + void-/form-element utan plats i en beskrivning.
  s = s.replace(
    /<\s*(script|style|iframe|noscript|form|object|embed|svg|math|meta|link|base|input|button|textarea|select)\b[^>]*\/?>/gi,
    "",
  );
  // Inline event-handlers (onclick=…).
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Skript-bärande URI-scheman (javascript:, data:text/html, data:image/svg).
  s = s.replace(/javascript:/gi, "");
  s = s.replace(/data:\s*(?:text\/html|image\/svg\+?xml?)/gi, "");
  // Dropship-läckande ord/tecken i texten (även i alt=/alicdn-URL:er).
  s = s.replace(LEAKY, "");
  s = s.replace(/[ \t]{2,}/g, " ").trim();
  // Inget kvar utom whitespace/taggar? → tomt.
  if (!descriptionToText(s)) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Antal <img>-taggar (proxy för bild-baserad beskrivning). */
export function imageCount(html: string): number {
  return ((html || "").match(/<img\b/gi) || []).length;
}

/**
 * True om DS-detailen tillför MER än den nuvarande (tunna) beskrivningen: mer
 * synlig text ELLER fler bilder. Ren längd-jämförelse på HTML-strängen räcker
 * inte — en bild-baserad AE-beskrivning har lite text men många bilder, och en
 * missad skrapning kan vara markup-tung men synligt tom. Detta är det avgörande
 * villkoret för om backfillen faktiskt ersätter beskrivningen.
 */
export function isMoreInformative(
  detail: string,
  current: { descriptionHtml?: string; rawDescription?: string },
): boolean {
  if (!detail) return false;
  const curHtml = current.descriptionHtml || "";
  const curVisible = descriptionToText(curHtml || current.rawDescription || "").length;
  return descriptionToText(detail).length > curVisible || imageCount(detail) > imageCount(curHtml);
}
