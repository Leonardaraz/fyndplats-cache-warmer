// app/api/dev/tracking-map/route.ts
//
// Dev-only endpoint for the SMS-forwarding flow:
//   POST ?action=migrate                 — apply the SMS schema (idempotent).
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
import { sql, runMigration } from "@/lib/db";
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

  if (action === "migrate") {
    await runMigration();
    return NextResponse.json({ ok: true, migrated: true });
  }

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
    await sql/*sql*/`
      INSERT INTO tracking_mapping (
        tracking_number, order_id, customer_email, customer_name, customer_phone, status
      ) VALUES (
        ${body.tracking_number},
        ${body.order_id ?? null},
        ${body.customer_email},
        ${body.customer_name ?? null},
        ${body.customer_phone ?? null},
        ${body.status ?? "pending"}
      )
      ON CONFLICT (tracking_number) DO UPDATE SET
        order_id       = EXCLUDED.order_id,
        customer_email = EXCLUDED.customer_email,
        customer_name  = EXCLUDED.customer_name,
        customer_phone = EXCLUDED.customer_phone,
        status         = EXCLUDED.status,
        updated_at     = NOW()
    `;
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
  const mappings = await sql/*sql*/`
    SELECT tracking_number, order_id, customer_email, customer_name, status, updated_at
      FROM tracking_mapping
     ORDER BY updated_at DESC
     LIMIT 50
  `;
  const audit = await sql/*sql*/`
    SELECT id, received_at, raw_from, carrier, status, tracking_number, matched, email_sent, error
      FROM sms_audit
     ORDER BY received_at DESC
     LIMIT 20
  `;
  const unmatched = await sql/*sql*/`
    SELECT id, received_at, raw_from, tracking_number, reason
      FROM sms_unmatched
     ORDER BY received_at DESC
     LIMIT 20
  `;
  return NextResponse.json({
    ok: true,
    mappings: mappings.rows,
    recent_audit: audit.rows,
    unmatched: unmatched.rows,
  });
}
