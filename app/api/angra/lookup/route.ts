// POST /api/angra/lookup
// Slår upp en order på { orderNumber, email } i den lokala orders-spegeln och
// returnerar raderna så kunden kan välja vilka artiklar hen vill ångra.
//
// Integritet: e-posten är ägar-verifieringen. Matchar den inte (eller ordern
// finns inte) svarar vi { found: false } UTAN att avslöja om numret existerar —
// ingen kan räkna upp andras ordrar. Hittas inget faller formuläret tillbaka på
// manuell inmatning (ångerrätten får aldrig blockeras av ett uppslag).

import { NextResponse, type NextRequest } from "next/server";
import { lookupOrderItems } from "@/lib/withdrawal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enkel in-memory rate-limit (skyddar DB mot spam-uppslag). Per IP, glidande fönster.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 20;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) for (const k of [...HITS.keys()].slice(0, 200)) HITS.delete(k);
  return arr.length > MAX_HITS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ found: false, error: "För många försök. Vänta en stund." }, { status: 429 });
  }

  let body: { orderNumber?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!orderNumber || !EMAIL_RE.test(email)) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const { found, items } = await lookupOrderItems(orderNumber, email);
  return NextResponse.json({ found, items }, { status: 200 });
}
