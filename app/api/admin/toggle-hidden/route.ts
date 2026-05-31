import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setHidden } from "../../../../lib/image-scores";

// Togglar "Dölj från Veckans fynd" för en produkt (Wix Data FyndplatsImageScores).
// Skyddas av middleware. Body: { productId: string, hidden: boolean }.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { productId?: string; hidden?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON-body" }, { status: 400 });
  }
  const { productId, hidden } = body;
  if (!productId || typeof hidden !== "boolean") {
    return NextResponse.json({ ok: false, error: "productId (string) och hidden (boolean) krävs" }, { status: 400 });
  }
  try {
    await setHidden(productId, hidden);
    return NextResponse.json({ ok: true, productId, hidden });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
