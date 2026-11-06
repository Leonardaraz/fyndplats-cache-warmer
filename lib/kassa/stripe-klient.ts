// lib/kassa/stripe-klient.ts
//
// Kassasidans Stripe-del utan webbläsare: betalfältets inställningar,
// faktureringsuppgifterna ur formuläret, kundens sparade försök och vad sidan
// gör med serverns svar. Används av app/kassa/kassa.tsx och
// app/kassa/klar/tillbaka.tsx. Ren modul (bara typer importeras), så att
// node --test kan köra den.
//
// Flödet på sidan (servern: lib/kassa/flode.ts):
//   1. Betalfältet (Stripe Payment Element) visas direkt, utan PaymentIntent.
//   2. "Betala": elements.submit() FÖRST, i själva trycket (Apple Pay öppnar
//      sitt blad bara i ett tryck), sedan /api/kassa/stripe/forbered.
//   3. stripe.confirmPayment med kundens uppgifter ur formuläret. Kort, Apple
//      Pay och Google Pay stannar på sidan; Klarna går till Klarna och kommer
//      tillbaka via /api/kassa/stripe/retur.
//   4. /api/kassa/stripe/klar gör ordern, och kunden går till /tack.

import type { Appearance, StripeElementsOptionsMode, StripePaymentElementOptions } from "@stripe/stripe-js";
import type { KassaVarden } from "./formular";

/** Måste vara samma som PaymentIntenten servern skapar (avsiktParametrar). Provat i stripe-klient.test.ts. */
export const STRIPE_VALUTA = "sek";
export const STRIPE_DRAGNING = "manual";

/** localStorage: kundens senaste betalning, så att ett nytt tryck använder samma. */
export const STRIPE_NYCKEL = "fp_kassa_stripe";

/** Ett sparat försök som är äldre än så här används inte igen. */
export const SPARAD_MS = 24 * 60 * 60 * 1000;

/**
 * Dit Stripe skickar kunden efter Klarna. Stripe lägger betalningens
 * client_secret i adressen, och sidorna laddar GA4 och Meta som sparar hela
 * adressen. Därför går kunden först till en rutt utan spårning, som skickar
 * vidare med bara betalningens id (returMal).
 */
export const RETUR_SOKVAG = "/api/kassa/stripe/retur";

const AVSIKT_ID = /^pi_[A-Za-z0-9]+$/;

/**
 * Betalfältets utseende: butikens färger och mått (app/globals.css,
 * app/kassa/kassa.module.css). Stripe ritar fältet i en egen ram och läser
 * inte sidans CSS, så värdena står här.
 */
export const UTSEENDE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#C2410C",
    colorText: "#1c1c1c",
    colorTextSecondary: "#6b6157",
    colorTextPlaceholder: "#8a8076",
    colorDanger: "#D02020",
    colorBackground: "#ffffff",
    fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    // 16 px: iPhone zoomar annars in när ett fält får fokus.
    fontSizeBase: "16px",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1.5px solid #d9cfc4", boxShadow: "none" },
    ".Input:focus": { border: "1.5px solid #C2410C", boxShadow: "0 0 0 3px rgba(194, 65, 12, 0.18)" },
    ".Input--invalid": { border: "1.5px solid #D02020", boxShadow: "none" },
    ".AccordionItem": { border: "1.5px solid #EFE7DE", boxShadow: "none" },
    ".AccordionItem--selected": { border: "1.5px solid #C2410C" },
    ".Label": { fontWeight: "500" },
  },
};

/** Elements utan PaymentIntent (den skapas först i trycket). Beloppet visas i Apple Pay och styr Klarna. */
export function elementsInstallningar(totalOre: number): StripeElementsOptionsMode {
  return {
    mode: "payment",
    amount: totalOre,
    currency: STRIPE_VALUTA,
    captureMethod: STRIPE_DRAGNING,
    locale: "sv",
    appearance: UTSEENDE,
    fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" }],
  };
}

/**
 * Betalfältet: betalsätten som en lista med val, Klarna först (två av tre köp,
 * 2026-06–11). Namn, e-post, telefon och adress frågas ALDRIG i fältet: kunden
 * har redan skrivit dem i formuläret, och de skickas med i bekräftelsen
 * (faktureringsuppgifter). Det var Wix betalsidas fel: Klarna-kunden fick
 * skriva allt en gång till.
 */
export const BETALFALT: StripePaymentElementOptions = {
  layout: { type: "accordion", defaultCollapsed: false, radios: true, spacedAccordionItems: true },
  paymentMethodOrder: ["klarna", "apple_pay", "google_pay", "card"],
  fields: { billingDetails: "never" },
  wallets: { applePay: "auto", googlePay: "auto", link: "never" },
  business: { name: "Fyndplats" },
};

export interface Fakturering {
  name: string;
  email: string;
  phone: string;
  address: { line1: string; line2: string; city: string; state: string; postal_code: string; country: string };
}

/**
 * Faktureringsuppgifterna till stripe.confirmPayment. Med `billingDetails:
 * "never"` kräver Stripe VARJE fält, också de som inte används i Sverige
 * (state, och line2 utan c/o): ett saknat fält stoppar betalningen. Adressen är
 * densamma som leveransadressen på PaymentIntenten (avsiktParametrar).
 */
