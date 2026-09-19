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

// Butikens pris. `null` = inget entydigt pris (olika variantpriser); `kastar`
// simulerar en Wix-läsning som faller.
let butikensPris: number | null = 1299;
let butikenKastar = false;
vi.mock("@/lib/wix/v3-products", () => ({
  getV3ProductPris: async () => {
    if (butikenKastar) throw new Error("Wix svarade 503");
    return { priceSek: butikensPris, variantCount: 1 };
  },
}));

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
        // ☠️ 879 med flit: det är AliExpress-tidens pris som ommappningen lämnade
        // kvar (den rör aldrig priset). Butiken tar 1 299. Fixturen ska alltså
        // ha den drift avstämningen finns för att rätta.
        grossSek: 879,
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
  butikensPris = 1299;
  butikenKastar = false;
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

  it("☠️ rör inte KOSTNADSSIDAN — landedCostSek och leverantören är orörda", async () => {
    await POST(req({ wixProductId: "p1", last: true }));
    const efter = await store.getMappingByWixProductId("p1");
    expect(efter?.variants?.[0]?.landedCostSek).toBe(900.21);
    expect(efter?.variants?.[0]?.costUsd).toBe(85.73);
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

describe("☠️ bokföringen stäms av mot butiken vid låsning", () => {
  // I den sekund låset sätts slutar synken hålla mappningen i fas med Wix, så
  // en skillnad som finns då blir PERMANENT. Kontorsstolen f13cd415 bar 879 kr
  // (AliExpress-tiden, som ommappningen lämnar orörd) medan butiken tog 1 299 —
  // lönsamhetsöversikten hade för alltid räknat 879 mot 900,21 i landad kostnad
  // och rapporterat en vara som säljs med förlust.

  it("rättar grossSek till butikens pris", async () => {
    const res = await POST(req({ wixProductId: "p1", last: true }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      bokforing: { skrivet: true, fran: 879, till: 1299 },
    });
    expect((await store.getMappingByWixProductId("p1"))?.variants?.[0]?.grossSek).toBe(1299);
  });

  it("skriver ändå inte om raden redan är i fas", async () => {
    butikensPris = 879;
    const res = await POST(req({ wixProductId: "p1", last: true }));
    const kropp = await res.json();
    expect(kropp.bokforing.skrivet).toBe(false);
    expect(kropp.bokforing.skal).toMatch(/redan i fas/);
    expect((await store.getMappingByWixProductId("p1"))?.variants?.[0]?.grossSek).toBe(879);
  });

  it("☠️ tvetydigt butikspris skriver INGENTING — gissar aldrig", async () => {
    // `tolkaProduktPris` svarar null när varianterna har olika pris. Att då
    // falla tillbaka på mappningen hade varit exakt buggen `utanWixPris` finns
    // för att undvika.
    butikensPris = null;
    const res = await POST(req({ wixProductId: "p1", last: true }));
    const kropp = await res.json();
    expect(kropp.ok).toBe(true);
    expect(kropp.bokforing.skrivet).toBe(false);
    expect(kropp.bokforing.skal).toMatch(/entydigt/);
    expect((await store.getMappingByWixProductId("p1"))?.variants?.[0]?.grossSek).toBe(879);
  });

  it("☠️ en fallen Wix-läsning stoppar inte låset — men syns i svaret", async () => {
    // Låset är den brådskande halvan; nästa synk är sex timmar bort. Men en
    // utebliven avstämning får ALDRIG se ut som en gjord — nionde gången.
    butikenKastar = true;
    const res = await POST(req({ wixProductId: "p1", last: true }));
    expect(res.status).toBe(200);
    const kropp = await res.json();
    expect(kropp.prisLast).toBe(true);
    expect(kropp.bokforing.skrivet).toBe(false);
    expect(kropp.bokforing.skal).toMatch(/gick inte att läsa.*503/);

    // Låset SITTER, och priset lämnades orört.
    const efter = await store.getMappingByWixProductId("p1");
    expect(efter?.prisLast).toBe(true);
    expect(efter?.variants?.[0]?.grossSek).toBe(879);

    // Och skälet står i audit-raden, inte bara i svaret.
    expect((await store.listAudit(10))[0].detail).toMatch(/bokföringen orörd/);
  });

  it("☠️ UPPLÅSNING läser inte butiken alls — synken äger raden igen", async () => {
    // En avstämning vid upplåsning hade varit meningslös och dessutom farlig:
    // nästa synk räknar ändå fram regelpriset och skriver båda sidor.
    await store.saveMapping(rad({ prisLast: true }));
    butikenKastar = true; // skulle kasta OM den lästes

    const res = await POST(req({ wixProductId: "p1", last: false }));
    expect(res.status).toBe(200);
    const kropp = await res.json();
    expect(kropp.bokforing.skrivet).toBe(false);
    expect(kropp.bokforing.skal).toMatch(/upplåsning/);
    expect((await store.getMappingByWixProductId("p1"))?.variants?.[0]?.grossSek).toBe(879);
  });

  it("rättar ALLA varianter — butikens pris är entydigt, alltså gäller det var och en", async () => {
    const v = rad().variants[0];
    await store.saveMapping(rad({
      variants: [v, { ...v, supplierVariantId: "sv2", wixVariantId: "wv2", sku: "FP-b" }],
    }));
    await POST(req({ wixProductId: "p1", last: true }));
    const efter = await store.getMappingByWixProductId("p1");
    expect(efter?.variants?.map((x) => x.grossSek)).toEqual([1299, 1299]);
  });

  it("bokför rättelsen i audit-raden", async () => {
    await POST(req({ wixProductId: "p1", last: true }));
    expect((await store.listAudit(10))[0].detail).toMatch(/bokföringen rättad 879 → 1299 kr mot butiken/);
  });
});
