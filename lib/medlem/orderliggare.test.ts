// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Orderliggaren: Wix-order → rad. Ordrarna här har samma form som provordern
// i E0 (2026-11-04), men alla värden är påhittade: repot är publikt.
import test from "node:test";
import assert from "node:assert/strict";
import {
  aterbetalningar,
  behoverTransaktioner,
  betaltid,
  epostNyckel,
  liggarradUrOrder,
  liggarradUrWix,
  ore,
  skillnader,
} from "./orderliggare.ts";
import { normaliseraEpost } from "./inloggning.ts";

const pengar = (kr: string) => ({ amount: kr, formattedAmount: `${kr} kr` });

function order(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "00000000-aaaa-4bbb-8ccc-000000000001",
    number: "20001",
    createdDate: "2026-10-01T10:00:00.000Z",
    purchasedDate: "2026-10-01T10:00:00.000Z",
    status: "APPROVED",
    paymentStatus: "PAID",
    currency: "SEK",
    buyerInfo: { email: "  Kund@Example.SE " },
    channelInfo: { type: "WEB" },
    purchaseFlowId: "flode-1",
    lineItems: [
      {
        id: "rad-1",
        productName: { original: "Påhittad vara" },
        catalogReference: { catalogItemId: "prod-1", options: { variantId: "var-1" } },
        quantity: 2,
        itemType: { preset: "PHYSICAL" },
        price: pengar("150.00"),
        totalDiscount: pengar("0.00"),
        totalPriceAfterTax: pengar("300.00"),
      },
      {
        id: "rad-2",
        productName: { original: "Presentkort" },
        quantity: 1,
        itemType: { preset: "GIFT_CARD" },
        price: pengar("100.00"),
        totalPriceAfterTax: pengar("100.00"),
      },
    ],
    shippingInfo: { cost: { price: pengar("19.00"), totalPriceAfterTax: pengar("19.00") } },
    // Som i Wix: delsumma och frakt UTAN moms, totalen med.
    priceSummary: { subtotal: pengar("320.00"), shipping: pengar("15.20"), total: pengar("419.00") },
    balanceSummary: { refunded: pengar("0"), pendingRefund: pengar("0") },
    activities: [
      { type: "ORDER_PLACED", createdDate: "2026-10-01T10:00:00.000Z" },
      { type: "ORDER_PAID", createdDate: "2026-10-01T10:00:04.000Z" },
    ],
    ...over,
  };
}

const aterbetald = (refunds: Record<string, unknown>[]) => ({ orderTransactions: { orderId: "x", payments: [], refunds } });

test("ore läser Wix-pengar exakt", () => {
  assert.equal(ore(pengar("12.34")), 1234);
  assert.equal(ore("1999.99"), 199_999);
  assert.equal(ore("75.915"), 7592);
  assert.equal(ore("0"), 0);
  assert.equal(ore(12.5), 1250);
  assert.equal(ore(null), 0);
  assert.equal(ore("abc"), 0);
});

test("e-posten nycklas likadant i liggaren och i inloggningen", () => {
  for (const e of ["Kund@Example.SE", " kund@example.se ", "A.B+C@Exempel.nu"]) {
    assert.equal(epostNyckel(e), normaliseraEpost(e));
  }
});

test("E1-2: varuvärdet är raderna med moms; frakt och presentkort räknas inte", () => {
  const rad = liggarradUrOrder(order());
  assert.equal(rad.varorOre, 30_000);
  assert.equal(rad.fraktOre, 1_900);
  assert.equal(rad.totaltOre, 41_900);
  assert.equal(rad.summaStammer, true);
  assert.equal(rad.raknas, true);
  assert.equal(rad.epost, "kund@example.se");
  assert.equal(rad.purchaseFlowId, "flode-1");
  assert.equal(rad.betald, "2026-10-01T10:00:04.000Z");
  assert.deepEqual(
    rad.rader.map((r) => [r.namn, r.antal, r.beloppOre, r.raknas]),
    [
      ["Påhittad vara", 2, 30_000, true],
      ["Presentkort", 1, 10_000, false],
    ],
  );
});

