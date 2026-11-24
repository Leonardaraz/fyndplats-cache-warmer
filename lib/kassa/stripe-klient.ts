// lib/kassa/stripe-klient.ts
//
// Kassasidans Stripe-del utan webbläsare: betalfältets inställningar, kundens
// sparade försök, väntan på ordern och vad sidan gör med serverns svar.
// Används av app/kassa/kassa.tsx och app/kassa/klar/tillbaka.tsx. Ren modul
// (bara typer importeras), så att node --test kan köra den.
//
// Flödet på sidan (servern: lib/kassa/flode.ts):
//   1. Betalfältet (Stripe Payment Element) visas direkt, utan PaymentIntent.
//   2. "Betala": elements.submit() FÖRST, i själva trycket (Stripe prövar
//      fälten innan betalningen skapas, och ett plånboksblad öppnas bara i ett
//      tryck), sedan /api/kassa/stripe/forbered, som också ger
//      faktureringsuppgifterna (faktureringAv i flode.ts).
//   3. stripe.confirmPayment med dem. Kortet stannar på sidan; Klarna går
//      till Klarna och kommer tillbaka via /api/kassa/stripe/retur.
//   4. /api/kassa/stripe/klar gör ordern (vantaPaOrder), och kunden går till /tack.
// Apple Pay och Google Pay har en egen väg överst på sidan: snabbkassan
// (lib/kassa/snabbkassa.ts), med samma steg 2–4.

import type { Appearance, StripeAddressElementOptions, StripeElementsOptionsMode, StripePaymentElementOptions } from "@stripe/stripe-js";

/** Måste vara samma som PaymentIntenten servern skapar (avsiktParametrar). Provat i stripe-klient.test.ts. */
export const STRIPE_VALUTA = "sek";
export const STRIPE_DRAGNING = "manual";

/**
 * Stripe.js: exakt den adress som loadStripe i @stripe/stripe-js/pure lägger in
 * (paketets "release train"). app/kassa/page.tsx förladdar den med sidan, så
 * att loadStripe tar filen ur webbläsarens minne i stället för att börja hämta
 * den (260 kB packad) först när kassan ritats. En annan adress hade hämtats i
 * onödan och sedan en gång till: provet i stripe-klient.test.ts kör paketets
 * egen loadStripe och fäller när paketet byter adress.
 */
export const STRIPE_JS = "https://js.stripe.com/basil/stripe.js";

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
    // Butikens Geist (elementsInstallningar lägger in filen från vår egen
    // server); systemets typsnitt om den inte hinner eller går att ladda.
    fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    // 16 px: iPhone zoomar annars in när ett fält får fokus.
    fontSizeBase: "16px",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    // 14 px in från kanten som kassans egna fält (.input i kassa.module.css):
    // med Stripes 12 px stod texten 2 px till vänster om e-post och mobil (audit 2026-11-06).
    ".Input": { border: "1.5px solid #d9cfc4", boxShadow: "none", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "14px", paddingRight: "14px" },
    ".Input:hover": { border: "1.5px solid #c9bcae" },
    ".Input:focus": { border: "1.5px solid #C2410C", boxShadow: "0 0 0 3px rgba(194, 65, 12, 0.18)" },
    ".Input--invalid": { border: "1.5px solid #D02020", boxShadow: "none" },
    ".AccordionItem": { border: "1.5px solid #EFE7DE", boxShadow: "none", padding: "16px" },
    ".AccordionItem--selected": { border: "1.5px solid #C2410C", boxShadow: "0 0 0 3px rgba(194, 65, 12, 0.08)" },
    ".Label": { fontWeight: "500" },
    // Etiketterna som kassans egna (.etikett): grå och normal vikt i ett tomt
    // fält, halvfet när den flyttat upp, röd när fältet är fel. Stripes stod
    // svarta och halvfeta och blev aldrig röda, så formuläret växlade stil fält
    // för fält (audit 2026-11-06; --invalid provad med Stripe.js samma kväll).
    ".Label--resting": { color: "#6b6157", fontWeight: "400" },
    ".Label--floating": { color: "#6b6157", fontWeight: "600" },
    ".Label--invalid": { color: "#D02020" },
    // Stripes felrader som kassans egna (.felText: 12 px, halvfet): när alla fel
    // visas på en gång stod Stripes i 14 px normal vikt bredvid (audit 2026-11-06).
    ".Error": { fontSize: "12px", fontWeight: "600", lineHeight: "1.45" },
  },
};

