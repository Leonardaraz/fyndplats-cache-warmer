// lib/kassa/stripe-flode.test.ts — Stripe-kassans flöde (forberedStripe och
// slutforStripe i lib/kassa/flode.ts) mot ett låtsas-Wix och ett låtsas-Stripe
// som minns varje anrop.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  forberedStripe,
  slutforStripe,
  kronorAv,
  avsiktParametrar,
  faktureringAv,
  arKlart,
  attSlutfora,
  utfallLage,
  webhookStatus,
  NAT_EFTER_SEK,
  NAT_LARM_SEK,
  STRIPE_KALLA,
  STRIPE_LAS_MS,
  type Avsikt,
  type SlutforUtfall,
  type AvsiktParametrar,
  type Korg,
  type Kund,
  type Rakning,
  type StripeKassaDeps,
  type StripeLas,
} from "./flode.ts";

const NU = new Date("2026-11-06T10:00:00.000Z");
const SATT = { code: "ddaca2f4", appId: "45c44b27", title: { original: "Spårbar standardleverans" } };
const KUND: Kund = {
  epost: "kund@exempel.se",
  fornamn: "Prov",
  efternamn: "Provsson",
  telefon: "+46701740605",
  gata: "Provgatan 1",
  co: "",
  postnr: "111 22",
  ort: "Stockholm",
  kupong: "",
};
const KORG: Korg = {
  id: "korg-1",
  lineItems: [{ id: "rad-1", name: { original: "Pedalhink 20 l" }, quantityInfo: { requestedQuantity: 1 }, source: { catalogReference: { catalogItemId: "prod-1" } } }],
  deliveryInfo: { method: SATT },
};

function rakning(total: string, opts: { satt?: boolean; overtradelse?: boolean } = {}): Rakning {
  return {
    cart: { ...KORG, deliveryInfo: opts.satt === false ? {} : { method: SATT } },
    summary: {
      deliverySummary: { method: SATT },
      priceSummary: { total: { amount: total } },
      violations: opts.overtradelse ? [{ code: "LINE_ITEMS_OUT_OF_STOCK", severity: "ERROR" }] : [],
      priceVerificationToken: `bevis-${total}`,
    },
  };
}

function avsikt(over: Partial<Avsikt> = {}): Avsikt {
  return {
    id: "pi_1",
    amount: 65900,
    amount_capturable: 65900,
    amount_received: 0,
    currency: "sek",
    status: "requires_capture",
    capture_method: "manual",
    client_secret: "pi_1_secret_x",
    metadata: { kalla: STRIPE_KALLA, cartId: "korg-1" },
    latest_charge: { id: "ch_1", payment_method_details: { type: "klarna" } },
    ...over,
  };
}

interface Fejk {
  deps: StripeKassaDeps;
  anrop: string[];
  las: Map<string, StripeLas>;
  skapade: { p: AvsiktParametrar; idempotens: string }[];
  registrerat: { orderId: string; belopp: string; transaktion: string; namn: string }[];
}

/** Wix 4xx: ingen order skapades. */
class Avvisad extends Error {
  readonly status = 400;
}

