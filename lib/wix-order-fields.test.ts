import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  firstStr,
  orderCountry,
  orderCreatedDate,
  orderEmail,
  orderNumber,
  orderRader,
  orderSumma,
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

  it("hittar landet aven nar recipientInfo finns men saknar adress", () => {
    // Granskning 2026-08-19 (andra vandan): forsta versionen valde CONTAINER
    // forst — recipientInfo ?? recipient ?? shippingInfo — och letade adress
    // bara dar. En gastorder med kontaktuppgifter pa recipientInfo men adressen
    // under shippingInfo gav darfor undefined, trots att landet lag i svaret.
    // Samma tysta nollresultat som buggen filen skapades for.
    const order = {
      recipientInfo: { contactDetails: { firstName: "Anna" } },
      shippingInfo: { shippingDestination: { address: { country: "SE" } } },
    };
    assert.equal(orderCountry(order), "SE");
  });

  it("hittar landet nar recipientInfo bar en TOM adress", () => {
    const order = {
      recipientInfo: { address: {} },
      shippingInfo: { shippingDestination: { address: { country: "FI" } } },
    };
    assert.equal(orderCountry(order), "FI");
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

  it("slapper igenom tal men hoppar over objekt", () => {
    // Kodbasens tre aldre kopior kor String(v) pa vad som helst, sa ett objekt
    // blir den icke-tomma strangen "[object Object]" — via orderNumber hade
    // kunden fatt se "#[object Object]" pa bekraftelsen.
    assert.equal(firstStr(10021), "10021");
    assert.equal(firstStr({}, [], "riktig"), "riktig");
    assert.equal(firstStr({ a: 1 }), undefined);
  });
});

// Formen nedan är en riktig ecom-order (2026-10-09), avskalad: butiken lägger
// priserna inklusive moms, men `priceSummary.subtotal` och `.shipping` står
// exklusive. Tacksidan ska visa vad kunden betalade.
const skarpOrder = {
  lineItems: [
    {
      productName: { original: "Smalt badrumsskåp 20 cm", translated: "Smalt badrumsskåp 20 cm" },
      quantity: 1,
      descriptionLines: [{ name: { original: "Färg", translated: "Färg" }, plainText: { original: "Svart", translated: "Svart" } }],
      image: { url: "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg" },
      price: { amount: "769.00" },
      totalPriceBeforeTax: { amount: "615.20" },
      totalPriceAfterTax: { amount: "769.00" },
    },
  ],
  priceSummary: {
    subtotal: { amount: "615.20" },
    shipping: { amount: "15.20" },
    tax: { amount: "157.60" },
    total: { amount: "788.00" },
  },
  shippingInfo: { cost: { price: { amount: "19.00" }, totalPriceBeforeTax: { amount: "15.20" }, totalPriceAfterTax: { amount: "19.00" } } },
};

describe("orderRader", () => {
  it("tar radens summa inklusive moms, aldrig delsumman exklusive", () => {
    const rader = orderRader(skarpOrder);
    assert.equal(rader.length, 1);
    assert.equal(rader[0].namn, "Smalt badrumsskåp 20 cm");
    assert.equal(rader[0].variant, "Färg: Svart");
    assert.equal(rader[0].antal, 1);
    assert.equal(rader[0].belopp, 769);
    assert.match(rader[0].bild ?? "", /^https:\/\/static\.wixstatic\.com\/media\/b379ce_abc~mv2\.jpg/);
  });

  it("flera val på en rad, och en rad utan namn eller pris faller inte", () => {
    const rader = orderRader({
      lineItems: [
        {
          productName: { original: "Fåtölj" },
          quantity: 2,
          descriptionLines: [
            { name: { original: "Färg" }, plainText: { original: "Grå" } },
            { name: { original: "Storlek" }, plainText: { original: "L" } },
          ],
        },
        {},
      ],
    });
    assert.equal(rader[0].variant, "Färg: Grå · Storlek: L");
    assert.equal(rader[0].antal, 2);
    assert.equal(rader[0].belopp, undefined);
    assert.equal(rader[1].namn, "Produkt");
    assert.equal(rader[1].antal, 1);
  });

  it("ett objekt blir aldrig \"[object Object]\" i namnet", () => {
    const rader = orderRader({ lineItems: [{ productName: { annat: "x" }, name: "Reserv" }] });
    assert.equal(rader[0].namn, "Reserv");
  });

  it("utan rader blir listan tom", () => {
    assert.deepEqual(orderRader({}), []);
    assert.deepEqual(orderRader(undefined), []);
  });
});

describe("orderSumma", () => {
  it("frakten tas inklusive moms ur shippingInfo.cost, inte ur priceSummary", () => {
    assert.deepEqual(orderSumma(skarpOrder), { frakt: 19, totalt: 788, moms: 157.6 });
  });

  it("fri frakt är 0, inte saknad", () => {
    const fri = { ...skarpOrder, shippingInfo: { cost: { price: { amount: "0.00" }, totalPriceAfterTax: { amount: "0.00" } } } };
    assert.equal(orderSumma(fri).frakt, 0);
  });

  it("saknade belopp blir undefined, aldrig 0", () => {
    assert.deepEqual(orderSumma({}), { frakt: undefined, totalt: undefined, moms: undefined });
  });
});
