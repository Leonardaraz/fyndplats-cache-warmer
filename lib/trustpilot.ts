// lib/trustpilot.ts
//
// Server-side Trustpilot-hjälpare: konfig-grindar, evaluate-URL-byggare, hämtning
// av nyligen levererade ordrar (för review-request-cronet) samt AFS-inbjudan via
// Trustpilots API. Allt är env-gateat — utan TRUSTPILOT_BUSINESS_UNIT_ID gör
// funktionerna ingenting och cronet blir en no-op. Se docs/trustpilot-setup.md.

/* eslint-disable @typescript-eslint/no-explicit-any */

const WIX_ORDERS_SEARCH = "https://www.wixapis.com/ecom/v1/orders/search";
const REVIEW_DOMAIN = "fyndplats.se";

/** True när business unit-ID:t är ifyllt (minimikrav för alla widgets/cron). */
export function isTrustpilotConfigured(): boolean {
  return Boolean((process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "").trim());
}

/** True när AFS-API:t kan användas (business unit + API-token). */
export function hasAfsApi(): boolean {
  return (
    isTrustpilotConfigured() && Boolean((process.env.TRUSTPILOT_API_KEY || "").trim())
  );
}

/**
 * Trustpilot evaluate-URL. Order-ID + e-post för-ifylls så att omdömet
 * registreras som ett verifierat köp. Detta är gratis-vägen — ingen AFS-API
 * krävs, kunden klickar bara länken i mejlet.
 */
export function trustpilotReviewUrl(orderId: string, email: string): string {
  const u = new URL(`https://www.trustpilot.com/evaluate/${REVIEW_DOMAIN}`);
  if (orderId) u.searchParams.set("orderId", orderId);
  if (email) u.searchParams.set("email", email);
  return u.toString();
}

function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

export interface DeliveredOrder {
  orderId: string;
  orderNumber: string;
  email: string;
  firstName: string;
  productName?: string;
  /** ISO-tidpunkt då ordern fulfillades (= bästa proxyn för leverans). */
  fulfilledAt: string;
}

/** Förnamn ur en Wix ecom-order (billing → recipient → buyer-fallback). */
function extractFirstName(order: Record<string, unknown>): string {
  const contact =
    (order.billingInfo as any)?.contactDetails ??
    (order.recipientInfo as any)?.contactDetails ??
    (order.buyerInfo as any)?.contactDetails;
  return firstStr(contact?.firstName) ?? "";
}

function extractEmail(order: Record<string, unknown>): string | undefined {
  return firstStr(
    (order.buyerInfo as any)?.email,
    (order.recipientInfo as any)?.contactDetails?.email,
    (order.billingInfo as any)?.contactDetails?.email,
  );
}

function extractProductName(order: Record<string, unknown>): string | undefined {
  const items = order.lineItems as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(items) || !items.length) return undefined;
  const li = items[0];
  return firstStr(
    (li.productName as any)?.original,
    li.productName as string,
    li.name as string,
  );
}

/**
 * Bästa tillgängliga fulfillment-tidpunkt för en order. Wix ecom-ordern bär inte
 * alltid en explicit fulfillment-array i sök-svaret, så vi probar i fallande
 * ordning: senaste fulfillment.createdDate → updatedDate (när status flippade
 * till FULFILLED ≈ fulfillment-tid) → createdDate. Returnerar ISO eller null.
 */
function fulfilledAtOf(order: Record<string, unknown>): string | null {
  const fulfillments = order.fulfillments as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(fulfillments) && fulfillments.length) {
    const dates = fulfillments
      .map((f) => firstStr(f._createdDate as string, f.createdDate as string))
      .filter(Boolean) as string[];
    if (dates.length) return dates.sort().slice(-1)[0];
  }
  return (
    firstStr(order.updatedDate as string, order._updatedDate as string, order.createdDate as string) ??
    null
  );
}

/**
 * Ordrar som fulfillades på `targetDay` (svensk dag-fönster [00:00, +24h)).
 * Hämtar FULFILLED-ordrar i ett lookback-fönster och filtrerar på fulfillment-
 * tidpunkt. Returnerar tomt (ok:true) utan att kasta om inget matchar; ok:false
 * bara vid API-fel/saknad nyckel så cronet kan logga men ändå svara 200.
 */
