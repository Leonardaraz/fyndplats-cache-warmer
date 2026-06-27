// POST /api/push/register
//
// Native-appen registrerar (eller uppdaterar) sin Expo push-token. Upsertas i
// Wix Data keyat på deviceId. Body:
//   { expoToken, deviceId, platform, appVersion, email? }
//
// Svarar 200 { ok: true } vid lyckad upsert. Saknas Wix-creds eller
// collectionen ännu → 200 { ok: true, skipped } (appen ska inte krascha; tokens
// börjar persisteras så snart FyndplatsPushTokens finns). 400 vid felaktig body.

import { NextResponse, type NextRequest } from "next/server";
import { isValidExpoToken } from "@/lib/expo-push";
import { upsertPushToken, type PushPlatform } from "@/lib/push-tokens";
import { bearerToken, verifyUserToken } from "@/lib/auth-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  expoToken?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
  email?: string;
};

const PLATFORMS: PushPlatform[] = ["ios", "android", "web"];

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!isValidExpoToken(body.expoToken)) {
    return NextResponse.json({ ok: false, error: "invalid_expo_token" }, { status: 400 });
  }
  if (!body.deviceId || typeof body.deviceId !== "string") {
    return NextResponse.json({ ok: false, error: "missing_device_id" }, { status: 400 });
  }
  const platform = (body.platform || "").toLowerCase() as PushPlatform;
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ ok: false, error: "invalid_platform" }, { status: 400 });
  }

  // SÄKERHET: bind e-post till enheten BARA om anroparen bevisar ägarskap via
  // magic-link-JWT (samma krav som /api/push/preferences). En klient-angiven
  // `body.email` UTAN giltig token ignoreras — annars kunde vem som helst
  // registrera sin enhet mot en annans e-post och kapa dennes order-/frakt-
  // pushar (läcker ordernummer + spårnummer till fel person). Enheten registreras
  // ändå (utan e-post) så den kan ta emot e-postlösa pushar.
  const claims = verifyUserToken(bearerToken(req.headers.get("authorization")) ?? "");
  const verifiedEmail = typeof claims?.email === "string" ? claims.email : undefined;

  const result = await upsertPushToken({
    expoToken: body.expoToken.trim(),
    deviceId: body.deviceId.trim(),
    platform,
    appVersion: typeof body.appVersion === "string" ? body.appVersion : "",
    email: verifiedEmail,
  });

  if (result.ok) return NextResponse.json({ ok: true });
  if ("skipped" in result) return NextResponse.json({ ok: true, skipped: result.skipped });
  return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 502 });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "push-register" });
}