/**
 * Butikens Geist (latin, variabel 100–900, samma fil som next/font lägger ut)
 * på vår egen server, för Stripes ramar. Versionen står i namnet: filen cachas
 * ett år (next.config.ts), så en ny fil får ett nytt namn.
 */
export const TYPSNITT_FIL = "/fonts/geist-latin-v1.woff2";

/**
 * Elements utan PaymentIntent (den skapas först i trycket). Beloppet visas i
 * Apple Pay och styr Klarna.
 *
 * ☠️ Typsnittet kommer bara från vår egen server (`bas` är sidans origin),
 * aldrig från Google: butiken hämtar inga typsnitt därifrån. Utan `bas` (och
 * om filen inte går att ladda) ritas fälten med systemets typsnitt. Med det
 * stod Stripes fält i ett annat typsnitt än e-post, mobil och län i samma
 * formulär (audit 2026-11-06).
 */
export function elementsInstallningar(totalOre: number, bas?: string): StripeElementsOptionsMode {
  return {
    mode: "payment",
    amount: totalOre,
    currency: STRIPE_VALUTA,
    captureMethod: STRIPE_DRAGNING,
    locale: "sv",
    appearance: UTSEENDE,
    ...(bas ? { fonts: [{ family: "Geist", src: `url(${bas}${TYPSNITT_FIL})`, weight: "100 900", display: "swap" }] } : {}),
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
 *
 * Apple Pay och Google Pay står INTE här utan överst på sidan, i snabbkassan
 * (lib/kassa/snabbkassa.ts; Leonard 2026-11-06: "Jag vill att vi har apple pay
 * o google pay överst"). Där ger plånboken namn och adress, så kunden slipper
 * formuläret; här hade de stått en gång till.
 */
export const BETALFALT: StripePaymentElementOptions = {
  layout: { type: "accordion", defaultCollapsed: false, radios: true, spacedAccordionItems: true },
  paymentMethodOrder: ["card", "klarna"],
  fields: { billingDetails: "never" },
  wallets: { applePay: "never", googlePay: "never", link: "never" },
  business: { name: "Fyndplats" },
};

/** Det kassan redan vet om kunden (sparade uppgifter): adressfältet börjar med dem. */
export interface AdressStart {
  fornamn?: string;
  efternamn?: string;
  gata?: string;
  rad2?: string;
  postnr?: string;
  ort?: string;
}

/**
 * Adressfältet i steg 2 (Stripe Address Element; Leonard 2026-11-06: "när man
 * fyller i adress kommer automatiskt adresser upp som det gjorde i Wix kassa").
 * Googles adressförslag är gratis när fältet står i samma Elements som
 * betalfältet (Stripes egen Google-nyckel; uppmätt lokalt: förslaget fyller
 * gata, postnummer, postort och länet i `state`). Bara Sverige, förnamn och
 * efternamn var för sig som i kassans egna fält, inget telefonfält (kassan
 * frågar efter numret i steg 1). Etiketterna är Stripes ("Postort"), och
 * utseendet är betalfältets (UTSEENDE).
 */
export function adressfaltInstallningar(start: AdressStart = {}): StripeAddressElementOptions {
  const t = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
  return {
    mode: "shipping",
    allowedCountries: ["SE"],
    display: { name: "split" },
    autocomplete: { mode: "automatic" },
    fields: { phone: "never" },
    defaultValues: {
      firstName: t(start.fornamn),
      lastName: t(start.efternamn),
      address: {
        line1: t(start.gata),
        line2: t(start.rad2),
        city: t(start.ort),
        postal_code: t(start.postnr),
        country: "SE",
      },
    },
  };
}

/**
 * Står Stripes ram runt adressfältet still? Ramen börjar i mobilhöjd (201 px)
 * och glider efter "ready" till fältets höjd (133 px på datorn, där förnamn och
 * efternamn står bredvid varandra; uppmätt 2026-11-06, ungefär 300 ms). Den är
 * stilla när den är lika hög som fältets iframe. Okänd struktur (ingen ram
 * eller ingen iframe) räknas som stilla, så att kassan aldrig väntar på den.
 */
export function ramenStilla(ramHojd: number | null, iframeHojd: number | null): boolean {
  if (ramHojd === null || iframeHojd === null) return true;
  return Math.abs(ramHojd - iframeHojd) <= 1;
}

/** Så länge väntar platshållaren högst på att ramen ska stå still. */
export const RAM_VANTA_MS = 1000;

/**
 * Klarna-rutan på produktsidan. Klarnas egen ruta (OSM, components/klarna-osm.tsx)
 * visar villkoren i Leonards Klarna-avtal, som gäller i Wix kassa: "Betala
 * inom 30 eller 60 dagar" och delbetalning i 3–24 månader. I Stripe-kassan
 * betalar kunden med Stripes Klarna, som har andra villkor (30 dagar och
 * Stripes delbetalning). När Stripe-kassan är på för alla visar sidan därför
 * vår egen rad (components/klarna-message.tsx: "Betala med Klarna"),
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
  /** Kunden har fått veta varför försöket föll (sparatBeslut, "sag"): samma besked visas inte vid varje omladdning. */
  sagt?: true;
}

/** Kundens sparade försök, om det gäller den här korgen och inte är för gammalt: betalningens id, försökets ålder och om kunden redan fått veta varför det föll. */
export function sparatForsok(v: unknown, cartId: string, nuMs: number): { avsiktId: string; alderMs: number; sagt: boolean } | null {
  if (!v || typeof v !== "object" || !cartId) return null;
  const s = v as Partial<SparadAvsikt>;
  if (typeof s.avsiktId !== "string" || !AVSIKT_ID.test(s.avsiktId)) return null;
  if (s.cartId !== cartId || typeof s.at !== "number" || !Number.isFinite(s.at)) return null;
  if (nuMs - s.at > SPARAD_MS || s.at - nuMs > 60_000) return null;
  return { avsiktId: s.avsiktId, alderMs: Math.max(0, nuMs - s.at), sagt: s.sagt === true };
}

/** Betalningens id ur kundens sparade försök, om det gäller den här korgen och inte är för gammalt. */
export function sparadAvsikt(v: unknown, cartId: string, nuMs: number): string | null {
  return sparatForsok(v, cartId, nuMs)?.avsiktId ?? null;
}

export type KlarBeslut =
  | { gor: "tack"; orderId: string }
  | { gor: "vanta" }
  /** Kunden har betalningen öppen hos Klarna: `adress` är där samma betalning fortsätter (null när den inte går att fortsätta härifrån). */
  | { gor: "fortsatt"; adress: string | null; hosKlarna: boolean; totalOre: number | null }
  | { gor: "fel"; kod: string; meddelanden: string[]; orsak?: string };

/** Dit kunden får skickas för att fortsätta en påbörjad betalning: Stripes omdirigering, och Klarna. */
const FORTSATT_VARD = /(^|\.)(stripe\.com|klarna\.com)$/;

/**
 * Adressen där en öppen betalning fortsätter (next_action.redirect_to_url ur
 * serverns svar), om den är https hos Stripe eller Klarna. Annars null: sidan
 * skickar aldrig kunden till en adress den inte känner igen.
 */
export function fortsattAdress(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 2000) return null;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  return FORTSATT_VARD.test(u.hostname) ? u.href : null;
}

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
  if (s.kod === "vantar_kund") {
    const t = s as { fortsatt?: unknown; metod?: unknown; totalOre?: unknown };
    return {
      gor: "fortsatt",
      adress: fortsattAdress(t.fortsatt),
      hosKlarna: t.metod === "klarna",
      totalOre: typeof t.totalOre === "number" && Number.isSafeInteger(t.totalOre) && t.totalOre > 0 ? t.totalOre : null,
    };
  }
  const meddelanden = Array.isArray(s.meddelanden) ? s.meddelanden.filter((m): m is string => typeof m === "string" && m.length > 0) : [];
  const orsak = (s as { orsak?: unknown }).orsak;
  return {
    gor: "fel",
    kod: typeof s.kod === "string" ? s.kod : "fel",
    meddelanden: meddelanden.length ? meddelanden : [TEXT_FEL],
    ...(typeof orsak === "string" ? { orsak } : {}),
  };
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

/**
 * Hur kunden kom tillbaka, som ett ord för loggen: Stripes redirect_status
 * ("succeeded", "failed"), eller att den eller betalningens id saknades.
 * Bara små bokstäver och understreck ur adressen, aldrig ett id.
 */
export function returLage(sok: URLSearchParams): string {
  if (!AVSIKT_ID.test(sok.get("payment_intent") ?? "")) return "utan betalning";
  const status = (sok.get("redirect_status") ?? "").slice(0, 30);
  return /^[a-z_]+$/.test(status) ? status : "utan status";
}

/**
 * Webbläsarens sort som ett ord för loggen: systemet och webbläsaren, eller
 * appen som visar sidan själv (Instagram, Facebook, Google-appen). Aldrig hela
 * User-Agent, som kan peka ut en enskild telefon.
 *
 * En betalning som ska fram och tillbaka mellan butiken och Klarnas eller
 * bankens app beter sig olika i en vanlig webbläsare och i en app med egen
 * webbvy. ☠️ När en kund fick börja om efter Klarna-appen (2026-11-24) gick
 * det inte att se i loggen vilken sorts webbläsare han satt i.
 */
export function webblasarsort(ua: string | null | undefined): string {
  const u = typeof ua === "string" ? ua.slice(0, 600) : "";
  const system = /iPhone|iPad|iPod/.test(u) ? "ios" : /Android/.test(u) ? "android" : /Macintosh|Windows NT|X11|CrOS/.test(u) ? "dator" : "okant";
  const app = /FBAN|FBAV|FB_IAB/.test(u)
    ? "facebook"
    : /Instagram/.test(u)
      ? "instagram"
      : /TikTok|musical_ly|BytedanceWebview/.test(u)
        ? "tiktok"
        : /Snapchat/.test(u)
          ? "snapchat"
          : /\bGSA\//.test(u)
            ? "googleappen"
            : /Klarna/.test(u)
              ? "klarnaappen"
              : /; wv\)/.test(u)
                ? "webbvy"
                : null;
  if (app) return `${system}-${app}`;
  // Ordningen spelar roll: Edge och Opera säger också "Chrome", och Chrome säger också "Safari".
  const webblasare = /EdgiOS|EdgA|Edg\//.test(u)
    ? "edge"
    : /OPR\/|OPT\//.test(u)
      ? "opera"
      : /SamsungBrowser/.test(u)
        ? "samsung"
        : /FxiOS|Firefox\//.test(u)
          ? "firefox"
          : /CriOS|Chrome\//.test(u)
            ? "chrome"
            : /Safari\//.test(u)
              ? "safari"
              : // På iOS är en sida utan "Safari" i sin User-Agent en webbvy i någon app.
                system === "ios" && /AppleWebKit/.test(u)
                ? "webbvy"
                : "annan";
  return `${system}-${webblasare}`;
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
  nekad: "Klarna godkände inte betalningen, och inget har dragits. Välj ett annat betalsätt eller försök igen.",
  utgangen: "Betalningen hos Klarna hann gå ut innan den blev klar, och inget har dragits. Välj ett betalsätt och försök igen.",
  pris_andrat: "Priset ändrades medan du betalade. Ingen betalning drogs. Kontrollera beställningen och försök igen.",
  slut: "En vara tog slut medan du betalade. Ingen betalning drogs. Kontrollera varukorgen och försök igen.",
  fel: TEXT_FEL,
};

