// GET /api/track?tn=<trackingNumber>
//
// Ersätter tidigare Wix Velo `_functions/track` som blev otillgänglig efter
// DNS-cutover (fyndplats.se → Vercel). Anropar 17TRACK API direkt och
// returnerar samma JSON-format som Velo-funktionen så TrackingWidget UI:n
// inte behöver ändras.
//
// Anonymisering bevarad från Velo: events i CN/HK/TW/SG/MY-transit skippas
// så kunden inte ser ursprungslandet. Carrier-namn maskas mot generiskt
// "Transportör" på origin-events.
//
// Env-krav (i Vercel project settings → Environment Variables):
//   TRACK17_API_KEY  — API-key från https://api.17track.net/

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = "https://api.17track.net/track/v2.2/gettrackinfo";

// Asiatiska transitländer som ska döljas för kunden — paketet "syns inte"
// förrän det landar i Sverige eller annat destinationsland.
const HIDDEN_COUNTRIES = new Set(["CN", "HK", "TW", "SG", "MY", "JP", "KR"]);

interface Track17Event {
  time_iso?: string;
  time_utc?: string;
  description?: string;
  description_translation?: { description?: string };
  location?: string;
  stage?: string;
  sub_status?: string;
  source_data?: { country?: string; country_iso?: string };
  address?: { country?: string; country_iso?: string };
}

interface Track17Track {
  e?: string;
  delivery_status?: string;
  is_delivered?: boolean;
  est_delivery_date?: string;
  shipping_country?: string;
  shipping_country_iso?: string;
  delivery_country?: string;
  delivery_country_iso?: string;
  carrier_code?: string;
  carrier?: { name?: string };
  providers?: Array<{ provider?: { name?: string } }>;
  providers_hash?: number;
  origin_info?: { trackinfo?: Track17Event[]; latest_event?: Track17Event };
  destination_info?: { trackinfo?: Track17Event[]; latest_event?: Track17Event };
  events?: Track17Event[];
  latest_event_info?: string;
  latest_event_time?: string;
}

interface Track17Response {
  code?: number;
  data?: {
    accepted?: Array<{
      number?: string;
      track_info?: Track17Track;
    }>;
    rejected?: Array<{ number?: string; error?: { code?: number; message?: string } }>;
  };
}

function isHiddenLocation(ev: Track17Event): boolean {
  const c1 = (ev.source_data?.country_iso || "").toUpperCase();
  const c2 = (ev.address?.country_iso || "").toUpperCase();
  if (c1 && HIDDEN_COUNTRIES.has(c1)) return true;
  if (c2 && HIDDEN_COUNTRIES.has(c2)) return true;
  // Fallback på location-string ("Shenzhen, CN" / "Hong Kong" osv).
  const loc = (ev.location || "").toUpperCase();
  if (/\b(CN|CHINA|KINA|SHENZHEN|HONGKONG|HONG\s*KONG|TAIWAN|SINGAPORE|MALAYSIA)\b/.test(loc)) return true;
  return false;
}

function mapEvent(ev: Track17Event): {
  time: string;
  description: string;
  location: string;
  status: string;
} {
  return {
    time: ev.time_iso || ev.time_utc || "",
    description: ev.description_translation?.description || ev.description || ev.sub_status || "",
    location: ev.location || "",
    status: ev.stage || ev.sub_status || "",
  };
}

function mapStatus(deliveryStatus: string | undefined, isDelivered: boolean | undefined): string {
  if (isDelivered || deliveryStatus === "Delivered") return "Delivered";
  switch (deliveryStatus) {
    case "OutForDelivery": return "OutForDelivery";
    case "AvailableForPickup": return "AvailableForPickup";
    case "Transit":
    case "InTransit": return "InTransit";
    case "Pickup": return "Pickup";
    case "Exception": return "Exception";
    case "Expired": return "Expired";
    case "NotFound": return "NotFound";
    default: return deliveryStatus || "InfoReceived";
  }
}

export async function GET(req: NextRequest) {
  const tn = (req.nextUrl.searchParams.get("tn") || "").trim();
  if (!tn || tn.length < 5) {
    return NextResponse.json({ error: "tn (trackingNumber) krävs" }, { status: 400 });
  }

  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Spårning är inte konfigurerad", details: "TRACK17_API_KEY saknas i miljön" },
      { status: 503 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "17token": apiKey,
      },
      body: JSON.stringify([{ number: tn.toUpperCase() }]),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Anslutningen till spårningen fungerade inte. Försök igen om en stund." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Spårningen är tillfälligt otillgänglig. Försök igen om en stund." },
      { status: 502 },
    );
  }

  const json = (await upstream.json()) as Track17Response;
  const accepted = json.data?.accepted?.[0];
  const rejected = json.data?.rejected?.[0];

  if (rejected?.error) {
    // 17TRACK lägger spårningsnumret i "rejected" om det inte hittas, är ogiltigt
    // eller behöver registreras först. Returnera 404 så TrackingWidget visar
    // "tar 1-2 dagar"-meddelandet.
    return NextResponse.json(
      { error: rejected.error.message || "Spårningen hittades inte än" },
      { status: 404 },
    );
  }

  if (!accepted?.track_info) {
    return NextResponse.json(
      { error: "Inget spårningsresultat hittades än. Försök igen senare." },
      { status: 404 },
    );
  }

  const ti = accepted.track_info;
  // 17TRACK v2.2 splittar events i origin/destination. Vi visar bara destination
  // + filtrerar bort övriga asiatiska transit-events oavsett.
  const allEvents: Track17Event[] = [
    ...(ti.destination_info?.trackinfo ?? []),
    ...(ti.origin_info?.trackinfo ?? []),
    ...(ti.events ?? []),
  ];
  const visibleEvents = allEvents.filter((ev) => !isHiddenLocation(ev)).map(mapEvent);

  const status = mapStatus(ti.delivery_status, ti.is_delivered);
  const carrier = ti.carrier?.name || ti.providers?.[0]?.provider?.name || "";
  // Maska bort kinesiska transportörsnamn på origin
  const safeCarrier = /\b(china|chinese|cn|sf express|yto|sto|yunda)\b/i.test(carrier) ? "Transportör" : carrier;

  return NextResponse.json({
    events: visibleEvents,
    status,
    delivered: Boolean(ti.is_delivered || status === "Delivered"),
    eta: ti.est_delivery_date || null,
    carrier: safeCarrier,
    trackingNumber: accepted.number || tn,
    updatedAt: ti.latest_event_time || new Date().toISOString(),
  });
}
