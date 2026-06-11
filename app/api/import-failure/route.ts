// POST /api/import-failure
//
// Tar emot bulk-importens skrap-fel från extensionen (fire-and-forget) och
// skriver dem i audit-loggen. Bakgrund (2026-06-11): 12/13 produkter föll i
// tilläggets skrapfas utan att något nådde servern — diagnosen krävde en
// skärmdump av modalen. Nu syns varje ✗ med exakt feltext server-side:
// /admin → audit, kind "import-failure".
//
// Best-effort by design: ett 4xx/5xx här får aldrig påverka tillägget (som
// inte ens väntar på svaret).

import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const FailureSchema = z.object({
  url: z.string().max(500).optional(),
  title: z.string().max(200).optional(),
  error: z.string().min(1).max(500),
  pass: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }
  const parsed = FailureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel" }, { status: 422 });
  }
  const { url, title, error, pass } = parsed.data;
  // Produkt-id ur AE-URL:en om den finns (referens i audit-listan).
  const pid = url?.match(/\/item\/(\d+)\.html/)?.[1] ?? "okänd";
  await audit(
    "import-failure",
    pid,
    `${pass ?? "pass1"}: ${error}${title ? ` — ${title}` : ""}`,
  );
  return NextResponse.json({ ok: true });
}
