// lib/kassa/snabbkassa.ts
//
// Snabbkassan överst på /kassa (Leonard 2026-11-06: "Jag vill att vi har apple
// pay o google pay överst"): Stripes Express Checkout Element med Apple Pay och
// Google Pay. Plånboken ger namn, e-post, telefon och leveransadress, så
// kunden slipper formuläret. Betalfältet i steg 3 visar då bara kort och
// Klarna (BETALFALT i stripe-klient.ts), så att plånböckerna inte står två gånger.
//
// Flödet på sidan (app/kassa/kassa.tsx, app/kassa/use-stripe-betalning.ts):
//   1. Knapparna står i en EGEN Elements-grupp. Betalfältets grupp har
//      adressfältet och betalfältet, som är tomma när kunden betalar med
//      plånboken, och elements.submit() prövar varje fält i sin grupp.
//   2. Trycket ("click"): bladet öppnas med raderna och frakten (klickSvar).
//      Stripe kräver svaret inom en sekund, så inget nätverksanrop där.
//   3. Kunden godkänner i bladet ("confirm", snabbBekrafta): plånbokens
//      uppgifter blir kassans formulär (kundFranPlanbok i formular.ts) och
//      prövas som det, sedan samma /api/kassa/stripe/forbered och samma
//      slutförande som betalfältet. Ett fel före bekräftelsen visas i bladet
//      (paymentFailed), så att kunden kan rätta adressen där.
//
// ☠️ BELOPPET I BLADET ÄR ELEMENTS-BELOPPET, alltså Wix total MED frakt. Raderna
// och fraktvalet är bara visning, men de ska summera till totalen
// (snabbRader), annars ser kunden två olika summor i samma blad.
//
// ☠️ SERVERN SÄTTER INGEN LEVERANSADRESS PÅ BETALNINGEN (avsiktParametrar i
// flode.ts): plånboken skickar sin vid bekräftelsen, precis som adressfältet.
//
// Ren modul (bara typer importeras), så att node --test kan köra den.

import type {
  AvailablePaymentMethods,
  ClickResolveDetails,
  LineItem,
  ShippingRate,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
} from "@stripe/stripe-js";
import type { Falt, KassaProv, KassaVarden, PlanbokVarde } from "./formular";

/** Knapparnas höjd i px (Stripe tillåter 40–55): nära fältens 56 px. */
export const SNABB_HOJD = 52;

/** Högst så många varor står var för sig i bladet; fler blir en rad. */
export const SNABB_MAX_RADER = 6;

/** Fraktvalets id i bladet. Det finns bara ett, Wix räknar frakten. */
export const FRAKT_ID = "standard";

const NAMN_MAX = 60;

/** Det kunden ser i summeringen när hen trycker: raderna och Wix räkning, i öre. */
export interface Sammandrag {
  rader: { namn: string; antal: number; radOre: number | null }[];
  delsummaOre: number;
  rabattOre: number;
  kupong: string | null;
  fraktOre: number;
  fraktnamn: string | null;
  totalOre: number;
  /** Leveranstiden i arbetsdagar (lib/shipping.ts). */
  dagar: { min: number; max: number };
}

const kortNamn = (t: string): string => {
  const s = t.replace(/\s+/g, " ").trim() || "Vara";
  return s.length > NAMN_MAX ? `${s.slice(0, NAMN_MAX - 1).trimEnd()}…` : s;
};

const summa = (l: readonly LineItem[]) => l.reduce((n, x) => n + x.amount, 0);

/**
 * Raderna i bladet. Varje vara för sig när de är få och deras summor går
 * jämnt upp med Wix delsumma; annars en rad med alla varor. Rabatten är en
 * negativ rad. Raderna plus frakten är alltid totalen.
 */
export function snabbRader(s: Sammandrag): LineItem[] {
  const varorOre = s.totalOre - s.fraktOre;
  if (!Number.isInteger(s.totalOre) || s.totalOre <= 0 || !Number.isInteger(varorOre) || varorOre < 0) return [];
  const rabatt: LineItem[] = s.rabattOre > 0 ? [{ name: kortNamn(s.kupong ? `Rabatt (${s.kupong})` : "Rabatt"), amount: -s.rabattOre }] : [];
  const rader = s.rader.filter((r) => r.antal > 0);
  const antal = rader.reduce((n, r) => n + r.antal, 0);
  const allaKanda = rader.every((r) => typeof r.radOre === "number" && Number.isInteger(r.radOre) && r.radOre >= 0);
  if (rader.length > 0 && rader.length <= SNABB_MAX_RADER && allaKanda) {
    const varje = rader.map((r) => ({ name: kortNamn(r.antal > 1 ? `${r.antal} × ${r.namn}` : r.namn), amount: r.radOre as number }));
    if (summa(varje) + summa(rabatt) === varorOre) return [...varje, ...rabatt];
  }
  const namn = antal > 0 ? `Varor (${antal} st)` : "Varor";
  if (s.delsummaOre + summa(rabatt) === varorOre) return [{ name: namn, amount: s.delsummaOre }, ...rabatt];
  return [{ name: namn, amount: varorOre }];
}

