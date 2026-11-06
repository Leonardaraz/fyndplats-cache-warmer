// app/api/dev/tracking-map/route.ts
//
// Dev-only endpoint for the SMS-forwarding flow:
//   POST ?action=insert  { tracking_number, customer_email, ... }
//                                        — manually map a tracking number to a
//                                          customer for testing.
//   POST ?action=simulate_sms { from, text }
//                                        — run the parser + dispatcher in-process
//                                          and return the result (NO email).
//   GET                                  — list recent tracking_mapping rows + audit.
//
// Auth: X-Dev-Secret == DEV_ENDPOINT_SECRET. Hard-fails if the env var is unset
// so this never accidentally ships open in production.

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { smsLogg, smsOmatchade, sparning } from "@/lib/wix-lager";
import { parseSms } from "@/lib/sms-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Constant-time comparison — see app/api/sms-inbound/route.ts for the
// rationale (plain `===` leaks the matching-prefix length via timing).
function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authorised(req: Request): boolean {
  const secret = process.env.DEV_ENDPOINT_SECRET;
  if (!secret) return false;
  return safeCompare(req.headers.get("x-dev-secret") ?? "", secret);
}

interface InsertBody {
  tracking_number?: string;
  order_id?: string | null;
  customer_email?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status?: string;
}

export async function POST(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "insert";

  if (action === "insert") {
    let body: InsertBody;
    try {
      body = (await req.json()) as InsertBody;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
    }
    if (!body.tracking_number || !body.customer_email) {
      return NextResponse.json(
        { ok: false, error: "tracking_number and customer_email are required" },
        { status: 400 },
      );
    }
    await sparning.sparaHelt({
      trackingNumber: body.tracking_number,
      orderId: body.order_id ?? null,
      customerEmail: body.customer_email,
      customerName: body.customer_name ?? null,
      customerPhone: body.customer_phone ?? null,
      status: body.status ?? "pending",
    });
    return NextResponse.json({ ok: true, inserted: body.tracking_number });
  }

  if (action === "simulate_sms") {
    let body: { from?: string; text?: string };
    try {
      body = (await req.json()) as { from?: string; text?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
    }
    if (typeof body.from !== "string" || typeof body.text !== "string") {
      return NextResponse.json({ ok: false, error: "from and text required" }, { status: 400 });
    }
    const parsed = parseSms({ from: body.from, text: body.text });
    return NextResponse.json({ ok: true, parsed });
  }

  return NextResponse.json({ ok: false, error: `unknown action: ${action}` }, { status: 400 });
}

export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    mappings: await sparning.senaste(50),
    recent_audit: await smsLogg.senaste(20),
    unmatched: await smsOmatchade.senaste(20),
  });
}
