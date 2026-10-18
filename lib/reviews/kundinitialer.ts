// lib/reviews/kundinitialer.ts
//
// Initialer på ett kundomdöme när kunden lämnade namnfältet tomt.
//
// Butikens formulär (headless-site, components/review-form.tsx) har ett
// frivilligt namnfält. Lämnas det tomt sparar butiken "Verifierad köpare" som
// initialer (lib/customer-review.ts, initialsFromName), och det står sedan som
// namn på produktsidan. Leonard 2026-10-18: omdömet ska visa initialer, som de
// andra. Namnet finns på ordern, så initialerna tas därifrån:
// /api/reviews/customer gör det när omdömet skrivs, och
// /api/admin/kundomdome-initialer rättar raderna som skrevs innan dess.
//
// Regeln är butikens: första bokstaven i första och sista ordet, versaler med
// punkt. De två historierna kan inte dela kod, så den står på båda ställena och
// måste stämma.

import type { StoredReview } from "@/lib/store/reviews";

/** Butikens text när kunden inte angav något namn. */
export const UTAN_NAMN = "Verifierad köpare";

/** Saknar omdömet initialer? Tomt, eller butikens text för "inget namn". */
export function saknarInitialer(initials: string | undefined): boolean {
  const t = (initials ?? "").trim();
  return t === "" || t === UTAN_NAMN;
}

/** Initialer ur ett namn, "S.S." eller "S.". Null när namnet saknar bokstäver. */
export function initialerAvNamn(namn: string): string | null {
  const bitar = namn.trim().split(/\s+/).filter(Boolean);
  const bokstav = (s: string) => s.match(/\p{L}/u)?.[0]?.toUpperCase() ?? "";
  if (bitar.length === 0) return null;
  if (bitar.length === 1) {
    const b = bokstav(bitar[0]);
    return b ? `${b}.` : null;
  }
  const f = bokstav(bitar[0]);
  const s = bokstav(bitar[bitar.length - 1]);
  return f && s ? `${f}.${s}.` : null;
}

interface Kontakt {
  firstName?: string;
  lastName?: string;
}

/** De delar av en Wix-order som bär kundens namn. */
export interface OrderMedNamn {
  billingInfo?: { contactDetails?: Kontakt };
  recipientInfo?: { contactDetails?: Kontakt };
  shippingInfo?: { logistics?: { shippingDestination?: { contactDetails?: Kontakt } } };
}

/**
 * Köparens namn på ordern. Faktureringsuppgifterna först, eftersom det är
 * köparen som fick länken till omdömet; mottagaren och leveransadressen bara om
 * de saknas.
 */
export function kundnamnPaOrder(order: OrderMedNamn): string {
  const kontakter = [
    order.billingInfo?.contactDetails,
    order.recipientInfo?.contactDetails,
    order.shippingInfo?.logistics?.shippingDestination?.contactDetails,
  ];
  for (const k of kontakter) {
    const namn = [k?.firstName, k?.lastName].map((s) => (s ?? "").trim()).filter(Boolean).join(" ");
    if (namn) return namn;
  }
  return "";
}

/**
 * Orderns id på ett kundomdöme. Butiken skickar det med, och raden bär det
 * sedan i sin JSON. Saknas fältet läses det ur radens id, som butiken bygger
 * som `kund-<order>-<produkt>` (lib/customer-review.ts, customerReviewId).
 */
export function orderIdForOmdome(r: StoredReview & { orderId?: string }): string | null {
  if (r.orderId) return r.orderId;
  const prefix = "kund-";
  const suffix = `-${r.productId}`;
  if (r.reviewIdAE.startsWith(prefix) && r.reviewIdAE.endsWith(suffix)) {
    const id = r.reviewIdAE.slice(prefix.length, -suffix.length);
    return id || null;
  }
  return null;
}

export interface KundinitialerDeps {
  /** Hela recensionslagret. */
  rader: StoredReview[];
  upsert(r: StoredReview): Promise<void>;
  /** Raden som den står i lagret efter skrivningen. */
  lasOm(productId: string, reviewIdAE: string): Promise<StoredReview | null>;
  /** Köparens namn på ordern, null när ordern inte finns. */
  kundnamn(orderId: string): Promise<string | null>;
}

export interface KundinitialerSvar {
  granskade: number;
  kundomdomen: number;
  /** Kundomdömen utan initialer. */
  attRatta: number;
  /** Av dem: de som har ett namn på ordern. */
  kanRattas: number;
  /** Skrivna och tillbakalästa med de nya initialerna. */
  rattade: number;
  utanOrder: number;
  orderSaknas: number;
  utanNamn: number;
  fel: number;
  /** Wix-id för omdömen som rättades eller, i en torrkörning, kan rättas. */
  produkter: string[];
}

/**
 * Sätter initialer från ordern på varje kundomdöme som saknar dem.
 *
 * ☠️ Statusen följer med oförändrad. Ett godkänt omdöme ska vara godkänt även
 * efteråt, och ett väntande ska inte bli synligt.
 *
 * ☠️ En rad räknas som rättad först när den läses tillbaka med de nya
 * initialerna och samma status. Ett svar utan fel är inget kvitto.
 */
export async function rattaKundinitialer(
  deps: KundinitialerDeps,
  opts: { skarp: boolean },
): Promise<KundinitialerSvar> {
  const kund = deps.rader.filter((r) => r.source === "customer");
  const kandidater = kund.filter((r) => saknarInitialer(r.initials));
  const svar: KundinitialerSvar = {
    granskade: deps.rader.length,
    kundomdomen: kund.length,
    attRatta: kandidater.length,
    kanRattas: 0,
    rattade: 0,
    utanOrder: 0,
    orderSaknas: 0,
    utanNamn: 0,
    fel: 0,
    produkter: [],
  };

  for (const r of kandidater) {
    const orderId = orderIdForOmdome(r);
    if (!orderId) {
      svar.utanOrder++;
      continue;
    }
    let namn: string | null;
    try {
      namn = await deps.kundnamn(orderId);
    } catch {
      svar.fel++;
      continue;
    }
    if (namn === null) {
      svar.orderSaknas++;
      continue;
    }
    const initialer = initialerAvNamn(namn);
    if (!initialer) {
      svar.utanNamn++;
      continue;
    }
    svar.kanRattas++;
    if (!opts.skarp) {
      svar.produkter.push(r.productId);
      continue;
    }
    try {
      await deps.upsert({ ...r, initials: initialer });
      const efter = await deps.lasOm(r.productId, r.reviewIdAE);
      if (efter && efter.initials === initialer && efter.status === r.status) {
        svar.rattade++;
        svar.produkter.push(r.productId);
      } else {
        svar.fel++;
      }
    } catch {
      svar.fel++;
    }
  }
  return svar;
}
