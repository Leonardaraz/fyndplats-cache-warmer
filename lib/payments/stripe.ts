// Stripe Checkout — beroendefri hjälpare (REST via fetch, ingen SDK).
//
// Vi skapar en Checkout Session och låter Stripe sköta betalsidan. Pris-ID:n och
// hemlig nyckel läses ur miljön — koden rör aldrig något Stripe-konto vid build,
// och skapar inga produkter. Du skapar produkterna/priserna i Stripe-dashboarden
// och klistrar in deras price-ID i miljövariablerna (se .env.example).

export type Plan = "audit" | "monitoring";

export interface CheckoutParams {
  plan: Plan;
  /** Var Stripe skickar kunden efter lyckad/avbruten betalning. */
  successUrl: string;
  cancelUrl: string;
  /** Förifyll kundens e-post om vi har den från gradern. */
  email?: string;
  /** Den granskade URL:en — sparas som metadata på sessionen. */
  scannedUrl?: string;
}

interface StripeConfig {
  secretKey: string;
  priceAudit: string;
  priceMonitoring: string;
}

/** Läser och validerar Stripe-miljön. Kastar tydligt fel om något saknas. */
function readConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceAudit = process.env.STRIPE_PRICE_AUDIT;
  const priceMonitoring = process.env.STRIPE_PRICE_MONITORING;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY saknas i miljön.");
  if (!priceAudit) throw new Error("STRIPE_PRICE_AUDIT saknas i miljön.");
  if (!priceMonitoring) throw new Error("STRIPE_PRICE_MONITORING saknas i miljön.");
  return { secretKey, priceAudit, priceMonitoring };
}

/**
 * Plattar ut nästlade params till Stripes form-kodade format (a[b][c]=v).
 * Hakparenteserna i nyckeln hålls literala (Stripes format) medan varje
 * nyckelsegment och värde URL-kodas. Exporterad för test.
 */
export function encodeForm(obj: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${encodeURIComponent(key)}]` : encodeURIComponent(key);
    if (typeof value === "object") {
      parts.push(encodeForm(value as Record<string, unknown>, name));
    } else {
      parts.push(`${name}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

/** Skapar en Stripe Checkout Session och returnerar URL:en kunden ska till. */
export async function createCheckoutSession(params: CheckoutParams): Promise<string> {
  const cfg = readConfig();
  const isSubscription = params.plan === "monitoring";
  const price = isSubscription ? cfg.priceMonitoring : cfg.priceAudit;

  const body = encodeForm({
    mode: isSubscription ? "subscription" : "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    line_items: { 0: { price, quantity: 1 } },
    ...(params.email ? { customer_email: params.email } : {}),
    ...(params.scannedUrl ? { metadata: { scanned_url: params.scannedUrl, plan: params.plan } } : {}),
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    throw new Error(data.error?.message ?? `Stripe svarade med status ${res.status}.`);
  }
  return data.url;
}
