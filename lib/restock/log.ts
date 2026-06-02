// Restock-händelselogg (Feature 8 — SEO-vänlig slut-i-lager).
//
// När en produkt kommer tillbaka i lager (oos → aktiv) och restock-mejl skickats
// loggar vi en rad här så att vi i efterhand kan se NÄR varje produkt restockades
// och hur många bevakare som notifierades. Separat från sync-loggen (som är
// per-körning-audit) — denna är en ren restock-tidslinje för admin/analys.
//
// Wix Data-kollektion: FyndplatsRestockLog
//   _id                  — `${productId}:${restockedAt}` (unik per händelse)
//   productId            — Wix-produkt-id
//   productName          — namn (denormaliserat för läsbar logg)
//   restockedAt          — ISO
//   subscribersNotified  — antal restock-mejl som skickades
//   newStock             — lagersaldo som observerades vid restock
//
// Mönster: samma fetch-helper-stil som lib/restock/store.ts. Skrivfel ska aldrig
// fälla syncen — callern wrappar i try/catch (loggning är best-effort).

const WIX_BASE = "https://www.wixapis.com";

const COL = process.env.WIX_DATA_COL_RESTOCK_LOG ?? "FyndplatsRestockLog";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

export interface RestockLogEntry {
  /** `${productId}:${restockedAt}` */
  id: string;
  productId: string;
  productName: string;
  restockedAt: string;
  subscribersNotified: number;
  newStock: number | null;
}

async function saveRow(id: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COL,
      dataItem: { id, dataCollectionId: COL, data: { _id: id, ...data } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
}

async function queryRows(limit = 500): Promise<RestockLogEntry[]> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COL,
      query: { filter: {}, sort: [{ fieldName: "restockedAt", order: "DESC" }], paging: { limit } },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return [];
    }
    throw new Error(`Wix Data query ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: RestockLogEntry }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is RestockLogEntry => Boolean(d));
}

export class RestockLogStore {
  /** Loggar en restock-händelse. */
  async log(entry: Omit<RestockLogEntry, "id">): Promise<void> {
    const id = `${entry.productId}:${entry.restockedAt}`;
    await saveRow(id, { ...entry, id });
  }

  /** Senaste restock-händelserna (för admin-vy). */
  async listRecent(limit = 200): Promise<RestockLogEntry[]> {
    return queryRows(limit);
  }
}

let singleton: RestockLogStore | null = null;
export function getRestockLogStore(): RestockLogStore {
  if (!singleton) singleton = new RestockLogStore();
  return singleton;
}
