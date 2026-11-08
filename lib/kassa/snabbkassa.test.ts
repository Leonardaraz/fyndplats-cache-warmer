// Snabbkassan: Apple Pay och Google Pay överst på /kassa (lib/kassa/snabbkassa.ts).
// Kör: node --test --experimental-strip-types lib/kassa/snabbkassa.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FRAKT_ID,
  PLANBOK_TEXT,
  SNABB_HOJD,
  SNABB_MAX_RADER,
  forberedFel,
  fraktval,
  klickSvar,
  kronor,
  planbocker,
  planbokFel,
  planbokNamn,
  planbokTrolig,
  PLANBOK_SKRIPT,
  snabbBekrafta,
  snabbknappar,
  snabbRader,
  type PlanbokHandelse,
  type Sammandrag,
  type SnabbDeps,
} from "./snabbkassa.ts";
import { delaNamn, kundFranPlanbok, provaKassa, type PlanbokVarde } from "./formular.ts";
import { BETALFALT, betalfelText, elementsInstallningar } from "./stripe-klient.ts";
import { avsiktParametrar } from "./flode.ts";

const DAGAR = { min: 3, max: 6 };

const SAMMANDRAG: Sammandrag = {
  rader: [
    { namn: "Pedalhink 20 l", antal: 1, radOre: 69900 },
    { namn: "Trädgårdsbänk", antal: 2, radOre: 259800 },
  ],
  delsummaOre: 329700,
  rabattOre: 0,
  kupong: null,
  fraktOre: 0,
  fraktnamn: "Spårbar standardleverans",
  totalOre: 329700,
  dagar: DAGAR,
};

const summa = (l: { amount: number }[]) => l.reduce((n, x) => n + x.amount, 0);

// Telefonnumret ur PTS serie för fiktiva nummer (070-174 06 05 – 070-174 06 99).
const APPLE_PAY: PlanbokVarde = {
  billingDetails: { name: "Prov Provsson", email: "kund@exempel.se", phone: "+46 70 174 06 05" },
  shippingAddress: {
    name: "Anna Maria Provsson",
    address: { line1: "Provgatan 1", line2: null, city: "Kungsbacka", state: "Hallands län", postal_code: "43430", country: "SE" },
  },
};

// ── Knapparna ──────────────────────────────────────────────────────────────

test("knapparna: bara Apple Pay och Google Pay, aldrig Klarna, Link, PayPal eller Amazon Pay", () => {
  const o = snabbknappar(null);
  assert.equal(o.paymentMethods?.applePay, "auto");
  assert.equal(o.paymentMethods?.googlePay, "auto");
  // Betaltjänstlagen: Klarna (kredit) står sist i betalfältet och får aldrig stå först på sidan.
  assert.equal(o.paymentMethods?.klarna, "never");
  assert.equal(o.paymentMethods?.link, "never");
  assert.equal(o.paymentMethods?.paypal, "never");
  assert.equal(o.paymentMethods?.amazonPay, "never");
  assert.deepEqual(o.paymentMethodOrder, ["apple_pay", "google_pay"]);
});

test("knapparna: plånboken ger e-post, telefon och en svensk leveransadress, så kunden slipper formuläret", () => {
  const o = snabbknappar(null);
  assert.equal(o.emailRequired, true);
  assert.equal(o.phoneNumberRequired, true);
  assert.equal(o.shippingAddressRequired, true);
  assert.deepEqual(o.allowedShippingCountries, ["SE"]);
  assert.equal(o.business?.name, "Fyndplats");
  // Stripe tillåter 40–55 px.
  assert.ok(SNABB_HOJD >= 40 && SNABB_HOJD <= 55);
  assert.equal(o.buttonHeight, SNABB_HOJD);
});

test("☠️ knapparnas layout är en Stripe godtar: overflow \"never\" bara med maxRows 0", () => {
  // Annars kastar Stripe IntegrationError och inga knappar ritas (lokalt prov 2026-11-06).
  const l = snabbknappar(null).layout;
  assert.ok(l && typeof l === "object");
  if (l.overflow === "never") assert.equal(l.maxRows, 0);
  assert.equal(l.maxColumns, 1);
});

