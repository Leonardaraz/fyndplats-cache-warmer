// Varningen 14 dagar innan nivån sjunker (P2, E1-9): exakt en gång per
// väntande sänkning. Rullande fönster utan nivåskydd, så det enda som håller
// kvar nivån är ett nytt köp.

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";
import { AvregistreraNivamejl } from "./_avregistrera";

export interface MedlemNivaSjunkerProps {
  niva: string;
  nyNiva: string;
  /** "18 november 2026": första dagen med den lägre nivån. */
  datum: string;
  /** Vad som behöver handlas före datumet för att behålla nivån. */
  behovs: string;
  /** Sidan för att avregistrera sig från mejlen om nivån. */
  avregistrera?: string;
}

export const medlemNivaSjunkerAmne = (datum: string) => `Din nivå ändras den ${datum}`;

export default function MedlemNivaSjunkerEmail({ niva, nyNiva, datum, behovs, avregistrera }: MedlemNivaSjunkerProps) {
  return (
    <EmailShell preview={`Den ${datum} blir din nivå ${nyNiva} i stället för ${niva}.`}>
      <Text style={text.h1}>Din nivå ändras snart</Text>
      <Text style={text.body}>
        Varje köp räknas i 365 dagar. Den {datum} slutar ett av dina tidigare köp att räknas, och då blir din nivå{" "}
        <strong>{nyNiva}</strong> i stället för <strong>{niva}</strong>.
      </Text>
      <Section style={block.card}>
        <Text style={{ ...text.body, margin: 0 }}>
          Handlar du för {behovs} innan dess behåller du {niva}.
        </Text>
      </Section>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={`${BRAND.siteUrl}/konto`} style={block.ctaButton}>
          Se dina köp
        </Link>
      </Section>
      <Text style={text.muted}>Vi skickar det här mejlet en gång, två veckor före ändringen.</Text>
      <AvregistreraNivamejl href={avregistrera} />
    </EmailShell>
  );
}
