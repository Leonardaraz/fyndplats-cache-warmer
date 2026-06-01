import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { findDuplicates } from "@/lib/import/duplicate-check";

// pHash använder `sharp` (native) → måste köra på Node-runtime, inte Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/check-duplicate?title=...&imageUrl=...&aeId=...
 *
 * Kollar om en mycket liknande produkt redan finns i Wix-butiken (Feature 1).
 * Anropas av extensionen INNAN import. Inga AI-anrop — ren lokal beräkning
 * (pHash + Levenshtein/ordmängd-overlap + sparat AliExpress-id).
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "").trim();
  const imageUrl = searchParams.get("imageUrl")?.trim() || undefined;
  const aeId = searchParams.get("aeId")?.trim() || undefined;

  if (!title && !imageUrl && !aeId) {
    return NextResponse.json(
      { error: "Ange minst en av: title, imageUrl, aeId." },
      { status: 400 },
    );
  }

  try {
    const matches = await findDuplicates({
      title,
      firstImageUrl: imageUrl,
      aliexpressProductId: aeId,
    });
    const strongest = matches[0] ?? null;
    return NextResponse.json({
      ok: true,
      isDuplicate: matches.length > 0,
      // Hög-confidence (>0.9) = kraftfull varning; 0.6–0.9 = mild (extension avgör UI).
      strongestConfidence: strongest?.confidence ?? 0,
      strongestMatchType: strongest?.matchType ?? null,
      matches,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ ok: false, error: "Dubblett-check misslyckades", message }, { status: 500 });
  }
}
