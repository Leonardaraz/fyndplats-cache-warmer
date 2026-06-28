import { beforeEach, describe, expect, it, vi } from "vitest";

// Verifierar felmappningen: valideringsfel (OrderValidationError) → 422 (klientfel,
// ingen retry), allt annat → 500. Tidigare blev allt 500 → order-kö:n kunde retry:a
// ett permanent fel i evighet. Klienten/auth/store mockas; bara route-grenen testas.
vi.mock("@/lib/auth", () => ({ checkToken: () => null }));
vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({ updateTask: vi.fn(), appendAudit: vi.fn() }),
}));
vi.mock("@/lib/aliexpress/client", () => {
  class OrderValidationError extends Error {}
  return { OrderValidationError, createOrder: vi.fn() };
});

import { createOrder, OrderValidationError } from "@/lib/aliexpress/client";
import { POST } from "./route";

const validBody = {
  productId: "P",
  skuId: "S",
  quantity: 1,
  shippingAddress: { name: "A", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", countryCode: "SE" },
};

function makeReq(body: unknown) {
  return new Request("http://localhost/api/aliexpress/order", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("/api/aliexpress/order — felmappning", () => {
  beforeEach(() => {
    vi.mocked(createOrder).mockReset();
  });

  it("OrderValidationError → 422 (ingen retry)", async () => {
    vi.mocked(createOrder).mockRejectedValue(new OrderValidationError("ofullständig adress"));
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(422);
  });

  it("annat fel → 500", async () => {
    vi.mocked(createOrder).mockRejectedValue(new Error("nätverksfel"));
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);
  });
});
