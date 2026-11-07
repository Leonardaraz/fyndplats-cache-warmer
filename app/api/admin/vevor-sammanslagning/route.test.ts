// Auth- och indatagrinden på VEVOR-sammanslagningens rutt. Själva
// sammanslagningen testas i lib/vevor/sammanslagning.test.ts.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ isAuthorized: () => false }));
vi.mock("@/lib/store/factory", () => ({ getStore: () => ({}) }));

import { POST } from "./route";

function req(headers: Record<string, string>, body: unknown) {
  return {
    headers: new Headers(headers),
    json: async () => body,
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  process.env.CRON_SECRET = "hemlig";
});

describe("vevor-sammanslagning", () => {
  it("avvisar fel hemlighet", async () => {
    const res = await POST(req({ authorization: "Bearer fel" }, {}));
    expect(res.status).toBe(401);
  });

  it("avvisar allt när CRON_SECRET saknas — aldrig fail-open", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req({ authorization: "Bearer hemlig" }, {}));
    expect(res.status).toBe(401);
  });

  it("kräver sida, utkast och givarens värde på minst en axel", async () => {
    for (const body of [
      { behall: "a", utkast: "b" },
      { behall: "a", utkast: "b", varden: {} },
      { behall: "a", utkast: "b", varden: { Storlek: "" } },
      { behall: "a", utkast: "b", varden: ["Storlek"] },
      { utkast: "b", varden: { Storlek: "120 cm" } },
    ]) {
      const res = await POST(req({ authorization: "Bearer hemlig" }, body));
      expect(res.status).toBe(400);
    }
  });
});
