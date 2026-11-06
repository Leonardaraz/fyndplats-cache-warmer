// Återbetalningar i Stripe-kassan: Wix → Stripe (speglaAterbetalningar i lib/kassa/flode.ts).
// Kör: node --test --experimental-strip-types lib/kassa/aterbetalning.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NAT_LARM_SEK,
  STRIPE_ATER_KALLA,
  STRIPE_KALLA,
  larmNu,
  larmnyckel,
  ordrarMedStripeAterbetalning,
  speglaAterbetalningar,
  speglingsbeslut,
  wixStripeBetalningar,
  type AterbetalningDeps,
  type Laddning,
  type OrderTransaktioner,
  type Speglingslarm,
  type WixStripeBetalning,
} from "./flode.ts";

const ORDER = "order-1";
const kr = (ore: number) => (ore / 100).toFixed(2);

/** Orderns transaktioner i Wix: kassans betalning (ch_1) och återbetalningar på den. */
function wix(betaltOre: number, ater: { ore: number; status?: string }[] = [], andra: OrderTransaktioner["payments"] = []): OrderTransaktioner {
  return {
    payments: [{ id: "p-stripe", amount: { amount: kr(betaltOre) }, regularPaymentDetails: { providerTransactionId: "ch_1", offlinePayment: false } }, ...andra],
    refunds: ater.map((a, i) => ({ id: `r-${i}`, transactions: [{ paymentId: "p-stripe", amount: { amount: kr(a.ore) }, refundStatus: a.status ?? "SUCCEEDED" }] })),
  };
}

function laddning(over: Partial<Laddning> = {}): Laddning {
  return { id: "ch_1", dragetOre: 65900, aterbetaltOre: 0, valuta: "sek", tvist: false, metadata: { kalla: STRIPE_KALLA, cartId: "k", wixOrderId: ORDER }, senastAterbetaldSek: null, ...over };
}

function stripeFel(status: number, typ: string | null, kod: string | null): Error {
  return Object.assign(new Error(`Stripe ${status}`), { name: "StripeFel", status, typ, kod });
}

/**
 * Låtsas-Stripe med Stripes idempotens: samma nyckel och samma belopp ger samma
 * svar igen utan nya pengar, samma nyckel med ett annat belopp nekas
 * (idempotency_error), och mer än det dragna nekas.
 */
function falskStripe(dragetOre = 65900) {
  let aterbetaltOre = 0;
  const nycklar = new Map<string, { ore: number; svar: { id: string; status: string } }>();
  const anrop: { laddning: string; ore: number; nyckel: string; metadata: Record<string, string> }[] = [];
  return {
    get aterbetaltOre() {
      return aterbetaltOre;
    },
    anrop,
    nycklar,
    las: () => laddning({ dragetOre, aterbetaltOre }),
    aterbetalaDel: async (laddningId: string, ore: number, nyckel: string, metadata: Record<string, string>) => {
      anrop.push({ laddning: laddningId, ore, nyckel, metadata });
      const fanns = nycklar.get(nyckel);
      if (fanns) {
        if (fanns.ore !== ore) throw stripeFel(400, "idempotency_error", null);
        return fanns.svar;
      }
      if (ore <= 0 || aterbetaltOre + ore > dragetOre) throw stripeFel(400, "invalid_request_error", "amount_too_large");
      aterbetaltOre += ore;
      const svar = { id: `re_${nycklar.size + 1}`, status: "succeeded" };
      nycklar.set(nyckel, { ore, svar });
      return svar;
    },
  };
}

function deps(t: () => OrderTransaktioner, s: ReturnType<typeof falskStripe>, over: Partial<AterbetalningDeps> = {}): AterbetalningDeps & { loggar: string[] } {
  const loggar: string[] = [];
  return {
    orderTransaktioner: async () => t(),
    hamtaLaddning: async () => s.las(),
    aterbetalaDel: s.aterbetalaDel,
    logg: (rad) => loggar.push(rad),
    vila: async () => {},
    loggar,
    ...over,
  };
}

