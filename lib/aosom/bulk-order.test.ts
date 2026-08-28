import { describe, it, expect } from "vitest";
import {
  planeraBulkOrder,
  grupperaPerOrder,
  delaIBatchar,
  byggCsv,
  CSV_KOLUMNER,
  MAX_ORDRAR,
  MAX_SKUS_PER_ORDER,
  MAX_UNIKA_SKUS,
  MAX_ENHETER,
  type AosomOrderRad,
} from "./bulk-order";
import type { FulfillmentTask } from "../orders/types";

const ADRESS = {
  fullName: "Anna Andersson",
  addressLine1: "Storgatan 1",
  postalCode: "11122",
  city: "Stockholm",
  province: "Stockholm",
  country: "SE",
  phone: "+46701234567",
};

function task(over: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1",
    orderId: "o1",
    orderNumber: "10001",
    lineItemId: "l1",
    productName: "Bod",
    variantChoices: {},
    quantity: 1,
    status: "pending",
    shippingAddress: ADRESS,
    createdAt: "2026-08-28T06:00:00Z",
    ...over,
  } as FulfillmentTask;
}

/** Standard: varje task mappar till ett artikelnummer härlett ur radens id. */
const sku = (t: FulfillmentTask) => `SKU-${t.lineItemId}`;

function order(over: Partial<AosomOrderRad> = {}): AosomOrderRad {
  return { orderNumber: "10001", skus: ["A"], antal: [1], adress: ADRESS, ...over };
}

describe("grupperaPerOrder", () => {
  it("slår ihop en kunds rader till EN order", () => {
    // Tre rader = tre leveranser med varsin fraktavgift, och frakten är redan
    // den dyraste delen av en Aosom-order.
    const { ordrar } = grupperaPerOrder(
      [task({ taskId: "o1:l1", lineItemId: "l1" }),
       task({ taskId: "o1:l2", lineItemId: "l2" }),
       task({ taskId: "o1:l3", lineItemId: "l3" })],
      sku,
    );
    expect(ordrar).toHaveLength(1);
    expect(ordrar[0].skus).toEqual(["SKU-l1", "SKU-l2", "SKU-l3"]);
    expect(ordrar[0].antal).toEqual([1, 1, 1]);
  });

  it("samma artikel två gånger blir ETT artikelnummer med summerat antal", () => {
    // Annars äter dubbletten en av de tjugo platserna på raden i onödan.
    const { ordrar } = grupperaPerOrder(
      [task({ taskId: "o1:l1", lineItemId: "l1", quantity: 2 }),
       task({ taskId: "o1:l2", lineItemId: "l1", quantity: 3 })],
      sku,
    );
    expect(ordrar[0].skus).toEqual(["SKU-l1"]);
    expect(ordrar[0].antal).toEqual([5]);
  });

  it("håller isär olika ordernummer", () => {
    const { ordrar } = grupperaPerOrder(
      [task({ orderNumber: "10001" }), task({ taskId: "o2:l1", orderNumber: "10002" })],
      sku,
    );
    expect(ordrar.map((o) => o.orderNumber)).toEqual(["10001", "10002"]);
  });

  it("hoppar över rader utan mappning, adress eller giltigt antal — med skäl", () => {
    const { ordrar, hoppadeOver } = grupperaPerOrder(
      [task({ taskId: "a" }),
       task({ taskId: "b", shippingAddress: { city: "Stockholm" } }),
       task({ taskId: "c", quantity: 0 })],
      (t) => (t.taskId === "a" ? null : sku(t)),
    );
    expect(ordrar).toHaveLength(0);
    expect(hoppadeOver.map((h) => h.taskId)).toEqual(["a", "b", "c"]);
    expect(hoppadeOver[0].skal).toMatch(/mappning/);
    expect(hoppadeOver[1].skal).toMatch(/adress/);
    expect(hoppadeOver[2].skal).toMatch(/antal/);
  });
});

