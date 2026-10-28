// Admin-rutten för varukostnaden: auktorisering, parametrar, spärren mot Aosoms synkfönster, bekräftelsen
// och vad som skrivs ut. Skrivaren själv (lib/wix/varukostnad.ts) har egna tester; här är den låtsad.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { BekraftaFel } from "@/lib/wix/varukostnad";

const varld = vi.hoisted(() => ({
  auth: true,
  mappningar: [] as unknown[],
  katalog: [] as unknown[],
  lasKatalogFel: null as Error | null,
  lasteKatalog: 0,
  kor: null as null | ((...a: unknown[]) => Promise<unknown>),
  anrop: [] as unknown[][],
  audit: [] as unknown[][],
}));

vi.mock("@/lib/auth", () => ({ isAuthorized: () => varld.auth }));
vi.mock("@/lib/audit", () => ({
  audit: async (...a: unknown[]) => {
    varld.audit.push(a);
  },
}));
vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async () => {
    throw new Error("inget Wix-anrop väntat i ruttens test");
  },
}));
vi.mock("@/lib/store/factory", () => ({ getStore: () => ({ listMappings: async () => varld.mappningar }) }));
vi.mock("@/lib/wix/varukostnad", async (orig) => {
  const riktig = await orig<typeof import("@/lib/wix/varukostnad")>();
  return {
    ...riktig,
    lasKatalogVarianter: async () => {
      varld.lasteKatalog++;
      if (varld.lasKatalogFel) throw varld.lasKatalogFel;
      return varld.katalog;
    },
    korVarukostnad: async (...a: unknown[]) => {
      varld.anrop.push(a);
      return (varld.kor as (...x: unknown[]) => Promise<unknown>)(...a);
    },
  };
});

import { GET, POST } from "./route";

const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

function rapport(over: Record<string, unknown> = {}) {
  return {
    torr: false,
    utkast: true,
    plan: { attSkriva: 7, redanKostnad: 2, utanKatalogvariant: 1 },
    totalt: 5,
    behandlade: 5,
    skrivna: 5,
    varianterSkrivna: 7,
    redanKlara: 0,
    fel: 0,
    avvikelser: 0,
    nasta: ID2,
    ejNadda: 0,
    aterstod: 0,
    fullstandig: true,
    stoppad: false,
    produkter: [],
    ...over,
  };
}

function begar(query = "", headers: Record<string, string> = {}, metod = "GET"): NextRequest {
  return new NextRequest(`https://motor.example/api/admin/varukostnad${query}`, { method: metod, headers });
}

/** Anropet som korVarukostnad fick: (wix, mappningar, katalog, opts). */
const opts = (i = 0) => varld.anrop[i][3] as Record<string, unknown>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // 02:00 UTC: 72 minuter till nästa synkfönster (03:12), alltså gott om rum.
  vi.setSystemTime(new Date("2026-10-28T02:00:00Z"));
  varld.auth = true;
  varld.mappningar = [];
  varld.katalog = [];
  varld.lasKatalogFel = null;
  varld.lasteKatalog = 0;
  varld.anrop = [];
  varld.audit = [];
  varld.kor = async () => rapport();
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
    const r = await GET(begar("?dryRun=false&bekrafta=5"));
    expect(r.status).toBe(401);
    expect(varld.lasteKatalog).toBe(0);
    expect(varld.anrop).toHaveLength(0);
  });

  it("Bearer CRON_SECRET släpps in, ett fel värde inte", async () => {
    varld.auth = false;
    expect((await GET(begar("", { authorization: "Bearer hemlig" }))).status).toBe(200);
    expect((await GET(begar("", { authorization: "Bearer fel" }))).status).toBe(401);
  });

  it("☠️ saknas CRON_SECRET helt släpper inte ens `Bearer undefined` in (mallsträngen skulle annars matcha)", async () => {
    varld.auth = false;
    delete process.env.CRON_SECRET;
    expect((await GET(begar("", { authorization: "Bearer undefined" }))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(begar("", { authorization: "Bearer" }))).status).toBe(401);
  });

  it("både GET och POST går till samma hanterare", async () => {
    expect((await POST(begar("", {}, "POST"))).status).toBe(200);
  });
});

