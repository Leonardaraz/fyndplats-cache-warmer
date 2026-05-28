// Wix Velo backend - händelsehanterare för Wix Stores.
// Triggar "Ditt paket är på väg!"-mejlet automatiskt när du markerar en order
// som skickad i Wix Stores (med eller utan spårningsnummer).
//
// === INSTALLATION ===
// 1. Öppna Fyndplats i Wix Editor / Studio (https://manage.wix.com/dashboard/<siteId>/edit)
// 2. Aktivera Velo om det inte är på (Dev Mode → Enable Velo)
// 3. I vänster meny: Code Files → backend → events.js (skapa filen om den inte finns)
// 4. Klistra in HELA innehållet i den här filen
// 5. Save → Publish
//
// När du nästa gång markerar en order som skickad i Wix Stores → automatiskt mejl.

import { triggeredEmails } from "wix-crm-backend";

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

  const variables = {
    orderNumber: String(order.number ?? order._id ?? ""),
    customerName: order.buyerInfo.firstName || "",
    trackingNumber: tracking.trackingNumber || "",
    trackingLink: tracking.trackingLink || "",
    shippingProvider: tracking.shippingProvider || "",
  };

  try {
    await triggeredEmails.emailContact(TEMPLATE_ON_THE_WAY, contactId, { variables });
    console.log(`[on-the-way] OK order #${variables.orderNumber} -> ${contactId}`);
  } catch (err) {
    console.error(`[on-the-way] FEL order #${variables.orderNumber}:`, err);
  }
}

/**
 * Frivilligt: avfyras när en fulfillment uppdateras (t.ex. om du lägger till
 * eller ändrar spårningsnumret efteråt). Kommentera bort om du inte vill
 * att kunden får ett nytt mejl vid spårningsändring.
 */
// export async function wixStores_onFulfillmentUpdated(event) {
//   await wixStores_onFulfillmentCreated(event);
// }

/**
 * "Ditt paket är framme!" — Wix har INGEN inbyggd trigger för "delivered"
 * eftersom Wix inte vet när 17TRACK har sett att paketet kommit fram.
 * Den här hjälpfunktionen exporteras så att en HTTP-endpoint (se
 * http-functions.js) kan anropa den från en 17TRACK-webhook.
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
