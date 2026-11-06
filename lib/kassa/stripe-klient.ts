// lib/kassa/stripe-klient.ts
//
// Kassasidans Stripe-del utan webbläsare: betalfältets inställningar, kundens
// sparade försök, väntan på ordern och vad sidan gör med serverns svar.
// Används av app/kassa/kassa.tsx och app/kassa/klar/tillbaka.tsx. Ren modul
// (bara typer importeras), så att node --test kan köra den.
//
// Flödet på sidan (servern: lib/kassa/flode.ts):
//   1. Betalfältet (Stripe Payment Element) visas direkt, utan PaymentIntent.
//   2. "Betala": elements.submit() FÖRST, i själva trycket (Apple Pay öppnar
//      sitt blad bara i ett tryck), sedan /api/kassa/stripe/forbered, som
//      också ger faktureringsuppgifterna (faktureringAv i flode.ts).
//   3. stripe.confirmPayment med dem. Kort, Apple Pay och Google Pay stannar
//      på sidan; Klarna går till Klarna och kommer tillbaka via
//      /api/kassa/stripe/retur.
//   4. /api/kassa/stripe/klar gör ordern (vantaPaOrder), och kunden går till /tack.

import type { Appearance, StripeElementsOptionsMode, StripePaymentElementOptions } from "@stripe/stripe-js";

/** Måste vara samma som PaymentIntenten servern skapar (avsiktParametrar). Provat i stripe-klient.test.ts. */
export const STRIPE_VALUTA = "sek";
export const STRIPE_DRAGNING = "manual";

/** localStorage: kundens senaste betalning, så att ett nytt tryck använder samma. */
export const STRIPE_NYCKEL = "fp_kassa_stripe";

/** Ett sparat försök som är äldre än så här används inte igen. */
export const SPARAD_MS = 24 * 60 * 60 * 1000;

/**
 * Dit Stripe skickar kunden efter Klarna. Stripe lägger betalningens id och
 * client_secret i adressen, och sidorna laddar GA4 och Meta, som sparar hela
 * adressen. Därför går kunden först till en rutt utan spårning, som lägger
 * betalningens id i en kort kaka (AVSIKT_KAKA) och skickar vidare till
 * /kassa/klar utan något i adressen (returMal).
 */
export const RETUR_SOKVAG = "/api/kassa/stripe/retur";

/** Kakan med betalningens id från returen till /kassa/klar: bara den sökvägen, en kvart. */
export const AVSIKT_KAKA = "fp_kassa_avsikt";
export const AVSIKT_KAKA_SOKVAG = "/kassa/klar";
export const AVSIKT_KAKA_SEK = 15 * 60;

/** Så länge sidan frågar efter ordern innan den säger att bekräftelsen kommer via e-post. */
export const KLAR_VANTA_MS = 60_000;

const AVSIKT_ID = /^pi_[A-Za-z0-9]+$/;

/**
 * Betalfältets utseende: butikens färger och mått (app/globals.css,
 * app/kassa/kassa.module.css). Stripe ritar fältet i en egen ram och läser
 * inte sidans CSS, så värdena står här. Flytande etiketter som i kassans egna
 * fält: ledtexten står i fältet och flyttar upp när kunden skriver.
 */
export const UTSEENDE: Appearance = {
  theme: "stripe",
  labels: "floating",
  variables: {
    colorPrimary: "#C2410C",
    colorText: "#1c1c1c",
    colorTextSecondary: "#6b6157",
    colorTextPlaceholder: "#8a8076",
    colorDanger: "#D02020",
    colorBackground: "#ffffff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    // 16 px: iPhone zoomar annars in när ett fält får fokus.
    fontSizeBase: "16px",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1.5px solid #d9cfc4", boxShadow: "none", paddingTop: "8px", paddingBottom: "8px" },
    ".Input:hover": { border: "1.5px solid #c9bcae" },
    ".Input:focus": { border: "1.5px solid #C2410C", boxShadow: "0 0 0 3px rgba(194, 65, 12, 0.18)" },
    ".Input--invalid": { border: "1.5px solid #D02020", boxShadow: "none" },
    ".AccordionItem": { border: "1.5px solid #EFE7DE", boxShadow: "none", padding: "16px" },
    ".AccordionItem--selected": { border: "1.5px solid #C2410C", boxShadow: "0 0 0 3px rgba(194, 65, 12, 0.08)" },
    ".Label": { fontWeight: "500" },
    ".Label--floating": { fontWeight: "600" },
  },
};

/**
 * Elements utan PaymentIntent (den skapas först i trycket). Beloppet visas i
 * Apple Pay och styr Klarna. Inga typsnitt hämtas till Stripes ram: butiken
 * hämtar inga typsnitt från Google (next/font lägger dem på vår egen server),
 * så fältet ritas med systemets typsnitt, som Stripe gör som standard.
 */
export function elementsInstallningar(totalOre: number): StripeElementsOptionsMode {
  return {
    mode: "payment",
    amount: totalOre,
    currency: STRIPE_VALUTA,
    captureMethod: STRIPE_DRAGNING,
    locale: "sv",
    appearance: UTSEENDE,
  };
}

/**
 * Betalfältet: betalsätten som en lista med val. Namn, e-post, telefon och
 * adress frågas ALDRIG i fältet: kunden har redan skrivit dem i formuläret, och
 * servern skickar med dem till bekräftelsen (faktureringAv i
 * lib/kassa/flode.ts). Det var Wix betalsidas fel: Klarna-kunden fick skriva
 * allt en gång till.
 *
 * ☠️ KLARNA SIST OCH ALDRIG FÖRVALT, fast två av tre köp är Klarna. Lagen
 * (2010:751) om betaltjänster (prop. 2019/20:79, i kraft 2020-07-01): finns ett
 * betalsätt utan kredit ska det visas först, och ett betalsätt med kredit får
 * inte vara förvalt. "Kredit" ska förstås brett, och Klarnas val rymmer
 * "betala om 30 dagar" och delbetalning. Ett brott räknas som otillbörlig
 * marknadsföring (KO). Fältet fäller ut det första valet (defaultCollapsed
 * false), alltså kortet; Klarna väljs aktivt. Ordningen låses i proven.
 */
