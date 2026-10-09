// Skickar fakturan och kvittot för ordrar på faktura (lib/orders/faktura.ts).
//
// Två vägar in, samma regler:
//   - webhooken (`/api/wix-order`) när en handlagd order godkänns, så fakturan
//     går ut direkt
//   - timcronen (`/api/cron/faktura`), som fångar det webhooken missar och
//     skickar kvittot. Wix skickar ingen händelse till motorn när en order
//     markeras betald, så kvittot kommer inom en timme från betalningen.
//
// Regler, i den ordning de prövas för varje order:
//   1. Bara fakturaordrar (`arFakturaorder`): lagda för hand, inte avbrutna,
//      skapade från och med FAKTURA_FRAN.
//   2. Obetald (`NOT_PAID`) och ingen faktura skickad → faktura.
//   3. Betald (`PAID`), fakturan skickad härifrån och inget kvitto → kvitto.
//      En order som betalats utan att vi skickat fakturan får inget kvitto
//      härifrån, för då vet vi inte vilken faktura kvittot gäller.
//
// ☠️ UTAN BETALNINGSUPPGIFTER SKICKAS INGEN FAKTURA. En faktura utan uppgift om
// vart pengarna ska är inget kunden kan betala. Ordern räknas i
// `vantarPaBetalningsuppgifter`, och nästa körning skickar när uppgiften finns.
//
// ☠️ SVARET BÄR BARA ORDERNUMMER. Kundens namn, e-post och adress lämnar aldrig
// rutten. Loggen kan hamna i en publik Actions-logg.

import {
  arFakturaorder,
  byggFaktura,
  fakturaMejl,
  kvittoMejl,
  svensktDatum,
  STANDARD_DAGAR,
  type Betalningsuppgifter,
  type FakturaOrder,
  type KundMejl,
} from "./faktura";
import { fakturaPdf } from "./faktura-pdf";
import type { Utskickslogg } from "./faktura-logg";

export const STANDARD_BAKAT_DAGAR = 120;

export interface FakturaKorVal {
  /** Säger vad som skulle skickas, skickar ingenting. */
  dryRun?: boolean;
  lookbackDays?: number;
  /** Bara dessa ordernummer. */
  ordernummer?: string[];
  /** Ordrar som redan är lästa (webhooken). Då läses inget från Wix. */
  ordrar?: FakturaOrder[];
  nu?: Date;
  /**
   * Skicka fakturan och kvittot för `ordernummer` till den här adressen i
   * stället för till kunden, med [Prov] i ämnesraden. Loggen rörs inte.
   */
  provTill?: string;
}

export interface Skickat {
  id?: string;
  skipped?: string;
}

export interface FakturaKorDeps {
  listaOrdrar: (sinceIso: string) => Promise<FakturaOrder[]>;
  logg: Utskickslogg;
  /** Null när ingen betalningsuppgift är satt. */
  betalning: () => Promise<Betalningsuppgifter | null>;
  /** Loggan som PNG. Saknas den ritas namnet i stället. */
  logo: () => Promise<Uint8Array | undefined>;
  skicka: (input: { till: string; mejl: KundMejl; pdf: Uint8Array; filnamn: string }) => Promise<Skickat>;
}

export interface FakturaKorSvar {
  dryRun: boolean;
  prov: boolean;
  granskade: number;
  fakturaordrar: number;
  fakturor: string[];
  kvitton: string[];
  /** Skulle skickas (torrkörning). */
  skulleFakturor: string[];
  skulleKvitton: string[];
  vantarPaBetalningsuppgifter: string[];
  /** Obetalda med skickad faktura. Väntar på att markeras betalda i Wix. */
  vantarPaBetalning: string[];
  fel: { order: string; typ: "faktura" | "kvitto"; fel: string }[];
}

function tillBase64(b: Uint8Array): string {
  return Buffer.from(b).toString("base64");
}

