// Wix Velo backend — 17TRACK v2.4-integration
// Auto-registrerar tracking-nummer hos 17TRACK med svenska översättningar,
// cachar carrier-events i Wix Data så att /sparning-sidan kan visa dem
// instant och med komplett dropship-anonymisering.
//
// === FÖRBEREDELSE ===
// 1) I Wix Editor: skapa Wix Data-collection "TrackingEvents":
//    - trackingNumber (Text, indexerad, unik)
//    - orderId        (Text, indexerad)
//    - status         (Text)         // 17TRACK string enum
//    - subStatus      (Text)
//    - carrier        (Text)         // alltid "Fyndplats Frakt"
//    - events         (Object)       // array
//    - milestone      (Object)       // array av key_stage + time_iso
//    - lastFetchedAt  (Date)
//    - deliveredAt    (Date) (kan vara tom)
// 2) Permissions: Read=Anyone, Write=Admin
// 3) Wix Secrets Manager: lägg SEVENTEEN_TRACK_API_KEY

import { fetch } from "wix-fetch";
import wixData from "wix-data";
import { getSecret } from "wix-secrets-backend";

const COLLECTION = "TrackingEvents";
const API_BASE = "https://api.17track.net/track/v2.4";

// Dropship-anonymisering — provider[address.country] mot dessa = filtrera bort
const ORIGIN_COUNTRIES = ["CN", "HK", "TW", "SG", "JP", "KR", "VN", "TH", "MY", "ID"];
const DESTINATION_COUNTRY = "SE";
const PUBLIC_CARRIER_NAME = "Fyndplats Frakt";

// Backup-regex för rader som råkar slinka igenom country-filtret
const LEAKY_PATTERN = /\b(china|chinese|hong\s?kong|cainiao|shenzhen|guangzhou|shanghai|beijing|shantou|shatian|yiwu|aliexpress)\b/i;

// ---------------------------------------------------------------------------
// API-anrop
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Registrering — med svenska översättningar
// ---------------------------------------------------------------------------

