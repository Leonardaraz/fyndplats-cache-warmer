// Slår upp en Wix ecom-order (GET /ecom/v1/orders/{id}) för /tack.
//
// Wix headless redirectar till /tack med ?orderId=<GUID>, inte det läsbara
// ordernumret — det ligger på orderns `number`-fält och kräver ett API-anrop.
// Samma auth/endpoint som webhookens fetchWixOrder + lib/order-sync.
//
// Ett anrop ger allt sidan behöver: numret till kunden, och e-post + land +
// orderdatum till Googles recensionsenkät (lib/gcr.ts).
//
// Fältvägarna bor i lib/wix-order-fields.ts — se kommentaren där om varför de
// inte får gissas.

import { resolveOrderId } from "./wix-order-lookup";
import {
  orderCountry,
  orderCreatedDate,
  orderEmail,
  orderNumber,
} from "./wix-order-fields";

/** Det /tack behöver ur ordern. */
export interface WixOrderInfo {
  /** Läsbart ordernummer, t.ex. "10021". Null när Wix inte gav något. */
  readonly number: string | null;
  /** Köparens e-post — Google kan inte skicka enkäten utan den. */
  readonly email: string | null;
  /** Leveranslandet som Wix angav det (normaliseras i lib/gcr.ts). */
  readonly deliveryCountry: string | null;
  /** Orderns skapandedatum (ISO). Ankare för estimerat leveransdatum. */
  readonly createdDate: string | null;
}

// Ny literal per anrop, aldrig en delad konstant: WixOrderInfo returneras från
// fyra vägar och en modulnivå-singleton hade kunnat muteras av en framtida
// anropare och därmed läcka mellan requests i samma varma lambda.
function tomt(): WixOrderInfo {
  return { number: null, email: null, deliveryCountry: null, createdDate: null };
}

/**
 * Hämtar ordern. Fail-open: allt fel ger tomma fält, aldrig ett kast — /tack är
 * sidan kunden landar på EFTER att ha betalat och får aldrig fela.
 *
 * Fail-open betyder inte tyst. Varje misslyckad väg loggar, eftersom ett
 * utebliven Google-modul annars är omöjlig att skilja från "kunden tackade nej
 * till cookies". Samma resonemang som webhookens fetchWixOrder.
 */
export async function fetchWixOrderInfo(orderId: string): Promise<WixOrderInfo> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) {
    console.warn("[tack] WIX_API_KEY/WIX_SITE_ID saknas — ingen order slås upp.");
    return tomt();
  }
  if (!orderId) return tomt();
  // Sidan tar emot `?orderNumber` som reserv (app/tack/page.tsx) och Wix
  // endpoint slår bara upp på GUID. Utan uppslaget hade den grenen gett tomma
  // fält — och då renderar Googles recensionsenkät TYST inte alls, eftersom
  // den kräver e-post och leveransland ur ordern. Samma fel som fällde
  // omdömeslänken (PR #497), här latent i stället för synligt.
  const id = await resolveOrderId(orderId);
  if (!id) {
    console.warn(`[tack] fetchWixOrderInfo(${orderId}): varken GUID eller känt ordernummer`);
    return tomt();
  }
  try {
    const res = await fetch(
      `https://www.wixapis.com/ecom/v1/orders/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Authorization: key,
          "wix-site-id": site,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        // Tidsgräns mot HÄNGNING, inte mot normal latens. Det här anropet
        // blockerar bekräftelsesidans HTML (sidan är force-dynamic), så en TCP-
        // hängning hade lämnat en betalande kund framför en tom sida ända till
        // Vercels function-timeout. 8s är samma val som webhookens fetchWixOrder.
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) {
      console.warn(`[tack] fetchWixOrderInfo(${orderId}) → HTTP ${res.status}`);
      return tomt();
    }
    const json = (await res.json()) as { order?: Record<string, unknown> };
    const order = json.order;
    if (!order) {
      console.warn(`[tack] fetchWixOrderInfo(${orderId}) → svar utan order-objekt`);
      return tomt();
    }
    return {
      number: orderNumber(order) ?? null,
      email: orderEmail(order) ?? null,
      deliveryCountry: orderCountry(order) ?? null,
      createdDate: orderCreatedDate(order) ?? null,
    };
  } catch (err) {
    console.warn(`[tack] fetchWixOrderInfo(${orderId}) fel`, err);
    return tomt();
  }
}
