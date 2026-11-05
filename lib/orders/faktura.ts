// Fakturan och kvittot för en order som betalas mot faktura.
//
// Leonard 2026-10-09: *"Fixa så att när vi godkänner skickas vår egen mall ut
// och inget från wix"* och sedan, om fakturan och kvittot: *"allt ska vårt
// eget"*. Wix automationer "Send invoice to customer" och "Send a receipt email"
// är avstängda samma dag, och de här två mejlen ersätter dem.
//
// Vilka ordrar det gäller: en order som lagts upp för hand i Wix
// (`channelInfo.type: BACKOFFICE_MERCHANT`), alltså en företagsorder på
// faktura. Ordrar ur kassan är betalda när de kommer in och får aldrig en
// faktura härifrån. Det första fallet var order 10079.
//
// Filen är ren: den räknar fram fakturan ur ordern och bygger mejlens text.
// PDF:en ritas i `faktura-pdf.ts`, och utskicket görs i `faktura-kor.ts`.
//
// ☠️ BELOPPEN RÄKNAS I ÖRE OCH STÄMS AV MOT WIX. Raderna summeras själva, och
// summan och momsen jämförs sedan med orderns `priceSummary`. Skiljer de sig
// med mer än en krona skickas ingen faktura. En faktura vars rader inte går
// ihop med totalen är värre än en som kommer en timme senare.
//
// ☠️ BARA PRISER INKLUSIVE MOMS. Butiken sätter `taxIncludedInPrices: true`.
// En order utan det skulle kräva en annan uträkning, och hellre ingen faktura
// än en med fel moms.

import { escapeHtml } from "../email/html";
import { ACTIONABLE_PAYMENT } from "./guard";
import { KUND_BRAND, kundSidfotText } from "../email/kundmejl";

/** Säljaren, som på butikens sekretesspolicy och i `app/layout.tsx` (headless-site). */
export const SALJARE = {
  namn: "Fyndplats",
  orgnr: "950914-4037",
  momsnr: "SE950914403701",
  adress: ["Bergviksgatan 10", "152 44 Södertälje"],
  epost: KUND_BRAND.supportEmail,
  telefon: KUND_BRAND.supportPhone,
  webb: "www.fyndplats.se",
} as const;

/**
 * Ordrar skapade före den här tidpunkten får ingen faktura härifrån. Verktyget
 * byggdes 2026-10-09, och en äldre handlagd order kan redan vara fakturerad på
 * annat sätt. Utan gränsen hade första körningen skickat fakturor på allt i
 * fönstret.
 */
export const FAKTURA_FRAN = "2026-10-09T00:00:00.000Z";

/** Betalningsvillkor om konfigurationen inte säger annat. */
export const STANDARD_DAGAR = 30;

/**
 * Förskottsfaktura (medlemskapet E3, Leonards svar 3.3 2026-11-05). Wix har
 * inget API som slår på ett betalsätt, och manuell betalning i panelen syns
 * för alla kunder. Butiken skapar därför en obetald handlagd order åt ett
 * godkänt företag (`POST /ecom/v1/orders`) och skriver FORSKOTT_MARKOR först i
 * ordernoteringen. En sådan order:
 *   - får fakturan härifrån som vilken fakturaorder som helst, men med
 *     förfallodagen högst FORSKOTT_DAGAR bort och texten att varorna skickas
 *     när betalningen har kommit in;
 *   - ☠️ får inga leverantörsuppgifter förrän den är betald
 *     (`/api/wix-order`), eftersom ingenting ska beställas innan pengarna
 *     finns. När den markeras betald i Wix skapar kvittokörningen uppgifterna
 *     (`efterBetalning` i faktura-kor.ts), och återhämtningen är nätet under.
 * Villkoren för företagskonto, punkt 5.1, lovar detsamma.
 */
export const FORSKOTT_DAGAR = 10;
export const FORSKOTT_MARKOR = "Förskottsfaktura";