export async function registerTracking(trackingNumber, orderId) {
  if (!trackingNumber) return;

  // 1. Placeholder i Wix Data så /sparning visar något direkt.
  const existing = await wixData.query(COLLECTION)
    .eq("trackingNumber", trackingNumber)
    .find({ suppressAuth: true });

  if (existing.items.length === 0) {
    await wixData.insert(COLLECTION, {
      trackingNumber,
      orderId,
      carrier: PUBLIC_CARRIER_NAME,
      status: "InfoReceived",
      subStatus: "InfoReceived",
      events: [],
      milestone: [],
      lastFetchedAt: new Date(),
    }, { suppressAuth: true });
  } else if (!existing.items[0].orderId && orderId) {
    await wixData.update(COLLECTION, { ...existing.items[0], orderId }, { suppressAuth: true });
  }

  // 2. Registrera hos 17TRACK med svenska översättningar + Sverige som dest.
  try {
    const result = await callApi("/register", [{
      number: trackingNumber,
      lang: "sv",
      translation_mode: "UseThirdPartyServices",
      destination_country: DESTINATION_COUNTRY,
      order_no: orderId || undefined,
    }]);
    // -18019901 = redan registrerat — det är ok, vi gör inget av det.
    const rejected = result?.data?.rejected || [];
    for (const r of rejected) {
      if (r?.error?.code !== -18019901) {
        console.warn(`[17track] rejected ${trackingNumber}:`, r.error);
      }
    }
  } catch (err) {
    console.warn(`[17track] register ${trackingNumber}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Sanitering — filtrera bort ursprungsland & känsligt språk
// ---------------------------------------------------------------------------

/**
 * Plockar ut destination-providern (providers[0] enligt 17TRACK-doc) eller
 * filtrerar bort kända ursprungsländer. Om destinationen inte finns ännu
 * returneras tom array → sidan visar "Spårningen aktiveras inom kort".
 */
function sanitizeProviders(providers) {
  if (!Array.isArray(providers) || providers.length === 0) return [];
  // 17TRACK v2.4: providers[0] = destinationsbolaget för postförsändelser.
  const first = providers[0];
  if (first?.provider?.country?.toUpperCase() === DESTINATION_COUNTRY) return [first];
  // Annars: explicit sök efter Sverige.
  const dest = providers.find((p) => p?.provider?.country?.toUpperCase() === DESTINATION_COUNTRY);
  if (dest) return [dest];
  // Sista utvägen: filtrera bort kända ursprungsländer.
  return providers.filter(
    (p) => !ORIGIN_COUNTRIES.includes(String(p?.provider?.country || "").toUpperCase()),
  );
}

function isLeakyEvent(e) {
  const country = String(e?.address?.country || "").toUpperCase();
  if (ORIGIN_COUNTRIES.includes(country)) return true;
  const text = `${e?.description || ""} ${e?.location || ""}`;
  return LEAKY_PATTERN.test(text);
}

function sanitizeEvents(rawEvents) {
  return (rawEvents || [])
    .filter((e) => !isLeakyEvent(e))
    .map((e) => {
      // Använd svensk översättning om 17TRACK lyckades översätta.
      const translated = e.description_translation?.lang === "sv"
        ? e.description_translation.description
        : null;
      return {
        time: e.time_iso || e.time_utc || "",
        // status = 17TRACK stage enum (page använder via translateStatus).
        status: e.stage || e.sub_status || "",
        description: (translated || e.description || e.stage || "Uppdatering")
          .replace(LEAKY_PATTERN, "").trim() || "Uppdatering",
        location: LEAKY_PATTERN.test(e.location || "") ? "" : (e.location || ""),
        subStatus: e.sub_status || "",
      };
    })
    // Kronologisk ordning (äldst först) — sidan reverserar själv för att visa
    // senaste överst.
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}

/**
 * Tar emot 17TRACK v2.4 webhook-payload (TRACKING_UPDATED) eller svar från
 * /gettrackinfo och uppdaterar TrackingEvents-collectionen.
 */
export async function applyWebhookPayload(payload) {
  // Payloaden är {event, data} för webhook eller {data:{accepted:[...]}} från API.
  const root = payload?.data?.accepted?.[0] || payload?.data || payload;
  const trackingNumber = root?.number;
  if (!trackingNumber) throw new Error("number saknas i payloaden");

  const info = root.track_info || {};
  const latest = info.latest_status || {};
  const safeProviders = sanitizeProviders(info.tracking?.providers);
  const rawEvents = safeProviders.flatMap((p) => p.events || []);
  const events = sanitizeEvents(rawEvents);

  // Milestones — filtrera ut ursprungs-events och konvertera till enklare form.
  const milestone = (info.milestone || [])
    .filter((m) => m.time_iso || m.time_utc)
    .map((m) => ({ key_stage: m.key_stage, time: m.time_iso || m.time_utc }));

  const status = latest.status || "InfoReceived";
  const subStatus = latest.sub_status || "";

  const existing = await wixData.query(COLLECTION)
    .eq("trackingNumber", trackingNumber)
    .find({ suppressAuth: true });

  const record = {
    trackingNumber,
    orderId: existing.items[0]?.orderId || "",
    carrier: PUBLIC_CARRIER_NAME,
    status,
    subStatus,
    events,
    milestone,
    lastFetchedAt: new Date(),
    deliveredAt: status === "Delivered" ? new Date() : (existing.items[0]?.deliveredAt || null),
  };

  if (existing.items.length === 0) {
    await wixData.insert(COLLECTION, record, { suppressAuth: true });
  } else {
    await wixData.update(COLLECTION, { ...existing.items[0], ...record }, { suppressAuth: true });
  }

  return { trackingNumber, status, subStatus, eventCount: events.length };
}

// ---------------------------------------------------------------------------
// Läs- och refresh-helpers
// ---------------------------------------------------------------------------

export async function getTrackingData(trackingNumber) {
  const result = await wixData.query(COLLECTION)
    .eq("trackingNumber", trackingNumber)
    .find({ suppressAuth: true });
  return result.items[0] || null;
}

export async function forceRefresh(trackingNumber) {
  const data = await callApi("/gettrackinfo", [{ number: trackingNumber }]);
  return applyWebhookPayload(data);
}
