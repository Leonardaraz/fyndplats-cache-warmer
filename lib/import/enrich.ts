// Back-fill av de tabbade PDP-flikarna på REDAN importerade produkter
// (/admin/enrich-products i headless-repot anropar detta via /api/enrich).
//
// Flödet per produkt:
//   1. Läs produktens beskrivning + revision från Wix (getProductForEnrich).
//   2. Räkna ut vilka flikar som saknas (computeTabStatus).
//   3. Generera de saknade flikarna med Haiku (generateTabs) — ärver cache +
//      daglig budgetcap + Gemini-fallback från llm/router.
//   4. Foga in dem i beskrivningen som <h2>-block (idempotent) och PATCH:a Wix.
//
// dryRun=true genererar och returnerar förhandsvisningen UTAN att skriva till Wix
// (driver "Granska & redigera" i UI:t). Budgetcapen i routern gör att masskörning
// stoppar av sig själv när dagens spend når taket.

import { getProductForEnrich, updateProductDescription } from "../wix/client";
import { appendTabSections, buildTabSections, descriptionHasSection, generateTabs } from "./tabs";
import { audit } from "../audit";

export interface TabStatus {
  /** Beskrivning finns alltid (huvudtexten). */
  beskrivning: boolean;
  specifikationer: boolean;
  vanligaFragor: boolean;
  anvandningSkotsel: boolean;
  /** Kontakta oss läggs alltid till av storefronten → alltid "klar". */
  kontakt: boolean;
}

/** Räknar ut flik-status ur beskrivnings-HTML (samma <h2>-mönster som storefronten). */
export function computeTabStatus(descHtml: string): TabStatus {
  const html = descHtml || "";
  return {
    beskrivning: true,
    specifikationer: descriptionHasSection(html, "Tekniska specifikationer"),
    vanligaFragor: descriptionHasSection(html, "Vanliga frågor"),
    anvandningSkotsel: descriptionHasSection(html, "Användning och skötsel"),
    kontakt: true,
  };
}

/** Antal "data-flikar" (av 3 möjliga) som redan finns — för sortering i UI:t. */
export function tabCompletionCount(status: TabStatus): number {
  return (
    (status.specifikationer ? 1 : 0) +
    (status.vanligaFragor ? 1 : 0) +
    (status.anvandningSkotsel ? 1 : 0)
  );
}

/** Drar ut "Tekniska specifikationer"-blockets text som "Label: Value"-rader. */
function extractExistingSpecText(descHtml: string): string {
  const m = (descHtml || "").match(
    /<h2[^>]*>\s*Tekniska\s+[Ss]pecifikationer\s*<\/h2>([\s\S]*?)(?=<h2|$)/i,
  );
  if (!m) return "";
  return m[1]
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/(strong|b)>/gi, ": ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export interface EnrichOptions {
  /** Wix-kategorinamn — styr om "Användning och skötsel" genereras. */
  categoryName?: string | null;
  /** true = generera + förhandsvisa utan att skriva till Wix. */
  dryRun?: boolean;
}

export interface EnrichResult {
  productId: string;
  name: string;
  /** Flik-status EFTER (vid dryRun: hur den SKULLE bli). */
  status: TabStatus;
  /** Flik-titlar som genererades/lades till denna körning. */
  generated: string[];
  /** Flik-titlar som redan fanns och hoppades över. */
  skipped: string[];
  /** true om beskrivningen faktiskt skrevs till Wix. */
  saved: boolean;
  dryRun: boolean;
  /** Hela den nya beskrivnings-HTML:en (för "Granska & redigera"). */
  previewHtml: string;
}

/**
 * Genererar och (om ej dryRun) persisterar de saknade flikarna för EN produkt.
 */
export async function enrichProductTabs(
  productId: string,
  opts: EnrichOptions = {},
): Promise<EnrichResult> {
  const info = await getProductForEnrich(productId);
  if (!info) throw new Error(`Produkt ${productId} hittades inte i Wix.`);

  const tabs = await generateTabs({
    productId,
    name: info.name,
    categoryName: opts.categoryName ?? null,
    existingSpecText: extractExistingSpecText(info.plainDescription),
  });

  const sections = buildTabSections(tabs);
  const { html, added } = appendTabSections(info.plainDescription, sections);
  const skipped = sections.map((s) => s.title).filter((t) => !added.includes(t));

  let saved = false;
  if (added.length > 0 && !opts.dryRun) {
    await updateProductDescription(productId, info.revision, html);
    await audit("enrich-tabs", productId, `+${added.join(", ")}`);
    saved = true;
  }

  return {
    productId,
    name: info.name,
    status: computeTabStatus(html),
    generated: added,
    skipped,
    saved,
    dryRun: !!opts.dryRun,
    previewHtml: html,
  };
}
