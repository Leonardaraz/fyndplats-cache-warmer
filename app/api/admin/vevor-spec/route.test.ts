// Admin-rutten för VEVOR-specifikationen: auktorisering, urvalet (tuggorna), spärren mot Aosoms
// synkfönster och vad som skrivs ut. Skrivaren själv (lib/vevor/spec-ratta.ts) har egna tester;
// här är den låtsad.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SpecDeps, SpecVal } from "@/lib/vevor/spec-ratta";

const varld = vi.hoisted(() => ({
  auth: true,
  listade: 0,
  hamtade: [] as string[][],
  anrop: [] as { deps: unknown; val: unknown; rader: unknown[] }[],
  kor: null as null | ((val: unknown) => Promise<unknown>),
}));

vi.mock("@/lib/auth", () => ({ isAuthorized: () => varld.auth }));
vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async () => {
    throw new Error("inget Wix-anrop väntat i ruttens test");
  },
}));
vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    listMappingsMedPrefix: async () => {
      varld.listade++;
      return [{ wixProductId: "alla" }];
    },
    getMappingsByWixProductIds: async (ids: string[]) => {
      varld.hamtade.push(ids);
      return new Map(ids.map((id) => [id, { wixProductId: id }]));
    },
  }),
}));
vi.mock("@/lib/vevor/lager", () => ({
  WixVevorLager: class {
    async avlasningar() {
      return new Map();
    }
  },
}));
vi.mock("@/lib/vevor/spec-ratta", async (orig) => {
  const riktig = await orig<typeof import("@/lib/vevor/spec-ratta")>();
  return {
    ...riktig,
    korSpec: async (deps: SpecDeps, val: SpecVal) => {
      // Rutten väljer var mappningarna läses; läs dem som korSpec gör.
      const rader = await deps.mappningar();
      varld.anrop.push({ deps, val, rader });
      return (varld.kor as (v: unknown) => Promise<unknown>)(val);
    },
  };
});

import { SpecFel } from "@/lib/vevor/spec-ratta";
import { POST } from "./route";

const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

function svar(over: Record<string, unknown> = {}) {
  return {
    dryRun: true,
    utkast: 2,
    attRatta: 1,
    attByta: 1,
    redanRatt: 1,
    tomma: 0,
    hinder: { publicerad: 0, polerad: 0, avlasning_saknas: 0, ej_omlast: 0, flik_utan_rader: 0, las_fel: 0 },
    skrivna: 0,
    kvar: 1,
    stoppadAv: "klart",
    fel: null,
    idn: [ID1],
    ...over,
  };
}

function begar(kropp: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://motor.example/api/admin/vevor-spec", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(kropp),
  });
}

const val = (i = 0) => varld.anrop[i].val as SpecVal;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // 04:00 UTC: över två timmar till nästa synkfönster (06:12).
  vi.setSystemTime(new Date("2026-11-01T04:00:00Z"));
  varld.auth = true;
  varld.listade = 0;
  varld.hamtade = [];
  varld.anrop = [];
  varld.kor = async () => svar();
  vi.stubEnv("CRON_SECRET", "hemlig");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("auktorisering", () => {
  it("☠️ utan inloggning eller hemlighet är det 401 och ingenting läses", async () => {
    varld.auth = false;
    expect((await POST(begar({ dryRun: false, bekrafta: 1 }))).status).toBe(401);
    expect((await POST(begar({}, { authorization: "Bearer fel" }))).status).toBe(401);
    expect(varld.anrop).toHaveLength(0);
  });

  it("Bearer CRON_SECRET släpps in", async () => {
    varld.auth = false;
    expect((await POST(begar({}, { authorization: "Bearer hemlig" }))).status).toBe(200);
  });
});

