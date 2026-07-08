import { beforeEach, describe, expect, it, vi } from "vitest";

// Routen är nu en tunn wrapper runt den delade placeOrderForTask. Verifierar att den
// (a) härleder från taskId (inte body), (b) mappar utfall till rätt 4xx — aldrig 5xx.
vi.mock("@/lib/auth", () => ({ checkToken: () => null }));
vi.mock("@/lib/store/factory", () => ({ getStore: () => ({}) }));
vi.mock("@/lib/orders/place-order", () => ({ placeOrderForTask: vi.fn() }));

import { placeOrderForTask } from "@/lib/orders/place-order";
import { POST } from "./route";

function makeReq(body: unknown) {
  return new Request("http://localhost/api/aliexpress/order", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("/api/aliexpress/order — delad orderläggning + felmappning", () => {
  beforeEach(() => vi.mocked(placeOrderForTask).mockReset());

  it("saknar taskId → 400, anropar inte placeOrderForTask", async () => {
    const res = await POST(makeReq({ productId: "P", skuId: "S" }));
    expect(res.status).toBe(400);
    expect(vi.mocked(placeOrderForTask)).not.toHaveBeenCalled();
  });

  it("ok → 200 med tradeOrderId (härleder från taskId)", async () => {
    vi.mocked(placeOrderForTask).mockResolvedValue({ ok: true, tradeOrderId: "T1" });
    const res = await POST(makeReq({ taskId: "o1:l1", productId: "IGNORERAS" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ tradeOrderId: "T1" });
    expect(vi.mocked(placeOrderForTask)).toHaveBeenCalledWith(expect.anything(), "o1:l1");
  });

  it("redan lagd → 409", async () => {
    vi.mocked(placeOrderForTask).mockResolvedValue({ ok: false, error: "Ordern är redan lagd hos AliExpress" });
    expect((await POST(makeReq({ taskId: "x" }))).status).toBe(409);
  });

  it("osäkert utfall → 422 (ingen retry)", async () => {
    vi.mocked(placeOrderForTask).mockResolvedValue({ ok: false, error: "Order-utfall osäkert — verifiera manuellt på AliExpress" });
    expect((await POST(makeReq({ taskId: "x" }))).status).toBe(422);
  });

  it("hittades inte → 404", async () => {
    vi.mocked(placeOrderForTask).mockResolvedValue({ ok: false, error: "Task hittades inte" });
    expect((await POST(makeReq({ taskId: "x" }))).status).toBe(404);
  });
});
