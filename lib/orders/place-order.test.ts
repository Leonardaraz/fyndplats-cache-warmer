import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { FulfillmentTask } from "@/lib/orders/types";

vi.mock("@/lib/aliexpress/client", () => ({
  createOrder: vi.fn(),
  getProduct: vi.fn(),
  // Fraktvalet frågar efter alternativen före första orderförsöket. Saknas
  // mocken kastar anropet, fångas av fraktblockets egen try, och VARJE test
  // körde tyst bara fallback-vägen — omförsöksloopen hade noll täckning
  // (granskning 2026-08-19).
  queryFreightToCountry: vi.fn(),
  OrderValidationError: class OrderValidationError extends Error {},
}));

import { createOrder, getProduct, queryFreightToCountry } from "@/lib/aliexpress/client";
import { placeOrderForTask } from "./place-order";
import { MemoryStore } from "@/lib/store/memory";

const mapping: ProductMappingRecord = {
  supplierProductId: "AAA",
  wixProductId: "wix-1",
  variants: [{ supplierVariantId: "skuA", sku: "FP-1", choices: { Color: "Red" }, costUsd: 1, landedCostSek: 10, grossSek: 20 }],
};

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1", orderId: "o1", orderNumber: "100", lineItemId: "l1", productName: "X",
    wixCatalogItemId: "wix-1", variantChoices: { Color: "Red" }, quantity: 1, status: "pending",
    createdAt: new Date().toISOString(),
    shippingAddress: { fullName: "A B", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", country: "SE" },
    ...patch,
  };
}
async function seed(t: FulfillmentTask, m: ProductMappingRecord = mapping) {
  const store = new MemoryStore();
  await store.saveMapping(m);
  await store.upsertTask(t);
  return store;
}
const get = async (store: MemoryStore) => (await store.listTasks()).find((x) => x.taskId === "o1:l1");

beforeEach(() => {
  vi.mocked(createOrder).mockReset();
  // Prisvakten är fail-open: default-mocken kastar ("API nere") → vakten står
  // ned och alla befintliga tester kör exakt som före vakten. Vakt-testerna
  // nedan sätter en riktig produkt.
  vi.mocked(getProduct).mockReset();
  vi.mocked(getProduct).mockRejectedValue(new Error("pris-API nere (testdefault)"));
  // Fraktvalet: default är ett tomt svar → ingen rankning, ordern läggs med
  // den historiska defaulten. Samma fail-open-tanke som prisvakten.
  vi.mocked(queryFreightToCountry).mockReset();
  vi.mocked(queryFreightToCountry).mockResolvedValue({ method: "test", raw: {} });
});

/** Produktsvar för prisvakts-testerna: variantens DS-pris just nu. */
function dsProductNow(priceUsd: number) {
  return {
    productId: "AAA", title: "X", description: "", images: [], variants: [
      { skuId: "skuA", skuAttr: "attrA", skuProps: { Color: "Red" }, price: priceUsd, stock: 5 },
    ], shipsFromCountries: [], hasEuWarehouse: false,
  } as Awaited<ReturnType<typeof getProduct>>;
}