function fejk(o: {
  korg?: Korg | null;
  rakningar?: Rakning[];
  avsikt?: Avsikt | null;
  las?: StripeLas;
  /** true och "4xx": Wix nekade (inget skapades). "okant": svaret kom aldrig (timeout). */
  laggOrderFel?: true | "4xx" | "okant";
  draFel?: boolean;
  /** Läget när betalningen läses om efter en misslyckad dragning. */
  efterDragFel?: "dragen" | "olasbar";
  registreraFel?: boolean;
  /** Betalningar som redan står på ordern (transaktions-id). */
  betalningar?: string[];
  slappFel?: boolean;
  aterbetalaFel?: boolean;
  markeraFel?: boolean;
  kupong?: "ok" | "ogiltig";
} = {}): Fejk {
  const anrop: string[] = [];
  const las = new Map<string, StripeLas>();
  if (o.las) las.set("pi_1", o.las);
  const skapade: Fejk["skapade"] = [];
  const registrerat: Fejk["registrerat"] = [];
  const rakningar = [...(o.rakningar ?? [rakning("659.00")])];
  let nuvarande: Avsikt | null = o.avsikt === undefined ? avsikt() : o.avsikt;
  let dragningenFoll = false;
  const deps: StripeKassaDeps = {
    async hamtaKorg(id) {
      anrop.push(`hamtaKorg:${id}`);
      return o.korg === undefined ? KORG : o.korg;
    },
    async uppdateraKorg(id) {
      anrop.push(`uppdateraKorg:${id}`);
    },
    async laggTillKupong(_id, kod) {
      anrop.push(`laggTillKupong:${kod}`);
      return o.kupong ?? "ok";
    },
    async taBortKupong(_id, kupongId) {
      anrop.push(`taBortKupong:${kupongId}`);
    },
    async rakna() {
      anrop.push("rakna");
      return rakningar.length > 1 ? rakningar.shift()! : rakningar[0];
    },
    async sattLeverans(_id, s) {
      anrop.push(`sattLeverans:${s.code}`);
    },
    async laggOrder(_id, bevis) {
      anrop.push(`laggOrder:${bevis}`);
      if (o.laggOrderFel === "okant") throw new Error("The operation was aborted due to timeout");
      if (o.laggOrderFel) throw new Avvisad("Wix nekade");
      return { orderId: "order-1" };
    },
    async registreraBetalning(orderId, b) {
      anrop.push(`registrera:${b.belopp}:${b.namn}`);
      if (o.registreraFel) throw new Error("Wix 500");
      registrerat.push({ orderId, ...b });
    },
    async orderBetalningar(orderId) {
      anrop.push(`orderBetalningar:${orderId}`);
      return [...(o.betalningar ?? []), ...registrerat.filter((r) => r.orderId === orderId).map((r) => r.transaktion)];
    },
    async avbrytOrder(orderId) {
      anrop.push(`avbrytOrder:${orderId}`);
    },
    async skapaAvsikt(p, idempotens) {
      anrop.push(`skapaAvsikt:${p.amount}`);
      skapade.push({ p, idempotens });
      nuvarande = avsikt({ id: "pi_ny", status: "requires_payment_method", amount: p.amount, client_secret: "pi_ny_secret", metadata: { ...p.metadata } });
      return nuvarande;
    },
    async uppdateraAvsikt(id, p) {
      anrop.push(`uppdateraAvsikt:${id}:${p.amount}`);
      nuvarande = { ...(nuvarande as Avsikt), amount: p.amount, metadata: { ...p.metadata } };
      return nuvarande;
    },
    async hamtaAvsikt(id) {
      anrop.push(`hamtaAvsikt:${id}`);
      if (dragningenFoll && o.efterDragFel === "olasbar") throw new Error("Stripe 500");
      if (dragningenFoll && o.efterDragFel === "dragen") {
        return { ...(nuvarande as Avsikt), status: "succeeded", amount_received: (nuvarande as Avsikt).amount_capturable, amount_capturable: 0 };
      }
      return nuvarande && nuvarande.id === id ? nuvarande : null;
    },
    async dra(id, ore) {
      anrop.push(`dra:${id}:${ore}`);
      if (o.draFel) {
        dragningenFoll = true;
        throw new Error("Stripe 402");
      }
      return { ...(nuvarande as Avsikt), status: "succeeded", amount_received: ore, amount_capturable: 0 };
    },
    async slappAvsikt(id) {
      anrop.push(`slapp:${id}`);
      if (o.slappFel) throw new Error("Stripe 500");
    },
    async aterbetala(id) {
      anrop.push(`aterbetala:${id}`);
      if (o.aterbetalaFel) throw new Error("Stripe 500");
    },
    async markeraAvsikt(id, orderId) {
      anrop.push(`markera:${id}:${orderId}`);
      if (o.markeraFel) throw new Error("Stripe 500");
    },
    async tagLas(id, l) {
      anrop.push(`tagLas:${id}`);
      const fanns = las.get(id);
      if (fanns) return fanns;
      las.set(id, l);
      return "tagen";
    },
    async sparaLas(id, l) {
      anrop.push(`sparaLas:${l.steg}`);
      las.set(id, l);
    },
  };
  return { deps, anrop, las, skapade, registrerat };
}

// ─── forberedStripe ─────────────────────────────────────────────────────────

