// Skickas när Wix `refund_created` triggas. Bekräftar att återbetalning är
// initierad till kundens ursprungliga betalmetod.

import { Column, Row, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, formatSEK, text } from "./_layout";

export interface RefundConfirmationProps {
  firstName: string;
  orderNumber: string;
  refundAmount: number;
  currency: string;
  refundMethod?: string;
  refundReason?: string;
  expectedDays?: number; // typiskt 3–10 bankdagar
}

export default function RefundConfirmationEmail({
  firstName,
  orderNumber,
  refundAmount,
  currency,
  refundMethod,
  refundReason,
  expectedDays = 10,
}: RefundConfirmationProps) {
  return (
    <EmailShell preview={`Din återbetalning för order ${orderNumber} är genomförd`}>
      <Text style={text.h1}>Hej {firstName}, din återbetalning är genomförd</Text>
      <Text style={text.body}>
        Vi har genomfört en återbetalning för order <strong>{orderNumber}</strong>.
        Pengarna är på väg tillbaka till din ursprungliga betalmetod.
      </Text>

      <Section style={block.card}>
        <Row>
          <Column>
            <Text style={{ ...text.muted, margin: 0 }}>Återbetalat belopp</Text>
            <Text style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 0 0", color: BRAND.cta }}>
              {formatSEK(refundAmount, currency)}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...text.muted, margin: 0 }}>Order</Text>
            <Text style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0 0 0", color: BRAND.ink }}>
              {orderNumber}
            </Text>
          </Column>
        </Row>
        {refundMethod ? (
          <>
            <Text style={{ ...text.muted, margin: "12px 0 0 0" }}>Betalningsmetod</Text>
            <Text style={{ fontSize: "14px", margin: "2px 0 0 0", color: BRAND.ink }}>
              {refundMethod}
            </Text>
          </>
        ) : null}
        {refundReason ? (
          <>
            <Text style={{ ...text.muted, margin: "12px 0 0 0" }}>Orsak</Text>
            <Text style={{ fontSize: "14px", margin: "2px 0 0 0", color: BRAND.ink }}>
              {refundReason}
            </Text>
          </>
        ) : null}
      </Section>

      <Text style={text.body}>
        Pengarna brukar synas på ditt konto inom <strong>{expectedDays} bankdagar</strong>,
        beroende på din bank och betalmetod. Det kan ibland ta lite längre tid om återbetalningen
        går via en utländsk bank.
      </Text>

      <Text style={{ ...text.muted, marginTop: "16px" }}>
        Om du inte ser beloppet efter {expectedDays} bankdagar – hör av dig till oss på{" "}
        <a href={`mailto:${BRAND.supportEmail}`} style={{ color: BRAND.orange2 }}>
          {BRAND.supportEmail}
        </a>{" "}
        så hjälper vi dig.
      </Text>
    </EmailShell>
  );
}
