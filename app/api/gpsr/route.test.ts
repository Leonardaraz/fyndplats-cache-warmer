// Produktsäkerhetsuppgifterna (GPSR) till butikens flik "Produktsäkerhet".

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ProductMappingRecord } from "@/lib/store";

let mappningar: Record<string, ProductMappingRecord> = {};
let kastar: Error | null = null;

vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    getMappingByWixProductId: async (id: string) => {
      if (kastar) throw kastar;
      return mappningar[id] ?? null;
    },
  }),
}));

vi.mock("@/lib/gpsr/data", () => ({
  gpsrForSku: (sku: string) =>
    sku === "350-219V00PK" ? { m: "HOMCOM", s: ["Maxbelastning: 120 kg."], h: "x" } : null,
}));

import { GET } from "./route";

const ID = "6a31ffa8-1ca8-44d1-9c8f-fef2c55c5971";
const anrop = (id: string) => GET(new NextRequest(`https://motor.test/api/gpsr?id=${id}`));

beforeEach(() => {
  mappningar = {};
  kastar = null;
});

describe("GET /api/gpsr", () => {
  it("ger märke, tillverkare och säkerhetstext för en Aosom-produkt — aldrig artikelnumret", async () => {
    mappningar[ID] = { wixProductId: ID, supplier: "aosom", supplierProductId: "aosom:350-219V00PK" } as ProductMappingRecord;
    const res = await anrop(ID);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.marke).toBe("HOMCOM");
    expect(body.ansvarig.namn).toBe("MH Handel GmbH");
    expect(body.ansvarig.epost).toBe("kontakt@aosom.de");
    expect(body.sakerhet).toEqual(["Maxbelastning: 120 kg."]);
    expect(JSON.stringify(body)).not.toContain("350-219");
  });

  it("404 för en AliExpress-produkt", async () => {
    mappningar[ID] = { wixProductId: ID, supplierProductId: "1005006000000000" } as ProductMappingRecord;
    expect((await anrop(ID)).status).toBe(404);
  });

  it("ger tillverkaren även för en Aosom-produkt som saknas i datan", async () => {
    mappningar[ID] = { wixProductId: ID, supplier: "aosom", supplierProductId: "aosom:NY-123" } as ProductMappingRecord;
    const res = await anrop(ID);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ marke: null, sakerhet: [] });
    expect(body.ansvarig.namn).toBe("MH Handel GmbH");
  });

  it("404 när produkten saknar mappning", async () => {
    expect((await anrop(ID)).status).toBe(404);
  });

  it("400 för ett id som inte är ett Wix-id", async () => {
    expect((await anrop("../../etc")).status).toBe(400);
  });

  it("502 när lagret inte svarar, i stället för att låtsas att uppgifterna saknas", async () => {
    kastar = new Error("neon nere");
    expect((await anrop(ID)).status).toBe(502);
  });
});
