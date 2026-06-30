// Read-only observability för Wix Stores V3:s butiks-globala val-tak (100 val per delad
// customization). Fas 0 av den varaktiga planen: BARA query + rapport — INGA mutationer.
// Senare faser (auto-prune-cron, self-heal) lägger till skrivande funktioner här, var och
// en bakom dry-run + audit-gate. Datakällan (global fyllnadsgrad per hink) som denna modul
// ger behövs av alla efterföljande faser.
//
// Bakgrund: varje produkts option länkas till en delad, butiks-global customization matchad
// på (name + customizationRenderType). När en sådan hink når 100 val nekas VARJE ny import
// vars option landar där — även en produkt med 1 val. Se lib/wix/customization-identity.ts.

import { WIX_BASE, wixHeaders } from "./client";
import { WIX_MAX_CHOICES_PER_CUSTOMIZATION } from "./limits";
import { customizationIdentityKey, type WixCustomizationRenderType } from "./customization-identity";

/** Normaliserad vy av en Wix-customization (en delad val-hink). */
export interface WixCustomization {
  id: string;
  name: string;
  /** "PRODUCT_OPTION" (skapar varianter) eller "MODIFIER" (påverkar inte taket på samma sätt). */
  customizationType: string;
  renderType: WixCustomizationRenderType;
  choiceCount: number;
}

interface RawCustomization {
  id?: string;
  name?: string;
  customizationType?: string;
  customizationRenderType?: string;
  choicesSettings?: { choices?: unknown[] };
}

/**
 * Hämtar ALLA customizations (read-only, paginerat). Kastar vid HTTP-fel så anroparen
 * kan fail-open:a (vi vill ALDRIG fälla en import för att en observability-query fallerade).
 */
export async function queryCustomizations(): Promise<WixCustomization[]> {
  const out: WixCustomization[] = [];
  let cursor: string | undefined;
  // Skyddsnät mot oändlig paginering (butiken har tiotals, aldrig tusentals, customizations).
  for (let page = 0; page < 50; page++) {
    const body = { query: { cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) } } };
    const res = await fetch(`${WIX_BASE}/stores/v3/customizations/query`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Wix customizations/query misslyckades (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      customizations?: RawCustomization[];
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const c of json.customizations ?? []) {
      out.push({
        id: c.id ?? "",
        name: c.name ?? "",
        customizationType: c.customizationType ?? "",
        renderType: (c.customizationRenderType ?? "") as WixCustomizationRenderType,
        choiceCount: Array.isArray(c.choicesSettings?.choices) ? c.choicesSettings!.choices!.length : 0,
      });
    }
    cursor = json.pagingMetadata?.cursors?.next;
    if (!json.pagingMetadata?.hasNext || !cursor) break;
  }
  return out;
}

export interface CustomizationHeadroomBucket {
  id: string;
  name: string;
  renderType: WixCustomizationRenderType;
  /** (name + renderType)-nyckeln — samma hink för alla produkter som matchar. */
  key: string;
  choiceCount: number;
  headroom: number;
  /** True om hinken ligger på/över larmnivån. */
  nearLimit: boolean;
  /** True om hinken faktiskt nått det hårda taket (inga lediga platser). */
  atLimit: boolean;
}

export interface CustomizationHeadroomReport {
  /** Larmnivå som användes (val-antal). */
  warnAt: number;
  limit: number;
  /** Endast PRODUCT_OPTION-hinkar (modifiers påverkar inte variant-taket), störst först. */
  buckets: CustomizationHeadroomBucket[];
  /** Hinkar på/över larmnivån — det pipelinen/Leonard ska agera på. */
  nearLimit: CustomizationHeadroomBucket[];
  /** Högsta fyllnadsgraden just nu (0 om inga hinkar). */
  maxChoiceCount: number;
  /** Antal helt tomma PRODUCT_OPTION-hinkar (skräp-axlar — kandidater för Fas 3-städning). */
  emptyCount: number;
  /** (name+renderType)-nycklar som dök upp på MER än en customization-id (Wix-anomali att utreda). */
  duplicateKeys: string[];
}

/**
 * PUR rapport-byggare (testbar utan live-Wix). Tar customization-listan och beräknar
 * fyllnadsgrad per delad hink. Tar bara hänsyn till PRODUCT_OPTION (de som faktiskt
 * delar variant-taket); MODIFIER-hinkar exkluderas.
 */
export function buildHeadroomReport(
  customizations: WixCustomization[],
  opts: { warnAt?: number; limit?: number } = {},
): CustomizationHeadroomReport {
  const warnAt = opts.warnAt ?? 85;
  const limit = opts.limit ?? WIX_MAX_CHOICES_PER_CUSTOMIZATION;
  const options = customizations.filter((c) => c.customizationType === "PRODUCT_OPTION");

  const buckets: CustomizationHeadroomBucket[] = options
    .map((c) => {
      const key = customizationIdentityKey({ name: c.name, renderType: c.renderType });
      return {
        id: c.id,
        name: c.name,
        renderType: c.renderType,
        key,
        choiceCount: c.choiceCount,
        headroom: Math.max(0, limit - c.choiceCount),
        nearLimit: c.choiceCount >= warnAt,
        atLimit: c.choiceCount >= limit,
      };
    })
    .sort((a, b) => b.choiceCount - a.choiceCount || a.name.localeCompare(b.name));

  // Anomali-detektor: två customization-id med samma (name+renderType) borde inte finnas.
  const seen = new Map<string, number>();
  for (const b of buckets) seen.set(b.key, (seen.get(b.key) ?? 0) + 1);
  const duplicateKeys = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);

  return {
    warnAt,
    limit,
    buckets,
    nearLimit: buckets.filter((b) => b.nearLimit),
    maxChoiceCount: buckets.length ? buckets[0].choiceCount : 0,
    emptyCount: buckets.filter((b) => b.choiceCount === 0).length,
    duplicateKeys,
  };
}

/** Convenience: hämta + bygg rapport i ett steg (read-only). */
export async function customizationHeadroomReport(
  opts: { warnAt?: number } = {},
): Promise<CustomizationHeadroomReport> {
  const customizations = await queryCustomizations();
  return buildHeadroomReport(customizations, opts);
}

/** Kort människoläsbar logg-rad per nära-taket-hink, för cron/observability. */
export function formatHeadroomWarnings(report: CustomizationHeadroomReport): string[] {
  return report.nearLimit.map(
    (b) =>
      `[wix-headroom] VARNING: "${b.name}" (${b.renderType}) ${b.choiceCount}/${report.limit} val` +
      ` — ${b.headroom} kvar${b.atLimit ? " — TAKET NÅTT, nya importer hit nekas" : ""}.`,
  );
}
