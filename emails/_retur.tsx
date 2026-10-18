// emails/_retur.tsx
//
// Vart returen ska och vad frakten kostar, för de två returmejlen: kvittot från
// ångerfunktionen (withdrawal-receipt.tsx) och den manuella bekräftelsen
// (return-confirmation.tsx). En källa, så att mejlen säger samma sak.
//
// Returer går till leverantörens returlager (Leonard 2026-10-16). Adressen
// kommer ur lib/returadress.ts och står bara med när den är säker. Utan adress
// säger mejlet att vi mejlar den inom 1 arbetsdag, och butikens notis påminner
// om det (lib/withdrawal.ts).
//
// Adressen står bara i mejlen, aldrig på sajten: den visar vilket returlager vi
// använder, och lib/leverantor.test.ts håller leverantören borta från sidorna.

import { Section, Text } from "@react-email/components";
import { BRAND, block, text } from "./_layout";
import { returadressRader, type Returadress } from "../lib/returadress";
import { SKRYMMANDE_RETURKOSTNAD_KORT } from "../lib/retur-frakt";
import { RETURLAGER, RETURRISK } from "../lib/retur-policy";

const ADRESS = {
  fontSize: "15px",
  fontWeight: 700,
  color: BRAND.ink,
  margin: 0,
  lineHeight: "1.55",
} as const;

/**
 * Steget där kunden skickar paketet: adressen när vi har den, annars beskedet
 * att den kommer. Därefter frakten, risken och vad en skrymmande vara kostar.
 */
export function ReturSkicka({ steg, returadress }: { steg: number; returadress: Returadress | null }) {
  return (
    <>
      <Text style={text.body}>
        <strong>
          {steg}. Skicka paketet spårbart till returadressen{returadress ? " nedan" : ""}.
        </strong>
      </Text>
      {returadress ? (
        <Section style={block.card}>
          <Text style={ADRESS}>
            {returadressRader(returadress).map((rad, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {rad}
              </span>
            ))}
          </Text>
        </Section>
      ) : (
        <Section style={{ ...block.card, borderLeft: `4px solid ${BRAND.orange}` }}>
          <Text style={{ ...text.body, margin: 0 }}>
            <strong>Vi mejlar returadressen till dig inom 1 arbetsdag.</strong> Skicka inget innan
            du har den.
          </Text>
        </Section>
      )}
      <Text style={text.body}>
        <strong>Returfrakten betalas av dig som kund.</strong>{" "}
        {returadress
          ? `Returen går till vår leverantörs returlager i ${returadress.land}, så returfrakten blir en utrikesfrakt.`
          : RETURLAGER}{" "}
        Du bokar själv hos valfri transportör som tar emot varans storlek och vikt. Spara
        inlämningskvittot. {RETURRISK}
      </Text>
      <Text style={text.body}>{SKRYMMANDE_RETURKOSTNAD_KORT}</Text>
    </>
  );
}

/** Steget där kunden skickar spårningsnumret till oss. */
export function ReturSparning({ steg }: { steg: number }) {
  return (
    <Text style={text.body}>
      <strong>{steg}. Svara på det här mejlet med spårningsnumret</strong> när paketet är
      skickat. Vi behöver det för att anmäla returen till returlagret innan paketet är framme.
    </Text>
  );
}
