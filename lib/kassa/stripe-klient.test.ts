// Kassasidans Stripe-del (lib/kassa/stripe-klient.ts).
// Kör: node --test --experimental-strip-types lib/kassa/stripe-klient.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BETALFALT,
  RETUR_SOKVAG,
  SPARAD_MS,
  STRIPE_MEDDELANDE,
  betalfelText,
  elementsInstallningar,
  faktureringsuppgifter,
  klarBeslut,
  returMal,
  sparadAvsikt,
  stripeMeddelande,
  tillbakaKod,
} from "./stripe-klient.ts";
import { avsiktParametrar } from "./flode.ts";
import type { KassaVarden } from "./formular.ts";

// Telefonnumret ur PTS serie för fiktiva nummer (070-174 06 05 – 070-174 06 99).
const KUND: KassaVarden = {
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

test("betalfältet och PaymentIntenten har samma valuta och dragning (annars nekar Stripe bekräftelsen)", () => {
  const e = elementsInstallningar(65900);
  const p = avsiktParametrar("korg-1", KUND, 65900, "a", []);
  assert.equal(e.mode, "payment");
  assert.equal(e.amount, 65900);
  assert.equal(e.currency, p.currency);
  assert.equal(e.captureMethod, p.capture_method);
  assert.equal(e.locale, "sv");
});

test("betalfältet frågar aldrig efter namn, e-post, telefon eller adress, och Klarna står först", () => {
  assert.equal(BETALFALT.fields?.billingDetails, "never");
  assert.equal(BETALFALT.paymentMethodOrder?.[0], "klarna");
  assert.equal(BETALFALT.wallets?.applePay, "auto");
  assert.equal(BETALFALT.wallets?.googlePay, "auto");
});

test("faktureringsuppgifterna har varje fält Stripe kräver, och adressen är leveransadressen", () => {
  const f = faktureringsuppgifter(KUND);
  assert.equal(f.name, "Prov Provsson");
  assert.equal(f.email, "kund@exempel.se");
  assert.equal(f.phone, "+46701740605");
  // Med billingDetails "never" stoppar Stripe betalningen om ett adressfält saknas.
  assert.deepEqual(Object.keys(f.address).sort(), ["city", "country", "line1", "line2", "postal_code", "state"]);
  for (const v of Object.values(f.address)) assert.equal(typeof v, "string");
  const leverans = avsiktParametrar("korg-1", KUND, 65900, "a", []).shipping.address;
  assert.equal(f.address.line1, leverans.line1);
  assert.equal(f.address.postal_code, leverans.postal_code);
  assert.equal(f.address.city, leverans.city);
  assert.equal(f.address.country, leverans.country);
  assert.equal(f.address.line2, "");
  assert.equal(f.address.state, "");
});

test("faktureringsuppgifterna: c/o på andra raden, som på leveransen", () => {
  const kund = { ...KUND, co: "c/o Andersson" };
  const f = faktureringsuppgifter(kund);
  assert.equal(f.address.line2, "c/o Andersson");
  assert.equal(f.address.line2, avsiktParametrar("korg-1", kund, 100, "a", []).shipping.address.line2);
  assert.equal(faktureringsuppgifter({ ...KUND, co: "Andersson" }).address.line2, "c/o Andersson");
});

test("sparat försök: bara för samma korg, inte för gammalt och bara ett riktigt id", () => {
  const nu = 1_800_000_000_000;
  const ok = { avsiktId: "pi_3Abc", cartId: "korg-1", at: nu - 60_000 };
  assert.equal(sparadAvsikt(ok, "korg-1", nu), "pi_3Abc");
  assert.equal(sparadAvsikt(ok, "korg-2", nu), null);
  assert.equal(sparadAvsikt({ ...ok, at: nu - SPARAD_MS - 1 }, "korg-1", nu), null);
  assert.equal(sparadAvsikt({ ...ok, at: nu + 10 * 60_000 }, "korg-1", nu), null);
  assert.equal(sparadAvsikt({ ...ok, avsiktId: "pi_3Abc_secret_x" }, "korg-1", nu), null);
  assert.equal(sparadAvsikt({ ...ok, avsiktId: "ch_1" }, "korg-1", nu), null);
  assert.equal(sparadAvsikt(null, "korg-1", nu), null);
  assert.equal(sparadAvsikt("pi_3Abc", "korg-1", nu), null);
  assert.equal(sparadAvsikt(ok, "", nu), null);
});

test("klar: en order går till tacksidan", () => {
  assert.deepEqual(klarBeslut(200, { ok: true, orderId: "order-1" }), { gor: "tack", orderId: "order-1" });
});

test("klar: pågår, behandlas, serverfel och nätfel frågar igen — pengarna kan vara dragna", () => {
  assert.deepEqual(klarBeslut(202, { ok: false, kod: "pagar", meddelanden: ["Vi slutför din beställning."] }), { gor: "vanta" });
  assert.deepEqual(klarBeslut(502, { ok: false, kod: "tjanst" }), { gor: "vanta" });
  assert.deepEqual(klarBeslut(500, null), { gor: "vanta" });
  assert.deepEqual(klarBeslut(0, null), { gor: "vanta" });
  // Ett 200 utan order är inget kvitto: fråga igen i stället för att gå till en tom tacksida.
  assert.deepEqual(klarBeslut(200, { ok: true }), { gor: "vanta" });
});

test("klar: en betalning som inte blev en order säger varför, med serverns text", () => {
  assert.deepEqual(klarBeslut(409, { ok: false, kod: "pris_andrat", meddelanden: ["Priset ändrades."] }), {
    gor: "fel",
    kod: "pris_andrat",
    meddelanden: ["Priset ändrades."],
  });
  const utanText = klarBeslut(409, { ok: false });
  assert.equal(utanText.gor, "fel");
  assert.ok(utanText.gor === "fel" && /Ingen betalning drogs/.test(utanText.meddelanden[0]));
  // 503: kassan är stängd. Att fråga igen hjälper inte.
  assert.equal(klarBeslut(503, { ok: false, kod: "stangd", meddelanden: ["Kassan är stängd just nu."] }).gor, "fel");
  assert.equal(klarBeslut(400, { ok: false, kod: "okand" }).gor, "fel");
});

test("returen från Klarna: bara betalningens id går vidare, aldrig client_secret", () => {
  const sok = new URLSearchParams({ payment_intent: "pi_3Abc", payment_intent_client_secret: "pi_3Abc_secret_hemlig", redirect_status: "succeeded" });
  const mal = returMal(sok);
  assert.equal(mal, "/kassa/klar?avsikt=pi_3Abc");
  assert.ok(!mal.includes("secret"));
  assert.equal(returMal(new URLSearchParams({ payment_intent: "pi_3Abc&x=1" })), "/kassa?stripe=fel");
  assert.equal(returMal(new URLSearchParams()), "/kassa?stripe=fel");
  assert.equal(RETUR_SOKVAG, "/api/kassa/stripe/retur");
});

test("tillbaka till kassan: varje kod har en text, och okända blir fel", () => {
  assert.equal(tillbakaKod("ej_betald"), "avbruten");
  assert.equal(tillbakaKod("pris_andrat"), "pris_andrat");
  assert.equal(tillbakaKod("slut"), "slut");
  assert.equal(tillbakaKod("okand"), "fel");
  assert.equal(tillbakaKod("<script>"), "fel");
  // Koden kommer ur adressen: ärvda namn på objektet är inga koder.
  assert.equal(tillbakaKod("constructor"), "fel");
  assert.equal(tillbakaKod("__proto__"), "fel");
  for (const kod of ["avbruten", "pris_andrat", "slut", "fel"]) assert.ok(STRIPE_MEDDELANDE[kod], kod);
  assert.equal(stripeMeddelande("avbruten"), STRIPE_MEDDELANDE.avbruten);
  assert.equal(stripeMeddelande("toString"), STRIPE_MEDDELANDE.fel);
  assert.equal(stripeMeddelande(null), null);
});

test("betalfel: Stripes egen text för kort- och formulärfel, annars vår", () => {
  assert.equal(betalfelText({ type: "card_error", message: "Ditt kort nekades." }), "Ditt kort nekades.");
  assert.equal(betalfelText({ type: "validation_error", message: "Kortnumret är ofullständigt." }), "Kortnumret är ofullständigt.");
  assert.match(betalfelText({ type: "api_error", message: "Internal" }), /Ingen betalning drogs/);
  assert.match(betalfelText(null), /Ingen betalning drogs/);
});
