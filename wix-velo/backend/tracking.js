// Wix Velo backend — 17TRACK-integration
// Auto-registrerar tracking-nummer hos 17TRACK och cachar carrier-events i
// Wix Data så att /sparning-sidan kan visa dem instant.
//
// === FÖRBEREDELSE ===
// 1) I Wix Editor: skapa Wix Data-collection "TrackingEvents" med fälten:
//    - trackingNumber (Text, indexerad, unik)
//    - orderId        (Text, indexerad)
//    - status         (Text)            // "registered"|"in_transit"|"out_for_delivery"|"delivered"|"alert"|"undelivered"
//    - statusCode     (Number)          // 17TRACK numerisk kod (10/20/30/35/40/50)
//    - carrier        (Text)
//    - events         (Object)          // array [{time, description, location}]
//    - lastFetchedAt  (Date)
//    - deliveredAt    (Date) (kan vara tom)
// 2) Sätt collection-permissions: Read = Anyone, Write = Admin (vi skriver
//    bara från Velo-backend som har full access).
// 3) Lägg till `SEVENTEEN_TRACK_API_KEY` i Wix Secrets Manager.

import { fetch } from "wix-fetch";
import wixData from "wix-data";
import { getSecret } from "wix-secrets-backend";

const COLLECTION = "TrackingEvents";
const API_BASE = "https://api.17track.net/track/v2.2";

// Vi visar ALDRIG ursprungslandet eller leverantörens carrier-namn för
// kunden — paketet ska se ut att komma från "Fyndplats Frakt". Den här listan
// matchar mot 17TRACK:s providers[].provider.country och events[].location för
// att filtrera bort allt utländskt tills paketet är i destinationslandet.
const ORIGIN_COUNTRIES = ["CN", "HK", "TW", "SG", "JP", "KR", "VN", "TH", "MY", "ID"];
const DESTINATION_COUNTRY = "SE";
const PUBLIC_CARRIER_NAME = "Fyndplats Frakt";

// Heuristik: dölj events vars beskrivning eller plats nämner ursprungsland/
// känsliga ortsnamn. Vid minsta osäkerhet → dölj. Hellre färre rader än läckor.
const LEAKY_PATTERN = /\b(china|chinese|hong\s?kong|cainiao|shenzhen|guangzhou|shanghai|beijing|shantou|shatian|yiwu|aliexpress|asia|asian|origin\s+country|country\s+of\s+origin|departed\s+from\s+(?:origin|country)|outbound|inbound\s+at\s+(?:origin|sorting))\b/i;

// 17TRACK status-kod → vårt internformat (matchar stegindikatorn på sidan).
function mapStatus(code) {
  switch (Number(code)) {
    case 10: return { status: "in_transit",       step: "shipped"        };
    case 20: return { status: "pickup",           step: "shipped"        };
    case 30: return { status: "undelivered",      step: "out_for_delivery" };
    case 35: return { status: "alert",            step: "out_for_delivery" };
    case 40: return { status: "delivered",        step: "delivered"      };
    case 50: return { status: "expired",          step: "alert"          };
    default: return { status: "registered",       step: "packed"         };
  }
}

