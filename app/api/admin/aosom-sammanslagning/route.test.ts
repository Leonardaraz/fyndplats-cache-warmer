// Auth- och indatagrinden på sammanslagningsrutten. Själva sammanslagningen
// testas i lib/aosom/sammanslagning.test.ts.

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

describe("aosom-sammanslagning", () => {
  it("avvisar fel hemlighet", async () => {
    const res = await POST(req({ authorization: "Bearer fel" }, {}));
    expect(res.status).toBe(401);
  });

  it("avvisar allt när CRON_SECRET saknas — aldrig fail-open", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req({ authorization: "Bearer hemlig" }, {}));
    expect(res.status).toBe(401);
  });

  it("kräver sida, utkast och givarens färg eller storlek", async () => {
    const res = await POST(req({ authorization: "Bearer hemlig" }, { behall: "a", utkast: "b", fargBehall: "Vit" }));
    expect(res.status).toBe(400);
  });

  it("☠️ vägrar den gamla kroppen med `axel` — ett storleksvärde hade blivit en färg", async () => {
    const res = await POST(req(
      { authorization: "Bearer hemlig" },
      { behall: "a", utkast: "b", fargBehall: "90 cm", fargUtkast: "110 cm", axel: "Storlek" },
    ));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/axel finns inte längre/);
  });
});
