// Wix Data-baserad sync-logg + sync-state + alerts för dagliga AliExpress-syncen.
//
// Tre kollektioner:
//   FyndplatsAliExpressSyncLog     — append-only audit-rader (1 rad per produkt per körning)
//   FyndplatsAliExpressSyncState   — senast observerade värdena per produkt (för diff)
//   FyndplatsAliExpressSyncAlerts  — öppna alerts som visas i /admin/sync-alerts
//
// Speglar migrations/003_aliexpress_sync.sql så att framtida Postgres-flytt
// blir en drop-in (samma fältnamn i camelCase här / snake_case i SQL).
//
// Felmönster: 404 / "unknown collection" → tom lista (semantiskt = kollektion
// ej skapad än). Annars throw med komplett fel-body så Vercel-loggen är läsbar.

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COL = {
  log: process.env.WIX_DATA_COL_SYNC_LOG ?? "FyndplatsAliExpressSyncLog",
  state: process.env.WIX_DATA_COL_SYNC_STATE ?? "FyndplatsAliExpressSyncState",
  alerts: process.env.WIX_DATA_COL_SYNC_ALERTS ?? "FyndplatsAliExpressSyncAlerts",
};

export type ListingStatus = "active" | "out_of_stock" | "removed" | "unknown";
export type SyncAction =
  | "none"
  | "hidden"
  | "marked_oos"
  | "restored"
  | "flagged_price"
  | "flagged_content"
  | "dry_run";

export interface SyncLogEntry {
  /** Unik nyckel: `${productId}-${checkedAt}` */
  id: string;
  productId: string;          // Wix-produkt-id
  aliexpressId: string;
  checkedAt: string;          // ISO
  prevCostSek: number | null;
  newCostSek: number | null;
  prevStock: number | null;
  newStock: number | null;
  listingStatus: ListingStatus;
  actionTaken: SyncAction;
  notes?: string;
}

export interface SyncStateEntry {
  wixProductId: string;
  aliexpressId: string;
  currentCostSek: number | null;
  currentCostUsd: number | null;
  currentStock: number | null;
  listingStatus: ListingStatus;
  titleHash: string | null;
  imageHash: string | null;
  lastCheckedAt: string;      // ISO
  /**
   * ISO-tid då det senaste real-tids-"slut hos leverantör"-mejlet skickades
   * (Feature 2). Används för debounce: samma produkt larmas inte igen inom 24h
   * även om cronen kör flera gånger. Saknas = aldrig larmat.
   */
  lastOosAlertAt?: string | null;
}

export type AlertType = "price_increase" | "content_change";
export type AlertStatus = "open" | "approved" | "dismissed" | "removed";
export type AlertSeverity = "low" | "medium" | "high";

export interface SyncAlert {
  /** Stabil nyckel: `${wixProductId}-${alertType}` så samma typ av alert
   * för samma produkt överskrivs vid nästa körning istället för dubbletter. */
  id: string;
  wixProductId: string;
  aliexpressId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  // Pris-specifikt
  currentPriceSek?: number;
  prevCostUsd?: number;
  newCostUsd?: number;
  recommendedPriceSek?: number;
  projectedMarginPct?: number;
  // Innehållsändringar
  titleChanged?: boolean;
  imageChanged?: boolean;
  newTitle?: string;
  // Gemensamt
  productName?: string;
  imageUrl?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

async function save(collection: string, id: string, data: object): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: collection,
      dataItem: { id, dataCollectionId: collection, data: { _id: id, ...data } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${collection} (${res.status}): ${text.slice(0, 300)}`);
  }
}

async function get<T>(collection: string, id: string): Promise<T | null> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(collection)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data get ${collection} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItem?: { data?: T } };
  return body.dataItem?.data ?? null;
}

async function query<T>(
  collection: string,
  filter?: Record<string, unknown>,
  sort?: { fieldName: string; order: "ASC" | "DESC" }[],
  limit = 200,
): Promise<T[]> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: collection,
      query: { filter: filter ?? {}, sort: sort ?? [], paging: { limit } },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return [];
    }
    throw new Error(`Wix Data query ${collection} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: T }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is T => Boolean(d));
}

