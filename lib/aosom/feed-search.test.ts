import { describe, it, expect } from "vitest";
import { delaFraga, sokFeed, MAX_TRAFFAR } from "./feed-search";
import type { AosomRow } from "./feed";

const FX = 11;

function rad(over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku: "D51-545V00BK",
    name: "PawHut Freigehege Freilaufgehege mit 12 Paneel Laufstall für Kleintiere",
    url: "https://www.aosom.de/p/D51-545V00BK",
    imageUrls: [],
    category: "",
    color: "",
    material: "",
    size: "",
    packageSize: "",
    weightKg: 5,
    descriptionHtml: "",
    bulletsHtml: "",
    qty: 83,
    normalPriceEur: 120,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

describe("delaFraga", () => {
  it("delar på mellanslag och komma och gemener:ar", () => {
    expect(delaFraga("  24  Paneel, Laufstall ")).toEqual(["24", "paneel", "laufstall"]);
  });
});

describe("sokFeed", () => {
  it("matchar termerna var för sig, oberoende av ordföljd", () => {
    const r = sokFeed([rad()], "laufstall paneel", FX);
    expect(r.traffar).toBe(1);
  });

  it("kräver ATT ALLA termer finns (AND, inte OR)", () => {
    const r = sokFeed([rad()], "paneel hundbur", FX);
    expect(r.traffar).toBe(0);
  });

  it("matchar delsträng för text — annars träffar tyska sammansättningar aldrig", () => {
    expect(sokFeed([rad()], "gehege", FX).traffar).toBe(1);
  });

  it("☠️ matchar siffror som HELA ord", () => {
    // Utan ordgränsen träffar "24" också "124 cm" och drunknar i måttangivelser.
    const matt = rad({ sku: "X1", name: "Laufstall Paneel 124 x 60 cm" });
    expect(sokFeed([matt], "24 paneel", FX).traffar).toBe(0);
    const akta = rad({ sku: "X2", name: "Laufstall mit 24 Paneel" });
    expect(sokFeed([akta], "24 paneel", FX).traffar).toBe(1);
  });

  it("söker även i artikelnumret", () => {
    expect(sokFeed([rad()], "D51-545V00BK", FX).traffar).toBe(1);
  });

  it("utelämnar rader som inte går att skicka till Sverige", () => {
    // qty 0 ⇒ isShippableToSe falsk
    const r = sokFeed([rad({ qty: 0 })], "paneel", FX);
    expect(r.traffar).toBe(0);
  });

  it("tar med oskeppbara när anroparen ber om det", () => {
    const r = sokFeed([rad({ qty: 0 })], "paneel", FX, { endastSkeppbara: false });
    expect(r.traffar).toBe(1);
    expect(r.visade[0].skeppbarTillSe).toBe(false);
  });

  it("sorterar billigast landat först", () => {
    const dyr = rad({ sku: "DYR", wholesaleEur: 200 });
    const billig = rad({ sku: "BILLIG", wholesaleEur: 10 });
    const r = sokFeed([dyr, billig], "paneel", FX);
    expect(r.visade.map((t) => t.sku)).toEqual(["BILLIG", "DYR"]);
  });

  it("kapar långa träfflistor och säger att den gjort det", () => {
    const manga = Array.from({ length: MAX_TRAFFAR + 5 }, (_, i) =>
      rad({ sku: `S${i}`, wholesaleEur: 10 + i }));
    const r = sokFeed(manga, "paneel", FX);
    expect(r.traffar).toBe(MAX_TRAFFAR + 5);
    expect(r.visade).toHaveLength(MAX_TRAFFAR);
    expect(r.kapad).toBe(true);
  });

  it("tom fråga ger noll träffar, inte hela feeden", () => {
    const r = sokFeed([rad()], "   ", FX);
    expect(r.traffar).toBe(0);
    expect(r.visade).toEqual([]);
  });

  it("räknar landat pris inklusive moms, som huset lagrar det", () => {
    // (40 + 20) × 11 × 1,25 = 825
    const r = sokFeed([rad()], "paneel", FX);
    expect(r.visade[0].landatSek).toBeCloseTo(825, 2);
  });
});
