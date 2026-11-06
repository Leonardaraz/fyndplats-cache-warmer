// lib/kassa/flode.test.ts — vår egen kassas flöde (lib/kassa/flode.ts) mot ett
// låtsas-Wix som minns varje anrop.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  betala,
  betalBeskrivning,
  oreAv,
  stoppandeOvertradelser,
  BETALNING_MINUTER,
  KASSA_MARKOR,
  MAX_FORSOK_PER_TIMME,
  arKorgensBetalning,
  kassaExterntId,
  type KassaDeps,
  type Korg,
  type Kund,
  type Rakning,
} from "./flode.ts";

const NU = new Date("2026-11-06T10:00:00.000Z");
const SATT = { code: "ddaca2f4", appId: "45c44b27", title: { original: "Spårbar standardleverans" } };

const kund: Kund = {
  epost: "anna@exempel.se",
  fornamn: "Anna",
  efternamn: "Andersson",
  telefon: "+46701234567",
  gata: "Storgatan 1",
  co: "",
  postnr: "152 44",
  ort: "Södertälje",
  kupong: "",
};

function korg(over: Partial<Korg> = {}): Korg {
  return {
    id: "korg-1",
    lineItems: [{ id: "r1", name: { original: "Pedalhink 50 liter" }, quantityInfo: { confirmedQuantity: 1, requestedQuantity: 1 }, status: "IN_STOCK" }],
    coupons: [],
    orderPlaced: false,
    ...over,
  };
}

function rakning(over: { satt?: typeof SATT | null; total?: string; violations?: Rakning["summary"] extends infer S ? S extends { violations?: infer V } ? V : never : never; spi?: unknown[]; valt?: string; rader?: Korg["lineItems"] } = {}): Rakning {
  const satt = over.satt === undefined ? SATT : over.satt;
  return {
    cart: { ...korg({ lineItems: over.rader }), deliveryInfo: over.valt ? { method: { code: over.valt } } : {} },
    summary: {
      deliverySummary: satt ? { method: satt, price: { amount: "0.00" } } : {},
      priceSummary: { total: { amount: over.total ?? "1159.00" } },
      violations: over.violations ?? [],
      spiViolations: (over.spi ?? []) as never,
    },
  };
}

function lattsasWix(o: {
  korg?: Korg | null;
  rakningar?: Rakning[];
  kupong?: "ok" | "ogiltig";
  tidigare?: "slappt" | "ej_var" | "betald";
  forsok?: { id: string; orderId: string; status: string }[];
} = {}) {
  const logg: string[] = [];
  const rakningar = o.rakningar ?? [rakning(), rakning({ valt: SATT.code })];
  let i = 0;
  const deps: KassaDeps = {
    async hamtaKorg(id) { logg.push(`hamta ${id}`); return o.korg === undefined ? korg() : o.korg; },
    async uppdateraKorg(id, k) { logg.push(`uppdatera ${id} ${k.postnr}`); },
    async laggTillKupong(id, kod) { logg.push(`kupong+ ${kod}`); return o.kupong ?? "ok"; },
    async taBortKupong(id, kupongId) { logg.push(`kupong- ${kupongId}`); },
    async rakna() { logg.push("rakna"); return rakningar[Math.min(i++, rakningar.length - 1)]; },
    async sattLeverans(id, s) { logg.push(`leverans ${s.code}/${s.appId}`); },
    async skapaOrder(id) { logg.push(`order ${id}`); return { orderId: "order-1" }; },
    async skapaBetalning(b) { logg.push(`betalning ${b.orderId} ${b.belopp} ${b.utgar} ${b.externtId}`); return { id: "bet-1", url: "https://checkout.fyndplats.se/__ecom/payment-request-page/bet-1" }; },
    async slappTidigare(id, t) { logg.push(`slapp ${t.orderId}/${t.betalningId}`); return o.tidigare ?? "slappt"; },
    async korgensForsok(id, sedan) { logg.push(`forsok ${id} ${sedan.toISOString()}`); return o.forsok ?? []; },
  };
  return { deps, logg };
}

const inn = (over: Partial<Parameters<typeof betala>[1]> = {}) => ({ cartId: "korg-1", kund, forsokId: "1", ...over });
const TIMME_SEDAN = new Date(NU.getTime() - 3_600_000).toISOString();

