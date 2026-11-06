// Kassasidans Stripe-del (lib/kassa/stripe-klient.ts).
// Kör: node --test --experimental-strip-types lib/kassa/stripe-klient.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adressfaltInstallningar,
  AVSIKT_KAKA,
  AVSIKT_KAKA_SOKVAG,
  BETALFALT,
  KLAR_VANTA_MS,
  RETUR_SOKVAG,
  SPARAD_MS,
  STRIPE_MEDDELANDE,
  TEXT_VERIFIERING,
  avsiktUrKakor,
  betalfelText,
  elementsInstallningar,
  klarBeslut,
  klarnaRuta,
  returMal,
  sparadAvsikt,
  stripeMeddelande,
  tillbakaKod,
  vantaPaOrder,
  type KlarSvar,
} from "./stripe-klient.ts";
import { avsiktParametrar, faktureringAv } from "./flode.ts";
import type { KassaVarden } from "./formular.ts";

// Telefonnumret ur PTS serie för fiktiva nummer (070-174 06 05 – 070-174 06 99).
const KUND: KassaVarden = {
  epost: "kund@exempel.se",
  fornamn: "Prov",
  efternamn: "Provsson",
  telefon: "+46701740605",
  gata: "Provgatan 1",
  rad2: "",
  co: "",
  postnr: "111 22",
  ort: "Stockholm",
  lan: "SE-AB",
  kupong: "",
};

test("betalfältet och PaymentIntenten har samma valuta och dragning (annars nekar Stripe bekräftelsen)", () => {
  const e = elementsInstallningar(65900);
  const p = avsiktParametrar("korg-1", 65900, []);
  assert.equal(e.mode, "payment");
  assert.equal(e.amount, 65900);
  assert.equal(e.currency, p.currency);
  assert.equal(e.captureMethod, p.capture_method);
  assert.equal(e.locale, "sv");
  // Inga typsnitt från Google i Stripes ram (butiken lägger sina på egen server).
  assert.equal("fonts" in e, false);
  assert.doesNotMatch(JSON.stringify(e), /googleapis|gstatic/);
});

test("betalfältet frågar aldrig efter namn, e-post, telefon eller adress", () => {
  assert.equal(BETALFALT.fields?.billingDetails, "never");
});

test("Apple Pay och Google Pay står överst i snabbkassan, inte en gång till i betalfältet (Leonard 2026-11-06)", () => {
  assert.equal(BETALFALT.wallets?.applePay, "never");
  assert.equal(BETALFALT.wallets?.googlePay, "never");
  assert.equal(BETALFALT.wallets?.link, "never");
  assert.deepEqual(BETALFALT.paymentMethodOrder, ["card", "klarna"]);
});

test("betaltjänstlagen: ett betalsätt utan kredit står först och fälls ut, Klarna (kredit) står sist och är aldrig förvalt", () => {
  const ordning = BETALFALT.paymentMethodOrder ?? [];
  // Betalsätt där kunden kan få kredit (betala senare, delbetala).
  const KREDIT = new Set(["klarna", "affirm", "afterpay_clearpay", "zip"]);
  assert.ok(ordning.length > 1 && !KREDIT.has(ordning[0]), `först står ${ordning[0]}`);
  assert.equal(ordning[0], "card");
  assert.equal(ordning.at(-1), "klarna");
  // Alla utan kredit före alla med kredit.
  const forstaKredit = ordning.findIndex((t) => KREDIT.has(t));
  assert.ok(ordning.slice(forstaKredit).every((t) => KREDIT.has(t)), ordning.join(", "));
  // Utfällt första val = förvalt: det får bara vara ett utan kredit.
  const layout = BETALFALT.layout as { type?: string; defaultCollapsed?: boolean };
  assert.equal(layout.type, "accordion");
  if (layout.defaultCollapsed !== true) assert.ok(!KREDIT.has(ordning[0]));
});

