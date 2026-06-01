// app/api/cron/abandoned-checkout-poller/route.ts
// Vercel Cron entry: GET /api/cron/abandoned-checkout-poller
// Schedule: every 15 minutes (see vercel.json).
//
// Why this exists: the abandoned-cart flow was designed to be fed by a Wix
// `abandoned_checkout` / `created` webhook, but that webhook was never delivered in
// production, so nothing was ever enqueued. This cron polls the Wix Abandoned
// Checkouts API directly (using WIX_API_KEY) and enqueues fresh ABANDONED checkouts
// into the same pipeline. The sender cron (abandoned-cart-sender) then sends the
// 1h / 24h / 72h emails. Enqueue is idempotent, so the webhook path (if ever wired)
// and this poller can safely coexist.

import { NextResponse } from 'next/server';
import { pollAbandonedCheckouts } from '@/lib/abandoned-checkout-poll';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev fallback
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  const url = new URL(request.url);
  const hoursParam = url.searchParams.get('hours');
  const lookbackHours = hoursParam ? Math.max(1, Math.min(720, Number(hoursParam))) : undefined;

  try {
    const result = await pollAbandonedCheckouts({ lookbackHours });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[abandoned-checkout-poller] failed', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
