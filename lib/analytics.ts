// GA4 ecommerce-eventer för Google Ads konvertering. Mätar-ID:t G-W6NZ87CX2Q
// laddas globalt från app/layout.tsx; här bara typade wrappers runt window.gtag.
//
// Items-shape följer GA4-specen (item_id, item_name, item_category, item_brand,
// price, quantity). Valuta + value sätts per event så purchase-attributionen i
// Google Ads får både konverteringsvärde och artikelnivå.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { metaTrack, type MetaContent } from "./meta";

export type Item = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price: number;
  quantity: number;
};

type GtagFn = (
  command: "event",
  eventName: string,
  params?: Record<string, unknown>,
) => void;

function gtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof g === "function" ? g : null;
}

function send(eventName: string, params: Record<string, unknown>) {
  const g = gtag();
  if (!g) return;
  try {
    g("event", eventName, params);
  } catch {
    // GA4 ska aldrig krascha sidan — svälj och fortsätt
  }
}

// Plockar ut id/namn/pris/quantity från en Wix-cart line item så att kassa-
// och cart-vy-eventen kan dela samma normalisering. Wix Ecom V1 har
// catalogReference.catalogItemId (productId), productName.original (sv-text)
// och price.amount (string).
function lineItemToItem(li: any): Item {
  const productId =
    li?.catalogReference?.catalogItemId ||
    li?.catalogReference?.productId ||
    li?.productId ||
    "";
  const name =
    (typeof li?.productName === "string" ? li.productName : li?.productName?.original) ||
    li?.productName?.translated ||
    "Produkt";
  const priceNum = parseFloat(li?.price?.amount ?? li?.price ?? "0") || 0;
  const qty = Number(li?.quantity) || 1;
  return {
    item_id: productId,
    item_name: name,
    item_brand: "Fyndplats",
    price: priceNum,
    quantity: qty,
  };
}

function cartItems(cart: any): Item[] {
  return ((cart?.lineItems as any[]) || []).map(lineItemToItem);
}

function cartTotal(cart: any): number {
  const sub =
    cart?.priceSummary?.subtotal?.amount ??
    cart?.subtotal?.amount ??
    "0";
  return parseFloat(sub) || 0;
}

