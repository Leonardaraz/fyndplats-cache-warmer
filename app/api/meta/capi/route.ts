// POST /api/meta/capi
//
// Server-side proxy till Meta Conversions API. Tar emot ett event från klienten
// (lib/meta.ts metaTrack), berikar med IP + User-Agent från request-headers
// (fångas server-side, vilket är hela poängen — adblock kan inte stoppa det),
// hashar ev. PII och vidarebefordrar via lib/meta-capi → Graph API.
//
// Body-format (från klienten):
//   { event_name, event_id, event_source_url, action_source,
//     custom_data, user_data: { em?, ph?, fbp?, fbc? } }
//
// Konfiguration via env (se lib/meta-capi.ts): META_PIXEL_ID,
// META_CAPI_ACCESS_TOKEN, META_TEST_EVENT_CODE (valfri).

import { NextResponse, type NextRequest } from "next/server";
import { metaCapiConfigured, sendMetaCapiEvent } from "@/lib/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingBody = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  action_source?: string;
  custom_data?: Record<string, unknown>;
  user_data?: { em?: string; ph?: string; fbp?: string; fbc?: string };
};

function clientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || undefined;
}

export async function POST(req: NextRequest) {
  // Inte konfigurerat ännu → svälj tyst med 200 så klienten inte loggar fel.
  // Pixeln/CAPI är helt enkelt inaktiv tills env-variablerna är ifyllda.
  if (!metaCapiConfigured()) {
    return NextResponse.json({ ok: false, skipped: "not_configured" }, { status: 200 });
  }

  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!body.event_name) {
    return NextResponse.json({ ok: false, error: "missing_event_name" }, { status: 400 });
  }

  const ud = body.user_data || {};
  const result = await sendMetaCapiEvent({
    eventName: body.event_name,
    eventId: body.event_id,
    eventSourceUrl: body.event_source_url,
    actionSource: body.action_source || "website",
    customData: body.custom_data,
    userData: {
      email: ud.em,
      phone: ud.ph,
      fbp: ud.fbp,
      fbc: ud.fbc,
      clientIpAddress: clientIp(req),
      clientUserAgent: req.headers.get("user-agent") || undefined,
    },
  });

  if (!result.ok) {
    const status = result.error === "graph_error" ? 502 : 200;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}

// GET för enkel health-check (verifiera deploy + konfiguration utan att skicka
// ett event). Avslöjar inte token — bara om den är satt.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "meta-capi",
    configured: metaCapiConfigured(),
    testEventMode:
      process.env.NODE_ENV !== "production" && Boolean(process.env.META_TEST_EVENT_CODE),
  });
}
