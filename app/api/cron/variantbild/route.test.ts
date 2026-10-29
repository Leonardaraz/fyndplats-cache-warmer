// Rutten för variantbildskollen. Logiken testas i lib/wix/variantbild-koll.test.ts;
// här: vilken nivå ett ofullständigt svep loggas på. Workflowen delar listan i
// skivor om 60, och varje skiva utom den sista loggades som felet "tidsbudgeten
// tog slut" (20 fel i Vercel 14–28 oktober 2026, inget av dem från nattens cron).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { KollRapport } from "@/lib/wix/variantbild-koll";

vi.mock("@/lib/auth", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));
vi.mock("@/lib/polish/skrivplan-wix", () => ({ skapaWixAnrop: () => async () => ({}) }));

let rapport: KollRapport;
vi.mock("@/lib/wix/variantbild-koll", () => ({ korVariantbildKoll: async () => rapport }));

import { GET } from "./route";

function rapportMed(over: Partial<KollRapport>): KollRapport {
  return {
    torr: true,
    utkast: true,
    medVal: 4,
    flervariant: 3,
    start: 0,
    kontrollerade: 3,
    nasta: null,
    fullstandig: true,
    stoppad: false,
    slutade: "klar",
    summa: { ratt: 3 },
    medFelBild: { publicerade: 0, utkast: 0, varianter: 0 },
    produkter: [],
    ...over,
  };
}

const anrop = (q = "") => GET(new NextRequest(`https://x.test/api/cron/variantbild${q}`));

describe("/api/cron/variantbild", () => {
  let fel: ReturnType<typeof vi.spyOn>;
  let info: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fel = vi.spyOn(console, "error").mockImplementation(() => {});
    info = vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  const felrader = () => fel.mock.calls.map((c) => String(c[0]));
  const inforader = () => info.mock.calls.map((c) => String(c[0]));

  it("☠️ en skiva som nått sin gräns är inget fel", async () => {
    rapport = rapportMed({ kontrollerade: 60, nasta: 60, fullstandig: false, slutade: "grans" });
    const svar = await anrop("?start=0&limit=60");
    expect(svar.status).toBe(200);
    expect(felrader()).toEqual([]);
    expect(inforader()).toContain("[variantbild] skivan klar, fortsätt med ?start=60");
  });

  it("☠️ en körning som tagit slut på tid loggas som fel", async () => {
    rapport = rapportMed({ kontrollerade: 500, nasta: 500, fullstandig: false, slutade: "tid" });
    const svar = await anrop("?dryRun=false");
    expect(svar.status).toBe(200);
    expect(felrader()).toEqual(["[variantbild] OFULLSTÄNDIG: tidsbudgeten tog slut, fortsätt med ?start=500"]);
  });

  it("☠️ en avvikelse loggas som fel och svarar 500", async () => {
    rapport = rapportMed({ nasta: 2, fullstandig: false, stoppad: true, slutade: "avvikelse", summa: { avvikelse: 1, torr: 1 } });
    const svar = await anrop("?dryRun=false");
    expect(svar.status).toBe(500);
    expect(felrader()).toEqual(["[variantbild] OFULLSTÄNDIG: stoppad av en avvikelse, fortsätt med ?start=2"]);
  });

  it("en hel körning loggar inget fel", async () => {
    rapport = rapportMed({});
    const svar = await anrop("?dryRun=false");
    expect(svar.status).toBe(200);
    expect(felrader()).toEqual([]);
  });
});
