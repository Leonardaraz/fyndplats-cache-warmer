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
// GLS-paket hämtas från GLS egen spårning med postnumret ur ordern
// (lib/gls-source, sedan 2026-10-12): utan postnummer får 17TRACK bara statusen.
//
// Anonymisering bevarad från Velo: events i CN/HK/TW/SG/MY-transit skippas
// så kunden inte ser ursprungslandet. Carrier-namn maskas mot generiskt
// "Transportör" på origin-events.
//
// Env-krav (i Vercel project settings → Environment Variables):
//   TRACK17_API_KEY  — API-key från https://api.17track.net/

import { NextResponse, type NextRequest } from "next/server";
import {
  matchPhrase, matchPhraseForStage, svLocation, svCountry, svenskVaggklocka, dedupeEvents, tidForHandelse,
  rimligTid, rattaPlatser, orderEventsNewestFirst,
} from "@/lib/track-i18n";
import { maskCarrier, transportorAvNummer, transportorForNummer } from "@/lib/carrier-mask";
import { LEAKY_PATTERN } from "@/lib/ae-track";
import { fetchAliExpressEvents, fmtEtaSv } from "@/lib/ae-source";
import { fetchGlsSparning } from "@/lib/gls-source";
import { liknarGlsNummer, type GlsSparning } from "@/lib/gls-track";
import { dsvLed, sistaLedInfoFor, transportorLankar } from "@/lib/sista-led";
import { registerWith17Track } from "@/lib/track17";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GETINFO_URL = "https://api.17track.net/track/v2.2/gettrackinfo";

// Asiatiska transitländer som ska döljas för kunden — paketet "syns inte"
// förrän det landar i Sverige eller annat destinationsland. I paritet med
// Velo:s ORIGIN_COUNTRIES (canonical) inkl. VN/TH/ID.
const HIDDEN_COUNTRIES = new Set(["CN", "HK", "TW", "SG", "JP", "KR", "VN", "TH", "MY", "ID"]);

// LEAKY_PATTERN (ursprungs-skrubben) importeras från lib/track-i18n — delad
// med AliExpress-källans översättning så kanalerna aldrig divergerar.

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
  const fras = matchPhraseForStage(description, stage);
  if (fras !== matchPhrase(description)) {
    // En leveransfras på en händelse som 17TRACK inte kallar levererad
    // (matchPhraseForStage). Originaltexten loggas, så att den kan få en egen
    // svensk fras om den varken är en avi eller täcks av stagens text.
    console.info(`[track] leveransfras mot stage ${stage}: "${description.slice(0, 200)}" → ${fras ?? "stagens text"}`);
  }
  if (fras) return fras;
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

// Carrier-maskering delas med 17TRACK-push-webhooken via lib/carrier-mask
// (allowlist, fail-safe) så de två kanalerna aldrig divergerar i vad de visar.
const cleanCarrier = maskCarrier;

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
  // Sista utväg: ursprungs-ord i fri text (beskrivning/plats) → dölj eventet.
  if (LEAKY_PATTERN.test(`${ev.description || ""} ${ev.location || ""}`)) return true;
  return false;
}

