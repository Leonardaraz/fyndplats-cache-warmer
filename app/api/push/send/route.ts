// POST /api/push/send  (INTERN — ej kund-facing)
//
// Skickar en push till en målgrupp. Auth: Bearer med INTERNAL_PUSH_SECRET
// (konstanttids-jämförelse). Anropas av interna flöden (t.ex. cache-warmer-
// appens restock-detektering) och kan användas för ad-hoc-utskick.
//
// Body:
//   { tokens?: string[], userEmail?, channel: 'order'|'restock'|'promo'|'cart',
//     title, body, data? }
//
// Målgruppen filtreras på mottagarnas preferenser (t.ex. promo hoppas över för
// den som stängt av promotions). DeviceNotRegistered-tokens städas ur Wix Data.

import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { bearerToken } from "@/lib/auth-token";
import { sendPushToAudience } from "@/lib/push-send";
import type { PushChannel } from "@/lib/push-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNELS: PushChannel[] = ["order", "restock", "promo", "cart"];

type Body = {
  tokens?: unknown;
  userEmail?: unknown;
  channel?: unknown;
  title?: unknown;
  body?: unknown;
  data?: unknown;
};

// Konstanttids-jämförelse av det interna secret:et (undvik timing-läckage).
function secretOk(provided: string | null): boolean {
  const expected = (process.env.INTERNAL_PUSH_SECRET || "").trim();
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!secretOk(bearerToken(req.headers.get("authorization")))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const channel = String(body.channel || "") as PushChannel;
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ ok: false, error: "invalid_channel" }, { status: 400 });
  }
  if (typeof body.title !== "string" || typeof body.body !== "string" || !body.title || !body.body) {
    return NextResponse.json({ ok: false, error: "missing_title_or_body" }, { status: 400 });
  }

  const tokens = Array.isArray(body.tokens) ? body.tokens.filter((t): t is string => typeof t === "string") : undefined;
  const userEmail = typeof body.userEmail === "string" ? body.userEmail : undefined;
  if ((!tokens || tokens.length === 0) && !userEmail) {
    return NextResponse.json({ ok: false, error: "missing_audience" }, { status: 400 });
  }

  const result = await sendPushToAudience({
    tokens,
    userEmail,
    channel,
    title: body.title,
    body: body.body,
    data: body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : undefined,
  });

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "push-send",
    configured: Boolean((process.env.INTERNAL_PUSH_SECRET || "").trim()),
  });
}