describe("planen och urvalet", () => {
  it("torrt som default; utan urval läses alla VEVOR-mappningar och budgeten är hel", async () => {
    const r = await POST(begar({}));
    expect(r.status).toBe(200);
    expect(val()).toMatchObject({ dryRun: true, bekrafta: null, idn: undefined, allaIdn: false, budgetMs: 240_000 });
    expect(varld.listade).toBe(1);
    expect(varld.hamtade).toHaveLength(0);
  });

  it("allaIdn går vidare i en torr körning men aldrig i en skarp", async () => {
    await POST(begar({ dryRun: true, allaIdn: true }));
    expect(val(0).allaIdn).toBe(true);
    await POST(begar({ dryRun: false, bekrafta: 1, allaIdn: true }));
    expect(val(1).allaIdn).toBe(false);
  });

  it("☠️ med ett urval läses bara urvalets mappningar, inte alla", async () => {
    const r = await POST(begar({ dryRun: false, bekrafta: 2, idn: [ID1, ID2, ID1] }));
    expect(r.status).toBe(200);
    expect(varld.listade).toBe(0);
    expect(varld.hamtade).toEqual([[ID1, ID2]]);
    expect(val()).toMatchObject({ dryRun: false, bekrafta: 2, idn: [ID1, ID2] });
    expect(varld.anrop[0].rader).toEqual([{ wixProductId: ID1 }, { wixProductId: ID2 }]);
  });

  it("☠️ ett urval som inte är Wix-id avvisas i stället för att ge en tom körning", async () => {
    expect((await POST(begar({ idn: ["abc"] }))).status).toBe(400);
    expect((await POST(begar({ idn: [ID1, 5] }))).status).toBe(400);
    expect((await POST(begar({ idn: ID1 }))).status).toBe(400);
    expect(varld.anrop).toHaveLength(0);
  });

  it("ett skarpt anrop tar högst 500 sidor; en torr plan tar fler", async () => {
    const many = Array.from({ length: 501 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect((await POST(begar({ dryRun: false, bekrafta: 501, idn: many }))).status).toBe(400);
    expect(varld.anrop).toHaveLength(0);
    expect((await POST(begar({ dryRun: true, idn: many }))).status).toBe(200);
  });
});

describe("☠️ synkfönstret", () => {
  it("skarpt inne i fönstret är 409 med tiden att vänta till, och skrivaren rörs inte", async () => {
    vi.setSystemTime(new Date("2026-11-01T06:15:00Z"));
    const r = await POST(begar({ dryRun: false, bekrafta: 1 }));
    expect(r.status).toBe(409);
    const kropp = (await r.json()) as { ok: boolean; error: string; vantaTillUtc: string };
    expect(kropp).toMatchObject({ ok: false, vantaTillUtc: "2026-11-01T06:30:00.000Z" });
    expect(kropp.error).toMatch(/^synkfonster/);
    expect(varld.anrop).toHaveLength(0);
  });

  it("så nära att ett varv inte ryms vägras också, och väntar ut det kommande fönstret", async () => {
    // 06:10:30: 90 s till fönstret, minus marginalen 30 s är 60 s, under de 75 ett varv kräver.
    vi.setSystemTime(new Date("2026-11-01T06:10:30Z"));
    const r = await POST(begar({ dryRun: false, bekrafta: 1 }));
    expect(r.status).toBe(409);
    expect(((await r.json()) as { vantaTillUtc: string }).vantaTillUtc).toBe("2026-11-01T06:30:00.000Z");
    expect(varld.anrop).toHaveLength(0);
  });

  it("☠️ budgeten kortas så att varvet slutar före nästa fönster", async () => {
    // 06:08:00: 240 s till fönstret, minus marginalen 30 s.
    vi.setSystemTime(new Date("2026-11-01T06:08:00Z"));
    expect((await POST(begar({ dryRun: false, bekrafta: 1 }))).status).toBe(200);
    expect(val().budgetMs).toBe(210_000);
  });

  it("en torr plan går också inne i fönstret: den skriver ingenting", async () => {
    vi.setSystemTime(new Date("2026-11-01T06:15:00Z"));
    expect((await POST(begar({ dryRun: true }))).status).toBe(200);
    expect(val().budgetMs).toBe(240_000);
  });
});

describe("svaret", () => {
  it("ett SpecFel (planen har vuxit) är 409 med sitt meddelande", async () => {
    varld.kor = async () => {
      throw new SpecFel("planen har 3 sidor att rätta, fler än bekrafta (2) — kör planen igen");
    };
    const r = await POST(begar({ dryRun: false, bekrafta: 2 }));
    expect(r.status).toBe(409);
    expect(((await r.json()) as { error: string }).error).toMatch(/fler än bekrafta/);
  });

  it("☠️ ett annat fel är 502 utan felets text: den kan bära Wix felkropp", async () => {
    varld.kor = async () => {
      throw new Error("Wix 500: <html>intern adress och artikel</html>");
    };
    const r = await POST(begar({ dryRun: false, bekrafta: 1 }));
    expect(r.status).toBe(502);
    expect(JSON.stringify(await r.json())).not.toContain("artikel");
  });
});
