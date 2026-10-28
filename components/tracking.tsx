"use client";
import { useCallback, useEffect, useState } from "react";
import { orderEventsNewestFirst } from "@/lib/track-i18n";
import { DELIVERY_TIME } from "@/lib/shipping";
import { harKommitTillSverige, sistaLedRuta, type SistaLedInfo } from "@/lib/sista-led";
import { transportorRad } from "@/lib/carrier-mask";

// Anropar /api/track i headless (Next.js API-route) som proxar till 17TRACK
// API och bevarar anonymisering (CN/HK/TW/SG/MY-events strippade, kinesiska
// transportörer maskeras till "Transportör"). Tidigare gick anropet mot
// Wix Velo `_functions/track` på V1-sajten, men efter DNS-cutover ärver
// headless fyndplats.se och Velo är inte längre nåbar.
//
// API:t förväntar query-param `?tn=<trackingNumber>` och returnerar samma
// JSON-format som Velo-funktionen så UI-logiken nedan inte behöver ändras.
const TRACK_API = "/api/track";

const STAGES = ["Beställd", "Skickad", "På väg", "Nära dig", "Levererad"];

// Stage-logik baseras på antalet SYNLIGA events från backend (filtrerade på
// Velo så bara destinations-events syns), inte 17TRACK:s raw status enum.
// Anledningen: raw status (t.ex. InTransit) kan vara aktiv medan inga synliga
// events ännu finns — då skulle UI hoppa till "Skickad/På väg" innan kunden
// ser någon faktisk skanning, vilket är förvirrande.
//
// Mappning:
//   0 events                              → Beställd (registrerad, väntar)
//   1–2 events                            → Skickad (första destinationsscan)
//   3+ events                             → På väg (rör sig i nätverket)
//   OutForDelivery / AvailableForPickup   → Nära dig
//   Delivered                             → Levererad
function computeStage(status: string, evCount: number, delivered: boolean): number {
  if (delivered || status === "Delivered") return 4;
  if (status === "OutForDelivery" || status === "AvailableForPickup") return 3;
  if (status === "InTransit") return 2;
  // InfoReceived = avsändaren har skapat fraktsedel men paketet är inte
  // inlämnat hos transportören ännu → "Beställd", inte "Skickad" (även om det
  // finns 1 InfoReceived-event).
  if (status === "InfoReceived") return 0;
  if (evCount >= 3) return 2;
  if (evCount >= 1) return 1;
  return 0;
}

type RawEvent = {
  // Olika namn beroende på 17TRACK-version / Velo-mapping. Vi probar alla.
  time?: string;
  time_iso?: string;
  time_raw?: string;
  date?: string;
  description?: string;
  desc?: string;
  status?: string;
  location?: string;
  place?: string;
  address?: string;
  stage?: string;
  sub_status?: string;
};

type TrackResp = {
  events?: RawEvent[];
  status?: string;
  statusCode?: number | string;
  delivered?: boolean;
  eta?: string | null;
  carrier?: string;
  /** Vem som delar ut i Sverige, när det inte är samma som `carrier`. */
  sistaLed?: string;
  /** Var kunden följer sista ledet, och med vilket nummer (lib/sista-led). */
  sistaLedInfo?: SistaLedInfo;
  trackingNumber?: string;
  orderId?: string;
  updatedAt?: string;
  error?: string;
  message?: string;
  /** 202: numret är registrerat men ingen källa har händelser än. */
  pending?: boolean;
  /** Fraktbolaget när numret ensamt avgör det (lib/carrier-mask). */
  transportor?: string;
  fallbackLinks?: Lank[];
};

type Lank = { name: string; url: string };

/** Ett registrerat paket utan händelser än. */
type Vantar = { nummer: string; transportor?: string; lankar: Lank[] };

