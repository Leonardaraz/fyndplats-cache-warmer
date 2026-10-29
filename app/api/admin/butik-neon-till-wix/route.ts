// Butikens flytt från Neon till Wix (grenen headless-site, lib/neon-till-wix.ts
// och /api/admin/neon-till-wix där) startas från samma workflow som motorns,
// läget `butik`. GitHub Actions har bara CRON_SECRET; butikens /api/admin/*
// släpps igenom av dess proxy bara med ADMIN_SECRET som kakan fp_admin. Motorn
// har den nyckeln (lib/headless/produktsida.ts), så den här rutten tar emot
// workflowens anrop och skickar det vidare.
//
// ☠️ Bara de parametrar kopieringen tar skickas vidare, och svaret går tillbaka
// som det kom: butiken redigerar själv (hashade id, korta fel, förseglad
// markör). Nyckeln går som kaka och Bearer, aldrig i adressen.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { butikensBas } from "@/lib/headless/produktsida";
import { butikensAdress } from "@/lib/headless/butik-neon-till-wix";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const nyckel = process.env.ADMIN_SECRET;
  if (!nyckel) return NextResponse.json({ ok: false, error: "ADMIN_SECRET saknas i motorn" }, { status: 503 });

  let res: Response;
  try {
    res = await fetch(butikensAdress(req.url, butikensBas()), {
      headers: {
        cookie: `fp_admin=${nyckel}`,
        authorization: `Bearer ${nyckel}`,
        "user-agent": "fyndplats-cache-warmer/neon-till-wix",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(290_000),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "butiken svarade inte" }, { status: 502 });
  }
  const text = await res.text();
  let kropp: unknown;
  try {
    kropp = JSON.parse(text);
  } catch {
    // En omdirigering eller en HTML-sida: proxyn släppte inte igenom nyckeln.
    return NextResponse.json({ ok: false, error: `butiken svarade ${res.status} utan JSON` }, { status: 502 });
  }
  return NextResponse.json(kropp, { status: res.status });
}
