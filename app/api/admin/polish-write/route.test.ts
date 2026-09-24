// Skrivrutten för poleringen. Stegen själva testas i lib/polish/skrivplan.test.ts;
// här låses det rutten lägger till: vem som får anropa, att en ogiltig plan
// aldrig når Wix, och att ett utelämnat `dryRun` betyder torrt — aldrig skriv.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fnv1a64 } from "@/lib/polish/skrivplan";

let auktoriserad = false;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));

interface Anrop {
  metod: string;
  sokvag: string;
  kropp?: unknown;
}
let anrop: Anrop[] = [];
let wixKastar = false;
vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async (metod: string, sokvag: string, kropp?: unknown) => {
    anrop.push({ metod, sokvag, kropp });
    if (wixKastar) throw new Error("Wix 503: nere");
    if (sokvag.startsWith("/categories/v1/categories/query")) {
      return { categories: [{ id: "kat-hem", name: "Hem & Inredning" }] };
    }
    return { product: { id: "1a2b3c4d-0000-4000-8000-000000000001", revision: "7", visible: false } };
  },
}));

import { POST } from "./route";

const HTML = "<p>Hej.</p>";

function plan(over: Record<string, unknown> = {}) {
  return {
    runda: "runda-t1-test",
    produkter: [
      {
        kort: "1a2b3c4d",
        pid: "1a2b3c4d-0000-4000-8000-000000000001",
        namn: "Testbord i ek",
        slug: "testbord-ek",
        html: HTML,
        seoTitel: "Testbord i ek | Fyndplats",
        seoBesk: "Ett testbord i ek.",
        media: [{ id: `b379ce_${"0".repeat(32)}~mv2.jpg`, altText: "Testbordet framifrån" }],
        kat: ["Hem & Inredning"],
        sku: "FP-testbord-ek",
        variantId: "2b3c4d5e-0000-4000-8000-000000000002",
        textHash: fnv1a64(HTML),
        textTecken: HTML.length,
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
  wixKastar = false;
  process.env.CRON_SECRET = HEMLIG;
});
afterEach(() => {
  if (tidigareSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = tidigareSecret;
});

const MED_NYCKEL = { authorization: `Bearer ${HEMLIG}` };

describe("POST /api/admin/polish-write", () => {
  it("svarar 401 utan nyckel och rör aldrig Wix", async () => {
    const res = await POST(req({ steg: "text", dryRun: false, plan: plan() }));
    expect(res.status).toBe(401);
    expect(anrop).toHaveLength(0);
  });

  it("svarar 401 på fel nyckel", async () => {
    const res = await POST(req({ steg: "text", plan: plan() }, { authorization: "Bearer fel" }));
    expect(res.status).toBe(401);
    expect(anrop).toHaveLength(0);
  });

  it("☠️ släpper inte in `Bearer undefined` när CRON_SECRET saknas", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req({ steg: "text", plan: plan() }, { authorization: "Bearer undefined" }));
    expect(res.status).toBe(401);
    expect(anrop).toHaveLength(0);
  });

  it("tar emot tilläggets token lika väl som CRON_SECRET", async () => {
    auktoriserad = true;
    const res = await POST(req({ steg: "text", plan: plan() }));
    expect(res.status).toBe(200);
  });

  it("vägrar ett okänt steg med 400", async () => {
    const res = await POST(req({ steg: "allt", plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(400);
    expect(anrop).toHaveLength(0);
  });

  it("☠️ en ogiltig plan når ALDRIG Wix", async () => {
    const res = await POST(req({ steg: "text", dryRun: false, plan: plan({ slug: "Fel Slug" }) }, MED_NYCKEL));
    expect(res.status).toBe(400);
    const kropp = await res.json();
    expect(kropp.fel.join(" ")).toContain("slug");
    expect(anrop).toHaveLength(0);
  });

  it("☠️ en plan med artikelnummerform vägras, och svaret citerar inte träffen", async () => {
    // Syntetiskt nummer — inget riktigt artikelnummer får stå i ett test.
    const res = await POST(
      req({ steg: "text", dryRun: false, plan: plan({ namn: "Testbord 999-000Z00ZZ" }) }, MED_NYCKEL),
    );
    expect(res.status).toBe(400);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("artikelnummerform");
    expect(text).not.toContain("999-000Z00ZZ");
    expect(anrop).toHaveLength(0);
  });

  it("☠️ ett utelämnat dryRun är en torrkörning — ingen PATCH", async () => {
    const res = await POST(req({ steg: "text", plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(200);
    const kropp = await res.json();
    expect(kropp.dryRun).toBe(true);
    expect(anrop.map((a) => a.metod)).toEqual(["GET"]);
  });

  it("☠️ strängen \"false\" är INTE false — fortfarande torrt", async () => {
    const res = await POST(req({ steg: "text", dryRun: "false", plan: plan() }, MED_NYCKEL));
    expect((await res.json()).dryRun).toBe(true);
    expect(anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("skriver bara när dryRun är uttryckligen false", async () => {
    const res = await POST(req({ steg: "text", dryRun: false, plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(200);
    const kropp = await res.json();
    expect(kropp).toMatchObject({ ok: true, steg: "text", dryRun: false, runda: "runda-t1-test" });
    expect(anrop.map((a) => a.metod)).toEqual(["GET", "PATCH"]);
  });

  it("ett fel före produktloopen blir 500 med meddelandet", async () => {
    wixKastar = true;
    const res = await POST(req({ steg: "kategorier", dryRun: false, plan: plan() }, MED_NYCKEL));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("Wix 503");
  });
});
