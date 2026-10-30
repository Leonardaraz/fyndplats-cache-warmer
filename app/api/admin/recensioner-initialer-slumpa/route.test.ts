// Admin-rutten för slumpade initialer: auth, torrt som default, att skarpt kräver
// rätt bekräftelse, att kundomdömen lämnas orörda, och att en skarp körning säger
// till butiken (butikens recensionsbevakning svarade inte 2026-10-29, och de nya
// initialerna syntes inte på produktsidan på timmar).

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";
import { bristerIInitialer } from "@/lib/reviews/initialer";

const varld = vi.hoisted(() => ({
  rader: [] as StoredReview[],
  skrivna: [] as StoredReview[],
  butik: [] as { produkter: { id: string; vad?: string }[]; orsak: string }[],
  butikensUtfall: "uppdaterad" as "uppdaterad" | "misslyckades" | "ingen_nyckel",
  audit: [] as string[][],
}));

vi.mock("@/lib/store/reviews", () => ({
  getReviewStore: () => ({
    listAll: async () => structuredClone(varld.rader),
    upsert: async (r: StoredReview) => {
      varld.skrivna.push(structuredClone(r));
      varld.rader = varld.rader.map((x) => (x.reviewIdAE === r.reviewIdAE ? structuredClone(r) : x));
    },
    listByProduct: async (p: string) => structuredClone(varld.rader.filter((r) => r.productId === p)),
  }),
}));
vi.mock("@/lib/audit", () => ({
  audit: async (...args: string[]) => {
    varld.audit.push(args);
  },
}));
vi.mock("@/lib/headless/produktsidor", () => ({
  uppdateraProduktsidor: async (produkter: { id: string; vad?: string }[], orsak: string) => {
    varld.butik.push({ produkter, orsak });
    return { utfall: varld.butikensUtfall };
  },
}));

import { POST } from "./route";

function begaran(query = "", auth = "Bearer hemligt"): NextRequest {
  return new NextRequest(`https://motor.test/api/admin/recensioner-initialer-slumpa${query}`, {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });
}

function rad(p: Partial<StoredReview>): StoredReview {
  return {
    productId: "prod-1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Bra produkt",
    initials: "Z.K.",
    hasImage: false,
    status: "approved",
    customerNameRaw: "Hemligt Namn",
    ...p,
  };
}

beforeEach(() => {
  process.env.CRON_SECRET = "hemligt";
  varld.rader = [
    rad({ reviewIdAE: "a" }), //                                                    Z: bara förbjuden
    rad({ reviewIdAE: "b", initials: "S.K." }), //                                  i sin ordning
    rad({ reviewIdAE: "c", initials: "W.Y.", status: "pending" }), //               W och Y
    rad({ reviewIdAE: "d", initials: "X.A.", source: "customer" }), //              kundomdöme
    rad({ productId: "prod-2", reviewIdAE: "e", initials: "L.M.", source: "aosom" }), // bokstavsordning
  ];
  varld.skrivna = [];
  varld.butik = [];
  varld.butikensUtfall = "uppdaterad";
  varld.audit = [];
});

