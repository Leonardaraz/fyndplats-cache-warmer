// /api/cron/aosom-media-cleanup — parametrarna. Städningen själv testas i
// lib/aosom/media-cleanup.test.ts; här låses att rutten aldrig tolkar ett
// oläsbart tak eller golv som "inget tak".

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

const korningar: Record<string, unknown>[] = [];
vi.mock("@/lib/aosom/media-cleanup", async (orig) => {
  const riktig = await orig<typeof import("@/lib/aosom/media-cleanup")>();
  return {
    ...riktig,
    liveDeps: async () => ({}),
    runMediaCleanup: async (_deps: unknown, opts: Record<string, unknown>) => {
      korningar.push(opts);
      return { dryRun: opts.dryRun !== false, raderade: 0, iKarens: 0 };
    },
  };
});

import { POST } from "./route";

const anrop = (fraga: string) => POST(new NextRequest(`https://motor.example/api/cron/aosom-media-cleanup?${fraga}`, { method: "POST" }));

beforeEach(() => { korningar.length = 0; });

describe("aosom-media-cleanup: parametrarna", () => {
  it("☠️ en skarp körning svarar 410 och kör ingenting (avstängd 2026-10-30)", async () => {
    for (const fraga of ["dryRun=false", "dryRun=false&limit=2000", "dryRun=false&omfang=allt&golv=ordrar:78"]) {
      expect((await anrop(fraga)).status, fraga).toBe(410);
    }
    expect(korningar).toEqual([]);
  });

  it("☠️ ett limit som inte är ett positivt heltal avvisas — det blev förr obegränsat", async () => {
    for (const v of ["0.5", "-3", "abc"]) {
      const res = await anrop(`dryRun=true&limit=${v}`);
      expect(res.status, `limit=${v}`).toBe(400);
    }
    expect(korningar).toEqual([]);
  });

  it("limit=0 i en torrkörning är inget tak, som import-workflowens bildstadning-torr skickar", async () => {
    expect((await anrop("dryRun=true&limit=0")).status).toBe(200);
    expect(korningar[0].limit).toBeUndefined();
    expect((await anrop("dryRun=true&limit=")).status).toBe(200);
    expect((await anrop("dryRun=true&limit=0.5")).status).toBe(400);
  });

  it("ett giltigt limit går fram, och utan limit finns inget tak", async () => {
    expect((await anrop("dryRun=true&limit=2000")).status).toBe(200);
    expect(korningar[0].limit).toBe(2000);
    expect((await anrop("dryRun=true")).status).toBe(200);
    expect(korningar[1].limit).toBeUndefined();
  });

  it("golvet tar varianterna, och okända läsare avvisas", async () => {
    expect((await anrop("omfang=allt&golv=varianter:5000,ordrar:78")).status).toBe(200);
    expect(korningar[0].golv).toEqual({ varianter: 5000, ordrar: 78 });
    expect((await anrop("omfang=allt&golv=bilder:5")).status).toBe(400);
  });
});
