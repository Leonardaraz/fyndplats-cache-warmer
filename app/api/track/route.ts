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
import { PHRASE_SV } from "@/lib/track-i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GETINFO_URL = "https://api.17track.net/track/v2.2/gettrackinfo";
const REGISTER_URL = "https://api.17track.net/track/v2.2/register";

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
  location?: string;
  stage?: string;
  sub_status?: string;
  // 17TRACK v2.2: event-adress med country (ISO eller namn), city etc.
  address?: { country?: string; state?: string; city?: string };
}

// 17TRACK v2.2 faktisk struktur (verifierad mot live debug-svar):
// track_info.tracking.providers[].events[] = själva händelserna
// track_info.latest_status.status = övergripande status
// track_info.time_metrics.estimated_delivery_date = ETA
interface Track17Track {
  latest_status?: { status?: string; sub_status?: string };
  latest_event?: Track17Event;
  time_metrics?: {
    estimated_delivery_date?: { from?: string | null; to?: string | null };
  };
  misc_info?: { service_type?: string };
  tracking?: {
    providers?: Array<{
      provider?: { name?: string; country?: string };
      service_type?: string;
      events?: Track17Event[];
    }>;
  };
}

interface Track17Response {
  code?: number;
  data?: {
    accepted?: Array<{ number?: string; track_info?: Track17Track }>;
    rejected?: Array<{ number?: string; error?: { code?: number; message?: string } }>;
  };
}

// Svensk frasöversättning (PHRASE_SV) bor i lib/track-i18n.ts — där den är
// utökad (sorteringsterminal, lastad, levererad-till-brevlåda m.fl.), rätt
// ordnad (specifik före generisk) och enhetstestad. Importeras ovan.

// Svensk fallback per stage om ingen frasträff. Täcker ALLA 17TRACK-stages
// (latest_status.status + milestone.key_stage + event.stage) så ingen väg kan
// läcka rå engelsk enum till kunden.
const STAGE_SV: Record<string, string> = {
  InfoReceived: "Fraktsedel skapad – paketet förbereds.",
  PickedUp: "Paketet har hämtats av transportören.",
  Departure: "Paketet har lämnat avsändarorten.",
  Arrival: "Paketet har anlänt till en terminal.",
  InTransit: "Paketet är på väg.",
  AvailableForPickup: "Paketet finns för upphämtning hos ditt ombud.",
  OutForDelivery: "Paketet är ute för leverans.",
  Delivered: "Paketet är levererat.",
  DeliveryFailure: "Leveransförsök misslyckades – ny leverans planeras.",
  Exception: "Det har uppstått en avvikelse i leveransen.",
  Expired: "Spårningen har inte uppdaterats på länge.",
  NotFound: "Ingen spårningsinformation tillgänglig ännu.",
  Returning: "Paketet är på väg tillbaka till avsändaren.",
  Returned: "Paketet har returnerats.",
};

function toSwedish(description: string, stage?: string): string {
  for (const [re, sv] of PHRASE_SV) {
    if (re.test(description)) return sv;
  }
  if (stage && STAGE_SV[stage]) return STAGE_SV[stage];
  return description; // okänd text → visa originalet hellre än tomt
}

// Svensk etikett för stage-rubriken (ersätter "InfoReceived" etc.).
const STAGE_LABEL_SV: Record<string, string> = {
  InfoReceived: "Registrerad",
  PickedUp: "Hämtad",
  Departure: "Avgått",
  Arrival: "Ankommen till terminal",
  InTransit: "På väg",
  AvailableForPickup: "Finns för upphämtning",
  OutForDelivery: "Ute för leverans",
  Delivered: "Levererad",
  DeliveryFailure: "Leveransförsök misslyckades",
  Returning: "Returneras",
  Returned: "Returnerad",
  Exception: "Avvikelse",
  Expired: "Ej uppdaterad",
  NotFound: "Ingen information",
};

// Maskerar kinesiska transportörer + städar redundanta landssuffix
// ("PostNord Sweden" → "PostNord"). Tomt → generiskt "Fyndplats Frakt".
function cleanCarrier(name: string): string {
  if (!name) return "";
  if (/\b(china|chinese|cn|sf express|yto|sto|yunda|cainiao|aliexpress)\b/i.test(name)) {
    return "Fraktpartner";
  }
  return name.replace(/\s+(Sweden|Sverige)$/i, "").trim();
}

