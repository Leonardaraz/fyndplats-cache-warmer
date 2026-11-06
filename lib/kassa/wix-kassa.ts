// lib/kassa/wix-kassa.ts
//
// Wix-anropen bakom vår egen kassa (lib/kassa/flode.ts har flödet och
// skälen). Alla går med butikens API-nyckel (lib/wix-client.ts), som läser och
// skriver varukorgar, ordrar och betalningsbegäranden. Formerna är uppmätta mot
// Wix 2026-11-05/06 med två testordrar, båda avbrutna utan betalning.

import { wixFetch, WixApiError } from "@/lib/wix-client";
import type { Forsok, KassaDeps, Korg, Kund, OrderTransaktioner, Rakning, Tidigare } from "./flode";
import { arKorgensBetalning, KASSA_MARKOR, medOmforsok, platshallarbetalningar } from "./flode";

const korgSokvag = (id: string) => `/ecom/v2/carts/${encodeURIComponent(id)}`;

/** Wix nekade anropet för många anrop på kort tid (429): det har inte gjort något och kan göras om. */
const nekadAvWix = (e: unknown) => e instanceof WixApiError && e.status === 429;
const forsokIgen = <T,>(anrop: () => Promise<T>) => medOmforsok(anrop, nekadAvWix);

function adress(k: Kund) {
  return {
    country: "SE",
    city: k.ort,
    postalCode: k.postnr,
    addressLine: k.gata,
    ...(k.co ? { addressLine2: `c/o ${k.co.replace(/^c\/o\s*/i, "")}` } : {}),
  };
}

