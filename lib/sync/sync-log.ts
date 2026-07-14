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
  | "dry_run"
  // Hämtningen felade (oklassat eller 604 All SKU Unsaleable) — raden gör
  // felet SYNLIGT i loggen/admin (audit-fynd 6, 2026-07-14: 21 produkter
  // felade tyst i 8 dagar utan spår någonstans).
  | "error";

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
  /**
   * ISO-tid då produkten senast gick till slut-i-lager (Feature 8 — SEO-vänlig
   * OOS). Sätts vid övergången aktiv→slut och nollställs (null) vid restock.
   * Låter headless-sajten visa "Slutsåld sedan X" på produktsidan. Saknas/null
   * = produkten är inte (och har inte registrerats som) slut.
   */
  outOfStockSince?: string | null;
  /**
   * Antal körningar i RAD som klassat produkten som "borttagen" hos AliExpress.
   * Nollställs så fort produkten ses igen. Vi döljer först vid
   * REMOVED_STRIKES_REQUIRED så ett transient "not found" inte gömmer en levande
   * produkt. Saknas/0 = inga obekräftade borttagnings-observationer.
   */
  removedStreak?: number;
  /**
   * Antal körningar i RAD där AliExpress-hämtningen felade OKLASSAT (nätfel,
   * throttling, degraderat svar — eller en död listning vars felsvar vi inte
   * känner igen, t.ex. 200 med 0 varianter). Rotationen går ändå vidare
   * (lastCheckedAt bumpas — tidigare frös produkten längst fram i äldst-först-
   * kön och brände kvot varje körning). Vid ERROR_STRIKES_AS_REMOVED behandlas
   * felet som borttagen listning. Nollställs vid lyckad hämtning.
   */
  errorStreak?: number;
  /**
   * True när det är SYNKEN som dolt produkten (listning borttagen/felsvit).
   * Utan denna kunde en produkt synken dolt aldrig auto-återställas —
   * shouldRestore krävde wixVisible=true, men synkens egen döljning gör ju
   * produkten osynlig (audit-fynd 2, 2026-07-14). Manuell unpublish (visible=
   * false UTAN denna flagga) respekteras fortfarande. Nollas vid restore.
   */
  hiddenBySync?: boolean;
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
  /** Wix-produktens slug — låter admin länka direkt till live-sidan
   *  (fyndplats.se/produkt/<slug>). Saknas på alerts skapade före fältet;
   *  admin-sidan faller då tillbaka på ett batch-uppslag mot Wix. */
  productSlug?: string;
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

  /**
   * Händelse-rader (allt utom none/dry_run) sedan `sinceIso` — morgonmejlets
   * dygns-digest. Serverfiltrerat: vanliga none-rader (en per kollad produkt,
   * ~600/dygn vid 6 körningar × 100) skulle annars äta paging-limiten så att
   * dygnets tidiga händelser föll utanför. ISO-strängar jämförs lexikografiskt
   * = kronologiskt.
   */
  async listEventLogSince(sinceIso: string, limit = 500): Promise<SyncLogEntry[]> {
    return query<SyncLogEntry>(
      COL.log,
      {
        actionTaken: { $in: ["hidden", "marked_oos", "restored", "error"] },
        checkedAt: { $gt: sinceIso },
      },
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

  /**
   * Produkter i problemläge — det admin-sidans "Lager & synlighet"-sektion
   * visar: slut i lager, dolda (listning borttagen) eller mitt i en felsvit
   * (errorStreak > 0, på väg att klassas som borttagen). Sorterat på senast
   * kollad (nyast först).
   */
  async listProblemStates(limit = 500): Promise<SyncStateEntry[]> {
    return query<SyncStateEntry>(
      COL.state,
      {
        $or: [
          { listingStatus: { $in: ["out_of_stock", "removed"] } },
          { errorStreak: { $gt: 0 } },
        ],
      },
      [{ fieldName: "lastCheckedAt", order: "DESC" }],
      limit,
    );
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