describe("placeOrderForTask — claim & utfall", () => {
  it("redan claimad av annan → ingen order läggs", async () => {
    const store = await seed(task({ claimToken: "annan" }));
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    expect(vi.mocked(createOrder)).not.toHaveBeenCalled();
  });

  it("success → aliexpressOrderId+status skrivs", async () => {
    const store = await seed(task());
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T1", paymentRequired: false });
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res).toMatchObject({ ok: true, tradeOrderId: "T1" });
    const t = await get(store);
    expect(t?.aliexpressOrderId).toBe("T1");
    expect(t?.status).toBe("ordered");
  });

  // OKÄNT UTFALL: tomt order_id (resolved, ingen throw) → osäkert, status skrivs INTE,
  // claim BEHÅLLS (ingen auto-reclaim). Speglar nätverks-/timeout-grenen (release INTE),
  // utan att förlita sig på en kastande mock (vitest-spy flaggar kastade mockar i denna
  // miljö även när app-koden fångar dem). OrderValidationError→release-grenen täcks av
  // memory claim/release-primitivtestet nedan + try/catch-strukturen (tsc-grön).
  it("tomt order_id → osäkert, ingen status skriven, claim BEHÅLLS", async () => {
    const store = await seed(task());
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "", paymentRequired: false });
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    const t = await get(store);
    expect(t?.aliexpressOrderId).toBeUndefined();
    expect(t?.orderUncertain).toBe(true);
    expect(t?.claimToken).toBeDefined(); // claim ej släppt → ingen auto-reclaim, nytt försök nekas
  });

  it("F19: refundFlagged task → vägrar FÖRE claim (ingen order, ingen claim)", async () => {
    const store = await seed(task({ refundFlagged: true }));
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    expect(vi.mocked(createOrder)).not.toHaveBeenCalled();
    expect((await get(store))?.claimToken).toBeUndefined();
  });

  it("F19: terminal (cancelled) task → vägrar FÖRE claim", async () => {
    const store = await seed(task({ status: "cancelled" }));
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    expect(vi.mocked(createOrder)).not.toHaveBeenCalled();
  });

  it("F19/race: cancel landar precis innan claim → re-read avbryter, INGEN order läggs", async () => {
    // RaceStore simulerar att en cancel hann sätta status=cancelled runt claimen
    // (claimTask:s CAS gatar inte på status → en cancelled task går att claima).
    // place-order:s re-read EFTER claim ska då släppa claimen och avbryta FÖRE createOrder.
    class RaceStore extends MemoryStore {
      async claimTask(taskId: string, t: string): Promise<boolean> {
        const ok = await super.claimTask(taskId, t);
        if (ok) await this.setTaskStatus(taskId, "cancelled");
        return ok;
      }
    }
    const store = new RaceStore();
    await store.saveMapping(mapping);
    await store.upsertTask(task());
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    expect(vi.mocked(createOrder)).not.toHaveBeenCalled();
    // claimen släpptes (re-read-grenen anropar releaseTask) → låset hänger inte kvar
    expect((await get(store))?.claimToken).toBeUndefined();
  });

  it("F19/race: refund landar UNDER createOrder → order sparas (aliexpressOrderId) men status EJ ordered, flaggas", async () => {
    // Smala fönstret: claim vinner + post-claim re-read passerar, sedan flaggas tasken
    // refundFlagged MEDAN createOrder kör. Post-order-kollen ska då spara aliexpressOrderId
    // (dubbel-order-skydd) men INTE skriva status:ordered — i stället flagga cancelMidOrder
    // + audita för manuell AE-avbeställning.
    const store = await seed(task());
    vi.mocked(createOrder).mockImplementation(async () => {
      await store.updateTask("o1:l1", { refundFlagged: true, refundFlaggedAt: new Date().toISOString() });
      return { tradeOrderId: "T9", paymentRequired: false };
    });
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res).toMatchObject({ ok: true, tradeOrderId: "T9" });
    const t = await get(store);
    expect(t?.aliexpressOrderId).toBe("T9"); // sparad → inget dubbelbeställnings-fönster
    expect(t?.status).not.toBe("ordered"); // status klobbrades INTE
    expect(t?.cancelMidOrder).toBe(true); // flaggad för manuell granskning
    const audits = await store.listAudit();
    expect(audits.some((a) => a.kind === "order-placed-but-cancelled")).toBe(true);
  });

  it("multi-variant tom choices → vägrar FÖRE claim (ingen claim tagen)", async () => {
    const multi: ProductMappingRecord = {
      supplierProductId: "M", wixProductId: "wix-2",
      variants: [
        { supplierVariantId: "rs", sku: "RS", choices: { Color: "Red", Size: "S" }, costUsd: 1, landedCostSek: 10, grossSek: 20 },
        { supplierVariantId: "rm", sku: "RM", choices: { Color: "Red", Size: "M" }, costUsd: 1, landedCostSek: 10, grossSek: 20 },
      ],
    };
    const store = await seed(task({ wixCatalogItemId: "wix-2", variantChoices: {} }), multi);
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    expect(vi.mocked(createOrder)).not.toHaveBeenCalled();
    expect((await get(store))?.claimToken).toBeUndefined();
  });
});

