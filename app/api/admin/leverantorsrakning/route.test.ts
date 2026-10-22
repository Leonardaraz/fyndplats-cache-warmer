// Räkningsrutten: auth, och att svaret bara bär antal. Mappningarna är låtsade
// och påhittade; räkningen är den riktiga.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const HEMLIGT = ["TEST-0001", "TEST-0002", "1005000000000001", "wix-hemlig"];

vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    listMappings: async () => [
      { supplier: "aosom", supplierProductId: "aosom:TEST-0001", wixProductId: "wix-hemlig", variants: [] },
      { supplierProductId: "aosom:TEST-0002", wixProductId: "wix-hemlig-2", variants: [] },
      { supplierProductId: "1005000000000001", wixProductId: "wix-hemlig-3", variants: [] },
    ],
  }),
}));

import { GET } from "./route";

const anrop = (auth?: string) =>
  new NextRequest("https://motor.example/api/admin/leverantorsrakning", {
    headers: auth ? { authorization: auth } : {},
  });

describe("GET /api/admin/leverantorsrakning", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "testhemlighet";
  });

  it("401 utan nyckel och med fel nyckel", async () => {
    expect((await GET(anrop())).status).toBe(401);
    expect((await GET(anrop("Bearer fel"))).status).toBe(401);
  });

  it("räknar per leverantör med rätt nyckel", async () => {
    const res = await GET(anrop("Bearer testhemlighet"));
    expect(res.status).toBe(200);
    const kropp = await res.json();
    expect(kropp.ok).toBe(true);
    expect(kropp.totalt).toBe(3);
    expect(kropp.perLeverantor).toEqual({ aliexpress: 1, aosom: 2, vevor: 0, okand: 0 });
    expect(kropp.utanFalt.vevorPrefix).toBe(0);
  });

  it("☠️ svaret bär inga id och inga artikelnummer", async () => {
    const text = JSON.stringify(await (await GET(anrop("Bearer testhemlighet"))).json());
    for (const h of HEMLIGT) expect(text).not.toContain(h);
  });
});