function mapEvent(ev: Track17Event): {
  time: string;
  description: string;
  location: string;
  status: string;
} {
  // Plats på svenska: strukturerad stad + land när 17TRACK ger det (exakt vart
  // paketet är), annars fri-textens land översatt ("Germany" → "Tyskland").
  const loc = svLocation(ev.location, ev.address);
  // 17TRACK sub_status kan ha suffix (t.ex. "InTransit_PickedUp") — slå upp
  // exakt, annars på bas-stagen före "_". Garanterar svensk etikett.
  const stage = ev.stage || ev.sub_status || "";
  const base = stage.split("_")[0];
  const label = STAGE_LABEL_SV[stage] || STAGE_LABEL_SV[base] || STAGE_SV[base] || base;
  // Skrubba ev. ursprungs-ord ur beskrivning + blanka läckande plats (paritet
  // med Velo:s sanitizeEvents). Belt-and-suspenders: leaky events filtreras
  // redan bort av isHiddenLocation, men detta garanterar att inget slinker ut.
  const description = toSwedish(ev.description || ev.sub_status || "", base)
    .replace(LEAKY_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim() || label;
  return {
    time: tidForHandelse(ev),
    description,
    location: LEAKY_PATTERN.test(loc) ? "" : loc,
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

// Registrering delas med wix-webhookens proaktiva väg via lib/track17:s
// registerWith17Track — samma sv-översättning, SE-destination OCH
// carrier-hint-retry när auto-detekteringen går bet (PostNord parcel connect).

// AliExpress-källan (via cache-warmern) bor i lib/ae-source sedan 2026-09-01 —
// delad med /api/cron/ae-delivery-poll, som mejlar när AliExpress säger
// levererat för paket 17TRACK aldrig kände igen. Importeras ovan.

/**
 * Transportören och sista ledet, med var kunden följer sista biten när den
 * går att följa (lib/sista-led): PostNord med samma nummer efter DPD och
 * DHL. DSV efter GLS kommer från GLS egen spårning, i buildGlsBody.
 */
function medSistaLed(tn: string, t: { carrier: string; sistaLed?: string }) {
  const info = sistaLedInfoFor(t.sistaLed, tn);
  return info ? { ...t, sistaLedInfo: info } : t;
}

/** Bygger /api/track-svaret ur AliExpress-källan (samma JSON-format som
 *  17TRACK-vägen så TrackingWidget inte ser skillnad på källorna). */
function buildAeBody(tn: string, ae: NonNullable<Awaited<ReturnType<typeof fetchAliExpressEvents>>>) {
  return {
    events: ae.events,
    status: ae.status,
    delivered: ae.status === "Delivered",
    eta: ae.eta,
    ...medSistaLed(tn, transportorForNummer(tn, ae.carrier || "")),
    trackingNumber: tn,
    updatedAt: ae.events[0]?.time || new Date().toISOString(),
  };
}

/**
 * Bygger /api/track-svaret ur GLS egen spårning (lib/gls-source), i samma
 * JSON-format som 17TRACK-vägen.
 *
 * GLS tider är lokal tid utan offset, och läses som svensk väggklocka för
 * länder med svensk tid (svenskVaggklocka).
 *
 * ☠️ En text som GLS-tabellen inte känner står kvar som GLS skrev den. Den
 * gick först genom PHRASE_SV, vars allmänna regel läser varje "delivered" som
 * levererat: "stored in the parcel center to be delivered at a new delivery
 * date" blev "Paketet är levererat." om ett paket som låg kvar på terminalen
 * (order 10075, 2026-10-13). Hellre GLS engelska än ett påstående som inte är sant.
 */
function buildGlsBody(tn: string, gls: GlsSparning, eta: string | null) {
  const events = dedupeEvents(rattaPlatser(
    gls.handelser
      .map((h) => {
        const location = svLocation(undefined, { city: h.stad, country: h.land });
        const description = (h.beskrivning ?? h.original)
          .replace(LEAKY_PATTERN, "")
          .replace(/\s{2,}/g, " ")
          .trim();
        return {
          time: svenskVaggklocka(h.tid, svCountry(h.land), Boolean(h.stad)),
          description,
          location: LEAKY_PATTERN.test(location) ? "" : location,
          status: h.etikett ?? STAGE_LABEL_SV.InTransit,
        };
      })
      .filter((ev) => ev.description && rimligTid(ev.time)),
  ));
  return {
    events,
    status: gls.status,
    delivered: gls.status === "Delivered",
    eta,
    carrier: "GLS",
    ...(gls.sistaLed === "DSV"
      ? { sistaLed: gls.sistaLed, sistaLedInfo: dsvLed(gls.sistaLedNummer, gls.satt) }
      : {}),
    trackingNumber: tn,
    updatedAt: orderEventsNewestFirst(events).find((ev) => ev.time)?.time || new Date().toISOString(),
  };
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
  // Händelser med orimlig tid försvinner och land som inte kan stämma blankas
  // (lib/track-i18n), innan dubbletterna tas bort.
  const visibleEvents = dedupeEvents(rattaPlatser(
    allEventsOf(ti)
      .filter((ev) => !isHiddenLocation(ev))
      .map(mapEvent)
      .filter((ev) => rimligTid(ev.time)),
  ));

  const rawStatus = ti.latest_status?.status;
  const status = mapStatus(rawStatus);
  const provider = ti.tracking?.providers?.[0]?.provider;
  const carrier = cleanCarrier(provider?.name || "");
  const eta = fmtEtaSv(
    ti.time_metrics?.estimated_delivery_date?.to
    || ti.time_metrics?.estimated_delivery_date?.from
    || null,
  );
  const senaste = tidForHandelse(ti.latest_event);
  const latestTime = (rimligTid(senaste) && senaste)
    || orderEventsNewestFirst(visibleEvents).find((ev) => ev.time)?.time;

  return {
    body: {
      events: visibleEvents,
      status,
      delivered: status === "Delivered",
      eta,
      ...medSistaLed(accepted.number || tn, transportorForNummer(accepted.number || tn, carrier)),
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
    // Utan 17TRACK-nyckel (t.ex. preview-miljöer, eller om nyckeln roteras
    // fel) är AliExpress-källan fortfarande fullt kapabel — prova den innan
    // vi ger upp med 503.
    const ae = await fetchAliExpressEvents(tn);
    if (ae && ae.events.length > 0) {
      const body = buildAeBody(tn, ae);
      cacheSet(tn, body, 200);
      return NextResponse.json(body, { status: 200 });
    }
    // GLS egen spårning behöver ingen 17TRACK-nyckel heller.
    if (liknarGlsNummer(tn)) {
      const gls = await fetchGlsSparning(tn);
      const body = gls ? buildGlsBody(tn, gls, null) : null;
      if (body && body.events.length > 0) {
        cacheSet(tn, body, 200);
        return NextResponse.json(body, { status: 200 });
      }
    }
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
      await registerWith17Track(tn);
      justRegistered = true;
      // 17TRACK behöver tid att hämta data från carriern (PostNord, DHL etc.)
      // — typiskt 30 sek till 2 min. Kort delay (3s) ger oftast första-status.
      await new Promise((r) => setTimeout(r, 3000));
      json = await gettrackinfo(tn, apiKey);
    } catch {
      // Tystna — fallback till pending-meddelande nedan.
    }
  }

  // ☠️ GLS lämnar ut resan först med mottagarens postnummer, och det har
  // 17TRACK inte. För ett GLS-paket ger 17TRACK därför bara statusen: en rad,
  // "Paketet är på väg genom transportnätet", utan tid och plats, medan GLS
  // egen sida visar hela resan (Leonards rapport 2026-10-12, order 10075).
  // Är paketet GLS hämtas resan från GLS med postnumret ur ordern
  // (lib/gls-source). Den används när den har minst lika många händelser som
  // 17TRACK. Annars, och när GLS inte svarar, visas 17TRACK som förut.
  const ti17 = json.data?.accepted?.[0]?.track_info;
  const leverantor17 = ti17?.tracking?.providers?.[0]?.provider?.name;
  if (maskCarrier(leverantor17) === "GLS" || (!hasRealEvents(json) && liknarGlsNummer(tn))) {
    const gls = await fetchGlsSparning(tn);
    const eta = fmtEtaSv(
      ti17?.time_metrics?.estimated_delivery_date?.to
      || ti17?.time_metrics?.estimated_delivery_date?.from
      || null,
    );
    const body = gls ? buildGlsBody(tn, gls, eta) : null;
    if (body && body.events.length > 0 && body.events.length >= (ti17 ? allEventsOf(ti17).length : 0)) {
      cacheSet(tn, body, 200);
      return NextResponse.json(body, { status: 200 });
    }
  }

  // Om 17TRACK inte har riktiga events: fråga AliExpress-källan (cache-warmern
  // slår upp spårningsnumret → AliExpress-ordern → deras EGNA händelser + ETA).
  // 17TRACK klarar inte alla EU-fraktkedjor ("Carrier cannot be detected" för
  // t.ex. PostNord parcel connect) — AliExpress känner alltid sin egen order.
  if (!hasRealEvents(json)) {
    const ae = await fetchAliExpressEvents(tn);
    if (ae && ae.events.length > 0) {
      const body = buildAeBody(tn, ae);
      cacheSet(tn, body, 200);
      return NextResponse.json(body, { status: 200 });
    }
  }

  // Fortfarande inga events men numret är känt/registrerat → 202 pending med
  // direktlänkar till fraktbolagen (kunden är aldrig fast i en tom vy). Täcker
  // både PostNord "Vi väntar på ditt paket" (pre-registrerat, inga scans än)
  // och paket vi precis registrerade. Avgör numret ensamt fraktbolaget följer
  // det med som `transportor`, och då blir det bara det bolagets länk.
  // Texten skriver sidan själv (components/tracking.tsx).
  if (!hasRealEvents(json)) {
    const accepted0 = json.data?.accepted?.[0];
    // Numret är "känt" om det ligger i accepted (även utan events) eller om
    // vi precis registrerade det utan hårt fel.
    const known = Boolean(accepted0) || justRegistered;
    if (known) {
      const kand = transportorAvNummer(tn);
      return NextResponse.json(
        {
          pending: true,
          ...(kand ? { transportor: kand } : {}),
          fallbackLinks: transportorLankar(tn, kand),
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
