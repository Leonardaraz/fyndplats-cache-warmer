// Väljer EN fulfillment-task ur ett ordernummer — delad av varje väg som
// gör något oåterkalleligt med en enskild orderrad.
//
// VARFÖR DEN ÄR EGEN MODUL. Logiken skrevs för AliExpress-kopplingen
// (lib/orders/link-ae-order.ts). När den manuella skeppningen behövde exakt
// samma regel — "ett ordernummer som pekar på flera rader får ALDRIG gissas
// bort" — fanns två val: kopiera den, eller lyfta ut den. Huset har brunnit
// på kopian tre gånger (SHIP_AXIS_RE, EU_TULL_CODES, mapWithConcurrency), så
// den ligger här och båda importerar.
//
// Det som skiljer anroparna är BARA vad som räknas som valbart: kopplingen
// vill ha rader utan AE-ordernummer, skeppningen vill ha rader som inte redan
// är skeppade. Därför är predikatet ett argument, inte en gren.

import type { FulfillmentTask } from "./types";

export interface TaskVal {
  /** `${orderId}:${lineItemId}`. Vinner över orderNumber när båda ges. */
  taskId?: string;
  /** Butikens läsbara ordernummer, t.ex. "10026". */
  orderNumber?: string;
}

export interface Kandidat {
  taskId: string;
  productName: string;
  status: string;
}

export type ValResultat =
  | { task: FulfillmentTask }
  | { error: string; candidates?: Kandidat[] };

/**
 * Med `taskId`: exakt den raden, oavsett predikat — anroparen har pekat och
 * äger sitt val. Med `orderNumber`: raderna på ordern som predikatet släpper
 * igenom. Är det exakt en → den.
 *
 * ☠️ Är det FLERA vägrar vi och listar dem. En order med tre artiklar är tre
 * rader med varsin leverantörsorder; att gissa hade skeppat fel artikel med
 * rätt spårningsnummer, och kunden hade fått ett mejl om ett paket som inte
 * är på väg.
 */
export function väljEnTask(
  tasks: FulfillmentTask[],
  input: TaskVal,
  opt: {
    /** Vilka rader som går att röra i den här operationen. */
    valbar: (t: FulfillmentTask) => boolean;
    /** Verbet i felmeddelandet, t.ex. "koppla" eller "skeppa". */
    verb: string;
    /** Kort lägesbeskrivning per rad när ingen går att röra. */
    lage?: (t: FulfillmentTask) => string;
  },
): ValResultat {
  if (input.taskId) {
    const task = tasks.find((t) => t.taskId === input.taskId);
    return task ? { task } : { error: `Ingen task med id ${input.taskId}.` };
  }

  const nummer = (input.orderNumber ?? "").trim();
  if (!nummer) return { error: "taskId eller orderNumber krävs." };

  const påOrdern = tasks.filter((t) => t.orderNumber === nummer);
  if (påOrdern.length === 0) return { error: `Ingen task för order ${nummer}.` };

  const valbara = påOrdern.filter(opt.valbar);
  if (valbara.length === 1) return { task: valbara[0] };

  if (valbara.length === 0) {
    const lage = opt.lage ?? ((t: FulfillmentTask) => `${t.taskId}: ${t.status}`);
    return {
      error:
        `Order ${nummer} har ${påOrdern.length} rad(er) men ingen går att ${opt.verb} — `
        + påOrdern.map(lage).join("; "),
    };
  }

  return {
    error: `Order ${nummer} har ${valbara.length} rader som går att ${opt.verb} — ange taskId.`,
    candidates: valbara.map((t) => ({ taskId: t.taskId, productName: t.productName, status: t.status })),
  };
}
