// POST /api/contact
// Tar emot kontaktformuläret och skickar ett mejl till kundtjänst via Resend.
// Kundens e-post sätts som Reply-To så vi kan svara direkt från inkorgen.
//
// Bakgrund: formuläret öppnade tidigare en mailto:-länk i klienten. Det gör
// ingenting alls för besökare utan konfigurerad e-postklient (vanligt på desktop
// och mobiler utan mejlapp) → tappade meddelanden. Nu skickas mejlet server-side,
// så "Skicka meddelande" fungerar oavsett besökarens uppsättning.
//
// Produkten (2026-11-07): kunden kan peka ut vilken vara frågan gäller, i
// formuläret eller via produktsidans flik "Kontakta oss". Klienten skickar bara
// slugen och variantens id; namnet, länken och bilden i mejlet slås upp här
// (lib/kontakt/produkt.ts). Svarar Wix inte inom sex sekunder går mejlet ändå,
// med länken byggd ur slugen.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { giltigSlug, giltigVariant, kontaktMejl, produktUrl, type MejlProdukt } from "../../../lib/kontakt/kontakt";
import { hamtaKontaktProdukt } from "../../../lib/kontakt/produkt";
import { wixMejlBild } from "../../../lib/wix-media-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Samma verifierade avsändardomän som nyhetsbrevet använder. Mejlet går till
// kundtjänst-inkorgen; Reply-To pekar på kunden så ett svar landar rätt.
const FROM = "Fyndplats <orders@fyndplats.se>";
const TO = "info@fyndplats.com";

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Så länge väntar mejlet på produktens uppgifter innan det går med bara länken. */
const PRODUKT_VANTAR_MS = 6000;

async function mejlProdukt(slug: string, variantId: string | undefined): Promise<MejlProdukt> {
  // Klockan stängs av när uppslaget är klart, annars håller den funktionen vid
  // liv i sex sekunder efter svaret.
  let klocka: ReturnType<typeof setTimeout> | undefined;
  const tid = new Promise<"tid">((r) => {
    klocka = setTimeout(() => r("tid"), PRODUKT_VANTAR_MS);
  });
  try {
    const p = await Promise.race([hamtaKontaktProdukt(slug, variantId), tid]);
    if (p && p !== "tid") {
      return { typ: "hittad", namn: p.namn, url: p.url, pris: p.pris, bild: p.bild ? wixMejlBild(p.bild) : "", valtNamn: p.valtNamn, iLager: p.iLager };
    }
    if (p === "tid") console.warn("[contact] produktens uppgifter dröjde, mejlet går med länken");
  } catch (e) {
    console.warn("[contact] produkten gick inte att hämta:", (e as Error).message);
  } finally {
    clearTimeout(klocka);
  }
  return { typ: "okand", slug, url: produktUrl({ slug, variantId }) };
}

export async function POST(request: Request) {
  let body: {
    fornamn?: string;
    efternamn?: string;
    epost?: string;
    meddelande?: string;
    produkt?: unknown; // slugen, valfri
    variant?: unknown; // variantens id, valfritt
    hp?: string; // honeypot — icke-semantiskt namn så webbläsar-autofyll inte rör det
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: bottar fyller i det dolda fältet. Låtsas att allt gick bra men
  // skicka inget mejl.
  if ((body.hp || "").trim()) {
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
  // Ett ogiltigt värde räknas som ingen produkt; formuläret ska aldrig falla på den.
  const slug = giltigSlug(body.produkt) ? body.produkt : null;
  const variantId = slug && giltigVariant(body.variant) ? body.variant.toLowerCase() : undefined;
  const produkt = slug ? await mejlProdukt(slug, variantId) : null;
  const { subject, text, html } = kontaktMejl({ namn, epost, meddelande, produkt });

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: TO,
      replyTo: epost,
      subject,
      text,
      html,
    });
  } catch (e) {
    console.error("[contact] send failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
