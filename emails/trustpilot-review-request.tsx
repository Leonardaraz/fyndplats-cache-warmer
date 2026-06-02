// emails/trustpilot-review-request.tsx
//
// Branded recensions-förfrågan som går ut ~7 dagar efter leverans (cron
// /api/cron/trustpilot-invite). Ber kunden lämna ett omdöme på Trustpilot.
//
// Två lägen, samma template:
//   • Trustpilot AFS aktiverat (TRUSTPILOT_API_KEY satt) → Trustpilot skickar
//     sin EGEN inbjudan, och då används INTE den här mallen.
//   • Ingen AFS → vi mejlar själva via Resend och länkar till Trustpilots
//     evaluate-URL (`reviewUrl`), som för-fyller order-ID + e-post så omdömet
//     blir verifierat.
//
// Layout: återanvänder EmailShell (samma palett som order/frakt/refund-mejlen).

import { Link, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface TrustpilotReviewRequestProps {
  firstName: string;
  /** Trustpilot evaluate-URL med order-ID + e-post för-ifyllt. */
  reviewUrl: string;
  /** Ordernumret kunden känner igen (valfritt — visas om satt). */
  orderNumber?: string;
  /** Namn på en köpt produkt, för att göra mejlet konkret (valfritt). */
  productName?: string;
}

export function trustpilotReviewSubject(
  props: Pick<TrustpilotReviewRequestProps, "firstName">,
): string {
  // Kort ämnesrad — svenska telefoner kapar vid ~40 tecken på låsskärmen.
  return props.firstName
    ? `${props.firstName}, hur var din upplevelse?`
    : "Hur var din upplevelse hos Fyndplats?";
}

export default function TrustpilotReviewRequestEmail({
  firstName,
  reviewUrl,
  orderNumber,
  productName,
}: TrustpilotReviewRequestProps) {
  const greeting = firstName ? `Hej ${firstName}!` : "Hej!";
  const productLine = productName
    ? `Vi hoppas att du är nöjd med din ${productName}.`
    : "Vi hoppas att du är nöjd med ditt köp.";

  return (
    <EmailShell preview="Berätta vad du tyckte – lämna ett omdöme på Trustpilot">
      <Text style={text.h1}>{greeting}</Text>
      <Text style={text.body}>
        {productLine} Nu när paketet har hunnit fram skulle vi bli jätteglada om
        du ville dela din upplevelse med andra kunder.
      </Text>
      <Text style={text.body}>
        Det tar bara en minut och hjälper oss att bli ännu bättre. Ditt omdöme
        registreras på Trustpilot som ett <strong>verifierat köp</strong>.
      </Text>

      <Section style={{ margin: "24px 0", textAlign: "center" }}>
        <Link href={reviewUrl} style={block.ctaButton}>
          Lämna ett omdöme
        </Link>
      </Section>

      <Section style={block.card}>
        <Text style={{ ...text.muted, margin: 0, textAlign: "center" }}>
          Betygsätt oss på en skala 1–5
        </Text>
        <Text
          style={{
            fontSize: "28px",
            margin: "6px 0 0 0",
            color: BRAND.orange,
            letterSpacing: "0.18em",
            textAlign: "center",
          }}
        >
          ★★★★★
        </Text>
      </Section>

      {orderNumber ? (
        <Text style={{ ...text.muted, marginTop: "18px" }}>
          Gäller order <strong style={{ color: BRAND.ink }}>{orderNumber}</strong>.
        </Text>
      ) : null}

      <Text style={{ ...text.muted, marginTop: "8px" }}>
        Stämmer något inte med din order? Svara på det här mejlet så hjälper vi
        dig direkt – innan du lämnar ett omdöme.
      </Text>
    </EmailShell>
  );
}
