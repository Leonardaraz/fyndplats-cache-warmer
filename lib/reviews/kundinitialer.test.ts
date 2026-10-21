// Initialer på kundomdömen utan namn. Det som testas är riktningarna där ett
// fel syns på produktsidan:
//
//   1. Regeln ska ge samma initialer som butikens initialsFromName.
//   2. Ett omdöme ska aldrig byta status när initialerna skrivs.
//   3. En rad räknas som rättad först när den läses tillbaka rätt.

import { describe, expect, it, vi } from "vitest";
import type { StoredReview } from "@/lib/store/reviews";
import {
  initialerAvNamn,
  kundnamnPaOrder,
  orderIdForOmdome,
  rattaKundinitialer,
  saknarInitialer,
  UTAN_NAMN,
  type KundinitialerDeps,
} from "./kundinitialer";

function rad(over: Partial<StoredReview> & { orderId?: string } = {}): StoredReview & { orderId?: string } {
  return {
    productId: "prod-1",
    reviewIdAE: "kund-order-1-prod-1",
    rating: 5,
    textOriginal: "Snabb leverans.",
    textSwedish: "Snabb leverans.",
    initials: UTAN_NAMN,
    hasImage: false,
    status: "approved",
    source: "customer",
    orderId: "order-1",
    ...over,
  };
}

describe("saknarInitialer", () => {
  it.each([[""], ["   "], [UTAN_NAMN], [undefined]])("%j saknar initialer", (v) => {
    expect(saknarInitialer(v)).toBe(true);
  });

  it("riktiga initialer behålls", () => {
    expect(saknarInitialer("S.S.")).toBe(false);
  });
});

describe("initialerAvNamn — samma regel som butikens initialsFromName", () => {
  it.each([
    ["Sol Svensson", "S.S."],
    ["sol svensson", "S.S."],
    ["Åsa Öberg", "Å.Ö."],
    ["Sol Maria Svensson Berg", "S.B."],
    ["Sol", "S."],
    ["  Sol   Svensson  ", "S.S."],
  ])("%j → %j", (namn, vantat) => {
    expect(initialerAvNamn(namn)).toBe(vantat);
  });

  it.each([[""], ["   "], ["123"], ["123 Svensson"]])("%j ger inga initialer", (namn) => {
    expect(initialerAvNamn(namn)).toBeNull();
  });
});

describe("kundnamnPaOrder — köparen först", () => {
  it("tar faktureringsuppgifterna före mottagaren och leveransadressen", () => {
    expect(
      kundnamnPaOrder({
        billingInfo: { contactDetails: { firstName: "Sol", lastName: "Svensson" } },
        recipientInfo: { contactDetails: { firstName: "Mottagare", lastName: "Annan" } },
      }),
    ).toBe("Sol Svensson");
  });

  it("faller tillbaka på mottagaren och sedan leveransadressen", () => {
    expect(kundnamnPaOrder({ recipientInfo: { contactDetails: { firstName: "Mia", lastName: "Ek" } } })).toBe("Mia Ek");
    expect(
      kundnamnPaOrder({
        shippingInfo: { logistics: { shippingDestination: { contactDetails: { firstName: "Bo", lastName: "Al" } } } },
      }),
    ).toBe("Bo Al");
  });

  it("utan namn blir det tomt", () => {
    expect(kundnamnPaOrder({ billingInfo: { contactDetails: { firstName: " ", lastName: "" } } })).toBe("");
  });
});

describe("orderIdForOmdome", () => {
  it("läser fältet när det finns", () => {
    expect(orderIdForOmdome(rad({ orderId: "abc" }))).toBe("abc");
  });

  it("annars ur radens id, kund-<order>-<produkt>", () => {
    const r = rad({ orderId: undefined, productId: "p-9", reviewIdAE: "kund-4f8c-90db-p-9" });
    expect(orderIdForOmdome(r)).toBe("4f8c-90db");
  });

  it("ett importerat omdöme har inget", () => {
    expect(orderIdForOmdome(rad({ orderId: undefined, reviewIdAE: "8000123456" }))).toBeNull();
  });
});

