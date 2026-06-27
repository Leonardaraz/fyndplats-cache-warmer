// app/api/sms-inbound/route.ts
//
// POST endpoint that Leonard's iOS Shortcut hits with every carrier SMS that
// arrives on his iPhone. We parse, look up the real customer in
// tracking_mapping, and send a branded Fyndplats delivery email via Resend.
//
// Auth: the request MUST carry `X-Sms-Secret` matching env `SMS_INBOUND_SECRET`.
// This is the only thing standing between us and a hostile poster — the
// shortcut is the only legitimate client, so we are strict.
//
// Failure model:
//   - Auth fails        → 401 (Shortcut will surface this to Leonard).
//   - Malformed body    → 400.
//   - Parser/match miss → 200 + audit row (never 500, otherwise iOS Shortcut
//                                          retries forever).
//   - Resend failure    → 200 + audit row with `error` set. Same reason: we
//                                          don't want endless retries flooding
//                                          customers if a future Resend outage
//                                          coincides with a parser regression.

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { sql } from "@/lib/db";
import { parseSms, type ParsedSms } from "@/lib/sms-parser";
import { claimDeliveryNotification, releaseDeliveryNotification } from "@/lib/delivery-dedup";
import { maskCarrierOrUndefined } from "@/lib/carrier-mask";
import DeliveryNotificationEmail, {
  deliverySubject,
  type DeliveryStatus,
} from "@/emails/delivery-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

// Ops alert email — where we route SMSes that can't be safely matched
// (no tracking number AND too many pending packages, or the FIFO fallback
// has been triggered too many times in a row). Defaults to support inbox so
// alerts surface even before OPS_ALERT_EMAIL is set in Vercel.
const OPS_ALERT_EMAIL = process.env.OPS_ALERT_EMAIL ?? "info@fyndplats.com";

// FIFO fallback thresholds.
//  - MAX_PENDING_FOR_FIFO: at most this many in_transit rows; above this the
//    odds of picking the wrong customer are too high — escalate instead.
//  - MAX_FIFO_PER_WINDOW / FIFO_WINDOW_HOURS: if FIFO has already been used
//    this many times in the rolling window, stop auto-matching and escalate.
//    Stops a parser regression (or a sudden volume spike) from quietly
//    sending the wrong customer notifications all day.
// FIFO auto-sänder bara när det finns EXAKT ETT paket in_transit (=1). Med två
// samtidiga paket gick ett "levererat"-SMS om det nyare paketet annars till den
// äldre kunden (fel-kund-notis). 17TRACK-pushen täcker Delivered/OutForDelivery
// säkert per order, så FIFO behöver bara fånga enskild-paket-fallet.
const MAX_PENDING_FOR_FIFO = 1;
const MAX_FIFO_PER_WINDOW = 3;
const FIFO_WINDOW_HOURS = 24;
// Paket äldre än så här räknas inte som FIFO-kandidat — döda/fastnade sändningar
// får aldrig ligga kvar och "vinna" gissningen (de plockas annars som äldsta).
const FIFO_MAX_AGE_DAYS = 30;

// Constant-time string compare for the inbound secret. Plain `===` leaks the
// length of the matching prefix via timing on a sufficiently determined
// attacker — `timingSafeEqual` is the canonical fix and the cost is trivial.
function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

interface InboundBody {
  from?: unknown;
  text?: unknown;
}

function safeParseBody(raw: string): { from: string; text: string } | null {
  try {
    const j = JSON.parse(raw) as InboundBody;
    if (typeof j.from !== "string" || typeof j.text !== "string") return null;
    if (!j.text.trim()) return null;
    return { from: j.from, text: j.text };
  } catch {
    return null;
  }
}

type MatchStrategy = "tracking_number" | "fifo";

