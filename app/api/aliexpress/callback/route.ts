// GET /api/aliexpress/callback?code=...
// Tar emot OAuth-koden från AliExpress, byter den mot access/refresh-token,
// och persisterar dem via getStore().saveAliExpressTokens(). Vid lyckad
// persistens redactas tokens ur svaret (säkerhet). Vid persistens-fail
// returneras tokens i klartext som fail-soft — operatorn måste annars
// göra om hela OAuth-flowet eftersom code är single-use.

import { type NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Ingen code i query-parametrar." }, { status: 400 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/aliexpress/callback`;
  let tokens;
  try {
    tokens = await exchangeCode(code, redirectUri);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  try {
    await getStore().saveAliExpressTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
    return NextResponse.json({
      ok: true,
      persisted: true,
      message:
        "Tokens persisterade i store. STORE_BACKEND-värdet avgör om de hamnar i Wix CMS eller bara i minnet.",
      expiresAt: expiresAt.toISOString(),
      refresh_expires_in_seconds: tokens.refresh_expires_in,
      account: tokens.account,
    });
  } catch (persistErr) {
    // Fail-soft: persistensen failade men token-exchange lyckades. Koden är
    // single-use så vi MÅSTE ge operatorn tokens-värdena i klartext för att
    // de manuellt ska kunna seeda dem (annars förlorade). Logga inte värdena.
    console.error("[callback] saveAliExpressTokens failed:", persistErr);
    return NextResponse.json({
      ok: false,
      persisted: false,
      error:
        "Token-exchange lyckades men persistens failade. Klistra in nedanstående värden manuellt i Vercel env eller Wix CMS (FyndplatsAliExpressTokens-raden).",
      details: String(persistErr),
      ALIEXPRESS_ACCESS_TOKEN: tokens.access_token,
      ALIEXPRESS_REFRESH_TOKEN: tokens.refresh_token,
      expiresAt: expiresAt.toISOString(),
      refresh_expires_in_seconds: tokens.refresh_expires_in,
      account: tokens.account,
    }, { status: 500 });
  }
}
