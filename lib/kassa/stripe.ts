// lib/kassa/stripe.ts
//
// Stripe för vår egen kassa (Leonards val 2026-11-06: kort, Klarna, Apple Pay
// och Google Pay på vår sida). Bara de anrop kassan behöver, direkt mot Stripes
// REST-API med fetch: inget SDK, så att inget paket följer med till klienten
// och versionen står i koden (STRIPE_VERSION).
//
// Flödet och skälen står i lib/kassa/stripe-flode.ts. Här finns:
//   - kodaParams: Stripes formulärkodning (metadata[x]=…, a[0]=…),
//   - stripeAnrop: ett anrop med den hemliga nyckeln och idempotensnyckel,
//   - prövaWebhook: Stripe-Signature (HMAC-SHA256 över "t.kropp"), med
//     tidsgräns så att ett gammalt meddelande inte kan spelas upp igen.
//
// ☠️ DEN HEMLIGA NYCKELN LÄMNAR ALDRIG SERVERN. Den läses ur STRIPE_SECRET_KEY
// vid varje anrop och skrivs aldrig i en logg eller ett svar.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Avsikt, AvsiktParametrar, Laddning } from "./flode";

/** API-versionen anropen är skrivna mot. Byts bara efter att svaren lästs igen. */
export const STRIPE_VERSION = "2025-03-31.basil";

const BAS = "https://api.stripe.com/v1";

export class StripeFel extends Error {
  readonly status: number;
  readonly typ: string | null;
  readonly kod: string | null;
  readonly avvisningskod: string | null;
  constructor(status: number, typ: string | null, kod: string | null, avvisningskod: string | null, meddelande: string) {
    super(`Stripe ${status}${kod ? ` ${kod}` : ""}: ${meddelande}`);
    this.name = "StripeFel";
    this.status = status;
    this.typ = typ;
    this.kod = kod;
    this.avvisningskod = avvisningskod;
  }
}

type Varde = string | number | boolean | null | undefined | Varde[] | { [k: string]: Varde };

/**
 * Stripes formulärkodning: nästlade objekt som `a[b][c]=v`, listor som
 * `a[0]=v`. Tomma värden (undefined/null) hoppas över, så att ett fält som
 * inte ska ändras aldrig skickas som tom sträng.
 */
export function kodaParams(params: Record<string, Varde>, prefix = ""): string {
  const delar: string[] = [];
  const lagg = (nyckel: string, v: Varde) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((x, i) => lagg(`${nyckel}[${i}]`, x));
      return;
    }
    if (typeof v === "object") {
      for (const [k, x] of Object.entries(v)) lagg(`${nyckel}[${k}]`, x);
      return;
    }
    delar.push(`${encodeURIComponent(nyckel)}=${encodeURIComponent(String(v))}`);
  };
  for (const [k, v] of Object.entries(params)) lagg(prefix ? `${prefix}[${k}]` : k, v);
  return delar.join("&");
}