test("knapparna skapas med samma rader och frakt som trycket svarar med", () => {
  const o = snabbknappar(SAMMANDRAG);
  const k = klickSvar(SAMMANDRAG);
  assert.deepEqual(o.lineItems, k.lineItems);
  assert.deepEqual(o.shippingRates, k.shippingRates);
  assert.equal("lineItems" in snabbknappar(null), false);
});

test("snabbkassans grupp har samma valuta och dragning som betalningen servern skapar", () => {
  const e = elementsInstallningar(SAMMANDRAG.totalOre);
  const p = avsiktParametrar("korg-1", SAMMANDRAG.totalOre, []);
  assert.equal(e.currency, p.currency);
  assert.equal(e.captureMethod, p.capture_method);
  // Plånboken sätter leveransadressen vid bekräftelsen; servern får aldrig sätta den.
  assert.equal("shipping" in p, false);
});

test("betalfältet visar inte plånböckerna som står överst", () => {
  const knappar = snabbknappar(null).paymentMethods ?? {};
  assert.equal(BETALFALT.wallets?.applePay === "never" && knappar.applePay === "auto", true);
  assert.equal(BETALFALT.wallets?.googlePay === "never" && knappar.googlePay === "auto", true);
  assert.ok(!(BETALFALT.paymentMethodOrder ?? []).some((t) => t === "apple_pay" || t === "google_pay"));
});

// ── Bladets rader ──────────────────────────────────────────────────────────

test("raderna: varje vara för sig, antal före namnet, och raderna plus frakten är totalen", () => {
  const r = snabbRader(SAMMANDRAG);
  assert.deepEqual(r, [
    { name: "Pedalhink 20 l", amount: 69900 },
    { name: "2 × Trädgårdsbänk", amount: 259800 },
  ]);
  assert.equal(summa(r) + SAMMANDRAG.fraktOre, SAMMANDRAG.totalOre);
});

test("raderna: rabatten är en negativ rad med koden, och frakten under fri-frakt-gränsen räknas in", () => {
  const s: Sammandrag = {
    ...SAMMANDRAG,
    rader: [{ namn: "Pedalhink 20 l", antal: 1, radOre: 49900 }],
    delsummaOre: 49900,
    rabattOre: 2495,
    kupong: "VALKOMMEN5",
    fraktOre: 1900,
    totalOre: 49900 - 2495 + 1900,
  };
  const r = snabbRader(s);
  assert.deepEqual(r, [
    { name: "Pedalhink 20 l", amount: 49900 },
    { name: "Rabatt (VALKOMMEN5)", amount: -2495 },
  ]);
  assert.equal(summa(r) + s.fraktOre, s.totalOre);
});

test("raderna: går de inte jämnt upp med Wix delsumma blir det en rad med alla varor", () => {
  // Medlemspriset eller en ändrad auktion: korgens radpris är inte Wix räkning.
  const s: Sammandrag = { ...SAMMANDRAG, delsummaOre: 320000, totalOre: 320000 };
  assert.deepEqual(snabbRader(s), [{ name: "Varor (3 st)", amount: 320000 }]);
  // Och går inte ens delsumman upp mot totalen: raden är totalen minus frakten.
  const t: Sammandrag = { ...SAMMANDRAG, delsummaOre: 320000, totalOre: 300000, fraktOre: 1900 };
  assert.deepEqual(snabbRader(t), [{ name: "Varor (3 st)", amount: 298100 }]);
});

test("raderna: för många varor, eller en rad utan pris, blir en rad", () => {
  const manga: Sammandrag = {
    ...SAMMANDRAG,
    rader: Array.from({ length: SNABB_MAX_RADER + 1 }, (_, i) => ({ namn: `Vara ${i}`, antal: 1, radOre: 1000 })),
    delsummaOre: (SNABB_MAX_RADER + 1) * 1000,
    totalOre: (SNABB_MAX_RADER + 1) * 1000 + 1900,
    fraktOre: 1900,
  };
  assert.deepEqual(snabbRader(manga), [{ name: `Varor (${SNABB_MAX_RADER + 1} st)`, amount: (SNABB_MAX_RADER + 1) * 1000 }]);
  const utanPris: Sammandrag = { ...SAMMANDRAG, rader: [{ ...SAMMANDRAG.rader[0], radOre: null }, SAMMANDRAG.rader[1]] };
  assert.deepEqual(snabbRader(utanPris), [{ name: "Varor (3 st)", amount: 329700 }]);
});

