import { describe, expect, it } from "vitest";
import { butikAuktoriserad, butiksrad } from "./butiksvy";
import type { AuctionDoc } from "./engine";

const DOK: AuctionDoc = {
  _id: "auction-p1",
  productId: "p1",
  slug: "hundbadd-ljusgra",
  name: "Hundbädd",
  listPrice: 999,
  floorPrice: 719,
  ladder: [999, 979, 949, 919, 879, 839, 799, 769, 749, 729, 719, 719],
  variantPrices: [{ wixVariantId: "v1", listPrice: 999, floorPrice: 719, ladder: [999, 719] }],
  stepMinutes: 60,
  slot: 2,
  status: "live",
  queueOrder: 17,
  startAt: "2026-09-30T05:00:00.000Z",
  lastPatchedPrice: 949,
  lastPatchedStep: 2,
};

describe("☠️ butiksraden är en allowlist — golvet lämnar aldrig motorn", () => {
  it("live: floorPrice, variantPrices, queueOrder och lastPatchedPrice följer INTE med", () => {
    const rad = butiksrad(DOK) as unknown as Record<string, unknown>;
    for (const f of ["floorPrice", "variantPrices", "queueOrder", "lastPatchedPrice", "_id"]) {
      expect(rad, f).not.toHaveProperty(f);
    }
    // Golvet får inte heller smita ut som ett tal någonstans i svaret — utom
    // som stegens sista pris, som butikens server behöver för nedräkningen.
    expect(rad.ladder).toEqual(DOK.ladder);
    expect(rad.lastPatchedStep).toBe(2);
    expect(rad.stepMinutes).toBe(60);
  });

  it("sold: ingen stege alls — butiken behöver den inte för listan över sålda", () => {
    const rad = butiksrad({ ...DOK, status: "sold", endedAt: "2026-09-29T10:00:00.000Z", soldPrice: 949 });
    expect(rad).not.toHaveProperty("ladder");
    expect(rad).not.toHaveProperty("stepMinutes");
    expect(rad).not.toHaveProperty("lastPatchedStep");
    expect(rad.soldPrice).toBe(949);
    expect(rad.endedAt).toBe("2026-09-29T10:00:00.000Z");
  });

  it("serialiserat svar bär inga förbjudna nycklar", () => {
    const sald: AuctionDoc = { ...DOK, status: "sold" };
    const json = JSON.stringify([DOK, sald].map(butiksrad));
    expect(json).not.toMatch(/floorPrice|variantPrices|queueOrder|lastPatchedPrice/);
  });
});

describe("☠️ hemligheten är förtroendegränsen", () => {
  it("ingen hemlighet satt → rutten är avstängd, aldrig öppen", () => {
    expect(butikAuktoriserad("Bearer x", {})).toBe("osatt");
    expect(butikAuktoriserad(null, {})).toBe("osatt");
  });

  it("butikens hemlighet släpps in, fel värde avvisas", () => {
    const env = { REVIEW_INGEST_SECRET: "butik", CRON_SECRET: "cron" };
    expect(butikAuktoriserad("Bearer butik", env)).toBe("ok");
    expect(butikAuktoriserad("Bearer cron", env)).toBe("ok");
    expect(butikAuktoriserad("Bearer fel", env)).toBe("nej");
    expect(butikAuktoriserad(null, env)).toBe("nej");
  });

  it("en tom hemlighet räknas inte — 'Bearer ' får inte bli en nyckel", () => {
    expect(butikAuktoriserad("Bearer ", { REVIEW_INGEST_SECRET: "", CRON_SECRET: "" })).toBe("osatt");
  });

  it("utan butikens hemlighet säger svaret det (503), även om CRON_SECRET finns", () => {
    expect(butikAuktoriserad("Bearer fel", { CRON_SECRET: "cron" })).toBe("osatt");
    expect(butikAuktoriserad("Bearer cron", { CRON_SECRET: "cron" })).toBe("ok");
  });
});