export function harStripe(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Ett anrop mot Stripe. POST får alltid en idempotensnyckel: ett omförsök med
 * samma nyckel gör samma sak en gång (Stripe sparar svaret i 24 timmar).
 */
export async function stripeAnrop<T>(
  metod: "GET" | "POST",
  sokvag: string,
  params: Record<string, Varde> = {},
  idempotensnyckel?: string,
): Promise<T> {
  const nyckel = process.env.STRIPE_SECRET_KEY;
  if (!nyckel) throw new Error("STRIPE_SECRET_KEY saknas");
  const kropp = kodaParams(params);
  const url = metod === "GET" && kropp ? `${BAS}${sokvag}?${kropp}` : `${BAS}${sokvag}`;
  const rubriker: Record<string, string> = {
    Authorization: `Bearer ${nyckel}`,
    "Stripe-Version": STRIPE_VERSION,
  };
  if (metod === "POST") {
    rubriker["Content-Type"] = "application/x-www-form-urlencoded";
    if (idempotensnyckel) rubriker["Idempotency-Key"] = idempotensnyckel;
  }
  const svar = await fetch(url, {
    method: metod,
    headers: rubriker,
    body: metod === "POST" ? kropp : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await svar.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!svar.ok) {
    const fel = (data as { error?: { type?: string; code?: string; decline_code?: string; message?: string } } | null)?.error;
    throw new StripeFel(svar.status, fel?.type ?? null, fel?.code ?? null, fel?.decline_code ?? null, (fel?.message ?? text).slice(0, 300));
  }
  return data as T;
}

export type Webhookprov =
  | { ok: true; handelse: { id: string; type: string; created: number; data: { object: unknown } } }
  | { ok: false; orsak: "saknar_signatur" | "fel_format" | "for_gammal" | "fel_signatur" | "inte_json" };

/** Stripe-Signature: "t=1700000000,v1=hex,v1=hex". Fler v1 förekommer när hemligheten byts. */
export function lasSignatur(rubrik: string): { t: number; v1: string[] } | null {
  let t = NaN;
  const v1: string[] = [];
  for (const del of rubrik.split(",")) {
    const [k, v] = del.split("=", 2).map((s) => s.trim());
    if (k === "t") t = Number(v);
    else if (k === "v1" && v) v1.push(v);
  }
  if (!Number.isFinite(t) || v1.length === 0) return null;
  return { t, v1 };
}

/**
 * Prövar att meddelandet kommer från Stripe och är färskt. Kroppen måste vara
 * exakt de bytes Stripe skickade (läs `await req.text()`, aldrig JSON först).
 * Toleransen är Stripes egen standard, fem minuter.
 */
export function provaWebhook(kropp: string, rubrik: string | null, hemlighet: string, nuSek = Math.floor(Date.now() / 1000), toleransSek = 300): Webhookprov {
  if (!rubrik) return { ok: false, orsak: "saknar_signatur" };
  const sig = lasSignatur(rubrik);
  if (!sig) return { ok: false, orsak: "fel_format" };
  if (Math.abs(nuSek - sig.t) > toleransSek) return { ok: false, orsak: "for_gammal" };
  const vantad = createHmac("sha256", hemlighet).update(`${sig.t}.${kropp}`, "utf8").digest();
  const traff = sig.v1.some((hex) => {
    if (!/^[0-9a-f]+$/i.test(hex) || hex.length !== vantad.length * 2) return false;
    return timingSafeEqual(Buffer.from(hex, "hex"), vantad);
  });
  if (!traff) return { ok: false, orsak: "fel_signatur" };
  try {
    const handelse = JSON.parse(kropp);
    if (!handelse || typeof handelse.type !== "string" || typeof handelse.id !== "string") return { ok: false, orsak: "inte_json" };
    return { ok: true, handelse };
  } catch {
    return { ok: false, orsak: "inte_json" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentIntent-anropen som kassans flöde använder (lib/kassa/flode.ts,
// StripeKassaDeps). latest_charge byggs ut där betalsättet behövs.
// ─────────────────────────────────────────────────────────────────────────────

const UTBYGGD = { expand: ["latest_charge"] };

export async function skapaAvsikt(p: AvsiktParametrar, idempotens: string): Promise<Avsikt> {
  return stripeAnrop<Avsikt>("POST", "/payment_intents", { ...p }, idempotens);
}

export async function uppdateraAvsikt(id: string, p: Omit<AvsiktParametrar, "currency" | "capture_method" | "automatic_payment_methods">): Promise<Avsikt> {
  return stripeAnrop<Avsikt>("POST", `/payment_intents/${encodeURIComponent(id)}`, { ...p });
}

/** Null när Stripe inte känner till id:t (en gammal eller påhittad betalning). */
export async function hamtaAvsikt(id: string): Promise<Avsikt | null> {
  if (!/^pi_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    return await stripeAnrop<Avsikt>("GET", `/payment_intents/${encodeURIComponent(id)}`, UTBYGGD);
  } catch (e) {
    if (e instanceof StripeFel && e.status === 404) return null;
    throw e;
  }
}

/** Drar det reserverade beloppet. Idempotent per betalning: ett omförsök drar inte två gånger. */
export async function dra(id: string, ore: number): Promise<Avsikt> {
  return stripeAnrop<Avsikt>(
    "POST",
    `/payment_intents/${encodeURIComponent(id)}/capture`,
    { amount_to_capture: ore, ...UTBYGGD },
    `fp-kassa-dra-${id}`,
  );
}

/** Släpper reservationen. En redan släppt betalning är inget fel. */
export async function slappAvsikt(id: string): Promise<void> {
  try {
    await stripeAnrop("POST", `/payment_intents/${encodeURIComponent(id)}/cancel`, {}, `fp-kassa-slapp-${id}`);
  } catch (e) {
    if (e instanceof StripeFel && e.kod === "payment_intent_unexpected_state") return;
    throw e;
  }
}

/**
 * Hela beloppet tillbaka, för en dragen betalning som inte blev någon order.
 * En redan återbetald betalning är inget fel (nätet kan fråga igen efter att
 * idempotensnyckeln gått ut efter ett dygn).
 */
export async function aterbetala(id: string): Promise<void> {
  try {
    await stripeAnrop("POST", "/refunds", { payment_intent: id, reason: "requested_by_customer" }, `fp-kassa-ater-${id}`);
  } catch (e) {
    if (e instanceof StripeFel && e.kod === "charge_already_refunded") return;
    throw e;
  }
}

/** Orderns id på betalningen, så att Stripes panel visar vilken Wix-order den blev. */
export async function markeraAvsikt(id: string, orderId: string): Promise<void> {
  await stripeAnrop("POST", `/payment_intents/${encodeURIComponent(id)}`, { metadata: { wixOrderId: orderId } });
}

/** En lista i Stripe sida för sida (List, inte Search: listan är alltid aktuell, sökningen kan ligga en minut efter). */
async function listaAlla<T extends { id: string }>(sokvag: string, params: Record<string, Varde>, maxSidor: number): Promise<T[]> {
  const ut: T[] = [];
  let efter: string | null = null;
  for (let sida = 0; sida < maxSidor; sida++) {
    const svar: { data?: T[]; has_more?: boolean } = await stripeAnrop("GET", sokvag, { limit: 100, ...params, ...(efter ? { starting_after: efter } : {}) });
    const data = svar?.data ?? [];
    ut.push(...data);
    if (!svar?.has_more || data.length === 0) break;
    efter = data[data.length - 1].id;
  }
  return ut;
}

/**
 * Kontots betalningar skapade efter `sedanSek`, nyaste först. Högst
 * `maxSidor` × 100, för nätet (/api/cron/kassa-stripe).
 */
export async function listaAvsikter(sedanSek: number, maxSidor = 5): Promise<Avsikt[]> {
  return listaAlla<Avsikt>("/payment_intents", { created: { gte: sedanSek } }, maxSidor);
}

// ─────────────────────────────────────────────────────────────────────────────
// Återbetalningar och tvister (speglaAterbetalningar i lib/kassa/flode.ts, och
// nätet). Belopp i öre, som Stripe skriver dem.
// ─────────────────────────────────────────────────────────────────────────────

interface StripeLaddning {
  id: string;
  amount_captured: number;
  amount_refunded: number;
  currency: string;
  disputed: boolean;
  payment_intent: string | { id: string; metadata?: Record<string, string> } | null;
  /** Utbyggd: de senaste återbetalningarna, nyaste först. */
  refunds?: { data?: { created?: number }[] } | null;
}

function laddningAv(c: StripeLaddning, metadata: Record<string, string> | undefined): Laddning {
  return {
    id: c.id,
    dragetOre: c.amount_captured,
    aterbetaltOre: c.amount_refunded,
    valuta: c.currency,
    tvist: c.disputed,
    metadata: metadata ?? {},
    senastAterbetaldSek: c.refunds?.data?.[0]?.created ?? null,
  };
}

/**
 * Laddningen bakom id:t som kassan sparade på Wix-ordern (laddningens ch_/py_,
 * eller betalningens pi_ om laddningen saknades), med betalningens metadata.
 * Null när den inte finns i vårt konto: Wix Payments egna betalningar kan bära
 * Stripe-lika id:n från Wix eget konto.
 */
export async function hamtaLaddning(id: string): Promise<Laddning | null> {
  try {
    if (/^pi_[A-Za-z0-9]+$/.test(id)) {
      const a = await stripeAnrop<{ metadata?: Record<string, string>; latest_charge: StripeLaddning | string | null }>("GET", `/payment_intents/${id}`, {
        expand: ["latest_charge", "latest_charge.refunds"],
      });
      return typeof a.latest_charge === "object" && a.latest_charge ? laddningAv(a.latest_charge, a.metadata) : null;
    }
    if (/^(ch|py)_[A-Za-z0-9]+$/.test(id)) {
      const c = await stripeAnrop<StripeLaddning>("GET", `/charges/${id}`, { expand: ["payment_intent", "refunds"] });
      return laddningAv(c, typeof c.payment_intent === "object" && c.payment_intent ? c.payment_intent.metadata : undefined);
    }
    return null;
  } catch (e) {
    if (e instanceof StripeFel && e.status === 404) return null;
    throw e;
  }
}

/**
 * En del av laddningen tillbaka. Nyckeln bär Wix totala summa
 * (speglingsbeslut), så att två samtidiga speglingar blir en återbetalning.
 */
export async function aterbetalaDel(laddning: string, ore: number, nyckel: string, metadata: Record<string, string>): Promise<{ id: string; status: string }> {
  return stripeAnrop<{ id: string; status: string }>("POST", "/refunds", { charge: laddning, amount: ore, reason: "requested_by_customer", metadata }, nyckel);
}

/** Kontots återbetalningar skapade efter `sedanSek`, med betalningens metadata (vilken order). */
export async function listaAterbetalningar(sedanSek: number, maxSidor = 2): Promise<{ id: string; metadata: Record<string, string> | null }[]> {
  const rader = await listaAlla<{ id: string; payment_intent: string | { metadata?: Record<string, string> } | null }>(
    "/refunds",
    { created: { gte: sedanSek }, expand: ["data.payment_intent"] },
    maxSidor,
  );
  return rader.map((r) => ({ id: r.id, metadata: typeof r.payment_intent === "object" && r.payment_intent ? (r.payment_intent.metadata ?? null) : null }));
}

/** En tvist: kunden har bestridit betalningen hos sin bank eller hos Klarna. */
export interface Tvist {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  /** Unix-sekunder: sista dagen att svara i Stripe. */
  svaraSenastSek: number | null;
}

/** Kontots tvister skapade efter `sedanSek` (nätet larmar om dem som väntar på svar). */
export async function listaTvister(sedanSek: number): Promise<Tvist[]> {
  const rader = await listaAlla<{ id: string; amount: number; currency: string; reason: string; status: string; evidence_details?: { due_by?: number | null } | null }>(
    "/disputes",
    { created: { gte: sedanSek } },
    1,
  );
  return rader.map((t) => ({ id: t.id, amount: t.amount, currency: t.currency, reason: t.reason, status: t.status, svaraSenastSek: t.evidence_details?.due_by ?? null }));
}
