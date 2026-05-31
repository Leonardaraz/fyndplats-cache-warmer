// POST /api/newsletter-signup
// 1. Validerar e-post + GDPR-samtycke
// 2. Sparar prenumeranten (lib/newsletter → Postgres)
// 3. Skickar ett bekräftelsemejl via Resend (brand-shell-mallen)
//
// Robust: om Resend inte är konfigurerat (lokal dev utan RESEND_API_KEY) eller
// mejlet fallerar, lagras prenumeranten ändå och vi returnerar ok — anmälan får
// inte gå förlorad bara för att bekräftelsemejlet strular.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { subscribe, unsubscribeUrl, isValidEmail } from "@/lib/newsletter";
import NewsletterWelcomeEmail from "@/emails/newsletter-welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

export async function POST(request: Request) {
  let body: { email?: string; consent?: boolean; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const consent = body.consent === true;
  const source = (body.source || "home").slice(0, 40);

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: "consent_required" }, { status: 400 });
  }

  // 1 + 2: spara prenumeranten
  let result;
  try {
    result = await subscribe(email, source, consent);
  } catch (e) {
    console.error("[newsletter] subscribe failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 500 });
  }
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  // 3: bekräftelsemejl (best-effort). Skicka bara till nya prenumeranter så vi
  // inte spammar någon som klickar igen.
  if (!result.already && process.env.RESEND_API_KEY) {
    try {
      const html = await render(
        NewsletterWelcomeEmail({ unsubscribeUrl: unsubscribeUrl(email) })
      );
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: FROM,
        to: email,
        replyTo: REPLY_TO,
        subject: "Tack för att du prenumererar!",
        html,
      });
    } catch (e) {
      console.error("[newsletter] confirmation email failed:", (e as Error).message);
      // Svälj felet — prenumerationen är redan sparad.
    }
  }

  return NextResponse.json({ ok: true, already: result.already });
}
