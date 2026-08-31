import { describe, expect, it, vi } from "vitest";
import type { FulfillmentTask, WixOrder } from "./types";
import { TASK_GRACE_MS } from "./guard";
import { runOrderBackfill, type OrderBackfillDeps } from "./backfill";

const NOW = Date.parse("2026-08-31T12:00:00Z");
const HOUR = 60 * 60 * 1000;

/** En betald order som webhooken borde ha fångat men inte gjorde. */
function order(over: Partial<WixOrder> = {}): WixOrder {
  return {
    id: "ord-1",
    number: "10024",
    paymentStatus: "PAID",
    createdDate: new Date(NOW - 5 * HOUR).toISOString(),
    lineItems: [
      {
        id: "li-1",
        productName: { original: "Förvaringsskåp 60 cm svart" },
        quantity: 1,
        physicalProperties: { sku: "FP-forvaringsskap-60-svart" },
        catalogReference: { catalogItemId: "cat-1" },
      },
    ],
    shippingInfo: {
      logistics: {
        shippingDestination: {
          address: {
            addressLine: "Stensborgsgatan 8 b",
            city: "Eskilstuna",
            subdivision: "SE-D",
            postalCode: "633 55",
            country: "SE",
          },
          contactDetails: { firstName: "Göran", lastName: "Wallin", phone: "+46705454393" },
        },
      },
    },
    ...over,
  } as WixOrder;
}

function deps(over: Partial<OrderBackfillDeps> = {}): OrderBackfillDeps & {
  skapade: FulfillmentTask[];
} {
  const skapade: FulfillmentTask[] = [];
  return {
    skapade,
    listOrders: async () => [order()],
    listTasks: async () => [],
    createTaskIfAbsent: async (t) => {
      skapade.push(t);
      return true;
    },
    now: () => NOW,
    ...over,
  };
}

describe("runOrderBackfill", () => {
  it("skapar tasken för en betald order som saknar den", async () => {
    const d = deps();
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(1);
    expect(s.created).toBe(1);
    expect(s.recovered).toEqual(["10024"]);
    expect(d.skapade[0].taskId).toBe("ord-1:li-1");
    expect(d.skapade[0].orderNumber).toBe("10024");
    expect(d.skapade[0].sku).toBe("FP-forvaringsskap-60-svart");
    expect(d.skapade[0].status).toBe("pending");
  });

  it("☠️ bär ordens FAKTISKA ålder, inte tidpunkten för räddningen", async () => {
    // deriveTasks stämplar createdAt med NU, vilket är rätt i webhooken och
    // fel här: en order från i förrgår hade fått åldern noll och vaktens
    // påminnelser hade börjat om från början.
    const d = deps();
    await runOrderBackfill({}, d);
    expect(d.skapade[0].createdAt).toBe(new Date(NOW - 5 * HOUR).toISOString());
    expect(d.skapade[0].createdAt).not.toBe(new Date(NOW).toISOString());
  });

  it("tar med leveransadressen — utan den går ordern inte att lägga", async () => {
    const d = deps();
    await runOrderBackfill({}, d);
    expect(d.skapade[0].shippingAddress).toMatchObject({
      fullName: "Göran Wallin",
      addressLine1: "Stensborgsgatan 8 b",
      city: "Eskilstuna",
      province: "Sodermanland",
      country: "SE",
    });
  });

  it("rör inte en order som redan har en task", async () => {
    const d = deps({
      listTasks: async () => [{ orderId: "ord-1" } as FulfillmentTask],
    });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(0);
    expect(d.skapade).toHaveLength(0);
  });

  it("hoppar över obetalda ordrar", async () => {
    const d = deps({ listOrders: async () => [order({ paymentStatus: "NOT_PAID" })] });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(0);
    expect(d.skapade).toHaveLength(0);
  });

  it("respekterar webhookens respit — tävlar inte om en färsk order", async () => {
    const d = deps({
      listOrders: async () => [
        order({ createdDate: new Date(NOW - (TASK_GRACE_MS - 60_000)).toISOString() }),
      ],
    });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(0);
    expect(d.skapade).toHaveLength(0);
  });

  it("torrkörning rapporterar men skriver ingenting", async () => {
    const d = deps();
    const s = await runOrderBackfill({ dryRun: true }, d);
    expect(s.dryRun).toBe(true);
    expect(s.missing).toBe(1);
    expect(s.created).toBe(0);
    expect(s.recovered).toEqual(["10024"]);
    expect(d.skapade).toHaveLength(0);
  });

  it("en trasig order fäller inte resten", async () => {
    let n = 0;
    const d = deps({
      listOrders: async () => [order(), order({ id: "ord-2", number: "10025" })],
      createTaskIfAbsent: async (t) => {
        n++;
        if (n === 1) throw new Error("WDE0195: Items limit exceeded");
        return true;
      },
    });
    const s = await runOrderBackfill({}, d);
    expect(s.failed).toBe(1);
    expect(s.created).toBe(1);
    expect(s.recovered).toEqual(["10025"]);
    expect(s.errors[0].order).toBe("10024");
    expect(s.errors[0].error).toContain("WDE0195");
  });

  it("createTaskIfAbsent som svarar false räknas inte som återhämtad", async () => {
    const d = deps({ createTaskIfAbsent: async () => false });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(1);
    expect(s.created).toBe(0);
    expect(s.recovered).toEqual([]);
  });

  it("onlyOrderNumbers begränsar till de utpekade", async () => {
    const d = deps({
      listOrders: async () => [order(), order({ id: "ord-2", number: "10025" })],
    });
    const s = await runOrderBackfill({ onlyOrderNumbers: ["10025"] }, d);
    expect(s.created).toBe(1);
    expect(d.skapade[0].orderId).toBe("ord-2");
  });

  it("läser inga tasks alls när fönstret är tomt", async () => {
    const listTasks = vi.fn(async () => []);
    const s = await runOrderBackfill({}, deps({ listOrders: async () => [], listTasks }));
    expect(s.scanned).toBe(0);
    expect(listTasks).not.toHaveBeenCalled();
  });

  it("en order utan rader blir ett synligt fel, inte en evig lucka", async () => {
    // Utan den grenen räknas den som `missing` vid varje körning men blir
    // aldrig `created` — ett problem som växer i rapporten och aldrig går att
    // åtgärda, eftersom ingen får veta VILKEN order det gäller.
    const d = deps({ listOrders: async () => [order({ lineItems: [] })] });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(1);
    expect(s.created).toBe(0);
    expect(s.failed).toBe(1);
    expect(s.errors[0].order).toBe("10024");
    expect(d.skapade).toHaveLength(0);
  });

  it("flerradsorder ger en task per rad", async () => {
    const o = order();
    o.lineItems = [...(o.lineItems ?? []), { id: "li-2", quantity: 2, physicalProperties: { sku: "FP-b" } }];
    const d = deps({ listOrders: async () => [o] });
    const s = await runOrderBackfill({}, d);
    expect(s.created).toBe(2);
    expect(s.recovered).toEqual(["10024"]);
    expect(d.skapade.map((t) => t.taskId)).toEqual(["ord-1:li-1", "ord-1:li-2"]);
  });
});

