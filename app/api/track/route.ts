// GET /api/track?tn=<trackingNumber>
//
// Ersätter tidigare Wix Velo `_functions/track` som blev otillgänglig efter
// DNS-cutover (fyndplats.se → Vercel). Anropar 17TRACK API direkt och
// returnerar samma JSON-format som Velo-funktionen så TrackingWidget UI:n
// inte behöver ändras.
//
// Tre lager quota-skydd:
// 1. Format-validering (regex) avvisar skräp INNAN 17TRACK kontaktas
// 2. In-memory cache (5 min TTL) hindrar refresh-spam från att slösa quota
// 3. Auto-register görs BARA om 17TRACK svarar "not registered" — inte vid
//    andra fel (ogiltigt nummer, system-error, quota-limit etc)
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

const GETINFO_URL = "https://api.17track.net/track/v2.2/gettrackinfo";
const REGISTER_URL = "https://api.17track.net/track/v2.2/register";

// 17TRACK rejected.error.code = -18019901 betyder "tracking number not
// registered". Andra koder är permanenta fel (ogiltigt format, system etc).
const NOT_REGISTERED_CODE = -18019901;

// Asiatiska transitländer som ska döljas för kunden — paketet "syns inte"
// förrän det landar i Sverige eller annat destinationsland.
const HIDDEN_COUNTRIES = new Set(["CN", "HK", "TW", "SG", "MY", "JP", "KR"]);

// Tracking-nummer är typiskt 10-30 tecken alfanumeriska. Avvisa skräp tidigt
// för att skydda 17TRACK-quota mot bottar/spam — billigaste filtret som finns.
const VALID_TN = /^[A-Z0-9]{8,40}$/;

// In-memory cache så refresh-spam inte slösar quota. Cleared vid cold start
// vilket är OK för 5-minuters TTL (sämre cache = mer 17TRACK-anrop, men
// format-filtret skyddar oss där också).
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiry: number; body: unknown; status: number }>();

function cacheGet(key: string): { body: unknown; status: number } | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiry) {
    cache.delete(key);
    return null;
  }
  return { body: hit.body, status: hit.status };
}

function cacheSet(key: string, body: unknown, status: number): void {
  // Cap för att undvika minnesläcka på serverless instances som körs länge.
  if (cache.size >= 500) {
    const drop = [...cache.keys()].slice(0, 50);
    for (const k of drop) cache.delete(k);
  }
  cache.set(key, { expiry: Date.now() + CACHE_TTL_MS, body, status });
}

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
  delivery_status?: string;
  is_delivered?: boolean;
  est_delivery_date?: string;
  carrier?: { name?: string };
  providers?: Array<{ provider?: { name?: string } }>;
  origin_info?: { trackinfo?: Track17Event[] };
  destination_info?: { trackinfo?: Track17Event[] };
  events?: Track17Event[];
  latest_event_time?: string;
}

interface Track17Response {
  code?: number;
  data?: {
    accepted?: Array<{ number?: string; track_info?: Track17Track }>;
    rejected?: Array<{ number?: string; error?: { code?: number; message?: string } }>;
  };
}

function isHiddenLocation(ev: Track17Event): boolean {
  const c1 = (ev.source_data?.country_iso || "").toUpperCase();
  const c2 = (ev.address?.country_iso || "").toUpperCase();
  if (c1 && HIDDEN_COUNTRIES.has(c1)) return true;
  if (c2 && HIDDEN_COUNTRIES.has(c2)) return true;
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

async function gettrackinfo(tn: string, apiKey: string): Promise<Track17Response> {
  const res = await fetch(GETINFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "17token": apiKey },
    body: JSON.stringify([{ number: tn }]),
    cache: "no-store",
  });
  return (await res.json()) as Track17Response;
}

async function register(tn: string, apiKey: string): Promise<void> {
  // Fire-and-check — vi bryr oss inte om response-body, bara om HTTP-statusen
  // var rimlig. Eventuella registreringsfel manifesterar sig som "not yet
  // tracked" på nästa gettrackinfo, vilket är okänt från användarens perspektiv.
  await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "17token": apiKey },
    body: JSON.stringify([{ number: tn }]),
    cache: "no-store",
  });
}

function buildResponse(json: Track17Response, tn: string): { body: unknown; status: number } {
  const accepted = json.data?.accepted?.[0];
  const rejected = json.data?.rejected?.[0];

  if (rejected?.error) {
    return {
      body: { error: rejected.error.message || "Spårningen hittades inte än" },
      status: 404,
    };
  }

  if (!accepted?.track_info) {
    return {
      body: { error: "Inget spårningsresultat hittades än. Försök igen senare." },
      status: 404,
    };
  }

  const ti = accepted.track_info;
  const allEvents: Track17Event[] = [
    ...(ti.destination_info?.trackinfo ?? []),
    ...(ti.origin_info?.trackinfo ?? []),
    ...(ti.events ?? []),
  ];
  const visibleEvents = allEvents.filter((ev) => !isHiddenLocation(ev)).map(mapEvent);

  const status = mapStatus(ti.delivery_status, ti.is_delivered);
  const carrier = ti.carrier?.name || ti.providers?.[0]?.provider?.name || "";
  const safeCarrier = /\b(china|chinese|cn|sf express|yto|sto|yunda)\b/i.test(carrier) ? "Transportör" : carrier;

  return {
    body: {
      events: visibleEvents,
      status,
      delivered: Boolean(ti.is_delivered || status === "Delivered"),
      eta: ti.est_delivery_date || null,
      carrier: safeCarrier,
      trackingNumber: accepted.number || tn,
      updatedAt: ti.latest_event_time || new Date().toISOString(),
    },
    status: 200,
  };
}

export async function GET(req: NextRequest) {
  const tn = (req.nextUrl.searchParams.get("tn") || "").trim().toUpperCase();

  // Lager 1: format-filter. Avvisa innan vi rör 17TRACK.
  if (!tn || !VALID_TN.test(tn)) {
    return NextResponse.json({ error: "Skriv in ett giltigt spårningsnummer." }, { status: 400 });
  }

  // Lager 2: cache. Idempotent på tracking-nummer i 5 min.
  const cached = cacheGet(tn);
  if (cached) {
    return NextResponse.json(cached.body, { status: cached.status });
  }

  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Spårning är inte konfigurerad", details: "TRACK17_API_KEY saknas i miljön" },
      { status: 503 },
    );
  }

  let json: Track17Response;
  try {
    json = await gettrackinfo(tn, apiKey);
  } catch {
    return NextResponse.json(
      { error: "Anslutningen till spårningen fungerade inte. Försök igen om en stund." },
      { status: 502 },
    );
  }

  // Lager 3: auto-register, men BARA vid "not registered" — inte vid andra fel
  // (ogiltigt format, system error, quota-limit) som skulle slösa quota.
  const rejectedCode = json.data?.rejected?.[0]?.error?.code;
  if (rejectedCode === NOT_REGISTERED_CODE) {
    try {
      await register(tn, apiKey);
      // Re-fetch — registrering kan ta några sekunder att propagera men oftast
      // finns första-status (RegistrationReceived) direkt.
      json = await gettrackinfo(tn, apiKey);
    } catch {
      // Tystna — vi returnerar samma "not found" som om register inte hade hänt.
    }
  }

  const { body, status } = buildResponse(json, tn);
  // Cache:a både träffar (200) och permanenta fel (404). Inte 5xx — de
  // kan vara transienta och vi vill gärna retry:a.
  if (status === 200 || status === 404) cacheSet(tn, body, status);
  return NextResponse.json(body, { status });
}
