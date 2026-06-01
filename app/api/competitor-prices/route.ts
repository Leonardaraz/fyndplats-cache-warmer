import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { findCompetitorPrices, summarizeCompetition } from "@/lib/import/competitor-prices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/competitor-prices?title=...&ourPrice=...&imageUrl=...&noCache=1
 *
 * Skrapar svenska prisjämförelsetjänster (Pricerunner/Prisjakt/Google Shopping)
 * efter samma/liknande produkt och ger en prisrekommendation (Feature 2).
 * Resultat cachas 7 dagar i Wix Data. Inga betaltjänster, inga AI-anrop.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "").trim();
  const imageUrl = searchParams.get("imageUrl")?.trim() || undefined;
  const ourPriceRaw = searchParams.get("ourPrice");
  const ourPrice = ourPriceRaw && Number.isFinite(Number(ourPriceRaw)) ? Number(ourPriceRaw) : undefined;
  const noCache = searchParams.get("noCache") === "1" || searchParams.get("noCache") === "true";

  if (!title) {
    return NextResponse.json({ error: "Ange title." }, { status: 400 });
  }

  try {
    const prices = await findCompetitorPrices(title, imageUrl, { noCache });
    const summary = summarizeCompetition(prices, ourPrice);
    return NextResponse.json({ ok: true, prices, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json(
      { ok: false, error: "Konkurrentpris-check misslyckades", message },
      { status: 500 },
    );
  }
}
