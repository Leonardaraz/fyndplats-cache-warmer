// Mejlen om offerten (E3): till kunden när offerten är prissatt, och till
// butiken när en förfrågan kommer in. Länken till kunden leder till
// /offert/<id>, som kräver inloggning med samma konto; den bär inget pris.

import { Section, Text, Link } from "@react-email/components";
import { BRAND, EmailShell, block, text } from "./_layout";

export interface OffertKlarProps {
  foretagNamn: string;
  lank: string;
  /** "18 november", eller null. */
  sistaDag: string | null;
}

export const offertKlarAmne = "Din offert från Fyndplats är klar";

export default function OffertKlarEmail({ foretagNamn, lank, sistaDag }: OffertKlarProps) {
  return (
    <EmailShell preview={`Offerten till ${foretagNamn} är klar${sistaDag ? ` och gäller till och med ${sistaDag}` : ""}.`}>
      <Text style={text.h1}>Offerten är klar</Text>
      <Text style={text.body}>
        Vi har prissatt offerten till <strong>{foretagNamn}</strong>.
        {sistaDag ? ` Den gäller till och med ${sistaDag}.` : ""} Du ser priserna och betalar i vår vanliga kassa via
        länken. Logga in med samma e-postadress som när du begärde offerten.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={lank} style={block.ctaButton}>
          Se offerten
        </Link>
      </Section>
      <Text style={text.body}>Kassan visar priserna inklusive moms. Frågor? Svara på det här mejlet.</Text>
    </EmailShell>
  );
}

export interface OffertForfraganProps {
  foretagNamn: string;
  antalRader: number;
  antalVaror: number;
  /** Listpriset för hela förfrågan inkl. moms, "28 140 kr". */
  lista: string;
  meddelande?: string;
  adminLank: string;
}

export const offertForfraganAmne = (foretagNamn: string) => `Offertförfrågan: ${foretagNamn}`;

export function OffertForfraganEmail({ foretagNamn, antalRader, antalVaror, lista, meddelande, adminLank }: OffertForfraganProps) {
  return (
    <EmailShell preview={`${foretagNamn} vill ha en offert på ${antalVaror} varor.`}>
      <Text style={text.h1}>Ny offertförfrågan</Text>
      <Text style={text.body}>
        <strong>{foretagNamn}</strong> vill ha en offert på {antalVaror} varor fördelade på {antalRader}{" "}
        {antalRader === 1 ? "rad" : "rader"}, {lista} inkl. moms till listpris.
      </Text>
      {meddelande ? <Text style={{ ...text.body, fontStyle: "italic" }}>”{meddelande}”</Text> : null}
      <Text style={text.body}>Sätt styckpriserna i admin; offerten gäller i 14 dagar från att den prissätts.</Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <Link href={adminLank} style={block.ctaButton}>
          Öppna offerterna i admin
        </Link>
      </Section>
      <Text style={{ ...text.body, fontSize: 12, color: "#777" }}>{BRAND.siteUrl}</Text>
    </EmailShell>
  );
}
