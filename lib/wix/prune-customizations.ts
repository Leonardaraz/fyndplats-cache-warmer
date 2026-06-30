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

/** Ett enskilt val i en customization (id behövs för att kunna ta bort det). */
export interface WixChoiceRef {
  choiceId: string;
  name: string;
}

/** Normaliserad vy av en Wix-customization (en delad val-hink). */
export interface WixCustomization {
  id: string;
  name: string;
  /** "PRODUCT_OPTION" (skapar varianter) eller "MODIFIER" (påverkar inte taket på samma sätt). */
  customizationType: string;
  renderType: WixCustomizationRenderType;
  choiceCount: number;
  /** Optimistic-concurrency-revision (krävs för remove-choices). Sätts av queryCustomizations. */
  revision?: string;
  /** Valen (id+namn). Sätts av queryCustomizations; behövs för prune (Fas 3). */
  choices?: WixChoiceRef[];
}

interface RawCustomization {
  id?: string;
  name?: string;
  revision?: string;
  customizationType?: string;
  customizationRenderType?: string;
  choicesSettings?: { choices?: { choiceId?: string; id?: string; name?: string }[] };
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
      const choices: WixChoiceRef[] = (c.choicesSettings?.choices ?? []).map((ch) => ({
        choiceId: ch.choiceId ?? ch.id ?? "",
        name: ch.name ?? "",
      }));
      out.push({
        id: c.id ?? "",
        name: c.name ?? "",
        customizationType: c.customizationType ?? "",
        renderType: (c.customizationRenderType ?? "") as WixCustomizationRenderType,
        choiceCount: choices.length,
        revision: c.revision,
        choices,
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

// ───────────────────────── Fas 3: auto-prune (MUTATION, dry-run default PÅ) ─────────────────────────
//
// Tar bort SKRÄP: (a) helt tomma PRODUCT_OPTION-customizations (0 val), (b) föräldralösa val
// (val som INGEN produkt använder). Rör ALDRIG val i bruk — och Wix nekar dessutom att ta bort
// både ett använt val och en tilldelad customization (428/NOT_ALLOWED) → dubbel säkerhet.
//
// HÅRD INVARIANT (stress-testets viktigaste): orphan-beslut FÅR ALDRIG fattas på en ofullständig
// produktskanning — då ser ett val i bruk ut som föräldralöst. queryProductChoiceUsage KASTAR om
// pagineringen inte hann slutföras, och planeraren körs aldrig på partiell data.
//
// HIDDEN/DRAFT räknas som ANVÄNDNING (products/query returnerar alla synligheter) — annars skulle
// vi rensa val som en dold/utkast-produkt bär.

/** Map customizationId → Set(choiceId som någon produkt faktiskt använder). */
export type ChoiceUsage = Map<string, Set<string>>;

/**
 * Skannar ALLA produkter och bygger användnings-setet per customization. KASTAR hellre än
 * returnerar partiell data (skyddar mot felaktig prune). page-taket är generöst men ändligt.
 */
export async function queryProductChoiceUsage(): Promise<ChoiceUsage> {
  const usage: ChoiceUsage = new Map();
  let cursor: string | undefined;
  const MAX_PAGES = 200; // 200 × 100 = 20 000 produkter — långt över nuvarande katalog.
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = { query: { cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) } } };
    const res = await fetch(`${WIX_BASE}/stores/v3/products/query`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Wix products/query misslyckades (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      products?: { options?: { id?: string; choicesSettings?: { choices?: { choiceId?: string; id?: string }[] } }[] }[];
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const p of json.products ?? []) {
      for (const o of p.options ?? []) {
        if (!o.id) continue;
        let set = usage.get(o.id);
        if (!set) { set = new Set(); usage.set(o.id, set); }
        for (const ch of o.choicesSettings?.choices ?? []) {
          const cid = ch.choiceId ?? ch.id;
          if (cid) set.add(cid);
        }
      }
    }
    cursor = json.pagingMetadata?.cursors?.next;
    if (!json.pagingMetadata?.hasNext || !cursor) return usage; // fullständig skanning
  }
  // Nådde page-taket med mer kvar → OFULLSTÄNDIGT. Hellre avbryta än prune:a fel.
  throw new Error(
    `[wix-prune] AVBRUTET: produktskanningen nådde ${MAX_PAGES} sidor utan att slutföras — ` +
      `prune får ALDRIG köra på partiell data.`,
  );
}

export interface ChoicePrunePlan {
  id: string;
  name: string;
  renderType: WixCustomizationRenderType;
  revision?: string;
  orphanChoiceIds: string[];
  orphanNames: string[];
  keepCount: number;
}
export interface PrunePlan {
  /** Helt tomma PRODUCT_OPTION-hinkar (0 val) → kan raderas. */
  emptyToDelete: { id: string; name: string; renderType: WixCustomizationRenderType }[];
  /** Hinkar med föräldralösa val att ta bort. */
  choicePrunes: ChoicePrunePlan[];
  totalOrphanChoices: number;
}

/**
 * PUR planerare (testbar utan live). Givet customizations (med choices) + komplett
 * användnings-set: vilka tomma hinkar kan raderas och vilka val är föräldralösa.
 * Endast PRODUCT_OPTION beaktas (modifiers har egna raderingsregler).
 */
export function planCustomizationPrune(customizations: WixCustomization[], usage: ChoiceUsage): PrunePlan {
  const emptyToDelete: PrunePlan["emptyToDelete"] = [];
  const choicePrunes: ChoicePrunePlan[] = [];
  let totalOrphanChoices = 0;

  for (const c of customizations) {
    if (c.customizationType !== "PRODUCT_OPTION") continue;
    const choices = c.choices ?? [];
    if (choices.length === 0) {
      emptyToDelete.push({ id: c.id, name: c.name, renderType: c.renderType });
      continue;
    }
    const used = usage.get(c.id) ?? new Set<string>();
    const orphans = choices.filter((ch) => ch.choiceId && !used.has(ch.choiceId));
    if (orphans.length) {
      totalOrphanChoices += orphans.length;
      choicePrunes.push({
        id: c.id,
        name: c.name,
        renderType: c.renderType,
        revision: c.revision,
        orphanChoiceIds: orphans.map((o) => o.choiceId),
        orphanNames: orphans.map((o) => o.name),
        keepCount: choices.length - orphans.length,
      });
    }
  }
  return { emptyToDelete, choicePrunes, totalOrphanChoices };
}

/** MUTATION: ta bort val ur en customization (batchat ≤100, trådar revision). Wix nekar val i bruk. */
async function removeChoices(id: string, choiceIds: string[], revision?: string): Promise<{ removed: number; failures: string[] }> {
  let rev = revision;
  let removed = 0;
  const failures: string[] = [];
  for (let i = 0; i < choiceIds.length; i += 100) {
    const batch = choiceIds.slice(i, i + 100);
    const res = await fetch(`${WIX_BASE}/stores/v3/customizations/${encodeURIComponent(id)}/remove-choices`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({ choiceIds: batch, ...(rev ? { revision: rev } : {}) }),
    });
    if (!res.ok) {
      failures.push(`${id}: ${(await res.text()).slice(0, 120)}`);
      // Hämta färsk revision och fortsätt med nästa batch (revision-krock är vanligaste felet).
      rev = undefined;
      continue;
    }
    const json = (await res.json()) as { customization?: { revision?: string } };
    rev = json.customization?.revision ?? rev;
    removed += batch.length;
  }
  return { removed, failures };
}

