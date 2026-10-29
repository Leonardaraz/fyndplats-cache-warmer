// Den sparade markören (lib/aosom/sync-markor.ts): var nästa schemalagda
// körning fortsätter.
//
// ☠️ Det här är felet markören lagar (2026-10-13): utan den började varje
// körning om från början, och svansen av katalogen nåddes aldrig. Bokhyllan
// bd664764 såldes för 749 kr mot regelpriset 819.
//
// ☠️ Artikelnumren är SYNTETISKA och byggs vid körning.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const FORSTA = ["111", "111ZZ"].join("-");
const ANDRA = ["222", "222ZZ"].join("-");

const syncMock = vi.fn();

vi.mock("@/lib/auth", () => ({ isAuthorized: () => false }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));
vi.mock("@/lib/aosom/sync", () => ({
  runAosomSync: (...a: unknown[]) => syncMock(...a),
  liveDeps: async () => ({}),
}));

import { POST } from "./route";
import { arRotation, getSyncMarkorLager, MinnesSyncMarkorLager, nastaMarkor } from "@/lib/aosom/sync-markor";

function req(fraga: string) {
  return {
    headers: new Headers({ authorization: "Bearer hemlig" }),
    nextUrl: new URL(`https://exempel.test/api/cron/aosom-sync?${fraga}`),
  } as unknown as NextRequest;
}

const SVAR = {
  granskade: 0, lagerUppdaterade: 0, prisUppdaterade: 0, utanWixPris: 0, utanLagerrader: 0,
  misslyckade: 0, okandaVarianter: 0, tvetydiga: 0, prislistaFel: null, urFeeden: 0,
  slutsalda: 0, ejSkeppbara: 0, varningar: [], godkandaHopp: [], prisLasta: 0, konkurrentMal: 0,
  konkurrentTak: 0, konkurrentGolv: 0, konkurrentFrysta: 0, lagerDrift: 0,
  lagerDriftRattade: 0, lagerDriftProdukter: [], stampelHoppade: 0,
  saldaAvdragna: 0, saldaAvdragnaProdukter: [],
  flerartikelrader: 0, kvar: 5, errors: [],
  aterILager: 0, restockMejl: 0, restockEjSkickade: 0, restockUtskick: [], restockFel: null,
};

const lager = getSyncMarkorLager() as MinnesSyncMarkorLager;
const afterIAnrop = (n: number) => syncMock.mock.calls[n][1].after;

beforeEach(() => {
  process.env.CRON_SECRET = "hemlig";
  delete process.env.STORE_BACKEND;
  lager.markorer.clear();
  syncMock.mockReset();
});

describe("markörernas namn", () => {
  it("☠️ VEVOR-synkens markör är ingen rotation Aosom-rutten tar emot", () => {
    expect(arRotation("vevor")).toBe(false);
    expect(arRotation("lager")).toBe(true);
    expect(arRotation("pris")).toBe(true);
  });

  it("VEVOR:s markör och Aosoms rotationer sparas var för sig", async () => {
    await lager.spara("vevor", FORSTA);
    await lager.spara("lager", ANDRA);
    expect(await lager.las("vevor")).toBe(FORSTA);
    expect(await lager.las("lager")).toBe(ANDRA);
    expect(await lager.las("pris")).toBeNull();
  });
});

describe("nastaMarkor", () => {
  it("klart → null, nästa börjar om", () => {
    expect(nastaMarkor({ stoppedBy: "klart", cursor: null }, FORSTA)).toBeNull();
  });
  it("stannade på limit eller tidsbudget → där den stannade", () => {
    expect(nastaMarkor({ stoppedBy: "limit", cursor: ANDRA }, FORSTA)).toBe(ANDRA);
    expect(nastaMarkor({ stoppedBy: "tidsbudget", cursor: ANDRA }, null)).toBe(ANDRA);
  });
  it("☠️ stannade innan första tuggan → den gamla står kvar, aldrig tillbaka till början", () => {
    expect(nastaMarkor({ stoppedBy: "tidsbudget", cursor: null }, FORSTA)).toBe(FORSTA);
  });
});

describe("?rotation= i rutten", () => {
  it("☠️ nästa skarpa körning fortsätter där förra slutade", async () => {
    syncMock.mockResolvedValueOnce({ ...SVAR, stoppedBy: "limit", cursor: FORSTA });
    syncMock.mockResolvedValueOnce({ ...SVAR, stoppedBy: "tidsbudget", cursor: ANDRA });
    syncMock.mockResolvedValueOnce({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });

    await POST(req("dryRun=false&rotation=pris"));
    await POST(req("dryRun=false&rotation=pris"));
    await POST(req("dryRun=false&rotation=pris"));
    await POST(req("dryRun=false&rotation=pris"));

    expect(afterIAnrop(0)).toBeUndefined();
    expect(afterIAnrop(1)).toBe(FORSTA);
    expect(afterIAnrop(2)).toBe(ANDRA);
    // Den tredje gick hela vägen: den fjärde börjar om från början.
    expect(afterIAnrop(3)).toBeUndefined();
  });

  it("rotationerna har var sin markör", async () => {
    syncMock.mockResolvedValueOnce({ ...SVAR, stoppedBy: "limit", cursor: FORSTA });
    await POST(req("dryRun=false&skipPrices=1&rotation=lager"));
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "limit", cursor: ANDRA });
    await POST(req("dryRun=false&rotation=pris"));
    expect(afterIAnrop(1)).toBeUndefined();
    expect(await lager.las("lager")).toBe(FORSTA);
    expect(await lager.las("pris")).toBe(ANDRA);
  });

  it("☠️ en torrkörning flyttar inte markören", async () => {
    await lager.spara("pris", FORSTA);
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "limit", cursor: ANDRA });
    await POST(req("dryRun=true&rotation=pris"));
    expect(afterIAnrop(0)).toBe(FORSTA);
    expect(await lager.las("pris")).toBe(FORSTA);
  });

  it("en körning med after eller sku rör inte den schemalagda markören", async () => {
    await lager.spara("pris", FORSTA);
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "limit", cursor: ANDRA });
    await POST(req(`dryRun=false&rotation=pris&after=${ANDRA}`));
    expect(afterIAnrop(0)).toBe(ANDRA);
    await POST(req(`dryRun=false&rotation=pris&sku=${ANDRA}`));
    expect(afterIAnrop(1)).toBeUndefined();
    expect(await lager.las("pris")).toBe(FORSTA);
  });

  it("☠️ ett okänt rotationsnamn är 400 — en felstavning får inte tyst ge en körning utan markör", async () => {
    const res = await POST(req("dryRun=false&rotation=priser"));
    expect(res.status).toBe(400);
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("☠️ markören når aldrig svaret i klartext", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "limit", cursor: FORSTA });
    const text = await (await POST(req("dryRun=false&rotation=pris"))).text();
    expect(text).not.toContain(FORSTA);
  });
});
