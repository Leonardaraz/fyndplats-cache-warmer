"use client";
import { useCallback, useEffect, useState } from "react";

// Hämtar live spårningsdata från Velo-backenden på fyndplats.se.
// Endpointen är CORS-enabled (krävdes för HTML Embed-iframen på gamla sidan)
// så vi kan fetch:a direkt från browsern utan Next.js-proxy.
//
// API:t förväntar query-param `?tn=<trackingNumber>` (verifierat live —
// {"error":"tn (trackingNumber) krävs"} om man skickar fel param).
//
// All anonymisering av carrier + CN/HK/TW/SG/MY-events sker server-side i
// wix-velo/backend/tracking.js → filterEvents(). Vi RENDERAR bara det vi får.
const TRACK_API = "https://www.fyndplats.se/_functions/track";

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
  trackingNumber?: string;
  orderId?: string;
  updatedAt?: string;
  error?: string;
  message?: string;
};

function fmtTime(s?: string): string {
  if (!s) return "";
  // Om det redan är formaterad svenska ("12 maj, 14:22") — använd som-är
  if (/[a-zåäö]/i.test(s) && !/T\d/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function pick<T = string>(o: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) if (o[k] != null && o[k] !== "") return o[k] as T;
  return undefined;
}

export function TrackingWidget() {
  const [tn, setTn] = useState("");
  const [data, setData] = useState<TrackResp | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const track = useCallback(async (id: string) => {
    const clean = id.replace(/\s+/g, "").replace(/^#/, "").toUpperCase();
    if (clean.length < 5) { setErr("Skriv in ditt spårningsnummer."); setData(null); return; }
    setErr(""); setLoading(true); setData(null);
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
  const isException = status === "Exception" || status === "Expired" || status === "Undelivered";
  const carrier = data?.carrier || "Fyndplats Frakt";
  const events = (data?.events || []).map((ev) => ({
    time: fmtTime(pick(ev as Record<string, unknown>, "time", "time_iso", "time_raw", "date")),
    status: pick(ev as Record<string, unknown>, "status", "stage") || "",
    place: pick(ev as Record<string, unknown>, "location", "place", "address") || "",
    desc: pick(ev as Record<string, unknown>, "description", "desc", "sub_status") || "",
  }));
  const stage = computeStage(status, events.length, delivered);
  const finalStage = stage;

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
              <>Ditt paket är <b>levererat</b>. 🎉 Tack för att du handlar hos Fyndplats!</>
            ) : isException ? (
              <>Spårningen är pausad. Vi följer paketet – hör av dig till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> om du undrar.</>
            ) : (
              <>Beräknad leverans: <b>{data.eta || "5–15 arbetsdagar"}</b></>
            )}
          </div>

          <div className="steps">
            {STAGES.map((label, i) => {
              const on = i <= finalStage;
              const current = i === finalStage && !delivered;
              return (
                <div className={`step ${on ? "on" : ""} ${current ? "current" : ""} ${delivered ? "done-all" : ""}`} key={label}>
                  <div className="dot">{i < finalStage || delivered ? "✓" : ""}</div>
                  <div className="slbl">{label}</div>
                </div>
              );
            })}
          </div>

          <h3 className="track-h">Spårningshistorik</h3>
          <div className="track-sub">🚚 Levereras med {carrier}</div>
          {events.length === 0 ? (
            <p className="track-empty">Vi väntar på första skanningen från fraktbolaget. Det kommer normalt inom 1–2 dagar efter att paketet skickats.</p>
          ) : (
            <div className="timeline">
              {[...events].reverse().map((ev, i) => (
                <div className={`ev ${i === 0 ? "first" : ""}`} key={i}>
                  {ev.time && <div className="et">{ev.time}</div>}
                  {ev.status && <div className="es">{ev.status}</div>}
                  {ev.desc && <div className="ed">{ev.desc}</div>}
                  {ev.place && <div className="ep">📍 {ev.place}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