export async function hamtaKorg(cartId: string): Promise<Korg | null> {
  try {
    const svar = await wixFetch<{ cart?: Korg }>({ path: korgSokvag(cartId) });
    return svar?.cart ?? null;
  } catch (e) {
    if (e instanceof WixApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

/** Kontakt, leveransadress och fakturaadress (samma) på korgen. */
export async function uppdateraKorg(cartId: string, k: Kund): Promise<void> {
  const kontakt = { firstName: k.fornamn, lastName: k.efternamn, phone: k.telefon };
  await wixFetch({
    method: "PATCH",
    path: korgSokvag(cartId),
    body: {
      cart: {
        id: cartId,
        customerInfo: { email: k.epost, firstName: k.fornamn, lastName: k.efternamn, phone: k.telefon },
        deliveryInfo: { address: adress(k) },
        paymentInfo: { billingAddress: adress(k), billingContact: kontakt },
      },
    },
  });
}

/** Bara landet (och postnumret när det finns), för räkningen innan kunden skrivit adressen. Utan land räknar Wix med serverns land. */
export async function sattLand(cartId: string, postnr: string | null): Promise<void> {
  await wixFetch({
    method: "PATCH",
    path: korgSokvag(cartId),
    body: { cart: { id: cartId, deliveryInfo: { address: { country: "SE", ...(postnr ? { postalCode: postnr } : {}) } } } },
  });
}

/** "ogiltig" när Wix säger att koden inte finns eller inte gäller; andra fel kastas. */
export async function laggTillKupong(cartId: string, kod: string): Promise<"ok" | "ogiltig"> {
  try {
    await wixFetch({ method: "POST", path: `${korgSokvag(cartId)}/add-coupon`, body: { coupon: { code: kod } } });
    return "ok";
  } catch (e) {
    if (e instanceof WixApiError && e.status >= 400 && e.status < 500 && /COUPON/i.test(e.bodyText)) return "ogiltig";
    throw e;
  }
}

export async function taBortKupong(cartId: string, kupongId: string): Promise<void> {
  await wixFetch({ method: "POST", path: `${korgSokvag(cartId)}/remove-coupon`, body: { couponId: kupongId } });
}

/** Räknar korgen med katalogen uppfräschad: priser, lager och rabatter som just nu. */
export async function rakna(cartId: string): Promise<Rakning> {
  return wixFetch<Rakning>({ method: "POST", path: `${korgSokvag(cartId)}/calculate`, body: { refreshCart: true } });
}

export async function sattLeverans(cartId: string, satt: { code: string; appId: string }): Promise<void> {
  await wixFetch({ method: "POST", path: `${korgSokvag(cartId)}/set-delivery-method`, body: { deliveryMethod: satt } });
}

/** Checkout V1 `create-order` på korgens id: i Cart V2 är korgens id kassans id. */
export async function skapaOrder(cartId: string): Promise<{ orderId: string }> {
  const svar = await forsokIgen(() =>
    wixFetch<{ orderId?: string }>({
      method: "POST",
      path: `/ecom/v1/checkouts/${encodeURIComponent(cartId)}/create-order`,
      body: {},
    }),
  );
  if (!svar?.orderId) throw new Error("Wix skapade ingen order ur korgen");
  return { orderId: svar.orderId };
}

/**
 * Stripe-kassan: Cart V2 Place Order, som ersätter create-order ovan (Checkout
 * V1 tas bort 2027-02-01). Uppmätt 2026-11-06 på en förberedd korg utan
 * betalning: ordern blir INITIALIZED och NOT_PAID, nummer 0, kanal WEB, med
 * cartId och purchaseFlowId, och inget dras. Prisbeviset står i kroppen (Wix
 * schema); stämmer det inte med priserna nekar Wix ordern.
 */
export async function laggOrder(cartId: string, prisbevis: string | null): Promise<{ orderId: string }> {
  const svar = await forsokIgen(() =>
    wixFetch<{ orderId?: string }>({
      method: "POST",
      path: `${korgSokvag(cartId)}/place-order`,
      body: prisbevis ? { priceVerificationToken: prisbevis } : {},
    }),
  );
  if (!svar?.orderId) throw new Error("Wix skapade ingen order ur korgen");
  return { orderId: svar.orderId };
}

/**
 * Stripes betalning som godkänd betalning på ordern (Add Payments). Inga pengar
 * rör sig här; ordern räknar om sin betalstatus asynkront och blir betald.
 * Återbetalningen görs i Wix som för andra ordrar: Wix bokför den som manuell,
 * och butiken gör den i Stripe (speglaAterbetalningar i lib/kassa/flode.ts).
 *
 * ☠️ OFFLINE, annars går den inte att återbetala i Wix. Uppmätt i slutprovet
 * 2026-11-06 (provordern): som onlinebetalning svarar Get Order
 * Refundability nonRefundable TRANSACTION_NOT_FOUND (Wix letar efter
 * transaktionen i sin egen kassa) och Refund Payments 428 PAYMENT_NOT_REFUNDABLE,
 * också med externalRefund. Som offlinebetalning blir den manuallyRefundable
 * OFFLINE, och en manuell återbetalning går igenom (SCHEDULED, SUCCEEDED inom en
 * minut). Wix behåller providerTransactionId också på en offlinebetalning, tvärt
 * emot dokumentationen, så speglingen hittar laddningen och Add Payments nekar
 * fortfarande en dubblett.
 */
export async function registreraBetalning(orderId: string, b: { belopp: string; transaktion: string; namn: string; tid: string }): Promise<void> {
  await forsokIgen(() =>
    wixFetch({
      method: "POST",
      path: `/ecom/v1/payments/orders/${encodeURIComponent(orderId)}/add-payment`,
      body: {
        payments: [
          {
            createdDate: b.tid,
            amount: { amount: b.belopp },
            status: "APPROVED",
            refundDisabled: false,
            regularPaymentDetails: {
              providerTransactionId: b.transaktion.slice(0, 100),
              offlinePayment: true,
              paymentMethodName: { buyerLanguageName: b.namn, siteLanguageName: b.namn },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Orderns betalningar och återbetalningar (List Transactions For Single
 * Order). En order utan transaktioner ger tomma listor, inget fel.
 */
export async function orderTransaktioner(orderId: string): Promise<OrderTransaktioner> {
  const svar = await forsokIgen(() =>
    wixFetch<{ orderTransactions?: Partial<OrderTransaktioner> }>({ path: `/ecom/v1/payments/orders/${encodeURIComponent(orderId)}` }),
  );
  return { payments: svar?.orderTransactions?.payments ?? [], refunds: svar?.orderTransactions?.refunds ?? [] };
}

/**
 * Place Orders egen väntande betalning (platshallarbetalningar i flode.ts)
 * markeras avbruten när vår betalning står på ordern. Inga pengar rör sig
 * (Update Payment Status ändrar bara posten). Antalet avbrutna.
 */
export async function avbrytPlatshallare(orderId: string): Promise<number> {
  const ids = platshallarbetalningar(await orderTransaktioner(orderId));
  for (const id of ids) {
    await forsokIgen(() =>
      wixFetch({
        method: "POST",
        path: `/ecom/v1/payments/${encodeURIComponent(id)}/orders/${encodeURIComponent(orderId)}/update-payment-transaction-status`,
        body: { status: "CANCELED" },
      }),
    );
  }
  return ids.length;
}

/**
 * Betalningarna som står på ordern, som transaktions-id. Add Payments nekar
 * hela anropet om transaktionen redan finns, så ett omtag läser ordern först.
 * En betalning utan leverantörens id (presentkort) räknas med sitt eget id.
 */
export async function orderBetalningar(orderId: string): Promise<string[]> {
  return (await orderTransaktioner(orderId)).payments.map((p) => p.regularPaymentDetails?.providerTransactionId || p.id || "okand");
}

/**
 * Ordrar med en återbetalning som ändrats sedan `sedanIso`, senast ändrade
 * först, högst `max` (nätet under speglingen av återbetalningar). Uppmätt
 * 2026-11-06: Search Orders filtrerar på paymentStatus med $in och på
 * updatedDate. `fler` när det fanns fler än `max`: nätet säger det i loggen
 * i stället för att tyst hoppa över dem.
 */
export async function aterbetaldaOrdrar(sedanIso: string, max: number): Promise<{ ids: string[]; fler: boolean }> {
  const svar = await forsokIgen(() =>
    wixFetch<{ orders?: { id?: string }[]; metadata?: { hasNext?: boolean } }>({
      method: "POST",
      path: "/ecom/v1/orders/search",
      body: {
        search: {
          filter: { $and: [{ paymentStatus: { $in: ["PARTIALLY_REFUNDED", "FULLY_REFUNDED"] } }, { updatedDate: { $gte: sedanIso } }] },
          sort: [{ fieldName: "updatedDate", order: "DESC" }],
          cursorPaging: { limit: max },
        },
      },
    }),
  );
  const ids = (svar?.orders ?? []).map((o) => o.id).filter((id): id is string => typeof id === "string" && id.length > 0);
  return { ids, fler: Boolean(svar?.metadata?.hasNext) };
}

/** En order som aldrig blev betald: avbruten med återlagring och utan mejl (Stripe-kassan och slappOrder nedan). */
export async function avbrytOrder(orderId: string): Promise<void> {
  await forsokIgen(() =>
    wixFetch({
      method: "POST",
      path: `/ecom/v1/orders/${encodeURIComponent(orderId)}/cancel`,
      body: { sendOrderCanceledEmail: false, restockAllItems: true },
    }),
  );
}

export async function skapaBetalning(b: Parameters<KassaDeps["skapaBetalning"]>[0]): Promise<{ id: string; url: string }> {
  const skapa = (medBild: boolean) =>
    forsokIgen(() =>
      wixFetch<{ orderPaymentRequest?: { id?: string }; orderPaymentRequestUrl?: string }>({
        method: "POST",
        path: "/ecom/v1/order-payment-requests",
        body: {
          orderPaymentRequest: {
            orderId: b.orderId,
            amount: { amount: b.belopp },
            title: b.titel,
            description: b.beskrivning,
            expirationDate: b.utgar,
            source: { externalId: b.externtId },
            blockedPaymentMethods: ["MANUAL"],
            ...(medBild && b.bild ? { image: b.bild } : {}),
          },
        },
      }),
    );
  let svar: Awaited<ReturnType<typeof skapa>>;
  try {
    svar = await skapa(true);
  } catch (e) {
    // Bilden är bara utseende: nekar Wix den (400) skapas betalningen utan.
    // Ett nekat anrop har inte skapat något, så det går att göra om.
    if (!(b.bild && e instanceof WixApiError && e.status === 400)) throw e;
    svar = await skapa(false);
  }
  const id = svar?.orderPaymentRequest?.id;
  const url = svar?.orderPaymentRequestUrl;
  if (!id || !url) throw new Error("Wix gav ingen betalsida");
  return { id, url };
}

interface Betalningsbegaran {
  id?: string;
  status?: string;
  orderId?: string;
  createdDate?: string;
  expirationDate?: string;
  amount?: { amount?: string };
  source?: { externalId?: string };
}

/** Betalsidans adress för en befintlig betalning (Wix ger den bara vid skapandet annars). */
export async function betalsidansAdress(betalningId: string): Promise<string> {
  const svar = await forsokIgen(() =>
    wixFetch<{ orderPaymentRequestUrl?: string }>({
      method: "POST",
      path: "/ecom/v1/order-payment-requests/url",
      body: { orderPaymentRequestId: betalningId },
    }),
  );
  if (!svar?.orderPaymentRequestUrl) throw new Error("Wix gav ingen adress till betalsidan");
  return svar.orderPaymentRequestUrl;
}

interface OrderKort {
  id?: string;
  status?: string;
  paymentStatus?: string;
  cartId?: string;
  checkoutId?: string;
  number?: string;
}

export async function hamtaBetalning(id: string): Promise<Betalningsbegaran | null> {
  try {
    const svar = await wixFetch<{ orderPaymentRequest?: Betalningsbegaran }>({ path: `/ecom/v1/order-payment-requests/${encodeURIComponent(id)}` });
    return svar?.orderPaymentRequest ?? null;
  } catch (e) {
    if (e instanceof WixApiError && e.status === 404) return null;
    throw e;
  }
}

export async function hamtaOrder(id: string): Promise<OrderKort | null> {
  try {
    const svar = await wixFetch<{ order?: OrderKort }>({ path: `/ecom/v1/orders/${encodeURIComponent(id)}` });
    return svar?.order ?? null;
  } catch (e) {
    if (e instanceof WixApiError && e.status === 404) return null;
    throw e;
  }
}

export const arBetald = (o: OrderKort | null | undefined): boolean =>
  !!o && (o.paymentStatus === "PAID" || o.paymentStatus === "PARTIALLY_REFUNDED" || o.paymentStatus === "FULLY_REFUNDED" || o.status === "APPROVED");

/**
 * Släpper en obetald order från vår kassa: betalningen makuleras först (så att
 * den gamla länken aldrig går att betala), sedan avbryts ordern med
 * återlagring och utan mejl. Bara om båda hör till korgen och kassan.
 */
export async function slappOrder(orderId: string, betalningId: string | null, cartId: string | null): Promise<"slappt" | "ej_var" | "betald"> {
  const order = await hamtaOrder(orderId);
  if (!order) return "ej_var";
  if (cartId && order.cartId !== cartId && order.checkoutId !== cartId) return "ej_var";
  if (arBetald(order)) return "betald";
  if (betalningId) {
    const b = await hamtaBetalning(betalningId);
    if (b && b.orderId !== orderId) return "ej_var";
    if (b && !(b.source?.externalId ?? "").startsWith(`${KASSA_MARKOR}:`)) return "ej_var";
    if (b?.status === "PAID") return "betald";
    if (b?.status === "UNPAID") {
      await forsokIgen(() => wixFetch({ method: "POST", path: "/ecom/v1/order-payment-requests/void", body: { orderPaymentRequestId: betalningId } }));
    }
  }
  if (order.status === "INITIALIZED") {
    await avbrytOrder(orderId);
    return "slappt";
  }
  return "ej_var";
}

export async function slappTidigare(cartId: string, t: Tidigare): Promise<"slappt" | "ej_var" | "betald"> {
  return slappOrder(t.orderId, t.betalningId, cartId);
}

/** Våra betalningsbegäranden, nyaste först (städjobbet; volymen är några om dagen). */
export async function senasteKassaBetalningar(antal = 100): Promise<Betalningsbegaran[]> {
  const svar = await wixFetch<{ orderPaymentRequests?: Betalningsbegaran[] }>({
    method: "POST",
    path: "/ecom/v1/order-payment-requests/query",
    body: { query: { sort: [{ fieldName: "createdDate", order: "DESC" }], cursorPaging: { limit: Math.min(100, antal) } } },
  });
  return (svar?.orderPaymentRequests ?? []).filter((b) => (b.source?.externalId ?? "").startsWith(`${KASSA_MARKOR}:`));
}

/** Betald order: korgen markeras som beställd, så att besökarens varukorg töms. Fel sväljs (webhooken). */
export async function avslutaKorg(cartId: string, orderId: string): Promise<boolean> {
  try {
    await wixFetch({ method: "POST", path: `${korgSokvag(cartId)}/mark-cart-as-completed`, body: { orderId } });
    return true;
  } catch {
    return false;
  }
}

/** Kassans betalningar för en korg sedan en tidpunkt (för nästa försök och spärren). */
export async function korgensForsok(cartId: string, sedan: Date): Promise<Forsok[]> {
  const grans = sedan.getTime();
  return (await senasteKassaBetalningar(100))
    .filter((b) => arKorgensBetalning(b.source?.externalId, cartId) && Date.parse(b.createdDate ?? "") >= grans && b.id && b.orderId)
    .map((b) => ({
      id: b.id!,
      orderId: b.orderId!,
      status: b.status ?? "",
      utgar: b.expirationDate,
      externtId: b.source?.externalId,
      belopp: b.amount?.amount,
    }));
}

export const wixKassa: KassaDeps = {
  hamtaKorg,
  uppdateraKorg,
  laggTillKupong,
  taBortKupong,
  rakna,
  sattLeverans,
  skapaOrder,
  skapaBetalning,
  slappTidigare,
  korgensForsok,
  betalsidansAdress,
};
