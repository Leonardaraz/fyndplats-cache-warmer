// GET /api/aliexpress/auth
// Redirectar till AliExpress OAuth-sida för att auktorisera dropship-appen.
// Används en gång för att skaffa access_token.

import { type NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/aliexpress/client";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/aliexpress/callback`;
  try {
    const url = buildAuthUrl(redirectUri, "fyndplats-ds");
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
