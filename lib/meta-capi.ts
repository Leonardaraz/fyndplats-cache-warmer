// Server-side Meta Conversions API (CAPI) sändare. Delas av:
//   • /api/meta/capi/route.ts  — klient-eventen (ViewContent, AddToCart …)
//   • /api/wix-webhook         — server-autoritativt Purchase vid order_created
//
// Hashar PII (e-post/telefon) med SHA-256 enligt Metas krav, bygger Graph
// API-payloaden och POSTar till https://graph.facebook.com/<v>/<pixelId>/events.
//
// Env (Vercel project settings → Environment Variables):
//   META_PIXEL_ID            — Pixel/Dataset-ID från Events Manager
//   META_CAPI_ACCESS_TOKEN   — Conversions API-token (Events Manager → Inställningar)
//   META_TEST_EVENT_CODE     — (valfritt) Test Events-kod; används BARA utanför
//                              produktion så skarpa konverteringar aldrig
//                              hamnar som test.

import crypto from "node:crypto";
import { normalisePhone } from "./address-hash";

const GRAPH_VERSION = "v18.0";

export type CapiUserData = {
  email?: string; // rå — hashas här
  phone?: string; // rå — hashas här
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  // Tillåt redan-hashade värden (om en uppströms-handler hashat själv).
  emailHashed?: string;
  phoneHashed?: string;
};

export type CapiEventInput = {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: string; // default "website"
  eventTime?: number; // unix-sekunder; default nu
  customData?: Record<string, unknown>;
  userData?: CapiUserData;
};

export type CapiResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string; status?: number; details?: unknown };

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Meta kräver normalisering INNAN hashning: trim + lowercase för e-post,
// endast siffror (med landskod) för telefon. Tomt → utelämna helt (skicka
// aldrig hash av tom sträng).
function hashEmail(raw?: string): string | undefined {
  if (!raw) return undefined;
  const norm = raw.trim().toLowerCase();
  return norm ? sha256(norm) : undefined;
}
function hashPhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  // Meta vill ha siffror MED landskod (E.164 utan "+"). En svensk order lagrar
  // ofta nationell form "0736…", som hashad rakt av aldrig matchar Metas
  // "46736…" → telefon-signalen blev värdelös. normalisePhone gör "0…" → "+46…";
  // strippa sedan icke-siffror så hashen blir av landskods-formen.
  const digits = (normalisePhone(raw) ?? raw).replace(/[^0-9]/g, "");
  return digits ? sha256(digits) : undefined;
}

// En env-var räknas som "satt" bara om den har meningsfullt innehåll efter
// trim. Skyddar mot tomma/whitespace-placeholders (t.ex. tomma slots i Vercel
// som väntar på riktiga värden) — de ska behandlas som ej-konfigurerade så
// Pixel/CAPI förblir en säker no-op tills riktiga värden fylls i.
export function metaEnv(name: "META_PIXEL_ID" | "META_CAPI_ACCESS_TOKEN" | "META_TEST_EVENT_CODE"): string {
  return (process.env[name] || "").trim();
}

export function metaCapiConfigured(): boolean {
  return Boolean(metaEnv("META_PIXEL_ID") && metaEnv("META_CAPI_ACCESS_TOKEN"));
}

export async function sendMetaCapiEvent(input: CapiEventInput): Promise<CapiResult> {
  const pixelId = metaEnv("META_PIXEL_ID");
  const token = metaEnv("META_CAPI_ACCESS_TOKEN");
  if (!pixelId || !token) {
    // Inte konfigurerat ännu (placeholder-läge). Inte ett fel — Pixel/CAPI är
    // helt enkelt inaktiv tills Leonard fyllt i env-variablerna.
    return { ok: false, error: "not_configured" };
  }

  const ud = input.userData || {};
  const user_data: Record<string, unknown> = {};
  // Meta vill ha hashade fält som arrayer (em/ph kan ha flera värden).
  const em = ud.emailHashed || hashEmail(ud.email);
  const ph = ud.phoneHashed || hashPhone(ud.phone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (ud.fbp) user_data.fbp = ud.fbp;
  if (ud.fbc) user_data.fbc = ud.fbc;
  if (ud.clientIpAddress) user_data.client_ip_address = ud.clientIpAddress;
  if (ud.clientUserAgent) user_data.client_user_agent = ud.clientUserAgent;

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    action_source: input.actionSource || "website",
    user_data,
  };
  if (input.eventId) event.event_id = input.eventId;
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl;
  if (input.customData) event.custom_data = input.customData;

  const payload: Record<string, unknown> = { data: [event] };
  // Test Events-läge bara utanför produktion → skarp data smutsas aldrig ner.
  // OBS: VERCEL_ENV, INTE NODE_ENV. Vercel bygger BÅDE preview och production med
  // NODE_ENV=production, så NODE_ENV kan inte skilja dem åt — bara lokal `next dev`
  // får NODE_ENV=development. VERCEL_ENV är "production" | "preview" | (saknas
  // lokalt). Så test_event_code attacheras på preview-deploys och lokalt, men
  // ALDRIG i produktion. Faller tillbaka på NODE_ENV om VERCEL_ENV saknas.
  const deployEnv = (process.env.VERCEL_ENV || process.env.NODE_ENV || "").trim();
  const testCode = metaEnv("META_TEST_EVENT_CODE");
  if (deployEnv !== "production" && testCode) {
    payload.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  try {
    // 3s timeout: Graph API får ALDRIG hänga och blockera anroparen (t.ex.
    // wix-webhooken som väntar med att svara 200 → Wix retry → dubbla mejl).
    // AbortSignal.timeout kastar TimeoutError som fångas nedan → fetch_failed.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[meta-capi] Graph API-fel", res.status, JSON.stringify(json));
      return { ok: false, error: "graph_error", status: res.status, details: json };
    }
    return { ok: true, result: json };
  } catch (e) {
    console.error("[meta-capi] fetch misslyckades:", (e as Error).message);
    return { ok: false, error: "fetch_failed" };
  }
}
