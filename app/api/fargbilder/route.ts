// GET /api/fargbilder?pid=<wixProductId>
//
// Varje färgs HELA bildlista på en sammanslagen sida, för butikens galleri.
// Wix tar högst 15 bilder per produkt; det som inte rymdes där står i motorns
// tabell `fargbilder` (lib/aosom/fargbilder.ts). Svaret:
//
//   { val: { "<valets namn>": ["<fil-id>", …] }, gemensamma: ["<fil-id>", …] }
//
// Varje lista börjar med valets huvudbild, sedan galleriets bilder, sedan
// overflow. Fil-id:t är Wix egen (`static.wixstatic.com/media/<fil-id>`).
// Bilder som väntar på granskning (möjlig tysk text) lämnar aldrig motorn.
// En sida utan rader svarar `{ val: {}, gemensamma: [] }` — butiken använder då
// valens `linkedMedia` som förut. Ett val som saknas i `val` likaså.
//
// Samma hållning som /api/gpsr: ingen auth, för allt i svaret är bilder som
// butiken ändå visar, och en timmes cache vid kanten.

import { type NextRequest, NextResponse } from "next/server";
import { getFargbildLager } from "@/lib/store/fargbilder";
import { forButiken } from "@/lib/aosom/fargbilder";

export const dynamic = "force-dynamic";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_OK = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  const pid = req.nextUrl.searchParams.get("pid") ?? "";
  if (!ID_RE.test(pid)) {
    return NextResponse.json({ error: "ogiltigt pid" }, { status: 400 });
  }
  try {
    const rader = await getFargbildLager().lasForProdukt(pid);
    return NextResponse.json(forButiken(rader), { headers: { "Cache-Control": CACHE_OK } });
  } catch (err) {
    console.error("[fargbilder] läsfel:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "läsfel" }, { status: 502 });
  }
}
