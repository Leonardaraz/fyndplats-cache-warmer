import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { importReviewsForProduct } from "@/lib/import/review-import";
import { audit } from "@/lib/audit";

// Fristående recensions-import — för BACKFILL av redan importerade produkter.
// Extension-bulkläget (eller ett skript) skrapar recensioner från AliExpress-
// produktsidan och postar dem hit; vi slår upp Wix-produkt-id ur mappningarna
// (supplierProductId) och kör samma översätt-/spara-flöde som /api/import.
//
// Body:
//   { wixProductId, reviews: [...] }              — direkt på Wix-id, eller
//   { supplierProductId, reviews: [...] }         — slå upp via mappningar, eller
//   { sourceUrl, reviews: [...] }                 — härled supplierProductId ur URL

const ReviewSchema = z.object({
  reviewIdAE: z.string().optional(),
  rating: z.number().min(0).max(5),
  text: z.string(),
  language: z.string().optional(),
  hasImage: z.boolean().optional(),
  imageUrl: z.string().optional(),
  customerName: z.string().optional(),
  customerCountry: z.string().optional(),
  date: z.string().optional(),
});

const BodySchema = z.object({
  wixProductId: z.string().optional(),
  supplierProductId: z.string().optional(),
  sourceUrl: z.string().optional(),
  reviews: z.array(ReviewSchema).min(1),
});

/** AliExpress produkt-id ur en /item/<id>.html-URL. */
function supplierIdFromUrl(url: string): string | null {
  const m = url.match(/\/item\/(\d+)\.html/);
  return m ? m[1] : null;
}

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
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  const { wixProductId, supplierProductId, sourceUrl, reviews } = parsed.data;

  // Lös upp Wix-produkt-id.
  let productId = wixProductId ?? null;
  if (!productId) {
    const supplierId =
      supplierProductId ?? (sourceUrl ? supplierIdFromUrl(sourceUrl) : null);
    if (!supplierId) {
      return NextResponse.json(
        { error: "Saknar produktreferens", message: "Ange wixProductId, supplierProductId eller en giltig sourceUrl." },
        { status: 422 },
      );
    }
    const mappings = await getStore().listMappings();
    const match = mappings.find((m) => m.supplierProductId === supplierId);
    if (!match) {
      return NextResponse.json(
        { error: "Produkt saknas", message: `Ingen importerad produkt för AliExpress-id ${supplierId}.` },
        { status: 404 },
      );
    }
    productId = match.wixProductId;
  }

  try {
    const r = await importReviewsForProduct(productId, reviews);
    if (r.imported > 0) {
      await audit(
        "reviews-backfill",
        productId,
        `${r.imported} recensioner (DeepL ${r.charsUsed} tecken${r.budgetExceeded ? ", BUDGET SLUT → otranslaterade" : ""})`,
      );
    }
    return NextResponse.json(
      {
        ok: true,
        wixProductId: productId,
        imported: r.imported,
        skippedExisting: r.skippedExisting,
        charsUsed: r.charsUsed,
        budgetExceeded: r.budgetExceeded,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Recensions-import misslyckades", message }, { status: 500 });
  }
}