test("wixStripeBetalningar: bara kassans Stripe-betalningar, och bara lyckade återbetalningar räknas", () => {
  const t: OrderTransaktioner = {
    payments: [
      { id: "p-stripe", amount: { amount: "659.00" }, regularPaymentDetails: { providerTransactionId: "ch_1", offlinePayment: false } },
      // Wix Payments Klarna (uppmätt 2026-11-06 på en riktig order): leverantörens GUID.
      { id: "p-wix", amount: { amount: "1059.00" }, regularPaymentDetails: { providerTransactionId: "19b9accd-7bde-897f-af90-5fee40189481", offlinePayment: false } },
      { id: "p-offline", amount: { amount: "10.00" }, regularPaymentDetails: { providerTransactionId: "ch_offline", offlinePayment: true } },
      { id: "p-presentkort", amount: { amount: "50.00" } },
    ],
    refunds: [
      { id: "r1", transactions: [{ paymentId: "p-stripe", amount: { amount: "100.00" }, refundStatus: "SUCCEEDED" }] },
      { id: "r2", transactions: [{ paymentId: "p-stripe", amount: { amount: "50.00" }, refundStatus: "PENDING" }] },
      { id: "r3", transactions: [{ paymentId: "p-stripe", amount: { amount: "30.00" }, refundStatus: "FAILED" }] },
      { id: "r4", transactions: [{ paymentId: "p-wix", amount: { amount: "1059" }, refundStatus: "SUCCEEDED" }] },
    ],
  };
  assert.deepEqual(wixStripeBetalningar(t), [{ betalningId: "p-stripe", transaktion: "ch_1", beloppOre: 65900, aterbetaltOre: 10000, pagar: true, okant: false }]);
  // Klarna och kort via Stripe har ch_ eller py_; utan laddning sparas betalningens pi_.
  const med = (id: string): OrderTransaktioner => ({ payments: [{ id: "p", amount: { amount: "1" }, regularPaymentDetails: { providerTransactionId: id } }], refunds: [] });
  for (const id of ["ch_3Abc", "py_3Abc", "pi_3Abc"]) assert.equal(wixStripeBetalningar(med(id))[0]?.transaktion, id);
  for (const id of ["re_3Abc", "ch_3Abc&x", "ch_", "CH_3Abc", ""]) assert.deepEqual(wixStripeBetalningar(med(id)), [], id);
});

test("wixStripeBetalningar: ett belopp som inte går att läsa gör betalningen okänd, inte noll", () => {
  const t = wix(65900);
  t.refunds.push({ id: "rx", transactions: [{ paymentId: "p-stripe", amount: { amount: "12,50 kr" }, refundStatus: "SUCCEEDED" }] });
  assert.equal(wixStripeBetalningar(t)[0].okant, true);
});

