import { describe, expect, it } from "vitest";
import {
  REMOVED_REDIRECTS,
  type RemovedRedirect,
  findRemovedRedirect,
  toRemovedRedirectsCsv,
  toRemovedRedirectsNextConfig,
  validateRemovedRedirects,
} from "./removed-redirects";

describe("REMOVED_REDIRECTS (källdata)", () => {
  it("är intern konsistent (rätt prefix, inga dubbletter/self-/kedje-redirects)", () => {
    expect(() => validateRemovedRedirects()).not.toThrow();
  });

  it("täcker de sex medvetet borttagna icke-EU-produkterna", () => {
    expect(REMOVED_REDIRECTS).toHaveLength(6);
    const froms = REMOVED_REDIRECTS.map((r) => r.from);
    expect(froms).toContain("/produkt/robust-paraply-med-uv-skydd");
    expect(froms).toContain("/produkt/traningsvastar-for-lag-numrerade-sportvastar");
    expect(froms).toContain("/produkt/vikbar-skotbadd-vattentat-och-portabel-skotmatta");
    expect(froms).toContain("/produkt/vagghangd-utfallbar-kladhangare-i-tra-platsbesparande");
    expect(froms).toContain("/produkt/elektrisk-aggkokare");
    expect(froms).toContain("/produkt/magnetiska-orhangen-clips-utan-hal-zirkonia");
  });

  it("varje rad har en icke-tom reason och targetNote (granskningsbart)", () => {
    for (const r of REMOVED_REDIRECTS) {
      expect(r.reason.trim().length).toBeGreaterThan(0);
      expect(r.targetNote.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("validateRemovedRedirects", () => {
  it("kastar vid fel from-prefix", () => {
    const bad: RemovedRedirect[] = [
      { from: "/kategori/x", to: "/kategori/y", reason: "r", targetNote: "n" },
    ];
    expect(() => validateRemovedRedirects(bad)).toThrow(/from måste/);
  });

  it("kastar vid ogiltigt mål", () => {
    const bad: RemovedRedirect[] = [
      { from: "/produkt/x", to: "https://example.com", reason: "r", targetNote: "n" },
    ];
    expect(() => validateRemovedRedirects(bad)).toThrow(/to måste/);
  });

  it("kastar vid self-redirect", () => {
    const bad: RemovedRedirect[] = [
      { from: "/produkt/x", to: "/produkt/x", reason: "r", targetNote: "n" },
    ];
    expect(() => validateRemovedRedirects(bad)).toThrow(/self-redirect/);
  });

  it("kastar vid dubblett-from", () => {
    const bad: RemovedRedirect[] = [
      { from: "/produkt/x", to: "/kategori/a", reason: "r", targetNote: "n" },
      { from: "/produkt/x", to: "/kategori/b", reason: "r", targetNote: "n" },
    ];
    expect(() => validateRemovedRedirects(bad)).toThrow(/dubblett/);
  });

  it("kastar vid redirect-kedja (målet är också en källa)", () => {
    const bad: RemovedRedirect[] = [
      { from: "/produkt/a", to: "/produkt/b", reason: "r", targetNote: "n" },
      { from: "/produkt/b", to: "/kategori/c", reason: "r", targetNote: "n" },
    ];
    expect(() => validateRemovedRedirects(bad)).toThrow(/kedja/);
  });

  it("accepterar /alla-produkter som giltigt shop-all-mål", () => {
    const ok: RemovedRedirect[] = [
      { from: "/produkt/x", to: "/alla-produkter", reason: "r", targetNote: "n" },
    ];
    expect(() => validateRemovedRedirects(ok)).not.toThrow();
  });
});

describe("findRemovedRedirect", () => {
  it("hittar en känd borttagen produkt", () => {
    const hit = findRemovedRedirect("/produkt/elektrisk-aggkokare");
    expect(hit?.to).toBe("/kategori/koksmaskiner-apparater");
  });

  it("returnerar null för en okänd sökväg", () => {
    expect(findRemovedRedirect("/produkt/finns-inte")).toBeNull();
  });
});

describe("toRemovedRedirectsNextConfig", () => {
  it("genererar Next.js redirects-array med permanent:true", () => {
    const cfg = toRemovedRedirectsNextConfig([
      { from: "/produkt/x", to: "/kategori/y", reason: "r", targetNote: "n" },
    ]);
    expect(cfg).toEqual([{ source: "/produkt/x", destination: "/kategori/y", permanent: true }]);
  });

  it("mappar hela källistan 1:1", () => {
    const cfg = toRemovedRedirectsNextConfig();
    expect(cfg).toHaveLength(REMOVED_REDIRECTS.length);
    for (const row of cfg) {
      expect(row.permanent).toBe(true);
      expect(row.source.startsWith("/produkt/")).toBe(true);
    }
  });
});

describe("toRemovedRedirectsCsv", () => {
  it("inkluderar header + en rad per redirect", () => {
    const csv = toRemovedRedirectsCsv();
    const lines = csv.split("\n");
    expect(lines[0]).toBe("from_url,to_url,reason,target_note");
    expect(lines).toHaveLength(REMOVED_REDIRECTS.length + 1);
  });

  it("citerar och escape:ar celler med komma eller citattecken", () => {
    const csv = toRemovedRedirectsCsv([
      { from: "/produkt/x", to: "/kategori/y", reason: "a, b", targetNote: 'har "citat"' },
    ]);
    expect(csv).toContain('"a, b"');
    expect(csv).toContain('"har ""citat"""');
  });
});
