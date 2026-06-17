// POST /api/resend-webhook
//
// Tar emot Resends webhooks (email.bounced + email.complained) och mejlar
// info@fyndplats.com med en sammanfattning så Leonard vet direkt om en
// kund inte fick sitt mejl (bounce) eller om någon markerat avsändaren som
// spam (complaint).
//
// Registrera i Resend → Webhooks → + Add → URL = https://www.fyndplats.se/api/resend-webhook
// Events: email.bounced + email.complained.
// Resend ger en signing-secret (whsec_…) — lägg den som RESEND_WEBHOOK_SECRET
// i Vercel-env för att aktivera signatur-verifiering. Utan secret accepterar
// vi händelser men loggar en varning.
//
// Säkerhet: signature-verifiering via Svix-formatet (id.timestamp.body, HMAC-
// SHA256 med secret). Misslyckas → 401. Saknar config → 202 med varning så
// Resend inte retry:ar oändligt.

import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTIFY_TO = "info@fyndplats.com";
const FROM = "Fyndplats Alerts <orders@fyndplats.se>";

// Resend / Svix signatur-format:
//   svix-signature: "v1,<base64-sig>" (kan vara flera space-separerade)
//   signed payload: `${svix-id}.${svix-timestamp}.${rawBody}`
//   secret-format: "whsec_<base64>" → base64-dekoda värdet efter prefixet
function verifySvix(req: NextRequest, rawBody: string, secret: string): boolean {
  const id = req.headers.get("svix-id");
  const ts = req.headers.get("svix-timestamp");
  const sigHeader = req.headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret, "utf8");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${ts}.${rawBody}`)
    .digest("base64");
  const expectedBuf = Buffer.from(expected, "utf8");
  // sigHeader kan vara "v1,SIG1 v1,SIG2" — acceptera om någon matchar
  const candidates = sigHeader.split(" ").map((s) => s.replace(/^v1,/, ""));
  for (const c of candidates) {
    const cBuf = Buffer.from(c, "utf8");
    if (cBuf.length === expectedBuf.length && crypto.timingSafeEqual(cBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Optional signature verification
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    if (!verifySvix(req, rawBody, secret)) {
      console.warn("[resend-webhook] Ogiltig signatur — avvisar");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn(
      "[resend-webhook] RESEND_WEBHOOK_SECRET saknas — accepterar OVERIFIERAT (sätt secret i Vercel-env)",
    );
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const type = String(event.type ?? "");
  if (type !== "email.bounced" && type !== "email.complained") {
    // Acka tyst — vi prenumererar bara på dessa men Resend kan skicka fler.
    return NextResponse.json({ received: true, ignored: type });
  }

  const data = (event.data ?? {}) as Record<string, unknown>;
  const to = Array.isArray(data.to)
    ? (data.to as string[]).join(", ")
    : typeof data.to === "string"
    ? data.to
    : "—";
  const subject = (data.subject as string) ?? "(ingen subject)";
  const from = (data.from as string) ?? "—";
  const bounce = (data.bounce ?? {}) as { message?: string; type?: string; subType?: string };
  const reason = bounce.message ?? (data as { reason?: string }).reason ?? "—";
  const when = (data.created_at as string) ?? (event.created_at as string) ?? "—";

  const isBounce = type === "email.bounced";
  const alertSubject = isBounce
    ? `⚠️ Bounce: mejl till ${to} kom inte fram`
    : `🚨 Spam-klagomål: ${to} markerade som skräppost`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
  <h2 style="color:${isBounce ? "#dc2626" : "#b45309"};margin:0 0 16px">
    ${isBounce ? "Bounce-rapport" : "Spam-klagomål"}
  </h2>
  <p style="color:#555;margin:0 0 24px">
    ${isBounce
      ? "Mejlet nedan nådde aldrig fram till kunden. Kontakta dem på annat sätt (SMS, telefon) och rätta deras mejladress i Wix om det var en typo."
      : "En mottagare markerade ditt mejl som skräppost. Inga åtgärder behövs vid enstaka händelse — men om det blir ett mönster bör mejl-innehåll/frekvens granskas."}
  </p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <tr style="background:#f9fafb"><td style="padding:10px 14px;font-weight:600;width:140px">Typ</td><td style="padding:10px 14px">${type}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;border-top:1px solid #e5e7eb">Mottagare</td><td style="padding:10px 14px;border-top:1px solid #e5e7eb">${to}</td></tr>
    <tr style="background:#f9fafb"><td style="padding:10px 14px;font-weight:600;border-top:1px solid #e5e7eb">Avsändare</td><td style="padding:10px 14px;border-top:1px solid #e5e7eb">${from}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;border-top:1px solid #e5e7eb">Subject</td><td style="padding:10px 14px;border-top:1px solid #e5e7eb">${subject}</td></tr>
    <tr style="background:#f9fafb"><td style="padding:10px 14px;font-weight:600;border-top:1px solid #e5e7eb">Anledning</td><td style="padding:10px 14px;border-top:1px solid #e5e7eb">${reason}</td></tr>
    <tr><td style="padding:10px 14px;font-weight:600;border-top:1px solid #e5e7eb">Tid</td><td style="padding:10px 14px;border-top:1px solid #e5e7eb">${when}</td></tr>
  </table>
  <p style="color:#9ca3af;margin:24px 0 0;font-size:12px">
    Auto-genererat från Resend-webhook. Du kan stänga av notiserna i Resend → Webhooks om de blir för många.
  </p>
</body></html>`;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[resend-webhook] RESEND_API_KEY saknas — kan inte mejla notifiering");
    return NextResponse.json({ received: true, notified: false, reason: "no_resend_key" });
  }

  try {
    const resend = new Resend(resendKey);
    const sent = await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      subject: alertSubject,
      html,
    });
    if (sent.error) {
      console.error("[resend-webhook] Notify-mejl fel", sent.error);
      // Acka ändå (200) så Resend inte retry:ar i oändlighet
      return NextResponse.json({ received: true, notified: false, error: String(sent.error) });
    }
    console.log(
      `[resend-webhook] Notified ${type} → ${to} (resendId=${sent.data?.id})`,
    );
    return NextResponse.json({ received: true, notified: true, resendId: sent.data?.id });
  } catch (err) {
    console.error("[resend-webhook] Notify-mejl exception", err);
    return NextResponse.json({ received: true, notified: false });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "resend-webhook",
    listens: ["email.bounced", "email.complained"],
    signatureVerification: process.env.RESEND_WEBHOOK_SECRET
      ? "enabled"
      : "disabled (set RESEND_WEBHOOK_SECRET in Vercel)",
    notifyTo: NOTIFY_TO,
  });
}
