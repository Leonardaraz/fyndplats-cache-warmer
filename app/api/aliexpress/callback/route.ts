// GET /api/aliexpress/callback?code=...&state=...
//
// Tar emot OAuth-koden från AliExpress, validerar state mot httpOnly cookie
// (CSRF-skydd), byter koden mot access/refresh-token, validerar expires_in,
// och persisterar tokens via getStore().saveAliExpressTokens().
//
// På success: tokens redactas ur svaret (inget cleartext i browser/log).
// På persist-fail: fail-soft till klartext-payload med Cache-Control: no-store
// (single-use code är annars förlorad — operatorn måste få chans att seeda
// manuellt). Console.error-loggning maskerar token-värden.

import { type NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";
import { OAUTH_STATE_COOKIE } from "../auth/route";

export const runtime = "nodejs";

function mask(token: string | undefined): string {
  if (!token || token.length < 12) return "[short-or-missing]";
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

const NO_STORE = { "Cache-Control": "no-store, private", "Pragma": "no-cache" };

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateParam = req.nextUrl.searchParams.get("state");
  if (!code) {
    return NextResponse.json({ error: "Ingen code i query-parametrar." }, { status: 400 });
  }

  // CSRF: state måste matcha cookie satt av /api/aliexpress/auth.
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return NextResponse.json(
      {
        error:
          "OAuth-state matchade inte. Starta om autentiseringen via /api/aliexpress/auth.",
      },
      { status: 403 },
    );
  }

  const redirectUri = `${req.nextUrl.origin}/api/aliexpress/callback`;
  let tokens;
  try {
    tokens = await exchangeCode(code, redirectUri);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "exchange-fel" },
      { status: 500 },
    );
  }

  // Validera shape — AliExpress är notoriskt löst typat och kan returnera
  // felaktiga shapes som annars cascadar till Invalid Date / RangeError.
  if (
    typeof tokens.access_token !== "string"
    || typeof tokens.refresh_token !== "string"
    || typeof tokens.expires_in !== "number"
    || !Number.isFinite(tokens.expires_in)
    || tokens.expires_in <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "AliExpress returnerade ofullständigt token-svar. Kontakta support eller upprepa OAuth.",
      },
      { status: 502 },
    );
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  try {
    await getStore().saveAliExpressTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
    // Rensa state-cookie efter lyckad användning (single-use).
    const okRes = NextResponse.json({
      ok: true,
      persisted: true,
      message:
        "Tokens persisterade i store. STORE_BACKEND-värdet avgör om de hamnar i Wix CMS eller bara i minnet.",
      expiresAt: expiresAt.toISOString(),
      refresh_expires_in_seconds: tokens.refresh_expires_in,
      account: tokens.account,
    }, { headers: NO_STORE });
    okRes.cookies.delete(OAUTH_STATE_COOKIE);
    return okRes;
  } catch (persistErr) {
    // Fail-soft: persistensen failade, men token-exchange lyckades. Koden är
    // single-use så vi MÅSTE ge operatorn värdena för manuell seedning.
    // Tokens visas BARA i HTTP-body (med Cache-Control: no-store) — aldrig
    // i loggar.
    console.error(
      `[callback] saveAliExpressTokens failed (access=${mask(tokens.access_token)}, refresh=${mask(tokens.refresh_token)}):`,
      persistErr instanceof Error ? persistErr.message : "persist-fel",
    );
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        warning:
          "Token-exchange lyckades men persistens failade. KOPIERA nedan värden OMEDELBART och seeda manuellt i Vercel env eller Wix CMS — koden är single-use och kan inte upprepas.",
        details: persistErr instanceof Error ? persistErr.message : "persist-fel",
        ALIEXPRESS_ACCESS_TOKEN: tokens.access_token,
        ALIEXPRESS_REFRESH_TOKEN: tokens.refresh_token,
        expiresAt: expiresAt.toISOString(),
        refresh_expires_in_seconds: tokens.refresh_expires_in,
        account: tokens.account,
      },
      { status: 500, headers: NO_STORE },
    );
  }
}