describe("delaIBatchar", () => {
  it("håller sig under taket på antal ordrar", () => {
    const ordrar = Array.from({ length: MAX_ORDRAR + 5 }, (_, i) =>
      order({ orderNumber: `${i}`, skus: [`S${i}`] }));
    const { batchar } = delaIBatchar(ordrar);
    expect(batchar).toHaveLength(2);
    expect(batchar[0].rader).toHaveLength(MAX_ORDRAR);
    expect(batchar[1].rader).toHaveLength(5);
  });

  it("håller sig under taket på enheter", () => {
    const ordrar = [
      order({ orderNumber: "1", antal: [MAX_ENHETER - 10] }),
      order({ orderNumber: "2", skus: ["B"], antal: [20] }),
    ];
    const { batchar } = delaIBatchar(ordrar);
    expect(batchar).toHaveLength(2);
    expect(batchar[0].enheter).toBeLessThanOrEqual(MAX_ENHETER);
    expect(batchar[1].enheter).toBeLessThanOrEqual(MAX_ENHETER);
  });

  it("håller sig under taket på unika artikelnummer", () => {
    const ordrar = Array.from({ length: 30 }, (_, i) =>
      order({ orderNumber: `${i}`, skus: Array.from({ length: 10 }, (_, j) => `S${i}-${j}`), antal: Array(10).fill(1) }));
    const { batchar } = delaIBatchar(ordrar);
    for (const b of batchar) expect(b.unikaSkus).toBeLessThanOrEqual(MAX_UNIKA_SKUS);
  });

  it("delade artikelnummer mellan ordrar räknas EN gång", () => {
    // Taket gäller olika artikelnummer i batchen, inte förekomster.
    const ordrar = Array.from({ length: 50 }, (_, i) => order({ orderNumber: `${i}`, skus: ["SAMMA"] }));
    const { batchar } = delaIBatchar(ordrar);
    expect(batchar).toHaveLength(1);
    expect(batchar[0].unikaSkus).toBe(1);
  });

  it("☠️ en order delas ALDRIG mellan två batchar", () => {
    // Raden ÄR ordern, med en adress och en betalning. Splittad blir det två
    // leveranser och en kund som får halva sin beställning.
    const ordrar = [
      order({ orderNumber: "1", antal: [MAX_ENHETER - 5] }),
      order({ orderNumber: "2", skus: ["B", "C"], antal: [10, 10] }),
    ];
    const { batchar } = delaIBatchar(ordrar);
    const nr2 = batchar.flatMap((b) => b.rader).filter((r) => r.orderNumber === "2");
    expect(nr2).toHaveLength(1);
    expect(nr2[0].antal).toEqual([10, 10]);
  });

  it("en ensam order som spränger ett tak flaggas i stället för att delas", () => {
    const ordrar = [
      order({ orderNumber: "för-många-skus",
              skus: Array.from({ length: MAX_SKUS_PER_ORDER + 1 }, (_, i) => `S${i}`),
              antal: Array(MAX_SKUS_PER_ORDER + 1).fill(1) }),
      order({ orderNumber: "för-många-enheter", antal: [MAX_ENHETER + 1] }),
    ];
    const { batchar, omojliga } = delaIBatchar(ordrar);
    expect(batchar).toHaveLength(0);
    expect(omojliga.map((o) => o.orderNumber)).toEqual(["för-många-skus", "för-många-enheter"]);
    expect(omojliga[0].skal).toMatch(/artikelnummer/);
    expect(omojliga[1].skal).toMatch(/enheter/);
  });

  it("tom lista ger inga batchar", () => {
    expect(delaIBatchar([]).batchar).toHaveLength(0);
  });
});

describe("byggCsv", () => {
  it("kolumn A är artikelnumren och B antalen, i samma ordning", () => {
    const csv = byggCsv({ rader: [order({ skus: ["A", "B"], antal: [2, 3] })], enheter: 5, unikaSkus: 2 });
    const [rubrik, rad] = csv.trim().split("\n");
    expect(rubrik).toBe(CSV_KOLUMNER.join(","));
    expect(rad.startsWith('"A,B","2,3",')).toBe(true);
  });

  it("citerar fält som innehåller komma — annars glider kolumnerna", () => {
    const csv = byggCsv({
      rader: [order({ adress: { ...ADRESS, addressLine1: "Storgatan 1, lgh 1102" } })],
      enheter: 1, unikaSkus: 1,
    });
    expect(csv).toContain('"Storgatan 1, lgh 1102"');
  });

  it("dubblar citattecken i stället för att bryta raden", () => {
    const csv = byggCsv({
      rader: [order({ adress: { ...ADRESS, fullName: 'Anna "Anka" Andersson' } })],
      enheter: 1, unikaSkus: 1,
    });
    expect(csv).toContain('"Anna ""Anka"" Andersson"');
  });

  it("radbrytningar i en adress plattas ut", () => {
    const csv = byggCsv({
      rader: [order({ adress: { ...ADRESS, addressLine2: "c/o Berg\nPortkod 1234" } })],
      enheter: 1, unikaSkus: 1,
    });
    expect(csv.trim().split("\n")).toHaveLength(2);
  });

  it("land defaultas till SE", () => {
    const csv = byggCsv({
      rader: [order({ adress: { ...ADRESS, country: undefined } })],
      enheter: 1, unikaSkus: 1,
    });
    expect(csv).toContain(",SE,");
  });

  it("bär vårt ordernummer så svaret går att para ihop", () => {
    const csv = byggCsv({ rader: [order({ orderNumber: "10042" })], enheter: 1, unikaSkus: 1 });
    expect(csv.trim().endsWith("10042")).toBe(true);
  });
});

describe("planeraBulkOrder", () => {
  it("går hela vägen från orderrader till batchar", () => {
    const plan = planeraBulkOrder(
      [task({ taskId: "o1:l1", lineItemId: "l1" }),
       task({ taskId: "o1:l2", lineItemId: "l2" }),
       task({ taskId: "o2:l1", orderNumber: "10002", lineItemId: "l1" })],
      sku,
    );
    expect(plan.batchar).toHaveLength(1);
    expect(plan.batchar[0].rader).toHaveLength(2);
    expect(plan.omojliga).toHaveLength(0);
    expect(plan.hoppadeOver).toHaveLength(0);
  });
});
