import { describe, expect, it } from "vitest";
import { deriveTasks, normalizeOrderEvent, normalizeCountryCode } from "./tasks";
import { parseWebhookBody } from "./webhook";

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
