import { describe, expect, it } from "vitest";
import { deriveTasks, normalizeOrderEvent } from "./tasks";

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