test("hela vägen: adress, leveranssätt, räkning, order och betalning i den ordningen", async () => {
  const { deps, logg } = lattsasWix();
  const r = await betala(deps, inn(), NU);
  assert.deepEqual(r, { ok: true, url: "https://checkout.fyndplats.se/__ecom/payment-request-page/bet-1", orderId: "order-1", betalningId: "bet-1", totalOre: 115900 });
  const utgar = new Date(NU.getTime() + BETALNING_MINUTER * 60_000).toISOString();
  assert.deepEqual(logg, [
    "hamta korg-1",
    `forsok korg-1 ${TIMME_SEDAN}`,
    "uppdatera korg-1 152 44",
    "rakna",
    `leverans ${SATT.code}/${SATT.appId}`,
    "rakna",
    "order korg-1",
    `betalning order-1 1159.00 ${utgar} ${KASSA_MARKOR}:korg-1:1`,
  ]);
});

test("ett redan valt leveranssätt sätts inte igen och korgen räknas en gång", async () => {
  const { deps, logg } = lattsasWix({ rakningar: [rakning({ valt: SATT.code })] });
  const r = await betala(deps, inn(), NU);
  assert.equal(r.ok, true);
  assert.equal(logg.filter((l) => l === "rakna").length, 1);
  assert.equal(logg.some((l) => l.startsWith("leverans")), false);
});

test("beloppet kommer från Wix räkning, aldrig från kunden", async () => {
  const { deps, logg } = lattsasWix({ rakningar: [rakning({ valt: SATT.code, total: "1101.05" })] });
  const r = await betala(deps, inn(), NU);
  assert.equal(r.ok && r.totalOre, 110105);
  assert.ok(logg.some((l) => l.startsWith("betalning order-1 1101.05 ")));
});

test("en saknad, beställd eller tom korg skapar ingen order", async () => {
  for (const [k, kod] of [[null, "korg_saknas"], [korg({ orderPlaced: true }), "korg_bestalld"], [korg({ lineItems: [] }), "korg_tom"]] as const) {
    const { deps, logg } = lattsasWix({ korg: k });
    const r = await betala(deps, inn(), NU);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.kod, kod);
    assert.equal(logg.some((l) => l.startsWith("order")), false, kod);
  }
});

test("en överträdelse stoppar köpet före ordern, med svensk text och fältet", async () => {
  const { deps, logg } = lattsasWix({
    rakningar: [rakning({ valt: SATT.code, violations: [{ code: "INVALID_COUPON_STATUS", severity: "ERROR" }, { code: "GENERAL_CODE", severity: "WARNING" }] })],
  });
  const r = await betala(deps, inn(), NU);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.kod, "overtradelse");
  assert.equal(r.falt, "kupong");
  assert.deepEqual(r.meddelanden, ["Rabattkoden gäller inte längre, eller inte för de här varorna."]);
  assert.equal(logg.some((l) => l.startsWith("order")), false);
});

test("motorns egen regel (postnummerspärren) stoppar med sin egen text", async () => {
  const text = "Den här varan kan inte levereras till postnummer 621 00.";
  const { deps } = lattsasWix({ rakningar: [rakning({ valt: SATT.code, spi: [{ severity: "ERROR", description: text }] })] });
  const r = await betala(deps, inn(), NU);
  assert.equal(!r.ok && r.kod, "overtradelse");
  assert.deepEqual(!r.ok && r.meddelanden, [text]);
  assert.equal(!r.ok && r.falt, "postnr");
});

test("en vara som tagit slut nämns vid namn", () => {
  const r = stoppandeOvertradelser(rakning({ rader: [
    { name: { original: "Skohylla" }, status: "OUT_OF_STOCK" },
    { name: { original: "Pedalhink" }, status: "PARTIALLY_IN_STOCK", quantityInfo: { availableQuantity: 2 } },
    { name: { original: "Bokhylla" }, status: "IN_STOCK" },
  ] }));
  assert.deepEqual(r.meddelanden, ["Skohylla finns inte i lager längre. Ta bort den ur varukorgen.", "Pedalhink: bara 2 kvar i lager. Minska antalet."]);
});

test("utan leveranssätt för adressen blir det ingen order", async () => {
  const { deps, logg } = lattsasWix({ rakningar: [rakning({ satt: null })] });
  const r = await betala(deps, inn(), NU);
  assert.equal(!r.ok && r.kod, "ingen_leverans");
  assert.equal(!r.ok && r.falt, "postnr");
  assert.equal(logg.some((l) => l.startsWith("order")), false);
});

