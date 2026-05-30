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
import { Resend } from "resend";
import { render } from "@react-email/render";
import { sql } from "@/lib/db";
import { parseSms, type ParsedSms } from "@/lib/sms-parser";
import DeliveryNotificationEmail, {
  deliverySubject,
  type DeliveryStatus,
} from "@/emails/delivery-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

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

async function logAudit(parsed: ParsedSms, matched: boolean, opts: { emailSent?: boolean; resendId?: string; error?: string } = {}): Promise<number | null> {
  try {
    const r = await sql/*sql*/`
      INSERT INTO sms_audit (
        raw_from, raw_text, carrier, status, pickup_location, pickup_code,
        tracking_number, matched, email_sent, resend_id, error
      ) VALUES (
        ${parsed.raw_from}, ${parsed.raw_text}, ${parsed.carrier}, ${parsed.status},
        ${parsed.pickup_location ?? null}, ${parsed.pickup_code ?? null},
        ${parsed.tracking_number ?? null}, ${matched}, ${opts.emailSent ?? false},
        ${opts.resendId ?? null}, ${opts.error ?? null}
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
       LIMIT 1
    `;
    return r.rows[0] ?? null;
  } catch (err) {
    console.error("[sms-inbound] tracking_mapping lookup failed", err);
    return null;
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
  const got = req.headers.get("x-sms-secret");
  if (got !== secret) {
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

  // No tracking number → we can't find an order. Log to unmatched and ack 200.
  if (!parsed.tracking_number) {
    const auditId = await logAudit(parsed, false);
    await logUnmatched(parsed, auditId, "no_tracking");
    return NextResponse.json({ received: true, matched: false, reason: "no_tracking", parsed }, { status: 200 });
  }

  const mapping = await findMapping(parsed.tracking_number);
  if (!mapping) {
    const auditId = await logAudit(parsed, false);
    await logUnmatched(parsed, auditId, "no_mapping");
    return NextResponse.json({ received: true, matched: false, reason: "no_mapping", parsed }, { status: 200 });
  }

  const deliveryStatus = asDeliveryStatus(parsed.status);
  if (!deliveryStatus || !SENDABLE_STATUSES.has(deliveryStatus)) {
    // We have a mapping but no actionable status — still update the row so
    // we know the parcel is moving, but don't email.
    if (deliveryStatus) await updateMappingStatus(parsed.tracking_number, deliveryStatus);
    await logAudit(parsed, true, { emailSent: false });
    return NextResponse.json({ received: true, matched: true, sent: false, reason: "non_sendable_status", parsed }, { status: 200 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[sms-inbound] RESEND_API_KEY saknas — kan inte skicka mejl");
    await logAudit(parsed, true, { emailSent: false, error: "resend_key_missing" });
    return NextResponse.json({ received: true, matched: true, sent: false, error: "resend_not_configured" }, { status: 200 });
  }

  const resend = new Resend(resendKey);

  const props = {
    firstName: firstName(mapping.customer_name),
    status: deliveryStatus,
    pickupLocation: parsed.pickup_location,
    pickupCode: parsed.pickup_code,
    trackingNumber: parsed.tracking_number,
    carrier: parsed.carrier === "Unknown" ? undefined : parsed.carrier,
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
      console.error("[sms-inbound] Resend-fel", sent.error);
      await logAudit(parsed, true, { emailSent: false, error: JSON.stringify(sent.error).slice(0, 500) });
      // 200 — don't let iOS Shortcut retry. We already logged the failure.
      return NextResponse.json({ received: true, matched: true, sent: false, error: "resend_failed" }, { status: 200 });
    }
    await updateMappingStatus(parsed.tracking_number, deliveryStatus);
    await logAudit(parsed, true, { emailSent: true, resendId: sent.data?.id });
    return NextResponse.json({
      received: true,
      matched: true,
      sent: true,
      resendId: sent.data?.id,
      to: mapping.customer_email,
      status: deliveryStatus,
    }, { status: 200 });
  } catch (err) {
    console.error("[sms-inbound] oväntat fel under email-send", err);
    await logAudit(parsed, true, { emailSent: false, error: (err as Error).message?.slice(0, 500) });
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