test("en rabatt på raden följer med i varuvärdet", () => {
  const o = order();
  (o.lineItems as Record<string, unknown>[])[0].totalPriceAfterTax = pengar("270.00");
  o.priceSummary = { total: pengar("389.00") };
  const rad = liggarradUrOrder(o);
  assert.equal(rad.varorOre, 27_000);
  assert.equal(rad.summaStammer, true);
});

test("summan som inte går jämnt upp flaggas", () => {
  const rad = liggarradUrOrder(order({ priceSummary: { total: pengar("500.00") } }));
  assert.equal(rad.summaStammer, false);
});

test("P1: en fakturaorder räknas från betalningen, en obetald inte alls", () => {
  const obetald = liggarradUrOrder(
    order({ paymentStatus: "NOT_PAID", channelInfo: { type: "BACKOFFICE_MERCHANT" }, activities: [{ type: "ORDER_PLACED", createdDate: "2026-10-01T10:00:00.000Z" }] }),
  );
  assert.equal(obetald.raknas, false);
  assert.equal(obetald.orsak, "obetald");
  assert.equal(obetald.betald, undefined);
  const betaldSenare = liggarradUrOrder(
    order({
      channelInfo: { type: "BACKOFFICE_MERCHANT" },
      activities: [
        { type: "ORDER_PLACED", createdDate: "2026-10-01T10:00:00.000Z" },
        { type: "ORDER_PAID", createdDate: "2026-10-20T08:00:00.000Z" },
      ],
    }),
  );
  assert.equal(betaldSenare.betald, "2026-10-20T08:00:00.000Z");
  assert.equal(betaldSenare.raknas, true);
  // Två betalhändelser, i omvänd ordning i listan: den första räknas.
  const tva = liggarradUrOrder(
    order({
      activities: [
        { type: "ORDER_PAID", createdDate: "2026-10-05T08:00:00.000Z" },
        { type: "ORDER_PAID", createdDate: "2026-10-01T10:00:04.000Z" },
      ],
    }),
  );
  assert.equal(tva.betald, "2026-10-01T10:00:04.000Z");
});

test("utan ORDER_PAID används den godkända betalningen, sedan köptiden", () => {
  const o = order({ activities: [] });
  const tx = { orderTransactions: { payments: [{ status: "APPROVED", createdDate: "2026-10-01T10:00:02.000Z" }], refunds: [] } };
  assert.equal(betaltid(o, tx), "2026-10-01T10:00:02.000Z");
  assert.equal(betaltid(o, null), "2026-10-01T10:00:00.000Z");
  assert.equal(betaltid(order({ activities: [], paymentStatus: "NOT_PAID" }), null), undefined);
});

test("en avbruten order räknas inte, och inte en i annan valuta", () => {
  assert.equal(liggarradUrOrder(order({ status: "CANCELED" })).orsak, "avbruten");
  assert.equal(liggarradUrOrder(order({ currency: "EUR" })).orsak, "valuta");
});

test("en återbetald order kräver transaktionerna", () => {
  const o = order({ paymentStatus: "PARTIALLY_REFUNDED", balanceSummary: { refunded: pengar("150.00") } });
  assert.equal(behoverTransaktioner(o), true);
  assert.equal(behoverTransaktioner(order()), false);
  assert.throws(() => liggarradUrOrder(o), /transaktioner/);
});

test("E1-6: varuvärdet per återbetalning tas ur Wix uppdelning; frakt räknas aldrig", () => {
  const o = order({ paymentStatus: "PARTIALLY_REFUNDED", balanceSummary: { refunded: pengar("169.00") } });
  const tx = aterbetald([
    {
      id: "ater-1",
      createdDate: "2026-10-10T09:00:00.000Z",
      transactions: [{ refundStatus: "SUCCEEDED" }],
      details: { items: [{ lineItemId: "rad-1", quantity: 1 }], shippingIncluded: true, shipping: { amount: pengar("19.00") } },
      summary: { refunded: pengar("169.00"), breakdown: { lineItems: [{ lineItemId: "rad-1", totalRefundedAmount: pengar("150.00") }] } },
    },
  ]);
  const rad = liggarradUrOrder(o, tx);
  assert.deepEqual(rad.aterbetalningar, [{ id: "ater-1", tid: "2026-10-10T09:00:00.000Z", varorOre: 15_000 }]);
  assert.equal(rad.aterbetaltVarorOre, 15_000);
});

