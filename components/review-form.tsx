"use client";

// Omdömesformuläret. En sektion per produkt i ordern — kunden kan svara på en
// och strunta i resten.
//
// Stjärnorna är radioknappar under ytan, inte klickbara <div>:ar: en kund som
// navigerar med tangentbord eller skärmläsare ska kunna sätta betyg utan mus.

import { useState } from "react";

interface Vara {
  productId: string;
  name: string;
  imageUrl?: string;
  variant?: string;
}

type Läge = { typ: "vilar" } | { typ: "skickar" } | { typ: "klar" } | { typ: "fel"; text: string };

function Stjärnval({
  värde,
  onChange,
  namn,
}: {
  värde: number;
  onChange: (n: number) => void;
  namn: string;
}) {
  return (
    <fieldset className="rf-stars" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="rf-legend">Ditt betyg</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={`rf-star ${n <= värde ? "rf-star-on" : ""}`}>
          <input
            type="radio"
            name={namn}
            value={n}
            checked={värde === n}
            onChange={() => onChange(n)}
          />
          <span aria-hidden="true">★</span>
          <span className="rf-sr">{n} av 5 stjärnor</span>
        </label>
      ))}
    </fieldset>
  );
}

function ProduktBlock({ token, vara }: { token: string; vara: Vara }) {
  const [betyg, setBetyg] = useState(0);
  const [text, setText] = useState("");
  const [namn, setNamn] = useState("");
  const [läge, setLäge] = useState<Läge>({ typ: "vilar" });

  async function skicka(e: React.FormEvent) {
    e.preventDefault();
    setLäge({ typ: "skickar" });
    try {
      const res = await fetch("/api/omdome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, productId: vara.productId, rating: betyg, text, name: namn }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setLäge({ typ: "fel", text: data.error || "Något gick fel. Försök igen." });
        return;
      }
      setLäge({ typ: "klar" });
    } catch {
      setLäge({ typ: "fel", text: "Kunde inte skicka just nu. Försök igen om en stund." });
    }
  }

  if (läge.typ === "klar") {
    return (
      <div className="rf-card rf-done">
        <strong>Tack!</strong>
        <p style={{ margin: "6px 0 0 0" }}>
          Ditt omdöme om <em>{vara.name}</em> är mottaget. Vi läser igenom det innan det
          publiceras på produktsidan.
        </p>
      </div>
    );
  }

  return (
    <form className="rf-card" onSubmit={skicka}>
      <div className="rf-head">
        {vara.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rf-img" src={vara.imageUrl} alt="" />
        ) : null}
        <div>
          <div className="rf-name">{vara.name}</div>
          {vara.variant ? <div className="rf-variant">{vara.variant}</div> : null}
        </div>
      </div>

      <Stjärnval värde={betyg} onChange={setBetyg} namn={`betyg-${vara.productId}`} />

      <label className="rf-label" htmlFor={`text-${vara.productId}`}>
        Vad tyckte du?
      </label>
      <textarea
        id={`text-${vara.productId}`}
        className="rf-textarea"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hur fungerar den? Var den som du förväntade dig? Något andra bör veta?"
        maxLength={2000}
      />

      <label className="rf-label" htmlFor={`namn-${vara.productId}`}>
        Ditt namn <span className="rf-hint">(frivilligt – vi visar bara initialer)</span>
      </label>
      <input
        id={`namn-${vara.productId}`}
        className="rf-input"
        value={namn}
        onChange={(e) => setNamn(e.target.value)}
        maxLength={60}
        autoComplete="name"
      />

      {läge.typ === "fel" ? (
        <p className="rf-error" role="alert">
          {läge.text}
        </p>
      ) : null}

      <button className="rf-submit" type="submit" disabled={läge.typ === "skickar"}>
        {läge.typ === "skickar" ? "Skickar …" : "Skicka omdöme"}
      </button>
    </form>
  );
}

export function ReviewForm({ token, varor }: { token: string; varor: Vara[] }) {
  return (
    <div className="rf-list">
      {varor.map((v) => (
        <ProduktBlock key={v.productId} token={token} vara={v} />
      ))}
    </div>
  );
}
