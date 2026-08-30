// Bygger bulkorder-filen som aosom.de/bulkordering tar emot.
//
// VARFÖR DEN FINNS
//
// `lib/orders/place-order.ts` är helt AliExpress: den hämtar produkten ur
// DS-API:t, matchar varianten mot en AE-SKU och lägger ordern via
// `aliexpress.ds.order.create`. För Aosom finns ingen motsvarighet, och deras
// B2B-guide (2026-08-28) säger att API-integration erbjuds först "after a few
// months of successful collaboration".
//
// Men guiden visar också att ett API inte behövs. Bulkuppladdningen tar en fil
// där VARJE RAD ÄR EN ORDER — en kundadress med upp till tjugo artikelnummer.
// Den filen går att generera ur orderkön, och då är det enda manuella momentet
// att ladda upp den och betala.
//
// GRÄNSERNA ÄR AOSOMS, INTE VÅRA (guiden, avsnitt 5)
//
//   Upp till 100 ordrar per omgång        → MAX_ORDRAR
//   Upp till 20 artikelnummer per rad     → MAX_SKUS_PER_ORDER
//   Max 200 olika artikelnummer per batch → MAX_UNIKA_SKUS
//   Max 1 000 enheter totalt per batch    → MAX_ENHETER
//
// En batch som spränger någon av dem avvisas vid uppladdningen — efter att
// filen byggts, laddats upp och granskats. Därför delas ordrarna här i stället,
// i flera batchar som var och en håller sig innanför alla fyra.
//
// ☠️ EN ORDER FÅR ALDRIG DELAS MELLAN TVÅ BATCHAR
//
// Raden ÄR ordern, med en adress och en betalning. Splittras den blir det två
// leveranser till samma kund, två fraktavgifter, och en kund som får halva sin
// beställning. En order som ensam spränger ett tak flaggas i stället som
// `omojliga` och lämnas till en människa.

import type { FulfillmentTask, ShippingAddress } from "../orders/types";

/** Guidens tak. Ändra bara om Aosom ändrar sina. */
export const MAX_ORDRAR = 100;
export const MAX_SKUS_PER_ORDER = 20;
export const MAX_UNIKA_SKUS = 200;
export const MAX_ENHETER = 1000;

export interface AosomOrderRad {
  /** Vår orderreferens — följer med i filen så svaret går att para ihop. */
  orderNumber: string;
  /** Artikelnummer i Aosoms format, i radens ordning. */
  skus: string[];
  /** Antal per artikelnummer, samma ordning som `skus`. */
  antal: number[];
  adress: ShippingAddress;
}

export interface AosomBatch {
  rader: AosomOrderRad[];
  /** Summan av alla antal i batchen — måste hålla sig under MAX_ENHETER. */
  enheter: number;
  /** Antal olika artikelnummer i batchen — under MAX_UNIKA_SKUS. */
  unikaSkus: number;
}

export interface AosomBulkPlan {
  batchar: AosomBatch[];
  /** Ordrar som inte får plats i någon batch, med skälet. */
  omojliga: { orderNumber: string; skal: string }[];
  /** Tasks som hoppades över för att de saknar underlag. */
  hoppadeOver: { taskId: string; skal: string }[];
}

/**
 * Slår ihop orderrader till en order per ordernummer.
 *
 * Kön är radbaserad (`taskId` = `${orderId}:${lineItemId}`), men Aosoms fil är
 * orderbaserad: en kund som köpt tre saker ska ha EN rad med tre artikelnummer,
 * inte tre rader. Tre rader hade blivit tre separata leveranser med varsin
 * fraktavgift — och frakten är redan den dyraste delen av en Aosom-order.
 */
export function grupperaPerOrder(
  tasks: ReadonlyArray<FulfillmentTask>,
  skuForTask: (t: FulfillmentTask) => string | null,
): { ordrar: AosomOrderRad[]; hoppadeOver: { taskId: string; skal: string }[] } {
  const perOrder = new Map<string, AosomOrderRad>();
  const hoppadeOver: { taskId: string; skal: string }[] = [];

  for (const t of tasks) {
    const sku = skuForTask(t);
    if (!sku) {
      hoppadeOver.push({ taskId: t.taskId, skal: "ingen Aosom-mappning" });
      continue;
    }
    if (!t.shippingAddress?.addressLine1 || !t.shippingAddress?.city) {
      hoppadeOver.push({ taskId: t.taskId, skal: "ofullständig leveransadress" });
      continue;
    }
    const antal = Math.trunc(t.quantity);
    if (!Number.isFinite(antal) || antal <= 0) {
      hoppadeOver.push({ taskId: t.taskId, skal: `ogiltigt antal (${t.quantity})` });
      continue;
    }

    const rad = perOrder.get(t.orderNumber);
    if (!rad) {
      perOrder.set(t.orderNumber, {
        orderNumber: t.orderNumber,
        skus: [sku],
        antal: [antal],
        adress: t.shippingAddress,
      });
      continue;
    }
    // Samma artikel två gånger i samma order → slå ihop antalen i stället för att
    // ta två av de tjugo platserna på raden.
    const i = rad.skus.indexOf(sku);
    if (i >= 0) rad.antal[i] += antal;
    else {
      rad.skus.push(sku);
      rad.antal.push(antal);
    }
  }

  return { ordrar: [...perOrder.values()], hoppadeOver };
}

