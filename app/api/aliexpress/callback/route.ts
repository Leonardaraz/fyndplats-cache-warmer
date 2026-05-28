// GET /api/aliexpress/callback?code=...
// Tar emot OAuth-koden från AliExpress och byter den mot access_token +
// refresh_token. Svaret visas i klartext i webbläsaren — kopiera värdena
// till dina Vercel env-variabler:
//   ALIEXPRESS_ACCESS_TOKEN
//   ALIEXPRESS_REFRESH_TOKEN
//
// OBS: Tokens är knutna till det AliExpress-konto som auktoriserade appen.

import { type NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/aliexpress/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Ingen code i query-parametrar." }, { status: 400 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/aliexpress/callback`;
  try {
    const tokens = await exchangeCode(code, redirectUri);
    // Visa tokens i klartext — kopiera till Vercel env vars.
    return NextResponse.json({
      message:
        "Kopiera dessa värden till dina Vercel env-variabler och tryck sedan på Redeploy.",
      ALIEXPRESS_ACCESS_TOKEN: tokens.access_token,
      ALIEXPRESS_REFRESH_TOKEN: tokens.refresh_token,
      expires_in_seconds: tokens.expires_in,
      refresh_expires_in_seconds: tokens.refresh_expires_in,
      account: tokens.account,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