/** En förskottsorder: lagd för hand (eller av butiken) med markören först i noteringen. */
export function arForskottsorder(o: Pick<FakturaOrder, "channelInfo" | "buyerNote">): boolean {
  if (o.channelInfo?.type !== "BACKOFFICE_MERCHANT") return false;
  return (o.buyerNote ?? "").trim().toLowerCase().startsWith(FORSKOTT_MARKOR.toLowerCase());
}

/**
 * Ska webhooken hålla inne leverantörsuppgifterna? Ja för en förskottsorder
 * som inte är betald. Samma betalstatusar som vakten och återhämtningen
 * (ACTIONABLE_PAYMENT), så att de tre aldrig blir oense.
 */
export function vantarPaForskottsbetalning(o: Pick<FakturaOrder, "channelInfo" | "buyerNote" | "paymentStatus">): boolean {
  return arForskottsorder(o) && !ACTIONABLE_PAYMENT.has(o.paymentStatus ?? "");
}

/**
 * Kvittot för ett köp i kassan som företag (medlemskapet E3, villkoren för
 * företagskonto 5.2: "Kvitto och faktura med köparens namn och adress, och för
 * ett bolag organisationsnumret, skickas med e-post"). Ett godkänt företag som
 * betalar med kort eller Klarna får samma PDF som fakturaordrarnas kvitto, med
 * företagets namn och fakturaadress och, för ett bolag, organisationsnumret.
 * Wix kvitton är avstängda sedan 2026-10-09, och butikens orderbekräftelse bär
 * inte företaget.
 *
 * Vilka ordrar det gäller (`arKassakop`): en order ur kassan, inte handlagd,
 * betald, skapad från och med KASSAKVITTO_FRAN, vars köpflöde
 * (`purchaseFlowId`) har ett prisbeslut med `foretagNamn` i
 * `FyndplatsPrisbeslut`. Butiken sparar beslutet när kunden går till kassan,
 * med företagets uppgifter som de var då (`foretagOrgnr`, `foretagFaktura`). En
 * privat medlemskorg och en vanlig korg har inget företag och får inget kvitto
 * härifrån.
 *
 * ☠️ ORGANISATIONSNUMRET KOMMER BARA UR BESLUTET, och bara ett nummer som är en
 * juridisk persons (siffra tre och fyra minst 20). En enskild firmas nummer är
 * ägarens personnummer: butiken lägger det aldrig på beslutet, och skulle det
 * ändå stå där skrivs det inte ut. Ett nummer som kunden skrivit i
 * ordernoteringen läses aldrig för ett köp i kassan.
 */
export const KASSAKVITTO_FRAN = "2026-11-06T00:00:00.000Z";
const KASSAKVITTO_BETALD = new Set(["PAID", "PARTIALLY_REFUNDED"]);

export interface Foretagsuppgifter {
  namn: string;
  /** Bara en juridisk persons nummer, "NNNNNN-NNNN"; aldrig en enskild firmas. */
  orgnr?: string;
  /** Fakturaadressen i företagsprofilen när kunden gick till kassan. */
  adress?: { gata: string; postnr: string; ort: string };
}

/** Ett betalt köp ur kassan som kan ha gjorts som företag. Beslutet avgör sedan. */
export function arKassakop(
  o: Pick<FakturaOrder, "channelInfo" | "status" | "paymentStatus" | "createdDate" | "_createdDate" | "purchaseFlowId">,
): boolean {
  if (o.channelInfo?.type === "BACKOFFICE_MERCHANT") return false;
  if (o.status === "CANCELED" || o.status === "INITIATED") return false;
  if (!KASSAKVITTO_BETALD.has(o.paymentStatus ?? "")) return false;
  if (!o.purchaseFlowId) return false;
  const skapad = o.createdDate ?? o._createdDate;
  return Boolean(skapad && skapad >= KASSAKVITTO_FRAN);
}