test("speglingsbeslut: varje gren", () => {
  const b = (over: Partial<WixStripeBetalning> = {}): WixStripeBetalning => ({ betalningId: "p", transaktion: "ch_1", beloppOre: 65900, aterbetaltOre: 30000, pagar: false, okant: false, ...over });
  assert.deepEqual(speglingsbeslut(ORDER, b(), null), { gor: "inget", skal: "inte_var" });
  assert.deepEqual(speglingsbeslut(ORDER, b(), laddning({ metadata: { kalla: "annat" } })), { gor: "larm", skal: "inte_kassans" });
  assert.deepEqual(speglingsbeslut(ORDER, b(), laddning({ metadata: { kalla: STRIPE_KALLA, wixOrderId: "order-2" } })), { gor: "larm", skal: "annan_order" });
  assert.deepEqual(speglingsbeslut(ORDER, b({ okant: true }), laddning()), { gor: "larm", skal: "okant_belopp" });
  assert.deepEqual(speglingsbeslut(ORDER, b({ beloppOre: null }), laddning()), { gor: "larm", skal: "okant_belopp" });
  assert.deepEqual(speglingsbeslut(ORDER, b({ beloppOre: 65800 }), laddning()), { gor: "larm", skal: "olika_belopp" });
  assert.deepEqual(speglingsbeslut(ORDER, b(), laddning({ valuta: "eur" })), { gor: "larm", skal: "olika_belopp" });
  assert.deepEqual(speglingsbeslut(ORDER, b({ aterbetaltOre: 66000 }), laddning()), { gor: "larm", skal: "over_beloppet" });
  assert.deepEqual(speglingsbeslut(ORDER, b({ aterbetaltOre: 10000 }), laddning({ aterbetaltOre: 20000 })), { gor: "larm", skal: "stripe_fore_wix" });
  assert.deepEqual(speglingsbeslut(ORDER, b(), laddning({ aterbetaltOre: 30000 })), { gor: "inget", skal: "lika" });
  assert.deepEqual(speglingsbeslut(ORDER, b({ pagar: true }), laddning({ aterbetaltOre: 30000 })), { gor: "vanta" });
  assert.deepEqual(speglingsbeslut(ORDER, b(), laddning({ tvist: true })), { gor: "larm", skal: "tvist" });
  // Nyckeln bär Stripes summa före återbetalningen, inte Wix (se ☠️ EN GÅNG).
  assert.deepEqual(speglingsbeslut(ORDER, b(), laddning({ aterbetaltOre: 10000 })), { gor: "aterbetala", ore: 20000, nyckel: "fp-ater-ch_1-10000" });
  // Orderns id saknas på betalningen när markeringen föll: laddningen på ordern räcker.
  assert.equal(speglingsbeslut(ORDER, b(), laddning({ metadata: { kalla: STRIPE_KALLA } })).gor, "aterbetala");
});

test("en återbetalning i Wix görs en gång i Stripe, med orderns id i metadata", async () => {
  const s = falskStripe();
  let t = wix(65900);
  const d = deps(() => t, s);
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: false, larm: [] });
  assert.equal(s.anrop.length, 0, "inget återbetalt i Wix: ingen fråga om pengar");
  t = wix(65900, [{ ore: 65900 }]);
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 1, vantar: false, larm: [] });
  assert.equal(s.aterbetaltOre, 65900);
  assert.deepEqual(s.anrop[0], { laddning: "ch_1", ore: 65900, nyckel: "fp-ater-ch_1-0", metadata: { kalla: STRIPE_ATER_KALLA, wixOrderId: ORDER } });
  for (let i = 0; i < 3; i++) assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: false, larm: [] });
  assert.equal(s.anrop.length, 1, "omkörningar gör ingenting");
});

test("delåterbetalningar: 100 kr och sedan 50 kr till blir två återbetalningar med olika nycklar", async () => {
  const s = falskStripe();
  let t = wix(65900, [{ ore: 10000 }]);
  const d = deps(() => t, s);
  await speglaAterbetalningar(d, ORDER);
  t = wix(65900, [{ ore: 10000 }, { ore: 5000 }]);
  await speglaAterbetalningar(d, ORDER);
  assert.deepEqual(s.anrop.map((a) => [a.ore, a.nyckel]), [[10000, "fp-ater-ch_1-0"], [5000, "fp-ater-ch_1-10000"]]);
  assert.equal(s.aterbetaltOre, 15000);
});

test("webhooken och nätet samtidigt blir en återbetalning", async () => {
  const s = falskStripe();
  const t = wix(65900, [{ ore: 20000 }]);
  // Båda läser Stripe innan någon av dem hunnit betala tillbaka.
  let lasta = 0;
  let slapp: () => void = () => {};
  const bada = new Promise<void>((r) => (slapp = r));
  const d = deps(() => t, s, {
    hamtaLaddning: async () => {
      const las = s.las();
      if (++lasta === 2) slapp();
      await bada;
      return las;
    },
  });
  const [a, b] = await Promise.all([speglaAterbetalningar(d, ORDER), speglaAterbetalningar(d, ORDER)]);
  assert.equal(s.aterbetaltOre, 20000, "en gång, inte två");
  assert.equal(a.aterbetalda + b.aterbetalda, 2, "Stripe svarade båda med samma återbetalning");
  assert.equal(s.nycklar.size, 1);
});

