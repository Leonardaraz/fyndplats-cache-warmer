// lib/webhook-fanout.ts
//
// Fan-out av Wix order-events från /api/wix-webhook till fyndplats-cache-warmer.
//
// Bakgrund: Wix tillåter bara EN webhook-subscription per event-type per Wix-
// app. Vi vill ha samma event i två system:
//   • fyndplats-headless: skicka transaktions-mejl, mirror till `orders`,
//     Meta CAPI Purchase, push-notiser, abandoned-cart conversion.
//   • fyndplats-cache-warmer: skapa fulfillment-tasks, prioritera lager-sync,
//     spåra säljarvärden.
//
// Lösning: headless tar emot Wix:s subscription, verifierar JWT-signaturen,
// och forwardar samma raw body till cache-warmer med en X-Forwarded-From-
// header som signalerar att signaturen redan verifierats upstream.
//
// Fan-outen är *fire-and-forget*: ett fel hos cache-warmer får ALDRIG fördröja
// eller fälla vår webhook-response till Wix (det skulle ge retry → dubbla
// orderbekräftelse-mejl).

const DEFAULT_FANOUT_URL = "https://fyndplats-cache-warmer.vercel.app/api/wix-order";

// Order-events vi forwardar. Cache-warmer behöver dessa för fulfillment-tasks
// och inventory-sync. Övriga event-typer (abandoned_checkout, etc.) hanteras
// bara av headless.
const ORDER_FANOUT_EVENT_TYPES = [
  "wix.ecom.v1.order.order_created",
  "wix.ecom.v1.order.order_paid",
  "wix.ecom.v1.order.order_fulfilled",
  "wix.ecom.v1.order.order_refunded",
] as const;

/**
 * Beslutar om en given event-type ska forwardas till cache-warmer.
 *
 * Wix kan skicka event-typen i flera shapes:
 *   • Full FQDN: "wix.ecom.v1.order.order_created"
 *   • Slug-only: "order_created"
 *   • V2-format: "wix.ecom.v2.order.order_paid"
 *
 * Vi gör substring-match så vi fångar alla varianter av order_created / _paid /
 * _fulfilled / _refunded utan att råka trigga på andra slugs som råkar börja
 * med "order_".
 */
export function shouldFanoutToCacheWarmer(eventType: string): boolean {
  const lower = eventType.toLowerCase();
  if (ORDER_FANOUT_EVENT_TYPES.some((t) => lower === t)) return true;
  // Suffix-match för FQDN-varianter ("...order.order_paid" etc.)
  return /\border\.(order_created|order_paid|order_fulfilled|order_refunded)\b/.test(
    lower,
  );
}

export interface FanoutOptions {
  /** Raw request body — exakt det Wix skickade. Kan vara JWT eller JSON. */
  rawBody: string;
  /** Lower-cased event-type efter unwrap. */
  eventType: string;
  /** Värdet på `digest`-headern från Wix (om någon) — vi forwardar den vidare. */
  digest?: string | null;
  /** Override för URL. Default = env CACHE_WARMER_FANOUT_URL eller hårdkodad fallback. */
  url?: string;
  /** Injicerbar fetch för testbarhet. Default = global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Forwardar Wix order-event till cache-warmer. Fire-and-forget: returnerar
 * Promise<void> som alltid resolvar (fel loggas internt). Anropare ska INTE
 * `await` resultatet om de står i en webhook-handler — låt promisen drivas
 * vidare av runtime så att vår response till Wix går iväg direkt.
 */
export function fanoutToCacheWarmer(opts: FanoutOptions): Promise<void> {
  const url = opts.url ?? process.env.CACHE_WARMER_FANOUT_URL ?? DEFAULT_FANOUT_URL;
  const doFetch = opts.fetchImpl ?? fetch;

  return doFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-From": "fyndplats-webhook",
      "X-Original-Digest": opts.digest ?? "",
      "X-Original-Event-Type": opts.eventType,
    },
    body: opts.rawBody,
  })
    .then((r) => {
      if (!r.ok) {
        console.error(
          `[fanout] cache-warmer forward returned ${r.status} for ${opts.eventType}`,
        );
      } else {
        console.log(
          `[fanout] forwarded ${opts.eventType} → cache-warmer (${r.status})`,
        );
      }
    })
    .catch((err) => {
      console.error("[fanout] cache-warmer forward failed:", err);
    });
}