test("en total som inte går att läsa eller är noll skapar ingen order", async () => {
  for (const total of ["", "0.00", "abc"]) {
    const { deps, logg } = lattsasWix({ rakningar: [rakning({ valt: SATT.code, total })] });
    const r = await betala(deps, inn(), NU);
    assert.equal(!r.ok && r.kod, "total", total);
    assert.equal(logg.some((l) => l.startsWith("order")), false);
  }
});

test("rabattkoden: ny läggs till, gammal tas bort på sitt id, samma rörs inte", async () => {
  {
    const { deps, logg } = lattsasWix({ korg: korg({ coupons: [{ id: "kup-1", code: "GAMMAL" }] }) });
    await betala(deps, inn({ kund: { ...kund, kupong: "NY5" } }), NU);
    assert.deepEqual(logg.filter((l) => l.startsWith("kupong")), ["kupong- kup-1", "kupong+ NY5"]);
  }
  {
    const { deps, logg } = lattsasWix({ korg: korg({ coupons: [{ id: "kup-1", code: "SPARA5" }] }) });
    await betala(deps, inn({ kund: { ...kund, kupong: "spara5" } }), NU);
    assert.deepEqual(logg.filter((l) => l.startsWith("kupong")), []);
  }
  {
    const { deps, logg } = lattsasWix({ korg: korg({ coupons: [{ id: "kup-1", code: "SPARA5" }] }) });
    await betala(deps, inn(), NU);
    assert.deepEqual(logg.filter((l) => l.startsWith("kupong")), ["kupong- kup-1"]);
  }
});

test("en ogiltig rabattkod stoppar innan något räknas", async () => {
  const { deps, logg } = lattsasWix({ kupong: "ogiltig" });
  const r = await betala(deps, inn({ kund: { ...kund, kupong: "FEL" } }), NU);
  assert.equal(!r.ok && r.kod, "kupong");
  assert.equal(!r.ok && r.falt, "kupong");
  assert.equal(logg.includes("rakna"), false);
});

test("en förra betalning från korgen släpps först; en betald stoppar allt", async () => {
  {
    const { deps, logg } = lattsasWix();
    await betala(deps, inn({ tidigare: { orderId: "gammal", betalningId: "b0" } }), NU);
    assert.equal(logg[2], "slapp gammal/b0");
    assert.ok(logg.some((l) => l.startsWith("order")));
  }
  {
    const { deps, logg } = lattsasWix({ tidigare: "betald" });
    const r = await betala(deps, inn({ tidigare: { orderId: "gammal", betalningId: "b0" } }), NU);
    assert.equal(!r.ok && r.kod, "redan_betald");
    assert.equal(logg.some((l) => l.startsWith("uppdatera") || l.startsWith("order")), false);
  }
});

test("öre ur Wix belopp", () => {
  assert.equal(oreAv({ amount: "1159.00" }), 115900);
  assert.equal(oreAv({ amount: "1159" }), 115900);
  assert.equal(oreAv({ amount: "94.9" }), 9490);
  assert.equal(oreAv({ amount: "0.05" }), 5);
  assert.equal(oreAv({ amount: "-19.00" }), -1900);
  assert.equal(oreAv({ amount: "1 159,00" }), null);
  assert.equal(oreAv({}), null);
  assert.equal(oreAv(undefined), null);
});

test("betalsidans text: första varan, antalet resten, högst 300 tecken", () => {
  assert.equal(betalBeskrivning([]), "Din beställning hos Fyndplats.");
  assert.equal(betalBeskrivning([{ name: { original: "Pedalhink" }, quantityInfo: { confirmedQuantity: 1 } }]), "Pedalhink.");
  assert.equal(
    betalBeskrivning([
      { name: { original: "Pedalhink" }, quantityInfo: { confirmedQuantity: 2 } },
      { name: { original: "Skohylla" } },
      { name: { original: "Bokhylla" } },
    ]),
    "2 × Pedalhink och 2 varor till.",
  );
  assert.equal(betalBeskrivning([{ name: { original: "A" } }, { name: { original: "B" } }]), "A och 1 vara till.");
  const lang = betalBeskrivning([{ name: { original: "x".repeat(400) } }]);
  assert.ok(lang.length <= 300);
  assert.ok(lang.endsWith("…."));
});