test("forbered: en ny betalning på Wix total, manuell dragning och korgen i metadata", async () => {
  const f = fejk({ avsikt: null });
  const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND });
  assert.deepEqual(r, { ok: true, avsiktId: "pi_ny", clientSecret: "pi_ny_secret", totalOre: 65900, fakturering: faktureringAv(KUND) });
  const p = f.skapade[0].p;
  assert.equal(p.amount, 65900);
  assert.equal(p.currency, "sek");
  assert.equal(p.capture_method, "manual");
  assert.equal(p.metadata.kalla, STRIPE_KALLA);
  assert.equal(p.metadata.cartId, "korg-1");
  assert.deepEqual(Object.keys(p.metadata).sort(), ["cartId", "kalla"], "bara det flödet läser");
  assert.deepEqual(p.shipping.address, { line1: "Provgatan 1", postal_code: "11122", city: "Stockholm", country: "SE" });
  assert.ok(f.anrop.indexOf("uppdateraKorg:korg-1") < f.anrop.indexOf("skapaAvsikt:65900"), "korgen får uppgifterna före betalningen");
});

test("forbered: varje ny betalning får en egen idempotensnyckel, också med samma korg, kund och total", async () => {
  // Stripe svarar på en känd nyckel med det sparade svaret i ett dygn: en nyckel
  // ur korgens innehåll gav efter en släppt betalning tillbaka den släppta.
  const a = fejk({ avsikt: null });
  await forberedStripe(a.deps, { cartId: "korg-1", kund: KUND });
  const b = fejk({ avsikt: null });
  await forberedStripe(b.deps, { cartId: "korg-1", kund: KUND });
  assert.match(a.skapade[0].idempotens, /^fp-kassa-korg-1-[0-9a-f-]{36}$/);
  assert.notEqual(a.skapade[0].idempotens, b.skapade[0].idempotens);
});

test("forbered: en släppt betalning från samma korg ger en ny, den släppta används inte igen", async () => {
  const f = fejk({ avsikt: avsikt({ status: "canceled" }) });
  const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND, avsiktId: "pi_1" });
  assert.deepEqual(r, { ok: true, avsiktId: "pi_ny", clientSecret: "pi_ny_secret", totalOre: 65900, fakturering: faktureringAv(KUND) });
  assert.equal(f.skapade.length, 1);
  assert.ok(!f.anrop.some((x) => x.startsWith("uppdateraAvsikt")));
});

test("forbered: en obetald betalning från samma korg uppdateras i stället för att skapas", async () => {
  const f = fejk({ avsikt: avsikt({ status: "requires_payment_method", amount: 60000 }), rakningar: [rakning("659.00")] });
  const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND, avsiktId: "pi_1" });
  assert.equal(r.ok, true);
  assert.ok(f.anrop.includes("uppdateraAvsikt:pi_1:65900"));
  assert.equal(f.skapade.length, 0);
});

test("forbered: en redan reserverad betalning slutförs, den betalas inte igen", async () => {
  const f = fejk({ avsikt: avsikt({ status: "requires_capture" }) });
  const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND, avsiktId: "pi_1" });
  assert.deepEqual(r, { ok: true, avsiktId: "pi_1", redanBetald: true });
  assert.ok(!f.anrop.some((x) => x.startsWith("uppdateraKorg") || x.startsWith("skapaAvsikt")));
});

test("forbered: en betalning från en annan korg rörs inte", async () => {
  const f = fejk({ avsikt: avsikt({ status: "requires_payment_method", metadata: { kalla: STRIPE_KALLA, cartId: "annan" } }) });
  const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND, avsiktId: "pi_1" });
  assert.equal(r.ok, true);
  assert.ok(!f.anrop.some((x) => x.startsWith("uppdateraAvsikt")));
  assert.equal(f.skapade.length, 1);
});

test("forbered: saknad, beställd och tom korg stoppar innan något skrivs", async () => {
  const fall: [Korg | null, string][] = [
    [null, "korg_saknas"],
    [{ ...KORG, orderPlaced: true }, "korg_bestalld"],
    [{ ...KORG, lineItems: [] }, "korg_tom"],
  ];
  for (const [korg, kod] of fall) {
    const f = fejk({ korg, avsikt: null });
    const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.kod, kod);
    assert.equal(f.skapade.length, 0);
  }
});

