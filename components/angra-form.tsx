"use client";

// Ångerfunktion ("ångra köp") — klientformuläret enligt distansavtalslagen.
// Steg: (1) ange e-post + ordernummer → hämta ordern, (2) välj vilka artiklar +
// antal (eller skriv in manuellt om ordern inte hittas), (3) skicka → kvitto.
//
// Designprinciper enligt lagen: lika lätt att ångra som att köpa (inga hinder),
// anledning är FRIVILLIG, och en manuell väg finns alltid så att en kund som inte
// hittar sitt ordernummer ändå kan utöva sin rätt. Reklamation (trasig/fel vara)
// pekas vidare till rätt väg eftersom Fyndplats då står för returfrakten.

import { useState } from "react";

type FetchedItem = { name: string; qty: number; lineMinor?: number; image?: string };

type Row = {
  name: string;
  orderedQty: number;
  qty: number;
  selected: boolean;
  lineMinor?: number;
  image?: string;
};

function kr(minor?: number): string | null {
  if (!minor || minor <= 0) return null;
  return `${(minor / 100).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kr`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AngraForm() {
  const [phase, setPhase] = useState<"form" | "done">("form");

  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [hp, setHp] = useState(""); // honeypot

  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "notfound" | "error">("idle");
  const [rows, setRows] = useState<Row[]>([]);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState("");
  const [doneEmail, setDoneEmail] = useState("");

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Ange en giltig e-postadress.");
      return;
    }
    if (!orderNumber.trim()) {
      setError("Ange ditt ordernummer (står i din orderbekräftelse).");
      return;
    }
    setLookup("loading");
    try {
      const res = await fetch("/api/angra/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const data = (await res.json()) as { found?: boolean; items?: FetchedItem[] };
      if (data.found && data.items && data.items.length) {
        setRows(
          data.items.map((it) => ({
            name: it.name,
            orderedQty: it.qty,
            qty: it.qty,
            selected: true,
            lineMinor: it.lineMinor,
            image: it.image,
          })),
        );
        setManual(false);
        setLookup("found");
      } else {
        setLookup("notfound");
      }
    } catch {
      setLookup("error");
    }
  }

  function setRowQty(i: number, q: number) {
    setRows((prev) =>
      prev.map((r, j) => (j === i ? { ...r, qty: Math.max(1, Math.min(r.orderedQty, q)) } : r)),
    );
  }
  function toggleRow(i: number) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, selected: !r.selected } : r)));
  }
  function setAll(sel: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected: sel })));
  }

  function enableManual() {
    setManual(true);
    setLookup("idle");
    setRows([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let items: { name: string; qty: number }[] = [];
    if (manual) {
      items = manualText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 50)
        .map((name) => ({ name, qty: 1 }));
    } else {
      items = rows.filter((r) => r.selected).map((r) => ({ name: r.name, qty: r.qty }));
      if (items.length === 0) {
        setError("Välj minst en artikel att ångra.");
        return;
      }
    }
    if (manual && items.length === 0 && !orderNumber.trim()) {
      setError("Skriv vilka varor du vill ångra, eller ange ditt ordernummer.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/angra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          orderNumber: orderNumber.trim(),
          items,
          reason: reason.trim() || undefined,
          hp,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; caseId?: string; error?: string };
      if (res.ok && data.ok) {
        setCaseId(data.caseId || "");
        setDoneEmail(email.trim());
        setPhase("done");
      } else {
        setError(data.error || "Något gick fel. Försök igen eller mejla info@fyndplats.com.");
      }
    } catch {
      setError("Anslutningen fungerade inte. Försök igen eller mejla info@fyndplats.com.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Bekräftelse ────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="angra-card angra-done">
        <div className="angra-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2>Tack — vi har tagit emot din ångeranmälan</h2>
        {caseId && (
          <p className="angra-case">
            Ärendenummer: <strong>{caseId}</strong>
          </p>
        )}
        <p>
          Ett <strong>mottagningskvitto</strong> är på väg till <strong>{doneEmail}</strong> med
          returadress och nästa steg. Kvittot bekräftar att vi tagit emot din ångran — vi
          behandlar ärendet och återkommer.
        </p>
        <p className="angra-muted">
          Hittar du inte mejlet? Kolla skräpposten, eller mejla{" "}
          <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med ärendenumret.
        </p>
      </div>
    );
  }

  // ── Formulär ───────────────────────────────────────────────────────────────
  return (
    <div className="angra-card">
      {/* Steg 1: identifiera ordern */}
      <form onSubmit={lookup === "found" || manual ? onSubmit : onLookup} noValidate>
        <div className="angra-fields">
          <label className="angra-field">
            <span>E-postadress</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="din@epost.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="angra-field">
            <span>Ordernummer</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="t.ex. 10042"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </label>
        </div>

        {/* Honeypot — dolt för människor, fylls bara av bottar */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          aria-hidden="true"
        />

        {lookup !== "found" && !manual && (
          <>
            <button type="submit" className="btn btn-primary angra-submit" disabled={lookup === "loading"}>
              {lookup === "loading" ? "Hämtar din order…" : "Hämta min order"}
            </button>
            <p className="angra-help">
              <button type="button" className="angra-link" onClick={enableManual}>
                Jag hittar inte mitt ordernummer →
              </button>
            </p>
          </>
        )}

        {lookup === "notfound" && (
          <div className="angra-notice">
            <p>
              Vi hittade ingen order med de uppgifterna. Dubbelkolla ordernumret och e-posten —
              eller fortsätt ändå och skriv in vad du vill ångra.
            </p>
            <button type="button" className="btn btn-ghost angra-ghost" onClick={enableManual}>
              Fortsätt utan order­uppslag →
            </button>
          </div>
        )}

        {lookup === "error" && (
          <div className="angra-notice angra-notice-err">
            <p>Uppslaget fungerade inte just nu. Försök igen, eller fortsätt manuellt nedan.</p>
            <button type="button" className="btn btn-ghost angra-ghost" onClick={enableManual}>
              Fortsätt manuellt →
            </button>
          </div>
        )}

        {/* Steg 2a: valbara artiklar (order hittad) */}
        {lookup === "found" && !manual && (
          <div className="angra-items">
            <div className="angra-items-head">
              <span>Välj vad du vill ångra</span>
              <span className="angra-allrow">
                <button type="button" className="angra-link" onClick={() => setAll(true)}>Markera alla</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="angra-link" onClick={() => setAll(false)}>Avmarkera</button>
              </span>
            </div>
            {rows.map((r, i) => (
              <div className={`angra-item${r.selected ? " is-sel" : ""}`} key={i}>
                <label className="angra-item-main">
                  <input type="checkbox" checked={r.selected} onChange={() => toggleRow(i)} />
                  {r.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="angra-item-img" src={r.image} alt="" loading="lazy" />
                  )}
                  <span className="angra-item-name">
                    {r.name}
                    {kr(r.lineMinor) && <span className="angra-item-price">{kr(r.lineMinor)}</span>}
                  </span>
                </label>
                {r.orderedQty > 1 && (
                  <span className="angra-qty" aria-label="Antal att ångra">
                    <button type="button" onClick={() => setRowQty(i, r.qty - 1)} disabled={!r.selected || r.qty <= 1} aria-label="Minska">−</button>
                    <b>{r.qty}</b>
                    <button type="button" onClick={() => setRowQty(i, r.qty + 1)} disabled={!r.selected || r.qty >= r.orderedQty} aria-label="Öka">+</button>
                    <em>/ {r.orderedQty}</em>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Steg 2b: manuell inmatning */}
        {manual && (
          <div className="angra-items">
            <label className="angra-field">
              <span>Vilka varor vill du ångra?</span>
              <textarea
                rows={3}
                placeholder="Skriv en vara per rad, t.ex.&#10;Duschstol med ryggstöd&#10;Konstgjort träd 91 cm"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </label>
            <p className="angra-muted">Skriv en vara per rad. Vet du inte exakt namn räcker en kort beskrivning.</p>
          </div>
        )}

        {/* Anledning (frivillig) + skicka */}
        {(lookup === "found" || manual) && (
          <>
            <label className="angra-field angra-reason">
              <span>Anledning <em>(frivilligt)</em></span>
              <textarea
                rows={2}
                placeholder="Du behöver inte ange något skäl för att ångra ditt köp."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn-primary angra-submit" disabled={submitting}>
              {submitting ? "Skickar…" : "Skicka ångeranmälan"}
            </button>
          </>
        )}

        {error && <p className="angra-error" role="alert">{error}</p>}
      </form>

      {/* Reklamation pekas vidare — då står Fyndplats för returfrakten */}
      <div className="angra-reklam">
        <strong>Är varan trasig eller felaktig?</strong> Då är det en{" "}
        <a href="/returer">reklamation</a>, inte en ångran — och då står{" "}
        <strong>Fyndplats för returfrakten</strong>. Mejla{" "}
        <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med foto på felet, så löser vi det.
      </div>
    </div>
  );
}
