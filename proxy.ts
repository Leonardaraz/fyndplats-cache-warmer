import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next 16: "proxy" ersätter den deprecade "middleware"-konventionen (samma API).
// Skyddar /admin/* och /api/admin/* med en delad hemlighet (ADMIN_SECRET).
// Åtkomst: besök en admin-URL med ?key=<ADMIN_SECRET> en gång → en httpOnly-
// cookie sätts (8h) och resten av admin funkar utan nyckeln i URL:en.
// Saknas ADMIN_SECRET i miljön låses admin helt (404) — aldrig oskyddat.
const COOKIE = "fp_admin";

export function proxy(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return new NextResponse("Not found", { status: 404 });

  if (req.cookies.get(COOKIE)?.value === secret) return NextResponse.next();

  const key = req.nextUrl.searchParams.get("key");
  if (key && key === secret) {
    // Rensa nyckeln ur URL:en efter att cookien satts (snyggare + läcker inte i historik).
    const url = req.nextUrl.clone();
    url.searchParams.delete("key");
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, secret, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    return res;
  }
  return new NextResponse("Not found", { status: 404 });
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