describe("recensioner-initialer-slumpa", () => {
  it("fel nyckel ger 401", async () => {
    expect((await POST(begaran("", "Bearer fel"))).status).toBe(401);
  });

  it("torrt som default: räknar, visar exempel och varken skriver eller ringer butiken", async () => {
    const json = await (await POST(begaran())).json();
    expect(json).toMatchObject({
      ok: true,
      skarp: false,
      totalt: 3,
      kundomdomenHoppade: 1,
      skrivet: null,
      butiken: null,
      perOrsak: { bokstavsordning: 1, barForbjuden: 2 },
      perKalla: { aosom: 1, import: 2, kund: 0 },
    });
    expect(json.perBokstav).toEqual({ Q: 0, W: 1, X: 0, Y: 1, Z: 1 });
    expect(json.exempel).toHaveLength(3);
    expect(json.exempel[2]).toMatch(/^L\.M\. → .+\..+\.$/u);
    expect(typeof json.nyaMedAringEllerOumlaut).toBe("number");
    expect(varld.skrivna).toHaveLength(0);
    expect(varld.butik).toHaveLength(0);
  });

  it("skarpt utan rätt bekräftelse skriver ingenting och ringer inte butiken", async () => {
    for (const q of ["?skarp=ja", "?skarp=ja&bekrafta=1", "?skarp=ja&bekrafta=4"]) {
      const json = await (await POST(begaran(q))).json();
      expect(json.stopp).toMatch(/bekrafta måste vara 3/);
    }
    expect(varld.skrivna).toHaveLength(0);
    expect(varld.butik).toHaveLength(0);
  });

  it("skarpt med rätt bekräftelse rättar bokstäverna men inte kundomdömet", async () => {
    const json = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    expect(json.skrivet).toMatchObject({ andrade: 3, fel: 0, kvar: 0, andratUnderTiden: 0 });
    for (const id of ["a", "c", "e"]) {
      expect(bristerIInitialer(varld.rader.find((r) => r.reviewIdAE === id)!.initials)).toBeNull();
    }
    expect(varld.rader.find((r) => r.reviewIdAE === "a")!.initials).toMatch(/^[A-IK-PR-VÅÖ]\.K\.$/u);
    expect(varld.rader.find((r) => r.reviewIdAE === "c")).toMatchObject({ status: "pending", textSwedish: "Bra produkt" });
    expect(varld.rader.find((r) => r.reviewIdAE === "d")!.initials).toBe("X.A.");
    expect(varld.rader.find((r) => r.reviewIdAE === "b")!.initials).toBe("S.K.");
    expect(varld.rader.find((r) => r.reviewIdAE === "e")!.initials).not.toBe("L.M.");
  });

  it("säger till butiken om recensionerna på varje berörd produkt, en gång var", async () => {
    const json = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    expect(varld.butik).toHaveLength(1);
    expect(varld.butik[0].orsak).toBe("initialer-slumpa");
    expect(varld.butik[0].produkter.map((p) => p.id).sort()).toEqual(["prod-1", "prod-2"]);
    // "recensioner" tömmer recensionscachen (tagg recensioner-<id>); utan det bygger butiken
    // om sidan med de gamla recensionerna.
    expect(varld.butik[0].produkter.every((p) => p.vad === "recensioner")).toBe(true);
    expect(json.butiken).toEqual({ produkter: 2, anrop: 1, uppdaterade: 1, misslyckade: 0, utanNyckel: false, hoppade: 0 });
  });

  it("produkt-id:n lämnar aldrig rutten i svaret (loggen är publik)", async () => {
    const json = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    const text = JSON.stringify(json);
    expect(text).not.toContain("prod-1");
    expect(text).not.toContain("prod-2");
    expect(json.skrivet).not.toHaveProperty("skrivnaProdukter");
  });

  it("en butik som inte svarar syns i svaret men fäller inte körningen", async () => {
    varld.butikensUtfall = "misslyckades";
    const json = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    expect(json.ok).toBe(true);
    expect(json.skrivet).toMatchObject({ andrade: 3, fel: 0 });
    expect(json.butiken).toMatchObject({ uppdaterade: 0, misslyckade: 1, utanNyckel: false });
    // Ett omförsök efter en paus innan anropet räknas som misslyckat.
    expect(varld.butik).toHaveLength(2);
  });

  it("utan ADMIN_SECRET i motorn säger svaret att butiken inte blev sagd till", async () => {
    varld.butikensUtfall = "ingen_nyckel";
    const json = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    expect(json.skrivet).toMatchObject({ andrade: 3, fel: 0 });
    expect(json.butiken).toEqual({ produkter: 0, anrop: 0, uppdaterade: 0, misslyckade: 0, utanNyckel: true, hoppade: 2 });
  });

  it("audit-raden bär räknarna för både lagret och butiken", async () => {
    await POST(begaran("?skarp=ja&bekrafta=3"));
    expect(varld.audit).toHaveLength(1);
    const [omrade, handelse, text] = varld.audit[0];
    expect([omrade, handelse]).toEqual(["reviews", "initialer-slumpa"]);
    expect(text).toMatch(/3 recensioner fick nya initialer/);
    expect(text).toMatch(/0 fel/);
    expect(text).toMatch(/butiken: 1\/1 anrop ok/);
  });

  it("inget att ändra: stopp och inget anrop till butiken", async () => {
    varld.rader = [rad({ reviewIdAE: "ok", initials: "S.K." })];
    const json = await (await POST(begaran("?skarp=ja&bekrafta=0"))).json();
    expect(json.stopp).toBe("inget att ändra");
    expect(varld.skrivna).toHaveLength(0);
    expect(varld.butik).toHaveLength(0);
    expect(varld.audit).toHaveLength(0);
  });

  it("en omkörning efter en skarp körning hittar ingenting mer att ändra", async () => {
    await POST(begaran("?skarp=ja&bekrafta=3"));
    const json = await (await POST(begaran())).json();
    expect(json).toMatchObject({ totalt: 0, kundomdomenHoppade: 1 });
  });

  it("hogst kapar vad som skrivs, och bekrafta gäller det kapade antalet", async () => {
    const dry = await (await POST(begaran("?hogst=2"))).json();
    expect(dry).toMatchObject({ totalt: 3, attSkrivaDennaKorning: 2 });
    const json = await (await POST(begaran("?skarp=ja&hogst=2&bekrafta=2"))).json();
    expect(json.skrivet).toMatchObject({ andrade: 2, kvar: 1 });
    expect(varld.skrivna).toHaveLength(2);
  });

  it("kundomdomen=ja tar med kundomdömet", async () => {
    const json = await (await POST(begaran("?kundomdomen=ja"))).json();
    expect(json.totalt).toBe(4);
    expect(json.perKalla.kund).toBe(1);
  });

  it("svaret bär inga råa namn", async () => {
    const text = JSON.stringify(await (await POST(begaran("?skarp=ja&bekrafta=3"))).json());
    expect(text).not.toContain("Hemligt Namn");
  });
});
