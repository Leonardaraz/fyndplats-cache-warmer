import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import { importProduct } from "@/lib/import/pipeline";
import type { AliExpressProduct } from "@/lib/import/types";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import {
  hasFyndplatsImageUrl,
  hasUsablePrice,
  isAliExpressSourceUrl,
  isThinProductInput,
  looksLikeStoreCopy,
} from "@/lib/import/guard";
import { audit } from "@/lib/audit";

const VariantSchema = z.object({
  supplierVariantId: z.string().min(1),
  options: z.record(z.string()),
  costUsd: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  // ISO-3166 alpha-2-warehouse-kod, t.ex. "ES". Tom sträng tillåts (okänd).
  shipFrom: z.string().max(8).optional(),
  included: z.boolean(),
});

const ProductSchema = z.object({
  supplierProductId: z.string().min(1),
  sourceUrl: z.string().url(),
  rawTitle: z.string().min(1),
  rawDescription: z.string(),
  imageUrls: z.array(z.string().url()),
  variants: z.array(VariantSchema).min(1),
  // Aggregerade warehouse-koder från extension/page-scraper.
  // Tom array eller saknas → ingen EU-flagga sätts.
  shipsFrom: z.array(z.string().max(8)).optional(),
  // Färgkoder samplade från produktbilden: { [optionName]: { [choiceName]: "#hex" } }.
  optionColorCodes: z.record(z.record(z.string())).optional(),
  // AI-funktionsväljare från extension-popupen. Saknas = allt på (default).
  featureFlags: z
    .object({
      translate: z.boolean().optional(),
      seo: z.boolean().optional(),
      imageAnalysis: z.boolean().optional(),
      autoCategorize: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  const { optionColorCodes, featureFlags, ...product } = parsed.data;

  // Skydd: källan MÅSTE vara en AliExpress-produkt-URL. Hindrar att en
  // felskrapad sida (t.ex. fyndplats.se i en annan flik) importeras.
  const urlCheck = isAliExpressSourceUrl(product.sourceUrl);
  if (!urlCheck.ok) {
    return NextResponse.json(
      { error: "Ogiltig källa", message: `sourceUrl är inte en AliExpress-produkt-URL: ${urlCheck.reason}` },
      { status: 422 },
    );
  }

  // Skydd: avvisa kontaminerad/tom produktdata. Hellre vägra än skapa en
  // spökprodukt med butikscopy + 0,9 kr (bug 2026-05-31). Vi loggar varje
  // avvisning i audit så Leonard ser att tillägget behöver laddas om / sidan
  // läsas om snarare än att tro att importen tyst lyckades.
  const rejection = ((): { reason: string; message: string } | null => {
    if (looksLikeStoreCopy(product.rawTitle) || looksLikeStoreCopy(product.rawDescription)) {
      return {
        reason: "store-copy",
        message:
          "Titel/beskrivning ser ut som Fyndplats startsida, inte en AliExpress-produkt. " +
          "Ladda om AliExpress-produktsidan och försök igen.",
      };
    }
    if (isThinProductInput(product.rawTitle)) {
      return {
        reason: "thin-title",
        message: "Produkttiteln är för kort/tom — AliExpress-sidan kunde inte läsas korrekt.",
      };
    }
    if (hasFyndplatsImageUrl(product.imageUrls)) {
      return {
        reason: "fyndplats-image",
        message: "En bild-URL pekar på fyndplats.se. Produktbilder måste komma från AliExpress.",
      };
    }
    if (!hasUsablePrice(product.variants)) {
      return {
        reason: "zero-price",
        message: "Ingen vald variant har ett pris > 0 — AliExpress-priset kunde inte läsas.",
      };
    }
    return null;
  })();

  if (rejection) {
    await audit(
      "import-rejected-contaminated",
      product.supplierProductId,
      `${rejection.reason}: ${product.rawTitle.slice(0, 100)}`,
    );
    console.warn(
      `[import] AVVISAD (${rejection.reason}) pid=${product.supplierProductId} titel="${product.rawTitle.slice(0, 80)}"`,
    );
    return NextResponse.json(
      { error: "Ogiltig produktdata", reason: rejection.reason, message: rejection.message },
      { status: 422 },
    );
  }

  try {
    const result = await importProduct(
      product as AliExpressProduct,
      pricingConfigFromEnv(),
      optionColorCodes,
      featureFlags,
    );
    const draftStatus = process.env.IMPORT_DRAFT_DEFAULT === "false" ? "published" : "pending_review";
    // Defensiv: image-analys + kategoriförslag är opt-in (WIP-fält som inte
    // alltid returneras av pipelinen och inte alltid är deklarerade i typen).
    // Cast:ar via Record<string, unknown> så TS godkänner båda formerna.
    const resultAny = result as unknown as Record<string, unknown>;
    const mappingExtras: Record<string, unknown> = {};
    if (resultAny.imageAnalysis !== undefined) mappingExtras.imageAnalysis = resultAny.imageAnalysis;
    if (resultAny.categorySuggestion !== undefined) mappingExtras.categorySuggestion = resultAny.categorySuggestion;
    // Warehouse-metadata (EU-filterring) — sätts av pipelinen om shipFrom
    // var närvarande i payloaden. Lagras på mappingen så att /admin/queue
    // kan filtrera och sajten kan visa EU-badge utan extra round-trip.
    if (resultAny.shipsFromCountries !== undefined) mappingExtras.shipsFromCountries = resultAny.shipsFromCountries;
    if (resultAny.hasEuWarehouse !== undefined) mappingExtras.hasEuWarehouse = resultAny.hasEuWarehouse;
    if (resultAny.warehouseClass !== undefined) mappingExtras.warehouseClass = resultAny.warehouseClass;
    // Persistera slug-kollision-suffix på mapping så /admin/queue kan visa badge.
    if (resultAny.slugSuffix !== undefined) mappingExtras.slugSuffix = resultAny.slugSuffix;

    await getStore().saveMapping({
      supplierProductId: result.supplierProductId,
      wixProductId: result.wixProductId,
      variants: result.variantMappings,
      draftStatus,
      createdAt: new Date().toISOString(),
      seoTitle: result.seo.title,
      sourceUrl: parsed.data.sourceUrl,
      ...mappingExtras,
    });
    // Skriv även en cost-rad till FyndplatsImportCosts så /admin/profitability
    // har en kanonisk inköpsdata-källa (utöver mappnings-tabellen). Best-effort
    // — om kollektionen inte finns ännu eller skrivningen failar ska importen
    // inte avbrytas; logga bara och fortsätt.
    try {
      const variants = result.variantMappings;
      const avgCostSek = variants.length > 0
        ? variants.reduce((s, v) => s + (v.landedCostSek ?? 0), 0) / variants.length
        : 0;
      const avgCostUsd = variants.length > 0
        ? variants.reduce((s, v) => s + (v.costUsd ?? 0), 0) / variants.length
        : 0;
      if (avgCostSek > 0) {
        await getImportCostStore().upsert({
          productId: result.wixProductId,
          costSek: Math.round(avgCostSek * 100) / 100,
          costUsd: avgCostUsd || undefined,
          currency: "SEK",
          importedAt: new Date().toISOString(),
          source: "aliexpress",
        });
      }
    } catch (costErr) {
      console.warn(
        "[import] FyndplatsImportCosts.upsert failade (icke-fatalt):",
        costErr instanceof Error ? costErr.message : costErr,
      );
    }

    await audit(
      draftStatus === "pending_review" ? "import-pending" : "import",
      result.wixProductId,
      result.seo.title,
    );
    return NextResponse.json(
      {
        ok: true,
        result,
        draftStatus,
        // Bekvämligheter på toppnivå för smoke-tester och extension-UI (om
        // pipelinen producerade dem — annars undefined).
        image_analysis: resultAny.imageAnalysis,
        suggested_category: resultAny.categorySuggestion,
        // Sätts bara när Wix gav DUPLICATE_SLUG_ERROR och vi lade på ett
        // suffix. Extension-popupen kan visa "Slug auto-justerad: foo-2".
        slug_suffix: resultAny.slugSuffix,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Import misslyckades", message }, { status: 500 });
  }
}