test("forbered: ogiltig rabattkod, inget fraktsätt och slutsåld vara säger vad som är fel", async () => {
  const kupong = await forberedStripe(fejk({ avsikt: null, kupong: "ogiltig" }).deps, { cartId: "korg-1", kund: { ...KUND, kupong: "FEL" } });
  assert.equal(kupong.ok === false && kupong.falt, "kupong");
  const utan: Rakning = { ...rakning("659.00"), summary: { ...rakning("659.00").summary, deliverySummary: {} } };
  const leverans = await forberedStripe(fejk({ avsikt: null, rakningar: [utan] }).deps, { cartId: "korg-1", kund: KUND });
  assert.equal(leverans.ok === false && leverans.kod, "ingen_leverans");
  const slut = await forberedStripe(fejk({ avsikt: null, rakningar: [rakning("659.00", { overtradelse: true })] }).deps, { cartId: "korg-1", kund: KUND });
  assert.equal(slut.ok === false && slut.kod, "overtradelse");
});

test("forbered: fraktsättet sätts när korgen saknar det, och Wix räknar om", async () => {
  const f = fejk({ avsikt: null, rakningar: [rakning("659.00", { satt: false }), rakning("659.00")] });
  const r = await forberedStripe(f.deps, { cartId: "korg-1", kund: KUND });
  assert.equal(r.ok, true);
  assert.ok(f.anrop.includes(`sattLeverans:${SATT.code}`));
  assert.equal(f.anrop.filter((x) => x === "rakna").length, 2);
});

// ─── slutforStripe ──────────────────────────────────────────────────────────

test("slutför: ordern skapas före dragningen, och betalningen registreras efter", async () => {
  const f = fejk();
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.deepEqual(r, { ok: true, orderId: "order-1" });
  const i = (s: string) => f.anrop.findIndex((x) => x.startsWith(s));
  assert.ok(i("laggOrder") < i("dra:"), "ordern före pengarna");
  assert.ok(i("dra:") < i("registrera:"), "pengarna före registreringen");
  assert.ok(f.anrop.includes("laggOrder:bevis-659.00"), "Wix prisbevis följer med");
  assert.ok(f.anrop.includes("dra:pi_1:65900"));
  assert.deepEqual(f.registrerat, [{ orderId: "order-1", belopp: "659.00", transaktion: "ch_1", namn: "Klarna", tid: NU.toISOString() }]);
  assert.equal(f.las.get("pi_1")?.steg, "klar");
  assert.ok(f.anrop.includes("markera:pi_1:order-1"));
  assert.ok(!f.anrop.some((x) => x.startsWith("orderBetalningar") || x.startsWith("hamtaKorg")), "första försöket läser varken ordern eller korgen");
});

test("slutför: en betalning som redan blev en order svarar med ordern utan att röra något", async () => {
  const f = fejk({ avsikt: avsikt({ status: "succeeded", metadata: { kalla: STRIPE_KALLA, cartId: "korg-1", wixOrderId: "order-9" } }) });
  assert.deepEqual(await slutforStripe(f.deps, "pi_1", NU), { ok: true, orderId: "order-9" });
  assert.deepEqual(f.anrop, ["hamtaAvsikt:pi_1"]);
});

test("slutför: när någon annan just håller låset svarar vi pagar och skapar ingen order", async () => {
  const f = fejk({ las: { cartId: "korg-1", steg: "pagar", at: NU.getTime() - 5_000 } });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "pagar");
  assert.ok(!f.anrop.some((x) => x.startsWith("laggOrder") || x.startsWith("rakna")));
});

test("slutför: ett klart lås svarar med ordern", async () => {
  const f = fejk({ las: { cartId: "korg-1", steg: "klar", orderId: "order-7", at: NU.getTime() } });
  assert.deepEqual(await slutforStripe(f.deps, "pi_1", NU), { ok: true, orderId: "order-7" });
});

test("slutför: ett övergivet lås efter ordern fortsätter med dragningen, utan en order till", async () => {
  const f = fejk({ las: { cartId: "korg-1", steg: "order", orderId: "order-5", at: NU.getTime() - STRIPE_LAS_MS - 1 } });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.deepEqual(r, { ok: true, orderId: "order-5" });
  assert.ok(!f.anrop.some((x) => x.startsWith("laggOrder")));
  assert.ok(f.anrop.includes("dra:pi_1:65900"));
  assert.equal(f.registrerat[0].orderId, "order-5");
});

