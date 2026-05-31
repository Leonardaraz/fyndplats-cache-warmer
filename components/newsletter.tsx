"use client";
import { useState } from "react";

// Nyhetsbrevs-block med ÄKTA e-postfält + GDPR-samtycke. Postar till
// /api/newsletter-signup som (1) sparar prenumeranten och (2) skickar ett
// bekräftelsemejl via Resend. Ersätter det gamla orange blocket som lovade
// nyhetsbrev men bara länkade till butiken (granskningens "least premium block").
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState("error"); setMsg("Ange en giltig e-postadress."); return;
    }
    if (!consent) {
      setState("error"); setMsg("Du behöver godkänna villkoren för att prenumerera."); return;
    }
    setState("loading"); setMsg("");
    try {
      const res = await fetch("/api/newsletter-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, consent: true, source: "home" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "fel");
      setState("done");
      setMsg(data.already ? "Du är redan med på listan — välkommen tillbaka!" : "Tack! Kolla din inkorg för en bekräftelse.");
    } catch {
      setState("error");
      setMsg("Något gick fel. Försök igen om en stund.");
    }
  };

  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="bandwrap">
        <div className="nl">
          <div className="nl-eyebrow">─ Nyhetsbrev</div>
          <h2>Bli först att fynda nyheterna</h2>
          <p className="nl-sub">Få våra bästa fynd och erbjudanden direkt i inkorgen – varje vecka. Ingen spam, avregistrera när du vill.</p>

          {state === "done" ? (
            <div className="nl-done" role="status">
              <span className="nl-done-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <p>{msg}</p>
            </div>
          ) : (
            <form className="nl-form" onSubmit={onSubmit} noValidate>
              <div className="nl-row">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                  placeholder="Din e-postadress"
                  aria-label="Din e-postadress"
                  autoComplete="email"
                  className="nl-input"
                  required
                />
                <button type="submit" className="nl-btn" disabled={state === "loading"}>
                  {state === "loading" ? "Skickar…" : "Prenumerera →"}
                </button>
              </div>
              <label className="nl-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => { setConsent(e.target.checked); if (state === "error") setState("idle"); }}
                />
                <span>Jag godkänner att Fyndplats sparar min e-postadress för marknadsföring (kan avregistreras när som helst).</span>
              </label>
              {state === "error" && <p className="nl-err" role="alert">{msg}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
