// POST /api/restock-subscribe  (Feature 1 — hybrid slut-i-lager)
//
// Publik endpoint som headless-produktsidans "Meddela mig när varan är
// tillbaka i lager"-formulär anropar. Ingen token krävs (kund-facing), men:
//   - origin-CORS hanteras i middleware.ts (storefront-origins allowlistade)
//   - input valideras (e-post + productId) och de-duplikeras i store
//
// Body: { "productId": "<wix-id>", "email": "kund@example.com" }
// Svar: { ok: true, status: "subscribed" | "already_subscribed" | "resubscribed" }

import { NextResponse, type NextRequest } from "next/server";
import { getRestockStore, isValidEmail } from "@/lib/restock/store";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

interface Body {
  productId?: unknown;
  email?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON-body." }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  // Validera productId-format/-längd: dels för att inte skriva skräp i Wix Data
  // (_id byggs av productId), dels som enkel missbruks-broms (kapad radstorlek).
  // Wix-produkt-id:n är GUID/slug-aktiga — tillåt alfanumeriskt + - och _.
  if (!productId || !/^[A-Za-z0-9_-]{1,128}$/.test(productId)) {
    return NextResponse.json({ ok: false, error: "Ogiltigt productId." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Ogiltig e-postadress." }, { status: 400 });
  }

  try {
    const status = await getRestockStore().subscribe(productId, email);
    // Logga inte e-posten i klartext i auditen (PII) — bara produkt + utfall.
    await audit("restock-subscribe", productId, status);
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err);
    await audit("restock-subscribe-error", productId, msg);
    return NextResponse.json({ ok: false, error: "Kunde inte spara prenumerationen." }, { status: 500 });
  }
}
