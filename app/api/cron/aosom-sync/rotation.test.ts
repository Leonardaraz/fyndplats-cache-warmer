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
  flerartikelrader: 0, kvar: 5, errors: [], prisUppskjutna: 0,
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

// ---------------------------------------------------------------------------
// En priskörning om dagen (2026-11-11)
// ---------------------------------------------------------------------------
//
// Leonard 2026-11-11: "den borde köras 1 gång om dagen och fungera också".
// Körningen 03:13 UTC går ett helt varv. Fortsättningarna (`fortsatt=1`) gör
// något bara när varvet inte hanns med.
const optionerIAnrop = (n: number) => syncMock.mock.calls[n][1];

describe("en priskörning om dagen: ?fortsatt=1, ?budget= och varvet", () => {
  it("☠️ fortsättningen hoppas över när förra körningen hann hela varvet", async () => {
    const res = await POST(req("dryRun=false&rotation=pris&fortsatt=1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, hoppad: true, rotation: "pris" });
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("☠️ fortsättningen KÖR när förra körningen stannade på vägen", async () => {
    await lager.spara("pris", FORSTA);
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    const res = await POST(req("dryRun=false&rotation=pris&fortsatt=1"));
    expect(res.status).toBe(200);
    expect(afterIAnrop(0)).toBe(FORSTA);
    // Varvet blev klart: nästa fortsättning har inget att göra.
    expect(await lager.las("pris")).toBeNull();
    await POST(req("dryRun=false&rotation=pris&fortsatt=1"));
    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it("dagens första körning (utan fortsatt) kör alltid, också utan markör", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false&rotation=pris"));
    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it("☠️ går markören inte att läsa kör fortsättningen ändå", async () => {
    const las = vi.spyOn(lager, "las").mockRejectedValueOnce(new Error("Wix Data svarade 500"));
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "limit", cursor: FORSTA });
    try {
      await POST(req("dryRun=false&rotation=pris&fortsatt=1"));
    } finally {
      las.mockRestore();
    }
    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it("fortsatt utan rotation betyder ingenting: körningen går som vanligt", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false&fortsatt=1"));
    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it("lagerrotationen har sin egen markör: prisets fortsättning ser inte den", async () => {
    await lager.spara("lager", FORSTA);
    await POST(req("dryRun=false&rotation=pris&fortsatt=1"));
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("☠️ priskörningen går ett helt varv, lagerkörningen gör det inte", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false&rotation=pris"));
    await POST(req("dryRun=false&skipPrices=1&rotation=lager"));
    await POST(req("dryRun=false"));
    expect(optionerIAnrop(0).varv).toBe(true);
    expect(optionerIAnrop(1).varv).toBe(false);
    expect(optionerIAnrop(2).varv).toBe(false);
  });

  it("utan ?budget= är budgeten 240 sekunder, och priserna slutar skrivas 45 sekunder senare", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false"));
    expect(optionerIAnrop(0).timeBudgetMs).toBe(240_000);
    expect(optionerIAnrop(0).prisSlutMs).toBe(285_000);
  });

  it("?budget=660 ger den schemalagda priskörningen elva minuter", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false&rotation=pris&budget=660"));
    expect(optionerIAnrop(0).timeBudgetMs).toBe(660_000);
    expect(optionerIAnrop(0).prisSlutMs).toBe(705_000);
  });

  it("☠️ en större budget än 660 kapas: annars dödar Vercel körningen mitt i en tugga", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false&budget=5000"));
    expect(optionerIAnrop(0).timeBudgetMs).toBe(660_000);
    expect(optionerIAnrop(0).prisSlutMs).toBeLessThan(800_000);
  });

  it("?samtidiga= styr hur många prisskrivningar som går samtidigt, mellan 1 och 6", async () => {
    syncMock.mockResolvedValue({ ...SVAR, stoppedBy: "klart", cursor: null, kvar: 0 });
    await POST(req("dryRun=false"));
    await POST(req("dryRun=false&samtidiga=1"));
    await POST(req("dryRun=false&samtidiga=5"));
    await POST(req("dryRun=false&samtidiga=40"));
    await POST(req("dryRun=false&samtidiga=0"));
    // undefined = synkens egen default (PRIS_SAMTIDIGA).
    expect([0, 1, 2, 3, 4].map((n) => optionerIAnrop(n).prisSamtidiga)).toEqual([undefined, 1, 5, 6, undefined]);
  });

  it("schemat i vercel.json: en priskörning om dagen plus tre fortsättningar, alla i synkfönstret", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { iSynkfonster } = await import("@/lib/wix/synkfonster");
    const crons = (JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
      crons: { path: string; schedule: string }[];
    }).crons.filter((c) => c.path.startsWith("/api/cron/aosom-sync") && c.path.includes("rotation=pris"));

    const forsta = crons.filter((c) => !c.path.includes("fortsatt=1"));
    const fortsattningar = crons.filter((c) => c.path.includes("fortsatt=1"));
    expect(forsta).toHaveLength(1);
    expect(fortsattningar).toHaveLength(1);
    // EN timme för dagens körning, tre för fortsättningarna.
    expect(forsta[0].schedule.split(" ")[1].split(",")).toHaveLength(1);
    expect(fortsattningar[0].schedule.split(" ")[1].split(",")).toHaveLength(3);

    for (const c of crons) {
      expect(c.path).toContain("dryRun=false");
      expect(c.path).toContain("budget=660");
      const [minut, timmar] = c.schedule.split(" ");
      for (const timme of timmar.split(",")) {
        // Körningen får börja på nya tuggor i 660 sekunder och skriva priser i
        // 45 till: hela den tiden ska ligga i fönstret där andra skrivare väntar.
        const start = Date.UTC(2026, 10, 12, Number(timme), Number(minut), 0);
        expect(iSynkfonster(new Date(start))).toBe(true);
        expect(iSynkfonster(new Date(start + 705_000))).toBe(true);
      }
    }
  });
});
