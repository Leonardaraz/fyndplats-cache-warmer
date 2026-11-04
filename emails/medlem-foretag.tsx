// Mejlen om företagskontot (E3): till kunden när företaget är godkänt, och
// till butiken när en ansökan ska granskas. Inga erbjudanden, i linje med
// grundidén; tonen är rak.
//
// ☠️ Ett organisationsnummer för en enskild firma är ett personnummer. Mejlet
// till butiken bär bara det maskerade numret; hela numret syns i motorns admin.

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface ForetagGodkantProps {
  namn: string;
}

export const foretagGodkantAmne = "Ditt företagskonto är godkänt";

export default function ForetagGodkantEmail({ namn }: ForetagGodkantProps) {
  return (
    <EmailShell preview={`${namn} är godkänt. Du kan handla som företaget.`}>
      <Text style={text.h1}>Företagskontot är godkänt</Text>
      <Text style={text.body}>
        Vi har kontrollerat uppgifterna för <strong>{namn}</strong>. På Mina sidor väljer du att handla som företaget. Då
        visas priserna exklusive moms, och varukorgen räknar ordertrappan på hela ordern.
      </Text>
      <Text style={text.body}>
        Du får den högsta av din medlemsnivå och ordertrappan, aldrig båda. Kassan visar priserna inklusive moms.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={`${BRAND.siteUrl}/konto#foretag`} style={block.ctaButton}>
          Till Mina sidor
        </Link>
      </Section>
    </EmailShell>
  );
}

export interface ForetagAttGranskaProps {
  namn: string;
  /** Maskerat för en enskild firma. */
  orgnrVisas: string;
  form: "juridisk" | "enskild";
  adminLank: string;
}

export const foretagAttGranskaAmne = (namn: string) => `Företag att granska: ${namn}`;

export function ForetagAttGranskaEmail({ namn, orgnrVisas, form, adminLank }: ForetagAttGranskaProps) {
  return (
    <EmailShell preview={`${namn} vill handla som företag. Granska i admin.`}>
      <Text style={text.h1}>Ett företag väntar på granskning</Text>
      <Text style={text.body}>
        <strong>{namn}</strong> ({form === "enskild" ? "enskild firma" : "juridisk person"}, {orgnrVisas}) har ansökt om
        ett företagskonto. Kontrollera numret och namnet hos Bolagsverket och godkänn eller neka i admin.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={adminLank} style={block.ctaButton}>
          Öppna kön i admin
        </Link>
      </Section>
    </EmailShell>
  );
}