export function faktureringsuppgifter(v: KassaVarden): Fakturering {
  return {
    name: `${v.fornamn} ${v.efternamn}`.trim(),
    email: v.epost,
    phone: v.telefon,
    address: {
      line1: v.gata,
      line2: v.co ? `c/o ${v.co.replace(/^c\/o\s*/i, "")}` : "",
      city: v.ort,
      state: "",
      postal_code: v.postnr.replace(/\s/g, ""),
      country: "SE",
    },
  };
}

export interface SparadAvsikt {
  avsiktId: string;
  cartId: string;
  at: number;
}

/** Betalningens id ur kundens sparade försök, om det gäller den här korgen och inte är för gammalt. */
export function sparadAvsikt(v: unknown, cartId: string, nuMs: number): string | null {
  if (!v || typeof v !== "object" || !cartId) return null;
  const s = v as Partial<SparadAvsikt>;
  if (typeof s.avsiktId !== "string" || !AVSIKT_ID.test(s.avsiktId)) return null;
  if (s.cartId !== cartId || typeof s.at !== "number" || !Number.isFinite(s.at)) return null;
  if (nuMs - s.at > SPARAD_MS || s.at - nuMs > 60_000) return null;
  return s.avsiktId;
}

export type KlarBeslut = { gor: "tack"; orderId: string } | { gor: "vanta" } | { gor: "fel"; kod: string; meddelanden: string[] };

const TEXT_FEL = "Beställningen kunde inte slutföras. Ingen betalning drogs. Försök igen, eller kontakta oss om det inte går.";

/**
 * Svaret från /api/kassa/stripe/klar. "vanta" betyder fråga igen om en stund:
 * någon annan (webhooken) slutför just nu, betalningen behandlas, eller
 * servern eller nätet felade (pengarna kan vara dragna, så kunden får aldrig
 * ett fel som säger "försök igen" i det läget).
 */
export function klarBeslut(status: number, j: unknown): KlarBeslut {
  const s = j && typeof j === "object" ? (j as { ok?: unknown; orderId?: unknown; kod?: unknown; meddelanden?: unknown }) : {};
  if (status === 200 && s.ok === true && typeof s.orderId === "string" && s.orderId) return { gor: "tack", orderId: s.orderId };
  // 503 är "kassan är stängd" (nycklarna saknas): att fråga igen hjälper inte.
  if (status === 0 || status === 200 || status === 202 || (status >= 500 && status !== 503)) return { gor: "vanta" };
  const meddelanden = Array.isArray(s.meddelanden) ? s.meddelanden.filter((m): m is string => typeof m === "string" && m.length > 0) : [];
  return { gor: "fel", kod: typeof s.kod === "string" ? s.kod : "fel", meddelanden: meddelanden.length ? meddelanden : [TEXT_FEL] };
}

/** Från Stripes return_url till /kassa/klar, utan client_secret. */
export function returMal(sok: URLSearchParams): string {
  const pi = sok.get("payment_intent") ?? "";
  return AVSIKT_ID.test(pi) ? `/kassa/klar?avsikt=${pi}` : "/kassa?stripe=fel";
}

/** Texterna för /kassa?stripe=<kod>, när kunden skickas tillbaka till kassan. */
export const STRIPE_MEDDELANDE: Record<string, string> = {
  avbruten: "Betalningen avbröts eller godkändes inte, och inget har dragits. Välj ett betalsätt och försök igen.",
  pris_andrat: "Priset ändrades medan du betalade. Ingen betalning drogs. Kontrollera beställningen och försök igen.",
  slut: "En vara tog slut medan du betalade. Ingen betalning drogs. Kontrollera varukorgen och försök igen.",
  fel: TEXT_FEL,
};

/** Kassans kod för en betalning som inte blev en order: ej_betald betyder att kunden avbröt. */
export function tillbakaKod(kod: string): string {
  if (kod === "ej_betald") return "avbruten";
  // Egen egenskap, inte `in`: "constructor" och "__proto__" finns på varje objekt.
  // hasOwnProperty.call och inte Object.hasOwn, som saknas i Safari före 15.4 (butiken stöder iOS 14).
  return Object.prototype.hasOwnProperty.call(STRIPE_MEDDELANDE, kod) ? kod : "fel";
}

/** Texten för ?stripe=<kod> på /kassa. Koden kommer ur adressen, så bara kända koder ger sin text. */
export function stripeMeddelande(kod: string | null): string | null {
  if (!kod) return null;
  return STRIPE_MEDDELANDE[tillbakaKod(kod)];
}

/** Felet från stripe.confirmPayment eller elements.submit, med kundens ord. */
export function betalfelText(e: { type?: string; message?: string } | null | undefined): string {
  // Kort- och formulärfel har Stripes egen svenska text (locale "sv"): den säger vad som är fel.
  if (e && (e.type === "card_error" || e.type === "validation_error") && e.message) return e.message;
  return "Betalningen kunde inte genomföras just nu. Ingen betalning drogs. Försök igen om en stund.";
}