test("två återbetalningar i Wix tätt efter varandra: den som läst den äldre Wix-summan nekas och läser om, aldrig för mycket tillbaka", async () => {
  const s = falskStripe();
  // Spegling A läste Wix före den andra återbetalningen, B efter; båda läste Stripe på noll.
  const vyer = [wix(65900, [{ ore: 10000 }]), wix(65900, [{ ore: 10000 }, { ore: 5000 }])];
  let wixLasningar = 0;
  let lasta = 0;
  let slapp: () => void = () => {};
  const bada = new Promise<void>((r) => (slapp = r));
  const d = deps(() => vyer[Math.min(wixLasningar++, 1)], s, {
    hamtaLaddning: async () => {
      const las = s.las();
      if (++lasta <= 2) {
        if (lasta === 2) slapp();
        await bada;
      }
      return las;
    },
  });
  await Promise.all([speglaAterbetalningar(d, ORDER), speglaAterbetalningar(d, ORDER)]);
  assert.equal(s.aterbetaltOre, 15000, "exakt Wix summa");
  assert.ok(s.anrop.some((a) => a.nyckel === "fp-ater-ch_1-0"));
});

test("Stripe nekar: larm med Stripes kod, inget kastas", async () => {
  const s = falskStripe();
  const d = deps(() => wix(65900, [{ ore: 65900 }]), s, {
    aterbetalaDel: async () => {
      throw stripeFel(400, "invalid_request_error", "charge_disputed");
    },
  });
  const u = await speglaAterbetalningar(d, ORDER);
  assert.equal(u.aterbetalda, 0);
  assert.deepEqual(u.larm.map((l) => [l.skal, l.kod, l.wixOre, l.stripeOre]), [["fel", "charge_disputed", 65900, 0]]);
  assert.ok(d.loggar.some((r) => r.includes("☠️")));
  assert.ok(!d.loggar.some((r) => /659|65900/.test(r)), "inga belopp i loggen");
});

test("Stripe svarar failed: larm", async () => {
  const d = deps(() => wix(65900, [{ ore: 100 }]), falskStripe(), { aterbetalaDel: async () => ({ id: "re_1", status: "failed" }) });
  assert.deepEqual((await speglaAterbetalningar(d, ORDER)).larm.map((l) => [l.skal, l.kod]), [["fel", "failed"]]);
});

test("inget svar från Stripe: inget larm, nästa spegling läser om", async () => {
  const d = deps(() => wix(65900, [{ ore: 100 }]), falskStripe(), {
    aterbetalaDel: async () => {
      throw new Error("The operation was aborted due to timeout");
    },
  });
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: true, larm: [] });
});

test("en krock som står kvar efter tre rundor lämnas åt nätet, utan larm", async () => {
  let forsok = 0;
  const d = deps(() => wix(65900, [{ ore: 100 }]), falskStripe(), {
    aterbetalaDel: async () => {
      forsok++;
      throw stripeFel(409, "idempotency_error", "idempotency_key_in_use");
    },
  });
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: true, larm: [] });
  assert.equal(forsok, 3);
});

test("Wix egna betalningar: ingen fråga till Stripe", async () => {
  let fragor = 0;
  const t: OrderTransaktioner = {
    payments: [{ id: "p-wix", amount: { amount: "1059.00" }, regularPaymentDetails: { providerTransactionId: "19b9accd-7bde-897f-af90-5fee40189481" } }],
    refunds: [{ id: "r", transactions: [{ paymentId: "p-wix", amount: { amount: "1059" }, refundStatus: "SUCCEEDED" }] }],
  };
  const d = deps(() => t, falskStripe(), { hamtaLaddning: async () => (fragor++, null) });
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: false, larm: [] });
  assert.equal(fragor, 0);
});

test("ett Stripe-likt id som inte finns i vårt konto gör ingenting och larmar inte", async () => {
  const d = deps(() => wix(65900, [{ ore: 65900 }]), falskStripe(), { hamtaLaddning: async () => null });
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: false, larm: [] });
});

