// Inloggningsmejlet för medlemskontot: en länk och samma kod i klartext.
// Länken passar enheten där mejlet öppnas, koden enheten där kunden började.

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface MedlemInloggningProps {
  lank: string;
  /** Sex siffror. */
  kod: string;
}

export const medlemInloggningAmne = (kod: string) => `Din kod till Fyndplats: ${kod.slice(0, 3)} ${kod.slice(3)}`;

export default function MedlemInloggningEmail({ lank, kod }: MedlemInloggningProps) {
  return (
    <EmailShell preview={`Din kod är ${kod.slice(0, 3)} ${kod.slice(3)}. Den gäller i 15 minuter.`}>
      <Text style={text.h1}>Logga in på Fyndplats</Text>
      <Text style={text.body}>
        Tryck på knappen för att logga in. Började du på en annan enhet kan du skriva in koden där i stället.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={lank} style={block.ctaButton}>
          Logga in
        </Link>
      </Section>
      <Section style={{ ...block.card, textAlign: "center" }}>
        <Text style={{ ...text.muted, margin: "0 0 6px 0" }}>Din kod</Text>
        <Text style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "0.18em", margin: 0, color: BRAND.ink }}>
          {kod.slice(0, 3)} {kod.slice(3)}
        </Text>
      </Section>
      <Text style={text.muted}>
        Länken och koden gäller i 15 minuter och kan bara användas en gång. Bad du inte om att logga in kan du
        strunta i det här mejlet; ingen kommer in på ditt konto utan koden.
      </Text>
    </EmailShell>
  );
}