/** Stegen överst i kortet. Samma rad när paketet väntar och när det rör sig. */
function Steg({ stage, delivered }: { stage: number; delivered: boolean }) {
  return (
    <div className="steps">
      {STAGES.map((label, i) => {
        const on = i <= stage;
        const current = i === stage && !delivered;
        return (
          <div className={`step ${on ? "on" : ""} ${current ? "current" : ""} ${delivered ? "done-all" : ""}`} key={label}>
            <div className="dot">{i < stage || delivered ? "✓" : ""}</div>
            <div className="slbl">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function fmtTime(s?: string): string {
  if (!s) return "";
  // Om det redan är formaterad svenska ("12 maj, 14:22") — använd som-är
  if (/[a-zåäö]/i.test(s) && !/T\d/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  // Svensk tid oavsett var kunden befinner sig, som transportörernas egna sidor.
  return d.toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
}

function pick<T = string>(o: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) if (o[k] != null && o[k] !== "") return o[k] as T;
  return undefined;
}

export function TrackingWidget() {
  const [tn, setTn] = useState("");
  const [data, setData] = useState<TrackResp | null>(null);
  const [err, setErr] = useState("");
  const [vantar, setVantar] = useState<Vantar | null>(null);
  const [loading, setLoading] = useState(false);

  const track = useCallback(async (id: string) => {
    const clean = id.replace(/\s+/g, "").replace(/^#/, "").toUpperCase();
    if (clean.length < 5) { setErr("Skriv in ditt spårningsnummer."); setData(null); return; }
    setErr(""); setVantar(null); setLoading(true); setData(null);
    try {
      const res = await fetch(`${TRACK_API}?tn=${encodeURIComponent(clean)}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 404) setErr("Vi hittar ingen spårning för det numret än. Kolla din leveransbekräftelse – ibland tar det 1–2 dagar innan spårningen aktiveras.");
        else if (res.status >= 500) setErr("Spårningen är tillfälligt otillgänglig. Försök igen om en stund.");
        else setErr("Kunde inte hämta spårningen just nu.");
        setLoading(false); return;
      }
      const json: TrackResp = await res.json();
      // 202 Accepted = paketet är registrerat men ingen källa har händelser
      // ännu. Visa samma kort som när paketet rör sig, med direktlänkar till
      // fraktbolagen, i stället för ett fel. Kunden ska aldrig vara fast i en
      // tom vy.
      if (res.status === 202 || json.pending) {
        setVantar({
          nummer: json.trackingNumber || clean,
          transportor: json.transportor,
          lankar: json.fallbackLinks ?? [],
        });
        setLoading(false);
        return;
      }
      if (json.error || json.message) { setErr(json.error || json.message || "Något gick fel."); setLoading(false); return; }
      setData(json);
    } catch {
      setErr("Anslutningen till spårningen fungerade inte. Försök igen om en stund.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-läs ?tn= (eller ?order= för bakåtkompatibilitet) från URL så länkar
  // från Velo-mejlbekräftelser fungerar direkt utan att kunden måste skriva.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get("tn") || params.get("order");
    if (auto) { setTn(auto.toUpperCase()); void track(auto); }
  }, [track]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void track(tn);
  }

  // ——— rendering ———
  const status = data?.status || "";
  const delivered = !!data?.delivered || status === "Delivered";
  const isException = status === "Exception" || status === "Expired"
    || status === "DeliveryFailure" || status === "Undelivered";
  const carrier = data?.carrier || "Fyndplats Frakt";
  // Nyast först (som 17track) → den aktiva markören (.ev.first) hamnar på
  // NUVARANDE steg överst, inte på äldsta "Registrerad".
  const events = orderEventsNewestFirst(data?.events || []).map((ev) => ({
    time: fmtTime(pick(ev as Record<string, unknown>, "time", "time_iso", "time_raw", "date")),
    status: pick(ev as Record<string, unknown>, "status", "stage") || "",
    place: pick(ev as Record<string, unknown>, "location", "place", "address") || "",
    desc: pick(ev as Record<string, unknown>, "description", "desc", "sub_status") || "",
  }));
  const stage = computeStage(status, events.length, delivered);
  const finalStage = stage;
  // Rutan om sista ledet: vem som delar ut i Sverige, deras nummer när det är
  // ett annat än vårt, och en knapp till deras spårning (ombudets adress och
  // öppettider, eller bokningen av leveransdagen).
  const led = data?.sistaLedInfo
    ? sistaLedRuta(data.sistaLedInfo, {
        transportor: carrier,
        status,
        levererad: delivered,
        iSverige: harKommitTillSverige(events.map((ev) => ev.place)),
      })
    : null;

  return (
    <div className="track">
      <form className="track-form" onSubmit={onSubmit}>
        <input
          value={tn}
          onChange={(e) => setTn(e.target.value)}
          placeholder="T.ex. AB123456789SE"
          aria-label="Spårningsnummer"
          autoComplete="off"
          inputMode="text"
        />
        <button className="buy" type="submit" disabled={loading}>{loading ? "Söker…" : "Spåra paket →"}</button>
      </form>
      <p className="track-hint">Numret hittar du i leveransbekräftelsen vi mejlade dig när paketet skickades.</p>
      {err && <p className="track-err">{err}</p>}
      {vantar && (
        <div className="track-result">
          <div className="track-top">
            <div>
              <div className="track-label">Spårningsnummer</div>
              <div className="track-tn">{vantar.nummer}</div>
            </div>
            <span className="track-badge transit">
              {vantar.transportor ? `Registrerat hos ${vantar.transportor}` : "Registrerat"}
            </span>
          </div>

          <div className="track-eta">
            Paketet är registrerat{vantar.transportor && <> hos <b>{vantar.transportor}</b></>}. Den första
            skanningen brukar synas här inom ett dygn efter att paketet skickats.
          </div>

          <Steg stage={0} delivered={false} />

          {vantar.lankar.length > 0 && (
            <div className="track-knappar">
              {!vantar.transportor && <p>Du kan också söka direkt hos fraktbolaget:</p>}
              {vantar.lankar.map((l) => (
                <a key={l.name} className="track-led-btn" href={l.url} target="_blank" rel="noopener noreferrer">
                  {vantar.transportor ? `Följ paketet hos ${l.name}` : l.name} →
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {data && !err && (
        <div className="track-result">
          <div className="track-top">
            <div>
              <div className="track-label">Spårningsnummer</div>
              <div className="track-tn">{data.trackingNumber || tn}</div>
            </div>
            <span className={`track-badge ${delivered ? "done" : isException ? "warn" : "transit"}`}>
              {delivered ? "Levererad" : isException ? "Behöver kollas" : "På väg till dig"}
            </span>
          </div>

          <div className="track-eta">
            {delivered ? (
              <>Ditt paket är <b>levererat</b>. Tack för att du handlar hos Fyndplats.</>
            ) : isException ? (
              <>Spårningen är pausad. Vi följer paketet – hör av dig till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> om du undrar.</>
            ) : (
              <>Beräknad leverans: <b>{data.eta || DELIVERY_TIME}</b></>
            )}
          </div>

          <Steg stage={finalStage} delivered={delivered} />

          {led && (
            <div className="track-led">
              <div className="track-led-h">{led.rubrik}</div>
              <p>{led.text}</p>
              {led.nummer && (
                <p className="track-led-nr">
                  Hos {led.namn} heter paketet <b>{led.nummer}</b>
                </p>
              )}
              {led.knapp && (
                <a className="track-led-btn" href={led.knapp.href} target="_blank" rel="noopener noreferrer">
                  {led.knapp.text} →
                </a>
              )}
            </div>
          )}

          <h3 className="track-h">Spårningshistorik</h3>
          <div className="track-sub">
            Levereras med {transportorRad(carrier, data.sistaLed)}
            {/* Senast uppdaterad = nyaste händelsens tid — visar kunden att
                spårningen lever även när stegen står stilla en dag. */}
            {(data.updatedAt || events[0]?.time) && (
              <> · Uppdaterad {fmtTime(data.updatedAt) || events[0]?.time}</>
            )}
          </div>
          {events.length === 0 ? (
            <p className="track-empty">Vi väntar på första skanningen från fraktbolaget. Det kommer normalt inom 1–2 dagar efter att paketet skickats.</p>
          ) : (
            <div className="timeline">
              {events.map((ev, i) => (
                <div className={`ev ${i === 0 ? "first" : ""}`} key={i}>
                  {ev.time && <div className="et">{ev.time}</div>}
                  {ev.status && <div className="es">{ev.status}</div>}
                  {ev.desc && <div className="ed">{ev.desc}</div>}
                  {ev.place && <div className="ep">{ev.place}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
