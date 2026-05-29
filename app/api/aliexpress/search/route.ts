// POST /api/aliexpress/search
//
// Söker AliExpress-produkter på text via DS API (aliexpress.ds.text.search).
// Om appens permission-grupp inte innehåller search-metoden returneras ett
// gracefully-fel så UI:n kan falla tillbaka till "paste URL"-flödet.

import { type NextRequest, NextResponse } from "next/server";
import { searchAliExpressByText } from "@/lib/aliexpress/client";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: { query?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "Tom query" }, { status: 400 });
  }

  try {
    const results = await searchAliExpressByText(query);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sökfel";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          "Om felet är 'method not exist' eller 'no permission' har vår app inte sök-permission. Använd paste-URL-fältet istället.",
      },
      { status: 502 },
    );
  }
}