test("slutför: ett övergivet lås efter dragningen registrerar bara betalningen", async () => {
  const f = fejk({
    avsikt: avsikt({ status: "succeeded", amount_capturable: 0, amount_received: 65900 }),
    las: { cartId: "korg-1", steg: "registrera", orderId: "order-5", at: NU.getTime() - STRIPE_LAS_MS - 1 },
  });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.deepEqual(r, { ok: true, orderId: "order-5" });
  assert.ok(!f.anrop.some((x) => x.startsWith("laggOrder") || x.startsWith("dra:")));
  assert.ok(f.anrop.includes("orderBetalningar:order-5"), "omtaget läser ordern före Add Payments");
  assert.equal(f.registrerat[0].belopp, "659.00");
});

test("slutför: ett omtag där betalningen redan står på ordern registrerar den inte igen, och låset blir klart", async () => {
  // Förra försöket hann registrera men inte spara låset; Add Payments hade nekat dubbletten.
  const f = fejk({
    avsikt: avsikt({ status: "succeeded", amount_capturable: 0, amount_received: 65900 }),
    las: { cartId: "korg-1", steg: "registrera", orderId: "order-5", at: NU.getTime() - STRIPE_LAS_MS - 1 },
    betalningar: ["ch_1"],
  });
  assert.deepEqual(await slutforStripe(f.deps, "pi_1", NU), { ok: true, orderId: "order-5" });
  assert.ok(!f.anrop.some((x) => x.startsWith("registrera:")));
  assert.equal(f.las.get("pi_1")?.steg, "klar");
  assert.ok(f.anrop.includes("markera:pi_1:order-5"));
});

test("slutför: ändrat pris släpper reservationen och skapar ingen order", async () => {
  const f = fejk({ rakningar: [rakning("699.00")] });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "pris_andrat");
  assert.ok(f.anrop.includes("slapp:pi_1"));
  assert.ok(!f.anrop.some((x) => x.startsWith("laggOrder") || x.startsWith("dra:")));
  assert.equal(f.las.get("pi_1")?.steg, "fel");
});

test("slutför: en vara som tagit slut släpper reservationen", async () => {
  const f = fejk({ rakningar: [rakning("659.00", { overtradelse: true })] });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "slut");
  assert.ok(f.anrop.includes("slapp:pi_1"));
  assert.ok(!f.anrop.some((x) => x.startsWith("laggOrder")));
});

test("slutför: nekar Wix ordern (4xx) släpps reservationen och inget dras", async () => {
  const f = fejk({ laggOrderFel: "4xx" });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "fel");
  assert.ok(f.anrop.includes("slapp:pi_1"));
  assert.ok(!f.anrop.some((x) => x.startsWith("dra:")));
  assert.ok(!f.anrop.includes("hamtaKorg:korg-1"), "ett 4xx är ett besked: korgen läses inte");
});

test("slutför: Place Order svarade aldrig men ordern finns på korgen — den används, ingen order till", async () => {
  const f = fejk({ laggOrderFel: "okant", korg: { ...KORG, orderPlaced: true, orderId: "order-k" } });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.deepEqual(r, { ok: true, orderId: "order-k" });
  assert.equal(f.anrop.filter((x) => x.startsWith("laggOrder")).length, 1);
  assert.ok(f.anrop.includes("dra:pi_1:65900"));
  assert.equal(f.registrerat[0].orderId, "order-k");
  assert.ok(!f.anrop.includes("slapp:pi_1"));
});

test("slutför: Place Order svarade aldrig och korgen har ingen order — reservationen släpps", async () => {
  const f = fejk({ laggOrderFel: "okant" });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "fel");
  assert.ok(f.anrop.includes("hamtaKorg:korg-1"));
  assert.ok(f.anrop.includes("slapp:pi_1"));
  assert.ok(!f.anrop.some((x) => x.startsWith("dra:")));
});

test("slutför: korgen blev beställd och betald i Wix kassa — vår reservation släpps och ordern rörs inte", async () => {
  const f = fejk({ laggOrderFel: "okant", korg: { ...KORG, orderPlaced: true, orderId: "order-w" }, betalningar: ["wix-betalning"] });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "fel");
  assert.match(r.ok === false ? r.meddelanden[0] : "", /redan beställd och betald/);
  assert.ok(f.anrop.includes("slapp:pi_1"));
  assert.ok(!f.anrop.some((x) => x.startsWith("dra:") || x.startsWith("registrera:") || x.startsWith("avbrytOrder")));
});