async function logAudit(
  parsed: ParsedSms,
  matched: boolean,
  opts: {
    emailSent?: boolean;
    resendId?: string;
    error?: string;
    matchStrategy?: MatchStrategy;
    // Override tracking_number on the audit row — used when FIFO fills in a
    // tracking number from tracking_mapping that wasn't in the SMS text.
    trackingNumberOverride?: string;
  } = {},
): Promise<number | null> {
  try {
    const r = await sql/*sql*/`
      INSERT INTO sms_audit (
        raw_from, raw_text, carrier, status, pickup_location, pickup_code,
        tracking_number, matched, email_sent, resend_id, error, match_strategy
      ) VALUES (
        ${parsed.raw_from}, ${parsed.raw_text}, ${parsed.carrier}, ${parsed.status},
        ${parsed.pickup_location ?? null}, ${parsed.pickup_code ?? null},
        ${opts.trackingNumberOverride ?? parsed.tracking_number ?? null},
        ${matched}, ${opts.emailSent ?? false},
        ${opts.resendId ?? null}, ${opts.error ?? null},
        ${opts.matchStrategy ?? null}
      )
      RETURNING id
    `;
    return (r.rows[0]?.id as number) ?? null;
  } catch (err) {
    console.error("[sms-inbound] sms_audit insert failed", err);
    return null;
  }
}

async function logUnmatched(parsed: ParsedSms, auditId: number | null, reason: string): Promise<void> {
  try {
    await sql/*sql*/`
      INSERT INTO sms_unmatched (audit_id, raw_from, raw_text, tracking_number, reason)
      VALUES (${auditId}, ${parsed.raw_from}, ${parsed.raw_text}, ${parsed.tracking_number ?? null}, ${reason})
    `;
  } catch (err) {
    console.error("[sms-inbound] sms_unmatched insert failed", err);
  }
}

interface TrackingMappingRow {
  tracking_number: string;
  order_id: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
}

async function findMapping(trackingNumber: string): Promise<TrackingMappingRow | null> {
  try {
    const r = await sql<TrackingMappingRow>/*sql*/`
      SELECT tracking_number, order_id, customer_email, customer_name, customer_phone, status
        FROM tracking_mapping
       WHERE tracking_number = ${trackingNumber}
         AND status <> 'ambiguous'
       LIMIT 1
    `;
    return r.rows[0] ?? null;
  } catch (err) {
    console.error("[sms-inbound] tracking_mapping lookup failed", err);
    return null;
  }
}

// FIFO fallback. The exact SMS that motivated this whole flow ("Ditt paket
// från AliExpress C/o är nu levererat vid din dörr") contains NO tracking
// number — so if we don't guess, we never notify the customer. At low volume
// this is safe; we only do it when there are 1–2 packages still in_transit.
//
// Returns the candidate row (oldest in_transit), the total pending count,
// or null on DB failure. The caller decides whether to act on it based on
// count + recent-fallback-throttle.
async function findFifoCandidate(): Promise<{ candidate: TrackingMappingRow | null; pendingCount: number }> {
  try {
    const r = await sql<TrackingMappingRow>/*sql*/`
      SELECT tracking_number, order_id, customer_email, customer_name, customer_phone, status
        FROM tracking_mapping
       WHERE status = 'in_transit'
         AND created_at >= NOW() - (${FIFO_MAX_AGE_DAYS} || ' days')::interval
       ORDER BY created_at ASC
       LIMIT 5
    `;
    return { candidate: r.rows[0] ?? null, pendingCount: r.rows.length };
  } catch (err) {
    console.error("[sms-inbound] FIFO candidate lookup failed", err);
    return { candidate: null, pendingCount: 0 };
  }
}

async function recentFifoCount(hours: number): Promise<number> {
  try {
    const r = await sql<{ n: number }>/*sql*/`
      SELECT COUNT(*)::int AS n
        FROM sms_audit
       WHERE match_strategy = 'fifo'
         AND received_at >= NOW() - (${hours} || ' hours')::interval
    `;
    return r.rows[0]?.n ?? 0;
  } catch (err) {
    console.error("[sms-inbound] recentFifoCount failed", err);
    // On DB failure: be conservative — assume the safety budget is spent so we
    // escalate to manual rather than risk a wrong-customer email.
    return Number.POSITIVE_INFINITY;
  }
}

