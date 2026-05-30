// app/api/cron/abandoned-cart-sender/route.ts
// Vercel Cron entry: GET /api/cron/abandoned-cart-sender
// Schedule: every 15 minutes (see vercel.json).
//
// Each invocation:
//   1. Verifies the Vercel cron secret header (defence in depth, Vercel signs but also
//      sets `x-vercel-cron`).
//   2. Loads up to 25 carts where status='pending' and next_step_at <= NOW().
//   3. Processes each one (sends the due email and advances state).
//
// Idempotency: every (cart_id, step) tuple is unique in sent_emails. If Resend or the
// DB updates fail mid-flight, the cart row stays at the same next_step and we retry
// next tick — duplicate sent_emails inserts are silently swallowed.

import { NextResponse } from 'next/server';
import { fetchDueCarts, processDueCart } from '@/lib/abandoned-cart';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // we use node:crypto + @vercel/postgres

const CRON_BATCH = 25;

function isAuthorised(request: Request): boolean {
  // Vercel sets `Authorization: Bearer <CRON_SECRET>` on cron requests when CRON_SECRET is set.
  // See https://vercel.com/docs/cron-jobs#securing-cron-jobs
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // allow if not configured (dev), but log
  const got = request.headers.get('authorization');
  return got === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  const due = await fetchDueCarts(CRON_BATCH);
  const results = [];
  for (const cart of due) {
    const result = await processDueCart(cart);
    results.push(result);
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