test("städningen släpper bara våra utgångna, med marginal, och aldrig betalda", async () => {
  const { attSlappa, STADNING_MARGINAL_MINUTER } = await import("./flode.ts");
  const nu = new Date("2026-11-06T12:00:00.000Z");
  const fore = (min: number) => new Date(nu.getTime() - min * 60_000).toISOString();
  const vår = { source: { externalId: `${KASSA_MARKOR}:korg:1` } };
  const r = attSlappa(
    [
      { id: "a", orderId: "oa", status: "EXPIRED", expirationDate: fore(STADNING_MARGINAL_MINUTER + 1), ...vår },
      { id: "b", orderId: "ob", status: "UNPAID", expirationDate: fore(STADNING_MARGINAL_MINUTER + 1), ...vår },
      { id: "c", orderId: "oc", status: "UNPAID", expirationDate: fore(STADNING_MARGINAL_MINUTER - 1), ...vår },
      { id: "d", orderId: "od", status: "PAID", expirationDate: fore(500), ...vår },
      { id: "e", orderId: "oe", status: "VOIDED", expirationDate: fore(500), ...vår },
      { id: "f", orderId: "of", status: "EXPIRED", expirationDate: fore(500), source: { externalId: "faktura-123" } },
      { id: "g", orderId: "og", status: "EXPIRED", ...vår },
      { orderId: "oh", status: "EXPIRED", expirationDate: fore(500), ...vår },
    ],
    nu,
  );
  assert.deepEqual(r, [{ betalningId: "a", orderId: "oa" }, { betalningId: "b", orderId: "ob" }]);
});

test("servern släpper själv korgens obetalda försök, också när webbläsaren glömt dem", async () => {
  const { deps, logg } = lattsasWix({
    forsok: [
      { id: "b2", orderId: "o2", status: "UNPAID" },
      { id: "b1", orderId: "o1", status: "VOIDED" },
      { id: "b0", orderId: "o0", status: "UNPAID" },
    ],
  });
  // Webbläsaren minns b0, som servern också hittade: den släpps en gång.
  const r = await betala(deps, inn({ tidigare: { orderId: "o0", betalningId: "b0" } }), NU);
  assert.equal(r.ok, true);
  assert.deepEqual(logg.filter((l) => l.startsWith("slapp")), ["slapp o2/b2", "slapp o0/b0"]);
  const forstaOrder = logg.findIndex((l) => l.startsWith("order"));
  assert.ok(logg.findLastIndex((l) => l.startsWith("slapp")) < forstaOrder, "släpps före den nya ordern");
});

test("en betald betalning från samma korg stoppar ett dubbelköp", async () => {
  const { deps, logg } = lattsasWix({ forsok: [{ id: "b1", orderId: "o1", status: "PAID" }, { id: "b0", orderId: "o0", status: "UNPAID" }] });
  const r = await betala(deps, inn(), NU);
  assert.equal(!r.ok && r.kod, "redan_betald");
  assert.equal(logg.some((l) => l.startsWith("slapp") || l.startsWith("uppdatera") || l.startsWith("order")), false);
});

test("för många försök från samma korg på en timme stoppas innan något släpps eller skapas", async () => {
  const forsok = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `b${i}`, orderId: `o${i}`, status: i === 0 ? "UNPAID" : "VOIDED" }));
  {
    const { deps, logg } = lattsasWix({ forsok: forsok(MAX_FORSOK_PER_TIMME) });
    const r = await betala(deps, inn(), NU);
    assert.equal(!r.ok && r.kod, "for_manga");
    assert.equal(logg.some((l) => l.startsWith("slapp") || l.startsWith("uppdatera") || l.startsWith("order")), false);
  }
  {
    const { deps } = lattsasWix({ forsok: forsok(MAX_FORSOK_PER_TIMME - 1) });
    assert.equal((await betala(deps, inn(), NU)).ok, true);
  }
});

test("betalningens externa id bär korgen, och korgen känner bara igen sina egna", () => {
  const korgId = "1b0a3f2e-9c4d-4e5f-8a7b-6c5d4e3f2a1b";
  const id = kassaExterntId(korgId, "m3x9k2");
  assert.equal(id, `${KASSA_MARKOR}:${korgId}:m3x9k2`);
  assert.ok(id.length <= 100);
  assert.equal(arKorgensBetalning(id, korgId), true);
  assert.equal(arKorgensBetalning(kassaExterntId("korg-10", "1"), "korg-1"), false);
  assert.equal(arKorgensBetalning("faktura-123", korgId), false);
  assert.equal(arKorgensBetalning(undefined, korgId), false);
});
