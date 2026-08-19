import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_DAYS,
  MERCHANT_ID,
  buildGcrConfig,
  estimatedDeliveryDate,
  isLikelyEmail,
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

  it("avvisar orimligt långa adresser", () => {
    assert.equal(isLikelyEmail(`${"a".repeat(250)}@example.com`), false);
  });
});

describe("buildGcrConfig", () => {
  const nu = new Date("2026-08-19T08:00:00Z");
  const order = { orderId: "10021", email: "kund@example.com", deliveryCountry: "SE" };

  it("bygger exakt de fält Google kräver", () => {
    assert.deepEqual(buildGcrConfig(order, nu), {
      merchant_id: MERCHANT_ID,
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

  it("merchant-id ar Fyndplats eget och ett tal", () => {
    // Google avvisar en strang har.
    assert.equal(MERCHANT_ID, 692958602);
    assert.equal(typeof MERCHANT_ID, "number");
  });
});
