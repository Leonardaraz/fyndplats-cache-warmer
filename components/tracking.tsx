"use client";
import { useState } from "react";

const STAGES = ["Beställd", "Packad", "Skickad", "På väg", "Levererad"];

type Event = { time: string; status: string; place: string; desc: string };
type Shipment = { tn: string; stage: number; delivered: boolean; eta: string | null; events: Event[] };

function demoShipment(tn: string): Shipment {
  let h = 0;
  for (const c of tn) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const stage = 3 + (h % 2); // 3 = på väg, 4 = levererad
  const delivered = stage === 4;
  const events: Event[] = [
    { time: "12 maj, 14:22", status: "Beställning mottagen", place: "Fyndplats", desc: "Vi har tagit emot din beställning och förbereder den." },
    { time: "13 maj, 09:10", status: "Packad", place: "Fyndplats Frakt", desc: "Din order är packad och klar för transport." },
    { time: "14 maj, 18:40", status: "Skickad", place: "Fyndplats Frakt", desc: "Paketet har lämnat vårt lager." },
    { time: "20 maj, 07:05", status: "På väg", place: "Fyndplats Frakt", desc: "Paketet är på väg mot dig." },
    { time: "26 maj, 11:30", status: "Anlänt till anläggning", place: "Sorteringscenter, Stockholm", desc: "Paketet hanteras för lokal utlämning." },
  ];
  if (delivered) events.push({ time: "27 maj, 13:18", status: "Levererad", place: "Stockholm", desc: "Paketet har levererats. Tack för att du handlar hos Fyndplats!" });
  return { tn: tn.toUpperCase(), stage, delivered, eta: delivered ? null : "5–15 arbetsdagar", events };
}

export function TrackingWidget() {
  const [tn, setTn] = useState("");
  const [ship, setShip] = useState<Shipment | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function track(e: React.FormEvent) {
    e.preventDefault();
    const t = tn.replace(/\s+/g, "").toUpperCase();
    setTn(t);
    setErr("");
    if (t.length < 5) { setErr("Skriv in ett giltigt spårningsnummer."); setShip(null); return; }
    setLoading(true);
    setTimeout(() => { setShip(demoShipment(t)); setLoading(false); }, 500);
  }

  return (
    <div className="track">
      <form className="track-form" onSubmit={track}>
        <input value={tn} onChange={(e) => setTn(e.target.value)} placeholder="T.ex. FP123456789SE" aria-label="Spårningsnummer" autoComplete="off" />
        <button className="buy" type="submit" disabled={loading}>{loading ? "Söker…" : "Spåra paket →"}</button>
      </form>
      <p className="track-hint">Numret hittar du i leveransbekräftelsen vi mejlade dig.</p>
      {err && <p className="track-err">{err}</p>}

      {ship && (
        <div className="track-result">
          <div className="track-top">
            <div><div className="track-label">Spårningsnummer</div><div className="track-tn">{ship.tn}</div></div>
            <span className={`track-badge ${ship.delivered ? "done" : "transit"}`}>{ship.delivered ? "Levererad" : "På väg till dig"}</span>
          </div>
          <div className="track-eta">{ship.delivered ? <>Ditt paket är <b>levererat</b>. 🎉</> : <>Beräknad leverans: <b>{ship.eta}</b></>}</div>

          <div className="steps">
            {STAGES.map((label, i) => {
              const on = i <= ship.stage;
              const current = i === ship.stage && !ship.delivered;
              return (
                <div className={`step ${on ? "on" : ""} ${current ? "current" : ""} ${ship.delivered ? "done-all" : ""}`} key={label}>
                  <div className="dot">{i < ship.stage || ship.delivered ? "✓" : ""}</div>
                  <div className="slbl">{label}</div>
                </div>
              );
            })}
          </div>

          <h3 className="track-h">Spårningshistorik</h3>
          <div className="track-sub">🚚 Levereras med Fyndplats Frakt</div>
          <div className="timeline">
            {[...ship.events].reverse().map((ev, i) => (
              <div className={`ev ${i === 0 ? "first" : ""}`} key={i}>
                <div className="et">{ev.time}</div>
                <div className="es">{ev.status}</div>
                <div className="ed">{ev.desc}</div>
                <div className="ep">📍 {ev.place}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