/** MUTATION: radera en (tom) customization. Wix nekar om den är tilldelad någon produkt. */
async function deleteCustomization(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${WIX_BASE}/stores/v3/customizations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: wixHeaders(),
  });
  if (!res.ok) return { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 120)}` };
  return { ok: true };
}

export interface PruneResult {
  dryRun: boolean;
  emptyDeleted: number;
  choicesRemoved: number;
  failures: string[];
}

/**
 * Verkställer en plan. dryRun=true (DEFAULT) muterar INGET — bara rapporterar vad som SKULLE
 * tas bort. Sätt PRUNE_DRY_RUN=false (i routen) för skarp drift. Hårdfaller aldrig — samlar fel.
 */
export async function executePrune(plan: PrunePlan, opts: { dryRun: boolean }): Promise<PruneResult> {
  if (opts.dryRun) {
    return {
      dryRun: true,
      emptyDeleted: plan.emptyToDelete.length,
      choicesRemoved: plan.totalOrphanChoices,
      failures: [],
    };
  }
  const failures: string[] = [];
  let choicesRemoved = 0;
  for (const cp of plan.choicePrunes) {
    const r = await removeChoices(cp.id, cp.orphanChoiceIds, cp.revision);
    choicesRemoved += r.removed;
    failures.push(...r.failures);
  }
  let emptyDeleted = 0;
  for (const e of plan.emptyToDelete) {
    const r = await deleteCustomization(e.id);
    if (r.ok) emptyDeleted++;
    else if (r.error) failures.push(`delete ${e.name}: ${r.error}`);
  }
  return { dryRun: false, emptyDeleted, choicesRemoved, failures };
}
