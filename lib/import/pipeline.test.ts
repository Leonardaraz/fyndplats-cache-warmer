import { afterEach, describe, expect, it } from "vitest";
import { aiEnrichmentEnabled, deriveOptions, orderImagesByVerdict } from "./pipeline";
import type { AliExpressProduct } from "./types";

// Bug 2026-06-01: storleksvarianter försvann. Den serverdelen (deriveOptions →
// Wix-options) måste producera BÅDA axlarna (Color + Size) när varianterna har
// två dimensioner, annars blir produkten enbart färg i Wix.
describe("deriveOptions — flerdimensionella varianter (Color + Size)", () => {
  const variants: AliExpressProduct["variants"] = [
    { supplierVariantId: "1", options: { Color: "Röd", Size: "S" }, costUsd: 4, included: true },
    { supplierVariantId: "2", options: { Color: "Röd", Size: "M" }, costUsd: 4, included: true },
    { supplierVariantId: "3", options: { Color: "Blå", Size: "S" }, costUsd: 4, included: true },
    { supplierVariantId: "4", options: { Color: "Blå", Size: "M" }, costUsd: 4, included: true },
  ];

  it("härleder båda options-axlarna med unika val", () => {
    const opts = deriveOptions(variants);
    expect(opts.map((o) => o.name).sort()).toEqual(["Color", "Size"]);
    const color = opts.find((o) => o.name === "Color")!;
    const size = opts.find((o) => o.name === "Size")!;
    expect(color.choices.map((c) => c.name).sort()).toEqual(["Blå", "Röd"]);
    expect(size.choices.map((c) => c.name).sort()).toEqual(["M", "S"]);
  });

  it("släpper aldrig en axel även om bara en variant bär den", () => {
    const mixed: AliExpressProduct["variants"] = [
      { supplierVariantId: "1", options: { Color: "Röd", Size: "XL" }, costUsd: 4, included: true },
      { supplierVariantId: "2", options: { Color: "Blå" }, costUsd: 4, included: true },
    ];
    const names = deriveOptions(mixed).map((o) => o.name).sort();
    expect(names).toEqual(["Color", "Size"]);
  });
});

// Bug (gazebo): AE-säljare lägger storlekar (2–15 L) under "Color"-fältet, varje med
// en bild → samplas till nästan identiska gråa colorCodes → publicerades som 5 gråa
// swatchar döpta "Färg". colorCode får bara följa med för EN ÄKTA färgaxel.
describe("deriveOptions — färg-swatch bara för äkta färgaxlar", () => {
  it("storlekar under 'Färg' med (gråa) colorCodes blir TEXT, inte färg-swatch", () => {
    const variants: AliExpressProduct["variants"] = [
      { supplierVariantId: "1", options: { Färg: "2 L" }, costUsd: 4, included: true },
      { supplierVariantId: "2", options: { Färg: "15 L" }, costUsd: 4, included: true },
    ];
    const codes = { Färg: { "2 L": "#4e657a", "15 L": "#4c6073" } };
    const farg = deriveOptions(variants, codes).find((o) => o.name === "Färg")!;
    expect(farg.choices.every((c) => c.colorCode === undefined)).toBe(true); // → TEXT_CHOICES i Wix
  });
  it("riktiga färger behåller colorCode (förblir färg-swatch)", () => {
    const variants: AliExpressProduct["variants"] = [
      { supplierVariantId: "1", options: { Färg: "Röd" }, costUsd: 4, included: true },
      { supplierVariantId: "2", options: { Färg: "Blå" }, costUsd: 4, included: true },
    ];
    const codes = { Färg: { Röd: "#CC2222", Blå: "#2233CC" } };
    const farg = deriveOptions(variants, codes).find((o) => o.name === "Färg")!;
    expect(farg.choices.find((c) => c.name === "Röd")!.colorCode).toBe("#CC2222");
  });
});

describe("orderImagesByVerdict", () => {
  it("demotes warns after oks and rejects last, preserving order within groups", () => {
    const urls = ["a", "b", "c", "d", "e"];
    const verdicts = [
      { url: "a", verdict: "warn" as const, reason: "lite text" },
      { url: "b", verdict: "ok" as const, reason: "" },
      { url: "c", verdict: "reject" as const, reason: "vattenstämpel" },
      { url: "d", verdict: "ok" as const, reason: "" },
      { url: "e", verdict: "warn" as const, reason: "låg kvalitet" },
    ];
    // Rejects tas INTE bort längre — de hamnar bara sist (bug 2026-05-31).
    expect(orderImagesByVerdict(urls, verdicts)).toEqual(["b", "d", "a", "e", "c"]);
  });

  it("keeps all images even when every image is rejected (never returns empty)", () => {
    const urls = ["a", "b", "c"];
    const verdicts = [
      { url: "a", verdict: "reject" as const, reason: "x" },
      { url: "b", verdict: "reject" as const, reason: "y" },
      { url: "c", verdict: "reject" as const, reason: "z" },
    ];
    expect(orderImagesByVerdict(urls, verdicts)).toEqual(["a", "b", "c"]);
  });

  it("returns all input when no verdicts (fail-open)", () => {
    expect(orderImagesByVerdict(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("treats unknown URL verdicts as ok", () => {
    const verdicts = [{ url: "x", verdict: "reject" as const, reason: "" }];
    expect(orderImagesByVerdict(["a", "b"], verdicts)).toEqual(["a", "b"]);
  });
});

// AI_ENRICHMENT_ENABLED master-switch (2026-06-02): default på; env "false" stänger
// av all AI; ett explicit flags.enableAI vinner alltid över env (default men inte hård).
describe("aiEnrichmentEnabled", () => {
  const prev = process.env.AI_ENRICHMENT_ENABLED;
  afterEach(() => {
    if (prev === undefined) delete process.env.AI_ENRICHMENT_ENABLED;
    else process.env.AI_ENRICHMENT_ENABLED = prev;
  });

  it("defaultar PÅ när env saknas", () => {
    delete process.env.AI_ENRICHMENT_ENABLED;
    expect(aiEnrichmentEnabled()).toBe(true);
    expect(aiEnrichmentEnabled({})).toBe(true);
  });

  it("stängs AV av env=false (case-insensitive)", () => {
    process.env.AI_ENRICHMENT_ENABLED = "false";
    expect(aiEnrichmentEnabled()).toBe(false);
    process.env.AI_ENRICHMENT_ENABLED = "FALSE";
    expect(aiEnrichmentEnabled()).toBe(false);
  });

  it("är PÅ för andra env-värden (true/1/tomt-icke-false)", () => {
    process.env.AI_ENRICHMENT_ENABLED = "true";
    expect(aiEnrichmentEnabled()).toBe(true);
    process.env.AI_ENRICHMENT_ENABLED = "1";
    expect(aiEnrichmentEnabled()).toBe(true);
  });

  it("explicit flags.enableAI vinner över env (PÅ trots env=false)", () => {
    process.env.AI_ENRICHMENT_ENABLED = "false";
    expect(aiEnrichmentEnabled({ enableAI: true })).toBe(true);
  });

  it("explicit flags.enableAI vinner över env (AV trots env=true)", () => {
    process.env.AI_ENRICHMENT_ENABLED = "true";
    expect(aiEnrichmentEnabled({ enableAI: false })).toBe(false);
  });

  it("faller tillbaka på env när andra flaggor satta men enableAI saknas", () => {
    process.env.AI_ENRICHMENT_ENABLED = "false";
    expect(aiEnrichmentEnabled({ seo: true, imageAnalysis: true })).toBe(false);
  });
});
