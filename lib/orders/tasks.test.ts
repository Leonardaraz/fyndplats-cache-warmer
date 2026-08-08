import { describe, expect, it } from "vitest";
import {
  classifyWixEvent,
  deriveTasks,
  deriveProvince,
  extractCancelOrderId,
  normalizeOrderEvent,
  normalizeCountryCode,
  provinceFromSwedishPostalCode,
} from "./tasks";
import { parseWebhookBody } from "./webhook";

describe("deriveProvince — AliExpress kräver län/state", () => {
  it("mappar svenska ISO 3166-2-koder till AliExpress-läns-namn (ASCII)", () => {
    expect(deriveProvince({ subdivision: "SE-AB" })).toBe("Stockholm");
    expect(deriveProvince({ subdivision: "SE-M" })).toBe("Skane");
    expect(deriveProvince({ subdivision: "SE-O" })).toBe("Vastra Gotaland");
  });
  it("faller tillbaka på subdivisionFullname utan län-suffix", () => {
    expect(deriveProvince({ subdivisionFullname: "Stockholms län" })).toBe("Stockholms");
    expect(deriveProvince({ subdivisionFullname: "Gotland County" })).toBe("Gotland");
  });
  it("saknat allt → undefined", () => {
    expect(deriveProvince({})).toBeUndefined();
    expect(deriveProvince(undefined)).toBeUndefined();
  });
});

describe("normalizeCountryCode", () => {
  it("accepterar och versaliserar giltig ISO alpha-2", () => {
    expect(normalizeCountryCode("se")).toBe("SE");
    expect(normalizeCountryCode(" de ")).toBe("DE");
    expect(normalizeCountryCode("FR")).toBe("FR");
  });

  it("returnerar null för saknad/ogiltig kod (ingen tyst SE-default)", () => {
    expect(normalizeCountryCode(undefined)).toBeNull();
    expect(normalizeCountryCode(null)).toBeNull();
    expect(normalizeCountryCode("")).toBeNull();
    expect(normalizeCountryCode("Sverige")).toBeNull();
    expect(normalizeCountryCode("SWE")).toBeNull();
    expect(normalizeCountryCode("S")).toBeNull();
  });
});

const webhook = {
  id: "evt-123",
  entityFqdn: "wix.ecom.v1.order",
  slug: "approved",
  entityId: "order-abc",
  actionEvent: {
    body: {
      order: {
        id: "order-abc",
        number: "10002",
        lineItems: [
          {
            id: "line-1",
            productName: { original: "Red Shirt", translated: "Röd skjorta" },
            quantity: 2,
            physicalProperties: { sku: "AE-111-aaa" },
            catalogReference: { catalogItemId: "wixprod-1", options: { options: { Färg: "Röd" } } },
          },
          {
            id: "line-2",
            productName: { original: "Blue Mug" },
            quantity: 1,
            physicalProperties: { sku: "AE-222-bbb" },
            catalogReference: { catalogItemId: "wixprod-2" },
          },
        ],
        recipientInfo: {
          address: { addressLine1: "Storgatan 1", city: "Stockholm", postalCode: "11122", country: "SE" },
          contact: { firstName: "Anna", lastName: "Svensson", phone: "+46700000000" },
        },
      },
    },
  },
};

describe("normalizeOrderEvent", () => {
  it("extracts the order from actionEvent.body", () => {
    const ev = normalizeOrderEvent(webhook);
    expect(ev?.eventId).toBe("evt-123");
    expect(ev?.orderId).toBe("order-abc");
    expect(ev?.order.lineItems).toHaveLength(2);
  });

  it("returns null for malformed events", () => {
    expect(normalizeOrderEvent({ foo: "bar" })).toBeNull();
  });
});

// Order Created kommer som `createdEvent.entity` (inte actionEvent) och
// forwardas dubbel-inkapslad (data-i-data). Detta var formen som gav 422 i prod
// → noll fulfillment-tasks. Låser hela kedjan: parse → normalize → tasks.
const createdEnvelope = {
  id: "evt-created-1",
  entityFqdn: "wix.ecom.v1.order",
  slug: "created",
  entityId: "order-created",
  createdEvent: {
    entity: {
      id: "order-created",
      number: "10133",
      lineItems: [
        {
          id: "l1",
          productName: { original: "Widget" },
          quantity: 1,
          physicalProperties: { sku: "AE-9" },
          catalogReference: { catalogItemId: "wp-9" },
        },
      ],
      recipientInfo: {
        address: { addressLine1: "Vägen 2", city: "Göteborg", postalCode: "41100", country: "SE" },
        contact: { firstName: "Erik", lastName: "Ek" },
      },
    },
  },
};