describe("parametrar", () => {
  it("torrt är default, och utkast tas med", async () => {
    await GET(begar());
    expect(opts()).toMatchObject({ torr: true, utkast: true, ids: undefined, efter: undefined, limit: undefined });
  });

  it("☠️ bara `dryRun=false` ger skarpt: `0`, `nej` och tomt är fortfarande torrt", async () => {
    for (const v of ["", "?dryRun=0", "?dryRun=nej", "?dryRun=true", "?dryRun=FALSE"]) {
      varld.anrop = [];
      await GET(begar(v));
      expect(opts().torr, v).toBe(true);
    }
  });

  it("☠️ bara Aosom: ett annat värde på leverantor är 400 och ingenting läses", async () => {
    for (const v of ["aliexpress", "vevor", "alla", ""]) {
      const r = await GET(begar(`?leverantor=${v}`));
      expect(r.status, v).toBe(400);
      expect(((await r.json()) as { error: string }).error).toMatch(/aosom/);
    }
    expect(varld.lasteKatalog).toBe(0);
    expect((await GET(begar("?leverantor=AOSOM"))).status).toBe(200);
  });

  it("ids måste vara Wix-id (uuid), högst 60", async () => {
    expect((await GET(begar(`?ids=${ID1},${ID2}`))).status).toBe(200);
    expect(opts().ids).toEqual([ID1, ID2]);
    expect((await GET(begar("?ids=inte-ett-id"))).status).toBe(400);
    const sextioett = Array.from({ length: 61 }, () => ID1).join(",");
    expect((await GET(begar(`?ids=${sextioett}`))).status).toBe(400);
    const sextio = Array.from({ length: 60 }, () => ID1).join(",");
    expect((await GET(begar(`?ids=${sextio}`))).status).toBe(200);
  });

  it("efter måste vara ett Wix-id, limit ett heltal från 1, bekrafta och hogst heltal", async () => {
    expect((await GET(begar("?efter=nej"))).status).toBe(400);
    expect((await GET(begar("?limit=0"))).status).toBe(400);
    expect((await GET(begar("?limit=-3"))).status).toBe(400);
    expect((await GET(begar("?limit=2.5"))).status).toBe(400);
    expect((await GET(begar("?bekrafta=fem"))).status).toBe(400);
    expect((await GET(begar("?hogst=-1"))).status).toBe(400);
    expect((await GET(begar(`?efter=${ID1}&limit=25&hogst=0`))).status).toBe(200);
    expect(opts()).toMatchObject({ efter: ID1, limit: 25, hogst: 0 });
  });

  it("utkast=0 hoppar utkasten", async () => {
    await GET(begar("?utkast=0"));
    expect(opts().utkast).toBe(false);
  });
});

describe("☠️ synkfönstret", () => {
  it("skarpt inne i fönstret är 409 med tiden att vänta till, och varken katalogen eller skrivaren rörs", async () => {
    vi.setSystemTime(new Date("2026-10-28T03:15:00Z"));
    const r = await GET(begar("?dryRun=false&bekrafta=5"));
    expect(r.status).toBe(409);
    const kropp = (await r.json()) as { ok: boolean; error: string; vantaTillUtc: string };
    expect(kropp).toMatchObject({ ok: false, vantaTillUtc: "2026-10-28T03:30:00.000Z" });
    expect(kropp.error).toMatch(/synkfonster/);
    expect(varld.lasteKatalog).toBe(0);
    expect(varld.anrop).toHaveLength(0);
    expect(varld.audit).toHaveLength(0);
  });

  it("☠️ så nära att ett varv inte ryms vägras också, och väntar ut det KOMMANDE fönstret", async () => {
    // 03:11:00: 60 s till fönstret, minus marginalen 30 s är 30 s kvar, under de 45 som ett varv kräver.
    vi.setSystemTime(new Date("2026-10-28T03:11:00Z"));
    const r = await GET(begar("?dryRun=false&bekrafta=5"));
    expect(r.status).toBe(409);
    expect(((await r.json()) as { vantaTillUtc: string }).vantaTillUtc).toBe("2026-10-28T03:30:00.000Z");
    expect(varld.anrop).toHaveLength(0);
  });

  it("☠️ tidsbudgeten kortas så att varvet slutar före nästa fönster (minus marginalen)", async () => {
    vi.setSystemTime(new Date("2026-10-28T03:08:00Z"));
    await GET(begar("?dryRun=false&bekrafta=5"));
    // 240 s till 03:12:00, minus 30 s marginal.
    expect((opts().deadline as number) - Date.now()).toBe(210_000);
  });

  it("med gott om rum gäller den begärda budgeten, högst 270 s, och 240 s är default", async () => {
    await GET(begar("?dryRun=false&bekrafta=5"));
    expect((opts(0).deadline as number) - Date.now()).toBe(240_000);
    await GET(begar("?dryRun=false&bekrafta=5&maxSeconds=100"));
    expect((opts(1).deadline as number) - Date.now()).toBe(100_000);
    await GET(begar("?dryRun=false&bekrafta=5&maxSeconds=999"));
    expect((opts(2).deadline as number) - Date.now()).toBe(270_000);
  });

  it("torrt gäller inte fönstret: det bara läser", async () => {
    vi.setSystemTime(new Date("2026-10-28T03:15:00Z"));
    const r = await GET(begar());
    expect(r.status).toBe(200);
    expect(opts().torr).toBe(true);
  });
});

