// GET /api/reviews/<produkt-id>
//
// Publik läs-endpoint: GODKÄNDA recensioner för en produkt. Butiken
// (headless-site, lib/reviews.ts) renderar produktsidans recensionssektion ur
// det här svaret. Ingen auth — recensionerna är publik social proof.
// Returnerar BARA publika fält (se lib/reviews/public-view.ts).
//
// ☠️ SVARET LÄSES NUMERA UR ÖGONBLICKSBILDEN, INTE UR POSTGRES.
//
// Adressen och svarsformen är oförändrade — butiken vet ingenting om bytet,
// och ska inte behöva veta det. Det som ändrades är varifrån raderna kommer:
// lib/reviews/snapshot.ts, en bild av hela lagret som hämtas en gång i timmen.
//
// Skälet, uppmätt 2026-09-17: den här rutten frågade Postgres en gång per
// renderad produktsida. 591 frågor på tre timmar, 554 olika produkter, största
// lucka 2 min 57 s — dygnet runt. Neon somnar efter fem minuters tystnad och
// debiterar tiden den är vaken, så databasen kostade dygnet-runt-pris: ~180
// CU-timmar i månaden mot en pott på 100, slut den 17:e.
//
// Cache-headern nedan fanns redan HELA TIDEN och räddade ingenting: med 1 251
// produkter hinner varje produkts cache gå ut innan någon frågar om samma
// produkt igen. Nästan varje anrop loggades `cache=MISS`. Det är därför lösningen
// är en delad bild och inte en längre TTL.
//
// ⚠️ FALLBACKEN ÄR INTE VALFRI. Saknas bilden, eller kommer den i fel form,
// läser vi lagret precis som förut. En produktsida utan omdömen ser inte ut som
// ett fel — den ser ut som en produkt utan omdömen, och hade stått så i veckor
// utan att någon reagerat. Dyrare är bättre än tyst fel.
import { NextResponse } from "next/server";
import { hamtaSnapshot, urSnapshot } from "@/lib/reviews/snapshot";
import { snittBetyg, toPublicReview, type PublicReview } from "@/lib/reviews/public-view";
import { getReviewStore, isVisibleStatus } from "@/lib/store/reviews";

export const dynamic = "force-dynamic";

/** Lagret direkt — vägen vi tar när bilden inte gick att få. */
async function franLagret(productId: string): Promise<PublicReview[] | null> {
  try {
    const rader = await getReviewStore().listByProduct(productId);
    return rader.filter((r) => isVisibleStatus(r.status)).map(toPublicReview);
  } catch (err) {
    console.warn("[api/reviews] kunde inte läsa recensioner:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: "Saknar productId" }, { status: 400 });
  }

  const bild = await hamtaSnapshot();
  // `?? []` bara när bilden FANNS: en produkt som saknas i en giltig bild har
  // inga synliga omdömen, och det är ett riktigt svar. Saknas bilden helt är
  // det något annat, och då går vi till lagret.
  const reviews = bild ? urSnapshot(bild, productId) : await franLagret(productId);

  if (reviews === null) {
    // Båda vägarna föll. Samma svar som förut: 200 med tom lista, så
    // produktsidan renderar utan sektionen i stället för att gå sönder.
    return NextResponse.json({ productId, count: 0, average: null, reviews: [] }, { status: 200 });
  }

  return NextResponse.json(
    {
      productId,
      count: reviews.length,
      average: snittBetyg(reviews),
      reviews,
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