/** En juridisk persons organisationsnummer: "NNNNNN-NNNN" med siffra tre och fyra minst 20. */
export function arJuridisktOrgnr(v: string): boolean {
  return /^\d{6}-\d{4}$/.test(v) && Number(v.slice(2, 4)) >= 20;
}

/**
 * Prisbeslutets rad (`FyndplatsPrisbeslut`, butikens lib/medlem/lager.ts) →
 * företaget bakom köpet, eller null när korgen prissattes som privatperson.
 */
export function foretagUrBeslut(rad: Record<string, unknown>): Foretagsuppgifter | null {
  const namn = typeof rad.foretagNamn === "string" ? rad.foretagNamn.trim() : "";
  if (!namn) return null;
  const orgnr = typeof rad.foretagOrgnr === "string" ? rad.foretagOrgnr.trim() : "";
  const a = rad.foretagFaktura;
  const falt = (k: string) =>
    a && typeof a === "object" && typeof (a as Record<string, unknown>)[k] === "string"
      ? ((a as Record<string, unknown>)[k] as string).trim()
      : "";
  const adress = { gata: falt("gata"), postnr: falt("postnr"), ort: falt("ort") };
  return {
    namn,
    ...(arJuridisktOrgnr(orgnr) ? { orgnr } : {}),
    ...(adress.gata && adress.ort ? { adress } : {}),
  };
}

/**
 * Fakturans valuta. `byggFaktura` vägrar allt annat, och koden står på
 * fakturan och kvittot: en företagskunds inköpsorder kräver valutakoden på
 * fakturan (2026-10-14), och "kr" räcker inte som valutakod.
 */
export const VALUTA = "SEK";

export interface Betalningsuppgifter {
  /** Vart pengarna ska, ordagrant som det ska stå. T.ex. "Bankgiro 123-4567". */
  betalaTill: string;
  /** Om fakturan ska bära "Godkänd för F-skatt". */
  fSkatt: boolean;
  /** Dagar till förfallodagen. */
  dagar: number;
}

type Belopp = { amount?: string } | undefined;

interface Adress {
  addressLine?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  countryFullname?: string;
}

interface Kontakt {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
}

/** De delar av en Wix-order fakturan läser. Orders-API:t och webhooken bär samma form. */
export interface FakturaOrder {
  id: string;
  number?: string;
  status?: string;
  paymentStatus?: string;
  createdDate?: string;
  _createdDate?: string;
  currency?: string;
  taxIncludedInPrices?: boolean;
  channelInfo?: { type?: string };
  /** Köpflödet: samma id som varukorgen och kassan bar (prisbeslutet, `arKassakop`). */
  purchaseFlowId?: string;
  buyerInfo?: { email?: string };
  buyerNote?: string;
  billingInfo?: { address?: Adress; contactDetails?: Kontakt };
  recipientInfo?: { address?: Adress; contactDetails?: Kontakt };
  shippingInfo?: {
    title?: string;
    cost?: { price?: Belopp };
    logistics?: { shippingDestination?: { address?: Adress; contactDetails?: Kontakt } };
  };
  priceSummary?: {
    subtotal?: Belopp;
    shipping?: Belopp;
    tax?: Belopp;
    discount?: Belopp;
    total?: Belopp;
  };
  lineItems?: {
    id?: string;
    quantity?: number;
    productName?: { original?: string; translated?: string };
    physicalProperties?: { sku?: string };
    price?: Belopp;
    totalPriceAfterTax?: Belopp;
    taxDetails?: { taxRate?: string };
    taxInfo?: { taxRate?: string };
    descriptionLines?: {
      name?: { original?: string; translated?: string };
      plainText?: { original?: string; translated?: string };
      colorInfo?: { original?: string; translated?: string };
    }[];
  }[];
}

export interface FakturaRad {
  benamning: string;
  /** Val som färg och storlek, t.ex. "Färg: Grå". */
  detaljer: string[];
  sku?: string;
  antal: number;
  /** À-pris inklusive moms, i öre. */
  aPrisOre: number;
  /** Momssats i procent, t.ex. 25. */
  momsProcent: number;
  /** Radens belopp inklusive moms, i öre. */
  beloppOre: number;
}

