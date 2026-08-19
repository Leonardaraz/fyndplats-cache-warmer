// Fältuppslag i en Wix ecom-order (GET /ecom/v1/orders/{id}).
//
// VARFÖR DEN HÄR FILEN FINNS (granskning 2026-08-19): första versionen av
// lib/wix-orders.ts läste landet på `shippingInfo.shippingDestination.address
// .country`. Den vägen är CHECKOUT-payloadens form — den som
// abandoned-checkout-handler.ts och order-conversion-hook.ts arbetar med. En
// riktig ecom-ORDER lägger adressen på `recipientInfo.address`, vilket kodbasens
// egen extractShippingAddress i app/api/wix-webhook/route.ts redan visste och
// dokumenterade ("Wix v3 ecom: recipientInfo.address har { …, country, … }").
//
// Följden hade varit att landet alltid blev null → ingen Google-modul → noll
// enkäter. Alltså exakt den bugg integrationen skulle rätta, tyst återskapad.
//
// Ordningen nedan är kopierad från webhookens beprövade extraktorer, som körts
// mot skarpa ordrar sedan länge. Fan-outen är inte paranoia: den finns för att
// Wix lägger fälten olika beroende på gäst-/kontoköp och ecom-version.
//
// KVARSTÅR: webhooken har fortfarande sina egna kopior av samma logik. Att låta
// den importera härifrån är rätt nästa steg, men det är en ändring i
// order-mejlens väg och hör inte hemma i samma commit som en /tack-fix.

/** Första värdet som är en icke-tom sträng. */
export function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return undefined;
}

type Loose = Record<string, unknown> | undefined;

function obj(v: unknown): Loose {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : undefined;
}

/**
 * Köparens e-post. Samma fem vägar som extractCustomer i webhooken, i samma
 * ordning — `buyerInfo.email` ensamt visade sig otillräckligt i produktion.
 */
export function orderEmail(order: Loose): string | undefined {
  const buyer = obj(order?.buyerInfo) ?? obj(order?.buyer);
  const billing = obj(order?.billingInfo) ?? obj(order?.billing);
  const recipient = obj(order?.recipientInfo) ?? obj(order?.recipient);
  return firstStr(
    buyer?.email,
    obj(buyer?.contactDetails)?.email,
    obj(billing?.contactDetails)?.email,
    obj(recipient?.contactDetails)?.email,
    order?.buyerEmail,
  );
}

/**
 * Leveranslandet, orört från Wix (normaliseras i lib/gcr.ts). Samma
 * adressupplösning som extractShippingAddress: recipientInfo först, sedan
 * shippingDestination, sist logistics-varianten.
 */
export function orderCountry(order: Loose): string | undefined {
  const recipient = obj(order?.recipientInfo) ?? obj(order?.recipient) ?? obj(order?.shippingInfo);
  const addr =
    obj(recipient?.address) ??
    obj(recipient?.shippingDestination) ??
    obj(obj(obj(obj(order?.shippingInfo)?.logistics)?.shippingDestination)?.address);
  // shippingDestination kan i sin tur bära adressen ett steg ner.
  return firstStr(addr?.country, obj(addr?.address)?.country);
}

/** Orderns skapandedatum som ISO-sträng, eller undefined. */
export function orderCreatedDate(order: Loose): string | undefined {
  return firstStr(order?.createdDate, order?._createdDate, order?.dateCreated);
}

/** Det kundvända ordernumret ("10021"). */
export function orderNumber(order: Loose): string | undefined {
  return firstStr(order?.number);
}
