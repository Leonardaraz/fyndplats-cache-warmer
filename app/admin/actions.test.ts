import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { FulfillmentTask } from "@/lib/orders/types";

// next/cache och AliExpress-klienten mockas; allt annat (store=memory) är riktigt.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/aliexpress/client", () => ({
  createOrder: vi.fn(),
  getInventory: vi.fn(),
  extractAliExpressProductId: vi.fn(),
  // place-order.ts gör `err instanceof OrderValidationError` → måste finnas i mocken.
  OrderValidationError: class OrderValidationError extends Error {},
}));

const mapping: ProductMappingRecord = {
  supplierProductId: "AAA",
  wixProductId: "wix-1",
  variants: [
    {
      supplierVariantId: "skuA",
      sku: "FP-1",
      choices: { Color: "Red" },
      costUsd: 1,
      landedCostSek: 10,
      grossSek: 20,
    },
  ],
};

// Multi-variant mappning (Färg × Storlek) för variant-matchnings-testerna.
const multiMapping: ProductMappingRecord = {
  supplierProductId: "MULTI",
  wixProductId: "wix-2",
  variants: [
    { supplierVariantId: "skuRedS", sku: "FP-RS", choices: { Color: "Red", Size: "S" }, costUsd: 1, landedCostSek: 10, grossSek: 20 },
    { supplierVariantId: "skuRedM", sku: "FP-RM", choices: { Color: "Red", Size: "M" }, costUsd: 1, landedCostSek: 10, grossSek: 20 },
  ],
};

function baseTask(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1",
    orderId: "o1",
    orderNumber: "100",
    lineItemId: "l1",
    productName: "X",
    wixCatalogItemId: "wix-1",
    variantChoices: { Color: "Red" },
    quantity: 1,
    status: "pending",
    createdAt: new Date().toISOString(),
    shippingAddress: {
      fullName: "A B",
      addressLine1: "Street 1",
      city: "Stockholm",
      postalCode: "11111",
      country: "SE",
      phone: "+46700000000",
    },
    ...patch,
  };
}

