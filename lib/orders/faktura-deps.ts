// De riktiga beroendena för fakturakörningen: Wix-ordrar, Postgres-loggen,
// konfigraden och Resend. Delas av webhooken, cronen och admin-rutten så att
// alla tre skickar på samma sätt.

import { getAppConfig } from "@/lib/store/app-config";
import { fetchOrders } from "@/lib/wix/orders";
import { sendEmail } from "@/lib/email/resend";
import { KUND_BRAND } from "@/lib/email/kundmejl";
import type { FakturaOrder } from "./faktura";
import { postgresUtskickslogg } from "./faktura-logg";
import { betalningUrKonfig, pdfBilaga, type FakturaKorDeps } from "./faktura-kor";

export function fakturaDeps(): FakturaKorDeps {
  return {
    // `strict`: ett läsfel ska synas, inte se ut som "inga ordrar".
    listaOrdrar: async (sedan) => (await fetchOrders(sedan, { strict: true })) as unknown as FakturaOrder[],
    logg: postgresUtskickslogg,
    betalning: async () => betalningUrKonfig(await getAppConfig()),
    logo: async () => {
      const res = await fetch(KUND_BRAND.logoUrl, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return undefined;
      return new Uint8Array(await res.arrayBuffer());
    },
    skicka: async ({ till, mejl, pdf, filnamn }) =>
      sendEmail({
        to: till,
        subject: mejl.subject,
        bodyHtml: mejl.html,
        bodyText: mejl.text,
        mottagare: "kund",
        forhandstext: mejl.forhandstext,
        bilagor: [pdfBilaga(filnamn, pdf)],
      }),
  };
}