/** Fraktvalet i bladet: Wix frakt för korgen och leveranstiden i arbetsdagar. */
export function fraktval(s: Sammandrag): ShippingRate[] {
  return [
    {
      id: FRAKT_ID,
      displayName: (s.fraktnamn && s.fraktnamn.trim()) || "Spårbar standardleverans",
      amount: Math.max(0, s.fraktOre),
      deliveryEstimate: {
        minimum: { unit: "business_day", value: s.dagar.min },
        maximum: { unit: "business_day", value: s.dagar.max },
      },
    },
  ];
}

/** Svaret på trycket: det bladet visar. Inom en sekund, så bara det sidan redan vet. */
export function klickSvar(s: Sammandrag): ClickResolveDetails {
  return { lineItems: snabbRader(s), shippingRates: fraktval(s) };
}

/**
 * Knapparna. Bara Apple Pay och Google Pay: Link, PayPal och Amazon Pay har vi
 * inte, och Klarna står i betalfältet, sist och aldrig förvalt
 * (betaltjänstlagen, se BETALFALT). Plånboken frågar efter e-post, telefon
 * (transportören aviserar) och en svensk leveransadress.
 *
 * Google Pay står på "always" utanför Apples webbläsare (Leonard 2026-11-14).
 * Med "auto" visar Stripe knappen bara för den som redan har ett kort sparat
 * hos Google: kassan på www visade då ingen knapp alls i Chrome, och svaret kom
 * efter 12 s. Med "always" kom knappen på 3–4 s i samma webbläsare, och den som
 * saknar kort hos Google lägger in det i Googles eget blad.
 *
 * ☠️ I Apples webbläsare (planbok "apple") står Google Pay kvar på "auto".
 * Stripe visar Google Pay i Safari och på iPhone bara med "always", och då hade
 * det stått TVÅ knappar där platsen som hålls rymmer en: formuläret hade
 * knuffats ned när Stripe svarade.
 *
 * Apple Pay står på "always" i Apples webbläsare (Leonard 2026-11-15). Med
 * "auto" visar Stripe knappen bara när plånboken har ett kort: på Leonards
 * iPhone utan kort syntes platshållaren en halv sekund och försvann sedan,
 * medan ett privat fönster visade knappen (där berättar Safari inte om korten).
 * Med "always" syns knappen på varje enhet som klarar Apple Pay, och den som
 * saknar kort lägger in det i Apples eget blad. Stripe visar den ändå aldrig
 * där Apple Pay inte går att använda, och bara där sparas ett svar utan
 * plånbok. ☠️ Utanför Apples webbläsare står Apple Pay kvar på "auto": med
 * "always" visar Stripe Apple Pay också i Chrome på Mac, bredvid Google Pay,
 * och två knappar ryms inte i platsen som hålls.
 */
export function snabbknappar(s: Sammandrag | null, planbok: PlanbokGissning): StripeExpressCheckoutElementOptions {
  return {
    paymentMethods: {
      applePay: planbok === "apple" ? "always" : "auto",
      googlePay: planbok === "apple" ? "auto" : "always",
      link: "never",
      paypal: "never",
      amazonPay: "never",
      klarna: "never",
    },
    paymentMethodOrder: ["apple_pay", "google_pay"],
    buttonType: { applePay: "buy", googlePay: "buy" },
    buttonTheme: { applePay: "black", googlePay: "black" },
    buttonHeight: SNABB_HOJD,
    // En knapp per rad, alla synliga. ☠️ overflow "never" bara med maxRows 0:
    // annars kastar Stripe IntegrationError och inga knappar ritas (lokalt prov 2026-11-06).
    layout: { maxColumns: 1, maxRows: 0, overflow: "never" },
    emailRequired: true,
    phoneNumberRequired: true,
    shippingAddressRequired: true,
    allowedShippingCountries: ["SE"],
    billingAddressRequired: false,
    business: { name: "Fyndplats" },
    ...(s ? klickSvar(s) : {}),
  };
}

