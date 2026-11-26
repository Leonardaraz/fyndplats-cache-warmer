// Rutten för VEVOR-synken: vad som går ut i svaret.
//
// ☠️ Svaret skrivs ut i en publik Actions-logg. Motorns fel och varningar bär
// artikelnumret, och markören är ett artikelnummer. Artikelnumren här är
// påhittade och byggs vid körning.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { AosomSyncSummary } from "@/lib/aosom/sync";

const SKU = ["TESTSKU", "RUTT", "000001"].join("");
const korMock = vi.fn();
const auditMock = vi.fn(async (..._a: unknown[]) => {});

vi.mock("@/lib/auth", () => ({ isAuthorized: () => false }));
vi.mock("@/lib/audit", () => ({ audit: (...a: unknown[]) => auditMock(...a) }));
vi.mock("@/lib/vevor/synk", async () => {
  const riktig = await vi.importActual<typeof import("@/lib/vevor/synk")>("@/lib/vevor/synk");
  return {
    ...riktig,
    korVevorSynk: (...a: unknown[]) => korMock(...a),
    liveSynkKorDeps: async () => ({}),
  };
});

import { POST } from "./route";

function req(fraga: string) {
  return {
    headers: new Headers({ authorization: "Bearer hemlig" }),
    nextUrl: new URL(`https://exempel.test/api/cron/vevor-synk?${fraga}`),
  } as unknown as NextRequest;
}

function summary(over: Partial<AosomSyncSummary> = {}): AosomSyncSummary {
  return {
    dryRun: true, feedRader: 3, granskade: 3, lagerUppdaterade: 1, prisUppdaterade: 0, prisUppskjutna: 0, urFeeden: 0,
    slutsalda: 0, ejSkeppbara: 0, okantBesked: 1, okantBeskedProdukter: ["wix-3"], leverantorOense: 0,
    prisVantar: 1, oforandrade: 1, utanWixPris: 0, prisLasta: 0, iAuktion: 0, iAuktionProdukter: [],
    konkurrentMal: 0, konkurrentTak: 0, konkurrentGolv: 0, konkurrentFrysta: 0, prislistaFel: null,
    utanLagerrader: 0, lagerDrift: 0, lagerDriftRattade: 0, lagerDriftProdukter: [], stampelHoppade: 0,
    saldaAvdragna: 0, saldaAvdragnaProdukter: [], flerartikelrader: 0, okandaVarianter: 0, tvetydiga: 0,
    aterILager: 0, restockMejl: 0, restockEjSkickade: 0, restockUtskick: [], restockFel: null,
    misslyckade: 1, kvar: 7, cursor: SKU, stoppedBy: "limit",
    errors: [{ sku: SKU, wixProductId: "wix-1", error: "ett fel" }],
    varningar: [{ sku: SKU, wixProductId: "wix-2", fran: 100, till: 300, andringPct: 200 }],
    godkandaHopp: [],
    storaHopp: [],
    ...over,
  };
}

beforeEach(() => {
  process.env.CRON_SECRET = "hemlig";
  korMock.mockReset();
  auditMock.mockClear();
});

