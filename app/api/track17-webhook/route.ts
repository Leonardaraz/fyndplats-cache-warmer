// app/api/track17-webhook/route.ts
//
// 17TRACK PUSH-webhook (TRACKING_UPDATED / TRACKING_STOPPED). Den PÅLITLIGA
// ryggraden för leveransnotiser: 17TRACK pushar status per REGISTRERAT
// spårnummer → vi slår upp kunden i tracking_mapping (exakt, ingen gissning)
// och mejlar en branded, maskerad notis. Ersätter den Velo-baserade
// _functions/track_webhook som blev orphan efter DNS-cutovern till Vercel.
//
// Vägar in (samma handler):
//   - /api/track17-webhook            (kanonisk)
//   - /_functions/track_webhook       (legacy — rewrite i next.config.ts, så
//                                      17TRACK-dashboardens befintliga URL
//                                      funkar utan ändring)
//
// Säkerhet: 17TRACK signerar varje push med `sign` = SHA256(<raw body>/<api
// key>). Vi verifierar mot TRACK17_API_KEY (lib/track17) → forged/felställda
// pushar avvisas med 403. Ingen annan auth behövs.
//
// Maskering: mejlet visar BARA generisk status + (allowlistad) transportör +
// ev. /sparning-länk. Inga events, ingen ursprungs-carrier, inget land → kan
// inte läcka dropship-ursprunget. Carrier maskas via lib/carrier-mask.
//
// Dedup: delar lib/delivery-dedup med SMS-flödet (app/api/sms-inbound) så att
// kunden aldrig får två "levererat"-mejl (ett per kanal) för samma paket.
//
// Ansvarsfördelning push vs SMS:
//   - PUSH  → Delivered + OutForDelivery (milstolpar UTAN hämtkod).
//   - SMS   → AvailableForPickup MED hämtkod (koden finns bara i carrier-SMS:et,
//             aldrig i 17TRACK) → SMS äger upphämtning, push rör den inte.
// Därför kan de två aldrig kollidera på samma (number, status)-nyckel.

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { sql } from "@/lib/db";
import { verify17TrackSign } from "@/lib/track17";
import { maskCarrierOrUndefined } from "@/lib/carrier-mask";
import { claimDeliveryNotification, releaseDeliveryNotification } from "@/lib/delivery-dedup";
import DeliveryNotificationEmail, {
  deliverySubject,
  type DeliveryStatus,
} from "@/emails/delivery-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

// 17TRACK status-enum → vår mejl-status. BARA milstolpar utan hämtkod pushas;
// upphämtning (AvailableForPickup) ägs av SMS-flödet som bär koden.
function pushSendableStatus(raw: string | undefined): DeliveryStatus | null {
  switch (raw) {
    case "Delivered":
      return "delivered";
    case "OutForDelivery":
      return "out_for_delivery";
    default:
      // InTransit, PickedUp, InfoReceived, AvailableForPickup, Exception,
      // Expired, NotFound … → ingen push-notis.
      return null;
  }
}

interface Track17PushRoot {
  number?: string;
  track_info?: {
    latest_status?: { status?: string; sub_status?: string };
    tracking?: { providers?: Array<{ provider?: { name?: string } }> };
  };
}

interface TrackingMappingRow {
  tracking_number: string;
  order_id: string | null;
  customer_email: string;
  customer_name: string | null;
  status: string;
}

async function findMapping(trackingNumber: string): Promise<TrackingMappingRow | null> {
  try {
    const r = await sql<TrackingMappingRow>/*sql*/`
      SELECT tracking_number, order_id, customer_email, customer_name, status
        FROM tracking_mapping
       WHERE tracking_number = ${trackingNumber}
       LIMIT 1
    `;
    return r.rows[0] ?? null;
  } catch (err) {
    console.error("[track17-webhook] tracking_mapping lookup failed", err);
    return null;
  }
}

async function updateMappingStatus(trackingNumber: string, status: string): Promise<void> {
  try {
    await sql/*sql*/`
      UPDATE tracking_mapping SET status = ${status}, updated_at = NOW()
       WHERE tracking_number = ${trackingNumber}
    `;
  } catch (err) {
    console.error("[track17-webhook] mapping status update failed", err);
  }
}

function firstName(fullName: string | null): string {
  if (!fullName) return "kund";
  return fullName.trim().split(/\s+/)[0] || "kund";
}

