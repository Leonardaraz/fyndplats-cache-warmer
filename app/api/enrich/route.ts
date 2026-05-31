import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { enrichProductTabs, type EnrichResult } from "@/lib/import/enrich";

// Back-fill av de tabbade PDP-flikarna på redan importerade produkter.
// Anropas av headless-repots /admin/enrich-products (via dess server-proxy) med
// samma x-fyndplats-token som extension-importen. Stödjer:
//   • enstaka produkt:  { productId, categoryName?, dryRun? }
//   • flera produkter:  { productIds: [...], categories?: {id:name}, dryRun? }
// dryRun=true → genererar + returnerar förhandsvisning utan att skriva till Wix.

const SingleSchema = z.object({
  productId: z.string().min(1),
  categoryName: z.string().nullish(),
  dryRun: z.boolean().optional(),
});

const BulkSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(50),
  /** Valfri map produktId → kategorinamn (styr "Användning och skötsel"). */
  categories: z.record(z.string()).optional(),
  dryRun: z.boolean().optional(),
});

const BodySchema = z.union([SingleSchema, BulkSchema]);

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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valideringsfel", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Enstaka produkt.
  if ("productId" in parsed.data) {
    const { productId, categoryName, dryRun } = parsed.data;
    try {
      const result = await enrichProductTabs(productId, { categoryName, dryRun });
      return NextResponse.json({ ok: true, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Okänt fel";
      return NextResponse.json({ error: "Berikning misslyckades", message }, { status: 500 });
    }
  }

  // Flera produkter — sekventiellt (Claude-routerns dagliga budgetcap stoppar
  // masskörningen av sig själv när dagens spend når taket).
  const { productIds, categories, dryRun } = parsed.data;
  const results: EnrichResult[] = [];
  const errors: { productId: string; message: string }[] = [];
  for (const productId of productIds) {
    try {
      results.push(
        await enrichProductTabs(productId, {
          categoryName: categories?.[productId] ?? null,
          dryRun,
        }),
      );
    } catch (err) {
      errors.push({ productId, message: err instanceof Error ? err.message : "Okänt fel" });
    }
  }
  return NextResponse.json({
    ok: true,
    processed: results.length,
    saved: results.filter((r) => r.saved).length,
    results,
    errors,
  });
}