test("raderna: långa namn kortas, tomma heter Vara, och ingen total ger inga rader", () => {
  const lang = "Uppresningsfåtölj med massage och värme, elektrisk, i konstläder med mugghållare och fjärrkontroll";
  const r = snabbRader({ ...SAMMANDRAG, rader: [{ namn: lang, antal: 1, radOre: 329700 }] });
  assert.equal(r.length, 1);
  assert.ok(r[0].name.length <= 60 && r[0].name.endsWith("…"), r[0].name);
  assert.equal(snabbRader({ ...SAMMANDRAG, rader: [{ namn: "  ", antal: 1, radOre: 329700 }] })[0].name, "Vara");
  assert.deepEqual(snabbRader({ ...SAMMANDRAG, totalOre: 0 }), []);
});

test("raderna plus frakten är alltid totalen (20 000 slumpade korgar)", () => {
  let fro = 20261106;
  const slump = (max: number) => {
    fro = (fro * 1103515245 + 12345) % 2 ** 31;
    return fro % max;
  };
  for (let i = 0; i < 20_000; i++) {
    const n = 1 + slump(9);
    const rader = Array.from({ length: n }, (_, k) => {
      const antal = 1 + slump(3);
      return { namn: `Vara ${k}`, antal, radOre: slump(10) === 0 ? null : (1000 + slump(500000)) * antal };
    });
    const radSumma = rader.reduce((x, r) => x + (r.radOre ?? 0), 0);
    // Ibland stämmer korgens rader med Wix, ibland inte (medlemspris, ändrat pris).
    const delsummaOre = slump(3) === 0 ? radSumma + slump(5000) : radSumma;
    const rabattOre = slump(4) === 0 ? Math.min(slump(20000), delsummaOre) : 0;
    const fraktOre = delsummaOre - rabattOre >= 50000 ? 0 : 1900;
    const totalOre = slump(5) === 0 ? delsummaOre - rabattOre + fraktOre + slump(300) : delsummaOre - rabattOre + fraktOre;
    const s: Sammandrag = { rader, delsummaOre, rabattOre, kupong: rabattOre ? "KOD" : null, fraktOre, fraktnamn: null, totalOre, dagar: DAGAR };
    const r = snabbRader(s);
    assert.equal(summa(r) + fraktval(s)[0].amount, totalOre, JSON.stringify(s));
    assert.ok(r.length <= SNABB_MAX_RADER + 1);
  }
});

test("fraktvalet: Wix frakt och namn, leveranstiden i arbetsdagar", () => {
  const [f] = fraktval({ ...SAMMANDRAG, fraktOre: 1900, fraktnamn: null });
  assert.equal(f.id, FRAKT_ID);
  assert.equal(f.amount, 1900);
  assert.equal(f.displayName, "Spårbar standardleverans");
  assert.deepEqual(f.deliveryEstimate, { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 6 } });
  assert.equal(fraktval({ ...SAMMANDRAG, fraktnamn: "Fri frakt" })[0].displayName, "Fri frakt");
});

// ── Plånböckerna ───────────────────────────────────────────────────────────

test("plånböckerna: rutan syns bara när Stripe hittar Apple Pay eller Google Pay", () => {
  const ingen = { amazonPay: false, applePay: false, googlePay: false, link: false, paypal: false, klarna: false };
  assert.deepEqual(planbocker(undefined), []);
  assert.deepEqual(planbocker(ingen), []);
  // Link och Klarna räknas inte: knapparna visar dem aldrig.
  assert.deepEqual(planbocker({ ...ingen, link: true, klarna: true }), []);
  assert.deepEqual(planbocker({ ...ingen, applePay: true }), ["apple_pay"]);
  assert.deepEqual(planbocker({ ...ingen, applePay: true, googlePay: true }), ["apple_pay", "google_pay"]);
  assert.equal(planbokNamn(["apple_pay"]), "Apple Pay");
  assert.equal(planbokNamn(["google_pay"]), "Google Pay");
  assert.equal(planbokNamn(["apple_pay", "google_pay"]), "Apple Pay eller Google Pay");
  assert.equal(planbokNamn([]), "Apple Pay eller Google Pay");
});