/**
 * Kassans kod för en betalning som inte blev en order. ej_betald betyder att
 * kunden avbröt, om inte servern vet bättre (`orsak`: Klarna nekade, eller
 * betalningen gick ut).
 */
export function tillbakaKod(kod: string, orsak?: unknown): string {
  if (kod === "ej_betald") return orsak === "nekad" || orsak === "utgangen" ? orsak : "avbruten";
  // Egen egenskap, inte `in`: "constructor" och "__proto__" finns på varje objekt.
  // hasOwnProperty.call och inte Object.hasOwn, som saknas i Safari före 15.4 (butiken stöder iOS 14).
  return Object.prototype.hasOwnProperty.call(STRIPE_MEDDELANDE, kod) ? kod : "fel";
}

/** Texten för ?stripe=<kod> på /kassa. Koden kommer ur adressen, så bara kända koder ger sin text. */
export function stripeMeddelande(kod: string | null): string | null {
  if (!kod) return null;
  return STRIPE_MEDDELANDE[tillbakaKod(kod)];
}

/** Ett försök som föll för så här länge sedan förklaras inte längre: kunden har gått vidare. */
export const FARSKT_FORSOK_MS = 30 * 60 * 1000;

/** Vad kassan gör med kundens sparade försök när sidan visas. */
export type SparatBeslut =
  | { gor: "tack"; orderId: string }
  /** Betald och på väg att bli en order (webhooken håller på): sidan väntar på den. */
  | { gor: "slutfor" }
  /** Öppen hos Klarna: kassan säger det och låter kunden fortsätta samma betalning. */
  | { gor: "oppen"; adress: string | null; hosKlarna: boolean; totalOre: number | null }
  /** Klarna-försöket föll nyss: säg varför, en gång. */
  | { gor: "sag"; text: string }
  | { gor: "inget" };

