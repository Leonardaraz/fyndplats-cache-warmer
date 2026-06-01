// lib/abandoned-checkout-poll.ts
//
// Belt-and-braces source for the abandoned-cart flow. The original design (Phase 3)
// depended ENTIRELY on Wix delivering a `wix.ecom.v1.abandoned_checkout` / `created`
// webhook to /api/wix-webhook. In production that webhook was never delivered (the
// subscription was never wired in the Wix Dev Center app), so no cart ever got
// enqueued and no recovery email ever went out — even though Wix WAS correctly
// creating abandoned-checkout records for our Headless checkouts.
//
// This module removes that dependency: it polls the Wix eCom Abandoned Checkouts
// REST API (which works with our existing WIX_API_KEY) and feeds each fresh
// ABANDONED checkout into the same enqueueAbandonedCart() pipeline. Idempotent —
// enqueue is keyed on the abandoned-checkout id (ON CONFLICT DO NOTHING) and the
// per-email 30-day cooldown still applies, so polling the same checkout repeatedly
// is a no-op.
//
// Endpoint: POST https://www.wixapis.com/ecom/v1/abandoned-checkout/query
//   body { query: { sort, paging } } -> { results: AbandonedCheckout[] }
// (There is no list endpoint; query is the documented way to read more than one.)

import { wixFetch } from './wix-client';
import { enqueueAbandonedCart, type CartItem, type EnqueueResult } from './abandoned-cart';

interface WixMoney {
  amount?: string;
  convertedAmount?: string;
}
interface WixAbandonedCheckout {
  id?: string;
  createdDate?: string;
  status?: string; // ABANDONED | RECOVERED | ...
  currency?: string;
  checkoutUrl?: string;
  buyerInfo?: { email?: string; phone?: string };
  totalPrice?: WixMoney;
  subtotalPrice?: WixMoney;
  lineItems?: WixLineItem[];
}

interface WixLineItem {
  quantity?: number;
  productName?: { original?: string; translated?: string };
  price?: WixMoney;
  image?: { url?: string } | string;
}

interface QueryResponse {
  results?: WixAbandonedCheckout[];
}

function toMinor(m: WixMoney | undefined): number {
  const n = m?.amount ? Number(m.amount) : 0;
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function imageUrl(img: WixLineItem['image']): string | null {
  if (!img) return null;
  if (typeof img === 'string') return img || null;
  return img.url || null;
}

function mapItems(rec: WixAbandonedCheckout): CartItem[] {
  return (rec.lineItems || []).map((li) => ({
    name:
      li.productName?.original ||
      li.productName?.translated ||
      'Vara',
    quantity: li.quantity || 1,
    imageUrl: imageUrl(li.image),
    priceMinor: toMinor(li.price),
  }));
}

// Wix's recover link (302s the buyer back into their hosted checkout). Upgrade the
// http:// the API hands back to https:// so email clients don't flag it.
function recoverUrl(rec: WixAbandonedCheckout): string {
  const u = rec.checkoutUrl;
  if (u && u.startsWith('http')) return u.replace(/^http:\/\//, 'https://');
  return 'https://www.fyndplats.se';
}

export interface PollResult {
  scanned: number;
  considered: number;
  enqueued: number;
  skipped: number;
  details: Array<{ cartId: string; email: string; outcome: string; reason?: string }>;
}

export interface PollOptions {
  /** Only consider checkouts abandoned within this many hours. Default 24. */
  lookbackHours?: number;
  /** Max records to pull from Wix per poll. Default 50. */
  limit?: number;
  /** Inject now() for tests. */
  now?: Date;
}

export async function pollAbandonedCheckouts(opts: PollOptions = {}): Promise<PollResult> {
  const lookbackHours = opts.lookbackHours ?? 24;
  const limit = opts.limit ?? 50;
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

  const resp = await wixFetch<QueryResponse>({
    method: 'POST',
    path: '/ecom/v1/abandoned-checkout/query',
    body: { query: { sort: [{ fieldName: 'createdDate', order: 'DESC' }], paging: { limit } } },
  });

  const all = resp.results ?? [];
  const result: PollResult = { scanned: all.length, considered: 0, enqueued: 0, skipped: 0, details: [] };

  for (const rec of all) {
    const cartId = rec.id || '';
    const email = rec.buyerInfo?.email || '';
    const createdAt = rec.createdDate ? new Date(rec.createdDate) : null;

    // Only act on currently-abandoned checkouts with an email, abandoned recently.
    if (rec.status !== 'ABANDONED' || !cartId || !email || !createdAt) continue;
    if (createdAt < cutoff) continue;
    result.considered++;

    const subtotalMinor = toMinor(rec.subtotalPrice) || toMinor(rec.totalPrice);

    let enq: EnqueueResult;
    try {
      enq = await enqueueAbandonedCart({
        cartId,
        email,
        phone: rec.buyerInfo?.phone ?? null,
        shippingAddress: null, // not present on the list/query projection
        items: mapItems(rec),
        subtotalMinor,
        currency: rec.currency || 'SEK',
        recoverUrl: recoverUrl(rec),
        abandonedAt: createdAt,
      });
    } catch (err) {
      result.skipped++;
      result.details.push({ cartId, email, outcome: 'error', reason: err instanceof Error ? err.message : String(err) });
      continue;
    }

    if (enq.enqueued) {
      result.enqueued++;
      result.details.push({ cartId, email, outcome: 'enqueued' });
    } else {
      result.skipped++;
      result.details.push({ cartId, email, outcome: 'skipped', reason: enq.reason });
    }
  }

  return result;
}
