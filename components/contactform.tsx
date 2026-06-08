"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [f, setF] = useState({ fornamn: "", efternamn: "", epost: "", meddelande: "", hp: "" });
  const [status, setStatus] = useState<Status>("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("send_failed");
      setStatus("sent");
      setF({ fornamn: "", efternamn: "", epost: "", meddelande: "", hp: "" });
    } catch {
      setStatus("error");
    } finally {
      clearTimeout(t);
    }
  }

  if (status === "sent") {
    return (
      <div className="callout" role="status" aria-live="polite">
        <p><strong>Tack för ditt meddelande!</strong> Vi har tagit emot det och återkommer normalt inom 24 timmar (vardagar 09–17).</p>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={submit}>
      <div className="row">
        <label>Förnamn<input required value={f.fornamn} onChange={set("fornamn")} /></label>
        <label>Efternamn<input required value={f.efternamn} onChange={set("efternamn")} /></label>
      </div>
      <label>E-post<input type="email" required value={f.epost} onChange={set("epost")} /></label>
      <label>Meddelande<textarea rows={5} required value={f.meddelande} onChange={set("meddelande")} /></label>

      {/* Honeypot — dolt för människor, fylls av bottar. Icke-semantiskt namn +
          autoComplete="off" så att webbläsar-/lösenordshanterar-autofyll inte
          råkar fylla det åt en riktig kund (skulle annars tappa meddelandet). */}
      <input
        type="text"
        name="hp_field"
        tabIndex={-1}
        autoComplete="off"
        value={f.hp}
        onChange={set("hp")}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <button className="buy" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Skickar…" : "Skicka meddelande"}
      </button>

      {status === "error" && (
        <p role="alert" style={{ color: "#C2410C", marginTop: 10 }}>
          Något gick fel när meddelandet skulle skickas. Försök igen, eller mejla oss direkt på{" "}
          <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.
        </p>
      )}
    </form>
  );
}
