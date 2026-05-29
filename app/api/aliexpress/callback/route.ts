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

  // AliExpress kan returnera fel-payload (kod brand, signature, rate-limit)
  // eller wrappad payload — visa den i klartext (utan tokens) för debugging.
  // VIKTIGT: AliExpress returnerar code="0" (string) vid SUCCESS — behandla
  // det som icke-fel. Truthy-check på string "0" är true i JS → måste
  // explicit kolla mot 0/"0".
  const rawTokens = tokens as unknown as Record<string, unknown>;
  const aliexpressError = rawTokens.code ?? rawTokens.error_code ?? rawTokens.error;
  const isSuccessCode = aliexpressError === undefined
    || aliexpressError === null
    || aliexpressError === 0
    || aliexpressError === "0"
    || aliexpressError === 200
    || aliexpressError === "200";
  if (!isSuccessCode) {
    return NextResponse.json(
      {
        error: "AliExpress avvisade token-exchange.",
        aliexpress_code: aliexpressError,
        aliexpress_message: rawTokens.message ?? rawTokens.error_description ?? rawTokens.msg,
        responseKeys: Object.keys(rawTokens),
      },
      { status: 502 },
    );
  }

  // Acceptera expires_in som number ELLER numerisk sträng (vissa
  // AliExpress-flöden returnerar som sträng trots simplify=true).
  const expiresInRaw = (rawTokens.expires_in ?? rawTokens.expiresIn) as unknown;
  const expiresInNum = typeof expiresInRaw === "number"
    ? expiresInRaw
    : typeof expiresInRaw === "string" ? Number.parseInt(expiresInRaw, 10) : NaN;

  const accessToken = typeof tokens.access_token === "string" ? tokens.access_token : "";
  const refreshToken = typeof tokens.refresh_token === "string" ? tokens.refresh_token : "";

  if (!accessToken || !refreshToken || !Number.isFinite(expiresInNum) || expiresInNum <= 0) {
    return NextResponse.json(
      {
        error: "AliExpress returnerade ofullständigt token-svar.",
        hint: "Upprepa OAuth-flowet via /api/aliexpress/auth eller kontrollera redirect_uri-konfigurationen i AliExpress Open Platform.",
        responseKeys: Object.keys(rawTokens),
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        expiresInRaw,
      },
      { status: 502 },
    );
  }

  const expiresAt = new Date(Date.now() + expiresInNum * 1000);

  try {
    await getStore().saveAliExpressTokens({
      accessToken,
      refreshToken,
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
      `[callback] saveAliExpressTokens failed (access=${mask(accessToken)}, refresh=${mask(refreshToken)}):`,
      persistErr instanceof Error ? persistErr.message : "persist-fel",
    );
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        warning:
          "Token-exchange lyckades men persistens failade. KOPIERA nedan värden OMEDELBART och seeda manuellt i Vercel env eller Wix CMS — koden är single-use och kan inte upprepas.",
        details: persistErr instanceof Error ? persistErr.message : "persist-fel",
        ALIEXPRESS_ACCESS_TOKEN: accessToken,
        ALIEXPRESS_REFRESH_TOKEN: refreshToken,
        expiresAt: expiresAt.toISOString(),
        refresh_expires_in_seconds: tokens.refresh_expires_in,
        account: tokens.account,
      },
      { status: 500, headers: NO_STORE },
    );
  }
}
