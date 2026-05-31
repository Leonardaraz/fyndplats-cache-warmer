import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rerunImageScores } from "../../../../lib/image-scoring";

// Manuell om-poängsättning av produktbilder (Claude Haiku vision → Wix Data).
// Skyddas av middleware (matcher /api/admin/*). Body/params:
//   ?slug=<slug>   → poängsätt bara en produkt (snabbt, för spot-fix)
//   ?limit=<n>     → poängsätt max n produkter
// Utan params poängsätts hela katalogen (kan ta ~2 min — maxDuration höjd).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || undefined;
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;
  try {
    const result = await rerunImageScores({ slug, limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