describe("bekräftelsen och stoppen", () => {
  it("bekrafta och hogst skickas vidare som de kom, och skarpt skrivs en audit-rad", async () => {
    await GET(begar("?dryRun=false&bekrafta=5"));
    expect(opts()).toMatchObject({ torr: false, bekrafta: "5", hogst: undefined });
    expect(varld.audit).toHaveLength(1);
    expect(varld.audit[0][0]).toBe("varukostnad");
    expect(String(varld.audit[0][2])).toMatch(/5 produkter skrivna \(7 varianter\)/);

    varld.anrop = [];
    await GET(begar("?dryRun=false&hogst=3&efter=" + ID1));
    expect(opts()).toMatchObject({ bekrafta: undefined, hogst: 3, efter: ID1 });
  });

  it("☠️ planens antal som inte stämmer är 409 från skrivaren och ingen audit-rad", async () => {
    varld.kor = async () => {
      throw new BekraftaFel('bekrafta måste vara torrkörningens antal produkter (5), fick "4"');
    };
    const r = await GET(begar("?dryRun=false&bekrafta=4"));
    expect(r.status).toBe(409);
    const kropp = (await r.json()) as { ok: boolean; error: string; rad: string };
    expect(kropp.ok).toBe(false);
    expect(kropp.error).toMatch(/torrkörningens antal produkter \(5\)/);
    expect(kropp.rad).toMatch(/torrt/);
    expect(varld.audit).toHaveLength(0);
  });

  it("☠️ en avvikelse eller fem fel i följd är 500 med `ok: false`, och audit-raden säger STOPPAD", async () => {
    for (const stoppadAv of ["avvikelse", "fel_i_foljd"]) {
      varld.audit = [];
      varld.kor = async () => rapport({ stoppad: true, stoppadAv, skrivna: 2, avvikelser: stoppadAv === "avvikelse" ? 1 : 0, fel: stoppadAv === "fel_i_foljd" ? 5 : 0, fullstandig: false });
      const r = await GET(begar("?dryRun=false&bekrafta=5"));
      expect(r.status, stoppadAv).toBe(500);
      expect(((await r.json()) as { ok: boolean; stoppadAv: string })).toMatchObject({ ok: false, stoppadAv });
      expect(String(varld.audit[0][2])).toMatch(new RegExp(`STOPPAD \\(${stoppadAv}\\)`));
    }
  });

  it("tidsbudgeten som tar slut är ett normalt stopp: 200 och `ok: true`, så att workflowen fortsätter", async () => {
    varld.kor = async () => rapport({ stoppad: true, stoppadAv: "tidsbudget", skrivna: 30, ejNadda: 40, aterstod: 40, fullstandig: false });
    const r = await GET(begar("?dryRun=false&bekrafta=70"));
    expect(r.status).toBe(200);
    expect(((await r.json()) as { ok: boolean; ejNadda: number })).toMatchObject({ ok: true, ejNadda: 40 });
  });

  it("torrt skriver ingen audit-rad", async () => {
    varld.kor = async () => rapport({ torr: true, behandlade: 0, skrivna: 0 });
    await GET(begar());
    expect(varld.audit).toHaveLength(0);
  });

  it("en skarp körning som inte behandlade något skriver ingen audit-rad", async () => {
    varld.kor = async () => rapport({ behandlade: 0, skrivna: 0, totalt: 0 });
    await GET(begar("?dryRun=false&bekrafta=0"));
    expect(varld.audit).toHaveLength(0);
  });
});

describe("☠️ underlaget och vad som skrivs ut", () => {
  it("en halv katalog eller ett läsfel är 503, och ingen skrivare körs", async () => {
    varld.lasKatalogFel = new Error("bara 120 varianter lästes, golvet är 4000: svepet är halvt");
    const r = await GET(begar("?dryRun=false&bekrafta=5"));
    expect(r.status).toBe(503);
    expect(varld.anrop).toHaveLength(0);
  });

  it("en felkropp som ekar ett värde eller ett artikelnummer redigeras i svaret", async () => {
    varld.lasKatalogFel = new Error("katalogsvepet föll på sida 3: Wix 400: kostnad 1099.40 för 999-999X99");
    const r = await GET(begar());
    const text = JSON.stringify(await r.json());
    expect(text).not.toMatch(/1099|999-999X99/);
    expect(text).toMatch(/‹tal›/);
  });

  it("☠️ ett oväntat fel i skrivaren är 500 med redigerat meddelande", async () => {
    varld.kor = async () => {
      throw new Error("Wix 500: avvisade 2048.50");
    };
    const r = await GET(begar("?dryRun=false&bekrafta=5"));
    expect(r.status).toBe(500);
    expect(JSON.stringify(await r.json())).not.toMatch(/2048/);
  });

  it("svaret är skrivarens rapport och inget annat: inga mappningsfält följer med", async () => {
    varld.mappningar = [{ wixProductId: ID1, supplierProductId: "aosom:999-999X99", variants: [{ landedCostSek: 812.5 }] }];
    const r = await GET(begar());
    const text = JSON.stringify(await r.json());
    expect(text).not.toMatch(/aosom:|999-999X99|812/);
  });
});