test("platsen hålls bara där Apple Pay finns: Google Pays kontroll är för långsam för en hållen plats", () => {
  assert.equal(planbokTrolig({ applePaySession: true }), true);
  assert.equal(planbokTrolig({ applePaySession: false }), false);
});

test("skriptet före första ritningen ger <html> samma svar som planbokTrolig", () => {
  for (const apple of [true, false]) {
    const satt: Record<string, string> = {};
    const fonster: Record<string, unknown> = apple ? { ApplePaySession: function ApplePaySession() {} } : {};
    const dokument = { documentElement: { setAttribute: (k: string, v: string) => void (satt[k] = v) } };
    new Function("document", "window", PLANBOK_SKRIPT)(dokument, fonster);
    assert.deepEqual(satt, { "data-applepay": planbokTrolig({ applePaySession: apple }) ? "ja" : "nej" });
  }
  // Ett fel i skriptet får aldrig stoppa sidan.
  assert.doesNotThrow(() => new Function("document", "window", PLANBOK_SKRIPT)({}, {}));
});

test("utan Apple Pay hålls ingen plats före hydreringen: layouten kör skriptet och CSS:en flyttar ut rutan", () => {
  const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../app/kassa/kassa.module.css", import.meta.url), "utf8");
  const kassa = readFileSync(new URL("../../app/kassa/kassa.tsx", import.meta.url), "utf8");
  assert.match(layout, /<script dangerouslySetInnerHTML=\{\{ __html: PLANBOK_SKRIPT \}\} \/>/);
  // Rutan flyttas ut på samma sätt som utan plånbok, men bara medan Stripe svarar:
  // knapparna måste vara monterade (inte display: none) för att Stripe ska kunna svara.
  const regel = /\.snabb\[data-visas="nej"\],\s*:global\(html\[data-applepay="nej"\]\) \.snabb\[data-snabb="laddar"\]\s*\{([^}]*)\}/.exec(css);
  assert.ok(regel, "regeln för rutan saknas");
  assert.match(regel[1], /left: -10000px/);
  assert.match(regel[1], /visibility: hidden/);
  assert.doesNotMatch(regel[1], /display: none/);
  assert.match(css, /:global\(html\[data-applepay="nej"\]\) \.eller\[data-snabb="laddar"\]\s*\{\s*display: none;/);
  // Rutan och skiljeraden bär Stripes läge, så att regeln släpper när knapparna finns.
  assert.equal(kassa.match(/data-snabb=\{snabbLage\}/g)?.length, 2);
});

