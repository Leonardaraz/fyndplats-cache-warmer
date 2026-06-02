// POST /api/push/preferences
//
// Inloggad kund uppdaterar sina push-preferenser. Auth: Bearer-JWT från
// magic-link-flödet (lib/auth-token, HS256/AUTH_JWT_SECRET). Preferenserna
// sätts på ALLA enheter (tokens) som hör till kundens e-post.
//
// Body: { orderUpdates, restock, promotions, cartReminders } (booleans).

import { NextResponse, type NextRequest } from "next/server";
import { bearerToken, verifyUserToken } from "@/lib/auth-token";
import { coercePreferences, setPreferencesForEmail } from "@/lib/push-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const claims = verifyUserToken(bearerToken(req.headers.get("authorization")) || "");
  if (!claims) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const prefs = coercePreferences(body);
  const updated = await setPreferencesForEmail(claims.email, prefs);

  return NextResponse.json({ ok: true, updated, preferences: prefs });
}
