// Skickas för hand när en kund mejlat info@fyndplats.com och anmält en retur.
// Stegen och returadressen delas med kvittot från ångerfunktionen
// (emails/_retur.tsx). Returadressen är leverantörens returlager
// (lib/returadress.ts) och skickas med bara när vi vet vilket returlager
// varorna ska till. Utan den lovar mejlet att vi mejlar adressen inom 1
// arbetsdag.

import { Text } from "@react-email/components";
import { BRAND, EmailShell, text } from "./_layout";
import { ReturSkicka, ReturSparning } from "./_retur";
import type { Returadress } from "../lib/returadress";
import { COMPLAINT_SHORT, REFUND_TIME, AVGIFT_SENTENCE, POSTA_INOM_DAGAR } from "../lib/retur-policy";

export interface ReturnConfirmationProps {
  firstName: string;
  orderNumber: string;
  productName?: string;
  /** Returlagrets adress, eller null: då lovar mejlet att den kommer inom 1 arbetsdag. */
  returadress?: Returadress | null;
}

export default function ReturnConfirmationEmail({
  firstName,
  orderNumber,
  productName,
  returadress = null,
}: ReturnConfirmationProps) {
  return (
    <EmailShell preview={`Vi har tagit emot din returanmälan för order ${orderNumber}`}>
      <Text style={text.h1}>Hej {firstName}, vi har tagit emot din returanmälan</Text>
      <Text style={text.body}>
        Tack för ditt meddelande! Vi bekräftar att du vill returnera{" "}
        {productName ? <strong>{productName}</strong> : <>din produkt</>} från order{" "}
        <strong>{orderNumber}</strong>. Nedan hittar du{" "}
        {returadress ? "returadressen och nästa steg" : "nästa steg"}.
      </Text>

      <Text style={text.h2}>Så här gör du</Text>
      <Text style={text.body}>
        <strong>1. Packa produkten säkert.</strong> Använd helst originalförpackningen.
        Lägg med en lapp med ditt ordernummer ({orderNumber}) och namn så vi kan koppla
        returen rätt.
      </Text>
      <ReturSkicka steg={2} returadress={returadress} />
      <ReturSparning steg={3} />

      <Text style={text.h2}>Återbetalning</Text>
      <Text style={text.body}>
        Vi betalar tillbaka inom <strong>{REFUND_TIME}</strong> efter att vi tagit emot och
        kontrollerat produkten, till ditt ursprungliga betalmedel via Klarna. Hur snabbt
        pengarna syns på kontot beror sedan på din bank.
      </Text>
      <Text style={text.body}>{AVGIFT_SENTENCE}</Text>

      <Text style={{ ...text.muted, marginTop: "16px" }}>
        Under de första 14 dagarna får du undersöka produkten som du hade gjort i en butik;
        har den hanterats mer än så kan ett skäligt värdeminskningsavdrag göras. Ångrar du
        under dag 15–30 gäller vårt frivilliga öppna köp, och då ska produkten vara oanvänd,
        komplett och i säljbart skick — då återbetalas produktens pris men inte frakten till
        dig, och returen ska postas inom {POSTA_INOM_DAGAR} dagar från att du fått returadressen.
        Det är dagen du anmälde returen som avgör vilken period som gäller, inte dagen
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
