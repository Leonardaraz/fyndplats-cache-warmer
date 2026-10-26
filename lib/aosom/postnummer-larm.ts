// Larmet när en order med Aosom-varor ändå kommer in till ett postnummer dit
// Aosom inte levererar (lib/aosom/postnummer-sparr.ts).
//
// Kassan ska stoppa köpet innan det blir en order (/api/wix-validering). Men
// kontrollen släpper igenom köpet om den inte hinner svara, och den biter
// bara när tillägget är på i Wix. Då har kunden betalat för en vara som inte
// kan levereras, och det ska Leonard få veta samma minut, inte när
// bulkordern byggs.

import type { FulfillmentTask } from "../orders/types";
import { escapeHtml } from "../email/html";
import { aosomSparrForAdress } from "./postnummer-sparr";

export interface SparradAosomOrder {
  orderNumber: string;
  /** Formaterat, "621 52". */
  postnummer: string;
  produkter: string[];
}

/**
 * Orderns Aosom-rader till ett spärrat postnummer, eller null. Tar emot
 * orderns nyskapade rader, som alla har samma adress.
 */
export async function sparradAosomOrder(
  tasks: ReadonlyArray<FulfillmentTask>,
  arAosomProdukt: (wixProductId: string) => Promise<boolean>,
): Promise<SparradAosomOrder | null> {
  const medSparr = tasks.filter((t) => t.wixCatalogItemId && aosomSparrForAdress(t.shippingAddress));
  if (medSparr.length === 0) return null;

  const ids = [...new Set(medSparr.map((t) => t.wixCatalogItemId!))];
  const svar = await Promise.all(ids.map((id) => arAosomProdukt(id)));
  const aosomIds = new Set(ids.filter((_, i) => svar[i]));
  const aosomRader = medSparr.filter((t) => aosomIds.has(t.wixCatalogItemId!));
  if (aosomRader.length === 0) return null;

  return {
    orderNumber: aosomRader[0].orderNumber,
    postnummer: aosomSparrForAdress(aosomRader[0].shippingAddress)!,
    produkter: [...new Set(aosomRader.map((t) => t.productName || "okänd vara"))],
  };
}

/** Mejlet till OPS_ALERT_EMAIL. */
export function byggSparrLarm(o: SparradAosomOrder): { subject: string; html: string; text: string } {
  const subject = `Order ${o.orderNumber}: Aosom levererar inte till postnummer ${o.postnummer}`;
  const rader = [
    `Order ${o.orderNumber} har Aosom-varor till postnummer ${o.postnummer}, dit Aosom inte levererar:`,
    ...o.produkter.map((p) => `- ${p}`),
    "",
    "Raderna hålls utanför Aosom-beställningen. Kontakta kunden, avboka ordern och återbetala.",
  ];
  const html =
    `<p>Order <b>${escapeHtml(o.orderNumber)}</b> har Aosom-varor till postnummer ` +
    `<b>${escapeHtml(o.postnummer)}</b>, dit Aosom inte levererar:</p>` +
    `<ul>${o.produkter.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` +
    `<p>Raderna hålls utanför Aosom-beställningen. Kontakta kunden, avboka ordern och återbetala.</p>`;
  return { subject, html, text: rader.join("\n") };
}