export async function fetchOrdersFulfilledOn(
  targetDay: Date,
  opts?: { lookbackDays?: number; maxPages?: number },
): Promise<{ ok: boolean; orders: DeliveredOrder[]; scanned: number; note?: string }> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) {
    return { ok: false, orders: [], scanned: 0, note: "WIX_API_KEY/WIX_SITE_ID saknas" };
  }

  // Dag-fönstret [start, end) i UTC. targetDay förväntas redan vara satt till
  // midnatt; vi normaliserar ändå.
  const start = new Date(targetDay);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const lookbackDays = Math.max(1, Math.min(60, opts?.lookbackDays ?? 21));
  const maxPages = Math.max(1, Math.min(20, opts?.maxPages ?? 10));
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const out: DeliveredOrder[] = [];
  let scanned = 0;
  let pages = 0;
  let cursor: string | undefined;

  try {
    do {
      const body = cursor
        ? { search: { cursorPaging: { cursor } } }
        : {
            search: {
              filter: { fulfillmentStatus: "FULFILLED", createdDate: { $gte: since } },
              cursorPaging: { limit: 100 },
            },
          };

      const res = await fetch(WIX_ORDERS_SEARCH, {
        method: "POST",
        headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return {
          ok: false,
          orders: out,
          scanned,
          note: `Wix Orders-API ${res.status}${txt ? `: ${txt.slice(0, 160)}` : ""}`,
        };
      }

      const data = (await res.json()) as {
        orders?: Record<string, unknown>[];
        metadata?: { cursors?: { next?: string } };
        pagingMetadata?: { cursors?: { next?: string } };
      };
      const orders = data.orders ?? [];
      pages += 1;

      for (const order of orders) {
        scanned += 1;
        const fulfilledAt = fulfilledAtOf(order);
        if (!fulfilledAt) continue;
        const t = Date.parse(fulfilledAt);
        if (!Number.isFinite(t) || t < start.getTime() || t >= end.getTime()) continue;

        const email = extractEmail(order);
        const orderId = firstStr(order._id as string, order.id as string);
        if (!email || !orderId) continue;

        out.push({
          orderId,
          orderNumber: firstStr(order.number as string, order.orderNumber as string, orderId)!,
          email,
          firstName: extractFirstName(order),
          productName: extractProductName(order),
          fulfilledAt,
        });
      }

      cursor = data.metadata?.cursors?.next ?? data.pagingMetadata?.cursors?.next ?? undefined;
    } while (cursor && pages < maxPages);

    return { ok: true, orders: out, scanned };
  } catch (err) {
    return {
      ok: false,
      orders: out,
      scanned,
      note: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Skickar en AFS-inbjudan via Trustpilots API. Kräver att TRUSTPILOT_API_KEY är
 * en giltig access-token (Trustpilots AFS-API är OAuth2-skyddat — se
 * docs/trustpilot-setup.md för hur token hämtas). Best-effort: vid fel
 * returneras ok:false så cronet kan falla tillbaka på Resend-mejlet.
 */
export async function sendAfsInvitation(order: DeliveredOrder): Promise<{ ok: boolean; note?: string }> {
  const bu = (process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "").trim();
  const token = (process.env.TRUSTPILOT_API_KEY || "").trim();
  if (!bu || !token) return { ok: false, note: "AFS ej konfigurerat" };

  try {
    const res = await fetch(
      `https://api.trustpilot.com/v1/private/business-units/${bu}/email-invitations`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: order.email,
          recipientName: order.firstName || undefined,
          referenceId: order.orderId,
          locale: "sv-SE",
          senderName: "Fyndplats",
          senderEmail: "info@fyndplats.com",
          replyTo: "info@fyndplats.com",
          // Service review-inbjudan; produkt-review-länkning sker via SKU i widgeten.
          serviceReviewInvitation: { templateId: undefined, redirectUri: `https://www.${REVIEW_DOMAIN}` },
        }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, note: `Trustpilot AFS ${res.status}${txt ? `: ${txt.slice(0, 160)}` : ""}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, note: err instanceof Error ? err.message : String(err) };
  }
}
