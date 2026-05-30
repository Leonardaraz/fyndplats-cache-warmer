// lib/discount-codes.ts
// Mint / revoke unique single-use 5% coupons via the Wix Marketing/Coupons REST API.
// POST https://www.wixapis.com/stores/v2/coupons
//
// Spec (per fyndplats requirements):
//   - percentOffRate: 5
//   - usageLimit: 1                 (single use globally)
//   - limitedToOnePerCustomer: true (defence-in-depth)
//   - minimumSubtotal: 200          (SEK)
//   - expirationTime: now + 24h
//   - active: true
//   - code: human-friendly, per-cart, prefix FP5-
//
// Wix expects ISO 8601 timestamps. Amounts are in major units (SEK whole kronor).

import { wixFetch, WixApiError } from './wix-client';

export interface MintCouponInput {
  cartId: string;
  /** Cart subtotal in major SEK (whole kronor, integer). Used only for log/return — Wix validates min separately. */
  subtotalSek: number;
}

export interface MintedCoupon {
  code: string;
  wixCouponId: string;
  expiresAt: string; // ISO
}

interface CreateCouponResponse {
  coupon?: { id: string; specification?: { code?: string; expirationTime?: string } };
  id?: string;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easier to type

function randomCode(length = 8): string {
  let out = '';
  // crypto.getRandomValues works in both node and edge runtimes.
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export function generateCartCouponCode(cartId: string): string {
  // Stable per cart so we never accidentally mint two for the same cart on retries.
  // We seed with the cart id + a short random suffix — the random suffix is what guards
  // against guessing.
  const shortCart = cartId.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `FP5-${shortCart}-${randomCode(6)}`;
}

export async function mintAbandonedCartCoupon(input: MintCouponInput): Promise<MintedCoupon> {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  const code = generateCartCouponCode(input.cartId);

  const body = {
    specification: {
      name: `Abandoned cart 5% – ${input.cartId.slice(0, 8)}`,
      code,
      startTime: now.toISOString(),
      expirationTime: expires.toISOString(),
      active: true,
      percentOffRate: 5,
      minimumSubtotal: 200,
      usageLimit: 1,
      limitedToOnePerCustomer: true,
      scope: { namespace: 'stores' }, // applies to all store items
    },
  };

  const res = await wixFetch<CreateCouponResponse>({
    method: 'POST',
    path: '/stores/v2/coupons',
    body,
  });

  const wixCouponId = res.coupon?.id ?? res.id ?? '';
  if (!wixCouponId) {
    throw new Error(`Wix coupon create returned no id: ${JSON.stringify(res).slice(0, 200)}`);
  }

  return { code, wixCouponId, expiresAt: expires.toISOString() };
}

export async function revokeCoupon(wixCouponId: string): Promise<void> {
  if (!wixCouponId) return;
  try {
    await wixFetch({
      method: 'DELETE',
      path: `/stores/v2/coupons/${encodeURIComponent(wixCouponId)}`,
    });
  } catch (err) {
    // 404 means it was already gone (or auto-expired) — safe to swallow.
    if (err instanceof WixApiError && err.status === 404) return;
    throw err;
  }
}