export interface Faktura {
  orderId: string;
  /** Förskottsfaktura: varorna skickas när den är betald (arForskottsorder). */
  forskott: boolean;
  /** Kvitto för ett köp i kassan som företag (byggKassakvitto); numret är ordernumret. */
  kassakop?: boolean;
  /** Fakturanumret är ordernumret, så kunden och vi talar om samma sak. */
  nummer: string;
  fakturadatum: string;
  forfallodatum: string;
  orderdatum: string;
  kund: {
    foretag?: string;
    namn?: string;
    adressrader: string[];
    epost: string;
    telefon?: string;
    orgnr?: string;
    referens?: string;
  };
  leveransrader: string[];
  rader: FakturaRad[];
  frakt: { namn: string; ore: number };
  rabattOre: number;
  /** Moms per sats, i öre. */
  moms: { procent: number; ore: number }[];
  /** Att betala, inklusive moms, i öre. */
  totalOre: number;
  /** Summa exklusive moms, i öre. */
  nettoOre: number;
  betalning: Betalningsuppgifter;
}

/** En order som ska faktureras härifrån: lagd för hand i Wix, inte avbruten. */
export function arFakturaorder(o: Pick<FakturaOrder, "channelInfo" | "status" | "createdDate" | "_createdDate">): boolean {
  if (o.channelInfo?.type !== "BACKOFFICE_MERCHANT") return false;
  if (o.status === "CANCELED" || o.status === "INITIATED") return false;
  const skapad = o.createdDate ?? o._createdDate;
  return Boolean(skapad && skapad >= FAKTURA_FRAN);
}

