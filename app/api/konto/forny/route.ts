// POST /api/konto/forny — anropas av Mina sidor vid varje besök.
//
// 90 dagar rullande (Leonards beslut 2026-11-04): en session äldre än ett
// dygn skrivs om med 90 nya dagar. En ogiltig kaka, eller ett konto som
// spärrats, rensas.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_KAKA, behoverFornyas, kakaAttribut, lasSession, nySession } from "@/lib/medlem/session";
import { hamtaMedlem, medlemsHemlighet } from "@/lib/medlem/lager";
import { PRIVAT } from "@/lib/medlem/inloggad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const https = new URL(req.url).protocol === "https:";
  const hemlighet = medlemsHemlighet();
  const token = (await cookies()).get(SESSION_KAKA)?.value;
  const nuMs = Date.now();
  const s = lasSession(token, hemlighet, nuMs);
  const rensa = () => {
    const res = NextResponse.json({ ok: false }, { headers: PRIVAT });
    if (token) res.cookies.set(SESSION_KAKA, "", kakaAttribut(0, https));
    return res;
  };
  if (!s || !hemlighet) return rensa();
  if (!behoverFornyas(s, nuMs)) return NextResponse.json({ ok: true, fornyad: false }, { headers: PRIVAT });
  try {
    const medlem = await hamtaMedlem(s.sub);
    if (!medlem || medlem.status !== "aktiv") return rensa();
  } catch {
    // Wix svarar inte: förnya inte nu, men logga inte ut heller.
    return NextResponse.json({ ok: true, fornyad: false }, { headers: PRIVAT });
  }
  const ny = nySession(s.sub, s.email, nuMs, hemlighet);
  const res = NextResponse.json({ ok: true, fornyad: true }, { headers: PRIVAT });
  res.cookies.set(SESSION_KAKA, ny.token, kakaAttribut(ny.maxAgeS, https));
  return res;
}
