// app/api/cron/trustpilot-invite/route.ts
// Vercel Cron entry: GET /api/cron/trustpilot-invite
// Schedule: "0 8,9 * * *" (se vercel.json). Vercel Cron körs i fast UTC utan
// tidszonsstöd, så vi fyrar på BÅDA timmarna och grindar i koden mot svensk
// lokaltid (lib/cron-time) så inbjudan alltid går 09:00 svensk — sommar som
// vinter. Den firning som inte träffar mål-timmen kortsluts med 200 (skipped).
//
// Vad den gör: hämtar ordrar som fulfillades för 7 dagar sedan (≈ levererade och
// kunden har hunnit använda produkten) och ber om ett Trustpilot-omdöme. Två
// vägar, idempotent per order via `trustpilot_invites`:
//   • TRUSTPILOT_API_KEY satt → Trustpilot AFS-inbjudan (Trustpilot mejlar).
//   • Annars → branded Resend-mejl med en evaluate-länk (gratis-vägen).
//
// No-op-säker: utan TRUSTPILOT_BUSINESS_UNIT_ID, utan Wix-nyckel eller utan
// matchande ordrar svarar routen 200 med en förklarande summary.
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Saknas
// CRON_SECRET släpper vi igenom (samma mönster som övriga cron-routes).

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { sql, runMigration } from "@/lib/db";
import { cronClock, isSwedishHour } from "@/lib/cron-time";
import {
  isTrustpilotConfigured,
  hasAfsApi,
  fetchOrdersFulfilledOn,
  sendAfsInvitation,
  trustpilotReviewUrl,
  type DeliveredOrder,
} from "@/lib/trustpilot";
import TrustpilotReviewRequestEmail, {
  trustpilotReviewSubject,
} from "@/emails/trustpilot-review-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Inbjudan ska landa 09:00 svensk tid. `?force=1` förbigår grinden (test/verifiering).
const TARGET_SWEDISH_HOUR = 9;
const FROM = process.env.RESEND_FROM || "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";
// Hur många dagar efter fulfillment vi ber om omdöme.
const DELIVERY_OFFSET_DAYS = 7;

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

async function alreadyInvited(orderId: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`SELECT 1 FROM trustpilot_invites WHERE order_id = ${orderId} LIMIT 1`;
  return rows.length > 0;
}

async function recordInvite(orderId: string, email: string, channel: string, resendId?: string): Promise<void> {
  await sql/*sql*/`
    INSERT INTO trustpilot_invites (order_id, email, channel, resend_id)
    VALUES (${orderId}, ${email}, ${channel}, ${resendId ?? null})
    ON CONFLICT (order_id) DO NOTHING
  `;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  // DST-grind: hoppa över firningen som inte motsvarar 09:00 svensk tid.
  const clock = cronClock();
  if (!force && !isSwedishHour(TARGET_SWEDISH_HOUR)) {
    return NextResponse.json({ ok: true, skipped: "off_target_hour", ...clock });
  }

  // Inget konto uppsatt än → ren no-op (Leonard fyller i env, se docs).
  if (!isTrustpilotConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not_configured", ...clock });
  }

  // dagar efter fulfillment kan överstyras för test (?days=0 → idag).
  const daysParam = url.searchParams.get("days");
  const offset = daysParam != null ? Math.max(0, Math.min(60, Number(daysParam))) : DELIVERY_OFFSET_DAYS;
  const targetDay = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);

  // Säkerställ idempotens-tabellen (idempotent migration).
  try {
    await runMigration();
  } catch (e) {
    console.error("[trustpilot-invite] migration failed", (e as Error).message);
  }

  const found = await fetchOrdersFulfilledOn(targetDay, { lookbackDays: offset + 14 });
  if (!found.ok) {
    console.warn("[trustpilot-invite] kunde inte hämta ordrar", found.note);
    return NextResponse.json({ ok: true, skipped: "order_fetch_failed", note: found.note, ...clock });
  }

  const useAfs = hasAfsApi();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const results: Array<{ orderId: string; status: string; channel?: string; note?: string }> = [];

  for (const order of found.orders) {
    try {
      if (await alreadyInvited(order.orderId)) {
        skipped += 1;
        continue;
      }

      const outcome = await inviteOne(order, { useAfs, resend });
      if (outcome.ok) {
        await recordInvite(order.orderId, order.email, outcome.channel!, outcome.resendId);
        sent += 1;
        results.push({ orderId: order.orderId, status: "sent", channel: outcome.channel });
      } else {
        failed += 1;
        results.push({ orderId: order.orderId, status: "failed", note: outcome.note });
      }
    } catch (e) {
      failed += 1;
      results.push({ orderId: order.orderId, status: "error", note: (e as Error).message });
    }
  }

  const summary = { ok: true, scanned: found.scanned, candidates: found.orders.length, sent, skipped, failed, ...clock };
  console.log("[trustpilot-invite]", summary);
  return NextResponse.json({ ...summary, results });
}

async function inviteOne(
  order: DeliveredOrder,
  { useAfs, resend }: { useAfs: boolean; resend: Resend | null },
): Promise<{ ok: boolean; channel?: string; resendId?: string; note?: string }> {
  // Föredra AFS (Trustpilot mejlar själv) när API-token finns.
  if (useAfs) {
    const afs = await sendAfsInvitation(order);
    if (afs.ok) return { ok: true, channel: "afs" };
    console.warn("[trustpilot-invite] AFS misslyckades, faller tillbaka på mejl", afs.note);
  }

  // Gratis-vägen: branded Resend-mejl med evaluate-länk.
  if (!resend) return { ok: false, note: "RESEND_API_KEY saknas och AFS ej tillgängligt" };

  const reviewUrl = trustpilotReviewUrl(order.orderId, order.email);
  const props = {
    firstName: order.firstName,
    reviewUrl,
    orderNumber: order.orderNumber,
    productName: order.productName,
  };
  const html = await render(TrustpilotReviewRequestEmail(props));
  const subject = trustpilotReviewSubject(props);
  const res = await resend.emails.send({ from: FROM, to: order.email, replyTo: REPLY_TO, subject, html });
  if (res.error) return { ok: false, note: JSON.stringify(res.error).slice(0, 200) };
  return { ok: true, channel: "email", resendId: res.data?.id };
}
