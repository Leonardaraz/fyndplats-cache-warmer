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
            addressLine: "Provgatan 1",
            city: "Provstad",
            subdivision: "SE-D",
            postalCode: "123 45",
            country: "SE",
          },
          contactDetails: { firstName: "Anna", lastName: "Provsson", phone: "+46700000000" },
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
      fullName: "Anna Provsson",
      addressLine1: "Provgatan 1",
      city: "Provstad",
      province: "Sodermanland",
      country: "SE",
    });
  });

  it("rör inte en order där varje rad redan har sin task", async () => {
    const d = deps({
      listTasks: async () => [{ taskId: "ord-1:li-1", orderId: "ord-1" } as FulfillmentTask],
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

/** En order med två rader. Den vanligaste formen av en delvis skapad order. */
function tvaRadersOrder(over: Partial<WixOrder> = {}): WixOrder {
  return order({
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
    ...over,
  });
}

/** Ett lager i minnet med samma löfte som det riktiga: en nyckel skrivs en gång. */
function lager(start: FulfillmentTask[] = []) {
  const rader = new Map<string, FulfillmentTask>(start.map((t) => [t.taskId, t]));
  const forsok: string[] = [];
  return {
    rader,
    forsok,
    listTasks: async () => [...rader.values()],
    createTaskIfAbsent: async (t: FulfillmentTask) => {
      forsok.push(t.taskId);
      if (rader.has(t.taskId)) return false;
      rader.set(t.taskId, t);
      return true;
    },
  };
}

describe("per orderrad — en delvis skapad order", () => {
  // ☠️ VARFÖR. Webhooken skriver en uppgift per orderrad, en i taget. Faller
  // skrivningen efter första raden har ordern EN uppgift av två. Förut räckte
  // det för att både återhämtningen och vakten skulle anse ordern hel: de
  // jämförde på order-id. Den andra varan låg då utan uppgift, och ingen fick
  // veta det. Jämförelsen görs nu på uppgiftens egen nyckel, `order:rad`.
  const finns = (taskId: string, over: Partial<FulfillmentTask> = {}): FulfillmentTask =>
    ({ taskId, orderId: taskId.split(":")[0], status: "ordered", ...over }) as FulfillmentTask;

  it("☠️ en av två rader finns → bara den saknade skapas", async () => {
    const d = deps({
      listOrders: async () => [tvaRadersOrder()],
      listTasks: async () => [finns("ord-1:li-1")],
    });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(1);
    expect(s.missingLines).toBe(1);
    expect(s.created).toBe(1);
    expect(s.recovered).toEqual(["10024"]);
    expect(d.skapade.map((t) => t.taskId)).toEqual(["ord-1:li-2"]);
    expect(d.skapade[0].productName).toBe("Golvmatta 120x180");
    expect(d.skapade[0].quantity).toBe(2);
  });

  it("den befintliga uppgiften rörs inte: ingen skrivning görs för den", async () => {
    // Den första raden är redan beställd hos leverantören. En skrivning till
    // för den, också en som lagret avvisar, är en skrivning för mycket.
    const l = lager([finns("ord-1:li-1", { status: "ordered", aliexpressOrderId: "AE-1" })]);
    await runOrderBackfill({}, deps({ listOrders: async () => [tvaRadersOrder()], ...l }));
    expect(l.forsok).toEqual(["ord-1:li-2"]);
    expect(l.rader.get("ord-1:li-1")).toMatchObject({ status: "ordered", aliexpressOrderId: "AE-1" });
  });

  it("alla rader finns → ingen skrivning alls", async () => {
    const createTaskIfAbsent = vi.fn(async () => true);
    const s = await runOrderBackfill(
      {},
      deps({
        listOrders: async () => [tvaRadersOrder()],
        listTasks: async () => [finns("ord-1:li-1"), finns("ord-1:li-2")],
        createTaskIfAbsent,
      }),
    );
    expect(s.missing).toBe(0);
    expect(s.missingLines).toBe(0);
    expect(s.created).toBe(0);
    expect(s.recovered).toEqual([]);
    expect(createTaskIfAbsent).not.toHaveBeenCalled();
  });

  it("inga rader finns → alla skapas, som förut", async () => {
    const d = deps({ listOrders: async () => [tvaRadersOrder()] });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(1);
    expect(s.missingLines).toBe(2);
    expect(s.created).toBe(2);
    expect(d.skapade.map((t) => t.taskId)).toEqual(["ord-1:li-1", "ord-1:li-2"]);
  });

  it("☠️ en annan orders uppgift med samma rad-id fyller inte luckan", async () => {
    // Rad-id:t är bara unikt inom ordern. Jämförelsen görs på hela nyckeln.
    const d = deps({
      listOrders: async () => [tvaRadersOrder()],
      listTasks: async () => [finns("ord-9:li-1"), finns("ord-9:li-2")],
    });
    const s = await runOrderBackfill({}, d);
    expect(s.created).toBe(2);
  });

  it("den återskapade raden bär orderns ålder, inte räddningens", async () => {
    const d = deps({
      listOrders: async () => [tvaRadersOrder()],
      listTasks: async () => [finns("ord-1:li-1")],
    });
    await runOrderBackfill({}, d);
    expect(d.skapade[0].createdAt).toBe(new Date(NOW - 5 * HOUR).toISOString());
  });

  it("☠️ skrivfel mitt i ordern, sedan en ny körning → raden kommer tillbaka utan dubbletter", async () => {
    // Det här är hela händelsekedjan: första körningen skriver rad 1 och faller
    // på rad 2. Förut var ordern därefter osynlig för nätet. Nu hittar nästa
    // körning luckan och fyller bara den.
    const l = lager();
    let fall = true;
    const skriv = async (t: FulfillmentTask) => {
      if (fall && t.lineItemId === "li-2") throw new Error("WDE0195: Items limit exceeded.");
      return l.createTaskIfAbsent(t);
    };
    const d = () => deps({ listOrders: async () => [tvaRadersOrder()], listTasks: l.listTasks, createTaskIfAbsent: skriv });

    const forsta = await runOrderBackfill({}, d());
    expect(forsta.created).toBe(1);
    expect(forsta.failed).toBe(1);
    expect(forsta.stuck[0].items).toEqual([{ name: "Golvmatta 120x180", sku: "FP-golvmatta-120x180", quantity: 2 }]);
    expect([...l.rader.keys()]).toEqual(["ord-1:li-1"]);

    fall = false;
    const andra = await runOrderBackfill({}, d());
    expect(andra.missing).toBe(1);
    expect(andra.missingLines).toBe(1);
    expect(andra.created).toBe(1);
    expect(andra.failed).toBe(0);
    expect(andra.stuck).toEqual([]);
    expect([...l.rader.keys()].sort()).toEqual(["ord-1:li-1", "ord-1:li-2"]);

    const tredje = await runOrderBackfill({}, d());
    expect(tredje.missing).toBe(0);
    expect(tredje.created).toBe(0);
    expect(l.rader.size).toBe(2);
    // Rad 1 skrevs en enda gång, i första körningen. Rad 2 en gång, i andra.
    expect(l.forsok).toEqual(["ord-1:li-1", "ord-1:li-2"]);
  });

  it("larmet för en delvis skapad order listar bara raden som saknas", async () => {
    const s = await runOrderBackfill(
      {},
      deps({
        listOrders: async () => [tvaRadersOrder()],
        listTasks: async () => [finns("ord-1:li-1")],
        createTaskIfAbsent: async () => {
          throw new Error("WDE0195: Items limit exceeded.");
        },
      }),
    );
    expect(s.failed).toBe(1);
    expect(s.stuck[0].items).toEqual([{ name: "Golvmatta 120x180", sku: "FP-golvmatta-120x180", quantity: 2 }]);
  });

  it("torrkörning rapporterar den delvis skapade ordern och skriver ingenting", async () => {
    const d = deps({
      listOrders: async () => [tvaRadersOrder()],
      listTasks: async () => [finns("ord-1:li-1")],
    });
    const s = await runOrderBackfill({ dryRun: true }, d);
    expect(s.missing).toBe(1);
    expect(s.missingLines).toBe(1);
    expect(s.recovered).toEqual(["10024"]);
    expect(d.skapade).toHaveLength(0);
  });

  it("respiten gäller också en delvis skapad order: webhooken kan vara mitt i skrivandet", async () => {
    const d = deps({
      listOrders: async () => [
        tvaRadersOrder({ createdDate: new Date(NOW - (TASK_GRACE_MS - 60_000)).toISOString() }),
      ],
      listTasks: async () => [finns("ord-1:li-1")],
    });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(0);
    expect(d.skapade).toHaveLength(0);
  });

  it("en order utan rader som redan har uppgifter är ingen lucka", async () => {
    // Raderna kan ha tagits bort ur ordern i efterhand. Uppgifterna finns, och
    // det finns inget att skapa: det ska varken räknas som saknat eller som fel.
    const s = await runOrderBackfill(
      {},
      deps({
        listOrders: async () => [order({ lineItems: [] })],
        listTasks: async () => [finns("ord-1:li-1")],
      }),
    );
    expect(s.missing).toBe(0);
    expect(s.failed).toBe(0);
    expect(s.stuck).toEqual([]);
  });
});

describe("avbrutna och återbetalda ordrar", () => {
  it("☠️ en avbruten order får aldrig nya uppgifter, inte ens om den står som betald", async () => {
    // Cronens orderläsning lämnar redan ute avbrutna ordrar. Spärren står här
    // också, så att den inte hänger på att varje anropare minns filtret.
    const d = deps({ listOrders: async () => [tvaRadersOrder({ status: "CANCELED" })] });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(0);
    expect(d.skapade).toHaveLength(0);
  });

  it("☠️ en delvis återbetald order: den återskapade raden hålls för granskning", async () => {
    // Återbetalningen bär inga radnummer, så vi vet inte om den saknade raden
    // är den som betalades tillbaka. Webhooken flaggar därför orderns öppna
    // uppgifter (flagTasksForOrderRefund). En uppgift som skapas i efterhand
    // ska hamna i samma läge: synlig, men spärrad för beställning tills någon
    // har tittat. Utan flaggan hade en återbetald vara kunnat beställas.
    const d = deps({
      listOrders: async () => [tvaRadersOrder({ paymentStatus: "PARTIALLY_REFUNDED" })],
      listTasks: async () => [{ taskId: "ord-1:li-1", orderId: "ord-1" } as FulfillmentTask],
    });
    const s = await runOrderBackfill({}, d);
    expect(s.created).toBe(1);
    expect(d.skapade[0].taskId).toBe("ord-1:li-2");
    expect(d.skapade[0].refundFlagged).toBe(true);
    expect(d.skapade[0].refundFlaggedAt).toBe(new Date(NOW).toISOString());
  });

  it("en betald order utan återbetalning flaggas inte", async () => {
    const d = deps({ listOrders: async () => [tvaRadersOrder()] });
    await runOrderBackfill({}, d);
    expect(d.skapade.every((t) => t.refundFlagged === undefined)).toBe(true);
    expect(d.skapade.every((t) => t.refundFlaggedAt === undefined)).toBe(true);
  });

  it("en helt återbetald order ger ingen uppgift", async () => {
    const d = deps({ listOrders: async () => [tvaRadersOrder({ paymentStatus: "FULLY_REFUNDED" })] });
    const s = await runOrderBackfill({}, d);
    expect(s.missing).toBe(0);
    expect(d.skapade).toHaveLength(0);
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
    expect(o.customer).toBe("Anna Provsson");
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
