// Markören i svaret från de tre Aosom-svepen (import, synk, bildfix).
//
// ☠️ Det här är läckans faktiska kanal: rutten svarar till en workflow vars
// logg är PUBLIK, och markören ÄR ett artikelnummer. Uppmätt 2026-09-27: alla
// 29 importkörningar och 28 av 35 synkkörningar bar artikelnummer i loggen.
// Förseglingen själv testas i lib/aosom/markor.test.ts; här låses att varje
// rutt faktiskt använder den, åt båda hållen.
//
// ☠️ Artikelnumret är SYNTETISKT och byggs vid körning.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const ARTIKEL = ["999", "999ZZ"].join("-");

const importMock = vi.fn();
const syncMock = vi.fn();
const bildMock = vi.fn();

vi.mock("@/lib/auth", () => ({ isAuthorized: () => false }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));
vi.mock("@/lib/aosom/import-run", () => ({
  runAosomImport: (...a: unknown[]) => importMock(...a),
  liveDeps: async () => ({}),
}));
vi.mock("@/lib/aosom/sync", () => ({
  runAosomSync: (...a: unknown[]) => syncMock(...a),
  liveDeps: async () => ({}),
}));
vi.mock("@/lib/aosom/image-repair", () => ({
  runImageRepair: (...a: unknown[]) => bildMock(...a),
  liveDeps: async () => ({}),
}));

import { POST as importPost } from "./route";
import { POST as syncPost } from "../aosom-sync/route";
import { POST as bildPost } from "../aosom-image-repair/route";
import { forseglaMarkor } from "@/lib/aosom/markor";

function req(fraga: string, hemlighet = "hemlig") {
  return {
    headers: new Headers({ authorization: `Bearer ${hemlighet}` }),
    nextUrl: new URL(`https://exempel.test/api/cron/x?${fraga}`),
  } as unknown as NextRequest;
}

const SYNK_TOM = {
  granskade: 0, lagerUppdaterade: 0, prisUppdaterade: 0, utanWixPris: 0, utanLagerrader: 0,
  misslyckade: 0, okandaVarianter: 0, tvetydiga: 0, prislistaFel: null, urFeeden: 0,
  slutsalda: 0, ejSkeppbara: 0, varningar: [], prisLasta: 0, konkurrentMal: 0,
  konkurrentTak: 0, konkurrentGolv: 0, konkurrentFrysta: 0, lagerDrift: 0,
  flerartikelrader: 0, stoppedBy: "limit", kvar: 5, errors: [],
};

const RUTTER = [
  { namn: "aosom-import", post: importPost, mock: importMock, svar: { imported: 0, failed: 0, remaining: 5, stoppedBy: "limit", errors: [] } },
  { namn: "aosom-sync", post: syncPost, mock: syncMock, svar: SYNK_TOM },
  { namn: "aosom-image-repair", post: bildPost, mock: bildMock, svar: { reparerade: 0, misslyckade: 0, kvar: 5, stoppedBy: "limit", errors: [] } },
] as const;

beforeEach(() => {
  process.env.CRON_SECRET = "hemlig";
  for (const r of RUTTER) {
    r.mock.mockReset();
    r.mock.mockResolvedValue({ ...r.svar, cursor: ARTIKEL });
  }
});

describe.each(RUTTER)("$namn: markören", ({ post, mock }) => {
  it("☠️ svaret bär aldrig artikelnumret — varken i cursor eller i next", async () => {
    const res = await post(req("dryRun=true"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(ARTIKEL);
    const body = JSON.parse(text);
    expect(body.cursor).toMatch(/^m1\./);
    expect(body.next).toContain(`after=${encodeURIComponent(body.cursor)}`);
  });

  it("en förseglad markör öppnas innan den når svepet", async () => {
    const f = forseglaMarkor(ARTIKEL, "hemlig")!;
    await post(req(`dryRun=true&after=${encodeURIComponent(f)}`));
    expect(mock.mock.calls[0][1].after).toBe(ARTIKEL);
  });

  it("en handskriven markör i klartext tas emot", async () => {
    await post(req(`dryRun=true&after=${ARTIKEL}`));
    expect(mock.mock.calls[0][1].after).toBe(ARTIKEL);
  });

  it("☠️ en förseglad markör som inte går att öppna är 400 — svepet startar aldrig om tyst", async () => {
    const f = forseglaMarkor(ARTIKEL, "en-gammal-hemlighet")!;
    const res = await post(req(`dryRun=true&after=${encodeURIComponent(f)}`));
    expect(res.status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });

  it("slut på svepet ger null, inte en förseglad tom sträng", async () => {
    mock.mockResolvedValue({ ...RUTTER[0].svar, ...SYNK_TOM, cursor: null });
    const body = await (await post(req("dryRun=true"))).json();
    expect(body.cursor).toBeNull();
    expect(body.next).toBeNull();
  });
});
