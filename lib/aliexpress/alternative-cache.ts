// 30-dagars cache för alternativa leverantörer (Feature 3 — kostnadsoptimering).
//
// Den deterministiska sökvägen (EU-först + orders-rankning) är gratis men
// kostar ett AliExpress-API-anrop per OOS-händelse. Vi cachar resultatet i
// 30 dagar per produkt så att upprepade slut-händelser (eller flera cron-
// körningar) inte gör om sökningen i onödan.
//
// Wix Data-kollektion: FyndplatsAlternativeCache
//   _id             — Wix-produkt-id (originalprodukten som tog slut)
//   alternativesJson — JSON-stringad AlternativeSupplier[] (TEXT-fält)
//   computedAt       — ISO-tid då alternativen beräknades
//
// Mönstret speglar lib/restock/store.ts: egna fetch-helpers, 404/"unknown
// collection" → null (kollektion ej skapad än), annars throw med body.

import type { AlternativeSupplier } from "./alternatives";

const WIX_BASE = "https://www.wixapis.com";
const COL = process.env.WIX_DATA_COL_ALT_CACHE ?? "FyndplatsAlternativeCache";

export const CACHE_TTL_DAYS = 30;

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

export interface AlternativeCacheEntry {
  alternatives: AlternativeSupplier[];
  computedAt: string;
}

/** True om computedAt är färskare än maxAgeDays. Ren funktion — testad. */
export function isFresh(computedAt: string, now: Date, maxAgeDays = CACHE_TTL_DAYS): boolean {
  const t = Date.parse(computedAt);
  if (!Number.isFinite(t)) return false;
  return now.getTime() - t < maxAgeDays * 24 * 3600 * 1000;
}

export class AlternativeCache {
  /** Hämtar cachad post, eller null om saknas/korrupt/kollektion ej skapad. */
  async get(productId: string): Promise<AlternativeCacheEntry | null> {
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(productId)}?dataCollectionId=${encodeURIComponent(COL)}`;
    const res = await fetch(url, { method: "GET", headers: headers() });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) return null;
      throw new Error(`Wix Data get ${COL} (${res.status}): ${text.slice(0, 300)}`);
    }
    const body = (await res.json()) as {
      dataItem?: { data?: { alternativesJson?: string; computedAt?: string } };
    };
    const data = body.dataItem?.data;
    if (!data?.alternativesJson || !data.computedAt) return null;
    try {
      const alternatives = JSON.parse(data.alternativesJson) as AlternativeSupplier[];
      if (!Array.isArray(alternatives)) return null;
      return { alternatives, computedAt: data.computedAt };
    } catch {
      return null;
    }
  }

  /** Skriver alternativ till cachen (overwrite per produkt). */
  async save(productId: string, alternatives: AlternativeSupplier[], computedAt = new Date().toISOString()): Promise<void> {
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COL,
        dataItem: {
          id: productId,
          dataCollectionId: COL,
          data: { _id: productId, alternativesJson: JSON.stringify(alternatives), computedAt },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wix Data save ${COL} (${res.status}): ${text.slice(0, 300)}`);
    }
  }
}

let singleton: AlternativeCache | null = null;
export function getAlternativeCache(): AlternativeCache {
  if (!singleton) singleton = new AlternativeCache();
  return singleton;
}