test("slutför: ett övergivet lås före ordern tar ordern ur korgen i stället för att lägga en till", async () => {
  // Förra försöket dog mellan Place Order och låset.
  const f = fejk({
    las: { cartId: "korg-1", steg: "pagar", at: NU.getTime() - STRIPE_LAS_MS - 1 },
    korg: { ...KORG, orderPlaced: true, orderId: "order-k" },
  });
  assert.deepEqual(await slutforStripe(f.deps, "pi_1", NU), { ok: true, orderId: "order-k" });
  assert.ok(!f.anrop.some((x) => x.startsWith("laggOrder") || x === "rakna"));
  assert.ok(f.anrop.includes("dra:pi_1:65900"));
  assert.equal(f.las.get("pi_1")?.steg, "klar");
});

test("slutför: ett övergivet lås före ordern utan order på korgen kör hela vägen", async () => {
  const f = fejk({ las: { cartId: "korg-1", steg: "pagar", at: NU.getTime() - STRIPE_LAS_MS - 1 } });
  assert.deepEqual(await slutforStripe(f.deps, "pi_1", NU), { ok: true, orderId: "order-1" });
  assert.ok(f.anrop.includes("hamtaKorg:korg-1"));
  assert.ok(f.anrop.includes("laggOrder:bevis-659.00"));
});

test("slutför: misslyckad dragning avbryter ordern med återlagring och släpper reservationen", async () => {
  const f = fejk({ draFel: true });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.kod, "fel");
  assert.ok(f.anrop.includes("avbrytOrder:order-1"));
  assert.ok(f.anrop.includes("slapp:pi_1"));
  assert.equal(f.registrerat.length, 0);
  assert.equal(f.anrop.filter((x) => x === "hamtaAvsikt:pi_1").length, 2, "läget läses om innan ordern avbryts");
});

test("slutför: dragningen felade men pengarna drogs ändå — ordern behålls och betalningen registreras", async () => {
  const f = fejk({ draFel: true, efterDragFel: "dragen" });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.deepEqual(r, { ok: true, orderId: "order-1" });
  assert.ok(!f.anrop.some((x) => x.startsWith("avbrytOrder") || x.startsWith("slapp")));
  assert.deepEqual(f.registrerat.map((x) => [x.orderId, x.belopp, x.transaktion]), [["order-1", "659.00", "ch_1"]]);
  assert.equal(f.las.get("pi_1")?.steg, "klar");
});

test("slutför: dragningen felade och läget går inte att läsa — inget avbryts eller släpps, nästa försök avgör", async () => {
  const f = fejk({ draFel: true, efterDragFel: "olasbar" });
  await assert.rejects(slutforStripe(f.deps, "pi_1", NU));
  assert.ok(!f.anrop.some((x) => x.startsWith("avbrytOrder") || x.startsWith("slapp") || x.startsWith("aterbetala")));
  assert.equal(f.las.get("pi_1")?.steg, "order", "låset står kvar på ordern");
});

test("slutför: misslyckad registrering svarar ok till kunden men ofullständig, och låset väntar på omtag", async () => {
  const f = fejk({ registreraFel: true });
  const r = await slutforStripe(f.deps, "pi_1", NU);
  assert.deepEqual(r, { ok: true, orderId: "order-1", ofullstandig: true });
  assert.equal(f.las.get("pi_1")?.steg, "registrera");
  assert.ok(!f.anrop.some((x) => x.startsWith("markera")));
});

test("slutför: ett klart lås märker betalningen med ordern om markeringen föll förra gången", async () => {
  const f = fejk({ las: { cartId: "korg-1", steg: "klar", orderId: "order-7", at: NU.getTime() } });
  assert.deepEqual(await slutforStripe(f.deps, "pi_1", NU), { ok: true, orderId: "order-7" });
  assert.ok(f.anrop.includes("markera:pi_1:order-7"));
  const fel = fejk({ las: { cartId: "korg-1", steg: "klar", orderId: "order-7", at: NU.getTime() }, markeraFel: true });
  assert.deepEqual(await slutforStripe(fel.deps, "pi_1", NU), { ok: true, orderId: "order-7" }, "en fallerad markering ändrar inte svaret");
});