// Claim-primitiven som place-order förlitar sig på (success-claim, dubbel-claim nekas,
// release → reclaim). Memory är atomiskt i en process; i prod ger wix-data:s conditional
// PATCH atomiciteten (empiriskt verifierat 3/3 + fält-löst + TOCTOU).
describe("placeOrderForTask — leverantörsspärren", () => {
  it("☠️ vägrar en Aosom-mappning i stället för att fråga AliExpress om den", async () => {
    // Hela filen är AliExpress: den hämtar produkten ur DS-API:t och matchar
    // varianten mot en AE-SKU. En Aosom-mappning bär ett artikelnummer som
    // "845-030CG" i samma fält — utan spärren skickas det rakt in i AE:s API.
    // Katalogen bär 2 700+ Aosom-utkast, så det slutar vara hypotetiskt i samma
    // stund som den första publiceras.
    const store = await seed(task(), {
      ...mapping,
      supplierProductId: "aosom:845-030CG",
      supplier: "aosom",
      variants: [{ ...mapping.variants[0], supplierVariantId: "845-030CG" }],
    });
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok).toBe(false);
    const fel = res.ok ? "" : res.error;
    expect(fel).toMatch(/aosom/i);
    // Meddelandet ska peka på rätt väg, annars letar den som felsöker i AE-loggarna.
    expect(fel).toMatch(/bulkordering/);
    expect(vi.mocked(createOrder)).not.toHaveBeenCalled();
  });

  it("släpper igenom en AliExpress-mappning som förut", async () => {
    const store = await seed(task());
    vi.mocked(createOrder).mockResolvedValue({ orderId: "AE-1", status: "placed" } as never);
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok ? "" : res.error).not.toMatch(/aosom/i);
  });

  it("en rad utan supplier-fält räknas fortfarande som AliExpress", async () => {
    // Alla mappningar från före supplier-fältet saknar det. Klassas de om till
    // "okänd leverantör" slutar hela den befintliga katalogen gå att beställa.
    const store = await seed(task(), { ...mapping, supplier: undefined });
    vi.mocked(createOrder).mockResolvedValue({ orderId: "AE-1", status: "placed" } as never);
    const res = await placeOrderForTask(store, "o1:l1");
    expect(res.ok ? "" : res.error).not.toMatch(/aosom|kommer från/i);
  });
});

describe("MemoryStore claimTask/releaseTask", () => {
  it("första claim vinner, andra (annan token) nekas, release → reclaim funkar", async () => {
    const store = await seed(task());
    expect(await store.claimTask("o1:l1", "A")).toBe(true);
    expect(await store.claimTask("o1:l1", "B")).toBe(false); // redan claimad
    await store.releaseTask("o1:l1", "B"); // fel token → no-op, låset kvar
    expect(await store.claimTask("o1:l1", "C")).toBe(false);
    await store.releaseTask("o1:l1", "A"); // rätt token → släpper
    expect(await store.claimTask("o1:l1", "D")).toBe(true); // reclaim
  });

  it("claim nekas på en redan beställd task (aliexpressOrderId satt)", async () => {
    const store = await seed(task({ aliexpressOrderId: "EXISTING" }));
    expect(await store.claimTask("o1:l1", "A")).toBe(false);
  });
});

