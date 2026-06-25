// lib/handlers/abandoned-checkout-handler.ts
// Parses a `wix.ecom.v1.abandoned_checkout` slug=created webhook payload and enqueues
// it for the flow. Splits parsing out of the wix-webhook route so the route stays a
// thin dispatcher matching the Phase 2 pattern.

import { enqueueAbandonedCart, type CartItem } from '../abandoned-cart';
import type { NormalisableAddress } from '../address-hash';

export interface AbandonedCheckoutCreatedEvent {
  entityFqdn?: string;
  slug?: string;
  entityId?: string;
  eventTime?: string;
  data?: { abandonedCheckout?: AbandonedCheckoutPayload };
  abandonedCheckout?: AbandonedCheckoutPayload;
}

interface AbandonedCheckoutPayload {
  _id?: string;
  id?: string;
  abandonTime?: string;
  recoverUrl?: string;
  checkoutUrl?: string;
  buyerInfo?: { email?: string; phone?: string; contactId?: string };
  buyerEmail?: string;
  totals?: { subtotal?: string | number; currency?: string };
  priceSummary?: { subtotal?: { amount?: string }; total?: { amount?: string } };
  currency?: string;
  lineItems?: Array<{
    quantity?: number;
    productName?: { translated?: string; original?: string };
    name?: string;
    image?: { url?: string } | string;
    price?: { amount?: string };
    fullPrice?: { amount?: string };
  }>;
  shippingInfo?: {
    shippingDestination?: { address?: LooseAddress };
    address?: LooseAddress;
  };
}

interface LooseAddress {
  addressLine1?: string;
  addressLine?: string;
  addressLine2?: string;
  postalCode?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

function toMinor(amount: string | number | undefined): number {
  if (amount === undefined || amount === null) return 0;
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function pickItems(payload: AbandonedCheckoutPayload): CartItem[] {
  const lis = payload.lineItems || [];
  return lis.map((li) => {
    const name =
      (li.productName && li.productName.translated) ||
      (li.productName && li.productName.original) ||
      li.name ||
      'Vara';
    let imageUrl: string | null = null;
    if (typeof li.image === 'string') imageUrl = li.image;
    else if (li.image && li.image.url) imageUrl = li.image.url;
    const priceMinor = toMinor(
      (li.price && li.price.amount) || (li.fullPrice && li.fullPrice.amount),
    );
    return { name, quantity: li.quantity || 1, imageUrl, priceMinor };
  });
}

function pickAddress(payload: AbandonedCheckoutPayload): NormalisableAddress | null {
  let a: LooseAddress | undefined = undefined;
  if (payload.shippingInfo?.shippingDestination?.address) {
    a = payload.shippingInfo.shippingDestination.address;
  } else if (payload.shippingInfo?.address) {
    a = payload.shippingInfo.address;
  }
  if (!a) return null;
  return {
    addressLine1: a.addressLine1 || a.addressLine || null,
    addressLine2: a.addressLine2 || null,
    postalCode: a.postalCode || a.zipCode || null,
    city: a.city || null,
    country: a.country || 'SE',
  };
}

export interface HandleResult {
  ok: boolean;
  reason?: string;
  cartId?: string;
}

export async function handleAbandonedCheckoutCreated(
  event: AbandonedCheckoutCreatedEvent,
): Promise<HandleResult> {
  if (event.slug && event.slug !== 'created') {
    return { ok: false, reason: 'unexpected slug ' + event.slug };
  }
  const payload =
    (event.data && event.data.abandonedCheckout) || event.abandonedCheckout;
  if (!payload) return { ok: false, reason: 'no abandonedCheckout payload' };

  const cartId = payload._id || payload.id || event.entityId || '';
  const email =
    (payload.buyerInfo && payload.buyerInfo.email) ||
    payload.buyerEmail ||
    '';
  if (!cartId || !email) return { ok: false, reason: 'missing cartId or email' };

  const items = pickItems(payload);

  let subtotalMinor = 0;
  if (payload.priceSummary && payload.priceSummary.subtotal) {
    subtotalMinor = toMinor(payload.priceSummary.subtotal.amount);
  }
  if (!subtotalMinor && payload.totals) {
    subtotalMinor = toMinor(payload.totals.subtotal as string | number | undefined);
  }
  // Wix abandoned-checkout-payloads saknar ofta priceSummary/totals (de fylls i
  // först vid order) → summera radpriserna så Summan ALDRIG blir 0 när varorna har
  // pris. (Bug: mejlet visade "Summa: 0 kr" trots korrekta radpriser.) Påverkar
  // även rabattkods-grinden (MIN_SUBTOTAL_FOR_CODE), som annars trodde att kvarvarande
  // varukorg var tom och aldrig delade ut kod.
  if (!subtotalMinor) {
    subtotalMinor = items.reduce((s, it) => s + it.priceMinor * (it.quantity || 1), 0);
  }

  const fallbackCurrency = payload.currency || 'SEK';
  const currency = (payload.totals && payload.totals.currency) || fallbackCurrency;
  const phone = (payload.buyerInfo && payload.buyerInfo.phone) || null;
  const recoverUrl = payload.recoverUrl || payload.checkoutUrl || null;
  const shippingAddress = pickAddress(payload);
  const abandonedAt = payload.abandonTime ? new Date(payload.abandonTime) : new Date();

  const result = await enqueueAbandonedCart({
    cartId,
    email,
    phone,
    shippingAddress,
    items,
    subtotalMinor,
    currency,
    recoverUrl,
    abandonedAt,
  });

  return {
    ok: result.enqueued || result.reason === 'already_exists',
    reason: result.reason,
    cartId,
  };
}