export type Planbok = "apple_pay" | "google_pay";

/** Plånböckerna knapparna visar (händelsen "ready"); tom när ingen finns. */
export function planbocker(a: AvailablePaymentMethods | null | undefined): Planbok[] {
  if (!a) return [];
  const ut: Planbok[] = [];
  if (a.applePay) ut.push("apple_pay");
  if (a.googlePay) ut.push("google_pay");
  return ut;
}

/** "Apple Pay", "Google Pay" eller "Apple Pay eller Google Pay". */
export function planbokNamn(p: readonly Planbok[]): string {
  const namn = p.map((x) => (x === "apple_pay" ? "Apple Pay" : "Google Pay"));
  return namn.length ? namn.join(" eller ") : "Apple Pay eller Google Pay";
}

/** Plånboken som webbläsaren väntas visa, innan Stripe har svarat. */
export type PlanbokGissning = "apple" | "google" | "ingen";

// Androids inbyggda webbläsare i appar (WebView) har märket "; wv)" i sitt namn.
const WEBVIEW = /; wv\)/;

/**
 * Vilken plånbok kommer Stripe att visa? Gissningen styr tre saker medan Stripe
 * svarar: om platsen för knapparna hålls, hur platshållaren ser ut och vilket
 * namn texten nämner.
 *
 * - "apple": webbläsaren har ApplePaySession (Safari, och alla webbläsare på
 *   iPhone). Stripe svarar snabbt och visar nästan alltid Apple Pay.
 * - "google": alla andra webbläsare. Med Google Pay på "always" (snabbknappar)
 *   visade Stripe knappen på 3–4 s i Chrome på dator och på Android, också när
 *   PaymentRequest togs bort ur webbläsaren (mätt 2026-11-14 på en provsida
 *   under www.fyndplats.se med kassans egna inställningar).
 * - "ingen": en inbyggd webbläsare i en app på Android, som den som trycker på
 *   en annons i Instagram, Facebook eller TikTok hamnar i. Där svarade Stripe
 *   utan plånbok efter cirka 3 s, både med "always" och med "auto" (samma
 *   mätning, med apparnas namn på webbläsaren). Ingen plats hålls: annars
 *   försvann rutan efter tre sekunder och formuläret hoppade upp under kunden.
 *
 * Förut hölls platsen bara där Apple Pay finns: med "auto" tog Stripes kontroll
 * av Google Pay 12–13 s och slutade nästan alltid utan knapp.
 */
export function planbokGissning(f: { applePaySession: boolean; userAgent: string }): PlanbokGissning {
  if (f.applePaySession) return "apple";
  return WEBVIEW.test(f.userAgent) ? "ingen" : "google";
}

/** Gissningen ur webbläsaren själv. Bara i webbläsaren: kassans effekter och knapparna. */
export function webblasarensPlanbok(): PlanbokGissning {
  return planbokGissning({ applePaySession: "ApplePaySession" in window, userAgent: window.navigator.userAgent });
}

/**
 * ☠️ MINNET (2026-11-15). Svarade Stripe att ingen plånbok finns, till exempel
 * för att en blockerare stoppar Googles betalskript eller för att Apple Pay
 * saknar kort, sparar webbläsaren det i 30 dygn (PLANBOK_MINNE). Nästa gång
 * hålls ingen plats: formuläret står kvar där det ritades. Förut hölls platsen
 * varje gång och släpptes efter 3–4 s, och formuläret hoppade upp 236 px
 * (mätt 2026-11-14 med Googles skript stoppat). Knapparna monteras ändå: visar
 * Stripe en knapp en senare gång glöms utfallet direkt (minnsStripesSvar).
 * Bara ett uttryckligt svar utan plånbok sparas, aldrig tidsgränsen eller ett
 * fel att ladda: ett segt nät ska inte ta bort knapparna i en månad.
 */
export const PLANBOK_MINNE = "fp_planbok_tom";

/** Hur länge ett svar utan plånbok minns: 30 dygn. */
export const PLANBOK_MINNE_MS = 30 * 24 * 60 * 60 * 1000;

/** Det som sparas när Stripe svarade utan plånbok: gissningen och tiden (ms). */
export function planbokMinne(gissning: "apple" | "google", nuMs: number): string {
  return `${gissning}:${Math.floor(nuMs)}`;
}