// Meta använder content_ids (sträng-array) + contents (id/quantity/item_price).
// Samma normalisering som GA4-items, omformad till Metas shape.
function metaContents(items: Item[]): MetaContent[] {
  return items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price }));
}
function metaIds(items: Item[]): string[] {
  return items.map((i) => i.item_id);
}
function numItems(items: Item[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export type ViewItemInput = {
  id: string;
  name: string;
  priceNum: number;
  category?: string;
};

export function trackViewItem(p: ViewItemInput) {
  send("view_item", {
    currency: "SEK",
    value: p.priceNum,
    items: [
      {
        item_id: p.id,
        item_name: p.name,
        item_category: p.category,
        item_brand: "Fyndplats",
        price: p.priceNum,
        quantity: 1,
      },
    ],
  });
  // Meta ViewContent (Pixel + CAPI, delad event_id).
  metaTrack("ViewContent", {
    content_type: "product",
    content_ids: [p.id],
    content_name: p.name,
    content_category: p.category,
    value: p.priceNum,
    currency: "SEK",
  });
}

export type AddToCartInput = {
  id: string;
  name: string;
  priceNum: number;
  quantity?: number;
  category?: string;
};

export function trackAddToCart(input: AddToCartInput) {
  const qty = input.quantity ?? 1;
  send("add_to_cart", {
    currency: "SEK",
    value: input.priceNum * qty,
    items: [
      {
        item_id: input.id,
        item_name: input.name,
        item_category: input.category,
        item_brand: "Fyndplats",
        price: input.priceNum,
        quantity: qty,
      },
    ],
  });
  // Meta AddToCart (Pixel + CAPI, delad event_id).
  metaTrack("AddToCart", {
    content_type: "product",
    content_ids: [input.id],
    content_name: input.name,
    content_category: input.category,
    contents: [{ id: input.id, quantity: qty, item_price: input.priceNum }],
    value: input.priceNum * qty,
    currency: "SEK",
  });
}

export function trackViewCart(cart: any) {
  const items = cartItems(cart);
  if (items.length === 0) return;
  send("view_cart", {
    currency: "SEK",
    value: cartTotal(cart),
    items,
  });
}

export function trackBeginCheckout(cart: any) {
  const items = cartItems(cart);
  if (items.length === 0) return;
  send("begin_checkout", {
    currency: "SEK",
    value: cartTotal(cart),
    items,
  });
  // Meta InitiateCheckout (Pixel + CAPI, delad event_id). metaTrack använder
  // keepalive så anropet överlever redirecten till Wix-kassan direkt efteråt.
  metaTrack("InitiateCheckout", {
    content_type: "product",
    content_ids: metaIds(items),
    contents: metaContents(items),
    num_items: numItems(items),
    value: cartTotal(cart),
    currency: "SEK",
  });
}

// Snapshot-format som persisteras till localStorage vid checkout-start så att
// /tack-sidan kan rekonstruera purchase-eventet (Wix redirectar tillbaka utan
// items i URL:en). Lagrar BARA det GA4 behöver — inga PII.
export type PurchaseSnapshot = {
  value: number;
  currency: "SEK";
  items: Item[];
};

const PURCHASE_KEY = "fp_purchase_pending";

export function stashPurchaseSnapshot(cart: any) {
  if (typeof window === "undefined") return;
  const snap: PurchaseSnapshot = {
    value: cartTotal(cart),
    currency: "SEK",
    items: cartItems(cart),
  };
  if (snap.items.length === 0) return;
  try {
    window.localStorage.setItem(PURCHASE_KEY, JSON.stringify(snap));
  } catch {
    // localStorage kan vara avstängt (private mode / cookie-block) — strunta i
  }
}

function readPurchaseSnapshot(): PurchaseSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PURCHASE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as PurchaseSnapshot;
    if (!snap?.items?.length) return null;
    return snap;
  } catch {
    return null;
  }
}

function clearPurchaseSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PURCHASE_KEY);
  } catch {}
}

// Den kritiska eventen för Google Ads-attribution. Wix Ecom skickar inte items
// i tack-redirecten, så vi förlitar oss på snapshot:en som lagrades innan
// kassan öppnades. Dedupar på transaction_id så att en F5 på /tack inte
// rapporterar dubbla konverteringar.
export function trackPurchase(orderId: string | null | undefined) {
  if (typeof window === "undefined") return;
  const snap = readPurchaseSnapshot();
  if (!snap) return;
  const txId = orderId || `fp-${Date.now()}`;
  const sentKey = `fp_purchase_sent_${txId}`;
  try {
    if (window.sessionStorage.getItem(sentKey)) {
      clearPurchaseSnapshot();
      return;
    }
    window.sessionStorage.setItem(sentKey, "1");
  } catch {
    // session storage saknas — fall through och skicka ändå
  }
  send("purchase", {
    transaction_id: txId,
    currency: snap.currency,
    value: snap.value,
    items: snap.items,
  });
  // Meta Purchase (Pixel + CAPI). event_id = `purchase_<txId>` är DETERMINISTISK
  // och delas med det server-autoritativa Purchase som /api/wix-webhook fyrar
  // vid order_created (lib/handlers / meta-capi) → Meta deduplicerar dem mot
  // varandra. Klient-eventet ger snabb browser-signal; webhook-eventet är
  // backupen som når fram även när /tack aldrig laddas (adblock/iOS).
  metaTrack(
    "Purchase",
    {
      content_type: "product",
      content_ids: snap.items.map((i) => i.item_id),
      contents: snap.items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
      num_items: snap.items.reduce((n, i) => n + i.quantity, 0),
      value: snap.value,
      currency: snap.currency,
    },
    { eventId: `purchase_${txId}` },
  );
  clearPurchaseSnapshot();
}
