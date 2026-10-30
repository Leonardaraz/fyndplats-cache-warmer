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

vi.mock("@/lib/store/reviews", async (importOriginal) => ({
  // Resten av modulen (isVisibleStatus m.fl.) är den riktiga; bara lagret är låtsas.
  ...(await importOriginal<typeof import("@/lib/store/reviews")>()),
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

// Leonard 2026-10-30: inga två recensioner på samma produkt med samma initialer.
describe("recensioner-initialer-slumpa — dubbletter på samma produkt", () => {
  /**
   * prod-3: S.K. på tre rader (den äldsta synliga, d1, behåller dem) och en rad med andra
   * initialer. prod-4: samma initialer som prod-3 men på en annan produkt, ingen krock.
   * prod-5: en avvisad rad upptar ingen plats. prod-6: två kunder med samma initialer, som
   * aldrig ändras. Inget här bryter mot Q/W/X/Y/Z eller bokstavsordningen.
   */
  function dubblettLager(): StoredReview[] {
    return [
      rad({ productId: "prod-3", reviewIdAE: "rev-d1", initials: "S.K.", date: "2026-01-01" }),
      rad({ productId: "prod-3", reviewIdAE: "rev-d2", initials: "S.K.", date: "2026-02-01", status: "pending" }),
      rad({ productId: "prod-3", reviewIdAE: "rev-d3", initials: "S.K.", date: "2026-03-01" }),
      rad({ productId: "prod-3", reviewIdAE: "rev-d4", initials: "M.L.", date: "2026-03-02" }),
      rad({ productId: "prod-4", reviewIdAE: "rev-d5", initials: "S.K." }),
      rad({ productId: "prod-5", reviewIdAE: "rev-d6", initials: "S.K." }),
      rad({ productId: "prod-5", reviewIdAE: "rev-d7", initials: "S.K.", status: "rejected" }),
      rad({ productId: "prod-6", reviewIdAE: "rev-d8", initials: "S.K.", source: "customer" }),
      rad({ productId: "prod-6", reviewIdAE: "rev-d9", initials: "S.K.", source: "customer" }),
    ];
  }
  const pa = (id: string) => varld.rader.find((r) => r.reviewIdAE === id)!;

  beforeEach(() => {
    varld.rader = dubblettLager();
  });

  it("torrt: räknar bara raderna som delar initialer på en produkt, och lämnar resten orört", async () => {
    const json = await (await POST(begaran())).json();
    expect(json).toMatchObject({
      ok: true,
      skarp: false,
      totalt: 2,
      attSkrivaDennaKorning: 2,
      produkter: 1,
      kundDubbletter: 1,
      kundomdomenHoppade: 0,
      ejUnika: 0,
      annanForm: 0,
      perOrsak: { dubblett: 2, bokstavsordning: 0, barForbjuden: 0 },
      perKalla: { import: 2, aosom: 0, vevor: 0, kund: 0 },
      skrivet: null,
      butiken: null,
    });
    expect(typeof json.lasMs).toBe("number");
    expect(json.exempel).toHaveLength(2);
    expect(json.exempel.every((e: string) => /^S\.K\. → .+\..+\.$/u.test(e))).toBe(true);
    expect(varld.skrivna).toHaveLength(0);
    expect(varld.butik).toHaveLength(0);
    // Loggen är publik: varken produkt-id eller recensions-id lämnar rutten.
    const text = JSON.stringify(json);
    expect(text).not.toContain("prod-");
    expect(text).not.toContain("rev-d");
  });

  it("skarpt: dubbletterna får egna initialer, den äldsta synliga behåller sina, och bara den berörda produkten sägs till butiken", async () => {
    const stopp = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    expect(stopp.stopp).toMatch(/bekrafta måste vara 2/);
    expect(varld.skrivna).toHaveLength(0);

    const json = await (await POST(begaran("?skarp=ja&bekrafta=2"))).json();
    expect(json.skrivet).toMatchObject({ andrade: 2, fel: 0, kvar: 0, andratUnderTiden: 0 });

    expect(pa("rev-d1").initials).toBe("S.K.");
    expect(pa("rev-d4").initials).toBe("M.L.");
    for (const id of ["rev-d2", "rev-d3"]) {
      expect(pa(id).initials).not.toBe("S.K.");
      expect(pa(id).initials).toMatch(/^[A-PR-VÅÖ]\.[A-PR-VÅÖ]\.$/u);
      expect(bristerIInitialer(pa(id).initials)).toBeNull();
    }
    const prod3 = varld.rader.filter((r) => r.productId === "prod-3").map((r) => r.initials);
    expect(new Set(prod3).size).toBe(4);

    // Text, betyg och status rörs inte.
    expect(pa("rev-d2")).toMatchObject({ status: "pending", textSwedish: "Bra produkt", rating: 5 });
    expect(pa("rev-d3")).toMatchObject({ status: "approved", textSwedish: "Bra produkt", rating: 5 });
    // Orörda: en annan produkt, en avvisad rad och ett kundpar.
    for (const id of ["rev-d5", "rev-d6", "rev-d7", "rev-d8", "rev-d9"]) expect(pa(id).initials).toBe("S.K.");
    expect(varld.skrivna.map((r) => r.reviewIdAE).sort()).toEqual(["rev-d2", "rev-d3"]);

    expect(varld.butik).toHaveLength(1);
    expect(varld.butik[0].produkter.map((p) => p.id)).toEqual(["prod-3"]);
    expect(json.butiken).toMatchObject({ produkter: 1, anrop: 1, uppdaterade: 1, misslyckade: 0 });
    expect(varld.audit[0][2]).toMatch(/2 recensioner fick nya initialer/);
    expect(varld.audit[0][2]).toMatch(/dubbletter på samma produkt/);
  });

  it("en omkörning efter en skarp körning hittar inga dubbletter, och kundparet räknas fortfarande", async () => {
    await POST(begaran("?skarp=ja&bekrafta=2"));
    const json = await (await POST(begaran())).json();
    expect(json).toMatchObject({ totalt: 0, produkter: 0, kundDubbletter: 1, ejUnika: 0, perOrsak: { dubblett: 0 } });
  });

  it("hogst=1 två gånger gör klart allt, och varje rad ändras en enda gång", async () => {
    const forsta = await (await POST(begaran("?skarp=ja&hogst=1&bekrafta=1"))).json();
    expect(forsta).toMatchObject({ totalt: 2, attSkrivaDennaKorning: 1 });
    expect(forsta.skrivet).toMatchObject({ andrade: 1, kvar: 1 });
    const andra = await (await POST(begaran("?skarp=ja&hogst=1&bekrafta=1"))).json();
    expect(andra).toMatchObject({ totalt: 1, attSkrivaDennaKorning: 1 });
    expect(andra.skrivet).toMatchObject({ andrade: 1, kvar: 0 });

    expect(varld.skrivna.map((r) => r.reviewIdAE).sort()).toEqual(["rev-d2", "rev-d3"]);
    const prod3 = varld.rader.filter((r) => r.productId === "prod-3").map((r) => r.initials);
    expect(new Set(prod3).size).toBe(4);
    expect((await (await POST(begaran())).json()).totalt).toBe(0);
  });

  it("kundomdomen=ja ändrar inte ett kundpar som bara delar initialer: de bryter inte mot reglerna", async () => {
    const json = await (await POST(begaran("?kundomdomen=ja"))).json();
    expect(json).toMatchObject({ totalt: 2, kundDubbletter: 1, perKalla: { kund: 0 } });
  });

  it("en dubblett som också bryter mot reglerna rättas en gång, till initialer som är fria på produkten", async () => {
    varld.rader = [
      rad({ productId: "prod-7", reviewIdAE: "rev-e1", initials: "A.B.", date: "2026-01-01" }),
      rad({ productId: "prod-7", reviewIdAE: "rev-e2", initials: "A.B.", date: "2026-02-01" }),
      rad({ productId: "prod-7", reviewIdAE: "rev-e3", initials: "Z.K.", date: "2026-03-01" }),
    ];
    const torr = await (await POST(begaran())).json();
    expect(torr).toMatchObject({ totalt: 3, produkter: 1, perOrsak: { bokstavsordning: 2, barForbjuden: 1, dubblett: 0 } });
    const json = await (await POST(begaran("?skarp=ja&bekrafta=3"))).json();
    expect(json.skrivet).toMatchObject({ andrade: 3, fel: 0, kvar: 0 });
    const klara = varld.rader.map((r) => r.initials);
    expect(new Set(klara).size).toBe(3);
    for (const i of klara) expect(bristerIInitialer(i)).toBeNull();
    expect((await (await POST(begaran())).json()).totalt).toBe(0);
  });
});
