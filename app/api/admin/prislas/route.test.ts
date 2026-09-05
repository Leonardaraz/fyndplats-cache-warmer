// Prislåset: den enda vägen att säga åt Aosom-synken att låta ett pris vara.
//
// Testerna låser de fyra farliga riktningarna, alla i samma familj som husets
// dyraste buggar: ett utelämnat fält som tyst betyder något (GitHubs
// default-substitution publicerade utkast i tolv timmar), en skrivning som
// skapar en rad ingenting läser (poleringens save mot en tömd kollektion),
// och ett svar utan fel som inte är ett kvitto (nionde gången).

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { ProductMappingRecord } from "@/lib/store";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));

let auktoriserad = true;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));

import { POST } from "./route";

function rad(över: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: "p1",
    supplierProductId: "aosom:921-672V00BG",
    supplier: "aosom",
    variants: [
      {
        supplierVariantId: "sv1",
        sku: "FP-kontorsstol-mesh-beige",
        wixVariantId: "wv1",
        choices: {},
        costUsd: 85.73,
        landedCostSek: 900.21,
        grossSek: 1299,
      },
    ],
    ...över,
  } as ProductMappingRecord;
}

function req(kropp: unknown) {
  return { json: async () => kropp, headers: new Headers() } as unknown as Parameters<typeof POST>[0];
}

beforeEach(async () => {
  store = new MemoryStore();
  auktoriserad = true;
  await store.saveMapping(rad());
});

describe("POST /api/admin/prislas", () => {
  it("låser priset och läser tillbaka det", async () => {
    const res = await POST(req({ wixProductId: "p1", last: true }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, prisLast: true, tidigare: false });

    const efter = await store.getMappingByWixProductId("p1");
    expect(efter?.prisLast).toBe(true);
  });

  it("låser upp igen", async () => {
    await store.saveMapping(rad({ prisLast: true }));
    const res = await POST(req({ wixProductId: "p1", last: false }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, prisLast: false, tidigare: true });
    expect((await store.getMappingByWixProductId("p1"))?.prisLast).toBe(false);
  });

  it("☠️ rör inga andra fält — priset och kostnaden är oförändrade", async () => {
    await POST(req({ wixProductId: "p1", last: true }));
    const efter = await store.getMappingByWixProductId("p1");
    expect(efter?.variants?.[0]?.grossSek).toBe(1299);
    expect(efter?.variants?.[0]?.landedCostSek).toBe(900.21);
    expect(efter?.supplierProductId).toBe("aosom:921-672V00BG");
  });

  it("☠️ utelämnat `last` avvisas — ingen default", async () => {
    // Samma fälla som GitHubs tomma workflow-input: ett fält som saknas ska
    // inte tyst betyda "lås upp". Det låset finns just för att någon medvetet
    // sagt att priset ska stå still.
    const res = await POST(req({ wixProductId: "p1" }));
    expect(res.status).toBe(400);
    expect((await store.getMappingByWixProductId("p1"))?.prisLast).toBeUndefined();
  });

  it("☠️ `last` som sträng avvisas — \"false\" är sant i JavaScript", async () => {
    const res = await POST(req({ wixProductId: "p1", last: "false" }));
    expect(res.status).toBe(400);
    expect((await store.getMappingByWixProductId("p1"))?.prisLast).toBeUndefined();
  });

  it("wixProductId krävs", async () => {
    const res = await POST(req({ last: true }));
    expect(res.status).toBe(400);
  });

  it("☠️ SKAPAR ALDRIG en rad — saknad mappning ger 404", async () => {
    // En save mot en tömd kollektion SKAPAR en ny rad som ingenting läser.
    // Exakt så tappades poleringens stämplingar i steg 6 av migreringen.
    const res = await POST(req({ wixProductId: "finns-inte", last: true }));
    expect(res.status).toBe(404);
    expect(await store.getMappingByWixProductId("finns-inte")).toBeNull();
    expect(await store.listAudit(10)).toHaveLength(0);
  });

  it("☠️ en tyst no-op-skrivning fälls av återläsningen", async () => {
    // `saveMapping` är en tyst no-op på en saknad rad i alla tre backends, och
    // rutten svarar 200 utan att någonting hänt. Nionde gången samma lärdom:
    // ett svar utan fel är inget kvitto.
    vi.spyOn(store, "saveMapping").mockResolvedValue(undefined);

    const res = await POST(req({ wixProductId: "p1", last: true }));
    expect(res.status).toBe(500);
    const kropp = await res.json();
    expect(kropp.ok).toBe(false);
    expect(kropp.error).toMatch(/återläsning/);
    // Ingen audit-rad — en skrivning som inte gick igenom får inte bokföras.
    expect(await store.listAudit(10)).toHaveLength(0);
  });

  it("bokför en audit-rad med före- och eftervärdet", async () => {
    await POST(req({ wixProductId: "p1", last: true }));
    const rader = await store.listAudit(10);
    expect(rader).toHaveLength(1);
    expect(rader[0].kind).toBe("prislas");
    expect(rader[0].ref).toBe("p1");
    expect(rader[0].detail).toContain("false → true");
  });

  it("utan behörighet: 401 och ingen skrivning", async () => {
    auktoriserad = false;
    const res = await POST(req({ wixProductId: "p1", last: true }));
    expect(res.status).toBe(401);
    expect((await store.getMappingByWixProductId("p1"))?.prisLast).toBeUndefined();
  });
});
