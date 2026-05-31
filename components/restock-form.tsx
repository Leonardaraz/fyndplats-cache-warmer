"use client";
import { useState } from "react";

// "Meddela mig när varan är tillbaka i lager" (Feature 1 — hybrid slut-i-lager).
// Postar { productId, email } till cache-warmer-appens publika endpoint
// /api/restock-subscribe. När AliExpress-syncen ser produkten tillbaka i lager
// mejlas alla bevakare automatiskt.
//
// Endpoint-URL via NEXT_PUBLIC_RESTOCK_API (default: prod-appen).

const ENDPOINT =
  process.env.NEXT_PUBLIC_RESTOCK_API ||
  "https://fyndplats-cache-warmer.vercel.app/api/restock-subscribe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RestockForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setState("error");
      setMessage("Ange en giltig e-postadress.");
      return;
    }
    setState("loading");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: email.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { ok?: boolean; status?: string };
      if (!data.ok) throw new Error("not ok");
      setState("done");
      setMessage(
        data.status === "already_subscribed"
          ? "Du bevakar redan den här varan – vi hör av oss!"
          : "Klart! Vi mejlar dig så fort varan är tillbaka.",
      );
    } catch {
      setState("error");
      setMessage("Något gick fel. Försök igen om en stund.");
    }
  };

  if (state === "done") {
    return (
      <div className="restock-box restock-done" role="status">
        ✓ {message}
      </div>
    );
  }

  return (
    <form className="restock-box" onSubmit={onSubmit}>
      <label className="restock-label" htmlFor="restock-email">
        Meddela mig när varan är tillbaka i lager
      </label>
      <div className="restock-row">
        <input
          id="restock-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="din@epost.se"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "loading"}
          required
          className="restock-input"
        />
        <button type="submit" className="buy restock-btn" disabled={state === "loading"}>
          {state === "loading" ? "Skickar…" : "Bevaka"}
        </button>
      </div>
      {state === "error" && (
        <div className="restock-error" role="alert">
          {message}
        </div>
      )}
    </form>
  );
}
