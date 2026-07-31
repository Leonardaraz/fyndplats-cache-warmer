// Skrivstöd för FyndplatsRedirects — headless-sajtens 301-tabell.
//
// När en produkt tas bort ur Wix svarar /produkt/<slug> annars 404: gamla
// Google-träffar, annonslänkar och delningar landar i väggen och länkvärdet går
// förlorat. Storefronten (lib/redirects.ts i headless-repot) slår upp den här
// collectionen på 404-vägen och svarar 308 mot `toPath` i stället.
//
// Läsvägen bor i headless-appen; HÄR ligger skrivvägen, eftersom motorn har
// Wix-admin-nyckeln och är den som upptäcker borttagna produkter.

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
