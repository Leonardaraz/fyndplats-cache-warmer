// Skyddar interna endpoints. Browser-tillägget skickar samma hemliga token
// i x-fyndplats-token-headern. Använd timing-säker jämförelse.
import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

export function isAuthorized(req: Request | NextRequest): boolean {
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!expected) return false;
  const provided = req.headers.get("x-fyndplats-token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Returnerar en 401-respons om token är fel, annars null. */
export function checkToken(req: NextRequest): NextResponse | null {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  return null;
}
