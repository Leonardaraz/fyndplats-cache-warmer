import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { importReviewsForProduct } from "@/lib/import/review-import";
import { fetchAeReviews } from "@/lib/aliexpress/reviews";
import { audit } from "@/lib/audit";

// Fristående recensions-import — för BACKFILL av redan importerade produkter.
// Vi slår upp Wix-produkt-id ur mappningarna (supplierProductId) och kör samma
// översätt-/spara-flöde som /api/import.
//
// `reviews` är VALFRITT. Utelämnas det hämtar rutten recensionerna själv från
// AliExpress (lib/aliexpress/reviews.ts) — det är den vanliga vägen. Tidigare
// gick recensioner bara att få in via tilläggets DOM-skrapa, och eftersom AE
// lazy-laddar recensionssektionen fick den nästan alltid noll träffar; hela
// kollektionen stod tom på 876 produkter (granskning 2026-08-16).
//
// Body:
//   { wixProductId }                              — hämta från AE åt mig, eller
//   { supplierProductId }                         — samma, uppslag via mappning, eller
//   { sourceUrl }                                 — härled supplierProductId ur URL
//   { …, reviews: [...] }                         — skicka egna recensioner i stället
//   { …, pages: 3 }                               — antal AE-sidor att hämta (default 2)

const ReviewSchema = z.object({
  reviewIdAE: z.string().optional(),
  rating: z.number().min(0).max(5),
  text: z.string(),
  language: z.string().optional(),
  hasImage: z.boolean().optional(),
  imageUrl: z.string().optional(),
  // MÅSTE finnas i schemat: zod STRIPPAR okända nycklar, så utan raden tappar
  // varje anropare som skickar flera bilder allt utom den första — tyst
  // (granskning 2026-08-19).
  imageUrls: z.array(z.string()).optional(),
  customerName: z.string().optional(),
  customerCountry: z.string().optional(),
  date: z.string().optional(),
});

const BodySchema = z.object({
  wixProductId: z.string().optional(),
  supplierProductId: z.string().optional(),
  sourceUrl: z.string().optional(),
  /** Utelämnas → rutten hämtar själv från AliExpress. */
  reviews: z.array(ReviewSchema).min(1).optional(),
  pages: z.number().int().min(1).max(10).optional(),
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

  const { wixProductId, supplierProductId, sourceUrl, reviews, pages } = parsed.data;

  // Lös upp BÅDA id:na — Wix-id:t för att spara, AE-id:t för att kunna hämta.
  let productId = wixProductId ?? null;
  let supplierId = supplierProductId ?? (sourceUrl ? supplierIdFromUrl(sourceUrl) : null);
  if (!productId || !supplierId) {
    const mappings = await getStore().listMappings();
    const match = productId
      ? mappings.find((m) => m.wixProductId === productId)
      : mappings.find((m) => m.supplierProductId === supplierId);
    if (!match) {
      if (!productId && !supplierId) {
        return NextResponse.json(
          { error: "Saknar produktreferens", message: "Ange wixProductId, supplierProductId eller en giltig sourceUrl." },
          { status: 422 },
        );
      }
      // Saknas mappningen men vi har ett Wix-id och egna recensioner går det
      // ändå att spara — bara AE-hämtningen kräver uppslaget.
      if (!productId || !reviews) {
        return NextResponse.json(
          { error: "Produkt saknas", message: `Ingen importerad produkt för ${productId ? `Wix-id ${productId}` : `AliExpress-id ${supplierId}`}.` },
          { status: 404 },
        );
      }
    } else {
      productId = match.wixProductId;
      supplierId = match.supplierProductId;
    }
  }

  // Ingen lista med i anropet → hämta från AliExpress.
  let toImport = reviews;
  let fetchedFromAe = 0;
  let throttled = false;
  if (!toImport) {
    if (!supplierId) {
      return NextResponse.json(
        { error: "Saknar AliExpress-id", message: "Kan inte hämta recensioner utan supplierProductId." },
        { status: 422 },
      );
    }
    const fetched = await fetchAeReviews(supplierId, pages ? { pages } : {});
    fetchedFromAe = fetched.reviews.length;
    throttled = fetched.throttled;
    if (fetched.reviews.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          wixProductId: productId,
          imported: 0,
          skippedExisting: 0,
          charsUsed: 0,
          budgetExceeded: false,
          fetchedFromAe: 0,
          // Strypt ≠ recensionslös. Den ena är värd ett omförsök, den andra inte.
          throttled,
          message: throttled
            ? "AliExpress strypte hämtningen — försök igen om en stund."
            : "AliExpress har inga publicerade recensioner med text för produkten.",
        },
        { status: 200 },
      );
    }
    toImport = fetched.reviews;
  }

  try {
    const r = await importReviewsForProduct(productId as string, toImport);
    if (r.imported > 0) {
      await audit(
        "reviews-backfill",
        productId as string,
        `${r.imported} recensioner sparade som pending (översätts i chatten)`,
      );
    }
    return NextResponse.json(
      {
        ok: true,
        wixProductId: productId,
        imported: r.imported,
        skippedExisting: r.skippedExisting,
        fetchedFromAe,
        throttled,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Recensions-import misslyckades", message }, { status: 500 });
  }
}
