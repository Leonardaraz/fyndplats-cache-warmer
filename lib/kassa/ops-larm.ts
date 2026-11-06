// lib/kassa/ops-larm.ts
//
// Kassans larm till Leonard (OPS_ALERT_EMAIL). Två sorter:
//   - skickaOpsMejl: ett mejl nu (nätets larm för betalningar har sitt eget
//     kvartersfönster, attSlutfora i lib/kassa/flode.ts),
//   - larmaEnGang: varje rad har en nyckel som tas i anspråk i Wix
//     (lib/webhook-email-dedup.ts) innan mejlet går, så att nätet var kvart
//     inte mejlar samma sak igen. Går mejlet inte iväg släpps nycklarna, och
//     nästa körning försöker igen.
//
// Mejlet går bara till Leonard. Loggraderna bär aldrig belopp eller
// kunduppgifter.

import { Resend } from "resend";
import { claimWebhookEmail, releaseWebhookEmail } from "@/lib/webhook-email-dedup";

const FROM = process.env.RESEND_FROM || "Fyndplats <orders@fyndplats.se>";

/** true när mejlet gick iväg. */
export async function skickaOpsMejl(amne: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const svar = await new Resend(key).emails.send({ from: FROM, to: process.env.OPS_ALERT_EMAIL || "info@fyndplats.com", subject: amne, text });
    if (svar.error) throw new Error(svar.error.message);
    return true;
  } catch (e) {
    console.error("[kassa-larm] mejlet kunde inte skickas:", e instanceof Error ? e.message.slice(0, 200) : e);
    return false;
  }
}

export interface Larmrad {
  /** Samma sak i samma läge ger samma nyckel. */
  nyckel: string;
  text: string;
}

/** Mejlar raderna som inte larmats förut, i ett mejl. Antalet rader som gick iväg. */
export async function larmaEnGang(rader: Larmrad[], mejl: (nya: Larmrad[]) => { amne: string; text: string }): Promise<number> {
  if (rader.length === 0 || !process.env.RESEND_API_KEY) return 0;
  const nya: Larmrad[] = [];
  for (const r of rader) if (await claimWebhookEmail(r.nyckel)) nya.push(r);
  if (nya.length === 0) return 0;
  const { amne, text } = mejl(nya);
  if (await skickaOpsMejl(amne, text)) return nya.length;
  for (const r of nya) await releaseWebhookEmail(r.nyckel);
  return 0;
}