test("bara frakt återbetald: varuvärdet är noll", () => {
  const tx = aterbetald([
    {
      id: "frakt",
      createdDate: "2026-10-10T09:00:00.000Z",
      transactions: [{ refundStatus: "SUCCEEDED" }],
      details: { items: [], shippingIncluded: true, shipping: { amount: pengar("19.00") } },
      summary: { refunded: pengar("19.00") },
    },
  ]);
  assert.deepEqual(aterbetalningar(tx, new Set(["rad-1"]), 30_000), [{ id: "frakt", tid: "2026-10-10T09:00:00.000Z", varorOre: 0 }]);
});

test("ett fritt belopp utan rader räknas som varor, och ett misslyckat inte alls", () => {
  const tx = aterbetald([
    { id: "fritt", createdDate: "2026-10-11T09:00:00.000Z", transactions: [{ refundStatus: "SUCCEEDED" }], details: {}, summary: { refunded: pengar("50.00") } },
    { id: "fel", createdDate: "2026-10-12T09:00:00.000Z", transactions: [{ refundStatus: "FAILED" }], details: {}, summary: { refunded: pengar("0"), requestedRefund: pengar("80.00") } },
  ]);
  assert.deepEqual(
    aterbetalningar(tx, new Set(["rad-1"]), 30_000).map((a) => [a.id, a.varorOre]),
    [["fritt", 5_000]],
  );
});

test("presentkortets rad i en återbetalning räknas inte", () => {
  const tx = aterbetald([
    {
      id: "pk",
      createdDate: "2026-10-10T09:00:00.000Z",
      transactions: [{ refundStatus: "SUCCEEDED" }],
      summary: { refunded: pengar("100.00"), breakdown: { lineItems: [{ lineItemId: "rad-2", totalRefundedAmount: pengar("100.00") }] } },
    },
  ]);
  assert.equal(aterbetalningar(tx, new Set(["rad-1"]), 30_000)[0].varorOre, 0);
});

test("aldrig mer tillbaka än varorna kostade", () => {
  const tx = aterbetald([
    { id: "a", createdDate: "2026-10-10T09:00:00.000Z", summary: { refunded: pengar("200.00") }, details: {} },
    { id: "b", createdDate: "2026-10-11T09:00:00.000Z", summary: { refunded: pengar("200.00") }, details: {} },
  ]);
  assert.deepEqual(
    aterbetalningar(tx, new Set(), 30_000).map((a) => [a.id, a.varorOre]),
    [
      ["a", 20_000],
      ["b", 10_000],
    ],
  );
});

test("en helt återbetald och avbruten order (som provordern) räknas inte", () => {
  const o = order({ status: "CANCELED", paymentStatus: "FULLY_REFUNDED", balanceSummary: { refunded: pengar("419.00") } });
  const tx = aterbetald([
    {
      id: "allt",
      createdDate: "2026-10-01T10:04:00.000Z",
      transactions: [{ refundStatus: "SUCCEEDED" }],
      details: { shippingIncluded: true, shipping: { amount: pengar("19.00") } },
      summary: {
        refunded: pengar("419.00"),
        breakdown: {
          lineItems: [
            { lineItemId: "rad-1", totalRefundedAmount: pengar("300.00") },
            { lineItemId: "rad-2", totalRefundedAmount: pengar("100.00") },
          ],
        },
      },
    },
  ]);
  const rad = liggarradUrOrder(o, tx);
  assert.equal(rad.raknas, false);
  assert.equal(rad.orsak, "avbruten");
  assert.equal(rad.aterbetaltVarorOre, 30_000);
});

test("raden överlever en tur genom Wix, och avstämningen ser bara verkliga skillnader", () => {
  const rad = liggarradUrOrder(order());
  const tillbaka = liggarradUrWix(JSON.parse(JSON.stringify({ ...rad, _id: rad.orderId })));
  assert.deepEqual(skillnader(rad, tillbaka), []);
  assert.deepEqual(skillnader(rad, { ...tillbaka, varorOre: 1 }), ["varorOre"]);
  assert.deepEqual(skillnader(rad, { ...tillbaka, aterbetalningar: [{ id: "x", tid: "t", varorOre: 1 }] }), ["aterbetalningar"]);
});
