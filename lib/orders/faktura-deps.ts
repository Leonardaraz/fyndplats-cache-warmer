// De riktiga beroendena för fakturakörningen: Wix-ordrar, utskicksloggen,
// konfigraden och Resend. Delas av webhooken, cronen och admin-rutten så att
// alla tre skickar på samma sätt.

import { getAppConfig } from "@/lib/store/app-config";
import { getStore } from "@/lib/store/factory";
import { fetchOrders } from "@/lib/wix/orders";
import { runOrderBackfill } from "./backfill";
import type { WixOrder } from "./types";
import { sendEmail } from "@/lib/email/resend";
import { KUND_BRAND } from "@/lib/email/kundmejl";
import type { FakturaOrder } from "./faktura";
import { getUtskickslogg } from "./faktura-logg";
import { betalningUrKonfig, pdfBilaga, type FakturaKorDeps } from "./faktura-kor";

export function fakturaDeps(): FakturaKorDeps {
  return {
    // `strict`: ett läsfel ska synas, inte se ut som "inga ordrar".
    listaOrdrar: async (sedan) => (await fetchOrders(sedan, { strict: true })) as unknown as FakturaOrder[],
    logg: getUtskickslogg(),
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
    // En betald förskottsorder får sina leverantörsuppgifter genom samma väg
    // som återhämtningen (deriveTasks, createTaskIfAbsent), med just den här
    // ordern. Ordern kommer ur samma Orders-läsning som återhämtningens, så den
    // bär adresser och val. Återhämtningens egna 14 dygn hade missat en
    // betalning som markeras sent; fakturakörningen ser 120 dygn bakåt.
    efterBetalning: async (o) => {
      if (!o.number) throw new Error("ordern saknar nummer");
      const store = getStore();
      const s = await runOrderBackfill(
        { onlyOrderNumbers: [o.number] },
        {
          listOrders: async () => [o as unknown as WixOrder],
          listTasks: () => store.listTasks(),
          createTaskIfAbsent: (task) => store.createTaskIfAbsent(task),
        },
      );
      // Redan skapade uppgifter (återhämtningen hann först) räknas inte som saknade.
      if (s.failed > 0) throw new Error(s.errors[0]?.error ?? "uppgifterna kunde inte skapas");
    },
  };
}