export async function korFakturor(val: FakturaKorVal, deps: FakturaKorDeps): Promise<FakturaKorSvar> {
  const nu = val.nu ?? new Date();
  const dryRun = Boolean(val.dryRun);
  const prov = Boolean(val.provTill);
  const svar: FakturaKorSvar = {
    dryRun,
    prov,
    granskade: 0,
    fakturaordrar: 0,
    fakturor: [],
    kvitton: [],
    skulleFakturor: [],
    skulleKvitton: [],
    vantarPaBetalningsuppgifter: [],
    vantarPaBetalning: [],
    fel: [],
  };

  const bakat = val.lookbackDays ?? STANDARD_BAKAT_DAGAR;
  const sedan = new Date(nu.getTime() - bakat * 24 * 60 * 60 * 1000).toISOString();
  let ordrar = val.ordrar ?? (await deps.listaOrdrar(sedan));
  if (val.ordernummer?.length) {
    const vilka = new Set(val.ordernummer);
    ordrar = ordrar.filter((o) => o.number && vilka.has(o.number));
  }
  svar.granskade = ordrar.length;

  const betalning = await deps.betalning();
  let logo: Uint8Array | undefined;
  let logoLast = false;
  const hamtaLogo = async () => {
    if (!logoLast) {
      logoLast = true;
      try {
        logo = await deps.logo();
      } catch {
        logo = undefined;
      }
    }
    return logo;
  };

  for (const o of ordrar) {
    if (!arFakturaorder(o)) continue;
    svar.fakturaordrar++;
    const nummer = o.number ?? o.id;

    // --- Fakturan ---------------------------------------------------------
    const villFaktura = prov || o.paymentStatus === "NOT_PAID";
    if (villFaktura && (prov || !(await deps.logg.finns(o.id, "faktura")))) {
      if (!betalning) {
        svar.vantarPaBetalningsuppgifter.push(nummer);
      } else {
        const byggd = byggFaktura(o, nu, betalning);
        if (!byggd.ok) {
          svar.fel.push({ order: nummer, typ: "faktura", fel: byggd.fel });
        } else if (dryRun) {
          svar.skulleFakturor.push(nummer);
        } else if (prov || (await deps.logg.ta(o.id, "faktura", nummer))) {
          try {
            const pdf = await fakturaPdf(byggd.faktura, { typ: "faktura", logoPng: await hamtaLogo() });
            const mejl = fakturaMejl(byggd.faktura);
            const res = await deps.skicka({
              till: val.provTill ?? byggd.faktura.kund.epost,
              mejl: prov ? { ...mejl, subject: `[Prov] ${mejl.subject}` } : mejl,
              pdf,
              filnamn: `Faktura-${byggd.faktura.nummer}.pdf`,
            });
            if (!res.id) throw new Error(`mejlet gick inte iväg (${res.skipped ?? "inget id"})`);
            if (!prov) await deps.logg.bekrafta(o.id, "faktura", res.id);
            svar.fakturor.push(nummer);
          } catch (e) {
            if (!prov) await deps.logg.slapp(o.id, "faktura");
            svar.fel.push({ order: nummer, typ: "faktura", fel: e instanceof Error ? e.message : String(e) });
          }
        }
      }
    } else if (o.paymentStatus === "NOT_PAID") {
      svar.vantarPaBetalning.push(nummer);
    }

    // --- Kvittot ----------------------------------------------------------
    const fakturaSkickad = prov ? nu : await deps.logg.skickad(o.id, "faktura");
    const villKvitto = prov || (o.paymentStatus === "PAID" && fakturaSkickad !== null);
    if (!villKvitto || !fakturaSkickad) continue;
    if (!prov && (await deps.logg.finns(o.id, "kvitto"))) continue;
    const uppgifter = betalning ?? { betalaTill: "", fSkatt: false, dagar: STANDARD_DAGAR };
    const byggd = byggFaktura(o, fakturaSkickad, uppgifter);
    if (!byggd.ok) {
      svar.fel.push({ order: nummer, typ: "kvitto", fel: byggd.fel });
      continue;
    }
    if (dryRun) {
      svar.skulleKvitton.push(nummer);
      continue;
    }
    if (!prov && !(await deps.logg.ta(o.id, "kvitto", nummer))) continue;
    try {
      const betald = svensktDatum(nu);
      const pdf = await fakturaPdf(byggd.faktura, { typ: "kvitto", betaldDatum: betald, logoPng: await hamtaLogo() });
      const mejl = kvittoMejl(byggd.faktura, betald);
      const res = await deps.skicka({
        till: val.provTill ?? byggd.faktura.kund.epost,
        mejl: prov ? { ...mejl, subject: `[Prov] ${mejl.subject}` } : mejl,
        pdf,
        filnamn: `Kvitto-${byggd.faktura.nummer}.pdf`,
      });
      if (!res.id) throw new Error(`mejlet gick inte iväg (${res.skipped ?? "inget id"})`);
      if (!prov) await deps.logg.bekrafta(o.id, "kvitto", res.id);
      svar.kvitton.push(nummer);
    } catch (e) {
      if (!prov) await deps.logg.slapp(o.id, "kvitto");
      svar.fel.push({ order: nummer, typ: "kvitto", fel: e instanceof Error ? e.message : String(e) });
    }
  }

  return svar;
}

/** Bilagan som `sendEmail` tar emot. */
export function pdfBilaga(filnamn: string, pdf: Uint8Array) {
  return { filnamn, base64: tillBase64(pdf) };
}

/** Konfigraden → betalningsuppgifter. Null utan uppgift om vart pengarna ska. */
export function betalningUrKonfig(c: {
  fakturaBetalaTill?: string;
  fakturaFSkatt?: string;
  fakturaDagar?: string;
}): Betalningsuppgifter | null {
  const till = c.fakturaBetalaTill?.trim();
  if (!till) return null;
  const dagar = Number(c.fakturaDagar);
  return {
    betalaTill: till,
    fSkatt: /^(ja|true|1)$/i.test(c.fakturaFSkatt?.trim() ?? ""),
    dagar: Number.isInteger(dagar) && dagar > 0 && dagar <= 90 ? dagar : STANDARD_DAGAR,
  };
}