/** "6559.00" → 655900. Ett belopp som inte går att läsa blir null, inte noll. */
export function tillOre(b: Belopp): number | null {
  const s = b?.amount;
  if (s === undefined || s === null || s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** "0.25" → 25. Wix anger satsen som decimaltal. */
export function momsProcent(sats: string | undefined): number | null {
  if (sats === undefined || sats === "") return null;
  const n = Number(sats);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round((n <= 1 ? n * 100 : n) * 100) / 100;
}

/** Datum i svensk tid som ÅÅÅÅ-MM-DD. */
export function svensktDatum(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 655900 → "6 559,00 kr". Mellanrummet är ett hårt mellanslag. */
export function kronor(ore: number): string {
  const tecken = ore < 0 ? "−" : "";
  const abs = Math.abs(ore);
  const hela = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const delar = String(abs % 100).padStart(2, "0");
  return `${tecken}${hela},${delar} kr`;
}

function adressrader(a: Adress | undefined): string[] {
  if (!a) return [];
  const gata = a.addressLine ?? a.addressLine1;
  const ort = [a.postalCode, a.city].filter(Boolean).join(" ");
  const land = a.country && a.country !== "SE" ? a.countryFullname ?? a.country : undefined;
  return [gata, a.addressLine2, ort, land].filter((s): s is string => Boolean(s && s.trim()));
}

function namnAv(k: Kontakt | undefined): string | undefined {
  const n = [k?.firstName, k?.lastName].filter(Boolean).join(" ").trim();
  return n || undefined;
}

/** Kundens organisationsnummer och referens, om de står i ordernoteringen. */
export function lasNotering(notering: string | undefined): { orgnr?: string; referens?: string } {
  if (!notering) return {};
  const org = notering.match(/org\.?\s*nr\.?:?\s*(\d{6}-?\d{4})/i);
  const ref = notering.match(/referens:?\s*([^.\n]+)/i);
  return {
    orgnr: org ? org[1].replace(/^(\d{6})(\d{4})$/, "$1-$2") : undefined,
    referens: ref ? ref[1].trim() || undefined : undefined,
  };
}

function plusDagar(datum: Date, dagar: number): Date {
  return new Date(datum.getTime() + dagar * 24 * 60 * 60 * 1000);
}

export type FakturaUtfall = { ok: true; faktura: Faktura } | { ok: false; fel: string };

/**
 * Räknar fram fakturan. Allt som inte går att avgöra säkert ger ett fel i
 * stället för en gissning, och felet säger vad som saknas.
 */
export function byggFaktura(o: FakturaOrder, nu: Date, betalning: Betalningsuppgifter): FakturaUtfall {
  if (!o.number) return { ok: false, fel: "ordern saknar nummer" };
  if ((o.currency ?? VALUTA) !== VALUTA) return { ok: false, fel: `valutan är ${o.currency}, inte ${VALUTA}` };
  if (o.taxIncludedInPrices !== true) return { ok: false, fel: "priserna är inte angivna inklusive moms" };
  const epost = o.buyerInfo?.email?.trim();
  if (!epost) return { ok: false, fel: "ordern saknar kundens e-post" };

  const rader: FakturaRad[] = [];
  for (const li of o.lineItems ?? []) {
    const antal = li.quantity ?? 1;
    const aPris = tillOre(li.price);
    const procent = momsProcent(li.taxDetails?.taxRate ?? li.taxInfo?.taxRate);
    if (aPris === null) return { ok: false, fel: "en rad saknar pris" };
    if (procent === null) return { ok: false, fel: "en rad saknar momssats" };
    const belopp = tillOre(li.totalPriceAfterTax) ?? aPris * antal;
    const detaljer = (li.descriptionLines ?? [])
      .map((d) => {
        const namn = d.name?.translated ?? d.name?.original;
        const varde = d.plainText?.translated ?? d.plainText?.original ?? d.colorInfo?.translated ?? d.colorInfo?.original;
        return namn && varde ? `${namn}: ${varde}` : undefined;
      })
      .filter((s): s is string => Boolean(s));
    rader.push({
      benamning: (li.productName?.translated ?? li.productName?.original ?? "Vara").trim(),
      detaljer,
      sku: li.physicalProperties?.sku || undefined,
      antal,
      aPrisOre: aPris,
      momsProcent: procent,
      beloppOre: belopp,
    });
  }
  if (rader.length === 0) return { ok: false, fel: "ordern saknar rader" };

  const total = tillOre(o.priceSummary?.total);
  const momsWix = tillOre(o.priceSummary?.tax);
  if (total === null || momsWix === null) return { ok: false, fel: "ordern saknar total eller moms" };
  const fraktOre = tillOre(o.shippingInfo?.cost?.price) ?? tillOre(o.priceSummary?.shipping) ?? 0;
  const rabattOre = tillOre(o.priceSummary?.discount) ?? 0;

  // Frakten momsas med varornas högsta sats, som Wix gör för en order med en sats.
  const fraktProcent = Math.max(...rader.map((r) => r.momsProcent));
  const perSats = new Map<number, number>();
  const laggTill = (procent: number, inkl: number) => {
    const moms = Math.round((inkl * procent) / (100 + procent));
    perSats.set(procent, (perSats.get(procent) ?? 0) + moms);
  };
  for (const r of rader) laggTill(r.momsProcent, r.beloppOre);
  if (fraktOre > 0) laggTill(fraktProcent, fraktOre);
  if (rabattOre > 0) laggTill(fraktProcent, -rabattOre);

  const summaRader = rader.reduce((s, r) => s + r.beloppOre, 0) + fraktOre - rabattOre;
  const momsRaknad = [...perSats.values()].reduce((s, v) => s + v, 0);
  if (Math.abs(summaRader - total) > 100) {
    return { ok: false, fel: `raderna summerar till ${kronor(summaRader)} men ordern till ${kronor(total)}` };
  }
  if (Math.abs(momsRaknad - momsWix) > 100) {
    return { ok: false, fel: `momsen blir ${kronor(momsRaknad)} men ordern säger ${kronor(momsWix)}` };
  }
  // Wix belopp är facit. En öresavvikelse i momsen läggs på den största satsen.
  const moms = [...perSats.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([procent, ore]) => ({ procent, ore }));
  if (moms.length > 0) moms[0].ore += momsWix - momsRaknad;

  const kontakt = o.billingInfo?.contactDetails;
  const lev = o.shippingInfo?.logistics?.shippingDestination ?? o.recipientInfo;
  const notering = lasNotering(o.buyerNote);
  const skapad = o.createdDate ?? o._createdDate;
  const forskott = arForskottsorder(o);
  const dagar = forskott ? Math.min(betalning.dagar, FORSKOTT_DAGAR) : betalning.dagar;

  return {
    ok: true,
    faktura: {
      orderId: o.id,
      forskott,
      nummer: o.number,
      fakturadatum: svensktDatum(nu),
      forfallodatum: svensktDatum(plusDagar(nu, dagar)),
      orderdatum: skapad ? svensktDatum(new Date(skapad)) : svensktDatum(nu),
      kund: {
        foretag: kontakt?.company?.trim() || undefined,
        namn: namnAv(kontakt),
        adressrader: adressrader(o.billingInfo?.address),
        epost,
        telefon: kontakt?.phone || undefined,
        orgnr: notering.orgnr,
        referens: notering.referens ?? namnAv(kontakt),
      },
      leveransrader: [
        lev?.contactDetails?.company?.trim() || namnAv(lev?.contactDetails),
        ...adressrader(lev?.address),
      ].filter((s): s is string => Boolean(s)),
      rader,
      frakt: { namn: o.shippingInfo?.title?.trim() || "Frakt", ore: fraktOre },
      rabattOre,
      moms,
      totalOre: total,
      nettoOre: total - momsWix,
      betalning,
    },
  };
}

/** "15244" → "152 44", som Wix och butiken skriver svenska postnummer. */
function postnummer(p: string): string {
  const s = p.replace(/\s+/g, "");
  return /^\d{5}$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3)}` : p.trim();
}

/**
 * Kvittot för ett köp i kassan som företag. Beloppen, raderna och leveransen
 * kommer ur ordern som för en fakturaorder (`byggFaktura`, avstämda mot Wix);
 * köparen är företaget ur prisbeslutet. Organisationsnumret sätts alltid
 * härifrån, även när det saknas, så att ett nummer i kundens ordernotering
 * aldrig följer med.
 */
export function byggKassakvitto(
  o: FakturaOrder,
  foretag: Foretagsuppgifter,
  nu: Date,
  betalning: Betalningsuppgifter,
): FakturaUtfall {
  const namn = foretag.namn.trim();
  if (!namn) return { ok: false, fel: "beslutet saknar företagets namn" };
  const byggd = byggFaktura(o, nu, betalning);
  if (!byggd.ok) return byggd;
  const f = byggd.faktura;
  const a = foretag.adress;
  const adressrader = a ? [a.gata, `${postnummer(a.postnr)} ${a.ort}`.trim()] : f.kund.adressrader;
  return {
    ok: true,
    faktura: {
      ...f,
      forskott: false,
      kassakop: true,
      kund: {
        ...f.kund,
        foretag: namn,
        orgnr: foretag.orgnr && arJuridisktOrgnr(foretag.orgnr) ? foretag.orgnr : undefined,
        adressrader,
      },
    },
  };
}

export interface KundMejl {
  subject: string;
  html: string;
  text: string;
  forhandstext: string;
}

const b = KUND_BRAND;
const P = `margin:0 0 14px 0;font-size:15px;line-height:1.6;color:${b.ink};`;
const RUBRIK = `margin:0 0 16px 0;font-size:24px;line-height:1.25;color:${b.ink};`;
const LITEN = `font-size:13px;color:${b.muted};`;

function hej(f: Faktura): string {
  const fornamn = f.kund.namn?.split(" ")[0];
  return fornamn ? `Hej ${fornamn}!` : "Hej!";
}

/**
 * Ett mellanslag före en siffra blir ett hårt mellanslag, så att ett
 * kontonummer aldrig delas mellan två rader. Det första fakturamejlet bröt
 * kontonumret mellan två siffergrupper (2026-10-14). Värdet får fortfarande
 * brytas efter ett komma eller mellan två ord.
 */
function utanRadbrytForeSiffra(html: string): string {
  return html.replace(/ (?=\d)/g, "&nbsp;");
}

function sammanfattning(rader: [string, string][]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 20px 0;border:1px solid ${b.line};border-radius:12px;background:${b.warm};">
${rader
  .map(
    ([etikett, varde], i) => `  <tr>
    <td style="padding:${i === 0 ? 14 : 6}px 16px ${i === rader.length - 1 ? 14 : 6}px 16px;${LITEN}">${escapeHtml(etikett)}</td>
    <td align="right" style="padding:${i === 0 ? 14 : 6}px 16px ${i === rader.length - 1 ? 14 : 6}px 16px;font-size:15px;font-weight:700;color:${b.ink};">${utanRadbrytForeSiffra(escapeHtml(varde))}</td>
  </tr>`,
  )
  .join("\n")}
</table>`;
}

function varulista(f: Faktura): string {
  return f.rader
    .map(
      (r) => `<p style="margin:0 0 6px 0;font-size:14px;line-height:1.5;color:${b.ink};">${r.antal} × ${escapeHtml(r.benamning)}${
        r.detaljer.length ? ` <span style="${LITEN}">(${escapeHtml(r.detaljer.join(", "))})</span>` : ""
      } <span style="white-space:nowrap;font-weight:600;">${escapeHtml(kronor(r.beloppOre))}</span></p>`,
    )
    .join("\n");
}

/** Mejlet som bär fakturan. PDF:en ligger som bilaga. */
export function fakturaMejl(f: Faktura): KundMejl {
  const att = kronor(f.totalOre);
  const slag = f.forskott ? "Förskottsfaktura" : "Faktura";
  const subject = `${slag} ${f.nummer} från Fyndplats`;
  const forhandstext = f.forskott
    ? `Att betala ${att} senast ${f.forfallodatum}. Vi skickar varorna när betalningen har kommit in.`
    : `Att betala ${att} senast ${f.forfallodatum}. Fakturan ligger som PDF i mejlet.`;
  const leverans = f.forskott
    ? "Det här är en förskottsfaktura: vi skickar varorna när betalningen har kommit in, och du får ett mejl med spårningsnumret när de är på väg."
    : "Varan skickas inom kort, och du får ett mejl med spårningsnumret när den är på väg.";
  const html = `<h1 style="${RUBRIK}">${slag} ${escapeHtml(f.nummer)}</h1>
<p style="${P}">${escapeHtml(hej(f))} Tack för din beställning${f.kund.foretag ? ` till ${escapeHtml(f.kund.foretag)}` : ""}. Här kommer fakturan. Den ligger också som PDF i mejlet.</p>
${sammanfattning([
  ["Att betala", att],
  ["Förfallodatum", f.forfallodatum],
  ["Betala till", f.betalning.betalaTill],
  ["Meddelande till mottagaren", f.nummer],
])}
${varulista(f)}
<p style="${P}margin-top:18px;">Skriv <strong>${escapeHtml(f.nummer)}</strong> i meddelandet till mottagaren när du betalar, så ser vi direkt vilken faktura betalningen gäller.</p>
<p style="${P}">${escapeHtml(leverans)}</p>
<p style="${P}">Har du frågor om fakturan? Svara på det här mejlet, så hjälper vi dig.</p>
<p style="${P}${LITEN}">${escapeHtml(SALJARE.namn)} · org.nr ${SALJARE.orgnr} · momsreg.nr ${SALJARE.momsnr}${f.betalning.fSkatt ? " · Godkänd för F-skatt" : ""}</p>`;
  const text = [
    `${slag} ${f.nummer} från Fyndplats`,
    "",
    `${hej(f)} Tack för din beställning${f.kund.foretag ? ` till ${f.kund.foretag}` : ""}. Fakturan ligger som PDF i mejlet.`,
    "",
    `Att betala: ${att}`,
    `Förfallodatum: ${f.forfallodatum}`,
    `Betala till: ${f.betalning.betalaTill}`,
    `Meddelande till mottagaren: ${f.nummer}`,
    "",
    ...f.rader.map((r) => `${r.antal} × ${r.benamning}  ${kronor(r.beloppOre)}`),
    "",
    leverans,
    "",
    "Har du frågor om fakturan? Svara på det här mejlet.",
    "",
    kundSidfotText(),
  ].join("\n");
  return { subject, html, text, forhandstext };
}

/**
 * Mejlet när fakturan är betald, eller med kvittot för ett köp i kassan som
 * företag (`kassakop`). Kvittot ligger som PDF i mejlet.
 */
export function kvittoMejl(f: Faktura, betaldDatum: string): KundMejl {
  const belopp = kronor(f.totalOre);
  const subject = f.kassakop ? `Kvitto för order ${f.nummer} från Fyndplats` : `Kvitto: faktura ${f.nummer} är betald`;
  const forhandstext = f.kassakop
    ? `Kvittot för order ${f.nummer}, ${belopp}, med företagets uppgifter.`
    : `Vi har tagit emot ${belopp}. Tack!`;
  const rubrik = f.kassakop ? "Ditt kvitto" : "Tack för din betalning";
  const inledning = f.kassakop
    ? `${hej(f)} Tack för köpet. Det här är kvittot för order ${f.nummer}${f.kund.foretag ? `, utställt på ${f.kund.foretag}` : ""}. Det finns också som PDF i mejlet, med företagets adress${f.kund.orgnr ? " och organisationsnummer" : ""}.`
    : `${hej(f)} Vi har tagit emot betalningen för ${f.forskott ? "förskottsfaktura" : "faktura"} ${f.nummer}. Det här mejlet är ditt kvitto, och det finns också som PDF i mejlet.`;
  const html = `<h1 style="${RUBRIK}">${rubrik}</h1>
<p style="${P}">${escapeHtml(inledning)}</p>
${sammanfattning([
  ["Betalt", belopp],
  ["varav moms", kronor(f.moms.reduce((s, m) => s + m.ore, 0))],
  ["Betalningsdatum", betaldDatum],
  [f.kassakop ? "Order" : "Faktura", f.nummer],
])}
${varulista(f)}
${f.forskott ? `<p style="${P}margin-top:18px;">Nu skickar vi varorna, och du får ett mejl med spårningsnumret när de är på väg.</p>\n` : ""}<p style="${P}margin-top:18px;">Har du frågor? Svara på det här mejlet, så hjälper vi dig.</p>
<p style="${P}${LITEN}">${escapeHtml(SALJARE.namn)} · org.nr ${SALJARE.orgnr} · momsreg.nr ${SALJARE.momsnr}</p>`;
  const text = [
    subject,
    "",
    f.kassakop ? inledning : `${hej(f)} Vi har tagit emot betalningen för ${f.forskott ? "förskottsfaktura" : "faktura"} ${f.nummer}. Det här mejlet är ditt kvitto.`,
    ...(f.forskott ? ["", "Nu skickar vi varorna, och du får ett mejl med spårningsnumret när de är på väg."] : []),
    "",
    `Betalt: ${belopp}`,
    `Betalningsdatum: ${betaldDatum}`,
    "",
    ...f.rader.map((r) => `${r.antal} × ${r.benamning}  ${kronor(r.beloppOre)}`),
    "",
    kundSidfotText(),
  ].join("\n");
  return { subject, html, text, forhandstext };
}
