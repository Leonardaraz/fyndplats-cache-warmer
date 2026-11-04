// GET /api/konto/lank?t=…  — länken i inloggningsmejlet.
//
// Loggar INTE in. Den lägger länkens token i en kort httpOnly-kaka och skickar
// vidare till /konto/logga-in, där kunden trycker på "Logga in". Två skäl:
//   - mejlfilter som öppnar länkar (Safe Links och liknande) gör GET; ett
//     engångstoken som förbrukades av ett GET vore förbrukat innan kunden
//     ens sett mejlet;
//   - sidan bär analysskript, och en token i sidans adress hade följt med
//     till dem. Rutten här har inga skript, och sidans adress har ingen token.

import { NextResponse } from "next/server";
import { GILTIG_MS, LANK_KAKA, arToken } from "@/lib/medlem/inloggning";
import { kakaAttribut } from "@/lib/medlem/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const t = u.searchParams.get("t");
  const till = new URL("/konto/logga-in", u.origin);
  if (!arToken(t)) {
    till.pathname = "/konto";
    till.searchParams.set("fel", "lank");
    return NextResponse.redirect(till, { status: 303, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
  const res = NextResponse.redirect(till, { status: 303, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  res.cookies.set(LANK_KAKA, t, kakaAttribut(Math.floor(GILTIG_MS / 1000), u.protocol === "https:"));
  return res;
}
