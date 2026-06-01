// GET|POST /api/admin/email-test
//
// Renders any of our transactional / lifecycle email templates with representative
// Swedish sample data and sends a test copy via Resend. Gated by proxy.ts
// (ADMIN_SECRET / fp_admin cookie) like the rest of /api/admin/*.
//
// Usage:
//   GET  /api/admin/email-test?key=<ADMIN_SECRET>&template=all&to=info@fyndplats.com
//   POST /api/admin/email-test            { template: "order-confirmation", to: "..." }
//
// `template=all` sends one of every template and returns a per-template result
// array with the Resend message id (or error). This is the same code the
// /admin/email-test page buttons call.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";

import OrderConfirmationEmail from "@/emails/order-confirmation";
import ShippingConfirmationEmail from "@/emails/shipping-confirmation";
import DeliveryNotificationEmail, { deliverySubject } from "@/emails/delivery-notification";
import RefundConfirmationEmail from "@/emails/refund-confirmation";
import ReturnConfirmationEmail from "@/emails/return-confirmation";
import NewsletterWelcomeEmail from "@/emails/newsletter-welcome";
import { renderAbandonedCart1 } from "@/emails/abandoned-cart-1";
import { renderAbandonedCart2 } from "@/emails/abandoned-cart-2";
import { renderAbandonedCart3 } from "@/emails/abandoned-cart-3";
import { unsubscribeUrl } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

const SAMPLE_IMG = "https://static.wixstatic.com/media/b379ce_63a816db6e8249f78138dd06edfe8ce9~mv2.jpg";
const ORDER_NO = "FP-10042";

// --- sample data -----------------------------------------------------------
const sampleItems = [
  { name: "12-pack Hjärteballonger – Röda & Peach Love", qty: 2, unitPrice: 83.99, lineTotal: 167.98, imageUrl: SAMPLE_IMG, variant: "12-pack" },
  { name: "LED Stringlights 10 m – Varmvit", qty: 1, unitPrice: 149.0, lineTotal: 149.0, imageUrl: SAMPLE_IMG },
];

type TemplateEntry = {
  label: string;
  subject: string;
  render: (to: string) => Promise<string> | string;
};

