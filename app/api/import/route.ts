import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { getPricingRules } from "@/lib/store/pricing-config";
import { importProduct } from "@/lib/import/pipeline";
import { getInventory } from "@/lib/aliexpress/client";
import { optionComboKey } from "@/lib/import/variant-stock";
import type { AliExpressProduct } from "@/lib/import/types";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import { recordSupplierImport } from "@/lib/import/supplier-tracking";
import { importReviewsForProduct } from "@/lib/import/review-import";
import { saveProductHash } from "@/lib/store/product-hashes";
import { pHashFromUrl } from "@/lib/import/phash";
import {
  hasFyndplatsImageUrl,
  hasUsablePrice,
  isAliExpressSourceUrl,
  isThinProductInput,
  looksLikeStoreCopy,
} from "@/lib/import/guard";
import { audit } from "@/lib/audit";
import { describeRouting } from "@/lib/import/trigger-routing";
import { triggerCropDetection } from "@/lib/headless/trigger-crop-detection";

const VariantSchema = z.object({
  supplierVariantId: z.string().min(1),
  options: z.record(z.string()),
  costUsd: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  // ISO-3166 alpha-2-warehouse-kod, t.ex. "ES". Tom sträng tillåts (okänd).
  shipFrom: z.string().max(8).optional(),
  included: z.boolean(),
});

