import { describe, expect, it } from "vitest";
import {
  MemorySnapshotStore,
  detectRegression,
  diffSnapshots,
  type ScanSnapshot,
} from "./history";

function snap(overall: number, a11y: number, scannedAt = "2026-01-01T00:00:00Z"): ScanSnapshot {
  return {
    url: "https://x.se/",
    scannedAt,
    overall,
    eaaRisk: a11y >= 80 ? "Låg" : a11y >= 50 ? "Medel" : "Hög",
    categories: [
      { category: "accessibility", label: "Tillgänglighet (EAA)", score: a11y },
      { category: "seo", label: "SEO & teknik", score: 90 },
    ],
  };
}

describe("diffSnapshots", () => {
  it("computes overall and per-category delta", () => {
    const d = diffSnapshots(snap(60, 50), snap(70, 65));
    expect(d.overallDelta).toBe(10);
    expect(d.categories.find((c) => c.category === "accessibility")!.delta).toBe(15);
  });
});

describe("detectRegression", () => {
  it("flags a drop in overall", () => {
    const r = detectRegression(snap(80, 80), snap(70, 80));
    expect(r.regressed).toBe(true);
    expect(r.overallDelta).toBe(-10);
  });
  it("flags a per-category drop even if overall is stable", () => {
    const r = detectRegression(snap(80, 90), snap(80, 80));
    expect(r.regressed).toBe(true);
    expect(r.drops.some((d) => d.category === "accessibility")).toBe(true);
  });
  it("does not flag small changes under threshold", () => {
    expect(detectRegression(snap(80, 80), snap(78, 78)).regressed).toBe(false);
  });
});

describe("MemorySnapshotStore", () => {
  it("records, returns newest-first history, latest and tracked urls", async () => {
    const store = new MemorySnapshotStore();
    await store.record(snap(60, 50, "2026-01-01T00:00:00Z"));
    await store.record(snap(70, 65, "2026-02-01T00:00:00Z"));
    const hist = await store.history("https://x.se/");
    expect(hist).toHaveLength(2);
    expect(hist[0].overall).toBe(70); // nyast först
    expect((await store.latest("https://x.se/"))!.overall).toBe(70);
    expect(await store.trackedUrls()).toEqual(["https://x.se/"]);
  });
});
