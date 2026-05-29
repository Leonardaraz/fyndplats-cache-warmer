// POST /api/aliexpress/auto-map
// AI-matchar alla omappade Wix-produkter mot AliExpress. High confidence
// auto-mappas; medium/low sparas som förslag för bekräftelse i /admin/mappings.
// Token-skyddad. Kan köras i batchar via ?limit= för att hålla sig under
// serverless-tidsgränsen.
//
//   curl -X POST "https://<host>/api/aliexpress/auto-map?limit=50" \
//     -H "x-fyndplats-token: <TOKEN>"
//
// Query/body-parametrar:
//   limit       max antal produkter denna körning (default: alla)
//   autoCreate  "false" för att aldrig auto-mappa (allt blir förslag)
//   throttleMs  paus mellan produkter (default 350)

import { type NextRequest, NextResponse } from "next/server";
import { checkToken } from "@/lib/auth";
import { autoMapUnmapped } from "@/lib/aliexpress/auto-map-run";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return NextResponse.json({ error: "limit måste vara ett positivt tal" }, { status: 400 });
  }
  const autoCreate = url.searchParams.get("autoCreate") !== "false";
  const throttleRaw = url.searchParams.get("throttleMs");
  const throttleMs = throttleRaw ? Number(throttleRaw) : undefined;

  try {
    const summary = await autoMapUnmapped({ limit, autoCreateHighConfidence: autoCreate, throttleMs });
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Okänt fel vid auto-mappning" },
      { status: 500 },
    );
  }
}
