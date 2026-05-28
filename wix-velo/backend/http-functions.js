// Wix Velo backend HTTP-funktioner
//
// 1) POST /_functions/track_webhook — 17TRACK v2.4 push (TRACKING_UPDATED).
//    Verifierar SHA256-signaturen i `sign`-headern enligt 17TRACK-doc:
//    SHA256(`<raw body>/<api_key>`) → jämför med headerns sign.
//
// 2) GET /_functions/track?tn=... — publik läs-endpoint som /sparning-sidan
//    anropar för carrier-events. Snabb (ingen 17TRACK-roundtrip).
//
// 3) GET /_functions/track_refresh?tn=... — manuell re-fetch via /gettrackinfo.
//    Skyddad med `?secret=...` query (DELIVERED_WEBHOOK_SECRET).
//
// === 17TRACK-KONFIGURATION ===
// https://api.17track.net/admin/settings → Settings → klistra in
//   https://www.fyndplats.se/_functions/track_webhook
// (Ingen ?secret=... behövs — vi verifierar via SHA256-sign).

import crypto from "crypto";
import { ok, badRequest, forbidden, serverError } from "wix-http-functions";
import { getSecret } from "wix-secrets-backend";
import wixData from "wix-data";
import { sendDeliveredEmail } from "backend/events";
import {
  applyWebhookPayload,
  getTrackingData,
  forceRefresh,
  lazyFetchAndApply,
} from "backend/tracking";

// ---------------------------------------------------------------------------
// 1) Webhook från 17TRACK med signaturverifiering
// ---------------------------------------------------------------------------

async function verifySignature(rawBody, providedSign) {
  if (!providedSign) return false;
  const apiKey = await getSecret("SEVENTEEN_TRACK_API_KEY");
  const expected = crypto
    .createHash("sha256")
    .update(`${rawBody}/${apiKey}`)
    .digest("hex");
  // Timing-säker jämförelse.
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(providedSign);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function post_track_webhook(request) {
  // Måste läsa råtexten för att kunna verifiera signaturen.
  const rawBody = await request.body.text();
  const sign = request.headers?.sign || request.headers?.Sign || "";

  if (!await verifySignature(rawBody, sign)) {
    console.warn("[track_webhook] signatur invalid eller saknas");
    return forbidden({ body: { error: "Invalid signature" } });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return badRequest({ body: { error: "Ogiltig JSON" } });
  }

  // Stopp-event har bara minimaldata — uppdatera bara status.
  if (payload?.event === "TRACKING_STOPPED") {
    console.log(`[track_webhook] STOPPED ${payload.data?.number}`);
    return ok({ body: { ok: true, stopped: true } });
  }

  // TRACKING_UPDATED (eller annat — behandlas likvärdigt).
  try {
    const result = await applyWebhookPayload(payload);

    // Vid Delivered: slå upp ordern och trigga mejl.
    if (result.status === "Delivered") {
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
          console.error(`[delivered] mejlfel ${cached.orderId}:`, err);
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
// 2) Publik läs-endpoint för /sparning-iframen
// ---------------------------------------------------------------------------

// CORS-headers — iframen på /sparning körs i sandboxat origin och måste få
// läsa svaret från www.fyndplats.se.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Preflight för OPTIONS (cachad i 24 h så det inte triggas på varje GET).
export function options_track() {
  return ok({ headers: { ...CORS, "Access-Control-Max-Age": "86400" }, body: "" });
}

export async function get_track(request) {
  const tn = request.query?.tn;
  if (!tn) return badRequest({ headers: CORS, body: { error: "tn (trackingNumber) krävs" } });

  try {
    let data = await getTrackingData(tn);

    // Lazy-fetch fallback: när webhook-pushen failade eller aldrig kom har
    // vi en placeholder med events=[]. Fråga 17TRACK direkt (throttlat).
    if (
      data
      && (!data.events || data.events.length === 0)
      && data.status !== "Delivered"
    ) {
      const lazy = await lazyFetchAndApply(tn, data);
      if (lazy.fetched) {
        data = await getTrackingData(tn);
      }
    }

    if (!data) {
      return ok({ headers: CORS, body: {
        trackingNumber: tn,
        delivered: false,
        carrier: "Fyndplats Frakt",
        eta: "5–15 arbetsdagar",
        status: "InfoReceived",
        events: [],
      } });
    }
    return ok({
      headers: CORS,
      body: {
        trackingNumber: tn,
        orderId: data.orderId || "",
        delivered: data.status === "Delivered",
        eta: data.status === "Delivered" ? null : "5–15 arbetsdagar",
        status: data.status,
        subStatus: data.subStatus,
        carrier: data.carrier || "Fyndplats Frakt",
        events: data.events || [],
        milestone: data.milestone || [],
        deliveredAt: data.deliveredAt || null,
        lastFetchedAt: data.lastFetchedAt,
      },
    });
  } catch (err) {
    return serverError({ headers: CORS, body: { error: String(err) } });
  }
}

// ---------------------------------------------------------------------------
// 3) Forced re-fetch via /gettrackinfo (manuell uppdatera-knapp)
// ---------------------------------------------------------------------------

async function checkRefreshSecret(request) {
  const expected = await getSecret("DELIVERED_WEBHOOK_SECRET");
  const provided = request.query?.secret ?? "";
  return Boolean(expected && provided === expected);
}

export async function get_track_refresh(request) {
  if (!await checkRefreshSecret(request)) {
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
// 4) Bakåtkompatibilitet — den gamla delivered-webhooken (?secret=...)
//    Användbar om du redan kopplat 17TRACK eller AfterShip dit.
// ---------------------------------------------------------------------------

export async function post_delivered(request) {
  if (!await checkRefreshSecret(request)) {
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
  if (!await checkRefreshSecret(request)) {
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