export const BETALFALT: StripePaymentElementOptions = {
  layout: { type: "accordion", defaultCollapsed: false, radios: true, spacedAccordionItems: true },
  paymentMethodOrder: ["card", "apple_pay", "google_pay", "klarna"],
  fields: { billingDetails: "never" },
  wallets: { applePay: "auto", googlePay: "auto", link: "never" },
  business: { name: "Fyndplats" },
};

/**
 * Klarna-rutan på produktsidan. Klarnas egen ruta (OSM, components/klarna-osm.tsx)
 * visar villkoren i Leonards Klarna-avtal, som gäller i Wix kassa: "Betala
 * inom 30 eller 60 dagar" och delbetalning i 3–24 månader. I Stripe-kassan
 * betalar kunden med Stripes Klarna, som har andra villkor (30 dagar och
 * Stripes delbetalning). När Stripe-kassan är på för alla visar sidan därför
 * vår egen rad (components/klarna-message.tsx: "Betala senare – räntefritt"),
 * som stämmer i båda, och Klarnas skript laddas inte. Provläget ändrar inget
 * för vanliga kunder, så där står OSM kvar.
 */
export type KlarnaRuta = "osm" | "statisk";

export function klarnaRuta(lage: "av" | "prov" | "pa", harStripe: boolean): KlarnaRuta {
  return lage === "pa" && harStripe ? "statisk" : "osm";
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

/** Ett svar från /api/kassa/stripe/klar: status 0 när nätet felade. */
export interface KlarSvar {
  status: number;
  j: unknown;
}

/** Frågar servern en gång om betalningen blivit en order. Kastar aldrig. */
export async function fragaKlar(avsiktId: string): Promise<KlarSvar> {
  try {
    const r = await fetch("/api/kassa/stripe/klar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avsiktId }),
      cache: "no-store",
    });
    return { status: r.status, j: await r.json().catch(() => null) };
  } catch {
    return { status: 0, j: null };
  }
}

/** Det väntan behöver från omvärlden; proven byter ut dem. */
export interface Vantan {
  fraga(avsiktId: string): Promise<KlarSvar>;
  vila(ms: number): Promise<void>;
  nu(): number;
}

export const WEBBLASARVANTAN: Vantan = {
  fraga: fragaKlar,
  vila: (ms) => new Promise((klar) => setTimeout(klar, ms)),
  nu: () => Date.now(),
};

/**
 * Frågar servern tills ordern finns ("tack"), det är klart att den inte blir
 * någon ("fel"), eller KLAR_VANTA_MS gått ("tid": webhooken och nätet
 * slutför, och kunden får beskedet att bekräftelsen kommer via e-post).
 * Väntan mellan frågorna växer från 1 s till 3 s.
 */
export async function vantaPaOrder(avsiktId: string, v: Vantan = WEBBLASARVANTAN, maxMs = KLAR_VANTA_MS): Promise<Exclude<KlarBeslut, { gor: "vanta" }> | { gor: "tid" }> {
  const start = v.nu();
  for (let forsok = 0; ; forsok++) {
    const { status, j } = await v.fraga(avsiktId);
    const b = klarBeslut(status, j);
    if (b.gor !== "vanta") return b;
    if (v.nu() - start > maxMs) return { gor: "tid" };
    await v.vila(Math.min(1000 + forsok * 500, 3000));
  }
}

/** Från Stripes return_url: vart kunden ska och betalningens id till kakan (aldrig i adressen). */
export function returMal(sok: URLSearchParams): { mal: string; avsikt: string | null } {
  const pi = sok.get("payment_intent") ?? "";
  return AVSIKT_ID.test(pi) ? { mal: AVSIKT_KAKA_SOKVAG, avsikt: pi } : { mal: "/kassa?stripe=fel", avsikt: null };
}

/** Betalningens id ur kakorna (document.cookie), om det är ett giltigt id. */
export function avsiktUrKakor(kakor: string): string | null {
  for (const del of kakor.split(";")) {
    const i = del.indexOf("=");
    if (i < 0 || del.slice(0, i).trim() !== AVSIKT_KAKA) continue;
    const v = del.slice(i + 1).trim();
    return AVSIKT_ID.test(v) ? v : null;
  }
  return null;
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

/** Text när bankens verifiering (3D Secure, BankID) inte godkändes: kunden kan göra något åt den. */
export const TEXT_VERIFIERING = "Banken godkände inte verifieringen. Ingen betalning drogs. Försök igen, eller välj ett annat kort eller betalsätt.";

/** Felet från stripe.confirmPayment eller elements.submit, med kundens ord. */
export function betalfelText(e: { type?: string; code?: string; message?: string } | null | undefined): string {
  // Bankens verifiering som avbröts eller nekades: förut stod "försök igen om en
  // stund", som om felet var vårt (slutprovet 2026-11-06, 3D Secure-kortet).
  if (e?.code === "payment_intent_authentication_failure") return TEXT_VERIFIERING;
  // Kort- och formulärfel har Stripes egen svenska text (locale "sv"): den säger vad som är fel.
  if (e && (e.type === "card_error" || e.type === "validation_error") && e.message) return e.message;
  return "Betalningen kunde inte genomföras just nu. Ingen betalning drogs. Försök igen om en stund.";
}
