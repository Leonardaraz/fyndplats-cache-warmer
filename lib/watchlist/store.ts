// Persistent watchlist för /admin/discover. Cron-jobbet (dagligen 06:00 UTC)
// kör varje term igen, jämför mot förra resultatet och mejlar Leonard om
// nya EU-warehouse-träffar finns.
//
// Lagring: Wix Data-collection (FyndplatsDiscoverWatchlist) när det finns en
// persistent backend alls, annars in-memory (för dev/test). Den ligger KVAR i
// Wix efter Postgres-migreringen — se lib/store/backend.ts.
//
// Skikt: vi exponerar bara list/add/remove + getSeenProductIds /
// setSeenProductIds — cron-jobbet använder seen-set för att avgöra
// vilka träffar som är "nya" sedan föregående körning.

import { isPersistentBackend } from "../store/backend";

const WIX_BASE = "https://www.wixapis.com";
const COL = process.env.WIX_DATA_COL_WATCHLIST ?? "FyndplatsDiscoverWatchlist";

export interface WatchlistEntry {
  /** Sökterm, t.ex. "yogamatta". Lägsta-fall för match. */
  term: string;
  /** Produkt-id:n vi redan har sett — diffas mot nästa körning. */
  seenProductIds: string[];
  /** ISO-tid för senaste cron-körning. */
  lastCheckedAt?: string;
  createdAt: string;
}

export interface WatchlistStore {
  list(): Promise<string[]>;
  add(term: string): Promise<void>;
  remove(term: string): Promise<void>;
  getEntry(term: string): Promise<WatchlistEntry | null>;
  setEntry(entry: WatchlistEntry): Promise<void>;
  /** Listar alla entries för cron-jobbet. */
  listEntries(): Promise<WatchlistEntry[]>;
}

// In-memory store — överlever inte serverless cold-start. För prod krävs
// STORE_BACKEND=wix-data.
class MemoryWatchlistStore implements WatchlistStore {
  private entries = new Map<string, WatchlistEntry>();

  async list(): Promise<string[]> {
    return [...this.entries.values()].map((e) => e.term);
  }
  async add(term: string): Promise<void> {
    const key = term.toLowerCase();
    if (this.entries.has(key)) return;
    this.entries.set(key, {
      term,
      seenProductIds: [],
      createdAt: new Date().toISOString(),
    });
  }
  async remove(term: string): Promise<void> {
    this.entries.delete(term.toLowerCase());
  }
  async getEntry(term: string): Promise<WatchlistEntry | null> {
    return this.entries.get(term.toLowerCase()) ?? null;
  }
  async setEntry(entry: WatchlistEntry): Promise<void> {
    this.entries.set(entry.term.toLowerCase(), entry);
  }
  async listEntries(): Promise<WatchlistEntry[]> {
    return [...this.entries.values()];
  }
}

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token,
  };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

class WixDataWatchlistStore implements WatchlistStore {
  private idFor(term: string): string {
    // Wix Data accepterar URL-safe id:n; vi använder lowercased term
    // (med non-alphanumeric ersatt) — kollisionssäkert för vår use-case.
    return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async list(): Promise<string[]> {
    const entries = await this.listEntries();
    return entries.map((e) => e.term);
  }

  async listEntries(): Promise<WatchlistEntry[]> {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        dataCollectionId: COL,
        query: { filter: {}, paging: { limit: 100 } },
      }),
    });
    if (res.status === 404) return [];
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist/i.test(text)) return [];
      throw new Error(`Wix Data list-watchlist (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { dataItems?: { data?: WatchlistEntry }[] };
    return (body.dataItems ?? [])
      .map((d) => d.data)
      .filter((d): d is WatchlistEntry => Boolean(d && d.term));
  }

  async add(term: string): Promise<void> {
    const id = this.idFor(term);
    const existing = await this.getEntry(term);
    if (existing) return;
    const entry: WatchlistEntry = {
      term,
      seenProductIds: [],
      createdAt: new Date().toISOString(),
    };
    await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        dataCollectionId: COL,
        dataItem: { id, dataCollectionId: COL, data: entry },
      }),
    });
  }

  async remove(term: string): Promise<void> {
    const id = this.idFor(term);
    await fetch(
      `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COL)}`,
      { method: "DELETE", headers: wixHeaders() },
    );
  }

  async getEntry(term: string): Promise<WatchlistEntry | null> {
    const id = this.idFor(term);
    const res = await fetch(
      `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COL)}`,
      { method: "GET", headers: wixHeaders() },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const body = (await res.json()) as { dataItem?: { data?: WatchlistEntry } };
    return body.dataItem?.data ?? null;
  }

  async setEntry(entry: WatchlistEntry): Promise<void> {
    const id = this.idFor(entry.term);
    await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        dataCollectionId: COL,
        dataItem: { id, dataCollectionId: COL, data: entry },
      }),
    });
  }
}

let cached: WatchlistStore | null = null;

export function getWatchlistStore(): WatchlistStore {
  if (cached) return cached;
  // Ligger kvar i Wix Data — frågan är alltså "finns persistent lagring?",
  // inte "är Store på wix-data?". Med den gamla jämförelsen mot "wix-data" föll
  // den här TYST till minnet så fort Store bytte drift-databas.
  cached = isPersistentBackend() ? new WixDataWatchlistStore() : new MemoryWatchlistStore();
  return cached;
}

// Test-helper: nollställer den cachade store-instansen (används av unit tests).
export function _resetWatchlistStore(): void {
  cached = null;
}
