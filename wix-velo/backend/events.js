// Wix Velo backend - händelsehanterare för Wix Stores.
// Triggar "Ditt paket är på väg!"-mejlet automatiskt när du markerar en order
// som skickad i Wix Stores, OCH registrerar tracking-numret hos 17TRACK så att
// /sparning-sidan kan visa carrier-events direkt när 17TRACK plockat upp dem.
//
// === INSTALLATION ===
// 1. Öppna Fyndplats i Wix Editor / Studio
// 2. Aktivera Velo om det inte är på (Dev Mode → Enable Velo)
// 3. I vänster meny: Code Files → backend → events.js
// 4. Klistra in HELA innehållet i den här filen
// 5. Save → Publish

import { triggeredEmails } from "wix-crm-backend";
import { registerTracking } from "backend/tracking";

const TEMPLATE_ON_THE_WAY = "VKnRVoH";   // "Ditt paket är på väg!"
const TEMPLATE_DELIVERED  = "VKnSIqs";   // "Ditt paket är framme!"

/**
 * Avfyras av Wix Stores när en fulfillment skapas på en order
 * (= du klickade "Markera som skickad" i admin).
 */
export async function wixStores_onFulfillmentCreated(event) {
  const order = event?.order;
  if (!order?.buyerInfo) {
    console.warn("[on-the-way] order eller buyerInfo saknas, hoppar över");
    return;
  }

  const contactId = order.buyerInfo.contactId;
  if (!contactId) {
    console.warn(`[on-the-way] order ${order.number}: contactId saknas`);
    return;
  }

  const tracking = event?.fulfillment?.trackingInfo ?? {};
  const trackingNumber = tracking.trackingNumber || "";

  const variables = {
    orderNumber: String(order.number ?? order._id ?? ""),
    customerName: order.buyerInfo.firstName || "",
    trackingNumber,
    trackingLink: tracking.trackingLink || "",
    shippingProvider: tracking.shippingProvider || "",
  };

  // 1. Skicka "På väg"-mejlet.
  try {
    await triggeredEmails.emailContact(TEMPLATE_ON_THE_WAY, contactId, { variables });
    console.log(`[on-the-way] OK order #${variables.orderNumber} -> ${contactId}`);
  } catch (err) {
    console.error(`[on-the-way] FEL order #${variables.orderNumber}:`, err);
  }

  // 2. Registrera hos 17TRACK så carrier-events börjar pollas/pushas.
  if (trackingNumber) {
    try {
      await registerTracking(trackingNumber, order._id);
      console.log(`[17track] registrerad ${trackingNumber} för order ${order.number}`);
    } catch (err) {
      console.error(`[17track] kunde inte registrera ${trackingNumber}:`, err);
    }
  }
}

/**
 * Frivilligt: avfyras när en fulfillment uppdateras (t.ex. om du lägger till
 * eller ändrar spårningsnumret efteråt).
 */
// export async function wixStores_onFulfillmentUpdated(event) {
//   await wixStores_onFulfillmentCreated(event);
// }

/**
 * "Ditt paket är framme!" — exporteras så att 17TRACK-webhooken
 * (se http-functions.js) kan trigga mejlet när status = DELIVERED.
 */
export async function sendDeliveredEmail(contactId, orderNumber, customerName) {
  if (!contactId) throw new Error("contactId krävs");
  await triggeredEmails.emailContact(TEMPLATE_DELIVERED, contactId, {
    variables: {
      orderNumber: String(orderNumber ?? ""),
      customerName: customerName || "",
    },
  });
}
