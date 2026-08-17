// GET /api/admin/email-preview
//
// Renderar leverans-mejlet (shipping-confirmation) till HTML och returnerar det
// direkt — för att FÖRHANDSGRANSKA i webbläsaren. Skickar INGET mejl. Gated av
// proxy.ts (ADMIN_SECRET / fp_admin-cookie) som resten av /api/admin/*.
//
// Användning: öppna i webbläsaren (inloggad i /admin, eller med ?key=<ADMIN_SECRET>):
//   https://www.fyndplats.se/api/admin/email-preview
//
// Datan speglar order #10002:s andra sändning (vita västen) så du ser exakt hur
// den nya variant-raden ("12 st Vit") ser ut.
import { render } from "@react-email/render";
import ShippingConfirmationEmail from "@/emails/shipping-confirmation";
import DeliveryNotificationEmail from "@/emails/delivery-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VEST_IMG =
  "https://static.wixstatic.com/media/b379ce_c5f2e635f2774a6bb985bf4feb3fd949~mv2.jpg/v1/fit/w_1601,h_1601,q_90/file.jpg";

export async function GET(req: Request) {
  // ?mall=leverans → leveransmejlet ("ditt paket har levererats"), annars
  // fraktbekräftelsen som förut.
  const mall = new URL(req.url).searchParams.get("mall");

  if (mall === "leverans") {
    const html = await render(
      DeliveryNotificationEmail({
        firstName: "Alice",
        status: "delivered",
        orderNumber: "10042",
        items: [
          {
            name: "Klösträd i naturfiber med grotta, mysbädd och stege – 100 cm",
            qty: 1,
            unitPrice: 1459,
            lineTotal: 1459,
            variant: "Beige",
            imageUrl: VEST_IMG,
          },
          { name: "Kattlåda med tak, luktfilter och spade", qty: 2, unitPrice: 399, lineTotal: 798 },
        ],
        trackingNumber: "AP00824369096038",
        carrier: "Postnord",
      }),
    );
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const html = await render(
    ShippingConfirmationEmail({
      firstName: "Christer",
      orderNumber: "10002",
      trackingNumber: "AP00824369096038",
      carrier: "Postnord",
      items: [
        {
          name: "Träningsvästar för lag – numrerade sportvästar i lätt & snabbtorkande material",
          qty: 1,
          variant: "12 st Vit",
          imageUrl: VEST_IMG,
        },
      ],
    }),
  );
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
