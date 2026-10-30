// Flera bilder per val (product.valBilder, VEVOR-familjerna 2026-10-30): varje val
// får sina egna bilder ur galleriet, i sin ordning, med en egen alt-text som är
// kopplingens matchningsnyckel. Ingen bild laddas upp två gånger.
//
// Samma scaffolding som pipeline-deselected.test.ts: Wix, media, audit och AI
// mockas, och importen körs i rå-läge utan variant-AI eller backfills.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

vi.mock("../claude/client", () => ({
  analyzeImages: vi.fn(async (urls: string[]) => urls.map((url) => ({ url, verdict: "ok" as const, reason: "" }))),
  suggestCategory: vi.fn(async () => ({ collectionSlug: null, confidence: 0, reason: "" })),
  completeJsonRouted: vi.fn(),
  TEXT_MODEL: "claude-haiku-4-5-20251001",
}));
vi.mock("./generate", () => ({ generateProductContent: vi.fn() }));

interface CreatedInput {
  mediaItems?: { id?: string; url: string; altText?: string }[];
}
const { createProduct, linkChoiceMedia, importMediaUrls, importMediaByUrl } = vi.hoisted(() => ({
  createProduct: vi.fn(async (input: { slug?: string; variants?: { sku: string }[] }) => ({
    id: "wix-prod-1",
    slug: input.slug || "produkt",
    revision: "1",
    variants: (input.variants ?? []).map((v, i) => ({ id: `v${i}`, sku: v.sku })),
  })),
  linkChoiceMedia: vi.fn(async (_id: string, links: unknown[]) => links.length),
  // Varje bild får en egen wixstatic-adress och bär sin källa, som den riktiga.
  importMediaUrls: vi.fn(async (items: { url: string }[]) =>
    items.map((it, i) => ({ url: `https://static.wixstatic.com/media/g${i}.jpg`, id: `m${i}`, kalla: it.url })),
  ),
  importMediaByUrl: vi.fn(async (url: string) => ({ url: `https://static.wixstatic.com/media/s-${url.length}.jpg`, id: "s", kalla: url })),
}));
vi.mock("../wix/client", () => ({
  createProduct,
  getCollections: vi.fn(async () => []),
  addProductToCollection: vi.fn(async () => undefined),
  linkChoiceMedia,
}));
vi.mock("../wix/media", () => ({ importMediaUrls, importMediaByUrl }));
vi.mock("../audit", () => ({ audit: vi.fn(async () => undefined) }));

import { importProduct } from "./pipeline";

const RULES: PricingRules = {
  usdToSek: 10,
  vatRatePercent: 25,
  defaultMultiplier: 2,
  fixedSurchargeSek: 0,
  categoryMultipliers: {},
  tiersEnabled: false,
  tiers: [],
  rounding: "none",
};

const bild = (namn: string) => `https://img.example/${namn}.jpg`;

/** En familj i två färger, som VEVOR-importen bygger den: egna namn, egna bilder per färg. */
function familj(over: Partial<AliExpressProduct> = {}): AliExpressProduct {
  return {
    supplierProductId: "vevor:TESTFAMILJ1",
    sourceUrl: "https://eur.vevor.com/test-p_000000000001",
    rawTitle: "Skydd för traktorskopa, 2 st kraftiga stålskydd",
    rawDescription:
      "Två kraftiga skydd i stål som skyddar skopans kant mot slitage. Monteras med medföljande bultar " +
      "och passar de flesta traktorskopor. Pulverlackerade för att tåla väder och vind.",
    imageUrls: [bild("rod-1"), bild("rod-2"), bild("gron-1"), bild("gron-2")],
    variants: [
      { supplierVariantId: "A1", options: { Färg: "Röd" }, costUsd: 30, stock: 5, included: true },
      { supplierVariantId: "A2", options: { Färg: "Grön" }, costUsd: 31, stock: 4, included: true },
    ],
    specifications: { Material: "Stål" },
    variantNameOverrides: { Röd: "Röd", Grön: "Grön" },
    axisNameOverrides: { Färg: "Färg" },
    valBilder: { Färg: { Röd: [bild("rod-1"), bild("rod-2")], Grön: [bild("gron-1"), bild("gron-2")] } },
    ...over,
  };
}

