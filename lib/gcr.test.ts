import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_DAYS,
  MERCHANT_ID_DEFAULT,
  buildGcrConfig,
  deliveryAnchor,
  estimatedDeliveryDate,
  isFreshOrder,
  isLikelyEmail,
  merchantId,
  normalizeCountry,
} from "./gcr.ts";

// Bakgrund (2026-08-19): Merchant Center visade "Butikens betyg: Ofullständig".
// Kontot var enrollerat i Recensioner men opt-in-modulen fanns inte på /tack,
// så ingen enkät hade någonsin skickats. Google avvisar TYST ett anrop med
// trasiga fält, och en tyst avvisning ser ut som ett integrationsfel — därför
// grindas datat här i stället.

describe("estimatedDeliveryDate", () => {
  it("lägger på leveransfönstret och svarar i Googles format", () => {
    assert.equal(estimatedDeliveryDate(new Date("2026-08-19T10:30:00Z")), "2026-09-02");
  });

  it("räknar rena dygn oavsett klockslag", () => {
    // Ett anrop 23:59 och ett 00:01 samma dygn ska ge samma datum.
    assert.equal(
      estimatedDeliveryDate(new Date("2026-08-19T23:59:59Z")),
      estimatedDeliveryDate(new Date("2026-08-19T00:00:01Z")),
    );
  });

  it("går över månads- och årsskifte", () => {
    assert.equal(estimatedDeliveryDate(new Date("2026-12-28T12:00:00Z")), "2027-01-11");
  });

  it("klarar skottdagen", () => {
    assert.equal(estimatedDeliveryDate(new Date("2028-02-20T12:00:00Z"), 10), "2028-03-01");
  });

  it("fönstret ligger efter det utlovade 3–7 arbetsdagar", () => {
    // Enkäten skickas EFTER datumet. Ett för kort fönster mejlar kunden innan
    // paketet kommit — ett dåligt betyg på vår egen leverans.
    assert.ok(DELIVERY_DAYS >= 10);
  });
});

describe("normalizeCountry", () => {
  it("versaliserar och trimmar", () => {
    assert.equal(normalizeCountry(" se "), "SE");
    assert.equal(normalizeCountry("no"), "NO");
  });

  it("avvisar allt som inte är exakt tvåbokstavskod", () => {
    // Tröskeln för Butikens betyg räknas PER LAND och slås aldrig ihop, så en
    // gissning här bokför enkäten på fel land.
    for (const dålig of ["", "S", "SWE", "Sverige", "12", null, undefined, {}]) {
      assert.equal(normalizeCountry(dålig), null);
    }
  });
});

describe("isLikelyEmail", () => {
  it("släpper igenom vanliga adresser", () => {
    assert.ok(isLikelyEmail("info@fyndplats.com"));
    assert.ok(isLikelyEmail("anna.svensson+order@example.co.uk"));
  });

  it("avvisar det Google ändå skulle kasta", () => {
    for (const dålig of ["", "abc", "a@b", "a@b.", "@example.com", "a b@example.com", null]) {
      assert.equal(isLikelyEmail(dålig), false);
    }
  });

  it("avvisar trasiga domaner som det losare monstret slappte igenom", () => {
    // Granskning 2026-08-19: /^…@[^\s@.]+\.[^\s@]+$/ sa ja till alla tre.
    for (const dålig of ["a@b..c", "a@b.-", "a@b.c..", "a@b.1"]) {
      assert.equal(isLikelyEmail(dålig), false);
    }
  });

  it("slapper fortfarande igenom flerledade domaner", () => {
    assert.ok(isLikelyEmail("anna@post.example.co.uk"));
  });

  it("avvisar orimligt långa adresser", () => {
    assert.equal(isLikelyEmail(`${"a".repeat(250)}@example.com`), false);
  });
});

