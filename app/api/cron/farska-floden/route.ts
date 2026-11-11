// app/api/cron/farska-floden/route.ts
// Vercel Cron: GET /api/cron/farska-floden, varannan timme (vercel.json).
//
// Hämtar sitemapen och de tre öppna flödena en gång, så att CDN:ens kopia
// förnyas varannan timme i stället för bara när någon utifrån hämtar dem.
// Skälet och mätningen står i lib/flodesvarmning.ts.
//
// AUTH som /api/cron/warm-and-ping: med CRON_SECRET satt krävs den, utan den
// kör rutten ändå. Ett obehörigt anrop hämtar bara fyra av våra egna öppna
// adresser.
import { NextResponse } from "next/server";
import { SITE } from "../../../../lib/site-urls";
import { flodesrad, hamtaFloden } from "../../../../lib/flodesvarmning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const hemlig = process.env.CRON_SECRET;
  if (hemlig && request.headers.get("authorization") !== `Bearer ${hemlig}`) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  // Bara i produktion: ett förhandsbygge ligger bakom inloggning och har ingen
  // CDN-kopia som någon utifrån läser.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({ ok: true, hoppad: "inte produktion" });
  }

  const { utfall, hoppade } = await hamtaFloden(SITE);
  const fel = utfall.filter((u) => u.status !== 200);
  const rad = `[farska-floden] ${utfall.map(flodesrad).join(" | ")}${hoppade.length ? ` | hoppade: ${hoppade.join(", ")}` : ""}`;
  if (fel.length > 0) console.error(rad);
  else console.log(rad);
  return NextResponse.json({ ok: fel.length === 0, utfall, hoppade });
}