const ENV_KEYS = ["VARIANT_AI_TRANSLATION_ENABLED", "IMPORT_VARIANT_IMAGE_BACKFILL", "IMPORT_DESCRIPTION_BACKFILL"] as const;
const sparad = new Map<string, string | undefined>();

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ENV_KEYS) sparad.set(k, process.env[k]);
  process.env.VARIANT_AI_TRANSLATION_ENABLED = "false";
  process.env.IMPORT_VARIANT_IMAGE_BACKFILL = "false";
  process.env.IMPORT_DESCRIPTION_BACKFILL = "false";
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    const v = sparad.get(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

const skapad = () => createProduct.mock.calls[0][0] as unknown as CreatedInput;
const lankar = () => linkChoiceMedia.mock.calls[0][1] as { optionName: string; choiceName: string; altText: string }[];

describe("importProduct — flera bilder per val (valBilder)", () => {
  it("varje val får sina bilder i sin ordning, med en egen alt-text per bild", async () => {
    await importProduct(familj(), RULES, undefined, { enableAI: false });
    const alts = (skapad().mediaItems ?? []).map((m) => m.altText ?? "");
    expect(alts).toHaveLength(4);
    const titel = alts[0].replace(/ – Röd$/, "");
    expect(alts).toEqual([`${titel} – Röd`, `${titel} – Röd, bild 2`, `${titel} – Grön`, `${titel} – Grön, bild 2`]);
    const per = (val: string) => lankar().filter((l) => l.optionName === "Färg" && l.choiceName === val).map((l) => l.altText);
    expect(per("Röd")).toEqual([alts[0], alts[1]]);
    expect(per("Grön")).toEqual([alts[2], alts[3]]);
  });

  it("☠️ ett foto som båda färgerna har kopplas inte, och alt-texten nämner ingen färg", async () => {
    // Butiken ger en bild med ett färgnamn i alt-texten till den färgen
    // (headless-site lib/variant-bilder.ts). Ett gemensamt foto ska synas för alla.
    await importProduct(
      familj({
        rawTitle: "Röd skydd för traktorskopa, 2 st kraftiga stålskydd",
        imageUrls: [bild("rod-1"), bild("delad"), bild("gron-1")],
        valBilder: { Färg: { Röd: [bild("rod-1")], Grön: [bild("gron-1")] } },
        gemensammaBilder: [bild("delad")],
      }),
      RULES,
      undefined,
      { enableAI: false },
    );
    const alts = (skapad().mediaItems ?? []).map((m) => m.altText ?? "");
    const titel = alts[0].replace(/ – Röd$/, "");
    expect(alts).toEqual([`${titel} – Röd`, titel, `${titel} – Grön`]);
    expect(lankar().map((l) => l.altText)).toEqual([alts[0], alts[2]]);
  });

  it("☠️ storlekar som bara har gemensamma foton får inga kopplingar alls", async () => {
    await importProduct(
      familj({
        rawTitle: "Röd skydd för traktorskopa, 2 st kraftiga stålskydd",
        variants: [
          { supplierVariantId: "A1", options: { Färg: "Röd" }, costUsd: 30, stock: 5, included: true },
          { supplierVariantId: "A2", options: { Färg: "Grön" }, costUsd: 31, stock: 4, included: true },
        ],
        imageUrls: [bild("delad-1"), bild("delad-2")],
        valBilder: { Färg: {} },
        gemensammaBilder: [bild("delad-1"), bild("delad-2")],
      }),
      RULES,
      undefined,
      { enableAI: false },
    );
    const alts = (skapad().mediaItems ?? []).map((m) => m.altText ?? "");
    expect(alts[1]).toBe(`${alts[0]}, bild 2`);
    // Namnet nämner Röd, men ingen bild kopplas till Röd för det.
    expect(linkChoiceMedia.mock.calls.flatMap((c) => c[1] as unknown[])).toEqual([]);
  });

  it("☠️ ingen bild laddas upp två gånger, och en swatch-bild för samma val följer inte med", async () => {
    // Förut fick varje färg en egen uppladdning av sin huvudbild, och den röda
    // huvudbilden låg två gånger i galleriet.
    await importProduct(familj({ swatchImages: { Färg: { Röd: bild("rod-1") } } }), RULES, undefined, { enableAI: false });
    expect(importMediaByUrl).not.toHaveBeenCalled();
    expect(skapad().mediaItems).toHaveLength(4);
    expect(lankar()).toHaveLength(4);
  });

  it("☠️ en bild som inte kom fram flyttar inte de andras alt-texter", async () => {
    importMediaUrls.mockImplementationOnce(async (items: { url: string }[]) =>
      items
        .map((it, i) => ({ url: `https://static.wixstatic.com/media/g${i}.jpg`, id: `m${i}`, kalla: it.url }))
        .filter((m) => m.kalla !== bild("rod-2")),
    );
    await importProduct(familj(), RULES, undefined, { enableAI: false });
    const alts = (skapad().mediaItems ?? []).map((m) => m.altText ?? "");
    expect(alts).toHaveLength(3);
    expect(alts[1]).toMatch(/ – Grön$/);
    expect(alts[2]).toMatch(/ – Grön, bild 2$/);
    expect(lankar().filter((l) => l.choiceName === "Röd")).toHaveLength(1);
  });

  it("ett val som inte finns bland produktens val kopplas inte", async () => {
    await importProduct(
      familj({ valBilder: { Färg: { Röd: [bild("rod-1")], Blå: [bild("gron-1")] } } }),
      RULES,
      undefined,
      { enableAI: false },
    );
    expect(lankar().map((l) => l.choiceName)).toEqual(["Röd"]);
  });
});
