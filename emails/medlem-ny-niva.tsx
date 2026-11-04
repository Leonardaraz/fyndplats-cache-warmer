// "Du har nått en ny nivå" (E1-9). Skickas bara när nivån stiger, en gång per
// nivå; en sänkning varnas för i förväg i stället (medlem-niva-sjunker.tsx).

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";
import { MedlemskortMejl } from "./_medlemskort";

export interface MedlemNyNivaProps {
  niva: string;
  belopp: string;
  nasta: { niva: string; kvar: string } | null;
}

export const medlemNyNivaAmne = (niva: string) => `Du har nått ${niva}`;

export default function MedlemNyNivaEmail({ niva, belopp, nasta }: MedlemNyNivaProps) {
  return (
    <EmailShell preview={`Grattis! Din nivå är nu ${niva}.`}>
      <Text style={text.h1}>Grattis, du har nått {niva}!</Text>
      <MedlemskortMejl niva={niva} rad={`${belopp} de senaste 365 dagarna`} />
      <Text style={text.body}>Tack för att du handlar hos oss. Din nivå syns på Mina sidor.</Text>
      {nasta ? (
        <Section style={block.card}>
          <Text style={{ ...text.body, margin: 0 }}>
            {nasta.kvar} kvar till {nasta.niva}.
          </Text>
        </Section>
      ) : null}
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={`${BRAND.siteUrl}/konto`} style={block.ctaButton}>
          Se din nivå
        </Link>
      </Section>
    </EmailShell>
  );
}
