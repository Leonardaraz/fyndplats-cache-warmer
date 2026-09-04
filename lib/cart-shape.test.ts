import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normaliseraKundvagn } from "./cart-shape.ts";

// Formen nedan ar avlast ur @wix/auto_sdk_ecom_cart-v-2:s egna typer
// (V2LineItem, ItemQuantityInfo, ItemPricingInfo, ItemSource, ItemAttributes),
// inte gissad.
const V2 = {
  cart: {
    _id: "cart-1",
    revision: "3",
    subtotal: { amount: "598.00", formattedAmount: "598,00 kr" },
    businessInfo: { currencyCode: "SEK" },
    lineItems: [
      {
        _id: "rad-1",
        name: { original: "Odlingsbord med drivbank 108 cm" },
        quantityInfo: { requestedQuantity: 3, confirmedQuantity: 2 },
        pricing: { unitPrice: { amount: "299.00" }, totalPrice: { amount: "598.00" } },
        source: { catalogReference: { catalogItemId: "prod-1", appId: "stores" } },
        attributes: { image: "wix:image://v1/abc~mv2.jpg" },
      },
    ],
  },
};

describe("normaliseraKundvagn — v2 till butikens form", () => {
  it("packar upp { cart } och behaller id och revision", () => {
    const k = normaliseraKundvagn(V2)!;
    assert.equal(k._id, "cart-1");
    assert.equal(k.revision, "3");
  });

  it("oversatter radens namn, pris, katalogreferens och bild", () => {
    const r = normaliseraKundvagn(V2)!.lineItems[0]!;
    assert.equal(r._id, "rad-1");
    assert.equal(r.productName?.original, "Odlingsbord med drivbank 108 cm");
    assert.equal(r.price?.amount, "299.00");
    assert.equal(r.catalogReference?.catalogItemId, "prod-1");
    assert.equal(r.image, "wix:image://v1/abc~mv2.jpg");
  });

  it("visar BEKRAFTAT antal, inte begart", () => {
    // Lagret kan ha kapat raden. Kunden ska se det som faktiskt saljs — annars
    // rapporterar analytics tre salda av nagot vi bara skickar tva av.
    assert.equal(normaliseraKundvagn(V2)!.lineItems[0]!.quantity, 2);
  });

  it("faller tillbaka pa begart antal nar bekraftat saknas", () => {
    const utan = { cart: { lineItems: [{ quantityInfo: { requestedQuantity: 5 } }] } };
    assert.equal(normaliseraKundvagn(utan)!.lineItems[0]!.quantity, 5);
  });

  it("laser subtotal och valuta", () => {
    const k = normaliseraKundvagn(V2)!;
    assert.equal(k.subtotal?.amount, "598.00");
    assert.equal(k.subtotal?.formattedAmount, "598,00 kr");
    assert.equal(k.currency, "SEK");
  });
});

// Den har gruppen ar hela skalet till att oversattaren finns: en kund som lade
// i kundvagnen FORE deployen och betalar EFTER den har en v1-bild i
// webblasarens lagring medan koden ar v2. Slapper vi inte igenom den formen
// tappar vi purchase-eventet, och darmed intaktsrapporteringen, for varenda
// kund som handlade under deployminuten.
describe("normaliseraKundvagn — v1 slapps igenom oforandrad", () => {
  const V1 = {
    _id: "cart-gammal",
    subtotal: { amount: "199.00", formattedAmount: "199,00 kr" },
    lineItems: [
      {
        _id: "rad-gammal",
        productName: { original: "Kettlebell 10 kg" },
        quantity: 1,
        price: { amount: "199.00" },
        catalogReference: { catalogItemId: "prod-gammal" },
        image: "wix:image://v1/xyz~mv2.jpg",
      },
    ],
  };

  it("ror inte en v1-rad", () => {
    const r = normaliseraKundvagn(V1)!.lineItems[0]!;
    assert.equal(r.productName?.original, "Kettlebell 10 kg");
    assert.equal(r.quantity, 1);
    assert.equal(r.price?.amount, "199.00");
    assert.equal(r.catalogReference?.catalogItemId, "prod-gammal");
  });

  it("laser v1:s priceSummary.subtotal ocksa", () => {
    const gammal = { lineItems: [], priceSummary: { subtotal: { amount: "50.00" } } };
    assert.equal(normaliseraKundvagn(gammal)!.subtotal?.amount, "50.00");
  });

  it("ar idempotent — normalisera tva ganger ger samma sak", () => {
    const en = normaliseraKundvagn(V2)!;
    const tva = normaliseraKundvagn(en)!;
    assert.deepEqual(tva.lineItems, en.lineItems);
  });
});

describe("normaliseraKundvagn — skrap far aldrig kasta", () => {
  it("null och undefined ger null", () => {
    assert.equal(normaliseraKundvagn(null), null);
    assert.equal(normaliseraKundvagn(undefined), null);
    assert.equal(normaliseraKundvagn("inte en vagn"), null);
    assert.equal(normaliseraKundvagn(42), null);
  });

  it("tom vagn ger en tom lista, inte ett kast", () => {
    assert.deepEqual(normaliseraKundvagn({ cart: {} })!.lineItems, []);
    assert.deepEqual(normaliseraKundvagn({ cart: { lineItems: null } })!.lineItems, []);
  });

  it("radskrap ger en tom rad i stallet for ett kast", () => {
    const k = normaliseraKundvagn({ cart: { lineItems: [null, 5, "x", {}] } })!;
    assert.equal(k.lineItems.length, 4);
    for (const r of k.lineItems) assert.equal(typeof r, "object");
  });

  it("saknade delobjekt ger utelamnade falt, inte undefined-krascher", () => {
    const r = normaliseraKundvagn({ cart: { lineItems: [{ _id: "x" }] } })!.lineItems[0]!;
    assert.equal(r._id, "x");
    assert.equal(r.quantity, undefined);
    assert.equal(r.price, undefined);
  });
});