/** Minns webbläsaren att Stripe svarade utan plånbok, för samma gissning och inom 30 dygn? */
export function minnsUtanPlanbok(varde: string | null | undefined, gissning: PlanbokGissning, nuMs: number): boolean {
  if (!varde || gissning === "ingen") return false;
  const m = /^(apple|google):(\d{1,16})$/.exec(varde);
  if (!m || m[1] !== gissning) return false;
  const alder = nuMs - Number(m[2]);
  return alder >= 0 && alder < PLANBOK_MINNE_MS;
}

/** Läget platsen ritas i: gissningen, utom när webbläsaren minns ett svar utan plånbok. */
export function planbokPlats(gissning: PlanbokGissning, minne: string | null | undefined, nuMs: number): PlanbokGissning {
  return minnsUtanPlanbok(minne, gissning, nuMs) ? "ingen" : gissning;
}

/** Lagringen kan saknas eller kasta (privat läge, spärrad lagring): då minns ingenting. */
function lasPlanbokMinne(): string | null {
  try {
    return window.localStorage.getItem(PLANBOK_MINNE);
  } catch {
    return null;
  }
}

/** Platsens läge i webbläsaren, med minnet: samma svar som PLANBOK_SKRIPT ger <html>. */
export function webblasarensPlanbokPlats(): PlanbokGissning {
  return planbokPlats(webblasarensPlanbok(), lasPlanbokMinne(), Date.now());
}

/**
 * Stripe har svarat ("ready"). Utan plånbok sparas utfallet, med plånbok glöms
 * det. <html> får samma läge direkt, så att en kassa som öppnas igen med ett
 * mjukt sidbyte inte håller platsen en bildruta innan effekten hunnit köra.
 */
export function minnsStripesSvar(hittade: readonly Planbok[]): void {
  try {
    const g = webblasarensPlanbok();
    if (hittade.length > 0) window.localStorage.removeItem(PLANBOK_MINNE);
    else if (g !== "ingen") window.localStorage.setItem(PLANBOK_MINNE, planbokMinne(g, Date.now()));
    document.documentElement.setAttribute("data-planbok", hittade.length > 0 ? g : "ingen");
  } catch {
    // Utan lagring hålls platsen som förut.
  }
}

/**
 * Samma gissning före första ritningen: app/layout.tsx kör skriptet innan något
 * syns, och det sätter data-planbok="apple", "google" eller "ingen" på <html>.
 * Kassans CSS håller då ingen plats i läget "ingen", ritar rätt platshållare och
 * visar rätt namn i texten, både innan React tagit över och vid ett mjukt sidbyte
 * från varukorgen (då körs effekten med webblasarensPlanbokPlats först efter att
 * sidan ritats). Utan skriptet syntes platsen tills React tog över, och sedan
 * hoppade formuläret upp. Skriptet läser också minnet (PLANBOK_MINNE): minns
 * webbläsaren ett svar utan plånbok blir läget "ingen". Proven kör skriptet mot
 * planbokGissning och planbokPlats, så att de aldrig svarar olika.
 */
export const PLANBOK_SKRIPT = `try{var g='ApplePaySession' in window?'apple':${WEBVIEW}.test(window.navigator.userAgent)?'ingen':'google',m=null;try{m=window.localStorage.getItem('${PLANBOK_MINNE}')}catch(e){}var x=g!=='ingen'&&m?/^(apple|google):(\\d{1,16})$/.exec(m):null;if(x&&x[1]===g){var a=Date.now()-Number(x[2]);if(a>=0&&a<${PLANBOK_MINNE_MS})g='ingen'}document.documentElement.setAttribute('data-planbok',g)}catch(e){}`;

type Orsak = NonNullable<Parameters<StripeExpressCheckoutElementConfirmEvent["paymentFailed"]>[0]>["reason"];

/** Plånbokens fel, med kundens ord. Kunden rättar i Apple Pay eller Google Pay, inte i formuläret. */
export const PLANBOK_TEXT: Partial<Record<Falt, string>> = {
  epost: "Plånboken gav ingen giltig e-postadress. Lägg till en och försök igen.",
  telefon: "Plånboken gav inget mobilnummer som transportören kan avisera till. Lägg till ett och försök igen.",
  fornamn: "Leveransadressen saknar namn. Skriv för- och efternamn och försök igen.",
  efternamn: "Leveransadressen saknar efternamn. Skriv för- och efternamn och försök igen.",
  gata: "Leveransadressen saknar gatuadress. Lägg till den och försök igen.",
  rad2: "En adressrad är för lång (högst 60 tecken).",
  postnr: "Postnumret i leveransadressen ser inte svenskt ut. Kontrollera det och försök igen.",
  ort: "Leveransadressen saknar ort. Lägg till den och försök igen.",
};

