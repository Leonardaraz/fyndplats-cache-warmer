// Skickas när Wix `order_shipped`/fulfillment triggas och paketet är på väg.
// Innehåller spårningsnummer som länkar till våra egna /sparning?tn=...

import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface ShippingItemSummary {
  name: string;
  qty: number;
  imageUrl?: string;
}

export interface ShippingConfirmationProps {
  firstName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  expectedArrival?: string;
  items: ShippingItemSummary[];
}

export default function ShippingConfirmationEmail({
  firstName,
  orderNumber,
  trackingNumber,
  carrier,
  expectedArrival,
  items,
}: ShippingConfirmationProps) {
  const trackingUrl = trackingNumber
    ? `${BRAND.siteUrl}/sparning?tn=${encodeURIComponent(trackingNumber)}`
    : null;

  return (
    <EmailShell preview={`Ditt paket från Fyndplats är på väg (order ${orderNumber})`}>
      <Text style={text.h1}>Hej {firstName}, ditt paket är skickat!</Text>
      <Text style={text.body}>
        Vi har just skickat iväg din beställning <strong>{orderNumber}</strong>.
        {expectedArrival ? (
          <>
            {" "}Du kan vänta dig leverans omkring <strong>{expectedArrival}</strong>.
          </>
        ) : null}
      </Text>

      {trackingUrl ? (
        <Section style={block.card}>
          <Text style={{ ...text.muted, margin: 0 }}>Spårningsnummer</Text>
          <Text style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 12px 0", color: BRAND.ink, letterSpacing: "0.04em" }}>
            {trackingNumber}
          </Text>
          {carrier ? (
            <Text style={{ ...text.muted, margin: "0 0 12px 0" }}>
              Transportör: <strong style={{ color: BRAND.ink }}>{carrier}</strong>
            </Text>
          ) : null}
          <Link href={trackingUrl} style={block.ctaButton}>
            Spåra ditt paket
          </Link>
        </Section>
      ) : (
        <Section style={block.card}>
          <Text style={{ ...text.body, margin: 0 }}>
            Spårningsnummer skickas så snart transportören skannat paketet.
          </Text>
        </Section>
      )}

      {items.length > 0 ? (
        <>
          <Text style={text.h2}>Innehåll i sändningen</Text>
          {items.map((it, i) => (
            <Section
              key={i}
              style={{ borderBottom: `1px solid ${BRAND.line}`, padding: "10px 0" }}
            >
              <Row>
                {it.imageUrl ? (
                  <Column style={{ width: "56px", verticalAlign: "top" }}>
                    <Img
                      src={it.imageUrl}
                      alt={it.name}
                      width="48"
                      height="48"
                      style={{ borderRadius: "8px", border: `1px solid ${BRAND.line}`, objectFit: "cover" }}
                    />
                  </Column>
                ) : null}
                <Column>
                  <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                    {it.name}
                  </Text>
                  <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>
                    Antal: {it.qty}
                  </Text>
                </Column>
              </Row>
            </Section>
          ))}
        </>
      ) : null}

      <Text style={{ ...text.muted, marginTop: "20px" }}>
        Tracking-statusen uppdateras automatiskt på{" "}
        <Link href={`${BRAND.siteUrl}/sparning`} style={{ color: BRAND.orange2 }}>
          fyndplats.se/sparning
        </Link>{" "}
        – det kan dröja 1–2 dagar innan första skanningen syns.
      </Text>
    </EmailShell>
  );
}