test("slutför: ett fel-lås släpper reservationen igen, och en dragen betalning utan order betalas tillbaka", async () => {
  const lasFel: StripeLas = { cartId: "korg-1", steg: "fel", at: NU.getTime() };
  const reserverad = fejk({ las: lasFel });
  const r1 = await slutforStripe(reserverad.deps, "pi_1", NU);
  assert.deepEqual(r1.ok === false && [r1.kod, r1.ostadad], ["fel", undefined]);
  assert.ok(reserverad.anrop.includes("slapp:pi_1"));
  const dragen = fejk({ las: lasFel, avsikt: avsikt({ status: "succeeded", amount_capturable: 0, amount_received: 65900 }) });
  await slutforStripe(dragen.deps, "pi_1", NU);
  assert.ok(dragen.anrop.includes("aterbetala:pi_1"));
  assert.ok(!dragen.anrop.some((x) => x.startsWith("slapp") || x.startsWith("laggOrder") || x.startsWith("dra:")));
});

test("slutför: går reservationen inte att släppa blir utfallet ostädat, så att webhooken och nätet tar om det", async () => {
  const pris = await slutforStripe(fejk({ rakningar: [rakning("699.00")], slappFel: true }).deps, "pi_1", NU);
  assert.deepEqual(pris.ok === false && [pris.kod, pris.ostadad], ["pris_andrat", true]);
  const las = await slutforStripe(fejk({ las: { cartId: "korg-1", steg: "fel", at: NU.getTime() }, slappFel: true }).deps, "pi_1", NU);
  assert.deepEqual(las.ok === false && [las.kod, las.ostadad], ["fel", true]);
  const ater = fejk({ las: { cartId: "korg-1", steg: "fel", at: NU.getTime() }, avsikt: avsikt({ status: "succeeded" }), aterbetalaFel: true });
  const r = await slutforStripe(ater.deps, "pi_1", NU);
  assert.equal(r.ok === false && r.ostadad, true);
});

test("slutför: en redan dragen betalning (utan manuell dragning) dras inte igen, och betalas tillbaka om ordern inte går", async () => {
  const dragen = avsikt({ status: "succeeded", capture_method: "automatic", amount_capturable: 0, amount_received: 65900 });
  const ok = fejk({ avsikt: dragen });
  assert.deepEqual(await slutforStripe(ok.deps, "pi_1", NU), { ok: true, orderId: "order-1" });
  assert.ok(!ok.anrop.some((x) => x.startsWith("dra:")));
  const fel = fejk({ avsikt: dragen, laggOrderFel: true });
  await slutforStripe(fel.deps, "pi_1", NU);
  assert.ok(fel.anrop.includes("aterbetala:pi_1"));
  assert.ok(!fel.anrop.includes("slapp:pi_1"));
});

test("slutför: främmande, obetalda och pågående betalningar", async () => {
  const framling = fejk({ avsikt: avsikt({ metadata: { kalla: "annan", cartId: "korg-1" } }) });
  assert.equal((await slutforStripe(framling.deps, "pi_1", NU)).ok === false, true);
  const obetald = await slutforStripe(fejk({ avsikt: avsikt({ status: "requires_payment_method" }) }).deps, "pi_1", NU);
  assert.equal(obetald.ok === false && obetald.kod, "ej_betald");
  const pagar = await slutforStripe(fejk({ avsikt: avsikt({ status: "processing" }) }).deps, "pi_1", NU);
  assert.equal(pagar.ok === false && pagar.kod, "behandlas");
  const saknas = await slutforStripe(fejk({ avsikt: null }).deps, "pi_1", NU);
  assert.equal(saknas.ok === false && saknas.kod, "okand");
});

test("kronorAv skriver belopp som Wix", () => {
  assert.equal(kronorAv(65900), "659.00");
  assert.equal(kronorAv(1), "0.01");
  assert.equal(kronorAv(119905), "1199.05");
});

test("avsiktParametrar: c/o på andra raden och postnumret utan mellanslag", () => {
  const p = avsiktParametrar("korg-1", { ...KUND, co: "c/o Svensson" }, 100, KORG.lineItems ?? []);
  assert.equal(p.shipping.address.line2, "c/o Svensson");
  assert.equal(p.shipping.address.postal_code, "11122");
  assert.equal(p.description, "Pedalhink 20 l.");
});