test("Stripes knapp tonar fram över platshållaren: inget vitt blink när Stripe svarar (Leonard 2026-11-08)", () => {
  const css = readFileSync(new URL("../../app/kassa/kassa.module.css", import.meta.url), "utf8");
  const kassa = readFileSync(new URL("../../app/kassa/kassa.tsx", import.meta.url), "utf8");
  // Platshållaren står kvar i läget "redo" och ligger före Stripes plats, som är
  // positionerad: Stripes genomskinliga ram ritas över den.
  assert.match(kassa, /snabbLage === "laddar" \|\| snabbLage === "redo" \? <div className=\{s\.snabbSkelett\} aria-hidden="true" \/>/);
  const skelett = kassa.indexOf("className={s.snabbSkelett}");
  const plats = kassa.indexOf("ref={snabbPlats}");
  assert.ok(skelett > 0 && plats > skelett, "platshållaren ska stå före Stripes plats");
  assert.match(kassa, /<div ref=\{snabbPlats\} className=\{s\.snabbKnappar\} \/>/);
  assert.match(css, /\n\.snabbKnappar \{\s*position: relative;\s*\}/);
  // Den tonar bort först när Stripes knapp sedan länge syns: Stripe lägger in vyn
  // upp till 150 ms efter "ready" och tonar sedan 160 + 400 ms (uppmätt 2026-11-08).
  const ut = /\.snabb\[data-snabb="redo"\] \.snabbSkelett \{\s*animation: snabbSkelettUt ([\d.]+)s ease ([\d.]+)s forwards;\s*\}/.exec(css);
  assert.ok(ut, "regeln för läget redo saknas");
  assert.ok(Number(ut[2]) >= 1.5, `för kort väntan: ${ut[2]} s`);
  assert.match(css, /@keyframes snabbSkelettUt \{\s*to \{\s*opacity: 0;\s*visibility: hidden;/);
  // Den tar aldrig ett tryck, inte heller skimmern utanför Safari.
  const bas = /\n\.snabbSkelett \{([^}]*)\}/.exec(css);
  assert.ok(bas, ".snabbSkelett saknas");
  assert.match(bas[1], /pointer-events: none;/);
  // Apples knapp i Safari har Stripes Apple Pay-mått: 50 px hög överst i ytan.
  const apple = /:global\(html\[data-applepay="ja"\]\) \.snabbSkelett \{([^}]*)\}/.exec(css);
  assert.ok(apple, "Safari-platshållaren saknas");
  assert.match(apple[1], /bottom: auto;/);
  assert.match(apple[1], /height: 50px;/);
  // Texten står still: medan Stripe svarar syns rutan bara där Apple Pay finns.
  assert.match(kassa, /const planbokText = snabbLage === "redo" \? planbokNamn\(snabbPlanbocker\) : "Apple Pay";/);
});

// ── Plånbokens uppgifter som kassans formulär ──────────────────────────────

test("namnet på en rad: efternamnet är sista ordet", () => {
  assert.deepEqual(delaNamn("Anna Maria Provsson"), { fornamn: "Anna Maria", efternamn: "Provsson" });
  assert.deepEqual(delaNamn("  Prov   Provsson "), { fornamn: "Prov", efternamn: "Provsson" });
  assert.deepEqual(delaNamn("Prov"), { fornamn: "Prov", efternamn: "" });
  assert.deepEqual(delaNamn(null), { fornamn: "", efternamn: "" });
});

test("Apple Pay: uppgifterna klarar kassans prov, med länet ur regionen och numret i E.164", () => {
  const p = provaKassa(kundFranPlanbok(APPLE_PAY, { kupong: "" }));
  assert.equal(p.ok, true);
  if (!p.ok) return;
  assert.deepEqual(p.varden, {
    epost: "kund@exempel.se",
    fornamn: "Anna Maria",
    efternamn: "Provsson",
    telefon: "+46701740605",
    gata: "Provgatan 1",
    rad2: "",
    co: "",
    postnr: "434 30",
    ort: "Kungsbacka",
    lan: "SE-N",
    kupong: "",
  });
});

test("Google Pay utan region: länet ur postnumret; namnet från kortet när leveransen bara har ett ord", () => {
  const g: PlanbokVarde = {
    billingDetails: { name: "Prov Provsson", email: "kund@exempel.se", phone: "070-174 06 06" },
    shippingAddress: { name: "Prov", address: { line1: "Provgatan 2", line2: "Lgh 1201", city: "Stockholm", state: "", postal_code: "111 22", country: "SE" } },
  };
  const p = provaKassa(kundFranPlanbok(g, { kupong: "VALKOMMEN5" }));
  assert.equal(p.ok, true);
  if (!p.ok) return;
  assert.equal(p.varden.fornamn, "Prov");
  assert.equal(p.varden.efternamn, "Provsson");
  assert.equal(p.varden.rad2, "Lgh 1201");
  assert.equal(p.varden.lan, "SE-AB");
  assert.equal(p.varden.telefon, "+46701740606");
  assert.equal(p.varden.kupong, "VALKOMMEN5");
});

