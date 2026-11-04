// lib/medlem/mejl.ts
//
// Medlemsmejlen: inloggning, välkommen, ny nivå och "nivån sjunker". Samma
// avsändare som butikens övriga mejl. Ett mejl som inte går iväg loggas med
// typ och felnamn, aldrig med adressen.
//
// Mejlen om nivån uppmanar till köp och får därför en länk för att
// avregistrera sig, och rubrikerna List-Unsubscribe med ett klick (RFC 8058),
// som Gmail och Outlook visar som "Avsluta prenumeration". Inloggningen och
// välkomstmejlet hör till kontot och har ingen sådan länk.

import type { ReactElement } from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import MedlemInloggningEmail, { medlemInloggningAmne } from "@/emails/medlem-inloggning";
import MedlemValkommenEmail, { medlemValkommenAmne } from "@/emails/medlem-valkommen";
import MedlemNyNivaEmail, { medlemNyNivaAmne } from "@/emails/medlem-ny-niva";
import MedlemNivaSjunkerEmail, { medlemNivaSjunkerAmne } from "@/emails/medlem-niva-sjunker";
import ForetagGodkantEmail, { ForetagAttGranskaEmail, foretagAttGranskaAmne, foretagGodkantAmne } from "@/emails/medlem-foretag";
import OffertKlarEmail, { OffertForfraganEmail, offertForfraganAmne, offertKlarAmne } from "@/emails/medlem-offert";
import { dagSomText, kronor, type Nivalage } from "./niva";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

async function skicka(
  till: string,
  amne: string,
  mejl: ReactElement,
  typ: string,
  headers?: Record<string, string>,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[medlem] RESEND_API_KEY saknas — mejlet ${typ} skickas inte`);
    return false;
  }
  try {
    const html = await render(mejl);
    const r = await new Resend(key).emails.send({ from: FROM, to: till, replyTo: REPLY_TO, subject: amne, html, ...(headers ? { headers } : {}) });
    if (r.error) {
      console.error(`[medlem] mejlet ${typ} gick inte iväg: ${r.error.name}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[medlem] mejlet ${typ} gick inte iväg: ${e instanceof Error ? e.name : "fel"}`);
    return false;
  }
}

const nasta = (l: Nivalage) => (l.nasta ? { niva: l.nasta.niva.namn, kvar: kronor(l.nasta.kvarOre) } : null);

export function skickaInloggning(till: string, lank: string, kod: string): Promise<boolean> {
  return skicka(till, medlemInloggningAmne(kod), MedlemInloggningEmail({ lank, kod }), "inloggning");
}

export function skickaValkommen(till: string, l: Nivalage): Promise<boolean> {
  return skicka(till, medlemValkommenAmne, MedlemValkommenEmail({ niva: l.niva.namn, belopp: kronor(l.kOre), nasta: nasta(l) }), "valkommen");
}

/** Butikens adress i mejlen: produktionens, eller förhandsbyggets egen. */
export function sajt(): string {
  if (process.env.VERCEL_ENV === "production" || !process.env.VERCEL_URL) return "https://www.fyndplats.se";
  return `https://${process.env.VERCEL_URL}`;
}

/** Länkarna för att avregistrera sig: sidan i mejlet, och ett klick i mejlklienten. */
export interface Avregistrering {
  /** `?m=…&t=…` (lib/medlem/inloggning.ts `avregistreringsFraga`). */
  fraga: string;
}

function avregistreringsdelar(a: Avregistrering) {
  const sida = `${sajt()}/konto/avregistrera${a.fraga}`;
  const direkt = `${sajt()}/api/konto/avregistrera${a.fraga}`;
  return {
    sida,
    headers: { "List-Unsubscribe": `<${direkt}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

export function skickaNyNiva(till: string, l: Nivalage, a: Avregistrering): Promise<boolean> {
  const { sida, headers } = avregistreringsdelar(a);
  return skicka(
    till,
    medlemNyNivaAmne(l.niva.namn),
    MedlemNyNivaEmail({ niva: l.niva.namn, belopp: kronor(l.kOre), nasta: nasta(l), avregistrera: sida }),
    "ny-niva",
    headers,
  );
}

export function skickaNivaSjunker(till: string, l: Nivalage, a: Avregistrering): Promise<boolean> {
  if (!l.sankning) return Promise.resolve(false);
  const { sida, headers } = avregistreringsdelar(a);
  const datum = dagSomText(l.sankning.dag);
  return skicka(
    till,
    medlemNivaSjunkerAmne(datum.replace(/ \d{4}$/, "")),
    MedlemNivaSjunkerEmail({
      niva: l.niva.namn,
      nyNiva: l.sankning.niva.namn,
      datum,
      behovs: kronor(Math.max(0, l.niva.franOre - l.sankning.kOre)),
      avregistrera: sida,
    }),
    "niva-sjunker",
    headers,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Företagskontot (E3)
// ─────────────────────────────────────────────────────────────────────────────

/** Motorns admin, där företagen granskas (Leonards beslut A3). */
export const ADMIN_MEDLEMMAR = "https://fyndplats-cache-warmer.vercel.app/admin/medlemmar#foretag";

export function skickaForetagGodkant(till: string, namn: string): Promise<boolean> {
  return skicka(till, foretagGodkantAmne, ForetagGodkantEmail({ namn }), "foretag-godkant");
}

/** Till butiken: en ansökan väntar. Bara det maskerade numret (F4). */
export function skickaForetagAttGranska(a: { namn: string; orgnrVisas: string; form: "juridisk" | "enskild" }): Promise<boolean> {
  return skicka(REPLY_TO, foretagAttGranskaAmne(a.namn), ForetagAttGranskaEmail({ ...a, adminLank: ADMIN_MEDLEMMAR }), "foretag-att-granska");
}

/** Motorns admin, där offerterna prissätts. */
export const ADMIN_OFFERTER = "https://fyndplats-cache-warmer.vercel.app/admin/medlemmar#offerter";

const SISTA_DAG = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", timeZone: "Europe/Stockholm" });

/** Till kunden: offerten är prissatt. `giltigTill` är det första ögonblick den inte gäller. */
export function skickaOffertKlar(till: string, o: { id: string; foretagNamn: string; giltigTill?: string }): Promise<boolean> {
  const sista = o.giltigTill && !Number.isNaN(Date.parse(o.giltigTill)) ? SISTA_DAG.format(new Date(Date.parse(o.giltigTill) - 1)) : null;
  return skicka(
    till,
    offertKlarAmne,
    OffertKlarEmail({ foretagNamn: o.foretagNamn, lank: `${sajt()}/offert/${o.id}`, sistaDag: sista }),
    "offert-klar",
  );
}

/** Till butiken: en förfrågan väntar på priser. */
export function skickaOffertForfragan(a: { foretagNamn: string; antalRader: number; antalVaror: number; listaOre: number; meddelande?: string }): Promise<boolean> {
  return skicka(
    REPLY_TO,
    offertForfraganAmne(a.foretagNamn),
    OffertForfraganEmail({ ...a, lista: kronor(a.listaOre), adminLank: ADMIN_OFFERTER }),
    "offert-forfragan",
  );
}