async function remove(collection: string, id: string): Promise<void> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(collection)}`;
  const res = await fetch(url, { method: "DELETE", headers: headers() });
  // 404 = redan borta. Tystna.
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Wix Data delete ${collection}/${id} (${res.status}): ${text.slice(0, 300)}`);
  }
}

export class SyncStore {
  // --- Log ----------------------------------------------------------------
  async appendLog(entry: SyncLogEntry): Promise<void> {
    await save(COL.log, entry.id, entry);
  }

  async listRecentLog(limit = 200): Promise<SyncLogEntry[]> {
    return query<SyncLogEntry>(
      COL.log,
      undefined,
      [{ fieldName: "checkedAt", order: "DESC" }],
      limit,
    );
  }

  async listLogForProduct(productId: string, limit = 50): Promise<SyncLogEntry[]> {
    return query<SyncLogEntry>(
      COL.log,
      { productId },
      [{ fieldName: "checkedAt", order: "DESC" }],
      limit,
    );
  }

  // --- State --------------------------------------------------------------
  async getState(wixProductId: string): Promise<SyncStateEntry | null> {
    return get<SyncStateEntry>(COL.state, wixProductId);
  }

  async saveState(entry: SyncStateEntry): Promise<void> {
    await save(COL.state, entry.wixProductId, entry);
  }

  // --- Alerts -------------------------------------------------------------
  async upsertAlert(alert: SyncAlert): Promise<void> {
    await save(COL.alerts, alert.id, alert);
  }

  async getAlert(id: string): Promise<SyncAlert | null> {
    return get<SyncAlert>(COL.alerts, id);
  }

  async listAlerts(status: AlertStatus = "open", limit = 500): Promise<SyncAlert[]> {
    return query<SyncAlert>(
      COL.alerts,
      { status },
      [{ fieldName: "createdAt", order: "DESC" }],
      limit,
    );
  }

  async listAllAlerts(limit = 500): Promise<SyncAlert[]> {
    return query<SyncAlert>(
      COL.alerts,
      undefined,
      [{ fieldName: "createdAt", order: "DESC" }],
      limit,
    );
  }

  async resolveAlert(id: string, status: Exclude<AlertStatus, "open">, resolvedBy = "leonard"): Promise<void> {
    const existing = await this.getAlert(id);
    if (!existing) return;
    await save(COL.alerts, id, {
      ...existing,
      status,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
    });
  }

  /** Stänger en alert utan att kasta om den redan är borta. Används av cron
   * när AliExpress kommer tillbaka i normalläge — alerten är inte längre relevant. */
  async closeAlertIfOpen(id: string): Promise<void> {
    const existing = await this.getAlert(id);
    if (!existing || existing.status !== "open") return;
    await this.resolveAlert(id, "dismissed", "auto-sync");
  }

  async deleteAlert(id: string): Promise<void> {
    await remove(COL.alerts, id);
  }
}

let singleton: SyncStore | null = null;
export function getSyncStore(): SyncStore {
  if (!singleton) singleton = new SyncStore();
  return singleton;
}

// --- Hash-hjälpare (deterministiska, för titel- och bild-diff) -------------

export async function hashString(input: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(input).digest("hex");
}

export async function hashImageList(urls: string[]): Promise<string> {
  // Sorterar URL:erna så att enbart en omordning inte ger en hash-diff (vi
  // bryr oss om vilka bilder som finns, inte i vilken ordning AliExpress
  // returnerar dem just nu — ordningen är icke-deterministisk i deras API).
  const sorted = [...urls].map((u) => u.trim()).filter(Boolean).sort();
  return hashString(sorted.join("|"));
}