test("länet: plånbokens region går före postnumret, som i adressfältet (adressFranStripe)", () => {
  const annat = { ...APPLE_PAY, shippingAddress: { ...APPLE_PAY.shippingAddress, address: { ...APPLE_PAY.shippingAddress!.address, state: "Västra Götalands län" } } };
  assert.equal(kundFranPlanbok(annat).lan, "SE-O");
  const okand = { ...APPLE_PAY, shippingAddress: { ...APPLE_PAY.shippingAddress, address: { ...APPLE_PAY.shippingAddress!.address, state: "Ingenstans" } } };
  assert.equal(kundFranPlanbok(okand).lan, "SE-N");
});

test("medlemmens korg: kassans e-post går före plånbokens, så att köpet räknas på kontot", () => {
  const k = kundFranPlanbok(APPLE_PAY, { epost: "medlem@exempel.se" });
  assert.equal(k.epost, "medlem@exempel.se");
  assert.equal(kundFranPlanbok(APPLE_PAY, { epost: null }).epost, "kund@exempel.se");
  assert.equal(kundFranPlanbok(APPLE_PAY, { epost: "  " }).epost, "kund@exempel.se");
});

test("plånbokens fel: bara ett ord som namn och inget nummer ger kundens text och leveransadressen som orsak", () => {
  const p = provaKassa(kundFranPlanbok({ ...APPLE_PAY, billingDetails: { email: "kund@exempel.se" }, shippingAddress: { ...APPLE_PAY.shippingAddress, name: "Prov" } }));
  assert.equal(p.ok, false);
  if (p.ok) return;
  const f = planbokFel(p.fel);
  // Telefonen kommer först, som i formuläret.
  assert.equal(f.orsak, "invalid_shipping_address");
  assert.equal(f.text, PLANBOK_TEXT.telefon);
  assert.equal(planbokFel({ efternamn: "x" }).text, PLANBOK_TEXT.efternamn);
  assert.equal(planbokFel({ kupong: "Rabattkoden ser inte rätt ut." }).orsak, "fail");
  assert.equal(planbokFel({}).orsak, "invalid_shipping_address");
});

test("serverns nej: postnumret utan leverans, rabattkoden, nätet och resten", () => {
  assert.deepEqual(forberedFel(409, { falt: "postnr", meddelanden: ["Vi kan inte leverera till den adressen. Kontrollera postnumret."] }), {
    orsak: "address_unserviceable",
    text: "Vi kan inte leverera till den adressen. Kontrollera postnumret.",
    falt: "postnr",
  });
  assert.equal(forberedFel(409, { falt: "kupong", meddelanden: ["Rabattkoden finns inte."] }).falt, "kupong");
  assert.equal(forberedFel(0, {}).orsak, "fail");
  assert.match(forberedFel(0, {}).text, /Ingen kontakt/);
  assert.equal(forberedFel(400, { fel: { postnr: "Fem siffror, som 152 44." } }).text, PLANBOK_TEXT.postnr);
  assert.equal(forberedFel(409, { meddelanden: ["En vara är slut."] }).text, "En vara är slut.");
  assert.match(forberedFel(502, {}).text, /Ingen betalning drogs/);
});

test("belopp skrivs som i kassan", () => {
  assert.equal(kronor(329700), "3 297 kr");
  assert.equal(kronor(9490), "94,90 kr");
  assert.equal(kronor(123456789), "1 234 567,89 kr");
});

// ── Bekräftelsen ───────────────────────────────────────────────────────────

interface Logg {
  steg: string[];
  misslyckat: { reason?: string; message?: string }[];
}

function handelse(p: PlanbokVarde, logg: Logg): PlanbokHandelse {
  return { ...p, paymentFailed: (x) => void logg.misslyckat.push(x ?? {}) };
}

