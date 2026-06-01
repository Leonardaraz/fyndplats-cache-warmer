import { describe, it, expect } from "vitest";
import { pHashFromGrayscale, hammingDistanceHex } from "./phash";

/** Bygger en 32×32 gråskalematris från en generatorfunktion. */
function gray(fn: (x: number, y: number) => number, size = 32): number[] {
  const out: number[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) out.push(fn(x, y));
  return out;
}

describe("pHashFromGrayscale", () => {
  it("ger 16 hex-tecken (64 bitar)", () => {
    const h = pHashFromGrayscale(gray((x) => (x * 8) % 256));
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });

  it("identiska bilder → avstånd 0", () => {
    const img = gray((x, y) => (x * 7 + y * 13) % 256);
    const a = pHashFromGrayscale(img);
    const b = pHashFromGrayscale(img);
    expect(hammingDistanceHex(a, b)).toBe(0);
  });

  it("en liten brusförändring ger litet avstånd", () => {
    const base = gray((x, y) => (x * 7 + y * 13) % 256);
    const noisy = base.map((v, i) => (i % 64 === 0 ? Math.min(255, v + 4) : v));
    const d = hammingDistanceHex(pHashFromGrayscale(base), pHashFromGrayscale(noisy));
    expect(d).toBeLessThan(10);
  });

  it("helt olika bilder ger stort avstånd", () => {
    const gradient = gray((x) => x * 8);
    const checker = gray((x, y) => ((x + y) % 2 === 0 ? 0 : 255));
    const d = hammingDistanceHex(pHashFromGrayscale(gradient), pHashFromGrayscale(checker));
    expect(d).toBeGreaterThan(10);
  });

  it("kastar vid fel pixelantal", () => {
    expect(() => pHashFromGrayscale([1, 2, 3])).toThrow();
  });
});

describe("hammingDistanceHex", () => {
  it("räknar skilda bitar", () => {
    expect(hammingDistanceHex("00", "0f")).toBe(4);
    expect(hammingDistanceHex("ff", "ff")).toBe(0);
    expect(hammingDistanceHex("ffffffffffffffff", "0000000000000000")).toBe(64);
  });

  it("olika längd → Infinity", () => {
    expect(hammingDistanceHex("ff", "ffff")).toBe(Infinity);
  });
});