const TEMPLATES: Record<string, TemplateEntry> = {
  "order-confirmation": {
    label: "Orderbekräftelse",
    subject: `Tack för din beställning ${ORDER_NO}`,
    render: () =>
      render(
        OrderConfirmationEmail({
          firstName: "Leonard",
          orderNumber: ORDER_NO,
          orderDate: new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }),
          items: sampleItems,
          subtotal: 316.98,
          shipping: 0,
          discount: 20,
          total: 296.98,
          currency: "SEK",
          shippingAddress: { fullName: "Leonard Araz", addressLine: "Bergviksgatan 10", postalCode: "152 44", city: "Södertälje", country: "Sverige" },
          paymentMethod: "Kort (Visa ••42)",
          estimatedDelivery: "3–6 arbetsdagar",
        }),
      ),
  },
  "shipping-confirmation": {
    label: "Fraktbekräftelse / på väg",
    subject: `Ditt paket är på väg – order ${ORDER_NO}`,
    render: () =>
      render(
        ShippingConfirmationEmail({
          firstName: "Leonard",
          orderNumber: ORDER_NO,
          trackingNumber: "LP00472891SE",
          carrier: "PostNord",
          expectedArrival: "onsdag 4 juni",
          items: sampleItems.map((i) => ({ name: i.name, qty: i.qty, imageUrl: i.imageUrl })),
        }),
      ),
  },
  "delivery-notification": {
    label: "Leverans-/utlämnings-notis",
    subject: deliverySubject({ status: "available_for_pickup", pickupLocation: "ICA Maxi Södertälje", pickupCode: "482913" }),
    render: () =>
      render(
        DeliveryNotificationEmail({
          firstName: "Leonard",
          status: "available_for_pickup",
          pickupLocation: "ICA Maxi Södertälje",
          pickupCode: "482913",
          trackingNumber: "LP00472891SE",
          carrier: "PostNord",
        }),
      ),
  },
  "refund-confirmation": {
    label: "Återbetalning",
    subject: `Återbetalning bekräftad – order ${ORDER_NO}`,
    render: () =>
      render(
        RefundConfirmationEmail({
          firstName: "Leonard",
          orderNumber: ORDER_NO,
          refundAmount: 296.98,
          currency: "SEK",
          refundMethod: "Kort (Visa ••42)",
          refundReason: "Ångrat köp",
          expectedDays: 10,
        }),
      ),
  },
  "return-confirmation": {
    label: "Returbekräftelse (manuell)",
    subject: `Vi har tagit emot din returanmälan – order ${ORDER_NO}`,
    render: () =>
      render(
        ReturnConfirmationEmail({
          firstName: "Leonard",
          orderNumber: ORDER_NO,
          productName: "12-pack Hjärteballonger",
          expectedRefundDays: 10,
        }),
      ),
  },
  "newsletter-welcome": {
    label: "Nyhetsbrev-välkomst",
    subject: "Tack för att du prenumererar!",
    render: (to) => render(NewsletterWelcomeEmail({ unsubscribeUrl: unsubscribeUrl(to) })),
  },
  "abandoned-cart-1": {
    label: "Övergiven kundvagn – 1h",
    subject: "Du glömde något i kundvagnen",
    render: (to) =>
      renderAbandonedCart1({
        items: sampleItems.map((i) => ({ name: i.name, quantity: i.qty, imageUrl: i.imageUrl, priceMinor: Math.round(i.unitPrice * 100) })),
        recoverUrl: "https://www.fyndplats.se",
        subtotalMinor: 31698,
        currency: "SEK",
        unsubscribeUrl: unsubscribeUrl(to),
      }).html,
  },
  "abandoned-cart-2": {
    label: "Övergiven kundvagn – 24h (fri frakt)",
    subject: "Vi sparade din kundvagn — fri frakt",
    render: (to) =>
      renderAbandonedCart2({
        items: sampleItems.map((i) => ({ name: i.name, quantity: i.qty, imageUrl: i.imageUrl, priceMinor: Math.round(i.unitPrice * 100) })),
        recoverUrl: "https://www.fyndplats.se",
        subtotalMinor: 31698,
        currency: "SEK",
        unsubscribeUrl: unsubscribeUrl(to),
      }).html,
  },
  "abandoned-cart-3": {
    label: "Övergiven kundvagn – 72h (5% kod)",
    subject: "5% extra för att slutföra",
    render: (to) =>
      renderAbandonedCart3({
        items: sampleItems.map((i) => ({ name: i.name, quantity: i.qty, imageUrl: i.imageUrl, priceMinor: Math.round(i.unitPrice * 100) })),
        recoverUrl: "https://www.fyndplats.se",
        subtotalMinor: 31698,
        currency: "SEK",
        discountCode: "FP5-TEST-ABC123",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        unsubscribeUrl: unsubscribeUrl(to),
      }).html,
  },
};

async function sendOne(key: string, to: string): Promise<{ template: string; ok: boolean; resendId?: string; error?: string }> {
  const entry = TEMPLATES[key];
  if (!entry) return { template: key, ok: false, error: "unknown template" };
  try {
    const html = await entry.render(to);
    const sent = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject: `[TEST] ${entry.subject}`,
      html,
    });
    if (sent.error) return { template: key, ok: false, error: String(sent.error.message || sent.error) };
    return { template: key, ok: true, resendId: sent.data?.id };
  } catch (err) {
    return { template: key, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handle(template: string, to: string) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY missing" }, { status: 500 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "invalid 'to' address" }, { status: 400 });
  }
  if (template === "all") {
    const results = [];
    const keys = Object.keys(TEMPLATES);
    for (let i = 0; i < keys.length; i++) {
      // Resend allows 5 requests/second — space the batch out so a full run
      // doesn't trip the rate limit.
      if (i > 0) await new Promise((r) => setTimeout(r, 300));
      results.push(await sendOne(keys[i], to));
    }
    return NextResponse.json({ ok: results.every((r) => r.ok), to, results });
  }
  const result = await sendOne(template, to);
  return NextResponse.json({ ok: result.ok, to, results: [result] }, { status: result.ok ? 200 : 500 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return handle(url.searchParams.get("template") ?? "all", url.searchParams.get("to") ?? REPLY_TO);
}

export async function POST(request: Request) {
  let body: { template?: string; to?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* allow empty */
  }
  return handle(body.template ?? "all", body.to ?? REPLY_TO);
}
