// POST /api/contact
// Tar emot kontaktformuläret och skickar ett mejl till kundtjänst via Resend.
// Kundens e-post sätts som Reply-To så vi kan svara direkt från inkorgen.
//
// Bakgrund: formuläret öppnade tidigare en mailto:-länk i klienten. Det gör
// ingenting alls för besökare utan konfigurerad e-postklient (vanligt på desktop
// och mobiler utan mejlapp) → tappade meddelanden. Nu skickas mejlet server-side,
// så "Skicka meddelande" fungerar oavsett besökarens uppsättning.

import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Samma verifierade avsändardomän som nyhetsbrevet använder. Mejlet går till
// kundtjänst-inkorgen; Reply-To pekar på kunden så ett svar landar rätt.
const FROM = "Fyndplats <orders@fyndplats.se>";
const TO = "info@fyndplats.com";

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  let body: {
    fornamn?: string;
    efternamn?: string;
    epost?: string;
    meddelande?: string;
    foretag?: string; // honeypot — fylls bara av bottar
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: bottar fyller i det dolda fältet. Låtsas att allt gick bra men
  // skicka inget mejl.
  if ((body.foretag || "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const fornamn = (body.fornamn || "").trim().slice(0, 100);
  const efternamn = (body.efternamn || "").trim().slice(0, 100);
  const epost = (body.epost || "").trim().slice(0, 200);
  const meddelande = (body.meddelande || "").trim().slice(0, 5000);

  if (!fornamn || !efternamn || !meddelande) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (!isValidEmail(epost)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[contact] RESEND_API_KEY saknas — kan inte skicka meddelande");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  }

  const namn = `${fornamn} ${efternamn}`;
  const text = `${meddelande}\n\n— — —\nFrån: ${namn}\nE-post: ${epost}`;
  const html =
    `<p style="white-space:pre-wrap">${esc(meddelande)}</p>` +
    `<hr><p><strong>Från:</strong> ${esc(namn)}<br>` +
    `<strong>E-post:</strong> <a href="mailto:${esc(epost)}">${esc(epost)}</a></p>`;

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: TO,
      replyTo: epost,
      subject: `Kontaktformulär: ${namn}`,
      text,
      html,
    });
  } catch (e) {
    console.error("[contact] send failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