describe("/api/cron/vevor-synk", () => {
  it("☠️ svaret bär inget artikelnummer, och markören går ut förseglad", async () => {
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary(), markor: null, markorFel: null });
    const svar = await POST(req("manuell=1"));
    const text = await svar.text();
    expect(text).not.toContain(SKU);
    const json = JSON.parse(text);
    expect(json.ok).toBe(true);
    expect(json.cursor).toMatch(/^m1\./);
    expect(json.errors).toEqual([{ wixProductId: "wix-1", error: "ett fel" }]);
    expect(json.varningar[0]).toEqual({ wixProductId: "wix-2", fran: 100, till: 300, andringPct: 200 });
  });

  it("för hand är torrläge standard, och dryRun=false är skarpt", async () => {
    korMock.mockResolvedValue({ utfall: "klar", summary: summary(), markor: null, markorFel: null });
    await POST(req("manuell=1"));
    await POST(req("manuell=1&dryRun=false&limit=5"));
    expect(korMock.mock.calls[0][1]).toMatchObject({ manuell: true, dryRun: true, limit: 1200 });
    expect(korMock.mock.calls[1][1]).toMatchObject({ manuell: true, dryRun: false, limit: 5 });
  });

  it("schemat är alltid skarpt, och tar ingen markör ur frågan", async () => {
    korMock.mockResolvedValue({ utfall: "avstangd", summary: null, markor: null, markorFel: null });
    const svar = await POST(req("dryRun=true&after=x"));
    expect(korMock.mock.calls[0][1]).toMatchObject({ manuell: false, dryRun: false, after: undefined });
    expect(await svar.json()).toEqual({ ok: true, utfall: "avstangd" });
  });

  it("☠️ en markör för hand som inte går att öppna är 400, aldrig början", async () => {
    const svar = await POST(req("manuell=1&after=m1.trasig"));
    expect(svar.status).toBe(400);
    expect(korMock).not.toHaveBeenCalled();
  });

  it("en förseglad markör ur förra svaret öppnas till artikelnumret", async () => {
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary(), markor: null, markorFel: null });
    const forsta = await (await POST(req("manuell=1"))).json();
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary({ cursor: null }), markor: null, markorFel: null });
    await POST(req(`manuell=1&after=${encodeURIComponent(forsta.cursor)}`));
    expect(korMock.mock.calls[1][1].after).toBe(SKU);
  });

  const ID1 = "a3d627ec-b3d9-4b82-adef-000000000001";
  const ID2 = "ca96b824-550b-4d30-99ef-000000000002";

  it("godkannPris går vidare till körningen för hand, som en mängd Wix-id", async () => {
    korMock.mockResolvedValue({ utfall: "klar", summary: summary(), markor: null, markorFel: null });
    await POST(req(`manuell=1&dryRun=false&godkannPris=${ID1},%20${ID2}`));
    const val = korMock.mock.calls[0][1];
    expect([...val.godkannPrisandring]).toEqual([ID1, ID2]);
    await POST(req("manuell=1"));
    expect(korMock.mock.calls[1][1].godkannPrisandring).toBeUndefined();
  });

  it("☠️ ett id som inte är ett Wix-id vägras, och ingenting körs", async () => {
    const svar = await POST(req(`manuell=1&godkannPris=${ID1},inte-ett-id`));
    expect(svar.status).toBe(400);
    expect((await svar.json()).error).toMatch(/inte-ett-id/);
    expect(korMock).not.toHaveBeenCalled();
  });

  it("☠️ schemat tar inget godkännande: utan manuell=1 vägras frågan", async () => {
    const svar = await POST(req(`godkannPris=${ID1}`));
    expect(svar.status).toBe(400);
    expect(korMock).not.toHaveBeenCalled();
  });

  it("svaret bär de godkända hoppen, utan artikelnummer", async () => {
    korMock.mockResolvedValueOnce({
      utfall: "klar",
      summary: summary({ godkandaHopp: [{ wixProductId: ID1, fran: 100, till: 300, andringPct: 200 }] }),
      markor: null,
      markorFel: null,
    });
    const svar = await POST(req(`manuell=1&dryRun=false&godkannPris=${ID1}`));
    const text = await svar.text();
    expect(text).not.toContain(SKU);
    expect(JSON.parse(text).godkandaHopp).toEqual([{ wixProductId: ID1, fran: 100, till: 300, andringPct: 200 }]);
  });

  it("☠️ en skarp körning som bara stoppade ett prishopp skriver ändå sin kvittorad, med produkten", async () => {
    const tyst = { dryRun: false, lagerUppdaterade: 0, prisUppdaterade: 0, misslyckade: 0, errors: [] };
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary(tyst), markor: "fortsatte", markorFel: null });
    await POST(req(""));
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock.mock.calls[0][0]).toBe("vevor-sync");
    expect(String(auditMock.mock.calls[0][2])).toContain("1 varningar (wix-2 100→300)");
    expect(String(auditMock.mock.calls[0][2])).not.toContain(SKU);

    // Utan stoppat hopp och utan skrivningar finns inget att kvittera.
    auditMock.mockClear();
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary({ ...tyst, varningar: [] }), markor: "fortsatte", markorFel: null });
    await POST(req(""));
    expect(auditMock).not.toHaveBeenCalled();

    // En torrkörning kvitterar aldrig.
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary(), markor: null, markorFel: null });
    await POST(req("manuell=1"));
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("☠️ ett prishopp över 40 % som skrivs utan tak står i svaret och i kvittoraden, utan artikelnummer", async () => {
    const hopp = [{ wixProductId: ID1, fran: 4299, till: 2099, andringPct: -51 }];
    const tyst = { dryRun: false, lagerUppdaterade: 0, prisUppdaterade: 0, misslyckade: 0, errors: [], varningar: [] };
    korMock.mockResolvedValueOnce({ utfall: "klar", summary: summary({ ...tyst, storaHopp: hopp }), markor: "fortsatte", markorFel: null });
    const svar = await POST(req(""));
    const text = await svar.text();
    expect(text).not.toContain(SKU);
    expect(JSON.parse(text).storaHopp).toEqual(hopp);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(String(auditMock.mock.calls[0][2])).toContain(`1 prishopp över 40 % (${ID1} 4299→2099)`);
  });

  it("utan CRON_SECRET är rutten stängd", async () => {
    const svar = await POST({
      headers: new Headers({ authorization: "Bearer fel" }),
      nextUrl: new URL("https://exempel.test/api/cron/vevor-synk?manuell=1"),
    } as unknown as NextRequest);
    expect(svar.status).toBe(401);
  });
});