/** Delar ordrarna i batchar som var och en håller sig innanför ALLA fyra tak. */
export function delaIBatchar(ordrar: ReadonlyArray<AosomOrderRad>): {
  batchar: AosomBatch[];
  omojliga: { orderNumber: string; skal: string }[];
} {
  const batchar: AosomBatch[] = [];
  const omojliga: { orderNumber: string; skal: string }[] = [];
  let aktuell: { rader: AosomOrderRad[]; skus: Set<string>; enheter: number } | null = null;

  const stang = () => {
    if (aktuell && aktuell.rader.length > 0) {
      batchar.push({ rader: aktuell.rader, enheter: aktuell.enheter, unikaSkus: aktuell.skus.size });
    }
    aktuell = null;
  };

  for (const o of ordrar) {
    const enheter = o.antal.reduce((s, n) => s + n, 0);

    // En ensam order som spränger ett tak går inte att lösa genom att öppna en ny
    // batch — den måste delas, och det får den inte bli. Flagga och gå vidare.
    if (o.skus.length > MAX_SKUS_PER_ORDER) {
      omojliga.push({
        orderNumber: o.orderNumber,
        skal: `${o.skus.length} artikelnummer på en order, taket är ${MAX_SKUS_PER_ORDER}`,
      });
      continue;
    }
    if (enheter > MAX_ENHETER) {
      omojliga.push({
        orderNumber: o.orderNumber,
        skal: `${enheter} enheter på en order, taket är ${MAX_ENHETER} per batch`,
      });
      continue;
    }
    if (o.skus.length > MAX_UNIKA_SKUS) {
      omojliga.push({
        orderNumber: o.orderNumber,
        skal: `${o.skus.length} olika artikelnummer, taket är ${MAX_UNIKA_SKUS} per batch`,
      });
      continue;
    }

    if (!aktuell) aktuell = { rader: [], skus: new Set(), enheter: 0 };

    const nyaSkus = o.skus.filter((s) => !aktuell!.skus.has(s)).length;
    const sprangerNagot =
      aktuell.rader.length + 1 > MAX_ORDRAR
      || aktuell.enheter + enheter > MAX_ENHETER
      || aktuell.skus.size + nyaSkus > MAX_UNIKA_SKUS;

    if (sprangerNagot) {
      stang();
      aktuell = { rader: [], skus: new Set(), enheter: 0 };
    }

    aktuell.rader.push(o);
    aktuell.enheter += enheter;
    for (const s of o.skus) aktuell.skus.add(s);
  }

  stang();
  return { batchar, omojliga };
}

/** Ett CSV-fält: citeras när det innehåller avgränsare, citattecken eller radbrytning. */
function falt(v: string | undefined): string {
  const s = (v ?? "").replace(/\r?\n/g, " ").trim();
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_KOLUMNER = [
  "SKUs",
  "Quantities",
  "Full name",
  "Address line 1",
  "Address line 2",
  "Postal code",
  "City",
  "Province",
  "Country",
  "Phone",
  "Reference",
] as const;

/**
 * Bygger CSV-texten för EN batch.
 *
 * Kolumn A är artikelnumren och kolumn B antalen, båda kommaseparerade i samma
 * ordning — det är den enda delen guiden anger exakt, och den fiddliga delen.
 *
 * ⚠️ ADRESSKOLUMNERNAS RUBRIKER ÄR INTE VERIFIERADE mot Aosoms egen mall.
 * Guiden beskriver bara att varje rad är "one customer address" utan att namnge
 * fälten. Ladda ner deras formulär från aosom.de/bulkordering en gång och rätta
 * `CSV_KOLUMNER` efter det — datan i raderna är rätt oavsett, det är rubrikerna
 * som kan behöva byta namn eller ordning.
 */
export function byggCsv(batch: AosomBatch): string {
  const rader = [CSV_KOLUMNER.join(",")];
  for (const o of batch.rader) {
    const a = o.adress;
    rader.push([
      falt(o.skus.join(",")),
      falt(o.antal.join(",")),
      falt(a.fullName),
      falt(a.addressLine1),
      falt(a.addressLine2),
      falt(a.postalCode),
      falt(a.city),
      falt(a.province),
      falt(a.country || "SE"),
      falt(a.phone),
      falt(o.orderNumber),
    ].join(","));
  }
  return rader.join("\n") + "\n";
}

/** Hela vägen: orderrader → grupperade ordrar → batchar innanför taken. */
export function planeraBulkOrder(
  tasks: ReadonlyArray<FulfillmentTask>,
  skuForTask: (t: FulfillmentTask) => string | null,
): AosomBulkPlan {
  const { ordrar, hoppadeOver } = grupperaPerOrder(tasks, skuForTask);
  const { batchar, omojliga } = delaIBatchar(ordrar);
  return { batchar, omojliga, hoppadeOver };
}
