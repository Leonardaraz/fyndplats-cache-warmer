// Butikens läsning av färgernas hela bildlistor.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { TabellRad } from "@/lib/aosom/fargbilder";

let rader: TabellRad[] = [];
let kastar: Error | null = null;

vi.mock("@/lib/store/fargbilder", () => ({
  getFargbildLager: () => ({
    lasForProdukt: async (pid: string) => {
      if (kastar) throw kastar;
      return rader.filter((r) => r.wixProductId === pid);
    },
  }),
}));

import { GET } from "./route";

const ID = "9304f8b8-afdd-4b6d-af65-7844247fa55a";
const anrop = (pid: string) => GET(new NextRequest(`https://motor.test/api/fargbilder?pid=${pid}`));
const rad = (o: Partial<TabellRad>): TabellRad => ({
  wixProductId: ID, choiceId: "v1", choiceName: "Beige", ordning: 0, filId: "a", plats: "galleri", givareId: null, ...o,
});

beforeEach(() => {
  rader = [];
  kastar = null;
});

describe("GET /api/fargbilder", () => {
  it("ger varje färgs hela lista och de gemensamma — aldrig det som granskas", async () => {
    rader = [
      rad({ ordning: 1, filId: "b", plats: "overflow" }),
      rad({ ordning: 0, filId: "a" }),
      rad({ ordning: 2, filId: "c", plats: "granskas" }),
      rad({ choiceId: "", choiceName: "", filId: "k", plats: "gemensam" }),
    ];
    const res = await anrop(ID);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toMatch(/s-maxage=3600/);
    expect(await res.json()).toEqual({ val: { Beige: ["a", "b"] }, gemensamma: ["k"] });
  });

  it("en sida utan rader svarar tomt, inte 404", async () => {
    const res = await anrop(ID);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ val: {}, gemensamma: [] });
  });

  it("400 på ett ogiltigt id, 502 på ett läsfel", async () => {
    expect((await anrop("inte-ett-id")).status).toBe(400);
    kastar = new Error("databasen svarade inte");
    expect((await anrop(ID)).status).toBe(502);
  });
});
