// Automatiskt mottagningskvitto för en ångeranmälan (ångra köp).
//
// Lagkrav sedan 19 juni 2026 (prop. 2025/26:84, distansavtalslagen): när kunden
// utövar sin ångerrätt via ångerfunktionen på sajten ska hen få ett AUTOMATISKT
// mottagningskvitto. Kvittot är bevis på att kunden ångrat — men INTE ett
// godkännande av returen. Den formuleringen står uttryckligen i mejlet.
//
// Returadressen får inte finnas i publik HTML → den ligger i lib/return-address.ts
// och renderas bara här, server-side. Samma adress/instruktioner som den manuella
// return-confirmation.tsx, så kund-upplevelsen är en röd tråd oavsett väg.

import { Column, Row, Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, formatSEK, text } from "./_layout";
import { RETURN_ADDRESS } from "../lib/return-address";

export interface WithdrawalReceiptItem {
  name: string;
  qty: number;
  lineMinor?: number;
}

export interface WithdrawalReceiptProps {
  caseId: string;
  orderNumber?: string;
  receivedAt: string; // pre-formaterad svensk datum/tid-sträng
  items: WithdrawalReceiptItem[];
  currency?: string;
}

export default function WithdrawalReceiptEmail({
  caseId,
  orderNumber,
  receivedAt,
  items,
  currency = "SEK",
}: WithdrawalReceiptProps) {
  const hasItems = Array.isArray(items) && items.length > 0;
  return (
    <EmailShell preview={`Vi har tagit emot din ångeranmälan (${caseId})`}>
      <Text style={text.h1}>Vi har tagit emot din ångeranmälan</Text>
      <Text style={text.body}>
        Tack! Det här är din bekräftelse på att vi tagit emot din anmälan om att ångra
        köpet — ett <strong>lagstadgat mottagningskvitto</strong> enligt distansavtalslagen.
        Spara det gärna.
      </Text>

      {/* Lagkrav: kvittot bekräftar mottagande, inte godkännande. */}
      <Section style={{ ...block.card, borderLeft: `4px solid ${BRAND.orange}` }}>
        <Row>
          <Column>
            <Text style={{ ...text.muted, margin: 0 }}>Ärendenummer</Text>
            <Text style={{ fontSize: "16px", fontWeight: 800, margin: "2px 0 0 0", color: BRAND.ink }}>
              {caseId}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...text.muted, margin: 0 }}>Mottaget</Text>
            <Text style={{ fontSize: "14px", fontWeight: 600, margin: "2px 0 0 0", color: BRAND.ink }}>
              {receivedAt}
            </Text>
          </Column>
        </Row>
        {orderNumber ? (
          <Text style={{ ...text.muted, margin: "10px 0 0 0" }}>
            Order: <strong style={{ color: BRAND.ink }}>{orderNumber}</strong>
          </Text>
        ) : null}
      </Section>

      <Text style={{ ...text.muted, margin: "0 0 16px 0" }}>
        Kvittot bekräftar att vi tagit emot din ångran. Det är inte ett godkännande av
        returen — vi behandlar ärendet och återkommer.
      </Text>

      <Text style={text.h2}>Det här ångrar du</Text>
      {hasItems ? (
        items.map((it, i) => (
          <Section
            key={i}
            style={{ borderBottom: `1px solid ${BRAND.line}`, padding: "10px 0" }}
          >
            <Row>
              <Column>
                <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                  {it.name}
                </Text>
                <Text style={{ fontSize: "12px", color: BRAND.muted, margin: "2px 0 0 0" }}>
                  Antal: {it.qty}
                </Text>
              </Column>
              {it.lineMinor && it.lineMinor > 0 ? (
                <Column align="right" style={{ width: "100px", verticalAlign: "top" }}>
                  <Text style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: BRAND.ink }}>
                    {formatSEK(it.lineMinor / 100, currency)}
                  </Text>
                </Column>
              ) : null}
            </Row>
          </Section>
        ))
      ) : (
        <Text style={text.body}>
          Vi har registrerat din anmälan{orderNumber ? ` för order ${orderNumber}` : ""}. Har
          du frågor om vilka artiklar den gäller, svara bara på det här mejlet.
        </Text>
      )}

      <Text style={text.h2}>Så här går du vidare</Text>
      <Text style={text.body}>
        <strong>1. Packa produkten säkert</strong> — använd helst originalförpackningen och
        lägg med en lapp med ärendenummer ({caseId}){orderNumber ? ` och ordernummer (${orderNumber})` : ""} och
        ditt namn.
      </Text>
      <Text style={text.body}>
        <strong>2. Skicka till returadressen nedan.</strong>
      </Text>
      <Section style={block.card}>
        <Text
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: BRAND.ink,
            margin: 0,
            lineHeight: "1.55",
            whiteSpace: "pre-line",
          }}
        >
          {RETURN_ADDRESS.formatted}
        </Text>
      </Section>
      <Text style={text.body}>
        <strong>Returfrakten betalas av dig som kund.</strong> Välj valfri leveranstjänst
        (PostNord, DHL, Schenker) — vi rekommenderar <strong>spårbar leverans</strong> så du
        har bevis på avsändning. Fyndplats ansvarar inte för förlorade returpaket.
      </Text>
      <Text style={text.body}>
        <strong>3. Svara på det här mejlet med spårningsnumret</strong> så håller vi koll på
        returen.
      </Text>

      <Text style={text.h2}>Återbetalning</Text>
      <Text style={text.body}>
        Vi återbetalar inom <strong>5–10 bankdagar</strong> efter att vi tagit emot och
        kontrollerat returen, till ditt ursprungliga betalmedel (kort, Klarna, Swish). Har du
        betalat frakt återbetalas även standardfrakten.
      </Text>

      {/* Reklamation ≠ ångra: vid fel/trasig vara står Fyndplats för returen. */}
      <Section style={{ ...block.card, background: "#F5FBF7", border: `1px solid #DDEFE4` }}>
        <Text style={{ ...text.body, fontWeight: 700, margin: "0 0 4px 0", color: BRAND.ink }}>
          Är varan trasig eller felaktig?
        </Text>
        <Text style={{ ...text.body, margin: 0 }}>
          Då är det en <strong>reklamation</strong>, inte en ångran — och då står{" "}
          <strong>Fyndplats för returfrakten</strong>. Svara på det här mejlet med en kort
          beskrivning och <strong>foton</strong> på felet, så löser vi det.
        </Text>
      </Section>

      <Text style={{ ...text.muted, marginTop: "16px" }}>
        Produkten ska vara oanvänd och i originalförpackning med alla tillbehör. Frågor? Svara
        på det här mejlet eller mejla{" "}
        <a href={`mailto:${BRAND.supportEmail}`} style={{ color: BRAND.orange2 }}>
          {BRAND.supportEmail}
        </a>
        .
      </Text>
    </EmailShell>
  );
}