describe("stuck — underlaget för larmmejlet", () => {
  it("☠️ en order som inte gick att skriva bär allt som behövs för att expediera den för hand", async () => {
    // Det här är hela poängen med fältet. När WDE0195 fäller skrivningen är
    // varje annan kanal blockerad av samma vägg — audit, admin, vaktens fynd —
    // och mejlet är det enda som når fram. Då duger inte "något gick fel":
    // Leonard måste kunna plocka ordern ur mejlet.
    const s = await runOrderBackfill(
      {},
      deps({
        createTaskIfAbsent: async () => {
          throw new Error("WDE0195: Items limit exceeded. Delete some items and try again.");
        },
      }),
    );

    expect(s.failed).toBe(1);
    expect(s.created).toBe(0);
    expect(s.stuck).toHaveLength(1);
    const [o] = s.stuck;
    expect(o.number).toBe("10024");
    expect(o.customer).toBe("Göran Wallin");
    expect(o.reason).toContain("WDE0195");
    expect(o.items).toEqual([
      { name: "Förvaringsskåp 60 cm svart", sku: "FP-forvaringsskap-60-svart", quantity: 1 },
    ]);
  });

  it("☠️ listar BARA raderna som inte hann skrivas — annars beställs de dubbelt", async () => {
    // En order med två rader där den andra faller: rad 1 ligger redan i
    // /admin. Tar mejlet med den också expedierar Leonard den en gång till,
    // och kunden får två paket. Larmet måste beskriva luckan, inte ordern.
    const tvaRader = order({
      lineItems: [
        {
          id: "li-1",
          productName: { original: "Skrivbordslampa LED" },
          quantity: 1,
          physicalProperties: { sku: "FP-skrivbordslampa-led" },
          catalogReference: { catalogItemId: "cat-1" },
        },
        {
          id: "li-2",
          productName: { original: "Golvmatta 120x180" },
          quantity: 2,
          physicalProperties: { sku: "FP-golvmatta-120x180" },
          catalogReference: { catalogItemId: "cat-2" },
        },
      ],
    });
    let n = 0;
    const s = await runOrderBackfill(
      {},
      deps({
        listOrders: async () => [tvaRader],
        createTaskIfAbsent: async () => {
          if (++n === 2) throw new Error("WDE0195: Items limit exceeded.");
          return true;
        },
      }),
    );

    expect(s.created).toBe(1);
    expect(s.failed).toBe(1);
    expect(s.stuck[0].items).toEqual([
      { name: "Golvmatta 120x180", sku: "FP-golvmatta-120x180", quantity: 2 },
    ]);
  });

  it("en lyckad körning larmar inte", async () => {
    const s = await runOrderBackfill({}, deps());
    expect(s.created).toBe(1);
    expect(s.stuck).toEqual([]);
  });

  it("torrkörning larmar inte — den har per definition inte tappat något", async () => {
    const s = await runOrderBackfill({ dryRun: true }, deps());
    expect(s.stuck).toEqual([]);
  });
});
