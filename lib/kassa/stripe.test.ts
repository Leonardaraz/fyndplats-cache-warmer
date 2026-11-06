// lib/kassa/stripe.test.ts — Stripe-hjälparna för vår kassa (lib/kassa/stripe.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { kodaParams, lasSignatur, provaWebhook } from "./stripe.ts";
import { betalsattsnamn, laddningsId } from "./flode.ts";

test("kodaParams kodar nästlade objekt och listor som Stripe vill ha dem", () => {
  const s = kodaParams({
    amount: 65900,
    currency: "sek",
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    metadata: { cartId: "abc", avtryck: "x y" },
    payment_method_types: ["card", "klarna"],
    hoppa: undefined,
    ocksa: null,
  });
  assert.equal(
    s,
    "amount=65900&currency=sek&capture_method=manual&automatic_payment_methods%5Benabled%5D=true"
      + "&metadata%5BcartId%5D=abc&metadata%5Bavtryck%5D=x%20y&payment_method_types%5B0%5D=card&payment_method_types%5B1%5D=klarna",
  );
});

test("kodaParams skickar aldrig tomma värden som tom sträng", () => {
  assert.equal(kodaParams({ a: undefined, b: null, c: { d: undefined } }), "");
});

const HEMLIGHET = "whsec_prov_hemlighet";
const signera = (kropp: string, t: number, hemlighet = HEMLIGHET) =>
  `t=${t},v1=${createHmac("sha256", hemlighet).update(`${t}.${kropp}`, "utf8").digest("hex")}`;

test("provaWebhook godtar Stripes signatur inom fem minuter", () => {
  const kropp = JSON.stringify({ id: "evt_1", type: "payment_intent.amount_capturable_updated", created: 1, data: { object: { id: "pi_1" } } });
  const r = provaWebhook(kropp, signera(kropp, 1_000_000), HEMLIGHET, 1_000_100);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.handelse.type, "payment_intent.amount_capturable_updated");
});

test("provaWebhook nekar ändrad kropp, fel hemlighet, gamla och osignerade meddelanden", () => {
  const kropp = JSON.stringify({ id: "evt_1", type: "x", created: 1, data: { object: {} } });
  const sig = signera(kropp, 1_000_000);
  assert.deepEqual(provaWebhook(kropp.replace("evt_1", "evt_2"), sig, HEMLIGHET, 1_000_000), { ok: false, orsak: "fel_signatur" });
  assert.deepEqual(provaWebhook(kropp, signera(kropp, 1_000_000, "whsec_annan"), HEMLIGHET, 1_000_000), { ok: false, orsak: "fel_signatur" });
  assert.deepEqual(provaWebhook(kropp, sig, HEMLIGHET, 1_000_301), { ok: false, orsak: "for_gammal" });
  assert.deepEqual(provaWebhook(kropp, null, HEMLIGHET, 1_000_000), { ok: false, orsak: "saknar_signatur" });
  assert.deepEqual(provaWebhook(kropp, "v1=abc", HEMLIGHET, 1_000_000), { ok: false, orsak: "fel_format" });
});

test("provaWebhook godtar när en av flera v1 stämmer (hemligheten byts)", () => {
  const kropp = JSON.stringify({ id: "evt_1", type: "x", created: 1, data: { object: {} } });
  const ratt = signera(kropp, 1_000_000).split("v1=")[1];
  const r = provaWebhook(kropp, `t=1000000,v1=${"0".repeat(64)},v1=${ratt}`, HEMLIGHET, 1_000_000);
  assert.equal(r.ok, true);
});

test("lasSignatur kräver både t och v1", () => {
  assert.deepEqual(lasSignatur("t=5,v1=aa,v0=bb"), { t: 5, v1: ["aa"] });
  assert.equal(lasSignatur("t=5"), null);
  assert.equal(lasSignatur("v1=aa"), null);
});

test("betalsattsnamn säger hur kunden betalade, med kundens ord", () => {
  const med = (type: string, wallet?: string) => ({ latest_charge: { id: "ch_1", payment_method_details: { type, card: wallet ? { wallet: { type: wallet } } : null } } });
  assert.equal(betalsattsnamn(med("klarna")), "Klarna");
  assert.equal(betalsattsnamn(med("card")), "Kort");
  assert.equal(betalsattsnamn(med("card", "apple_pay")), "Apple Pay");
  assert.equal(betalsattsnamn(med("card", "google_pay")), "Google Pay");
  assert.equal(betalsattsnamn(med("swish")), "Swish");
  assert.equal(betalsattsnamn({ latest_charge: null, payment_method_types: ["klarna"] }), "Klarna");
  assert.equal(betalsattsnamn({ latest_charge: "ch_1", payment_method_types: ["card", "klarna"] }), "Stripe");
});

test("laddningsId läser både utbyggd och obyggd laddning", () => {
  assert.equal(laddningsId({ latest_charge: "ch_1" }), "ch_1");
  assert.equal(laddningsId({ latest_charge: { id: "ch_2" } }), "ch_2");
  assert.equal(laddningsId({ latest_charge: null }), null);
});