// ── Prisvakten (garderobs-incidenten 2026-08-06) ────────────────────────────
// DS-API:t kan aldrig få kampanjpriser/kuponger → när DS-priset stuckit iväg
// mot importbaslinjen (costUsd) ska Leonard få välja väg INNAN order skapas.
describe("placeOrderForTask — prisvakt", () => {
  // Mappningens costUsd är 1 (se `mapping` överst) → 2 = +100 %... men
  // MIN_USD-tröskeln ($2) kräver större absolut diff → använd egen mappning.
  const priceyMapping = {
    ...mapping,
    variants: [{ ...mapping.variants[0], costUsd: 78 }],
  };

  it("stoppar med priceStop när DS-priset är märkbart över importpriset — ingen order, ingen claim", async () => {
    vi.mocked(getProduct).mockResolvedValue(dsProductNow(92)); // +18 %, +$14
    const store = await seed(task(), priceyMapping);
    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.priceStop).toBeDefined();
    expect(r.priceStop?.dsPriceUsd).toBe(92);
    expect(r.priceStop?.importCostUsd).toBe(78);
    expect(r.priceStop?.productUrl).toContain("/item/AAA.html");
    expect(createOrder).not.toHaveBeenCalled();
    // Ingen claim togs → tasken är fri att hantera direkt.
    expect((await get(store))?.claimToken).toBeUndefined();
  });

  it("acceptPrice: true kringgår vakten och lägger ordern", async () => {
    vi.mocked(getProduct).mockResolvedValue(dsProductNow(92));
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T1" } as Awaited<ReturnType<typeof createOrder>>);
    const store = await seed(task(), priceyMapping);
    const r = await placeOrderForTask(store, "o1:l1", { acceptPrice: true });
    expect(r.ok).toBe(true);
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it("normalpris passerar vakten", async () => {
    vi.mocked(getProduct).mockResolvedValue(dsProductNow(79)); // +1.3 % → ok
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T2" } as Awaited<ReturnType<typeof createOrder>>);
    const store = await seed(task(), priceyMapping);
    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(true);
  });

  it("prishämtningsfel är fail-open — ordern läggs som vanligt", async () => {
    // beforeEach-defaulten: getProduct kastar.
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T3" } as Awaited<ReturnType<typeof createOrder>>);
    const store = await seed(task(), priceyMapping);
    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(true);
  });

  it("leverantörsbyte (override) saknar jämförbar baslinje — vakten står ned", async () => {
    vi.mocked(getProduct).mockResolvedValue(dsProductNow(920)); // absurt dyrt, men annan leverantör
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T4" } as Awaited<ReturnType<typeof createOrder>>);
    const store = await seed(
      task({ overriddenSupplierProductId: "BBB", overriddenSupplierVariantId: "skuB" }),
      priceyMapping,
    );
    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(true);
  });
});


// ── Fraktval och omförsök (granskning 2026-08-19) ───────────────────────────
//
// Loopen valde tidigare fraktsätt utan täckning: place-order.test.ts saknade
// queryFreightToCountry i mocken, så varje test körde tyst fallback-vägen.

describe("placeOrderForTask — fraktval", () => {
  const frakt = (options: unknown[]) => ({
    method: "test",
    raw: { delivery_option_list: options },
  });

  // Mappningens supplierVariantId ("skuA") är INTE numeriskt — det är formen
  // extension-importen ger. Frakt-API:t kräver numeriskt sku_id, så koden slår
  // upp produkten och matchar via matchAeVariant. Utan det här svaret hoppas
  // fraktvalet över, vilket är precis den tysta no-op granskningen hittade.
  const aeProdukt = {
    variants: [{ skuId: "12000012345678", skuAttr: "skuA", skuProps: {}, price: 1 }],
  };

  beforeEach(() => {
    vi.mocked(getProduct).mockResolvedValue(aeProdukt as never);
  });

  it("skickar det billigaste OCH snabbaste alternativet, inte defaulten", async () => {
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockResolvedValue(
      frakt([
        { code: "SEG", shipping_fee_cent: 0, max_delivery_days: 30 },
        { code: "SNABB_GRATIS", shipping_fee_cent: 0, max_delivery_days: 6 },
      ]),
    );
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T1" } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(true);
    expect(vi.mocked(createOrder).mock.calls[0][0].logisticsServiceName).toBe("SNABB_GRATIS");
  });

  it("slår upp numeriskt sku_id — annars blir fraktvalet en tyst no-op", async () => {
    // Skickas attribut-strängen som sku_id svarar frakt-API:t tomt, rankningen
    // uteblir och ordern går med just den hårdkodade tjänst som fällde #10021.
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockResolvedValue(frakt([{ code: "X", shipping_fee_cent: 0 }]));
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T9" } as never);

    await placeOrderForTask(store, "o1:l1");
    expect(vi.mocked(queryFreightToCountry).mock.calls[0][1]).toBe("12000012345678");
  });

  it("provar nästa kandidat när AliExpress säger att fraktsättet inte finns", async () => {
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockResolvedValue(
      frakt([
        { code: "FINNS_EJ", shipping_fee_cent: 0, max_delivery_days: 5 },
        { code: "FUNKAR", shipping_fee_cent: 0, max_delivery_days: 9 },
      ]),
    );
    vi.mocked(createOrder)
      .mockResolvedValueOnce({
        tradeOrderId: "",
        orderDefinitelyNotPlaced: true,
        aeError: "DELIVERY_METHOD_NOT_EXIST",
      } as never)
      .mockResolvedValueOnce({ tradeOrderId: "T2" } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(true);
    const anrop = vi.mocked(createOrder).mock.calls;
    expect(anrop[0][0].logisticsServiceName).toBe("FINNS_EJ");
    expect(anrop[1][0].logisticsServiceName).toBe("FUNKAR");
  });

  it("försöker ALDRIG om vid ett oklart svar — då kan en order finnas", async () => {
    // Loopens säkerhetsvillkor. Ett omförsök här vore en dubbelbeställning.
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockResolvedValue(
      frakt([{ code: "A", shipping_fee_cent: 0 }, { code: "B", shipping_fee_cent: 0 }]),
    );
    vi.mocked(createOrder).mockResolvedValue({
      tradeOrderId: "",
      orderDefinitelyNotPlaced: false,
      aeError: "DELIVERY_METHOD_NOT_EXIST",
    } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(false);
    expect(vi.mocked(createOrder)).toHaveBeenCalledTimes(1);
  });

  it("försöker inte om vid ett ANNAT fel än fraktsättet", async () => {
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockResolvedValue(
      frakt([{ code: "A", shipping_fee_cent: 0 }, { code: "B", shipping_fee_cent: 0 }]),
    );
    vi.mocked(createOrder).mockResolvedValue({
      tradeOrderId: "",
      orderDefinitelyNotPlaced: true,
      aeError: "InsufficientBalance",
    } as never);

    await placeOrderForTask(store, "o1:l1");
    expect(vi.mocked(createOrder)).toHaveBeenCalledTimes(1);
  });

  it("later AliExpress valja nar fraktfragan ger tomt", async () => {
    // Ingen gissning. Att tvinga fram CAINIAO_ECONOMY_GLOBAL var grundfelet
    // bakom #10021 — AliExpress avvisar hela ordern nar tjansten inte finns,
    // i stallet for att falla tillbaka pa nagot som funkar.
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockResolvedValue({ method: "test", raw: {} });
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T3" } as never);

    await placeOrderForTask(store, "o1:l1");
    expect(vi.mocked(createOrder).mock.calls[0][0].logisticsServiceName).toBeUndefined();
  });

  it("ett kast i fraktfrågan låser INTE tasken — ordern läggs som förut", async () => {
    // Fraktfrågan sker före varje AE-orderanrop, så ett fel där får aldrig ge
    // "osäker order".
    const store = await seed(task());
    vi.mocked(queryFreightToCountry).mockRejectedValue(new Error("frakt-API nere"));
    vi.mocked(createOrder).mockResolvedValue({ tradeOrderId: "T4" } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(true);
    expect(vi.mocked(createOrder).mock.calls[0][0].logisticsServiceName).toBeUndefined();
  });
});

describe("placeOrderForTask — fraktdiagnos i felmeddelandet", () => {
  it("pastar INTE att varan saknar frakt — bara att var fraga gav tomt", async () => {
    // En tidigare version sa "varan gar inte att skicka hit". Det var att dra
    // en slutsats koden inte kan bara: den vet bara att VAR fraga gav noll.
    // AliExpress egen produktsida erbjod samtidigt frakt fran tre lander.
    const store = await seed(task());
    vi.mocked(getProduct).mockResolvedValue({ variants: [] } as never);
    vi.mocked(queryFreightToCountry).mockResolvedValue({ method: "t", raw: {} });
    vi.mocked(createOrder).mockResolvedValue({
      tradeOrderId: "",
      orderDefinitelyNotPlaced: true,
      aeErrorCode: "DELIVERY_METHOD_NOT_EXIST",
      aeError: "DELIVERY_METHOD_NOT_EXIST",
    } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("gav inga alternativ");
      expect(r.error).not.toContain("går inte att skicka");
      expect(r.error).toContain("utan angivet fraktsätt");
    }
  });

  it("listar de fraktsatt som provades nar alternativ FANNS", async () => {
    const store = await seed(task());
    vi.mocked(getProduct).mockResolvedValue({
      variants: [{ skuId: "12000012345678", skuAttr: "skuA", skuProps: {} }],
    } as never);
    vi.mocked(queryFreightToCountry).mockResolvedValue({
      method: "t",
      raw: { delivery_option_list: [{ code: "AAA", shipping_fee_cent: 0, max_delivery_days: 7 }] },
    });
    vi.mocked(createOrder).mockResolvedValue({
      tradeOrderId: "",
      orderDefinitelyNotPlaced: true,
      aeErrorCode: "DELIVERY_METHOD_NOT_EXIST",
      aeError: "DELIVERY_METHOD_NOT_EXIST",
    } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("AAA");
  });

  it("ett ANNAT fel behaller det gamla meddelandet", async () => {
    const store = await seed(task());
    vi.mocked(getProduct).mockResolvedValue({ variants: [] } as never);
    vi.mocked(queryFreightToCountry).mockResolvedValue({ method: "t", raw: {} });
    vi.mocked(createOrder).mockResolvedValue({
      tradeOrderId: "",
      orderDefinitelyNotPlaced: true,
      aeError: "InsufficientBalance",
    } as never);

    const r = await placeOrderForTask(store, "o1:l1");
    if (!r.ok) expect(r.error).toContain("Åtgärda och försök igen");
  });
});