function falsk(logg: Logg, o: Partial<{ submit: SnabbDeps["submit"]; forbered: { status: number; j: unknown } | "kast"; bekrafta: SnabbDeps["bekrafta"]; visat: number | null }> = {}): SnabbDeps {
  return {
    submit: o.submit ?? (async () => {
      logg.steg.push("submit");
      return {};
    }),
    prova: (h) => provaKassa(kundFranPlanbok(h, { kupong: "" })),
    forbered: async (kund) => {
      logg.steg.push(`forbered:${kund.postnr}:${kund.lan}`);
      if (o.forbered === "kast") throw new Error("nätet");
      return o.forbered ?? { status: 200, j: { ok: true, avsiktId: "pi_123", clientSecret: "hemligt", totalOre: 329700, fakturering: {} } };
    },
    spara: (id) => void logg.steg.push(`spara:${id}`),
    visat: () => (o.visat === undefined ? 329700 : o.visat),
    bekrafta: o.bekrafta ?? (async (cs) => {
      logg.steg.push(`bekrafta:${cs}`);
      return { status: "requires_capture" };
    }),
    felText: betalfelText,
    steg: (n) => void logg.steg.push(`steg:${n}`),
  };
}

test("bekräftelsen: plånbokens uppgifter → förbered → spara → bekräfta → slutför, utan fel i bladet", async () => {
  const logg: Logg = { steg: [], misslyckat: [] };
  const u = await snabbBekrafta(falsk(logg), handelse(APPLE_PAY, logg));
  assert.deepEqual(u, { gor: "slutfor", avsiktId: "pi_123" });
  // Betalningens id sparas FÖRE bekräftelsen: laddas sidan om mitt i hittar kassan den.
  assert.deepEqual(logg.steg, ["submit", "steg:0", "forbered:434 30:SE-N", "spara:pi_123", "steg:1", "bekrafta:hemligt"]);
  assert.deepEqual(logg.misslyckat, []);
});

test("bekräftelsen: Stripes prov av bladet felar → inget skickas till servern", async () => {
  const logg: Logg = { steg: [], misslyckat: [] };
  const u = await snabbBekrafta(falsk(logg, { submit: async () => ({ error: { type: "validation_error", message: "Ofullständigt." } }) }), handelse(APPLE_PAY, logg));
  assert.deepEqual(u, { gor: "fel", text: "Ofullständigt." });
  assert.equal(logg.misslyckat[0].reason, "fail");
  assert.ok(!logg.steg.some((x) => x.startsWith("forbered")));
});

test("bekräftelsen: en adress utanför Sverige stoppas i bladet", async () => {
  const logg: Logg = { steg: [], misslyckat: [] };
  const utland = { ...APPLE_PAY, shippingAddress: { ...APPLE_PAY.shippingAddress, address: { ...APPLE_PAY.shippingAddress!.address, country: "NO" } } };
  const u = await snabbBekrafta(falsk(logg), handelse(utland, logg));
  assert.equal(u.gor, "fel");
  assert.equal(logg.misslyckat[0].reason, "address_unserviceable");
  assert.ok(!logg.steg.some((x) => x.startsWith("forbered")));
});

test("bekräftelsen: saknat efternamn stoppas i bladet med kundens text, servern frågas inte", async () => {
  const logg: Logg = { steg: [], misslyckat: [] };
  const ettOrd = { billingDetails: { ...APPLE_PAY.billingDetails, name: "Prov" }, shippingAddress: { ...APPLE_PAY.shippingAddress, name: "Prov" } };
  const u = await snabbBekrafta(falsk(logg), handelse(ettOrd, logg));
  assert.deepEqual(u, { gor: "fel", text: PLANBOK_TEXT.efternamn });
  assert.deepEqual(logg.misslyckat, [{ reason: "invalid_shipping_address", message: PLANBOK_TEXT.efternamn }]);
  assert.deepEqual(logg.steg, ["submit"]);
});

