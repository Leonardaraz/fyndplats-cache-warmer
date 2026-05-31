// Bekräftelsemejl när någon prenumererar på nyhetsbrevet. Använder den delade
// brand-shell-mallen (EmailShell) så det matchar order-/retur-mejlen.

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface NewsletterWelcomeProps {
  unsubscribeUrl: string;
}

export default function NewsletterWelcomeEmail({ unsubscribeUrl }: NewsletterWelcomeProps) {
  return (
    <EmailShell preview="Tack för att du prenumererar på Fyndplats nyhetsbrev!">
      <Text style={text.h1}>Tack för att du prenumererar!</Text>
      <Text style={text.body}>
        Välkommen till Fyndplats nyhetsbrev. Från och med nu får du våra bästa fynd,
        nyheter och exklusiva erbjudanden direkt i inkorgen — varje vecka, utan spam.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={`${BRAND.siteUrl}/butik`} style={block.ctaButton}>
          Börja fynda →
        </Link>
      </Section>

      <Section style={block.card}>
        <Text style={{ ...text.body, margin: 0 }}>
          <strong>Visste du att?</strong> Vi har fri frakt över 499 kr, 30 dagars öppet
          köp och svensk kundtjänst som svarar inom 24 timmar.
        </Text>
      </Section>

      <Text style={{ ...text.muted, marginTop: "18px" }}>
        Du får det här mejlet för att din adress anmäldes på www.fyndplats.se. Vill du
        inte längre ha vårt nyhetsbrev kan du{" "}
        <Link href={unsubscribeUrl} style={{ color: BRAND.orange2, fontWeight: 600 }}>
          avregistrera dig här
        </Link>{" "}
        när som helst.
      </Text>
    </EmailShell>
  );
}
