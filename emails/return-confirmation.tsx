// Skickas när kund mejlat info@fyndplats.com och anmält en retur. Innehåller
// returadressen — den får INTE finnas i publik HTML, så den ligger i
// lib/return-address.ts och renderas endast server-side i mejlet.

import { Section, Text } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";
import { RETURN_ADDRESS } from "../lib/return-address";
import { COMPLAINT_SHORT, REFUND_TIME } from "../lib/retur-policy";

export interface ReturnConfirmationProps {
  firstName: string;
  orderNumber: string;
  productName?: string;
}

export default function ReturnConfirmationEmail({
  firstName,
  orderNumber,
  productName,
}: ReturnConfirmationProps) {
  return (
    <EmailShell preview={`Vi har tagit emot din returanmälan för order ${orderNumber}`}>
      <Text style={text.h1}>Hej {firstName}, vi har tagit emot din returanmälan</Text>
      <Text style={text.body}>
        Tack för ditt meddelande! Vi bekräftar att du vill returnera{" "}
        {productName ? <strong>{productName}</strong> : <>din produkt</>} från order{" "}
        <strong>{orderNumber}</strong>. Nedan hittar du returadressen och nästa steg.
      </Text>

      <Text style={text.h2}>Returadress</Text>
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

      <Text style={text.h2}>Så här gör du</Text>
      <Text style={text.body}>
        <strong>1. Packa produkten säkert.</strong> Använd helst originalförpackningen.
        Lägg med en lapp med ditt ordernummer ({orderNumber}) och namn så vi kan koppla
        returen rätt.
      </Text>
      <Text style={text.body}>
        <strong>2. Skicka till returadressen ovan.</strong> Returfrakten betalas av dig
        som kund — välj valfri leveranstjänst (PostNord, DHL, Schenker). Vi
        rekommenderar <strong>spårbar leverans</strong> så du har bevis på avsändning.
        Fyndplats ansvarar inte för förlorade returpaket.
      </Text>
      <Text style={text.body}>
        <strong>3. Svara på det här mejlet med spårningsnumret</strong> så håller vi koll
        på paketet.
      </Text>

      <Text style={text.h2}>Återbetalning</Text>
      <Text style={text.body}>
        Vi betalar tillbaka inom <strong>{REFUND_TIME}</strong> efter att vi tagit emot och
        kontrollerat produkten, till ursprungligt betalmedel (kort, Klarna, Swish). Hur snabbt
        pengarna syns på kontot beror sedan på din bank.
      </Text>

      <Text style={{ ...text.muted, marginTop: "16px" }}>
        Under de första 14 dagarna får du undersöka produkten som du hade gjort i en butik;
        har den hanterats mer än så kan ett skäligt värdeminskningsavdrag göras. Ångrar du
        under dag 15–30 gäller vårt frivilliga öppna köp, och då ska produkten vara oanvänd,
        komplett och i säljbart skick — då återbetalas produktens pris men inte frakten till
        dig. Det är dagen du anmälde returen som avgör vilken period som gäller, inte dagen
        paketet är tillbaka hos oss. {COMPLAINT_SHORT} Vid
        frågor — svara på det här mejlet eller mejla{" "}
        <a href={`mailto:${BRAND.supportEmail}`} style={{ color: BRAND.orange2 }}>
          {BRAND.supportEmail}
        </a>
        .
      </Text>
    </EmailShell>
  );
}
