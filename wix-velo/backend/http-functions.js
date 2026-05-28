// Wix Velo backend HTTP-funktion — endpoint som 17TRACK (eller liknande) kan
// pinga när ett paket är levererat. Triggar "Ditt paket är framme!"-mejlet.
//
// === INSTALLATION ===
// 1. I Wix Editor / Studio Velo: Code Files → backend → http-functions.js
//    (skapa filen om den inte finns)
// 2. Klistra in HELA innehållet i den här filen.
// 3. Save → Publish.
// 4. Endpointen blir tillgänglig på:
//      https://<din-domän>/_functions/delivered
//      https://www.fyndplats.se/_functions/delivered    (för Fyndplats)
//    samt på prod-/test-versionen:
//      https://<site>/_functions-dev/delivered          (under utveckling)
//
// === 17TRACK-KONFIGURATION ===
// I 17TRACK-dashboarden: Settings → Notifications → Webhook
//   URL:    https://www.fyndplats.se/_functions/delivered?secret=<DIN_HEMLIGHET>
//   Method: POST
//   Trigger on status: DELIVERED
//   Body:   JSON med minst tracking_number och din metadata (orderNumber, contactId)
//
// === SÄKERHET ===
// Sätt en hemlighet i Wix Secrets Manager: gå till Dashboard → Developer Tools
// → Secrets Manager, lägg till nyckeln "DELIVERED_WEBHOOK_SECRET". Skicka samma
// värde som ?secret=... från 17TRACK. Anrop utan rätt secret avvisas.

import { ok, badRequest, forbidden, serverError } from "wix-http-functions";
import { getSecret } from "wix-secrets-backend";
import { sendDeliveredEmail } from "backend/events";

export async function post_delivered(request) {
  // 1. Verifiera hemligheten.
  try {
    const expected = await getSecret("DELIVERED_WEBHOOK_SECRET");
    const provided = request.query?.secret ?? "";
    if (!expected || provided !== expected) {
      return forbidden({ body: { error: "Otillåten" } });
    }
  } catch (err) {
    return serverError({ body: { error: "Secret-kontroll misslyckades" } });
  }

  // 2. Plocka ut data ur 17TRACK-bodyn (justera fält efter ditt webhook-format).
  let body;
  try {
    body = await request.body.json();
  } catch {
    return badRequest({ body: { error: "Ogiltig JSON" } });
  }

  const contactId = body.contactId || body.customer?.contactId;
  const orderNumber = body.orderNumber || body.order_number || body.tracking_number;
  const customerName = body.customerName || body.customer?.firstName || "";

  if (!contactId) {
    return badRequest({ body: { error: "contactId saknas i payloaden" } });
  }

  // 3. Skicka mejlet.
  try {
    await sendDeliveredEmail(contactId, orderNumber, customerName);
    return ok({ body: { ok: true, orderNumber } });
  } catch (err) {
    console.error("[delivered] FEL:", err);
    return serverError({ body: { error: String(err) } });
  }
}

/**
 * Manuell trigger via GET — för snabbt test från din webbläsare.
 *   GET https://www.fyndplats.se/_functions/delivered-test?secret=...&contactId=...&orderNumber=...
 * Använd EN GÅNG för att verifiera mall + leverans, ta sedan bort eller låt vara.
 */
export async function get_deliveredTest(request) {
  try {
    const expected = await getSecret("DELIVERED_WEBHOOK_SECRET");
    if (!expected || request.query.secret !== expected) return forbidden({ body: { error: "Otillåten" } });
    const { contactId, orderNumber, customerName } = request.query;
    if (!contactId) return badRequest({ body: { error: "contactId saknas i query" } });
    await sendDeliveredEmail(contactId, orderNumber, customerName || "");
    return ok({ body: { ok: true } });
  } catch (err) {
    return serverError({ body: { error: String(err) } });
  }
}