function deps(rader: StoredReview[], namn: Record<string, string | null>) {
  const lagret = new Map(rader.map((r) => [`${r.productId}__${r.reviewIdAE}`, { ...r }]));
  const d: KundinitialerDeps = {
    rader,
    upsert: vi.fn(async (r: StoredReview) => {
      lagret.set(`${r.productId}__${r.reviewIdAE}`, { ...r });
    }),
    lasOm: async (p, id) => lagret.get(`${p}__${id}`) ?? null,
    kundnamn: vi.fn(async (orderId: string) => {
      if (!(orderId in namn)) throw new Error("Wix nere");
      return namn[orderId];
    }),
  };
  return { d, lagret };
}

describe("rattaKundinitialer", () => {
  it("torrt skriver ingenting men räknar det som kan rättas", async () => {
    const { d } = deps([rad()], { "order-1": "Sol Svensson" });
    const svar = await rattaKundinitialer(d, { skarp: false });
    expect(d.upsert).not.toHaveBeenCalled();
    expect(svar).toMatchObject({ attRatta: 1, kanRattas: 1, rattade: 0, produkter: ["prod-1"] });
  });

  it("☠️ skarpt skriver initialerna och behåller statusen", async () => {
    const { d, lagret } = deps([rad({ status: "approved" })], { "order-1": "Sol Svensson" });
    const svar = await rattaKundinitialer(d, { skarp: true });
    expect(svar).toMatchObject({ rattade: 1, fel: 0 });
    const efter = lagret.get("prod-1__kund-order-1-prod-1")!;
    expect(efter.initials).toBe("S.S.");
    expect(efter.status).toBe("approved");
  });

  it("☠️ ett väntande omdöme blir inte synligt", async () => {
    const { d, lagret } = deps([rad({ status: "pending" })], { "order-1": "Sol Svensson" });
    await rattaKundinitialer(d, { skarp: true });
    expect(lagret.get("prod-1__kund-order-1-prod-1")!.status).toBe("pending");
  });

  it("rör bara kundomdömen som saknar initialer", async () => {
    const importerad = rad({ source: undefined, reviewIdAE: "8000123456" });
    const medNamn = rad({ initials: "L.M.", reviewIdAE: "kund-order-2-prod-1", orderId: "order-2" });
    const { d } = deps([importerad, medNamn], {});
    const svar = await rattaKundinitialer(d, { skarp: true });
    expect(svar).toMatchObject({ granskade: 2, kundomdomen: 1, attRatta: 0 });
    expect(d.kundnamn).not.toHaveBeenCalled();
  });

  it("ordern finns inte, eller saknar namn: raden lämnas", async () => {
    const r1 = rad();
    const r2 = rad({ reviewIdAE: "kund-order-2-prod-1", orderId: "order-2" });
    const { d } = deps([r1, r2], { "order-1": null, "order-2": "123" });
    const svar = await rattaKundinitialer(d, { skarp: true });
    expect(svar).toMatchObject({ orderSaknas: 1, utanNamn: 1, rattade: 0 });
    expect(d.upsert).not.toHaveBeenCalled();
  });

  it("ett fel mot Wix räknas, och nästa rad rättas ändå", async () => {
    const r1 = rad({ orderId: "trasig", reviewIdAE: "kund-trasig-prod-1" });
    const r2 = rad({ productId: "prod-2", reviewIdAE: "kund-order-2-prod-2", orderId: "order-2" });
    const { d } = deps([r1, r2], { "order-2": "Mia Ek" });
    const svar = await rattaKundinitialer(d, { skarp: true });
    expect(svar).toMatchObject({ fel: 1, rattade: 1, produkter: ["prod-2"] });
  });

  it("☠️ en skrivning som inte läses tillbaka rätt räknas som fel", async () => {
    const { d } = deps([rad()], { "order-1": "Sol Svensson" });
    d.lasOm = async () => rad({ initials: UTAN_NAMN });
    const svar = await rattaKundinitialer(d, { skarp: true });
    expect(svar).toMatchObject({ rattade: 0, fel: 1, produkter: [] });
  });
});
