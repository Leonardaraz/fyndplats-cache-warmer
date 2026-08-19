import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  firstStr,
  orderCountry,
  orderCreatedDate,
  orderEmail,
  orderNumber,
} from "./wix-order-fields.ts";

// Granskning 2026-08-19: /tack läste landet på
// `shippingInfo.shippingDestination.address.country` — CHECKOUT-payloadens
// form. En riktig ecom-ORDER lägger adressen på `recipientInfo.address`.
// Följden hade varit land = null → ingen Google-modul → noll enkäter, alltså
// exakt den bugg integrationen skulle rätta, tyst återskapad. Testerna nedan
// låser båda formerna.

describe("orderCountry", () => {
  it("läser ecom-orderns recipientInfo.address — formen som faktiskt kommer", () => {
    const order = {
      recipientInfo: {
        address: { addressLine: "Storgatan 1", city: "Malmö", postalCode: "21122", country: "SE" },
      },
    };
    assert.equal(orderCountry(order), "SE");
  });

  it("klarar ocksa checkout-formen shippingInfo.shippingDestination.address", () => {
    const payload = { shippingInfo: { shippingDestination: { address: { country: "NO" } } } };
    assert.equal(orderCountry(payload), "NO");
  });

  it("klarar logistics-varianten", () => {
    const order = {
      shippingInfo: { logistics: { shippingDestination: { address: { country: "DK" } } } },
    };
    assert.equal(orderCountry(order), "DK");
  });

  it("recipientInfo vinner over shippingInfo nar bada finns", () => {
    const order = {
      recipientInfo: { address: { country: "SE" } },
      shippingInfo: { shippingDestination: { address: { country: "NO" } } },
    };
    assert.equal(orderCountry(order), "SE");
  });

  it("undefined nar landet saknas — aldrig en gissning", () => {
    // Resten av kodbasen faller tillbaka på "SE". Här vore det fel: Googles
    // tröskel räknas per land och slås aldrig ihop.
    assert.equal(orderCountry({}), undefined);
    assert.equal(orderCountry(undefined), undefined);
    assert.equal(orderCountry({ recipientInfo: { address: {} } }), undefined);
  });
});

describe("orderEmail", () => {
  it("tar buyerInfo.email nar den finns", () => {
    assert.equal(orderEmail({ buyerInfo: { email: "a@example.com" } }), "a@example.com");
  });

  it("faller ut over alla fem vagar webhooken redan anvander", () => {
    // Fan-outen finns för att buyerInfo.email visade sig otillräcklig i
    // produktion — gästköp och nyare ecom-versioner lägger den annorlunda.
    assert.equal(
      orderEmail({ buyerInfo: { contactDetails: { email: "b@example.com" } } }),
      "b@example.com",
    );
    assert.equal(
      orderEmail({ billingInfo: { contactDetails: { email: "c@example.com" } } }),
      "c@example.com",
    );
    assert.equal(
      orderEmail({ recipientInfo: { contactDetails: { email: "d@example.com" } } }),
      "d@example.com",
    );
    assert.equal(orderEmail({ buyerEmail: "e@example.com" }), "e@example.com");
  });

  it("prioriterar buyerInfo.email over de senare vagarna", () => {
    const order = {
      buyerInfo: { email: "primar@example.com" },
      billingInfo: { contactDetails: { email: "sekundar@example.com" } },
    };
    assert.equal(orderEmail(order), "primar@example.com");
  });

  it("hoppar over tomma strangar i stallet for att returnera dem", () => {
    const order = { buyerInfo: { email: "   " }, buyerEmail: "riktig@example.com" };
    assert.equal(orderEmail(order), "riktig@example.com");
  });

  it("undefined nar ingen adress finns", () => {
    assert.equal(orderEmail({}), undefined);
    assert.equal(orderEmail(undefined), undefined);
  });
});

describe("orderCreatedDate", () => {
  it("tar createdDate, _createdDate eller dateCreated", () => {
    assert.equal(orderCreatedDate({ createdDate: "2026-08-19T08:00:00Z" }), "2026-08-19T08:00:00Z");
    assert.equal(orderCreatedDate({ _createdDate: "2026-08-18T08:00:00Z" }), "2026-08-18T08:00:00Z");
    assert.equal(orderCreatedDate({ dateCreated: "2026-08-17T08:00:00Z" }), "2026-08-17T08:00:00Z");
  });

  it("undefined nar inget datum finns", () => {
    assert.equal(orderCreatedDate({}), undefined);
  });
});

describe("orderNumber", () => {
  it("plockar det lasbara numret och tal att det ar ett tal", () => {
    assert.equal(orderNumber({ number: "10021" }), "10021");
    assert.equal(orderNumber({ number: 10021 }), "10021");
  });

  it("undefined nar numret saknas eller ar tomt", () => {
    assert.equal(orderNumber({}), undefined);
    assert.equal(orderNumber({ number: "" }), undefined);
  });
});

describe("firstStr", () => {
  it("tar forsta icke-tomma strangen och trimmar", () => {
    assert.equal(firstStr(null, undefined, "  ", " x "), "x");
    assert.equal(firstStr(), undefined);
  });
});
