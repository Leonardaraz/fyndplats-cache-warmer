// GET /api/aliexpress/auth
// Redirectar till AliExpress OAuth-sida för att auktorisera dropship-appen.
// Används en gång (eller efter refresh_token expirerar) för att skaffa
// access_token.
//
// CSRF-skydd: vi genererar en krypto-slumpad state-token, lagrar den i en
// httpOnly cookie, och callbacken jämför mot cookie. Utan match → 403.

import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/aliexpress/client";

export const runtime = "nodejs";

export const OAUTH_STATE_COOKIE = "ae_oauth_state";
const STATE_COOKIE_MAX_AGE_SECONDS = 600; // 10 min — räcker för att klicka igenom AliExpress OAuth-flöde

export function GET(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/aliexpress/callback`;
  try {
    const state = randomBytes(32).toString("hex");
    const url = buildAuthUrl(redirectUri, state);
    const res = NextResponse.redirect(url);
    res.cookies.set({
      name: OAUTH_STATE_COOKIE,
      value: state,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/aliexpress",
      maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
