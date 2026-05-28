// Wix Velo backend HTTP-funktioner
//
// 1) /_functions/track_webhook — tar emot push-uppdateringar från 17TRACK varje
//    gång ett paket byter status (in transit / out for delivery / delivered).
//    Lagrar events i Wix Data-collection TrackingEvents och triggar
//    "Ditt paket är framme!"-mejlet när status = DELIVERED.
//
// 2) /_functions/track?tn=... — läs-endpoint som sidan /sparning kallar för
//    att hämta cached carrier-events. Snabb (ingen 17TRACK-roundtrip).
//
// 3) /_functions/track_refresh?tn=...&secret=... — manuell re-fetch direkt från
//    17TRACK (om webhooken har missat något). Skyddad av samma secret.
//
// === 17TRACK-KONFIGURATION ===
// Settings → Notifications → Webhook
//   URL:    https://www.fyndplats.se/_functions/track_webhook?secret=<DIN_HEMLIGHET>
//   Method: POST
//   Trigger on: ALLA status (inte bara DELIVERED — vi vill rita tidslinjen)
//
// === HEMLIGHETER ===
// I Wix Secrets Manager:
//   - DELIVERED_WEBHOOK_SECRET  (samma värde som ?secret=... i webhook-URL)
//   - SEVENTEEN_TRACK_API_KEY   (din 17TRACK API-nyckel)

import { ok, badRequest, forbidden, serverError } from "wix-http-functions";
import { getSecret } from "wix-secrets-backend";
import wixData from "wix-data";
import { sendDeliveredEmail } from "backend/events";
import { applyWebhookPayload, getTrackingData, forceRefresh } from "backend/tracking";

async function checkSecret(request) {
  const expected = await getSecret("DELIVERED_WEBHOOK_SECRET");
  const provided = request.query?.secret ?? "";
  return Boolean(expected && provided === expected);
}

// ---------------------------------------------------------------------------
// 1) Webhook från 17TRACK — alla statusändringar
// ---------------------------------------------------------------------------

export async function post_track_webhook(request) {
  if (!await checkSecret(request)) {
    return forbidden({ body: { error: "Otillåten" } });
  }

  let body;
  try {
    body = await request.body.json();
  } catch {
    return badRequest({ body: { error: "Ogiltig JSON" } });
  }

  try {
    const result = await applyWebhookPayload(body);

    // Vid DELIVERED — slå upp ordern och trigga mejlet.
    if (result.status === "delivered") {
      const cached = await getTrackingData(result.trackingNumber);
      if (cached?.orderId) {
        try {
          const orderResp = await wixData.query("Stores/Orders")
            .eq("_id", cached.orderId)
            .find({ suppressAuth: true });
          const order = orderResp.items[0];
          if (order?.buyerInfo?.contactId) {
            await sendDeliveredEmail(
              order.buyerInfo.contactId,
              order.number,
              order.buyerInfo.firstName || "",
            );
          }
        } catch (err) {
          console.error(`[delivered] kunde inte trigga mejl för ${cached.orderId}:`, err);
        }
      }
    }

    return ok({ body: { ok: true, ...result } });
  } catch (err) {
    console.error("[track_webhook] FEL:", err);
    return serverError({ body: { error: String(err) } });
  }
}

// ---------------------------------------------------------------------------
// 2) Läs-endpoint för /sparning-sidan — INGEN secret (publik, read-only)
// ---------------------------------------------------------------------------

export async function get_track(request) {
  const tn = request.query?.tn;
  if (!tn) return badRequest({ body: { error: "tn (trackingNumber) krävs" } });

  try {
    const data = await getTrackingData(tn);
    if (!data) {
      return ok({ body: { trackingNumber: tn, status: "registered", events: [], step: "ordered" } });
    }
    return ok({
      body: {
        trackingNumber: tn,
        orderId: data.orderId || "",
        status: data.status,
        statusCode: data.statusCode,
        carrier: data.carrier,
        events: data.events || [],
        deliveredAt: data.deliveredAt || null,
        lastFetchedAt: data.lastFetchedAt,
      },
    });
  } catch (err) {
    return serverError({ body: { error: String(err) } });
  }
}

// ---------------------------------------------------------------------------
// 3) Forced re-fetch — användarvänlig "uppdatera"-knapp om webhooken missat
// ---------------------------------------------------------------------------

export async function get_track_refresh(request) {
  if (!await checkSecret(request)) {
    return forbidden({ body: { error: "Otillåten" } });
  }
  const tn = request.query?.tn;
  if (!tn) return badRequest({ body: { error: "tn krävs" } });

  try {
    const result = await forceRefresh(tn);
    return ok({ body: { ok: true, result } });
  } catch (err) {
    return serverError({ body: { error: String(err) } });
  }
}

// ---------------------------------------------------------------------------
// 4) Bakåtkompatibilitet — gamla delivered-webhooken (om 17TRACK redan pekar dit)
// ---------------------------------------------------------------------------

export async function post_delivered(request) {
  if (!await checkSecret(request)) {
    return forbidden({ body: { error: "Otillåten" } });
  }

  let body;
  try {
    body = await request.body.json();
  } catch {
    return badRequest({ body: { error: "Ogiltig JSON" } });
  }

  const contactId = body.contactId || body.customer?.contactId;
  const orderNumber = body.orderNumber || body.order_number || body.tracking_number;
  const customerName = body.customerName || body.customer?.firstName || "";

  if (!contactId) return badRequest({ body: { error: "contactId saknas" } });

  try {
    await sendDeliveredEmail(contactId, orderNumber, customerName);
    return ok({ body: { ok: true, orderNumber } });
  } catch (err) {
    return serverError({ body: { error: String(err) } });
  }
}

export async function get_deliveredTest(request) {
  if (!await checkSecret(request)) {
    return forbidden({ body: { error: "Otillåten" } });
  }
  const { contactId, orderNumber, customerName } = request.query;
  if (!contactId) return badRequest({ body: { error: "contactId krävs" } });
  try {
    await sendDeliveredEmail(contactId, orderNumber, customerName || "");
    return ok({ body: { ok: true } });
  } catch (err) {
    return serverError({ body: { error: String(err) } });
  }
}
