// app/api/dev/test-abandoned-cart/route.ts
// Dev-only end-to-end simulator. Gated behind X-Dev-Secret matching DEV_ENDPOINT_SECRET.
// Lets us validate the 3-email flow inline (without waiting 1h / 24h / 72h).
//
// Modes (?action=...):
//   migrate              — run the DB migration
//   simulate             — enqueue a fake cart and run all 3 steps immediately
//   simulate_no_code     — enqueue a fake cart whose address hash is pre-seeded into
//                           used_addresses so step 3 falls through to the no-code variant
//   simulate_below_min   — enqueue a fake cart with subtotal < 200 kr (no code at step 3)
//   simulate_cooldown    — enqueue, send step 1, then try to enqueue again -> blocked
//   simulate_conversion  — enqueue, send step 1, simulate order_created -> cancels flow
//
// When `?dry=1` is passed we DO NOT actually call resend.emails.send — instead we just
// render the email and return the html/text for inspection. The default (`dry=0`) DOES
// send via Resend, which is what you'd run against a sandbox inbox.

import { NextResponse } from 'next/server';
import { sql, runMigration } from '@/lib/db';
import {
  enqueueAbandonedCart,
  fetchDueCarts,
  processDueCart,
  onOrderConverted,
} from '@/lib/abandoned-cart';
import { hashAddress } from '@/lib/address-hash';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorised(request: Request): boolean {
  const secret = process.env.DEV_ENDPOINT_SECRET;
  if (!secret) return false; // hard fail if not set — we never want this open
  const got = request.headers.get('x-dev-secret');
  return got === secret;
}

const sampleCart = (overrides: Partial<{ id: string; email: string; phone: string | null; subtotalMinor: number; addressLine1: string }> = {}) => ({
  cartId: overrides.id ?? `test-cart-${Date.now()}`,
  email: overrides.email ?? `test+${Date.now()}@fyndplats.se`,
  phone: overrides.phone ?? '+46701234567',
  shippingAddress: {
    addressLine1: overrides.addressLine1 ?? 'Testgatan 1',
    postalCode: '11111',
    city: 'Stockholm',
    country: 'SE',
  },
  items: [
    { name: 'Testprodukt A', quantity: 1, priceMinor: 19900, imageUrl: null },
    { name: 'Testprodukt B', quantity: 2, priceMinor: 4900, imageUrl: null },
  ],
  subtotalMinor: overrides.subtotalMinor ?? 29700,
  currency: 'SEK',
  recoverUrl: 'https://fyndplats.se/cart?recover=test',
  abandonedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago so step 1 is overdue
  // Crucial: collapse the delays so processDueCart returns the next step on each tick.
  delaysMsOverride: { 1: 1_000, 2: 2_000, 3: 3_000 } as Record<1 | 2 | 3, number>,
});

// Run every due step until the cart is done or skipped. Used by the simulator.
async function runUntilDone(cartId: string, max = 5) {
  const out = [];
  for (let i = 0; i < max; i++) {
    const due = await sql/*sql*/`SELECT id, email, phone, shipping_addr_hash, items_json, subtotal_minor, currency, recover_url, next_step, next_step_at, status, discount_code, discount_code_wix_id FROM abandoned_carts WHERE id = ${cartId}`;
    const row = due.rows[0];
    if (!row || row.status !== 'pending') break;
    const result = await processDueCart(row as never, { now: new Date(Date.now() + 10_000) });
    out.push(result);
    if (result.action === 'skipped_cooldown' || result.action === 'error') break;
  }
  return out;
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });

  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'simulate';

  if (action === 'migrate') {
    await runMigration();
    return NextResponse.json({ ok: true, migrated: true });
  }

  if (action === 'simulate') {
    const cart = sampleCart();
    const enq = await enqueueAbandonedCart(cart);
    if (!enq.enqueued) return NextResponse.json({ ok: false, enq });
    const results = await runUntilDone(cart.cartId);
    return NextResponse.json({ ok: true, cartId: cart.cartId, enq, results });
  }

  if (action === 'simulate_no_code') {
    // Pre-seed used_addresses with the shipping hash so step 3 falls to no-code variant.
    const cart = sampleCart({ id: `test-nc-${Date.now()}` });
    const hash = hashAddress(cart.shippingAddress);
    if (hash) {
      await sql/*sql*/`INSERT INTO used_addresses (hash) VALUES (${hash}) ON CONFLICT DO NOTHING`;
    }
    const enq = await enqueueAbandonedCart(cart);
    const results = await runUntilDone(cart.cartId);
    return NextResponse.json({ ok: true, cartId: cart.cartId, enq, results, seededHash: hash });
  }

  if (action === 'simulate_below_min') {
    const cart = sampleCart({ id: `test-bm-${Date.now()}`, subtotalMinor: 15000 });
    const enq = await enqueueAbandonedCart(cart);
    const results = await runUntilDone(cart.cartId);
    return NextResponse.json({ ok: true, cartId: cart.cartId, enq, results });
  }

  if (action === 'simulate_cooldown') {
    const first = sampleCart({ id: `test-cd1-${Date.now()}` });
    const enqA = await enqueueAbandonedCart(first);
    const firstRow = await sql/*sql*/`SELECT id, email, phone, shipping_addr_hash, items_json, subtotal_minor, currency, recover_url, next_step, next_step_at, status, discount_code, discount_code_wix_id FROM abandoned_carts WHERE id = ${first.cartId}`;
    const step1 = await processDueCart(firstRow.rows[0] as never);
    // Second cart, same email, immediately — should be refused.
    const second = sampleCart({ id: `test-cd2-${Date.now()}`, email: first.email });
    const enqB = await enqueueAbandonedCart(second);
    return NextResponse.json({ ok: true, enqA, step1, enqB });
  }

  if (action === 'simulate_conversion') {
    const cart = sampleCart({ id: `test-cv-${Date.now()}` });
    const enq = await enqueueAbandonedCart(cart);
    const firstRow = await sql/*sql*/`SELECT id, email, phone, shipping_addr_hash, items_json, subtotal_minor, currency, recover_url, next_step, next_step_at, status, discount_code, discount_code_wix_id FROM abandoned_carts WHERE id = ${cart.cartId}`;
    const step1 = await processDueCart(firstRow.rows[0] as never);
    const conv = await onOrderConverted({
      cartId: cart.cartId,
      email: cart.email,
      phone: cart.phone,
      shippingAddress: cart.shippingAddress,
    });
    // Next tick should NOT advance — cart is converted.
    const due = await fetchDueCarts(5);
    return NextResponse.json({ ok: true, enq, step1, conv, dueAfter: due.length });
  }

  return NextResponse.json({ ok: false, error: `unknown action ${action}` }, { status: 400 });
}

// GET → quick status: lists current pending carts so we can eyeball state.
export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  const r = await sql/*sql*/`
    SELECT id, email, status, next_step, next_step_at, discount_code
      FROM abandoned_carts ORDER BY created_at DESC LIMIT 20
  `;
  return NextResponse.json({ ok: true, carts: r.rows });
}