describe("buildGcrConfig", () => {
  const nu = new Date("2026-08-19T08:00:00Z");
  const order = { orderId: "10021", email: "kund@example.com", deliveryCountry: "SE" };

  it("bygger exakt de fält Google kräver", () => {
    assert.deepEqual(buildGcrConfig(order, nu), {
      merchant_id: MERCHANT_ID_DEFAULT,
      order_id: "10021",
      email: "kund@example.com",
      delivery_country: "SE",
      estimated_delivery_date: "2026-09-02",
      opt_in_style: "BOTTOM_RIGHT_DIALOG",
    });
  });

  it("allt-eller-inget: ett saknat fält ger ingen modul alls", () => {
    // Ett halvt anrop avvisas tyst av Google och ser ut som ett trasigt bygge.
    assert.equal(buildGcrConfig({ ...order, email: "" }, nu), null);
    assert.equal(buildGcrConfig({ ...order, deliveryCountry: "" }, nu), null);
    assert.equal(buildGcrConfig({ ...order, orderId: "" }, nu), null);
    assert.equal(buildGcrConfig(null, nu), null);
    assert.equal(buildGcrConfig(undefined, nu), null);
    assert.equal(buildGcrConfig({}, nu), null);
  });

  it("avvisar trasig e-post och trasigt land i stallet for att skicka dem", () => {
    assert.equal(buildGcrConfig({ ...order, email: "inte-en-adress" }, nu), null);
    assert.equal(buildGcrConfig({ ...order, deliveryCountry: "Sverige" }, nu), null);
  });

  it("trimmar order-id och e-post", () => {
    const cfg = buildGcrConfig({ orderId: " 10021 ", email: " k@e.com ", deliveryCountry: "se" }, nu);
    assert.equal(cfg?.order_id, "10021");
    assert.equal(cfg?.email, "k@e.com");
    assert.equal(cfg?.delivery_country, "SE");
  });

  it("ankrar leveransfonstret pa ORDERDATUMET, inte pa nar sidan renderas", () => {
    // /tack är force-dynamic. Öppnar kunden länken igen dagen efter hade "nu"
    // som ankare gett Google ett nytt, senare leveransdatum för samma order
    // (granskning 2026-08-19).
    const dagenEfter = new Date("2026-08-20T08:00:00Z");
    const cfg = buildGcrConfig({ ...order, createdDate: "2026-08-19T08:00:00Z" }, dagenEfter);
    assert.equal(cfg?.estimated_delivery_date, "2026-09-02");
  });

  it("samma order ger samma datum oavsett nar inom fonstret sidan besoks", () => {
    const med = { ...order, createdDate: "2026-08-19T08:00:00Z" };
    const a = buildGcrConfig(med, new Date("2026-08-19T09:00:00Z"));
    const b = buildGcrConfig(med, new Date("2026-08-21T07:00:00Z"));
    assert.equal(a?.estimated_delivery_date, "2026-09-02");
    assert.equal(a?.estimated_delivery_date, b?.estimated_delivery_date);
  });

  it("ett besok LANGT senare ger ingen modul alls — starkare an att ankra om", () => {
    // Farskhetsgrinden subsumerar revisit-problemet: efter 48 h bygger vi
    // ingen konfiguration, sa e-posten hamnar inte ens i sidan.
    const med = { ...order, createdDate: "2026-08-19T08:00:00Z" };
    assert.equal(buildGcrConfig(med, new Date("2026-08-26T08:00:00Z")), null);
  });
});

describe("deliveryAnchor", () => {
  const nu = new Date("2026-09-01T00:00:00Z");

  it("anvander orderdatumet nar det finns", () => {
    assert.equal(deliveryAnchor("2026-08-19T08:00:00Z", nu).toISOString().slice(0, 10), "2026-08-19");
  });

  it("faller tillbaka pa nu vid saknat eller trasigt datum", () => {
    // Hellre ett fönster från idag än ingen modul alls.
    for (const dålig of [null, undefined, "", "inte-ett-datum"]) {
      assert.equal(deliveryAnchor(dålig, nu).getTime(), nu.getTime());
    }
  });
});

describe("merchantId", () => {
  // Spara/aterstall: testerna far inte radera en env som CI eller utvecklaren
  // satt, for da ser alla senare tester default-vardet i stallet (granskning
  // 2026-08-19).
  const original = process.env.GOOGLE_MERCHANT_ID;
  after(() => {
    if (original === undefined) delete process.env.GOOGLE_MERCHANT_ID;
    else process.env.GOOGLE_MERCHANT_ID = original;
  });

  it("anvander konstanten nar env saknas", () => {
    delete process.env.GOOGLE_MERCHANT_ID;
    assert.equal(merchantId(), MERCHANT_ID_DEFAULT);
  });

  it("env vinner sa ID:t gar att byta utan deploy", () => {
    process.env.GOOGLE_MERCHANT_ID = "123456789";
    assert.equal(merchantId(), 123456789);
    delete process.env.GOOGLE_MERCHANT_ID;
  });

  it("ignorerar skrap i env i stallet for att skicka NaN till Google", () => {
    for (const dålig of ["", "  ", "abc", "0", "-5", "12.5"]) {
      process.env.GOOGLE_MERCHANT_ID = dålig;
      assert.equal(merchantId(), MERCHANT_ID_DEFAULT);
    }
    delete process.env.GOOGLE_MERCHANT_ID;
  });
});

describe("isFreshOrder", () => {
  const nu = new Date("2026-08-19T12:00:00Z");

  it("far order ar farsk", () => {
    assert.equal(isFreshOrder("2026-08-19T08:00:00Z", nu), true);
    assert.equal(isFreshOrder("2026-08-17T13:00:00Z", nu), true);
  });

  it("gammal order ar det inte — e-posten ska inte ligga kvar i sidan", () => {
    // /tack har ingen inloggning; enda skyddet ar order-GUID:t i lanken.
    // Utan tidsgrans hade adressen legat kvar for var och en som far tag i
    // lanken ur historik eller ett vidarebefordrat kvitto.
    assert.equal(isFreshOrder("2026-08-16T11:00:00Z", nu), false);
    assert.equal(isFreshOrder("2026-05-01T00:00:00Z", nu), false);
  });

  it("saknat eller trasigt datum raknas som farskt", () => {
    // Da ar det med all sannolikhet det faktiska koptillfallet.
    for (const v of [null, undefined, "", "inte-ett-datum"]) {
      assert.equal(isFreshOrder(v, nu), true);
    }
  });

  it("ett datum i framtiden raknas inte som farskt", () => {
    assert.equal(isFreshOrder("2026-09-01T00:00:00Z", nu), false);
  });

  it("buildGcrConfig slapper inte igenom en gammal order", () => {
    const gammal = {
      orderId: "10021",
      email: "kund@example.com",
      deliveryCountry: "SE",
      createdDate: "2026-01-01T00:00:00Z",
    };
    assert.equal(buildGcrConfig(gammal, nu), null);
  });
});