// Fräsch memory-store + seeded mapping/task per test (resetModules nollar singleton).
async function setup(task: FulfillmentTask, m: ProductMappingRecord = mapping) {
  process.env.STORE_BACKEND = "memory";
  const { getStore } = await import("@/lib/store/factory");
  const store = getStore();
  await store.saveMapping(m);
  await store.upsertTask(task);
  const actions = await import("./actions");
  const client = await import("@/lib/aliexpress/client");
  return { store, actions, client };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("placeAliExpressOrder — leverantörsval", () => {
  it("utan override beställer från produktens globala mappning", async () => {
    const { actions, client, store } = await setup(baseTask());
    vi.mocked(client.createOrder).mockResolvedValue({ tradeOrderId: "T1", paymentRequired: false });
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(true);
    expect(client.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "AAA", skuId: "skuA", quantity: 1 }),
    );
    const t = (await store.listTasks()).find((x) => x.taskId === "o1:l1");
    expect(t?.status).toBe("ordered");
    expect(t?.aliexpressOrderId).toBe("T1");
  });

  it("med override beställer från den alternativa källan (inte mappningen)", async () => {
    const { actions, client } = await setup(
      baseTask({
        overriddenSupplierProductId: "BBB",
        overriddenSupplierVariantId: "skuB",
        overriddenSupplierLabel: "Red / M",
      }),
    );
    vi.mocked(client.createOrder).mockResolvedValue({ tradeOrderId: "T2", paymentRequired: false });
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(true);
    expect(client.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "BBB", skuId: "skuB" }),
    );
  });

  it("override fungerar även när kundens variant INTE matchar mappningen", async () => {
    const { actions, client } = await setup(
      baseTask({
        variantChoices: { Color: "Purple" }, // matchar ingen mapping-variant
        overriddenSupplierProductId: "BBB",
        overriddenSupplierVariantId: "skuB",
      }),
    );
    vi.mocked(client.createOrder).mockResolvedValue({ tradeOrderId: "T3", paymentRequired: false });
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(true);
    expect(client.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "BBB", skuId: "skuB" }),
    );
  });

  it("kontroll: utan override OCH utan variant-match felar (ingen order läggs)", async () => {
    const { actions, client } = await setup(baseTask({ variantChoices: { Color: "Purple" } }));
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  it("vägrar HALVT override: bara produkt (skulle korsa B:s produkt med A:s SKU)", async () => {
    const { actions, client } = await setup(baseTask({ overriddenSupplierProductId: "BBB" }));
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  it("vägrar HALVT override: bara SKU (skulle korsa A:s produkt med B:s SKU)", async () => {
    const { actions, client } = await setup(baseTask({ overriddenSupplierVariantId: "skuB" }));
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });
});

describe("placeAliExpressOrder — variant-match & order-guards (audit-fixar)", () => {
  it("multi-variant + tom choices (ingen sku/override) → vägrar, väljer INTE variants[0]", async () => {
    const { actions, client } = await setup(
      baseTask({ wixCatalogItemId: "wix-2", variantChoices: {} }),
      multiMapping,
    );
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  it("multi-variant + tvetydiga choices (matchar flera) → vägrar", async () => {
    const { actions, client } = await setup(
      baseTask({ wixCatalogItemId: "wix-2", variantChoices: { Color: "Red" } }),
      multiMapping,
    );
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  it("multi-variant + entydiga choices → beställer rätt variant", async () => {
    const { actions, client } = await setup(
      baseTask({ wixCatalogItemId: "wix-2", variantChoices: { Color: "Red", Size: "M" } }),
      multiMapping,
    );
    vi.mocked(client.createOrder).mockResolvedValue({ tradeOrderId: "TM", paymentRequired: false });
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(true);
    expect(client.createOrder).toHaveBeenCalledWith(expect.objectContaining({ skuId: "skuRedM" }));
  });

  it("SKU vinner över choices", async () => {
    const { actions, client } = await setup(
      baseTask({ wixCatalogItemId: "wix-2", sku: "FP-RS", variantChoices: { Color: "Red", Size: "M" } }),
      multiMapping,
    );
    vi.mocked(client.createOrder).mockResolvedValue({ tradeOrderId: "TS", paymentRequired: false });
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(true);
    expect(client.createOrder).toHaveBeenCalledWith(expect.objectContaining({ skuId: "skuRedS" }));
  });

  it("ofullständig adress (saknar gatuadress) → vägrar, ingen order", async () => {
    const { actions, client } = await setup(
      baseTask({ shippingAddress: { fullName: "A B", city: "Sthlm", postalCode: "111 22", country: "SE" } }),
    );
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  it("ogiltig kvantitet (0) → vägrar, ingen order", async () => {
    const { actions, client } = await setup(baseTask({ quantity: 0 }));
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  it("SKU-miss faller tillbaka till entydiga choices (stale sku räddas)", async () => {
    const { actions, client } = await setup(
      baseTask({ wixCatalogItemId: "wix-2", sku: "FINNS-EJ", variantChoices: { Color: "Red", Size: "M" } }),
      multiMapping,
    );
    vi.mocked(client.createOrder).mockResolvedValue({ tradeOrderId: "TF", paymentRequired: false });
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(true);
    expect(client.createOrder).toHaveBeenCalledWith(expect.objectContaining({ skuId: "skuRedM" }));
  });

  it("whitespace-only gatuadress → vägrar, ingen order", async () => {
    const { actions, client } = await setup(
      baseTask({ shippingAddress: { fullName: "A B", addressLine1: "   ", city: "Sthlm", postalCode: "11122", country: "SE" } }),
    );
    const res = await actions.placeAliExpressOrder("o1:l1");
    expect(res.ok).toBe(false);
    expect(client.createOrder).not.toHaveBeenCalled();
  });
});

describe("set/clear leverantörs-override", () => {
  it("setOrderSupplierOverrideAction sätter fälten + auditar", async () => {
    const { actions, store } = await setup(baseTask());
    const res = await actions.setOrderSupplierOverrideAction("o1:l1", "BBB", "skuB", "Red / M");
    expect(res.ok).toBe(true);
    const t = (await store.listTasks()).find((x) => x.taskId === "o1:l1");
    expect(t).toMatchObject({
      overriddenSupplierProductId: "BBB",
      overriddenSupplierVariantId: "skuB",
      overriddenSupplierLabel: "Red / M",
    });
    const audit = await store.listAudit();
    expect(audit.some((a) => a.kind === "order-supplier-override-set" && a.ref === "o1:l1")).toBe(true);
  });

  it("setOrderSupplierOverrideAction vägrar saknad produkt eller SKU", async () => {
    const { actions } = await setup(baseTask());
    expect((await actions.setOrderSupplierOverrideAction("o1:l1", "", "skuB")).ok).toBe(false);
    expect((await actions.setOrderSupplierOverrideAction("o1:l1", "BBB", "")).ok).toBe(false);
  });

  it("setOrderSupplierOverrideAction vägrar om ordern redan är lagd", async () => {
    const { actions } = await setup(baseTask({ aliexpressOrderId: "T9", status: "ordered" }));
    const res = await actions.setOrderSupplierOverrideAction("o1:l1", "BBB", "skuB");
    expect(res.ok).toBe(false);
  });

  it("clearOrderSupplierOverrideAction rensar override:n", async () => {
    const { actions, store } = await setup(
      baseTask({ overriddenSupplierProductId: "BBB", overriddenSupplierVariantId: "skuB" }),
    );
    const res = await actions.clearOrderSupplierOverrideAction("o1:l1");
    expect(res.ok).toBe(true);
    const t = (await store.listTasks()).find((x) => x.taskId === "o1:l1");
    expect(t?.overriddenSupplierProductId).toBeUndefined();
  });
});

describe("fetchSupplierVariantsAction", () => {
  it("returnerar leverantörens SKU:er med läsbar etikett från skuProps", async () => {
    const { actions, client } = await setup(baseTask());
    vi.mocked(client.extractAliExpressProductId).mockReturnValue("BBB");
    vi.mocked(client.getInventory).mockResolvedValue([
      { skuId: "skuB", skuProps: { Color: "Red", Size: "M" }, price: 9.9, stock: 5, shipFrom: "ES" },
    ]);
    const res = await actions.fetchSupplierVariantsAction("https://aliexpress.com/item/123.html");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.productId).toBe("BBB");
      expect(res.variants[0]).toMatchObject({
        skuId: "skuB",
        label: "Red / M",
        price: 9.9,
        stock: 5,
        shipFrom: "ES",
      });
    }
  });

  it("felar när produkt-id/URL inte kan tolkas", async () => {
    const { actions, client } = await setup(baseTask());
    vi.mocked(client.extractAliExpressProductId).mockReturnValue(null);
    const res = await actions.fetchSupplierVariantsAction("nonsense");
    expect(res.ok).toBe(false);
  });
});
