import { describe, it, expect } from "vitest";
import {
  normalizeTitle,
  levenshtein,
  wordOverlap,
  compareTitles,
  findDuplicates,
} from "./duplicate-check";
import type { ProductHashRecord } from "../store/product-hashes";

describe("text-similarity helpers", () => {
  it("normalizeTitle gemener + tar bort skiljetecken", () => {
    expect(normalizeTitle("USB-Laddbar LED Lampa, 3-pack!")).toBe("usb laddbar led lampa 3 pack");
  });

  it("levenshtein räknar edit-avstånd", () => {
    expect(levenshtein("kalas", "kalas")).toBe(0);
    expect(levenshtein("kalas", "kabas")).toBe(1);
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("wordOverlap = jaccard", () => {
    // {led, lampa, röd} vs {led, lampa, blå} → 2 gemensamma / 4 union = 0.5
    expect(wordOverlap("LED lampa röd", "LED lampa blå")).toBeCloseTo(0.5, 5);
    expect(wordOverlap("helt olika ord här", "ingenting matchar alls")).toBe(0);
  });

  it("compareTitles flaggar nästan identiska titlar (Levenshtein < 5)", () => {
    const s = compareTitles("Trådlös Bluetooth Hörlurar", "Trådlös Bluetooth Hörlur");
    expect(s.levenshtein).toBeLessThan(5);
    expect(s.suspect).toBe(true);
  });

  it("compareTitles flaggar hög ordmängd-overlap (> 70%) trots stort edit-avstånd", () => {
    const s = compareTitles(
      "Smart LED Nattlampa med Rörelsesensor USB",
      "USB Rörelsesensor Nattlampa LED Smart",
    );
    expect(s.overlap).toBeGreaterThan(0.7);
    expect(s.suspect).toBe(true);
  });

  it("compareTitles flaggar INTE helt olika produkter", () => {
    const s = compareTitles("Rostfritt Stål Vattenflaska 1L", "Bluetooth Högtalare Vattentät");
    expect(s.suspect).toBe(false);
  });
});

describe("findDuplicates", () => {
  const records: ProductHashRecord[] = [
    {
      wixProductId: "p1",
      productName: "Trådlös Bluetooth Hörlurar Svart",
      phash: "ffffffff00000000",
      aeProductId: "100500",
      slug: "tradlos-bluetooth-horlurar",
      updatedAt: "2026-06-02",
    },
    {
      wixProductId: "p2",
      productName: "Rostfri Vattenflaska 1 Liter",
      phash: "0f0f0f0f0f0f0f0f",
      aeProductId: "200600",
      updatedAt: "2026-06-02",
    },
  ];

  it("exakt AE-id ger DEFINITIV dubblett (confidence 1.0)", async () => {
    const m = await findDuplicates(
      { title: "Helt annan titel", aliexpressProductId: "100500" },
      { records, candidateHash: null },
    );
    expect(m).toHaveLength(1);
    expect(m[0].wixProductId).toBe("p1");
    expect(m[0].matchType).toBe("aeId");
    expect(m[0].confidence).toBe(1.0);
  });

  it("identisk pHash ger bild-match", async () => {
    const m = await findDuplicates(
      { title: "Nåt annat", aliexpressProductId: "999999" },
      { records, candidateHash: "ffffffff00000000" },
    );
    const img = m.find((x) => x.matchType === "image");
    expect(img?.wixProductId).toBe("p1");
    expect(img!.confidence).toBeGreaterThan(0.9);
  });

  it("pHash långt bort ger ingen bild-match", async () => {
    const m = await findDuplicates(
      { title: "Nåt helt annat unikt", aliexpressProductId: "999999" },
      { records, candidateHash: "0000000000000000" },
    );
    expect(m.find((x) => x.matchType === "image")).toBeUndefined();
  });

  it("liknande titel ger titel-match utan aeId/bild", async () => {
    const m = await findDuplicates(
      { title: "Trådlös Bluetooth Hörlurar Svart" },
      { records, candidateHash: null },
    );
    expect(m[0].wixProductId).toBe("p1");
    expect(m[0].matchType).toBe("title");
    expect(m[0].confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("returnerar tom lista när inget liknar", async () => {
    const m = await findDuplicates(
      { title: "Keramisk Blomkruka Terrakotta 12cm", aliexpressProductId: "777" },
      { records, candidateHash: "123456789abcdef0" },
    );
    expect(m).toHaveLength(0);
  });

  it("behåller starkaste signalen per produkt", async () => {
    // Både aeId OCH titel matchar p1 → bara aeId-matchen (conf 1.0) returneras.
    const m = await findDuplicates(
      { title: "Trådlös Bluetooth Hörlurar Svart", aliexpressProductId: "100500" },
      { records, candidateHash: "ffffffff00000000" },
    );
    const forP1 = m.filter((x) => x.wixProductId === "p1");
    expect(forP1).toHaveLength(1);
    expect(forP1[0].matchType).toBe("aeId");
  });
});