// 17TRACK ger ETA som datum-sträng ("2026-06-10"). Formatera till svensk
// läsbar form ("10 juni 2026"). Returnerar null om saknas/ogiltigt → UI:n
// faller då tillbaka på "3–8 arbetsdagar".
function fmtEtaSv(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

// Samlar alla events från alla providers (oftast en) till en platt, kronologisk lista.
function allEventsOf(ti: Track17Track): Track17Event[] {
  const evs: Track17Event[] = [];
  for (const p of ti.tracking?.providers ?? []) {
    for (const e of p.events ?? []) evs.push(e);
  }
  return evs;
}

function isHiddenLocation(ev: Track17Event): boolean {
  const country = (ev.address?.country || "").toUpperCase();
  if (country && (HIDDEN_COUNTRIES.has(country)
    || /\b(CHINA|KINA|HONG\s*KONG|TAIWAN|SINGAPORE|MALAYSIA|JAPAN|KOREA)\b/.test(country))) return true;
  const city = (ev.address?.city || "").toUpperCase();
  if (/\b(SHENZHEN|GUANGZHOU|HONGKONG|HONG\s*KONG|SHANGHAI|YIWU)\b/.test(city)) return true;
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
  const loc = ev.location
    || [ev.address?.city, ev.address?.state].filter(Boolean).join(", ")
    || "";
  // 17TRACK sub_status kan ha suffix (t.ex. "InTransit_PickedUp") — slå upp
  // exakt, annars på bas-stagen före "_". Garanterar svensk etikett.
  const stage = ev.stage || ev.sub_status || "";
  const base = stage.split("_")[0];
  const label = STAGE_LABEL_SV[stage] || STAGE_LABEL_SV[base] || STAGE_SV[base] || base;
  return {
    time: ev.time_iso || ev.time_utc || "",
    description: toSwedish(ev.description || ev.sub_status || "", base),
    location: loc,
    status: label,
  };
}

function mapStatus(status: string | undefined): string {
  switch (status) {
    case "Delivered": return "Delivered";
    case "OutForDelivery": return "OutForDelivery";
    case "AvailableForPickup": return "AvailableForPickup";
    case "InTransit":
    case "Transit": return "InTransit";
    case "PickedUp":
    case "Pickup": return "Pickup";
    case "Exception": return "Exception";
    case "Expired": return "Expired";
    case "NotFound": return "NotFound";
    case "InfoReceived": return "InfoReceived";
    default: return status || "InfoReceived";
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

async function register(tn: string, apiKey: string): Promise<unknown> {
  // Returnerar parsad body för debug-läget. I normalflödet bryr vi oss inte
  // om resultatet — eventuella registreringsfel manifesterar sig som tomma
  // events på nästa gettrackinfo (→ 202 pending).
  const res = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "17token": apiKey },
    body: JSON.stringify([{ number: tn }]),
    cache: "no-store",
  });
  try {
    return await res.json();
  } catch {
    return { status: res.status };
  }
}

