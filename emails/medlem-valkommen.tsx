// Välkomstmejlet när kontot skapas (E1-9). Nivån räknas ur köpen de senaste
// 365 dagarna, så den som redan handlat ser sin nivå direkt [P3].

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface MedlemValkommenProps {
  niva: string;
  /** "2 345 kr" */
  belopp: string;
  /** "Guld" och "1 655 kr", eller null på högsta nivån. */
  nasta: { niva: string; kvar: string } | null;
}

export const medlemValkommenAmne = "Välkommen som medlem i Fyndplats";

export default function MedlemValkommenEmail({ niva, belopp, nasta }: MedlemValkommenProps) {
  return (
    <EmailShell preview={`Ditt konto är klart. Din nivå just nu: ${niva}.`}>
      <Text style={text.h1}>Välkommen som medlem!</Text>
      <Text style={text.body}>
        Ditt konto är klart. På Mina sidor ser du din nivå, dina köp och dina ordrar.
      </Text>
      <Section style={block.card}>
        <Text style={{ ...text.body, margin: "0 0 6px 0" }}>
          Din nivå just nu: <strong>{niva}</strong>
        </Text>
        <Text style={{ ...text.muted, margin: 0 }}>
          Du har handlat för {belopp} de senaste 365 dagarna.
          {nasta ? ` ${nasta.kvar} kvar till ${nasta.niva}.` : ""}
        </Text>
      </Section>
      <Text style={text.body}>
        Nivån räknas på betalda varor de senaste 365 dagarna, minus det som returnerats. Frakt räknas inte. Varje köp
        räknas i ett år från dagen du betalade.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={`${BRAND.siteUrl}/konto`} style={block.ctaButton}>
          Till Mina sidor
        </Link>
      </Section>
    </EmailShell>
  );
}
