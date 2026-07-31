// Skrivstöd för FyndplatsRedirects — headless-sajtens 301-tabell.
//
// När en produkt tas bort ur Wix svarar /produkt/<slug> annars 404: gamla
// Google-träffar, annonslänkar och delningar landar i väggen och länkvärdet går
// förlorat. Storefronten (lib/redirects.ts i headless-repot) slår upp den här
// collectionen på 404-vägen och svarar 308 mot `toPath` i stället.
//
// Läsvägen bor i headless-appen; HÄR ligger skrivvägen, eftersom motorn har
// Wix-admin-nyckeln och är den som upptäcker borttagna produkter.

import { listAllV3Products } from "./v3-products";

const WIX_BASE = "https://www.wixapis.com";
const COLLECTION = process.env.WIX_DATA_COL_REDIRECTS ?? "FyndplatsRedirects";

// Samma auth-form som lib/sync/sync-log.ts och lib/wix/client.ts: token i
// WIX_API_TOKEN (INTE WIX_API_KEY — det namnet finns inte i miljön) och
// wix-site-id bara när det är satt.
function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { Authorization: token, "Content-Type": "application/json" };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

export interface RedirectRow {
  /** Produkt-slug UTAN /produkt/-prefix, t.ex. "gammal-produkt". */
  fromSlug: string;
  /** Intern målsökväg, t.ex. "/produkt/ny-produkt" eller "/kategori/leksaker-spel". */
  toPath: string;
  reason?: string;
}

/**
 * Validerar en redirect innan den skrivs. Endast interna, absoluta sökvägar
 * accepteras — en felskriven rad ska aldrig kunna skicka besökare till en
 * främmande sajt (samma regel som storefrontens sanitizeRedirectTarget) eller
 * smuggla in radbrytningar i Location-headern.
 *
 * Returnerar felmeddelande, eller null när raden är giltig.
 */
export function validateRedirect(row: RedirectRow): string | null {
  const from = (row.fromSlug || "").trim();
  const to = (row.toPath || "").trim();
  if (!from) return "fromSlug saknas";
  if (from.startsWith("/")) return "fromSlug ska vara enbart slug, utan /produkt/-prefix";
  if (!/^[a-z0-9åäö][a-z0-9åäö-]*$/i.test(from)) return `ogiltig fromSlug: ${from}`;
  if (!to.startsWith("/") || to.startsWith("//")) return "toPath måste vara en intern sökväg som börjar med /";
  if (/[\s\r\n]/.test(to)) return "toPath får inte innehålla mellanslag eller radbrytningar";
  if (from === to.replace(/^\/produkt\//, "")) return "fromSlug och toPath pekar på samma sida";
  return null;
}

export interface RedirectConflict {
  fromSlug: string;
  problem: string;
}

/**
 * Andra försvarslinjen: stoppar redirects som pekar BORT från levande sidor.
 *
 * validateRedirect() ser bara på strängarna. Den kan inte veta om slugen
 * fortfarande är en säljbar produkt — och det är precis det som gick fel
 * 2026-07-31: två rader skrevs för produkter som råkade svara 404 för stunden
 * (utgången ISR-cache), fast båda var `visible: true` och i lager. En 308 är
 * PERMANENT; hade den hunnit fyra hade Google avindexerat två säljande
 * produktsidor. En tredje rad från 2026-07-14 hade blivit inaktuell på samma
 * sätt när produkten återkom.
 *
 * Lärdomen: HTTP-status är ett för svagt bevis för att en produkt är död.
 * Katalogen är facit. listAllV3Products() returnerar bara synliga produkter
 * (query:t sätter inte returnNonVisibleProducts), så en träff = levande sida.
 *
 * Två kontroller:
 *   1. fromSlug får inte vara en levande produkt (annars kapar vi en säljande sida).
 *   2. toPath som pekar på /produkt/<slug> måste vara en levande produkt
 *      (annars omdirigerar vi från en död sida till en annan död sida).
 *
 * Fail-CLOSED med flit: går katalogen inte att läsa vet vi inget och skriver
 * inget. Motsatsen — skriva i blindo — är just det som orsakade incidenten.
 * Läsvägen i storefronten är fortfarande fail-open; att INTE kunna lägga till
 * en redirect är ofarligt, att lägga till fel redirect är det inte.
 */
export async function findRedirectConflicts(rows: RedirectRow[]): Promise<RedirectConflict[]> {
  if (!rows.length) return [];

  let liveSlugs: Set<string>;
  try {
    const products = await listAllV3Products();
    liveSlugs = new Set(products.map((p) => (p.slug || "").trim().toLowerCase()).filter(Boolean));
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : String(err);
    return rows.map((r) => ({
      fromSlug: r.fromSlug,
      problem: `kunde inte verifiera mot produktkatalogen, skriver inget: ${detail}`,
    }));
  }
  // Tom katalog = misslyckat uppslag som såg ut att lyckas. Vore den sann
  // skulle varenda rad godkännas, vilket är exakt fel utfall.
  if (liveSlugs.size === 0) {
    return rows.map((r) => ({
      fromSlug: r.fromSlug,
      problem: "produktkatalogen kom tillbaka tom — vägrar skriva utan facit",
    }));
  }

  const conflicts: RedirectConflict[] = [];
  for (const row of rows) {
    const from = (row.fromSlug || "").trim().toLowerCase();
    if (liveSlugs.has(from)) {
      conflicts.push({
        fromSlug: row.fromSlug,
        problem: `"${row.fromSlug}" är fortfarande en synlig produkt — en 301 hade kapat en säljande sida`,
      });
      continue;
    }
    const to = (row.toPath || "").trim();
    const targetSlug = to.startsWith("/produkt/")
      ? to.slice("/produkt/".length).split(/[?#]/)[0].toLowerCase()
      : "";
    if (targetSlug && !liveSlugs.has(targetSlug)) {
      conflicts.push({
        fromSlug: row.fromSlug,
        problem: `målet ${to} är ingen synlig produkt — redirecten hade lett till en 404`,
      });
    }
  }
  return conflicts;
}

/**
 * Skriver (eller uppdaterar) en redirect-rad. Idempotent: id = fromSlug, så
 * samma slug kan skrivas om utan att skapa dubbletter.
 */
export async function upsertRedirect(row: RedirectRow): Promise<void> {
  const problem = validateRedirect(row);
  if (problem) throw new Error(`Ogiltig redirect (${row.fromSlug}): ${problem}`);
  const id = row.fromSlug.trim();
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION,
      dataItem: {
        id,
        dataCollectionId: COLLECTION,
        data: {
          _id: id,
          fromSlug: id,
          toPath: row.toPath.trim(),
          reason: (row.reason || "").trim() || "Tillagd via /api/admin/redirects",
        },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${COLLECTION} (${res.status}): ${text.slice(0, 300)}`);
  }
}

/** Läser befintliga redirects (för verifiering/listning i admin-verktyget). */
export async function listRedirects(limit = 200): Promise<RedirectRow[]> {
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION,
      query: { filter: {}, sort: [{ fieldName: "_updatedDate", order: "DESC" }], paging: { limit } },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    throw new Error(`Wix Data query ${COLLECTION} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: RedirectRow }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is RedirectRow => Boolean(d));
}