test("faktureringen (från servern) har varje fält Stripe kräver, och adressen är kundens leveransadress", () => {
  const f = faktureringAv(KUND);
  assert.equal(f.name, "Prov Provsson");
  assert.equal(f.email, "kund@exempel.se");
  assert.equal(f.phone, "+46701740605");
  // Med billingDetails "never" stoppar Stripe betalningen om ett adressfält saknas.
  assert.deepEqual(Object.keys(f.address).sort(), ["city", "country", "line1", "line2", "postal_code", "state"]);
  for (const v of Object.values(f.address)) assert.equal(typeof v, "string");
  assert.deepEqual(
    { line1: f.address.line1, city: f.address.city, postal_code: f.address.postal_code, country: f.address.country },
    { line1: KUND.gata, city: KUND.ort, postal_code: KUND.postnr.replace(/\s/g, ""), country: "SE" },
  );
  assert.equal(f.address.line2, "");
  assert.equal(f.address.state, "");
});

test("☠️ betalningen får aldrig leveransadress från servern: adressfältet sätter den vid bekräftelsen", () => {
  // Adressfältet ligger i samma Elements som betalfältet (Googles förslag är då
  // gratis), och stripe.confirmPayment skickar dess adress som leverans. Har
  // servern satt shipping med den hemliga nyckeln nekar Stripe bekräftelsen
  // (400 payment_intent_invalid_parameter, förhandslänken 2026-11-06 16:06 UTC).
  assert.equal(adressfaltInstallningar().mode, "shipping");
  const p = avsiktParametrar("korg-1", 65900, []);
  assert.equal("shipping" in p, false);
  assert.deepEqual(Object.keys(p).sort(), ["amount", "automatic_payment_methods", "capture_method", "currency", "description", "metadata"]);
});

