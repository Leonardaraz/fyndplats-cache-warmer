// lib/medlem/mejl.ts
//
// Medlemsmejlen: inloggning, välkommen, ny nivå och "nivån sjunker". Samma
// avsändare som butikens övriga mejl. Ett mejl som inte går iväg loggas med
// typ och felnamn, aldrig med adressen.

import type { ReactElement } from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import MedlemInloggningEmail, { medlemInloggningAmne } from "@/emails/medlem-inloggning";
import MedlemValkommenEmail, { medlemValkommenAmne } from "@/emails/medlem-valkommen";
import MedlemNyNivaEmail, { medlemNyNivaAmne } from "@/emails/medlem-ny-niva";
import MedlemNivaSjunkerEmail, { medlemNivaSjunkerAmne } from "@/emails/medlem-niva-sjunker";
import { dagSomText, kronor, type Nivalage } from "./niva";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

async function skicka(till: string, amne: string, mejl: ReactElement, typ: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[medlem] RESEND_API_KEY saknas — mejlet ${typ} skickas inte`);
    return false;
  }
  try {
    const html = await render(mejl);
    const r = await new Resend(key).emails.send({ from: FROM, to: till, replyTo: REPLY_TO, subject: amne, html });
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

export function skickaNyNiva(till: string, l: Nivalage): Promise<boolean> {
  return skicka(till, medlemNyNivaAmne(l.niva.namn), MedlemNyNivaEmail({ niva: l.niva.namn, belopp: kronor(l.kOre), nasta: nasta(l) }), "ny-niva");
}

export function skickaNivaSjunker(till: string, l: Nivalage): Promise<boolean> {
  if (!l.sankning) return Promise.resolve(false);
  const datum = dagSomText(l.sankning.dag);
  return skicka(
    till,
    medlemNivaSjunkerAmne(datum.replace(/ \d{4}$/, "")),
    MedlemNivaSjunkerEmail({
      niva: l.niva.namn,
      nyNiva: l.sankning.niva.namn,
      datum,
      behovs: kronor(Math.max(0, l.niva.franOre - l.sankning.kOre)),
    }),
    "niva-sjunker",
  );
}