describe("normalizeOrderEvent — Order Created + forwarded double-wrap (422-regression)", () => {
  it("extracts the order from createdEvent.entity", () => {
    const ev = normalizeOrderEvent(createdEnvelope);
    expect(ev?.eventId).toBe("evt-created-1");
    expect(ev?.orderId).toBe("order-created");
    expect(ev?.order.lineItems).toHaveLength(1);
  });

  it("survives a doubly-wrapped forwarded body end-to-end (parse → normalize → tasks)", () => {
    // Exakt prod-formen: forwardad created-order, data-i-data-inkapslad.
    const doublyWrapped = JSON.stringify({
      data: JSON.stringify({ data: JSON.stringify(createdEnvelope) }),
    });
    const parsed = parseWebhookBody(doublyWrapped, undefined, { trustedForwarded: true });
    expect(parsed).not.toBeNull();
    const ev = normalizeOrderEvent(parsed!);
    expect(ev?.orderId).toBe("order-created");
    const tasks = deriveTasks(ev!);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskId).toBe("order-created:l1");
    expect(tasks[0].sku).toBe("AE-9");
  });
});

// F19: refund fyrar som order_transactions.refund_completed (updatedEvent.currentEntity =
// {orderId, refund}), cancel som order.canceled (actionEvent.body.order). entityId för
// refund är TRANSAKTIONENS id — INTE orderns. Wix fyrar ALDRIG order.refunded.
const refundEvent = {
  id: "evt-refund-1",
  entityFqdn: "wix.ecom.v1.order_transactions",
  slug: "refund_completed",
  entityId: "txn-xyz", // transaktions-id, inte order-id
  updatedEvent: {
    currentEntity: { orderId: "order-abc", refund: { id: "r1", summary: { refunded: { amount: "100", currency: "SEK" } } } },
  },
};
const cancelEvent = {
  id: "evt-cancel-1",
  entityFqdn: "wix.ecom.v1.order",
  slug: "canceled",
  entityId: "order-abc",
  actionEvent: { body: { order: { id: "order-abc", number: "10002" } } },
};

describe("classifyWixEvent (F19 cancel/refund-gate)", () => {
  it("klassar refund_completed (under order_transactions) som refund", () => {
    expect(classifyWixEvent(refundEvent)).toBe("refund");
  });
  it("klassar order.canceled (ETT l) som cancel", () => {
    expect(classifyWixEvent(cancelEvent)).toBe("cancel");
  });
  it("created/approved/paid/fulfilled → other (går create-vägen)", () => {
    expect(classifyWixEvent(webhook)).toBe("other"); // slug approved
    expect(classifyWixEvent(createdEnvelope)).toBe("other"); // slug created
    expect(classifyWixEvent({ entityFqdn: "wix.ecom.v1.order", slug: "fulfilled" })).toBe("other");
    expect(classifyWixEvent({ entityFqdn: "wix.ecom.v1.order", slug: "paid" })).toBe("other");
  });
});

describe("extractCancelOrderId (F19)", () => {
  it("refund → order-id ur currentEntity.orderId, INTE entityId (transaktions-id)", () => {
    expect(extractCancelOrderId(refundEvent)).toBe("order-abc");
  });
  it("cancel → order-id ur actionEvent.body.order.id", () => {
    expect(extractCancelOrderId(cancelEvent)).toBe("order-abc");
  });
  it("tomt när inget order-id kan härledas", () => {
    expect(extractCancelOrderId({ id: "x", entityFqdn: "wix.ecom.v1.order_transactions", slug: "refund_completed" })).toBe("");
  });
});