// Skrapad AliExpress-recension (social proof). Filtreras/rankas/översätts
// server-side i lib/import/review-import.ts — vi är toleranta i schemat så att
// en udda recension inte fäller hela produktimporten (422).
const ReviewSchema = z.object({
  reviewIdAE: z.string().optional(),
  rating: z.number().min(0).max(5),
  text: z.string(),
  language: z.string().optional(),
  hasImage: z.boolean().optional(),
  imageUrl: z.string().optional(),
  // Rått AE-namn — lagras för bevis, visas aldrig (servern härleder initialer).
  customerName: z.string().optional(),
  customerCountry: z.string().optional(),
  date: z.string().optional(),
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
  // Lagerstatus från skrapan. Saknas = i lager (default-antagande).
  inStock: z.boolean().optional(),
  // Strukturerad produktinfo för de tabbade PDP-sektionerna. Alla valfria —
  // pipelinen översätter/berikar dem till svenska flikar (lib/import/tabs.ts).
  specifications: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
  packageContents: z.array(z.string()).optional(),
  // Färgkoder samplade från produktbilden: { [optionName]: { [choiceName]: "#hex" } }.
  optionColorCodes: z.record(z.record(z.string())).optional(),
  // Per-val bild-URL:er { [optionName]: { [choiceName]: "https://…alicdn.jpg" } }.
  // Laddas upp + kopplas till Wix-optionsval (linkedMedia) → huvudbild byts vid färgval.
  swatchImages: z.record(z.record(z.string())).optional(),
  // Säljardata (Feature 6 — säljar-score). supplierId obligatoriskt om fältet
  // skickas; övriga AE-fält valfria. Saknas helt = säljaren kunde inte skrapas.
  // Utökade fält (bug 2026-06-02): positiveFeedbackPct, yearsOnAE, topBrand
  // används av säljar-score för riskflaggor.
  supplier: z
    .object({
      supplierId: z.string().min(1),
      supplierName: z.string().optional(),
      supplierStoreUrl: z.string().optional(),
      aeRating: z.number().optional(),
      aeFollowers: z.number().optional(),
      positiveFeedbackPct: z.number().min(0).max(100).optional(),
      yearsOnAE: z.number().int().min(0).max(30).optional(),
      topBrand: z.boolean().optional(),
    })
    .optional(),
  // Full HTML-beskrivning från AE:s Product Description-sektion (renad). Optional
  // — saknas = bara rawDescription + specifications finns att jobba med (rå-läge).
  descriptionHtml: z.string().optional(),
  // AI-funktionsväljare från extension-popupen. Saknas = allt på (default).
  featureFlags: z
    .object({
      translate: z.boolean().optional(),
      seo: z.boolean().optional(),
      imageAnalysis: z.boolean().optional(),
      autoCategorize: z.boolean().optional(),
      // AI-kvalitetsläge-dropdown (raw/standard/premium). Saknas = env-default.
      qualityMode: z.enum(["raw", "standard", "premium"]).optional(),
    })
    .optional(),
  // Skrapade AliExpress-recensioner (social proof). Översätts (DeepL, GRATIS)
  // och sparas i FyndplatsImportedReviews EFTER produktimporten. Best-effort —
  // recensionsfel fäller aldrig själva produktimporten.
  reviewsToImport: z.array(ReviewSchema).optional(),
  // Per-import-prisoverride (extension-dropdownen "Marginal-tier" → Premium/Custom).
  // Saknas = default-tier via FyndplatsPricingConfig (bakåtkompatibelt). Vinner
  // över default-/kategori-/intervallregeln för just den här importen.
  pricingOverride: z
    .object({
      multiplier: z.number().min(1).max(5),
      floorSek: z.number().nonnegative().optional(),
      ceilingSek: z.number().positive().optional(),
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

  const { optionColorCodes, featureFlags, supplier, reviewsToImport, pricingOverride, ...product } = parsed.data;

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
    // Smart routing: /api/import är extension-knappen (UX-blockerande) → ALLTID
    // realtid, oavsett USE_BATCH_API. Loggas per import för spårbarhet/verifiering.
    console.log(`[import] ${describeRouting("extension")} pid=${product.supplierProductId}`);
    // Riktigt per-variant-lager från AliExpress DS-API. AliExpress visar inte
    // längre lagersaldo i själva sidan (hämtas via XHR till React-state), så
    // skrapan (content.js) får sällan något → pipelinen föll tillbaka på standard
    // 10. Vi hämtar därför det FAKTISKA lagret server-side och skriver över
    // v.stock innan pipelinen (resolveImportStockQty använder det). Best-effort +
    // fail-open: misslyckas DS-anropet (saknad token/permission/nät) behålls
    // skrapans värde och beteendet blir som förut.
    try {
      const inv = await getInventory(product.supplierProductId);
      if (inv.length) {
        // Adoptera DS-skuId: när en variant matchas skriver vi över skrapans id
        // (ofta "idx-N" eftersom AE inte längre lägger skuId i sidan) med
        // AliExpress riktiga DS-skuId. Då sparas mappningen med samma id som den
        // DAGLIGA synken (lib/sync/aliexpress-sync) använder (den keyar på
        // getProduct().variants[].skuId) → lagret kan hållas färskt automatiskt.
        const adopt = (
          v: { stock?: number; supplierVariantId: string; costUsd?: number },
          entry: { stock: number; skuId: string; price?: number },
        ) => {
          v.stock = entry.stock;
          if (entry.skuId) v.supplierVariantId = String(entry.skuId);
          // Per-variant kostnad (USD) från DS-API:t (target_currency=USD). Utan
          // detta ärver alla varianter skrapans enda pris → fel när varianterna
          // kostar olika (t.ex. 3PCS/4PCS/5PCS). Behåll skrapans pris om DS ger 0.
          if (typeof entry.price === "number" && entry.price > 0) v.costUsd = entry.price;
        };
        const bySku = new Map(inv.map((i) => [String(i.skuId), i]));
        // Matchning på optionskombination (färg/storlek). AE laddar inte längre
        // SKU-id i sidan → skrapan sätter "idx-N" → skuId-matchningen ger 0 träffar
        // (bug 2026-06-04). Kombo-nyckeln delas av båda källor.
        //
        // Policy "mest saldo" (2026-06-05): en produkt kan ha samma färg i FLERA
        // lager-länder (färg × ships-from = N SKU:er) men butiken visar bara färg.
        // Vi kan inte avgöra vilket lager som är EU server-side (DS-API:t ger tomt
        // land), så vi tar lagret med MEST saldo per färg → ingen färg ser falskt
        // slut ut. Adopterar det lagrets skuId så dagliga synken följer samma SKU.
        const byComboMax = new Map<string, (typeof inv)[number]>();
        for (const i of inv) {
          const key = optionComboKey(i.skuProps);
          if (!key) continue;
          const cur = byComboMax.get(key);
          if (!cur || i.stock > cur.stock) byComboMax.set(key, i);
        }
        let matched = 0;
        let viaCombo = 0;
        for (const v of product.variants) {
          const key = optionComboKey(v.options);
          const exact = bySku.get(String(v.supplierVariantId));
          if (exact) {
            adopt(v, exact);
            matched++;
          } else if (key && byComboMax.has(key)) {
            adopt(v, byComboMax.get(key)!);
            matched++;
            viaCombo++;
          }
        }
        // Sista utväg: positions-matchning. För vissa produkter svarar DS-API:t
        // med TOMMA skuProps-värden ({Color:""}) och ett skuId i prop-path-form
        // ("14:29;…") som inte matchar skrapans id → både skuId och kombo ger 0
        // träffar trots att DS HAR rätt per-variant-lager (verifierat 2026-06-04:
        // 9 resp 1 st). DS returnerar varianterna i samma ordning som sidan, så
        // när inget matchade men antalet är exakt lika mappar vi per position.
        // Klart bättre än fallback 10 (som dessutom döljer äkta OOS). Loggas.
        let viaPosition = 0;
        if (matched === 0 && inv.length === product.variants.length) {
          for (let idx = 0; idx < product.variants.length; idx++) {
            adopt(product.variants[idx], inv[idx]);
            matched++;
            viaPosition++;
          }
        }
        console.log(
          `[import:stock] pid=${product.supplierProductId} DS-lager: ${matched}/${product.variants.length} varianter matchade (kombo ${viaCombo}, position ${viaPosition})`,
        );
      }
    } catch (e) {
      console.warn(
        `[import:stock] DS-lagerhämtning misslyckades pid=${product.supplierProductId}: ${(e as Error).message}`,
      );
    }
    // Premium-läget (komponent 4): mata in de skrapade recensionerna i FAQ-
    // genereringen så frågorna grundas i vad kunder faktiskt undrat. Best-effort.
    const premiumReviewHints =
      reviewsToImport && reviewsToImport.length > 0
        ? reviewsToImport
            .filter((r) => typeof r.text === "string" && r.text.trim())
            .map((r) => ({ text: r.text, rating: r.rating }))
        : undefined;
    const result = await importProduct(
      product as AliExpressProduct,
      await getPricingRules(),
      optionColorCodes,
      featureFlags,
      undefined,
      premiumReviewHints ? { reviews: premiumReviewHints } : undefined,
      pricingOverride,
    );
    // Defensiv: image-analys + kategoriförslag är opt-in (WIP-fält som inte
    // alltid returneras av pipelinen och inte alltid är deklarerade i typen).
    // Cast:ar via Record<string, unknown> så TS godkänner båda formerna.
    const resultAny = result as unknown as Record<string, unknown>;
    // RÅ import (AI_ENRICHMENT_ENABLED=false) → ALLTID granskningskön: produkten
    // är opolerad (draft) och måste poleras + godkännas manuellt, oavsett
    // IMPORT_DRAFT_DEFAULT. Normal import följer IMPORT_DRAFT_DEFAULT som förut.
    const needsAiPolish = resultAny.needsAiPolish === true;
    // PREMIUM: produkten publicerades direkt om kvalitets-judgen godkände
    // (visible:true sattes i pipelinen). Underkänd premium → needsManualPolish →
    // granskningskön. Övriga lägen: oförändrat IMPORT_DRAFT_DEFAULT-beteende.
    const isPremiumResult = resultAny.qualityMode === "premium";
    const needsManualPolish = resultAny.needsManualPolish === true;
    const draftStatus = isPremiumResult
      ? needsManualPolish
        ? "pending_review"
        : "published"
      : !needsAiPolish && process.env.IMPORT_DRAFT_DEFAULT === "false"
        ? "published"
        : "pending_review";
    const mappingExtras: Record<string, unknown> = {};
    if (needsAiPolish) mappingExtras.needsAiPolish = true;
    if (needsManualPolish) mappingExtras.needsManualPolish = true;
    if (isPremiumResult) mappingExtras.qualityMode = "premium";
    if (typeof resultAny.qualityScore === "number") mappingExtras.qualityScore = resultAny.qualityScore;
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
    // Säljar-koppling (Feature 6): foreign key till FyndplatsSuppliers + namn
    // (denormaliserat för admin-vyer). Sätts bara om säljaren kunde skrapas.
    if (supplier) {
      mappingExtras.supplierId = supplier.supplierId;
      if (supplier.supplierName) mappingExtras.supplierName = supplier.supplierName;
    }

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

    // Dubblett-index (Feature 1): spara huvudbildens pHash + AliExpress-id i
    // FyndplatsProductHashes så att framtida importer kan dubblett-checkas mot den
    // här produkten direkt (utan att vänta på nästa backfill). Best-effort — hash-
    // fel (bild nere, kollektion saknas) får aldrig fälla importen.
    try {
      const firstImage = product.imageUrls[0];
      const phash = firstImage ? await pHashFromUrl(firstImage) : null;
      await saveProductHash({
        wixProductId: result.wixProductId,
        productName: result.seo.title,
        phash,
        aeProductId: result.supplierProductId,
        imageUrl: firstImage,
        slug: result.slug,
        updatedAt: new Date().toISOString(),
      });
    } catch (hashErr) {
      console.warn(
        "[import] FyndplatsProductHashes.save failade (icke-fatalt):",
        hashErr instanceof Error ? hashErr.message : hashErr,
      );
    }

    // Säljar-score (Feature 6): upserta säljaren i FyndplatsSuppliers och länka
    // produkten. Best-effort — om kollektionen saknas eller skrivningen failar
    // ska importen inte avbrytas; logga bara och fortsätt.
    if (supplier) {
      try {
        await recordSupplierImport(supplier, result.wixProductId);
      } catch (supErr) {
        console.warn(
          "[import] recordSupplierImport failade (icke-fatalt):",
          supErr instanceof Error ? supErr.message : supErr,
        );
      }
    }

    // Recensions-import (social proof): filtrera/ranka/översätt (DeepL, GRATIS)
    // och spara i FyndplatsImportedReviews. Best-effort — recensionsfel (DeepL
    // nere, kollektion saknas, budget slut) får ALDRIG fälla produktimporten.
    let reviewsResult: { imported: number; skippedExisting: number; charsUsed: number; budgetExceeded: boolean } | undefined;
    if (reviewsToImport && reviewsToImport.length > 0) {
      try {
        const r = await importReviewsForProduct(result.wixProductId, reviewsToImport);
        reviewsResult = {
          imported: r.imported,
          skippedExisting: r.skippedExisting,
          charsUsed: r.charsUsed,
          budgetExceeded: r.budgetExceeded,
        };
        if (r.imported > 0) {
          await audit(
            "reviews-import",
            result.wixProductId,
            `${r.imported} recensioner (DeepL ${r.charsUsed} tecken${r.budgetExceeded ? ", BUDGET SLUT → otranslaterade" : ""})`,
          );
        }
      } catch (revErr) {
        console.warn(
          "[import] recensions-import failade (icke-fatalt):",
          revErr instanceof Error ? revErr.message : revErr,
        );
      }
    }

    await audit(
      draftStatus === "pending_review" ? "import-pending" : "import",
      result.wixProductId,
      result.seo.title,
    );

    // Fire-and-forget: be headless detektera tight-crop för nya bilder.
    // Se lib/headless/trigger-crop-detection.ts för designbeslut. No-await.
    triggerCropDetection({ source: `import:${result.wixProductId}` });

    return NextResponse.json(
      {
        ok: true,
        result,
        draftStatus,
        reviews: reviewsResult,
        // Bekvämligheter på toppnivå för smoke-tester och extension-UI (om
        // pipelinen producerade dem — annars undefined).
        image_analysis: resultAny.imageAnalysis,
        suggested_category: resultAny.categorySuggestion,
        // suffix. Extension-popupen kan visa "Slug auto-justerad: foo-2".
        slug_suffix: resultAny.slugSuffix,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okant fel";
    return NextResponse.json({ error: "Import misslyckades", message }, { status: 500 });
  }
}
