// Orderbekräftelse — skickas direkt när Wix `order_created` triggas.
// Kunden får en sammanfattning av order, leverans och betalning.

import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { BRAND, EmailShell, block, formatSEK, text } from "./_layout";

export interface OrderLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
  variant?: string;
}

export interface OrderAddress {
  fullName?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface OrderConfirmationProps {
  firstName: string;
  orderNumber: string;
  orderDate: string; // pre-formaterad svensk datum-sträng
  items: OrderLineItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  currency: string;
  shippingAddress: OrderAddress;
  paymentMethod?: string;
  estimatedDelivery?: string;
  orderUrl?: string;
}

const rowStyle = {
  borderBottom: `1px solid ${BRAND.line}`,
  padding: "12px 0",
};

const summaryRow = {
  fontSize: "14px",
  color: BRAND.ink,
  padding: "4px 0",
};

export default function OrderConfirmationEmail({
  firstName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  discount,
  total,
  currency,
  shippingAddress,
  paymentMethod,
  estimatedDelivery,
  orderUrl,
}: OrderConfirmationProps) {
  return (
    <EmailShell preview={`Tack för din beställning ${orderNumber} hos Fyndplats!`}>
      <Text style={text.h1}>Tack {firstName}!</Text>
      <Text style={text.body}>
        Vi har tagit emot din beställning och börjar förbereda den direkt.
        Du får ett mejl till så snart paketet är på väg.
      </Text>

      <Section style={block.card}>
        <Row>
          <Column>
            <Text style={{ ...text.muted, margin: 0 }}>Ordernummer</Text>
            <Text style={{ fontSize: "16px", fontWeight: 800, margin: "2px 0 0 0", color: BRAND.ink }}>
              {orderNumber}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...text.muted, margin: 0 }}>Beställningsdatum</Text>
            <Text style={{ fontSize: "14px", fontWeight: 600, margin: "2px 0 0 0", color: BRAND.ink }}>
              {orderDate}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={text.h2}>Din beställning</Text>
      {items.map((it, i) => (
        <Section key={i} style={rowStyle}>
          <Row>
            {it.imageUrl ? (
              <Column style={{ width: "64px", verticalAlign: "top" }}>
                <Img
                  src={it.imageUrl}
                  alt={it.name}
                  width="56"
                  height="56"
                  style={{ borderRadius: "8px", border: `1px solid ${BRAND.line}`, objectFit: "cover" }}
                />
              </Column>
            ) : null}
            <Column>
              <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                {it.name}
              </Text>
              {it.variant ? (
                <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>
                  {it.variant}
                </Text>
              ) : null}
              <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>
                Antal: {it.qty} · {formatSEK(it.unitPrice, currency)} / st
              </Text>
            </Column>
            <Column align="right" style={{ width: "100px", verticalAlign: "top" }}>
              <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                {formatSEK(it.lineTotal, currency)}
              </Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Section style={{ marginTop: "12px" }}>
        <Row style={summaryRow}>
          <Column><Text style={{ margin: 0, fontSize: "14px" }}>Delsumma</Text></Column>
          <Column align="right">
            <Text style={{ margin: 0, fontSize: "14px" }}>{formatSEK(subtotal, currency)}</Text>
          </Column>
        </Row>
        <Row style={summaryRow}>
          <Column><Text style={{ margin: 0, fontSize: "14px" }}>Frakt</Text></Column>
          <Column align="right">
            <Text style={{ margin: 0, fontSize: "14px" }}>
              {shipping > 0 ? formatSEK(shipping, currency) : "Fri frakt"}
            </Text>
          </Column>
        </Row>
        {discount && discount > 0 ? (
          <Row style={summaryRow}>
            <Column><Text style={{ margin: 0, fontSize: "14px" }}>Rabatt</Text></Column>
            <Column align="right">
              <Text style={{ margin: 0, fontSize: "14px", color: BRAND.orange2 }}>
                −{formatSEK(discount, currency)}
              </Text>
            </Column>
          </Row>
        ) : null}
        <Hr style={{ borderColor: BRAND.line, margin: "10px 0" }} />
        <Row style={{ ...summaryRow, padding: "8px 0" }}>
          <Column>
            <Text style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: BRAND.ink }}>
              Totalt
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: BRAND.cta }}>
              {formatSEK(total, currency)}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ marginTop: "8px" }}>
        <Row>
          <Column style={{ verticalAlign: "top", paddingRight: "12px" }}>
            <Text style={text.h2}>Leveransadress</Text>
            <Text style={{ fontSize: "14px", margin: 0, lineHeight: "1.5", color: BRAND.ink }}>
              {shippingAddress.fullName ?? ""}
              {shippingAddress.fullName ? <br /> : null}
              {shippingAddress.addressLine ?? ""}
              {shippingAddress.addressLine ? <br /> : null}
              {[shippingAddress.postalCode, shippingAddress.city].filter(Boolean).join(" ")}
              {shippingAddress.country ? <><br />{shippingAddress.country}</> : null}
            </Text>
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            <Text style={text.h2}>Betalning</Text>
            <Text style={{ fontSize: "14px", margin: 0, lineHeight: "1.5", color: BRAND.ink }}>
              {paymentMethod ?? "Betalning bekräftad"}
            </Text>
            {estimatedDelivery ? (
              <>
                <Text style={text.h2}>Beräknad leverans</Text>
                <Text style={{ fontSize: "14px", margin: 0, color: BRAND.ink }}>
                  {estimatedDelivery}
                </Text>
              </>
            ) : null}
          </Column>
        </Row>
      </Section>

      {orderUrl ? (
        <Section style={{ textAlign: "center", margin: "28px 0 8px 0" }}>
          <Link href={orderUrl} style={block.ctaButton}>
            Visa din beställning
          </Link>
        </Section>
      ) : null}

      <Text style={{ ...text.muted, marginTop: "20px" }}>
        Har du frågor om din order? Svara på det här mejlet eller kontakta oss på{" "}
        <Link href={`mailto:${BRAND.supportEmail}`} style={{ color: BRAND.orange2 }}>
          {BRAND.supportEmail}
        </Link>.
      </Text>
      <Text style={{ ...text.muted, marginTop: "4px" }}>
        Ångrat dig? Du har 14 dagars ångerrätt – ångra enkelt på{" "}
        <Link href="https://www.fyndplats.se/angra-kop" style={{ color: BRAND.orange2 }}>
          fyndplats.se/angra-kop
        </Link>
        .
      </Text>
    </EmailShell>
  );
}
