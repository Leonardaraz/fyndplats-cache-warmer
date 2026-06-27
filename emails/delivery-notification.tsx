// emails/delivery-notification.tsx
//
// Branded delivery notification triggered by /api/sms-inbound. Replaces the
// carrier's "Ditt paket från AliExpress C/o ..." SMS with a Fyndplats-branded
// email so the customer never sees the dropshipping origin.
//
// Layout: reuses _layout EmailShell (same orange/char palette as the rest of
// the order/shipping/refund mails). Status drives the headline, body copy, and
// whether the pickup-code card is shown.

import { Link, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

// Mirrors lib/sms-parser SmsStatus — duplicated here so the email package has
// no upstream dependency on the parser internals.
export type DeliveryStatus =
  | "out_for_delivery"
  | "available_for_pickup"
  | "delivered"
  | "in_transit"
  | "exception";

export interface DeliveryNotificationProps {
  firstName: string;
  status: DeliveryStatus;
  pickupLocation?: string;
  pickupCode?: string;
  /** Upphämtningslänk från transportören (t.ex. PostNords l.postnord.com-länk) när
   *  SMS:et saknar sifferkod. Renderas som en "Hämta ditt paket"-knapp. */
  pickupUrl?: string;
  trackingNumber?: string;
  carrier?: string;
}

function statusHeadline(status: DeliveryStatus, pickupLocation?: string): string {
  switch (status) {
    case "available_for_pickup":
      return pickupLocation
        ? `Ditt paket är nu vid ${pickupLocation}!`
        : "Ditt paket är nu redo att hämtas!";
    case "delivered":
      return "Ditt paket har levererats!";
    case "out_for_delivery":
      return "Ditt paket är på väg till dig idag!";
    case "in_transit":
      return "Ditt paket är på väg!";
    case "exception":
      return "Det har hänt något med ditt paket";
  }
}

function statusBody(status: DeliveryStatus, pickupLocation?: string): string {
  switch (status) {
    case "available_for_pickup":
      return pickupLocation
        ? `Ditt paket finns nu att hämta vid ${pickupLocation}. Glöm inte legitimation.`
        : "Ditt paket finns nu redo för upphämtning hos ditt valda ombud. Glöm inte legitimation.";
    case "delivered":
      return "Vi hoppas att du blir nöjd! Saknas något eller stämmer inte ordern – svara på det här mejlet.";
    case "out_for_delivery":
      return "Paketet ligger på leveransbilen och beräknas levereras under dagen. Var beredd om du beställt mot kvittens.";
    case "in_transit":
      return "Vi har just fått besked att paketet är på väg till dig. Vi mejlar igen så fort det är framme.";
    case "exception":
      return "Transportören har rapporterat en händelse på ditt paket. Vi kollar redan vad som hänt – behöver du hjälp svarar du bara på det här mejlet.";
  }
}

export function deliverySubject(props: Pick<DeliveryNotificationProps, "status" | "pickupLocation" | "pickupCode">): string {
  // Email subject for Resend. Keep it short — Swedish phones truncate at ~40
  // chars on lock-screen previews.
  const { status, pickupLocation, pickupCode } = props;
  switch (status) {
    case "available_for_pickup": {
      const loc = pickupLocation ?? "ombudet";
      const codeFragment = pickupCode ? ` (hämtkod ${pickupCode})` : "";
      return `Ditt paket är nu vid ${loc}${codeFragment}`;
    }
    case "delivered":
      return "Ditt paket har levererats!";
    case "out_for_delivery":
      return "Ditt paket är på väg!";
    case "in_transit":
      return "Ditt paket är på väg!";
    case "exception":
      return "Uppdatering om ditt paket";
  }
}

export default function DeliveryNotificationEmail({
  firstName,
  status,
  pickupLocation,
  pickupCode,
  pickupUrl,
  trackingNumber,
  carrier,
}: DeliveryNotificationProps) {
  const headline = statusHeadline(status, pickupLocation);
  const body = statusBody(status, pickupLocation);
  const trackingUrl = trackingNumber
    ? `${BRAND.siteUrl}/sparning?tn=${encodeURIComponent(trackingNumber)}`
    : null;

  return (
    <EmailShell preview={headline}>
      <Text style={text.h1}>Hej {firstName}!</Text>
      <Text style={text.h2}>{headline}</Text>
      <Text style={text.body}>{body}</Text>

      {pickupCode ? (
        <Section style={block.card}>
          <Text style={{ ...text.muted, margin: 0 }}>Hämtkod</Text>
          <Text
            style={{
              fontSize: "36px",
              fontWeight: 900,
              margin: "6px 0 0 0",
              color: BRAND.cta,
              letterSpacing: "0.12em",
              textAlign: "center",
            }}
          >
            {pickupCode}
          </Text>
          {pickupLocation ? (
            <Text style={{ ...text.muted, margin: "12px 0 0 0", textAlign: "center" }}>
              Hämtas vid <strong style={{ color: BRAND.ink }}>{pickupLocation}</strong>
            </Text>
          ) : null}
        </Section>
      ) : null}

      {pickupUrl ? (
        <Section style={{ margin: "16px 0" }}>
          <Link href={pickupUrl} style={block.ctaButton}>
            Hämta ditt paket
          </Link>
          {carrier ? (
            <Text style={{ ...text.muted, margin: "10px 0 0 0" }}>
              Transportör: <strong style={{ color: BRAND.ink }}>{carrier}</strong>
            </Text>
          ) : null}
        </Section>
      ) : null}

      {trackingUrl ? (
        <Section style={{ margin: "16px 0" }}>
          <Link href={trackingUrl} style={block.ctaButton}>
            Spåra ditt paket
          </Link>
          {carrier ? (
            <Text style={{ ...text.muted, margin: "10px 0 0 0" }}>
              Transportör: <strong style={{ color: BRAND.ink }}>{carrier}</strong>
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Text style={{ ...text.muted, marginTop: "20px" }}>
        Behöver du hjälp? Svara på det här mejlet så hör vi av oss inom 24 timmar.
      </Text>
    </EmailShell>
  );
}