/** Ordningen felen visas i: samma som formulärets. */
const ORDNING: readonly Falt[] = ["epost", "telefon", "fornamn", "efternamn", "gata", "rad2", "co", "postnr", "ort", "lan", "kupong"];

/** Det första felet i plånbokens uppgifter, med orsaken Stripe visar i bladet. */
export function planbokFel(fel: Partial<Record<Falt, string>>): { orsak: Orsak; text: string } {
  const f = ORDNING.find((x) => Boolean(fel[x]));
  if (f === "kupong") return { orsak: "fail", text: fel.kupong ?? "Rabattkoden gäller inte." };
  // E-post och telefon hör till leveranskontakten i Apple Pay: där rättar kunden dem.
  return { orsak: "invalid_shipping_address", text: (f && (PLANBOK_TEXT[f] ?? fel[f])) || "Kontrollera leveransadressen och försök igen." };
}

/** Händelsen "confirm" som snabbBekrafta läser den. */
export type PlanbokHandelse = PlanbokVarde & Pick<StripeExpressCheckoutElementConfirmEvent, "paymentFailed">;

/** Stripes fel som sidan visar (betalfelText i stripe-klient.ts). */
export interface StripeFelLik {
  type?: string;
  code?: string;
  message?: string;
}

export interface SnabbDeps {
  /** elements.submit() på snabbkassans grupp. */
  submit(): Promise<{ error?: StripeFelLik }>;
  /** Plånbokens uppgifter prövade som kassans formulär: provaKassa(kundFranPlanbok(…)). */
  prova(h: PlanbokVarde): KassaProv;
  /** POST /api/kassa/stripe/forbered. Status 0 när nätet felade. */
  forbered(kund: KassaVarden): Promise<{ status: number; j: unknown }>;
  /** Betalningens id sparas före bekräftelsen, som i betalfältet (STRIPE_NYCKEL). */
  spara(avsiktId: string): void;
  /** Beloppet knapparna visar just nu (öre). */
  visat(): number | null;
  /** stripe.confirmPayment med snabbkassans grupp. */
  bekrafta(clientSecret: string): Promise<{ error?: StripeFelLik; status?: string }>;
  /** Kundens text för Stripes fel (betalfelText). */
  felText(e: StripeFelLik | null): string;
  /** Väntans steg: 0 pris och lager, 1 godkänner betalningen. */
  steg?(n: 0 | 1): void;
}

export type SnabbUtfall =
  /** Betalningen är godkänd (eller var det redan): sidan slutför ordern. */
  | { gor: "slutfor"; avsiktId: string }
  /** Ingen betalning. `falt` när felet sitter i rabattkoden eller postnumret. */
  | { gor: "fel"; text: string; falt?: "kupong" | "postnr" }
  /** Wix räknade en annan total än knapparna visade: kunden trycker igen på den nya. */
  | { gor: "belopp"; totalOre: number; text: string };

const AVSIKT_ID = /^pi_[A-Za-z0-9]+$/;
const TEXT_FEL = "Något gick fel. Ingen betalning drogs. Försök igen om en stund.";
const TEXT_NAT = "Ingen kontakt med kassan. Ingen betalning drogs. Kontrollera uppkopplingen och försök igen.";
const TEXT_REDAN = "Den här beställningen är redan betald.";
const TEXT_EJ_GODKAND = "Betalningen godkändes inte. Ingen betalning drogs. Försök igen eller välj ett annat betalsätt.";
const TEXT_UTLAND = "Vi levererar bara inom Sverige. Välj en svensk leveransadress.";

