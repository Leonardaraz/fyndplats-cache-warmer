// GET /api/history?url=...  → skanningshistorik + förändring sedan förra gången.
// Visar om sidan blivit bättre eller sämre över tid ("blev mina fixar bättre?").

import { type NextRequest, NextResponse } from "next/server";
import { getSnapshotStore, diffSnapshots } from "@/lib/scan/history";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url krävs" }, { status: 400 });

  const history = await getSnapshotStore().history(url);
  const diff = history.length >= 2 ? diffSnapshots(history[1], history[0]) : null;

  return NextResponse.json({ url, history, diffSincePrevious: diff });
}
