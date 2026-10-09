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
  if ((o.currency ?? "SEK") !== "SEK") return { ok: false, fel: `valutan är ${o.currency}, inte SEK` };
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

  return {
    ok: true,
    faktura: {
      orderId: o.id,
      nummer: o.number,
      fakturadatum: svensktDatum(nu),
      forfallodatum: svensktDatum(plusDagar(nu, betalning.dagar)),
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

function sammanfattning(rader: [string, string][]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 20px 0;border:1px solid ${b.line};border-radius:12px;background:${b.warm};">
${rader
  .map(
    ([etikett, varde], i) => `  <tr>
    <td style="padding:${i === 0 ? 14 : 6}px 16px ${i === rader.length - 1 ? 14 : 6}px 16px;${LITEN}">${escapeHtml(etikett)}</td>
    <td align="right" style="padding:${i === 0 ? 14 : 6}px 16px ${i === rader.length - 1 ? 14 : 6}px 16px;font-size:15px;font-weight:700;color:${b.ink};">${escapeHtml(varde)}</td>
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
  const subject = `Faktura ${f.nummer} från Fyndplats`;
  const forhandstext = `Att betala ${att} senast ${f.forfallodatum}. Fakturan ligger som PDF i mejlet.`;
  const html = `<h1 style="${RUBRIK}">Faktura ${escapeHtml(f.nummer)}</h1>
<p style="${P}">${escapeHtml(hej(f))} Tack för din beställning${f.kund.foretag ? ` till ${escapeHtml(f.kund.foretag)}` : ""}. Här kommer fakturan. Den ligger också som PDF i mejlet.</p>
${sammanfattning([
  ["Att betala", att],
  ["Förfallodatum", f.forfallodatum],
  ["Betala till", f.betalning.betalaTill],
  ["Ange som referens", f.nummer],
])}
${varulista(f)}
<p style="${P}margin-top:18px;">Varan skickas inom kort, och du får ett mejl med spårningsnumret när den är på väg.</p>
<p style="${P}">Har du frågor om fakturan? Svara på det här mejlet, så hjälper vi dig.</p>
<p style="${P}${LITEN}">${escapeHtml(SALJARE.namn)} · org.nr ${SALJARE.orgnr} · momsreg.nr ${SALJARE.momsnr}${f.betalning.fSkatt ? " · Godkänd för F-skatt" : ""}</p>`;
  const text = [
    `Faktura ${f.nummer} från Fyndplats`,
    "",
    `${hej(f)} Tack för din beställning${f.kund.foretag ? ` till ${f.kund.foretag}` : ""}. Fakturan ligger som PDF i mejlet.`,
    "",
    `Att betala: ${att}`,
    `Förfallodatum: ${f.forfallodatum}`,
    `Betala till: ${f.betalning.betalaTill}`,
    `Ange som referens: ${f.nummer}`,
    "",
    ...f.rader.map((r) => `${r.antal} × ${r.benamning}  ${kronor(r.beloppOre)}`),
    "",
    "Har du frågor om fakturan? Svara på det här mejlet.",
    "",
    kundSidfotText(),
  ].join("\n");
  return { subject, html, text, forhandstext };
}

/** Mejlet när fakturan är betald. Kvittot ligger som PDF i mejlet. */
export function kvittoMejl(f: Faktura, betaldDatum: string): KundMejl {
  const belopp = kronor(f.totalOre);
  const subject = `Kvitto: faktura ${f.nummer} är betald`;
  const forhandstext = `Vi har tagit emot ${belopp}. Tack!`;
  const html = `<h1 style="${RUBRIK}">Tack för din betalning</h1>
<p style="${P}">${escapeHtml(hej(f))} Vi har tagit emot betalningen för faktura ${escapeHtml(f.nummer)}. Det här mejlet är ditt kvitto, och det finns också som PDF i mejlet.</p>
${sammanfattning([
  ["Betalt", belopp],
  ["varav moms", kronor(f.moms.reduce((s, m) => s + m.ore, 0))],
  ["Betalningsdatum", betaldDatum],
  ["Faktura", f.nummer],
])}
${varulista(f)}
<p style="${P}margin-top:18px;">Har du frågor? Svara på det här mejlet, så hjälper vi dig.</p>
<p style="${P}${LITEN}">${escapeHtml(SALJARE.namn)} · org.nr ${SALJARE.orgnr} · momsreg.nr ${SALJARE.momsnr}</p>`;
  const text = [
    `Kvitto: faktura ${f.nummer} är betald`,
    "",
    `${hej(f)} Vi har tagit emot betalningen för faktura ${f.nummer}. Det här mejlet är ditt kvitto.`,
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