test("återbetalt först i Stripe och sedan bokfört i Wix: aldrig dubbelt", async () => {
  const s = falskStripe();
  // Leonard följer Wix råd för manuella betalningar och betalar tillbaka i Stripe först.
  await s.aterbetalaDel("ch_1", 20000, "manuellt-i-panelen", {});
  let t = wix(65900);
  const d = deps(() => t, s);
  const fore = await speglaAterbetalningar(d, ORDER);
  assert.deepEqual(fore.larm.map((l) => l.skal), ["stripe_fore_wix"]);
  t = wix(65900, [{ ore: 20000 }]);
  assert.deepEqual(await speglaAterbetalningar(d, ORDER), { aterbetalda: 0, vantar: false, larm: [] });
  assert.equal(s.aterbetaltOre, 20000);
});

test("slumpade återbetalningar och samtidiga speglingar: Stripe når exakt Wix summa och går aldrig över", async () => {
  let fro = 20261106;
  const slump = () => ((fro = (fro * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let fall = 0; fall < 400; fall++) {
    const draget = 1000 + Math.floor(slump() * 200000);
    const s = falskStripe(draget);
    const ater: { ore: number }[] = [];
    let summa = 0;
    const d = deps(() => wix(draget, [...ater]), s);
    for (let steg = 0; steg < 6; steg++) {
      const kvar = draget - summa;
      if (kvar > 0 && slump() < 0.7) {
        const ore = 1 + Math.floor(slump() * kvar);
        ater.push({ ore });
        summa += ore;
      }
      const samtidiga = 1 + Math.floor(slump() * 3);
      await Promise.all(Array.from({ length: samtidiga }, () => speglaAterbetalningar(d, ORDER)));
      assert.ok(s.aterbetaltOre <= summa, `fall ${fall}: Stripe ${s.aterbetaltOre} över Wix ${summa}`);
    }
    await speglaAterbetalningar(d, ORDER);
    assert.equal(s.aterbetaltOre, summa, `fall ${fall}`);
  }
});

test("larmNu: Stripe före Wix väntar 30 minuter efter Stripes senaste återbetalning, allt annat larmar direkt", () => {
  const nu = 1_800_000_000;
  const l = (over: Partial<Speglingslarm>): Speglingslarm => ({ skal: "stripe_fore_wix", laddning: "ch_1", wixOre: 0, stripeOre: 100, senastAterbetaldSek: nu - 60, ...over });
  assert.equal(larmNu(l({}), nu), false);
  assert.equal(larmNu(l({ senastAterbetaldSek: nu - NAT_LARM_SEK }), nu), true);
  assert.equal(larmNu(l({ senastAterbetaldSek: null }), nu), false);
  for (const skal of ["fel", "tvist", "over_beloppet", "olika_belopp", "okant_belopp", "annan_order", "inte_kassans"] as const) assert.equal(larmNu(l({ skal }), nu), true, skal);
});

test("larmnyckel: samma läge ger samma nyckel, ett nytt belopp en ny", () => {
  const l: Speglingslarm = { skal: "fel", laddning: "ch_1", wixOre: 100, stripeOre: 0, senastAterbetaldSek: null, kod: "x" };
  assert.equal(larmnyckel(ORDER, l), larmnyckel(ORDER, { ...l, kod: "y" }));
  assert.notEqual(larmnyckel(ORDER, l), larmnyckel(ORDER, { ...l, wixOre: 200 }));
  assert.notEqual(larmnyckel(ORDER, l), larmnyckel("order-2", l));
});

test("ordrarMedStripeAterbetalning: bara kassans betalningar med en order, varje order en gång", () => {
  assert.deepEqual(
    ordrarMedStripeAterbetalning([
      { metadata: { kalla: STRIPE_KALLA, wixOrderId: "o1" } },
      { metadata: { kalla: STRIPE_KALLA, wixOrderId: "o1" } },
      { metadata: { kalla: STRIPE_KALLA } },
      { metadata: { kalla: "annat", wixOrderId: "o2" } },
      { metadata: null },
      { metadata: { kalla: STRIPE_KALLA, wixOrderId: "o3" } },
    ]),
    ["o1", "o3"],
  );
});
