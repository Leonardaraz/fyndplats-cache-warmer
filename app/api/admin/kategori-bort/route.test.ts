// Rutten för borttagningen av kategorilänkar. Reglerna testas i
// lib/polish/kategori-bort.test.ts; här låses det rutten lägger till: vem som får
// anropa, att en ogiltig plan aldrig når Wix, att ett utelämnat läge aldrig
// betyder "skriv", och att ett Wix-fel tvättas innan det lämnar servern.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let auktoriserad = false;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));

interface Anrop {
  metod: string;
  sokvag: string;
  kropp?: unknown;
}
let anrop: Anrop[] = [];
let wixKastar: string | null = null;
const PID = "3aa888bf-4e4d-41c4-b4c9-6ecd44b64c19";

vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async (metod: string, sokvag: string, kropp?: unknown) => {
    anrop.push({ metod, sokvag, kropp });
    if (wixKastar) throw new Error(wixKastar);
    if (sokvag === "/categories/v1/categories/query") {
      return {
        categories: [
          { id: "kok", name: "Kök & Husgeråd", visible: true },
          { id: "mini", name: "Miniugnar & airfryers", visible: true, parentCategory: { id: "kok" } },
          { id: "maskin", name: "Köksmaskiner & Apparater", visible: true, parentCategory: { id: "kok" } },
        ],
        pagingMetadata: {},
      };
    }
    if (metod === "GET") {
      return {
        product: { id: PID, directCategoriesInfo: { categories: [{ id: "kok" }, { id: "mini" }, { id: "maskin" }] } },
      };
    }
    return {
      results: [{ itemMetadata: { item: { catalogItemId: PID }, originalIndex: 0, success: true } }],
      bulkActionMetadata: { undetailedFailures: 0 },
    };
  },
}));

import { POST } from "./route";

function plan(over: Record<string, unknown> = {}) {
  return {
    namn: "vevor-1",
    rader: [
      {
        kort: "3aa888bf",
        pid: PID,
        bort: ["Kök & Husgeråd > Miniugnar & airfryers"],
        behall: ["Kök & Husgeråd", "Kök & Husgeråd > Köksmaskiner & Apparater"],
        ...over,
      },
    ],
  };
}

function req(kropp: unknown, rubriker: Record<string, string> = {}) {
  return { json: async () => kropp, headers: new Headers(rubriker) } as unknown as Parameters<typeof POST>[0];
}

const HEMLIG = "hemlig-testnyckel";
const tidigareSecret = process.env.CRON_SECRET;

beforeEach(() => {
  auktoriserad = false;
  anrop = [];
  wixKastar = null;
  process.env.CRON_SECRET = HEMLIG;
});
afterEach(() => {
  if (tidigareSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = tidigareSecret;
});

const MED_NYCKEL = { authorization: `Bearer ${HEMLIG}` };
const skrivningar = () => anrop.filter((a) => a.sokvag.includes("/remove-items"));

describe("POST /api/admin/kategori-bort", () => {
  it("svarar 401 utan nyckel och rör aldrig Wix", async () => {
    const res = await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }));
    expect(res.status).toBe(401);
    expect(anrop).toHaveLength(0);
  });

  it("☠️ släpper inte in `Bearer undefined` när CRON_SECRET saknas", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }, { authorization: "Bearer undefined" }));
    expect(res.status).toBe(401);
    expect(anrop).toHaveLength(0);
  });

  it("☠️ ett utelämnat eller okänt läge är 400, aldrig ett implicit skriv", async () => {
    for (const lage of [undefined, "", "SKRIV", "radera", 1]) {
      const res = await POST(req({ lage, bekrafta: 1, plan: plan() }, MED_NYCKEL));
      expect(res.status).toBe(400);
    }
    expect(anrop).toHaveLength(0);
  });

  it("☠️ en ogiltig plan når ALDRIG Wix", async () => {
    const res = await POST(req({ lage: "skriv", bekrafta: 1, plan: plan({ behall: [] }) }, MED_NYCKEL));
    expect(res.status).toBe(400);
    expect((await res.json()).fel.join(" ")).toContain("behall");
    expect(anrop).toHaveLength(0);
  });

  it("torrt läge läser och räknar men skriver ingenting", async () => {
    const res = await POST(req({ lage: "torr", plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, lage: "torr", plan: "vevor-1", attTaBort: 1 });
    expect(skrivningar()).toHaveLength(0);
  });

  it("☠️ skriv utan rätt bekrafta skriver ingenting, och strängen \"1\" räknas inte", async () => {
    for (const bekrafta of [undefined, "1", 0, 2]) {
      const res = await POST(req({ lage: "skriv", bekrafta, plan: plan() }, MED_NYCKEL));
      expect(res.status).toBe(200);
      const kropp = await res.json();
      expect(kropp.ok).toBe(false);
      expect(kropp.avbrutet).toMatch(/bekrafta ska vara 1/);
    }
    expect(skrivningar()).toHaveLength(0);
  });

  it("skriver när läget är skriv och antalet stämmer", async () => {
    const res = await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, lage: "skriv", sammanfattning: "1 länkar borttagna, 0 redan borta, 0 fel" });
    expect(skrivningar()).toHaveLength(1);
    expect(skrivningar()[0].sokvag).toBe("/categories/v1/bulk/categories/mini/remove-items");
  });

  it("☠️ ett Wix-fel blir 500, och en artikelnummerform i meddelandet tvättas", async () => {
    // Syntetiskt nummer — inget riktigt artikelnummer får stå i ett test.
    wixKastar = "Wix 500: variant 999-000Z00ZZ saknas";
    const res = await POST(req({ lage: "torr", plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("Wix 500");
    expect(text).not.toContain("999-000Z00ZZ");
  });
});