test("faktureringen: c/o på andra raden, som på leveransen", () => {
  const kund = { ...KUND, co: "c/o Andersson" };
  const f = faktureringAv(kund);
  assert.equal(f.address.line2, "c/o Andersson");
  assert.equal(faktureringAv({ ...KUND, co: "Andersson" }).address.line2, "c/o Andersson");
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

test("returen från Klarna: betalningens id går till kakan, adressen bär ingenting", () => {
  const sok = new URLSearchParams({ payment_intent: "pi_3Abc", payment_intent_client_secret: "pi_3Abc_secret_hemlig", redirect_status: "succeeded" });
  assert.deepEqual(returMal(sok), { mal: "/kassa/klar", avsikt: "pi_3Abc" });
  assert.equal(AVSIKT_KAKA_SOKVAG, "/kassa/klar");
  assert.deepEqual(returMal(new URLSearchParams({ payment_intent: "pi_3Abc&x=1" })), { mal: "/kassa?stripe=fel", avsikt: null });
  assert.deepEqual(returMal(new URLSearchParams()), { mal: "/kassa?stripe=fel", avsikt: null });
  assert.equal(RETUR_SOKVAG, "/api/kassa/stripe/retur");
});

test("kakan från returen: bara ett riktigt betalnings-id, bland andra kakor", () => {
  assert.equal(avsiktUrKakor(`fp_samtycke=all; ${AVSIKT_KAKA}=pi_3Abc; _ga=GA1.1`), "pi_3Abc");
  assert.equal(avsiktUrKakor(`${AVSIKT_KAKA}=pi_3Abc`), "pi_3Abc");
  assert.equal(avsiktUrKakor(`${AVSIKT_KAKA}=pi_3Abc_secret_x`), null);
  assert.equal(avsiktUrKakor(`x${AVSIKT_KAKA}=pi_3Abc`), null);
  assert.equal(avsiktUrKakor(`${AVSIKT_KAKA}=`), null);
  assert.equal(avsiktUrKakor(""), null);
});

/** Ett låtsas-nät för vantaPaOrder: svaren i tur och ordning, och en klocka som går med vilan. */
function natet(svar: KlarSvar[]) {
  let t = 0;
  const vilor: number[] = [];
  let fragor = 0;
  return {
    vilor,
    fragor: () => fragor,
    v: {
      fraga: async () => {
        fragor++;
        return svar.length > 1 ? svar.shift()! : svar[0];
      },
      vila: async (ms: number) => {
        vilor.push(ms);
        t += ms;
      },
      nu: () => t,
    },
  };
}

test("väntan på ordern: frågar tills ordern finns, också genom nätfel och serverfel", async () => {
  const n = natet([{ status: 202, j: { ok: false, kod: "pagar" } }, { status: 0, j: null }, { status: 502, j: null }, { status: 200, j: { ok: true, orderId: "order-1" } }]);
  assert.deepEqual(await vantaPaOrder("pi_1", n.v), { gor: "tack", orderId: "order-1" });
  assert.equal(n.fragor(), 4);
  assert.deepEqual(n.vilor, [1000, 1500, 2000], "vilan växer mellan frågorna");
});

test("väntan på ordern: ett nej är ett nej, direkt", async () => {
  const n = natet([{ status: 409, j: { ok: false, kod: "pris_andrat", meddelanden: ["Priset ändrades."] } }]);
  assert.deepEqual(await vantaPaOrder("pi_1", n.v), { gor: "fel", kod: "pris_andrat", meddelanden: ["Priset ändrades."] });
  assert.equal(n.fragor(), 1);
});

test("väntan på ordern: efter en minut ger sidan upp väntan (webhooken och nätet slutför), och vilan stannar på 3 s", async () => {
  const n = natet([{ status: 202, j: { ok: false, kod: "pagar" } }]);
  assert.deepEqual(await vantaPaOrder("pi_1", n.v), { gor: "tid" });
  assert.ok(n.vilor.reduce((a, b) => a + b, 0) > KLAR_VANTA_MS);
  assert.ok(n.vilor.every((ms) => ms <= 3000));
  assert.ok(n.fragor() < 40, "ingen tät frågeslinga");
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

test("Klarna-rutan på produktsidan: Klarnas egen bara när kunden får Wix kassa", () => {
  // Stripe-kassan på för alla: Stripes Klarna har andra villkor än Leonards avtal.
  assert.equal(klarnaRuta("pa", true), "statisk");
  // Provläget gäller bara den med provkakan; vanliga kunder får Wix kassa.
  assert.equal(klarnaRuta("prov", true), "osm");
  assert.equal(klarnaRuta("av", true), "osm");
  // Utan Stripes hemliga nyckel skickar "pa" kunden till Wix betalsida, där Leonards avtal gäller.
  assert.equal(klarnaRuta("pa", false), "osm");
});

test("betalfel: Stripes egen text för kort- och formulärfel, annars vår", () => {
  assert.equal(betalfelText({ type: "card_error", message: "Ditt kort nekades." }), "Ditt kort nekades.");
  assert.equal(betalfelText({ type: "validation_error", message: "Kortnumret är ofullständigt." }), "Kortnumret är ofullständigt.");
  assert.match(betalfelText({ type: "api_error", message: "Internal" }), /Ingen betalning drogs/);
  assert.match(betalfelText(null), /Ingen betalning drogs/);
});

test("betalfel: bankens verifiering som inte godkändes säger det, inte \"försök igen om en stund\"", () => {
  // Slutprovet 2026-11-06: 3D Secure-kortet med misslyckad verifiering gav förut den allmänna texten.
  const fel = { type: "invalid_request_error", code: "payment_intent_authentication_failure", message: "We are unable to authenticate your payment method." };
  assert.equal(betalfelText(fel), TEXT_VERIFIERING);
  assert.match(TEXT_VERIFIERING, /Ingen betalning drogs/);
  assert.doesNotMatch(TEXT_VERIFIERING, /om en stund/);
  assert.equal(betalfelText({ type: "card_error", code: "card_declined", message: "Ditt kort nekades." }), "Ditt kort nekades.");
});

test("adressfältet: Sverige, förnamn och efternamn var för sig, Googles förslag, inget telefonfält", () => {
  const a = adressfaltInstallningar();
  assert.equal(a.mode, "shipping");
  assert.deepEqual(a.allowedCountries, ["SE"]);
  assert.deepEqual(a.display, { name: "split" });
  assert.deepEqual(a.autocomplete, { mode: "automatic" });
  assert.deepEqual(a.fields, { phone: "never" });
  assert.equal(a.defaultValues?.address?.country, "SE");
  assert.equal(a.defaultValues?.firstName, undefined, "tomma fält skickas inte som tomma strängar");
});

test("adressfältet börjar med kundens sparade uppgifter", () => {
  const a = adressfaltInstallningar({ fornamn: " Anna ", efternamn: "Andersson", gata: "Storgatan 1", rad2: "", postnr: "152 44", ort: "Södertälje" });
  assert.deepEqual(a.defaultValues, {
    firstName: "Anna",
    lastName: "Andersson",
    address: { line1: "Storgatan 1", line2: undefined, city: "Södertälje", postal_code: "152 44", country: "SE" },
  });
});

