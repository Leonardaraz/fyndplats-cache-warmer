// Restock-prenumeranter (Feature 1 — hybrid slut-i-lager-hantering).
//
// När en produkt är slut hos leverantören döljs den från listningarna men
// produktsidan lever kvar med ett "Meddela mig"-formulär. Adresserna landar
// här. När produkten kommer tillbaka i lager skickar sync-cronen ett
// restock-mejl till alla som väntar och stämplar notifiedAt.
//
// Wix Data-kollektion: FyndplatsRestockSubscribers
//   _id          — `${productId}:${sha1(emailLower)}` (idempotent per e-post+produkt)
//   productId    — Wix-produkt-id
//   email        — gemener, trimmad
//   subscribedAt — ISO
//   notifiedAt   — ISO eller null (null = väntar på restock-mejl)
//
// Mönstret speglar lib/sync/sync-log.ts: egna fetch-helpers, 404/"unknown
// collection" → tom lista (kollektionen ej skapad än), annars throw med body.
// Kollektionen auto-skapas vid första skrivningen om den saknas i Wix.

import { createHash } from "node:crypto";

const WIX_BASE = "https://www.wixapis.com";

const COL = process.env.WIX_DATA_COL_RESTOCK ?? "FyndplatsRestockSubscribers";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

export interface RestockSubscriber {
  /** `${productId}:${sha1(emailLower)}` */
  id: string;
  productId: string;
  email: string;
  subscribedAt: string;
  /** null = väntar på restock-mejl; ISO = redan notifierad. */
  notifiedAt: string | null;
}

/**
 * Enkel men robust e-postvalidering (RFC 5322 light). Ren funktion — testad.
 * Vi vill inte ta in skräp i kollektionen, men inte heller vara strängare än
 * gängse webbformulär.
 */
export function isValidEmail(input: string): boolean {
  const email = input.trim();
  if (email.length < 3 || email.length > 254) return false;
  // Exakt en @, icke-tom lokal-del, domän med minst en punkt och TLD ≥ 2.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function subscriberId(productId: string, email: string): string {
  const hash = createHash("sha1").update(normalizeEmail(email)).digest("hex").slice(0, 16);
  return `${productId}:${hash}`;
}

async function save(id: string, data: Record<string, unknown>): Promise<void> {
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

async function get(id: string): Promise<RestockSubscriber | null> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COL)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return null;
    }
    throw new Error(`Wix Data get ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItem?: { data?: RestockSubscriber } };
  return body.dataItem?.data ?? null;
}

async function query(
  filter?: Record<string, unknown>,
  limit = 1000,
  offset = 0,
): Promise<RestockSubscriber[]> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COL,
      query: {
        filter: filter ?? {},
        sort: [{ fieldName: "subscribedAt", order: "DESC" }],
        // Wix Data tillåter MAX limit=1000 per fråga (WDE0077). Större värde
        // kastar 400 → det gömde tidigare HELA restock-listan i admin-vyn.
        paging: offset > 0 ? { limit, offset } : { limit },
      },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    // Kollektionen ej skapad än → semantiskt tom.
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return [];
    }
    throw new Error(`Wix Data query ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: RestockSubscriber }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is RestockSubscriber => Boolean(d));
}

export type SubscribeOutcome = "subscribed" | "already_subscribed" | "resubscribed";

export class RestockStore {
  /**
   * Registrerar en e-post för restock-avisering. Idempotent: samma e-post +
   * produkt skriver inte en dubblett. Om personen redan notifierats tidigare
   * (notifiedAt satt) och prenumererar igen → nollställs notifiedAt så hen får
   * nästa restock-mejl ("resubscribed").
   */
  async subscribe(productId: string, emailRaw: string): Promise<SubscribeOutcome> {
    const email = normalizeEmail(emailRaw);
    const id = subscriberId(productId, email);
    const existing = await get(id);
    if (existing && existing.notifiedAt == null) {
      return "already_subscribed";
    }
    const outcome: SubscribeOutcome = existing ? "resubscribed" : "subscribed";
    await save(id, {
      productId,
      email,
      subscribedAt: new Date().toISOString(),
      notifiedAt: null,
    });
    return outcome;
  }

  /** Väntande prenumeranter (notifiedAt == null) för en produkt. */
  async listPendingForProduct(productId: string): Promise<RestockSubscriber[]> {
    const rows = await query({ productId });
    return rows.filter((r) => r.notifiedAt == null);
  }

  /** Alla prenumeranter (för admin-vyn). Paginerar 1000/sida — det tidigare
   *  `limit = 2000` överskred Wix Datas tak (WDE0077), kastade, och dolde därmed
   *  HELA listan i /admin/restock-list trots att prenumeranter fanns. */
  async listAll(max = 10000): Promise<RestockSubscriber[]> {
    const pageSize = 1000;
    const out: RestockSubscriber[] = [];
    for (let offset = 0; offset < max; offset += pageSize) {
      const page = await query(undefined, pageSize, offset);
      out.push(...page);
      if (page.length < pageSize) break;
    }
    return out;
  }

  /** Stämplar notifiedAt på en lista av prenumeranter (efter skickat mejl). */
  async markNotified(ids: string[], at = new Date().toISOString()): Promise<void> {
    for (const id of ids) {
      const existing = await get(id);
      if (!existing) continue;
      await save(id, { ...existing, notifiedAt: at });
    }
  }
}

let singleton: RestockStore | null = null;
export function getRestockStore(): RestockStore {
  if (!singleton) singleton = new RestockStore();
  return singleton;
}

/**
 * Aggregerar prenumeranter per produkt för admin-vyn /admin/restock-list.
 * Ren funktion — testbar utan Wix.
 */
export interface RestockProductCount {
  productId: string;
  pending: number;
  notified: number;
  total: number;
  latestSubscribedAt: string | null;
}

export function countByProduct(subs: RestockSubscriber[]): RestockProductCount[] {
  const map = new Map<string, RestockProductCount>();
  for (const s of subs) {
    const cur = map.get(s.productId) ?? {
      productId: s.productId,
      pending: 0,
      notified: 0,
      total: 0,
      latestSubscribedAt: null,
    };
    cur.total++;
    if (s.notifiedAt == null) cur.pending++;
    else cur.notified++;
    if (!cur.latestSubscribedAt || s.subscribedAt > cur.latestSubscribedAt) {
      cur.latestSubscribedAt = s.subscribedAt;
    }
    map.set(s.productId, cur);
  }
  return [...map.values()].sort((a, b) => b.pending - a.pending || b.total - a.total);
}
