"use client";
import { useState } from "react";

export function ContactForm() {
  const [f, setF] = useState({ fornamn: "", efternamn: "", epost: "", meddelande: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `Förfrågan från ${f.fornamn} ${f.efternamn}`;
    const body = `${f.meddelande}\n\nFrån: ${f.fornamn} ${f.efternamn}\nE-post: ${f.epost}`;
    window.location.href = `mailto:info@fyndplats.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className="cform" onSubmit={submit}>
      <div className="row">
        <label>Förnamn<input required value={f.fornamn} onChange={set("fornamn")} /></label>
        <label>Efternamn<input required value={f.efternamn} onChange={set("efternamn")} /></label>
      </div>
      <label>E-post<input type="email" required value={f.epost} onChange={set("epost")} /></label>
      <label>Meddelande<textarea rows={5} required value={f.meddelande} onChange={set("meddelande")} /></label>
      <button className="buy" type="submit">Skicka meddelande</button>
    </form>
  );
}
