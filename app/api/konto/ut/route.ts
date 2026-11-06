// POST /api/konto/ut — loggar ut på den här enheten.

import { NextResponse } from "next/server";
import { SESSION_KAKA, TECKEN_KAKA, kakaAttribut, teckenAttribut } from "@/lib/medlem/session";
import { PRIVAT } from "@/lib/medlem/inloggad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const https = new URL(req.url).protocol === "https:";
  const formular = !(req.headers.get("content-type") ?? "").includes("application/json");
  const res = formular
    ? NextResponse.redirect(new URL("/konto", req.url), { status: 303, headers: PRIVAT })
    : NextResponse.json({ ok: true }, { headers: PRIVAT });
  res.cookies.set(SESSION_KAKA, "", kakaAttribut(0, https));
  res.cookies.set(TECKEN_KAKA, "", teckenAttribut(0, https));
  return res;
}