async function callApi(path, body) {
  const apiKey = await getSecret("SEVENTEEN_TRACK_API_KEY");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "17token": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`17TRACK ${path} (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Registrerar ett tracking-nummer hos 17TRACK och sparar en placeholder i
 * Wix Data så att sidan kan visa "Registrerad" omedelbart. Idempotent —
 * registreras redan numret blir det en no-op, och vi crashar inte.
 */
export async function registerTracking(trackingNumber, orderId, carrier) {
  if (!trackingNumber) return;

  // 1. Placeholder i Wix Data (visas direkt på /sparning).
  const existing = await wixData.query(COLLECTION)
    .eq("trackingNumber", trackingNumber)
    .find({ suppressAuth: true });

  const placeholder = {
    trackingNumber,
    orderId,
    carrier: PUBLIC_CARRIER_NAME,
    status: "registered",
    statusCode: 0,
    events: [],
    lastFetchedAt: new Date(),
  };

  if (existing.items.length === 0) {
    await wixData.insert(COLLECTION, placeholder, { suppressAuth: true });
  } else if (!existing.items[0].orderId && orderId) {
    // Komplettera orderId om det saknas (t.ex. webhook hann först).
    await wixData.update(COLLECTION, { ...existing.items[0], orderId }, { suppressAuth: true });
  }

  // 2. Skicka till 17TRACK.
  try {
    await callApi("/register", [{ number: trackingNumber }]);
  } catch (err) {
    console.warn(`[17track] register ${trackingNumber}:`, err.message);
  }
}

/**
 * Plockar ut "destinations-providern" (svensk fraktbolag) ur 17TRACK-svaret
 * och kastar ursprungslandets provider (Kina/Cainiao). Om destinationen ännu
 * inte finns returneras tom array — sidan visar då "Spårningen aktiveras
 * inom kort" tills paketet faktiskt nått Sverige.
 */
function sanitizeProviders(providers) {
  if (!Array.isArray(providers)) return [];
  // Föredra explicit destinationsprovider (country = SE).
  const dest = providers.find((p) => p?.provider?.country?.toUpperCase() === DESTINATION_COUNTRY);
  if (dest) return [dest];
  // Annars: filtrera bort kända ursprungsländer.
  return providers.filter(
    (p) => !ORIGIN_COUNTRIES.includes(String(p?.provider?.country || "").toUpperCase()),
  );
}

function sanitizeEvents(rawEvents) {
  return (rawEvents || [])
    .filter((e) => {
      const text = `${e.description || ""} ${e.location || ""} ${e.stage || ""}`;
      return !LEAKY_PATTERN.test(text);
    })
    .map((e) => ({
      time: e.time_iso || e.time_utc || "",
      // Strippa platsen helt om den ändå råkade slinka igenom filtret.
      description: (e.description || e.stage || "").replace(LEAKY_PATTERN, "").trim() || "Uppdatering",
      location: LEAKY_PATTERN.test(e.location || "") ? "" : (e.location || ""),
    }));
}

/**
 * Uppdaterar events i Wix Data utifrån 17TRACK webhook-payload.
 * 17TRACK skickar en JSON med `event` och `data.track_info` när status ändras.
 */
export async function applyWebhookPayload(payload) {
  const info = payload?.data?.track_info || payload?.data || {};
  const trackingNumber = info.number || payload?.data?.number;
  if (!trackingNumber) throw new Error("trackingNumber saknas i payloaden");

  const tracking = info.latest_status || {};
  const safeProviders = sanitizeProviders(info.tracking?.providers);
  const rawEvents = safeProviders.flatMap((p) => p.events || []);
  const events = sanitizeEvents(rawEvents);
  const statusCode = Number(tracking.status_code ?? tracking.status ?? 0);
  const { status, step } = mapStatus(statusCode);

  const existing = await wixData.query(COLLECTION)
    .eq("trackingNumber", trackingNumber)
    .find({ suppressAuth: true });

  const record = {
    trackingNumber,
    orderId: existing.items[0]?.orderId || "",
    // ALDRIG fraktbolagets riktiga namn — alltid generisk Fyndplats-branding.
    carrier: PUBLIC_CARRIER_NAME,
    status,
    statusCode,
    events,
    lastFetchedAt: new Date(),
    deliveredAt: status === "delivered" ? new Date() : existing.items[0]?.deliveredAt,
  };

  if (existing.items.length === 0) {
    await wixData.insert(COLLECTION, record, { suppressAuth: true });
  } else {
    await wixData.update(COLLECTION, { ...existing.items[0], ...record }, { suppressAuth: true });
  }

  return { trackingNumber, status, step, statusCode, eventCount: events.length };
}

/** Läser cachen — används av sidan via http-function. */
export async function getTrackingData(trackingNumber) {
  const result = await wixData.query(COLLECTION)
    .eq("trackingNumber", trackingNumber)
    .find({ suppressAuth: true });
  return result.items[0] || null;
}

/**
 * Forced re-fetch direkt från 17TRACK (om webhooken har missats).
 * Anropas av sidan om cachen är äldre än X timmar.
 */
export async function forceRefresh(trackingNumber) {
  const data = await callApi("/gettrackinfo", [{ number: trackingNumber }]);
  const accepted = data?.data?.accepted?.[0];
  if (!accepted) return null;
  return applyWebhookPayload({ data: accepted });
}
