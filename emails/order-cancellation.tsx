// Skickas när Wix `order_canceled` triggas. Bekräftar att ordern är avbruten
// och informerar om eventuell automatisk återbetalning. För Klarna-orders
// nämner vi att Klarna-fakturan/återbetalningen sköts automatiskt av Klarna.

import { Column, Link, Row, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, formatSEK, text } from "./_layout";

export interface OrderCancellationProps {
  firstName: string;
  orderNumber: string;
  cancellationDate?: string; // pre-formaterad svensk datum-sträng
  totalAmount?: number;
  currency: string;
  paymentMethod?: string; // t.ex. "Klarna", "Klarna Pay Later", "Klarna Pay Now"
  cancellationReason?: string;
  refundInitiated?: boolean; // sätts true om Wix initierar refund samtidigt
}

function isKlarnaMethod(method?: string): boolean {
  if (!method) return false;
  return /klarna/i.test(method);
}

export default function OrderCancellationEmail({
  firstName,
  orderNumber,
  cancellationDate,
  totalAmount,
  currency,
  paymentMethod,
  cancellationReason,
  refundInitiated,
}: OrderCancellationProps) {
  const klarna = isKlarnaMethod(paymentMethod);

  return (
    <EmailShell preview={`Din beställning ${orderNumber} har avbrutits`}>
      <Text style={text.h1}>Hej {firstName}, din beställning är avbruten</Text>
      <Text style={text.body}>
        Vi har avbrutit din beställning <strong>{orderNumber}</strong>. Inga varor
        kommer att skickas och ingen leverans förväntas.
      </Text>

      <Section style={block.card}>
        <Row>
          <Column>
            <Text style={{ ...text.muted, margin: 0 }}>Order</Text>
            <Text style={{ fontSize: "16px", fontWeight: 800, margin: "2px 0 0 0", color: BRAND.ink }}>
              {orderNumber}
            </Text>
          </Column>
          {cancellationDate ? (
            <Column align="right">
              <Text style={{ ...text.muted, margin: 0 }}>Avbruten</Text>
              <Text style={{ fontSize: "14px", fontWeight: 600, margin: "2px 0 0 0", color: BRAND.ink }}>
                {cancellationDate}
              </Text>
            </Column>
          ) : null}
        </Row>
        {typeof totalAmount === "number" && totalAmount > 0 ? (
          <>
            <Text style={{ ...text.muted, margin: "12px 0 0 0" }}>Belopp</Text>
            <Text style={{ fontSize: "18px", fontWeight: 700, margin: "2px 0 0 0", color: BRAND.ink }}>
              {formatSEK(totalAmount, currency)}
            </Text>
          </>
        ) : null}
        {paymentMethod ? (
          <>
            <Text style={{ ...text.muted, margin: "12px 0 0 0" }}>Betalningsmetod</Text>
            <Text style={{ fontSize: "14px", margin: "2px 0 0 0", color: BRAND.ink }}>
              {paymentMethod}
            </Text>
          </>
        ) : null}
        {cancellationReason ? (
          <>
            <Text style={{ ...text.muted, margin: "12px 0 0 0" }}>Orsak</Text>
            <Text style={{ fontSize: "14px", margin: "2px 0 0 0", color: BRAND.ink }}>
              {cancellationReason}
            </Text>
          </>
        ) : null}
      </Section>

      {klarna ? (
        <Text style={text.body}>
          Eftersom du betalat med <strong>Klarna</strong> hanteras
          avbokningen automatiskt av dem. Om du redan hunnit få en Klarna-faktura
          eller dragning kommer Klarna att avbryta eller återbetala beloppet
          inom kort — du behöver inte göra något själv. Håll utkik efter ett
          meddelande från Klarna med detaljer.
        </Text>
      ) : refundInitiated ? (
        <Text style={text.body}>
          Vi har påbörjat en återbetalning till din ursprungliga betalmetod.
          Pengarna brukar synas på ditt konto inom 3–10 bankdagar beroende på
          din bank.
        </Text>
      ) : (
        <Text style={text.body}>
          Om någon betalning hade hunnit dras kommer den att återbetalas inom
          kort. Du får ett separat meddelande när återbetalningen är genomförd.
        </Text>
      )}

      <Text style={text.body}>
        Vill du beställa något annat hittar du vårt sortiment på{" "}
        <Link href={BRAND.siteUrl} style={{ color: BRAND.orange2 }}>
          fyndplats.se
        </Link>
        .
      </Text>

      <Text style={{ ...text.muted, marginTop: "16px" }}>
        Har du frågor om avbokningen? Hör av dig till oss på{" "}
        <Link href={`mailto:${BRAND.supportEmail}`} style={{ color: BRAND.orange2 }}>
          {BRAND.supportEmail}
        </Link>{" "}
        så hjälper vi dig.
      </Text>
    </EmailShell>
  );
}