test("bekräftelsen: serverns nej når bladet, och ingenting sparas eller bekräftas", async () => {
  for (const [svar, falt, orsak] of [
    [{ status: 409, j: { ok: false, falt: "postnr", meddelanden: ["Vi kan inte leverera till den adressen. Kontrollera postnumret."] } }, "postnr", "address_unserviceable"],
    [{ status: 409, j: { ok: false, falt: "kupong", meddelanden: ["Rabattkoden finns inte eller gäller inte för de här varorna."] } }, "kupong", "fail"],
    [{ status: 409, j: { ok: false, kod: "overtradelse", meddelanden: ["En vara är slut."] } }, undefined, "fail"],
    [{ status: 0, j: null }, undefined, "fail"],
    [{ status: 200, j: { ok: true, avsiktId: "inte-ett-id", clientSecret: "x", totalOre: 329700 } }, undefined, "fail"],
  ] as const) {
    const logg: Logg = { steg: [], misslyckat: [] };
    const u = await snabbBekrafta(falsk(logg, { forbered: svar }), handelse(APPLE_PAY, logg));
    assert.equal(u.gor, "fel", JSON.stringify(svar));
    if (u.gor === "fel") assert.equal(u.falt, falt);
    assert.equal(logg.misslyckat.length, 1);
    assert.equal(logg.misslyckat[0].reason, orsak);
    assert.ok(!logg.steg.some((x) => x.startsWith("spara") || x.startsWith("bekrafta")), logg.steg.join(","));
  }
  const logg: Logg = { steg: [], misslyckat: [] };
  const u = await snabbBekrafta(falsk(logg, { forbered: "kast" }), handelse(APPLE_PAY, logg));
  assert.equal(u.gor, "fel");
  assert.equal(logg.misslyckat.length, 1);
});

test("bekräftelsen: Wix räknade en annan total → ingen betalning på ett belopp kunden inte sett", async () => {
  const logg: Logg = { steg: [], misslyckat: [] };
  const u = await snabbBekrafta(falsk(logg, { visat: 319700 }), handelse(APPLE_PAY, logg));
  assert.equal(u.gor, "belopp");
  if (u.gor === "belopp") {
    assert.equal(u.totalOre, 329700);
    assert.match(u.text, /3 297 kr/);
  }
  assert.equal(logg.misslyckat.length, 1);
  assert.ok(!logg.steg.some((x) => x.startsWith("bekrafta")));
});

test("bekräftelsen: redan betald i ett tidigare försök → slutför den, ingen ny betalning", async () => {
  const logg: Logg = { steg: [], misslyckat: [] };
  const u = await snabbBekrafta(falsk(logg, { forbered: { status: 200, j: { ok: true, avsiktId: "pi_9", redanBetald: true } } }), handelse(APPLE_PAY, logg));
  assert.deepEqual(u, { gor: "slutfor", avsiktId: "pi_9" });
  assert.equal(logg.misslyckat.length, 1);
  assert.ok(logg.steg.includes("spara:pi_9"));
  assert.ok(!logg.steg.some((x) => x.startsWith("bekrafta")));
});

test("bekräftelsen: Stripes nej efter bekräftelsen ger kassans text (bladet stänger Stripe själv)", async () => {
  const neka: SnabbDeps["bekrafta"] = async () => ({ error: { type: "card_error", code: "card_declined", message: "Kortet nekades." } });
  const logg: Logg = { steg: [], misslyckat: [] };
  assert.deepEqual(await snabbBekrafta(falsk(logg, { bekrafta: neka }), handelse(APPLE_PAY, logg)), { gor: "fel", text: "Kortet nekades." });
  assert.deepEqual(logg.misslyckat, []);

  const ej: SnabbDeps["bekrafta"] = async () => ({ status: "requires_payment_method" });
  const logg2: Logg = { steg: [], misslyckat: [] };
  const u = await snabbBekrafta(falsk(logg2, { bekrafta: ej }), handelse(APPLE_PAY, logg2));
  assert.equal(u.gor, "fel");

  const kast: SnabbDeps["bekrafta"] = async () => {
    throw new Error("nätet");
  };
  const logg3: Logg = { steg: [], misslyckat: [] };
  const v = await snabbBekrafta(falsk(logg3, { bekrafta: kast }), handelse(APPLE_PAY, logg3));
  assert.deepEqual(v, { gor: "fel", text: betalfelText(null) });

  // "processing" och "succeeded" är godkända som i betalfältet.
  for (const status of ["processing", "succeeded"]) {
    const l: Logg = { steg: [], misslyckat: [] };
    const w = await snabbBekrafta(falsk(l, { bekrafta: async () => ({ status }) }), handelse(APPLE_PAY, l));
    assert.equal(w.gor, "slutfor");
  }
});