// ─── webhooken och nätet ────────────────────────────────────────────────────

test("arKlart och webhookStatus: bara det som inte har något kvar att göra svarar 200", () => {
  const fall: [SlutforUtfall, boolean, number, string][] = [
    [{ ok: true, orderId: "o" }, true, 200, "ok"],
    [{ ok: true, orderId: "o", ofullstandig: true }, false, 500, "ofullstandig"],
    [{ ok: false, kod: "pagar", meddelanden: [] }, false, 503, "pagar"],
    [{ ok: false, kod: "behandlas", meddelanden: [] }, false, 503, "behandlas"],
    [{ ok: false, kod: "fel", meddelanden: [] }, true, 200, "fel"],
    [{ ok: false, kod: "fel", meddelanden: [], ostadad: true }, false, 500, "fel-ostadad"],
    [{ ok: false, kod: "pris_andrat", meddelanden: [], ostadad: true }, false, 500, "pris_andrat-ostadad"],
    [{ ok: false, kod: "slut", meddelanden: [] }, true, 200, "slut"],
    [{ ok: false, kod: "okand", meddelanden: [] }, true, 200, "okand"],
    [{ ok: false, kod: "ej_betald", meddelanden: [] }, true, 200, "ej_betald"],
  ];
  for (const [u, klart, status, lage] of fall) {
    assert.equal(arKlart(u), klart, JSON.stringify(u));
    assert.equal(webhookStatus(u), status, JSON.stringify(u));
    assert.equal(utfallLage(u), lage);
  }
});

type Listrad = Pick<Avsikt, "id" | "status" | "metadata" | "created">;

test("attSlutfora: kassans godkända betalningar utan order, äldre än fem minuter, äldst först", () => {
  const NU_SEK = 1_800_000_000;
  const rad = (id: string, alder: number, over: Partial<Listrad> = {}): Listrad => ({
    id,
    status: "requires_capture",
    metadata: { kalla: STRIPE_KALLA, cartId: "k" },
    created: NU_SEK - alder,
    ...over,
  });
  const { ids } = attSlutfora(
    [
      rad("pi_ny", NAT_EFTER_SEK - 1),
      rad("pi_fem", NAT_EFTER_SEK),
      rad("pi_tim", 3600),
      rad("pi_dragen", 600, { status: "succeeded" }),
      rad("pi_klar", 600, { metadata: { kalla: STRIPE_KALLA, cartId: "k", wixOrderId: "o" } }),
      rad("pi_annan", 600, { metadata: { kalla: "annan" } }),
      rad("pi_utan", 600, { metadata: {} }),
      rad("pi_obetald", 600, { status: "requires_payment_method" }),
      rad("pi_slappt", 600, { status: "canceled" }),
      rad("pi_behandlas", 600, { status: "processing" }),
    ],
    NU_SEK,
  );
  assert.deepEqual(ids, ["pi_tim", "pi_dragen", "pi_fem"]);
});

test("attSlutfora: larmet gäller betalningar som passerat 30 minuter inom det senaste kvarteret, en gång", () => {
  const NU_SEK = 1_800_000_000;
  const rad = (id: string, alder: number): Listrad => ({ id, status: "requires_capture", metadata: { kalla: STRIPE_KALLA, cartId: "k" }, created: NU_SEK - alder });
  const { larm } = attSlutfora(
    [rad("pi_29", NAT_LARM_SEK - 60), rad("pi_30", NAT_LARM_SEK), rad("pi_44", NAT_LARM_SEK + 14 * 60 + 59), rad("pi_45", NAT_LARM_SEK + 15 * 60)],
    NU_SEK,
  );
  assert.deepEqual(larm, ["pi_44", "pi_30"]);
  // Var femtonde minut: varje betalning hamnar i fönstret i exakt en körning.
  for (const alder of [NAT_EFTER_SEK, 1000, NAT_LARM_SEK - 1, NAT_LARM_SEK + 7 * 60]) {
    let ganger = 0;
    for (let k = 0; k < 12; k++) ganger += attSlutfora([rad("pi_x", alder + k * 15 * 60)], NU_SEK).larm.length;
    assert.equal(ganger, 1, `ålder ${alder}`);
  }
});
