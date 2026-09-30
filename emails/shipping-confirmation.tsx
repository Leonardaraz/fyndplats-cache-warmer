// Skickas när Wix `order_shipped`/fulfillment triggas och paketet är på väg.
// Innehåller spårningsnummer som länkar till våra egna /sparning?tn=...
// Går ordern i flera paket listas alla nummer i samma mejl (`shipments`),
// se lib/shipping-email-batch.ts.

import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface ShippingItemSummary {
  name: string;
  qty: number;
  imageUrl?: string;
  variant?: string;
}

export interface ShipmentRef {
  trackingNumber: string;
  carrier?: string;
  /** Produkterna i just det här paketet (bild, namn, antal). */
  items?: ShippingItemSummary[];
}

export interface ShippingConfirmationProps {
  firstName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  /** Alla paket i ordern. Med fler än ett visas en rad per paket. */
  shipments?: ShipmentRef[];
  expectedArrival?: string;
  items: ShippingItemSummary[];
}

function ProduktRad({ it, bild = 48 }: { it: ShippingItemSummary; bild?: number }) {
  return (
    <Row>
      {it.imageUrl ? (
        <Column style={{ width: `${bild + 8}px`, verticalAlign: "top" }}>
          <Img
            src={it.imageUrl}
            alt={it.name}
            width={String(bild)}
            height={String(bild)}
            style={{ borderRadius: "8px", border: `1px solid ${BRAND.line}`, objectFit: "cover" }}
          />
        </Column>
      ) : null}
      <Column>
        <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>{it.name}</Text>
        {it.variant ? (
          <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>{it.variant}</Text>
        ) : null}
        <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>Antal: {it.qty}</Text>
      </Column>
    </Row>
  );
}

export default function ShippingConfirmationEmail({
  firstName,
  orderNumber,
  trackingNumber,
  carrier,
  shipments,
  expectedArrival,
  items,
}: ShippingConfirmationProps) {
  const sparUrl = (tn: string) => `${BRAND.siteUrl}/sparning?tn=${encodeURIComponent(tn)}`;
  const trackingUrl = trackingNumber ? sparUrl(trackingNumber) : null;
  const flera = shipments && shipments.length > 1 ? shipments : null;
  // Har varje paket sina egna produkter visas de i paketet, inte i en lista under.
  const produkterPerPaket = Boolean(flera && flera.every((s) => s.items && s.items.length > 0));

  return (
    <EmailShell
      preview={
        flera
          ? `Dina ${flera.length} paket från Fyndplats är på väg (order ${orderNumber})`
          : `Ditt paket från Fyndplats är på väg (order ${orderNumber})`
      }
    >
      <Text style={text.h1}>
        {flera ? `Hej ${firstName}, dina paket är skickade!` : `Hej ${firstName}, ditt paket är skickat!`}
      </Text>
      <Text style={text.body}>
        Vi har just skickat iväg din beställning <strong>{orderNumber}</strong>
        {flera ? <> i {flera.length} paket. Varje paket har ett eget spårningsnummer.</> : "."}
        {expectedArrival ? (
          <>
            {" "}Du kan vänta dig leverans omkring <strong>{expectedArrival}</strong>.
          </>
        ) : null}
      </Text>

      {flera ? (
        <Section style={block.card}>
          {flera.map((s, i) => (
            <Section
              key={s.trackingNumber}
              style={i > 0 ? { borderTop: `1px solid ${BRAND.line}`, paddingTop: "12px", marginTop: "12px" } : undefined}
            >
              <Text style={{ ...text.muted, margin: 0 }}>
                Paket {i + 1} av {flera.length}
                {s.carrier ? ` · ${s.carrier}` : ""}
              </Text>
              <Text style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 10px 0", color: BRAND.ink, letterSpacing: "0.04em" }}>
                {s.trackingNumber}
              </Text>
              {produkterPerPaket
                ? s.items!.map((it, j) => (
                    <Section key={j} style={{ margin: "0 0 10px 0" }}>
                      <ProduktRad it={it} bild={56} />
                    </Section>
                  ))
                : null}
              <Link href={sparUrl(s.trackingNumber)} style={block.ctaButton}>
                Spåra paket {i + 1}
              </Link>
            </Section>
          ))}
        </Section>
      ) : trackingUrl ? (
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

      {items.length > 0 && !produkterPerPaket ? (
        <>
          <Text style={text.h2}>Innehåll i sändningen</Text>
          {items.map((it, i) => (
            <Section key={i} style={{ borderBottom: `1px solid ${BRAND.line}`, padding: "10px 0" }}>
              <ProduktRad it={it} />
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