describe("deriveTasks", () => {
  it("creates one task per line item (multi-supplier order)", () => {
    const ev = normalizeOrderEvent(webhook)!;
    const tasks = deriveTasks(ev);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].taskId).toBe("order-abc:line-1");
    expect(tasks[0].productName).toBe("Röd skjorta");
    expect(tasks[0].sku).toBe("AE-111-aaa");
    expect(tasks[0].quantity).toBe(2);
    expect(tasks[0].variantChoices).toEqual({ Färg: "Röd" });
    expect(tasks[1].taskId).toBe("order-abc:line-2");
    expect(tasks[1].wixCatalogItemId).toBe("wixprod-2");
  });

  it("attaches the shipping address to each task", () => {
    const ev = normalizeOrderEvent(webhook)!;
    const tasks = deriveTasks(ev);
    expect(tasks[0].shippingAddress).toMatchObject({
      fullName: "Anna Svensson",
      addressLine1: "Storgatan 1",
      city: "Stockholm",
      country: "SE",
      phone: "+46700000000",
    });
  });
});

// REGRESSION (order #10012): riktiga Fyndplats-ordrar lägger gatan i
// `shippingInfo.logistics.shippingDestination.address.addressLine` (singular, INTE
// addressLine1) och namnet i `contactDetails` (INTE contact), ofta med padding-
// blanksteg. Den gamla extraktorn läste addressLine1/contact → tappade gata + namn
// → tomt gatufält → F50-adressspärren blockerade AliExpress-ordern (tyst).
const realOrderEnvelope = {
  id: "evt-10012",
  entityFqdn: "wix.ecom.v1.order",
  slug: "approved",
  entityId: "order-10012",
  createdEvent: {
    entity: {
      id: "order-10012",
      number: "10012",
      lineItems: [
        {
          id: "l1",
          productName: { original: "Hundvagn" },
          quantity: 1,
          physicalProperties: { sku: "FP-hundvagn-liten-hund-bla" },
          // Riktig shape: options bär bara variantId, färgen ligger i descriptionLines.
          catalogReference: { catalogItemId: "wp-1", options: { variantId: "4930dcb9" } },
          descriptionLines: [{ name: { original: "Färg" }, color: "Blå", lineType: "COLOR" }],
        },
      ],
      shippingInfo: {
        logistics: {
          shippingDestination: {
            address: {
              country: "SE",
              subdivision: "SE-AB",
              city: "Åkersberga ",
              postalCode: "184 36 ",
              addressLine: "Norrgårdsvägen 49 ",
            },
            contactDetails: { firstName: "Ann-Sofie ", lastName: "Sjöström ", phone: "0704806968" },
          },
        },
      },
    },
  },
};

describe("extractAddress — riktig order-shape (addressLine/contactDetails, #10012-regression)", () => {
  it("läser gata från addressLine, namn från contactDetails och trimmar padding", () => {
    const ev = normalizeOrderEvent(realOrderEnvelope)!;
    const tasks = deriveTasks(ev);
    expect(tasks[0].shippingAddress).toEqual({
      fullName: "Ann-Sofie Sjöström",
      addressLine1: "Norrgårdsvägen 49",
      addressLine2: undefined,
      city: "Åkersberga",
      province: "Stockholm", // härlett från subdivision SE-AB (AliExpress kräver län)
      postalCode: "184 36",
      country: "SE",
      phone: "0704806968",
    });
  });

  it("läser variantval (färg) från descriptionLines när options bara har variantId", () => {
    const ev = normalizeOrderEvent(realOrderEnvelope)!;
    const tasks = deriveTasks(ev);
    // Utan denna extraktion blir variantChoices {} → placeOrderForTask kan inte
    // matcha rätt AliExpress-SKU (Svart vs Blå) → ordern blockeras (silent).
    expect(tasks[0].variantChoices).toEqual({ Färg: "Blå" });
  });

  it("läser gata från strukturerad streetAddress {name, number} som fallback", () => {
    const env = {
      ...realOrderEnvelope,
      createdEvent: {
        entity: {
          ...realOrderEnvelope.createdEvent.entity,
          shippingInfo: {
            logistics: {
              shippingDestination: {
                address: { country: "SE", city: "Malmö", postalCode: "21100", streetAddress: { name: "Storgatan", number: "5" } },
                contactDetails: { firstName: "Kim", lastName: "Berg" },
              },
            },
          },
        },
      },
    };
    const ev = normalizeOrderEvent(env)!;
    const tasks = deriveTasks(ev);
    expect(tasks[0].shippingAddress?.addressLine1).toBe("Storgatan 5");
    expect(tasks[0].shippingAddress?.fullName).toBe("Kim Berg");
  });
});

