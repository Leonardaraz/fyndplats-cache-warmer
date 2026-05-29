// POST /api/seo/enrich
//
// Loopar alla V3-produkter och PATCH:ar in saknade SEO-taggar (JSON-LD,
// OG, canonical). Idempotent — körs samma fil ger inga dubletter.
//
// Body (alla optionella):
//   { dryRun?: boolean, baseUrl?: string, newPathPrefix?: string,
//     siteName?: string, productIds?: string[] }
//
// dryRun=true → returnerar bara vad som SKULLE patchas, ingen skrivning.
// productIds  → begränsa till specifika ID:n (t.ex. testning på 1-2).

import { type NextRequest, NextResponse } from "next/server";
import { listAllV3Products, getV3ProductFull, patchV3ProductSeo } from "@/lib/wix/v3-products";
import {
  generateMissingSeoTags,
  type EnrichConfig,
  type V3ProductForEnrich,
} from "@/lib/seo/enrich";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

interface EnrichResult {
  id: string;
  name: string;
  added: number;
  skipped?: boolean;
  error?: string;
  preview?: Array<Record<string, unknown>>;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: {
    dryRun?: boolean;
    baseUrl?: string;
    newPathPrefix?: string;
    siteName?: string;
    productIds?: string[];
  } = {};
  try {
    body = await req.json();
  } catch {
    // tom body är OK
  }

  const cfg: Partial<EnrichConfig> = {};
  if (body.baseUrl) cfg.baseUrl = body.baseUrl;
  if (body.newPathPrefix) cfg.newPathPrefix = body.newPathPrefix;
  if (body.siteName) cfg.siteName = body.siteName;

  // 1) hämta vilka produkter som ska processas
  let targetIds: string[];
  try {
    if (body.productIds && body.productIds.length > 0) {
      targetIds = body.productIds;
    } else {
      const all = await listAllV3Products();
      targetIds = all.map((p) => p.id);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "list-fel" },
      { status: 502 },
    );
  }

  // 2) processa sekventiellt (PATCH-rate-limit-vänligt)
  const results: EnrichResult[] = [];
  let patched = 0;
  let skipped = 0;
  let failed = 0;

  for (const id of targetIds) {
    try {
      const product = await getV3ProductFull(id);
      const newTags = generateMissingSeoTags(product as V3ProductForEnrich, cfg);

      if (newTags.length === 0) {
        results.push({ id, name: product.name, added: 0, skipped: true });
        skipped++;
        continue;
      }

      const newTagsForApi = newTags as unknown as Array<Record<string, unknown>>;
      const merged = [...(product.seoData?.tags ?? []), ...newTagsForApi];

      if (body.dryRun) {
        results.push({
          id,
          name: product.name,
          added: newTags.length,
          preview: newTagsForApi,
        });
      } else {
        await patchV3ProductSeo(id, product.revision, merged);
        results.push({ id, name: product.name, added: newTags.length });
        patched++;
      }
    } catch (err) {
      results.push({
        id,
        name: "",
        added: 0,
        error: err instanceof Error ? err.message.slice(0, 200) : "fel",
      });
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun: Boolean(body.dryRun),
    stats: {
      total: targetIds.length,
      patched,
      skipped,
      failed,
    },
    results: body.dryRun ? results.slice(0, 20) : results,
  });
}