export async function POST(req: NextRequest) {
  // Råtexten MÅSTE läsas oförändrad för signaturen.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const sign = req.headers.get("sign") ?? req.headers.get("Sign");
  if (!verify17TrackSign(rawBody, sign)) {
    console.warn("[track17-webhook] ogiltig eller saknad signatur");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: { event?: string; data?: Track17PushRoot } & Track17PushRoot;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  // Stopp-event bär bara minimaldata — inget att mejla.
  if (payload?.event === "TRACKING_STOPPED") {
    return NextResponse.json({ ok: true, stopped: true }, { status: 200 });
  }

  const root: Track17PushRoot = payload?.data ?? payload;
  const trackingNumber = root?.number;
  if (!trackingNumber) {
    return NextResponse.json({ error: "number saknas" }, { status: 400 });
  }

  const rawStatus = root.track_info?.latest_status?.status;
  const deliveryStatus = pushSendableStatus(rawStatus);

  // Slå upp kunden (exakt — spårnumret 17TRACK pushar ÄR det registrerade).
  const mapping = await findMapping(trackingNumber);

  // Spegla status i mappningen oavsett om vi mejlar (driver bl.a. /sparning).
  if (deliveryStatus && mapping) await updateMappingStatus(trackingNumber, deliveryStatus);

  if (!deliveryStatus) {
    return NextResponse.json({ ok: true, tracked: trackingNumber, status: rawStatus, sent: false, reason: "non_push_status" }, { status: 200 });
  }
  if (!mapping) {
    // Okänt nummer (ännu ingen fulfillment-mappning) — kvittera, gör inget.
    return NextResponse.json({ ok: true, tracked: trackingNumber, sent: false, reason: "no_mapping" }, { status: 200 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[track17-webhook] RESEND_API_KEY saknas — kan inte mejla");
    return NextResponse.json({ ok: true, tracked: trackingNumber, sent: false, reason: "resend_not_configured" }, { status: 200 });
  }

  // Dedup mot SMS-flödet: först till (number, status) vinner.
  const won = await claimDeliveryNotification(trackingNumber, deliveryStatus, "track17", mapping.customer_email);
  if (!won) {
    return NextResponse.json({ ok: true, tracked: trackingNumber, sent: false, reason: "duplicate_suppressed" }, { status: 200 });
  }

  const carrier = maskCarrierOrUndefined(root.track_info?.tracking?.providers?.[0]?.provider?.name);
  const props = {
    firstName: firstName(mapping.customer_name),
    status: deliveryStatus,
    // Spåra-knapp bara för "på väg" (meningslös efter levererat).
    trackingNumber: deliveryStatus === "delivered" ? undefined : trackingNumber,
    carrier,
  };

  try {
    const html = await render(DeliveryNotificationEmail(props));
    const subject = deliverySubject({ status: deliveryStatus });
    const sent = await new Resend(resendKey).emails.send({
      from: FROM,
      to: mapping.customer_email,
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (sent.error) {
      // Släpp anspråket så en retry (eller SMS) kan ta över.
      await releaseDeliveryNotification(trackingNumber, deliveryStatus);
      console.error("[track17-webhook] Resend-fel", sent.error);
      return NextResponse.json({ ok: true, tracked: trackingNumber, sent: false, reason: "resend_failed" }, { status: 200 });
    }
    console.log(`[track17-webhook] notis skickad: ${trackingNumber} → ${mapping.customer_email} (${deliveryStatus}, resendId=${sent.data?.id})`);
    return NextResponse.json({ ok: true, tracked: trackingNumber, sent: true, status: deliveryStatus, resendId: sent.data?.id }, { status: 200 });
  } catch (err) {
    await releaseDeliveryNotification(trackingNumber, deliveryStatus);
    console.error("[track17-webhook] oväntat fel under email-send", err);
    return NextResponse.json({ ok: true, tracked: trackingNumber, sent: false, reason: "internal_error" }, { status: 200 });
  }
}

// Health-check (läcker inget): bekräftar bara att routen är deployad och om
// 17TRACK-nyckeln finns (krävs för signaturverifiering).
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "track17-webhook",
    method: "POST",
    auth: "17TRACK 'sign' header (SHA256 body/apiKey)",
    configured: Boolean(process.env.TRACK17_API_KEY),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
  });
}
