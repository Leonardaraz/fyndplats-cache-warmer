import { describe, expect, it } from "vitest";
import { normalizeScore, assembleRanking, type ImageScore } from "./image-rank";

describe("image-rank — normalizeScore", () => {
  it("läser fullständig score + klampar skärpa 1–5", () => {
    const s = normalizeScore("u1", {
      lifestyle: true,
      whiteBg: false,
      sharpness: 9,
      showsFeatures: true,
      role: "lifestyle",
    });
    expect(s.lifestyle).toBe(true);
    expect(s.sharpness).toBe(5);
    expect(s.role).toBe("lifestyle");
    expect(s.score).toBeGreaterThan(0);
  });

  it("defaultar säkert vid trasig/utelämnad data", () => {
    const s = normalizeScore("u1", null);
    expect(s.sharpness).toBe(3);
    expect(s.lifestyle).toBe(false);
    expect(s.whiteBg).toBe(false);
    // role härleds: varken whiteBg eller lifestyle → other
    expect(s.role).toBe("other");
  });

  it("härleder hero-roll från vit bakgrund när role saknas", () => {
    const s = normalizeScore("u1", { whiteBg: true, sharpness: 4 });
    expect(s.role).toBe("hero");
  });
});

describe("image-rank — assembleRanking", () => {
  const mk = (url: string, p: Partial<ImageScore>): ImageScore => ({
    url,
    lifestyle: false,
    whiteBg: false,
    sharpness: 3,
    showsFeatures: false,
    role: "other",
    score: 36,
    ...p,
  });

  it("sätter vit-bg-bilden som hero även om en annan har högre score", () => {
    const scores = [
      mk("lifestyle", { lifestyle: true, role: "lifestyle", score: 90 }),
      mk("white", { whiteBg: true, role: "hero", score: 70 }),
      mk("detail", { role: "detail", score: 50 }),
    ];
    const r = assembleRanking(["lifestyle", "white", "detail"], scores, 8);
    expect(r.orderedUrls[0]).toBe("white"); // hero = vit bg
    expect(r.orderedUrls).toContain("lifestyle");
  });

  it("ordnar hero → lifestyle → detalj → storlek", () => {
    const scores = [
      mk("size", { role: "size", score: 40 }),
      mk("detail", { role: "detail", score: 45 }),
      mk("life", { lifestyle: true, role: "lifestyle", score: 60 }),
      mk("hero", { whiteBg: true, role: "hero", score: 80 }),
    ];
    const r = assembleRanking(["size", "detail", "life", "hero"], scores, 8);
    expect(r.orderedUrls).toEqual(["hero", "life", "detail", "size"]);
  });

  it("kapar till max men behåller minst en", () => {
    const scores = Array.from({ length: 12 }, (_, i) => mk(`u${i}`, { score: 100 - i }));
    const r = assembleRanking(scores.map((s) => s.url), scores, 8);
    expect(r.orderedUrls).toHaveLength(8);
    expect(r.orderedUrls[0]).toBe("u0"); // högst score
  });

  it("entries: behållna = ok, bortvalda = warn (aldrig reject)", () => {
    const scores = Array.from({ length: 10 }, (_, i) => mk(`u${i}`, { score: 100 - i }));
    const urls = scores.map((s) => s.url);
    const r = assembleRanking(urls, scores, 6);
    const kept = r.entries.filter((e) => e.verdict === "ok");
    const dropped = r.entries.filter((e) => e.verdict === "warn");
    expect(kept).toHaveLength(6);
    expect(dropped).toHaveLength(4);
    expect(r.entries.some((e) => e.verdict === "reject")).toBe(false);
  });
});
