// Rutten för SEO-titlar på publicerade sidor. Reglerna själva testas i
// lib/polish/seo-titel.test.ts; här låses det rutten lägger till: vem som får
// anropa, att ett utelämnat läge aldrig betyder "skriv", att en ogiltig plan
// aldrig når Wix och att ingenting skrivs i Aosoms synkfönster.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let auktoriserad = false;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));

interface Anrop {
  metod: string;
  sokvag: string;
}
let anrop: Anrop[] = [];
const PID = "1a2b3c4d-0000-4000-8000-000000000001";
vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async (metod: string, sokvag: string, kropp?: unknown) => {
    anrop.push({ metod, sokvag });
    const produkt = {
      id: PID,
      visible: true,
      revision: "7",
      seoData: { tags: [{ type: "title", children: "Gammal titel | Fyndplats" }, { type: "meta", props: { name: "description", content: "Gammal." } }] },
    };
    if (sokvag === "/stores/v3/products/query") return seoSvar([produkt], kropp);
    return { product: metod === "PATCH" ? { revision: "8" } : produkt };
  },
}));

import { seoSvar } from "@/lib/polish/seo-svar.provhjalp";
import { POST } from "./route";

function plan(over: Record<string, unknown> = {}) {
  return {
    namn: "semrush-1",
    rader: [
      {
        kort: "1a2b3c4d",
        pid: PID,
        seoTitel: "Smalt badrumsskåp i bambu, 120 cm | Fyndplats",
        seoBesk: "Smalt badrumsskåp i bambu med öppet fack och lamelldörr. 120 cm högt och 30 cm brett.",
        ...over,
      },
    ],
  };
}

function req(kropp: unknown, rubriker: Record<string, string> = {}) {
  return { json: async () => kropp, headers: new Headers(rubriker) } as unknown as Parameters<typeof POST>[0];
}

const HEMLIG = "hemlig-testnyckel";
const MED_NYCKEL = { authorization: `Bearer ${HEMLIG}` };
const tidigareSecret = process.env.CRON_SECRET;

beforeEach(() => {
  auktoriserad = false;
  anrop = [];
  process.env.CRON_SECRET = HEMLIG;
  // Mitt emellan två synkfönster.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T01:30:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  if (tidigareSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = tidigareSecret;
});

describe("POST /api/admin/seo-titel", () => {
  it("svarar 401 utan nyckel, på fel nyckel och på `Bearer undefined`, och rör aldrig Wix", async () => {
    expect((await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }))).status).toBe(401);
    expect((await POST(req({ lage: "torr", plan: plan() }, { authorization: "Bearer fel" }))).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await POST(req({ lage: "torr", plan: plan() }, { authorization: "Bearer undefined" }))).status).toBe(401);
    expect(anrop).toHaveLength(0);
  });

  it("☠️ ett utelämnat eller okänt läge är 400, aldrig ett implicit skriv", async () => {
    for (const lage of [undefined, "", "skarp", true]) {
      const res = await POST(req({ lage, bekrafta: 1, plan: plan() }, MED_NYCKEL));
      expect(res.status).toBe(400);
    }
    expect(anrop).toHaveLength(0);
  });

  it("☠️ en ogiltig plan når aldrig Wix", async () => {
    const res = await POST(req({ lage: "skriv", bekrafta: 1, plan: plan({ seoTitel: "Utan suffix och alldeles för kort" }) }, MED_NYCKEL));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("ingenting skrivet");
    expect(anrop).toHaveLength(0);
  });

  it("torrt läser och räknar, skarpt skriv skriver med torrens antal", async () => {
    const torr = await (await POST(req({ lage: "torr", plan: plan() }, MED_NYCKEL))).json();
    expect(torr).toMatchObject({ ok: true, lage: "torr", plan: "semrush-1", attSkriva: 1 });
    expect(anrop.some((a) => a.metod === "PATCH")).toBe(false);

    anrop = [];
    const skriv = await (await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }, MED_NYCKEL))).json();
    expect(skriv).toMatchObject({ ok: true, lage: "skriv", attSkriva: 1 });
    expect(anrop.filter((a) => a.metod === "PATCH")).toHaveLength(1);
  });

  it("tar emot tilläggets token lika väl som CRON_SECRET", async () => {
    auktoriserad = true;
    expect((await POST(req({ lage: "torr", plan: plan() }))).status).toBe(200);
  });

  it("☠️ skriver aldrig i Aosoms synkfönster eller när det börjar inom rutans tid", async () => {
    for (const nar of ["2026-11-12T03:15:00Z", "2026-11-12T03:29:59Z", "2026-11-12T03:08:00Z"]) {
      vi.setSystemTime(new Date(nar));
      anrop = [];
      const res = await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }, MED_NYCKEL));
      expect(res.status, nar).toBe(409);
      const kropp = await res.json();
      expect(kropp.error).toContain("synkfonster");
      expect(kropp.efter).toBe("2026-11-12T03:30:00.000Z");
      expect(anrop).toHaveLength(0);
    }
  });

  it("läsningarna får gå i synkfönstret: torrt och verifiera skriver ingenting", async () => {
    vi.setSystemTime(new Date("2026-11-12T03:15:00Z"));
    expect((await POST(req({ lage: "torr", plan: plan() }, MED_NYCKEL))).status).toBe(200);
    expect((await POST(req({ lage: "verifiera", plan: plan() }, MED_NYCKEL))).status).toBe(200);
    expect(anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("efter fönstret skrivs det igen", async () => {
    vi.setSystemTime(new Date("2026-11-12T03:30:00Z"));
    expect((await POST(req({ lage: "skriv", bekrafta: 1, plan: plan() }, MED_NYCKEL))).status).toBe(200);
  });

  it("☠️ svaret bär aldrig planens texter: det går till en publik logg", async () => {
    for (const kropp of [{ lage: "torr", plan: plan() }, { lage: "skriv", bekrafta: 1, plan: plan() }, { lage: "verifiera", plan: plan() }]) {
      const svar = JSON.stringify(await (await POST(req(kropp, MED_NYCKEL))).json());
      expect(svar).not.toContain("badrumsskåp");
      expect(svar).not.toContain("lamelldörr");
    }
  });
});