// Email Leonard so he can resolve a stuck SMS by hand. Plain text — these
// alerts are infrequent and a designed template would just delay delivery
// of the bad news. Best-effort: a Resend failure is logged, not propagated.
async function sendOpsAlertEmail(
  resend: Resend,
  reason: string,
  parsed: ParsedSms,
  details: { pendingCount?: number; recentFifo?: number } = {},
): Promise<void> {
  try {
    const lines = [
      `Reason: ${reason}`,
      `From: ${parsed.raw_from}`,
      `Carrier: ${parsed.carrier}`,
      `Detected status: ${parsed.status}`,
      `Pickup location: ${parsed.pickup_location ?? "(none)"}`,
      `Pickup code: ${parsed.pickup_code ?? "(none)"}`,
      `Tracking number in SMS: ${parsed.tracking_number ?? "(none)"}`,
      details.pendingCount !== undefined ? `Packages in transit right now: ${details.pendingCount}` : null,
      details.recentFifo !== undefined ? `FIFO fallbacks in last ${FIFO_WINDOW_HOURS}h: ${details.recentFifo}` : null,
      "",
      "Raw SMS text:",
      parsed.raw_text,
      "",
      "Open Wix admin to find the right order and reply to the customer manually.",
    ].filter(Boolean) as string[];

    await resend.emails.send({
      from: FROM,
      to: OPS_ALERT_EMAIL,
      replyTo: REPLY_TO,
      subject: `[SMS-forwarding] Behöver manuell hantering: ${reason}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("[sms-inbound] ops alert email failed", err);
  }
}

async function updateMappingStatus(trackingNumber: string, status: string): Promise<void> {
  try {
    await sql/*sql*/`
      UPDATE tracking_mapping
         SET status = ${status}, updated_at = NOW()
       WHERE tracking_number = ${trackingNumber}
    `;
  } catch (err) {
    console.error("[sms-inbound] tracking_mapping status update failed", err);
  }
}

// Dedup hanteras nu av lib/delivery-dedup (delad atomisk vakt med 17TRACK-
// push-flödet) i stället för en lokal sms_audit-räkning — så att kunden aldrig
// får dubbla notiser oavsett om samma paket+status kommer via SMS eller push.

// Sendable statuses: we don't email on "unknown" or "in_transit" by default —
// in_transit is too noisy (multiple per shipment), unknown means the parser
// gave up and any email would be misleading. Customers care about pickup,
// out-for-delivery and delivered events; that's what we send.
const SENDABLE_STATUSES = new Set<DeliveryStatus>([
  "out_for_delivery",
  "available_for_pickup",
  "delivered",
  "exception",
]);

function asDeliveryStatus(s: string): DeliveryStatus | null {
  if (s === "out_for_delivery" || s === "available_for_pickup" || s === "delivered" || s === "in_transit" || s === "exception") {
    return s;
  }
  return null;
}

function firstName(fullName: string | null): string {
  if (!fullName) return "kund";
  const first = fullName.trim().split(/\s+/)[0];
  return first || "kund";
}

export async function POST(req: NextRequest) {
  const secret = process.env.SMS_INBOUND_SECRET;
  if (!secret) {
    console.error("[sms-inbound] SMS_INBOUND_SECRET saknas i miljön");
    return NextResponse.json({ error: "Endpoint not configured" }, { status: 500 });
  }
  const got = req.headers.get("x-sms-secret") ?? "";
  if (!safeCompare(got, secret)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[sms-inbound] kunde inte läsa body", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const body = safeParseBody(rawBody);
  if (!body) {
    return NextResponse.json({ error: "Body must be JSON { from: string, text: string }" }, { status: 400 });
  }

  const parsed = parseSms(body);
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;

  // Resolve the customer either via the tracking number in the SMS (preferred)
  // or — when the SMS has none, e.g. "Ditt paket från AliExpress C/o är nu
  // levererat vid din dörr" — via the FIFO fallback.
  let mapping: TrackingMappingRow | null = null;
  let matchStrategy: MatchStrategy = "tracking_number";
  // Effective tracking number we'll persist in the audit/mapping update —
  // when FIFO supplies it, parsed.tracking_number is empty.
  let effectiveTracking: string | undefined = parsed.tracking_number;

  if (parsed.tracking_number) {
    mapping = await findMapping(parsed.tracking_number);
    if (!mapping) {
      const auditId = await logAudit(parsed, false);
      await logUnmatched(parsed, auditId, "no_mapping");
      return NextResponse.json({ received: true, matched: false, reason: "no_mapping", parsed }, { status: 200 });
    }
  } else {
    // FIFO fallback path.
    const { candidate, pendingCount } = await findFifoCandidate();

    if (!candidate || pendingCount === 0) {
      const auditId = await logAudit(parsed, false);
      await logUnmatched(parsed, auditId, "no_tracking");
      return NextResponse.json({ received: true, matched: false, reason: "no_tracking_no_pending", parsed }, { status: 200 });
    }

    // Säkerhet: gissa ALDRIG mottagare när SMS:et bär en hämtkod. Koden är en
    // referens — skickar vi den till fel (gissad) kund kan denne hämta ut
    // någon annans paket. Kräv exakt spårmatchning för koder; eskalera annars.
    if (parsed.pickup_code) {
      const auditId = await logAudit(parsed, false);
      await logUnmatched(parsed, auditId, "fifo_blocked_pickup_code");
      if (resend) await sendOpsAlertEmail(resend, "no_tracking_but_pickup_code_present", parsed, { pendingCount });
      return NextResponse.json({ received: true, matched: false, reason: "fifo_blocked_pickup_code", parsed }, { status: 200 });
    }

    // Säkerhet: FIFO-gissning får BARA auto-sända transienta statusar
    // (levererat / ute för leverans) där en felgissning är låg-regret. För
    // upphämtning (kunden skickas till fel ombud) och avvikelse (onödig oro hos
    // fel kund) krävs exakt spårmatchning — annars eskalera till ops. 17TRACK-
    // pushen (app/api/track17-webhook) äger Delivered/OutForDelivery säkert per
    // order; pickup-koden kommer via exakt match eller manuell ops-utskick.
    if (parsed.status === "available_for_pickup" || parsed.status === "exception") {
      const auditId = await logAudit(parsed, false);
      await logUnmatched(parsed, auditId, `fifo_blocked_${parsed.status}`);
      if (resend) await sendOpsAlertEmail(resend, `no_tracking_${parsed.status}_event`, parsed, { pendingCount });
      return NextResponse.json({ received: true, matched: false, reason: `fifo_blocked_${parsed.status}`, parsed }, { status: 200 });
    }

    if (pendingCount > MAX_PENDING_FOR_FIFO) {
      // Too many in-flight packages to guess safely — escalate.
      const auditId = await logAudit(parsed, false);
      await logUnmatched(parsed, auditId, `fifo_too_many_pending:${pendingCount}`);
      if (resend) await sendOpsAlertEmail(resend, "no_tracking_in_sms_and_too_many_pending", parsed, { pendingCount });
      return NextResponse.json({ received: true, matched: false, reason: "fifo_too_many_pending", pendingCount, parsed }, { status: 200 });
    }

    const fifoUsedRecently = await recentFifoCount(FIFO_WINDOW_HOURS);
    if (fifoUsedRecently >= MAX_FIFO_PER_WINDOW) {
      // Throttle — repeatedly falling back suggests carriers stopped putting
      // tracking numbers in SMS (parser regression) or volume grew past the
      // point where FIFO is safe. Stop guessing until a human investigates.
      const auditId = await logAudit(parsed, false);
      await logUnmatched(parsed, auditId, `fifo_throttled:${fifoUsedRecently}_in_${FIFO_WINDOW_HOURS}h`);
      if (resend) await sendOpsAlertEmail(resend, "fifo_fallback_used_too_often", parsed, { pendingCount, recentFifo: fifoUsedRecently });
      return NextResponse.json({ received: true, matched: false, reason: "fifo_throttled", recentFifo: fifoUsedRecently, parsed }, { status: 200 });
    }

    mapping = candidate;
    matchStrategy = "fifo";
    effectiveTracking = candidate.tracking_number;
    console.warn(
      `[sms-inbound] FIFO fallback used: matched to ${candidate.tracking_number} (${pendingCount} in_transit, ${fifoUsedRecently} prior FIFO matches in last ${FIFO_WINDOW_HOURS}h)`,
    );
  }

  const deliveryStatus = asDeliveryStatus(parsed.status);
  if (!deliveryStatus || !SENDABLE_STATUSES.has(deliveryStatus)) {
    // We have a mapping but no actionable status — still update the row so
    // we know the parcel is moving, but don't email.
    if (deliveryStatus && effectiveTracking) await updateMappingStatus(effectiveTracking, deliveryStatus);
    await logAudit(parsed, true, { emailSent: false, matchStrategy, trackingNumberOverride: effectiveTracking });
    return NextResponse.json({ received: true, matched: true, sent: false, reason: "non_sendable_status", matchStrategy, parsed }, { status: 200 });
  }

  if (!resend) {
    console.error("[sms-inbound] RESEND_API_KEY saknas — kan inte skicka mejl");
    await logAudit(parsed, true, { emailSent: false, error: "resend_key_missing", matchStrategy, trackingNumberOverride: effectiveTracking });
    return NextResponse.json({ received: true, matched: true, sent: false, error: "resend_not_configured" }, { status: 200 });
  }

  // Dedup (delad med 17TRACK-push): atomiskt anspråk på (spårnummer, status).
  // Vinner vi → skicka; förlorar vi → redan mejlat (via SMS eller push) → hoppa.
  const claimed = effectiveTracking
    ? await claimDeliveryNotification(effectiveTracking, parsed.status, "sms", mapping.customer_email)
    : true;
  if (!claimed) {
    await logAudit(parsed, true, {
      emailSent: false,
      error: "duplicate_suppressed",
      matchStrategy,
      trackingNumberOverride: effectiveTracking,
    });
    return NextResponse.json(
      { received: true, matched: true, sent: false, reason: "duplicate_suppressed", matchStrategy },
      { status: 200 },
    );
  }

  const props = {
    firstName: firstName(mapping.customer_name),
    status: deliveryStatus,
    pickupLocation: parsed.pickup_location,
    pickupCode: parsed.pickup_code,
    trackingNumber: effectiveTracking,
    // KRITISKT: maska carrier-namnet. Parsern kan klassa ett AliExpress/Cainiao-
    // SMS som carrier "Cainiao" — rått hade det blivit "Transportör: Cainiao" i
    // kundmejlet och röjt dropship-ursprunget. maskCarrierOrUndefined släpper
    // bara igenom allowlistade EU-bud; Cainiao/AliExpress → undefined (dold rad).
    // Samma fail-safe-maskering som 17TRACK-push-webhooken använder.
    carrier: maskCarrierOrUndefined(parsed.carrier),
  };

  try {
    const html = await render(DeliveryNotificationEmail(props));
    const subject = deliverySubject(props);
    const sent = await resend.emails.send({
      from: FROM,
      to: mapping.customer_email,
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (sent.error) {
      // Släpp dedup-anspråket så en retry (eller push) kan ta över.
      if (effectiveTracking) await releaseDeliveryNotification(effectiveTracking, parsed.status);
      console.error("[sms-inbound] Resend-fel", sent.error);
      await logAudit(parsed, true, {
        emailSent: false,
        error: JSON.stringify(sent.error).slice(0, 500),
        matchStrategy,
        trackingNumberOverride: effectiveTracking,
      });
      // 200 — don't let iOS Shortcut retry. We already logged the failure.
      return NextResponse.json({ received: true, matched: true, sent: false, error: "resend_failed" }, { status: 200 });
    }
    if (effectiveTracking) await updateMappingStatus(effectiveTracking, deliveryStatus);
    await logAudit(parsed, true, {
      emailSent: true,
      resendId: sent.data?.id,
      matchStrategy,
      trackingNumberOverride: effectiveTracking,
    });
    return NextResponse.json({
      received: true,
      matched: true,
      sent: true,
      resendId: sent.data?.id,
      to: mapping.customer_email,
      status: deliveryStatus,
      matchStrategy,
    }, { status: 200 });
  } catch (err) {
    // Släpp dedup-anspråket så en retry (eller push) kan ta över.
    if (effectiveTracking) await releaseDeliveryNotification(effectiveTracking, parsed.status);
    console.error("[sms-inbound] oväntat fel under email-send", err);
    await logAudit(parsed, true, {
      emailSent: false,
      error: (err as Error).message?.slice(0, 500),
      matchStrategy,
      trackingNumberOverride: effectiveTracking,
    });
    // Same reasoning: 200 keeps Shortcut quiet.
    return NextResponse.json({ received: true, matched: true, sent: false, error: "internal_error" }, { status: 200 });
  }
}

// Simple health check — useful for confirming the route is deployed and the
// secret is set, without leaking anything sensitive.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "sms-inbound",
    method: "POST",
    auth: "X-Sms-Secret header",
    configured: Boolean(process.env.SMS_INBOUND_SECRET),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
  });
}
