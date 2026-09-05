import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normaliseraKundvagn } from "./cart-shape.ts";

// Formen nedan ar KOPIERAD UR ETT SKARPT SVAR fran Wix Cart v2 (butikens egen
// katalog, 2026-09-04), inte gissad ur typerna. Det spelade roll: typerna sager
// `image?: string`, men API:et svarar med ett OBJEKT, och v2:s pengar saknar
// helt `formattedAmount`. Bada hade gett tysta fel i kundvagnen.
const V2 = {
  cart: {
    _id: "cart-1",
    revision: "3",
    // v2 skickar INGEN formattedAmount — det ar hela poangen med testerna nedan.
    subtotal: { amount: "598.00", convertedAmount: "598.00" },
    businessInfo: { languageCode: "sv", currencyCode: "SEK" },
    customerInfo: { languageCode: "sv", currencyCode: "SEK" },
    lineItems: [
      {
        _id: "rad-1",
        name: { original: "Odlingsbord med drivbank 108 cm" },
        quantityInfo: { requestedQuantity: 3, confirmedQuantity: 2 },
        pricing: {
          unitPrice: { amount: "299.00", convertedAmount: "299.00" },
          totalPrice: { amount: "598.00", convertedAmount: "598.00" },
        },
        source: { catalogReference: { catalogItemId: "prod-1", appId: "stores" } },
        // Skarpa API:et svarar med ett objekt har, inte en strang.
        attributes: {
          image: {
            id: "b379ce_abc~mv2.jpg",
            url: "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg",
            height: 2000,
            width: 2000,
            altText: "En bild",
          },
          physicalProperties: { sku: "FP-1", shippable: true },
        },
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
    // Bilden ska ga igenom ORORD: luckans liImageUrl() plockar .url sjalv.
    assert.equal((r.image as { url?: string })?.url, "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg");
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
    assert.equal(k.currency, "SEK");
  });
});

// De har tva gruppperna finns for att bada felen fanns pa riktigt i forsta
// versionen av oversattaren, och varken bygget, tsc eller de ovriga testerna
// sag dem. De hittades genom att anropa skarpa API:et.
describe("normaliseraKundvagn — fel som bara skarpa API:et avslojade", () => {
  it("BILDEN: ett objekt far inte tappas bort", () => {
    // Forsta versionen kravde en strang. Resultatet hade blivit att VARENDA
    // miniatyr forsvann ur kundvagnen, tyst.
    const r = normaliseraKundvagn(V2)!.lineItems[0]!;
    assert.notEqual(r.image, undefined);
    assert.equal(typeof r.image, "object");
  });

  it("BILDEN: en strang funkar fortfarande", () => {
    const medStrang = { cart: { lineItems: [{ attributes: { image: "wix:image://v1/x~mv2.jpg" } }] } };
    assert.equal(normaliseraKundvagn(medStrang)!.lineItems[0]!.image, "wix:image://v1/x~mv2.jpg");
  });

  it("SUMMAN: formateras sjalv eftersom v2 inte skickar nagon", () => {
    // Luckan skriver ut subtotal.formattedAmount. Utan det har blir raden tom.
    assert.equal(normaliseraKundvagn(V2)!.subtotal?.formattedAmount, "598 kr");
  });

  it("RADPRISET: formateras ocksa", () => {
    assert.equal(normaliseraKundvagn(V2)!.lineItems[0]!.price?.formattedAmount, "299 kr");
  });

  it("formatet ar sajtens eget, utan decimaler", () => {
    const stor = { cart: { subtotal: { amount: "2049" }, businessInfo: { currencyCode: "SEK" }, lineItems: [] } };
    assert.equal(normaliseraKundvagn(stor)!.subtotal?.formattedAmount, "2 049 kr");
  });
});

describe("normaliseraKundvagn — flera valutor", () => {
  const EUR = {
    cart: {
      subtotal: { amount: "598.00", convertedAmount: "52.00" },
      businessInfo: { currencyCode: "SEK" },
      customerInfo: { currencyCode: "EUR" },
      lineItems: [{
        name: { original: "Hoodie" },
        quantityInfo: { confirmedQuantity: 1 },
        pricing: { unitPrice: { amount: "598.00", convertedAmount: "52.00" } },
      }],
    },
  };

  it("visar kundens valuta", () => {
    const k = normaliseraKundvagn(EUR)!;
    assert.equal(k.currency, "EUR");
    assert.equal(k.subtotal?.formattedAmount, "52 €");
    assert.equal(k.lineItems[0]!.price?.formattedAmount, "52 €");
  });

  it("men RAPPORTERAR butikens valuta — annars blir GA4 fel", () => {
    // lib/analytics.ts laser price.amount. Skulle det bara euro-beloppet
    // rapporterades 52 som om det vore 52 kronor.
    assert.equal(normaliseraKundvagn(EUR)!.lineItems[0]!.price?.amount, "598.00");
  });

  it("okand valutakod kastar inte", () => {
    const skum = { cart: { subtotal: { amount: "100" }, customerInfo: { currencyCode: "XYZQ" }, lineItems: [] } };
    assert.equal(normaliseraKundvagn(skum)!.subtotal?.formattedAmount, "100");
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