/** "1 299 kr", "94,90 kr": som kassan skriver belopp. */
export function kronor(ore: number): string {
  const hela = Math.floor(Math.abs(ore) / 100);
  const oren = Math.abs(ore) % 100;
  const grupp = String(hela).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${ore < 0 ? "−" : ""}${grupp}${oren ? `,${String(oren).padStart(2, "0")}` : ""} kr`;
}

interface ForberedSvar {
  ok?: unknown;
  avsiktId?: unknown;
  clientSecret?: unknown;
  totalOre?: unknown;
  redanBetald?: unknown;
  fel?: unknown;
  falt?: unknown;
  meddelanden?: unknown;
}

/** Serverns nej (lib/kassa/flode.ts forberedStripe) som orsak och text för bladet. */
export function forberedFel(status: number, s: ForberedSvar): { orsak: Orsak; text: string; falt?: "kupong" | "postnr" } {
  if (status === 0) return { orsak: "fail", text: TEXT_NAT };
  const forsta = Array.isArray(s.meddelanden) ? s.meddelanden.find((m): m is string => typeof m === "string" && m.length > 0) : undefined;
  if (s.fel && typeof s.fel === "object") return planbokFel(s.fel as Partial<Record<Falt, string>>);
  if (s.falt === "postnr") return { orsak: "address_unserviceable", text: forsta ?? "Vi kan inte leverera till den adressen.", falt: "postnr" };
  if (s.falt === "kupong") return { orsak: "fail", text: forsta ?? "Rabattkoden gäller inte.", falt: "kupong" };
  return { orsak: "fail", text: forsta ?? TEXT_FEL };
}

/**
 * Kunden har godkänt i Apple Pay eller Google Pay. Samma väg som betalfältet:
 * plånbokens uppgifter prövas som formuläret, servern förbereder korgen och
 * betalningen på Wix total, och bekräftelsen görs med plånbokens betalning.
 * Bladet får ett fel (paymentFailed) när inget har bekräftats; efter
 * bekräftelsen stänger Stripe bladet själv.
 */
export async function snabbBekrafta(deps: SnabbDeps, h: PlanbokHandelse): Promise<SnabbUtfall> {
  let inskickat: { error?: StripeFelLik };
  try {
    inskickat = await deps.submit();
  } catch {
    inskickat = { error: {} };
  }
  if (inskickat.error) {
    const text = deps.felText(inskickat.error);
    h.paymentFailed({ reason: "fail", message: text });
    return { gor: "fel", text };
  }
  const land = h.shippingAddress?.address?.country;
  if (land && land !== "SE") {
    h.paymentFailed({ reason: "address_unserviceable", message: TEXT_UTLAND });
    return { gor: "fel", text: TEXT_UTLAND };
  }
  const prov = deps.prova(h);
  if (!prov.ok) {
    const f = planbokFel(prov.fel);
    h.paymentFailed({ reason: f.orsak, message: f.text });
    return { gor: "fel", text: f.text };
  }

  deps.steg?.(0);
  let svar: { status: number; j: unknown };
  try {
    svar = await deps.forbered(prov.varden);
  } catch {
    svar = { status: 0, j: null };
  }
  const s: ForberedSvar = svar.j && typeof svar.j === "object" ? (svar.j as ForberedSvar) : {};
  if (svar.status !== 200 || s.ok !== true || typeof s.avsiktId !== "string" || !AVSIKT_ID.test(s.avsiktId)) {
    const f = forberedFel(svar.status, s);
    h.paymentFailed({ reason: f.orsak, message: f.text });
    return f.falt ? { gor: "fel", text: f.text, falt: f.falt } : { gor: "fel", text: f.text };
  }
  deps.spara(s.avsiktId);
  if (s.redanBetald === true) {
    // Betald i ett tidigare försök (annan flik, omladdning): ingen ny betalning.
    h.paymentFailed({ reason: "fail", message: TEXT_REDAN });
    return { gor: "slutfor", avsiktId: s.avsiktId };
  }
  if (typeof s.clientSecret !== "string" || !s.clientSecret || typeof s.totalOre !== "number") {
    h.paymentFailed({ reason: "fail", message: TEXT_FEL });
    return { gor: "fel", text: TEXT_FEL };
  }
  // Wix räknade fram en annan total än den kunden godkände i bladet: ingen
  // betalning på ett belopp kunden inte sett.
  if (s.totalOre !== deps.visat()) {
    const text = `Att betala är nu ${kronor(s.totalOre)}. Kontrollera beställningen och tryck på knappen igen.`;
    h.paymentFailed({ reason: "fail", message: text });
    return { gor: "belopp", totalOre: s.totalOre, text };
  }

  deps.steg?.(1);
  let bekraftat: { error?: StripeFelLik; status?: string };
  try {
    bekraftat = await deps.bekrafta(s.clientSecret);
  } catch {
    return { gor: "fel", text: deps.felText(null) };
  }
  if (bekraftat.error) return { gor: "fel", text: deps.felText(bekraftat.error) };
  if (bekraftat.status === "requires_capture" || bekraftat.status === "succeeded" || bekraftat.status === "processing") {
    return { gor: "slutfor", avsiktId: s.avsiktId };
  }
  return { gor: "fel", text: TEXT_EJ_GODKAND };
}