/**
 * Kundens sparade försök mot serverns svar (/api/kassa/stripe/klar), när
 * kassan laddas, kommer tillbaka ur webbläsarens minne eller blir synlig igen.
 *
 * ☠️ Förut gjorde kassan ingenting med ett försök som inte var betalt. En kund
 * som godkänt med BankID i Klarna-appen och gick tillbaka till butiken fick
 * formuläret igen utan ett ord, tre gånger i rad, och köpte till slut från
 * datorn (2026-11-24). Nu säger kassan vad som gäller: betalningen står öppen
 * hos Klarna och går att fortsätta ("oppen"), eller Klarna sa nej ("sag").
 */
export function sparatBeslut(svar: KlarSvar, forsok: { alderMs: number; sagt: boolean }): SparatBeslut {
  const b = klarBeslut(svar.status, svar.j);
  if (b.gor === "tack") return b;
  if (svar.status === 202) return { gor: "slutfor" };
  if (b.gor === "fortsatt") return { gor: "oppen", adress: b.adress, hosKlarna: b.hosKlarna, totalOre: b.totalOre };
  if (b.gor === "fel" && b.kod === "ej_betald" && b.orsak && !forsok.sagt && forsok.alderMs <= FARSKT_FORSOK_MS) {
    return { gor: "sag", text: STRIPE_MEDDELANDE[tillbakaKod(b.kod, b.orsak)] };
  }
  return { gor: "inget" };
}

/**
 * Rutan för en betalning som står öppen hos Klarna: i kassan ("kassa", med
 * betalsätten under) och på sidan kunden kommer tillbaka till ("retur").
 * ☠️ Knappen heter aldrig "Fortsätt till Klarna" (CLAUDE.md, Stripe-kassan):
 * den säger att det är betalningen som slutförs.
 */
export function oppenText(o: { hosKlarna: boolean; kanFortsatta: boolean; plats: "kassa" | "retur" }): { rubrik: string; text: string; knapp: string } {
  const annat = o.plats === "kassa" ? "välj ett betalsätt längre ner och betala på nytt" : "gå tillbaka till kassan och välj ett annat betalsätt";
  return {
    rubrik: o.hosKlarna ? "Din Klarna-betalning är inte klar" : "Din betalning är inte klar",
    text: o.kanFortsatta
      ? `Inget har dragits. Fortsätt där du var${o.hosKlarna ? " hos Klarna" : ""}, eller ${annat}.`
      : `Inget har dragits. ${annat.charAt(0).toUpperCase()}${annat.slice(1)}.`,
    knapp: o.hosKlarna ? "Slutför betalningen hos Klarna" : "Slutför betalningen",
  };
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