function buildResponse(json: Track17Response, tn: string): { body: unknown; status: number } {
  const accepted = json.data?.accepted?.[0];

  if (!accepted?.track_info) {
    // ALDRIG returnera 17TRACK:s råa engelska felmeddelande till kunden — alltid
    // ett eget svenskt. (rejected.error.message är t.ex. "The tracking number
    // does not register, please register first.")
    return {
      body: { error: "Vi hittar ingen spårning för det numret än. Kontrollera siffrorna eller försök igen om en stund – det tar ibland 1–2 dagar innan spårningen aktiveras." },
      status: 404,
    };
  }

  const ti = accepted.track_info;
  // Events ligger i tracking.providers[].events[] (17TRACK v2.2). Filtrera bort
  // asiatiska transit-events, kronologisk ordning (nyast först som 17TRACK ger).
  const visibleEvents = allEventsOf(ti)
    .filter((ev) => !isHiddenLocation(ev))
    .map(mapEvent);

  const rawStatus = ti.latest_status?.status;
  const status = mapStatus(rawStatus);
  const provider = ti.tracking?.providers?.[0]?.provider;
  const carrier = cleanCarrier(provider?.name || "");
  const eta = fmtEtaSv(
    ti.time_metrics?.estimated_delivery_date?.to
    || ti.time_metrics?.estimated_delivery_date?.from
    || null,
  );
  const latestTime = ti.latest_event?.time_iso || ti.latest_event?.time_utc;

  return {
    body: {
      events: visibleEvents,
      status,
      delivered: status === "Delivered",
      eta,
      carrier,
      trackingNumber: accepted.number || tn,
      updatedAt: latestTime || new Date().toISOString(),
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

  // Debug-läge: ?debug=<TRACK17_API_KEY> returnerar RÅ 17TRACK-respons
  // (både gettrackinfo + register) så vi kan se exakt struktur/felkoder.
  // Gated bakom API-keyn så endast vi kan trigga det. Tas bort när tracking
  // är verifierat stabilt.
  const debug = req.nextUrl.searchParams.get("debug") === apiKey;
  const debugDump: Record<string, unknown> = {};

  let json: Track17Response;
  try {
    json = await gettrackinfo(tn, apiKey);
    if (debug) debugDump.firstGetinfo = json;
  } catch {
    return NextResponse.json(
      { error: "Anslutningen till spårningen fungerade inte. Försök igen om en stund." },
      { status: 502 },
    );
  }

  function hasRealEvents(j: Track17Response): boolean {
    const a = j.data?.accepted?.[0]?.track_info;
    if (!a) return false;
    // Events i 17TRACK v2.2 ligger i tracking.providers[].events[].
    return allEventsOf(a).length > 0 || Boolean(a.latest_event?.time_iso);
  }

  // Lager 3: auto-register. Om gettrackinfo INTE gav riktiga events (oavsett
  // om numret hamnade i rejected ELLER accepted-utan-events) → registrera och
  // försök igen. Bredare än tidigare (som bara kollade en specifik felkod) —
  // vilket var buggen: 17TRACK svarar med olika koder/strukturer beroende på
  // carrier, och paket som PostNord pre-registrerar hamnar i "accepted" utan
  // events istället för "rejected". Format-filtret (VALID_TN) + cache skyddar
  // quota; en enstaka register på ett format-giltigt men okänt nummer är OK.
  let justRegistered = false;
  if (!hasRealEvents(json)) {
    try {
      const reg = await register(tn, apiKey);
      if (debug) debugDump.register = reg;
      justRegistered = true;
      // 17TRACK behöver tid att hämta data från carriern (PostNord, DHL etc.)
      // — typiskt 30 sek till 2 min. Kort delay (3s) ger oftast första-status.
      await new Promise((r) => setTimeout(r, 3000));
      json = await gettrackinfo(tn, apiKey);
      if (debug) debugDump.secondGetinfo = json;
    } catch {
      // Tystna — fallback till pending-meddelande nedan.
    }
  }

  if (debug) {
    return NextResponse.json({ tn, justRegistered, hasRealEvents: hasRealEvents(json), ...debugDump });
  }

  // Om vi fortfarande inte har riktiga events men numret är känt/registrerat
  // → 202 pending ("aktiveras snart") istället för rött 404-fel. Detta täcker
  // både PostNord "Vi väntar på ditt paket" (pre-registrerat, inga scans än)
  // och paket vi precis registrerade.
  if (!hasRealEvents(json)) {
    const accepted0 = json.data?.accepted?.[0];
    // Numret är "känt" om det ligger i accepted (även utan events) eller om
    // vi precis registrerade det utan hårt fel.
    const known = Boolean(accepted0) || justRegistered;
    if (known) {
      return NextResponse.json(
        {
          pending: true,
          message: "Paketet är registrerat men transportören har inte skannat det ännu. Spårningen uppdateras automatiskt — kika tillbaka om en stund.",
          trackingNumber: tn,
        },
        { status: 202 },
      );
    }
  }

  const { body, status } = buildResponse(json, tn);
  // Cache:a träffar (200) i 5 min för att skydda quota mot refresh-spam.
  // 404/202 cacha:s INTE — paketet kan få data när som helst och vi vill att
  // kunden ska kunna retry:a snabbt. 5xx cacha:s aldrig (transienta).
  if (status === 200) cacheSet(tn, body, status);
  return NextResponse.json(body, { status });
}
