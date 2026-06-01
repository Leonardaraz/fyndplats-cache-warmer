// Meta Pixel + Conversions API (CAPI) — dubbel-fyrning.
//
// Varje konverteringsevent skickas BÅDE via webbläsarens fbq (Pixel) OCH
// server-side via /api/meta/capi, med SAMMA event_id. Meta deduplicerar på
// (event_name, event_id) så de två signalerna räknas som ETT event. Vinsten är
// täckning: CAPI når fram även när iOS/Safari/adblock blockerar Pixeln (~30–40%
// av trafiken idag).
//
// Allt gated på marknadssamtycke (lib/consent). Utan "Godkänn alla" fyrar
// varken Pixel eller CAPI.

import Cookies from "js-cookie";
import { hasMarketingConsent } from "./consent";

// Rå PII som hashas server-side (SHA-256) i /api/meta/capi. Skickas aldrig från
// klienten i normalflödet (vi har ingen e-post där) men strukturen tillåter det
// för t.ex. inloggat/order-flöde.
export type MetaUserData = {
  em?: string; // rå e-post
  ph?: string; // rått telefonnummer
};

export type MetaContent = { id: string; quantity: number; item_price?: number };

export type MetaCustomData = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  content_type?: string;
  contents?: MetaContent[];
  num_items?: number;
};

type Fbq = (
  method: string,
  eventName: string,
  customData?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === "function" ? f : null;
}

// Dedup-nyckel. crypto.randomUUID där det finns; annars tid+slump (kvaliteten
// behöver inte vara kryptografisk, bara unik nog för dedup).
export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* faller igenom till fallbacken */
  }
  return `e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// _fbp/_fbc sätts av Pixeln. _fbc härleds från fbclid i URL:en om cookien
// saknas (Metas rekommendation) → bättre attribution av annonsklick även när
// Pixeln inte hunnit skriva cookien.
function fbCookies(): { fbp?: string; fbc?: string } {
  const fbp = Cookies.get("_fbp");
  let fbc = Cookies.get("_fbc");
  if (!fbc && typeof window !== "undefined") {
    try {
      const fbclid = new URLSearchParams(window.location.search).get("fbclid");
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {
      /* ogiltig URL — strunta i fbc */
    }
  }
  return { fbp: fbp || undefined, fbc: fbc || undefined };
}

// Fyrar ett event via Pixel + CAPI med delad event_id. Får ALDRIG kasta eller
// blockera UI — all spårning är best-effort.
export function metaTrack(
  eventName: string,
  customData: MetaCustomData = {},
  opts: { eventId?: string; userData?: MetaUserData } = {},
): void {
  if (typeof window === "undefined") return;
  if (!hasMarketingConsent()) return;

  const eventId = opts.eventId || newEventId();

  // 1) Pixel (browser). event_id MÅSTE ligga i options-argumentet som `eventID`
  //    — det är den nyckel Meta deduplicerar Pixel mot CAPI på.
  const fbq = getFbq();
  if (fbq) {
    try {
      fbq("track", eventName, customData as Record<string, unknown>, { eventID: eventId });
    } catch {
      /* Pixel får aldrig krascha sidan */
    }
  }

  // 2) CAPI (server). Fire-and-forget. keepalive:true gör att anropet levereras
  //    även om sidan navigerar bort direkt efteråt (t.ex. InitiateCheckout som
  //    följs av redirect till Wix-kassan).
  try {
    const { fbp, fbc } = fbCookies();
    const body = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      action_source: "website",
      custom_data: customData,
      user_data: { ...opts.userData, fbp, fbc },
    };
    void fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      /* nätfel — svälj, CAPI är best-effort */
    });
  } catch {
    /* JSON/serialiseringsfel — svälj */
  }
}