// Postnummer → län (order #10015, 2026-08-08: Ytterby-adress utan subdivision →
// AliExpress avvisade med "Selecciona un estado/provincia/región").
describe("provinceFromSwedishPostalCode", () => {
  it("pekar ut länet ur tvåsiffriga prefix", () => {
    expect(provinceFromSwedishPostalCode("44253")).toBe("Vastra Gotaland"); // Ytterby (#10015)
    expect(provinceFromSwedishPostalCode("111 22")).toBe("Stockholm"); // mellanslag tolereras
    expect(provinceFromSwedishPostalCode("21119")).toBe("Skane");
    expect(provinceFromSwedishPostalCode("90325")).toBe("Vasterbotten");
    expect(provinceFromSwedishPostalCode("83134")).toBe("Jamtland");
  });

  it("kända blandzoner särskiljs på tre siffror", () => {
    expect(provinceFromSwedishPostalCode("76130")).toBe("Stockholm"); // Norrtälje (7-serien)
    expect(provinceFromSwedishPostalCode("81532")).toBe("Uppsala"); // Tierp (8-serien)
    expect(provinceFromSwedishPostalCode("84131")).toBe("Vasternorrland"); // Ånge (Jämtland-prefix)
    expect(provinceFromSwedishPostalCode("66231")).toBe("Vastra Gotaland"); // Åmål (Värmland-prefix)
    expect(provinceFromSwedishPostalCode("61130")).toBe("Sodermanland"); // Nyköping (Östergötland-prefix)
    expect(provinceFromSwedishPostalCode("93331")).toBe("Norrbotten"); // Arvidsjaur (Västerbotten-prefix)
  });

  it("folktäta Halland-kommuner under Göteborgs-prefixet 43 (audit 2026-08-08)", () => {
    expect(provinceFromSwedishPostalCode("43230")).toBe("Halland"); // Varberg
    expect(provinceFromSwedishPostalCode("43432")).toBe("Halland"); // Kungsbacka
    expect(provinceFromSwedishPostalCode("43931")).toBe("Halland"); // Onsala
    expect(provinceFromSwedishPostalCode("43151")).toBe("Vastra Gotaland"); // Mölndal — kvar i VG
    expect(provinceFromSwedishPostalCode("28531")).toBe("Kronoberg"); // Markaryd (Skåne-prefix)
    expect(provinceFromSwedishPostalCode("29331")).toBe("Blekinge"); // Olofström
    expect(provinceFromSwedishPostalCode("29431")).toBe("Blekinge"); // Sölvesborg
  });

  it("undefined för icke-svenska/ogiltiga postnummer", () => {
    expect(provinceFromSwedishPostalCode(undefined)).toBeUndefined();
    expect(provinceFromSwedishPostalCode("")).toBeUndefined();
    expect(provinceFromSwedishPostalCode("1234")).toBeUndefined(); // för kort
    expect(provinceFromSwedishPostalCode("123456")).toBeUndefined(); // för långt
    expect(provinceFromSwedishPostalCode("99999")).toBeUndefined(); // okänt prefix
    expect(provinceFromSwedishPostalCode("SW1A 1AA")).toBeUndefined(); // brittiskt
  });

  it("deriveProvince faller tillbaka på postnumret när subdivision saknas (SE)", () => {
    expect(deriveProvince({ postalCode: "44253", country: "SE" } as never)).toBe("Vastra Gotaland");
    expect(deriveProvince({ postalCode: "44253" } as never)).toBe("Vastra Gotaland"); // land saknas → SE antas
    expect(deriveProvince({ postalCode: "44253", country: "DE" } as never)).toBeUndefined(); // annat land → aldrig gissa
    // subdivision vinner alltid över postnumret
    expect(deriveProvince({ subdivision: "SE-AB", postalCode: "44253" } as never)).toBe("Stockholm");
  });
});
